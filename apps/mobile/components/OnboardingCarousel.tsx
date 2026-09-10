import { LinearGradient } from '@/components/LinearGradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import {
  ONBOARDING_SLIDES,
  OnboardingSlide,
} from '@/constants/onboardingSlides';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.52;
const AUTO_ADVANCE_MS = 3500;

type OnboardingCarouselProps = {
  onComplete: () => void;
};

function PaginationDots({
  count,
  activeIndex,
}: {
  count: number;
  activeIndex: number;
}) {
  return (
    <View style={styles.pagination}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === activeIndex ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

function SlideHero({ slide }: { slide: OnboardingSlide }) {
  const { Image: SlideImage } = slide;

  return (
    <View style={styles.heroContainer}>
      <View style={styles.heroImageWrapper}>
        <SlideImage
          width={SCREEN_WIDTH}
          height={HERO_HEIGHT}
          preserveAspectRatio="xMidYMid slice"
        />
      </View>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)', '#FFFFFF']}
        locations={[0, 0.55, 1]}
        style={styles.heroFade}
        pointerEvents="none"
      />
    </View>
  );
}

function SlideContent({ slide }: { slide: OnboardingSlide }) {
  return (
    <View style={styles.content}>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.description}>{slide.description}</Text>
    </View>
  );
}

export default function OnboardingCarousel({
  onComplete,
}: OnboardingCarouselProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateIndex = useCallback((index: number) => {
    const next = ((index % ONBOARDING_SLIDES.length) + ONBOARDING_SLIDES.length) %
      ONBOARDING_SLIDES.length;
    activeIndexRef.current = next;
    setActiveIndex(next);
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      if (index >= 0 && index < ONBOARDING_SLIDES.length) {
        updateIndex(index);
      }
    },
    [updateIndex],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (activeIndexRef.current + 1) % ONBOARDING_SLIDES.length;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      updateIndex(next);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
  }, [updateIndex]);

  const renderSlide = useCallback(({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={styles.slide}>
        <SlideHero slide={item} />
        <SlideContent slide={item} />
      </View>
    );
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onScroll}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <PaginationDots
        count={ONBOARDING_SLIDES.length}
        activeIndex={activeIndex}
      />

      <View style={styles.footer}>
        <Pressable
          onPress={onComplete}
          style={({ pressed }) => [pressed && styles.buttonPressed]}>
          <LinearGradient
            colors={['#7C3AED', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}>
            <Text style={styles.buttonText}>Let&apos;s Get Started</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImageWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '200',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: '#111827',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#D1D5DB',
  },
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '200',
  },
});
