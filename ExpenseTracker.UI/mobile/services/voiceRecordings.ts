import { eq } from 'drizzle-orm';
import { CreateVoiceRecordingDto, VoiceRecordingDto } from '~/types';
import { voiceRecordingsTable } from '~/db/schema';
import { db } from './db';

export const voiceRecordingsService = {
  // Get all voice recordings
  async getAll(): Promise<VoiceRecordingDto[]> {
    const recordings = await db.select().from(voiceRecordingsTable);
    return recordings;
  },

  // Get voice recording by ID
  async getById(id: number): Promise<VoiceRecordingDto | null> {
    const recordings = await db
      .select()
      .from(voiceRecordingsTable)
      .where(eq(voiceRecordingsTable.id, id));

    if (recordings.length === 0) return null;

    const recording = recordings[0];
    return recording;
  },

  // Create a new voice recording
  async create(data: CreateVoiceRecordingDto): Promise<VoiceRecordingDto> {
    const [insertedRecording] = await db
      .insert(voiceRecordingsTable)
      .values({
        ...data,
        recordedAt: new Date().toISOString(),
      })
      .returning();

    return insertedRecording;
  },

  // Delete voice recording
  async delete(id: number): Promise<boolean> {
    const result = await db
      .delete(voiceRecordingsTable)
      .where(eq(voiceRecordingsTable.id, id));

    return result.changes > 0;
  },

  // Delete all recordings
  async deleteAll(): Promise<void> {
    await db.delete(voiceRecordingsTable);
  },
};
