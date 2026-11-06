/**
 * Módulo de Baúl de Archivados (Tareas y Notas)
 * Gestiona la visualización, restauración, depuración de 60 días
 * y eliminación permanente de elementos archivados.
 */

window.ArchiveModule = (() => {
    let currentFilter = 'all'; // 'all', 'tasks', 'notes'
    let searchQuery = '';

    function init() {
        setupEventListeners();
        render();
    }

    function setupEventListeners() {
        // Filtros por pestaña
        const filterBtns = document.querySelectorAll('[data-archive-filter]');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                window.HapticsModule?.light();
                filterBtns.forEach(b => {
                    b.classList.remove('bg-indigo-600', 'text-white', 'shadow-xs');
                    b.classList.add('bg-slate-100', 'dark:bg-slate-700/60', 'text-slate-600', 'dark:text-slate-300');
                });
                btn.classList.add('bg-indigo-600', 'text-white', 'shadow-xs');
                btn.classList.remove('bg-slate-100', 'dark:bg-slate-700/60', 'text-slate-600', 'dark:text-slate-300');
                currentFilter = btn.dataset.archiveFilter;
                render();
            });
        });

        // Búsqueda en vivo
        const searchInput = document.getElementById('archive-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase().trim();
                render();
            });
        }

        // Botón vaciar todo el baúl
        const clearBtn = document.getElementById('archive-clear-all-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const Storage = window.StorageModule;
                const tasks = Storage.getArchivedTasks();
                const notes = Storage.getArchivedNotes();
                const total = tasks.length + notes.length;
                if (total === 0) return;

                if (confirm(`¿Vaciar por completo el baúl? Se eliminarán definitivamente ${total} elementos archivados.`)) {
                    window.HapticsModule?.double();
                    Storage.saveArchivedTasks([]);
                    Storage.saveArchivedNotes([]);
                    window.showNotification?.('Baúl de archivados vaciado por completo.', 'info');
                    render();
                    window.onDataChanged?.();
                }
            });
        }
    }

    function calculateDaysRemaining(archivedAt) {
        if (!archivedAt) return 60;
        const elapsedDays = Math.floor((Date.now() - archivedAt) / (1000 * 60 * 60 * 24));
        return Math.max(0, 60 - elapsedDays);
    }

    const COBWEB_SVGS = [
        // Tipo 1: Esquina superior derecha clásica
        `<svg class="cobweb-corner-card pointer-events-none absolute top-0 right-0 w-12 h-12 text-slate-400/35 dark:text-slate-500/30 overflow-visible z-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="100" y1="0" x2="0" y2="0"/><line x1="100" y1="0" x2="100" y2="100"/><line x1="100" y1="0" x2="0" y2="100"/><line x1="100" y1="0" x2="35" y2="100"/><line x1="100" y1="0" x2="0" y2="50"/><path d="M75 0 Q75 25 100 25"/><path d="M50 0 Q50 50 100 50"/><path d="M25 0 Q25 75 100 75"/><path d="M0 0 Q0 100 100 100"/></svg>`,
        // Tipo 2: Esquina superior izquierda colgante
        `<svg class="cobweb-corner-card pointer-events-none absolute top-0 left-0 w-12 h-12 text-slate-400/35 dark:text-slate-500/30 overflow-visible z-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="0" y1="0" x2="100" y2="0"/><line x1="0" y1="0" x2="0" y2="100"/><line x1="0" y1="0" x2="80" y2="80"/><line x1="0" y1="0" x2="40" y2="90"/><line x1="0" y1="0" x2="90" y2="40"/><path d="M25 0 Q25 25 0 25"/><path d="M55 0 Q55 55 0 55"/><path d="M85 0 Q85 85 0 85"/><circle cx="80" cy="80" r="3" fill="currentColor"/></svg>`,
        // Tipo 3: Esquina superior derecha densa radial
        `<svg class="cobweb-corner-card pointer-events-none absolute top-0 right-0 w-14 h-14 text-slate-400/35 dark:text-slate-500/30 overflow-visible z-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><path d="M100,0 L0,0 M100,0 L100,100 M100,0 L20,80 M100,0 L60,100 M100,0 L0,40 M100,0 L40,40"/><path d="M80,0 C80,15 85,20 100,20"/><path d="M60,0 C60,30 70,40 100,40"/><path d="M40,0 C40,45 55,60 100,60"/><path d="M20,0 C20,60 40,80 100,80"/><path d="M0,0 C0,75 25,100 100,100"/></svg>`,
        // Tipo 4: Esquina superior derecha con hebras asimétricas
        `<svg class="cobweb-corner-card pointer-events-none absolute top-0 right-0 w-13 h-13 text-slate-400/35 dark:text-slate-500/30 overflow-visible z-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.3"><line x1="100" y1="0" x2="0" y2="0"/><line x1="100" y1="0" x2="100" y2="100"/><line x1="100" y1="0" x2="15" y2="85"/><line x1="100" y1="0" x2="70" y2="95"/><path d="M85,0 Q88,20 100,15"/><path d="M65,0 Q70,35 100,35"/><path d="M45,0 Q50,55 100,55"/><path d="M25,0 Q30,75 100,75"/><path d="M70,95 Q72,110 70,120" stroke-dasharray="3,3"/></svg>`
    ];

    function getRandomCobweb(id) {
        let hash = 0;
        const str = String(id || 'archive_item');
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        const index = Math.abs(hash) % COBWEB_SVGS.length;
        return COBWEB_SVGS[index];
    }

    function render() {
        const Storage = window.StorageModule;
        if (!Storage) return;

        // Ejecutar purga automática si está habilitada
        Storage.runArchivePurge?.();

        const container = document.getElementById('archive-items-grid');
        const emptyState = document.getElementById('archive-empty-state');
        const countBadge = document.getElementById('archive-count-badge');
        const purgeInfoPill = document.getElementById('archive-purge-info-pill');
        const drawerArchiveCount = document.getElementById('drawer-archive-count');

        const tasks = Storage.getArchivedTasks();
        const notes = Storage.getArchivedNotes();
        const subjects = Storage.getSubjects();
        const subjectMap = new Map(subjects.map(s => [s.id, s]));

        const autoPurge = Storage.getAutoPurgeArchive();

        if (drawerArchiveCount) {
            drawerArchiveCount.textContent = tasks.length + notes.length;
        }

        if (purgeInfoPill) {
            if (autoPurge) {
                purgeInfoPill.innerHTML = `<span>⏳</span><span>Depuración automática activa (Plazo de 60 días)</span>`;
                purgeInfoPill.className = 'text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5';
            } else {
                purgeInfoPill.innerHTML = `<span>♾️</span><span>Conservación permanente (Sin depuración)</span>`;
                purgeInfoPill.className = 'text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5';
            }
        }

        // Armar lista combinada normalizada
        let combined = [];

        if (currentFilter === 'all' || currentFilter === 'tasks') {
            tasks.forEach(t => {
                combined.push({
                    itemType: 'task',
                    id: t.id,
                    title: t.title,
                    content: t.notes || '',
                    dueDate: t.dueDate || '',
                    priority: t.priority || 'media',
                    completed: t.completed,
                    subject: subjectMap.get(t.subjectId) || null,
                    archivedAt: t.archivedAt || Date.now()
                });
            });
        }

        if (currentFilter === 'all' || currentFilter === 'notes') {
            notes.forEach(n => {
                combined.push({
                    itemType: 'note',
                    id: n.id,
                    title: n.title,
                    content: n.content || '',
                    noteType: n.type || 'apunte',
                    archivedAt: n.archivedAt || Date.now()
                });
            });
        }

        // Filtrar por búsqueda
        if (searchQuery) {
            combined = combined.filter(item =>
                (item.title && item.title.toLowerCase().includes(searchQuery)) ||
                (item.content && item.content.toLowerCase().includes(searchQuery))
            );
        }

        // Ordenar por archivado más reciente primero
        combined.sort((a, b) => b.archivedAt - a.archivedAt);

        if (countBadge) {
            countBadge.textContent = `${combined.length} elementos`;
        }

        if (!container) return;

        if (combined.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        container.innerHTML = combined.map((item, index) => {
            const daysLeft = calculateDaysRemaining(item.archivedAt);
            const daysElapsed = Math.floor((Date.now() - item.archivedAt) / (1000 * 60 * 60 * 24));
            const elapsedText = daysElapsed === 0 ? 'Hoy' : `Hace ${daysElapsed} día${daysElapsed > 1 ? 's' : ''}`;
            const cobwebSvg = getRandomCobweb(item.id);

            const purgeBadge = autoPurge
                ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    daysLeft <= 7
                        ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }">⏳ ${daysLeft} días restantes</span>`
                : '';

            if (item.itemType === 'task') {
                const subColor = item.subject ? item.subject.color : '#6366F1';
                const subName = item.subject ? item.subject.name : 'Materia general';
                return `
                    <div class="stagger-card relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col justify-between"
                         style="--stagger-i: ${index};">
                        ${cobwebSvg}
                        <div class="relative z-10">
                            <div class="flex items-center justify-between gap-2 mb-2">
                                <span class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
                                      style="background-color: ${subColor};">
                                    <span>📚</span>
                                    <span class="truncate max-w-[130px]">${escapeHtml(subName)}</span>
                                </span>
                                <div class="flex items-center gap-1">
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                        Tarea
                                    </span>
                                    ${purgeBadge}
                                </div>
                            </div>

                            <h3 class="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-1">
                                ${escapeHtml(item.title)}
                            </h3>

                            ${item.content ? `
                                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                                    ${escapeHtml(item.content)}
                                </p>
                            ` : ''}
                        </div>

                        <div class="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2 mt-2">
                            <span class="text-[11px] text-slate-400 font-mono">
                                Archivada ${elapsedText}
                            </span>
                            <div class="flex items-center gap-1.5">
                                <button type="button" data-unarchive-task="${item.id}"
                                    class="tap-effect px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold transition-colors"
                                    title="Restaurar a tareas activas">
                                    Restaurar
                                </button>
                                <button type="button" data-delete-task-perm="${item.id}"
                                    class="tap-effect p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                                    title="Eliminar definitivamente">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="stagger-card relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col justify-between"
                         style="--stagger-i: ${index};">
                        ${cobwebSvg}
                        <div class="relative z-10">
                            <div class="flex items-center justify-between gap-2 mb-2">
                                <span class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    <span>📝</span>
                                    <span class="capitalize">Nota: ${item.noteType}</span>
                                </span>
                                <div class="flex items-center gap-1">
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                        Nota
                                    </span>
                                    ${purgeBadge}
                                </div>
                            </div>

                            <h3 class="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-1">
                                ${escapeHtml(item.title)}
                            </h3>

                            ${item.content ? `
                                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-3 whitespace-pre-line">
                                    ${escapeHtml(item.content)}
                                </p>
                            ` : ''}
                        </div>

                        <div class="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2 mt-2">
                            <span class="text-[11px] text-slate-400 font-mono">
                                Archivada ${elapsedText}
                            </span>
                            <div class="flex items-center gap-1.5">
                                <button type="button" data-unarchive-note="${item.id}"
                                    class="tap-effect px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold transition-colors"
                                    title="Restaurar a notas activas">
                                    Restaurar
                                </button>
                                <button type="button" data-delete-note-perm="${item.id}"
                                    class="tap-effect p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                                    title="Eliminar definitivamente">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');

        // Listeners para acciones en tarjetas
        container.querySelectorAll('[data-unarchive-task]').forEach(btn => {
            btn.onclick = () => {
                window.HapticsModule?.light();
                const id = btn.dataset.unarchiveTask;
                const restored = Storage.unarchiveTask(id);
                if (restored) {
                    window.showNotification?.(`Tarea "${restored.title}" restaurada a pendientes.`, 'success');
                    render();
                    window.TasksModule?.render?.();
                    window.onDataChanged?.();
                }
            };
        });

        container.querySelectorAll('[data-delete-task-perm]').forEach(btn => {
            btn.onclick = () => {
                if (confirm('¿Eliminar definitivamente esta tarea archivada?')) {
                    window.HapticsModule?.double();
                    Storage.deleteArchivedTask(btn.dataset.deleteTaskPerm);
                    window.showNotification?.('Tarea eliminada permanentemente.', 'info');
                    render();
                    window.onDataChanged?.();
                }
            };
        });

        container.querySelectorAll('[data-unarchive-note]').forEach(btn => {
            btn.onclick = () => {
                window.HapticsModule?.light();
                const id = btn.dataset.unarchiveNote;
                const restored = Storage.unarchiveNote(id);
                if (restored) {
                    window.showNotification?.(`Nota "${restored.title}" restaurada a notas activas.`, 'success');
                    render();
                    window.NotesModule?.render?.();
                    window.onDataChanged?.();
                }
            };
        });

        container.querySelectorAll('[data-delete-note-perm]').forEach(btn => {
            btn.onclick = () => {
                if (confirm('¿Eliminar definitivamente esta nota archivada?')) {
                    window.HapticsModule?.double();
                    Storage.deleteArchivedNote(btn.dataset.deleteNotePerm);
                    window.showNotification?.('Nota eliminada permanentemente.', 'info');
                    render();
                    window.onDataChanged?.();
                }
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
        render
    };
})();
