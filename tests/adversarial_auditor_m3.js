/**
 * adversarial_auditor_m3.js
 * Independent forensic adversarial verification for Milestone 3.
 */

const assert = require('assert');
const helpers = require('./test_helpers');

(async () => {
    console.log('=== FORENSIC ADVERSARIAL AUDIT: MILESTONE 3 ===\n');
    const browser = await helpers.launchBrowser();
    let checks = 0;
    let passed = 0;

    function check(cond, desc) {
        checks++;
        try {
            assert(cond, desc);
            passed++;
            console.log(`  [PASS] ${desc}`);
        } catch (e) {
            console.error(`  [FAIL] ${desc}: ${e.message}`);
        }
    }

    try {
        const page = await helpers.createPage(browser, { viewport: { width: 375, height: 812 } });

        // 1. Static HTML Audit: No <select> in #cycle-setup-modal
        const htmlAudit = await page.evaluate(() => {
            const modal = document.getElementById('cycle-setup-modal');
            if (!modal) return { exists: false };
            const selects = modal.querySelectorAll('select');
            const hiddenSelects = modal.querySelectorAll('select[style*="display: none"], select.hidden');
            return {
                exists: true,
                totalSelects: selects.length,
                hiddenSelects: hiddenSelects.length
            };
        });

        check(htmlAudit.exists, 'Welcome modal exists in DOM');
        check(htmlAudit.totalSelects === 0, 'Zero <select> tags anywhere inside #cycle-setup-modal');
        check(htmlAudit.hiddenSelects === 0, 'Zero disguised/hidden <select> tags in #cycle-setup-modal');

        // 2. Open Welcome Modal
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('org_escolar_initialized_v3', 'true');
            window.app.openCycleWelcomeModal();
        });
        await new Promise(r => setTimeout(r, 300));

        // 3. Test "Omitir" / Skip lock transition
        await page.click('#welcome-skip-school-btn');
        await new Promise(r => setTimeout(r, 200));

        let state = await page.evaluate(() => {
            const container = document.getElementById('welcome-period-container');
            const msg = document.getElementById('welcome-period-locked-msg');
            const chips = document.getElementById('welcome-period-chips');
            const box = document.getElementById('welcome-selected-school-box');
            const badge = document.getElementById('welcome-selected-period-badge');

            return {
                lockedClasses: container.classList.contains('pointer-events-none') &&
                               container.classList.contains('opacity-40') &&
                               container.classList.contains('cursor-not-allowed'),
                msgVisible: !msg.classList.contains('hidden'),
                chipsEmpty: chips.children.length === 0,
                boxOmitted: box.textContent.includes('Sin institución') && box.textContent.includes('Omitida'),
                badgeLocked: badge.textContent.includes('Bloqueado')
            };
        });

        check(state.lockedClasses, 'Period container has pointer-events-none, opacity-40, cursor-not-allowed when skipped');
        check(state.msgVisible, 'Locked guidance message is visible when skipped');
        check(state.chipsEmpty, 'Period chips container is completely cleared when locked');
        check(state.boxOmitted, 'Selected school box displays dashed empty state with "Omitida" badge');
        check(state.badgeLocked, 'Period badge indicates "Bloqueado"');

        // 4. Test selecting an institution unlocks periods
        await page.evaluate(() => {
            const card = document.querySelector('.welcome-school-card[data-inst-id="ipn"]');
            if (card) card.click();
        });
        await new Promise(r => setTimeout(r, 200));

        state = await page.evaluate(() => {
            const container = document.getElementById('welcome-period-container');
            const msg = document.getElementById('welcome-period-locked-msg');
            const chips = document.querySelectorAll('.welcome-period-chip');
            const box = document.getElementById('welcome-selected-school-box');
            const unselectBtn = document.getElementById('welcome-unselect-school-btn');

            return {
                unlocked: !container.classList.contains('pointer-events-none') &&
                          !container.classList.contains('opacity-40'),
                msgHidden: msg.classList.contains('hidden'),
                chipCount: chips.length,
                hasUnselectBtn: Boolean(unselectBtn),
                boxHasIpn: box.textContent.includes('IPN')
            };
        });

        check(state.unlocked, 'Period container unlocks when IPN is selected');
        check(state.msgHidden, 'Lock message is hidden when IPN is selected');
        check(state.chipCount > 5, 'IPN renders period chips');
        check(state.hasUnselectBtn, 'Selected school box has "✕ Omitir" button');
        check(state.boxHasIpn, 'Selected school box displays IPN');

        // 5. Test clicking "✕ Omitir" locks again
        await page.click('#welcome-unselect-school-btn');
        await new Promise(r => setTimeout(r, 200));

        state = await page.evaluate(() => {
            const container = document.getElementById('welcome-period-container');
            const msg = document.getElementById('welcome-period-locked-msg');
            return {
                relocked: container.classList.contains('pointer-events-none') &&
                          container.classList.contains('opacity-40'),
                msgVisible: !msg.classList.contains('hidden')
            };
        });

        check(state.relocked, 'Clicking "✕ Omitir" re-engages the lock state on period container');
        check(state.msgVisible, 'Clicking "✕ Omitir" displays lock message again');

        // 6. Test submitting with "Configurar fechas después (Ciclo Provisional)" when skipped
        await page.click('#welcome-cycle-later-btn');
        await new Promise(r => setTimeout(r, 400));

        const postSubmitState = await page.evaluate(() => {
            const modal = document.getElementById('cycle-setup-modal');
            const storage = window.StorageModule;
            const instModule = window.InstitutionsModule;
            const headerName = document.getElementById('header-inst-name')?.textContent;
            const headerPeriod = document.getElementById('header-inst-period')?.textContent;
            const headerLogo = document.getElementById('header-inst-logo')?.innerHTML;

            const inst = instModule.getInstitution(storage.getInstitution());

            return {
                modalClosed: modal.classList.contains('hidden'),
                isSkipped: storage.isSchoolSkipped(),
                storedInst: storage.getInstitution(),
                storedPeriod: storage.getAcademicPeriod(),
                headerName,
                headerPeriod,
                hasCapLogo: headerLogo.includes('🎓'),
                instId: inst.id,
                instIsUnconfigured: inst.isUnconfigured
            };
        });

        check(postSubmitState.modalClosed, 'Modal closes after clicking provisional dates button');
        check(postSubmitState.isSkipped, 'Storage.isSchoolSkipped() is true');
        check(postSubmitState.storedInst === 'unconfigured', 'Storage.getInstitution() is "unconfigured"');
        check(postSubmitState.storedPeriod === 'Sin periodo', 'Storage.getAcademicPeriod() is "Sin periodo"');
        check(postSubmitState.headerName === 'Sin institución', 'Header displays "Sin institución"');
        check(postSubmitState.headerPeriod === 'Sin periodo', 'Header displays "Sin periodo"');
        check(postSubmitState.hasCapLogo, 'Header displays graduation cap 🎓 icon');
        check(postSubmitState.instIsUnconfigured === true, 'InstitutionsModule returns unconfigured contract object');

        // 7. Verify no errors when re-opening welcome modal when already skipped
        const reopenAudit = await page.evaluate(() => {
            try {
                window.app.openCycleWelcomeModal();
                const container = document.getElementById('welcome-period-container');
                const isLocked = container.classList.contains('pointer-events-none');
                return { success: true, isLocked };
            } catch (err) {
                return { success: false, error: err.message };
            }
        });

        check(reopenAudit.success, 'Re-opening welcome modal when skipped throws no errors');
        check(reopenAudit.isLocked, 'Re-opening welcome modal preserves locked period state for unconfigured school');

        // Close welcome modal
        await page.evaluate(() => {
            window.app.closeCycleWelcomeModal();
        });
        await new Promise(r => setTimeout(r, 300));

        // 8. Re-configure school from settings and verify recovery
        await page.evaluate(() => {
            window.app.switchView('settings');
        });
        await new Promise(r => setTimeout(r, 200));

        await page.evaluate(() => {
            const uamBtn = document.querySelector('#settings-institution-grid button[data-inst-id="uam"]');
            if (uamBtn) uamBtn.click();
        });
        await new Promise(r => setTimeout(r, 200));

        const recoveryState = await page.evaluate(() => {
            const storage = window.StorageModule;
            return {
                isSkipped: storage.isSchoolSkipped(),
                activeInst: storage.getInstitution(),
                headerName: document.getElementById('header-inst-name')?.textContent
            };
        });

        check(recoveryState.isSkipped === false, 'Selecting UAM in settings clears isSchoolSkipped to false');
        check(recoveryState.activeInst === 'uam', 'Active institution updated to uam');
        check(recoveryState.headerName.includes('UAM'), 'Header updated to UAM');

    } catch (e) {
        console.error('Fatal in adversarial test:', e);
    } finally {
        await browser.close();
    }

    console.log(`\nAdversarial checks: ${passed} / ${checks}`);
    if (passed === checks && checks > 0) {
        console.log('RESULT: PASS (All adversarial stress tests clean)');
        process.exit(0);
    } else {
        console.log('RESULT: FAIL');
        process.exit(1);
    }
})();
