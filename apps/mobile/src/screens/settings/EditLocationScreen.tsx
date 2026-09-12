import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { PrimaryButton } from '@/components/SignupShell';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { CITY_PIN_PRESETS, DEFAULT_PIN } from '@/constants/signup';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { HomeStackParamList } from '@/src/navigation/types';
import type { LocalityPin } from '@/types/profile';

const BRAND = '#7C3AED';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'EditLocation'>;

export default function EditLocationScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, updateProfile, isReady } = useUserProfile();
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [pin, setPin] = useState<LocalityPin | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!profile || hydrated) return;
    setLocality(profile.locality);
    setCity(profile.city);
    setPin(profile.localityPin);
    setHydrated(true);
  }, [profile, hydrated]);

  const canSave = useMemo(
    () => locality.trim().length >= 2 && city.trim().length >= 2 && pin !== null,
    [locality, city, pin],
  );

  const dropPin = () => {
    const matched = Object.entries(CITY_PIN_PRESETS).find(
      ([key]) => key.toLowerCase() === city.trim().toLowerCase(),
    );
    const coords = matched?.[1] ?? DEFAULT_PIN;
    setPin({
      latitude: coords.latitude + (Math.random() - 0.5) * 0.02,
      longitude: coords.longitude + (Math.random() - 0.5) * 0.02,
    });
    setError('');
  };

  const handleSave = async () => {
    if (!canSave || !pin) {
      setError('Fill city, locality, and drop a map pin.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateProfile({
        locality: locality.trim(),
        city: city.trim(),
        localityPin: pin,
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  return (
    <SettingsShell
      title="Location"
      onBack={() => navigation.goBack()}
      footer={<PrimaryButton label="Save location" onPress={handleSave} disabled={loading || !canSave} />}>
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
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Locality</Text>
        <TextInput
          value={locality}
          onChangeText={setLocality}
          placeholder="e.g. Indiranagar"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />
      </View>

      <Pressable onPress={dropPin} style={styles.pinBtn}>
        <FontAwesome name="map-marker" size={18} color={BRAND} />
        <Text style={styles.pinBtnText}>
          {pin ? 'Pin dropped — tap to adjust' : 'Drop map pin for your area'}
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SettingsShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  field: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  input: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  pinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F3E8FF',
    borderRadius: 14,
    padding: 16,
  },
  pinBtnText: { fontSize: 14, color: '#374151', flex: 1 },
  error: { color: '#EF4444', fontSize: 13 },
});
