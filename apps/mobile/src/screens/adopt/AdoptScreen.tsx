import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/adopt/ListingCard';
import { CoverImage } from '@/components/CoverImage';
import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { HOME_IMAGES } from '@/constants/home';
import { useAdoptionBrowse } from '@/hooks/useAdoption';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { AdoptStackParamList, MainTabParamList } from '@/src/navigation/types';
import type { ListingFilters } from '@/types/adoption';
import type { PetSpecies } from '@/types/pet';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<AdoptStackParamList, 'Adopt'>,
  BottomTabNavigationProp<MainTabParamList>
>;

const BRAND = '#7C3AED';
const BRAND_LIGHT = '#EDE9FE';
const H_PADDING = 16;
const GRID_GAP = 12;

type SpeciesChip = 'all' | PetSpecies | 'rabbit';
type SortOption = 'newest' | 'oldest';

const SPECIES_CHIPS: { id: SpeciesChip; label: string; emoji?: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'dog', label: 'Dogs', emoji: '🐶' },
  { id: 'cat', label: 'Cats', emoji: '🐱' },
  { id: 'bird', label: 'Birds', emoji: '🐦' },
  { id: 'rabbit', label: 'Rabbits', emoji: '🐰' },
];

export default function AdoptScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = (windowWidth - H_PADDING * 2 - GRID_GAP) / 2;
  const { profile } = useUserProfile();

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [cityFilterOpen, setCityFilterOpen] = useState(false);
  const [speciesChip, setSpeciesChip] = useState<SpeciesChip>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    if (profile?.city && !city) {
      setCity(profile.city);
    }
  }, [profile?.city, city]);

  const speciesFilter = useMemo<ListingFilters['species']>(() => {
    if (speciesChip === 'all' || speciesChip === 'rabbit') return 'all';
    return speciesChip;
  }, [speciesChip]);

  const filters = useMemo<ListingFilters>(
    () => ({
      query,
      city,
      species: speciesFilter,
      sterilized: false,
      vaccinated: false,
      goodWithChildren: false,
      goodWithDogs: false,
    }),
    [query, city, speciesFilter],
  );

  const { listings, loading, reload } = useAdoptionBrowse(filters);

  const displayListings = useMemo(() => {
    let rows = listings;
    if (speciesChip === 'rabbit') {
      rows = rows.filter(
        (l) =>
          l.breed.toLowerCase().includes('rabbit') ||
          l.species === 'other' ||
          l.petName.toLowerCase().includes('bunny'),
      );
    }
    if (sortBy === 'oldest') {
      rows = [...rows].reverse();
    }
    return rows;
  }, [listings, speciesChip, sortBy]);

  const locationLabel = city.trim() || profile?.city || 'Noida';

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.topRow}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.getParent()?.navigate('HomeTab')}
          accessibilityLabel="Back to home">
          <Feather name="chevron-left" size={22} color="#111827" />
        </Pressable>
        <Pressable
          style={styles.locationPill}
          onPress={() => setCityFilterOpen((v) => !v)}
          accessibilityLabel="Change city filter">
          <Feather name="map-pin" size={14} color={BRAND} />
          <Text style={styles.locationPillText} numberOfLines={1}>
            {locationLabel}
          </Text>
          <Feather name="chevron-down" size={14} color="#9CA3AF" />
        </Pressable>
        <Pressable
          style={styles.hubBtn}
          onPress={() => navigation.navigate('MyAdoption')}
          accessibilityLabel="My adoption">
          <Feather name="layers" size={18} color={BRAND} />
        </Pressable>
      </View>

      <View style={styles.heroWrap}>
        <LinearGradient
          colors={['#EDE9FE', '#F5F3FF', '#FAFAFF']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.heroBanner}>
          <FontAwesome name="paw" size={24} color="rgba(124, 58, 237, 0.2)" style={styles.heroPaw} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>
              Adopt a <Text style={styles.heroTitleAccent}>Pet</Text>
            </Text>
            <Text style={styles.heroSubtitle}>Give a loving home to a furry friend</Text>
          </View>
          <Pressable
            style={styles.listBtn}
            onPress={() => navigation.navigate('CreateListing')}>
            <Feather name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.listBtnText} numberOfLines={1}>
              List a pet for adoption
            </Text>
            <Feather name="chevron-right" size={18} color="#FFFFFF" />
          </Pressable>
          <CoverImage source={HOME_IMAGES.pets.goldenRetriever} style={styles.heroDog} />
          <CoverImage source={HOME_IMAGES.categories.cats} style={styles.heroCat} />
        </LinearGradient>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Feather name="search" size={18} color="#9CA3AF" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, breed or keyword..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>
        <Pressable style={styles.filterBtn} accessibilityLabel="Filters">
          <Feather name="sliders" size={20} color={BRAND} />
        </Pressable>
      </View>

      {cityFilterOpen ? (
        <View style={styles.cityInputRow}>
          <Feather name="map-pin" size={16} color={BRAND} />
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Filter by city"
            placeholderTextColor="#9CA3AF"
            style={styles.cityInput}
          />
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}>
        <Pressable
          style={[styles.cityChip, cityFilterOpen && styles.chipActive]}
          onPress={() => setCityFilterOpen((v) => !v)}>
          <Feather name="map-pin" size={14} color={BRAND} />
          <Feather name="chevron-down" size={14} color="#9CA3AF" />
        </Pressable>
        {SPECIES_CHIPS.map((chip) => {
          const active = speciesChip === chip.id;
          return (
            <Pressable
              key={chip.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSpeciesChip(chip.id)}>
              {chip.emoji ? <Text style={styles.chipEmoji}>{chip.emoji}</Text> : null}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.listMetaRow}>
        <Text style={styles.countText}>{displayListings.length} Pets Available</Text>
        <Pressable
          style={styles.sortPill}
          onPress={() => setSortBy((s) => (s === 'newest' ? 'oldest' : 'newest'))}>
          <Feather name="sliders" size={14} color={BRAND} />
          <Text style={styles.sortText}>{sortBy === 'newest' ? 'Newest First' : 'Oldest First'}</Text>
          <Feather name="chevron-down" size={14} color="#9CA3AF" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      {loading && displayListings.length === 0 ? (
        <>
          {listHeader}
          <ActivityIndicator color={BRAND} style={{ marginTop: 32 }} />
        </>
      ) : (
        <FlatList
          data={displayListings}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          refreshing={loading}
          onRefresh={() => void reload()}
          contentContainerStyle={{ paddingBottom: 130 }}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <Text style={styles.empty}>No active listings yet. Be the first to list a pet.</Text>
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              width={cardWidth}
              onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F7FC', paddingHorizontal: H_PADDING },
  headerBlock: { paddingBottom: 4 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  locationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  locationPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    maxWidth: 120,
  },
  hubBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: { marginBottom: 16 },
  heroBanner: {
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 200,
    position: 'relative',
    paddingBottom: 16,
  },
  heroPaw: {
    position: 'absolute',
    left: 14,
    top: 12,
    transform: [{ rotate: '-12deg' }],
  },
  heroCopy: {
    paddingTop: 18,
    paddingLeft: 16,
    paddingBottom: 4,
    paddingRight: 120,
    maxWidth: '78%',
  },
  heroTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  heroTitleAccent: { color: BRAND },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },
  listBtn: {
    marginTop: 10,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BRAND,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  listBtnText: {
    flex: 1,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  heroDog: {
    position: 'absolute',
    right: 48,
    top: 28,
    width: 84,
    height: 108,
    borderRadius: 12,
    zIndex: 1,
  },
  heroCat: {
    position: 'absolute',
    right: 6,
    top: 52,
    width: 68,
    height: 88,
    borderRadius: 12,
    zIndex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', padding: 0 },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: BRAND_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cityInput: { flex: 1, fontSize: 14, color: '#111827', padding: 0 },
  chipRow: {
    gap: 8,
    paddingBottom: 14,
    alignItems: 'center',
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#FFFFFF' },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  gridRow: { gap: GRID_GAP },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 14 },
});
