/**
 * Módulo de Almacenamiento Local (LocalStorage)
 * Gestiona la persistencia de materias, tareas, ciclo escolar, grado/periodo e institución.
 * Inicia de forma completamente limpia (sin datos precargados).
 */

window.StorageModule = (() => {
    const KEYS = {
        INSTITUTION: 'org_escolar_institution',
        ACADEMIC_PERIOD: 'org_escolar_period',
        ACADEMIC_CYCLE: 'org_escolar_cycle',
        SUBJECTS: 'org_escolar_subjects',
        TASKS: 'org_escolar_tasks',
        THEME: 'org_escolar_theme',
        INITIALIZED: 'org_escolar_initialized_v2'
    };

    const MAX_SUBJECTS = 16;

    /**
     * Calcula fechas por defecto sugeridas para el ciclo escolar actual
     * Ejemplo: Agosto a Diciembre o Febrero a Julio según el mes en curso
     */
    function getDefaultCycleDates() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-11

        let start, end;
        if (month >= 6) {
            // Ciclo otoño-invierno (ej. Agosto a Diciembre)
            start = `${year}-08-10`;
            end = `${year}-12-18`;
        } else {
            // Ciclo primavera-verano (ej. Febrero a Julio)
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
                notes: 'Resolver los problemas en hojas blancas numeradas.'
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

        /**
         * Comprueba si una fecha (YYYY-MM-DD o Date) está dentro del ciclo escolar
         */
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

        // --- Materias (Completamente Vacías al Inicio, Máximo 16) ---
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

        // --- Tareas (Completamente Vacías al Inicio) ---
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

        /**
         * Gestión del Tema (Dark Mode / Light Mode)
         */
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

        /**
         * Inicialización limpia: subjects: [] y tasks: []
         * NO precarga datos de demostración de manera automática.
         */
        initIfFirstTime() {
            const isInitialized = localStorage.getItem(KEYS.INITIALIZED);
            if (!isInitialized) {
                // Estado inicial limpio
                this.setInstitution('unam');
                this.setAcademicPeriod('1.º Semestre');
                this.getAcademicCycle(); // inicializa fechas por defecto
                this.saveSubjects([]); // Lista de materias vacía
                this.saveTasks([]); // Lista de tareas vacía
                localStorage.setItem(KEYS.INITIALIZED, 'true');
                return true;
            }
            return false;
        },

        // Carga opcional de demo solo si el usuario pulsa el botón en Configuración
        loadDemo() {
            this.setInstitution(DEMO_DATA.institution);
            this.setAcademicPeriod(DEMO_DATA.period);
            const cycle = this.getAcademicCycle();
            // Asignar una fecha de entrega dentro del ciclo para la tarea de demo
            const taskDemo = [...DEMO_DATA.tasks];
            if (cycle && cycle.startDate && cycle.endDate) {
                taskDemo[0].dueDate = `${cycle.startDate}T18:00`;
            }
            this.saveSubjects(DEMO_DATA.subjects);
            this.saveTasks(taskDemo);
        },

        clearAll() {
            localStorage.removeItem(KEYS.SUBJECTS);
            localStorage.removeItem(KEYS.TASKS);
            this.saveSubjects([]);
            this.saveTasks([]);
            localStorage.setItem(KEYS.INITIALIZED, 'true');
        },

        exportJson() {
            const data = {
                version: '2.0.0',
                exportedAt: new Date().toISOString(),
                theme: this.getTheme(),
                institution: this.getInstitution(),
                academicPeriod: this.getAcademicPeriod(),
                academicCycle: this.getAcademicCycle(),
                subjects: this.getSubjects(),
                tasks: this.getTasks()
            };
            return JSON.stringify(data, null, 2);
        },
        importJson(jsonString) {
            try {
                const data = JSON.parse(jsonString);
                if (!Array.isArray(data.subjects) || !Array.isArray(data.tasks)) {
                    throw new Error('Formato de archivo inválido.');
                }
                if (data.subjects.length > MAX_SUBJECTS) {
                    throw new Error(`El archivo contiene más de ${MAX_SUBJECTS} materias.`);
                }
                if (data.theme) this.setTheme(data.theme);
                if (data.institution) this.setInstitution(data.institution);
                if (data.academicPeriod) this.setAcademicPeriod(data.academicPeriod);
                if (data.academicCycle && data.academicCycle.startDate && data.academicCycle.endDate) {
                    this.setAcademicCycle(data.academicCycle.startDate, data.academicCycle.endDate);
                }
                this.saveSubjects(data.subjects);
                this.saveTasks(data.tasks);
                return true;
            } catch (e) {
                throw new Error('Error al importar archivo: ' + e.message);
            }
        }
    };

    return Storage;
})();
