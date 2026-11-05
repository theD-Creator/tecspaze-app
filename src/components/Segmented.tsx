import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { colors, font, radius } from '@/theme/tokens';

import { Pressy } from './Pressy';

type Option<T extends string> = { value: T; label: string };

/** Pill segmented control with a sliding indicator (ref 3 time filters). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const [w, setW] = useState(0);
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const seg = w / options.length;
  const indicator = useAnimatedStyle(() => ({
    width: seg - 6,
    transform: [{ translateX: withSpring(idx * seg + 3, { damping: 18, stiffness: 220 }) }],
  }));
  return (
    <View style={styles.wrap} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} accessibilityRole="tablist">
      {w > 0 ? <Animated.View style={[styles.indicator, indicator]} /> : null}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressy
            key={o.value}
            onPress={() => onChange(o.value)}
            style={styles.item}
            scaleTo={0.94}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
          >
            <Text style={[styles.text, active && styles.textActive]}>{o.label}</Text>
          </Pressy>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    height: 44,
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 0,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  item: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: font.labelSemi, color: colors.textMuted, fontSize: 13.5 },
  textActive: { color: colors.text, fontFamily: font.label },
});
