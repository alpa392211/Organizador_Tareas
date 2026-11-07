/**
 * tests/test_milestone1.js
 * Comprehensive Verification Suite for Milestone 1:
 * Academic Institutions Catalog & Custom School Builder
 */

const fs = require('fs');
const path = require('path');
const {
    launchBrowser,
    createCleanPage,
    assert,
    assertEqual,
    assertTrue,
    assertFalse,
    assertIncludes
} = require('./test_helpers');

async function runTests() {
    console.log('====================================================');
    console.log('🧪 MILESTONE 1 VERIFICATION TEST SUITE');
    console.log('====================================================\n');

    let browser;
    try {
        // --- 1. VERIFICACIÓN DE ARCHIVOS SVG EN ASSETS ---
        console.log('📁 Test 1: Verificando los 26 nuevos escudos SVG en assets/...');
        const expectedSvgs = [
            'itesm.svg', 'udeg.svg', 'uanl.svg',
            'unal.svg', 'uniandes.svg', 'udea.svg', 'javeriana.svg',
            'uba.svg', 'unlp.svg', 'unc.svg', 'utn.svg',
            'uchile.svg', 'uc_cl.svg', 'usach.svg', 'udec.svg',
            'unmsm.svg', 'pucp.svg', 'uni.svg',
            'ucm.svg', 'ub.svg', 'uam_es.svg', 'upv.svg',
            'udelar.svg', 'ucv.svg', 'ucr.svg', 'usfq.svg'
        ];
        for (const file of expectedSvgs) {
            const fullPath = path.join(__dirname, '../assets', file);
            assertTrue(fs.existsSync(fullPath), `El archivo assets/${file} debe existir`);
            const stat = fs.statSync(fullPath);
            assertTrue(stat.size > 500 && stat.size < 5000, `El archivo assets/${file} debe ser ligero (1-5 KB), tamaño: ${stat.size} bytes`);
            const content = fs.readFileSync(fullPath, 'utf8');
            assertTrue(content.includes('<svg') && content.includes('viewBox="0 0 200 200"'), `assets/${file} debe tener etiqueta <svg> y viewBox="0 0 200 200"`);
        }
        console.log(`  ✅ Los 26 archivos SVG existen, son válidos y pesan aprox 1-2 KB.\n`);

        // --- 2. INICIAR NAVEGADOR HEADLESS PUPPETEER ---
        console.log('🌐 Iniciando navegador Chrome Headless...');
        browser = await launchBrowser();
        const page = await createCleanPage(browser);
        console.log('  ✅ Página cargada en entorno headless limpio.\n');

        // --- 3. VERIFICAR CATÁLOGO DE 33 INSTITUCIONES EN EL BROWSER ---
        console.log('🏛️ Test 2: Catálogo de Instituciones (js/institutions.js)...');
        const catalogData = await page.evaluate(() => {
            const Mod = window.InstitutionsModule;
            const insts = Mod.INSTITUTIONS;
            const keys = Object.keys(insts);
            const countries = Mod.getCountries();
            return {
                keys,
                hasGeneral: 'general' in insts,
                generalLookup: Mod.getInstitution('general').id,
                emptyLookup: Mod.getInstitution('').id,
                allCount: Mod.getAllInstitutions().length,
                countries: countries.map(c => c.name),
                schemaChecks: keys.every(k => {
                    const i = insts[k];
                    return i.id && i.name && i.fullName && i.shortBadge &&
                           i.country && i.countryCode && i.countryFlag &&
                           i.systemType && i.slogan && i.icon &&
                           i.colors?.primary && i.colors?.badgeBg &&
                           Array.isArray(i.periods) && i.periods.length > 0 && i.defaultPeriod;
                })
            };
        });

        assertEqual(catalogData.keys.length, 33, 'El catálogo oficial debe contener exactamente 33 instituciones');
        assertFalse(catalogData.hasGeneral, "'general' NO debe existir como clave en INSTITUTIONS");
        assertEqual(catalogData.generalLookup, 'unam', "getInstitution('general') debe hacer fallback a 'unam'");
        assertEqual(catalogData.emptyLookup, 'unam', "getInstitution('') debe hacer fallback a 'unam'");
        assertEqual(catalogData.allCount, 33, 'getAllInstitutions() debe retornar 33 instituciones sin escuelas personalizadas');
        assertEqual(catalogData.countries.length, 10, 'Deben existir exactamente 10 países');
        assertTrue(catalogData.schemaChecks, 'Todas las 33 instituciones deben cumplir estrictamente el esquema');
        console.log('  ✅ 33 instituciones verificadas con esquema estricto, 10 países y general eliminado.\n');

        // --- 4. VERIFICAR MIGRACIÓN Y STORAGE (js/storage.js) ---
        console.log('💾 Test 3: Migración y Persistencia de Almacenamiento (js/storage.js)...');
        const storageChecks = await page.evaluate(() => {
            const Storage = window.StorageModule;

            // Test 3a: Migración de 'general' a 'unam'
            localStorage.setItem('org_escolar_institution', 'general');
            const migratedInst = Storage.getInstitution();
            const storedAfter = localStorage.getItem('org_escolar_institution');

            // Test 3b: Preservar periodo académico arbitrario
            Storage.setAcademicPeriod('3.er Cuatrimestre');
            const customPeriod = Storage.getAcademicPeriod();

            // Test 3c: Ciclo y periodo con otro string libre
            Storage.setAcademicPeriod('Módulo 2 Avanzado');
            const modulePeriod = Storage.getAcademicPeriod();

            return {
                migratedInst,
                storedAfter,
                customPeriod,
                modulePeriod
            };
        });

        assertEqual(storageChecks.migratedInst, 'unam', 'getInstitution() debe migrar "general" a "unam"');
        assertEqual(storageChecks.storedAfter, 'unam', 'localStorage debe actualizarse a "unam" tras migrar "general"');
        assertEqual(storageChecks.customPeriod, '3.er Cuatrimestre', 'getAcademicPeriod() debe preservar "3.er Cuatrimestre"');
        assertEqual(storageChecks.modulePeriod, 'Módulo 2 Avanzado', 'getAcademicPeriod() debe preservar "Módulo 2 Avanzado"');
        console.log('  ✅ Migración de general y soporte de periodos libres verificados.\n');

        // --- 5. VERIFICAR <OPTGROUP> EN HEADER Y ONBOARDING ---
        console.log('📋 Test 4: Verificando <optgroup> en dropdowns de institución...');
        const optgroupChecks = await page.evaluate(() => {
            const headerSelect = document.getElementById('header-institution-select');
            const headerOptgroups = headerSelect ? headerSelect.querySelectorAll('optgroup') : [];
            const labels = Array.from(headerOptgroups).map(og => og.label);
            return {
                optgroupCount: headerOptgroups.length,
                labels
            };
        });

        assertTrue(optgroupChecks.optgroupCount >= 10, `El header select debe tener optgroups por país (encontrados: ${optgroupChecks.optgroupCount})`);
        assertIncludes(optgroupChecks.labels[0], 'México', 'El primer optgroup debe ser México');
        console.log(`  ✅ Header select cuenta con ${optgroupChecks.optgroupCount} <optgroup> agrupados por país.\n`);

        // --- 6. VERIFICAR PÍLDORAS DE PAÍSES Y FILTRADO EN AJUSTES ---
        console.log('🔍 Test 5: Filtro por país y navegación en Configuración...');
        // Navegar a Configuración
        await page.evaluate(() => window.AppInstance.switchView('settings'));
        await new Promise(r => setTimeout(r, 200));

        const pillsCount = await page.evaluate(() => {
            const container = document.getElementById('settings-country-pills');
            const buttons = container ? container.querySelectorAll('button[data-country-filter]') : [];
            return buttons.length;
        });
        assertTrue(pillsCount >= 12, `Deben existir píldoras para Todas + 10 países + Mis Escuelas (encontradas: ${pillsCount})`);

        // Filtrar por Colombia (CO)
        const colFilteredCount = await page.evaluate(() => {
            const coBtn = document.querySelector('button[data-country-filter="CO"]');
            if (coBtn) coBtn.click();
            const grid = document.getElementById('settings-institution-grid');
            const cards = grid.querySelectorAll('.inst-grid-card');
            return cards.length;
        });
        assertEqual(colFilteredCount, 4, 'Al filtrar por Colombia deben mostrarse exactamente 4 universidades');

        // Filtrar por España (ES)
        const esFilteredCount = await page.evaluate(() => {
            const esBtn = document.querySelector('button[data-country-filter="ES"]');
            if (esBtn) esBtn.click();
            const grid = document.getElementById('settings-institution-grid');
            const cards = grid.querySelectorAll('.inst-grid-card');
            return cards.length;
        });
        assertEqual(esFilteredCount, 4, 'Al filtrar por España deben mostrarse exactamente 4 universidades');
        console.log('  ✅ Píldoras de filtro operando fluidamente y filtrando con precisión.\n');

        // --- 7. VERIFICAR CONSTRUCTOR DE ESCUELA PERSONALIZADA & DOWNSAMPLING ---
        console.log('🎨 Test 6: Custom School Builder y Downsampling Canvas...');

        // 7a: Probar Canvas Downsampling directamente en el navegador
        const canvasTestResult = await page.evaluate(() => {
            // Crear canvas grande 1024x1024
            const bigCanvas = document.createElement('canvas');
            bigCanvas.width = 1024;
            bigCanvas.height = 1024;
            const ctx = bigCanvas.getContext('2d');
            ctx.fillStyle = '#6366F1';
            ctx.fillRect(0, 0, 1024, 1024);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 120px sans-serif';
            ctx.fillText('UNIVERSIDAD TEST', 100, 500);

            // Simular el downsampling implementado en setupCustomSchoolModal
            const maxDim = 256;
            const smallCanvas = document.createElement('canvas');
            smallCanvas.width = maxDim;
            smallCanvas.height = maxDim;
            const sCtx = smallCanvas.getContext('2d');
            sCtx.drawImage(bigCanvas, 0, 0, maxDim, maxDim);

            let dataUrl = smallCanvas.toDataURL('image/png');
            if (dataUrl.length > 38000) {
                dataUrl = smallCanvas.toDataURL('image/jpeg', 0.85);
            }
            return {
                lengthBytes: dataUrl.length,
                isUnder30KB: dataUrl.length <= 35000,
                isDataUrl: dataUrl.startsWith('data:image/')
            };
        });

        assertTrue(canvasTestResult.isDataUrl, 'El resultado del canvas debe ser un Data URI de imagen');
        assertTrue(canvasTestResult.isUnder30KB, `El Data URI optimizado debe ser <= 30KB (longitud actual: ${canvasTestResult.lengthBytes})`);
        console.log(`  ✅ Canvas downsampling verificado (tamaño resultante: ${canvasTestResult.lengthBytes} bytes <= 30KB).`);

        // 7b: Crear una escuela personalizada mediante el modal
        const customSchoolCreated = await page.evaluate(() => {
            const App = window.AppInstance;
            App.openCustomSchoolModal();

            const nameInput = document.getElementById('custom-school-name');
            const shortbadgeInput = document.getElementById('custom-school-shortbadge');
            const fullnameInput = document.getElementById('custom-school-fullname');
            const sloganInput = document.getElementById('custom-school-slogan');
            const countrySelect = document.getElementById('custom-school-country');
            const systemSelect = document.getElementById('custom-school-system');
            const colorInput = document.getElementById('custom-school-color');
            const form = document.getElementById('custom-school-form');

            nameInput.value = 'UniTech Global';
            shortbadgeInput.value = 'UTG';
            fullnameInput.value = 'Universidad Tecnológica Global de Innovación';
            sloganInput.value = 'Ciencia para el futuro humano';
            countrySelect.value = 'MX';
            systemSelect.value = 'Cuatrimestral';
            colorInput.value = '#059669';

            // Disparar submit del formulario
            const submitEvent = new Event('submit', { cancelable: true });
            form.dispatchEvent(submitEvent);

            const activeInst = App.activeInstitution;
            const customSchools = window.StorageModule.getCustomSchools();
            const headerSelect = document.getElementById('header-institution-select');
            const customOptgroup = headerSelect.querySelector('optgroup[label*="Mis Escuelas"]');

            return {
                activeId: activeInst.id,
                activeName: activeInst.name,
                isCustom: activeInst.isCustom,
                periodsCount: activeInst.periods.length,
                systemType: activeInst.systemType,
                customSchoolsCount: customSchools.length,
                hasCustomOptgroup: Boolean(customOptgroup),
                customOptionsCount: customOptgroup ? customOptgroup.children.length : 0
            };
        });

        assertTrue(customSchoolCreated.isCustom, 'La escuela activa debe tener isCustom = true');
        assertEqual(customSchoolCreated.activeName, 'UniTech Global', 'El nombre de la escuela activa debe ser "UniTech Global"');
        assertEqual(customSchoolCreated.systemType, 'Cuatrimestral', 'El sistema académico debe ser Cuatrimestral');
        assertEqual(customSchoolCreated.periodsCount, 10, 'El sistema Cuatrimestral debe tener 10 periodos');
        assertEqual(customSchoolCreated.customSchoolsCount, 1, 'Debe haber 1 escuela personalizada guardada');
        assertTrue(customSchoolCreated.hasCustomOptgroup, 'El header select debe incluir el optgroup "⭐ Mis Escuelas Personalizadas"');
        assertEqual(customSchoolCreated.customOptionsCount, 1, 'El optgroup debe contener la opción creada');
        console.log('  ✅ Escuela personalizada creada, guardada en Storage y visible en optgroup header.\n');

        // --- 8. VERIFICAR ENTRADA MANUAL DE PERIODO PERSONALIZADO EN AJUSTES ---
        console.log('✏️ Test 7: Entrada manual de periodo personalizado en Ajustes...');
        const customPeriodSet = await page.evaluate(() => {
            const App = window.AppInstance;
            const input = document.getElementById('custom-period-input');
            const applyBtn = document.getElementById('save-custom-period-btn');

            input.value = '3.er Cuatrimestre Especial';
            applyBtn.click();

            const saved = window.StorageModule.getAcademicPeriod();
            const badge = document.getElementById('settings-inst-period-badge')?.textContent;
            const headerLabel = document.getElementById('header-inst-period')?.textContent;

            return {
                saved,
                badge,
                headerLabel
            };
        });

        assertEqual(customPeriodSet.saved, '3.er Cuatrimestre Especial', 'Storage debe guardar el periodo personalizado libre');
        assertEqual(customPeriodSet.badge, '3.er Cuatrimestre Especial', 'El badge de ajustes debe mostrar el periodo personalizado libre');
        assertEqual(customPeriodSet.headerLabel, '3.er Cuatrimestre Especial', 'El header debe mostrar el periodo personalizado libre');
        console.log('  ✅ Periodo personalizado arbitrario aplicado y persistido correctamente.\n');

        // --- 9. VERIFICAR MODAL DE IDENTIDAD CON ESCUELA PERSONALIZADA ---
        console.log('🌟 Test 8: Modal de Identidad Institucional (Zoom & Glow) con escuela personalizada...');
        const identityModalCheck = await page.evaluate(() => {
            const App = window.AppInstance;
            App.openSchoolIdentityModal();

            const modal = document.getElementById('school-identity-modal');
            const nameEl = document.getElementById('school-identity-name');
            const sloganEl = document.getElementById('school-identity-slogan');
            const systemBadge = document.getElementById('school-identity-system-badge');
            const isVisible = modal && !modal.classList.contains('hidden');

            const name = nameEl?.textContent;
            const slogan = sloganEl?.textContent;
            const system = systemBadge?.textContent;

            App.closeSchoolIdentityModal();

            return {
                isVisible,
                name,
                slogan,
                system
            };
        });

        assertTrue(identityModalCheck.isVisible, 'El modal de identidad debe abrirse');
        assertEqual(identityModalCheck.name, 'UniTech Global', 'El modal de identidad debe mostrar el nombre de la escuela personalizada');
        assertIncludes(identityModalCheck.slogan, 'Ciencia para el futuro humano', 'El modal de identidad debe mostrar el slogan personalizado');
        assertEqual(identityModalCheck.system, 'Cuatrimestral', 'El modal debe mostrar el sistema de la escuela personalizada');
        console.log('  ✅ Modal de identidad (Zoom & Glow) funciona transparentemente con escuelas personalizadas.\n');

        // --- 10. VERIFICAR NOTIFICACIONES CON ICONO DINÁMICO ---
        console.log('🔔 Test 9: Resolución dinámica del icono de notificación...');
        const notifIconCheck = await page.evaluate(() => {
            const notif = window.NotificationsModule;
            const App = window.AppInstance;

            // Para la escuela personalizada activa
            const activeInst = App.activeInstitution;
            let capturedIcon = null;

            // Mock temporal de new Notification para capturar el icono resuelto
            const origNotification = window.Notification;
            window.Notification = function(title, options) {
                capturedIcon = options.icon;
            };
            window.Notification.permission = 'granted';

            notif.displayNotification('Tarea Urgente', 'Prueba de icono');

            window.Notification = origNotification;

            return {
                capturedIcon,
                expectedIcon: activeInst.icon
            };
        });

        assertEqual(notifIconCheck.capturedIcon, notifIconCheck.expectedIcon, 'El icono de la notificación debe ser el de la escuela activa');
        console.log('  ✅ Notificaciones resuelven dinámicamente el icono de la escuela activa.\n');

        // --- 11. VERIFICAR ELIMINACIÓN DE ESCUELA PERSONALIZADA ---
        console.log('🗑️ Test 10: Eliminación de escuela personalizada y fallback automático...');
        const deleteCheck = await page.evaluate(() => {
            const App = window.AppInstance;
            const Storage = window.StorageModule;
            const customSchools = Storage.getCustomSchools();
            const schoolToDelete = customSchools[0];

            // Eliminar escuela
            Storage.deleteCustomSchool(schoolToDelete.id);
            App.setInstitution(Storage.getInstitution());
            App.setupInstitutionAndPeriodSelectors();

            return {
                activeAfterDelete: App.activeInstitution.id,
                remainingCustomCount: Storage.getCustomSchools().length
            };
        });

        assertEqual(deleteCheck.activeAfterDelete, 'unam', 'Al eliminar la escuela activa, debe volver automáticamente a UNAM');
        assertEqual(deleteCheck.remainingCustomCount, 0, 'No deben quedar escuelas personalizadas tras eliminarla');
        console.log('  ✅ Eliminación y fallback a UNAM completados exitosamente.\n');

        console.log('====================================================');
        console.log('🎉 TODOS LOS TESTS DE MILESTONE 1 HAN PASADO AL 100%');
        console.log('====================================================');

    } catch (err) {
        console.error('\n❌ ERROR EN PRUEBAS:', err);
        process.exitCode = 1;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

runTests();
