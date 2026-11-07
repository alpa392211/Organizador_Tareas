/**
 * tests/adversarial_m2_font_stress.js
 * Adversarial Stress & Verification Test Suite for Milestone 2 (v1.3.2)
 *
 * Empirical Challenger: Stress-tests Vault code submission for all 5 typography codes
 * (both primary codes and aliases), lowercase input sanitization, dual-box auto-focus,
 * paste event splitting, rapid multi-submission race conditions, and computed font-family
 * verification across body and DOM elements in Headless Chrome.
 */

const path = require('path');
const helpers = require('./test_helpers');

const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

const FONT_SPECS = [
    {
        id: 'READABLE',
        key: 'readable',
        expectedFamily: 'Lexend',
        fallback: 'sans-serif',
        primary: 'READABLE',
        primaryLower: 'readable',
        assignedAlias: 'LEXEND24',
        assignedAliasLower: 'lexend24',
        assignedAliasMixed: 'LeXeNd24',
        otherAliases: ['DYSLEXIC', 'READWELL', 'LEXEND'],
        paddedAlias: 'LEXEND__',
        brokenPaddedAlias: 'LECTURA_'
    },
    {
        id: 'FIRACODE',
        key: 'firacode',
        expectedFamily: 'Fira Code',
        fallback: 'monospace',
        primary: 'FIRACODE',
        primaryLower: 'firacode',
        assignedAlias: 'HACKER88',
        assignedAliasLower: 'hacker88',
        assignedAliasMixed: 'HaCkEr88',
        otherAliases: ['DEVSPACE', 'TERMINAL', 'MONOCODE', 'FIRA'],
        paddedAlias: 'FIRA____',
        brokenPaddedAlias: null
    },
    {
        id: 'PLAYFAIR',
        key: 'playfair',
        expectedFamily: 'Playfair Display',
        fallback: 'serif',
        primary: 'PLAYFAIR',
        primaryLower: 'playfair',
        assignedAlias: 'CINZEL99',
        assignedAliasLower: 'cinzel99',
        assignedAliasMixed: 'CiNzEl99',
        otherAliases: ['ROYALFNT', 'ELEGANCE', 'IMPERIAL'],
        paddedAlias: null,
        brokenPaddedAlias: 'PLAYFA__'
    },
    {
        id: 'HANDNOTE',
        key: 'caveat',
        expectedFamily: 'Caveat',
        fallback: 'cursive',
        primary: 'HANDNOTE',
        primaryLower: 'handnote',
        assignedAlias: 'CAVEAT24',
        assignedAliasLower: 'caveat24',
        assignedAliasMixed: 'CaVeAt24',
        otherAliases: ['NOTEBOOK', 'HANDMADE', 'CAVEAT'],
        paddedAlias: 'CAVEAT__',
        brokenPaddedAlias: 'APUNTES_'
    },
    {
        id: 'ORBITRON',
        key: 'orbitron',
        expectedFamily: 'Orbitron',
        fallback: 'sans-serif',
        primary: 'ORBITRON',
        primaryLower: 'orbitron',
        assignedAlias: 'CYBERFNT',
        assignedAliasLower: 'cyberfnt',
        assignedAliasMixed: 'CyBeRfNt',
        otherAliases: ['SCIFIHUD', 'FUTURIST'],
        paddedAlias: null,
        brokenPaddedAlias: 'ORBITR__'
    }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

async function runTest(testName, fn) {
    totalTests++;
    process.stdout.write(`  [TEST] ${testName} ... `);
    try {
        await fn();
        passedTests++;
        console.log(`${colors.green}PASS${colors.reset}`);
    } catch (err) {
        failedTests++;
        console.log(`${colors.red}FAIL${colors.reset}`);
        console.log(`    ${colors.red}${err.message}${colors.reset}`);
        failures.push({ name: testName, error: err.message, stack: err.stack });
    }
}

async function runAllAdversarialM2Tests() {
    console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}  CHALLENGER 1: ADVERSARIAL STRESS TEST SUITE — MILESTONE 2 (v1.3.2)    ${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

    const browser = await helpers.launchBrowser();

    try {
        // ====================================================================
        // GROUP 1: Primary Codes Unlock via Keystroke Typing (with Auto-Focus)
        // ====================================================================
        console.log(`${colors.bold}${colors.magenta}--- [Group 1] Primary Codes Unlock via Interactive Keystrokes & Lowercase ---${colors.reset}`);

        for (const spec of FONT_SPECS) {
            await runTest(`Unlock primary code [${spec.primaryLower}] via lowercase typing across dual boxes`, async () => {
                const page = await helpers.createCleanPage(browser);
                await page.evaluate(() => window.app.switchView('secret-codes'));

                const p1 = spec.primaryLower.slice(0, 4);
                const p2 = spec.primaryLower.slice(4, 8);

                // Focus p1 and type 4 chars
                await page.focus('#vault-code-p1');
                await page.keyboard.type(p1, { delay: 20 });

                // Verify auto-focus moved to p2
                await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'vault-code-p2');
                const activeEl = await page.evaluate(() => document.activeElement.id);
                helpers.assertEqual(activeEl, 'vault-code-p2', `Focus did not auto-advance to p2 after typing 4 chars in p1`);

                // Type remaining 4 chars into p2
                await page.keyboard.type(p2, { delay: 20 });

                // Verify uppercase transformation
                const p1Val = await page.evaluate(() => document.getElementById('vault-code-p1').value);
                const p2Val = await page.evaluate(() => document.getElementById('vault-code-p2').value);
                helpers.assertEqual(p1Val, p1.toUpperCase(), `p1 value not uppercase`);
                helpers.assertEqual(p2Val, p2.toUpperCase(), `p2 value not uppercase`);

                // Submit via Enter key on p2
                await page.keyboard.press('Enter');

                // Wait for unlock sequence animation (850ms)
                await new Promise(r => setTimeout(r, 950));

                // Verify code unlocked in storage
                const isUnlocked = await page.evaluate(id => window.StorageModule.isCodeUnlocked(id), spec.id);
                helpers.assert(isUnlocked, `StorageModule did not record ${spec.id} as unlocked`);

                // Verify reveal modal opened
                const modalVisible = await page.evaluate(() => {
                    const m = document.getElementById('vault-reveal-modal');
                    return m && !m.classList.contains('hidden');
                });
                helpers.assert(modalVisible, `Reveal modal is not visible after unlock`);

                // Click action button to apply font
                await page.evaluate(() => document.getElementById('vault-reveal-action-btn')?.click());

                // Verify data-font applied to html and body
                const htmlFont = await page.evaluate(() => document.documentElement.getAttribute('data-font'));
                const bodyFont = await page.evaluate(() => document.body.getAttribute('data-font'));
                helpers.assertEqual(htmlFont, spec.key, `<html> data-font mismatch`);
                helpers.assertEqual(bodyFont, spec.key, `<body> data-font mismatch`);

                // Verify storage persistence
                const storedFont = await page.evaluate(() => window.StorageModule.getFontFamily());
                helpers.assertEqual(storedFont, spec.key, `StorageModule getFontFamily mismatch`);

                await page.close();
            });
        }

        // ====================================================================
        // GROUP 2: Assigned Aliases Unlock (Mixed-case & Lowercase)
        // ====================================================================
        console.log(`\n${colors.bold}${colors.magenta}--- [Group 2] Assigned Aliases Unlock (LEXEND24, HACKER88, CINZEL99, CAVEAT24, CYBERFNT) ---${colors.reset}`);

        for (const spec of FONT_SPECS) {
            await runTest(`Unlock via assigned alias [${spec.assignedAliasMixed}] (mixed-case entry)`, async () => {
                const page = await helpers.createCleanPage(browser);
                await page.evaluate(() => window.app.switchView('secret-codes'));

                const p1 = spec.assignedAliasMixed.slice(0, 4);
                const p2 = spec.assignedAliasMixed.slice(4, 8);

                await page.focus('#vault-code-p1');
                await page.keyboard.type(p1, { delay: 20 });

                await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'vault-code-p2');
                await page.keyboard.type(p2, { delay: 20 });

                await page.click('#vault-submit-btn');
                await new Promise(r => setTimeout(r, 950));

                const isUnlocked = await page.evaluate(id => window.StorageModule.isCodeUnlocked(id), spec.id);
                helpers.assert(isUnlocked, `Alias ${spec.assignedAlias} failed to unlock ${spec.id}`);

                await page.evaluate(() => document.getElementById('vault-reveal-action-btn')?.click());
                const activeFont = await page.evaluate(() => document.documentElement.getAttribute('data-font'));
                helpers.assertEqual(activeFont, spec.key, `Active font mismatch for alias ${spec.assignedAlias}`);

                await page.close();
            });
        }

        // ====================================================================
        // GROUP 3: Secondary Clean Aliases
        // ====================================================================
        console.log(`\n${colors.bold}${colors.magenta}--- [Group 3] Secondary Clean Aliases (DYSLEXIC, DEVSPACE, ROYALFNT, NOTEBOOK, SCIFIHUD, etc.) ---${colors.reset}`);

        for (const spec of FONT_SPECS) {
            for (const alias of spec.otherAliases) {
                await runTest(`Secondary alias [${alias}] unlocks [${spec.id}]`, async () => {
                    const page = await helpers.createCleanPage(browser);
                    await page.evaluate(() => window.app.switchView('secret-codes'));

                    const p1 = alias.slice(0, 4);
                    const p2 = alias.slice(4, 8);

                    await page.evaluate((a, b) => {
                        document.getElementById('vault-code-p1').value = a;
                        document.getElementById('vault-code-p2').value = b;
                    }, p1, p2);

                    await page.click('#vault-submit-btn');
                    await new Promise(r => setTimeout(r, 950));

                    const isUnlocked = await page.evaluate(id => window.StorageModule.isCodeUnlocked(id), spec.id);
                    helpers.assert(isUnlocked, `Secondary alias ${alias} failed to unlock ${spec.id}`);

                    await page.close();
                });
            }
        }

        // ====================================================================
        // GROUP 4: Padded Aliases with Underscores (Adversarial Bug Surface)
        // ====================================================================
        console.log(`\n${colors.bold}${colors.magenta}--- [Group 4] Padded Aliases with Underscores Empirical Exploration ---${colors.reset}`);

        for (const spec of FONT_SPECS) {
            if (spec.brokenPaddedAlias) {
                await runTest(`Adversarial test on broken padded alias [${spec.brokenPaddedAlias}] due to underscore stripping`, async () => {
                    const page = await helpers.createCleanPage(browser);
                    await page.evaluate(() => window.app.switchView('secret-codes'));

                    // Enter the padded alias by setting input and dispatching input event
                    await page.focus('#vault-code-p1');
                    await page.keyboard.type(spec.brokenPaddedAlias);

                    const p1Val = await page.evaluate(() => document.getElementById('vault-code-p1').value);
                    const p2Val = await page.evaluate(() => document.getElementById('vault-code-p2').value);

                    // Check if underscore was stripped by regex [^a-zA-Z0-9]
                    const combined = p1Val + p2Val;
                    helpers.assert(!combined.includes('_'), `Underscore was not stripped by input sanitization`);

                    await page.click('#vault-submit-btn');
                    await new Promise(r => setTimeout(r, 300));

                    const status = await page.evaluate(() => document.getElementById('vault-status-message').textContent);
                    const isDenied = status.includes('denegado') || status.includes('no reconocido');
                    helpers.assert(isDenied, `Expected alias ${spec.brokenPaddedAlias} without underscore mapping to fail gracefully with access denied`);

                    await page.close();
                });
            }

            if (spec.paddedAlias) {
                await runTest(`Adversarial test on supported padded alias [${spec.paddedAlias}] (fallback to unpadded root)`, async () => {
                    const page = await helpers.createCleanPage(browser);
                    await page.evaluate(() => window.app.switchView('secret-codes'));

                    await page.focus('#vault-code-p1');
                    await page.keyboard.type(spec.paddedAlias, { delay: 20 });

                    await page.click('#vault-submit-btn');
                    await new Promise(r => setTimeout(r, 950));

                    const isUnlocked = await page.evaluate(id => window.StorageModule.isCodeUnlocked(id), spec.id);
                    helpers.assert(isUnlocked, `Expected unpadded root of ${spec.paddedAlias} to unlock ${spec.id}`);

                    await page.close();
                });
            }
        }

        // ====================================================================
        // GROUP 5: Dual Box Focus & Keyboard Navigation
        // ====================================================================
        console.log(`\n${colors.bold}${colors.magenta}--- [Group 5] Dual Box Focus & Keystroke Navigation Stress Tests ---${colors.reset}`);

        await runTest(`Backspace on empty p2 returns focus to p1`, async () => {
            const page = await helpers.createCleanPage(browser);
            await page.evaluate(() => window.app.switchView('secret-codes'));

            await page.focus('#vault-code-p1');
            await page.keyboard.type('TEST');

            let activeId = await page.evaluate(() => document.activeElement.id);
            helpers.assertEqual(activeId, 'vault-code-p2', `Focus should be on p2 after typing 4 chars in p1`);

            // Press Backspace on empty p2
            await page.keyboard.press('Backspace');
            activeId = await page.evaluate(() => document.activeElement.id);
            helpers.assertEqual(activeId, 'vault-code-p1', `Focus should return to p1 on Backspace in empty p2`);

            await page.close();
        });

        await runTest(`Enter on p1 with 4 characters moves focus to p2 without premature submit`, async () => {
            const page = await helpers.createCleanPage(browser);
            await page.evaluate(() => window.app.switchView('secret-codes'));

            await page.focus('#vault-code-p1');
            await page.keyboard.type('ORBI');
            // Force focus back to p1 to test Enter key behavior
            await page.focus('#vault-code-p1');
            await page.keyboard.press('Enter');

            const activeId = await page.evaluate(() => document.activeElement.id);
            helpers.assertEqual(activeId, 'vault-code-p2', `Enter key on p1 with 4 chars should focus p2`);

            // Verify no premature failure message was triggered
            const statusText = await page.evaluate(() => document.getElementById('vault-status-message').textContent.trim());
            helpers.assert(!statusText.includes('denegado'), `Premature submission triggered by Enter on p1`);

            await page.close();
        });

        await runTest(`Enter on p1 with < 4 characters calls verifyCode (triggers error feedback)`, async () => {
            const page = await helpers.createCleanPage(browser);
            await page.evaluate(() => window.app.switchView('secret-codes'));

            await page.focus('#vault-code-p1');
            await page.keyboard.type('ABC');
            await page.keyboard.press('Enter');

            await new Promise(r => setTimeout(r, 200));
            const statusText = await page.evaluate(() => document.getElementById('vault-status-message').textContent);
            helpers.assert(statusText.includes('denegado'), `Short code submit did not trigger access denied`);

            await page.close();
        });

        await runTest(`Non-alphanumeric characters are completely filtered out in real-time`, async () => {
            const page = await helpers.createCleanPage(browser);
            await page.evaluate(() => window.app.switchView('secret-codes'));

            await page.focus('#vault-code-p1');
            await page.keyboard.type('!@#$R%^&E*()A_+~D');

            const p1Val = await page.evaluate(() => document.getElementById('vault-code-p1').value);
            helpers.assertEqual(p1Val, 'READ', `Special characters were not filtered in p1`);

            await page.keyboard.type('{}:"<>?A!@B#$L%^E');
            const p2Val = await page.evaluate(() => document.getElementById('vault-code-p2').value);
            helpers.assertEqual(p2Val, 'ABLE', `Special characters were not filtered in p2`);

            await page.close();
        });

        // ====================================================================
        // GROUP 6: Paste Handling Stress Tests
        // ====================================================================
        console.log(`\n${colors.bold}${colors.magenta}--- [Group 6] Paste Handling Stress Tests (p1, p2, spaces, lowercase, overflow) ---${colors.reset}`);

        await runTest(`Pasting full 8-character code [READABLE] into p1 splits into p1 and p2 and focuses p2`, async () => {
            const page = await helpers.createCleanPage(browser);
            await page.evaluate(() => window.app.switchView('secret-codes'));

            await page.evaluate(() => {
                const p1 = document.getElementById('vault-code-p1');
                const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
                pasteEvent.clipboardData = {
                    getData: () => 'READABLE'
                };
                p1.dispatchEvent(pasteEvent);
            });

            const p1Val = await page.evaluate(() => document.getElementById('vault-code-p1').value);
            const p2Val = await page.evaluate(() => document.getElementById('vault-code-p2').value);
            const activeId = await page.evaluate(() => document.activeElement.id);

            helpers.assertEqual(p1Val, 'READ', `p1 does not contain first 4 characters`);
            helpers.assertEqual(p2Val, 'ABLE', `p2 does not contain second 4 characters`);
            helpers.assertEqual(activeId, 'vault-code-p2', `p2 was not focused after paste`);

            await page.close();
        });

        await runTest(`Pasting lowercase with surrounding spaces and dashes ["  hacker-88  "] into p1 normalizes cleanly`, async () => {
            const page = await helpers.createCleanPage(browser);
            await page.evaluate(() => window.app.switchView('secret-codes'));

            await page.evaluate(() => {
                const p1 = document.getElementById('vault-code-p1');
                const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
                pasteEvent.clipboardData = {
                    getData: () => '  hacker-88  '
                };
                p1.dispatchEvent(pasteEvent);
            });

            const p1Val = await page.evaluate(() => document.getElementById('vault-code-p1').value);
            const p2Val = await page.evaluate(() => document.getElementById('vault-code-p2').value);

            helpers.assertEqual(p1Val, 'HACK', `p1 did not sanitize properly`);
            helpers.assertEqual(p2Val, 'ER88', `p2 did not sanitize properly`);

            await page.close();
        });

        await runTest(`Pasting >8 characters into p1 slices first 8 characters without overflow`, async () => {
            const page = await helpers.createCleanPage(browser);
            await page.evaluate(() => window.app.switchView('secret-codes'));

            await page.evaluate(() => {
                const p1 = document.getElementById('vault-code-p1');
                const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
                pasteEvent.clipboardData = {
                    getData: () => 'ORBITRON_HUD_EXTRA_LONG_PAYLOAD'
                };
                p1.dispatchEvent(pasteEvent);
            });

            const p1Val = await page.evaluate(() => document.getElementById('vault-code-p1').value);
            const p2Val = await page.evaluate(() => document.getElementById('vault-code-p2').value);

            helpers.assertEqual(p1Val, 'ORBI', `p1 overflowed or mis-sliced`);
            helpers.assertEqual(p2Val, 'TRON', `p2 overflowed or mis-sliced`);

            await page.close();
        });

        await runTest(`Pasting full code into p2 when p1 is empty automatically distributes across p1 and p2`, async () => {
            const page = await helpers.createCleanPage(browser);
            await page.evaluate(() => window.app.switchView('secret-codes'));

            await page.evaluate(() => {
                const p2 = document.getElementById('vault-code-p2');
                const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
                pasteEvent.clipboardData = {
                    getData: () => 'PLAYFAIR'
                };
                p2.dispatchEvent(pasteEvent);
            });

            const p1Val = await page.evaluate(() => document.getElementById('vault-code-p1').value);
            const p2Val = await page.evaluate(() => document.getElementById('vault-code-p2').value);

            helpers.assertEqual(p1Val, 'PLAY', `p1 was not populated when pasting into p2`);
            helpers.assertEqual(p2Val, 'FAIR', `p2 was not populated when pasting into p2`);

            await page.close();
        });

        // ====================================================================
        // GROUP 7: Rapid Submissions & Race Condition Stress
        // ====================================================================
        console.log(`\n${colors.bold}${colors.magenta}--- [Group 7] Rapid Submissions & Race Condition Stress ---${colors.reset}`);

        await runTest(`Rapid burst of 10 clicks on #vault-submit-btn within 50ms does not duplicate code in storage`, async () => {
            const page = await helpers.createCleanPage(browser);
            await page.evaluate(() => window.app.switchView('secret-codes'));

            await page.evaluate(() => {
                document.getElementById('vault-code-p1').value = 'ORBI';
                document.getElementById('vault-code-p2').value = 'TRON';
            });

            // Fire 10 rapid clicks
            await page.evaluate(() => {
                const btn = document.getElementById('vault-submit-btn');
                for (let i = 0; i < 10; i++) {
                    btn.click();
                }
            });

            await new Promise(r => setTimeout(r, 1200));

            // Verify unlocked codes array has exactly one entry for ORBITRON
            const unlocked = await page.evaluate(() => window.StorageModule.getUnlockedCodes());
            const orbitronCount = unlocked.filter(c => c === 'ORBITRON').length;
            helpers.assertEqual(orbitronCount, 1, `Storage has duplicate entries for ORBITRON: ${JSON.stringify(unlocked)}`);

            // Verify reveal modal is open and functioning
            const isModalOpen = await page.evaluate(() => {
                const m = document.getElementById('vault-reveal-modal');
                return m && !m.classList.contains('hidden');
            });
            helpers.assert(isModalOpen, `Reveal modal failed to open cleanly after rapid clicks`);

            await page.close();
        });

        await runTest(`Rapid burst of 10 invalid submissions handles shake and recovery without uncaught exceptions`, async () => {
            const page = await helpers.createCleanPage(browser);
            await page.evaluate(() => window.app.switchView('secret-codes'));

            await page.evaluate(() => {
                document.getElementById('vault-code-p1').value = 'FAIL';
                document.getElementById('vault-code-p2').value = 'CODE';
            });

            let errorOccurred = false;
            page.on('pageerror', () => { errorOccurred = true; });

            await page.evaluate(() => {
                const btn = document.getElementById('vault-submit-btn');
                for (let i = 0; i < 10; i++) {
                    btn.click();
                }
            });

            await new Promise(r => setTimeout(r, 600));
            helpers.assert(!errorOccurred, `Rapid invalid submissions triggered uncaught page error`);

            const statusText = await page.evaluate(() => document.getElementById('vault-status-message').textContent);
            helpers.assert(statusText.includes('denegado'), `Status message did not show access denied`);

            await page.close();
        });

        // ====================================================================
        // GROUP 8: Computed Font-Family Styles on Body & Elements in Headless Chrome
        // ====================================================================
        console.log(`\n${colors.bold}${colors.magenta}--- [Group 8] Computed font-family Verification in Headless Chrome ---${colors.reset}`);

        for (const spec of FONT_SPECS) {
            await runTest(`Computed font-family for [${spec.key}] on document.body, root, headers, and task elements`, async () => {
                const page = await helpers.createCleanPage(browser);

                // Add a dummy task and note to DOM to test cascading inheritance
                await page.evaluate(() => {
                    window.StorageModule.addTask({
                        id: 'task-adv-font',
                        title: 'Tarea Titulo Tipografia Test',
                        description: 'Descripcion detallada para evaluar font-family computado',
                        subjectId: 'general',
                        type: 'tarea',
                        dueDate: '2026-11-15',
                        dueTime: '10:00',
                        completed: false,
                        priority: 'alta'
                    });
                    window.TasksModule.render();
                });

                // Apply the font to both Storage and App
                await page.evaluate((font, codeId) => {
                    window.StorageModule.unlockCode(codeId);
                    window.StorageModule.setFontFamily(font);
                    window.app.applyFontFamily(font);
                }, spec.key, spec.id);

                // 1. Check document.body computed font
                const bodyComputed = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily);
                helpers.assert(
                    bodyComputed.toLowerCase().includes(spec.expectedFamily.toLowerCase()),
                    `document.body font-family "${bodyComputed}" does not include "${spec.expectedFamily}"`
                );

                // 2. Check document.documentElement computed font
                const rootComputed = await page.evaluate(() => window.getComputedStyle(document.documentElement).fontFamily);
                helpers.assert(
                    rootComputed.toLowerCase().includes(spec.expectedFamily.toLowerCase()),
                    `document.documentElement font-family "${rootComputed}" does not include "${spec.expectedFamily}"`
                );

                // 3. Check Header computed font
                const headerComputed = await page.evaluate(() => {
                    const h = document.querySelector('header h1, header h2, header span, header') || document.body;
                    return window.getComputedStyle(h).fontFamily;
                });
                helpers.assert(
                    headerComputed.toLowerCase().includes(spec.expectedFamily.toLowerCase()),
                    `header element font-family "${headerComputed}" does not include "${spec.expectedFamily}"`
                );

                // 4. Check Task card and title computed font
                const taskComputed = await page.evaluate(() => {
                    const taskEl = document.querySelector('.task-card, [data-task-id]')?.querySelector('h3, h4, p, span');
                    return taskEl ? window.getComputedStyle(taskEl).fontFamily : null;
                });
                helpers.assert(
                    taskComputed && taskComputed.toLowerCase().includes(spec.expectedFamily.toLowerCase()),
                    `task element font-family "${taskComputed}" does not include "${spec.expectedFamily}"`
                );

                // 5. Check Settings font pill text and computed font
                await page.evaluate(() => window.app.switchView('settings'));
                const pillText = await page.evaluate(() => document.getElementById('settings-font-pill')?.textContent);
                helpers.assert(
                    pillText && pillText.toLowerCase().includes(spec.expectedFamily.toLowerCase()),
                    `settings-font-pill text "${pillText}" does not mention "${spec.expectedFamily}"`
                );

                await page.close();
            });
        }

        // ====================================================================
        // GROUP 9: Settings Grid Font Buttons & Vault Inventory Coexistence
        // ====================================================================
        console.log(`\n${colors.bold}${colors.magenta}--- [Group 9] Settings Grid Font Buttons & Vault Inventory Coexistence ---${colors.reset}`);

        await runTest(`All 5 unlocked secret fonts inject dynamic buttons with [✨ Secreto] badge in Settings`, async () => {
            const page = await helpers.createCleanPage(browser);

            // Unlock all 5 fonts in storage
            await page.evaluate(() => {
                ['READABLE', 'FIRACODE', 'PLAYFAIR', 'HANDNOTE', 'ORBITRON'].forEach(id => {
                    window.StorageModule.unlockCode(id);
                });
                window.app.syncSettingsFontButtons();
                window.app.switchView('settings');
            });

            const secretButtons = await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('#settings-font-buttons-grid [data-font-btn]'));
                return btns.map(b => ({
                    font: b.dataset.fontBtn,
                    text: b.textContent.trim(),
                    hasBadge: b.textContent.includes('Secreto') || b.textContent.includes('✨')
                }));
            });

            for (const spec of FONT_SPECS) {
                const found = secretButtons.find(b => b.font === spec.key);
                helpers.assert(found, `Secret font button for ${spec.key} not found in Settings grid`);
                helpers.assert(found.hasBadge, `Secret font button for ${spec.key} missing ✨ Secreto badge`);
            }

            // Click the Orbitron button in settings grid and verify immediate activation
            await page.evaluate(() => {
                const btn = document.querySelector('#settings-font-buttons-grid [data-font-btn="orbitron"]');
                btn?.click();
            });

            const activeFont = await page.evaluate(() => document.documentElement.getAttribute('data-font'));
            helpers.assertEqual(activeFont, 'orbitron', `Clicking secret button in Settings did not apply orbitron`);

            await page.close();
        });

        await runTest(`Vault Inventory cards render toggle actions (Activar / Restaurar Fuente Estándar)`, async () => {
            const page = await helpers.createCleanPage(browser);

            await page.evaluate(() => {
                window.StorageModule.unlockCode('ORBITRON');
                window.app.switchView('secret-codes');
            });

            // Find Orbitron card in inventory using #vault-unlocked-grid
            const cardActionBtnText = await page.evaluate(() => {
                const cards = Array.from(document.querySelectorAll('#vault-unlocked-grid > div'));
                const orbitronCard = cards.find(c => c.textContent.includes('Orbitron'));
                return orbitronCard?.querySelector('button')?.textContent.trim();
            });

            helpers.assert(
                cardActionBtnText && cardActionBtnText.includes('Activar Tipografía'),
                `Inventory card button text unexpected: "${cardActionBtnText}"`
            );

            // Click to activate
            await page.evaluate(() => {
                const cards = Array.from(document.querySelectorAll('#vault-unlocked-grid > div'));
                const orbitronCard = cards.find(c => c.textContent.includes('Orbitron'));
                orbitronCard?.querySelector('button')?.click();
            });

            let activeFont = await page.evaluate(() => document.documentElement.getAttribute('data-font'));
            helpers.assertEqual(activeFont, 'orbitron', `Activating from inventory did not set orbitron`);

            // Click again to restore standard
            await page.evaluate(() => {
                const cards = Array.from(document.querySelectorAll('#vault-unlocked-grid > div'));
                const orbitronCard = cards.find(c => c.textContent.includes('Orbitron'));
                orbitronCard?.querySelector('button')?.click();
            });

            activeFont = await page.evaluate(() => document.documentElement.getAttribute('data-font'));
            helpers.assertEqual(activeFont, 'calibri', `Restoring standard font did not reset to calibri`);

            await page.close();
        });

        await runTest(`Offline page reload preserves chosen secret font in LocalStorage and DOM`, async () => {
            const page = await helpers.createCleanPage(browser);

            // Set to caveat
            await page.evaluate(() => {
                window.StorageModule.unlockCode('HANDNOTE');
                window.StorageModule.setFontFamily('caveat');
                window.app.applyFontFamily('caveat');
            });

            // Reload page
            await page.reload({ waitUntil: 'load' });

            const loadedFont = await page.evaluate(() => document.documentElement.getAttribute('data-font'));
            const loadedBodyFont = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily);

            helpers.assertEqual(loadedFont, 'caveat', `Reload did not restore data-font="caveat"`);
            helpers.assert(
                loadedBodyFont.toLowerCase().includes('caveat'),
                `Computed body font "${loadedBodyFont}" does not contain Caveat after reload`
            );

            await page.close();
        });

        // ====================================================================
        // GROUP 10: Cumulative Multi-Unlock Session & JSON Backup Fidelity
        // ====================================================================
        console.log(`\n${colors.bold}${colors.magenta}--- [Group 10] Multi-Unlock Single Session & Backup Interop ---${colors.reset}`);

        await runTest(`Unlocking all 5 fonts sequentially in a single user session without refresh`, async () => {
            const page = await helpers.createCleanPage(browser);
            await page.evaluate(() => window.app.switchView('secret-codes'));

            for (const spec of FONT_SPECS) {
                await page.evaluate((c) => {
                    document.getElementById('vault-code-p1').value = c.slice(0, 4);
                    document.getElementById('vault-code-p2').value = c.slice(4, 8);
                    document.getElementById('vault-submit-btn').click();
                }, spec.primary);

                await new Promise(r => setTimeout(r, 950));

                // Click reveal action button to apply
                await page.evaluate(() => {
                    const actionBtn = document.getElementById('vault-reveal-action-btn');
                    actionBtn?.click();
                });

                // Close modal if still visible
                await page.evaluate(() => {
                    const closeBtn = document.getElementById('vault-reveal-close-btn');
                    closeBtn?.click();
                });

                const active = await page.evaluate(() => document.documentElement.getAttribute('data-font'));
                helpers.assertEqual(active, spec.key, `Failed sequential activation of ${spec.key}`);
            }

            // Verify all 5 are in unlocked codes
            const unlockedList = await page.evaluate(() => window.StorageModule.getUnlockedCodes());
            for (const spec of FONT_SPECS) {
                helpers.assert(unlockedList.includes(spec.id), `${spec.id} not present in final unlocked list`);
            }

            await page.close();
        });

    } finally {
        await browser.close();
    }

    // ====================================================================
    // Summary
    // ====================================================================
    console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
    console.log(`${colors.bold}ADVERSARIAL STRESS TEST EXECUTION SUMMARY:${colors.reset}`);
    console.log(`  Total:     ${colors.bold}${totalTests}${colors.reset}`);
    console.log(`  Passed:    ${colors.green}${passedTests}${colors.reset}`);
    console.log(`  Failed:    ${colors.red}${failedTests}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

    if (failures.length > 0) {
        console.log(`${colors.red}${colors.bold}FAILURES DETECTED (${failures.length}):${colors.reset}`);
        failures.forEach((f, idx) => {
            console.log(`  ${idx + 1}. ${f.name}: ${f.error}`);
        });
        process.exit(1);
    } else {
        console.log(`${colors.green}${colors.bold}ALL ADVERSARIAL STRESS TESTS COMPLETED SUCCESSFULLY!${colors.reset}\n`);
        process.exit(0);
    }
}

runAllAdversarialM2Tests().catch(err => {
    console.error('Fatal test runner failure:', err);
    process.exit(1);
});
