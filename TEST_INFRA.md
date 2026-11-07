# TEST_INFRA.md: Test Infrastructure & Verification Harness

## Architecture Overview
The automated testing harness for **Organizador_Tareas v1.3.1 ("Pingüino")** is designed for offline-first, requirement-driven, opaque-box end-to-end verification. It runs headless Chrome using `puppeteer-core` over the `file://` protocol directly loading `index.html`.

### Execution Environment
- **Runtime**: Node.js v20+
- **Driver**: `puppeteer-core` (`^25.16.0`)
- **Browser Binary**: `/usr/bin/google-chrome`
- **Target URL**: `file:///home/antigravity/alpa392211/Organizador_Tareas/index.html`
- **Browser Launch Arguments**:
  ```javascript
  [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-web-security',
    '--allow-file-access-from-files',
    '--disable-features=IsolateOrigins,site-per-process',
    '--window-size=1280,800'
  ]
  ```

---

## Test Directory Structure
```
Organizador_Tareas/
├── package.json               # Includes "test": "node tests/run_all_tests.js"
├── TEST_INFRA.md              # Infrastructure specification (this document)
├── TEST_READY.md              # Test readiness verification report
└── tests/
    ├── run_all_tests.js       # Master runner, CLI dispatcher, TAP / JSON aggregator
    ├── test_helpers.js        # Browser lifecycle, LocalStorage seed/clean, wait helpers
    ├── tier1_feature_coverage.js # T1: >=5 tests per feature (Features 1-27)
    ├── tier2_boundary_corner.js  # T2: >=5 boundary/corner tests per feature
    ├── tier3_cross_feature.js    # T3: Pairwise cross-feature interactions
    └── tier4_real_world.js       # T4: 5 realistic end-to-end student scenarios
```

---

## 4-Tier Test Framework

### Tier 1: Feature Coverage (Equivalence Classes)
- **Target**: >= 5 test cases per feature for Features F01 through F27.
- **Coverage**:
  - Positive functional validation of intended behavior.
  - Verification of DOM mutations, style classes, and LocalStorage state.
  - Total Target: >= 135 tests.

### Tier 2: Boundary & Corner Cases
- **Target**: >= 5 test cases per feature for Features F01 through F27.
- **Coverage**:
  - Empty strings, whitespace-only, extreme lengths (10KB+), special chars/emojis.
  - LocalStorage quota saturation handling and error recovery.
  - Multi-click race condition prevention and modal state idempotency.
  - Viewport edge sizes (320px, 768px, 1024px, 1440px).
  - Total Target: >= 135 tests.

### Tier 3: Cross-Feature Combinations (Pairwise)
- **Target**: >= 30 test cases combining multiple interdependent features.
- **Coverage**:
  - Custom School Builder + Theme Switching + Tablet Viewport.
  - Secret Code Unlocks + Padlock Animation + Theme Switchboard toggling.
  - Data Export/Import + Custom School Base64 Logo + Academic Period retention.
  - Widget payload generation + Dynamic secret theme active states.

### Tier 4: Real-World Application Scenarios
- **Target**: >= 5 comprehensive end-to-end user workflows.
- **Coverage**:
  - Scenario 1: New International Student Onboarding (Catalog filter -> Institution selection -> Course schedule).
  - Scenario 2: Private Academy Scholar with Custom Identity (Custom school creation -> Canvas logo upload -> Free-form period -> Slogan display).
  - Scenario 3: Secret Hunter Journey (Padlock unlock -> Apollo11 rocket badges -> 06062009 Starlight -> Eduardo Gold -> Theme switchboard deactivation).
  - Scenario 4: Cross-Device Responsiveness (Mobile 375px -> Tablet 768px -> Desktop 1280px without layout breakage or horizontal overflow).
  - Scenario 5: Disaster Recovery & Migration Cycle (Full data creation -> JSON export -> LocalStorage purge -> Import -> State fidelity check).

---

## Execution Commands

### Standard CLI Execution
```bash
# Run complete test suite
node tests/run_all_tests.js

# Or via npm script
npm test

# Run individual tiers
node tests/run_all_tests.js --tier=1
node tests/run_all_tests.js --tier=2
node tests/run_all_tests.js --tier=3
node tests/run_all_tests.js --tier=4
```

### Exit Codes & Diagnostics
- `0`: All tests executed successfully and passed.
- `1`: One or more test failures, timeouts, or unhandled exceptions.
- Detailed JSON reports generated at `tests/results/test_summary.json` for post-test analysis.
