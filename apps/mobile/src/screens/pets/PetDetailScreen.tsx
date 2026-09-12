import Feather from '@expo/vector-icons/Feather';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DocumentStatusBadge } from '@/components/pets/DocumentStatusBadge';
import { PetAvatar } from '@/components/pets/PetAvatar';
import { NutritionDashboardView } from '@/components/pets/NutritionDashboardView';
import { TrainingRoutineView } from '@/components/pets/TrainingRoutineView';
import { BackButton } from '@/components/BackButton';
import { PrimaryButton } from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { usePetCare } from '@/hooks/usePetCare';
import { usePetDocuments } from '@/hooks/usePetDocuments';
import { usePetNutrition } from '@/hooks/usePetNutrition';
import { usePetTraining } from '@/hooks/usePetTraining';
import { usePets } from '@/hooks/usePets';
import { downloadPetDocument, viewPetDocument } from '@/lib/petDocuments';
import type { PetsStackParamList } from '@/src/navigation/types';
import type { Pet, PetDocument } from '@/types/pet';
import {
  computePetAge,
  formatGender,
  getDocumentStatus,
  PET_DOCUMENT_LABELS,
  type HealthCategory,
} from '@/types/pet';

const BRAND = '#7C3AED';
const TAB_BAR_CLEARANCE = 120;

type CareTab = 'health' | 'training' | 'nutrition';
type Nav = NativeStackNavigationProp<PetsStackParamList, 'PetDetail'>;
type Route = RouteProp<PetsStackParamList, 'PetDetail'>;

const HEALTH_COLORS: Record<HealthCategory, string> = {
  vet_visit: '#FBCFE8',
  grooming: '#FDE68A',
  medicine: '#BFDBFE',
  vaccination: '#BBF7D0',
};

export default function PetDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { getPet } = usePets();
  const { documents, isReady: docsReady, loadDocuments, deleteDocument } = usePetDocuments(
    params.petId,
  );
  const care = usePetCare(params.petId);
  const [pet, setPet] = useState<Pet | null>(null);
  const training = usePetTraining(params.petId, pet);
  const nutritionState = usePetNutrition(params.petId, pet);

  const [tab, setTab] = useState<CareTab>(params.initialTab ?? 'health');
  const [loadingPet, setLoadingPet] = useState(true);

  const refreshPet = useCallback(async () => {
    const next = await getPet(params.petId);
    setPet(next);
  }, [getPet, params.petId]);

  useFocusEffect(
    useCallback(() => {
      setLoadingPet(true);
      void Promise.all([
        refreshPet(),
        care.reload(),
        loadDocuments(),
        training.reload(),
        nutritionState.reload(),
      ]).finally(() => setLoadingPet(false));
    }, [refreshPet, care.reload, loadDocuments, training.reload, nutritionState.reload]),
  );

  if (loadingPet || !pet || !care.isReady || !docsReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <BackButton onFallback={() => navigation.navigate('MyPetsList')} />
        <Text style={styles.headerTitle}>{pet.name}</Text>
        <Pressable
          onPress={() => navigation.navigate('EditPetProfile', { petId: pet.id })}
          style={styles.editBtn}
          accessibilityLabel="Edit pet profile">
          <Feather name="edit-2" size={16} color={BRAND} />
        </Pressable>
        <PetAvatar name={pet.name} photoStorageKey={pet.photoStorageKey} size={40} />
      </View>

      <View style={styles.tabs}>
        {(['health', 'training', 'nutrition'] as CareTab[]).map((key) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={[styles.tab, tab === key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'training' ? (
        <View style={{ flex: 1, paddingBottom: TAB_BAR_CLEARANCE + insets.bottom }}>
          <TrainingTab
            pet={pet}
            training={training}
            onStartOnboarding={() =>
              navigation.navigate('TrainingOnboarding', { petId: pet.id })
            }
            onOpenPreferences={() =>
              navigation.navigate('TrainingPreferences', { petId: pet.id })
            }
          />
        </View>
      ) : tab === 'nutrition' ? (
        <View style={{ flex: 1, paddingBottom: TAB_BAR_CLEARANCE + insets.bottom }}>
          <NutritionTab
            pet={pet}
            nutrition={nutritionState}
            onStartOnboarding={() =>
              navigation.navigate('NutritionOnboarding', { petId: pet.id })
            }
            onOpenPreferences={() =>
              navigation.navigate('NutritionPreferences', { petId: pet.id })
            }
          />
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE + insets.bottom }}
        showsVerticalScrollIndicator={false}>
        {tab === 'health' ? (
          <HealthTab
            pet={pet}
            events={care.healthEvents}
            documents={documents}
            onToggle={care.toggleHealthComplete}
            onDeleteEvent={care.deleteHealthEvent}
            onAddSchedule={() => navigation.navigate('AddHealthSchedule', { petId: pet.id })}
            onEditSchedule={(eventId) =>
              navigation.navigate('AddHealthSchedule', { petId: pet.id, eventId })
            }
            onUpload={() => navigation.navigate('UploadDocument', { petId: pet.id })}
            onDeleteDocument={deleteDocument}
          />
        ) : null}
      </ScrollView>
      )}
    </View>
  );
}

