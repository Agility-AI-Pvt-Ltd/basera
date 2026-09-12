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
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { DatePickerField } from '@/components/DatePickerField';
import { ImageCropModal } from '@/components/ImageCropModal';
import { PetAvatar } from '@/components/pets/PetAvatar';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { usePets } from '@/hooks/usePets';
import { pickProfileImageFromLibrary } from '@/lib/pickProfileImage';
import type { PetsStackParamList } from '@/src/navigation/types';
import type { PetGender, PetSpecies } from '@/types/pet';

const BRAND = '#7C3AED';

const SPECIES: { id: PetSpecies; label: string }[] = [
  { id: 'dog', label: 'Dog' },
  { id: 'cat', label: 'Cat' },
  { id: 'bird', label: 'Bird' },
  { id: 'fish', label: 'Fish' },
  { id: 'other', label: 'Other' },
];

const GENDERS: { id: PetGender; label: string }[] = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'unknown', label: 'Unknown' },
];

type CreateNav = NativeStackNavigationProp<PetsStackParamList, 'CreatePetProfile'>;
type EditNav = NativeStackNavigationProp<PetsStackParamList, 'EditPetProfile'>;
type EditRoute = RouteProp<PetsStackParamList, 'EditPetProfile'>;

type Props = {
  mode: 'create' | 'edit';
};

export default function PetProfileFormScreen({ mode }: Props) {
  const createNav = useNavigation<CreateNav>();
  const editNav = useNavigation<EditNav>();
  const route = useRoute<EditRoute>();
  const insets = useSafeAreaInsets();
  const { createPet, updatePet, setPetPhoto, deletePet, getPet } = usePets();

  const petId = mode === 'edit' ? route.params.petId : undefined;

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [gender, setGender] = useState<PetGender>('unknown');
  const [birthDate, setBirthDate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState('image/jpeg');
  const [photoName, setPhotoName] = useState('pet.jpg');
  const [cropUri, setCropUri] = useState<string | null>(null);
  const [existingPhotoKey, setExistingPhotoKey] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(mode === 'edit');
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !petId) return;
    void getPet(petId)
      .then((pet) => {
        if (!pet) {
          setError('Pet not found');
          return;
        }
        setName(pet.name);
        setBreed(pet.breed);
        setSpecies(pet.species);
        setGender(pet.gender ?? 'unknown');
        setBirthDate(pet.birthDate ?? '');
        setWeightKg(pet.weightKg != null ? String(pet.weightKg) : '');
        setExistingPhotoKey(pet.photoStorageKey);
        setOwnerId(pet.ownerId);
      })
      .finally(() => setHydrating(false));
  }, [mode, petId, getPet]);

  const pickPhoto = async () => {
    try {
      const picked = await pickProfileImageFromLibrary();
      if (!picked) return;
      setCropUri(picked.uri);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open gallery');
    }
  };

  const goBack = () => {
    if (mode === 'edit') editNav.goBack();
    else createNav.goBack();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Pet name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        breed: breed.trim(),
        species,
        gender,
        birthDate: birthDate.trim() || null,
        weightKg: weightKg.trim() ? Number(weightKg) : null,
      };

      if (mode === 'create') {
        const pet = await createPet(payload);
        if (photoUri) {
          await setPetPhoto(pet.id, pet.ownerId, photoUri, photoMime, photoName);
        }
        createNav.replace('PetDetail', { petId: pet.id });
        return;
      }

      if (!petId || !ownerId) throw new Error('Missing pet');
      const pet = await updatePet(petId, payload);
      if (photoUri) {
        await setPetPhoto(pet.id, ownerId, photoUri, photoMime, photoName);
      }
      editNav.navigate('PetDetail', { petId: pet.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save pet');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!petId) return;
    const run = async () => {
      setLoading(true);
      try {
        await deletePet(petId);
        editNav.navigate('MyPetsList');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not delete pet');
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete ${name || 'this pet'}? This cannot be undone.`)) {
        void run();
      }
      return;
    }

    Alert.alert('Delete pet', `Delete ${name || 'this pet'}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void run() },
    ]);
  };

  if (hydrating) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  return (
    <>
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topRow}>
          <BackButton onFallback={goBack} />
          <Text style={styles.title}>{mode === 'edit' ? 'Edit pet' : 'New pet'}</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled">
          <Pressable style={styles.photoPicker} onPress={pickPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <PetAvatar name={name || 'Pet'} photoStorageKey={existingPhotoKey} size={96} />
            )}
            <View style={styles.photoBadge}>
              <Feather name="camera" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.photoHint}>
              {photoUri || existingPhotoKey ? 'Change photo' : 'Add pet photo'}
            </Text>
          </Pressable>

          <Field label="Name *">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Bruno"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </Field>

          <Field label="Breed">
            <TextInput
              value={breed}
              onChangeText={setBreed}
              placeholder="e.g. Labrador"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </Field>

          <Text style={styles.sectionLabel}>Species</Text>
          <View style={styles.chips}>
            {SPECIES.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                active={species === item.id}
                onPress={() => setSpecies(item.id)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Gender</Text>
          <View style={styles.chips}>
            {GENDERS.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                active={gender === item.id}
                onPress={() => setGender(item.id)}
              />
            ))}
          </View>

          <Field label="Birth date">
            <DatePickerField
              value={birthDate}
              onChange={setBirthDate}
              placeholder="Pick a date"
              textStyle={{ fontFamily: FONT_FAMILY }}
            />
          </Field>

          <Field label="Weight (kg)">
            <TextInput
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="7.9"
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
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
              <Text style={styles.saveBtnText}>
                {mode === 'edit' ? 'Save changes' : 'Save pet profile'}
              </Text>
            )}
          </Pressable>

          {mode === 'edit' ? (
            <Pressable style={styles.deleteBtn} onPress={handleDelete} disabled={loading}>
              <Text style={styles.deleteBtnText}>Delete pet</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>

      <ImageCropModal
        visible={cropUri != null}
        imageUri={cropUri}
        onCancel={() => setCropUri(null)}
        onCropped={(cropped) => {
          setPhotoUri(cropped.uri);
          setPhotoMime(cropped.mimeType);
          setPhotoName(cropped.fileName);
          setCropUri(null);
        }}
      />
    </>
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

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
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
  form: { paddingHorizontal: 20, gap: 16 },
  photoPicker: { alignItems: 'center', gap: 10, marginBottom: 4 },
  photoPreview: { width: 96, height: 96, borderRadius: 48 },
  photoBadge: {
    position: 'absolute',
    right: '36%',
    bottom: 28,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: { fontSize: 13, color: BRAND, fontWeight: '600' },
  field: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FAFAFA',
  },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  input: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { borderColor: BRAND, backgroundColor: '#F3E8FF' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextActive: { color: BRAND, fontWeight: '600' },
  error: { color: '#EF4444', fontSize: 13 },
  saveBtn: {
    marginTop: 8,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '200',
  },
  deleteBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
