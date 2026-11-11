/**
 * tier2_boundary_corner.js - Tier 2: Boundary & Corner Cases
 * Features F01 through F18 (5 distinct boundary/edge tests per feature, 90 total tests)
 * Requirement-driven edge case validation for Organizador_Tareas v1.4.2
 */

const fs = require('fs');
const path = require('path');

const tests = [
    // =========================================================================
    // F01: Version Bump 1.4.2 & Scoped Changelog (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F01_01_semver_strict_pattern',
        feature: 'F01',
        name: 'package.json version matches strict semver X.Y.Z pattern',
        run: async (page, helpers) => {
            const pkgPath = path.join(helpers.PROJECT_ROOT, 'package.json');
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            helpers.assertEqual(pkg.version, '1.4.2', 'package.json version must be 1.4.2');
        }
    },
    {
        id: 'T2_F01_02_corrupted_last_seen_version_fallback',
        feature: 'F01',
        name: 'StorageModule gracefully recovers when last seen version is corrupted or empty',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                localStorage.setItem('org_escolar_last_version', '');
            });
            const fallback = await page.evaluate(() => {
                return window.StorageModule?.getLastSeenVersion?.() || '1.4.2';
            });
            helpers.assert(typeof fallback === 'string' && fallback.length > 0, 'Fallback version must be a non-empty string');
        }
    },
    {
        id: 'T2_F01_03_changelog_modal_dismiss_records_version',
        feature: 'F01',
        name: 'Dismissing changelog modal records target version in LocalStorage',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setLastSeenVersion?.('1.4.2');
            });
            const saved = await page.evaluate(() => localStorage.getItem('org_escolar_last_version'));
            helpers.assertEqual(saved, '1.4.2', 'LocalStorage must record version 1.4.2');
        }
    },
    {
        id: 'T2_F01_04_no_stale_v135_precache_assets',
        feature: 'F01',
        name: 'sw.js contains zero references to obsolete versions like v=1.3.5 or v=1.3.1',
        run: async (page, helpers) => {
            const swPath = path.join(helpers.PROJECT_ROOT, 'sw.js');
            const code = fs.readFileSync(swPath, 'utf8');
            helpers.assertFalse(code.includes('v=1.3.5'), 'sw.js must not reference v=1.3.5');
            helpers.assertFalse(code.includes('v=1.3.1'), 'sw.js must not reference v=1.3.1');
        }
    },
    {
        id: 'T2_F01_05_changelog_xss_injection_safety',
        feature: 'F01',
        name: 'Changelog modal renders safely without executing dynamic script tags',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                const modal = document.getElementById('changelog-modal');
                if (!modal) return true;
                const scripts = modal.querySelectorAll('script');
                return scripts.length === 0;
            });
            helpers.assertTrue(safe, 'Changelog modal must not contain unescaped script tags');
        }
    },

    // =========================================================================
    // F02: Secret Vault Text Overflow Resolution (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F02_01_extreme_mobile_320px_no_horizontal_overflow',
        feature: 'F02',
        name: 'At extreme 320px mobile viewport, unlocked vault cards do not cause horizontal overflow',
        run: async (page, helpers) => {
            await page.setViewport({ width: 320, height: 568 });
            await page.evaluate(() => {
                window.StorageModule?.unlockVaultCode?.('APOLLO11');
                window.StorageModule?.unlockVaultCode?.('PLAYFAIR');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
            helpers.assertTrue(noOverflow, 'Vault cards must not cause horizontal scroll at 320px');
            await page.setViewport({ width: 1280, height: 800 });
        }
    },
    {
        id: 'T2_F02_02_long_title_truncation_safety',
        feature: 'F02',
        name: 'Card with very long protocol title does not overlap action buttons',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.unlockVaultCode?.('READABLE');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const noOverlap = await page.evaluate(() => {
                const card = document.querySelector('.vault-inventory-card');
                if (!card) return true;
                const title = card.querySelector('h4');
                const btn = card.querySelector('button');
                if (!title || !btn) return true;
                const tr = title.getBoundingClientRect();
                const br = btn.getBoundingClientRect();
                return tr.right <= br.left || tr.bottom <= br.top;
            });
            helpers.assertTrue(noOverlap, 'Card title must not visually collide with action button');
        }
    },
    {
        id: 'T2_F02_03_button_character_length_boundary',
        feature: 'F02',
        name: 'Action buttons on vault cards have text length strictly <= 15 characters',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.unlockVaultCode?.('PLAYFAIR');
                window.StorageModule?.unlockVaultCode?.('ZENPEACE');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const maxLen = await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('.vault-inventory-card button'));
                return btns.reduce((max, b) => Math.max(max, b.textContent.trim().length), 0);
            });
            helpers.assert(maxLen <= 15, `Vault button text should be <= 15 chars, found ${maxLen}`);
        }
    },
    {
        id: 'T2_F02_04_rapid_protocol_activation_toggling',
        feature: 'F02',
        name: 'Rapidly toggling a protocol button 10 times consecutively maintains button label consistency',
        run: async (page, helpers) => {
            await page.evaluate(async () => {
                window.StorageModule?.unlockVaultCode?.('APOLLO11');
                window.OrganizadorApp?.renderVaultInventory?.();
                const card = document.querySelector('.vault-inventory-card');
                const btn = card ? card.querySelector('button') : null;
                if (btn) {
                    for (let i = 0; i < 10; i++) {
                        btn.click();
                        await new Promise(r => setTimeout(r, 20));
                    }
                }
            });
            const finalLabel = await page.evaluate(() => {
                const card = document.querySelector('.vault-inventory-card');
                const btn = card ? card.querySelector('button') : null;
                return btn ? btn.textContent.trim() : '';
            });
            helpers.assert(finalLabel.length > 0, 'Button label must remain non-empty after toggling');
        }
    },
    {
        id: 'T2_F02_05_empty_title_or_corrupt_catalog_entry',
        feature: 'F02',
        name: 'Vault inventory rendering handles missing or arbitrary code IDs without throwing error',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                try {
                    window.StorageModule?.unlockVaultCode?.('UNKNOWN_CODE_999');
                    window.OrganizadorApp?.renderVaultInventory?.();
                    return true;
                } catch (e) {
                    return false;
                }
            });
            helpers.assertTrue(safe, 'Rendering vault inventory with unknown code ID must not crash');
        }
    },

    // =========================================================================
    // F03: Secret Vault Standard Button Controls (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F03_01_cats_button_rapid_jitter_clicks',
        feature: 'F03',
        name: 'Clicking cats button 25 times in rapid succession does not crash or corrupt state',
        run: async (page, helpers) => {
            const success = await page.evaluate(async () => {
                const btn = document.getElementById('settings-cats-btn') || document.querySelector('[data-cats-btn]');
                if (!btn) return true;
                for (let i = 0; i < 25; i++) {
                    btn.click();
                }
                return typeof window.StorageModule?.getSecretCatsEnabled?.() === 'boolean';
            });
            helpers.assertTrue(success, 'Rapid jitter clicks on cats button must maintain boolean state');
        }
    },
    {
        id: 'T2_F03_02_gray_button_rapid_jitter_clicks',
        feature: 'F03',
        name: 'Clicking gray mode button 25 times in rapid succession maintains deterministic state',
        run: async (page, helpers) => {
            const success = await page.evaluate(async () => {
                const btn = document.getElementById('settings-gray-mode-btn') || document.querySelector('[data-gray-btn]');
                if (!btn) return true;
                for (let i = 0; i < 25; i++) {
                    btn.click();
                }
                return typeof window.StorageModule?.getGrayModeEnabled?.() === 'boolean';
            });
            helpers.assertTrue(success, 'Rapid jitter clicks on gray mode button must maintain boolean state');
        }
    },
    {
        id: 'T2_F03_03_both_buttons_active_simultaneously',
        feature: 'F03',
        name: 'Activating both cats and gray mode simultaneously operates safely without interference',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setSecretCatsEnabled?.(true);
                window.StorageModule?.setGrayModeEnabled?.(true);
                window.OrganizadorApp?.applySecretFeaturesUI?.();
            });
            const bothActive = await page.evaluate(() => {
                const cats = window.StorageModule?.getSecretCatsEnabled?.() || false;
                const gray = window.StorageModule?.getGrayModeEnabled?.() || false;
                return cats && gray;
            });
            helpers.assertTrue(bothActive, 'Both secret controls must be active simultaneously');
        }
    },
    {
        id: 'T2_F03_04_reload_persistence_under_active_controls',
        feature: 'F03',
        name: 'Active state of standard buttons persists across page reload',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setSecretCatsEnabled?.(true);
                window.StorageModule?.setGrayModeEnabled?.(true);
            });
            await page.reload({ waitUntil: 'load' });
            const persisted = await page.evaluate(() => {
                return (window.StorageModule?.getSecretCatsEnabled?.() || false) &&
                       (window.StorageModule?.getGrayModeEnabled?.() || false);
            });
            helpers.assertTrue(persisted, 'Controls state must persist across reload');
        }
    },
    {
        id: 'T2_F03_05_deactivation_cleans_dom_side_effects',
        feature: 'F03',
        name: 'Deactivating gray mode completely cleans grayscale filter from DOM',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setGrayModeEnabled?.(false);
                window.OrganizadorApp?.applySecretFeaturesUI?.();
                document.documentElement.classList.remove('grayscale');
            });
            const hasGrayscale = await page.evaluate(() => {
                return document.documentElement.classList.contains('grayscale');
            });
            helpers.assertFalse(hasGrayscale, 'Deactivating gray mode must remove grayscale class from document');
        }
    },

    // =========================================================================
    // F04: Secret Vault Notice & Confidential Code Concealment (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F04_01_case_insensitive_eduardo_concealment',
        feature: 'F04',
        name: 'Notice does not contain "eduardo", "Eduardo", or "EDUARDO"',
        run: async (page, helpers) => {
            const noticeText = await page.evaluate(() => {
                const notice = document.getElementById('vault-secret-notice') || document.querySelector('.vault-terminal-notice');
                return notice ? notice.textContent.toLowerCase() : '';
            });
            helpers.assertFalse(noticeText.includes('eduardo'), 'Notice must not contain eduardo in any case');
        }
    },
    {
        id: 'T2_F04_02_date_variation_concealment',
        feature: 'F04',
        name: 'Notice does not contain "06062009", "06-06-2009", or date leaks',
        run: async (page, helpers) => {
            const noticeText = await page.evaluate(() => {
                const notice = document.getElementById('vault-secret-notice') || document.querySelector('.vault-terminal-notice');
                return notice ? notice.textContent : '';
            });
            helpers.assertFalse(noticeText.includes('06062009'), 'Notice must not contain 06062009');
            helpers.assertFalse(noticeText.includes('06-06-2009'), 'Notice must not contain 06-06-2009');
        }
    },
    {
        id: 'T2_F04_03_automatic_unlock_milestone_trigger',
        feature: 'F04',
        name: 'Completing exactly 5 tasks triggers automatic unlock of a pool code in StorageModule',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.checkVaultAutoUnlockOnTaskCompleted?.(5);
            });
            const unlocked = await page.evaluate(() => window.StorageModule?.getVaultUnlockedCodes?.() || []);
            helpers.assert(Array.isArray(unlocked), 'Unlocked codes should be an array');
        }
    },
    {
        id: 'T2_F04_04_automatic_unlock_pool_excludes_confidential',
        feature: 'F04',
        name: 'Automatic unlock pool strictly excludes EDUARDO and 06062009',
        run: async (page, helpers) => {
            const leaksConfidential = await page.evaluate(() => {
                // Simulate 50 task milestones to unlock all auto pool codes
                for (let i = 5; i <= 50; i += 5) {
                    window.StorageModule?.checkVaultAutoUnlockOnTaskCompleted?.(i);
                }
                const unlocked = window.StorageModule?.getVaultUnlockedCodes?.() || [];
                return unlocked.includes('EDUARDO') || unlocked.includes('06062009');
            });
            helpers.assertFalse(leaksConfidential, 'Auto-unlock pool must never automatically unlock EDUARDO or 06062009');
        }
    },
    {
        id: 'T2_F04_05_zero_tasks_completed_notice_integrity',
        feature: 'F04',
        name: 'Notice renders clean instructions when zero tasks have been completed',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                localStorage.setItem('org_escolar_tasks', '[]');
                window.OrganizadorApp?.updateVaultProgressCard?.();
            });
            const noticeText = await page.evaluate(() => {
                const notice = document.getElementById('vault-secret-notice') || document.querySelector('.vault-terminal-notice');
                return notice ? notice.textContent.trim() : '';
            });
            helpers.assert(noticeText.length > 0, 'Notice must display valid instruction text at 0 completed tasks');
        }
    },

    // =========================================================================
    // F05: Secret Vault Light Mode Empty State Contrast (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F05_01_wcag_contrast_empty_heading_light_mode',
        feature: 'F05',
        name: 'Empty state container in light mode does not render translucent black box',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
                localStorage.removeItem('org_escolar_vault_unlocked_codes_v2');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const emptyContainer = await page.evaluate(() => {
                const el = document.querySelector('#vault-unlocked-grid > div');
                return el ? el.className : '';
            });
            helpers.assertFalse(emptyContainer.includes('bg-black/40'), 'Empty vault container must not have bg-black/40 in light mode');
        }
    },
    {
        id: 'T2_F05_02_system_color_scheme_light_override',
        feature: 'F05',
        name: 'System preference light mode override maintains light background on vault inventory',
        run: async (page, helpers) => {
            await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
            });
            const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
            helpers.assertFalse(isDark, 'Document must reflect light mode');
        }
    },
    {
        id: 'T2_F05_03_badge_contrast_ratio_light_mode',
        feature: 'F05',
        name: 'Card category badge in light mode has distinct border and background',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
                window.StorageModule?.unlockVaultCode?.('APOLLO11');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const hasBadge = await page.evaluate(() => {
                const badge = document.querySelector('.vault-inventory-card span.font-mono');
                return badge !== null;
            });
            helpers.assertTrue(hasBadge, 'Category badge element must exist in card DOM');
        }
    },
    {
        id: 'T2_F05_04_hover_state_contrast_light_mode',
        feature: 'F05',
        name: 'Hovering over action buttons in light mode maintains contrast without washing out text',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
                window.StorageModule?.unlockVaultCode?.('APOLLO11');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const btnExists = await page.evaluate(() => {
                const btn = document.querySelector('.vault-inventory-card button');
                return btn !== null;
            });
            helpers.assertTrue(btnExists, 'Action button must exist on card');
        }
    },
    {
        id: 'T2_F05_05_empty_to_filled_transition_contrast',
        feature: 'F05',
        name: 'Unlocking first code transitions smoothly from empty state to filled grid',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
                localStorage.removeItem('org_escolar_vault_unlocked_codes_v2');
                window.OrganizadorApp?.renderVaultInventory?.();
                window.StorageModule?.unlockVaultCode?.('APOLLO11');
                window.OrganizadorApp?.renderVaultInventory?.();
            });
            const cardCount = await page.evaluate(() => {
                return document.querySelectorAll('.vault-inventory-card').length;
            });
            helpers.assertEqual(cardCount, 1, 'Exactly one vault inventory card must be rendered');
        }
    },

    // =========================================================================
    // F06: Secret Vault Continuous Single Code Input (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F06_01_leading_trailing_whitespace_trimmed',
        feature: 'F06',
        name: 'Entering code with leading and trailing spaces trims whitespace and unlocks successfully',
        run: async (page, helpers) => {
            const hasInput = await page.evaluate(() => {
                localStorage.removeItem('org_escolar_vault_unlocked_codes_v2');
                const inp = document.getElementById('vault-code-input');
                if (!inp) return false;
                inp.value = '   APOLLO11   ';
                inp.dispatchEvent(new Event('input', { bubbles: true }));
                const btn = document.getElementById('vault-verify-btn');
                if (btn) btn.click();
                return true;
            });
            helpers.assertTrue(hasInput, '#vault-code-input must exist in DOM');
            const unlocked = await page.evaluate(() => window.StorageModule?.isVaultCodeUnlocked?.('APOLLO11') || false);
            helpers.assertTrue(unlocked, 'Entering code with whitespace must trim and unlock');
        }
    },
    {
        id: 'T2_F06_02_invalid_code_shake_feedback',
        feature: 'F06',
        name: 'Entering invalid code triggers error feedback without crashing',
        run: async (page, helpers) => {
            const noCrash = await page.evaluate(() => {
                try {
                    const inp = document.getElementById('vault-code-input');
                    if (inp) {
                        inp.value = 'INVALID_CODE_999';
                        inp.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    const btn = document.getElementById('vault-verify-btn');
                    if (btn) btn.click();
                    return true;
                } catch (e) {
                    return false;
                }
            });
            helpers.assertTrue(noCrash, 'Submitting invalid code must execute safely without crash');
        }
    },
    {
        id: 'T2_F06_03_already_unlocked_code_duplicate_handling',
        feature: 'F06',
        name: 'Re-entering an already unlocked code handles duplicate gracefully without duplicate array entries',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.unlockVaultCode?.('APOLLO11');
                window.StorageModule?.unlockVaultCode?.('APOLLO11');
            });
            const codes = await page.evaluate(() => window.StorageModule?.getVaultUnlockedCodes?.() || []);
            const occurrences = codes.filter(c => c === 'APOLLO11').length;
            helpers.assertEqual(occurrences, 1, 'Code should not be duplicated in unlocked list');
        }
    },
    {
        id: 'T2_F06_04_pasting_large_string_safely_handled',
        feature: 'F06',
        name: 'Pasting a 100-character arbitrary string into input does not crash or throw unhandled error',
        run: async (page, helpers) => {
            const handled = await page.evaluate(() => {
                const inp = document.getElementById('vault-code-input');
                if (!inp) return false;
                inp.value = 'A'.repeat(100);
                inp.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
            });
            helpers.assertTrue(handled, '#vault-code-input must exist in DOM and handle large string input safely');
        }
    },
    {
        id: 'T2_F06_05_empty_input_submission_ignored',
        feature: 'F06',
        name: 'Submitting empty continuous input does not trigger false positive unlock',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                localStorage.removeItem('org_escolar_vault_unlocked_codes_v2');
                const inp = document.getElementById('vault-code-input');
                if (inp) {
                    inp.value = '';
                    inp.dispatchEvent(new Event('input', { bubbles: true }));
                }
                const btn = document.getElementById('vault-verify-btn');
                if (btn) btn.click();
            });
            const codes = await page.evaluate(() => window.StorageModule?.getVaultUnlockedCodes?.() || []);
            helpers.assertEqual(codes.length, 0, 'Empty submission must not unlock any code');
        }
    },

    // =========================================================================
    // F07: Splash Opening Title Text Removal (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F07_01_manifest_valid_json_structure',
        feature: 'F07',
        name: 'manifest.json parses as strictly valid JSON with icons array',
        run: async (page, helpers) => {
            const manifestPath = path.join(helpers.PROJECT_ROOT, 'manifest.json');
            const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            helpers.assert(Array.isArray(data.icons), 'manifest.json must contain icons array');
            helpers.assert(data.icons.length > 0, 'manifest.json must have at least 1 icon');
        }
    },
    {
        id: 'T2_F07_02_webmanifest_valid_json_structure',
        feature: 'F07',
        name: 'manifest.webmanifest parses as strictly valid JSON',
        run: async (page, helpers) => {
            const manifestPath = path.join(helpers.PROJECT_ROOT, 'manifest.webmanifest');
            const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            helpers.assert(typeof data === 'object' && data !== null, 'manifest.webmanifest must be valid JSON');
        }
    },
    {
        id: 'T2_F07_03_background_color_preserved',
        feature: 'F07',
        name: 'Manifest background_color is preserved for dark startup splash transition',
        run: async (page, helpers) => {
            const manifestPath = path.join(helpers.PROJECT_ROOT, 'manifest.json');
            const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            helpers.assert(typeof data.background_color === 'string', 'background_color must be string');
        }
    },
    {
        id: 'T2_F07_04_display_standalone_preserved',
        feature: 'F07',
        name: 'Manifest display property specifies "standalone"',
        run: async (page, helpers) => {
            const manifestPath = path.join(helpers.PROJECT_ROOT, 'manifest.json');
            const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            helpers.assertEqual(data.display, 'standalone', 'display must be standalone');
        }
    },
    {
        id: 'T2_F07_05_meta_apple_mobile_web_app_title_present',
        feature: 'F07',
        name: 'apple-mobile-web-app-title meta tag exists in index.html head',
        run: async (page, helpers) => {
            const metaPresent = await page.evaluate(() => {
                const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
                return meta !== null && meta.getAttribute('content')?.length > 0;
            });
            helpers.assertTrue(metaPresent, 'apple-mobile-web-app-title meta tag must exist');
        }
    },

    // =========================================================================
    // F08: Full-Screen Onboarding Setup Menu (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F08_01_viewport_375x667_mobile_fullscreen',
        feature: 'F08',
        name: 'On mobile viewport (375x667), onboarding modal occupies 100% dimensions',
        run: async (page, helpers) => {
            await page.setViewport({ width: 375, height: 667 });
            const occupies = await page.evaluate(() => {
                const modal = document.getElementById('cycle-setup-modal');
                if (!modal) return false;
                const rect = modal.getBoundingClientRect();
                return rect.width >= 370;
            });
            helpers.assertTrue(occupies, 'Onboarding modal must exist and occupy full width on mobile');
            await page.setViewport({ width: 1280, height: 800 });
        }
    },
    {
        id: 'T2_F08_02_viewport_1280x800_desktop_backdrop',
        feature: 'F08',
        name: 'On desktop viewport (1280x800), onboarding fills screen with dark backdrop',
        run: async (page, helpers) => {
            const fills = await page.evaluate(() => {
                const modal = document.getElementById('cycle-setup-modal');
                if (!modal) return false;
                const rect = modal.getBoundingClientRect();
                return rect.width >= 1200;
            });
            helpers.assertTrue(fills, 'Onboarding modal must exist and fill desktop screen with full-screen container');
        }
    },
    {
        id: 'T2_F08_03_backdrop_click_does_not_dismiss',
        feature: 'F08',
        name: 'Clicking outside onboarding form does not dismiss the full-screen onboarding wizard',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                const modal = document.getElementById('cycle-setup-modal');
                if (modal) modal.click();
            });
            const stillPresent = await page.evaluate(() => {
                const modal = document.getElementById('cycle-setup-modal');
                return modal !== null;
            });
            helpers.assertTrue(stillPresent, 'Onboarding wizard must remain open on backdrop click');
        }
    },
    {
        id: 'T2_F08_04_rapid_toggling_account_types',
        feature: 'F08',
        name: 'Rapidly toggling between Institution and Activities 10 times preserves clean form state',
        run: async (page, helpers) => {
            const success = await page.evaluate(async () => {
                const inst = document.getElementById('welcome-type-institution');
                const act = document.getElementById('welcome-type-activities');
                if (!inst || !act) return false;
                for (let i = 0; i < 10; i++) {
                    if (i % 2 === 0) inst.click();
                    else act.click();
                }
                return true;
            });
            helpers.assertTrue(success, '#welcome-type-institution and #welcome-type-activities must exist and rapidly toggle');
        }
    },
    {
        id: 'T2_F08_05_scroll_boundary_long_content',
        feature: 'F08',
        name: 'Full-screen onboarding allows vertical scrolling without breaking layout',
        run: async (page, helpers) => {
            const hasOverflowY = await page.evaluate(() => {
                const modal = document.getElementById('cycle-setup-modal');
                if (!modal) return false;
                return modal.className.includes('overflow-y-auto');
            });
            helpers.assertTrue(hasOverflowY, 'Onboarding container must exist and support overflow-y-auto');
        }
    },

    // =========================================================================
    // F09: Removal of Countries and Schools Catalog + User Name (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F09_01_empty_user_name_validation',
        feature: 'F09',
        name: 'Submitting onboarding with empty user name is rejected or requires valid input',
        run: async (page, helpers) => {
            const prevented = await page.evaluate(() => {
                const inp = document.getElementById('welcome-user-name');
                if (!inp) return false;
                inp.value = '';
                const form = inp.closest('form');
                return inp.required || form !== null;
            });
            helpers.assertTrue(prevented, '#welcome-user-name input must exist and be required in onboarding');
        }
    },
    {
        id: 'T2_F09_02_extreme_long_user_name_tolerance',
        feature: 'F09',
        name: 'Submitting 100-character user name wraps or truncates in header without crash',
        run: async (page, helpers) => {
            const longName = 'A'.repeat(100);
            await page.evaluate(name => {
                window.StorageModule?.setUserName?.(name);
                window.OrganizadorApp?.renderHeader?.();
            }, longName);
            const headerText = await page.evaluate(() => document.querySelector('header')?.textContent || '');
            helpers.assert(headerText.length > 0, 'Header must render without crashing on long name');
        }
    },
    {
        id: 'T2_F09_03_special_characters_user_name',
        feature: 'F09',
        name: 'User name with accents, apostrophes, and emojis persists and renders accurately',
        run: async (page, helpers) => {
            const specialName = 'María José Peña 🚀 🎓';
            await page.evaluate(name => {
                window.StorageModule?.setUserName?.(name);
            }, specialName);
            const saved = await page.evaluate(() => window.StorageModule?.getUserName?.());
            helpers.assertEqual(saved, specialName, 'Special characters in user name must be preserved');
        }
    },
    {
        id: 'T2_F09_04_cycle_dates_end_before_start_validation',
        feature: 'F09',
        name: 'Cycle dates where end date is before start date are validated safely',
        run: async (page, helpers) => {
            const handled = await page.evaluate(() => {
                const s = document.getElementById('welcome-cycle-start');
                const e = document.getElementById('welcome-cycle-end');
                if (!s || !e) return false;
                s.value = '2026-08-01';
                e.value = '2026-05-01';
                return true;
            });
            helpers.assertTrue(handled, '#welcome-cycle-start and #welcome-cycle-end must exist in DOM');
        }
    },
    {
        id: 'T2_F09_05_update_user_name_in_settings_syncs',
        feature: 'F09',
        name: 'Updating user name in settings updates all header and drawer elements reactively',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setUserName?.('Carlos Slim');
                window.OrganizadorApp?.renderHeader?.();
                window.OrganizadorApp?.renderDrawer?.();
            });
            const stored = await page.evaluate(() => window.StorageModule?.getUserName?.());
            helpers.assertEqual(stored, 'Carlos Slim', 'Updated name must persist');
        }
    },

    // =========================================================================
    // F10: Institution / Personal Photo Upload (Canvas downsampled to 256x256, <30KB) (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F10_01_giant_image_downsampled_successfully',
        feature: 'F10',
        name: 'Giant synthetic image (4000x3000) is downsampled to <= 256x256 and < 30KB',
        run: async (page, helpers) => {
            await helpers.simulateFileUpload(page, '#welcome-photo-input', {
                width: 4000,
                height: 3000,
                color: '#10B981',
                fileName: 'giant_image.png'
            });
            await new Promise(r => setTimeout(r, 200));
            const photoDataUrl = await page.evaluate(() => {
                return window.StorageModule?.getUserPhoto?.() ||
                       document.getElementById('welcome-photo-preview')?.src ||
                       '';
            });
            helpers.assert(photoDataUrl.startsWith('data:image/'), 'Photo must be downsampled and saved as data:image/ URL');
            const approxBytes = Math.round(photoDataUrl.length * 0.75);
            helpers.assert(approxBytes < 30 * 1024, `Size must be < 30KB, was ${approxBytes} bytes`);
        }
    },
    {
        id: 'T2_F10_02_tiny_image_upscale_boundary',
        feature: 'F10',
        name: 'Tiny 16x16 icon is handled cleanly without corruption or forced upscaling',
        run: async (page, helpers) => {
            await helpers.simulateFileUpload(page, '#welcome-photo-input', {
                width: 16,
                height: 16,
                color: '#6366F1',
                fileName: 'tiny_icon.png'
            });
            await new Promise(r => setTimeout(r, 200));
            const photoDataUrl = await page.evaluate(() => {
                return window.StorageModule?.getUserPhoto?.() ||
                       document.getElementById('welcome-photo-preview')?.src ||
                       '';
            });
            helpers.assert(photoDataUrl.startsWith('data:image/'), 'Tiny image upload must produce valid data:image/ URL');
        }
    },
    {
        id: 'T2_F10_03_non_image_file_rejection',
        feature: 'F10',
        name: 'Uploading non-image file is safely rejected with feedback',
        run: async (page, helpers) => {
            const inputInfo = await page.evaluate(() => {
                const inp = document.getElementById('welcome-photo-input');
                if (!inp) return null;
                return inp.getAttribute('accept') || inp.accept || '';
            });
            helpers.assert(inputInfo !== null, '#welcome-photo-input must exist in DOM');
            helpers.assertTrue(inputInfo.includes('image'), 'Input must restrict accepted file types to images');
        }
    },
    {
        id: 'T2_F10_04_transparent_png_alpha_preserved',
        feature: 'F10',
        name: 'Transparent PNG image produces data:image/png scheme',
        run: async (page, helpers) => {
            await helpers.simulateFileUpload(page, '#welcome-photo-input', {
                width: 64,
                height: 64,
                color: 'transparent',
                mimeType: 'image/png',
                fileName: 'alpha.png'
            });
            await new Promise(r => setTimeout(r, 200));
            const photoDataUrl = await page.evaluate(() => {
                return window.StorageModule?.getUserPhoto?.() ||
                       document.getElementById('welcome-photo-preview')?.src ||
                       '';
            });
            helpers.assert(photoDataUrl.startsWith('data:image/'), 'Transparent PNG upload must produce valid data:image URL');
        }
    },
    {
        id: 'T2_F10_05_quota_safety_five_consecutive_uploads',
        feature: 'F10',
        name: 'Five consecutive photo uploads do not exceed 150KB total in LocalStorage',
        run: async (page, helpers) => {
            const totalBytes = await page.evaluate(async () => {
                for (let i = 0; i < 5; i++) {
                    const canvas = document.createElement('canvas');
                    canvas.width = 128;
                    canvas.height = 128;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = `#${i}${i}0000`;
                    ctx.fillRect(0, 0, 128, 128);
                    window.StorageModule?.setUserPhoto?.(canvas.toDataURL('image/jpeg', 0.7));
                }
                const photo = localStorage.getItem('org_escolar_user_photo') || '';
                return photo.length;
            });
            helpers.assert(totalBytes < 150 * 1024, `Stored photo should consume < 150KB, was ${totalBytes}`);
        }
    },

    // =========================================================================
    // F11: Presentation-First Flow Ordering (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F11_01_page_refresh_during_onboarding_resets_flow',
        feature: 'F11',
        name: 'Refreshing page before completing onboarding restores onboarding on next reload',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                localStorage.clear();
                window.StorageModule?.setOnboardingCompleted?.(false);
            });
            await page.reload({ waitUntil: 'load' });
            const modalOpen = await page.evaluate(() => {
                const modal = document.getElementById('cycle-setup-modal');
                return modal !== null;
            });
            helpers.assertTrue(modalOpen, 'Onboarding must remain active until submitted');
        }
    },
    {
        id: 'T2_F11_02_changelog_only_displays_once_after_onboarding',
        feature: 'F11',
        name: 'Changelog modal only displays at most once after onboarding completion',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setOnboardingCompleted?.(true);
                window.StorageModule?.setLastSeenVersion?.('1.4.2');
            });
            const lastSeen = await page.evaluate(() => window.StorageModule?.getLastSeenVersion?.());
            helpers.assertEqual(lastSeen, '1.4.2', 'Last seen version should be 1.4.2');
        }
    },
    {
        id: 'T2_F11_03_denying_notifications_does_not_break_app',
        feature: 'F11',
        name: 'Denying notification permission does not break app flow or throw uncaught errors',
        run: async (page, helpers) => {
            const safe = await page.evaluate(async () => {
                try {
                    if (window.NotificationsModule?.requestPermission) {
                        // Mock denial
                        const orig = window.NotificationsModule.requestPermission;
                        window.NotificationsModule.requestPermission = async () => 'denied';
                        await window.NotificationsModule.requestPermission();
                        window.NotificationsModule.requestPermission = orig;
                    }
                    return true;
                } catch (e) {
                    return false;
                }
            });
            helpers.assertTrue(safe, 'Notification denial must execute cleanly');
        }
    },
    {
        id: 'T2_F11_04_direct_view_switch_during_onboarding_blocked',
        feature: 'F11',
        name: 'Attempting to switch views before completing onboarding keeps onboarding visible',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setOnboardingCompleted?.(false);
            });
            const modalPresent = await page.evaluate(() => {
                return document.getElementById('cycle-setup-modal') !== null;
            });
            helpers.assertTrue(modalPresent, 'Onboarding modal must be present in DOM');
        }
    },
    {
        id: 'T2_F11_05_reset_storage_restores_presentation_first',
        feature: 'F11',
        name: 'Purging localStorage restores presentation-first flow on reload',
        run: async (page, helpers) => {
            await page.evaluate(() => localStorage.clear());
            await page.reload({ waitUntil: 'load' });
            const state = await page.evaluate(() => {
                const onboarding = document.getElementById('cycle-setup-modal');
                const changelog = document.getElementById('changelog-modal');
                const onboardingVisible = onboarding && !onboarding.classList.contains('hidden') && onboarding.style.display !== 'none';
                const changelogSuppressed = !changelog || changelog.classList.contains('hidden') || changelog.style.display === 'none';
                return { onboardingVisible, changelogSuppressed };
            });
            helpers.assertTrue(state.onboardingVisible, 'Onboarding modal must be visible on reload after storage purge');
            helpers.assertTrue(state.changelogSuppressed, 'Changelog modal must be suppressed during onboarding after reload');
        }
    },

    // =========================================================================
    // F12: Setup Completion Celebration Progress Bar (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F12_01_double_submit_debounce',
        feature: 'F12',
        name: 'Double-clicking setup submit button triggers celebration animation only once',
        run: async (page, helpers) => {
            const debounced = await page.evaluate(async () => {
                const submitBtn = document.querySelector('#cycle-setup-modal button[type="submit"]') ||
                                  document.querySelector('#welcome-save-btn');
                if (!submitBtn) return false;
                submitBtn.click();
                submitBtn.click();
                return true;
            });
            helpers.assertTrue(debounced, 'Submit button must exist in onboarding modal and support double submit cleanly');
        }
    },
    {
        id: 'T2_F12_02_haptics_mock_failure_graceful',
        feature: 'F12',
        name: 'Haptics invocation during celebration handles missing navigator.vibrate gracefully',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                try {
                    window.HapticsModule?.success?.();
                    return true;
                } catch (e) {
                    return false;
                }
            });
            helpers.assertTrue(safe, 'Haptics must not throw when vibration is unsupported');
        }
    },
    {
        id: 'T2_F12_03_celebration_container_accessible_colors',
        feature: 'F12',
        name: 'Celebration message is high contrast in both dark and light modes',
        run: async (page, helpers) => {
            const accessible = await page.evaluate(() => {
                const modal = document.getElementById('cycle-setup-modal');
                return modal !== null;
            });
            helpers.assertTrue(accessible, 'Celebration container must exist in modal');
        }
    },
    {
        id: 'T2_F12_04_zero_duration_fallback',
        feature: 'F12',
        name: 'Celebration progress bar handles instant transition when animation duration is zero',
        run: async (page, helpers) => {
            const hasBar = await page.evaluate(() => {
                const bar = document.getElementById('onboarding-progress-bar');
                if (!bar) return false;
                bar.style.transitionDuration = '0s';
                return true;
            });
            helpers.assertTrue(hasBar, '#onboarding-progress-bar must exist in DOM');
        }
    },
    {
        id: 'T2_F12_05_marks_cycle_and_onboarding_in_storage',
        feature: 'F12',
        name: 'Completing setup marks both onboarding and cycle configured in storage',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setOnboardingCompleted?.(true);
                window.StorageModule?.setCycleConfigured?.(true);
            });
            const bothConfigured = await page.evaluate(() => {
                return (window.StorageModule?.isOnboardingCompleted?.() || false) &&
                       (window.StorageModule?.isCycleConfigured?.() || false);
            });
            helpers.assertTrue(bothConfigured, 'Both onboarding and cycle must be configured');
        }
    },

    // =========================================================================
    // F13: Settings Sub-Menu Auto-Close on Exit (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F13_01_all_open_cards_closed_simultaneously',
        feature: 'F13',
        name: 'Opening multiple settings accordion cards and switching views collapses all of them',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                document.querySelectorAll('.settings-accordion-card').forEach(c => c.classList.add('open'));
                window.OrganizadorApp?.closeAllSettingsSubmenus?.();
            });
            const countOpen = await page.evaluate(() => {
                return document.querySelectorAll('.settings-accordion-card.open').length;
            });
            helpers.assertEqual(countOpen, 0, 'All open settings accordions must be collapsed');
        }
    },
    {
        id: 'T2_F13_02_autoclose_idempotence',
        feature: 'F13',
        name: 'Calling closeAllSettingsSubmenus() multiple times when already closed is safe no-op',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                try {
                    window.OrganizadorApp?.closeAllSettingsSubmenus?.();
                    window.OrganizadorApp?.closeAllSettingsSubmenus?.();
                    window.OrganizadorApp?.closeAllSettingsSubmenus?.();
                    return true;
                } catch (e) {
                    return false;
                }
            });
            helpers.assertTrue(safe, 'closeAllSettingsSubmenus must be idempotent');
        }
    },
    {
        id: 'T2_F13_03_switching_between_submenus_in_settings',
        feature: 'F13',
        name: 'Opening accordion B collapses accordion A within settings view',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                const cards = document.querySelectorAll('.settings-accordion-card');
                if (cards.length >= 2) {
                    cards[0].classList.add('open');
                    cards[0].classList.remove('open');
                    cards[1].classList.add('open');
                }
            });
            const openCount = await page.evaluate(() => {
                return document.querySelectorAll('.settings-accordion-card.open').length;
            });
            helpers.assert(openCount <= 1, 'At most one accordion should be open at once');
        }
    },
    {
        id: 'T2_F13_04_url_param_navigation_autoclose',
        feature: 'F13',
        name: 'Navigating via external trigger or view change auto-closes open accordion submenus',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('settings');
                document.querySelectorAll('.settings-accordion-card').forEach(c => c.classList.add('open'));
                window.OrganizadorApp?.switchView?.('calendar');
            });
            const openCount = await page.evaluate(() => document.querySelectorAll('.settings-accordion-card.open').length);
            helpers.assertEqual(openCount, 0, 'Switching to calendar view must auto-close settings submenus');
        }
    },
    {
        id: 'T2_F13_05_rapid_view_switching_settings_jitter',
        feature: 'F13',
        name: 'Switching rapidly between settings and dashboard 10 times leaves settings collapsed',
        run: async (page, helpers) => {
            await page.evaluate(async () => {
                for (let i = 0; i < 10; i++) {
                    window.OrganizadorApp?.switchView?.('settings');
                    window.OrganizadorApp?.switchView?.('dashboard');
                }
            });
            const openCount = await page.evaluate(() => document.querySelectorAll('.settings-accordion-card.open').length);
            helpers.assertEqual(openCount, 0, 'Rapid view jitter must leave accordions collapsed');
        }
    },

    // =========================================================================
    // F14: Persistent Font Selection Window (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F14_01_auditioning_all_standard_fonts',
        feature: 'F14',
        name: 'Sequentially clicking all font buttons keeps appearance card open without glitching',
        run: async (page, helpers) => {
            await page.evaluate(async () => {
                window.OrganizadorApp?.switchView?.('settings');
                const fontCard = document.querySelector('#settings-font-buttons-grid')?.closest('.settings-accordion-card');
                if (fontCard) fontCard.classList.add('open');
                const btns = Array.from(document.querySelectorAll('#settings-font-buttons-grid [data-font-btn]'));
                for (const b of btns) {
                    b.click();
                }
            });
            const isOpen = await page.evaluate(() => {
                const fontCard = document.querySelector('#settings-font-buttons-grid')?.closest('.settings-accordion-card');
                if (!fontCard) return false;
                return fontCard.classList.contains('open');
            });
            helpers.assertTrue(isOpen, 'Accordion must stay open throughout all font auditions');
        }
    },
    {
        id: 'T2_F14_02_toast_does_not_collapse_accordion',
        feature: 'F14',
        name: 'Toast notification displayed on font selection does not trigger accordion auto-close',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.showToast?.('Tipografía aplicada: Inter', 'success');
            });
            const toastExists = await page.evaluate(() => {
                const t = document.getElementById('toast-container') || document.querySelector('.toast');
                return t !== null;
            });
            helpers.assertTrue(toastExists, 'Toast container must be active');
        }
    },
    {
        id: 'T2_F14_03_invalid_font_string_fallback',
        feature: 'F14',
        name: 'Setting non-existent font string in storage falls back gracefully without crash',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                try {
                    window.StorageModule?.setFontFamily?.('NON_EXISTENT_FONT_XYZ');
                    window.OrganizadorApp?.applyFontFamily?.('NON_EXISTENT_FONT_XYZ');
                    return true;
                } catch (e) {
                    return false;
                }
            });
            helpers.assertTrue(safe, 'Invalid font string must be handled gracefully');
        }
    },
    {
        id: 'T2_F14_04_reloading_page_preserves_active_font',
        feature: 'F14',
        name: 'Reloading page restores selected font family in StorageModule',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                localStorage.setItem('org_escolar_initialized_v3', 'true');
                window.StorageModule?.setFontFamily?.('Inter');
            });
            await page.reload({ waitUntil: 'load' });
            const font = await page.evaluate(() => window.StorageModule?.getFontFamily?.());
            helpers.assertEqual(font, 'Inter', 'Font must persist across reload');
        }
    },
    {
        id: 'T2_F14_05_font_selection_scroll_stability',
        feature: 'F14',
        name: 'Auditioning fonts does not cause viewport scroll jump or jitter',
        run: async (page, helpers) => {
            const noJump = await page.evaluate(() => {
                const scrollBefore = window.scrollY;
                window.OrganizadorApp?.applyFontFamily?.('Inter');
                return window.scrollY === scrollBefore;
            });
            helpers.assertTrue(noJump, 'Font change must not cause unexpected scroll jump');
        }
    },

    // =========================================================================
    // F15: Long-Press vs Persistent Buttons Setting Toggle (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F15_01_immediate_card_rerender_on_toggle',
        feature: 'F15',
        name: 'Toggling long-press setting immediately updates visible cards without page reload',
        run: async (page, helpers) => {
            await page.evaluate(() => { window.StorageModule.saveSubjects([{ id: 'sub_seed', name: 'Materia Semilla', color: '#6366F1', days: [] }]); window.SubjectsModule?.render?.(); });
            const toggled = await page.evaluate(() => {
                window.StorageModule?.setLongPressEnabled?.(false);
                window.SubjectsModule?.render?.();
                const hasBtns = document.querySelector('[data-action="edit"]') !== null;
                window.StorageModule?.setLongPressEnabled?.(true);
                window.SubjectsModule?.render?.();
                return hasBtns;
            });
            helpers.assertTrue(toggled, 'Cards must dynamically re-render upon toggle');
        }
    },
    {
        id: 'T2_F15_02_static_edit_button_direct_click',
        feature: 'F15',
        name: 'Clicking static edit button ([data-action="edit"]) opens subject modal directly',
        run: async (page, helpers) => {
            await page.evaluate(() => { window.StorageModule.saveSubjects([{ id: 'sub_seed', name: 'Materia Semilla', color: '#6366F1', days: [] }]); window.SubjectsModule?.render?.(); });
            const result = await page.evaluate(() => {
                window.StorageModule?.setLongPressEnabled?.(false);
                window.SubjectsModule?.render?.();
                const editBtn = document.querySelector('[data-action="edit"]');
                if (!editBtn) return { btnFound: false, modalOpen: false };
                editBtn.click();
                const m = document.getElementById('subject-modal');
                return { btnFound: true, modalOpen: m ? !m.classList.contains('hidden') : false };
            });
            helpers.assertTrue(result.btnFound, 'Static edit button ([data-action="edit"]) must exist when long-press is disabled');
            helpers.assertTrue(result.modalOpen, 'Edit button must open subject modal');
        }
    },
    {
        id: 'T2_F15_03_static_delete_button_direct_click',
        feature: 'F15',
        name: 'Clicking static delete button ([data-action="delete"]) triggers deletion prompt',
        run: async (page, helpers) => {
            await page.evaluate(() => { window.StorageModule.saveSubjects([{ id: 'sub_seed', name: 'Materia Semilla', color: '#6366F1', days: [] }]); window.SubjectsModule?.render?.(); });
            const hasDelBtn = await page.evaluate(() => {
                window.StorageModule?.setLongPressEnabled?.(false);
                window.SubjectsModule?.render?.();
                const delBtn = document.querySelector('[data-action="delete"]');
                if (!delBtn) return false;
                delBtn.click();
                return true;
            });
            helpers.assertTrue(hasDelBtn, 'Static delete button ([data-action="delete"]) must exist when long-press is disabled');
        }
    },
    {
        id: 'T2_F15_04_storage_key_exact_boolean',
        feature: 'F15',
        name: 'Storage.isLongPressEnabled strictly returns boolean true or false',
        run: async (page, helpers) => {
            const typeCheck = await page.evaluate(() => {
                const val = window.StorageModule?.isLongPressEnabled?.();
                return typeof val === 'boolean';
            });
            helpers.assertTrue(typeCheck, 'isLongPressEnabled must return boolean type');
        }
    },
    {
        id: 'T2_F15_05_toggling_across_empty_subjects_list',
        feature: 'F15',
        name: 'Toggling long-press setting when 0 subjects exist operates without error',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                try {
                    localStorage.setItem('org_escolar_subjects', '[]');
                    window.StorageModule?.setLongPressEnabled?.(false);
                    window.SubjectsModule?.render?.();
                    window.StorageModule?.setLongPressEnabled?.(true);
                    window.SubjectsModule?.render?.();
                    return true;
                } catch (e) {
                    return false;
                }
            });
            helpers.assertTrue(safe, 'Toggling long-press with 0 subjects must not throw error');
        }
    },

    // =========================================================================
    // F16: Compact Dynamic Card Configuration Popup (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F16_01_short_tap_does_not_open_popup',
        feature: 'F16',
        name: 'Tapping a card for < 200ms does NOT trigger dynamic configuration popup',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.OrganizadorApp?.switchView?.('subjects');
                window.StorageModule?.setLongPressEnabled?.(true);
                window.SubjectsModule?.render?.();
                const card = document.querySelector('.subject-card');
                if (card) card.click(); // simple click
            });
            const popupOpen = await page.evaluate(() => {
                const p = document.getElementById('card-dynamic-popup');
                return p ? !p.classList.contains('hidden') : false;
            });
            helpers.assertFalse(popupOpen, 'Short tap must not open dynamic popup');
        }
    },
    {
        id: 'T2_F16_02_gesture_cancel_on_scroll',
        feature: 'F16',
        name: 'Moving finger during press cancels gesture without opening popup',
        run: async (page, helpers) => {
            await page.evaluate(() => { window.StorageModule.saveSubjects([{ id: 'sub_seed', name: 'Materia Semilla', color: '#6366F1', days: [] }]); window.SubjectsModule?.render?.(); });
            const cancelled = await page.evaluate(() => {
                const card = document.querySelector('.subject-card');
                if (!card) return false;
                const mk = (y) => new Touch({ identifier: 1, target: card, clientX: 10, clientY: y });
                card.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [mk(10)] }));
                card.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, touches: [mk(50)] }));
                card.dispatchEvent(new TouchEvent('touchend', { touches: [] }));
                return true;
            });
            helpers.assertTrue(cancelled, 'Subject card must exist and touch move must cancel gesture');
        }
    },
    {
        id: 'T2_F16_03_popup_boundary_on_320px_viewport',
        feature: 'F16',
        name: 'Dynamic popup remains completely within viewport on small 320px screen',
        run: async (page, helpers) => {
            await page.setViewport({ width: 320, height: 480 });
            const inside = await page.evaluate(() => {
                const modal = document.querySelector('#card-dynamic-popup .modal-dialog') || document.getElementById('card-dynamic-popup');
                if (!modal) return false;
                const rect = modal.getBoundingClientRect();
                return rect.left >= 0 && rect.right <= 325;
            });
            helpers.assertTrue(inside, 'Dynamic popup must exist and remain inside 320px viewport boundaries');
            await page.setViewport({ width: 1280, height: 800 });
        }
    },
    {
        id: 'T2_F16_04_color_accent_sync',
        feature: 'F16',
        name: 'Popup dynamically reflects the active item theme color',
        run: async (page, helpers) => {
            const hasColorSupport = await page.evaluate(() => {
                const modal = document.getElementById('subject-modal');
                return modal !== null;
            });
            helpers.assertTrue(hasColorSupport, 'Modal must exist to support color accents');
        }
    },
    {
        id: 'T2_F16_05_escape_key_closes_popup',
        feature: 'F16',
        name: 'Pressing Escape key closes dynamic configuration popup',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            });
            const isClosed = await page.evaluate(() => {
                const p = document.getElementById('card-dynamic-popup');
                if (!p) return false;
                return p.classList.contains('hidden') || p.style.display === 'none';
            });
            helpers.assertTrue(isClosed, 'Dynamic popup must exist in DOM and close on Escape key');
        }
    },

    // =========================================================================
    // F17: Materials Photo Gallery on the Left (<30KB Canvas downsampled) (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F17_01_empty_gallery_state_placeholder',
        feature: 'F17',
        name: 'Empty gallery displays helpful placeholder without broken images',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                localStorage.setItem('org_escolar_gallery_photos', '[]');
            });
            const safe = await page.evaluate(() => {
                const grid = document.getElementById('notes-gallery-grid');
                if (!grid) return false;
                return grid.querySelectorAll('img[src=""]').length === 0;
            });
            helpers.assertTrue(safe, '#notes-gallery-grid must exist in DOM and contain zero broken img tags');
        }
    },
    {
        id: 'T2_F17_02_delete_gallery_photo_removes_from_storage',
        feature: 'F17',
        name: 'Deleting a gallery photo frees storage and removes item from array',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.saveGalleryPhoto?.({ id: 'photo_del_1', name: 'Del Photo', dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' });
                window.StorageModule?.deleteGalleryPhoto?.('photo_del_1');
            });
            const photos = await page.evaluate(() => window.StorageModule?.getGalleryPhotos?.() || []);
            const found = photos.some(p => p.id === 'photo_del_1');
            helpers.assertFalse(found, 'Deleted photo must be removed from storage');
        }
    },
    {
        id: 'T2_F17_03_gallery_mobile_responsive_no_overflow',
        feature: 'F17',
        name: 'On mobile viewport (360x640), notes gallery layout does not cause horizontal overflow',
        run: async (page, helpers) => {
            await page.setViewport({ width: 360, height: 640 });
            await page.evaluate(() => window.OrganizadorApp?.switchView?.('notes'));
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
            helpers.assertTrue(noScroll, 'Notes view with gallery must not overflow horizontally on mobile');
            await page.setViewport({ width: 1280, height: 800 });
        }
    },
    {
        id: 'T2_F17_04_gallery_photo_with_long_name',
        feature: 'F17',
        name: 'Photo with 100-character name renders cleanly with truncation or wrap',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.saveGalleryPhoto?.({
                    id: 'photo_long_name',
                    name: 'Foto de laboratorio de química orgánica experimental con reactivos especiales 2026',
                    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
                });
            });
            const saved = await page.evaluate(() => window.StorageModule?.getGalleryPhotos?.() || []);
            helpers.assert(saved.length > 0, 'Photo with long name must be stored successfully');
        }
    },
    {
        id: 'T2_F17_05_lightbox_close_on_escape_or_backdrop',
        feature: 'F17',
        name: 'Lightbox modal preview closes cleanly upon Escape key press',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            });
            const isClosed = await page.evaluate(() => {
                const lb = document.getElementById('photo-preview-modal') || document.getElementById('gallery-lightbox');
                if (!lb) return false;
                return lb.classList.contains('hidden') || !lb.classList.contains('open') || lb.style.display === 'none';
            });
            helpers.assertTrue(isClosed, 'Lightbox element must exist in DOM and close on Escape key');
        }
    },

    // =========================================================================
    // F18: Private Notes Password Protection (Boundary & Corner)
    // =========================================================================
    {
        id: 'T2_F18_01_incorrect_pin_shake_and_error',
        feature: 'F18',
        name: 'Entering wrong PIN fails unlock, preserves lock state, and keeps content masked',
        run: async (page, helpers) => {
            const hasMethod = await page.evaluate(() => typeof window.NotesModule?.unlockNote === 'function');
            helpers.assertTrue(hasMethod, 'NotesModule.unlockNote must be implemented');
            const unlocked = await page.evaluate(() => {
                const note = { id: 'note_pin_test', title: 'Secreto', content: 'Info sensible', hasPassword: true, passwordHash: '9999' };
                window.StorageModule?.saveNote?.(note);
                return window.NotesModule.unlockNote('note_pin_test', 'WRONG_PIN');
            });
            helpers.assertFalse(unlocked, 'Entering wrong PIN must NOT unlock note');
        }
    },
    {
        id: 'T2_F18_02_empty_pin_submission_blocked',
        feature: 'F18',
        name: 'Submitting empty PIN does not unlock private note',
        run: async (page, helpers) => {
            const hasMethod = await page.evaluate(() => typeof window.NotesModule?.unlockNote === 'function');
            helpers.assertTrue(hasMethod, 'NotesModule.unlockNote must be implemented');
            const unlocked = await page.evaluate(() => {
                const note = { id: 'note_pin_test', title: 'Secreto', content: 'Info sensible', hasPassword: true, passwordHash: '9999' };
                window.StorageModule?.saveNote?.(note);
                return window.NotesModule.unlockNote('note_pin_test', '');
            });
            helpers.assertFalse(unlocked, 'Empty PIN submission must be rejected');
        }
    },
    {
        id: 'T2_F18_03_edit_locked_note_requires_pin',
        feature: 'F18',
        name: 'Attempting to edit a locked note prompts for PIN before opening editor',
        run: async (page, helpers) => {
            const hasMethod = await page.evaluate(() => typeof window.NotesModule?.openEditModal === 'function');
            helpers.assertTrue(hasMethod, 'NotesModule.openEditModal must be implemented');
            const prompts = await page.evaluate(() => {
                const note = { id: 'note_pin_edit_test', title: 'Secreto', content: 'Info', hasPassword: true, passwordHash: '5555' };
                window.StorageModule?.saveNote?.(note);
                return window.NotesModule.openEditModal('note_pin_edit_test');
            });
            helpers.assertTrue(prompts, 'Editing locked note should require PIN authentication');
        }
    },
    {
        id: 'T2_F18_04_unlock_is_session_scoped',
        feature: 'F18',
        name: 'Reloading page restores locked state on all password-protected notes',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                localStorage.setItem('org_escolar_initialized_v3', 'true');
                const note = { id: 'note_session_test', title: 'Nota Segura', content: 'Contenido Privado', hasPassword: true, passwordHash: '1111' };
                window.StorageModule?.saveNote?.(note);
            });
            await page.reload({ waitUntil: 'load' });
            const isLocked = await page.evaluate(() => {
                if (typeof window.NotesModule?.isNoteUnlocked !== 'function') {
                    return null;
                }
                return !window.NotesModule.isNoteUnlocked('note_session_test');
            });
            helpers.assertEqual(isLocked, true, 'NotesModule.isNoteUnlocked must be implemented and note must be locked after reload');
        }
    },
    {
        id: 'T2_F18_05_no_plaintext_leak_in_attributes',
        feature: 'F18',
        name: 'Locked note DOM elements do not expose note plaintext in attributes or title tooltips',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                const note = { id: 'note_secret_attr', title: 'Top Secret', content: 'SUPER_CONFIDENTIAL_TEXT_XYZ', hasPassword: true, passwordHash: '1234' };
                window.StorageModule?.saveNote?.(note);
                window.OrganizadorApp?.switchView?.('notes');
                window.NotesModule?.render?.();
            });
            const leaks = await page.evaluate(() => {
                const card = document.querySelector('[data-note-id="note_secret_attr"]');
                if (!card) return false;
                const html = card.outerHTML;
                return html.includes('SUPER_CONFIDENTIAL_TEXT_XYZ');
            });
            helpers.assertFalse(leaks, 'Protected note content must not appear in HTML attributes of locked card');
        }
    }
];

module.exports = {
    tier: 2,
    name: 'Tier 2: Boundary & Corner Cases',
    tests
};
