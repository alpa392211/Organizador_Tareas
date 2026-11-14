/**
 * Módulo de Notas Rápidas
 * Gestiona la creación, edición, filtrado por categorías, recordatorios y renderizado.
 * Clave de persistencia: agenda_cch_notes
 */

window.NotesModule = (() => {
    let currentFilter = 'all'; // 'all' | 'idea' | 'apunte' | 'pendiente' | 'importante' | 'personal'
    let searchQuery = '';
    let editingNoteId = null;
    let pendingUnlockId = null;
    const unlockedNotes = new Set(); // Sesión en memoria: se vuelve a bloquear al recargar

    function hashPin(pin) {
        let h = 5381;
        const str = 'org|' + String(pin);
        for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
        return 'h1:' + h.toString(16);
    }

    function pinMatches(note, pin) {
        if (!note || !note.hasPassword || pin === undefined || pin === null || String(pin) === '') return false;
        const stored = String(note.passwordHash || '');
        if (!stored) return false;
        return String(pin) === stored || hashPin(pin) === stored;
    }

    function isNoteUnlocked(id) {
        return unlockedNotes.has(String(id));
    }

    function isLocked(note) {
        return Boolean(note && note.hasPassword && !unlockedNotes.has(String(note.id)));
    }

    function unlockNote(id, pin) {
        const note = window.StorageModule.getNotes().find(n => String(n.id) === String(id));
        if (!note || !note.hasPassword) return false;
        if (!pinMatches(note, pin)) return false;
        unlockedNotes.add(String(note.id));
        render();
        return true;
    }

    function showOverlay(id, show) {
        const el = document.getElementById(id);
        if (!el) return;
        if (show) {
            el.classList.remove('hidden');
            el.style.display = 'flex';
        } else {
            el.classList.add('hidden');
            el.style.display = '';
        }
    }

    function openUnlockModal(id) {
        pendingUnlockId = id;
        const input = document.getElementById('note-unlock-input');
        if (input) input.value = '';
        document.getElementById('note-unlock-error')?.classList.add('hidden');
        showOverlay('note-unlock-modal', true);
        setTimeout(() => input?.focus(), 80);
    }

    function closeUnlockModal() {
        pendingUnlockId = null;
        showOverlay('note-unlock-modal', false);
    }

    function submitUnlock() {
        const input = document.getElementById('note-unlock-input');
        const id = pendingUnlockId;
        if (id && unlockNote(id, input ? input.value : '')) {
            closeUnlockModal();
            window.HapticsModule?.double?.();
            return;
        }
        document.getElementById('note-unlock-error')?.classList.remove('hidden');
        const dlg = document.getElementById('note-unlock-dialog');
        if (dlg) {
            dlg.classList.remove('note-shake');
            void dlg.offsetWidth;
            dlg.classList.add('note-shake');
        }
        if (input) input.value = '';
    }

    // --- Galería de materiales ---
    function compressImage(file) {
        const MAX_DIM = 1600;
        const QUALITY = 0.88;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('read'));
            reader.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error('img'));
                img.onload = () => {
                    const maxSide = Math.max(img.width || 1, img.height || 1);
                    const ratio = Math.min(1, MAX_DIM / maxSide);
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(img.width * ratio));
                    canvas.height = Math.max(1, Math.round(img.height * ratio));
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
                    resolve(dataUrl);
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async function handlePhotoUpload(input) {
        const file = input.files && input.files[0];
        if (!file) return;
        try {
            const dataUrl = await compressImage(file);
            const saved = window.StorageModule.saveGalleryPhoto({
                name: file.name || 'Foto',
                dataUrl,
                createdAt: Date.now()
            });
            if (saved) {
                window.showNotification?.('Foto agregada a la galería.', 'success');
            } else {
                window.showNotification?.('Almacenamiento lleno (localStorage). Elimina fotos anteriores para liberar espacio.', 'warning');
            }
        } catch (e) {
            window.showNotification?.('No se pudo procesar la imagen.', 'warning');
        }
        input.value = '';
        renderGallery();
    }

    function openPhotoPreview(photo) {
        const img = document.getElementById('photo-preview-img');
        if (img) img.src = photo.dataUrl;
        const name = document.getElementById('photo-preview-name');
        if (name) name.textContent = photo.name || '';
        showOverlay('photo-preview-modal', true);
    }

    function closePhotoPreview() {
        showOverlay('photo-preview-modal', false);
        const img = document.getElementById('photo-preview-img');
        if (img) img.removeAttribute('src');
    }

    function renderGallery() {
        const grid = document.getElementById('notes-gallery-grid');
        if (!grid || !window.StorageModule) return;
        const photos = window.StorageModule.getGalleryPhotos();
        if (photos.length === 0) {
            grid.innerHTML = '<div class="col-span-2 text-center text-xs text-slate-500 dark:text-slate-400 py-6 px-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">Aún no hay fotos. Sube imágenes de tus materiales o apuntes.</div>';
            return;
        }
        grid.innerHTML = photos.map(p => `
            <div class="min-w-0">
                <div class="gallery-thumb" data-photo-id="${escapeHtml(p.id)}">
                    <img src="${escapeHtml(p.dataUrl)}" alt="${escapeHtml(p.name)}" loading="lazy">
                    <button type="button" class="gallery-del" data-photo-del="${escapeHtml(p.id)}" aria-label="Eliminar foto">✕</button>
                </div>
                <div class="gallery-name text-slate-500 dark:text-slate-400" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
            </div>`).join('');
        grid.querySelectorAll('[data-photo-id]').forEach(el => {
            const photo = photos.find(p => String(p.id) === el.dataset.photoId);
            el.addEventListener('click', (e) => {
                if (e.target.closest('[data-photo-del]')) return;
                if (photo) openPhotoPreview(photo);
            });
        });
        grid.querySelectorAll('[data-photo-del]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.StorageModule.deleteGalleryPhoto(btn.dataset.photoDel);
                renderGallery();
            });
        });
    }

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

        // Nota privada: mostrar/ocultar campo de PIN
        const pwToggle = document.getElementById('note-password-toggle');
        pwToggle?.addEventListener('change', () => {
            document.getElementById('note-password-container')?.classList.toggle('hidden', !pwToggle.checked);
        });

        // Desbloqueo de notas privadas
        document.getElementById('note-unlock-confirm')?.addEventListener('click', submitUnlock);
        document.getElementById('note-unlock-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); submitUnlock(); }
        });
        document.getElementById('note-unlock-cancel')?.addEventListener('click', closeUnlockModal);
        document.getElementById('note-unlock-backdrop')?.addEventListener('click', closeUnlockModal);

        // Galería
        document.getElementById('notes-photo-input')?.addEventListener('change', (e) => handlePhotoUpload(e.target));
        document.getElementById('photo-preview-close')?.addEventListener('click', closePhotoPreview);
        document.getElementById('photo-preview-backdrop')?.addEventListener('click', closePhotoPreview);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closePhotoPreview();
                closeUnlockModal();
            }
        });

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
        document.getElementById('note-password-container')?.classList.add('hidden');

        // Seleccionar tipo por defecto
        const typeSelect = document.getElementById('note-type');
        if (typeSelect) typeSelect.value = 'apunte';

        openModal();
    }

    function openEditModal(id) {
        window.HapticsModule?.light();
        const Storage = window.StorageModule;
        const notes = Storage.getNotes();
        const note = notes.find(n => String(n.id) === String(id));
        if (!note) return false;

        if (isLocked(note)) {
            openUnlockModal(id);
            return true;
        }

        editingNoteId = id;
        const pwToggle = document.getElementById('note-password-toggle');
        const pwContainer = document.getElementById('note-password-container');
        const pwInput = document.getElementById('note-password-input');
        if (pwToggle) pwToggle.checked = Boolean(note.hasPassword);
        if (pwContainer) pwContainer.classList.toggle('hidden', !note.hasPassword);
        if (pwInput) pwInput.value = '';
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
        return false;
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

        // Privacidad por PIN
        const wantsPassword = Boolean(document.getElementById('note-password-toggle')?.checked);
        const pinValue = (document.getElementById('note-password-input')?.value || '').trim();
        const existing = editingNoteId ? Storage.getNotes().find(n => String(n.id) === String(editingNoteId)) : null;
        let hasPassword = false;
        let passwordHash = '';
        if (wantsPassword) {
            if (pinValue) {
                if (pinValue.length < 4) {
                    window.showNotification?.('El PIN debe tener al menos 4 caracteres.', 'warning');
                    return;
                }
                hasPassword = true;
                passwordHash = hashPin(pinValue);
            } else if (existing && existing.hasPassword) {
                hasPassword = true;
                passwordHash = existing.passwordHash || '';
            } else {
                window.showNotification?.('Escribe un PIN para proteger la nota.', 'warning');
                return;
            }
        }

        if (editingNoteId) {
            const updated = Storage.updateNote(editingNoteId, {
                title,
                content,
                type,
                hasReminder,
                reminderDateTime,
                hasPassword,
                passwordHash
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
                reminderDateTime,
                hasPassword,
                passwordHash
            });
            if (hasPassword) unlockedNotes.add(String(newNote.id));
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

    function archiveNote(id) {
        window.HapticsModule?.medium();
        window.NotificationsModule?.cancelNote(id);
        const Storage = window.StorageModule;
        const archived = Storage.archiveNote(id);
        if (archived) {
            window.showNotification?.('Nota archivada en el baúl.', 'info');
            window.onDataChanged?.();
            render();
            window.ArchiveModule?.render?.();
        }
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

        renderGallery();
        const longPress = typeof Storage.isLongPressEnabled === 'function' ? Storage.isLongPressEnabled() : true;

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
                !isLocked(n) && (
                    (n.title && n.title.toLowerCase().includes(searchQuery)) ||
                    (n.content && n.content.toLowerCase().includes(searchQuery))
                )
            );
        }

        if (notes.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        container.innerHTML = notes.map((note, index) => {
            if (isLocked(note)) {
                return `
                <div data-note-id="${escapeHtml(note.id)}" class="note-card-locked stagger-card bg-white dark:bg-slate-800 rounded-3xl p-5 border border-dashed border-purple-300 dark:border-purple-800 shadow-xs card-hover flex flex-col items-center justify-center text-center gap-2 min-h-[120px]"
                     style="--stagger-i: ${index};">
                    <span class="text-3xl">🔒</span>
                    <span class="text-sm font-bold text-slate-800 dark:text-white">Nota Privada</span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">Haz clic para desbloquear</span>
                </div>`;
            }
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
                <div data-note-id="${escapeHtml(note.id)}" class="stagger-card bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs card-hover flex flex-col justify-between"
                     style="--stagger-i: ${index};">
                    <div>
                        <!-- Fila superior: Categoría y Acciones -->
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <span class="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.8 rounded-full ${typeInfo.badgeClass}">
                                <span>${typeInfo.emoji}</span>
                                <span>${typeInfo.label}</span>
                            </span>
                            
                            <div class="flex items-center gap-1">
                                ${longPress ? '' : `
                                <button type="button" data-action="edit" data-note-edit="${note.id}" class="px-2 py-1 rounded-xl text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-slate-700 dark:text-indigo-300 tap-effect">✏️ Editar</button>
                                <button type="button" data-action="delete" data-note-delete="${note.id}" class="px-2 py-1 rounded-xl text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 tap-effect">🗑️ Eliminar</button>`}
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
                                <!-- Botón Archivar -->
                                <button type="button" data-note-archive="${note.id}"
                                    class="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 tap-effect"
                                    title="Archivar en el baúl">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
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

        // Vincular menú contextual por pulsación prolongada y listeners en cada tarjeta de nota
        const cards = container.querySelectorAll('[data-note-id]');
        cards.forEach((card, i) => {
            const note = notes[i];
            if (!note) return;

            if (isLocked(note)) {
                card.addEventListener('click', () => openUnlockModal(note.id));
                return;
            }

            if (longPress) {
                window.CardContextMenu?.bind?.(card, {
                    title: note.title || 'Nota',
                    onEdit: () => openEditModal(note.id),
                    onDelete: () => deleteNote(note.id)
                });
            }
            card.querySelector('[data-note-edit]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(note.id);
            });
            card.querySelector('[data-note-delete]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteNote(note.id);
            });

            card.querySelector('[data-note-archive]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                archiveNote(note.id);
            });

            card.querySelector('[data-note-copy]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                copyNoteContent(note.content || note.title);
            });
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
        deleteNote,
        unlockNote,
        isNoteUnlocked,
        renderGallery
    };
})();
