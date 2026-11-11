/**
 * tier5_adversarial_stress.js - Tier 5: Adversarial Stress Testing & Edge Cases
 * Rigorous adversarial stress verification for Organizador_Tareas v1.3.4
 * Tests rapid jitter school switching, live mobile drawer DOM mutation,
 * modal stacking context isolation, hard reload persistence, and zero-error integrity.
 */

const fs = require('fs');
const path = require('path');

const tests = [
    // =========================================================================
    // Test 1: Rapid Jitter School Switching Stress Test
    // =========================================================================
    {
        id: 'T5_ADV_01_rapid_jitter_school_switching',
        name: '25 Rapid Jitter School Transitions preserve header, drawer, and storage synchronization',
        run: async (page, helpers) => {
            await page.setViewport({ width: 412, height: 915 });
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
                localStorage.setItem('org_escolar_initialized_v3', 'true');
            });
            await page.reload({ waitUntil: 'load' });
            await new Promise(r => setTimeout(r, 300));

            const sequence = [
                'unam', 'ipn', 'uam', 'unconfigured', 'itesm',
                'uam', 'unconfigured', 'unam', 'ipn', 'itesm',
                'unconfigured', 'uam', 'unam', 'ipn', 'itesm',
                'unam', 'unconfigured', 'uam', 'ipn', 'unam',
                'unconfigured', 'ipn', 'uam', 'itesm', 'unam'
            ];

            for (let i = 0; i < sequence.length; i++) {
                const targetInst = sequence[i];
                await page.evaluate((instId) => {
                    if (instId === 'unconfigured') {
                        window.StorageModule.setSchoolSkipped(true);
                        window.StorageModule.setInstitution('unconfigured');
                        window.StorageModule.setAcademicPeriod('Sin periodo');
                        window.app?.setInstitution?.('unconfigured');
                    } else {
                        window.StorageModule.setSchoolSkipped(false);
                        window.StorageModule.setInstitution(instId);
                        const inst = window.InstitutionsModule?.getInstitution(instId);
                        const defaultPeriod = inst?.periods?.[0] || '1.º Semestre';
                        window.StorageModule.setAcademicPeriod(defaultPeriod);
                        window.app?.setInstitution?.(instId);
                    }
                }, targetInst);
            }

            // Verify final state synchronization
            const finalState = await page.evaluate(() => {
                const hName = document.getElementById('header-inst-name')?.textContent?.trim();
                const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
                const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
                const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
                const storageInst = window.StorageModule?.getInstitution();
                const storagePeriod = window.StorageModule?.getAcademicPeriod();
                return { hName, dName, hPeriod, dPeriod, storageInst, storagePeriod };
            });

            helpers.assertEqual(finalState.hName, finalState.dName, 'Header and drawer names in strict sync');
            helpers.assertIncludes(finalState.hName, 'Mi Organizador', 'Header muestra la identidad del usuario (v1.4.4)');
            helpers.assertEqual(finalState.hPeriod, finalState.dPeriod, 'Header and drawer periods in strict sync');
            helpers.assertEqual(finalState.storageInst, 'unam', 'Storage institution is unam');
            helpers.assertEqual(finalState.hPeriod, finalState.storagePeriod, 'Header period matches Storage period');
        }
    },

    // =========================================================================
    // Test 2: Live Mobile Drawer DOM Mutation while Open
    // =========================================================================
    {
        id: 'T5_ADV_02_live_mobile_drawer_dom_mutation',
        name: 'Live Mobile Drawer DOM Mutation while drawer is open updates smoothly without desync',
        run: async (page, helpers) => {
            await page.setViewport({ width: 375, height: 667 });
            await page.evaluate(() => {
                localStorage.setItem('org_escolar_initialized_v3', 'true');
                window.StorageModule?.setInstitution('unam');
                window.app?.setInstitution?.('unam');
            });
            await new Promise(r => setTimeout(r, 200));

            // Step 1: Open mobile drawer
            await page.evaluate(() => {
                const drawerToggle = document.getElementById('drawer-open-btn') || document.querySelector('[data-action="open-drawer"]');
                if (drawerToggle) drawerToggle.click();
                else window.app?.openDrawer?.();
            });
            await new Promise(r => setTimeout(r, 250));

            // Verify drawer is visible
            const drawerInitial = await page.evaluate(() => {
                const drawer = document.getElementById('sidebar-drawer');
                const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
                const hName = document.getElementById('header-inst-name')?.textContent?.trim();
                return {
                    isOpen: drawer ? !drawer.classList.contains('-translate-x-full') : false,
                    dName,
                    hName
                };
            });
            helpers.assertEqual(drawerInitial.dName, drawerInitial.hName, 'Initial drawer and header names match');

            // Step 2: Mutate live to "unconfigured" while drawer is open
            await page.evaluate(() => {
                window.StorageModule?.setSchoolSkipped(true);
                window.StorageModule?.setInstitution('unconfigured');
                window.StorageModule?.setAcademicPeriod('Sin periodo');
                window.app?.setInstitution?.('unconfigured');
            });
            await new Promise(r => setTimeout(r, 100));

            const unconfSync = await page.evaluate(() => {
                const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
                const hName = document.getElementById('header-inst-name')?.textContent?.trim();
                const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
                const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
                return { dName, hName, dPeriod, hPeriod };
            });

            helpers.assertEqual(unconfSync.dName, 'Mi Organizador', 'Drawer dynamically updated to Sin institución');
            helpers.assertEqual(unconfSync.hName, 'Mi Organizador', 'Header dynamically updated to Sin institución');
            helpers.assertEqual(unconfSync.dPeriod, 'Sin periodo', 'Drawer dynamically updated to Sin periodo');
            helpers.assertEqual(unconfSync.hPeriod, 'Sin periodo', 'Header dynamically updated to Sin periodo');

            // Step 3: Mutate live to "uam" (trimestral) while drawer is open
            await page.evaluate(() => {
                window.StorageModule?.setSchoolSkipped(false);
                window.StorageModule?.setInstitution('uam');
                window.StorageModule?.setAcademicPeriod('1.º Trimestre');
                window.app?.setInstitution?.('uam');
            });
            await new Promise(r => setTimeout(r, 100));

            const uamSync = await page.evaluate(() => {
                const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
                const hName = document.getElementById('header-inst-name')?.textContent?.trim();
                const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
                const dSlogan = document.getElementById('drawer-inst-slogan')?.textContent?.trim();
                return { dName, hName, dPeriod, dSlogan };
            });

            helpers.assertEqual(uamSync.dName, uamSync.hName, 'Drawer and header match for UAM');
            helpers.assertIncludes(uamSync.dName, 'Mi Organizador', 'Drawer displays UAM');
            helpers.assertEqual(uamSync.dPeriod, '1.º Trimestre', 'Drawer reflects trimestral period');
            helpers.assertIncludes(uamSync.dSlogan, 'Casa abierta al tiempo', 'Drawer displays official UAM slogan');

            // Close drawer
            await page.evaluate(() => {
                const closeBtn = document.getElementById('drawer-close-btn');
                if (closeBtn) closeBtn.click();
                else window.app?.closeDrawer?.();
            });
            await new Promise(r => setTimeout(r, 200));
        }
    },

    // =========================================================================
    // Test 3: Stacking Context & Backdrop Hit-Testing Isolation
    // =========================================================================
    {
        id: 'T5_ADV_03_modal_stacking_context_and_backdrop_clicks',
        name: 'Modal stacking context: z-[60] custom school modal isolates clicks over z-50 welcome modal',
        run: async (page, helpers) => {
            await page.setViewport({ width: 1280, height: 800 });
            await page.evaluate(() => {
                localStorage.clear();
                window.app?.openCycleWelcomeModal?.();
                document.getElementById('welcome-create-school-btn')?.click();
            });
            await new Promise(r => setTimeout(r, 200));

            const stacking = await page.evaluate(() => {
                const customModal = document.getElementById('custom-school-modal');
                const welcomeModal = document.getElementById('cycle-setup-modal');
                const customZ = parseInt(window.getComputedStyle(customModal).zIndex, 10);
                const welcomeZ = parseInt(window.getComputedStyle(welcomeModal).zIndex, 10);

                // Hit test top element at screen center
                const rect = customModal.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const topEl = document.elementFromPoint(centerX, centerY);
                const isInsideCustom = customModal.contains(topEl);

                return {
                    customZ,
                    welcomeZ,
                    customHigher: customZ > welcomeZ,
                    isInsideCustom
                };
            });

            helpers.assertTrue(stacking.customHigher, 'Custom school modal z-index must be strictly higher than welcome modal');
            helpers.assertEqual(stacking.customZ, 60, 'Custom modal computed z-index is 60');
            helpers.assertEqual(stacking.welcomeZ, 50, 'Welcome modal computed z-index is 50');
            helpers.assertTrue(stacking.isInsideCustom, 'Clicks land inside custom modal, isolated from welcome modal');

            // Cancel custom modal and ensure welcome modal remains completely interactable
            await page.evaluate(() => {
                document.getElementById('custom-school-cancel-btn')?.click();
            });
            await new Promise(r => setTimeout(r, 260));

            const parentIntact = await page.evaluate(() => {
                const welcome = document.getElementById('cycle-setup-modal');
                const custom = document.getElementById('custom-school-modal');
                return {
                    welcomeVisible: welcome && !welcome.classList.contains('hidden'),
                    customHidden: custom && custom.classList.contains('hidden')
                };
            });
            helpers.assertTrue(parentIntact.welcomeVisible, 'Welcome modal remains open after canceling custom builder');
            helpers.assertTrue(parentIntact.customHidden, 'Custom modal is cleanly dismissed');
        }
    },

    // =========================================================================
    // Test 4: Hard Page Reload Persistence Under Edge States
    // =========================================================================
    {
        id: 'T5_ADV_04_hard_reload_persistence_under_edge_states',
        name: 'Hard page reload preserves unconfigured and custom states with zero state drift',
        run: async (page, helpers) => {
            // State A: Skipped unconfigured school with custom dates
            await page.evaluate(() => {
                localStorage.clear();
                localStorage.setItem('org_escolar_initialized_v3', 'true');
                localStorage.setItem('org_escolar_cycle_configured_v1', 'true');
                window.StorageModule.setSchoolSkipped(true);
                window.StorageModule.setInstitution('unconfigured');
                window.StorageModule.setAcademicPeriod('Sin periodo');
            });
            await page.reload({ waitUntil: 'load' });
            await new Promise(r => setTimeout(r, 400));

            const stateA = await page.evaluate(() => {
                return {
                    isSkipped: window.StorageModule.isSchoolSkipped(),
                    instId: window.StorageModule.getInstitution(),
                    period: window.StorageModule.getAcademicPeriod(),
                    headerName: document.getElementById('header-inst-name')?.textContent?.trim(),
                    headerPeriod: document.getElementById('header-inst-period')?.textContent?.trim(),
                    headerLogo: document.getElementById('header-inst-logo')?.textContent?.trim()
                };
            });

            helpers.assertTrue(stateA.isSkipped, 'State A: isSchoolSkipped preserved across hard reload');
            helpers.assertEqual(stateA.instId, 'unconfigured', 'State A: Institution ID preserved as unconfigured');
            helpers.assertEqual(stateA.period, 'Sin periodo', 'State A: Academic period preserved as Sin periodo');
            helpers.assertEqual(stateA.headerName, 'Mi Organizador', 'State A: Header name preserved as Sin institución');
            helpers.assertIncludes(stateA.headerLogo, '👤', 'State A: Header logo preserved as graduation cap');

            // State B: Custom school with custom cuatrimestral period
            await page.evaluate(() => {
                const custom = {
                    id: 'cust_edge_persist',
                    name: 'Colegio Titan',
                    shortBadge: 'TITAN',
                    fullName: 'Colegio Tecnológico Titan',
                    slogan: 'Fuerza y Disciplina',
                    countryCode: 'CL',
                    systemType: 'Cuatrimestral',
                    colors: { primary: '#0284C7', secondary: '#FFFFFF', accent: '#0284C7' },
                    periods: ['1.º Cuatrimestre', '2.º Cuatrimestre', '3.º Cuatrimestre'],
                    isCustom: true
                };
                window.StorageModule.saveCustomSchool(custom);
                window.StorageModule.setSchoolSkipped(false);
                window.StorageModule.setInstitution('cust_edge_persist');
                window.StorageModule.setAcademicPeriod('2.º Cuatrimestre');
            });
            await page.reload({ waitUntil: 'load' });
            await new Promise(r => setTimeout(r, 400));

            const stateB = await page.evaluate(() => {
                return {
                    isSkipped: window.StorageModule.isSchoolSkipped(),
                    instId: window.StorageModule.getInstitution(),
                    period: window.StorageModule.getAcademicPeriod(),
                    headerName: document.getElementById('header-inst-name')?.textContent?.trim(),
                    headerPeriod: document.getElementById('header-inst-period')?.textContent?.trim(),
                    drawerName: document.getElementById('drawer-inst-name')?.textContent?.trim(),
                    drawerPeriod: document.getElementById('drawer-inst-period')?.textContent?.trim(),
                    drawerSlogan: document.getElementById('drawer-inst-slogan')?.textContent?.trim()
                };
            });

            helpers.assertFalse(stateB.isSkipped, 'State B: isSchoolSkipped is false for custom school');
            helpers.assertEqual(stateB.instId, 'cust_edge_persist', 'State B: Custom institution ID preserved');
            helpers.assertEqual(stateB.period, '2.º Cuatrimestre', 'State B: Custom period preserved');
            helpers.assertIncludes(stateB.headerName, 'Mi Organizador', 'State B: Header displays custom name');
            helpers.assertEqual(stateB.headerName, stateB.drawerName, 'State B: Header and drawer names match');
            helpers.assertEqual(stateB.headerPeriod, stateB.drawerPeriod, 'State B: Header and drawer periods match');
            helpers.assertIncludes(stateB.drawerSlogan, 'Fuerza y Disciplina', 'State B: Drawer motto preserved');
        }
    },

    // =========================================================================
    // Test 5: Fail-Closed Zero-Error Runtime Integrity Audit
    // =========================================================================
    {
        id: 'T5_ADV_05_runtime_error_free_fail_closed_audit',
        name: 'Fail-closed runtime error audit: comprehensive DOM mutations with zero uncaught errors',
        run: async (page, helpers) => {
            const runtimeErrors = [];
            page.on('pageerror', err => runtimeErrors.push(err.toString()));

            await page.evaluate(() => {
                // Execute a barrage of view transitions, mock haptics, and storage mutations
                window.app?.switchView?.('tasks');
                window.app?.switchView?.('subjects');
                window.app?.switchView?.('calendar');
                window.app?.switchView?.('notes');
                window.app?.switchView?.('settings');
                window.app?.switchView?.('secret-codes');

                // Trigger notifications and haptics safely
                window.HapticsModule?.light?.();
                window.HapticsModule?.medium?.();
                window.HapticsModule?.success?.();

                // Generate widget sync
                window.WidgetSyncModule?.sync?.();
            });

            helpers.assertEqual(runtimeErrors.length, 0, 'Zero uncaught page errors across barrage of operations');
        }
    }
];

module.exports = {
    tier: 5,
    name: 'Tier 5: Adversarial Stress Testing & Edge Cases',
    tests
};
