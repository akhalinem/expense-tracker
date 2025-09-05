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
import { SyncScreen as SyncScreenComponent } from '~/components/SyncScreen';

export default function SyncScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  if (!user) {
    return (
      <ThemedView as={SafeAreaView} style={styles.container}>
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
            Please log in to sync your data with optimized background processing
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView as={SafeAreaView} style={styles.container}>
      <SyncScreenComponent
        onSyncComplete={() => {
          // Callback when sync is completed
          console.log('Sync completed successfully!');
        }}
        hideTitle={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
