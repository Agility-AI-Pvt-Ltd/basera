import Feather from '@expo/vector-icons/Feather';
import { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { PetAvatar } from '@/components/pets/PetAvatar';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import type { Pet } from '@/types/pet';
import type { PetTrainingTask, TrainingDayProgress, TrainingStats } from '@/types/training';
import { DISPLAY_TAG_COLORS, formatRoutineDayLabel } from '@/types/training';

const CREAM = '#FFF5F2';
const BROWN = '#4A2C2A';
const CORAL = '#FF7E8D';
const BLUE = '#5DBBFF';

type Props = {
  pet: Pet;
  selectedDate: string;
  weekDates: string[];
  weekProgress: TrainingDayProgress[];
  dayTasks: PetTrainingTask[];
  dayCompleted: number;
  stats: TrainingStats;
  onSelectDate: (date: string) => void;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onOpenPreferences: () => void;
};

function shortDay(dateIso: string): string {
  return new Date(`${dateIso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
}

function dayNumber(dateIso: string): string {
  return String(new Date(`${dateIso}T12:00:00`).getDate());
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TrainingRoutineView({
  pet,
  selectedDate,
  weekDates,
  weekProgress,
  dayTasks,
  dayCompleted,
  stats,
  onSelectDate,
  onToggleTask,
  onOpenPreferences,
}: Props) {
  const carouselRef = useRef<FlatList<PetTrainingTask>>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const cardWidth = Dimensions.get('window').width - 48;

  const nextTasks = useMemo(
    () => dayTasks.filter((t) => !t.completed),
    [dayTasks],
  );
  const featured = nextTasks[0] ?? dayTasks[0];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.routineTitle}>{formatRoutineDayLabel(selectedDate)}&apos;S ROUTINE</Text>
        </View>
        <Pressable
          style={styles.prefsBtn}
          onPress={onOpenPreferences}
          accessibilityLabel="Training preferences">
          <Feather name="settings" size={18} color={BROWN} />
        </Pressable>
        <PetAvatar name={pet.name} photoStorageKey={pet.photoStorageKey} size={44} />
      </View>

      <Text style={styles.weekLabel}>This Week</Text>
      <View style={styles.weekRow}>
        {weekDates.map((date) => {
          const progress = weekProgress.find((p) => p.date === date);
          const active = date === selectedDate;
          const fill =
            progress && progress.total > 0 ? progress.completed / progress.total : 0;
          return (
            <Pressable key={date} style={styles.dayCell} onPress={() => onSelectDate(date)}>
              <Text style={[styles.dayName, active && styles.dayNameActive]}>{shortDay(date)}</Text>
              <View style={[styles.dayBubble, active && styles.dayBubbleActive]}>
                <Text style={[styles.dayNum, active && styles.dayNumActive]}>{dayNumber(date)}</Text>
              </View>
              <View style={styles.dayProgressTrack}>
                <View
                  style={[
                    styles.dayProgressFill,
                    { width: `${Math.round(fill * 100)}%` },
                    date > todayIso() && styles.dayProgressFuture,
                  ]}
                />
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Today&apos;s Progress</Text>
        <Text style={styles.progressCount}>
          {dayCompleted}/{dayTasks.length} Activities
        </Text>
      </View>
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            {
              width:
                dayTasks.length > 0
                  ? `${Math.round((dayCompleted / dayTasks.length) * 100)}%`
                  : '0%',
            },
          ]}
        />
      </View>

      {featured ? (
        <>
          <Text style={styles.sectionDot}>• Next Activities</Text>
          <FlatList
            ref={carouselRef}
            data={nextTasks.length ? nextTasks : [featured]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 12));
              setCarouselIndex(idx);
            }}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                width={cardWidth}
                featured
                onToggle={onToggleTask}
              />
            )}
            contentContainerStyle={{ gap: 12 }}
          />
          {(nextTasks.length || 1) > 1 ? (
            <View style={styles.dots}>
              {(nextTasks.length ? nextTasks : [featured]).map((task, i) => (
                <View key={task.id} style={[styles.dot, i === carouselIndex && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Today&apos;s Activities</Text>
      {dayTasks.length === 0 ? (
        <Text style={styles.empty}>No activities scheduled for this day.</Text>
      ) : (
        dayTasks.map((task) => (
          <TaskCard key={task.id} task={task} onToggle={onToggleTask} />
        ))
      )}

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Progress</Text>
        <View style={styles.statsRow}>
          <StatPill icon="zap" label={`${stats.streakDays} day streak`} />
          <StatPill icon="check-circle" label={`${stats.totalSessions} sessions`} />
          <StatPill icon="trending-up" label={`${stats.completionRate}% rate`} />
        </View>
      </View>
    </ScrollView>
  );
}

function TaskCard({
  task,
  width,
  featured,
  onToggle,
}: {
  task: PetTrainingTask;
  width?: number;
  featured?: boolean;
  onToggle: (taskId: string, completed: boolean) => void;
}) {
  const tagColor = DISPLAY_TAG_COLORS[task.displayTag] ?? '#E5E7EB';

  return (
    <View style={[styles.taskCard, width ? { width } : null, featured && styles.taskCardFeatured]}>
      <View style={styles.taskTop}>
        <View style={[styles.tag, { backgroundColor: tagColor }]}>
          <Text style={styles.tagText}>{task.displayTag}</Text>
        </View>
        <Text style={styles.duration}>{task.durationMinutes} mins</Text>
      </View>
      <View style={styles.taskBody}>
        <View style={{ flex: 1 }}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskDesc} numberOfLines={featured ? 4 : 2}>
            {task.description}
          </Text>
        </View>
        <Pressable
          style={[styles.checkRing, task.completed && styles.checkRingDone]}
          onPress={() => onToggle(task.id, !task.completed)}
          accessibilityLabel={task.completed ? 'Mark incomplete' : 'Mark complete'}>
          {task.completed ? <Feather name="check" size={18} color="#FFFFFF" /> : null}
        </Pressable>
      </View>
    </View>
  );
}

function StatPill({ icon, label }: { icon: React.ComponentProps<typeof Feather>['name']; label: string }) {
  return (
    <View style={styles.statPill}>
      <Feather name={icon} size={14} color={BROWN} />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: CREAM, alignSelf: 'stretch' },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  routineTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '700',
    color: BROWN,
    letterSpacing: 0.5,
  },
  prefsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: { fontSize: 13, color: BROWN, fontWeight: '600', marginTop: 4 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dayCell: { alignItems: 'center', flex: 1, gap: 4 },
  dayName: { fontSize: 11, color: '#9CA3AF' },
  dayNameActive: { color: BROWN, fontWeight: '700' },
  dayBubble: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubbleActive: { backgroundColor: CORAL },
  dayNum: { fontSize: 14, fontWeight: '700', color: BROWN },
  dayNumActive: { color: '#FFFFFF' },
  dayProgressTrack: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FECDD3',
    overflow: 'hidden',
  },
  dayProgressFill: { height: '100%', backgroundColor: BLUE, borderRadius: 2 },
  dayProgressFuture: { backgroundColor: '#E5E7EB' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressLabel: { fontSize: 14, fontWeight: '600', color: BROWN },
  progressCount: { fontSize: 14, color: BROWN },
  progressBarTrack: {
    height: 10,
    borderRadius: 8,
    backgroundColor: '#FECDD3',
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: BLUE, borderRadius: 8 },
  sectionDot: { color: CORAL, fontWeight: '700', fontSize: 14, marginTop: 8 },
  sectionTitle: { color: BROWN, fontWeight: '700', fontSize: 16, marginTop: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB' },
  dotActive: { backgroundColor: CORAL, width: 16 },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  taskCardFeatured: { marginBottom: 0 },
  taskTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagText: { fontSize: 11, fontWeight: '800', color: BROWN },
  duration: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  taskBody: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 12 },
  taskTitle: { fontSize: 18, fontWeight: '700', color: BROWN },
  taskDesc: { fontSize: 13, color: '#6B4E4C', marginTop: 6, lineHeight: 18 },
  checkRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: CORAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRingDone: { backgroundColor: CORAL, borderColor: CORAL },
  empty: { color: '#9CA3AF', fontSize: 14 },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  statsTitle: { fontSize: 16, fontWeight: '700', color: BROWN, marginBottom: 10 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CREAM,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statText: { fontSize: 12, color: BROWN, fontWeight: '600' },
});
