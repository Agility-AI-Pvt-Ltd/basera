import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { getPetMediaUrl } from '@/lib/petStorage';

type PetAvatarProps = {
  name: string;
  photoStorageKey?: string | null;
  size?: number;
};

export function PetAvatar({ name, photoStorageKey, size = 44 }: PetAvatarProps) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!photoStorageKey) {
      setUri(null);
      return;
    }
    void getPetMediaUrl(photoStorageKey).then(setUri);
  }, [photoStorageKey]);

  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[styles.fallback, { width: size, height: size, borderRadius: radius }]}
      accessibilityLabel={name}>
      <Feather name="heart" size={size * 0.45} color="#7C3AED" />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
