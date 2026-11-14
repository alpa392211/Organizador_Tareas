package com.organizador.escolar.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;
import org.json.JSONObject;

/**
 * Widget 1: Acción Rápida de Tareas (QuickTaskWidget)
 * Widget compacto para el escritorio de Android con:
 * - Contador de tareas pendientes para hoy.
 * - Vista previa de la próxima entrega urgente.
 * - Botón de acceso directo para agregar una nueva tarea instantáneamente.
 */
public class QuickTaskWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateWidgets(context, appWidgetManager, appWidgetIds);
    }

    public static void updateWidgets(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        JSONObject payload = WidgetDataSync.getParsedPayload(context);

        String instName = "Mi Agenda";
        int pendingToday = 0;
        String nextTaskTitle = "Todo al corriente para hoy ✨";

        if (payload != null) {
            JSONObject instObj = payload.optJSONObject("institution");
            if (instObj != null) {
                instName = instObj.optString("name", "Mi Agenda");
            }

            JSONObject quickTask = payload.optJSONObject("quickTask");
            if (quickTask != null) {
                pendingToday = quickTask.optInt("pendingTodayCount", 0);
                String task = quickTask.optString("nextTaskTitle", "");
                String subject = quickTask.optString("nextTaskSubject", "");
                if (!task.isEmpty()) {
                    nextTaskTitle = (subject.isEmpty() ? "" : subject + ": ") + task;
                }
            }
        }

        for (int appWidgetId : appWidgetIds) {
            String packageName = context.getPackageName();
            RemoteViews views = new RemoteViews(packageName,
                    context.getResources().getIdentifier("widget_quick_task", "layout", packageName));

            // Actualizar textos
            int idInst = context.getResources().getIdentifier("widget_quick_task_inst_label", "id", packageName);
            int idCount = context.getResources().getIdentifier("widget_quick_task_count", "id", packageName);
            int idNext = context.getResources().getIdentifier("widget_quick_task_next", "id", packageName);
            int idBtnAdd = context.getResources().getIdentifier("widget_quick_task_btn_add", "id", packageName);
            int idRoot = context.getResources().getIdentifier("widget_quick_task_root", "id", packageName);

            if (idInst != 0) views.setTextViewText(idInst, instName);
            if (idCount != 0) views.setTextViewText(idCount, String.valueOf(pendingToday));
            if (idNext != 0) views.setTextViewText(idNext, nextTaskTitle);

            // 1. PendingIntent para abrir la aplicación directamente en el modal de Nueva Tarea
            Intent addTaskIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("organizador://app?action=new_task"));
            addTaskIntent.setPackage(packageName);
            addTaskIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent addPendingIntent = PendingIntent.getActivity(
                    context, 101, addTaskIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            if (idBtnAdd != 0) views.setOnClickPendingIntent(idBtnAdd, addPendingIntent);

            // 2. PendingIntent para abrir la vista general de tareas al tocar el cuerpo del widget
            Intent openAppIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("organizador://app?action=tasks"));
            openAppIntent.setPackage(packageName);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent openPendingIntent = PendingIntent.getActivity(
                    context, 102, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            if (idRoot != 0) views.setOnClickPendingIntent(idRoot, openPendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
