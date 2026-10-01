import Feather from '@expo/vector-icons/Feather';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { requestConnection } from '@/hooks/useCommunity';
import { distanceKm } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { CommunityStackParamList } from '@/src/navigation/types';

type Props = NativeStackScreenProps<CommunityStackParamList, 'NeighborDetail'>;
const BRAND = '#7C3AED';

export default function NeighborDetailScreen({ navigation, route }: Props) {
  const { userId: neighborId } = route.params;
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [petName, setPetName] = useState<string | undefined>();
  const [petBreed, setPetBreed] = useState<string | undefined>();
  const [distance, setDistance] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id ?? null;
      if (!cancelled) setMyId(uid);

      const { data: prof } = await supabase
        .from('profiles')
        .select('name, city, locality, photo_uri, locality_lat, locality_lng, pet, show_pet_to_neighbors')
        .eq('id', neighborId)
        .maybeSingle();

      if (prof && !cancelled) {
        setName(prof.name as string);
        setCity(prof.city as string);
        setLocality(prof.locality as string);
        setPhotoUri((prof.photo_uri as string | null) ?? null);
        const draft = prof.pet as { name?: string; breed?: string } | null;
        if (prof.show_pet_to_neighbors !== false && draft) {
          setPetName(draft.name);
          setPetBreed(draft.breed);
        }
        if (profile?.localityPin && prof.locality_lat != null && prof.locality_lng != null) {
          setDistance(
            distanceKm(profile.localityPin, {
              latitude: Number(prof.locality_lat),
              longitude: Number(prof.locality_lng),
            }),
          );
        }
      }

      const { data: pets } = await supabase
        .from('pets')
        .select('name, breed')
        .eq('owner_id', neighborId)
        .limit(1);
      if (pets?.[0] && !cancelled) {
        setPetName(pets[0].name as string);
        setPetBreed(pets[0].breed as string);
      }

      if (uid) {
        const { data: conn } = await supabase
          .from('community_connections')
          .select('status')
          .or(
            `and(requester_id.eq.${uid},recipient_id.eq.${neighborId}),and(requester_id.eq.${neighborId},recipient_id.eq.${uid})`,
          )
          .maybeSingle();
        if (conn?.status === 'accepted') setConnectionStatus('accepted');
        else if (conn?.status === 'pending') setConnectionStatus('pending');
      }

      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [neighborId, profile?.localityPin]);

  const connect = async () => {
    if (!myId) return;
    const { error } = await requestConnection(myId, neighborId);
    if (error) Alert.alert('Could not connect', error);
    else {
      setConnectionStatus('pending');
      Alert.alert('Request sent', 'They can accept your connection request.');
    }
  };

  if (loading) {
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
      <View style={styles.content}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder]}>
            <Text style={styles.initials}>{name.charAt(0) || '?'}</Text>
          </View>
        )}
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.loc}>
          📍 Nearby in {[locality, city].filter(Boolean).join(', ') || 'your area'}
          {distance != null ? ` · ${Math.round(distance * 10) / 10} km` : ''}
        </Text>
        {petName ? (
          <View style={styles.petCard}>
            <Text style={styles.petTitle}>🐕 {petName}</Text>
            {petBreed ? <Text style={styles.petBreed}>{petBreed}</Text> : null}
          </View>
        ) : null}

        {connectionStatus === 'accepted' ? (
          <Text style={styles.connected}>Connected</Text>
        ) : connectionStatus === 'pending' ? (
          <Text style={styles.pending}>Connection pending</Text>
        ) : (
          <Pressable style={styles.cta} onPress={connect}>
            <Text style={styles.ctaText}>Connect</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { paddingHorizontal: 20, paddingVertical: 8 },
  content: { paddingHorizontal: 24, alignItems: 'center' },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 16 },
  placeholder: { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 36, color: '#6B7280', fontWeight: '600' },
  name: { fontFamily: FONT_FAMILY, fontSize: 24, fontWeight: '600', color: '#111827' },
  loc: { marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' },
  petCard: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  petTitle: { fontSize: 17, fontWeight: '600' },
  petBreed: { marginTop: 4, color: '#6B7280' },
  cta: {
    marginTop: 32,
    width: '100%',
    backgroundColor: BRAND,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  connected: { marginTop: 32, color: '#059669', fontWeight: '600' },
  pending: { marginTop: 32, color: '#D97706', fontWeight: '600' },
});
