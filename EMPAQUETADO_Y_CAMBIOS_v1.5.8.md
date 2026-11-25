# Organizador v1.5.8 — Cambios Finales, Widgets y Empaquetado APK

**Nombre de la app Android:** `Organizador` (`com.organizador.escolar`)  
**Versión:** `1.5.8` (`versionCode: 158`)  
**APK compilado y firmado:** `downloads/Organizador-v1.5.8.apk`  
- **Tamaño:** `3,846,586` bytes (`3.67 MB`)  
- **SHA-256:** `2694D83C5AC17399C6FB464057002084CEEF1D7B36C1E3882733DD6B9C4D3584`  
- **Firma:** APK Signature Scheme v2 (`CN=Organizador, OU=ALPA Studio, O=ALPA Studio, L=CDMX, ST=CDMX, C=MX`)

---

## 1. Corrección de flechas en selectores desplegables (`<select>`)

### Problema detectado
- `#task-subject-id` (modal de Nueva Tarea) y `#notes-photo-note-select` (galería de Notas) dependían de la flecha nativa del navegador/WebView sin `appearance: none`, quedando la flecha pegada al borde curvo derecho (`rounded-2xl`).
- `#task-subject-filter` usaba un contenedor hermano superpuesto (`<svg>`) además del padding insuficiente en pantallas estrechas.

### Solución aplicada
- **[css/styles.css](css/styles.css)**: se añadió una regla unificada para `select:not(.sr-only)` con `-webkit-appearance: none !important; appearance: none !important;`, `padding-right: 2.65rem !important;`, `text-overflow: ellipsis;` y un chevron SVG inline nítido en `background-position: right 0.95rem center` adaptado tanto a modo claro (`#475569`) como a modo oscuro y temas especiales (`#e2e8f0`).
- **[index.html](index.html)**: se eliminó el `<div ...><svg>` duplicado junto a `#task-subject-filter` para usar el chevron unificado en todos los selectores visibles (`#task-subject-filter`, `#notes-photo-note-select` y `#task-subject-id`).
- **Prueba automatizada**: `T2_F30_06_select_chevron_alignment_and_apk_invite` en [tests/tier2_boundary_corner.js](tests/tier2_boundary_corner.js).

---

## 2. Auditoría y reparación de Widgets Android y puente Web↔Android

Se revisaron los 3 widgets nativos en `android/app/src/main/java/com/organizador/escolar/widgets/` y su puente JS en [js/widgets.js](js/widgets.js), corrigiendo varias incompatibilidades:

1. **Contrato unificado de payload JSON (`js/widgets.js`)**:
   - `QuickTaskWidget.java` esperaba `institution.name`, `quickTask.pendingTodayCount`, `quickTask.nextTaskTitle` y `quickTask.nextTaskSubject`.
   - `WeekCalendarWidget.java` esperaba `weekCalendar.monthTitle` y `weekCalendar.weekDays` (arreglo de 14 días desde el lunes de la semana actual con `dayName`, `dayNumber`, `isToday`, `hasClasses`, `hasTasks`, `hasReminders`).
   - `WidgetDataSync.TaskDeadlineItem` esperaba `dueTime`, `urgency`, `urgencyLabel` e `isOverdue`.
   - Se conservan además los campos previos (`pendingTotal`, `pendingToday`, `nextTask`, `activityDays`, `cycle`) para compatibilidad total con la versión web.
2. **Sincronización automática al guardar cambios (`js/storage.js`)**:
   - `saveSubjects()`, `saveTasks()` y `saveNotes()` llaman automáticamente a `window.WidgetSyncModule?.sync?.()`.
3. **Puente directo sin depender de plugins externos (`WidgetJsBridge.java`)**:
   - Reemplaza `WidgetBridgePlugin.java` (que importaba clases de Capacitor no presentes en el proyecto nativo) con un `@JavascriptInterface` llamado `AndroidWidgetBridge` (`updateWidgets(String json)` y `getWidgetData()`).
   - `js/widgets.js` invoca `window.AndroidWidgetBridge.updateWidgets(payloadJson)` y mantiene el respaldo para Capacitor si existiera.
   - `handleIntent()` y `executeAction()` ahora atienden correctamente `action=tasks`, `action=new_task`, `action=new_note` y `action=open_calendar`.
