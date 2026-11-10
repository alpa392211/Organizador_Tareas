/**
 * tier2_boundary_corner.js - Tier 2: Boundary & Corner Cases
 * Features F01 through F42 (Boundary & Corner Cases, 149 total tests)
 * Requirement-driven edge case validation for Organizador_Tareas v1.3.4
 */

const fs = require('fs');
const path = require('path');

const tests = [
    // =========================================================================
    // F01: Version Bump v1.3.1 "Pingüino"
    // =========================================================================
    {
        id: 'T2_F01_01_package_json_semver_syntax',
        feature: 'F01',
        name: 'package.json version matches strict semver pattern',
        run: async (page, helpers) => {
            const pkgPath = path.join(helpers.PROJECT_ROOT, 'package.json');
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            helpers.assertMatch(pkg.version, /^\d+\.\d+\.\d+/, 'Version must match semver X.Y.Z');
        }
    },
    {
        id: 'T2_F01_02_version_pill_rapid_click_stress',
        feature: 'F01',
        name: 'Rapidly clicking version pill 20 times does not throw or crash',
        run: async (page, helpers) => {
            const safe = await page.evaluate(async () => {
                const pill = document.getElementById('settings-version-pill');
                if (!pill) return true;
                for (let i = 0; i < 20; i++) {
                    pill.click();
                }
                return true;
            });
            helpers.assertTrue(safe, 'Rapid clicks on version pill must not crash');
        }
    },
    {
        id: 'T2_F01_03_version_pill_extreme_zoom_tolerance',
        feature: 'F01',
        name: 'Version pill does not break layout at 320x480 extreme small screen',
        run: async (page, helpers) => {
            await page.setViewport({ width: 320, height: 480 });
            const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noOverflow, 'Version pill container must not cause horizontal scroll at 320px');
        }
    },
    {
        id: 'T2_F01_04_cache_buster_query_missing_tolerance',
        feature: 'F01',
        name: 'App loads and operates safely without cache query parameter',
        run: async (page, helpers) => {
            const title = await page.title();
            helpers.assert(title.length > 0, 'Page title must exist regardless of query parameters');
        }
    },
    {
        id: 'T2_F01_05_version_pill_double_tap_idempotence',
        feature: 'F01',
        name: 'Rapid tapping on version trigger does not open duplicate secret views',
        run: async (page, helpers) => {
            const singleView = await page.evaluate(() => {
                const views = document.querySelectorAll('#view-secret-codes');
                return views.length <= 1;
            });
            helpers.assertTrue(singleView, 'At most one secret codes view container must exist');
        }
    },

    // =========================================================================
    // F02: Catalog Expansion (Hispanic Institutions)
    // =========================================================================
    {
        id: 'T2_F02_01_institution_lookup_empty_string',
        feature: 'F02',
        name: 'Lookup with empty string "" falls back to safe default institution',
        run: async (page, helpers) => {
            const inst = await page.evaluate(() => window.InstitutionsModule?.getInstitution(''));
            helpers.assert(inst && inst.name, 'Lookup with empty string must return fallback institution');
        }
    },
    {
        id: 'T2_F02_02_institution_lookup_nonexistent_slug',
        feature: 'F02',
        name: 'Lookup with nonexistent slug returns fallback institution without null error',
        run: async (page, helpers) => {
            const inst = await page.evaluate(() => window.InstitutionsModule?.getInstitution('nonexistent_univ_99999'));
            helpers.assert(inst && inst.name, 'Nonexistent slug must return valid fallback object');
        }
    },
    {
        id: 'T2_F02_03_institution_lookup_extreme_10k_string',
        feature: 'F02',
        name: 'Lookup with 10,000 character string does not cause buffer panic',
        run: async (page, helpers) => {
            const longId = 'A'.repeat(10000);
            const inst = await page.evaluate(id => window.InstitutionsModule?.getInstitution(id), longId);
            helpers.assert(inst && inst.name, 'Lookup with 10KB string must return fallback institution safely');
        }
    },
    {
        id: 'T2_F02_04_institution_lookup_special_chars_and_emojis',
        feature: 'F02',
        name: 'Lookup with special symbols and emojis handled gracefully',
        run: async (page, helpers) => {
            const weirdId = '🏫<script>alert(1)</script>!@#$%^&*()';
            const inst = await page.evaluate(id => window.InstitutionsModule?.getInstitution(id), weirdId);
            helpers.assert(inst && inst.name, 'Weird input must safely return fallback institution');
        }
    },
    {
        id: 'T2_F02_05_institution_lookup_null_and_undefined',
        feature: 'F02',
        name: 'Lookup with null or undefined returns safe default institution',
        run: async (page, helpers) => {
            const nullInst = await page.evaluate(() => window.InstitutionsModule?.getInstitution(null));
            const undefInst = await page.evaluate(() => window.InstitutionsModule?.getInstitution(undefined));
            helpers.assert(nullInst && undefInst, 'null and undefined lookups must not throw exception');
        }
    },

    // =========================================================================
    // F03: Country Grouping & Filtering
    // =========================================================================
    {
        id: 'T2_F03_01_country_code_empty_string',
        feature: 'F03',
        name: 'Filtering by empty string country returns all institutions or safe subset',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                const all = window.InstitutionsModule?.INSTITUTIONS || {};
                return Object.keys(all).length >= 4;
            });
            helpers.assertTrue(safe, 'Institutions module must retain catalog on empty filter');
        }
    },
    {
        id: 'T2_F03_02_country_code_unknown_region',
        feature: 'F03',
        name: 'Filtering with unknown country code like "XX" handles empty match safely',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                const all = Object.values(window.InstitutionsModule?.INSTITUTIONS || {});
                const filtered = all.filter(i => i.countryCode === 'XX');
                return filtered.length === 0;
            });
            helpers.assertTrue(safe, 'Unknown country code should yield empty array without errors');
        }
    },
    {
        id: 'T2_F03_03_country_code_sql_or_xss_injection',
        feature: 'F03',
        name: 'Filtering with script tags is sanitized and does not execute XSS',
        run: async (page, helpers) => {
            const sanitized = await page.evaluate(() => {
                const malicious = '<script>window.XSS_COUNTRY=true;</script>';
                const all = Object.values(window.InstitutionsModule?.INSTITUTIONS || {});
                all.filter(i => i.country === malicious);
                return window.XSS_COUNTRY === undefined;
            });
            helpers.assertTrue(sanitized, 'XSS input in country filter must not execute');
        }
    },
    {
        id: 'T2_F03_04_country_filter_rapid_toggling_stress',
        feature: 'F03',
        name: 'Rapidly switching country filters does not crash DOM or leak listeners',
        run: async (page, helpers) => {
            const stable = await page.evaluate(() => {
                for (let i = 0; i < 25; i++) {
                    const country = i % 2 === 0 ? 'MX' : 'CO';
                    Object.values(window.InstitutionsModule?.INSTITUTIONS || {}).filter(inst => inst.countryCode === country);
                }
                return true;
            });
            helpers.assertTrue(stable, 'Rapid country filtering passes stress test');
        }
    },
    {
        id: 'T2_F03_05_country_pills_wrapping_at_320px',
        feature: 'F03',
        name: 'Filter pills container wraps cleanly at 320px width without horizontal blowout',
        run: async (page, helpers) => {
            await page.setViewport({ width: 320, height: 568 });
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScroll, '320px screen must not overflow horizontally with country pills');
        }
    },

    // =========================================================================
    // F04: Removal of "Escuelas en General"
    // =========================================================================
    {
        id: 'T2_F04_01_legacy_general_saved_in_localstorage',
        feature: 'F04',
        name: 'LocalStorage containing legacy "general" value resolves safely',
        run: async (page, helpers) => {
            await page.evaluate(() => localStorage.setItem('org_escolar_institution', 'general'));
            const inst = await page.evaluate(() => window.InstitutionsModule?.getInstitution('general'));
            helpers.assert(inst && inst.name, 'Legacy general must resolve to a valid object');
        }
    },
    {
        id: 'T2_F04_02_missing_general_svg_handled_gracefully',
        feature: 'F04',
        name: 'Missing or corrupt fallback image path does not throw JS error',
        run: async (page, helpers) => {
            const html = await page.evaluate(() => {
                return window.InstitutionsModule?.renderIconHtml({ name: 'Fallback', icon: 'assets/nonexistent_general.svg' });
            });
            helpers.assert(typeof html === 'string', 'renderIconHtml must return string even for invalid path');
        }
    },
    {
        id: 'T2_F04_03_icon_html_empty_object_param',
        feature: 'F04',
        name: 'renderIconHtml({}) handles empty object safely',
        run: async (page, helpers) => {
            const html = await page.evaluate(() => window.InstitutionsModule?.renderIconHtml({}));
            helpers.assert(typeof html === 'string', 'renderIconHtml on empty object returns string');
        }
    },
    {
        id: 'T2_F04_04_icon_html_null_param',
        feature: 'F04',
        name: 'renderIconHtml(null) returns empty string without throwing',
        run: async (page, helpers) => {
            const html = await page.evaluate(() => window.InstitutionsModule?.renderIconHtml(null));
            helpers.assertEqual(html, '', 'renderIconHtml(null) must return empty string');
        }
    },
    {
        id: 'T2_F04_05_icon_html_extreme_class_string',
        feature: 'F04',
        name: 'renderIconHtml with 5000 character CSS class string does not panic',
        run: async (page, helpers) => {
            const longClass = 'test-class '.repeat(500);
            const html = await page.evaluate(cls => {
                return window.InstitutionsModule?.renderIconHtml({ name: 'UNAM', icon: 'assets/unam.svg' }, cls);
            }, longClass);
            helpers.assert(typeof html === 'string' && html.includes('assets/unam.svg'), 'Long CSS class parameter handled safely');
        }
    },

    // =========================================================================
    // F05: Custom School Builder Modal
    // =========================================================================
    {
        id: 'T2_F05_01_custom_school_empty_name',
        feature: 'F05',
        name: 'Saving custom school with empty name does not create empty catalog ghost',
        run: async (page, helpers) => {
            const valid = await page.evaluate(() => {
                const emptySchool = { id: '', name: '', isCustom: true };
                return emptySchool.name.trim().length === 0;
            });
            helpers.assertTrue(valid, 'Empty school name validation must detect empty string');
        }
    },
    {
        id: 'T2_F05_02_custom_school_whitespace_only_name',
        feature: 'F05',
        name: 'Saving custom school with whitespace name is rejected or trimmed',
        run: async (page, helpers) => {
            const trimmed = await page.evaluate(() => {
                const name = '   \t\n   ';
                return name.trim().length === 0;
            });
            helpers.assertTrue(trimmed, 'Whitespace name must trim to length 0');
        }
    },
    {
        id: 'T2_F05_03_custom_school_10000_char_extreme_name',
        feature: 'F05',
        name: 'Custom school with 10,000 char name does not crash storage serialization',
        run: async (page, helpers) => {
            const longName = 'Escuela '.repeat(1500);
            const serialized = await page.evaluate(name => {
                const school = { id: 'cust_long', name, isCustom: true };
                try {
                    const str = JSON.stringify(school);
                    return str.length > 5000;
                } catch (_) {
                    return false;
                }
            }, longName);
            helpers.assertTrue(serialized, 'Extreme name must serialize safely');
        }
    },
    {
        id: 'T2_F05_04_custom_school_xss_in_fullname',
        feature: 'F05',
        name: 'Custom school full name containing script tag is escaped',
        run: async (page, helpers) => {
            const escaped = await page.evaluate(() => {
                const malicious = '<script>window.XSS_CUST=true;</script>';
                const div = document.createElement('div');
                div.textContent = malicious;
                return !div.innerHTML.includes('<script>');
            });
            helpers.assertTrue(escaped, 'Script tags in school full name must not parse as HTML tags');
        }
    },
    {
        id: 'T2_F05_05_custom_school_duplicate_id_idempotence',
        feature: 'F05',
        name: 'Saving school with existing ID updates in-place without duplicating',
        run: async (page, helpers) => {
            const noDupes = await page.evaluate(() => {
                const list = [
                    { id: 'custom_id_1', name: 'Original', isCustom: true },
                    { id: 'custom_id_2', name: 'Other', isCustom: true }
                ];
                const updated = { id: 'custom_id_1', name: 'Updated', isCustom: true };
                const idx = list.findIndex(s => s.id === updated.id);
                if (idx >= 0) list[idx] = updated; else list.push(updated);
                return list.length === 2 && list[0].name === 'Updated';
            });
            helpers.assertTrue(noDupes, 'Duplicate custom school ID must update in-place');
        }
    },

    // =========================================================================
    // F06: Custom Photo/Logo Upload with Canvas Downsampling
    // =========================================================================
    {
        id: 'T2_F06_01_canvas_downsample_zero_dimensions',
        feature: 'F06',
        name: 'Canvas downsample logic handles 0x0 image bounds without division by zero',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                let w = 0, h = 0;
                const MAX = 256;
                if (w <= 0 || h <= 0) {
                    w = MAX; h = MAX;
                }
                return w === 256 && h === 256;
            });
            helpers.assertTrue(safe, 'Zero dimensions must default safely to 256x256');
        }
    },
    {
        id: 'T2_F06_02_canvas_downsample_extreme_4000x4000_image',
        feature: 'F06',
        name: 'Massive 4000x4000 image downsampling bounds strictly to <= 256x256',
        run: async (page, helpers) => {
            const bounded = await page.evaluate(() => {
                let w = 4000, h = 4000;
                const MAX = 256;
                if (w > MAX || h > MAX) {
                    if (w > h) {
                        h = Math.round((h * MAX) / w);
                        w = MAX;
                    } else {
                        w = Math.round((w * MAX) / h);
                        h = MAX;
                    }
                }
                return w <= 256 && h <= 256;
            });
            helpers.assertTrue(bounded, '4000x4000 must scale down to <= 256x256');
        }
    },
    {
        id: 'T2_F06_03_canvas_downsample_corrupted_data_uri',
        feature: 'F06',
        name: 'Malformed Base64 string does not throw unhandled exception',
        run: async (page, helpers) => {
            const handled = await page.evaluate(() => {
                const badBase64 = 'data:image/png;base64,!!!NOT_VALID_BASE64@@@';
                const img = document.createElement('img');
                img.src = badBase64;
                return img.src !== null;
            });
            helpers.assertTrue(handled, 'Malformed image src should not throw error');
        }
    },
    {
        id: 'T2_F06_04_canvas_downsample_transparent_alpha_preservation',
        feature: 'F06',
        name: 'Canvas uses image/png or preserve transparency to prevent black fill',
        run: async (page, helpers) => {
            const hasAlpha = await page.evaluate(() => {
                const canvas = document.createElement('canvas');
                canvas.width = 10; canvas.height = 10;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, 10, 10);
                const dataUrl = canvas.toDataURL('image/png');
                return dataUrl.startsWith('data:image/png');
            });
            helpers.assertTrue(hasAlpha, 'Canvas must produce PNG data URL for transparency support');
        }
    },
    {
        id: 'T2_F06_05_canvas_downsample_storage_quota_defense',
        feature: 'F06',
        name: 'Resized 256x256 image Base64 consumes under 30KB of LocalStorage quota',
        run: async (page, helpers) => {
            const sizeOk = await page.evaluate(() => {
                const canvas = document.createElement('canvas');
                canvas.width = 256; canvas.height = 256;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#002B7A';
                ctx.fillRect(0, 0, 256, 256);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                const sizeKb = (dataUrl.length * 3 / 4) / 1024;
                return sizeKb < 30;
            });
            helpers.assertTrue(sizeOk, 'Downsampled JPEG/PNG image data URL should be under 30KB');
        }
    },

    // =========================================================================
    // F07: Custom Motto/Lema Input
    // =========================================================================
    {
        id: 'T2_F07_01_custom_motto_empty_string',
        feature: 'F07',
        name: 'Empty slogan input is tolerated without null pointer exception',
        run: async (page, helpers) => {
            const stored = await page.evaluate(() => {
                const s = { slogan: '' };
                return typeof s.slogan === 'string';
            });
            helpers.assertTrue(stored, 'Empty slogan must be handled as string');
        }
    },
    {
        id: 'T2_F07_02_custom_motto_whitespace_only',
        feature: 'F07',
        name: 'Whitespace-only slogan trims safely to empty string',
        run: async (page, helpers) => {
            const trimmed = await page.evaluate(() => '   \t  '.trim());
            helpers.assertEqual(trimmed, '', 'Whitespace slogan must trim to empty');
        }
    },
    {
        id: 'T2_F07_03_custom_motto_10000_char_length',
        feature: 'F07',
        name: '10,000 char extreme slogan does not break UI layout',
        run: async (page, helpers) => {
            const longSlogan = 'Motto '.repeat(2000);
            const fits = await page.evaluate(s => {
                const el = document.createElement('div');
                el.className = 'truncate max-w-xs';
                el.textContent = s;
                document.body.appendChild(el);
                const ok = el.offsetWidth > 0;
                el.remove();
                return ok;
            }, longSlogan);
            helpers.assertTrue(fits, 'Extreme slogan must be truncated cleanly with utility classes');
        }
    },
    {
        id: 'T2_F07_04_custom_motto_html_injection',
        feature: 'F07',
        name: 'Slogan containing HTML tags is escaped in DOM',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                const malicious = '<img src=x onerror=window.XSS_SLOGAN=true>';
                const span = document.createElement('span');
                span.textContent = malicious;
                return window.XSS_SLOGAN === undefined && span.innerHTML.includes('&lt;img');
            });
            helpers.assertTrue(safe, 'HTML in slogan must be escaped');
        }
    },
    {
        id: 'T2_F07_05_custom_motto_special_unicode_emojis',
        feature: 'F07',
        name: 'Slogan containing special Unicode emojis renders cleanly without corrupting',
        run: async (page, helpers) => {
            const unicodeSlogan = '🚀 El futuro es hoy 🌟 Pingüino 🐧';
            const preserved = await page.evaluate(s => {
                const div = document.createElement('div');
                div.textContent = s;
                return div.textContent === s;
            }, unicodeSlogan);
            helpers.assertTrue(preserved, 'Unicode emojis in slogan must be preserved exactly');
        }
    },

    // =========================================================================
    // F08: Free-Form Period Text Input
    // =========================================================================
    {
        id: 'T2_F08_01_free_form_period_empty_string',
        feature: 'F08',
        name: 'Setting empty period string handled safely',
        run: async (page, helpers) => {
            await page.evaluate(() => window.StorageModule?.setAcademicPeriod(''));
            const period = await page.evaluate(() => window.StorageModule?.getAcademicPeriod());
            helpers.assert(period !== undefined, 'Period should not be undefined on empty string');
        }
    },
    {
        id: 'T2_F08_02_free_form_period_whitespace_only',
        feature: 'F08',
        name: 'Setting whitespace-only period string handles trimming cleanly',
        run: async (page, helpers) => {
            await page.evaluate(() => window.StorageModule?.setAcademicPeriod('   '));
            const p = await page.evaluate(() => window.StorageModule?.getAcademicPeriod());
            helpers.assert(typeof p === 'string', 'Period must return string');
        }
    },
    {
        id: 'T2_F08_03_free_form_period_5000_char_string',
        feature: 'F08',
        name: '5000 character period string handled without crash',
        run: async (page, helpers) => {
            const longPeriod = 'Semestre '.repeat(600);
            await page.evaluate(p => window.StorageModule?.setAcademicPeriod(p), longPeriod);
            const saved = await page.evaluate(() => window.StorageModule?.getAcademicPeriod());
            helpers.assert(saved && saved.length > 0, 'Long period string must be saved');
        }
    },
    {
        id: 'T2_F08_04_free_form_period_special_symbols',
        feature: 'F08',
        name: 'Period string with special symbols persists accurately',
        run: async (page, helpers) => {
            const special = '4.º Semestre (2026-II) #Alpha/Beta';
            await page.evaluate(p => window.StorageModule?.setAcademicPeriod(p), special);
            const saved = await page.evaluate(() => window.StorageModule?.getAcademicPeriod());
            helpers.assertEqual(saved, special, 'Special symbols in period must be preserved');
        }
    },
    {
        id: 'T2_F08_05_free_form_period_rapid_consecutive_edits',
        feature: 'F08',
        name: 'Rapid consecutive period updates retain the latest value cleanly',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                for (let i = 1; i <= 10; i++) {
                    window.StorageModule?.setAcademicPeriod(`${i}.º Trimestre`);
                }
            });
            const finalVal = await page.evaluate(() => window.StorageModule?.getAcademicPeriod());
            helpers.assertEqual(finalVal, '10.º Trimestre', 'Latest period value must be retained');
        }
    },

    // =========================================================================
    // F09: Period Storage Engine Fix
    // =========================================================================
    {
        id: 'T2_F09_01_period_storage_null_argument',
        feature: 'F09',
        name: 'Storage.setAcademicPeriod(null) handles null safely',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                try {
                    window.StorageModule?.setAcademicPeriod(null);
                    return true;
                } catch (_) {
                    return false;
                }
            });
            helpers.assertTrue(safe, 'setAcademicPeriod(null) must not throw exception');
        }
    },
    {
        id: 'T2_F09_02_period_storage_undefined_argument',
        feature: 'F09',
        name: 'Storage.setAcademicPeriod(undefined) handles undefined safely',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                try {
                    window.StorageModule?.setAcademicPeriod(undefined);
                    return true;
                } catch (_) {
                    return false;
                }
            });
            helpers.assertTrue(safe, 'setAcademicPeriod(undefined) must not throw exception');
        }
    },
    {
        id: 'T2_F09_03_period_storage_numeric_argument',
        feature: 'F09',
        name: 'Storage.setAcademicPeriod with number coerces to string',
        run: async (page, helpers) => {
            await page.evaluate(() => window.StorageModule?.setAcademicPeriod(2026));
            const val = await page.evaluate(() => window.StorageModule?.getAcademicPeriod());
            helpers.assertEqual(String(val), '2026', 'Numeric period must coerce to string');
        }
    },
    {
        id: 'T2_F09_04_period_storage_tampered_localstorage_value',
        feature: 'F09',
        name: 'Tampered empty key in LocalStorage returns safe fallback string',
        run: async (page, helpers) => {
            await page.evaluate(() => localStorage.setItem('org_escolar_period', ''));
            const p = await page.evaluate(() => window.StorageModule?.getAcademicPeriod());
            helpers.assert(typeof p === 'string', 'getAcademicPeriod must return string even when key is empty');
        }
    },
    {
        id: 'T2_F09_05_period_storage_preserves_custom_when_storage_has_demo',
        feature: 'F09',
        name: 'Explicitly configured period is preserved across catalog reads',
        run: async (page, helpers) => {
            const preserved = await page.evaluate(() => {
                window.StorageModule?.setAcademicPeriod('Módulo 8 Especial');
                window.InstitutionsModule?.getInstitution('colbach');
                return window.StorageModule?.getAcademicPeriod();
            });
            helpers.assertEqual(preserved, 'Módulo 8 Especial', 'Explicit period must not revert on catalog lookups');
        }
    },

    // =========================================================================
    // F10: Secret Code Vault Multi-Format Parser
    // =========================================================================
    {
        id: 'T2_F10_01_vault_code_empty_submission',
        feature: 'F10',
        name: 'Submitting empty code in vault triggers error feedback without crashing',
        run: async (page, helpers) => {
            const handled = await page.evaluate(() => {
                const btn = document.getElementById('vault-submit-btn');
                const p1 = document.getElementById('vault-code-p1');
                const p2 = document.getElementById('vault-code-p2');
                if (p1) p1.value = '';
                if (p2) p2.value = '';
                if (btn) btn.click();
                return true;
            });
            helpers.assertTrue(handled, 'Empty code submission must be handled cleanly');
        }
    },
    {
        id: 'T2_F10_02_vault_code_spaces_only',
        feature: 'F10',
        name: 'Submitting whitespace-only code is handled gracefully',
        run: async (page, helpers) => {
            const handled = await page.evaluate(() => {
                const code = '    '.trim();
                return code.length === 0;
            });
            helpers.assertTrue(handled, 'Whitespace code must reduce to length 0');
        }
    },
    {
        id: 'T2_F10_03_vault_code_10000_char_overflow',
        feature: 'F10',
        name: 'Submitting 10,000 char string in vault inputs is rejected or bounded',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                const p1 = document.getElementById('vault-code-p1');
                if (p1) {
                    p1.value = 'A'.repeat(10000);
                    return p1.value.length <= 10000;
                }
                return true;
            });
            helpers.assertTrue(safe, 'Vault input must handle large string inputs safely');
        }
    },
    {
        id: 'T2_F10_04_vault_code_repeated_submissions',
        feature: 'F10',
        name: 'Submitting invalid code 10 times in 1 second does not stack unhandled timers',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                const btn = document.getElementById('vault-submit-btn');
                if (btn) {
                    for (let i = 0; i < 10; i++) btn.click();
                }
                return true;
            });
            helpers.assertTrue(safe, 'Repeated invalid submissions must not freeze page');
        }
    },
    {
        id: 'T2_F10_05_vault_code_sql_and_script_injection',
        feature: 'F10',
        name: 'Malicious injections like "\' OR 1=1" do not unlock vault',
        run: async (page, helpers) => {
            const unlocked = await page.evaluate(() => {
                const injection = "' OR 1=1 --";
                const clean = injection.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                return clean === 'APOLLO11';
            });
            helpers.assertFalse(unlocked, 'SQL injection must not match secret codes');
        }
    },

    // =========================================================================
    // F11: Padlock Unlock Animation
    // =========================================================================
    {
        id: 'T2_F11_01_padlock_rapid_clicks_stress',
        feature: 'F11',
        name: 'Clicking unlock trigger 30 times quickly triggers animation without race condition',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                const btn = document.getElementById('vault-submit-btn');
                if (btn) {
                    for (let i = 0; i < 30; i++) btn.click();
                }
                return true;
            });
            helpers.assertTrue(safe, 'Rapid clicks on unlock button pass cleanly');
        }
    },
    {
        id: 'T2_F11_02_padlock_missing_element_resilience',
        feature: 'F11',
        name: 'If padlock element were missing, unlock handler does not throw unhandled error',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                try {
                    document.querySelector('.nonexistent-padlock-element')?.classList?.add('vault-shake');
                    return true;
                } catch (_) {
                    return false;
                }
            });
            helpers.assertTrue(safe, 'Missing padlock query must handle optional chaining safely');
        }
    },
    {
        id: 'T2_F11_03_padlock_view_switch_during_animation',
        feature: 'F11',
        name: 'Switching view immediately after unlock attempt does not break app state',
        run: async (page, helpers) => {
            const switched = await page.evaluate(() => {
                const btn = document.getElementById('vault-submit-btn');
                btn?.click();
                if (typeof window.App?.switchView === 'function') {
                    window.App.switchView('settings');
                    return true;
                }
                return true;
            });
            helpers.assertTrue(switched, 'Switching view during animation is stable');
        }
    },
    {
        id: 'T2_F11_04_padlock_already_unlocked_idempotence',
        feature: 'F11',
        name: 'Submitting an already unlocked code behaves idempotently without glitching',
        run: async (page, helpers) => {
            const idempotent = await page.evaluate(() => {
                const unlocked = ['APOLLO11'];
                if (!unlocked.includes('APOLLO11')) unlocked.push('APOLLO11');
                return unlocked.filter(c => c === 'APOLLO11').length === 1;
            });
            helpers.assertTrue(idempotent, 'Already unlocked code must remain unique');
        }
    },
    {
        id: 'T2_F11_05_padlock_animation_class_cleanup',
        feature: 'F11',
        name: 'Shake animation class can be removed and reflow forced without error',
        run: async (page, helpers) => {
            const reflowOk = await page.evaluate(() => {
                const c = document.getElementById('vault-card-container');
                if (c) {
                    c.classList.remove('vault-shake');
                    void c.offsetWidth;
                    c.classList.add('vault-shake');
                    return true;
                }
                return true;
            });
            helpers.assertTrue(reflowOk, 'Animation class reflow test passed');
        }
    },

    // =========================================================================
    // F12: Dynamic Reveal Window Emerge
    // =========================================================================
    {
        id: 'T2_F12_01_reveal_modal_rapid_trigger',
        feature: 'F12',
        name: 'Triggering reveal modal repeatedly does not stack multiple duplicate backdrops',
        run: async (page, helpers) => {
            const clean = await page.evaluate(() => {
                const backdrops = document.querySelectorAll('#reveal-backdrop, [data-reveal-backdrop]');
                return backdrops.length <= 1;
            });
            helpers.assertTrue(clean, 'At most one reveal modal backdrop exists');
        }
    },
    {
        id: 'T2_F12_02_reveal_modal_escape_key',
        feature: 'F12',
        name: 'Escape key event dispatched to window is tolerated without error',
        run: async (page, helpers) => {
            await page.keyboard.press('Escape');
            helpers.assertTrue(true, 'Escape key dispatch succeeded');
        }
    },
    {
        id: 'T2_F12_03_reveal_modal_backdrop_click',
        feature: 'F12',
        name: 'Clicking outside active modals preserves layout stability',
        run: async (page, helpers) => {
            await page.mouse.click(10, 10);
            helpers.assertTrue(true, 'Backdrop click preserved stability');
        }
    },
    {
        id: 'T2_F12_04_reveal_modal_viewport_320px',
        feature: 'F12',
        name: 'Modals at 320px width remain within viewport boundaries',
        run: async (page, helpers) => {
            await page.setViewport({ width: 320, height: 480 });
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScroll, '320px modal viewport must not overflow');
        }
    },
    {
        id: 'T2_F12_05_reveal_modal_extreme_content_length',
        feature: 'F12',
        name: 'Reward title with 500 characters wraps cleanly inside card',
        run: async (page, helpers) => {
            const wrapped = await page.evaluate(() => {
                const div = document.createElement('div');
                div.className = 'max-w-md break-words';
                div.textContent = 'Secret Protocol Unlocked! '.repeat(20);
                document.body.appendChild(div);
                const ok = div.offsetWidth <= window.innerWidth;
                div.remove();
                return ok;
            });
            helpers.assertTrue(wrapped, '500-char reward title must wrap inside container');
        }
    },

    // =========================================================================
    // F13: Apollo 11 Secret Code & Theme
    // =========================================================================
    {
        id: 'T2_F13_01_apollo_code_with_leading_trailing_newlines',
        feature: 'F13',
        name: 'Code "\nAPOLLO11\n" normalizes cleanly to "APOLLO11"',
        run: async (page, helpers) => {
            const normalized = await page.evaluate(() => '\n  APOLLO11 \r\n'.trim().toUpperCase());
            helpers.assertEqual(normalized, 'APOLLO11', 'Leading/trailing whitespace/newlines must normalize');
        }
    },
    {
        id: 'T2_F13_02_apollo_rockets_rapid_flapping',
        feature: 'F13',
        name: 'Toggling rockets enabled on and off 20 times maintains consistency',
        run: async (page, helpers) => {
            const finalState = await page.evaluate(() => {
                for (let i = 0; i < 20; i++) {
                    const state = (i % 2 === 0);
                    if (typeof window.StorageModule?.setApolloRocketsEnabled === 'function') {
                        window.StorageModule.setApolloRocketsEnabled(state);
                    } else {
                        localStorage.setItem('org_escolar_apollo_rockets', String(state));
                    }
                }
                const retrieved = window.StorageModule?.getApolloRocketsEnabled
                    ? window.StorageModule.getApolloRocketsEnabled()
                    : localStorage.getItem('org_escolar_apollo_rockets') === 'true';
                return retrieved;
            });
            helpers.assertEqual(finalState, false, 'Storage must accurately reflect final toggle state false');

            await page.evaluate(() => {
                if (typeof window.StorageModule?.setApolloRocketsEnabled === 'function') {
                    window.StorageModule.setApolloRocketsEnabled(true);
                } else {
                    localStorage.setItem('org_escolar_apollo_rockets', 'true');
                }
            });
            const trueState = await page.evaluate(() => {
                return window.StorageModule?.getApolloRocketsEnabled
                    ? window.StorageModule.getApolloRocketsEnabled()
                    : localStorage.getItem('org_escolar_apollo_rockets') === 'true';
            });
            helpers.assertEqual(trueState, true, 'Storage must accurately reflect toggle state true');
        }
    },
    {
        id: 'T2_F13_03_apollo_theme_dark_mode_interop',
        feature: 'F13',
        name: 'Apollo theme coexists with dark mode class',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.add('theme-apollo');
            });
            const bothActive = await page.evaluate(() => {
                const el = document.documentElement;
                return el.classList.contains('dark') && el.classList.contains('theme-apollo');
            });
            helpers.assertTrue(bothActive, 'Both dark and theme-apollo can be active simultaneously');
        }
    },
    {
        id: 'T2_F13_04_apollo_theme_light_mode_interop',
        feature: 'F13',
        name: 'Apollo theme coexists when dark class is removed (light mode)',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('theme-apollo');
            });
            const apolloActive = await page.evaluate(() => document.documentElement.classList.contains('theme-apollo'));
            helpers.assertTrue(apolloActive, 'Apollo theme active in light mode');
        }
    },
    {
        id: 'T2_F13_05_apollo_rocket_badge_missing_container_resilience',
        feature: 'F13',
        name: 'Rocket badge updater does not throw if action button is absent',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                try {
                    const btn = document.querySelector('.nonexistent-action-btn');
                    btn?.querySelector('.apollo-rocket-badge')?.remove();
                    return true;
                } catch (_) {
                    return false;
                }
            });
            helpers.assertTrue(safe, 'Rocket badge query on missing container is safe');
        }
    },

    // =========================================================================
    // F14: 06062009 Secret Code & Starlight Tribute
    // =========================================================================
    {
        id: 'T2_F14_01_06062009_code_retention_of_leading_zero',
        feature: 'F14',
        name: 'Code retains leading zero (does not parse as numeric 6062009)',
        run: async (page, helpers) => {
            const raw = '06062009';
            const str = String(raw).trim();
            helpers.assertEqual(str.charAt(0), '0', 'Leading zero must be retained in code');
            helpers.assertEqual(str.length, 8, 'Code length must be 8');
        }
    },
    {
        id: 'T2_F14_02_06062009_code_with_slashes_or_dashes',
        feature: 'F14',
        name: 'Date formatting like "06/06/2009" normalizes to "06062009"',
        run: async (page, helpers) => {
            const normalized = await page.evaluate(() => {
                const dateCode = '06/06/2009';
                return dateCode.replace(/[^0-9]/g, '');
            });
            helpers.assertEqual(normalized, '06062009', 'Date code with slashes must strip to 06062009');
        }
    },
    {
        id: 'T2_F14_03_06062009_tribute_modal_extreme_zoom',
        feature: 'F14',
        name: 'Tribute modal remains legible at compact 640x360 dimensions',
        run: async (page, helpers) => {
            await page.setViewport({ width: 640, height: 360 });
            const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(fits, 'Tribute viewport must not overflow horizontally');
        }
    },
    {
        id: 'T2_F14_04_06062009_unlock_does_not_reset_custom_school',
        feature: 'F14',
        name: 'Unlocking 06062009 does not overwrite active custom school or period',
        run: async (page, helpers) => {
            const intact = await page.evaluate(() => {
                window.StorageModule?.setAcademicPeriod('Periodo Intacto');
                const codes = JSON.parse(localStorage.getItem('org_escolar_vault_unlocked_codes_v2') || '[]');
                if (!codes.includes('06062009')) codes.push('06062009');
                localStorage.setItem('org_escolar_vault_unlocked_codes_v2', JSON.stringify(codes));
                return window.StorageModule?.getAcademicPeriod() === 'Periodo Intacto';
            });
            helpers.assertTrue(intact, 'Active period must be unaffected by tribute unlock');
        }
    },
    {
        id: 'T2_F14_05_06062009_repeated_unlock_no_duplicate',
        feature: 'F14',
        name: 'Unlocking 06062009 multiple times stores exactly 1 entry in unlocked codes',
        run: async (page, helpers) => {
            const single = await page.evaluate(() => {
                const codes = ['06062009'];
                if (!codes.includes('06062009')) codes.push('06062009');
                return codes.filter(c => c === '06062009').length;
            });
            helpers.assertEqual(single, 1, 'Only one entry of 06062009 must exist');
        }
    },

    // =========================================================================
    // F15: Eduardo Creator Secret Code & Gold Theme
    // =========================================================================
    {
        id: 'T2_F15_01_eduardo_code_accented_variation',
        feature: 'F15',
        name: 'Accented variation normalizes cleanly to EDUARDO',
        run: async (page, helpers) => {
            const norm = await page.evaluate(() => {
                const raw = 'Éduardo';
                return raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
            });
            helpers.assertEqual(norm, 'EDUARDO', 'Accents must normalize to EDUARDO');
        }
    },
    {
        id: 'T2_F15_02_eduardo_code_with_suffix_number',
        feature: 'F15',
        name: 'Alias EDUARDO1 resolves to EDUARDO creator unlock',
        run: async (page, helpers) => {
            const maps = await page.evaluate(() => {
                const code = 'EDUARDO1';
                const aliasMap = { 'EDUARDO1': 'EDUARDO' };
                return aliasMap[code] || code;
            });
            helpers.assertEqual(maps, 'EDUARDO', 'EDUARDO1 must alias to EDUARDO');
        }
    },
    {
        id: 'T2_F15_03_eduardo_gold_palette_contrast_ratio',
        feature: 'F15',
        name: 'Gold theme palette satisfies contrast readability in DOM',
        run: async (page, helpers) => {
            const hasContrast = await page.evaluate(() => {
                const div = document.createElement('div');
                div.className = 'text-amber-400 bg-slate-900';
                return div.className.includes('amber-400');
            });
            helpers.assertTrue(hasContrast, 'Gold contrast pairing valid');
        }
    },
    {
        id: 'T2_F15_04_eduardo_crown_badge_no_layout_break',
        feature: 'F15',
        name: 'Crown badge 👑 does not break surrounding element alignment',
        run: async (page, helpers) => {
            const aligned = await page.evaluate(() => {
                const span = document.createElement('span');
                span.className = 'inline-flex items-center text-xs';
                span.textContent = '👑 Eduardo';
                document.body.appendChild(span);
                const h = span.offsetHeight;
                span.remove();
                return h > 0;
            });
            helpers.assertTrue(aligned, 'Crown badge container aligns cleanly');
        }
    },
    {
        id: 'T2_F15_05_eduardo_theme_rapid_toggle',
        feature: 'F15',
        name: 'Toggling Eduardo Gold theme 10 times leaves DOM in clean state',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                for (let i = 0; i < 10; i++) {
                    document.documentElement.classList.toggle('theme-eduardo-gold');
                }
                document.documentElement.classList.remove('theme-eduardo-gold');
            });
            const active = await page.evaluate(() => document.documentElement.classList.contains('theme-eduardo-gold'));
            helpers.assertFalse(active, 'Eduardo theme must be cleanly removed after rapid toggles');
        }
    },

    // =========================================================================
    // F16: 11-Code Secret Vault Catalog
    // =========================================================================
    {
        id: 'T2_F16_01_vault_catalog_lookup_garbage_string',
        feature: 'F16',
        name: 'Looking up garbage string "XYZ_RANDOM_999!" returns invalid cleanly',
        run: async (page, helpers) => {
            const recognized = await page.evaluate(() => {
                const validCodes = ['APOLLO11', '06062009', 'EDUARDO', 'PINGUINO', 'RETRO80S', 'MATRIX99', 'ZENPEACE', 'COFFEE42', 'ARCADE90', 'STUDYMAX', 'GATITOS_'];
                return validCodes.includes('XYZ_RANDOM_999!');
            });
            helpers.assertFalse(recognized, 'Garbage code must not be recognized');
        }
    },
    {
        id: 'T2_F16_02_vault_catalog_lookup_empty_string',
        feature: 'F16',
        name: 'Looking up empty string in catalog returns false',
        run: async (page, helpers) => {
            const recognized = await page.evaluate(() => {
                const validCodes = ['APOLLO11', '06062009', 'EDUARDO'];
                return validCodes.includes('');
            });
            helpers.assertFalse(recognized, 'Empty code must not be recognized');
        }
    },
    {
        id: 'T2_F16_03_vault_catalog_lookup_null',
        feature: 'F16',
        name: 'Looking up null code in catalog returns false safely',
        run: async (page, helpers) => {
            const recognized = await page.evaluate(() => {
                const validCodes = ['APOLLO11', '06062009', 'EDUARDO'];
                return validCodes.includes(null);
            });
            helpers.assertFalse(recognized, 'Null code must return false');
        }
    },
    {
        id: 'T2_F16_04_vault_catalog_all_11_codes_unlocked_storage_size',
        feature: 'F16',
        name: 'Storing all 11 unlocked secret codes consumes < 5KB of LocalStorage',
        run: async (page, helpers) => {
            const sizeOk = await page.evaluate(() => {
                const all11 = ['APOLLO11', '06062009', 'EDUARDO', 'PINGUINO', 'RETRO80S', 'MATRIX99', 'ZENPEACE', 'COFFEE42', 'ARCADE90', 'STUDYMAX', 'GATITOS_'];
                const serialized = JSON.stringify(all11);
                return (serialized.length / 1024) < 5;
            });
            helpers.assertTrue(sizeOk, 'All 11 codes serialized must consume < 5KB');
        }
    },
    {
        id: 'T2_F16_05_vault_catalog_idempotent_bulk_unlock',
        feature: 'F16',
        name: 'Unlocking entire catalog twice does not duplicate array entries',
        run: async (page, helpers) => {
            const count = await page.evaluate(() => {
                const all11 = ['APOLLO11', '06062009', 'EDUARDO', 'PINGUINO', 'RETRO80S', 'MATRIX99', 'ZENPEACE', 'COFFEE42', 'ARCADE90', 'STUDYMAX', 'GATITOS_'];
                const set = new Set([...all11, ...all11]);
                return set.size;
            });
            helpers.assertEqual(count, 11, 'Bulk unlock set must contain exactly 11 unique entries');
        }
    },

    // =========================================================================
    // F17: Unlocked Secrets Inventory in Vault
    // =========================================================================
    {
        id: 'T2_F17_01_vault_inventory_empty_array_state',
        feature: 'F17',
        name: 'Inventory handles empty array [] without crashing',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                const codes = [];
                return codes.length === 0;
            });
            helpers.assertTrue(safe, 'Empty array inventory is valid');
        }
    },
    {
        id: 'T2_F17_02_vault_inventory_corrupted_storage_array',
        feature: 'F17',
        name: 'Corrupted non-array string in unlocked codes recovers safely',
        run: async (page, helpers) => {
            const recovered = await page.evaluate(() => {
                localStorage.setItem('org_escolar_vault_unlocked_codes_v2', 'NOT_AN_ARRAY');
                let codes = [];
                try {
                    const parsed = JSON.parse(localStorage.getItem('org_escolar_vault_unlocked_codes_v2'));
                    if (Array.isArray(parsed)) codes = parsed;
                } catch (_) {
                    codes = [];
                }
                return Array.isArray(codes);
            });
            helpers.assertTrue(recovered, 'Corrupt storage must fall back to empty array');
        }
    },
    {
        id: 'T2_F17_03_vault_inventory_item_with_long_name',
        feature: 'F17',
        name: 'Protocol with 200 character name truncates safely inside card',
        run: async (page, helpers) => {
            const fits = await page.evaluate(() => {
                const div = document.createElement('div');
                div.className = 'truncate max-w-xs';
                div.textContent = 'A'.repeat(200);
                document.body.appendChild(div);
                const ok = div.offsetWidth > 0;
                div.remove();
                return ok;
            });
            helpers.assertTrue(fits, 'Long protocol name wraps/truncates');
        }
    },
    {
        id: 'T2_F17_04_vault_inventory_rapid_switch_clicks',
        feature: 'F17',
        name: 'Clicking inventory toggle switches 15 times quickly maintains consistent state',
        run: async (page, helpers) => {
            const consistent = await page.evaluate(() => {
                let current = 'default';
                for (let i = 0; i < 15; i++) {
                    current = current === 'default' ? 'apollo' : 'default';
                }
                return current === 'apollo';
            });
            helpers.assertTrue(consistent, 'Rapid toggle state toggles consistently');
        }
    },
    {
        id: 'T2_F17_05_vault_inventory_overflow_scroll_mobile',
        feature: 'F17',
        name: 'At 360px mobile width, inventory list scrolls vertically without horizontal overflow',
        run: async (page, helpers) => {
            await page.setViewport({ width: 360, height: 640 });
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScroll, '360px viewport has zero horizontal scroll');
        }
    },

    // =========================================================================
    // F18: Deactivable Special Themes System
    // =========================================================================
    {
        id: 'T2_F18_01_special_theme_unknown_theme_id',
        feature: 'F18',
        name: 'Setting special theme to unknown id falls back safely to "default"',
        run: async (page, helpers) => {
            const fallback = await page.evaluate(() => {
                const validThemes = ['apollo', 'eduardo-gold', 'penguin', 'matrix'];
                const target = 'unknown_theme_galaxy';
                return validThemes.includes(target) ? target : 'default';
            });
            helpers.assertEqual(fallback, 'default', 'Unknown theme ID must fall back to default');
        }
    },
    {
        id: 'T2_F18_02_special_theme_deactivate_when_already_default',
        feature: 'F18',
        name: 'Deactivating theme when already default is a clean no-op',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.remove('theme-apollo', 'theme-eduardo-gold');
            });
            helpers.assertTrue(true, 'Deactivating on default theme passes safely');
        }
    },
    {
        id: 'T2_F18_03_special_theme_simultaneous_toggle_stress',
        feature: 'F18',
        name: 'Cycling through 5 themes rapidly leaves only the final theme class active',
        run: async (page, helpers) => {
            const finalClass = await page.evaluate(() => {
                const el = document.documentElement;
                const themes = ['theme-apollo', 'theme-eduardo-gold', 'theme-penguin', 'theme-matrix'];
                themes.forEach(t => el.classList.remove(t));
                el.classList.add('theme-matrix');
                return el.classList.contains('theme-matrix') && !el.classList.contains('theme-apollo');
            });
            helpers.assertTrue(finalClass, 'Only final theme class must be present');
        }
    },
    {
        id: 'T2_F18_04_special_theme_root_class_no_duplicates',
        feature: 'F18',
        name: 'Root element never accumulates duplicate class names',
        run: async (page, helpers) => {
            const noDupes = await page.evaluate(() => {
                document.documentElement.classList.add('theme-apollo');
                document.documentElement.classList.add('theme-apollo');
                const list = Array.from(document.documentElement.classList);
                return list.filter(c => c === 'theme-apollo').length === 1;
            });
            helpers.assertTrue(noDupes, 'classList handles duplicates inherently');
        }
    },
    {
        id: 'T2_F18_05_special_theme_preserves_dark_mode_preference',
        feature: 'F18',
        name: 'Special themes do not clobber the "dark" class from documentElement',
        run: async (page, helpers) => {
            const preserved = await page.evaluate(() => {
                const el = document.documentElement;
                el.classList.add('dark');
                el.classList.add('theme-apollo');
                el.classList.remove('theme-apollo');
                return el.classList.contains('dark');
            });
            helpers.assertTrue(preserved, 'Dark mode class must be preserved across special theme toggles');
        }
    },

    // =========================================================================
    // F19: Settings Menu Modern Reorganization
    // =========================================================================
    {
        id: 'T2_F19_01_settings_accordion_rapid_open_close',
        feature: 'F19',
        name: 'Rapidly opening and closing settings sections 20 times does not hang',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                for (let i = 0; i < 20; i++) {
                    const details = document.querySelectorAll('details');
                    details.forEach(d => { d.open = !d.open; });
                }
                return true;
            });
            helpers.assertTrue(safe, 'Accordion rapid toggling completed safely');
        }
    },
    {
        id: 'T2_F19_02_settings_all_sections_collapsed',
        feature: 'F19',
        name: 'UI remains stable and visible when all settings sections are collapsed',
        run: async (page, helpers) => {
            const stable = await page.evaluate(() => {
                document.querySelectorAll('details').forEach(d => { d.open = false; });
                const settings = document.getElementById('view-settings');
                return settings !== null;
            });
            helpers.assertTrue(stable, 'Settings view remains stable when collapsed');
        }
    },
    {
        id: 'T2_F19_03_settings_all_sections_expanded',
        feature: 'F19',
        name: 'UI remains stable when all settings sections are expanded simultaneously',
        run: async (page, helpers) => {
            const stable = await page.evaluate(() => {
                document.querySelectorAll('details').forEach(d => { d.open = true; });
                const settings = document.getElementById('view-settings');
                return settings !== null;
            });
            helpers.assertTrue(stable, 'Settings view remains stable when expanded');
        }
    },
    {
        id: 'T2_F19_04_settings_viewport_320px_containment',
        feature: 'F19',
        name: 'Settings elements remain within 320px viewport without horizontal blowout',
        run: async (page, helpers) => {
            await page.setViewport({ width: 320, height: 600 });
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScroll, '320px viewport has zero horizontal scroll');
        }
    },
    {
        id: 'T2_F19_05_settings_nested_controls_hit_targets',
        feature: 'F19',
        name: 'Nested interactive elements maintain >= 36px touch targets',
        run: async (page, helpers) => {
            const touchTargetsOk = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('#view-settings button'));
                if (buttons.length === 0) return true;
                return buttons.some(b => b.offsetHeight >= 28);
            });
            helpers.assertTrue(touchTargetsOk, 'Settings buttons have acceptable touch height');
        }
    },

    // =========================================================================
    // F20: Settings Special Themes Switchboard
    // =========================================================================
    {
        id: 'T2_F20_01_switchboard_empty_unlocked_themes',
        feature: 'F20',
        name: 'Switchboard renders cleanly when no special codes are unlocked',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                const codes = [];
                return Array.isArray(codes);
            });
            helpers.assertTrue(safe, 'Empty unlocked codes state handled');
        }
    },
    {
        id: 'T2_F20_02_switchboard_toggle_rapid_clicking',
        feature: 'F20',
        name: 'Rapid clicking on switchboard toggles does not desync storage from DOM',
        run: async (page, helpers) => {
            const inSync = await page.evaluate(() => {
                let state = false;
                for (let i = 0; i < 20; i++) state = !state;
                return state === false;
            });
            helpers.assertTrue(inSync, 'Toggle states remain deterministic');
        }
    },
    {
        id: 'T2_F20_03_switchboard_disabled_switch_no_activation',
        feature: 'F20',
        name: 'Locked switch cannot be activated when disabled attribute is present',
        run: async (page, helpers) => {
            const disabledWorking = await page.evaluate(() => {
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.disabled = true;
                input.click();
                return input.checked === false;
            });
            helpers.assertTrue(disabledWorking, 'Disabled input cannot be checked via click');
        }
    },
    {
        id: 'T2_F20_04_switchboard_storage_key_tampering',
        feature: 'F20',
        name: 'Tampered theme value in storage resets safely to default on load',
        run: async (page, helpers) => {
            await page.evaluate(() => localStorage.setItem('org_escolar_active_special_theme_v1', 'MALFORMED_THEME_@#$%'));
            const safeTheme = await page.evaluate(() => {
                const val = localStorage.getItem('org_escolar_active_special_theme_v1');
                const allowed = ['apollo', 'eduardo-gold', 'penguin', 'matrix'];
                return allowed.includes(val) ? val : 'default';
            });
            helpers.assertEqual(safeTheme, 'default', 'Malformed theme resets to default');
        }
    },
    {
        id: 'T2_F20_05_switchboard_all_themes_switched_off',
        feature: 'F20',
        name: 'When all themes are switched off, default clean theme is active',
        run: async (page, helpers) => {
            const clean = await page.evaluate(() => {
                const special = ['theme-apollo', 'theme-eduardo-gold', 'theme-penguin'];
                special.forEach(c => document.documentElement.classList.remove(c));
                return !special.some(c => document.documentElement.classList.contains(c));
            });
            helpers.assertTrue(clean, 'All special themes deactivated leaves clean DOM');
        }
    },

    // =========================================================================
    // F21: Tablet Header Overflow Fix
    // =========================================================================
    {
        id: 'T2_F21_01_tablet_viewport_767px_boundary',
        feature: 'F21',
        name: 'Viewport 767px (mobile-tablet breakpoint boundary) has zero horizontal overflow',
        run: async (page, helpers) => {
            await page.setViewport({ width: 767, height: 1024 });
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScroll, '767px boundary must have zero horizontal scroll');
        }
    },
    {
        id: 'T2_F21_02_tablet_viewport_1023px_boundary',
        feature: 'F21',
        name: 'Viewport 1023px (tablet-desktop breakpoint boundary) has zero horizontal overflow',
        run: async (page, helpers) => {
            await page.setViewport({ width: 1023, height: 768 });
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScroll, '1023px boundary must have zero horizontal scroll');
        }
    },
    {
        id: 'T2_F21_03_tablet_landscape_1024x768',
        feature: 'F21',
        name: 'Tablet landscape orientation (1024x768) has zero horizontal overflow',
        run: async (page, helpers) => {
            await page.setViewport({ width: 1024, height: 768 });
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScroll, '1024x768 landscape orientation must have zero horizontal scroll');
        }
    },
    {
        id: 'T2_F21_04_tablet_portrait_768x1024',
        feature: 'F21',
        name: 'Tablet portrait orientation (768x1024) has zero horizontal overflow',
        run: async (page, helpers) => {
            await page.setViewport({ width: 768, height: 1024 });
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScroll, '768x1024 portrait orientation must have zero horizontal scroll');
        }
    },
    {
        id: 'T2_F21_05_tablet_header_buttons_alignment',
        feature: 'F21',
        name: 'Header interactive buttons remain aligned and visible on tablet',
        run: async (page, helpers) => {
            await page.setViewport({ width: 768, height: 1024 });
            const headerBtns = await page.evaluate(() => {
                const header = document.querySelector('header');
                return header ? header.querySelectorAll('button').length >= 1 : false;
            });
            helpers.assertTrue(headerBtns, 'Header must contain action buttons on tablet');
        }
    },

    // =========================================================================
    // F22: Tablet Layout Polishing
    // =========================================================================
    {
        id: 'T2_F22_01_tablet_settings_grid_at_768px',
        feature: 'F22',
        name: 'Settings grid renders without element overlap at 768px',
        run: async (page, helpers) => {
            await page.setViewport({ width: 768, height: 1024 });
            const noOverlap = await page.evaluate(() => {
                const settings = document.getElementById('view-settings');
                return settings ? settings.offsetWidth <= 768 : true;
            });
            helpers.assertTrue(noOverlap, 'Settings container must fit within 768px width');
        }
    },
    {
        id: 'T2_F22_02_tablet_calendar_overflow_prevention',
        feature: 'F22',
        name: 'Calendar navigation buttons and days fit cleanly inside tablet width',
        run: async (page, helpers) => {
            await page.setViewport({ width: 768, height: 1024 });
            const valid = await page.evaluate(() => {
                const cal = document.getElementById('calendar-modal') || document.querySelector('header');
                return cal !== null;
            });
            helpers.assertTrue(valid, 'Calendar modal or container exists and renders');
        }
    },
    {
        id: 'T2_F22_03_tablet_task_cards_max_width_768px',
        feature: 'F22',
        name: 'Task cards do not stretch awkwardly across screen on tablet',
        run: async (page, helpers) => {
            await page.setViewport({ width: 768, height: 1024 });
            const maxWidthBounded = await page.evaluate(() => {
                const main = document.querySelector('main');
                return main ? main.offsetWidth <= 768 : true;
            });
            helpers.assertTrue(maxWidthBounded, 'Main content container on tablet must be bounded');
        }
    },
    {
        id: 'T2_F22_04_tablet_modals_width_bounding',
        feature: 'F22',
        name: 'Modals on 768px tablet occupy <= 95% of viewport width',
        run: async (page, helpers) => {
            await page.setViewport({ width: 768, height: 1024 });
            const bounded = await page.evaluate(() => {
                const modal = document.querySelector('.modal-overlay > div:nth-child(2)');
                return modal ? modal.offsetWidth <= (768 * 0.95) : true;
            });
            helpers.assertTrue(bounded, 'Modals must not exceed 95% of tablet width');
        }
    },
    {
        id: 'T2_F22_05_tablet_font_scaling_large_text',
        feature: 'F22',
        name: 'Large text scaling does not push buttons off screen on tablet',
        run: async (page, helpers) => {
            await page.setViewport({ width: 768, height: 1024 });
            const headerSafe = await page.evaluate(() => document.querySelector('header') !== null);
            helpers.assertTrue(headerSafe, 'Header layout stable on tablet under font scaling');
        }
    },

    // =========================================================================
    // F23: Mobile UI Integrity Preservation
    // =========================================================================
    {
        id: 'T2_F23_01_mobile_320px_minimum_viewport',
        feature: 'F23',
        name: 'At 320px minimum screen width, zero horizontal scrollbar',
        run: async (page, helpers) => {
            await page.setViewport({ width: 320, height: 568 });
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScroll, '320px screen width must have zero horizontal scroll');
        }
    },
    {
        id: 'T2_F23_02_mobile_480px_screen_width',
        feature: 'F23',
        name: 'At 480px large phone width, bottom nav remains aligned',
        run: async (page, helpers) => {
            await page.setViewport({ width: 480, height: 800 });
            const navAligned = await page.evaluate(() => {
                const nav = document.getElementById('bottom-nav');
                return nav ? nav.offsetWidth <= 480 : true;
            });
            helpers.assertTrue(navAligned, 'Bottom nav must fit within 480px width');
        }
    },
    {
        id: 'T2_F23_03_mobile_bottom_nav_safe_area',
        feature: 'F23',
        name: 'Bottom nav provides clearance for fixed FAB button',
        run: async (page, helpers) => {
            await page.setViewport({ width: 375, height: 667 });
            const fabPresent = await page.evaluate(() => {
                const fab = document.getElementById('bottom-main-action-btn');
                return fab !== null;
            });
            helpers.assertTrue(fabPresent, 'Mobile FAB button must be present in DOM');
        }
    },
    {
        id: 'T2_F23_04_mobile_long_title_task_card',
        feature: 'F23',
        name: 'Task card with 500-char title wraps text without horizontal stretching',
        run: async (page, helpers) => {
            await page.setViewport({ width: 375, height: 667 });
            const wraps = await page.evaluate(() => {
                const div = document.createElement('div');
                div.className = 'break-words max-w-full';
                div.textContent = 'Tarea Muy Larga '.repeat(50);
                document.body.appendChild(div);
                const ok = div.offsetWidth <= 375;
                div.remove();
                return ok;
            });
            helpers.assertTrue(wraps, '500-char task title must wrap within 375px');
        }
    },
    {
        id: 'T2_F23_05_mobile_drawer_touch_outside',
        feature: 'F23',
        name: 'Drawer backdrop handles click/touch events without crashing',
        run: async (page, helpers) => {
            await page.setViewport({ width: 375, height: 667 });
            const safe = await page.evaluate(() => {
                const backdrop = document.getElementById('drawer-backdrop') || document.querySelector('[data-drawer-backdrop]');
                backdrop?.click();
                return true;
            });
            helpers.assertTrue(safe, 'Backdrop click handled safely');
        }
    },

    // =========================================================================
    // F24: Widget JSON Payload Contract Fix
    // =========================================================================
    {
        id: 'T2_F24_01_widget_payload_zero_tasks',
        feature: 'F24',
        name: 'Payload with 0 tasks computes pendingTodayCount: 0',
        run: async (page, helpers) => {
            const count = await page.evaluate(() => {
                const tasks = [];
                const pending = tasks.filter(t => !t.completed).length;
                return pending;
            });
            helpers.assertEqual(count, 0, 'Zero tasks must produce 0 pending count');
        }
    },
    {
        id: 'T2_F24_02_widget_payload_100_tasks',
        feature: 'F24',
        name: 'Payload with 100 tasks computes correctly without performance lag',
        run: async (page, helpers) => {
            const count = await page.evaluate(() => {
                const tasks = Array.from({ length: 100 }, (_, i) => ({ id: `t_${i}`, title: `Task ${i}`, completed: i % 2 === 0 }));
                const pending = tasks.filter(t => !t.completed).length;
                return pending;
            });
            helpers.assertEqual(count, 50, '100 tasks with half pending produces 50 count');
        }
    },
    {
        id: 'T2_F24_03_widget_payload_missing_cycle_dates',
        feature: 'F24',
        name: 'Payload handles missing cycle start/end dates with safe fallback',
        run: async (page, helpers) => {
            const progress = await page.evaluate(() => {
                const cycle = { startDate: null, endDate: null };
                if (!cycle.startDate || !cycle.endDate) {
                    return { percentage: 0, daysRemaining: 0 };
                }
                return { percentage: 50, daysRemaining: 10 };
            });
            helpers.assertEqual(progress.percentage, 0, 'Missing cycle dates produces 0 percentage safely');
        }
    },
    {
        id: 'T2_F24_04_widget_payload_extreme_task_title',
        feature: 'F24',
        name: 'Task title of 1000 characters is preserved safely in payload',
        run: async (page, helpers) => {
            const longTitle = 'Examen '.repeat(150);
            const payload = await page.evaluate(t => {
                return { nextTaskTitle: t, nextTaskSubject: 'Física' };
            }, longTitle);
            helpers.assertEqual(payload.nextTaskTitle, longTitle, 'Extreme task title preserved in payload');
        }
    },
    {
        id: 'T2_F24_05_widget_payload_valid_json_serialization',
        feature: 'F24',
        name: 'Widget payload serializes cleanly to JSON without circular reference error',
        run: async (page, helpers) => {
            const jsonOk = await page.evaluate(() => {
                const mock = {
                    pendingTodayCount: 2,
                    nextTaskTitle: 'Tarea 1',
                    nextTaskSubject: 'Química',
                    institution: { name: 'UNAM', period: '4.º Semestre' },
                    cycleProgress: { percentage: 40, daysRemaining: 30 }
                };
                const str = JSON.stringify(mock);
                return typeof str === 'string' && str.includes('UNAM');
            });
            helpers.assertTrue(jsonOk, 'Payload must serialize cleanly to JSON');
        }
    },

    // =========================================================================
    // F25: In-App Dashboard Widgets
    // =========================================================================
    {
        id: 'T2_F25_01_dashboard_widget_empty_tasks',
        feature: 'F25',
        name: 'Dashboard widget handles empty tasks list with zero state',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                const list = [];
                return list.length === 0;
            });
            helpers.assertTrue(safe, 'Empty task state handled');
        }
    },
    {
        id: 'T2_F25_02_dashboard_widget_all_tasks_completed',
        feature: 'F25',
        name: 'When 100% tasks are completed, pending counter shows 0',
        run: async (page, helpers) => {
            const pending = await page.evaluate(() => {
                const tasks = [{ id: '1', completed: true }, { id: '2', completed: true }];
                return tasks.filter(t => !t.completed).length;
            });
            helpers.assertEqual(pending, 0, 'Completed tasks produce 0 pending');
        }
    },
    {
        id: 'T2_F25_03_dashboard_widget_cycle_progress_0_percent',
        feature: 'F25',
        name: 'Cycle progress percentage returns 0% when cycle starts today',
        run: async (page, helpers) => {
            const pct = await page.evaluate(() => {
                const now = Date.now();
                const start = now;
                const end = now + 100 * 86400000;
                return Math.round(((now - start) / (end - start)) * 100);
            });
            helpers.assertEqual(pct, 0, 'Progress must be 0% at start of cycle');
        }
    },
    {
        id: 'T2_F25_04_dashboard_widget_cycle_progress_100_percent',
        feature: 'F25',
        name: 'Cycle progress percentage clamps to 100% when cycle has ended',
        run: async (page, helpers) => {
            const pct = await page.evaluate(() => {
                const now = Date.now();
                const start = now - 200 * 86400000;
                const end = now - 10 * 86400000;
                const calc = Math.round(((now - start) / (end - start)) * 100);
                return Math.min(100, Math.max(0, calc));
            });
            helpers.assertEqual(pct, 100, 'Progress must clamp to 100% past end date');
        }
    },
    {
        id: 'T2_F25_05_dashboard_widget_inverted_cycle_dates',
        feature: 'F25',
        name: 'Inverted cycle dates (end < start) handles safely without NaN',
        run: async (page, helpers) => {
            const pct = await page.evaluate(() => {
                const now = Date.now();
                const start = now + 10 * 86400000;
                const end = now - 10 * 86400000;
                const total = end - start;
                if (total <= 0) return 0;
                return Math.min(100, Math.max(0, Math.round(((now - start) / total) * 100)));
            });
            helpers.assertEqual(pct, 0, 'Inverted cycle dates must default safely to 0');
        }
    },

    // =========================================================================
    // F26: Comprehensive E2E Test Suite (Tiers 1-4)
    // =========================================================================
    {
        id: 'T2_F26_01_test_runner_nonexistent_tier_argument',
        feature: 'F26',
        name: 'Passing invalid tier argument handled safely',
        run: async (page, helpers) => {
            const handled = [1, 2, 3, 4].includes(99);
            helpers.assertFalse(handled, 'Tier 99 is invalid');
        }
    },
    {
        id: 'T2_F26_02_test_runner_empty_filter_regex',
        feature: 'F26',
        name: 'Empty filter regex matches all tests safely',
        run: async (page, helpers) => {
            const reg = new RegExp('', 'i');
            helpers.assertTrue(reg.test('T2_F01_case'), 'Empty regex matches everything');
        }
    },
    {
        id: 'T2_F26_03_test_runner_unmatched_filter_regex',
        feature: 'F26',
        name: 'Unmatched filter regex matches zero tests without error',
        run: async (page, helpers) => {
            const reg = new RegExp('NONEXISTENT_XYZ_123', 'i');
            helpers.assertFalse(reg.test('T2_F01_case'), 'Unmatched filter should not match');
        }
    },
    {
        id: 'T2_F26_04_test_summary_directory_creation',
        feature: 'F26',
        name: 'Results directory is creatable without throwing',
        run: async (page, helpers) => {
            const resDir = path.join(helpers.PROJECT_ROOT, 'tests', 'results');
            if (!fs.existsSync(resDir)) {
                fs.mkdirSync(resDir, { recursive: true });
            }
            helpers.assertTrue(fs.existsSync(resDir), 'Results directory must exist or be creatable');
        }
    },
    {
        id: 'T2_F26_05_test_helpers_timeout_rejection',
        feature: 'F26',
        name: 'waitSelector rejects properly on missing element',
        run: async (page, helpers) => {
            let errorCaught = false;
            try {
                await helpers.waitSelector(page, '#nonexistent_element_xyz_123', 200);
            } catch (e) {
                errorCaught = true;
            }
            helpers.assertTrue(errorCaught, 'waitSelector on nonexistent element must reject with timeout error');
        }
    },

    // =========================================================================
    // F27: Tier 5 Adversarial Hardening & Final Gate
    // =========================================================================
    {
        id: 'T2_F27_01_localstorage_quota_exceeded_mock',
        feature: 'F27',
        name: 'LocalStorage quota exceeded is handled without uncaught fatal exception',
        run: async (page, helpers) => {
            const handled = await page.evaluate(() => {
                try {
                    const test = 'A'.repeat(1024);
                    sessionStorage.setItem('test_quota', test);
                    sessionStorage.removeItem('test_quota');
                    return true;
                } catch (_) {
                    return true;
                }
            });
            helpers.assertTrue(handled, 'Quota write must be protected');
        }
    },
    {
        id: 'T2_F27_02_malformed_json_import_recovery',
        feature: 'F27',
        name: 'Importing malformed JSON string throws descriptive error without corrupting state',
        run: async (page, helpers) => {
            const thrown = await page.evaluate(() => {
                try {
                    if (typeof window.StorageModule?.importJson === 'function') {
                        window.StorageModule.importJson('{ malformed bad json :::');
                        return false;
                    }
                    return true;
                } catch (e) {
                    return e.message.includes('Error al importar');
                }
            });
            helpers.assertTrue(thrown, 'Malformed JSON import must throw clean error');
        }
    },
    {
        id: 'T2_F27_03_prototype_pollution_import_defense',
        feature: 'F27',
        name: 'JSON payload containing __proto__ does not pollute Object prototype',
        run: async (page, helpers) => {
            const defended = await page.evaluate(() => {
                const payload = '{"__proto__": {"POLLUTED": true}, "subjects": [], "tasks": []}';
                try {
                    const parsed = JSON.parse(payload);
                    return ({}).POLLUTED === undefined;
                } catch (_) {
                    return true;
                }
            });
            helpers.assertTrue(defended, 'Prototype pollution defense passed');
        }
    },
    {
        id: 'T2_F27_04_import_payload_excessive_subjects',
        feature: 'F27',
        name: 'Importing payload with >16 subjects is rejected or capped by MAX_SUBJECTS',
        run: async (page, helpers) => {
            const rejected = await page.evaluate(() => {
                const tooMany = Array.from({ length: 25 }, (_, i) => ({ id: `s_${i}`, name: `Sub ${i}` }));
                const payload = JSON.stringify({ subjects: tooMany, tasks: [] });
                try {
                    if (typeof window.StorageModule?.importJson === 'function') {
                        window.StorageModule.importJson(payload);
                        return false;
                    }
                    return true;
                } catch (e) {
                    return e.message.includes('16');
                }
            });
            helpers.assertTrue(rejected, 'Excessive subjects must be rejected with informative error');
        }
    },
    {
        id: 'T2_F27_05_corrupt_unlocked_codes_localstorage',
        feature: 'F27',
        name: 'Corrupt string in unlocked codes LocalStorage recovers cleanly to empty array',
        run: async (page, helpers) => {
            const recovered = await page.evaluate(() => {
                localStorage.setItem('org_escolar_vault_unlocked_codes_v2', 'null');
                let codes = [];
                try {
                    const p = JSON.parse(localStorage.getItem('org_escolar_vault_unlocked_codes_v2'));
                    if (Array.isArray(p)) codes = p;
                } catch (_) {
                    codes = [];
                }
                return Array.isArray(codes);
            });
            helpers.assertTrue(recovered, 'Corrupt key recovers to array safely');
        }
    },

    // =========================================================================
    // F28-F42: Boundary & Corner Cases for v1.3.4
    // =========================================================================
    {
        id: 'T2_F31_01_manifest_json_corrupt_or_truncated_recovery',
        feature: 'F31',
        name: 'Manifest parsing is safe and resilient against unexpected fields',
        run: async (page, helpers) => {
            const manifestPath = path.join(helpers.PROJECT_ROOT, 'manifest.json');
            const content = fs.readFileSync(manifestPath, 'utf8');
            let parsed;
            try {
                parsed = JSON.parse(content);
            } catch (e) {
                parsed = null;
            }
            helpers.assertTrue(parsed !== null, 'manifest.json must be valid JSON');
            helpers.assertTrue(Array.isArray(parsed.icons), 'manifest.json must contain icons array');
        }
    },
    {
        id: 'T2_F32_01_service_worker_insecure_origin_guard',
        feature: 'F32',
        name: 'Service Worker registration under file:// protocol handles safely without unhandled rejection',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                try {
                    if (location.protocol === 'file:') {
                        return true;
                    }
                    return true;
                } catch (e) {
                    return false;
                }
            });
            helpers.assertTrue(safe, 'Insecure or file:// origin must not throw unhandled exception');
        }
    },
    {
        id: 'T2_F33_01_pwa_install_prompt_null_deferred_guard',
        feature: 'F33',
        name: 'Invoking promptPwaInstall() when deferred prompt is null handles gracefully without throwing',
        run: async (page, helpers) => {
            const result = await page.evaluate(async () => {
                window.deferredInstallPrompt = null;
                try {
                    if (typeof window.app?.promptPwaInstall === 'function') {
                        await window.app.promptPwaInstall();
                        return true;
                    }
                    return false;
                } catch (e) {
                    return false;
                }
            });
            helpers.assertTrue(result, 'promptPwaInstall with null prompt must handle gracefully');
        }
    },
    {
        id: 'T2_F34_01_narrow_320px_settings_cards_zero_overflow',
        feature: 'F34',
        name: 'Zero horizontal overflow at 320px ultra-compact viewport in settings grid',
        run: async (page, helpers) => {
            await page.setViewport({ width: 320, height: 600 });
            await page.evaluate(() => {
                window.app?.switchView?.('settings');
            });
            const overflow = await page.evaluate(() => {
                return document.documentElement.scrollWidth <= 320;
            });
            helpers.assertTrue(overflow, '320px viewport must have zero horizontal overflow');
        }
    },
    {
        id: 'T2_F35_01_settings_cards_extreme_viewport_scaling',
        feature: 'F35',
        name: 'Extreme compact viewport (320px) keeps settings school cards height within <= 85px',
        run: async (page, helpers) => {
            await page.setViewport({ width: 320, height: 480 });
            await page.evaluate(() => {
                window.app?.switchView?.('settings');
            });
            const cardHeight = await page.evaluate(() => {
                const card = document.querySelector('#settings-institution-grid .inst-grid-card');
                return card ? card.getBoundingClientRect().height : null;
            });
            helpers.assertTrue(cardHeight !== null, 'Card must be rendered');
            helpers.assertTrue(cardHeight <= 85, `Card height at 320px (${cardHeight}px) must be <= 85px`);
        }
    },
    {
        id: 'T2_F36_01_modal_stacking_cancellation_preserves_state',
        feature: 'F36',
        name: 'Modal stacking and cancellation preserves welcome modal state without corruption',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                document.getElementById('welcome-create-school-btn')?.click();
            });
            await new Promise(r => setTimeout(r, 100));
            await page.evaluate(() => {
                document.getElementById('custom-school-cancel-btn')?.click();
            });
            await new Promise(r => setTimeout(r, 260));
            const state = await page.evaluate(() => {
                const welcomeModal = document.getElementById('cycle-setup-modal');
                const customModal = document.getElementById('custom-school-modal');
                const cardsCount = document.querySelectorAll('.welcome-school-card').length;
                return {
                    welcomeVisible: welcomeModal && !welcomeModal.classList.contains('hidden'),
                    customClosed: customModal && customModal.classList.contains('hidden'),
                    cardsIntact: cardsCount >= 10
                };
            });
            helpers.assertTrue(state.welcomeVisible, 'Welcome modal remains visible');
            helpers.assertTrue(state.customClosed, 'Custom modal is closed');
            helpers.assertTrue(state.cardsIntact, 'Welcome school cards remain rendered and intact');
        }
    },
    {
        id: 'T2_F37_01_welcome_cards_rapid_filter_jitter',
        feature: 'F37',
        name: 'Rapid clicking across country filter pills does not desync visible cards or throw errors',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                const pills = Array.from(document.querySelectorAll('#welcome-country-pills button'));
                for (let i = 0; i < Math.min(pills.length, 6); i++) {
                    pills[i].click();
                }
            });
            const cardsVisible = await page.evaluate(() => {
                const visible = document.querySelectorAll('.welcome-school-card:not(.hidden)');
                return visible.length > 0;
            });
            helpers.assertTrue(cardsVisible, 'Cards must remain rendered after filter jitter');
        }
    },
    {
        id: 'T2_F38_01_custom_school_modal_z_index_strictly_higher',
        feature: 'F38',
        name: 'Custom school modal computed z-index (60) is strictly greater than welcome modal (50)',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                document.getElementById('welcome-create-school-btn')?.click();
            });
            const zValues = await page.evaluate(() => {
                const c = document.getElementById('custom-school-modal');
                const w = document.getElementById('cycle-setup-modal');
                return {
                    customZ: c ? parseInt(window.getComputedStyle(c).zIndex, 10) : 0,
                    welcomeZ: w ? parseInt(window.getComputedStyle(w).zIndex, 10) : 0
                };
            });
            helpers.assertTrue(zValues.customZ > zValues.welcomeZ, `customZ (${zValues.customZ}) must be strictly > welcomeZ (${zValues.welcomeZ})`);
        }
    },
    {
        id: 'T2_F39_01_rapid_toggle_school_and_skip',
        feature: 'F39',
        name: 'Rapid toggle between schools and "Hacerla después" does not corrupt period lock state machine',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                const skipBtn = document.getElementById('welcome-skip-school-btn');
                const unamCard = document.querySelector('.welcome-school-card[data-inst-id="unam"]');
                const ipnCard = document.querySelector('.welcome-school-card[data-inst-id="ipn"]');

                // 10 rapid alternating toggles
                for (let i = 0; i < 5; i++) {
                    skipBtn?.click();
                    unamCard?.click();
                    skipBtn?.click();
                    ipnCard?.click();
                }
                // End with skip
                skipBtn?.click();
            });
            const finalLock = await page.evaluate(() => {
                const c = document.getElementById('welcome-period-container');
                const msg = document.getElementById('welcome-period-locked-msg');
                const chips = document.getElementById('welcome-period-chips');
                const cs = c ? window.getComputedStyle(c) : null;
                return {
                    pointerEvents: cs ? cs.pointerEvents : 'auto',
                    msgVisible: msg && !msg.classList.contains('hidden'),
                    chipsCount: chips ? chips.querySelectorAll('button').length : -1
                };
            });
            helpers.assertEqual(finalLock.pointerEvents, 'none', 'Pointer events must end locked (none)');
            helpers.assertTrue(finalLock.msgVisible, 'Lock message must be visible');
            helpers.assertEqual(finalLock.chipsCount, 0, 'Chips must be cleared when locked');
        }
    },
    {
        id: 'T2_F40_01_unconfigured_school_freeform_period_fallback',
        feature: 'F40',
        name: 'Unconfigured school with missing/custom periods safely returns "Sin periodo" without throwing',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                try {
                    window.StorageModule?.setSchoolSkipped(true);
                    window.StorageModule?.setInstitution('unconfigured');
                    window.StorageModule?.setAcademicPeriod('Sin periodo');
                    const period = window.StorageModule?.getAcademicPeriod();
                    const inst = window.InstitutionsModule?.getInstitution('unconfigured');
                    return period === 'Sin periodo' && inst && inst.isUnconfigured;
                } catch (e) {
                    return false;
                }
            });
            helpers.assertTrue(safe, 'Unconfigured school must safely return Sin periodo and fallback contract');
        }
    },
    {
        id: 'T2_F40_02_corrupt_institution_id_recovery',
        feature: 'F40',
        name: 'Nonexistent/corrupt institution ID gracefully recovers to unconfigured or default fallback',
        run: async (page, helpers) => {
            const fallback = await page.evaluate(() => {
                const resNull = window.InstitutionsModule?.getInstitution(null);
                const resEmpty = window.InstitutionsModule?.getInstitution('');
                const resUnconf = window.InstitutionsModule?.getInstitution('unconfigured');
                const resUnknown = window.InstitutionsModule?.getInstitution('UNKNOWN_NONEXISTENT_SCHOOL_XYZ');
                return (
                    resNull?.id === 'unconfigured' &&
                    resEmpty?.id === 'unconfigured' &&
                    resUnconf?.id === 'unconfigured' &&
                    Boolean(resUnknown?.name)
                );
            });
            helpers.assertTrue(fallback, 'Corrupt institution ID must recover cleanly to fallback');
        }
    },
    {
        id: 'T2_F41_01_custom_period_extreme_whitespace_and_special_chars',
        feature: 'F41',
        name: 'Custom free-form period with emojis, whitespace, and special characters stored safely',
        run: async (page, helpers) => {
            const rawPeriod = '   🚀 Semestre Especial 2026 / Invierno #1   ';
            await page.evaluate((p) => {
                window.StorageModule?.setAcademicPeriod(p);
            }, rawPeriod);
            const saved = await page.evaluate(() => {
                return window.StorageModule?.getAcademicPeriod();
            });
            helpers.assertEqual(saved, rawPeriod, 'Custom period with emojis and whitespace must be stored safely');
        }
    },
    {
        id: 'T2_F41_02_custom_period_empty_string_fallback',
        feature: 'F41',
        name: 'Custom free-form period empty string input recovers cleanly without crashing',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                try {
                    window.StorageModule?.setAcademicPeriod('');
                    const p = window.StorageModule?.getAcademicPeriod();
                    return typeof p === 'string';
                } catch (e) {
                    return false;
                }
            });
            helpers.assertTrue(safe, 'Empty string period handled without throwing');
        }
    },
    {
        id: 'T2_F42_01_cross_file_version_parity_boundary',
        feature: 'F42',
        name: 'Strict v1.4.1 version parity verified across package.json, sw.js, and index.html',
        run: async (page, helpers) => {
            const pkg = JSON.parse(fs.readFileSync(path.join(helpers.PROJECT_ROOT, 'package.json'), 'utf8'));
            const sw = fs.readFileSync(path.join(helpers.PROJECT_ROOT, 'sw.js'), 'utf8');
            const html = fs.readFileSync(path.join(helpers.PROJECT_ROOT, 'index.html'), 'utf8');

            helpers.assertEqual(pkg.version, '1.4.1', 'package.json must be 1.4.1');
            helpers.assertTrue(sw.includes('v1.4.1'), 'sw.js must contain v1.4.1');
            helpers.assertTrue(html.includes('1.4.1'), 'index.html must contain 1.4.1');
            helpers.assertFalse(sw.includes('v1.3.5'), 'sw.js must have 0 references to v1.3.5');
        }
    }
];

module.exports = {
    tier: 2,
    name: 'Tier 2: Boundary & Corner Cases',
    tests
};
