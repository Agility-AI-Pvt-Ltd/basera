import Feather from '@expo/vector-icons/Feather';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetAvatar } from '@/components/pets/PetAvatar';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { usePets } from '@/hooks/usePets';
import type { PetsStackParamList } from '@/src/navigation/types';
import { computePetAge } from '@/types/pet';

const TAB_BAR_CLEARANCE = 120;
const BRAND = '#7C3AED';

type Nav = NativeStackNavigationProp<PetsStackParamList, 'MyPetsList'>;

export default function MyPetsListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { pets, isReady, error, loadPets } = usePets();

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
        <Text style={styles.title}>My pets</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreatePetProfile')}>
          <Feather name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {pets.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Feather name="heart" size={32} color={BRAND} />
          </View>
          <Text style={styles.emptyTitle}>No pet profiles yet</Text>
          <Text style={styles.emptyBody}>
            Create a profile to track health, training, nutrition, and vaccination documents.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('CreatePetProfile')}>
            <Text style={styles.primaryBtnText}>Create pet profile</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom },
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
    fontWeight: '200',
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '200',
    color: '#111827',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: BRAND,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '200',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  addCard: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    minHeight: 160,
  },
  addLabel: {
    fontSize: 14,
    color: BRAND,
    fontWeight: '600',
  },
  petName: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '200',
    color: '#111827',
  },
  petMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
