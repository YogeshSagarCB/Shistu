package com.basecamplogic.shistu

import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import android.app.PendingIntent
import android.database.Cursor

class HabitWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        Log.d("ShistuWidgetService", "onGetViewFactory")
        return HabitWidgetFactory(applicationContext)
    }
}

class HabitWidgetFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {
    private var habits = mutableListOf<HabitData>()

    data class HabitData(val id: Int, val name: String, val count: Double, val unit: String?)

    override fun onCreate() {
        Log.d("ShistuWidgetFactory", "onCreate called")
        onDataSetChanged()
    }

    override fun onDataSetChanged() {
        Log.d("ShistuWidgetFactory", "onDataSetChanged - STARTED querying ContentProvider")
        habits.clear()
        
        val uri = ShistuContentProvider.CONTENT_URI
        val cursor: Cursor? = context.contentResolver.query(uri, null, null, null, null)
        
        cursor?.use {
            val idCol = it.getColumnIndex("id")
            val nameCol = it.getColumnIndex("name")
            val countCol = it.getColumnIndex("today_value")
            val unitCol = it.getColumnIndex("metric_unit")
            
            while (it.moveToNext()) {
                val data = HabitData(
                    if (idCol != -1) it.getInt(idCol) else 0,
                    if (nameCol != -1) it.getString(nameCol) else "Unknown",
                    if (countCol != -1) it.getDouble(countCol) else 0.0,
                    if (unitCol != -1) it.getString(unitCol) else ""
                )
                habits.add(data)
            }
        }
    }

    override fun onDestroy() { habits.clear() }
    override fun getCount() = habits.size
    override fun getViewAt(position: Int): RemoteViews {
        val habit = habits[position]
        val views = RemoteViews(context.packageName, R.layout.habit_widget_item)
        
        views.setTextViewText(R.id.item_habit_name, habit.name)
        
        val unitText = if (!habit.unit.isNullOrEmpty() && habit.unit != "null") " " + habit.unit else ""
        val countText = habit.count.toInt().toString() + unitText
        views.setTextViewText(R.id.item_habit_count, countText)
        
        // Fixed: Use FillInIntent for template pattern
        val intent = Intent()
        intent.putExtra("habit_id", habit.id)
        views.setOnClickFillInIntent(R.id.item_log_button, intent)
        
        return views
    }
    override fun getLoadingView() = null
    override fun getViewTypeCount() = 1
    override fun getItemId(position: Int) = position.toLong()
    override fun hasStableIds() = true
}
