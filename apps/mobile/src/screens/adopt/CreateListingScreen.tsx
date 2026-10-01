import * as ImagePicker from 'expo-image-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PrimaryButton, SignupShell } from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { addListingMediaRow, createListingDraft, publishListing, updateListing } from '@/hooks/useAdoption';
import { usePets } from '@/hooks/usePets';
import { uploadAdoptionMedia } from '@/lib/adoptionStorage';
import { supabase } from '@/lib/supabase';
import type { AdoptStackParamList } from '@/src/navigation/types';
import type { ListingSourceType } from '@/types/adoption';
import {
  LISTING_SOURCE_OPTIONS,
  TEMPERAMENT_OPTIONS,
  VACCINATION_OPTIONS,
} from '@/types/adoption';

type Nav = NativeStackNavigationProp<AdoptStackParamList, 'CreateListing'>;

const STEPS = ['Listing type', 'Pet info', 'Health & stray', 'Photos', 'Preferences', 'Publish'];

export default function CreateListingScreen() {
  const navigation = useNavigation<Nav>();
  const { pets } = usePets();
  const [step, setStep] = useState(0);
  const [listingId, setListingId] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<ListingSourceType>('owned');
  const [linkedPetId, setLinkedPetId] = useState<string | null>(null);
  const [petName, setPetName] = useState('');
  const [breed, setBreed] = useState('');
  const [ageLabel, setAgeLabel] = useState('');
  const [description, setDescription] = useState('');
  const [temperament, setTemperament] = useState<string[]>([]);
  const [vaccinations, setVaccinations] = useState<string[]>([]);
  const [sterilized, setSterilized] = useState<boolean | null>(null);
  const [goodWithChildren, setGoodWithChildren] = useState<boolean | null>(null);
  const [goodWithDogs, setGoodWithDogs] = useState<boolean | null>(null);
  const [foundLocation, setFoundLocation] = useState('');
  const [ownerStatus, setOwnerStatus] = useState<'no_known_owner' | 'owner_may_be_looking' | 'unsure'>('unsure');
  const [ownerChecks, setOwnerChecks] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [mediaUris, setMediaUris] = useState<{ uri: string; mime: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const ensureDraft = async () => {
    if (listingId) return listingId;
    if (!petName.trim()) throw new Error('Pet name is required');
    const draft = await createListingDraft({
      sourceType,
      petId: linkedPetId,
      petName: petName.trim(),
    });
    setListingId(draft.id);
    return draft.id;
  };

  const saveStepData = async (id: string) => {
    await updateListing(id, {
      pet_name: petName.trim(),
      breed: breed.trim(),
      age_label: ageLabel.trim(),
      description: description.trim(),
      title: `${petName.trim()} is looking for a loving home`,
      temperament_tags: temperament,
      vaccination_tags: vaccinations,
      sterilized,
      good_with_children: goodWithChildren,
      good_with_dogs: goodWithDogs,
      stray_info:
        sourceType === 'stray'
          ? {
              foundLocation,
              ownerStatus: ownerStatus,
              ownerSearchChecks: ownerChecks,
            }
          : {},
      city: city.trim(),
      state: stateName.trim(),
      public_location_label: city.trim() ? `${city.trim()}${stateName.trim() ? ` · ${stateName.trim()}` : ''}` : '',
      adoption_preferences: {
        apartmentOk: true,
        housePreferred: false,
        otherPetsOk: goodWithDogs ?? true,
        childrenOk: goodWithChildren ?? true,
      },
      adoption_requirements: {
        meetAndGreet: true,
        homeVisit: false,
        followUp: true,
      },
    });
  };

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    setMediaUris((prev) => [
      ...prev,
      ...result.assets.map((a) => ({
        uri: a.uri,
        mime: a.mimeType ?? 'image/jpeg',
        name: a.fileName ?? `photo-${Date.now()}.jpg`,
      })),
    ]);
  };

  const handleNext = async () => {
    setError('');
    setLoading(true);
    try {
      if (step === 0 && !petName.trim() && !linkedPetId) {
        setError('Enter a pet name or select your pet profile.');
        setLoading(false);
        return;
      }
      const id = await ensureDraft();
      if (step >= 1) await saveStepData(id);

      if (step === 3 && mediaUris.length) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        for (let i = 0; i < mediaUris.length; i++) {
          const file = mediaUris[i];
          const key = await uploadAdoptionMedia(user.id, id, file.uri, file.name, file.mime);
          await addListingMediaRow(id, key, 'image', i);
        }
      }

      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
      } else {
        await publishListing(id, sourceType);
        navigation.replace('ListingDetail', { listingId: id });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupShell
      title={STEPS[step]}
      subtitle={`Step ${step + 1} of ${STEPS.length}`}
      showBack
      onBack={() => (step > 0 ? setStep((s) => s - 1) : navigation.goBack())}
      footer={<PrimaryButton label={step === STEPS.length - 1 ? 'Publish listing' : 'Continue'} onPress={handleNext} disabled={loading} />}>
      {step === 0 ? (
        <View style={styles.block}>
          <Text style={styles.label}>Who is this pet?</Text>
          {LISTING_SOURCE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              style={[styles.option, sourceType === opt.id && styles.optionActive]}
              onPress={() => setSourceType(opt.id)}>
              <Text style={styles.optionText}>
                {opt.emoji} {opt.label}
              </Text>
            </Pressable>
          ))}
          {sourceType === 'owned' && pets.length > 0 ? (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>Use pet profile (optional)</Text>
              {pets.map((p) => (
                <Pressable
                  key={p.id}
                  style={[styles.option, linkedPetId === p.id && styles.optionActive]}
                  onPress={() => {
                    setLinkedPetId(p.id);
                    setPetName(p.name);
                    setBreed(p.breed);
                  }}>
                  <Text style={styles.optionText}>{p.name} · {p.breed || p.species}</Text>
                </Pressable>
              ))}
            </>
          ) : null}
          <TextInput value={petName} onChangeText={setPetName} placeholder="Pet name" style={styles.input} />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.block}>
          <TextInput value={breed} onChangeText={setBreed} placeholder="Breed" style={styles.input} />
          <TextInput value={ageLabel} onChangeText={setAgeLabel} placeholder="Age (e.g. 2 years)" style={styles.input} />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="About this pet"
            multiline
            style={[styles.input, { minHeight: 100 }]}
          />
          <Text style={styles.label}>Temperament</Text>
          <View style={styles.wrap}>
            {TEMPERAMENT_OPTIONS.map((t) => (
              <Chip key={t} label={t} active={temperament.includes(t)} onPress={() => toggle(temperament, t, setTemperament)} />
            ))}
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.block}>
          <Text style={styles.label}>Vaccinations</Text>
          <View style={styles.wrap}>
            {VACCINATION_OPTIONS.map((v) => (
              <Chip key={v} label={v} active={vaccinations.includes(v)} onPress={() => toggle(vaccinations, v, setVaccinations)} />
            ))}
          </View>
          <RowToggle label="Sterilized?" value={sterilized} onChange={setSterilized} />
          <RowToggle label="Good with children?" value={goodWithChildren} onChange={setGoodWithChildren} />
          <RowToggle label="Good with dogs?" value={goodWithDogs} onChange={setGoodWithDogs} />
          {sourceType === 'stray' ? (
            <>
              <TextInput value={foundLocation} onChangeText={setFoundLocation} placeholder="Where found?" style={styles.input} />
              <Text style={styles.hint}>Owner search checks (self-reported — not legal proof)</Text>
              {['Checked nearby area', 'Asked local residents', 'Posted found-pet notice'].map((c) => (
                <Chip key={c} label={c} active={ownerChecks.includes(c)} onPress={() => toggle(ownerChecks, c, setOwnerChecks)} />
              ))}
              <Text style={styles.hint}>Stray listings may stay pending verification before going public.</Text>
            </>
          ) : null}
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.block}>
          <Pressable style={styles.addPhoto} onPress={pickPhotos}>
            <Text style={styles.addPhotoText}>+ Add photos</Text>
          </Pressable>
          <View style={styles.photoRow}>
            {mediaUris.map((m) => (
              <Image key={m.uri} source={{ uri: m.uri }} style={styles.thumb} />
            ))}
          </View>
          <Text style={styles.hint}>Add at least 3 photos when possible, including a clear face photo.</Text>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={styles.block}>
          <TextInput value={city} onChangeText={setCity} placeholder="City (public)" style={styles.input} />
          <TextInput value={stateName} onChangeText={setStateName} placeholder="State" style={styles.input} />
          <Text style={styles.hint}>Exact address is never shown publicly — only approximate area.</Text>
          <Text style={styles.hint}>Contact happens in-app after someone applies.</Text>
        </View>
      ) : null}

      {step === 5 ? (
        <View style={styles.block}>
          <Text style={styles.reviewTitle}>{petName} · {sourceType}</Text>
          <Text style={styles.reviewLine}>{city || 'City not set'}</Text>
          <Text style={styles.reviewLine}>{mediaUris.length} photo(s) selected</Text>
          {sourceType === 'stray' ? (
            <Text style={styles.reviewLine}>Status: Pending verification after publish</Text>
          ) : (
            <Text style={styles.reviewLine}>Status: Active after publish</Text>
          )}
        </View>
      ) : null}

      {loading ? <ActivityIndicator color="#7C3AED" style={{ marginTop: 12 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SignupShell>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function RowToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.rowToggle}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.rowBtns}>
        <Pressable style={[styles.miniBtn, value === true && styles.miniBtnActive]} onPress={() => onChange(true)}>
          <Text>Yes</Text>
        </Pressable>
        <Pressable style={[styles.miniBtn, value === false && styles.miniBtnActive]} onPress={() => onChange(false)}>
          <Text>No</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
  },
  option: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  optionActive: { borderColor: '#7C3AED', backgroundColor: '#F3E8FF' },
  optionText: { fontSize: 15, color: '#111827' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#5B21B6', fontWeight: '600' },
  rowToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBtns: { flexDirection: 'row', gap: 8 },
  miniBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F3F4F6' },
  miniBtnActive: { backgroundColor: '#EDE9FE' },
  addPhoto: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addPhotoText: { color: '#7C3AED', fontWeight: '600' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 72, height: 72, borderRadius: 10 },
  hint: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
  reviewTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  reviewLine: { fontSize: 14, color: '#4B5563' },
  error: { color: '#EF4444', marginTop: 8 },
});
