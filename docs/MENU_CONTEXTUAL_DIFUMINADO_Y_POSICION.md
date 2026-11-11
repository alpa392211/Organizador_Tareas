# Menú contextual del editor: difuminado y posición junto a la tarjeta

Estado: **análisis de viabilidad + plan** (no implementado). Aplica al popup `#card-dynamic-popup` (`js/haptics.js` → `CardContextMenu`) que se abre con pulsación larga en materias, tareas y notas.

## 1. Viabilidad

| Objetivo | Viabilidad | Esfuerzo | Notas |
|---|---|---|---|
| Fondo difuminado/borroso (estilo glass) detrás del menú | **Alta** | Bajo (≈1 h) | `backdrop-filter: blur()` está soportado en Chrome/Android y Safari/iOS modernos. Ya se usa `backdrop-blur-xs` en la app. |
| Panel del menú con efecto cristal (translúcido + blur) | **Alta** | Bajo | Mismo recurso, aplicado al diálogo. |
| Menú **arriba o abajo** de la tarjeta, no al centro | **Alta** | Medio (≈2–3 h) | La versión 1.4.0 ya calculaba posición con `getBoundingClientRect()`; hay que reincorporar esa lógica al popup. |
| Resaltar la tarjeta seleccionada sobre el desenfoque | **Media-alta** | Medio | Requiere elevar la tarjeta (clon o `z-index` + `position: relative`) por encima del backdrop. |

Riesgos:
- `backdrop-filter` puede afectar el rendimiento en móviles de gama baja con muchas tarjetas → usar blur moderado (6–10 px) y un fallback con fondo semitransparente (`@supports not (backdrop-filter: blur(1px))`).
- Scroll: al abrir el menú hay que bloquear el scroll del `body` para que la tarjeta no se mueva respecto al menú.
- Pantallas pequeñas (320 px): el menú debe ajustarse al viewport (margen de 12 px).

## 2. Diseño propuesto

### 2.1 Difuminado
1. Backdrop: `fixed inset-0` con `background: rgba(15,23,42,.35)` y `backdrop-filter: blur(8px)`; transición de opacidad 150 ms.
2. Panel del menú: `background: rgba(255,255,255,.75)` (claro) / `rgba(30,41,59,.75)` (oscuro) + `backdrop-filter: blur(14px) saturate(140%)` + borde `1px` translúcido.
3. Mantener la animación elástica `dynamicCardPopupBounce` (origen de la transformación en el lado de la tarjeta).

### 2.2 Posición junto a la tarjeta
1. En `CardContextMenu.show({ targetEl, ... })`, calcular `rect = targetEl.getBoundingClientRect()`.
2. Medir el menú (`menuRect`) con visibilidad oculta antes de mostrarlo.
3. Reglas:
   - `espacioAbajo = innerHeight - rect.bottom`, `espacioArriba = rect.top`.
   - Si `espacioAbajo >= menuRect.height + 12` → colocar **debajo** (`top = rect.bottom + 8`).
   - Si no, y `espacioArriba >= menuRect.height + 12` → colocar **arriba** (`top = rect.top - menuRect.height - 8`).
   - Si no cabe en ninguno → fijar al borde más amplio y permitir scroll interno.
   - Horizontal: centrar respecto a la tarjeta y limitar a `[12, innerWidth - menuRect.width - 12]`.
4. Cambiar el contenedor `#card-dynamic-popup` de "centrado con flex" a posicionamiento absoluto: el diálogo recibe `style="top/left"` y `transform-origin` según quede arriba (`bottom center`) o abajo (`top center`).
5. Añadir una pequeña flecha (pseudo-elemento) apuntando a la tarjeta (opcional).
6. Recalcular en `resize`/`orientationchange`, y cerrar en `scroll` si el usuario desplaza la lista.

### 2.3 Tarjeta resaltada
- Al abrir: añadir clase `card-context-active` (`position: relative; z-index: 71; box-shadow` elevada) a la tarjeta y mantener el backdrop en `z-index: 70` con el resto de la pantalla borrosa.
- Al cerrar: quitar la clase (ya se hace con los `ring-*` actuales).

## 3. Archivos a tocar
- `js/haptics.js`: `show()`, `ensurePopup()` (estructura), `close()`, listeners de `resize`/`scroll`.
- `css/styles.css`: estilos `.dynamic-popup` (glass), backdrop borroso, `.card-context-active`, fallback `@supports`.
- `index.html`: ajustar `#card-dynamic-popup` si se mantiene estático (hoy se crea desde JS si falta).
- `tests/`: actualizar F16 (posición dentro del viewport a 320 px, arriba/abajo según espacio, Escape/backdrop, cierre al hacer scroll).

## 4. Criterios de aceptación
- El fondo de la pantalla se ve borroso mientras el menú está abierto; la tarjeta seleccionada queda nítida.
- El menú aparece **debajo** de la tarjeta si hay espacio; si no, **encima**; nunca en medio de la pantalla ni fuera del viewport (320–1280 px).
- Funciona en modo claro y oscuro, con y sin soporte de `backdrop-filter`.
- La opción de desactivar la pulsación larga sigue funcionando (botones clásicos).
- Todas las pruebas pasan.

## 5. Estimación total
≈ 4–6 horas de trabajo incluyendo pruebas. **Veredicto: totalmente viable.**