4. **Fixes nativos en los AppWidgetProviders y layouts XML**:
   - `android/app/src/main/res/values/strings.xml`: `app_name` actualizado a `Organizador`.
   - `widget_week_calendar.xml`, `widget_task_deadlines.xml` y `widget_task_deadline_item.xml`: sustituidos todos los nodos `<View>` (prohibidos en `RemoteViews`, causantes de *"Ocurrió un error al cargar el widget"*) por `<ImageView android:contentDescription="@null" />`, y `paddingHorizontal`/`paddingVertical` (API 26+) por `paddingLeft`/`paddingRight`/`paddingTop`/`paddingBottom` para compatibilidad completa desde `minSdk 24`.
   - `android/app/src/main/res/layout/widget_quick_task.xml`: corregido atributo inválido `android:gravity="baseline"` en `LinearLayout` por `android:gravity="center_vertical"` + `android:baselineAligned="true"`.
   - `QuickTaskWidget.java`, `WeekCalendarWidget.java`, `TaskDeadlinesWidget.java` y `TaskDeadlinesService.java`: migrados de `getResources().getIdentifier(...)` a referencias directas `com.organizador.escolar.R.*` (inmunes a `optimizeReleaseResources` de AGP 8.13.0), con respaldo dinámico de 14 días reales en `WeekCalendarWidget` cuando aún no existe payload, `PendingIntent` explícitos con `ComponentName(..., MainActivity.class)` y `FLAG_IMMUTABLE` (Android 14–16).
   - **Modo oscuro automático y rediseño de alto contraste en los 3 widgets**: se añadió `android/app/src/main/res/values-night/colors.xml` y nuevos drawables semánticos (`widget_day_cell.xml`, `widget_day_cell_active.xml`, `widget_day_cell_today.xml`, `widget_summary_strip.xml`, `widget_item_background.xml`) para que los 3 widgets cambien automáticamente entre modo claro y modo oscuro según el tema del sistema Android. `WeekCalendarWidget` ahora muestra celdas en tarjeta para cada día, etiquetas `ESTA SEMANA` / `PRÓXIMA SEMANA`, subtítulo con fecha actual + conteo de pendientes y franja inferior con la próxima entrega.
5. **Despeje de barra superior sin modificar el header**:
   - `MainActivity.java`: aplica `WindowInsetsCompat.Type.systemBars() | displayCutout() | ime()` al contenedor raíz del `WebView` y sincroniza el color e iconos de la barra de estado y navegación con el tema claro/oscuro del sistema (y en vivo al cambiar de tema mediante `AndroidWidgetBridge.setSystemBarsTheme(isDark)`).
   - `css/styles.css`: `main` incorpora `padding-top: calc(1.75rem + env(safe-area-inset-top, 0px)) !important;` sin alterar `.liquid-glass-nav`.
6. **Alineación del selector de Modo de Color y optimización de fluidez en Configuración y cambio Claro/Oscuro**:
   - `index.html`: `#settings-theme-mode-track` ahora usa `grid-cols-3` horizontal en todos los anchos (con etiquetas compactas `Claro | Oscuro | Auto` en móvil y completas en `>= 640px`), eliminando el óvalo vertical desalineado.
   - `css/styles.css` y `js/app.js`: los acordeones `.settings-accordion-body` eliminaron `transition: max-height` (causante de reflow y re-blur en cada frame al abrir/cerrar) pasando a apertura instantánea con animación GPU ligera (`opacity` + `translate3d` en `160ms`), `contain: layout style`, blur optimizado en APK (`blur(10px)`) y sincronización segmentada limitada a la tarjeta abierta (`SegmentedControl.sync`).
   - Cambio Claro ↔ Oscuro (`applyTheme()`): congela temporalmente las transiciones CSS (`html.theme-switching`) durante 1 frame para evitar que cientos de nodos con `backdrop-filter` se animen simultáneamente, omite re-renderizar el calendario cuando su modal está cerrado, y agrupa `ResizeObserver` en `js/liquid-glass.js` dentro de un único `requestAnimationFrame` (evitando filtros SVG en thumbs pequeños de switches dentro del APK).
