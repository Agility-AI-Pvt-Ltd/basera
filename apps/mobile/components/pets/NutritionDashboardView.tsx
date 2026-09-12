import Feather from '@expo/vector-icons/Feather';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PetAvatar } from '@/components/pets/PetAvatar';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import type { Pet } from '@/types/pet';
import type {
  FoodDiaryEntry,
  PetNutritionMeal,
  PetNutritionPlan,
} from '@/types/nutrition';
import {
  MEAL_TYPE_EMOJI,
  MEAL_TYPE_LABELS,
  NUTRITION_DISCLAIMER,
  formatFeedingTime,
} from '@/types/nutrition';

const CREAM = '#FFFBF5';
const GREEN = '#65A30D';
const GREEN_LIGHT = '#D9F99D';
const BROWN = '#3F2E1E';

type Props = {
  pet: Pet;
  plan: PetNutritionPlan;
  selectedDate: string;
  dayMeals: PetNutritionMeal[];
  mealsFed: number;
  mealProgress: number;
  dayWaterCups: number;
  dayTreatCount: number;
  foodDiary: FoodDiaryEntry[];
  onOpenPreferences: () => void;
  onToggleMeal: (mealId: string, fed: boolean) => void;
  onAddWater: () => void;
  onAddTreat: () => void;
};

function formatDateLabel(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const isToday = d.toDateString() === today.toDateString();
  const label = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  return isToday ? `Today · ${label}` : label;
}