function HealthTab({
  pet,
  events,
  documents,
  onToggle,
  onDeleteEvent,
  onAddSchedule,
  onEditSchedule,
  onUpload,
  onDeleteDocument,
}: {
  pet: Pet;
  events: ReturnType<typeof usePetCare>['healthEvents'];
  documents: ReturnType<typeof usePetDocuments>['documents'];
  onToggle: (id: string, completed: boolean) => void;
  onDeleteEvent: (id: string) => Promise<void>;
  onAddSchedule: () => void;
  onEditSchedule: (eventId: string) => void;
  onUpload: () => void;
  onDeleteDocument: (doc: PetDocument) => Promise<void>;
}) {
  const [scheduleEditMode, setScheduleEditMode] = useState(false);

  const confirmDeleteEvent = (id: string, title: string) => {
    const run = () => void onDeleteEvent(id);
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove “${title}” from schedule?`)) run();
      return;
    }
    Alert.alert('Delete schedule', `Remove “${title}” from schedule?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  };

  const openDocument = async (doc: PetDocument, action: 'view' | 'download') => {
    try {
      const label = PET_DOCUMENT_LABELS[doc.docType].replace(/\s+/g, '-').toLowerCase();
      if (action === 'view') await viewPetDocument(doc.storageKey);
      else await downloadPetDocument(doc.storageKey, `${label}.pdf`);
    } catch (err) {
      Alert.alert('Document', err instanceof Error ? err.message : 'Could not open file');
    }
  };

  const confirmDeleteDoc = (doc: PetDocument) => {
    const run = () => void onDeleteDocument(doc);
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this document?')) run();
      return;
    }
    Alert.alert('Delete document', 'Remove this uploaded document?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <View style={styles.section}>
      <View style={styles.statsRow}>
        <StatCard label="Gender" value={formatGender(pet.gender)} />
        <StatCard label="Age" value={computePetAge(pet.birthDate)} />
        <StatCard label="Weight" value={pet.weightKg != null ? `${pet.weightKg} kg` : '—'} />
      </View>

      <View style={styles.docsHeader}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.iconOnlyBtn, scheduleEditMode && styles.iconOnlyBtnActive]}
            onPress={() => setScheduleEditMode((prev) => !prev)}
            accessibilityLabel={scheduleEditMode ? 'Done editing schedule' : 'Edit schedule'}>
            <Feather name="edit-2" size={16} color={scheduleEditMode ? '#FFFFFF' : BRAND} />
          </Pressable>
          <Pressable
            style={styles.iconOnlyBtn}
            onPress={onAddSchedule}
            accessibilityLabel="Add schedule">
            <Feather name="plus" size={18} color={BRAND} />
          </Pressable>
        </View>
      </View>

      {events.length === 0 ? (
        <Text style={styles.emptyDocs}>No schedule items yet. Tap + to create one.</Text>
      ) : (
        events.map((event) => (
          <View
            key={event.id}
            style={[styles.healthCard, { backgroundColor: HEALTH_COLORS[event.category] }]}>
            <View style={styles.healthCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.healthTitle}>{event.title}</Text>
                <Text style={styles.healthSubtitle}>{event.subtitle}</Text>
              </View>
              {scheduleEditMode ? (
                <>
                  <Pressable
                    onPress={() => onEditSchedule(event.id)}
                    style={styles.iconBtn}
                    accessibilityLabel="Edit schedule item">
                    <Feather name="edit-2" size={16} color={BRAND} />
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDeleteEvent(event.id, event.title)}
                    style={styles.iconBtn}
                    accessibilityLabel="Delete schedule item">
                    <Feather name="trash-2" size={16} color="#B91C1C" />
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={() => onToggle(event.id, !event.completed)}
                  style={[styles.check, event.completed && styles.checkDone]}>
                  {event.completed ? <Feather name="check" size={16} color="#FFFFFF" /> : null}
                </Pressable>
              )}
            </View>
            {event.notes ? <Text style={styles.healthNotes}>{event.notes}</Text> : null}
            {event.providerName ? (
              <View style={styles.providerRow}>
                <Text style={styles.datePill}>{event.eventDate.slice(5).replace('-', ' ')}</Text>
                <View style={styles.providerChip}>
                  <Feather name="user" size={14} color="#111827" />
                  <Text style={styles.providerText}>{event.providerName}</Text>
                </View>
              </View>
            ) : null}
          </View>
        ))
      )}

      <View style={styles.docsHeader}>
        <Text style={styles.sectionTitle}>Documents</Text>
        <Pressable style={styles.iconOnlyBtn} onPress={onUpload} accessibilityLabel="Upload document">
          <Feather name="upload" size={16} color={BRAND} />
        </Pressable>
      </View>
      {documents.length === 0 ? (
        <Text style={styles.emptyDocs}>No documents yet. Upload vaccination certs or records.</Text>
      ) : (
        documents.map((doc) => (
          <View key={doc.id} style={styles.docRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.docTitle}>{PET_DOCUMENT_LABELS[doc.docType]}</Text>
              <Text style={styles.docMeta}>
                {doc.expiryDate ? `Expires ${doc.expiryDate}` : 'No expiry set'}
              </Text>
              <View style={styles.docActions}>
                <Pressable
                  style={styles.docIconBtn}
                  onPress={() => void openDocument(doc, 'view')}
                  accessibilityLabel="View document">
                  <Feather name="eye" size={16} color={BRAND} />
                </Pressable>
                <Pressable
                  style={styles.docIconBtn}
                  onPress={() => void openDocument(doc, 'download')}
                  accessibilityLabel="Download document">
                  <Feather name="download" size={16} color={BRAND} />
                </Pressable>
                <Pressable
                  style={styles.docIconBtn}
                  onPress={() => confirmDeleteDoc(doc)}
                  accessibilityLabel="Delete document">
                  <Feather name="trash-2" size={16} color="#B91C1C" />
                </Pressable>
              </View>
            </View>
            <DocumentStatusBadge status={getDocumentStatus(doc)} />
          </View>
        ))
      )}
    </View>
  );
}

