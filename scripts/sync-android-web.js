/**
 * sync-android-web.js
 * Prepara la carpeta web offline para el APK Android en android/app/src/main/assets/public/
 * - Copia unicamente index.html, css/, js/ y assets/ (excluye sw.js, manifest*, downloads/ y tests/).
 * - Marca <html data-platform="android-apk"> e inyecta window.__ORGANIZADOR_NATIVE_APK__ = true.
 * - Elimina por completo todo lo referente a instalacion PWA/web y el banner/tarjeta de descarga APK.
 * - Valida la sintaxis JS de todos los bloques <script> inline para garantizar arranque sin errores.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ANDROID_PUBLIC = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'public');

function copyDirRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function removeBlockBetween(html, startMarker, endMarker, keepEndMarker = false) {
    const startIdx = html.indexOf(startMarker);
    if (startIdx === -1) return html;
    const endIdx = html.indexOf(endMarker, startIdx);
    if (endIdx === -1) return html;
    const tailStart = keepEndMarker ? endIdx : endIdx + endMarker.length;
    return html.slice(0, startIdx) + html.slice(tailStart);
}

function validateInlineScripts(html) {
    const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let count = 0;
    while ((match = scriptRegex.exec(html)) !== null) {
        count++;
        const code = match[1].trim();
        if (!code) continue;
        try {
            // Valida sintaxis JS sin ejecutar el codigo
            new Function(code);
        } catch (err) {
            throw new Error(`Error de sintaxis en <script> inline #${count} del HTML del APK: ${err.message}`);
        }
    }
    return count;
}

function stripWebPwaFromHtml(rawHtml) {
    let html = rawHtml;

    // 1. Identificador nativo de plataforma Android APK
    html = html.replace(
        /<html([^>]*)>/i,
        (match, attrs) => `<html${attrs} data-platform="android-apk">`
    );
    html = html.replace(
        /<head>/i,
        '<head>\n    <script>window.__ORGANIZADOR_NATIVE_APK__ = true;</script>'
    );

    // 2. Eliminar manifest Web/PWA
    html = html.replace(/\s*<!-- PWA Web App Manifest -->\s*<link rel="manifest"[^>]*>\s*/gi, '\n');
    html = html.replace(/\s*<link rel="manifest"[^>]*>\s*/gi, '\n');

    // 3. Limpiar boton PWA y enlace de descarga APK dentro del drawer
    html = removeBlockBetween(
        html,
        '<!-- Opción PWA en Drawer -->',
        '</nav>',
        true
    );
    html = html.replace(/<button[^>]*id="drawer-pwa-install-btn"[\s\S]*?<\/button>/gi, '');
    html = html.replace(/<a[^>]*id="drawer-apk-download-link"[\s\S]*?<\/a>/gi, '');

    // 4. Eliminar tarjetas PWA y Descarga APK en Configuracion
    html = removeBlockBetween(
        html,
        '<!-- Tarjeta: Instalación de la Aplicación (PWA) -->',
        '<!-- VERSIÓN HASTA ABAJO',
        true
    );

    // 5. Eliminar banners flotantes de PWA y de descarga APK manteniendo intactos los comentarios de Toasts
    html = removeBlockBetween(
        html,
        '<!-- ========================================================= -->\r\n    <!-- BANNER FLOTANTE SUTIL DE INSTALACIÓN PWA',
        '<!-- ========================================== -->\r\n    <!-- CONTENEDOR DE TOASTS NOTIFICACIONES',
        true
    );
    html = removeBlockBetween(
        html,
        '<!-- ========================================================= -->\n    <!-- BANNER FLOTANTE SUTIL DE INSTALACIÓN PWA',
        '<!-- ========================================== -->\n    <!-- CONTENEDOR DE TOASTS NOTIFICACIONES',
        true
    );
    html = html.replace(/<div[^>]*id="pwa-floating-banner"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');
    html = html.replace(/<div[^>]*id="apk-download-banner"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');

    // 6. En el boton de reintento del splash, quitar unicamente el bloque if ('serviceWorker'...) preservando try/catch
    html = html.replace(
        /\s*if \('serviceWorker' in navigator && navigator\.serviceWorker\.getRegistrations\) \{[\s\S]*?\n\s*\}\r?\n/i,
        '\n'
    );

    return html;
}

function main() {
    fs.rmSync(ANDROID_PUBLIC, { recursive: true, force: true });
    fs.mkdirSync(ANDROID_PUBLIC, { recursive: true });

    for (const dirName of ['css', 'js', 'assets']) {
        copyDirRecursive(path.join(ROOT, dirName), path.join(ANDROID_PUBLIC, dirName));
    }
    const faviconSrc = path.join(ROOT, 'favicon.ico');
    if (fs.existsSync(faviconSrc)) {
        fs.copyFileSync(faviconSrc, path.join(ANDROID_PUBLIC, 'favicon.ico'));
    }

    const srcHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const apkHtml = stripWebPwaFromHtml(srcHtml);

    // Validar que TODOS los <script> inline compilen sin SyntaxError
    const scriptCount = validateInlineScripts(apkHtml);

    // Verificacion estricta de limpieza PWA/APK-download
    const forbidden = [
        'manifest.webmanifest',
        'pwa-floating-banner',
        'pwa-settings-card',
        'drawer-pwa-install-btn',
        'apk-download-banner',
        'apk-download-settings-card',
        'drawer-apk-download-link',
        'serviceWorker'
    ];
    const remaining = forbidden.filter(token => apkHtml.includes(token));
    if (remaining.length > 0) {
        throw new Error(`Aún permanecen marcadores web/PWA en el HTML del APK: ${remaining.join(', ')}`);
    }

    fs.writeFileSync(path.join(ANDROID_PUBLIC, 'index.html'), apkHtml, 'utf8');
    console.log(`Assets sincronizados para APK Android en: ${ANDROID_PUBLIC} (${scriptCount} scripts inline validados OK)`);
}

main();
