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
 * Gestor Reutilizable de Bloqueo Total de Scroll con Contador de Referencias (v1.5.3 Etapa 2b)
 * Congela el desplazamiento del documento y contenedores internos sin salto de posición ni pérdida de scrollTop.
 */
window.ScrollLockManager = (() => {
    const activeTokens = new Set();
    let savedWindowScrollX = 0;
    let savedWindowScrollY = 0;
    let savedContainerScrolls = new Map();
    let savedBodyPaddingRight = '';
    let listenersAttached = false;

    const SCROLL_KEYS = new Set([
        ' ',
        'Spacebar',
        'PageUp',
        'PageDown',
        'Home',
        'End',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight'
    ]);

    function getScrollableContainers() {
        const list = [];
        const docEl = document.scrollingElement || document.documentElement;
        if (docEl) list.push(docEl);
        if (document.body) list.push(document.body);
        document.querySelectorAll('main, section.view-transition, .mobile-sheet-body, #sidebar-drawer').forEach(el => {
            if (!list.includes(el)) list.push(el);
        });
        return list;
    }

    function isInsideAllowedScrollableDialog(target) {
        if (!(target instanceof Element)) return false;
        const dialog = target.closest('#card-dynamic-popup .modal-dialog');
        if (!dialog) return false;
        return dialog.scrollHeight > dialog.clientHeight + 2;
    }

    function onPreventWheel(e) {
        if (activeTokens.size === 0) return;
        if (isInsideAllowedScrollableDialog(e.target)) return;
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
    }

    function onPreventTouchMove(e) {
        if (activeTokens.size === 0) return;
        if (isInsideAllowedScrollableDialog(e.target)) return;
        if (e.cancelable) e.preventDefault();
    }

    function onPreventKeyScroll(e) {
        if (activeTokens.size === 0) return;
        if (!SCROLL_KEYS.has(e.key)) return;
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
        if (e.cancelable) e.preventDefault();
    }

    function onRestoreScrollIfMoved() {
        if (activeTokens.size === 0) return;
        if (window.scrollX !== savedWindowScrollX || window.scrollY !== savedWindowScrollY) {
            window.scrollTo(savedWindowScrollX, savedWindowScrollY);
        }
        savedContainerScrolls.forEach((pos, el) => {
            if (el && el.isConnected) {
                if (el.scrollTop !== pos.top) el.scrollTop = pos.top;
                if (el.scrollLeft !== pos.left) el.scrollLeft = pos.left;
            }
        });
    }

    function attachListeners() {
        if (listenersAttached) return;
        listenersAttached = true;
        window.addEventListener('wheel', onPreventWheel, { passive: false, capture: true });
        window.addEventListener('touchmove', onPreventTouchMove, { passive: false, capture: true });
        window.addEventListener('keydown', onPreventKeyScroll, { passive: false, capture: true });
        window.addEventListener('scroll', onRestoreScrollIfMoved, { passive: true, capture: true });
    }

    function detachListeners() {
        if (!listenersAttached) return;
        listenersAttached = false;
        window.removeEventListener('wheel', onPreventWheel, { capture: true });
        window.removeEventListener('touchmove', onPreventTouchMove, { capture: true });
        window.removeEventListener('keydown', onPreventKeyScroll, { capture: true });
        window.removeEventListener('scroll', onRestoreScrollIfMoved, { capture: true });
    }

    function applyDomLock() {
        savedWindowScrollX = window.scrollX || window.pageXOffset || 0;
        savedWindowScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        savedContainerScrolls = new Map();

        getScrollableContainers().forEach(el => {
            savedContainerScrolls.set(el, {
                top: el.scrollTop || 0,
                left: el.scrollLeft || 0
            });
        });

        if (document.body) {
            savedBodyPaddingRight = document.body.style.paddingRight || '';
            const scrollbarW = Math.max(0, (window.innerWidth || 0) - (document.documentElement.clientWidth || 0));
            if (scrollbarW > 0) {
                const currentPad = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
                document.body.style.paddingRight = `${currentPad + scrollbarW}px`;
            }
            document.body.classList.add('context-menu-scroll-locked');
        }
        document.documentElement.classList.add('context-menu-scroll-locked');
        attachListeners();
    }

    function releaseDomLock() {
        detachListeners();
        document.documentElement.classList.remove('context-menu-scroll-locked');
        if (document.body) {
            document.body.classList.remove('context-menu-scroll-locked');
            document.body.style.paddingRight = savedBodyPaddingRight;
        }

        savedContainerScrolls.forEach((pos, el) => {
            if (el && el.isConnected) {
                el.scrollTop = pos.top;
                el.scrollLeft = pos.left;
            }
        });
        window.scrollTo(savedWindowScrollX, savedWindowScrollY);
        savedContainerScrolls.clear();
    }

    return {
        lock(token = 'default') {
            const wasEmpty = activeTokens.size === 0;
            activeTokens.add(String(token));
            if (wasEmpty) {
                applyDomLock();
            }
            return activeTokens.size;
        },

        unlock(token = 'default') {
            const key = String(token);
            if (!activeTokens.has(key)) return activeTokens.size;
            activeTokens.delete(key);
            if (activeTokens.size === 0) {
                releaseDomLock();
            }
            return activeTokens.size;
        },

        forceUnlockAll() {
            if (activeTokens.size > 0 || listenersAttached || document.documentElement.classList.contains('context-menu-scroll-locked')) {
                activeTokens.clear();
                releaseDomLock();
            }
            return 0;
        },

        isLocked() {
            return activeTokens.size > 0;
        },

        getLockCount() {
            return activeTokens.size;
        },

        getActiveListenerCount() {
            return listenersAttached ? 4 : 0;
        },

        getSavedScroll() {
            return {
                scrollX: savedWindowScrollX,
                scrollY: savedWindowScrollY
            };
        }
    };
})();

