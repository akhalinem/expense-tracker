import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { syncService, SyncResults, SyncStatus } from '../services/sync';
import { useAuth } from '../hooks/useAuth';

interface SyncComponentProps {
  onSyncComplete?: () => void;
}

export const SyncComponent: React.FC<SyncComponentProps> = ({
  onSyncComplete,
}) => {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [localStats, setLocalStats] = useState({
    categoriesCount: 0,
    transactionsCount: 0,
    lastModified: null as string | null,
  });

  React.useEffect(() => {
    if (isAuthenticated) {
      loadSyncData();
    }
  }, [isAuthenticated]);

  const loadSyncData = async () => {
    try {
      // Load local stats
      const stats = await syncService.getLocalStats();
      setLocalStats(stats);

      // Load sync status from server
      const statusResult = await syncService.getSyncStatus();
      if (statusResult.success && statusResult.status) {
        setSyncStatus(statusResult.status);
      }
    } catch (error) {
      console.error('Error loading sync data:', error);
    }
  };

  const handleFullSync = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to sync your data.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await syncService.fullSync();

      if (result.success) {
        Alert.alert(
          'Sync Successful',
          `Data synchronized successfully!\n\nUploaded:\n• ${result.results?.upload.categories.created || 0} categories created\n• ${result.results?.upload.transactions.created || 0} transactions created`,
          [
            {
              text: 'OK',
              onPress: () => {
                loadSyncData();
                onSyncComplete?.();
              },
            },
          ]
        );
      } else {
        Alert.alert('Sync Failed', result.error || result.message);
      }
    } catch (error) {
      Alert.alert('Sync Error', 'An unexpected error occurred during sync.');
      console.error('Sync error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadOnly = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to upload your data.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await syncService.uploadData();

      if (result.success) {
        Alert.alert(
          'Upload Successful',
          `Local data uploaded to cloud!\n\n• ${result.results?.categories.created || 0} categories created\n• ${result.results?.transactions.created || 0} transactions created`,
          [{ text: 'OK', onPress: loadSyncData }]
        );
      } else {
        Alert.alert('Upload Failed', result.error || result.message);
      }
    } catch (error) {
      Alert.alert(
        'Upload Error',
        'An unexpected error occurred during upload.'
      );
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadOnly = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to download your data.'
      );
      return;
    }

    Alert.alert(
      'Download Data',
      'This will replace your local data with data from the cloud. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', style: 'destructive', onPress: performDownload },
      ]
    );
  };

  const performDownload = async () => {
    setIsLoading(true);
    try {
      const result = await syncService.downloadData();

      if (result.success) {
        Alert.alert(
          'Download Successful',
          'Data downloaded from cloud and updated locally!',
          [
            {
              text: 'OK',
              onPress: () => {
                loadSyncData();
                onSyncComplete?.();
              },
            },
          ]
        );
      } else {
        Alert.alert('Download Failed', result.error || result.message);
      }
    } catch (error) {
      Alert.alert(
        'Download Error',
        'An unexpected error occurred during download.'
      );
      console.error('Download error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.notAuthenticatedContainer}>
          <Ionicons name="cloud-offline" size={48} color="#999" />
          <Text style={styles.notAuthenticatedText}>
            Please log in to sync your data
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Local Data</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Categories</Text>
            <Text style={styles.statValue}>{localStats.categoriesCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={styles.statValue}>{localStats.transactionsCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Last Modified</Text>
            <Text style={styles.statValue}>
              {formatDate(localStats.lastModified)}
            </Text>
          </View>
        </View>
      </View>

      {syncStatus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cloud Data</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Categories</Text>
              <Text style={styles.statValue}>{syncStatus.categoriesCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Transactions</Text>
              <Text style={styles.statValue}>
                {syncStatus.transactionsCount}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Last Sync</Text>
              <Text style={styles.statValue}>
                {formatDate(syncStatus.lastSync)}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Options</Text>

        <TouchableOpacity
          style={[styles.syncButton, styles.fullSyncButton]}
          onPress={handleFullSync}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="sync" size={20} color="#fff" />
              <Text style={styles.syncButtonText}>Full Sync</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.syncButton, styles.uploadButton]}
            onPress={handleUploadOnly}
            disabled={isLoading}
          >
            <Ionicons name="cloud-upload" size={18} color="#fff" />
            <Text style={styles.syncButtonText}>Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.syncButton, styles.downloadButton]}
            onPress={handleDownloadOnly}
            disabled={isLoading}
          >
            <Ionicons name="cloud-download" size={18} color="#fff" />
            <Text style={styles.syncButtonText}>Download</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.helpText}>
          • Full Sync: Upload local data, then download latest from cloud{'\n'}•
          Upload: Send local data to cloud{'\n'}• Download: Replace local data
          with cloud data
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notAuthenticatedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  fullSyncButton: {
    backgroundColor: '#007AFF',
  },
  uploadButton: {
    backgroundColor: '#34C759',
    flex: 1,
    marginRight: 8,
  },
  downloadButton: {
    backgroundColor: '#FF9500',
    flex: 1,
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 16,
    lineHeight: 18,
  },
});
