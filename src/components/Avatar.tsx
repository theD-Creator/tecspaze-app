import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { initials } from '@/lib/format';
import { colors, font } from '@/theme/tokens';

const PALETTES: [string, string][] = [
  ['#C83278', '#6F71A0'],
  ['#00BED2', '#6F71A0'],
  ['#F0962D', '#C83278'],
  ['#9C8CFF', '#00BED2'],
  ['#3DDC97', '#00BED2'],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

type Props = { name: string | null; photo?: string | null; size?: number; ring?: readonly string[]; id?: string };

/** Photo avatar or gradient initials; optional gradient ring. */
export function Avatar({ name, photo, size = 44, ring, id }: Props) {
  const pal = PALETTES[hash(id ?? name ?? '?') % PALETTES.length];
  const inner = ring ? size - 6 : size;
  const content =
    photo && /^https?:\/\//.test(photo) ? (
      <Image
        source={{ uri: photo }}
        style={{ width: inner, height: inner, borderRadius: inner / 2 }}
        contentFit="cover"
        transition={200}
      />
    ) : (
      <LinearGradient
        colors={pal}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.center, { width: inner, height: inner, borderRadius: inner / 2 }]}
      >
        <Text style={{ fontFamily: font.display, color: colors.text, fontSize: inner * 0.38 }}>{initials(name)}</Text>
      </LinearGradient>
    );
  if (!ring) return <View accessibilityLabel={name ?? 'Avatar'}>{content}</View>;
  return (
    <LinearGradient
      colors={ring as unknown as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.center, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <View style={[styles.center, { width: size - 3, height: size - 3, borderRadius: size, backgroundColor: colors.bg }]}>
        {content}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } });
