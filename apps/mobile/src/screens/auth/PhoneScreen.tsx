import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { isValidIndianMobile } from '@/utils/phone';
import type { AuthStackParamList } from '@/src/navigation/types';

const BRAND_PURPLE = '#7C3AED';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Phone'>;

export default function PhoneScreen() {
  const navigation = useNavigation<Nav>();
  const { sendOtp } = useAuthStatus();
  const { hasCompleted, completeOnboarding, resetOnboarding } = useOnboardingStatus();
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = useMemo(() => isValidIndianMobile(phone), [phone]);
  const showError = touched && phone.length > 0 && !isValid;

  const handleBackToCarousel = async () => {
    await resetOnboarding();
    navigation.navigate('Onboarding');
  };

  const handleContinue = async () => {
    setTouched(true);
    if (!isValid) return;

    setLoading(true);
    setError('');

    try {
      if (!hasCompleted) {
        await completeOnboarding();
      }

      await sendOtp(phone);
      navigation.navigate('Otp', { phone });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#F3E8FF', '#FFFFFF']}
        style={styles.topGlow}
        pointerEvents="none"
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.backRow}>
          <BackButton onPress={handleBackToCarousel} />
        </View>
        <Text style={styles.brand}>Basera.</Text>

        <Text style={styles.title}>Let&apos;s get started with your phone number</Text>
        <Text style={styles.subtitle}>
          Enter your phone number to continue. We&apos;ll send you a quick verification
          code.
        </Text>

        <View style={styles.row}>
          <View style={[styles.field, styles.countryField]}>
            <Text style={styles.fieldLabel}>Country</Text>
            <View style={styles.countryValue}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.countryCode}>+91</Text>
            </View>
          </View>

          <View style={[styles.field, styles.phoneField, showError && styles.fieldError]}>
            <Text style={styles.fieldLabel}>Phone number</Text>
            <TextInput
              value={phone}
              onChangeText={(value) => {
                const digits = value.replace(/\D/g, '').slice(0, 10);
                setPhone(digits);
                setError('');
              }}
              onBlur={() => setTouched(true)}
              keyboardType="number-pad"
              maxLength={10}
              placeholder="9876543210"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoFocus
              editable={!loading}
            />
          </View>
        </View>

        {showError ? (
          <Text style={styles.errorText}>Enter a valid 10-digit Indian mobile number</Text>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          onPress={handleContinue}
          disabled={!isValid || loading}
          style={({ pressed }) => [
            styles.button,
            (!isValid || loading) && styles.buttonDisabled,
            pressed && isValid && !loading && styles.buttonPressed,
          ]}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  backRow: {
    marginBottom: 20,
  },
  brand: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    fontWeight: '200',
    color: BRAND_PURPLE,
    marginBottom: 28,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    fontWeight: '200',
    lineHeight: 34,
    color: '#111827',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
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
  fieldError: {
    borderColor: '#EF4444',
  },
  countryField: {
    width: 110,
  },
  phoneField: {
    flex: 1,
  },
  fieldLabel: {
    position: 'absolute',
    top: -9,
    left: 12,
    paddingHorizontal: 4,
    backgroundColor: '#FFFFFF',
    fontSize: 12,
    color: '#6B7280',
  },
  countryValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  flag: {
    fontSize: 18,
  },
  countryCode: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '200',
    color: '#111827',
  },
  input: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: '#111827',
    padding: 0,
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
    height: 54,
    borderRadius: 27,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '200',
  },
});
