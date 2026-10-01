import Feather from '@expo/vector-icons/Feather';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import {
  createPackPost,
  joinPack,
  leavePack,
  usePackDetail,
} from '@/hooks/useCommunity';
import { supabase } from '@/lib/supabase';
import type { CommunityStackParamList } from '@/src/navigation/types';
import { PACK_CATEGORY_OPTIONS } from '@/types/community';

type Props = NativeStackScreenProps<CommunityStackParamList, 'PackDetail'>;
const BRAND = '#7C3AED';

export default function PackDetailScreen({ navigation, route }: Props) {
  const { packId } = route.params;
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string | null>(null);
  const [postBody, setPostBody] = useState('');
  const [posting, setPosting] = useState(false);
  const { pack, posts, loading, reload } = usePackDetail(packId, userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
  }, []);

  const cat = PACK_CATEGORY_OPTIONS.find((c) => c.id === pack?.category);

  const onJoinLeave = async () => {
    if (!pack || !userId) return;
    if (pack.isMember) {
      const { error } = await leavePack(pack, userId);
      if (error) Alert.alert('Error', error);
    } else {
      const { error } = await joinPack(pack, userId);
      if (error) Alert.alert('Error', error);
      else if (pack.privacy === 'approval') Alert.alert('Request sent', 'An admin will approve your join request.');
    }
    reload();
  };

  const submitPost = async () => {
    if (!userId || !postBody.trim()) return;
    setPosting(true);
    const { error } = await createPackPost(packId, userId, postBody);
    setPosting(false);
    if (error) Alert.alert('Could not post', error);
    else {
      setPostBody('');
      reload();
    }
  };

  if (loading || !pack) {
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
        <View style={styles.cover}>
          <Text style={styles.coverEmoji}>{cat?.emoji ?? '🐾'}</Text>
        </View>
        <Text style={styles.name}>{pack.name}</Text>
        <Text style={styles.meta}>
          {pack.memberCount} members · {[pack.area, pack.city].filter(Boolean).join(', ')}
        </Text>
        <Pressable style={[styles.cta, pack.isMember && styles.ctaJoined]} onPress={onJoinLeave}>
          <Text style={[styles.ctaText, pack.isMember && styles.ctaTextJoined]}>
            {pack.isMember ? 'Joined ✓' : pack.privacy === 'approval' ? 'Request to join' : 'Join pack'}
          </Text>
        </Pressable>

        <Text style={styles.section}>About</Text>
        <Text style={styles.about}>{pack.description || 'No description yet.'}</Text>

        <Text style={styles.section}>Feed</Text>
        {pack.isMember ? (
          <View style={styles.compose}>
            <TextInput
              value={postBody}
              onChangeText={setPostBody}
              placeholder="Share with the pack…"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              multiline
            />
            <Pressable style={styles.postBtn} onPress={submitPost} disabled={posting}>
              <Text style={styles.postBtnText}>{posting ? '…' : 'Post'}</Text>
            </Pressable>
          </View>
        ) : null}
        {posts.length === 0 ? (
          <Text style={styles.emptyFeed}>No posts yet.</Text>
        ) : (
          posts.map((p) => (
            <View key={p.id} style={styles.post}>
              <Text style={styles.postAuthor}>{p.authorName ?? 'Member'}</Text>
              <Text style={styles.postBody}>{p.body}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { paddingHorizontal: 20, paddingVertical: 8 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  cover: {
    height: 120,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  coverEmoji: { fontSize: 48 },
  name: { fontFamily: FONT_FAMILY, fontSize: 24, fontWeight: '600', color: '#111827' },
  meta: { marginTop: 6, fontSize: 14, color: '#6B7280' },
  cta: {
    marginTop: 16,
    backgroundColor: BRAND,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaJoined: { backgroundColor: '#E5E7EB' },
  ctaText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  ctaTextJoined: { color: '#374151' },
  section: { marginTop: 24, marginBottom: 8, fontSize: 17, fontWeight: '600', color: '#111827' },
  about: { fontSize: 15, lineHeight: 22, color: '#4B5563' },
  compose: { marginBottom: 12 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlignVertical: 'top',
  },
  postBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    backgroundColor: BRAND,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  postBtnText: { color: '#FFF', fontWeight: '600' },
  emptyFeed: { color: '#9CA3AF' },
  post: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  postAuthor: { fontWeight: '600', color: '#111827' },
  postBody: { marginTop: 6, fontSize: 15, lineHeight: 21, color: '#374151' },
});
