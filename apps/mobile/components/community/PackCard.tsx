import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { formatDistanceKm } from '@/lib/geo';
import type { CommunityPack } from '@/types/community';
import { PACK_CATEGORY_OPTIONS } from '@/types/community';

const BRAND = '#7C3AED';

type Props = {
  pack: CommunityPack;
  onPress: () => void;
  onJoin?: () => void;
  compact?: boolean;
};

export function PackCard({ pack, onPress, onJoin, compact }: Props) {
  const cat = PACK_CATEGORY_OPTIONS.find((c) => c.id === pack.category);

  return (
    <Pressable style={[styles.card, compact && styles.cardCompact]} onPress={onPress}>
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{cat?.emoji ?? '🐾'}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {pack.name}
        </Text>
        <Text style={styles.meta}>
          {formatDistanceKm(pack.distanceKm)} · {pack.memberCount} members
        </Text>
        {!compact && pack.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {pack.description}
          </Text>
        ) : null}
      </View>
      {onJoin && !pack.isMember ? (
        <Pressable
          style={styles.joinBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            onJoin();
          }}>
          <Text style={styles.joinText}>Join</Text>
        </Pressable>
      ) : pack.isMember ? (
        <Text style={styles.joined}>Joined</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardCompact: { paddingVertical: 12 },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: { fontSize: 22 },
  body: { flex: 1 },
  name: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  meta: { marginTop: 4, fontSize: 13, color: '#6B7280' },
  desc: { marginTop: 6, fontSize: 13, color: '#4B5563', lineHeight: 18 },
  joinBtn: {
    backgroundColor: BRAND,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  joinText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  joined: { marginLeft: 8, fontSize: 12, color: BRAND, fontWeight: '600' },
});
