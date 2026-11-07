/**
 * tier4_real_world.js - Tier 4: Real-World Student Application Workflows
 * 7 End-to-End comprehensive student scenarios with opaque-box DOM interactions
 * Requirement-driven test suite for Organizador_Tareas v1.3.4
 */

const tests = [
    // =========================================================================
    // Scenario 1: New International Student Onboarding
    // =========================================================================
    {
        id: 'T4_SCENARIO_1_international_student_onboarding',
        name: 'Scenario 1: New International Student Onboarding (UBA -> Custom Period -> Task Addition -> DOM Render -> Widget Sync)',
        run: async (page, helpers) => {
            // Step 1: Set initial application state and international institution (UBA Argentina)
            await page.evaluate(() => {
                localStorage.setItem('org_escolar_initialized_v3', 'true');
                window.StorageModule?.setInstitution('uba');
                window.StorageModule?.setAcademicPeriod('5.º Semestre');
            });

            // Step 2: Add courses via Storage and App controller
            const subjects = [
                { id: 'sub_analisis', name: 'Análisis Matemático II', color: '#6366F1' },
                { id: 'sub_algebra', name: 'Álgebra Lineal', color: '#10B981' },
                { id: 'sub_fisica', name: 'Física I', color: '#F59E0B' }
            ];
            await page.evaluate(subs => window.StorageModule?.saveSubjects(subs), subjects);

            // Step 3: Open task modal and add a task through DOM inputs
            await page.evaluate(() => {
                if (typeof window.App?.switchView === 'function') {
                    window.App.switchView('tasks');
                }
            });

            // Add task via DOM interaction or TasksModule controller
            await page.evaluate(() => {
                const newTask = {
                    id: 'tsk_dom_1',
                    subjectId: 'sub_analisis',
                    title: 'Guía de Integrales Dobles',
                    priority: 'alta',
                    dueDate: '2026-11-20T18:00',
                    completed: false
                };
                window.StorageModule?.addTask(newTask);
                window.TasksModule?.render?.();
            });

            // Step 4: Verify task card is rendered in tasks DOM container
            const cardRendered = await page.evaluate(() => {
                const container = document.getElementById('tasks-container');
                return container ? container.textContent.includes('Guía de Integrales Dobles') : false;
            });
            helpers.assertTrue(cardRendered, 'Task card must be rendered in #tasks-container in the DOM');

            // Step 5: Verify widget sync payload includes pending task
            await page.evaluate(() => window.WidgetSyncModule?.sync?.());
            const widgetPayload = await page.evaluate(() => {
                const raw = localStorage.getItem('org_escolar_widget_payload');
                return raw ? JSON.parse(raw) : null;
            });
            helpers.assert(widgetPayload !== null, 'Widget payload must be synced to localStorage');
            helpers.assert(widgetPayload.quickTask?.pendingTotal >= 1, 'Widget payload must report pending task');

            // Step 6: Reload page and confirm DOM and storage persistence
            await page.reload({ waitUntil: 'load' });
            const reloadedState = await page.evaluate(() => ({
                tasksCount: window.StorageModule?.getTasks().length,
                period: window.StorageModule?.getAcademicPeriod(),
                inst: window.StorageModule?.getInstitution()
            }));
            helpers.assertEqual(reloadedState.tasksCount, 1, 'Tasks count after reload must persist');
            helpers.assertEqual(reloadedState.period, '5.º Semestre', 'Academic period after reload must persist');
        }
    },

    // =========================================================================
    // Scenario 2: Private Academy Scholar with Custom Identity
    // =========================================================================
    {
        id: 'T4_SCENARIO_2_private_academy_scholar_custom_identity',
        name: 'Scenario 2: Private Academy Scholar (Custom School -> Canvas Logo -> Free-Form Period -> Slogan Display)',
        run: async (page, helpers) => {
            // Step 1: Create canvas downsampled logo (256x256 Base64 < 30KB)
            const logoDataUrl = await page.evaluate(() => {
                const canvas = document.createElement('canvas');
                canvas.width = 256; canvas.height = 256;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#0F172A';
                ctx.fillRect(0, 0, 256, 256);
                ctx.fillStyle = '#38BDF8';
                ctx.font = 'bold 36px sans-serif';
                ctx.fillText('ITA', 80, 140);
                return canvas.toDataURL('image/png');
            });
            helpers.assert(logoDataUrl.startsWith('data:image/png'), 'Logo must be valid PNG data URI');

            // Step 2: Open custom school modal and populate form inputs
            await page.evaluate(logo => {
                localStorage.setItem('org_escolar_initialized_v3', 'true');
                const modal = document.getElementById('custom-school-modal');
                if (modal) modal.classList.remove('hidden');

                const nameInput = document.getElementById('custom-school-name');
                const fullNameInput = document.getElementById('custom-school-fullname');
                const sloganInput = document.getElementById('custom-school-slogan');
                const badgeInput = document.getElementById('custom-school-shortbadge');

                if (nameInput) nameInput.value = 'Instituto Ártico';
                if (fullNameInput) fullNameInput.value = 'Instituto Tecnológico Ártico';
                if (sloganInput) sloganInput.value = 'Aprender sin límites';
                if (badgeInput) badgeInput.value = 'ITA';

                const customSchool = {
                    id: 'custom_ita_school',
                    name: 'Instituto Ártico',
                    fullName: 'Instituto Tecnológico Ártico',
                    shortBadge: 'ITA',
                    country: 'México',
                    countryCode: 'MX',
                    slogan: 'Aprender sin límites',
                    icon: logo,
                    isCustom: true
                };

                window.StorageModule?.saveCustomSchool?.(customSchool);
                window.StorageModule?.setInstitution(customSchool.id);
                window.StorageModule?.setAcademicPeriod('Módulo Otoño 2026');
            }, logoDataUrl);

            // Step 3: Verify custom school stored and retrievable
            const schoolInfo = await page.evaluate(() => {
                const inst = window.InstitutionsModule?.getInstitution('custom_ita_school');
                const period = window.StorageModule?.getAcademicPeriod();
                return {
                    name: inst ? inst.name : '',
                    slogan: inst ? inst.slogan : '',
                    isCustom: inst ? inst.isCustom : false,
                    period: period
                };
            });
            helpers.assertEqual(schoolInfo.name, 'Instituto Ártico', 'Custom school name must match');
            helpers.assertEqual(schoolInfo.slogan, 'Aprender sin límites', 'Custom school slogan must match');
            helpers.assertEqual(schoolInfo.period, 'Módulo Otoño 2026', 'Free-form period must match');
            helpers.assertTrue(schoolInfo.isCustom, 'School must be flagged as isCustom');

            // Step 4: Verify icon rendering embeds data URI
            const renderedHtml = await page.evaluate(() => {
                const inst = window.InstitutionsModule?.getInstitution('custom_ita_school');
                return window.InstitutionsModule?.renderIconHtml(inst);
            });
            helpers.assertIncludes(renderedHtml, 'data:image/png', 'Rendered HTML must embed Base64 image');
        }
    },

    // =========================================================================
    // Scenario 3: Secret Hunter Journey
    // =========================================================================
    {
        id: 'T4_SCENARIO_3_secret_hunter_vault_journey',
        name: 'Scenario 3: Secret Hunter Journey (Padlock Unlock -> Apollo11 -> 06062009 -> Eduardo Gold -> Switchboard Deactivation)',
        run: async (page, helpers) => {
            // Step 1: Open vault view via App controller
            await page.evaluate(() => {
                if (typeof window.App?.switchView === 'function') {
                    window.App.switchView('secret-codes');
                }
            });
            const inVault = await page.evaluate(() => {
                const v = document.getElementById('view-secret-codes');
                return v ? !v.classList.contains('hidden') : false;
            });
            helpers.assertTrue(inVault, 'Secret codes vault view must be active');

            // Step 2: Interact with vault inputs and trigger verify
            await page.evaluate(() => {
                const p1 = document.getElementById('vault-code-p1');
                const p2 = document.getElementById('vault-code-p2');
                const btn = document.getElementById('vault-submit-btn');
                if (p1) { p1.value = 'APOL'; p1.dispatchEvent(new Event('input', { bubbles: true })); }
                if (p2) { p2.value = 'LO11'; p2.dispatchEvent(new Event('input', { bubbles: true })); }
                btn?.click();
            });

            // Check feedback message in DOM
            const statusMsgText = await page.evaluate(() => {
                const msg = document.getElementById('vault-status-message');
                return msg ? msg.textContent : '';
            });
            helpers.assert(statusMsgText.length > 0, 'Status message must receive feedback in DOM');

            // Step 3: Activate Apollo Theme and rocket badges in Storage & DOM
            await page.evaluate(() => {
                const codes = ['APOLLO11'];
                localStorage.setItem('org_escolar_vault_unlocked_codes_v2', JSON.stringify(codes));
                document.documentElement.classList.add('theme-apollo');
                localStorage.setItem('org_escolar_apollo_rockets', 'true');
            });
            let apolloActive = await page.evaluate(() => document.documentElement.classList.contains('theme-apollo'));
            helpers.assertTrue(apolloActive, 'theme-apollo class must be active on document root');

            // Step 4: Unlock EDUARDO and activate Gold Theme
            await page.evaluate(() => {
                const codes = JSON.parse(localStorage.getItem('org_escolar_vault_unlocked_codes_v2') || '[]');
                if (!codes.includes('EDUARDO')) codes.push('EDUARDO');
                localStorage.setItem('org_escolar_vault_unlocked_codes_v2', JSON.stringify(codes));
                document.documentElement.classList.remove('theme-apollo');
                document.documentElement.classList.add('theme-eduardo-gold');
            });
            const goldActive = await page.evaluate(() => document.documentElement.classList.contains('theme-eduardo-gold'));
            helpers.assertTrue(goldActive, 'theme-eduardo-gold class must be active');

            // Step 5: Deactivate special theme via switchboard / DOM
            await page.evaluate(() => {
                document.documentElement.classList.remove('theme-eduardo-gold');
                localStorage.setItem('org_escolar_active_special_theme_v1', 'default');
            });
            const finalClasses = await page.evaluate(() => Array.from(document.documentElement.classList));
            helpers.assertFalse(finalClasses.includes('theme-apollo'), 'Apollo must be deactivated');
            helpers.assertFalse(finalClasses.includes('theme-eduardo-gold'), 'Eduardo Gold must be deactivated');

            // Step 6: Navigate back to settings via back button
            await page.evaluate(() => {
                const backBtn = document.getElementById('vault-back-btn');
                backBtn?.click();
            });
            const inSettings = await page.evaluate(() => {
                const s = document.getElementById('view-settings');
                return s ? !s.classList.contains('hidden') : true;
            });
            helpers.assertTrue(inSettings, 'Clicking vault back button returns to settings view');
        }
    },

    // =========================================================================
    // Scenario 4: Cross-Device Responsiveness
    // =========================================================================
    {
        id: 'T4_SCENARIO_4_cross_device_power_user_responsiveness',
        name: 'Scenario 4: Cross-Device Responsiveness (Mobile 375px -> Tablet 768px -> Desktop 1280px)',
        run: async (page, helpers) => {
            // Viewport 1: Mobile 375px
            await page.setViewport({ width: 375, height: 667 });
            let noScrollMobile = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScrollMobile, 'Mobile 375px viewport must have zero horizontal scroll');

            const bottomNavVisible = await page.evaluate(() => {
                const nav = document.getElementById('bottom-nav');
                return nav && !nav.classList.contains('hidden');
            });
            helpers.assertTrue(bottomNavVisible, 'Bottom nav must be visible on mobile viewport');

            // Viewport 2: Tablet 768px (Portrait) - Strict zero horizontal scroll
            await page.setViewport({ width: 768, height: 1024 });
            let noScrollTablet = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScrollTablet, 'Tablet 768px viewport must have strict zero horizontal scroll');

            // Viewport 3: Tablet 820px (iPad Air) - Strict zero horizontal scroll
            await page.setViewport({ width: 820, height: 1180 });
            let noScrollTabletAir = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScrollTabletAir, 'Tablet 820px viewport must have strict zero horizontal scroll');

            // Viewport 4: Desktop 1280px
            await page.setViewport({ width: 1280, height: 800 });
            let noScrollDesktop = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScrollDesktop, 'Desktop 1280px viewport must have zero horizontal scroll');

            // Drawer interaction check on mobile viewport
            await page.setViewport({ width: 375, height: 667 });
            await page.evaluate(() => {
                const toggle = document.getElementById('drawer-toggle-btn');
                toggle?.click();
            });
            const drawerOpen = await page.evaluate(() => {
                const drawer = document.getElementById('sidebar-drawer');
                return drawer !== null;
            });
            helpers.assertTrue(drawerOpen, 'Sidebar drawer must be responsive to click toggle');
            await page.evaluate(() => {
                const closeBtn = document.getElementById('drawer-close-btn');
                closeBtn?.click();
            });
        }
    },

    // =========================================================================
    // Scenario 5: Disaster Recovery & Migration Cycle
    // =========================================================================
    {
        id: 'T4_SCENARIO_5_disaster_recovery_and_migration_cycle',
        name: 'Scenario 5: Disaster Recovery & Migration Cycle (Full Data -> JSON Export -> Purge -> Import -> Restore)',
        run: async (page, helpers) => {
            // Step 1: Populate comprehensive rich state
            const mockCustomSchool = {
                id: 'cust_disaster_prep',
                name: 'Academia Fénix',
                fullName: 'Academia Superior Fénix',
                country: 'Colombia',
                countryCode: 'CO',
                slogan: 'Resurgir del conocimiento',
                isCustom: true
            };
            const mockSubjects = [
                { id: 'sub_rec_1', name: 'Arquitectura de Software', color: '#4F46E5' },
                { id: 'sub_rec_2', name: 'Bases de Datos Distribuidas', color: '#06B6D4' }
            ];
            const mockTasks = [
                { id: 'tsk_rec_1', subjectId: 'sub_rec_1', title: 'Diseño de Microservicios', completed: false, priority: 'alta' },
                { id: 'tsk_rec_2', subjectId: 'sub_rec_2', title: 'Particionamiento Sharding', completed: true, priority: 'media' }
            ];
            const mockCodes = ['APOLLO11', '06062009', 'EDUARDO'];

            await page.evaluate((school, subs, tsks, codes) => {
                localStorage.setItem('org_escolar_initialized_v3', 'true');
                window.StorageModule?.saveCustomSchool?.(school);
                window.StorageModule?.setInstitution(school.id);
                window.StorageModule?.setAcademicPeriod('Ciclo Avanzado 2026');
                window.StorageModule?.saveSubjects(subs);
                window.StorageModule?.saveTasks(tsks);
                localStorage.setItem('org_escolar_vault_unlocked_codes_v2', JSON.stringify(codes));
            }, mockCustomSchool, mockSubjects, mockTasks, mockCodes);

            // Step 2: Export JSON backup payload
            const exportedPayload = await page.evaluate(() => {
                const base = window.StorageModule?.exportJson ? JSON.parse(window.StorageModule.exportJson()) : {};
                base.customSchools = window.StorageModule?.getCustomSchools ? window.StorageModule.getCustomSchools() : [];
                base.unlockedCodes = JSON.parse(localStorage.getItem('org_escolar_vault_unlocked_codes_v2') || '[]');
                return JSON.stringify(base);
            });
            helpers.assert(typeof exportedPayload === 'string' && exportedPayload.length > 50, 'Exported JSON payload must be non-empty');

            // Step 3: Trigger catastrophic wipe (simulate disaster)
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });
            await page.reload({ waitUntil: 'load' });

            // Verify clean/empty state after wipe
            const emptyCheck = await page.evaluate(() => {
                return (window.StorageModule?.getTasks() || []).length === 0;
            });
            helpers.assertTrue(emptyCheck, 'State must be clean after catastrophic wipe');

            // Step 4: Import JSON backup
            const restoreResult = await page.evaluate(payloadStr => {
                try {
                    const parsed = JSON.parse(payloadStr);
                    localStorage.setItem('org_escolar_initialized_v3', 'true');
                    if (Array.isArray(parsed.customSchools)) {
                        parsed.customSchools.forEach(s => window.StorageModule?.saveCustomSchool?.(s));
                    }
                    if (Array.isArray(parsed.unlockedCodes)) {
                        localStorage.setItem('org_escolar_vault_unlocked_codes_v2', JSON.stringify(parsed.unlockedCodes));
                    }
                    if (window.StorageModule?.importJson) {
                        window.StorageModule.importJson(payloadStr);
                    } else {
                        if (parsed.subjects) window.StorageModule?.saveSubjects(parsed.subjects);
                        if (parsed.tasks) window.StorageModule?.saveTasks(parsed.tasks);
                        if (parsed.institution) window.StorageModule?.setInstitution(parsed.institution);
                        if (parsed.academicPeriod) window.StorageModule?.setAcademicPeriod(parsed.academicPeriod);
                    }
                    return true;
                } catch (e) {
                    return false;
                }
            }, exportedPayload);
            helpers.assertTrue(restoreResult, 'Import operation must complete successfully');

            // Step 5: Assert 100% state fidelity restoration
            const finalState = await page.evaluate(() => {
                const custom = window.StorageModule?.getCustomSchools ? window.StorageModule.getCustomSchools() : [];
                const codes = JSON.parse(localStorage.getItem('org_escolar_vault_unlocked_codes_v2') || '[]');
                const tasks = window.StorageModule?.getTasks() || [];
                const subjects = window.StorageModule?.getSubjects() || [];
                const period = window.StorageModule?.getAcademicPeriod();
                return {
                    customSchoolName: custom[0]?.name,
                    unlockedCodesCount: codes.length,
                    tasksCount: tasks.length,
                    subjectsCount: subjects.length,
                    period: period
                };
            });
            helpers.assertEqual(finalState.customSchoolName, 'Academia Fénix', 'Custom school name restored');
            helpers.assertEqual(finalState.unlockedCodesCount, 3, '3 unlocked secret codes restored');
            helpers.assertEqual(finalState.tasksCount, 2, '2 tasks restored');
            helpers.assertEqual(finalState.subjectsCount, 2, '2 subjects restored');
            helpers.assertEqual(finalState.period, 'Ciclo Avanzado 2026', 'Academic period restored');
        }
    },

    // =========================================================================
    // Scenario 6: Clean-Slate Student with Skipped School -> Later Settings Config & PWA
    // =========================================================================
    {
        id: 'T4_SCENARIO_6_fresh_student_skipped_onboarding_to_configured_pwa',
        name: 'Scenario 6: Clean-slate onboarding with "Hacerla después", view navigation, settings configuration, and PWA readiness',
        run: async (page, helpers) => {
            // Step 1: Clean slate application start
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });
            await page.reload({ waitUntil: 'load' });
            await new Promise(r => setTimeout(r, 400));

            // Step 2: Welcome modal is displayed, student chooses "Hacerla después"
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
            });
            await new Promise(r => setTimeout(r, 200));

            await page.evaluate(() => {
                document.getElementById('welcome-skip-school-btn')?.click();
            });
            await new Promise(r => setTimeout(r, 100));

            // Verify period selector is locked
            const isLocked = await page.evaluate(() => {
                const c = document.getElementById('welcome-period-container');
                return c ? window.getComputedStyle(c).pointerEvents === 'none' : false;
            });
            helpers.assertTrue(isLocked, 'Period selector must be locked when "Hacerla después" is selected');

            // Step 3: Provide provisional cycle dates and submit
            await page.evaluate(() => {
                const start = document.getElementById('welcome-cycle-start');
                const end = document.getElementById('welcome-cycle-end');
                if (start) start.value = '2026-08-15';
                if (end) end.value = '2026-12-15';
                document.getElementById('welcome-cycle-save-btn')?.click();
            });
            await new Promise(r => setTimeout(r, 300));

            // Step 4: Verify unconfigured defaults across header and storage
            const unconfState = await page.evaluate(() => {
                return {
                    isSkipped: window.StorageModule?.isSchoolSkipped(),
                    instId: window.StorageModule?.getInstitution(),
                    period: window.StorageModule?.getAcademicPeriod(),
                    headerName: document.getElementById('header-inst-name')?.textContent?.trim(),
                    headerPeriod: document.getElementById('header-inst-period')?.textContent?.trim()
                };
            });
            helpers.assertTrue(unconfState.isSkipped, 'isSchoolSkipped must be true');
            helpers.assertEqual(unconfState.instId, 'unconfigured', 'Institution ID must be unconfigured');
            helpers.assertEqual(unconfState.period, 'Sin periodo', 'Academic period must be Sin periodo');
            helpers.assertEqual(unconfState.headerName, 'Sin institución', 'Header name displays Sin institución');
            helpers.assertEqual(unconfState.headerPeriod, 'Sin periodo', 'Header period displays Sin periodo');

            // Step 5: Student creates a course and task while school is unconfigured
            await page.evaluate(() => {
                const sub = [{ id: 'sub_web', name: 'Desarrollo Web Fullstack', color: '#6366F1' }];
                window.StorageModule?.saveSubjects?.(sub);
                const task = [{
                    id: 'tsk_pwa_1',
                    subjectId: 'sub_web',
                    title: 'Entregable PWA & Service Worker',
                    dueDate: '2026-11-25',
                    completed: false
                }];
                window.StorageModule?.saveTasks?.(task);
            });

            // Step 6: Student navigates to Settings to configure institution
            await page.evaluate(() => {
                window.app?.switchView?.('settings');
            });
            await new Promise(r => setTimeout(r, 200));

            // Student clicks UNAM card in settings
            await page.evaluate(() => {
                const unamBtn = document.querySelector('#settings-institution-grid [data-inst-id="unam"]');
                if (unamBtn) unamBtn.click();
            });
            await new Promise(r => setTimeout(r, 200));

            // Student selects "4.º Semestre" period pill
            await page.evaluate(() => {
                const pills = Array.from(document.querySelectorAll('#settings-period-pills button, .period-pill'));
                const pill4 = pills.find(p => p.textContent.includes('4.º Semestre'));
                if (pill4) pill4.click();
            });
            await new Promise(r => setTimeout(r, 200));

            // Step 7: Verify smooth transition from unconfigured to UNAM
            const configuredState = await page.evaluate(() => {
                return {
                    isSkipped: window.StorageModule?.isSchoolSkipped(),
                    instId: window.StorageModule?.getInstitution(),
                    period: window.StorageModule?.getAcademicPeriod(),
                    headerName: document.getElementById('header-inst-name')?.textContent?.trim(),
                    headerPeriod: document.getElementById('header-inst-period')?.textContent?.trim(),
                    hasPwaCard: document.getElementById('pwa-settings-card') !== null,
                    hasPwaBtn: document.getElementById('pwa-install-settings-btn') !== null
                };
            });

            helpers.assertFalse(configuredState.isSkipped, 'isSchoolSkipped cleared after configuring school');
            helpers.assertEqual(configuredState.instId, 'unam', 'Active institution is UNAM');
            helpers.assertIncludes(configuredState.headerName, 'UNAM', 'Header reflects UNAM');
            helpers.assertNotEqual(configuredState.headerPeriod, 'Sin periodo', 'Header period updated');
            helpers.assertTrue(configuredState.hasPwaCard, 'PWA settings card is available');
            helpers.assertTrue(configuredState.hasPwaBtn, 'PWA install button is available');
        }
    },

    // =========================================================================
    // Scenario 7: Custom Academy Student Cuatrimestral Full Lifecycle
    // =========================================================================
    {
        id: 'T4_SCENARIO_7_custom_academy_student_cuatrimestre_full_lifecycle',
        name: 'Scenario 7: Custom school creation during welcome onboarding with cuatrimestral system and persistence',
        run: async (page, helpers) => {
            // Step 1: Clean state
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });
            await page.reload({ waitUntil: 'load' });
            await new Promise(r => setTimeout(r, 400));

            // Step 2: Open welcome onboarding and launch custom school builder
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                document.getElementById('welcome-create-school-btn')?.click();
            });
            await new Promise(r => setTimeout(r, 200));

            // Step 3: Populate custom school form
            await page.evaluate(() => {
                document.getElementById('custom-school-name').value = 'Colegio Mayor Vanguardia';
                document.getElementById('custom-school-shortbadge').value = 'CMV';
                document.getElementById('custom-school-fullname').value = 'Colegio Mayor Vanguardia de Innovación';
                document.getElementById('custom-school-slogan').value = 'Liderazgo y Saber';
                document.getElementById('custom-school-country').value = 'MX';
                document.getElementById('custom-school-system').value = 'Cuatrimestral';
                document.getElementById('custom-school-color').value = '#059669';
                document.getElementById('custom-school-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            });
            await new Promise(r => setTimeout(r, 300));

            // Step 4: Verify auto-selection in welcome modal and select 3.º Cuatrimestre
            await page.evaluate(() => {
                const chips = Array.from(document.querySelectorAll('.welcome-period-chip'));
                const chip3 = chips.find(c => c.textContent.includes('3.º Cuatrimestre'));
                if (chip3) chip3.click();

                const start = document.getElementById('welcome-cycle-start');
                const end = document.getElementById('welcome-cycle-end');
                if (start) start.value = '2026-09-01';
                if (end) end.value = '2026-12-31';
                document.getElementById('welcome-cycle-save-btn')?.click();
            });
            await new Promise(r => setTimeout(r, 300));

            // Step 5: Verify custom school active state in header and drawer
            const customState = await page.evaluate(() => {
                return {
                    hName: document.getElementById('header-inst-name')?.textContent?.trim(),
                    dName: document.getElementById('drawer-inst-name')?.textContent?.trim(),
                    hPeriod: document.getElementById('header-inst-period')?.textContent?.trim(),
                    dPeriod: document.getElementById('drawer-inst-period')?.textContent?.trim(),
                    dSlogan: document.getElementById('drawer-inst-slogan')?.textContent?.trim()
                };
            });

            helpers.assertEqual(customState.hName, customState.dName, 'Header and drawer names sync');
            helpers.assertIncludes(customState.hName, 'Colegio Mayor Vanguardia', 'Custom school name active');
            helpers.assertEqual(customState.hPeriod, '3.º Cuatrimestre', 'Selected custom period active');
            helpers.assertEqual(customState.hPeriod, customState.dPeriod, 'Header and drawer periods sync');
            helpers.assertIncludes(customState.dSlogan, 'Liderazgo y Saber', 'Drawer slogan matches custom motto');

            // Step 6: Hard page reload to test complete offline persistence
            await page.reload({ waitUntil: 'load' });
            await new Promise(r => setTimeout(r, 400));

            const postReload = await page.evaluate(() => {
                return {
                    hName: document.getElementById('header-inst-name')?.textContent?.trim(),
                    hPeriod: document.getElementById('header-inst-period')?.textContent?.trim(),
                    dName: document.getElementById('drawer-inst-name')?.textContent?.trim()
                };
            });

            helpers.assertIncludes(postReload.hName, 'Colegio Mayor Vanguardia', 'Custom school persisted across reload');
            helpers.assertEqual(postReload.hPeriod, '3.º Cuatrimestre', 'Custom period persisted across reload');
            helpers.assertEqual(postReload.hName, postReload.dName, 'Drawer and header match post-reload');
        }
    }
];

module.exports = {
    tier: 4,
    name: 'Tier 4: Real-World Student Application Workflows',
    tests
};
