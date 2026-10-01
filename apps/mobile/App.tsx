import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Sniglet_400Regular, Sniglet_800ExtraBold } from '@expo-google-fonts/sniglet';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { FONT_FAMILY } from '@/constants/Fonts';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useUserProfile } from '@/hooks/useUserProfile';
import { AuthStack } from '@/src/navigation/AuthStack';
import { MainTabs } from '@/src/navigation/MainTabs';
import { OnboardingStack } from '@/src/navigation/OnboardingStack';
import { SignupStack } from '@/src/navigation/SignupStack';
import { getSignupRoute } from '@/types/profile';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [loaded, error] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
    SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootNavigator />;
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { isReady: authReady, session } = useAuthStatus();
  const { isReady: onboardingReady, hasCompleted } = useOnboardingStatus();
  const { isReady: profileReady, isSignupComplete, profile } = useUserProfile();

  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...baseTheme,
    fonts: {
      regular: { fontFamily: FONT_FAMILY, fontWeight: '200' as const },
      medium: { fontFamily: FONT_FAMILY, fontWeight: '200' as const },
      bold: { fontFamily: FONT_FAMILY, fontWeight: '200' as const },
      heavy: { fontFamily: FONT_FAMILY, fontWeight: '200' as const },
    },
  };

  const isReady = authReady && onboardingReady && profileReady;
  const hasEnteredMainAppRef = useRef(false);

  useEffect(() => {
    if (!session?.user?.id) {
      hasEnteredMainAppRef.current = false;
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (isReady && session && hasCompleted && isSignupComplete) {
      hasEnteredMainAppRef.current = true;
    }
  }, [isReady, session, hasCompleted, isSignupComplete]);

  const showBootstrapLoader = !isReady && !hasEnteredMainAppRef.current;

  let content: ReactNode;
  if (showBootstrapLoader) {
    content = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  } else if (!session) {
    content = <AuthStack initialRouteName={hasCompleted ? 'Phone' : 'Onboarding'} />;
  } else if (!hasCompleted) {
    content = <OnboardingStack />;
  } else if (!isSignupComplete && isReady) {
    content = <SignupStack initialRouteName={getSignupRoute(profile) ?? 'Basics'} />;
  } else if (hasEnteredMainAppRef.current || isSignupComplete) {
    content = <MainTabs />;
  } else {
    content = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        key={session?.user?.id ?? 'logged-out'}
        theme={theme}>
        {content}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
