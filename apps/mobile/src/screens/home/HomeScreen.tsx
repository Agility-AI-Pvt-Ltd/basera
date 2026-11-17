import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetAvatar } from '@/components/pets/PetAvatar';
import { UserAvatar } from '@/components/UserAvatar';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { scrollPaddingBelowTabBar } from '@/constants/layout';
import { BRAND_PURPLE_DARK, BRAND_PURPLE_LIGHT } from '@/constants/home';
import { usePetCare } from '@/hooks/usePetCare';
import { usePets } from '@/hooks/usePets';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { HomeStackParamList, MainTabParamList } from '@/src/navigation/types';

const H_PADDING = 20;

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

type HomeNav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Home'>,
  BottomTabNavigationProp<MainTabParamList>
>;

function daysUntil(dateIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateIso.slice(0, 10)}T12:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const { pets, loadPets } = usePets();
  const primaryPet = pets[0] ?? null;
  const care = usePetCare(primaryPet?.id ?? '');
  const [greeting] = useState(() => greetingForHour(new Date().getHours()));

  useFocusEffect(
    useCallback(() => {
      void loadPets();
      if (primaryPet) void care.reload();
    }, [loadPets, primaryPet?.id]),
  );

  const locationLabel = profile?.city
    ? `${profile.locality ? `${profile.locality}, ` : ''}${profile.city}`
    : 'Sector 51, Noida';

  const careProgress = useMemo(() => {
    const events = care.healthEvents;
    if (events.length === 0) return { done: 0, total: 4, ratio: 0 };
    const total = events.length;
    const done = events.filter((e) => e.completed).length;
    return { done, total, ratio: done / total };
  }, [care.healthEvents]);

  const nextEvent = useMemo(() => {
    const open = care.healthEvents
      .filter((e) => !e.completed)
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    return open[0] ?? null;
  }, [care.healthEvents]);

  const dueLine = useMemo(() => {
    if (!nextEvent || !primaryPet) return null;
    const days = daysUntil(nextEvent.eventDate);
    const task = `${primaryPet.name}'s ${nextEvent.title.toLowerCase()}`;
    if (days < 0) return `${task} was due ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
    if (days === 0) return `${task} is due today`;
    return `${task} is due in ${days} day${days === 1 ? '' : 's'}`;
  }, [nextEvent, primaryPet]);

  const openPetsTab = () => {
    navigation.getParent()?.navigate('PetsTab');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollPaddingBelowTabBar(insets.bottom) }}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.navigate('SettingsMenu')}
            accessibilityRole="button"
            accessibilityLabel="Open settings">
            <UserAvatar photoUri={profile?.photoUri} size={44} />
          </Pressable>
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Pressable
              style={styles.locationRow}
              onPress={() => navigation.navigate('EditLocation')}>
              <Feather name="map-pin" size={14} color={BRAND_PURPLE_DARK} />
              <Text style={styles.locationValue} numberOfLines={1}>
                {locationLabel}
              </Text>
              <Feather name="chevron-down" size={14} color="#9CA3AF" />
            </Pressable>
          </View>
          <Pressable style={styles.bellButton} accessibilityLabel="Notifications">
            <Feather name="bell" size={20} color="#111827" />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.careCard}>
          <View style={styles.careCardTop}>
            {primaryPet ? (
              <PetAvatar
                name={primaryPet.name}
                photoStorageKey={primaryPet.photoStorageKey}
                size={48}
              />
            ) : (
              <View style={styles.careAvatarPlaceholder}>
                <FontAwesome name="paw" size={20} color={BRAND_PURPLE_DARK} />
              </View>
            )}
            <View style={styles.careCardCopy}>
              <Text style={styles.careCardTitle}>
                Today for {primaryPet?.name ?? 'your pet'}
              </Text>
              {dueLine ? (
                <Text style={styles.careDueLine}>{dueLine}</Text>
              ) : (
                <Text style={styles.careCardSub}>
                  {careProgress.done} of {careProgress.total} care tasks done this month
                </Text>
              )}
            </View>
            <Pressable onPress={openPetsTab}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(careProgress.ratio * 100)}%` }]} />
          </View>
          <View style={styles.nextUpBox}>
            <View style={styles.nextUpIcon}>
              <Feather name="droplet" size={18} color="#15803D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextUpLabel}>NEXT UP</Text>
              <Text style={styles.nextUpTitle}>
                {nextEvent?.title ?? 'Add your care schedule'}
              </Text>
              {nextEvent ? (
                <Text style={styles.nextUpWhen}>
                  {new Date(`${nextEvent.eventDate.slice(0, 10)}T12:00:00`).toLocaleDateString(
                    'en-US',
                    { weekday: 'short', day: 'numeric', month: 'short' },
                  )}
                  {nextEvent.subtitle ? ` · ${nextEvent.subtitle}` : ''}
                  {nextEvent.providerName ? ` · Dr. ${nextEvent.providerName}` : ''}
                </Text>
              ) : (
                <Text style={styles.nextUpWhen}>Tap My Pets to plan vet visits and meds.</Text>
              )}
            </View>
          </View>
          <View style={styles.nextUpActions}>
            <Pressable style={styles.primaryMiniBtn}>
              <Text style={styles.primaryMiniBtnText}>Add to calendar</Text>
            </Pressable>
            <Pressable style={styles.outlineMiniBtn}>
              <Text style={styles.outlineMiniBtnText}>Remind me later</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.scanTagBtn} accessibilityLabel="Scan a tag">
          <Feather name="maximize" size={22} color="#FFFFFF" />
          <Text style={styles.scanTagText}>Scan a tag</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby alerts</Text>
        </View>
        <View style={styles.alertCard}>
          <View style={styles.alertIcon}>
            <Feather name="volume-2" size={18} color="#9A3412" />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.alertTitle}>Lost dog near Sector 50 · 1.2 km</Text>
            <Text style={styles.alertBody}>
              Brown Indie with a red collar. Tap Community to share sightings.
            </Text>
          </View>
        </View>
        <View style={styles.alertCard}>
          <View style={[styles.alertIcon, { backgroundColor: '#DBEAFE' }]}>
            <Feather name="droplet" size={18} color="#1D4ED8" />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.alertTitle}>Free rabies camp · Sector 62</Text>
            <Text style={styles.alertBody}>This weekend · Carry last vaccination card if you have one.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PADDING,
    marginBottom: 16,
    gap: 12,
  },
  greetingBlock: { flex: 1, paddingHorizontal: 8, gap: 2 },
  greetingText: { fontSize: 13, color: '#6B7280' },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    maxWidth: 160,
  },
  careCard: {
    marginHorizontal: H_PADDING,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  careCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  careCardCopy: { flex: 1, gap: 2 },
  careCardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  careCardSub: { fontSize: 12, color: '#6B7280' },
  careDueLine: { fontSize: 13, fontWeight: '600', color: '#4C1D95' },
  scanTagBtn: {
    marginHorizontal: H_PADDING,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: BRAND_PURPLE_DARK,
    borderRadius: 16,
    paddingVertical: 16,
  },
  scanTagText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  alertCard: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: H_PADDING,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  alertBody: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  viewAll: { fontSize: 13, fontWeight: '600', color: BRAND_PURPLE_DARK },
  careAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND_PURPLE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: BRAND_PURPLE_LIGHT,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: BRAND_PURPLE_DARK,
  },
  nextUpBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 12,
  },
  nextUpIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextUpLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
  nextUpTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2 },
  nextUpWhen: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  nextUpActions: { flexDirection: 'row', gap: 10 },
  primaryMiniBtn: {
    flex: 1,
    backgroundColor: BRAND_PURPLE_DARK,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryMiniBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  outlineMiniBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND_PURPLE_DARK,
    backgroundColor: '#FFFFFF',
  },
  outlineMiniBtnText: { color: BRAND_PURPLE_DARK, fontWeight: '700', fontSize: 13 },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: H_PADDING,
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroWrap: {
    paddingHorizontal: H_PADDING,
    marginBottom: 20,
  },
  heroBanner: {
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 168,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  heroPawTop: {
    position: 'absolute',
    left: 18,
    top: 14,
    transform: [{ rotate: '-18deg' }],
  },
  heroPawBottom: {
    position: 'absolute',
    left: 52,
    bottom: 18,
    transform: [{ rotate: '12deg' }],
  },
  heroCopy: {
    flex: 1,
    paddingVertical: 20,
    paddingLeft: 18,
    paddingRight: 8,
    maxWidth: '58%',
  },
  heroTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 28,
  },
  heroTitleAccent: {
    color: BRAND_PURPLE_DARK,
    fontWeight: '700',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },
  heroCta: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND_PURPLE_DARK,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  heroCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroDog: {
    position: 'absolute',
    right: -8,
    bottom: 0,
    width: '46%',
    height: '100%',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: H_PADDING,
    gap: 12,
    marginBottom: 22,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: BRAND_PURPLE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: H_PADDING,
    marginBottom: 14,
  },
  nearbyHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_PURPLE_DARK,
  },
  categoriesRow: {
    paddingHorizontal: H_PADDING,
    gap: 18,
    marginBottom: 24,
    paddingBottom: 4,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 8,
  },
  categoryIconCircle: {
    backgroundColor: BRAND_PURPLE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconCircleActive: {
    borderWidth: 3,
    borderColor: BRAND_PURPLE_DARK,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryLabelActive: {
    color: '#111827',
    fontWeight: '600',
  },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  featuredImageWrap: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  featuredImageFill: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  featuredBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  featuredBreed: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaGender: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  metaTrait: {
    fontSize: 12,
    color: '#6B7280',
  },
  nearbyRow: {
    flexDirection: 'row',
    paddingHorizontal: H_PADDING,
    gap: 12,
    paddingBottom: 8,
  },
  nearbyCard: {
    width: 132,
    height: 132,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  nearbyImage: {
    width: '100%',
    height: '100%',
  },
  nearbyHeartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
