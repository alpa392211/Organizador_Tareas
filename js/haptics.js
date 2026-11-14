/**
 * Módulo de Vibración Háptica Global
 * Proporciona retroalimentación táctil usando navigator.vibrate() y
 * el plugin nativo Haptics de Capacitor / Android.
 * Activado por defecto en la configuración.
 */

window.HapticsModule = (() => {
    const STORAGE_KEY = 'org_escolar_haptics';

    // Comprobar si el plugin de Capacitor Haptics está disponible
    function isCapacitorHapticsAvailable() {
        try {
            return Boolean(
                typeof window !== 'undefined' &&
                window.Capacitor &&
                window.Capacitor.Plugins &&
                window.Capacitor.Plugins.Haptics
            );
        } catch {
            return false;
        }
    }

    const Haptics = {
        /**
         * Devuelve si la respuesta háptica está habilitada (por defecto true)
         */
    isEnabled() {
            const val = localStorage.getItem(STORAGE_KEY);
            return val === null ? true : val === 'true';
        },

        /**
         * Activa o desactiva la respuesta háptica y persiste en almacenamiento
         */
        setEnabled(enabled) {
            localStorage.setItem(STORAGE_KEY, Boolean(enabled) ? 'true' : 'false');
            if (enabled) {
                this.light();
            }
        },

        /**
         * Disparo genérico con soporte navigator.vibrate y Capacitor
         */
        vibrate(pattern) {
            if (!this.isEnabled()) return;

            // 1. Intentar con Capacitor Haptics nativo si existe
            if (isCapacitorHapticsAvailable()) {
                const { Haptics: CapHaptics } = window.Capacitor.Plugins;
                try {
                    if (Array.isArray(pattern)) {
                        if (typeof CapHaptics.notification === 'function') {
                            CapHaptics.notification({ type: 'SUCCESS' }).catch(() => {});
                            return;
                        }
                    } else if (typeof CapHaptics.impact === 'function') {
                        CapHaptics.impact({ style: pattern > 25 ? 'MEDIUM' : 'LIGHT' }).catch(() => {});
                        return;
                    }
                } catch {
                    // Fallback a web vibrate
                }
            }

            // 2. Fallback estándar a Web Haptics API
            if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                try {
                    navigator.vibrate(pattern);
                } catch {
                    // Silencioso si el dispositivo o navegador bloquea la vibración
                }
            }
        },

        /**
         * Vibración sutil (10-15ms)
         * Usado para navegación, apertura de modales, switches, checkboxes y botones
         */
        light() {
            this.vibrate(15);
        },

        /**
         * Vibración media (25ms)
         */
        medium() {
            this.vibrate(25);
        },

        /**
         * Patrón doble ([30, 50, 30])
         * Usado al completar tareas, guardar notas/materias o eliminar elementos
         */
        double() {
            this.vibrate([30, 50, 30]);
        },

        /**
         * Patrón de advertencia ([40, 50, 40])
         */
        warning() {
            this.vibrate([40, 50, 40]);
        },

        /**
         * Patrón de éxito / celebración ([25, 50, 30, 50, 25])
         * Usado al completar la configuración inicial y celebraciones
         */
        success() {
            this.vibrate([25, 50, 30, 50, 25]);
        },

        /**
         * Vincula automáticamente retroalimentación háptica en la interfaz
         */
        bindGlobalInteractions() {
            document.addEventListener('click', (e) => {
                // Si el elemento o algún ancestro es un botón interactivo
                const interactive = e.target.closest(
                    'button, .tap-effect, .nav-link-btn, input[type="checkbox"], select, a.kofi-btn, [data-view-target], [data-open-calendar]'
                );
                if (interactive) {
                    // Solo si no fue ya manejado con vibración doble en el evento específico
                    this.light();
                }
            }, { passive: true });
        }
    };

    return Haptics;
})();

/**
 * Gestor Global de Menú Contextual Flotante por Pulsación Larga (Long-Press)
 * Sustituye botones estáticos de editar y eliminar en Tareas, Materias y Notas.
 */
