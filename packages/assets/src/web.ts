/**
 * Vite / browser entry — ESM imports resolve to hashed URLs.
 * Import: `import { HOME_IMAGES, WEB_IMAGES } from '@basera/assets/web'`
 */

import baseraLogo from '../icon/basera_logo.png';
import avatar from '../images/home/avatar-default.jpg';
import birds from '../images/home/categories/birds.jpg';
import cats from '../images/home/categories/cats.jpg';
import dogs from '../images/home/categories/dogs.jpg';
import fishes from '../images/home/categories/fishes.jpg';
import rabbits from '../images/home/categories/rabbits.jpg';
import beagle from '../images/home/pets/beagle.jpg';
import goldenRetriever from '../images/home/pets/golden-retriever.jpg';
import husky from '../images/home/pets/husky.jpg';
import labrador from '../images/home/pets/labrador.jpg';
import poodle from '../images/home/pets/poodle.jpg';
import adoption from '../images/onboarding/adoption.svg';
import meetups from '../images/onboarding/meetups.svg';
import packs from '../images/onboarding/packs.svg';
import trust from '../images/onboarding/trust.svg';
import communityBg from '../images/web/community_bg.png';
import fullHeroBanner from '../images/web/full_hero_banner.png';
import heroImg from '../images/web/hero_img.png';
import heroImg2 from '../images/web/hero_img2.png';
import playstore from '../images/web/playstore.png';

export const BRAND_IMAGES = {
  logo: baseraLogo,
} as const;

export const HOME_IMAGES = {
  avatar,
  categories: { dogs, cats, birds, fishes, rabbits },
  pets: { goldenRetriever, labrador, beagle, husky, poodle },
} as const;

export const WEB_IMAGES = {
  playstore,
  heroImg,
  heroImg2,
  fullHeroBanner,
  communityBg,
} as const;

export const ONBOARDING_IMAGES = {
  adoption,
  meetups,
  packs,
  trust,
} as const;
