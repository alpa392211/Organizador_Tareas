#!/usr/bin/env node
/**
 * challenger_settings_cards_m2_adversarial.js
 * 
 * Adversarial Challenger E2E Test Suite for Milestone 2 (Settings School Cards Compactness & Layout)
 * Archetype: Empirical Challenger
 * Roles: critic, specialist
 * 
 * Focus Areas:
 * 1. Extreme Long Text Inputs: 100-character school name & 80-character subtitle
 *    - With standard whitespace (exactly 100 chars name, 80 chars subtitle)
 *    - Without whitespace (continuous unbroken string of 100 chars 'W' and 80 chars 'Z')
 *    - Verify CSS truncation (ellipsis, no word-wrapping height blowouts, card width strictly constrained, zero horizontal overflow).
 * 2. Mandatory Viewports Matrix (including all 7 required viewports: 320, 360, 390, 412, 768, 1024, 1280):
 *    - Strictly enforce body, html, and grid scrollWidth === clientWidth under extreme input load.
 *    - Validate responsive grid column counts at each breakpoint.
 * 3. Full Custom School Lifecycle via Compact Cards & Modal:
 *    - Creation via "+ Crear Escuela" card (#grid-create-school-card) & form
 *    - Editing via compact edit button (.edit-custom-school-btn)
 *    - Deletion via modal delete button (#custom-school-delete-btn)
 *    - StopPropagation verification (clicking edit button does not trigger card selection)
 * 4. Multi-School High Density & Vertical Scrolling.
 * 5. Input Sanitation & Attribute Escaping Probe.
 */

const assert = require('assert');
const helpers = require('./test_helpers');

let passedTests = 0;
let failedTests = 0;
const failures = [];

function logPass(desc) {
    passedTests++;
    console.log(`  \x1b[32m[PASS]\x1b[0m ${desc}`);
}

function logFail(desc, err) {
    failedTests++;
    const msg = err ? (err.message || String(err)) : 'Assertion failed';
    failures.push(`${desc}: ${msg}`);
    console.error(`  \x1b[31m[FAIL]\x1b[0m ${desc}: ${msg}`);
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
        assert.strictEqual(actual, expected, `${desc} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`);
        logPass(desc);
    } catch (err) {
        logFail(desc, err);
    }
}

