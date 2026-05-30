/**
 * This file serves as the bridge for Native Widgets (iOS/Android) 
 * to interact with the shared SQLite database.
 * 
 * In a real-world scenario, the Native side (Swift/Kotlin) would use 
 * direct SQLite calls. This TS file provides the logic reference 
 * for what those SQL queries should look like.
 */

export const WIDGET_QUERIES = {
  /**
   * Appends a record to the events table.
   * Native widgets will execute this SQL directly.
   */
  logEvent: `
    INSERT INTO events (habit_id, timestamp, numeric_value) 
    VALUES (?, datetime('now'), ?);
  `,

  /**
   * Fetches the top 3 most recent habits for the widget display.
   */
  getQuickTrackHabits: `
    SELECT id, name, icon_name, color_hex 
    FROM habits 
    ORDER BY created_at DESC 
    LIMIT 3;
  `,

  /**
   * Fetches the today's progress for a specific habit.
   */
  getTodayProgress: `
    SELECT COALESCE(SUM(numeric_value), 0) as total 
    FROM events 
    WHERE habit_id = ? AND date(timestamp) = date('now');
  `
};

/**
 * Android Note (Room/SQLite):
 * Ensure the database file is located in the shared context storage 
 * or use a ContentProvider to expose these operations.
 * 
 * iOS Note (SwiftData/SQLite):
 * Add both the Main App and Widget Extension to the same "App Group".
 * Access the DB via: 
 * let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.basecamplogic.shistu")
 */
