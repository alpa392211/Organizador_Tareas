/**
 * adversarial_settings_cards_m2.js
 * Independent Adversarial Stress-Testing Suite for Milestone 2
 * Reviewer & Critic: reviewer_v134_m2_1
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const helpers = require('./test_helpers');

let passedTests = 0;
let failedTests = 0;

function pass(desc) {
    passedTests++;
    console.log(`  \x1b[32m[ADVERSARIAL PASS]\x1b[0m ${desc}`);
}

function fail(desc, err) {
    failedTests++;
    console.error(`  \x1b[31m[ADVERSARIAL FAIL]\x1b[0m ${desc}: ${err?.message || err}`);
}

(async () => {
    console.log('\x1b[1m\x1b[35m========================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[35m  ADVERSARIAL STRESS TEST: SETTINGS SCHOOL CARDS (MILESTONE 2)         \x1b[0m');
    console.log('\x1b[1m\x1b[35m========================================================================\x1b[0m\n');

    const browser = await helpers.launchBrowser();

    try {
        const page = await helpers.createPage(browser, { viewport: { width: 360, height: 740 } });

        // Setup page to settings view
        await page.evaluate(() => {
            localStorage.setItem('org_escolar_onboarding_v1', 'true');
            localStorage.setItem('org_escolar_cycle_configured_v1', 'true');
            if (window.app && typeof window.app.switchView === 'function') {
                window.app.switchView('settings');
            }
        });
        await new Promise(r => setTimeout(r, 400));

        // -------------------------------------------------------------
        // Challenge 1: Scrollbar Jitter Invariant (scrollHeight stability)
        // -------------------------------------------------------------
        console.log('\x1b[1m--- [Challenge 1] Scrollbar Jitter Invariant (Zero scrollHeight delta on card select) ---\x1b[0m');

        const jitterTest = await page.evaluate(() => {
            const grid = document.getElementById('settings-institution-grid');
            if (!grid) return { error: 'Grid not found' };

            const initialScrollHeight = grid.scrollHeight;
            const initialScrollWidth = grid.scrollWidth;

            const cards = Array.from(grid.querySelectorAll('.inst-grid-card'));
            const deltas = [];

            // Select 10 different cards and measure scrollHeight/scrollWidth changes
            for (let i = 0; i < Math.min(10, cards.length); i++) {
                const card = cards[i];
                card.click();
                const sh = grid.scrollHeight;
                const sw = grid.scrollWidth;
                deltas.push({
                    cardId: card.dataset.instId,
                    deltaH: sh - initialScrollHeight,
                    deltaW: sw - initialScrollWidth
                });
            }

            return {
                initialScrollHeight,
                initialScrollWidth,
                deltas,
                maxDeltaH: Math.max(...deltas.map(d => Math.abs(d.deltaH))),
                maxDeltaW: Math.max(...deltas.map(d => Math.abs(d.deltaW)))
            };
        });

        assert.strictEqual(jitterTest.maxDeltaH, 0, `scrollHeight must remain identical on selection (jitter prevention). Got delta: ${jitterTest.maxDeltaH}`);
        assert.strictEqual(jitterTest.maxDeltaW, 0, `scrollWidth must remain identical on selection (no horizontal bulge). Got delta: ${jitterTest.maxDeltaW}`);
        pass(`Jitter invariant verified: zero layout expansion (maxDeltaH=0, maxDeltaW=0 across 10 card selections)`);

        // -------------------------------------------------------------
        // Challenge 2: Extreme School Names and Text Truncation
        // -------------------------------------------------------------
        console.log('\n\x1b[1m--- [Challenge 2] Extreme String Lengths & Truncation Defense ---\x1b[0m');

        const extremeStringsTest = await page.evaluate(() => {
            const extremeSchool = {
                id: 'custom_extreme_stress_test',
                name: 'Universidad Experimental Intergaláctica de Alta Especialización Tecnológica de la República',
                fullName: 'Universidad Experimental Intergaláctica de Alta Especialización Tecnológica de la República Mexicana y del Caribe',
                country: 'México',
                countryCode: 'MX',
                slogan: 'Conocimiento sin límites en el cosmos hiperbólico de la física cuántica aplicada',
                systemType: 'Cuatrimestral Modular Intensivo Flexible',
                periods: ['Cuatrimestre 1', 'Cuatrimestre 2'],
                isCustom: true
            };

            window.StorageModule.saveCustomSchool(extremeSchool);
            window.app.renderInstitutionGrid();

            const card = document.querySelector('button[data-inst-id="custom_extreme_stress_test"]');
            if (!card) return { error: 'Card not found' };

            const rect = card.getBoundingClientRect();
            const nameEl = card.querySelector('.truncate.font-black');
            const subEl = card.querySelector('.truncate.font-medium');

            return {
                cardHeight: rect.height,
                cardWidth: rect.width,
                nameClientWidth: nameEl ? nameEl.clientWidth : 0,
                nameScrollWidth: nameEl ? nameEl.scrollWidth : 0,
                subClientWidth: subEl ? subEl.clientWidth : 0,
                subScrollWidth: subEl ? subEl.scrollWidth : 0,
                subText: subEl ? subEl.innerText : '',
                isNameTruncated: nameEl ? nameEl.scrollWidth > nameEl.clientWidth : false,
                isSubTruncated: subEl ? subEl.scrollWidth > subEl.clientWidth : false
            };
        });

        console.log('    [DEBUG extremeStringsTest]', extremeStringsTest);
        assert(extremeStringsTest.cardHeight <= 84, `Card height with extreme 95-char name must remain <= 84px (actual: ${extremeStringsTest.cardHeight}px)`);
        assert(extremeStringsTest.isNameTruncated, `Long school name must be truncated with ellipsis without overflowing`);
        assert(extremeStringsTest.isSubTruncated, `Long subtitle must be truncated with ellipsis without overflowing`);
        pass(`Extreme strings safely truncated without expanding card height (${extremeStringsTest.cardHeight}px <= 84px)`);

        // -------------------------------------------------------------
        // Challenge 3: Custom School Edit Button vs Active Badge Collision
        // -------------------------------------------------------------
        console.log('\n\x1b[1m--- [Challenge 3] Custom School Edit Button vs Active Badge Collision ---\x1b[0m');

        const collisionTest = await page.evaluate(() => {
            // Select the custom school
            const cardBefore = document.querySelector('button[data-inst-id="custom_extreme_stress_test"]');
            if (cardBefore) cardBefore.click();

            const customCard = document.querySelector('button[data-inst-id="custom_extreme_stress_test"]');
            const editBtn = document.querySelector('button[data-edit-custom-id="custom_extreme_stress_test"]');
            const activeBadge = customCard?.querySelector('.bg-indigo-600');

            if (!editBtn || !activeBadge) {
                return { error: 'Elements missing', hasEditBtn: !!editBtn, hasBadge: !!activeBadge };
            }

            const editRect = editBtn.getBoundingClientRect();
            const badgeRect = activeBadge.getBoundingClientRect();

            // Check if bounding boxes overlap
            const overlapX = !(badgeRect.right < editRect.left || badgeRect.left > editRect.right);
            const overlapY = !(badgeRect.bottom < editRect.top || badgeRect.top > editRect.bottom);
            const collides = overlapX && overlapY;

            return {
                editRect: { left: editRect.left, right: editRect.right, top: editRect.top, bottom: editRect.bottom },
                badgeRect: { left: badgeRect.left, right: badgeRect.right, top: badgeRect.top, bottom: badgeRect.bottom },
                collides,
                gapBetween: editRect.left - badgeRect.right
            };
        });

        assertTest(!collisionTest.collides, `Active badge and Edit button must not collide (gap: ${collisionTest.gapBetween}px)`);
        assertTest(collisionTest.gapBetween >= 0, `Positive clearance between Active badge and Edit button`);
        pass(`No collision between Actual badge and Edit button on active custom card (clearance: ${collisionTest.gapBetween}px)`);

        // -------------------------------------------------------------
        // Challenge 4: Edit Button Event Propagation Isolation
        // -------------------------------------------------------------
        console.log('\n\x1b[1m--- [Challenge 4] Edit Button Event Propagation Isolation ---\x1b[0m');

        // First set institution to unam
        await page.evaluate(() => {
            window.app.setInstitution('unam');
        });

        const propagationTest = await page.evaluate(() => {
            let modalOpened = false;
            // Intercept openCustomSchoolModal
            const origOpen = window.app.openCustomSchoolModal;
            window.app.openCustomSchoolModal = function(id) {
                modalOpened = (id === 'custom_extreme_stress_test');
            };

            const editBtn = document.querySelector('button[data-edit-custom-id="custom_extreme_stress_test"]');
            editBtn.click();

            // Check current active institution in storage
            const activeInst = window.StorageModule.getInstitution();

            // Restore method
            window.app.openCustomSchoolModal = origOpen;

            return {
                modalOpened,
                activeInst,
                didNotSelect: activeInst === 'unam'
            };
        });

        assertTest(propagationTest.modalOpened, 'Clicking edit button calls openCustomSchoolModal with school id');
        assertTest(propagationTest.didNotSelect, `Clicking edit button did not accidentally select custom school (remained: ${propagationTest.activeInst})`);
        pass(`Edit button click is cleanly isolated (stopPropagation works perfectly)`);

        // Clean up extreme test school
        await page.evaluate(() => {
            window.StorageModule.deleteCustomSchool('custom_extreme_stress_test');
            window.app.renderInstitutionGrid();
        });

        // -------------------------------------------------------------
        // Challenge 5: Visual Verification Screenshot Capture
        // -------------------------------------------------------------
        console.log('\n\x1b[1m--- [Challenge 5] Visual Snapshot Artifact Generation ---\x1b[0m');

        await page.evaluate(() => {
            document.querySelectorAll('#toast-container > *').forEach(t => t.remove());
            const modal = document.getElementById('cycle-setup-modal');
            if (modal) modal.classList.add('hidden');
            const grid = document.getElementById('settings-institution-grid');
            if (grid) grid.scrollIntoView({ behavior: 'instant', block: 'start' });
        });
        await new Promise(r => setTimeout(r, 200));

        const screenshotPath = path.resolve(__dirname, '../.agents/teamwork/reviewer_v134_m2_1/settings_cards_m2_verified.png');
        const gridElement = await page.$('#settings-institution-grid');
        if (gridElement) {
            await gridElement.screenshot({ path: screenshotPath });
            pass(`Captured visual screenshot artifact at: ${screenshotPath}`);
        } else {
            fail('Could not capture screenshot of #settings-institution-grid');
        }

        // -------------------------------------------------------------
        // Challenge 6: Responsive Columns Sanity at All Breakpoints
        // -------------------------------------------------------------
        console.log('\n\x1b[1m--- [Challenge 6] Column Count Verification per CSS Breakpoint ---\x1b[0m');

        const breakpointChecks = [
            { width: 360, expectedCols: 2, label: 'Mobile (<640px)' },
            { width: 640, expectedCols: 3, label: 'sm (640px)' },
            { width: 768, expectedCols: 4, label: 'md (768px)' },
            { width: 1024, expectedCols: 5, label: 'lg (1024px)' }
        ];

        for (const bp of breakpointChecks) {
            await page.setViewport({ width: bp.width, height: 800 });
            await new Promise(r => setTimeout(r, 60));

            const computedCols = await page.evaluate(() => {
                const grid = document.getElementById('settings-institution-grid');
                if (!grid) return 0;
                const cs = window.getComputedStyle(grid);
                const gridTemplateColumns = cs.getPropertyValue('grid-template-columns');
                return gridTemplateColumns.split(' ').filter(Boolean).length;
            });

            assertEqual(computedCols, bp.expectedCols, `${bp.label} computes to exactly ${bp.expectedCols} grid columns`);
        }

    } catch (err) {
        fail('Adversarial suite failure', err);
    } finally {
        await browser.close();
    }

    console.log('\n\x1b[1m\x1b[35m========================================================================\x1b[0m');
    console.log(`\x1b[1mAdversarial Stress Test Summary:\x1b[0m`);
    console.log(`  Passed:   \x1b[32m\x1b[1m${passedTests}\x1b[0m`);
    console.log(`  Failed:   \x1b[${failedTests > 0 ? '31m\x1b[1m' : '2m'}${failedTests}\x1b[0m`);
    console.log('\x1b[1m\x1b[35m========================================================================\x1b[0m\n');

    if (failedTests > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
})();

function assertTest(condition, desc) {
    try {
        assert(condition, desc);
        pass(desc);
    } catch (err) {
        fail(desc, err);
    }
}

function assertEqual(actual, expected, desc) {
    try {
        assert.strictEqual(actual, expected, `${desc} (expected: ${expected}, got: ${actual})`);
        pass(desc);
    } catch (err) {
        fail(desc, err);
    }
}
