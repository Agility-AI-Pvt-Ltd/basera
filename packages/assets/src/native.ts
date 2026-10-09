/**
 * Metro / React Native entry — use `require()` so bundler embeds assets.
 * Import: `import { HOME_IMAGES } from '@basera/assets/native'`
 */

// ImageSourcePropType without depending on react-native in this package.
type RnImageSource = number | { uri: string };

export const BRAND_IMAGES = {
  logo: require('../icon/basera_logo.png') as RnImageSource,
};

export const HOME_IMAGES = {
  avatar: require('../images/home/avatar-default.jpg') as RnImageSource,
  categories: {
    dogs: require('../images/home/categories/dogs.jpg') as RnImageSource,
    cats: require('../images/home/categories/cats.jpg') as RnImageSource,
    birds: require('../images/home/categories/birds.jpg') as RnImageSource,
    fishes: require('../images/home/categories/fishes.jpg') as RnImageSource,
    rabbits: require('../images/home/categories/rabbits.jpg') as RnImageSource,
  },
  pets: {
    goldenRetriever: require('../images/home/pets/golden-retriever.jpg') as RnImageSource,
    labrador: require('../images/home/pets/labrador.jpg') as RnImageSource,
    beagle: require('../images/home/pets/beagle.jpg') as RnImageSource,
    husky: require('../images/home/pets/husky.jpg') as RnImageSource,
    poodle: require('../images/home/pets/poodle.jpg') as RnImageSource,
  },
};

export const WEB_IMAGES = {
  playstore: require('../images/web/playstore.png') as RnImageSource,
  heroImg: require('../images/web/hero_img.png') as RnImageSource,
  heroImg2: require('../images/web/hero_img2.png') as RnImageSource,
  fullHeroBanner: require('../images/web/full_hero_banner.png') as RnImageSource,
  communityBg: require('../images/web/community_bg.png') as RnImageSource,
};

/** Preset community avatars — keys match PRESET_AVATAR_IDS / photo_uri `preset:…`. */
export const AVATAR_PRESETS = {
  'avatar-01': require('../images/avatars/avatar-01.jpg') as RnImageSource,
  'avatar-02': require('../images/avatars/avatar-02.jpg') as RnImageSource,
  'avatar-03': require('../images/avatars/avatar-03.jpg') as RnImageSource,
  'avatar-04': require('../images/avatars/avatar-04.jpg') as RnImageSource,
  'avatar-05': require('../images/avatars/avatar-05.jpg') as RnImageSource,
  'avatar-06': require('../images/avatars/avatar-06.jpg') as RnImageSource,
};

/** Prefer `import X from '@basera/assets/images/onboarding/*.svg'` with svg-transformer. */
