import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PrimaryButton, SignupShell } from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { createMeetup, type CreateMeetupInput } from '@/hooks/useCommunity';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase';
import type { CommunityStackParamList } from '@/src/navigation/types';
import { MEETUP_TYPE_OPTIONS, type MeetupType } from '@/types/community';

type Nav = NativeStackNavigationProp<CommunityStackParamList, 'CreateMeetup'>;

export default function CreateMeetupScreen() {
  const navigation = useNavigation<Nav>();
  const { profile } = useUserProfile();
  const [title, setTitle] = useState('');
  const [meetupType, setMeetupType] = useState<MeetupType>('dog_walk');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('07:00');
  const [locationName, setLocationName] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('20');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim() || !dateStr.trim()) {
      Alert.alert('Missing fields', 'Add a title and date (YYYY-MM-DD).');
      return;
    }
    const startAt = new Date(`${dateStr.trim()}T${timeStr || '09:00'}:00`);
    if (Number.isNaN(startAt.getTime())) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD for date.');
      return;
    }
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }
    const input: CreateMeetupInput = {
      title,
      meetupType,
      description,
      startAt: startAt.toISOString(),
      locationName,
      city: profile?.city ?? '',
      area: profile?.locality ?? '',
      latitude: profile?.localityPin?.latitude ?? null,
      longitude: profile?.localityPin?.longitude ?? null,
      maxAttendees: maxAttendees ? Number(maxAttendees) : null,
      packId: null,
      privacy: 'public',
    };
    const { id, error } = await createMeetup(input, userId);
    setLoading(false);
    if (error) Alert.alert('Could not create meetup', error);
    else if (id) navigation.replace('MeetupDetail', { meetupId: id });
  };

  return (
    <SignupShell
      title="Create meetup"
      subtitle="Host a walk, playdate, or event"
      showBack
      onBack={() => navigation.goBack()}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Sunday dog walk" />

        <Text style={styles.label}>Type</Text>
        {MEETUP_TYPE_OPTIONS.map((t) => (
          <Pressable key={t.id} style={styles.radioRow} onPress={() => setMeetupType(t.id)}>
            <View style={[styles.radio, meetupType === t.id && styles.radioOn]} />
            <Text>{t.label}</Text>
          </Pressable>
        ))}

        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput value={dateStr} onChangeText={setDateStr} style={styles.input} placeholder="2026-09-21" />

        <Text style={styles.label}>Time (HH:MM, 24h)</Text>
        <TextInput value={timeStr} onChangeText={setTimeStr} style={styles.input} placeholder="07:00" />

        <Text style={styles.label}>Public location</Text>
        <TextInput
          value={locationName}
          onChangeText={setLocationName}
          style={styles.input}
          placeholder="Central Park, Sector 62"
        />
        <Text style={styles.hint}>Use a public place — never share home addresses.</Text>

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.multiline]}
          multiline
          placeholder="Casual morning walk. Friendly dogs welcome."
        />

        <Text style={styles.label}>Maximum attendees</Text>
        <TextInput
          value={maxAttendees}
          onChangeText={setMaxAttendees}
          style={styles.input}
          keyboardType="number-pad"
        />

        <PrimaryButton label={loading ? 'Creating…' : 'Create meetup'} onPress={submit} disabled={loading} />
      </ScrollView>
    </SignupShell>
  );
}

const styles = StyleSheet.create({
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
  hint: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: 10,
  },
  radioOn: { borderColor: '#7C3AED', backgroundColor: '#7C3AED' },
});
