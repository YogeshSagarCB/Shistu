import * as SQLite from 'expo-sqlite';

// Opens the database (or creates it if it doesn't exist)
export const db = SQLite.openDatabaseSync('habits_tracker.db');

export const initDB = () => {
  try {
    db.execSync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        metric_type TEXT NOT NULL,
        metric_unit TEXT,
        color_hex TEXT NOT NULL,
        icon_name TEXT NOT NULL,
        ai_granularity TEXT DEFAULT 'aggregated',
        default_increment REAL DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habit_id INTEGER NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        numeric_value REAL DEFAULT 1.0,
        notes TEXT,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS pause_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habit_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
      );
    `);

    // Ensure the new column exists (Simple migration)
    try {
      db.execSync(`ALTER TABLE habits ADD COLUMN default_increment REAL DEFAULT 1.0;`);
    } catch (e) {
      // Column likely already exists
    }

    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};
