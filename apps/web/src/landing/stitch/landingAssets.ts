import { BRAND_IMAGES, HOME_IMAGES, WEB_IMAGES } from '@tailz-club/assets/web';

const screen = (file: string) => `/landing-page/${file}`;

export const LANDING_IMG = {
  logo: BRAND_IMAGES.logo,
  hero: WEB_IMAGES.heroImg,
  heroPetThumb: HOME_IMAGES.pets.goldenRetriever,
  petKulfi: HOME_IMAGES.pets.beagle,
  petSimba: HOME_IMAGES.categories.cats,
  petLeo: HOME_IMAGES.pets.labrador,
  adoptionPhone: screen('adoption_page.png'),
  communityPhone: screen('community_page.png'),
  trainingPhone: screen('training_page.png'),
  nutritionPhone: screen('nutrition_page.png'),
  activityReel1: WEB_IMAGES.heroImg2,
  activityReel2: WEB_IMAGES.communityBg,
  activityReel3: screen('about_bg.png'),
} as const;
