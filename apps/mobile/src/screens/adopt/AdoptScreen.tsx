import Feather from '@expo/vector-icons/Feather';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/adopt/ListingCard';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { scrollPaddingBelowTabBar } from '@/constants/layout';
import { pluralPetCount } from '@/lib/listingDisplay';
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

type SpeciesChip = 'all' | PetSpecies | 'rabbit';
type SortOption = 'newest' | 'oldest';

const SPECIES_CHIPS: { id: SpeciesChip; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'dog', label: 'Dogs' },
  { id: 'cat', label: 'Cats' },
  { id: 'bird', label: 'Birds' },
  { id: 'rabbit', label: 'Other' },
];

export default function AdoptScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [draftCity, setDraftCity] = useState('');
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
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Adopt</Text>
        <Pressable
          style={styles.locationPill}
          onPress={() => {
            setDraftCity(city);
            setFilterSheetOpen(true);
          }}
          accessibilityLabel="Change city filter">
          <Feather name="map-pin" size={14} color={BRAND} />
          <Text style={styles.locationPillText} numberOfLines={1}>
            {locationLabel}
          </Text>
          <Feather name="chevron-down" size={14} color="#9CA3AF" />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Feather name="search" size={18} color="#9CA3AF" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or bree..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>
        <Pressable
          style={styles.filterBtn}
          accessibilityLabel="Filter and sort"
          onPress={() => {
            setDraftCity(city);
            setFilterSheetOpen(true);
          }}>
          <Feather name="sliders" size={18} color={BRAND} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipRow, styles.chipRowScrollHint]}>
        {SPECIES_CHIPS.map((chip) => {
          const active = speciesChip === chip.id;
          return (
            <Pressable
              key={chip.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSpeciesChip(chip.id)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.listMetaRow}>
        <Text style={styles.countText}>{pluralPetCount(displayListings.length)}</Text>
        <Text style={styles.nearText}>
          near {locationLabel} · {sortBy === 'newest' ? 'Newest first' : 'Oldest first'}
        </Text>
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
          refreshing={loading}
          onRefresh={() => void reload()}
          contentContainerStyle={{ paddingBottom: scrollPaddingBelowTabBar(insets.bottom) + 56 }}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyTitle}>No pets listed near you yet</Text>
              <Text style={styles.emptyBody}>
                List a pet for adoption or get notified when new listings appear in your area.
              </Text>
              <Pressable
                style={styles.emptyPrimary}
                onPress={() => navigation.navigate('CreateListing')}>
                <Text style={styles.emptyPrimaryText}>List a pet</Text>
              </Pressable>
              <Pressable
                style={styles.emptySecondary}
                onPress={() =>
                  Alert.alert('Notifications', 'We will notify you when pets are listed near you.')
                }>
                <Text style={styles.emptySecondaryText}>Notify me when pets are listed near me</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              variant="feed"
              onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
              onAsk={() => navigation.navigate('ListingDetail', { listingId: item.id })}
              onApply={() => navigation.navigate('ApplyAdoption', { listingId: item.id })}
            />
          )}
        />
      )}
      <Pressable
        style={[styles.fab, { bottom: scrollPaddingBelowTabBar(insets.bottom) - 12 }]}
        onPress={() => navigation.navigate('CreateListing')}
        accessibilityLabel="List a pet">
        <Feather name="plus" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>List a pet</Text>
      </Pressable>

      <Modal visible={filterSheetOpen} transparent animationType="slide">
        <Pressable style={styles.sheetBackdrop} onPress={() => setFilterSheetOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.sheetTitle}>Filter & sort</Text>
          <Text style={styles.sheetLabel}>City</Text>
          <TextInput
            value={draftCity}
            onChangeText={setDraftCity}
            placeholder="Noida"
            placeholderTextColor="#9CA3AF"
            style={styles.sheetInput}
          />
          <Text style={styles.sheetLabel}>Sort</Text>
          <View style={styles.sheetRow}>
            {(
              [
                ['newest', 'Newest first'],
                ['oldest', 'Oldest first'],
              ] as const
            ).map(([id, label]) => (
              <Pressable
                key={id}
                style={[styles.sheetChip, sortBy === id && styles.sheetChipActive]}
                onPress={() => setSortBy(id)}>
                <Text style={[styles.sheetChipText, sortBy === id && styles.sheetChipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={styles.sheetApply}
            onPress={() => {
              setCity(draftCity);
              setFilterSheetOpen(false);
            }}>
            <Text style={styles.sheetApplyText}>Apply</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F7FC', paddingHorizontal: H_PADDING },
  headerBlock: { paddingBottom: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  pageTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },
  fab: {
    position: 'absolute',
    right: H_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: BRAND,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  filterBtnText: { fontSize: 13, fontWeight: '700', color: BRAND },
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
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
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
  chipRowScrollHint: { paddingRight: 48 },
  nearText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  emptyBlock: { marginTop: 28, paddingHorizontal: 8, gap: 12, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' },
  emptyBody: { fontSize: 14, color: '#374151', textAlign: 'center', lineHeight: 20 },
  emptyPrimary: {
    marginTop: 8,
    width: '100%',
    backgroundColor: BRAND,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  emptySecondary: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND,
  },
  emptySecondaryText: { color: BRAND, fontWeight: '700', fontSize: 14, textAlign: 'center' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sheetLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginTop: 4 },
  sheetInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  sheetRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sheetChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sheetChipActive: { backgroundColor: BRAND, borderColor: BRAND },
  sheetChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  sheetChipTextActive: { color: '#FFFFFF' },
  sheetApply: {
    marginTop: 12,
    backgroundColor: BRAND,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetApplyText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
