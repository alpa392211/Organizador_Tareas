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

    const BOTTOM_DRAWER_THRESHOLD = 8;

    let selectedColor = PRESET_COLORS[0].hex;
    let selectedReminderMinutes = null;
    let editingSubjectId = null;
    let bottomDrawerOpen = false;

    function init() {
        renderPresetColors();
        setupFormListeners();
        setupReminderListeners();
        setupBottomDrawerListeners();
    }

    function setupBottomDrawerListeners() {
        const toggleBtn = document.getElementById('subjects-bottom-toggle-btn');
        if (toggleBtn && toggleBtn.dataset.bound !== 'true') {
            toggleBtn.dataset.bound = 'true';
            toggleBtn.addEventListener('click', () => {
                bottomDrawerOpen = !bottomDrawerOpen;
                window.HapticsModule?.light();
                syncBottomDrawerUI();
            });
        }

        const quickBtns = [
            document.getElementById('subjects-placement-quick-btn'),
            document.getElementById('subjects-placement-quick-bottom-btn')
        ];
        quickBtns.forEach(btn => {
            if (!btn || btn.dataset.bound === 'true') return;
            btn.dataset.bound = 'true';
            btn.addEventListener('click', () => {
                toggleQuickPlacement();
            });
        });
    }

    function isCurrentlyBottomPlaced(subjectsCount) {
        const Storage = window.StorageModule;
        const pref = Storage?.getSubjectsAddPlacement?.() || 'auto';
        return pref === 'bottom' || (pref === 'auto' && subjectsCount >= BOTTOM_DRAWER_THRESHOLD);
    }

    function syncQuickPlacementButtons(useBottomDrawer) {
        const topBtn = document.getElementById('subjects-placement-quick-btn');
        const bottomBtn = document.getElementById('subjects-placement-quick-bottom-btn');
        if (topBtn) {
            topBtn.title = 'Fijar botón abajo';
            topBtn.setAttribute('aria-label', 'Mover botón Nueva materia abajo');
        }
        if (bottomBtn) {
            bottomBtn.title = 'Fijar botón arriba';
            bottomBtn.setAttribute('aria-label', 'Mover botón Nueva materia arriba');
        }
    }

    function syncPlacementSettingsUI() {
        const Storage = window.StorageModule;
        const pref = Storage?.getSubjectsAddPlacement?.() || 'auto';
        const track = document.getElementById('settings-subjects-add-placement-track');
        if (track) {
            track.querySelectorAll('[data-subjects-add-placement]').forEach(btn => {
                const active = btn.getAttribute('data-subjects-add-placement') === pref;
                btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                btn.classList.toggle('seg-btn-active', active);
                btn.classList.toggle('seg-btn-inactive', !active);
            });
            window.SegmentedControl?.sync?.(track, { instant: true });
        }
        const pill = document.getElementById('settings-subjects-placement-pill');
        if (pill) {
            const labels = { auto: 'Automático (8+)', top: 'Siempre arriba', bottom: 'Siempre abajo' };
            pill.textContent = labels[pref] || 'Automático (8+)';
        }
    }

    function setAddButtonPlacement(placement, opts = {}) {
        const Storage = window.StorageModule;
        const saved = Storage?.setSubjectsAddPlacement?.(placement) || 'auto';
        const subjectsCount = Storage?.getSubjects?.().length || 0;
        if (saved === 'bottom') {
            bottomDrawerOpen = true;
        }
        updateAddButtonPlacement(subjectsCount, Storage?.MAX_SUBJECTS || 16, { animate: opts.animate !== false });
        syncPlacementSettingsUI();
        return saved;
    }

    function toggleQuickPlacement() {
        const Storage = window.StorageModule;
        const count = Storage?.getSubjects?.().length || 0;
        const currentlyBottom = isCurrentlyBottomPlaced(count);
        const nextPref = currentlyBottom ? 'top' : 'bottom';
        window.HapticsModule?.light?.();
        setAddButtonPlacement(nextPref, { animate: true });
        window.showNotification?.(
            nextPref === 'bottom'
                ? 'Botón fijado abajo. Puedes volver a Automático en Configuración.'
                : 'Botón fijado arriba. Puedes volver a Automático en Configuración.',
            'info'
        );
    }

    function syncBottomDrawerUI() {
        const drawer = document.getElementById('subjects-bottom-add-drawer');
        const toggleBtn = document.getElementById('subjects-bottom-toggle-btn');
        const panel = document.getElementById('subjects-bottom-add-panel');
        if (!drawer || !toggleBtn || !panel) return;

        drawer.classList.toggle('is-open', bottomDrawerOpen);
        toggleBtn.setAttribute('aria-expanded', bottomDrawerOpen ? 'true' : 'false');
        panel.setAttribute('aria-hidden', bottomDrawerOpen ? 'false' : 'true');
    }

    function updateAddButtonPlacement(subjectsCount, maxSubjects, opts = {}) {
        const addBtn = document.getElementById('add-subject-btn');
        const headerSlot = document.getElementById('subjects-header-cta-slot');
        const bottomDrawer = document.getElementById('subjects-bottom-add-drawer');
        const bottomContent = document.getElementById('subjects-bottom-add-content');
        const quickBottomBtn = document.getElementById('subjects-placement-quick-bottom-btn');
        const counterChip = document.getElementById('subjects-bottom-counter-chip');
        const subtitle = document.getElementById('subjects-bottom-drawer-subtitle');
        const helperText = document.getElementById('subjects-bottom-helper-text');

        const useBottomDrawer = isCurrentlyBottomPlaced(subjectsCount);
        const reducedEffects = document.documentElement.getAttribute('data-reduced-effects') === 'true'
            || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

        if (counterChip) {
            counterChip.textContent = `${subjectsCount}/${maxSubjects}`;
        }
        if (subtitle) {
            subtitle.textContent = subjectsCount >= maxSubjects
                ? `Límite de ${maxSubjects} materias alcanzado`
                : 'Toca para desplegar el botón de nueva materia';
        }
        if (helperText) {
            helperText.textContent = subjectsCount >= maxSubjects
                ? `Alcanzaste el límite máximo de ${maxSubjects} materias. Elimina alguna para agregar otra.`
                : `Tienes ${subjectsCount} materias registradas. Añade nuevas asignaturas desde aquí (máximo ${maxSubjects}).`;
        }

        syncQuickPlacementButtons(useBottomDrawer);

        if (useBottomDrawer) {
            if (headerSlot) headerSlot.classList.add('hidden');
            if (bottomDrawer) bottomDrawer.classList.remove('hidden');
            if (addBtn && bottomContent && addBtn.parentElement !== bottomContent) {
                addBtn.classList.add('w-full', 'sm:w-auto');
                if (quickBottomBtn && quickBottomBtn.parentElement === bottomContent) {
                    bottomContent.insertBefore(addBtn, quickBottomBtn);
                } else {
                    bottomContent.appendChild(addBtn);
                }
                if (opts.animate && !reducedEffects) {
                    addBtn.classList.remove('subjects-placement-swap');
                    void addBtn.offsetWidth;
                    addBtn.classList.add('subjects-placement-swap');
                }
            }
            syncBottomDrawerUI();
        } else {
            bottomDrawerOpen = false;
            syncBottomDrawerUI();
            if (bottomDrawer) bottomDrawer.classList.add('hidden');
            if (headerSlot) headerSlot.classList.remove('hidden');
            if (addBtn && headerSlot && addBtn.parentElement !== headerSlot) {
                addBtn.classList.remove('w-full', 'sm:w-auto');
                headerSlot.insertBefore(addBtn, headerSlot.firstChild);
                if (opts.animate && !reducedEffects) {
                    addBtn.classList.remove('subjects-placement-swap');
                    void addBtn.offsetWidth;
                    addBtn.classList.add('subjects-placement-swap');
                }
            }
        }
        syncPlacementSettingsUI();
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

    function normalizeReminderMinutes(val) {
        const num = Number(val);
        return (num === 15 || num === 30 || num === 45 || num === 60) ? num : null;
    }

    function formatReminderShort(minutes) {
        const m = normalizeReminderMinutes(minutes);
        if (!m) return '';
        return m === 60 ? '1 hora antes' : `${m} min antes`;
    }

    function syncReminderUI(minutes = selectedReminderMinutes) {
        const normalized = normalizeReminderMinutes(minutes);
        selectedReminderMinutes = normalized;

        const toggle = document.getElementById('subject-reminder-toggle');
        const hiddenInput = document.getElementById('subject-reminder-minutes');
        const statusLabel = document.getElementById('subject-reminder-status');
        const optionsGrid = document.getElementById('subject-reminder-options');

        if (toggle) toggle.checked = Boolean(normalized);
        if (hiddenInput) hiddenInput.value = normalized ? String(normalized) : '';
        if (statusLabel) {
            statusLabel.textContent = normalized
                ? `Aviso ${formatReminderShort(normalized)}`
                : 'Sin recordatorio';
        }
        if (optionsGrid) {
            optionsGrid.querySelectorAll('[data-subject-reminder]').forEach(btn => {
                const btnVal = Number(btn.getAttribute('data-subject-reminder'));
                const isSelected = normalized === btnVal;
                btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            });
        }
    }

    function setupReminderListeners() {
        const toggle = document.getElementById('subject-reminder-toggle');
        if (toggle && toggle.dataset.bound !== 'true') {
            toggle.dataset.bound = 'true';
            toggle.addEventListener('change', (e) => {
                window.HapticsModule?.light?.();
                if (e.target.checked) {
                    syncReminderUI(selectedReminderMinutes || 15);
                    window.NotificationsModule?.requestPermission?.().catch?.(() => {});
                } else {
                    syncReminderUI(null);
                }
            });
        }

        const optionsGrid = document.getElementById('subject-reminder-options');
        if (optionsGrid && optionsGrid.dataset.bound !== 'true') {
            optionsGrid.dataset.bound = 'true';
            optionsGrid.querySelectorAll('[data-subject-reminder]').forEach(btn => {
                btn.addEventListener('click', () => {
                    window.HapticsModule?.light?.();
                    const val = normalizeReminderMinutes(btn.getAttribute('data-subject-reminder'));
                    const nextVal = selectedReminderMinutes === val ? null : val;
                    syncReminderUI(nextVal);
                    if (nextVal) {
                        window.NotificationsModule?.requestPermission?.().catch?.(() => {});
                    }
                });
            });
        }

        const testBtn = document.getElementById('subject-reminder-test-btn');
        if (testBtn && testBtn.dataset.bound !== 'true') {
            testBtn.dataset.bound = 'true';
            testBtn.addEventListener('click', () => {
                window.HapticsModule?.light?.();
                const name = document.getElementById('subject-name')?.value?.trim() || 'Tu materia';
                const startTime = document.getElementById('subject-start-time')?.value || '';
                window.NotificationsModule?.testSubjectReminder?.(name, selectedReminderMinutes || 15, startTime);
            });
        }
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
        syncReminderUI(null);

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
        syncReminderUI(subject.reminderMinutes);

        document.querySelectorAll('input[name="subject-days"]').forEach(cb => {
            cb.checked = Array.isArray(subject.days) && subject.days.includes(cb.value);
        });

        openModal();
    }

    function openModal() {
        window.HapticsModule?.light();
        const modal = document.getElementById('subject-modal');
        if (modal) {
            modal.style.display = '';
            const backdrop = document.getElementById('subject-modal-backdrop');
            if (backdrop) {
                backdrop.style.display = '';
                backdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
                backdrop.style.opacity = '';
            }
            const sheet = modal.querySelector('.mobile-bottom-sheet');
            if (sheet) {
                sheet.style.display = '';
                sheet.classList.remove('hidden');
                sheet.style.transform = '';
                sheet.style.transition = '';
                sheet.style.maxHeight = '';
            }
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
            void modal.offsetWidth;
            modal.classList.add('active');
            setTimeout(() => {
                document.getElementById('subject-name')?.focus();
            }, 100);
        }
    }

    function closeModal() {
        window.HapticsModule?.light();
        const modal = document.getElementById('subject-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.classList.remove('overflow-hidden');
            }, 200);
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

        const hiddenRemVal = document.getElementById('subject-reminder-minutes')?.value;
        const reminderMinutes = normalizeReminderMinutes(
            hiddenRemVal !== undefined && hiddenRemVal !== '' ? hiddenRemVal : selectedReminderMinutes
        );

        if (reminderMinutes && (selectedDays.length === 0 || !startTime)) {
            window.showNotification?.('Selecciona al menos un día de clase y hora de inicio para activar el recordatorio.', 'warning');
            return;
        }

        const data = {
            name,
            color: selectedColor,
            days: selectedDays,
            startTime,
            endTime,
            professor,
            classroom,
            reminderMinutes
        };

        try {
            let savedSubject = null;
            if (editingSubjectId) {
                savedSubject = Storage.updateSubject(editingSubjectId, data);
            } else {
                savedSubject = Storage.addSubject(data);
            }
            if (savedSubject) {
                if (savedSubject.reminderMinutes) {
                    const baseMsg = editingSubjectId ? 'Materia actualizada' : '¡Materia registrada!';
                    window.showNotification?.(`${baseMsg} • Recordatorio activo (${formatReminderShort(savedSubject.reminderMinutes)}).`, 'success');
                    window.NotificationsModule?.requestPermission?.().catch?.(() => {});
                    window.NotificationsModule?.scheduleSubject?.(savedSubject)?.catch?.(() => {});
                } else {
                    window.showNotification?.(
                        editingSubjectId ? 'Materia actualizada con éxito.' : '¡Materia registrada exitosamente!',
                        'success'
                    );
                    window.NotificationsModule?.cancelSubject?.(savedSubject.id)?.catch?.(() => {});
                }
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
            window.HapticsModule?.double();
            window.NotificationsModule?.cancelSubject?.(id)?.catch?.(() => {});
            Storage.deleteSubject(id);
            window.showNotification?.(`Materia "${subject.name}" eliminada.`, 'info');
            render();
            window.onDataChanged?.();
            window.WidgetSyncModule?.sync();
        }
    }

    /**
     * Renderiza el tablero de materias respetando la regla estricta:
     * "Solo deben renderizarse en el tablero principal las materias creadas;
     * los espacios vacíos no deben mostrarse ni ocupar espacio en el grid."
     */
    function render() {
        const Storage = window.StorageModule;
        const longPress = typeof Storage.isLongPressEnabled === "function" ? Storage.isLongPressEnabled() : true;
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

        // Reubicar botón añadir al menú desplegable inferior después de 8 materias
        updateAddButtonPlacement(subjects.length, Storage.MAX_SUBJECTS);

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

        subjects.forEach((subject, index) => {
            const subjectTasks = tasks.filter(t => t.subjectId === subject.id);
            const pendingTasks = subjectTasks.filter(t => !t.completed).length;

            const card = document.createElement('div');
            card.className = `subject-card stagger-card card-hover group relative bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col justify-between`;
            card.style.setProperty('--stagger-i', index);
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

                        ${normalizeReminderMinutes(subject.reminderMinutes) ? `
                            <div class="subject-reminder-card-badge inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl border" data-subject-reminder-badge="${normalizeReminderMinutes(subject.reminderMinutes)}">
                                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                                </svg>
                                <span>Recordatorio: ${formatReminderShort(subject.reminderMinutes)}</span>
                            </div>
                        ` : ''}

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
                ${longPress ? '' : `
                <div class="flex items-center gap-2 pt-1">
                    <button type="button" data-action="edit" data-id="${subject.id}" class="tap-effect flex-1 px-2 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-slate-700 dark:text-indigo-300">✏️ Editar</button>
                    <button type="button" data-action="delete" data-id="${subject.id}" class="tap-effect flex-1 px-2 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400">🗑️ Eliminar</button>
                </div>`}
            `;

            // Menú contextual flotante por pulsación prolongada (Long-Press o Clic Derecho)
            if (longPress) {
                window.CardContextMenu?.bind?.(card, {
                    title: subject.name,
                    onEdit: () => openEditModal(subject.id),
                    onDelete: () => deleteSubjectPrompt(subject.id)
                });
            }
            card.querySelector('[data-action="edit"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(subject.id);
            });
            card.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
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
        setAddButtonPlacement,
        toggleQuickPlacement,
        syncPlacementSettingsUI,
        updateAddButtonPlacement,
        PRESET_COLORS,
        DAYS_CONFIG
    };
})();