/**
 * Gestor Global de Menú Contextual Flotante por Pulsación Larga (Long-Press) - v1.5.3 Etapa 2
 * Calcula el layout conjunto [tarjeta clonada + separación 12–16px + menú contextual] dentro del área
 * segura del viewport para evitar cualquier superposición, aplica transformación FLIP con resorte suave
 * y bloquea por completo el scroll de la página mientras permanece abierto.
 */
window.CardContextMenu = {
    activeMenuEl: null,
    activeTargetEl: null,
    activeCloneEl: null,
    activePosition: null,
    lastLayoutMetrics: null,
    lastCloseState: null,
    _suppressGhostClickUntil: 0,

    isReducedMotion() {
        try {
            return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        } catch {
            return false;
        }
    },

    computeSafeViewport() {
        const vv = window.visualViewport;
        const vw = Math.round(vv ? vv.width : (window.innerWidth || document.documentElement.clientWidth || 390));
        const vh = Math.round(vv ? vv.height : (window.innerHeight || document.documentElement.clientHeight || 844));
        const offsetTop = Math.round(vv ? vv.offsetTop : 0);
        const offsetLeft = Math.round(vv ? vv.offsetLeft : 0);

        const edgePad = 12;
        let safeLeft = offsetLeft + edgePad;
        let safeRight = offsetLeft + vw - edgePad;
        let safeTop = offsetTop + edgePad;
        let safeBottom = offsetTop + vh - edgePad;

        // Considerar barra superior visible (header)
        const headerEl = document.querySelector('header');
        if (headerEl) {
            const hs = window.getComputedStyle(headerEl);
            if (hs.display !== 'none' && hs.visibility !== 'hidden' && parseFloat(hs.opacity || '1') > 0) {
                const hr = headerEl.getBoundingClientRect();
                if (hr.height > 0 && hr.bottom > safeTop && hr.top < offsetTop + vh * 0.25) {
                    safeTop = Math.max(safeTop, Math.ceil(hr.bottom + 8));
                }
            }
        }

        // Considerar barra inferior flotante (#bottom-nav) cuando es visible en móvil
        const bottomNavEl = document.getElementById('bottom-nav');
        if (bottomNavEl) {
            const bs = window.getComputedStyle(bottomNavEl);
            if (bs.display !== 'none' && bs.visibility !== 'hidden' && parseFloat(bs.opacity || '1') > 0) {
                const br = bottomNavEl.getBoundingClientRect();
                if (br.height > 0 && br.top < safeBottom && br.bottom > offsetTop + vh * 0.65) {
                    safeBottom = Math.min(safeBottom, Math.floor(br.top - 8));
                }
            }
        }

        if (safeBottom - safeTop < 250) {
            safeTop = offsetTop + edgePad;
            safeBottom = offsetTop + vh - edgePad;
        }

        return {
            vw,
            vh,
            offsetTop,
            offsetLeft,
            safeLeft,
            safeRight,
            safeTop,
            safeBottom,
            safeWidth: Math.max(180, safeRight - safeLeft),
            safeHeight: Math.max(220, safeBottom - safeTop)
        };
    },

    layoutCloneAndMenu() {
        const popup = this.activeMenuEl;
        const targetEl = this.activeTargetEl;
        const clone = this.activeCloneEl;
        if (!popup) return null;

        const dialog = popup.querySelector('.modal-dialog') || popup.firstElementChild;
        if (!dialog) return null;

        const safe = this.computeSafeViewport();
        const gap = 14; // Separación 12–16px entre tarjeta clonada y menú

        // 1. Medir tarjeta original
        let origRect = this._initialTargetRect;
        if (targetEl && typeof targetEl.getBoundingClientRect === 'function') {
            const liveRect = targetEl.getBoundingClientRect();
            if (liveRect && liveRect.width > 0 && liveRect.height > 0) {
                origRect = liveRect;
                this._initialTargetRect = liveRect;
            }
        }

        const origLeft = origRect && origRect.width > 0 ? Math.round(origRect.left) : safe.safeLeft;
        const origTop = origRect && origRect.height > 0 ? Math.round(origRect.top) : safe.safeTop;
        const baseCardW = origRect && origRect.width > 0
            ? Math.min(Math.round(origRect.width), safe.safeWidth)
            : Math.min(340, safe.safeWidth);
        const baseCardH = origRect && origRect.height > 0 ? Math.round(origRect.height) : 110;

        if (clone) {
            clone.style.setProperty('transition', 'none', 'important');
            clone.classList.remove('longpress-clone-cropped');
            clone.style.maxHeight = '';
            clone.style.overflow = '';
            clone.style.left = `${origRect && origRect.width > 0 ? Math.round(origRect.left) : safe.safeLeft}px`;
            clone.style.top = `${origRect && origRect.height > 0 ? Math.round(origRect.top) : safe.safeTop}px`;
            clone.style.width = `${origRect && origRect.width > 0 ? Math.round(origRect.width) : baseCardW}px`;
            clone.style.height = `${baseCardH}px`;
            clone.style.transformOrigin = '0 0';
        }

        // 2. Medir menú contextual sin transformaciones activas
        dialog.classList.remove('dynamic-popup-in');
        dialog.style.position = 'fixed';
        dialog.style.margin = '0';
        dialog.style.left = `${safe.safeLeft}px`;
        dialog.style.top = `${safe.safeTop}px`;
        dialog.style.transform = 'none';

        const maxDlgW = Math.min(288, safe.safeWidth);
        const minDlgW = Math.min(236, safe.safeWidth);
        const targetDlgW = Math.max(minDlgW, Math.min(maxDlgW, Math.round(baseCardW)));
        dialog.style.width = `${targetDlgW}px`;
        dialog.style.maxWidth = `${maxDlgW}px`;

        const dlgRect = dialog.getBoundingClientRect();
        const dlgW = Math.min(Math.max(Math.round(dlgRect.width || dialog.offsetWidth || targetDlgW), minDlgW), safe.safeWidth);
        const dlgH = Math.max(Math.round(dlgRect.height || dialog.offsetHeight || 180), 140);

        // 3. Calcular escala y recorte si la tarjeta es muy alta para que [tarjeta + gap + menú] quepa siempre
        const rawOrigW = origRect && origRect.width > 0 ? Math.round(origRect.width) : baseCardW;
        const widthScale = rawOrigW > safe.safeWidth ? Math.max(0.85, safe.safeWidth / rawOrigW) : 1;
        const availCardH = Math.max(72, safe.safeHeight - gap - dlgH);

        let scale = widthScale;
        let croppedHeight = null;

        if (baseCardH * scale > availCardH) {
            const neededScale = availCardH / baseCardH;
            if (neededScale >= 0.85) {
                scale = Math.min(scale, neededScale);
            } else {
                scale = Math.min(scale, 0.85);
                croppedHeight = Math.max(64, Math.floor(availCardH / scale));
            }
        }

        scale = Math.round(scale * 1000) / 1000;
        const effectiveUnscaledH = croppedHeight !== null ? croppedHeight : baseCardH;

        if (clone && croppedHeight !== null) {
            clone.style.height = `${croppedHeight}px`;
            clone.style.maxHeight = `${croppedHeight}px`;
            clone.style.overflow = 'hidden';
            clone.classList.add('longpress-clone-cropped');
        }

        const cardVisualW = Math.round(rawOrigW * scale);
        const cardVisualH = Math.round(effectiveUnscaledH * scale);

        // 4. Resolver posición vertical conjunta sin superposición jamás
        let targetCardTop = origTop;
        let menuTop = origTop + cardVisualH + gap;
        let placedAbove = false;

        const fitsBelowAtOrig = (
            scale === 1 &&
            croppedHeight === null &&
            origTop >= safe.safeTop &&
            (origTop + cardVisualH + gap + dlgH <= safe.safeBottom)
        );

        const fitsAboveAtOrig = (
            scale === 1 &&
            croppedHeight === null &&
            (origTop + cardVisualH <= safe.safeBottom) &&
            (origTop - gap - dlgH >= safe.safeTop)
        );

        if (fitsBelowAtOrig) {
            // Caso 1 (Preferido): Menú debajo sin desplazar la tarjeta
            targetCardTop = origTop;
            menuTop = targetCardTop + cardVisualH + gap;
            placedAbove = false;
        } else if (fitsAboveAtOrig) {
            // Caso 2: Tarjeta en zona baja con espacio libre arriba -> Menú arriba
            targetCardTop = origTop;
            menuTop = targetCardTop - gap - dlgH;
            placedAbove = true;
        } else {
            // Caso 3 y 4: Desplazar verticalmente la tarjeta clonada dentro del área segura
            const cardCenterY = origTop + baseCardH / 2;
            const isBottomZone = cardCenterY > (safe.offsetTop + safe.vh * 0.66) && scale === 1 && croppedHeight === null;

            if (isBottomZone && (safe.safeBottom - cardVisualH - gap - dlgH >= safe.safeTop)) {
                const minCardTopForAbove = safe.safeTop + dlgH + gap;
                const maxCardTopForAbove = safe.safeBottom - cardVisualH;
                targetCardTop = Math.round(Math.max(minCardTopForAbove, Math.min(origTop, maxCardTopForAbove)));
                menuTop = Math.round(targetCardTop - gap - dlgH);
                placedAbove = true;
            } else {
                const maxCardTopForBelow = Math.max(safe.safeTop, safe.safeBottom - dlgH - gap - cardVisualH);
                targetCardTop = Math.round(Math.max(safe.safeTop, Math.min(origTop, maxCardTopForBelow)));
                menuTop = Math.round(targetCardTop + cardVisualH + gap);
                placedAbove = false;
            }
        }

        // Garantía estricta de contención en safe area
        if (!placedAbove && menuTop + dlgH > safe.safeBottom) {
            menuTop = safe.safeBottom - dlgH;
            targetCardTop = Math.max(safe.safeTop, menuTop - gap - cardVisualH);
        } else if (placedAbove && menuTop < safe.safeTop) {
            menuTop = safe.safeTop;
            targetCardTop = Math.min(safe.safeBottom - cardVisualH, menuTop + dlgH + gap);
        }

        // 5. Resolver posición horizontal de tarjeta clonada y menú
        const centeredCardLeft = origLeft + Math.round((rawOrigW - cardVisualW) / 2);
        const targetCardLeft = Math.round(Math.max(safe.safeLeft, Math.min(centeredCardLeft, safe.safeRight - cardVisualW)));

        const pos = this.activePosition;
        const pressX = (pos && typeof pos.clientX === 'number' && !Number.isNaN(pos.clientX))
            ? pos.clientX
            : (targetCardLeft + cardVisualW / 2);

        let menuLeft;
        if (pressX <= targetCardLeft + cardVisualW / 2) {
            menuLeft = targetCardLeft;
        } else {
            menuLeft = targetCardLeft + cardVisualW - dlgW;
        }
        menuLeft = Math.round(Math.max(safe.safeLeft, Math.min(menuLeft, safe.safeRight - dlgW)));

        const dx = Math.round((targetCardLeft - origLeft) * 100) / 100;
        const dy = Math.round((targetCardTop - origTop) * 100) / 100;

        if (clone) {
            clone.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
            clone.dataset.dx = String(dx);
            clone.dataset.dy = String(dy);
            clone.dataset.scale = String(scale);
            void clone.offsetWidth;
            clone.style.removeProperty('transition');
        }

        const originX = Math.max(16, Math.min(dlgW - 16, Math.round(pressX - menuLeft)));
        dialog.style.left = `${menuLeft}px`;
        dialog.style.top = `${menuTop}px`;
        dialog.style.transformOrigin = `${originX}px ${placedAbove ? '100%' : '0%'}`;

        if (!this.isReducedMotion()) {
            void dialog.offsetWidth;
            dialog.classList.add('dynamic-popup-in');
        }

        this.lastLayoutMetrics = {
            safeBox: safe,
            origRect: { left: origLeft, top: origTop, width: rawOrigW, height: baseCardH },
            cardRect: { left: targetCardLeft, top: targetCardTop, width: cardVisualW, height: cardVisualH, right: targetCardLeft + cardVisualW, bottom: targetCardTop + cardVisualH },
            menuRect: { left: menuLeft, top: menuTop, width: dlgW, height: dlgH, right: menuLeft + dlgW, bottom: menuTop + dlgH },
            gap,
            scale,
            cropped: croppedHeight !== null,
            placedAbove,
            dx,
            dy
        };

        return this.lastLayoutMetrics;
    },

    reposition() {
        if (!this.activeMenuEl || this.activeMenuEl.classList.contains('hidden')) return null;
        return this.layoutCloneAndMenu();
    },

    show({ targetEl, title, onEdit, onDelete, position }) {
        try {
            this.close();
            const popup = this.ensurePopup();
            if (!popup) return;

            window.ScrollLockManager?.lock('card-context-menu');

            const titleEl = popup.querySelector('[data-popup-title]');
            if (titleEl) titleEl.textContent = title || 'Opciones';

            this.activeMenuEl = popup;
            this.activeTargetEl = targetEl || null;
            this.activePosition = position || null;
            this._initialTargetRect = null;

            const stage = popup.querySelector('#card-dynamic-clone-stage');
            if (stage) stage.innerHTML = '';

            if (targetEl && typeof targetEl.cloneNode === 'function') {
                const targetRect = targetEl.getBoundingClientRect ? targetEl.getBoundingClientRect() : null;
                this._initialTargetRect = targetRect;

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
                const btn = old.cloneNode(true);
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

            this.layoutCloneAndMenu();

            requestAnimationFrame(() => {
                if (this.activeMenuEl === popup && !popup.classList.contains('hidden')) {
                    popup.classList.add('active');
                }
            });
        } catch (err) {
            console.error('Error al abrir CardContextMenu:', err);
            this.close();
            window.ScrollLockManager?.forceUnlockAll?.();
        }
    },

    close() {
        try {
            if (this.activeCloneEl && this.activeTargetEl) {
                // Regresar el clon a su posición y escala originales antes de retirarlo del DOM
                this.activeCloneEl.style.setProperty('transition', 'none', 'important');
                this.activeCloneEl.classList.remove('longpress-clone-cropped');
                this.activeCloneEl.style.maxHeight = '';
                this.activeCloneEl.style.overflow = '';
                if (this._initialTargetRect && this._initialTargetRect.height > 0) {
                    this.activeCloneEl.style.height = `${Math.round(this._initialTargetRect.height)}px`;
                }
                this.activeCloneEl.style.transform = 'translate3d(0px, 0px, 0px) scale(1)';
                void this.activeCloneEl.offsetWidth;

                const returnedRect = this.activeCloneEl.getBoundingClientRect();
                const targetRect = this.activeTargetEl.getBoundingClientRect();
                this.lastCloseState = {
                    returnedRect: {
                        left: returnedRect.left,
                        top: returnedRect.top,
                        width: returnedRect.width,
                        height: returnedRect.height
                    },
                    targetRect: {
                        left: targetRect.left,
                        top: targetRect.top,
                        width: targetRect.width,
                        height: targetRect.height
                    },
                    deltaX: Math.abs(returnedRect.left - targetRect.left),
                    deltaY: Math.abs(returnedRect.top - targetRect.top),
                    deltaW: Math.abs(returnedRect.width - targetRect.width),
                    deltaH: Math.abs(returnedRect.height - targetRect.height)
                };
            }

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
                    dialog.style.width = '';
                    dialog.style.maxWidth = '';
                    dialog.style.transform = '';
                    dialog.style.transformOrigin = '';
                }
            }
            this.activeMenuEl = null;
            this.activePosition = null;
            this._initialTargetRect = null;
        } finally {
            window.ScrollLockManager?.unlock('card-context-menu');
        }
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
            <div class="modal-dialog dynamic-popup liquid-glass-popover relative z-20 w-full max-w-xs bg-white/90 dark:bg-slate-800/90 rounded-3xl shadow-2xl border border-white/60 dark:border-white/15 p-3.5 space-y-1.5">
                <div data-popup-title class="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate px-1">Opciones</div>
                <button type="button" data-context-action="edit" class="tap-effect touch-target-44 min-h-[44px] w-full flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-sm font-bold bg-indigo-50/90 dark:bg-slate-700/80 text-indigo-700 dark:text-indigo-300"><span>✏️</span><span>Editar</span></button>
                <button type="button" data-context-action="delete" class="tap-effect touch-target-44 min-h-[44px] w-full flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-sm font-bold bg-rose-50/90 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"><span>🗑️</span><span>Eliminar</span></button>
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

        // Supresión de clic fantasma al soltar el dedo tras pulsación larga (acotado a la tarjeta origen)
        window.addEventListener('click', (e) => {
            if (Date.now() < this._suppressGhostClickUntil) {
                const target = this._suppressGhostClickTarget;
                this._suppressGhostClickUntil = 0;
                this._suppressGhostClickTarget = null;
                if (!target || e.target === target || (typeof target.contains === 'function' && target.contains(e.target))) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === 'function') {
                        e.stopImmediatePropagation();
                    }
                }
            }
        }, true);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });

        document.addEventListener('click', (e) => {
            const popup = document.getElementById('card-dynamic-popup');
            if (!popup || popup.classList.contains('hidden')) return;
            if (e.target === popup || e.target.closest('[data-popup-close]')) this.close();
        });

        // Recálculo en vivo al rotar o redimensionar y desbloqueo garantizado ante eventos de ciclo de vida
        const handleResize = () => {
            if (this.activeMenuEl && !this.activeMenuEl.classList.contains('hidden')) {
                this.reposition();
            }
        };
        window.addEventListener('resize', handleResize, { passive: true });
        window.addEventListener('orientationchange', handleResize, { passive: true });
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize, { passive: true });
        }

        window.addEventListener('popstate', () => this.close());
        window.addEventListener('pagehide', () => this.close());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.close();
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

            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                timer = null;
                isLongPress = true;
                window.HapticsModule?.medium?.();
                this.show({ targetEl: element, title, onEdit, onDelete, position: { clientX: startX, clientY: startY } });
            }, 450);
        };

        const onTouchMove = (e) => {
            if (isLongPress) {
                if (e.cancelable) e.preventDefault();
                return;
            }
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
                isLongPress = false;
                this._suppressGhostClickUntil = Date.now() + 400;
                this._suppressGhostClickTarget = element;
                if (e.cancelable) e.preventDefault();
                e.stopPropagation();
            }
        };

        element.addEventListener('touchstart', onTouchStart, { passive: true });
        element.addEventListener('touchmove', onTouchMove, { passive: false });
        element.addEventListener('touchend', onTouchEnd);
        element.addEventListener('touchcancel', onTouchEnd);

        element.addEventListener('mousedown', (e) => {
            if (e.button === 0) onTouchStart(e);
        });
        element.addEventListener('mousemove', onTouchMove);
        element.addEventListener('mouseup', onTouchEnd);
        element.addEventListener('mouseleave', () => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        });

        // Menú contextual en clic derecho desktop
        element.addEventListener('contextmenu', (e) => {
            if (!this.isEnabled()) return;
            if (e.target.closest('input, button, a, [data-action="toggle"], [data-action="archive"]')) return;
            e.preventDefault();
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
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

