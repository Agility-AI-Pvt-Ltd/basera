import Feather from '@expo/vector-icons/Feather';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { reportListing, useAdoptionListing } from '@/hooks/useAdoption';
import { supabase } from '@/lib/supabase';
import type { AdoptStackParamList } from '@/src/navigation/types';
import { REPORT_REASONS } from '@/types/adoption';

type Nav = NativeStackNavigationProp<AdoptStackParamList, 'ListingDetail'>;
type Route = RouteProp<AdoptStackParamList, 'ListingDetail'>;

const BRAND = '#7C3AED';

export default function ListingDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { listing, loading } = useAdoptionListing(params.listingId);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const cover = listing?.media?.find((m) => m.mediaType === 'image' && m.url);

  const handleReport = () => {
    const run = async (reason: string) => {
      try {
        await reportListing(params.listingId, reason);
        Alert.alert('Report submitted', 'Thank you. Our team will review this listing.');
      } catch (err) {
        Alert.alert('Report failed', err instanceof Error ? err.message : 'Try again');
      }
    };
    if (Platform.OS === 'web') {
      void run(REPORT_REASONS[0]);
      return;
    }
    Alert.alert('Report listing', 'Choose a reason', [
      ...REPORT_REASONS.slice(0, 4).map((reason) => ({
        text: reason,
        onPress: () => void run(reason),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (loading || !listing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  const isOwner = userId === listing.listedBy;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <BackButton onFallback={() => navigation.goBack()} />
        <Pressable onPress={handleReport} style={styles.reportBtn}>
          <Feather name="flag" size={16} color="#B91C1C" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {cover?.url ? (
            <Image source={{ uri: cover.url }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={{ fontSize: 48 }}>🐾</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{listing.petName}</Text>
          <Text style={styles.meta}>
            {listing.breed || 'Mixed'} · {listing.gender ?? '—'} · {listing.ageLabel || 'Age unknown'}
          </Text>
          <Text style={styles.location}>📍 {listing.publicLocationLabel || listing.city}</Text>
          <Text style={styles.tagline}>❤️ Looking for a loving home</Text>

          {listing.status === 'pending_verification' ? (
            <Text style={styles.pending}>Pending verification — not yet publicly promoted</Text>
          ) : null}

          <Section title="About">
            <Text style={styles.body}>{listing.description || 'No description yet.'}</Text>
          </Section>

          {listing.temperamentTags.length > 0 ? (
            <Section title="Temperament">
              {listing.temperamentTags.map((t) => (
                <Text key={t} style={styles.bullet}>
                  ✓ {t}
                </Text>
              ))}
            </Section>
          ) : null}

          <Section title="Health">
            {listing.vaccinationTags.length > 0 ? (
              <Text style={styles.bullet}>✓ Vaccinated ({listing.vaccinationTags.join(', ')})</Text>
            ) : (
              <Text style={styles.muted}>Vaccination records not provided</Text>
            )}
            {listing.sterilized ? <Text style={styles.bullet}>✓ Sterilized</Text> : null}
          </Section>

          <Section title="Adoption information">
            {listing.adoptionPreferences.childrenOk ? (
              <Text style={styles.bullet}>👨‍👩‍👧 Good with children</Text>
            ) : null}
            {listing.adoptionPreferences.otherPetsOk ? (
              <Text style={styles.bullet}>🐕 Other pets okay</Text>
            ) : null}
            {listing.adoptionRequirements.meetAndGreet ? (
              <Text style={styles.bullet}>Meet & greet requested</Text>
            ) : null}
          </Section>

          <Text style={styles.disclaimer}>
            Adoption only — not a marketplace sale. Basera does not verify legal ownership; listers are
            responsible for accurate information.
          </Text>
        </View>
      </ScrollView>

      {!isOwner && listing.status === 'active' ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('ApplyAdoption', { listingId: listing.id })}>
            <Feather name="heart" size={18} color="#FFFFFF" />
            <Text style={styles.primaryText}>Apply to Adopt</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('ApplyAdoption', { listingId: listing.id })}>
            <Feather name="message-circle" size={18} color={BRAND} />
            <Text style={styles.secondaryText}>Contact via application</Text>
          </Pressable>
        </View>
      ) : isOwner ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() =>
              navigation.navigate('ListerApplications', { listingId: listing.id, petName: listing.petName })
            }>
            <Text style={styles.primaryText}>
              Applications ({listing.applicationCount ?? 0})
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  reportBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 280, backgroundColor: '#F3F4F6' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 8 },
  name: { fontFamily: FONT_FAMILY, fontSize: 28, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 15, color: '#6B7280' },
  location: { fontSize: 14, color: '#374151' },
  tagline: { fontSize: 14, color: BRAND, fontWeight: '600', marginTop: 4 },
  pending: { fontSize: 13, color: '#D97706', marginTop: 6 },
  section: { marginTop: 16, gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  body: { fontSize: 15, color: '#374151', lineHeight: 22 },
  bullet: { fontSize: 14, color: '#374151' },
  muted: { fontSize: 14, color: '#9CA3AF' },
  disclaimer: { fontSize: 11, color: '#9CA3AF', lineHeight: 16, marginTop: 12 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: BRAND,
    borderRadius: 14,
    paddingVertical: 12,
  },
  secondaryText: { color: BRAND, fontWeight: '600', fontSize: 15 },
});
