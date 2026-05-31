package com.basecamplogic.shistu

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class WidgetSyncModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private var instance: WidgetSyncModule? = null
        
        fun getInstance(): WidgetSyncModule? {
            return instance
        }
    }

    init {
        instance = this
        Log.d("ShistuNative", "WidgetSyncModule initialized")
    }

    override fun getName(): String = "WidgetSyncModule"

    @ReactMethod
    fun saveHabitsList(habitsJson: String) {
        val sharedPrefs = reactApplicationContext.getSharedPreferences("ShistuPrefs", Context.MODE_PRIVATE)
        sharedPrefs.edit().putString("habits_list", habitsJson).commit()
        triggerWidgetUpdate()
    }

    @ReactMethod
    fun triggerWidgetUpdate() {
        val context = reactApplicationContext
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val cn = ComponentName(context, HabitWidgetProvider::class.java)
        val ids = appWidgetManager.getAppWidgetIds(cn)
        
        if (ids.isNotEmpty()) {
            appWidgetManager.notifyAppWidgetViewDataChanged(ids, R.id.widget_list)
            Log.d("ShistuNative", "Direct Widget update notified")
        }
    }

    @ReactMethod
    fun triggerHabitsUpdated() {
        // Just reuse the direct update logic
        triggerWidgetUpdate()
    }

    @ReactMethod
    fun logMessage(message: String) {
        Log.d("ShistuJS", message)
    }

    fun logHabit(habitId: Int) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onLogHabitFromWidget", habitId)
    }
}
