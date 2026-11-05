import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, gradients, MAX_WIDTH } from '@/theme/tokens';

import { Pressy } from './Pressy';

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap, string]> = {
  index: ['planet', 'planet-outline', 'Home'],
  ranking: ['trophy', 'trophy-outline', 'Rangliste'],
  community: ['chatbubbles', 'chatbubbles-outline', 'Community'],
  profile: ['person-circle', 'person-circle-outline', 'Profil'],
};

function Item({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) {
  const [on, off, label] = ICONS[name] ?? ['ellipse', 'ellipse-outline', name];
  const a = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    a.value = withSpring(focused ? 1 : 0, { damping: 15, stiffness: 220 });
  }, [focused, a]);
  const bubble = useAnimatedStyle(() => ({ opacity: a.value, transform: [{ scale: 0.6 + a.value * 0.4 }] }));
  const icon = useAnimatedStyle(() => ({ transform: [{ translateY: -a.value * 2 }] }));
  return (
    <Pressy
      onPress={onPress}
      style={styles.item}
      scaleTo={0.88}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>
        <Animated.View style={[StyleSheet.absoluteFill, bubble]}>
          <LinearGradient colors={gradients.mango} style={styles.bubble} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        </Animated.View>
        <Animated.View style={icon}>
          <Ionicons name={focused ? on : off} size={22} color={focused ? '#2A1300' : colors.textSoft} />
        </Animated.View>
      </View>
      <Text style={[styles.label, focused && { color: colors.text }]}>{label}</Text>
    </Pressy>
  );
}

/** Floating glass tab bar (reference 2) with a mango active bubble. */
export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {Platform.OS === 'ios' ? <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} /> : null}
        {state.routes.map((route, i) => (
          <Item
            key={route.key}
            name={route.name}
            focused={state.index === i}
            onPress={() => {
              if (state.index !== i) navigateToTab(route.key);
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 16 },
  bar: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    flexDirection: 'row',
    borderRadius: 34,
    paddingVertical: 8,
    paddingHorizontal: 6,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(16,22,52,0.55)' : 'rgba(16,22,52,0.94)',
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  bubble: { flex: 1, borderRadius: 23 },
  label: { fontFamily: font.labelSemi, fontSize: 10.5, color: colors.textMuted },
});
