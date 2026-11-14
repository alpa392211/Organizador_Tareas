/**
 * Aplicación Principal - Orquestador
 * Integra UI, navegación por Drawer, perfil de usuario y periodo manual,
 * ciclo escolar obligatorio, notas rápidas con galería de fotos,
 * baúl de archivados con depuración de 60 días y telarañas decorativas,
 * selector de 5 tipografías mediante botones interactivos, sistema háptico,
 * botón central de atajo de acción rápida personalizable y widgets nativos.
 */

(() => {
    const VAULT_CATALOG = {
        'APOLLO11': {
            id: 'APOLLO11',
            name: 'Misión Espacial Apollo 11',
            icon: '🚀',
            category: 'PROTOCOLO CÓSMICO',
            themeId: 'apollo',
            badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
            phrase: '«Un pequeño paso para el estudiante, un gran salto para tu semestre»',
            description: 'Has desbloqueado el diseño cósmico interestelar. Despliega fondos galácticos profundos, propulsores 🚀 en botones principales y lluvia de cohetes espaciales al completar asignaciones.',
            actionLabel: 'Activar Tema Apollo 11 🚀',
            themeClass: 'theme-apollo',
            supportsRockets: true
        },
        '06062009': {
            id: '06062009',
            name: 'Starlight Tribute ✨',
            icon: '✨',
            category: 'DEDICATORIA PRIVADA',
            themeId: 'starlight',
            badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-400/30',
            phrase: 'Tu eres alguien especial por conocer esta fecha...',
            description: 'Bajo el manto de las estrellas, este protocolo conmemorativo rinde homenaje a un lazo eterno que trasciende el tiempo y el espacio. Activa el diseño cósmico Starlight con acentos celestiales y violeta nocturno.',
            actionLabel: 'Activar Tema Starlight ✨',
            themeClass: 'theme-starlight',
            supportsRockets: false
        },
        'EDUARDO': {
            id: 'EDUARDO',
            name: 'Protocolo Creador VIP',
            icon: '👑',
            category: 'CREDENCIAL DE FUNDADOR',
            themeId: 'eduardo-gold',
            badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
            phrase: '«Reconocimiento de Autoría y Excelencia al Creador»',
            description: '¡Bienvenido! Has activado la credencial de Fundador y el Tema Maestro Dorado, reservado con acabados en oro pulido, acentos de corona VIP 👑 y bordes de máxima distinción estudiantil.',
            actionLabel: 'Activar Tema Maestro Dorado 👑',
            themeClass: 'theme-eduardo-gold',
            supportsRockets: false
        },
        'PINGUINO': {
            id: 'PINGUINO',
            name: 'Edición Glacial Pingüino',
            icon: '🐧',
            category: 'VERSIÓN MAESTRA',
            themeId: 'penguin',
            badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
            phrase: '«Elegancia polar, resistencia bajo cero y concentración absoluta»',
            description: 'Tema conmemorativo polar glacial. Acentos en cian polar glacial, pingüinos vigilando tus metas y escarcha visual en recordatorios.',
            actionLabel: 'Activar Modo Polar Pingüino 🐧',
            themeClass: 'theme-penguin',
            supportsRockets: false
        },
        'RETRO80S': {
            id: 'RETRO80S',
            name: 'Synthwave Neon 1984',
            icon: '🌆',
            category: 'RETROFUTURISMO',
            themeId: 'synthwave',
            badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/30',
            phrase: '«Conduciendo por la autopista digital bajo el sol poniente de neón»',
            description: 'Estética cyberpunk retro con degradados en magenta electrizante, violeta y cian brillante. Perfecto para sesiones de programación o estudio con música lo-fi.',
            actionLabel: 'Activar Synthwave Neón 🌆',
            themeClass: 'theme-synthwave',
            supportsRockets: false
        },
        'MATRIX99': {
            id: 'MATRIX99',
            name: 'Terminal Matrix / Cyberspace',
            icon: '🟢',
            category: 'HACKER PROTOCOL',
            themeId: 'matrix',
            badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
            phrase: '«Despierta, estudiante... Matrix tiene tus materias»',
            description: 'Modo consola monocromática verde fósforo sobre negro azabache puro. Tipografía monoespaciada con aura de terminal UNIX y cero distracciones.',
            actionLabel: 'Entrar a la Matrix 🟢',
            themeClass: 'theme-matrix',
            supportsRockets: false
        },
        'ZENPEACE': {
            id: 'ZENPEACE',
            name: 'Jardín Zen / Cerezo Sakura',
            icon: '🌸',
            category: 'BIENESTAR Y PAZ',
            themeId: 'sakura',
            badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
            phrase: '«Calma mental y serenidad ante los exámenes finales»',
            description: 'Paleta pastel inspirada en la flor de cerezo y jardines tradicionales de Kioto. Suaviza la fatiga visual con tonos rosa tenue y verde salvia pacífico.',
            actionLabel: 'Activar Jardín Zen 🌸',
            themeClass: 'theme-sakura',
            supportsRockets: false
        },
        'COFFEE42': {
            id: 'COFFEE42',
            name: 'Modo Barista / Dark Roast',
            icon: '☕',
            category: 'ESTUDIO NOCTURNO',
            themeId: 'coffee',
            badgeClass: 'bg-amber-600/20 text-amber-300 border-amber-600/30',
            phrase: '«La respuesta a la vida, el universo y una taza de café perfecta»',
            description: 'Gama aromática de moka, caramelo y café tostado profundo. Diseñado para acompañar tus largas noches de lecturas académicas con una sensación cálida y acogedora.',
            actionLabel: 'Servir Café Tostado ☕',
            themeClass: 'theme-coffee',
            supportsRockets: false
        },
        'ARCADE90': {
            id: 'ARCADE90',
            name: 'Arcade Gamer 8-Bit',
            icon: '👾',
            category: 'NOSTALGIA RETRO',
            themeId: 'arcade',
            badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
            phrase: '«INSERT COIN TO STUDY • HIGH SCORE: 10.0 EN CÁLCULO»',
            description: 'Viaja a los salones recreativos de los 90. Insignias pixeladas, bordes llamativos retro y efectos de gamificación en el seguimiento de tus metas.',
            actionLabel: 'Start Game 8-Bit 👾',
            themeClass: 'theme-arcade',
            supportsRockets: false
        },
        'STUDYMAX': {
            id: 'STUDYMAX',
            name: 'Hiperenfoque / Modo Einstein',
            icon: '⚡',
            category: 'ALTO RENDIMIENTO',
            themeId: 'hyperfocus',
            badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
            phrase: '«Estado de flujo puro: 100% productividad, 0% procrastinación»',
            description: 'Tema azul marino profundo de alto contraste optimizado para máxima legibilidad científica. Elimina elementos superfluos para entrar en sesión de estudio profundo.',
            actionLabel: 'Activar Hiperenfoque ⚡',
            themeClass: 'theme-hyperfocus',
            supportsRockets: false
        },
        'READABLE': {
            id: 'READABLE',
            name: 'Tipografía Lexend Hiperlegible',
            icon: '📖',
            category: 'TIPOGRAFÍA SECRETA',
            type: 'font',
            fontKey: 'readable',
            badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-400/30',
            phrase: '«Claridad sin esfuerzo para cada palabra y cada examen»',
            description: 'Desbloquea la tipografía Lexend, diseñada para reducir la fatiga ocular y facilitar la lectura fluida en sesiones maratónicas de estudio.',
            actionLabel: 'Aplicar Tipografía Lexend 📖',
            themeClass: null,
            supportsRockets: false
        },
        'FIRACODE': {
            id: 'FIRACODE',
            name: 'Tipografía Fira Code Hacker',
            icon: '💻',
            category: 'TIPOGRAFÍA SECRETA',
            type: 'font',
            fontKey: 'firacode',
            badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
            phrase: '«01000011 01001111 01000100 01000101 — Todo bajo control»',
            description: 'Convierte toda la interfaz en una terminal de desarrollo con Fira Code. Para estudiantes de ingeniería y devoradores de código.',
            actionLabel: 'Aplicar Fira Code Mono 💻',
            themeClass: null,
            supportsRockets: false
        },
        'PLAYFAIR': {
            id: 'PLAYFAIR',
            name: 'Tipografía Playfair Imperial',
            icon: '🖋️',
            category: 'TIPOGRAFÍA SECRETA',
            type: 'font',
            fontKey: 'playfair',
            badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
            phrase: '«La excelencia académica escrita con remates de alta distinción»',
            description: 'Tipografía con serifa editorial de alto contraste, inspirada en las imprentas europeas del siglo XVIII. Dale a tu horario el porte de un manuscrito de honor.',
            actionLabel: 'Aplicar Playfair Imperial 🖋️',
            themeClass: null,
            supportsRockets: false
        },
        'HANDNOTE': {
            id: 'HANDNOTE',
            name: 'Tipografía Caveat Cuaderno',
            icon: '📝',
            category: 'TIPOGRAFÍA SECRETA',
            type: 'font',
            fontKey: 'caveat',
            badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
            phrase: '«Como los mejores apuntes en la libreta de tu compañero estrella»',
            description: 'Aura manuscrita casual y cálida con la fuente Caveat. Hace que cada tarea y apunte se sienta auténtico, cercano y libre de estrés.',
            actionLabel: 'Aplicar Caveat Cuaderno 📝',
            themeClass: null,
            supportsRockets: false
        },
        'ORBITRON': {
            id: 'ORBITRON',
            name: 'Tipografía Orbitron Cyber HUD',
            icon: '🛸',
            category: 'TIPOGRAFÍA SECRETA',
            type: 'font',
            fontKey: 'orbitron',
            badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
            phrase: '«SISTEMAS ACADÉMICOS 100% OPERATIVOS • COORDENADAS FIJADAS»',
            description: 'Diseño geométrico cibernético angular. Transforma tu organizador en el panel de control táctico de una nave de exploración espacial.',
            actionLabel: 'Aplicar Orbitron Cyber 🛸',
            themeClass: null,
            supportsRockets: false
        },
        'KRONOS99': {
            id: 'KRONOS99',
            name: '⚡ Llave Maestra Universal (KRONOS99)',
            icon: '⚡',
            category: 'PROTOCOLO MAESTRO • ACCESO TOTAL',
            badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
            phrase: '«ACCESO TOTAL CONCEDIDO • 100% PROTOCOLOS Y FUENTES DESBLOQUEADOS»',
            description: '¡Has descifrado la clave maestra universal! Se han desbloqueado simultáneamente los 10 temas de personalización, el modo monocromático, el tributo estelar Starlight y las 5 familias tipográficas secretas en tu organizador.',
            actionLabel: 'Explorar Bóveda Completa 🔓',
            themeId: null,
            themeClass: null,
            supportsRockets: false,
            isMasterCode: true
        }
    };

    const VAULT_ALIASES = {
        // APOLLO11
        'APOLLO11': 'APOLLO11', 'APOLLO': 'APOLLO11', 'APOLO11': 'APOLLO11', 'APOL-LO11': 'APOLLO11', 'APOLLO_1': 'APOLLO11',
        // 06062009
        '06062009': '06062009', '6062009': '06062009', '0606-2009': '06062009', '0606/2009': '06062009', '060609': '06062009', '06-06-2009': '06062009', '06/06/2009': '06062009',
        // EDUARDO (7 letters!)
        'EDUARDO': 'EDUARDO', 'EDUARDO1': 'EDUARDO', 'EDUARDO_': 'EDUARDO', 'EDUARD0': 'EDUARDO',
        '0EDUARDO': 'EDUARDO', 'EDWARD00': 'EDUARDO', 'EDUARD': 'EDUARDO', 'EDWARDO': 'EDUARDO', 'EDUARDOO': 'EDUARDO',
        // PINGUINO
        'PINGUINO': 'PINGUINO', 'PENGUIN1': 'PINGUINO', 'PINGUIN0': 'PINGUINO', 'PENGUIN': 'PINGUINO', 'PINGUIN': 'PINGUINO',
        // RETRO80S
        'RETRO80S': 'RETRO80S', 'SYNTHWAV': 'RETRO80S', 'NEON1984': 'RETRO80S', 'RETRO80_': 'RETRO80S', 'RETRO80': 'RETRO80S',
        // MATRIX99
        'MATRIX99': 'MATRIX99', 'NEOHACKR': 'MATRIX99', 'CYBERNET': 'MATRIX99', 'MATRIX_1': 'MATRIX99', 'MATRIX': 'MATRIX99',
        // ZENPEACE
        'ZENPEACE': 'ZENPEACE', 'SAKURA01': 'ZENPEACE', 'MINIMAL_': 'ZENPEACE', 'ZENPEAC_': 'ZENPEACE', 'ZENPEAC': 'ZENPEACE',
        // COFFEE42
        'COFFEE42': 'COFFEE42', 'CAFECITO': 'COFFEE42', 'ESPRESSO': 'COFFEE42', 'COFFEE__': 'COFFEE42', 'COFFEE': 'COFFEE42',
        // ARCADE90
        'ARCADE90': 'ARCADE90', 'PIXEL8BT': 'ARCADE90', 'GAMEBOY_': 'ARCADE90', 'ARCADE__': 'ARCADE90', 'ARCADE': 'ARCADE90',
        // STUDYMAX
        'STUDYMAX': 'STUDYMAX', 'EINSTEIN': 'STUDYMAX', 'HYPERFOC': 'STUDYMAX', 'STUDY___': 'STUDYMAX', 'STUDY': 'STUDYMAX',
        // READABLE (Lexend)
        'READABLE': 'READABLE', 'LEXEND24': 'READABLE', 'DYSLEXIC': 'READABLE', 'LEXEND__': 'READABLE', 'READWELL': 'READABLE', 'LECTURA_': 'READABLE', 'LEXEND': 'READABLE',
        // FIRACODE (Fira Code)
        'FIRACODE': 'FIRACODE', 'FIRA____': 'FIRACODE', 'HACKER88': 'FIRACODE', 'DEVSPACE': 'FIRACODE', 'MONOCODE': 'FIRACODE', 'TERMINAL': 'FIRACODE', 'FIRA': 'FIRACODE',
        // PLAYFAIR (Playfair Display)
        'PLAYFAIR': 'PLAYFAIR', 'CINZEL99': 'PLAYFAIR', 'ROYALFNT': 'PLAYFAIR', 'ELEGANCE': 'PLAYFAIR', 'IMPERIAL': 'PLAYFAIR', 'PLAYFA__': 'PLAYFAIR',
        // HANDNOTE (Caveat)
        'HANDNOTE': 'HANDNOTE', 'CAVEAT24': 'HANDNOTE', 'NOTEBOOK': 'HANDNOTE', 'APUNTES_': 'HANDNOTE', 'HANDMADE': 'HANDNOTE', 'CAVEAT__': 'HANDNOTE', 'CAVEAT': 'HANDNOTE',
        // ORBITRON (Orbitron)
        'ORBITRON': 'ORBITRON', 'CYBERFNT': 'ORBITRON', 'SCIFIHUD': 'ORBITRON', 'FUTURIST': 'ORBITRON', 'KINETIC_': 'ORBITRON', 'ORBITR__': 'ORBITRON',
        // KRONOS99 (Master Code - Unlocks everything)
        'KRONOS99': 'KRONOS99', 'KRONOS': 'KRONOS99', 'KRONOS__': 'KRONOS99', 'KRONOS_1': 'KRONOS99',
        'CIPHER99': 'KRONOS99', 'CIPHER': 'KRONOS99', 'X9CIPHER': 'KRONOS99',
        'PENGUINX': 'KRONOS99', 'PENGUIN_': 'KRONOS99',
        'ENIGMA88': 'KRONOS99', 'ENIGMA': 'KRONOS99',
        'OMEGA777': 'KRONOS99', 'OMEGA': 'KRONOS99',
        'MASTERKEY': 'KRONOS99', 'OVERRIDE': 'KRONOS99', 'ALLCODES': 'KRONOS99', 'DESBLOQUEAR': 'KRONOS99', 'GODMODE8': 'KRONOS99'
    };

    window.VaultCatalog = VAULT_CATALOG;
    window.VaultAliases = VAULT_ALIASES;

    class App {
        constructor() {
            this.currentView = 'subjects'; // 'subjects' | 'tasks' | 'notes' | 'calendar' | 'archive' | 'settings'
        }

        init() {
            const Storage = window.StorageModule;
            const SubjectsModule = window.SubjectsModule;
            const TasksModule = window.TasksModule;
            const CalendarModule = window.CalendarModule;
            const NotesModule = window.NotesModule;
            const ArchiveModule = window.ArchiveModule;
            const HapticsModule = window.HapticsModule;
            const NotificationsModule = window.NotificationsModule;
            const WidgetSyncModule = window.WidgetSyncModule;

            // 1. Limpieza de claves heredadas e inicialización en localStorage
            Storage.cleanupLegacyKeys?.();
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
            this.applySecretFeaturesUI();
            this.applySpecialThemeFromStorage();
            this.updateApolloRockets();

            // 4. Inicializar y aplicar tipografía seleccionada
            this.initFontFamily();

            // Bloqueo de orientación horizontal en teléfonos móviles (Portrait Lock)
            this.initOrientationLock();

            // 5. Inicializar submódulos
            SubjectsModule?.init?.();
            TasksModule?.init?.();
            NotesModule?.init?.();
            CalendarModule?.init?.();
            ArchiveModule?.init?.();
            WidgetSyncModule?.init?.();

            // 6. Configurar navegación, drawer, botón principal de atajo, modales y confirmación de salida
            this.setupNavigation();
            this.setupSidebarDrawer();
            this.setupBottomActionButton();
            this.setupModalsAndShortcuts();
            this.setupCycleWelcomeModal();
            this.setupExitModal();
            this.setupSettingsView();
            this.setupSecretVault();
            this.initPwa();

            // 7. Sincronizar UI inicial de perfil y periodo
            this.syncPeriodUI();

            // 8. Exponer funciones globales para interacción fluida entre módulos
            window.onDataChanged = () => this.refreshAll();
            window.showNotification = (msg, type) => this.showToast(msg, type);
            window.navigateToSubjects = () => this.switchView('subjects');
            window.navigateToTasks = () => this.switchView('tasks');
            window.navigateToNotes = () => this.switchView('notes');
            window.navigateToCalendar = () => this.switchView('calendar');
            window.navigateToArchive = () => this.switchView('archive');
            window.navigateToSettings = () => this.switchView('settings');
            window.promptPwaInstall = () => this.promptPwaInstall();
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
            if (initialView && ['subjects', 'tasks', 'notes', 'calendar', 'archive', 'settings', 'secret-codes'].includes(initialView)) {
                this.switchView(initialView);
            }
            if (urlParams.get('openDrawer') === '1') {
                setTimeout(() => document.getElementById('drawer-toggle-btn')?.click(), 50);
            }
            if (urlParams.get('openExit') === '1') {
                setTimeout(() => document.getElementById('app-exit-btn')?.click(), 50);
            }

            // 11. Renderizado inicial completo
            this.refreshAll();
            this.updateVaultProgressCard?.();
            requestAnimationFrame(() => this.updateNavIndicators?.(this.currentView));

            // 12. Flujo de inicio de presentación (Presentation-First Flow Ordering)
            // Si el onboarding NO se ha completado: NO solicitar notificaciones ni mostrar changelog; abrir bienvenida primero
            if (!Storage.isOnboardingCompleted?.() || !Storage.isCycleConfigured?.()) {
                this.openCycleWelcomeModal?.();
            } else {
                // Si el onboarding YA está completado:
                if (window.NotificationsModule?.requestPermission) {
                    window.NotificationsModule.requestPermission().catch(() => {});
                }

                // Comprobar changelog de versión 1.5.0
                const lastSeenVersion = Storage.getLastSeenVersion?.();
                if (lastSeenVersion !== '1.5.0') {
                    setTimeout(() => {
                        this.openChangelogModal?.();
                    }, 600);
                }
            }
        }

        refreshAll() {
            this.renderHeader();
            this.renderDrawer();
            this.syncPeriodUI();
            this.refreshSettingsProfileUI?.();
            window.SubjectsModule?.render?.();
            window.TasksModule?.render?.();
            window.NotesModule?.render?.();
            window.ArchiveModule?.render?.();
            this.updateHeaderStats();
            this.updateCycleBadges();
            this.updateStorageMetrics();
            window.WidgetSyncModule?.sync?.();
        }

        renderHeader() {
            const Storage = window.StorageModule;
            if (!Storage) return;

            const userName = (Storage.getUserName?.() || '').trim();
            const userPhoto = Storage.getUserPhoto?.() || '';
            const period = (Storage.getAcademicPeriod?.() || '').trim();

            const headerUserName = document.getElementById('header-user-name');
            if (headerUserName) {
                headerUserName.textContent = '';
                headerUserName.classList.add('hidden');
            }

            const headerInstName = document.getElementById('header-inst-name');
            if (headerInstName) {
                headerInstName.textContent = userName || 'Mi Organizador';
            }

            const headerPeriodSep = document.getElementById('header-period-sep');
            const headerInstPeriod = document.getElementById('header-inst-period');
            if (headerInstPeriod) {
                headerInstPeriod.textContent = period;
                headerInstPeriod.classList.toggle('hidden', !period);
            }
            if (headerPeriodSep) {
                headerPeriodSep.classList.toggle('hidden', !period);
            }

            const logoContainer = document.getElementById('header-inst-logo');
            if (logoContainer) {
                if (userPhoto) {
                    logoContainer.innerHTML = `<img src="${userPhoto}" class="w-10 h-10 rounded-2xl object-cover border border-slate-200/60 dark:border-slate-700/60 shadow-xs" alt="Foto de perfil">`;
                } else {
                    logoContainer.innerHTML = '<div class="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-slate-700 flex items-center justify-center text-lg leading-none select-none">👤</div>';
                }
            }
        }

        renderDrawer() {
            const Storage = window.StorageModule;
            if (!Storage) return;

            const userName = (Storage.getUserName?.() || '').trim();
            const userPhoto = Storage.getUserPhoto?.() || '';
            const period = (Storage.getAcademicPeriod?.() || '').trim();

            const drawerName = document.getElementById('drawer-inst-name');
            if (drawerName) drawerName.textContent = userName || 'Mi Organizador';

            const drawerPeriod = document.getElementById('drawer-inst-period');
            if (drawerPeriod) {
                drawerPeriod.textContent = period;
                drawerPeriod.classList.toggle('hidden', !period);
            }

            const drawerSlogan = document.getElementById('drawer-inst-slogan');
            if (drawerSlogan) {
                drawerSlogan.textContent = '';
                drawerSlogan.classList.add('hidden');
            }

            const drawerLogo = document.getElementById('drawer-inst-logo');
            if (drawerLogo) {
                if (userPhoto) {
                    drawerLogo.innerHTML = `<img src="${userPhoto}" class="w-12 h-12 rounded-2xl object-cover border border-slate-200/60 dark:border-slate-700/60 shadow-sm" alt="Foto de perfil">`;
                } else {
                    drawerLogo.innerHTML = '<div class="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-slate-700 flex items-center justify-center text-xl leading-none select-none">👤</div>';
                }
            }
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
            const navArchiveCount = document.getElementById('nav-archive-count');

            const archiveBadge = document.getElementById('archive-count-badge');

            if (drawerSubCount) drawerSubCount.textContent = subjects.length;
            if (drawerTaskCount) drawerTaskCount.textContent = pendingTasks;
            if (drawerNoteCount) drawerNoteCount.textContent = notes.length;
            if (drawerArchiveCount) drawerArchiveCount.textContent = archivedTasks.length + archivedNotes.length;

            if (navSubCount) navSubCount.textContent = subjects.length;
            if (navTaskCount) navTaskCount.textContent = pendingTasks;
            if (navNoteCount) navNoteCount.textContent = notes.length;
            if (navArchiveCount) navArchiveCount.textContent = archivedTasks.length + archivedNotes.length;

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
                        if (cycle.endDate && todayStr > cycle.endDate) {
                            settingsCycleStatus.textContent = 'Terminado';
                            settingsCycleStatus.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-500 text-white';
                        } else if (cycle.startDate && todayStr < cycle.startDate) {
                            settingsCycleStatus.textContent = 'Programado';
                            settingsCycleStatus.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-600 text-white';
                        } else {
                            settingsCycleStatus.textContent = 'Ciclo Vigente';
                            settingsCycleStatus.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white';
                        }
                    }
                }
            }
        }

        /* ========================================================
           SISTEMA DE TIPOGRAFÍAS (5 Estándar + 5 Desbloqueables Bóveda)
           ======================================================== */
        initFontFamily() {
            const Storage = window.StorageModule;
            const font = Storage.getFontFamily?.() || 'calibri';
            this.syncSettingsFontButtons();
            this.applyFontFamily(font);
        }

        syncSettingsFontButtons() {
            const grid = document.getElementById('settings-font-buttons-grid');
            if (!grid) return;

            const Storage = window.StorageModule;
            const fontDefs = [
                {
                    codeId: 'READABLE',
                    fontKey: 'readable',
                    name: 'Lexend (Accesible)',
                    icon: '📖',
                    desc: 'Hiperlegible, lectura descansada y máxima accesibilidad.',
                    fontClass: ''
                },
                {
                    codeId: 'FIRACODE',
                    fontKey: 'firacode',
                    name: 'Fira Code (Hacker)',
                    icon: '💻',
                    desc: 'Monoespaciada hacker terminal para código.',
                    fontClass: 'font-mono'
                },
                {
                    codeId: 'PLAYFAIR',
                    fontKey: 'playfair',
                    name: 'Playfair Display',
                    icon: '🖋️',
                    desc: 'Editorial serif clásica de alta distinción académica.',
                    fontClass: 'font-serif'
                },
                {
                    codeId: 'HANDNOTE',
                    fontKey: 'caveat',
                    name: 'Caveat (Cuaderno)',
                    icon: '📝',
                    desc: 'Manuscrita casual, como notas en libreta.',
                    fontClass: ''
                },
                {
                    codeId: 'ORBITRON',
                    fontKey: 'orbitron',
                    name: 'Orbitron (Cyber HUD)',
                    icon: '🛸',
                    desc: 'Futurista angular con display cibernético táctico.',
                    fontClass: ''
                }
            ];

            const currentFont = Storage.getFontFamily ? Storage.getFontFamily() : 'calibri';

            fontDefs.forEach(item => {
                const isUnlocked = Storage.isCodeUnlocked ? Storage.isCodeUnlocked(item.codeId) : false;
                let btn = grid.querySelector(`[data-font-btn="${item.fontKey}"]`);

                if (isUnlocked) {
                    if (!btn) {
                        btn = document.createElement('button');
                        btn.type = 'button';
                        btn.setAttribute('data-font-btn', item.fontKey);
                        btn.setAttribute('data-vault-font', 'true');
                        btn.className = `font-choice-btn tap-effect p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${item.fontClass}`;
                        btn.innerHTML = `
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>${item.icon}</span>
                                    <span>${item.name}</span>
                                </span>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/30">✨ Secreto</span>
                            </div>
                            <span class="text-[11px] text-slate-500 dark:text-slate-400 font-sans">${item.desc}</span>
                        `;
                        btn.onclick = () => {
                            Storage.setFontFamily(item.fontKey);
                            this.applyFontFamily(item.fontKey);
                            window.HapticsModule?.light?.();
                            this.showToast(`Tipografía secreta aplicada: ${item.name}`, 'success');
                        };
                        grid.appendChild(btn);
                    }
                } else if (btn) {
                    btn.remove();
                }
            });

            this.applyFontFamily(currentFont);
        }

        initOrientationLock() {
            try {
                if (window.screen?.orientation?.lock) {
                    window.screen.orientation.lock('portrait').catch(() => {});
                }
            } catch (e) {}
        }

        applyFontFamily(fontKey) {
            const valid = [
                'calibri', 'times', 'montserrat', 'lora', 'poppins',
                'readable', 'firacode', 'playfair', 'caveat', 'orbitron'
            ];
            const activeFont = valid.includes(fontKey) ? fontKey : 'calibri';

            // Aplicar data-font en la etiqueta raíz y body
            document.documentElement.setAttribute('data-font', activeFont);
            document.body.setAttribute('data-font', activeFont);

            const labels = {
                calibri: 'Calibri',
                times: 'Times New Roman',
                montserrat: 'Montserrat',
                lora: 'Lora',
                poppins: 'Poppins',
                readable: 'Lexend (Accesible)',
                firacode: 'Fira Code (Hacker)',
                playfair: 'Playfair Display (Imperial)',
                caveat: 'Caveat (Cuaderno)',
                orbitron: 'Orbitron (Cyber HUD)'
            };

            const descs = {
                calibri: 'Tipografía institucional clara, moderna y de lectura descansada.',
                times: 'Serif formal y tradicional para estilo académico formal.',
                montserrat: 'Geométrica estilizada con excelente legibilidad en títulos.',
                lora: 'Serif literaria cálida, sofisticada y con estilo editorial.',
                poppins: 'Moderna, geométrica y amigable con proporciones equilibradas.',
                readable: 'Diseño hiperlegible de máxima claridad visual para reducir la fatiga en sesiones largas.',
                firacode: 'Monoespaciada de desarrollo estilo terminal, ideal para futuros ingenieros y programadores.',
                playfair: 'Serif editorial de alto contraste con remates clásicos y aura de prestigio académico.',
                caveat: 'Estilo manuscrito fluido y cálido que emula los mejores apuntes en tu libreta de estudio.',
                orbitron: 'Geométrica futurista HUD con estética cibernética de panel táctico espacial.'
            };

            const fontPill = document.getElementById('settings-font-pill');
            if (fontPill) {
                fontPill.textContent = labels[activeFont] || activeFont;
            }

            const previewDesc = document.getElementById('settings-font-preview-desc');
            if (previewDesc) {
                previewDesc.textContent = descs[activeFont] || '';
            }

            // Sincronizar estilo visual de los botones de selección directa
            document.querySelectorAll('#settings-font-buttons-grid [data-font-btn]').forEach(btn => {
                const isSelected = btn.dataset.fontBtn === activeFont;
                const fontType = btn.dataset.fontBtn;
                const fontClass = (fontType === 'times' || fontType === 'playfair') ? 'font-serif' : (fontType === 'firacode' ? 'font-mono' : '');

                if (isSelected) {
                    btn.className = `font-choice-btn tap-effect p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ring-2 ring-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-500 shadow-xs ${fontClass}`;
                } else {
                    btn.className = `font-choice-btn tap-effect p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400 ${fontClass}`;
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

        isSpecialThemeActive() {
            const Storage = window.StorageModule;
            const current = Storage?.getActiveSpecialTheme ? Storage.getActiveSpecialTheme() : 'default';
            // Únicamente el modo monocromático ('gray' / 'theme-gray') permite modo claro sin bloquearlo
            return current && current !== 'default' && current !== 'gray' && current !== 'theme-gray';
        }

        applyTheme(theme, save = true) {
            const Storage = window.StorageModule;
            // Si hay un tema especial activo (salvo modo monocromático), el modo claro no funciona y se fuerza modo oscuro
            const effectiveTheme = this.isSpecialThemeActive() ? 'dark' : theme;
            const isDark = effectiveTheme === 'dark';

            // Alternar clase dark en la etiqueta raíz <html> para Tailwind
            document.documentElement.classList.toggle('dark', isDark);

            if (save) {
                Storage.setTheme(effectiveTheme);
            }

            this.updateThemeUI(effectiveTheme, !Storage.getTheme());
            this.setupBottomActionButton();
            if (window.CalendarModule?.render) {
                window.CalendarModule.render();
            }
        }

        setTheme(themeMode) {
            const Storage = window.StorageModule;
            window.HapticsModule?.light();

            if (this.isSpecialThemeActive()) {
                if (themeMode === 'light') {
                    window.HapticsModule?.warning?.();
                    this.showToast('⚠️ El Modo Claro no está disponible con este tema especial activo. Desactívalo en Bóveda para volver al modo claro.', 'warning');
                    return;
                }
            }

            if (themeMode === 'auto') {
                Storage.setTheme(null);
                const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                const effectiveMode = this.isSpecialThemeActive() ? 'dark' : (systemPrefersDark ? 'dark' : 'light');
                this.applyTheme(effectiveMode, false);
                this.showToast('Tema ajustado automáticamente según tu sistema.', 'info');
            } else {
                this.applyTheme(themeMode, true);
                this.showToast(`Modo ${themeMode === 'dark' ? 'Oscuro' : 'Claro'} activado.`, 'success');
            }
        }

        toggleTheme() {
            if (this.isSpecialThemeActive()) {
                window.HapticsModule?.warning?.();
                this.showToast('⚠️ El Modo Claro está bloqueado mientras este tema especial esté activo.', 'warning');
                return;
            }
            const isCurrentlyDark = document.documentElement.classList.contains('dark');
            const newTheme = isCurrentlyDark ? 'light' : 'dark';
            this.setTheme(newTheme);
        }

        updateThemeUI(activeTheme, isAuto = false) {
            const isDark = activeTheme === 'dark';
            const isLockedToDark = this.isSpecialThemeActive();

            // Sincronizar iconos de Sol y Luna en Header explícitamente
            const sunIcon = document.getElementById('theme-icon-sun');
            const moonIcon = document.getElementById('theme-icon-moon');
            if (sunIcon) sunIcon.style.display = isDark ? 'block' : 'none';
            if (moonIcon) moonIcon.style.display = isDark ? 'none' : 'block';

            const pill = document.getElementById('settings-theme-pill');
            if (pill) {
                if (isLockedToDark) {
                    pill.textContent = '🌙 Modo Oscuro (Bloqueado por Tema Especial)';
                } else if (isAuto) {
                    pill.textContent = `💻 Sistema (${isDark ? 'Oscuro' : 'Claro'})`;
                } else {
                    pill.textContent = isDark ? '🌙 Modo Oscuro' : '☀️ Modo Claro';
                }
            }

            const lightBtn = document.getElementById('settings-theme-light');
            const darkBtn = document.getElementById('settings-theme-dark');
            const autoBtn = document.getElementById('settings-theme-auto');

            if (lightBtn) {
                if (isLockedToDark) {
                    lightBtn.disabled = true;
                    lightBtn.classList.add('opacity-40', 'cursor-not-allowed');
                    lightBtn.title = 'Modo Claro bloqueado: los temas clasificados de la bóveda requieren Modo Oscuro.';
                } else {
                    lightBtn.disabled = false;
                    lightBtn.classList.remove('opacity-40', 'cursor-not-allowed');
                    lightBtn.title = 'Activar Modo Claro';
                }
            }

            const activeBtnClass = 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20';
            const inactiveBtnClass = 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700';

            const updateBtn = (btn, isActive) => {
                if (!btn) return;
                if (isActive) {
                    btn.className = `tap-effect p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeBtnClass}`;
                } else {
                    btn.className = `tap-effect p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${inactiveBtnClass}${isLockedToDark && btn === lightBtn ? ' opacity-40 cursor-not-allowed' : ''}`;
                }
            };

            updateBtn(lightBtn, !isAuto && !isDark && !isLockedToDark);
            updateBtn(darkBtn, (!isAuto && isDark) || isLockedToDark);
            updateBtn(autoBtn, isAuto && !isLockedToDark);
        }

        applyGrayMode(enabled) {
            const Storage = window.StorageModule;
            if (typeof enabled === 'boolean') {
                Storage.setGrayModeEnabled(enabled);
            }
            const isGray = Storage.getGrayModeEnabled();
            document.documentElement.classList.toggle('theme-gray', isGray);
            document.body.classList.toggle('theme-gray', isGray);
            const toggle = document.getElementById('settings-gray-mode-toggle');
            if (toggle) toggle.checked = isGray;
            const grayBtn = document.getElementById('settings-gray-mode-btn');
            if (grayBtn) {
                grayBtn.textContent = isGray ? 'Desactivar' : 'Activar';
                grayBtn.className = `tap-effect shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isGray
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30'
                        : 'bg-purple-600/30 text-purple-900 dark:text-purple-200 border border-purple-500/30 hover:bg-purple-600/50'
                }`;
            }

            // Actualizar inmediatamente el botón central inferior y componentes visuales
            this.setupBottomActionButton();
            if (window.CalendarModule?.render) {
                window.CalendarModule.render();
            }
        }

        applySecretFeaturesUI() {
            const Storage = window.StorageModule;
            const secretSection = document.getElementById('secret-theme-controls');
            if (secretSection) {
                // Las funciones secretas viven dentro del inventario de la bóveda.
                secretSection.classList.add('hidden');
            }

            const updateSecretButtons = () => {
                const isGrayActive = Storage.getGrayModeEnabled();
                const grayBtn = document.getElementById('settings-gray-mode-btn');
                if (grayBtn) {
                    grayBtn.textContent = isGrayActive ? 'Desactivar' : 'Activar';
                    grayBtn.className = `tap-effect shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isGrayActive
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30'
                            : 'bg-purple-600/30 text-purple-900 dark:text-purple-200 border border-purple-500/30 hover:bg-purple-600/50'
                    }`;
                }
            };

            const grayToggle = document.getElementById('settings-gray-mode-toggle');
            if (grayToggle) {
                grayToggle.checked = Storage.getGrayModeEnabled();
                grayToggle.onchange = (e) => {
                    window.HapticsModule?.light();
                    this.applyGrayMode(e.target.checked);
                    updateSecretButtons();
                    this.showToast(e.target.checked ? 'Modo Monocromático activado.' : 'Modo Monocromático desactivado.', 'info');
                };
            }

            const grayBtn = document.getElementById('settings-gray-mode-btn');
            if (grayBtn) {
                grayBtn.onclick = () => {
                    window.HapticsModule?.light();
                    const next = !Storage.getGrayModeEnabled();
                    this.applyGrayMode(next);
                    if (grayToggle) grayToggle.checked = next;
                    updateSecretButtons();
                    this.renderVaultInventory?.();
                    this.showToast(next ? 'Modo Monocromático activado.' : 'Modo Monocromático desactivado.', 'info');
                };
            }

            this.applyGrayMode(Storage.getGrayModeEnabled());
            updateSecretButtons();
        }

        syncPeriodUI() {
            const Storage = window.StorageModule;
            if (!Storage) return;

            const period = (Storage.getAcademicPeriod?.() || '').trim();
            const headerPeriodSep = document.getElementById('header-period-sep');
            const headerPeriodLabel = document.getElementById('header-inst-period');
            const drawerPeriodLabel = document.getElementById('drawer-inst-period');
            const settingsPeriodBadge = document.getElementById('settings-inst-period-badge');
            const settingsBadgePill = document.getElementById('settings-inst-badge-pill');
            const customPeriodInput = document.getElementById('custom-period-input');
            const clearPeriodBtn = document.getElementById('clear-custom-period-btn');

            if (headerPeriodLabel) {
                headerPeriodLabel.textContent = period;
                headerPeriodLabel.classList.toggle('hidden', !period);
            }
            if (headerPeriodSep) {
                headerPeriodSep.classList.toggle('hidden', !period);
            }
            if (drawerPeriodLabel) {
                drawerPeriodLabel.textContent = period;
                drawerPeriodLabel.classList.toggle('hidden', !period);
            }
            if (settingsPeriodBadge) {
                settingsPeriodBadge.textContent = period;
                settingsPeriodBadge.classList.toggle('hidden', !period);
            }
            if (settingsBadgePill) {
                settingsBadgePill.textContent = period;
                settingsBadgePill.classList.toggle('hidden', !period);
            }
            if (customPeriodInput) {
                customPeriodInput.value = period;
            }
            if (clearPeriodBtn) {
                clearPeriodBtn.classList.toggle('hidden', !period);
            }
        }

        setAcademicPeriod(period) {
            const Storage = window.StorageModule;
            const cleanPeriod = typeof period === 'string' ? period.trim() : '';
            window.HapticsModule?.light();
            Storage.setAcademicPeriod(cleanPeriod);
            this.syncPeriodUI();
            this.showToast(
                cleanPeriod ? `Periodo actualizado: ${cleanPeriod}` : 'Periodo ocultado de la cabecera.',
                'info'
            );
        }

        setupNavigation() {
            const navButtons = document.querySelectorAll('[data-view-target]');
            navButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const targetView = btn.dataset.viewTarget;
                    this.switchView(targetView);
                    this.closeSidebarDrawer?.();
                });
            });

            if (!this._navResizeBound) {
                this._navResizeBound = true;
                let resizeRaf = null;
                window.addEventListener('resize', () => {
                    if (resizeRaf) cancelAnimationFrame(resizeRaf);
                    resizeRaf = requestAnimationFrame(() => {
                        this.updateNavIndicators(this.currentView);
                    });
                });
                document.fonts?.ready?.then(() => {
                    requestAnimationFrame(() => this.updateNavIndicators(this.currentView));
                });
            }

            requestAnimationFrame(() => this.updateNavIndicators(this.currentView));
        }

        updateNavIndicators(viewName = this.currentView) {
            const targetView = viewName || this.currentView;
            const prefersReducedMotion = Boolean(
                window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
            );

            const isVisible = (el) => {
                if (!el || el.offsetParent === null) return false;
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            };

            const positionIndicator = (container, indicator, activeBtn) => {
                if (!indicator) return;
                if (!container || !isVisible(container) || !activeBtn || !isVisible(activeBtn)) {
                    indicator.style.opacity = '0';
                    return;
                }
                const width = activeBtn.offsetWidth;
                const height = activeBtn.offsetHeight;
                if (width <= 0 || height <= 0) {
                    indicator.style.opacity = '0';
                    return;
                }
                indicator.style.transition = prefersReducedMotion ? 'none' : '';
                indicator.style.width = `${width}px`;
                indicator.style.height = `${height}px`;
                indicator.style.transform = `translate3d(${activeBtn.offsetLeft}px, ${activeBtn.offsetTop}px, 0)`;
                indicator.style.opacity = '1';
            };

            const desktopNav = document.getElementById('desktop-nav-pill');
            const desktopIndicator = document.getElementById('desktop-nav-indicator');
            const desktopActiveBtn = desktopNav?.querySelector(`[data-view-target="${targetView}"]`) || null;
            positionIndicator(desktopNav, desktopIndicator, desktopActiveBtn);

            const bottomContainer = document.querySelector('#bottom-nav .bottom-nav-inner');
            const bottomIndicator = document.getElementById('bottom-nav-indicator');
            const bottomActiveBtn = bottomContainer?.querySelector(`[data-view-target="${targetView}"]`) || null;
            positionIndicator(bottomContainer, bottomIndicator, bottomActiveBtn);
        }

        closeAllSettingsSubmenus() {
            document.querySelectorAll('.settings-accordion-card.open').forEach(c => c.classList.remove('open'));
        }

        switchView(viewName) {
            this.currentView = viewName;
            window.HapticsModule?.light();
            // v1.4.4: al cambiar de vista, todos los submenús de ajustes se cierran automáticamente.
            this.closeAllSettingsSubmenus();

            const views = ['dashboard', 'subjects', 'tasks', 'notes', 'calendar', 'archive', 'settings', 'secret-codes'];
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

            // Actualizar botones de navegación activos e indicadores flotantes
            document.querySelectorAll('[data-view-target]').forEach(btn => {
                const isMatch = btn.dataset.viewTarget === viewName;
                if (btn.classList.contains('nav-link-btn')) {
                    if (isMatch) {
                        btn.classList.add('nav-link-active', 'text-indigo-600', 'dark:text-indigo-400', 'font-bold');
                        btn.classList.remove('text-slate-600', 'dark:text-slate-400', 'font-semibold', 'bg-white', 'dark:bg-slate-700', 'shadow-xs');
                        if (btn.closest('#sidebar-drawer')) {
                            btn.classList.add('drawer-nav-active');
                        }
                    } else {
                        btn.classList.remove('nav-link-active', 'drawer-nav-active', 'text-indigo-600', 'dark:text-indigo-400', 'font-bold', 'bg-white', 'dark:bg-slate-700', 'shadow-xs');
                        btn.classList.add('text-slate-600', 'dark:text-slate-400', 'font-semibold');
                    }
                }
            });

            // Re-renderizado de la vista activada
            if (viewName === 'dashboard') {
                this.renderHeader?.();
                this.renderDrawer?.();
            }
            if (viewName === 'subjects') window.SubjectsModule?.render?.();
            if (viewName === 'tasks') window.TasksModule?.render?.();
            if (viewName === 'notes') window.NotesModule?.render?.();
            if (viewName === 'calendar') window.CalendarModule?.render?.();
            if (viewName === 'archive') window.ArchiveModule?.render?.();
            if (viewName === 'settings') {
                this.updateStorageMetrics();
                this.syncSettingsFontButtons();
            }
            if (viewName === 'secret-codes') this.renderVaultInventory();

            requestAnimationFrame(() => this.updateNavIndicators(viewName));

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
            const isGray = Storage.getGrayModeEnabled?.();
            const isDark = document.documentElement.classList.contains('dark');

            // Limpiar estilos en línea para permitir el acabado translúcido y resplandor
            circle.style.removeProperty('background');
            circle.style.removeProperty('border');
            circle.style.removeProperty('box-shadow');

            const labelColorClass = isGray
                ? 'text-slate-600 dark:text-slate-300'
                : (action === 'notes' ? 'text-amber-600 dark:text-amber-400' : (action === 'calendar' ? 'text-indigo-600 dark:text-indigo-400' : 'text-teal-600 dark:text-teal-400'));

            if (action === 'notes') {
                circle.className = 'w-14 h-14 rounded-full btn-gradient-note text-white flex items-center justify-center transition-all opacity-100';
                label.className = `text-[10px] font-extrabold ${labelColorClass} mt-1 truncate max-w-[80px]`;
                icon.innerHTML = `
                    <svg class="w-7 h-7 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                `;
                label.textContent = '+ Nota';
                mainBtn.onclick = () => {
                    window.HapticsModule?.medium();
                    window.NotesModule?.openAddModal?.();
                };
            } else if (action === 'calendar') {
                circle.className = 'w-14 h-14 rounded-full btn-gradient-subject text-white flex items-center justify-center transition-all opacity-100';
                label.className = `text-[10px] font-extrabold ${labelColorClass} mt-1 truncate max-w-[80px]`;
                icon.innerHTML = `
                    <svg class="w-7 h-7 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                `;
                label.textContent = 'Calendario';
                mainBtn.onclick = () => {
                    window.HapticsModule?.medium();
                    window.CalendarModule?.openModal?.();
                };
            } else {
                circle.className = 'w-14 h-14 rounded-full fab-gradient-action text-white flex items-center justify-center transition-all opacity-100';
                label.className = `text-[10px] font-extrabold ${labelColorClass} mt-1 truncate max-w-[80px]`;
                icon.innerHTML = `
                    <svg class="w-7 h-7 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                `;
                label.textContent = '+ Tarea';
                mainBtn.onclick = () => {
                    window.HapticsModule?.medium();
                    window.TasksModule?.openAddModal?.();
                };
            }

            this.updateApolloRockets?.();
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
                    this.closeCycleWelcomeModal?.();
                    this.closeExitModal?.();
                    this.closeSidebarDrawer?.();
                }
            });
        }

        /* ========================================================
           GESTIÓN DE FOTO DE PERFIL (REUTILIZABLE: INICIO + AJUSTES)
           ======================================================== */
        downsampleAndSaveProfilePhoto(file, onSaved) {
            const Storage = window.StorageModule;
            if (!file || (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|webp|gif|bmp)$/i))) {
                this.showToast('Solo se admiten archivos de imagen válidos.', 'warning');
                return;
            }

            const reader = new FileReader();
            reader.onerror = () => {
                this.showToast('Error al leer el archivo seleccionado.', 'error');
            };
            reader.onload = (e) => {
                const img = new Image();
                img.onerror = () => {
                    this.showToast('Archivo de imagen no válido o dañado.', 'error');
                };
                img.onload = () => {
                    const MAX_SIZE = 256;
                    let targetW = img.width;
                    let targetH = img.height;

                    if (targetW > MAX_SIZE || targetH > MAX_SIZE) {
                        if (targetW > targetH) {
                            targetH = Math.round((targetH * MAX_SIZE) / targetW);
                            targetW = MAX_SIZE;
                        } else {
                            targetW = Math.round((targetW * MAX_SIZE) / targetH);
                            targetH = MAX_SIZE;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = targetW;
                    canvas.height = targetH;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, targetW, targetH);

                    let dataUrl;
                    const isPng = file.type === 'image/png' || (file.name && file.name.toLowerCase().endsWith('.png'));
                    if (isPng) {
                        dataUrl = canvas.toDataURL('image/png');
                        if (dataUrl.length * 0.75 > 30 * 1024) {
                            dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        }
                    } else {
                        dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                        if (dataUrl.length * 0.75 > 30 * 1024) {
                            dataUrl = canvas.toDataURL('image/jpeg', 0.65);
                        }
                    }

                    try {
                        Storage?.setUserPhoto?.(dataUrl);
                    } catch (err) {
                        this.showToast(err?.message || 'No se pudo guardar la foto porque el almacenamiento está lleno.', 'error');
                        return;
                    }

                    this.renderHeader?.();
                    this.renderDrawer?.();
                    this.refreshSettingsProfileUI?.();
                    this.updateStorageMetrics?.();
                    window.HapticsModule?.light?.();

                    if (typeof onSaved === 'function') {
                        onSaved(dataUrl);
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        refreshSettingsProfileUI() {
            const Storage = window.StorageModule;
            if (!Storage) return;

            const userName = (Storage.getUserName?.() || '').trim();
            const savedPhoto = Storage.getUserPhoto?.() || '';

            const settingsName = document.getElementById('settings-inst-name');
            if (settingsName) {
                settingsName.textContent = userName || 'Mi Organizador';
            }

            const preview = document.getElementById('settings-photo-preview');
            const placeholder = document.getElementById('settings-photo-placeholder');
            const uploadBtn = document.getElementById('settings-photo-upload-btn');
            const clearBtn = document.getElementById('settings-photo-clear-btn');

            if (savedPhoto) {
                if (preview) {
                    preview.src = savedPhoto;
                    preview.classList.remove('hidden');
                }
                if (placeholder) placeholder.classList.add('hidden');
                if (clearBtn) clearBtn.classList.remove('hidden');
                if (uploadBtn) uploadBtn.textContent = 'Cambiar foto';
            } else {
                if (preview) {
                    preview.src = '';
                    preview.classList.add('hidden');
                }
                if (placeholder) placeholder.classList.remove('hidden');
                if (clearBtn) clearBtn.classList.add('hidden');
                if (uploadBtn) uploadBtn.textContent = 'Subir foto';
            }
        }

        /* ========================================================
           MODAL DE BIENVENIDA / CONFIGURACIÓN OBLIGATORIA DEL CICLO
           ======================================================== */
        setupCycleWelcomeModal() {
            const modal = document.getElementById('cycle-setup-modal');
            const form = document.getElementById('cycle-setup-welcome-form');
            const laterBtn = document.getElementById('welcome-cycle-later-btn');
            const startInput = document.getElementById('welcome-cycle-start');
            const endInput = document.getElementById('welcome-cycle-end');

            const welcomeUserNameInput = document.getElementById('welcome-user-name');

            const welcomePhotoInput = document.getElementById('welcome-photo-input');
            const welcomePhotoPreview = document.getElementById('welcome-photo-preview');
            const welcomePhotoPlaceholder = document.getElementById('welcome-photo-placeholder');
            const welcomePhotoClearBtn = document.getElementById('welcome-photo-clear-btn');

            const celebrationContainer = document.getElementById('onboarding-celebration-container');
            const progressBar = document.getElementById('onboarding-progress-bar');
            const celebrationMsg = document.getElementById('onboarding-celebration-msg');

            const Storage = window.StorageModule;

            if (!modal) return;

            let currentAccountType = Storage?.getAccountType?.() || 'organizer';

            // 1. Subida de Foto de Perfil mediante Canvas HTML5 (máx 256x256, <30KB)
            if (welcomePhotoInput) {
                const handlePhotoChange = (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        this.downsampleAndSaveProfilePhoto(file, (dataUrl) => {
                            if (welcomePhotoPreview) {
                                welcomePhotoPreview.src = dataUrl;
                                welcomePhotoPreview.classList.remove('hidden');
                            }
                            if (welcomePhotoPlaceholder) {
                                welcomePhotoPlaceholder.classList.add('hidden');
                            }
                            if (welcomePhotoClearBtn) {
                                welcomePhotoClearBtn.classList.remove('hidden');
                            }
                        });
                    }
                };
                welcomePhotoInput.addEventListener('change', handlePhotoChange);
                welcomePhotoInput.addEventListener('input', handlePhotoChange);
            }

            if (welcomePhotoClearBtn) {
                welcomePhotoClearBtn.onclick = () => {
                    window.HapticsModule?.light?.();
                    Storage?.setUserPhoto?.('');
                    if (welcomePhotoInput) welcomePhotoInput.value = '';
                    if (welcomePhotoPreview) {
                        welcomePhotoPreview.src = '';
                        welcomePhotoPreview.classList.add('hidden');
                    }
                    if (welcomePhotoPlaceholder) {
                        welcomePhotoPlaceholder.classList.remove('hidden');
                    }
                    welcomePhotoClearBtn.classList.add('hidden');
                    this.renderHeader?.();
                    this.renderDrawer?.();
                    this.refreshSettingsProfileUI?.();
                };
            }

            // 2. Apertura y Cierre de Onboarding
            const openWelcome = () => {
                modal.style.display = '';
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                document.body.classList.add('overflow-hidden');

                if (form) form.classList.remove('hidden');
                if (celebrationContainer) celebrationContainer.classList.add('hidden');
                if (celebrationMsg) celebrationMsg.classList.add('hidden');
                if (progressBar) progressBar.style.width = '0%';

                if (welcomeUserNameInput) {
                    welcomeUserNameInput.value = Storage?.getUserName?.() || '';
                }

                const savedPhoto = Storage?.getUserPhoto?.() || '';
                if (savedPhoto) {
                    if (welcomePhotoPreview) {
                        welcomePhotoPreview.src = savedPhoto;
                        welcomePhotoPreview.classList.remove('hidden');
                    }
                    if (welcomePhotoPlaceholder) welcomePhotoPlaceholder.classList.add('hidden');
                    if (welcomePhotoClearBtn) welcomePhotoClearBtn.classList.remove('hidden');
                } else {
                    if (welcomePhotoPreview) {
                        welcomePhotoPreview.src = '';
                        welcomePhotoPreview.classList.add('hidden');
                    }
                    if (welcomePhotoPlaceholder) welcomePhotoPlaceholder.classList.remove('hidden');
                    if (welcomePhotoClearBtn) welcomePhotoClearBtn.classList.add('hidden');
                }

                currentAccountType = Storage?.getAccountType?.() || 'organizer';

                const cycle = Storage?.getAcademicCycle?.() || {};
                if (startInput) startInput.value = cycle.startDate || '';
                if (endInput) endInput.value = cycle.endDate || '';
                if ((!startInput?.value || !endInput?.value) && Storage?.getDefaultCycleDates) {
                    const def = Storage.getDefaultCycleDates();
                    if (startInput && !startInput.value) startInput.value = def.startDate;
                    if (endInput && !endInput.value) endInput.value = def.endDate;
                }

                requestAnimationFrame(() => {
                    modal.classList.add('active');
                });
            };

            const closeWelcome = () => {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                    modal.style.display = 'none';
                    document.body.classList.remove('overflow-hidden');
                }, 200);
            };

            this.openCycleWelcomeModal = openWelcome;
            this.closeCycleWelcomeModal = closeWelcome;

            // 4. Animación de Celebración con Barra de Progreso y Transición a Dashboard
            const executeCelebration = (onFinish) => {
                if (form) form.classList.add('hidden');
                if (celebrationContainer) celebrationContainer.classList.remove('hidden');
                if (celebrationMsg) celebrationMsg.classList.remove('hidden');

                if (progressBar) {
                    progressBar.style.width = '0%';
                    void progressBar.offsetWidth; // forzar reflow
                    progressBar.style.width = '100%';
                }

                window.HapticsModule?.success?.();

                let animDuration = 1100;
                if (progressBar) {
                    const computedDuration = parseFloat(window.getComputedStyle(progressBar).transitionDuration);
                    if (computedDuration === 0) {
                        animDuration = 20;
                    }
                }

                setTimeout(() => {
                    if (typeof onFinish === 'function') onFinish();
                }, animDuration);
            };

            // 5. Envío del Formulario
            if (form) {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    if (this.isOnboardingSubmitting) return;

                    const s = startInput ? startInput.value : '';
                    const end = endInput ? endInput.value : '';
                    const userName = welcomeUserNameInput ? welcomeUserNameInput.value.trim() : '';

                    if (!userName) {
                        this.showToast('Por favor escribe tu nombre o apodo.', 'warning');
                        welcomeUserNameInput?.focus();
                        return;
                    }

                    if (!s || !end) {
                        this.showToast('Por favor confirma ambas fechas de tu ciclo.', 'warning');
                        return;
                    }
                    if (s > end) {
                        this.showToast('La fecha de inicio debe ser anterior a la de término.', 'error');
                        return;
                    }

                    this.isOnboardingSubmitting = true;

                    Storage?.setUserName?.(userName);
                    Storage?.setAccountType?.(currentAccountType);
                    Storage?.setAcademicCycle?.(s, end);

                    executeCelebration(() => {
                        Storage?.setCycleConfigured?.(true);
                        Storage?.setOnboardingCompleted?.(true);
                        closeWelcome();

                        this.switchView?.('subjects');
                        this.renderHeader?.();
                        this.renderDrawer?.();
                        this.refreshAll?.();

                        this.showToast('¡Configuración completada exitosamente! ¡Bienvenido!', 'success');

                        // Trigger deferred presentation flows
                        if (window.NotificationsModule?.requestPermission) {
                            window.NotificationsModule.requestPermission().catch(() => {});
                        }
                        const lastSeenVersion = Storage?.getLastSeenVersion?.();
                        if (lastSeenVersion !== '1.5.0') {
                            setTimeout(() => {
                                this.openChangelogModal?.();
                            }, 800);
                        }

                        this.isOnboardingSubmitting = false;
                    });
                };
            }

            // 6. Configuración con Ciclo Provisional
            if (laterBtn) {
                laterBtn.onclick = () => {
                    if (this.isOnboardingSubmitting) return;

                    const userName = welcomeUserNameInput ? welcomeUserNameInput.value.trim() : '';
                    if (userName) {
                        Storage?.setUserName?.(userName);
                    }

                    this.isOnboardingSubmitting = true;
                    Storage?.setAccountType?.(currentAccountType);
                    Storage?.setProvisionalCycle?.();

                    executeCelebration(() => {
                        Storage?.setCycleConfigured?.(true);
                        Storage?.setOnboardingCompleted?.(true);
                        closeWelcome();

                        this.switchView?.('subjects');
                        this.renderHeader?.();
                        this.renderDrawer?.();
                        this.refreshAll?.();

                        this.showToast('Bienvenido. Configuración completada con ciclo provisional.', 'info');

                        // Trigger deferred presentation flows
                        if (window.NotificationsModule?.requestPermission) {
                            window.NotificationsModule.requestPermission().catch(() => {});
                        }
                        const lastSeenVersion = Storage?.getLastSeenVersion?.();
                        if (lastSeenVersion !== '1.5.0') {
                            setTimeout(() => {
                                this.openChangelogModal?.();
                            }, 800);
                        }

                        this.isOnboardingSubmitting = false;
                    });
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
           VISTA DE CONFIGURACIONES (ACORDEONES COLAPSABLES INTELIGENTES)
           ======================================================== */
        setupSettingsView() {
            const Storage = window.StorageModule;

            // Helper de auto-cierre inteligente tras interactuar con una sección
            const autoCloseCard = (el) => {
                const card = el?.closest ? el.closest('.settings-accordion-card') : (typeof el === 'string' ? document.getElementById(el) : null);
                if (card) {
                    setTimeout(() => {
                        card.classList.remove('open');
                    }, 400);
                }
            };

            // 1. Manejo de Acordeones Colapsables (Bloques concisos y cierre automático de otros)
            document.querySelectorAll('.settings-accordion-header').forEach(header => {
                header.onclick = (e) => {
                    e.preventDefault();
                    window.HapticsModule?.light();
                    const card = header.closest('.settings-accordion-card');
                    if (card) {
                        const wasOpen = card.classList.contains('open');
                        document.querySelectorAll('.settings-accordion-card').forEach(c => {
                            if (c !== card) c.classList.remove('open');
                        });
                        if (wasOpen) {
                            card.classList.remove('open');
                        } else {
                            card.classList.add('open');
                        }
                    }
                };
            });

            // 1.1 Configuración de Nombre de Usuario / Estudiante
            const userNameInput = document.getElementById('settings-user-name');
            const saveUserNameBtn = document.getElementById('settings-save-user-name-btn');
            if (userNameInput) {
                userNameInput.value = Storage.getUserName() || '';
            }
            if (saveUserNameBtn) {
                saveUserNameBtn.onclick = () => {
                    const name = userNameInput ? userNameInput.value.trim() : '';
                    Storage.setUserName(name);
                    this.renderHeader();
                    this.renderDrawer();
                    this.refreshSettingsProfileUI();
                    window.HapticsModule?.light();
                    this.showToast('Nombre de usuario guardado con éxito.', 'success');
                    autoCloseCard(saveUserNameBtn);
                };
            }

            // 1.2 Gestión de Foto de Perfil en Configuraciones (subir, cambiar o quitar)
            const settingsPhotoInput = document.getElementById('settings-photo-input');
            const settingsPhotoUploadBtn = document.getElementById('settings-photo-upload-btn');
            const settingsPhotoClearBtn = document.getElementById('settings-photo-clear-btn');

            this.refreshSettingsProfileUI();

            if (settingsPhotoUploadBtn && settingsPhotoInput) {
                settingsPhotoUploadBtn.onclick = () => {
                    window.HapticsModule?.light?.();
                    settingsPhotoInput.click();
                };
            }

            if (settingsPhotoInput) {
                const handleSettingsPhotoChange = (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    this.downsampleAndSaveProfilePhoto(file, () => {
                        this.showToast('Foto de perfil actualizada con éxito.', 'success');
                    });
                    settingsPhotoInput.value = '';
                };
                settingsPhotoInput.onchange = handleSettingsPhotoChange;
            }

            if (settingsPhotoClearBtn) {
                settingsPhotoClearBtn.onclick = () => {
                    window.HapticsModule?.light?.();
                    Storage.setUserPhoto('');
                    if (settingsPhotoInput) settingsPhotoInput.value = '';
                    this.renderHeader();
                    this.renderDrawer();
                    this.refreshSettingsProfileUI();
                    this.updateStorageMetrics();
                    this.showToast('Foto de perfil eliminada.', 'info');
                };
            }

            // 1.3 Campo de Texto Libre para Semestre / Trimestre / Cuatrimestre / Periodo
            const customPeriodInput = document.getElementById('custom-period-input');
            const saveCustomPeriodBtn = document.getElementById('save-custom-period-btn');
            const clearCustomPeriodBtn = document.getElementById('clear-custom-period-btn');

            this.syncPeriodUI();

            const handleSaveCustomPeriod = () => {
                const val = (customPeriodInput ? customPeriodInput.value : '').trim();
                this.setAcademicPeriod(val);
                window.HapticsModule?.light?.();
                this.showToast(
                    val ? `Periodo actualizado: ${val}` : 'Periodo borrado y ocultado de la cabecera.',
                    val ? 'success' : 'info'
                );
                autoCloseCard(saveCustomPeriodBtn || customPeriodInput);
            };

            if (saveCustomPeriodBtn) {
                saveCustomPeriodBtn.onclick = handleSaveCustomPeriod;
            }
            if (customPeriodInput) {
                customPeriodInput.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveCustomPeriod();
                    }
                };
            }
            if (clearCustomPeriodBtn) {
                clearCustomPeriodBtn.onclick = () => {
                    this.setAcademicPeriod('');
                    window.HapticsModule?.light?.();
                    this.showToast('Periodo borrado y ocultado de la cabecera.', 'info');
                };
            }

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
                        autoCloseCard(cycleForm);
                    } catch (err) {
                        this.showToast(err.message, 'error');
                    }
                };
            }

            // 3. Tema y Modo Oscuro en Configuración
            document.getElementById('settings-theme-light')?.addEventListener('click', (e) => {
                this.setTheme('light');
                autoCloseCard(e.target);
            });
            document.getElementById('settings-theme-dark')?.addEventListener('click', (e) => {
                this.setTheme('dark');
                autoCloseCard(e.target);
            });
            document.getElementById('settings-theme-auto')?.addEventListener('click', (e) => {
                this.setTheme('auto');
                autoCloseCard(e.target);
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

            // 6. Tipografía Mediante Botones Interactivos (5 Opciones Estándar + Desbloqueables Bóveda)
            this.syncSettingsFontButtons();
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
                        poppins: 'Poppins',
                        readable: 'Lexend (Accesible)',
                        firacode: 'Fira Code (Hacker)',
                        playfair: 'Playfair Display (Imperial)',
                        caveat: 'Caveat (Cuaderno)',
                        orbitron: 'Orbitron (Cyber HUD)'
                    };
                    this.showToast(`Tipografía aplicada: ${fontNames[font] || font}`, 'success');
                    // La ventana de tipografías permanece abierta para poder probar varias fuentes seguidas.
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

            // 7b. Edición por pulsación larga (botón estándar, sin switches)
            const longPressBtn = document.getElementById('settings-longpress-btn');
            const longPressStatus = document.getElementById('settings-longpress-status');
            const refreshLongPressUi = () => {
                const on = Storage.isLongPressEnabled();
                if (longPressBtn) {
                    longPressBtn.textContent = on ? 'Desactivar pulsación larga' : 'Activar pulsación larga';
                    longPressBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
                }
                if (longPressStatus) {
                    longPressStatus.textContent = on ? 'Activada' : 'Desactivada';
                    longPressStatus.className = on
                        ? 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20';
                }
            };
            if (longPressBtn) {
                refreshLongPressUi();
                longPressBtn.onclick = () => {
                    const next = !Storage.isLongPressEnabled();
                    Storage.setLongPressEnabled(next);
                    window.CardContextMenu?.close?.();
                    refreshLongPressUi();
                    window.SubjectsModule?.render?.();
                    window.TasksModule?.render?.();
                    window.NotesModule?.render?.();
                    window.HapticsModule?.light?.();
                    this.showToast(next ? 'Pulsación larga activada: mantén presionado para editar o eliminar.' : 'Pulsación larga desactivada: los botones de editar y eliminar vuelven a estar visibles.', 'info');
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
                        autoCloseCard(e.target);
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
                            Storage.cleanupLegacyKeys?.();
                            this.initFontFamily();
                            this.refreshSettingsProfileUI();
                            this.syncPeriodUI();
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

            // 11. Novedades de Versión 1.5.0
            const changelogBtn = document.getElementById('settings-open-changelog-btn');
            const versionPill = document.getElementById('settings-version-pill');
            const openChangelog = () => {
                window.HapticsModule?.light();
                this.openChangelogModal();
            };
            if (changelogBtn) changelogBtn.onclick = openChangelog;
            if (versionPill) versionPill.onclick = openChangelog;

            // Cálculo inicial de métricas de almacenamiento y aplicación de tipografía
            this.updateStorageMetrics();
            this.applyFontFamily(Storage.getFontFamily?.() || 'calibri');
        }

        openChangelogModal() {
            const modal = document.getElementById('changelog-modal');
            const confirmBtn = document.getElementById('changelog-confirm-btn');
            const backdrop = document.getElementById('changelog-backdrop');
            if (!modal) return;

            const closeModal = () => {
                window.HapticsModule?.light();
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                    document.body.classList.remove('overflow-hidden');
                }, 200);
                window.StorageModule.setLastSeenVersion('1.5.0');
            };

            if (confirmBtn) confirmBtn.onclick = closeModal;
            if (backdrop) backdrop.onclick = closeModal;

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
            requestAnimationFrame(() => {
                modal.classList.add('active');
            });
        }

        updateVaultProgressCard() {
            const tasksCountBadge = document.getElementById('vault-completed-tasks-badge');
            const progressBar = document.getElementById('vault-progress-bar');
            const nextUnlockText = document.getElementById('vault-next-unlock-text');
            const unlockedCountText = document.getElementById('vault-unlocked-count-text');
            if (!tasksCountBadge && !progressBar) return;

            const Storage = window.StorageModule;
            const completedCount = Storage.getCompletedTasksCount ? Storage.getCompletedTasksCount() : 0;
            const unlockedCodes = Storage.getUnlockedCodes ? Storage.getUnlockedCodes() : [];
            const AUTO_UNLOCK_POOL = [
                'APOLLO11', 'PINGUINO', 'RETRO80S', 'MATRIX99', 'ZENPEACE',
                'COFFEE42', 'ARCADE90', 'STUDYMAX', 'READABLE',
                'FIRACODE', 'PLAYFAIR', 'HANDNOTE', 'ORBITRON'
            ];
            const unlockedFromPool = AUTO_UNLOCK_POOL.filter(id => unlockedCodes.includes(id)).length;

            if (tasksCountBadge) {
                tasksCountBadge.textContent = `${completedCount} tarea${completedCount === 1 ? '' : 's'}`;
            }

            if (unlockedCountText) {
                unlockedCountText.textContent = `${unlockedFromPool} / ${AUTO_UNLOCK_POOL.length}`;
            }

            const remainder = completedCount % 5;
            const needed = 5 - remainder;
            const pct = (remainder / 5) * 100;

            if (progressBar) {
                progressBar.style.width = `${pct}%`;
            }

            if (nextUnlockText) {
                if (unlockedFromPool >= AUTO_UNLOCK_POOL.length) {
                    nextUnlockText.textContent = '🎉 ¡Todos los códigos automáticos han sido desbloqueados!';
                } else if (remainder === 0 && completedCount > 0) {
                    nextUnlockText.textContent = '¡Código desbloqueado! Faltan 5 tareas para el siguiente.';
                } else {
                    nextUnlockText.textContent = `Faltan ${needed} tarea${needed === 1 ? '' : 's'} para el siguiente código`;
                }
            }
        }

        setupSecretVersionTrigger() {
            // Desactivado en v1.3.2 por solicitud: el modo secreto ahora se gestiona exclusivamente por la bóveda
        }

        setupSecretVault() {
            const openBtn = document.getElementById('open-secret-codes-btn');
            const backBtn = document.getElementById('vault-back-btn');
            const singleInput = document.getElementById('vault-code-input');
            const p1 = document.getElementById('vault-code-p1');
            const p2 = document.getElementById('vault-code-p2');
            const submitBtn = document.getElementById('vault-submit-btn');
            const statusMsg = document.getElementById('vault-status-message');
            const cardContainer = document.getElementById('vault-card-container');

            if (openBtn) {
                openBtn.onclick = () => {
                    window.HapticsModule?.medium?.();
                    this.switchView('secret-codes');
                    setTimeout(() => (singleInput || p1)?.focus(), 250);
                };
            }

            if (backBtn) {
                backBtn.onclick = () => {
                    window.HapticsModule?.light?.();
                    this.switchView('settings');
                };
            }

            if (singleInput) {
                singleInput.addEventListener('input', () => {
                    singleInput.value = singleInput.value.replace(/[^a-zA-Z0-9_\-\/]/g, '').toUpperCase();
                    if (p1 && p2) {
                        const clean = singleInput.value.replace(/[^a-zA-Z0-9]/g, '');
                        p1.value = clean.slice(0, 4);
                        p2.value = clean.slice(4, 8);
                    }
                });

                singleInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        verifyCode();
                    }
                });
            }

            if (p1 && p2) {
                // Paste Handler on p1: Splits clipboard text into p1 (0-4) and p2 (4-8)
                p1.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const pasted = ((e.clipboardData || window.clipboardData)?.getData('text') || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    p1.value = pasted.slice(0, 4);
                    p2.value = pasted.slice(4, 8);
                    if (singleInput) singleInput.value = (p1.value + p2.value);
                    if (p2.value.length > 0) {
                        p2.focus();
                    } else {
                        p1.focus();
                    }
                });

                p2.addEventListener('paste', (e) => {
                    const pasted = ((e.clipboardData || window.clipboardData)?.getData('text') || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    if (!p1.value && pasted.length > 4) {
                        e.preventDefault();
                        p1.value = pasted.slice(0, 4);
                        p2.value = pasted.slice(4, 8);
                        if (singleInput) singleInput.value = (p1.value + p2.value);
                        p2.focus();
                    }
                });

                p1.addEventListener('input', () => {
                    p1.value = p1.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    if (singleInput) singleInput.value = (p1.value || '') + (p2.value || '');
                    if (p1.value.length >= 4) {
                        p2.focus();
                    }
                });

                p2.addEventListener('input', () => {
                    p2.value = p2.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    if (singleInput) singleInput.value = (p1.value || '') + (p2.value || '');
                });

                p2.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && p2.value.length === 0) {
                        p1.focus();
                    } else if (e.key === 'Enter') {
                        verifyCode();
                    }
                });

                p1.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        if (p1.value.length < 4) {
                            verifyCode();
                        } else {
                            p2.focus();
                        }
                    }
                });
            }

            const verifyCode = () => {
                const singleVal = singleInput?.value?.trim() || '';
                const splitVal = ((p1?.value || '') + (p2?.value || '')).trim();
                const raw = (singleVal || splitVal).toUpperCase();
                const cleaned = raw.replace(/[^A-Z0-9]/g, '');

                // Resolve alias or direct match
                const matchedId = VAULT_ALIASES[raw] || VAULT_ALIASES[cleaned] || (VAULT_CATALOG[raw] ? raw : (VAULT_CATALOG[cleaned] ? cleaned : null));
                const codeDef = matchedId ? VAULT_CATALOG[matchedId] : null;

                if (!codeDef) {
                    window.HapticsModule?.error?.();
                    if (cardContainer) {
                        cardContainer.classList.remove('vault-shake');
                        void cardContainer.offsetWidth; // Force reflow
                        cardContainer.classList.add('vault-shake');
                    }
                    if (statusMsg) {
                        statusMsg.className = 'min-h-[24px] text-xs font-mono font-bold text-rose-400 animate-pulse';
                        statusMsg.textContent = '⚠️ Acceso denegado: Código no reconocido o credencial inválida.';
                    }
                    setTimeout(() => {
                        if (singleInput) singleInput.value = '';
                        if (p1) p1.value = '';
                        if (p2) p2.value = '';
                        (singleInput || p1)?.focus();
                    }, 1500);
                    return;
                }

                // SUCCESS UNLOCK SEQUENCE
                if (codeDef.isMasterCode || codeDef.id === 'KRONOS99') {
                    Object.keys(VAULT_CATALOG).forEach(id => {
                        window.StorageModule.unlockCode(id);
                    });
                    window.StorageModule.unlockSecret?.();
                    this.applySecretFeaturesUI?.();
                    this.syncSettingsFontButtons?.();
                } else {
                    window.StorageModule.unlockCode(codeDef.id);
                }
                window.HapticsModule?.double?.();

                const lockDiv = cardContainer?.querySelector('.text-3xl');
                if (lockDiv) {
                    lockDiv.classList.remove('animate-pulse');
                    lockDiv.classList.remove('vault-lock-unlocked');
                    lockDiv.classList.add('vault-lock-unlocking');
                    lockDiv.textContent = '🔓';
                }

                if (cardContainer) {
                    cardContainer.classList.remove('vault-shake');
                    cardContainer.classList.remove('vault-aura-burst');
                    void cardContainer.offsetWidth; // Reflow
                    cardContainer.classList.add('vault-aura-burst');
                }

                if (statusMsg) {
                    statusMsg.className = 'min-h-[24px] text-xs font-mono font-bold text-emerald-400 animate-bounce';
                    statusMsg.textContent = '🔓 ¡ACCESO CONCEDIDO! Descifrando protocolo...';
                }

                setTimeout(() => {
                    if (lockDiv) {
                        lockDiv.classList.remove('vault-lock-unlocking');
                        lockDiv.classList.add('vault-lock-unlocked');
                    }
                    if (singleInput) singleInput.value = '';
                    if (p1) p1.value = '';
                    if (p2) p2.value = '';

                    this.openVaultRevealModal(codeDef);
                    this.renderVaultInventory();
                }, 850);
            };

            if (submitBtn) {
                submitBtn.onclick = verifyCode;
            }
            const verifyBtn = document.getElementById('vault-verify-btn');
            if (verifyBtn) {
                verifyBtn.onclick = verifyCode;
            }

            this.renderVaultInventory();
        }

        openVaultRevealModal(codeDef) {
            const modal = document.getElementById('vault-reveal-modal');
            if (!modal || !codeDef) return;

            const iconEl = document.getElementById('vault-reveal-icon');
            const badgeEl = document.getElementById('vault-reveal-badge');
            const titleEl = document.getElementById('vault-reveal-title');
            const phraseEl = document.getElementById('vault-reveal-phrase');
            const descEl = document.getElementById('vault-reveal-desc');
            const actionBtn = document.getElementById('vault-reveal-action-btn');
            const dismissBtn = document.getElementById('vault-reveal-dismiss-btn');
            const closeBtn = document.getElementById('close-vault-reveal-modal');
            const backdrop = document.getElementById('vault-reveal-backdrop');

            if (iconEl) iconEl.textContent = codeDef.icon || '🗝️';
            if (badgeEl) {
                badgeEl.textContent = codeDef.category || 'PROTOCOLO CLASIFICADO';
                badgeEl.className = `text-[10px] font-mono font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${codeDef.badgeClass || 'bg-purple-500/20 text-purple-300 border-purple-400/30'}`;
            }
            if (titleEl) titleEl.textContent = codeDef.name || codeDef.id;
            if (phraseEl) phraseEl.textContent = codeDef.phrase || '';
            if (descEl) descEl.textContent = codeDef.description || '';

            // Estilo conmemorativo especial para la dedicatoria 06062009
            if (codeDef.id === '06062009') {
                if (titleEl) titleEl.innerHTML = `✨ Starlight Tribute`;
                if (phraseEl) phraseEl.className = 'text-sm font-serif italic text-pink-100 leading-relaxed px-4 py-3 bg-pink-500/15 rounded-2xl border border-pink-400/30 shadow-lg shadow-pink-950/50 block text-center';
            } else {
                if (phraseEl) phraseEl.className = 'text-xs font-serif italic text-purple-200/90 leading-relaxed px-2';
            }

            const closeModal = () => {
                window.HapticsModule?.light?.();
                modal.classList.remove('active');
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            };

            if (actionBtn) {
                if (codeDef.isMasterCode || codeDef.id === 'KRONOS99') {
                    actionBtn.innerHTML = `<span>Explorar Bóveda Completa 🔓</span>`;
                    actionBtn.onclick = () => {
                        window.HapticsModule?.medium?.();
                        closeModal();
                        this.renderVaultInventory();
                        this.syncSettingsFontButtons?.();
                        this.showToast('✨ ¡Todos los 10 temas, modo monocromático y 5 fuentes han sido desbloqueados!', 'success');
                    };
                } else {
                    const isFont = (codeDef.type === 'font');
                    const isCurrentlyActive = isFont
                        ? false
                        : (codeDef.themeId && window.StorageModule.getActiveSpecialTheme() === codeDef.themeId);

                    actionBtn.innerHTML = `<span>${isCurrentlyActive ? 'Desactivar Tema' : (codeDef.actionLabel || 'Activar Recompensa')}</span>`;
                    actionBtn.onclick = () => {
                        window.HapticsModule?.medium?.();
                        if (isFont && codeDef.fontKey) {
                            window.StorageModule.setFontFamily(codeDef.fontKey);
                            this.applyFontFamily(codeDef.fontKey);
                            this.showToast(`✨ ¡${codeDef.name} aplicada con éxito!`, 'success');
                            this.syncSettingsFontButtons?.();
                        } else if (codeDef.themeId) {
                            const specialClasses = ['theme-apollo', 'theme-eduardo-gold', 'theme-penguin', 'theme-synthwave', 'theme-matrix', 'theme-sakura', 'theme-coffee', 'theme-arcade', 'theme-hyperfocus', 'theme-starlight', 'theme-gray'];
                            if (isCurrentlyActive) {
                                window.StorageModule.setActiveSpecialTheme('default');
                                specialClasses.forEach(c => document.documentElement.classList.remove(c));
                                const savedTheme = window.StorageModule.getTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                                this.applyTheme(savedTheme, false);
                                this.showToast('Modo estándar restaurado', 'info');
                            } else {
                                window.StorageModule.setActiveSpecialTheme(codeDef.themeId);
                                specialClasses.forEach(c => document.documentElement.classList.remove(c));
                                if (codeDef.themeClass) {
                                    document.documentElement.classList.add(codeDef.themeClass);
                                }
                                if (codeDef.themeId !== 'gray') {
                                    document.documentElement.classList.add('dark');
                                    window.StorageModule.setTheme('dark');
                                    this.updateThemeUI('dark', false);
                                }
                                this.showToast(`✨ ¡${codeDef.name} activado con éxito!`, 'success');
                            }
                        }
                        if (codeDef.supportsRockets) {
                            window.StorageModule.setApolloRocketsEnabled(!isCurrentlyActive);
                        } else if (codeDef.themeId) {
                            window.StorageModule.setApolloRocketsEnabled(false);
                        }
                        this.updateApolloRockets();
                        closeModal();
                        this.renderVaultInventory();
                    };
                }
            }

            if (closeBtn) closeBtn.onclick = closeModal;
            if (dismissBtn) dismissBtn.onclick = closeModal;
            if (backdrop) backdrop.onclick = closeModal;

            const handleEsc = (e) => {
                if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                    closeModal();
                    window.removeEventListener('keydown', handleEsc);
                }
            };
            window.addEventListener('keydown', handleEsc);

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            requestAnimationFrame(() => {
                modal.classList.add('active');
            });
        }

        renderVaultInventory() {
            this.updateVaultProgressCard();
            const grid = document.getElementById('vault-unlocked-grid');
            if (!grid) return;

            const unlocked = window.StorageModule.getUnlockedCodes();
            const showFeatures = window.StorageModule.isSecretUnlocked();

            if (unlocked.length === 0 && !showFeatures) {
                grid.innerHTML = `
                    <div class="vault-empty-state col-span-full py-7 px-5 rounded-2xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-500/20 text-center shadow-xs transition-colors">
                        <span class="text-2xl mb-1 block opacity-60 select-none">🔒</span>
                        <p class="text-xs font-mono font-bold text-purple-950 dark:text-purple-300">Ningún protocolo descifrado aún</p>
                        <p class="text-[11px] text-purple-800/80 dark:text-purple-400/70 mt-1 font-medium">Ingresa códigos válidos en la terminal para desbloquear personalizaciones clasificadas.</p>
                    </div>
                `;
                return;
            }

            const currentSpecialTheme = window.StorageModule.getActiveSpecialTheme ? window.StorageModule.getActiveSpecialTheme() : 'default';
            const currentFont = window.StorageModule.getFontFamily ? window.StorageModule.getFontFamily() : 'calibri';

            const featureDefs = showFeatures ? [
                { key: 'gray', icon: '🔲', name: 'Modo Monocromático', category: 'FUNCIÓN', active: !!window.StorageModule.getGrayModeEnabled() }
            ] : [];
            const featureCardsHtml = featureDefs.map(f => `
                    <div class="vault-inventory-card p-3 rounded-2xl bg-slate-900/80 dark:bg-slate-950/80 border ${f.active ? 'border-emerald-400/60 shadow-lg shadow-emerald-950/40' : 'border-purple-500/20'} flex items-center justify-between gap-2.5 transition-all">
                        <div class="flex items-center gap-2.5 min-w-0 flex-1">
                            <span class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-lg shrink-0">${f.icon}</span>
                            <div class="min-w-0 flex-1">
                                <h4 class="text-xs font-extrabold text-white min-w-0 flex-1 break-words leading-snug">${f.name}</h4>
                                <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">${f.category}</span>
                                    ${f.active ? '<span class="text-[9px] font-bold text-emerald-400">● ACTIVO</span>' : ''}
                                </div>
                            </div>
                        </div>
                        <button type="button" data-vault-feature="${f.key}"
                            class="tap-effect shrink-0 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${f.active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30' : 'bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:bg-purple-600/50'}">
                            ${f.active ? 'Desactivar' : 'Activar'}
                        </button>
                    </div>`).join('');

            grid.innerHTML = unlocked.map(codeId => {
                const def = VAULT_CATALOG[codeId] || {
                    id: codeId,
                    name: `Protocolo ${codeId}`,
                    icon: '🗝️',
                    category: 'CLASIFICADO',
                    themeId: codeId.toLowerCase()
                };
                const isFont = (def.type === 'font');
                const isActive = isFont
                    ? (def.fontKey && currentFont === def.fontKey)
                    : (def.themeId && currentSpecialTheme === def.themeId);
                const buttonText = (def.id === '06062009') ? 'Ver' : (def.isMasterCode || def.id === 'KRONOS99' ? 'Ver Detalle' : (isFont ? (isActive ? 'Restaurar' : 'Activar') : (isActive ? 'Desactivar' : 'Activar')));

                return `
                    <div class="vault-inventory-card p-3 rounded-2xl bg-slate-900/80 dark:bg-slate-950/80 border ${isActive ? 'border-emerald-400/60 shadow-lg shadow-emerald-950/40' : 'border-purple-500/20'} flex items-center justify-between gap-2.5 transition-all">
                        <div class="flex items-center gap-2.5 min-w-0 flex-1">
                            <span class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-lg shrink-0">
                                ${def.icon}
                            </span>
                            <div class="min-w-0 flex-1">
                                <h4 class="text-xs font-extrabold text-white dark:text-white min-w-0 flex-1 break-words leading-snug" title="${def.name}">
                                    ${def.name}
                                </h4>
                                <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                                        ${def.category || 'SECRETO'}
                                    </span>
                                    ${isActive ? '<span class="text-[9px] font-bold text-emerald-400">● ACTIVO</span>' : ''}
                                </div>
                            </div>
                        </div>
                        <button type="button" data-vault-toggle="${def.id}"
                            class="tap-effect shrink-0 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30' : 'bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:bg-purple-600/50'}">
                            ${buttonText}
                        </button>
                    </div>
                `;
            }).join('') + featureCardsHtml;

            // Función exclusiva de la bóveda (Modo Monocromático)
            grid.querySelectorAll('[data-vault-feature]').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const Storage = window.StorageModule;
                    const key = btn.getAttribute('data-vault-feature');
                    window.HapticsModule?.light?.();
                    if (key === 'gray') {
                        const next = !Storage.getGrayModeEnabled();
                        this.applyGrayMode(next);
                        this.showToast(next ? 'Modo Monocromático activado.' : 'Modo Monocromático desactivado.', 'info');
                    }
                    this.renderVaultInventory();
                };
            });

            // Attach toggle listeners
            grid.querySelectorAll('[data-vault-toggle]').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const codeId = btn.getAttribute('data-vault-toggle');
                    const def = VAULT_CATALOG[codeId];
                    if (!def) return;

                    if (def.isMasterCode || def.id === 'KRONOS99') {
                        this.openVaultRevealModal(def);
                        return;
                    }

                    if (def.id === '06062009') {
                        this.openVaultRevealModal(def);
                        return;
                    }

                    if (def.type === 'font' && def.fontKey) {
                        const isCurrentlyActive = (window.StorageModule.getFontFamily() === def.fontKey);
                        window.HapticsModule?.light?.();
                        if (isCurrentlyActive) {
                            window.StorageModule.setFontFamily('calibri');
                            this.applyFontFamily('calibri');
                            this.showToast('Fuente estándar Calibri restaurada', 'info');
                        } else {
                            window.StorageModule.setFontFamily(def.fontKey);
                            this.applyFontFamily(def.fontKey);
                            this.showToast(`✨ ${def.name} aplicada`, 'success');
                        }
                        this.syncSettingsFontButtons?.();
                        this.renderVaultInventory();
                        return;
                    }

                    if (!def.themeId) return;

                    const isCurrentlyActive = (window.StorageModule.getActiveSpecialTheme() === def.themeId);
                    window.HapticsModule?.light?.();

                    const specialClasses = ['theme-apollo', 'theme-eduardo-gold', 'theme-penguin', 'theme-synthwave', 'theme-matrix', 'theme-sakura', 'theme-coffee', 'theme-arcade', 'theme-hyperfocus', 'theme-starlight', 'theme-gray'];

                    if (isCurrentlyActive) {
                        // Deactivate
                        window.StorageModule.setActiveSpecialTheme('default');
                        specialClasses.forEach(c => document.documentElement.classList.remove(c));
                        if (def.supportsRockets) {
                            window.StorageModule.setApolloRocketsEnabled(false);
                        }
                        this.updateApolloRockets();
                        const savedTheme = window.StorageModule.getTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                        this.applyTheme(savedTheme, false);
                        this.showToast(`Modo estándar restaurado`, 'info');
                    } else {
                        // Activate
                        window.StorageModule.setActiveSpecialTheme(def.themeId);
                        specialClasses.forEach(c => document.documentElement.classList.remove(c));
                        if (def.themeClass) {
                            document.documentElement.classList.add(def.themeClass);
                        }
                        if (def.supportsRockets) {
                            window.StorageModule.setApolloRocketsEnabled(true);
                        } else {
                            window.StorageModule.setApolloRocketsEnabled(false);
                        }
                        this.updateApolloRockets();
                        document.documentElement.classList.add('dark');
                        window.StorageModule.setTheme('dark');
                        this.updateThemeUI('dark', false);
                        this.showToast(`✨ ${def.name} activado`, 'success');
                    }
                    this.renderVaultInventory();
                };
            });
        }

        updateApolloRockets() {
            const Storage = window.StorageModule;
            const isApolloUnlocked = Storage?.isCodeUnlocked ? Storage.isCodeUnlocked('APOLLO11') : false;
            const rocketsEnabled = Storage?.getApolloRocketsEnabled ? Storage.getApolloRocketsEnabled() : false;
            const activeTheme = Storage?.getActiveSpecialTheme ? Storage.getActiveSpecialTheme() : 'default';
            const isApolloActive = (activeTheme === 'apollo' || activeTheme === 'theme_apollo' || activeTheme === 'theme-apollo');
            const useRockets = isApolloUnlocked && rocketsEnabled && isApolloActive;

            // Limpieza absoluta de todo cohete existente en cualquier elemento para evitar duplicados y residuos
            document.querySelectorAll('.apollo-rocket-badge').forEach(badge => badge.remove());

            if (useRockets) {
                // Solo colocar un cohete en el botón central inferior (bottom-main-action-btn) y en los botones de añadir
                const targets = [
                    document.getElementById('bottom-main-action-btn'),
                    document.getElementById('add-task-btn'),
                    document.getElementById('add-note-btn'),
                    document.getElementById('add-subject-btn')
                ];

                targets.forEach(btn => {
                    if (!btn) return;
                    btn.querySelectorAll('.apollo-rocket-badge').forEach(b => b.remove());
                    const badge = document.createElement('span');
                    badge.className = 'apollo-rocket-badge select-none';
                    badge.textContent = '🚀';
                    btn.style.position = 'relative';
                    btn.appendChild(badge);
                });
            }
        }

        applySpecialThemeFromStorage() {
            const Storage = window.StorageModule;
            if (!Storage?.getActiveSpecialTheme) return;
            const current = Storage.getActiveSpecialTheme();
            const specialClasses = ['theme-apollo', 'theme-eduardo-gold', 'theme-penguin', 'theme-synthwave', 'theme-matrix', 'theme-sakura', 'theme-coffee', 'theme-arcade', 'theme-hyperfocus', 'theme-starlight', 'theme-gray'];
            specialClasses.forEach(c => document.documentElement.classList.remove(c));

            if (current && current !== 'default') {
                const found = Object.values(VAULT_CATALOG).find(c => c.themeId === current);
                if (found && found.themeClass) {
                    document.documentElement.classList.add(found.themeClass);
                }
                if (current !== 'gray' && current !== 'theme-gray') {
                    document.documentElement.classList.add('dark');
                    Storage.setTheme('dark');
                    this.updateThemeUI('dark', false);
                }
            }
            if (Storage?.getGrayModeEnabled?.()) {
                document.documentElement.classList.add('theme-gray');
                document.body?.classList.add('theme-gray');
            }
            this.updateApolloRockets();
        }

        showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all duration-300 transform translate-y-3 opacity-0 pointer-events-auto border ${
                type === 'success' ? 'bg-emerald-600/90 text-white border-emerald-400/50 shadow-emerald-600/25' :
                type === 'warning' ? 'bg-amber-600/90 text-white border-amber-400/50 shadow-amber-600/25' :
                type === 'error' ? 'bg-rose-600/90 text-white border-rose-400/50 shadow-rose-600/25' :
                'bg-slate-900/90 text-white border-white/15 shadow-slate-950/35'
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

            toast.innerHTML = iconSvg;
            const msgSpan = document.createElement('span');
            msgSpan.className = 'flex-1';
            msgSpan.textContent = message;
            toast.appendChild(msgSpan);

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

        // =========================================================================
        // PWA & Service Worker Registration & Installation Manager
        // =========================================================================

        initPwa() {
            this.initPWA();
        }

        initPWA() {
            window.deferredInstallPrompt = null;

            // 1. Guard Service Worker registration to secure contexts (HTTPS or localhost)
            // Under file://, navigator.serviceWorker.register throws a SecurityError, so skip gracefully
            const isSecureContext = (
                (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                && window.location.protocol !== 'file:'
            );

            if ('serviceWorker' in navigator && isSecureContext) {
                const registerSw = () => {
                    navigator.serviceWorker.register('./sw.js', { scope: './' })
                        .then(reg => {
                            console.log('[PWA] Service Worker registered with scope:', reg.scope);
                            reg.addEventListener('updatefound', () => {
                                const newWorker = reg.installing;
                                if (newWorker) {
                                    newWorker.addEventListener('statechange', () => {
                                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                            this.showUpdateToast(newWorker);
                                        }
                                    });
                                }
                            });
                        })
                        .catch(err => {
                            console.warn('[PWA] Service Worker registration failed:', err.message);
                        });
                };

                if (document.readyState === 'complete') {
                    registerSw();
                } else {
                    window.addEventListener('load', registerSw);
                }
            } else {
                console.log('[PWA] Service Worker registration skipped (running in local file:// or non-secure context).');
            }

            // 2. Check standalone display mode
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                                 window.navigator.standalone === true ||
                                 (typeof document.referrer === 'string' && document.referrer.includes('android-app://'));
            this.updatePWAStatusUI(isStandalone);

            // 3. Capture beforeinstallprompt event
            window.addEventListener('beforeinstallprompt', e => {
                e.preventDefault();
                window.deferredInstallPrompt = e;
                console.log('[PWA] beforeinstallprompt event captured and deferred.');

                if (!isStandalone) {
                    this.showPWAInstallTriggers();
                }
            });

            // 4. Handle successful installation
            window.addEventListener('appinstalled', () => {
                console.log('[PWA] Application successfully installed.');
                window.deferredInstallPrompt = null;
                this.updatePWAStatusUI(true);
                this.hidePwaFloatingBanner();
                this.showToast('¡Organizador de Tareas se instaló exitosamente en tu dispositivo! 🎉', 'success');
            });

            // 5. Attach click listeners to install triggers
            const installBtns = [
                document.getElementById('pwa-install-settings-btn'),
                document.getElementById('pwa-floating-install-btn'),
                document.getElementById('drawer-pwa-install-btn')
            ];

            installBtns.forEach(btn => {
                if (!btn) return;
                btn.addEventListener('click', () => {
                    this.promptPwaInstall();
                });
            });

            // 6. Floating banner dismissal handler
            const dismissBtn = document.getElementById('pwa-floating-dismiss-btn');
            if (dismissBtn) {
                dismissBtn.addEventListener('click', () => {
                    this.hidePwaFloatingBanner();
                    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
                });
            }
        }

        async promptPwaInstall() {
            if (window.deferredInstallPrompt) {
                try {
                    window.deferredInstallPrompt.prompt();
                    const choice = await window.deferredInstallPrompt.userChoice;
                    console.log('[PWA] User install choice:', choice ? choice.outcome : 'unknown');
                    window.deferredInstallPrompt = null;
                    if (choice && choice.outcome === 'accepted') {
                        this.hidePwaFloatingBanner();
                    }
                    return choice;
                } catch (err) {
                    console.warn('[PWA] promptPwaInstall error:', err);
                    return null;
                }
            } else {
                this.showToast('Para instalar: usa la opción "Instalar app" o el menú de tu navegador.', 'info');
                return null;
            }
        }

        showPWAInstallTriggers() {
            const drawerBtn = document.getElementById('drawer-pwa-install-btn');
            if (drawerBtn) drawerBtn.classList.remove('hidden');

            const dismissedTime = parseInt(localStorage.getItem('pwa_prompt_dismissed') || '0', 10);
            const oneDayMs = 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedTime > oneDayMs) {
                const floatingBanner = document.getElementById('pwa-floating-banner');
                if (floatingBanner) floatingBanner.classList.remove('hidden');
            }
        }

        hidePwaFloatingBanner() {
            const floatingBanner = document.getElementById('pwa-floating-banner');
            if (floatingBanner) floatingBanner.classList.add('hidden');
        }

        updatePWAStatusUI(isInstalled) {
            const statusPill = document.getElementById('pwa-status-pill');
            const btnText = document.getElementById('pwa-install-btn-text');
            const settingsBtn = document.getElementById('pwa-install-settings-btn');
            const drawerBtn = document.getElementById('drawer-pwa-install-btn');

            if (isInstalled) {
                if (statusPill) {
                    statusPill.textContent = 'Instalada';
                    statusPill.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300';
                }
                if (btnText) btnText.textContent = '✓ Aplicación Instalada';
                if (settingsBtn) {
                    settingsBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
                    settingsBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-700', 'cursor-default');
                    settingsBtn.disabled = true;
                }
                if (drawerBtn) drawerBtn.classList.add('hidden');
                this.hidePwaFloatingBanner();
            }
        }

        showUpdateToast(worker) {
            this.showToast('Nueva versión de Organizador disponible. Pulsa para actualizar.', 'info');
            if (worker) {
                worker.postMessage({ type: 'SKIP_WAITING' });
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        window.App = app;
        window.app = app;
        window.AppInstance = app;
        window.OrganizadorApp = app;
        app.init();
    });
})();
