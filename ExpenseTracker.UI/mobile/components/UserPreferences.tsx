import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';

interface UserPreferencesProps {
  onClose?: () => void;
}

interface Preference {
  id: string;
  title: string;
  description: string;
  value: boolean;
  icon: string;
  iconColor: string;
}

export const UserPreferences: React.FC<UserPreferencesProps> = ({
  onClose,
}) => {
  const theme = useTheme();

  const [preferences, setPreferences] = useState<Preference[]>([
    {
      id: 'notifications',
      title: 'Push Notifications',
      description: 'Get reminders and expense alerts',
      value: true,
      icon: 'notifications-outline',
      iconColor: '#FF9500',
    },
    {
      id: 'autoSync',
      title: 'Auto Sync',
      description: 'Sync automatically when app opens',
      value: true,
      icon: 'sync-outline',
      iconColor: '#007AFF',
    },
    {
      id: 'wifiOnly',
      title: 'WiFi Only Sync',
      description: 'Sync only when connected to WiFi',
      value: false,
      icon: 'wifi-outline',
      iconColor: '#34C759',
    },
    {
      id: 'faceId',
      title: 'Biometric Security',
      description: 'Use Face ID or Touch ID to unlock',
      value: false,
      icon: 'finger-print-outline',
      iconColor: '#FF3B30',
    },
    {
      id: 'darkMode',
      title: 'Dark Mode',
      description: 'Automatically use dark theme',
      value: false,
      icon: 'moon-outline',
      iconColor: '#8E8E93',
    },
  ]);

  const togglePreference = (id: string) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === id ? { ...pref, value: !pref.value } : pref
      )
    );

    // Handle specific preference changes
    if (id === 'notifications') {
      // Request notification permissions
    } else if (id === 'faceId') {
      // Setup biometric authentication
    } else if (id === 'darkMode') {
      // Toggle theme
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset All Preferences',
      'This will restore all settings to their default values. Your data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Defaults',
          style: 'destructive',
          onPress: () => {
            setPreferences((prev) =>
              prev.map((pref) => ({
                ...pref,
                value: pref.id === 'notifications' || pref.id === 'autoSync',
              }))
            );
          },
        },
      ]
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.theme.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.theme.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: theme.theme.text }]}>
          Preferences
        </Text>
        <TouchableOpacity onPress={resetToDefaults} style={styles.resetButton}>
          <Text style={[styles.resetText, { color: theme.theme.primary }]}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>

      {/* Preferences List */}
      <View style={[styles.section, { backgroundColor: theme.theme.surface }]}>
        {preferences.map((preference, index) => (
          <React.Fragment key={preference.id}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceIcon}>
                <Ionicons
                  name={preference.icon as any}
                  size={20}
                  color={preference.iconColor}
                />
              </View>
              <View style={styles.preferenceContent}>
                <Text
                  style={[styles.preferenceTitle, { color: theme.theme.text }]}
                >
                  {preference.title}
                </Text>
                <Text
                  style={[
                    styles.preferenceDescription,
                    { color: theme.theme.textSecondary },
                  ]}
                >
                  {preference.description}
                </Text>
              </View>
              <Switch
                value={preference.value}
                onValueChange={() => togglePreference(preference.id)}
                trackColor={{
                  false: theme.theme.border,
                  true: theme.theme.primary,
                }}
                thumbColor={theme.theme.background}
              />
            </View>
            {index < preferences.length - 1 && (
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.theme.border },
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Additional Settings */}
      <View style={[styles.section, { backgroundColor: theme.theme.surface }]}>
        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.preferenceIcon}>
            <Ionicons name="language-outline" size={20} color="#8E8E93" />
          </View>
          <View style={styles.preferenceContent}>
            <Text style={[styles.preferenceTitle, { color: theme.theme.text }]}>
              Language
            </Text>
            <Text
              style={[
                styles.preferenceDescription,
                { color: theme.theme.textSecondary },
              ]}
            >
              English
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.theme.textSecondary}
          />
        </TouchableOpacity>

        <View
          style={[styles.divider, { backgroundColor: theme.theme.border }]}
        />

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.preferenceIcon}>
            <Ionicons name="card-outline" size={20} color="#8E8E93" />
          </View>
          <View style={styles.preferenceContent}>
            <Text style={[styles.preferenceTitle, { color: theme.theme.text }]}>
              Currency
            </Text>
            <Text
              style={[
                styles.preferenceDescription,
                { color: theme.theme.textSecondary },
              ]}
            >
              USD ($)
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Help Text */}
      <Text style={[styles.helpText, { color: theme.theme.textSecondary }]}>
        Preferences are saved automatically. Some changes may require restarting
        the app to take effect.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingVertical: 8,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  preferenceIcon: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },
  helpText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
