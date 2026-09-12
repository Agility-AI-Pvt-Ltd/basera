import * as ImagePicker from 'expo-image-picker';

export type PickedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
  width?: number;
  height?: number;
};

/** Pick from library without system crop — app crop UI handles framing. */
export async function pickProfileImageFromLibrary(): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
    width: asset.width,
    height: asset.height,
  };
}

export async function takeProfileImage(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Camera permission is required.');
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileName: `camera-${Date.now()}.jpg`,
    width: asset.width,
    height: asset.height,
  };
}
