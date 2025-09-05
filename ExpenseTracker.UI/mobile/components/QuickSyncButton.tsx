import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { syncService } from '../services/sync';
import { useAuth } from '~/context/AuthContext';
import { useTheme } from '~/theme';

interface QuickSyncButtonProps {
  onPress?: () => void;
  compact?: boolean;
}

type SyncState = 'synced' | 'pending' | 'syncing' | 'error' | 'unknown';

interface SyncStatus {
  state: SyncState;
  icon: string;
  color: string;
  message: string;
}

export const QuickSyncButton: React.FC<QuickSyncButtonProps> = ({
  onPress,
  compact = false,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: 'unknown',
    icon: 'cloud-outline',
    color: '#999',
    message: 'Checking...',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkSyncStatus();
    }
  }, [user]);

  const checkSyncStatus = async () => {
    try {
      const [localStats, cloudStatusResult] = await Promise.all([
        syncService.getLocalStats(),
        syncService.getSyncStatus(),
      ]);

      const cloudStatus = cloudStatusResult.success
        ? cloudStatusResult.status
        : null;
      const status = determineSyncStatus(localStats, cloudStatus);
      setSyncStatus(status);
    } catch (error) {
      setSyncStatus({
        state: 'error',
        icon: 'cloud-offline',
        color: '#FF6B6B',
        message: 'Sync error',
      });
    }
  };

  const determineSyncStatus = (
    localStats: any,
    cloudStatus: any
  ): SyncStatus => {
    const localCount =
      localStats.categoriesCount + localStats.transactionsCount;
    const cloudCount = cloudStatus
      ? cloudStatus.categoriesCount + cloudStatus.transactionsCount
      : 0;

    if (!cloudStatus) {
      return {
        state: 'pending',
        icon: 'cloud-upload-outline',
        color: '#007AFF',
        message: localCount > 0 ? 'Ready to sync' : 'No data',
      };
    }

    if (localCount === cloudCount && cloudStatus.lastSync) {
      const lastSyncDate = new Date(cloudStatus.lastSync);
      const timeDiff = Date.now() - lastSyncDate.getTime();
      const isRecent = timeDiff < 24 * 60 * 60 * 1000;

      return {
        state: 'synced',
        icon: 'cloud-done-outline',
        color: '#34C759',
        message: isRecent ? 'Synced' : 'Check updates',
      };
    }

    return {
      state: 'pending',
      icon: 'sync-outline',
      color: '#FF9500',
      message: 'Needs sync',
    };
  };

  const handleQuickSync = async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      const result = await syncService.fullSync();
      if (result.success) {
        await checkSyncStatus();
      }
    } catch (error) {
      console.error('Quick sync error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      handleQuickSync();
    }
  };

  if (!user) {
    return null;
  }

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactButton, { backgroundColor: theme.theme.surface }]}
        onPress={handlePress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.theme.primary} />
        ) : (
          <Ionicons
            name={syncStatus.icon as any}
            size={20}
            color={syncStatus.color}
          />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.quickButton,
        {
          backgroundColor: theme.theme.surface,
          borderColor: theme.theme.border,
        },
      ]}
      onPress={handlePress}
      disabled={isLoading}
    >
      <View style={styles.statusRow}>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.theme.primary} />
        ) : (
          <Ionicons
            name={syncStatus.icon as any}
            size={20}
            color={syncStatus.color}
          />
        )}
        <Text style={[styles.statusText, { color: theme.theme.text }]}>
          {syncStatus.message}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.theme.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  quickButton: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  compactButton: {
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  },
});
