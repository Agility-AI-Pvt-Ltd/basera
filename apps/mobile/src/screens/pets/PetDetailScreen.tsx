import Feather from '@expo/vector-icons/Feather';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useRef, useState, type ComponentProps } from 'react';
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
const TAB_NAVY = '#1F2937';
// FloatingTabBar is hidden on PetDetail, so only the device's bottom inset needs clearing,
// and that padding belongs inside each tab's ScrollView (never around it).
const BOTTOM_CLEARANCE = 32;

const CATEGORY_ICON: Record<HealthCategory, { icon: ComponentProps<typeof Feather>['name']; bg: string }> = {
  medicine: { icon: 'package', bg: '#BAE6FD' },
  vet_visit: { icon: 'activity', bg: '#FBCFE8' },
  grooming: { icon: 'scissors', bg: '#FED7AA' },
  vaccination: { icon: 'droplet', bg: '#BBF7D0' },
};

function formatScheduleWhen(event: { eventDate: string; subtitle: string; providerName: string | null }): string {
  const d = new Date(`${event.eventDate.slice(0, 10)}T12:00:00`);
  const datePart = d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timePart = event.subtitle.match(/\d{1,2}:\d{2}\s*(AM|PM)/i)?.[0] ?? '10:00 AM';
  const detail = event.subtitle.replace(/\d{1,2}:\d{2}\s*(AM|PM)/i, '').replace(/^[\s·]+/, '').trim();
  const provider = event.providerName ? ` · Dr. ${event.providerName}` : '';
  const mid = detail ? ` · ${detail}` : '';
  return `${datePart}, ${timePart}${mid}${provider}`;
}

function formatScheduleDateShort(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

function scheduleBucket(
  eventDate: string,
  completed: boolean,
): 'overdue' | 'today' | 'this_week' | 'later' | 'done' {
  if (completed) return 'done';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + 7);
  const d = new Date(`${eventDate.slice(0, 10)}T12:00:00`);
  if (d < today) return 'overdue';
  if (d.getTime() === today.getTime()) return 'today';
  if (d <= end) return 'this_week';
  return 'later';
}

function groupScheduleEvents(events: ReturnType<typeof usePetCare>['healthEvents']) {
  const buckets = {
    overdue: [] as typeof events,
    today: [] as typeof events,
    this_week: [] as typeof events,
    later: [] as typeof events,
  };
  const open = events.filter((e) => !e.completed);
  for (const e of open) {
    const b = scheduleBucket(e.eventDate, e.completed);
    if (b === 'overdue') buckets.overdue.push(e);
    else if (b === 'today') buckets.today.push(e);
    else if (b === 'this_week') buckets.this_week.push(e);
    else if (b === 'later') buckets.later.push(e);
  }
  const byDate = (a: (typeof events)[0], b: (typeof events)[0]) =>
    a.eventDate.localeCompare(b.eventDate);
  buckets.overdue.sort(byDate);
  buckets.this_week.sort(byDate);
  buckets.later.sort(byDate);
  return buckets;
}