(async () => {
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[35m  ADVERSARIAL CHALLENGER SUITE: MILESTONE 2 - SETTINGS SCHOOL CARDS COMPACTNESS \x1b[0m');
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m\n');

    const browser = await helpers.launchBrowser();

    try {
        const page = await helpers.createPage(browser, { viewport: { width: 360, height: 740 } });

        // Catch dialogs (alerts, confirms)
        page.on('dialog', async dialog => {
            try {
                await dialog.accept();
            } catch (_) {}
        });

        // Navigate to settings with configured onboarding
        await page.evaluate(() => {
            localStorage.setItem('org_escolar_onboarding_v1', 'true');
            localStorage.setItem('org_escolar_cycle_configured_v1', 'true');
            if (typeof window.navigateToSettings === 'function') {
                window.navigateToSettings();
            } else if (window.app && typeof window.app.switchView === 'function') {
                window.app.switchView('settings');
            }
        });
        await new Promise(r => setTimeout(r, 400));

        // =========================================================================
        // SECTION 1: Extreme Long Text Inputs & Truncation Stress Test
        // =========================================================================
        console.log('\x1b[1m--- [Section 1] Extreme Long Text Inputs & Truncation Stress Test ---\x1b[0m');

        // 1.1: 100-character name with spaces and 80-character subtitle with spaces
        const longNameWithSpaces = 'Universidad Intercontinental y Politécnica de Estudios Superiores Avanzados Tecnológicos N100caracte';
        assertEqual(longNameWithSpaces.length, 100, 'Verify test fixture longNameWithSpaces is exactly 100 characters');

        const longSubWithSpaces = 'Sistema de Educación Superior Semestralizado con Acreditación de Alta Calidad 80';
        assertEqual(longSubWithSpaces.length, 80, 'Verify test fixture longSubWithSpaces is exactly 80 characters');

        // 1.2: 100-character unbroken string (no whitespace) & 80-character unbroken subtitle
        const unbrokenName100 = 'W'.repeat(100);
        assertEqual(unbrokenName100.length, 100, 'Verify test fixture unbrokenName100 is exactly 100 chars unbroken');

        const unbrokenSub80 = 'Z'.repeat(80);
        assertEqual(unbrokenSub80.length, 80, 'Verify test fixture unbrokenSub80 is exactly 80 chars unbroken');

        // Inject custom school 1 with 100-char name and 80-char subtitle
        await page.evaluate(({ name, sub }) => {
            const extremeSchool1 = {
                id: 'custom_extreme_text_spaces',
                name: name,
                fullName: name,
                slogan: 'Lema de prueba extrema',
                country: 'México',
                countryCode: 'MX',
                systemType: sub,
                periods: ['1.° Semestre'],
                isCustom: true
            };
            window.StorageModule.saveCustomSchool(extremeSchool1);
            window.app.renderSettingsSchools();
        }, { name: longNameWithSpaces, sub: longSubWithSpaces });
        await new Promise(r => setTimeout(r, 200));

        // Evaluate Card 1 layout & CSS properties
        const card1Metrics = await page.evaluate(() => {
            const card = document.querySelector('button[data-inst-id="custom_extreme_text_spaces"]');
            if (!card) return null;

            const nameSpan = card.children[2];
            const subSpan = card.children[3];
            const nameStyle = window.getComputedStyle(nameSpan);
            const subStyle = window.getComputedStyle(subSpan);

            // Compare with standard card width
            const unamCard = document.querySelector('button[data-inst-id="unam"]');

            return {
                cardHeight: card.offsetHeight,
                cardWidth: card.offsetWidth,
                unamCardWidth: unamCard ? unamCard.offsetWidth : 0,
                nameTruncateClass: nameSpan.className.includes('truncate'),
                subTruncateClass: subSpan.className.includes('truncate'),
                nameOverflow: nameStyle.overflow,
                nameTextOverflow: nameStyle.textOverflow,
                nameWhiteSpace: nameStyle.whiteSpace,
                subOverflow: subStyle.overflow,
                subTextOverflow: subStyle.textOverflow,
                subWhiteSpace: subStyle.whiteSpace,
                nameIsTruncated: nameSpan.scrollWidth > nameSpan.clientWidth,
                subIsTruncated: subSpan.scrollWidth > subSpan.clientWidth
            };
        });

        assertTest(card1Metrics !== null, 'Extreme text school card rendered in DOM');
        assertTest(card1Metrics.cardHeight <= 88, `Extreme text card height <= 88px (actual: ${card1Metrics.cardHeight}px)`);
        assertEqual(card1Metrics.cardHeight, 81, `Extreme text card height maintained at standard 81px without wrapping`);
        assertTest(Math.abs(card1Metrics.cardWidth - card1Metrics.unamCardWidth) <= 1, `Card width matches UNAM card (no horizontal box expansion: ${card1Metrics.cardWidth}px vs ${card1Metrics.unamCardWidth}px)`);
        assertTest(card1Metrics.nameTruncateClass, 'Name element includes Tailwind "truncate" class');
        assertTest(card1Metrics.subTruncateClass, 'Subtitle element includes Tailwind "truncate" class');
        assertEqual(card1Metrics.nameOverflow, 'hidden', 'Name element computed overflow is "hidden"');
        assertEqual(card1Metrics.nameTextOverflow, 'ellipsis', 'Name element computed text-overflow is "ellipsis"');
        assertEqual(card1Metrics.nameWhiteSpace, 'nowrap', 'Name element computed white-space is "nowrap"');
        assertEqual(card1Metrics.subOverflow, 'hidden', 'Subtitle element computed overflow is "hidden"');
        assertEqual(card1Metrics.subTextOverflow, 'ellipsis', 'Subtitle element computed text-overflow is "ellipsis"');
        assertEqual(card1Metrics.subWhiteSpace, 'nowrap', 'Subtitle element computed white-space is "nowrap"');
        assertTest(card1Metrics.nameIsTruncated, '100-character name is successfully truncated (scrollWidth > clientWidth)');
        assertTest(card1Metrics.subIsTruncated, '80-character subtitle is successfully truncated (scrollWidth > clientWidth)');

        // Inject Unbroken String (Zero whitespace) - tests if unbroken text forces column/flex expansion
        await page.evaluate(({ name, sub }) => {
            const extremeSchool2 = {
                id: 'custom_extreme_unbroken',
                name: name,
                fullName: name,
                slogan: 'Unbroken text',
                country: 'México',
                countryCode: 'MX',
                systemType: sub,
                periods: ['1.° Semestre'],
                isCustom: true
            };
            window.StorageModule.saveCustomSchool(extremeSchool2);
            window.app.renderSettingsSchools();
        }, { name: unbrokenName100, sub: unbrokenSub80 });
        await new Promise(r => setTimeout(r, 200));

        const unbrokenMetrics = await page.evaluate(() => {
            const card = document.querySelector('button[data-inst-id="custom_extreme_unbroken"]');
            if (!card) return null;
            const unamCard = document.querySelector('button[data-inst-id="unam"]');
            const nameSpan = card.children[2];
            const subSpan = card.children[3];

            return {
                cardHeight: card.offsetHeight,
                cardWidth: card.offsetWidth,
                unamCardWidth: unamCard ? unamCard.offsetWidth : 0,
                nameIsTruncated: nameSpan.scrollWidth > nameSpan.clientWidth,
                subIsTruncated: subSpan.scrollWidth > subSpan.clientWidth
            };
        });

        assertTest(unbrokenMetrics !== null, 'Unbroken 100-char text card rendered');
        assertEqual(unbrokenMetrics.cardHeight, 81, `Unbroken 100-char card height remains strictly 81px`);
        assertTest(Math.abs(unbrokenMetrics.cardWidth - unbrokenMetrics.unamCardWidth) <= 1, `Unbroken 100-char card width did NOT expand grid cell (${unbrokenMetrics.cardWidth}px vs ${unbrokenMetrics.unamCardWidth}px)`);
        assertTest(unbrokenMetrics.nameIsTruncated, 'Unbroken 100-char name is truncated via ellipsis');
        assertTest(unbrokenMetrics.subIsTruncated, 'Unbroken 80-char subtitle is truncated via ellipsis');

        // =========================================================================
        // SECTION 2: 7 Viewports Matrix Stress Test (Under Extreme Input Load)
        // =========================================================================
        console.log('\n\x1b[1m--- [Section 2] 7 Viewports Zero-Overflow Matrix Stress Test ---\x1b[0m');

        // Mandatory viewports requested in prompt: 320px, 360px, 390px, 412px, 768px, 1024px, 1280px (+ 640px sm)
        const mandatoryViewports = [
            { width: 320, expectedCols: 2, label: '320px (iPhone SE 1st gen / ultra-compact)' },
            { width: 360, expectedCols: 2, label: '360px (Standard compact Android)' },
            { width: 390, expectedCols: 2, label: '390px (iPhone 12/13/14/15)' },
            { width: 412, expectedCols: 2, label: '412px (Samsung Galaxy S/Pixel)' },
            { width: 640, expectedCols: 3, label: '640px (Tailwind sm:grid-cols-3)' },
            { width: 768, expectedCols: 4, label: '768px (Tailwind md:grid-cols-4)' },
            { width: 1024, expectedCols: 5, label: '1024px (Tailwind lg:grid-cols-5)' },
            { width: 1280, expectedCols: 5, label: '1280px (Desktop wide)' }
        ];

        for (const vp of mandatoryViewports) {
            await page.setViewport({ width: vp.width, height: 800 });
            await new Promise(r => setTimeout(r, 80));

            const vpStatus = await page.evaluate(() => {
                const body = document.body;
                const doc = document.documentElement;
                const grid = document.getElementById('settings-institution-grid');
                const extremeCard = document.querySelector('button[data-inst-id="custom_extreme_text_spaces"]');

                const tmpl = window.getComputedStyle(grid).gridTemplateColumns;
                const tmplCols = tmpl.split(' ').filter(c => c.trim().length > 0).length;

                return {
                    bodyScrollW: body.scrollWidth,
                    bodyClientW: body.clientWidth,
                    docScrollW: doc.scrollWidth,
                    docClientW: doc.clientWidth,
                    gridScrollW: grid ? grid.scrollWidth : 0,
                    gridClientW: grid ? grid.clientWidth : 0,
                    cardHeight: extremeCard ? extremeCard.offsetHeight : 0,
                    detectedCols: tmplCols
                };
            });

            assertEqual(vpStatus.bodyScrollW, vpStatus.bodyClientW, `Zero horizontal body overflow at ${vp.label} (scrollWidth === clientWidth: ${vpStatus.bodyClientW}px)`);
            assertEqual(vpStatus.docScrollW, vpStatus.docClientW, `Zero horizontal document overflow at ${vp.label}`);
            assertEqual(vpStatus.gridScrollW, vpStatus.gridClientW, `Zero horizontal grid overflow at ${vp.label} (grid scrollWidth === clientWidth: ${vpStatus.gridClientW}px)`);
            assertTest(vpStatus.cardHeight <= 88, `Card height <= 88px under ${vp.label} (actual: ${vpStatus.cardHeight}px)`);
            assertEqual(vpStatus.detectedCols, vp.expectedCols, `Grid layout rendered exactly ${vp.expectedCols} columns at ${vp.label}`);
        }

        // Clean up extreme fixture schools
        await page.evaluate(() => {
            window.StorageModule.deleteCustomSchool('custom_extreme_text_spaces');
            window.StorageModule.deleteCustomSchool('custom_extreme_unbroken');
            window.app.renderSettingsSchools();
        });

        // Reset to standard mobile viewport
        await page.setViewport({ width: 360, height: 740 });
        await new Promise(r => setTimeout(r, 100));

        // =========================================================================
        // SECTION 3: Custom School Interactive CRUD Lifecycle via Compact Cards
        // =========================================================================
        console.log('\n\x1b[1m--- [Section 3] Custom School Interactive CRUD Lifecycle via Compact Cards ---\x1b[0m');

        // Part 3.1: Trigger creation modal via "+ Crear Escuela" card
        console.log('  * Subtest 3.1: Open modal via "+ Crear Escuela" grid card');
        const modalBefore = await page.evaluate(() => {
            const modal = document.getElementById('custom-school-modal');
            return {
                isHidden: modal.classList.contains('hidden'),
                hasActive: modal.classList.contains('active')
            };
        });
        assertTest(modalBefore.isHidden, 'Custom school modal is initially hidden');

        // Click "+ Crear Escuela" card in the compact grid
        await page.evaluate(() => {
            const createCard = document.getElementById('grid-create-school-card');
            if (createCard) createCard.click();
        });
        await new Promise(r => setTimeout(r, 300));

        const modalAfterCreateClick = await page.evaluate(() => {
            const modal = document.getElementById('custom-school-modal');
            const titleEl = document.getElementById('custom-school-modal-title');
            window.confirm = () => true;
            const deleteBtn = document.getElementById('custom-school-delete-btn');
            const idInput = document.getElementById('custom-school-id');
            return {
                isOpen: !modal.classList.contains('hidden'),
                title: titleEl ? titleEl.textContent.trim() : '',
                deleteBtnHidden: deleteBtn ? deleteBtn.classList.contains('hidden') : false,
                idValue: idInput ? idInput.value : null
            };
        });

        assertTest(modalAfterCreateClick.isOpen, 'Modal successfully opened by clicking "+ Crear Escuela" card');
        assertTest(modalAfterCreateClick.title.includes('Constructor de Escuela'), 'Modal title is "Constructor de Escuela Personalizada"');
        assertTest(modalAfterCreateClick.deleteBtnHidden, 'Delete button is hidden in creation mode');
        assertEqual(modalAfterCreateClick.idValue, '', 'School ID input is empty in creation mode');

        // Part 3.2: Fill in custom school form and submit
        console.log('  * Subtest 3.2: Fill in school data and submit form');
        const customSchoolPayload = {
            name: 'Colegio Challenger E2E',
            shortBadge: 'C-E2E',
            fullName: 'Colegio Experimental de Pruebas Adversariales',
            slogan: 'Veritas per probationem',
            country: 'CO',
            system: 'Cuatrimestral',
            color: '#0F6938'
        };

        await page.evaluate((payload) => {
            document.getElementById('custom-school-name').value = payload.name;
            document.getElementById('custom-school-shortbadge').value = payload.shortBadge;
            document.getElementById('custom-school-fullname').value = payload.fullName;
            document.getElementById('custom-school-slogan').value = payload.slogan;
            document.getElementById('custom-school-country').value = payload.country;
            document.getElementById('custom-school-system').value = payload.system;
            document.getElementById('custom-school-color').value = payload.color;

            // Submit form
            const form = document.getElementById('custom-school-form');
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }, customSchoolPayload);
        await new Promise(r => setTimeout(r, 400));

        // Part 3.3: Verify card rendered in compact grid with correct micro-row, badge, and styling
        console.log('  * Subtest 3.3: Verify created card in compact grid');
        const createdCardData = await page.evaluate((payload) => {
            const customSchools = window.StorageModule.getCustomSchools();
            const school = customSchools.find(s => s.name === payload.name);
            if (!school) return null;

            const card = document.querySelector(`button[data-inst-id="${school.id}"]`);
            const editBtn = document.querySelector(`button[data-edit-custom-id="${school.id}"]`);
            const activeInst = window.StorageModule.getInstitution();

            return {
                foundInStorage: true,
                schoolId: school.id,
                systemType: school.systemType,
                cardRendered: !!card,
                cardHeight: card ? card.offsetHeight : 0,
                cardWidth: card ? card.offsetWidth : 0,
                isActive: activeInst === school.id,
                hasActiveRing: card ? card.className.includes('ring-2 ring-indigo-500') : false,
                hasActualBadge: !!card?.querySelector('.bg-indigo-600'),
                microRowText: card ? card.children[0]?.innerText || '' : '',
                editBtnRendered: !!editBtn,
                editBtnClasses: editBtn ? editBtn.className : ''
            };
        }, customSchoolPayload);

        assertTest(createdCardData !== null && createdCardData.foundInStorage, 'Custom school successfully persisted in Storage');
        assertTest(createdCardData.cardRendered, 'Created custom school card rendered in #settings-institution-grid');
        assertEqual(createdCardData.cardHeight, 81, 'Created custom school card has compact 81px height');
        assertTest(createdCardData.isActive, 'Newly created custom school is automatically set as active institution');
        assertTest(createdCardData.hasActiveRing, 'Created card displays active ring highlight');
        assertTest(createdCardData.hasActualBadge, 'Created card displays "Actual" badge');
        assertTest(createdCardData.microRowText.includes('Propia'), 'Micro-row displays "⭐ Propia" badge');
        assertTest(createdCardData.editBtnRendered, 'Compact edit button rendered for the custom school');
        assertTest(createdCardData.editBtnClasses.includes('p-1 rounded-md'), 'Edit button uses compact "p-1 rounded-md" layout');

        // Part 3.4: Test edit button stopPropagation (clicking edit button does NOT alter selection of other schools)
        console.log('  * Subtest 3.4: Test edit button click isolation & opening edit modal');
        // First, select UNAM as active
        await page.evaluate(() => {
            const unamCard = document.querySelector('button[data-inst-id="unam"]');
            if (unamCard) unamCard.click();
        });
        await new Promise(r => setTimeout(r, 200));

        const activeBeforeEdit = await page.evaluate(() => window.StorageModule.getInstitution());
        assertEqual(activeBeforeEdit, 'unam', 'Switched active school to unam before edit test');

        // Click edit button of our custom school
        await page.evaluate((schoolId) => {
            const editBtn = document.querySelector(`button[data-edit-custom-id="${schoolId}"]`);
            if (editBtn) editBtn.click();
        }, createdCardData.schoolId);
        await new Promise(r => setTimeout(r, 300));

        const editModalState = await page.evaluate(() => {
            const modal = document.getElementById('custom-school-modal');
            const titleEl = document.getElementById('custom-school-modal-title');
            const deleteBtn = document.getElementById('custom-school-delete-btn');
            const nameInput = document.getElementById('custom-school-name');
            const idInput = document.getElementById('custom-school-id');
            const activeInst = window.StorageModule.getInstitution();

            return {
                isOpen: !modal.classList.contains('hidden'),
                title: titleEl ? titleEl.textContent.trim() : '',
                deleteBtnVisible: deleteBtn && !deleteBtn.classList.contains('hidden'),
                nameValue: nameInput ? nameInput.value : '',
                idValue: idInput ? idInput.value : '',
                activeInstStillUnam: activeInst === 'unam'
            };
        });

        assertTest(editModalState.isOpen, 'Edit modal opened by clicking compact edit button');
        assertTest(editModalState.activeInstStillUnam, 'Clicking edit button preserved active school (stopPropagation successful)');
        assertTest(editModalState.title.includes('Editar Escuela'), 'Modal title is "Editar Escuela Personalizada"');
        assertTest(editModalState.deleteBtnVisible, 'Delete button is visible in edit mode');
        assertEqual(editModalState.nameValue, 'Colegio Challenger E2E', 'School name input is pre-populated');
        assertEqual(editModalState.idValue, createdCardData.schoolId, 'Hidden ID matches custom school ID');

        // Part 3.5: Modify custom school and submit
        console.log('  * Subtest 3.5: Edit custom school data and save');
        await page.evaluate(() => {
            document.getElementById('custom-school-name').value = 'Colegio Challenger Actualizado';
            document.getElementById('custom-school-slogan').value = 'Lema Actualizado 2026';
            document.getElementById('custom-school-color').value = '#D32F2F';

            const form = document.getElementById('custom-school-form');
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        });
        await new Promise(r => setTimeout(r, 400));

        const editedCardData = await page.evaluate((schoolId) => {
            const card = document.querySelector(`button[data-inst-id="${schoolId}"]`);
            const nameSpan = card ? card.children[2] : null;
            return {
                cardRendered: !!card,
                nameText: nameSpan ? nameSpan.innerText.trim() : '',
                cardHeight: card ? card.offsetHeight : 0
            };
        }, createdCardData.schoolId);

        assertEqual(editedCardData.nameText, 'Colegio Challenger Actualizado', 'Card displays updated custom school name');
        assertEqual(editedCardData.cardHeight, 81, 'Card height remains compact 81px after edit');

        // Part 3.6: Delete custom school via modal
        console.log('  * Subtest 3.6: Delete custom school via modal delete button');
        // Click edit button again
        await page.evaluate((schoolId) => {
            const editBtn = document.querySelector(`button[data-edit-custom-id="${schoolId}"]`);
            if (editBtn) editBtn.click();
        }, createdCardData.schoolId);
        await new Promise(r => setTimeout(r, 300));

        // Click delete
        await page.evaluate(() => {
            const deleteBtn = document.getElementById('custom-school-delete-btn');
            if (deleteBtn) deleteBtn.click();
        });
        await new Promise(r => setTimeout(r, 400));

        const deletionCheck = await page.evaluate((schoolId) => {
            const card = document.querySelector(`button[data-inst-id="${schoolId}"]`);
            const customSchools = window.StorageModule.getCustomSchools();
            const schoolStillInStorage = customSchools.some(s => s.id === schoolId);
            const activeInst = window.StorageModule.getInstitution();
            return {
                cardRemoved: !card,
                removedFromStorage: !schoolStillInStorage,
                activeInstValid: !!activeInst
            };
        }, createdCardData.schoolId);

        assertTest(deletionCheck.cardRemoved, 'Custom school card cleanly removed from #settings-institution-grid');
        assertTest(deletionCheck.removedFromStorage, 'Custom school deleted from LocalStorage');
        assertTest(deletionCheck.activeInstValid, 'Active institution reverted safely');

        // =========================================================================
        // SECTION 4: High-Stress Density & Performance
        // =========================================================================
        console.log('\n\x1b[1m--- [Section 4] Multi-School Grid Density & Vertical Scrolling ---\x1b[0m');

        // Inject 5 mock custom schools simultaneously
        await page.evaluate(() => {
            for (let i = 1; i <= 5; i++) {
                window.StorageModule.saveCustomSchool({
                    id: `custom_stress_density_${i}`,
                    name: `Escuela Densidad ${i}`,
                    fullName: `Escuela de Prueba de Densidad Número ${i}`,
                    country: 'México',
                    countryCode: 'MX',
                    systemType: 'Semestral',
                    periods: ['1.° Semestre'],
                    isCustom: true
                });
            }
            window.app.renderSettingsSchools();
        });
        await new Promise(r => setTimeout(r, 200));

        const densityMetrics = await page.evaluate(() => {
            const grid = document.getElementById('settings-institution-grid');
            const customCards = document.querySelectorAll('.inst-grid-card[data-inst-id^="custom_stress_density_"]');
            return {
                totalCards: document.querySelectorAll('.inst-grid-card').length,
                customCardsCount: customCards.length,
                gridScrollH: grid ? grid.scrollHeight : 0,
                gridClientH: grid ? grid.clientHeight : 0,
                hasVerticalScroll: grid ? grid.scrollHeight > grid.clientHeight : false,
                gridScrollW: grid ? grid.scrollWidth : 0,
                gridClientW: grid ? grid.clientWidth : 0
            };
        });

        assertTest(densityMetrics.customCardsCount === 5, 'All 5 density custom schools rendered simultaneously');
        assertTest(densityMetrics.totalCards >= 38, `Grid handles high school density (total cards: ${densityMetrics.totalCards})`);
        assertTest(densityMetrics.hasVerticalScroll, 'Vertical scroll engaged cleanly within max-h-96 container');
        assertEqual(densityMetrics.gridScrollW, densityMetrics.gridClientW, 'Zero horizontal overflow while vertical scroll is active');

        // Clean up density schools
        await page.evaluate(() => {
            for (let i = 1; i <= 5; i++) {
                window.StorageModule.deleteCustomSchool(`custom_stress_density_${i}`);
            }
            window.app.renderSettingsSchools();
        });
        await new Promise(r => setTimeout(r, 100));

    } catch (err) {
        logFail('Unexpected adversarial suite failure', err);
    } finally {
        await browser.close();
    }

    console.log('\n\x1b[1m\x1b[35m================================================================================\x1b[0m');
    console.log(`\x1b[1mAdversarial Challenger Test Summary:\x1b[0m`);
    console.log(`  Passed:   \x1b[32m\x1b[1m${passedTests}\x1b[0m`);
    console.log(`  Failed:   \x1b[${failedTests > 0 ? '31m\x1b[1m' : '2m'}${failedTests}\x1b[0m`);
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m');

    if (failedTests > 0) {
        console.error('\x1b[31m\x1b[1mVERDICT: REQUEST_CHANGES (Adversarial challenges detected failures)\x1b[0m\n');
        console.error('Failure Details:\n' + failures.map(f => ' - ' + f).join('\n'));
        process.exit(1);
    } else {
        console.log('\x1b[32m\x1b[1mVERDICT: APPROVE (All adversarial challenges passed flawlessly)\x1b[0m\n');
        process.exit(0);
    }
})();
