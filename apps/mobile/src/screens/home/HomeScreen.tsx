import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircularImage } from '@/components/CircularImage';
import { CoverImage } from '@/components/CoverImage';
import { LinearGradient } from '@/components/LinearGradient';
import { UserAvatar } from '@/components/UserAvatar';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import {
  BRAND_PURPLE,
  BRAND_PURPLE_DARK,
  BRAND_PURPLE_LIGHT,
  CATEGORIES,
  FEATURED_PETS,
  NEARBY_PETS,
  type Category,
  type FeaturedPet,
  type NearbyPet,
} from '@/constants/home';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { HomeStackParamList, MainTabParamList } from '@/src/navigation/types';

const H_PADDING = 20;
const CARD_GAP = 14;
const TAB_BAR_CLEARANCE = 120;
const CATEGORY_SIZE = 68;
const NEARBY_CARD_SIZE = 132;

type HomeNav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Home'>,
  BottomTabNavigationProp<MainTabParamList>
>;

function CategoryChip({
  category,
  active,
  onPress,
}: {
  category: Category;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.categoryItem}>
      {category.image ? (
        <CircularImage
          source={category.image}
          size={CATEGORY_SIZE}
          active={active}
          ringColor={BRAND_PURPLE_DARK}
          ringWidth={3}
        />
      ) : (
        <View
          style={[
            styles.categoryIconCircle,
            active && styles.categoryIconCircleActive,
            { width: CATEGORY_SIZE, height: CATEGORY_SIZE, borderRadius: CATEGORY_SIZE / 2 },
          ]}>
          <FontAwesome name="paw" size={26} color={BRAND_PURPLE_DARK} />
        </View>
      )}
      <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
        {category.label}
      </Text>
    </Pressable>
  );
}

function FeaturedPetCard({ pet, width }: { pet: FeaturedPet; width: number }) {
  const genderColor = pet.gender === 'male' ? '#3B82F6' : '#EC4899';
  const genderSymbol = pet.gender === 'male' ? '♂' : '♀';

  return (
    <View style={[styles.featuredCard, { width }]}>
      <View style={styles.featuredImageWrap}>
        <CoverImage source={pet.image} style={styles.featuredImageFill} />
        <Pressable style={styles.heartBtn} accessibilityLabel="Save pet">
          <Feather name="heart" size={18} color="#111827" />
        </Pressable>
        <View style={styles.distanceBadge}>
          <Feather name="map-pin" size={12} color={BRAND_PURPLE_DARK} />
          <Text style={styles.distanceBadgeText}>{pet.distance}</Text>
        </View>
      </View>
      <View style={styles.featuredBody}>
        <Text style={styles.featuredBreed}>{pet.breed}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.metaGender, { color: genderColor }]}>
            {genderSymbol} {pet.age}
          </Text>
          <View style={styles.metaDot} />
          <FontAwesome name="paw" size={12} color={BRAND_PURPLE_DARK} />
          <Text style={styles.metaTrait}>{pet.trait}</Text>
        </View>
      </View>
    </View>
  );
}

