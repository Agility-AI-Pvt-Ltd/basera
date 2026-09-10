import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { SignupStackParamList } from '@/src/navigation/types';
import { useEffect, useMemo, useState } from 'react';
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
import type { LocalityPin } from '@/types/profile';

type Nav = NativeStackNavigationProp<SignupStackParamList, 'Basics'>;

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

  const canContinue = useMemo(
    () =>
      name.trim().length >= 2 &&
      isAdult &&
      locality.trim().length >= 2 &&
      city.trim().length >= 2 &&
      pin !== null,
    [name, isAdult, locality, city, pin],
  );

  if (!authReady || !isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={BRAND_PURPLE} />
      </View>
    );
  }

  const dropPin = () => {
    const matched = Object.entries(CITY_PIN_PRESETS).find(
      ([key]) => key.toLowerCase() === city.trim().toLowerCase(),
    );
    const coords = matched?.[1] ?? DEFAULT_PIN;
    // Slight jitter so each pin feels locality-specific
    setPin({
      latitude: coords.latitude + (Math.random() - 0.5) * 0.02,
      longitude: coords.longitude + (Math.random() - 0.5) * 0.02,
    });
    setError('');
  };

  const handleContinue = async () => {
    if (!canContinue || !pin) {
      setError('Fill name, confirm 18+, city, locality, and drop a map pin.');
      return;
    }

    await updateProfile({
      name: name.trim(),
      isAdult: true,
      locality: locality.trim(),
      city: city.trim(),
      localityPin: pin,
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

      <View style={styles.field}>
        <Text style={styles.label}>City</Text>
        <TextInput
          value={city}
          onChangeText={(value) => {
            setCity(value);
            setPin(null);
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

      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Map pin</Text>
          <Text style={styles.mapHint}>Required — packs & meetups are locality-first</Text>
        </View>
        <View style={styles.mapPreview}>
          <View style={styles.mapGrid} />
          {pin ? (
            <View style={styles.pinMarker}>
              <FontAwesome name="map-marker" size={36} color={BRAND_PURPLE} />
            </View>
          ) : (
            <Text style={styles.mapEmpty}>No pin yet</Text>
          )}
        </View>
        <PrimaryButton
          label={pin ? 'Update pin for this city' : 'Drop pin on map'}
          onPress={dropPin}
        />
        {pin ? (
          <Text style={styles.coords}>
            Pin set · {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
          </Text>
        ) : null}
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
  mapCard: {
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FAFAFA',
  },
  mapHeader: {
    gap: 2,
  },
  mapTitle: {
    fontSize: 16,
    color: '#111827',
  },
  mapHint: {
    fontSize: 13,
    color: '#6B7280',
  },
  mapPreview: {
    height: 140,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGrid: {
    ...StyleSheet.absoluteFill,
    opacity: 0.25,
    backgroundColor: '#C7D2FE',
  },
  pinMarker: {
    zIndex: 1,
  },
  mapEmpty: {
    color: '#6B7280',
    fontSize: 14,
  },
  coords: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
