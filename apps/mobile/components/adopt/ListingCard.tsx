import Feather from '@expo/vector-icons/Feather';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { AdoptionListing } from '@/types/adoption';

const BRAND = '#7C3AED';

type Props = {
  listing: AdoptionListing;
  onPress: () => void;
};

export function ListingCard({ listing, onPress }: Props) {
  const cover = listing.media?.find((m) => m.mediaType === 'image' && m.url);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageWrap}>
        {cover?.url ? (
          <Image source={{ uri: cover.url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>🐾</Text>
          </View>
        )}
        <View style={styles.heart}>
          <Feather name="heart" size={16} color="#EF4444" />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{listing.petName}</Text>
        <Text style={styles.meta}>
          {listing.breed || 'Mixed'} · {listing.ageLabel || 'Age unknown'}
          {listing.gender ? ` · ${listing.gender}` : ''}
        </Text>
        <Text style={styles.location}>
          📍 {listing.publicLocationLabel || listing.city || 'Location TBD'}
        </Text>
        <View style={styles.tags}>
          {listing.vaccinationTags.length > 0 ? (
            <Text style={styles.tag}>✓ Vaccinated</Text>
          ) : null}
          {listing.goodWithDogs ? <Text style={styles.tag}>✓ Good with dogs</Text> : null}
          {listing.sterilized ? <Text style={styles.tag}>✓ Sterilized</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: { height: 180, backgroundColor: '#F3F4F6' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderEmoji: { fontSize: 40 },
  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 14, gap: 4 },
  name: { fontSize: 18, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 13, color: '#6B7280' },
  location: { fontSize: 13, color: '#374151', marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  tag: { fontSize: 11, color: BRAND, fontWeight: '600' },
});
