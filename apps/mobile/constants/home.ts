import type { ImageSourcePropType } from 'react-native';

import { HOME_IMAGES } from '../assets/images/home/manifest';

export { HOME_IMAGES };

export const BRAND_PURPLE = '#A78BFA';
export const BRAND_PURPLE_DARK = '#7C3AED';

export type Category = {
  id: string;
  label: string;
  image: ImageSourcePropType;
};

export type PetCard = {
  id: string;
  name: string;
  breed: string;
  distance: string;
  image: ImageSourcePropType;
};

export const CATEGORIES: Category[] = [
  { id: 'dogs', label: 'Dogs', image: HOME_IMAGES.categories.dogs },
  { id: 'cats', label: 'Cats', image: HOME_IMAGES.categories.cats },
  { id: 'birds', label: 'Birds', image: HOME_IMAGES.categories.birds },
  { id: 'fishes', label: 'Fishes', image: HOME_IMAGES.categories.fishes },
];

export const FEATURED_PETS: PetCard[] = [
  {
    id: '1',
    name: 'Golden Retriever',
    breed: 'Golden Retriever',
    distance: 'Near 15km',
    image: HOME_IMAGES.pets.goldenRetriever,
  },
  {
    id: '2',
    name: 'Labrador',
    breed: 'Labrador',
    distance: 'Near 8km',
    image: HOME_IMAGES.pets.labrador,
  },
  {
    id: '3',
    name: 'Beagle',
    breed: 'Beagle',
    distance: 'Near 12km',
    image: HOME_IMAGES.pets.beagle,
  },
];

export const SAVED_PETS: PetCard[] = [
  {
    id: 's1',
    name: 'Husky',
    breed: 'Siberian Husky',
    distance: 'Near 5km',
    image: HOME_IMAGES.pets.husky,
  },
  {
    id: 's2',
    name: 'Poodle',
    breed: 'Poodle',
    distance: 'Near 3km',
    image: HOME_IMAGES.pets.poodle,
  },
];

export const NEARBY_LOCATIONS = [
  { id: 'l1', name: 'Indiranagar Dog Park', distance: '1.2 km', rating: 4.8 },
  { id: 'l2', name: 'Koramangala Pet Cafe', distance: '2.5 km', rating: 4.6 },
  { id: 'l3', name: 'Cubbon Park Meetup', distance: '4.1 km', rating: 4.9 },
];