function TrainingTab({
  pet,
  training,
  onStartOnboarding,
  onOpenPreferences,
}: {
  pet: Pet;
  training: ReturnType<typeof usePetTraining>;
  onStartOnboarding: () => void;
  onOpenPreferences: () => void;
}) {
  if (!training.isReady || training.loading) {
    return (
      <View style={styles.trainingCenter}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  if (!training.preferences?.onboarded || !training.plan) {
    return (
      <View style={styles.trainingOnboard}>
        <Text style={styles.trainingOnboardTitle}>Build a training plan for {pet.name}</Text>
        <Text style={styles.trainingOnboardBody}>
          Answer a few quick questions about goals, environment, and daily time. We&apos;ll create a
          personalized weekly routine from our exercise library.
        </Text>
        <PrimaryButton label="Get started" onPress={onStartOnboarding} />
      </View>
    );
  }

  return (
    <TrainingRoutineView
      pet={pet}
      selectedDate={training.selectedDate}
      weekDates={training.weekDates}
      weekProgress={training.weekProgress}
      dayTasks={training.dayTasks}
      dayCompleted={training.dayCompleted}
      stats={training.stats}
      onSelectDate={training.setSelectedDate}
      onToggleTask={training.toggleTaskComplete}
      onOpenPreferences={onOpenPreferences}
    />
  );
}

function NutritionTab({
  pet,
  nutrition,
  onStartOnboarding,
  onOpenPreferences,
}: {
  pet: Pet;
  nutrition: ReturnType<typeof usePetNutrition>;
  onStartOnboarding: () => void;
  onOpenPreferences: () => void;
}) {
  if (!nutrition.isReady || nutrition.loading) {
    return (
      <View style={styles.trainingCenter}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  if (!nutrition.preferences?.onboarded || !nutrition.plan) {
    return (
      <View style={styles.nutritionOnboard}>
        <Text style={styles.nutritionOnboardEmoji}>🐾</Text>
        <Text style={styles.nutritionOnboardTitle}>
          Let&apos;s build a nutrition plan{'\n'}for {pet.name}
        </Text>
        <Text style={styles.nutritionOnboardBody}>
          We&apos;ll ask a few questions to understand {pet.name}&apos;s nutritional needs and create
          a daily feeding routine you can track.
        </Text>
        <View style={styles.nutritionOnboardCta}>
          <PrimaryButton label="Get started →" onPress={onStartOnboarding} />
        </View>
      </View>
    );
  }

  return (
    <NutritionDashboardView
      pet={pet}
      plan={nutrition.plan}
      selectedDate={nutrition.selectedDate}
      dayMeals={nutrition.dayMeals}
      mealsFed={nutrition.mealsFed}
      mealProgress={nutrition.mealProgress}
      dayWaterCups={nutrition.dayWaterCups}
      dayTreatCount={nutrition.dayTreatCount}
      foodDiary={nutrition.foodDiary}
      onOpenPreferences={onOpenPreferences}
      onToggleMeal={nutrition.toggleMealFed}
      onAddWater={() => void nutrition.addWater(1)}
      onAddTreat={() => void nutrition.addTreat('Training treat', 1)}
    />
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '200',
    color: '#111827',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 999,
  },
  tabActive: { backgroundColor: '#111827' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  section: { paddingHorizontal: 16, gap: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statLabel: { fontSize: 12, color: '#9CA3AF' },
  statValue: { fontFamily: FONT_FAMILY, fontSize: 16, color: '#111827', marginTop: 4 },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '200',
    color: '#111827',
    marginTop: 8,
  },
  healthCard: { borderRadius: 20, padding: 16, gap: 10 },
  healthCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  healthTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  healthSubtitle: { fontSize: 13, color: '#374151', marginTop: 2 },
  healthNotes: { fontSize: 13, lineHeight: 20, color: '#374151' },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  datePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    color: '#111827',
  },
  providerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  providerText: { fontSize: 12, color: '#111827' },
  check: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkDone: { backgroundColor: '#111827', borderColor: '#111827' },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconOnlyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  iconOnlyBtnActive: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  emptyDocs: { fontSize: 14, color: '#9CA3AF' },
  docRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
  },
  docTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  docMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  docActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  docIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainingCenter: { paddingVertical: 48, alignItems: 'center' },
  trainingOnboard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFF5F2',
    gap: 12,
  },
  trainingOnboardTitle: { fontSize: 20, fontWeight: '700', color: '#4A2C2A' },
  trainingOnboardBody: { fontSize: 14, color: '#6B4E4C', lineHeight: 20 },
  nutritionOnboard: {
    flex: 1,
    margin: 16,
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#FFFBF5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  nutritionOnboardEmoji: { fontSize: 40 },
  nutritionOnboardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3F2E1E',
    textAlign: 'center',
    lineHeight: 28,
  },
  nutritionOnboardBody: {
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  nutritionOnboardCta: {
    alignSelf: 'stretch',
    paddingHorizontal: 24,
  },
});
