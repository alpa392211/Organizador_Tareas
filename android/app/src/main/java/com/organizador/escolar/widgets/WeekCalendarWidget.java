package com.organizador.escolar.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import androidx.core.content.ContextCompat;

import com.organizador.escolar.MainActivity;
import com.organizador.escolar.R;

import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Widget 2: Horario Semanal y Calendario (WeekCalendarWidget)
 * - Muestra las materias reales de cada día (Lunes a Domingo), abreviadas para mostrar mínimo 4 materias por día (+N si hay más).
 * - Modo claro y oscuro automático según el tema del teléfono (values/ y values-night/).
 * - Resalta el día actual y muestra resumen de clases de hoy o próxima entrega.
 */
public class WeekCalendarWidget extends AppWidgetProvider {

    private static final String[] MONTHS_ES = {
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    };

    private static final String[] WEEKDAYS_SHORT = {
        "Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"
    };

    private static final String[] DAY_LETTERS = { "L", "M", "M", "J", "V", "S", "D" };

    private static final int[] DAY_COL_IDS = {
        R.id.day_col_0, R.id.day_col_1, R.id.day_col_2, R.id.day_col_3,
        R.id.day_col_4, R.id.day_col_5, R.id.day_col_6
    };

    private static final int[] DAY_NAME_IDS = {
        R.id.day_name_0, R.id.day_name_1, R.id.day_name_2, R.id.day_name_3,
        R.id.day_name_4, R.id.day_name_5, R.id.day_name_6
    };

    private static final int[] DAY_NUM_IDS = {
        R.id.day_num_0, R.id.day_num_1, R.id.day_num_2, R.id.day_num_3,
        R.id.day_num_4, R.id.day_num_5, R.id.day_num_6
    };

    private static final int[][] DAY_SUB_IDS = {
        { R.id.day_sub_0_0, R.id.day_sub_0_1, R.id.day_sub_0_2, R.id.day_sub_0_3 },
        { R.id.day_sub_1_0, R.id.day_sub_1_1, R.id.day_sub_1_2, R.id.day_sub_1_3 },
        { R.id.day_sub_2_0, R.id.day_sub_2_1, R.id.day_sub_2_2, R.id.day_sub_2_3 },
        { R.id.day_sub_3_0, R.id.day_sub_3_1, R.id.day_sub_3_2, R.id.day_sub_3_3 },
        { R.id.day_sub_4_0, R.id.day_sub_4_1, R.id.day_sub_4_2, R.id.day_sub_4_3 },
        { R.id.day_sub_5_0, R.id.day_sub_5_1, R.id.day_sub_5_2, R.id.day_sub_5_3 },
        { R.id.day_sub_6_0, R.id.day_sub_6_1, R.id.day_sub_6_2, R.id.day_sub_6_3 }
    };

    private static final int[] DAY_MORE_IDS = {
        R.id.day_more_0, R.id.day_more_1, R.id.day_more_2, R.id.day_more_3,
        R.id.day_more_4, R.id.day_more_5, R.id.day_more_6
    };

    private static final int[] DAY_DOTS_IDS = {
        R.id.day_dots_0, R.id.day_dots_1, R.id.day_dots_2, R.id.day_dots_3,
        R.id.day_dots_4, R.id.day_dots_5, R.id.day_dots_6
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateWidgets(context, appWidgetManager, appWidgetIds);
    }

