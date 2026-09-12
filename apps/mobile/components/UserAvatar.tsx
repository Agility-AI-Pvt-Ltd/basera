import { useEffect, useState } from 'react';
import { ImageSourcePropType } from 'react-native';

import { CircularImage } from '@/components/CircularImage';
import { HOME_IMAGES } from '@/constants/home';
import { getPetMediaUrl } from '@/lib/petStorage';

type UserAvatarProps = {
  photoUri?: string | null;
  size?: number;
};

export function UserAvatar({ photoUri, size = 44 }: UserAvatarProps) {
  const [source, setSource] = useState<ImageSourcePropType>(HOME_IMAGES.avatar);

  useEffect(() => {
    if (!photoUri) {
      setSource(HOME_IMAGES.avatar);
      return;
    }
    if (photoUri.startsWith('http://') || photoUri.startsWith('https://') || photoUri.startsWith('file://')) {
      setSource({ uri: photoUri });
      return;
    }
    void getPetMediaUrl(photoUri).then((url) => {
      setSource(url ? { uri: url } : HOME_IMAGES.avatar);
    });
  }, [photoUri]);

  return <CircularImage source={source} size={size} />;
}
