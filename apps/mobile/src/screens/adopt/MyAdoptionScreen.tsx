import Feather from '@expo/vector-icons/Feather';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { Text } from '@/components/Themed';
import { useMyAdoptionListings, useMyApplications } from '@/hooks/useAdoption';
import type { AdoptStackParamList } from '@/src/navigation/types';
import { APPLICATION_STATUS_LABELS } from '@/types/adoption';
import { matchStrengthLabel } from '@/lib/adoptionCompatibility';

type Nav = NativeStackNavigationProp<AdoptStackParamList, 'MyAdoption'>;

export default function MyAdoptionScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const listings = useMyAdoptionListings();
  const applications = useMyApplications();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <BackButton onFallback={() => navigation.goBack()} />
        <Text style={styles.title}>My adoption</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.section}>My listings</Text>
        {listings.loading ? (
          <ActivityIndicator color="#7C3AED" />
        ) : listings.listings.length === 0 ? (
          <Text style={styles.empty}>No listings yet.</Text>
        ) : (
          listings.listings.map((l) => (
            <Pressable
              key={l.id}
              style={styles.card}
              onPress={() => navigation.navigate('ListingDetail', { listingId: l.id })}>
              <Text style={styles.cardTitle}>
                🐶 {l.petName} · {l.status.replace('_', ' ')}
              </Text>
              <Text style={styles.cardMeta}>{l.applicationCount ?? 0} applicants</Text>
              <Pressable
                style={styles.reviewBtn}
                onPress={() =>
                  navigation.navigate('ListerApplications', { listingId: l.id, petName: l.petName })
                }>
                <Text style={styles.reviewText}>Review applications</Text>
                <Feather name="chevron-right" size={16} color="#7C3AED" />
              </Pressable>
            </Pressable>
          ))
        )}

        <Text style={[styles.section, { marginTop: 24 }]}>My applications</Text>
        {applications.loading ? (
          <ActivityIndicator color="#7C3AED" />
        ) : applications.applications.length === 0 ? (
          <Text style={styles.empty}>No applications yet.</Text>
        ) : (
          applications.applications.map((a) => (
            <Pressable
              key={a.id}
              style={styles.card}
              onPress={() => navigation.navigate('AdoptionChat', { applicationId: a.id, title: 'Adoption' })}>
              <Text style={styles.cardTitle}>Application · {APPLICATION_STATUS_LABELS[a.status]}</Text>
              {a.compatibilityScore != null ? (
                <Text style={styles.cardMeta}>
                  {matchStrengthLabel(a.compatibilityScore)} ({a.compatibilityScore}%)
                </Text>
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  section: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  empty: { color: '#9CA3AF', fontSize: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardMeta: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 },
  reviewText: { color: '#7C3AED', fontWeight: '600', fontSize: 14 },
});
