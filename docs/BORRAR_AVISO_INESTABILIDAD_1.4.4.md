# Borrar por completo el aviso de inestabilidad después de la 1.4.4

> **IMPORTANTE:** Este aviso es exclusivo de la versión **1.4.4**. En cuanto se publique la siguiente actualización (por ejemplo **1.4.5** o **1.5.0**), **debe borrarse por completo**.

## Qué borrar

1. **`js/haptics.js` (`CardContextMenu.ensurePopup`)**
   - Eliminar el bloque `<div id="context-menu-instability-notice">…</div>` y su comentario `<!-- Aviso temporal v1.4.4 ... -->`.

2. **`index.html`**
   - En `#changelog-modal`: eliminar `<div id="changelog-instability-notice">…</div>`.
   - Antes de los `<script>`: eliminar el modal completo `<div id="dev-instability-modal">…</div>`.

3. **`js/app.js`**
   - Eliminar el método `openInstabilityNoticeIfNeeded()` y sus dos llamadas (al cerrar `openChangelogModal` y en el arranque cuando `lastSeenVersion === '1.4.4'`).
   - (Opcional) Limpiar la clave `localStorage.removeItem('org_escolar_dev_notice_144_seen')`.

4. **Este archivo**
   - Eliminar `docs/BORRAR_AVISO_INESTABILIDAD_1.4.4.md` una vez retirado el aviso.
