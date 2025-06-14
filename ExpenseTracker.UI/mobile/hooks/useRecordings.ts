import * as FileSystem from 'expo-file-system';
import { useQuery } from '@tanstack/react-query';
import { voiceRecordingsService } from '~/services/voiceRecordings';

export function useVoiceRecordings() {
  const recordingsQuery = useQuery({
    queryKey: ['voiceRecordings'],
    queryFn: () => voiceRecordingsService.getAll(),
  });

  const recordings = recordingsQuery.data || [];

  const refreshRecordings = async () => {
    try {
      await recordingsQuery.refetch();
    } catch (error) {
      console.error('Failed to refresh recordings:', error);
      throw new Error('Failed to refresh recordings', { cause: error });
    }
  };

  const removeRecording = async (id: number) => {
    try {
      // Get recording info first to delete the file
      const recording = await voiceRecordingsService.getById(id);
      if (recording) {
        // Delete file from filesystem
        const fileInfo = await FileSystem.getInfoAsync(recording.filePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(recording.filePath);
        }
      }

      // Delete from database
      await voiceRecordingsService.delete(id);
      await recordingsQuery.refetch();
    } catch (error) {
      console.error('Failed to remove recording:', error);
      throw new Error('Failed to remove recording', { cause: error });
    }
  };

  const clearRecordings = async () => {
    try {
      // Delete all files first
      for (const recording of recordings) {
        const fileInfo = await FileSystem.getInfoAsync(recording.filePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(recording.filePath);
        }
      }

      // Clear database
      await voiceRecordingsService.deleteAll();
      await recordingsQuery.refetch();
    } catch (error) {
      console.error('Failed to clear recordings:', error);
      throw new Error('Failed to clear recordings', { cause: error });
    }
  };

  return {
    recordings,
    loading: recordingsQuery.isLoading,
    refreshRecordings,
    removeRecording,
    clearRecordings,
  };
}
