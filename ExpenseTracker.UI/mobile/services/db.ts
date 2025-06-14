import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { schema } from '~/db/schema';

const DB_NAME = 'expense-tracker.db';
const expoSqliteDb = openDatabaseSync(DB_NAME);
const drizzleDb = drizzle(expoSqliteDb, { schema });

export { expoSqliteDb, drizzleDb, drizzleDb as db };
