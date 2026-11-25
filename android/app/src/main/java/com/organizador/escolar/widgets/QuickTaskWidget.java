package com.organizador.escolar.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

import com.organizador.escolar.MainActivity;
import com.organizador.escolar.R;

import org.json.JSONObject;

/**
 * Widget 1: Acción Rápida de Tareas (QuickTaskWidget)
 * Muestra contador de tareas pendientes, próxima entrega y botón directo "+ Tarea".
 */
public class QuickTaskWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateWidgets(context, appWidgetManager, appWidgetIds);
    }

    public static void updateWidgets(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        if (context == null || appWidgetManager == null || appWidgetIds == null) return;

        JSONObject payload = WidgetDataSync.getParsedPayload(context);

        String instName = "Organizador";
        int pendingToday = 0;
        String nextTaskTitle = "Todo al corriente para hoy";

        if (payload != null) {
            JSONObject instObj = payload.optJSONObject("institution");
            if (instObj != null) {
                instName = instObj.optString("name", "Organizador");
            }

            JSONObject quickTask = payload.optJSONObject("quickTask");
            if (quickTask != null) {
                pendingToday = quickTask.has("pendingTodayCount")
                        ? quickTask.optInt("pendingTodayCount", 0)
                        : quickTask.optInt("pendingToday", 0);
                String task = quickTask.optString("nextTaskTitle", "");
                String subject = quickTask.optString("nextTaskSubject", "");
                if (task.isEmpty()) {
                    JSONObject nestedNext = quickTask.optJSONObject("nextTask");
                    if (nestedNext != null) {
                        task = nestedNext.optString("title", "");
                        subject = nestedNext.optString("subjectName", "");
                    }
                }
                if (!task.isEmpty()) {
                    nextTaskTitle = (subject.isEmpty() ? "" : subject + ": ") + task;
                }
            }
        }

        ComponentName mainComp = new ComponentName(context, MainActivity.class);

        for (int appWidgetId : appWidgetIds) {
            try {
                RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_task);

                views.setTextViewText(R.id.widget_quick_task_inst_label, instName);
                views.setTextViewText(R.id.widget_quick_task_count, String.valueOf(pendingToday));
                views.setTextViewText(R.id.widget_quick_task_next, nextTaskTitle);

                Intent addTaskIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("organizador://app?action=new_task"));
                addTaskIntent.setComponent(mainComp);
                addTaskIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent addPendingIntent = PendingIntent.getActivity(
                        context, 101, addTaskIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                views.setOnClickPendingIntent(R.id.widget_quick_task_btn_add, addPendingIntent);

                Intent openAppIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("organizador://app?action=tasks"));
                openAppIntent.setComponent(mainComp);
                openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent openPendingIntent = PendingIntent.getActivity(
                        context, 102, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                views.setOnClickPendingIntent(R.id.widget_quick_task_root, openPendingIntent);

                appWidgetManager.updateAppWidget(appWidgetId, views);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
