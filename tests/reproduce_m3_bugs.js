/**
 * reproduce_m3_bugs.js
 * Empirical reproduction script targeting specific behavioral flaws identified in Milestone 3:
 * 1. Drawer period desync on onboarding completion
 * 2. Sticky "Sin periodo" when transitioning to a real school in Settings
 * 3. #header-institution-select value invalidation when skipping school
 */

const assert = require('assert');
const helpers = require('./test_helpers');

(async () => {
    console.log('\x1b[1m\x1b[33m--- RUNNING TARGETED BUG REPRODUCTION HARNESS ---\x1b[0m\n');

    const browser = await helpers.launchBrowser();

    try {
        const page = await helpers.createPage(browser, { viewport: { width: 400, height: 800 } });

        // BUG 1: Drawer Period Desynchronization
        console.log('Testing Bug 1: Drawer Period Desync after onboarding submission...');
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('org_escolar_initialized_v3', 'true');
            window.app.openCycleWelcomeModal();
        });
        await new Promise(r => setTimeout(r, 300));

        // Select UAM (trimestral)
        await page.evaluate(() => {
            const uamCard = document.querySelector('.welcome-school-card[data-inst-id="uam"]');
            if (uamCard) uamCard.click();
        });
        await new Promise(r => setTimeout(r, 200));

        // Select "2.º Trimestre"
        await page.evaluate(() => {
            const chips = Array.from(document.querySelectorAll('.welcome-period-chip'));
            const chip2 = chips.find(c => c.textContent.includes('2.º Trimestre'));
            if (chip2) chip2.click();
        });
        await new Promise(r => setTimeout(r, 100));

        // Submit form with dates
        await page.evaluate(() => {
            document.getElementById('welcome-cycle-start').value = '2026-08-01';
            document.getElementById('welcome-cycle-end').value = '2026-11-30';
            document.getElementById('welcome-cycle-save-btn').click();
        });
        await new Promise(r => setTimeout(r, 400));

        const bug1Result = await page.evaluate(() => {
            const headerPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const drawerPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const storagePeriod = window.StorageModule.getAcademicPeriod();
            return { headerPeriod, drawerPeriod, storagePeriod };
        });

        console.log('Bug 1 Observed State:', bug1Result);
        if (bug1Result.headerPeriod !== bug1Result.drawerPeriod) {
            console.log('\x1b[31m[CONFIRMED BUG 1]\x1b[0m Drawer period desync: header = "' + bug1Result.headerPeriod + '", drawer = "' + bug1Result.drawerPeriod + '"');
            assert.strictEqual(bug1Result.drawerPeriod, bug1Result.headerPeriod, 'Bug 1: Drawer period must match header period');
        } else {
            console.log('\x1b[32m[NO BUG 1]\x1b[0m Header and drawer period match');
        }

        // BUG 2: Sticky "Sin periodo" when selecting school in Settings
        console.log('\nTesting Bug 2: Sticky "Sin periodo" on Settings transition...');
        await page.evaluate(() => {
            window.StorageModule.setSchoolSkipped(true);
            window.StorageModule.setInstitution('unconfigured');
            window.StorageModule.setAcademicPeriod('Sin periodo');
            window.app.setInstitution('unconfigured');
            window.app.switchView('settings');
        });
        await new Promise(r => setTimeout(r, 300));

        // Click IPN card in settings
        await page.evaluate(() => {
            const ipnCard = document.querySelector('#settings-institution-grid button[data-inst-id="ipn"]');
            if (ipnCard) ipnCard.click();
        });
        await new Promise(r => setTimeout(r, 300));

        const bug2Result = await page.evaluate(() => {
            const instId = window.StorageModule.getInstitution();
            const period = window.StorageModule.getAcademicPeriod();
            const headerPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const drawerPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            return { instId, period, headerPeriod, drawerPeriod };
        });

        console.log('Bug 2 Observed State:', bug2Result);
        if (bug2Result.period === 'Sin periodo' || bug2Result.headerPeriod === 'Sin periodo') {
            console.log('\x1b[31m[CONFIRMED BUG 2]\x1b[0m After selecting IPN, period is stuck at "' + bug2Result.period + '" (header: "' + bug2Result.headerPeriod + '")');
            assert.notStrictEqual(bug2Result.period, 'Sin periodo', 'Bug 2: Period must not be stuck at Sin periodo');
        } else {
            console.log('\x1b[32m[NO BUG 2]\x1b[0m Period updated to: ' + bug2Result.period);
        }

        // BUG 3: Header institution select value invalidation
        console.log('\nTesting Bug 3: Header institution selector value on dynamic skip...');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.reload({ waitUntil: 'load' });
        await new Promise(r => setTimeout(r, 500));

        await page.click('#welcome-skip-school-btn');
        await new Promise(r => setTimeout(r, 100));
        await page.click('#welcome-cycle-later-btn');
        await new Promise(r => setTimeout(r, 400));

        const bug3Result = await page.evaluate(() => {
            const select = document.getElementById('header-institution-select');
            return {
                value: select ? select.value : null,
                hasUnconfiguredOption: select ? Boolean(select.querySelector('option[value="unconfigured"]')) : false
            };
        });

        console.log('Bug 3 Observed State:', bug3Result);
        if (bug3Result.value !== 'unconfigured') {
            console.log('\x1b[31m[CONFIRMED BUG 3]\x1b[0m header-institution-select.value is "' + bug3Result.value + '" (hasUnconfiguredOption: ' + bug3Result.hasUnconfiguredOption + ')');
            assert.strictEqual(bug3Result.value, 'unconfigured', 'Bug 3: header-institution-select must have value unconfigured');
        } else {
            console.log('\x1b[32m[NO BUG 3]\x1b[0m header-institution-select synced to unconfigured');
        }

    } catch (err) {
        console.error('Error during bug reproduction:', err);
    } finally {
        await browser.close();
    }
})();
