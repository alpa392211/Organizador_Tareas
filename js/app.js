/**
 * Aplicación Principal - Orquestador
 * Integra UI, navegación por Drawer, selector institucional oficial,
 * selector dinámico de periodos/semestres, ciclo escolar obligatorio, notas rápidas,
 * baúl de archivados con depuración de 60 días y telarañas decorativas,
 * selector de 5 tipografías mediante botones interactivos, sistema háptico,
 * botón central de atajo de acción rápida personalizable, animación de logo escolar y widgets nativos.
 */

(() => {
    class App {
        constructor() {
            this.currentView = 'subjects'; // 'subjects' | 'tasks' | 'notes' | 'calendar' | 'archive' | 'settings'
            this.activeInstitution = null;
        }

        init() {
            const Storage = window.StorageModule;
            const InstitutionsModule = window.InstitutionsModule;
            const SubjectsModule = window.SubjectsModule;
            const TasksModule = window.TasksModule;
            const CalendarModule = window.CalendarModule;
            const NotesModule = window.NotesModule;
            const ArchiveModule = window.ArchiveModule;
            const HapticsModule = window.HapticsModule;
            const NotificationsModule = window.NotificationsModule;
            const WidgetSyncModule = window.WidgetSyncModule;

            // 1. Inicialización limpia en localStorage
            Storage.initIfFirstTime();

            // Depuración de archivados de 60 días y auto-archivo de tareas de 30 días
            Storage.runArchivePurge?.();
            Storage.checkAutoArchiveTasks?.();

            // 2. Inicializar sistema háptico y notificaciones locales enriquecidas
            HapticsModule?.bindGlobalInteractions?.();
            NotificationsModule?.init?.();

            // 3. Inicializar y aplicar modo oscuro / claro y visibilidad del botón de tema
            this.initTheme();
            this.applyHeaderThemeBtnVisibility();

            // 4. Inicializar y aplicar tipografía seleccionada (5 opciones con botones)
            this.initFontFamily();

            // 5. Cargar institución y periodo activo
            const instId = Storage.getInstitution();
            this.setInstitution(instId);

            // 6. Inicializar submódulos
            SubjectsModule?.init?.();
            TasksModule?.init?.();
            NotesModule?.init?.();
            CalendarModule?.init?.();
            ArchiveModule?.init?.();
            WidgetSyncModule?.init?.();

            // 7. Configurar navegación, drawer, selectores, botón principal de atajo, modales y confirmación de salida
            this.setupNavigation();
            this.setupSidebarDrawer();
            this.setupInstitutionAndPeriodSelectors();
            this.setupBottomActionButton();
            this.setupModalsAndShortcuts();
            this.setupSchoolIdentityModal();
            this.setupCycleWelcomeModal();
            this.setupExitModal();
            this.setupSettingsView();

            // 8. Exponer funciones globales para interacción fluida entre módulos
            window.onDataChanged = () => this.refreshAll();
            window.showNotification = (msg, type) => this.showToast(msg, type);
            window.navigateToSubjects = () => this.switchView('subjects');
            window.navigateToTasks = () => this.switchView('tasks');
            window.navigateToNotes = () => this.switchView('notes');
            window.navigateToCalendar = () => this.switchView('calendar');
            window.navigateToArchive = () => this.switchView('archive');
            window.navigateToSettings = () => this.switchView('settings');
            window.navigateToTasksWithSubject = (subjectId) => {
                this.switchView('tasks');
                if (window.TasksModule) {
                    window.TasksModule.subjectFilter = subjectId;
                    const select = document.getElementById('task-subject-filter');
                    if (select) select.value = subjectId;
                    window.TasksModule.render();
                }
            };

            // 9. Atender posibles accesos directos desde Widgets de Android
            WidgetSyncModule?.handleIntent?.({
                TasksModule,
                NotesModule,
                CalendarModule,
                ArchiveModule,
                switchView: (v) => this.switchView(v)
            });

            // 10. Soporte para parámetros URL (Widgets de Android y Deep Linking)
            const urlParams = new URLSearchParams(window.location.search);
            const initialView = urlParams.get('view');
            if (initialView && ['subjects', 'tasks', 'notes', 'calendar', 'archive', 'settings'].includes(initialView)) {
                this.switchView(initialView);
            }
            if (urlParams.get('openDrawer') === '1') {
                setTimeout(() => document.getElementById('drawer-toggle-btn')?.click(), 50);
            }
            if (urlParams.get('openExit') === '1') {
                setTimeout(() => document.getElementById('app-exit-btn')?.click(), 50);
            }
            if (urlParams.get('openSchoolModal') === '1') {
                setTimeout(() => document.getElementById('header-inst-logo')?.click(), 80);
            }

            // 11. Renderizado inicial completo
            this.refreshAll();

            // 12. Comprobar si el ciclo escolar está configurado obligatoriamente en primer inicio
            if (!Storage.isCycleConfigured?.() && urlParams.get('openSchoolModal') !== '1') {
                setTimeout(() => {
                    this.openCycleWelcomeModal?.();
                }, 400);
            }
        }

        refreshAll() {
            window.SubjectsModule?.render?.();
            window.TasksModule?.render?.();
            window.NotesModule?.render?.();
            window.ArchiveModule?.render?.();
            this.updateHeaderStats();
            this.updateCycleBadges();
            this.updateStorageMetrics();
            window.WidgetSyncModule?.sync?.();
        }

        updateHeaderStats() {
            const Storage = window.StorageModule;
            const subjects = Storage.getSubjects();
            const tasks = Storage.getTasks();
            const notes = Storage.getNotes();
            const archivedTasks = Storage.getArchivedTasks?.() || [];
            const archivedNotes = Storage.getArchivedNotes?.() || [];
            const pendingTasks = tasks.filter(t => !t.completed).length;

            const drawerSubCount = document.getElementById('drawer-sub-count');
            const drawerTaskCount = document.getElementById('drawer-task-count');
            const drawerNoteCount = document.getElementById('drawer-note-count');
            const drawerArchiveCount = document.getElementById('drawer-archive-count');

            const navSubCount = document.getElementById('nav-sub-count');
            const navTaskCount = document.getElementById('nav-task-count');
            const navNoteCount = document.getElementById('nav-note-count');

            const archiveBadge = document.getElementById('archive-count-badge');

            if (drawerSubCount) drawerSubCount.textContent = subjects.length;
            if (drawerTaskCount) drawerTaskCount.textContent = pendingTasks;
            if (drawerNoteCount) drawerNoteCount.textContent = notes.length;
            if (drawerArchiveCount) drawerArchiveCount.textContent = archivedTasks.length + archivedNotes.length;

            if (navSubCount) navSubCount.textContent = subjects.length;
            if (navTaskCount) navTaskCount.textContent = pendingTasks;
            if (navNoteCount) navNoteCount.textContent = notes.length;

            if (archiveBadge) archiveBadge.textContent = `${archivedTasks.length + archivedNotes.length} elementos`;
        }

        updateCycleBadges() {
            const Storage = window.StorageModule;
            const cycle = Storage.getAcademicCycle?.();
            const isProvisional = Storage.isCycleProvisional?.();

            const drawerCycleText = document.getElementById('drawer-cycle-text');
            const drawerCycleWarning = document.getElementById('drawer-cycle-warning');
            const headerCycleWarning = document.getElementById('header-cycle-warning');
            const settingsCycleWarningBox = document.getElementById('settings-cycle-warning-box');
            const settingsCycleStatus = document.getElementById('settings-cycle-status-pill');

            // Actualizar advertencias de ciclo provisional / pendiente
            if (headerCycleWarning) {
                headerCycleWarning.classList.toggle('hidden', !isProvisional);
            }
            if (drawerCycleWarning) {
                drawerCycleWarning.classList.toggle('hidden', !isProvisional);
            }
            if (settingsCycleWarningBox) {
                settingsCycleWarningBox.classList.toggle('hidden', !isProvisional);
            }

            if (cycle && cycle.startDate && cycle.endDate) {
                if (drawerCycleText) {
                    drawerCycleText.textContent = `📅 ${cycle.startDate} - ${cycle.endDate}`;
                }
                if (settingsCycleStatus) {
                    if (isProvisional) {
                        settingsCycleStatus.textContent = 'Provisional (Actualizar)';
                        settingsCycleStatus.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white animate-pulse';
                    } else {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isCurrent = todayStr >= cycle.startDate && todayStr <= cycle.endDate;
                        settingsCycleStatus.textContent = isCurrent ? 'Ciclo Vigente' : 'Programado';
                        settingsCycleStatus.className = isCurrent 
                            ? 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white'
                            : 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-600 text-white';
                    }
                }
            }
        }

        /* ========================================================
           SISTEMA DE TIPOGRAFÍAS (5 OPCIONES: Calibri, Times New Roman, Montserrat, Lora, Poppins)
           ======================================================== */
        initFontFamily() {
            const Storage = window.StorageModule;
            const font = Storage.getFontFamily?.() || 'calibri';
            this.applyFontFamily(font);
        }

        applyFontFamily(fontKey) {
            const valid = ['calibri', 'times', 'montserrat', 'lora', 'poppins'];
            const activeFont = valid.includes(fontKey) ? fontKey : 'calibri';

            // Aplicar data-font en la etiqueta raíz y body
            document.documentElement.setAttribute('data-font', activeFont);
            document.body.setAttribute('data-font', activeFont);

            const labels = {
                calibri: 'Calibri',
                times: 'Times New Roman',
                montserrat: 'Montserrat',
                lora: 'Lora',
                poppins: 'Poppins'
            };

            const descs = {
                calibri: 'Tipografía institucional clara, moderna y de lectura descansada.',
                times: 'Serif formal y tradicional para estilo académico formal.',
                montserrat: 'Geométrica estilizada con excelente legibilidad en títulos.',
                lora: 'Serif literaria cálida, sofisticada y con estilo editorial.',
                poppins: 'Moderna, geométrica y amigable con proporciones equilibradas.'
            };

            const fontPill = document.getElementById('settings-font-pill');
            if (fontPill) {
                fontPill.textContent = labels[activeFont] || activeFont;
            }

            const previewDesc = document.getElementById('settings-font-preview-desc');
            if (previewDesc) {
                previewDesc.textContent = descs[activeFont] || '';
            }

            // Sincronizar estilo visual de los 5 botones de selección directa
            document.querySelectorAll('#settings-font-buttons-grid [data-font-btn]').forEach(btn => {
                const isSelected = btn.dataset.fontBtn === activeFont;
                if (isSelected) {
                    btn.className = `font-choice-btn tap-effect p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ring-2 ring-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-500 shadow-xs ${
                        btn.dataset.fontBtn === 'times' ? 'font-serif' : ''
                    }`;
                } else {
                    btn.className = `font-choice-btn tap-effect p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400 ${
                        btn.dataset.fontBtn === 'times' ? 'font-serif' : ''
                    }`;
                }
            });
        }

        applyHeaderThemeBtnVisibility() {
            const Storage = window.StorageModule;
            const isVisible = Storage.getHeaderThemeBtnEnabled?.() !== false;
            const btn = document.getElementById('theme-toggle-btn');
            if (btn) {
                btn.style.display = isVisible ? 'inline-flex' : 'none';
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

            // Botón de cambio rápido en el Header
            const headerToggleBtn = document.getElementById('theme-toggle-btn');
            if (headerToggleBtn) {
                headerToggleBtn.onclick = () => this.toggleTheme();
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
            window.HapticsModule?.light();

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
            const settingsBadgePill = document.getElementById('settings-inst-badge-pill');

            if (settingsLogo) settingsLogo.innerHTML = InstitutionsModule.renderIconHtml(inst, 'w-14 h-14');
            if (settingsName) settingsName.textContent = inst.name;
            if (settingsFullName) settingsFullName.textContent = inst.fullName;
            if (settingsSlogan) settingsSlogan.textContent = `"${inst.slogan}"`;
            if (settingsTypeBadge) settingsTypeBadge.textContent = inst.systemType || inst.type;
            if (settingsBadgePill) settingsBadgePill.textContent = inst.name;

            // Actualizar selector institucional en el header
            const headerSelect = document.getElementById('header-institution-select');
            if (headerSelect) headerSelect.value = id;

            // Actualizar selector dinámico de periodos
            this.updatePeriodSelectors(inst);

            // Re-renderizar resaltado de la galería en Settings
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
                    window.HapticsModule?.light();
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
            const periodPillsContainer = document.getElementById('settings-period-pills');
            const headerPeriodLabel = document.getElementById('header-inst-period');
            const drawerPeriodLabel = document.getElementById('drawer-inst-period');
            const settingsPeriodBadge = document.getElementById('settings-inst-period-badge');

            const activePeriod = inst.periods.includes(currentPeriod) ? currentPeriod : inst.defaultPeriod;
            Storage.setAcademicPeriod(activePeriod);

            const optionsHtml = inst.periods.map(p => `
                <option value="${p}">${p}</option>
            `).join('');

            if (headerPeriodSelect) {
                headerPeriodSelect.innerHTML = optionsHtml;
                headerPeriodSelect.value = activePeriod;
            }

            if (settingsPeriodSelect) {
                settingsPeriodSelect.innerHTML = optionsHtml;
                settingsPeriodSelect.value = activePeriod;
            }

            // Renderizar grupo de botones tipo píldora para selección táctil hermosa
            if (periodPillsContainer) {
                periodPillsContainer.innerHTML = inst.periods.map(p => {
                    const isSelected = p === activePeriod;
                    return `
                        <button type="button" data-period-btn="${p}"
                            class="period-pill-btn tap-effect px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                isSelected
                                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                                    : 'bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-transparent'
                            }">
                            ${p}
                        </button>
                    `;
                }).join('');

                periodPillsContainer.querySelectorAll('.period-pill-btn').forEach(btn => {
                    btn.onclick = () => {
                        this.setAcademicPeriod(btn.dataset.periodBtn);
                    };
                });
            }

            if (headerPeriodLabel) headerPeriodLabel.textContent = activePeriod;
            if (drawerPeriodLabel) drawerPeriodLabel.textContent = activePeriod;
            if (settingsPeriodBadge) settingsPeriodBadge.textContent = activePeriod;
        }

        setAcademicPeriod(period) {
            const Storage = window.StorageModule;
            window.HapticsModule?.light();
            Storage.setAcademicPeriod(period);

            const headerPeriodSelect = document.getElementById('header-period-select');
            const settingsPeriodSelect = document.getElementById('settings-period-select');
            const headerPeriodLabel = document.getElementById('header-inst-period');
            const drawerPeriodLabel = document.getElementById('drawer-inst-period');
            const settingsPeriodBadge = document.getElementById('settings-inst-period-badge');

            if (headerPeriodSelect) headerPeriodSelect.value = period;
            if (settingsPeriodSelect) settingsPeriodSelect.value = period;
            if (headerPeriodLabel) headerPeriodLabel.textContent = period;
            if (drawerPeriodLabel) drawerPeriodLabel.textContent = period;
            if (settingsPeriodBadge) settingsPeriodBadge.textContent = period;

            // Actualizar estilo visual de los botones píldora en Ajustes
            document.querySelectorAll('#settings-period-pills button[data-period-btn]').forEach(btn => {
                const isSelected = btn.dataset.periodBtn === period;
                if (isSelected) {
                    btn.className = 'period-pill-btn tap-effect px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20';
                } else {
                    btn.className = 'period-pill-btn tap-effect px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-transparent';
                }
            });

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
                    this.closeSidebarDrawer?.();
                });
            });
        }

        switchView(viewName) {
            this.currentView = viewName;
            window.HapticsModule?.light();

            const views = ['subjects', 'tasks', 'notes', 'calendar', 'archive', 'settings'];
            views.forEach(v => {
                const section = document.getElementById(`view-${v}`);
                if (section) {
                    if (v === viewName) {
                        section.classList.remove('hidden');
                        requestAnimationFrame(() => {
                            section.classList.add('active');
                        });
                    } else {
                        section.classList.remove('active');
                        section.classList.add('hidden');
                    }
                }
            });

            // Actualizar botones de navegación activos
            document.querySelectorAll('[data-view-target]').forEach(btn => {
                const isMatch = btn.dataset.viewTarget === viewName;
                if (btn.classList.contains('nav-link-btn')) {
                    if (isMatch) {
                        btn.classList.add('text-indigo-600', 'dark:text-indigo-400', 'font-bold');
                        btn.classList.remove('text-slate-600', 'dark:text-slate-400', 'font-semibold');
                        if (btn.closest('nav.hidden.lg\:flex')) {
                            btn.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-xs');
                        }
                    } else {
                        btn.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'font-bold', 'bg-white', 'dark:bg-slate-700', 'shadow-xs');
                        btn.classList.add('text-slate-600', 'dark:text-slate-400', 'font-semibold');
                    }
                }
            });

            // Re-renderizado de la vista activada
            if (viewName === 'subjects') window.SubjectsModule?.render?.();
            if (viewName === 'tasks') window.TasksModule?.render?.();
            if (viewName === 'notes') window.NotesModule?.render?.();
            if (viewName === 'calendar') window.CalendarModule?.render?.();
            if (viewName === 'archive') window.ArchiveModule?.render?.();
            if (viewName === 'settings') this.updateStorageMetrics();

            // Scroll suave hacia la parte superior
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        setupSidebarDrawer() {
            const toggleBtn = document.getElementById('drawer-toggle-btn');
            const closeBtn = document.getElementById('drawer-close-btn');
            const drawer = document.getElementById('sidebar-drawer');
            const backdrop = document.getElementById('drawer-backdrop');

            const openDrawer = () => {
                if (!drawer || !backdrop) return;
                window.HapticsModule?.light();
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
            if (closeBtn) closeBtn.onclick = () => {
                window.HapticsModule?.light();
                closeDrawer();
            };
            if (backdrop) backdrop.onclick = closeDrawer;
        }

        setupBottomActionButton() {
            const Storage = window.StorageModule;
            const mainBtn = document.getElementById('bottom-main-action-btn');
            const circle = document.getElementById('bottom-main-circle');
            const icon = document.getElementById('bottom-main-icon');
            const label = document.getElementById('bottom-main-label');

            if (!mainBtn || !circle || !icon || !label) return;

            const action = Storage.getBottomAction();

            if (action === 'notes') {
                circle.className = 'w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center shadow-xl fab-glow ring-4 ring-white dark:ring-slate-800 transition-all';
                icon.innerHTML = `
                    <svg class="w-7 h-7 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                `;
                label.textContent = '+ Nota';
                label.className = 'text-[10px] font-extrabold text-amber-600 dark:text-amber-400 mt-1 truncate max-w-[80px]';
                mainBtn.onclick = () => {
                    window.HapticsModule?.medium();
                    window.NotesModule?.openAddModal?.();
                };
            } else if (action === 'calendar') {
                circle.className = 'w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-600 text-white flex items-center justify-center shadow-xl fab-glow ring-4 ring-white dark:ring-slate-800 transition-all';
                icon.innerHTML = `
                    <svg class="w-7 h-7 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                `;
                label.textContent = 'Calendario';
                label.className = 'text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 truncate max-w-[80px]';
                mainBtn.onclick = () => {
                    window.HapticsModule?.medium();
                    window.CalendarModule?.openModal?.();
                };
            } else {
                circle.className = 'w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-xl fab-glow ring-4 ring-white dark:ring-slate-800 transition-all';
                icon.innerHTML = `
                    <svg class="w-7 h-7 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                `;
                label.textContent = '+ Tarea';
                label.className = 'text-[10px] font-extrabold text-teal-600 dark:text-teal-400 mt-1 truncate max-w-[80px]';
                mainBtn.onclick = () => {
                    window.HapticsModule?.medium();
                    window.TasksModule?.openAddModal?.();
                };
            }
        }

        setupModalsAndShortcuts() {
            const SubjectsModule = window.SubjectsModule;
            const TasksModule = window.TasksModule;
            const NotesModule = window.NotesModule;
            const CalendarModule = window.CalendarModule;

            // Botones directos para Materias
            const addSubBtn = document.getElementById('add-subject-btn');
            const addSubEmptyBtn = document.getElementById('empty-add-subject-btn');
            if (addSubBtn) addSubBtn.onclick = () => SubjectsModule?.openAddModal();
            if (addSubEmptyBtn) addSubEmptyBtn.onclick = () => SubjectsModule?.openAddModal();

            // Botones directos para Tareas
            const addTaskBtn = document.getElementById('add-task-btn');
            const addTaskEmptyBtn = document.getElementById('empty-add-task-btn');
            if (addTaskBtn) addTaskBtn.onclick = () => TasksModule?.openAddModal();
            if (addTaskEmptyBtn) addTaskEmptyBtn.onclick = () => TasksModule?.openAddModal();

            // Botones directos para Notas
            const addNoteBtn = document.getElementById('add-note-btn');
            const addNoteEmptyBtn = document.getElementById('empty-add-note-btn');
            if (addNoteBtn) addNoteBtn.onclick = () => NotesModule?.openAddModal();
            if (addNoteEmptyBtn) addNoteEmptyBtn.onclick = () => NotesModule?.openAddModal();

            // Botones para abrir Calendario
            const calendarBtns = document.querySelectorAll('[data-open-calendar]');
            calendarBtns.forEach(btn => {
                btn.onclick = () => {
                    window.HapticsModule?.light();
                    CalendarModule?.openModal();
                    this.closeSidebarDrawer?.();
                };
            });

            // Cerrar Modal Materias
            document.getElementById('close-subject-modal')?.addEventListener('click', () => SubjectsModule?.closeModal());
            document.getElementById('cancel-subject-btn')?.addEventListener('click', () => SubjectsModule?.closeModal());
            document.getElementById('subject-modal-backdrop')?.addEventListener('click', () => SubjectsModule?.closeModal());

            // Cerrar Modal Tareas
            document.getElementById('close-task-modal')?.addEventListener('click', () => TasksModule?.closeModal());
            document.getElementById('cancel-task-btn')?.addEventListener('click', () => TasksModule?.closeModal());
            document.getElementById('task-modal-backdrop')?.addEventListener('click', () => TasksModule?.closeModal());

            // Cerrar Modal Notas
            document.getElementById('close-note-modal')?.addEventListener('click', () => NotesModule?.closeModal());
            document.getElementById('cancel-note-btn')?.addEventListener('click', () => NotesModule?.closeModal());
            document.getElementById('note-modal-backdrop')?.addEventListener('click', () => NotesModule?.closeModal());

            // Cerrar con tecla Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    SubjectsModule?.closeModal?.();
                    TasksModule?.closeModal?.();
                    NotesModule?.closeModal?.();
                    CalendarModule?.closeModal?.();
                    this.closeSchoolIdentityModal?.();
                    this.closeCycleWelcomeModal?.();
                    this.closeExitModal?.();
                    this.closeSidebarDrawer?.();
                }
            });
        }

        /* ========================================================
           MODAL DE IDENTIDAD INSTITUCIONAL (LOGO DINÁMICO ZOOM & GLOW)
           ======================================================== */
        setupSchoolIdentityModal() {
            const modal = document.getElementById('school-identity-modal');
            const card = document.getElementById('school-identity-card');
            const backdrop = document.getElementById('school-identity-backdrop');
            const closeBtn = document.getElementById('close-school-identity-btn');
            const actionBtn = document.getElementById('school-identity-action-btn');
            const headerLogo = document.getElementById('header-inst-logo');

            if (!modal || !card) return;

            const openModal = (e) => {
                const Storage = window.StorageModule;
                if (!Storage.getLogoExpandEnabled?.()) {
                    return; // Desactivado por configuración del usuario
                }

                window.HapticsModule?.medium();
                const InstitutionsModule = window.InstitutionsModule;
                const inst = this.activeInstitution || InstitutionsModule.getInstitution('unam');
                const cycle = Storage.getAcademicCycle?.() || {};

                // Inyectar escudo, nombres y lema oficial
                const logoContent = document.getElementById('school-identity-logo-content');
                const nameEl = document.getElementById('school-identity-name');
                const fullnameEl = document.getElementById('school-identity-fullname');
                const sloganEl = document.getElementById('school-identity-slogan');
                const systemBadge = document.getElementById('school-identity-system-badge');
                const cycleDates = document.getElementById('school-identity-cycle-dates');
                const cycleBadge = document.getElementById('school-identity-cycle-badge');
                const glow = document.getElementById('school-identity-glow');

                if (logoContent) {
                    logoContent.innerHTML = InstitutionsModule.renderIconHtml(inst, 'w-20 h-20 sm:w-24 sm:h-24');
                }
                if (nameEl) nameEl.textContent = inst.name;
                if (fullnameEl) fullnameEl.textContent = inst.fullName;
                if (sloganEl) sloganEl.textContent = `"${inst.slogan}"`;
                if (systemBadge) systemBadge.textContent = inst.systemType || inst.type;

                if (cycleDates) {
                    cycleDates.textContent = (cycle.startDate && cycle.endDate) 
                        ? `${cycle.startDate} al ${cycle.endDate}`
                        : 'Periodo lectivo pendiente de confirmar';
                }

                if (cycleBadge) {
                    const isProv = Storage.isCycleProvisional?.();
                    if (isProv) {
                        cycleBadge.textContent = 'Provisional';
                        cycleBadge.className = 'text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-600 text-white shadow-xs';
                    } else {
                        cycleBadge.textContent = 'Vigente';
                        cycleBadge.className = 'text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs';
                    }
                }

                // Resplandor temático con el color de la escuela
                if (glow) {
                    const primaryColor = inst.colors?.primary || '#6366F1';
                    glow.style.backgroundColor = primaryColor;
                    glow.style.boxShadow = `0 0 100px 30px ${primaryColor}`;
                }

                // Calcular origen de animación dinámica desde el logo superior hasta el centro
                if (headerLogo) {
                    const rect = headerLogo.getBoundingClientRect();
                    const originX = (rect.left + rect.width / 2) - (window.innerWidth / 2);
                    const originY = (rect.top + rect.height / 2) - (window.innerHeight / 2);
                    card.style.setProperty('--origin-x', `${originX}px`);
                    card.style.setProperty('--origin-y', `${originY}px`);
                }

                card.classList.remove('school-identity-exit-left');
                card.classList.add('school-identity-card-anim');

                modal.classList.remove('hidden');
                modal.classList.add('flex');
                document.body.classList.add('overflow-hidden');

                requestAnimationFrame(() => {
                    modal.classList.add('active');
                });
            };

            const closeModal = () => {
                if (!modal || modal.classList.contains('hidden')) return;
                window.HapticsModule?.light();

                // Salida fluida de la ventana y el escudo hacia el lado izquierdo
                card.classList.remove('school-identity-card-anim');
                card.classList.add('school-identity-exit-left');
                modal.classList.remove('active');

                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                    card.classList.remove('school-identity-exit-left');
                    document.body.classList.remove('overflow-hidden');
                }, 360);
            };

            this.openSchoolIdentityModal = openModal;
            this.closeSchoolIdentityModal = closeModal;

            if (headerLogo) {
                headerLogo.onclick = (e) => openModal(e);
            }
            if (closeBtn) closeBtn.onclick = closeModal;
            if (actionBtn) actionBtn.onclick = closeModal;
            if (backdrop) backdrop.onclick = closeModal;
        }

        /* ========================================================
           MODAL DE BIENVENIDA / CONFIGURACIÓN OBLIGATORIA DEL CICLO
           ======================================================== */
        setupCycleWelcomeModal() {
            const modal = document.getElementById('cycle-setup-modal');
            const backdrop = document.getElementById('cycle-setup-backdrop');
            const form = document.getElementById('cycle-setup-welcome-form');
            const laterBtn = document.getElementById('welcome-cycle-later-btn');
            const startInput = document.getElementById('welcome-cycle-start');
            const endInput = document.getElementById('welcome-cycle-end');
            const Storage = window.StorageModule;

            if (!modal) return;

            const openWelcome = () => {
                const cycle = Storage.getAcademicCycle?.() || {};
                if (startInput && cycle.startDate) startInput.value = cycle.startDate;
                if (endInput && cycle.endDate) endInput.value = cycle.endDate;

                modal.classList.remove('hidden');
                modal.classList.add('flex');
                document.body.classList.add('overflow-hidden');
                requestAnimationFrame(() => {
                    modal.classList.add('active');
                });
            };

            const closeWelcome = () => {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                    document.body.classList.remove('overflow-hidden');
                }, 200);
            };

            this.openCycleWelcomeModal = openWelcome;
            this.closeCycleWelcomeModal = closeWelcome;

            if (form) {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    window.HapticsModule?.double();
                    const s = startInput.value;
                    const end = endInput.value;
                    if (!s || !end) {
                        this.showToast('Por favor completa ambas fechas.', 'warning');
                        return;
                    }
                    if (s > end) {
                        this.showToast('La fecha de inicio debe ser anterior a la de término.', 'error');
                        return;
                    }

                    Storage.setAcademicCycle(s, end);
                    Storage.setCycleConfigured(true);
                    closeWelcome();
                    this.updateCycleBadges();
                    window.CalendarModule?.render?.();
                    this.showToast('Ciclo escolar oficial confirmado y sincronizado.', 'success');
                };
            }

            if (laterBtn) {
                laterBtn.onclick = () => {
                    window.HapticsModule?.light();
                    Storage.setProvisionalCycle();
                    closeWelcome();
                    this.updateCycleBadges();
                    this.showToast('Ciclo asignado en modo provisional. Puedes confirmarlo en Ajustes.', 'warning');
                };
            }
        }

        setupExitModal() {
            const exitBtn = document.getElementById('app-exit-btn');
            const exitModal = document.getElementById('exit-modal');
            const cancelBtn = document.getElementById('cancel-exit-btn');
            const confirmBtn = document.getElementById('confirm-exit-btn');
            const backdrop = document.getElementById('exit-modal-backdrop');

            const openExit = () => {
                if (!exitModal) return;
                window.HapticsModule?.medium();
                this.closeSidebarDrawer?.();
                exitModal.classList.remove('hidden');
                exitModal.classList.add('flex');
                document.body.classList.add('overflow-hidden');
                requestAnimationFrame(() => {
                    exitModal.classList.add('active');
                });
            };

            const closeExit = () => {
                if (!exitModal) return;
                window.HapticsModule?.light();
                exitModal.classList.remove('active');
                setTimeout(() => {
                    exitModal.classList.add('hidden');
                    exitModal.classList.remove('flex');
                    document.body.classList.remove('overflow-hidden');
                }, 200);
            };

            this.closeExitModal = closeExit;

            if (exitBtn) exitBtn.onclick = openExit;
            if (cancelBtn) cancelBtn.onclick = closeExit;
            if (backdrop) backdrop.onclick = closeExit;

            if (confirmBtn) {
                confirmBtn.onclick = () => {
                    window.HapticsModule?.double();
                    closeExit();

                    if (window.Capacitor?.Plugins?.App?.exitApp) {
                        window.Capacitor.Plugins.App.exitApp();
                    } else if (navigator.app && navigator.app.exitApp) {
                        navigator.app.exitApp();
                    } else {
                        this.showToast('¡Hasta pronto! Tus datos escolares están respaldados.', 'info');
                        setTimeout(() => {
                            try {
                                window.close();
                            } catch (_) {}
                        }, 500);
                    }
                };
            }

            window.addEventListener('popstate', () => {
                if (exitModal && !exitModal.classList.contains('hidden')) {
                    closeExit();
                }
            });
        }

        updateStorageMetrics() {
            const Storage = window.StorageModule;
            const metrics = Storage.getStorageMetrics();
            const barFill = document.getElementById('storage-bar-fill');
            const percentLabel = document.getElementById('storage-percentage-label');
            const detailLabel = document.getElementById('storage-detail-used');

            if (barFill) barFill.style.width = `${Math.min(100, Math.max(2, metrics.percentage || metrics.percent || 2))}%`;
            if (percentLabel) percentLabel.textContent = `${metrics.percentage || metrics.percent || 0}%`;
            if (detailLabel) {
                detailLabel.textContent = `${metrics.usedFormatted || (metrics.usedKb + ' KB')} utilizados • ${metrics.subjectsCount} materias, ${metrics.tasksCount} tareas, ${metrics.notesCount} notas`;
            }
        }

        /* ========================================================
           VISTA DE CONFIGURACIONES (ACORDEONES COLAPSABLES)
           ======================================================== */
        setupSettingsView() {
            const Storage = window.StorageModule;

            // 1. Manejo de Acordeones Colapsables
            document.querySelectorAll('.settings-accordion-header').forEach(header => {
                header.onclick = (e) => {
                    e.preventDefault();
                    window.HapticsModule?.light();
                    const card = header.closest('.settings-accordion-card');
                    if (card) {
                        card.classList.toggle('open');
                    }
                };
            });

            // 2. Formulario de Ciclo Escolar Activo (Obligatorio)
            const cycle = Storage.getAcademicCycle();
            const startInput = document.getElementById('settings-cycle-start');
            const endInput = document.getElementById('settings-cycle-end');
            const cycleForm = document.getElementById('settings-cycle-form');

            if (startInput && cycle.startDate) startInput.value = cycle.startDate;
            if (endInput && cycle.endDate) endInput.value = cycle.endDate;

            if (cycleForm) {
                cycleForm.onsubmit = (e) => {
                    e.preventDefault();
                    window.HapticsModule?.light();
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
                        Storage.setCycleConfigured(true);
                        this.updateCycleBadges();
                        window.CalendarModule?.render?.();
                        window.WidgetSyncModule?.sync?.();
                        this.showToast(`Ciclo escolar guardado: ${newStart} al ${newEnd}`, 'success');
                    } catch (err) {
                        this.showToast(err.message, 'error');
                    }
                };
            }

            // 3. Inicializar galería de escudos en Settings
            this.renderInstitutionGrid();

            // 4. Toggle de Animación Dinámica del Logo Escolar
            const logoExpandToggle = document.getElementById('settings-logo-expand-toggle');
            if (logoExpandToggle) {
                logoExpandToggle.checked = Storage.getLogoExpandEnabled?.() !== false;
                logoExpandToggle.onchange = (e) => {
                    const enabled = e.target.checked;
                    Storage.setLogoExpandEnabled(enabled);
                    window.HapticsModule?.light();
                    this.showToast(enabled ? 'Efecto dinámico de escudo activado.' : 'Efecto dinámico de escudo desactivado.', 'info');
                };
            }

            // 5. Tema y Modo Oscuro en Configuración
            document.getElementById('settings-theme-light')?.addEventListener('click', () => {
                this.setTheme('light');
            });
            document.getElementById('settings-theme-dark')?.addEventListener('click', () => {
                this.setTheme('dark');
            });
            document.getElementById('settings-theme-auto')?.addEventListener('click', () => {
                this.setTheme('auto');
            });

            this.updateThemeUI(
                document.documentElement.classList.contains('dark') ? 'dark' : 'light',
                !Storage.getTheme()
            );

            // Toggle para mostrar/ocultar botón de tema en Header
            const headerThemeToggle = document.getElementById('settings-header-theme-toggle');
            if (headerThemeToggle) {
                headerThemeToggle.checked = Storage.getHeaderThemeBtnEnabled?.() !== false;
                headerThemeToggle.onchange = (e) => {
                    const enabled = e.target.checked;
                    Storage.setHeaderThemeBtnEnabled(enabled);
                    this.applyHeaderThemeBtnVisibility();
                    window.HapticsModule?.light();
                    this.showToast(enabled ? 'Acceso rápido de tema visible en cabecera.' : 'Acceso rápido de tema oculto en cabecera.', 'info');
                };
            }

            // 6. Tipografía Mediante Botones Interactivos (5 Opciones - Sin Menú Desplegable)
            document.querySelectorAll('#settings-font-buttons-grid [data-font-btn]').forEach(btn => {
                btn.onclick = () => {
                    const font = btn.dataset.fontBtn;
                    Storage.setFontFamily(font);
                    this.applyFontFamily(font);
                    window.HapticsModule?.light();
                    const fontNames = {
                        calibri: 'Calibri',
                        times: 'Times New Roman',
                        montserrat: 'Montserrat',
                        lora: 'Lora',
                        poppins: 'Poppins'
                    };
                    this.showToast(`Tipografía aplicada: ${fontNames[font] || font}`, 'success');
                };
            });

            // 7. Interruptor de Vibración Háptica Global (Texto limpio sin "Web + Android")
            const hapticsToggle = document.getElementById('settings-haptics-toggle');
            const hapticsStatus = document.getElementById('settings-haptics-status');

            if (hapticsToggle) {
                const isEnabled = Storage.getHapticsEnabled();
                hapticsToggle.checked = isEnabled;
                if (hapticsStatus) {
                    hapticsStatus.textContent = isEnabled ? 'Activada' : 'Desactivada';
                    hapticsStatus.className = isEnabled 
                        ? 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20';
                }

                hapticsToggle.onchange = (e) => {
                    const enabled = e.target.checked;
                    Storage.setHapticsEnabled(enabled);
                    if (hapticsStatus) {
                        hapticsStatus.textContent = enabled ? 'Activada' : 'Desactivada';
                        hapticsStatus.className = enabled 
                            ? 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20';
                    }
                    if (enabled) {
                        window.HapticsModule?.double();
                    }
                    this.showToast(enabled ? 'Vibraciones hápticas activadas.' : 'Vibraciones desactivadas.', 'info');
                };
            }

            // 8. Selector de Atajo Rápido del Botón Central Inferior
            const bottomRadios = document.querySelectorAll('input[name="bottom-action-choice"]');
            const currentBottomAction = Storage.getBottomAction();
            bottomRadios.forEach(radio => {
                if (radio.value === currentBottomAction) {
                    radio.checked = true;
                }
                radio.onchange = (e) => {
                    if (e.target.checked) {
                        const newAction = e.target.value;
                        Storage.setBottomAction(newAction);
                        this.setupBottomActionButton();
                        window.HapticsModule?.light();
                        this.showToast('Atajo del botón central actualizado.', 'success');
                    }
                };
            });

            // 9. Depuración Automática de 60 Días para el Baúl
            const archivePurgeToggle = document.getElementById('settings-archive-purge-toggle');
            if (archivePurgeToggle) {
                archivePurgeToggle.checked = Storage.getAutoPurgeArchive?.() !== false;
                archivePurgeToggle.onchange = (e) => {
                    const enabled = e.target.checked;
                    Storage.setAutoPurgeArchive(enabled);
                    window.ArchiveModule?.render?.();
                    window.HapticsModule?.light();
                    this.showToast(enabled ? 'Depuración automática a los 60 días activada.' : 'Depuración desactivada (conservación permanente).', 'info');
                };
            }

            // 10. Opciones Avanzadas de Almacenamiento (Exportar, Importar, Limpiar)
            const exportBtn = document.getElementById('settings-export-btn') || document.getElementById('settings-export-json');
            if (exportBtn) {
                exportBtn.onclick = () => {
                    window.HapticsModule?.light();
                    const dataStr = Storage.exportJson();
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `organizador_escolar_${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    this.showToast('Respaldo descargado.', 'success');
                };
            }

            const importInput = document.getElementById('settings-import-input');
            const importBtn = document.getElementById('settings-import-btn');
            if (importBtn && importInput) {
                importBtn.onclick = () => {
                    window.HapticsModule?.light();
                    importInput.click();
                };

                importInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        try {
                            Storage.importJson(evt.target.result);
                            this.setInstitution(Storage.getInstitution());
                            this.initFontFamily();
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

            document.getElementById('settings-clear-all')?.addEventListener('click', () => {
                window.HapticsModule?.warning();
                if (confirm('¿Estás seguro de eliminar todas las materias, tareas, notas y archivados? Esta acción no se puede deshacer.')) {
                    window.TasksModule?.cancelAllNotifications?.();
                    Storage.clearAll();
                    this.refreshAll();
                    this.showToast('Todos los datos han sido eliminados.', 'info');
                    this.switchView('subjects');
                }
            });

            // Cálculo inicial de métricas de almacenamiento y aplicación de tipografía
            this.updateStorageMetrics();
            this.applyFontFamily(Storage.getFontFamily?.() || 'calibri');
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
