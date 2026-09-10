import type { ImageSourcePropType } from 'react-native';

/** Image requires must live next to the files — Metro resolves static assets from here. */
export const HOME_IMAGES = {
  avatar: require('./avatar-default.jpg') as ImageSourcePropType,
  categories: {
    dogs: require('./categories/dogs.jpg') as ImageSourcePropType,
    cats: require('./categories/cats.jpg') as ImageSourcePropType,
    birds: require('./categories/birds.jpg') as ImageSourcePropType,
    fishes: require('./categories/fishes.jpg') as ImageSourcePropType,
  },
  pets: {
    goldenRetriever: require('./pets/golden-retriever.jpg') as ImageSourcePropType,
    labrador: require('./pets/labrador.jpg') as ImageSourcePropType,
    beagle: require('./pets/beagle.jpg') as ImageSourcePropType,
    husky: require('./pets/husky.jpg') as ImageSourcePropType,
    poodle: require('./pets/poodle.jpg') as ImageSourcePropType,
  },
};
