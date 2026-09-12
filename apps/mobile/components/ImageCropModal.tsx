import * as ImageManipulator from 'expo-image-manipulator';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';

const BRAND = '#7C3AED';
const OUTPUT_SIZE = 720;

type ImageCropModalProps = {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onCropped: (result: { uri: string; mimeType: string; fileName: string }) => void;
};

export function ImageCropModal({ visible, imageUri, onCancel, onCropped }: ImageCropModalProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const cropSize = Math.min(windowWidth - 48, 320);

  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!visible || !imageUri) return;
    setNaturalSize(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setError('');
    Image.getSize(
      imageUri,
      (width, height) => setNaturalSize({ width, height }),
      () => setError('Could not load image dimensions'),
    );
  }, [visible, imageUri]);

  const baseScale = useMemo(() => {
    if (!naturalSize) return 1;
    return Math.max(cropSize / naturalSize.width, cropSize / naturalSize.height);
  }, [naturalSize, cropSize]);

  const displayScale = baseScale * scale;
  const displayWidth = (naturalSize?.width ?? cropSize) * displayScale;
  const displayHeight = (naturalSize?.height ?? cropSize) * displayScale;

  const clampOffset = (x: number, y: number, nextScale = scale) => {
    if (!naturalSize) return { x: 0, y: 0 };
    const w = naturalSize.width * baseScale * nextScale;
    const h = naturalSize.height * baseScale * nextScale;
    const maxX = Math.max(0, (w - cropSize) / 2);
    const maxY = Math.max(0, (h - cropSize) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStart.current = offset;
        },
        onPanResponderMove: (_evt, gesture) => {
          setOffset(clampOffset(dragStart.current.x + gesture.dx, dragStart.current.y + gesture.dy));
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offset, naturalSize, baseScale, scale, cropSize],
  );

  const changeScale = (delta: number) => {
    setScale((prev) => {
      const next = Math.min(3, Math.max(1, Number((prev + delta).toFixed(2))));
      setOffset((current) => clampOffset(current.x, current.y, next));
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!imageUri || !naturalSize) return;
    setSaving(true);
    setError('');
    try {
      const originX = (displayWidth - cropSize) / 2 - offset.x;
      const originY = (displayHeight - cropSize) / 2 - offset.y;
      const crop = {
        originX: Math.max(0, Math.round(originX / displayScale)),
        originY: Math.max(0, Math.round(originY / displayScale)),
        width: Math.min(naturalSize.width, Math.round(cropSize / displayScale)),
        height: Math.min(naturalSize.height, Math.round(cropSize / displayScale)),
      };

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop }, { resize: { width: OUTPUT_SIZE, height: OUTPUT_SIZE } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );

      onCropped({
        uri: result.uri,
        mimeType: 'image/jpeg',
        fileName: `avatar-${Date.now()}.jpg`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not crop image');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>Adjust photo</Text>
        <Text style={styles.subtitle}>Drag to choose which part appears in the profile circle</Text>

        <View style={[styles.cropFrame, { width: cropSize, height: cropSize }]} {...panResponder.panHandlers}>
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
          <View pointerEvents="none" style={styles.cropRing} />
        </View>

        <View style={styles.zoomRow}>
          <Pressable style={styles.zoomBtn} onPress={() => changeScale(-0.15)}>
            <Text style={styles.zoomText}>−</Text>
          </Pressable>
          <Text style={styles.zoomLabel}>Zoom</Text>
          <Pressable style={styles.zoomBtn} onPress={() => changeScale(0.15)}>
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
            onPress={handleConfirm}
            disabled={saving || !naturalSize}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmText}>Use photo</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    marginBottom: 24,
  },
  cropFrame: {
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
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
  error: { color: '#FCA5A5', marginTop: 12 },
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
