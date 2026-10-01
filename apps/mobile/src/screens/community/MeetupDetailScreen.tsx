import Feather from '@expo/vector-icons/Feather';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { setMeetupAttendance, useMeetupDetail } from '@/hooks/useCommunity';
import { supabase } from '@/lib/supabase';
import type { CommunityStackParamList } from '@/src/navigation/types';

type Props = NativeStackScreenProps<CommunityStackParamList, 'MeetupDetail'>;
const BRAND = '#7C3AED';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MeetupDetailScreen({ navigation, route }: Props) {
  const { meetupId } = route.params;
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string | null>(null);
  const { meetup, loading, reload } = useMeetupDetail(meetupId, userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
  }, []);

  const toggleGoing = async () => {
    if (!userId || !meetup) return;
    const next = meetup.userAttendance === 'going' ? null : 'going';
    const { error } = await setMeetupAttendance(meetupId, userId, next);
    if (error) Alert.alert('Error', error);
    else reload();
  };

  if (loading || !meetup) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={BRAND} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{meetup.title}</Text>
        <Text style={styles.when}>{formatWhen(meetup.startAt)}</Text>
        <View style={styles.locRow}>
          <Feather name="map-pin" size={16} color={BRAND} />
          <Text style={styles.loc}>
            {meetup.locationName || 'Public location'}
            {meetup.area ? ` · ${meetup.area}` : ''}
          </Text>
        </View>
        <Text style={styles.host}>Hosted by {meetup.hostName ?? 'a community member'}</Text>
        <Text style={styles.going}>{meetup.goingCount ?? 0} people going</Text>

        <Text style={styles.section}>About</Text>
        <Text style={styles.about}>{meetup.description || 'No description.'}</Text>

        <Pressable
          style={[styles.cta, meetup.userAttendance === 'going' && styles.ctaOn]}
          onPress={toggleGoing}>
          <Text style={[styles.ctaText, meetup.userAttendance === 'going' && styles.ctaTextOn]}>
            {meetup.userAttendance === 'going' ? "✓ I'm going" : "I'm going"}
          </Text>
        </Pressable>

        <Text style={styles.safety}>📍 Public location · 🚩 Report meetup (coming soon)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { paddingHorizontal: 20, paddingVertical: 8 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontFamily: FONT_FAMILY, fontSize: 26, fontWeight: '600', color: '#111827' },
  when: { marginTop: 8, fontSize: 16, color: '#4B5563' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  loc: { flex: 1, fontSize: 15, color: '#374151' },
  host: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  going: { marginTop: 4, fontSize: 15, fontWeight: '600', color: BRAND },
  section: { marginTop: 24, marginBottom: 8, fontSize: 17, fontWeight: '600' },
  about: { fontSize: 15, lineHeight: 22, color: '#4B5563' },
  cta: {
    marginTop: 24,
    backgroundColor: BRAND,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaOn: { backgroundColor: '#E5E7EB' },
  ctaText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  ctaTextOn: { color: '#374151' },
  safety: { marginTop: 16, fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});
