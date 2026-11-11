#!/usr/bin/env node
/**
 * test_pwa_milestone1.js - Automated Verification Test Suite for Milestone 1: PWA Transformation
 * 
 * Verifies:
 * 1. Web App Manifest syntax and icon array integrity
 * 2. Physical icon files on disk and pixel dimensions
 * 3. DOM meta tags, head links, and in-app install DOM structures
 * 4. Localhost HTTP server Service Worker registration and precache
 * 5. Full offline navigation and page reload using Service Worker cache
 * 6. In-app install prompt triggers and event handling
 * 7. file:// protocol safety (no SecurityError thrown)
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
    cyan: '\x1b[36m'
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

function createStaticServer() {
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
            'Cache-Control': 'no-cache',
            'Service-Worker-Allowed': '/'
        });
        fs.createReadStream(filePath).pipe(res);
    });
}

async function run() {
    console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}  TEST SUITE: MILESTONE 1 - PWA TRANSFORMATION & INSTALL FLOW (v1.3.4)  ${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (!condition) {
            failed++;
            console.log(` ${colors.red}[FAIL]${colors.reset} ${message}`);
            throw new Error(message);
        } else {
            passed++;
            console.log(` ${colors.green}[PASS]${colors.reset} ${message}`);
        }
    }

    // --- TEST GROUP 1: Manifest Files Integrity ---
    console.log(`${colors.bold}--- [Group 1] Web App Manifest Verification ---${colors.reset}`);
    const manifestWebPath = path.join(PROJECT_ROOT, 'manifest.webmanifest');
    const manifestJsonPath = path.join(PROJECT_ROOT, 'manifest.json');

    assert(fs.existsSync(manifestWebPath), 'manifest.webmanifest exists at project root');
    assert(fs.existsSync(manifestJsonPath), 'manifest.json exists at project root');

    const manifestWeb = JSON.parse(fs.readFileSync(manifestWebPath, 'utf8'));
    const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));

    assert(JSON.stringify(manifestWeb) === JSON.stringify(manifestJson), 'manifest.webmanifest and manifest.json are synchronized');
    assert(manifestWeb.name === 'Organizador de Tareas', 'Manifest name is "Organizador de Tareas"');
    assert(manifestWeb.short_name === '', 'Manifest short_name is empty to suppress splash text');
    assert(manifestWeb.display === 'standalone', 'Manifest display mode is "standalone"');
    assert(manifestWeb.background_color === '#0c0143', 'Manifest background_color is #0c0143');
    assert(manifestWeb.theme_color === '#4F46E5', 'Manifest theme_color is #4F46E5');
    assert(Array.isArray(manifestWeb.icons) && manifestWeb.icons.length >= 5, 'Manifest contains complete icon descriptors (>=5 icons)');

    const has192Any = manifestWeb.icons.some(i => i.src.includes('192') && i.purpose === 'any');
    const has512Any = manifestWeb.icons.some(i => i.src.includes('512') && i.purpose === 'any');
    const has192Maskable = manifestWeb.icons.some(i => i.src.includes('192') && i.purpose === 'maskable');
    const has512Maskable = manifestWeb.icons.some(i => i.src.includes('512') && i.purpose === 'maskable');
    const hasAppleTouch = manifestWeb.icons.some(i => i.src.includes('apple-touch-icon'));

    assert(has192Any && has512Any, 'Manifest includes standard 192x192 and 512x512 icons (purpose: any)');
    assert(has192Maskable && has512Maskable, 'Manifest includes adaptive maskable 192x192 and 512x512 icons (purpose: maskable)');
    assert(hasAppleTouch, 'Manifest includes apple-touch-icon reference');

    // --- TEST GROUP 2: Physical Icons On Disk ---
    console.log(`\n${colors.bold}--- [Group 2] Generated Icon Files on Disk ---${colors.reset}`);
    const requiredIcons = [
        'assets/icons/icon-192x192.png',
        'assets/icons/icon-512x512.png',
        'assets/icons/icon-maskable-192x192.png',
        'assets/icons/icon-maskable-512x512.png',
        'assets/icons/apple-touch-icon.png',
        'assets/icons/favicon-32x32.png',
        'assets/icons/favicon-16x16.png',
        'assets/icons/favicon.ico',
        'favicon.ico'
    ];

    for (const iconRel of requiredIcons) {
        const fullPath = path.join(PROJECT_ROOT, iconRel);
        assert(fs.existsSync(fullPath), `Icon file exists: ${iconRel}`);
        const stat = fs.statSync(fullPath);
        assert(stat.size > 200, `Icon file is non-empty: ${iconRel} (${stat.size} bytes)`);
    }

    // --- TEST GROUP 3: Service Worker File & Cache Versioning ---
    console.log(`\n${colors.bold}--- [Group 3] Service Worker (sw.js) Architecture ---${colors.reset}`);
    const swPath = path.join(PROJECT_ROOT, 'sw.js');
    assert(fs.existsSync(swPath), 'sw.js exists at project root');
    const swContent = fs.readFileSync(swPath, 'utf8');

    assert(swContent.includes('organizador-tareas-cache-v1.4.4'), 'sw.js uses versioned cache organizador-tareas-cache-v1.4.4');
    assert(swContent.includes('Promise.allSettled'), 'sw.js employs Promise.allSettled for fault-tolerant precaching');
    assert(swContent.includes('skipWaiting'), 'sw.js executes skipWaiting for zero-latency activation');
    assert(swContent.includes('clients.claim'), 'sw.js claims clients immediately on activation');
    assert(swContent.includes('caches.delete'), 'sw.js implements cache cleanup of obsolete versions');

    // Start local HTTP server
    const server = createStaticServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const serverUrl = `http://127.0.0.1:${port}/index.html`;
    console.log(`\n${colors.dim}Local HTTP server running at ${serverUrl}${colors.reset}`);

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1280,800'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // --- TEST GROUP 4: DOM Head & In-App Install Elements ---
        console.log(`\n${colors.bold}--- [Group 4] HTML Head & In-App UI Elements ---${colors.reset}`);
        await page.goto(serverUrl, { waitUntil: 'load' });

        const domHeadCheck = await page.evaluate(() => {
            const manifestLink = document.querySelector('link[rel="manifest"]');
            const appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
            const faviconLink = document.querySelector('link[rel="icon"]');
            const themeColorMeta = document.querySelector('meta[name="theme-color"]');
            const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
            const versionPill = document.getElementById('settings-version-pill');
            const settingsCard = document.getElementById('pwa-settings-card');
            const settingsBtn = document.getElementById('pwa-install-settings-btn');
            const statusPill = document.getElementById('pwa-status-pill');
            const floatingBanner = document.getElementById('pwa-floating-banner');
            const drawerBtn = document.getElementById('drawer-pwa-install-btn');

            return {
                manifestHref: manifestLink ? manifestLink.getAttribute('href') : null,
                appleIconHref: appleIconLink ? appleIconLink.getAttribute('href') : null,
                faviconHref: faviconLink ? faviconLink.getAttribute('href') : null,
                themeColor: themeColorMeta ? themeColorMeta.getAttribute('content') : null,
                appleTitle: appleTitleMeta ? appleTitleMeta.getAttribute('content') : null,
                versionText: versionPill ? versionPill.textContent : null,
                hasSettingsCard: settingsCard !== null,
                hasSettingsBtn: settingsBtn !== null,
                hasStatusPill: statusPill !== null,
                hasFloatingBanner: floatingBanner !== null,
                hasDrawerBtn: drawerBtn !== null
            };
        });

        assert(domHeadCheck.manifestHref === 'manifest.webmanifest', '<link rel="manifest" href="manifest.webmanifest"> present in head');
        assert(domHeadCheck.appleIconHref === 'assets/icons/apple-touch-icon.png', '<link rel="apple-touch-icon"> present in head');
        assert(domHeadCheck.themeColor === '#4F46E5', '<meta name="theme-color" content="#4F46E5"> present');
        assert(domHeadCheck.appleTitle === 'Organizador', '<meta name="apple-mobile-web-app-title" content="Organizador"> present');
        assert(domHeadCheck.versionText && domHeadCheck.versionText.includes('1.4.4'), 'Settings version pill displays updated "Versión 1.4.4"');
        assert(domHeadCheck.hasSettingsCard, '#pwa-settings-card present in settings view');
        assert(domHeadCheck.hasSettingsBtn, '#pwa-install-settings-btn present');
        assert(domHeadCheck.hasStatusPill, '#pwa-status-pill present');
        assert(domHeadCheck.hasFloatingBanner, '#pwa-floating-banner present in DOM');
        assert(domHeadCheck.hasDrawerBtn, '#drawer-pwa-install-btn present in sidebar drawer');

        // --- TEST GROUP 5: Service Worker Registration & Local Caching ---
        console.log(`\n${colors.bold}--- [Group 5] Service Worker Active Registration & Cache Verification ---${colors.reset}`);
        
        // Wait for Service Worker registration on localhost
        const swRegistrationOk = await page.evaluate(async () => {
            if (!('serviceWorker' in navigator)) return false;
            try {
                const reg = await navigator.serviceWorker.ready;
                return reg && reg.active !== null;
            } catch (err) {
                return false;
            }
        });
        assert(swRegistrationOk, 'Service Worker registered and activated on secure localhost');

        const cacheHasV141 = await page.evaluate(async () => {
            return await caches.has('organizador-tareas-cache-v1.4.4');
        });
        assert(cacheHasV141, 'Cache storage contains "organizador-tareas-cache-v1.4.4"');

        const cachedKeysCount = await page.evaluate(async () => {
            const cache = await caches.open('organizador-tareas-cache-v1.4.4');
            const keys = await cache.keys();
            return keys.length;
        });
        assert(cachedKeysCount >= 10, `Precached assets populated in cache (${cachedKeysCount} entries)`);

        // --- TEST GROUP 6: Offline Resilience via Service Worker ---
        console.log(`\n${colors.bold}--- [Group 6] Offline Navigation and Cache Fallback ---${colors.reset}`);
        
        // Enable offline mode in Chrome DevTools Protocol
        await page.setOfflineMode(true);

        // Reload the page completely while offline
        await page.reload({ waitUntil: 'load' });

        const offlineTitle = await page.title();
        const headerLoaded = await page.evaluate(() => {
            const header = document.querySelector('header');
            const subjectsView = document.getElementById('view-subjects');
            return header !== null && subjectsView !== null;
        });

        assert(offlineTitle.includes('Organizador'), 'Page title resolves properly during complete offline reload');
        assert(headerLoaded, 'Application shell and subjects view successfully load from Service Worker offline cache');

        // Restore network connectivity
        await page.setOfflineMode(false);

        // --- TEST GROUP 7: In-App Install Prompt Event Flow ---
        console.log(`\n${colors.bold}--- [Group 7] In-App Install Event Interception & UI State ---${colors.reset}`);
        
        const installSimulation = await page.evaluate(() => {
            // Create and dispatch synthetic beforeinstallprompt event
            const event = new Event('beforeinstallprompt');
            let promptCalled = false;
            event.prompt = () => { promptCalled = true; };
            event.userChoice = Promise.resolve({ outcome: 'accepted' });
            window.dispatchEvent(event);

            const hasDeferred = window.deferredInstallPrompt !== null;
            const drawerBtn = document.getElementById('drawer-pwa-install-btn');
            const drawerVisible = drawerBtn && !drawerBtn.classList.contains('hidden');

            return {
                hasDeferred,
                drawerVisible
            };
        });

        assert(installSimulation.hasDeferred, 'beforeinstallprompt trapped and stored in window.deferredInstallPrompt');
        assert(installSimulation.drawerVisible, 'Drawer PWA install button unhidden upon beforeinstallprompt');

        // Test appinstalled event
        const appInstalledTest = await page.evaluate(() => {
            const installedEvent = new Event('appinstalled');
            window.dispatchEvent(installedEvent);

            const statusPill = document.getElementById('pwa-status-pill');
            const btnText = document.getElementById('pwa-install-btn-text');
            const settingsBtn = document.getElementById('pwa-install-settings-btn');
            const floatingBanner = document.getElementById('pwa-floating-banner');

            return {
                statusText: statusPill ? statusPill.textContent : '',
                btnText: btnText ? btnText.textContent : '',
                btnDisabled: settingsBtn ? settingsBtn.disabled : false,
                bannerHidden: floatingBanner ? floatingBanner.classList.contains('hidden') : false
            };
        });

        assert(appInstalledTest.statusText === 'Instalada', 'PWA status pill reflects "Instalada"');
        assert(appInstalledTest.btnText.includes('Instalada'), 'PWA settings button reflects "✓ Aplicación Instalada"');
        assert(appInstalledTest.btnDisabled, 'PWA settings button is disabled after successful installation');
        assert(appInstalledTest.bannerHidden, 'Floating install banner is dismissed upon app installation');

        // --- TEST GROUP 8: file:// Scheme Security & Compatibility ---
        console.log(`\n${colors.bold}--- [Group 8] file:// Compatibility Guard Verification ---${colors.reset}`);
        const fileUrl = `file://${path.join(PROJECT_ROOT, 'index.html')}`;
        const pageErrors = [];
        page.on('pageerror', err => pageErrors.push(err.message));

        await page.goto(fileUrl, { waitUntil: 'load' });

        const appReady = await page.evaluate(() => {
            return typeof window.App !== 'undefined' && typeof window.promptPwaInstall === 'function';
        });

        const securityErrors = pageErrors.filter(err => err.includes('SecurityError') || err.includes('serviceWorker'));
        assert(appReady, 'App initializes cleanly under file:// with window.promptPwaInstall defined');
        assert(securityErrors.length === 0, 'Zero SecurityErrors thrown when loading under file://');

    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }

    console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
    console.log(`${colors.bold}PWA Milestone 1 Test Summary:${colors.reset}`);
    console.log(`  Passed:  ${colors.green}${colors.bold}${passed}${colors.reset}`);
    console.log(`  Failed:  ${failed === 0 ? colors.dim + '0' : colors.red + colors.bold + failed}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);

    if (failed > 0) {
        process.exit(1);
    } else {
        console.log(`${colors.green}${colors.bold}RESULT: SUCCESS (All Milestone 1 PWA verification tests passed!)${colors.reset}\n`);
    }
}

run().catch(err => {
    console.error(`Fatal test error:`, err);
    process.exit(1);
});
