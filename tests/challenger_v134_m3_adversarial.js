/**
 * challenger_v134_m3_adversarial.js
 * Adversarial Empirical Verification Suite for v1.34 Milestone 3:
 * - Unconfigured onboarding ("Hacerla después") with zero console/runtime exceptions
 * - Fallback institutional state across Header and Drawer ("Sin institución", "Sin periodo", graduation cap 🎓)
 * - Settings transition from unconfigured to configured (IPN, color sync, period update)
 * - Custom school builder modal stacking (z-[60] > z-50), cancellation, and auto-selection with period unlock
 * - Rapid spam state transitions and page reload persistence
 */

const assert = require('assert');
const helpers = require('./test_helpers');

let passedTests = 0;
let failedTests = 0;

function logPass(desc) {
    passedTests++;
    console.log(`  \x1b[32m[PASS]\x1b[0m ${desc}`);
}

function logFail(desc, err) {
    failedTests++;
    console.error(`  \x1b[31m[FAIL]\x1b[0m ${desc}: ${err ? (err.message || err) : ''}`);
}

function assertTest(condition, desc) {
    try {
        assert(condition, desc);
        logPass(desc);
    } catch (err) {
        logFail(desc, err);
    }
}

function assertEqual(actual, expected, desc) {
    try {
        assert.strictEqual(actual, expected, `${desc} (expected: ${expected}, got: ${actual})`);
        logPass(desc);
    } catch (err) {
        logFail(desc, err);
    }
}

function assertTrue(condition, desc) {
    assertTest(Boolean(condition), desc);
}

function assertFalse(condition, desc) {
    assertTest(!condition, desc);
}

