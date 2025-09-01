import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { syncService, SyncStatus } from '~/services/sync';
import { useAuth } from '~/context/AuthContext';
import ThemedView from '~/components/themed/ThemedView';
import ThemedCard from '~/components/themed/ThemedCard';
import { useTheme } from '~/theme';

export default function SyncScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [localStats, setLocalStats] = useState({
    categoriesCount: 0,
    transactionsCount: 0,
    lastModified: null as string | null,
  });

  useEffect(() => {
    if (user) {
      loadSyncData();
    }
  }, [user]);

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
    if (!user) {
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
          `Data synchronized successfully!\n\n• ${result.results?.upload.categories.created || 0} new categories\n• ${result.results?.upload.transactions.created || 0} new transactions`,
          [{ text: 'OK', onPress: loadSyncData }]
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
    if (!user) {
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
          'Local data uploaded to cloud successfully!',
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
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to download data.');
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
          'Data downloaded from cloud successfully!',
          [{ text: 'OK', onPress: loadSyncData }]
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

  if (!user) {
    return (
      <ThemedView as={SafeAreaView} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Sync</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.notAuthenticatedContainer}>
          <Ionicons
            name="cloud-offline"
            size={48}
            color={theme.textSecondary}
          />
          <Text
            style={[
              styles.notAuthenticatedText,
              { color: theme.textSecondary },
            ]}
          >
            Please log in to sync your data
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView as={SafeAreaView} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Sync</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <ThemedCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Local Data
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Categories
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {localStats.categoriesCount}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Transactions
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {localStats.transactionsCount}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Last Modified
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {formatDate(localStats.lastModified)}
              </Text>
            </View>
          </View>
        </ThemedCard>

        {syncStatus && (
          <ThemedCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Cloud Data
            </Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Categories
                </Text>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {syncStatus.categoriesCount}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Transactions
                </Text>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {syncStatus.transactionsCount}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Last Sync
                </Text>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {formatDate(syncStatus.lastSync)}
                </Text>
              </View>
            </View>
          </ThemedCard>
        )}

        <ThemedCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Sync Options
          </Text>

          <TouchableOpacity
            style={[styles.syncButton, { backgroundColor: theme.primary }]}
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

          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            • Full Sync: Upload local data, then download latest from cloud
            {'\n'}• Upload: Send local data to cloud{'\n'}• Download: Replace
            local data with cloud data
          </Text>
        </ThemedCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notAuthenticatedText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
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
    marginTop: 16,
    lineHeight: 18,
  },
});
