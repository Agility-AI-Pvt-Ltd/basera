import type { AdoptionApplication, AdoptionListing, CompatibilityInsight } from '@/types/adoption';

function bool(val: unknown): boolean | null {
  if (typeof val === 'boolean') return val;
  return null;
}

function str(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

function num(val: unknown): number {
  return typeof val === 'number' ? val : Number(val) || 0;
}

export function computeCompatibility(
  listing: AdoptionListing,
  application: Pick<
    AdoptionApplication,
    'home' | 'household' | 'existingPets' | 'experience' | 'availability' | 'financial'
  >,
): { score: number; insights: CompatibilityInsight[] } {
  let score = 50;
  const insights: CompatibilityInsight[] = [];
  const prefs = listing.adoptionPreferences;
  const homeType = str(application.home.type);
  const outdoorSpace = bool(application.home.outdoorSpace);
  const hasOwned = bool(application.experience.hasOwnedPets);
  const hours = num(application.availability.hoursPerDay);
  const existingPets = application.existingPets ?? [];

  if (prefs.apartmentOk && homeType === 'apartment') {
    score += 8;
    insights.push({ type: 'positive', text: 'Home type matches listing preferences' });
  }
  if (prefs.housePreferred && homeType === 'house') {
    score += 10;
    insights.push({ type: 'positive', text: 'House living matches lister preference' });
  }
  if (prefs.housePreferred && homeType === 'apartment') {
    score -= 6;
    insights.push({ type: 'warning', text: 'Lister preferred a house environment' });
  }

  if (listing.goodWithDogs && existingPets.some((p) => str(p.type) === 'dog')) {
    score += 8;
    insights.push({ type: 'positive', text: 'Applicant has dogs and pet is good with dogs' });
  }
  if (listing.goodWithChildren && bool(application.household.hasChildren)) {
    score += 8;
    insights.push({ type: 'positive', text: 'Applicant has children and pet is good with children' });
  }

  if (hasOwned) {
    score += 10;
    insights.push({ type: 'positive', text: 'Experienced pet owner' });
  } else if (listing.adoptionRequirements.experiencedOwnerPreferred) {
    score -= 10;
    insights.push({ type: 'warning', text: 'Lister preferred an experienced owner' });
  }

  if (listing.energyLevel === 'high' || listing.energyLevel === 'very_high') {
    if (hours >= 2) {
      score += 8;
      insights.push({ type: 'positive', text: 'Applicant has sufficient daily time for an energetic pet' });
    } else {
      score -= 12;
      insights.push({
        type: 'warning',
        text: 'Pet is high-energy and applicant reports limited daily time',
      });
    }
    if (outdoorSpace === false) {
      score -= 6;
      insights.push({ type: 'warning', text: 'Limited outdoor space for a high-energy pet' });
    }
  }

  const financial = application.financial ?? {};
  const prepared = ['food', 'vaccinations', 'routineVet', 'emergencyVet', 'grooming'].filter(
    (k) => financial[k] === true,
  );
  if (prepared.length >= 3) {
    score += 6;
    insights.push({ type: 'positive', text: 'Prepared for ongoing pet expenses' });
  }

  score = Math.max(0, Math.min(100, score));
  return { score, insights };
}

export function matchStrengthLabel(score: number): string {
  if (score >= 85) return 'Strong match';
  if (score >= 70) return 'Good match';
  if (score >= 55) return 'Moderate match';
  return 'Review carefully';
}
