import Feather from '@expo/vector-icons/Feather';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { CoverImage } from '@/components/CoverImage';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import type { CommunityPack } from '@/types/community';

import { formatDistanceShort, packCoverSource } from './packCover';

const BRAND = '#7C3AED';
const BRAND_LIGHT = '#EDE9FE';

type Props = {
  pack: CommunityPack;
  onPress: () => void;
  onJoin?: () => void;
  compact?: boolean;
};

export function PackCard({ pack, onPress, onJoin }: Props) {
  const showMenu = () => {
    Alert.alert(pack.name, undefined, [
      { text: 'View pack', onPress },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <CoverImage source={packCoverSource(pack)} style={styles.thumb} borderRadius={14} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {pack.name}
        </Text>
        <View style={styles.metaRow}>
          <Feather name="map-pin" size={12} color={BRAND} style={styles.metaIcon} />
          <Text style={styles.metaText} numberOfLines={1}>
            {formatDistanceShort(pack.distanceKm)} · {pack.memberCount} members
          </Text>
        </View>
        <Text style={styles.desc} numberOfLines={1}>
          {pack.description || `Weekly walks and playdates in ${pack.area || pack.city}.`}
        </Text>
      </View>
      <View style={styles.actions}>
        {pack.isMember ? (
          <View style={styles.joinedBtn}>
            <Text style={styles.joinedText}>Joined</Text>
          </View>
        ) : onJoin ? (
          <Pressable
            style={styles.joinBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onJoin();
            }}>
            <Text style={styles.joinText}>Join</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.menuBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            showMenu();
          }}
          accessibilityLabel="More options">
          <Feather name="more-vertical" size={18} color="#9CA3AF" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  thumb: {
    width: 64,
    height: 64,
    marginRight: 12,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingRight: 8,
    justifyContent: 'center',
  },
  name: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  metaIcon: { flexShrink: 0 },
  metaText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
  desc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 6,
    flexShrink: 0,
  },
  joinBtn: {
    backgroundColor: BRAND,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  joinText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  joinedBtn: {
    backgroundColor: BRAND_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  joinedText: { color: BRAND, fontSize: 13, fontWeight: '700' },
  menuBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
