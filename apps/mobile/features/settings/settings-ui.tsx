import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

export function SettingsSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function SettingsMenuRow({
  accessibilityLabel,
  onPress,
  subtitle,
  title,
}: {
  accessibilityLabel: string;
  onPress: (event: GestureResponderEvent) => void;
  subtitle?: string;
  title: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons color="#94a3b8" name="chevron-forward" size={20} />
    </Pressable>
  );
}

export function SettingsValueRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.valueRow}>
      <Text style={styles.valueLabel}>{label}</Text>
      <Text style={styles.valueText}>{value}</Text>
    </View>
  );
}

export function SettingsBrandingFooter() {
  return (
    <View style={styles.brandingFooter}>
      <Text style={styles.brandingText}>Designed & Developed by</Text>
      <Text style={styles.brandingText}>Aliasgar Raj • Signal Growth</Text>
      <Text style={styles.copyrightText}>© 2026 Signal Growth</Text>
    </View>
  );
}

export function formatLocationMode(mode: string) {
  if (mode === 'device') {
    return 'Device location';
  }

  if (mode === 'manual') {
    return 'Selected city';
  }

  return 'Approximate mode';
}

export const settingsStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07111f',
  },
  container: {
    gap: 18,
    padding: 20,
    paddingBottom: 34,
  },
  header: {
    gap: 6,
    paddingTop: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: '#c8d5e6',
    fontSize: 15,
    lineHeight: 22,
  },
  bodyText: {
    color: '#c8d5e6',
    fontSize: 16,
    lineHeight: 24,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#f6c46f',
    paddingVertical: 13,
  },
  primaryActionDisabled: {
    opacity: 0.55,
  },
  primaryActionText: {
    color: '#101820',
    fontSize: 15,
    fontWeight: '900',
  },
});

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#f6c46f',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  sectionBody: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(246, 196, 111, 0.34)',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  menuRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuCopy: {
    flex: 1,
    gap: 4,
  },
  menuTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  menuSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  valueRow: {
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
  },
  valueLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  valueText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  brandingFooter: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brandingText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    textAlign: 'center',
  },
  copyrightText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
});
