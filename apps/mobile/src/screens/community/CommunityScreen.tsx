import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MeetupCard } from '@/components/community/MeetupCard';
import { NeighborCard } from '@/components/community/NeighborCard';
import { PackCard } from '@/components/community/PackCard';
import { RecommendedPackCard } from '@/components/community/RecommendedPackCard';
import { CoverImage } from '@/components/CoverImage';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { HOME_IMAGES } from '@/constants/home';
import { joinPack, useCommunityDiscovery } from '@/hooks/useCommunity';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase';
import type { CommunityStackParamList } from '@/src/navigation/types';
import type { CommunityPack, CommunityTab } from '@/types/community';

type Nav = NativeStackNavigationProp<CommunityStackParamList, 'Community'>;

const BRAND = '#7C3AED';
const BRAND_LIGHT = '#EDE9FE';
const H_PADDING = 20;

const TABS: { id: CommunityTab; label: string; icon: ComponentProps<typeof Feather>['name'] }[] =
  [
    { id: 'packs', label: 'Packs', icon: 'users' },
    { id: 'meetups', label: 'Meetups', icon: 'calendar' },
    { id: 'neighbors', label: 'Neighbors', icon: 'map-pin' },
  ];

export default function CommunityScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<CommunityTab>('packs');
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
  }, []);

  const { packs, meetups, neighbors, recommended, loading, reload } = useCommunityDiscovery(
    profile,
    userId,
  );

  const locationLabel =
    [profile?.locality, profile?.city].filter(Boolean).join(', ') || 'Sector 34, Noida';

  const q = search.trim().toLowerCase();
  const filteredPacks = q
    ? packs.filter((p) => p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q))
    : packs;
  const filteredMeetups = q ? meetups.filter((m) => m.title.toLowerCase().includes(q)) : meetups;
  const filteredNeighbors = q
    ? neighbors.filter((n) => n.name.toLowerCase().includes(q))
    : neighbors;

  const recommendedPacks = useMemo(() => {
    const fromFeed = recommended
      .filter((item): item is { kind: 'pack'; item: CommunityPack; reason: string } => item.kind === 'pack')
      .map((item) => item.item);
    if (fromFeed.length > 0) return fromFeed;
    return packs.slice(0, 6);
  }, [recommended, packs]);

  const handleJoin = useCallback(
    async (packId: string) => {
      if (!userId) return;
      const pack = packs.find((p) => p.id === packId);
      if (!pack) return;
      const { error } = await joinPack(pack, userId);
      if (error) Alert.alert('Could not join', error);
      else reload();
    },
    [packs, reload, userId],
  );

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.heroHeader}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Community</Text>
          <Pressable style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={BRAND} />
            <Text style={styles.location}>{locationLabel}</Text>
            <Feather name="chevron-down" size={14} color="#9CA3AF" />
          </Pressable>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() =>
            tab === 'meetups'
              ? navigation.navigate('CreateMeetup')
              : navigation.navigate('CreatePack')
          }>
          <Feather name="plus" size={22} color="#FFF" />
        </Pressable>
        <FontAwesome name="paw" size={22} color="rgba(124, 58, 237, 0.25)" style={styles.heroPaw} />
        <CoverImage source={HOME_IMAGES.pets.goldenRetriever} style={styles.heroDog} />
        <CoverImage source={HOME_IMAGES.categories.cats} style={styles.heroCat} />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Feather name="search" size={18} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search communities, packs, or topics..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>
        <Pressable style={styles.filterBtn} accessibilityLabel="Filters">
          <Feather name="sliders" size={20} color={BRAND} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(t.id)}>
              <Feather name={t.icon} size={16} color={active ? '#FFFFFF' : BRAND} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!q && recommendedPacks.length > 0 && tab === 'packs' ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended near you</Text>
            <Pressable>
              <Text style={styles.seeAll}>See All ›</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recommendedPacks.map((pack) => (
              <RecommendedPackCard
                key={pack.id}
                pack={pack}
                onPress={() => navigation.navigate('PackDetail', { packId: pack.id })}
                onJoin={() => void handleJoin(pack.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {tab === 'packs'
            ? 'Packs near you'
            : tab === 'meetups'
              ? 'Upcoming near you'
              : 'Pet parents near you'}
        </Text>
        <Pressable>
          <Text style={styles.seeAll}>See All ›</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      {loading ? (
        <View style={styles.center}>
          {listHeader}
          <ActivityIndicator color={BRAND} style={{ marginTop: 24 }} />
        </View>
      ) : tab === 'packs' ? (
        <FlatList
          data={filteredPacks}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listPad}
          renderItem={({ item }) => (
            <PackCard
              pack={item}
              onPress={() => navigation.navigate('PackDetail', { packId: item.id })}
              onJoin={() => void handleJoin(item.id)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No packs yet. Create the first one in your area.</Text>
          }
        />
      ) : tab === 'meetups' ? (
        <FlatList
          data={filteredMeetups}
          keyExtractor={(m) => m.id}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listPad}
          renderItem={({ item }) => (
            <MeetupCard
              meetup={item}
              onPress={() => navigation.navigate('MeetupDetail', { meetupId: item.id })}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No upcoming meetups. Host a walk or playdate.</Text>
          }
        />
      ) : (
        <FlatList
          data={filteredNeighbors}
          keyExtractor={(n) => n.userId}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listPad}
          renderItem={({ item }) => (
            <NeighborCard
              neighbor={item}
              onPress={() => navigation.navigate('NeighborDetail', { userId: item.userId })}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No neighbors visible yet. Complete your profile and enable discovery in settings.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F7FC' },
  center: { flex: 1, paddingHorizontal: H_PADDING },
  listPad: { paddingHorizontal: H_PADDING, paddingBottom: 120 },
  headerBlock: { paddingBottom: 4 },
  heroHeader: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    minHeight: 88,
  },
  titleBlock: { flex: 1, zIndex: 2, paddingRight: 100 },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  location: { fontSize: 14, fontWeight: '600', color: '#374151' },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: BRAND,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  heroPaw: {
    position: 'absolute',
    right: 72,
    top: 4,
    transform: [{ rotate: '-15deg' }],
    zIndex: 1,
  },
  heroDog: {
    position: 'absolute',
    right: 48,
    top: 0,
    width: 56,
    height: 72,
    borderRadius: 12,
    zIndex: 1,
  },
  heroCat: {
    position: 'absolute',
    right: 0,
    top: 16,
    width: 52,
    height: 68,
    borderRadius: 12,
    zIndex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
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
  tabRow: {
    gap: 10,
    paddingBottom: 18,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#FFFFFF' },
  section: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND,
  },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 24, lineHeight: 22 },
});
