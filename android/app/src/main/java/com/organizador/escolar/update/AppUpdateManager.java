package com.organizador.escolar.update;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.webkit.WebView;

import androidx.core.content.FileProvider;

import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Gestor nativo de comprobación, descarga con barra de progreso, verificación SHA-256
 * e instalación de nuevas versiones APK alojadas en GitHub.
 */
public class AppUpdateManager {

    public static final String MANIFEST_URL =
            "https://raw.githubusercontent.com/alpa392211/Organizador_Tareas/main/version.json";

    public static String getAppVersionInfoJson(Context context) {
        JSONObject out = new JSONObject();
        try {
            PackageInfo pi = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            long code = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) ? pi.getLongVersionCode() : pi.versionCode;
            boolean canInstall = Build.VERSION.SDK_INT < Build.VERSION_CODES.O
                    || context.getPackageManager().canRequestPackageInstalls();
            out.put("versionCode", code);
            out.put("versionName", pi.versionName != null ? pi.versionName : "1.7.0");
            out.put("canRequestPackageInstalls", canInstall);
        } catch (Exception e) {
            try {
                out.put("versionCode", 170);
                out.put("versionName", "1.7.0");
                out.put("canRequestPackageInstalls", true);
            } catch (Exception ignored) {}
        }
        return out.toString();
    }

    public static void checkForUpdateAsync(Activity activity, WebView webView) {
        if (activity == null || webView == null) return;
        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(MANIFEST_URL + "?t=" + System.currentTimeMillis());
                conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);
                conn.setUseCaches(false);
                conn.setRequestProperty("Accept", "application/json");
                int status = conn.getResponseCode();
                if (status < 200 || status >= 300) {
                    dispatchJs(activity, webView, "window.AppUpdater?.onNativeError?.(" + JSONObject.quote("HTTP " + status) + ");");
                    return;
                }
                StringBuilder sb = new StringBuilder();
                try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line).append('\n');
                }
                JSONObject remote = new JSONObject(sb.toString());
                JSONObject current = new JSONObject(getAppVersionInfoJson(activity));
                long currentCode = current.optLong("versionCode", 170);
                long remoteCode = remote.optLong("versionCode", currentCode);

                remote.put("currentVersionCode", currentCode);
                remote.put("currentVersionName", current.optString("versionName", "1.7.0"));
                remote.put("available", remoteCode > currentCode);
                dispatchJs(activity, webView, "window.AppUpdater?.onNativeCheckResult?.(" + remote.toString() + ");");
            } catch (Exception e) {
                String msg = e.getMessage() != null ? e.getMessage() : "Error de red";
                dispatchJs(activity, webView, "window.AppUpdater?.onNativeError?.(" + JSONObject.quote(msg) + ");");
            } finally {
                if (conn != null) conn.disconnect();
            }
        }).start();
    }

    public static void downloadAndInstallAsync(Activity activity, WebView webView, String apkUrl, String expectedSha256) {
        if (activity == null || webView == null || apkUrl == null || apkUrl.isEmpty()) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !activity.getPackageManager().canRequestPackageInstalls()) {
            dispatchJs(activity, webView, "window.AppUpdater?.onNativeNeedsPermission?.();");
            return;
        }

        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                File cacheBase = activity.getExternalCacheDir();
                if (cacheBase == null) cacheBase = activity.getCacheDir();
                File updatesDir = new File(cacheBase, "updates");
                if (!updatesDir.exists()) updatesDir.mkdirs();
                File outFile = new File(updatesDir, "Organizador-update.apk");
                if (outFile.exists()) outFile.delete();

                URL url = new URL(apkUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setConnectTimeout(12000);
                conn.setReadTimeout(20000);
                int status = conn.getResponseCode();
                if (status < 200 || status >= 300) {
                    dispatchJs(activity, webView, "window.AppUpdater?.onNativeError?.(" + JSONObject.quote("Descarga fallida (HTTP " + status + ")") + ");");
                    return;
                }

                long total = conn.getContentLengthLong();
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] buf = new byte[16384];
                long downloaded = 0;
                int lastPct = -1;

                try (InputStream is = new BufferedInputStream(conn.getInputStream());
                     FileOutputStream fos = new FileOutputStream(outFile)) {
                    int n;
                    while ((n = is.read(buf)) != -1) {
                        fos.write(buf, 0, n);
                        digest.update(buf, 0, n);
                        downloaded += n;
                        if (total > 0) {
                            int pct = (int) Math.min(100, (downloaded * 100L) / total);
                            if (pct != lastPct && (pct % 4 == 0 || pct == 100)) {
                                lastPct = pct;
                                dispatchJs(activity, webView, "window.AppUpdater?.onNativeProgress?.(" + pct + ");");
                            }
                        }
                    }
                    fos.getFD().sync();
                }

                byte[] hashBytes = digest.digest();
                StringBuilder hex = new StringBuilder();
                for (byte b : hashBytes) hex.append(String.format("%02x", b));
                String actualSha = hex.toString();

                if (expectedSha256 != null && !expectedSha256.trim().isEmpty()) {
                    if (!expectedSha256.trim().equalsIgnoreCase(actualSha)) {
                        outFile.delete();
                        dispatchJs(activity, webView, "window.AppUpdater?.onNativeError?.(" + JSONObject.quote("Verificación SHA-256 inválida. Archivo descartado por seguridad.") + ");");
                        return;
                    }
                }

                dispatchJs(activity, webView, "window.AppUpdater?.onNativeProgress?.(100);");

                Uri contentUri = FileProvider.getUriForFile(
                        activity,
                        activity.getPackageName() + ".fileprovider",
                        outFile
                );
                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(contentUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);

                activity.runOnUiThread(() -> {
                    try {
                        activity.startActivity(installIntent);
                    } catch (Exception e) {
                        dispatchJs(activity, webView, "window.AppUpdater?.onNativeError?.(" + JSONObject.quote("No se pudo abrir el instalador de paquetes.") + ");");
                    }
                });
            } catch (Exception e) {
                String msg = e.getMessage() != null ? e.getMessage() : "Error al descargar la actualización";
                dispatchJs(activity, webView, "window.AppUpdater?.onNativeError?.(" + JSONObject.quote(msg) + ");");
            } finally {
                if (conn != null) conn.disconnect();
            }
        }).start();
    }

    public static void openInstallPermissionSettings(Activity activity) {
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    Intent intent = new Intent(
                            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                            Uri.parse("package:" + activity.getPackageName())
                    );
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(intent);
                }
            } catch (Exception ignored) {}
        });
    }

    private static void dispatchJs(Activity activity, WebView webView, String script) {
        if (activity == null || webView == null) return;
        activity.runOnUiThread(() -> {
            try {
                webView.evaluateJavascript(script, null);
            } catch (Exception ignored) {}
        });
    }
}
