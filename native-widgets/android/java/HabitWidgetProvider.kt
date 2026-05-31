package com.basecamplogic.shistu

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.RemoteViews

class HabitWidgetProvider : AppWidgetProvider() {
    companion object {
        const val ACTION_LOG_EVENT = "com.basecamplogic.shistu.ACTION_LOG_EVENT"
    }

    override fun onReceive(context: Context, intent: Intent) {
        // Log every broadcast received by this provider
        Log.d("ShistuWidget", "onReceive action: ${intent.action}")
        super.onReceive(context, intent)
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        Log.d("ShistuWidget", "onUpdate called for ${appWidgetIds.size} widgets")
        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.habit_widget_layout)
            
            // Adapter for list
            val intent = Intent(context, HabitWidgetService::class.java)
            views.setRemoteAdapter(R.id.widget_list, intent)
            
            // Set template for item clicks
            val logIntent = Intent(context, HabitLogReceiver::class.java)
            logIntent.action = ACTION_LOG_EVENT
            
            // Ensure flag is set for broadcasting
            val pendingIntent = PendingIntent.getBroadcast(
                context, 
                0, // Consistent request code for template
                logIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )
            views.setPendingIntentTemplate(R.id.widget_list, pendingIntent)
            
            appWidgetManager.updateAppWidget(appWidgetId, views)
            Log.d("ShistuWidget", "Template set for widget $appWidgetId")
        }
    }
}
