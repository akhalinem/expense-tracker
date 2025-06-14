CREATE TABLE voice_recordings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filePath TEXT NOT NULL,
    fileName TEXT NOT NULL,
    duration REAL,
    recordedAt TEXT NOT NULL,
    fileSize INTEGER
);