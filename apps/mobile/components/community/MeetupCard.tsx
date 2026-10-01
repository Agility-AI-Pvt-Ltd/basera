import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { formatDistanceKm } from '@/lib/geo';
import type { CommunityMeetup } from '@/types/community';

const BRAND = '#7C3AED';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return `Today · ${time}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString(undefined, { weekday: 'short' })} · ${time}`;
}

type Props = {
  meetup: CommunityMeetup;
  onPress: () => void;
};

export function MeetupCard({ meetup, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.icon}>
        <Feather name="map-pin" size={20} color={BRAND} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {meetup.title}
        </Text>
        <Text style={styles.meta}>{formatWhen(meetup.startAt)}</Text>
        <Text style={styles.meta}>
          {formatDistanceKm(meetup.distanceKm)}
          {meetup.locationName ? ` · ${meetup.locationName}` : ''}
        </Text>
        <Text style={styles.going}>{meetup.goingCount ?? 0} going</Text>
      </View>
      {meetup.userAttendance === 'going' ? (
        <Text style={styles.badge}>Going</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  body: { flex: 1 },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  meta: { marginTop: 4, fontSize: 13, color: '#6B7280' },
  going: { marginTop: 6, fontSize: 12, color: BRAND, fontWeight: '600' },
  badge: { fontSize: 12, color: '#059669', fontWeight: '600', marginLeft: 8 },
});
