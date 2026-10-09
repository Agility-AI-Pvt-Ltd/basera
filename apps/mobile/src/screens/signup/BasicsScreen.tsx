import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { SignupStackParamList } from '@/src/navigation/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import {
  BRAND_PURPLE,
  PrimaryButton,
  SignupShell,
  SkipButton,
} from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { CITY_PIN_PRESETS, DEFAULT_PIN } from '@/constants/signup';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useUserProfile } from '@/hooks/useUserProfile';
import { detectSignupLocation } from '@/lib/signupLocation';
import type { LocalityPin } from '@/types/profile';

type Nav = NativeStackNavigationProp<SignupStackParamList, 'Basics'>;

function resolveLocalityPin(cityName: string, existing: LocalityPin | null): LocalityPin {
  if (existing) return existing;
  const matched = Object.entries(CITY_PIN_PRESETS).find(
    ([key]) => key.toLowerCase() === cityName.trim().toLowerCase(),
  );
  const coords = matched?.[1] ?? DEFAULT_PIN;
  return {
    latitude: coords.latitude + (Math.random() - 0.5) * 0.02,
    longitude: coords.longitude + (Math.random() - 0.5) * 0.02,
  };
}

export default function BasicsScreen() {
  const navigation = useNavigation<Nav>();
  const { isReady: authReady } = useAuthStatus();
  const { isReady, profile, updateProfile } = useUserProfile();

  const [name, setName] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [pin, setPin] = useState<LocalityPin | null>(null);
  const [bio, setBio] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState('');
  const autoLocateAttempted = useRef(false);

  useEffect(() => {
    if (!profile || hydrated) return;
    setName(profile.name);
    setIsAdult(profile.isAdult);
    setLocality(profile.locality);
    setCity(profile.city);
    setPin(profile.localityPin);
    setBio(profile.bio ?? '');
    setHydrated(true);
  }, [profile, hydrated]);

  const applyDetectedLocation = useCallback(async (manual = false) => {
    setLocating(true);
    setError('');
    if (manual) setLocationNote('');
    const result = await detectSignupLocation();
    setLocating(false);
    if (!result.ok) {
      if (result.pin) {
        setPin(result.pin);
      }
      setLocationNote(result.message);
      if (manual) setError(result.message);
      return;
    }
    const { pin: nextPin, city: nextCity, locality: nextLocality, label } = result.data;
    setCity(nextCity);
    setLocality(nextLocality);
    setPin(nextPin);
    setLocationNote(label);
    setError('');
  }, []);

  useEffect(() => {
    if (!hydrated || autoLocateAttempted.current) return;
    const needsLocation = !city.trim() || !locality.trim();
    if (!needsLocation) return;
    autoLocateAttempted.current = true;
    void applyDetectedLocation(false);
  }, [hydrated, city, locality, applyDetectedLocation]);

  const canContinue = useMemo(
    () =>
      name.trim().length >= 2 &&
      isAdult &&
      locality.trim().length >= 2 &&
      city.trim().length >= 2,
    [name, isAdult, locality, city],
  );

  if (!authReady || !isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={BRAND_PURPLE} />
      </View>
    );
  }

  const handleContinue = async () => {
    if (!canContinue) {
      setError('Fill name, confirm 18+, city, and locality.');
      return;
    }

    const localityPin = resolveLocalityPin(city, pin);

    await updateProfile({
      name: name.trim(),
      isAdult: true,
      locality: locality.trim(),
      city: city.trim(),
      localityPin,
      bio: bio.trim() || undefined,
    });

    navigation.navigate('DogFork');
  };

  return (
    <SignupShell
      title="Tell us about you"
      subtitle="We need a few basics before you can use Basera. Photo is optional — you can add it later."
      footer={
        <>
          <PrimaryButton label="Continue" onPress={handleContinue} disabled={!canContinue} />
          {!showOptional ? (
            <SkipButton
              label="Add optional details (photo / bio)"
              onPress={() => setShowOptional(true)}
            />
          ) : null}
        </>
      }>
      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          autoCapitalize="words"
        />
      </View>

      <Pressable
        onPress={() => setIsAdult((prev) => !prev)}
        style={[styles.checkboxRow, isAdult && styles.checkboxRowActive]}>
        <View style={[styles.checkbox, isAdult && styles.checkboxChecked]}>
          {isAdult ? <FontAwesome name="check" size={12} color="#FFFFFF" /> : null}
        </View>
        <Text style={styles.checkboxLabel}>I confirm I am 18 years or older</Text>
      </Pressable>

      <View style={styles.locationBanner}>
        <View style={styles.locationBannerText}>
          <Text style={styles.locationBannerTitle}>Your area</Text>
          {locating ? (
            <Text style={styles.locationBannerHint}>Getting GPS location…</Text>
          ) : locationNote ? (
            <Text style={styles.locationBannerHint}>{locationNote}</Text>
          ) : (
            <Text style={styles.locationBannerHint}>
              We use GPS and reverse geocoding for your city and locality.
            </Text>
          )}
        </View>
        <Pressable
          style={[styles.locateBtn, locating && styles.locateBtnDisabled]}
          disabled={locating}
          onPress={() => void applyDetectedLocation(true)}>
          {locating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <FontAwesome name="location-arrow" size={16} color="#FFFFFF" />
          )}
          <Text style={styles.locateBtnText}>{locating ? 'Locating' : 'Refresh'}</Text>
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>City</Text>
        <TextInput
          value={city}
          onChangeText={(value) => {
            setCity(value);
            setLocationNote('');
          }}
          placeholder="e.g. Bengaluru"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Locality</Text>
        <TextInput
          value={locality}
          onChangeText={setLocality}
          placeholder="e.g. Indiranagar, Koramangala"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          autoCapitalize="words"
        />
      </View>

      {showOptional ? (
        <View style={styles.optional}>
          <Text style={styles.optionalTitle}>Optional</Text>
          <View style={styles.photoPlaceholder}>
            <FontAwesome name="camera" size={22} color="#9CA3AF" />
            <Text style={styles.photoText}>Profile photo — skip for now</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="A short intro (optional)"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, styles.bioInput]}
              multiline
            />
          </View>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SignupShell>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  field: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  bioInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  checkboxRowActive: {
    borderColor: BRAND_PURPLE,
    backgroundColor: '#F5F3FF',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: BRAND_PURPLE,
    borderColor: BRAND_PURPLE,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#F5F3FF',
  },
  locationBannerText: {
    flex: 1,
    gap: 2,
  },
  locationBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  locationBannerHint: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND_PURPLE,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  locateBtnDisabled: {
    opacity: 0.85,
  },
  locateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  optional: {
    gap: 12,
    marginTop: 4,
  },
  optionalTitle: {
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  photoPlaceholder: {
    height: 88,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  photoText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
  },
});
