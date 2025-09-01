import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { debugUtils } from '../utils/auth';
import ThemedView from './themed/ThemedView';
import { AuthButton, AuthLink } from './AuthInputs';
import { AuthErrorBoundary } from './AuthErrorBoundary';

export const AuthManagement: React.FC = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              debugUtils.logAuthEvent('User logout initiated');

              await logout();

              debugUtils.logAuthEvent('User logout completed');
            } catch (error) {
              debugUtils.logAuthEvent('Logout error', { error });

              Alert.alert(
                'Logout Error',
                'There was an issue signing out. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [logout]);

  const handleClearStoredData = useCallback(async () => {
    if (__DEV__) {
      Alert.alert(
        'Clear Stored Data',
        'This will clear all stored authentication data. This action is only available in development mode.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Clear Data',
            style: 'destructive',
            onPress: async () => {
              try {
                await debugUtils.clearAllAuthData();
                Alert.alert(
                  'Success',
                  'All stored authentication data has been cleared.'
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to clear stored data.');
              }
            },
          },
        ]
      );
    }
  }, []);

  const handleExportData = useCallback(async () => {
    if (__DEV__) {
      try {
        const data = await debugUtils.getAllAuthData();
        console.log('Stored Auth Data:', data);
        Alert.alert(
          'Data Exported',
          'Authentication data has been logged to console. Check your development console.'
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to export data.');
      }
    }
  }, []);

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons
            name="person-outline"
            size={64}
            color={theme.textSecondary}
            style={styles.emptyIcon}
          />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Not Signed In
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Please sign in to access your account
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <AuthErrorBoundary>
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.userInfoSection}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: theme.primary },
              ]}
            >
              <Ionicons name="person" size={32} color="white" />
            </View>

            <Text style={[styles.userEmail, { color: theme.text }]}>
              {user.email}
            </Text>

            <Text style={[styles.userStatus, { color: theme.textSecondary }]}>
              Signed in successfully
            </Text>
          </View>

          <View style={styles.actionsSection}>
            <AuthButton
              title="Sign Out"
              onPress={handleLogout}
              loading={isLoggingOut}
              disabled={isLoggingOut}
              variant="outline"
              icon="log-out-outline"
              style={styles.signOutButton}
            />

            {__DEV__ && (
              <View style={styles.developmentSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Development Tools
                </Text>

                <AuthLink
                  title="Export Stored Data"
                  onPress={handleExportData}
                  style={styles.devAction}
                />

                <AuthLink
                  title="Clear All Stored Data"
                  onPress={handleClearStoredData}
                  style={styles.devAction}
                  textStyle={{ color: theme.error }}
                />
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              You can manage your account settings and preferences through the
              app settings.
            </Text>
          </View>
        </ScrollView>
      </ThemedView>
    </AuthErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  userInfoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userEmail: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  userStatus: {
    fontSize: 14,
    textAlign: 'center',
  },
  actionsSection: {
    paddingVertical: 16,
  },
  signOutButton: {
    marginBottom: 24,
  },
  developmentSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  devAction: {
    marginBottom: 8,
  },
  infoSection: {
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
