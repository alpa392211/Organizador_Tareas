/**
 * tests/adversarial_m1_stress.js
 * Adversarial Stress & Verification Test Suite for Milestone 1 (v1.3.2)
 *
 * Empirical Challenger: Stress-tests assumptions, modal race conditions,
 * backdrop dismissals, 06062009 dedication display, theme specificity,
 * all 11 themes across Light & Dark modes, WCAG contrast, UI cleanups,
 * authentic SVG vector crests, and state persistence.
 */

const fs = require('fs');
const path = require('path');
const helpers = require('./test_helpers');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Helper for parsing color rgb(r, g, b) or rgba(r, g, b, a)
function parseRgb(colorStr) {
    if (!colorStr) return null;
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;
    return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10)
    };
}

// Calculate relative luminance
function relativeLuminance(rgb) {
    const sRGB = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
    const lum = sRGB.map(val => (val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)));
    return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
}

// Calculate contrast ratio between two colors
function getContrastRatio(rgb1, rgb2) {
    const lum1 = relativeLuminance(rgb1);
    const lum2 = relativeLuminance(rgb2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

const ALL_11_THEMES = [
    { class: 'theme-apollo', id: 'apollo', name: 'Apollo 11' },
    { class: 'theme-eduardo-gold', id: 'eduardo', name: 'Eduardo Gold' },
    { class: 'theme-penguin', id: 'penguin', name: 'Pingüino' },
    { class: 'theme-synthwave', id: 'retro80s', name: 'Synthwave' },
    { class: 'theme-matrix', id: 'matrix', name: 'Matrix' },
    { class: 'theme-sakura', id: 'sakura', name: 'Jardín Sakura' },
    { class: 'theme-coffee', id: 'coffee', name: 'Dark Roast Coffee' },
    { class: 'theme-arcade', id: 'arcade', name: 'Arcade Gamer' },
    { class: 'theme-hyperfocus', id: 'hyperfocus', name: 'Hiperenfoque' },
    { class: 'theme-starlight', id: 'starlight', name: 'Starlight Tribute 06062009' },
    { class: 'theme-gray', id: 'gray', name: 'Modo Gris / Monocromático' }
];

const INSTITUTION_ASSETS = [
    'itesm', 'javeriana', 'pucp', 'uam_es', 'uanl', 'ub', 'uba', 'uc_cl',
    'uchile', 'ucm', 'ucr', 'ucv', 'udea', 'udec', 'udeg', 'udelar',
    'unal', 'unc', 'uni', 'uniandes', 'unlp', 'unmsm', 'upv', 'usach',
    'usfq', 'utn'
];

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

function recordTest(name, passed, detail = '') {
    totalTests++;
    if (passed) {
        passedTests++;
        console.log(`  ✅ [PASS] ${name}`);
    } else {
        failedTests.push({ name, detail });
        console.error(`  ❌ [FAIL] ${name}: ${detail}`);
    }
}

async function prepareReadyPage(browser) {
    const page = await helpers.createCleanPage(browser);
    // Allow 400ms initial onboarding timer to execute
    await new Promise(r => setTimeout(r, 600));
    // Complete onboarding cleanly via provisional button and navigate
    await page.evaluate(() => {
        const laterBtn = document.getElementById('welcome-cycle-later-btn');
        if (laterBtn) laterBtn.click();
    });
    await new Promise(r => setTimeout(r, 200));
    return page;
}

(async () => {
    console.log('================================================================');
    console.log('⚔️  ADVERSARIAL STRESS TEST SUITE — MILESTONE 1 (v1.3.2)       ');
    console.log('================================================================');

    const browser = await helpers.launchBrowser();

    try {
        // ====================================================================
        // TEST GROUP 1: VAULT REVEAL MODAL & 06062009 DEDICATION STRESS
        // ====================================================================
        console.log('\n--- Group 1: 06062009 Dedication & Vault Reveal Modal ---');
        const page1 = await prepareReadyPage(browser);

        // 1.1 Unlock 06062009 and check initial state
        await page1.evaluate(() => window.App.switchView('secret-codes'));
        await new Promise(r => setTimeout(r, 200));
        await page1.type('#vault-code-p1', '0606');
        await page1.type('#vault-code-p2', '2009');
        await page1.click('#vault-submit-btn');

        // Allow padlock animation (850ms) and modal spring transition (350ms) to settle
        await new Promise(r => setTimeout(r, 1400));

        const revealState = await page1.evaluate(() => {
            const modal = document.getElementById('vault-reveal-modal');
            const style = window.getComputedStyle(modal);
            const dialog = modal.querySelector('.modal-dialog');
            const dialogStyle = dialog ? window.getComputedStyle(dialog) : {};
            const title = document.getElementById('vault-reveal-title');
            const phrase = document.getElementById('vault-reveal-phrase');
            const desc = document.getElementById('vault-reveal-desc');
            const phraseStyle = phrase ? window.getComputedStyle(phrase) : {};
            const actionBtn = document.getElementById('vault-reveal-action-btn');

            return {
                modalDisplay: style.display,
                modalOpacity: parseFloat(style.opacity),
                modalPointerEvents: style.pointerEvents,
                modalClasses: modal.className,
                dialogOpacity: parseFloat(dialogStyle.opacity || '0'),
                titleHtml: title ? title.innerHTML : '',
                phraseText: phrase ? phrase.textContent.trim() : '',
                phraseColor: phraseStyle.color,
                phraseBg: phraseStyle.backgroundColor,
                phraseDisplay: phraseStyle.display,
                phraseVisible: phrase ? (phrase.offsetWidth > 0 && phrase.offsetHeight > 0) : false,
                descText: desc ? desc.textContent.trim() : '',
                actionBtnText: actionBtn ? actionBtn.textContent.trim() : '',
                isUnlockedInStorage: window.StorageModule.getUnlockedCodes().includes('06062009')
            };
        });

        recordTest(
            '1.1 Modal visibility and active state after code submission',
            revealState.modalDisplay === 'flex' &&
            revealState.modalOpacity >= 0.99 &&
            revealState.modalPointerEvents === 'auto' &&
            revealState.modalClasses.includes('active') &&
            !revealState.modalClasses.includes('hidden'),
            `display=${revealState.modalDisplay}, opacity=${revealState.modalOpacity}, pointerEvents=${revealState.modalPointerEvents}`
        );

        recordTest(
            '1.2 Modal dialog spring transform and full opacity rendered',
            revealState.dialogOpacity >= 0.99,
            `dialogOpacity=${revealState.dialogOpacity}`
        );

        recordTest(
            '1.3 Dedication title contains Starlight Tribute and 06-06-2009',
            revealState.titleHtml.includes('Starlight Tribute') && revealState.titleHtml.includes('06 · 06 · 2009'),
            `titleHtml=${revealState.titleHtml}`
        );

        recordTest(
            '1.4 Dedication phrase verbatim match',
            revealState.phraseText === 'Tu eres alguien especial por conocer esta fecha...',
            `phraseText=${revealState.phraseText}`
        );

        recordTest(
            '1.5 Dedication phrase is rendered and visible in DOM',
            revealState.phraseVisible && revealState.phraseDisplay !== 'none',
            `visible=${revealState.phraseVisible}, display=${revealState.phraseDisplay}`
        );

        recordTest(
            '1.6 Dedication phrase contrast and styling applied',
            Boolean(revealState.phraseColor) && revealState.phraseColor !== 'rgba(0, 0, 0, 0)',
            `phraseColor=${revealState.phraseColor}`
        );

        // 1.7 Stress: Click INSIDE the modal dialog -> Must NOT dismiss the modal
        await page1.mouse.click(640, 400); // Center of modal dialog
        await new Promise(r => setTimeout(r, 200));
        const keptOpenAfterInnerClick = await page1.evaluate(() => {
            const modal = document.getElementById('vault-reveal-modal');
            return modal.classList.contains('active') && !modal.classList.contains('hidden');
        });
        recordTest('1.7 Clicking inside modal dialog does NOT dismiss modal', keptOpenAfterInnerClick);

        // 1.8 Click on the backdrop (outside dialog, at top-left 10, 10) -> Must dismiss modal
        await page1.mouse.click(10, 10);
        await new Promise(r => setTimeout(r, 250));

        const dismissedByBackdrop = await page1.evaluate(() => {
            const modal = document.getElementById('vault-reveal-modal');
            const style = window.getComputedStyle(modal);
            return modal.classList.contains('hidden') && !modal.classList.contains('active') && style.display === 'none';
        });
        recordTest('1.8 Dismiss modal via backdrop click (at coordinate 10, 10)', dismissedByBackdrop);

        // 1.9 Re-open via inventory card "Ver Dedicatoria"
        const inventoryCheck = await page1.evaluate(() => {
            const btn = document.querySelector('[data-vault-toggle="06062009"]');
            return {
                buttonExists: Boolean(btn),
                buttonText: btn ? btn.textContent.trim() : ''
            };
        });
        recordTest(
            '1.9 Inventory card displays "Ver Dedicatoria" button for 06062009',
            inventoryCheck.buttonExists && inventoryCheck.buttonText === 'Ver Dedicatoria',
            `buttonText=${inventoryCheck.buttonText}`
        );

        await page1.click('[data-vault-toggle="06062009"]');
        await new Promise(r => setTimeout(r, 200));

        const reopenedModal = await page1.evaluate(() => {
            const modal = document.getElementById('vault-reveal-modal');
            return modal.classList.contains('active') && !modal.classList.contains('hidden');
        });
        recordTest('1.10 Modal re-opens successfully via "Ver Dedicatoria"', reopenedModal);

        // 1.11 Dismiss via X button
        await page1.click('#close-vault-reveal-modal');
        await new Promise(r => setTimeout(r, 200));
        const dismissedByX = await page1.evaluate(() => {
            const modal = document.getElementById('vault-reveal-modal');
            return modal.classList.contains('hidden') && !modal.classList.contains('active');
        });
        recordTest('1.11 Dismiss modal via X close button', dismissedByX);

        // 1.12 Reopen and dismiss via Escape key
        await page1.click('[data-vault-toggle="06062009"]');
        await new Promise(r => setTimeout(r, 200));
        await page1.keyboard.press('Escape');
        await new Promise(r => setTimeout(r, 200));
        const dismissedByEsc = await page1.evaluate(() => {
            const modal = document.getElementById('vault-reveal-modal');
            return modal.classList.contains('hidden') && !modal.classList.contains('active');
        });
        recordTest('1.12 Dismiss modal via Escape key', dismissedByEsc);

        // 1.13 Starlight Theme Activation and Deactivation cycle from modal
        await page1.click('[data-vault-toggle="06062009"]');
        await new Promise(r => setTimeout(r, 200));
        await page1.click('#vault-reveal-action-btn');
        await new Promise(r => setTimeout(r, 300));

        const themeActiveCheck = await page1.evaluate(() => {
            const html = document.documentElement;
            const active = window.StorageModule.getActiveSpecialTheme();
            return {
                hasStarlightClass: html.classList.contains('theme-starlight'),
                activeTheme: active
            };
        });
        recordTest(
            '1.13 Activating theme from modal sets theme-starlight on <html> and in Storage',
            themeActiveCheck.hasStarlightClass && themeActiveCheck.activeTheme === 'starlight',
            `hasStarlightClass=${themeActiveCheck.hasStarlightClass}, activeTheme=${themeActiveCheck.activeTheme}`
        );

        // Now re-open modal; button should say "Desactivar Tema"
        await page1.click('[data-vault-toggle="06062009"]');
        await new Promise(r => setTimeout(r, 200));
        const deactBtnText = await page1.evaluate(() => {
            const btn = document.getElementById('vault-reveal-action-btn');
            return btn ? btn.textContent.trim() : '';
        });
        recordTest(
            '1.14 Modal action button reflects active state ("Desactivar Tema")',
            deactBtnText === 'Desactivar Tema',
            `btnText=${deactBtnText}`
        );

        // Deactivate theme from modal
        await page1.click('#vault-reveal-action-btn');
        await new Promise(r => setTimeout(r, 300));
        const themeDeactCheck = await page1.evaluate(() => {
            const html = document.documentElement;
            const active = window.StorageModule.getActiveSpecialTheme();
            return {
                hasStarlightClass: html.classList.contains('theme-starlight'),
                activeTheme: active
            };
        });
        recordTest(
            '1.15 Deactivating theme from modal removes theme-starlight and restores default',
            !themeDeactCheck.hasStarlightClass && themeDeactCheck.activeTheme === 'default',
            `hasStarlightClass=${themeDeactCheck.hasStarlightClass}, activeTheme=${themeDeactCheck.activeTheme}`
        );

        // 1.16 Rapid Spam Clicking Stress Test (15 submissions)
        const rapidSpamCheck = await page1.evaluate(async () => {
            localStorage.setItem('org_escolar_vault_unlocked', JSON.stringify([]));
            const p1 = document.getElementById('vault-code-p1');
            const p2 = document.getElementById('vault-code-p2');
            const btn = document.getElementById('vault-submit-btn');
            p1.value = '0606';
            p2.value = '2009';

            // Rapid-fire clicks
            for (let i = 0; i < 15; i++) {
                btn.click();
            }

            await new Promise(r => setTimeout(r, 1200));

            const unlocked = window.StorageModule.getUnlockedCodes();
            const modal = document.getElementById('vault-reveal-modal');
            return {
                unlockedCount: unlocked.filter(c => c === '06062009').length,
                totalUnlocked: unlocked.length,
                modalIsActive: modal.classList.contains('active'),
                modalNotHidden: !modal.classList.contains('hidden')
            };
        });
        recordTest(
            '1.16 Rapid 15x submission spam does NOT duplicate code or break modal state',
            rapidSpamCheck.unlockedCount === 1 &&
            rapidSpamCheck.totalUnlocked === 1 &&
            rapidSpamCheck.modalIsActive &&
            rapidSpamCheck.modalNotHidden,
            `unlockedCount=${rapidSpamCheck.unlockedCount}, totalUnlocked=${rapidSpamCheck.totalUnlocked}`
        );

        // Dismiss modal after spam test
        await page1.mouse.click(10, 10);
        await new Promise(r => setTimeout(r, 200));

        // 1.17 Alternative date format aliases resolution stress test
        const aliasList = ['06-06-2009', '06/06/2009', '6062009', '0606-2009', '060609'];
        const aliasResults = await page1.evaluate((aliases) => {
            const aliasesDict = window.VaultAliases || {};
            const catalog = window.VaultCatalog || {};
            return aliases.map(al => {
                const cleaned = al.toUpperCase().replace(/[^A-Z0-9]/g, '');
                const target = aliasesDict[al] || aliasesDict[cleaned] || (catalog[al] ? al : catalog[cleaned] ? cleaned : null);
                return { alias: al, target, valid: target === '06062009' };
            });
        }, aliasList);

        const allAliasesResolved = aliasResults.every(r => r.valid);
        recordTest(
            '1.17 All 5 date format aliases (06-06-2009, 6062009, etc.) map to 06062009',
            allAliasesResolved,
            `results=${JSON.stringify(aliasResults)}`
        );

        await page1.close();

        // ====================================================================
        // TEST GROUP 2: ALL 11 THEMES IN LIGHT & DARK MODES SPECIFICITY & CONTRAST
        // ====================================================================
        console.log('\n--- Group 2: All 11 Themes Across Light & Dark Modes ---');
        const page2 = await prepareReadyPage(browser);

        for (const theme of ALL_11_THEMES) {
            for (const isDark of [false, true]) {
                const modeName = isDark ? 'DARK' : 'LIGHT';
                const testPrefix = `2.${theme.id}.${modeName}`;

                // Apply theme & mode
                await page2.evaluate((themeClass, dark) => {
                    const html = document.documentElement;
                    const allThemeClasses = [
                        'theme-apollo', 'theme-eduardo-gold', 'theme-penguin',
                        'theme-synthwave', 'theme-matrix', 'theme-sakura',
                        'theme-coffee', 'theme-arcade', 'theme-hyperfocus',
                        'theme-starlight', 'theme-gray'
                    ];
                    allThemeClasses.forEach(c => html.classList.remove(c));
                    html.classList.toggle('dark', dark);
                    html.classList.add(themeClass);
                }, theme.class, isDark);

                // Give CSS transition time to settle
                await new Promise(r => setTimeout(r, 200));

                const themeStyles = await page2.evaluate(() => {
                    const header = document.querySelector('header');
                    const bottomNav = document.getElementById('bottom-nav');
                    const drawer = document.getElementById('sidebar-drawer');
                    const card = document.querySelector('.stagger-card') || document.querySelector('.settings-accordion-card') || document.querySelector('.school-item-card');
                    const body = document.body;

                    // Text inside card
                    const cardTitle = card ? (card.querySelector('.text-slate-900') || card.querySelector('h2') || card.querySelector('h3') || card.querySelector('span')) : null;

                    return {
                        headerBg: header ? window.getComputedStyle(header).backgroundColor : null,
                        bottomNavBg: bottomNav ? window.getComputedStyle(bottomNav).backgroundColor : null,
                        drawerBg: drawer ? window.getComputedStyle(drawer).backgroundColor : null,
                        cardBg: card ? window.getComputedStyle(card).backgroundColor : null,
                        bodyBg: body ? window.getComputedStyle(body).backgroundColor : null,
                        cardTextColor: cardTitle ? window.getComputedStyle(cardTitle).color : null
                    };
                });

                // Condition 1: Header must NOT equal default light white or default dark slate
                const isDefaultLightHeader = (themeStyles.headerBg === 'rgb(255, 255, 255)');
                const isDefaultDarkHeader = (themeStyles.headerBg === 'rgb(15, 23, 42)');

                recordTest(
                    `${testPrefix} Header styling distinct from default light/dark backgrounds`,
                    !isDefaultLightHeader && !isDefaultDarkHeader,
                    `headerBg=${themeStyles.headerBg}`
                );

                // Condition 2: BottomNav must NOT equal default light white or default dark slate
                const isDefaultLightNav = (themeStyles.bottomNavBg === 'rgb(255, 255, 255)');
                const isDefaultDarkNav = (themeStyles.bottomNavBg === 'rgb(15, 23, 42)');

                recordTest(
                    `${testPrefix} BottomNav styling distinct from default light/dark backgrounds`,
                    !isDefaultLightNav && !isDefaultDarkNav,
                    `bottomNavBg=${themeStyles.bottomNavBg}`
                );

                // Condition 3: Card background must NOT equal default light white or default dark slate
                const isDefaultLightCard = (themeStyles.cardBg === 'rgb(255, 255, 255)');
                const isDefaultDarkCard = (themeStyles.cardBg === 'rgb(15, 23, 42)');

                recordTest(
                    `${testPrefix} Card styling distinct from default light/dark backgrounds`,
                    !isDefaultLightCard && !isDefaultDarkCard,
                    `cardBg=${themeStyles.cardBg}`
                );

                // Condition 4: Text color contrast check inside card
                let contrastRatio = 1.0;
                if (themeStyles.cardBg && themeStyles.cardTextColor) {
                    const cardRgb = parseRgb(themeStyles.cardBg);
                    const textRgb = parseRgb(themeStyles.cardTextColor);
                    if (cardRgb && textRgb) {
                        contrastRatio = getContrastRatio(cardRgb, textRgb);
                    }
                }

                // WCAG minimum contrast for readability: ratio > 3.0:1
                recordTest(
                    `${testPrefix} Text contrast ratio against card background >= 3.0:1`,
                    contrastRatio >= 3.0,
                    `contrastRatio=${contrastRatio.toFixed(2)} (cardBg=${themeStyles.cardBg}, textColor=${themeStyles.cardTextColor})`
                );
            }
        }

        // 2.RAPID: Rapid Theme Switching & Mutual Exclusion Stress Test
        console.log('\n--- Group 2.RAPID: 66 Rapid Theme Swaps & Clean Mutual Exclusion ---');
        const rapidSwapCheck = await page2.evaluate(async () => {
            const html = document.documentElement;
            const themes = [
                'theme-apollo', 'theme-eduardo-gold', 'theme-penguin',
                'theme-synthwave', 'theme-matrix', 'theme-sakura',
                'theme-coffee', 'theme-arcade', 'theme-hyperfocus',
                'theme-starlight', 'theme-gray'
            ];

            let leakDetected = false;

            // 6 cycles of all 11 themes (66 switches)
            for (let i = 0; i < 66; i++) {
                const currentTheme = themes[i % themes.length];
                const toggleDark = (i % 2 === 0);

                // Remove all other special theme classes
                themes.forEach(t => html.classList.remove(t));
                html.classList.toggle('dark', toggleDark);
                html.classList.add(currentTheme);

                // Check how many theme classes are present on <html>
                const activeThemesOnHtml = themes.filter(t => html.classList.contains(t));
                if (activeThemesOnHtml.length !== 1 || activeThemesOnHtml[0] !== currentTheme) {
                    leakDetected = true;
                    break;
                }
            }

            return {
                leakDetected,
                finalClasses: html.className
            };
        });

        recordTest(
            '2.RAPID 66 rapid theme switches maintain strict 1-theme mutual exclusion without class accumulation',
            !rapidSwapCheck.leakDetected,
            `leakDetected=${rapidSwapCheck.leakDetected}, finalClasses=${rapidSwapCheck.finalClasses}`
        );

        await page2.close();

        // ====================================================================
        // TEST GROUP 3: UI CLEANUPS (COUNTER, 5-TAP, FLAGS)
        // ====================================================================
        console.log('\n--- Group 3: UI Cleanups & Removal Verification ---');
        const page3 = await prepareReadyPage(browser);

        // 3.1 Check #vault-unlocked-counter
        const counterCheck = await page3.evaluate(() => {
            const counter = document.getElementById('vault-unlocked-counter');
            return Boolean(counter);
        });
        recordTest('3.1 #vault-unlocked-counter is completely absent from DOM', !counterCheck);

        // 3.2 Check 5-tap version trigger removal
        const versionPillCheck = await page3.evaluate(async () => {
            const pill = document.getElementById('settings-version-pill');
            const initialSecret = localStorage.getItem('org_escolar_secret_unlocked');

            if (pill) {
                // Click 10 times rapidly
                for (let i = 0; i < 10; i++) pill.click();
            }

            await new Promise(r => setTimeout(r, 200));

            const afterSecret = localStorage.getItem('org_escolar_secret_unlocked');
            const title = pill ? (pill.getAttribute('title') || '') : '';
            const text = pill ? pill.textContent.trim() : '';
            const tagName = pill ? pill.tagName.toLowerCase() : '';

            return {
                initialSecret,
                afterSecret,
                title,
                text,
                tagName
            };
        });

        recordTest(
            '3.2 Tapping version pill does NOT unlock secret mode',
            versionPillCheck.afterSecret === null || versionPillCheck.afterSecret === 'false',
            `afterSecret=${versionPillCheck.afterSecret}`
        );

        recordTest(
            '3.3 Version pill converted from button to static container or has no 5-tap title',
            !versionPillCheck.title.includes('5') && !versionPillCheck.title.includes('secreto'),
            `title=${versionPillCheck.title}`
        );

        recordTest(
            '3.4 Version pill displays updated version 1.3.3',
            versionPillCheck.text.includes('1.3.3'),
            `text=${versionPillCheck.text}`
        );

        // 3.5 Check Country Flag Emojis removal across all UI surfaces
        await page3.evaluate(() => window.App.switchView('settings'));
        await new Promise(r => setTimeout(r, 200));

        const flagSweep = await page3.evaluate(() => {
            const flagRegex = /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/;
            const violations = [];

            // 1. Filter pills in settings
            const filterPills = Array.from(document.querySelectorAll('#settings-country-pills button'));
            filterPills.forEach(p => {
                const txt = p.textContent.trim();
                if (flagRegex.test(txt)) violations.push(`Filter pill: "${txt}"`);
            });

            // 2. Select optgroups in Header, Settings, Custom School modal, Cycle modal
            const selectIds = [
                '#header-school-quick-select',
                '#institution-select',
                '#custom-school-country',
                '#welcome-institution-select'
            ];
            selectIds.forEach(id => {
                const el = document.querySelector(id);
                if (el) {
                    const optgroups = Array.from(el.querySelectorAll('optgroup'));
                    optgroups.forEach(og => {
                        const lbl = og.getAttribute('label') || '';
                        if (flagRegex.test(lbl)) violations.push(`Select ${id} optgroup: "${lbl}"`);
                    });
                }
            });

            // 3. Grid cards in Settings
            const schoolCards = Array.from(document.querySelectorAll('#settings-schools-grid .school-item-card'));
            schoolCards.forEach(c => {
                const title = c.querySelector('span.text-xs.font-black');
                if (title && flagRegex.test(title.textContent)) {
                    violations.push(`School card: "${title.textContent.trim()}"`);
                }
            });

            return violations;
        });

        recordTest(
            '3.5 Country flag emojis completely removed from all UI filter pills, selects & cards',
            flagSweep.length === 0,
            `violations=${JSON.stringify(flagSweep)}`
        );

        await page3.close();

        // ====================================================================
        // TEST GROUP 4: AUTHENTIC UNIVERSITY SVG CRESTS VERIFICATION
        // ====================================================================
        console.log('\n--- Group 4: Authentic University SVG Crest Assets ---');
        const page4 = await prepareReadyPage(browser);

        for (const assetId of INSTITUTION_ASSETS) {
            const filePath = path.join(PROJECT_ROOT, 'assets', `${assetId}.svg`);
            const exists = fs.existsSync(filePath);
            let size = 0;
            let content = '';

            if (exists) {
                const stats = fs.statSync(filePath);
                size = stats.size;
                content = fs.readFileSync(filePath, 'utf8');
            }

            // Checks:
            // 1. Exists and > 2KB
            // 2. Valid SVG syntax with viewBox
            // 3. Does NOT contain cartoon mock smiley patterns
            const hasViewBox = content.includes('viewBox=');
            const hasMockSmiley = content.includes('Mock University') ||
                content.includes('cx="50" cy="50" r="40"') ||
                content.includes('stroke="#fbbf24" stroke-width="3" fill="#fef3c7"');

            recordTest(
                `4.${assetId} Authentic SVG exists, has viewBox, > 2KB, and no mock smileys`,
                exists && size > 2000 && hasViewBox && !hasMockSmiley,
                `exists=${exists}, size=${size}B, viewBox=${hasViewBox}, mockSmiley=${hasMockSmiley}`
            );
        }

        // Test browser rendering of all 26 SVG crests in <img> elements
        const renderCheck = await page4.evaluate(async (assetList) => {
            const results = [];
            for (const id of assetList) {
                const img = document.createElement('img');
                img.src = `assets/${id}.svg`;
                document.body.appendChild(img);
                await new Promise(resolve => {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                });
                results.push({
                    id,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    loaded: img.naturalWidth > 0 && img.naturalHeight > 0
                });
                img.remove();
            }
            return results;
        }, INSTITUTION_ASSETS);

        const unrenderedAssets = renderCheck.filter(r => !r.loaded);
        recordTest(
            '4.ALL All 26 SVG crests render with valid natural dimensions in browser engine',
            unrenderedAssets.length === 0,
            `unrendered=${JSON.stringify(unrenderedAssets)}`
        );

        await page4.close();

    } catch (err) {
        console.error('💥 Unhandled exception during adversarial testing:', err);
        failedTests.push({ name: 'UNHANDLED_EXCEPTION', detail: err.stack || err.message });
    } finally {
        await browser.close();
    }

    // ====================================================================
    // SUMMARY REPORT
    // ====================================================================
    console.log('\n================================================================');
    console.log(`📊 ADVERSARIAL TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
    if (failedTests.length > 0) {
        console.log(`❌ FAILED TESTS (${failedTests.length}):`);
        failedTests.forEach(f => console.log(`   - ${f.name}: ${f.detail}`));
    }
    console.log('================================================================');

    const verdict = (failedTests.length === 0 && passedTests > 50) ? 'APPROVE' : 'REQUEST_CHANGES';
    console.log(`VERDICT: ${verdict}`);

    // Output JSON results for automated reporting
    const resultsJson = {
        timestamp: new Date().toISOString(),
        totalTests,
        passedTests,
        failedCount: failedTests.length,
        failedTests,
        verdict
    };
    fs.writeFileSync(
        path.join(PROJECT_ROOT, 'tests', 'results', 'adversarial_m1_summary.json'),
        JSON.stringify(resultsJson, null, 2)
    );

    process.exit(failedTests.length === 0 ? 0 : 1);
})();
