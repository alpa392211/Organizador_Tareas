# Organizador v1.5.9 — Resumen de Cambios y Empaquetado APK

**Nombre de la app Android:** `Organizador` (`com.organizador.escolar`)  
**Versión:** `1.5.9` (`versionCode: 159`)  
**APK compilado y firmado:** `downloads/Organizador-v1.5.9.apk`  
- **Tamaño:** `3,846,834` bytes (`3.67 MB`)  
- **SHA-256:** `E294DC6A758DEADD5748970A567C3AFC892C4823073288339978F3F206AE82FC`  
- **Firma:** APK Signature Scheme v2 (`Verifies`, 1 firmante)

---

## 1. Optimización de rendimiento y scroll completo en la Bóveda Secreta (`#view-secret-codes`)
- **Eliminación de trabas al abrir la bóveda**:
  - En `css/styles.css` se eliminó la animación infinita de `box-shadow` gigante (`vaultSuspenseGlow`, que repintaba sombras de hasta 160 px cada fotograma) y se reemplazó por una sombra estática nítida con `contain: layout style paint`.
  - En `index.html` se quitó `animate-pulse` del candado y se desactivó `backdrop-filter` / `::before` en las tarjetas secundarias de la bóveda dentro del APK (`html[data-platform="android-apk"]`).
- **Eliminación de trabas al desbloquear códigos**:
  - Se reemplazaron las animaciones de `box-shadow` de 200+ px (`vaultPadlockUnlock`, `vaultAuraBurst`) y la rotación 3D (`rotateX`) del modal por animaciones ligeras solo de GPU (`transform` + `opacity` con `will-change`).
  - En `index.html` se eliminó `backdrop-blur-md` del fondo del modal `#vault-reveal-backdrop`.
  - En `js/app.js` se redujo la demora de revelación a `520 ms` y se difirió la reconstrucción de vistas secundarias (`BackgroundsModule.renderSettingsUI()` y `syncSettingsFontButtons()`) para mantener 60 FPS durante el desbloqueo.
- **Scroll completo en toda la pantalla de la Bóveda**:
  - Se quitó `max-h-[38vh] overflow-y-auto` de `#vault-unlocked-grid` (y se reforzó con `max-height: none; overflow-y: visible;` en CSS), eliminando el recuadro de scroll interno para que todo el menú de la bóveda se desplace de forma fluida y natural de arriba abajo.

---

## 2. Actualización a versión `1.5.9` y aviso de novedades
- **Versión actualizada** en `package.json`, `index.html` (`?v=1.5.9`, indicador de versión y enlaces de descarga `downloads/Organizador-v1.5.9.apk`), `sw.js` (`organizador-tareas-cache-v1.5.9`), `js/storage.js`, `js/app.js`, `android/app/build.gradle` (`versionCode 159`, `versionName "1.5.9"`) y suites de pruebas.
- **Aviso de cambios (`#changelog-modal`)**: actualizado a **Novedades de la Versión 1.5.9**, resumiendo la optimización de la Bóveda y Configuración, el scroll completo, el almacenamiento real disponible, la corrección del botón central y el widget semanal con materias.

---

## 3. Verificación ejecutada
- **Bundle APK (`verify_apk_web_bundle.js` en Chrome headless)**: `0` errores de consola/página, `appInitDone: true`, splash oculto (`display: none`), sin elementos PWA.
- **Firma APK (`apksigner.bat verify --verbose`)**: `Verifies` (APK Signature Scheme v2).
- **Metadatos APK (`aapt2.exe dump badging`)**: `package: name='com.organizador.escolar' versionCode='159' versionName='1.5.9'`, `application-label:'Organizador'`.
- **Suite web completa (`npm test`)**: **256 / 256 pruebas aprobadas (`0` fallos)**.
