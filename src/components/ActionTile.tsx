import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { font, radius, tileColors } from '@/theme/tokens';

import { Pressy } from './Pressy';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  tone: keyof typeof tileColors;
  onPress?: () => void;
};

/** Chunky colorful tile (reference 1 quick actions) with a hard offset shadow. */
export function ActionTile({ icon, label, value, tone, onPress }: Props) {
  const c = tileColors[tone];
  return (
    <Pressy onPress={onPress} style={styles.wrap} scaleTo={0.93} accessibilityLabel={value ? `${label} ${value}` : label}>
      <View style={[styles.shadow]} />
      <View style={[styles.tile, { backgroundColor: c.bg }]}>
        <Ionicons name={icon} size={22} color={c.ink} />
        <View>
          {value ? (
            <Text numberOfLines={1} style={[styles.value, { color: c.ink }]}>
              {value}
            </Text>
          ) : null}
          <Text numberOfLines={1} style={[styles.label, { color: c.ink }]}>
            {label}
          </Text>
        </View>
      </View>
    </Pressy>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, aspectRatio: 0.92, minWidth: 70 },
  shadow: {
    position: 'absolute',
    left: 4,
    top: 5,
    right: -2,
    bottom: -4,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  tile: {
    flex: 1,
    borderRadius: radius.md,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.55)',
  },
  value: { fontFamily: font.displayBold, fontSize: 17, lineHeight: 20 },
  label: { fontFamily: font.label, fontSize: 11.5, lineHeight: 14 },
});
