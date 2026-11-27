# Empaquetado y Cambios — Organizador de Tareas v1.7.0

## Resumen de Cambios (15 Mejoras + Actualizador Remoto)

1. **Indicador de navegación en Modo Claro:** Cápsula cristalina luminosa de alto contraste y texto índigo oscuro activo (`#312e81` / `#0f172a`).
2. **Gesto deslizable con puntero (`Pointer Events`):** Seguimiento fluido con deformación elástica (`scale 1.10`), retroalimentación háptica por opción y aterrizaje suave en selectores segmentados, barra de navegación, chips de notas e interruptores.
3. **Barra lateral de color siempre visible en Tareas:** Implementación mediante pseudo-elemento `::before` en `.task-card` con `--task-accent-color` por materia (invulnerable a estilos de borde de tarjeta).
4. **Animación vertical al cambiar Modo Claro / Oscuro:** Revelado progresivo de arriba hacia abajo con View Transitions API (`::view-transition-new(root)`), cortina de respaldo y desactivación automática en modo rendimiento o `prefers-reduced-motion`.
5. **Acordeones de Configuración estables:** Los submenús permanecen abiertos al ajustar sus controles internos y se contraen únicamente al abrir otro acordeón o cambiar de vista.
6. **5 nuevas tipografías locales offline en Bóveda:** `Space Grotesk` (`GROTESK`), `Fredoka` (`FREDOKA`), `Dancing Script` (`SCRIPTY`), `Pixelify Sans` (`PIXEL88`) y `Special Elite` (`TYPEWRIT`) en `assets/fonts/`, ampliando el pool automático a 18 códigos (`0 / 18`) y conservando exclusivos los códigos manuales (`EDUARDO`, `06062009`, `KRONOS99`).
7. **Temas desbloqueados en Configuración:** Los temas de Bóveda desbloqueados aparecen dinámicamente en *Configuración → Tema y Apariencia*; cuando no hay ninguno desbloqueado la sección permanece completamente oculta.
8. **3 calidades de fondo animado + pausa en modales:** `Baja` (18 FPS / animación CSS solo con `transform`), `Media` (30 FPS / 14-18 partículas) y `Alta` (60 FPS / 36-48 partículas, deshabilitada con Reducir efectos activo).
9. **Modo Claro completo en los 10 temas de Bóveda y 10 fondos temáticos:** Paletas claras translúcidas con contraste WCAG alto y adaptación de colores en lienzo canvas.
10. **Sonidos de notificación propios CC0 (Kenney):** `notif_class.ogg`, `notif_task.ogg` y `notif_alert.ogg` con canales Android v2 dedicados y selector en Configuración (`App` / `Sistema` / `Silencio` + botón *Probar sonido*).
11. **Confirmación de salida con botón Atrás y acceso a Configuración en menú lateral:** Al retroceder hasta la vista raíz se muestra `#exit-modal` (un segundo Atrás lo cierra) y el pie del cajón lateral ahora lleva directo a Configuración.
12. **Perfiles de dispositivo (`Baja` / `Media` / `Alta`):** Detección automática inicial de hardware/FPS con selector manual en Configuración.
13. **Desenfoque en «Mi foto» fluido incluso en Modo Rendimiento:** Pre-desenfoque en canvas caché (`_generateBlurredPhotoUrl`) aplicado de forma estática y ligera.
14. **Tutorial animado interactivo de 9 pasos (`js/tour.js`):** Cubre Materias, Tareas y Notas con avance automático pausable al tocar, soporte de gestos táctiles, foco visual y botón para repetirlo en Configuración.
15. **Ubicación configurable del botón «Nueva materia»:** Modos `Automático (8+)` / `Arriba` / `Abajo` más botón rápido de intercambio en la vista de Materias.
16. **Actualizador remoto APK (`AppUpdateManager.java` + `js/updater.js` + `version.json`):** Consulta `version.json` desde GitHub, descarga el APK con progreso en tiempo real, valida la firma SHA-256 y abre el instalador nativo Android vía `FileProvider`.

---

## Verificación Técnica y Firma Digital (Release)

- **Paquete:** `com.organizador.escolar`
- **Versión:** `1.7.0` (`versionCode: 170`)
- **SDK:** `minSdkVersion 24` / `targetSdkVersion 36` / `compileSdkVersion 36`
- **Archivo APK:** [downloads/Organizador-v1.7.0.apk](downloads/Organizador-v1.7.0.apk) (`4,681,826` bytes)
- **SHA-256 del APK:** `9b2d32697c811463ece32ee377cd1875afc117a027b7afcb47a9fd3b39b97f03`
- **Firma (`apksigner verify`):** APK Signature Scheme v2 verificada
  - Cert DN: `CN=Organizador, OU=ALPA Studio, O=ALPA Studio, L=CDMX, ST=CDMX, C=MX`
  - Cert SHA-256: `36852c0c0dc2846a3d582e41778f86d4f382aa0bdf8f0abed03bdfa8a80ffd0b`
- **Pruebas E2E (`npm test`):** `262 / 262 PASS` (0 fallos, 0 errores de consola web y APK)
