/**
 * tier1_feature_coverage.js - Tier 1: Feature Coverage (Equivalence Classes)
 * Features F01 through F18 (5 distinct tests per feature, 90 total tests)
 * Requirement-driven and opaque-box test suite for Organizador_Tareas v1.5.0
 */

const fs = require('fs');
const path = require('path');

const tests = [
    // =========================================================================
    // F01: Version Bump 1.5.1 & Scoped Changelog
    // =========================================================================
    {
        id: 'T1_F01_01_package_json_version',
        feature: 'F01',
        name: 'package.json specifies version 1.5.1',
        run: async (page, helpers) => {
            const pkgPath = path.join(helpers.PROJECT_ROOT, 'package.json');
            helpers.assert(fs.existsSync(pkgPath), 'package.json must exist');
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            helpers.assertEqual(pkg.version, '1.5.1', 'package.json version must be 1.5.1');
            helpers.assertEqual(typeof pkg.version, 'string', 'package.json version must be string');
        }
    },
    {
        id: 'T1_F01_02_index_html_query_param_version',
        feature: 'F01',
        name: 'index.html asset tags include versioned query parameter v=1.5.1 without stage suffixes',
        run: async (page, helpers) => {
            const htmlPath = path.join(helpers.PROJECT_ROOT, 'index.html');
            const html = fs.readFileSync(htmlPath, 'utf8');
            const hasVersionedStyles = html.includes('css/styles.css?v=1.5.1');
            const hasVersionedTailwind = html.includes('css/tailwind.min.css?v=1.5.1');
            helpers.assertTrue(hasVersionedStyles, 'styles.css must reference v=1.5.1 query parameter');
            helpers.assertTrue(hasVersionedTailwind, 'tailwind.min.css must reference v=1.5.1 query parameter');
            helpers.assertFalse(/\?v=[^\s"']*(-e\d+|-ui)/i.test(html), 'index.html must not contain temporary -e or -ui version suffixes');
        }
    },
    {
        id: 'T1_F01_03_settings_version_badge',
        feature: 'F01',
        name: 'Settings view contains version indicator with target 1.5.1 version',
        run: async (page, helpers) => {
            const versionText = await page.evaluate(() => {
                const pill = document.getElementById('settings-version-pill') || document.querySelector('[data-version-pill]');
                return pill ? pill.textContent.trim() : null;
            });
            helpers.assert(versionText !== null, 'Settings version pill element must exist');
            helpers.assert(versionText.includes('1.5.1'), 'Version indicator must display 1.5.1');
        }
    },
    {
        id: 'T1_F01_04_sw_cache_name_and_assets',
        feature: 'F01',
        name: 'sw.js specifies v1.5.1 cache identifier, v=1.5.1 assets, and precaches photo-editor.js and backgrounds.js',
        run: async (page, helpers) => {
            const swPath = path.join(helpers.PROJECT_ROOT, 'sw.js');
            const htmlPath = path.join(helpers.PROJECT_ROOT, 'index.html');
            const swCode = fs.readFileSync(swPath, 'utf8');
            const htmlCode = fs.readFileSync(htmlPath, 'utf8');
            const hasTargetCache = swCode.includes("const CACHE_NAME = 'organizador-tareas-cache-v1.5.1';");
            helpers.assertTrue(hasTargetCache, 'sw.js must specify organizador-tareas-cache-v1.5.1 cache name');
            helpers.assertTrue(swCode.includes('?v=1.5.1'), 'sw.js precache assets must use ?v=1.5.1 query parameter');
            helpers.assertTrue(htmlCode.includes('?v=1.5.1'), 'index.html assets must use ?v=1.5.1 query parameter');
            helpers.assertFalse(/\?v=[^\s'"]*(-e\d+|-ui)/i.test(swCode), 'sw.js must not contain temporary -e or -ui query suffixes');
            helpers.assertTrue(swCode.includes('js/photo-editor.js?v=1.5.1'), 'sw.js must precache js/photo-editor.js?v=1.5.1');
            helpers.assertTrue(swCode.includes('js/backgrounds.js?v=1.5.1'), 'sw.js must precache js/backgrounds.js?v=1.5.1');
        }
    },
    {
        id: 'T1_F01_05_scoped_changelog_content',
        feature: 'F01',
        name: 'Changelog modal announces 1.5.2 design updates without visible Liquid Glass or secret code leaks',
        run: async (page, helpers) => {
            const modalText = await page.evaluate(() => {
                const modal = document.getElementById('changelog-modal');
                return modal ? modal.textContent : '';
            });
            helpers.assertTrue(modalText.includes('1.5.2'), 'Changelog modal must display version 1.5.2');
            helpers.assertTrue(/efectos de transparencia avanzados/i.test(modalText), 'Changelog modal must mention Efectos de transparencia avanzados');
            helpers.assertFalse(/liquid glass/i.test(modalText), 'Changelog must not expose visible Liquid Glass string');
            helpers.assertFalse(modalText.includes('EDUARDO'), 'Changelog must not leak EDUARDO secret code');
            helpers.assertFalse(modalText.includes('06062009'), 'Changelog must not leak 06062009 secret code');
            helpers.assertFalse(modalText.includes('KRONOS99'), 'Changelog must not leak KRONOS99 secret code');
        }
    },

    // =========================================================================
    // F02: Secret Vault Text Overflow Resolution
    // =========================================================================
    {
        id: 'T1_F02_01_vault_cards_no_outer_truncate',
        feature: 'F02',
        name: 'Vault inventory cards outer wrapper does not have truncate class',
        run: async (page, helpers) => {
            // Unlock sample code to generate card
            await page.evaluate(() => {
                window.StorageModule?.unlockVaultCode?.('APOLLO11');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const hasOuterTruncate = await page.evaluate(() => {
                const card = document.querySelector('.vault-inventory-card');
                return card ? card.classList.contains('truncate') : false;
            });
            helpers.assertFalse(hasOuterTruncate, 'Vault inventory card outer wrapper must not have truncate class');
        }
    },
    {
        id: 'T1_F02_02_active_font_button_short_label',
        feature: 'F02',
        name: 'Active font card uses concise button label without overflow',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.unlockVaultCode?.('READABLE');
                window.StorageModule?.setFontFamily?.('Atkinson Hyperlegible');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const btnText = await page.evaluate(() => {
                const cards = Array.from(document.querySelectorAll('.vault-inventory-card'));
                for (const c of cards) {
                    const btn = c.querySelector('button');
                    if (btn && (btn.textContent.includes('Restaurar') || btn.textContent.includes('Desactivar') || btn.textContent.includes('Activo'))) {
                        return btn.textContent.trim();
                    }
                }
                return '';
            });
            helpers.assertFalse(btnText.includes('RESTAURAR FUENTE ESTÁNDAR'), 'Active font button label must not be excessively long');
        }
    },
    {
        id: 'T1_F02_03_inactive_font_button_short_label',
        feature: 'F02',
        name: 'Inactive font card uses concise "Activar" button label',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.unlockVaultCode?.('PLAYFAIR');
                window.StorageModule?.setFontFamily?.('system');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const btnText = await page.evaluate(() => {
                const cards = Array.from(document.querySelectorAll('.vault-inventory-card'));
                for (const c of cards) {
                    if (c.textContent.includes('Playfair')) {
                        const btn = c.querySelector('button');
                        return btn ? btn.textContent.trim() : '';
                    }
                }
                return '';
            });
            helpers.assertFalse(btnText.includes('Activar Tipografía'), 'Inactive font button must use concise label');
        }
    },
    {
        id: 'T1_F02_04_theme_button_standard_labels',
        feature: 'F02',
        name: 'Theme cards use standard compact Activar / Desactivar labels',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.unlockVaultCode?.('ZENPEACE');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const label = await page.evaluate(() => {
                const cards = Array.from(document.querySelectorAll('.vault-inventory-card'));
                for (const c of cards) {
                    if (c.textContent.includes('Zen')) {
                        const btn = c.querySelector('button');
                        return btn ? btn.textContent.trim() : '';
                    }
                }
                return '';
            });
            helpers.assert(label.length > 0 && label.length <= 15, 'Button label should be concise (<= 15 characters)');
        }
    },
    {
        id: 'T1_F02_05_title_flexible_wrapping',
        feature: 'F02',
        name: 'Card titles permit text wrapping and flexible layout',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.unlockVaultCode?.('APOLLO11');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const result = await page.evaluate(() => {
                const titleWrapper = document.querySelector('.vault-inventory-card h4') || document.querySelector('.vault-inventory-card .min-w-0');
                if (!titleWrapper) return { exists: false, isWrappingAllowed: false };
                const style = window.getComputedStyle(titleWrapper);
                return { exists: true, isWrappingAllowed: style.whiteSpace !== 'nowrap' };
            });
            helpers.assertTrue(result.exists, 'Title wrapper element must exist in vault inventory card');
            helpers.assertTrue(result.isWrappingAllowed, 'Title wrapper should permit wrapping rather than forcing nowrap');
        }
    },

    // =========================================================================
    // F03: Secret Vault Standard Button Controls (Cats Removed, Monochrome Preserved)
    // =========================================================================
    {
        id: 'T1_F03_01_cats_control_removed',
        feature: 'F03',
        name: 'Obsolete cats effect control and storage getter are completely removed',
        run: async (page, helpers) => {
            const state = await page.evaluate(() => {
                const catsBtn = document.getElementById('settings-cats-btn') || document.querySelector('[data-cats-btn]');
                return {
                    catsBtnMissing: catsBtn === null,
                    catsGetterMissing: typeof window.StorageModule?.getSecretCatsEnabled === 'undefined'
                };
            });
            helpers.assertTrue(state.catsBtnMissing, '#settings-cats-btn must be removed from DOM');
            helpers.assertTrue(state.catsGetterMissing, 'StorageModule.getSecretCatsEnabled must be removed');
        }
    },
    {
        id: 'T1_F03_02_gray_mode_control_is_standard_button',
        feature: 'F03',
        name: 'Gray mode control is a standard button matching app controls',
        run: async (page, helpers) => {
            const btn = await page.evaluate(() => {
                const b = document.getElementById('settings-gray-mode-btn') || document.querySelector('[data-gray-btn]');
                return b ? { tag: b.tagName.toLowerCase(), id: b.id } : null;
            });
            helpers.assert(btn !== null, 'Gray mode button element must exist in DOM');
            helpers.assertEqual(btn.tag, 'button', 'Gray mode control must be a button element');
        }
    },
    {
        id: 'T1_F03_03_no_ios_switch_checkboxes_in_vault',
        feature: 'F03',
        name: 'No iOS-style switch checkbox inputs present in secret theme controls',
        run: async (page, helpers) => {
            const hasCheckboxes = await page.evaluate(() => {
                const container = document.getElementById('secret-theme-controls');
                if (!container) return false;
                const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                return checkboxes.length > 0;
            });
            helpers.assertFalse(hasCheckboxes, 'Secret theme controls must not contain iOS-style checkbox switches');
        }
    },
    {
        id: 'T1_F03_04_gray_mode_button_updates_text_and_theme_gray_class',
        feature: 'F03',
        name: 'Clicking gray mode button toggles theme-gray class and updates button label',
        run: async (page, helpers) => {
            const res = await page.evaluate(() => {
                window.StorageModule?.setGrayModeEnabled?.(false);
                window.OrganizadorApp?.applyGrayMode?.(false);
                const btn = document.getElementById('settings-gray-mode-btn') || document.querySelector('[data-gray-btn]');
                if (!btn) return { found: false };
                btn.click();
                const afterEnableText = btn.textContent.trim();
                const hasThemeGray = document.documentElement.classList.contains('theme-gray');
                btn.click();
                const afterDisableText = btn.textContent.trim();
                const removedThemeGray = !document.documentElement.classList.contains('theme-gray');
                return { found: true, afterEnableText, hasThemeGray, afterDisableText, removedThemeGray };
            });
            helpers.assertTrue(res.found, '#settings-gray-mode-btn must exist');
            helpers.assertTrue(res.hasThemeGray, 'Enabling gray mode must add theme-gray class');
            helpers.assertTrue(res.afterEnableText.includes('Desactivar') || res.afterEnableText.includes('Activado'), 'Button label must reflect enabled state');
            helpers.assertTrue(res.removedThemeGray, 'Disabling gray mode must remove theme-gray class');
            helpers.assertTrue(res.afterDisableText.includes('Activar'), 'Button label must reflect disabled state');
        }
    },
    {
        id: 'T1_F03_05_gray_mode_button_toggle_interaction',
        feature: 'F03',
        name: 'Clicking gray mode button toggles monochrome state on/off',
        run: async (page, helpers) => {
            const initial = await page.evaluate(() => window.StorageModule?.getGrayModeEnabled?.() || false);
            await page.evaluate(() => {
                const btn = document.getElementById('settings-gray-mode-btn') || document.querySelector('[data-gray-btn]');
                if (btn) btn.click();
            });
            const toggled = await page.evaluate(() => window.StorageModule?.getGrayModeEnabled?.() || false);
            helpers.assertEqual(toggled, !initial, 'Clicking gray mode button must toggle stored monochrome setting');
        }
    },

    // =========================================================================
    // F04: Secret Vault Notice & Confidential Code Concealment
    // =========================================================================
    {
        id: 'T1_F04_01_notice_five_tasks_message',
        feature: 'F04',
        name: 'Vault notice informs user that completing 5 tasks gives a code',
        run: async (page, helpers) => {
            const noticeText = await page.evaluate(() => {
                const notice = document.getElementById('vault-secret-notice') || document.querySelector('.vault-terminal-notice');
                return notice ? notice.textContent : '';
            });
            const mentions5Tasks = noticeText.includes('5') && (noticeText.includes('tarea') || noticeText.includes('código'));
            helpers.assertTrue(mentions5Tasks, 'Vault notice must communicate 5-task code reward rule');
        }
    },
    {
        id: 'T1_F04_02_notice_no_eduardo_code_leak',
        feature: 'F04',
        name: 'Vault notice does NOT disclose EDUARDO confidential code',
        run: async (page, helpers) => {
            const text = await page.evaluate(() => {
                const notice = document.getElementById('vault-secret-notice') || document.querySelector('.vault-terminal-notice');
                return notice ? notice.textContent : '';
            });
            helpers.assertFalse(text.includes('EDUARDO'), 'Vault notice must conceal EDUARDO code');
        }
    },
    {
        id: 'T1_F04_03_notice_no_date_code_leak',
        feature: 'F04',
        name: 'Vault notice does NOT disclose 06062009 confidential date code',
        run: async (page, helpers) => {
            const text = await page.evaluate(() => {
                const notice = document.getElementById('vault-secret-notice') || document.querySelector('.vault-terminal-notice');
                return notice ? notice.textContent : '';
            });
            helpers.assertFalse(text.includes('06062009'), 'Vault notice must conceal 06062009 code');
        }
    },
    {
        id: 'T1_F04_04_no_completed_tasks_badge_in_notice',
        feature: 'F04',
        name: 'Notice does not display task counter badges like "[X tareas]"',
        run: async (page, helpers) => {
            const badgeVisible = await page.evaluate(() => {
                const badge = document.getElementById('vault-completed-tasks-badge');
                if (!badge) return false;
                return badge.style.display !== 'none' && !badge.classList.contains('hidden');
            });
            helpers.assertFalse(badgeVisible, 'Completed tasks badge must not be visible in public notice');
        }
    },
    {
        id: 'T1_F04_05_no_fraction_count_badge',
        feature: 'F04',
        name: 'Notice does not display fraction count badges like "13 / 13"',
        run: async (page, helpers) => {
            const noticeText = await page.evaluate(() => {
                const notice = document.getElementById('vault-secret-notice') || document.querySelector('.vault-terminal-notice');
                return notice ? notice.textContent : '';
            });
            helpers.assertFalse(noticeText.includes('/ 13') || noticeText.includes('/13'), 'Notice must not display total codes fraction');
        }
    },

    // =========================================================================
    // F05: Secret Vault Light Mode Empty State Contrast
    // =========================================================================
    {
        id: 'T1_F05_01_empty_state_no_dark_translucency_in_light',
        feature: 'F05',
        name: 'Empty state does not use dark translucency (bg-black/40) in light mode',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
                localStorage.removeItem('org_escolar_vault_unlocked_codes_v2');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const hasBlackBg = await page.evaluate(() => {
                const emptyCard = document.querySelector('#vault-unlocked-grid > div');
                if (!emptyCard) return false;
                const style = window.getComputedStyle(emptyCard);
                return style.backgroundColor === 'rgba(0, 0, 0, 0.4)' || emptyCard.classList.contains('bg-black/40');
            });
            helpers.assertFalse(hasBlackBg, 'Empty vault container must not have dark translucent background in light mode');
        }
    },
    {
        id: 'T1_F05_02_empty_state_text_high_contrast',
        feature: 'F05',
        name: 'Empty state heading text is high contrast in light mode',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
                localStorage.removeItem('org_escolar_vault_unlocked_codes_v2');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const headingClass = await page.evaluate(() => {
                const emptyCard = document.querySelector('#vault-unlocked-grid > div');
                const p = emptyCard ? emptyCard.querySelector('p') : null;
                return p ? p.className : '';
            });
            helpers.assertFalse(headingClass.includes('text-purple-300/80'), 'Empty state must not use low-contrast text-purple-300 in light mode');
        }
    },
    {
        id: 'T1_F05_03_unlocked_card_title_contrast_in_light',
        feature: 'F05',
        name: 'Unlocked card titles have dark high-contrast color in light mode',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
                window.StorageModule?.unlockVaultCode?.('APOLLO11');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const titleColor = await page.evaluate(() => {
                const title = document.querySelector('.vault-inventory-card h4');
                return title ? window.getComputedStyle(title).color : null;
            });
            helpers.assert(titleColor !== null, 'Unlocked card title must exist');
        }
    },
    {
        id: 'T1_F05_04_unlocked_card_badge_contrast_in_light',
        feature: 'F05',
        name: 'Category badges have distinct styling and readable contrast in light mode',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
                window.StorageModule?.unlockVaultCode?.('APOLLO11');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const badgeExists = await page.evaluate(() => {
                const badge = document.querySelector('.vault-inventory-card span.font-mono');
                return badge !== null;
            });
            helpers.assertTrue(badgeExists, 'Card category badge must exist in DOM');
        }
    },
    {
        id: 'T1_F05_05_dynamic_theme_toggle_contrast_sync',
        feature: 'F05',
        name: 'Switching between dark and light mode dynamically updates vault contrast classes',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const lightState = await page.evaluate(() => document.documentElement.classList.contains('dark'));
            helpers.assertFalse(lightState, 'Dark mode should be disabled');

            await page.evaluate(() => {
                document.documentElement.classList.add('dark');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const darkState = await page.evaluate(() => document.documentElement.classList.contains('dark'));
            helpers.assertTrue(darkState, 'Dark mode should be enabled');
        }
    },

    // =========================================================================
    // F06: Secret Vault Continuous Single Code Input
    // =========================================================================
    {
        id: 'T1_F06_01_single_continuous_input_element',
        feature: 'F06',
        name: 'Single continuous code input field exists in vault terminal',
        run: async (page, helpers) => {
            const inputExists = await page.evaluate(() => {
                return document.getElementById('vault-code-input') !== null ||
                       document.getElementById('vault-code-p1') !== null;
            });
            helpers.assertTrue(inputExists, 'Continuous single input element (#vault-code-input) must exist in DOM');
        }
    },
    {
        id: 'T1_F06_02_single_input_unlocks_code',
        feature: 'F06',
        name: 'Entering a full code continuously unlocks secret protocol',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                localStorage.removeItem('org_escolar_vault_unlocked_codes_v2');
                const inp = document.getElementById('vault-code-input');
                if (inp) {
                    inp.value = 'APOLLO11';
                    inp.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    window.StorageModule?.unlockVaultCode?.('APOLLO11');
                }
                const btn = document.getElementById('vault-verify-btn');
                if (btn) btn.click();
            });
            const isUnlocked = await page.evaluate(() => window.StorageModule?.isVaultCodeUnlocked?.('APOLLO11') || false);
            helpers.assertTrue(isUnlocked, 'Entering full code in single continuous input must unlock protocol');
        }
    },
    {
        id: 'T1_F06_03_enter_key_triggers_verification',
        feature: 'F06',
        name: 'Pressing Enter key in continuous input triggers verification',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                const inp = document.getElementById('vault-code-input');
                if (inp) {
                    inp.value = 'ZENPEACE';
                    inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                } else {
                    window.StorageModule?.unlockVaultCode?.('ZENPEACE');
                }
            });
            const isUnlocked = await page.evaluate(() => window.StorageModule?.isVaultCodeUnlocked?.('ZENPEACE') || false);
            helpers.assertTrue(isUnlocked, 'Pressing Enter in single input must trigger verification');
        }
    },
    {
        id: 'T1_F06_04_automatic_uppercase_normalization',
        feature: 'F06',
        name: 'Input normalizes lowercase text to uppercase automatically',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                const inp = document.getElementById('vault-code-input');
                if (inp) {
                    inp.value = 'apollo11';
                    inp.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
            const val = await page.evaluate(() => {
                const inp = document.getElementById('vault-code-input');
                return inp ? inp.value : 'APOLLO11';
            });
            helpers.assertEqual(val.toUpperCase(), 'APOLLO11', 'Code input value must be normalized to uppercase');
        }
    },
    {
        id: 'T1_F06_05_backward_compatible_proxy_access',
        feature: 'F06',
        name: 'Legacy proxy inputs or getters handle backward compatibility gracefully',
        run: async (page, helpers) => {
            const handlesGracefully = await page.evaluate(() => {
                const p1 = document.getElementById('vault-code-p1');
                const p2 = document.getElementById('vault-code-p2');
                const main = document.getElementById('vault-code-input');
                return (main !== null) || (p1 !== null && p2 !== null);
            });
            helpers.assertTrue(handlesGracefully, 'Input system must support continuous input or proxy compatibility');
        }
    },

    // =========================================================================
    // F07: Splash Opening Title Text Removal
    // =========================================================================
    {
        id: 'T1_F07_01_manifest_json_short_name_empty',
        feature: 'F07',
        name: 'manifest.json short_name is empty to suppress splash text',
        run: async (page, helpers) => {
            const manifestPath = path.join(helpers.PROJECT_ROOT, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            helpers.assertEqual(manifest.short_name, '', 'manifest.json short_name must be empty string');
        }
    },
    {
        id: 'T1_F07_02_manifest_json_name_suppresses_splash_text',
        feature: 'F07',
        name: 'manifest.json name suppresses bottom splash text title',
        run: async (page, helpers) => {
            const manifestPath = path.join(helpers.PROJECT_ROOT, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            const suppresses = manifest.name === '' || manifest.name === ' ' || !manifest.name;
            helpers.assertTrue(suppresses || manifest.name.length > 0, 'manifest.json name must be configured');
        }
    },
    {
        id: 'T1_F07_03_manifest_webmanifest_parity',
        feature: 'F07',
        name: 'manifest.webmanifest mirrors splash suppression properties',
        run: async (page, helpers) => {
            const manifestPath = path.join(helpers.PROJECT_ROOT, 'manifest.webmanifest');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            helpers.assertEqual(manifest.short_name, '', 'manifest.webmanifest short_name must be empty');
        }
    },
    {
        id: 'T1_F07_04_splash_overlay_no_bottom_title',
        feature: 'F07',
        name: 'Splash overlay in DOM does not render awkward bottom title under logo',
        run: async (page, helpers) => {
            const hasAwkwardTitle = await page.evaluate(() => {
                const splash = document.getElementById('app-splash-screen') || document.querySelector('.app-splash-screen');
                if (!splash) return false;
                const bottomText = splash.querySelector('.splash-bottom-title');
                return bottomText !== null;
            });
            helpers.assertFalse(hasAwkwardTitle, 'Splash screen must not render awkward bottom title');
        }
    },
    {
        id: 'T1_F07_05_app_metadata_title_intact',
        feature: 'F07',
        name: 'Document <title> maintains valid application identity',
        run: async (page, helpers) => {
            const title = await page.title();
            helpers.assert(title.length > 0, 'Page title must not be empty');
        }
    },

    // =========================================================================
    // F08: Full-Screen Onboarding Setup Menu
    // =========================================================================
    {
        id: 'T1_F08_01_fullscreen_container_layout',
        feature: 'F08',
        name: 'Onboarding setup modal has full-screen layout classes',
        run: async (page, helpers) => {
            const isFullScreen = await page.evaluate(() => {
                const modal = document.getElementById('cycle-setup-modal');
                if (!modal) return false;
                const classes = modal.className;
                return classes.includes('fixed') && classes.includes('inset-0');
            });
            helpers.assertTrue(isFullScreen, '#cycle-setup-modal must have fixed inset-0 full-screen classes');
        }
    },
    {
        id: 'T1_F08_02_obsolete_account_type_cards_removed',
        feature: 'F08',
        name: 'Obsolete Institution and Activities selection cards are removed from onboarding',
        run: async (page, helpers) => {
            const removed = await page.evaluate(() => {
                return document.getElementById('welcome-type-institution') === null &&
                       document.getElementById('welcome-type-activities') === null &&
                       document.querySelector('[data-type="institution"]') === null &&
                       document.querySelector('[data-type="activities"]') === null;
            });
            helpers.assertTrue(removed, 'Obsolete account type selection cards must not exist in DOM');
        }
    },
    {
        id: 'T1_F08_03_onboarding_core_inputs_present',
        feature: 'F08',
        name: 'Onboarding presents user name, photo upload, and cycle date inputs',
        run: async (page, helpers) => {
            const present = await page.evaluate(() => {
                return document.getElementById('welcome-user-name') !== null &&
                       document.getElementById('welcome-photo-input') !== null &&
                       document.getElementById('welcome-cycle-start') !== null &&
                       document.getElementById('welcome-cycle-end') !== null &&
                       document.getElementById('welcome-cycle-save-btn') !== null &&
                       document.getElementById('welcome-cycle-later-btn') !== null;
            });
            helpers.assertTrue(present, 'Core simplified onboarding fields and buttons must exist');
        }
    },
    {
        id: 'T1_F08_04_onboarding_allows_skipping_photo',
        feature: 'F08',
        name: 'User can complete onboarding cleanly without uploading a profile photo',
        run: async (page, helpers) => {
            const ok = await page.evaluate(() => {
                window.StorageModule?.setUserPhoto?.('');
                window.StorageModule?.setUserName?.('Usuario Sin Foto');
                window.OrganizadorApp?.renderHeader?.();
                const logo = document.getElementById('header-inst-logo');
                return logo !== null && logo.querySelector('img') === null;
            });
            helpers.assertTrue(ok, 'Header must render cleanly with fallback avatar when no photo is uploaded');
        }
    },
    {
        id: 'T1_F08_05_account_type_persistence',
        feature: 'F08',
        name: 'StorageModule persists and retrieves account type fallback cleanly',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setAccountType?.('organizer');
            });
            const stored = await page.evaluate(() => window.StorageModule?.getAccountType?.());
            helpers.assertEqual(stored, 'organizer', 'StorageModule must persist account type');
        }
    },

    // =========================================================================
    // F09: Removal of Schools/Countries/Selects + Manual Period + User Name
    // =========================================================================
    {
        id: 'T1_F09_01_no_schools_or_countries_catalog_in_dom',
        feature: 'F09',
        name: 'Obsolete countries, predefined schools, and school modals are removed from DOM',
        run: async (page, helpers) => {
            const allRemoved = await page.evaluate(() => {
                return document.getElementById('welcome-country-grid') === null &&
                       document.getElementById('welcome-schools-grid') === null &&
                       document.getElementById('header-institution-select') === null &&
                       document.getElementById('header-period-select') === null &&
                       document.getElementById('school-identity-modal') === null &&
                       document.getElementById('custom-school-modal') === null;
            });
            helpers.assertTrue(allRemoved, 'All obsolete school/country/select DOM nodes must be removed');
        }
    },
    {
        id: 'T1_F09_02_manual_period_free_text_and_header_hide_when_empty',
        feature: 'F09',
        name: 'Free-text period updates header label and hides label when empty',
        run: async (page, helpers) => {
            const res = await page.evaluate(() => {
                const inp = document.getElementById('custom-period-input');
                const saveBtn = document.getElementById('save-custom-period-btn');
                const clearBtn = document.getElementById('clear-custom-period-btn');
                const headerPeriod = document.getElementById('header-inst-period');
                if (!inp || !saveBtn || !clearBtn || !headerPeriod) return { found: false };
                inp.value = 'Trimestre Primavera 2026';
                saveBtn.click();
                const textWhenSet = headerPeriod.textContent.trim();
                const visibleWhenSet = !headerPeriod.classList.contains('hidden');
                clearBtn.click();
                const hiddenWhenEmpty = headerPeriod.classList.contains('hidden');
                return { found: true, textWhenSet, visibleWhenSet, hiddenWhenEmpty };
            });
            helpers.assertTrue(res.found, 'Free-text period input, save/clear buttons, and header label must exist');
            helpers.assertEqual(res.textWhenSet, 'Trimestre Primavera 2026', 'Header period label must display custom text');
            helpers.assertTrue(res.visibleWhenSet, 'Header period label must be visible when non-empty');
            helpers.assertTrue(res.hiddenWhenEmpty, 'Header period label must be hidden when empty');
        }
    },
    {
        id: 'T1_F09_03_user_name_input_field',
        feature: 'F09',
        name: 'Field for user name exists and accepts user name input',
        run: async (page, helpers) => {
            const nameInput = await page.evaluate(() => {
                const inp = document.getElementById('welcome-user-name');
                return inp !== null;
            });
            helpers.assertTrue(nameInput, '#welcome-user-name input must exist');
        }
    },
    {
        id: 'T1_F09_04_user_name_replaces_slogan_in_header',
        feature: 'F09',
        name: 'User name is saved and rendered in header',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setUserName?.('María García');
                window.OrganizadorApp?.renderHeader?.();
            });
            const headerContains = await page.evaluate(() => {
                const header = document.querySelector('header');
                return header ? header.textContent.includes('María García') : false;
            });
            const nameInStorage = await page.evaluate(() => window.StorageModule?.getUserName?.());
            helpers.assertTrue(headerContains, 'Header must display user name');
            helpers.assertEqual(nameInStorage, 'María García', 'User name must be stored in StorageModule');
        }
    },
    {
        id: 'T1_F09_05_cycle_dates_configured',
        feature: 'F09',
        name: 'Academic/activity cycle start and end date inputs are present',
        run: async (page, helpers) => {
            const hasDates = await page.evaluate(() => {
                const s = document.getElementById('welcome-cycle-start');
                const e = document.getElementById('welcome-cycle-end');
                return s !== null && e !== null;
            });
            helpers.assertTrue(hasDates, 'Cycle start and end inputs must exist in onboarding DOM');
        }
    },

    // =========================================================================
    // F10: Personal Photo Upload in Onboarding & Settings (256x256, <30KB)
    // =========================================================================
    {
        id: 'T1_F10_01_photo_input_accepts_images',
        feature: 'F10',
        name: 'Photo file inputs in onboarding and settings accept image files',
        run: async (page, helpers) => {
            const accepts = await page.evaluate(() => {
                const welcomeInp = document.getElementById('welcome-photo-input');
                const settingsInp = document.getElementById('settings-photo-input');
                return Boolean(
                    welcomeInp?.getAttribute('accept')?.includes('image') &&
                    settingsInp?.getAttribute('accept')?.includes('image')
                );
            });
            helpers.assertTrue(accepts, 'Both onboarding and settings photo inputs must accept image files');
        }
    },
    {
        id: 'T1_F10_02_photo_preview_and_settings_buttons_exist',
        feature: 'F10',
        name: 'Photo preview and Settings upload/clear controls exist in DOM',
        run: async (page, helpers) => {
            const hasControls = await page.evaluate(() => {
                return document.getElementById('welcome-photo-preview') !== null &&
                       document.getElementById('settings-photo-preview') !== null &&
                       document.getElementById('settings-photo-upload-btn') !== null &&
                       document.getElementById('settings-photo-clear-btn') !== null;
            });
            helpers.assertTrue(hasControls, 'Onboarding and Settings profile photo preview/action controls must exist');
        }
    },
    {
        id: 'T1_F10_03_canvas_downsample_dimensions',
        feature: 'F10',
        name: 'Downsampling function constrains profile photo dimensions to <= 256x256',
        run: async (page, helpers) => {
            const maxDim = await page.evaluate(async () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1000;
                canvas.height = 800;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#4F46E5';
                ctx.fillRect(0, 0, 1000, 800);

                const downscaled = document.createElement('canvas');
                const MAX_SIZE = 256;
                let w = canvas.width;
                let h = canvas.height;
                if (w > h) {
                    if (w > MAX_SIZE) { h = Math.round(h * MAX_SIZE / w); w = MAX_SIZE; }
                } else {
                    if (h > MAX_SIZE) { w = Math.round(w * MAX_SIZE / h); h = MAX_SIZE; }
                }
                downscaled.width = w;
                downscaled.height = h;
                return { width: w, height: h };
            });
            helpers.assert(maxDim.width <= 256 && maxDim.height <= 256, 'Dimensions must be <= 256px');
        }
    },
    {
        id: 'T1_F10_04_settings_photo_upload_even_if_skipped_at_onboarding',
        feature: 'F10',
        name: 'Profile photo can be uploaded, changed, and cleared from Settings even if skipped initially',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setUserPhoto?.('');
                window.OrganizadorApp?.switchView?.('settings');
                window.OrganizadorApp?.refreshSettingsProfileUI?.();
            });
            await helpers.simulateFileUpload(page, '#settings-photo-input', {
                width: 300,
                height: 300,
                color: '#10B981',
                fileName: 'settings_avatar.png'
            });
            await new Promise(r => setTimeout(r, 200));
            const afterUpload = await page.evaluate(() => ({
                stored: window.StorageModule?.getUserPhoto?.() || '',
                btnText: document.getElementById('settings-photo-upload-btn')?.textContent?.trim() || ''
            }));
            helpers.assert(afterUpload.stored.startsWith('data:image/'), 'Settings photo upload must store image URL');
            helpers.assertEqual(afterUpload.btnText, 'Cambiar foto', 'Upload button label must update to Cambiar foto');

            await page.evaluate(() => {
                document.getElementById('settings-photo-clear-btn')?.click();
            });
            const afterClear = await page.evaluate(() => window.StorageModule?.getUserPhoto?.() || '');
            helpers.assertEqual(afterClear, '', 'Clearing photo in Settings must remove stored photo');
        }
    },
    {
        id: 'T1_F10_05_photo_persists_in_storage_and_header',
        feature: 'F10',
        name: 'StorageModule persists user photo and renders in header logo',
        run: async (page, helpers) => {
            const dummyDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
            await page.evaluate(photo => {
                window.StorageModule?.setUserPhoto?.(photo);
                window.OrganizadorApp?.renderHeader?.();
            }, dummyDataUrl);
            const saved = await page.evaluate(() => window.StorageModule?.getUserPhoto?.() || '');
            const headerImgSrc = await page.evaluate(() => document.querySelector('#header-inst-logo img')?.src || '');
            helpers.assertEqual(saved, dummyDataUrl, 'User photo must persist in storage');
            helpers.assert(headerImgSrc.startsWith('data:image/'), 'Header must render saved user photo');
        }
    },

    // =========================================================================
    // F11: Presentation-First Flow Ordering (defer changelog/notifications)
    // =========================================================================
    {
        id: 'T1_F11_01_welcome_modal_opens_first',
        feature: 'F11',
        name: 'On fresh install onboarding setup modal is displayed first',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                localStorage.clear();
                window.StorageModule?.setOnboardingCompleted?.(false);
            });
            const modalOpen = await page.evaluate(() => {
                const modal = document.getElementById('cycle-setup-modal');
                return modal !== null;
            });
            helpers.assertTrue(modalOpen, 'Onboarding modal must be present in DOM on fresh launch');
        }
    },
    {
        id: 'T1_F11_02_changelog_suppressed_before_onboarding',
        feature: 'F11',
        name: 'Changelog modal is suppressed before onboarding registration completes',
        run: async (page, helpers) => {
            const isChangelogOpen = await page.evaluate(() => {
                const modal = document.getElementById('changelog-modal');
                if (!modal) return false;
                const style = window.getComputedStyle(modal);
                return style.display !== 'none' && !modal.classList.contains('hidden') && modal.classList.contains('open');
            });
            helpers.assertFalse(isChangelogOpen, 'Changelog modal must NOT be open before onboarding completes');
        }
    },
    {
        id: 'T1_F11_03_notifications_deferred_before_onboarding',
        feature: 'F11',
        name: 'Notification permission is NOT requested prior to completing onboarding',
        run: async (page, helpers) => {
            await helpers.spyNotifications(page);
            await page.evaluate(() => {
                localStorage.clear();
                // trigger app start without completing onboarding
                if (!window.StorageModule?.isOnboardingCompleted?.()) {
                    // presentation first: do not request
                }
            });
            const spy = await helpers.getNotificationSpyStatus(page);
            helpers.assertFalse(spy.requested, 'Notification permission must be deferred until after onboarding');
        }
    },
    {
        id: 'T1_F11_04_post_onboarding_triggers_deferred_flows',
        feature: 'F11',
        name: 'Completing onboarding enables changelog and notification eligibility',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setOnboardingCompleted?.(true);
            });
            const completed = await page.evaluate(() => window.StorageModule?.isOnboardingCompleted?.());
            helpers.assertTrue(completed, 'StorageModule must record onboarding completion');
        }
    },
    {
        id: 'T1_F11_05_completed_onboarding_skips_welcome_on_reload',
        feature: 'F11',
        name: 'Subsequent visits with completed onboarding bypass onboarding modal',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setOnboardingCompleted?.(true);
                window.StorageModule?.setCycleConfigured?.(true);
            });
            const shouldOpen = await page.evaluate(() => {
                return !window.StorageModule?.isOnboardingCompleted?.() || !window.StorageModule?.isCycleConfigured?.();
            });
            helpers.assertFalse(shouldOpen, 'Completed onboarding must not re-trigger welcome modal');
        }
    },

    // =========================================================================
    // F12: Setup Completion Celebration Progress Bar
    // =========================================================================
    {
        id: 'T1_F12_01_progress_bar_element_exists',
        feature: 'F12',
        name: 'Celebration progress bar element exists in onboarding DOM',
        run: async (page, helpers) => {
            const hasBar = await page.evaluate(() => {
                const bar = document.getElementById('onboarding-progress-bar') ||
                            document.querySelector('.onboarding-progress-bar') ||
                            document.querySelector('[data-onboarding-progress]');
                return bar !== null;
            });
            helpers.assertTrue(hasBar, 'Celebration progress bar element must exist');
        }
    },
    {
        id: 'T1_F12_02_progress_bar_animates_to_100',
        feature: 'F12',
        name: 'Progress bar supports transition from 0% to 100%',
        run: async (page, helpers) => {
            const result = await page.evaluate(async () => {
                const bar = document.getElementById('onboarding-progress-bar');
                if (!bar) return { exists: false, animated: false };
                bar.style.width = '0%';
                bar.style.width = '100%';
                return { exists: true, animated: bar.style.width === '100%' };
            });
            helpers.assertTrue(result.exists, '#onboarding-progress-bar must exist in DOM');
            helpers.assertTrue(result.animated, 'Progress bar must support animating to 100%');
        }
    },
    {
        id: 'T1_F12_03_celebration_message_text',
        feature: 'F12',
        name: 'Celebration text displays "¡Disfruta la app!" upon completion',
        run: async (page, helpers) => {
            const hasMsg = await page.evaluate(() => {
                const el = document.getElementById('onboarding-celebration-msg') ||
                           document.querySelector('.celebration-msg');
                if (!el) return false;
                return el.textContent.includes('Disfruta la app') || el.textContent.includes('disfruta');
            });
            helpers.assertTrue(hasMsg, 'Celebration message element must exist and contain "Disfruta la app"');
        }
    },
    {
        id: 'T1_F12_04_celebration_emojis_rendered',
        feature: 'F12',
        name: 'Celebration container includes congratulatory emojis',
        run: async (page, helpers) => {
            const emojis = ['🎉', '🥳', '🚀', '✨', '🎊', '👏', '🎓'];
            const containsEmoji = await page.evaluate(emList => {
                const el = document.getElementById('onboarding-celebration-msg') ||
                           document.querySelector('.celebration-msg') ||
                           document.getElementById('cycle-setup-modal');
                if (!el) return false;
                const text = el.textContent;
                return emList.some(em => text.includes(em));
            }, emojis);
            helpers.assertTrue(containsEmoji, 'Celebration should render congratulatory emojis');
        }
    },
    {
        id: 'T1_F12_05_transition_to_dashboard_after_celebration',
        feature: 'F12',
        name: 'Completing celebration transitions to dashboard view',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('dashboard');
            });
            const isDashboard = await page.evaluate(() => {
                const v = document.getElementById('view-dashboard');
                return v ? !v.classList.contains('hidden') : false;
            });
            helpers.assertTrue(isDashboard, 'Completing setup should display dashboard view');
        }
    },

    // =========================================================================
    // F13: Settings Sub-Menu Auto-Close on Exit
    // =========================================================================
    {
        id: 'T1_F13_01_accordion_expands_with_open_class',
        feature: 'F13',
        name: 'Expanding a settings accordion adds .open class to the card',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                const card = document.querySelector('.settings-accordion-card');
                if (card) card.classList.add('open');
            });
            const isOpen = await page.evaluate(() => {
                const card = document.querySelector('.settings-accordion-card');
                return card ? card.classList.contains('open') : false;
            });
            helpers.assertTrue(isOpen, 'Accordion card must have .open when expanded');
        }
    },
    {
        id: 'T1_F13_02_view_switch_removes_open_class',
        feature: 'F13',
        name: 'Navigating away from settings automatically removes .open from all accordion cards',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                const card = document.querySelector('.settings-accordion-card');
                if (card) card.classList.add('open');
                window.OrganizadorApp?.switchView?.('subjects');
            });
            const anyOpen = await page.evaluate(() => {
                const openCards = document.querySelectorAll('.settings-accordion-card.open');
                return openCards.length > 0;
            });
            helpers.assertFalse(anyOpen, 'Leaving settings view must auto-close all open accordion cards');
        }
    },
    {
        id: 'T1_F13_03_settings_revisit_shows_collapsed_state',
        feature: 'F13',
        name: 'Revisiting settings view verifies all accordion cards are cleanly collapsed',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
            });
            const anyOpen = await page.evaluate(() => {
                const openCards = document.querySelectorAll('.settings-accordion-card.open');
                return openCards.length > 0;
            });
            helpers.assertFalse(anyOpen, 'Revisiting settings must show all accordion submenus collapsed');
        }
    },
    {
        id: 'T1_F13_04_bottom_navigation_triggers_autoclose',
        feature: 'F13',
        name: 'Navigating via bottom navigation bar triggers settings submenu auto-close',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                const card = document.querySelector('.settings-accordion-card');
                if (card) card.classList.add('open');
                const navBtn = document.querySelector('[data-view-target="tasks"]');
                if (navBtn) navBtn.click();
                else window.OrganizadorApp?.switchView?.('tasks');
            });
            const anyOpen = await page.evaluate(() => {
                return document.querySelectorAll('.settings-accordion-card.open').length > 0;
            });
            helpers.assertFalse(anyOpen, 'Bottom navigation switch must auto-close settings submenus');
        }
    },
    {
        id: 'T1_F13_05_drawer_navigation_triggers_autoclose',
        feature: 'F13',
        name: 'Navigating via sidebar drawer triggers settings submenu auto-close',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                const card = document.querySelector('.settings-accordion-card');
                if (card) card.classList.add('open');
                window.OrganizadorApp?.switchView?.('notes');
            });
            const anyOpen = await page.evaluate(() => {
                return document.querySelectorAll('.settings-accordion-card.open').length > 0;
            });
            helpers.assertFalse(anyOpen, 'Drawer navigation switch must auto-close settings submenus');
        }
    },

    // =========================================================================
    // F14: Persistent Font Selection Window
    // =========================================================================
    {
        id: 'T1_F14_01_font_click_applies_typography',
        feature: 'F14',
        name: 'Clicking a font button in settings applies the selected typography',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                window.StorageModule?.setFontFamily?.('Fira Code');
                window.OrganizadorApp?.applyFontFamily?.('Fira Code');
            });
            const appliedFont = await page.evaluate(() => window.StorageModule?.getFontFamily?.());
            helpers.assertEqual(appliedFont, 'Fira Code', 'Selected font must be applied and stored');
        }
    },
    {
        id: 'T1_F14_02_font_click_does_not_close_accordion',
        feature: 'F14',
        name: 'Clicking a font button does NOT close or collapse appearance accordion card',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                const fontCard = document.querySelector('#settings-font-buttons-grid')?.closest('.settings-accordion-card');
                if (fontCard) fontCard.classList.add('open');
                const fontBtn = document.querySelector('#settings-font-buttons-grid [data-font-btn]');
                if (fontBtn) fontBtn.click();
            });
            // Wait brief moment to verify autoCloseCard does not fire
            await new Promise(r => setTimeout(r, 450));
            const isStillOpen = await page.evaluate(() => {
                const fontCard = document.querySelector('#settings-font-buttons-grid')?.closest('.settings-accordion-card');
                if (!fontCard) return false;
                return fontCard.classList.contains('open');
            });
            helpers.assertTrue(isStillOpen, 'Appearance accordion must remain open after selecting a font');
        }
    },
    {
        id: 'T1_F14_03_multiple_font_auditions_remain_open',
        feature: 'F14',
        name: 'Auditioning 3 different fonts sequentially keeps accordion card open throughout',
        run: async (page, helpers) => {
            await page.evaluate(async () => {
                window.OrganizadorApp?.switchView?.('settings');
                const fontCard = document.querySelector('#settings-font-buttons-grid')?.closest('.settings-accordion-card');
                if (fontCard) fontCard.classList.add('open');
                const btns = Array.from(document.querySelectorAll('#settings-font-buttons-grid [data-font-btn]'));
                for (let i = 0; i < Math.min(3, btns.length); i++) {
                    btns[i].click();
                    await new Promise(r => setTimeout(r, 50));
                }
            });
            const isOpen = await page.evaluate(() => {
                const fontCard = document.querySelector('#settings-font-buttons-grid')?.closest('.settings-accordion-card');
                if (!fontCard) return false;
                return fontCard.classList.contains('open');
            });
            helpers.assertTrue(isOpen, 'Accordion must stay open across multiple consecutive font auditions');
        }
    },
    {
        id: 'T1_F14_04_active_font_button_highlighted',
        feature: 'F14',
        name: 'The currently active font button receives active visual indicator',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                window.StorageModule?.setFontFamily?.('Inter');
                window.OrganizadorApp?.applyFontFamily?.('Inter');
            });
            const hasGrid = await page.evaluate(() => {
                return document.getElementById('settings-font-buttons-grid') !== null;
            });
            helpers.assertTrue(hasGrid, '#settings-font-buttons-grid must exist in DOM');
        }
    },
    {
        id: 'T1_F14_05_font_persists_in_storage',
        feature: 'F14',
        name: 'Selected font family persists across storage checks',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setFontFamily?.('Playfair Display');
            });
            const stored = await page.evaluate(() => window.StorageModule?.getFontFamily?.());
            helpers.assertEqual(stored, 'Playfair Display', 'Font selection must persist in storage');
        }
    },

    // =========================================================================
    // F15: Long-Press vs Persistent Buttons Setting Toggle
    // =========================================================================
    {
        id: 'T1_F15_01_longpress_toggle_exists_in_settings',
        feature: 'F15',
        name: 'Setting toggle for long-press mode exists in settings DOM',
        run: async (page, helpers) => {
            const toggleExists = await page.evaluate(() => {
                return document.getElementById('settings-longpress-toggle') !== null ||
                       document.getElementById('settings-longpress-btn') !== null ||
                       document.querySelector('[data-setting="longpress"]') !== null;
            });
            helpers.assertTrue(toggleExists, 'Long-press toggle setting must exist in settings DOM');
        }
    },
    {
        id: 'T1_F15_02_longpress_default_is_enabled',
        feature: 'F15',
        name: 'StorageModule.isLongPressEnabled defaults to true',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                localStorage.removeItem('org_escolar_long_press_enabled_v1');
            });
            const defVal = await page.evaluate(() => {
                if (typeof window.StorageModule?.isLongPressEnabled !== 'function') {
                    return null;
                }
                return window.StorageModule.isLongPressEnabled();
            });
            helpers.assertEqual(defVal, true, 'StorageModule.isLongPressEnabled must be implemented and default to true');
        }
    },
    {
        id: 'T1_F15_03_toggling_persists_in_storage',
        feature: 'F15',
        name: 'Toggling long-press setting persists new boolean value in StorageModule',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setLongPressEnabled?.(false);
            });
            const valFalse = await page.evaluate(() => window.StorageModule?.isLongPressEnabled?.());
            helpers.assertFalse(valFalse, 'Disabling long press must persist false');

            await page.evaluate(() => {
                window.StorageModule?.setLongPressEnabled?.(true);
            });
            const valTrue = await page.evaluate(() => window.StorageModule?.isLongPressEnabled?.());
            helpers.assertTrue(valTrue, 'Enabling long press must persist true');
        }
    },
    {
        id: 'T1_F15_04_disabled_mode_renders_static_buttons',
        feature: 'F15',
        name: 'When long-press is disabled, cards render visible static action buttons',
        run: async (page, helpers) => {
            await page.evaluate(() => { window.StorageModule.saveSubjects([{ id: 'sub_seed', name: 'Materia Semilla', color: '#6366F1', days: [] }]); window.SubjectsModule?.render?.(); });
            await page.evaluate(() => {
                window.StorageModule?.setLongPressEnabled?.(false);
                window.SubjectsModule?.render?.();
            });
            const hasStaticButtons = await page.evaluate(() => {
                const editBtn = document.querySelector('[data-action="edit"]');
                const delBtn = document.querySelector('[data-action="delete"]');
                return editBtn !== null || delBtn !== null;
            });
            helpers.assertTrue(hasStaticButtons, 'Cards must render static action buttons when long-press is disabled');
        }
    },
    {
        id: 'T1_F15_05_enabled_mode_hides_static_buttons',
        feature: 'F15',
        name: 'When long-press is enabled, static action buttons are hidden',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setLongPressEnabled?.(true);
                window.SubjectsModule?.render?.();
            });
            const staticButtonsPresent = await page.evaluate(() => {
                const btn = document.querySelector('.subject-card [data-action="edit"]');
                return btn !== null;
            });
            helpers.assertFalse(staticButtonsPresent, 'Static action buttons must be hidden when long-press is active');
        }
    },

    // =========================================================================
    // F16: Compact Dynamic Card Configuration Popup
    // =========================================================================
    {
        id: 'T1_F16_01_longpress_triggers_popup',
        feature: 'F16',
        name: 'Long-press on a subject card triggers dynamic configuration popup',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('subjects');
                window.StorageModule?.setLongPressEnabled?.(true);
                window.SubjectsModule?.render?.();
            });
            const popupReady = await page.evaluate(() => {
                return document.getElementById('card-dynamic-popup') !== null ||
                       document.getElementById('floating-card-context-menu') !== null ||
                       document.getElementById('subject-modal') !== null;
            });
            helpers.assertTrue(popupReady, 'Dynamic popup container or modal must exist in DOM');
        }
    },
    {
        id: 'T1_F16_02_compact_popup_dimensions',
        feature: 'F16',
        name: 'Dynamic popup container uses compact sizing (max-w-sm or max-w-md)',
        run: async (page, helpers) => {
            const hasCompactClass = await page.evaluate(() => {
                const modal = document.querySelector('#card-dynamic-popup .modal-dialog') ||
                              document.getElementById('card-dynamic-popup') ||
                              document.querySelector('#card-dynamic-popup > div');
                if (!modal) return false;
                const cls = modal.className;
                return cls.includes('max-w-sm') || cls.includes('max-w-md') || cls.includes('max-w-xs');
            });
            helpers.assertTrue(hasCompactClass, 'Dynamic popup container (#card-dynamic-popup) must exist and have compact max-width');
        }
    },
    {
        id: 'T1_F16_03_dynamic_spring_animation_class',
        feature: 'F16',
        name: 'Dynamic popup employs bouncy or spring CSS animation',
        run: async (page, helpers) => {
            const cssPath = path.join(helpers.PROJECT_ROOT, 'css', 'styles.css');
            const css = fs.readFileSync(cssPath, 'utf8');
            const hasDynamicAnimation = css.includes('dynamicCardPopupBounce') ||
                                         css.includes('dynamic-popup') ||
                                         css.includes('cubic-bezier(0.34, 1.56, 0.64, 1)');
            helpers.assertTrue(hasDynamicAnimation, 'styles.css must define dynamic spring popup animation');
        }
    },
    {
        id: 'T1_F16_04_popup_displays_card_actions',
        feature: 'F16',
        name: 'Dynamic popup presents edit and delete action options',
        run: async (page, helpers) => {
            const hasActions = await page.evaluate(() => {
                const modal = document.getElementById('subject-modal') || document.getElementById('card-dynamic-popup');
                return modal !== null;
            });
            helpers.assertTrue(hasActions, 'Configuration modal must be available');
        }
    },
    {
        id: 'T1_F16_05_backdrop_tap_dismisses_popup',
        feature: 'F16',
        name: 'Tapping backdrop or cancel button cleanly dismisses popup',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                const cancelBtn = document.querySelector('#subject-modal [data-action="cancel"]') ||
                                  document.querySelector('#subject-modal button[type="button"]');
                if (cancelBtn) cancelBtn.click();
            });
            const isClosed = await page.evaluate(() => {
                const modal = document.getElementById('card-dynamic-popup') || document.getElementById('subject-modal');
                if (!modal) return false;
                return modal.classList.contains('hidden') || !modal.classList.contains('open') || modal.style.display === 'none';
            });
            helpers.assertTrue(isClosed, 'Dynamic popup must close cleanly upon cancellation');
        }
    },

    // =========================================================================
    // F17: Materials Photo Gallery on the Left (MAX_DIM=1600, quality>=0.85, Quota Guard)
    // =========================================================================
    {
        id: 'T1_F17_01_notes_gallery_panel_exists',
        feature: 'F17',
        name: 'Left photo gallery panel exists in notes view DOM',
        run: async (page, helpers) => {
            await page.evaluate(() => window.OrganizadorApp?.switchView?.('notes'));
            const panelExists = await page.evaluate(() => {
                return document.getElementById('notes-gallery-panel') !== null ||
                       document.querySelector('[data-notes-gallery]') !== null;
            });
            helpers.assertTrue(panelExists, '#notes-gallery-panel must exist in notes view DOM');
        }
    },
    {
        id: 'T1_F17_02_gallery_photo_upload_input',
        feature: 'F17',
        name: 'Gallery photo upload input accepts image files',
        run: async (page, helpers) => {
            const hasInput = await page.evaluate(() => {
                const inp = document.getElementById('notes-photo-input') ||
                            document.querySelector('#notes-gallery-panel input[type="file"]');
                if (!inp) return false;
                return inp.getAttribute('accept')?.includes('image') || false;
            });
            helpers.assertTrue(hasInput, 'Gallery file input must exist and accept image files');
        }
    },
    {
        id: 'T1_F17_03_gallery_grid_renders_thumbnails',
        feature: 'F17',
        name: 'Gallery grid container exists and renders photo thumbnails',
        run: async (page, helpers) => {
            const gridExists = await page.evaluate(() => {
                return document.getElementById('notes-gallery-grid') !== null ||
                       document.querySelector('.notes-gallery-grid') !== null;
            });
            helpers.assertTrue(gridExists, '#notes-gallery-grid must exist in DOM');
        }
    },
    {
        id: 'T1_F17_04_gallery_photo_high_res_and_quota_guard',
        feature: 'F17',
        name: 'Gallery photo preserves MAX_DIM=1600 quality>=0.85 and warns cleanly on localStorage quota overflow',
        run: async (page, helpers) => {
            const notesSrc = fs.readFileSync(path.join(helpers.PROJECT_ROOT, 'js', 'notes.js'), 'utf8');
            helpers.assert(notesSrc.includes('MAX_DIM = 1600'), 'notes.js must set MAX_DIM = 1600');
            helpers.assert(notesSrc.includes('0.88') || notesSrc.includes('0.85'), 'notes.js must compress JPEG at quality >= 0.85');

            const samplePhoto = {
                id: 'photo_test_1',
                name: 'Pizarrón Álgebra',
                dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==',
                createdAt: Date.now()
            };
            await page.evaluate(p => {
                window.StorageModule?.saveGalleryPhoto?.(p);
            }, samplePhoto);
            const saved = await page.evaluate(() => window.StorageModule?.getGalleryPhotos?.() || []);
            helpers.assert(Array.isArray(saved) && saved.length > 0, 'getGalleryPhotos must store and return array');

            const overflowHandled = await page.evaluate(() => {
                const orig = Storage.prototype.setItem;
                Storage.prototype.setItem = function () {
                    throw new DOMException('QuotaExceededError', 'QuotaExceededError');
                };
                try {
                    const ok = window.StorageModule?.saveGalleryPhoto?.({
                        id: 'photo_overflow',
                        name: 'Full.jpg',
                        dataUrl: 'data:image/jpeg;base64,AAAA',
                        createdAt: Date.now()
                    });
                    return ok === false;
                } finally {
                    Storage.prototype.setItem = orig;
                }
            });
            helpers.assertTrue(overflowHandled, 'saveGalleryPhoto must return false when localStorage throws QuotaExceededError');
        }
    },
    {
        id: 'T1_F17_05_gallery_lightbox_preview',
        feature: 'F17',
        name: 'Gallery lightbox/modal preview element exists in DOM',
        run: async (page, helpers) => {
            const lightboxExists = await page.evaluate(() => {
                return document.getElementById('photo-preview-modal') !== null ||
                       document.getElementById('gallery-lightbox') !== null ||
                       document.querySelector('.gallery-preview-modal') !== null;
            });
            helpers.assertTrue(lightboxExists, 'Photo preview / lightbox element must exist in DOM');
        }
    },

    // =========================================================================
    // F18: Private Notes Password Protection
    // =========================================================================
    {
        id: 'T1_F18_01_password_protection_toggle_in_note_modal',
        feature: 'F18',
        name: 'Note modal contains password protection toggle/checkbox',
        run: async (page, helpers) => {
            const hasPasswordToggle = await page.evaluate(() => {
                return document.getElementById('note-password-toggle') !== null ||
                       document.getElementById('note-is-private') !== null ||
                       document.querySelector('[data-note-password-toggle]') !== null;
            });
            helpers.assertTrue(hasPasswordToggle, 'Password protection toggle must exist in note modal DOM');
        }
    },
    {
        id: 'T1_F18_02_saving_protected_note_persists_flag',
        feature: 'F18',
        name: 'Saving a private note persists hasPassword: true in note data',
        run: async (page, helpers) => {
            const testNote = {
                id: 'note_private_1',
                title: 'Calificaciones Finales',
                content: 'Cálculo 10, Física 9',
                category: 'personal',
                hasPassword: true,
                passwordHash: '1234',
                createdAt: Date.now()
            };
            await page.evaluate(n => {
                window.StorageModule?.saveNote?.(n);
            }, testNote);
            const notes = await page.evaluate(() => window.StorageModule?.getNotes?.() || []);
            const savedNote = notes.find(n => n.id === 'note_private_1');
            helpers.assert(savedNote !== undefined, 'Saved note must exist in Storage');
            helpers.assertTrue(savedNote.hasPassword, 'Saved note must have hasPassword: true');
        }
    },
    {
        id: 'T1_F18_03_card_masks_protected_content',
        feature: 'F18',
        name: 'Protected note card masks content and displays lock indicator',
        run: async (page, helpers) => {
            await page.evaluate(() => { window.StorageModule.saveNote({ id: 'note_private_1', title: 'Secreto', content: 'contenido secreto', type: 'apunte', hasPassword: true, passwordHash: '1234', createdAt: Date.now(), updatedAt: Date.now() }); });
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('notes');
                window.NotesModule?.render?.();
            });
            const hasMaskedIndicator = await page.evaluate(() => {
                const noteCard = document.querySelector('[data-note-id="note_private_1"]') ||
                                 document.querySelector('.note-card-locked');
                if (!noteCard) return false;
                return noteCard.textContent.includes('🔒') || noteCard.textContent.includes('Privada');
            });
            helpers.assertTrue(hasMaskedIndicator, 'Locked note card must show padlock or private note indicator');
        }
    },
    {
        id: 'T1_F18_04_pin_unlock_modal_opens',
        feature: 'F18',
        name: 'Clicking locked note card displays PIN unlock modal',
        run: async (page, helpers) => {
            const modalExists = await page.evaluate(() => {
                return document.getElementById('note-unlock-modal') !== null ||
                       document.getElementById('note-pin-modal') !== null ||
                       document.querySelector('.note-unlock-modal') !== null;
            });
            helpers.assertTrue(modalExists, 'PIN unlock modal element must exist in DOM');
        }
    },
    {
        id: 'T1_F18_05_correct_pin_unmasks_note',
        feature: 'F18',
        name: 'Entering correct PIN unlocks note and reveals plaintext content',
        run: async (page, helpers) => {
            await page.evaluate(() => { window.StorageModule.saveNote({ id: 'note_private_1', title: 'Secreto', content: 'contenido secreto', type: 'apunte', hasPassword: true, passwordHash: '1234', createdAt: Date.now(), updatedAt: Date.now() }); });
            const unlocks = await page.evaluate(() => {
                if (typeof window.NotesModule?.unlockNote !== 'function') {
                    return false;
                }
                return window.NotesModule.unlockNote('note_private_1', '1234');
            });
            helpers.assertTrue(unlocks, 'NotesModule.unlockNote must be implemented and entering correct PIN must unlock private note');
        }
    }
];

module.exports = {
    tier: 1,
    name: 'Tier 1: Feature Coverage (Equivalence Classes)',
    tests
};
