/**
 * Módulo de Tareas Escolares
 * Maneja la creación, edición, filtrado, completitud y renderizado con herencia de color de la materia.
 */

window.TasksModule = (() => {
    let currentFilter = 'all'; // 'all' | 'pending' | 'completed'
    let subjectFilter = 'all'; // 'all' | subjectId
    let searchQuery = '';
    let editingTaskId = null;

    // ========================================================
    // GESTIÓN DE NOTIFICACIONES LOCALES NATIVAS (CAPACITOR)
    // ========================================================

    /**
     * Valida de forma segura si el plugin nativo de LocalNotifications está disponible
     */
    function isLocalNotificationsAvailable() {
        try {
            return Boolean(
                typeof window !== 'undefined' &&
                window.Capacitor &&
                typeof window.Capacitor.isPluginAvailable === 'function' &&
                window.Capacitor.isPluginAvailable('LocalNotifications')
            );
        } catch {
            return false;
        }
    }

    /**
     * Solicita permisos de notificación al usuario de forma nativa
     */
    async function requestNotificationPermissions() {
        if (!isLocalNotificationsAvailable()) return;
        try {
            const { LocalNotifications } = (typeof capacitorExports !== 'undefined' ? capacitorExports : null) || window.Capacitor.Plugins;
            if (LocalNotifications && typeof LocalNotifications.requestPermissions === 'function') {
                await LocalNotifications.requestPermissions();
            }
        } catch (err) {
            console.warn('Error al solicitar permisos de notificaciones locales:', err);
        }
    }

    /**
     * Deriva un entero positivo único de 32 bits a partir del ID de la tarea
     */
    function taskIdToNotificationId(taskId) {
        if (!taskId) return 1;
        if (typeof taskId === 'number') return Math.abs(Math.floor(taskId)) || 1;
        let hash = 0;
        const str = String(taskId);
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        const positiveInt = Math.abs(hash) % 2147483647;
        return positiveInt === 0 ? 1 : positiveInt;
    }

    /**
     * Programa una notificación local para una tarea con fecha/hora límite
     */
    async function scheduleTaskNotification(task) {
        if (!task || !task.dueDate || task.completed) return;
        if (window.NotificationsModule) {
            await window.NotificationsModule.scheduleTask(task);
        }
    }

    async function cancelTaskNotification(taskId) {
        if (!taskId) return;
        if (window.NotificationsModule) {
            await window.NotificationsModule.cancelTask(taskId);
        }
    }

    async function cancelAllNotifications() {
        if (window.NotificationsModule) {
            await window.NotificationsModule.cancelAll();
        }
    }

    function init() {
        setupEventListeners();
        requestNotificationPermissions();
    }

    function setupEventListeners() {
        const form = document.getElementById('task-form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                handleFormSubmit();
            };
        }

        const searchInput = document.getElementById('tasks-search-input');
        if (searchInput) {
            searchInput.oninput = (e) => {
                searchQuery = e.target.value.toLowerCase().trim();
                render();
            };
        }

        document.querySelectorAll('[data-task-filter]').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('[data-task-filter]').forEach(b => {
                    b.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
                    b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-400');
                });
                btn.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
                btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-400');
                currentFilter = btn.dataset.taskFilter;
                render();
            };
        });

        const subjectSelectFilter = document.getElementById('task-subject-filter');
        if (subjectSelectFilter) {
            subjectSelectFilter.onchange = (e) => {
                subjectFilter = e.target.value;
                render();
            };
        }
    }

    function populateSubjectDropdown(selectId = 'task-subject-id', selectedId = '') {
        const select = document.getElementById(selectId);
        if (!select) return;

        const Storage = window.StorageModule;
        const subjects = Storage.getSubjects();
        select.innerHTML = '';

        if (subjects.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = '⚠️ Primero debes crear al menos una materia';
            select.appendChild(opt);
            select.disabled = true;
            return;
        }

        select.disabled = false;
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Selecciona una materia...';
        defaultOpt.disabled = true;
        defaultOpt.selected = !selectedId;
        select.appendChild(defaultOpt);

        subjects.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.id;
            opt.textContent = sub.name;
            if (sub.id === selectedId) opt.selected = true;
            select.appendChild(opt);
        });
    }

    function updateSubjectFilterDropdown() {
        const select = document.getElementById('task-subject-filter');
        if (!select) return;

        const Storage = window.StorageModule;
        const subjects = Storage.getSubjects();
        const currentVal = subjectFilter;

        select.innerHTML = '<option value="all">Todas las materias</option>';
        subjects.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.id;
            opt.textContent = sub.name;
            if (sub.id === currentVal) opt.selected = true;
            select.appendChild(opt);
        });
    }

    function openAddModal(preselectedSubjectId = '') {
        const Storage = window.StorageModule;
        const subjects = Storage.getSubjects();
        if (subjects.length === 0) {
            window.showNotification?.('Debes registrar al menos una materia antes de crear tareas.', 'warning');
            window.navigateToSubjects?.();
            return;
        }

        editingTaskId = null;
        document.getElementById('task-modal-title').textContent = 'Nueva Tarea Escolar';
        document.getElementById('task-form').reset();
        populateSubjectDropdown('task-subject-id', preselectedSubjectId);

        // Solicitar permisos de notificación si es la primera tarea registrada
        if (Storage.getTasks().length === 0) {
            requestNotificationPermissions();
        }

        const cycle = Storage.getAcademicCycle();

        // Delimitar fecha por defecto dentro del ciclo escolar
        let defaultDue = '';
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 0, 0);

        if (Storage.isDateInAcademicCycle(tomorrow)) {
            const y = tomorrow.getFullYear();
            const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
            const d = String(tomorrow.getDate()).padStart(2, '0');
            const h = String(tomorrow.getHours()).padStart(2, '0');
            const min = String(tomorrow.getMinutes()).padStart(2, '0');
            defaultDue = `${y}-${m}-${d}T${h}:${min}`;
        } else if (cycle && cycle.startDate) {
            defaultDue = `${cycle.startDate}T18:00`;
        }

        const dueInput = document.getElementById('task-due-date');
        const cycleHint = document.getElementById('task-cycle-hint');
        if (dueInput) {
            dueInput.value = defaultDue;
            if (cycle) {
                dueInput.min = `${cycle.startDate}T00:00`;
                dueInput.max = `${cycle.endDate}T23:59`;
            }
        }
        if (cycleHint && cycle) {
            cycleHint.textContent = `Periodo lectivo válido: ${cycle.startDate} al ${cycle.endDate}`;
        }

        openModal();
    }

    function openEditModal(id) {
        const Storage = window.StorageModule;
        const tasks = Storage.getTasks();
        const task = tasks.find(t => String(t.id) === String(id));
        if (!task) return;

        const cycle = Storage.getAcademicCycle();
        editingTaskId = id;
        document.getElementById('task-modal-title').textContent = 'Editar Tarea';
        document.getElementById('task-title').value = task.title;

        const dueInput = document.getElementById('task-due-date');
        const cycleHint = document.getElementById('task-cycle-hint');
        if (dueInput) {
            dueInput.value = task.dueDate || '';
            if (cycle) {
                dueInput.min = `${cycle.startDate}T00:00`;
                dueInput.max = `${cycle.endDate}T23:59`;
            }
        }
        if (cycleHint && cycle) {
            cycleHint.textContent = `Periodo lectivo válido: ${cycle.startDate} al ${cycle.endDate}`;
        }

        document.getElementById('task-priority').value = task.priority || 'media';
        document.getElementById('task-notes').value = task.notes || '';

        populateSubjectDropdown('task-subject-id', task.subjectId);
        openModal();
    }

    function openModal() {
        window.HapticsModule?.light();
        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
            requestAnimationFrame(() => {
                modal.classList.add('active');
            });
            setTimeout(() => {
                document.getElementById('task-title')?.focus();
            }, 100);
        }
    }

    function closeModal() {
        window.HapticsModule?.light();
        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.classList.remove('overflow-hidden');
            }, 200);
        }
        editingTaskId = null;
    }

    function handleFormSubmit() {
        const Storage = window.StorageModule;
        const subjectId = document.getElementById('task-subject-id').value;
        const title = document.getElementById('task-title').value.trim();
        const dueDate = document.getElementById('task-due-date').value;
        const priority = document.getElementById('task-priority').value;
        const notes = document.getElementById('task-notes').value.trim();

        if (!title) {
            window.showNotification?.('Por favor ingresa el título de la tarea.', 'error');
            return;
        }

        if (!subjectId) {
            window.showNotification?.('Debes vincular la tarea a una materia.', 'warning');
            return;
        }

        // Validación obligatoria contra el ciclo escolar
        if (dueDate) {
            const cycle = Storage.getAcademicCycle();
            if (!Storage.isDateInAcademicCycle(dueDate)) {
                window.showNotification?.(`⚠️ La fecha de entrega está fuera del ciclo escolar (${cycle.startDate} al ${cycle.endDate}).`, 'warning');
                return;
            }
        }

        const data = {
            subjectId,
            title,
            dueDate,
            priority,
            notes
        };

        try {
            if (editingTaskId) {
                const updated = Storage.updateTask(editingTaskId, data);
                if (updated) {
                    cancelTaskNotification(editingTaskId);
                    if (updated.dueDate && !updated.completed) {
                        scheduleTaskNotification(updated);
                    }
                }
                window.showNotification?.('Tarea actualizada correctamente.', 'success');
            } else {
                const isFirstTask = Storage.getTasks().length === 0;
                if (isFirstTask) {
                    requestNotificationPermissions();
                }
                const newTask = Storage.addTask({ ...data, completed: false });
                if (newTask && newTask.dueDate) {
                    scheduleTaskNotification(newTask);
                }
                window.showNotification?.('¡Tarea agregada exitosamente!', 'success');
            }
            window.HapticsModule?.double();
            closeModal();
            render();
            window.onDataChanged?.();
            window.WidgetSyncModule?.sync();
        } catch (e) {
            window.showNotification?.(e.message, 'error');
        }
    }

    function triggerCelebration(sourceEl = null) {
        const Storage = window.StorageModule;
        const useCats = Storage?.getSecretCatsEnabled ? Storage.getSecretCatsEnabled() : false;
        const emojis = useCats
            ? ['🐱', '😸', '😻', '🐾', '🐈', '😺', '😽', '🧶']
            : ['🎉', '🥳', '✨', '⭐', '🎊', '👏', '🎈'];
        let originX = window.innerWidth / 2;
        let originY = window.innerHeight / 2;

        if (sourceEl && sourceEl.getBoundingClientRect) {
            const rect = sourceEl.getBoundingClientRect();
            originX = rect.left + rect.width / 2;
            originY = rect.top + rect.height / 2;
        }

        const count = useCats ? 9 : 7;
        for (let i = 0; i < count; i++) {
            const span = document.createElement('span');
            span.className = 'celebration-emoji-particle';
            span.textContent = emojis[Math.floor(Math.random() * emojis.length)];

            const xOffset = (Math.random() - 0.5) * 160;
            const rot = (Math.random() - 0.5) * 60;
            const delay = Math.random() * 0.15;
            const scale = 0.85 + Math.random() * 0.45;

            span.style.left = `${originX}px`;
            span.style.top = `${originY}px`;
            span.style.setProperty('--x-offset', `${xOffset}px`);
            span.style.setProperty('--rot', `${rot}deg`);
            span.style.animationDelay = `${delay}s`;
            span.style.fontSize = `${1.3 * scale}rem`;

            document.body.appendChild(span);
            setTimeout(() => {
                span.remove();
            }, 1300);
        }
    }

    function toggleTask(id, sourceEl = null) {
        const Storage = window.StorageModule;
        const updated = Storage.toggleTask(id);
        if (updated) {
            if (updated.completed) {
                window.HapticsModule?.double();
                cancelTaskNotification(id);
                triggerCelebration(sourceEl);
            } else {
                window.HapticsModule?.light();
                if (updated.dueDate) {
                    scheduleTaskNotification(updated);
                }
            }
            const msg = updated.completed ? '🎉 ¡Tarea completada!' : 'Tarea marcada como pendiente.';
            window.showNotification?.(msg, 'success');
            render();
            window.onDataChanged?.();
            window.WidgetSyncModule?.sync();
        }
    }

    function deleteTaskPrompt(id) {
        const Storage = window.StorageModule;
        const tasks = Storage.getTasks();
        const task = tasks.find(t => String(t.id) === String(id));
        if (!task) return;

        if (confirm(`¿Eliminar la tarea "${task.title}"?`)) {
            window.HapticsModule?.double();
            cancelTaskNotification(id);
            Storage.deleteTask(id);
            window.showNotification?.('Tarea eliminada.', 'info');
            render();
            window.onDataChanged?.();
            window.WidgetSyncModule?.sync();
        }
    }

    function archiveTask(id) {
        const Storage = window.StorageModule;
        window.HapticsModule?.medium();
        cancelTaskNotification(id);
        const archived = Storage.archiveTask(id);
        if (archived) {
            window.showNotification?.('Tarea archivada en el baúl.', 'info');
            render();
            window.onDataChanged?.();
            window.WidgetSyncModule?.sync();
            window.ArchiveModule?.render?.();
        }
    }

    function render() {
        const Storage = window.StorageModule;
        const container = document.getElementById('tasks-container');
        const emptyState = document.getElementById('tasks-empty-state');
        const totalPendingBadge = document.getElementById('tasks-pending-count');
        const statsSummary = document.getElementById('tasks-stats-summary');

        if (!container || !Storage) return;

        const allTasks = Storage.getTasks();
        const subjects = Storage.getSubjects();
        const subjectMap = new Map(subjects.map(s => [s.id, s]));

        updateSubjectFilterDropdown();

        const pendingCount = allTasks.filter(t => !t.completed).length;
        const completedCount = allTasks.filter(t => t.completed).length;

        if (totalPendingBadge) {
            totalPendingBadge.textContent = pendingCount;
            totalPendingBadge.className = pendingCount > 0
                ? 'px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20'
                : 'px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
        }

        if (statsSummary) {
            const pct = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;
            statsSummary.innerHTML = `
                <div class="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>${pendingCount} pendientes</span>
                    <span>•</span>
                    <span>${completedCount} listas</span>
                    <span>•</span>
                    <span class="font-bold text-indigo-600 dark:text-indigo-400">${pct}% completado</span>
                </div>
            `;
        }

        let filtered = allTasks;

        if (currentFilter === 'pending') {
            filtered = filtered.filter(t => !t.completed);
        } else if (currentFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        }

        if (subjectFilter !== 'all') {
            filtered = filtered.filter(t => t.subjectId === subjectFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(t => {
                const subName = subjectMap.get(t.subjectId)?.name.toLowerCase() || '';
                return t.title.toLowerCase().includes(searchQuery) ||
                       (t.notes && t.notes.toLowerCase().includes(searchQuery)) ||
                       subName.includes(searchQuery);
            });
        }

        filtered.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        if (filtered.length === 0) {
            container.innerHTML = '';
            container.classList.add('hidden');
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        container.classList.remove('hidden');
        container.innerHTML = '';

        filtered.forEach((task, index) => {
            const subject = subjectMap.get(task.subjectId) || {
                name: 'Materia',
                color: '#64748B'
            };

            const urgencyInfo = getUrgencyDetails(task.dueDate, task.completed);

            const card = document.createElement('div');
            card.className = `stagger-card card-hover group relative bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                task.completed ? 'opacity-70 bg-slate-50/60 dark:bg-slate-800/40' : ''
            }`;
            card.style.setProperty('--stagger-i', index);
            card.style.borderLeft = `6px solid ${subject.color}`;
            card.dataset.taskId = task.id;

            card.innerHTML = `
                <!-- Contenido Principal & Checkbox -->
                <div class="flex items-start gap-3.5 flex-1 min-w-0 w-full">
                    <button type="button" data-action="toggle" data-id="${task.id}"
                        class="mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-150 active:scale-90 ${
                            task.completed
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-700'
                        }"
                        title="${task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}">
                        ${task.completed ? `
                            <svg class="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                        ` : ''}
                    </button>

                    <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2 mb-1.5">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-xs"
                                  style="background-color: ${hexToRgba(subject.color, 0.12)}; color: ${subject.color}; border: 1px solid ${hexToRgba(subject.color, 0.3)};">
                                <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${subject.color};"></span>
                                <span class="truncate max-w-[180px]">${escapeHtml(subject.name)}</span>
                            </span>

                            ${urgencyInfo.badge}
                            ${getPriorityBadge(task.priority)}
                        </div>

                        <h4 class="text-base font-semibold text-slate-800 dark:text-white leading-snug break-words ${
                            task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }">
                            ${escapeHtml(task.title)}
                        </h4>

                        <!-- Bloque de Notas Breves / Recordatorio -->
                        ${task.notes ? `
                            <div class="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600/60 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2 shadow-2xs">
                                <span class="text-indigo-500 dark:text-indigo-400 text-sm shrink-0 select-none">📝</span>
                                <div class="flex-1 min-w-0">
                                    <span class="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block mb-0.5">Nota / Recordatorio</span>
                                    <p class="text-xs leading-relaxed break-words whitespace-pre-line text-slate-800 dark:text-slate-200 font-medium">
                                        ${escapeHtml(task.notes)}
                                    </p>
                                </div>
                            </div>
                        ` : ''}

                        ${task.dueDate ? `
                            <div class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
                                <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                <span>${formatDateReadable(task.dueDate)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Acciones Rápidas -->
                <div class="flex items-center gap-1 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60 w-full sm:w-auto justify-end">
                    <button type="button" data-action="edit" data-id="${task.id}"
                        class="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                        title="Editar tarea">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                    </button>
                    ${task.completed ? `
                        <button type="button" data-action="archive" data-id="${task.id}"
                            class="tap-effect flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm shadow-amber-500/30 transition-transform active:scale-95"
                            title="Archivar actividad completada en el baúl">
                            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                            </svg>
                            <span>Archivar</span>
                        </button>
                    ` : `
                        <button type="button" data-action="archive" data-id="${task.id}"
                            class="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors"
                            title="Archivar en el baúl">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                            </svg>
                        </button>
                    `}
                    <button type="button" data-action="delete" data-id="${task.id}"
                        class="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                        title="Eliminar tarea">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            `;

            card.querySelector('[data-action="toggle"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTask(task.id, e.currentTarget);
            });
            card.querySelector('[data-action="edit"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                openEditModal(task.id);
            });
            card.querySelector('[data-action="archive"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                archiveTask(task.id);
            });
            card.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                deleteTaskPrompt(task.id);
            });

            container.appendChild(card);
        });
    }

    function getPriorityBadge(priority) {
        switch (priority) {
            case 'alta':
                return `<span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Alta</span>`;
            case 'media':
                return `<span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Media</span>`;
            case 'baja':
                return `<span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Baja</span>`;
            default:
                return '';
        }
    }

    function getUrgencyDetails(dueDateStr, isCompleted) {
        if (!dueDateStr) {
            return { isOverdue: false, badge: '' };
        }
        if (isCompleted) {
            return { isOverdue: false, badge: `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">Completada</span>` };
        }

        const now = new Date();
        const due = new Date(dueDateStr);
        const diffMs = due.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffMs < 0) {
            return {
                isOverdue: true,
                badge: `<span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 animate-pulse">Vencida</span>`
            };
        } else if (diffHours <= 24) {
            return {
                isOverdue: false,
                badge: `<span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">Vence hoy</span>`
            };
        } else if (diffDays <= 2) {
            return {
                isOverdue: false,
                badge: `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">En 2 días</span>`
            };
        }

        return {
            isOverdue: false,
            badge: ''
        };
    }

    function formatDateReadable(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;

            const options = {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return d.toLocaleDateString('es-MX', options);
        } catch {
            return dateStr;
        }
    }

    function hexToRgba(hex, alpha = 0.15) {
        if (!hex) return `rgba(99, 102, 241, ${alpha})`;
        let c = hex.replace('#', '');
        if (c.length === 3) {
            c = c.split('').map(char => char + char).join('');
        }
        const num = parseInt(c, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
        openAddModal,
        openEditModal,
        closeModal,
        scheduleTaskNotification,
        cancelTaskNotification,
        cancelAllNotifications,
        requestNotificationPermissions,
        get subjectFilter() { return subjectFilter; },
        set subjectFilter(val) { subjectFilter = val; }
    };
})();
