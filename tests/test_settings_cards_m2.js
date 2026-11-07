/**
 * test_settings_cards_m2.js - Milestone 2 E2E Verification Suite (v1.3.4)
 * Verifies Settings School Cards Compactness, Zero Overflow, Responsive Grid, and Functionality
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

(async () => {
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[36m  TEST SUITE: MILESTONE 2 - SETTINGS SCHOOL CARDS COMPACTNESS (v1.3.4)  \x1b[0m');
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m\n');

    const browser = await helpers.launchBrowser();

    try {
        const page = await helpers.createPage(browser, { viewport: { width: 360, height: 740 } });

        // Navigate to settings with completed onboarding
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

        // -------------------------------------------------------------
        // Group 1: DOM Structure & Classes in index.html & css/styles.css
        // -------------------------------------------------------------
        console.log('\x1b[1m--- [Group 1] DOM Structure & CSS Grid Classes ---\x1b[0m');

        const gridClasses = await page.evaluate(() => {
            const grid = document.getElementById('settings-institution-grid');
            return grid ? grid.className : '';
        });

        assertTest(gridClasses.includes('grid-cols-2'), '#settings-institution-grid has mobile 2 columns (grid-cols-2)');
        assertTest(gridClasses.includes('sm:grid-cols-3'), '#settings-institution-grid has sm 3 columns (sm:grid-cols-3)');
        assertTest(gridClasses.includes('md:grid-cols-4'), '#settings-institution-grid has md 4 columns (md:grid-cols-4)');
        assertTest(gridClasses.includes('lg:grid-cols-5'), '#settings-institution-grid has lg 5 columns (lg:grid-cols-5)');
        assertTest(gridClasses.includes('gap-2'), '#settings-institution-grid uses compact gap-2');
        assertTest(gridClasses.includes('max-h-96'), '#settings-institution-grid has max-h-96 container');
        assertTest(gridClasses.includes('overflow-y-auto'), '#settings-institution-grid has overflow-y-auto');

        const logoFrameStyle = await page.evaluate(() => {
            const logo = document.querySelector('.inst-grid-card .school-logo-frame');
            if (!logo) return null;
            const cs = window.getComputedStyle(logo);
            return {
                width: cs.width,
                height: cs.height,
                borderRadius: cs.borderRadius,
                backgroundColor: cs.backgroundColor
            };
        });

        assertTest(logoFrameStyle !== null, '.school-logo-frame element rendered inside .inst-grid-card');
        assertEqual(logoFrameStyle?.width, '32px', 'Logo frame width is exactly 32px (2rem)');
        assertEqual(logoFrameStyle?.height, '32px', 'Logo frame height is exactly 32px (2rem)');
        assertEqual(logoFrameStyle?.borderRadius, '8px', 'Logo frame border-radius is 8px (rounded-lg)');
        assertEqual(logoFrameStyle?.backgroundColor, 'rgb(255, 255, 255)', 'Logo frame preserves solid white background');

        // -------------------------------------------------------------
        // Group 2: Viewport Dimensions & Card Compactness (360px Mobile)
        // -------------------------------------------------------------
        console.log('\n\x1b[1m--- [Group 2] Viewport Dimensions & Card Compactness (360px Mobile) ---\x1b[0m');

        const cardMetrics = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.inst-grid-card'));
            const card0 = cards[0];
            const logo = card0?.querySelector('.school-logo-frame');
            const createCard = document.getElementById('grid-create-school-card');

            return {
                cardCount: cards.length,
                cardHeight: card0?.offsetHeight,
                cardWidth: card0?.offsetWidth,
                createCardHeight: createCard?.offsetHeight,
                hasActualBadge: !!card0?.querySelector('.bg-indigo-600'),
                microRowText: card0?.children[0]?.innerText || '',
                nameFontSize: window.getComputedStyle(card0?.children[2] || card0).fontSize,
                subFontSize: window.getComputedStyle(card0?.children[3] || card0).fontSize
            };
        });

        assertTest(cardMetrics.cardCount >= 30, `Grid renders all institutions (found: ${cardMetrics.cardCount})`);
        assertTest(cardMetrics.cardHeight <= 88, `Rendered school card height <= 88px (actual: ${cardMetrics.cardHeight}px)`);
        assertTest(cardMetrics.cardHeight >= 76 && cardMetrics.cardHeight <= 84, `Card height within target ~78-82px (actual: ${cardMetrics.cardHeight}px)`);
        assertTest(cardMetrics.createCardHeight <= 88, `"+ Crear Escuela" card height <= 88px (actual: ${cardMetrics.createCardHeight}px)`);
        assertTest(Math.abs(cardMetrics.cardHeight - cardMetrics.createCardHeight) <= 3, 'Create card height matches institution cards uniformly');
        assertTest(cardMetrics.hasActualBadge, 'Active card includes high-contrast Actual badge');
        assertTest(cardMetrics.microRowText.includes('MX') || cardMetrics.microRowText.includes('ACTUAL'), 'Top micro-row includes country code tag');
        assertEqual(cardMetrics.nameFontSize, '11px', 'School name typography is 11px font-black');
        assertEqual(cardMetrics.subFontSize, '9px', 'School subtitle typography is 9px');

        // -------------------------------------------------------------
        // Group 3: Zero Horizontal Scroll Across Viewports (320px to 1280px)
        // -------------------------------------------------------------
        console.log('\n\x1b[1m--- [Group 3] Zero Horizontal Scroll Across Viewports ---\x1b[0m');

        const testViewports = [320, 360, 375, 390, 412, 768, 1024, 1280];
        for (const w of testViewports) {
            await page.setViewport({ width: w, height: 800 });
            await new Promise(r => setTimeout(r, 60));

            const overflowStatus = await page.evaluate(() => {
                const bodyW = document.body.scrollWidth;
                const clientW = document.body.clientWidth;
                const docW = document.documentElement.scrollWidth;
                const docClientW = document.documentElement.clientWidth;
                const grid = document.getElementById('settings-institution-grid');
                const gridScrollW = grid ? grid.scrollWidth : 0;
                const gridClientW = grid ? grid.clientWidth : 0;

                return {
                    bodyOverflow: bodyW > clientW,
                    docOverflow: docW > docClientW,
                    gridOverflow: gridScrollW > gridClientW
                };
            });

            assertTest(!overflowStatus.bodyOverflow, `Zero body horizontal overflow at ${w}px viewport`);
            assertTest(!overflowStatus.docOverflow, `Zero document horizontal overflow at ${w}px viewport`);
            assertTest(!overflowStatus.gridOverflow, `Zero grid horizontal overflow at ${w}px viewport`);
        }

        // Reset to standard mobile viewport 360px
        await page.setViewport({ width: 360, height: 740 });
        await new Promise(r => setTimeout(r, 100));

        // -------------------------------------------------------------
        // Group 4: Card Selection & State Synchronization
        // -------------------------------------------------------------
        console.log('\n\x1b[1m--- [Group 4] Interactive Card Selection & State Sync ---\x1b[0m');

        // Verify initial selection
        const initialInst = await page.evaluate(() => window.StorageModule.getInstitution());
        assertEqual(initialInst, 'unam', 'Initial configured school is unam');

        // Select IPN
        await page.evaluate(() => {
            const ipnCard = document.querySelector('button[data-inst-id="ipn"]');
            if (ipnCard) ipnCard.click();
        });
        await new Promise(r => setTimeout(r, 200));

        const updatedInst = await page.evaluate(() => window.StorageModule.getInstitution());
        assertEqual(updatedInst, 'ipn', 'Clicking IPN card updates Storage.getInstitution() to ipn');

        const ipnCardState = await page.evaluate(() => {
            const card = document.querySelector('button[data-inst-id="ipn"]');
            const unamCard = document.querySelector('button[data-inst-id="unam"]');
            return {
                ipnRing: card?.className.includes('ring-2 ring-indigo-500'),
                ipnBg: card?.className.includes('bg-indigo-50/80'),
                ipnHasBadge: !!card?.querySelector('.bg-indigo-600'),
                ipnNoScale: !card?.className.includes('scale-[1.02]'),
                unamNoRing: !unamCard?.className.includes('ring-2 ring-indigo-500'),
                unamNoBadge: !unamCard?.querySelector('.bg-indigo-600')
            };
        });

        assertTest(ipnCardState.ipnRing, 'Selected card receives ring-2 ring-indigo-500');
        assertTest(ipnCardState.ipnBg, 'Selected card receives active indigo background');
        assertTest(ipnCardState.ipnHasBadge, 'Selected card displays "Actual" badge');
        assertTest(ipnCardState.ipnNoScale, 'Selected card eliminates scale-[1.02] to prevent scrollbar jitter');
        assertTest(ipnCardState.unamNoRing, 'Previously active card loses active ring');
        assertTest(ipnCardState.unamNoBadge, 'Previously active card loses Actual badge');

        // Select UAM
        await page.evaluate(() => {
            const uamCard = document.querySelector('button[data-inst-id="uam"]');
            if (uamCard) uamCard.click();
        });
        await new Promise(r => setTimeout(r, 200));

        const uamInst = await page.evaluate(() => window.StorageModule.getInstitution());
        assertEqual(uamInst, 'uam', 'Clicking UAM card updates Storage.getInstitution() to uam');

        // Restore UNAM
        await page.evaluate(() => {
            const unamCard = document.querySelector('button[data-inst-id="unam"]');
            if (unamCard) unamCard.click();
        });
        await new Promise(r => setTimeout(r, 200));

        // -------------------------------------------------------------
        // Group 5: Country Pills Filtering
        // -------------------------------------------------------------
        console.log('\n\x1b[1m--- [Group 5] Country Pills Filtering ---\x1b[0m');

        const coCount = await page.evaluate(() => {
            const coPill = document.querySelector('button[data-country-filter="CO"]');
            if (coPill) coPill.click();
            return document.querySelectorAll('#settings-institution-grid .inst-grid-card').length;
        });
        assertEqual(coCount, 4, 'Filtering by Colombia (CO) displays exactly 4 university cards');

        const esCount = await page.evaluate(() => {
            const esPill = document.querySelector('button[data-country-filter="ES"]');
            if (esPill) esPill.click();
            return document.querySelectorAll('#settings-institution-grid .inst-grid-card').length;
        });
        assertEqual(esCount, 4, 'Filtering by Spain (ES) displays exactly 4 university cards');

        const allCount = await page.evaluate(() => {
            const allPill = document.querySelector('button[data-country-filter="all"]');
            if (allPill) allPill.click();
            return document.querySelectorAll('#settings-institution-grid .inst-grid-card').length;
        });
        assertTest(allCount >= 30, `Filtering by 'all' restores full catalog (count: ${allCount})`);

        // Verify no flag emojis in pill buttons (respecting user instruction)
        const flagsInPills = await page.evaluate(() => {
            const pills = Array.from(document.querySelectorAll('#settings-country-pills button'));
            const flagRegex = /[\uD83C][\uDDE6-\uDDFF]{2}/;
            return pills.some(p => flagRegex.test(p.innerText));
        });
        assertTest(!flagsInPills, 'Country filter pills do not contain flag emojis (text only)');

        // -------------------------------------------------------------
        // Group 6: Custom Schools & Compact Actions
        // -------------------------------------------------------------
        console.log('\n\x1b[1m--- [Group 6] Custom Schools, Badges & Compact Actions ---\x1b[0m');

        const customResult = await page.evaluate(() => {
            const mockCustomSchool = {
                id: 'custom_m2_test_escuela',
                name: 'Instituto Galileo',
                fullName: 'Instituto Científico Galileo Galilei',
                country: 'México',
                countryCode: 'MX',
                slogan: 'Eppur si muove',
                type: 'Semestral',
                periods: ['1.° Semestre', '2.° Semestre', '3.° Semestre'],
                isCustom: true
            };
            window.StorageModule.saveCustomSchool(mockCustomSchool);
            window.app.renderSettingsSchools();

            const customCard = document.querySelector('button[data-inst-id="custom_m2_test_escuela"]');
            const editBtn = document.querySelector('button[data-edit-custom-id="custom_m2_test_escuela"]');
            const createCard = document.getElementById('grid-create-school-card');

            return {
                cardRendered: !!customCard,
                cardHeight: customCard?.offsetHeight,
                cardText: customCard?.innerText || '',
                editBtnRendered: !!editBtn,
                editBtnClasses: editBtn?.className || '',
                createCardMinHeight: createCard?.offsetHeight,
                hasAlias: typeof window.app.renderSettingsSchools === 'function'
            };
        });

        assertTest(customResult.cardRendered, 'Custom school card renders successfully in grid');
        assertEqual(customResult.cardHeight, 81, 'Custom school card height is compact (81px)');
        assertTest(customResult.cardText.includes('Propia'), 'Custom school card displays "⭐ Propia" badge in micro-row');
        assertTest(customResult.editBtnRendered, 'Compact edit button rendered for custom school');
        assertTest(customResult.editBtnClasses.includes('p-1 rounded-md'), 'Edit button uses compact p-1 rounded-md sizing');
        assertTest(customResult.hasAlias, 'window.app.renderSettingsSchools() alias is exposed');

        // Test custom school deletion cleanup
        await page.evaluate(() => {
            window.StorageModule.deleteCustomSchool('custom_m2_test_escuela');
            window.app.renderSettingsSchools();
        });

        const deletedCheck = await page.evaluate(() => {
            return !document.querySelector('button[data-inst-id="custom_m2_test_escuela"]');
        });
        assertTest(deletedCheck, 'Custom test school cleanly removed and grid updated');

    } catch (err) {
        logFail('Unexpected test suite error', err);
    } finally {
        await browser.close();
    }

    console.log('\n\x1b[1m\x1b[36m========================================================================\x1b[0m');
    console.log(`\x1b[1mSettings Cards Milestone 2 Test Summary:\x1b[0m`);
    console.log(`  Passed:   \x1b[32m\x1b[1m${passedTests}\x1b[0m`);
    console.log(`  Failed:   \x1b[${failedTests > 0 ? '31m\x1b[1m' : '2m'}${failedTests}\x1b[0m`);
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m');

    if (failedTests > 0) {
        console.error('\x1b[31m\x1b[1mRESULT: FAILURE (Some tests failed!)\x1b[0m\n');
        process.exit(1);
    } else {
        console.log('\x1b[32m\x1b[1mRESULT: SUCCESS (All Milestone 2 settings card tests passed!)\x1b[0m\n');
        process.exit(0);
    }
})();
