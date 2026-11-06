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
 * Widget 3: Calendario de Fechas de Entrega de Tareas (TaskDeadlinesWidget)
 * Widget tipo agenda/lista enfocado exclusivamente en las fechas de entrega:
 * - Lista cronológica de tareas con código de color de la materia.
 * - Indicador visual de urgencia (Alta 🔴, Media 🟡, Baja 🟢).
 * - Distintivo institucional adaptable.
 */
public class TaskDeadlinesWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateWidgets(context, appWidgetManager, appWidgetIds);
    }

    public static void updateWidgets(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        JSONObject payload = WidgetDataSync.getParsedPayload(context);
        String instName = "UNAM";

        if (payload != null) {
            JSONObject instObj = payload.optJSONObject("institution");
            if (instObj != null) {
                instName = instObj.optString("name", "UNAM");
            }
        }

        for (int appWidgetId : appWidgetIds) {
            String packageName = context.getPackageName();
            RemoteViews views = new RemoteViews(packageName,
                    context.getResources().getIdentifier("widget_task_deadlines", "layout", packageName));

            int idBadge = context.getResources().getIdentifier("widget_deadlines_inst_badge", "id", packageName);
            int idList = context.getResources().getIdentifier("widget_deadlines_list", "id", packageName);
            int idEmpty = context.getResources().getIdentifier("widget_deadlines_empty", "id", packageName);
            int idBtnAdd = context.getResources().getIdentifier("widget_deadlines_btn_add", "id", packageName);
            int idRoot = context.getResources().getIdentifier("widget_task_deadlines_root", "id", packageName);

            if (idBadge != 0) views.setTextViewText(idBadge, instName);

            // Configurar el servicio de lista RemoteViewsService
            Intent serviceIntent = new Intent(context, TaskDeadlinesService.class);
            serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
            serviceIntent.setData(Uri.parse(serviceIntent.toUri(Intent.URI_INTENT_SCHEME)));
            if (idList != 0) {
                views.setRemoteAdapter(idList, serviceIntent);
                if (idEmpty != 0) views.setEmptyView(idList, idEmpty);
            }

            // PendingIntent para abrir modal de agregar tarea desde el encabezado
            Intent addIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("organizador://app?action=new_task"));
            addIntent.setPackage(packageName);
            addIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent addPendingIntent = PendingIntent.getActivity(
                    context, 301, addIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            if (idBtnAdd != 0) views.setOnClickPendingIntent(idBtnAdd, addPendingIntent);

            // Template PendingIntent para los elementos individuales de la lista
            Intent itemClickIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("organizador://app?action=tasks"));
            itemClickIntent.setPackage(packageName);
            itemClickIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent itemClickPendingIntent = PendingIntent.getActivity(
                    context, 302, itemClickIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);
            if (idList != 0) views.setPendingIntentTemplate(idList, itemClickPendingIntent);

            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, idList);
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
