package com.organizador.escolar.widgets;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/**
 * Gestor central de sincronización de datos entre el almacenamiento web/Capacitor
 * y los 3 Widgets Nativos de Android mediante SharedPreferences.
 */
public class WidgetDataSync {

    public static final String PREFS_NAME = "org_escolar_widgets";
    public static final String KEY_PAYLOAD = "widget_payload";

    public static void savePayload(Context context, String jsonPayload) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_PAYLOAD, jsonPayload).apply();
    }

    public static String getPayload(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_PAYLOAD, null);
    }

    public static JSONObject getParsedPayload(Context context) {
        String raw = getPayload(context);
        if (raw == null || raw.isEmpty()) return null;
        try {
            return new JSONObject(raw);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Notifica y refresca inmediatamente los 3 widgets de escritorio
     */
    public static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        // 1. Refrescar Widget de Acción Rápida
        ComponentName quickTaskComponent = new ComponentName(context, QuickTaskWidget.class);
        int[] quickTaskIds = manager.getAppWidgetIds(quickTaskComponent);
        if (quickTaskIds != null && quickTaskIds.length > 0) {
            QuickTaskWidget.updateWidgets(context, manager, quickTaskIds);
        }

        // 2. Refrescar Widget de Calendario Semanal
        ComponentName weekCalComponent = new ComponentName(context, WeekCalendarWidget.class);
        int[] weekCalIds = manager.getAppWidgetIds(weekCalComponent);
        if (weekCalIds != null && weekCalIds.length > 0) {
            WeekCalendarWidget.updateWidgets(context, manager, weekCalIds);
        }

        // 3. Refrescar Widget de Entregas de Tareas
        ComponentName deadlinesComponent = new ComponentName(context, TaskDeadlinesWidget.class);
        int[] deadlinesIds = manager.getAppWidgetIds(deadlinesComponent);
        if (deadlinesIds != null && deadlinesIds.length > 0) {
            TaskDeadlinesWidget.updateWidgets(context, manager, deadlinesIds);
        }
    }

    // ==========================================
    // Modelos y Clases de Datos para los Widgets
    // ==========================================

    public static class TaskDeadlineItem {
        public String id;
        public String title;
        public String dueDate;
        public String dueTime;
        public String subjectName;
        public int subjectColor;
        public String urgency;
        public String urgencyLabel;
        public boolean isOverdue;

        public TaskDeadlineItem(JSONObject obj) {
            this.id = obj.optString("id", "");
            this.title = obj.optString("title", "Sin título");
            this.dueDate = obj.optString("dueDate", "");
            this.dueTime = obj.optString("dueTime", "23:59");
            this.subjectName = obj.optString("subjectName", "General");
            this.urgency = obj.optString("urgency", "medium");
            this.urgencyLabel = obj.optString("urgencyLabel", "Media 🟡");
            this.isOverdue = obj.optBoolean("isOverdue", false);

            String colorHex = obj.optString("subjectColor", "#4F46E5");
            try {
                this.subjectColor = Color.parseColor(colorHex);
            } catch (Exception e) {
                this.subjectColor = Color.parseColor("#4F46E5");
            }
        }
    }

    public static List<TaskDeadlineItem> getDeadlines(Context context) {
        List<TaskDeadlineItem> list = new ArrayList<>();
        JSONObject root = getParsedPayload(context);
        if (root == null) return list;

        JSONArray arr = root.optJSONArray("deadlines");
        if (arr == null) return list;

        for (int i = 0; i < arr.length(); i++) {
            JSONObject itemObj = arr.optJSONObject(i);
            if (itemObj != null) {
                list.add(new TaskDeadlineItem(itemObj));
            }
        }
        return list;
    }
}
