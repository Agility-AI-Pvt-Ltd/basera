import Feather from '@expo/vector-icons/Feather';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
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
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { joinPack, useCommunityDiscovery } from '@/hooks/useCommunity';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatDistanceKm } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import type { CommunityStackParamList } from '@/src/navigation/types';
import type { CommunityTab } from '@/types/community';

type Nav = NativeStackNavigationProp<CommunityStackParamList, 'Community'>;

const BRAND = '#7C3AED';
const TABS: { id: CommunityTab; label: string }[] = [
  { id: 'packs', label: 'Packs' },
  { id: 'meetups', label: 'Meetups' },
  { id: 'neighbors', label: 'Neighbors' },
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
    [profile?.locality, profile?.city].filter(Boolean).join(', ') || 'Set your location';

  const q = search.trim().toLowerCase();
  const filteredPacks = q
    ? packs.filter((p) => p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q))
    : packs;
  const filteredMeetups = q ? meetups.filter((m) => m.title.toLowerCase().includes(q)) : meetups;
  const filteredNeighbors = q
    ? neighbors.filter((n) => n.name.toLowerCase().includes(q))
    : neighbors;

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
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Community</Text>
          <Pressable style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={BRAND} />
            <Text style={styles.location}>{locationLabel}</Text>
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
      </View>

      <View style={styles.searchRow}>
        <Feather name="search" size={18} color="#9CA3AF" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search communities"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}>
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {!q && recommended.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended near you</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recommended.map((item) => (
              <Pressable
                key={`${item.kind}-${item.kind === 'pack' ? item.item.id : item.kind === 'meetup' ? item.item.id : item.item.userId}`}
                style={styles.recCard}
                onPress={() => {
                  if (item.kind === 'pack') navigation.navigate('PackDetail', { packId: item.item.id });
                  else if (item.kind === 'meetup')
                    navigation.navigate('MeetupDetail', { meetupId: item.item.id });
                  else navigation.navigate('NeighborDetail', { userId: item.item.userId });
                }}>
                <Text style={styles.recKind}>
                  {item.kind === 'pack' ? '🐕 Pack' : item.kind === 'meetup' ? '🌳 Meetup' : '👤 Neighbor'}
                </Text>
                <Text style={styles.recTitle} numberOfLines={2}>
                  {item.kind === 'neighbor'
                    ? item.item.name
                    : item.kind === 'pack'
                      ? item.item.name
                      : item.item.title}
                </Text>
                <Text style={styles.recMeta}>
                  {item.kind === 'meetup'
                    ? formatDistanceKm(item.item.distanceKm)
                    : item.kind === 'pack'
                      ? formatDistanceKm(item.item.distanceKm)
                      : formatDistanceKm(item.item.distanceKm)}
                </Text>
                <Text style={styles.recReason}>{item.reason}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>
        {tab === 'packs' ? 'Packs near you' : tab === 'meetups' ? 'Upcoming near you' : 'Pet parents near you'}
      </Text>
    </>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={BRAND} />
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
              onJoin={() => handleJoin(item.id)}
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
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listPad: { paddingHorizontal: 20, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    fontWeight: '200',
    color: '#111827',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  location: { fontSize: 14, color: '#6B7280' },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 15, color: '#111827' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#FFF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  tabTextActive: { color: '#111827', fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  recCard: {
    width: 160,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  recKind: { fontSize: 12, color: BRAND, fontWeight: '600' },
  recTitle: { marginTop: 6, fontSize: 15, fontWeight: '600', color: '#111827', minHeight: 40 },
  recMeta: { marginTop: 4, fontSize: 12, color: '#6B7280' },
  recReason: { marginTop: 6, fontSize: 11, color: '#9CA3AF' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 24, lineHeight: 22 },
});
