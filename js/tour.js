/**
 * tour.js - Tutorial Interactivo Animado en 9 Pasos (v1.7.0)
 * 3 capítulos: Materias (1-3), Tareas (4-6), Notas y Personalización (7-9).
 * Solo anima transform y opacity; se adapta a Reducir efectos y prefers-reduced-motion.
 */
(() => {
    'use strict';

    const AUTO_ADVANCE_MS = 5000;

    const STEPS = [
        // Capítulo 1: Materias (1-3)
        {
            id: 'subjects-add',
            chapter: 'Capítulo 1 · Materias',
            view: 'subjects',
            spotlightSelector: '#bottom-nav [data-view-target="subjects"], #desktop-nav-pill [data-view-target="subjects"]',
            badge: '1 / 9 · Materias',
            title: 'Organiza tus materias y horarios',
            desc: 'Registra cada asignatura con su color propio, días de clase y hora de inicio para ver tu agenda de un vistazo.',
            svg: `
                <svg viewBox="0 0 220 110" class="w-full h-full" aria-hidden="true">
                    <rect x="20" y="18" width="180" height="74" rx="14" class="fill-white/80 dark:fill-slate-800/90 stroke-indigo-300 dark:stroke-indigo-700" stroke-width="1.5"/>
                    <rect x="20" y="28" width="5" height="54" rx="2.5" fill="#6366f1"/>
                    <rect x="36" y="30" width="94" height="10" rx="5" class="fill-slate-800/80 dark:fill-slate-100/85"/>
                    <rect x="36" y="48" width="66" height="7" rx="3.5" class="fill-indigo-500/45"/>
                    <g class="tour-anim-float">
                        <rect x="138" y="28" width="48" height="18" rx="9" fill="#4f46e5"/>
                        <text x="162" y="40" text-anchor="middle" fill="#ffffff" font-size="8" font-weight="bold">Lun · Mié</text>
                    </g>
                    <g class="tour-anim-pulse">
                        <circle cx="172" cy="70" r="11" fill="#10b981"/>
                        <path d="M167 70l3 3 7-7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
                    </g>
                </svg>`
        },
        {
            id: 'subjects-alarms',
            chapter: 'Capítulo 1 · Materias',
            view: 'subjects',
            spotlightSelector: '#bottom-nav [data-view-target="subjects"], #desktop-nav-pill [data-view-target="subjects"]',
            badge: '2 / 9 · Materias',
            title: 'Recordatorios antes de entrar a clase',
            desc: 'Elige avisos automáticos 5, 10 o 15 minutos antes de tu clase con sonidos propios integrados en la app.',
            svg: `
                <svg viewBox="0 0 220 110" class="w-full h-full" aria-hidden="true">
                    <circle cx="110" cy="55" r="34" class="fill-indigo-500/15 stroke-indigo-400/50" stroke-width="1.5"/>
                    <g class="tour-anim-swing">
                        <path d="M110 28c-10 0-17 7-17 17v11l-5 6v3h44v-3l-5-6V45c0-10-7-17-17-17z" fill="#6366f1"/>
                        <circle cx="110" cy="72" r="5" fill="#4338ca"/>
                    </g>
                    <g class="tour-anim-float">
                        <rect x="134" y="20" width="60" height="20" rx="10" fill="#0ea5e9"/>
                        <text x="164" y="33" text-anchor="middle" fill="#fff" font-size="8" font-weight="bold">10 min antes</text>
                    </g>
                </svg>`
        },
        {
            id: 'subjects-placement',
            chapter: 'Capítulo 1 · Materias',
            view: 'subjects',
            spotlightSelector: '#bottom-nav [data-view-target="subjects"], #desktop-nav-pill [data-view-target="subjects"]',
            badge: '3 / 9 · Materias',
            title: 'Botón adaptable Arriba o Abajo',
            desc: 'Cuando tengas 8 o más materias, «+ Nueva materia» baja automáticamente para que siempre esté al alcance de tu pulgar.',
            svg: `
                <svg viewBox="0 0 220 110" class="w-full h-full" aria-hidden="true">
                    <rect x="50" y="14" width="120" height="82" rx="14" class="fill-white/75 dark:fill-slate-800/85 stroke-slate-300 dark:stroke-slate-700" stroke-width="1.5"/>
                    <rect x="64" y="24" width="92" height="14" rx="7" class="fill-slate-200 dark:fill-slate-700"/>
                    <rect x="64" y="44" width="92" height="14" rx="7" class="fill-slate-200 dark:fill-slate-700"/>
                    <g class="tour-anim-swap">
                        <rect x="64" y="68" width="92" height="18" rx="9" fill="#4f46e5"/>
                        <text x="110" y="80" text-anchor="middle" fill="#fff" font-size="8" font-weight="bold">+ Nueva materia</text>
                    </g>
                </svg>`
        },
        // Capítulo 2: Tareas (4-6)
        {
            id: 'tasks-color-bar',
            chapter: 'Capítulo 2 · Tareas',
            view: 'tasks',
            spotlightSelector: '#bottom-nav [data-view-target="tasks"], #desktop-nav-pill [data-view-target="tasks"]',
            badge: '4 / 9 · Tareas',
            title: 'Barra lateral de color por materia',
            desc: 'Cada tarea muestra una franja izquierda con el color de su asignatura para identificar prioridades al instante.',
            svg: `
                <svg viewBox="0 0 220 110" class="w-full h-full" aria-hidden="true">
                    <g class="tour-anim-float">
                        <rect x="24" y="16" width="172" height="34" rx="11" class="fill-white/85 dark:fill-slate-800/90 stroke-slate-200 dark:stroke-slate-700" stroke-width="1.2"/>
                        <rect x="24" y="19" width="5" height="28" rx="2.5" fill="#ec4899"/>
                        <rect x="38" y="26" width="84" height="7" rx="3.5" class="fill-slate-800/80 dark:fill-slate-100/85"/>
                        <rect x="38" y="37" width="52" height="5" rx="2.5" fill="#f43f5e"/>
                    </g>
                    <g>
                        <rect x="24" y="58" width="172" height="34" rx="11" class="fill-white/85 dark:fill-slate-800/90 stroke-slate-200 dark:stroke-slate-700" stroke-width="1.2"/>
                        <rect x="24" y="61" width="5" height="28" rx="2.5" fill="#06b6d4"/>
                        <rect x="38" y="68" width="96" height="7" rx="3.5" class="fill-slate-800/80 dark:fill-slate-100/85"/>
                        <rect x="38" y="79" width="60" height="5" rx="2.5" fill="#0ea5e9"/>
                    </g>
                </svg>`
        },
        {
            id: 'tasks-due-dates',
            chapter: 'Capítulo 2 · Tareas',
            view: 'tasks',
            spotlightSelector: '#bottom-nav [data-view-target="tasks"], #desktop-nav-pill [data-view-target="tasks"]',
            badge: '5 / 9 · Tareas',
            title: 'Fechas límite, prioridad y calendario',
            desc: 'Define fecha y hora de entrega, ordena por urgencia y visualiza toda tu carga semanal desde el calendario integrado.',
            svg: `
                <svg viewBox="0 0 220 110" class="w-full h-full" aria-hidden="true">
                    <rect x="40" y="14" width="140" height="82" rx="14" class="fill-white/85 dark:fill-slate-800/90 stroke-indigo-300 dark:stroke-indigo-700" stroke-width="1.5"/>
                    <rect x="40" y="14" width="140" height="22" rx="14" fill="#4f46e5"/>
                    <text x="110" y="29" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold">CALENDARIO DE ENTREGAS</text>
                    <circle cx="72" cy="54" r="9" class="fill-slate-200 dark:fill-slate-700"/>
                    <circle cx="110" cy="54" r="9" class="fill-amber-400"/>
                    <g class="tour-anim-pulse">
                        <circle cx="148" cy="54" r="10" fill="#ef4444"/>
                    </g>
                    <rect x="62" y="74" width="96" height="8" rx="4" class="fill-indigo-500/40"/>
                </svg>`
        },
        {
            id: 'tasks-rewards',
            chapter: 'Capítulo 2 · Tareas',
            view: 'tasks',
            spotlightSelector: '#bottom-nav [data-view-target="tasks"], #desktop-nav-pill [data-view-target="tasks"]',
            badge: '6 / 9 · Tareas',
            title: 'Completa tareas y desbloquea sorpresas',
            desc: 'Cada 5 tareas completadas se abre un premio aleatorio en la Bóveda: nuevos temas visuales (claros y oscuros) y tipografías.',
            svg: `
                <svg viewBox="0 0 220 110" class="w-full h-full" aria-hidden="true">
                    <g class="tour-anim-float">
                        <rect x="74" y="24" width="72" height="58" rx="14" fill="#7c3aed"/>
                        <rect x="82" y="34" width="56" height="38" rx="8" fill="#5b21b6"/>
                        <circle cx="110" cy="53" r="9" fill="#fbbf24"/>
                    </g>
                    <g class="tour-anim-pulse">
                        <circle cx="54" cy="36" r="5" fill="#f59e0b"/>
                        <circle cx="166" cy="34" r="6" fill="#ec4899"/>
                        <circle cx="162" cy="76" r="4" fill="#10b981"/>
                    </g>
                </svg>`
        },
        // Capítulo 3: Notas y Personalización (7-9)
        {
            id: 'notes-quick',
            chapter: 'Capítulo 3 · Notas y Personalización',
            view: 'notes',
            spotlightSelector: '#bottom-nav [data-view-target="notes"], #desktop-nav-pill [data-view-target="notes"]',
            badge: '7 / 9 · Notas',
            title: 'Notas rápidas y filtros inteligentes',
            desc: 'Guarda ideas al instante, desliza sobre los filtros de categoría o protege apuntes privados con contraseña.',
            svg: `
                <svg viewBox="0 0 220 110" class="w-full h-full" aria-hidden="true">
                    <g class="tour-anim-float">
                        <rect x="32" y="16" width="156" height="22" rx="11" class="fill-indigo-500/20 stroke-indigo-400/50" stroke-width="1"/>
                        <rect x="38" y="20" width="46" height="14" rx="7" fill="#4f46e5"/>
                        <rect x="92" y="23" width="38" height="8" rx="4" class="fill-slate-400/50"/>
                        <rect x="138" y="23" width="38" height="8" rx="4" class="fill-slate-400/50"/>
                    </g>
                    <rect x="32" y="46" width="156" height="48" rx="12" class="fill-white/85 dark:fill-slate-800/90 stroke-amber-300 dark:stroke-amber-600" stroke-width="1.3"/>
                    <rect x="44" y="58" width="90" height="7" rx="3.5" class="fill-slate-800/80 dark:fill-slate-100/85"/>
                    <rect x="44" y="72" width="120" height="6" rx="3" class="fill-slate-400/60"/>
                </svg>`
        },
        {
            id: 'notes-photos',
            chapter: 'Capítulo 3 · Notas y Personalización',
            view: 'notes',
            spotlightSelector: '#bottom-nav [data-view-target="notes"], #desktop-nav-pill [data-view-target="notes"]',
            badge: '8 / 9 · Notas',
            title: 'Fotos de pizarrón y galería sin conexión',
            desc: 'Adjunta fotos a tus notas y consúltalas en la galería local (guardadas únicamente en tu dispositivo).',
            svg: `
                <svg viewBox="0 0 220 110" class="w-full h-full" aria-hidden="true">
                    <rect x="36" y="22" width="66" height="66" rx="12" fill="#0ea5e9" class="tour-anim-float"/>
                    <circle cx="56" cy="44" r="7" fill="#fde047"/>
                    <path d="M40 80l18-20 14 14 12-10 14 16H40z" fill="#0284c7"/>
                    <rect x="116" y="22" width="68" height="66" rx="12" class="fill-white/85 dark:fill-slate-800/90 stroke-purple-400" stroke-width="1.5"/>
                    <circle cx="150" cy="50" r="14" class="fill-purple-500/20 stroke-purple-500" stroke-width="2"/>
                    <circle cx="150" cy="50" r="6" fill="#a855f7" class="tour-anim-pulse"/>
                </svg>`
        },
        {
            id: 'personalization',
            chapter: 'Capítulo 3 · Notas y Personalización',
            view: 'settings',
            spotlightSelector: '#drawer-footer-settings-btn, #header-menu-btn',
            badge: '9 / 9 · Tu Estilo',
            title: 'Ajusta temas, blur y rendimiento',
            desc: 'Usa modo claro u oscuro con cualquier tema, desenfoca tu foto de fondo, elige calidad visual y repite este tutorial cuando quieras.',
            svg: `
                <svg viewBox="0 0 220 110" class="w-full h-full" aria-hidden="true">
                    <rect x="26" y="20" width="78" height="70" rx="14" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
                    <rect x="116" y="20" width="78" height="70" rx="14" fill="#0f172a" stroke="#6366f1" stroke-width="1.5"/>
                    <circle cx="65" cy="48" r="14" fill="#fbbf24" class="tour-anim-pulse"/>
                    <circle cx="155" cy="48" r="14" fill="#818cf8" class="tour-anim-float"/>
                    <rect x="42" y="70" width="46" height="7" rx="3.5" fill="#94a3b8"/>
                    <rect x="132" y="70" width="46" height="7" rx="3.5" fill="#4f46e5"/>
                </svg>`
        }
    ];

    let overlayEl = null;
    let currentIdx = 0;
    let isTourVisible = false;
    let timerId = null;
    let stepStartedAt = 0;
    let remainingMs = AUTO_ADVANCE_MS;
    let isPaused = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let boundEscHandler = null;
    let boundResizeHandler = null;

    function isMotionReduced() {
        const root = document.documentElement;
        if (root.getAttribute('data-reduced-effects') === 'true') return true;
        try {
            return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        } catch {
            return false;
        }
    }

    function clearStepTimer() {
        if (timerId !== null) {
            clearTimeout(timerId);
            timerId = null;
        }
    }

    function ensureOverlayDOM() {
        if (overlayEl && document.body.contains(overlayEl)) return overlayEl;
        const wrap = document.createElement('div');
        wrap.id = 'app-tour-overlay';
        wrap.className = 'tour-overlay hidden fixed inset-0 z-[92] flex items-center justify-center p-4';
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-modal', 'true');
        wrap.setAttribute('aria-label', 'Tutorial interactivo de Organizador');
        wrap.innerHTML = `
            <div class="tour-backdrop fixed inset-0 bg-slate-950/70"></div>
            <div id="tour-spotlight-ring" class="tour-spotlight hidden" aria-hidden="true"></div>
            <div id="tour-card" class="tour-card relative w-full max-w-md rounded-3xl border border-white/30 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 shadow-2xl overflow-hidden text-slate-900 dark:text-white">
                <div class="tour-progress-track w-full h-1.5 bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                    <div id="tour-progress-fill" class="tour-progress-fill h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 origin-left"></div>
                </div>
                <div class="p-5 sm:p-6 space-y-4">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 min-w-0">
                            <span id="tour-chapter-pill" class="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 truncate"></span>
                            <span id="tour-step-badge" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums shrink-0"></span>
                        </div>
                        <button type="button" id="tour-skip-btn" class="touch-target-44 min-h-[44px] px-3 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">Saltar</button>
                    </div>

                    <div id="tour-stage" class="w-full h-32 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-sky-50/80 to-slate-100/90 dark:from-slate-800/90 dark:via-indigo-950/60 dark:to-slate-900 border border-slate-200/70 dark:border-slate-700/70 p-2 flex items-center justify-center overflow-hidden"></div>

                    <div class="space-y-1.5 min-h-[76px]">
                        <h3 id="tour-title" class="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white"></h3>
                        <p id="tour-desc" class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed"></p>
                    </div>

                    <div id="tour-dots" class="flex items-center justify-center gap-1.5 py-1" role="tablist" aria-label="Pasos del tutorial"></div>

                    <div class="flex items-center justify-between gap-2 pt-1">
                        <button type="button" id="tour-prev-btn" class="touch-target-44 min-h-[44px] tap-effect px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors">Anterior</button>
                        <span class="text-[10px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">Mantén presionado para pausar</span>
                        <button type="button" id="tour-next-btn" class="touch-target-44 min-h-[44px] tap-effect px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition-colors">Siguiente</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(wrap);
        overlayEl = wrap;

        wrap.querySelector('#tour-skip-btn').onclick = () => Tour.close(true);
        wrap.querySelector('.tour-backdrop').onclick = () => Tour.close(true);
        wrap.querySelector('#tour-prev-btn').onclick = () => Tour.prev();
        wrap.querySelector('#tour-next-btn').onclick = () => {
            if (currentIdx >= STEPS.length - 1) {
                Tour.close(true);
            } else {
                Tour.next();
            }
        };

        const card = wrap.querySelector('#tour-card');
        card.addEventListener('pointerdown', (e) => {
            touchStartX = e.clientX;
            touchStartY = e.clientY;
            if (!e.target.closest('button')) {
                pauseProgress();
            }
        });
        card.addEventListener('pointerup', (e) => {
            const dx = e.clientX - touchStartX;
            const dy = e.clientY - touchStartY;
            if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4 && !e.target.closest('button')) {
                if (dx < 0) {
                    if (currentIdx < STEPS.length - 1) Tour.next();
                } else {
                    Tour.prev();
                }
                return;
            }
            resumeProgress();
        });
        card.addEventListener('pointercancel', () => resumeProgress());

        return wrap;
    }

    function positionSpotlight(selector) {
        const ring = overlayEl?.querySelector('#tour-spotlight-ring');
        if (!ring) return;
        if (!selector) {
            ring.classList.add('hidden');
            return;
        }
        const candidates = Array.from(document.querySelectorAll(selector));
        const target = candidates.find(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        });
        if (!target) {
            ring.classList.add('hidden');
            return;
        }
        const rect = target.getBoundingClientRect();
        ring.style.width = `${Math.round(rect.width + 12)}px`;
        ring.style.height = `${Math.round(rect.height + 12)}px`;
        ring.style.transform = `translate3d(${Math.round(rect.left - 6)}px, ${Math.round(rect.top - 6)}px, 0)`;
        ring.classList.remove('hidden');
    }

    function startProgressTimer(durationMs = AUTO_ADVANCE_MS) {
        clearStepTimer();
        const fill = overlayEl?.querySelector('#tour-progress-fill');
        if (!fill) return;

        if (isMotionReduced()) {
            fill.style.transition = 'none';
            fill.style.transform = `scaleX(${((currentIdx + 1) / STEPS.length).toFixed(3)})`;
            return;
        }

        remainingMs = durationMs;
        isPaused = false;
        stepStartedAt = performance.now();

        fill.style.transition = 'none';
        fill.style.transform = 'scaleX(0)';
        void fill.offsetWidth;
        fill.style.transition = `transform ${durationMs}ms linear`;
        fill.style.transform = 'scaleX(1)';

        timerId = setTimeout(() => {
            timerId = null;
            if (!isTourVisible) return;
            if (currentIdx < STEPS.length - 1) {
                renderStep(currentIdx + 1);
            } else {
                Tour.close(true);
            }
        }, durationMs);
    }

    function pauseProgress() {
        if (isPaused || !isTourVisible || isMotionReduced()) return;
        isPaused = true;
        clearStepTimer();
        const elapsed = performance.now() - stepStartedAt;
        remainingMs = Math.max(400, remainingMs - elapsed);
        const fill = overlayEl?.querySelector('#tour-progress-fill');
        if (fill) {
            const ratio = Math.min(1, Math.max(0, 1 - remainingMs / AUTO_ADVANCE_MS));
            fill.style.transition = 'none';
            fill.style.transform = `scaleX(${ratio.toFixed(4)})`;
        }
    }

    function resumeProgress() {
        if (!isPaused || !isTourVisible || isMotionReduced()) return;
        isPaused = false;
        startProgressTimer(remainingMs);
    }

    function renderStep(idx) {
        currentIdx = Math.max(0, Math.min(STEPS.length - 1, idx));
        const step = STEPS[currentIdx];
        const wrap = ensureOverlayDOM();

        wrap.querySelector('#tour-chapter-pill').textContent = step.chapter;
        wrap.querySelector('#tour-step-badge').textContent = step.badge;
        wrap.querySelector('#tour-stage').innerHTML = step.svg;
        wrap.querySelector('#tour-title').textContent = step.title;
        wrap.querySelector('#tour-desc').textContent = step.desc;

        const prevBtn = wrap.querySelector('#tour-prev-btn');
        const nextBtn = wrap.querySelector('#tour-next-btn');
        if (prevBtn) {
            prevBtn.disabled = currentIdx === 0;
            prevBtn.classList.toggle('opacity-40', currentIdx === 0);
        }
        if (nextBtn) {
            nextBtn.textContent = currentIdx === STEPS.length - 1 ? '¡Empezar!' : 'Siguiente';
        }

        const dotsWrap = wrap.querySelector('#tour-dots');
        if (dotsWrap) {
            dotsWrap.innerHTML = '';
            STEPS.forEach((s, i) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.setAttribute('role', 'tab');
                dot.setAttribute('aria-selected', i === currentIdx ? 'true' : 'false');
                dot.setAttribute('aria-label', `Paso ${i + 1}: ${s.title}`);
                dot.className = i === currentIdx
                    ? 'w-6 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 transition-all'
                    : 'w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 hover:bg-indigo-400 transition-all';
                dot.onclick = () => {
                    window.HapticsModule?.light?.();
                    renderStep(i);
                };
                dotsWrap.appendChild(dot);
            });
        }

        requestAnimationFrame(() => positionSpotlight(step.spotlightSelector));
        startProgressTimer(AUTO_ADVANCE_MS);
    }

    const Tour = {
        STEPS,

        isOpen() {
            return Boolean(isTourVisible && overlayEl && !overlayEl.classList.contains('hidden'));
        },

        start(opts = {}) {
            const Storage = window.StorageModule;
            if (!opts.force && Storage?.isTourCompleted?.()) {
                return false;
            }
            const wrap = ensureOverlayDOM();
            isTourVisible = true;
            wrap.classList.remove('hidden');
            wrap.classList.add('active');
            document.body.classList.add('overflow-hidden');

            renderStep(typeof opts.startIndex === 'number' ? opts.startIndex : 0);

            if (!boundEscHandler) {
                boundEscHandler = (e) => {
                    if (e.key === 'Escape' && Tour.isOpen()) {
                        Tour.close(true);
                    }
                };
                window.addEventListener('keydown', boundEscHandler);
            }
            if (!boundResizeHandler) {
                boundResizeHandler = () => {
                    if (Tour.isOpen()) {
                        positionSpotlight(STEPS[currentIdx]?.spotlightSelector);
                    }
                };
                window.addEventListener('resize', boundResizeHandler);
            }
            return true;
        },

        next() {
            if (!Tour.isOpen()) return;
            window.HapticsModule?.light?.();
            if (currentIdx >= STEPS.length - 1) {
                Tour.close(true);
            } else {
                renderStep(currentIdx + 1);
            }
        },

        prev() {
            if (!Tour.isOpen() || currentIdx <= 0) return;
            window.HapticsModule?.light?.();
            renderStep(currentIdx - 1);
        },

        goTo(index) {
            if (!Tour.isOpen()) return;
            renderStep(index);
        },

        close(markCompleted = true) {
            clearStepTimer();
            isTourVisible = false;
            isPaused = false;
            if (markCompleted) {
                window.StorageModule?.setTourCompleted?.(true);
            }
            if (overlayEl) {
                overlayEl.classList.remove('active');
                overlayEl.classList.add('hidden');
            }
            const ring = overlayEl?.querySelector('#tour-spotlight-ring');
            if (ring) ring.classList.add('hidden');
            if (!document.querySelector('.modal-overlay.active:not(.hidden)')) {
                document.body.classList.remove('overflow-hidden');
            }
        }
    };

    window.TourModule = Tour;
})();
