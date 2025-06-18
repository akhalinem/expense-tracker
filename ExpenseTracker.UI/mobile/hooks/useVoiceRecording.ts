import { useRef, useEffect } from 'react';
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { voiceRecordingsService } from '~/services/voiceRecordings';
import { CreateVoiceRecordingDto } from '~/types';

type RecordingStatus = 'idle' | 'recording' | 'processing';

export function useVoiceRecording() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const start = (): Promise<void> =>
    new Promise<void>(async (resolve, reject) => {
      try {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          reject(new Error('Microphone permission not granted'));
          return;
        }

        await AudioModule.setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        // Prepare and start recording
        await recorder.prepareToRecordAsync();
        recorder.record();
        console.log('Recording started');

        // Set 5-second timer to auto-stop recording
        await scheduleAutoStop(5_000);
        resolve();
      } catch (error) {
        console.error('Failed to start recording:', error);
        reject();
      }
    });

  const stop = (): Promise<void> =>
    new Promise<void>(async (resolve, reject) => {
      try {
        if (!recorder.getStatus().isRecording) {
          reject(new Error('Cannot stop recording: not currently recording'));
          return;
        }

        // Clear the timer if it exists
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        await recorder.stop();
        const uri = recorder.uri;

        if (!uri) {
          reject(new Error('No recording URI found'));
          return;
        }

        const filePath = await processRecording(uri);

        if (!filePath) {
          reject(new Error('Failed to process recording'));
          return;
        }

        resolve();
      } catch (error) {
        console.error('Failed to stop recording:', error);
        reject(new Error('Failed to stop recording', { cause: error }));
      }
    });

  const scheduleAutoStop = (delay: number = 5_000): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      {
        timerRef.current = setTimeout(async () => {
          try {
            await stop();
            resolve();
          } catch (error) {
            console.error('Auto-stop recording error:', error);
            timerRef.current = null;
            reject(
              new Error('Failed to auto-stop recording', { cause: error })
            );
          }
        }, delay);
      }
    });

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const status: RecordingStatus = recorderState.isRecording
    ? 'recording'
    : 'idle';

  return {
    status,
    start,
    stop,
  };
}

// Create recordings directory if it doesn't exist
const ensureRecordingsDirectory = async () => {
  const recordingsDir = `${FileSystem.documentDirectory}recordings/`;
  const dirInfo = await FileSystem.getInfoAsync(recordingsDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(recordingsDir, {
      intermediates: true,
    });
  }
  return recordingsDir;
};

// Helper function to get recording duration
const getRecordingDuration = async (uri: string): Promise<number | null> => {
  try {
    // For now, return null and let the audio player determine duration when loaded
    // This approach is more efficient and doesn't block the recording save process
    // The UI will show '--:--' initially and update to the actual duration once loaded
    return null;
  } catch (error) {
    console.error('Failed to get recording duration:', error);
    return null;
  }
};

const requestPermissions = async (): Promise<boolean> => {
  try {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    return permission.status === 'granted';
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};

// Helper function to process recording after stopping
const processRecording = async (
  recordingUri: string
): Promise<string | null> => {
  try {
    // Ensure recordings directory exists
    const recordingsDir = await ensureRecordingsDirectory();

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `recording_${timestamp}.m4a`;
    const filePath = `${recordingsDir}${fileName}`;

    // Move file to permanent location
    await FileSystem.moveAsync({
      from: recordingUri,
      to: filePath,
    });

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    const fileSize =
      fileInfo.exists && !fileInfo.isDirectory ? fileInfo.size || 0 : 0;

    // Get recording duration (simplified for now)
    const duration = await getRecordingDuration(filePath);

    // Save to database
    const recordingData: CreateVoiceRecordingDto = {
      filePath,
      fileName,
      duration,
      fileSize,
    };

    await voiceRecordingsService.create(recordingData);
    return filePath;
  } catch (error) {
    console.error('Failed to process recording:', error);
    return null;
  }
};
