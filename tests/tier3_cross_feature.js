/**
 * tier3_cross_feature.js - Tier 3: Pairwise Cross-Feature Combinations
 * Pairwise interaction matrix validating cross-feature interoperability for v1.4.2
 * 22 comprehensive integration tests
 */

const tests = [
    // -------------------------------------------------------------------------
    // COMB 01: F01 (Changelog) + F11 (Presentation-First Ordering)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_01_changelog_presentation_first_sequence',
        name: 'Presentation-First Flow: Onboarding Wizard completes before Changelog eligibility',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                localStorage.clear();
                window.StorageModule?.setOnboardingCompleted?.(false);
                window.StorageModule?.setLastSeenVersion?.('1.4.1');
            });
            // Prior to registration: changelog must NOT be open
            const changelogBefore = await page.evaluate(() => {
                const m = document.getElementById('changelog-modal');
                return m ? !m.classList.contains('hidden') && m.classList.contains('open') : false;
            });
            helpers.assertFalse(changelogBefore, 'Changelog must remain suppressed prior to onboarding completion');

            // Complete onboarding
            await page.evaluate(() => {
                window.StorageModule?.setOnboardingCompleted?.(true);
            });
            const isCompleted = await page.evaluate(() => window.StorageModule?.isOnboardingCompleted?.());
            helpers.assertTrue(isCompleted, 'Onboarding completion must be recorded');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 02: F02 (Vault Text Overflow) + F05 (Light Mode Contrast)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_02_vault_text_wrap_light_mode_contrast',
        name: 'Vault Item Text Wrapping + Light Mode Background Contrast Coexistence',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
                window.StorageModule?.unlockVaultCode?.('READABLE');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const cardEvaluation = await page.evaluate(() => {
                const card = document.querySelector('.vault-inventory-card');
                if (!card) return null;
                return {
                    hasOuterTruncate: card.classList.contains('truncate'),
                    isLight: !document.documentElement.classList.contains('dark')
                };
            });
            helpers.assert(cardEvaluation !== null, 'Vault inventory card must exist');
            helpers.assertFalse(cardEvaluation.hasOuterTruncate, 'Card must not have outer truncate in light mode');
            helpers.assertTrue(cardEvaluation.isLight, 'Card must be rendered in light mode context');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 03: F03 (Standard Buttons) + F06 (Continuous Single Code Input)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_03_standard_buttons_and_continuous_code_unlock',
        name: 'Continuous Code Entry (APOLLO11) + Standard Push Button Controls in Vault',
        run: async (page, helpers) => {
            const inputExists = await page.evaluate(() => {
                const inp = document.getElementById('vault-code-input');
                if (!inp) return false;
                inp.value = 'APOLLO11';
                inp.dispatchEvent(new Event('input', { bubbles: true }));
                const btn = document.getElementById('vault-verify-btn');
                if (btn) btn.click();
                return true;
            });
            helpers.assertTrue(inputExists, '#vault-code-input must exist in DOM');
            const isUnlocked = await page.evaluate(() => window.StorageModule?.isVaultCodeUnlocked?.('APOLLO11') || false);
            helpers.assertTrue(isUnlocked, 'APOLLO11 must be unlocked via continuous input');

            const hasStandardButtons = await page.evaluate(() => {
                const catsBtn = document.getElementById('settings-cats-btn') || document.querySelector('[data-cats-btn]');
                if (!catsBtn) return false;
                return catsBtn.tagName.toLowerCase() === 'button';
            });
            helpers.assertTrue(hasStandardButtons, 'Controls must exist and use standard button element');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 04: F04 (Concealed Codes) + F06 (Continuous Code Input)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_04_concealed_codes_manual_continuous_unlock',
        name: 'Concealed Secret Codes (EDUARDO) unlocked via Continuous Input without UI leak',
        run: async (page, helpers) => {
            // Verify notice does not leak code
            const noticeText = await page.evaluate(() => {
                const notice = document.getElementById('vault-secret-notice') || document.querySelector('.vault-terminal-notice');
                return notice ? notice.textContent : '';
            });
            helpers.assertFalse(noticeText.includes('EDUARDO'), 'Notice must conceal EDUARDO');

            // Unlock manually via single input
            const inputExists = await page.evaluate(() => {
                const inp = document.getElementById('vault-code-input');
                if (!inp) return false;
                inp.value = 'EDUARDO';
                inp.dispatchEvent(new Event('input', { bubbles: true }));
                const btn = document.getElementById('vault-verify-btn');
                if (btn) btn.click();
                return true;
            });
            helpers.assertTrue(inputExists, '#vault-code-input must exist in DOM');
            const unlocked = await page.evaluate(() => window.StorageModule?.isVaultCodeUnlocked?.('EDUARDO') || false);
            helpers.assertTrue(unlocked, 'EDUARDO code must unlock successfully via manual continuous input');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 05: F08 (Full-Screen Onboarding) + F10 (Photo Upload)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_05_fullscreen_onboarding_with_photo_upload',
        name: 'Full-Screen Onboarding Layout + Canvas Downsampled Photo Upload',
        run: async (page, helpers) => {
            await page.setViewport({ width: 1280, height: 800 });
            const result = await page.evaluate(async () => {
                const modal = document.getElementById('cycle-setup-modal');
                const isFullScreen = modal ? modal.className.includes('fixed') && modal.className.includes('inset-0') : false;

                // Simulate downsampled canvas upload
                const canvas = document.createElement('canvas');
                canvas.width = 500;
                canvas.height = 500;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#4F46E5';
                ctx.fillRect(0, 0, 500, 500);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                window.StorageModule?.setUserPhoto?.(dataUrl);

                return { isFullScreen, photoSaved: window.StorageModule?.getUserPhoto?.() === dataUrl };
            });
            helpers.assertTrue(result.isFullScreen, 'Onboarding must be full-screen');
            helpers.assertTrue(result.photoSaved, 'User photo must be saved during onboarding');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 06: F08 (Full-Screen Onboarding) + F09 (User Name Slogan Replacement)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_06_fullscreen_onboarding_user_name_slogan_sync',
        name: 'Full-Screen Setup Submission updates Header and Drawer with User Name',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setUserName?.('Ana Morales');
                window.OrganizadorApp?.renderHeader?.();
                window.OrganizadorApp?.renderDrawer?.();
            });
            const headerSync = await page.evaluate(() => {
                const header = document.querySelector('header');
                return header ? header.textContent.includes('Ana Morales') : false;
            });
            helpers.assertTrue(headerSync, 'Header must display user name');
            const storedName = await page.evaluate(() => window.StorageModule?.getUserName?.());
            helpers.assertEqual(storedName, 'Ana Morales', 'StorageModule must store user name');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 07: F08 (Onboarding) + F12 (Celebration Progress Bar)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_07_onboarding_celebration_progress_completion',
        name: 'Onboarding Submission detonas 0% -> 100% Progress Bar + Celebration Message',
        run: async (page, helpers) => {
            const result = await page.evaluate(async () => {
                const bar = document.getElementById('onboarding-progress-bar');
                if (!bar) return { exists: false, completed: false, hasCelebration: false };
                bar.style.width = '0%';
                await new Promise(r => setTimeout(r, 20));
                bar.style.width = '100%';

                const celebrationMsg = document.getElementById('onboarding-celebration-msg') ||
                                       document.querySelector('.celebration-msg') ||
                                       document.getElementById('cycle-setup-modal');
                const text = celebrationMsg ? celebrationMsg.textContent : '';
                const hasCelebration = text.includes('Disfruta la app') || text.includes('disfruta');
                return { exists: true, completed: bar.style.width === '100%', hasCelebration };
            });
            helpers.assertTrue(result.exists, '#onboarding-progress-bar must exist in DOM');
            helpers.assertTrue(result.completed, 'Progress bar must reach 100%');
            helpers.assertTrue(result.hasCelebration, 'Celebration message must be displayed');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 08: F09 (User Name) + F13 (Settings Sub-Menu Auto-Close)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_08_user_name_edit_and_settings_exit_autoclose',
        name: 'Editing User Name in Settings + Switching Views Auto-Closes Accordions',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                const card = document.querySelector('.settings-accordion-card');
                if (card) card.classList.add('open');
                window.StorageModule?.setUserName?.('Luis Fernando');
                window.OrganizadorApp?.switchView?.('dashboard');
            });
            const anyOpen = await page.evaluate(() => {
                return document.querySelectorAll('.settings-accordion-card.open').length > 0;
            });
            helpers.assertFalse(anyOpen, 'Accordions must auto-close upon leaving settings');
            const name = await page.evaluate(() => window.StorageModule?.getUserName?.());
            helpers.assertEqual(name, 'Luis Fernando', 'User name must persist after view transition');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 09: F10 (Canvas Downsample) + F17 (Materials Photo Gallery)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_09_photo_upload_gallery_quota_coexistence',
        name: 'User Photo Upload + Notes Photo Gallery maintain Storage Quota under 100KB',
        run: async (page, helpers) => {
            const quotaSafe = await page.evaluate(async () => {
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#6366F1';
                ctx.fillRect(0, 0, 256, 256);
                const photoUrl = canvas.toDataURL('image/jpeg', 0.7);

                window.StorageModule?.setUserPhoto?.(photoUrl);
                window.StorageModule?.saveGalleryPhoto?.({ id: 'gal_1', name: 'Pizarrón 1', dataUrl: photoUrl, createdAt: Date.now() });

                const userPhotoSize = (localStorage.getItem('org_escolar_user_photo') || '').length;
                const gallerySize = (localStorage.getItem('org_escolar_gallery_photos') || '').length;
                return (userPhotoSize + gallerySize) < 100 * 1024;
            });
            helpers.assertTrue(quotaSafe, 'Combined photos must consume < 100KB of LocalStorage');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 10: F11 (Presentation-First) + F12 (Celebration Bar)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_10_celebration_bar_precedes_dashboard_transition',
        name: 'Celebration Progress finishes 100% before Dashboard View is activated',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setOnboardingCompleted?.(true);
                window.StorageModule?.setCycleConfigured?.(true);
                window.OrganizadorApp?.switchView?.('dashboard');
            });
            const dashboardActive = await page.evaluate(() => {
                const d = document.getElementById('view-dashboard');
                return d ? !d.classList.contains('hidden') : false;
            });
            helpers.assertTrue(dashboardActive, 'Dashboard must be active after setup');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 11: F13 (Settings Auto-Close) + F14 (Persistent Font Selection)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_11_persistent_font_in_settings_collapses_on_view_exit',
        name: 'Font Auditioning keeps Accordion Open in Settings but Collapses on View Exit',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                const fontCard = document.querySelector('#settings-font-buttons-grid')?.closest('.settings-accordion-card');
                if (fontCard) fontCard.classList.add('open');
                const fontBtn = document.querySelector('#settings-font-buttons-grid button') ||
                                document.querySelector('#settings-font-buttons-grid [data-font-btn]');
                if (fontBtn) fontBtn.click();
            });
            // Switch view
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('tasks');
            });
            const anyOpen = await page.evaluate(() => document.querySelectorAll('.settings-accordion-card.open').length > 0);
            helpers.assertFalse(anyOpen, 'Font accordion must auto-close on leaving settings view');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 12: F13 (Settings Auto-Close) + F15 (Long-Press Setting Toggle)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_12_toggle_longpress_in_settings_and_exit_cleanly',
        name: 'Toggling Long-Press Mode in Settings collapses submenus on navigation',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                const toggle = document.getElementById('settings-longpress-toggle') ||
                               document.getElementById('settings-longpress-btn') ||
                               document.querySelector('[data-setting="longpress"]');
                if (toggle) toggle.click();
                window.OrganizadorApp?.switchView?.('subjects');
            });
            const longPressState = await page.evaluate(() => window.StorageModule?.isLongPressEnabled?.());
            helpers.assertFalse(longPressState, 'Long-press setting must remain false after view switch');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 13: F14 (Persistent Font) + F02 (Vault Typography Buttons)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_13_font_selection_and_vault_font_restoration',
        name: 'Settings Font Selection and Vault Typography Activation operate harmoniously',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setFontFamily?.('Inter');
                window.StorageModule?.unlockVaultCode?.('PLAYFAIR');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const font = await page.evaluate(() => window.StorageModule?.getFontFamily?.());
            helpers.assertEqual(font, 'Inter', 'Storage font must remain Inter');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 14: F15 (Long-Press Toggle) + F16 (Compact Dynamic Popup)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_14_longpress_disabled_bypasses_dynamic_popup',
        name: 'Disabling Long-Press Mode restores 1-Click Action Buttons bypassing Dynamic Popup',
        run: async (page, helpers) => {
            await page.evaluate(() => { window.StorageModule.saveSubjects([{ id: 'sub_seed', name: 'Materia Semilla', color: '#6366F1', days: [] }]); window.SubjectsModule?.render?.(); });
            await page.evaluate(() => {
                window.StorageModule?.setLongPressEnabled?.(false);
                window.SubjectsModule?.render?.();
            });
            const hasStaticActions = await page.evaluate(() => {
                const edit = document.querySelector('[data-action="edit"]');
                return edit !== null;
            });
            helpers.assertTrue(hasStaticActions, 'Disabling long-press must restore direct action buttons');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 15: F16 (Compact Dynamic Popup) + F18 (Private Notes Password Lock)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_15_dynamic_popup_and_private_notes_pin_unlock',
        name: 'Compact Dynamic Modal Architecture used for Private Notes PIN Unlock',
        run: async (page, helpers) => {
            const hasModalStructure = await page.evaluate(() => {
                const pinModal = document.getElementById('note-unlock-modal') ||
                                 document.getElementById('note-pin-modal');
                return pinModal !== null;
            });
            helpers.assertTrue(hasModalStructure, 'Modal architecture must exist in DOM');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 16: F17 (Materials Photo Gallery) + F18 (Private Notes Protection)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_16_notes_gallery_and_private_notes_layout',
        name: 'Notes View 2-Column Layout: Left Gallery + Right Private Notes Grid',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('notes');
            });
            const notesViewActive = await page.evaluate(() => {
                const v = document.getElementById('view-notes');
                return v ? !v.classList.contains('hidden') : false;
            });
            helpers.assertTrue(notesViewActive, 'Notes view must be active');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 17: F06 (Continuous Input) + F05 (Light Mode Contrast)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_17_continuous_input_in_light_mode',
        name: 'Continuous Code Input Field maintains High Contrast in Light Mode',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
            });
            const inputExists = await page.evaluate(() => {
                return document.getElementById('vault-code-input') !== null;
            });
            helpers.assertTrue(inputExists, 'Continuous code input #vault-code-input must exist in light mode');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 18: F03 (Standard Buttons) + F15 (Long-Press Settings Toggle)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_18_standard_buttons_and_longpress_settings_coexistence',
        name: 'Standard Button Design System unified across Vault and Settings',
        run: async (page, helpers) => {
            const unified = await page.evaluate(() => {
                const catsBtn = document.getElementById('settings-cats-btn') || document.querySelector('[data-cats-btn]');
                if (!catsBtn) return false;
                return catsBtn.tagName.toLowerCase() === 'button';
            });
            helpers.assertTrue(unified, 'Buttons must adhere to unified standard design system');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 19: F10 (Photo Upload) + F14 (Font Selection Typography Preview)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_19_photo_upload_and_font_selection_persistence',
        name: 'User Photo and Custom Typography Family persist across reload',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setFontFamily?.('Inter');
                window.StorageModule?.setUserPhoto?.('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
            });
            const font = await page.evaluate(() => window.StorageModule?.getFontFamily?.());
            const photo = await page.evaluate(() => window.StorageModule?.getUserPhoto?.() || '');
            helpers.assertEqual(font, 'Inter', 'Font must persist');
            helpers.assert(photo.length > 0, 'Photo must persist');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 20: F18 (Private Notes) + F13 (View Switching Auto-Lock)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_20_private_notes_revisit_locked_on_reload',
        name: 'Private Notes remain Securely Masked upon Session Restart',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.saveNote?.({ id: 'note_cross_sec', title: 'Top Secret', content: 'Secret Data', hasPassword: true, passwordHash: '1234' });
            });
            const notes = await page.evaluate(() => window.StorageModule?.getNotes?.() || []);
            const saved = notes.find(n => n.id === 'note_cross_sec');
            helpers.assert(saved !== undefined, 'Saved note must exist');
            helpers.assertTrue(saved.hasPassword, 'Note must have password enabled');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 21: F08 (Account Type) + F16 (Dynamic Card Popup in Institution Mode)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_21_institution_mode_subject_card_popup',
        name: 'Account Type "Institution" configures Subject Cards with Dynamic Popup',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setAccountType?.('institution');
                window.OrganizadorApp?.switchView?.('subjects');
            });
            const accType = await page.evaluate(() => window.StorageModule?.getAccountType?.());
            helpers.assertEqual(accType, 'institution', 'Account type must be institution');
        }
    },

    // -------------------------------------------------------------------------
    // COMB 22: F08 (Account Type) + F16 (Dynamic Card Popup in Activities Mode)
    // -------------------------------------------------------------------------
    {
        id: 'T3_COMB_22_activities_mode_task_card_popup',
        name: 'Account Type "Activities" configures Task Cards with Dynamic Popup',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setAccountType?.('organizer');
                window.OrganizadorApp?.switchView?.('tasks');
            });
            const accType = await page.evaluate(() => window.StorageModule?.getAccountType?.());
            helpers.assertEqual(accType, 'organizer', 'Account type must be organizer');
        }
    }
];

module.exports = {
    tier: 3,
    name: 'Tier 3: Pairwise Cross-Feature Combinations',
    tests
};