type CareTab = 'health' | 'training' | 'nutrition';
type Nav = NativeStackNavigationProp<PetsStackParamList, 'PetDetail'>;
type Route = RouteProp<PetsStackParamList, 'PetDetail'>;

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

  // Keep the latest reload functions in a ref so the focus effect runs only when the screen
  // gains focus - not whenever a hook hands back a new reload function (e.g. on date change).
  const reloadersRef = useRef({
    refreshPet,
    care: care.reload,
    loadDocuments,
    training: training.reload,
    nutrition: nutritionState.reload,
  });
  reloadersRef.current = {
    refreshPet,
    care: care.reload,
    loadDocuments,
    training: training.reload,
    nutrition: nutritionState.reload,
  };
  const hasLoadedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const reloaders = reloadersRef.current;
      // Only block the screen on the first load; later focus refreshes happen in the background.
      if (!hasLoadedOnceRef.current) setLoadingPet(true);
      void Promise.allSettled([
        reloaders.refreshPet(),
        reloaders.care(),
        reloaders.loadDocuments(),
        reloaders.training(),
        reloaders.nutrition(),
      ]).finally(() => {
        hasLoadedOnceRef.current = true;
        setLoadingPet(false);
      });
    }, []),
  );

  if (loadingPet || !pet || !care.isReady || !docsReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  const breedGender = [pet.breed || 'Mixed breed', formatGender(pet.gender)]
    .filter(Boolean)
    .join(' • ');

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.profileHeader}>
        <View style={styles.profileTopRow}>
          <BackButton onFallback={() => navigation.navigate('MyPetsList')} />
          <Pressable
            onPress={() => navigation.navigate('EditPetProfile', { petId: pet.id })}
            style={styles.editProfileBtn}
            accessibilityLabel="Edit profile">
            <Feather name="edit-2" size={14} color={BRAND} />
            <Text style={styles.editProfileText}>Edit profile</Text>
          </Pressable>
        </View>
        <View style={styles.profileRow}>
          <PetAvatar name={pet.name} photoStorageKey={pet.photoStorageKey} size={56} />
          <View style={styles.profileText}>
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.petMeta}>{breedGender}</Text>
          </View>
        </View>
        <View style={styles.metaChips}>
          <Pressable
            style={styles.dashedChip}
            onPress={() => navigation.navigate('EditPetProfile', { petId: pet.id })}>
            <Feather name="calendar" size={14} color={BRAND} />
            <Text style={styles.dashedChipText}>
              {pet.birthDate ? computePetAge(pet.birthDate) : 'Add birth date'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.dashedChip}
            onPress={() => navigation.navigate('EditPetProfile', { petId: pet.id })}>
            <Feather name="activity" size={14} color={BRAND} />
            <Text style={styles.dashedChipText}>
              {pet.weightKg != null ? `${pet.weightKg} kg` : 'Add weight'}
            </Text>
          </Pressable>
        </View>
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
        <View style={{ flex: 1 }}>
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
        <View style={{ flex: 1 }}>
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
        contentContainerStyle={{ paddingBottom: BOTTOM_CLEARANCE + insets.bottom }}
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

  const groups = groupScheduleEvents(events);

  const renderEventCard = (event: (typeof events)[0], overdue?: boolean) => {
    const icon = CATEGORY_ICON[event.category];
    const dateLine = formatScheduleWhen(event);

    return (
      <View
        key={event.id}
        style={[styles.scheduleCard, overdue && styles.scheduleCardOverdue]}>
        <View style={[styles.scheduleIcon, { backgroundColor: icon.bg }]}>
          <Feather name={icon.icon} size={18} color="#111827" />
        </View>
        <View style={styles.scheduleBody}>
          <Text style={styles.healthTitle}>{event.title}</Text>
          <Text style={[styles.scheduleWhen, overdue && styles.scheduleWhenOverdue]}>
            {overdue ? `Was due ${formatScheduleDateShort(event.eventDate)}` : dateLine}
          </Text>
        </View>
        {scheduleEditMode ? (
          <View style={styles.scheduleEditActions}>
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
          </View>
        ) : (
          <Pressable
            onPress={() => onToggle(event.id, !event.completed)}
            style={[styles.check, event.completed && styles.checkDone]}
            accessibilityLabel="Mark complete">
            {event.completed ? <Feather name="check" size={16} color="#FFFFFF" /> : null}
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.docsHeader}>
        <Text style={styles.careTitle}>Care schedule</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setScheduleEditMode((prev) => !prev)}
            accessibilityLabel={scheduleEditMode ? 'Done editing schedule' : 'Edit schedule'}>
            <Text style={styles.editScheduleLink}>
              {scheduleEditMode ? 'Done' : 'Edit schedule'}
            </Text>
          </Pressable>
          <Pressable style={styles.addScheduleBtn} onPress={onAddSchedule} accessibilityLabel="Add">
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addScheduleText}>Add</Text>
          </Pressable>
        </View>
      </View>

      {events.length === 0 ? (
        <Text style={styles.emptyDocs}>No schedule items yet. Tap Add to create one.</Text>
      ) : (
        <>
          {groups.overdue.length > 0 ? (
            <>
              <Text style={styles.bucketLabelOverdue}>OVERDUE</Text>
              {groups.overdue.map((e) => renderEventCard(e, true))}
            </>
          ) : null}
          {groups.today.length > 0 ? (
            <>
              <Text style={styles.bucketLabel}>TODAY</Text>
              {groups.today.map((e) => renderEventCard(e))}
            </>
          ) : null}
          {groups.this_week.length > 0 ? (
            <>
              <Text style={styles.bucketLabel}>THIS WEEK</Text>
              {groups.this_week.map((e) => renderEventCard(e))}
            </>
          ) : null}
          {groups.later.length > 0 ? (
            <>
              <Text style={styles.bucketLabel}>LATER</Text>
              {groups.later.map((e) => renderEventCard(e))}
            </>
          ) : null}
        </>
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
          We&apos;ll suggest a starter plan by age and breed — then tailor it with your goals and
          daily time.
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
  if (nutrition.error) {
    return (
      <View style={styles.nutritionOnboard}>
        <Text style={styles.nutritionOnboardTitle}>Nutrition data could not be loaded</Text>
        <Text style={styles.nutritionOnboardBody}>{nutrition.error}</Text>
        <PrimaryButton label="Try again" onPress={() => void nutrition.reload()} />
      </View>
    );
  }

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
          Start with a feeding guide matched to {pet.name}&apos;s breed and weight, then refine it
          in a few quick questions.
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
      planDates={nutrition.planDates}
      dayMeals={nutrition.dayMeals}
      mealsFed={nutrition.mealsFed}
      mealProgress={nutrition.mealProgress}
      dayWaterCups={nutrition.dayWaterCups}
      dayTreatCount={nutrition.dayTreatCount}
      foodDiary={nutrition.foodDiary}
      onSelectDate={nutrition.setSelectedDate}
      onOpenPreferences={onOpenPreferences}
      onRegenerate={() => {
        const regenerate = () => void nutrition.generatePlan().catch(() => undefined);
        const message = `This replaces ${pet.name}'s current nutrition plan with a new AI-generated one.`;
        if (Platform.OS === 'web') {
          if (window.confirm(message)) regenerate();
          return;
        }
        Alert.alert('Regenerate nutrition plan?', message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Regenerate', onPress: regenerate },
        ]);
      }}
      onToggleMeal={nutrition.toggleMealFed}
      onAddWater={() => void nutrition.addWater(1)}
      onAddTreat={() => void nutrition.addTreat('Training treat', 1)}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  profileHeader: { paddingHorizontal: 16, marginBottom: 14, gap: 12 },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND,
    backgroundColor: '#FFFFFF',
  },
  editProfileText: { fontSize: 13, fontWeight: '600', color: BRAND },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileText: { flex: 1, gap: 4 },
  petName: {
    fontFamily: FONT_FAMILY,
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  petMeta: { fontSize: 14, color: '#6B7280' },
  metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dashedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C4B5FD',
    backgroundColor: '#FFFFFF',
  },
  dashedChipText: { fontSize: 13, fontWeight: '600', color: BRAND },
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
  tabActive: { backgroundColor: TAB_NAVY },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  section: { paddingHorizontal: 16, gap: 12 },
  careTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  editScheduleLink: { fontSize: 14, fontWeight: '600', color: BRAND },
  addScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BRAND,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addScheduleText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  bucketLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  bucketLabelOverdue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  scheduleCardOverdue: { borderColor: '#FECACA' },
  scheduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleBody: { flex: 1, gap: 2 },
  scheduleWhen: { fontSize: 12, color: '#6B7280' },
  scheduleWhenOverdue: { color: '#DC2626', fontWeight: '600' },
  scheduleEditActions: { flexDirection: 'row', gap: 6 },
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
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C4B5FD',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkDone: { backgroundColor: BRAND, borderColor: BRAND },
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
