import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { usePetCare } from '@/hooks/usePetCare';
import type { PetsStackParamList } from '@/src/navigation/types';
import type { HealthCategory } from '@/types/pet';

const BRAND = '#7C3AED';

type Nav = NativeStackNavigationProp<PetsStackParamList, 'AddHealthSchedule'>;
type Route = RouteProp<PetsStackParamList, 'AddHealthSchedule'>;

const CATEGORIES: { id: HealthCategory; label: string }[] = [
  { id: 'vet_visit', label: 'Vet visit' },
  { id: 'grooming', label: 'Grooming' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'vaccination', label: 'Vaccination' },
];

export default function AddHealthScheduleScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { healthEvents, isReady, addHealthEvent, updateHealthEvent } = usePetCare(params.petId);
  const isEditing = Boolean(params.eventId);

  const [category, setCategory] = useState<HealthCategory>('vet_visit');
  const [title, setTitle] = useState('Vet visit');
  const [subtitle, setSubtitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [providerName, setProviderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(!isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing || !params.eventId || !isReady) return;
    const existing = healthEvents.find((e) => e.id === params.eventId);
    if (!existing) {
      setError('Schedule item not found');
      setHydrated(true);
      return;
    }
    setCategory(existing.category);
    setTitle(existing.title);
    setSubtitle(existing.subtitle);
    setEventDate(existing.eventDate);
    setNotes(existing.notes ?? '');
    setProviderName(existing.providerName ?? '');
    setHydrated(true);
  }, [isEditing, params.eventId, isReady, healthEvents]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        category,
        title,
        subtitle,
        eventDate,
        notes,
        providerName,
      };
      if (isEditing && params.eventId) {
        await updateHealthEvent(params.eventId, payload);
      } else {
        await addHealthEvent(payload);
      }
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save schedule');
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <BackButton onFallback={() => navigation.goBack()} />
        <Text style={styles.title}>{isEditing ? 'Edit schedule' : 'Add schedule'}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                setCategory(item.id);
                if (!isEditing) setTitle(item.label);
              }}
              style={[styles.chip, category === item.id && styles.chipActive]}>
              <Text style={[styles.chipText, category === item.id && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Field label="Title *">
          <TextInput value={title} onChangeText={setTitle} style={styles.input} />
        </Field>
        <Field label="Subtitle">
          <TextInput
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="e.g. Dental check"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </Field>
        <Field label="Date (YYYY-MM-DD)">
          <TextInput value={eventDate} onChangeText={setEventDate} style={styles.input} />
        </Field>
        <Field label="Provider">
          <TextInput
            value={providerName}
            onChangeText={setProviderName}
            placeholder="e.g. Doctor Turner"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </Field>
        <Field label="Notes">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            placeholderTextColor="#9CA3AF"
            style={[styles.input, styles.textArea]}
            multiline
          />
        </Field>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>{isEditing ? 'Save changes' : 'Add to schedule'}</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '200',
    color: '#111827',
  },
  spacer: { width: 44 },
  form: { paddingHorizontal: 20, gap: 14 },
  sectionLabel: { fontSize: 13, color: '#6B7280' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: { borderColor: BRAND, backgroundColor: '#F3E8FF' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextActive: { color: BRAND, fontWeight: '600' },
  field: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FAFAFA',
  },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  input: { fontFamily: FONT_FAMILY, fontSize: 16, color: '#111827', padding: 0 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  error: { color: '#EF4444', fontSize: 13 },
  saveBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '200',
  },
});
