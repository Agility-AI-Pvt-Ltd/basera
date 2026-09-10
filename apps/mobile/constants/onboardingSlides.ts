import type { FC } from 'react';
import type { SvgProps } from 'react-native-svg';

import AdoptionImage from '@/assets/images/onboarding/adoption.svg';
import MeetupsImage from '@/assets/images/onboarding/meetups.svg';
import PacksImage from '@/assets/images/onboarding/packs.svg';
import TrustImage from '@/assets/images/onboarding/trust.svg';

export type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  Image: FC<SvgProps>;
};

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'adoption-core',
    title: 'Adoption Core',
    description:
      'Set your preferences, apply for pets, track your application status, and message shelters — from application to approval.',
    Image: AdoptionImage,
  },
  {
    id: 'trust-follow-through',
    title: 'Trust & Follow-through',
    description:
      'Schedule home visits, sign adoption agreements, confirm handover, and get check-ins at day 7, 30, and 90.',
    Image: TrustImage,
  },
  {
    id: 'packs-feed',
    title: 'Packs & Feed',
    description:
      'Join local pet packs, share posts, follow friends, and stay connected with your community.',
    Image: PacksImage,
  },
  {
    id: 'meetups-places',
    title: 'Meetups & Places',
    description:
      'Create meetups, RSVP with your pup, check in with QR codes, and discover pet-friendly parks and cafes.',
    Image: MeetupsImage,
  },
];