    public static void updateWidgets(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        if (context == null || appWidgetManager == null || appWidgetIds == null) return;

        JSONObject payload = WidgetDataSync.getParsedPayload(context);

        Calendar calNow = Calendar.getInstance();
        String defaultMonth = MONTHS_ES[calNow.get(Calendar.MONTH)] + " " + calNow.get(Calendar.YEAR);
        String todayHeader = "Hoy: " + WEEKDAYS_SHORT[calNow.get(Calendar.DAY_OF_WEEK) - 1]
                + " " + calNow.get(Calendar.DAY_OF_MONTH);

        String monthTitle = defaultMonth;
        String instName = "Organizador";
        String summaryText = "Agrega tus materias con días para ver tu horario aquí";
        int pendingTotal = 0;
        JSONArray weekDays = null;

        if (payload != null) {
            JSONObject instObj = payload.optJSONObject("institution");
            if (instObj != null) {
                instName = instObj.optString("name", "Organizador");
            }

            JSONObject calObj = payload.optJSONObject("weekCalendar");
            if (calObj != null) {
                monthTitle = calObj.optString("monthTitle", defaultMonth);
                weekDays = calObj.optJSONArray("weekDays");
                String todaySub = calObj.optString("todaySubjectsSummary", "");
                if (!todaySub.isEmpty()) {
                    summaryText = todaySub;
                }
            }

            JSONObject quickTask = payload.optJSONObject("quickTask");
            if (quickTask != null) {
                pendingTotal = quickTask.has("pendingTotal")
                        ? quickTask.optInt("pendingTotal", 0)
                        : quickTask.optInt("pendingTodayCount", 0);
            }

            JSONArray deadlines = payload.optJSONArray("deadlines");
            if (deadlines != null && deadlines.length() > 0 && summaryText.startsWith("Agrega")) {
                JSONObject first = deadlines.optJSONObject(0);
                if (first != null) {
                    String tTitle = first.optString("title", "");
                    String tDate = first.optString("dueDate", "");
                    if (!tTitle.isEmpty()) {
                        summaryText = "Próxima entrega: " + tTitle + (tDate.isEmpty() ? "" : " (" + tDate + ")");
                    }
                }
            }
        }

        String subtitle = todayHeader + " · "
                + (pendingTotal == 0 ? "Sin pendientes"
                : (pendingTotal == 1 ? "1 pendiente" : pendingTotal + " pendientes"));

        int colorWhite = ContextCompat.getColor(context, R.color.widget_text_white);
        int colorDotTask = ContextCompat.getColor(context, R.color.dot_task);
        int colorDotReminder = ContextCompat.getColor(context, R.color.dot_reminder);
        int colorAccent = ContextCompat.getColor(context, R.color.dot_class);

        Calendar weekStart = (Calendar) calNow.clone();
        int dow = weekStart.get(Calendar.DAY_OF_WEEK);
        int offsetToMonday = (dow == Calendar.SUNDAY) ? -6 : (Calendar.MONDAY - dow);
        weekStart.add(Calendar.DAY_OF_MONTH, offsetToMonday);
        int todayYear = calNow.get(Calendar.YEAR);
        int todayDayOfYear = calNow.get(Calendar.DAY_OF_YEAR);

        ComponentName mainComp = new ComponentName(context, MainActivity.class);

        for (int appWidgetId : appWidgetIds) {
            try {
                RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_week_calendar);

                views.setTextViewText(R.id.widget_week_cal_month_title, monthTitle);
                views.setTextViewText(R.id.widget_week_cal_subtitle, subtitle);
                views.setTextViewText(R.id.widget_week_cal_inst_badge, instName);
                views.setTextViewText(R.id.widget_week_cal_summary, summaryText);

                for (int i = 0; i < 7; i++) {
                    String dayName;
                    int dayNum;
                    boolean isToday;
                    boolean hasTasks = false;
                    boolean hasReminders = false;
                    JSONArray daySubjects = null;

                    if (weekDays != null && i < weekDays.length() && weekDays.optJSONObject(i) != null) {
                        JSONObject day = weekDays.optJSONObject(i);
                        String rawDayName = day.optString("dayName", DAY_LETTERS[i]);
                        dayName = rawDayName.isEmpty() ? DAY_LETTERS[i] : rawDayName.substring(0, 1);
                        dayNum = day.optInt("dayNumber", i + 1);
                        isToday = day.optBoolean("isToday", false);
                        hasTasks = day.optBoolean("hasTasks", false);
                        hasReminders = day.optBoolean("hasReminders", false);
                        daySubjects = day.optJSONArray("subjects");
                    } else {
                        Calendar cellCal = (Calendar) weekStart.clone();
                        cellCal.add(Calendar.DAY_OF_MONTH, i);
                        dayName = DAY_LETTERS[i];
                        dayNum = cellCal.get(Calendar.DAY_OF_MONTH);
                        isToday = (cellCal.get(Calendar.YEAR) == todayYear
                                && cellCal.get(Calendar.DAY_OF_YEAR) == todayDayOfYear);
                    }

                    int subjectCount = daySubjects != null ? daySubjects.length() : 0;
                    boolean hasAnyActivity = subjectCount > 0 || hasTasks || hasReminders;

                    views.setTextViewText(DAY_NAME_IDS[i], dayName);
                    views.setTextViewText(DAY_NUM_IDS[i], String.valueOf(dayNum));

                    if (isToday) {
                        views.setInt(DAY_COL_IDS[i], "setBackgroundResource", R.drawable.widget_day_cell_today);
                        views.setTextColor(DAY_NAME_IDS[i], colorWhite);
                        views.setTextColor(DAY_NUM_IDS[i], colorWhite);
                    } else if (hasAnyActivity) {
                        views.setInt(DAY_COL_IDS[i], "setBackgroundResource", R.drawable.widget_day_cell_active);
                    } else {
                        views.setInt(DAY_COL_IDS[i], "setBackgroundResource", R.drawable.widget_day_cell);
                    }

                    // Poblar hasta 4 materias visibles por día (+N si hay más de 4)
                    if (subjectCount == 0) {
                        views.setViewVisibility(DAY_SUB_IDS[i][0], View.VISIBLE);
                        views.setTextViewText(DAY_SUB_IDS[i][0], "—");
                        if (isToday) {
                            views.setTextColor(DAY_SUB_IDS[i][0], colorWhite);
                            views.setInt(DAY_SUB_IDS[i][0], "setBackgroundResource", 0);
                        }
                        for (int s = 1; s < 4; s++) {
                            views.setViewVisibility(DAY_SUB_IDS[i][s], View.GONE);
                        }
                        views.setViewVisibility(DAY_MORE_IDS[i], View.GONE);
                    } else {
                        int visibleSlots = Math.min(4, subjectCount);
                        for (int s = 0; s < 4; s++) {
                            if (s < visibleSlots) {
                                JSONObject subObj = daySubjects.optJSONObject(s);
                                String label = subObj != null
                                        ? subObj.optString("shortName", subObj.optString("name", "Mat"))
                                        : "Mat";
                                if (label.length() > 5) label = label.substring(0, 4) + ".";
                                String colorHex = subObj != null ? subObj.optString("color", "#4F46E5") : "#4F46E5";
                                int subColor = colorAccent;
                                try {
                                    subColor = Color.parseColor(colorHex);
                                } catch (Exception ignored) {}

                                views.setViewVisibility(DAY_SUB_IDS[i][s], View.VISIBLE);
                                views.setTextViewText(DAY_SUB_IDS[i][s], label);
                                views.setInt(DAY_SUB_IDS[i][s], "setBackgroundColor", subColor);
                                views.setTextColor(DAY_SUB_IDS[i][s], colorWhite);
                            } else {
                                views.setViewVisibility(DAY_SUB_IDS[i][s], View.GONE);
                            }
                        }

                        if (subjectCount > 4) {
                            views.setViewVisibility(DAY_MORE_IDS[i], View.VISIBLE);
                            views.setTextViewText(DAY_MORE_IDS[i], "+" + (subjectCount - 4));
                            if (isToday) views.setTextColor(DAY_MORE_IDS[i], colorWhite);
                        } else {
                            views.setViewVisibility(DAY_MORE_IDS[i], View.GONE);
                        }
                    }

                    // Puntos de entrega / recordatorio
                    StringBuilder dots = new StringBuilder();
                    if (hasTasks) dots.append("●");
                    if (hasReminders) dots.append("●");
                    views.setTextViewText(DAY_DOTS_IDS[i], dots.length() > 0 ? dots.toString() : " ");
                    if (isToday) {
                        views.setTextColor(DAY_DOTS_IDS[i], colorWhite);
                    } else if (hasTasks) {
                        views.setTextColor(DAY_DOTS_IDS[i], colorDotTask);
                    } else if (hasReminders) {
                        views.setTextColor(DAY_DOTS_IDS[i], colorDotReminder);
                    }
                }

                Intent calIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("organizador://app?action=open_calendar"));
                calIntent.setComponent(mainComp);
                calIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent calPendingIntent = PendingIntent.getActivity(
                        context, 201, calIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

                views.setOnClickPendingIntent(R.id.widget_week_cal_btn_open, calPendingIntent);
                views.setOnClickPendingIntent(R.id.widget_week_calendar_root, calPendingIntent);

                appWidgetManager.updateAppWidget(appWidgetId, views);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
