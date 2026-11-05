import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, MAX_WIDTH, TAB_BAR_SPACE } from '@/theme/tokens';

import { Backdrop } from './Backdrop';

type Props = {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** reserve space for floating tab bar */
  tabs?: boolean;
  scroll?: boolean;
};

export function Screen({ children, refreshing = false, onRefresh, tabs = true, scroll = true }: Props) {
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + 12, paddingBottom: (tabs ? TAB_BAR_SPACE : 24) + insets.bottom };
  return (
    <View style={styles.root}>
      <Backdrop />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, pad]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.cyan}
                colors={[colors.cyan, colors.magenta]}
                progressBackgroundColor={colors.bgRaised}
              />
            ) : undefined
          }
        >
          <View style={styles.inner}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.content, pad, { flex: 1 }]}>
          <View style={[styles.inner, { flex: 1 }]}>{children}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, alignItems: 'center' },
  inner: { width: '100%', maxWidth: MAX_WIDTH, gap: 18 },
});
