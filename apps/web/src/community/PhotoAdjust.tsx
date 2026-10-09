import { useEffect, useMemo, useRef, useState } from 'react';

const ASPECTS = [
  { id: 'original', label: 'Original', ratio: null },
  { id: 'square', label: '1:1', ratio: 1 },
  { id: 'portrait', label: '4:5', ratio: 4 / 5 },
  { id: 'story', label: '9:16', ratio: 9 / 16 },
  { id: 'landscape', label: '16:9', ratio: 16 / 9 },
] as const;

const MAX_EDGE = 1600;

type PhotoAdjustProps = {
  file: File;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

export function PhotoAdjust({ file, onCancel, onConfirm }: PhotoAdjustProps) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [aspectId, setAspectId] = useState<(typeof ASPECTS)[number]['id']>('original');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [box, setBox] = useState({ width: 360, height: 420 });

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  useEffect(() => {
    const measure = () => {
      const maxW = Math.min(520, window.innerWidth - 48);
      const maxH = Math.max(220, window.innerHeight - 280);
      setBox({ width: maxW, height: maxH });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const selected = ASPECTS.find((item) => item.id === aspectId) ?? ASPECTS[0];
  const ratio = selected.ratio ?? (natural ? natural.width / natural.height : 1);

  const frame = useMemo(() => {
    let width = box.width;
    let height = width / ratio;
    if (height > box.height) {
      height = box.height;
      width = height * ratio;
    }
    return { width, height };
  }, [box.height, box.width, ratio]);

  const baseScale = natural ? Math.max(frame.width / natural.width, frame.height / natural.height) : 1;
  const displayScale = baseScale * scale;
  const displayWidth = (natural?.width ?? frame.width) * displayScale;
  const displayHeight = (natural?.height ?? frame.height) * displayScale;

  const clampOffset = (x: number, y: number, nextScale = scale) => {
    if (!natural) return { x: 0, y: 0 };
    const w = natural.width * baseScale * nextScale;
    const h = natural.height * baseScale * nextScale;
    const maxX = Math.max(0, (w - frame.width) / 2);
    const maxY = Math.max(0, (h - frame.height) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const changeScale = (delta: number) => {
    setScale((prev) => {
      const next = Math.min(4, Math.max(1, Number((prev + delta).toFixed(2))));
      setOffset((current) => clampOffset(current.x, current.y, next));
      return next;
    });
  };

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      changeScale(event.deltaY < 0 ? 0.08 : -0.08);
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
    // changeScale closes over the latest frame size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseScale, frame.width, frame.height, natural, scale]);

  const selectAspect = (id: (typeof ASPECTS)[number]['id']) => {
    setAspectId(id);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const confirm = async () => {
    if (!natural) return;
    setSaving(true);
    try {
      const originX = Math.max(0, ((displayWidth - frame.width) / 2 - offset.x) / displayScale);
      const originY = Math.max(0, ((displayHeight - frame.height) / 2 - offset.y) / displayScale);
      let cropW = Math.min(frame.width / displayScale, natural.width - originX);
      let cropH = Math.min(frame.height / displayScale, natural.height - originY);
      const edge = Math.max(cropW, cropH);
      const fitted = edge > MAX_EDGE ? MAX_EDGE / edge : 1;
      const outW = Math.max(1, Math.round(cropW * fitted));
      const outH = Math.max(1, Math.round(cropH * fitted));

      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not crop image');
      ctx.drawImage(image, originX, originY, cropW, cropH, 0, 0, outW, outH);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Could not crop image');
      onConfirm(new File([blob], `post-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not crop image');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bc-adjust" role="dialog" aria-modal="true" aria-label="Adjust photo">
      <h3>Adjust photo</h3>
      <p>Pick a shape, then drag and zoom so the photo fills the frame.</p>
      <div className="bc-adjust-aspects">
        {ASPECTS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === aspectId ? 'active' : ''}
            onClick={() => selectAspect(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <div
        ref={frameRef}
        className="bc-adjust-frame"
        style={{ width: frame.width, height: frame.height }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          setOffset(
            clampOffset(
              drag.current.ox + event.clientX - drag.current.x,
              drag.current.oy + event.clientY - drag.current.y,
            ),
          );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}>
        <img
          src={url}
          alt=""
          draggable={false}
          onLoad={(event) => {
            const next = {
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            };
            setNatural((current) => current ?? next);
          }}
          style={
            natural
              ? {
                  width: displayWidth,
                  height: displayHeight,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }
              : { width: 1, height: 1, opacity: 0 }
          }
        />
      </div>
      <div className="bc-adjust-zoom">
        <button type="button" aria-label="Zoom out" onClick={() => changeScale(-0.15)}>
          −
        </button>
        <span>Zoom</span>
        <button type="button" aria-label="Zoom in" onClick={() => changeScale(0.15)}>
          +
        </button>
      </div>
      <div className="bc-adjust-actions">
        <button type="button" className="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" disabled={saving || !natural} onClick={() => void confirm()}>
          {saving ? 'Saving…' : 'Use photo'}
        </button>
      </div>
    </div>
  );
}
