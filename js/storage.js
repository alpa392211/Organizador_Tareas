/**
 * Módulo de Almacenamiento Local (LocalStorage)
 * Gestiona la persistencia de materias, tareas, notas rápidas, ciclo escolar,
 * preferencias de botón principal inferior, respuesta háptica e institución.
 * Inicia de forma completamente limpia (sin datos precargados).
 */

window.StorageModule = (() => {
    const KEYS = {
        INSTITUTION: 'org_escolar_institution',
        ACADEMIC_PERIOD: 'org_escolar_period',
        ACADEMIC_CYCLE: 'org_escolar_cycle',
        SUBJECTS: 'org_escolar_subjects',
        TASKS: 'org_escolar_tasks',
        NOTES: 'agenda_cch_notes', // Clave oficial requerida para notas
        THEME: 'org_escolar_theme',
        BOTTOM_ACTION: 'org_escolar_bottom_action',
        HAPTICS: 'org_escolar_haptics',
        FONT_FAMILY: 'org_escolar_font',
        INITIALIZED: 'org_escolar_initialized_v3'
    };

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
        institution: 'unam',
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

        // --- Institución y Grado/Periodo ---
        getInstitution() {
            return localStorage.getItem(KEYS.INSTITUTION) || 'unam';
        },
        setInstitution(id) {
            localStorage.setItem(KEYS.INSTITUTION, id);
        },

        getAcademicPeriod() {
            const instId = this.getInstitution();
            const inst = window.InstitutionsModule?.getInstitution(instId);
            const savedPeriod = localStorage.getItem(KEYS.ACADEMIC_PERIOD);
            if (savedPeriod && inst && inst.periods.includes(savedPeriod)) {
                return savedPeriod;
            }
            return inst?.defaultPeriod || '1.º Semestre';
        },
        setAcademicPeriod(period) {
            localStorage.setItem(KEYS.ACADEMIC_PERIOD, period);
        },

        // --- Ciclo Escolar (Fecha Inicio - Fecha Fin) ---
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
            const defaults = getDefaultCycleDates();
            this.setAcademicCycle(defaults.startDate, defaults.endDate);
            return defaults;
        },
        setAcademicCycle(startDate, endDate) {
            if (!startDate || !endDate) {
                throw new Error('Las fechas de inicio y fin del ciclo escolar son obligatorias.');
            }
            if (startDate > endDate) {
                throw new Error('La fecha de inicio de ciclo no puede ser posterior a la fecha de término.');
            }
            const cycle = { startDate, endDate };
            localStorage.setItem(KEYS.ACADEMIC_CYCLE, JSON.stringify(cycle));
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
                return data ? JSON.parse(data) : [];
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
            const index = subjects.findIndex(s => s.id === id);
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
            const filtered = subjects.filter(s => s.id !== id);
            this.saveSubjects(filtered);
            const tasks = this.getTasks();
            const updatedTasks = tasks.filter(t => t.subjectId !== id);
            this.saveTasks(updatedTasks);
            return true;
        },

        // --- Tareas ---
        getTasks() {
            try {
                const data = localStorage.getItem(KEYS.TASKS);
                return data ? JSON.parse(data) : [];
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
            const index = tasks.findIndex(t => t.id === id);
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
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                this.saveTasks(tasks);
                return task;
            }
            return null;
        },
        deleteTask(id) {
            const tasks = this.getTasks();
            const filtered = tasks.filter(t => t.id !== id);
            this.saveTasks(filtered);
            return true;
        },

        // --- Notas Rápidas (agenda_cch_notes) ---
        getNotes() {
            try {
                const data = localStorage.getItem(KEYS.NOTES);
                return data ? JSON.parse(data) : [];
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
            const index = notes.findIndex(n => n.id === id);
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
        deleteNote(id) {
            const notes = this.getNotes();
            const filtered = notes.filter(n => n.id !== id);
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
            const valid = ['calibri', 'times', 'montserrat', 'lora', 'poppins'];
            const chosen = valid.includes(font) ? font : 'calibri';
            localStorage.setItem(KEYS.FONT_FAMILY, chosen);
            return chosen;
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
            const isInitialized = localStorage.getItem(KEYS.INITIALIZED);
            if (!isInitialized) {
                this.setInstitution('unam');
                this.setAcademicPeriod('1.º Semestre');
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
            this.setInstitution(DEMO_DATA.institution);
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
        },

        exportJson() {
            const data = {
                version: '3.0.0',
                exportedAt: new Date().toISOString(),
                theme: this.getTheme(),
                fontFamily: this.getFontFamily(),
                institution: this.getInstitution(),
                academicPeriod: this.getAcademicPeriod(),
                academicCycle: this.getAcademicCycle(),
                bottomAction: this.getBottomAction(),
                hapticsEnabled: this.getHapticsEnabled(),
                subjects: this.getSubjects(),
                tasks: this.getTasks(),
                notes: this.getNotes()
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
                if (data.institution) this.setInstitution(data.institution);
                if (data.academicPeriod) this.setAcademicPeriod(data.academicPeriod);
                if (data.academicCycle && data.academicCycle.startDate && data.academicCycle.endDate) {
                    this.setAcademicCycle(data.academicCycle.startDate, data.academicCycle.endDate);
                }
                if (data.bottomAction) this.setBottomAction(data.bottomAction);
                if (typeof data.hapticsEnabled === 'boolean') this.setHapticsEnabled(data.hapticsEnabled);

                this.saveSubjects(data.subjects);
                this.saveTasks(data.tasks);
                if (Array.isArray(data.notes)) {
                    this.saveNotes(data.notes);
                }
                return true;
            } catch (e) {
                throw new Error('Error al importar archivo: ' + e.message);
            }
        }
    };

    return Storage;
})();
