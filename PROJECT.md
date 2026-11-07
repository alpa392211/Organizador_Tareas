# Project: Organizador_Tareas v1.3.1 ("pingüino")

## Architecture
Single Page Application (Vanilla JavaScript, Tailwind CSS v4, LocalStorage offline-first) with Android packaging via Capacitor.
- **Data & Persistence Layer**: `js/storage.js` manages LocalStorage keys, migration, custom schools, unlocked codes, active themes, and JSON export/import.
- **Academic Domain Layer**: `js/institutions.js` defines institutional identity, country metadata, slogans, and color palettes. Custom schools stored in LocalStorage are dynamically merged into this module.
- **Security & Secret Codes Vault**: `js/app.js` + `index.html` + `css/styles.css` manage secret code validation, alias normalization, padlock unlock animations, reveal modals, and visual badges.
- **Theme & Appearance Engine**: Root CSS classes (`html.theme-*`), CSS custom properties, and Tailwind utility classes. Independent toggles in Settings Accordion for every special theme and visual decoration.
- **UI & Navigation Controller**: `js/app.js` coordinates views, modals, drawer navigation, settings menus, and dashboard widgets.
- **Responsive Layout Engine**: Mobile-first architecture with tablet optimizations (`md:` 768px-1023px, `lg:` >=1024px) ensuring zero horizontal scrollbar (`scrollWidth === innerWidth`).
- **Widget Ecosystem**: `js/widgets.js` formats synchronizable payloads for Android native widgets and in-app dashboard cards.
- **Testing & Verification**: Automated headless test harness (`tests/run_all_tests.js`) running Chrome over `file://` with zero external dependencies.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Version Bump v1.3.1 "Pingüino" | Update package.json, version pills, index.html cache params (`?v=1.3.1`), and 5-tap secret trigger label | M3 | ORIGINAL_REQUEST |
| 2 | Catalog Expansion (Hispanic Institutions) | Add prestigious universities from México, Colombia, Argentina, Chile, Perú, España, and others in standard schema | M1 | ORIGINAL_REQUEST |
| 3 | Country Grouping & Filtering | Add country metadata (flag, code, name), country filter pills in Settings, and `<optgroup>` in native select dropdowns | M1 | ORIGINAL_REQUEST |
| 4 | Removal of "Escuelas en General" | Remove generic school from catalog while preserving `assets/general.svg` as notification fallback icon | M1 | ORIGINAL_REQUEST |
| 5 | Custom School Builder Modal | Allow users to create custom institutions with short name, full name, country, and academic system | M1 | ORIGINAL_REQUEST |
| 6 | Custom Photo/Logo Upload with Canvas Downsampling | Support image upload resized via HTML5 Canvas to 256x256 px Base64 (<30KB) to prevent LocalStorage quota overflow | M1 | ORIGINAL_REQUEST |
| 7 | Custom Motto/Lema Input | Allow users to define custom institutional slogans displayed in header, drawer, and identity modal | M1 | ORIGINAL_REQUEST |
| 8 | Free-Form Period Text Input | Allow users to manually type custom semester/trimester/module names without restriction | M1 | ORIGINAL_REQUEST |
| 9 | Period Storage Engine Fix | Fix `Storage.getAcademicPeriod()` to preserve custom typed periods and prevent fallback reversion | M1 | Explorer 1 |
| 10 | Secret Code Vault Multi-Format Parser | Remove restrictive 8-char UI limitation and support alias normalization (e.g., `EDUARDO`, `EDUARDO1`, `06062009`) | M2 | ORIGINAL_REQUEST |
| 11 | Padlock Unlock Animation | Transform `🔒` to `🔓` with radial emerald/gold glow (`vaultAuraBurst`), haptics, and success status | M2 | ORIGINAL_REQUEST |
| 12 | Dynamic Reveal Window Emerge | Window emerges dynamically (`vaultWindowPopEnter`) with staggered reveal of unlocked rewards | M2 | ORIGINAL_REQUEST |
| 13 | Apollo 11 Secret Code & Theme | Code `APOLLO11` unlocks cosmic space theme, 🚀 rocket badges on floating/nav buttons, and space celebration | M2 | ORIGINAL_REQUEST |
| 14 | 06062009 Secret Code & Starlight Tribute | Code `06062009` unlocks intimate starry window saying "Tu eres alguien especial por conocer esta fecha..." | M2 | ORIGINAL_REQUEST |
| 15 | Eduardo Creator Secret Code & Gold Theme | Code `EDUARDO` unlocks Founder VIP credential, Master Gold theme (`theme-eduardo-gold`), and 👑 badge | M2 | ORIGINAL_REQUEST |
| 16 | 11-Code Secret Vault Catalog | Complete catalog of >=10 codes (`PINGUINO`, `RETRO80S`, `MATRIX99`, `ZENPEACE`, `COFFEE42`, `ARCADE90`, `STUDYMAX`, `GATITOS_`) | M2 | ORIGINAL_REQUEST |
| 17 | Unlocked Secrets Inventory in Vault | Grid in `#view-secret-codes` displaying discovered protocols with quick toggle actions | M2 | Explorer 2 |
| 18 | Deactivable Special Themes System | Every special theme (Apollo, Eduardo Gold, Penguin, etc.) and visual decorator is 100% deactivable via toggles | M3 | ORIGINAL_REQUEST |
| 19 | Settings Menu Modern Reorganization | Structure Settings into 4 clear, polished menus (Identidad Académica, Apariencia, Interacción, Almacenamiento) | M3 | ORIGINAL_REQUEST |
| 20 | Settings Special Themes Switchboard | Dedicated panel in Settings with independent switches for all unlocked themes and button decorations | M3 | ORIGINAL_REQUEST |
| 21 | Tablet Header Overflow Fix | Eliminate horizontal scroll on tablets (<1210px) by collapsing redundant header items between 768px and 1023px | M4 | Explorer 3 |
| 22 | Tablet Layout Polishing | 2-column grid for Settings and Calendar on tablets; max-width card containers for Task list | M4 | ORIGINAL_REQUEST |
| 23 | Mobile UI Integrity Preservation | Ensure all mobile screens (320px-480px), bottom navigation bar, and drawers remain flawless | M4 | ORIGINAL_REQUEST |
| 24 | Widget JSON Payload Contract Fix | Fix property naming in `js/widgets.js` (`pendingTodayCount`, `nextTaskTitle`, `nextTaskSubject`, `institution.name`) | M4 | Explorer 3 |
| 25 | In-App Dashboard Widgets | Implement Quick Glance ("Mi Día al Momento"), Semester Progress Bar, and Upcoming Deadlines Card | M4 | ORIGINAL_REQUEST |
| 26 | Comprehensive E2E Test Suite (Tiers 1-4) | Automated headless test suite with >=11xN test cases verifying all features independently | M5 | Team Protocol |
| 27 | Tier 5 Adversarial Hardening & Final Gate | White-box adversarial testing, edge-case validation, 100% E2E test pass, and Forensic Integrity Audit | M6 | Team Protocol |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Academic Institutions & Custom School Builder | Expand Hispanic catalog, country grouping, custom school modal with canvas downsampling, free-form period input, and storage engine fix | none | DONE (Verified: 10/10 M1 tests, 307/307 suite, Reviewers APPROVE, Challengers APPROVE, Auditor CLEAN) |
| M2 | Secret Code Vault & Unlocking Animations | Unlock animation, dynamic reveal modal, alias normalizer, 11-code catalog (Apollo11, 06062009, Eduardo, etc.), and vault inventory | none | IN_PROGRESS (2273c78ba3e686873e80fa018bb59a40) |
| M3 | Theme Engine & Settings Reorganization | Deactivable theme classes, rocket badges, settings 4-menu reorganization, special themes switchboard, and version 1.3.1 bump | M1, M2 | PLANNED |
| M4 | Tablet Layout Optimization & Widget Ecosystem | Tablet header overflow fix (<1210px), 2-column tablet layout, widget payload sync fix, and in-app dashboard widgets | M3 | PLANNED |
| M5 | E2E Testing Suite (Tiers 1-4) | Build test runner `tests/run_all_tests.js` and comprehensive test cases covering Tiers 1-4 for all inventoried features | M1, M2, M3, M4 | DONE (307/307 tests passing, robustness 89/100, TEST_READY.md published) |
| M6 | Final Verification, Tier 5 Hardening & Forensic Audit | Achieve 100% E2E test pass, execute Tier 5 adversarial hardening, run forensic integrity audit, and prepare victory handoff | M5 | PLANNED |

