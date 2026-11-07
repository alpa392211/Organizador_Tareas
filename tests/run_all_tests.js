#!/usr/bin/env node
/**
 * run_all_tests.js - Master E2E Test Runner for Organizador_Tareas v1.3.1 Pingüino
 * Offline headless test harness running Chrome over file://
 *
 * Usage:
 *   node tests/run_all_tests.js
 *   node tests/run_all_tests.js --tier=1
 *   node tests/run_all_tests.js --tier=2
 *   node tests/run_all_tests.js --tier=3
 *   node tests/run_all_tests.js --tier=4
 *   node tests/run_all_tests.js --filter="F01"
 *   npm test
 */

const fs = require('fs');
const path = require('path');
const helpers = require('./test_helpers');

// Load test tier modules
const tier1Module = require('./tier1_feature_coverage');
const tier2Module = require('./tier2_boundary_corner');
const tier3Module = require('./tier3_cross_feature');
const tier4Module = require('./tier4_real_world');

// ANSI Color Formatting
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        tier: null,
        filter: null,
        bail: false,
        verbose: false
    };

    for (const arg of args) {
        if (arg.startsWith('--tier=')) {
            const val = parseInt(arg.split('=')[1], 10);
            if ([1, 2, 3, 4].includes(val)) {
                options.tier = val;
            } else {
                console.warn(`${colors.yellow}Warning: Unknown tier "${val}". Running all tiers.${colors.reset}`);
            }
        } else if (arg.startsWith('--filter=')) {
            options.filter = arg.split('=')[1];
        } else if (arg === '--bail') {
            options.bail = true;
        } else if (arg === '--verbose') {
            options.verbose = true;
        }
    }
    return options;
}

async function main() {
    const startTime = Date.now();
    const options = parseArgs();

    console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}  Organizador_Tareas v1.3.2 - End-to-End Headless Test Suite           ${colors.reset}`);
    console.log(`${colors.cyan}========================================================================${colors.reset}`);
    console.log(`${colors.dim}Target:  ${helpers.TARGET_URL}${colors.reset}`);
    console.log(`${colors.dim}Binary:  ${helpers.CHROME_PATH}${colors.reset}`);
    if (options.tier) console.log(`${colors.yellow}Filter:  Tier ${options.tier} only${colors.reset}`);
    if (options.filter) console.log(`${colors.yellow}Filter:  Pattern "${options.filter}"${colors.reset}`);
    console.log('');

    const tierModules = [];
    if (!options.tier || options.tier === 1) tierModules.push(tier1Module);
    if (!options.tier || options.tier === 2) tierModules.push(tier2Module);
    if (!options.tier || options.tier === 3) tierModules.push(tier3Module);
    if (!options.tier || options.tier === 4) tierModules.push(tier4Module);

    let browser;
    let page;

    const summary = {
        timestamp: new Date().toISOString(),
        version: '1.3.2',
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        durationMs: 0,
        tiers: {},
        results: []
    };

    try {
        browser = await helpers.launchBrowser();
        page = await helpers.createCleanPage(browser);

        for (const tierMod of tierModules) {
            const tierNum = tierMod.tier;
            const tierName = tierMod.name;
            console.log(`${colors.bold}${colors.magenta}--- [Tier ${tierNum}] ${tierName} ---${colors.reset}`);

            summary.tiers[`tier${tierNum}`] = {
                name: tierName,
                total: 0,
                passed: 0,
                failed: 0
            };

            const filterRegex = options.filter ? new RegExp(options.filter, 'i') : null;

            for (const test of tierMod.tests) {
                // Apply regex filter if provided
                if (filterRegex && !filterRegex.test(test.id) && !filterRegex.test(test.name)) {
                    summary.skipped++;
                    continue;
                }

                summary.total++;
                summary.tiers[`tier${tierNum}`].total++;

                // Reset page state before each test
                try {
                    await page.evaluate(() => {
                        localStorage.clear();
                        sessionStorage.clear();
                        document.documentElement.className = '';
                    });
                } catch (_) {}

                const testStart = Date.now();
                let status = 'PASS';
                let errorMessage = null;

                try {
                    await test.run(page, helpers);
                    summary.passed++;
                    summary.tiers[`tier${tierNum}`].passed++;
                } catch (err) {
                    status = 'FAIL';
                    errorMessage = err.message || String(err);
                    summary.failed++;
                    summary.tiers[`tier${tierNum}`].failed++;
                }

                const testDuration = Date.now() - testStart;
                const statusFormatted = status === 'PASS'
                    ? `${colors.green}[PASS]${colors.reset}`
                    : `${colors.red}[FAIL]${colors.reset}`;

                console.log(`  ${statusFormatted} ${colors.bold}${test.id}${colors.reset} - ${test.name} ${colors.dim}(${testDuration}ms)${colors.reset}`);

                if (status === 'FAIL') {
                    console.log(`         ${colors.red}Error: ${errorMessage}${colors.reset}`);
                }

                summary.results.push({
                    tier: tierNum,
                    id: test.id,
                    name: test.name,
                    feature: test.feature || null,
                    status,
                    durationMs: testDuration,
                    error: errorMessage
                });

                if (status === 'FAIL' && options.bail) {
                    console.log(`${colors.red}Bailing out after first test failure...${colors.reset}`);
                    break;
                }
            }
            console.log('');
        }
    } catch (unhandledErr) {
        console.error(`${colors.bold}${colors.red}Fatal test harness exception:${colors.reset}`, unhandledErr);
        summary.failed++;
    } finally {
        if (page) {
            try { await page.close(); } catch (_) {}
        }
        if (browser) {
            try { await browser.close(); } catch (_) {}
        }
    }

    summary.durationMs = Date.now() - startTime;

    // Ensure results directory exists
    const resultsDir = path.join(helpers.PROJECT_ROOT, 'tests', 'results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Write structured JSON summary report
    const summaryPath = path.join(resultsDir, 'test_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

    // Final Banner Summary
    console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
    console.log(`${colors.bold}Test Execution Summary:${colors.reset}`);
    console.log(`  Total:    ${colors.bold}${summary.total}${colors.reset}`);
    console.log(`  Passed:   ${colors.green}${summary.passed}${colors.reset}`);
    console.log(`  Failed:   ${summary.failed > 0 ? colors.red : colors.dim}${summary.failed}${colors.reset}`);
    if (summary.skipped > 0) {
        console.log(`  Skipped:  ${colors.yellow}${summary.skipped}${colors.reset}`);
    }
    console.log(`  Duration: ${(summary.durationMs / 1000).toFixed(2)}s`);
    console.log(`  Report:   ${summaryPath}`);
    console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);

    if (summary.failed > 0) {
        console.log(`${colors.red}${colors.bold}RESULT: FAILED (${summary.failed} tests failed)${colors.reset}`);
        process.exit(1);
    } else {
        console.log(`${colors.green}${colors.bold}RESULT: SUCCESS (All ${summary.passed} tests passed)${colors.reset}`);
        process.exit(0);
    }
}

main();
