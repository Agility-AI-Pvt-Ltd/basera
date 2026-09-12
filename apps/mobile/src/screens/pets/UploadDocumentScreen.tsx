import Feather from '@expo/vector-icons/Feather';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { usePetDocuments } from '@/hooks/usePetDocuments';
import { usePets } from '@/hooks/usePets';
import type { PetsStackParamList } from '@/src/navigation/types';
import { PET_DOCUMENT_LABELS, type PetDocumentType } from '@/types/pet';

const BRAND = '#7C3AED';

type Nav = NativeStackNavigationProp<PetsStackParamList, 'UploadDocument'>;
type Route = RouteProp<PetsStackParamList, 'UploadDocument'>;

const DOC_TYPES = Object.entries(PET_DOCUMENT_LABELS) as [PetDocumentType, string][];

export default function UploadDocumentScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { getPet } = usePets();
  const { uploadDocument } = usePetDocuments(params.petId);

  const [docType, setDocType] = useState<PetDocumentType>('vaccination_rabies');
  const [issuedDate, setIssuedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setFileUri(asset.uri);
    setFileName(asset.fileName ?? `photo-${Date.now()}.jpg`);
    setMimeType(asset.mimeType ?? 'image/jpeg');
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setFileUri(asset.uri);
    setFileName(asset.name);
    setMimeType(asset.mimeType ?? 'application/pdf');
  };

  const handleUpload = async () => {
    if (!fileUri) {
      setError('Choose a photo or PDF first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const pet = await getPet(params.petId);
      if (!pet) throw new Error('Pet not found');
      await uploadDocument({
        petId: params.petId,
        ownerId: pet.ownerId,
        docType,
        fileUri,
        mimeType,
        fileName,
        issuedDate: issuedDate.trim() || null,
        expiryDate: expiryDate.trim() || null,
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <BackButton onFallback={() => navigation.goBack()} />
        <Text style={styles.title}>Upload document</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.sectionLabel}>Document type</Text>
        <View style={styles.typeList}>
          {DOC_TYPES.map(([type, label]) => (
            <Pressable
              key={type}
              onPress={() => setDocType(type)}
              style={[styles.typeRow, docType === type && styles.typeRowActive]}>
              <Text style={styles.typeText}>{label}</Text>
              {docType === type ? <Feather name="check" size={18} color={BRAND} /> : null}
            </Pressable>
          ))}
        </View>

        <View style={styles.pickRow}>
          <Pressable style={styles.pickBtn} onPress={pickImage}>
            <Feather name="camera" size={20} color={BRAND} />
            <Text style={styles.pickText}>Photo</Text>
          </Pressable>
          <Pressable style={styles.pickBtn} onPress={pickDocument}>
            <Feather name="file" size={20} color={BRAND} />
            <Text style={styles.pickText}>PDF / file</Text>
          </Pressable>
        </View>

        {fileName ? <Text style={styles.fileName}>Selected: {fileName}</Text> : null}

        <Field label="Issued date (YYYY-MM-DD)">
          <TextInput value={issuedDate} onChangeText={setIssuedDate} style={styles.input} placeholder="2024-01-15" />
        </Field>
        <Field label="Expiry date (YYYY-MM-DD)">
          <TextInput value={expiryDate} onChangeText={setExpiryDate} style={styles.input} placeholder="2025-01-15" />
        </Field>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.uploadBtn, loading && styles.uploadBtnDisabled]}
          onPress={handleUpload}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadBtnText}>Upload to pet record</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '200',
  },
  spacer: { width: 44 },
  body: { paddingHorizontal: 20, gap: 14 },
  sectionLabel: { fontSize: 13, color: '#6B7280' },
  typeList: { gap: 8 },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeRowActive: { borderColor: BRAND, backgroundColor: '#FAF5FF' },
  typeText: { fontSize: 15, color: '#111827' },
  pickRow: { flexDirection: 'row', gap: 12 },
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BRAND,
  },
  pickText: { color: BRAND, fontWeight: '600' },
  fileName: { fontSize: 13, color: '#6B7280' },
  field: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
  },
  fieldLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  input: { fontSize: 16, color: '#111827', padding: 0 },
  error: { color: '#EF4444', fontSize: 13 },
  uploadBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 16 },
});
