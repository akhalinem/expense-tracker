import React, { FC } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type VoiceRecordingDto } from '~/types';
import { useTheme } from '~/theme';
import { useAudioPlayer } from '~/hooks/useAudioPlayer';

type RecordedAudioItemProps = {
  recording: VoiceRecordingDto;
  onDelete: (id: number) => void;
};

export const RecordedAudioItem: FC<RecordedAudioItemProps> = ({
  recording,
  onDelete,
}) => {
  const { theme } = useTheme();
  const {
    isPlaying,
    isLoading,
    duration: audioDuration,
    playAudio,
    stopAudio,
  } = useAudioPlayer({
    audioUri: recording.filePath,
    recordingId: recording.id,
  });

  // Use audio player duration if available and greater than 0, otherwise show loading state
  const displayDuration = audioDuration || null;

  const handlePlayPress = async () => {
    try {
      if (isPlaying) {
        await stopAudio();
      } else {
        await playAudio();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handlePressDelete = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(recording.id),
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.recordingItem,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.recordingHeader}>
        <View style={styles.recordingInfo}>
          <Text style={[styles.recordingTime, { color: theme.text }]}>
            {formatTime(recording.recordedAt)}
          </Text>
          <Text
            style={[styles.recordingDuration, { color: theme.textSecondary }]}
          >
            {formatDuration(displayDuration)}
          </Text>
        </View>
        <View style={styles.recordingActions}>
          <TouchableOpacity
            style={[
              styles.playButton,
              {
                backgroundColor: isPlaying ? theme.error : theme.primary,
              },
            ]}
            disabled={isLoading}
            onPress={handlePlayPress}
          >
            {isLoading ? (
              <Ionicons name="ellipsis-horizontal" size={16} color="white" />
            ) : (
              <Ionicons
                name={isPlaying ? 'stop' : 'play'}
                size={16}
                color="white"
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.error }]}
            onPress={handlePressDelete}
          >
            <Ionicons name="trash" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.recordingFileName, { color: theme.textSecondary }]}>
        {recording.fileName}
      </Text>
    </View>
  );
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (duration: number | null) => {
  if (!duration || duration <= 0) return '--:--';

  const seconds = Math.floor(duration / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  recordingItem: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recordingDuration: {
    fontSize: 14,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingFileName: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
