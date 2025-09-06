import { FC, PropsWithChildren, useState } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearDb, exportData, importData } from '~/services/data-transfer';
import { useAuth } from '~/context/AuthContext';
import { useTheme } from '~/theme';
import ThemedCard from '~/components/themed/ThemedCard';
import ThemedView from '~/components/themed/ThemedView';
import { QuickSyncButton } from './QuickSyncButton';
import { AdvancedSyncSettings } from './AdvancedSyncSettings';
// TODO: Implement UserPreferences functionality later
// import { UserPreferences } from './UserPreferences';
import { Ionicons } from '@expo/vector-icons';

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
  const [showAdvancedSync, setShowAdvancedSync] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const handleImport = async () => {
    const result = await importData();
    if (result) {
      let message = `Import completed successfully:\n\n`;
      message += `✓ ${result.categories.added} categories imported\n`;
      message += `✓ ${result.expenses.added} expenses imported\n`;
      message += `✓ ${result.incomes.added} income entries imported\n`;

      if (
        result.categories.errors.length ||
        result.expenses.errors.length ||
        result.incomes.errors.length
      ) {
        message += `\n⚠️ Some items could not be imported due to formatting issues.`;
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
      Alert.alert(
        'Export Complete',
        'Your data has been saved to your device successfully.'
      );
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export data. Please try again.');
    }
  };

  const handleClear = async () => {
    Alert.alert(
      'Clear All Local Data',
      'This will permanently delete all data stored on this device. This action cannot be undone.\n\nYour cloud data (if any) will remain safe.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          onPress: async () => {
            await clearDbMutation.mutateAsync();
            queryClient.invalidateQueries();
          },
        },
      ]
    );
  };

  const handlePressCategories = () => props.onPress?.('categories');

  const handleDataOperation = (operation: 'import' | 'export' | 'clear') => {
    switch (operation) {
      case 'import':
        return handleImport();
      case 'export':
        return handleExport();
      case 'clear':
        return handleClear();
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Section */}
      {user && (
        <>
          <View style={styles.profileSection}>
            <View
              style={[styles.profileAvatar, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="person" size={32} color="#fff" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]}>
                {user.email?.split('@')[0] || 'User'}
              </Text>
              <Text
                style={[styles.profileEmail, { color: theme.textSecondary }]}
              >
                {user.email}
              </Text>
              <View
                style={[styles.statusBadge, { backgroundColor: theme.success }]}
              >
                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                <Text style={styles.statusText}>Signed In</Text>
              </View>
            </View>
          </View>
          <View style={styles.sectionSpacer} />
        </>
      )}

      {/* Cloud Sync Section */}
      <SectionHeader title="Cloud Sync" />
      <SettingsSection>
        {!user ? (
          <>
            <SettingsRow
              icon="log-in-outline"
              iconColor={theme.primary}
              title="Sign In"
              subtitle="Access your data from any device"
              onPress={() => props.onNavigate?.('auth/login')}
              showChevron
            />
            <Divider />
            <SettingsRow
              icon="person-add-outline"
              iconColor={theme.primary}
              title="Create Account"
              subtitle="Join to sync across devices"
              onPress={() => props.onNavigate?.('auth/register')}
              showChevron
            />
          </>
        ) : (
          <>
            <View style={styles.syncContainer}>
              <QuickSyncButton onPress={() => props.onNavigate?.('/sync')} />
            </View>
            <Divider />
            <SettingsRow
              icon="settings-outline"
              iconColor={theme.textSecondary}
              title="Advanced Sync"
              subtitle="Manual operations and sync preferences"
              onPress={() => setShowAdvancedSync(true)}
              showChevron
            />
            <Divider />
            <SettingsRow
              icon="log-out-outline"
              iconColor={theme.error}
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

      {/* Data Management Section */}
      <SectionHeader title="Data Management" />
      <SettingsSection>
        <SettingsRow
          icon="download-outline"
          iconColor="#34C759"
          title="Import Data"
          subtitle="Import expenses from Excel or CSV"
          onPress={() => handleDataOperation('import')}
        />
        <Divider />
        <SettingsRow
          icon="share-outline"
          iconColor="#007AFF"
          title="Export Data"
          subtitle="Download expenses as Excel file"
          onPress={() => handleDataOperation('export')}
        />
        <Divider />
        <SettingsRow
          icon="trash-outline"
          iconColor={theme.error}
          title="Clear Local Data"
          subtitle="Remove all data from this device"
          titleColor={theme.error}
          onPress={() => handleDataOperation('clear')}
        />
      </SettingsSection>

      {/* App Configuration */}
      <SectionHeader title="App" />
      <SettingsSection>
        <SettingsRow
          icon="pricetag-outline"
          iconColor="#FF9500"
          title="Categories"
          subtitle="Organize your expenses and income"
          onPress={handlePressCategories}
          showChevron
        />
        {/* TODO: Implement preferences functionality later
        <Divider />
        <SettingsRow
          icon="settings-outline"
          iconColor="#8E8E93"
          title="Preferences"
          subtitle="Customize notifications and behavior"
          onPress={() => setShowPreferences(true)}
          showChevron
        />
        */}
      </SettingsSection>

      {/* TODO: Implement About section functionality later
      <SectionHeader title="About" />
      <SettingsSection>
        <SettingsRow
          icon="information-circle-outline"
          iconColor={theme.textSecondary}
          title="Version"
          subtitle="1.0.0 (Build 1)"
        />
        <Divider />
        <SettingsRow
          icon="help-circle-outline"
          iconColor={theme.textSecondary}
          title="Help & Support"
          subtitle="FAQ, tutorials, and contact support"
          showChevron
        />
        <Divider />
        <SettingsRow
          icon="heart-outline"
          iconColor="#FF3B30"
          title="Rate This App"
          subtitle="Share your feedback on the App Store"
          showChevron
        />
      </SettingsSection>
      */}

      {/* Advanced Sync Settings Modal */}
      <Modal
        visible={showAdvancedSync}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <AdvancedSyncSettings onClose={() => setShowAdvancedSync(false)} />
      </Modal>

      {/* TODO: Implement UserPreferences modal later
      <Modal
        visible={showPreferences}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <UserPreferences onClose={() => setShowPreferences(false)} />
      </Modal>
      */}

      <View style={styles.bottomSpacer} />
    </ScrollView>
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
  iconColor?: string;
  title: string;
  subtitle?: string;
  titleColor?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
};

const SettingsRow: FC<SettingsRowProps> = ({
  icon,
  iconColor,
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
          <Ionicons
            name={icon as any}
            size={20}
            color={iconColor || theme.textSecondary}
          />
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
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.textSecondary}
        />
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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  sectionSpacer: {
    height: 16,
  },
  syncContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bottomSpacer: {
    height: 32,
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
});
