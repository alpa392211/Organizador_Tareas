/**
 * test_helpers.js - Reusable E2E Test Utilities for Organizador_Tareas v1.3.1
 * Runs headless Chrome with zero external network dependencies over file://
 */

const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const TARGET_URL = `file://${path.join(PROJECT_ROOT, 'index.html')}`;

const DEFAULT_FLAGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-web-security',
    '--allow-file-access-from-files',
    '--disable-features=IsolateOrigins,site-per-process',
    '--window-size=1280,800',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--hide-scrollbars',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-first-run',
    '--safebrowsing-disable-auto-update'
];

/**
 * Launch headless Chrome browser instance
 */
async function launchBrowser(customArgs = []) {
    return await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: [...DEFAULT_FLAGS, ...customArgs]
    });
}

/**
 * Create a new page with default or specified viewport and navigate to app
 */
async function createPage(browser, options = {}) {
    const page = await browser.newPage();
    const viewport = options.viewport || { width: 1280, height: 800 };
    await page.setViewport(viewport);

    // Suppress unhandled dialogs (confirm/alert) automatically or record them
    page.on('dialog', async dialog => {
        try {
            await dialog.accept();
        } catch (_) {}
    });

    await page.goto(TARGET_URL, { waitUntil: 'load' });
    return page;
}

/**
 * Creates a clean page with reset LocalStorage
 */
async function createCleanPage(browser, options = {}) {
    const page = await createPage(browser, options);
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'load' });
    return page;
}

/**
 * Custom Assertion Functions with descriptive errors
 */
class AssertionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AssertionError';
    }
}

function assert(condition, message = 'Assertion failed') {
    if (!condition) {
        throw new AssertionError(message);
    }
}

function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        const desc = message ? `${message} - ` : '';
        throw new AssertionError(`${desc}Expected: ${JSON.stringify(expected)}, Received: ${JSON.stringify(actual)}`);
    }
}

function assertNotEqual(actual, expected, message = '') {
    if (actual === expected) {
        const desc = message ? `${message} - ` : '';
        throw new AssertionError(`${desc}Value was not expected to equal: ${JSON.stringify(expected)}`);
    }
}

function assertTrue(val, message = '') {
    if (val !== true) {
        const desc = message ? `${message} - ` : '';
        throw new AssertionError(`${desc}Expected true, received: ${val}`);
    }
}

function assertFalse(val, message = '') {
    if (val !== false) {
        const desc = message ? `${message} - ` : '';
        throw new AssertionError(`${desc}Expected false, received: ${val}`);
    }
}

function assertIncludes(actual, substringOrItem, message = '') {
    if (actual === null || actual === undefined) {
        throw new AssertionError(`${message} - Target is null or undefined`);
    }
    if (typeof actual === 'string' || Array.isArray(actual)) {
        if (!actual.includes(substringOrItem)) {
            const desc = message ? `${message} - ` : '';
            throw new AssertionError(`${desc}Expected target to include: ${JSON.stringify(substringOrItem)}, Actual: ${JSON.stringify(actual)}`);
        }
    } else {
        throw new AssertionError(`${message} - Actual value is neither string nor array`);
    }
}

function assertMatch(actual, regex, message = '') {
    if (!regex.test(String(actual))) {
        const desc = message ? `${message} - ` : '';
        throw new AssertionError(`${desc}Value "${actual}" does not match pattern ${regex}`);
    }
}

/**
 * DOM Interaction Helpers
 */
async function waitSelector(page, selector, timeout = 3000) {
    return await page.waitForSelector(selector, { visible: true, timeout });
}

async function safeClick(page, selector, timeout = 3000) {
    await page.waitForSelector(selector, { visible: true, timeout });
    await page.click(selector);
}

async function safeType(page, selector, text, clear = true) {
    await page.waitForSelector(selector, { visible: true, timeout: 3000 });
    if (clear) {
        await page.evaluate(sel => {
            const el = document.querySelector(sel);
            if (el) el.value = '';
        }, selector);
    }
    await page.type(selector, String(text));
}

async function getElementText(page, selector) {
    return await page.evaluate(sel => {
        const el = document.querySelector(sel);
        return el ? (el.textContent || '').trim() : null;
    }, selector);
}

