package com.organizador.escolar.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Widget 2: Calendario General de 1 o 2 Semanas (WeekCalendarWidget)
 * Widget redimensionable de escritorio que muestra:
 * - Vista de cuadrícula de 1 o 2 semanas.
 * - Días marcados con clases, entregas de tareas o recordatorios de notas.
 * - Resaltado visual del día actual (Hoy).
 * - Botón de acceso directo para abrir el calendario mensual completo.
 */
public class WeekCalendarWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateWidgets(context, appWidgetManager, appWidgetIds);
    }

    public static void updateWidgets(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        JSONObject payload = WidgetDataSync.getParsedPayload(context);

        String monthTitle = "Noviembre 2026";
        String instName = "UNAM";
        JSONArray weekDays = null;

        if (payload != null) {
            JSONObject instObj = payload.optJSONObject("institution");
            if (instObj != null) {
                instName = instObj.optString("name", "UNAM");
            }

            JSONObject calObj = payload.optJSONObject("weekCalendar");
            if (calObj != null) {
                monthTitle = calObj.optString("monthTitle", "Noviembre 2026");
                weekDays = calObj.optJSONArray("weekDays");
            }
        }

        for (int appWidgetId : appWidgetIds) {
            String packageName = context.getPackageName();
            RemoteViews views = new RemoteViews(packageName,
                    context.getResources().getIdentifier("widget_week_calendar", "layout", packageName));

            int idTitle = context.getResources().getIdentifier("widget_week_cal_month_title", "id", packageName);
            int idBadge = context.getResources().getIdentifier("widget_week_cal_inst_badge", "id", packageName);
            int idBtnOpen = context.getResources().getIdentifier("widget_week_cal_btn_open", "id", packageName);
            int idRoot = context.getResources().getIdentifier("widget_week_calendar_root", "id", packageName);

            if (idTitle != 0) views.setTextViewText(idTitle, monthTitle);
            if (idBadge != 0) views.setTextViewText(idBadge, instName);

            // Poblar columnas de días (hasta 14 días para 2 semanas)
            if (weekDays != null) {
                int count = Math.min(14, weekDays.length());
                for (int i = 0; i < count; i++) {
                    JSONObject day = weekDays.optJSONObject(i);
                    if (day == null) continue;

                    String dayName = day.optString("dayName", "").substring(0, 1);
                    int dayNum = day.optInt("dayNumber", i + 1);
                    boolean isToday = day.optBoolean("isToday", false);
                    boolean hasClasses = day.optBoolean("hasClasses", false);
                    boolean hasTasks = day.optBoolean("hasTasks", false);
                    boolean hasReminders = day.optBoolean("hasReminders", false);

                    int idName = context.getResources().getIdentifier("day_name_" + i, "id", packageName);
                    int idNum = context.getResources().getIdentifier("day_num_" + i, "id", packageName);
                    int idDots = context.getResources().getIdentifier("day_dots_" + i, "id", packageName);

                    if (idName != 0) views.setTextViewText(idName, dayName);
                    if (idNum != 0) {
                        views.setTextViewText(idNum, String.valueOf(dayNum));
                        if (isToday) {
                            int bgToday = context.getResources().getIdentifier("widget_circle_today", "drawable", packageName);
                            if (bgToday != 0) {
                                views.setInt(idNum, "setBackgroundResource", bgToday);
                                views.setTextColor(idNum, 0xFFFFFFFF);
                            }
                        }
                    }

                    if (idDots != 0) {
                        StringBuilder dots = new StringBuilder();
                        if (hasClasses) dots.append("•");
                        if (hasTasks) dots.append("•");
                        if (hasReminders) dots.append("•");
                        views.setTextViewText(idDots, dots.length() > 0 ? dots.toString() : " ");
                    }
                }
            }

            // PendingIntent para abrir el Calendario Mensual al tocar "Ver Mes" o el fondo
            Intent calIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("organizador://app?action=open_calendar"));
            calIntent.setPackage(packageName);
            calIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent calPendingIntent = PendingIntent.getActivity(
                    context, 201, calIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            if (idBtnOpen != 0) views.setOnClickPendingIntent(idBtnOpen, calPendingIntent);
            if (idRoot != 0) views.setOnClickPendingIntent(idRoot, calPendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
