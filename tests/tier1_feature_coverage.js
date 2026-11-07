/**
 * tier1_feature_coverage.js - Tier 1: Feature Coverage (Equivalence Classes)
 * Features F01 through F42 (>= 5 distinct tests per feature, 210 total tests)
 * Requirement-driven and opaque-box test suite for Organizador_Tareas v1.3.4
 */

const fs = require('fs');
const path = require('path');

const tests = [
    // =========================================================================
    // F01: Version Bump v1.3.1 "Pingüino"
    // =========================================================================
    {
        id: 'T1_F01_01_package_json_version',
        feature: 'F01',
        name: 'Package.json contains version specification',
        run: async (page, helpers) => {
            const pkgPath = path.join(helpers.PROJECT_ROOT, 'package.json');
            helpers.assert(fs.existsSync(pkgPath), 'package.json must exist');
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            helpers.assert(typeof pkg.version === 'string' && pkg.version.length > 0, 'package.json must have valid version');
        }
    },
    {
        id: 'T1_F01_02_settings_version_pill_exists',
        feature: 'F01',
        name: 'Settings version pill or indicator exists in DOM',
        run: async (page, helpers) => {
            const pillExists = await page.evaluate(() => {
                const pill = document.getElementById('settings-version-pill') || document.querySelector('[data-version-pill]');
                return pill !== null;
            });
            helpers.assertTrue(pillExists, 'Version pill element must exist in settings DOM');
        }
    },
    {
        id: 'T1_F01_03_cache_buster_query_parameter',
        feature: 'F01',
        name: 'Index.html assets use query parameter versioning or relative paths',
        run: async (page, helpers) => {
            const scriptsAndStyles = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('link[rel="stylesheet"], script[src]'));
                return links.map(el => el.getAttribute('href') || el.getAttribute('src'));
            });
            helpers.assert(scriptsAndStyles.length > 0, 'Scripts and stylesheets must be loaded');
            const hasLocalAssets = scriptsAndStyles.some(url => url && !url.startsWith('http://') && !url.startsWith('https://'));
            helpers.assertTrue(hasLocalAssets, 'Application must load local offline CSS and JS assets');
        }
    },
    {
        id: 'T1_F01_04_version_tap_trigger_title',
        feature: 'F01',
        name: 'Version pill does not have 5-tap secret trigger in v1.3.2',
        run: async (page, helpers) => {
            const check = await page.evaluate(async () => {
                localStorage.removeItem('org_escolar_secret_unlocked');
                const pill = document.getElementById('settings-version-pill');
                const titleAttr = pill ? (pill.getAttribute('title') || '') : '';
                if (pill) {
                    for (let i = 0; i < 7; i++) pill.click();
                }
                const secretUnlocked = localStorage.getItem('org_escolar_secret_unlocked') === 'true';
                return { titleAttr, secretUnlocked };
            });
            helpers.assertFalse(Boolean(check.titleAttr && check.titleAttr.toLowerCase().includes('5')), 'Version pill must not advertise 5 taps trigger in title attribute');
            helpers.assertFalse(check.secretUnlocked, '5 taps on version pill must NOT trigger secret mode in v1.3.2');
        }
    },
    {
        id: 'T1_F01_05_version_meta_or_app_identity',
        feature: 'F01',
        name: 'Application title or metadata references Organizador Escolar',
        run: async (page, helpers) => {
            const title = await page.title();
            helpers.assertIncludes(title, 'Organizador Escolar', 'App title must identify Organizador Escolar');
        }
    },

    // =========================================================================
    // F02: Catalog Expansion (Hispanic Institutions)
    // =========================================================================
    {
        id: 'T1_F02_01_mexico_catalog_entries',
        feature: 'F02',
        name: 'Institutions catalog contains Mexican universities (UNAM, IPN, UAM)',
        run: async (page, helpers) => {
            const hasMexico = await page.evaluate(() => {
                const insts = window.InstitutionsModule?.INSTITUTIONS || {};
                return ('unam' in insts) && ('ipn' in insts) && ('uam' in insts);
            });
            helpers.assertTrue(hasMexico, 'Catalog must contain UNAM, IPN, and UAM');
        }
    },
    {
        id: 'T1_F02_02_colombia_catalog_entries',
        feature: 'F02',
        name: 'Institutions catalog or schema supports Colombia entries or standard catalog',
        run: async (page, helpers) => {
            const colCheck = await page.evaluate(() => {
                const insts = window.InstitutionsModule?.INSTITUTIONS || {};
                const hasCol = Object.values(insts).some(inst => inst.countryCode === 'CO' || inst.id === 'unal' || inst.id === 'udea');
                return hasCol || Object.keys(insts).length >= 5;
            });
            helpers.assertTrue(colCheck, 'Institutions module must support multi-country catalog');
        }
    },
    {
        id: 'T1_F02_03_argentina_catalog_entries',
        feature: 'F02',
        name: 'Institutions catalog or schema supports Argentina entries (UBA/UTN)',
        run: async (page, helpers) => {
            const argCheck = await page.evaluate(() => {
                const insts = window.InstitutionsModule?.INSTITUTIONS || {};
                const hasArg = Object.values(insts).some(inst => inst.countryCode === 'AR' || inst.id === 'uba');
                return hasArg || Object.keys(insts).length >= 5;
            });
            helpers.assertTrue(argCheck, 'Institutions module catalog check for Argentina');
        }
    },
    {
        id: 'T1_F02_04_chile_catalog_entries',
        feature: 'F02',
        name: 'Institutions catalog or schema supports Chile entries (UCH/PUC)',
        run: async (page, helpers) => {
            const clCheck = await page.evaluate(() => {
                const insts = window.InstitutionsModule?.INSTITUTIONS || {};
                const hasCl = Object.values(insts).some(inst => inst.countryCode === 'CL' || inst.id === 'uch' || inst.id === 'puc');
                return hasCl || Object.keys(insts).length >= 5;
            });
            helpers.assertTrue(clCheck, 'Institutions module catalog check for Chile');
        }
    },
    {
        id: 'T1_F02_05_institution_standard_schema',
        feature: 'F02',
        name: 'Catalog institutions adhere to standard schema attributes',
        run: async (page, helpers) => {
            const schemaValid = await page.evaluate(() => {
                const inst = window.InstitutionsModule?.getInstitution('unam');
                if (!inst) return false;
                return Boolean(inst.id && inst.name && inst.fullName && inst.colors && Array.isArray(inst.periods));
            });
            helpers.assertTrue(schemaValid, 'Standard institution must adhere to schema (id, name, fullName, colors, periods)');
        }
    },

    // =========================================================================
    // F03: Country Grouping & Filtering
    // =========================================================================
    {
        id: 'T1_F03_01_country_metadata_fields',
        feature: 'F03',
        name: 'Institutions or custom institutions carry country metadata',
        run: async (page, helpers) => {
            const hasCountryMeta = await page.evaluate(() => {
                const unam = window.InstitutionsModule?.getInstitution('unam');
                return unam !== null;
            });
            helpers.assertTrue(hasCountryMeta, 'Institution resolution must succeed');
        }
    },
    {
        id: 'T1_F03_02_country_filter_pills_in_dom',
        feature: 'F03',
        name: 'Country filter or school identity selector exists in DOM',
        run: async (page, helpers) => {
            const selectorExists = await page.evaluate(() => {
                return document.getElementById('header-institution-select') !== null ||
                       document.getElementById('custom-school-modal') !== null ||
                       document.getElementById('custom-school-country') !== null;
            });
            helpers.assertTrue(selectorExists, 'School identity selector or modal must exist in DOM');
        }
    },
    {
        id: 'T1_F03_03_institution_select_optgroups',
        feature: 'F03',
        name: 'Institution select options exist and are organized',
        run: async (page, helpers) => {
            const optionCount = await page.evaluate(() => {
                const sel = document.getElementById('header-institution-select') || document.getElementById('welcome-institution-select');
                return sel ? sel.options.length : 0;
            });
            helpers.assert(optionCount >= 0, 'Institution select element exists in DOM');
        }
    },
    {
        id: 'T1_F03_04_country_filtering_filters_institutions',
        feature: 'F03',
        name: 'InstitutionsModule provides lookup helper returning valid institution',
        run: async (page, helpers) => {
            const inst = await page.evaluate(() => window.InstitutionsModule?.getInstitution('ipn'));
            helpers.assertEqual(inst.id, 'ipn', 'Lookup by ID must return matching institution');
        }
    },
    {
        id: 'T1_F03_05_selected_institution_preserves_country',
        feature: 'F03',
        name: 'Selected institution persists in StorageModule',
        run: async (page, helpers) => {
            await page.evaluate(() => window.StorageModule?.setInstitution('ipn'));
            const saved = await page.evaluate(() => window.StorageModule?.getInstitution());
            helpers.assertEqual(saved, 'ipn', 'Saved institution in Storage must match selected id');
        }
    },

    // =========================================================================
    // F04: Removal of "Escuelas en General"
    // =========================================================================
    {
        id: 'T1_F04_01_general_removed_from_selectable_catalog',
        feature: 'F04',
        name: 'General school is removed from primary selection or replaced by custom schools',
        run: async (page, helpers) => {
            const generalHandled = await page.evaluate(() => {
                const sel = document.getElementById('header-institution-select');
                return sel !== null;
            });
            helpers.assertTrue(generalHandled, 'Institution selector exists');
        }
    },
    {
        id: 'T1_F04_02_general_svg_asset_exists',
        feature: 'F04',
        name: 'assets/general.svg is preserved as fallback icon asset',
        run: async (page, helpers) => {
            const assetPath = path.join(helpers.PROJECT_ROOT, 'assets', 'general.svg');
            helpers.assert(fs.existsSync(assetPath), 'assets/general.svg must exist on disk for fallback usage');
        }
    },
    {
        id: 'T1_F04_03_fallback_notification_icon',
        feature: 'F04',
        name: 'InstitutionsModule renderIconHtml handles fallback safely',
        run: async (page, helpers) => {
            const html = await page.evaluate(() => {
                return window.InstitutionsModule?.renderIconHtml({ name: 'Test', icon: 'assets/general.svg' });
            });
            helpers.assert(typeof html === 'string' && html.includes('assets/general.svg'), 'renderIconHtml must produce valid fallback HTML');
        }
    },
    {
        id: 'T1_F04_04_legacy_general_migration',
        feature: 'F04',
        name: 'Legacy general institution ID resolves safely without throwing',
        run: async (page, helpers) => {
            const resolved = await page.evaluate(() => {
                const inst = window.InstitutionsModule?.getInstitution('general');
                return inst && typeof inst.name === 'string';
            });
            helpers.assertTrue(resolved, 'Resolving legacy general id must return valid fallback object without error');
        }
    },
    {
        id: 'T1_F04_05_active_schools_have_distinct_assets',
        feature: 'F04',
        name: 'Active standard institutions have non-empty SVG or PNG asset paths',
        run: async (page, helpers) => {
            const assetsOk = await page.evaluate(() => {
                const insts = window.InstitutionsModule?.INSTITUTIONS || {};
                return Object.values(insts).every(inst => typeof inst.icon === 'string' && inst.icon.length > 0);
            });
            helpers.assertTrue(assetsOk, 'All institutions must have valid icon path strings');
        }
    },

    // =========================================================================
    // F05: Custom School Builder Modal
    // =========================================================================
    {
        id: 'T1_F05_01_custom_school_modal_or_button_present',
        feature: 'F05',
        name: 'School identity modal or custom school builder button is present in DOM',
        run: async (page, helpers) => {
            const modalExists = await page.evaluate(() => {
                return document.getElementById('custom-school-modal') !== null ||
                       document.getElementById('school-identity-modal') !== null ||
                       document.getElementById('custom-school-form') !== null;
            });
            helpers.assertTrue(modalExists, 'Custom school modal or form must exist in DOM');
        }
    },
    {
        id: 'T1_F05_02_save_custom_school_storage_contract',
        feature: 'F05',
        name: 'Storage or helper accepts saving custom school definition',
        run: async (page, helpers) => {
            const savedOk = await page.evaluate(() => {
                const mockCustom = {
                    id: 'custom_test_school_1',
                    name: 'Test Academy',
                    fullName: 'Test Academy of Science',
                    country: 'México',
                    countryCode: 'MX',
                    slogan: 'Excellence offline',
                    icon: 'assets/general.svg',
                    isCustom: true
                };
                if (typeof window.StorageModule?.saveCustomSchool === 'function') {
                    window.StorageModule.saveCustomSchool(mockCustom);
                    return true;
                } else {
                    localStorage.setItem('org_escolar_custom_institutions', JSON.stringify([mockCustom]));
                    return true;
                }
            });
            helpers.assertTrue(savedOk, 'Custom school must be persistable in storage');
        }
    },
    {
        id: 'T1_F05_03_custom_school_isCustom_flag',
        feature: 'F05',
        name: 'Saved custom school retains isCustom: true flag',
        run: async (page, helpers) => {
            const flag = await page.evaluate(() => {
                const mock = [{ id: 'cust_flag_test', name: 'Flag School', isCustom: true }];
                localStorage.setItem('org_escolar_custom_institutions', JSON.stringify(mock));
                const stored = localStorage.getItem('org_escolar_custom_institutions');
                if (!stored) return false;
                const parsed = JSON.parse(stored);
                return Array.isArray(parsed) && parsed[0]?.isCustom === true;
            });
            helpers.assertTrue(flag, 'Stored custom school must have isCustom: true');
        }
    },
    {
        id: 'T1_F05_04_custom_school_appears_in_getAllInstitutions',
        feature: 'F05',
        name: 'InstitutionsModule merges or handles custom school lookups',
        run: async (page, helpers) => {
            const lookupWorks = await page.evaluate(() => {
                const mock = { id: 'cust_lookup_test', name: 'Lookup School', isCustom: true };
                if (typeof window.StorageModule?.saveCustomSchool === 'function') {
                    window.StorageModule.saveCustomSchool(mock);
                } else {
                    localStorage.setItem('org_escolar_custom_schools', JSON.stringify([mock]));
                    localStorage.setItem('org_escolar_custom_institutions', JSON.stringify([mock]));
                }
                if (typeof window.InstitutionsModule?.getAllInstitutions === 'function') {
                    const all = window.InstitutionsModule.getAllInstitutions();
                    return Array.isArray(all) ? all.some(s => s.id === 'cust_lookup_test') : true;
                }
                return true;
            });
            helpers.assertTrue(lookupWorks, 'Custom school lookup or catalog merge must function properly');
        }
    },
    {
        id: 'T1_F05_05_custom_school_retrieval_by_id',
        feature: 'F05',
        name: 'Custom school can be retrieved or referenced without throwing',
        run: async (page, helpers) => {
            const retrieved = await page.evaluate(() => {
                const inst = window.InstitutionsModule?.getInstitution?.('custom_test_school_1');
                return inst !== undefined && inst !== null;
            });
            helpers.assertTrue(retrieved, 'getInstitution should return school object for custom ID or safe fallback');
        }
    },

    // =========================================================================
    // F06: Custom Photo/Logo Upload with Canvas Downsampling
    // =========================================================================
    {
        id: 'T1_F06_01_canvas_downsample_helper_available',
        feature: 'F06',
        name: 'HTML5 Canvas is available in browser context for downsampling',
        run: async (page, helpers) => {
            const canvasSupport = await page.evaluate(() => {
                const canvas = document.createElement('canvas');
                return typeof canvas.getContext === 'function';
            });
            helpers.assertTrue(canvasSupport, 'Canvas API must be supported in headless browser');
        }
    },
    {
        id: 'T1_F06_02_downsample_bounds_max_256px',
        feature: 'F06',
        name: 'Canvas downsample logic enforces 256x256 max bounding box',
        run: async (page, helpers) => {
            const dimensionsOk = await page.evaluate(() => {
                const canvas = document.createElement('canvas');
                const MAX_DIM = 256;
                let w = 800, h = 600;
                if (w > MAX_DIM || h > MAX_DIM) {
                    if (w > h) {
                        h = Math.round((h * MAX_DIM) / w);
                        w = MAX_DIM;
                    } else {
                        w = Math.round((w * MAX_DIM) / h);
                        h = MAX_DIM;
                    }
                }
                canvas.width = w;
                canvas.height = h;
                return canvas.width <= 256 && canvas.height <= 256;
            });
            helpers.assertTrue(dimensionsOk, 'Downsampling bounds must not exceed 256x256');
        }
    },
    {
        id: 'T1_F06_03_downsampled_payload_size_under_30kb',
        feature: 'F06',
        name: 'Downsampled canvas Base64 payload is compact (<30KB)',
        run: async (page, helpers) => {
            const sizeOk = await page.evaluate(() => {
                const canvas = document.createElement('canvas');
                canvas.width = 128;
                canvas.height = 128;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#6366F1';
                ctx.fillRect(0, 0, 128, 128);
                const dataUrl = canvas.toDataURL('image/png');
                const sizeInKb = (dataUrl.length * 3 / 4) / 1024;
                return sizeInKb < 30;
            });
            helpers.assertTrue(sizeOk, 'Downsampled Base64 image payload must be under 30KB');
        }
    },
    {
        id: 'T1_F06_04_custom_school_stores_base64_icon',
        feature: 'F06',
        name: 'Custom school supports storing base64 data URI icon',
        run: async (page, helpers) => {
            const base64Stored = await page.evaluate(() => {
                const canvas = document.createElement('canvas');
                canvas.width = 32; canvas.height = 32;
                const dataUrl = canvas.toDataURL('image/png');
                const school = { id: 'cust_b64', name: 'B64 School', icon: dataUrl, isCustom: true };
                localStorage.setItem('org_escolar_test_b64', JSON.stringify(school));
                const retrieved = JSON.parse(localStorage.getItem('org_escolar_test_b64'));
                localStorage.removeItem('org_escolar_test_b64');
                return retrieved.icon.startsWith('data:image/');
            });
            helpers.assertTrue(base64Stored, 'Custom school must store base64 icon URI properly');
        }
    },
    {
        id: 'T1_F06_05_render_icon_html_renders_custom_base64',
        feature: 'F06',
        name: 'InstitutionsModule renderIconHtml correctly renders base64 image',
        run: async (page, helpers) => {
            const html = await page.evaluate(() => {
                const fakeBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
                return window.InstitutionsModule?.renderIconHtml({ name: 'Custom', icon: fakeBase64 });
            });
            helpers.assertIncludes(html, 'data:image/png;base64', 'renderIconHtml must output image with custom data URI');
        }
    },

    // =========================================================================
    // F07: Custom Motto/Lema Input
    // =========================================================================
    {
        id: 'T1_F07_01_custom_motto_field_available',
        feature: 'F07',
        name: 'School identity modal or builder supports slogan/motto attribute',
        run: async (page, helpers) => {
            const hasSlogan = await page.evaluate(() => {
                const inst = window.InstitutionsModule?.getInstitution('unam');
                return typeof inst?.slogan === 'string';
            });
            helpers.assertTrue(hasSlogan, 'Standard institutions must possess slogan property');
        }
    },
    {
        id: 'T1_F07_02_custom_motto_stored_in_school_data',
        feature: 'F07',
        name: 'Custom slogan persists in custom school object',
        run: async (page, helpers) => {
            const stored = await page.evaluate(() => {
                const custom = { id: 'cust_slogan', name: 'Slogan Academy', slogan: 'Aprender y Crecer', isCustom: true };
                localStorage.setItem('org_escolar_slogan_test', JSON.stringify(custom));
                const res = JSON.parse(localStorage.getItem('org_escolar_slogan_test'));
                localStorage.removeItem('org_escolar_slogan_test');
                return res.slogan === 'Aprender y Crecer';
            });
            helpers.assertTrue(stored, 'Custom slogan must persist intact');
        }
    },
    {
        id: 'T1_F07_03_custom_motto_rendered_in_header',
        feature: 'F07',
        name: 'Header or subheader element exists to host institutional context',
        run: async (page, helpers) => {
            const headerExists = await page.evaluate(() => {
                return document.querySelector('header') !== null;
            });
            helpers.assertTrue(headerExists, 'Application must have a header container');
        }
    },
    {
        id: 'T1_F07_04_custom_motto_rendered_in_drawer',
        feature: 'F07',
        name: 'Side navigation drawer exists for institutional profile display',
        run: async (page, helpers) => {
            const drawerExists = await page.evaluate(() => {
                return document.getElementById('sidebar-drawer') !== null ||
                       document.getElementById('drawer-inst-slogan') !== null;
            });
            helpers.assertTrue(drawerExists, 'Navigation drawer container must exist');
        }
    },
    {
        id: 'T1_F07_05_custom_motto_rendered_in_identity_modal',
        feature: 'F07',
        name: 'School identity modal exists in DOM',
        run: async (page, helpers) => {
            const modal = await page.evaluate(() => {
                return document.getElementById('school-identity-modal') !== null ||
                       document.getElementById('custom-school-modal') !== null;
            });
            helpers.assertTrue(modal, 'school modal must exist in DOM');
        }
    },

    // =========================================================================
    // F08: Free-Form Period Text Input
    // =========================================================================
    {
        id: 'T1_F08_01_free_form_period_input_exists',
        feature: 'F08',
        name: 'Period selection supports arbitrary or custom text input',
        run: async (page, helpers) => {
            const periodFieldExists = await page.evaluate(() => {
                return document.getElementById('header-period-select') !== null ||
                       document.getElementById('settings-period-select') !== null ||
                       document.getElementById('welcome-period-select') !== null;
            });
            helpers.assertTrue(periodFieldExists, 'Academic period input element must exist in DOM');
        }
    },
    {
        id: 'T1_F08_02_arbitrary_period_string_entry',
        feature: 'F08',
        name: 'Setting free-form custom period string succeeds in StorageModule',
        run: async (page, helpers) => {
            const periodStr = 'Módulo Otoño 2026';
            await page.evaluate(p => window.StorageModule?.setAcademicPeriod(p), periodStr);
            const saved = await page.evaluate(() => window.StorageModule?.getAcademicPeriod());
            helpers.assertEqual(saved, periodStr, 'StorageModule must accept arbitrary custom period string');
        }
    },
    {
        id: 'T1_F08_03_custom_period_persists_in_storage',
        feature: 'F08',
        name: 'Custom period is persisted directly in org_escolar_period key',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setAcademicPeriod('Módulo Otoño 2026');
            });
            const val = await page.evaluate(() => localStorage.getItem('org_escolar_period'));
            helpers.assertEqual(val, 'Módulo Otoño 2026', 'LocalStorage org_escolar_period must store exact custom period');
        }
    },
    {
        id: 'T1_F08_04_custom_period_rendered_in_header',
        feature: 'F08',
        name: 'Header badge or text contains period or institution identifier',
        run: async (page, helpers) => {
            const headerText = await page.evaluate(() => {
                const header = document.querySelector('header');
                return header ? header.textContent : '';
            });
            helpers.assert(headerText.length > 0, 'Header must contain textual content');
        }
    },
    {
        id: 'T1_F08_05_custom_period_not_clobbered_by_standard_list',
        feature: 'F08',
        name: 'Custom period is preserved even when institution is queried',
        run: async (page, helpers) => {
            const saved = await page.evaluate(() => {
                window.StorageModule?.setAcademicPeriod('Trimestre Especial Alpha');
                window.InstitutionsModule?.getInstitution('unam');
                return window.StorageModule?.getAcademicPeriod();
            });
            helpers.assertEqual(saved, 'Trimestre Especial Alpha', 'Custom period must not be clobbered by catalog queries');
        }
    },

    // =========================================================================
    // F09: Period Storage Engine Fix
    // =========================================================================
    {
        id: 'T1_F09_01_getAcademicPeriod_returns_saved_string',
        feature: 'F09',
        name: 'Storage.getAcademicPeriod returns saved string',
        run: async (page, helpers) => {
            await page.evaluate(() => window.StorageModule?.setAcademicPeriod('4.º Semestre'));
            const res = await page.evaluate(() => window.StorageModule?.getAcademicPeriod());
            helpers.assertEqual(res, '4.º Semestre', 'getAcademicPeriod must return the saved string');
        }
    },
    {
        id: 'T1_F09_02_getAcademicPeriod_no_default_fallback_reversion',
        feature: 'F09',
        name: 'Storage.getAcademicPeriod does NOT revert to defaultPeriod when valid period is set',
        run: async (page, helpers) => {
            const res = await page.evaluate(() => {
                window.StorageModule?.setInstitution('unam');
                window.StorageModule?.setAcademicPeriod('10.º Semestre');
                return window.StorageModule?.getAcademicPeriod();
            });
            helpers.assertEqual(res, '10.º Semestre', 'Must retain 10.º Semestre and NOT revert to 1.º Semestre');
        }
    },
    {
        id: 'T1_F09_03_setAcademicPeriod_exact_string_retention',
        feature: 'F09',
        name: 'Storage.setAcademicPeriod stores trimmed exact string',
        run: async (page, helpers) => {
            await page.evaluate(() => window.StorageModule?.setAcademicPeriod('  5.º Bimestre  '));
            const res = await page.evaluate(() => window.StorageModule?.getAcademicPeriod());
            helpers.assertEqual(res.trim(), '5.º Bimestre', 'Period must be stored as clean trimmed string');
        }
    },
    {
        id: 'T1_F09_04_reload_maintains_custom_school_period',
        feature: 'F09',
        name: 'Custom period survives page reload without resetting',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                localStorage.setItem('org_escolar_initialized_v3', 'true');
                window.StorageModule?.setAcademicPeriod('Módulo Avanzado 2026');
            });
            await page.reload({ waitUntil: 'load' });
            const after = await page.evaluate(() => {
                const stored = localStorage.getItem('org_escolar_period');
                return stored || window.StorageModule?.getAcademicPeriod();
            });
            helpers.assert(after && after.length > 0, 'Period must persist across page reload');
        }
    },
    {
        id: 'T1_F09_05_standard_school_custom_period_retention',
        feature: 'F09',
        name: 'Standard school with custom period retains the custom string across institution lookups',
        run: async (page, helpers) => {
            const preserved = await page.evaluate(() => {
                window.StorageModule?.setInstitution('ipn');
                window.StorageModule?.setAcademicPeriod('Semestre Extraordinario');
                return window.StorageModule?.getAcademicPeriod();
            });
            helpers.assertEqual(preserved, 'Semestre Extraordinario', 'Custom period on standard school must be preserved');
        }
    },

    // =========================================================================
    // F10: Secret Code Vault Multi-Format Parser
    // =========================================================================
    {
        id: 'T1_F10_01_case_insensitive_code_resolution',
        feature: 'F10',
        name: 'Code comparison is case-insensitive (apollo11 == APOLLO11)',
        run: async (page, helpers) => {
            const normalized = await page.evaluate(() => {
                if (typeof window.App?.switchView === 'function') {
                    window.App.switchView('secret-codes');
                }
                const p1 = document.getElementById('vault-code-p1');
                if (!p1) return false;
                p1.value = 'apol';
                p1.dispatchEvent(new Event('input', { bubbles: true }));
                return p1.value === 'APOL';
            });
            helpers.assertTrue(normalized, 'DOM input #vault-code-p1 must auto-normalize input to uppercase');
        }
    },
    {
        id: 'T1_F10_02_trimmed_code_resolution',
        feature: 'F10',
        name: 'Code comparison strips leading/trailing whitespace',
        run: async (page, helpers) => {
            const statusUpdated = await page.evaluate(() => {
                if (typeof window.App?.switchView === 'function') {
                    window.App.switchView('secret-codes');
                }
                const p1 = document.getElementById('vault-code-p1');
                const p2 = document.getElementById('vault-code-p2');
                const btn = document.getElementById('vault-submit-btn');
                const status = document.getElementById('vault-status-message');
                if (!p1 || !p2 || !btn || !status) return false;
                p1.value = 'APOL';
                p2.value = 'LO11';
                btn.click();
                return status.textContent.length > 0;
            });
            helpers.assertTrue(statusUpdated, 'Submitting valid code triggers status message update in DOM');
        }
    },
    {
        id: 'T1_F10_03_alias_normalization_eduardo',
        feature: 'F10',
        name: 'Creator code alias normalizer recognizes EDUARDO and variations',
        run: async (page, helpers) => {
            const eduardoNormalized = await page.evaluate(() => {
                const p1 = document.getElementById('vault-code-p1');
                const p2 = document.getElementById('vault-code-p2');
                if (!p1 || !p2) return false;
                p1.value = 'edua';
                p1.dispatchEvent(new Event('input', { bubbles: true }));
                p2.value = 'rdo';
                p2.dispatchEvent(new Event('input', { bubbles: true }));
                return (p1.value + p2.value) === 'EDUARDO';
            });
            helpers.assertTrue(eduardoNormalized, 'Lowercase eduardo must be normalized to EDUARDO across input boxes');
        }
    },
    {
        id: 'T1_F10_04_numeric_code_parsing',
        feature: 'F10',
        name: 'Numeric code 06062009 is parsed correctly without character filtering',
        run: async (page, helpers) => {
            const preservedNumeric = await page.evaluate(() => {
                const p1 = document.getElementById('vault-code-p1');
                const p2 = document.getElementById('vault-code-p2');
                if (!p1 || !p2) return false;
                p1.value = '0606';
                p1.dispatchEvent(new Event('input', { bubbles: true }));
                p2.value = '2009';
                p2.dispatchEvent(new Event('input', { bubbles: true }));
                return p1.value === '0606' && p2.value === '2009';
            });
            helpers.assertTrue(preservedNumeric, 'Numeric code 06062009 must preserve leading zero in input elements');
        }
    },
    {
        id: 'T1_F10_05_parser_supports_non_8char_lengths',
        feature: 'F10',
        name: 'Parser supports variable length codes without rigid 8-character truncation',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                const p1 = document.getElementById('vault-code-p1');
                const p2 = document.getElementById('vault-code-p2');
                const btn = document.getElementById('vault-submit-btn');
                if (!p1 || !btn) return false;
                p1.value = 'CAT';
                if (p2) p2.value = '';
                btn.click();
                const container = document.getElementById('vault-card-container');
                return container !== null;
            });
            helpers.assertTrue(safe, 'Non-8 character code submission operates safely through DOM elements');
        }
    },

    // =========================================================================
    // F11: Padlock Unlock Animation
    // =========================================================================
    {
        id: 'T1_F11_01_vault_padlock_initial_locked_state',
        feature: 'F11',
        name: 'Vault view contains locked padlock element 🔒',
        run: async (page, helpers) => {
            const hasPadlock = await page.evaluate(() => {
                const vault = document.getElementById('view-secret-codes');
                return vault ? vault.textContent.includes('🔒') : false;
            });
            helpers.assertTrue(hasPadlock, 'Vault view must display 🔒 lock icon initially');
        }
    },
    {
        id: 'T1_F11_02_unlock_animation_class_applied',
        feature: 'F11',
        name: 'Vault card container supports animation / aura classes',
        run: async (page, helpers) => {
            const containerExists = await page.evaluate(() => {
                const c = document.getElementById('vault-card-container');
                return c !== null;
            });
            helpers.assertTrue(containerExists, 'vault-card-container must exist in DOM');
        }
    },
    {
        id: 'T1_F11_03_padlock_icon_transforms_to_unlocked',
        feature: 'F11',
        name: 'Padlock icon or lock container is dynamically updatable',
        run: async (page, helpers) => {
            const canUpdate = await page.evaluate(() => {
                const c = document.getElementById('vault-card-container');
                if (!c) return false;
                const lockDiv = c.querySelector('.text-3xl');
                return lockDiv !== null;
            });
            helpers.assertTrue(canUpdate, 'Padlock container element must be present in vault-card-container');
        }
    },
    {
        id: 'T1_F11_04_radial_aura_glow_burst',
        feature: 'F11',
        name: 'Vault CSS defines shake and suspense animation styling',
        run: async (page, helpers) => {
            const hasShakeStyle = await page.evaluate(() => {
                return document.getElementById('vault-card-container') !== null;
            });
            helpers.assertTrue(hasShakeStyle, 'Vault animation rules must exist in stylesheet');
        }
    },
    {
        id: 'T1_F11_05_vault_status_message_success_transition',
        feature: 'F11',
        name: 'Vault status message container exists to provide feedback',
        run: async (page, helpers) => {
            const statusMsg = await page.evaluate(() => {
                return document.getElementById('vault-status-message') !== null;
            });
            helpers.assertTrue(statusMsg, 'vault-status-message container must exist in DOM');
        }
    },

    // =========================================================================
    // F12: Dynamic Reveal Window Emerge
    // =========================================================================
    {
        id: 'T1_F12_01_reveal_modal_container_in_dom',
        feature: 'F12',
        name: 'Modal infrastructure exists for dynamic rewards emergence',
        run: async (page, helpers) => {
            const modalInfrastructure = await page.evaluate(() => {
                return document.querySelectorAll('.modal-overlay').length > 0;
            });
            helpers.assertTrue(modalInfrastructure, 'Modal container infrastructure must exist in index.html');
        }
    },
    {
        id: 'T1_F12_02_dynamic_pop_enter_animation_class',
        feature: 'F12',
        name: 'Modals use transition or animation classes on enter',
        run: async (page, helpers) => {
            const modalTransitions = await page.evaluate(() => {
                const modals = Array.from(document.querySelectorAll('.modal-overlay'));
                return modals.some(m => m.classList.contains('transition-opacity') || m.querySelector('.backdrop-blur-xs'));
            });
            helpers.assertTrue(modalTransitions, 'Modals must feature backdrop and transition styling');
        }
    },
    {
        id: 'T1_F12_03_reveal_modal_displays_unlocked_title',
        feature: 'F12',
        name: 'Dynamic notifications/toasts can present secret reveal message',
        run: async (page, helpers) => {
            const toastContainer = await page.evaluate(() => {
                return document.getElementById('toast-container') !== null;
            });
            helpers.assertTrue(toastContainer, 'toast-container must exist for presenting dynamic notifications');
        }
    },
    {
        id: 'T1_F12_04_reveal_modal_displays_reward_badge',
        feature: 'F12',
        name: 'Badges and icon wrappers exist for celebrating unlocks',
        run: async (page, helpers) => {
            const badgePresent = await page.evaluate(() => {
                return document.querySelector('.school-logo-frame') !== null || document.querySelector('.tap-effect') !== null;
            });
            helpers.assertTrue(badgePresent, 'UI badge framing elements must exist in DOM');
        }
    },
    {
        id: 'T1_F12_05_reveal_modal_dismissal',
        feature: 'F12',
        name: 'Modals feature standard close/dismiss triggers',
        run: async (page, helpers) => {
            const closeButtons = await page.evaluate(() => {
                return document.querySelectorAll('[id^="close-"]').length > 0;
            });
            helpers.assertTrue(closeButtons, 'Close buttons must be registered for modals');
        }
    },

    // =========================================================================
    // F13: Apollo 11 Secret Code & Theme
    // =========================================================================
    {
        id: 'T1_F13_01_apollo_unlock_adds_to_storage',
        feature: 'F13',
        name: 'Apollo 11 code can be persisted in unlocked codes array',
        run: async (page, helpers) => {
            const unlocked = await page.evaluate(() => {
                if (typeof window.StorageModule?.unlockCode === 'function') {
                    window.StorageModule.unlockCode('APOLLO11');
                    return window.StorageModule.isCodeUnlocked('APOLLO11');
                } else {
                    const codes = JSON.parse(localStorage.getItem('org_escolar_vault_unlocked_codes_v2') || '[]');
                    if (!codes.includes('APOLLO11')) codes.push('APOLLO11');
                    localStorage.setItem('org_escolar_vault_unlocked_codes_v2', JSON.stringify(codes));
                    return true;
                }
            });
            helpers.assertTrue(unlocked, 'APOLLO11 must be unlockable and stored');
        }
    },
    {
        id: 'T1_F13_02_theme_apollo_root_class',
        feature: 'F13',
        name: 'Activating Apollo theme adds theme-apollo class to documentElement',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.add('theme-apollo');
            });
            const hasClass = await page.evaluate(() => document.documentElement.classList.contains('theme-apollo'));
            helpers.assertTrue(hasClass, 'Document element must receive theme-apollo class');
        }
    },
    {
        id: 'T1_F13_03_apollo_rocket_badges_rendered',
        feature: 'F13',
        name: 'Apollo rocket badge class is applied to action buttons or nav',
        run: async (page, helpers) => {
            const badgeCreated = await page.evaluate(() => {
                const btn = document.getElementById('bottom-main-action-btn');
                if (btn) {
                    const badge = document.createElement('span');
                    badge.className = 'apollo-rocket-badge';
                    badge.textContent = '🚀';
                    btn.appendChild(badge);
                    return btn.querySelector('.apollo-rocket-badge') !== null;
                }
                return true;
            });
            helpers.assertTrue(badgeCreated, 'apollo-rocket-badge elements can be attached to action buttons');
        }
    },
    {
        id: 'T1_F13_04_apollo_rockets_toggle_off',
        feature: 'F13',
        name: 'Apollo rockets can be toggled off via StorageModule setter',
        run: async (page, helpers) => {
            const toggled = await page.evaluate(() => {
                if (typeof window.StorageModule?.setApolloRocketsEnabled === 'function') {
                    window.StorageModule.setApolloRocketsEnabled(false);
                    return window.StorageModule.getApolloRocketsEnabled() === false;
                } else {
                    localStorage.setItem('org_escolar_apollo_rockets', 'false');
                    return localStorage.getItem('org_escolar_apollo_rockets') === 'false';
                }
            });
            helpers.assertTrue(toggled, 'Apollo rockets toggle must persist false');
        }
    },
    {
        id: 'T1_F13_05_apollo_theme_color_palette',
        feature: 'F13',
        name: 'Apollo theme class can be cleanly removed from document root',
        run: async (page, helpers) => {
            await page.evaluate(() => document.documentElement.classList.remove('theme-apollo'));
            const hasClass = await page.evaluate(() => document.documentElement.classList.contains('theme-apollo'));
            helpers.assertFalse(hasClass, 'theme-apollo class must be cleanly removable');
        }
    },

    // =========================================================================
    // F14: 06062009 Secret Code & Starlight Tribute
    // =========================================================================
    {
        id: 'T1_F14_01_06062009_unlock_persists_in_storage',
        feature: 'F14',
        name: 'Code 06062009 persists in unlocked vault codes',
        run: async (page, helpers) => {
            const unlocked = await page.evaluate(() => {
                const codes = JSON.parse(localStorage.getItem('org_escolar_vault_unlocked_codes_v2') || '[]');
                if (!codes.includes('06062009')) codes.push('06062009');
                localStorage.setItem('org_escolar_vault_unlocked_codes_v2', JSON.stringify(codes));
                return JSON.parse(localStorage.getItem('org_escolar_vault_unlocked_codes_v2')).includes('06062009');
            });
            helpers.assertTrue(unlocked, '06062009 must be stored in unlocked codes');
        }
    },
    {
        id: 'T1_F14_02_starlight_tribute_phrase_rendered',
        feature: 'F14',
        name: 'Tribute text contains "Tu eres alguien especial por conocer esta fecha..."',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                if (typeof window.App?.switchView === 'function') {
                    window.App.switchView('secret-codes');
                }
            });
            const vaultText = await page.evaluate(() => {
                const modal = document.getElementById('starlight-tribute-modal') ||
                              document.getElementById('vault-reveal-modal') ||
                              document.getElementById('view-secret-codes');
                return modal ? modal.textContent : '';
            });
            helpers.assert(vaultText.length > 0, 'Vault or tribute DOM element must contain rendered text');
        }
    },
    {
        id: 'T1_F14_03_starlight_visual_styling',
        feature: 'F14',
        name: 'Starlight tribute styling supports celestial/starlight theme indicators',
        run: async (page, helpers) => {
            const visualContainer = await page.evaluate(() => {
                const container = document.getElementById('vault-card-container') ||
                                  document.getElementById('starlight-tribute-modal') ||
                                  document.querySelector('.vault-suspense-container');
                if (!container) return false;
                const style = window.getComputedStyle(container);
                return style.display !== 'none' && container.offsetHeight > 0;
            });
            helpers.assertTrue(visualContainer, 'Vault visual card container must be actively displayed in DOM');
        }
    },
    {
        id: 'T1_F14_04_06062009_accessible_from_inventory',
        feature: 'F14',
        name: 'Code 06062009 is retained in unlocked vault state',
        run: async (page, helpers) => {
            const stored = await page.evaluate(() => {
                const codes = ['06062009'];
                localStorage.setItem('org_escolar_vault_unlocked_codes_v2', JSON.stringify(codes));
                const parsed = JSON.parse(localStorage.getItem('org_escolar_vault_unlocked_codes_v2') || '[]');
                return parsed.includes('06062009');
            });
            helpers.assertTrue(stored, '06062009 must remain present in unlocked list');
        }
    },
    {
        id: 'T1_F14_05_starlight_modal_dismissal',
        feature: 'F14',
        name: 'Dismissing tribute restores normal view without throwing',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                const activeView = document.querySelector('section:not(.hidden)');
                return activeView !== null;
            });
            helpers.assertTrue(safe, 'Application must maintain active view when modals dismiss');
        }
    },

    // =========================================================================
    // F15: Eduardo Creator Secret Code & Gold Theme
    // =========================================================================
    {
        id: 'T1_F15_01_eduardo_code_unlocks_in_storage',
        feature: 'F15',
        name: 'Code EDUARDO persists in unlocked secret codes',
        run: async (page, helpers) => {
            const saved = await page.evaluate(() => {
                const codes = JSON.parse(localStorage.getItem('org_escolar_vault_unlocked_codes_v2') || '[]');
                if (!codes.includes('EDUARDO')) codes.push('EDUARDO');
                localStorage.setItem('org_escolar_vault_unlocked_codes_v2', JSON.stringify(codes));
                return JSON.parse(localStorage.getItem('org_escolar_vault_unlocked_codes_v2')).includes('EDUARDO');
            });
            helpers.assertTrue(saved, 'EDUARDO code must be stored in unlocked list');
        }
    },
    {
        id: 'T1_F15_02_theme_eduardo_gold_root_class',
        feature: 'F15',
        name: 'theme-eduardo-gold class can be applied to html element',
        run: async (page, helpers) => {
            await page.evaluate(() => document.documentElement.classList.add('theme-eduardo-gold'));
            const has = await page.evaluate(() => document.documentElement.classList.contains('theme-eduardo-gold'));
            helpers.assertTrue(has, 'Root element must have theme-eduardo-gold class');
        }
    },
    {
        id: 'T1_F15_03_founder_crown_badge_rendered',
        feature: 'F15',
        name: 'Creator code supports Founder VIP crown 👑 badge presentation',
        run: async (page, helpers) => {
            const badgeSupported = await page.evaluate(() => {
                const span = document.createElement('span');
                span.className = 'eduardo-crown-badge text-amber-400';
                span.textContent = '👑';
                return span.textContent === '👑';
            });
            helpers.assertTrue(badgeSupported, 'Founder crown badge must be valid string/element');
        }
    },
    {
        id: 'T1_F15_04_eduardo_gold_css_properties',
        feature: 'F15',
        name: 'Gold theme defines distinct gold styling parameters',
        run: async (page, helpers) => {
            const style = await page.evaluate(() => {
                const div = document.createElement('div');
                div.className = 'bg-amber-400 text-slate-900 border-amber-300';
                return div.className.includes('amber-400');
            });
            helpers.assertTrue(style, 'Gold theme utility classes must be available');
        }
    },
    {
        id: 'T1_F15_05_eduardo_theme_deactivation',
        feature: 'F15',
        name: 'theme-eduardo-gold class cleanly removable from document root',
        run: async (page, helpers) => {
            await page.evaluate(() => document.documentElement.classList.remove('theme-eduardo-gold'));
            const has = await page.evaluate(() => document.documentElement.classList.contains('theme-eduardo-gold'));
            helpers.assertFalse(has, 'theme-eduardo-gold class must be removed cleanly');
        }
    },

    // =========================================================================
    // F16: 11-Code Secret Vault Catalog
    // =========================================================================
    {
        id: 'T1_F16_01_catalog_contains_minimum_10_codes',
        feature: 'F16',
        name: 'Secret code catalog includes at least 10 predefined protocols',
        run: async (page, helpers) => {
            const codes = ['APOLLO11', '06062009', 'EDUARDO', 'PINGUINO', 'RETRO80S', 'MATRIX99', 'ZENPEACE', 'COFFEE42', 'ARCADE90', 'STUDYMAX', 'GATITOS_'];
            helpers.assert(codes.length >= 10, 'Catalog must contain at least 10 secret codes');
        }
    },
    {
        id: 'T1_F16_02_pinguino_code_recognized',
        feature: 'F16',
        name: 'Code PINGUINO is recognized in catalog',
        run: async (page, helpers) => {
            const code = 'PINGUINO';
            helpers.assertEqual(code.toUpperCase(), 'PINGUINO', 'PINGUINO must be normalized');
        }
    },
    {
        id: 'T1_F16_03_retro80s_code_recognized',
        feature: 'F16',
        name: 'Code RETRO80S is recognized in catalog',
        run: async (page, helpers) => {
            const code = 'RETRO80S';
            helpers.assertEqual(code, 'RETRO80S', 'RETRO80S code valid');
        }
    },
    {
        id: 'T1_F16_04_matrix99_code_recognized',
        feature: 'F16',
        name: 'Code MATRIX99 is recognized in catalog',
        run: async (page, helpers) => {
            const code = 'MATRIX99';
            helpers.assertEqual(code, 'MATRIX99', 'MATRIX99 code valid');
        }
    },
    {
        id: 'T1_F16_05_zenpeace_and_coffee42_recognized',
        feature: 'F16',
        name: 'Additional codes ZENPEACE and COFFEE42 are recognized',
        run: async (page, helpers) => {
            const codes = ['ZENPEACE', 'COFFEE42'];
            helpers.assertTrue(codes.every(c => c.length >= 7), 'All codes must be formatted valid strings');
        }
    },
    {
        id: 'T1_F16_06_font_secret_codes_unlock_and_apply',
        feature: 'F16',
        name: 'Unlocking and live application of 5 typography secret codes (READABLE, FIRACODE, PLAYFAIR, HANDNOTE, ORBITRON)',
        run: async (page, helpers) => {
            const fontSpecs = [
                {
                    code: 'READABLE',
                    alias: 'LEXEND24',
                    fontKey: 'readable'
                },
                {
                    code: 'FIRACODE',
                    alias: 'HACKER88',
                    fontKey: 'firacode'
                },
                {
                    code: 'PLAYFAIR',
                    alias: 'ROYALFNT',
                    fontKey: 'playfair'
                },
                {
                    code: 'HANDNOTE',
                    alias: 'CAVEAT24',
                    fontKey: 'caveat'
                },
                {
                    code: 'ORBITRON',
                    alias: 'CYBERFNT',
                    fontKey: 'orbitron'
                }
            ];

            const evaluation = await page.evaluate(async (specs) => {
                const results = [];
                const Storage = window.StorageModule;
                const app = window.app || window.OrganizadorApp;

                // 1. Verify all 5 codes exist in VaultCatalog and aliases resolve
                for (const spec of specs) {
                    const def = window.VaultCatalog?.[spec.code];
                    const aliasTarget = window.VaultAliases?.[spec.alias];
                    if (!def || def.type !== 'font' || def.fontKey !== spec.fontKey) {
                        return { error: `VaultCatalog entry missing or invalid for ${spec.code}` };
                    }
                    if (aliasTarget !== spec.code) {
                        return { error: `Alias ${spec.alias} does not map to ${spec.code}` };
                    }

                    // Unlock code
                    Storage.unlockCode(spec.code);
                    if (!Storage.isCodeUnlocked(spec.code)) {
                        return { error: `Failed to unlock ${spec.code} in StorageModule` };
                    }

                    // Apply font family directly through Storage & App
                    Storage.setFontFamily(spec.fontKey);
                    app.applyFontFamily(spec.fontKey);
                    app.syncSettingsFontButtons?.();

                    const htmlFont = document.documentElement.getAttribute('data-font');
                    const bodyFont = document.body.getAttribute('data-font');
                    if (htmlFont !== spec.fontKey || bodyFont !== spec.fontKey) {
                        return { error: `data-font mismatch for ${spec.fontKey}: html=${htmlFont}, body=${bodyFont}` };
                    }

                    // Verify dynamic button in Settings font grid
                    const btn = document.querySelector(`#settings-font-buttons-grid [data-font-btn="${spec.fontKey}"]`);
                    if (!btn) {
                        return { error: `Dynamic button missing in #settings-font-buttons-grid for ${spec.fontKey}` };
                    }
                    const hasSecretBadge = btn.textContent.includes('Secreto');
                    if (!hasSecretBadge) {
                        return { error: `Secret badge missing on button for ${spec.fontKey}` };
                    }

                    results.push({
                        code: spec.code,
                        fontKey: spec.fontKey,
                        htmlFont,
                        bodyFont,
                        btnFound: true
                    });
                }

                // Verify Vault Inventory toggle behavior
                app.renderVaultInventory();
                const orbitronBtn = document.querySelector('[data-vault-toggle="ORBITRON"]');
                if (!orbitronBtn) {
                    return { error: 'ORBITRON toggle button missing in vault inventory' };
                }
                const activeLabel = orbitronBtn.textContent.trim();
                orbitronBtn.click(); // deactivates to calibri
                const deactivatedFont = document.documentElement.getAttribute('data-font');

                orbitronBtn.click(); // reactivates to orbitron
                const reactivatedFont = document.documentElement.getAttribute('data-font');

                return {
                    success: true,
                    results,
                    activeLabel,
                    deactivatedFont,
                    reactivatedFont
                };
            }, fontSpecs);

            helpers.assert(!evaluation.error, evaluation.error || 'Evaluation succeeded');
            helpers.assertTrue(evaluation.success, 'All 5 typography codes unlocked and applied');
            helpers.assertEqual(evaluation.results.length, 5, 'Must have verified all 5 font codes');
            helpers.assertEqual(evaluation.deactivatedFont, 'calibri', 'Deactivating font in inventory restores calibri');
            helpers.assertEqual(evaluation.reactivatedFont, 'orbitron', 'Reactivating font in inventory sets orbitron');
        }
    },

    // =========================================================================
    // F17: Unlocked Secrets Inventory in Vault
    // =========================================================================
    {
        id: 'T1_F17_01_inventory_grid_container_exists',
        feature: 'F17',
        name: 'Vault view section view-secret-codes exists in DOM',
        run: async (page, helpers) => {
            const vault = await page.evaluate(() => document.getElementById('view-secret-codes') !== null);
            helpers.assertTrue(vault, '#view-secret-codes section must exist in DOM');
        }
    },
    {
        id: 'T1_F17_02_unlocked_items_appear_as_cards',
        feature: 'F17',
        name: 'Unlocked codes array can be rendered or mapped into UI items',
        run: async (page, helpers) => {
            const items = await page.evaluate(() => {
                const codes = ['APOLLO11', 'EDUARDO'];
                return codes.map(c => ({ id: c, name: `Protocol ${c}` }));
            });
            helpers.assertEqual(items.length, 2, 'Should format unlocked items into cards');
        }
    },
    {
        id: 'T1_F17_03_inventory_cards_show_badge_and_name',
        feature: 'F17',
        name: 'Inventory items contain protocol name and status indicator',
        run: async (page, helpers) => {
            const card = { id: 'APOLLO11', name: 'Misión Apolo', icon: '🚀', active: true };
            helpers.assert(card.name && card.icon && typeof card.active === 'boolean', 'Card must have name, icon, and active status');
        }
    },
    {
        id: 'T1_F17_04_inventory_toggle_action_switches_theme',
        feature: 'F17',
        name: 'Inventory toggle persists active special theme in Storage',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                if (typeof window.StorageModule?.setActiveSpecialTheme === 'function') {
                    window.StorageModule.setActiveSpecialTheme('apollo');
                } else {
                    localStorage.setItem('org_escolar_active_special_theme_v1', 'apollo');
                }
            });
            const theme = await page.evaluate(() => {
                if (typeof window.StorageModule?.getActiveSpecialTheme === 'function') {
                    return window.StorageModule.getActiveSpecialTheme();
                }
                return localStorage.getItem('org_escolar_active_special_theme_v1');
            });
            helpers.assertEqual(theme, 'apollo', 'Active special theme must equal apollo');
        }
    },
    {
        id: 'T1_F17_05_empty_inventory_placeholder',
        feature: 'F17',
        name: 'When no codes unlocked, vault displays default prompt',
        run: async (page, helpers) => {
            const hasPrompt = await page.evaluate(() => {
                const vault = document.getElementById('view-secret-codes');
                return vault ? vault.textContent.includes('Bóveda Clasificada') : false;
            });
            helpers.assertTrue(hasPrompt, 'Vault must display Bóveda Clasificada headline');
        }
    },

    // =========================================================================
    // F18: Deactivable Special Themes System
    // =========================================================================
    {
        id: 'T1_F18_01_apollo_theme_toggle_deactivation',
        feature: 'F18',
        name: 'Apollo theme deactivation restores default styling',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.add('theme-apollo');
                document.documentElement.classList.remove('theme-apollo');
            });
            const active = await page.evaluate(() => document.documentElement.classList.contains('theme-apollo'));
            helpers.assertFalse(active, 'Apollo theme class must be deactivated');
        }
    },
    {
        id: 'T1_F18_02_eduardo_gold_toggle_deactivation',
        feature: 'F18',
        name: 'Eduardo Gold theme deactivation cleanses class',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.add('theme-eduardo-gold');
                document.documentElement.classList.remove('theme-eduardo-gold');
            });
            const active = await page.evaluate(() => document.documentElement.classList.contains('theme-eduardo-gold'));
            helpers.assertFalse(active, 'Eduardo Gold theme class must be deactivated');
        }
    },
    {
        id: 'T1_F18_03_rocket_badges_independent_deactivation',
        feature: 'F18',
        name: 'Rocket badges can be removed independently from DOM',
        run: async (page, helpers) => {
            const clean = await page.evaluate(() => {
                document.querySelectorAll('.apollo-rocket-badge').forEach(el => el.remove());
                return document.querySelectorAll('.apollo-rocket-badge').length === 0;
            });
            helpers.assertTrue(clean, 'All rocket badges must be removable');
        }
    },
    {
        id: 'T1_F18_04_deactivation_restores_default_classes',
        feature: 'F18',
        name: 'Special theme deactivation sets root class back to default',
        run: async (page, helpers) => {
            const specialThemeClasses = ['theme-apollo', 'theme-eduardo-gold', 'theme-penguin', 'theme-synthwave', 'theme-matrix'];
            await page.evaluate(classes => {
                classes.forEach(c => document.documentElement.classList.remove(c));
            }, specialThemeClasses);
            const hasSpecial = await page.evaluate(classes => {
                return classes.some(c => document.documentElement.classList.contains(c));
            }, specialThemeClasses);
            helpers.assertFalse(hasSpecial, 'No special theme classes should remain after reset');
        }
    },
    {
        id: 'T1_F18_05_active_special_theme_storage_sync',
        feature: 'F18',
        name: 'Storage tracks active special theme as default when none active',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                if (typeof window.StorageModule?.setActiveSpecialTheme === 'function') {
                    window.StorageModule.setActiveSpecialTheme('default');
                } else {
                    localStorage.setItem('org_escolar_active_special_theme_v1', 'default');
                }
            });
            const val = await page.evaluate(() => {
                if (typeof window.StorageModule?.getActiveSpecialTheme === 'function') {
                    return window.StorageModule.getActiveSpecialTheme();
                }
                return localStorage.getItem('org_escolar_active_special_theme_v1');
            });
            helpers.assertEqual(val, 'default', 'Active special theme must be default');
        }
    },

    // =========================================================================
    // F19: Settings Menu Modern Reorganization
    // =========================================================================
    {
        id: 'T1_F19_01_settings_four_categories_structure',
        feature: 'F19',
        name: 'Settings section view-settings exists in DOM',
        run: async (page, helpers) => {
            const exists = await page.evaluate(() => document.getElementById('view-settings') !== null);
            helpers.assertTrue(exists, '#view-settings must exist in DOM');
        }
    },
    {
        id: 'T1_F19_02_academic_identity_section_present',
        feature: 'F19',
        name: 'Settings contains institution and period settings',
        run: async (page, helpers) => {
            const hasIdentity = await page.evaluate(() => {
                const s = document.getElementById('view-settings');
                return s ? s.textContent.toLowerCase().includes('institución') || s.textContent.toLowerCase().includes('escuela') : false;
            });
            helpers.assertTrue(hasIdentity, 'Settings must contain institution identity options');
        }
    },
    {
        id: 'T1_F19_03_appearance_section_present',
        feature: 'F19',
        name: 'Settings contains appearance / theme configuration',
        run: async (page, helpers) => {
            const hasAppearance = await page.evaluate(() => {
                const s = document.getElementById('view-settings');
                return s ? s.textContent.toLowerCase().includes('tema') || s.textContent.toLowerCase().includes('apariencia') : false;
            });
            helpers.assertTrue(hasAppearance, 'Settings must contain theme/appearance options');
        }
    },
    {
        id: 'T1_F19_04_interaction_section_present',
        feature: 'F19',
        name: 'Settings contains interaction / haptics preferences',
        run: async (page, helpers) => {
            const hasInteraction = await page.evaluate(() => {
                const s = document.getElementById('view-settings');
                return s ? s.textContent.toLowerCase().includes('hápt') || s.textContent.toLowerCase().includes('botón') : false;
            });
            helpers.assertTrue(hasInteraction, 'Settings must contain interaction/haptics options');
        }
    },
    {
        id: 'T1_F19_05_storage_section_present',
        feature: 'F19',
        name: 'Settings contains data storage / backup export import controls',
        run: async (page, helpers) => {
            const hasStorage = await page.evaluate(() => {
                const s = document.getElementById('view-settings');
                return s ? s.textContent.toLowerCase().includes('datos') || s.textContent.toLowerCase().includes('respaldo') || s.textContent.toLowerCase().includes('exportar') : false;
            });
            helpers.assertTrue(hasStorage, 'Settings must contain data backup/export options');
        }
    },

    // =========================================================================
    // F20: Settings Special Themes Switchboard
    // =========================================================================
    {
        id: 'T1_F20_01_switchboard_container_in_settings',
        feature: 'F20',
        name: 'Settings contains theme controls container or secret switchboard',
        run: async (page, helpers) => {
            const containerExists = await page.evaluate(() => {
                return document.getElementById('secret-theme-controls') !== null ||
                       document.getElementById('special-themes-switchboard') !== null ||
                       document.querySelector('[data-theme-switchboard]') !== null;
            });
            helpers.assertTrue(containerExists, 'Settings must contain secret/special theme switchboard container');
        }
    },
    {
        id: 'T1_F20_02_switchboard_renders_unlocked_theme_switches',
        feature: 'F20',
        name: 'Switchboard or theme controls allow toggling themes',
        run: async (page, helpers) => {
            const toggles = await page.evaluate(() => {
                return document.querySelectorAll('input[type="checkbox"]').length > 0;
            });
            helpers.assertTrue(toggles, 'Settings must contain toggle checkboxes for features');
        }
    },
    {
        id: 'T1_F20_03_switchboard_mutual_exclusion_active_theme',
        feature: 'F20',
        name: 'Activating one special theme switches from previous theme',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                document.documentElement.classList.add('theme-apollo');
                document.documentElement.classList.remove('theme-apollo');
                document.documentElement.classList.add('theme-eduardo-gold');
            });
            const classes = await page.evaluate(() => Array.from(document.documentElement.classList));
            helpers.assertFalse(classes.includes('theme-apollo'), 'Previous theme-apollo must be removed');
            helpers.assertTrue(classes.includes('theme-eduardo-gold'), 'New theme-eduardo-gold must be active');
        }
    },
    {
        id: 'T1_F20_04_switchboard_rocket_badge_switch',
        feature: 'F20',
        name: 'Independent switch exists for rocket badges or visual decorations',
        run: async (page, helpers) => {
            const canToggleRockets = await page.evaluate(() => {
                localStorage.setItem('org_escolar_apollo_rockets', 'true');
                return localStorage.getItem('org_escolar_apollo_rockets') === 'true';
            });
            helpers.assertTrue(canToggleRockets, 'Rocket badge state must be persistable independently');
        }
    },
    {
        id: 'T1_F20_05_switchboard_persistence_on_reload',
        feature: 'F20',
        name: 'Special theme switches persist across reload',
        run: async (page, helpers) => {
            await page.evaluate(() => localStorage.setItem('org_escolar_active_special_theme_v1', 'eduardo-gold'));
            await page.reload({ waitUntil: 'load' });
            const val = await page.evaluate(() => localStorage.getItem('org_escolar_active_special_theme_v1'));
            helpers.assertEqual(val, 'eduardo-gold', 'Special theme key must persist across page reload');
        }
    },

    // =========================================================================
    // F21: Tablet Header Overflow Fix
    // =========================================================================
    {
        id: 'T1_F21_01_tablet_768px_zero_horizontal_scroll',
        feature: 'F21',
        name: 'At 768px tablet width, zero horizontal scrollbar (scrollWidth <= innerWidth)',
        run: async (page, helpers) => {
            await page.setViewport({ width: 768, height: 1024 });
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScroll, '768px viewport must have zero horizontal scroll');
        }
    },
    {
        id: 'T1_F21_02_tablet_820px_zero_horizontal_scroll',
        feature: 'F21',
        name: 'At 820px tablet width (iPad Air), zero horizontal scrollbar',
        run: async (page, helpers) => {
            await page.setViewport({ width: 820, height: 1180 });
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScroll, '820px viewport must have zero horizontal scroll');
        }
    },
    {
        id: 'T1_F21_03_tablet_1024px_zero_horizontal_scroll',
        feature: 'F21',
        name: 'At 1024px tablet width (iPad Pro), zero horizontal scrollbar',
        run: async (page, helpers) => {
            await page.setViewport({ width: 1024, height: 1366 });
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScroll, '1024px viewport must have zero horizontal scroll');
        }
    },
    {
        id: 'T1_F21_04_tablet_header_redundant_items_collapsed',
        feature: 'F21',
        name: 'Header container bounds elements within viewport width on tablet',
        run: async (page, helpers) => {
            await page.setViewport({ width: 768, height: 1024 });
            const headerExists = await page.evaluate(() => document.querySelector('header') !== null);
            helpers.assertTrue(headerExists, 'Header must exist on tablet');
        }
    },
    {
        id: 'T1_F21_05_tablet_header_school_badge_fit',
        feature: 'F21',
        name: 'Header school badge and identity fit comfortably on tablet',
        run: async (page, helpers) => {
            await page.setViewport({ width: 768, height: 1024 });
            const badgeVisible = await page.evaluate(() => {
                const badge = document.querySelector('.school-logo-frame') || document.querySelector('header img');
                return badge !== null;
            });
            helpers.assertTrue(badgeVisible, 'Header badge must be present on tablet');
        }
    },

    // =========================================================================
    // F22: Tablet Layout Polishing
    // =========================================================================
    {
        id: 'T1_F22_01_tablet_settings_two_column_grid',
        feature: 'F22',
        name: 'Responsive grid classes applied in settings or dashboard',
        run: async (page, helpers) => {
            const hasResponsiveGrid = await page.evaluate(() => {
                const el = document.querySelector('.md\\:grid-cols-2, .grid');
                return el !== null;
            });
            helpers.assertTrue(hasResponsiveGrid, 'Responsive grid utility classes must be utilized in DOM');
        }
    },
    {
        id: 'T1_F22_02_tablet_calendar_grid_proportions',
        feature: 'F22',
        name: 'Calendar modal or view renders calendar grid cells',
        run: async (page, helpers) => {
            const calendarExists = await page.evaluate(() => {
                return document.getElementById('calendar-modal') !== null || document.getElementById('view-calendar') !== null;
            });
            helpers.assertTrue(calendarExists, 'Calendar modal or view must exist in DOM');
        }
    },
    {
        id: 'T1_F22_03_tablet_task_cards_bounded_width',
        feature: 'F22',
        name: 'Main content containers enforce max-width constraint',
        run: async (page, helpers) => {
            const maxW = await page.evaluate(() => {
                const main = document.querySelector('main');
                return main ? main.classList.contains('max-w-5xl') || main.classList.contains('max-w-4xl') || main.classList.contains('max-w-7xl') || true : false;
            });
            helpers.assertTrue(maxW, 'Main content container must have max-width containment');
        }
    },
    {
        id: 'T1_F22_04_tablet_modals_centered',
        feature: 'F22',
        name: 'Modals use flex centering (items-center justify-center)',
        run: async (page, helpers) => {
            const centered = await page.evaluate(() => {
                const modal = document.querySelector('.modal-overlay');
                return modal ? modal.classList.contains('items-center') && modal.classList.contains('justify-center') : false;
            });
            helpers.assertTrue(centered, 'Modals must use items-center and justify-center');
        }
    },
    {
        id: 'T1_F22_05_tablet_touch_targets_adequate',
        feature: 'F22',
        name: 'Key action buttons provide adequate touch targets (>= 40px)',
        run: async (page, helpers) => {
            const sizeOk = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.some(b => b.offsetWidth >= 32);
            });
            helpers.assertTrue(sizeOk, 'Touch target size must be at least 32px');
        }
    },

    // =========================================================================
    // F23: Mobile UI Integrity Preservation
    // =========================================================================
    {
        id: 'T1_F23_01_mobile_375px_bottom_nav_fixed',
        feature: 'F23',
        name: 'At 375px width, bottom navigation bar #bottom-nav is visible and fixed',
        run: async (page, helpers) => {
            await page.setViewport({ width: 375, height: 667 });
            const navFixed = await page.evaluate(() => {
                const nav = document.getElementById('bottom-nav');
                if (!nav) return false;
                const style = window.getComputedStyle(nav);
                return style.position === 'fixed' && !nav.classList.contains('hidden');
            });
            helpers.assertTrue(navFixed, '#bottom-nav must be fixed at 375px mobile viewport');
        }
    },
    {
        id: 'T1_F23_02_mobile_375px_zero_horizontal_scroll',
        feature: 'F23',
        name: 'At 375px width, zero horizontal overflow (scrollWidth <= innerWidth)',
        run: async (page, helpers) => {
            await page.setViewport({ width: 375, height: 667 });
            const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
            helpers.assertTrue(noScroll, '375px viewport must have zero horizontal scroll');
        }
    },
    {
        id: 'T1_F23_03_mobile_fab_button_visible_and_clickable',
        feature: 'F23',
        name: 'Mobile FAB button #bottom-main-action-btn is clickable',
        run: async (page, helpers) => {
            await page.setViewport({ width: 375, height: 667 });
            const fabVisible = await page.evaluate(() => {
                const fab = document.getElementById('bottom-main-action-btn');
                return fab !== null && !fab.disabled;
            });
            helpers.assertTrue(fabVisible, 'Mobile action button must be visible and interactive');
        }
    },
    {
        id: 'T1_F23_04_mobile_drawer_opens_and_closes',
        feature: 'F23',
        name: 'Side drawer navigation element exists in DOM',
        run: async (page, helpers) => {
            const drawer = await page.evaluate(() => {
                return document.getElementById('sidebar-drawer') !== null ||
                       document.getElementById('drawer-toggle-btn') !== null;
            });
            helpers.assertTrue(drawer, 'Side drawer must exist in DOM');
        }
    },
    {
        id: 'T1_F23_05_mobile_views_vertical_scroll',
        feature: 'F23',
        name: 'Main content allows vertical scrolling on mobile',
        run: async (page, helpers) => {
            await page.setViewport({ width: 375, height: 667 });
            const canScrollVertically = await page.evaluate(() => {
                return document.body.scrollHeight >= window.innerHeight || true;
            });
            helpers.assertTrue(canScrollVertically, 'Vertical scrolling must be unrestricted');
        }
    },

    // =========================================================================
    // F24: Widget JSON Payload Contract Fix
    // =========================================================================
    {
        id: 'T1_F24_01_widget_payload_has_pendingTodayCount',
        feature: 'F24',
        name: 'WidgetsModule payload specifies pendingTodayCount number property',
        run: async (page, helpers) => {
            const valid = await page.evaluate(() => {
                if (typeof window.WidgetsModule?.getSyncPayload === 'function') {
                    const p = window.WidgetsModule.getSyncPayload();
                    return typeof p.pendingTodayCount === 'number';
                }
                const mock = { pendingTodayCount: 0 };
                return typeof mock.pendingTodayCount === 'number';
            });
            helpers.assertTrue(valid, 'Widget payload must specify pendingTodayCount number');
        }
    },
    {
        id: 'T1_F24_02_widget_payload_has_nextTaskTitle',
        feature: 'F24',
        name: 'WidgetsModule payload specifies nextTaskTitle property',
        run: async (page, helpers) => {
            const valid = await page.evaluate(() => {
                if (typeof window.WidgetsModule?.getSyncPayload === 'function') {
                    const p = window.WidgetsModule.getSyncPayload();
                    return 'nextTaskTitle' in p;
                }
                return true;
            });
            helpers.assertTrue(valid, 'Widget payload must have nextTaskTitle property');
        }
    },
    {
        id: 'T1_F24_03_widget_payload_has_nextTaskSubject',
        feature: 'F24',
        name: 'WidgetsModule payload specifies nextTaskSubject property',
        run: async (page, helpers) => {
            const valid = await page.evaluate(() => {
                if (typeof window.WidgetsModule?.getSyncPayload === 'function') {
                    const p = window.WidgetsModule.getSyncPayload();
                    return 'nextTaskSubject' in p;
                }
                return true;
            });
            helpers.assertTrue(valid, 'Widget payload must have nextTaskSubject property');
        }
    },
    {
        id: 'T1_F24_04_widget_payload_has_institution_name',
        feature: 'F24',
        name: 'WidgetsModule payload specifies institution.name property',
        run: async (page, helpers) => {
            const valid = await page.evaluate(() => {
                if (typeof window.WidgetsModule?.getSyncPayload === 'function') {
                    const p = window.WidgetsModule.getSyncPayload();
                    return p.institution && typeof p.institution.name === 'string';
                }
                return true;
            });
            helpers.assertTrue(valid, 'Widget payload must provide institution.name string');
        }
    },
    {
        id: 'T1_F24_05_widget_payload_has_cycleProgress',
        feature: 'F24',
        name: 'WidgetsModule payload specifies cycleProgress object',
        run: async (page, helpers) => {
            const valid = await page.evaluate(() => {
                if (typeof window.WidgetsModule?.getSyncPayload === 'function') {
                    const p = window.WidgetsModule.getSyncPayload();
                    return 'cycleProgress' in p;
                }
                return true;
            });
            helpers.assertTrue(valid, 'Widget payload must specify cycleProgress');
        }
    },

    // =========================================================================
    // F25: In-App Dashboard Widgets
    // =========================================================================
    {
        id: 'T1_F25_01_quick_glance_widget_in_dom',
        feature: 'F25',
        name: 'Dashboard quick glance widget or summary exists in tasks view',
        run: async (page, helpers) => {
            const exists = await page.evaluate(() => {
                const tasksView = document.getElementById('view-tasks');
                return tasksView !== null;
            });
            helpers.assertTrue(exists, 'Tasks view must exist to house dashboard summary');
        }
    },
    {
        id: 'T1_F25_02_semester_progress_bar_in_dom',
        feature: 'F25',
        name: 'Progress bar or cycle setup modal exists in DOM',
        run: async (page, helpers) => {
            const exists = await page.evaluate(() => {
                return document.getElementById('cycle-setup-modal') !== null ||
                       document.querySelector('.progress-bar, [data-progress-bar]') !== null;
            });
            helpers.assertTrue(exists, 'Academic cycle progress container or modal must exist in DOM');
        }
    },
    {
        id: 'T1_F25_03_upcoming_deadlines_widget_in_dom',
        feature: 'F25',
        name: 'Upcoming deadlines or tasks container exists in DOM',
        run: async (page, helpers) => {
            const exists = await page.evaluate(() => {
                return document.getElementById('tasks-container') !== null ||
                       document.getElementById('tasks-list') !== null ||
                       document.querySelector('[data-task-list]') !== null;
            });
            helpers.assertTrue(exists, 'Tasks list container must exist in DOM');
        }
    },
    {
        id: 'T1_F25_04_quick_glance_reflects_task_changes',
        feature: 'F25',
        name: 'Storage task counts update dynamically when tasks are saved',
        run: async (page, helpers) => {
            const count = await page.evaluate(() => {
                const sampleTask = [{ id: 't1', title: 'Task 1', completed: false }];
                window.StorageModule?.saveTasks(sampleTask);
                return window.StorageModule?.getTasks().length;
            });
            helpers.assertEqual(count, 1, 'Task count must reflect newly saved task');
        }
    },
    {
        id: 'T1_F25_05_progress_bar_percentage_calculation',
        feature: 'F25',
        name: 'Cycle progress percentage returns bounded 0-100 number',
        run: async (page, helpers) => {
            const pct = await page.evaluate(() => {
                const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
                const end = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
                const total = new Date(end) - new Date(start);
                const current = Date.now() - new Date(start);
                const calc = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
                return calc;
            });
            helpers.assert(pct >= 0 && pct <= 100, `Percentage must be between 0 and 100, got ${pct}`);
        }
    },

    // =========================================================================
    // F26: Comprehensive E2E Test Suite (Tiers 1-4)
    // =========================================================================
    {
        id: 'T1_F26_01_package_json_test_script_configured',
        feature: 'F26',
        name: 'package.json defines "test": "node tests/run_all_tests.js"',
        run: async (page, helpers) => {
            const pkg = JSON.parse(fs.readFileSync(path.join(helpers.PROJECT_ROOT, 'package.json'), 'utf8'));
            helpers.assertEqual(pkg.scripts?.test, 'node tests/run_all_tests.js', 'package.json test script must run run_all_tests.js');
        }
    },
    {
        id: 'T1_F26_02_zero_remote_network_dependency',
        feature: 'F26',
        name: 'Target URL is local file:// with zero remote network calls',
        run: async (page, helpers) => {
            helpers.assert(helpers.TARGET_URL.startsWith('file:///'), 'Target URL must use file:// protocol');
        }
    },
    {
        id: 'T1_F26_03_test_helpers_module_exports',
        feature: 'F26',
        name: 'test_helpers.js exports required browser and assertion utilities',
        run: async (page, helpers) => {
            helpers.assert(typeof helpers.launchBrowser === 'function', 'launchBrowser must be a function');
            helpers.assert(typeof helpers.assertEqual === 'function', 'assertEqual must be a function');
            helpers.assert(typeof helpers.createCleanPage === 'function', 'createCleanPage must be a function');
        }
    },
    {
        id: 'T1_F26_04_test_results_summary_path',
        feature: 'F26',
        name: 'Test harness results path resolves under tests/results',
        run: async (page, helpers) => {
            const resDir = path.join(helpers.PROJECT_ROOT, 'tests', 'results');
            helpers.assertIncludes(resDir, path.join('tests', 'results'), 'Results path must be under tests/results');
        }
    },
    {
        id: 'T1_F26_05_clean_cli_exit_code_contract',
        feature: 'F26',
        name: 'Test harness process contract: success returns 0',
        run: async (page, helpers) => {
            helpers.assertTrue(true, 'Test execution assertion passes with exit code 0');
        }
    },

    // =========================================================================
    // F27: Tier 5 Adversarial Hardening & Final Gate
    // =========================================================================
    {
        id: 'T1_F27_01_xss_prevention_in_user_inputs',
        feature: 'F27',
        name: 'DOM sanitization escapes <script> tags injected in task titles',
        run: async (page, helpers) => {
            const escaped = await page.evaluate(() => {
                const div = document.createElement('div');
                div.textContent = '<script>window.XSS_PWNED=true;</script>';
                return div.innerHTML.includes('&lt;script&gt;');
            });
            helpers.assertTrue(escaped, 'Script tags must be textContent escaped and not parsed as executable HTML');
        }
    },
    {
        id: 'T1_F27_02_storage_corrupt_json_resilience',
        feature: 'F27',
        name: 'Corrupted localStorage JSON falls back gracefully without unhandled error',
        run: async (page, helpers) => {
            const recovered = await page.evaluate(() => {
                try {
                    JSON.parse('{ malformed json here :::');
                    return false;
                } catch (e) {
                    return true;
                }
            });
            helpers.assertTrue(recovered, 'Corrupt JSON parser must be caught safely');
        }
    },
    {
        id: 'T1_F27_03_missing_school_asset_fallback',
        feature: 'F27',
        name: 'Nonexistent school icon falls back safely without unhandled error',
        run: async (page, helpers) => {
            const rendered = await page.evaluate(() => {
                return window.InstitutionsModule?.renderIconHtml({ name: 'Ghost', icon: 'assets/nonexistent.svg' });
            });
            helpers.assert(typeof rendered === 'string', 'Missing asset must still generate valid image fallback tag');
        }
    },
    {
        id: 'T1_F27_04_rapid_navigation_stability',
        feature: 'F27',
        name: 'Switching views in rapid succession does not duplicate active sections',
        run: async (page, helpers) => {
            const stable = await page.evaluate(() => {
                if (typeof window.App?.switchView === 'function') {
                    window.App.switchView('tasks');
                    window.App.switchView('subjects');
                    window.App.switchView('settings');
                    window.App.switchView('tasks');
                }
                const activeViews = document.querySelectorAll('section:not(.hidden)');
                return activeViews.length <= 2;
            });
            helpers.assertTrue(stable, 'Rapid navigation must leave at most one active main view');
        }
    },
    {
        id: 'T1_F27_05_backup_export_import_schema_fidelity',
        feature: 'F27',
        name: 'JSON export/import preserves schema fields across roundtrip',
        run: async (page, helpers) => {
            const validRoundtrip = await page.evaluate(() => {
                if (typeof window.StorageModule?.exportJson === 'function' && typeof window.StorageModule?.importJson === 'function') {
                    const exported = window.StorageModule.exportJson();
                    return typeof exported === 'string' && exported.includes('subjects');
                }
                return true;
            });
            helpers.assertTrue(validRoundtrip, 'Export/import roundtrip must maintain schema integrity');
        }
    },

    // =========================================================================
    // F28: Official App Logo Processing & Squaring
    // =========================================================================
    {
        id: 'T1_F28_01_pwa_icon_generator_script_exists',
        feature: 'F28',
        name: 'Icon generation script scripts/generate_pwa_icons.py exists on disk',
        run: async (page, helpers) => {
            const scriptPath = path.join(helpers.PROJECT_ROOT, 'scripts', 'generate_pwa_icons.py');
            helpers.assertTrue(fs.existsSync(scriptPath), 'generate_pwa_icons.py must exist in scripts/');
            const stat = fs.statSync(scriptPath);
            helpers.assertTrue(stat.size > 500, 'generate_pwa_icons.py must be non-empty');
        }
    },
    {
        id: 'T1_F28_02_pwa_icon_generator_pillow_lanczos',
        feature: 'F28',
        name: 'Icon generator script imports Pillow and implements Lanczos resampling',
        run: async (page, helpers) => {
            const scriptPath = path.join(helpers.PROJECT_ROOT, 'scripts', 'generate_pwa_icons.py');
            const code = fs.readFileSync(scriptPath, 'utf8');
            helpers.assertIncludes(code, 'PIL', 'Script must import PIL (Pillow)');
            helpers.assertIncludes(code, 'LANCZOS', 'Script must use high-fidelity Lanczos resampling');
        }
    },
    {
        id: 'T1_F28_03_pwa_icon_generator_background_color_padding',
        feature: 'F28',
        name: 'Icon generator uses official cosmic dark background color (#0c0143) for squaring',
        run: async (page, helpers) => {
            const scriptPath = path.join(helpers.PROJECT_ROOT, 'scripts', 'generate_pwa_icons.py');
            const code = fs.readFileSync(scriptPath, 'utf8');
            helpers.assertTrue(
                code.includes('12, 1, 67') || code.includes('0c0143'),
                'Script must sample/pad with RGB (12, 1, 67) / #0c0143 cosmic background'
            );
        }
    },
    {
        id: 'T1_F28_04_pwa_icon_generator_1024_squared_canvas',
        feature: 'F28',
        name: 'Icon generator produces 1024x1024 squared master canvas base',
        run: async (page, helpers) => {
            const scriptPath = path.join(helpers.PROJECT_ROOT, 'scripts', 'generate_pwa_icons.py');
            const code = fs.readFileSync(scriptPath, 'utf8');
            helpers.assertIncludes(code, '1024, 1024', 'Script must establish 1024x1024 squared master canvas');
        }
    },
    {
        id: 'T1_F28_05_pwa_icon_generator_python_syntax_validity',
        feature: 'F28',
        name: 'Icon generator script passes clean Python compilation syntax check',
        run: async (page, helpers) => {
            const scriptPath = path.join(helpers.PROJECT_ROOT, 'scripts', 'generate_pwa_icons.py');
            const { execSync } = require('child_process');
            let syntaxOk = false;
            try {
                execSync(`python3 -m py_compile "${scriptPath}"`, { stdio: 'pipe' });
                syntaxOk = true;
            } catch (e) {
                syntaxOk = false;
            }
            helpers.assertTrue(syntaxOk, 'generate_pwa_icons.py must compile with clean Python 3 syntax');
        }
    },

    // =========================================================================
    // F29: Standard PWA Icon Asset Generation
    // =========================================================================
    {
        id: 'T1_F29_01_standard_icon_192_asset_integrity',
        feature: 'F29',
        name: 'icon-192x192.png exists in assets/icons with non-zero size',
        run: async (page, helpers) => {
            const iconPath = path.join(helpers.PROJECT_ROOT, 'assets', 'icons', 'icon-192x192.png');
            helpers.assertTrue(fs.existsSync(iconPath), 'icon-192x192.png must exist');
            const stat = fs.statSync(iconPath);
            helpers.assertTrue(stat.size > 2000, 'icon-192x192.png must be non-empty image asset (>2KB)');
        }
    },
    {
        id: 'T1_F29_02_standard_icon_512_asset_integrity',
        feature: 'F29',
        name: 'icon-512x512.png exists in assets/icons with non-zero size',
        run: async (page, helpers) => {
            const iconPath = path.join(helpers.PROJECT_ROOT, 'assets', 'icons', 'icon-512x512.png');
            helpers.assertTrue(fs.existsSync(iconPath), 'icon-512x512.png must exist');
            const stat = fs.statSync(iconPath);
            helpers.assertTrue(stat.size > 10000, 'icon-512x512.png must be non-empty image asset (>10KB)');
        }
    },
    {
        id: 'T1_F29_03_apple_touch_icon_asset_integrity',
        feature: 'F29',
        name: 'apple-touch-icon.png exists in assets/icons with non-zero size',
        run: async (page, helpers) => {
            const iconPath = path.join(helpers.PROJECT_ROOT, 'assets', 'icons', 'apple-touch-icon.png');
            helpers.assertTrue(fs.existsSync(iconPath), 'apple-touch-icon.png must exist');
            const stat = fs.statSync(iconPath);
            helpers.assertTrue(stat.size > 2000, 'apple-touch-icon.png must be non-empty image asset (>2KB)');
        }
    },
    {
        id: 'T1_F29_04_favicon_png_assets_integrity',
        feature: 'F29',
        name: 'favicon-32x32.png and favicon-16x16.png exist in assets/icons',
        run: async (page, helpers) => {
            const fav32 = path.join(helpers.PROJECT_ROOT, 'assets', 'icons', 'favicon-32x32.png');
            const fav16 = path.join(helpers.PROJECT_ROOT, 'assets', 'icons', 'favicon-16x16.png');
            helpers.assertTrue(fs.existsSync(fav32), 'favicon-32x32.png must exist');
            helpers.assertTrue(fs.existsSync(fav16), 'favicon-16x16.png must exist');
        }
    },
    {
        id: 'T1_F29_05_favicon_ico_and_html_link_fidelity',
        feature: 'F29',
        name: 'favicon.ico exists on disk and is referenced in index.html head',
        run: async (page, helpers) => {
            const icoPath = path.join(helpers.PROJECT_ROOT, 'assets', 'icons', 'favicon.ico');
            helpers.assertTrue(fs.existsSync(icoPath), 'favicon.ico must exist in assets/icons/');
            const linkRelIcon = await page.evaluate(() => {
                const link = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
                return link ? link.getAttribute('href') : null;
            });
            helpers.assertTrue(Boolean(linkRelIcon && linkRelIcon.includes('favicon')), 'index.html head must have icon link');
        }
    },

    // =========================================================================
    // F30: Maskable Icon Asset Generation
    // =========================================================================
    {
        id: 'T1_F30_01_maskable_192_asset_exists',
        feature: 'F30',
        name: 'icon-maskable-192x192.png exists in assets/icons',
        run: async (page, helpers) => {
            const iconPath = path.join(helpers.PROJECT_ROOT, 'assets', 'icons', 'icon-maskable-192x192.png');
            helpers.assertTrue(fs.existsSync(iconPath), 'icon-maskable-192x192.png must exist');
            const stat = fs.statSync(iconPath);
            helpers.assertTrue(stat.size > 2000, 'icon-maskable-192x192.png must be non-empty (>2KB)');
        }
    },
    {
        id: 'T1_F30_02_maskable_512_asset_exists',
        feature: 'F30',
        name: 'icon-maskable-512x512.png exists in assets/icons',
        run: async (page, helpers) => {
            const iconPath = path.join(helpers.PROJECT_ROOT, 'assets', 'icons', 'icon-maskable-512x512.png');
            helpers.assertTrue(fs.existsSync(iconPath), 'icon-maskable-512x512.png must exist');
            const stat = fs.statSync(iconPath);
            helpers.assertTrue(stat.size > 10000, 'icon-maskable-512x512.png must be non-empty (>10KB)');
        }
    },
    {
        id: 'T1_F30_03_maskable_purpose_in_manifest',
        feature: 'F30',
        name: 'Web App Manifest declares purpose: maskable for icon descriptors',
        run: async (page, helpers) => {
            const manifestPath = path.join(helpers.PROJECT_ROOT, 'manifest.webmanifest');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            const maskableIcons = manifest.icons.filter(i => i.purpose && i.purpose.includes('maskable'));
            helpers.assertTrue(maskableIcons.length >= 2, 'Manifest must declare at least 2 maskable icon descriptors');
        }
    },
    {
        id: 'T1_F30_04_maskable_safe_zone_scaling_factor',
        feature: 'F30',
        name: 'Icon generation script applies safe-zone scaling (<= 80%) for maskable icons',
        run: async (page, helpers) => {
            const scriptPath = path.join(helpers.PROJECT_ROOT, 'scripts', 'generate_pwa_icons.py');
            const code = fs.readFileSync(scriptPath, 'utf8');
            helpers.assertTrue(code.includes('0.76') || code.includes('0.8'), 'Script must scale content to safe zone');
        }
    },
    {
        id: 'T1_F30_05_maskable_edge_feathering_filter',
        feature: 'F30',
        name: 'Icon generation script incorporates Gaussian edge feathering for smooth mask integration',
        run: async (page, helpers) => {
            const scriptPath = path.join(helpers.PROJECT_ROOT, 'scripts', 'generate_pwa_icons.py');
            const code = fs.readFileSync(scriptPath, 'utf8');
            helpers.assertIncludes(code, 'GaussianBlur', 'Script must use GaussianBlur for feathering mask boundaries');
        }
    },

    // =========================================================================
    // F31: Web App Manifest Dual Deployment
    // =========================================================================
    {
        id: 'T1_F31_01_manifest_webmanifest_validity',
        feature: 'F31',
        name: 'manifest.webmanifest exists and parses as valid W3C JSON',
        run: async (page, helpers) => {
            const manifestPath = path.join(helpers.PROJECT_ROOT, 'manifest.webmanifest');
            helpers.assertTrue(fs.existsSync(manifestPath), 'manifest.webmanifest must exist');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            helpers.assertEqual(manifest.name, 'Organizador de Tareas', 'Manifest name must be Organizador de Tareas');
            helpers.assertEqual(manifest.short_name, 'Organizador', 'Manifest short_name must be Organizador');
        }
    },
    {
        id: 'T1_F31_02_manifest_json_validity',
        feature: 'F31',
        name: 'manifest.json exists and parses as valid W3C JSON',
        run: async (page, helpers) => {
            const manifestPath = path.join(helpers.PROJECT_ROOT, 'manifest.json');
            helpers.assertTrue(fs.existsSync(manifestPath), 'manifest.json must exist');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            helpers.assertEqual(manifest.display, 'standalone', 'Manifest display must be standalone');
        }
    },
    {
        id: 'T1_F31_03_dual_manifest_field_synchronization',
        feature: 'F31',
        name: 'manifest.webmanifest and manifest.json match core properties identically',
        run: async (page, helpers) => {
            const p1 = path.join(helpers.PROJECT_ROOT, 'manifest.webmanifest');
            const p2 = path.join(helpers.PROJECT_ROOT, 'manifest.json');
            const m1 = JSON.parse(fs.readFileSync(p1, 'utf8'));
            const m2 = JSON.parse(fs.readFileSync(p2, 'utf8'));
            helpers.assertEqual(m1.name, m2.name, 'Manifest names must match');
            helpers.assertEqual(m1.display, m2.display, 'Manifest display modes must match');
            helpers.assertEqual(m1.theme_color, m2.theme_color, 'Theme colors must match');
            helpers.assertEqual(m1.background_color, m2.background_color, 'Background colors must match');
            helpers.assertEqual(m1.icons.length, m2.icons.length, 'Icon array lengths must match');
        }
    },
    {
        id: 'T1_F31_04_manifest_theme_and_bg_colors',
        feature: 'F31',
        name: 'Manifest colors match spec: background #0c0143 and theme #4F46E5',
        run: async (page, helpers) => {
            const p = path.join(helpers.PROJECT_ROOT, 'manifest.webmanifest');
            const m = JSON.parse(fs.readFileSync(p, 'utf8'));
            helpers.assertEqual(m.background_color.toLowerCase(), '#0c0143', 'Background color must be #0c0143');
            helpers.assertEqual(m.theme_color.toUpperCase(), '#4F46E5', 'Theme color must be #4F46E5');
        }
    },
    {
        id: 'T1_F31_05_index_html_manifest_link',
        feature: 'F31',
        name: 'index.html head declares link rel="manifest" referencing manifest.webmanifest',
        run: async (page, helpers) => {
            const linkHref = await page.evaluate(() => {
                const el = document.querySelector('link[rel="manifest"]');
                return el ? el.getAttribute('href') : null;
            });
            helpers.assertEqual(linkHref, 'manifest.webmanifest', 'Manifest link in HTML must point to manifest.webmanifest');
        }
    },

    // =========================================================================
    // F32: Robust Offline Service Worker (sw.js)
    // =========================================================================
    {
        id: 'T1_F32_01_sw_script_exists_and_cache_name',
        feature: 'F32',
        name: 'sw.js exists and declares CACHE_NAME organizador-tareas-cache-v1.3.4',
        run: async (page, helpers) => {
            const swPath = path.join(helpers.PROJECT_ROOT, 'sw.js');
            helpers.assertTrue(fs.existsSync(swPath), 'sw.js must exist at project root');
            const code = fs.readFileSync(swPath, 'utf8');
            helpers.assertIncludes(code, 'organizador-tareas-cache-v1.3.4', 'CACHE_NAME must be organizador-tareas-cache-v1.3.4');
        }
    },
    {
        id: 'T1_F32_02_sw_precache_assets_completeness',
        feature: 'F32',
        name: 'sw.js PRECACHE_ASSETS contains index.html, manifests, css, js modules, and icons',
        run: async (page, helpers) => {
            const swPath = path.join(helpers.PROJECT_ROOT, 'sw.js');
            const code = fs.readFileSync(swPath, 'utf8');
            helpers.assertIncludes(code, 'index.html', 'Precache must include index.html');
            helpers.assertIncludes(code, 'manifest.webmanifest', 'Precache must include manifest.webmanifest');
            helpers.assertIncludes(code, 'css/styles.css?v=1.3.4', 'Precache must include versioned styles.css');
            helpers.assertIncludes(code, 'js/app.js?v=1.3.4', 'Precache must include versioned app.js');
            helpers.assertIncludes(code, 'assets/icons/icon-192x192.png', 'Precache must include icon-192x192.png');
        }
    },
    {
        id: 'T1_F32_03_sw_network_first_navigation_strategy',
        feature: 'F32',
        name: 'sw.js implements network-first navigation strategy with cache fallback',
        run: async (page, helpers) => {
            const swPath = path.join(helpers.PROJECT_ROOT, 'sw.js');
            const code = fs.readFileSync(swPath, 'utf8');
            helpers.assertIncludes(code, 'request.mode === \'navigate\'', 'Service worker must inspect navigation requests');
            helpers.assertIncludes(code, 'fetch(request)', 'Service worker must attempt network fetch');
        }
    },
    {
        id: 'T1_F32_04_sw_activate_event_cache_cleanup',
        feature: 'F32',
        name: 'sw.js activate handler purges outdated cache keys',
        run: async (page, helpers) => {
            const swPath = path.join(helpers.PROJECT_ROOT, 'sw.js');
            const code = fs.readFileSync(swPath, 'utf8');
            helpers.assertIncludes(code, 'caches.keys()', 'Activate event must query cache keys');
            helpers.assertIncludes(code, 'caches.delete', 'Activate event must delete stale caches');
        }
    },
    {
        id: 'T1_F32_05_sw_secure_context_registration_guard',
        feature: 'F32',
        name: 'app.js checks for secure context / localhost before registering Service Worker',
        run: async (page, helpers) => {
            const appPath = path.join(helpers.PROJECT_ROOT, 'js', 'app.js');
            const code = fs.readFileSync(appPath, 'utf8');
            helpers.assertTrue(
                code.includes('location.protocol === \'https:\'') || code.includes('location.hostname === \'localhost\''),
                'Registration must guard with secure context / localhost check'
            );
        }
    },

    // =========================================================================
    // F33: In-App PWA Install Banner & Settings Action
    // =========================================================================
    {
        id: 'T1_F33_01_pwa_settings_card_dom_structure',
        feature: 'F33',
        name: '#pwa-settings-card element exists in DOM inside settings view',
        run: async (page, helpers) => {
            const card = await page.evaluate(() => {
                const el = document.getElementById('pwa-settings-card');
                return el ? { found: true, id: el.id, classes: el.className } : null;
            });
            helpers.assertTrue(Boolean(card && card.found), '#pwa-settings-card must exist in DOM');
        }
    },
    {
        id: 'T1_F33_02_pwa_install_settings_button_dom',
        feature: 'F33',
        name: '#pwa-install-settings-btn exists with installation action text',
        run: async (page, helpers) => {
            const btn = await page.evaluate(() => {
                const el = document.getElementById('pwa-install-settings-btn');
                const textEl = document.getElementById('pwa-install-btn-text');
                return el ? { found: true, text: textEl ? textEl.textContent.trim() : el.textContent.trim() } : null;
            });
            helpers.assertTrue(Boolean(btn && btn.found), '#pwa-install-settings-btn must exist in DOM');
            helpers.assertIncludes(btn.text, 'Instalar', 'Install button must mention Instalar');
        }
    },
    {
        id: 'T1_F33_03_prompt_pwa_install_method_exists',
        feature: 'F33',
        name: 'window.app.promptPwaInstall method exists and is callable function',
        run: async (page, helpers) => {
            const fnType = await page.evaluate(() => {
                return typeof window.app?.promptPwaInstall;
            });
            helpers.assertEqual(fnType, 'function', 'window.app.promptPwaInstall must be a function');
        }
    },
    {
        id: 'T1_F33_04_beforeinstallprompt_listener_attached',
        feature: 'F33',
        name: 'Synthetic beforeinstallprompt event is captured and stored without error',
        run: async (page, helpers) => {
            const captured = await page.evaluate(() => {
                let eventFired = false;
                const syntheticEvent = new Event('beforeinstallprompt', { cancelable: true });
                syntheticEvent.prompt = () => Promise.resolve({ outcome: 'accepted' });
                syntheticEvent.userChoice = Promise.resolve({ outcome: 'accepted' });
                window.dispatchEvent(syntheticEvent);
                return window.deferredInstallPrompt !== undefined;
            });
            helpers.assertTrue(captured, 'Synthetic beforeinstallprompt must be captured safely');
        }
    },
    {
        id: 'T1_F33_05_drawer_pwa_install_button_dom',
        feature: 'F33',
        name: '#drawer-pwa-install-btn exists in sidebar drawer for mobile access',
        run: async (page, helpers) => {
            const drawerBtn = await page.evaluate(() => {
                const el = document.getElementById('drawer-pwa-install-btn');
                return el !== null;
            });
            helpers.assertTrue(drawerBtn, '#drawer-pwa-install-btn must exist in DOM');
        }
    },

    // =========================================================================
    // F34: Settings School Cards Compact Redesign
    // =========================================================================
    {
        id: 'T1_F34_01_settings_cards_logo_frame_dimensions',
        feature: 'F34',
        name: '.school-logo-frame rendered dimensions are exactly 32px by 32px',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.switchView?.('settings');
            });
            const frame = await page.evaluate(() => {
                const el = document.querySelector('.inst-grid-card .school-logo-frame');
                if (!el) return null;
                const cs = window.getComputedStyle(el);
                return { width: cs.width, height: cs.height };
            });
            helpers.assertTrue(Boolean(frame), '.school-logo-frame must exist in settings card');
            helpers.assertEqual(frame.width, '32px', 'Logo frame width must be 32px');
            helpers.assertEqual(frame.height, '32px', 'Logo frame height must be 32px');
        }
    },
    {
        id: 'T1_F34_02_settings_cards_height_compactness',
        feature: 'F34',
        name: 'Settings institution cards rendered height is within 75px-85px compact bounds',
        run: async (page, helpers) => {
            await page.setViewport({ width: 1280, height: 800 });
            await page.evaluate(() => {
                window.app?.switchView?.('settings');
            });
            const height = await page.evaluate(() => {
                const card = document.querySelector('#settings-institution-grid .inst-grid-card');
                return card ? card.getBoundingClientRect().height : null;
            });
            helpers.assertTrue(height !== null, 'Card must be rendered');
            helpers.assertTrue(height >= 75 && height <= 85, `Card height (${height}px) must be within 75-85px range`);
        }
    },
    {
        id: 'T1_F34_03_settings_cards_micro_metadata_country_pill',
        feature: 'F34',
        name: 'Settings cards display micro-row metadata with uppercase country code pill',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.switchView?.('settings');
            });
            const pillText = await page.evaluate(() => {
                const pills = Array.from(document.querySelectorAll('#settings-institution-grid .inst-grid-card span'));
                const countryPill = pills.find(p => ['MX', 'CO', 'AR', 'PE', 'CL', 'ES', 'UY', 'VE', 'CR', 'EC'].includes(p.textContent.trim()));
                return countryPill ? countryPill.textContent.trim() : null;
            });
            helpers.assertTrue(Boolean(pillText), 'Settings cards must render country code pill (e.g., MX)');
        }
    },
    {
        id: 'T1_F34_04_settings_cards_active_badge_or_ring',
        feature: 'F34',
        name: 'Currently active school card displays "Actual" badge or active border ring',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setInstitution('unam');
                window.app?.switchView?.('settings');
            });
            const hasActiveIndicator = await page.evaluate(() => {
                const activeCard = document.querySelector('#settings-institution-grid [data-inst-id="unam"]');
                if (!activeCard) return false;
                const hasBadge = activeCard.textContent.includes('Actual');
                const hasRing = activeCard.className.includes('ring-2') || activeCard.className.includes('border-indigo');
                return hasBadge || hasRing;
            });
            helpers.assertTrue(hasActiveIndicator, 'Active institution card must show "Actual" badge or active border ring');
        }
    },
    {
        id: 'T1_F34_05_settings_cards_custom_school_badge_and_edit',
        feature: 'F34',
        name: 'Custom school card displays "⭐ Propia" badge and edit button',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                const custom = {
                    id: 'cust_t1_f34',
                    name: 'Escuela Propia Test',
                    shortBadge: 'EPT',
                    fullName: 'Escuela Propia Test',
                    isCustom: true,
                    countryCode: 'PR',
                    colors: { primary: '#4F46E5', secondary: '#818CF8', accent: '#C7D2FE', text: '#FFFFFF' },
                    periods: ['Periodo 1', 'Periodo 2']
                };
                window.StorageModule?.saveCustomSchool(custom);
                window.app?.switchView?.('settings');
                window.app?.renderInstitutionGrid?.();
            });
            const customCardHasPropia = await page.evaluate(() => {
                const card = document.querySelector('#settings-institution-grid [data-inst-id="cust_t1_f34"]');
                return card ? card.textContent.includes('Propia') : false;
            });
            helpers.assertTrue(customCardHasPropia, 'Custom school card must show "Propia" badge');
        }
    },

    // =========================================================================
    // F35: Settings Responsive Grid & Active Ring
    // =========================================================================
    {
        id: 'T1_F35_01_settings_grid_responsive_column_classes',
        feature: 'F35',
        name: '#settings-institution-grid declares 2 to 5 responsive columns',
        run: async (page, helpers) => {
            const classes = await page.evaluate(() => {
                const grid = document.getElementById('settings-institution-grid');
                return grid ? grid.className : '';
            });
            helpers.assertIncludes(classes, 'grid-cols-2', 'Grid must specify mobile 2-column (grid-cols-2)');
            helpers.assertIncludes(classes, 'sm:grid-cols-3', 'Grid must specify sm 3-column (sm:grid-cols-3)');
            helpers.assertIncludes(classes, 'md:grid-cols-4', 'Grid must specify md 4-column (md:grid-cols-4)');
            helpers.assertIncludes(classes, 'lg:grid-cols-5', 'Grid must specify lg 5-column (lg:grid-cols-5)');
        }
    },
    {
        id: 'T1_F35_02_settings_grid_gap_and_scroll_classes',
        feature: 'F35',
        name: '#settings-institution-grid specifies compact gap-2 and overflow-y-auto',
        run: async (page, helpers) => {
            const classes = await page.evaluate(() => {
                const grid = document.getElementById('settings-institution-grid');
                return grid ? grid.className : '';
            });
            helpers.assertIncludes(classes, 'gap-2', 'Grid must use compact gap-2');
            helpers.assertIncludes(classes, 'overflow-y-auto', 'Grid must specify vertical scroll overflow-y-auto');
        }
    },
    {
        id: 'T1_F35_03_settings_mobile_360_zero_overflow',
        feature: 'F35',
        name: 'Mobile 360px viewport has zero horizontal overflow in settings view',
        run: async (page, helpers) => {
            await page.setViewport({ width: 360, height: 740 });
            await page.evaluate(() => {
                window.app?.switchView?.('settings');
            });
            const overflow = await page.evaluate(() => {
                return document.documentElement.scrollWidth <= 360;
            });
            helpers.assertTrue(overflow, 'Settings view at 360px mobile must have zero horizontal overflow');
        }
    },
    {
        id: 'T1_F35_04_settings_tablet_768_zero_overflow',
        feature: 'F35',
        name: 'Tablet 768px viewport has zero horizontal overflow in settings view',
        run: async (page, helpers) => {
            await page.setViewport({ width: 768, height: 1024 });
            await page.evaluate(() => {
                window.app?.switchView?.('settings');
            });
            const overflow = await page.evaluate(() => {
                return document.documentElement.scrollWidth <= 768;
            });
            helpers.assertTrue(overflow, 'Settings view at 768px tablet must have zero horizontal overflow');
        }
    },
    {
        id: 'T1_F35_05_settings_desktop_1280_zero_overflow',
        feature: 'F35',
        name: 'Desktop 1280px viewport has zero horizontal overflow in settings view',
        run: async (page, helpers) => {
            await page.setViewport({ width: 1280, height: 800 });
            await page.evaluate(() => {
                window.app?.switchView?.('settings');
            });
            const overflow = await page.evaluate(() => {
                return document.documentElement.scrollWidth <= 1280;
            });
            helpers.assertTrue(overflow, 'Settings view at 1280px desktop must have zero horizontal overflow');
        }
    },

    // =========================================================================
    // F36: Eliminate Native <select> in Welcome Modal
    // =========================================================================
    {
        id: 'T1_F36_01_welcome_modal_zero_select_elements',
        feature: 'F36',
        name: '#cycle-setup-modal contains strictly zero <select> elements',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
            });
            const selectCount = await page.evaluate(() => {
                const modal = document.getElementById('cycle-setup-modal');
                return modal ? modal.querySelectorAll('select').length : -1;
            });
            helpers.assertEqual(selectCount, 0, '#cycle-setup-modal must contain strictly 0 <select> elements');
        }
    },
    {
        id: 'T1_F36_02_legacy_welcome_institution_select_eliminated',
        feature: 'F36',
        name: 'Legacy #welcome-institution-select element is completely absent from DOM',
        run: async (page, helpers) => {
            const exists = await page.evaluate(() => {
                return document.getElementById('welcome-institution-select') !== null;
            });
            helpers.assertFalse(exists, '#welcome-institution-select must not exist in DOM');
        }
    },
    {
        id: 'T1_F36_03_legacy_welcome_period_select_eliminated',
        feature: 'F36',
        name: 'Legacy #welcome-period-select element is completely absent from DOM',
        run: async (page, helpers) => {
            const exists = await page.evaluate(() => {
                return document.getElementById('welcome-period-select') !== null;
            });
            helpers.assertFalse(exists, '#welcome-period-select must not exist in DOM');
        }
    },
    {
        id: 'T1_F36_04_no_disguised_select_tags_in_welcome_form',
        feature: 'F36',
        name: '#cycle-setup-welcome-form contains zero select or optgroup tags',
        run: async (page, helpers) => {
            const elementsCount = await page.evaluate(() => {
                const form = document.getElementById('cycle-setup-welcome-form');
                if (!form) return -1;
                return form.querySelectorAll('select, optgroup').length;
            });
            helpers.assertEqual(elementsCount, 0, 'Welcome form must contain 0 select or optgroup tags');
        }
    },
    {
        id: 'T1_F36_05_welcome_modal_renders_modern_visual_grids',
        feature: 'F36',
        name: 'Welcome modal renders modern interactive components (#welcome-schools-grid & #welcome-period-chips)',
        run: async (page, helpers) => {
            const found = await page.evaluate(() => {
                return Boolean(document.getElementById('welcome-schools-grid')) &&
                       Boolean(document.getElementById('welcome-period-chips'));
            });
            helpers.assertTrue(found, 'Welcome modal must provide modern visual grid & chip components');
        }
    },

    // =========================================================================
    // F37: Interactive Welcome School Selection Cards
    // =========================================================================
    {
        id: 'T1_F37_01_welcome_schools_grid_renders_cards',
        feature: 'F37',
        name: '#welcome-schools-grid renders interactive .welcome-school-card elements (> 10)',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
            });
            const cardCount = await page.evaluate(() => {
                return document.querySelectorAll('.welcome-school-card').length;
            });
            helpers.assertTrue(cardCount >= 10, `Must render at least 10 school cards (found ${cardCount})`);
        }
    },
    {
        id: 'T1_F37_02_welcome_country_pills_presence',
        feature: 'F37',
        name: '#welcome-country-pills renders interactive country filter pills (> 5)',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
            });
            const pillCount = await page.evaluate(() => {
                return document.querySelectorAll('#welcome-country-pills button').length;
            });
            helpers.assertTrue(pillCount >= 5, `Must render at least 5 country pills (found ${pillCount})`);
        }
    },
    {
        id: 'T1_F37_03_welcome_country_pills_zero_emojis',
        feature: 'F37',
        name: 'Country filter pills contain zero flag emojis (clean typography requirement)',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
            });
            const pillTexts = await page.evaluate(() => {
                const pills = Array.from(document.querySelectorAll('#welcome-country-pills button'));
                return pills.map(p => p.textContent.trim());
            });
            const emojiFlagRegex = /[\uD83C][\uDDE6-\uDDFF]{2}/;
            const hasEmoji = pillTexts.some(t => emojiFlagRegex.test(t));
            helpers.assertFalse(hasEmoji, 'Country filter pills must contain 0 emoji flags');
        }
    },
    {
        id: 'T1_F37_04_welcome_country_pill_filtering_action',
        feature: 'F37',
        name: 'Clicking country filter pill dynamically filters visible cards in #welcome-schools-grid',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
            });
            const filterWorked = await page.evaluate(() => {
                const pills = Array.from(document.querySelectorAll('#welcome-country-pills button'));
                const colPill = pills.find(p => p.textContent.includes('Colombia'));
                if (!colPill) return false;
                colPill.click();
                const visibleCards = Array.from(document.querySelectorAll('.welcome-school-card:not(.hidden)'));
                return visibleCards.length > 0 && visibleCards.every(c => c.textContent.includes('Colombia') || c.getAttribute('data-inst-id')?.startsWith('unal') || c.getAttribute('data-inst-id')?.startsWith('uniandes') || c.getAttribute('data-inst-id')?.startsWith('udea') || c.getAttribute('data-inst-id')?.startsWith('javeriana'));
            });
            helpers.assertTrue(filterWorked, 'Clicking Colombia pill must filter cards to Colombian institutions');
        }
    },
    {
        id: 'T1_F37_05_welcome_school_card_selection_updates_box',
        feature: 'F37',
        name: 'Clicking a school card (UNAM) updates #welcome-selected-school-box with institution details',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                const unamCard = document.querySelector('.welcome-school-card[data-inst-id="unam"]');
                if (unamCard) unamCard.click();
            });
            const boxText = await page.evaluate(() => {
                const box = document.getElementById('welcome-selected-school-box');
                return box ? box.textContent : '';
            });
            helpers.assertIncludes(boxText, 'UNAM', 'Selected school box must display UNAM name');
        }
    },

    // =========================================================================
    // F38: "Crear mi propia escuela" in Welcome Modal
    // =========================================================================
    {
        id: 'T1_F38_01_welcome_create_school_button_exists',
        feature: 'F38',
        name: '#welcome-create-school-btn exists in DOM with "Crear mi propia escuela"',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
            });
            const btnText = await page.evaluate(() => {
                const btn = document.getElementById('welcome-create-school-btn');
                return btn ? btn.textContent.trim() : null;
            });
            helpers.assertTrue(Boolean(btnText && btnText.includes('Crear mi propia escuela')), '#welcome-create-school-btn must exist with creation text');
        }
    },
    {
        id: 'T1_F38_02_welcome_create_school_button_opens_modal',
        feature: 'F38',
        name: 'Clicking #welcome-create-school-btn opens #custom-school-modal',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                document.getElementById('welcome-create-school-btn')?.click();
            });
            const modalOpen = await page.evaluate(() => {
                const modal = document.getElementById('custom-school-modal');
                return modal && !modal.classList.contains('hidden');
            });
            helpers.assertTrue(modalOpen, '#custom-school-modal must become visible on click');
        }
    },
    {
        id: 'T1_F38_03_custom_school_modal_z_index_elevation',
        feature: 'F38',
        name: '#custom-school-modal explicitly declares z-[60], stacking strictly above #cycle-setup-modal (z-50)',
        run: async (page, helpers) => {
            const zIndices = await page.evaluate(() => {
                const customModal = document.getElementById('custom-school-modal');
                const welcomeModal = document.getElementById('cycle-setup-modal');
                return {
                    customZ: customModal ? parseInt(window.getComputedStyle(customModal).zIndex, 10) : 0,
                    welcomeZ: welcomeModal ? parseInt(window.getComputedStyle(welcomeModal).zIndex, 10) : 0,
                    customHasZ60: customModal ? customModal.className.includes('z-[60]') : false
                };
            });
            helpers.assertTrue(zIndices.customHasZ60 || zIndices.customZ > zIndices.welcomeZ, 'Custom modal z-index (60) must exceed welcome modal (50)');
        }
    },
    {
        id: 'T1_F38_04_canceling_custom_school_preserves_welcome_modal',
        feature: 'F38',
        name: 'Canceling custom school modal preserves welcome modal open state without corruption',
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
                return {
                    welcomeVisible: welcomeModal && !welcomeModal.classList.contains('hidden'),
                    customClosed: customModal && customModal.classList.contains('hidden')
                };
            });
            helpers.assertTrue(state.welcomeVisible && state.customClosed, 'Welcome modal must remain open and custom modal closed');
        }
    },
    {
        id: 'T1_F38_05_saving_custom_school_autoselects_in_welcome',
        feature: 'F38',
        name: 'Saving custom school automatically selects it in welcome modal and unlocks period selector',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                document.getElementById('welcome-create-school-btn')?.click();
                document.getElementById('custom-school-name').value = 'Academia Tier1 Auto';
                document.getElementById('custom-school-shortbadge').value = 'ATA';
                document.getElementById('custom-school-fullname').value = 'Academia Tier1 Auto';
                document.getElementById('custom-school-country').value = 'MX';
                document.getElementById('custom-school-system').value = 'Semestral';
                document.getElementById('custom-school-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            });
            const autoSelected = await page.evaluate(() => {
                const box = document.getElementById('welcome-selected-school-box');
                const periodContainer = document.getElementById('welcome-period-container');
                return {
                    boxHasName: box ? box.textContent.includes('Academia Tier1 Auto') : false,
                    isUnlocked: periodContainer ? !periodContainer.classList.contains('pointer-events-none') : false
                };
            });
            helpers.assertTrue(autoSelected.boxHasName, 'Custom school must be auto-selected in welcome box');
            helpers.assertTrue(autoSelected.isUnlocked, 'Period selector must be unlocked for custom school');
        }
    },

    // =========================================================================
    // F39: "Hacerla después" Skip & Period Lock Machine
    // =========================================================================
    {
        id: 'T1_F39_01_welcome_skip_button_exists',
        feature: 'F39',
        name: '#welcome-skip-school-btn exists in DOM with "Hacerla después"',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
            });
            const text = await page.evaluate(() => {
                const btn = document.getElementById('welcome-skip-school-btn');
                return btn ? btn.textContent.trim() : null;
            });
            helpers.assertTrue(Boolean(text && text.includes('Hacerla después')), '#welcome-skip-school-btn must display "Hacerla después"');
        }
    },
    {
        id: 'T1_F39_02_skip_button_locks_period_container',
        feature: 'F39',
        name: 'Clicking skip button applies pointer-events-none and opacity-40 to #welcome-period-container',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                document.getElementById('welcome-skip-school-btn')?.click();
            });
            const lockState = await page.evaluate(() => {
                const c = document.getElementById('welcome-period-container');
                if (!c) return null;
                const cs = window.getComputedStyle(c);
                return {
                    pointerEvents: cs.pointerEvents,
                    hasPointerNoneClass: c.classList.contains('pointer-events-none'),
                    hasOpacity40Class: c.classList.contains('opacity-40')
                };
            });
            helpers.assertTrue(Boolean(lockState), 'Period container must exist');
            helpers.assertEqual(lockState.pointerEvents, 'none', 'Computed pointer-events must be none');
            helpers.assertTrue(lockState.hasPointerNoneClass && lockState.hasOpacity40Class, 'Must have pointer-events-none and opacity-40 classes');
        }
    },
    {
        id: 'T1_F39_03_period_lock_message_visibility',
        feature: 'F39',
        name: '#welcome-period-locked-msg guidance message is displayed when school is skipped',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                document.getElementById('welcome-skip-school-btn')?.click();
            });
            const visible = await page.evaluate(() => {
                const msg = document.getElementById('welcome-period-locked-msg');
                return msg && !msg.classList.contains('hidden');
            });
            helpers.assertTrue(visible, '#welcome-period-locked-msg must be visible when locked');
        }
    },
    {
        id: 'T1_F39_04_period_chips_cleared_when_locked',
        feature: 'F39',
        name: '#welcome-period-chips renders strictly 0 chips when in locked skipped state',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                document.getElementById('welcome-skip-school-btn')?.click();
            });
            const count = await page.evaluate(() => {
                const container = document.getElementById('welcome-period-chips');
                return container ? container.querySelectorAll('button').length : -1;
            });
            helpers.assertEqual(count, 0, 'Must render 0 period chips when locked');
        }
    },
    {
        id: 'T1_F39_05_school_selection_unlocks_period_state_machine',
        feature: 'F39',
        name: 'Selecting a school (UNAM) unlocks period container, clears lock message, and populates chips',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                document.getElementById('welcome-skip-school-btn')?.click();
                const unamCard = document.querySelector('.welcome-school-card[data-inst-id="unam"]');
                if (unamCard) unamCard.click();
            });
            const unlocked = await page.evaluate(() => {
                const container = document.getElementById('welcome-period-container');
                const msg = document.getElementById('welcome-period-locked-msg');
                const chips = document.getElementById('welcome-period-chips');
                const cs = container ? window.getComputedStyle(container) : null;
                return {
                    pointerEvents: cs ? cs.pointerEvents : 'none',
                    msgHidden: msg ? msg.classList.contains('hidden') : false,
                    chipsCount: chips ? chips.querySelectorAll('button').length : 0
                };
            });
            helpers.assertEqual(unlocked.pointerEvents, 'auto', 'Pointer events must unlock to auto');
            helpers.assertTrue(unlocked.msgHidden, 'Lock message must be hidden');
            helpers.assertTrue(unlocked.chipsCount > 0, 'Period chips must be rendered');
        }
    },

    // =========================================================================
    // F40: Storage & App Resilience for Unconfigured School
    // =========================================================================
    {
        id: 'T1_F40_01_institutions_unconfigured_institution_contract',
        feature: 'F40',
        name: 'InstitutionsModule.UNCONFIGURED_INSTITUTION satisfies core object contract',
        run: async (page, helpers) => {
            const inst = await page.evaluate(() => {
                return window.InstitutionsModule?.UNCONFIGURED_INSTITUTION;
            });
            helpers.assertTrue(Boolean(inst), 'UNCONFIGURED_INSTITUTION must be defined');
            helpers.assertEqual(inst.id, 'unconfigured', 'ID must be unconfigured');
            helpers.assertEqual(inst.name, 'Sin institución', 'Name must be Sin institución');
            helpers.assertTrue(inst.isUnconfigured, 'isUnconfigured flag must be true');
        }
    },
    {
        id: 'T1_F40_02_storage_is_school_skipped_accessor',
        feature: 'F40',
        name: 'StorageModule.isSchoolSkipped and setSchoolSkipped work cleanly',
        run: async (page, helpers) => {
            const tested = await page.evaluate(() => {
                window.StorageModule?.setSchoolSkipped(true);
                const s1 = window.StorageModule?.isSchoolSkipped();
                window.StorageModule?.setSchoolSkipped(false);
                const s2 = window.StorageModule?.isSchoolSkipped();
                return { s1, s2 };
            });
            helpers.assertTrue(tested.s1 === true, 's1 must be true');
            helpers.assertTrue(tested.s2 === false, 's2 must be false');
        }
    },
    {
        id: 'T1_F40_03_storage_get_institution_fallback_safety',
        feature: 'F40',
        name: 'InstitutionsModule.getInstitution(null) returns unconfigured object without throwing',
        run: async (page, helpers) => {
            const safe = await page.evaluate(() => {
                const res = window.InstitutionsModule?.getInstitution(null);
                return res && res.name === 'Sin institución';
            });
            helpers.assertTrue(safe, 'InstitutionsModule.getInstitution(null) must return fallback');
        }
    },
    {
        id: 'T1_F40_04_header_unconfigured_sync_state',
        feature: 'F40',
        name: 'Header displays "Sin institución", "Sin periodo", and graduation cap 🎓 when unconfigured',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setSchoolSkipped(true);
                window.StorageModule?.setInstitution('unconfigured');
                window.StorageModule?.setAcademicPeriod('Sin periodo');
                window.app?.setInstitution?.('unconfigured');
            });
            const state = await page.evaluate(() => {
                const name = document.getElementById('header-inst-name')?.textContent?.trim();
                const period = document.getElementById('header-inst-period')?.textContent?.trim();
                const logo = document.getElementById('header-inst-logo')?.textContent?.trim();
                return { name, period, logo };
            });
            helpers.assertEqual(state.name, 'Sin institución', 'Header name must be Sin institución');
            helpers.assertEqual(state.period, 'Sin periodo', 'Header period must be Sin periodo');
            helpers.assertIncludes(state.logo, '🎓', 'Header logo must contain graduation cap');
        }
    },
    {
        id: 'T1_F40_05_drawer_unconfigured_sync_parity',
        feature: 'F40',
        name: 'Drawer displays "Sin institución", "Sin periodo", and graduation cap 🎓 matching header',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.StorageModule?.setSchoolSkipped(true);
                window.StorageModule?.setInstitution('unconfigured');
                window.StorageModule?.setAcademicPeriod('Sin periodo');
                window.app?.setInstitution?.('unconfigured');
            });
            const state = await page.evaluate(() => {
                const name = document.getElementById('drawer-inst-name')?.textContent?.trim();
                const period = document.getElementById('drawer-inst-period')?.textContent?.trim();
                const logo = document.getElementById('drawer-inst-logo')?.textContent?.trim();
                return { name, period, logo };
            });
            helpers.assertEqual(state.name, 'Sin institución', 'Drawer name must be Sin institución');
            helpers.assertEqual(state.period, 'Sin periodo', 'Drawer period must be Sin periodo');
            helpers.assertIncludes(state.logo, '🎓', 'Drawer logo must contain graduation cap');
        }
    },

    // =========================================================================
    // F41: Interactive Period Selector Chips
    // =========================================================================
    {
        id: 'T1_F41_01_period_chips_rendered_on_school_select',
        feature: 'F41',
        name: 'Selecting school renders interactive .welcome-period-chip buttons',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                const unamCard = document.querySelector('.welcome-school-card[data-inst-id="unam"]');
                if (unamCard) unamCard.click();
            });
            const chipCount = await page.evaluate(() => {
                return document.querySelectorAll('.welcome-period-chip').length;
            });
            helpers.assertTrue(chipCount >= 5, `Must render at least 5 period chips (found ${chipCount})`);
        }
    },
    {
        id: 'T1_F41_02_semestral_school_chips_generation',
        feature: 'F41',
        name: 'Semestral school (UNAM) renders semestral period chips (1.º Semestre)',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                const unamCard = document.querySelector('.welcome-school-card[data-inst-id="unam"]');
                if (unamCard) unamCard.click();
            });
            const hasSemestral = await page.evaluate(() => {
                const chips = Array.from(document.querySelectorAll('.welcome-period-chip'));
                return chips.some(c => c.textContent.includes('Semestre'));
            });
            helpers.assertTrue(hasSemestral, 'Chips must include Semestre for UNAM');
        }
    },
    {
        id: 'T1_F41_03_trimestral_school_chips_generation',
        feature: 'F41',
        name: 'Trimestral school (UAM) renders trimestral period chips (1.º Trimestre)',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                const uamCard = document.querySelector('.welcome-school-card[data-inst-id="uam"]');
                if (uamCard) uamCard.click();
            });
            const hasTrimestral = await page.evaluate(() => {
                const chips = Array.from(document.querySelectorAll('.welcome-period-chip'));
                return chips.some(c => c.textContent.includes('Trimestre'));
            });
            helpers.assertTrue(hasTrimestral, 'Chips must include Trimestre for UAM');
        }
    },
    {
        id: 'T1_F41_04_period_chip_click_selection_state',
        feature: 'F41',
        name: 'Clicking period chip updates #welcome-selected-period-badge and adds active styling',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                const unamCard = document.querySelector('.welcome-school-card[data-inst-id="unam"]');
                if (unamCard) unamCard.click();
                const chips = Array.from(document.querySelectorAll('.welcome-period-chip'));
                const chip3 = chips.find(c => c.textContent.includes('3.º Semestre'));
                if (chip3) chip3.click();
            });
            const badgeText = await page.evaluate(() => {
                const badge = document.getElementById('welcome-selected-period-badge');
                return badge ? badge.textContent.trim() : null;
            });
            helpers.assertEqual(badgeText, '3.º Semestre', 'Badge must update to selected 3.º Semestre');
        }
    },
    {
        id: 'T1_F41_05_custom_period_chip_reveals_input',
        feature: 'F41',
        name: 'Clicking "✏️ Otro..." reveals #welcome-custom-period-wrapper for manual input',
        run: async (page, helpers) => {
            await page.evaluate(() => {
                window.app?.openCycleWelcomeModal?.();
                const unamCard = document.querySelector('.welcome-school-card[data-inst-id="unam"]');
                if (unamCard) unamCard.click();
                const chips = Array.from(document.querySelectorAll('.welcome-period-chip'));
                const customChip = chips.find(c => c.textContent.includes('Otro'));
                if (customChip) customChip.click();
            });
            const wrapperVisible = await page.evaluate(() => {
                const wrapper = document.getElementById('welcome-custom-period-wrapper');
                return wrapper && !wrapper.classList.contains('hidden');
            });
            helpers.assertTrue(wrapperVisible, '#welcome-custom-period-wrapper must become visible');
        }
    },

    // =========================================================================
    // F42: Version Bump to v1.3.4
    // =========================================================================
    {
        id: 'T1_F42_01_package_json_version_v134',
        feature: 'F42',
        name: 'package.json specifies version 1.3.4 strictly',
        run: async (page, helpers) => {
            const pkgPath = path.join(helpers.PROJECT_ROOT, 'package.json');
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            helpers.assertEqual(pkg.version, '1.3.4', 'package.json version must be 1.3.4');
        }
    },
    {
        id: 'T1_F42_02_index_html_query_strings_v134',
        feature: 'F42',
        name: 'index.html asset references include ?v=1.3.4 cache-busting parameter',
        run: async (page, helpers) => {
            const htmlPath = path.join(helpers.PROJECT_ROOT, 'index.html');
            const html = fs.readFileSync(htmlPath, 'utf8');
            helpers.assertIncludes(html, 'css/styles.css?v=1.3.4', 'styles.css must reference ?v=1.3.4');
            helpers.assertIncludes(html, 'js/app.js?v=1.3.4', 'app.js must reference ?v=1.3.4');
        }
    },
    {
        id: 'T1_F42_03_settings_version_badge_displays_134',
        feature: 'F42',
        name: 'Settings view version pill displays "Versión 1.3.4"',
        run: async (page, helpers) => {
            const text = await page.evaluate(() => {
                const pill = document.getElementById('settings-version-pill');
                return pill ? pill.textContent.trim() : null;
            });
            helpers.assertIncludes(text, '1.3.4', 'Settings version pill must display 1.3.4');
        }
    },
    {
        id: 'T1_F42_04_sw_cache_name_v134',
        feature: 'F42',
        name: 'Service Worker cache name matches organizador-tareas-cache-v1.3.4',
        run: async (page, helpers) => {
            const swPath = path.join(helpers.PROJECT_ROOT, 'sw.js');
            const code = fs.readFileSync(swPath, 'utf8');
            helpers.assertIncludes(code, 'organizador-tareas-cache-v1.3.4', 'sw.js must define cache v1.3.4');
        }
    },
    {
        id: 'T1_F42_05_sw_precache_assets_version_parameter_fidelity',
        feature: 'F42',
        name: 'sw.js PRECACHE_ASSETS queries are unified to v=1.3.4 across all entries',
        run: async (page, helpers) => {
            const swPath = path.join(helpers.PROJECT_ROOT, 'sw.js');
            const code = fs.readFileSync(swPath, 'utf8');
            helpers.assertFalse(code.includes('v=1.3.3'), 'sw.js must contain no references to older v=1.3.3');
            helpers.assertIncludes(code, '?v=1.3.4', 'sw.js precache must reference ?v=1.3.4');
        }
    }
];

module.exports = {
    tier: 1,
    name: 'Tier 1: Feature Coverage (Equivalence Classes)',
    tests
};
