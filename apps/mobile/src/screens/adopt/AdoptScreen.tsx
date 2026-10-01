import Feather from '@expo/vector-icons/Feather';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/adopt/ListingCard';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { useAdoptionBrowse } from '@/hooks/useAdoption';
import type { AdoptStackParamList } from '@/src/navigation/types';
import type { ListingFilters } from '@/types/adoption';

type Nav = NativeStackNavigationProp<AdoptStackParamList, 'Adopt'>;

const BRAND = '#7C3AED';

export default function AdoptScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [species, setSpecies] = useState<ListingFilters['species']>('all');

  const filters = useMemo<ListingFilters>(
    () => ({
      query,
      city,
      species,
      sterilized: false,
      vaccinated: false,
      goodWithChildren: false,
      goodWithDogs: false,
    }),
    [query, city, species],
  );

  const { listings, loading, reload } = useAdoptionBrowse(filters);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Adopt a Pet</Text>
          <Text style={styles.subtitle}>Browse pets looking for loving homes</Text>
        </View>
        <Pressable style={styles.hubBtn} onPress={() => navigation.navigate('MyAdoption')}>
          <Feather name="layers" size={18} color={BRAND} />
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.listBtn} onPress={() => navigation.navigate('CreateListing')}>
          <Feather name="plus-circle" size={18} color="#FFFFFF" />
          <Text style={styles.listBtnText}>List a pet</Text>
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <Feather name="search" size={18} color="#9CA3AF" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name, breed…"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="City"
          placeholderTextColor="#9CA3AF"
          style={styles.filterInput}
        />
        <View style={styles.chips}>
          {(['all', 'dog', 'cat'] as const).map((s) => (
            <Pressable
              key={s}
              style={[styles.chip, species === s && styles.chipActive]}
              onPress={() => setSpecies(s)}>
              <Text style={[styles.chipText, species === s && styles.chipTextActive]}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={BRAND} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={() => void reload()}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No active listings yet. Be the first to list a pet.</Text>
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontFamily: FONT_FAMILY, fontSize: 28, fontWeight: '200', color: '#111827' },
  subtitle: { marginTop: 4, fontSize: 14, color: '#6B7280' },
  hubBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { marginTop: 14 },
  listBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND,
    borderRadius: 14,
    paddingVertical: 12,
  },
  listBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#111827' },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 4 },
  filterInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
  },
  chips: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#EDE9FE', borderColor: BRAND },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: BRAND, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 14 },
});
