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
    setLocalStorageItem
};
