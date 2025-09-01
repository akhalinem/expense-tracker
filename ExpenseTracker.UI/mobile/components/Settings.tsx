import { FC, PropsWithChildren } from 'react';
import { StyleSheet, View, Alert, Text, TouchableOpacity } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearDb, exportData, importData } from '~/services/data-transfer';
import { useAuth } from '~/context/AuthContext';
import { useTheme } from '~/theme';
import ThemedCard from '~/components/themed/ThemedCard';
import ThemedView from '~/components/themed/ThemedView';

export type SettingsSection = 'categories';

export type SettingsProps = {
  onPress?(section: SettingsSection): void;
  onNavigate?(screen: string): void;
};

export default function Settings(props: SettingsProps) {
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const clearDbMutation = useMutation({ mutationFn: clearDb });

  const handleImport = async () => {
    const result = await importData();
    if (result) {
      let message = `Import completed:\n`;
      message += `- ${result.categories.added} categories added\n`;
      message += `- ${result.expenses.added} expenses added\n`;
      message += `- ${result.incomes.added} incomes added\n`;

      if (
        result.categories.errors.length ||
        result.expenses.errors.length ||
        result.incomes.errors.length
      ) {
        message += `\nThere were some errors during import.`;
      }

      await queryClient.invalidateQueries();

      Alert.alert('Import Successful', message, [
        {
          text: 'OK',
          onPress: () => {
            queryClient.invalidateQueries();
          },
        },
      ]);
    }
  };

  const handleExport = async () => {
    try {
      await exportData();
      Alert.alert('Export Successful', 'Data has been exported successfully.');
    } catch (error) {
      Alert.alert('Export Failed', 'An error occurred while exporting data.');
    }
  };

  const handleClear = async () => {
    Alert.alert(
      'Clear Database',
      'Are you sure you want to clear the database? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            await clearDbMutation.mutateAsync();
            queryClient.invalidateQueries();
          },
        },
      ]
    );
  };

  const handlePressCategories = () => props.onPress?.('categories');

  return (
    <ThemedView style={styles.container}>
      <SectionHeader title="Cloud Sync" />
      <SettingsSection>
        {!user ? (
          <>
            <SettingsRow
              icon="☁️"
              title="Sign In"
              subtitle="Keep your data synced across devices"
              onPress={() => props.onNavigate?.('auth/login')}
              showChevron
            />
            <Divider />
            <SettingsRow
              icon="👤"
              title="Create Account"
              subtitle="New to the app?"
              onPress={() => props.onNavigate?.('auth/register')}
              showChevron
            />
          </>
        ) : (
          <>
            <SettingsRow
              icon="👤"
              title={user.email}
              subtitle="Signed in and syncing"
              rightElement={
                <View style={styles.syncIndicator}>
                  <Text
                    style={[
                      styles.syncText,
                      { color: theme.success || theme.primary },
                    ]}
                  >
                    ●
                  </Text>
                </View>
              }
            />
            <Divider />
            <SettingsRow
              icon="📤"
              title="Sync Now"
              subtitle="Manage cloud synchronization"
              onPress={() => props.onNavigate?.('/sync')}
            />
            <Divider />
            <SettingsRow
              icon="🚪"
              title="Sign Out"
              titleColor={theme.error}
              onPress={() => {
                Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: user ? () => logout() : undefined,
                  },
                ]);
              }}
            />
          </>
        )}
      </SettingsSection>

      <SectionHeader title="Data Management" />
      <SettingsSection>
        <SettingsRow
          icon="📥"
          title="Import Data"
          subtitle="Import from JSON file"
          onPress={handleImport}
          showChevron
        />
        <Divider />
        <SettingsRow
          icon="📤"
          title="Export Data"
          subtitle="Save to JSON file"
          onPress={handleExport}
          showChevron
        />
        <Divider />
        <SettingsRow
          icon="🗑️"
          title="Clear Database"
          subtitle="Delete all local data"
          titleColor={theme.error}
          onPress={handleClear}
          showChevron
        />
      </SettingsSection>
      <SectionHeader title="Categories" />
      <SettingsSection>
        <SettingsRow
          icon="🏷️"
          title="Manage Categories"
          subtitle="Add, edit, or delete categories"
          onPress={handlePressCategories}
          showChevron
        />
      </SettingsSection>
    </ThemedView>
  );
}

const SectionHeader: FC<{ title: string }> = ({ title }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color: theme.textSecondary }]}>
        {title}
      </Text>
    </View>
  );
};

const SettingsSection: FC<PropsWithChildren> = ({ children }) => {
  return <ThemedCard style={styles.settingsSection}>{children}</ThemedCard>;
};

const Divider = () => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.border,
        marginHorizontal: 16,
      }}
    />
  );
};

// iOS-style Settings Row Component
type SettingsRowProps = {
  icon?: string;
  title: string;
  subtitle?: string;
  titleColor?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
};

const SettingsRow: FC<SettingsRowProps> = ({
  icon,
  title,
  subtitle,
  titleColor,
  onPress,
  rightElement,
  showChevron = false,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {icon && (
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.rowTitle, { color: titleColor || theme.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      {showChevron && (
        <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsSection: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  rightElement: {
    marginLeft: 8,
  },
  chevron: {
    fontSize: 18,
    fontWeight: '300',
    marginLeft: 8,
  },
  syncIndicator: {
    alignItems: 'center',
  },
  syncText: {
    fontSize: 12,
  },
});
