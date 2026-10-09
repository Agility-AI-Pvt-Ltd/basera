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
import type { AuthStackParamList } from '@/src/navigation/types';
import { isValidEmail, normalizeEmail } from '@/utils/email';

const BRAND_PURPLE = '#7C3AED';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Email'>;

export default function EmailScreen() {
  const navigation = useNavigation<Nav>();
  const { sendOtp } = useAuthStatus();
  const { hasCompleted, completeOnboarding, resetOnboarding } = useOnboardingStatus();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = useMemo(() => isValidEmail(email), [email]);
  const showError = touched && email.length > 0 && !isValid;

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

      const normalized = normalizeEmail(email);
      await sendOtp(normalized);
      navigation.navigate('Otp', { email: normalized });
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

        <Text style={styles.title}>Let&apos;s get started with your email</Text>
        <Text style={styles.subtitle}>
          Enter your email to continue. We&apos;ll send you a quick verification code.
        </Text>

        <View style={[styles.field, showError && styles.fieldError]}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
            onBlur={() => setTouched(true)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            autoFocus
            editable={!loading}
          />
        </View>

        {showError ? (
          <Text style={styles.errorText}>Enter a valid email address</Text>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          onPress={() => void handleContinue()}
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
  field: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  fieldError: {
    borderColor: '#EF4444',
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
