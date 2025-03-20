import * as SQLite from 'expo-sqlite';

export let db: SQLite.SQLiteDatabase | null = null;

export const initDbAsync = async (): Promise<SQLite.SQLiteDatabase> => {
    if (db) return db;

    db = await SQLite.openDatabaseAsync('expense-tracker.db');

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            amount REAL NOT NULL
        );`);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );`);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoryId INTEGER NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY (categoryId) REFERENCES categories (id)
        );`);

    return db;
};