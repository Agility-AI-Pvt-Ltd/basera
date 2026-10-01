import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { Text } from '@/components/Themed';
import { useListingApplications } from '@/hooks/useAdoption';
import { matchStrengthLabel } from '@/lib/adoptionCompatibility';
import type { AdoptStackParamList } from '@/src/navigation/types';

type Nav = NativeStackNavigationProp<AdoptStackParamList, 'ListerApplications'>;
type Route = RouteProp<AdoptStackParamList, 'ListerApplications'>;

export default function ListerApplicationsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { applications, loading } = useListingApplications(params.listingId);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <BackButton onFallback={() => navigation.goBack()} />
        <Text style={styles.title}>{params.petName} · Applications</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#7C3AED" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {applications.length === 0 ? (
            <Text style={styles.empty}>No applications yet.</Text>
          ) : (
            applications.map((app) => {
              const profile = app.applicantProfile;
              const name = String(profile.fullName ?? 'Applicant');
              const city = String(profile.city ?? '');
              const score = app.compatibilityScore ?? 0;
              return (
                <Pressable
                  key={app.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('ApplicationReview', {
                      applicationId: app.id,
                      listingId: params.listingId,
                    })
                  }>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.meta}>{city || 'City not provided'}</Text>
                  <Text style={styles.match}>
                    ⭐ {matchStrengthLabel(score)} · {score}%
                  </Text>
                  <Text style={styles.review}>Review →</Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  empty: { color: '#9CA3AF', textAlign: 'center', marginTop: 32 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  name: { fontSize: 17, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  match: { fontSize: 14, color: '#7C3AED', fontWeight: '600', marginTop: 8 },
  review: { fontSize: 14, color: '#374151', marginTop: 8, fontWeight: '600' },
});