7. **Funcionalidades nativas del APK (Ko-fi, descargas, aviso de restauración, notificaciones y salida)**:
   - **Enlaces externos (Ko-fi)**: `MainActivity.java` implementa `shouldOverrideUrlLoading`, `onCreateWindow` (para `target="_blank"`) y `AndroidWidgetBridge.openExternalUrl(url)`, además de un delegado de clics en `js/app.js` para abrir `https://ko-fi.com/edrx_ngl` en el navegador del sistema.
   - **Descarga de respaldo JSON y fotos de galería**: `MainActivity.java` expone `saveTextFile` (guarda el respaldo JSON en `Descargas` via `MediaStore.Downloads` en Android 10+ o selector `ACTION_CREATE_DOCUMENT` en Android 7–9) y `saveBase64File` (guarda fotos de la galería en `Pictures/Organizador` via `MediaStore.Images.Media`), conectados desde `js/app.js` y `js/notes.js`.
   - **Aviso antes de restaurar respaldo**: aviso visible `#settings-restore-warning` en `index.html` y diálogo de confirmación `confirm()` (soportado con `AlertDialog` nativo en `MainActivity.onJsConfirm`) advirtiendo que se borrarán y reemplazarán todos los datos actuales; tras restaurar reprograma notificaciones y widgets.
   - **Notificaciones nativas reales de Tareas y Notas**: nuevos `NotificationHelper.java` y `ReminderReceiver.java` registrados en `AndroidManifest.xml` usando `NotificationChannel` (`IMPORTANCE_HIGH`) y `AlarmManager` (`setExactAndAllowWhileIdle` / `setAndAllowWhileIdle`) para disparar avisos inmediatos y programados incluso con la app cerrada; `js/notifications.js` ahora parsea fechas en hora local, programa tareas (con aviso 30 min antes) y notas mediante `AndroidWidgetBridge`, y reprograma todo al iniciar (`resyncAllScheduled`).
   - **Botón "Salir de la aplicación"**: `AndroidWidgetBridge.exitApp()` ejecuta `finishAffinity()` desde `#confirm-exit-btn` en `js/app.js`.

---

## 3. Separación Web/GitHub Pages vs App empaquetada APK

### En el código principal Web (para GitHub Pages)
Se mantiene íntegra toda la lógica PWA (`manifest.webmanifest`, `sw.js`, `#pwa-settings-card`, `#pwa-floating-banner`, `#drawer-pwa-install-btn`) y se añade la invitación de descarga del APK (desactivada automáticamente si se ejecuta dentro del APK):
- **Banner flotante (`#apk-download-banner` en `index.html`)**: invita a descargar `downloads/Organizador-v1.5.8.apk` después de completar el onboarding (respetando 7 días de descarte en `localStorage` y evitando empalme con `#pwa-floating-banner` o `#tablet-quick-rail`).
- **Tarjeta en Configuración (`#apk-download-settings-card`)** y **acceso en el menú lateral (`#drawer-apk-download-link`)**: enlace directo a `downloads/Organizador-v1.5.8.apk`.
- **Guardia nativa en `js/app.js`**: `isNativeAndroidApp()` detecta `data-platform="android-apk"`, `window.__ORGANIZADOR_NATIVE_APK__`, `window.AndroidWidgetBridge` o Capacitor; cuando está activo omite por completo `initPWA()` y `initApkDownloadBanner()`.

### En la app empaquetada (APK Android)
El script **[scripts/sync-android-web.js](scripts/sync-android-web.js)** (`npm run sync:android`) genera `android/app/src/main/assets/public/` realizando lo siguiente:
- Copia únicamente `index.html`, `css/`, `js/` y `assets/` (**excluye** `sw.js`, `manifest.json`, `manifest.webmanifest`, `downloads/` y `tests/`).
- Marca `<html data-platform="android-apk">` e inyecta `window.__ORGANIZADOR_NATIVE_APK__ = true`.
- Elimina por completo del HTML empaquetado el `<link rel="manifest">`, `#drawer-pwa-install-btn`, `#pwa-settings-card`, `#pwa-floating-banner`, `#drawer-apk-download-link`, `#apk-download-settings-card`, `#apk-download-banner` y el bloque `if ('serviceWorker' ...)` del botón de reintento del splash (preservando intacto el `try/catch` para evitar `SyntaxError` que bloqueaba `window.__hideAppSplash`).
- Valida automáticamente con `new Function(...)` la sintaxis JS de todos los bloques `<script>` inline del HTML generado y copia `favicon.ico` para evitar 404.
- Además, `App.init()` en `js/app.js` incorpora un respaldo directo sobre `#app-splash-screen` en su bloque `finally` para ocultar siempre la pantalla de carga.

