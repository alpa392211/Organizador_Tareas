/**
 * Puente de Sincronización Web-Android para Widgets Nativos (v1.5.8)
 * Serializa y expone el estado de materias, tareas, notas y calendario
 * para alimentar los 3 widgets de Android (QuickTaskWidget, WeekCalendarWidget, TaskDeadlinesWidget).
 * Detecta intenciones de apertura rápida (Deep Links: ?action=new_task, etc.)
 */

window.WidgetSyncModule = (() => {
    const WIDGET_DATA_KEY = 'org_escolar_widget_payload';
    const MONTHS_ES = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    function isCapacitorAvailable() {
        return Boolean(
            typeof window !== 'undefined' &&
            window.Capacitor &&
            window.Capacitor.Plugins
        );
    }

    function formatLocalDateISO(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getUrgencyMeta(priority) {
        const p = String(priority || 'media').toLowerCase();
        if (p === 'alta' || p === 'high') {
            return { urgency: 'high', urgencyLabel: 'Alta 🔴' };
        }
        if (p === 'baja' || p === 'low') {
            return { urgency: 'low', urgencyLabel: 'Baja 🟢' };
        }
        return { urgency: 'medium', urgencyLabel: 'Media 🟡' };
    }

    function abbreviateSubjectName(name) {
        const clean = String(name || '').trim();
        if (!clean) return 'Mat';
        if (clean.length <= 5) return clean;
        const words = clean.split(/\s+/).filter(Boolean);
        if (words.length >= 2 && words[0].length <= 3) {
            return (words[0].slice(0, 2) + words[1].slice(0, 3)).slice(0, 5);
        }
        return clean.slice(0, 4) + '.';
    }

    function normalizeDayId(d) {
        const s = String(d || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (s.startsWith('lun')) return 'lun';
        if (s.startsWith('mar')) return 'mar';
        if (s.startsWith('mie')) return 'mie';
        if (s.startsWith('jue')) return 'jue';
        if (s.startsWith('vie')) return 'vie';
        if (s.startsWith('sab')) return 'sab';
        if (s.startsWith('dom')) return 'dom';
        return s.slice(0, 3);
    }

    const WidgetSync = {
        /**
         * Inicializa la escucha de intents y sincroniza los datos
         */
        init() {
            this.sync();
            this.checkLaunchIntent();

            // Escuchar eventos de apertura en Capacitor si está disponible
            if (isCapacitorAvailable() && window.Capacitor.Plugins.App) {
                window.Capacitor.Plugins.App.addListener('appUrlOpen', (data) => {
                    if (data && data.url) {
                        this.handleDeepLink(data.url);
                    }
                });
            }
        },

        /**
         * Compatibilidad con llamada app.init -> handleIntent
         */
        handleIntent() {
            this.checkLaunchIntent();
        },

        /**
         * Sincroniza el estado actual con el almacenamiento compartido de widgets
         */
        sync() {
            const Storage = window.StorageModule;
            if (!Storage) return;

            const subjects = Storage.getSubjects ? Storage.getSubjects() : [];
            const tasks = Storage.getTasks ? Storage.getTasks() : [];
            const notes = Storage.getNotes ? Storage.getNotes() : [];
            const cycle = Storage.getAcademicCycle ? Storage.getAcademicCycle() : null;
            const instLabel = (Storage.getUserName?.() || '').trim() || 'Organizador';

            const subjectMap = new Map(subjects.map(s => [String(s.id), s]));

            // 1. Datos para Widget 1: QuickTaskWidget (Contador de pendientes del día y acción rápida)
            const now = new Date();
            const todayStr = formatLocalDateISO(now);
            const pendingTasks = tasks.filter(t => !t.completed);
            const todayTasks = pendingTasks.filter(t => t.dueDate && String(t.dueDate).startsWith(todayStr));
            const sortedPending = pendingTasks.slice().sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return String(a.dueDate).localeCompare(String(b.dueDate));
            });
            const leadTask = sortedPending[0] || null;
            const leadSubject = leadTask ? (subjectMap.get(String(leadTask.subjectId))?.name || 'General') : '';

            const quickTaskData = {
                pendingTotal: pendingTasks.length,
                pendingToday: todayTasks.length,
                pendingTodayCount: todayTasks.length > 0 ? todayTasks.length : pendingTasks.length,
                nextTaskTitle: leadTask ? leadTask.title : '',
                nextTaskSubject: leadSubject,
                nextTask: leadTask ? {
                    title: leadTask.title,
                    subjectName: leadSubject,
                    dueDate: leadTask.dueDate
                } : null
            };

            // 2. Datos para Widget 2: WeekCalendarWidget (Horario semanal con materias por día)
            const activityDaysMap = {};
            const subjectsByDayId = { lun: [], mar: [], mie: [], jue: [], vie: [], sab: [], dom: [] };
            subjects.forEach(s => {
                if (Array.isArray(s.days)) {
                    s.days.forEach(d => {
                        const key = normalizeDayId(d);
                        if (subjectsByDayId[key]) {
                            subjectsByDayId[key].push({
                                name: s.name || 'Materia',
                                shortName: abbreviateSubjectName(s.name),
                                color: s.color || '#4F46E5',
                                startTime: s.startTime || '00:00'
                            });
                        }
                    });
                }
            });
            Object.keys(subjectsByDayId).forEach(k => {
                subjectsByDayId[k].sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
            });

            tasks.forEach(t => {
                if (!t.completed && t.dueDate) {
                    const datePart = String(t.dueDate).split('T')[0];
                    if (!activityDaysMap[datePart]) activityDaysMap[datePart] = { classes: 0, tasks: 0, notes: 0 };
                    activityDaysMap[datePart].tasks++;
                }
            });
            notes.forEach(n => {
                if (n.hasReminder && n.reminderDateTime) {
                    const datePart = String(n.reminderDateTime).split('T')[0];
                    if (!activityDaysMap[datePart]) activityDaysMap[datePart] = { classes: 0, tasks: 0, notes: 0 };
                    activityDaysMap[datePart].notes++;
                }
            });

            // Calcular los 14 días a partir del lunes de la semana actual (con materias reales por día)
            const dayIdsByJsDow = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
            const dow = now.getDay();
            const mondayOffset = dow === 0 ? -6 : 1 - dow;
            const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
            const weekDays = [];
            let todaySubjectsSummary = '';
            for (let i = 0; i < 14; i++) {
                const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
                const iso = formatLocalDateISO(d);
                const act = activityDaysMap[iso] || { classes: 0, tasks: 0, notes: 0 };
                const dayKey = dayIdsByJsDow[d.getDay()];
                const daySubjects = subjectsByDayId[dayKey] || [];
                const isToday = iso === todayStr;
                if (isToday && daySubjects.length > 0) {
                    todaySubjectsSummary = 'Hoy: ' + daySubjects.slice(0, 4).map(s => s.name).join(' · ')
                        + (daySubjects.length > 4 ? ` (+${daySubjects.length - 4})` : '');
                }
                weekDays.push({
                    date: iso,
                    dayName: DAY_LETTERS[d.getDay()] || 'D',
                    dayNumber: d.getDate(),
                    isToday,
                    hasClasses: daySubjects.length > 0 || act.classes > 0,
                    hasTasks: act.tasks > 0,
                    hasReminders: act.notes > 0,
                    subjects: daySubjects
                });
            }

            // 3. Datos para Widget 3: TaskDeadlinesWidget (Agenda de próximas entregas)
            const upcomingDeadlines = pendingTasks
                .filter(t => Boolean(t.dueDate))
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .slice(0, 15)
                .map(t => {
                    const sub = subjectMap.get(String(t.subjectId));
                    const dateStr = String(t.dueDate).split('T')[0];
                    const timePart = String(t.dueDate).includes('T')
                        ? String(t.dueDate).split('T')[1].slice(0, 5)
                        : '';
                    const urg = getUrgencyMeta(t.priority);
                    return {
                        id: t.id,
                        title: t.title,
                        dueDate: dateStr,
                        dueTime: timePart,
                        priority: t.priority || 'media',
                        urgency: urg.urgency,
                        urgencyLabel: urg.urgencyLabel,
                        isOverdue: dateStr < todayStr,
                        subjectName: sub ? sub.name : 'Materia general',
                        subjectColor: sub ? sub.color : '#4F46E5'
                    };
                });

            const widgetPayload = {
                lastUpdated: Date.now(),
                institution: { name: instLabel },
                quickTask: quickTaskData,
                weekCalendar: {
                    monthTitle: `${MONTHS_ES[now.getMonth()]} ${now.getFullYear()}`,
                    todaySubjectsSummary,
                    weekDays
                },
                activityDays: activityDaysMap,
                deadlines: upcomingDeadlines,
                cycle: cycle
            };

            const payloadJson = JSON.stringify(widgetPayload);

            // Guardar en LocalStorage para acceso web/webview
            try {
                localStorage.setItem(WIDGET_DATA_KEY, payloadJson);
            } catch (e) {
                console.warn('Error guardando widget payload:', e);
            }

            // Puente directo JavaScriptInterface en APK nativo Android
            if (typeof window !== 'undefined' && window.AndroidWidgetBridge && typeof window.AndroidWidgetBridge.updateWidgets === 'function') {
                try {
                    window.AndroidWidgetBridge.updateWidgets(payloadJson);
                } catch (_) {}
            }

            // Fallback Capacitor si existe plugin WidgetBridge
            if (isCapacitorAvailable() && window.Capacitor.Plugins.WidgetBridge) {
                try {
                    window.Capacitor.Plugins.WidgetBridge.updateWidgets({
                        json: payloadJson,
                        payloadJson: payloadJson
                    }).catch(() => {});
                } catch {
                    // Fallback
                }
            }
        },

        /**
         * Detecta si la aplicación fue abierta desde un widget con parámetros de acción
         */
        checkLaunchIntent() {
            const urlParams = new URLSearchParams(window.location.search);
            const action = urlParams.get('action') || (window.location.hash ? window.location.hash.replace('#', '') : '');

            if (action) {
                setTimeout(() => {
                    this.executeAction(action);
                }, 350);
            }
        },

        handleDeepLink(urlStr) {
            try {
                const url = new URL(urlStr);
                const action = url.searchParams.get('action');
                if (action) {
                    this.executeAction(action);
                    return;
                }
            } catch {
                // Fallback de parseo manual
            }
            if (String(urlStr).includes('action=new_task')) {
                this.executeAction('new_task');
            } else if (String(urlStr).includes('action=new_note')) {
                this.executeAction('new_note');
            } else if (String(urlStr).includes('action=open_calendar')) {
                this.executeAction('open_calendar');
            } else if (String(urlStr).includes('action=tasks')) {
                this.executeAction('tasks');
            } else if (String(urlStr).includes('action=notes')) {
                this.executeAction('notes');
            } else if (String(urlStr).includes('action=subjects')) {
                this.executeAction('subjects');
            }
        },

        executeAction(action) {
            if (action === 'new_task') {
                window.OrganizadorApp?.switchView?.('tasks');
                window.TasksModule?.openAddModal?.();
                window.showNotification?.('Acceso rápido desde Widget: Nueva Tarea', 'info');
            } else if (action === 'tasks') {
                window.OrganizadorApp?.switchView?.('tasks');
            } else if (action === 'subjects') {
                window.OrganizadorApp?.switchView?.('subjects');
            } else if (action === 'notes') {
                window.OrganizadorApp?.switchView?.('notes');
            } else if (action === 'new_note') {
                window.OrganizadorApp?.switchView?.('notes');
                window.NotesModule?.openAddModal?.();
                window.showNotification?.('Acceso rápido desde Widget: Nueva Nota', 'info');
            } else if (action === 'open_calendar') {
                window.CalendarModule?.openModal?.();
            }
        }
    };

    return WidgetSync;
})();
