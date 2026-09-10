import { Linking, Text } from 'react-native';

type ExternalLinkProps = {
  href: string;
  style?: React.ComponentProps<typeof Text>['style'];
  children: React.ReactNode;
};

export function ExternalLink({ href, style, children }: ExternalLinkProps) {
  return (
    <Text
      style={style}
      onPress={() => {
        void Linking.openURL(href);
      }}>
      {children}
    </Text>
  );
}
