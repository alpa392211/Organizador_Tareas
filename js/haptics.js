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
