# Países y selección de escuelas (archivado en 1.4.3)

Estos menús están **ocultos** en la interfaz desde la 1.4.3. El usuario ahora sube la foto/logo de su escuela en la configuración inicial.

## Qué está oculto
| Elemento | Archivo | Cómo se oculta |
|---|---|---|
| Selector de casa de estudios, píldoras de país y botón "+ Crear Escuela" (Ajustes) | `index.html` → `#settings-school-selector-block` | `class="hidden"` + `display:none` |
| Cuadrículas y píldoras de país/escuela del onboarding | `index.html` → `#welcome-country-*`, `#welcome-schools-*` | contenedores `hidden` (proxies vacíos) |

## Dónde vive la información
- `js/institutions.js`: constante `COUNTRIES` (línea ~9) y `INSTITUTIONS` (línea ~28, escudos, nombres, periodos).
- `js/storage.js`: claves `org_escolar_institution`, `org_escolar_user_country`, `org_escolar_country_locked`, `org_escolar_custom_schools`.

## Cómo restaurarlos (si algún día se necesitan)
1. Quitar `hidden` y `style="display:none"` de `#settings-school-selector-block`.
2. Volver a poblar los contenedores `#welcome-country-grid` / `#welcome-schools-grid` desde `app.js`.

## Pendiente: borrado definitivo
Cuando se confirme que ya no se necesitan, eliminar por completo:
1. `COUNTRIES` e `INSTITUTIONS` de `js/institutions.js` (conservar `UNCONFIGURED_INSTITUTION`, `getInstitution`, `renderIconHtml`).
2. El bloque `#settings-school-selector-block` y los proxies `#welcome-country-*` / `#welcome-schools-*` de `index.html`.
3. Las claves de país/escuelas personalizadas en `storage.js` (respetando los datos ya guardados por los usuarios al migrar).
4. Actualizar las pruebas de `tests/` que aún los referencian.
