# Empaquetado y Cambios — Organizador v1.7.1

**Fecha de lanzamiento:** 2026-11-27  
**Versión:** `1.7.1` (`versionCode: 171`)  
**Paquete Android:** `com.organizador.escolar`  

## 1. Correcciones Visuales y de Interacción (v1.7.1)
1. **Selectores deslizables (`js/segmented.js`, `css/liquid-glass.css`):**
   - Soltar un control segmentado tras arrastrarlo sobre otra opción ahora confirma y selecciona la opción destino mediante `findBestIndex` + bypass seguro del click programático (elimina el regreso accidental a la opción previa).
   - Se agregaron `.is-dragging-track`, `.is-animating-track` y `[data-drag-preview="true"]` para que el efecto de cristal líquido se aplique de forma uniforme también sobre la opción seleccionada mientras se mueve.
2. **Barra de navegación inferior (`#bottom-nav`):**
   - Se eliminó el controlador de arrastre en `#bottom-nav .bottom-nav-inner`; funciona exclusivamente como botones táctiles conservando la animación deslizante del indicador `#bottom-nav-indicator`.
3. **Legibilidad en Modo Claro y deduplicación del cajón lateral (`css/styles.css`, `css/mobile-perf.css`, `index.html`):**
   - Corregidas reglas CSS de `.notes-seg-btn` y `.glass-intensity-btn[aria-pressed="true"]` para acotar texto blanco únicamente a `html.dark`.
   - Ajustada la opacidad base `--lgx-fill-a` en claro y en los 10 temas claros de la Bóveda (`0.72` → `0.22`) junto con sombras suaves y `color: #0f172a` / `#334155` nítidos.
   - Eliminado el botón duplicado de Configuración en `#sidebar-drawer nav`, conservando un único acceso `#drawer-footer-settings-btn` en `#sidebar-drawer-footer`.
4. **Encuadre automático en Configuración (`js/app.js`, `css/styles.css`):**
   - Añadido `scroll-margin-top: 5.5rem` y cálculo de desplazamiento suavizado en `setupSettingsView()` al expandir un acordeón para mantenerlo encuadrado bajo `<header>`.
5. **Tutorial de presentación con tono uniforme (`js/tour.js`, `css/styles.css`, `js/app.js`):**
   - Eliminada la sombra `0 0 0 9999px` en `.tour-spotlight` (que oscurecía dos veces el fondo sobre `.tour-backdrop`) y corregidos selectores móviles visibles + inicio inmediato tras onboarding.
6. **Transición Claro ↔ Oscuro con onda blur en GPU (`css/styles.css`, `js/app.js`):**
   - Reemplazado `startViewTransition` (`clip-path: inset`) por `.theme-blur-wave` animada exclusivamente con `transform: translate3d` y `opacity`, con cresta difuminada pre-renderizada para 60 FPS en Android.
7. **Optimización móvil y Modo Alto (`js/liquid-glass.js`, `js/backgrounds.js`, `css/mobile-perf.css`):**
   - Mapas SDF con `dpr = 1` y cuantización de `16px` en dispositivos móviles/WebView; refracción de paso único en `android-apk` y exclusión de `#bottom-nav`/switches del filtro SVG por cuadro.
   - Canvas de fondo con límite de `dpr = 1` en APK Android, tope de `24` partículas en móvil en perfil Alto, sprites cacheados para orbes radiales, agrupación por `fillStyle` y pausa automática durante el scroll y cambio de tema.
   - En `android-apk`, tarjetas en scroll (`.subject-card`, `.task-card`, `.note-card`, archivados) usan `content-visibility: auto` sin `backdrop-filter` ni `mask-composite` redundantes.

## 2. Verificación Automatizada y Visual
- **Suite E2E (`npm test`):** **263 / 263 pruebas aprobadas** (0 fallos), incluyendo la nueva prueba de regresión `T2_F33_01_v171_drag_nav_light_drawer_settings_tour_theme_perf`.
- **Inspección visual Headless Chrome (`390x844` + bundle Android):** 0 errores de consola y capturas validadas.

## 3. Verificación del APK Firmado
- **Archivo:** `downloads/Organizador-v1.7.1.apk`
- **Tamaño:** `4,683,734` bytes
- **SHA-256:** `26eb7a9e0a0e28a21bd6f17e143ef9a40684b00eaa489882650be95cf4adce58`
- **Esquema de firma (`apksigner`):** APK Signature Scheme v2 (`Verifies`)
- **Certificado:** `CN=Organizador, OU=ALPA Studio, O=ALPA Studio, L=CDMX, ST=CDMX, C=MX` (`36852c0c0dc2846a3d582e41778f86d4f382aa0bdf8f0abed03bdfa8a80ffd0b`)