async function getInputValue(page, selector) {
    return await page.evaluate(sel => {
        const el = document.querySelector(sel);
        return el ? el.value : null;
    }, selector);
}

async function isElementVisible(page, selector) {
    return await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && !el.classList.contains('hidden');
    }, selector);
}

async function hasClass(page, selector, className) {
    return await page.evaluate((sel, cls) => {
        const el = document.querySelector(sel);
        return el ? el.classList.contains(cls) : false;
    }, selector, className);
}

async function getLocalStorageItem(page, key) {
    return await page.evaluate(k => localStorage.getItem(k), key);
}

async function setLocalStorageItem(page, key, val) {
    return await page.evaluate((k, v) => localStorage.setItem(k, v), key, val);
}

/**
 * Simulates uploading an image file to an input[type="file"] element
 * using an in-memory synthetic Canvas generating a Blob and File via DataTransfer
 */
async function simulateFileUpload(page, inputSelector, options = {}) {
    const {
        width = 500,
        height = 500,
        color = '#4F46E5',
        fileName = 'test_upload.png',
        mimeType = 'image/png'
    } = options;

    return await page.evaluate(async (sel, w, h, col, fName, mType) => {
        const input = document.querySelector(sel);
        if (!input) throw new Error(`File input selector "${sel}" not found in DOM`);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = col;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px sans-serif';
        ctx.fillText('TEST IMAGE', 20, 50);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, mType));
        const file = new File([blob], fName, { type: mType });

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;

        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return { name: fName, size: blob.size, type: mType, width: w, height: h };
    }, inputSelector, width, height, color, fileName, mimeType);
}

/**
 * Sets up spying on browser notification permission requests
 */
async function spyNotifications(page) {
    return await page.evaluate(() => {
        window.__notificationsSpy = {
            requested: false,
            callCount: 0,
            history: []
        };

        if (typeof window.Notification !== 'undefined') {
            window.Notification.requestPermission = async function() {
                window.__notificationsSpy.requested = true;
                window.__notificationsSpy.callCount++;
                window.__notificationsSpy.history.push({ time: Date.now(), source: 'Notification.requestPermission' });
                return 'granted';
            };
        }

        if (window.NotificationsModule) {
            window.NotificationsModule.requestPermission = async function() {
                window.__notificationsSpy.requested = true;
                window.__notificationsSpy.callCount++;
                window.__notificationsSpy.history.push({ time: Date.now(), source: 'NotificationsModule.requestPermission' });
                return 'granted';
            };
        }
        return true;
    });
}

/**
 * Retrieves the current status of notification requests
 */
async function getNotificationSpyStatus(page) {
    return await page.evaluate(() => {
        return window.__notificationsSpy || { requested: false, callCount: 0, history: [] };
    });
}

/**
 * Waits for a preview image element to be populated with a downsampled data:image/ URL
 */
async function waitForCanvasDownsample(page, previewImgSelector, maxWaitMs = 3000) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
        const result = await page.evaluate(sel => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const src = el.src || el.getAttribute('src') || el.style.backgroundImage || '';
            if (src.includes('data:image/')) {
                const dataUrl = src.startsWith('url(') ? src.slice(4, -1).replace(/["']/g, '') : src;
                return {
                    ready: true,
                    dataUrl,
                    srcLength: dataUrl.length,
                    approxBytes: Math.round(dataUrl.length * 0.75),
                    width: el.naturalWidth || el.width || 0,
                    height: el.naturalHeight || el.height || 0
                };
            }
            return null;
        }, previewImgSelector);

        if (result && result.ready) {
            return result;
        }
        await new Promise(r => setTimeout(r, 100));
    }
    throw new Error(`Timeout waiting for downsampled image at "${previewImgSelector}"`);
}

/**
 * Simulates a long-press touch/pointer gesture on a given selector
 */
