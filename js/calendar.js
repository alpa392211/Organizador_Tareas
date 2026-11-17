/**
 * Módulo de Calendario Mensual Interactivo
 * Muestra vista mensual con delimitación del ciclo escolar activo,
 * vigencia de clases según el rango lectivo y entregas de tareas escolares.
 */

window.CalendarModule = (() => {
    const MONTH_NAMES = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const JS_DAY_TO_ID = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

    let currentDate = new Date();
    let selectedDate = new Date();

    function init() {
        setupEventListeners();
    }

    function setupEventListeners() {
        const setupNavPair = (prevId, nextId, todayId) => {
            const prevBtn = document.getElementById(prevId);
            const nextBtn = document.getElementById(nextId);
            const todayBtn = document.getElementById(todayId);

            if (prevBtn) {
                prevBtn.onclick = () => {
                    currentDate.setMonth(currentDate.getMonth() - 1);
                    render();
                };
            }

            if (nextBtn) {
                nextBtn.onclick = () => {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    render();
                };
            }

            if (todayBtn) {
                todayBtn.onclick = () => {
                    currentDate = new Date();
                    selectedDate = new Date();
                    render();
                    renderDayDetails(selectedDate);
                };
            }
        };

        setupNavPair('cal-prev-month', 'cal-next-month', 'cal-today-btn');
        setupNavPair('cal-view-prev-month', 'cal-view-next-month', 'cal-view-today-btn');

        const closeBtn = document.getElementById('close-calendar-modal');
        const modalBackdrop = document.getElementById('calendar-modal-backdrop');

        if (closeBtn) closeBtn.onclick = () => closeModal();
        if (modalBackdrop) modalBackdrop.onclick = () => closeModal();
    }

    function openModal() {
        window.HapticsModule?.light();
        const modal = document.getElementById('calendar-modal');
        if (modal) {
            modal.style.display = '';
            const backdrop = document.getElementById('calendar-modal-backdrop');
            if (backdrop) {
                backdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
                backdrop.style.opacity = '';
            }
            const sheet = modal.querySelector('.mobile-bottom-sheet');
            if (sheet) {
                sheet.style.transform = '';
                sheet.style.transition = '';
                sheet.style.maxHeight = '';
            }
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
            requestAnimationFrame(() => {
                modal.classList.add('active');
            });
            render();
            renderDayDetails(selectedDate);
        }
    }

    function closeModal() {
        window.HapticsModule?.light();
        const modal = document.getElementById('calendar-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.classList.remove('overflow-hidden');
            }, 200);
        }
    }

    function render() {
        renderToContainer('cal-month-title', 'cal-days-grid', 'cal-cycle-banner');
        renderToContainer('cal-view-month-title', 'cal-view-days-grid', 'cal-view-cycle-banner');
        renderDayDetails(selectedDate);
    }

    function renderToContainer(titleId, gridId, bannerId) {
        const Storage = window.StorageModule;
        const titleEl = document.getElementById(titleId);
        const gridEl = document.getElementById(gridId);
        const cycleBanner = document.getElementById(bannerId);
        if (!gridEl || !Storage) return;

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const cycle = Storage.getAcademicCycle();

        if (titleEl) {
            titleEl.textContent = `${MONTH_NAMES[month]} ${year}`;
        }

        // Banner informativo del ciclo escolar en el calendario
        if (cycleBanner && cycle) {
            cycleBanner.innerHTML = `
                <div class="cal-glass-pill flex flex-wrap items-center justify-between gap-1.5 min-w-0 text-xs px-3.5 py-2 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/12 border border-indigo-500/20 dark:border-indigo-300/20 text-indigo-950 dark:text-indigo-100">
                    <span class="flex flex-wrap items-center gap-1.5 font-bold min-w-0">
                        <span>🗓️</span> Ciclo Escolar Activo:
                        <span class="font-mono text-indigo-700 dark:text-indigo-300 font-extrabold break-all">${cycle.startDate} al ${cycle.endDate}</span>
                    </span>
                    <span class="text-[11px] text-slate-600 dark:text-slate-300/90 hidden sm:inline">Clases vigentes solo en periodo activo</span>
                </div>
            `;
        }

        gridEl.innerHTML = '';

        DAY_LABELS.forEach(label => {
            const h = document.createElement('div');
            h.className = 'text-center text-[10px] sm:text-xs font-extrabold text-slate-600 dark:text-slate-300/85 py-1.5 uppercase tracking-wider truncate min-w-0';
            h.textContent = label;
            gridEl.appendChild(h);
        });

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();

        let startCol = firstDayOfMonth.getDay() - 1;
        if (startCol === -1) startCol = 6; // Domingo

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startCol - 1; i >= 0; i--) {
            const cell = document.createElement('div');
            cell.className = 'min-w-0 min-h-[44px] sm:min-h-[64px] p-1 rounded-2xl bg-transparent text-slate-500/70 dark:text-slate-400/55 flex flex-col items-center justify-start text-xs border border-transparent select-none';
            cell.innerHTML = `<span>${prevMonthLastDay - i}</span>`;
            gridEl.appendChild(cell);
        }

        const subjects = Storage.getSubjects();
        const tasks = Storage.getTasks();
        const today = new Date();

        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
            const cellDate = new Date(year, month, dayNum);
            const jsDayOfWeek = cellDate.getDay();
            const dayId = JS_DAY_TO_ID[jsDayOfWeek];

            const isInCycle = Storage.isDateInAcademicCycle(cellDate);

            const isToday = today.getFullYear() === year &&
                            today.getMonth() === month &&
                            today.getDate() === dayNum;

            const isSelected = selectedDate.getFullYear() === year &&
                               selectedDate.getMonth() === month &&
                               selectedDate.getDate() === dayNum;

            // REGLA DEL CICLO ESCOLAR:
            // Las materias y sus horarios recurrentes permanecen vigentes únicamente dentro del ciclo escolar
            const dayClasses = isInCycle
                ? subjects.filter(s => Array.isArray(s.days) && s.days.includes(dayId))
                : [];

            const dayTasks = tasks.filter(t => {
                if (!t.dueDate) return false;
                const d = new Date(t.dueDate);
                return d.getFullYear() === year &&
                       d.getMonth() === month &&
                       d.getDate() === dayNum;
            });

            const cell = document.createElement('button');
            cell.type = 'button';

            // Estilos delimitadores traslúcidos según vigencia del ciclo escolar
            let baseStyles = 'cal-day-cell tap-effect min-w-0 min-h-[46px] sm:min-h-[64px] p-1 sm:p-1.5 rounded-2xl transition-all duration-150 flex flex-col items-center justify-between text-xs border relative group ';
            
            if (!isInCycle) {
                baseStyles += 'cal-day-off bg-slate-900/[0.04] dark:bg-white/[0.03] border-dashed border-slate-900/12 dark:border-white/12 hover:bg-slate-900/[0.08] dark:hover:bg-white/[0.07] ';
            } else if (isSelected) {
                baseStyles += 'cal-day-selected border-indigo-500/80 dark:border-indigo-400/80 bg-indigo-500/18 dark:bg-indigo-500/24 shadow-sm ring-2 ring-indigo-500/30 ';
            } else {
                baseStyles += 'border-slate-900/10 dark:border-white/12 bg-white/45 dark:bg-white/[0.07] hover:bg-white/75 dark:hover:bg-white/[0.13] hover:border-indigo-400/50 ';
            }

            cell.className = baseStyles;
            cell.title = isInCycle ? 'Día lectivo' : 'Fuera del ciclo escolar activo';

            const numSpan = document.createElement('span');
            numSpan.className = `w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                isToday 
                    ? 'bg-indigo-600 text-white font-black shadow-sm shadow-indigo-500/40' 
                    : isSelected 
                        ? 'text-indigo-700 dark:text-indigo-200 font-black' 
                        : !isInCycle 
                            ? 'text-slate-500 dark:text-slate-400 font-semibold' 
                            : 'text-slate-900 dark:text-white font-extrabold'
            }`;
            numSpan.textContent = dayNum;

            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'w-full flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap mt-0.5 px-0.5 overflow-hidden';

            if (!isInCycle) {
                const offSpan = document.createElement('span');
                offSpan.className = 'text-[9px] font-mono text-slate-400 dark:text-slate-500 leading-none';
                offSpan.textContent = '—';
                dotsContainer.appendChild(offSpan);
            } else if (dayClasses.length > 0) {
                dayClasses.slice(0, 3).forEach(c => {
                    const dot = document.createElement('span');
                    dot.className = 'w-1.5 h-1.5 rounded-full shrink-0';
                    dot.style.backgroundColor = c.color;
                    dot.title = `Clase: ${c.name}`;
                    dotsContainer.appendChild(dot);
                });
                if (dayClasses.length > 3) {
                    const plus = document.createElement('span');
                    plus.className = 'text-[9px] text-slate-400 font-mono leading-none';
                    plus.textContent = `+${dayClasses.length - 3}`;
                    dotsContainer.appendChild(plus);
                }
            }

            if (dayTasks.length > 0) {
                const pendingT = dayTasks.filter(t => !t.completed).length;
                const taskPill = document.createElement('span');
                taskPill.className = `text-[9px] font-bold px-1 rounded-sm leading-none flex items-center gap-0.5 ${
                    pendingT > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                }`;
                taskPill.textContent = `📝${dayTasks.length}`;
                taskPill.title = `${dayTasks.length} tarea(s) para este día`;
                dotsContainer.appendChild(taskPill);
            }

            cell.appendChild(numSpan);
            cell.appendChild(dotsContainer);

            cell.onclick = () => {
                selectedDate = new Date(year, month, dayNum);
                render();
                renderDayDetails(selectedDate);
            };

            gridEl.appendChild(cell);
        }
    }

    function renderDayDetails(date) {
        const Storage = window.StorageModule;
        if (!Storage) return;

        const targetContainers = [
            document.getElementById('cal-day-details'),
            document.getElementById('cal-view-day-details')
        ].filter(Boolean);

        if (targetContainers.length === 0) return;

        const year = date.getFullYear();
        const month = date.getMonth();
        const dayNum = date.getDate();
        const dayOfWeekIndex = date.getDay();
        const dayId = JS_DAY_TO_ID[dayOfWeekIndex];

        const dateStr = date.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const cycle = Storage.getAcademicCycle();
        const isInCycle = Storage.isDateInAcademicCycle(date);
        const subjects = Storage.getSubjects();
        const tasks = Storage.getTasks();

        // Clases únicamente si cae dentro del ciclo escolar
        const dayClasses = isInCycle
            ? subjects.filter(s => Array.isArray(s.days) && s.days.includes(dayId))
            : [];

        const dayTasks = tasks.filter(t => {
            if (!t.dueDate) return false;
            const d = new Date(t.dueDate);
            return d.getFullYear() === year &&
                   d.getMonth() === month &&
                   d.getDate() === dayNum;
        });

        let cycleStatusBanner = '';
        if (!isInCycle) {
            cycleStatusBanner = `
                <div class="mb-3 p-3 rounded-2xl bg-amber-500/12 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                    <span class="text-base shrink-0">⚠️</span>
                    <span>Esta fecha se encuentra <strong>fuera del ciclo escolar activo</strong> (${cycle.startDate} a ${cycle.endDate}). Los horarios de clase no aplican.</span>
                </div>
            `;
        }

        let classesHtml = '';
        if (!isInCycle) {
            classesHtml = `<p class="text-xs text-slate-600 dark:text-slate-300/80 italic">No hay clases programadas (periodo vacacional / fuera de ciclo).</p>`;
        } else if (dayClasses.length === 0) {
            classesHtml = `<p class="text-xs text-slate-600 dark:text-slate-300/80 italic">No hay clases registradas para este día de la semana.</p>`;
        } else {
            classesHtml = `
                <div class="space-y-2">
                    ${dayClasses.map(c => `
                        <div class="cal-detail-card flex items-center justify-between gap-2 p-3 rounded-2xl bg-white/55 dark:bg-white/[0.07] border border-slate-900/10 dark:border-white/12 border-l-4" style="border-left-color: ${c.color};">
                            <div class="min-w-0">
                                <h5 class="text-xs font-bold text-slate-900 dark:text-white truncate">${escapeHtml(c.name)}</h5>
                                <p class="text-[11px] text-slate-600 dark:text-slate-300 truncate">${c.startTime} - ${c.endTime} hrs ${c.classroom ? `• ${escapeHtml(c.classroom)}` : ''}</p>
                            </div>
                            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${c.color}"></span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        let tasksHtml = '';
        if (dayTasks.length === 0) {
            tasksHtml = `<p class="text-xs text-slate-600 dark:text-slate-300/80 italic">No hay entregas de tareas programadas para esta fecha.</p>`;
        } else {
            tasksHtml = `
                <div class="space-y-2">
                    ${dayTasks.map(t => {
                        const sub = subjects.find(s => s.id === t.subjectId);
                        const subColor = sub ? sub.color : '#64748B';
                        const subName = sub ? sub.name : 'Materia';
                        return `
                            <div class="cal-detail-card flex items-center justify-between p-3 rounded-2xl bg-white/55 dark:bg-white/[0.07] border border-slate-900/10 dark:border-white/12 border-l-4 ${t.completed ? 'opacity-60' : ''}" style="border-left-color: ${subColor};">
                                <div class="min-w-0 flex-1 pr-2">
                                    <div class="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                        <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style="background-color: ${subColor}22; color: ${subColor};">
                                            ${escapeHtml(subName)}
                                        </span>
                                        ${t.completed ? `<span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ Entregada</span>` : `<span class="text-[10px] text-rose-600 dark:text-rose-400 font-bold">● Pendiente</span>`}
                                    </div>
                                    <h5 class="text-xs font-bold text-slate-900 dark:text-white truncate ${t.completed ? 'line-through' : ''}">${escapeHtml(t.title)}</h5>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        const html = `
            <div class="pt-3.5 border-t border-slate-900/10 dark:border-white/10">
                ${cycleStatusBanner}
                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h4 class="text-sm font-extrabold text-slate-900 dark:text-white capitalize flex items-center gap-2 min-w-0">
                        <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <span class="min-w-0">${dateStr}</span>
                    </h4>
                    <span class="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 border ${isInCycle ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' : 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/25'}">
                        ${isInCycle ? 'En periodo lectivo' : 'Fuera de ciclo'}
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300/90 mb-2 flex items-center gap-1.5">
                            <span>📚</span> Clases Programadas (${dayClasses.length})
                        </h5>
                        ${classesHtml}
                    </div>

                    <div>
                        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300/90 mb-2 flex items-center gap-1.5">
                            <span>📝</span> Tareas por Entregar (${dayTasks.length})
                        </h5>
                        ${tasksHtml}
                    </div>
                </div>
            </div>
        `;

        targetContainers.forEach(container => {
            container.innerHTML = html;
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }

    return {
        init,
        render,
        openModal,
        closeModal
    };
})();
