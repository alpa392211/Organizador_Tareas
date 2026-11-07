# Organizador Escolar Pro — Versión 1.3.1 "Pingüino" 🐧

## Resumen Ejecutivo de la Actualización Mayor

La versión **1.3.1 (Nombre clave: Pingüino)** representa una evolución arquitectónica integral del Organizador Escolar, transformando la plataforma en un sistema internacional personalizable, enriquecido con dinámicas interactivas secretas y optimizado para pantallas móviles y tablets.

---

## 1. 🎓 Catálogo Internacional de Instituciones Hispanohablantes
- **33 Casas de Estudios Oficiales**: Incorporación de universidades y preparatorias líderes de México, España, Colombia, Argentina, Chile, Perú, Costa Rica, Uruguay, Ecuador y Venezuela.
- **26 Emblemas Vectoriales SVG Propios**: Diseñados e integrados en `assets/` con resolución nítida y peso ligero.
- **Organización por Países**: Navegación categorizada con banderas y selectores nativos `<optgroup>` que facilitan la búsqueda sin saturar la vista.
- **Retiro de "Escuelas en General"**: Sustitución definitiva de la opción genérica con migración transparente para usuarios existentes.

---

## 2. 🏫 Creador de Escuela Personalizada
- **Identidad Institucional Completa**: Permite definir nombre corto, insignia, nombre oficial y lema/slogan propio.
- **Carga de Escudo con Compresión Canvas**: La imagen del escudo o logotipo se optimiza dinámicamente en el navegador a máximo $256 \times 256\,\text{px}$ en Base64 ($\le 30\,\text{KB}$), protegiendo la cuota de almacenamiento local.
- **Período Lectivo Libre y Manual**: Campo de texto libre para escribir manualmente cualquier modalidad académica (ej. *"3.er Trimestre"*, *"Semestre 2026-B"*, *"Módulo 4"*), disponible tanto en Configuración como en el asistente inicial (Onboarding).
- **Selector de Paleta y Resplandor**: Selector de color institucional con presets rápidos para irradiar el aura dinámica oficial de la escuela.

---

## 3. 🔓 Bóveda de Códigos Secretos y Animación Cinemática
- **Cinemática de Desbloqueo Dinámico**:
  - Al validar un código correcto, el candado cerrado (`🔒`) vibra, desata una aureola expansiva esmeralda/dorada (`vaultAuraBurst`), cambia a candado abierto (`🔓`) y despliega la recompensa mediante una ventana emergente animada (`vaultWindowPopEnter`).
- **Parser Flexible sin Límite Arbitrario**:
  - Eliminada la restricción de 8 dígitos para permitir códigos de cualquier longitud y variantes alfanuméricas con tolerancia a mayúsculas/minúsculas y espacios.
- **Catálogo de 11 Protocolos Secretos**:
  1. `APOLLO11`: Protocolo cósmico con tema espacial, fondos estelares y propulsores 🚀 en botones principales.
  2. `06062009`: Dedicatoria privada conmemorativa: *"Tu eres alguien especial por conocer esta fecha..."* con atmósfera celestial.
  3. `EDUARDO`: Homenaje VIP al creador de la app con corona dorada 👑, tema Golden Master y reconocimientos especiales.
  4. `PINGUINO`: Tema conmemorativo oficial de la versión 1.3.1 con acentos cian polar glacial y escarcha visual.
  5. `RETRO80S`: Estilo Synthwave Neón ochentero con degradados fucsia y violeta.
  6. `MATRIX99`: Modo ciberpunk terminal verde fósforo sobre negro azabache.
  7. `ZENPEACE`: Modo minimalista verde matcha relajante con tipografía balanceada.
  8. `COFFEE42`: Tema café moca cálido para sesiones nocturnas de estudio.
  9. `ARCADE90`: Gamificación retro 8-bit inspirada en arcades clásicos.
  10. `STUDYMAX`: Modo Einstein de hiperenfoque en azul marino de alto contraste.
  11. `GATITOS_`: Modo escala de grises con celebración interactiva de felinos.
- **100% Desactivables**: Todos los temas, cohetes espaciales y decoraciones cuentan con interruptores independientes en la sección de Ajustes y en el inventario de la bóveda para activarse o desactivarse en cualquier momento.

---

## 4. ⚙️ Reorganización de Ajustes y Adaptabilidad para Tablets
- **Menús Claros y Estructurados**: Organización en acordeones modulares con tipografía y switches perfectamente alineados.
- **Optimización para Tablets (768px a 1024px)**: Rediseño fluido de cabeceras y grillas de dos columnas en tablets, garantizando cero desbordamiento horizontal (`scrollWidth === innerWidth`).
- **Experiencia Móvil Intacta**: Preservación de la navegación inferior, botones táctiles con respuesta háptica y drawer deslizable para smartphones.
- **Ecosistema de Widgets**: Sincronización continua de datos para widgets de Android (próxima tarea, materias de hoy, porcentaje del ciclo escolar y fechas límite).

---

## 5. 🧪 Batería de Pruebas Automatizadas (307/307 Aprobadas)
- **Tier 1 (Cobertura Funcional)**: 135 / 135 pruebas PASS.
- **Tier 2 (Casos Límite y Extremos)**: 135 / 135 pruebas PASS.
- **Tier 3 (Combinaciones Cruzadas)**: 32 / 32 pruebas PASS.
- **Tier 4 (Escenarios Reales E2E)**: 5 / 5 pruebas PASS.
- **Tiempo de Ejecución**: 4.25 segundos en Chrome Headless sin dependencias de red.
