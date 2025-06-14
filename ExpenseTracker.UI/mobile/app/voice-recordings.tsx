import { useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { type VoiceRecordingDto } from '~/types';
import { useTheme } from '~/theme';
import { useVoiceRecordings } from '~/hooks/useRecordings';
import ThemedView from '~/components/themed/ThemedView';
import { RecordedAudioItem } from '~/components/voice/RecordedAudioItem';

export default function VoiceRecordingsScreen() {
  const { theme } = useTheme();
  const { recordings, loading, removeRecording, clearRecordings } =
    useVoiceRecordings();

  // Group recordings by day
  const recordingsByDay = useMemo(
    () => groupRecordingsByDay(recordings),
    [recordings]
  );

  const handleDeleteRecording = async (id: number) => {
    try {
      await removeRecording(id);
    } catch (error) {
      console.error('Failed to delete recording:', error);
      Alert.alert('Error', 'Failed to delete recording');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Recordings',
      'Are you sure you want to delete all recordings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearRecordings,
        },
      ]
    );
  };

  const renderRecordingItem = ({ item }: { item: VoiceRecordingDto }) => (
    <RecordedAudioItem recording={item} onDelete={handleDeleteRecording} />
  );

  const renderSectionHeader = ({ section }: { section: RecordingSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        {section.title}
      </Text>
      <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>
        {section.data.length} recording{section.data.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  return (
    <ThemedView as={SafeAreaView} style={{ flex: 1 }} edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Voice Recordings
          </Text>
          {recordings.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearAll}
            >
              <Text style={[styles.clearButtonText, { color: theme.error }]}>
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text
              style={[styles.emptyDescription, { color: theme.textSecondary }]}
            >
              Loading recordings...
            </Text>
          </View>
        ) : recordings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="mic-outline"
              size={64}
              color={theme.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No Recordings Yet
            </Text>
            <Text
              style={[styles.emptyDescription, { color: theme.textSecondary }]}
            >
              Use the voice button in the tab bar to start recording
            </Text>
          </View>
        ) : (
          <SectionList
            sections={recordingsByDay}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderRecordingItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionCount: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    paddingBottom: 20,
  },
});

type RecordingSection = {
  title: string;
  data: VoiceRecordingDto[];
};

// Local utility functions for this feature
const formatSectionTitle = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
};

const groupRecordingsByDay = (
  recordings: VoiceRecordingDto[]
): RecordingSection[] => {
  const grouped = recordings.reduce(
    (acc, recording) => {
      const date = new Date(recording.recordedAt);
      const dateKey = date.toDateString();

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push(recording);
      return acc;
    },
    {} as Record<string, VoiceRecordingDto[]>
  );

  // Convert to sections and sort by date (most recent first)
  const sections: RecordingSection[] = Object.entries(grouped)
    .map(([dateString, recordings]) => ({
      title: formatSectionTitle(dateString),
      data: recordings.sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      ),
    }))
    .sort(
      (a, b) =>
        new Date(b.data[0].recordedAt).getTime() -
        new Date(a.data[0].recordedAt).getTime()
    );

  return sections;
};
