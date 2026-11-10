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

        const menu = document.createElement('div');
        menu.id = 'floating-card-context-menu';
        menu.className = 'fixed z-50 animate-in fade-in zoom-in-95 duration-150 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700 shadow-2xl p-1.5 min-w-[170px] text-slate-800 dark:text-slate-100 flex flex-col gap-1';
        
        menu.innerHTML = `
            <div class="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 truncate max-w-[210px]">
                ${title || 'Opciones'}
            </div>
            <button type="button" class="context-action-btn flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left" data-context-action="edit">
                <span class="text-sm">✏️</span>
                <span>Editar</span>
            </button>
            <button type="button" class="context-action-btn flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors text-left" data-context-action="delete">
                <span class="text-sm">🗑️</span>
                <span>Eliminar</span>
            </button>
        `;

        document.body.appendChild(menu);
        this.activeMenuEl = menu;
        this.activeTargetEl = targetEl;

        if (targetEl) {
            targetEl.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'dark:ring-offset-slate-900');
        }

        // Posicionamiento inteligente sobre la tarjeta o punto de pulsación
        const rect = targetEl ? targetEl.getBoundingClientRect() : { top: position?.clientY || 100, left: position?.clientX || 100, width: 0, height: 0, bottom: position?.clientY || 100 };
        const menuRect = menu.getBoundingClientRect();

        let top = rect.top - menuRect.height - 8;
        if (top < 12) {
            top = Math.min(window.innerHeight - menuRect.height - 12, rect.bottom + 8);
        }

        let left = rect.left + (rect.width / 2) - (menuRect.width / 2);
        if (position && typeof position.clientX === 'number') {
            left = position.clientX - (menuRect.width / 2);
        }
        left = Math.max(12, Math.min(window.innerWidth - menuRect.width - 12, left));

        menu.style.top = `${Math.round(top)}px`;
        menu.style.left = `${Math.round(left)}px`;

        menu.querySelector('[data-context-action="edit"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
            if (typeof onEdit === 'function') onEdit();
        });

        menu.querySelector('[data-context-action="delete"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
            if (typeof onDelete === 'function') onDelete();
        });

        // Cerrar al hacer clic fuera
        const onDocClick = (e) => {
            if (!menu.contains(e.target)) {
                this.close();
            }
        };
        setTimeout(() => {
            document.addEventListener('click', onDocClick, { once: true, capture: true });
        }, 15);
    },

    close() {
        if (this.activeTargetEl) {
            this.activeTargetEl.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'dark:ring-offset-slate-900');
            this.activeTargetEl = null;
        }
        if (this.activeMenuEl) {
            this.activeMenuEl.remove();
            this.activeMenuEl = null;
        }
    },

    bind(element, { title, onEdit, onDelete }) {
        if (!element) return;
        let timer = null;
        let startX = 0;
        let startY = 0;
        let isLongPress = false;

        const onTouchStart = (e) => {
            if (e.target.closest('input, button, a, [data-action="toggle"], [data-action="archive"]')) return;
            isLongPress = false;
            const t = e.touches ? e.touches[0] : e;
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
            if (e.target.closest('input, button, a, [data-action="toggle"]')) return;
            e.preventDefault();
            if (timer) clearTimeout(timer);
            window.HapticsModule?.light?.();
            this.show({ targetEl: element, title, onEdit, onDelete, position: { clientX: e.clientX, clientY: e.clientY } });
        });
    }
};

