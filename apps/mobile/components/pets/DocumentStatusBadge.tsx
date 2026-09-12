import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { DocumentStatus } from '@/types/pet';

const COLORS: Record<DocumentStatus, { bg: string; text: string; label: string }> = {
  verified: { bg: '#D1FAE5', text: '#065F46', label: 'Verified' },
  pending: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  expiring: { bg: '#FFEDD5', text: '#C2410C', label: 'Expiring' },
  expired: { bg: '#FEE2E2', text: '#991B1B', label: 'Expired' },
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const theme = COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: theme.bg }]}>
      <Text style={[styles.text, { color: theme.text }]}>{theme.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
