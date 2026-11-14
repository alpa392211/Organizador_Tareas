/**
 * tier5_adversarial_stress.js - Tier 5: Adversarial Stress Testing & Edge Cases
 * Rigorous adversarial stress verification for Organizador_Tareas v1.5.0
 * Tests rapid jitter manual period switching, live mobile drawer DOM mutation,
 * Settings profile photo + modal stacking isolation, legacy localStorage cleanup & hard reload persistence,
 * and zero-error integrity.
 */

const fs = require('fs');
const path = require('path');

const tests = [
    // =========================================================================
    // Test 1: Rapid Jitter Manual Period Switching Stress Test
    // =========================================================================
    {
        id: 'T5_ADV_01_rapid_jitter_manual_period_sync',
        name: '25 Rapid Jitter Manual Period Transitions preserve header, drawer, visibility, and storage synchronization',
        run: async (page, helpers) => {
            await page.setViewport({ width: 412, height: 915 });
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
                localStorage.setItem('org_escolar_initialized_v3', 'true');
                localStorage.setItem('org_escolar_onboarding_v1', 'true');
                localStorage.setItem('org_escolar_cycle_configured_v1', 'true');
            });
            await page.reload({ waitUntil: 'load' });
            await new Promise(r => setTimeout(r, 300));

            const sequence = [
                '1.er Semestre', '2.º Trimestre', '', 'Cuatrimestre 3', 'Módulo A',
                '', 'Verano 2026', '4.º Semestre', '', 'Trimestre 1',
                'Posgrado 1', '', '2.º Semestre', 'Año 2', '',
                'Bloque 4', '', '3.er Cuatrimestre', 'Módulo 2', '5.º Semestre',
                '', '1.º Trimestre', 'Semestre B', '', '3.er Semestre'
            ];

            for (let i = 0; i < sequence.length; i++) {
                const targetPeriod = sequence[i];
                await page.evaluate((periodVal) => {
                    window.app?.setAcademicPeriod?.(periodVal);
                }, targetPeriod);
            }

            // Verify final non-empty state synchronization
            const finalState = await page.evaluate(() => {
                const hName = document.getElementById('header-inst-name')?.textContent?.trim();
                const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
                const hPeriodEl = document.getElementById('header-inst-period');
                const dPeriodEl = document.getElementById('drawer-inst-period');
                const hPeriod = hPeriodEl?.textContent?.trim();
                const dPeriod = dPeriodEl?.textContent?.trim();
                const storagePeriod = window.StorageModule?.getAcademicPeriod();
                return {
                    hName,
                    dName,
                    hPeriod,
                    dPeriod,
                    hHidden: hPeriodEl?.classList.contains('hidden'),
                    dHidden: dPeriodEl?.classList.contains('hidden'),
                    storagePeriod
                };
            });

            helpers.assertEqual(finalState.hName, finalState.dName, 'Header and drawer names in strict sync');
            helpers.assertIncludes(finalState.hName, 'Mi Organizador', 'Header displays default organizer identity');
            helpers.assertEqual(finalState.hPeriod, finalState.dPeriod, 'Header and drawer periods in strict sync');
            helpers.assertEqual(finalState.storagePeriod, '3.er Semestre', 'Storage period matches final value');
            helpers.assertEqual(finalState.hPeriod, finalState.storagePeriod, 'Header period matches Storage period');
            helpers.assertFalse(finalState.hHidden, 'Header period must be visible when non-empty');
            helpers.assertFalse(finalState.dHidden, 'Drawer period must be visible when non-empty');

            // Verify clearing period hides both labels cleanly
            await page.evaluate(() => {
                window.app?.setAcademicPeriod?.('');
            });
            const clearedState = await page.evaluate(() => {
                const hPeriodEl = document.getElementById('header-inst-period');
                const dPeriodEl = document.getElementById('drawer-inst-period');
                return {
                    storagePeriod: window.StorageModule?.getAcademicPeriod(),
                    hHidden: hPeriodEl?.classList.contains('hidden'),
                    dHidden: dPeriodEl?.classList.contains('hidden'),
                    hSelectGone: document.getElementById('header-period-select') === null
                };
            });
            helpers.assertEqual(clearedState.storagePeriod, '', 'Cleared period is empty string');
            helpers.assertTrue(clearedState.hHidden, 'Header period is hidden when empty');
            helpers.assertTrue(clearedState.dHidden, 'Drawer period is hidden when empty');
            helpers.assertTrue(clearedState.hSelectGone, 'Editable period select is removed from header');
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
                localStorage.setItem('org_escolar_onboarding_v1', 'true');
                localStorage.setItem('org_escolar_cycle_configured_v1', 'true');
                window.StorageModule?.setUserName('Elena Cruz');
                window.StorageModule?.setAcademicPeriod('2.º Semestre');
                window.app?.refreshAll?.();
            });
            await new Promise(r => setTimeout(r, 200));

            // Step 1: Open mobile drawer
            await page.evaluate(() => {
                const drawerToggle = document.getElementById('drawer-toggle-btn');
                if (drawerToggle) drawerToggle.click();
            });
            await new Promise(r => setTimeout(r, 250));

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
            helpers.assertEqual(drawerInitial.dName, 'Elena Cruz', 'Drawer shows initial user name');

            // Step 2: Mutate live while drawer is open (clear period & reset name)
            await page.evaluate(() => {
                window.StorageModule?.setUserName('');
                window.app?.setAcademicPeriod?.('');
                window.app?.renderHeader?.();
                window.app?.renderDrawer?.();
            });
            await new Promise(r => setTimeout(r, 100));

            const clearedSync = await page.evaluate(() => {
                const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
                const hName = document.getElementById('header-inst-name')?.textContent?.trim();
                const dPeriodHidden = document.getElementById('drawer-inst-period')?.classList.contains('hidden');
                const hPeriodHidden = document.getElementById('header-inst-period')?.classList.contains('hidden');
                return { dName, hName, dPeriodHidden, hPeriodHidden };
            });

            helpers.assertEqual(clearedSync.dName, 'Mi Organizador', 'Drawer dynamically updated to Mi Organizador');
            helpers.assertEqual(clearedSync.hName, 'Mi Organizador', 'Header dynamically updated to Mi Organizador');
            helpers.assertTrue(clearedSync.dPeriodHidden, 'Drawer period hidden when cleared');
            helpers.assertTrue(clearedSync.hPeriodHidden, 'Header period hidden when cleared');

            // Step 3: Mutate live to new name & manual period while drawer is open
            await page.evaluate(() => {
                window.StorageModule?.setUserName('Mateo Vargas');
                window.app?.setAcademicPeriod?.('1.º Trimestre');
                window.app?.renderHeader?.();
                window.app?.renderDrawer?.();
            });
            await new Promise(r => setTimeout(r, 100));

            const updatedSync = await page.evaluate(() => {
                const dName = document.getElementById('drawer-inst-name')?.textContent?.trim();
                const hName = document.getElementById('header-inst-name')?.textContent?.trim();
                const dPeriod = document.getElementById('drawer-inst-period')?.textContent?.trim();
                const hPeriod = document.getElementById('header-inst-period')?.textContent?.trim();
                return { dName, hName, dPeriod, hPeriod };
            });

            helpers.assertEqual(updatedSync.dName, updatedSync.hName, 'Drawer and header match');
            helpers.assertEqual(updatedSync.dName, 'Mateo Vargas', 'Drawer displays updated name');
            helpers.assertEqual(updatedSync.dPeriod, '1.º Trimestre', 'Drawer reflects manual period');
            helpers.assertEqual(updatedSync.hPeriod, '1.º Trimestre', 'Header reflects manual period');

            // Close drawer
            await page.evaluate(() => {
                const closeBtn = document.getElementById('drawer-close-btn');
                if (closeBtn) closeBtn.click();
                else window.app?.closeSidebarDrawer?.();
            });
            await new Promise(r => setTimeout(r, 200));
        }
    },

    // =========================================================================
    // Test 3: Settings Profile Photo Upload (After Skipping) & Modal Stacking Isolation
    // =========================================================================
    {
        id: 'T5_ADV_03_settings_profile_photo_and_modal_stacking',
        name: 'Profile photo can be uploaded in Settings after skipping onboarding, and modals isolate stacking contexts',
        run: async (page, helpers) => {
            await page.setViewport({ width: 1280, height: 800 });
            await page.evaluate(() => {
                localStorage.clear();
                localStorage.setItem('org_escolar_initialized_v3', 'true');
                localStorage.setItem('org_escolar_onboarding_v1', 'true');
                localStorage.setItem('org_escolar_cycle_configured_v1', 'true');
                window.StorageModule?.setUserPhoto?.('');
                window.app?.switchView?.('settings');
                window.app?.refreshSettingsProfileUI?.();
            });
            await new Promise(r => setTimeout(r, 150));

            const beforeUpload = await page.evaluate(() => ({
                hasPhoto: Boolean(window.StorageModule?.getUserPhoto?.()),
                clearHidden: document.getElementById('settings-photo-clear-btn')?.classList.contains('hidden'),
                uploadLabel: document.getElementById('settings-photo-upload-btn')?.textContent?.trim()
            }));
            helpers.assertFalse(beforeUpload.hasPhoto, 'User skipped photo initially');
            helpers.assertTrue(beforeUpload.clearHidden, 'Clear photo button hidden when no photo exists');
            helpers.assertEqual(beforeUpload.uploadLabel, 'Subir foto', 'Upload button says "Subir foto"');

            await helpers.simulateFileUpload(page, '#settings-photo-input', {
                width: 400,
                height: 400,
                color: '#10B981',
                fileName: 'perfil_settings.png'
            });
            await new Promise(r => setTimeout(r, 250));

            const afterUpload = await page.evaluate(() => ({
                photo: window.StorageModule?.getUserPhoto?.() || '',
                clearVisible: !document.getElementById('settings-photo-clear-btn')?.classList.contains('hidden'),
                uploadLabel: document.getElementById('settings-photo-upload-btn')?.textContent?.trim(),
                headerHasImg: Boolean(document.querySelector('#header-inst-logo img'))
            }));
            helpers.assertTrue(afterUpload.photo.startsWith('data:image/'), 'Settings photo saved as data:image URL');
            helpers.assertTrue(afterUpload.clearVisible, 'Clear photo button becomes visible');
            helpers.assertEqual(afterUpload.uploadLabel, 'Cambiar foto', 'Upload button updates to "Cambiar foto"');
            helpers.assertTrue(afterUpload.headerHasImg, 'Header avatar updates immediately');

            // Verify modal stacking context isolation (subject-modal z-50 vs note-unlock-modal z-70)
            await page.evaluate(() => {
                window.SubjectsModule?.openAddModal?.();
            });
            await new Promise(r => setTimeout(r, 80));
            const stacking = await page.evaluate(() => {
                const subModal = document.getElementById('subject-modal');
                const noteUnlockModal = document.getElementById('note-unlock-modal');
                const subZ = parseInt(window.getComputedStyle(subModal).zIndex, 10);
                const unlockZ = parseInt(window.getComputedStyle(noteUnlockModal).zIndex, 10);
                const rect = subModal.getBoundingClientRect();
                const topEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
                const insideSubModal = subModal.contains(topEl);
                window.SubjectsModule?.closeModal?.();
                return { subZ, unlockZ, insideSubModal };
            });

            helpers.assertEqual(stacking.subZ, 50, 'Subject modal z-index is 50');
            helpers.assertEqual(stacking.unlockZ, 70, 'Note unlock modal z-index is 70');
            helpers.assertTrue(stacking.insideSubModal, 'Center hit-test lands inside open subject modal');
        }
    },

    // =========================================================================
    // Test 4: Legacy LocalStorage Cleanup & Hard Page Reload Persistence
    // =========================================================================
    {
        id: 'T5_ADV_04_legacy_cleanup_and_hard_reload_persistence',
        name: 'Legacy localStorage keys are cleaned at startup while v1.5.0 profile, period, and monochrome mode persist across reload',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                localStorage.clear();
                localStorage.setItem('org_escolar_initialized_v3', 'true');
                localStorage.setItem('org_escolar_onboarding_v1', 'true');
                localStorage.setItem('org_escolar_cycle_configured_v1', 'true');

                // Seed legacy keys from < v1.5.0
                localStorage.setItem('org_escolar_institution', 'unam');
                localStorage.setItem('org_escolar_logo_expand', 'true');
                localStorage.setItem('org_escolar_cats_enabled_v1', 'true');
                localStorage.setItem('org_escolar_custom_schools', '[]');
                localStorage.setItem('org_escolar_school_skipped_v1', 'false');
                localStorage.setItem('org_escolar_user_country', 'MX');
                localStorage.setItem('org_escolar_dev_notice_144_seen', 'true');
                localStorage.setItem('org_escolar_vault_unlocked_codes_v2', JSON.stringify(['APOLLO11', 'GATITOS_']));
                localStorage.setItem('org_escolar_active_special_theme_v1', 'theme_cats');

                // Seed valid v1.5.0 state
                window.StorageModule.setUserName('Lucía Mendoza');
                window.StorageModule.setAcademicPeriod('5.º Semestre');
                window.StorageModule.setGrayModeEnabled(true);
            });
            await page.reload({ waitUntil: 'load' });
            await new Promise(r => setTimeout(r, 400));

            const result = await page.evaluate(() => {
                const legacyPresent = [
                    'org_escolar_institution',
                    'org_escolar_logo_expand',
                    'org_escolar_cats_enabled_v1',
                    'org_escolar_custom_schools',
                    'org_escolar_school_skipped_v1',
                    'org_escolar_user_country',
                    'org_escolar_dev_notice_144_seen'
                ].some(k => localStorage.getItem(k) !== null);

                const unlockedCodes = window.StorageModule.getUnlockedCodes();
                return {
                    legacyPresent,
                    hasGatitosCode: unlockedCodes.includes('GATITOS_'),
                    hasApolloCode: unlockedCodes.includes('APOLLO11'),
                    specialTheme: window.StorageModule.getActiveSpecialTheme(),
                    grayEnabled: window.StorageModule.getGrayModeEnabled(),
                    hasThemeGrayClass: document.documentElement.classList.contains('theme-gray'),
                    userName: window.StorageModule.getUserName(),
                    period: window.StorageModule.getAcademicPeriod(),
                    headerName: document.getElementById('header-inst-name')?.textContent?.trim(),
                    headerPeriod: document.getElementById('header-inst-period')?.textContent?.trim(),
                    drawerName: document.getElementById('drawer-inst-name')?.textContent?.trim(),
                    drawerPeriod: document.getElementById('drawer-inst-period')?.textContent?.trim()
                };
            });

            helpers.assertFalse(result.legacyPresent, 'All legacy institution/country/cats/logo keys removed on startup');
            helpers.assertFalse(result.hasGatitosCode, 'Obsolete GATITOS_ code purged from vault unlocked codes');
            helpers.assertTrue(result.hasApolloCode, 'Valid vault codes like APOLLO11 preserved');
            helpers.assertEqual(result.specialTheme, 'default', 'Obsolete cats special theme reset to default');
            helpers.assertTrue(result.grayEnabled, 'Monochrome mode preserved across hard reload');
            helpers.assertTrue(result.hasThemeGrayClass, 'theme-gray class restored on documentElement');
            helpers.assertEqual(result.userName, 'Lucía Mendoza', 'User name preserved across reload');
            helpers.assertEqual(result.period, '5.º Semestre', 'Manual period preserved across reload');
            helpers.assertEqual(result.headerName, 'Lucía Mendoza', 'Header name synced across reload');
            helpers.assertEqual(result.drawerName, 'Lucía Mendoza', 'Drawer name synced across reload');
            helpers.assertEqual(result.headerPeriod, '5.º Semestre', 'Header period synced across reload');
            helpers.assertEqual(result.drawerPeriod, '5.º Semestre', 'Drawer period synced across reload');
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
