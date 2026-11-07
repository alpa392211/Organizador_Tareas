#!/usr/bin/env node
/**
 * challenger_pwa_m1_adversarial.js
 * 
 * Independent Empirical Challenger Test Suite for Milestone 1 (PWA Implementation).
 * Role: Critic / Empirical Challenger.
 * 
 * Verifies:
 * 1. Byte-level magic bytes, format, exact pixel dimensions for all 8 icon files + root favicon.ico.
 * 2. Strict W3C manifest parsing for manifest.webmanifest and manifest.json + filesystem existence of all icon targets.
 * 3. Programmatic validation of Service Worker precache list in sw.js against project root disk assets (stripping query parameters).
 * 4. Headless Puppeteer E2E validation:
 *    - PWA meta/link tags in DOM
 *    - #pwa-settings-card clean rendering, visibility, and child controls
 *    - window.promptPwaInstall robustness under multiple adversarial scenarios (null prompt, valid prompt, rejected prompt, throw in prompt())
 *    - appinstalled event state machine transitions
 *    - HTTP localhost Service Worker registration, activation, and cache population
 *    - Full offline navigation and reload survival under severed network
 *    - file:// protocol security guard and absence of SecurityError
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer-core');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CHROME_PATH = process.env.CHROME_BIN || '/usr/bin/google-chrome';

let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message) {
    if (condition) {
        passedTests++;
        console.log(`  \x1b[32m✓\x1b[0m ${message}`);
    } else {
        failedTests++;
        failures.push(message);
        console.log(`  \x1b[31m✗\x1b[0m FAIL: ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    if (actual === expected) {
        passedTests++;
        console.log(`  \x1b[32m✓\x1b[0m ${message} (expected: ${expected})`);
    } else {
        failedTests++;
        const errMsg = `${message} — expected: ${expected}, got: ${actual}`;
        failures.push(errMsg);
        console.log(`  \x1b[31m✗\x1b[0m FAIL: ${errMsg}`);
    }
}

// Binary parsers
function parsePng(filePath) {
    const fullPath = path.resolve(PROJECT_ROOT, filePath);
    assert(fs.existsSync(fullPath), `Icon exists: ${filePath}`);
    const buf = fs.readFileSync(fullPath);
    assert(buf.length >= 24, `${filePath} size (${buf.length} bytes) >= 24`);

    const magic = buf.subarray(0, 8);
    const expected = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert(magic.equals(expected), `${filePath} valid PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)`);

    const chunkType = buf.subarray(12, 16).toString('ascii');
    assertEqual(chunkType, 'IHDR', `${filePath} first chunk is IHDR`);

    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const bitDepth = buf.readUInt8(24);
    const colorType = buf.readUInt8(25);

    return { format: 'PNG', width, height, bitDepth, colorType, size: buf.length };
}

function parseIco(filePath) {
    const fullPath = path.resolve(PROJECT_ROOT, filePath);
    assert(fs.existsSync(fullPath), `ICO exists: ${filePath}`);
    const buf = fs.readFileSync(fullPath);
    assert(buf.length >= 6, `${filePath} size (${buf.length} bytes) >= 6`);

    const reserved = buf.readUInt16LE(0);
    const type = buf.readUInt16LE(2);
    const count = buf.readUInt16LE(4);

    assertEqual(reserved, 0, `${filePath} ICO reserved word is 0`);
    assertEqual(type, 1, `${filePath} ICO resource type is 1 (ICON)`);
    assert(count >= 1, `${filePath} contains ${count} sub-images (>= 1)`);

    const images = [];
    for (let i = 0; i < count; i++) {
        const offset = 6 + i * 16;
        assert(offset + 16 <= buf.length, `${filePath} entry ${i} within file bounds`);
        const w = buf.readUInt8(offset) || 256;
        const h = buf.readUInt8(offset + 1) || 256;
        const imgSize = buf.readUInt32LE(offset + 8);
        const imgOffset = buf.readUInt32LE(offset + 12);
        assert(imgOffset + imgSize <= buf.length, `${filePath} sub-image ${i} (${w}x${h}) data within bounds`);
        images.push({ width: w, height: h, size: imgSize, offset: imgOffset });
    }

    return { format: 'ICO', count, images, size: buf.length };
}

// Static HTTP Server for localhost tests
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
            'Service-Worker-Allowed': '/'
        });
        fs.createReadStream(filePath).pipe(res);
    });
}

async function runTestSuite() {
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[36m  CHALLENGER EMPIRICAL VERIFICATION SUITE — MILESTONE 1 (PWA)         \x1b[0m');
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m\n');

    // =========================================================================
    // 1. Validate Generated Icon Files: Magic bytes, format, pixel dimensions
    // =========================================================================
    console.log('\x1b[1m[TASK 1] Icon Files: Binary Magic Bytes & Pixel Dimension Validation\x1b[0m');

    const expectedIcons = [
        { path: 'assets/icons/icon-192x192.png', width: 192, height: 192 },
        { path: 'assets/icons/icon-512x512.png', width: 512, height: 512 },
        { path: 'assets/icons/icon-maskable-192x192.png', width: 192, height: 192 },
        { path: 'assets/icons/icon-maskable-512x512.png', width: 512, height: 512 },
        { path: 'assets/icons/apple-touch-icon.png', width: 180, height: 180 },
        { path: 'assets/icons/favicon-32x32.png', width: 32, height: 32 },
        { path: 'assets/icons/favicon-16x16.png', width: 16, height: 16 }
    ];

    for (const icon of expectedIcons) {
        const meta = parsePng(icon.path);
        assertEqual(meta.width, icon.width, `${icon.path} pixel width == ${icon.width}`);
        assertEqual(meta.height, icon.height, `${icon.path} pixel height == ${icon.height}`);
        assert(meta.size > 0, `${icon.path} file size is non-zero (${meta.size} bytes)`);
    }

    // Root and assets favicon.ico
    const icoFiles = ['assets/icons/favicon.ico', 'favicon.ico'];
    for (const icoPath of icoFiles) {
        const meta = parseIco(icoPath);
        assert(meta.count >= 2, `${icoPath} has multiple embedded icon resolutions (found ${meta.count})`);
        const resList = meta.images.map(img => `${img.width}x${img.height}`);
        assert(resList.includes('16x16'), `${icoPath} contains 16x16 icon`);
        assert(resList.includes('32x32'), `${icoPath} contains 32x32 icon`);
    }

    // Maskable vs Standard icon differentiation stress test
    const icon192 = fs.readFileSync(path.join(PROJECT_ROOT, 'assets/icons/icon-192x192.png'));
    const mask192 = fs.readFileSync(path.join(PROJECT_ROOT, 'assets/icons/icon-maskable-192x192.png'));
    assert(!icon192.equals(mask192), 'Maskable 192x192 icon has dedicated safe-zone geometry (differs from standard icon)');

    const icon512 = fs.readFileSync(path.join(PROJECT_ROOT, 'assets/icons/icon-512x512.png'));
    const mask512 = fs.readFileSync(path.join(PROJECT_ROOT, 'assets/icons/icon-maskable-512x512.png'));
    assert(!icon512.equals(mask512), 'Maskable 512x512 icon has dedicated safe-zone geometry (differs from standard icon)');

    console.log();

    // =========================================================================
    // 2. Validate Manifest Files: JSON syntax, W3C compliance, disk targets
    // =========================================================================
    console.log('\x1b[1m[TASK 2] Manifest Files: W3C Compliance & Disk Target Verification\x1b[0m');

    const manifestFiles = ['manifest.webmanifest', 'manifest.json'];
    for (const mFile of manifestFiles) {
        const fullPath = path.join(PROJECT_ROOT, mFile);
        assert(fs.existsSync(fullPath), `Manifest exists: ${mFile}`);
        const content = fs.readFileSync(fullPath, 'utf8');

        let json;
        try {
            json = JSON.parse(content);
            assert(true, `${mFile} parsed as valid JSON`);
        } catch (e) {
            assert(false, `${mFile} JSON parse failed: ${e.message}`);
            continue;
        }

        assertEqual(json.name, 'Organizador de Tareas', `${mFile} name is "Organizador de Tareas"`);
        assertEqual(json.short_name, 'Organizador', `${mFile} short_name is "Organizador"`);
        assertEqual(json.display, 'standalone', `${mFile} display is "standalone"`);
        assert(Boolean(json.start_url), `${mFile} has start_url declared (${json.start_url})`);
        assert(Array.isArray(json.icons) && json.icons.length > 0, `${mFile} has non-empty icons array`);

        let has192 = false;
        let has512 = false;
        let hasMaskable = false;

        for (const icon of json.icons) {
            const iconDiskPath = path.resolve(PROJECT_ROOT, icon.src);
            assert(fs.existsSync(iconDiskPath), `${mFile} icon target exists on disk: ${icon.src}`);
            assert(fs.statSync(iconDiskPath).isFile() && fs.statSync(iconDiskPath).size > 0, `${mFile} icon target is non-empty file: ${icon.src}`);

            // Verify declared sizes matches physical image dimensions
            if (icon.src.endsWith('.png')) {
                const pngMeta = parsePng(icon.src);
                const expectedSizeStr = `${pngMeta.width}x${pngMeta.height}`;
                assertEqual(icon.sizes, expectedSizeStr, `${icon.src} manifest sizes="${icon.sizes}" matches physical PNG dimensions (${expectedSizeStr})`);
            }

            if (icon.sizes === '192x192') has192 = true;
            if (icon.sizes === '512x512') has512 = true;
            if (icon.purpose && icon.purpose.includes('maskable')) hasMaskable = true;
        }

        assert(has192, `${mFile} includes required 192x192 icon descriptor`);
        assert(has512, `${mFile} includes required 512x512 icon descriptor`);
        assert(hasMaskable, `${mFile} includes required maskable icon descriptor`);
    }

    console.log();

    // =========================================================================
    // 3. Validate Service Worker Precache List: File existence without query params
    // =========================================================================
    console.log('\x1b[1m[TASK 3] Service Worker: Precache Asset Integrity Validation\x1b[0m');

    const swPath = path.join(PROJECT_ROOT, 'sw.js');
    assert(fs.existsSync(swPath), 'sw.js exists at project root');
    const swContent = fs.readFileSync(swPath, 'utf8');

    // Extract precache asset list (matches CORE_ASSETS or PRECACHE_ASSETS)
    const precacheMatch = swContent.match(/const\s+(?:CORE_ASSETS|PRECACHE_ASSETS)\s*=\s*\[([\s\S]*?)\];/);
    assert(Boolean(precacheMatch), 'sw.js defines CORE_ASSETS or PRECACHE_ASSETS array');

    if (precacheMatch) {
        let assetList;
        try {
            assetList = eval(`[${precacheMatch[1]}]`);
            assert(Array.isArray(assetList) && assetList.length >= 25, `Extracted ${assetList.length} precache assets from sw.js`);
        } catch (e) {
            assert(false, `Failed to evaluate precache array: ${e.message}`);
            assetList = [];
        }

        let missingCount = 0;
        for (const rawUrl of assetList) {
            let cleanUrl = rawUrl.split('?')[0];
            if (cleanUrl === './' || cleanUrl === '/') {
                cleanUrl = './index.html';
            }
            const diskPath = path.resolve(PROJECT_ROOT, cleanUrl);
            const exists = fs.existsSync(diskPath) && fs.statSync(diskPath).isFile();
            if (!exists) {
                missingCount++;
                console.log(`    Missing precache asset: ${rawUrl} -> ${diskPath}`);
            }
        }
        assertEqual(missingCount, 0, 'Every single precache asset URL in sw.js resolves to an existing file on disk');

        // Check essential offline assets are included in precache
        const assetStr = JSON.stringify(assetList);
        assert(assetStr.includes('index.html'), 'Precache includes index.html');
        assert(assetStr.includes('manifest.webmanifest'), 'Precache includes manifest.webmanifest');
        assert(assetStr.includes('app.js'), 'Precache includes app.js');
        assert(assetStr.includes('tailwind.min.css'), 'Precache includes tailwind.min.css');
        assert(assetStr.includes('icon-192x192.png'), 'Precache includes 192x192 icon');
        assert(assetStr.includes('icon-512x512.png'), 'Precache includes 512x512 icon');
    }

    // Verify SW features
    assert(swContent.includes('skipWaiting'), 'sw.js calls skipWaiting() for instant updates');
    assert(swContent.includes('clients.claim'), 'sw.js calls clients.claim() for instant control');
    assert(swContent.includes('navigate'), 'sw.js includes navigation fallback strategy');

    console.log();

    // =========================================================================
    // 4. Headless Puppeteer E2E & Browser Automation Verification
    // =========================================================================
    console.log('\x1b[1m[TASK 4] Headless Puppeteer: DOM Meta Tags, Install API & UI Integrity\x1b[0m');

    const server = createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const serverUrl = `http://127.0.0.1:${port}/index.html`;

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--allow-file-access-from-files'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Catch console messages
        const consoleMessages = [];
        const pageErrors = [];
        page.on('console', msg => consoleMessages.push(msg.text()));
        page.on('pageerror', err => pageErrors.push(err.message));

        await page.goto(serverUrl, { waitUntil: 'networkidle0', timeout: 15000 });

        assertEqual(pageErrors.length, 0, 'index.html loaded over HTTP with 0 unhandled page errors');

        // 4.1 DOM Meta Tags and Head Link Integrity
        console.log('  \x1b[33mSubtest 4.1: DOM Meta and Link Elements\x1b[0m');
        const metaTags = await page.evaluate(() => {
            return {
                manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href'),
                themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
                appleTouchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
                appName: document.querySelector('meta[name="application-name"]')?.getAttribute('content'),
                appleMobileCapable: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.getAttribute('content'),
                mobileCapable: document.querySelector('meta[name="mobile-web-app-capable"]')?.getAttribute('content'),
                appleTitle: document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content')
            };
        });

        assertEqual(metaTags.manifest, 'manifest.webmanifest', '<link rel="manifest"> points to manifest.webmanifest');
        assertEqual(metaTags.themeColor, '#4F46E5', '<meta name="theme-color"> is #4F46E5');
        assertEqual(metaTags.appleTouchIcon, 'assets/icons/apple-touch-icon.png', '<link rel="apple-touch-icon"> is assets/icons/apple-touch-icon.png');
        assertEqual(metaTags.appName, 'Organizador de Tareas', '<meta name="application-name"> is "Organizador de Tareas"');
        assertEqual(metaTags.appleMobileCapable, 'yes', '<meta name="apple-mobile-web-app-capable"> is "yes"');
        assertEqual(metaTags.mobileCapable, 'yes', '<meta name="mobile-web-app-capable"> is "yes"');
        assertEqual(metaTags.appleTitle, 'Organizador', '<meta name="apple-mobile-web-app-title"> is "Organizador"');

        // 4.2 Settings Card (#pwa-settings-card) DOM rendering
        console.log('  \x1b[33mSubtest 4.2: #pwa-settings-card Structure & Rendering\x1b[0m');
        const cardStructure = await page.evaluate(() => {
            const card = document.getElementById('pwa-settings-card');
            const pill = document.getElementById('pwa-status-pill');
            const btn = document.getElementById('pwa-install-settings-btn');
            const btnText = document.getElementById('pwa-install-btn-text');
            return {
                cardExists: Boolean(card),
                pillExists: Boolean(pill),
                pillText: pill?.textContent?.trim(),
                btnExists: Boolean(btn),
                btnText: btnText?.textContent?.trim()
            };
        });

        assert(cardStructure.cardExists, '#pwa-settings-card element exists in DOM');
        assert(cardStructure.pillExists, '#pwa-status-pill exists inside DOM');
        assert(cardStructure.pillText.includes('Navegador'), `#pwa-status-pill initial text is "${cardStructure.pillText}"`);
        assert(cardStructure.btnExists, '#pwa-install-settings-btn exists inside DOM');
        assertEqual(cardStructure.btnText, 'Instalar Aplicación', '#pwa-install-btn-text is "Instalar Aplicación"');

        // Navigate to Settings View and verify #pwa-settings-card renders cleanly
        const cardVisibility = await page.evaluate(() => {
            if (typeof window.navigateToSettings === 'function') {
                window.navigateToSettings();
            }
            const card = document.getElementById('pwa-settings-card');
            if (!card) return null;
            const rect = card.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(card);
            return {
                width: rect.width,
                height: rect.height,
                display: computedStyle.display,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity
            };
        });

        assert(cardVisibility !== null, '#pwa-settings-card accessible after window.navigateToSettings()');
        assert(cardVisibility.width > 0 && cardVisibility.height > 0, `#pwa-settings-card renders with positive dimensions (${cardVisibility.width}x${cardVisibility.height}px)`);
        assert(cardVisibility.display !== 'none' && cardVisibility.visibility !== 'hidden', '#pwa-settings-card is visible in Settings view');

        // 4.3 window.promptPwaInstall API & Robustness Stress Testing
        console.log('  \x1b[33mSubtest 4.3: window.promptPwaInstall Adversarial Robustness\x1b[0m');

        const fnType = await page.evaluate(() => typeof window.promptPwaInstall);
        assertEqual(fnType, 'function', 'window.promptPwaInstall is exposed globally as a function');

        // Scenario A: Calling promptPwaInstall when deferred prompt is null
        const scenarioA = await page.evaluate(async () => {
            window.deferredInstallPrompt = null;
            try {
                const res = await window.promptPwaInstall();
                return { threw: false, result: res };
            } catch (err) {
                return { threw: true, message: err.message };
            }
        });
        assert(!scenarioA.threw, 'window.promptPwaInstall() does NOT throw when deferred prompt is null');
        assertEqual(scenarioA.result, null, 'window.promptPwaInstall() returns null when prompt is unavailable');

        // Scenario B: Simulating beforeinstallprompt with accepted outcome
        const scenarioB = await page.evaluate(async () => {
            let promptInvoked = false;
            const fakeEvent = new Event('beforeinstallprompt');
            fakeEvent.prompt = async () => { promptInvoked = true; };
            fakeEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });

            window.dispatchEvent(fakeEvent);

            const hasStoredPrompt = Boolean(window.deferredInstallPrompt);
            const res = await window.promptPwaInstall();
            const promptCleared = window.deferredInstallPrompt === null;

            return {
                hasStoredPrompt,
                promptInvoked,
                outcome: res?.outcome,
                promptCleared
            };
        });
        assert(scenarioB.hasStoredPrompt, 'beforeinstallprompt event listener captures and stores deferred prompt');
        assert(scenarioB.promptInvoked, 'promptPwaInstall invokes deferred prompt.prompt()');
        assertEqual(scenarioB.outcome, 'accepted', 'promptPwaInstall resolves with user choice ("accepted")');
        assert(scenarioB.promptCleared, 'promptPwaInstall clears deferred prompt after usage');

        // Scenario C: Adversarial Stress Test — prompt.prompt() throws an unexpected rejection
        const scenarioC = await page.evaluate(async () => {
            const hostileEvent = new Event('beforeinstallprompt');
            hostileEvent.prompt = async () => { throw new Error('Hostile browser error'); };
            hostileEvent.userChoice = Promise.reject(new Error('User choice exploded'));

            window.dispatchEvent(hostileEvent);

            try {
                const res = await window.promptPwaInstall();
                return { threw: false, result: res };
            } catch (err) {
                return { threw: true, error: err.message };
            }
        });
        assert(!scenarioC.threw, 'promptPwaInstall gracefully catches unexpected errors during prompt execution');
        assertEqual(scenarioC.result, null, 'promptPwaInstall returns null on prompt error rather than crashing');

        // 4.4 appinstalled state machine transition
        console.log('  \x1b[33mSubtest 4.4: appinstalled Event State Machine Transition\x1b[0m');
        const stateTransition = await page.evaluate(() => {
            window.dispatchEvent(new Event('appinstalled'));
            const pill = document.getElementById('pwa-status-pill');
            const btn = document.getElementById('pwa-install-settings-btn');
            const btnText = document.getElementById('pwa-install-btn-text');
            const floating = document.getElementById('pwa-floating-banner');
            return {
                pillText: pill?.textContent?.trim(),
                btnDisabled: btn?.disabled,
                btnText: btnText?.textContent?.trim(),
                floatingHidden: floating?.classList?.contains('hidden')
            };
        });

        assertEqual(stateTransition.pillText, 'Instalada', 'PWA status pill updates to "Instalada" upon appinstalled');
        assert(stateTransition.btnDisabled === true, '#pwa-install-settings-btn becomes disabled');
        assert(stateTransition.btnText.includes('✓ Aplicación Instalada'), '#pwa-install-btn-text reflects "✓ Aplicación Instalada"');
        assert(stateTransition.floatingHidden === true, '#pwa-floating-banner is hidden after installation');

        // 4.5 Service Worker Registration and Precache Verification
        console.log('  \x1b[33mSubtest 4.5: Service Worker Lifecycle & Offline Precache Population\x1b[0m');
        const swStatus = await page.evaluate(async () => {
            if (!('serviceWorker' in navigator)) return { supported: false };
            const reg = await navigator.serviceWorker.ready;
            const cachesKeys = await window.caches.keys();
            const hasAppCache = cachesKeys.some(k => k.startsWith('organizador-tareas-cache'));

            let cachedCount = 0;
            if (hasAppCache) {
                const cacheName = cachesKeys.find(k => k.startsWith('organizador-tareas-cache'));
                const cache = await window.caches.open(cacheName);
                const keys = await cache.keys();
                cachedCount = keys.length;
            }

            return {
                supported: true,
                scope: reg?.scope,
                active: Boolean(reg?.active),
                cachesKeys,
                cachedCount
            };
        });

        assert(swStatus.supported, 'navigator.serviceWorker is supported in browser environment');
        assert(swStatus.active, 'Service Worker successfully registered and activated on localhost');
        assert(swStatus.cachedCount >= 25, `Cache storage contains ${swStatus.cachedCount} cached assets (>= 25)`);

        // 4.6 Offline Resilience Test: Sever network and test reload
        console.log('  \x1b[33mSubtest 4.6: Complete Offline Navigation Survival\x1b[0m');
        const cdp = await page.target().createCDPSession();
        await cdp.send('Network.enable');
        await cdp.send('Network.emulateNetworkConditions', {
            offline: true,
            latency: 0,
            downloadThroughput: 0,
            uploadThroughput: 0
        });

        let offlineReloadSuccess = false;
        try {
            await page.reload({ waitUntil: 'load', timeout: 10000 });
            offlineReloadSuccess = true;
        } catch (e) {
            offlineReloadSuccess = false;
        }
        assert(offlineReloadSuccess, 'Page successfully reloads from Service Worker cache while strictly offline');

        const offlineTitle = await page.title();
        assert(offlineTitle.includes('Organizador'), `Page title preserved offline: "${offlineTitle}"`);

        await cdp.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 0,
            downloadThroughput: -1,
            uploadThroughput: -1
        });

        // 4.7 file:// Protocol Safety Check
        console.log('  \x1b[33mSubtest 4.7: file:// Protocol Guard (Zero SecurityErrors)\x1b[0m');
        const filePage = await browser.newPage();
        const fileErrors = [];
        filePage.on('pageerror', err => fileErrors.push(err.message));

        const fileUrl = `file://${path.join(PROJECT_ROOT, 'index.html')}`;
        await filePage.goto(fileUrl, { waitUntil: 'load', timeout: 10000 });

        const secErrors = fileErrors.filter(err => err.includes('SecurityError') || err.includes('ServiceWorker'));
        assertEqual(secErrors.length, 0, 'No SecurityError thrown under file:// protocol');

        const filePromptFn = await filePage.evaluate(() => typeof window.promptPwaInstall);
        assertEqual(filePromptFn, 'function', 'window.promptPwaInstall still cleanly defined under file://');

        await filePage.close();
        await page.close();
    } finally {
        await browser.close();
        server.close();
    }

    console.log('\n\x1b[1m\x1b[36m========================================================================\x1b[0m');
    console.log(`\x1b[1m  Empirical Test Summary: Passed: ${passedTests} | Failed: ${failedTests}\x1b[0m`);
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m\n');

    if (failedTests > 0) {
        console.error('\x1b[31mFAILURES DETECTED:\x1b[0m');
        failures.forEach((f, idx) => console.error(`  ${idx + 1}. ${f}`));
        process.exit(1);
    } else {
        console.log('\x1b[32mRESULT: ALL EMPIRICAL CHALLENGER TESTS PASSED (100% SUCCESS)\x1b[0m\n');
        process.exit(0);
    }
}

runTestSuite().catch(err => {
    console.error('\x1b[31mFATAL TEST EXECUTION ERROR:\x1b[0m', err);
    process.exit(1);
});
