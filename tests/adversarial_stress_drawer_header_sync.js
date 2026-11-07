/**
 * tests/adversarial_stress_drawer_header_sync.js
 * Adversarial Stress Verification for Milestone 3 (v1.3.4):
 * Transitioning between unconfigured and configured schools in Settings,
 * ensuring drawer and header remain synchronized under extreme stress, rapid switching,
 * custom schools, free-form periods, and mobile drawer lifecycle.
 */

const assert = require('assert');
const helpers = require('./test_helpers');

(async () => {
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[36m  ADVERSARIAL STRESS TEST: DRAWER & HEADER SYNCHRONIZATION (v1.3.4)     \x1b[0m');
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m\n');

    const browser = await helpers.launchBrowser();
    let totalAssertions = 0;
    let passedAssertions = 0;
    const errors = [];

    function check(condition, desc) {
        totalAssertions++;
        if (condition) {
            passedAssertions++;
            console.log(`  \x1b[32m[PASS]\x1b[0m ${desc}`);
        } else {
            console.error(`  \x1b[31m[FAIL]\x1b[0m ${desc}`);
            errors.push(desc);
        }
    }

    try {
        const page = await helpers.createPage(browser, { viewport: { width: 412, height: 915 } });

        const pageErrors = [];
        page.on('pageerror', err => {
            pageErrors.push(err.toString());
            console.error(`  \x1b[31m[PAGE ERROR]\x1b[0m ${err.toString()}`);
        });

        const consoleErrors = [];
        const resourceErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (text.includes('net::ERR_') || text.includes('Failed to load resource')) {
                    resourceErrors.push(text);
                } else {
                    consoleErrors.push(text);
                    console.error(`  \x1b[31m[CONSOLE ERROR]\x1b[0m ${text}`);
                }
            }
        });

        // ---------------------------------------------------------------------
        // TEST GROUP 1: Initial Unconfigured State Header & Drawer Parity
        // ---------------------------------------------------------------------
        console.log('\x1b[1m\x1b[35m--- [Group 1] Initial Unconfigured State (Skipped School) ---\x1b[0m');
        
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.reload({ waitUntil: 'load' });
        await new Promise(r => setTimeout(r, 400));

        // Skip school in welcome modal
        await page.click('#welcome-skip-school-btn');
        await new Promise(r => setTimeout(r, 100));
        await page.click('#welcome-cycle-later-btn');
        await new Promise(r => setTimeout(r, 400));

        let syncState = await page.evaluate(() => {
            const hName = document.getElementById('header-inst-name')?.textContent?.trim();
            const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const hLogo = document.getElementById('header-inst-logo')?.innerHTML || '';
            const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const dLogo = document.getElementById('drawer-inst-logo')?.innerHTML || '';
            const dSlogan = document.getElementById('drawer-inst-slogan')?.textContent?.trim();
            const storageInst = window.StorageModule.getInstitution();
            const storagePeriod = window.StorageModule.getAcademicPeriod();
            const isSkipped = window.StorageModule.isSchoolSkipped();

            return { hName, hPeriod, hLogo, dName, dPeriod, dLogo, dSlogan, storageInst, storagePeriod, isSkipped };
        });

        check(syncState.isSkipped === true, 'StorageModule.isSchoolSkipped() is true');
        check(syncState.storageInst === 'unconfigured', 'StorageModule institution is "unconfigured"');
        check(syncState.storagePeriod === 'Sin periodo', 'StorageModule period is "Sin periodo"');
        check(syncState.hName === 'Sin institución', 'Header institution name is "Sin institución"');
        check(syncState.dName === 'Sin institución', 'Drawer institution name is "Sin institución"');
        check(syncState.hName === syncState.dName, 'Header and Drawer institution names strictly match in unconfigured state');
        check(syncState.hPeriod === 'Sin periodo', 'Header period is "Sin periodo"');
        check(syncState.dPeriod === 'Sin periodo', 'Drawer period is "Sin periodo"');
        check(syncState.hPeriod === syncState.dPeriod, 'Header and Drawer periods strictly match in unconfigured state');
        check(syncState.hLogo.includes('🎓'), 'Header logo contains graduation cap 🎓');
        check(syncState.dLogo.includes('🎓'), 'Drawer logo contains graduation cap 🎓');
        check(syncState.dSlogan.includes('Organiza tus metas escolares'), 'Drawer slogan is default unconfigured motto');

        // ---------------------------------------------------------------------
        // TEST GROUP 2: Settings Transitions Across Catalogs
        // ---------------------------------------------------------------------
        console.log('\n\x1b[1m\x1b[35m--- [Group 2] Transitions in Settings: UNAM -> IPN -> UAM -> ITESM ---\x1b[0m');

        await page.evaluate(() => {
            window.app.switchView('settings');
        });
        await new Promise(r => setTimeout(r, 300));

        // 2a. Transition to UNAM
        await page.evaluate(() => {
            const btn = document.querySelector('#settings-institution-grid button[data-inst-id="unam"]');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 200));

        let unamState = await page.evaluate(() => {
            const hName = document.getElementById('header-inst-name')?.textContent?.trim();
            const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const storagePeriod = window.StorageModule.getAcademicPeriod();
            const isSkipped = window.StorageModule.isSchoolSkipped();
            const dSlogan = document.getElementById('drawer-inst-slogan')?.textContent?.trim();

            return { hName, dName, hPeriod, dPeriod, storagePeriod, isSkipped, dSlogan };
        });

        check(unamState.isSkipped === false, 'Selecting UNAM clears isSchoolSkipped');
        check(unamState.hName === 'UNAM', 'Header name updated to UNAM');
        check(unamState.dName === 'UNAM', 'Drawer name updated to UNAM');
        check(unamState.hName === unamState.dName, 'Header and drawer names in sync for UNAM');
        check(unamState.hPeriod !== 'Sin periodo', 'Header period not stuck at "Sin periodo"');
        check(unamState.dPeriod !== 'Sin periodo', 'Drawer period not stuck at "Sin periodo"');
        check(unamState.hPeriod === unamState.dPeriod, 'Header and drawer periods match for UNAM');
        check(unamState.dSlogan.includes('Por mi raza hablará el espíritu'), 'Drawer motto updated to UNAM slogan');

        // 2b. Transition to IPN
        await page.evaluate(() => {
            const btn = document.querySelector('#settings-institution-grid button[data-inst-id="ipn"]');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 200));

        let ipnState = await page.evaluate(() => {
            const hName = document.getElementById('header-inst-name')?.textContent?.trim();
            const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const storagePeriod = window.StorageModule.getAcademicPeriod();
            const dSlogan = document.getElementById('drawer-inst-slogan')?.textContent?.trim();
            return { hName, dName, hPeriod, dPeriod, storagePeriod, dSlogan };
        });

        check(ipnState.hName.includes('IPN'), 'Header name updated to IPN');
        check(ipnState.dName.includes('IPN'), 'Drawer name updated to IPN');
        check(ipnState.hName === ipnState.dName, 'Header and drawer names in sync for IPN');
        check(ipnState.hPeriod === ipnState.dPeriod, 'Header and drawer periods in sync for IPN');
        check(ipnState.dSlogan.includes('La técnica al servicio de la patria'), 'Drawer motto updated to IPN slogan');

        // 2c. Transition to UAM (Trimestral)
        await page.evaluate(() => {
            const btn = document.querySelector('#settings-institution-grid button[data-inst-id="uam"]');
            if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 200));

        let uamState = await page.evaluate(() => {
            const hName = document.getElementById('header-inst-name')?.textContent?.trim();
            const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const dSlogan = document.getElementById('drawer-inst-slogan')?.textContent?.trim();
            return { hName, dName, hPeriod, dPeriod, dSlogan };
        });

        check(uamState.hName === 'UAM', 'Header name updated to UAM');
        check(uamState.dName === 'UAM', 'Drawer name updated to UAM');
        check(uamState.hName === uamState.dName, 'Header and drawer names in sync for UAM');
        check(uamState.hPeriod.includes('Trimestre'), 'Header period reflects trimestral system');
        check(uamState.dPeriod.includes('Trimestre'), 'Drawer period reflects trimestral system');
        check(uamState.hPeriod === uamState.dPeriod, 'Header and drawer periods in sync for UAM');
        check(uamState.dSlogan.includes('Casa abierta al tiempo'), 'Drawer motto updated to UAM slogan');

        // ---------------------------------------------------------------------
        // TEST GROUP 3: Period Switching Synchronization in Settings
        // ---------------------------------------------------------------------
        console.log('\n\x1b[1m\x1b[35m--- [Group 3] Period Pill & Custom Free-form Period Sync ---\x1b[0m');

        // Click 3.º Trimestre pill in settings
        await page.evaluate(() => {
            const pills = Array.from(document.querySelectorAll('#settings-period-pills button'));
            const p3 = pills.find(p => p.textContent.includes('3.º Trimestre'));
            if (p3) p3.click();
        });
        await new Promise(r => setTimeout(r, 150));

        let p3State = await page.evaluate(() => {
            const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const stored = window.StorageModule.getAcademicPeriod();
            return { hPeriod, dPeriod, stored };
        });

        check(p3State.stored === '3.º Trimestre', 'StorageModule period updated to 3.º Trimestre');
        check(p3State.hPeriod === '3.º Trimestre', 'Header period updated to 3.º Trimestre');
        check(p3State.dPeriod === '3.º Trimestre', 'Drawer period updated to 3.º Trimestre');
        check(p3State.hPeriod === p3State.dPeriod, 'Header and Drawer in perfect sync on pill click');

        // Custom free-form period via input
        await page.evaluate(() => {
            const input = document.getElementById('custom-period-input');
            const saveBtn = document.getElementById('save-custom-period-btn');
            if (input && saveBtn) {
                input.value = 'Modulo Intersemestral Avanzado 2026';
                saveBtn.click();
            }
        });
        await new Promise(r => setTimeout(r, 150));

        let customPState = await page.evaluate(() => {
            const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const stored = window.StorageModule.getAcademicPeriod();
            return { hPeriod, dPeriod, stored };
        });

        check(customPState.stored === 'Modulo Intersemestral Avanzado 2026', 'Storage stored custom free-form period');
        check(customPState.hPeriod === 'Modulo Intersemestral Avanzado 2026', 'Header period matches free-form period');
        check(customPState.dPeriod === 'Modulo Intersemestral Avanzado 2026', 'Drawer period matches free-form period');
        check(customPState.hPeriod === customPState.dPeriod, 'Header and Drawer in sync on custom period save');

        // ---------------------------------------------------------------------
        // TEST GROUP 4: Transitioning Back to Unconfigured from Settings
        // ---------------------------------------------------------------------
        console.log('\n\x1b[1m\x1b[35m--- [Group 4] Transitioning Back to Unconfigured ---\x1b[0m');

        await page.evaluate(() => {
            window.StorageModule.setSchoolSkipped(true);
            window.StorageModule.setInstitution('unconfigured');
            window.StorageModule.setAcademicPeriod('Sin periodo');
            window.app.setInstitution('unconfigured');
        });
        await new Promise(r => setTimeout(r, 200));

        let resetUnconfig = await page.evaluate(() => {
            const hName = document.getElementById('header-inst-name')?.textContent?.trim();
            const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const dSlogan = document.getElementById('drawer-inst-slogan')?.textContent?.trim();
            const hLogo = document.getElementById('header-inst-logo')?.innerHTML || '';
            const dLogo = document.getElementById('drawer-inst-logo')?.innerHTML || '';
            const isSkipped = window.StorageModule.isSchoolSkipped();
            return { hName, dName, hPeriod, dPeriod, dSlogan, hLogo, dLogo, isSkipped };
        });

        check(resetUnconfig.isSkipped === true, 'isSchoolSkipped is true after transitioning to unconfigured');
        check(resetUnconfig.hName === 'Sin institución', 'Header name reset to "Sin institución"');
        check(resetUnconfig.dName === 'Sin institución', 'Drawer name reset to "Sin institución"');
        check(resetUnconfig.hName === resetUnconfig.dName, 'Header and Drawer names sync on unconfigured transition');
        check(resetUnconfig.hPeriod === 'Sin periodo', 'Header period reset to "Sin periodo"');
        check(resetUnconfig.dPeriod === 'Sin periodo', 'Drawer period reset to "Sin periodo"');
        check(resetUnconfig.hPeriod === resetUnconfig.dPeriod, 'Header and Drawer periods sync on unconfigured transition');
        check(resetUnconfig.hLogo.includes('🎓'), 'Header logo returned to graduation cap 🎓');
        check(resetUnconfig.dLogo.includes('🎓'), 'Drawer logo returned to graduation cap 🎓');
        check(resetUnconfig.dSlogan.includes('Organiza tus metas escolares'), 'Drawer slogan returned to default');

        // ---------------------------------------------------------------------
        // TEST GROUP 5: Custom School Creation & Header/Drawer Sync
        // ---------------------------------------------------------------------
        console.log('\n\x1b[1m\x1b[35m--- [Group 5] Custom School Creation & Parity ---\x1b[0m');

        await page.evaluate(() => {
            const customSchool = {
                id: 'custom_quantum_inst_2026',
                name: 'Instituto Cuántico de México',
                shortName: 'ICM',
                fullName: 'Instituto Cuántico de México S.C.',
                shortBadge: 'ICM',
                country: 'México',
                countryCode: 'MX',
                countryFlag: '🇲🇽',
                systemType: 'Cuatrimestral',
                slogan: 'Entrelazando el Conocimiento',
                icon: null,
                colors: {
                    primary: '#059669',
                    secondary: '#10B981',
                    accent: '#34D399',
                    text: '#FFFFFF',
                    aura: '#059669',
                    badgeBg: 'bg-emerald-100 dark:bg-emerald-900',
                    badgeText: 'text-emerald-800 dark:text-emerald-200'
                },
                periods: ['1.º Cuatrimestre', '2.º Cuatrimestre', '3.º Cuatrimestre', '4.º Cuatrimestre'],
                defaultPeriod: '1.º Cuatrimestre',
                isCustom: true
            };

            window.StorageModule.saveCustomSchool(customSchool);
            window.StorageModule.setSchoolSkipped(false);
            window.app.setInstitution('custom_quantum_inst_2026');
            window.app.setAcademicPeriod('2.º Cuatrimestre');
        });
        await new Promise(r => setTimeout(r, 200));

        let customState = await page.evaluate(() => {
            const hName = document.getElementById('header-inst-name')?.textContent?.trim();
            const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const dSlogan = document.getElementById('drawer-inst-slogan')?.textContent?.trim();
            const primaryVar = getComputedStyle(document.documentElement).getPropertyValue('--inst-primary').trim();
            const isSkipped = window.StorageModule.isSchoolSkipped();
            return { hName, dName, hPeriod, dPeriod, dSlogan, primaryVar, isSkipped };
        });

        check(customState.isSkipped === false, 'isSchoolSkipped is false for custom school');
        check(customState.hName === 'Instituto Cuántico de México', 'Header displays custom school name');
        check(customState.dName === 'Instituto Cuántico de México', 'Drawer displays custom school name');
        check(customState.hName === customState.dName, 'Header and drawer names sync for custom school');
        check(customState.hPeriod === '2.º Cuatrimestre', 'Header displays custom period 2.º Cuatrimestre');
        check(customState.dPeriod === '2.º Cuatrimestre', 'Drawer displays custom period 2.º Cuatrimestre');
        check(customState.hPeriod === customState.dPeriod, 'Header and drawer periods sync for custom school');
        check(customState.dSlogan.includes('Entrelazando el Conocimiento'), 'Drawer slogan matches custom school slogan');
        check(customState.primaryVar === '#059669', 'Document root --inst-primary matches custom school emerald color');

        // ---------------------------------------------------------------------
        // TEST GROUP 6: Adversarial Rapid Switching Loop (Stress Condition)
        // ---------------------------------------------------------------------
        console.log('\n\x1b[1m\x1b[35m--- [Group 6] 20 Rapid Back-and-Forth Transitions (Stress Test) ---\x1b[0m');

        const testSchools = [
            { id: 'unconfigured', isUnconfig: true },
            { id: 'unam', isUnconfig: false },
            { id: 'unconfigured', isUnconfig: true },
            { id: 'ipn', isUnconfig: false },
            { id: 'unconfigured', isUnconfig: true },
            { id: 'uam', isUnconfig: false },
            { id: 'unconfigured', isUnconfig: true },
            { id: 'custom_quantum_inst_2026', isUnconfig: false },
            { id: 'unconfigured', isUnconfig: true },
            { id: 'itesm', isUnconfig: false },
            { id: 'unconfigured', isUnconfig: true },
            { id: 'cch', isUnconfig: false },
            { id: 'unconfigured', isUnconfig: true },
            { id: 'enp', isUnconfig: false },
            { id: 'unconfigured', isUnconfig: true },
            { id: 'cecyt', isUnconfig: false },
            { id: 'unconfigured', isUnconfig: true },
            { id: 'colbach', isUnconfig: false },
            { id: 'unconfigured', isUnconfig: true },
            { id: 'unam', isUnconfig: false }
        ];

        let jitterPassed = true;
        for (let i = 0; i < testSchools.length; i++) {
            const target = testSchools[i];
            await page.evaluate((tgt) => {
                if (tgt.isUnconfig) {
                    window.StorageModule.setSchoolSkipped(true);
                    window.StorageModule.setInstitution('unconfigured');
                    window.StorageModule.setAcademicPeriod('Sin periodo');
                    window.app.setInstitution('unconfigured');
                } else {
                    window.StorageModule.setSchoolSkipped(false);
                    window.app.setInstitution(tgt.id);
                }
            }, target);

            // Immediate DOM snapshot with zero artificial delay to catch race conditions
            const snapshot = await page.evaluate(() => {
                const hName = document.getElementById('header-inst-name')?.textContent?.trim();
                const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
                const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
                const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
                const hLogo = document.getElementById('header-inst-logo')?.innerHTML;
                const dLogo = document.getElementById('drawer-inst-logo')?.innerHTML;
                return { hName, dName, hPeriod, dPeriod, hasHLogo: Boolean(hLogo), hasDLogo: Boolean(dLogo) };
            });

            if (snapshot.hName !== snapshot.dName ||
                snapshot.hPeriod !== snapshot.dPeriod ||
                !snapshot.hasHLogo || !snapshot.hasDLogo ||
                !snapshot.hName || !snapshot.hPeriod) {
                jitterPassed = false;
                console.error(`  \x1b[31m[JITTER FAIL on step ${i+1} (${target.id})]:\x1b[0m`, snapshot);
            }
        }

        check(jitterPassed, 'All 20 rapid transitions preserved header & drawer synchronization with 0 race conditions');

        // ---------------------------------------------------------------------
        // TEST GROUP 7: Live Drawer Manipulation During Mobile Viewport
        // ---------------------------------------------------------------------
        console.log('\n\x1b[1m\x1b[35m--- [Group 7] Mobile Drawer Lifecycle & Live Mutation ---\x1b[0m');

        // Open mobile drawer
        await page.click('#drawer-toggle-btn');
        await new Promise(r => setTimeout(r, 350));

        let drawerOpenState = await page.evaluate(() => {
            const drawer = document.getElementById('sidebar-drawer');
            const isOpen = drawer && !drawer.classList.contains('-translate-x-full');
            const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const hName = document.getElementById('header-inst-name')?.textContent?.trim();
            const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            return { isOpen, dName, hName, dPeriod, hPeriod };
        });

        check(drawerOpenState.isOpen, 'Mobile drawer opened and is visible');
        check(drawerOpenState.dName === drawerOpenState.hName, 'Drawer name matches header name while drawer is open');
        check(drawerOpenState.dPeriod === drawerOpenState.hPeriod, 'Drawer period matches header period while drawer is open');

        // Live mutation while drawer is wide open: switch to unconfigured
        await page.evaluate(() => {
            window.StorageModule.setSchoolSkipped(true);
            window.StorageModule.setInstitution('unconfigured');
            window.StorageModule.setAcademicPeriod('Sin periodo');
            window.app.setInstitution('unconfigured');
        });
        await new Promise(r => setTimeout(r, 100));

        let liveDrawerUnconfig = await page.evaluate(() => {
            const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const hName = document.getElementById('header-inst-name')?.textContent?.trim();
            const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const dSlogan = document.getElementById('drawer-inst-slogan')?.textContent?.trim();
            return { dName, hName, dPeriod, hPeriod, dSlogan };
        });

        check(liveDrawerUnconfig.dName === 'Sin institución', 'Drawer dynamically updated to "Sin institución" live while open');
        check(liveDrawerUnconfig.hName === 'Sin institución', 'Header dynamically updated to "Sin institución" live while open');
        check(liveDrawerUnconfig.dPeriod === 'Sin periodo', 'Drawer dynamically updated to "Sin periodo" live while open');
        check(liveDrawerUnconfig.hPeriod === 'Sin periodo', 'Header dynamically updated to "Sin periodo" live while open');
        check(liveDrawerUnconfig.dSlogan.includes('Organiza tus metas escolares'), 'Drawer slogan dynamically updated to default live while open');

        // Close drawer
        await page.click('#drawer-close-btn');
        await new Promise(r => setTimeout(r, 350));

        // ---------------------------------------------------------------------
        // TEST GROUP 8: Hard Page Reload Parity Verification
        // ---------------------------------------------------------------------
        console.log('\n\x1b[1m\x1b[35m--- [Group 8] Hard Page Reload Parity ---\x1b[0m');

        // 8a. Reload in unconfigured state
        await page.reload({ waitUntil: 'load' });
        await new Promise(r => setTimeout(r, 400));

        let reloadUnconfig = await page.evaluate(() => {
            const hName = document.getElementById('header-inst-name')?.textContent?.trim();
            const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            return { hName, dName, hPeriod, dPeriod };
        });

        check(reloadUnconfig.hName === 'Sin institución', 'Post-reload header retains "Sin institución"');
        check(reloadUnconfig.dName === 'Sin institución', 'Post-reload drawer retains "Sin institución"');
        check(reloadUnconfig.hPeriod === 'Sin periodo', 'Post-reload header retains "Sin periodo"');
        check(reloadUnconfig.dPeriod === 'Sin periodo', 'Post-reload drawer retains "Sin periodo"');
        check(reloadUnconfig.hName === reloadUnconfig.dName, 'Post-reload header and drawer name parity');
        check(reloadUnconfig.hPeriod === reloadUnconfig.dPeriod, 'Post-reload header and drawer period parity');

        // 8b. Set to IPN with custom period, reload, and verify persistence
        await page.evaluate(() => {
            window.StorageModule.setSchoolSkipped(false);
            window.app.setInstitution('ipn');
            window.app.setAcademicPeriod('4.º Semestre');
        });
        await new Promise(r => setTimeout(r, 200));

        await page.reload({ waitUntil: 'load' });
        await new Promise(r => setTimeout(r, 400));

        let reloadConfig = await page.evaluate(() => {
            const hName = document.getElementById('header-inst-name')?.textContent?.trim();
            const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
            const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
            const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
            const dSlogan = document.getElementById('drawer-inst-slogan')?.textContent?.trim();
            return { hName, dName, hPeriod, dPeriod, dSlogan };
        });

        check(reloadConfig.hName.includes('IPN'), 'Post-reload header displays IPN');
        check(reloadConfig.dName.includes('IPN'), 'Post-reload drawer displays IPN');
        check(reloadConfig.hPeriod === '4.º Semestre', 'Post-reload header displays 4.º Semestre');
        check(reloadConfig.dPeriod === '4.º Semestre', 'Post-reload drawer displays 4.º Semestre');
        check(reloadConfig.dSlogan.includes('La técnica al servicio de la patria'), 'Post-reload drawer retains IPN motto');

        // Zero console/page errors
        check(pageErrors.length === 0, `Zero page errors during stress testing (${pageErrors.length} encountered)`);
        check(consoleErrors.length === 0, `Zero console errors during stress testing (${consoleErrors.length} encountered)`);

    } catch (fatal) {
        console.error('Fatal harness error in stress test:', fatal);
        errors.push(fatal.message);
    } finally {
        await browser.close();
    }

    console.log('\n\x1b[1m\x1b[36m========================================================================\x1b[0m');
    console.log(`\x1b[1mSTRESS TEST RESULTS:\x1b[0m Total: ${totalAssertions} | Passed: \x1b[32m${passedAssertions}\x1b[0m | Failed: \x1b[31m${errors.length}\x1b[0m`);
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m');

    if (errors.length > 0 || passedAssertions !== totalAssertions) {
        console.error('\x1b[31m\x1b[1mVERDICT: REQUEST_CHANGES (Stress tests detected desynchronization or errors)\x1b[0m');
        process.exit(1);
    } else {
        console.log('\x1b[32m\x1b[1mVERDICT: APPROVE (Header and drawer remain flawlessly synchronized)\x1b[0m');
        process.exit(0);
    }
})();
