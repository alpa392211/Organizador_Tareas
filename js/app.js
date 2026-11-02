/**
 * Aplicación Principal - Orquestador
 * Integra UI, navegación por Drawer, selector institucional con escudos oficiales,
 * selector dinámico de periodos/semestres, ciclo escolar obligatorio y vistas.
 */

(() => {
    class App {
        constructor() {
            this.currentView = 'subjects'; // 'subjects' | 'tasks' | 'settings'
            this.activeInstitution = null;
        }

        init() {
            const Storage = window.StorageModule;
            const InstitutionsModule = window.InstitutionsModule;
            const SubjectsModule = window.SubjectsModule;
            const TasksModule = window.TasksModule;
            const CalendarModule = window.CalendarModule;

            // Inicialización limpia en localStorage
            Storage.initIfFirstTime();

            // Inicializar y aplicar modo oscuro / claro
            this.initTheme();

            // Cargar institución y periodo activo
            const instId = Storage.getInstitution();
            this.setInstitution(instId);

            // Inicializar módulos
            SubjectsModule.init();
            TasksModule.init();
            CalendarModule.init();

            // Configurar navegación, menús y eventos globales
            this.setupNavigation();
            this.setupSidebarDrawer();
            this.setupInstitutionAndPeriodSelectors();
            this.setupModalsAndShortcuts();
            this.setupSettingsView();

            // Exponer funciones globales para interacción fluida entre módulos
            window.onDataChanged = () => this.refreshAll();
            window.showNotification = (msg, type) => this.showToast(msg, type);
            window.navigateToSubjects = () => this.switchView('subjects');
            window.navigateToTasksWithSubject = (subjectId) => {
                this.switchView('tasks');
                TasksModule.subjectFilter = subjectId;
                const select = document.getElementById('task-subject-filter');
                if (select) select.value = subjectId;
                TasksModule.render();
            };

            // Renderizado inicial
            this.refreshAll();
        }

        refreshAll() {
            window.SubjectsModule.render();
            window.TasksModule.render();
            this.updateHeaderStats();
            this.updateCycleBadges();
        }

        updateHeaderStats() {
            const Storage = window.StorageModule;
            const subjects = Storage.getSubjects();
            const tasks = Storage.getTasks();
            const pendingTasks = tasks.filter(t => !t.completed).length;

            const drawerSubCount = document.getElementById('drawer-sub-count');
            const drawerTaskCount = document.getElementById('drawer-task-count');
            const navSubCount = document.getElementById('nav-sub-count');
            const navTaskCount = document.getElementById('nav-task-count');

            if (drawerSubCount) drawerSubCount.textContent = subjects.length;
            if (drawerTaskCount) drawerTaskCount.textContent = pendingTasks;
            if (navSubCount) navSubCount.textContent = subjects.length;
            if (navTaskCount) navTaskCount.textContent = pendingTasks;
        }

        updateCycleBadges() {
            const Storage = window.StorageModule;
            const cycle = Storage.getAcademicCycle();
            const headerCycleBadge = document.getElementById('header-cycle-badge');
            const drawerCycleText = document.getElementById('drawer-cycle-text');
            const settingsCycleStatus = document.getElementById('settings-cycle-status-pill');

            if (cycle && cycle.startDate && cycle.endDate) {
                const label = `Ciclo: ${cycle.startDate} al ${cycle.endDate}`;
                if (headerCycleBadge) headerCycleBadge.textContent = label;
                if (drawerCycleText) drawerCycleText.textContent = `📅 ${cycle.startDate} - ${cycle.endDate}`;
                if (settingsCycleStatus) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isCurrent = todayStr >= cycle.startDate && todayStr <= cycle.endDate;
                    settingsCycleStatus.textContent = isCurrent ? 'Ciclo Vigente' : 'Programado';
                    settingsCycleStatus.className = isCurrent 
                        ? 'text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white'
                        : 'text-xs font-bold px-2.5 py-1 rounded-full bg-amber-600 text-white';
                }
            }
        }

        initTheme() {
            const Storage = window.StorageModule;
            const savedTheme = Storage.getTheme(); // 'light' | 'dark' | null

            if (savedTheme === 'dark' || savedTheme === 'light') {
                this.applyTheme(savedTheme, false);
            } else {
                // Detección automática según preferencia del sistema operativo
                const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.applyTheme(systemPrefersDark ? 'dark' : 'light', false);
            }

            // Escuchar cambios automáticos del sistema si el usuario no ha fijado una preferencia manual
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                    const currentSaved = Storage.getTheme();
                    if (!currentSaved) {
                        this.applyTheme(e.matches ? 'dark' : 'light', false);
                    }
                });
            }

            // Botones de cambio rápido (Header y Sidebar/Drawer)
            const headerToggleBtn = document.getElementById('theme-toggle-btn');
            const drawerToggleBtn = document.getElementById('drawer-theme-toggle-btn');

            if (headerToggleBtn) {
                headerToggleBtn.onclick = () => this.toggleTheme();
            }
            if (drawerToggleBtn) {
                drawerToggleBtn.onclick = () => this.toggleTheme();
            }
        }

        applyTheme(theme, save = true) {
            const Storage = window.StorageModule;
            const isDark = theme === 'dark';

            // Alternar clase dark en la etiqueta raíz <html> para Tailwind
            document.documentElement.classList.toggle('dark', isDark);

            if (save) {
                Storage.setTheme(theme);
            }

            this.updateThemeUI(theme, !Storage.getTheme());
        }

        setTheme(themeMode) {
            const Storage = window.StorageModule;
            if (themeMode === 'auto') {
                Storage.setTheme(null);
                const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.applyTheme(systemPrefersDark ? 'dark' : 'light', false);
                this.showToast('Tema ajustado automáticamente según tu sistema.', 'info');
            } else {
                this.applyTheme(themeMode, true);
                this.showToast(`Modo ${themeMode === 'dark' ? 'Oscuro' : 'Claro'} activado.`, 'success');
            }
        }

        toggleTheme() {
            const isCurrentlyDark = document.documentElement.classList.contains('dark');
            const newTheme = isCurrentlyDark ? 'light' : 'dark';
            this.setTheme(newTheme);
        }

        updateThemeUI(activeTheme, isAuto = false) {
            const isDark = activeTheme === 'dark';

            // Actualizar textos y badges del Drawer
            const drawerText = document.getElementById('drawer-theme-text');
            const drawerPill = document.getElementById('drawer-theme-pill');
            if (drawerText) {
                drawerText.textContent = isDark ? 'Modo Oscuro (Activo)' : 'Modo Claro (Activo)';
            }
            if (drawerPill) {
                drawerPill.textContent = isDark ? '🌙 Oscuro' : '☀️ Claro';
                drawerPill.className = isDark
                    ? 'text-xs font-bold px-2.5 py-1 rounded-full bg-slate-700 text-amber-400'
                    : 'text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700';
            }

            // Actualizar botones y selector de Configuración
            const pill = document.getElementById('settings-theme-pill');
            if (pill) {
                if (isAuto) {
                    pill.textContent = `💻 Sistema (${isDark ? 'Oscuro' : 'Claro'})`;
                } else {
                    pill.textContent = isDark ? '🌙 Modo Oscuro' : '☀️ Modo Claro';
                }
            }

            const lightBtn = document.getElementById('settings-theme-light');
            const darkBtn = document.getElementById('settings-theme-dark');
            const autoBtn = document.getElementById('settings-theme-auto');

            const activeBtnClass = 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20';
            const inactiveBtnClass = 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700';

            const updateBtn = (btn, isActive) => {
                if (!btn) return;
                if (isActive) {
                    btn.className = `tap-effect p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeBtnClass}`;
                } else {
                    btn.className = `tap-effect p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${inactiveBtnClass}`;
                }
            };

            updateBtn(lightBtn, !isAuto && !isDark);
            updateBtn(darkBtn, !isAuto && isDark);
            updateBtn(autoBtn, isAuto);
        }

        setInstitution(id) {
            const InstitutionsModule = window.InstitutionsModule;
            const Storage = window.StorageModule;
            const inst = InstitutionsModule.getInstitution(id);
            this.activeInstitution = inst;
            Storage.setInstitution(id);

            // Renderizado de logotipos oficiales desde assets/ en marco blanco permanente
            const logoContainer = document.getElementById('header-inst-logo');
            const nameEl = document.getElementById('header-inst-name');
            const typeEl = document.getElementById('header-inst-type');
            const drawerLogo = document.getElementById('drawer-inst-logo');
            const drawerName = document.getElementById('drawer-inst-name');
            const drawerSlogan = document.getElementById('drawer-inst-slogan');

            if (logoContainer) logoContainer.innerHTML = InstitutionsModule.renderIconHtml(inst, 'w-10 h-10');
            if (nameEl) nameEl.textContent = inst.name;
            if (typeEl) typeEl.textContent = inst.systemType || inst.type;
            if (drawerLogo) drawerLogo.innerHTML = InstitutionsModule.renderIconHtml(inst, 'w-12 h-12');
            if (drawerName) drawerName.textContent = inst.name;
            if (drawerSlogan) drawerSlogan.textContent = `"${inst.slogan}"`;

            // Actualizar vista previa institucional en Configuración
            const settingsLogo = document.getElementById('settings-inst-logo-container');
            const settingsName = document.getElementById('settings-inst-name');
            const settingsFullName = document.getElementById('settings-inst-fullname');
            const settingsSlogan = document.getElementById('settings-inst-slogan');
            const settingsTypeBadge = document.getElementById('settings-inst-type-badge');

            if (settingsLogo) settingsLogo.innerHTML = InstitutionsModule.renderIconHtml(inst, 'w-14 h-14');
            if (settingsName) settingsName.textContent = inst.name;
            if (settingsFullName) settingsFullName.textContent = inst.fullName;
            if (settingsSlogan) settingsSlogan.textContent = `"${inst.slogan}"`;
            if (settingsTypeBadge) settingsTypeBadge.textContent = inst.systemType || inst.type;

            // Actualizar selectores institucionales
            const headerSelect = document.getElementById('header-institution-select');
            const settingsSelect = document.getElementById('settings-institution-select');
            if (headerSelect) headerSelect.value = id;
            if (settingsSelect) settingsSelect.value = id;

            // Actualizar selector dinámico de periodos
            this.updatePeriodSelectors(inst);

            // Re-renderizar o actualizar resaltado de la galería en Settings
            this.renderInstitutionGrid();

            document.documentElement.style.setProperty('--inst-primary', inst.colors.primary);
            this.updateCycleBadges();
        }

        renderInstitutionGrid() {
            const grid = document.getElementById('settings-institution-grid');
            if (!grid) return;

            const InstitutionsModule = window.InstitutionsModule;
            const institutions = Object.values(InstitutionsModule.INSTITUTIONS);
            const activeId = this.activeInstitution?.id || 'unam';

            grid.innerHTML = institutions.map(inst => {
                const isActive = inst.id === activeId;
                const activeClasses = isActive 
                    ? 'ring-2 ring-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 shadow-md scale-[1.02]'
                    : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200/80 dark:border-slate-700/70 hover:scale-[1.01]';

                return `
                    <button type="button" data-inst-id="${inst.id}"
                        class="inst-grid-card tap-effect flex flex-col items-center text-center p-3 rounded-2xl border transition-all ${activeClasses}"
                        title="Seleccionar ${inst.name}">
                        <!-- Escudo oficial en contenedor de marco blanco permanente -->
                        <div class="mb-2">
                            ${InstitutionsModule.renderIconHtml(inst, 'w-12 h-12', 'w-full h-full object-contain')}
                        </div>
                        <span class="text-xs font-black text-slate-900 dark:text-white truncate w-full">
                            ${inst.name}
                        </span>
                        <span class="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full mt-0.5 font-medium">
                            ${inst.systemType || inst.type}
                        </span>
                    </button>
                `;
            }).join('');

            // Agregar manejadores de eventos a cada tarjeta del selector
            grid.querySelectorAll('.inst-grid-card').forEach(card => {
                card.onclick = () => {
                    const instId = card.dataset.instId;
                    this.setInstitution(instId);
                    this.showToast(`Institución seleccionada: ${this.activeInstitution.name}`, 'success');
                };
            });
        }

        updatePeriodSelectors(inst) {
            const Storage = window.StorageModule;
            const currentPeriod = Storage.getAcademicPeriod();
            const headerPeriodSelect = document.getElementById('header-period-select');
            const settingsPeriodSelect = document.getElementById('settings-period-select');
            const headerPeriodLabel = document.getElementById('header-inst-period');
            const drawerPeriodLabel = document.getElementById('drawer-inst-period');
            const settingsPeriodBadge = document.getElementById('settings-inst-period-badge');

            const optionsHtml = inst.periods.map(p => `
                <option value="${p}">${p}</option>
            `).join('');

            if (headerPeriodSelect) {
                headerPeriodSelect.innerHTML = optionsHtml;
                headerPeriodSelect.value = inst.periods.includes(currentPeriod) ? currentPeriod : inst.defaultPeriod;
            }

            if (settingsPeriodSelect) {
                settingsPeriodSelect.innerHTML = optionsHtml;
                settingsPeriodSelect.value = inst.periods.includes(currentPeriod) ? currentPeriod : inst.defaultPeriod;
            }

            const activePeriod = inst.periods.includes(currentPeriod) ? currentPeriod : inst.defaultPeriod;
            Storage.setAcademicPeriod(activePeriod);

            if (headerPeriodLabel) headerPeriodLabel.textContent = activePeriod;
            if (drawerPeriodLabel) drawerPeriodLabel.textContent = activePeriod;
            if (settingsPeriodBadge) settingsPeriodBadge.textContent = activePeriod;
        }

        setAcademicPeriod(period) {
            const Storage = window.StorageModule;
            Storage.setAcademicPeriod(period);

            const headerPeriodSelect = document.getElementById('header-period-select');
            const settingsPeriodSelect = document.getElementById('settings-period-select');
            const headerPeriodLabel = document.getElementById('header-inst-period');
            const drawerPeriodLabel = document.getElementById('drawer-inst-period');

            if (headerPeriodSelect) headerPeriodSelect.value = period;
            if (settingsPeriodSelect) settingsPeriodSelect.value = period;
            if (headerPeriodLabel) headerPeriodLabel.textContent = period;
            if (drawerPeriodLabel) drawerPeriodLabel.textContent = period;

            this.showToast(`Periodo actualizado: ${period}`, 'info');
        }

        setupInstitutionAndPeriodSelectors() {
            const headerInstSelect = document.getElementById('header-institution-select');
            const headerPeriodSelect = document.getElementById('header-period-select');
            const InstitutionsModule = window.InstitutionsModule;

            if (headerInstSelect) {
                headerInstSelect.innerHTML = Object.values(InstitutionsModule.INSTITUTIONS).map(inst => `
                    <option value="${inst.id}">🎓 ${inst.name} - ${inst.systemType || inst.type}</option>
                `).join('');
                headerInstSelect.value = this.activeInstitution.id;
                headerInstSelect.onchange = (e) => {
                    this.setInstitution(e.target.value);
                    this.showToast(`Institución seleccionada: ${this.activeInstitution.name}`, 'info');
                };
            }

            if (headerPeriodSelect) {
                headerPeriodSelect.onchange = (e) => {
                    this.setAcademicPeriod(e.target.value);
                };
            }
        }

        setupNavigation() {
            const navButtons = document.querySelectorAll('[data-view-target]');
            navButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetView = btn.dataset.viewTarget;
                    this.switchView(targetView);
                    this.closeSidebarDrawer();
                });
            });

            // Permitir abrir configuración tocando el escudo en encabezado o drawer
            document.getElementById('header-inst-logo')?.addEventListener('click', () => {
                this.switchView('settings');
            });
            document.getElementById('drawer-inst-logo')?.addEventListener('click', () => {
                this.switchView('settings');
                this.closeSidebarDrawer();
            });
        }

        switchView(viewName) {
            this.currentView = viewName;

            const views = ['subjects', 'tasks', 'settings'];
            views.forEach(v => {
                const section = document.getElementById(`view-${v}`);
                if (section) {
                    if (v === viewName) {
                        section.classList.remove('hidden');
                        section.classList.add('animate-fadeIn');
                    } else {
                        section.classList.add('hidden');
                    }
                }
            });

            document.querySelectorAll('[data-view-target]').forEach(btn => {
                const isMatch = btn.dataset.viewTarget === viewName;
                if (btn.classList.contains('nav-link-btn')) {
                    if (isMatch) {
                        btn.classList.add('text-indigo-600', 'dark:text-indigo-400', 'bg-indigo-50', 'dark:bg-slate-700/60', 'font-bold');
                        btn.classList.remove('text-slate-600', 'dark:text-slate-400');
                    } else {
                        btn.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'bg-indigo-50', 'dark:bg-slate-700/60', 'font-bold');
                        btn.classList.add('text-slate-600', 'dark:text-slate-400');
                    }
                }
            });

            if (viewName === 'subjects') window.SubjectsModule.render();
            if (viewName === 'tasks') window.TasksModule.render();
        }

        setupSidebarDrawer() {
            const toggleBtn = document.getElementById('drawer-toggle-btn');
            const closeBtn = document.getElementById('drawer-close-btn');
            const drawer = document.getElementById('sidebar-drawer');
            const backdrop = document.getElementById('drawer-backdrop');

            const openDrawer = () => {
                if (!drawer || !backdrop) return;
                drawer.classList.remove('-translate-x-full');
                backdrop.classList.remove('opacity-0', 'pointer-events-none');
                backdrop.classList.add('opacity-100');
                document.body.classList.add('overflow-hidden');
            };

            const closeDrawer = () => {
                if (!drawer || !backdrop) return;
                drawer.classList.add('-translate-x-full');
                backdrop.classList.add('opacity-0', 'pointer-events-none');
                backdrop.classList.remove('opacity-100');
                document.body.classList.remove('overflow-hidden');
            };

            this.closeSidebarDrawer = closeDrawer;

            if (toggleBtn) toggleBtn.onclick = openDrawer;
            if (closeBtn) closeBtn.onclick = closeDrawer;
            if (backdrop) backdrop.onclick = closeDrawer;
        }

        setupModalsAndShortcuts() {
            const SubjectsModule = window.SubjectsModule;
            const TasksModule = window.TasksModule;
            const CalendarModule = window.CalendarModule;

            const addSubBtn = document.getElementById('add-subject-btn');
            const addSubEmptyBtn = document.getElementById('empty-add-subject-btn');
            const addTaskBtn = document.getElementById('add-task-btn');
            const addTaskEmptyBtn = document.getElementById('empty-add-task-btn');

            if (addSubBtn) addSubBtn.onclick = () => SubjectsModule.openAddModal();
            if (addSubEmptyBtn) addSubEmptyBtn.onclick = () => SubjectsModule.openAddModal();

            if (addTaskBtn) addTaskBtn.onclick = () => TasksModule.openAddModal();
            if (addTaskEmptyBtn) addTaskEmptyBtn.onclick = () => TasksModule.openAddModal();

            const calendarBtns = document.querySelectorAll('[data-open-calendar]');
            calendarBtns.forEach(btn => {
                btn.onclick = () => CalendarModule.openModal();
            });

            document.getElementById('close-subject-modal')?.addEventListener('click', () => {
                SubjectsModule.closeModal();
            });
            document.getElementById('cancel-subject-btn')?.addEventListener('click', () => {
                SubjectsModule.closeModal();
            });
            document.getElementById('subject-modal-backdrop')?.addEventListener('click', () => {
                SubjectsModule.closeModal();
            });

            document.getElementById('close-task-modal')?.addEventListener('click', () => {
                TasksModule.closeModal();
            });
            document.getElementById('cancel-task-btn')?.addEventListener('click', () => {
                TasksModule.closeModal();
            });
            document.getElementById('task-modal-backdrop')?.addEventListener('click', () => {
                TasksModule.closeModal();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    SubjectsModule.closeModal();
                    TasksModule.closeModal();
                    CalendarModule.closeModal();
                    this.closeSidebarDrawer();
                }
            });
        }

        setupSettingsView() {
            const InstitutionsModule = window.InstitutionsModule;
            const Storage = window.StorageModule;

            // 1. Configuración del Ciclo Escolar (Fechas Inicio y Término Obligatorias)
            const cycle = Storage.getAcademicCycle();
            const startInput = document.getElementById('settings-cycle-start');
            const endInput = document.getElementById('settings-cycle-end');
            const cycleForm = document.getElementById('settings-cycle-form');

            if (startInput && cycle.startDate) startInput.value = cycle.startDate;
            if (endInput && cycle.endDate) endInput.value = cycle.endDate;

            if (cycleForm) {
                cycleForm.onsubmit = (e) => {
                    e.preventDefault();
                    const newStart = startInput.value;
                    const newEnd = endInput.value;

                    if (!newStart || !newEnd) {
                        this.showToast('Debes ingresar ambas fechas del ciclo escolar.', 'warning');
                        return;
                    }
                    if (newStart > newEnd) {
                        this.showToast('La fecha de inicio no puede ser posterior a la de término.', 'error');
                        return;
                    }

                    try {
                        Storage.setAcademicCycle(newStart, newEnd);
                        this.updateCycleBadges();
                        window.CalendarModule?.render();
                        this.showToast(`Ciclo escolar guardado: ${newStart} al ${newEnd}`, 'success');
                    } catch (err) {
                        this.showToast(err.message, 'error');
                    }
                };
            }

            // 2. Selectores de Institución y Periodo en Settings
            const instSelect = document.getElementById('settings-institution-select');
            const periodSelect = document.getElementById('settings-period-select');

            if (instSelect) {
                instSelect.innerHTML = Object.values(InstitutionsModule.INSTITUTIONS).map(inst => `
                    <option value="${inst.id}">🎓 ${inst.name} - ${inst.fullName}</option>
                `).join('');
                instSelect.value = this.activeInstitution.id;
                instSelect.onchange = (e) => {
                    this.setInstitution(e.target.value);
                    this.showToast('Institución actualizada.', 'success');
                };
            }

            if (periodSelect) {
                periodSelect.onchange = (e) => {
                    this.setAcademicPeriod(e.target.value);
                };
            }

            // Inicializar galería de escudos en marco blanco en Configuración
            this.renderInstitutionGrid();

            // 3. Tema y Modo Oscuro en Configuración
            document.getElementById('settings-theme-light')?.addEventListener('click', () => {
                this.setTheme('light');
            });
            document.getElementById('settings-theme-dark')?.addEventListener('click', () => {
                this.setTheme('dark');
            });
            document.getElementById('settings-theme-auto')?.addEventListener('click', () => {
                this.setTheme('auto');
            });

            // Sincronizar estado inicial de los botones de tema en settings
            this.updateThemeUI(
                document.documentElement.classList.contains('dark') ? 'dark' : 'light',
                !Storage.getTheme()
            );

            // Cargar Demo opcional
            document.getElementById('settings-load-demo')?.addEventListener('click', () => {
                if (confirm('¿Cargar datos de demostración? Esto añadirá materias y tareas de ejemplo para probar.')) {
                    Storage.loadDemo();
                    this.setInstitution(Storage.getInstitution());
                    this.refreshAll();
                    this.showToast('Datos de demostración cargados.', 'success');
                    this.switchView('subjects');
                }
            });

            // Limpiar Todo
            document.getElementById('settings-clear-all')?.addEventListener('click', () => {
                if (confirm('¿Estás seguro de eliminar todas las materias y tareas?')) {
                    window.TasksModule?.cancelAllNotifications?.();
                    Storage.clearAll();
                    this.refreshAll();
                    this.showToast('Todas las materias y tareas han sido eliminadas.', 'info');
                    this.switchView('subjects');
                }
            });

            // Exportar JSON
            document.getElementById('settings-export-json')?.addEventListener('click', () => {
                const dataStr = Storage.exportJson();
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `organizador_escolar_${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                this.showToast('Respaldo descargado.', 'success');
            });

            // Importar JSON
            const importInput = document.getElementById('settings-import-input');
            document.getElementById('settings-import-btn')?.addEventListener('click', () => {
                importInput?.click();
            });

            if (importInput) {
                importInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        try {
                            Storage.importJson(evt.target.result);
                            this.setInstitution(Storage.getInstitution());
                            this.refreshAll();
                            this.showToast('Respaldo restaurado con éxito.', 'success');
                            this.switchView('subjects');
                        } catch (err) {
                            this.showToast(err.message, 'error');
                        }
                        importInput.value = '';
                    };
                    reader.readAsText(file);
                };
            }
        }

        showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all duration-300 transform translate-y-3 opacity-0 pointer-events-auto border ${
                type === 'success' ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20' :
                type === 'warning' ? 'bg-amber-600 text-white border-amber-500 shadow-amber-500/20' :
                type === 'error' ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20' :
                'bg-slate-900 text-white border-slate-700 shadow-slate-900/30'
            }`;

            const iconSvg = type === 'success' ? `
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            ` : type === 'warning' ? `
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            ` : type === 'error' ? `
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            ` : `
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            `;

            toast.innerHTML = `
                ${iconSvg}
                <span class="flex-1">${message}</span>
            `;

            container.appendChild(toast);

            requestAnimationFrame(() => {
                toast.classList.remove('translate-y-3', 'opacity-0');
                toast.classList.add('translate-y-0', 'opacity-100');
            });

            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-x-full');
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
})();
