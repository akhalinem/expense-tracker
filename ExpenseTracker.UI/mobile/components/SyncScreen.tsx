import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { syncService, SyncResults } from '../services/sync';
import { useAuth } from '~/context/AuthContext';
import { useTheme } from '~/theme';
import { AdvancedSyncSettings } from './AdvancedSyncSettings';

interface SyncScreenProps {
  onSyncComplete?: () => void;
  hideTitle?: boolean;
}

type SyncState = 'synced' | 'pending' | 'syncing' | 'error' | 'unknown';

interface SyncStatusInfo {
  state: SyncState;
  message: string;
  icon: string;
  color: string;
  lastSyncTime?: string;
  localCount: number;
  cloudCount: number;
}

interface ProgressState {
  isRunning: boolean;
  progress: number;
  status: string;
  message?: string;
}

export const SyncScreen: React.FC<SyncScreenProps> = ({
  onSyncComplete,
  hideTitle = false,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [syncStatusInfo, setSyncStatusInfo] = useState<SyncStatusInfo>({
    state: 'unknown',
    message: 'Checking sync status...',
    icon: 'cloud-outline',
    color: '#999',
    localCount: 0,
    cloudCount: 0,
  });
  const [progressState, setProgressState] = useState<ProgressState>({
    isRunning: false,
    progress: 0,
    status: 'idle',
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {
    if (user) {
      loadSyncStatus();
    }
  }, [user]);

  const loadSyncStatus = async () => {
    try {
      // Load local and cloud data in parallel
      const [localStats, cloudStatusResult] = await Promise.all([
        syncService.getLocalStats(),
        syncService.getSyncStatus(),
      ]);

      const cloudStatus = cloudStatusResult.success
        ? cloudStatusResult.status
        : null;

      // Determine sync state based on data comparison
      const syncInfo = determineSyncState(localStats, cloudStatus);
      setSyncStatusInfo(syncInfo);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error loading sync status:', error);
      setSyncStatusInfo({
        state: 'error',
        message: 'Unable to check sync status',
        icon: 'cloud-offline',
        color: '#FF6B6B',
        localCount: 0,
        cloudCount: 0,
      });
      setIsInitialLoad(false);
    }
  };

  const determineSyncState = (
    localStats: any,
    cloudStatus: any
  ): SyncStatusInfo => {
    console.debug('Local Stats:', localStats);
    console.debug('Cloud Status:', cloudStatus);
    const localCount =
      localStats.categoriesCount + localStats.transactionsCount;
    const cloudCount = cloudStatus
      ? cloudStatus.categoriesCount + cloudStatus.transactionsCount
      : 0;

    // If no cloud status, we need to sync
    if (!cloudStatus) {
      return {
        state: 'pending',
        message: localCount > 0 ? 'Ready to sync to cloud' : 'No data to sync',
        icon: 'cloud-upload-outline',
        color: '#007AFF',
        localCount,
        cloudCount: 0,
      };
    }

    // If counts match and we have recent sync data, we're synced
    if (localCount === cloudCount && cloudStatus.lastSync) {
      const lastSyncDate = new Date(cloudStatus.lastSync);
      const timeDiff = Date.now() - lastSyncDate.getTime();
      const isRecent = timeDiff < 24 * 60 * 60 * 1000; // 24 hours

      return {
        state: 'synced',
        message: isRecent
          ? 'Everything is up to date'
          : 'Synced (may need refresh)',
        icon: 'cloud-done-outline',
        color: '#34C759',
        lastSyncTime: formatRelativeTime(lastSyncDate),
        localCount,
        cloudCount,
      };
    }

    // If counts don't match, we need to sync
    if (localCount !== cloudCount) {
      const hasLocal = localCount > 0;
      const hasCloud = cloudCount > 0;

      if (hasLocal && hasCloud) {
        return {
          state: 'pending',
          message: 'Local and cloud data differ',
          icon: 'sync-outline',
          color: '#FF9500',
          localCount,
          cloudCount,
        };
      } else if (hasLocal && !hasCloud) {
        return {
          state: 'pending',
          message: 'Ready to backup to cloud',
          icon: 'cloud-upload-outline',
          color: '#007AFF',
          localCount,
          cloudCount,
        };
      } else if (!hasLocal && hasCloud) {
        return {
          state: 'pending',
          message: 'Cloud data available to download',
          icon: 'cloud-download-outline',
          color: '#007AFF',
          localCount,
          cloudCount,
        };
      }
    }

    // Default fallback
    return {
      state: 'unknown',
      message: 'Checking sync status...',
      icon: 'cloud-outline',
      color: '#999',
      localCount,
      cloudCount,
    };
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleSync = async () => {
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'Please log in to sync your data.'
      );
      return;
    }

    // Determine sync strategy based on current state
    const strategy = getSyncStrategy();

    setProgressState({
      isRunning: true,
      progress: 0,
      status: 'starting',
      message: strategy.startMessage,
    });

    try {
      const result = await syncService.fullSync((progress, status, message) => {
        setProgressState({
          isRunning: status !== 'completed' && status !== 'failed',
          progress,
          status,
          message: message || getProgressMessage(status, progress),
        });
      });

      if (result.success) {
        setProgressState({
          isRunning: false,
          progress: 100,
          status: 'completed',
          message: 'Sync completed successfully!',
        });

        // Refresh sync status
        await loadSyncStatus();

        // Show success message with details
        const details = getSyncResultDetails(result);
        Alert.alert('Sync Complete', details, [
          {
            text: 'OK',
            onPress: () => {
              setProgressState({
                isRunning: false,
                progress: 0,
                status: 'idle',
              });
              onSyncComplete?.();
            },
          },
        ]);
      } else {
        setProgressState({
          isRunning: false,
          progress: 0,
          status: 'failed',
          message: result.error || 'Sync failed',
        });
        Alert.alert('Sync Failed', result.error || result.message);
      }
    } catch (error) {
      setProgressState({
        isRunning: false,
        progress: 0,
        status: 'failed',
        message: 'An unexpected error occurred',
      });
      Alert.alert('Sync Error', 'An unexpected error occurred during sync.');
      console.error('Sync error:', error);
    }
  };

  const getSyncStrategy = () => {
    switch (syncStatusInfo.state) {
      case 'pending':
        if (syncStatusInfo.localCount > syncStatusInfo.cloudCount) {
          return { startMessage: 'Backing up your data...' };
        } else if (syncStatusInfo.cloudCount > syncStatusInfo.localCount) {
          return { startMessage: 'Downloading your data...' };
        } else {
          return { startMessage: 'Synchronizing changes...' };
        }
      case 'synced':
        return { startMessage: 'Checking for updates...' };
      default:
        return { startMessage: 'Starting sync...' };
    }
  };

  const getProgressMessage = (status: string, progress: number): string => {
    switch (status) {
      case 'uploading':
        return `Uploading changes... ${Math.round(progress)}%`;
      case 'downloading':
        return `Downloading updates... ${Math.round(progress)}%`;
      case 'processing':
        return `Processing data... ${Math.round(progress)}%`;
      case 'completed':
        return 'Sync completed!';
      case 'failed':
        return 'Sync failed';
      default:
        return `Syncing... ${Math.round(progress)}%`;
    }
  };

  const getSyncResultDetails = (result: SyncResults): string => {
    if (!result.results) return 'Your data has been synchronized.';

    const upload = result.results.upload;
    const download = result.results.download;

    let details = 'Your data has been synchronized.\n\n';

    if (upload?.categories?.created || upload?.transactions?.created) {
      details += 'Uploaded:\n';
      if (upload.categories?.created) {
        details += `• ${upload.categories.created} new categories\n`;
      }
      if (upload.transactions?.created) {
        details += `• ${upload.transactions.created} new transactions\n`;
      }
      details += '\n';
    }

    if (download?.categories?.length || download?.transactions?.length) {
      details += 'Downloaded:\n';
      if (download.categories?.length) {
        details += `• ${download.categories.length} categories\n`;
      }
      if (download.transactions?.length) {
        details += `• ${download.transactions.length} transactions\n`;
      }
    }

    return details.trim();
  };

  const getSyncButtonText = (): string => {
    if (progressState.isRunning) return '';

    switch (syncStatusInfo.state) {
      case 'synced':
        return 'Check for Updates';
      case 'pending':
        return 'Sync Now';
      case 'error':
        return 'Retry Sync';
      default:
        return 'Sync';
    }
  };

  const getSyncButtonColor = (): string => {
    switch (syncStatusInfo.state) {
      case 'synced':
        return '#34C759';
      case 'pending':
        return '#007AFF';
      case 'error':
        return '#FF6B6B';
      default:
        return '#007AFF';
    }
  };

  if (!user) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.theme.background }]}
      >
        <View style={styles.notAuthenticatedContainer}>
          <Ionicons
            name="cloud-offline"
            size={48}
            color={theme.theme.textSecondary}
          />
          <Text
            style={[
              styles.notAuthenticatedText,
              { color: theme.theme.textSecondary },
            ]}
          >
            Please log in to sync your data across devices
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.theme.background }]}
    >
      {!hideTitle && (
        <Text style={[styles.title, { color: theme.theme.text }]}>Sync</Text>
      )}

      {/* Main Status Card */}
      <View
        style={[styles.statusCard, { backgroundColor: theme.theme.surface }]}
      >
        <View style={styles.statusHeader}>
          <View style={styles.statusIcon}>
            <Ionicons
              name={syncStatusInfo.icon as any}
              size={32}
              color={syncStatusInfo.color}
            />
          </View>
          <View style={styles.statusContent}>
            <Text style={[styles.statusMessage, { color: theme.theme.text }]}>
              {syncStatusInfo.message}
            </Text>
            {syncStatusInfo.lastSyncTime && (
              <Text
                style={[
                  styles.lastSyncText,
                  { color: theme.theme.textSecondary },
                ]}
              >
                Last synced {syncStatusInfo.lastSyncTime}
              </Text>
            )}
          </View>
        </View>

        {/* Data Count Summary */}
        {!isInitialLoad && (
          <View style={styles.dataSummary}>
            <View style={styles.dataItem}>
              <Text style={[styles.dataCount, { color: theme.theme.text }]}>
                {syncStatusInfo.localCount}
              </Text>
              <Text
                style={[styles.dataLabel, { color: theme.theme.textSecondary }]}
              >
                Local Items
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={[styles.dataCount, { color: theme.theme.text }]}>
                {syncStatusInfo.cloudCount}
              </Text>
              <Text
                style={[styles.dataLabel, { color: theme.theme.textSecondary }]}
              >
                Cloud Items
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Progress Section */}
      {progressState.isRunning && (
        <View
          style={[
            styles.progressCard,
            { backgroundColor: theme.theme.surface },
          ]}
        >
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: theme.theme.text }]}>
              Syncing...
            </Text>
            <Text
              style={[
                styles.progressPercent,
                { color: theme.theme.textSecondary },
              ]}
            >
              {Math.round(progressState.progress)}%
            </Text>
          </View>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: theme.theme.border },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressState.progress}%`,
                  backgroundColor: theme.theme.primary,
                },
              ]}
            />
          </View>
          {progressState.message && (
            <Text
              style={[
                styles.progressMessage,
                { color: theme.theme.textSecondary },
              ]}
            >
              {progressState.message}
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.syncButton,
          { backgroundColor: getSyncButtonColor() },
          progressState.isRunning && styles.syncButtonDisabled,
        ]}
        onPress={handleSync}
        disabled={progressState.isRunning}
      >
        {progressState.isRunning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons
              name={syncStatusInfo.state === 'synced' ? 'refresh' : 'sync'}
              size={20}
              color="#fff"
            />
            <Text style={styles.syncButtonText}>{getSyncButtonText()}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Help Text */}
      <Text style={[styles.helpText, { color: theme.theme.textSecondary }]}>
        {syncStatusInfo.state === 'synced'
          ? 'Your data is synchronized across all devices. Tap to check for new updates.'
          : 'Tap to synchronize your expense data across all your devices securely.'}
      </Text>

      {/* Advanced Settings Button */}
      <TouchableOpacity
        style={styles.advancedButton}
        onPress={() => setShowAdvancedSettings(true)}
      >
        <Ionicons
          name="settings-outline"
          size={16}
          color={theme.theme.textSecondary}
        />
        <Text
          style={[
            styles.advancedButtonText,
            { color: theme.theme.textSecondary },
          ]}
        >
          Advanced Options
        </Text>
      </TouchableOpacity>

      {/* Advanced Settings Modal */}
      <Modal
        visible={showAdvancedSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <AdvancedSyncSettings onClose={() => setShowAdvancedSettings(false)} />
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notAuthenticatedText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusMessage: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastSyncText: {
    fontSize: 14,
  },
  dataSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  dataItem: {
    alignItems: 'center',
  },
  dataCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dataLabel: {
    fontSize: 13,
  },
  progressCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressMessage: {
    fontSize: 13,
    textAlign: 'center',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  advancedButtonText: {
    fontSize: 14,
    marginLeft: 6,
  },
});
