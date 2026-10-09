import * as ImageManipulator from 'expo-image-manipulator';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';

const BRAND = '#7C3AED';
const OUTPUT_SIZE = 720;
const POST_MAX_EDGE = 1600;

export type CropAspect = {
  id: string;
  label: string;
  /** Width / height. `original` uses the photo's own ratio. */
  ratio: number | 'original';
};

export const POST_PHOTO_ASPECTS: CropAspect[] = [
  { id: 'original', label: 'Original', ratio: 'original' },
  { id: 'square', label: '1:1', ratio: 1 },
  { id: 'portrait', label: '4:5', ratio: 4 / 5 },
  { id: 'story', label: '9:16', ratio: 9 / 16 },
  { id: 'landscape', label: '16:9', ratio: 16 / 9 },
];

type ImageCropModalProps = {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onCropped: (result: { uri: string; mimeType: string; fileName: string }) => void;
  /** When set, the frame is rectangular and the user picks a ratio. Profile photos stay square. */
  aspects?: CropAspect[];
  /** Render inside an existing modal instead of opening another one. */
  embedded?: boolean;
};

function touchDistance(event: GestureResponderEvent): number {
  const touches = event.nativeEvent.touches;
  if (touches.length < 2) return 0;
  const [a, b] = touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

export function ImageCropModal({
  visible,
  imageUri,
  onCancel,
  onCropped,
  aspects,
  embedded = false,
}: ImageCropModalProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isPost = Boolean(aspects && aspects.length > 0);

  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [aspectId, setAspectId] = useState(aspects?.[0]?.id ?? 'square');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dragStart = useRef({ x: 0, y: 0 });
  const scaleStart = useRef(1);
  const pinchDist = useRef(0);
  const offsetRef = useRef(offset);
  const scaleRef = useRef(scale);
  offsetRef.current = offset;
  scaleRef.current = scale;

  useEffect(() => {
    if (!visible || !imageUri) return;
    setNaturalSize(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setAspectId(aspects?.[0]?.id ?? 'square');
    setError('');
    Image.getSize(
      imageUri,
      (width, height) => setNaturalSize({ width, height }),
      () => setError('Could not load image dimensions'),
    );
  }, [visible, imageUri, aspects]);

  const selected = aspects?.find((item) => item.id === aspectId) ?? aspects?.[0];
  const ratio = useMemo(() => {
    if (!isPost) return 1;
    if (!selected || selected.ratio === 'original') {
      if (!naturalSize) return 1;
      return naturalSize.width / naturalSize.height;
    }
    return selected.ratio;
  }, [isPost, naturalSize, selected]);

  const frame = useMemo(() => {
    if (!isPost) {
      const size = Math.min(windowWidth - 48, 320);
      return { width: size, height: size };
    }
    const maxW = windowWidth - 32;
    const maxH = Math.max(220, windowHeight - insets.top - insets.bottom - 250);
    let width = maxW;
    let height = width / ratio;
    if (height > maxH) {
      height = maxH;
      width = height * ratio;
    }
    return { width, height };
  }, [insets.bottom, insets.top, isPost, ratio, windowHeight, windowWidth]);

  const baseScale = useMemo(() => {
    if (!naturalSize) return 1;
    return Math.max(frame.width / naturalSize.width, frame.height / naturalSize.height);
  }, [frame.height, frame.width, naturalSize]);

  const metricsRef = useRef({ baseScale, frame, naturalSize });
  metricsRef.current = { baseScale, frame, naturalSize };

  const displayScale = baseScale * scale;
  const displayWidth = (naturalSize?.width ?? frame.width) * displayScale;
  const displayHeight = (naturalSize?.height ?? frame.height) * displayScale;

  const clampOffset = (x: number, y: number, nextScale = scale) => {
    const size = metricsRef.current.naturalSize;
    const box = metricsRef.current.frame;
    const cover = metricsRef.current.baseScale;
    if (!size) return { x: 0, y: 0 };
    const w = size.width * cover * nextScale;
    const h = size.height * cover * nextScale;
    const maxX = Math.max(0, (w - box.width) / 2);
    const maxY = Math.max(0, (h - box.height) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        dragStart.current = offsetRef.current;
        scaleStart.current = scaleRef.current;
        pinchDist.current = touchDistance(event);
      },
      onPanResponderMove: (event, gesture) => {
        if (event.nativeEvent.touches.length >= 2) {
          const dist = touchDistance(event);
          if (pinchDist.current <= 0) {
            pinchDist.current = dist;
            scaleStart.current = scaleRef.current;
            return;
          }
          const next = Math.min(4, Math.max(1, scaleStart.current * (dist / pinchDist.current)));
          setScale(next);
          setOffset(clampOffset(offsetRef.current.x, offsetRef.current.y, next));
          return;
        }
        setOffset(
          clampOffset(dragStart.current.x + gesture.dx, dragStart.current.y + gesture.dy, scaleRef.current),
        );
      },
      onPanResponderRelease: () => {
        pinchDist.current = 0;
      },
    }),
  ).current;

  const changeScale = (delta: number) => {
    setScale((prev) => {
      const next = Math.min(4, Math.max(1, Number((prev + delta).toFixed(2))));
      setOffset((current) => clampOffset(current.x, current.y, next));
      return next;
    });
  };

  const selectAspect = (id: string) => {
    setAspectId(id);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirm = async () => {
    if (!imageUri || !naturalSize) return;
    setSaving(true);
    setError('');
    try {
      const originX = Math.max(0, ((displayWidth - frame.width) / 2 - offset.x) / displayScale);
      const originY = Math.max(0, ((displayHeight - frame.height) / 2 - offset.y) / displayScale);
      let cropW = frame.width / displayScale;
      let cropH = frame.height / displayScale;
      cropW = Math.min(cropW, naturalSize.width - originX);
      cropH = Math.min(cropH, naturalSize.height - originY);
      const crop = {
        originX: Math.round(originX),
        originY: Math.round(originY),
        width: Math.max(1, Math.round(cropW)),
        height: Math.max(1, Math.round(cropH)),
      };

      const actions: ImageManipulator.Action[] = [{ crop }];
      if (isPost) {
        const edge = Math.max(crop.width, crop.height);
        if (edge > POST_MAX_EDGE) {
          const fitted = POST_MAX_EDGE / edge;
          actions.push({
            resize: {
              width: Math.max(1, Math.round(crop.width * fitted)),
              height: Math.max(1, Math.round(crop.height * fitted)),
            },
          });
        }
      } else {
        actions.push({ resize: { width: OUTPUT_SIZE, height: OUTPUT_SIZE } });
      }

      const result = await ImageManipulator.manipulateAsync(imageUri, actions, {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      onCropped({
        uri: result.uri,
        mimeType: 'image/jpeg',
        fileName: `${isPost ? 'post' : 'avatar'}-${Date.now()}.jpg`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not crop image');
    } finally {
      setSaving(false);
    }
  };

  const body = (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.title}>Adjust photo</Text>
      <Text style={styles.subtitle}>
        {isPost
          ? 'Pick a shape, then drag and zoom so the photo fills the frame'
          : 'Drag to choose which part appears in the profile circle'}
      </Text>

      {isPost ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.aspectScroll}
          contentContainerStyle={styles.aspectRow}>
          {aspects?.map((item) => {
            const active = item.id === (selected?.id ?? item.id);
            return (
              <Pressable
                key={item.id}
                style={[styles.aspectChip, active && styles.aspectChipActive]}
                onPress={() => selectAspect(item.id)}>
                <Text style={[styles.aspectText, active && styles.aspectTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View
        style={[
          styles.cropFrame,
          isPost ? styles.cropFrameRect : styles.cropFrameCircle,
          { width: frame.width, height: frame.height },
        ]}
        {...panResponder.panHandlers}>
        {naturalSize && imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{
              width: displayWidth,
              height: displayHeight,
              transform: [{ translateX: offset.x }, { translateY: offset.y }],
            }}
            resizeMode="stretch"
          />
        ) : (
          <ActivityIndicator color={BRAND} />
        )}
        <View pointerEvents="none" style={[styles.cropRing, isPost && styles.cropRingRect]} />
      </View>

      <View style={styles.zoomRow}>
        <Pressable style={styles.zoomBtn} onPress={() => changeScale(-0.15)} accessibilityLabel="Zoom out">
          <Text style={styles.zoomText}>−</Text>
        </Pressable>
        <Text style={styles.zoomLabel}>Zoom</Text>
        <Pressable style={styles.zoomBtn} onPress={() => changeScale(0.15)} accessibilityLabel="Zoom in">
          <Text style={styles.zoomText}>+</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={saving}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.confirmBtn, saving && styles.confirmDisabled]}
          onPress={() => void handleConfirm()}
          disabled={saving || !naturalSize}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmText}>Use photo</Text>
          )}
        </Pressable>
      </View>
    </View>
  );

  if (embedded) return body;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      {body}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '200',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  aspectScroll: {
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'stretch',
    marginBottom: 14,
  },
  aspectRow: {
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  aspectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4B5563',
    backgroundColor: '#1F2937',
    alignSelf: 'center',
  },
  aspectChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#EDE9FE',
  },
  aspectText: { color: '#E5E7EB', fontSize: 13, fontWeight: '700' },
  aspectTextActive: { color: BRAND },
  cropFrame: {
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropFrameCircle: { borderRadius: 999 },
  cropFrameRect: { borderRadius: 16 },
  cropRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cropRingRect: { borderRadius: 16 },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: { color: '#FFFFFF', fontSize: 24, lineHeight: 28 },
  zoomLabel: { color: '#D1D5DB', fontSize: 14 },
  error: { color: '#FCA5A5', marginTop: 12, textAlign: 'center' },
  actions: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: '#E5E7EB', fontSize: 16 },
  confirmBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: { opacity: 0.6 },
  confirmText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 16 },
});
