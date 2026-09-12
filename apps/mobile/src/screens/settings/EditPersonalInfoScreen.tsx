import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/SignupShell';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { HomeStackParamList } from '@/src/navigation/types';

const BRAND = '#7C3AED';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'EditPersonalInfo'>;

export default function EditPersonalInfoScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, updateProfile, isReady } = useUserProfile();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!profile || hydrated) return;
    setName(profile.name);
    setBio(profile.bio ?? '');
    setHydrated(true);
  }, [profile, hydrated]);

  const handleSave = async () => {
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateProfile({ name: name.trim(), bio: bio.trim() || undefined });
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
      title="Personal info"
      onBack={() => navigation.goBack()}
      footer={<PrimaryButton label="Save changes" onPress={handleSave} disabled={loading} />}>
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
      <View style={styles.field}>
        <Text style={styles.label}>Bio (optional)</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="A short intro for your pack"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.textArea]}
          multiline
        />
      </View>
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
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  error: { color: '#EF4444', fontSize: 13 },
});
