package com.organizador.escolar.notifications;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;

import com.organizador.escolar.MainActivity;
import com.organizador.escolar.R;

import java.util.HashSet;
import java.util.Set;

/**
 * Helper nativo para notificaciones locales inmediatas y programadas con AlarmManager
 * en Android (tareas y recordatorios de notas, incluso con la app cerrada).
 */
public class NotificationHelper {

    public static final String CHANNEL_ID = "organizador_reminders";
    public static final String CHANNEL_NAME = "Recordatorios de Clases, Tareas y Notas";
    private static final String PREFS_ALARMS = "org_escolar_scheduled_alarms";
    private static final String KEY_IDS = "alarm_ids";

    public static final String EXTRA_ID = "notif_id";
    public static final String EXTRA_TITLE = "notif_title";
    public static final String EXTRA_BODY = "notif_body";
    public static final String EXTRA_ACTION = "notif_action";

    public static void ensureChannel(Context context) {
        if (context == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        NotificationChannel existing = nm.getNotificationChannel(CHANNEL_ID);
        if (existing != null) return;

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Avisos antes de tus materias, fechas límite de tareas y recordatorios de notas.");
        channel.enableVibration(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(channel);
    }

    public static void showNotification(Context context, int id, String title, String body, String action) {
        if (context == null) return;
        ensureChannel(context);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        String safeAction = (action != null && !action.isEmpty()) ? action : "tasks";
        Intent openIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("organizador://app?action=" + Uri.encode(safeAction)));
        openIntent.setClass(context, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                Math.abs(id) + 1000,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ? new Notification.Builder(context, CHANNEL_ID)
                : new Notification.Builder(context);

        builder.setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title != null && !title.isEmpty() ? title : "Organizador")
                .setContentText(body != null ? body : "")
                .setStyle(new Notification.BigTextStyle().bigText(body != null ? body : ""))
                .setCategory(Notification.CATEGORY_REMINDER)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(contentIntent);

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            builder.setPriority(Notification.PRIORITY_HIGH);
            builder.setDefaults(Notification.DEFAULT_ALL);
        }

        try {
            nm.notify(id, builder.build());
        } catch (SecurityException ignored) {
            // El usuario denegó POST_NOTIFICATIONS en Android 13+
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void scheduleNotification(Context context, int id, String title, String body, long triggerAtMs, String action) {
        if (context == null) return;
        ensureChannel(context);

        long now = System.currentTimeMillis();
        if (triggerAtMs <= now + 1500L) {
            showNotification(context, id, title, body, action);
            return;
        }

        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(context, ReminderReceiver.class);
        intent.putExtra(EXTRA_ID, id);
        intent.putExtra(EXTRA_TITLE, title);
        intent.putExtra(EXTRA_BODY, body);
        intent.putExtra(EXTRA_ACTION, action != null ? action : "tasks");

        PendingIntent pi = PendingIntent.getBroadcast(
                context,
                id,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        try {
            boolean canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();
            if (canExact) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pi);
            } else {
                // Fallback de alta precisión con AlarmClock cuando SCHEDULE_EXACT_ALARM no está activo
                Intent showIntent = new Intent(context, MainActivity.class);
                PendingIntent showPi = PendingIntent.getActivity(
                        context,
                        Math.abs(id) + 2000,
                        showIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerAtMs, showPi), pi);
            }
            rememberAlarmId(context, id);
        } catch (SecurityException se) {
            try {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pi);
                rememberAlarmId(context, id);
            } catch (Exception ignored) {}
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void cancelNotification(Context context, int id) {
        if (context == null) return;
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            Intent intent = new Intent(context, ReminderReceiver.class);
            PendingIntent pi = PendingIntent.getBroadcast(
                    context,
                    id,
                    intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );
            if (am != null && pi != null) {
                am.cancel(pi);
                pi.cancel();
            }
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(id);
            }
            forgetAlarmId(context, id);
        } catch (Exception ignored) {}
    }

    public static void cancelAll(Context context) {
        if (context == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_ALARMS, Context.MODE_PRIVATE);
            Set<String> ids = new HashSet<>(prefs.getStringSet(KEY_IDS, new HashSet<>()));
            for (String s : ids) {
                try {
                    cancelNotification(context, Integer.parseInt(s));
                } catch (Exception ignored) {}
            }
            prefs.edit().remove(KEY_IDS).apply();
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancelAll();
        } catch (Exception ignored) {}
    }

    private static void rememberAlarmId(Context context, int id) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_ALARMS, Context.MODE_PRIVATE);
            Set<String> ids = new HashSet<>(prefs.getStringSet(KEY_IDS, new HashSet<>()));
            ids.add(String.valueOf(id));
            prefs.edit().putStringSet(KEY_IDS, ids).apply();
        } catch (Exception ignored) {}
    }

    private static void forgetAlarmId(Context context, int id) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_ALARMS, Context.MODE_PRIVATE);
            Set<String> ids = new HashSet<>(prefs.getStringSet(KEY_IDS, new HashSet<>()));
            if (ids.remove(String.valueOf(id))) {
                prefs.edit().putStringSet(KEY_IDS, ids).apply();
            }
        } catch (Exception ignored) {}
    }
}
