import type { CommunityMeetup, CommunityPack, NeighborProfile } from '@/types/community';

type Origin = { latitude: number; longitude: number } | null;

type UserSignals = {
  city?: string;
  locality?: string;
  petSpecies?: string;
  petBreed?: string;
};

export type RecommendedItem =
  | { kind: 'pack'; item: CommunityPack; score: number; reason: string }
  | { kind: 'meetup'; item: CommunityMeetup; score: number; reason: string }
  | { kind: 'neighbor'; item: NeighborProfile; score: number; reason: string };

function proximityScore(km: number | undefined): number {
  if (km == null) return 0;
  return Math.max(0, 40 - km * 4);
}

export function buildRecommendedFeed(
  packs: CommunityPack[],
  meetups: CommunityMeetup[],
  neighbors: NeighborProfile[],
  signals: UserSignals,
): RecommendedItem[] {
  const items: RecommendedItem[] = [];

  for (const pack of packs.slice(0, 8)) {
    let score = proximityScore(pack.distanceKm);
    let reason = 'Nearby community';
    if (signals.locality && pack.area.toLowerCase().includes(signals.locality.toLowerCase())) {
      score += 15;
      reason = 'In your area';
    }
    if (signals.petBreed && pack.name.toLowerCase().includes(signals.petBreed.toLowerCase())) {
      score += 12;
      reason = 'Matches your pet breed';
    }
    if (pack.category === 'activity') {
      score += 4;
    }
    items.push({ kind: 'pack', item: pack, score, reason });
  }

  for (const meetup of meetups.slice(0, 6)) {
    let score = proximityScore(meetup.distanceKm) + 8;
    const reason =
      meetup.meetupType === 'dog_walk'
        ? 'Dog walk near you'
        : 'Upcoming meetup nearby';
    items.push({ kind: 'meetup', item: meetup, score, reason });
  }

  for (const neighbor of neighbors.slice(0, 6)) {
    let score = proximityScore(neighbor.distanceKm ?? undefined) + 5;
    let reason = 'Pet parent nearby';
    if (
      signals.petBreed &&
      neighbor.petBreed?.toLowerCase().includes(signals.petBreed.toLowerCase())
    ) {
      score += 10;
      reason = 'Similar breed nearby';
    }
    items.push({ kind: 'neighbor', item: neighbor, score, reason });
  }

  return items.sort((a, b) => b.score - a.score).slice(0, 12);
}
