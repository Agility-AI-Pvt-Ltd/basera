import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, View } from 'react-native';

import { CoverImage } from '@/components/CoverImage';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import type { CommunityPack } from '@/types/community';

import { formatDistanceShort, packCoverSource } from './packCover';

const BRAND = '#7C3AED';
const CARD_WIDTH = 248;

type Props = {
  pack: CommunityPack;
  onPress: () => void;
  onJoin: () => void;
};

export function RecommendedPackCard({ pack, onPress, onJoin }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageWrap}>
        <CoverImage source={packCoverSource(pack)} style={styles.image} />
        <View style={styles.distanceBadge}>
          <Feather name="map-pin" size={11} color={BRAND} />
          <Text style={styles.distanceText}>{formatDistanceShort(pack.distanceKm)}</Text>
        </View>
        <Pressable style={styles.heartBtn} accessibilityLabel="Save pack">
          <Feather name="heart" size={16} color="#111827" />
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {pack.name}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {pack.description || `Connect with pet lovers in ${pack.area || pack.city}.`}
        </Text>
        <View style={styles.membersRow}>
          <View style={styles.avatarStack}>
            <View style={[styles.avatar, styles.avatarA]} />
            <View style={[styles.avatar, styles.avatarB]} />
            <View style={[styles.avatar, styles.avatarC]} />
          </View>
          <Text style={styles.memberCount}>{pack.memberCount} members</Text>
        </View>
        <Pressable
          style={[styles.joinBtn, pack.isMember && styles.joinBtnJoined]}
          disabled={pack.isMember}
          onPress={(e) => {
            e.stopPropagation?.();
            onJoin();
          }}>
          <Text style={[styles.joinText, pack.isMember && styles.joinTextJoined]}>
            {pack.isMember ? 'Joined' : 'Join Pack'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  imageWrap: {
    height: 128,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  distanceBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  distanceText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  heartBtn: {
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
  body: { padding: 12, gap: 6 },
  name: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  desc: {
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
    minHeight: 34,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  avatarStack: {
    flexDirection: 'row',
    width: 52,
    height: 22,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
  },
  avatarA: { backgroundColor: '#C4B5FD', left: 0, zIndex: 3 },
  avatarB: { backgroundColor: '#A78BFA', left: 14, zIndex: 2 },
  avatarC: { backgroundColor: '#8B5CF6', left: 28, zIndex: 1 },
  memberCount: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  joinBtn: {
    marginTop: 4,
    backgroundColor: '#EDE9FE',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND,
  },
  joinBtnJoined: {
    opacity: 0.95,
  },
  joinTextJoined: {
    color: '#6B7280',
  },
});
