/**
 * adversarial_welcome_modal_m3.js
 * EMPIRICAL ADVERSARIAL CHALLENGER TEST SUITE for Milestone 3 (v1.3.4):
 * First-Time Welcome Modal Modernization, Zero Native Selects, Interactive Cards/Chips,
 * Period Locking State Machine, Custom School Creation, and Unconfigured School Resiliency.
 */

const assert = require('assert');
const helpers = require('./test_helpers');

let passCount = 0;
let failCount = 0;
const testResults = [];

function recordTest(desc, passed, details = '') {
    if (passed) {
        passCount++;
        console.log(`  \x1b[32m[CHALLENGE PASS]\x1b[0m ${desc} ${details ? `(${details})` : ''}`);
        testResults.push({ desc, passed: true, details });
    } else {
        failCount++;
        console.error(`  \x1b[31m[CHALLENGE FAIL]\x1b[0m ${desc} ${details ? `(${details})` : ''}`);
        testResults.push({ desc, passed: false, details });
    }
}

(async () => {
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[35m  EMPIRICAL ADVERSARIAL CHALLENGE: WELCOME MODAL INTERACTIVE UI & STATE MACHINE \x1b[0m');
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m\n');

    const browser = await helpers.launchBrowser();
    const pageErrors = [];
    const consoleErrors = [];

    try {
        const page = await helpers.createPage(browser, { viewport: { width: 360, height: 740 } });

        page.on('pageerror', err => {
            pageErrors.push(err.toString());
            console.error(`  \x1b[31m[PAGE ERROR]\x1b[0m ${err.message}`);
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
                console.error(`  \x1b[31m[CONSOLE ERROR]\x1b[0m ${msg.text()}`);
            }
        });

        // =====================================================================
        // CHALLENGE PHASE 1: Zero Native <select> Elements in #cycle-setup-modal
        // =====================================================================
        console.log('\x1b[1m--- [Phase 1] Native <select> Dropdown Eradication Audit ---\x1b[0m');

        const selectAudit = await page.evaluate(() => {
            const modal = document.getElementById('cycle-setup-modal');
            if (!modal) return { modalFound: false, selectCount: -1 };
            const selects = modal.querySelectorAll('select');
            const legacyInstSelect = document.getElementById('welcome-institution-select');
            const legacyPeriodSelect = document.getElementById('welcome-period-select');
            return {
                modalFound: true,
                selectCount: selects.length,
                hasLegacyInstSelect: Boolean(legacyInstSelect),
                hasLegacyPeriodSelect: Boolean(legacyPeriodSelect)
            };
        });

        recordTest(
            '#cycle-setup-modal element exists in DOM',
            selectAudit.modalFound === true,
            `Found: ${selectAudit.modalFound}`
        );

        recordTest(
            '#cycle-setup-modal select query returns strictly 0 (Zero native selects)',
            selectAudit.selectCount === 0,
            `Count: ${selectAudit.selectCount}`
        );

        recordTest(
            'Legacy #welcome-institution-select is completely removed',
            selectAudit.hasLegacyInstSelect === false,
            `Legacy element present: ${selectAudit.hasLegacyInstSelect}`
        );

        recordTest(
            'Legacy #welcome-period-select is completely removed',
            selectAudit.hasLegacyPeriodSelect === false,
            `Legacy element present: ${selectAudit.hasLegacyPeriodSelect}`
        );

        // =====================================================================
        // CHALLENGE PHASE 2: Welcome Modal Trigger & "Hacerla después" State Machine
        // =====================================================================
        console.log('\n\x1b[1m--- [Phase 2] "Hacerla después" Period Lock State Machine ---\x1b[0m');

        // Reset storage and trigger clean onboarding modal
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem('org_escolar_initialized_v3', 'true');
            if (window.app && typeof window.app.openCycleWelcomeModal === 'function') {
                window.app.openCycleWelcomeModal();
            }
        });
        await new Promise(r => setTimeout(r, 400));

        // Click "Hacerla después"
        const skipClicked = await page.evaluate(() => {
            const skipBtn = document.getElementById('welcome-skip-school-btn');
            if (skipBtn) {
                skipBtn.click();
                return true;
            }
            return false;
        });

        recordTest(
            '#welcome-skip-school-btn ("Hacerla después") was found and clicked',
            skipClicked === true
        );

        await new Promise(r => setTimeout(r, 200));

        // Inspect computed styles and DOM attributes of #welcome-period-container
        const lockState = await page.evaluate(() => {
            const container = document.getElementById('welcome-period-container');
            const lockedMsg = document.getElementById('welcome-period-locked-msg');
            const chips = document.getElementById('welcome-period-chips');
            const badge = document.getElementById('welcome-selected-period-badge');
            const schoolBox = document.getElementById('welcome-selected-school-box');
            const customWrapper = document.getElementById('welcome-custom-period-wrapper');

            if (!container) return { containerFound: false };

            const compStyle = window.getComputedStyle(container);
            const msgCompStyle = lockedMsg ? window.getComputedStyle(lockedMsg) : null;

            return {
                containerFound: true,
                computedPointerEvents: compStyle.pointerEvents,
                computedOpacity: parseFloat(compStyle.opacity),
                hasOpacityClass: container.classList.contains('opacity-40'),
                hasPointerEventsNoneClass: container.classList.contains('pointer-events-none'),
                hasCursorNotAllowedClass: container.classList.contains('cursor-not-allowed'),
                ariaDisabled: container.getAttribute('aria-disabled'),
                msgVisible: msgCompStyle ? (msgCompStyle.display !== 'none' && !lockedMsg.classList.contains('hidden')) : false,
                chipsCount: chips ? chips.children.length : -1,
                badgeText: badge ? badge.textContent.trim() : '',
                schoolBoxText: schoolBox ? schoolBox.textContent : '',
                customWrapperHidden: customWrapper ? customWrapper.classList.contains('hidden') : false
            };
        });

        recordTest(
            '#welcome-period-container computed pointer-events is strictly "none"',
            lockState.computedPointerEvents === 'none',
            `pointer-events: ${lockState.computedPointerEvents}`
        );

        recordTest(
            '#welcome-period-container computed opacity is 0.4',
            Math.abs(lockState.computedOpacity - 0.4) < 0.05,
            `opacity: ${lockState.computedOpacity}`
        );

        recordTest(
            '#welcome-period-container has tailwind lock classes (opacity-40, pointer-events-none, cursor-not-allowed)',
            lockState.hasOpacityClass && lockState.hasPointerEventsNoneClass && lockState.hasCursorNotAllowedClass
        );

        recordTest(
            '#welcome-period-container has aria-disabled="true"',
            lockState.ariaDisabled === 'true',
            `aria-disabled: ${lockState.ariaDisabled}`
        );

        recordTest(
            '#welcome-period-locked-msg is visible to the user',
            lockState.msgVisible === true
        );

        recordTest(
            '#welcome-period-chips renders 0 clickable chips when locked',
            lockState.chipsCount === 0,
            `Chips count: ${lockState.chipsCount}`
        );

        recordTest(
            '#welcome-selected-period-badge displays "🔒 Bloqueado"',
            lockState.badgeText.includes('Bloqueado'),
            `Badge: ${lockState.badgeText}`
        );

        recordTest(
            '#welcome-selected-school-box shows "Sin institución" / "Omitida"',
            lockState.schoolBoxText.includes('Sin institución') && lockState.schoolBoxText.includes('Omitida'),
            `Box text excerpt: ${lockState.schoolBoxText.replace(/\s+/g, ' ').slice(0, 50)}...`
        );

        recordTest(
            '#welcome-custom-period-wrapper is hidden while locked',
            lockState.customWrapperHidden === true
        );

        // Adversarial interaction attempt: simulate physical tap/click on container coordinates
        const clickCoordResult = await page.evaluate(() => {
            const container = document.getElementById('welcome-period-container');
            const rect = container.getBoundingClientRect();
            const targetEl = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
            // Because pointer-events is none on container, elementFromPoint should fall through to parent or form
            return {
                containerId: container.id,
                targetId: targetEl ? targetEl.id : null,
                targetTag: targetEl ? targetEl.tagName : null
            };
        });

        recordTest(
            'Adversarial hit-testing: clicks fall through container due to pointer-events: none',
            clickCoordResult.targetId !== 'welcome-period-container',
            `Hit target: <${clickCoordResult.targetTag} id="${clickCoordResult.targetId}">`
        );

        // =====================================================================
        // CHALLENGE PHASE 3: Tap UNAM Card & Verify Dynamic Unlock
        // =====================================================================
        console.log('\n\x1b[1m--- [Phase 3] Tap UNAM Card & Dynamic Unlock Verification ---\x1b[0m');

        // Tap UNAM card
        const unamTapped = await page.evaluate(() => {
            const unamCard = document.querySelector('button.welcome-school-card[data-inst-id="unam"]');
            if (unamCard) {
                unamCard.click();
                return true;
            }
            return false;
        });

        recordTest('UNAM card was found in #welcome-schools-grid and clicked', unamTapped === true);
        await new Promise(r => setTimeout(r, 200));

        // Verify period container unlocks
        const unamUnlockState = await page.evaluate(() => {
            const container = document.getElementById('welcome-period-container');
            const lockedMsg = document.getElementById('welcome-period-locked-msg');
            const chipsContainer = document.getElementById('welcome-period-chips');
            const chips = chipsContainer ? Array.from(chipsContainer.querySelectorAll('.welcome-period-chip')) : [];
            const badge = document.getElementById('welcome-selected-period-badge');
            const schoolBox = document.getElementById('welcome-selected-school-box');

            const compStyle = window.getComputedStyle(container);
            const msgCompStyle = lockedMsg ? window.getComputedStyle(lockedMsg) : null;

            return {
                computedPointerEvents: compStyle.pointerEvents,
                computedOpacity: parseFloat(compStyle.opacity),
                hasOpacityClass: container.classList.contains('opacity-40'),
                hasPointerEventsNoneClass: container.classList.contains('pointer-events-none'),
                ariaDisabled: container.getAttribute('aria-disabled'),
                msgHidden: msgCompStyle ? (msgCompStyle.display === 'none' || lockedMsg.classList.contains('hidden')) : true,
                chipTexts: chips.map(c => c.textContent.trim()),
                badgeText: badge ? badge.textContent.trim() : '',
                schoolBoxHasUNAM: schoolBox ? schoolBox.textContent.includes('UNAM') : false
            };
        });

        recordTest(
            '#welcome-period-container computed pointer-events unlocked to "auto"',
            unamUnlockState.computedPointerEvents === 'auto',
            `pointer-events: ${unamUnlockState.computedPointerEvents}`
        );

        recordTest(
            '#welcome-period-container computed opacity unlocked to 1',
            Math.abs(unamUnlockState.computedOpacity - 1) < 0.05,
            `opacity: ${unamUnlockState.computedOpacity}`
        );

        recordTest(
            '#welcome-period-locked-msg is hidden after school selection',
            unamUnlockState.msgHidden === true
        );

        recordTest(
            'UNAM semestral period chips rendered dynamically',
            unamUnlockState.chipTexts.some(t => t.includes('Semestre')),
            `Chips: ${unamUnlockState.chipTexts.join(', ')}`
        );

        recordTest(
            'Active period badge defaults to UNAM period (1.º Semestre)',
            unamUnlockState.badgeText.includes('Semestre'),
            `Badge: ${unamUnlockState.badgeText}`
        );

        recordTest(
            '#welcome-selected-school-box displays UNAM info and crest',
            unamUnlockState.schoolBoxHasUNAM === true
        );

        // Select a different semester chip (e.g., "3.º Semestre")
        const chipSelection = await page.evaluate(() => {
            const chips = Array.from(document.querySelectorAll('.welcome-period-chip'));
            const targetChip = chips.find(c => c.textContent.includes('3.º Semestre'));
            if (targetChip) {
                targetChip.click();
                const badge = document.getElementById('welcome-selected-period-badge');
                // Re-query updated DOM nodes as renderPeriodChips re-renders HTML
                const updatedChips = Array.from(document.querySelectorAll('.welcome-period-chip'));
                const updatedTarget = updatedChips.find(c => c.textContent.includes('3.º Semestre'));
                return {
                    clicked: true,
                    newBadge: badge ? badge.textContent.trim() : '',
                    hasActiveClass: updatedTarget ? updatedTarget.className.includes('bg-indigo-600') : false
                };
            }
            return { clicked: false };
        });

        recordTest(
            'Semester chips are interactive and selectable (tapped "3.º Semestre")',
            chipSelection.clicked === true && chipSelection.newBadge === '3.º Semestre',
            `Badge after click: ${chipSelection.newBadge}`
        );

        recordTest(
            'Selected chip receives visual active classes (bg-indigo-600)',
            chipSelection.hasActiveClass === true
        );

        // =====================================================================
        // CHALLENGE PHASE 4: Tap UAM Card & Dynamic Trimestral Adaptation
        // =====================================================================
        console.log('\n\x1b[1m--- [Phase 4] Tap UAM Card & Trimestral Adaptation ---\x1b[0m');

        const uamTapped = await page.evaluate(() => {
            const uamCard = document.querySelector('button.welcome-school-card[data-inst-id="uam"]');
            if (uamCard) {
                uamCard.click();
                return true;
            }
            return false;
        });

        recordTest('UAM card was found in #welcome-schools-grid and clicked', uamTapped === true);
        await new Promise(r => setTimeout(r, 200));

        const uamState = await page.evaluate(() => {
            const chipsContainer = document.getElementById('welcome-period-chips');
            const chips = chipsContainer ? Array.from(chipsContainer.querySelectorAll('.welcome-period-chip')) : [];
            const badge = document.getElementById('welcome-selected-period-badge');
            const schoolBox = document.getElementById('welcome-selected-school-box');

            return {
                chipTexts: chips.map(c => c.textContent.trim()),
                badgeText: badge ? badge.textContent.trim() : '',
                schoolBoxHasUAM: schoolBox ? schoolBox.textContent.includes('UAM') : false
            };
        });

        recordTest(
            'Chips dynamically swapped to UAM trimestral periods (Trimestre)',
            uamState.chipTexts.some(t => t.includes('Trimestre')),
            `Chips: ${uamState.chipTexts.join(', ')}`
        );

        recordTest(
            'No semester chips remain when UAM is selected',
            !uamState.chipTexts.some(t => t.includes('Semestre')),
            `Chips: ${uamState.chipTexts.join(', ')}`
        );

        recordTest(
            'Active period badge defaults to UAM period (1.er Trimestre)',
            uamState.badgeText.includes('Trimestre'),
            `Badge: ${uamState.badgeText}`
        );

        recordTest(
            '#welcome-selected-school-box displays UAM identity',
            uamState.schoolBoxHasUAM === true
        );

        // =====================================================================
        // CHALLENGE PHASE 5: Tap "Hacerla después" Again & Verify Re-locking
        // =====================================================================
        console.log('\n\x1b[1m--- [Phase 5] Re-locking State Machine (Tap "Hacerla después" again) ---\x1b[0m');

        const reSkipClicked = await page.evaluate(() => {
            const skipBtn = document.getElementById('welcome-skip-school-btn');
            if (skipBtn) {
                skipBtn.click();
                return true;
            }
            return false;
        });

        recordTest('Tapped "Hacerla después" a second time', reSkipClicked === true);
        await new Promise(r => setTimeout(r, 200));

        const relockState = await page.evaluate(() => {
            const container = document.getElementById('welcome-period-container');
            const lockedMsg = document.getElementById('welcome-period-locked-msg');
            const chips = document.getElementById('welcome-period-chips');
            const badge = document.getElementById('welcome-selected-period-badge');
            const schoolBox = document.getElementById('welcome-selected-school-box');

            const compStyle = window.getComputedStyle(container);
            const msgCompStyle = lockedMsg ? window.getComputedStyle(lockedMsg) : null;

            return {
                computedPointerEvents: compStyle.pointerEvents,
                computedOpacity: parseFloat(compStyle.opacity),
                msgVisible: msgCompStyle ? (msgCompStyle.display !== 'none' && !lockedMsg.classList.contains('hidden')) : false,
                chipsCount: chips ? chips.children.length : -1,
                badgeText: badge ? badge.textContent.trim() : '',
                schoolBoxIsBlank: schoolBox ? schoolBox.textContent.includes('Sin institución') : false
            };
        });

        recordTest(
            '#welcome-period-container re-locks pointer-events strictly to "none"',
            relockState.computedPointerEvents === 'none',
            `pointer-events: ${relockState.computedPointerEvents}`
        );

        recordTest(
            '#welcome-period-container re-locks computed opacity strictly to 0.4',
            Math.abs(relockState.computedOpacity - 0.4) < 0.05,
            `opacity: ${relockState.computedOpacity}`
        );

        recordTest(
            '#welcome-period-locked-msg is re-displayed after re-skipping',
            relockState.msgVisible === true
        );

        recordTest(
            '#welcome-period-chips are cleared upon re-locking',
            relockState.chipsCount === 0,
            `Chips count: ${relockState.chipsCount}`
        );

        recordTest(
            '#welcome-selected-school-box returns to blank "Sin institución" placeholder',
            relockState.schoolBoxIsBlank === true
        );

        // =====================================================================
        // CHALLENGE PHASE 6: Custom Period ("✏️ Otro...") Interaction & Lock Clearing
        // =====================================================================
        console.log('\n\x1b[1m--- [Phase 6] Custom Period ("✏️ Otro...") & Lock Resiliency ---\x1b[0m');

        // Select UNAM again
        await page.evaluate(() => {
            const card = document.querySelector('button.welcome-school-card[data-inst-id="unam"]');
            if (card) card.click();
        });
        await new Promise(r => setTimeout(r, 200));

        // Click "✏️ Otro..." chip
        const customChipClicked = await page.evaluate(() => {
            const customBtn = document.getElementById('welcome-period-custom-chip');
            if (customBtn) {
                customBtn.click();
                return true;
            }
            return false;
        });

        recordTest('Found and clicked "✏️ Otro..." chip', customChipClicked === true);

        const customInputState = await page.evaluate(() => {
            const wrapper = document.getElementById('welcome-custom-period-wrapper');
            const input = document.getElementById('welcome-custom-period-input');
            return {
                wrapperVisible: wrapper ? !wrapper.classList.contains('hidden') : false,
                inputFound: Boolean(input)
            };
        });

        recordTest(
            '#welcome-custom-period-wrapper is revealed when "✏️ Otro..." is selected',
            customInputState.wrapperVisible === true
        );

        // Type custom period
        await page.evaluate(() => {
            const input = document.getElementById('welcome-custom-period-input');
            if (input) {
                input.value = 'Modulo Intersemestral 2026';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        await new Promise(r => setTimeout(r, 100));

        const badgeWithCustom = await page.evaluate(() => {
            const badge = document.getElementById('welcome-selected-period-badge');
            return badge ? badge.textContent.trim() : '';
        });

        recordTest(
            'Custom period input updates badge to "Modulo Intersemestral 2026"',
            badgeWithCustom === 'Modulo Intersemestral 2026',
            `Badge: ${badgeWithCustom}`
        );

        // Tap "Hacerla después" and assert custom wrapper collapses and lock re-engages
        await page.evaluate(() => {
            const skipBtn = document.getElementById('welcome-skip-school-btn');
            if (skipBtn) skipBtn.click();
        });
        await new Promise(r => setTimeout(r, 200));

        const customCollapsed = await page.evaluate(() => {
            const wrapper = document.getElementById('welcome-custom-period-wrapper');
            return wrapper ? wrapper.classList.contains('hidden') : false;
        });

        recordTest(
            '#welcome-custom-period-wrapper automatically collapses when school is skipped',
            customCollapsed === true
        );

        // =====================================================================
        // CHALLENGE PHASE 7: Custom School Modal Elevation & Onboarding Hook
        // =====================================================================
        console.log('\n\x1b[1m--- [Phase 7] Custom School Modal Stacking & Auto-Selection ---\x1b[0m');

        // Click "➕ Crear mi propia escuela"
        const createModalOpened = await page.evaluate(() => {
            const btn = document.getElementById('welcome-create-school-btn');
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        });

        recordTest('Clicked #welcome-create-school-btn', createModalOpened === true);
        await new Promise(r => setTimeout(r, 200));

        const customModalCheck = await page.evaluate(() => {
            const customModal = document.getElementById('custom-school-modal');
            const cycleModal = document.getElementById('cycle-setup-modal');
            if (!customModal || !cycleModal) return { found: false };

            const customZ = window.getComputedStyle(customModal).zIndex;
            const cycleZ = window.getComputedStyle(cycleModal).zIndex;

            return {
                found: true,
                customModalVisible: !customModal.classList.contains('hidden'),
                customZ: parseInt(customZ, 10) || 0,
                cycleZ: parseInt(cycleZ, 10) || 0
            };
        });

        recordTest(
            '#custom-school-modal opened over #cycle-setup-modal',
            customModalCheck.customModalVisible === true
        );

        recordTest(
            '#custom-school-modal z-index (60) is strictly greater than #cycle-setup-modal z-index (50)',
            customModalCheck.customZ > customModalCheck.cycleZ,
            `customModal: ${customModalCheck.customZ}, cycleModal: ${customModalCheck.cycleZ}`
        );

        // Create a custom school via form
        const customCreationResult = await page.evaluate(() => {
            const nameInput = document.getElementById('custom-school-name');
            const countrySelect = document.getElementById('custom-school-country');
            const systemSelect = document.getElementById('custom-school-system');
            const form = document.getElementById('custom-school-form');

            if (!nameInput || !form) return { success: false, reason: 'form missing' };

            nameInput.value = 'Colegio Mayor Challenger';
            if (countrySelect) countrySelect.value = 'MX';
            if (systemSelect) systemSelect.value = 'Cuatrimestral';

            // Submit form
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            return { success: true };
        });

        recordTest('Submitted custom school creation form', customCreationResult.success === true);
        await new Promise(r => setTimeout(r, 400));

        // Verify onboarding automatically adopted newly created school
        const adoptedSchoolState = await page.evaluate(() => {
            const schoolBox = document.getElementById('welcome-selected-school-box');
            const container = document.getElementById('welcome-period-container');
            const chips = document.getElementById('welcome-period-chips');
            const badge = document.getElementById('welcome-selected-period-badge');

            const compStyle = container ? window.getComputedStyle(container) : null;

            return {
                boxText: schoolBox ? schoolBox.textContent : '',
                pointerEvents: compStyle ? compStyle.pointerEvents : '',
                opacity: compStyle ? parseFloat(compStyle.opacity) : -1,
                badgeText: badge ? badge.textContent.trim() : '',
                chips: chips ? Array.from(chips.children).map(c => c.textContent.trim()) : []
            };
        });

        recordTest(
            'Newly created custom school is automatically selected in onboarding box',
            adoptedSchoolState.boxText.includes('Colegio Mayor Challenger'),
            `Box text: ${adoptedSchoolState.boxText.replace(/\s+/g, ' ').slice(0, 50)}...`
        );

        recordTest(
            'Period container unlocked automatically for custom school',
            adoptedSchoolState.pointerEvents === 'auto' && Math.abs(adoptedSchoolState.opacity - 1) < 0.05
        );

        recordTest(
            'Custom school cuatrimestral chips rendered dynamically',
            adoptedSchoolState.chips.some(c => c.includes('Cuatrimestre')),
            `Chips: ${adoptedSchoolState.chips.join(', ')}`
        );

        // =====================================================================
        // CHALLENGE PHASE 8: Complete Onboarding with "Hacerla después" (End-to-End Persistence)
        // =====================================================================
        console.log('\n\x1b[1m--- [Phase 8] Complete Onboarding with Skipped School & App Shell Resilience ---\x1b[0m');

        // Tap "Hacerla después" to complete onboarding without school
        await page.evaluate(() => {
            const skipBtn = document.getElementById('welcome-skip-school-btn');
            if (skipBtn) skipBtn.click();
        });
        await new Promise(r => setTimeout(r, 200));

        // Submit cycle form with valid dates
        const formSubmitResult = await page.evaluate(() => {
            const startInput = document.getElementById('welcome-cycle-start');
            const endInput = document.getElementById('welcome-cycle-end');
            const form = document.getElementById('cycle-setup-welcome-form');

            if (!startInput || !endInput || !form) return { success: false };

            startInput.value = '2026-08-10';
            endInput.value = '2027-06-25';

            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            return { success: true };
        });

        recordTest('Submitted onboarding form with "Hacerla después" and valid dates', formSubmitResult.success === true);
        await new Promise(r => setTimeout(r, 500));

        // Verify storage values
        const storageState = await page.evaluate(() => {
            const Storage = window.StorageModule;
            return {
                isSkipped: Storage.isSchoolSkipped(),
                institution: Storage.getInstitution(),
                academicPeriod: Storage.getAcademicPeriod(),
                isCycleConfigured: Storage.isCycleConfigured(),
                isOnboardingCompleted: Storage.isOnboardingCompleted()
            };
        });

        recordTest(
            'Storage.isSchoolSkipped() is strictly true',
            storageState.isSkipped === true,
            `isSchoolSkipped: ${storageState.isSkipped}`
        );

        recordTest(
            'Storage.getInstitution() returns "unconfigured"',
            storageState.institution === 'unconfigured',
            `institution: ${storageState.institution}`
        );

        recordTest(
            'Storage.getAcademicPeriod() returns "Sin periodo"',
            storageState.academicPeriod === 'Sin periodo',
            `academicPeriod: ${storageState.academicPeriod}`
        );

        recordTest(
            'Storage marks onboarding and cycle as configured',
            storageState.isCycleConfigured && storageState.isOnboardingCompleted
        );

        // Check header DOM elements and verify no crash occurred
        const headerState = await page.evaluate(() => {
            const headerName = document.getElementById('header-inst-name');
            const headerPeriod = document.getElementById('header-inst-period');
            const headerLogo = document.getElementById('header-inst-logo');
            return {
                headerName: headerName ? headerName.textContent.trim() : '',
                headerPeriod: headerPeriod ? headerPeriod.textContent.trim() : '',
                headerIconText: headerLogo ? headerLogo.textContent.trim() : ''
            };
        });

        recordTest(
            'Header displays "Sin institución"',
            headerState.headerName === 'Sin institución',
            `Header name: "${headerState.headerName}"`
        );

        recordTest(
            'Header displays "Sin periodo"',
            headerState.headerPeriod === 'Sin periodo',
            `Header period: "${headerState.headerPeriod}"`
        );

        recordTest(
            'Header displays graduation cap 🎓 placeholder icon',
            headerState.headerIconText.includes('🎓'),
            `Header icon: "${headerState.headerIconText}"`
        );

        // =====================================================================
        // CHALLENGE PHASE 9: Later Selection in Settings Clears Skipped Flag
        // =====================================================================
        console.log('\n\x1b[1m--- [Phase 9] Subsequent School Selection in Settings Resets Skip Flag ---\x1b[0m');

        const postSettingsState = await page.evaluate(() => {
            const Storage = window.StorageModule;
            // Simulate user later picking UNAM in Settings or via app method
            window.app.setInstitution('unam');
            Storage.setInstitution('unam');
            Storage.setAcademicPeriod('2.º Semestre');
            window.app.refreshAll?.();

            return {
                isSkippedAfterSet: Storage.isSchoolSkipped(),
                currentInst: Storage.getInstitution(),
                currentPeriod: Storage.getAcademicPeriod()
            };
        });

        recordTest(
            'Storage.isSchoolSkipped() automatically resets to false after school configuration',
            postSettingsState.isSkippedAfterSet === false,
            `isSchoolSkipped: ${postSettingsState.isSkippedAfterSet}`
        );

        recordTest(
            'Storage.getInstitution() successfully transitioned from unconfigured to "unam"',
            postSettingsState.currentInst === 'unam',
            `institution: ${postSettingsState.currentInst}`
        );

        // =====================================================================
        // CHALLENGE PHASE 10: Country Filter Pills Sanitization (Zero Emoji Flags)
        // =====================================================================
        console.log('\n\x1b[1m--- [Phase 10] Country Filter Pills Cleanliness (Zero Flag Emojis) ---\x1b[0m');

        // Re-open welcome modal to audit country filter pills
        await page.evaluate(() => {
            window.app.openCycleWelcomeModal();
        });
        await new Promise(r => setTimeout(r, 200));

        const pillsAudit = await page.evaluate(() => {
            const pillsContainer = document.getElementById('welcome-country-pills');
            const pills = pillsContainer ? Array.from(pillsContainer.querySelectorAll('.welcome-country-pill')) : [];
            const flagEmojiRegex = /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/;
            const texts = pills.map(p => p.textContent.trim());
            const hasFlag = texts.some(t => flagEmojiRegex.test(t));
            return {
                count: pills.length,
                texts,
                hasFlag
            };
        });

        recordTest(
            'Country filter pills are present (count > 3)',
            pillsAudit.count > 3,
            `Pills count: ${pillsAudit.count}`
        );

        recordTest(
            'Country filter pills contain strictly 0 emoji flags',
            pillsAudit.hasFlag === false,
            `Labels: ${pillsAudit.texts.join(' | ')}`
        );

        // =====================================================================
        // FINAL AUDIT: Runtime Console & Page Errors
        // =====================================================================
        console.log('\n\x1b[1m--- Final Runtime Error Audit ---\x1b[0m');

        recordTest(
            'Zero uncaught page errors during entire execution',
            pageErrors.length === 0,
            pageErrors.length > 0 ? pageErrors.join('; ') : 'clean'
        );

        recordTest(
            'Zero console.error logs during entire execution',
            consoleErrors.length === 0,
            consoleErrors.length > 0 ? consoleErrors.join('; ') : 'clean'
        );

    } catch (err) {
        recordTest('Fatal exception in challenger harness', false, err.stack || err.message);
    } finally {
        await browser.close();
    }

    console.log('\n\x1b[1m\x1b[35m================================================================================\x1b[0m');
    console.log(`\x1b[1m  TOTAL EMPIRICAL CHALLENGES: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}\x1b[0m`);
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m\n');

    if (failCount > 0) {
        console.error(`\x1b[31mVERDICT: REQUEST_CHANGES (${failCount} challenges failed)\x1b[0m`);
        process.exit(1);
    } else {
        console.log('\x1b[32mVERDICT: APPROVE (100% empirical challenges passed with zero regressions)\x1b[0m');
        process.exit(0);
    }
})();
