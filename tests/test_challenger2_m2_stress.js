/**
 * tests/test_challenger2_m2_stress.js
 * Adversarial Stress & Empirical Challenger Suite for Milestone 2
 * Focus:
 *  1. Settings font switcher grid (#settings-font-buttons-grid) & dynamic DOM injection
 *  2. Rapid switches (75+ switches) across standard & secret fonts with strict DOM/state assertions
 *  3. Persistence across page reload & LocalStorage corruption / simulation
 *  4. Cross-feature interactions with all special themes (Apollo, Eduardo Gold, Matrix, etc.)
 */

const {
    launchBrowser,
    createCleanPage,
    assert,
    assertEqual,
    assertTrue,
    assertFalse,
    assertIncludes,
    hasClass
} = require('./test_helpers');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const KEYS = {
    FONT_FAMILY: 'org_escolar_font',
    VAULT_UNLOCKED: 'org_escolar_vault_unlocked_codes_v2',
    ACTIVE_SPECIAL_THEME: 'org_escolar_active_special_theme_v1',
    APOLLO_ROCKETS_ENABLED: 'org_escolar_apollo_rockets_v1',
    INITIALIZED: 'org_escolar_initialized_v3'
};

const STANDARD_FONTS = ['calibri', 'times', 'montserrat', 'lora', 'poppins'];
const SECRET_FONTS = [
    { code: 'READABLE', key: 'readable', name: 'Lexend (Accesible)' },
    { code: 'FIRACODE', key: 'firacode', name: 'Fira Code (Hacker)' },
    { code: 'PLAYFAIR', key: 'playfair', name: 'Playfair Display (Imperial)' },
    { code: 'HANDNOTE', key: 'caveat', name: 'Caveat (Cuaderno)' },
    { code: 'ORBITRON', key: 'orbitron', name: 'Orbitron (Cyber HUD)' }
];
const ALL_10_FONTS = [...STANDARD_FONTS, ...SECRET_FONTS.map(f => f.key)];

const SPECIAL_THEMES = [
    { code: 'APOLLO11', themeId: 'apollo', themeClass: 'theme-apollo' },
    { code: 'EDUARDO', themeId: 'eduardo-gold', themeClass: 'theme-eduardo-gold' },
    { code: 'PINGUINO', themeId: 'penguin', themeClass: 'theme-penguin' },
    { code: 'RETROWAVE', themeId: 'synthwave', themeClass: 'theme-synthwave' },
    { code: 'MATRIX99', themeId: 'matrix', themeClass: 'theme-matrix' },
    { code: 'SAKURA24', themeId: 'sakura', themeClass: 'theme-sakura' },
    { code: 'COFFEE10', themeId: 'coffee', themeClass: 'theme-coffee' },
    { code: 'ARCADE80', themeId: 'arcade', themeClass: 'theme-arcade' },
    { code: 'HYPERFOC', themeId: 'hyperfocus', themeClass: 'theme-hyperfocus' },
    { code: 'STARLIGH', themeId: 'starlight', themeClass: 'theme-starlight' },
    { code: 'GATITOS_', themeId: 'gray', themeClass: 'theme-gray' }
];

