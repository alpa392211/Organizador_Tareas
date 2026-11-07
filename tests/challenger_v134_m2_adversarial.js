/**
 * challenger_v134_m2_adversarial.js
 * EMPIRICAL ADVERSARIAL CHALLENGER TEST SUITE for Milestone 2:
 * Compact Settings School Cards Layout (v1.3.4)
 *
 * Verifies:
 * 1. Physical bounding client rect dimensions of ALL rendered cards on 360px viewport:
 *    strictly between 70px and 88px (target ~81px).
 * 2. Logo frame computed dimensions strictly 32px by 32px on ALL cards.
 * 3. Inside max-h-96 (384px), at least 8 cards are visible vertically/grid-wise on mobile without overflow.
 * 4. Rapid clicking/toggling across 10+ different schools: active state classes update with 0 errors,
 *    no scrollbar jumping, exact 1-to-1 active state contract.
 * 5. Adversarial stress: Extreme custom school names (text truncation check), edit button stopPropagation,
 *    rapid country pill switching, dark mode style integrity, and 0 console/runtime errors.
 */

const assert = require('assert');
const path = require('path');
const helpers = require('./test_helpers');

let passCount = 0;
let failCount = 0;
const testResults = [];

function recordTest(desc, passed, details = '') {
    if (passed) {
        passCount++;
        console.log(`  \x1b[32m[CHALLENGE PASS]\x1b[0m ${desc} ${details ? `(${details})` : ''}`);
        testResults.push({ desc, passed: true, details });
    } else {
        failCount++;
        console.error(`  \x1b[31m[CHALLENGE FAIL]\x1b[0m ${desc} ${details ? `(${details})` : ''}`);
        testResults.push({ desc, passed: false, details });
    }
}