window.CardContextMenu = {
    activeMenuEl: null,
    activeTargetEl: null,

    show({ targetEl, title, onEdit, onDelete, position }) {
        this.close();
        const popup = this.ensurePopup();
        if (!popup) return;

        const titleEl = popup.querySelector('[data-popup-title]');
        if (titleEl) titleEl.textContent = title || 'Opciones';

        this.activeMenuEl = popup;
        this.activeTargetEl = targetEl;
        if (targetEl) {
            targetEl.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'dark:ring-offset-slate-900');
        }

        const bindBtn = (action, cb) => {
            const old = popup.querySelector(`[data-context-action="${action}"]`);
            if (!old) return;
            const btn = old.cloneNode(true); // elimina listeners anteriores
            old.replaceWith(btn);
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
                if (typeof cb === 'function') cb();
            });
        };
        bindBtn('edit', onEdit);
        bindBtn('delete', onDelete);

        popup.classList.remove('hidden');
        popup.style.display = 'flex';
        const dialog = popup.querySelector('.modal-dialog') || popup.firstElementChild;
        if (dialog) {
            dialog.classList.remove('dynamic-popup-in');
            void dialog.offsetWidth;
            dialog.classList.add('dynamic-popup-in');
        }
    },

    close() {
        if (this.activeTargetEl) {
            this.activeTargetEl.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'dark:ring-offset-slate-900');
            this.activeTargetEl = null;
        }
        const popup = document.getElementById('card-dynamic-popup');
        if (popup) {
            popup.classList.add('hidden');
            popup.style.display = '';
        }
        this.activeMenuEl = null;
    },

        /** Crea (o recrea) el popup dinámico compacto si no existe en el DOM. */
    ensurePopup() {
        let popup = document.getElementById('card-dynamic-popup');
        if (popup || !document.body) return popup;
        popup = document.createElement('div');
        popup.id = 'card-dynamic-popup';
        popup.className = 'fixed inset-0 z-[70] hidden items-center justify-center p-4';
        popup.style.display = 'none';
        popup.innerHTML = `
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" data-popup-close></div>
            <div class="modal-dialog dynamic-popup relative w-full max-w-xs bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-2">
                <div data-popup-title class="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">Opciones</div>
                <button type="button" data-context-action="edit" class="tap-effect w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-bold bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300"><span>✏️</span><span>Editar</span></button>
                <button type="button" data-context-action="delete" class="tap-effect w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"><span>🗑️</span><span>Eliminar</span></button>
                <button type="button" data-popup-close class="tap-effect w-full px-3 py-2 rounded-2xl text-xs font-bold text-slate-500 dark:text-slate-400">Cancelar</button>
            </div>`;
        document.body.appendChild(popup);
        return popup;
    },

    isEnabled() {
        const S = window.StorageModule;
        return !S || typeof S.isLongPressEnabled !== 'function' || S.isLongPressEnabled();
    },

    init() {
        if (this._inited) return;
        this._inited = true;
        this.ensurePopup();
        if (window.MutationObserver && document.body) {
            new MutationObserver(() => {
                if (!document.getElementById('card-dynamic-popup')) this.ensurePopup();
            }).observe(document.body, { childList: true });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
        document.addEventListener('click', (e) => {
            const popup = document.getElementById('card-dynamic-popup');
            if (!popup || popup.classList.contains('hidden')) return;
            if (e.target === popup || e.target.closest('[data-popup-close]')) this.close();
        });
    },

    bind(element, { title, onEdit, onDelete }) {
        if (!element) return;
        this.init();
        let timer = null;
        let startX = 0;
        let startY = 0;
        let isLongPress = false;

        const onTouchStart = (e) => {
            if (!this.isEnabled()) return;
            if (e.target.closest('input, button, a, [data-action="toggle"], [data-action="archive"]')) return;
            isLongPress = false;
            const t = (e.touches && e.touches[0]) || e;
            startX = t.clientX;
            startY = t.clientY;

            timer = setTimeout(() => {
                isLongPress = true;
                window.HapticsModule?.medium?.();
                this.show({ targetEl: element, title, onEdit, onDelete, position: { clientX: startX, clientY: startY } });
            }, 450);
        };

        const onTouchMove = (e) => {
            if (!timer) return;
            const t = e.touches ? e.touches[0] : e;
            if (Math.abs(t.clientX - startX) > 10 || Math.abs(t.clientY - startY) > 10) {
                clearTimeout(timer);
                timer = null;
            }
        };

        const onTouchEnd = (e) => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            if (isLongPress) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        element.addEventListener('touchstart', onTouchStart, { passive: true });
        element.addEventListener('touchmove', onTouchMove, { passive: true });
        element.addEventListener('touchend', onTouchEnd);
        element.addEventListener('touchcancel', onTouchEnd);

        element.addEventListener('mousedown', (e) => {
            if (e.button === 0) onTouchStart(e);
        });
        element.addEventListener('mousemove', onTouchMove);
        element.addEventListener('mouseup', onTouchEnd);
        element.addEventListener('mouseleave', onTouchEnd);

        // Menú contextual en clic derecho desktop
        element.addEventListener('contextmenu', (e) => {
            if (!this.isEnabled()) return;
            if (e.target.closest('input, button, a, [data-action="toggle"]')) return;
            e.preventDefault();
            if (timer) clearTimeout(timer);
            window.HapticsModule?.light?.();
            this.show({ targetEl: element, title, onEdit, onDelete, position: { clientX: e.clientX, clientY: e.clientY } });
        });
    }
};


// Disponibilidad inmediata del popup dinámico
(function () {
    const boot = () => window.CardContextMenu.init();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
