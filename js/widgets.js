/**
 * Puente de Sincronización Web-Android para Widgets Nativos
 * Serializa y expone el estado de tareas, notas y calendario
 * para alimentar los 3 widgets de Android (QuickTaskWidget, WeekCalendarWidget, TaskDeadlinesWidget).
 * Detecta intenciones de apertura rápida (Deep Links: ?action=new_task, etc.)
 */

window.WidgetSyncModule = (() => {
    const WIDGET_DATA_KEY = 'org_escolar_widget_payload';

    function isCapacitorAvailable() {
        return Boolean(
            typeof window !== 'undefined' &&
            window.Capacitor &&
            window.Capacitor.Plugins
        );
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
         * Sincroniza el estado actual con el almacenamiento compartido de widgets
         */
        sync() {
            const Storage = window.StorageModule;
            if (!Storage) return;

            const subjects = Storage.getSubjects ? Storage.getSubjects() : [];
            const tasks = Storage.getTasks ? Storage.getTasks() : [];
            const notes = Storage.getNotes ? Storage.getNotes() : [];
            const cycle = Storage.getAcademicCycle ? Storage.getAcademicCycle() : null;

            const subjectMap = new Map(subjects.map(s => [s.id, s]));

            // 1. Datos para Widget 1: QuickTaskWidget (Contador de pendientes del día y acción rápida)
            const todayStr = new Date().toISOString().split('T')[0];
            const pendingTasks = tasks.filter(t => !t.completed);
            const todayTasks = pendingTasks.filter(t => t.dueDate && t.dueDate.startsWith(todayStr));

            const quickTaskData = {
                pendingTotal: pendingTasks.length,
                pendingToday: todayTasks.length,
                nextTask: pendingTasks[0] ? {
                    title: pendingTasks[0].title,
                    subjectName: subjectMap.get(pendingTasks[0].subjectId)?.name || 'General',
                    dueDate: pendingTasks[0].dueDate
                } : null
            };

            // 2. Datos para Widget 2: WeekCalendarWidget (Cuadrícula de 1 y 2 semanas)
            // Marcar días con clases, tareas con entrega o notas con recordatorio
            const activityDaysMap = {};
            tasks.forEach(t => {
                if (t.dueDate) {
                    const datePart = t.dueDate.split('T')[0];
                    if (!activityDaysMap[datePart]) activityDaysMap[datePart] = { classes: 0, tasks: 0, notes: 0 };
                    activityDaysMap[datePart].tasks++;
                }
            });
            notes.forEach(n => {
                if (n.hasReminder && n.reminderDateTime) {
                    const datePart = n.reminderDateTime.split('T')[0];
                    if (!activityDaysMap[datePart]) activityDaysMap[datePart] = { classes: 0, tasks: 0, notes: 0 };
                    activityDaysMap[datePart].notes++;
                }
            });

            // 3. Datos para Widget 3: TaskDeadlinesWidget (Agenda de próximas entregas)
            const upcomingDeadlines = pendingTasks
                .filter(t => Boolean(t.dueDate))
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .slice(0, 15)
                .map(t => {
                    const sub = subjectMap.get(t.subjectId);
                    return {
                        id: t.id,
                        title: t.title,
                        dueDate: t.dueDate,
                        priority: t.priority || 'media',
                        subjectName: sub ? sub.name : 'Materia general',
                        subjectColor: sub ? sub.color : '#6366F1'
                    };
                });

            const widgetPayload = {
                lastUpdated: Date.now(),
                quickTask: quickTaskData,
                activityDays: activityDaysMap,
                deadlines: upcomingDeadlines,
                cycle: cycle
            };

            // Guardar en LocalStorage para acceso web/webview
            try {
                localStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetPayload));
            } catch (e) {
                console.warn('Error guardando widget payload:', e);
            }

            // Sincronizar con SharedPreferences nativas si existe plugin Capacitor
            if (isCapacitorAvailable() && window.Capacitor.Plugins.WidgetBridge) {
                try {
                    window.Capacitor.Plugins.WidgetBridge.updateWidgets({
                        payloadJson: JSON.stringify(widgetPayload)
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
                // Pequeña espera para que los módulos terminen su inicialización
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
                }
            } catch {
                // Fallback de parseo manual
                if (urlStr.includes('action=new_task')) {
                    this.executeAction('new_task');
                } else if (urlStr.includes('action=new_note')) {
                    this.executeAction('new_note');
                } else if (urlStr.includes('action=open_calendar')) {
                    this.executeAction('open_calendar');
                }
            }
        },

        executeAction(action) {
            if (action === 'new_task') {
                window.TasksModule?.openAddModal?.();
                window.showNotification?.('Acceso rápido desde Widget: Nueva Tarea', 'info');
            } else if (action === 'new_note') {
                window.NotesModule?.openAddModal?.();
                window.showNotification?.('Acceso rápido desde Widget: Nueva Nota', 'info');
            } else if (action === 'open_calendar') {
                window.CalendarModule?.openModal?.();
            }
        }
    };

    return WidgetSync;
})();
