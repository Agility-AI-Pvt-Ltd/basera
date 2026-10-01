import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { PrimaryButton, SignupShell } from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { submitAdoptionApplication, useAdoptionListing } from '@/hooks/useAdoption';

import type { AdoptStackParamList } from '@/src/navigation/types';

type Nav = NativeStackNavigationProp<AdoptStackParamList, 'ApplyAdoption'>;
type Route = RouteProp<AdoptStackParamList, 'ApplyAdoption'>;

const STEPS = ['About you', 'Home', 'Experience', 'Why adopt', 'Submit'];

export default function ApplyAdoptionScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { listing, loading: listingLoading } = useAdoptionListing(params.listingId);
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [homeType, setHomeType] = useState('apartment');
  const [outdoorSpace, setOutdoorSpace] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [hasPets, setHasPets] = useState(false);
  const [hasOwnedBefore, setHasOwnedBefore] = useState(false);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [whyAdopt, setWhyAdopt] = useState('');
  const [whyThisPet, setWhyThisPet] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    setError('');
    if (step === 0 && !fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    if (!listing) return;
    setLoading(true);
    try {
      const application = await submitAdoptionApplication({
        listing,
        applicantProfile: { fullName, age, city, phone, email },
        home: { type: homeType, outdoorSpace },
        household: { hasChildren, adults: 1 },
        existingPets: hasPets ? [{ type: 'dog' }] : [],
        experience: { hasOwnedPets: hasOwnedBefore },
        availability: { hoursPerDay },
        financial: {
          food: true,
          vaccinations: true,
          routineVet: true,
          emergencyVet: true,
          grooming: true,
        },
        answers: { whyAdopt, whyThisPet },
      });
      navigation.replace('AdoptionChat', { applicationId: application.id, title: listing.petName });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit application');
    } finally {
      setLoading(false);
    }
  };

  if (listingLoading || !listing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  return (
    <SignupShell
      title={`Apply for ${listing.petName}`}
      subtitle={`${STEPS[step]} · step ${step + 1} of ${STEPS.length}`}
      showBack
      onBack={() => (step > 0 ? setStep((s) => s - 1) : navigation.goBack())}
      footer={<PrimaryButton label={step === STEPS.length - 1 ? 'Submit application' : 'Continue'} onPress={handleNext} disabled={loading} />}>
      {step === 0 ? (
        <View style={styles.block}>
          <Field label="Full name" value={fullName} onChange={setFullName} />
          <Field label="Age" value={age} onChange={setAge} keyboard="number-pad" />
          <Field label="City" value={city} onChange={setCity} />
          <Field label="Phone" value={phone} onChange={setPhone} />
          <Field label="Email" value={email} onChange={setEmail} />
        </View>
      ) : null}
      {step === 1 ? (
        <View style={styles.block}>
          <Text style={styles.label}>Home type</Text>
          {['apartment', 'house', 'other'].map((t) => (
            <Choice key={t} label={t} active={homeType === t} onPress={() => setHomeType(t)} />
          ))}
          <Choice label="Outdoor space" active={outdoorSpace} onPress={() => setOutdoorSpace((v) => !v)} />
          <Choice label="Children at home" active={hasChildren} onPress={() => setHasChildren((v) => !v)} />
          <Choice label="Other pets at home" active={hasPets} onPress={() => setHasPets((v) => !v)} />
        </View>
      ) : null}
      {step === 2 ? (
        <View style={styles.block}>
          <Choice label="Owned a pet before" active={hasOwnedBefore} onPress={() => setHasOwnedBefore((v) => !v)} />
          <Text style={styles.label}>Hours per day with pet</Text>
          <Field label="Hours" value={String(hoursPerDay)} onChange={(v) => setHoursPerDay(Number(v) || 0)} keyboard="number-pad" />
        </View>
      ) : null}
      {step === 3 ? (
        <View style={styles.block}>
          <TextInput
            value={whyAdopt}
            onChangeText={setWhyAdopt}
            placeholder="Why would you like to adopt?"
            multiline
            style={styles.area}
          />
          <TextInput
            value={whyThisPet}
            onChangeText={setWhyThisPet}
            placeholder={`Why ${listing.petName}?`}
            multiline
            style={styles.area}
          />
        </View>
      ) : null}
      {step === 4 ? (
        <Text style={styles.hint}>
          Submitting creates an adoption application and in-app conversation. The lister reviews your
          answers — compatibility insights help, but the final decision is theirs.
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#7C3AED" /> : null}
    </SignupShell>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: 'number-pad';
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType={keyboard} style={styles.input} />
    </View>
  );
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Text style={[styles.choice, active && styles.choiceActive]}>
        {active ? '☑' : '☐'} {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  block: { gap: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  area: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  choice: { fontSize: 15, color: '#374151', paddingVertical: 6 },
  choiceActive: { color: '#5B21B6', fontWeight: '600' },
  hint: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  error: { color: '#EF4444', marginTop: 8 },
});
