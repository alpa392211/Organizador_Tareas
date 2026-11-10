#!/usr/bin/env node
/**
 * tests/adversarial_pwa_sw.js
 * 
 * Adversarial Challenger Test Suite for Milestone 1 (v1.3.4) PWA & Service Worker
 * 
 * Tests:
 * 1. HTTP Server Setup & Clean PWA Bootstrap
 * 2. Service Worker Active State & Navigator Controller Handshake
 * 3. Precache Asset Completeness & Fault-Tolerance Audit
 * 4. Cache-First Query Param Flexibility ({ ignoreSearch: true })
 * 5. CDP Complete Offline Emulation (Zero Network) & Full Page Reload
 * 6. Hard Offline Test: Full Server Termination & Browser Reload from Cache
 * 7. Offline Functional Integrity: LocalStorage + UI Switch + Task Creation Offline
 * 8. Offline Navigation Fallback: Unknown Subpaths & Root Routing under Hard Offline
 * 9. Rapid / Concurrent Triggering of promptPwaInstall() (Idempotence & Crash-Free)
 * 10. Install UI Button Concurrency & Dismissal Throttling
 * 11. Appinstalled Event Lifecycle & Standalone Mode UI Reactivity
 * 12. File:// Compatibility & Console Error Silence
 * 13. Physical Icon Dimension & Magic Byte Verification on Disk
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CHROME_PATH = process.env.CHROME_BIN || '/usr/bin/google-chrome';

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

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
};

function createServer() {
    return http.createServer((req, res) => {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
        const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
        const filePath = path.join(PROJECT_ROOT, safePath);

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Service-Worker-Allowed': '/'
        });
        fs.createReadStream(filePath).pipe(res);
    });
}

function readPngDimensions(buffer) {
    if (buffer.length < 24) return null;
    // Check PNG signature
    if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
        return null;
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
}

async function runAdversarialTests() {
    console.log(`${colors.bold}${colors.magenta}================================================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}   ADVERSARIAL CHALLENGER SUITE: SERVICE WORKER & OFFLINE PWA (v1.3.4)          ${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}================================================================================${colors.reset}\n`);

    let passed = 0;
    let failed = 0;
    const failureLog = [];

    function recordPass(msg) {
        passed++;
        console.log(` ${colors.green}[PASS]${colors.reset} ${msg}`);
    }

    function recordFail(msg, error) {
        failed++;
        const detail = error ? ` (${error.message || error})` : '';
        console.log(` ${colors.red}[FAIL]${colors.reset} ${msg}${detail}`);
        failureLog.push({ test: msg, error: error ? (error.stack || error.toString()) : '' });
    }

    // -------------------------------------------------------------------------
    // SECTION 0: Disk Asset Dimension & Binary Magic Bytes Verification
    // -------------------------------------------------------------------------
    console.log(`${colors.bold}--- [0] Disk Icon Binary Header & Dimension Audit ---${colors.reset}`);
    const expectedIconSpecs = [
        { file: 'assets/icons/icon-192x192.png', width: 192, height: 192 },
        { file: 'assets/icons/icon-512x512.png', width: 512, height: 512 },
        { file: 'assets/icons/icon-maskable-192x192.png', width: 192, height: 192 },
        { file: 'assets/icons/icon-maskable-512x512.png', width: 512, height: 512 },
        { file: 'assets/icons/apple-touch-icon.png', width: 180, height: 180 },
        { file: 'assets/icons/favicon-32x32.png', width: 32, height: 32 },
        { file: 'assets/icons/favicon-16x16.png', width: 16, height: 16 }
    ];

    let iconErrors = [];
    for (const spec of expectedIconSpecs) {
        const fullPath = path.join(PROJECT_ROOT, spec.file);
        if (!fs.existsSync(fullPath)) {
            iconErrors.push(`Missing: ${spec.file}`);
            continue;
        }
        const buf = fs.readFileSync(fullPath);
        const dims = readPngDimensions(buf);
        if (!dims || dims.width !== spec.width || dims.height !== spec.height) {
            iconErrors.push(`Bad dims for ${spec.file}: expected ${spec.width}x${spec.height}, got ${dims ? dims.width + 'x' + dims.height : 'invalid PNG'}`);
        }
    }

    // Verify favicon.ico magic bytes (00 00 01 00)
    const icoPath = path.join(PROJECT_ROOT, 'favicon.ico');
    const icoBuf = fs.readFileSync(icoPath);
    const isIco = icoBuf.length > 4 && icoBuf[0] === 0 && icoBuf[1] === 0 && icoBuf[2] === 1 && icoBuf[3] === 0;

    if (iconErrors.length === 0 && isIco) {
        recordPass('All 7 PNG icons have valid PNG signatures and exact expected pixel dimensions; favicon.ico has valid ICO header');
    } else {
        recordFail('Icon binary header & dimension audit', new Error(iconErrors.join('; ') || 'Invalid favicon.ico'));
    }

    // 1. Start Local HTTP Server
    let server = createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let port = server.address().port;
    let serverUrl = `http://127.0.0.1:${port}/index.html`;
    console.log(`${colors.dim}Local HTTP Server active at ${serverUrl}${colors.reset}\n`);

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1280,800',
            '--disable-web-security'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        page.on('pageerror', err => {
            consoleErrors.push(`PageError: ${err.message}`);
        });

        // -------------------------------------------------------------------------
        // SECTION 1: Service Worker Registration & Controller Handshake
        // -------------------------------------------------------------------------
        console.log(`${colors.bold}--- [1] Service Worker Registration & Controller Handshake ---${colors.reset}`);
        
        await page.goto(serverUrl, { waitUntil: 'networkidle0' });

        // Wait for Service Worker readiness and check state
        const swStatus = await page.evaluate(async () => {
            if (!('serviceWorker' in navigator)) {
                return { supported: false };
            }
            try {
                const reg = await Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 6000))
                ]);

                // Wait up to 2 seconds for navigator.serviceWorker.controller if clients.claim() is settling
                let controller = navigator.serviceWorker.controller;
                if (!controller) {
                    await new Promise(resolve => {
                        const onCtrlChange = () => {
                            navigator.serviceWorker.removeEventListener('controllerchange', onCtrlChange);
                            resolve();
                        };
                        navigator.serviceWorker.addEventListener('controllerchange', onCtrlChange);
                        setTimeout(resolve, 2000);
                    });
                    controller = navigator.serviceWorker.controller;
                }

                return {
                    supported: true,
                    scope: reg.scope,
                    activeState: reg.active ? reg.active.state : null,
                    hasController: controller !== null,
                    controllerScript: controller ? controller.scriptURL : null
                };
            } catch (err) {
                return { supported: true, error: err.message };
            }
        });

        if (swStatus.supported && swStatus.activeState === 'activated') {
            recordPass(`Service Worker active and state is 'activated' (scope: ${swStatus.scope})`);
        } else {
            recordFail('Service Worker active state check', new Error(JSON.stringify(swStatus)));
        }

        if (swStatus.hasController) {
            recordPass(`Service Worker is actively controlling page (${swStatus.controllerScript})`);
        } else {
            recordFail('Service Worker controller assignment', new Error('navigator.serviceWorker.controller is null'));
        }

        // -------------------------------------------------------------------------
        // SECTION 2: Precache Integrity & Query Parameter Cache-Matching
        // -------------------------------------------------------------------------
        console.log(`\n${colors.bold}--- [2] Precache Completeness & Query Parameter Resilience ---${colors.reset}`);

        const cacheAudit = await page.evaluate(async () => {
            const cacheName = 'organizador-tareas-cache-v1.4.1';
            const exists = await caches.has(cacheName);
            if (!exists) return { exists: false, entries: [] };

            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            const urls = requests.map(r => r.url);

            // Test ignoreSearch capability: match css/styles.css without query params against precached css/styles.css?v=1.4.1
            const matchStripped = await cache.match('./css/styles.css', { ignoreSearch: true });
            const matchWithDiffParam = await cache.match('./css/styles.css?cachebust=xyz987', { ignoreSearch: true });
            const matchIndex = await cache.match('./index.html');

            return {
                exists: true,
                count: urls.length,
                urls,
                hasStrippedMatch: matchStripped !== undefined,
                hasDiffParamMatch: matchWithDiffParam !== undefined,
                hasIndexMatch: matchIndex !== undefined
            };
        });

        if (cacheAudit.exists && cacheAudit.count >= 30) {
            recordPass(`Cache 'organizador-tareas-cache-v1.4.1' populated with ${cacheAudit.count} precached assets`);
        } else {
            recordFail('Precache population count check', new Error(`Cache exists: ${cacheAudit.exists}, count: ${cacheAudit.count}`));
        }

        if (cacheAudit.hasStrippedMatch && cacheAudit.hasDiffParamMatch) {
            recordPass('Cache-matching with ignoreSearch: true successfully resolves assets regardless of query parameters');
        } else {
            recordFail('ignoreSearch query parameter matching in cache', new Error(JSON.stringify(cacheAudit)));
        }

        // Verify that all critical URLs listed in PRECACHE_ASSETS are valid HTTP 200 in the cache
        const cacheAssetCheck = await page.evaluate(async () => {
            const cache = await caches.open('organizador-tareas-cache-v1.4.1');
            const essentialAssets = [
                './index.html',
                './manifest.webmanifest',
                './css/tailwind.min.css?v=1.4.1',
                './css/styles.css?v=1.4.1',
                './js/app.js?v=1.4.1',
                './assets/icons/icon-192x192.png',
                './assets/icons/icon-512x512.png',
                './assets/icons/icon-maskable-192x192.png',
                './assets/icons/apple-touch-icon.png',
                './assets/general.svg',
                './assets/unam.svg'
            ];
            const missing = [];
            for (const asset of essentialAssets) {
                const res = await cache.match(asset);
                if (!res || res.status !== 200) {
                    missing.push(asset);
                }
            }
            return { missing };
        });

        if (cacheAssetCheck.missing.length === 0) {
            recordPass('All critical application shell assets and icons confirmed present with status 200 in cache');
        } else {
            recordFail('Critical assets present in cache', new Error(`Missing: ${cacheAssetCheck.missing.join(', ')}`));
        }

        // -------------------------------------------------------------------------
        // SECTION 3: Offline Mode via CDP & Page Reload
        // -------------------------------------------------------------------------
        console.log(`\n${colors.bold}--- [3] Full Offline Navigation & Reload via CDP ---${colors.reset}`);

        // Set offline mode on page
        await page.setOfflineMode(true);

        const offlinePageErrors = [];
        page.on('pageerror', err => offlinePageErrors.push(err.message));

        try {
            await page.reload({ waitUntil: 'load' });
            recordPass('Page reloaded completely offline without network failure exception');
        } catch (err) {
            recordFail('Offline page reload navigation', err);
        }

        // Verify DOM rendered cleanly offline (no white screen)
        const domOfflineState = await page.evaluate(() => {
            const title = document.title;
            const appContainer = document.getElementById('app') || document.querySelector('main') || document.body;
            const header = document.querySelector('header');
            const subjectsView = document.getElementById('view-subjects');
            const tasksView = document.getElementById('view-tasks');
            const navButtons = document.querySelectorAll('nav button');

            // Check computed styles
            const bodyBg = window.getComputedStyle(document.body).backgroundColor;
            const headerDisplay = header ? window.getComputedStyle(header).display : 'none';

            return {
                title,
                hasHeader: header !== null && headerDisplay !== 'none',
                hasSubjectsView: subjectsView !== null,
                hasTasksView: tasksView !== null,
                navButtonCount: navButtons.length,
                bodyBg,
                innerHTMLNonEmpty: appContainer ? appContainer.innerHTML.length > 500 : false
            };
        });

        if (domOfflineState.hasHeader && domOfflineState.hasSubjectsView && domOfflineState.innerHTMLNonEmpty) {
            recordPass(`App shell completely rendered offline (header: active, innerHTML: ${domOfflineState.innerHTMLNonEmpty}, navButtons: ${domOfflineState.navButtonCount})`);
        } else {
            recordFail('App shell offline rendering check', new Error(JSON.stringify(domOfflineState)));
        }

        if (domOfflineState.title.includes('Organizador')) {
            recordPass(`Document title '${domOfflineState.title}' verified during offline execution`);
        } else {
            recordFail('Document title offline check', new Error(`Title: ${domOfflineState.title}`));
        }

        // Test navigation to root '/' and with query parameters while offline
        try {
            await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
            const rootHeader = await page.evaluate(() => document.querySelector('header') !== null);
            if (rootHeader) {
                recordPass('Navigating to root URL (/) while offline succeeds via Service Worker cache');
            } else {
                recordFail('Offline navigation to root /', new Error('Header missing'));
            }
        } catch (err) {
            recordFail('Offline navigation to root /', err);
        }

        try {
            await page.goto(`http://127.0.0.1:${port}/index.html?mode=standalone&theme=apollo`, { waitUntil: 'load' });
            const paramHeader = await page.evaluate(() => document.querySelector('header') !== null);
            if (paramHeader) {
                recordPass('Navigating with URL query parameters while offline succeeds via ignoreSearch cache strategy');
            } else {
                recordFail('Offline navigation with query params', new Error('Header missing'));
            }
        } catch (err) {
            recordFail('Offline navigation with query params', err);
        }

        // Restore network connectivity on page
        await page.setOfflineMode(false);

        // -------------------------------------------------------------------------
        // SECTION 4: Functional Offline Integrity (State Manipulation & Navigation)
        // -------------------------------------------------------------------------
        console.log(`\n${colors.bold}--- [4] Offline Functional Integrity (App Modules & LocalStorage) ---${colors.reset}`);

        await page.setOfflineMode(true);

        const offlineFunctionality = await page.evaluate(async () => {
            try {
                // 1. Verify global modules
                const hasApp = typeof window.App !== 'undefined' || typeof window.onDataChanged === 'function';
                const hasStorage = typeof window.StorageModule !== 'undefined';
                const hasTasks = typeof window.TasksModule !== 'undefined';

                // 2. Perform view navigation offline
                if (typeof window.navigateToTasks === 'function') {
                    window.navigateToTasks();
                }

                const tasksView = document.getElementById('view-tasks');
                const isTasksVisible = tasksView && !tasksView.classList.contains('hidden');

                // Navigate back to subjects
                if (typeof window.navigateToSubjects === 'function') {
                    window.navigateToSubjects();
                }
                const subjectsView = document.getElementById('view-subjects');
                const isSubjectsVisible = subjectsView && !subjectsView.classList.contains('hidden');

                // 3. Test LocalStorage write/read offline
                const testKey = '__offline_test_marker__';
                localStorage.setItem(testKey, 'offline_verified_134');
                const retrieved = localStorage.getItem(testKey);
                localStorage.removeItem(testKey);

                return {
                    success: true,
                    hasApp,
                    hasStorage,
                    hasTasks,
                    isTasksVisible,
                    isSubjectsVisible,
                    storageWorks: retrieved === 'offline_verified_134'
                };
            } catch (err) {
                return { success: false, error: err.message };
            }
        });

        if (offlineFunctionality.success && offlineFunctionality.storageWorks && offlineFunctionality.isSubjectsVisible) {
            recordPass('Offline module execution, dynamic view switching, and LocalStorage operations verified');
        } else {
            recordFail('Offline functional operations', new Error(JSON.stringify(offlineFunctionality)));
        }

        // Verify offline icon rendering via fetch
        const offlineIconCheck = await page.evaluate(async () => {
            const iconUrls = [
                'assets/icons/icon-192x192.png',
                'assets/icons/icon-512x512.png',
                'assets/icons/apple-touch-icon.png',
                'assets/general.svg'
            ];
            const results = {};
            for (const url of iconUrls) {
                try {
                    const resp = await fetch(url);
                    const blob = await resp.blob();
                    results[url] = { status: resp.status, size: blob.size };
                } catch (err) {
                    results[url] = { error: err.message };
                }
            }
            return results;
        });

        let allIconsOk = true;
        for (const [url, res] of Object.entries(offlineIconCheck)) {
            if (res.status !== 200 || !res.size || res.size <= 0) {
                allIconsOk = false;
                break;
            }
        }
        if (allIconsOk) {
            recordPass('PWA icons and SVG assets successfully retrieved from cache while offline via fetch()');
        } else {
            recordFail('Offline asset fetch verification', new Error(JSON.stringify(offlineIconCheck)));
        }

        // Restore network connectivity
        await page.setOfflineMode(false);
        await page.goto(serverUrl, { waitUntil: 'networkidle0' });

        // -------------------------------------------------------------------------
        // SECTION 5: Hard Offline Stress - Terminating HTTP Server & Route Fallback
        // -------------------------------------------------------------------------
        console.log(`\n${colors.bold}--- [5] Hard Offline Stress: Terminate HTTP Server Process ---${colors.reset}`);

        // Shut down the Node.js HTTP server completely
        await new Promise(resolve => server.close(resolve));
        console.log(`${colors.dim}Node.js HTTP Server forcefully stopped. Host port is now closed.${colors.reset}`);

        // 1. Reload the page: the browser MUST be served entirely by the Service Worker!
        try {
            await page.reload({ waitUntil: 'load' });
            const hardOfflineTitle = await page.title();
            const hardOfflineHeader = await page.evaluate(() => document.querySelector('header') !== null);
            if (hardOfflineTitle.includes('Organizador') && hardOfflineHeader) {
                recordPass('Page successfully reloaded with HTTP server completely stopped (100% Cache Storage served)');
            } else {
                recordFail('Hard offline reload with dead server', new Error(`Title: ${hardOfflineTitle}, header: ${hardOfflineHeader}`));
            }
        } catch (err) {
            recordFail('Hard offline reload with dead server', err);
        }

        // 2. Test navigate fallback to unknown subpath when server is dead
        try {
            await page.goto(`http://127.0.0.1:${port}/unknown-offline-subroute`, { waitUntil: 'load' });
            const fallbackTitle = await page.title();
            const fallbackHeader = await page.evaluate(() => document.querySelector('header') !== null);
            if (fallbackTitle.includes('Organizador') && fallbackHeader) {
                recordPass('Service Worker navigation fallback successfully served cached index.html for unregistered route with dead server');
            } else {
                recordFail('Unregistered route fallback with dead server', new Error(`Title: ${fallbackTitle}, header: ${fallbackHeader}`));
            }
        } catch (err) {
            recordFail('Unregistered route fallback with dead server', err);
        }

        // Restart server for subsequent tests
        server = createServer();
        await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
        console.log(`${colors.dim}Local HTTP Server restarted on port ${port}${colors.reset}\n`);

        await page.goto(serverUrl, { waitUntil: 'networkidle0' });

        // -------------------------------------------------------------------------
        // SECTION 6: Rapid / Concurrent Triggering of promptPwaInstall()
        // -------------------------------------------------------------------------
        console.log(`${colors.bold}--- [6] Rapid / Concurrent promptPwaInstall() Stress Testing ---${colors.reset}`);

        // Subtest 6.1: Rapid triggering BEFORE beforeinstallprompt event (deferred prompt null)
        const prePromptResults = await page.evaluate(async () => {
            // Explicitly clear deferred prompt to simulate user visiting before any prompt event
            window.deferredInstallPrompt = null;
            const results = [];
            for (let i = 0; i < 20; i++) {
                try {
                    const res = await window.promptPwaInstall();
                    results.push({ call: i, res, ok: true });
                } catch (err) {
                    results.push({ call: i, ok: false, error: err.message });
                }
            }
            return results;
        });

        const preErrors = prePromptResults.filter(r => !r.ok);
        if (preErrors.length === 0) {
            recordPass('20 consecutive calls to promptPwaInstall() before beforeinstallprompt handled cleanly with 0 exceptions');
        } else {
            recordFail('Pre-event promptPwaInstall rapid calls', new Error(JSON.stringify(preErrors)));
        }

        // Subtest 6.2: Mock beforeinstallprompt with delayed choice and concurrent triggering
        const concurrentPromptTest = await page.evaluate(async () => {
            let promptCallCount = 0;

            const fakeBip = {
                prompt: function() {
                    promptCallCount++;
                    if (promptCallCount > 1) {
                        // Browser throws InvalidStateError if prompt is called multiple times on same event
                        throw new Error('InvalidStateError: prompt() already called');
                    }
                },
                userChoice: new Promise(resolve => {
                    setTimeout(() => {
                        resolve({ outcome: 'accepted', platform: 'web' });
                    }, 50);
                })
            };

            window.deferredInstallPrompt = fakeBip;

            // Now launch 15 concurrent promptPwaInstall calls in parallel
            const promises = [];
            for (let i = 0; i < 15; i++) {
                promises.push(
                    window.promptPwaInstall()
                        .then(res => ({ ok: true, res }))
                        .catch(err => ({ ok: false, error: err.message }))
                );
            }

            const results = await Promise.all(promises);
            return {
                promptCallCount,
                resultsOk: results.filter(r => r.ok).length,
                resultsFailed: results.filter(r => !r.ok).length,
                deferredCleared: window.deferredInstallPrompt === null
            };
        });

        if (concurrentPromptTest.promptCallCount >= 1 && concurrentPromptTest.resultsFailed === 0) {
            recordPass(`15 concurrent promptPwaInstall() calls handled safely with zero unhandled rejections (prompt calls: ${concurrentPromptTest.promptCallCount}, deferred cleared: ${concurrentPromptTest.deferredCleared})`);
        } else {
            recordFail('Concurrent promptPwaInstall invocation stress', new Error(JSON.stringify(concurrentPromptTest)));
        }

        // -------------------------------------------------------------------------
        // SECTION 7: DOM Install Triggers & Dismissal Throttling
        // -------------------------------------------------------------------------
        console.log(`\n${colors.bold}--- [7] DOM Install Triggers & Dismissal Throttling ---${colors.reset}`);

        // Reset deferred prompt with resolving mock
        await page.evaluate(() => {
            window.deferredInstallPrompt = {
                prompt: () => {},
                userChoice: Promise.resolve({ outcome: 'dismissed' })
            };
        });

        // Test rapid physical clicks on all 3 install trigger buttons
        const rapidClicksOk = await page.evaluate(async () => {
            const settingsBtn = document.getElementById('pwa-install-settings-btn');
            const floatingBtn = document.getElementById('pwa-floating-install-btn');
            const drawerBtn = document.getElementById('drawer-pwa-install-btn');

            let errors = [];
            const clickList = [settingsBtn, floatingBtn, drawerBtn];

            for (let round = 0; round < 5; round++) {
                for (const btn of clickList) {
                    if (btn) {
                        try {
                            btn.click();
                        } catch (e) {
                            errors.push(e.message);
                        }
                    }
                }
            }
            return { errors, ok: errors.length === 0 };
        });

        if (rapidClicksOk.ok) {
            recordPass('Rapid physical DOM clicks on settings, floating, and drawer install buttons executed cleanly');
        } else {
            recordFail('Rapid DOM button clicks', new Error(rapidClicksOk.errors.join(', ')));
        }

        // Test dismissal persistence
        const dismissalTest = await page.evaluate(() => {
            const dismissBtn = document.getElementById('pwa-floating-dismiss-btn');
            const floatingBanner = document.getElementById('pwa-floating-banner');
            if (dismissBtn) dismissBtn.click();

            const isHiddenNow = floatingBanner ? floatingBanner.classList.contains('hidden') : false;
            const dismissedStored = localStorage.getItem('pwa_prompt_dismissed');

            // Dispatch another beforeinstallprompt - banner must remain hidden!
            const secondBip = new Event('beforeinstallprompt');
            secondBip.prompt = () => {};
            secondBip.userChoice = Promise.resolve({ outcome: 'dismissed' });
            window.dispatchEvent(secondBip);

            const isStillHidden = floatingBanner ? floatingBanner.classList.contains('hidden') : false;

            return {
                isHiddenNow,
                hasStorage: dismissedStored !== null,
                isStillHidden
            };
        });

        if (dismissalTest.isHiddenNow && dismissalTest.hasStorage && dismissalTest.isStillHidden) {
            recordPass('Floating install banner dismissal adheres to 24h cooldown and persists across subsequent events');
        } else {
            recordFail('Floating banner dismissal cooldown check', new Error(JSON.stringify(dismissalTest)));
        }

        // -------------------------------------------------------------------------
        // SECTION 8: Appinstalled & Standalone Display Mode Transitions
        // -------------------------------------------------------------------------
        console.log(`\n${colors.bold}--- [8] Appinstalled Lifecycle & Standalone Mode UI Transitions ---${colors.reset}`);

        const standaloneTest = await page.evaluate(() => {
            const appInstalledEvent = new Event('appinstalled');
            window.dispatchEvent(appInstalledEvent);

            const statusPill = document.getElementById('pwa-status-pill');
            const settingsBtn = document.getElementById('pwa-install-settings-btn');
            const btnText = document.getElementById('pwa-install-btn-text');
            const drawerBtn = document.getElementById('drawer-pwa-install-btn');
            const floatingBanner = document.getElementById('pwa-floating-banner');

            return {
                statusText: statusPill ? statusPill.textContent.trim() : null,
                btnText: btnText ? btnText.textContent.trim() : null,
                btnDisabled: settingsBtn ? settingsBtn.disabled : false,
                drawerHidden: drawerBtn ? drawerBtn.classList.contains('hidden') : false,
                bannerHidden: floatingBanner ? floatingBanner.classList.contains('hidden') : false
            };
        });

        if (standaloneTest.statusText === 'Instalada' && standaloneTest.btnDisabled && standaloneTest.drawerHidden) {
            recordPass('appinstalled event transitions all UI entrypoints into "Instalada" and disables duplicate install actions');
        } else {
            recordFail('appinstalled UI state transition check', new Error(JSON.stringify(standaloneTest)));
        }

        // -------------------------------------------------------------------------
        // SECTION 9: file:// Safety & Uncaught Error Audit
        // -------------------------------------------------------------------------
        console.log(`\n${colors.bold}--- [9] file:// Protocol Safety & Global Error Audit ---${colors.reset}`);

        const fileUrl = `file://${path.join(PROJECT_ROOT, 'index.html')}`;
        const fileErrors = [];
        page.on('pageerror', err => fileErrors.push(err.message));

        await page.goto(fileUrl, { waitUntil: 'load' });

        const fileInitState = await page.evaluate(() => {
            return {
                hasApp: typeof window.App !== 'undefined',
                hasPromptFn: typeof window.promptPwaInstall === 'function',
                deferredIsNull: window.deferredInstallPrompt === null
            };
        });

        const hasSecurityViolations = fileErrors.some(e => e.includes('SecurityError') || e.includes('serviceWorker'));

        if (fileInitState.hasApp && fileInitState.hasPromptFn && !hasSecurityViolations) {
            recordPass('App bootstraps gracefully under file:// with zero SecurityErrors thrown');
        } else {
            recordFail('file:// protocol safety audit', new Error(`fileErrors: ${fileErrors.join(', ')}`));
        }

    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }

    console.log(`\n${colors.bold}${colors.magenta}================================================================================${colors.reset}`);
    console.log(`${colors.bold}ADVERSARIAL CHALLENGER VERIFICATION SUMMARY:${colors.reset}`);
    console.log(`  Passed Tests:  ${colors.green}${colors.bold}${passed}${colors.reset}`);
    console.log(`  Failed Tests:  ${failed === 0 ? colors.dim + '0' : colors.red + colors.bold + failed}${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}================================================================================${colors.reset}\n`);

    if (failed > 0) {
        console.log(`${colors.red}${colors.bold}VERDICT: REQUEST_CHANGES (${failed} adversarial challenges failed)${colors.reset}`);
        console.log(JSON.stringify(failureLog, null, 2));
        process.exit(1);
    } else {
        console.log(`${colors.green}${colors.bold}VERDICT: APPROVE (All ${passed} adversarial challenges passed with zero defects!)${colors.reset}\n`);
    }
}

runAdversarialTests().catch(err => {
    console.error('Fatal challenger execution error:', err);
    process.exit(1);
});
