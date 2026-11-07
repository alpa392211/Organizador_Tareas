/**
 * tests/adversarial_reviewer_m2.js
 * Independent Adversarial Stress-Test & Quality Verification Suite for Milestone 2
 * Roles: Reviewer & Adversarial Critic
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

(async () => {
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[35m  ADVERSARIAL STRESS-TEST & INTEGRITY AUDIT: MILESTONE 2 (SETTINGS CARDS)      \x1b[0m');
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m\n');

    const browser = await helpers.launchBrowser();

    try {
        const page = await helpers.createPage(browser, { viewport: { width: 360, height: 740 } });

        // Navigate to settings with configured onboarding
        await page.evaluate(() => {
            localStorage.setItem('org_escolar_onboarding_v1', 'true');
            localStorage.setItem('org_escolar_cycle_configured_v1', 'true');
            localStorage.setItem('org_escolar_institution', 'unam');
            if (typeof window.navigateToSettings === 'function') {
                window.navigateToSettings();
            } else if (window.app && typeof window.app.switchView === 'function') {
                window.app.switchView('settings');
            }
        });
        await new Promise(r => setTimeout(r, 400));

        // =====================================================================
        // SECTION 1: INTEGRITY AUDIT (No facade/dummy mocks, genuine logic)
        // =====================================================================
        console.log('\x1b[1m--- [Section 1] Integrity Audit & Storage Genuine Sync ---\x1b[0m');

        const initialStorageVal = await page.evaluate(() => {
            return localStorage.getItem('org_escolar_institution');
        });
        assertEqual(initialStorageVal, 'unam', 'Initial localStorage raw key is genuine "unam"');

        // Test genuine selection of IPN and check raw localStorage write
        await page.evaluate(() => {
            const ipnCard = document.querySelector('button[data-inst-id="ipn"]');
            if (ipnCard) ipnCard.click();
        });
        await new Promise(r => setTimeout(r, 200));

        const postIpnRawStorage = await page.evaluate(() => {
            return localStorage.getItem('org_escolar_institution');
        });
        assertEqual(postIpnRawStorage, 'ipn', 'Selecting IPN genuinely writes "ipn" directly to localStorage');

        // Test CSS variable update on :root
        const cssPrimaryVar = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--inst-primary').trim();
        });
        const ipnExpectedPrimary = await page.evaluate(() => {
            return window.InstitutionsModule.getInstitution('ipn').colors.primary;
        });
        assertEqual(cssPrimaryVar, ipnExpectedPrimary, `CSS variable --inst-primary matches IPN primary color (${ipnExpectedPrimary})`);

        // Test header and drawer updating
        const headerInfo = await page.evaluate(() => {
            const nameEl = document.getElementById('header-inst-name');
            const drawerNameEl = document.getElementById('drawer-inst-name');
            return {
                headerName: nameEl?.textContent?.trim(),
                drawerName: drawerNameEl?.textContent?.trim()
            };
        });
        assertTest(headerInfo.headerName.includes('IPN') || headerInfo.headerName.includes('Politécnico'), 'Header institution name updated to IPN');
        assertTest(headerInfo.drawerName.includes('IPN') || headerInfo.drawerName.includes('Politécnico'), 'Drawer institution name updated to IPN');

        // =====================================================================
        // SECTION 2: ADVERSARIAL ZERO HORIZONTAL OVERFLOW STRESS TEST
        // Testing across 13 diverse viewports including extreme boundaries
        // =====================================================================
        console.log('\n\x1b[1m--- [Section 2] Adversarial Zero Horizontal Overflow Stress Test ---\x1b[0m');

        const stressViewports = [
            { w: 320, h: 568, name: 'iPhone SE (1st gen) - Ultra compact 320px' },
            { w: 360, h: 740, name: 'Samsung Galaxy A-series - 360px' },
            { w: 375, h: 667, name: 'iPhone 6/7/8/SE2 - 375px' },
            { w: 390, h: 844, name: 'iPhone 12/13/14 - 390px' },
            { w: 412, h: 915, name: 'Pixel 7 / Galaxy S21 - 412px' },
            { w: 480, h: 854, name: 'Large phablet / wide mobile - 480px' },
            { w: 600, h: 960, name: 'Foldable phone unfolded - 600px' },
            { w: 768, h: 1024, name: 'iPad Portrait - 768px' },
            { w: 820, h: 1180, name: 'iPad Air Portrait - 820px' },
            { w: 1024, h: 768, name: 'iPad Landscape / Netbook - 1024px' },
            { w: 1280, h: 800, name: 'Laptop screen - 1280px' },
            { w: 1440, h: 900, name: 'High-res desktop - 1440px' },
            { w: 1920, h: 1080, name: 'Full HD Monitor - 1920px' }
        ];

        for (const vp of stressViewports) {
            await page.setViewport({ width: vp.w, height: vp.h });
            await new Promise(r => setTimeout(r, 80));

            const overflowData = await page.evaluate((vpWidth) => {
                const body = document.body;
                const doc = document.documentElement;
                const grid = document.getElementById('settings-institution-grid');
                const accordionBody = grid?.closest('.settings-accordion-body');
                const pills = document.getElementById('settings-country-pills');

                // Inspect any protruding children in settings view
                const settingsView = document.getElementById('settings-view');
                let protrudingElementsCount = 0;
                if (settingsView) {
                    const allElems = settingsView.querySelectorAll('*');
                    for (const el of allElems) {
                        // Ignore elements with overflow-x auto or explicitly hidden or icons
                        if (el.id === 'settings-country-pills' || el.closest('#settings-country-pills')) continue;
                        const rect = el.getBoundingClientRect();
                        if (rect.right > vpWidth + 1) { // 1px subpixel tolerance
                            protrudingElementsCount++;
                        }
                    }
                }

                return {
                    bodyOverflow: body.scrollWidth > body.clientWidth,
                    bodyScrollDiff: body.scrollWidth - body.clientWidth,
                    docOverflow: doc.scrollWidth > doc.clientWidth,
                    docScrollDiff: doc.scrollWidth - doc.clientWidth,
                    gridOverflow: grid ? (grid.scrollWidth > grid.clientWidth) : false,
                    gridScrollDiff: grid ? (grid.scrollWidth - grid.clientWidth) : 0,
                    protrudingElementsCount
                };
            }, vp.w);

            assertTest(!overflowData.bodyOverflow, `${vp.name}: body scrollWidth (${overflowData.bodyScrollDiff}px diff) === clientWidth`);
            assertTest(!overflowData.docOverflow, `${vp.name}: html doc scrollWidth (${overflowData.docScrollDiff}px diff) === clientWidth`);
            assertTest(!overflowData.gridOverflow, `${vp.name}: grid scrollWidth (${overflowData.gridScrollDiff}px diff) === clientWidth`);
            assertTest(overflowData.protrudingElementsCount === 0, `${vp.name}: zero elements protruding beyond viewport width`);
        }

        // =====================================================================
        // SECTION 3: ALL CARDS HEIGHT AUDIT (No card may exceed 88px)
        // =====================================================================
        console.log('\n\x1b[1m--- [Section 3] All Catalog Cards Height Audit (360px) ---\x1b[0m');

        await page.setViewport({ width: 360, height: 740 });
        await new Promise(r => setTimeout(r, 100));

        const allCardHeights = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.inst-grid-card'));
            const heights = cards.map(c => ({
                id: c.dataset.instId,
                name: c.querySelector('.text-\\[11px\\]')?.innerText?.trim(),
                height: c.offsetHeight
            }));
            const maxH = Math.max(...heights.map(h => h.height));
            const minH = Math.min(...heights.map(h => h.height));
            const createCardH = document.getElementById('grid-create-school-card')?.offsetHeight;
            return { heights, maxH, minH, count: heights.length, createCardH };
        });

        assertTest(allCardHeights.count >= 30, `Full catalog verified (${allCardHeights.count} institutions present)`);
        assertTest(allCardHeights.maxH <= 88, `Maximum card height in catalog is <= 88px (worst-case: ${allCardHeights.maxH}px)`);
        assertTest(allCardHeights.minH >= 76, `Minimum card height in catalog is >= 76px (minimum: ${allCardHeights.minH}px)`);
        assertEqual(allCardHeights.maxH, 81, `All standard institution cards measure exactly 81px tall`);
        assertEqual(allCardHeights.createCardH, 81, `"+ Crear Escuela" card matches standard card height (81px)`);

        // =====================================================================
        // SECTION 4: ADVERSARIAL CUSTOM SCHOOL WITH EXTREME / MALICIOUS INPUTS
        // =====================================================================
        console.log('\n\x1b[1m--- [Section 4] Adversarial Custom School: Extreme Length & XSS Attack ---\x1b[0m');

        const xssExtremeSchool = {
            id: 'custom_extreme_adversarial',
            name: 'Universidad Intercontinental Autónoma de Ciencias Cuánticas, Nanotecnología y Robótica Aeroespacial Avanzada de la Federación',
            shortBadge: 'UIACCNRAAF',
            fullName: 'Instituto Internacional Politécnico y Tecnológico Intercontinental de Investigaciones de Alta Precisión',
            slogan: 'Conocimiento sin límites para la trascendencia universal de la humanidad <script>window.__xss_compromised = true;</script>',
            country: 'México',
            countryCode: 'MX',
            systemType: 'Cuatrimestral Extendido Intensivo',
            colors: { primary: '#DC2626', secondary: '#F87171', accent: '#FECACA', text: '#FFFFFF' },
            periods: ['Cuatrimestre 1', 'Cuatrimestre 2', 'Cuatrimestre 3', 'Cuatrimestre 4'],
            isCustom: true
        };

        await page.evaluate((school) => {
            window.StorageModule.saveCustomSchool(school);
            window.app.renderInstitutionGrid();
        }, xssExtremeSchool);
        await new Promise(r => setTimeout(r, 150));

        const extremeCardMetrics = await page.evaluate(() => {
            const card = document.querySelector('button[data-inst-id="custom_extreme_adversarial"]');
            const xssTriggered = !!window.__xss_compromised;
            const editBtn = document.querySelector('button[data-edit-custom-id="custom_extreme_adversarial"]');

            return {
                exists: !!card,
                height: card ? card.offsetHeight : 0,
                xssTriggered,
                hasPropiaTag: card?.innerText?.includes('Propia'),
                editBtnExists: !!editBtn,
                gridScrollW: document.getElementById('settings-institution-grid')?.scrollWidth,
                gridClientW: document.getElementById('settings-institution-grid')?.clientWidth
            };
        });

        assertTest(extremeCardMetrics.exists, 'Adversarial extreme custom school rendered in grid');
        assertTest(!extremeCardMetrics.xssTriggered, 'XSS script injection safely neutralized without execution');
        assertTest(extremeCardMetrics.height <= 88, `Adversarial card with 120-char name stays compact (actual: ${extremeCardMetrics.height}px <= 88px)`);
        assertEqual(extremeCardMetrics.height, 81, `Adversarial card maintains uniform 81px height despite super long name`);
        assertTest(extremeCardMetrics.hasPropiaTag, 'Card displays "⭐ Propia" badge');
        assertTest(extremeCardMetrics.editBtnExists, 'Compact edit button rendered');
        assertTest(extremeCardMetrics.gridScrollW <= extremeCardMetrics.gridClientW, 'Grid has zero horizontal overflow with extreme text length');

        // =====================================================================
        // SECTION 5: COMPACT EDIT BUTTON STOP PROPAGATION TEST
        // Clicking edit button must open modal and NOT select the school!
        // =====================================================================
        console.log('\n\x1b[1m--- [Section 5] Compact Edit Button & Event Propagation Test ---\x1b[0m');

        // Currently active is 'ipn'
        const preEditActive = await page.evaluate(() => window.StorageModule.getInstitution());
        assertEqual(preEditActive, 'ipn', 'Pre-edit active institution is IPN');

        // Click the edit button on the custom school
        await page.evaluate(() => {
            const editBtn = document.querySelector('button[data-edit-custom-id="custom_extreme_adversarial"]');
            if (editBtn) editBtn.click();
        });
        await new Promise(r => setTimeout(r, 200));

        // Verify active institution did NOT change
        const postEditActive = await page.evaluate(() => window.StorageModule.getInstitution());
        assertEqual(postEditActive, 'ipn', 'Clicking edit button stopped propagation and did NOT change active school to custom');

        // Verify custom school modal opened
        const modalOpenState = await page.evaluate(() => {
            const modal = document.getElementById('custom-school-modal');
            const title = document.getElementById('custom-school-modal-title');
            const nameInput = document.getElementById('custom-school-name');
            return {
                modalActive: modal?.classList.contains('active'),
                modalNotHidden: !modal?.classList.contains('hidden'),
                titleText: title?.textContent,
                prefilledName: nameInput?.value
            };
        });

        assertTest(modalOpenState.modalNotHidden && modalOpenState.modalActive, 'Custom school modal opened in edit mode');
        assertTest(modalOpenState.titleText.includes('Editar'), 'Modal title reflects "Editar Escuela Personalizada"');
        assertTest(modalOpenState.prefilledName.includes('Universidad Intercontinental'), 'Modal inputs prefilled with existing custom school data');

        // Close modal
        await page.evaluate(() => {
            if (typeof window.app.closeCustomSchoolModal === 'function') {
                window.app.closeCustomSchoolModal();
            }
        });
        await new Promise(r => setTimeout(r, 300));

        // Clean up test custom school
        await page.evaluate(() => {
            window.StorageModule.deleteCustomSchool('custom_extreme_adversarial');
            window.app.renderInstitutionGrid();
        });
        await new Promise(r => setTimeout(r, 100));

        // =====================================================================
        // SECTION 6: COMPREHENSIVE COUNTRY PILLS AUDIT (No flag emojis, precise filters)
        // =====================================================================
        console.log('\n\x1b[1m--- [Section 6] Country Pills Filtering & Flag Emoji Audit ---\x1b[0m');

        const pillsData = await page.evaluate(() => {
            const pills = Array.from(document.querySelectorAll('#settings-country-pills button'));
            const flagRegex = /[\uD83C][\uDDE6-\uDDFF]{2}/;
            return pills.map(p => ({
                id: p.dataset.countryFilter,
                text: p.innerText?.trim(),
                hasFlagEmoji: flagRegex.test(p.innerText)
            }));
        });

        assertTest(pillsData.length >= 6, `Country filter pills rendered (found: ${pillsData.length})`);
        const anyFlag = pillsData.some(p => p.hasFlagEmoji);
        assertTest(!anyFlag, 'ZERO flag emojis across all country filter pills (conforms to original user request)');

        // Test each country filter individually
        const countryCodes = pillsData.filter(p => p.id !== 'all' && p.id !== 'custom').map(p => p.id);
        for (const code of countryCodes) {
            await page.evaluate((cCode) => {
                const btn = document.querySelector(`button[data-country-filter="${cCode}"]`);
                if (btn) btn.click();
            }, code);
            await new Promise(r => setTimeout(r, 100));

            const filterResult = await page.evaluate((cCode) => {
                const cards = Array.from(document.querySelectorAll('#settings-institution-grid .inst-grid-card'));
                const instIds = cards.map(c => c.dataset.instId);
                const mismatches = instIds.filter(id => {
                    const inst = window.InstitutionsModule.getInstitution(id);
                    return inst.countryCode !== cCode;
                });
                return { count: cards.length, mismatches };
            }, code);

            assertTest(filterResult.count >= 1, `Country filter ${code}: displays ${filterResult.count} institutions`);
            assertEqual(filterResult.mismatches.length, 0, `Country filter ${code}: 100% of displayed cards belong to ${code}`);
        }

        // Test "Mis Escuelas" when 0 custom schools exist
        await page.evaluate(() => {
            const btn = document.querySelector('button[data-country-filter="custom"]');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 100));

        const emptyCustomResult = await page.evaluate(() => {
            const cards = document.querySelectorAll('#settings-institution-grid .inst-grid-card');
            const createCard = document.getElementById('grid-create-school-card');
            return {
                cardsCount: cards.length,
                hasCreateCard: !!createCard
            };
        });
        assertEqual(emptyCustomResult.cardsCount, 0, 'Filtering by "Mis Escuelas" with 0 custom schools renders 0 institution cards');
        assertTest(emptyCustomResult.hasCreateCard, '"+ Crear Escuela" card remains accessible and functional');

        // Restore "Todas"
        await page.evaluate(() => {
            const btn = document.querySelector('button[data-country-filter="all"]');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 100));

        const restoredCount = await page.evaluate(() => {
            return document.querySelectorAll('#settings-institution-grid .inst-grid-card').length;
        });
        assertTest(restoredCount >= 30, `Restored "Todas" displays full catalog (${restoredCount} institutions)`);

        // =====================================================================
        // SECTION 7: SCROLL STABILITY & ZERO SCROLLBAR JITTER
        // Verify no scale-[1.02] transform or border collapse causes jitter
        // =====================================================================
        console.log('\n\x1b[1m--- [Section 7] Scroll Stability & Scale Jitter Elimination ---\x1b[0m');

        const jitterAudit = await page.evaluate(() => {
            const activeCard = document.querySelector('.inst-grid-card.ring-2');
            const cs = window.getComputedStyle(activeCard);
            const grid = document.getElementById('settings-institution-grid');

            // Scroll down halfway inside max-h-96
            grid.scrollTop = 150;
            const scrollWAfter = grid.scrollWidth;
            const clientWAfter = grid.clientWidth;

            return {
                transform: cs.transform,
                hasScaleClass: activeCard.className.includes('scale-'),
                gridHorizontalOverflowAfterScroll: scrollWAfter > clientWAfter
            };
        });

        assertTest(!jitterAudit.hasScaleClass, 'Active card has no scale-[1.02] or scale classes');
        assertTest(jitterAudit.transform === 'none' || !jitterAudit.transform.includes('matrix(1.02'), 'Active card computed transform does not scale up');
        assertTest(!jitterAudit.gridHorizontalOverflowAfterScroll, 'Scrolling down in grid produces zero horizontal overflow or jitter');

    } catch (err) {
        logFail('Unexpected adversarial suite failure', err);
    } finally {
        await browser.close();
    }

    console.log('\n\x1b[1m\x1b[35m================================================================================\x1b[0m');
    console.log(`\x1b[1mAdversarial Review Test Summary:\x1b[0m`);
    console.log(`  Passed:   \x1b[32m\x1b[1m${passedTests}\x1b[0m`);
    console.log(`  Failed:   \x1b[${failedTests > 0 ? '31m\x1b[1m' : '2m'}${failedTests}\x1b[0m`);
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m\n');

    if (failedTests > 0) {
        console.error('\x1b[31m\x1b[1mRESULT: FAILURE (Adversarial stress-test revealed flaws!)\x1b[0m\n');
        process.exit(1);
    } else {
        console.log('\x1b[32m\x1b[1mRESULT: SUCCESS (All adversarial review and integrity tests passed!)\x1b[0m\n');
        process.exit(0);
    }
})();
