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
 * Widget 3: Calendario de Fechas de Entrega de Tareas (TaskDeadlinesWidget)
 * Usa referencias directas R.* y PendingIntents explícitos compatibles con Android 14+.
 */
public class TaskDeadlinesWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateWidgets(context, appWidgetManager, appWidgetIds);
    }

    public static void updateWidgets(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        if (context == null || appWidgetManager == null || appWidgetIds == null) return;

        JSONObject payload = WidgetDataSync.getParsedPayload(context);
        String instName = "Organizador";

        if (payload != null) {
            JSONObject instObj = payload.optJSONObject("institution");
            if (instObj != null) {
                instName = instObj.optString("name", "Organizador");
            }
        }

        ComponentName mainComp = new ComponentName(context, MainActivity.class);

        for (int appWidgetId : appWidgetIds) {
            try {
                RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_task_deadlines);

                views.setTextViewText(R.id.widget_deadlines_inst_badge, instName);

                Intent serviceIntent = new Intent(context, TaskDeadlinesService.class);
                serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
                serviceIntent.setData(Uri.parse(serviceIntent.toUri(Intent.URI_INTENT_SCHEME)));
                views.setRemoteAdapter(R.id.widget_deadlines_list, serviceIntent);
                views.setEmptyView(R.id.widget_deadlines_list, R.id.widget_deadlines_empty);

                Intent addIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("organizador://app?action=new_task"));
                addIntent.setComponent(mainComp);
                addIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent addPendingIntent = PendingIntent.getActivity(
                        context, 301, addIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                views.setOnClickPendingIntent(R.id.widget_deadlines_btn_add, addPendingIntent);

                Intent itemClickIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("organizador://app?action=tasks"));
                itemClickIntent.setComponent(mainComp);
                itemClickIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent itemClickPendingIntent = PendingIntent.getActivity(
                        context, 302, itemClickIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                views.setPendingIntentTemplate(R.id.widget_deadlines_list, itemClickPendingIntent);

                appWidgetManager.updateAppWidget(appWidgetId, views);
                appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_deadlines_list);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
