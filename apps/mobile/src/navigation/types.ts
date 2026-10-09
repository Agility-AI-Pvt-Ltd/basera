export type AuthStackParamList = {
  Onboarding: undefined;
  Email: undefined;
  Otp: { email: string };
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
  SettingsMenu: undefined;
  EditPersonalInfo: undefined;
  EditPhoto: undefined;
  EditLocation: undefined;
};

export type AdoptStackParamList = {
  Adopt: undefined;
  CreateListing: undefined;
  ListingDetail: { listingId: string };
  ApplyAdoption: { listingId: string };
  MyAdoption: undefined;
  ListerApplications: { listingId: string; petName: string };
  ApplicationReview: { listingId: string; applicationId: string };
  AdoptionChat: { applicationId: string; title: string };
};

export type CommunityStackParamList = {
  Community: undefined;
  PackDetail: { packId: string };
  CreatePack: undefined;
  MeetupDetail: { meetupId: string };
  CreateMeetup: undefined;
  NeighborDetail: { userId: string };
};

export type PetsStackParamList = {
  MyPetsList: undefined;
  PetDetail: { petId: string; initialTab?: 'health' | 'training' | 'nutrition' };
  CreatePetProfile: undefined;
  EditPetProfile: { petId: string };
  AddHealthSchedule: { petId: string; eventId?: string };
  UploadDocument: { petId: string };
  TrainingOnboarding: { petId: string };
  TrainingPreferences: { petId: string };
  NutritionOnboarding: { petId: string };
  NutritionPreferences: { petId: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  AdoptTab: undefined;
  CommunityTab: undefined;
  PetsTab: undefined;
};

export type SignupRouteName = keyof SignupStackParamList;
