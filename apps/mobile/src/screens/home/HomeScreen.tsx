import Feather from '@expo/vector-icons/Feather';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircularImage } from '@/components/CircularImage';
import { CoverImage } from '@/components/CoverImage';
import { UserAvatar } from '@/components/UserAvatar';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { BRAND_PURPLE, CATEGORIES, FEATURED_PETS, HOME_IMAGES } from '@/constants/home';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { HomeStackParamList } from '@/src/navigation/types';

const H_PADDING = 20;
const CARD_GAP = 16;
const TAB_BAR_CLEARANCE = 120;
const CATEGORY_SIZE = 72;

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [rowWidth, setRowWidth] = useState(windowWidth);
  const cardWidth = Math.max(0, rowWidth - H_PADDING * 2);
  const { profile } = useUserProfile();
  const [selectedCategory, setSelectedCategory] = useState('dogs');
  const locationLabel = profile?.city
    ? `${profile.locality ? `${profile.locality}, ` : ''}${profile.city}`
    : 'Set location';

  useEffect(() => {
    setRowWidth(windowWidth);
  }, [windowWidth]);

  const onFeaturedLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    if (next > 0 && Math.abs(next - rowWidth) > 0.5) {
      setRowWidth(next);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE + insets.bottom }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.navigate('SettingsMenu')}
            accessibilityRole="button"
            accessibilityLabel="Open settings">
            <UserAvatar photoUri={profile?.photoUri} size={44} />
          </Pressable>
          <Pressable style={styles.locationBlock}>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Location</Text>
              <Feather name="chevron-down" size={14} color="#6B7280" />
            </View>
            <Text style={styles.locationValue} numberOfLines={1}>
              {locationLabel}
            </Text>
          </Pressable>
          <Pressable style={styles.bellButton}>
            <Feather name="bell" size={20} color="#111827" />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Feather name="search" size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>
          <Pressable style={styles.filterButton}>
            <Feather name="sliders" size={20} color="#111827" />
          </Pressable>
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Pressable>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={styles.categoryItem}>
                <CircularImage
                  source={cat.image}
                  size={CATEGORY_SIZE}
                  active={active}
                  ringColor={BRAND_PURPLE}
                  ringWidth={3}
                />
                <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Featured cards */}
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + CARD_GAP}
          style={styles.horizontalScroll}
          contentContainerStyle={styles.cardsRow}
          onLayout={onFeaturedLayout}>
          {FEATURED_PETS.map((item) => (
            <View key={item.id} style={[styles.petCard, { width: cardWidth }]}>
              <View style={styles.petImageWrap}>
                <CoverImage source={item.image} style={styles.petImageFill} />
                <Pressable style={styles.bookmarkBtn}>
                  <Feather name="bookmark" size={18} color="#111827" />
                </Pressable>
              </View>
              <View style={styles.petInfo}>
                <View style={styles.petTextBlock}>
                  <Text style={styles.petName}>{item.name}</Text>
                  <View style={styles.distanceRow}>
                    <Feather name="map-pin" size={12} color="#9CA3AF" />
                    <Text style={styles.distanceText}>Distance ({item.distance})</Text>
                  </View>
                </View>
                <Pressable style={styles.arrowBtn}>
                  <Feather name="arrow-up-right" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  categoryLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  categoryLabelActive: {
    color: '#111827',
    fontWeight: '600',
  },
  locationBlock: {
    flex: 1,
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  locationValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '200',
    color: '#111827',
    marginTop: 2,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '200',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  categoriesRow: {
    paddingHorizontal: 20,
    gap: 20,
    marginBottom: 28,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 8,
  },
  horizontalScroll: {
    alignSelf: 'stretch',
    width: '100%',
  },
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: H_PADDING,
    gap: CARD_GAP,
  },
  petCard: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  petImageWrap: {
    width: '100%',
    height: 220,
    overflow: 'hidden',
    position: 'relative',
  },
  petImageFill: {
    width: '100%',
    height: '100%',
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  petTextBlock: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  petName: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '200',
    color: '#111827',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  arrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
