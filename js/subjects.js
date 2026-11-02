/**
 * Módulo de Materias y Horarios
 * Maneja la creación, edición, borrado y renderizado estricto (1 a 16 elementos).
 */

window.SubjectsModule = (() => {
    const PRESET_COLORS = [
        { hex: '#6366F1', name: 'Índigo' },
        { hex: '#8B5CF6', name: 'Violeta' },
        { hex: '#EC4899', name: 'Rosa Vibrante' },
        { hex: '#F43F5E', name: 'Frambuesa' },
        { hex: '#EF4444', name: 'Rojo Carmesí' },
        { hex: '#F97316', name: 'Naranja Vivo' },
        { hex: '#F59E0B', name: 'Ámbar Cálido' },
        { hex: '#10B981', name: 'Esmeralda' },
        { hex: '#14B8A6', name: 'Turquesa' },
        { hex: '#06B6D4', name: 'Cian Profundo' },
        { hex: '#3B82F6', name: 'Azul Eléctrico' },
        { hex: '#84CC16', name: 'Verde Lima' }
    ];

    const DAYS_CONFIG = [
        { id: 'lun', label: 'Lunes', short: 'Lun' },
        { id: 'mar', label: 'Martes', short: 'Mar' },
        { id: 'mie', label: 'Miércoles', short: 'Mié' },
        { id: 'jue', label: 'Jueves', short: 'Jue' },
        { id: 'vie', label: 'Viernes', short: 'Vie' },
        { id: 'sab', label: 'Sábado', short: 'Sáb' },
        { id: 'dom', label: 'Domingo', short: 'Dom' }
    ];

    let selectedColor = PRESET_COLORS[0].hex;
    let editingSubjectId = null;

    function init() {
        renderPresetColors();
        setupFormListeners();
    }

    function renderPresetColors(targetContainerId = 'color-presets-container', hexInputId = 'subject-color-hex') {
        const container = document.getElementById(targetContainerId);
        const hexInput = document.getElementById(hexInputId);
        if (!container) return;

        container.innerHTML = '';
        PRESET_COLORS.forEach(c => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center ${
                selectedColor.toLowerCase() === c.hex.toLowerCase() 
                    ? 'border-gray-900 ring-2 ring-offset-2 ring-indigo-500 scale-105' 
                    : 'border-white/50'
            }`;
            btn.style.backgroundColor = c.hex;
            btn.title = c.name;
            btn.innerHTML = selectedColor.toLowerCase() === c.hex.toLowerCase()
                ? `<svg class="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`
                : '';
            
            btn.addEventListener('click', () => {
                selectedColor = c.hex;
                if (hexInput) hexInput.value = c.hex;
                renderPresetColors(targetContainerId, hexInputId);
            });
            container.appendChild(btn);
        });

        if (hexInput) {
            hexInput.value = selectedColor;
            hexInput.oninput = (e) => {
                selectedColor = e.target.value;
                renderPresetColors(targetContainerId, hexInputId);
            };
        }
    }

    function setupFormListeners() {
        const form = document.getElementById('subject-form');
        if (!form) return;

        form.onsubmit = (e) => {
            e.preventDefault();
            handleFormSubmit();
        };
    }

    function openAddModal() {
        const Storage = window.StorageModule;
        const subjects = Storage.getSubjects();
        if (subjects.length >= Storage.MAX_SUBJECTS) {
            window.showNotification?.(`Has alcanzado el límite máximo de ${Storage.MAX_SUBJECTS} materias. Elimina una si deseas registrar otra.`, 'warning');
            return;
        }

        editingSubjectId = null;
        document.getElementById('subject-modal-title').textContent = 'Nueva Materia o Actividad';
        document.getElementById('subject-form').reset();
        selectedColor = PRESET_COLORS[subjects.length % PRESET_COLORS.length].hex;
        renderPresetColors();

        document.querySelectorAll('input[name="subject-days"]').forEach(cb => cb.checked = false);
        openModal();
    }

    function openEditModal(id) {
        const Storage = window.StorageModule;
        const subjects = Storage.getSubjects();
        const subject = subjects.find(s => s.id === id);
        if (!subject) return;

        editingSubjectId = id;
        document.getElementById('subject-modal-title').textContent = 'Editar Materia';
        document.getElementById('subject-name').value = subject.name;
        document.getElementById('subject-start-time').value = subject.startTime || '07:00';
        document.getElementById('subject-end-time').value = subject.endTime || '09:00';
        document.getElementById('subject-professor').value = subject.professor || '';
        document.getElementById('subject-classroom').value = subject.classroom || '';

        selectedColor = subject.color || PRESET_COLORS[0].hex;
        renderPresetColors();

        document.querySelectorAll('input[name="subject-days"]').forEach(cb => {
            cb.checked = Array.isArray(subject.days) && subject.days.includes(cb.value);
        });

        openModal();
    }

    function openModal() {
        const modal = document.getElementById('subject-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
            setTimeout(() => {
                document.getElementById('subject-name')?.focus();
            }, 100);
        }
    }

    function closeModal() {
        const modal = document.getElementById('subject-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.classList.remove('overflow-hidden');
        }
        editingSubjectId = null;
    }

    function handleFormSubmit() {
        const Storage = window.StorageModule;
        const name = document.getElementById('subject-name').value.trim();
        const startTime = document.getElementById('subject-start-time').value;
        const endTime = document.getElementById('subject-end-time').value;
        const professor = document.getElementById('subject-professor').value.trim();
        const classroom = document.getElementById('subject-classroom').value.trim();

        const selectedDays = [];
        document.querySelectorAll('input[name="subject-days"]:checked').forEach(cb => {
            selectedDays.push(cb.value);
        });

        if (!name) {
            window.showNotification?.('Por favor ingresa el nombre de la materia.', 'error');
            return;
        }

        if (startTime && endTime && startTime >= endTime) {
            window.showNotification?.('La hora de inicio debe ser anterior a la hora de fin.', 'warning');
            return;
        }

        const data = {
            name,
            color: selectedColor,
            days: selectedDays,
            startTime,
            endTime,
            professor,
            classroom
        };

        try {
            if (editingSubjectId) {
                Storage.updateSubject(editingSubjectId, data);
                window.showNotification?.('Materia actualizada con éxito.', 'success');
            } else {
                Storage.addSubject(data);
                window.showNotification?.('¡Materia registrada exitosamente!', 'success');
            }
            closeModal();
            render();
            window.onDataChanged?.();
        } catch (e) {
            window.showNotification?.(e.message, 'error');
        }
    }

    function deleteSubjectPrompt(id) {
        const Storage = window.StorageModule;
        const subjects = Storage.getSubjects();
        const subject = subjects.find(s => s.id === id);
        if (!subject) return;

        const tasks = Storage.getTasks().filter(t => t.subjectId === id);
        const confirmMsg = tasks.length > 0
            ? `¿Eliminar "${subject.name}"? También se eliminarán sus ${tasks.length} tareas vinculadas.`
            : `¿Estás seguro de eliminar la materia "${subject.name}"?`;

        if (confirm(confirmMsg)) {
            Storage.deleteSubject(id);
            window.showNotification?.(`Materia "${subject.name}" eliminada.`, 'info');
            render();
            window.onDataChanged?.();
        }
    }

    /**
     * Renderiza el tablero de materias respetando la regla estricta:
     * "Solo deben renderizarse en el tablero principal las materias creadas;
     * los espacios vacíos no deben mostrarse ni ocupar espacio en el grid."
     */
    function render() {
        const Storage = window.StorageModule;
        const container = document.getElementById('subjects-grid');
        const countBadge = document.getElementById('subjects-count-badge');
        const addBtn = document.getElementById('add-subject-btn');
        const emptyState = document.getElementById('subjects-empty-state');

        if (!container || !Storage) return;

        const subjects = Storage.getSubjects();
        const tasks = Storage.getTasks();

        // Actualizar contador visual de materias (1 a 16)
        if (countBadge) {
            countBadge.textContent = `${subjects.length}/${Storage.MAX_SUBJECTS}`;
            if (subjects.length >= Storage.MAX_SUBJECTS) {
                countBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20';
            } else {
                countBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20';
            }
        }

        // Estado del botón añadir si se alcanzó el límite
        if (addBtn) {
            if (subjects.length >= Storage.MAX_SUBJECTS) {
                addBtn.disabled = true;
                addBtn.classList.add('opacity-50', 'cursor-not-allowed');
                addBtn.title = `Límite máximo de ${Storage.MAX_SUBJECTS} materias alcanzado`;
            } else {
                addBtn.disabled = false;
                addBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                addBtn.title = 'Añadir nueva materia';
            }
        }

        // Regla estricta: si 0 materias, mostrar empty state y ocultar grid
        if (subjects.length === 0) {
            container.innerHTML = '';
            container.classList.add('hidden');
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        // Si hay materias: Ocultar empty state y renderizar estrictamente las existentes
        if (emptyState) emptyState.classList.add('hidden');
        container.classList.remove('hidden');
        container.innerHTML = '';

        subjects.forEach(subject => {
            const subjectTasks = tasks.filter(t => t.subjectId === subject.id);
            const pendingTasks = subjectTasks.filter(t => !t.completed).length;

            const card = document.createElement('div');
            card.className = `group relative bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between`;
            card.style.borderLeft = `6px solid ${subject.color}`;

            const daysHtml = DAYS_CONFIG.map(day => {
                const isActive = Array.isArray(subject.days) && subject.days.includes(day.id);
                return `
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                        isActive
                            ? 'text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 opacity-60'
                    }" style="${isActive ? `background-color: ${subject.color}` : ''}">
                        ${day.short}
                    </span>
                `;
            }).join('');

            const timeRange = (subject.startTime && subject.endTime)
                ? `${subject.startTime} - ${subject.endTime} hrs`
                : 'Sin horario fijado';

            card.innerHTML = `
                <div>
                    <!-- Encabezado de la Tarjeta -->
                    <div class="flex items-start justify-between gap-3 mb-3">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="w-2.5 h-2.5 rounded-full inline-block shrink-0" style="background-color: ${subject.color};"></span>
                                <span class="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                    Materia
                                </span>
                            </div>
                            <h3 class="text-base font-bold text-slate-800 dark:text-white leading-snug truncate" title="${escapeHtml(subject.name)}">
                                ${escapeHtml(subject.name)}
                            </h3>
                        </div>

                        <!-- Menú de Acciones Rápidas -->
                        <div class="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button type="button" data-action="edit" data-id="${subject.id}" 
                                class="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                                title="Editar materia">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                </svg>
                            </button>
                            <button type="button" data-action="delete" data-id="${subject.id}" 
                                class="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                                title="Eliminar materia">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Horario y Días -->
                    <div class="space-y-2.5 mb-4">
                        <div class="flex items-center text-xs text-slate-600 dark:text-slate-300 font-medium gap-1.5">
                            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span>${timeRange}</span>
                        </div>

                        <div class="flex flex-wrap gap-1">
                            ${daysHtml}
                        </div>

                        ${subject.classroom ? `
                            <div class="flex items-center text-xs text-slate-600 dark:text-slate-400 gap-1.5 pt-1">
                                <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                                <span class="truncate">${escapeHtml(subject.classroom)}</span>
                            </div>
                        ` : ''}

                        ${subject.professor ? `
                            <div class="flex items-center text-xs text-slate-600 dark:text-slate-400 gap-1.5">
                                <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                </svg>
                                <span class="truncate">${escapeHtml(subject.professor)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Pie de Tarjeta: Contador de Tareas vinculadas -->
                <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <button type="button" data-action="filter-tasks" data-id="${subject.id}" 
                        class="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                        <span class="w-2 h-2 rounded-full ${pendingTasks > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}"></span>
                        <span>${pendingTasks === 0 ? 'Sin tareas pendientes' : `${pendingTasks} tarea${pendingTasks > 1 ? 's' : ''} pendiente${pendingTasks > 1 ? 's' : ''}`}</span>
                    </button>
                    <span class="text-[11px] text-slate-400 font-mono">${subjectTasks.length} tot.</span>
                </div>
            `;

            card.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
                openEditModal(subject.id);
            });

            card.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
                deleteSubjectPrompt(subject.id);
            });

            card.querySelector('[data-action="filter-tasks"]')?.addEventListener('click', () => {
                window.navigateToTasksWithSubject?.(subject.id);
            });

            container.appendChild(card);
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
        openAddModal,
        openEditModal,
        closeModal,
        PRESET_COLORS,
        DAYS_CONFIG
    };
})();