---

## 4. Entorno Android verificado e infraestructura del APK

### Comprobación de herramientas en el equipo
- **Android Studio:** instalado en `C:\Program Files\Android\Android Studio` (`AndroidStudio2026.2.2`, JBR Java 25).
- **JDK utilizado para Gradle 8.14.3:** `C:\Users\user\.jdks\jbr-21.0.11` (`OpenJDK 21.0.11`, necesario porque Groovy/ASM de Gradle 8.14.3 no soporta bytecode Java 25 / major version 69).
- **Android SDK:** `C:\Users\user\AppData\Local\Android\Sdk` (`platforms/android-36`, `build-tools/36.0.0` con `aapt2.exe` y `apksigner.bat`).
- **Gradle y AndroidX:** Gradle `8.14.3`, AGP `8.13.0`, `androidx.appcompat:1.7.1`, `androidx.webkit:1.14.0` (con exclusión de `kotlin-stdlib-jdk7` / `kotlin-stdlib-jdk8` en `android/app/build.gradle` para evitar clases duplicadas con `kotlin-stdlib:1.8.22`).

### Iconos y proyecto nativo
- **[scripts/generate_android_icons.py](scripts/generate_android_icons.py)**: genera `ic_launcher.png`, `ic_launcher_round.png` y `ic_launcher_foreground.png` en `mdpi`..`xxxhdpi`, más adaptive icons (`mipmap-anydpi-v26`) sobre fondo `#140632` a partir de `assets/icons/icon-512x512.png` y `assets/icons/icon-maskable-512x512.png`.
- **[android/app/src/main/java/com/organizador/escolar/MainActivity.java](android/app/src/main/java/com/organizador/escolar/MainActivity.java)**:
  - Sirve la app offline con `WebViewAssetLoader` sobre `https://appassets.androidplatform.net/assets/public/index.html` (`localStorage`, `IndexedDB`, `<canvas>` y selector de archivos para fotos mediante `onShowFileChooser`).
  - Conecta `AndroidWidgetBridge`, deep links de los 3 widgets (`organizador://app?action=...`), botón Atrás nativo para cerrar modales y solicitud en tiempo de ejecución de `POST_NOTIFICATIONS` en Android 13+.
- **[android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml)**: tema `Theme.Organizador`, nombre `Organizador`, `hardwareAccelerated="true"`, esquema `organizador://app` y receptores de los 3 widgets.

---

## 5. Cómo volver a sincronizar y compilar el APK

```powershell
# 1. Regenerar iconos (si cambió assets/icons/icon-512x512.png)
python scripts/generate_android_icons.py

# 2. Sincronizar código web hacia android/app/src/main/assets/public/ (sin PWA)
npm run sync:android

# 3. Compilar y firmar APK Release (usando JDK 21)
$env:JAVA_HOME = "$env:USERPROFILE\.jdks\jbr-21.0.11"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
Set-Location android
& "$env:USERPROFILE\.gradle\wrapper\dists\gradle-8.14.3-all\10utluxaxniiv4wxiphsi49nj\gradle-8.14.3\bin\gradle.bat" assembleRelease --no-daemon

# 4. Copiar APK final a la ruta pública para GitHub Pages
Set-Location ..
Copy-Item -Force android\app\build\outputs\apk\release\app-release.apk downloads\Organizador-v1.5.8.apk
```

---

## 6. Verificación ejecutada
- **APK firmado (`apksigner.bat verify`)**: firma v2 válida (`Verifies`), certificado `CN=Organizador, OU=ALPA Studio, O=ALPA Studio`.
- **Inspección de paquetes (`aapt2.exe dump badging`, `aapt2 dump xmltree` y lectura ZIP de `assets/public/index.html`)**:
  - `package='com.organizador.escolar' versionCode='158' versionName='1.5.8' application-label='Organizador'`.
  - Iconos adaptativos y por densidad compilados (`application-icon-120..65534`).
  - Los 4 layouts de widgets dentro del APK contienen únicamente clases `@RemoteView` (`LinearLayout`, `FrameLayout`, `ListView`, `TextView`, `ImageView`) con `0` nodos `<View>`.
  - `assets/public/index.html` contiene `data-platform="android-apk"` y `__ORGANIZADOR_NATIVE_APK__`; **0** referencias a `manifest.webmanifest`, `serviceWorker`, banners/tarjetas PWA o descarga APK, y sin `sw.js`.
