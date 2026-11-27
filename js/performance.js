/**
 * performance.js - Modo Rendimiento / Reducir Efectos (v1.7.1)
 * Permite reducir al mínimo efectos visuales (transparencias, blur, refracción,
 * animaciones y sombras pesadas) en dispositivos con menores capacidades.
 */
(() => {
    'use strict';

    const PREV_GLASS_KEY = 'org_escolar_reduced_effects_prev_glass_v1';
    let initialized = false;
    let fpsProbeStarted = false;

    function isEnabled() {
        try {
            if (window.StorageModule && typeof window.StorageModule.getReducedEffects === 'function') {
                return Boolean(window.StorageModule.getReducedEffects());
            }
            return localStorage.getItem('org_escolar_reduced_effects_v1') === 'true';
        } catch (_) {
            return false;
        }
    }

    function detectRecommendedProfile() {
        try {
            if (typeof navigator !== 'undefined' && navigator.webdriver) {
                return 'medium';
            }
            const cores = Number(typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 0) || 0;
            const mem = Number(typeof navigator !== 'undefined' ? navigator.deviceMemory : 0) || 0;
            if ((cores > 0 && cores <= 2) || (mem > 0 && mem <= 2)) {
                return 'low';
            }
            if ((cores >= 8 && (mem === 0 || mem >= 6)) || (mem >= 8 && (cores === 0 || cores >= 6))) {
                return 'high';
            }
            return 'medium';
        } catch (_) {
            return 'medium';
        }
    }

    function getDeviceProfile() {
        try {
            const attr = (document.documentElement.getAttribute('data-device-profile') || '').toLowerCase();
            if (attr === 'low' || attr === 'medium' || attr === 'high') return attr;
            const Storage = window.StorageModule;
            if (Storage?.hasExplicitDeviceProfile?.()) {
                return Storage.getDeviceProfile();
            }
            return detectRecommendedProfile();
        } catch (_) {
            return 'medium';
        }
    }

    function syncBgQualityConstraints(reduced = isEnabled()) {
        const highBtn = document.querySelector('#settings-bg-quality-track [data-bg-quality="high"]');
        if (highBtn) {
            highBtn.disabled = Boolean(reduced);
            highBtn.classList.toggle('opacity-40', Boolean(reduced));
            highBtn.classList.toggle('cursor-not-allowed', Boolean(reduced));
            highBtn.title = reduced
                ? 'Calidad Alta no disponible mientras Reducir efectos esté activo.'
                : 'Máxima fluidez (60 FPS y más partículas)';
        }
        const Storage = window.StorageModule;
        if (reduced && Storage?.getBackgroundQuality?.() === 'high') {
            Storage.setBackgroundQuality('low');
        }
        window.BackgroundsModule?.renderSettingsUI?.();
    }

    function syncProfileUI(profile = getDeviceProfile()) {
        const track = document.getElementById('settings-device-profile-track');
        if (track) {
            track.querySelectorAll('[data-device-profile]').forEach(btn => {
                const isActive = btn.dataset.deviceProfile === profile;
                btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                btn.classList.toggle('seg-btn-active', isActive);
                btn.classList.toggle('seg-btn-inactive', !isActive);
            });
            window.SegmentedControl?.syncTrack?.(track);
        }
        const pill = document.getElementById('settings-device-profile-pill');
        if (pill) {
            const labels = { low: 'Baja', medium: 'Media', high: 'Alta' };
            pill.textContent = labels[profile] || 'Media';
        }
    }

    function applyDeviceProfile(profile, opts = {}) {
        const p = String(profile || '').toLowerCase();
        const chosen = (p === 'low' || p === 'medium' || p === 'high') ? p : 'medium';
        const persist = opts.persist !== false;
        const notify = Boolean(opts.notify);
        const applyEffects = opts.applyEffects !== false;
        const Storage = window.StorageModule;

        document.documentElement.setAttribute('data-device-profile', chosen);
        if (persist && Storage?.setDeviceProfile) {
            Storage.setDeviceProfile(chosen);
        }

        if (applyEffects) {
            if (chosen === 'low') {
                if (Storage?.setBackgroundQuality) Storage.setBackgroundQuality('low');
                setEnabled(true, { persist, notify: false, fromProfile: true });
            } else if (chosen === 'medium') {
                setEnabled(false, { persist, notify: false, fromProfile: true });
                if (persist && opts.userInitiated && Storage?.setBackgroundQuality) {
                    Storage.setBackgroundQuality('medium');
                }
            } else if (chosen === 'high') {
                setEnabled(false, { persist, notify: false, fromProfile: true });
                if (persist && opts.userInitiated && Storage?.setBackgroundQuality) {
                    Storage.setBackgroundQuality('high');
                }
            }
        }

        syncProfileUI(chosen);
        syncBgQualityConstraints(isEnabled());

        try {
            window.BackgroundsModule?.applyBackground?.();
        } catch (_) {}

        if (notify) {
            const labels = {
                low: 'Perfil Bajo: efectos reducidos para máxima fluidez.',
                medium: 'Perfil Medio: equilibrio entre cristal fluido y rendimiento.',
                high: 'Perfil Alto: todos los efectos visuales y 60 FPS habilitados.'
            };
            window.HapticsModule?.light?.();
            window.showNotification?.(labels[chosen] || labels.medium, 'info');
        }
        return chosen;
    }

    function scheduleAutoFpsProbe() {
        const Storage = window.StorageModule;
        if (fpsProbeStarted || Storage?.hasExplicitDeviceProfile?.() || isEnabled()) return;
        if (typeof navigator !== 'undefined' && navigator.webdriver) return;
        if (typeof requestAnimationFrame !== 'function' || document.hidden) return;
        fpsProbeStarted = true;
        setTimeout(() => {
            if (document.hidden || Storage?.hasExplicitDeviceProfile?.() || isEnabled()) return;
            let frames = 0;
            const start = performance.now();
            const tick = (now) => {
                if (document.hidden || Storage?.hasExplicitDeviceProfile?.()) return;
                frames += 1;
                const elapsed = now - start;
                if (elapsed < 450) {
                    requestAnimationFrame(tick);
                    return;
                }
                const fps = (frames * 1000) / Math.max(1, elapsed);
                if (fps < 24 && !Storage?.hasExplicitDeviceProfile?.()) {
                    applyDeviceProfile('low', { persist: true, notify: false, applyEffects: true });
                }
            };
            requestAnimationFrame(tick);
        }, 1200);
    }

    function applyRootAttributes(enabled) {
        const root = document.documentElement;
        if (!root) return;
        if (enabled) {
            root.setAttribute('data-reduced-effects', 'true');
            root.classList.add('reduced-effects');
        } else {
            root.removeAttribute('data-reduced-effects');
            root.classList.remove('reduced-effects');
        }
    }

    function syncUI(enabled = isEnabled()) {
        const toggle = document.getElementById('settings-reduced-effects-toggle');
        if (toggle) {
            toggle.checked = Boolean(enabled);
            toggle.setAttribute('aria-checked', enabled ? 'true' : 'false');
        }
        const pill = document.getElementById('settings-reduced-effects-pill');
        if (pill) {
            pill.textContent = enabled ? 'Activo' : 'Desactivado';
            pill.className = enabled
                ? 'shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
        }
    }

    function setEnabled(enabled, opts = {}) {
        const next = Boolean(enabled);
        const persist = opts.persist !== false;
        const notify = Boolean(opts.notify);

        if (persist) {
            try {
                if (window.StorageModule && typeof window.StorageModule.setReducedEffects === 'function') {
                    window.StorageModule.setReducedEffects(next);
                } else {
                    localStorage.setItem('org_escolar_reduced_effects_v1', next ? 'true' : 'false');
                }
            } catch (_) {}
        }

        applyRootAttributes(next);
        syncUI(next);

        if (next) {
            try {
                const currentGlass = document.documentElement.getAttribute('data-glass-intensity')
                    || window.StorageModule?.getGlassIntensity?.()
                    || 'normal';
                if (currentGlass !== 'suave' && !localStorage.getItem(PREV_GLASS_KEY)) {
                    localStorage.setItem(PREV_GLASS_KEY, currentGlass);
                }
            } catch (_) {}
            try {
                window.OrganizadorApp?.applyGlassIntensity?.('suave');
            } catch (_) {
                document.documentElement.setAttribute('data-glass-intensity', 'suave');
                window.LiquidGlassModule?.setIntensity?.('suave');
            }
        } else {
            let restored = null;
            try {
                restored = localStorage.getItem(PREV_GLASS_KEY);
                if (restored) localStorage.removeItem(PREV_GLASS_KEY);
            } catch (_) {}
            const targetGlass = (restored === 'suave' || restored === 'normal' || restored === 'intenso')
                ? restored
                : (window.StorageModule?.getGlassIntensity?.() || 'normal');
            try {
                window.OrganizadorApp?.applyGlassIntensity?.(targetGlass);
            } catch (_) {
                document.documentElement.setAttribute('data-glass-intensity', targetGlass);
                window.LiquidGlassModule?.setIntensity?.(targetGlass);
            }
        }

        syncBgQualityConstraints(next);

        try {
            window.BackgroundsModule?.applyBackground?.();
        } catch (_) {}

        if (notify) {
            window.HapticsModule?.light?.();
            window.showNotification?.(
                next
                    ? 'Modo rendimiento activado: efectos visuales y animaciones reducidos.'
                    : 'Modo rendimiento desactivado: efectos visuales restaurados.',
                'info'
            );
        }

        return next;
    }

    function bindToggle() {
        const toggle = document.getElementById('settings-reduced-effects-toggle');
        if (toggle && toggle.dataset.perfBound !== 'true') {
            toggle.dataset.perfBound = 'true';
            toggle.addEventListener('change', (e) => {
                setEnabled(Boolean(e.target.checked), { persist: true, notify: true });
            });
        }
        const profileTrack = document.getElementById('settings-device-profile-track');
        if (profileTrack && profileTrack.dataset.perfBound !== 'true') {
            profileTrack.dataset.perfBound = 'true';
            profileTrack.querySelectorAll('[data-device-profile]').forEach(btn => {
                btn.addEventListener('click', () => {
                    applyDeviceProfile(btn.dataset.deviceProfile, { persist: true, notify: true, userInitiated: true });
                });
            });
        }
    }

    function init() {
        const active = isEnabled();
        const Storage = window.StorageModule;
        const initialProfile = Storage?.hasExplicitDeviceProfile?.()
            ? Storage.getDeviceProfile()
            : (active ? 'low' : detectRecommendedProfile());
        if (Storage && !Storage.hasExplicitDeviceProfile?.() && Storage.setDeviceProfile) {
            // Solo guardar perfil auto-detectado la primera vez si es bajo/alto, o mantener atributo
            document.documentElement.setAttribute('data-device-profile', initialProfile);
            if (initialProfile === 'low' && !active) {
                setEnabled(true, { persist: true, notify: false, fromProfile: true });
            }
        } else {
            document.documentElement.setAttribute('data-device-profile', initialProfile);
        }
        applyRootAttributes(isEnabled());
        bindToggle();
        syncUI(isEnabled());
        syncProfileUI(initialProfile);
        syncBgQualityConstraints(isEnabled());
        scheduleAutoFpsProbe();
        if (isEnabled()) {
            // Re-aplicar después de App.init() para asegurar que LiquidGlass quede en suave y fondos pausados
            setTimeout(() => {
                if (isEnabled()) {
                    setEnabled(true, { persist: false, notify: false });
                }
            }, 0);
        }
        initialized = true;
        return true;
    }

    // Aplicar atributo inmediatamente al cargar el script para evitar parpadeos
    applyRootAttributes(isEnabled());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.PerformanceModeModule = {
        init,
        isEnabled,
        setEnabled,
        syncUI,
        getDeviceProfile,
        detectRecommendedProfile,
        applyDeviceProfile,
        syncProfileUI,
        syncBgQualityConstraints,
        get initialized() { return initialized; }
    };
})();