async function simulateLongPress(page, selector, durationMs = 500) {
    await page.waitForSelector(selector, { visible: true, timeout: 3000 });
    await page.evaluate(async (sel, dur) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`Element "${sel}" not found for long press`);

        const rect = el.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;

        const touch = new Touch({
            identifier: 1,
            target: el,
            clientX,
            clientY,
            pageX: clientX,
            pageY: clientY
        });

        const touchStartEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: [touch],
            targetTouches: [touch],
            changedTouches: [touch]
        });
        el.dispatchEvent(touchStartEvent);

        const pointerDownEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
            pointerId: 1,
            pointerType: 'touch'
        });
        el.dispatchEvent(pointerDownEvent);

        await new Promise(resolve => setTimeout(resolve, dur + 50));

        const touchEndEvent = new TouchEvent('touchend', {
            bubbles: true,
            cancelable: true,
            touches: [],
            targetTouches: [],
            changedTouches: [touch]
        });
        el.dispatchEvent(touchEndEvent);

        const pointerUpEvent = new PointerEvent('pointerup', {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
            pointerId: 1,
            pointerType: 'touch'
        });
        el.dispatchEvent(pointerUpEvent);
    }, selector, durationMs);
}

/**
 * Resets page state between tests: wipes storage, removes .open from accordion cards,
 * closes modals/backdrops, cleans dynamic popups/toasts, switches view to subjects,
 * resets form inputs, and resets viewport to 1280x800.
 */
async function resetPageState(page) {
    try {
        await page.setViewport({ width: 1280, height: 800 });
        await page.evaluate(() => {
            // Wipes storage
            try { localStorage.clear(); } catch (_) {}
            try { sessionStorage.clear(); } catch (_) {}

            // Remove .open from all .settings-accordion-card
            document.querySelectorAll('.settings-accordion-card').forEach(card => {
                card.classList.remove('open');
            });

            // Close modals / backdrops
            document.querySelectorAll('.modal, .modal-overlay, [id$="-modal"], [class*="modal"]').forEach(modal => {
                modal.classList.add('hidden');
                modal.classList.remove('open');
                modal.style.display = 'none';
            });
            document.querySelectorAll('[id$="-backdrop"], .backdrop, #modal-backdrop, #drawer-backdrop').forEach(bd => {
                bd.classList.add('hidden', 'opacity-0', 'pointer-events-none');
            });

            // Removes toasts, overlays, dynamic popups
            document.querySelectorAll('.toast, .notification-toast, #card-dynamic-popup, [id*="popup"], [class*="popup"]').forEach(el => {
                if (el.id === 'card-dynamic-popup' || el.classList.contains('toast') || el.classList.contains('notification-toast')) {
                    el.remove();
                } else {
                    el.classList.add('hidden');
                }
            });

            // Switches view back to 'subjects'
            if (window.OrganizadorApp && typeof window.OrganizadorApp.switchView === 'function') {
                try { window.OrganizadorApp.switchView('subjects'); } catch (_) {}
            } else if (window.SchoolApp && typeof window.SchoolApp.switchView === 'function') {
                try { window.SchoolApp.switchView('subjects'); } catch (_) {}
            } else {
                document.querySelectorAll('.view-section, [id^="view-"]').forEach(v => {
                    if (v.id === 'view-subjects') {
                        v.classList.remove('hidden');
                        v.style.display = '';
                    } else {
                        v.classList.add('hidden');
                        v.style.display = 'none';
                    }
                });
            }

            // Resets form inputs
            document.querySelectorAll('input, textarea, select').forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else if (input.type !== 'submit' && input.type !== 'button') {
                    input.value = '';
                }
            });

            document.documentElement.className = '';
        });
    } catch (_) {}
}

/**
 * Sets or removes the app initialized marker in localStorage
 */
async function setAppInitialized(page, isInitialized = true) {
    await page.evaluate(init => {
        if (init) {
            localStorage.setItem('org_escolar_initialized_v3', 'true');
        } else {
            localStorage.removeItem('org_escolar_initialized_v3');
        }
    }, isInitialized);
}

module.exports = {
    CHROME_PATH,
    PROJECT_ROOT,
    TARGET_URL,
    DEFAULT_FLAGS,
    launchBrowser,
    createPage,
    createCleanPage,
    assert,
    assertEqual,
    assertNotEqual,
    assertTrue,
    assertFalse,
    assertIncludes,
    assertMatch,
    waitSelector,
    safeClick,
    safeType,
    getElementText,
    getInputValue,
    isElementVisible,
    hasClass,
    getLocalStorageItem,
    setLocalStorageItem,
    simulateFileUpload,
    spyNotifications,
    getNotificationSpyStatus,
    waitForCanvasDownsample,
    simulateLongPress,
    resetPageState,
    setAppInitialized
};
