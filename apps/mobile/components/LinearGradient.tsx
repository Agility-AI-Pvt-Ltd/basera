import {
  LinearGradient as ExpoLinearGradient,
  type LinearGradientProps,
} from 'expo-linear-gradient';
import type { ComponentType } from 'react';

/** Wrapper: expo-linear-gradient class types conflict with React 19.2 JSX checking. */
export const LinearGradient = ExpoLinearGradient as unknown as ComponentType<LinearGradientProps>;
