/**
 * tests/test_milestone2_adversarial.js
 * Adversarial Challenger Test Suite for Milestone 2:
 * Secret Code Vault, Unlocking Animations & Easter Egg Catalog
 */

const {
    launchBrowser,
    createCleanPage,
    assert,
    assertEqual,
    assertTrue,
    assertFalse,
    assertIncludes,
    hasClass,
    getElementText,
    getInputValue,
    safeClick
} = require('./test_helpers');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function navigateToVault(page) {
    await page.evaluate(() => {
        if (window.App && typeof window.App.switchView === 'function') {
            window.App.switchView('secret-codes');
        } else {
            const openBtn = document.getElementById('open-secret-codes-btn');
            if (openBtn) openBtn.click();
        }
    });
    await sleep(250);
}

async function simulatePaste(page, selector, text) {
    await page.evaluate((sel, pasteContent) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`Element ${sel} not found`);
        el.focus();
        const dt = new DataTransfer();
        dt.setData('text/plain', pasteContent);
        const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: dt
        });
        el.dispatchEvent(pasteEvent);
    }, selector, text);
}

async function clearVaultInputs(page) {
    await page.evaluate(() => {
        const p1 = document.getElementById('vault-code-p1');
        const p2 = document.getElementById('vault-code-p2');
        if (p1) p1.value = '';
        if (p2) p2.value = '';
    });
}

