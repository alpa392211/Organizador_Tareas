const helpers = require('./test_helpers');

async function testRockets() {
    console.log('🧪 Iniciando verificación de cohetes Apollo 11...');
    const browser = await helpers.launchBrowser();
    const page = await helpers.createPage(browser, { viewport: { width: 1024, height: 768 } });

    try {
        await page.goto(helpers.TARGET_URL, { waitUntil: 'networkidle0' });
        await page.evaluate(() => {
            window.StorageModule.initIfFirstTime();
            window.StorageModule.setOnboardingCompleted(true);
            window.StorageModule.setAcademicCycle('2026-08-01', '2026-12-15');
            window.StorageModule.unlockCode('APOLLO11');
        });
        await page.reload({ waitUntil: 'networkidle0' });

        // 1. Estado inicial sin tema activo: 0 cohetes
        let totalRockets = await page.evaluate(() => document.querySelectorAll('.apollo-rocket-badge').length);
        console.log(`Estado inicial (tema default): ${totalRockets} cohetes.`);
        if (totalRockets !== 0) {
            throw new Error(`Se esperaban 0 cohetes en estado inicial pero hay ${totalRockets}`);
        }

        // 2. Activar modo Apollo 11
        console.log('🚀 Activando modo Apollo 11...');
        await page.evaluate(() => {
            window.StorageModule.setActiveSpecialTheme('theme_apollo');
            window.StorageModule.setApolloRocketsEnabled(true);
            window.App.applySpecialThemeFromStorage();
        });
        await new Promise(r => setTimeout(r, 200));

        // Verificar botón inferior
        const bottomBtnRockets = await page.evaluate(() => {
            const btn = document.getElementById('bottom-main-action-btn');
            const circle = document.getElementById('bottom-main-circle');
            const btnBadges = btn ? btn.querySelectorAll('.apollo-rocket-badge').length : 0;
            const circleBadges = circle ? circle.querySelectorAll('.apollo-rocket-badge').length : 0;
            const allBadges = document.querySelectorAll('.apollo-rocket-badge').length;
            return { btnBadges, circleBadges, allBadges };
        });

        console.log(`Con Apollo activo:`);
        console.log(`  - Cohetes en #bottom-main-action-btn: ${bottomBtnRockets.btnBadges}`);
        console.log(`  - Cohetes en #bottom-main-circle: ${bottomBtnRockets.circleBadges}`);
        console.log(`  - Total de cohetes en la app: ${bottomBtnRockets.allBadges}`);

        if (bottomBtnRockets.btnBadges !== 1) {
            throw new Error(`ERROR: Se esperaba EXACTAMENTE 1 cohete en el botón inferior, pero hay ${bottomBtnRockets.btnBadges}`);
        }
        if (bottomBtnRockets.circleBadges !== 0) {
            throw new Error(`ERROR: #bottom-main-circle no debería tener un cohete adicional (duplicado)`);
        }
        console.log('✅ Verificación 1 PASÓ: Exactamente 1 cohete en el botón inferior con Apollo activo.');

        // 3. Desactivar modo Apollo 11
        console.log('🛑 Desactivando modo Apollo 11...');
        await page.evaluate(() => {
            window.StorageModule.setActiveSpecialTheme('default');
            window.StorageModule.setApolloRocketsEnabled(false);
            window.App.applySpecialThemeFromStorage();
        });
        await new Promise(r => setTimeout(r, 200));

        const deactivatedRockets = await page.evaluate(() => {
            const btn = document.getElementById('bottom-main-action-btn');
            const btnBadges = btn ? btn.querySelectorAll('.apollo-rocket-badge').length : 0;
            const allBadges = document.querySelectorAll('.apollo-rocket-badge').length;
            return { btnBadges, allBadges };
        });

        console.log(`Con Apollo desactivado:`);
        console.log(`  - Cohetes en #bottom-main-action-btn: ${deactivatedRockets.btnBadges}`);
        console.log(`  - Total de cohetes en la app: ${deactivatedRockets.allBadges}`);

        if (deactivatedRockets.btnBadges !== 0 || deactivatedRockets.allBadges !== 0) {
            throw new Error(`ERROR: Todos los cohetes debieron desaparecer, pero quedan ${deactivatedRockets.btnBadges} en botón y ${deactivatedRockets.allBadges} en total`);
        }
        console.log('✅ Verificación 2 PASÓ: Todos los cohetes desaparecieron completamente al desactivar.');

        // 4. Prueba interactiva a través de la interfaz de la Bóveda (click real en botón toggle)
        console.log('🔄 Probando interacción real en la vista de Bóveda...');
        await page.evaluate(() => {
            window.App.switchView('secret-codes');
        });
        await new Promise(r => setTimeout(r, 200));

        // Click en Activar en la tarjeta de APOLLO11
        await page.click('[data-vault-toggle="APOLLO11"]');
        await new Promise(r => setTimeout(r, 300));

        let uiActivatedCount = await page.evaluate(() => {
            const btn = document.getElementById('bottom-main-action-btn');
            return btn ? btn.querySelectorAll('.apollo-rocket-badge').length : 0;
        });
        console.log(`Activado vía UI Bóveda -> cohetes en botón inferior: ${uiActivatedCount}`);
        if (uiActivatedCount !== 1) {
            throw new Error(`ERROR vía UI: Se esperaba 1 cohete pero hay ${uiActivatedCount}`);
        }

        // Click en Desactivar en la tarjeta de APOLLO11
        await page.click('[data-vault-toggle="APOLLO11"]');
        await new Promise(r => setTimeout(r, 300));

        let uiDeactivatedCount = await page.evaluate(() => {
            const btn = document.getElementById('bottom-main-action-btn');
            const total = document.querySelectorAll('.apollo-rocket-badge').length;
            return { btnCount: btn ? btn.querySelectorAll('.apollo-rocket-badge').length : 0, total };
        });
        console.log(`Desactivado vía UI Bóveda -> cohetes en botón inferior: ${uiDeactivatedCount.btnCount}, total: ${uiDeactivatedCount.total}`);
        if (uiDeactivatedCount.btnCount !== 0 || uiDeactivatedCount.total !== 0) {
            throw new Error(`ERROR vía UI: Debieron quedar 0 cohetes pero quedan ${uiDeactivatedCount.btnCount}`);
        }
        console.log('✅ Verificación 3 PASÓ: Toggle interactivo en Bóveda funciona con 1 cohete al activar y 0 al desactivar.');

        console.log('\n🎉 ¡TODAS LAS PRUEBAS DE COHETES PASARON EXITOSAMENTE!');
    } finally {
        await browser.close();
    }
}

testRockets().catch(err => {
    console.error('❌ Error en prueba de cohetes:', err);
    process.exit(1);
});
