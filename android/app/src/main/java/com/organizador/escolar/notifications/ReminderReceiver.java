package com.organizador.escolar.notifications;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * BroadcastReceiver disparado por AlarmManager para mostrar notificaciones
 * de tareas y notas incluso con la app en segundo plano o cerrada.
 */
public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;
        int id = intent.getIntExtra(NotificationHelper.EXTRA_ID, (int) (System.currentTimeMillis() & 0x7fffffff));
        String title = intent.getStringExtra(NotificationHelper.EXTRA_TITLE);
        String body = intent.getStringExtra(NotificationHelper.EXTRA_BODY);
        String action = intent.getStringExtra(NotificationHelper.EXTRA_ACTION);
        NotificationHelper.showNotification(context, id, title, body, action);
    }
}
