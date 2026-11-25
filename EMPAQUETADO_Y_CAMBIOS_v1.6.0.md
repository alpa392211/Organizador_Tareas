# Organizador v1.6.0 — Resumen de Cambios y Empaquetado APK

**Nombre de la app Android:** `Organizador` (`com.organizador.escolar`)  
**Versión:** `1.6.0` (`versionCode: 160`)  
**APK compilado y firmado:** `downloads/Organizador-v1.6.0.apk`  
- **Tamaño:** `3,864,154` bytes (`3.69 MB`)  
- **SHA-256:** `AE1BEDAB4F5022AB42E3A328F4BA63AEEFC90D40F0DA8EF0A095F3FA2922A645`  
- **Firma:** APK Signature Scheme v2 (`Verifies`, 1 firmante, certificado SHA-256 `36852c0c0dc2846a3d582e41778f86d4f382aa0bdf8f0abed03bdfa8a80ffd0b`, compatible para actualizar sobre v1.5.8/v1.5.9)

---

## 1. Integración de Liquid Glass v2 y adaptación temática
- Se reemplazó `js/liquid-glass.js` por la versión probada con refracción convexa biselada y aberración cromática en intensidad Intenso (sin modificar `js/segmented.js`, `js/notes.js` ni las reglas de `css/styles.css`).
- Se agregó `css/liquid-glass.css` enlazado en `index.html` justo después de `css/styles.css` con `?v=1.6.0` y precacheado en `sw.js` (`organizador-tareas-cache-v1.6.0`).
- En `css/mobile-perf.css` se redujo el brillo excesivo de los botones deslizables (`segmented-glass-indicator`, `nav-sliding-indicator`, `chip-glass-indicator` y `app-switch-thumb`) y se adaptaron tanto los controles deslizables como el selector de recordatorios de materias a los 14 modos/temas de la app (Claro, Oscuro, Monocromático Claro/Oscuro y los 10 temas de la Bóveda), eliminando fondos blancos en modo oscuro.

---

## 2. Recordatorios de Materias antes de clase (4 opciones)
- En el modal de creación y edición de materias (`#subject-modal`) se agregó el selector **Recordatorio de clase** con interruptor, 4 opciones táctiles (**15 min antes**, **30 min antes**, **45 min antes** y **1 hora antes**) y botón **Probar aviso**.
- Las tarjetas de materias muestran una insignia temática con el recordatorio activo.
- `js/notifications.js`, `sw.js`, `AndroidManifest.xml` (`SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `WAKE_LOCK`) y `NotificationHelper.java` programan alarmas exactas semanales en Android (con fallback `AlarmClock`), notificaciones vía `ServiceWorkerRegistration.showNotification` en Chrome móvil/PWA, temporizadores de sesión y aviso inmediato si la clase ya está dentro de la ventana de recordatorio.

---

## 3. Efecto verde optimizado en la Bóveda Secreta
- En `css/mobile-perf.css` se agregó un destello verde esmeralda GPU-only (`#vault-card-container::after` animado únicamente con `transform` y `opacity`, sin repintar `box-shadow` pesados) junto con el candado verde en modo oscuro y claro para mantener 60 FPS en celular.

---

## 4. Modo Rendimiento (Reducir efectos) y optimización móvil
- Se añadió en **Configuración → Apariencia** el interruptor **Reducir efectos (Modo rendimiento)** (`js/performance.js`), que desactiva transparencias (`backdrop-filter`), refracción SVG, animaciones, transiciones, partículas, fondos animados y sombras pesadas, guardando la preferencia y restaurando la intensidad del cristal al desactivarlo.
- Se optimizaron el comportamiento táctil (`touch-action: manipulation`, contención `contain: layout style`, eliminación de hover pegajoso en pantallas táctiles, `overscroll-behavior-y: contain`) y la configuración del `WebView` Android (`LAYER_TYPE_HARDWARE`, `OVER_SCROLL_NEVER`, soporte para `chrome://inspect`).

---

## 5. Verificación ejecutada
- **Suite web completa (`npm test`)**: **259 / 259 pruebas aprobadas (`0` fallos)**, incluyendo `LiquidGlassModule renders hidden 0x0 SVG filter host...` y las nuevas pruebas de recordatorios de materias, destello verde en la Bóveda y Modo rendimiento.
- **Bundle APK (Chrome headless 390×844)**: `0` errores, `appInitDone: true`, splash oculto, `refractionActive: true` en Normal e Intenso y `false` en Suave.
- **Firma APK (`apksigner verify --verbose`)**: `Verifies` (APK Signature Scheme v2).
- **Metadatos APK (`aapt2 dump badging`)**: `package: name='com.organizador.escolar' versionCode='160' versionName='1.6.0'`.
