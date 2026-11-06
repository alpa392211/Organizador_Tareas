/**
 * Módulo de Notas Rápidas
 * Gestiona la creación, edición, filtrado por categorías, recordatorios y renderizado.
 * Clave de persistencia: agenda_cch_notes
 */

window.NotesModule = (() => {
    let currentFilter = 'all'; // 'all' | 'idea' | 'apunte' | 'pendiente' | 'importante' | 'personal'
    let searchQuery = '';
    let editingNoteId = null;

    const NOTE_TYPES = {
        idea: {
            id: 'idea',
            label: 'Idea',
            emoji: '💡',
            badgeClass: 'note-badge-idea',
            dotColor: '#F59E0B'
        },
        apunte: {
            id: 'apunte',
            label: 'Apunte Rápido',
            emoji: '📝',
            badgeClass: 'note-badge-apunte',
            dotColor: '#6366F1'
        },
        pendiente: {
            id: 'pendiente',
            label: 'Pendiente',
            emoji: '📌',
            badgeClass: 'note-badge-pendiente',
            dotColor: '#10B981'
        },
        importante: {
            id: 'importante',
            label: 'Importante',
            emoji: '⚠️',
            badgeClass: 'note-badge-importante',
            dotColor: '#EF4444'
        },
        personal: {
            id: 'personal',
            label: 'Personal',
            emoji: '🔒',
            badgeClass: 'note-badge-personal',
            dotColor: '#A855F7'
        }
    };

    function init() {
        setupEventListeners();
    }

    function setupEventListeners() {
        // Formulario de Nota
        const form = document.getElementById('note-form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                handleFormSubmit();
            };
        }

        // Buscador de Notas
        const searchInput = document.getElementById('notes-search-input');
        if (searchInput) {
            searchInput.oninput = (e) => {
                searchQuery = e.target.value.toLowerCase().trim();
                render();
            };
        }

        // Filtros por Categoría de Nota
        document.querySelectorAll('[data-note-filter]').forEach(btn => {
            btn.onclick = () => {
                window.HapticsModule?.light();
                document.querySelectorAll('[data-note-filter]').forEach(b => {
                    b.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
                    b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-400');
                });
                btn.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
                btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-400');
                currentFilter = btn.dataset.noteFilter;
                render();
            };
        });

        // Toggle del checkbox de recordatorio en el modal
        const reminderCheckbox = document.getElementById('note-has-reminder');
        const reminderContainer = document.getElementById('note-reminder-datetime-container');
        if (reminderCheckbox && reminderContainer) {
            reminderCheckbox.onchange = () => {
                window.HapticsModule?.light();
                if (reminderCheckbox.checked) {
                    reminderContainer.classList.remove('hidden');
                    const dtInput = document.getElementById('note-reminder-datetime');
                    if (dtInput && !dtInput.value) {
                        // Por defecto, sugerir 1 hora después
                        const d = new Date(Date.now() + 3600000);
                        const isoStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        dtInput.value = isoStr;
                    }
                } else {
                    reminderContainer.classList.add('hidden');
                }
            };
        }

        // Botón CTA de Nueva Nota
        document.getElementById('add-note-btn')?.addEventListener('click', () => {
            openAddModal();
        });
        document.getElementById('empty-add-note-btn')?.addEventListener('click', () => {
            openAddModal();
        });

        // Botones de cierre del modal
        document.getElementById('close-note-modal')?.addEventListener('click', () => closeModal());
        document.getElementById('cancel-note-btn')?.addEventListener('click', () => closeModal());
        document.getElementById('note-modal-backdrop')?.addEventListener('click', () => closeModal());
    }

    function openAddModal() {
        window.HapticsModule?.light();
        editingNoteId = null;
        document.getElementById('note-modal-title').textContent = 'Nueva Nota Rápida';
        const form = document.getElementById('note-form');
        if (form) form.reset();

        const reminderCheckbox = document.getElementById('note-has-reminder');
        const reminderContainer = document.getElementById('note-reminder-datetime-container');
        if (reminderCheckbox) reminderCheckbox.checked = false;
        if (reminderContainer) reminderContainer.classList.add('hidden');

        // Seleccionar tipo por defecto
        const typeSelect = document.getElementById('note-type');
        if (typeSelect) typeSelect.value = 'apunte';

        openModal();
    }

    function openEditModal(id) {
        window.HapticsModule?.light();
        const Storage = window.StorageModule;
        const notes = Storage.getNotes();
        const note = notes.find(n => n.id === id);
        if (!note) return;

        editingNoteId = id;
        document.getElementById('note-modal-title').textContent = 'Editar Nota';
        document.getElementById('note-title').value = note.title;
        document.getElementById('note-content').value = note.content || '';
        document.getElementById('note-type').value = note.type || 'apunte';

        const reminderCheckbox = document.getElementById('note-has-reminder');
        const reminderContainer = document.getElementById('note-reminder-datetime-container');
        const reminderInput = document.getElementById('note-reminder-datetime');

        if (reminderCheckbox) {
            reminderCheckbox.checked = Boolean(note.hasReminder);
        }
        if (reminderContainer) {
            if (note.hasReminder) {
                reminderContainer.classList.remove('hidden');
                if (reminderInput) reminderInput.value = note.reminderDateTime || '';
            } else {
                reminderContainer.classList.add('hidden');
                if (reminderInput) reminderInput.value = '';
            }
        }

        openModal();
    }

    function openModal() {
        const modal = document.getElementById('note-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
            requestAnimationFrame(() => {
                modal.classList.add('active');
            });
            setTimeout(() => {
                document.getElementById('note-title')?.focus();
            }, 120);
        }
    }

    function closeModal() {
        window.HapticsModule?.light();
        const modal = document.getElementById('note-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.classList.remove('overflow-hidden');
            }, 200);
        }
        editingNoteId = null;
    }

    function handleFormSubmit() {
        const titleInput = document.getElementById('note-title');
        const contentInput = document.getElementById('note-content');
        const typeSelect = document.getElementById('note-type');
        const reminderCheckbox = document.getElementById('note-has-reminder');
        const reminderDatetimeInput = document.getElementById('note-reminder-datetime');

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const type = typeSelect.value;
        const hasReminder = Boolean(reminderCheckbox?.checked);
        const reminderDateTime = hasReminder ? reminderDatetimeInput.value : '';

        if (!title) {
            window.showNotification?.('Por favor ingresa un título para la nota.', 'warning');
            return;
        }

        if (hasReminder && !reminderDateTime) {
            window.showNotification?.('Por favor selecciona la fecha y hora para el recordatorio.', 'warning');
            return;
        }

        const Storage = window.StorageModule;

        if (editingNoteId) {
            const updated = Storage.updateNote(editingNoteId, {
                title,
                content,
                type,
                hasReminder,
                reminderDateTime
            });
            if (updated) {
                if (hasReminder) {
                    window.NotificationsModule?.scheduleNote(updated);
                } else {
                    window.NotificationsModule?.cancelNote(editingNoteId);
                }
                window.showNotification?.('Nota actualizada correctamente.', 'success');
            }
        } else {
            const newNote = Storage.addNote({
                title,
                content,
                type,
                hasReminder,
                reminderDateTime
            });
            if (hasReminder) {
                window.NotificationsModule?.scheduleNote(newNote);
            }
            window.showNotification?.('Nota guardada correctamente.', 'success');
        }

        window.HapticsModule?.double();
        closeModal();
        window.onDataChanged?.();
        render();
    }

    function deleteNote(id) {
        if (!confirm('¿Estás seguro de eliminar esta nota?')) return;

        window.HapticsModule?.double();
        window.NotificationsModule?.cancelNote(id);
        const Storage = window.StorageModule;
        Storage.deleteNote(id);
        window.showNotification?.('Nota eliminada.', 'info');
        window.onDataChanged?.();
        render();
    }

    function copyNoteContent(content) {
        if (!content) return;
        window.HapticsModule?.light();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(content)
                .then(() => window.showNotification?.('Contenido copiado al portapapeles.', 'success'))
                .catch(() => window.showNotification?.('No se pudo copiar.', 'warning'));
        }
    }

    function render() {
        const Storage = window.StorageModule;
        const container = document.getElementById('notes-grid');
        const emptyState = document.getElementById('notes-empty-state');
        const countBadge = document.getElementById('notes-count-badge');
        const drawerCount = document.getElementById('drawer-note-count');
        const navCount = document.getElementById('nav-note-count');

        if (!container || !Storage) return;

        let notes = Storage.getNotes();

        // Actualizar contadores globales
        if (countBadge) countBadge.textContent = notes.length;
        if (drawerCount) drawerCount.textContent = notes.length;
        if (navCount) navCount.textContent = notes.length;

        // Filtrado por categoría
        if (currentFilter !== 'all') {
            notes = notes.filter(n => n.type === currentFilter);
        }

        // Búsqueda en vivo
        if (searchQuery) {
            notes = notes.filter(n =>
                (n.title && n.title.toLowerCase().includes(searchQuery)) ||
                (n.content && n.content.toLowerCase().includes(searchQuery))
            );
        }

        if (notes.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        container.innerHTML = notes.map((note, index) => {
            const typeInfo = NOTE_TYPES[note.type] || NOTE_TYPES.apunte;
            const dateFormatted = new Date(note.createdAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short'
            });

            // Formatear recordatorio si existe
            let reminderBadge = '';
            if (note.hasReminder && note.reminderDateTime) {
                const remDate = new Date(note.reminderDateTime);
                const remStr = !isNaN(remDate.getTime())
                    ? remDate.toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : note.reminderDateTime.replace('T', ' ');
                reminderBadge = `
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>${remStr}</span>
                    </div>
                `;
            }

            return `
                <div class="stagger-card bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs card-hover flex flex-col justify-between"
                     style="--stagger-i: ${index};">
                    <div>
                        <!-- Fila superior: Categoría y Acciones -->
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <span class="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.8 rounded-full ${typeInfo.badgeClass}">
                                <span>${typeInfo.emoji}</span>
                                <span>${typeInfo.label}</span>
                            </span>
                            
                            <div class="flex items-center gap-1">
                                <!-- Botón Copiar -->
                                ${note.content ? `
                                    <button type="button" data-note-copy="${note.id}"
                                        class="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 tap-effect"
                                        title="Copiar texto">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                        </svg>
                                    </button>
                                ` : ''}
                                <!-- Botón Editar -->
                                <button type="button" data-note-edit="${note.id}"
                                    class="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 tap-effect"
                                    title="Editar nota">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                    </svg>
                                </button>
                                <!-- Botón Eliminar -->
                                <button type="button" data-note-delete="${note.id}"
                                    class="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 tap-effect"
                                    title="Eliminar nota">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Título de la nota -->
                        <h3 class="text-base font-bold text-slate-900 dark:text-white leading-snug mb-2">
                            ${escapeHtml(note.title)}
                        </h3>

                        <!-- Contenido -->
                        ${note.content ? `
                            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed mb-4 line-clamp-6">
                                ${escapeHtml(note.content)}
                            </p>
                        ` : ''}
                    </div>

                    <!-- Fila inferior: Recordatorio & Fecha -->
                    <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        ${reminderBadge ? reminderBadge : '<span></span>'}
                        <span class="font-mono">${dateFormatted}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Listeners para acciones en tarjetas
        container.querySelectorAll('[data-note-edit]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                openEditModal(btn.dataset.noteEdit);
            };
        });

        container.querySelectorAll('[data-note-delete]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                deleteNote(btn.dataset.noteDelete);
            };
        });

        container.querySelectorAll('[data-note-copy]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const note = notes.find(n => n.id === btn.dataset.noteCopy);
                if (note) copyNoteContent(note.content || note.title);
            };
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
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
        deleteNote
    };
})();
