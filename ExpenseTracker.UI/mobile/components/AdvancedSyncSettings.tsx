import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { syncService } from '../services/sync';
import { useAuth } from '~/context/AuthContext';
import { useTheme } from '~/theme';

interface AdvancedSyncSettingsProps {
  onClose: () => void;
}

export const AdvancedSyncSettings: React.FC<AdvancedSyncSettingsProps> = ({
  onClose,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  // TODO: Re-enable when implementing sync preferences
  // const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  // const [wifiOnlySync, setWifiOnlySync] = useState(false);

  const handleUploadOnly = async () => {
    if (!user) return;

    Alert.alert(
      'Upload to Cloud',
      'This will upload your local data to the cloud without downloading anything. Your local data will remain unchanged.\n\nContinue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upload Now', onPress: performUpload },
      ]
    );
  };

  const performUpload = async () => {
    setIsLoading(true);
    try {
      const result = await syncService.uploadData();
      if (result.success) {
        Alert.alert(
          'Upload Complete',
          `Your data has been successfully uploaded to the cloud!\n\n✓ ${result.results?.upload.categories.created || 0} categories\n✓ ${result.results?.upload.transactions.created || 0} transactions`
        );
      } else {
        Alert.alert('Upload Failed', result.error || result.message);
      }
    } catch (error) {
      Alert.alert(
        'Upload Failed',
        'Unable to upload data to the cloud. Please check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadOnly = async () => {
    if (!user) return;

    Alert.alert(
      'Download from Cloud',
      'This will replace ALL local data with your cloud data. This action cannot be undone.\n\nMake sure you have uploaded any important local changes first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace Local Data',
          style: 'destructive',
          onPress: performDownload,
        },
      ]
    );
  };

  const performDownload = async () => {
    setIsLoading(true);
    try {
      const result = await syncService.downloadData();
      if (result.success) {
        Alert.alert(
          'Download Complete',
          'Your local data has been updated with the latest information from the cloud.'
        );
      } else {
        Alert.alert('Download Failed', result.error || result.message);
      }
    } catch (error) {
      Alert.alert(
        'Download Error',
        'An unexpected error occurred during download.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCloud = async () => {
    Alert.alert(
      'Clear Cloud Data',
      'This will permanently delete all your data from the cloud. This action cannot be undone. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All Cloud Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete ALL your cloud data. Type "DELETE" to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'I Understand - Delete All',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implement cloud data clearing
                    Alert.alert(
                      'Feature Coming Soon',
                      'Cloud data clearing will be implemented in a future update.'
                    );
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.theme.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.theme.text }]}>
          Advanced Sync
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* TODO: Implement Sync Preferences functionality later
      <View style={[styles.section, { backgroundColor: theme.theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.theme.text }]}>
          Sync Preferences
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: theme.theme.text }]}>
              Automatic Sync
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.theme.textSecondary },
              ]}
            >
              Sync automatically when the app opens
            </Text>
          </View>
          <Switch
            value={autoSyncEnabled}
            onValueChange={setAutoSyncEnabled}
            trackColor={{
              false: theme.theme.border,
              true: theme.theme.primary,
            }}
            thumbColor={theme.theme.background}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: theme.theme.text }]}>
              WiFi Only Sync
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.theme.textSecondary },
              ]}
            >
              Only sync when connected to WiFi
            </Text>
          </View>
          <Switch
            value={wifiOnlySync}
            onValueChange={setWifiOnlySync}
            trackColor={{
              false: theme.theme.border,
              true: theme.theme.primary,
            }}
            thumbColor={theme.theme.background}
          />
        </View>
      </View>
      */}

      {/* Manual Operations */}
      <View style={[styles.section, { backgroundColor: theme.theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.theme.text }]}>
          Manual Operations
        </Text>
        <Text
          style={[
            styles.sectionDescription,
            { color: theme.theme.textSecondary },
          ]}
        >
          Choose how you want to sync your data. Use these carefully as they can
          overwrite your information.
        </Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.uploadButton]}
          onPress={handleUploadOnly}
          disabled={isLoading}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Upload to Cloud</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.downloadButton]}
          onPress={handleDownloadOnly}
          disabled={isLoading}
        >
          <Ionicons name="cloud-download-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Download from Cloud</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Advanced Actions */}
      <View style={[styles.section, { backgroundColor: theme.theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.theme.text }]}>
          Data Management
        </Text>
        <Text
          style={[
            styles.sectionDescription,
            { color: theme.theme.textSecondary },
          ]}
        >
          These operations can permanently delete data. Only use if you
          understand the consequences.
        </Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleClearCloud}
          disabled={isLoading}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Clear Cloud Data</Text>
          <Ionicons name="warning-outline" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Help Text */}
      <View style={styles.helpSection}>
        <Text style={[styles.helpTitle, { color: theme.theme.text }]}>
          🎉 Improved Sync Experience
        </Text>
        <Text style={[styles.helpText, { color: theme.theme.textSecondary }]}>
          • <Text style={{ fontWeight: '600' }}>Clean & Organized:</Text> Your
          data stays neat and organized across all your devices.{'\n\n'}•{' '}
          <Text style={{ fontWeight: '600' }}>Smart Updates:</Text> When
          syncing, existing information gets updated with the latest changes.
          {'\n\n'}• <Text style={{ fontWeight: '600' }}>Always Reliable:</Text>{' '}
          Sync works consistently every time without errors.
          {'\n\n'}
        </Text>

        <Text
          style={[styles.helpTitle, { color: theme.theme.text, marginTop: 16 }]}
        >
          Operation Descriptions
        </Text>
        <Text style={[styles.helpText, { color: theme.theme.textSecondary }]}>
          • <Text style={{ fontWeight: '600' }}>Upload Only:</Text> Sends your
          local data to the cloud without downloading anything. Use when you
          want to backup local changes.{'\n\n'}•{' '}
          <Text style={{ fontWeight: '600' }}>Download Only:</Text> Replaces
          your local data with cloud data. Use when you want to restore from
          cloud backup.{'\n\n'}•{' '}
          <Text style={{ fontWeight: '600' }}>Clear Cloud Data:</Text>{' '}
          Permanently deletes all data from the cloud. Cannot be undone.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  section: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 10,
    marginVertical: 6,
  },
  uploadButton: {
    backgroundColor: '#34C759',
  },
  downloadButton: {
    backgroundColor: '#FF9500',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  helpSection: {
    padding: 16,
    paddingTop: 8,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
