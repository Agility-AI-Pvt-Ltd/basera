import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { Text } from '@/components/Themed';
import { useAdoptionListing, useListingApplications } from '@/hooks/useAdoption';
import type { AdoptStackParamList } from '@/src/navigation/types';
import { APPLICATION_STATUS_LABELS } from '@/types/adoption';

type Nav = NativeStackNavigationProp<AdoptStackParamList, 'ApplicationReview'>;
type Route = RouteProp<AdoptStackParamList, 'ApplicationReview'>;

export default function ApplicationReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { listing } = useAdoptionListing(params.listingId);
  const { applications, updateStatus } = useListingApplications(params.listingId);
  const application = applications.find((a) => a.id === params.applicationId);
  const [busy, setBusy] = useState(false);

  if (!application) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  const profile = application.applicantProfile;
  const answers = application.answers;

  const act = async (status: typeof application.status) => {
    setBusy(true);
    try {
      await updateStatus(application.id, status);
      navigation.goBack();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <BackButton onFallback={() => navigation.goBack()} />
        <Text style={styles.title}>Application review</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={styles.name}>{String(profile.fullName ?? 'Applicant')}</Text>
        <Text style={styles.status}>{APPLICATION_STATUS_LABELS[application.status]}</Text>

        <Section title="Compatibility insights">
          <Text style={styles.score}>{application.compatibilityScore ?? 0}% match</Text>
          {application.compatibilityInsights.map((i, idx) => (
            <Text key={idx} style={i.type === 'warning' ? styles.warn : styles.positive}>
              {i.type === 'warning' ? '⚠' : '✓'} {i.text}
            </Text>
          ))}
        </Section>

        <Section title="Applicant answers">
          <Text style={styles.line}>Why adopt: {String(answers.whyAdopt ?? '—')}</Text>
          <Text style={styles.line}>Why this pet: {String(answers.whyThisPet ?? '—')}</Text>
        </Section>

        <Section title="Home">
          <Text style={styles.line}>Type: {String(application.home.type ?? '—')}</Text>
        </Section>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable
          style={styles.msgBtn}
          onPress={() =>
            navigation.navigate('AdoptionChat', {
              applicationId: application.id,
              title: listing?.petName ?? 'Adoption',
            })
          }>
          <Text style={styles.msgText}>Message</Text>
        </Pressable>
        <Pressable style={styles.approveBtn} disabled={busy} onPress={() => void act('approved')}>
          <Text style={styles.approveText}>Approve</Text>
        </Pressable>
        <Pressable style={styles.rejectBtn} disabled={busy} onPress={() => void act('rejected')}>
          <Text style={styles.rejectText}>Reject</Text>
        </Pressable>
      </View>
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
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '700', color: '#111827' },
  status: { color: '#6B7280', marginTop: 4, marginBottom: 12 },
  section: { marginTop: 16, gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  score: { fontSize: 18, fontWeight: '700', color: '#7C3AED' },
  positive: { fontSize: 14, color: '#166534' },
  warn: { fontSize: 14, color: '#B45309' },
  line: { fontSize: 14, color: '#374151', lineHeight: 20 },
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
  msgBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  msgText: { color: '#7C3AED', fontWeight: '600' },
  approveBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
  },
  approveText: { color: '#FFFFFF', fontWeight: '700' },
  rejectBtn: { alignItems: 'center', paddingVertical: 10 },
  rejectText: { color: '#B91C1C', fontWeight: '600' },
});
