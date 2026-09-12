import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/Themed';
import Feather from '@expo/vector-icons/Feather';

type DatePickerFieldProps = {
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DatePickerField({
  value,
  onChange,
  placeholder = 'Select date',
  maximumDate = new Date(),
  minimumDate = new Date(1990, 0, 1),
  style,
  textStyle,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const webInputRef = useRef<HTMLInputElement | null>(null);
  const selected = parseIsoDate(value) ?? new Date(2018, 0, 1);

  const handleNativeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed') {
      setOpen(false);
      return;
    }
    if (date) onChange(toIsoDate(date));
    if (Platform.OS === 'ios' && event.type === 'set') {
      // Keep open until Done is tapped on iOS sheet
    }
  };

  const openPicker = () => {
    if (Platform.OS === 'web') {
      webInputRef.current?.showPicker?.();
      webInputRef.current?.click();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Pressable style={[styles.field, style]} onPress={openPicker}>
        <Text style={[styles.value, !value && styles.placeholder, textStyle]}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
        <Feather name="calendar" size={18} color="#7C3AED" />
      </Pressable>

      {Platform.OS === 'web' ? (
        // @ts-expect-error web-only input element
        <input
          ref={webInputRef}
          type="date"
          value={value || ''}
          max={toIsoDate(maximumDate)}
          min={toIsoDate(minimumDate)}
          onChange={(e: { target: { value: string } }) => {
            if (e.target.value) onChange(e.target.value);
          }}
          style={{
            position: 'absolute',
            opacity: 0,
            width: 1,
            height: 1,
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={selected}
          mode="date"
          display="calendar"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={handleNativeChange}
        />
      ) : null}

      {Platform.OS === 'ios' && open ? (
        <Modal transparent animationType="slide" visible={open}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.iosSheet}>
            <View style={styles.iosHeader}>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={styles.iosDone}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={selected}
              mode="date"
              display="inline"
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              onChange={handleNativeChange}
              themeVariant="light"
            />
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  iosSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  iosHeader: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  iosDone: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600',
  },
});