async function closeModalIfOpen(page) {
    await page.evaluate(() => {
        const modal = document.getElementById('vault-reveal-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    });
    await sleep(100);
}

async function runAdversarialSuite() {
    console.log('========================================================================');
    console.log('🕵️ MILESTONE 2: ADVERSARIAL CHALLENGER VERIFICATION SUITE');
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

        // -------------------------------------------------------------
        // SECTION 1: MULTI-FORMAT CODE PARSER & 7-LETTER EDUARDO TESTS
        // -------------------------------------------------------------
        console.log('\n--- [Section 1] Multi-Format Code Parser & Alias Robustness ---');

        await runTest('Parser 1.1: 7-letter EDUARDO typed as EDUA (P1) + RDO (P2)', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            await page.type('#vault-code-p1', 'EDUA');
            await page.type('#vault-code-p2', 'RDO');
            
            const p1Val = await getInputValue(page, '#vault-code-p1');
            const p2Val = await getInputValue(page, '#vault-code-p2');
            assertEqual(p1Val, 'EDUA', 'P1 value mismatch');
            assertEqual(p2Val, 'RDO', 'P2 value mismatch');

            await safeClick(page, '#vault-submit-btn');
            await sleep(1100); // Wait for unlock animation and modal pop

            // Verify modal is open
            const isModalHidden = await hasClass(page, '#vault-reveal-modal', 'hidden');
            assertFalse(isModalHidden, 'Vault reveal modal must be open');

            const title = await getElementText(page, '#vault-reveal-title');
            assertEqual(title, 'Protocolo Creador Eduardo VIP', 'Modal title mismatch for EDUARDO');

            const icon = await getElementText(page, '#vault-reveal-icon');
            assertEqual(icon, '👑', 'Modal icon mismatch for EDUARDO');

            // Verify LocalStorage contains EDUARDO
            const unlockedCodes = await page.evaluate(() => window.StorageModule.getUnlockedCodes());
            assertIncludes(unlockedCodes, 'EDUARDO', 'Storage must include EDUARDO');

            await closeModalIfOpen(page);
        });

        await runTest('Parser 1.2: Lowercase input "eduardo" auto-uppercased and parsed', async () => {
            await page.evaluate(() => {
                localStorage.clear();
            });
            await page.reload({ waitUntil: 'load' });
            await navigateToVault(page);
            await clearVaultInputs(page);

            // Focus P1 and type lowercase edua
            await page.focus('#vault-code-p1');
            await page.keyboard.type('edua');
            let p1Val = await getInputValue(page, '#vault-code-p1');
            assertEqual(p1Val, 'EDUA', 'P1 should auto-uppercase');

            // Type lowercase rdo into P2
            await page.focus('#vault-code-p2');
            await page.keyboard.type('rdo');
            let p2Val = await getInputValue(page, '#vault-code-p2');
            assertEqual(p2Val, 'RDO', 'P2 should auto-uppercase');

            await safeClick(page, '#vault-submit-btn');
            await sleep(1100);

            const isModalHidden = await hasClass(page, '#vault-reveal-modal', 'hidden');
            assertFalse(isModalHidden, 'Modal should open after lowercase eduardo typed');

            const title = await getElementText(page, '#vault-reveal-title');
            assertEqual(title, 'Protocolo Creador Eduardo VIP');

            await closeModalIfOpen(page);
        });

        await runTest('Parser 1.3: Padded alias "EDUARDO1" unlocks EDUARDO', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            await page.evaluate(() => {
                document.getElementById('vault-code-p1').value = 'EDUA';
                document.getElementById('vault-code-p2').value = 'RDO1';
            });

            await safeClick(page, '#vault-submit-btn');
            await sleep(1100);

            const isModalHidden = await hasClass(page, '#vault-reveal-modal', 'hidden');
            assertFalse(isModalHidden, 'Modal should open for EDUARDO1');

            const title = await getElementText(page, '#vault-reveal-title');
            assertEqual(title, 'Protocolo Creador Eduardo VIP');

            await closeModalIfOpen(page);
        });

        await runTest('Parser 1.4: Padded alias "EDUARDO_" via cleaned/alias dictionary', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            await page.evaluate(() => {
                document.getElementById('vault-code-p1').value = 'EDUA';
                document.getElementById('vault-code-p2').value = 'RDO_';
                document.getElementById('vault-submit-btn').click();
            });
            await sleep(1100);

            const isModalHidden = await hasClass(page, '#vault-reveal-modal', 'hidden');
            assertFalse(isModalHidden, 'Modal should open for EDUARDO_');

            const title = await getElementText(page, '#vault-reveal-title');
            assertEqual(title, 'Protocolo Creador Eduardo VIP');

            await closeModalIfOpen(page);
        });

        await runTest('Parser 1.5: Garbage string "XYZ12345" triggers shake, error message & rejection', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            await page.type('#vault-code-p1', 'XYZ1');
            await page.type('#vault-code-p2', '2345');

            await safeClick(page, '#vault-submit-btn');

            // Immediately check for shake class and error message
            const hasShake = await hasClass(page, '#vault-card-container', 'vault-shake');
            assertTrue(hasShake, 'Card container must trigger .vault-shake animation on error');

            const statusText = await getElementText(page, '#vault-status-message');
            assertIncludes(statusText, 'Acceso denegado', 'Status message must indicate access denied');

            // Modal must NOT be open
            const isModalHidden = await hasClass(page, '#vault-reveal-modal', 'hidden');
            assertTrue(isModalHidden, 'Modal must remain hidden for invalid code');

            // Wait 1.6s for timeout reset
            await sleep(1600);
            const p1ValAfter = await getInputValue(page, '#vault-code-p1');
            const p2ValAfter = await getInputValue(page, '#vault-code-p2');
            assertEqual(p1ValAfter, '', 'P1 should be cleared after invalid attempt');
            assertEqual(p2ValAfter, '', 'P2 should be cleared after invalid attempt');
        });

        // -------------------------------------------------------------
        // SECTION 2: PASTE SIMULATION ON P1 WITH 7-CHAR AND 8-CHAR
        // -------------------------------------------------------------
        console.log('\n--- [Section 2] Clipboard Paste Simulation on P1 & P2 ---');

        await runTest('Paste 2.1: Paste 7-letter "EDUARDO" into P1 splits into EDUA and RDO', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            await simulatePaste(page, '#vault-code-p1', 'EDUARDO');

            const p1Val = await getInputValue(page, '#vault-code-p1');
            const p2Val = await getInputValue(page, '#vault-code-p2');
            assertEqual(p1Val, 'EDUA', 'P1 should receive first 4 chars');
            assertEqual(p2Val, 'RDO', 'P2 should receive remaining 3 chars');

            // Verify focus moved to P2
            const activeId = await page.evaluate(() => document.activeElement?.id);
            assertEqual(activeId, 'vault-code-p2', 'Focus should advance to P2 after pasting >4 chars');
        });

        await runTest('Paste 2.2: Paste 8-letter "APOLLO11" into P1 splits into APOL and LO11', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            await simulatePaste(page, '#vault-code-p1', 'APOLLO11');

            const p1Val = await getInputValue(page, '#vault-code-p1');
            const p2Val = await getInputValue(page, '#vault-code-p2');
            assertEqual(p1Val, 'APOL', 'P1 should receive APOL');
            assertEqual(p2Val, 'LO11', 'P2 should receive LO11');

            const activeId = await page.evaluate(() => document.activeElement?.id);
            assertEqual(activeId, 'vault-code-p2', 'Focus should advance to P2');
        });

        await runTest('Paste 2.3: Paste formatted string "06-06-2009" into P1 strips non-alphanumeric and splits', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            await simulatePaste(page, '#vault-code-p1', '06-06-2009');

            const p1Val = await getInputValue(page, '#vault-code-p1');
            const p2Val = await getInputValue(page, '#vault-code-p2');
            assertEqual(p1Val, '0606', 'P1 should be 0606');
            assertEqual(p2Val, '2009', 'P2 should be 2009');
        });

        await runTest('Paste 2.4: Paste into P2 when P1 is empty splits across both boxes', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            await simulatePaste(page, '#vault-code-p2', 'PINGUINO');

            const p1Val = await getInputValue(page, '#vault-code-p1');
            const p2Val = await getInputValue(page, '#vault-code-p2');
            assertEqual(p1Val, 'PING', 'P1 should receive PING');
            assertEqual(p2Val, 'UINO', 'P2 should receive UINO');
        });

        // -------------------------------------------------------------
        // SECTION 3: KEYBOARD NAVIGATION (AUTO-ADVANCE, BACKSPACE, ENTER)
        // -------------------------------------------------------------
        console.log('\n--- [Section 3] Keyboard Navigation & Focus Advancement ---');

        await runTest('Keyboard 3.1: Typing 4 characters in P1 automatically moves focus to P2', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            await page.focus('#vault-code-p1');
            await page.keyboard.type('ZE');
            let activeId = await page.evaluate(() => document.activeElement?.id);
            assertEqual(activeId, 'vault-code-p1', 'Focus should stay in P1 at 2 chars');

            await page.keyboard.type('NP');
            activeId = await page.evaluate(() => document.activeElement?.id);
            assertEqual(activeId, 'vault-code-p2', 'Focus should automatically jump to P2 at 4 chars');
        });

        await runTest('Keyboard 3.2: Backspace on empty P2 navigates focus back to P1', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            // Set P1 with 4 chars and focus P2 with empty value
            await page.evaluate(() => {
                const p1 = document.getElementById('vault-code-p1');
                const p2 = document.getElementById('vault-code-p2');
                p1.value = 'TEST';
                p2.value = '';
                p2.focus();
            });

            let activeId = await page.evaluate(() => document.activeElement?.id);
            assertEqual(activeId, 'vault-code-p2', 'P2 should initially have focus');

            // Press Backspace in empty P2
            await page.keyboard.press('Backspace');

            activeId = await page.evaluate(() => document.activeElement?.id);
            assertEqual(activeId, 'vault-code-p1', 'Backspace in empty P2 must navigate focus back to P1');
        });

        await runTest('Keyboard 3.3: Enter key navigation on P1 (< 4 chars triggers verify, 4 chars focuses P2)', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            // Test 1: Enter on P1 with 4 chars moves focus to P2
            await page.evaluate(() => {
                const p1 = document.getElementById('vault-code-p1');
                p1.value = 'COFF';
                p1.focus();
            });
            await page.keyboard.press('Enter');

            let activeId = await page.evaluate(() => document.activeElement?.id);
            assertEqual(activeId, 'vault-code-p2', 'Enter on full P1 should focus P2');

            // Test 2: Enter on P2 triggers code verification
            await page.evaluate(() => {
                document.getElementById('vault-code-p2').value = 'EE42';
            });
            await page.keyboard.press('Enter');
            await sleep(1100);

            const isModalHidden = await hasClass(page, '#vault-reveal-modal', 'hidden');
            assertFalse(isModalHidden, 'Enter key on P2 must trigger code verification and open modal');
            const title = await getElementText(page, '#vault-reveal-title');
            assertEqual(title, 'Modo Barista / Dark Roast');

            await closeModalIfOpen(page);
        });

        // -------------------------------------------------------------
        // SECTION 4: PADLOCK ANIMATION TIMING & CSS CLASSES
        // -------------------------------------------------------------
        console.log('\n--- [Section 4] Padlock Animation Timing & CSS Classes ---');

        await runTest('Padlock 4.1: Initial padlock state is 🔒 with .animate-pulse', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            const lockText = await page.evaluate(() => {
                const lock = document.querySelector('#vault-card-container .text-3xl');
                return lock ? lock.textContent.trim() : null;
            });
            assertEqual(lockText, '🔒', 'Initial lock icon must be 🔒');

            const hasPulse = await page.evaluate(() => {
                const lock = document.querySelector('#vault-card-container .text-3xl');
                return lock ? lock.classList.contains('animate-pulse') : false;
            });
            assertTrue(hasPulse, 'Initial lock must have animate-pulse class');
        });

        await runTest('Padlock 4.2: Transition to 🔓, .vault-lock-unlocking, and .vault-aura-burst within 200ms', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            await page.evaluate(() => {
                document.getElementById('vault-code-p1').value = 'MATR';
                document.getElementById('vault-code-p2').value = 'IX99';
            });

            // Click submit
            await safeClick(page, '#vault-submit-btn');

            // Inspect DOM after 150ms (during animation phase)
            await sleep(150);

            const intermediateState = await page.evaluate(() => {
                const card = document.getElementById('vault-card-container');
                const lock = card ? card.querySelector('.text-3xl') : null;
                const status = document.getElementById('vault-status-message');
                return {
                    lockIcon: lock ? lock.textContent.trim() : null,
                    isUnlocking: lock ? lock.classList.contains('vault-lock-unlocking') : false,
                    hasPulse: lock ? lock.classList.contains('animate-pulse') : true,
                    hasAuraBurst: card ? card.classList.contains('vault-aura-burst') : false,
                    statusText: status ? status.textContent : ''
                };
            });

            assertEqual(intermediateState.lockIcon, '🔓', 'Lock icon must immediately become 🔓');
            assertTrue(intermediateState.isUnlocking, 'Lock must have .vault-lock-unlocking class during transition');
            assertFalse(intermediateState.hasPulse, 'Lock must remove .animate-pulse during transition');
            assertTrue(intermediateState.hasAuraBurst, 'Card container must have .vault-aura-burst class');
            assertIncludes(intermediateState.statusText, 'ACCESO CONCEDIDO', 'Status message must indicate access granted');

            // Wait until full 850ms completes
            await sleep(850);

            const completedState = await page.evaluate(() => {
                const card = document.getElementById('vault-card-container');
                const lock = card ? card.querySelector('.text-3xl') : null;
                return {
                    isUnlocking: lock ? lock.classList.contains('vault-lock-unlocking') : false,
                    isUnlocked: lock ? lock.classList.contains('vault-lock-unlocked') : false
                };
            });

            assertFalse(completedState.isUnlocking, '.vault-lock-unlocking should be removed after 850ms');
            assertTrue(completedState.isUnlocked, '.vault-lock-unlocked should be present after 850ms');

            await closeModalIfOpen(page);
        });

        // -------------------------------------------------------------
        // SECTION 5: REVEAL MODAL EMERGE & DISMISSAL MECHANISMS
        // -------------------------------------------------------------
        console.log('\n--- [Section 5] Reveal Modal Emerge & 4-Way Dismissal ---');

        await runTest('Modal 5.1: Modal emerge contains cascade classes and correct typography', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            await page.evaluate(() => {
                document.getElementById('vault-code-p1').value = '0606';
                document.getElementById('vault-code-p2').value = '2009';
                document.getElementById('vault-submit-btn').click();
            });
            await sleep(1100);

            // Check modal structure
            const modalCheck = await page.evaluate(() => {
                const modal = document.getElementById('vault-reveal-modal');
                const dialog = modal ? modal.querySelector('.modal-dialog') : null;
                const cascade1 = modal ? modal.querySelector('.vault-cascade-1') : null;
                const cascade2 = modal ? modal.querySelector('.vault-cascade-2') : null;
                const cascade3 = modal ? modal.querySelector('.vault-cascade-3') : null;
                const cascade4 = modal ? modal.querySelector('.vault-cascade-4') : null;
                const phrase = document.getElementById('vault-reveal-phrase')?.textContent || '';
                return {
                    isFlex: modal ? modal.classList.contains('flex') : false,
                    hasWindowPop: dialog ? dialog.classList.contains('vault-window-pop') : false,
                    hasCascade1: !!cascade1,
                    hasCascade2: !!cascade2,
                    hasCascade3: !!cascade3,
                    hasCascade4: !!cascade4,
                    phraseText: phrase
                };
            });

            assertTrue(modalCheck.isFlex, 'Modal must have .flex when open');
            assertTrue(modalCheck.hasWindowPop, 'Modal dialog must have .vault-window-pop');
            assertTrue(modalCheck.hasCascade1, 'Must have .vault-cascade-1');
            assertTrue(modalCheck.hasCascade2, 'Must have .vault-cascade-2');
            assertTrue(modalCheck.hasCascade3, 'Must have .vault-cascade-3');
            assertTrue(modalCheck.hasCascade4, 'Must have .vault-cascade-4');
            assertEqual(modalCheck.phraseText, 'Tu eres alguien especial por conocer esta fecha...', '06062009 commemorative phrase exact match');
        });

        await runTest('Modal 5.2: Dismissal via Close Button (#close-vault-reveal-modal)', async () => {
            // Modal is open from 5.1
            await safeClick(page, '#close-vault-reveal-modal');
            await sleep(150);

            const isHidden = await hasClass(page, '#vault-reveal-modal', 'hidden');
            assertTrue(isHidden, 'Modal must close on #close-vault-reveal-modal click');
        });

        await runTest('Modal 5.3: Dismissal via Dismiss Button (#vault-reveal-dismiss-btn)', async () => {
            // Reopen modal via inventory grid button for 06062009
            await page.evaluate(() => {
                const btn = document.querySelector('[data-vault-toggle="06062009"]');
                if (btn) btn.click();
            });
            await sleep(150);
            let isHidden = await hasClass(page, '#vault-reveal-modal', 'hidden');
            assertFalse(isHidden, 'Modal should be open again');

            // Click dismiss button
            await safeClick(page, '#vault-reveal-dismiss-btn');
            await sleep(150);

            isHidden = await hasClass(page, '#vault-reveal-modal', 'hidden');
            assertTrue(isHidden, 'Modal must close on #vault-reveal-dismiss-btn click');
        });

        await runTest('Modal 5.4: Dismissal via Backdrop Click (#vault-reveal-backdrop)', async () => {
            await page.evaluate(() => {
                const btn = document.querySelector('[data-vault-toggle="06062009"]');
                if (btn) btn.click();
            });
            await sleep(150);

            // Click backdrop
            await page.evaluate(() => {
                document.getElementById('vault-reveal-backdrop').click();
            });
            await sleep(150);

            const isHidden = await hasClass(page, '#vault-reveal-modal', 'hidden');
            assertTrue(isHidden, 'Modal must close on #vault-reveal-backdrop click');
        });

        await runTest('Modal 5.5: Dismissal via Escape Key', async () => {
            await page.evaluate(() => {
                const btn = document.querySelector('[data-vault-toggle="06062009"]');
                if (btn) btn.click();
            });
            await sleep(150);

            // Press Escape key
            await page.keyboard.press('Escape');
            await sleep(150);

            const isHidden = await hasClass(page, '#vault-reveal-modal', 'hidden');
            assertTrue(isHidden, 'Modal must close on Escape key');
        });

        // -------------------------------------------------------------
        // SECTION 6: INVENTORY GRID, THEME TOGGLES & APOLLO ROCKETS
        // -------------------------------------------------------------
        console.log('\n--- [Section 6] Inventory Grid, Theme Switchboard & Apollo Badges ---');

        await runTest('Catalog 6.1: Unlock APOLLO11 and verify rocket badges on FAB action button', async () => {
            await navigateToVault(page);
            await clearVaultInputs(page);

            await page.evaluate(() => {
                document.getElementById('vault-code-p1').value = 'APOL';
                document.getElementById('vault-code-p2').value = 'LO11';
                document.getElementById('vault-submit-btn').click();
            });
            await sleep(1100);

            // Click action button to activate Apollo Theme and rockets
            await safeClick(page, '#vault-reveal-action-btn');
            await sleep(200);

            // Verify theme class added to root
            const hasApolloTheme = await hasClass(page, 'html', 'theme-apollo');
            assertTrue(hasApolloTheme, 'html element must have .theme-apollo class');

            // Verify rocket badge appears on bottom-main-action-btn
            const hasRocketBadge = await page.evaluate(() => {
                const fab = document.getElementById('bottom-main-action-btn');
                return !!fab?.querySelector('.apollo-rocket-badge');
            });
            assertTrue(hasRocketBadge, 'FAB action button must have .apollo-rocket-badge affixed');

            // Verify rocket setting in storage
            const rocketsEnabled = await page.evaluate(() => window.StorageModule.getApolloRocketsEnabled());
            assertTrue(rocketsEnabled, 'Storage must have apollo rockets enabled');
        });

        await runTest('Catalog 6.2: Theme switchboard mutual exclusion (swapping themes)', async () => {
            // Unlocked so far: EDUARDO, MATRIX99, COFFEE42, 06062009, APOLLO11
            // Active theme is apollo. Click toggle on EDUARDO in inventory grid
            await page.evaluate(() => {
                const eduBtn = document.querySelector('[data-vault-toggle="EDUARDO"]');
                if (eduBtn) eduBtn.click();
            });
            await sleep(150);

            // html should now have theme-eduardo-gold, NOT theme-apollo
            const hasEduardoTheme = await hasClass(page, 'html', 'theme-eduardo-gold');
            const hasApolloTheme = await hasClass(page, 'html', 'theme-apollo');
            assertTrue(hasEduardoTheme, 'html must now have theme-eduardo-gold');
            assertFalse(hasApolloTheme, 'html must NOT have theme-apollo (mutual exclusion)');

            // Active special theme in storage should be eduardo-gold
            const activeTheme = await page.evaluate(() => window.StorageModule.getActiveSpecialTheme());
            assertEqual(activeTheme, 'eduardo-gold', 'Active special theme must be eduardo-gold');

            // Deactivate eduardo-gold by clicking again
            await page.evaluate(() => {
                const eduBtn = document.querySelector('[data-vault-toggle="EDUARDO"]');
                if (eduBtn) eduBtn.click();
            });
            await sleep(150);

            const hasEduardoAfterDeact = await hasClass(page, 'html', 'theme-eduardo-gold');
            assertFalse(hasEduardoAfterDeact, 'Theme should be deactivated');
            const themeAfterDeact = await page.evaluate(() => window.StorageModule.getActiveSpecialTheme());
            assertEqual(themeAfterDeact, 'default', 'Active theme should revert to default');
        });

        await runTest('Catalog 6.3: Unlocked counter accurately reflects count', async () => {
            const counterText = await getElementText(page, '#vault-unlocked-counter');
            const unlockedCodes = await page.evaluate(() => window.StorageModule.getUnlockedCodes());
            assertEqual(counterText, `${unlockedCodes.length} / 11`, 'Counter format mismatch');
        });

        // -------------------------------------------------------------
        // SECTION 7: STORAGE PERSISTENCE ACROSS RELOAD & EXPORT/IMPORT
        // -------------------------------------------------------------
        console.log('\n--- [Section 7] Storage Persistence & Export/Import Fidelity ---');

        await runTest('Persistence 7.1: Active theme and unlocked codes persist across page reload', async () => {
            // Activate Matrix99 theme first
            await page.evaluate(() => {
                const matrixBtn = document.querySelector('[data-vault-toggle="MATRIX99"]');
                if (matrixBtn) matrixBtn.click();
            });
            await sleep(150);

            let hasMatrix = await hasClass(page, 'html', 'theme-matrix');
            assertTrue(hasMatrix, 'html must have theme-matrix before reload');

            // Reload page
            await page.reload({ waitUntil: 'load' });
            await sleep(300);

            // Verify theme re-applied automatically from storage on startup
            hasMatrix = await hasClass(page, 'html', 'theme-matrix');
            assertTrue(hasMatrix, 'html must retain theme-matrix after page reload');

            // Verify unlocked codes still present
            const unlockedAfterReload = await page.evaluate(() => window.StorageModule.getUnlockedCodes());
            assertTrue(unlockedAfterReload.length >= 4, 'Unlocked codes must persist across reload');
            assertIncludes(unlockedAfterReload, 'EDUARDO', 'EDUARDO must persist');
            assertIncludes(unlockedAfterReload, 'APOLLO11', 'APOLLO11 must persist');
        });

        await runTest('Persistence 7.2: Storage.exportJson() and Storage.importJson() roundtrip fidelity', async () => {
            const exportedJson = await page.evaluate(() => window.StorageModule.exportJson());
            const parsed = JSON.parse(exportedJson);

            assertTrue(Array.isArray(parsed.unlockedCodes), 'Exported JSON must include unlockedCodes array');
            assertIncludes(parsed.unlockedCodes, 'APOLLO11', 'Exported codes must include APOLLO11');
            assertIncludes(parsed.unlockedCodes, 'EDUARDO', 'Exported codes must include EDUARDO');
            assertEqual(parsed.activeSpecialTheme, 'matrix', 'Exported JSON must preserve activeSpecialTheme');

            // Clear storage
            await page.evaluate(() => localStorage.clear());

            // Import back
            const importResult = await page.evaluate((json) => window.StorageModule.importJson(json), exportedJson);
            assertTrue(importResult.success, 'importJson must succeed');

            // Verify restored state
            const restoredCodes = await page.evaluate(() => window.StorageModule.getUnlockedCodes());
            assertEqual(restoredCodes.length, parsed.unlockedCodes.length, 'Restored codes count mismatch');
            const restoredTheme = await page.evaluate(() => window.StorageModule.getActiveSpecialTheme());
            assertEqual(restoredTheme, 'matrix', 'Restored special theme mismatch');
        });

        // -------------------------------------------------------------
        // SUMMARY
        // -------------------------------------------------------------
        console.log('\n========================================================================');
        console.log(`🏁 TEST RESULTS: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
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

runAdversarialSuite().catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
});
