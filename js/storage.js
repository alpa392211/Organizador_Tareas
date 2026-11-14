/**
 * Módulo de Almacenamiento Local (LocalStorage)
 * Gestiona la persistencia de materias, tareas, notas rápidas, ciclo escolar,
 * preferencias de botón principal inferior, respuesta háptica y perfil de usuario.
 * Inicia de forma completamente limpia (sin datos precargados).
 */

window.StorageModule = (() => {
    const KEYS = {
        ACADEMIC_PERIOD: 'org_escolar_period',
        ACADEMIC_CYCLE: 'org_escolar_cycle',
        SUBJECTS: 'org_escolar_subjects',
        TASKS: 'org_escolar_tasks',
        NOTES: 'agenda_cch_notes', // Clave oficial requerida para notas
        THEME: 'org_escolar_theme',
        BOTTOM_ACTION: 'org_escolar_bottom_action',
        HAPTICS: 'org_escolar_haptics',
        FONT_FAMILY: 'org_escolar_font',
        ARCHIVED_TASKS: 'org_escolar_archived_tasks',
        ARCHIVED_NOTES: 'org_escolar_archived_notes',
        AUTO_PURGE_ARCHIVE: 'org_escolar_auto_purge_archive',
        HEADER_THEME_BTN: 'org_escolar_header_theme_btn',
        CYCLE_CONFIGURED: 'org_escolar_cycle_configured_v1',
        SECRET_UNLOCKED: 'org_escolar_secret_unlocked_v1',
        GRAY_MODE: 'org_escolar_gray_mode_v1',
        INITIALIZED: 'org_escolar_initialized_v3',
        VAULT_UNLOCKED: 'org_escolar_vault_unlocked_codes_v2',
        ACTIVE_SPECIAL_THEME: 'org_escolar_active_special_theme_v1',
        APOLLO_ROCKETS_ENABLED: 'org_escolar_apollo_rockets_v1',
        USER_NAME: 'org_escolar_user_name',
        LAST_SEEN_VERSION: 'org_escolar_last_version',
        USER_PHOTO: 'org_escolar_user_photo',
        ACCOUNT_TYPE: 'org_escolar_account_type',
        LONG_PRESS: 'org_escolar_long_press_enabled_v1',
        GALLERY_PHOTOS: 'org_escolar_gallery_photos',
        GLASS_INTENSITY: 'org_escolar_glass_intensity_v1'
    };

    const LEGACY_KEYS = [
        'org_escolar_institution',
        'org_escolar_logo_expand',
        'org_escolar_cats_enabled_v1',
        'org_escolar_custom_schools',
        'org_escolar_custom_institutions',
        'org_escolar_school_skipped_v1',
        'org_escolar_user_country',
        'org_escolar_country_locked',
        'org_escolar_dev_notice_144_seen'
    ];

    const MAX_SUBJECTS = 16;

    /**
     * Calcula fechas por defecto sugeridas para el ciclo escolar actual
     */
    function getDefaultCycleDates() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-11

        let start, end;
        if (month >= 6) {
            start = `${year}-08-10`;
            end = `${year}-12-18`;
        } else {
            start = `${year}-02-02`;
            end = `${year}-06-26`;
        }
        return { startDate: start, endDate: end };
    }

    const DEMO_DATA = {
        period: '4.º Semestre',
        subjects: [
            {
                id: 'sub_demo_1',
                name: 'Cálculo Diferencial e Integral',
                color: '#6366F1',
                days: ['lun', 'mie', 'vie'],
                startTime: '07:00',
                endTime: '09:00',
                professor: 'Dra. Carmen Morales',
                classroom: 'Edificio B - Aula 204'
            },
            {
                id: 'sub_demo_2',
                name: 'Física Clásica y Mecánica',
                color: '#06B6D4',
                days: ['mar', 'jue'],
                startTime: '09:00',
                endTime: '11:00',
                professor: 'Mtro. Roberto Peña',
                classroom: 'Laboratorio de Ciencias 1'
            },
            {
                id: 'sub_demo_3',
                name: 'Estructuras de Datos y Algoritmos',
                color: '#10B981',
                days: ['lun', 'mie'],
                startTime: '11:00',
                endTime: '13:00',
                professor: 'Ing. Alejandro Vega',
                classroom: 'Centro de Cómputo 3'
            }
        ],
        tasks: [
            {
                id: 'tsk_demo_1',
                subjectId: 'sub_demo_1',
                title: 'Ejercicios de Límites y Continuidad',
                dueDate: '',
                completed: false,
                priority: 'alta',
                notes: 'Resolver los problemas pares del capítulo 3 en hojas blancas numeradas.'
            },
            {
                id: 'tsk_demo_2',
                subjectId: 'sub_demo_2',
                title: 'Reporte de Práctica 1: Movimiento Rectilíneo',
                dueDate: '',
                completed: false,
                priority: 'media',
                notes: 'Incluir gráficas en papel milimétrico y conclusiones individuales.'
            }
        ],
        notes: [
            {
                id: 'note_demo_1',
                title: 'Idea de Proyecto Final de Programación',
                content: 'Desarrollar un sistema de gestión escolar modular con arquitectura offline-first y soporte para widgets Android.',
                type: 'idea',
                hasReminder: false,
                reminderDateTime: '',
                createdAt: Date.now() - 86400000,
                updatedAt: Date.now() - 86400000
            },
            {
                id: 'note_demo_2',
                title: 'Fórmulas Clave Primer Parcial Física',
                content: 'MRUA: v = v0 + at | x = v0*t + 0.5*a*t^2 | v^2 = v0^2 + 2*a*x. Recordar revisar unidades en el SI.',
                type: 'apunte',
                hasReminder: true,
                reminderDateTime: '',
                createdAt: Date.now() - 43200000,
                updatedAt: Date.now() - 43200000
            },
            {
                id: 'note_demo_3',
                title: 'Pedir credencial de biblioteca central',
                content: 'Llevar tira de materias vigente y 2 fotografías tamaño infantil en horario de 9:00 a 14:00.',
                type: 'pendiente',
                hasReminder: false,
                reminderDateTime: '',
                createdAt: Date.now() - 20000000,
                updatedAt: Date.now() - 20000000
            }
        ]
    };

    const Storage = {
        MAX_SUBJECTS,

        cleanupLegacyKeys() {
            LEGACY_KEYS.forEach(k => {
                try {
                    localStorage.removeItem(k);
                } catch (_) {}
            });

            try {
                const rawCodes = localStorage.getItem(KEYS.VAULT_UNLOCKED);
                if (rawCodes) {
                    const parsed = JSON.parse(rawCodes);
                    if (Array.isArray(parsed)) {
                        const cleaned = parsed.filter(c => typeof c === 'string' && c.trim().toUpperCase() !== 'GATITOS_');
                        if (cleaned.length !== parsed.length) {
                            localStorage.setItem(KEYS.VAULT_UNLOCKED, JSON.stringify(cleaned));
                        }
                    }
                }
            } catch (_) {}

            try {
                const special = localStorage.getItem(KEYS.ACTIVE_SPECIAL_THEME);
                if (special === 'theme_cats' || special === 'cats') {
                    localStorage.setItem(KEYS.ACTIVE_SPECIAL_THEME, 'default');
                }
            } catch (_) {}
        },

        // --- Grado / Periodo Lectivo (Texto Libre) ---
        getAcademicPeriod() {
            return (localStorage.getItem(KEYS.ACADEMIC_PERIOD) || '').trim();
        },
        setAcademicPeriod(period) {
            const clean = typeof period === 'string' ? period.trim() : '';
            if (clean) {
                localStorage.setItem(KEYS.ACADEMIC_PERIOD, clean);
            } else {
                localStorage.removeItem(KEYS.ACADEMIC_PERIOD);
            }
        },

        // --- Nombre de Usuario e Identidad Estudiantil ---
        getUserName() {
            return (localStorage.getItem(KEYS.USER_NAME) || '').trim();
        },
        setUserName(name) {
            if (typeof name === 'string') {
                localStorage.setItem(KEYS.USER_NAME, name.trim());
            }
        },

        // --- Tipo de Cuenta ---
        getAccountType() {
            return localStorage.getItem(KEYS.ACCOUNT_TYPE) || 'organizer';
        },
        setAccountType(type) {
            if (typeof type === 'string' && type.trim()) {
                localStorage.setItem(KEYS.ACCOUNT_TYPE, type.trim());
            }
        },

        // --- Foto de Perfil ---
        getUserPhoto() {
            return localStorage.getItem(KEYS.USER_PHOTO) || '';
        },
        setUserPhoto(dataUrl) {
            if (typeof dataUrl === 'string' && dataUrl.length > 0) {
                localStorage.setItem(KEYS.USER_PHOTO, dataUrl);
            } else {
                localStorage.removeItem(KEYS.USER_PHOTO);
            }
        },

        // --- Control de Versión y Changelog de Novedades ---
        getLastSeenVersion() {
            return localStorage.getItem(KEYS.LAST_SEEN_VERSION) || null;
        },
        setLastSeenVersion(version) {
            localStorage.setItem(KEYS.LAST_SEEN_VERSION, version || '1.5.0');
        },

        // --- Conteo de Tareas y Desbloqueo Progresivo de Bóveda (1 cada 5 tareas) ---
        getCompletedTasksCount() {
            const activeTasks = this.getTasks() || [];
            const activeCompleted = activeTasks.filter(t => t.completed).length;
            const archivedTasks = this.getArchivedTasks() || [];
            const archivedCompleted = archivedTasks.filter(t => t.completed || t.type === 'task').length;
            return activeCompleted + archivedCompleted;
        },

        checkVaultAutoUnlockOnTaskCompleted() {
            // Pool de códigos auto-desbloqueables en orden progresivo
            // EXCLUSIÓN ESTRICTA: 'EDUARDO' y '06062009' NUNCA se auto-desbloquean (requerimiento explícito)
            const AUTO_UNLOCK_POOL = [
                'APOLLO11', 'PINGUINO', 'RETRO80S', 'MATRIX99', 'ZENPEACE',
                'COFFEE42', 'ARCADE90', 'STUDYMAX', 'READABLE',
                'FIRACODE', 'PLAYFAIR', 'HANDNOTE', 'ORBITRON'
            ];

            const count = this.getCompletedTasksCount();
            const unlocksEarned = Math.floor(count / 5);
            if (unlocksEarned <= 0) return null;

            const currentUnlocked = this.getUnlockedCodes();
            const unlockedFromPool = AUTO_UNLOCK_POOL.filter(id => currentUnlocked.includes(id));

            if (unlockedFromPool.length < unlocksEarned && unlockedFromPool.length < AUTO_UNLOCK_POOL.length) {
                const nextCode = AUTO_UNLOCK_POOL.find(id => !currentUnlocked.includes(id));
                if (nextCode) {
                    this.unlockCode(nextCode);
                    return nextCode;
                }
            }
            return null;
        },

        isOnboardingCompleted() {
            return localStorage.getItem('org_escolar_onboarding_v1') === 'true';
        },
        setOnboardingCompleted(completed) {
            localStorage.setItem('org_escolar_onboarding_v1', completed ? 'true' : 'false');
            if (!completed) {
                if (window.OrganizadorApp?.openCycleWelcomeModal) {
                    window.OrganizadorApp.openCycleWelcomeModal();
                } else if (window.app?.openCycleWelcomeModal) {
                    window.app.openCycleWelcomeModal();
                }
            }
        },

        // --- Ciclo Escolar (Fecha Inicio - Fecha Fin) y Verificación de Configuración ---
        isCycleConfigured() {
            const val = localStorage.getItem(KEYS.CYCLE_CONFIGURED);
            return val === 'true';
        },
        setCycleConfigured(configured) {
            localStorage.setItem(KEYS.CYCLE_CONFIGURED, configured ? 'true' : 'false');
        },
        isCycleProvisional() {
            try {
                const data = localStorage.getItem(KEYS.ACADEMIC_CYCLE);
                if (data) {
                    const parsed = JSON.parse(data);
                    return Boolean(parsed.isProvisional);
                }
            } catch (e) {}
            return !this.isCycleConfigured();
        },
        setProvisionalCycle() {
            const today = new Date();
            const y1 = today.getFullYear();
            const m1 = String(today.getMonth() + 1).padStart(2, '0');
            const d1 = String(today.getDate()).padStart(2, '0');
            const startDate = `${y1}-${m1}-${d1}`;

            const future = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
            const y2 = future.getFullYear();
            const m2 = String(future.getMonth() + 1).padStart(2, '0');
            const d2 = String(future.getDate()).padStart(2, '0');
            const endDate = `${y2}-${m2}-${d2}`;

            const cycle = {
                startDate,
                endDate,
                isProvisional: true,
                provisionalReason: 'Dato provisional (60 días adelantados) • Requiere actualizar'
            };
            localStorage.setItem(KEYS.ACADEMIC_CYCLE, JSON.stringify(cycle));
            localStorage.setItem(KEYS.CYCLE_CONFIGURED, 'false');
            return cycle;
        },
        getAcademicCycle() {
            try {
                const data = localStorage.getItem(KEYS.ACADEMIC_CYCLE);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed.startDate && parsed.endDate) {
                        return parsed;
                    }
                }
            } catch (e) {
                console.error('Error al leer ciclo escolar:', e);
            }
            // Si nunca se ha fijado, sugerir provisional
            return this.setProvisionalCycle();
        },
        setAcademicCycle(startDate, endDate) {
            if (startDate && typeof startDate === 'object' && !endDate) {
                endDate = startDate.endDate;
                startDate = startDate.startDate;
            }
            if (!startDate || !endDate) {
                throw new Error('Las fechas de inicio y fin del ciclo escolar son obligatorias.');
            }
            if (startDate > endDate) {
                throw new Error('La fecha de inicio de ciclo no puede ser posterior a la fecha de término.');
            }
            const cycle = { startDate, endDate, isProvisional: false };
            localStorage.setItem(KEYS.ACADEMIC_CYCLE, JSON.stringify(cycle));
            this.setCycleConfigured(true);
            return cycle;
        },

        isDateInAcademicCycle(dateInput) {
            const cycle = this.getAcademicCycle();
            if (!cycle || !cycle.startDate || !cycle.endDate) return true;

            let dateStr = '';
            if (dateInput instanceof Date) {
                const y = dateInput.getFullYear();
                const m = String(dateInput.getMonth() + 1).padStart(2, '0');
                const d = String(dateInput.getDate()).padStart(2, '0');
                dateStr = `${y}-${m}-${d}`;
            } else if (typeof dateInput === 'string') {
                dateStr = dateInput.split('T')[0];
            } else {
                return false;
            }

            return dateStr >= cycle.startDate && dateStr <= cycle.endDate;
        },

        // --- Materias (Límite 1 a 16) ---
        getSubjects() {
            try {
                const data = localStorage.getItem(KEYS.SUBJECTS);
                if (!data) return [];
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch (e) {
                console.error('Error al leer materias:', e);
                return [];
            }
        },
        saveSubjects(subjects) {
            if (!Array.isArray(subjects)) return false;
            if (subjects.length > MAX_SUBJECTS) {
                throw new Error(`No se pueden registrar más de ${MAX_SUBJECTS} materias.`);
            }
            localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
            return true;
        },
        addSubject(subject) {
            const subjects = this.getSubjects();
            if (subjects.length >= MAX_SUBJECTS) {
                throw new Error(`Límite alcanzado: Máximo ${MAX_SUBJECTS} materias permitidas.`);
            }
            const newSubject = {
                id: 'sub_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
                name: subject.name.trim(),
                color: subject.color || '#6366F1',
                days: Array.isArray(subject.days) ? subject.days : [],
                startTime: subject.startTime || '07:00',
                endTime: subject.endTime || '09:00',
                professor: subject.professor ? subject.professor.trim() : '',
                classroom: subject.classroom ? subject.classroom.trim() : '',
                createdAt: Date.now()
            };
            subjects.push(newSubject);
            this.saveSubjects(subjects);
            return newSubject;
        },
        updateSubject(id, updatedFields) {
            const subjects = this.getSubjects();
            const index = subjects.findIndex(s => String(s.id) === String(id));
            if (index === -1) return null;
            subjects[index] = {
                ...subjects[index],
                ...updatedFields,
                id: subjects[index].id
            };
            this.saveSubjects(subjects);
            return subjects[index];
        },
        deleteSubject(id) {
            const subjects = this.getSubjects();
            const filtered = subjects.filter(s => String(s.id) !== String(id));
            this.saveSubjects(filtered);
            const tasks = this.getTasks();
            const updatedTasks = tasks.filter(t => String(t.subjectId) !== String(id));
            this.saveTasks(updatedTasks);
            return true;
        },

        // --- Tareas ---
        getTasks() {
            try {
                const data = localStorage.getItem(KEYS.TASKS);
                if (!data) return [];
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch (e) {
                console.error('Error al leer tareas:', e);
                return [];
            }
        },
        saveTasks(tasks) {
            if (!Array.isArray(tasks)) return false;
            localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
            return true;
        },
        addTask(task) {
            const tasks = this.getTasks();
            const newTask = {
                id: 'tsk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
                subjectId: task.subjectId,
                title: task.title.trim(),
                dueDate: task.dueDate || '',
                completed: Boolean(task.completed),
                priority: task.priority || 'media',
                notes: task.notes ? task.notes.trim() : '',
                createdAt: Date.now()
            };
            tasks.push(newTask);
            this.saveTasks(tasks);
            return newTask;
        },
        updateTask(id, updatedFields) {
            const tasks = this.getTasks();
            const index = tasks.findIndex(t => String(t.id) === String(id));
            if (index === -1) return null;
            tasks[index] = {
                ...tasks[index],
                ...updatedFields,
                id: tasks[index].id
            };
            this.saveTasks(tasks);
            return tasks[index];
        },
        toggleTask(id) {
            const tasks = this.getTasks();
            const task = tasks.find(t => String(t.id) === String(id));
            if (task) {
                task.completed = !task.completed;
                this.saveTasks(tasks);
                return task;
            }
            return null;
        },
        deleteTask(id) {
            const tasks = this.getTasks();
            const filtered = tasks.filter(t => String(t.id) !== String(id));
            this.saveTasks(filtered);
            return true;
        },

        // --- Notas Rápidas (agenda_cch_notes) ---
        getNotes() {
            try {
                const data = localStorage.getItem(KEYS.NOTES);
                if (!data) return [];
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch (e) {
                console.error('Error al leer notas:', e);
                return [];
            }
        },
        saveNotes(notes) {
            if (!Array.isArray(notes)) return false;
            localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
            return true;
        },
        addNote(note) {
            const notes = this.getNotes();
            const newNote = {
                id: 'note_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
                title: (note.title || '').trim(),
                content: (note.content || '').trim(),
                type: note.type || 'apunte', // idea, apunte, pendiente, importante, personal
                hasReminder: Boolean(note.hasReminder),
                reminderDateTime: note.hasReminder ? (note.reminderDateTime || '') : '',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            notes.unshift(newNote); // La más reciente al inicio
            this.saveNotes(notes);
            return newNote;
        },
        updateNote(id, updatedFields) {
            const notes = this.getNotes();
            const index = notes.findIndex(n => String(n.id) === String(id));
            if (index === -1) return null;
            notes[index] = {
                ...notes[index],
                ...updatedFields,
                id: notes[index].id,
                updatedAt: Date.now()
            };
            this.saveNotes(notes);
            return notes[index];
        },
        saveNote(note) {
            if (!note || !note.id) return null;
            const notes = this.getNotes();
            const index = notes.findIndex(n => String(n.id) === String(note.id));
            if (index === -1) notes.unshift(note);
            else notes[index] = { ...notes[index], ...note };
            this.saveNotes(notes);
            return note;
        },

        // --- Pulsación larga (menú dinámico) activable/desactivable ---
        isLongPressEnabled() {
            return localStorage.getItem(KEYS.LONG_PRESS) !== 'false';
        },
        setLongPressEnabled(enabled) {
            const val = enabled === true;
            localStorage.setItem(KEYS.LONG_PRESS, val ? 'true' : 'false');
            return val;
        },

        // --- Galería de fotos (materiales / notas) ---
        getGalleryPhotos() {
            try {
                const parsed = JSON.parse(localStorage.getItem(KEYS.GALLERY_PHOTOS) || '[]');
                return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch (e) {
                return [];
            }
        },
        saveGalleryPhoto(photo) {
            if (!photo || !photo.dataUrl) return false;
            const photos = this.getGalleryPhotos();
            const entry = {
                id: photo.id || 'photo_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
                name: photo.name || 'Foto',
                dataUrl: photo.dataUrl,
                createdAt: photo.createdAt || Date.now()
            };
            photos.unshift(entry);
            try {
                localStorage.setItem(KEYS.GALLERY_PHOTOS, JSON.stringify(photos));
            } catch (e) {
                return false;
            }
            return entry;
        },
        deleteGalleryPhoto(id) {
            const photos = this.getGalleryPhotos().filter(p => String(p.id) !== String(id));
            localStorage.setItem(KEYS.GALLERY_PHOTOS, JSON.stringify(photos));
            return true;
        },

        deleteNote(id) {
            const notes = this.getNotes();
            const filtered = notes.filter(n => String(n.id) !== String(id));
            this.saveNotes(filtered);
            return true;
        },

        // --- Personalización del Botón Inferior Principal ---
        // Valores permitidos: 'add_task' (default), 'notes', 'calendar'
        getBottomAction() {
            return localStorage.getItem(KEYS.BOTTOM_ACTION) || 'add_task';
        },
        setBottomAction(action) {
            const valid = ['add_task', 'notes', 'calendar'];
            const chosen = valid.includes(action) ? action : 'add_task';
            localStorage.setItem(KEYS.BOTTOM_ACTION, chosen);
            return chosen;
        },

        // --- Vibración Háptica ---
        getHapticsEnabled() {
            const val = localStorage.getItem(KEYS.HAPTICS);
            return val === null ? true : val === 'true';
        },
        setHapticsEnabled(enabled) {
            localStorage.setItem(KEYS.HAPTICS, Boolean(enabled) ? 'true' : 'false');
        },

        // --- Tema (Dark / Light) ---
        getTheme() {
            return localStorage.getItem(KEYS.THEME) || null;
        },
        setTheme(theme) {
            if (theme === 'dark' || theme === 'light') {
                localStorage.setItem(KEYS.THEME, theme);
            } else {
                localStorage.removeItem(KEYS.THEME);
            }
        },

        // --- Tipografía ---
        getFontFamily() {
            return localStorage.getItem(KEYS.FONT_FAMILY) || 'calibri';
        },
        setFontFamily(font) {
            const chosen = (font && typeof font === 'string' && font.trim().length > 0) ? font.trim() : 'calibri';
            localStorage.setItem(KEYS.FONT_FAMILY, chosen);
            return chosen;
        },

        // --- Intensidad del Cristal Liquid Glass (suave | normal | intenso) ---
        getDefaultGlassIntensity() {
            try {
                const cores = typeof navigator !== 'undefined' ? Number(navigator.hardwareConcurrency) : 0;
                const mem = typeof navigator !== 'undefined' ? Number(navigator.deviceMemory) : 0;
                if ((cores > 0 && cores <= 4) || (mem > 0 && mem <= 4)) {
                    return 'normal';
                }
            } catch (_) {}
            return 'intenso';
        },
        getGlassIntensity() {
            const val = (localStorage.getItem(KEYS.GLASS_INTENSITY) || '').trim().toLowerCase();
            if (val === 'suave' || val === 'normal' || val === 'intenso') {
                return val;
            }
            return this.getDefaultGlassIntensity();
        },
        setGlassIntensity(level) {
            const normalized = typeof level === 'string' ? level.trim().toLowerCase() : '';
            const chosen = (normalized === 'suave' || normalized === 'normal' || normalized === 'intenso')
                ? normalized
                : this.getDefaultGlassIntensity();
            localStorage.setItem(KEYS.GLASS_INTENSITY, chosen);
            return chosen;
        },

        // --- Elementos Archivados (Baúl de Tareas y Notas) ---
        getArchivedTasks() {
            try {
                const data = localStorage.getItem(KEYS.ARCHIVED_TASKS);
                if (!data) return [];
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch (e) {
                return [];
            }
        },
        saveArchivedTasks(tasks) {
            if (!Array.isArray(tasks)) return false;
            localStorage.setItem(KEYS.ARCHIVED_TASKS, JSON.stringify(tasks));
            return true;
        },
        archiveTask(id) {
            if (!id && id !== 0) return null;
            const tasks = this.getTasks();
            const taskIndex = tasks.findIndex(t => String(t.id) === String(id));
            if (taskIndex === -1) return null;
            const task = tasks.splice(taskIndex, 1)[0];
            this.saveTasks(tasks);

            const archived = this.getArchivedTasks();
            task.archivedAt = Date.now();
            archived.unshift(task);
            this.saveArchivedTasks(archived);
            return task;
        },
        unarchiveTask(id) {
            if (!id && id !== 0) return null;
            const archived = this.getArchivedTasks();
            const index = archived.findIndex(t => String(t.id) === String(id));
            if (index === -1) return null;
            const task = archived.splice(index, 1)[0];
            delete task.archivedAt;
            // Reactivar como pendiente para visualización inmediata en lista de pendientes
            task.completed = false;
            this.saveArchivedTasks(archived);

            const tasks = this.getTasks();
            tasks.unshift(task);
            this.saveTasks(tasks);
            return task;
        },
        deleteArchivedTask(id) {
            if (!id && id !== 0) return false;
            const archived = this.getArchivedTasks();
            const filtered = archived.filter(t => String(t.id) !== String(id));
            this.saveArchivedTasks(filtered);
            return true;
        },

        getArchivedNotes() {
            try {
                const data = localStorage.getItem(KEYS.ARCHIVED_NOTES);
                if (!data) return [];
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch (e) {
                return [];
            }
        },
        saveArchivedNotes(notes) {
            if (!Array.isArray(notes)) return false;
            localStorage.setItem(KEYS.ARCHIVED_NOTES, JSON.stringify(notes));
            return true;
        },
        archiveNote(id) {
            if (!id && id !== 0) return null;
            const notes = this.getNotes();
            const noteIndex = notes.findIndex(n => String(n.id) === String(id));
            if (noteIndex === -1) return null;
            const note = notes.splice(noteIndex, 1)[0];
            this.saveNotes(notes);

            const archived = this.getArchivedNotes();
            note.archivedAt = Date.now();
            archived.unshift(note);
            this.saveArchivedNotes(archived);
            return note;
        },
        unarchiveNote(id) {
            if (!id && id !== 0) return null;
            const archived = this.getArchivedNotes();
            const index = archived.findIndex(n => String(n.id) === String(id));
            if (index === -1) return null;
            const note = archived.splice(index, 1)[0];
            delete note.archivedAt;
            this.saveArchivedNotes(archived);

            const notes = this.getNotes();
            notes.unshift(note);
            this.saveNotes(notes);
            return note;
        },
        deleteArchivedNote(id) {
            if (!id && id !== 0) return false;
            const archived = this.getArchivedNotes();
            const filtered = archived.filter(n => String(n.id) !== String(id));
            this.saveArchivedNotes(filtered);
            return true;
        },

        // --- Purga Automática de Archivados tras 60 días (Activable/Desactivable) ---
        getAutoPurgeArchive() {
            const val = localStorage.getItem(KEYS.AUTO_PURGE_ARCHIVE);
            return val === null ? true : val === 'true';
        },
        setAutoPurgeArchive(enabled) {
            localStorage.setItem(KEYS.AUTO_PURGE_ARCHIVE, enabled ? 'true' : 'false');
        },
        runArchivePurge() {
            if (!this.getAutoPurgeArchive()) return { purgedTasks: 0, purgedNotes: 0 };
            const maxAgeMs = 60 * 24 * 60 * 60 * 1000; // 60 días
            const now = Date.now();

            const archivedTasks = this.getArchivedTasks();
            const validTasks = archivedTasks.filter(t => {
                if (!t) return false;
                const archivedTime = typeof t.archivedAt === 'number'
                    ? t.archivedAt
                    : (t.archivedAt ? new Date(t.archivedAt).getTime() : now);
                const safeTime = isNaN(archivedTime) ? now : archivedTime;
                return (now - safeTime) <= maxAgeMs;
            });
            const purgedTasks = archivedTasks.length - validTasks.length;
            if (purgedTasks > 0) this.saveArchivedTasks(validTasks);

            const archivedNotes = this.getArchivedNotes();
            const validNotes = archivedNotes.filter(n => {
                if (!n) return false;
                const archivedTime = typeof n.archivedAt === 'number'
                    ? n.archivedAt
                    : (n.archivedAt ? new Date(n.archivedAt).getTime() : now);
                const safeTime = isNaN(archivedTime) ? now : archivedTime;
                return (now - safeTime) <= maxAgeMs;
            });
            const purgedNotes = archivedNotes.length - validNotes.length;
            if (purgedNotes > 0) this.saveArchivedNotes(validNotes);

            return { purgedTasks, purgedNotes };
        },

        // --- Archivado de tareas: Las tareas completadas NO se auto-archivan; el usuario decide subirlas manualmente ---
        checkAutoArchiveTasks() {
            // Requerimiento explícito: las actividades ya realizadas no se deben poner automáticamente en los archivados,
            // sino que el dueño las sube manualmente con el botón destacado que se agranda al completarse.
            return 0;
        },

        // --- Preferencia de visibilidad del botón de tema en Header (Ocultable) ---
        getHeaderThemeBtnEnabled() {
            const val = localStorage.getItem(KEYS.HEADER_THEME_BTN);
            return val === null ? true : val === 'true';
        },
        setHeaderThemeBtnEnabled(enabled) {
            localStorage.setItem(KEYS.HEADER_THEME_BTN, enabled ? 'true' : 'false');
        },

        // --- Función Secreta: Desbloqueo y Modo Monocromático ---
        isSecretUnlocked() {
            return localStorage.getItem(KEYS.SECRET_UNLOCKED) === 'true';
        },
        unlockSecret() {
            localStorage.setItem(KEYS.SECRET_UNLOCKED, 'true');
            return true;
        },
        getGrayModeEnabled() {
            return localStorage.getItem(KEYS.GRAY_MODE) === 'true';
        },
        setGrayModeEnabled(enabled) {
            localStorage.setItem(KEYS.GRAY_MODE, enabled ? 'true' : 'false');
        },

        // --- Bóveda de Códigos Secretos v2.0 (Milestone 2) ---
        getUnlockedCodes() {
            try {
                const data = localStorage.getItem(KEYS.VAULT_UNLOCKED);
                if (!data) return [];
                const parsed = JSON.parse(data);
                return Array.isArray(parsed)
                    ? parsed.filter(c => typeof c === 'string' && c.trim() && c.trim().toUpperCase() !== 'GATITOS_')
                    : [];
            } catch (e) {
                return [];
            }
        },

        unlockCode(codeId) {
            if (!codeId || typeof codeId !== 'string') return false;
            const normalized = codeId.trim().toUpperCase();
            if (normalized === 'GATITOS_') return false;
            const codes = this.getUnlockedCodes();
            if (!codes.includes(normalized)) {
                codes.push(normalized);
                localStorage.setItem(KEYS.VAULT_UNLOCKED, JSON.stringify(codes));
            }
            return true;
        },

        isCodeUnlocked(codeId) {
            if (!codeId || typeof codeId !== 'string') return false;
            return this.getUnlockedCodes().includes(codeId.trim().toUpperCase());
        },

        unlockVaultCode(codeId) {
            return this.unlockCode(codeId);
        },

        isVaultCodeUnlocked(codeId) {
            return this.isCodeUnlocked(codeId);
        },

        getVaultUnlockedCodes() {
            return this.getUnlockedCodes();
        },

        getActiveSpecialTheme() {
            const val = localStorage.getItem(KEYS.ACTIVE_SPECIAL_THEME) || 'default';
            return (val === 'theme_cats' || val === 'cats') ? 'default' : val;
        },

        setActiveSpecialTheme(themeId) {
            let val = (themeId && typeof themeId === 'string') ? themeId : 'default';
            if (val === 'theme_cats' || val === 'cats') val = 'default';
            localStorage.setItem(KEYS.ACTIVE_SPECIAL_THEME, val);
        },

        getApolloRocketsEnabled() {
            let val = localStorage.getItem(KEYS.APOLLO_ROCKETS_ENABLED);
            if (val === null) {
                val = localStorage.getItem('org_escolar_apollo_rockets');
            }
            return val === null ? true : val === 'true';
        },

        setApolloRocketsEnabled(enabled) {
            const val = enabled ? 'true' : 'false';
            localStorage.setItem(KEYS.APOLLO_ROCKETS_ENABLED, val);
            localStorage.setItem('org_escolar_apollo_rockets', val);
        },

        // --- Métricas de Almacenamiento Local ---
        getStorageMetrics() {
            let totalBytes = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const val = localStorage.getItem(key) || '';
                totalBytes += (key.length + val.length) * 2; // UTF-16 approximate
            }

            const subjects = this.getSubjects();
            const tasks = this.getTasks();
            const notes = this.getNotes();

            // Límite habitual de LocalStorage en navegadores: ~5 MB (5 * 1024 * 1024 bytes)
            const quotaBytes = 5 * 1024 * 1024;
            const percentage = Math.min(100, Math.max(1, ((totalBytes / quotaBytes) * 100).toFixed(2)));
            const usedFormatted = (totalBytes / 1024).toFixed(1) + ' KB';

            return {
                totalBytes,
                usedFormatted,
                percentage,
                subjectsCount: subjects.length,
                tasksCount: tasks.length,
                notesCount: notes.length
            };
        },

        /**
         * Inicialización limpia: subjects: [], tasks: [], notes: []
         */
        initIfFirstTime() {
            this.cleanupLegacyKeys();
            const isInitialized = localStorage.getItem(KEYS.INITIALIZED);
            if (!isInitialized) {
                this.setAcademicPeriod('');
                this.getAcademicCycle();
                this.saveSubjects([]);
                this.saveTasks([]);
                this.saveNotes([]);
                this.setBottomAction('add_task');
                this.setHapticsEnabled(true);
                this.setFontFamily('calibri');
                localStorage.setItem(KEYS.INITIALIZED, 'true');
                return true;
            }
            return false;
        },

        loadDemo() {
            this.setAcademicPeriod(DEMO_DATA.period);
            const cycle = this.getAcademicCycle();

            const taskDemo = [...DEMO_DATA.tasks];
            if (cycle && cycle.startDate && cycle.endDate) {
                taskDemo[0].dueDate = `${cycle.startDate}T18:00`;
                taskDemo[1].dueDate = `${cycle.startDate}T20:00`;
            }

            const notesDemo = [...DEMO_DATA.notes];
            if (cycle && cycle.startDate) {
                notesDemo[1].reminderDateTime = `${cycle.startDate}T14:30`;
            }

            this.saveSubjects(DEMO_DATA.subjects);
            this.saveTasks(taskDemo);
            this.saveNotes(notesDemo);
        },

        clearAll() {
            this.saveSubjects([]);
            this.saveTasks([]);
            this.saveNotes([]);
            this.saveArchivedTasks([]);
            this.saveArchivedNotes([]);
        },

        exportJson() {
            const data = {
                version: '1.5.0',
                exportedAt: new Date().toISOString(),
                theme: this.getTheme(),
                fontFamily: this.getFontFamily(),
                glassIntensity: this.getGlassIntensity(),
                academicPeriod: this.getAcademicPeriod(),
                academicCycle: this.getAcademicCycle(),
                isCycleConfigured: this.isCycleConfigured(),
                bottomAction: this.getBottomAction(),
                hapticsEnabled: this.getHapticsEnabled(),
                autoPurgeArchive: this.getAutoPurgeArchive(),
                headerThemeBtnEnabled: this.getHeaderThemeBtnEnabled(),
                secretUnlocked: this.isSecretUnlocked(),
                grayMode: this.getGrayModeEnabled(),
                unlockedCodes: this.getUnlockedCodes(),
                activeSpecialTheme: this.getActiveSpecialTheme(),
                apolloRocketsEnabled: this.getApolloRocketsEnabled(),
                userName: this.getUserName(),
                accountType: this.getAccountType(),
                userPhoto: this.getUserPhoto(),
                longPressEnabled: this.isLongPressEnabled(),
                galleryPhotos: this.getGalleryPhotos(),
                subjects: this.getSubjects(),
                tasks: this.getTasks(),
                notes: this.getNotes(),
                archivedTasks: this.getArchivedTasks(),
                archivedNotes: this.getArchivedNotes()
            };
            return JSON.stringify(data, null, 2);
        },

        importJson(jsonString) {
            try {
                const data = JSON.parse(jsonString);
                if (!Array.isArray(data.subjects) || !Array.isArray(data.tasks)) {
                    throw new Error('Formato de archivo inválido: no contiene materias o tareas.');
                }
                if (data.subjects.length > MAX_SUBJECTS) {
                    throw new Error(`El archivo contiene más de ${MAX_SUBJECTS} materias.`);
                }
                if (data.theme) this.setTheme(data.theme);
                if (data.fontFamily) this.setFontFamily(data.fontFamily);
                if (typeof data.glassIntensity === 'string') this.setGlassIntensity(data.glassIntensity);
                if (typeof data.academicPeriod === 'string') this.setAcademicPeriod(data.academicPeriod);
                if (data.academicCycle && data.academicCycle.startDate && data.academicCycle.endDate) {
                    this.setAcademicCycle(data.academicCycle.startDate, data.academicCycle.endDate);
                }
                if (typeof data.isCycleConfigured === 'boolean') {
                    this.setCycleConfigured(data.isCycleConfigured);
                }
                if (data.bottomAction) this.setBottomAction(data.bottomAction);
                if (typeof data.hapticsEnabled === 'boolean') this.setHapticsEnabled(data.hapticsEnabled);
                if (typeof data.autoPurgeArchive === 'boolean') this.setAutoPurgeArchive(data.autoPurgeArchive);
                if (typeof data.headerThemeBtnEnabled === 'boolean') this.setHeaderThemeBtnEnabled(data.headerThemeBtnEnabled);
                if (typeof data.secretUnlocked === 'boolean' && data.secretUnlocked) this.unlockSecret();
                if (typeof data.grayMode === 'boolean') this.setGrayModeEnabled(data.grayMode);
                if (Array.isArray(data.unlockedCodes)) {
                    const validCodes = data.unlockedCodes
                        .filter(c => typeof c === 'string' && c.trim() && c.trim().toUpperCase() !== 'GATITOS_');
                    localStorage.setItem(KEYS.VAULT_UNLOCKED, JSON.stringify(validCodes));
                }
                if (typeof data.activeSpecialTheme === 'string') {
                    this.setActiveSpecialTheme(data.activeSpecialTheme);
                }
                if (typeof data.apolloRocketsEnabled === 'boolean') {
                    this.setApolloRocketsEnabled(data.apolloRocketsEnabled);
                }
                if (typeof data.longPressEnabled === 'boolean') this.setLongPressEnabled(data.longPressEnabled);
                if (Array.isArray(data.galleryPhotos)) {
                    try { localStorage.setItem(KEYS.GALLERY_PHOTOS, JSON.stringify(data.galleryPhotos.filter(p => p && p.dataUrl))); } catch (e) {}
                }
                if (typeof data.userName === 'string') {
                    this.setUserName(data.userName);
                }
                if (typeof data.accountType === 'string') {
                    this.setAccountType(data.accountType);
                }
                if (typeof data.userPhoto === 'string') {
                    this.setUserPhoto(data.userPhoto);
                }

                this.saveSubjects(data.subjects);
                this.saveTasks(data.tasks);
                if (Array.isArray(data.notes)) {
                    this.saveNotes(data.notes);
                }
                if (Array.isArray(data.archivedTasks)) {
                    this.saveArchivedTasks(data.archivedTasks);
                }
                if (Array.isArray(data.archivedNotes)) {
                    this.saveArchivedNotes(data.archivedNotes);
                }
                this.cleanupLegacyKeys();
                return true;
            } catch (e) {
                throw new Error('Error al importar archivo: ' + e.message);
            }
        }
    };

    return Storage;
})();
