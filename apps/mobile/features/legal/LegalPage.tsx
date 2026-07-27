import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  PRODUCTION_WEBSITE_URL,
  SUPPORT_EMAIL,
  type LegalPageContent,
} from '@/features/legal/legal-content';
import { SettingsSection, settingsStyles } from '@/features/settings/settings-ui';

type LegalPageProps = {
  content: LegalPageContent;
};

async function openExternalLink(url: string) {
  try {
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      throw new Error('URL cannot be opened');
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open link', 'Please try again from your browser or email app.');
  }
}

export function LegalPage({ content }: LegalPageProps) {
  const websiteUrl = `${PRODUCTION_WEBSITE_URL}${content.websitePath}`;
  const mailtoUrl = `mailto:${SUPPORT_EMAIL}`;

  return (
    <SafeAreaView style={settingsStyles.safeArea}>
      <ScrollView contentContainerStyle={settingsStyles.container}>
        <View style={settingsStyles.header}>
          <Text style={settingsStyles.title}>{content.title}</Text>
          <Text style={settingsStyles.subtitle}>{content.subtitle}</Text>
        </View>

        {content.sections.map((section) => (
          <SettingsSection key={section.title} title={section.title}>
            <View style={styles.sectionContent}>
              {section.blocks.map((block, blockIndex) => {
                if (block.type === 'list') {
                  return (
                    <View key={`${section.title}-list-${blockIndex}`} style={styles.list}>
                      {block.items.map((item) => (
                        <View key={item} style={styles.listItem}>
                          <Text style={styles.bullet}>{'\u2022'}</Text>
                          <Text style={settingsStyles.bodyText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  );
                }

                return (
                  <Text key={`${section.title}-paragraph-${blockIndex}`} style={settingsStyles.bodyText}>
                    {block.text}
                  </Text>
                );
              })}
            </View>
          </SettingsSection>
        ))}

        <SettingsSection title="Links">
          <View style={styles.actions}>
            <LinkAction
              accessibilityLabel={`Email Planetary Hours support at ${SUPPORT_EMAIL}`}
              icon="mail-outline"
              label="Email support"
              onPress={() => void openExternalLink(mailtoUrl)}
            />
            <LinkAction
              accessibilityLabel={`Open ${content.title} on planetaryhours.in`}
              icon="open-outline"
              label="Open website version"
              onPress={() => void openExternalLink(websiteUrl)}
            />
          </View>
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

function LinkAction({
  accessibilityLabel,
  icon,
  label,
  onPress,
}: {
  accessibilityLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.linkAction, pressed && styles.pressed]}>
      <Ionicons color="#f6c46f" name={icon} size={20} />
      <Text style={styles.linkActionText}>{label}</Text>
      <Ionicons color="#94a3b8" name="chevron-forward" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionContent: {
    gap: 14,
    padding: 16,
  },
  list: {
    gap: 10,
  },
  listItem: {
    flexDirection: 'row',
    gap: 9,
  },
  bullet: {
    color: '#f6c46f',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 24,
  },
  actions: {
    overflow: 'hidden',
  },
  linkAction: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  linkActionText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