(async () => {
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[35m  ADVERSARIAL EMPIRICAL CHALLENGE SUITE: MILESTONE 3 (v1.3.4)                  \x1b[0m');
    console.log('\x1b[1m\x1b[35m  Unconfigured Onboarding, Stacking Context, Reactivity, & Resilience          \x1b[0m');
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m\n');

    const browser = await helpers.launchBrowser();

    // Track all console errors and uncaught exceptions
    const jsConsoleErrors = [];
    const resourceErrors = [];
    const pageErrors = [];

    try {
        const page = await helpers.createPage(browser, { viewport: { width: 400, height: 820 } });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (text.includes('net::ERR_') || text.includes('Failed to load resource')) {
                    resourceErrors.push(text);
                } else {
                    jsConsoleErrors.push(text);
                    console.error(`  \x1b[33m[Browser Console Error]\x1b[0m ${text}`);
                }
            }
        });

        page.on('pageerror', err => {
            pageErrors.push(err.message);
            console.error(`  \x1b[31m[Browser Page Error]\x1b[0m ${err.message}`);
        });

        // =====================================================================
        // TEST GROUP 1: Clean Slate & Welcome Modal First-Time Trigger
        // =====================================================================
        console.log('\x1b[1m--- [Test Group 1] Clean Slate & Welcome Modal First-Time Trigger ---\x1b[0m');

        // Reset storage completely
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.reload({ waitUntil: 'load' });
        // Allow onboarding check (400ms delay in app.js) to fire
        await new Promise(r => setTimeout(r, 600));

        const welcomeState = await page.evaluate(() => {
            const modal = document.getElementById('cycle-setup-modal');
            const customModal = document.getElementById('custom-school-modal');
            const selects = modal ? modal.querySelectorAll('select') : [];
            const isVisible = modal && !modal.classList.contains('hidden') && modal.classList.contains('flex');
            const hasCreateBtn = Boolean(document.getElementById('welcome-create-school-btn'));
            const hasSkipBtn = Boolean(document.getElementById('welcome-skip-school-btn'));
            const hasCountryPills = Boolean(document.getElementById('welcome-country-pills'));
            const hasSchoolsGrid = Boolean(document.getElementById('welcome-schools-grid'));
            const hasPeriodContainer = Boolean(document.getElementById('welcome-period-container'));

            const modalZIndex = modal ? window.getComputedStyle(modal).zIndex : '';
            const customZIndex = customModal ? window.getComputedStyle(customModal).zIndex : '';

            return {
                isVisible,
                selectCount: selects.length,
                hasCreateBtn,
                hasSkipBtn,
                hasCountryPills,
                hasSchoolsGrid,
                hasPeriodContainer,
                modalZIndex,
                customZIndex
            };
        });

        assertTrue(welcomeState.isVisible, 'Welcome modal (#cycle-setup-modal) opens automatically on clean start');
        assertEqual(welcomeState.selectCount, 0, 'Zero native <select> elements inside welcome modal (100% interactive cards/chips)');
        assertTrue(welcomeState.hasCreateBtn, 'Welcome modal includes "➕ Crear mi propia escuela" action');
        assertTrue(welcomeState.hasSkipBtn, 'Welcome modal includes "⏭️ Hacerla después" skip action');
        assertTrue(welcomeState.hasCountryPills, 'Welcome modal includes country filter pills container');
        assertTrue(welcomeState.hasSchoolsGrid, 'Welcome modal includes interactive schools grid');
        assertTrue(welcomeState.hasPeriodContainer, 'Welcome modal includes academic period container');
        assertEqual(welcomeState.modalZIndex, '50', 'Welcome modal computed z-index is 50');

        // =====================================================================
        // TEST GROUP 2: "Hacerla después" Skip Action & Lock State Machine
        // =====================================================================
        console.log('\n\x1b[1m--- [Test Group 2] "Hacerla después" Skip Action & Lock State Machine ---\x1b[0m');

        // Click "⏭️ Hacerla después"
        await page.click('#welcome-skip-school-btn');
        await new Promise(r => setTimeout(r, 200));

        const lockAudit = await page.evaluate(() => {
            const container = document.getElementById('welcome-period-container');
            const lockMsg = document.getElementById('welcome-period-locked-msg');
            const chips = document.getElementById('welcome-period-chips');
            const schoolBox = document.getElementById('welcome-selected-school-box');
            const periodBadge = document.getElementById('welcome-selected-period-badge');

            return {
                opacity40: container?.classList.contains('opacity-40'),
                pointerEventsNone: container?.classList.contains('pointer-events-none'),
                cursorNotAllowed: container?.classList.contains('cursor-not-allowed'),
                ariaDisabled: container?.getAttribute('aria-disabled'),
                lockMsgVisible: lockMsg && !lockMsg.classList.contains('hidden'),
                lockMsgText: lockMsg ? lockMsg.textContent.trim() : '',
                chipsCount: chips ? chips.children.length : -1,
                schoolBoxText: schoolBox ? schoolBox.textContent : '',
                badgeText: periodBadge ? periodBadge.textContent : ''
            };
        });

        assertTrue(lockAudit.opacity40, '#welcome-period-container has opacity-40 while locked');
        assertTrue(lockAudit.pointerEventsNone, '#welcome-period-container has pointer-events-none while locked');
        assertTrue(lockAudit.cursorNotAllowed, '#welcome-period-container has cursor-not-allowed while locked');
        assertEqual(lockAudit.ariaDisabled, 'true', '#welcome-period-container has aria-disabled="true"');
        assertTrue(lockAudit.lockMsgVisible, '#welcome-period-locked-msg is visible and explains school requirement');
        assertTrue(lockAudit.lockMsgText.includes('Selecciona o crea una institución'), 'Advisory guidance instructs user to select or create school');
        assertEqual(lockAudit.chipsCount, 0, 'Period chips container is completely cleared while locked');
        assertTrue(
            lockAudit.schoolBoxText.includes('Sin institución') && lockAudit.schoolBoxText.includes('Omitida'),
            'Active school box displays blank/omitted placeholder indicating Sin institución (Omitida)'
        );
        assertTrue(lockAudit.badgeText.includes('Bloqueado'), 'Selected period badge indicates "🔒 Bloqueado"');

        // =====================================================================
        // TEST GROUP 3: Lock/Unlock State Resilience & Rapid Spamming
        // =====================================================================
        console.log('\n\x1b[1m--- [Test Group 3] Lock/Unlock State Resilience & Rapid Spamming ---\x1b[0m');

        // Rapid toggle between schools and skip
        for (let i = 0; i < 3; i++) {
            // Pick UNAM
            await page.evaluate(() => {
                const unam = document.querySelector('.welcome-school-card[data-inst-id="unam"]');
                if (unam) unam.click();
            });
            await new Promise(r => setTimeout(r, 60));

            // Verify unlocked
            const unamUnlocked = await page.evaluate(() => {
                const container = document.getElementById('welcome-period-container');
                const chips = document.querySelectorAll('.welcome-period-chip');
                return !container.classList.contains('pointer-events-none') && chips.length > 0;
            });
            assertTrue(unamUnlocked, `Cycle ${i+1}: UNAM selection unlocks period container with semestral chips`);

            // Skip school
            await page.click('#welcome-skip-school-btn');
            await new Promise(r => setTimeout(r, 60));

            // Verify locked
            const relocked = await page.evaluate(() => {
                const container = document.getElementById('welcome-period-container');
                const lockMsg = document.getElementById('welcome-period-locked-msg');
                return container.classList.contains('pointer-events-none') && !lockMsg.classList.contains('hidden');
            });
            assertTrue(relocked, `Cycle ${i+1}: Clicking "Hacerla después" re-engages lock state machine`);
        }

        // =====================================================================
        // TEST GROUP 4: Complete Onboarding with "Hacerla después" & Shell Audit
        // =====================================================================
        console.log('\n\x1b[1m--- [Test Group 4] Complete Onboarding with "Hacerla después" & Shell Audit ---\x1b[0m');

        // Submit onboarding with provisional cycle
        await page.click('#welcome-cycle-later-btn');
        // Wait for modal fade out transition
        await new Promise(r => setTimeout(r, 400));

        const shellAudit = await page.evaluate(() => {
            const Storage = window.StorageModule;
            const welcomeModal = document.getElementById('cycle-setup-modal');
            const headerName = document.getElementById('header-inst-name')?.textContent?.trim();
            const headerPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const headerLogoHtml = document.getElementById('header-inst-logo')?.innerHTML || '';
            const headerSelect = document.getElementById('header-institution-select');

            const isSkipped = Storage.isSchoolSkipped();
            const instId = Storage.getInstitution();
            const period = Storage.getAcademicPeriod();
            const onboardingDone = Storage.isOnboardingCompleted();
            const isProvisional = Storage.isCycleProvisional();

            return {
                modalClosed: welcomeModal ? welcomeModal.classList.contains('hidden') : false,
                isSkipped,
                instId,
                period,
                onboardingDone,
                isProvisional,
                headerName,
                headerPeriod,
                headerHasCap: headerLogoHtml.includes('🎓'),
                headerSelectValue: headerSelect ? headerSelect.value : null,
                hasUnconfOption: headerSelect ? Boolean(headerSelect.querySelector('option[value="unconfigured"]')) : false
            };
        });

        assertTrue(shellAudit.modalClosed, 'Welcome modal closed cleanly after onboarding submission');
        assertTrue(shellAudit.onboardingDone, 'Storage records onboarding as completed');
        assertTrue(shellAudit.isProvisional, 'Storage records cycle as provisional when choosing "Hacerla después"');
        assertTrue(shellAudit.isSkipped, 'Storage.isSchoolSkipped() is true');
        assertEqual(shellAudit.instId, 'unconfigured', 'Storage.getInstitution() is "unconfigured"');
        assertEqual(shellAudit.period, 'Sin periodo', 'Storage.getAcademicPeriod() is "Sin periodo"');
        assertEqual(shellAudit.headerName, 'Sin institución', 'Header institutional name displays "Sin institución"');
        assertEqual(shellAudit.headerPeriod, 'Sin periodo', 'Header institutional period displays "Sin periodo"');
        assertTrue(shellAudit.headerHasCap, 'Header institutional icon renders graduation cap 🎓 frame');

        // Adversarial check on header-institution-select
        assertEqual(
            shellAudit.headerSelectValue,
            'unconfigured',
            'Header institution selector (#header-institution-select) properly syncs to "unconfigured"'
        );

        // Drawer inspection in unconfigured state
        console.log('Inspecting mobile drawer in unconfigured state...');
        await page.click('#drawer-toggle-btn');
        await new Promise(r => setTimeout(r, 350));

        const drawerAudit = await page.evaluate(() => {
            const drawer = document.getElementById('sidebar-drawer');
            const drawerName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const drawerPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const drawerLogoHtml = document.getElementById('drawer-inst-logo')?.innerHTML || '';
            const drawerSlogan = document.getElementById('drawer-inst-slogan')?.textContent?.trim();
            const isOpen = drawer && !drawer.classList.contains('-translate-x-full');

            return {
                isOpen,
                drawerName,
                drawerPeriod,
                drawerHasCap: drawerLogoHtml.includes('🎓'),
                drawerSlogan
            };
        });

        assertTrue(drawerAudit.isOpen, 'Sidebar drawer opens successfully');
        assertEqual(drawerAudit.drawerName, 'Sin institución', 'Drawer institutional name displays "Sin institución"');
        assertEqual(drawerAudit.drawerPeriod, 'Sin periodo', 'Drawer institutional period displays "Sin periodo"');
        assertTrue(drawerAudit.drawerHasCap, 'Drawer institutional icon renders graduation cap 🎓 frame');
        assertTrue(drawerAudit.drawerSlogan.includes('Organiza tus metas escolares'), 'Drawer displays default slogan for unconfigured school');

        // Close drawer
        await page.click('#drawer-close-btn');
        await new Promise(r => setTimeout(r, 350));

        // Check JS runtime errors so far
        assertEqual(jsConsoleErrors.length, 0, 'Zero uncaught JavaScript console errors during clean start and unconfigured onboarding');
        assertEqual(pageErrors.length, 0, 'Zero unhandled page errors during clean start and unconfigured onboarding');

        // =====================================================================
        // TEST GROUP 5: View Switching & Widget Rendering in Unconfigured State
        // =====================================================================
        console.log('\n\x1b[1m--- [Test Group 5] View Switching & Widget Rendering in Unconfigured State ---\x1b[0m');

        const viewsToTest = ['tasks', 'subjects', 'calendar', 'notes', 'archive', 'settings', 'secret-codes'];
        for (const v of viewsToTest) {
            await page.evaluate((targetView) => {
                window.app.switchView(targetView);
            }, v);
            await new Promise(r => setTimeout(r, 120));

            const viewActive = await page.evaluate((targetView) => {
                const el = document.getElementById(`view-${targetView}`);
                return el && !el.classList.contains('hidden');
            }, v);
            assertTrue(viewActive, `Switched to view "${v}" without crashing in unconfigured state`);
        }

        assertEqual(jsConsoleErrors.length, 0, 'Zero JavaScript errors across all views in unconfigured state');
        assertEqual(pageErrors.length, 0, 'Zero page exceptions across all views in unconfigured state');

        // =====================================================================
        // TEST GROUP 6: Smooth Transition from Unconfigured to Configured (IPN)
        // =====================================================================
        console.log('\n\x1b[1m--- [Test Group 6] Smooth Transition from Unconfigured to Configured (IPN) ---\x1b[0m');

        // In Settings view, inspect settings preview before transition
        const settingsPreTransition = await page.evaluate(() => {
            const name = document.getElementById('settings-inst-name')?.textContent?.trim();
            const logo = document.getElementById('settings-inst-logo-container')?.innerHTML || '';
            const isSkipped = window.StorageModule.isSchoolSkipped();
            return { name, hasCap: logo.includes('🎓'), isSkipped };
        });

        assertEqual(settingsPreTransition.name, 'Sin institución', 'Settings preview displays "Sin institución" before selection');
        assertTrue(settingsPreTransition.hasCap, 'Settings preview displays graduation cap 🎓 icon');
        assertTrue(settingsPreTransition.isSkipped, 'Storage isSchoolSkipped() is true before selection');

        // Click IPN card in settings gallery
        const ipnClicked = await page.evaluate(() => {
            const card = document.querySelector('#settings-institution-grid button[data-inst-id="ipn"]');
            if (card) {
                card.click();
                return true;
            }
            return false;
        });
        assertTrue(ipnClicked, 'IPN card found and clicked in #settings-institution-grid');
        await new Promise(r => setTimeout(r, 300));

        const configuredTransitionAudit = await page.evaluate(() => {
            const Storage = window.StorageModule;
            const isSkipped = Storage.isSchoolSkipped();
            const instId = Storage.getInstitution();
            const period = Storage.getAcademicPeriod();
            const headerName = document.getElementById('header-inst-name')?.textContent?.trim();
            const headerPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const headerLogoHtml = document.getElementById('header-inst-logo')?.innerHTML || '';
            const drawerName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const drawerPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const drawerLogoHtml = document.getElementById('drawer-inst-logo')?.innerHTML || '';
            const settingsName = document.getElementById('settings-inst-name')?.textContent?.trim();
            const primaryCssVar = document.documentElement.style.getPropertyValue('--inst-primary');

            return {
                isSkipped,
                instId,
                period,
                headerName,
                headerPeriod,
                headerLogoHtml,
                drawerName,
                drawerPeriod,
                drawerLogoHtml,
                settingsName,
                primaryCssVar
            };
        });

        assertFalse(configuredTransitionAudit.isSkipped, 'Selecting IPN automatically clears isSchoolSkipped (now false)');
        assertEqual(configuredTransitionAudit.instId, 'ipn', 'Storage.getInstitution() updated immediately to "ipn"');
        assertTrue(configuredTransitionAudit.headerName.includes('IPN'), 'Header name smoothly updated to "IPN"');
        assertTrue(configuredTransitionAudit.drawerName.includes('IPN'), 'Drawer name updated to "IPN"');
        assertTrue(configuredTransitionAudit.settingsName.includes('IPN'), 'Settings preview updated to "IPN"');
        assertEqual(configuredTransitionAudit.primaryCssVar.toUpperCase(), '#6C1D45', 'Document root --inst-primary CSS variable updated to IPN maroon (#6C1D45)');
        assertTrue(
            configuredTransitionAudit.headerLogoHtml.includes('ipn') || configuredTransitionAudit.headerLogoHtml.includes('assets/logos/escuelas/ipn.png'),
            'Header logo updated with official IPN crest'
        );

        // Adversarial check: Academic period must transition from "Sin periodo" to a valid IPN period
        assertFalse(
            configuredTransitionAudit.period === 'Sin periodo',
            'Academic period automatically transitions from "Sin periodo" to IPN period (not stuck at "Sin periodo")'
        );
        assertFalse(
            configuredTransitionAudit.headerPeriod === 'Sin periodo',
            'Header period automatically transitions from "Sin periodo" to IPN period (not stuck at "Sin periodo")'
        );
        assertFalse(
            configuredTransitionAudit.drawerPeriod === 'Sin periodo',
            'Drawer period automatically transitions from "Sin periodo" to IPN period (not stuck at "Sin periodo")'
        );

        // Test updating period chip in Settings
        console.log('Testing period pill selection in Settings...');
        const periodUpdated = await page.evaluate(() => {
            const pill3 = Array.from(document.querySelectorAll('.period-pill-btn'))
                .find(b => b.textContent.includes('3.º Semestre'));
            if (pill3) {
                pill3.click();
                return true;
            }
            return false;
        });
        assertTrue(periodUpdated, 'Clicked "3.º Semestre" period pill in settings');
        await new Promise(r => setTimeout(r, 200));

        const periodSync = await page.evaluate(() => {
            const Storage = window.StorageModule;
            const periodInStorage = Storage.getAcademicPeriod();
            const headerPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const drawerPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            return { periodInStorage, headerPeriod, drawerPeriod };
        });

        assertEqual(periodSync.periodInStorage, '3.º Semestre', 'Storage.getAcademicPeriod() updated to "3.º Semestre"');
        assertEqual(periodSync.headerPeriod, '3.º Semestre', 'Header period synced to "3.º Semestre"');
        assertEqual(periodSync.drawerPeriod, '3.º Semestre', 'Drawer period synced to "3.º Semestre"');

        // =====================================================================
        // TEST GROUP 7: Custom School Modal Stacking Context & Auto-Selection
        // =====================================================================
        console.log('\n\x1b[1m--- [Test Group 7] Custom School Modal Stacking Context & Auto-Selection ---\x1b[0m');

        // Open welcome modal afresh to test stacking in onboarding flow
        await page.evaluate(() => {
            window.app.openCycleWelcomeModal();
        });
        await new Promise(r => setTimeout(r, 250));

        // Click "➕ Crear mi propia escuela"
        await page.click('#welcome-create-school-btn');
        await new Promise(r => setTimeout(r, 250));

        const stackingAudit = await page.evaluate(() => {
            const welcomeModal = document.getElementById('cycle-setup-modal');
            const customModal = document.getElementById('custom-school-modal');

            const welcomeStyle = window.getComputedStyle(welcomeModal);
            const customStyle = window.getComputedStyle(customModal);

            const welcomeZ = parseInt(welcomeStyle.zIndex, 10);
            const customZ = parseInt(customStyle.zIndex, 10);

            const welcomeVisible = !welcomeModal.classList.contains('hidden') && welcomeStyle.display !== 'none';
            const customVisible = !customModal.classList.contains('hidden') && customStyle.display !== 'none';

            return {
                welcomeVisible,
                customVisible,
                welcomeZ,
                customZ,
                customClass: customModal.className,
                customIsHigher: customZ > welcomeZ
            };
        });

        assertTrue(stackingAudit.welcomeVisible, 'Welcome modal remains in DOM beneath custom school modal');
        assertTrue(stackingAudit.customVisible, 'Custom school modal opens and is visible');
        assertTrue(stackingAudit.customClass.includes('z-[60]'), 'Custom school modal explicitly declares z-[60]');
        assertEqual(stackingAudit.welcomeZ, 50, 'Welcome modal z-index is 50');
        assertEqual(stackingAudit.customZ, 60, 'Custom school modal z-index is 60');
        assertTrue(stackingAudit.customIsHigher, 'Custom school modal z-index (60) strictly stacks higher than welcome modal (50)');

        // Test canceling custom school modal: welcome modal must remain open and unaffected
        console.log('Testing custom school modal cancellation...');
        await page.click('#custom-school-cancel-btn');
        await new Promise(r => setTimeout(r, 300));

        const cancelAudit = await page.evaluate(() => {
            const welcomeModal = document.getElementById('cycle-setup-modal');
            const customModal = document.getElementById('custom-school-modal');
            return {
                welcomeVisible: !welcomeModal.classList.contains('hidden'),
                customClosed: customModal.classList.contains('hidden')
            };
        });

        assertTrue(cancelAudit.customClosed, 'Custom school modal closed after clicking cancel');
        assertTrue(cancelAudit.welcomeVisible, 'Welcome modal remained open and interactive after canceling custom builder');

        // Re-open custom school modal to test school creation
        console.log('Testing custom school creation and automatic selection in onboarding...');
        await page.click('#welcome-create-school-btn');
        await new Promise(r => setTimeout(r, 250));

        // Fill custom school builder form with Cuatrimestral system
        await page.evaluate(() => {
            document.getElementById('custom-school-name').value = 'Universidad Robótica Global';
            document.getElementById('custom-school-shortbadge').value = 'URG';
            document.getElementById('custom-school-fullname').value = 'Universidad Robótica Global de Colombia';
            document.getElementById('custom-school-slogan').value = 'Innovación y Futuro Automatizado';
            document.getElementById('custom-school-country').value = 'CO';
            document.getElementById('custom-school-system').value = 'Cuatrimestral';
            document.getElementById('custom-school-color').value = '#0D9488';
            document.getElementById('custom-school-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        });
        await new Promise(r => setTimeout(r, 450));

        const customCreationAudit = await page.evaluate(() => {
            const welcomeModal = document.getElementById('cycle-setup-modal');
            const customModal = document.getElementById('custom-school-modal');
            const schoolBox = document.getElementById('welcome-selected-school-box');
            const periodContainer = document.getElementById('welcome-period-container');
            const lockMsg = document.getElementById('welcome-period-locked-msg');
            const chips = Array.from(document.querySelectorAll('.welcome-period-chip')).map(c => c.textContent.trim());
            const periodBadge = document.getElementById('welcome-selected-period-badge');

            return {
                customModalClosed: customModal.classList.contains('hidden'),
                welcomeModalOpen: !welcomeModal.classList.contains('hidden'),
                schoolBoxText: schoolBox ? schoolBox.textContent : '',
                periodUnlocked: !periodContainer.classList.contains('pointer-events-none'),
                lockMsgHidden: lockMsg.classList.contains('hidden'),
                chipsCount: chips.length,
                chipsSample: chips.slice(0, 3),
                badgeText: periodBadge ? periodBadge.textContent : ''
            };
        });

        assertTrue(customCreationAudit.customModalClosed, 'Custom school modal closed after save');
        assertTrue(customCreationAudit.welcomeModalOpen, 'Welcome modal remains open ready for final onboarding');
        assertTrue(customCreationAudit.schoolBoxText.includes('Universidad Robótica Global'), 'New custom school auto-selected in welcome box');
        assertTrue(customCreationAudit.schoolBoxText.includes('URG'), 'School box displays custom badge URG');
        assertTrue(customCreationAudit.periodUnlocked, 'Period selector container dynamically UNLOCKED for new custom school');
        assertTrue(customCreationAudit.lockMsgHidden, 'Period lock warning message is hidden');
        assertTrue(customCreationAudit.chipsCount >= 10, 'Period chips populated with cuatrimestral options (>=10)');
        assertTrue(customCreationAudit.chipsSample.some(c => c.includes('Cuatrimestre')), 'Chips correspond to Cuatrimestral academic system');

        // Select a custom period chip (e.g. 2.º Cuatrimestre)
        const customChipSelected = await page.evaluate(() => {
            const chip2 = Array.from(document.querySelectorAll('.welcome-period-chip'))
                .find(c => c.textContent.includes('2.º Cuatrimestre'));
            if (chip2) {
                chip2.click();
                return true;
            }
            return false;
        });
        assertTrue(customChipSelected, 'Selected "2.º Cuatrimestre" chip for custom school');
        await new Promise(r => setTimeout(r, 150));

        // Submit welcome modal with custom school
        await page.evaluate(() => {
            document.getElementById('welcome-cycle-start').value = '2026-09-01';
            document.getElementById('welcome-cycle-end').value = '2026-12-20';
            document.getElementById('welcome-cycle-save-btn').click();
        });
        await new Promise(r => setTimeout(r, 450));

        const customActiveAudit = await page.evaluate(() => {
            const Storage = window.StorageModule;
            const instId = Storage.getInstitution();
            const period = Storage.getAcademicPeriod();
            const isSkipped = Storage.isSchoolSkipped();
            const headerName = document.getElementById('header-inst-name')?.textContent?.trim();
            const headerPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const drawerName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const drawerPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const primaryVar = document.documentElement.style.getPropertyValue('--inst-primary');

            return {
                instId,
                period,
                isSkipped,
                headerName,
                headerPeriod,
                drawerName,
                drawerPeriod,
                primaryVar
            };
        });

        assertFalse(customActiveAudit.isSkipped, 'Storage isSchoolSkipped() is false with custom school active');
        assertTrue(customActiveAudit.instId.startsWith('custom_'), 'Storage active institution is the newly created custom school ID');
        assertEqual(customActiveAudit.period, '2.º Cuatrimestre', 'Storage academic period is "2.º Cuatrimestre"');
        assertEqual(customActiveAudit.headerName, 'Universidad Robótica Global', 'Header displays custom school name');
        assertEqual(customActiveAudit.headerPeriod, '2.º Cuatrimestre', 'Header displays custom school period');
        assertEqual(customActiveAudit.drawerName, 'Universidad Robótica Global', 'Drawer displays custom school name');
        assertEqual(customActiveAudit.primaryVar.toLowerCase(), '#0d9488', 'Document root --inst-primary matches custom school color (#0d9488)');

        // Adversarial check: Drawer period must match Header period
        assertEqual(
            customActiveAudit.drawerPeriod,
            '2.º Cuatrimestre',
            'Drawer displays custom school period "2.º Cuatrimestre" (synchronized with header)'
        );

        // =====================================================================
        // TEST GROUP 8: Persistence Across Page Reloads in Skipped State
        // =====================================================================
        console.log('\n\x1b[1m--- [Test Group 8] Persistence Across Page Reloads in Skipped State ---\x1b[0m');

        // Set back to skipped state to test persistence after reload
        await page.evaluate(() => {
            const Storage = window.StorageModule;
            Storage.setSchoolSkipped(true);
            Storage.setInstitution('unconfigured');
            Storage.setAcademicPeriod('Sin periodo');
            Storage.setOnboardingCompleted(true);
            Storage.setCycleConfigured(true);
        });
        await page.reload({ waitUntil: 'load' });
        await new Promise(r => setTimeout(r, 500));

        const reloadAudit = await page.evaluate(() => {
            const Storage = window.StorageModule;
            const welcomeModal = document.getElementById('cycle-setup-modal');
            const headerName = document.getElementById('header-inst-name')?.textContent?.trim();
            const headerPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const headerLogoHtml = document.getElementById('header-inst-logo')?.innerHTML || '';
            const isSkipped = Storage.isSchoolSkipped();
            const instId = Storage.getInstitution();
            const period = Storage.getAcademicPeriod();

            return {
                welcomeModalHidden: welcomeModal ? welcomeModal.classList.contains('hidden') : true,
                isSkipped,
                instId,
                period,
                headerName,
                headerPeriod,
                headerHasCap: headerLogoHtml.includes('🎓')
            };
        });

        assertTrue(reloadAudit.welcomeModalHidden, 'Welcome modal does not inappropriately re-open after reload when skipped');
        assertTrue(reloadAudit.isSkipped, 'Storage isSchoolSkipped() persists as true after reload');
        assertEqual(reloadAudit.instId, 'unconfigured', 'Storage getInstitution() persists as "unconfigured" after reload');
        assertEqual(reloadAudit.period, 'Sin periodo', 'Storage getAcademicPeriod() persists as "Sin periodo" after reload');
        assertEqual(reloadAudit.headerName, 'Sin institución', 'Header displays "Sin institución" immediately after reload');
        assertEqual(reloadAudit.headerPeriod, 'Sin periodo', 'Header displays "Sin periodo" immediately after reload');
        assertTrue(reloadAudit.headerHasCap, 'Header retains graduation cap 🎓 icon immediately after reload');

        // Final error audit
        assertEqual(jsConsoleErrors.length, 0, 'Zero uncaught JavaScript console errors recorded across the ENTIRE test run');
        assertEqual(pageErrors.length, 0, 'Zero uncaught page errors recorded across the ENTIRE test run');

    } catch (err) {
        console.error('\x1b[31mFatal test failure in challenger suite:\x1b[0m', err);
        failedTests++;
    } finally {
        await browser.close();
    }

    console.log('\n\x1b[1m\x1b[35m================================================================================\x1b[0m');
    console.log('\x1b[1mADVERSARIAL CHALLENGE EXECUTION SUMMARY:\x1b[0m');
    console.log(`  Passed Tests: \x1b[32m\x1b[1m${passedTests}\x1b[0m`);
    console.log(`  Failed Tests: \x1b[31m\x1b[1m${failedTests}\x1b[0m`);
    console.log(`  JavaScript Console Errors: ${jsConsoleErrors.length}`);
    console.log(`  Page Runtime Exceptions:   ${pageErrors.length}`);
    console.log(`  Resource Load Failures:    ${resourceErrors.length}`);
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m\n');

    if (failedTests > 0) {
        console.error('\x1b[31m\x1b[1mVERDICT: REQUEST_CHANGES (Adversarial challenge detected regressions or failures)\x1b[0m');
        process.exit(1);
    } else {
        console.log('\x1b[32m\x1b[1mVERDICT: APPROVE (All adversarial stress tests, stacking, and resilience passed flawlessly)\x1b[0m');
        process.exit(0);
    }
})();
