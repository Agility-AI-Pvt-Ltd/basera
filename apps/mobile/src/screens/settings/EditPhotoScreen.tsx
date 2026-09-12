import Feather from '@expo/vector-icons/Feather';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { CircularImage } from '@/components/CircularImage';
import { ImageCropModal } from '@/components/ImageCropModal';
import { PrimaryButton } from '@/components/SignupShell';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { UserAvatar } from '@/components/UserAvatar';
import { Text } from '@/components/Themed';
import { useUserProfile } from '@/hooks/useUserProfile';
import { pickProfileImageFromLibrary, takeProfileImage } from '@/lib/pickProfileImage';
import { removeOldProfilePhoto, uploadProfilePhoto } from '@/lib/profileStorage';
import { supabase } from '@/lib/supabase';
import type { HomeStackParamList } from '@/src/navigation/types';

const BRAND = '#7C3AED';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'EditPhoto'>;

export default function EditPhotoScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, updateProfile } = useUserProfile();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [fileName, setFileName] = useState('avatar.jpg');
  const [cropUri, setCropUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickFromLibrary = async () => {
    try {
      const picked = await pickProfileImageFromLibrary();
      if (!picked) return;
      setCropUri(picked.uri);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open gallery');
    }
  };

  const takePhoto = async () => {
    try {
      const picked = await takeProfileImage();
      if (!picked) return;
      setCropUri(picked.uri);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera permission is required.');
    }
  };

  const handleSave = async () => {
    if (!previewUri) {
      setError('Choose or take a photo first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await removeOldProfilePhoto(profile?.photoUri);
      const storageKey = await uploadProfilePhoto(user.id, previewUri, mimeType, fileName);
      await updateProfile({ photoUri: storageKey });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SettingsShell
        title="Profile photo"
        onBack={() => navigation.goBack()}
        footer={<PrimaryButton label="Save photo" onPress={handleSave} disabled={loading} />}>
        <View style={styles.previewWrap}>
          {previewUri ? (
            <CircularImage source={{ uri: previewUri }} size={120} />
          ) : (
            <UserAvatar photoUri={profile?.photoUri} size={120} />
          )}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={pickFromLibrary}>
            <Feather name="image" size={20} color={BRAND} />
            <Text style={styles.actionText}>Choose from library</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={takePhoto}>
            <Feather name="camera" size={20} color={BRAND} />
            <Text style={styles.actionText}>Take a photo</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={BRAND} />
            <Text style={styles.loadingText}>Uploading…</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </SettingsShell>

      <ImageCropModal
        visible={cropUri != null}
        imageUri={cropUri}
        onCancel={() => setCropUri(null)}
        onCropped={(cropped) => {
          setPreviewUri(cropped.uri);
          setMimeType(cropped.mimeType);
          setFileName(cropped.fileName);
          setCropUri(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  previewWrap: { alignItems: 'center', paddingVertical: 16 },
  actions: { gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: { fontSize: 15, color: '#111827' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: '#6B7280' },
  error: { color: '#EF4444', fontSize: 13 },
});