export function NutritionDashboardView({
  pet,
  plan,
  selectedDate,
  dayMeals,
  mealsFed,
  mealProgress,
  dayWaterCups,
  dayTreatCount,
  foodDiary,
  onOpenPreferences,
  onToggleMeal,
  onAddWater,
  onAddTreat,
}: Props) {
  const waterGoal = plan.waterGoalCups ?? 6;
  const waterProgress = Math.min(1, dayWaterCups / waterGoal);
  const treatLimit = plan.treatLimit;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{pet.name}&apos;s Nutrition</Text>
          <Text style={styles.dateLabel}>{formatDateLabel(selectedDate)}</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={onOpenPreferences} accessibilityLabel="Nutrition preferences">
          <Feather name="settings" size={18} color={BROWN} />
        </Pressable>
        <PetAvatar name={pet.name} photoStorageKey={pet.photoStorageKey} size={44} />
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <SummaryPill emoji="🍽" label="Meals/day" value={String(plan.dailyMeals)} />
          <SummaryPill emoji="💧" label="Water goal" value={`~${waterGoal} cups`} />
          <SummaryPill emoji="🍖" label="Treat limit" value={`${treatLimit}/day`} />
        </View>
        <Text style={styles.disclaimer}>{NUTRITION_DISCLAIMER}</Text>
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.sectionTitle}>Daily Progress</Text>
        <Text style={styles.progressCount}>
          {mealsFed}/{dayMeals.length} meals
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(mealProgress * 100)}%` }]} />
      </View>

      <Text style={styles.sectionTitle}>Meals</Text>
      {dayMeals.length === 0 ? (
        <Text style={styles.empty}>No meals scheduled for this day.</Text>
      ) : (
        dayMeals.map((meal) => (
          <View key={meal.id} style={styles.mealCard}>
            <View style={styles.mealTop}>
              <Text style={styles.mealEmoji}>{MEAL_TYPE_EMOJI[meal.mealType]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealType}>{MEAL_TYPE_LABELS[meal.mealType]}</Text>
                <Text style={styles.mealTime}>{formatFeedingTime(meal.scheduledTime)}</Text>
              </View>
            </View>
            <Text style={styles.foodName}>🥣 {meal.foodName}</Text>
            <Text style={styles.portion}>
              Planned portion · {meal.plannedQuantity ?? '—'} {meal.unit}
            </Text>
            <Pressable
              style={[styles.fedBtn, meal.fed && styles.fedBtnDone]}
              onPress={() => onToggleMeal(meal.id, !meal.fed)}>
              {meal.fed ? (
                <>
                  <Feather name="check" size={16} color="#FFFFFF" />
                  <Text style={styles.fedBtnTextDone}>Fed</Text>
                </>
              ) : (
                <Text style={styles.fedBtnText}>Mark Fed</Text>
              )}
            </Pressable>
          </View>
        ))
      )}

      <View style={styles.trackCard}>
        <View style={styles.trackHeader}>
          <Text style={styles.trackTitle}>💧 Water</Text>
          <Pressable style={styles.addBtn} onPress={onAddWater}>
            <Feather name="plus" size={16} color={GREEN} />
            <Text style={styles.addBtnText}>Add Water</Text>
          </Pressable>
        </View>
        <Text style={styles.trackSub}>Today&apos;s intake (approximate goal)</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(waterProgress * 100)}%` }]} />
        </View>
        <Text style={styles.trackMeta}>
          {dayWaterCups} / ~{waterGoal} cups
        </Text>
      </View>

      <View style={styles.trackCard}>
        <View style={styles.trackHeader}>
          <Text style={styles.trackTitle}>🍖 Treats</Text>
          <Pressable style={styles.addBtn} onPress={onAddTreat}>
            <Feather name="plus" size={16} color={GREEN} />
            <Text style={styles.addBtnText}>Add Treat</Text>
          </Pressable>
        </View>
        <Text style={styles.trackMeta}>
          {dayTreatCount} / {treatLimit} today
        </Text>
        <View style={styles.treatDots}>
          {Array.from({ length: treatLimit }, (_, i) => (
            <View key={i} style={[styles.treatDot, i < dayTreatCount && styles.treatDotFilled]} />
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Food Diary</Text>
      <View style={styles.diaryCard}>
        {foodDiary.length === 0 ? (
          <Text style={styles.empty}>Nothing logged yet today.</Text>
        ) : (
          foodDiary.map((entry) => (
            <View key={entry.id} style={styles.diaryRow}>
              <Text style={styles.diaryTime}>{entry.time}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.diaryTitle}>
                  {entry.kind === 'meal' ? '🥣' : entry.kind === 'treat' ? '🍖' : '💧'} {entry.title}
                </Text>
                <Text style={styles.diarySub}>{entry.subtitle}</Text>
              </View>
              {entry.completed ? <Feather name="check-circle" size={18} color={GREEN} /> : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function SummaryPill({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillEmoji}>{emoji}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: CREAM },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: '700', color: BROWN },
  dateLabel: { fontSize: 13, color: '#78716C', marginTop: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  summaryRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1,
    backgroundColor: CREAM,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  pillEmoji: { fontSize: 18 },
  pillLabel: { fontSize: 10, color: '#78716C', marginTop: 4 },
  pillValue: { fontSize: 13, fontWeight: '700', color: BROWN, marginTop: 2 },
  disclaimer: { fontSize: 11, color: '#A8A29E', lineHeight: 15 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: BROWN },
  progressCount: { fontSize: 14, color: BROWN },
  progressTrack: {
    height: 10,
    borderRadius: 8,
    backgroundColor: GREEN_LIGHT,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: GREEN, borderRadius: 8 },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  mealTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealEmoji: { fontSize: 22 },
  mealType: { fontSize: 16, fontWeight: '700', color: BROWN },
  mealTime: { fontSize: 13, color: '#78716C' },
  foodName: { fontSize: 15, fontWeight: '600', color: BROWN },
  portion: { fontSize: 13, color: '#78716C' },
  fedBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: GREEN,
  },
  fedBtnDone: { backgroundColor: GREEN, borderColor: GREEN },
  fedBtnText: { color: GREEN, fontWeight: '700', fontSize: 14 },
  fedBtnTextDone: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  trackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  trackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackTitle: { fontSize: 16, fontWeight: '700', color: BROWN },
  trackSub: { fontSize: 12, color: '#78716C' },
  trackMeta: { fontSize: 14, fontWeight: '600', color: BROWN },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: GREEN_LIGHT,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: GREEN },
  treatDots: { flexDirection: 'row', gap: 6, marginTop: 4 },
  treatDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E7E5E4',
  },
  treatDotFilled: { backgroundColor: GREEN },
  diaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  diaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  diaryTime: { width: 72, fontSize: 12, color: '#78716C', fontWeight: '600' },
  diaryTitle: { fontSize: 14, fontWeight: '600', color: BROWN },
  diarySub: { fontSize: 12, color: '#78716C', marginTop: 2 },
  empty: { fontSize: 14, color: '#A8A29E' },
});