function NearbyPetCard({ pet }: { pet: NearbyPet }) {
  return (
    <View style={styles.nearbyCard}>
      <CoverImage source={pet.image} style={styles.nearbyImage} />
      <Pressable style={styles.nearbyHeartBtn} accessibilityLabel={`Save ${pet.name}`}>
        <Feather name="heart" size={16} color="#111827" />
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const featuredCardWidth = Math.min(268, Math.round(windowWidth * 0.68));
  const { profile } = useUserProfile();
  const [selectedCategory, setSelectedCategory] = useState('dogs');

  const locationLabel = profile?.city
    ? `${profile.locality ? `${profile.locality}, ` : ''}${profile.city}`
    : 'Sector 34, Noida';

  const openAdoptTab = () => {
    navigation.getParent()?.navigate('AdoptTab');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE + insets.bottom }}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.navigate('SettingsMenu')}
            accessibilityRole="button"
            accessibilityLabel="Open settings">
            <UserAvatar photoUri={profile?.photoUri} size={44} />
          </Pressable>
          <Pressable
            style={styles.locationBlock}
            onPress={() => navigation.navigate('EditLocation')}>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={14} color={BRAND_PURPLE_DARK} />
              <Text style={styles.locationLabel}>Location</Text>
              <Feather name="chevron-down" size={14} color="#9CA3AF" />
            </View>
            <Text style={styles.locationValue} numberOfLines={1}>
              {locationLabel}
            </Text>
          </Pressable>
          <Pressable style={styles.bellButton} accessibilityLabel="Notifications">
            <Feather name="bell" size={20} color="#111827" />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.heroWrap}>
          <LinearGradient
            colors={['#EDE9FE', '#F5F3FF', '#FAF5FF']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.heroBanner}>
            <FontAwesome
              name="paw"
              size={28}
              color="rgba(167, 139, 250, 0.35)"
              style={styles.heroPawTop}
            />
            <FontAwesome
              name="paw"
              size={22}
              color="rgba(167, 139, 250, 0.25)"
              style={styles.heroPawBottom}
            />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>
                Find Your{'\n'}
                <Text style={styles.heroTitleAccent}>New Best Friend</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Adopt, don&apos;t shop. Give them a loving home today!
              </Text>
              <Pressable style={styles.heroCta} onPress={openAdoptTab}>
                <Text style={styles.heroCtaText}>Explore Pets</Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            <CoverImage source={FEATURED_PETS[0].image} style={styles.heroDog} />
          </LinearGradient>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Feather name="search" size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search pets, breeds, or location..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>
          <Pressable style={styles.filterButton} accessibilityLabel="Filters">
            <Feather name="sliders" size={20} color={BRAND_PURPLE_DARK} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Pressable>
            <Text style={styles.seeAll}>See All ›</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}>
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              active={selectedCategory === cat.id}
              onPress={() => setSelectedCategory(cat.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Pets</Text>
          <Pressable onPress={openAdoptTab}>
            <Text style={styles.seeAll}>See All ›</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={featuredCardWidth + CARD_GAP}
          contentContainerStyle={styles.featuredRow}>
          {FEATURED_PETS.map((item) => (
            <FeaturedPetCard key={item.id} pet={item} width={featuredCardWidth} />
          ))}
        </ScrollView>

        <View style={[styles.sectionHeader, styles.nearbyHeader]}>
          <Text style={styles.sectionTitle}>Nearby Pets</Text>
          <Pressable onPress={openAdoptTab}>
            <Text style={styles.seeAll}>See All ›</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nearbyRow}>
          {NEARBY_PETS.map((item) => (
            <NearbyPetCard key={item.id} pet={item} />
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PADDING,
    marginBottom: 16,
    gap: 12,
  },
  locationBlock: {
    flex: 1,
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  locationValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '600',
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
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroWrap: {
    paddingHorizontal: H_PADDING,
    marginBottom: 20,
  },
  heroBanner: {
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 168,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  heroPawTop: {
    position: 'absolute',
    left: 18,
    top: 14,
    transform: [{ rotate: '-18deg' }],
  },
  heroPawBottom: {
    position: 'absolute',
    left: 52,
    bottom: 18,
    transform: [{ rotate: '12deg' }],
  },
  heroCopy: {
    flex: 1,
    paddingVertical: 20,
    paddingLeft: 18,
    paddingRight: 8,
    maxWidth: '58%',
  },
  heroTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 28,
  },
  heroTitleAccent: {
    color: BRAND_PURPLE_DARK,
    fontWeight: '700',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },
  heroCta: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND_PURPLE_DARK,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  heroCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroDog: {
    position: 'absolute',
    right: -8,
    bottom: 0,
    width: '46%',
    height: '100%',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: H_PADDING,
    gap: 12,
    marginBottom: 22,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: BRAND_PURPLE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: H_PADDING,
    marginBottom: 14,
  },
  nearbyHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_PURPLE_DARK,
  },
  categoriesRow: {
    paddingHorizontal: H_PADDING,
    gap: 18,
    marginBottom: 24,
    paddingBottom: 4,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 8,
  },
  categoryIconCircle: {
    backgroundColor: BRAND_PURPLE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconCircleActive: {
    borderWidth: 3,
    borderColor: BRAND_PURPLE_DARK,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryLabelActive: {
    color: '#111827',
    fontWeight: '600',
  },
  featuredRow: {
    flexDirection: 'row',
    paddingHorizontal: H_PADDING,
    gap: CARD_GAP,
    marginBottom: 8,
  },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  featuredImageWrap: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  featuredImageFill: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  featuredBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  featuredBreed: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaGender: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  metaTrait: {
    fontSize: 12,
    color: '#6B7280',
  },
  nearbyRow: {
    flexDirection: 'row',
    paddingHorizontal: H_PADDING,
    gap: 12,
    paddingBottom: 8,
  },
  nearbyCard: {
    width: NEARBY_CARD_SIZE,
    height: NEARBY_CARD_SIZE,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  nearbyImage: {
    width: '100%',
    height: '100%',
  },
  nearbyHeartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
