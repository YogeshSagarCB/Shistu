package com.basecamplogic.shistu

import android.content.ContentProvider
import android.content.ContentValues
import android.content.Context
import android.content.UriMatcher
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.net.Uri
import android.util.Log
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ShistuContentProvider : ContentProvider() {
    companion object {
        const val AUTHORITY = "com.basecamplogic.shistu.provider"
        val CONTENT_URI: Uri = Uri.parse("content://" + AUTHORITY + "/habits")
        
        private val uriMatcher = UriMatcher(UriMatcher.NO_MATCH).apply {
            addURI(AUTHORITY, "habits", 1)
            addURI(AUTHORITY, "events", 2)
        }
        private const val DB_PATH = "/data/data/com.basecamplogic.shistu/files/SQLite/habits_tracker.db"
    }

    private var db: SQLiteDatabase? = null

    override fun onCreate(): Boolean {
        try {
            val dbFile = File(DB_PATH)
            if (dbFile.exists()) {
                db = SQLiteDatabase.openDatabase(DB_PATH, null, SQLiteDatabase.OPEN_READWRITE)
            }
        } catch (e: Exception) {
            Log.e("ShistuContentProvider", "Failed to open DB: " + e.message)
        }
        return true
    }

    override fun query(uri: Uri, projection: Array<String>?, selection: String?, selectionArgs: Array<String>?, sortOrder: String?): Cursor? {
        val match = uriMatcher.match(uri)
        val currentDb = db
        if (currentDb == null || !currentDb.isOpen) return null

        try {
            if (match == 1) {
                // Get today's date string in ISO format (YYYY-MM-DD)
                val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
                
                // Fixed SQL: Use ISO date string comparison
                val query = """
                    SELECT h.*, COALESCE(SUM(e.numeric_value), 0) as today_value
                    FROM habits h
                    LEFT JOIN events e ON h.id = e.habit_id AND DATE(e.timestamp) >= ?
                    GROUP BY h.id
                """
                return currentDb.rawQuery(query, arrayOf(today))
            } else if (match == 2) {
                return currentDb.query("events", projection, selection, selectionArgs, null, null, sortOrder)
            }
            throw IllegalArgumentException("Unknown URI: " + uri)
        } catch (e: Exception) {
            Log.e("ShistuContentProvider", "Query error: " + e.message)
            return null
        }
    }

    override fun insert(uri: Uri, values: ContentValues?): Uri? {
        val match = uriMatcher.match(uri)
        val currentDb = db
        if (currentDb == null || !currentDb.isOpen) return null

        try {
            if (match == 2) {
                // Ensure timestamp is in ISO format
                val timestamp = values?.getAsLong("timestamp")
                if (timestamp != null) {
                    val isoDate = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US).format(Date(timestamp))
                    values.put("timestamp", isoDate)
                }
                
                val id = currentDb.insert("events", null, values)
                context?.contentResolver?.notifyChange(uri, null)
                return Uri.withAppendedPath(CONTENT_URI, id.toString())
            }
            throw IllegalArgumentException("Unsupported URI: " + uri)
        } catch (e: Exception) {
            Log.e("ShistuContentProvider", "Insert error: " + e.message)
            return null
        }
    }

    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<String>?): Int = 0
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<String>?): Int = 0
    override fun getType(uri: Uri): String? = null
}
