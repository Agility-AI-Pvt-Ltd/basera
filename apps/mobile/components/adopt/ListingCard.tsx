import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { formatListingDistance } from '@/lib/listingDisplay';
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
  variant?: 'grid' | 'feed';
  onAsk?: () => void;
  onApply?: () => void;
};

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

function personalityLine(listing: AdoptionListing): string {
  const desc = listing.description?.trim();
  if (desc) return desc.split(/[.!?\n]/)[0]?.trim() || desc;
  return traitLabel(listing);
}

function genderLine(listing: AdoptionListing): string {
  const parts = [
    listing.gender === 'female' ? 'Female' : listing.gender === 'male' ? 'Male' : null,
    listing.ageLabel || null,
    listing.breed || null,
  ].filter(Boolean);
  return parts.join(' · ');
}

export function ListingCard({
  listing,
  onPress,
  width,
  variant = 'grid',
  onAsk,
  onApply,
}: Props) {
  const cover = listing.media?.find((m) => m.mediaType === 'image' && m.url);
  const genderColor =
    listing.gender === 'female' ? '#EC4899' : listing.gender === 'male' ? '#3B82F6' : '#6B7280';
  const genderSymbol =
    listing.gender === 'female' ? '♀' : listing.gender === 'male' ? '♂' : '•';
  const tags = statusTags(listing);
  const isFeed = variant === 'feed';

  return (
    <Pressable
      style={[styles.card, isFeed && styles.feedCard, width != null && { width }]}
      onPress={onPress}>
      <View style={[styles.imageWrap, isFeed && styles.feedImageWrap]}>
        {cover?.url ? (
          <Image source={{ uri: cover.url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <FontAwesome name="paw" size={36} color="#9CA3AF" />
            <Text style={styles.placeholderHint}>Photo coming soon</Text>
          </View>
        )}
        <Pressable style={styles.adoptPill} accessibilityLabel="Adopt" onPress={onPress}>
          <FontAwesome name="paw" size={12} color={BRAND} />
          <Text style={styles.adoptPillText}>Adopt</Text>
        </Pressable>
        <View style={styles.distanceBadge}>
          <Feather name="map-pin" size={11} color={BRAND} />
          <Text style={styles.distanceText} numberOfLines={1}>
            {formatListingDistance(listing)}
          </Text>
        </View>
      </View>
      <View style={[styles.body, isFeed && styles.feedBody]}>
        <Text style={[styles.name, isFeed && styles.feedName]} numberOfLines={1}>
          {listing.petName}
        </Text>
        {isFeed ? (
          <Text style={styles.feedMeta} numberOfLines={2}>
            {genderLine(listing)}
          </Text>
        ) : (
          <>
            <Text style={styles.meta} numberOfLines={1}>
              {listing.breed || 'Mixed'} • {listing.ageLabel || 'Age unknown'}
            </Text>
            <Text style={styles.trait} numberOfLines={1}>
              {traitLabel(listing)}
            </Text>
          </>
        )}
        {isFeed ? (
          <Text style={styles.description} numberOfLines={2}>
            {personalityLine(listing)}
          </Text>
        ) : null}
        <View style={styles.tags}>
          {tags.map((tag) => (
            <View
              key={tag.label}
              style={[styles.tagPill, isFeed && styles.feedTagPill, { backgroundColor: tag.backgroundColor }]}>
              <Text style={[styles.tagText, isFeed && styles.feedTagText, { color: tag.color }]} numberOfLines={1}>
                {tag.label}
              </Text>
            </View>
          ))}
        </View>
        {isFeed ? (
          <>
            <View style={styles.verifiedRow}>
              <Feather name="shield" size={14} color="#16A34A" />
              <Text style={styles.verifiedText}>
                Verified foster · Tailz Club
              </Text>
            </View>
            <View style={styles.feedActions}>
              <Pressable
                style={styles.askBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onAsk?.();
                }}>
                <Text style={styles.askBtnText}>Ask about {listing.petName}</Text>
              </Pressable>
              <Pressable
                style={styles.applyBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onApply?.();
                }}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  feedCard: {
    flex: undefined,
    width: '100%',
    marginBottom: 18,
    borderRadius: 22,
  },
  feedImageWrap: { height: 220 },
  feedBody: { paddingHorizontal: 14, paddingVertical: 14, gap: 6 },
  feedName: { fontSize: 22 },
  feedMeta: { fontSize: 13, color: '#6B7280' },
  description: { fontSize: 14, lineHeight: 20, color: '#374151', marginTop: 4 },
  feedTagPill: { paddingHorizontal: 10, paddingVertical: 5 },
  feedTagText: { fontSize: 13, fontWeight: '700' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  verifiedText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  feedActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  askBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  askBtnText: { color: BRAND, fontWeight: '700', fontSize: 13 },
  applyBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: BRAND,
  },
  applyBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
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
  placeholderHint: { marginTop: 6, fontSize: 12, color: '#6B7280', fontWeight: '600' },
  adoptPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  adoptPillText: { fontSize: 11, fontWeight: '700', color: BRAND },
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
    fontSize: 11,
    fontWeight: '700',
  },
});
