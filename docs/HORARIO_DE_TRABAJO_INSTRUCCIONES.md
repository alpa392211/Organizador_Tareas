# Instrucciones: botón "Horario de trabajo" (alternativo a "Ciclo Escolar")

Objetivo: para el modo **Organizador de actividades**, ofrecer en Ajustes un botón/acordeón **"Horario de trabajo"** en lugar de "Ciclo Escolar". Es un horario **fijo y semanal** (7 días) que se configura una sola vez y **no se modifica cada semana**.

## 1. Datos (`js/storage.js`)
- Nueva clave en `KEYS`: `WORK_SCHEDULE: 'org_escolar_work_schedule_v1'`.
- Estructura:
  ```json
  {
    "mon": { "enabled": true,  "start": "09:00", "end": "17:00" },
    "tue": { "enabled": true,  "start": "09:00", "end": "17:00" },
    "wed": { "enabled": true,  "start": "09:00", "end": "17:00" },
    "thu": { "enabled": true,  "start": "09:00", "end": "17:00" },
    "fri": { "enabled": true,  "start": "09:00", "end": "17:00" },
    "sat": { "enabled": false, "start": "", "end": "" },
    "sun": { "enabled": false, "start": "", "end": "" }
  }
  ```
- Métodos: `getWorkSchedule()` (devuelve los 7 días con valores por defecto), `saveWorkSchedule(obj)` (valida `HH:MM` y `start < end`), y `isWorkScheduleConfigured()`.
- Incluirlo en `exportJson()` / `importJson()` para respaldo.

## 2. Interfaz (`index.html`)
- Copiar la tarjeta de acordeón "Ciclo Escolar Activo" (`.settings-accordion-card`, ~línea 964) y renombrarla **"Horario de Trabajo"** con un `<form id="settings-work-schedule-form">`.
- Siete filas (Lun–Dom): botón estándar de día activo/inactivo (no usar switches), `<input type="time">` de inicio y fin.
- Botón **Guardar Horario**.
- Mostrar esta tarjeta solo si `StorageModule.getAccountType() === 'activities'`; la de Ciclo Escolar solo si es `'institution'`.
- En el onboarding (`#cycle-setup-welcome-form`): cuando se elige "Organizador de actividades", sustituir los campos de fechas de ciclo por un resumen de horario con valores por defecto editables.

## 3. Lógica (`js/app.js`, `setupSettingsView`)
- Rellenar el formulario con `getWorkSchedule()`, guardar con `saveWorkSchedule()`, mostrar toast y cerrar el acordeón (`autoCloseCard`).
- Como es fijo, **no** se reinicia ni se pide cada semana; se repite todas las semanas.

## 4. Integración opcional
- `js/calendar.js`: pintar las franjas del horario de trabajo en cada semana.
- `js/notifications.js`: avisar al inicio de la jornada.
- Vista de Materias: mostrar el horario del día actual.

## 5. Pruebas
- Añadir en `tests/` casos para: valores por defecto, validación de horas, persistencia tras recargar, visibilidad según tipo de cuenta, y exportar/importar.
