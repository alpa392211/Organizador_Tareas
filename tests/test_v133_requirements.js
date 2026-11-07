const helpers = require('./test_helpers');

async function run() {
    console.log('🚀 Iniciando Verificación Automatizada de Requerimientos v1.3.3...');
    const browser = await helpers.launchBrowser();
    const page = await helpers.createPage(browser, { viewport: { width: 1024, height: 768 } });

    try {
        // Cargar aplicación
        await page.goto(helpers.TARGET_URL, { waitUntil: 'networkidle0' });
        await page.evaluate(() => {
            window.StorageModule.initIfFirstTime();
            window.StorageModule.setOnboardingCompleted(true);
            window.StorageModule.setAcademicCycle('2026-08-01', '2026-12-15');
        });
        await page.reload({ waitUntil: 'networkidle0' });

        // TEST 1: Versión 1.3.3 en badge
        console.log('🔍 [TEST 1] Verificando Versión 1.3.3 en DOM...');
        const versionText = await page.evaluate(() => {
            return document.getElementById('settings-version-pill')?.textContent?.trim();
        });
        if (!versionText || !versionText.includes('1.3.3')) {
            throw new Error(`TEST 1 FALLÓ: Versión esperada 1.3.3 pero se obtuvo: ${versionText}`);
        }
        console.log(`  ✅ TEST 1 PASÓ: ${versionText}`);

        // TEST 2: Código Maestro Universal KRONOS99 desbloquea TODO
        console.log('🔍 [TEST 2] Probando Código Maestro Universal KRONOS99...');
        await page.evaluate(() => {
            window.App.switchView('secret-codes');
        });
        await new Promise(r => setTimeout(r, 200));

        // Digitar KRONOS99
        await page.type('#vault-code-p1', 'KRON', { delay: 30 });
        await page.type('#vault-code-p2', 'OS99', { delay: 30 });
        await page.click('#vault-submit-btn');

        // Esperar animación de desbloqueo y apertura de modal
        await page.waitForSelector('#vault-reveal-modal.active', { timeout: 3000 });
        const masterTitle = await page.evaluate(() => document.getElementById('vault-reveal-title')?.textContent);
        const actionLabel = await page.evaluate(() => document.getElementById('vault-reveal-action-btn')?.textContent?.trim());

        if (!masterTitle.includes('KRONOS99') && !masterTitle.includes('Llave Maestra')) {
            throw new Error(`TEST 2 FALLÓ: Título del modal no corresponde a llave maestra: ${masterTitle}`);
        }
        if (!actionLabel.includes('Explorar Bóveda Completa')) {
            throw new Error(`TEST 2 FALLÓ: Botón de acción no tiene etiqueta esperada: ${actionLabel}`);
        }

        // Click en el botón para cerrar modal y ver inventario
        await page.click('#vault-reveal-action-btn');
        await new Promise(r => setTimeout(r, 500));

        // Verificar que todos los códigos fueron desbloqueados
        const unlockedCount = await page.evaluate(() => {
            const unlocked = window.StorageModule.getUnlockedCodes();
            const totalCatalog = Object.keys(window.VaultCatalog).length;
            return { unlocked: unlocked.length, totalCatalog };
        });
        console.log(`  Desbloqueados ${unlockedCount.unlocked} de ${unlockedCount.totalCatalog} códigos en almacenamiento.`);
        if (unlockedCount.unlocked < unlockedCount.totalCatalog) {
            throw new Error(`TEST 2 FALLÓ: No se desbloquearon todos los códigos (${unlockedCount.unlocked}/${unlockedCount.totalCatalog})`);
        }
        console.log('  ✅ TEST 2 PASÓ: KRONOS99 desbloqueó con éxito el 100% de la bóveda.');

        // TEST 3: Bloqueo de Modo Claro con Tema Especial Activo (ej. SYNTHWAVE)
        console.log('🔍 [TEST 3] Verificando bloqueo de Modo Claro con tema especial activo...');
        await page.evaluate(() => {
            window.StorageModule.setActiveSpecialTheme('theme_synthwave');
            window.App.applyTheme('dark', true);
            window.App.applySpecialThemeFromStorage();
            window.App.switchView('settings');
        });
        await new Promise(r => setTimeout(r, 300));

        const lightBtnState = await page.evaluate(() => {
            const btn = document.getElementById('settings-theme-light');
            return {
                disabled: btn.disabled,
                hasOpacity: btn.classList.contains('opacity-40'),
                cursor: btn.classList.contains('cursor-not-allowed')
            };
        });

        if (!lightBtnState.disabled || !lightBtnState.hasOpacity) {
            throw new Error(`TEST 3 FALLÓ: El botón de modo claro debió estar bloqueado/disabled pero está: ${JSON.stringify(lightBtnState)}`);
        }

        // Intentar forzar tema claro vía toggleTheme o setTheme('light')
        const toggleAttempt = await page.evaluate(() => {
            window.App.toggleTheme();
            return {
                isDark: document.documentElement.classList.contains('dark'),
                toastMsg: document.getElementById('toast-container')?.textContent
            };
        });

        if (!toggleAttempt.isDark) {
            throw new Error('TEST 3 FALLÓ: Se permitió conmutar a modo claro estando en tema especial.');
        }
        console.log('  ✅ TEST 3 PASÓ: Modo Claro estrictamente bloqueado en tema especial.');

        // TEST 4: Excepción explícita para Gatos / Monocromático (GATITOS_ permite Modo Claro)
        console.log('🔍 [TEST 4] Verificando que modo gatos/monocromático SÍ permite Modo Claro...');
        await page.evaluate(() => {
            window.StorageModule.setActiveSpecialTheme('gray');
            window.StorageModule.setGrayModeEnabled(true);
            window.App.setTheme('light');
        });
        await new Promise(r => setTimeout(r, 300));

        const catsLightCheck = await page.evaluate(() => {
            const btn = document.getElementById('settings-theme-light');
            const isDark = document.documentElement.classList.contains('dark');
            return {
                disabled: btn.disabled,
                isDark: isDark
            };
        });

        if (catsLightCheck.disabled || catsLightCheck.isDark) {
            throw new Error(`TEST 4 FALLÓ: Modo gatos debió permitir modo claro pero disabled=${catsLightCheck.disabled}, isDark=${catsLightCheck.isDark}`);
        }
        console.log('  ✅ TEST 4 PASÓ: Modo gatos / monocromático permite Modo Claro correctamente.');

        // TEST 5: Unificación de fondo en modo oscuro y tema especial en el sidebar drawer y footer
        console.log('🔍 [TEST 5] Verificando unificación de colores en sidebar-drawer y footer...');
        // Probar en Modo Oscuro estándar
        await page.evaluate(() => {
            window.StorageModule.setActiveSpecialTheme('default');
            window.App.setTheme('dark');
        });
        await new Promise(r => setTimeout(r, 200));

        const standardDarkColors = await page.evaluate(() => {
            const drawer = document.getElementById('sidebar-drawer');
            const footer = document.getElementById('sidebar-drawer-footer');
            const drawerBg = window.getComputedStyle(drawer).backgroundColor;
            const footerBg = window.getComputedStyle(footer).backgroundColor;
            return { drawerBg, footerBg };
        });

        if (standardDarkColors.drawerBg !== standardDarkColors.footerBg) {
            throw new Error(`TEST 5 FALLÓ: Discrepancia de color en modo oscuro estándar: drawer=${standardDarkColors.drawerBg}, footer=${standardDarkColors.footerBg}`);
        }
        console.log(`  Drawer: ${standardDarkColors.drawerBg} | Footer: ${standardDarkColors.footerBg} (Coincidencia 100%)`);

        // Probar en Tema Especial Synthwave
        await page.evaluate(() => {
            window.StorageModule.setActiveSpecialTheme('theme_synthwave');
            window.App.applySpecialThemeFromStorage();
        });
        await new Promise(r => setTimeout(r, 200));

        const synthwaveColors = await page.evaluate(() => {
            const drawer = document.getElementById('sidebar-drawer');
            const footer = document.getElementById('sidebar-drawer-footer');
            const drawerBg = window.getComputedStyle(drawer).backgroundColor;
            const footerBg = window.getComputedStyle(footer).backgroundColor;
            return { drawerBg, footerBg };
        });

        if (synthwaveColors.drawerBg !== synthwaveColors.footerBg) {
            throw new Error(`TEST 5 FALLÓ: Discrepancia de color en Synthwave: drawer=${synthwaveColors.drawerBg}, footer=${synthwaveColors.footerBg}`);
        }
        console.log(`  Synthwave Drawer: ${synthwaveColors.drawerBg} | Synthwave Footer: ${synthwaveColors.footerBg} (Coincidencia 100%)`);
        console.log('  ✅ TEST 5 PASÓ: Fondo de sidebar drawer y footer 100% unificado.');

        console.log('\n🎉 ¡TODAS LAS PRUEBAS DE LA VERSIÓN 1.3.3 PASARON EXITOSAMENTE!');
    } finally {
        await browser.close();
    }
}

run().catch(err => {
    console.error('❌ Error en ejecución de pruebas:', err);
    process.exit(1);
});
