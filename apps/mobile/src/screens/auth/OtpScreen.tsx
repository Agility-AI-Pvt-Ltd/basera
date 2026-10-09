import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import { useUserProfile } from '@/hooks/useUserProfile';
import type { AuthStackParamList } from '@/src/navigation/types';
import { isValidEmail, maskEmail } from '@/utils/email';

const BRAND_PURPLE = '#7C3AED';
const OTP_LENGTH = 6;
const H_PADDING = 24;
const OTP_GAP = 10;
const SCREEN_WIDTH = Dimensions.get('window').width;
const OTP_BOX_SIZE = Math.min(
  56,
  Math.floor((SCREEN_WIDTH - H_PADDING * 2 - OTP_GAP * (OTP_LENGTH - 1)) / OTP_LENGTH),
);

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Otp'>;
type OtpRoute = RouteProp<AuthStackParamList, 'Otp'>;

export default function OtpScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<OtpRoute>();
  const email = params?.email ?? '';
  const { sendOtp, verifyOtp } = useAuthStatus();
  const { refreshProfile } = useUserProfile();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const inputsRef = useRef<Array<TextInput | null>>([]);

  const enteredCode = useMemo(() => otp.join(''), [otp]);
  const isComplete = enteredCode.length === OTP_LENGTH;
  const emailInvalid = !isValidEmail(email);

  useEffect(() => {
    if (emailInvalid) {
      navigation.navigate('Email');
    }
  }, [emailInvalid, navigation]);

  if (emailInvalid) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={BRAND_PURPLE} />
      </View>
    );
  }

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await sendOtp(email);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  const handleContinue = async () => {
    if (!isComplete || loading) return;

    setLoading(true);
    setError('');

    try {
      await verifyOtp(email, enteredCode);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect or expired code');
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
          <BackButton onFallback={() => navigation.navigate('Email')} />
        </View>

        <Text style={styles.title}>Enter the code from your email</Text>
        <Text style={styles.subtitle}>Code sent to {maskEmail(email)}</Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputsRef.current[index] = ref;
              }}
              value={digit}
              onChangeText={(value) => handleChange(index, value)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!loading}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
            />
          ))}
        </View>

        <Pressable onPress={() => void handleResend()} disabled={resending || loading}>
          <Text style={[styles.resend, (resending || loading) && styles.resendDisabled]}>
            {resending ? 'Sending…' : 'Get a new code'}
          </Text>
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          onPress={() => void handleContinue()}
          disabled={!isComplete || loading}
          style={({ pressed }) => [
            styles.button,
            (!isComplete || loading) && styles.buttonDisabled,
            pressed && isComplete && !loading && styles.buttonPressed,
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingTop: 8,
  },
  backRow: {
    marginBottom: 24,
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
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: OTP_GAP,
    marginBottom: 20,
  },
  otpBox: {
    width: OTP_BOX_SIZE,
    height: OTP_BOX_SIZE,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: FONT_FAMILY,
    fontWeight: '200',
    color: '#111827',
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  otpBoxFilled: {
    borderColor: BRAND_PURPLE,
  },
  resend: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '200',
    color: BRAND_PURPLE,
    marginBottom: 12,
  },
  resendDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
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