---

## Interface Contracts

### 1. `InstitutionsModule` ↔ `StorageModule`
- `InstitutionsModule.getAllInstitutions()`: Returns standard institutions merged with custom institutions from `Storage.getCustomSchools()`.
- `InstitutionsModule.getInstitution(id)`: Returns institution definition for `id`, checking standard catalog first, then custom schools.
- `Storage.getAcademicPeriod()`: Returns saved string if set, supporting arbitrary custom text (does NOT revert to default if `inst.isCustom` or free-form).
- `Storage.saveCustomSchool(schoolData)`: Accepts `{ id, name, fullName, country, countryCode, countryFlag, slogan, icon (base64), systemType, colors, periods, isCustom: true }`, appends to `org_escolar_custom_institutions`, and dispatches update event.

### 2. `VaultModule / app.js` ↔ `StorageModule`
- `Storage.getUnlockedCodes()`: Returns array of unlocked code IDs (e.g. `['APOLLO11', '06062009', 'EDUARDO']`).
- `Storage.unlockCode(codeId)`: Adds code to unlocked array, persists in LocalStorage (`org_escolar_vault_unlocked_codes_v2`), and updates export/import payload.
- `Storage.isCodeUnlocked(codeId)`: Returns boolean indicating unlock status.
- `Storage.getActiveSpecialTheme()`: Returns currently active special theme ID (`'apollo'`, `'eduardo-gold'`, `'penguin'`, `'default'`, etc.).
- `Storage.setActiveSpecialTheme(themeId)`: Sets active theme and persists in `org_escolar_active_special_theme_v1`.
- `Storage.getApolloRocketsEnabled()`: Returns boolean for rocket badge display.
- `Storage.setApolloRocketsEnabled(bool)`: Persists rocket toggle state.

