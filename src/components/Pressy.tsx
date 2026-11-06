import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
};

export function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => null);
}

/** Pressable with a springy scale + optional haptic tick. */
export function Pressy({ children, style, scaleTo = 0.96, haptic = true, onPress, disabled, ...rest }: Props) {
  const s = useSharedValue(1);
  // Layout keys must live on the outer Pressable, or flex children collapse.
  const flat = StyleSheet.flatten(style) ?? {};
  const outer: ViewStyle = {
    flex: flat.flex,
    flexGrow: flat.flexGrow,
    flexBasis: flat.flexBasis,
    flexShrink: flat.flexShrink,
    alignSelf: flat.alignSelf,
    width: flat.width,
    minWidth: flat.minWidth,
    aspectRatio: flat.aspectRatio,
  };
  // the outer Pressable already has the width – the inner view just fills it
  const inner: ViewStyle =
    flat.flex != null || flat.aspectRatio != null
      ? { ...flat, flex: 1, aspectRatio: undefined, width: '100%' }
      : flat.width != null
        ? { ...flat, width: '100%', minWidth: undefined }
        : flat;
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      style={outer}
      accessibilityRole="button"
      {...rest}
      disabled={disabled}
      onPressIn={() => {
        s.set(withSpring(scaleTo, { damping: 18, stiffness: 400 }));
      }}
      onPressOut={() => {
        s.set(withSpring(1, { damping: 12, stiffness: 260 }));
      }}
      onPress={(e) => {
        if (haptic) tap();
        onPress?.(e);
      }}
    >
      <Animated.View style={[inner, anim, disabled ? { opacity: 0.5 } : null]}>{children}</Animated.View>
    </Pressable>
  );
}
