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
    activeCloneEl: null,

    show({ targetEl, title, onEdit, onDelete, position }) {
        this.close();
        const popup = this.ensurePopup();
        if (!popup) return;

        const titleEl = popup.querySelector('[data-popup-title]');
        if (titleEl) titleEl.textContent = title || 'Opciones';

        this.activeMenuEl = popup;
        this.activeTargetEl = targetEl;

        const stage = popup.querySelector('#card-dynamic-clone-stage');
        if (stage) stage.innerHTML = '';

        let targetRect = null;
        if (targetEl && typeof targetEl.cloneNode === 'function') {
            targetRect = targetEl.getBoundingClientRect ? targetEl.getBoundingClientRect() : null;
            const clone = targetEl.cloneNode(true);
            clone.removeAttribute('id');
            clone.querySelectorAll?.('[id]')?.forEach(el => el.removeAttribute('id'));
            clone.setAttribute('data-longpress-clone', 'true');
            clone.setAttribute('aria-hidden', 'true');
            clone.classList.remove('stagger-card', 'card-hover');
            clone.classList.add('longpress-card-clone-elevated');

            if (targetRect && targetRect.width > 0 && targetRect.height > 0) {
                clone.style.left = `${Math.round(targetRect.left)}px`;
                clone.style.top = `${Math.round(targetRect.top)}px`;
                clone.style.width = `${Math.round(targetRect.width)}px`;
                clone.style.height = `${Math.round(targetRect.height)}px`;
            } else {
                clone.style.left = '16px';
                clone.style.top = '16px';
                clone.style.width = 'calc(100vw - 32px)';
            }

            const computed = window.getComputedStyle(targetEl);
            if (computed) {
                if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                    clone.style.backgroundColor = computed.backgroundColor;
                }
                if (computed.color) {
                    clone.style.color = computed.color;
                }
            }

            if (stage) {
                stage.appendChild(clone);
                this.activeCloneEl = clone;
            }
            targetEl.classList.add('longpress-source-hidden');
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

        const backdrop = popup.querySelector('#card-dynamic-popup-backdrop');
        if (backdrop) {
            backdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        }

        popup.classList.remove('hidden');
        popup.style.display = 'flex';

        const dialog = popup.querySelector('.modal-dialog') || popup.firstElementChild;
        if (dialog) {
            dialog.style.position = '';
            dialog.style.left = '';
            dialog.style.top = '';
            dialog.style.margin = '';
            dialog.style.maxWidth = '';
            dialog.style.transformOrigin = 'center center';

            const vw = window.innerWidth || document.documentElement.clientWidth || 390;
            const vh = window.innerHeight || document.documentElement.clientHeight || 844;
            const safePad = 8;
            dialog.style.maxWidth = `${Math.max(200, Math.min(320, vw - safePad * 2))}px`;

            const anchorX = (position && typeof position.clientX === 'number' && !Number.isNaN(position.clientX))
                ? position.clientX
                : (targetRect && targetRect.width > 0 ? targetRect.left + targetRect.width / 2 : null);
            const anchorY = (position && typeof position.clientY === 'number' && !Number.isNaN(position.clientY))
                ? position.clientY
                : (targetRect && targetRect.height > 0 ? targetRect.bottom : null);

            if (anchorX !== null && anchorY !== null) {
                const dlgRect = dialog.getBoundingClientRect();
                const dlgW = Math.min(Math.max(dialog.offsetWidth || 0, Math.ceil(dlgRect.width || 0), 260), vw - safePad * 2);
                const dlgH = Math.max(dialog.offsetHeight || 0, Math.ceil(dlgRect.height || 0), 210);

                let left = anchorX - dlgW / 2;
                left = Math.max(safePad, Math.min(left, vw - dlgW - safePad));

                let top = anchorY + 14;
                let placedAbove = false;
                if (top + dlgH > vh - 16) {
                    const aboveTop = anchorY - dlgH - 14;
                    if (aboveTop >= 12) {
                        top = aboveTop;
                        placedAbove = true;
                    } else {
                        top = vh - dlgH - 16;
                    }
                }
                top = Math.max(12, Math.min(top, vh - dlgH - 16));

                const originX = Math.max(16, Math.min(dlgW - 16, anchorX - left));
                dialog.style.position = 'fixed';
                dialog.style.margin = '0';
                dialog.style.left = `${Math.round(left)}px`;
                dialog.style.top = `${Math.round(top)}px`;
                dialog.style.transformOrigin = `${Math.round(originX)}px ${placedAbove ? '100%' : '0%'}`;
            }

            dialog.classList.remove('dynamic-popup-in');
            void dialog.offsetWidth;
            dialog.classList.add('dynamic-popup-in');
        }

        requestAnimationFrame(() => {
            popup.classList.add('active');
        });
    },

    close() {
        if (this.activeTargetEl) {
            this.activeTargetEl.classList.remove('longpress-source-hidden', 'ring-2', 'ring-indigo-500', 'ring-offset-2', 'dark:ring-offset-slate-900');
            this.activeTargetEl = null;
        }
        if (this.activeCloneEl) {
            this.activeCloneEl.remove();
            this.activeCloneEl = null;
        }
        const stage = document.getElementById('card-dynamic-clone-stage');
        if (stage) stage.innerHTML = '';

        const popup = document.getElementById('card-dynamic-popup');
        if (popup) {
            popup.classList.remove('active');
            popup.classList.add('hidden');
            popup.style.display = 'none';
            const dialog = popup.querySelector('.modal-dialog');
            if (dialog) {
                dialog.classList.remove('dynamic-popup-in');
                dialog.style.position = '';
                dialog.style.left = '';
                dialog.style.top = '';
                dialog.style.margin = '';
                dialog.style.maxWidth = '';
                dialog.style.transformOrigin = '';
            }
        }
        this.activeMenuEl = null;
    },

    /** Crea (o recrea) el popup dinámico compacto si no existe en el DOM. */
    ensurePopup() {
        let popup = document.getElementById('card-dynamic-popup');
        if (popup || !document.body) return popup;
        popup = document.createElement('div');
        popup.id = 'card-dynamic-popup';
        popup.className = 'fixed inset-0 z-[70] hidden items-center justify-center p-2 sm:p-4';
        popup.style.display = 'none';
        popup.innerHTML = `
            <div id="card-dynamic-popup-backdrop" class="app-modal-backdrop fixed inset-0 bg-slate-900/45" data-popup-close></div>
            <div id="card-dynamic-clone-stage" class="fixed inset-0 pointer-events-none z-10"></div>
            <div class="modal-dialog dynamic-popup liquid-glass-popover relative z-20 w-full max-w-xs bg-white/90 dark:bg-slate-800/90 rounded-3xl shadow-2xl border border-white/60 dark:border-white/15 p-4 space-y-2">
                <div data-popup-title class="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate px-1">Opciones</div>
                <button type="button" data-context-action="edit" class="tap-effect touch-target-44 min-h-[44px] w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-sm font-bold bg-indigo-50/90 dark:bg-slate-700/80 text-indigo-700 dark:text-indigo-300"><span>✏️</span><span>Editar</span></button>
                <button type="button" data-context-action="delete" class="tap-effect touch-target-44 min-h-[44px] w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-sm font-bold bg-rose-50/90 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"><span>🗑️</span><span>Eliminar</span></button>
                <button type="button" data-popup-close class="tap-effect touch-target-44 min-h-[44px] w-full px-3 py-2 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-700/50">Cancelar</button>
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
