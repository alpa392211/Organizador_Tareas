/**
 * Aplicación Principal - Orquestador
 * Integra UI, navegación por Drawer, selector institucional oficial,
 * selector dinámico de periodos/semestres, ciclo escolar obligatorio, notas rápidas,
 * baúl de archivados con depuración de 60 días y telarañas decorativas,
 * selector de 5 tipografías mediante botones interactivos, sistema háptico,
 * botón central de atajo de acción rápida personalizable, animación de logo escolar y widgets nativos.
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
        'GATITOS_': {
            id: 'GATITOS_',
            name: 'Felinos & Escala de Grises',
            icon: '🐱',
            category: 'EASTER EGG CLÁSICO',
            themeId: 'gray',
            badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
            phrase: '«Miau... El modo secreto original del organizador»',
            description: 'Desbloquea directamente desde la bóveda el clásico modo escala de grises monocromático y la celebración con gatitos juguetones 🐾 en cada tarea cumplida.',
            actionLabel: 'Activar Gatitos y Modo Gris 🐱',
            themeClass: 'theme-gray',
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
            description: '¡Has descifrado la clave maestra universal! Se han desbloqueado simultáneamente los 11 temas de personalización, el tributo estelar Starlight y las 5 familias tipográficas secretas en tu organizador.',
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
        // GATITOS_
        'GATITOS_': 'GATITOS_', 'GATITOS': 'GATITOS_', 'NEKOLUCK': 'GATITOS_', 'MEOWMEOW': 'GATITOS_', 'GATITO': 'GATITOS_',
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
            this.activeInstitution = null;
            this.selectedCountryFilter = 'all';
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
            this.applySecretFeaturesUI();
            this.applySpecialThemeFromStorage();
            this.updateApolloRockets();

            // 4. Inicializar y aplicar tipografía seleccionada (5 opciones con botones)
            this.initFontFamily();

            // Bloqueo de orientación horizontal en teléfonos móviles (Portrait Lock)
            this.initOrientationLock();

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
            this.setupCustomSchoolModal();
            this.setupCycleWelcomeModal();
            this.setupExitModal();
            this.setupSettingsView();
            this.setupSecretVault();
            this.initPwa();

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
            if (urlParams.get('openSchoolModal') === '1') {
                setTimeout(() => document.getElementById('header-inst-logo')?.click(), 80);
            }

            // 11. Renderizado inicial completo
            this.refreshAll();
            this.updateVaultProgressCard?.();

            // 12. Flujo de inicio de presentación (Presentation-First Flow Ordering)
            // Si el onboarding NO se ha completado: NO solicitar notificaciones ni mostrar changelog; abrir bienvenida primero
            if ((!Storage.isOnboardingCompleted?.() || !Storage.isCycleConfigured?.()) && urlParams.get('openSchoolModal') !== '1') {
                this.openCycleWelcomeModal?.();
            } else {
                // Si el onboarding YA está completado:
                // Permisos de notificaciones al abrir la app
                if (window.NotificationsModule?.requestPermission) {
                    window.NotificationsModule.requestPermission().catch(() => {});
                }

                // Comprobar changelog de versión 1.4.2
                const lastSeenVersion = Storage.getLastSeenVersion?.();
                if (lastSeenVersion !== '1.4.2') {
                    setTimeout(() => {
                        this.openChangelogModal?.();
                    }, 600);
                }
            }
        }

        refreshAll() {
            this.renderHeader();
            this.renderDrawer();
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
            const InstitutionsModule = window.InstitutionsModule;
            if (!Storage) return;

            const instId = Storage.getInstitution?.() || 'unam';
            const inst = InstitutionsModule?.getInstitution?.(instId) || { name: 'Sin institución', colors: { primary: '#4F46E5' } };
            const userName = Storage.getUserName?.() || '';
            const userPhoto = Storage.getUserPhoto?.() || '';
            const period = Storage.getAcademicPeriod?.() || inst.defaultPeriod || '1.º Semestre';

            const headerUserName = document.getElementById('header-user-name');
            if (headerUserName) {
                headerUserName.textContent = userName;
                if (userName) {
                    headerUserName.classList.remove('hidden');
                } else {
                    headerUserName.classList.add('hidden');
                }
            }

            const headerInstName = document.getElementById('header-inst-name');
            if (headerInstName) {
                headerInstName.textContent = inst.name;
            }

            const headerInstPeriod = document.getElementById('header-inst-period');
            if (headerInstPeriod) {
                headerInstPeriod.textContent = period;
            }

            const headerInstType = document.getElementById('header-inst-type');
            if (headerInstType) {
                headerInstType.textContent = inst.systemType || inst.type || 'Semestral';
            }

            const logoContainer = document.getElementById('header-inst-logo');
            if (logoContainer) {
                if (userPhoto) {
                    logoContainer.innerHTML = `<img src="${userPhoto}" class="w-10 h-10 rounded-2xl object-cover border border-slate-200/60 dark:border-slate-700/60 shadow-xs" alt="Foto de perfil">`;
                } else if (InstitutionsModule) {
                    logoContainer.innerHTML = InstitutionsModule.renderIconHtml(inst, 'w-10 h-10');
                }
            }
        }

        renderDrawer() {
            const Storage = window.StorageModule;
            const InstitutionsModule = window.InstitutionsModule;
            if (!Storage) return;

            const instId = Storage.getInstitution?.() || 'unam';
            const inst = InstitutionsModule?.getInstitution?.(instId) || { name: 'Sin institución' };
            const userName = Storage.getUserName?.() || '';
            const userPhoto = Storage.getUserPhoto?.() || '';
            const period = Storage.getAcademicPeriod?.() || inst.defaultPeriod || '1.º Semestre';

            const drawerName = document.getElementById('drawer-inst-name');
            if (drawerName) drawerName.textContent = inst.name;

            const drawerPeriod = document.getElementById('drawer-inst-period');
            if (drawerPeriod) drawerPeriod.textContent = period;

            const drawerSlogan = document.getElementById('drawer-inst-slogan');
            if (drawerSlogan) {
                const sloganDisplay = userName ? userName : (inst.slogan ? `"${inst.slogan}"` : '');
                drawerSlogan.textContent = sloganDisplay;
                drawerSlogan.title = userName || inst.slogan || '';
            }

            const drawerLogo = document.getElementById('drawer-inst-logo');
            if (drawerLogo) {
                if (userPhoto) {
                    drawerLogo.innerHTML = `<img src="${userPhoto}" class="w-12 h-12 rounded-2xl object-cover border border-slate-200/60 dark:border-slate-700/60 shadow-sm" alt="Foto de perfil">`;
                } else if (InstitutionsModule) {
                    drawerLogo.innerHTML = InstitutionsModule.renderIconHtml(inst, 'w-12 h-12');
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
            // Únicamente el tema de felinos/monocromático ('gray') permite modo claro sin bloquearlo
            return current && current !== 'default' && current !== 'gray' && current !== 'theme_cats' && current !== 'theme-gray';
        }

        applyTheme(theme, save = true) {
            const Storage = window.StorageModule;
            // Si hay un tema especial activo (salvo modo gatos), el modo claro no funciona y se fuerza modo oscuro
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
            const isUnlocked = Storage.isSecretUnlocked();
            const secretSection = document.getElementById('secret-theme-controls');
            if (secretSection) {
                if (isUnlocked) {
                    secretSection.classList.remove('hidden');
                } else {
                    secretSection.classList.add('hidden');
                }
            }

            const updateSecretButtons = () => {
                const isGrayActive = Storage.getGrayModeEnabled();
                const isCatsActive = Storage.getSecretCatsEnabled();

                const grayBtn = document.getElementById('settings-gray-mode-btn');
                if (grayBtn) {
                    grayBtn.textContent = isGrayActive ? 'Desactivar' : 'Activar';
                    grayBtn.className = `tap-effect shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isGrayActive
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30'
                            : 'bg-purple-600/30 text-purple-900 dark:text-purple-200 border border-purple-500/30 hover:bg-purple-600/50'
                    }`;
                }

                const catsBtn = document.getElementById('settings-cats-btn');
                if (catsBtn) {
                    catsBtn.textContent = isCatsActive ? 'Desactivar' : 'Activar';
                    catsBtn.className = `tap-effect shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isCatsActive
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
                    this.showToast(e.target.checked ? 'Modo Gris activado.' : 'Modo Gris desactivado.', 'info');
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
                    this.showToast(next ? 'Modo Gris activado.' : 'Modo Gris desactivado.', 'info');
                };
            }

            const catsToggle = document.getElementById('settings-cats-toggle');
            if (catsToggle) {
                catsToggle.checked = Storage.getSecretCatsEnabled();
                catsToggle.onchange = (e) => {
                    window.HapticsModule?.light();
                    Storage.setSecretCatsEnabled(e.target.checked);
                    this.updateHiddenKitties();
                    updateSecretButtons();
                    this.showToast(e.target.checked ? '🐾 ¡Gatitos activados!' : 'Gatitos desactivados.', 'info');
                };
            }

            const catsBtn = document.getElementById('settings-cats-btn');
            if (catsBtn) {
                catsBtn.onclick = () => {
                    window.HapticsModule?.light();
                    const next = !Storage.getSecretCatsEnabled();
                    Storage.setSecretCatsEnabled(next);
                    if (catsToggle) catsToggle.checked = next;
                    this.updateHiddenKitties();
                    updateSecretButtons();
                    this.showToast(next ? '🐾 ¡Gatitos activados!' : 'Gatitos desactivados.', 'info');
                };
            }

            this.applyGrayMode(Storage.getGrayModeEnabled());
            this.updateHiddenKitties();
            updateSecretButtons();
        }

        updateHiddenKitties() {
            const Storage = window.StorageModule;
            const useCats = Storage.isSecretUnlocked() && Storage.getSecretCatsEnabled();
            const targets = [
                document.getElementById('add-task-btn'),
                document.getElementById('add-note-btn'),
                document.getElementById('add-subject-btn')
            ];

            targets.forEach(btn => {
                if (!btn) return;
                let badge = btn.querySelector('.hidden-kitty-badge');
                if (useCats) {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'hidden-kitty-badge select-none';
                        badge.textContent = '🐾';
                        btn.style.position = 'relative';
                        btn.appendChild(badge);
                    }
                } else {
                    if (badge) badge.remove();
                }
            });
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

            const userName = Storage.getUserName?.();
            const sloganDisplay = userName ? userName : (inst.slogan ? `"${inst.slogan}"` : '');

            if (logoContainer) logoContainer.innerHTML = InstitutionsModule.renderIconHtml(inst, 'w-10 h-10');
            if (nameEl) nameEl.textContent = inst.name;
            if (typeEl) typeEl.textContent = inst.systemType || inst.type;
            if (drawerLogo) drawerLogo.innerHTML = InstitutionsModule.renderIconHtml(inst, 'w-12 h-12');
            if (drawerName) drawerName.textContent = inst.name;
            if (drawerSlogan) {
                drawerSlogan.textContent = sloganDisplay;
                drawerSlogan.title = userName || inst.slogan || '';
            }

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
            if (settingsSlogan) settingsSlogan.textContent = sloganDisplay;
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

        renderSettingsSchools() {
            return this.renderInstitutionGrid();
        }

        renderInstitutionGrid() {
            const grid = document.getElementById('settings-institution-grid');
            const pillsContainer = document.getElementById('settings-country-pills');
            const InstitutionsModule = window.InstitutionsModule;
            const Storage = window.StorageModule;
            if (!grid || !InstitutionsModule) return;

            const countries = InstitutionsModule.getCountries();
            const allInstitutions = InstitutionsModule.getAllInstitutions();
            const customSchools = Storage?.getCustomSchools?.() || [];
            const activeId = this.activeInstitution?.id || 'unam';
            const currentFilter = this.selectedCountryFilter || 'all';

            // 1. Renderizar píldoras horizontales de filtro por país y Mis Escuelas
            if (pillsContainer) {
                const filterOptions = [
                    { id: 'all', label: 'Todas' },
                    ...countries.map(c => ({ id: c.code, label: c.name })),
                    { id: 'custom', label: `⭐ Mis Escuelas (${customSchools.length})` }
                ];

                pillsContainer.innerHTML = filterOptions.map(opt => {
                    const isSelected = opt.id === currentFilter;
                    const pillClass = isSelected
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold';

                    return `
                        <button type="button" data-country-filter="${opt.id}"
                            class="tap-effect shrink-0 px-3 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap ${pillClass}">
                            ${opt.label}
                        </button>
                    `;
                }).join('');

                pillsContainer.querySelectorAll('[data-country-filter]').forEach(btn => {
                    btn.onclick = () => {
                        this.selectedCountryFilter = btn.dataset.countryFilter;
                        window.HapticsModule?.light();
                        this.renderInstitutionGrid();
                    };
                });
            }

            // 2. Filtrar instituciones según selección activa
            let filtered = [];
            if (currentFilter === 'all') {
                filtered = allInstitutions;
            } else if (currentFilter === 'custom') {
                filtered = allInstitutions.filter(inst => inst.isCustom);
            } else {
                filtered = allInstitutions.filter(inst => inst.countryCode === currentFilter);
            }

            // 3. Renderizar tarjetas en la rejilla
            let cardsHtml = filtered.map(inst => {
                const isActive = inst.id === activeId;
                const activeClasses = isActive 
                    ? 'ring-2 ring-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200/80 dark:border-slate-700/70';

                const countryTag = inst.isCustom 
                    ? '<span class="text-[8.5px] font-extrabold text-amber-500 leading-none">⭐ Propia</span>'
                    : (inst.countryCode ? `<span class="text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight leading-none">${inst.countryCode}</span>` : '<span></span>');

                const statusBadge = isActive
                    ? `<span class="px-1.5 py-0.5 rounded bg-indigo-600 text-[7.5px] font-black text-white uppercase tracking-wider shadow-2xs leading-none ${inst.isCustom ? 'mr-5' : ''}">Actual</span>`
                    : '';

                const editBtnHtml = inst.isCustom ? `
                    <button type="button" data-edit-custom-id="${inst.id}"
                        class="edit-custom-school-btn absolute top-1 right-1 p-1 rounded-md bg-slate-100/90 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 dark:bg-slate-700/90 dark:hover:bg-slate-600 tap-effect transition-colors z-10"
                        title="Editar ${inst.name}">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                ` : '';

                return `
                    <div class="relative group">
                        <button type="button" data-inst-id="${inst.id}"
                            class="inst-grid-card tap-effect w-full flex flex-col items-center text-center py-1 px-1.5 rounded-xl border transition-all ${activeClasses}"
                            title="Seleccionar ${inst.name}">
                            <!-- Micro-cabecera con país/tipo y estado Actual -->
                            <div class="w-full flex items-center justify-between gap-1 px-0.5 leading-none h-3">
                                ${countryTag}
                                ${statusBadge}
                            </div>
                            <!-- Escudo oficial en contenedor de marco blanco permanente -->
                            <div class="my-0 flex items-center justify-center">
                                ${InstitutionsModule.renderIconHtml(inst, 'w-8 h-8 rounded-lg p-0.5', 'w-full h-full object-contain')}
                            </div>
                            <span class="text-[11px] font-black text-slate-900 dark:text-white truncate w-full block text-center px-0.5 leading-tight">
                                ${inst.name}
                            </span>
                            <span class="text-[9px] text-slate-500 dark:text-slate-400 truncate w-full block text-center font-medium leading-tight mt-0.5">
                                ${inst.systemType || inst.type}
                            </span>
                        </button>
                        ${editBtnHtml}
                    </div>
                `;
            }).join('');

            // Agregar tarjeta interactiva "+ Crear Escuela" en formato compacto uniforme
            const createCardHtml = `
                <button type="button" id="grid-create-school-card"
                    class="tap-effect flex flex-col items-center justify-center text-center py-1 px-1.5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700/60 hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/80 transition-all text-indigo-600 dark:text-indigo-400 min-h-[78px] max-h-[82px] h-[81px]"
                    title="Crear nueva escuela personalizada">
                    <div class="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xs mb-0.5 font-bold">
                        ➕
                    </div>
                    <span class="text-[11px] font-black leading-tight">Crear Escuela</span>
                    <span class="text-[9px] text-indigo-500/80 font-medium leading-tight">Personalizada</span>
                </button>
            `;
            grid.innerHTML = cardsHtml + createCardHtml;

            // Manejadores de eventos a cada tarjeta del selector
            grid.querySelectorAll('.inst-grid-card').forEach(card => {
                card.onclick = () => {
                    const instId = card.dataset.instId;
                    window.HapticsModule?.light();
                    this.setInstitution(instId);
                    this.showToast(`Institución seleccionada: ${this.activeInstitution.name}`, 'success');
                    setTimeout(() => {
                        card.closest('.settings-accordion-card')?.classList.remove('open');
                    }, 400);
                };
            });

            // Manejadores para editar escuelas personalizadas
            grid.querySelectorAll('.edit-custom-school-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const schoolId = btn.dataset.editCustomId;
                    this.openCustomSchoolModal(schoolId);
                };
            });

            // Manejador botón crear en cuadrícula
            const gridCreateBtn = document.getElementById('grid-create-school-card');
            if (gridCreateBtn) {
                gridCreateBtn.onclick = () => this.openCustomSchoolModal();
            }
        }

        updatePeriodSelectors(inst) {
            const Storage = window.StorageModule;
            const currentPeriod = Storage.getAcademicPeriod();
            const headerPeriodSelect = document.getElementById('header-period-select');
            const settingsPeriodSelect = document.getElementById('settings-period-select');
            const periodPillsContainer = document.getElementById('settings-period-pills');
            const customPeriodInput = document.getElementById('custom-period-input');
            const saveCustomPeriodBtn = document.getElementById('save-custom-period-btn');
            const headerPeriodLabel = document.getElementById('header-inst-period');
            const drawerPeriodLabel = document.getElementById('drawer-inst-period');
            const settingsPeriodBadge = document.getElementById('settings-inst-period-badge');

            // Preservar periodo válido del usuario sin sobreescribir con defaultPeriod (evitar arrastrar "Sin periodo")
            const isStalePlaceholder = !currentPeriod || currentPeriod.trim() === 'Sin periodo';
            const activePeriod = (!isStalePlaceholder && inst.periods?.includes(currentPeriod.trim()))
                ? currentPeriod.trim()
                : (inst?.defaultPeriod || inst?.periods?.[0] || '1.º Semestre');
            Storage.setAcademicPeriod(activePeriod);

            const optionsHtml = inst.periods.map(p => `
                <option value="${p}">${p}</option>
            `).join('');

            if (headerPeriodSelect) {
                headerPeriodSelect.innerHTML = optionsHtml;
                if (!inst.periods.includes(activePeriod)) {
                    const opt = document.createElement('option');
                    opt.value = activePeriod;
                    opt.textContent = activePeriod;
                    headerPeriodSelect.appendChild(opt);
                }
                headerPeriodSelect.value = activePeriod;
            }

            if (settingsPeriodSelect) {
                settingsPeriodSelect.innerHTML = optionsHtml;
                if (!inst.periods.includes(activePeriod)) {
                    const opt = document.createElement('option');
                    opt.value = activePeriod;
                    opt.textContent = activePeriod;
                    settingsPeriodSelect.appendChild(opt);
                }
                settingsPeriodSelect.value = activePeriod;
            }

            // Renderizar grupo de botones tipo píldora para selección táctil hermosa
            if (periodPillsContainer) {
                let pillsList = [...inst.periods];
                if (!pillsList.includes(activePeriod)) {
                    pillsList.push(activePeriod);
                }

                periodPillsContainer.innerHTML = '';
                pillsList.forEach(p => {
                    const isSelected = p === activePeriod;
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.dataset.periodBtn = p;
                    btn.className = `period-pill-btn tap-effect px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                            : 'bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-transparent'
                    }`;
                    btn.textContent = p;
                    btn.onclick = () => this.setAcademicPeriod(p);
                    periodPillsContainer.appendChild(btn);
                });
            }

            // Sincronizar input de periodo personalizado
            if (customPeriodInput) {
                customPeriodInput.value = inst.periods.includes(activePeriod) ? '' : activePeriod;
                customPeriodInput.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = customPeriodInput.value.trim();
                        if (val) this.setAcademicPeriod(val);
                    }
                };
            }
            if (saveCustomPeriodBtn) {
                saveCustomPeriodBtn.onclick = () => {
                    const val = customPeriodInput?.value?.trim();
                    if (val) this.setAcademicPeriod(val);
                };
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
            const customPeriodInput = document.getElementById('custom-period-input');
            const headerPeriodLabel = document.getElementById('header-inst-period');
            const drawerPeriodLabel = document.getElementById('drawer-inst-period');
            const settingsPeriodBadge = document.getElementById('settings-inst-period-badge');

            if (headerPeriodSelect) {
                const exists = Array.from(headerPeriodSelect.options).some(o => o.value === period);
                if (!exists) {
                    const opt = document.createElement('option');
                    opt.value = period;
                    opt.textContent = period;
                    headerPeriodSelect.appendChild(opt);
                }
                headerPeriodSelect.value = period;
            }
            if (settingsPeriodSelect) {
                const exists = Array.from(settingsPeriodSelect.options).some(o => o.value === period);
                if (!exists) {
                    const opt = document.createElement('option');
                    opt.value = period;
                    opt.textContent = period;
                    settingsPeriodSelect.appendChild(opt);
                }
                settingsPeriodSelect.value = period;
            }
            if (headerPeriodLabel) headerPeriodLabel.textContent = period;
            if (drawerPeriodLabel) drawerPeriodLabel.textContent = period;
            if (settingsPeriodBadge) settingsPeriodBadge.textContent = period;

            // Re-renderizar píldoras para que la personalizada o seleccionada aparezca y esté activa
            const inst = this.activeInstitution || window.InstitutionsModule?.getInstitution('unam');
            if (inst) {
                const periodPillsContainer = document.getElementById('settings-period-pills');
                if (periodPillsContainer) {
                    let pillsList = [...inst.periods];
                    if (!pillsList.includes(period)) {
                        pillsList.push(period);
                    }
                    periodPillsContainer.innerHTML = '';
                    pillsList.forEach(p => {
                        const isSelected = p === period;
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.dataset.periodBtn = p;
                        btn.className = `period-pill-btn tap-effect px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                                : 'bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-transparent'
                        }`;
                        btn.textContent = p;
                        btn.onclick = () => this.setAcademicPeriod(p);
                        periodPillsContainer.appendChild(btn);
                    });
                }
            }

            if (customPeriodInput) {
                customPeriodInput.value = (inst && inst.periods.includes(period)) ? '' : period;
            }

            this.showToast(`Periodo actualizado: ${period}`, 'info');
        }

        setupInstitutionAndPeriodSelectors() {
            const headerInstSelect = document.getElementById('header-institution-select');
            const headerPeriodSelect = document.getElementById('header-period-select');
            const InstitutionsModule = window.InstitutionsModule;
            const Storage = window.StorageModule;

            if (headerInstSelect && InstitutionsModule) {
                const countries = InstitutionsModule.getCountries();
                const builtIns = Object.values(InstitutionsModule.INSTITUTIONS);
                const customSchools = Storage?.getCustomSchools?.() || [];

                let html = '<option value="unconfigured">🎓 Sin institución</option>';
                countries.forEach(c => {
                    const groupSchools = builtIns.filter(inst => inst.countryCode === c.code);
                    if (groupSchools.length > 0) {
                        html += `<optgroup label="${c.name}">`;
                        groupSchools.forEach(inst => {
                            html += `<option value="${inst.id}">🎓 ${inst.name} - ${inst.systemType || inst.shortBadge}</option>`;
                        });
                        html += `</optgroup>`;
                    }
                });

                if (customSchools.length > 0) {
                    html += `<optgroup label="⭐ Mis Escuelas Personalizadas">`;
                    customSchools.forEach(cs => {
                        html += `<option value="${cs.id}">⭐ ${cs.name} - ${cs.systemType || 'Personalizada'}</option>`;
                    });
                    html += `</optgroup>`;
                }

                headerInstSelect.innerHTML = html;
                headerInstSelect.value = this.activeInstitution?.id || (Storage?.isSchoolSkipped?.() ? 'unconfigured' : 'unam');
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
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const targetView = btn.dataset.viewTarget;
                    this.switchView(targetView);
                    this.closeSidebarDrawer?.();
                });
            });
        }

        closeAllSettingsSubmenus() {
            document.querySelectorAll('.settings-accordion-card.open').forEach(c => c.classList.remove('open'));
        }

        switchView(viewName) {
            this.currentView = viewName;
            window.HapticsModule?.light();
            // v1.4.2: al cambiar de vista, todos los submenús de ajustes se cierran automáticamente.
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

            // Actualizar botones de navegación activos
            document.querySelectorAll('[data-view-target]').forEach(btn => {
                const isMatch = btn.dataset.viewTarget === viewName;
                if (btn.classList.contains('nav-link-btn')) {
                    if (isMatch) {
                        btn.classList.add('text-indigo-600', 'dark:text-indigo-400', 'font-bold');
                        btn.classList.remove('text-slate-600', 'dark:text-slate-400', 'font-semibold');
                        if (btn.closest('header nav')) {
                            btn.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-xs');
                        }
                    } else {
                        btn.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'font-bold', 'bg-white', 'dark:bg-slate-700', 'shadow-xs');
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
                        const todayStr = new Date().toISOString().split('T')[0];
                        if (cycle.endDate && todayStr > cycle.endDate) {
                            cycleBadge.textContent = 'Terminado';
                            cycleBadge.className = 'text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-500 text-white shadow-xs';
                        } else if (cycle.startDate && todayStr < cycle.startDate) {
                            cycleBadge.textContent = 'Programado';
                            cycleBadge.className = 'text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-600 text-white shadow-xs';
                        } else {
                            cycleBadge.textContent = 'Vigente';
                            cycleBadge.className = 'text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs';
                        }
                    }
                }

                // Resplandor temático con el aura institucional oficial (UAM naranja, CCH dorado, IPN guinda)
                if (glow) {
                    let auraColor = inst.colors?.aura;
                    if (!auraColor) {
                        const sec = inst.colors?.secondary;
                        if (sec && sec !== '#1C1C1C' && sec !== '#FFFFFF' && sec !== '#000000') {
                            auraColor = sec;
                        } else {
                            auraColor = inst.colors?.primary || '#6366F1';
                        }
                    }
                    if (inst.id === 'uam') {
                        auraColor = '#E84D0E'; // Naranja institucional radiante UAM
                    } else if (inst.id === 'cch') {
                        auraColor = '#F59E0B'; // Resplandor dorado CCH
                    } else if (inst.id === 'ipn' || inst.id === 'cecyt') {
                        auraColor = '#9A2A63'; // Magenta/guinda Politécnico
                    }
                    glow.style.backgroundColor = auraColor;
                    glow.style.boxShadow = `0 0 130px 48px ${auraColor}`;
                    glow.style.opacity = '0.75';
                }

                // Calcular origen de animación dinámica desde el logo superior hasta el centro
                if (headerLogo) {
                    const rect = headerLogo.getBoundingClientRect();
                    const originX = (rect.left + rect.width / 2) - (window.innerWidth / 2);
                    const originY = (rect.top + rect.height / 2) - (window.innerHeight / 2);
                    card.style.setProperty('--origin-x', `${originX}px`);
                    card.style.setProperty('--origin-y', `${originY}px`);
                }

                card.classList.remove('school-identity-exit-right');
                card.classList.add('school-identity-card-anim');

                modal.classList.remove('hidden');
                modal.classList.add('flex');
                document.body.classList.add('overflow-hidden');

                requestAnimationFrame(() => {
                    modal.classList.add('active');
                });
            };

            const closeModal = () => {
                if (!modal || modal.classList.contains('hidden') || card.classList.contains('school-identity-exit-right')) return;
                window.HapticsModule?.light();

                // Salida rápida y dinámica de la ventana y el escudo hacia el lado DERECHO
                card.classList.remove('school-identity-card-anim');
                card.classList.add('school-identity-exit-right');

                if (backdrop) {
                    backdrop.style.transition = 'opacity 0.32s ease';
                    backdrop.style.opacity = '0';
                }

                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                    modal.classList.remove('active');
                    card.classList.remove('school-identity-exit-right');
                    if (backdrop) {
                        backdrop.style.opacity = '';
                        backdrop.style.transition = '';
                    }
                    document.body.classList.remove('overflow-hidden');
                }, 310);
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
           MODAL CONSTRUCTOR DE ESCUELAS PERSONALIZADAS
           ======================================================== */
        setupCustomSchoolModal() {
            const modal = document.getElementById('custom-school-modal');
            const backdrop = document.getElementById('custom-school-backdrop');
            const closeBtn = document.getElementById('custom-school-close-btn');
            const cancelBtn = document.getElementById('custom-school-cancel-btn');
            const form = document.getElementById('custom-school-form');
            const openBtn = document.getElementById('open-create-school-btn');
            const deleteBtn = document.getElementById('custom-school-delete-btn');
            const titleEl = document.getElementById('custom-school-modal-title');

            const idInput = document.getElementById('custom-school-id');
            const nameInput = document.getElementById('custom-school-name');
            const shortbadgeInput = document.getElementById('custom-school-shortbadge');
            const fullnameInput = document.getElementById('custom-school-fullname');
            const sloganInput = document.getElementById('custom-school-slogan');
            const countrySelect = document.getElementById('custom-school-country');
            const systemSelect = document.getElementById('custom-school-system');
            const colorInput = document.getElementById('custom-school-color');
            const colorPresets = document.getElementById('custom-school-color-presets');
            const logoInput = document.getElementById('custom-school-logo-input');
            const logoPreview = document.getElementById('custom-school-logo-preview');
            const canvas = document.getElementById('custom-school-canvas') || document.createElement('canvas');

            const Storage = window.StorageModule;
            const InstitutionsModule = window.InstitutionsModule;

            if (!modal) return;

            // Población de países en el selector
            if (countrySelect && InstitutionsModule) {
                countrySelect.innerHTML = InstitutionsModule.getCountries().map(c => `
                    <option value="${c.code}">${c.name}</option>
                `).join('');
            }

            // Población de presets de colores institucionales
            if (colorPresets) {
                const presets = [
                    '#4F46E5', '#002B7A', '#6C1D45', '#E84D0E', '#006847',
                    '#0039A6', '#0F6938', '#003A70', '#781D22', '#D32F2F', '#0083CA'
                ];
                colorPresets.innerHTML = presets.map(color => `
                    <button type="button" data-preset-color="${color}"
                        class="w-6 h-6 rounded-lg transition-transform hover:scale-110 border border-black/10 dark:border-white/10 shadow-2xs"
                        style="background-color: ${color};" title="${color}"></button>
                `).join('');

                colorPresets.querySelectorAll('[data-preset-color]').forEach(btn => {
                    btn.onclick = () => {
                        if (colorInput) {
                            colorInput.value = btn.dataset.presetColor;
                            updatePreviewDefaultLogo();
                        }
                    };
                });
            }

            const updatePreviewDefaultLogo = () => {
                if (logoPreview && !logoPreview.dataset.customUploaded) {
                    const initials = (shortbadgeInput?.value || nameInput?.value || 'ESC').trim().substring(0, 4).toUpperCase();
                    const color = colorInput?.value || '#4F46E5';
                    logoPreview.innerHTML = `
                        <div class="w-full h-full rounded-xl flex items-center justify-center font-black text-sm text-white shadow-2xs"
                            style="background-color: ${color};">
                            ${initials || 'ESC'}
                        </div>
                    `;
                }
            };

            if (nameInput) {
                nameInput.oninput = () => {
                    if (!shortbadgeInput.value || shortbadgeInput.dataset.auto) {
                        shortbadgeInput.value = nameInput.value.substring(0, 6).toUpperCase();
                        shortbadgeInput.dataset.auto = 'true';
                    }
                    updatePreviewDefaultLogo();
                };
            }
            if (shortbadgeInput) {
                shortbadgeInput.oninput = () => {
                    delete shortbadgeInput.dataset.auto;
                    updatePreviewDefaultLogo();
                };
            }
            if (colorInput) {
                colorInput.oninput = () => updatePreviewDefaultLogo();
            }

            // Manejo de archivo y downsampling con Canvas (max 256x256 px, <30 KB)
            const downsampleAndPreviewLogo = (file) => {
                if (!file) return;

                const reader = new FileReader();
                reader.onerror = () => {
                    window.AppInstance?.showToast?.('Error al leer el archivo seleccionado', 'error');
                };
                reader.onload = (event) => {
                    const img = new Image();
                    img.onerror = () => {
                        if (logoPreview) {
                            delete logoPreview.dataset.customUploaded;
                            delete logoPreview.dataset.logoBase64;
                        }
                        updatePreviewDefaultLogo();
                        window.AppInstance?.showToast?.('Archivo de imagen no válido o dañado', 'error');
                    };
                    img.onload = () => {
                        let maxDim = 256;
                        let w = img.width;
                        let h = img.height;
                        if (w > maxDim || h > maxDim) {
                            if (w > h) {
                                h = Math.round((h * maxDim) / w);
                                w = maxDim;
                            } else {
                                w = Math.round((w * maxDim) / h);
                                h = maxDim;
                            }
                        }
                        canvas.width = w;
                        canvas.height = h;
                        let ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, w, h);
                        ctx.drawImage(img, 0, 0, w, h);

                        // Probar compresión progresiva para garantizar < 30KB (~35,000 caracteres DataURI)
                        let dataUrl = canvas.toDataURL('image/png');
                        if (dataUrl.length > 35000) {
                            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                        }
                        if (dataUrl.length > 35000) {
                            dataUrl = canvas.toDataURL('image/jpeg', 0.65);
                        }
                        if (dataUrl.length > 35000) {
                            dataUrl = canvas.toDataURL('image/jpeg', 0.45);
                        }

                        // Si aún excede 35,000 caracteres, reducir dimensiones a max 180x180 px
                        if (dataUrl.length > 35000) {
                            maxDim = 180;
                            w = img.width;
                            h = img.height;
                            if (w > maxDim || h > maxDim) {
                                if (w > h) {
                                    h = Math.round((h * maxDim) / w);
                                    w = maxDim;
                                } else {
                                    w = Math.round((w * maxDim) / h);
                                    h = maxDim;
                                }
                            }
                            canvas.width = w;
                            canvas.height = h;
                            ctx.clearRect(0, 0, w, h);
                            ctx.drawImage(img, 0, 0, w, h);

                            dataUrl = canvas.toDataURL('image/jpeg', 0.65);
                            if (dataUrl.length > 35000) {
                                dataUrl = canvas.toDataURL('image/jpeg', 0.45);
                            }
                        }

                        if (logoPreview) {
                            logoPreview.dataset.customUploaded = 'true';
                            logoPreview.dataset.logoBase64 = dataUrl;
                            logoPreview.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-contain">`;
                        }
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            };

            if (logoInput) {
                logoInput.onchange = (e) => {
                    const file = e?.target?.files?.[0] || logoInput.files?.[0];
                    if (file) {
                        downsampleAndPreviewLogo(file);
                    }
                };
            }

            const openModal = (schoolId = null) => {
                window.HapticsModule?.light();
                delete logoPreview.dataset.customUploaded;
                delete logoPreview.dataset.logoBase64;
                if (logoInput) logoInput.value = '';

                if (schoolId) {
                    // Modo Edición
                    const school = InstitutionsModule.getInstitution(schoolId);
                    if (titleEl) titleEl.textContent = 'Editar Escuela Personalizada';
                    if (idInput) idInput.value = school.id;
                    if (nameInput) nameInput.value = school.name;
                    if (shortbadgeInput) shortbadgeInput.value = school.shortBadge || school.name;
                    if (fullnameInput) fullnameInput.value = school.fullName;
                    if (sloganInput) sloganInput.value = school.slogan || '';
                    if (countrySelect) countrySelect.value = school.countryCode || 'MX';
                    if (systemSelect) systemSelect.value = school.systemType || 'Semestral';
                    if (colorInput) colorInput.value = school.colors?.primary || '#4F46E5';
                    if (deleteBtn) deleteBtn.classList.remove('hidden');

                    if (logoPreview) {
                        if (school.icon) {
                            logoPreview.dataset.customUploaded = 'true';
                            logoPreview.dataset.logoBase64 = school.icon;
                            logoPreview.innerHTML = `<img src="${school.icon}" class="w-full h-full object-contain">`;
                        } else {
                            updatePreviewDefaultLogo();
                        }
                    }
                } else {
                    // Modo Creación
                    if (titleEl) titleEl.textContent = 'Constructor de Escuela Personalizada';
                    if (idInput) idInput.value = '';
                    if (nameInput) nameInput.value = '';
                    if (shortbadgeInput) shortbadgeInput.value = '';
                    if (fullnameInput) fullnameInput.value = '';
                    if (sloganInput) sloganInput.value = '';
                    if (countrySelect) countrySelect.value = 'MX';
                    if (systemSelect) systemSelect.value = 'Semestral';
                    if (colorInput) colorInput.value = '#4F46E5';
                    if (deleteBtn) deleteBtn.classList.add('hidden');
                    updatePreviewDefaultLogo();
                }

                modal.style.display = '';
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                document.body.classList.add('overflow-hidden');
                requestAnimationFrame(() => modal.classList.add('active'));
            };

            const closeModal = () => {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                    modal.style.display = 'none';
                    const onboardingModal = document.getElementById('cycle-setup-modal');
                    if (!onboardingModal || onboardingModal.classList.contains('hidden')) {
                        document.body.classList.remove('overflow-hidden');
                    }
                }, 200);
            };

            this.openCustomSchoolModal = openModal;
            this.closeCustomSchoolModal = closeModal;
            this.downsampleAndPreviewLogo = downsampleAndPreviewLogo;

            if (openBtn) openBtn.onclick = () => openModal();
            if (closeBtn) closeBtn.onclick = closeModal;
            if (cancelBtn) cancelBtn.onclick = closeModal;
            if (backdrop) backdrop.onclick = closeModal;

            // Eliminar escuela personalizada
            if (deleteBtn) {
                deleteBtn.onclick = () => {
                    const schoolId = idInput?.value;
                    if (!schoolId) return;

                    const school = InstitutionsModule.getInstitution(schoolId);
                    const name = school ? school.name : 'esta escuela';
                    if (confirm(`¿Estás seguro de que deseas eliminar la escuela "${name}"?`)) {
                        window.HapticsModule?.medium();
                        Storage.deleteCustomSchool(schoolId);
                        closeModal();
                        this.setInstitution(Storage.getInstitution());
                        this.setupInstitutionAndPeriodSelectors();
                        this.renderInstitutionGrid();
                        this.showToast(`Escuela "${name}" eliminada`, 'info');
                    }
                };
            }

            // Guardar escuela personalizada
            if (form) {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    window.HapticsModule?.double();

                    const name = nameInput.value.trim();
                    const shortBadge = shortbadgeInput.value.trim() || name.substring(0, 6).toUpperCase();
                    const fullName = fullnameInput.value.trim() || name;
                    const slogan = sloganInput.value.trim() || 'Construyendo el futuro';
                    const countryCode = countrySelect.value;
                    const countries = InstitutionsModule.getCountries();
                    const countryObj = countries.find(c => c.code === countryCode) || { name: 'México', code: 'MX', flag: '🇲🇽' };
                    const systemType = systemSelect.value;
                    const primaryColor = colorInput.value || '#4F46E5';

                    // Generar lista de periodos según el sistema seleccionado
                    let periodsList = [];
                    if (systemType === 'Cuatrimestral') {
                        periodsList = ['1.º Cuatrimestre', '2.º Cuatrimestre', '3.º Cuatrimestre', '4.º Cuatrimestre', '5.º Cuatrimestre', '6.º Cuatrimestre', '7.º Cuatrimestre', '8.º Cuatrimestre', '9.º Cuatrimestre', '10.º Cuatrimestre'];
                    } else if (systemType === 'Trimestral') {
                        periodsList = ['1.º Trimestre', '2.º Trimestre', '3.º Trimestre', '4.º Trimestre', '5.º Trimestre', '6.º Trimestre', '7.º Trimestre', '8.º Trimestre', '9.º Trimestre', '10.º Trimestre', '11.º Trimestre', '12.º Trimestre'];
                    } else if (systemType === 'Anual') {
                        periodsList = ['1.º Año', '2.º Año', '3.º Año', '4.º Año', '5.º Año'];
                    } else if (systemType === 'Modular') {
                        periodsList = ['Módulo 1', 'Módulo 2', 'Módulo 3', 'Módulo 4', 'Módulo 5', 'Módulo 6', 'Módulo 7', 'Módulo 8'];
                    } else {
                        periodsList = ['1.º Semestre', '2.º Semestre', '3.º Semestre', '4.º Semestre', '5.º Semestre', '6.º Semestre', '7.º Semestre', '8.º Semestre', '9.º Semestre', '10.º Semestre'];
                    }

                    // Determinar icono (logo subido o SVG autogenerado con siglas)
                    let iconUrl = logoPreview?.dataset?.logoBase64;
                    if (!iconUrl) {
                        const initials = shortBadge.substring(0, 4).toUpperCase();
                        const safeColor = encodeURIComponent(primaryColor);
                        iconUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="44" fill="${safeColor}"/><text x="100" y="118" fill="%23FFFFFF" font-family="system-ui, sans-serif" font-size="44" font-weight="900" text-anchor="middle">${encodeURIComponent(initials)}</text></svg>`;
                    }

                    const schoolData = {
                        id: idInput.value || undefined,
                        name: name,
                        shortBadge: shortBadge,
                        fullName: fullName,
                        slogan: slogan,
                        country: countryObj.name,
                        countryCode: countryObj.code,
                        countryFlag: countryObj.flag,
                        systemType: systemType,
                        icon: iconUrl,
                        colors: {
                            primary: primaryColor,
                            secondary: '#FFFFFF',
                            accent: primaryColor,
                            aura: primaryColor,
                            badgeBg: `bg-[${primaryColor}]`,
                            badgeText: 'text-white'
                        },
                        periods: periodsList,
                        defaultPeriod: periodsList[0],
                        isCustom: true
                    };

                    try {
                        const saved = Storage.saveCustomSchool(schoolData);
                        this.setInstitution(saved.id);
                        closeModal();
                        this.setupInstitutionAndPeriodSelectors();
                        this.renderInstitutionGrid();
                        this.onCustomSchoolCreated?.(saved);
                        this.showToast(`Escuela "${saved.name}" guardada con éxito`, 'success');
                    } catch (err) {
                        this.showToast(err.message || 'Error al guardar la escuela', 'error');
                    }
                };
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
            const welcomeTypeInst = document.getElementById('welcome-type-institution');
            const welcomeTypeAct = document.getElementById('welcome-type-activities');

            const welcomePhotoInput = document.getElementById('welcome-photo-input');
            const welcomePhotoPreview = document.getElementById('welcome-photo-preview');
            const welcomePhotoPlaceholder = document.getElementById('welcome-photo-placeholder');
            const welcomePhotoClearBtn = document.getElementById('welcome-photo-clear-btn');

            const celebrationContainer = document.getElementById('onboarding-celebration-container');
            const progressBar = document.getElementById('onboarding-progress-bar');
            const celebrationMsg = document.getElementById('onboarding-celebration-msg');

            const createSchoolBtn = document.getElementById('welcome-create-school-btn');

            const Storage = window.StorageModule;
            const InstitutionsModule = window.InstitutionsModule;

            if (!modal) return;

            let currentAccountType = Storage?.getAccountType?.() || 'institution';

            // 1. Selector interactivo de modalidad (Institución vs Organizador de actividades)
            const updateAccountTypeUI = (type) => {
                currentAccountType = type === 'activities' ? 'organizer' : type;
                Storage?.setAccountType?.(currentAccountType);

                if (welcomeTypeInst && welcomeTypeAct) {
                    const isInst = currentAccountType === 'institution';
                    const instCheck = welcomeTypeInst.querySelector('.welcome-type-check');
                    const actCheck = welcomeTypeAct.querySelector('.welcome-type-check');

                    if (isInst) {
                        welcomeTypeInst.className = 'tap-effect cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2.5 border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-950/40';
                        welcomeTypeAct.className = 'tap-effect cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2.5 border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600';
                        if (instCheck) instCheck.classList.remove('hidden');
                        if (actCheck) actCheck.classList.add('hidden');
                    } else {
                        welcomeTypeAct.className = 'tap-effect cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2.5 border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-950/40';
                        welcomeTypeInst.className = 'tap-effect cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2.5 border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600';
                        if (actCheck) actCheck.classList.remove('hidden');
                        if (instCheck) instCheck.classList.add('hidden');
                    }
                }
            };

            if (welcomeTypeInst) {
                welcomeTypeInst.onclick = () => {
                    window.HapticsModule?.light?.();
                    updateAccountTypeUI('institution');
                };
            }

            if (welcomeTypeAct) {
                welcomeTypeAct.onclick = () => {
                    window.HapticsModule?.light?.();
                    updateAccountTypeUI('organizer');
                };
            }

            // 2. Subida de Foto y Reducción mediante Canvas HTML5 (máx 256x256, <30KB)
            const downsampleAndSavePhoto = (file) => {
                if (!file || (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|webp|gif|bmp)$/i))) {
                    this.showToast('Solo se admiten archivos de imagen válidos.', 'warning');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
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

                        Storage?.setUserPhoto?.(dataUrl);

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
                        window.HapticsModule?.light?.();
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            };

            if (welcomePhotoInput) {
                const handlePhotoChange = (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        downsampleAndSavePhoto(file);
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
                };
            }

            // 3. Compatibilidad con Constructor de Escuela Personalizada (T5_ADV_03)
            if (createSchoolBtn) {
                createSchoolBtn.onclick = () => {
                    this.openCustomSchoolModal?.();
                };
            }

            this.onCustomSchoolCreated = () => {};
            this.refreshWelcomeSchoolsGrid = () => {};

            // 4. Apertura y Cierre de Onboarding
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

                updateAccountTypeUI(Storage?.getAccountType?.() || 'institution');

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

            // 5. Animación de Celebración con Barra de Progreso y Transición a Dashboard
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

            // 6. Envío del Formulario
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

                        this.switchView?.('dashboard');
                        this.renderHeader?.();
                        this.renderDrawer?.();
                        this.refreshAll?.();

                        this.showToast('¡Configuración completada exitosamente! ¡Bienvenido!', 'success');

                        // Trigger deferred presentation flows
                        if (window.NotificationsModule?.requestPermission) {
                            window.NotificationsModule.requestPermission().catch(() => {});
                        }
                        const lastSeenVersion = Storage?.getLastSeenVersion?.();
                        if (lastSeenVersion !== '1.4.2') {
                            setTimeout(() => {
                                this.openChangelogModal?.();
                            }, 800);
                        }

                        this.isOnboardingSubmitting = false;
                    });
                };
            }

            // 7. Configuración con Ciclo Provisional
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

                        this.switchView?.('dashboard');
                        this.renderHeader?.();
                        this.renderDrawer?.();
                        this.refreshAll?.();

                        this.showToast('Bienvenido. Configuración completada con ciclo provisional.', 'info');

                        // Trigger deferred presentation flows
                        if (window.NotificationsModule?.requestPermission) {
                            window.NotificationsModule.requestPermission().catch(() => {});
                        }
                        const lastSeenVersion = Storage?.getLastSeenVersion?.();
                        if (lastSeenVersion !== '1.4.2') {
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
                    this.setInstitution(Storage.getInstitution());
                    window.HapticsModule?.light();
                    this.showToast('Nombre de usuario guardado con éxito.', 'success');
                    autoCloseCard(saveUserNameBtn);
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
                    // v1.4.2: la ventana de tipografías permanece abierta para poder probar varias fuentes seguidas.
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

            // 11. Novedades de Versión 1.4.2
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
                window.StorageModule.setLastSeenVersion('1.4.2');
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
                'COFFEE42', 'ARCADE90', 'STUDYMAX', 'GATITOS_', 'READABLE',
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
                        this.showToast('✨ ¡Todos los 11 temas y 5 fuentes han sido desbloqueados!', 'success');
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
                        if (codeDef.id === 'GATITOS_') {
                            window.StorageModule.unlockSecret();
                            window.StorageModule.setGrayModeEnabled(true);
                            window.StorageModule.setSecretCatsEnabled(true);
                            document.documentElement.classList.add('theme-gray');
                            document.body.classList.add('theme-gray');
                            this.applySecretFeaturesUI?.();
                        }
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

            if (unlocked.length === 0) {
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
            }).join('');

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
                        if (def.id === 'GATITOS_') {
                            window.StorageModule.unlockSecret();
                            window.StorageModule.setGrayModeEnabled(true);
                            window.StorageModule.setSecretCatsEnabled(true);
                            document.documentElement.classList.add('theme-gray');
                            document.body.classList.add('theme-gray');
                            this.applySecretFeaturesUI?.();
                        } else {
                            document.documentElement.classList.add('dark');
                            window.StorageModule.setTheme('dark');
                            this.updateThemeUI('dark', false);
                        }
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
                if (current !== 'gray' && current !== 'theme_cats' && current !== 'theme-gray') {
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
