import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { formatDistanceKm } from '@/lib/geo';
import type { NeighborProfile } from '@/types/community';

type Props = {
  neighbor: NeighborProfile;
  onPress: () => void;
};

export function NeighborCard({ neighbor, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {neighbor.photoUri ? (
        <Image source={{ uri: neighbor.photoUri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.initials}>{neighbor.name.charAt(0) || '?'}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name}>{neighbor.name}</Text>
        <Text style={styles.meta}>{formatDistanceKm(neighbor.distanceKm)}</Text>
        {neighbor.petName ? (
          <Text style={styles.pet}>
            🐕 {neighbor.petName}
            {neighbor.petBreed ? ` · ${neighbor.petBreed}` : ''}
          </Text>
        ) : null}
      </View>
      {neighbor.connectionStatus === 'accepted' ? (
        <Text style={styles.connected}>Connected</Text>
      ) : neighbor.connectionStatus === 'pending' ? (
        <Text style={styles.pending}>Pending</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarPlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  body: { flex: 1 },
  name: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  meta: { marginTop: 2, fontSize: 13, color: '#6B7280' },
  pet: { marginTop: 4, fontSize: 13, color: '#4B5563' },
  connected: { fontSize: 12, color: '#059669', fontWeight: '600' },
  pending: { fontSize: 12, color: '#D97706', fontWeight: '600' },
});
