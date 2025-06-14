import { useState, useEffect, useMemo } from 'react';
import {
  useAudioPlayer as useExpoAudioPlayer,
  useAudioPlayerStatus,
  AudioModule,
} from 'expo-audio';

type UseAudioPlayerResult = {
  isPlaying: boolean;
  isLoading: boolean;
  playPosition: number;
  duration: number;
  playAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
};

type UseAudioPlayerOptions = {
  audioUri?: string;
  recordingId?: string | number;
};

export function useAudioPlayer(
  options: UseAudioPlayerOptions = {}
): UseAudioPlayerResult {
  const { audioUri, recordingId } = options;

  const [isLoading, setIsLoading] = useState(false);

  // Memoize the audio source to prevent unnecessary re-creation
  const audioSource = useMemo(
    () => (audioUri ? { uri: audioUri } : null),
    [audioUri]
  );

  // Use the expo-audio hook for player management - only create player when we have a source
  const player = useExpoAudioPlayer(audioSource, 100);
  const status = useAudioPlayerStatus(player);

  // Set up audio mode once
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await AudioModule.setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldRouteThroughEarpiece: false,
          shouldPlayInBackground: false,
        });
      } catch (error) {
        console.error('Failed to set audio mode:', error);
      }
    };

    setupAudio();
  }, []);

  // Handle audio playback completion
  useEffect(() => {
    if (status && player) {
      // Check if audio has just finished playing
      if (status.didJustFinish) {
        // Reset player to beginning when playback finishes
        player.seekTo(0).catch((error) => {
          console.error(
            'Error seeking to start after playback completion:',
            error
          );
        });
        setIsLoading(false);
      }
    }
  }, [status, player]);

  const playAudio = async () => {
    try {
      if (!audioUri) {
        throw new Error('No audio URI provided to useAudioPlayer');
      }

      setIsLoading(true);

      // Stop current playback if any
      if (player?.playing) {
        player.pause();
      }

      // Wait for the player to be loaded and ready
      let retries = 0;
      const maxRetries = 10;

      while (retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (player && player.isLoaded) {
          // Reset to beginning and play
          await player.seekTo(0);
          player.play();
          setIsLoading(false);
          return;
        }

        retries++;
      }

      // If we get here, the player didn't load in time
      throw new Error('Player failed to load');
    } catch (error) {
      setIsLoading(false);
      console.error('Error playing audio:', error);
      throw new Error('Failed to play audio', { cause: error });
    }
  };

  const stopAudio = async () => {
    try {
      if (player) {
        player.pause();
        await player.seekTo(0);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
      throw new Error('Failed to stop audio', { cause: error });
    }
  };

  const pauseAudio = async () => {
    try {
      if (player) {
        player.pause();
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
      throw new Error('Failed to pause audio', { cause: error });
    }
  };

  const resumeAudio = async () => {
    try {
      if (player) {
        player.play();
      }
    } catch (error) {
      console.error('Error resuming audio:', error);
      throw new Error('Failed to resume audio', { cause: error });
    }
  };

  return {
    isPlaying: status?.playing || false,
    isLoading,
    playPosition: (status?.currentTime || 0) * 1000, // Convert to milliseconds
    duration: (status?.duration || 0) * 1000, // Convert to milliseconds
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
  };
}
