/**
 * Shared Basera assets.
 *
 * Prefer platform entrypoints:
 * - React Native / Expo: `import { HOME_IMAGES } from '@basera/assets/native'`
 * - Vite web / admin:   `import { HOME_IMAGES, WEB_IMAGES } from '@basera/assets/web'`
 * - Direct file URL:    `import img from '@basera/assets/images/web/playstore.png'`
 */

export const ASSET_PATHS = {
  icon: {
    logo: 'icon/basera_logo.png',
  },
  home: {
    avatar: 'images/home/avatar-default.jpg',
    categories: {
      dogs: 'images/home/categories/dogs.jpg',
      cats: 'images/home/categories/cats.jpg',
      birds: 'images/home/categories/birds.jpg',
      fishes: 'images/home/categories/fishes.jpg',
      rabbits: 'images/home/categories/rabbits.jpg',
    },
    pets: {
      goldenRetriever: 'images/home/pets/golden-retriever.jpg',
      labrador: 'images/home/pets/labrador.jpg',
      beagle: 'images/home/pets/beagle.jpg',
      husky: 'images/home/pets/husky.jpg',
      poodle: 'images/home/pets/poodle.jpg',
    },
  },
  web: {
    playstore: 'images/web/playstore.png',
    heroImg: 'images/web/hero_img.png',
    heroImg2: 'images/web/hero_img2.png',
    fullHeroBanner: 'images/web/full_hero_banner.png',
    communityBg: 'images/web/community_bg.png',
  },
  onboarding: {
    adoption: 'images/onboarding/adoption.svg',
    meetups: 'images/onboarding/meetups.svg',
    packs: 'images/onboarding/packs.svg',
    trust: 'images/onboarding/trust.svg',
  },
} as const;
