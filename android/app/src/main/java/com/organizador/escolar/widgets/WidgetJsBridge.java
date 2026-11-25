package com.organizador.escolar.widgets;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.webkit.JavascriptInterface;

import androidx.core.content.ContextCompat;

import com.organizador.escolar.notifications.NotificationHelper;

/**
 * Interfaz JavaScript nativa unificada para el WebView Android:
 * - Sincronización de Widgets
 * - Tema dinámico de barras del sistema
 * - Enlaces externos (Ko-fi, etc.)
 * - Guardado nativo de archivos (respaldos JSON y fotos de galería)
 * - Notificaciones nativas (inmediatas y programadas)
 * - Salida limpia de la app
 */
public class WidgetJsBridge {

    public interface NativeHostActions {
        void onThemeChanged(boolean isDark);
        void openExternalUrl(String url);
        boolean saveTextFile(String filename, String mimeType, String content);
        boolean saveBase64File(String filename, String mimeType, String base64Data);
        void requestNotificationPermission();
        void exitApp();
    }

    private final Context context;
    private final NativeHostActions hostActions;

    public WidgetJsBridge(Context context, NativeHostActions hostActions) {
        this.context = context.getApplicationContext();
        this.hostActions = hostActions;
    }

    @JavascriptInterface
    public void updateWidgets(String jsonPayload) {
        if (jsonPayload != null && !jsonPayload.isEmpty()) {
            WidgetDataSync.savePayload(context, jsonPayload);
            WidgetDataSync.updateAllWidgets(context);
        }
    }

    @JavascriptInterface
    public String getWidgetData() {
        String data = WidgetDataSync.getPayload(context);
        return data != null ? data : "";
    }

    @JavascriptInterface
    public void setSystemBarsTheme(boolean isDark) {
        if (hostActions != null) {
            hostActions.onThemeChanged(isDark);
        }
    }

    @JavascriptInterface
    public void openExternalUrl(String url) {
        if (hostActions != null && url != null && !url.isEmpty()) {
            hostActions.openExternalUrl(url);
        }
    }

    @JavascriptInterface
    public boolean saveTextFile(String filename, String mimeType, String content) {
        if (hostActions == null || filename == null || content == null) return false;
        return hostActions.saveTextFile(filename, mimeType != null ? mimeType : "application/json", content);
    }

    @JavascriptInterface
    public boolean saveBase64File(String filename, String mimeType, String base64Data) {
        if (hostActions == null || filename == null || base64Data == null) return false;
        return hostActions.saveBase64File(filename, mimeType != null ? mimeType : "image/jpeg", base64Data);
    }

    @JavascriptInterface
    public boolean hasNotificationPermission() {
        if (Build.VERSION.SDK_INT < 33) return true;
        return ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
    }

    @JavascriptInterface
    public void requestNotificationPermission() {
        if (hostActions != null) {
            hostActions.requestNotificationPermission();
        }
    }

    @JavascriptInterface
    public void showNativeNotification(int id, String title, String body, String action) {
        NotificationHelper.showNotification(context, id, title, body, action);
    }

    @JavascriptInterface
    public void scheduleNativeNotification(int id, String title, String body, long triggerAtMs, String action) {
        NotificationHelper.scheduleNotification(context, id, title, body, triggerAtMs, action);
    }

    @JavascriptInterface
    public void cancelNativeNotification(int id) {
        NotificationHelper.cancelNotification(context, id);
    }

    @JavascriptInterface
    public void cancelAllNativeNotifications() {
        NotificationHelper.cancelAll(context);
    }

    @JavascriptInterface
    public void exitApp() {
        if (hostActions != null) {
            hostActions.exitApp();
        }
    }
}
