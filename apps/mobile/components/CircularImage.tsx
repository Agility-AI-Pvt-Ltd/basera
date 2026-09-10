import { Image } from 'expo-image';
import { ImageSourcePropType, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type CircularImageProps = {
  source: ImageSourcePropType;
  size: number;
  ringWidth?: number;
  ringColor?: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Square image clipped to a full circle, with optional active ring. */
export function CircularImage({
  source,
  size,
  ringWidth = 3,
  ringColor = '#A78BFA',
  active = false,
  style,
}: CircularImageProps) {
  const innerSize = active ? size - ringWidth * 2 : size;

  return (
    <View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          padding: active ? ringWidth : 0,
          backgroundColor: active ? ringColor : 'transparent',
        },
        style,
      ]}>
      <View
        style={[
          styles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}>
        <Image
          source={source}
          style={styles.image}
          contentFit="cover"
          contentPosition="center"
          transition={0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