- **Prueba de arranque real del bundle APK (`verify_apk_web_bundle.js` en Chrome headless)**: `0` `pageErrors`, `0` `consoleErrors`, `appInitDone: true`, `#app-splash-screen` oculto (`display: none`), `#cycle-setup-modal` visible y `AndroidWidgetBridge.updateWidgets` invocado con los 14 días del calendario.
- **Suite web (`npm test`)**: **256 / 256 pruebas en verde (`0` fallos)**.

---

## 7. Últimas mejoras incorporadas al APK (`Organizador-v1.5.8.apk`)

1. **Corrección del botón central cuadrado (`#bottom-main-circle`) al cambiar de acción**:
   - **[css/styles.css](css/styles.css)**: se añadió recorte circular forzado (`border-radius: 9999px !important; overflow: hidden !important; clip-path: circle(50% at 50% 50%); isolation: isolate;`) en `#bottom-main-circle` y `#tablet-main-circle`, evitando que Chromium/Skia renderizara un cuadro naranja o índigo al cambiar el atajo de *Agregar Tarea* a *Crear Nota* o *Calendario*.
2. **Almacenamiento real disponible en lugar del límite fijo de ~5 MB**:
   - **[js/storage.js](js/storage.js)**: `getStorageMetrics()` ahora expone `quotaBytes`, y se agregó `getFullStorageEstimate()` basado en `navigator.storage.estimate()` para consultar el uso y cuota total real del almacenamiento del dispositivo (combinando `localStorage` e `IndexedDB`, formateado en KB/MB/GB).
   - **[index.html](index.html)** y **[js/app.js](js/app.js)**: se reemplazó la etiqueta fija `Límite ~5 MB` por `#storage-quota-label`, que actualiza dinámicamente `Disponible: X.XX GB` (o MB) y recalcula barra y porcentaje real en `updateStorageMetrics()`.
3. **Optimización de rendimiento en Configuración y acordeones animados**:
   - **[css/styles.css](css/styles.css)**: en Android APK (`html[data-platform="android-apk"] #view-settings .settings-accordion-card`) se eliminó el apilado de múltiples capas `backdrop-filter` + pseudo-elementos `mask-composite: exclude` que saturaban la GPU del WebView, sustituyéndolo por superficies translúcidas nítidas con `contain: layout style paint` y `display: none` en cuerpos cerrados (manteniendo la compatibilidad web).
   - Se incorporó la animación fluida `@keyframes settingsAccordionReveal` (`0.24s cubic-bezier(0.22, 1, 0.36, 1)`), rotación tipo resorte en la flecha (`.settings-accordion-chevron`) y resaltado de borde índigo cuando una sección está abierta.
4. **Widget de Calendario Semanal con materias por día**:
   - **[js/widgets.js](js/widgets.js)**: cada día de `weekCalendar.weekDays` incluye ahora su lista ordenada de materias (`subjects: [{ name, shortName, color, startTime }]`) abreviadas automáticamente (`<= 5` caracteres) y un resumen del día (`todaySubjectsSummary`).
   - **[android/app/src/main/res/layout/widget_week_calendar.xml](android/app/src/main/res/layout/widget_week_calendar.xml)**, **[android/app/src/main/res/drawable/widget_subject_pill.xml](android/app/src/main/res/drawable/widget_subject_pill.xml)** y **[android/app/src/main/java/com/organizador/escolar/widgets/WeekCalendarWidget.java](android/app/src/main/java/com/organizador/escolar/widgets/WeekCalendarWidget.java)**: rediseño a cuadrícula semanal Lunes–Domingo que muestra **hasta 4 materias visibles por día** con pastillas de su color y nombre abreviado, indicador `+N` si un día tiene más de 4 materias, puntos de entregas/recordatorios, resaltado del día actual y modo Claro/Oscuro automático del sistema (verificado con `aapt2 dump xmltree`: únicamente `ImageView`, `LinearLayout` y `TextView`).
