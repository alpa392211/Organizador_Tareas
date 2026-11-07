/**
 * test_welcome_modal_m3.js - Milestone 3 E2E Verification Suite (v1.3.4)
 * Verifies Welcome Modal Modernization, Zero Native Selects, Interactive Cards/Chips,
 * Lock/Unlock State Machine, "Crear mi propia escuela", "Hacerla después",
 * and Unconfigured School Resilience.
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
    console.error(`  \x1b[31m[FAIL]\x1b[0m ${desc}: ${err.message || err}`);
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
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[36m  TEST SUITE: MILESTONE 3 - FIRST-TIME WELCOME MODAL REDESIGN (v1.3.4)  \x1b[0m');
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m\n');

    const browser = await helpers.launchBrowser();

    try {
        const page = await helpers.createPage(browser, { viewport: { width: 360, height: 740 } });

        // =====================================================================
        // GROUP 1: Zero Native <select> Elements & DOM Architecture
        // =====================================================================
        console.log('\x1b[1m--- [Group 1] Zero Native <select> Elements & DOM Architecture ---\x1b[0m');

        // Reset and trigger welcome modal
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('org_escolar_initialized_v3', 'true');
            if (window.app && typeof window.app.openCycleWelcomeModal === 'function') {
                window.app.openCycleWelcomeModal();
            }
        });
        await new Promise(r => setTimeout(r, 400));

        const domAudit = await page.evaluate(() => {
            const modal = document.getElementById('cycle-setup-modal');
            const customModal = document.getElementById('custom-school-modal');
            const selectsInsideModal = modal ? modal.querySelectorAll('select') : [];
            const createBtn = document.getElementById('welcome-create-school-btn');
            const skipBtn = document.getElementById('welcome-skip-school-btn');
            const countryPills = document.getElementById('welcome-country-pills');
            const schoolsGrid = document.getElementById('welcome-schools-grid');
            const periodContainer = document.getElementById('welcome-period-container');
            const periodLockedMsg = document.getElementById('welcome-period-locked-msg');
            const periodChips = document.getElementById('welcome-period-chips');
            const selectedSchoolBox = document.getElementById('welcome-selected-school-box');

            return {
                modalFound: Boolean(modal),
                selectCount: selectsInsideModal.length,
                createBtnFound: Boolean(createBtn),
                skipBtnFound: Boolean(skipBtn),
                countryPillsFound: Boolean(countryPills),
                schoolsGridFound: Boolean(schoolsGrid),
                periodContainerFound: Boolean(periodContainer),
                periodLockedMsgFound: Boolean(periodLockedMsg),
                periodChipsFound: Boolean(periodChips),
                selectedSchoolBoxFound: Boolean(selectedSchoolBox),
                customModalZIndex: customModal ? window.getComputedStyle(customModal).zIndex : '',
                customModalClass: customModal ? customModal.className : ''
            };
        });

        assertTrue(domAudit.modalFound, '#cycle-setup-modal exists in DOM');
        assertEqual(domAudit.selectCount, 0, 'Zero native <select> elements exist inside #cycle-setup-modal');
        assertTrue(domAudit.createBtnFound, '#welcome-create-school-btn exists in welcome modal');
        assertTrue(domAudit.skipBtnFound, '#welcome-skip-school-btn exists in welcome modal');
        assertTrue(domAudit.countryPillsFound, '#welcome-country-pills container exists');
        assertTrue(domAudit.schoolsGridFound, '#welcome-schools-grid container exists');
        assertTrue(domAudit.periodContainerFound, '#welcome-period-container exists');
        assertTrue(domAudit.periodLockedMsgFound, '#welcome-period-locked-msg exists');
        assertTrue(domAudit.periodChipsFound, '#welcome-period-chips exists');
        assertTrue(domAudit.selectedSchoolBoxFound, '#welcome-selected-school-box exists');
        assertTrue(
            domAudit.customModalClass.includes('z-[60]') || parseInt(domAudit.customModalZIndex, 10) >= 60,
            '#custom-school-modal has elevated z-[60] to stack above welcome modal (z-50)'
        );

        // =====================================================================
        // GROUP 2: InstitutionsModule UNCONFIGURED_INSTITUTION Contract
        // =====================================================================
        console.log('\n\x1b[1m--- [Group 2] InstitutionsModule UNCONFIGURED_INSTITUTION Contract ---\x1b[0m');

        const instModuleAudit = await page.evaluate(() => {
            const Mod = window.InstitutionsModule;
            const unconf = Mod?.UNCONFIGURED_INSTITUTION;
            const lookupUnconf = Mod?.getInstitution('unconfigured');
            const lookupEmpty = Mod?.getInstitution('');
            const lookupNull = Mod?.getInstitution(null);
            const lookupNone = Mod?.getInstitution('none');
            const iconHtml = Mod?.renderIconHtml(unconf);

            return {
                hasUnconfiguredObj: Boolean(unconf),
                unconfId: unconf?.id,
                unconfName: unconf?.name,
                unconfFullName: unconf?.fullName,
                unconfCountry: unconf?.country,
                unconfCountryCode: unconf?.countryCode,
                isUnconfiguredFlag: unconf?.isUnconfigured,
                hasColors: Boolean(unconf?.colors?.primary),
                hasPeriods: Array.isArray(unconf?.periods) && unconf.periods.length > 0,
                lookupUnconfId: lookupUnconf?.id,
                lookupEmptyId: lookupEmpty?.id,
                lookupNullId: lookupNull?.id,
                iconContainsCap: iconHtml?.includes('🎓')
            };
        });

        assertTrue(instModuleAudit.hasUnconfiguredObj, 'InstitutionsModule exports UNCONFIGURED_INSTITUTION');
        assertEqual(instModuleAudit.unconfId, 'unconfigured', 'UNCONFIGURED_INSTITUTION.id is "unconfigured"');
        assertEqual(instModuleAudit.unconfName, 'Sin institución', 'UNCONFIGURED_INSTITUTION.name is "Sin institución"');
        assertEqual(instModuleAudit.unconfFullName, 'Sin institución configurada', 'UNCONFIGURED_INSTITUTION.fullName is "Sin institución configurada"');
        assertEqual(instModuleAudit.unconfCountry, 'Global', 'UNCONFIGURED_INSTITUTION.country is "Global"');
        assertEqual(instModuleAudit.unconfCountryCode, 'GL', 'UNCONFIGURED_INSTITUTION.countryCode is "GL"');
        assertTrue(instModuleAudit.isUnconfiguredFlag, 'UNCONFIGURED_INSTITUTION.isUnconfigured is true');
        assertTrue(instModuleAudit.hasColors, 'UNCONFIGURED_INSTITUTION defines safe color palette');
        assertTrue(instModuleAudit.hasPeriods, 'UNCONFIGURED_INSTITUTION defines fallback periods array');
        assertEqual(instModuleAudit.lookupUnconfId, 'unconfigured', 'getInstitution("unconfigured") returns UNCONFIGURED_INSTITUTION');
        assertEqual(instModuleAudit.lookupEmptyId, 'unconfigured', 'getInstitution("") returns UNCONFIGURED_INSTITUTION');
        assertEqual(instModuleAudit.lookupNullId, 'unconfigured', 'getInstitution(null) returns UNCONFIGURED_INSTITUTION');
        assertTrue(instModuleAudit.iconContainsCap, 'renderIconHtml for unconfigured institution renders graduation cap 🎓');

        // =====================================================================
        // GROUP 3: StorageModule Skipped & Unconfigured School Methods
        // =====================================================================
        console.log('\n\x1b[1m--- [Group 3] StorageModule Skipped & Unconfigured School Methods ---\x1b[0m');

        const storageAudit = await page.evaluate(() => {
            const Storage = window.StorageModule;
            const initialSkipped = Storage.isSchoolSkipped();
            
            Storage.setSchoolSkipped(true);
            const afterSetSkipped = Storage.isSchoolSkipped();
            const instWhenSkipped = Storage.getInstitution();
            const periodWhenSkipped = Storage.getAcademicPeriod();

            Storage.setSchoolSkipped(false);
            const afterClearedSkipped = Storage.isSchoolSkipped();

            return {
                initialSkipped,
                afterSetSkipped,
                instWhenSkipped,
                periodWhenSkipped,
                afterClearedSkipped
            };
        });

        assertFalse(storageAudit.initialSkipped, 'isSchoolSkipped() is false initially');
        assertTrue(storageAudit.afterSetSkipped, 'setSchoolSkipped(true) sets isSchoolSkipped() to true');
        assertEqual(storageAudit.instWhenSkipped, 'unconfigured', 'getInstitution() returns "unconfigured" when school is skipped');
        assertEqual(storageAudit.periodWhenSkipped, 'Sin periodo', 'getAcademicPeriod() returns "Sin periodo" when school is skipped');
        assertFalse(storageAudit.afterClearedSkipped, 'setSchoolSkipped(false) clears skipped flag');

        // =====================================================================
        // GROUP 4: "Hacerla después" Skip Action & Period Lock State Machine
        // =====================================================================
        console.log('\n\x1b[1m--- [Group 4] "Hacerla después" Skip Action & Period Lock Machine ---\x1b[0m');

        // Open welcome modal afresh
        await page.evaluate(() => {
            window.app.openCycleWelcomeModal();
        });
        await new Promise(r => setTimeout(r, 200));

        // Click "⏭️ Hacerla después"
        await page.click('#welcome-skip-school-btn');
        await new Promise(r => setTimeout(r, 200));

        const lockedState = await page.evaluate(() => {
            const container = document.getElementById('welcome-period-container');
            const lockMsg = document.getElementById('welcome-period-locked-msg');
            const chips = document.getElementById('welcome-period-chips');
            const schoolBox = document.getElementById('welcome-selected-school-box');
            const badge = document.getElementById('welcome-selected-period-badge');

            return {
                hasOpacity: container.classList.contains('opacity-40'),
                hasPointerEventsNone: container.classList.contains('pointer-events-none'),
                hasCursorNotAllowed: container.classList.contains('cursor-not-allowed'),
                lockMsgVisible: lockMsg && !lockMsg.classList.contains('hidden'),
                lockMsgText: lockMsg ? lockMsg.textContent.trim() : '',
                chipsCount: chips ? chips.children.length : -1,
                boxText: schoolBox ? schoolBox.textContent : '',
                badgeText: badge ? badge.textContent : ''
            };
        });

        assertTrue(lockedState.hasOpacity, '#welcome-period-container has opacity-40 when school is skipped');
        assertTrue(lockedState.hasPointerEventsNone, '#welcome-period-container has pointer-events-none when school is skipped');
        assertTrue(lockedState.hasCursorNotAllowed, '#welcome-period-container has cursor-not-allowed when school is skipped');
        assertTrue(lockedState.lockMsgVisible, '#welcome-period-locked-msg is visible when school is skipped');
        assertTrue(lockedState.lockMsgText.includes('Selecciona o crea una institución'), 'Lock message contains helpful instruction');
        assertEqual(lockedState.chipsCount, 0, 'Period chips container is cleared while locked');
        assertTrue(lockedState.boxText.includes('Sin institución'), 'Active school box indicates "Sin institución (Omitida)"');
        assertTrue(lockedState.badgeText.includes('Bloqueado'), 'Period badge indicates "Bloqueado"');

        // =====================================================================
        // GROUP 5: School Card Selection & Period Unlock State Machine
        // =====================================================================
        console.log('\n\x1b[1m--- [Group 5] School Card Selection & Period Unlock State Machine ---\x1b[0m');

        // Tap UNAM card in schools grid
        const clickedUnam = await page.evaluate(() => {
            const card = document.querySelector('.welcome-school-card[data-inst-id="unam"]');
            if (card) {
                card.click();
                return true;
            }
            return false;
        });
        assertTrue(clickedUnam, 'UNAM card found and clicked in #welcome-schools-grid');
        await new Promise(r => setTimeout(r, 200));

        const unamUnlockedState = await page.evaluate(() => {
            const container = document.getElementById('welcome-period-container');
            const lockMsg = document.getElementById('welcome-period-locked-msg');
            const chips = document.querySelectorAll('.welcome-period-chip');
            const schoolBox = document.getElementById('welcome-selected-school-box');
            const badge = document.getElementById('welcome-selected-period-badge');

            return {
                isLocked: container.classList.contains('pointer-events-none'),
                lockMsgHidden: lockMsg.classList.contains('hidden'),
                chipCount: chips.length,
                firstChipText: chips[0]?.textContent?.trim(),
                boxText: schoolBox.textContent,
                badgeText: badge.textContent
            };
        });

        assertFalse(unamUnlockedState.isLocked, 'Period container unlocks after tapping UNAM card');
        assertTrue(unamUnlockedState.lockMsgHidden, 'Lock message is hidden after school selection');
        assertTrue(unamUnlockedState.chipCount >= 10, 'UNAM populates semestral period chips (>=10)');
        assertTrue(unamUnlockedState.firstChipText.includes('Semestre'), 'First period chip corresponds to Semestre');
        assertTrue(unamUnlockedState.boxText.includes('UNAM'), 'Active school box displays UNAM branding');

        // Tap UAM card (trimestral system)
        const clickedUam = await page.evaluate(() => {
            const card = document.querySelector('.welcome-school-card[data-inst-id="uam"]');
            if (card) {
                card.click();
                return true;
            }
            return false;
        });
        assertTrue(clickedUam, 'UAM card found and clicked in #welcome-schools-grid');
        await new Promise(r => setTimeout(r, 200));

        const uamState = await page.evaluate(() => {
            const chips = document.querySelectorAll('.welcome-period-chip');
            const schoolBox = document.getElementById('welcome-selected-school-box');
            return {
                chipCount: chips.length,
                firstChipText: chips[0]?.textContent?.trim(),
                boxText: schoolBox.textContent
            };
        });

        assertTrue(uamState.chipCount >= 12, 'UAM populates trimestral period chips (>=12)');
        assertTrue(uamState.firstChipText.includes('Trimestre'), 'First period chip corresponds to Trimestre for UAM');
        assertTrue(uamState.boxText.includes('UAM'), 'Active school box displays UAM branding');

        // Select a period chip
        const selectedChipText = await page.evaluate(() => {
            const secondChip = document.querySelectorAll('.welcome-period-chip')[1];
            if (secondChip) secondChip.click();
            const badge = document.getElementById('welcome-selected-period-badge');
            return badge ? badge.textContent : '';
        });
        assertTrue(selectedChipText.includes('2.º Trimestre'), 'Clicking period chip updates selected period');

        // =====================================================================
        // GROUP 6: Country Filter Pills Without Flag Emojis
        // =====================================================================
        console.log('\n\x1b[1m--- [Group 6] Country Filter Pills Without Flag Emojis ---\x1b[0m');

        const countryPillsAudit = await page.evaluate(() => {
            const container = document.getElementById('welcome-country-pills');
            const pills = Array.from(container.querySelectorAll('.welcome-country-pill'));
            const flagEmojiRegex = /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/;
            const flagViolations = pills.filter(p => flagEmojiRegex.test(p.textContent));
            const pillLabels = pills.map(p => p.textContent.trim());

            return {
                totalPills: pills.length,
                flagViolationsCount: flagViolations.length,
                hasTodas: pillLabels.some(l => l.includes('Todas')),
                hasMexico: pillLabels.some(l => l.includes('México')),
                hasColombia: pillLabels.some(l => l.includes('Colombia'))
            };
        });

        assertTrue(countryPillsAudit.totalPills >= 10, 'Welcome modal has country filter pills (>=10)');
        assertEqual(countryPillsAudit.flagViolationsCount, 0, 'Zero country flag emojis in #welcome-country-pills');
        assertTrue(countryPillsAudit.hasTodas, 'Contains "Todas" filter pill');
        assertTrue(countryPillsAudit.hasMexico, 'Contains "México" filter pill without flag emoji');
        assertTrue(countryPillsAudit.hasColombia, 'Contains "Colombia" filter pill without flag emoji');

        // Test filtering by Colombia
        const colFilterCount = await page.evaluate(() => {
            const colPill = Array.from(document.querySelectorAll('.welcome-country-pill'))
                .find(p => p.dataset.country === 'CO');
            if (colPill) colPill.click();
            const cards = document.querySelectorAll('.welcome-school-card');
            return cards.length;
        });
        assertEqual(colFilterCount, 4, 'Filtering by Colombia displays exactly 4 university cards in welcome grid');

        // Restore all
        await page.evaluate(() => {
            const allPill = Array.from(document.querySelectorAll('.welcome-country-pill'))
                .find(p => p.dataset.country === 'all');
            if (allPill) allPill.click();
        });
        await new Promise(r => setTimeout(r, 100));

        // =====================================================================
        // GROUP 7: "➕ Crear mi propia escuela" Modal Stacking & Auto-Selection
        // =====================================================================
        console.log('\n\x1b[1m--- [Group 7] "➕ Crear mi propia escuela" Stacking & Auto-Selection ---\x1b[0m');

        // Click "➕ Crear mi propia escuela"
        await page.click('#welcome-create-school-btn');
        await new Promise(r => setTimeout(r, 300));

        const customModalOpen = await page.evaluate(() => {
            const customModal = document.getElementById('custom-school-modal');
            const welcomeModal = document.getElementById('cycle-setup-modal');
            return {
                customVisible: customModal && !customModal.classList.contains('hidden'),
                welcomeVisible: welcomeModal && !welcomeModal.classList.contains('hidden'),
                customZ: window.getComputedStyle(customModal).zIndex,
                welcomeZ: window.getComputedStyle(welcomeModal).zIndex
            };
        });

        assertTrue(customModalOpen.customVisible, '#custom-school-modal opens upon clicking "➕ Crear mi propia escuela"');
        assertTrue(customModalOpen.welcomeVisible, '#cycle-setup-modal remains in DOM/background');
        assertTrue(
            parseInt(customModalOpen.customZ, 10) > parseInt(customModalOpen.welcomeZ, 10) || customModalOpen.customZ === '60',
            'Custom school modal has higher z-index (60) than welcome modal (50)'
        );

        // Fill and save custom school
        await page.evaluate(() => {
            document.getElementById('custom-school-name').value = 'Academia Einstein';
            document.getElementById('custom-school-shortbadge').value = 'AE';
            document.getElementById('custom-school-fullname').value = 'Academia Einstein de Ciencias';
            document.getElementById('custom-school-slogan').value = 'Ciencia y Pasión';
            document.getElementById('custom-school-country').value = 'MX';
            document.getElementById('custom-school-system').value = 'Cuatrimestral';
            document.getElementById('custom-school-color').value = '#4F46E5';
            document.getElementById('custom-school-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        });
        await new Promise(r => setTimeout(r, 400));

        const autoSelectAudit = await page.evaluate(() => {
            const customModal = document.getElementById('custom-school-modal');
            const welcomeModal = document.getElementById('cycle-setup-modal');
            const schoolBox = document.getElementById('welcome-selected-school-box');
            const periodContainer = document.getElementById('welcome-period-container');
            const chips = document.querySelectorAll('.welcome-period-chip');
            const badge = document.getElementById('welcome-selected-period-badge');

            return {
                customModalClosed: customModal.classList.contains('hidden'),
                welcomeModalOpen: !welcomeModal.classList.contains('hidden'),
                schoolBoxText: schoolBox ? schoolBox.textContent : '',
                periodLocked: periodContainer.classList.contains('pointer-events-none'),
                firstChipText: chips[0]?.textContent?.trim(),
                badgeText: badge ? badge.textContent : ''
            };
        });

        assertTrue(autoSelectAudit.customModalClosed, 'Custom school modal closed after save');
        assertTrue(autoSelectAudit.welcomeModalOpen, 'Welcome modal remains open');
        assertTrue(autoSelectAudit.schoolBoxText.includes('Academia Einstein'), 'New custom school auto-selected in welcome box');
        assertFalse(autoSelectAudit.periodLocked, 'Period selector unlocked for new custom school');
        assertTrue(autoSelectAudit.firstChipText.includes('Cuatrimestre'), 'Custom cuatrimestral period chips populated');

        // =====================================================================
        // GROUP 8: Skip School Submission & App Shell Resilience
        // =====================================================================
        console.log('\n\x1b[1m--- [Group 8] Skip School Submission & App Shell Resilience ---\x1b[0m');

        // Now test skipping school and completing onboarding
        await page.click('#welcome-skip-school-btn');
        await new Promise(r => setTimeout(r, 200));

        // Submit welcome modal with skipped school
        await page.evaluate(() => {
            document.getElementById('welcome-cycle-start').value = '2026-08-10';
            document.getElementById('welcome-cycle-end').value = '2026-12-18';
            document.getElementById('welcome-cycle-save-btn').click();
        });
        await new Promise(r => setTimeout(r, 500));

        const skippedAppShell = await page.evaluate(() => {
            const welcomeModal = document.getElementById('cycle-setup-modal');
            const headerName = document.getElementById('header-inst-name')?.textContent?.trim();
            const headerPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const headerLogo = document.getElementById('header-inst-logo')?.innerHTML;
            const drawerName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const drawerPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const drawerLogo = document.getElementById('drawer-inst-logo')?.innerHTML;
            const isSkippedInStorage = window.StorageModule.isSchoolSkipped();
            const instInStorage = window.StorageModule.getInstitution();
            const onboardingDone = window.StorageModule.isOnboardingCompleted();

            return {
                welcomeModalClosed: welcomeModal.classList.contains('hidden'),
                headerName,
                headerPeriod,
                headerLogoHasCap: headerLogo?.includes('🎓'),
                drawerName,
                drawerPeriod,
                drawerLogoHasCap: drawerLogo?.includes('🎓'),
                isSkippedInStorage,
                instInStorage,
                onboardingDone
            };
        });

        assertTrue(skippedAppShell.welcomeModalClosed, 'Welcome modal closed after submit');
        assertTrue(skippedAppShell.onboardingDone, 'Onboarding marked as completed in Storage');
        assertTrue(skippedAppShell.isSkippedInStorage, 'Storage.isSchoolSkipped() is true');
        assertEqual(skippedAppShell.instInStorage, 'unconfigured', 'Storage.getInstitution() is "unconfigured"');
        assertEqual(skippedAppShell.headerName, 'Sin institución', 'Header displays "Sin institución"');
        assertEqual(skippedAppShell.headerPeriod, 'Sin periodo', 'Header displays "Sin periodo"');
        assertTrue(skippedAppShell.headerLogoHasCap, 'Header displays graduation cap 🎓 icon');
        assertEqual(skippedAppShell.drawerName, 'Sin institución', 'Drawer displays "Sin institución"');
        assertEqual(skippedAppShell.drawerPeriod, 'Sin periodo', 'Drawer displays "Sin periodo"');
        assertTrue(skippedAppShell.drawerLogoHasCap, 'Drawer displays graduation cap 🎓 icon');

        // Test configuring a school later from settings
        console.log('\n\x1b[1m--- [Group 9] Configuring School Later Clears Skipped State ---\x1b[0m');

        await page.evaluate(() => {
            window.app.switchView('settings');
        });
        await new Promise(r => setTimeout(r, 300));

        // Click IPN in settings
        await page.evaluate(() => {
            const ipnCard = document.querySelector('#settings-institution-grid button[data-inst-id="ipn"]');
            if (ipnCard) ipnCard.click();
        });
        await new Promise(r => setTimeout(r, 300));

        const configuredLater = await page.evaluate(() => {
            return {
                isSkipped: window.StorageModule.isSchoolSkipped(),
                activeInst: window.StorageModule.getInstitution(),
                headerName: document.getElementById('header-inst-name')?.textContent?.trim()
            };
        });

        assertFalse(configuredLater.isSkipped, 'Selecting a school in settings clears isSchoolSkipped');
        assertEqual(configuredLater.activeInst, 'ipn', 'Storage.getInstitution() updated to ipn');
        assertTrue(configuredLater.headerName.includes('IPN'), 'Header updated to IPN');

    } catch (err) {
        console.error('\x1b[31mFatal test failure:\x1b[0m', err);
        failedTests++;
    } finally {
        await browser.close();
    }

    console.log('\n\x1b[1m\x1b[36m========================================================================\x1b[0m');
    console.log('\x1b[1mWelcome Modal Milestone 3 Test Summary:\x1b[0m');
    console.log(`  Passed:    \x1b[32m\x1b[1m${passedTests}\x1b[0m`);
    console.log(`  Failed:    \x1b[31m${failedTests}\x1b[0m`);
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m');

    if (failedTests > 0) {
        console.log('\x1b[31m\x1b[1mRESULT: FAILURE (Some tests failed!)\x1b[0m');
        process.exit(1);
    } else {
        console.log('\x1b[32m\x1b[1mRESULT: SUCCESS (All Milestone 3 welcome modal tests passed!)\x1b[0m');
        process.exit(0);
    }
})();
