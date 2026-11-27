package com.organizador.escolar.notifications;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import com.organizador.escolar.MainActivity;
import com.organizador.escolar.R;

import java.util.HashSet;
import java.util.Set;

/**
 * Helper nativo para notificaciones locales inmediatas y programadas con AlarmManager
 * en Android (con canales v2 por tipo y modo de sonido configurable).
 */
public class NotificationHelper {

    public static final String LEGACY_CHANNEL_ID = "organizador_reminders";
    public static final String CHANNEL_CLASS_ID  = "organizador_reminders_class_v2";
    public static final String CHANNEL_TASK_ID   = "organizador_reminders_task_v2";
    public static final String CHANNEL_ALERT_ID  = "organizador_reminders_alert_v2";
    public static final String CHANNEL_SYSTEM_ID = "organizador_reminders_system_v2";
    public static final String CHANNEL_SILENT_ID = "organizador_reminders_silent_v2";

    public static final String MODE_APP    = "app";
    public static final String MODE_SYSTEM = "system";
    public static final String MODE_SILENT = "silent";

    private static final String PREFS_ALARMS = "org_escolar_scheduled_alarms";
    private static final String KEY_IDS = "alarm_ids";
    private static final String PREFS_NOTIF = "organizador_notif_prefs";
    private static final String KEY_SOUND_MODE = "sound_mode";

    public static final String EXTRA_ID = "notif_id";
    public static final String EXTRA_TITLE = "notif_title";
    public static final String EXTRA_BODY = "notif_body";
    public static final String EXTRA_ACTION = "notif_action";

    private static Uri rawSoundUri(Context context, int rawResId) {
        return Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/" + rawResId);
    }

    public static String normalizeSoundMode(String mode) {
        if (MODE_SYSTEM.equalsIgnoreCase(mode)) return MODE_SYSTEM;
        if (MODE_SILENT.equalsIgnoreCase(mode)) return MODE_SILENT;
        return MODE_APP;
    }

    public static void setSoundMode(Context context, String mode) {
        if (context == null) return;
        String safe = normalizeSoundMode(mode);
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NOTIF, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_SOUND_MODE, safe).apply();
        ensureChannel(context);
    }

    public static String getSoundMode(Context context) {
        if (context == null) return MODE_APP;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NOTIF, Context.MODE_PRIVATE);
        return normalizeSoundMode(prefs.getString(KEY_SOUND_MODE, MODE_APP));
    }

    private static int resolveRawResForAction(String action) {
        if ("subjects".equalsIgnoreCase(action) || "class".equalsIgnoreCase(action)) {
            return R.raw.notif_class;
        }
        if ("alert".equalsIgnoreCase(action) || "test".equalsIgnoreCase(action) || "urgent".equalsIgnoreCase(action)) {
            return R.raw.notif_alert;
        }
        return R.raw.notif_task;
    }

    private static String resolveChannelId(Context context, String action) {
        String mode = getSoundMode(context);
        if (MODE_SILENT.equals(mode)) return CHANNEL_SILENT_ID;
        if (MODE_SYSTEM.equals(mode)) return CHANNEL_SYSTEM_ID;
        if ("subjects".equalsIgnoreCase(action) || "class".equalsIgnoreCase(action)) {
            return CHANNEL_CLASS_ID;
        }
        if ("alert".equalsIgnoreCase(action) || "test".equalsIgnoreCase(action) || "urgent".equalsIgnoreCase(action)) {
            return CHANNEL_ALERT_ID;
        }
        return CHANNEL_TASK_ID;
    }

    public static void ensureChannel(Context context) {
        if (context == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        // Eliminar canal v1 legado para evitar usar su sonido bloqueado
        if (nm.getNotificationChannel(LEGACY_CHANNEL_ID) != null) {
            nm.deleteNotificationChannel(LEGACY_CHANNEL_ID);
        }

        AudioAttributes audioAttrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();

        createChannelIfMissing(nm, CHANNEL_CLASS_ID, "Recordatorios de Clases",
                "Avisos previos a tus clases con tono de Organizador.",
                NotificationManager.IMPORTANCE_HIGH, rawSoundUri(context, R.raw.notif_class), audioAttrs, true);

        createChannelIfMissing(nm, CHANNEL_TASK_ID, "Recordatorios de Tareas y Notas",
                "Fechas límite y recordatorios de notas con tono de Organizador.",
                NotificationManager.IMPORTANCE_HIGH, rawSoundUri(context, R.raw.notif_task), audioAttrs, true);

        createChannelIfMissing(nm, CHANNEL_ALERT_ID, "Alertas Prioritarias",
                "Avisos urgentes y pruebas de sonido de Organizador.",
                NotificationManager.IMPORTANCE_HIGH, rawSoundUri(context, R.raw.notif_alert), audioAttrs, true);

        createChannelIfMissing(nm, CHANNEL_SYSTEM_ID, "Recordatorios (Sonido del Sistema)",
                "Notificaciones usando el tono predeterminado del sistema Android.",
                NotificationManager.IMPORTANCE_HIGH, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), audioAttrs, true);

        createChannelIfMissing(nm, CHANNEL_SILENT_ID, "Recordatorios Silenciosos",
                "Avisos visuales discretos sin sonido.",
                NotificationManager.IMPORTANCE_DEFAULT, null, null, false);
    }

    private static void createChannelIfMissing(
            NotificationManager nm,
            String id,
            String name,
            String desc,
            int importance,
            Uri soundUri,
            AudioAttributes audioAttrs,
            boolean vibrate
    ) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        if (nm.getNotificationChannel(id) != null) return;
        NotificationChannel ch = new NotificationChannel(id, name, importance);
        ch.setDescription(desc);
        ch.enableVibration(vibrate);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        if (soundUri != null && audioAttrs != null) {
            ch.setSound(soundUri, audioAttrs);
        } else {
            ch.setSound(null, null);
        }
        nm.createNotificationChannel(ch);
    }

    public static void showNotification(Context context, int id, String title, String body, String action) {
        if (context == null) return;
        ensureChannel(context);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        String safeAction = (action != null && !action.isEmpty()) ? action : "tasks";
        String channelId = resolveChannelId(context, safeAction);
        String mode = getSoundMode(context);

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
                ? new Notification.Builder(context, channelId)
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
            if (MODE_SILENT.equals(mode)) {
                builder.setPriority(Notification.PRIORITY_DEFAULT);
                builder.setSound(null);
            } else if (MODE_SYSTEM.equals(mode)) {
                builder.setPriority(Notification.PRIORITY_HIGH);
                builder.setDefaults(Notification.DEFAULT_ALL);
            } else {
                builder.setPriority(Notification.PRIORITY_HIGH);
                builder.setSound(rawSoundUri(context, resolveRawResForAction(safeAction)));
                builder.setDefaults(Notification.DEFAULT_VIBRATE | Notification.DEFAULT_LIGHTS);
            }
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
