import { useColorScheme as useRNColorScheme } from 'react-native';

/** RN 0.86 can return `unspecified`; theme maps only support light/dark. */
export function useColorScheme(): 'light' | 'dark' {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
