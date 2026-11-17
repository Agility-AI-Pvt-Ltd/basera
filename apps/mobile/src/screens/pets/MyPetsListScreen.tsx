import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetAvatar } from '@/components/pets/PetAvatar';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { scrollPaddingBelowTabBar } from '@/constants/layout';
import { usePets } from '@/hooks/usePets';
import type { PetsStackParamList } from '@/src/navigation/types';
import { computePetAge } from '@/types/pet';

const BRAND = '#7C3AED';

type Nav = NativeStackNavigationProp<PetsStackParamList, 'MyPetsList'>;

function EmptyProfilePreview() {
  return (
    <View style={styles.previewCard}>
      <Text style={styles.previewLabel}>What you get</Text>
      <View style={styles.previewRow}>
        <View style={styles.previewIcon}>
          <Feather name="calendar" size={16} color={BRAND} />
        </View>
        <Text style={styles.previewText}>Care reminders with vet, grooming, and meds</Text>
      </View>
      <View style={styles.previewRow}>
        <View style={styles.previewIcon}>
          <Feather name="heart" size={16} color={BRAND} />
        </View>
        <Text style={styles.previewText}>Health schedule card with overdue highlights</Text>
      </View>
      <View style={styles.previewRow}>
        <View style={styles.previewIcon}>
          <Feather name="file-text" size={16} color={BRAND} />
        </View>
        <Text style={styles.previewText}>Vaccination documents in one place</Text>
      </View>
    </View>
  );
}

export default function MyPetsListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { pets, isReady, error } = usePets();

  if (!isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Pets</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreatePetProfile')}>
          <Feather name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {pets.length === 0 ? (
        <ScrollView
          contentContainerStyle={[
            styles.empty,
            { paddingBottom: scrollPaddingBelowTabBar(insets.bottom) },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.emptyIcon}>
            <FontAwesome name="paw" size={28} color={BRAND} />
          </View>
          <Text style={styles.emptyTitle}>Let&apos;s add your first pet</Text>
          <Text style={styles.emptyBody}>
            Track care tasks, health visits, and documents from one profile.
          </Text>
          <EmptyProfilePreview />
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('CreatePetProfile')}>
            <Text style={styles.primaryBtnText}>Create pet profile</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: scrollPaddingBelowTabBar(insets.bottom) },
          ]}
          showsVerticalScrollIndicator={false}>
          {pets.map((pet) => (
            <Pressable
              key={pet.id}
              style={styles.card}
              onPress={() => navigation.navigate('PetDetail', { petId: pet.id })}>
              <PetAvatar name={pet.name} photoStorageKey={pet.photoStorageKey} size={72} />
              <Text style={styles.petName} numberOfLines={1}>
                {pet.name}
              </Text>
              <Text style={styles.petMeta} numberOfLines={1}>
                {pet.breed || 'Mixed breed'} · {computePetAge(pet.birthDate)}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.card, styles.addCard]}
            onPress={() => navigation.navigate('CreatePetProfile')}>
            <Feather name="plus" size={28} color={BRAND} />
            <Text style={styles.addLabel}>Add pet</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: '#EF4444',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  previewCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  previewLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.4 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: { flex: 1, fontSize: 14, color: '#374151' },
  primaryBtn: {
    width: '100%',
    backgroundColor: BRAND,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  addCard: {
    borderStyle: 'dashed',
    borderColor: '#C4B5FD',
    justifyContent: 'center',
    minHeight: 140,
  },
  petName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  petMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  addLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND,
  },
});