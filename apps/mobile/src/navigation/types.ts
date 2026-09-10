export type AuthStackParamList = {
  Onboarding: undefined;
  Phone: undefined;
  Otp: { phone: string };
};

export type SignupStackParamList = {
  Basics: undefined;
  DogFork: undefined;
  PetProfile: undefined;
  AdoptionSetup: undefined;
  Packs: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
};

export type AdoptStackParamList = {
  Adopt: undefined;
};

export type CommunityStackParamList = {
  Community: undefined;
};

export type PetsStackParamList = {
  Pets: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  AdoptTab: undefined;
  CommunityTab: undefined;
  PetsTab: undefined;
};

export type SignupRouteName = keyof SignupStackParamList;
