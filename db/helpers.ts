import { db } from './client';

export interface Habit {
  id: number;
  name: string;
  type: 'positive' | 'negative';
  metric_type: 'binary' | 'numeric';
  metric_unit?: string;
  color_hex: string;
  icon_name: string;
  ai_granularity: 'aggregated' | 'raw';
  default_increment: number;
  created_at: string;
}

export interface HabitStats extends Habit {
  today_value: number;
}

/**
 * Fetches all habits with their accumulated value for the current day.
 */
export const getTodayHabits = (): HabitStats[] => {
  const today = new Date().toISOString().split('T')[0];
  return db.getAllSync<HabitStats>(`
    SELECT 
      h.*, 
      COALESCE(SUM(e.numeric_value), 0) as today_value
    FROM habits h
    LEFT JOIN events e ON h.id = e.habit_id AND e.timestamp >= ?
    GROUP BY h.id
  `, today);
};

/**
 * Adds a new event log for a habit.
 * Enforces a hard cap of 999.9 on numeric values.
 */
export const addEvent = (habitId: number, value: number = 1.0, notes?: string) => {
  const cappedValue = Math.min(value, 999.9);
  const now = new Date().toISOString();
  
  return db.runSync(
    `INSERT INTO events (habit_id, timestamp, numeric_value, notes) VALUES (?, ?, ?, ?)`,
    habitId, now, cappedValue, notes || null
  );
};

/**
 * Creates a new habit.
 */
export const createHabit = (habit: Omit<Habit, 'id' | 'created_at'>) => {
  return db.runSync(
    `INSERT INTO habits (name, type, metric_type, metric_unit, color_hex, icon_name, ai_granularity, default_increment) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    habit.name, habit.type, habit.metric_type, habit.metric_unit || null, habit.color_hex, habit.icon_name, habit.ai_granularity, habit.default_increment
  );
};

/**
 * Deletes a habit and all its events (via Cascade).
 */
export const deleteHabit = (id: number) => {
  return db.runSync(`DELETE FROM habits WHERE id = ?`, id);
};
