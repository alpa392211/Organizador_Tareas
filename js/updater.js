/**
 * updater.js - Comprobador e Instalador Remoto de Actualizaciones APK (v1.7.1)
 * Lee version.json desde el repositorio oficial de GitHub y, en Android nativo,
 * descarga el APK verificando su SHA-256 con progreso en tiempo real.
 */
(() => {
    'use strict';

    const CURRENT_VERSION = '1.7.1';
    const CURRENT_VERSION_CODE = 171;
    const MANIFEST_URL = 'https://raw.githubusercontent.com/alpa392211/Organizador_Tareas/main/version.json';
    const LAST_CHECK_KEY = 'org_escolar_updater_last_check_v1';
    const CHECK_COOLDOWN_MS = 12 * 60 * 60 * 1000;

    let pendingUpdateInfo = null;
    let isManualCheck = false;
    let isChecking = false;

    function compareVersions(a, b) {
        const pa = String(a || '0').replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
        const pb = String(b || '0').replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
        const len = Math.max(pa.length, pb.length, 3);
        for (let i = 0; i < len; i++) {
            const va = pa[i] || 0;
            const vb = pb[i] || 0;
            if (va > vb) return 1;
            if (va < vb) return -1;
        }
        return 0;
    }

    function hasNativeBridge() {
        return Boolean(
            typeof window !== 'undefined' &&
            window.AndroidWidgetBridge &&
            typeof window.AndroidWidgetBridge.checkForAppUpdate === 'function'
        );
    }

    function setSettingsStatus(text, tone = 'neutral') {
        const badge = document.getElementById('settings-update-status-pill');
        if (!badge) return;
        badge.textContent = text;
        if (tone === 'available') {
            badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0';
        } else if (tone === 'checking') {
            badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0';
        } else if (tone === 'error') {
            badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0';
        } else {
            badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0';
        }
    }

    function closeUpdateModal() {
        const modal = document.getElementById('app-update-modal');
        if (!modal) return;
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            if (!document.querySelector('.modal-overlay.active:not(.hidden)')) {
                document.body.classList.remove('overflow-hidden');
            }
        }, 180);
    }

    function openUpdateModal(info) {
        const modal = document.getElementById('app-update-modal');
        if (!modal || !info) return;
        pendingUpdateInfo = info;

        const verPill = document.getElementById('app-update-version-pill');
        const notesList = document.getElementById('app-update-changelog-list');
        const progressBox = document.getElementById('app-update-progress-wrap');
        const progressBar = document.getElementById('app-update-progress-bar');
        const progressLabel = document.getElementById('app-update-progress-label');
        const installBtn = document.getElementById('app-update-install-btn');
        const laterBtn = document.getElementById('app-update-later-btn');
        const permBtn = document.getElementById('app-update-permission-btn');

        if (verPill) verPill.textContent = `v${info.versionName || info.version || CURRENT_VERSION}`;
        if (notesList) {
            notesList.innerHTML = '';
            const bullets = Array.isArray(info.changelog) && info.changelog.length > 0
                ? info.changelog
                : ['Mejoras de rendimiento, estabilidad y nuevas funciones.'];
            bullets.forEach(item => {
                const li = document.createElement('li');
                li.className = 'flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300';
                li.innerHTML = `<span class="text-indigo-500 font-bold shrink-0">•</span><span></span>`;
                li.querySelector('span:last-child').textContent = String(item);
                notesList.appendChild(li);
            });
        }
        if (progressBox) progressBox.classList.add('hidden');
        if (progressBar) progressBar.style.width = '0%';
        if (progressLabel) progressLabel.textContent = '0%';
        if (permBtn) permBtn.classList.add('hidden');
        if (installBtn) {
            installBtn.disabled = false;
            installBtn.textContent = hasNativeBridge() ? 'Instalar actualización' : 'Descargar APK';
        }
        if (laterBtn) {
            laterBtn.classList.toggle('hidden', Boolean(info.forceUpdate));
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
        requestAnimationFrame(() => modal.classList.add('active'));
    }

    function startDownload() {
        if (!pendingUpdateInfo?.apkUrl) {
            window.showNotification?.('Enlace de actualización no disponible.', 'error');
            return;
        }
        if (hasNativeBridge() && typeof window.AndroidWidgetBridge.downloadAndInstallUpdate === 'function') {
            const progressBox = document.getElementById('app-update-progress-wrap');
            const installBtn = document.getElementById('app-update-install-btn');
            const permBtn = document.getElementById('app-update-permission-btn');
            if (progressBox) progressBox.classList.remove('hidden');
            if (permBtn) permBtn.classList.add('hidden');
            if (installBtn) {
                installBtn.disabled = true;
                installBtn.textContent = 'Descargando...';
            }
            window.AndroidWidgetBridge.downloadAndInstallUpdate(
                pendingUpdateInfo.apkUrl,
                pendingUpdateInfo.sha256 || ''
            );
            return;
        }
        window.open(pendingUpdateInfo.apkUrl, '_blank', 'noopener,noreferrer');
    }

    function handleCheckPayload(data, { manual = false } = {}) {
        isChecking = false;
        const btn = document.getElementById('settings-check-update-btn');
        if (btn) btn.disabled = false;

        if (!data || typeof data !== 'object') {
            setSettingsStatus('Sin datos', 'error');
            if (manual) window.showNotification?.('No se pudo leer la información de versión.', 'error');
            return false;
        }

        const remoteCode = Number(data.versionCode || 0);
        const remoteVer = String(data.versionName || data.version || '').trim();
        const isNewer = Boolean(
            data.available ||
            (remoteCode > CURRENT_VERSION_CODE) ||
            (remoteVer && compareVersions(remoteVer, CURRENT_VERSION) > 0)
        );

        try {
            localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
        } catch (_) {}

        if (isNewer) {
            setSettingsStatus(`Nueva v${remoteVer || remoteCode}`, 'available');
            openUpdateModal(data);
            return true;
        }

        setSettingsStatus(`Actualizado (v${CURRENT_VERSION})`, 'neutral');
        if (manual) {
            window.showNotification?.(`Ya tienes la versión más reciente (v${CURRENT_VERSION}).`, 'success');
        }
        return false;
    }

    async function checkForUpdates(opts = {}) {
        const manual = Boolean(opts.manual);
        if (isChecking) return null;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            if (manual) {
                setSettingsStatus('Sin conexión', 'error');
                window.showNotification?.('Necesitas conexión a internet para buscar actualizaciones.', 'warning');
            }
            return null;
        }

        isChecking = true;
        isManualCheck = manual;
        const btn = document.getElementById('settings-check-update-btn');
        if (btn) btn.disabled = true;
        setSettingsStatus('Buscando...', 'checking');

        if (hasNativeBridge()) {
            try {
                window.AndroidWidgetBridge.checkForAppUpdate();
                return null;
            } catch (_) {}
        }

        try {
            const resp = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: 'no-store' });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();
            return handleCheckPayload(json, { manual });
        } catch (err) {
            isChecking = false;
            if (btn) btn.disabled = false;
            setSettingsStatus('Sin conexión', 'error');
            if (manual) {
                window.showNotification?.('No se pudieron buscar actualizaciones en este momento.', 'warning');
            }
            return null;
        }
    }

    function init() {
        const verLabel = document.getElementById('settings-update-current-version');
        if (verLabel) verLabel.textContent = `v${CURRENT_VERSION}`;

        const checkBtn = document.getElementById('settings-check-update-btn');
        if (checkBtn) {
            checkBtn.onclick = () => {
                window.HapticsModule?.light?.();
                checkForUpdates({ manual: true });
            };
        }

        document.getElementById('app-update-later-btn')?.addEventListener('click', closeUpdateModal);
        document.getElementById('app-update-backdrop')?.addEventListener('click', () => {
            if (!pendingUpdateInfo?.forceUpdate) closeUpdateModal();
        });
        document.getElementById('app-update-install-btn')?.addEventListener('click', startDownload);
        document.getElementById('app-update-permission-btn')?.addEventListener('click', () => {
            try {
                window.AndroidWidgetBridge?.openInstallPermissionSettings?.();
            } catch (_) {}
        });

        // Comprobación silenciosa periódica (máximo una vez cada 12 horas) solo en APK nativo o HTTPS público
        try {
            const isPublicHttps = typeof location !== 'undefined' && location.protocol === 'https:' && !/^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
            if ((hasNativeBridge() || isPublicHttps) && window.StorageModule?.isOnboardingCompleted?.()) {
                const last = Number(localStorage.getItem(LAST_CHECK_KEY) || 0);
                if (!last || Date.now() - last > CHECK_COOLDOWN_MS) {
                    setTimeout(() => checkForUpdates({ manual: false }), 2500);
                }
            }
        } catch (_) {}
    }

    window.AppUpdater = {
        CURRENT_VERSION,
        CURRENT_VERSION_CODE,
        compareVersions,
        checkForUpdates,
        openUpdateModal,
        closeUpdateModal,
        startDownload,
        init,
        onNativeCheckResult(info) {
            handleCheckPayload(info, { manual: isManualCheck });
        },
        onNativeProgress(pct) {
            const p = Math.max(0, Math.min(100, Number(pct) || 0));
            const bar = document.getElementById('app-update-progress-bar');
            const lbl = document.getElementById('app-update-progress-label');
            const btn = document.getElementById('app-update-install-btn');
            if (bar) bar.style.width = `${p}%`;
            if (lbl) lbl.textContent = `${p}%`;
            if (p >= 100 && btn) {
                btn.disabled = false;
                btn.textContent = 'Abrir instalador';
            }
        },
        onNativeNeedsPermission() {
            const permBtn = document.getElementById('app-update-permission-btn');
            const installBtn = document.getElementById('app-update-install-btn');
            if (permBtn) permBtn.classList.remove('hidden');
            if (installBtn) {
                installBtn.disabled = false;
                installBtn.textContent = 'Reintentar instalación';
            }
            window.showNotification?.('Concede permiso para instalar aplicaciones de esta fuente y luego pulsa Reintentar.', 'warning');
        },
        onNativeError(msg) {
            isChecking = false;
            const btn = document.getElementById('settings-check-update-btn');
            const installBtn = document.getElementById('app-update-install-btn');
            if (btn) btn.disabled = false;
            if (installBtn) {
                installBtn.disabled = false;
                installBtn.textContent = 'Reintentar descarga';
            }
            setSettingsStatus('Error', 'error');
            if (isManualCheck || document.getElementById('app-update-modal')?.classList.contains('active')) {
                window.showNotification?.(msg || 'No se pudo completar la actualización.', 'error');
            }
        }
    };
})();
