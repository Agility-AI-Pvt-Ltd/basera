import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

import { getPetMediaUrl } from '@/lib/petStorage';

export async function viewPetDocument(storageKey: string) {
  const url = await getPetMediaUrl(storageKey);
  if (!url) throw new Error('Could not open document');
  await Linking.openURL(url);
}

export async function downloadPetDocument(storageKey: string, suggestedName: string) {
  const url = await getPetMediaUrl(storageKey);
  if (!url) throw new Error('Could not download document');

  if (Platform.OS === 'web') {
    await Linking.openURL(url);
    return;
  }

  const safeName = suggestedName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'document';
  const target = `${FileSystem.cacheDirectory}${Date.now()}-${safeName}`;
  const result = await FileSystem.downloadAsync(url, target);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, { dialogTitle: 'Save document' });
  } else {
    await Linking.openURL(result.uri);
  }
}
