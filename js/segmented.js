/**
 * segmented.js - Controles Segmentados con Indicador Deslizante de Cristal (v1.5.3 Etapa 1)
 * Gestiona un indicador único por cada .segmented-control-track con animación spring
 * tipo Apple (cubic-bezier(0.32, 1.25, 0.4, 1)), deformación líquida sutil en trayecto,
 * persistencia ante re-renderizados de DOM, navegación por teclado y soporte de accesibilidad.
 */

window.SegmentedControl = (() => {
    const TRACK_SELECTOR = '.segmented-control-track, .notes-segmented-control';
    const INDICATOR_CLASS = 'segmented-glass-indicator';
    const trackStates = new WeakMap();
    const persistentKeyStates = new Map();
    let globalInited = false;
    let lastHapticAt = 0;

    function isReducedMotion() {
        try {
            return Boolean(
                window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches
            );
        } catch {
            return false;
        }
    }

    function getGlassIntensity() {
        return document.documentElement.getAttribute('data-glass-intensity') ||
            window.StorageModule?.getGlassIntensity?.() ||
            'normal';
    }

    function triggerLightHaptic() {
        const now = Date.now();
        if (now - lastHapticAt < 40) return;
        lastHapticAt = now;
        window.HapticsModule?.light?.();
    }

    function getTrackPersistenceKey(track) {
        if (!track) return '';
        if (track.id) return `id:${track.id}`;
        if (track.getAttribute('aria-label')) return `aria:${track.getAttribute('aria-label')}`;
        if (track.querySelector('[data-task-filter]')) return 'track:tasks-filter';
        if (track.querySelector('[data-archive-filter]')) return 'track:archive-filter';
        if (track.querySelector('[data-notes-tab]')) return 'track:notes-tabs';
        if (track.querySelector('[data-glass-intensity]')) return 'track:glass-intensity';
        return '';
    }

    function getTrackButtons(track) {
        if (!track) return [];
        return Array.from(track.querySelectorAll('button')).filter(btn => btn.closest(TRACK_SELECTOR) === track);
    }

    function getButtonKey(btn, index) {
        if (!btn) return String(index);
        return (
            btn.id ||
            btn.dataset.taskFilter ||
            btn.dataset.archiveFilter ||
            btn.dataset.notesTab ||
            btn.dataset.glassIntensity ||
            btn.getAttribute('data-value') ||
            `idx_${index}`
        );
    }

    function detectActiveIndex(buttons) {
        if (!buttons || buttons.length === 0) return -1;

        // 1. Priorizar botones de Notas | Galería (notes-seg-active o aria-selected="true")
        const hasNotesTabs = buttons.some(b => b.hasAttribute('data-notes-tab') || b.classList.contains('notes-seg-btn'));
        if (hasNotesTabs) {
            const idx = buttons.findIndex(b => b.classList.contains('notes-seg-active') || b.getAttribute('aria-selected') === 'true');
            return idx >= 0 ? idx : 0;
        }

        // 2. Priorizar selector de intensidad del cristal (aria-pressed="true")
        const hasGlassIntensity = buttons.some(b => b.hasAttribute('data-glass-intensity'));
        if (hasGlassIntensity) {
            const currentAttr = document.documentElement.getAttribute('data-glass-intensity');
            let idx = buttons.findIndex(b => b.getAttribute('aria-pressed') === 'true');
            if (idx === -1 && currentAttr) {
                idx = buttons.findIndex(b => b.dataset.glassIntensity === currentAttr);
            }
            return idx >= 0 ? idx : 0;
        }

        // 3. Priorizar filtros de Tareas y Baúl (bg-indigo-600 / active-archive-filter)
        const hasFilterAttr = buttons.some(b => b.hasAttribute('data-task-filter') || b.hasAttribute('data-archive-filter'));
        if (hasFilterAttr) {
            const idx = buttons.findIndex(b =>
                b.classList.contains('bg-indigo-600') ||
                b.classList.contains('active-archive-filter')
            );
            if (idx >= 0) return idx;
        }

        // 4. Fallback general por atributos semánticos o clases activas
        const genericIdx = buttons.findIndex(b =>
            b.getAttribute('aria-selected') === 'true' ||
            b.getAttribute('aria-pressed') === 'true' ||
            b.classList.contains('seg-btn-active') ||
            b.classList.contains('bg-indigo-600') ||
            b.classList.contains('active')
        );
        return genericIdx >= 0 ? genericIdx : 0;
    }

    function syncButtonSemantics(buttons, activeIdx) {
        buttons.forEach((btn, idx) => {
            const isActive = idx === activeIdx;
            if (btn.classList.contains('seg-btn-active') !== isActive) {
                btn.classList.toggle('seg-btn-active', isActive);
            }
            if (btn.classList.contains('seg-btn-inactive') !== !isActive) {
                btn.classList.toggle('seg-btn-inactive', !isActive);
            }
            const activeStr = isActive ? 'true' : 'false';
            if (btn.getAttribute('data-seg-active') !== activeStr) {
                btn.setAttribute('data-seg-active', activeStr);
            }

            if (btn.hasAttribute('data-task-filter') || btn.hasAttribute('data-archive-filter') || btn.getAttribute('role') === 'tab') {
                if (btn.getAttribute('aria-selected') !== activeStr) {
                    btn.setAttribute('aria-selected', activeStr);
                }
            }
        });
    }

    function createIndicatorElement() {
        const el = document.createElement('span');
        el.className = `${INDICATOR_CLASS} is-instant`;
        el.setAttribute('data-segmented-indicator', 'true');
        el.setAttribute('aria-hidden', 'true');
        el.dataset.firstRenderAnimated = 'false';
        return el;
    }

    function ensureState(track) {
        let state = trackStates.get(track);
        if (state) return state;

        const persistKey = getTrackPersistenceKey(track);
        const saved = persistKey ? persistentKeyStates.get(persistKey) : null;

        const existingIndicators = Array.from(track.querySelectorAll(`:scope > .${INDICATOR_CLASS}, :scope > [data-segmented-indicator]`));
        let indicatorEl = saved?.indicatorEl || existingIndicators[0] || createIndicatorElement();

        existingIndicators.forEach(node => {
            if (node !== indicatorEl) node.remove();
        });

        if (indicatorEl.parentNode !== track) {
            track.insertBefore(indicatorEl, track.firstChild);
        }

        state = {
            track,
            persistKey,
            indicatorEl,
            hasMeasured: Boolean(saved?.hasMeasured),
            lastX: saved?.lastX ?? 0,
            lastY: saved?.lastY ?? 0,
            lastW: saved?.lastW ?? 0,
            lastH: saved?.lastH ?? 0,
            lastActiveIndex: saved?.lastActiveIndex ?? -1,
            lastActiveKey: saved?.lastActiveKey ?? '',
            animTimer: null,
            rafId: null,
            isSyncing: false
        };

        trackStates.set(track, state);
        if (persistKey) {
            persistentKeyStates.set(persistKey, state);
        }
        return state;
    }

    function captureSnapshotBeforeRerender(track) {
        const state = trackStates.get(track);
        if (!state || !state.indicatorEl) return;
        const buttons = getTrackButtons(track);
        const activeIdx = detectActiveIndex(buttons);
        if (activeIdx >= 0 && buttons[activeIdx]) {
            const trackRect = track.getBoundingClientRect();
            const btnRect = buttons[activeIdx].getBoundingClientRect();
            if (trackRect.width > 0 && btnRect.width > 0) {
                state.lastX = Math.round((btnRect.left - trackRect.left - (track.clientLeft || 0) + (track.scrollLeft || 0)) * 100) / 100;
                state.lastY = Math.round((btnRect.top - trackRect.top - (track.clientTop || 0) + (track.scrollTop || 0)) * 100) / 100;
                state.lastW = Math.round(btnRect.width * 100) / 100;
                state.lastH = Math.round(btnRect.height * 100) / 100;
                state.hasMeasured = true;
                state.lastActiveIndex = activeIdx;
                state.lastActiveKey = getButtonKey(buttons[activeIdx], activeIdx);
            }
        }
    }

    function installInnerHTMLHook(track) {
        if (track._segmentedInnerHTMLHooked) return;
        const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        if (!desc || typeof desc.get !== 'function' || typeof desc.set !== 'function') return;

        try {
            Object.defineProperty(track, 'innerHTML', {
                configurable: true,
                enumerable: desc.enumerable,
                get() {
                    return desc.get.call(this);
                },
                set(html) {
                    captureSnapshotBeforeRerender(this);
                    desc.set.call(this, html);
                    syncTrack(this, { fromRerender: true });
                }
            });
            track._segmentedInnerHTMLHooked = true;
        } catch {
            // Fallback silencioso a MutationObserver si el entorno restringe defineProperty
        }
    }

    function clearAnimationState(state) {
        if (!state || !state.indicatorEl) return;
        if (state.animTimer) {
            clearTimeout(state.animTimer);
            state.animTimer = null;
        }
        state.indicatorEl.classList.remove('is-animating', 'is-deforming');
        state.indicatorEl.removeAttribute('data-deforming');
        state.indicatorEl.style.willChange = 'auto';
    }

    /**
     * Sincroniza la posición y anchura del indicador con el botón activo del track.
     * Realiza primero todas las lecturas geométricas y después las escrituras de estilo
     * para evitar layout thrashing.
     */
    function syncTrack(track, options = {}) {
        if (!track || !(track instanceof Element)) return;
        if (!track.classList.contains('segmented-control-track')) {
            track.classList.add('segmented-control-track');
        }
        track.setAttribute('data-segmented-ready', 'true');

        const state = ensureState(track);
        if (state.isSyncing) return;
        state.isSyncing = true;

        try {
            const indicator = state.indicatorEl;

            // Eliminar duplicados que pudieran haberse inyectado al clonar o reescribir innerHTML
            const allInds = track.querySelectorAll(`:scope > .${INDICATOR_CLASS}, :scope > [data-segmented-indicator]`);
            allInds.forEach(node => {
                if (node !== indicator) node.remove();
            });
            if (indicator.parentNode !== track) {
                track.insertBefore(indicator, track.firstChild);
            } else if (track.firstElementChild !== indicator) {
                track.insertBefore(indicator, track.firstChild);
            }

            const buttons = getTrackButtons(track);
            if (buttons.length === 0) return;

            const activeIdx = detectActiveIndex(buttons);
            const activeBtn = buttons[activeIdx] || buttons[0];
            const activeKey = getButtonKey(activeBtn, activeIdx);

            // FASE 1: LECTURA GEOMÉTRICA EN LOTE (sin escrituras previas)
            const trackRect = track.getBoundingClientRect();
            const btnRect = activeBtn.getBoundingClientRect();
            const clientLeft = track.clientLeft || 0;
            const clientTop = track.clientTop || 0;
            const scrollLeft = track.scrollLeft || 0;
            const scrollTop = track.scrollTop || 0;

            // FASE 2: ESCRITURA SEMÁNTICA EN BOTONES
            syncButtonSemantics(buttons, activeIdx);

            // Si el track está oculto (display: none -> dimensiones 0), marcar como no medido aún
            if (trackRect.width <= 0 || trackRect.height <= 0 || btnRect.width <= 0 || btnRect.height <= 0) {
                state.hasMeasured = false;
                state.lastActiveIndex = activeIdx;
                state.lastActiveKey = activeKey;
                return;
            }

            const nextX = Math.round((btnRect.left - trackRect.left - clientLeft + scrollLeft) * 100) / 100;
            const nextY = Math.round((btnRect.top - trackRect.top - clientTop + scrollTop) * 100) / 100;
            const nextW = Math.round(btnRect.width * 100) / 100;
            const nextH = Math.round(btnRect.height * 100) / 100;

            const reduced = isReducedMotion();
            const intensity = getGlassIntensity();
            const prevIdx = state.lastActiveIndex;
            const prevKey = state.lastActiveKey;
            const hasPrevMeasurement = state.hasMeasured && state.lastW > 0 && state.lastH > 0;
            const indexChanged = hasPrevMeasurement && (prevIdx !== activeIdx || (prevKey && prevKey !== activeKey));
            const geometryMoved = hasPrevMeasurement && (Math.abs(nextX - state.lastX) > 0.5 || Math.abs(nextW - state.lastW) > 0.5);

            const shouldAnimate = Boolean(
                hasPrevMeasurement &&
                !options.instant &&
                !reduced &&
                (indexChanged || (options.fromRerender && geometryMoved) || options.forceAnimate)
            );

            const isRedundantSameTarget = Boolean(
                hasPrevMeasurement &&
                !options.instant &&
                !reduced &&
                !shouldAnimate &&
                !geometryMoved &&
                prevIdx === activeIdx
            );

            indicator.dataset.activeIndex = String(activeIdx);
            indicator.dataset.targetX = String(nextX);
            indicator.dataset.targetWidth = String(nextW);

            if (isRedundantSameTarget) {
                // El indicador ya está en (o animándose hacia) este mismo botón activo;
                // no reiniciar ni añadir .is-instant para no cortar la transición en curso.
                if (!reduced && indicator.classList.contains('is-instant')) {
                    indicator.classList.remove('is-instant');
                }
            } else if (!shouldAnimate) {
                clearAnimationState(state);
                indicator.classList.add('is-instant');
                indicator.style.width = `${nextW}px`;
                indicator.style.height = `${nextH}px`;
                indicator.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;

                if (!hasPrevMeasurement) {
                    indicator.dataset.firstRenderAnimated = 'false';
                }

                // Forzar commit sin transición en este frame
                void indicator.offsetWidth;

                if (state.rafId) cancelAnimationFrame(state.rafId);
                if (!reduced) {
                    state.rafId = requestAnimationFrame(() => {
                        state.rafId = null;
                        if (!isReducedMotion()) {
                            indicator.classList.remove('is-instant');
                        }
                    });
                }
            } else {
                if (state.rafId) {
                    cancelAnimationFrame(state.rafId);
                    state.rafId = null;
                }

                // Si proviene de un re-render, fijar primero la posición previa sin transición
                // para que el indicador se deslice continuamente desde su lugar anterior
                if (options.fromRerender) {
                    indicator.classList.add('is-instant');
                    indicator.style.width = `${state.lastW}px`;
                    indicator.style.height = `${state.lastH}px`;
                    indicator.style.transform = `translate3d(${state.lastX}px, ${state.lastY}px, 0)`;
                    void indicator.offsetWidth;
                }

                if (indicator.classList.contains('is-instant')) {
                    indicator.classList.remove('is-instant');
                    void indicator.offsetWidth;
                }

                const stepSpan = Math.max(1, Math.abs(activeIdx - (prevIdx >= 0 ? prevIdx : activeIdx)));
                indicator.classList.add('is-animating');
                indicator.style.willChange = 'transform, width';

                if (intensity !== 'suave') {
                    const stretchX = Math.min(1.14, 1.06 + stepSpan * 0.028);
                    const squishY = Math.max(0.89, 0.95 - stepSpan * 0.02);
                    indicator.style.setProperty('--seg-stretch-x', stretchX.toFixed(3));
                    indicator.style.setProperty('--seg-squish-y', squishY.toFixed(3));
                    indicator.classList.remove('is-deforming');
                    void indicator.offsetWidth;
                    indicator.classList.add('is-deforming');
                    indicator.setAttribute('data-deforming', 'true');
                } else {
                    indicator.classList.remove('is-deforming');
                    indicator.removeAttribute('data-deforming');
                }

                indicator.style.width = `${nextW}px`;
                indicator.style.height = `${nextH}px`;
                indicator.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;

                if (state.animTimer) clearTimeout(state.animTimer);
                const settleMs = intensity === 'suave' ? 240 : 460;
                state.animTimer = setTimeout(() => {
                    clearAnimationState(state);
                }, settleMs);
            }

            state.hasMeasured = true;
            state.lastX = nextX;
            state.lastY = nextY;
            state.lastW = nextW;
            state.lastH = nextH;
            state.lastActiveIndex = activeIdx;
            state.lastActiveKey = activeKey;
        } finally {
            try {
                state.mutationObserver?.takeRecords?.();
            } catch {}
            state.isSyncing = false;
        }
    }

    function applyFallbackButtonAction(btn, track) {
        if (!btn || !track) return;
        const buttons = getTrackButtons(track);

        // Si el botón fue recreado mediante innerHTML y perdió su listener original,
        // sincronizamos clases y módulos correspondientes sin duplicar si ya se ejecutó.
        if (btn.hasAttribute('data-task-filter')) {
            const alreadyActive = btn.classList.contains('bg-indigo-600');
            if (!alreadyActive) {
                buttons.forEach(b => {
                    b.classList.remove('bg-indigo-600', 'text-white', 'shadow-md', 'bg-slate-100', 'dark:bg-slate-800');
                    b.classList.add('text-slate-600', 'dark:text-slate-300');
                });
                btn.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
                btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300', 'dark:text-slate-400');
                window.TasksModule?.setFilter?.(btn.dataset.taskFilter);
            }
        } else if (btn.hasAttribute('data-archive-filter')) {
            const alreadyActive = btn.classList.contains('bg-indigo-600') || btn.classList.contains('active-archive-filter');
            if (!alreadyActive) {
                buttons.forEach(b => {
                    b.classList.remove('bg-indigo-600', 'text-white', 'shadow-xs', 'active-archive-filter', 'bg-slate-100', 'dark:bg-slate-700/60');
                    b.classList.add('text-slate-600', 'dark:text-slate-300');
                });
                btn.classList.add('bg-indigo-600', 'text-white', 'shadow-xs', 'active-archive-filter');
                btn.classList.remove('bg-slate-100', 'dark:bg-slate-700/60', 'text-slate-600', 'dark:text-slate-300');
                window.ArchiveModule?.setFilter?.(btn.dataset.archiveFilter);
            }
        } else if (btn.hasAttribute('data-notes-tab')) {
            const isSelected = btn.getAttribute('aria-selected') === 'true' && btn.classList.contains('notes-seg-active');
            if (!isSelected) {
                window.NotesModule?.switchNotesTab?.(btn.dataset.notesTab);
            }
        } else if (btn.hasAttribute('data-glass-intensity')) {
            const isPressed = btn.getAttribute('aria-pressed') === 'true';
            if (!isPressed) {
                const lvl = btn.dataset.glassIntensity;
                window.StorageModule?.setGlassIntensity?.(lvl);
                window.OrganizadorApp?.applyGlassIntensity?.(lvl);
            }
        } else {
            // Track genérico personalizado
            buttons.forEach(b => {
                const match = b === btn;
                b.classList.toggle('seg-btn-active', match);
                if (b.hasAttribute('aria-selected')) b.setAttribute('aria-selected', match ? 'true' : 'false');
                if (b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', match ? 'true' : 'false');
            });
        }
    }

    function initTrack(track) {
        if (!track || !(track instanceof Element)) return;
        const state = ensureState(track);
        installInnerHTMLHook(track);

        if (!track._segmentedObserved) {
            track._segmentedObserved = true;

            // Listener de transitionend para limpiar will-change inmediatamente al asentar
            state.indicatorEl.addEventListener('transitionend', (e) => {
                if (e.target === state.indicatorEl && (e.propertyName === 'transform' || e.propertyName === 'width')) {
                    clearAnimationState(state);
                }
            });

            // Scroll horizontal del track (si ocurriera)
            track.addEventListener('scroll', () => {
                syncTrack(track, { instant: true });
            }, { passive: true });

            // Observador de mutaciones en el track (clases, aria-*, o reemplazo de hijos)
            if (typeof MutationObserver !== 'undefined') {
                const mo = new MutationObserver((mutations) => {
                    if (state.isSyncing) return;
                    let childChanged = false;
                    let attrChanged = false;
                    for (const m of mutations) {
                        if (m.type === 'childList') {
                            childChanged = true;
                        } else if (m.type === 'attributes' && m.target !== state.indicatorEl) {
                            attrChanged = true;
                        }
                    }
                    if (childChanged) {
                        syncTrack(track, { fromRerender: true });
                    } else if (attrChanged) {
                        syncTrack(track);
                    }
                });
                mo.observe(track, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class', 'aria-selected', 'aria-pressed']
                });
                state.mutationObserver = mo;
            }

            // ResizeObserver para recalcular cuando pasa de display:none -> visible o cambia tamaño
            if (typeof ResizeObserver !== 'undefined') {
                const ro = new ResizeObserver(() => {
                    if (state.isSyncing) return;
                    syncTrack(track, { instant: true });
                });
                ro.observe(track);
                getTrackButtons(track).forEach(btn => ro.observe(btn));
                state.resizeObserver = ro;
            }
        }

        syncTrack(track, { instant: !state.hasMeasured });
    }

    function syncAll(options = {}) {
        document.querySelectorAll(TRACK_SELECTOR).forEach(track => {
            if (!track._segmentedObserved) {
                initTrack(track);
            } else {
                syncTrack(track, options);
            }
        });
    }

    function handleCaptureClick(e) {
        const btn = e.target && typeof e.target.closest === 'function' ? e.target.closest('button') : null;
        if (!btn || btn.disabled) return;
        const track = btn.closest(TRACK_SELECTOR);
        if (!track) return;

        // Registrar en fase de captura un listener de una sola ejecución en el propio botón:
        // se ejecuta en la fase target inmediatamente después del onclick/addEventListener original
        // del botón, incluso si dicho handler invoca e.stopPropagation().
        btn.addEventListener('click', () => {
            triggerLightHaptic();
            applyFallbackButtonAction(btn, track);
            syncTrack(track);
        }, { once: true });
    }

    function handleDelegatedKeydown(e) {
        const targetEl = e.target instanceof Element ? e.target : null;
        if (!targetEl) return;
        const track = targetEl.closest(TRACK_SELECTOR);
        if (!track) return;

        const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
        if (!keys.includes(e.key)) return;

        const buttons = getTrackButtons(track).filter(b => !b.disabled);
        if (buttons.length <= 1) return;

        let btn = targetEl.closest('button');
        if (!btn || !buttons.includes(btn)) {
            const focusedBtn = document.activeElement instanceof Element ? document.activeElement.closest('button') : null;
            if (focusedBtn && buttons.includes(focusedBtn)) {
                btn = focusedBtn;
            } else {
                const activeIdx = detectActiveIndex(buttons);
                btn = buttons[activeIdx >= 0 ? activeIdx : 0];
            }
        }

        const currentIdx = buttons.indexOf(btn);
        if (currentIdx === -1) return;

        e.preventDefault();
        let nextIdx = currentIdx;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            nextIdx = (currentIdx + 1) % buttons.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            nextIdx = (currentIdx - 1 + buttons.length) % buttons.length;
        } else if (e.key === 'Home') {
            nextIdx = 0;
        } else if (e.key === 'End') {
            nextIdx = buttons.length - 1;
        }

        const targetBtn = buttons[nextIdx];
        if (targetBtn && targetBtn !== btn) {
            targetBtn.focus();
            targetBtn.click();
            syncTrack(track, { forceAnimate: true });
        }
    }

    function init() {
        if (globalInited) {
            syncAll();
            return;
        }
        globalInited = true;

        syncAll({ instant: true });

        document.addEventListener('click', handleCaptureClick, true);
        document.addEventListener('keydown', handleDelegatedKeydown, true);

        window.addEventListener('resize', () => syncAll({ instant: true }), { passive: true });
        window.addEventListener('orientationchange', () => {
            setTimeout(() => syncAll({ instant: true }), 60);
        }, { passive: true });

        if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
            document.fonts.ready.then(() => {
                syncAll({ instant: true });
            }).catch(() => {});
        }

        if (typeof MutationObserver !== 'undefined' && document.body) {
            const bodyObserver = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    if (m.type === 'childList' && m.addedNodes.length > 0) {
                        m.addedNodes.forEach(node => {
                            if (node instanceof Element) {
                                if (node.matches(TRACK_SELECTOR)) initTrack(node);
                                node.querySelectorAll?.(TRACK_SELECTOR)?.forEach(initTrack);
                            }
                        });
                    }
                }
            });
            bodyObserver.observe(document.body, { childList: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        init,
        initTrack,
        sync: syncTrack,
        syncAll
    };
})();
