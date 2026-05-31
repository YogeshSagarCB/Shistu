package com.basecamplogic.shistu

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.ContentValues
import android.util.Log
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.net.Uri

class HabitLogReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == HabitWidgetProvider.ACTION_LOG_EVENT) {
            val habitId = intent.getIntExtra("habit_id", -1)
            
            if (habitId != -1) {
                // Fixed column name: 'notes' instead of 'note'
                val values = ContentValues().apply {
                    put("habit_id", habitId)
                    put("numeric_value", 1.0)
                    put("timestamp", System.currentTimeMillis())
                    put("notes", "Logged from widget")
                }
                
                try {
                    val uri = Uri.parse("content://" + ShistuContentProvider.AUTHORITY + "/events")
                    context.contentResolver.insert(uri, values)
                    
                    // Trigger widget update
                    val appWidgetManager = AppWidgetManager.getInstance(context)
                    val cn = ComponentName(context, HabitWidgetProvider::class.java)
                    val ids = appWidgetManager.getAppWidgetIds(cn)
                    if (ids.isNotEmpty()) {
                        appWidgetManager.notifyAppWidgetViewDataChanged(ids, R.id.widget_list)
                    }
                } catch (e: Exception) {
                    Log.e("ShistuReceiver", "Failed to log event: " + e.message)
                }
            }
        }
    }
}
