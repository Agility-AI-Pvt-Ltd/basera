import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PrimaryButton, SignupShell } from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { createPack, type CreatePackInput } from '@/hooks/useCommunity';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase';
import type { CommunityStackParamList } from '@/src/navigation/types';
import {
  DEFAULT_PACK_RULES,
  PACK_CATEGORY_OPTIONS,
  type PackCategory,
  type PackPrivacy,
} from '@/types/community';

type Nav = NativeStackNavigationProp<CommunityStackParamList, 'CreatePack'>;

const RADII = [2, 5, 10, 25];

export default function CreatePackScreen() {
  const navigation = useNavigation<Nav>();
  const { profile } = useUserProfile();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PackCategory>('location');
  const [radiusKm, setRadiusKm] = useState(5);
  const [privacy, setPrivacy] = useState<PackPrivacy>('public');
  const [rules, setRules] = useState<string[]>([...DEFAULT_PACK_RULES]);
  const [loading, setLoading] = useState(false);

  const toggleRule = (rule: string) => {
    setRules((r) => (r.includes(rule) ? r.filter((x) => x !== rule) : [...r, rule]));
  };

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give your pack a name.');
      return;
    }
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }
    const input: CreatePackInput = {
      name,
      description,
      category,
      city: profile?.city ?? '',
      area: profile?.locality ?? '',
      latitude: profile?.localityPin?.latitude ?? null,
      longitude: profile?.localityPin?.longitude ?? null,
      radiusKm,
      privacy,
      rules,
    };
    const { id, error } = await createPack(input, userId);
    setLoading(false);
    if (error) Alert.alert('Could not create pack', error);
    else if (id) navigation.replace('PackDetail', { packId: id });
  };

  return (
    <SignupShell
      title="Create pack"
      subtitle="Build a local pet community"
      showBack
      onBack={() => navigation.goBack()}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Pack name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Sector 62 Dog Parents" />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.multiline]}
          multiline
          placeholder="What is this community about?"
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {PACK_CATEGORY_OPTIONS.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chip, category === c.id && styles.chipOn]}
              onPress={() => setCategory(c.id)}>
              <Text style={styles.chipText}>
                {c.emoji} {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Location</Text>
        <Text style={styles.hint}>
          📍 {[profile?.locality, profile?.city].filter(Boolean).join(', ') || 'Update location in Settings'}
        </Text>

        <Text style={styles.label}>Community radius</Text>
        <View style={styles.row}>
          {RADII.map((r) => (
            <Pressable
              key={r}
              style={[styles.radiusBtn, radiusKm === r && styles.radiusOn]}
              onPress={() => setRadiusKm(r)}>
              <Text style={styles.radiusText}>{r === 25 ? 'City-wide' : `${r} km`}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Who can join?</Text>
        {(['public', 'approval', 'invite_only'] as PackPrivacy[]).map((p) => (
          <Pressable key={p} style={styles.radioRow} onPress={() => setPrivacy(p)}>
            <View style={[styles.radio, privacy === p && styles.radioOn]} />
            <Text style={styles.radioLabel}>
              {p === 'public' ? 'Anyone' : p === 'approval' ? 'Approval required' : 'Invite only'}
            </Text>
          </Pressable>
        ))}

        <Text style={styles.label}>Pack rules</Text>
        {DEFAULT_PACK_RULES.map((rule) => (
          <Pressable key={rule} style={styles.radioRow} onPress={() => toggleRule(rule)}>
            <View style={[styles.check, rules.includes(rule) && styles.checkOn]} />
            <Text style={styles.radioLabel}>{rule}</Text>
          </Pressable>
        ))}

        <PrimaryButton label={loading ? 'Creating…' : 'Create pack'} onPress={submit} disabled={loading} />
      </ScrollView>
    </SignupShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  label: { marginTop: 16, marginBottom: 8, fontWeight: '600', color: '#111827' },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 15,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  hint: { fontSize: 14, color: '#6B7280' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  chipOn: { backgroundColor: '#EDE9FE' },
  chipText: { fontSize: 13 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radiusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  radiusOn: { backgroundColor: '#7C3AED' },
  radiusText: { fontSize: 13, color: '#374151' },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: 10,
  },
  radioOn: { borderColor: '#7C3AED', backgroundColor: '#7C3AED' },
  check: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: 10,
  },
  checkOn: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  radioLabel: { fontSize: 15, color: '#374151' },
});
