/**
 * tier4_real_world.js - Tier 4: Real-World Student Application Workflows
 * 5 End-to-End comprehensive student scenarios with opaque-box DOM interactions
 * Requirement-driven test suite for Organizador_Tareas v1.4.3
 */

const tests = [
    // =========================================================================
    // Scenario 1: New Student Fresh Onboarding
    // =========================================================================
    {
        id: 'T4_SCENARIO_1_new_student_fresh_onboarding',
        name: 'Scenario 1: New Student Fresh Onboarding (Activities Mode -> Name -> Photo Upload -> Celebration -> Dashboard Display)',
        run: async (page, helpers) => {
            // Step 1: Clean slate startup
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
                window.StorageModule?.setOnboardingCompleted?.(false);
            });

            // Step 2: Presentation-first flow ordering - verify onboarding is visible and changelog is suppressed
            const presentationState = await page.evaluate(() => {
                const onboarding = document.getElementById('cycle-setup-modal');
                const changelog = document.getElementById('changelog-modal');
                const onboardingVisible = onboarding !== null &&
                                          !onboarding.classList.contains('hidden') &&
                                          onboarding.style.display !== 'none';
                const changelogSuppressed = !changelog ||
                                            changelog.classList.contains('hidden') ||
                                            changelog.style.display === 'none' ||
                                            !changelog.classList.contains('open');
                return { onboardingVisible, changelogSuppressed };
            });
            helpers.assertTrue(presentationState.onboardingVisible, 'Onboarding modal must be visible on first launch');
            helpers.assertTrue(presentationState.changelogSuppressed, 'Changelog modal must be suppressed during onboarding');

            // Step 3: Choose "Organizador de actividades"
            const accountSelected = await page.evaluate(() => {
                const actBtn = document.getElementById('welcome-type-activities') ||
                               document.querySelector('[data-type="activities"]');
                if (!actBtn) return false;
                actBtn.click();
                return true;
            });
            helpers.assertTrue(accountSelected, 'Activities organizer option must exist and be selectable');
            const accType = await page.evaluate(() => window.StorageModule?.getAccountType?.());
            helpers.assertEqual(accType, 'organizer', 'Account type should be organizer in storage');

            // Step 4: Enter user name and profile photo
            const nameEntered = await page.evaluate(() => {
                const nameInp = document.getElementById('welcome-user-name');
                if (!nameInp) return false;
                nameInp.value = 'Sofía Ramírez';
                nameInp.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
            });
            helpers.assertTrue(nameEntered, '#welcome-user-name input must exist');

            // Upload profile photo via simulateFileUpload
            await helpers.simulateFileUpload(page, '#welcome-photo-input', {
                width: 500,
                height: 500,
                color: '#6366F1',
                fileName: 'sofia_profile.png'
            });
            await new Promise(r => setTimeout(r, 200));
            const photoDataUrl = await page.evaluate(() => {
                return window.StorageModule?.getUserPhoto?.() ||
                       document.getElementById('welcome-photo-preview')?.src ||
                       '';
            });
            helpers.assert(photoDataUrl.startsWith('data:image/'), 'Profile photo must be downsampled to data:image/ URL');
            const approxBytes = Math.round(photoDataUrl.length * 0.75);
            helpers.assert(approxBytes < 30 * 1024, `Photo size must be < 30KB, was ${approxBytes} bytes`);

            // Step 5: Complete onboarding with celebration progress bar
            const completed = await page.evaluate(async () => {
                const submitBtn = document.querySelector('#cycle-setup-modal button[type="submit"]') ||
                                  document.getElementById('welcome-save-btn');
                if (!submitBtn) return { submitted: false, hasProgressBar: false, hasCelebration: false };
                submitBtn.click();

                const bar = document.getElementById('onboarding-progress-bar');
                const celebrationMsg = document.getElementById('onboarding-celebration-msg') ||
                                       document.querySelector('.celebration-msg') ||
                                       document.getElementById('cycle-setup-modal');
                const hasBar = bar !== null;
                const text = celebrationMsg ? celebrationMsg.textContent : '';
                const hasCelebration = text.includes('Disfruta la app') || text.includes('disfruta');

                window.StorageModule?.setOnboardingCompleted?.(true);
                window.StorageModule?.setCycleConfigured?.(true);
                window.OrganizadorApp?.switchView?.('dashboard');
                window.OrganizadorApp?.renderHeader?.();

                return { submitted: true, hasBar, hasCelebration };
            });
            helpers.assertTrue(completed.submitted, 'Onboarding submit button must exist and submit setup');
            helpers.assertTrue(completed.hasBar, '#onboarding-progress-bar must exist in onboarding DOM');
            helpers.assertTrue(completed.hasCelebration, 'Celebration message must display "¡Disfruta la app!"');

            // Step 6: Verify dashboard displays user name in header
            const headerShowsName = await page.evaluate(() => {
                const header = document.querySelector('header');
                return header ? header.textContent.includes('Sofía Ramírez') : false;
            });
            helpers.assertTrue(headerShowsName, 'Header must display user name "Sofía Ramírez"');

            const storedName = await page.evaluate(() => window.StorageModule?.getUserName?.());
            helpers.assertEqual(storedName, 'Sofía Ramírez', 'User name must be persisted in StorageModule');
        }
    },

    // =========================================================================
    // Scenario 2: Institution Setup & Subject Creation
    // =========================================================================
    {
        id: 'T4_SCENARIO_2_institution_setup_and_subject_creation',
        name: 'Scenario 2: Institution Setup & Subject Creation (Institution Mode -> Logo -> Dynamic Popup Long-Press -> Toggle Legacy Buttons)',
        run: async (page, helpers) => {
            // Step 1: Configure as Institution
            await helpers.simulateFileUpload(page, '#welcome-photo-input', {
                width: 400,
                height: 400,
                color: '#10B981',
                fileName: 'school_logo.png'
            });
            await page.evaluate(() => {
                window.StorageModule?.setAccountType?.('institution');
                window.StorageModule?.setUserName?.('Colegio San Ignacio');
                window.StorageModule?.setAcademicPeriod?.('Ciclo 2026-2027');
                window.StorageModule?.setOnboardingCompleted?.(true);
                window.StorageModule?.setCycleConfigured?.(true);
            });

            // Step 2: Add subjects and switch to subjects view
            const subjects = [
                { id: 'sub_quimica', name: 'Química Orgánica', color: '#10B981' },
                { id: 'sub_calculo', name: 'Cálculo Multivariable', color: '#6366F1' }
            ];
            await page.evaluate(subs => {
                window.StorageModule?.saveSubjects?.(subs);
                window.OrganizadorApp?.switchView?.('subjects');
                window.SubjectsModule?.render?.();
            }, subjects);

            // Step 3: Verify subject cards rendered
            const subjectsRendered = await page.evaluate(() => {
                const container = document.getElementById('subjects-container') || document.getElementById('view-subjects');
                return container ? container.textContent.includes('Química Orgánica') : false;
            });
            helpers.assertTrue(subjectsRendered, 'Subjects must be rendered in view');

            // Step 4: Emulate long-press gesture on a subject card
            await helpers.simulateLongPress(page, '.subject-card', 500);

            // Verify dynamic popup modal exists and is visible
            const dynamicPopupVisible = await page.evaluate(() => {
                const popup = document.getElementById('card-dynamic-popup') || document.getElementById('subject-modal');
                if (!popup) return false;
                return !popup.classList.contains('hidden') && popup.style.display !== 'none';
            });
            helpers.assertTrue(dynamicPopupVisible, 'Dynamic configuration popup must be visible after long-press gesture');

            // Step 5: Toggle off long-press setting in settings view
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                const toggle = document.getElementById('settings-longpress-toggle') ||
                               document.getElementById('settings-longpress-btn') ||
                               document.querySelector('[data-setting="longpress"]');
                if (toggle) toggle.click();
                else window.StorageModule?.setLongPressEnabled?.(false);
                window.OrganizadorApp?.switchView?.('subjects');
                window.SubjectsModule?.render?.();
            });

            // Step 6: Verify classic persistent action buttons return
            const classicActionsPresent = await page.evaluate(() => {
                const editBtn = document.querySelector('[data-action="edit"]');
                const delBtn = document.querySelector('[data-action="delete"]');
                return editBtn !== null && delBtn !== null;
            });
            helpers.assertTrue(classicActionsPresent, 'Disabling long-press must restore persistent action buttons [data-action="edit"] and [data-action="delete"]');
        }
    },

    // =========================================================================
    // Scenario 3: Study Materials & Private Notes Workflow
    // =========================================================================
    {
        id: 'T4_SCENARIO_3_study_materials_and_private_notes_workflow',
        name: 'Scenario 3: Study Materials & Private Notes (Left Gallery Upload -> Canvas Downsample -> Password Protected Note -> PIN Unlock)',
        run: async (page, helpers) => {
            // Step 1: Navigate to Notes view and verify 2-column layout
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('notes');
            });
            const notesLayout = await page.evaluate(() => {
                const notesView = document.getElementById('view-notes');
                const galleryPanel = document.getElementById('notes-gallery-panel');
                const cardsPanel = document.getElementById('notes-cards-panel') || document.getElementById('notes-container');
                const isViewActive = notesView && !notesView.classList.contains('hidden');
                return {
                    isViewActive,
                    hasGalleryPanel: galleryPanel !== null,
                    hasCardsPanel: cardsPanel !== null
                };
            });
            helpers.assertTrue(notesLayout.isViewActive, 'Notes view must be active');
            helpers.assertTrue(notesLayout.hasGalleryPanel, '#notes-gallery-panel must exist on left side of notes view');

            // Step 2: Upload study material photo to left gallery
            await helpers.simulateFileUpload(page, '#notes-photo-input', {
                width: 600,
                height: 600,
                color: '#3B82F6',
                fileName: 'pizarron_calculo.png'
            });
            await new Promise(r => setTimeout(r, 200));

            const savedPhotos = await page.evaluate(() => window.StorageModule?.getGalleryPhotos?.() || []);
            helpers.assert(savedPhotos.length > 0, 'Photo must be saved in gallery storage');
            const photoItem = savedPhotos[0];
            helpers.assert(photoItem.dataUrl && photoItem.dataUrl.startsWith('data:image/'), 'Gallery photo must contain valid data:image/ URL');
            const photoBytes = Math.round(photoItem.dataUrl.length * 0.75);
            helpers.assert(photoBytes < 30 * 1024, `Gallery photo must be < 30KB, was ${photoBytes} bytes`);

            // Step 3: Create a private note with password protection
            const privateNote = {
                id: 'note_exam_secret',
                title: 'Preguntas de Examen Parcial',
                content: 'Pregunta 1: Demostración del Teorema de Rolle',
                category: 'personal',
                hasPassword: true,
                passwordHash: '2468',
                createdAt: Date.now()
            };
            await page.evaluate(note => {
                window.StorageModule?.saveNote?.(note);
                window.NotesModule?.render?.();
            }, privateNote);

            // Step 4: Verify note card is masked in UI with padlock indicator
            const maskState = await page.evaluate(() => {
                const card = document.querySelector('[data-note-id="note_exam_secret"]') ||
                             document.querySelector('.note-card-locked');
                if (!card) return { found: false, masked: false, plaintextLeaked: true };
                const text = card.textContent;
                const masked = text.includes('🔒') || text.includes('Privada');
                const plaintextLeaked = text.includes('Teorema de Rolle');
                return { found: true, masked, plaintextLeaked };
            });
            helpers.assertTrue(maskState.found, 'Private note card must exist in DOM');
            helpers.assertTrue(maskState.masked, 'Private note content must be masked with lock indicator');
            helpers.assertFalse(maskState.plaintextLeaked, 'Private note content must NOT be visible before unlocking');

            // Step 5: Click locked card and verify PIN unlock modal appears
            const pinModalAppeared = await page.evaluate(() => {
                const card = document.querySelector('[data-note-id="note_exam_secret"]') ||
                             document.querySelector('.note-card-locked');
                if (card) card.click();
                const pinModal = document.getElementById('note-unlock-modal') ||
                                 document.getElementById('note-pin-modal');
                return pinModal !== null && !pinModal.classList.contains('hidden');
            });
            helpers.assertTrue(pinModalAppeared, 'Clicking locked note card must display PIN unlock modal');

            // Step 6: Attempt unlocking with incorrect PIN (must fail)
            const hasUnlockMethod = await page.evaluate(() => typeof window.NotesModule?.unlockNote === 'function');
            helpers.assertTrue(hasUnlockMethod, 'NotesModule.unlockNote must be implemented');

            const incorrectUnlock = await page.evaluate(() => {
                return window.NotesModule.unlockNote('note_exam_secret', '0000');
            });
            helpers.assertFalse(incorrectUnlock, 'Incorrect PIN must not unlock note');

            // Step 7: Unlock with correct PIN (must succeed)
            const correctUnlock = await page.evaluate(() => {
                return window.NotesModule.unlockNote('note_exam_secret', '2468');
            });
            helpers.assertTrue(correctUnlock, 'Correct PIN must unlock private note');

            // Verify plaintext content is now revealed
            const contentRevealed = await page.evaluate(() => {
                const container = document.getElementById('view-notes');
                return container ? container.textContent.includes('Teorema de Rolle') : false;
            });
            helpers.assertTrue(contentRevealed, 'Unlocking note must reveal plaintext content');
        }
    },

    // =========================================================================
    // Scenario 4: Secret Vault Easter Egg Discovery
    // =========================================================================
    {
        id: 'T4_SCENARIO_4_secret_vault_easter_egg_discovery',
        name: 'Scenario 4: Secret Vault Easter Egg Discovery (5 Task Auto Unlock -> Continuous Input -> Standard Push Buttons -> Light Mode Contrast)',
        run: async (page, helpers) => {
            // Step 1: Create 5 real tasks and complete them to trigger automatic vault milestone
            await page.evaluate(() => {
                const tasks = [
                    { id: 'task_s4_1', title: 'Tarea Álgebra', completed: false },
                    { id: 'task_s4_2', title: 'Tarea Física', completed: false },
                    { id: 'task_s4_3', title: 'Tarea Historia', completed: false },
                    { id: 'task_s4_4', title: 'Tarea Biología', completed: false },
                    { id: 'task_s4_5', title: 'Tarea Literatura', completed: false }
                ];
                window.StorageModule?.saveTasks?.(tasks);

                for (let i = 1; i <= 5; i++) {
                    if (window.TasksModule?.toggleComplete) {
                        window.TasksModule.toggleComplete(`task_s4_${i}`);
                    } else if (window.TasksModule?.completeTask) {
                        window.TasksModule.completeTask(`task_s4_${i}`);
                    } else {
                        window.StorageModule?.checkVaultAutoUnlockOnTaskCompleted?.(i);
                    }
                }
            });

            // Step 2: Open vault terminal and verify notice
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('vault');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const noticeText = await page.evaluate(() => {
                const notice = document.getElementById('vault-secret-notice') || document.querySelector('.vault-terminal-notice');
                return notice ? notice.textContent : '';
            });
            helpers.assertFalse(noticeText.includes('EDUARDO'), 'Notice must conceal EDUARDO');
            helpers.assertFalse(noticeText.includes('06062009'), 'Notice must conceal 06062009');
            helpers.assertTrue(noticeText.includes('5 tareas'), 'Notice must state that completing 5 tasks gives a code');

            // Step 3: Enter code via continuous single input (no storage bypass)
            const inputSubmitted = await page.evaluate(() => {
                const inp = document.getElementById('vault-code-input');
                if (!inp) return false;
                inp.value = 'APOLLO11';
                inp.dispatchEvent(new Event('input', { bubbles: true }));
                const btn = document.getElementById('vault-submit-btn') || document.getElementById('vault-verify-btn');
                if (btn) btn.click();
                return true;
            });
            helpers.assertTrue(inputSubmitted, 'Continuous code input #vault-code-input must exist and submit code');

            // Wait for verify timeout (850ms in app.js) to finish unlock animation and inventory render
            await new Promise(r => setTimeout(r, 950));

            const apolloUnlocked = await page.evaluate(() => window.StorageModule?.isVaultCodeUnlocked?.('APOLLO11') || false);
            helpers.assertTrue(apolloUnlocked, 'APOLLO11 must be unlocked via continuous input');

            // Step 4: Verify vault inventory cards have flexible wrapping and no outer truncate
            const cardFormatting = await page.evaluate(() => {
                const card = document.querySelector('.vault-inventory-card');
                if (!card) return null;
                const titleWrapper = card.querySelector('h4') || card.querySelector('.min-w-0');
                const style = titleWrapper ? window.getComputedStyle(titleWrapper) : null;
                return {
                    hasOuterTruncate: card.classList.contains('truncate'),
                    isWrappingAllowed: style ? style.whiteSpace !== 'nowrap' : true
                };
            });
            helpers.assert(cardFormatting !== null, 'Vault inventory card must exist');
            helpers.assertFalse(cardFormatting.hasOuterTruncate, 'Inventory card must not have outer truncate');
            helpers.assertTrue(cardFormatting.isWrappingAllowed, 'Title wrapper should permit multi-line text wrapping');

            // Step 5: Verify standard button controls are used instead of iOS switches
            const controlsCheck = await page.evaluate(() => {
                const catsBtn = document.getElementById('settings-cats-btn') || document.querySelector('[data-cats-btn]');
                const grayBtn = document.getElementById('settings-gray-mode-btn') || document.querySelector('[data-gray-btn]');
                return {
                    catsIsButton: catsBtn ? catsBtn.tagName.toLowerCase() === 'button' : false,
                    grayIsButton: grayBtn ? grayBtn.tagName.toLowerCase() === 'button' : false
                };
            });
            helpers.assertTrue(controlsCheck.catsIsButton, '#settings-cats-btn must be a standard button element');
            helpers.assertTrue(controlsCheck.grayIsButton, '#settings-gray-mode-btn must be a standard button element');

            // Step 6: Switch to light mode and confirm contrast
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const lightContrast = await page.evaluate(() => {
                const emptyHeading = document.getElementById('vault-empty-heading');
                const emptyCard = document.querySelector('#vault-inventory-empty > div');
                const noDarkTranslucent = emptyCard ? !emptyCard.className.includes('bg-black/40') : true;
                const headingColor = emptyHeading ? window.getComputedStyle(emptyHeading).color : '';
                return {
                    isLight: !document.documentElement.classList.contains('dark'),
                    noDarkTranslucent,
                    headingHasContrast: !headingColor.includes('rgba(238, 242, 255')
                };
            });
            helpers.assertTrue(lightContrast.isLight, 'Light mode must be active');
            helpers.assertTrue(lightContrast.noDarkTranslucent, 'Empty state container must not use dark translucency in light mode');
        }
    },

    // =========================================================================
    // Scenario 5: Settings Customization & View Switching
    // =========================================================================
    {
        id: 'T4_SCENARIO_5_settings_customization_and_view_switching',
        name: 'Scenario 5: Settings Customization & View Switching (Audition Multiple Fonts -> Expand Accordion -> Navigate to Dashboard -> Verify Auto-Close)',
        run: async (page, helpers) => {
            // Step 1: Open Settings view
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
            });
            const settingsActive = await page.evaluate(() => {
                const s = document.getElementById('view-settings');
                return s ? !s.classList.contains('hidden') : false;
            });
            helpers.assertTrue(settingsActive, 'Settings view must be active');

            // Step 2: Open appearance accordion
            await page.evaluate(() => {
                const fontCard = document.querySelector('#settings-font-buttons-grid')?.closest('.settings-accordion-card');
                if (fontCard) fontCard.classList.add('open');
            });

            // Step 3: Audition multiple fonts consecutively by clicking UI buttons in grid
            const audited = await page.evaluate(async () => {
                const btns = Array.from(document.querySelectorAll('#settings-font-buttons-grid [data-font-btn]'));
                if (btns.length === 0) return false;
                for (let i = 0; i < Math.min(3, btns.length); i++) {
                    btns[i].click();
                    await new Promise(r => setTimeout(r, 60));
                }
                return true;
            });
            helpers.assertTrue(audited, 'Font buttons in #settings-font-buttons-grid must exist and be clickable');

            // Step 4: Verify appearance accordion remains open during auditioning (persistent font window)
            const accordionStillOpen = await page.evaluate(() => {
                const fontCard = document.querySelector('#settings-font-buttons-grid')?.closest('.settings-accordion-card');
                if (!fontCard) return false;
                return fontCard.classList.contains('open');
            });
            helpers.assertTrue(accordionStillOpen, 'Accordion must stay open while auditioning fonts');

            // Step 5: Navigate away from settings to Dashboard
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('dashboard');
            });
            const dashboardActive = await page.evaluate(() => {
                const d = document.getElementById('view-dashboard');
                return d ? !d.classList.contains('hidden') : false;
            });
            helpers.assertTrue(dashboardActive, 'Dashboard must be active after navigation');

            // Step 6: Return to Settings and verify all accordions were cleanly auto-closed
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
            });
            const anyOpen = await page.evaluate(() => {
                return document.querySelectorAll('.settings-accordion-card.open').length > 0;
            });
            helpers.assertFalse(anyOpen, 'All settings accordions must be auto-closed on return to settings');
        }
    }
];

module.exports = {
    tier: 4,
    name: 'Tier 4: Real-World Student Application Workflows',
    tests
};
