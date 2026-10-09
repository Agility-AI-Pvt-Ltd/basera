import type { ImageSourcePropType } from 'react-native';

import { HOME_IMAGES } from '@/constants/home';
import type { CommunityPack } from '@/types/community';

const PACK_COVERS: ImageSourcePropType[] = [
  HOME_IMAGES.pets.goldenRetriever,
  HOME_IMAGES.pets.beagle,
  HOME_IMAGES.pets.labrador,
  HOME_IMAGES.categories.cats,
  HOME_IMAGES.categories.birds,
  HOME_IMAGES.pets.husky,
];

export function packCoverSource(pack: CommunityPack): ImageSourcePropType {
  let hash = 0;
  for (let i = 0; i < pack.id.length; i += 1) {
    hash = (hash + pack.id.charCodeAt(i)) % PACK_COVERS.length;
  }
  return PACK_COVERS[hash] ?? PACK_COVERS[0];
}

export function formatDistanceShort(km: number | null | undefined): string {
  if (km == null || Number.isNaN(km)) return 'Nearby';
  if (km < 1) return `${Math.round(km * 10) / 10} km`;
  return `${Math.round(km * 10) / 10} km`;
}
