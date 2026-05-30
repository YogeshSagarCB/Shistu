package com.basecamplogic.shistu

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.database.sqlite.SQLiteDatabase
import android.content.ContentValues

class LogHabitReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val habitId = intent.getIntExtra("habit_id", -1)
        val increment = intent.getDoubleExtra("increment", 1.0)
        
        if (habitId == -1) return

        val dbFile = context.getDatabasePath("habits_tracker.db")
        if (dbFile.exists()) {
            val db = SQLiteDatabase.openDatabase(dbFile.path, null, SQLiteDatabase.OPEN_READWRITE)
            
            val values = ContentValues().apply {
                put("habit_id", habitId)
                put("numeric_value", increment)
                // SQLite datetime('now') equivalent logic or raw SQL
            }
            
            // Raw SQL for exact logic match with db/widget-sync.ts
            db.execSQL(
                "INSERT INTO events (habit_id, timestamp, numeric_value) VALUES (?, datetime('now'), ?);",
                arrayOf(habitId, increment)
            )
            
            db.close()
        }
        
        // Notify widget to update UI
        // sendBroadcast(Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE))
    }
}
