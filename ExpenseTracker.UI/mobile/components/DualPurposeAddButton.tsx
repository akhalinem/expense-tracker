import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '~/theme';
import { useVoiceRecording } from '~/hooks/useVoiceRecording';

type DualPurposeAddButtonProps = {};

export const DualPurposeAddButton = ({}: DualPurposeAddButtonProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const {
    status: recordingStatus,
    start: startRecording,
    stop: stopRecording,
  } = useVoiceRecording();

  const handlePress = async () => {
    if (recordingStatus === 'recording') {
      try {
        await stopRecording();
        Alert.alert('Success', 'Voice recording saved!');
        await queryClient.invalidateQueries({
          queryKey: ['voiceRecordings'],
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to save recording');
      }

      return;
    }

    router.push('new-transaction');
  };

  const handleLongPress = async () => {
    if (recordingStatus === 'recording') return;

    Vibration.vibrate(50); // Haptic feedback

    try {
      await startRecording();

      Alert.alert('Success', 'Voice recording saved!');
      await queryClient.invalidateQueries({
        queryKey: ['voiceRecordings'],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const getIconName = () => {
    if (recordingStatus === 'recording') {
      return 'stop-circle';
    }

    // if (isProcessing) {
    //     return 'hourglass-outline';
    // }

    return 'add-circle';
  };

  const getIconColor = () => {
    if (recordingStatus === 'recording') {
      return '#FF3B30'; // Red for recording
    }

    // if (isProcessing) {
    //     return '#FF9500'; // Orange for processing
    // }

    return theme.primary; // Normal tab color
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.touchable, {}]}
        // disabled={isProcessing}
        activeOpacity={0.6}
        delayLongPress={300}
        onPress={handlePress}
        onLongPress={handleLongPress}
      >
        <Ionicons
          size={72}
          name={getIconName()}
          color={getIconColor()}
          style={[
            styles.touchableIcon,
            {
              backgroundColor: theme.background,
              shadowColor: theme.shadow,
            },
          ]}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  touchable: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  touchableIcon: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderRadius: 36,
  },
});
