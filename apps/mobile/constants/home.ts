import { HOME_IMAGES } from '@basera/assets/native';
import type { ImageSourcePropType } from 'react-native';

export { HOME_IMAGES };

export const BRAND_PURPLE = '#A78BFA';
export const BRAND_PURPLE_DARK = '#7C3AED';
export const BRAND_PURPLE_LIGHT = '#EDE9FE';

export type Category = {
  id: string;
  label: string;
  image?: ImageSourcePropType;
  icon?: 'paw';
};

export type FeaturedPet = {
  id: string;
  breed: string;
  distance: string;
  image: ImageSourcePropType;
  gender: 'male' | 'female';
  age: string;
  trait: string;
};

export type NearbyPet = {
  id: string;
  name: string;
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
  { id: 'rabbits', label: 'Rabbits', image: HOME_IMAGES.categories.rabbits },
  { id: 'others', label: 'Others', icon: 'paw' },
];

export const FEATURED_PETS: FeaturedPet[] = [
  {
    id: '1',
    breed: 'Golden Retriever',
    distance: '2 km away',
    image: HOME_IMAGES.pets.goldenRetriever,
    gender: 'male',
    age: '2 years',
    trait: 'Friendly',
  },
  {
    id: '2',
    breed: 'Labrador',
    distance: '3 km away',
    image: HOME_IMAGES.pets.labrador,
    gender: 'female',
    age: '1 year',
    trait: 'Playful',
  },
  {
    id: '3',
    breed: 'Beagle',
    distance: '5 km away',
    image: HOME_IMAGES.pets.beagle,
    gender: 'male',
    age: '3 years',
    trait: 'Calm',
  },
];

export const NEARBY_PETS: NearbyPet[] = [
  { id: 'n1', name: 'Beagle', image: HOME_IMAGES.pets.beagle },
  { id: 'n2', name: 'Persian Cat', image: HOME_IMAGES.categories.cats },
  { id: 'n3', name: 'Parakeet', image: HOME_IMAGES.categories.birds },
  { id: 'n4', name: 'Rabbit', image: HOME_IMAGES.pets.poodle },
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