### 3. `Theme Engine` ↔ DOM
- Root classes on `<html>` or `<body>`: `.theme-apollo`, `.theme-eduardo-gold`, `.theme-penguin`, `.theme-synthwave`, `.theme-matrix`, `.theme-sakura`, `.theme-coffee`, `.theme-arcade`, `.theme-hyperfocus`.
- Rocket decoration: Elements with `.apollo-rocket-badge` dynamically toggled via `app.updateApolloRockets()`.
- Padlock animation classes: `.vault-lock-unlocking`, `.vault-lock-unlocked`.
- Reveal modal: `#vault-reveal-modal` with `.vault-window-enter`.

### 4. `WidgetSyncModule` ↔ Native / In-App Dashboard
- Payload schema:
  ```json
  {
    "pendingTodayCount": 3,
    "nextTaskTitle": "Examen de Cálculo",
    "nextTaskSubject": "Matemáticas",
    "institution": { "name": "UNAM", "period": "4.º Semestre" },
    "deadlines": [ ... ],
    "cycleProgress": { "percentage": 45, "daysRemaining": 62 }
  }
  ```

---

## Code Layout
- `index.html`: Main HTML entry point, view containers, modals, templates, and version meta.
- `css/input.css`: Tailwind CSS v4 input file.
- `css/tailwind.min.css`: Compiled Tailwind utility CSS (`npm run build:css`).
- `css/styles.css`: Custom animations, keyframes, theme definitions, and responsive overrides.
- `js/institutions.js`: Academic institution catalogs and SVG icon wrappers.
- `js/storage.js`: LocalStorage layer, schema migrations, and backup serialization.
- `js/app.js`: Central controller, navigation, vault unlock logic, and settings handlers.
- `js/widgets.js`: Android widget synchronization and in-app widget data calculation.
- `js/tasks.js`: Task management, celebrations, and urgency metrics.
- `assets/`: School icons, SVG badges, and notification fallback icons.
- `tests/run_all_tests.js`: Headless Puppeteer test runner covering Tiers 1-4.
- `TEST_READY.md`: E2E test suite readiness artifact.
