import { Image } from 'expo-image';
import { ImageSourcePropType, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type CoverImageProps = {
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
};

/** Fills its container with a cover-cropped, centered image. */
export function CoverImage({ source, style, borderRadius = 0 }: CoverImageProps) {
  return (
    <View
      style={[
        styles.wrap,
        borderRadius ? { borderRadius } : null,
        style,
      ]}>
      <Image
        source={source}
        style={styles.image}
        contentFit="cover"
        contentPosition="center"
        transition={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