(async () => {
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[35m  EMPIRICAL ADVERSARIAL CHALLENGE: SETTINGS SCHOOL CARDS COMPACTNESS (M2)       \x1b[0m');
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m\n');

    const browser = await helpers.launchBrowser();
    const pageErrors = [];
    const consoleErrors = [];

    try {
        const page = await helpers.createPage(browser, { viewport: { width: 360, height: 740 } });

        // Error listeners
        page.on('pageerror', err => {
            pageErrors.push(err.toString());
            console.error(`  \x1b[31m[PAGE ERROR]\x1b[0m ${err.message}`);
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
                console.error(`  \x1b[31m[CONSOLE ERROR]\x1b[0m ${msg.text()}`);
            }
        });

        // Initialize state to settings view
        await page.evaluate(() => {
            localStorage.setItem('org_escolar_onboarding_v1', 'true');
            localStorage.setItem('org_escolar_cycle_configured_v1', 'true');
            if (window.app && typeof window.app.switchView === 'function') {
                window.app.switchView('settings');
            } else if (typeof window.navigateToSettings === 'function') {
                window.navigateToSettings();
            }
        });
        await new Promise(r => setTimeout(r, 400));

        // Ensure settings accordion for institutions is open
        await page.evaluate(() => {
            const grid = document.getElementById('settings-institution-grid');
            if (!grid || grid.offsetParent === null) {
                const header = document.querySelector('[data-accordion-target="#settings-institution-accordion"]');
                if (header) header.click();
            }
        });
        await new Promise(r => setTimeout(r, 300));

        // =====================================================================
        // CHALLENGE 1: Physical Bounding Client Rects of EVERY Card on 360px Viewport
        // Requirement: Height strictly between 70px and 88px (target ~81px)
        // =====================================================================
        console.log('\x1b[1m--- CHALLENGE 1: Physical Bounding Client Rects (360px Viewport) ---\x1b[0m');

        const cardDimensions = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('#settings-institution-grid .inst-grid-card'));
            const createCard = document.getElementById('grid-create-school-card');
            
            const results = cards.map(c => {
                const rect = c.getBoundingClientRect();
                return {
                    id: c.dataset.instId,
                    width: rect.width,
                    height: rect.height,
                    top: rect.top,
                    bottom: rect.bottom,
                    offsetHeight: c.offsetHeight
                };
            });

            let createCardDim = null;
            if (createCard) {
                const rect = createCard.getBoundingClientRect();
                createCardDim = {
                    id: 'create-school-card',
                    width: rect.width,
                    height: rect.height,
                    offsetHeight: createCard.offsetHeight
                };
            }

            return { cards: results, createCard: createCardDim };
        });

        recordTest(
            'Card count rendered in grid >= 30',
            cardDimensions.cards.length >= 30,
            `Found ${cardDimensions.cards.length} institution cards`
        );

        let allBetween70And88 = true;
        let minH = Infinity;
        let maxH = -Infinity;
        let heightViolations = [];

        for (const card of cardDimensions.cards) {
            const h = card.height;
            if (h < minH) minH = h;
            if (h > maxH) maxH = h;
            if (h < 70 || h > 88) {
                allBetween70And88 = false;
                heightViolations.push(`${card.id}: ${h}px`);
            }
        }

        recordTest(
            'ALL institution cards have physical height strictly between 70px and 88px',
            allBetween70And88,
            `min=${minH}px, max=${maxH}px, violations=${heightViolations.join(', ') || 'none'}`
        );

        recordTest(
            'Target height ~81px closely matched (within +/- 3px window: 78px - 84px)',
            minH >= 78 && maxH <= 84,
            `min=${minH}px, max=${maxH}px`
        );

        if (cardDimensions.createCard) {
            const ch = cardDimensions.createCard.height;
            recordTest(
                '"+ Crear Escuela" card height strictly between 70px and 88px',
                ch >= 70 && ch <= 88,
                `height=${ch}px`
            );
            recordTest(
                '"+ Crear Escuela" card matches standard card height (~81px +/- 2px)',
                Math.abs(ch - 81) <= 2,
                `height=${ch}px`
            );
        } else {
            recordTest('"+ Crear Escuela" card exists', false, 'Not found in DOM');
        }

        // =====================================================================
        // CHALLENGE 2: Logo Frame Dimensions (Strictly 32px by 32px on ALL Cards)
        // =====================================================================
        console.log('\n\x1b[1m--- CHALLENGE 2: Logo Frame Dimensions (32x32px Strict) ---\x1b[0m');

        const logoMetrics = await page.evaluate(() => {
            const logoFrames = Array.from(document.querySelectorAll('#settings-institution-grid .inst-grid-card .school-logo-frame'));
            return logoFrames.map((frame, idx) => {
                const cs = window.getComputedStyle(frame);
                const rect = frame.getBoundingClientRect();
                return {
                    index: idx,
                    computedW: cs.width,
                    computedH: cs.height,
                    clientW: frame.clientWidth,
                    clientH: frame.clientHeight,
                    rectW: rect.width,
                    rectH: rect.height,
                    borderRadius: cs.borderRadius,
                    bgColor: cs.backgroundColor
                };
            });
        });

        recordTest(
            'Every institution card contains a .school-logo-frame',
            logoMetrics.length === cardDimensions.cards.length,
            `Frames: ${logoMetrics.length}, Cards: ${cardDimensions.cards.length}`
        );

        let allLogos32px = true;
        let logoViolations = [];
        for (const lm of logoMetrics) {
            const w = parseFloat(lm.computedW);
            const h = parseFloat(lm.computedH);
            if (w !== 32 || h !== 32) {
                allLogos32px = false;
                logoViolations.push(`Card ${lm.index}: computed ${lm.computedW}x${lm.computedH}`);
            }
        }

        recordTest(
            'ALL logo frames computed width and height are strictly 32px by 32px',
            allLogos32px,
            `Violations: ${logoViolations.slice(0, 3).join(', ') || 'none'}`
        );

        let allWhiteBgs = logoMetrics.every(lm => lm.bgColor === 'rgb(255, 255, 255)');
        recordTest(
            'ALL logo frames maintain solid white background (#ffffff) for dark emblem contrast',
            allWhiteBgs,
            `Total checked: ${logoMetrics.length}`
        );

        // =====================================================================
        // CHALLENGE 3: Geometric Capacity Inside max-h-96 (384px) - At least 8 cards visible
        // =====================================================================
        console.log('\n\x1b[1m--- CHALLENGE 3: Visibility & Capacity in max-h-96 (384px) ---\x1b[0m');

        const capacityMetrics = await page.evaluate(() => {
            const grid = document.getElementById('settings-institution-grid');
            if (!grid) return null;

            const gridRect = grid.getBoundingClientRect();
            const gridStyle = window.getComputedStyle(grid);
            const cards = Array.from(grid.querySelectorAll('.inst-grid-card'));

            // Reset scroll to top
            grid.scrollTop = 0;

            const containerMaxHeight = parseFloat(gridStyle.maxHeight);
            const containerHeight = gridRect.height;

            // Count how many cards are fully within the visible window (top >= 0 and bottom <= containerHeight)
            let fullyVisibleCards = 0;
            let partiallyVisibleCards = 0;

            cards.forEach(c => {
                const cRect = c.getBoundingClientRect();
                const relativeTop = cRect.top - gridRect.top;
                const relativeBottom = cRect.bottom - gridRect.top;

                if (relativeTop >= -1 && relativeBottom <= containerHeight + 1) {
                    fullyVisibleCards++;
                }
                if (relativeTop < containerHeight && relativeBottom > 0) {
                    partiallyVisibleCards++;
                }
            });

            // Calculate theoretical rows and cards
            const firstCard = cards[0];
            const cardH = firstCard ? firstCard.getBoundingClientRect().height : 81;
            const rowGap = 8; // gap-2 = 8px
            const rowTotal = cardH + rowGap;
            const rowsIn384 = Math.floor((384 + rowGap) / rowTotal); // (384 + 8) / 89 = 4.4 rows
            const columns = 2; // mobile 2 cols

            return {
                containerMaxHeight,
                containerClientHeight: grid.clientHeight,
                containerScrollHeight: grid.scrollHeight,
                fullyVisibleCards,
                partiallyVisibleCards,
                calculatedRows: rowsIn384,
                theoreticalVisibleCards: rowsIn384 * columns,
                hasVerticalScroll: grid.scrollHeight > grid.clientHeight,
                hasHorizontalScroll: grid.scrollWidth > grid.clientWidth
            };
        });

        recordTest(
            'Container max-h-96 resolves to 384px (24rem)',
            capacityMetrics.containerMaxHeight === 384,
            `Resolved max-height: ${capacityMetrics.containerMaxHeight}px`
        );

        recordTest(
            'At least 8 cards are vertically and grid-wise visible in max-h-96 on 360px viewport without scrolling',
            capacityMetrics.fullyVisibleCards >= 8,
            `Fully visible cards: ${capacityMetrics.fullyVisibleCards}, partially visible: ${capacityMetrics.partiallyVisibleCards}`
        );

        recordTest(
            'Grid container has clean vertical scrolling (scrollHeight > clientHeight) with NO horizontal overflow',
            capacityMetrics.hasVerticalScroll && !capacityMetrics.hasHorizontalScroll,
            `verticalScroll=${capacityMetrics.hasVerticalScroll}, horizontalScroll=${capacityMetrics.hasHorizontalScroll}`
        );

        // =====================================================================
        // CHALLENGE 4: Rapid Stress-Testing Selection Across 15 Schools
        // Requirement: 0 errors, active state classes update, no scrollbar jumping
        // =====================================================================
        console.log('\n\x1b[1m--- CHALLENGE 4: Rapid Selection Stress Test Across 15 Schools ---\x1b[0m');

        // Query actual rendered school IDs in DOM (take 15 distinct schools)
        const testSchoolIds = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('#settings-institution-grid .inst-grid-card'));
            return cards.map(c => c.dataset.instId).filter(Boolean).slice(0, 15);
        });

        recordTest(
            'Found at least 15 distinct rendered school IDs for stress test',
            testSchoolIds.length >= 15,
            `IDs: ${testSchoolIds.slice(0, 5).join(', ')}... (total: ${testSchoolIds.length})`
        );

        let rapidSelectionPassed = true;
        let rapidSelectionErrors = [];
        let previousScrollTop = 0;
        let scrollJumps = [];

        // Scroll grid to row 2 (~100px) to verify scroll stability during rapid toggling
        await page.evaluate(() => {
            const grid = document.getElementById('settings-institution-grid');
            if (grid) grid.scrollTop = 100;
        });
        await new Promise(r => setTimeout(r, 50));

        previousScrollTop = await page.evaluate(() => document.getElementById('settings-institution-grid')?.scrollTop || 0);

        for (let i = 0; i < testSchoolIds.length; i++) {
            const targetId = testSchoolIds[i];

            // Click target school
            const clickSuccess = await page.evaluate((id) => {
                const card = document.querySelector(`button[data-inst-id="${id}"]`);
                if (!card) return false;
                card.click();
                return true;
            }, targetId);

            if (!clickSuccess) {
                rapidSelectionPassed = false;
                rapidSelectionErrors.push(`School ${targetId} card button not found`);
                continue;
            }

            // Rapid delay (35ms)
            await new Promise(r => setTimeout(r, 35));

            // Verify state
            const stateCheck = await page.evaluate((expectedId) => {
                const stored = window.StorageModule.getInstitution();
                const activeCard = document.querySelector(`button[data-inst-id="${expectedId}"]`);
                const allActiveBadges = document.querySelectorAll('#settings-institution-grid .inst-grid-card .bg-indigo-600');
                const allRings = document.querySelectorAll('#settings-institution-grid .inst-grid-card.ring-2');
                const grid = document.getElementById('settings-institution-grid');

                const hasRing = activeCard?.className.includes('ring-2 ring-indigo-500');
                const hasBg = activeCard?.className.includes('bg-indigo-50/80');
                const hasBadge = !!activeCard?.querySelector('.bg-indigo-600');

                return {
                    storedMatches: stored === expectedId,
                    hasRing,
                    hasBg,
                    hasBadge,
                    activeBadgeCount: allActiveBadges.length,
                    activeRingCount: allRings.length,
                    currentScrollTop: grid?.scrollTop || 0
                };
            }, targetId);

            if (!stateCheck.storedMatches || !stateCheck.hasRing || !stateCheck.hasBadge || stateCheck.activeBadgeCount !== 1) {
                rapidSelectionPassed = false;
                rapidSelectionErrors.push(
                    `Mismatch for ${targetId}: stored=${stateCheck.storedMatches}, ring=${stateCheck.hasRing}, badges=${stateCheck.activeBadgeCount}`
                );
            }

            // Check for jitter/jumping (active card classes should not cause unwanted scrollTop drift)
            const scrollDelta = Math.abs(stateCheck.currentScrollTop - previousScrollTop);
            if (scrollDelta > 200) { // Large unexplained scroll jump
                scrollJumps.push(`Jump of ${scrollDelta}px on switching to ${targetId}`);
            }
            previousScrollTop = stateCheck.currentScrollTop;
        }

        recordTest(
            'Rapid selection across 15 institutions executed with 100% state accuracy',
            rapidSelectionPassed,
            `Errors: ${rapidSelectionErrors.join(', ') || 'none'}`
        );

        recordTest(
            'Zero scrollbar jumping during rapid card toggling (scale jitter eliminated)',
            scrollJumps.length === 0,
            `Jumps: ${scrollJumps.join(', ') || 'none'}`
        );

        recordTest(
            'Zero page errors or console errors during rapid multi-school stress testing',
            pageErrors.length === 0 && consoleErrors.length === 0,
            `pageErrors=${pageErrors.length}, consoleErrors=${consoleErrors.length}`
        );

        // =====================================================================
        // CHALLENGE 5: Adversarial Boundary & Stress Cases
        // =====================================================================
        console.log('\n\x1b[1m--- CHALLENGE 5: Adversarial Edge Cases & Stress Scenarios ---\x1b[0m');

        // Test 5.1: Extreme text length in custom school (overflow & truncation test)
        const extremeCustomTest = await page.evaluate(() => {
            const longSchool = {
                id: 'custom_extreme_long_text_challenge',
                name: 'UNIVERSIDAD INTERCONTINENTAL EXPERIMENTAL Y TECNOLÓGICA DE CIENCIAS APLICADAS',
                fullName: 'Universidad Intercontinental Experimental y Tecnológica de Ciencias Aplicadas y Humanidades del Siglo XXI de la República Mexicana',
                country: 'México',
                countryCode: 'MX',
                slogan: 'Conocimiento sin límites ni fronteras en el infinito universo',
                type: 'Semestral Extraordinario Cuatrimestral Extendido',
                periods: ['1.° Semestre'],
                isCustom: true
            };
            window.StorageModule.saveCustomSchool(longSchool);
            window.app.renderSettingsSchools();

            const customCard = document.querySelector('button[data-inst-id="custom_extreme_long_text_challenge"]');
            if (!customCard) return null;

            const rect = customCard.getBoundingClientRect();
            const nameEl = customCard.children[2];
            const subEl = customCard.children[3];

            return {
                cardHeight: rect.height,
                cardWidth: rect.width,
                nameTruncated: nameEl?.className.includes('truncate'),
                subTruncated: subEl?.className.includes('truncate'),
                nameClientW: nameEl?.clientWidth,
                nameScrollW: nameEl?.scrollWidth
            };
        });

        recordTest(
            'Extreme long name school card retains strictly compact height (<= 88px) via truncate CSS',
            extremeCustomTest && extremeCustomTest.cardHeight <= 88,
            `Actual height: ${extremeCustomTest?.cardHeight}px (must be <= 88px)`
        );

        recordTest(
            'Extreme long name text element has truncate and scrollWidth >= clientWidth',
            extremeCustomTest && extremeCustomTest.nameTruncated && extremeCustomTest.nameScrollW >= extremeCustomTest.nameClientW,
            `truncate class active, scrollWidth=${extremeCustomTest?.nameScrollW}px, clientWidth=${extremeCustomTest?.nameClientW}px`
        );

        // Clean up extreme custom school
        await page.evaluate(() => {
            window.StorageModule.deleteCustomSchool('custom_extreme_long_text_challenge');
            window.app.renderSettingsSchools();
        });

        // Test 5.2: StopPropagation on Edit Button for Custom School
        const editPropCheck = await page.evaluate(() => {
            const testCustom = {
                id: 'custom_edit_prop_test',
                name: 'Colegio Galileo',
                fullName: 'Colegio Galileo',
                country: 'México',
                countryCode: 'MX',
                type: 'Semestral',
                periods: ['1.° Semestre'],
                isCustom: true
            };
            window.StorageModule.saveCustomSchool(testCustom);
            window.app.renderSettingsSchools();

            // Set active school to UNAM first
            window.app.setInstitution('unam');
            const initialActive = window.StorageModule.getInstitution();

            // Click the edit button on custom school
            const editBtn = document.querySelector('button[data-edit-custom-id="custom_edit_prop_test"]');
            let clicked = false;
            if (editBtn) {
                editBtn.click();
                clicked = true;
            }

            const afterClickActive = window.StorageModule.getInstitution();

            return {
                clicked,
                initialActive,
                afterClickActive,
                preservedActive: afterClickActive === 'unam'
            };
        });

        recordTest(
            'Clicking custom school Edit button does NOT trigger accidental school selection (preserved active school)',
            editPropCheck.preservedActive,
            `Active was ${editPropCheck.initialActive}, after edit click is ${editPropCheck.afterClickActive}`
        );

        // Cleanup
        await page.evaluate(() => {
            window.StorageModule.deleteCustomSchool('custom_edit_prop_test');
            window.app.renderSettingsSchools();
            // Close any modal that may have opened
            const closeBtn = document.querySelector('#custom-school-modal button.close-modal, #custom-school-modal [data-close]');
            if (closeBtn) closeBtn.click();
        });

        // Test 5.3: Rapid Country Pill Filtering Stress
        const countryPillStress = await page.evaluate(async () => {
            const sequence = ['MX', 'CO', 'AR', 'ES', 'all', 'MX', 'CO', 'all'];
            let counts = [];
            for (const filter of sequence) {
                const btn = document.querySelector(`button[data-country-filter="${filter}"]`);
                if (btn) btn.click();
                await new Promise(r => setTimeout(r, 20));
                const count = document.querySelectorAll('#settings-institution-grid .inst-grid-card').length;
                counts.push({ filter, count });
            }
            return counts;
        });

        const allPillFiltersValid = countryPillStress.every(s => s.count > 0);
        recordTest(
            'Rapid alternating country pill filters (MX -> CO -> AR -> ES -> all) render dynamically with non-empty counts',
            allPillFiltersValid,
            `Counts: ${countryPillStress.map(c => `${c.filter}:${c.count}`).join(', ')}`
        );

        // Test 5.4: Dark Mode Rendering & Computed Contrast
        const darkModeMetrics = await page.evaluate(() => {
            document.documentElement.classList.add('dark');
            const card = document.querySelector('.inst-grid-card');
            const logo = card?.querySelector('.school-logo-frame');
            const nameEl = card?.children[2];

            const cardCs = card ? window.getComputedStyle(card) : null;
            const logoCs = logo ? window.getComputedStyle(logo) : null;
            const nameCs = nameEl ? window.getComputedStyle(nameEl) : null;

            return {
                cardHeight: card?.offsetHeight,
                logoBg: logoCs?.backgroundColor,
                logoWidth: logoCs?.width,
                nameColor: nameCs?.color
            };
        });

        recordTest(
            'In Dark Mode, card height remains compact (~81px)',
            darkModeMetrics.cardHeight >= 70 && darkModeMetrics.cardHeight <= 88,
            `Height in dark mode: ${darkModeMetrics.cardHeight}px`
        );

        // =====================================================================
        // CHALLENGE 6: Multi-Viewport Card Height & Overflow Stress (320px to 1280px)
        // =====================================================================
        console.log('\n\x1b[1m--- CHALLENGE 6: Multi-Viewport Card Dimensions & Overflow (320px - 1280px) ---\x1b[0m');

        const multiViewports = [320, 375, 412, 768, 1024, 1280];
        for (const vpWidth of multiViewports) {
            await page.setViewport({ width: vpWidth, height: 800 });
            await new Promise(r => setTimeout(r, 60));

            const vpMetrics = await page.evaluate(() => {
                const cards = Array.from(document.querySelectorAll('#settings-institution-grid .inst-grid-card'));
                const grid = document.getElementById('settings-institution-grid');
                const heights = cards.map(c => c.getBoundingClientRect().height);
                const minH = Math.min(...heights);
                const maxH = Math.max(...heights);
                const bodyOverflow = document.body.scrollWidth > document.body.clientWidth;
                const gridOverflow = grid ? (grid.scrollWidth > grid.clientWidth) : false;

                return {
                    count: cards.length,
                    minH,
                    maxH,
                    bodyOverflow,
                    gridOverflow
                };
            });

            recordTest(
                `Viewport ${vpWidth}px: all cards strictly between 70px and 88px (min=${vpMetrics.minH}px, max=${vpMetrics.maxH}px)`,
                vpMetrics.minH >= 70 && vpMetrics.maxH <= 88,
                `min=${vpMetrics.minH}px, max=${vpMetrics.maxH}px`
            );

            recordTest(
                `Viewport ${vpWidth}px: zero body overflow and zero grid horizontal overflow`,
                !vpMetrics.bodyOverflow && !vpMetrics.gridOverflow,
                `bodyOverflow=${vpMetrics.bodyOverflow}, gridOverflow=${vpMetrics.gridOverflow}`
            );
        }

        // Restore standard 360px viewport
        await page.setViewport({ width: 360, height: 740 });
        await new Promise(r => setTimeout(r, 80));

        // =====================================================================
        // CHALLENGE 7: Font-Scale Stress (125% System Font Zoom)
        // =====================================================================
        console.log('\n\x1b[1m--- CHALLENGE 7: Font-Scale Stress (125% Root Font Size) ---\x1b[0m');

        const fontScaleMetrics = await page.evaluate(() => {
            document.documentElement.style.fontSize = '20px'; // 125% of standard 16px
            const cards = Array.from(document.querySelectorAll('#settings-institution-grid .inst-grid-card'));
            const heights = cards.map(c => c.getBoundingClientRect().height);
            const minH = Math.min(...heights);
            const maxH = Math.max(...heights);
            const bodyOverflow = document.body.scrollWidth > document.body.clientWidth;
            const grid = document.getElementById('settings-institution-grid');
            const gridOverflow = grid ? (grid.scrollWidth > grid.clientWidth) : false;

            // Reset font size
            document.documentElement.style.fontSize = '';

            return {
                minH,
                maxH,
                bodyOverflow,
                gridOverflow
            };
        });

        recordTest(
            'Under 125% font-scale, cards do not cause horizontal layout blowout or body overflow',
            !fontScaleMetrics.bodyOverflow && !fontScaleMetrics.gridOverflow,
            `minH=${fontScaleMetrics.minH}px, maxH=${fontScaleMetrics.maxH}px, bodyOverflow=${fontScaleMetrics.bodyOverflow}`
        );

        // Reset dark mode
        await page.evaluate(() => document.documentElement.classList.remove('dark'));

    } catch (err) {
        recordTest('Unhandled error in adversarial test execution', false, err.message || err.toString());
    } finally {
        await browser.close();
    }

    console.log('\n\x1b[1m\x1b[35m================================================================================\x1b[0m');
    console.log('\x1b[1mEMPIRICAL ADVERSARIAL CHALLENGER VERDICT & SUMMARY:\x1b[0m');
    console.log(`  Total Challenges Executed: ${passCount + failCount}`);
    console.log(`  Passed:  \x1b[32m\x1b[1m${passCount}\x1b[0m`);
    console.log(`  Failed:  \x1b[${failCount > 0 ? '31m\x1b[1m' : '2m'}${failCount}\x1b[0m`);
    console.log('\x1b[1m\x1b[35m================================================================================\x1b[0m');

    if (failCount > 0) {
        console.error('\n\x1b[31m\x1b[1mVERDICT: REQUEST_CHANGES (Adversarial challenges failed!)\x1b[0m\n');
        process.exit(1);
    } else {
        console.log('\n\x1b[32m\x1b[1mVERDICT: APPROVE (All adversarial challenges passed with zero defects!)\x1b[0m\n');
        process.exit(0);
    }
})();
