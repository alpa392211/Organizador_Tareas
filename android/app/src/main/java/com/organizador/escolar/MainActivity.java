package com.organizador.escolar;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Message;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;

import com.organizador.escolar.notifications.NotificationHelper;
import com.organizador.escolar.update.AppUpdateManager;
import com.organizador.escolar.widgets.WidgetDataSync;
import com.organizador.escolar.widgets.WidgetJsBridge;

import org.json.JSONObject;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * MainActivity - Host nativo de Organizador para Android.
 * - Sirve assets offline via WebViewAssetLoader
 * - Respeta barras de sistema e IME (WindowInsetsCompat)
 * - Abre enlaces externos (Ko-fi, etc.) en el navegador del sistema
 * - Guarda respaldos JSON en Descargas y fotos de galería en Pictures/Organizador
 * - Soporta notificaciones nativas inmediatas y programadas (AlarmManager)
 * - Expone salida limpia de la aplicación (finishAffinity)
 */
public class MainActivity extends AppCompatActivity {

    private static final String BASE_HOST = "appassets.androidplatform.net";
    private static final String BASE_ORIGIN = "https://" + BASE_HOST + "/assets/public/index.html";

    private FrameLayout rootContainer;
    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private ValueCallback<Uri[]> filePathCallback;
    private ActivityResultLauncher<Intent> fileChooserLauncher;
    private ActivityResultLauncher<Intent> createDocumentLauncher;
    private ActivityResultLauncher<String> notificationPermissionLauncher;
    private byte[] pendingSaveBytes = null;
    private boolean pageLoaded = false;
    private String pendingAction = null;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        NotificationHelper.ensureChannel(this);

        boolean isNight = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
                == Configuration.UI_MODE_NIGHT_YES;
        int barColor = Color.parseColor(isNight ? "#0B1120" : "#F8FAFC");
        getWindow().setStatusBarColor(barColor);
        getWindow().setNavigationBarColor(barColor);

        WindowInsetsControllerCompat insetsController =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (insetsController != null) {
            insetsController.setAppearanceLightStatusBars(!isNight);
            insetsController.setAppearanceLightNavigationBars(!isNight);
        }

        fileChooserLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (filePathCallback == null) return;
                    Uri[] results = WebChromeClient.FileChooserParams.parseResult(
                            result.getResultCode(), result.getData());
                    filePathCallback.onReceiveValue(results);
                    filePathCallback = null;
                }
        );

        createDocumentLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    byte[] data = pendingSaveBytes;
                    pendingSaveBytes = null;
                    if (data == null || result.getResultCode() != RESULT_OK || result.getData() == null) return;
                    Uri uri = result.getData().getData();
                    if (uri == null) return;
                    try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                        if (os != null) {
                            os.write(data);
                            os.flush();
                            Toast.makeText(this, "Archivo guardado correctamente.", Toast.LENGTH_SHORT).show();
                        }
                    } catch (Exception e) {
                        Toast.makeText(this, "No se pudo guardar el archivo.", Toast.LENGTH_SHORT).show();
                    }
                }
        );

        notificationPermissionLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestPermission(),
                isGranted -> { /* Permiso gestionado por la plataforma */ }
        );

        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        rootContainer = new FrameLayout(this);
        rootContainer.setBackgroundColor(barColor);
        rootContainer.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        WebView.setWebContentsDebuggingEnabled(true);
        webView = new WebView(this);
        webView.setBackgroundColor(barColor);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        rootContainer.addView(webView);
        setContentView(rootContainer);

        ViewCompat.setOnApplyWindowInsetsListener(rootContainer, (v, windowInsets) -> {
            Insets sysBars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            int bottomInset = Math.max(sysBars.bottom, ime.bottom);
            v.setPadding(sysBars.left, sysBars.top, sysBars.right, bottomInset);
            return WindowInsetsCompat.CONSUMED;
        });

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);

        webView.addJavascriptInterface(
                new WidgetJsBridge(this, new WidgetJsBridge.NativeHostActions() {
                    @Override
                    public void onThemeChanged(boolean isDark) {
                        runOnUiThread(() -> applySystemBarsTheme(isDark));
                    }

                    @Override
                    public void openExternalUrl(String url) {
                        runOnUiThread(() -> launchExternalUrl(url));
                    }

                    @Override
                    public boolean saveTextFile(String filename, String mimeType, String content) {
                        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
                        return writeBytesToDevice(filename, mimeType, bytes, false);
                    }

                    @Override
                    public boolean saveBase64File(String filename, String mimeType, String base64Data) {
                        try {
                            String cleaned = base64Data;
                            int commaIdx = cleaned.indexOf(',');
                            if (commaIdx >= 0) cleaned = cleaned.substring(commaIdx + 1);
                            byte[] bytes = Base64.decode(cleaned, Base64.DEFAULT);
                            boolean isImage = mimeType != null && mimeType.startsWith("image/");
                            return writeBytesToDevice(filename, mimeType, bytes, isImage);
                        } catch (Exception e) {
                            return false;
                        }
                    }

                    @Override
                    public void requestNotificationPermission() {
                        runOnUiThread(() -> requestPostNotificationsIfNeeded());
                    }

                    @Override
                    public void exitApp() {
                        runOnUiThread(() -> {
                            try {
                                finishAffinity();
                            } catch (Exception e) {
                                finish();
                            }
                        });
                    }

                    @Override
                    public String getAppVersionInfo() {
                        return AppUpdateManager.getAppVersionInfoJson(MainActivity.this);
                    }

                    @Override
                    public void checkForAppUpdate() {
                        AppUpdateManager.checkForUpdateAsync(MainActivity.this, webView);
                    }

                    @Override
                    public void downloadAndInstallUpdate(String url, String sha256) {
                        AppUpdateManager.downloadAndInstallAsync(MainActivity.this, webView, url, sha256);
                    }

                    @Override
                    public void openInstallPermissionSettings() {
                        AppUpdateManager.openInstallPermissionSettings(MainActivity.this);
                    }
                }),
                "AndroidWidgetBridge"
        );

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request != null ? request.getUrl() : null;
                if (uri == null) return false;
                String scheme = uri.getScheme();
                String host = uri.getHost();
                if (("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))
                        && !BASE_HOST.equalsIgnoreCase(host)) {
                    launchExternalUrl(uri.toString());
                    return true;
                }
                if ("mailto".equalsIgnoreCase(scheme) || "tel".equalsIgnoreCase(scheme)) {
                    launchExternalUrl(uri.toString());
                    return true;
                }
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                pageLoaded = true;
                if (pendingAction != null && !pendingAction.isEmpty()) {
                    dispatchActionToWeb(pendingAction);
                    pendingAction = null;
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("Organizador")
                        .setMessage(message)
                        .setPositiveButton("Continuar", (dialog, which) -> result.confirm())
                        .setNegativeButton("Cancelar", (dialog, which) -> result.cancel())
                        .setOnCancelListener(dialog -> result.cancel())
                        .show();
                return true;
            }

            @Override
            public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("Organizador")
                        .setMessage(message)
                        .setPositiveButton("Aceptar", (dialog, which) -> result.confirm())
                        .setOnCancelListener(dialog -> result.confirm())
                        .show();
                return true;
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                // Intercepta enlaces con target="_blank" (como Ko-fi) y los abre en el navegador externo
                WebView.HitTestResult hit = view.getHitTestResult();
                if (hit != null && hit.getExtra() != null) {
                    String extraUrl = hit.getExtra();
                    if (extraUrl.startsWith("http://") || extraUrl.startsWith("https://")) {
                        launchExternalUrl(extraUrl);
                        return false;
                    }
                }
                WebView tempWebView = new WebView(MainActivity.this);
                tempWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                        if (req != null && req.getUrl() != null) {
                            launchExternalUrl(req.getUrl().toString());
                        }
                        v.destroy();
                        return true;
                    }
                });
                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(tempWebView);
                resultMsg.sendToTarget();
                return true;
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams chooserParams) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                try {
                    Intent intent = chooserParams.createIntent();
                    fileChooserLauncher.launch(intent);
                    return true;
                } catch (Exception e) {
                    filePathCallback = null;
                    return false;
                }
            }
        });

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null) {
                    webView.evaluateJavascript(
                            "(function(){try{if(window.OrganizadorApp&&typeof window.OrganizadorApp.handleNativeBack==='function'){return String(window.OrganizadorApp.handleNativeBack());}var open=document.querySelector('.modal-overlay:not(.hidden)');if(open){var btn=open.querySelector('[id^=\"close-\"]');if(btn){btn.click();return 'handled';}}}catch(e){}return 'unhandled';})()",
                            res -> {
                                String cleaned = res != null ? res.replace("\"", "") : "";
                                if (!"handled".equals(cleaned) && !"true".equals(cleaned)) {
                                    if (webView.canGoBack()) {
                                        webView.goBack();
                                    } else {
                                        finish();
                                    }
                                }
                            });
                } else {
                    finish();
                }
            }
        });

        pendingAction = extractWidgetAction(getIntent());
        String initialUrl = BASE_ORIGIN;
        if (pendingAction != null && !pendingAction.isEmpty()) {
            initialUrl += "?action=" + Uri.encode(pendingAction);
        }
        webView.loadUrl(initialUrl);

        requestPostNotificationsIfNeeded();
    }

    private void launchExternalUrl(String url) {
        if (url == null || url.trim().isEmpty()) return;
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, "No se pudo abrir el enlace externo.", Toast.LENGTH_SHORT).show();
        }
    }

    private boolean writeBytesToDevice(String filename, String mimeType, byte[] bytes, boolean asImage) {
        if (bytes == null || bytes.length == 0) return false;
        String safeName = (filename == null || filename.trim().isEmpty())
                ? (asImage ? "organizador_foto.jpg" : "organizador_respaldo.json")
                : filename.replaceAll("[^a-zA-Z0-9._-]", "_");
        String safeMime = (mimeType != null && !mimeType.isEmpty())
                ? mimeType
                : (asImage ? "image/jpeg" : "application/json");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                ContentResolver resolver = getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, safeName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, safeMime);
                Uri collection;
                if (asImage) {
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Organizador");
                    collection = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                } else {
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
                }
                Uri itemUri = resolver.insert(collection, values);
                if (itemUri == null) return false;
                try (OutputStream os = resolver.openOutputStream(itemUri)) {
                    if (os == null) return false;
                    os.write(bytes);
                    os.flush();
                }
                return true;
            } catch (Exception e) {
                e.printStackTrace();
                // Fallback a selector de guardar documento si MediaStore falla
            }
        }

        // Android 7-9 (API 24-28) o fallback: abrir selector nativo "Guardar como"
        runOnUiThread(() -> {
            try {
                pendingSaveBytes = bytes;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType(safeMime);
                intent.putExtra(Intent.EXTRA_TITLE, safeName);
                createDocumentLauncher.launch(intent);
            } catch (Exception e) {
                pendingSaveBytes = null;
                Toast.makeText(this, "No se pudo iniciar la descarga.", Toast.LENGTH_SHORT).show();
            }
        });
        return true;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String action = extractWidgetAction(intent);
        if (action != null && !action.isEmpty()) {
            if (pageLoaded && webView != null) {
                dispatchActionToWeb(action);
            } else {
                pendingAction = action;
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        WidgetDataSync.updateAllWidgets(this);
    }

    private String extractWidgetAction(Intent intent) {
        if (intent == null || intent.getData() == null) return null;
        return intent.getData().getQueryParameter("action");
    }

    private void dispatchActionToWeb(String action) {
        if (webView == null || action == null || action.isEmpty()) return;
        String safeAction = JSONObject.quote(action);
        webView.evaluateJavascript(
                "window.WidgetSyncModule && window.WidgetSyncModule.executeAction(" + safeAction + ");",
                null
        );
    }

    private void applySystemBarsTheme(boolean isDark) {
        int barColor = Color.parseColor(isDark ? "#0B1120" : "#F8FAFC");
        getWindow().setStatusBarColor(barColor);
        getWindow().setNavigationBarColor(barColor);
        if (rootContainer != null) rootContainer.setBackgroundColor(barColor);
        if (webView != null) webView.setBackgroundColor(barColor);
        WindowInsetsControllerCompat insetsController =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (insetsController != null) {
            insetsController.setAppearanceLightStatusBars(!isDark);
            insetsController.setAppearanceLightNavigationBars(!isDark);
        }
    }

    private void requestPostNotificationsIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
            }
        }
    }
}
