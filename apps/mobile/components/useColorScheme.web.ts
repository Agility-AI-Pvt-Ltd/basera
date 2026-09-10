// NOTE: The default React Native styling doesn't support server rendering.
// Server rendered styles should not change between the first render of the HTML
// and the first render on the client.
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