async function runChallengerStressSuite() {
    console.log('========================================================================');
    console.log('⚡ CHALLENGER 2: EMPIRICAL ADVERSARIAL STRESS HARNESS (M2 TYPOGRAPHY)');
    console.log('========================================================================\n');

    let browser;
    let passed = 0;
    let failed = 0;
    const failureDetails = [];

    async function runTest(testName, testFn) {
        process.stdout.write(`  ▶ Running: ${testName} ... `);
        try {
            await testFn();
            console.log('\x1b[32mPASS\x1b[0m');
            passed++;
        } catch (err) {
            console.log('\x1b[31mFAIL\x1b[0m');
            console.error(`    ❌ ${err.message}`);
            failureDetails.push({ testName, error: err.message, stack: err.stack });
            failed++;
        }
    }

    try {
        browser = await launchBrowser();
        const page = await createCleanPage(browser);

        // Capture any unexpected browser errors
        const consoleErrors = [];
        page.on('pageerror', err => consoleErrors.push(err.message));
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        // -----------------------------------------------------------------
        // SECTION 1: SETTINGS FONT SWITCHER GRID & DYNAMIC INJECTION
        // -----------------------------------------------------------------
        console.log('--- [Section 1] Settings Font Switcher Grid & Dynamic Secret Buttons ---');

        await runTest('1.1: Standard 5 buttons initial state (0 secret buttons unlocked)', async () => {
            await page.evaluate(() => window.app.switchView('settings'));
            const initialButtons = await page.evaluate(() => {
                const grid = document.getElementById('settings-font-buttons-grid');
                if (!grid) return [];
                return Array.from(grid.querySelectorAll('button')).map(b => ({
                    font: b.getAttribute('data-font-btn'),
                    isVault: b.getAttribute('data-vault-font')
                }));
            });

            assertEqual(initialButtons.length, 5, 'Initially exactly 5 standard font buttons must exist');
            const buttonKeys = initialButtons.map(b => b.font);
            for (const std of STANDARD_FONTS) {
                assertIncludes(buttonKeys, std, `Standard font ${std} button must exist in settings`);
            }
            // Ensure no secret buttons exist yet
            for (const sec of SECRET_FONTS) {
                assertFalse(buttonKeys.includes(sec.key), `Secret font ${sec.key} must NOT be visible before unlocking`);
            }
        });

        await runTest('1.2: Progressive Unlocking of 5 Secret Fonts updates Settings Grid', async () => {
            for (let i = 0; i < SECRET_FONTS.length; i++) {
                const sec = SECRET_FONTS[i];
                // Unlock code in storage and trigger sync
                await page.evaluate((codeId) => {
                    window.StorageModule.unlockCode(codeId);
                    window.app.syncSettingsFontButtons();
                }, sec.code);

                const currentButtons = await page.evaluate(() => {
                    const grid = document.getElementById('settings-font-buttons-grid');
                    return Array.from(grid.querySelectorAll('button')).map(b => ({
                        font: b.getAttribute('data-font-btn'),
                        isVault: b.getAttribute('data-vault-font') === 'true',
                        badge: b.innerText.includes('✨ Secreto'),
                        text: b.innerText
                    }));
                });

                assertEqual(currentButtons.length, 5 + i + 1, `After unlocking ${sec.code}, total buttons should be ${5 + i + 1}`);
                const addedBtn = currentButtons.find(b => b.font === sec.key);
                assertTrue(!!addedBtn, `Button for ${sec.key} must be present in settings grid`);
                assertTrue(addedBtn.isVault, `Button for ${sec.key} must have data-vault-font="true"`);
                assertTrue(addedBtn.badge, `Button for ${sec.key} must contain '✨ Secreto' badge`);
            }
        });

        await runTest('1.3: Idempotency of syncSettingsFontButtons (consecutive calls cause no duplicates)', async () => {
            const beforeCount = await page.evaluate(() => {
                return document.querySelectorAll('#settings-font-buttons-grid [data-font-btn]').length;
            });
            assertEqual(beforeCount, 10, 'Expected 10 total buttons before duplicate test');

            // Call 25 times consecutively
            await page.evaluate(() => {
                for (let k = 0; k < 25; k++) {
                    window.app.syncSettingsFontButtons();
                }
            });

            const afterCount = await page.evaluate(() => {
                return document.querySelectorAll('#settings-font-buttons-grid [data-font-btn]').length;
            });
            assertEqual(afterCount, 10, 'consecutive syncSettingsFontButtons calls must remain idempotent without duplicates');
        });

        await runTest('1.4: Button cleanup on code relock / reset', async () => {
            // Relock all codes using official key
            await page.evaluate((vaultKey) => {
                localStorage.setItem(vaultKey, JSON.stringify([]));
                window.app.syncSettingsFontButtons();
            }, KEYS.VAULT_UNLOCKED);

            const buttonsAfterReset = await page.evaluate(() => {
                const grid = document.getElementById('settings-font-buttons-grid');
                return Array.from(grid.querySelectorAll('button')).map(b => b.getAttribute('data-font-btn'));
            });
            assertEqual(buttonsAfterReset.length, 5, 'When codes are locked, settings grid must prune back to 5 standard buttons');
            for (const sec of SECRET_FONTS) {
                assertFalse(buttonsAfterReset.includes(sec.key), `Pruned grid must not contain ${sec.key}`);
            }

            // Re-unlock all 5 for remaining sections
            await page.evaluate((vaultKey) => {
                const allCodes = ['READABLE', 'FIRACODE', 'PLAYFAIR', 'HANDNOTE', 'ORBITRON', 'APOLLO11', 'EDUARDO', 'PINGUINO', 'RETROWAVE', 'MATRIX99', 'SAKURA24', 'COFFEE10', 'ARCADE80', 'HYPERFOC', 'STARLIGH', 'GATITOS_'];
                localStorage.setItem(vaultKey, JSON.stringify(allCodes));
                window.app.syncSettingsFontButtons();
            }, KEYS.VAULT_UNLOCKED);
        });

        // -----------------------------------------------------------------
        // SECTION 2: DIRECT CLICK INTERACTION IN SETTINGS UI
        // -----------------------------------------------------------------
        console.log('\n--- [Section 2] Direct Click Interaction & Pill/Preview Synchronization ---');

        await runTest('2.1: Clicking standard buttons updates DOM, active ring, pill, and preview description', async () => {
            for (const fontKey of STANDARD_FONTS) {
                await page.evaluate((key) => {
                    const btn = document.querySelector(`#settings-font-buttons-grid [data-font-btn="${key}"]`);
                    if (btn) btn.click();
                }, fontKey);
                await sleep(50);

                const state = await page.evaluate(() => {
                    const rootFont = document.documentElement.getAttribute('data-font');
                    const bodyFont = document.body.getAttribute('data-font');
                    const activePill = document.getElementById('settings-font-pill')?.textContent.trim();
                    const activeDesc = document.getElementById('settings-font-preview-desc')?.textContent.trim();
                    const activeBtns = Array.from(document.querySelectorAll('#settings-font-buttons-grid button')).filter(b => b.className.includes('ring-2 ring-indigo-500'));
                    return {
                        rootFont,
                        bodyFont,
                        activePill,
                        activeDesc,
                        activeBtnCount: activeBtns.length,
                        activeBtnFont: activeBtns[0]?.getAttribute('data-font-btn')
                    };
                });

                assertEqual(state.rootFont, fontKey, `HTML data-font should be ${fontKey}`);
                assertEqual(state.bodyFont, fontKey, `Body data-font should be ${fontKey}`);
                assertEqual(state.activeBtnCount, 1, `Exactly one button must have ring-2 active styling`);
                assertEqual(state.activeBtnFont, fontKey, `Active ring button must match ${fontKey}`);
                assertTrue(state.activePill.length > 0, `Pill text must be populated for ${fontKey}`);
                assertTrue(state.activeDesc.length > 0, `Preview description must be populated for ${fontKey}`);
            }
        });

        await runTest('2.2: Clicking secret buttons updates DOM, active ring, pill, and preview description', async () => {
            for (const sec of SECRET_FONTS) {
                await page.evaluate((key) => {
                    const btn = document.querySelector(`#settings-font-buttons-grid [data-font-btn="${key}"]`);
                    if (btn) btn.click();
                }, sec.key);
                await sleep(50);

                const state = await page.evaluate(() => {
                    const rootFont = document.documentElement.getAttribute('data-font');
                    const bodyFont = document.body.getAttribute('data-font');
                    const activePill = document.getElementById('settings-font-pill')?.textContent.trim();
                    const activeDesc = document.getElementById('settings-font-preview-desc')?.textContent.trim();
                    const activeBtns = Array.from(document.querySelectorAll('#settings-font-buttons-grid button')).filter(b => b.className.includes('ring-2 ring-indigo-500'));
                    return {
                        rootFont,
                        bodyFont,
                        activePill,
                        activeDesc,
                        activeBtnCount: activeBtns.length,
                        activeBtnFont: activeBtns[0]?.getAttribute('data-font-btn')
                    };
                });

                assertEqual(state.rootFont, sec.key, `HTML data-font should be ${sec.key}`);
                assertEqual(state.bodyFont, sec.key, `Body data-font should be ${sec.key}`);
                assertEqual(state.activeBtnCount, 1, `Exactly one button must have ring-2 active styling`);
                assertEqual(state.activeBtnFont, sec.key, `Active ring button must match ${sec.key}`);
                assertTrue(state.activePill.includes(sec.key === 'readable' ? 'Lexend' : (sec.key === 'firacode' ? 'Fira Code' : (sec.key === 'playfair' ? 'Playfair' : (sec.key === 'caveat' ? 'Caveat' : 'Orbitron')))), `Pill text must match font name for ${sec.key}`);
                assertTrue(state.activeDesc.length > 0, `Preview description must be populated for ${sec.key}`);
            }
        });

        // -----------------------------------------------------------------
        // SECTION 3: RAPID STRESS SWITCHING (75+ SWITCHES)
        // -----------------------------------------------------------------
        console.log('\n--- [Section 3] Rapid Stress Switching (75+ Sequential Switches) ---');

        await runTest('3.1: 50 sequential rapid switches across round-robin font sequence', async () => {
            // Perform 50 sequential switches by clicking buttons in settings grid
            for (let step = 0; step < 50; step++) {
                const targetFont = ALL_10_FONTS[step % ALL_10_FONTS.length];
                await page.evaluate((f) => {
                    const btn = document.querySelector(`#settings-font-buttons-grid [data-font-btn="${f}"]`);
                    if (btn) btn.click();
                }, targetFont);

                // Verify state consistency on every 5th step to keep runtime snappy while empirical
                if (step % 5 === 0 || step === 49) {
                    const snap = await page.evaluate((f, fontKeyName) => {
                        return {
                            docFont: document.documentElement.getAttribute('data-font'),
                            storageFont: window.StorageModule.getFontFamily(),
                            rawLocal: localStorage.getItem(fontKeyName),
                            activeRings: document.querySelectorAll('#settings-font-buttons-grid button.ring-2').length
                        };
                    }, targetFont, KEYS.FONT_FAMILY);

                    assertEqual(snap.docFont, targetFont, `Step ${step}: docFont must equal ${targetFont}`);
                    assertEqual(snap.storageFont, targetFont, `Step ${step}: storageFont must equal ${targetFont}`);
                    assertEqual(snap.rawLocal, targetFont, `Step ${step}: localStorage must equal ${targetFont}`);
                    assertEqual(snap.activeRings, 1, `Step ${step}: exactly one active ring button`);
                }
            }
        });

        await runTest('3.2: 25 rapid pseudo-random switches between standard and secret fonts', async () => {
            const randomChoices = [
                'orbitron', 'calibri', 'caveat', 'times', 'firacode',
                'poppins', 'playfair', 'montserrat', 'readable', 'lora',
                'firacode', 'times', 'orbitron', 'poppins', 'caveat',
                'calibri', 'readable', 'montserrat', 'playfair', 'lora',
                'orbitron', 'firacode', 'caveat', 'readable', 'playfair'
            ];

            for (let step = 0; step < randomChoices.length; step++) {
                const target = randomChoices[step];
                await page.evaluate((f) => {
                    const btn = document.querySelector(`#settings-font-buttons-grid [data-font-btn="${f}"]`);
                    if (btn) btn.click();
                }, target);

                const current = await page.evaluate(() => document.documentElement.getAttribute('data-font'));
                assertEqual(current, target, `Random switch step ${step} (${target}) mismatch`);
            }
        });

        await runTest('3.3: High-frequency rapid oscillation (20 iterations sub-millisecond in page context)', async () => {
            const oscillationResult = await page.evaluate(() => {
                const pair = ['firacode', 'times'];
                for (let i = 0; i < 20; i++) {
                    const font = pair[i % 2];
                    const btn = document.querySelector(`#settings-font-buttons-grid [data-font-btn="${font}"]`);
                    if (btn) btn.click();
                }
                return {
                    finalDocFont: document.documentElement.getAttribute('data-font'),
                    finalBodyFont: document.body.getAttribute('data-font'),
                    finalStorageFont: window.StorageModule.getFontFamily(),
                    activeButtons: Array.from(document.querySelectorAll('#settings-font-buttons-grid button.ring-2')).map(b => b.dataset.fontBtn)
                };
            });

            // After 20 iterations (0-indexed 19), pair[19 % 2] is pair[1] = 'times'
            assertEqual(oscillationResult.finalDocFont, 'times', 'Final docFont should be times');
            assertEqual(oscillationResult.finalBodyFont, 'times', 'Final bodyFont should be times');
            assertEqual(oscillationResult.finalStorageFont, 'times', 'Final storage font should be times');
            assertEqual(oscillationResult.activeButtons.length, 1, 'Only one active button after oscillation');
            assertEqual(oscillationResult.activeButtons[0], 'times', 'Active button must be times');
        });

        // -----------------------------------------------------------------
        // SECTION 4: PERSISTENCE ACROSS PAGE RELOAD & LOCALSTORAGE SIMULATION
        // -----------------------------------------------------------------
        console.log('\n--- [Section 4] Persistence Across Page Reload & LocalStorage Simulation ---');

        await runTest('4.1: Reload persistence for all 5 standard fonts', async () => {
            for (const std of STANDARD_FONTS) {
                await page.evaluate((f) => {
                    window.StorageModule.setFontFamily(f);
                }, std);

                await page.reload({ waitUntil: 'load' });
                await sleep(150);

                const reloadedState = await page.evaluate(() => {
                    return {
                        docFont: document.documentElement.getAttribute('data-font'),
                        bodyFont: document.body.getAttribute('data-font'),
                        storageFont: window.StorageModule.getFontFamily(),
                        pillText: document.getElementById('settings-font-pill')?.textContent.trim()
                    };
                });

                assertEqual(reloadedState.docFont, std, `Standard font ${std} must persist on html after reload`);
                assertEqual(reloadedState.bodyFont, std, `Standard font ${std} must persist on body after reload`);
                assertEqual(reloadedState.storageFont, std, `StorageModule.getFontFamily must return ${std} after reload`);
            }
        });

        await runTest('4.2: Reload persistence for all 5 secret fonts', async () => {
            for (const sec of SECRET_FONTS) {
                await page.evaluate((f) => {
                    window.StorageModule.setFontFamily(f);
                }, sec.key);

                await page.reload({ waitUntil: 'load' });
                await sleep(150);

                const reloadedState = await page.evaluate((f) => {
                    const btn = document.querySelector(`#settings-font-buttons-grid [data-font-btn="${f}"]`);
                    return {
                        docFont: document.documentElement.getAttribute('data-font'),
                        bodyFont: document.body.getAttribute('data-font'),
                        storageFont: window.StorageModule.getFontFamily(),
                        btnPresent: !!btn,
                        btnActive: btn?.className.includes('ring-2')
                    };
                }, sec.key);

                assertEqual(reloadedState.docFont, sec.key, `Secret font ${sec.key} must persist on html after reload`);
                assertEqual(reloadedState.bodyFont, sec.key, `Secret font ${sec.key} must persist on body after reload`);
                assertEqual(reloadedState.storageFont, sec.key, `StorageModule must return ${sec.key} after reload`);
                assertTrue(reloadedState.btnPresent, `Dynamic button for ${sec.key} must be restored in Settings on startup`);
                assertTrue(reloadedState.btnActive, `Dynamic button for ${sec.key} must retain active ring after reload`);
            }
        });

        await runTest('4.3: Edge case — LocalStorage has secret font but unlockedCodes was wiped', async () => {
            // Simulate orphaned secret font setting
            await page.evaluate((fontKey, vaultKey) => {
                localStorage.setItem(fontKey, 'orbitron');
                localStorage.setItem(vaultKey, JSON.stringify([]));
            }, KEYS.FONT_FAMILY, KEYS.VAULT_UNLOCKED);

            await page.reload({ waitUntil: 'load' });
            await sleep(150);

            const safeState = await page.evaluate(() => {
                return {
                    docFont: document.documentElement.getAttribute('data-font'),
                    bodyFont: document.body.getAttribute('data-font'),
                    storageFont: window.StorageModule.getFontFamily(),
                    buttonCount: document.querySelectorAll('#settings-font-buttons-grid [data-font-btn]').length
                };
            });

            // App should not crash; data-font is applied or defaults safely, and grid shows 5 standard buttons
            assertTrue(safeState.docFont === 'orbitron' || safeState.docFont === 'calibri', 'docFont is valid and does not throw');
            assertEqual(safeState.buttonCount, 5, 'Grid only shows 5 standard buttons because codes are locked');
        });

        await runTest('4.4: Corrupted / invalid font values fallback cleanly without throwing', async () => {
            const corruptedValues = [
                'invalid_font_xyz',
                'comic_sans',
                '',
                '<script>alert(1)</script>',
                'null',
                'undefined'
            ];

            for (const badVal of corruptedValues) {
                // Testing StorageModule.setFontFamily sanitize guard
                await page.evaluate((val) => {
                    const chosen = window.StorageModule.setFontFamily(val);
                    window.app.applyFontFamily(chosen);
                }, badVal);

                const fixedState = await page.evaluate((fontKey) => {
                    return {
                        docFont: document.documentElement.getAttribute('data-font'),
                        bodyFont: document.body.getAttribute('data-font'),
                        storageVal: localStorage.getItem(fontKey)
                    };
                }, KEYS.FONT_FAMILY);

                assertEqual(fixedState.docFont, 'calibri', `Invalid value '${badVal}' must fallback to 'calibri'`);
                assertEqual(fixedState.bodyFont, 'calibri', `Invalid value '${badVal}' must fallback body to 'calibri'`);
                assertEqual(fixedState.storageVal, 'calibri', `Storage must normalize invalid value to 'calibri'`);
            }
        });

        await runTest('4.5: JSON Export / Import roundtrip fidelity with secret fonts', async () => {
            // Setup active secret font 'firacode' and unlock all vault codes
            await page.evaluate((vaultKey) => {
                const allCodes = ['READABLE', 'FIRACODE', 'PLAYFAIR', 'HANDNOTE', 'ORBITRON'];
                localStorage.setItem(vaultKey, JSON.stringify(allCodes));
                window.StorageModule.setFontFamily('firacode');
                window.app.syncSettingsFontButtons();
                window.app.applyFontFamily('firacode');
            }, KEYS.VAULT_UNLOCKED);

            const exportedJson = await page.evaluate(() => window.StorageModule.exportJson());
            const parsed = JSON.parse(exportedJson);
            assertEqual(parsed.fontFamily, 'firacode', 'Exported JSON must include fontFamily = firacode');
            assertIncludes(parsed.unlockedCodes, 'FIRACODE', 'Exported JSON must include FIRACODE code');

            // Clear data but preserve initialized token (or re-set it like app does during user usage)
            await page.evaluate((initKey) => {
                localStorage.clear();
                localStorage.setItem(initKey, 'true');
            }, KEYS.INITIALIZED);

            // Import back
            const importRes = await page.evaluate((json) => {
                return window.StorageModule.importJson(json);
            }, exportedJson);

            assertEqual(importRes, true, 'importJson must return true');

            // Reload page to verify startup hydration from imported state
            await page.reload({ waitUntil: 'load' });
            await sleep(200);

            const restored = await page.evaluate(() => {
                return {
                    docFont: document.documentElement.getAttribute('data-font'),
                    bodyFont: document.body.getAttribute('data-font'),
                    storageFont: window.StorageModule.getFontFamily(),
                    firacodeBtnExists: !!document.querySelector('#settings-font-buttons-grid [data-font-btn="firacode"]'),
                    firacodeActive: document.querySelector('#settings-font-buttons-grid [data-font-btn="firacode"]')?.className.includes('ring-2')
                };
            });

            assertEqual(restored.docFont, 'firacode', 'Restored docFont must be firacode');
            assertEqual(restored.bodyFont, 'firacode', 'Restored bodyFont must be firacode');
            assertEqual(restored.storageFont, 'firacode', 'Restored storage font must be firacode');
            assertTrue(restored.firacodeBtnExists, 'firacode button must be restored in Settings');
            assertTrue(restored.firacodeActive, 'firacode button must be active with ring-2');
        });

        // -----------------------------------------------------------------
        // SECTION 5: CROSS-FEATURE INTERACTIONS WITH SPECIAL THEMES
        // -----------------------------------------------------------------
        console.log('\n--- [Section 5] Cross-Feature Interactions with Special Themes & Dark Mode ---');

        await runTest('5.1: Switching all 10 fonts under Apollo Theme preserves theme & rockets', async () => {
            // Unlock all codes and activate Apollo theme
            await page.evaluate((vaultKey) => {
                const allCodes = ['READABLE', 'FIRACODE', 'PLAYFAIR', 'HANDNOTE', 'ORBITRON', 'APOLLO11'];
                localStorage.setItem(vaultKey, JSON.stringify(allCodes));
                window.StorageModule.setActiveSpecialTheme('apollo');
                window.StorageModule.setApolloRocketsEnabled(true);
                document.documentElement.classList.add('theme-apollo');
                window.app.updateApolloRockets();
                window.app.syncSettingsFontButtons();
            }, KEYS.VAULT_UNLOCKED);

            for (const font of ALL_10_FONTS) {
                await page.evaluate((f) => {
                    const btn = document.querySelector(`#settings-font-buttons-grid [data-font-btn="${f}"]`);
                    if (btn) btn.click();
                }, font);

                const check = await page.evaluate((f) => {
                    const hasThemeClass = document.documentElement.classList.contains('theme-apollo');
                    const currentDocFont = document.documentElement.getAttribute('data-font');
                    const rocketCount = document.querySelectorAll('.apollo-rocket-badge').length;
                    return { hasThemeClass, currentDocFont, rocketCount };
                }, font);

                assertTrue(check.hasThemeClass, `theme-apollo must not be lost when switching to font ${font}`);
                assertEqual(check.currentDocFont, font, `Font must switch to ${font} under theme-apollo`);
                assertTrue(check.rocketCount > 0, `Apollo rockets must remain active when switching to font ${font}`);
            }
        });

        await runTest('5.2: Pairwise testing of all 11 Special Themes with each of the 5 Secret Fonts', async () => {
            for (const theme of SPECIAL_THEMES) {
                // Activate special theme
                await page.evaluate((th, allThemes) => {
                    allThemes.forEach(t => document.documentElement.classList.remove(t.themeClass));
                    document.documentElement.classList.add(th.themeClass);
                    window.StorageModule.setActiveSpecialTheme(th.themeId);
                }, theme, SPECIAL_THEMES);

                for (const sec of SECRET_FONTS) {
                    await page.evaluate((f) => {
                        window.StorageModule.setFontFamily(f);
                        window.app.applyFontFamily(f);
                    }, sec.key);

                    const pairState = await page.evaluate((th, f) => {
                        const hasTheme = document.documentElement.classList.contains(th.themeClass);
                        const dataFont = document.documentElement.getAttribute('data-font');
                        const bodyFont = document.body.getAttribute('data-font');
                        const computedFamily = window.getComputedStyle(document.body).fontFamily;
                        return { hasTheme, dataFont, bodyFont, computedFamily };
                    }, theme, sec.key);

                    assertTrue(pairState.hasTheme, `Theme ${theme.themeClass} must remain active`);
                    assertEqual(pairState.dataFont, sec.key, `data-font must be ${sec.key}`);
                    assertEqual(pairState.bodyFont, sec.key, `body data-font must be ${sec.key}`);
                    assertTrue(pairState.computedFamily.length > 0, `Computed font-family must be non-empty`);
                }
            }
        });

        await runTest('5.3: Dark mode toggling does not corrupt active typography', async () => {
            // Activate orbitron
            await page.evaluate(() => {
                window.StorageModule.setFontFamily('orbitron');
                window.app.applyFontFamily('orbitron');
            });

            // Toggle dark mode 10 times rapidly
            for (let d = 0; d < 10; d++) {
                await page.evaluate((isDark) => {
                    if (isDark) {
                        document.documentElement.classList.add('dark');
                        window.StorageModule.setTheme('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                        window.StorageModule.setTheme('light');
                    }
                }, d % 2 === 0);

                const fontAfterDark = await page.evaluate(() => {
                    return {
                        docFont: document.documentElement.getAttribute('data-font'),
                        bodyFont: document.body.getAttribute('data-font'),
                        storageFont: window.StorageModule.getFontFamily()
                    };
                });

                assertEqual(fontAfterDark.docFont, 'orbitron', 'docFont must remain orbitron during dark toggle');
                assertEqual(fontAfterDark.bodyFont, 'orbitron', 'bodyFont must remain orbitron during dark toggle');
                assertEqual(fontAfterDark.storageFont, 'orbitron', 'storageFont must remain orbitron during dark toggle');
            }
        });

        await runTest('5.4: Settings font switcher grid layout integrity on Mobile (375px) and Tablet (768px)', async () => {
            const viewports = [
                { name: 'Mobile 375px', width: 375, height: 667 },
                { name: 'Tablet 768px', width: 768, height: 1024 }
            ];

            for (const vp of viewports) {
                await page.setViewport({ width: vp.width, height: vp.height });
                await page.evaluate(() => window.app.switchView('settings'));

                for (const sec of SECRET_FONTS) {
                    await page.evaluate((f) => {
                        const btn = document.querySelector(`#settings-font-buttons-grid [data-font-btn="${f}"]`);
                        if (btn) btn.click();
                    }, sec.key);

                    const gridInfo = await page.evaluate(() => {
                        const grid = document.getElementById('settings-font-buttons-grid');
                        return {
                            scrollWidth: grid.scrollWidth,
                            clientWidth: grid.clientWidth,
                            hasHorizontalOverflow: grid.scrollWidth > grid.clientWidth,
                            visible: grid.offsetHeight > 0
                        };
                    });

                    assertFalse(gridInfo.hasHorizontalOverflow, `Grid overflow detected at ${vp.name} with font ${sec.key}`);
                    assertTrue(gridInfo.visible, `Grid must remain visible at ${vp.name} with font ${sec.key}`);
                }
            }

            // Restore viewport
            await page.setViewport({ width: 1280, height: 800 });
        });

        // -----------------------------------------------------------------
        // SECTION 6: CONSOLE ERROR CHECK
        // -----------------------------------------------------------------
        await runTest('6.1: Zero uncaught exceptions or fatal console errors during entire adversarial session', async () => {
            if (consoleErrors.length > 0) {
                console.warn('Recorded console warnings/errors:', consoleErrors);
            }
            // Filter out non-fatal offline asset 404s
            const fatalErrors = consoleErrors.filter(e => !e.includes('net::ERR_') && !e.includes('Failed to load resource'));
            assertEqual(fatalErrors.length, 0, `Expected 0 fatal console errors, found: ${JSON.stringify(fatalErrors)}`);
        });

        // -----------------------------------------------------------------
        // SUMMARY
        // -----------------------------------------------------------------
        console.log('\n========================================================================');
        console.log(`🏁 ADVERSARIAL STRESS RESULTS: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
        console.log('========================================================================');

        if (failed > 0) {
            console.log('\n❌ Failure details:');
            failureDetails.forEach(f => {
                console.log(`- ${f.testName}: ${f.error}`);
            });
        }

    } finally {
        if (browser) {
            await browser.close();
        }
    }

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runChallengerStressSuite().catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
});
