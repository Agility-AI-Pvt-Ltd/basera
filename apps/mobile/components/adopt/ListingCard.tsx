import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { AdoptionListing } from '@/types/adoption';

const BRAND = '#7C3AED';

type StatusTag = {
  label: string;
  backgroundColor: string;
  color: string;
};

type Props = {
  listing: AdoptionListing;
  onPress: () => void;
  width?: number;
};

function distanceLabel(listing: AdoptionListing): string {
  const label = listing.publicLocationLabel?.trim();
  if (label && /\d\s*km/i.test(label)) return label;
  if (listing.adoptionRadius?.trim()) return listing.adoptionRadius;
  return 'Nearby';
}

function traitLabel(listing: AdoptionListing): string {
  if (listing.goodWithDogs) return 'Good with dogs';
  if (listing.goodWithChildren) return 'Good with kids';
  if (listing.species === 'cat') return 'Indoor only';
  if (listing.temperamentTags[0]) return listing.temperamentTags[0];
  return 'Playful';
}

function statusTags(listing: AdoptionListing): StatusTag[] {
  const tags: StatusTag[] = [];

  if (listing.vaccinationTags.length > 0) {
    tags.push({ label: 'Vaccinated', backgroundColor: '#DCFCE7', color: '#15803D' });
  }

  if (listing.sterilized) {
    tags.push({ label: 'Sterilized', backgroundColor: '#EDE9FE', color: BRAND });
  } else if (listing.temperamentTags.some((t) => t.toLowerCase() === 'friendly')) {
    tags.push({ label: 'Friendly', backgroundColor: '#EDE9FE', color: BRAND });
  } else if (listing.temperamentTags[0]) {
    tags.push({ label: listing.temperamentTags[0], backgroundColor: '#EDE9FE', color: BRAND });
  } else {
    tags.push({ label: 'Dewormed', backgroundColor: '#EDE9FE', color: BRAND });
  }

  if (listing.healthStatus === 'healthy') {
    tags.push({ label: 'Healthy', backgroundColor: '#DBEAFE', color: '#1D4ED8' });
  } else if (
    listing.energyLevel === 'high' ||
    listing.energyLevel === 'very_high' ||
    listing.temperamentTags.some((t) => t.toLowerCase() === 'energetic')
  ) {
    tags.push({ label: 'Energetic', backgroundColor: '#FCE7F3', color: '#BE185D' });
  } else if (listing.temperamentTags.some((t) => t.toLowerCase() === 'playful')) {
    tags.push({ label: 'Playful', backgroundColor: '#FCE7F3', color: '#BE185D' });
  } else {
    tags.push({ label: 'Healthy', backgroundColor: '#DBEAFE', color: '#1D4ED8' });
  }

  return tags.slice(0, 3);
}

export function ListingCard({ listing, onPress, width }: Props) {
  const cover = listing.media?.find((m) => m.mediaType === 'image' && m.url);
  const genderColor =
    listing.gender === 'female' ? '#EC4899' : listing.gender === 'male' ? '#3B82F6' : '#6B7280';
  const genderSymbol =
    listing.gender === 'female' ? '♀' : listing.gender === 'male' ? '♂' : '•';
  const tags = statusTags(listing);

  return (
    <Pressable style={[styles.card, width != null && { width }]} onPress={onPress}>
      <View style={styles.imageWrap}>
        {cover?.url ? (
          <Image source={{ uri: cover.url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>🐾</Text>
          </View>
        )}
        <Pressable style={styles.heart} accessibilityLabel="Save listing">
          <Feather name="heart" size={15} color="#111827" />
        </Pressable>
        <View style={styles.distanceBadge}>
          <Feather name="map-pin" size={11} color={BRAND} />
          <Text style={styles.distanceText} numberOfLines={1}>
            {distanceLabel(listing)}
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {listing.petName}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {listing.breed || 'Mixed'} • {listing.ageLabel || 'Age unknown'}
        </Text>
        <View style={styles.traitRow}>
          <Text style={[styles.gender, { color: genderColor }]}>{genderSymbol}</Text>
          <FontAwesome name="paw" size={10} color={BRAND} />
          <Text style={styles.trait} numberOfLines={1}>
            {traitLabel(listing)}
          </Text>
        </View>
        <View style={styles.tags}>
          {tags.map((tag) => (
            <View
              key={tag.label}
              style={[styles.tagPill, { backgroundColor: tag.backgroundColor }]}>
              <Text style={[styles.tagText, { color: tag.color }]} numberOfLines={1}>
                {tag.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  imageWrap: {
    height: 132,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderEmoji: { fontSize: 32 },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: '88%',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    flexShrink: 1,
  },
  body: { paddingHorizontal: 10, paddingVertical: 10, gap: 3 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 11, color: '#6B7280' },
  traitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  gender: { fontSize: 11, fontWeight: '700' },
  trait: { fontSize: 10, color: '#6B7280', flex: 1 },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    maxWidth: '100%',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '600',
  },
});
