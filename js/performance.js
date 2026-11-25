/**
 * performance.js - Modo Rendimiento / Reducir Efectos (v1.6.0)
 * Permite reducir al mínimo efectos visuales (transparencias, blur, refracción,
 * animaciones y sombras pesadas) en dispositivos con menores capacidades.
 */
(() => {
    'use strict';

    const PREV_GLASS_KEY = 'org_escolar_reduced_effects_prev_glass_v1';
    let initialized = false;

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
        if (!toggle || toggle.dataset.perfBound === 'true') return;
        toggle.dataset.perfBound = 'true';
        toggle.addEventListener('change', (e) => {
            setEnabled(Boolean(e.target.checked), { persist: true, notify: true });
        });
    }

    function init() {
        const active = isEnabled();
        applyRootAttributes(active);
        bindToggle();
        syncUI(active);
        if (active) {
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
        get initialized() { return initialized; }
    };
})();
