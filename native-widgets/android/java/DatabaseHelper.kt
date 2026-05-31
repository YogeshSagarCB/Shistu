package com.basecamplogic.shistu

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.util.Log
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object DatabaseHelper {
    private fun getDbFile(context: Context): File {
        return context.getDatabasePath("habits_tracker.db")
    }

    fun addEvent(context: Context, habitId: Int, value: Double, notes: String?) {
        val dbFile = getDbFile(context)
        if (!dbFile.exists()) {
            Log.e("DatabaseHelper", "CRITICAL: DB file not found at ${dbFile.absolutePath}")
            return
        }
        
        try {
            val db = SQLiteDatabase.openDatabase(dbFile.path, null, SQLiteDatabase.OPEN_READWRITE)
            
            // Diagnostic: List tables
            val cursor = db.rawQuery("SELECT name FROM sqlite_master WHERE type='table'", null)
            val tables = mutableListOf<String>()
            while (cursor.moveToNext()) {
                tables.add(cursor.getString(0))
            }
            cursor.close()
            Log.d("DatabaseHelper", "Tables in DB: $tables")
            
            val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())
            
            db.execSQL(
                "INSERT INTO events (habit_id, timestamp, numeric_value, notes) VALUES (?, ?, ?, ?)",
                arrayOf(habitId, now, value, notes)
            )
            db.close()
            Log.d("DatabaseHelper", "Successfully inserted event for habit $habitId")
        } catch (e: Exception) {
            Log.e("DatabaseHelper", "Error inserting event: ${e.message}")
        }
    }
}
