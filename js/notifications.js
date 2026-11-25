/**
 * Módulo de Notificaciones Enriquecidas (v1.5.8)
 * Soporte completo: Puente nativo Android (AlarmManager + NotificationManager),
 * LocalNotifications de Capacitor y Web Notifications API.
 * Formato condicional para Tareas y Notas Rápidas.
 */

window.NotificationsModule = (() => {
    const NOTIFIED_CACHE_KEY = 'org_escolar_notified_cache';
    const subjectTimers = new Map();
    let checkIntervalId = null;
    let visibilityListenerBound = false;

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

    function isAndroidNativeAvailable() {
        try {
            return Boolean(
                typeof window !== 'undefined' &&
                window.AndroidWidgetBridge &&
                typeof window.AndroidWidgetBridge.showNativeNotification === 'function'
            );
        } catch {
            return false;
        }
    }

    function isCapacitorLocalNotificationsAvailable() {
        try {
            return Boolean(
                typeof window !== 'undefined' &&
                window.Capacitor &&
                window.Capacitor.Plugins &&
                window.Capacitor.Plugins.LocalNotifications
            );
        } catch {
            return false;
        }
    }

    /**
     * Parsea fechas 'YYYY-MM-DD' (a las 09:00 locales) o 'YYYY-MM-DDTHH:mm' en hora local
     * evitando el desfase UTC de `new Date("YYYY-MM-DD")`.
     */
    function parseLocalDateTime(str) {
        if (!str) return null;
        const s = String(str).trim();
        const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
        if (dateOnly) {
            return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 9, 0, 0, 0);
        }
        const dateTime = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(s);
        if (dateTime) {
            return new Date(
                Number(dateTime[1]),
                Number(dateTime[2]) - 1,
                Number(dateTime[3]),
                Number(dateTime[4]),
                Number(dateTime[5]),
                Number(dateTime[6] || 0),
                0
            );
        }
        const fallback = new Date(s);
        return isNaN(fallback.getTime()) ? null : fallback;
    }

    function getNotifiedCache() {
        try {
            const raw = sessionStorage.getItem(NOTIFIED_CACHE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    function markAsNotified(id) {
        try {
            const cache = getNotifiedCache();
            cache[id] = Date.now();
            sessionStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(cache));
        } catch {
            // Ignorar error de storage
        }
    }

    function isAlreadyNotified(id) {
        const cache = getNotifiedCache();
        return Boolean(cache[id]);
    }

    function hashStringTo32BitInt(str) {
        if (!str) return 1;
        let hash = 0;
        const s = String(str);
        for (let i = 0; i < s.length; i++) {
            hash = ((hash << 5) - hash) + s.charCodeAt(i);
            hash |= 0;
        }
        const val = Math.abs(hash) % 2147483647;
        return val === 0 ? 1 : val;
    }

    function getAppNotificationIcon() {
        return 'assets/icons/icon-192x192.png';
    }

    const Notifications = {
        /**
         * Inicializa permisos, reprograma avisos nativos pendientes y arranca el vigilante
         */
        async init() {
            if (window.StorageModule?.isOnboardingCompleted?.()) {
                await this.requestPermission();
            }
            this.resyncAllScheduled();
            this.startWatcher();
        },

        /**
         * Solicita permisos de notificación en Android Nativo, Capacitor o Web
         */
        async requestPermission() {
            // 1. Puente nativo Android (APK)
            if (isAndroidNativeAvailable() && typeof window.AndroidWidgetBridge.requestNotificationPermission === 'function') {
                try {
                    window.AndroidWidgetBridge.requestNotificationPermission();
                } catch (_) {}
            }

            // 2. Capacitor nativo
            if (isCapacitorLocalNotificationsAvailable()) {
                try {
                    const { LocalNotifications } = window.Capacitor.Plugins;
                    if (typeof LocalNotifications.requestPermissions === 'function') {
                        await LocalNotifications.requestPermissions();
                    }
                } catch (err) {
                    console.warn('Error al solicitar permiso en Capacitor:', err);
                }
            }

            // 3. Web Notification API estándar
            if (typeof window !== 'undefined' && 'Notification' in window) {
                try {
                    if (Notification.permission === 'default') {
                        await Notification.requestPermission();
                    }
                } catch (err) {
                    console.warn('Error al solicitar permiso Web Notification:', err);
                }
            }
        },

        /**
         * Dispara una notificación inmediata enriquecida en la plataforma activa
         */
        displayNotification(title, body, iconUrl = null, tag = 'general', action = 'tasks') {
            const resolvedIcon = iconUrl || getAppNotificationIcon();

            if (window.HapticsModule) {
                window.HapticsModule.double();
            }

            // 1. Notificación nativa Android (APK)
            if (isAndroidNativeAvailable()) {
                try {
                    const notifId = hashStringTo32BitInt(tag || title);
                    window.AndroidWidgetBridge.showNativeNotification(notifId, title, body, action || 'tasks');
                } catch (_) {}
            }

            // 2. Web Notification (ServiceWorker primero para Android Chrome / PWA, luego Notification API)
            if (!isAndroidNativeAvailable() && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                const notifOpts = {
                    body: body,
                    icon: resolvedIcon,
                    tag: tag,
                    badge: resolvedIcon,
                    renotify: true,
                    vibrate: [180, 80, 180],
                    data: { action: action || 'tasks' }
                };
                if ('serviceWorker' in navigator && navigator.serviceWorker?.ready) {
                    navigator.serviceWorker.ready
                        .then(reg => {
                            if (reg && typeof reg.showNotification === 'function') {
                                return reg.showNotification(title, notifOpts);
                            }
                            new Notification(title, notifOpts);
                        })
                        .catch(() => {
                            try { new Notification(title, notifOpts); } catch (_) {}
                        });
                } else {
                    try {
                        new Notification(title, notifOpts);
                    } catch (_) {
                        // Fallback a toast
                    }
                }
            }

            // 3. Aviso visual en pantalla (Toast)
            if (window.showNotification) {
                window.showNotification(`${title}: ${body}`, 'info');
            }
        },

        /**
         * Reprograma todas las tareas pendientes, notas y materias con recordatorio futuro
         */
        resyncAllScheduled() {
            const Storage = window.StorageModule;
            if (!Storage) return;
            const tasks = Storage.getTasks ? Storage.getTasks() : [];
            tasks.forEach(t => {
                if (!t.completed && t.dueDate) {
                    this.scheduleTask(t).catch?.(() => {});
                }
            });
            const notes = Storage.getNotes ? Storage.getNotes() : [];
            notes.forEach(n => {
                if (n.hasReminder && n.reminderDateTime) {
                    this.scheduleNote(n).catch?.(() => {});
                }
            });
            const subjects = Storage.getSubjects ? Storage.getSubjects() : [];
            subjects.forEach(s => {
                if (s && s.reminderMinutes) {
                    this.scheduleSubject(s).catch?.(() => {});
                }
            });
        },

        /**
         * Formatea y programa una notificación para una TAREA
         */
        async scheduleTask(task) {
            if (!task || !task.dueDate || task.completed) return;

            const Storage = window.StorageModule;
            const subjects = Storage ? Storage.getSubjects() : [];
            const subject = subjects.find(s => String(s.id) === String(task.subjectId));
            const subjectName = subject ? subject.name : 'Materia general';

            const priorityText =
                task.priority === 'alta' ? 'Alta 🔴' :
                task.priority === 'baja' ? 'Baja 🟢' : 'Media 🟡';

            const title = `[TAREA] ${task.title}`;
            let body = `Materia: ${subjectName} • Urgencia: ${priorityText}`;
            if (task.notes && task.notes.trim()) {
                body += `\nNota: ${task.notes.trim()}`;
            }

            const dueDate = parseLocalDateTime(task.dueDate);
            if (!dueDate) return;
            const triggerMs = dueDate.getTime();
            const now = Date.now();

            // 1. Puente nativo Android (AlarmManager - funciona incluso con app cerrada)
            if (isAndroidNativeAvailable() && typeof window.AndroidWidgetBridge.scheduleNativeNotification === 'function') {
                try {
                    const notifId = hashStringTo32BitInt('task_' + task.id);
                    if (triggerMs > now) {
                        window.AndroidWidgetBridge.scheduleNativeNotification(notifId, title, body, triggerMs, 'tasks');
                        // Aviso previo 30 min antes si falta más de 40 min
                        const preMs = triggerMs - (30 * 60 * 1000);
                        if (preMs > now + (10 * 60 * 1000)) {
                            const preId = hashStringTo32BitInt('task_pre_' + task.id);
                            window.AndroidWidgetBridge.scheduleNativeNotification(
                                preId,
                                `Próxima entrega (30 min): ${task.title}`,
                                body,
                                preMs,
                                'tasks'
                            );
                        }
                    }
                } catch (err) {
                    console.warn('Error programando tarea nativa en Android:', err);
                }
            }

            // 2. Capacitor LocalNotifications fallback
            if (isCapacitorLocalNotificationsAvailable() && triggerMs > now) {
                try {
                    const { LocalNotifications } = window.Capacitor.Plugins;
                    const notifId = hashStringTo32BitInt('task_' + task.id);
                    await LocalNotifications.schedule({
                        notifications: [{
                            id: notifId,
                            title: title,
                            body: body,
                            schedule: { at: dueDate },
                            sound: 'default'
                        }]
                    });
                } catch (err) {
                    console.warn('Error programando en Capacitor:', err);
                }
            }
        },

        /**
         * Cancela notificación de tarea
         */
        async cancelTask(taskId) {
            if (!taskId) return;
            const notifId = hashStringTo32BitInt('task_' + taskId);
            const preId = hashStringTo32BitInt('task_pre_' + taskId);

            if (isAndroidNativeAvailable() && typeof window.AndroidWidgetBridge.cancelNativeNotification === 'function') {
                try {
                    window.AndroidWidgetBridge.cancelNativeNotification(notifId);
                    window.AndroidWidgetBridge.cancelNativeNotification(preId);
                } catch (_) {}
            }

            if (!isCapacitorLocalNotificationsAvailable()) return;
            try {
                const { LocalNotifications } = window.Capacitor.Plugins;
                await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
            } catch (err) {
                console.warn('Error cancelando notificación de tarea:', err);
            }
        },

        /**
         * Formatea y programa una notificación para una NOTA
         */
        async scheduleNote(note) {
            if (!note || !note.hasReminder || !note.reminderDateTime) return;

            const typeMap = {
                'idea': 'Idea 💡',
                'apunte': 'Apunte Rápido 📝',
                'pendiente': 'Pendiente 📌',
                'importante': 'Importante ⚠️',
                'personal': 'Personal 🔒'
            };

            const typeLabel = typeMap[note.type] || 'Recordatorio';
            const title = `[NOTA - ${typeLabel}] ${note.title}`;
            const excerpt = note.content
                ? (note.content.length > 120 ? note.content.substring(0, 117) + '...' : note.content)
                : 'Tienes un recordatorio pendiente.';
            const body = excerpt;

            const remDate = parseLocalDateTime(note.reminderDateTime);
            if (!remDate) return;
            const triggerMs = remDate.getTime();
            const now = Date.now();

            // 1. Puente nativo Android (AlarmManager)
            if (isAndroidNativeAvailable() && typeof window.AndroidWidgetBridge.scheduleNativeNotification === 'function') {
                try {
                    if (triggerMs > now) {
                        const notifId = hashStringTo32BitInt('note_' + note.id);
                        window.AndroidWidgetBridge.scheduleNativeNotification(notifId, title, body, triggerMs, 'notes');
                    }
                } catch (err) {
                    console.warn('Error programando nota nativa en Android:', err);
                }
            }

            // 2. Capacitor LocalNotifications fallback
            if (isCapacitorLocalNotificationsAvailable() && triggerMs > now) {
                try {
                    const { LocalNotifications } = window.Capacitor.Plugins;
                    const notifId = hashStringTo32BitInt('note_' + note.id);
                    await LocalNotifications.schedule({
                        notifications: [{
                            id: notifId,
                            title: title,
                            body: body,
                            schedule: { at: remDate },
                            sound: 'default'
                        }]
                    });
                } catch (err) {
                    console.warn('Error programando nota en Capacitor:', err);
                }
            }
        },

        /**
         * Cancela notificación de nota
         */
        async cancelNote(noteId) {
            if (!noteId) return;
            const notifId = hashStringTo32BitInt('note_' + noteId);

            if (isAndroidNativeAvailable() && typeof window.AndroidWidgetBridge.cancelNativeNotification === 'function') {
                try {
                    window.AndroidWidgetBridge.cancelNativeNotification(notifId);
                } catch (_) {}
            }

            if (!isCapacitorLocalNotificationsAvailable()) return;
            try {
                const { LocalNotifications } = window.Capacitor.Plugins;
                await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
            } catch (err) {
                console.warn('Error cancelando notificación de nota:', err);
            }
        },

        /**
         * Formatea y programa recordatorios semanales de una MATERIA (15, 30, 45 o 60 min antes)
         */
        async scheduleSubject(subject) {
            if (!subject || !subject.id) return { scheduledCount: 0, nextTriggerMs: null, firedImmediate: false };
            await this.cancelSubject(subject.id);

            const remMin = Number(subject.reminderMinutes);
            if (!(remMin === 15 || remMin === 30 || remMin === 45 || remMin === 60)) {
                return { scheduledCount: 0, nextTriggerMs: null, firedImmediate: false };
            }
            if (!subject.startTime || !Array.isArray(subject.days) || subject.days.length === 0) {
                return { scheduledCount: 0, nextTriggerMs: null, firedImmediate: false };
            }

            const timeParts = String(subject.startTime).split(':');
            const startHour = Number(timeParts[0]);
            const startMin = Number(timeParts[1]);
            if (!Number.isFinite(startHour) || !Number.isFinite(startMin)) {
                return { scheduledCount: 0, nextTriggerMs: null, firedImmediate: false };
            }

            const dayMap = { dom: 0, lun: 1, mar: 2, mie: 3, jue: 4, vie: 5, sab: 6 };
            const leadLabel = remMin === 60 ? '1 hora' : `${remMin} minutos`;
            const title = `[CLASE] ${subject.name}`;
            const buildBody = (remainingText) => {
                const extraParts = [`Inicia en ${remainingText} (${subject.startTime} hrs)`];
                if (subject.classroom && subject.classroom.trim()) extraParts.push(subject.classroom.trim());
                if (subject.professor && subject.professor.trim()) extraParts.push(subject.professor.trim());
                return extraParts.join(' • ');
            };
            const body = buildBody(leadLabel);

            const now = new Date();
            const nowMs = now.getTime();
            const normalizedDays = [...new Set(subject.days.map(normalizeDayId).filter(d => dayMap[d] !== undefined))];
            const timersForSubject = [];
            let scheduledCount = 0;
            let nextTriggerMs = null;
            let firedImmediate = false;

            for (const dayId of normalizedDays) {
                const targetDow = dayMap[dayId];
                const diffDays = (targetDow - now.getDay() + 7) % 7;
                const classDate = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() + diffDays,
                    startHour,
                    startMin,
                    0,
                    0
                );
                let triggerMs = classDate.getTime() - (remMin * 60 * 1000);

                // Si la clase es hoy y ya estamos dentro de la ventana del recordatorio (antes de que inicie),
                // avisar de inmediato y programar la siguiente semana.
                if (triggerMs <= nowMs + 1000 && classDate.getTime() > nowMs) {
                    const sessionKey = `subject_${subject.id}_${classDate.getFullYear()}-${classDate.getMonth() + 1}-${classDate.getDate()}_${remMin}`;
                    if (!isAlreadyNotified(sessionKey)) {
                        markAsNotified(sessionKey);
                        const minsLeft = Math.max(1, Math.round((classDate.getTime() - nowMs) / 60000));
                        const minsText = minsLeft === 1 ? '1 minuto' : `${minsLeft} minutos`;
                        this.displayNotification(title, buildBody(minsText), getAppNotificationIcon(), sessionKey, 'subjects');
                        firedImmediate = true;
                    }
                    classDate.setDate(classDate.getDate() + 7);
                    triggerMs = classDate.getTime() - (remMin * 60 * 1000);
                } else if (triggerMs <= nowMs + 1000) {
                    classDate.setDate(classDate.getDate() + 7);
                    triggerMs = classDate.getTime() - (remMin * 60 * 1000);
                }

                const notifId = hashStringTo32BitInt(`subject_${subject.id}_${dayId}`);
                scheduledCount += 1;
                if (nextTriggerMs === null || triggerMs < nextTriggerMs) {
                    nextTriggerMs = triggerMs;
                }

                // 1. Alarma exacta nativa Android (funciona incluso con la app cerrada)
                if (isAndroidNativeAvailable() && typeof window.AndroidWidgetBridge.scheduleNativeNotification === 'function') {
                    try {
                        window.AndroidWidgetBridge.scheduleNativeNotification(notifId, title, body, triggerMs, 'subjects');
                    } catch (err) {
                        console.warn('Error programando recordatorio de materia en Android:', err);
                    }
                }

                // 2. Capacitor LocalNotifications fallback
                if (isCapacitorLocalNotificationsAvailable()) {
                    try {
                        const { LocalNotifications } = window.Capacitor.Plugins;
                        await LocalNotifications.schedule({
                            notifications: [{
                                id: notifId,
                                title: title,
                                body: body,
                                schedule: { at: new Date(triggerMs) },
                                sound: 'default'
                            }]
                        });
                    } catch (err) {
                        console.warn('Error programando materia en Capacitor:', err);
                    }
                }

                // 3. Temporizador exacto en sesión (Web/PWA y app abierta) para avisos dentro de las próximas 24h
                const delayMs = triggerMs - nowMs;
                if (delayMs > 0 && delayMs <= 24 * 60 * 60 * 1000) {
                    const sessionKey = `subject_${subject.id}_${classDate.getFullYear()}-${classDate.getMonth() + 1}-${classDate.getDate()}_${remMin}`;
                    const timerId = setTimeout(() => {
                        if (!isAlreadyNotified(sessionKey)) {
                            markAsNotified(sessionKey);
                            this.displayNotification(title, body, getAppNotificationIcon(), sessionKey, 'subjects');
                        }
                    }, delayMs);
                    timersForSubject.push(timerId);
                }
            }

            if (timersForSubject.length > 0) {
                subjectTimers.set(String(subject.id), timersForSubject);
            }

            return { scheduledCount, nextTriggerMs, firedImmediate };
        },

        /**
         * Envía una notificación de prueba para verificar permisos y avisos de materias
         */
        async testSubjectReminder(subjectName, reminderMinutes, startTime) {
            await this.requestPermission();
            const cleanName = (subjectName || '').trim() || 'Tu materia';
            const remMin = Number(reminderMinutes) || 15;
            const leadLabel = remMin === 60 ? '1 hora' : `${remMin} minutos`;
            const timeTxt = startTime ? ` (${startTime} hrs)` : '';
            this.displayNotification(
                `[CLASE] ${cleanName}`,
                `Prueba de recordatorio: te avisaremos ${leadLabel} antes${timeTxt}.`,
                getAppNotificationIcon(),
                `subject_test_${Date.now()}`,
                'subjects'
            );
        },

        /**
         * Cancela todos los recordatorios programados de una MATERIA
         */
        async cancelSubject(subjectId) {
            if (!subjectId) return;
            const key = String(subjectId);
            const activeTimers = subjectTimers.get(key);
            if (Array.isArray(activeTimers)) {
                activeTimers.forEach(t => clearTimeout(t));
                subjectTimers.delete(key);
            }

            const dayIds = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
            const ids = dayIds.map(d => hashStringTo32BitInt(`subject_${subjectId}_${d}`));

            if (isAndroidNativeAvailable() && typeof window.AndroidWidgetBridge.cancelNativeNotification === 'function') {
                ids.forEach(notifId => {
                    try {
                        window.AndroidWidgetBridge.cancelNativeNotification(notifId);
                    } catch (_) {}
                });
            }

            if (!isCapacitorLocalNotificationsAvailable()) return;
            try {
                const { LocalNotifications } = window.Capacitor.Plugins;
                await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
            } catch (err) {
                console.warn('Error cancelando recordatorios de materia:', err);
            }
        },

        /**
         * Cancela todas las notificaciones pendientes
         */
        async cancelAll() {
            subjectTimers.forEach(timers => {
                if (Array.isArray(timers)) timers.forEach(t => clearTimeout(t));
            });
            subjectTimers.clear();

            if (isAndroidNativeAvailable() && typeof window.AndroidWidgetBridge.cancelAllNativeNotifications === 'function') {
                try {
                    window.AndroidWidgetBridge.cancelAllNativeNotifications();
                } catch (_) {}
            }

            if (!isCapacitorLocalNotificationsAvailable()) return;
            try {
                const { LocalNotifications } = window.Capacitor.Plugins;
                const pending = await LocalNotifications.getPending();
                if (pending && pending.notifications && pending.notifications.length > 0) {
                    await LocalNotifications.cancel({ notifications: pending.notifications });
                }
            } catch (err) {
                console.warn('Error cancelando todas las notificaciones:', err);
            }
        },

        /**
         * Verificador en tiempo de ejecución (Runtime Watcher)
         */
        startWatcher() {
            if (checkIntervalId) clearInterval(checkIntervalId);

            const check = () => {
                const Storage = window.StorageModule;
                if (!Storage) return;

                const now = new Date();
                const nowTime = now.getTime();

                // 1. Verificar tareas con fecha límite próxima o recién cumplida
                const tasks = Storage.getTasks ? Storage.getTasks() : [];
                tasks.forEach(t => {
                    if (t.completed || !t.dueDate) return;
                    const parsed = parseLocalDateTime(t.dueDate);
                    if (!parsed) return;
                    const dueTime = parsed.getTime();
                    if (dueTime <= nowTime + (10 * 60 * 1000) && dueTime >= nowTime - (5 * 60 * 1000)) {
                        if (!isAlreadyNotified('task_' + t.id)) {
                            markAsNotified('task_' + t.id);
                            const subjects = Storage.getSubjects ? Storage.getSubjects() : [];
                            const sub = subjects.find(s => String(s.id) === String(t.subjectId));
                            const subName = sub ? sub.name : 'Materia escolar';
                            const priorityText = t.priority === 'alta' ? 'Alta 🔴' : (t.priority === 'baja' ? 'Baja 🟢' : 'Media 🟡');
                            this.displayNotification(
                                `[TAREA] ${t.title}`,
                                `Materia: ${subName} • Urgencia: ${priorityText} (Entrega: ${String(t.dueDate).replace('T', ' ')})`,
                                getAppNotificationIcon(),
                                'task_' + t.id,
                                'tasks'
                            );
                        }
                    }
                });

                // 2. Verificar notas con recordatorio
                const notes = Storage.getNotes ? Storage.getNotes() : [];
                notes.forEach(n => {
                    if (!n.hasReminder || !n.reminderDateTime) return;
                    const parsed = parseLocalDateTime(n.reminderDateTime);
                    if (!parsed) return;
                    const remTime = parsed.getTime();
                    if (remTime <= nowTime + (5 * 60 * 1000) && remTime >= nowTime - (5 * 60 * 1000)) {
                        if (!isAlreadyNotified('note_' + n.id)) {
                            markAsNotified('note_' + n.id);
                            const typeMap = {
                                'idea': 'Idea 💡',
                                'apunte': 'Apunte Rápido 📝',
                                'pendiente': 'Pendiente 📌',
                                'importante': 'Importante ⚠️',
                                'personal': 'Personal 🔒'
                            };
                            const typeLabel = typeMap[n.type] || 'Recordatorio';
                            this.displayNotification(
                                `[NOTA - ${typeLabel}] ${n.title}`,
                                n.content ? n.content.substring(0, 120) : 'Recordatorio programado',
                                getAppNotificationIcon(),
                                'note_' + n.id,
                                'notes'
                            );
                        }
                    }
                });

                // 3. Verificar materias con recordatorio antes de clase (15, 30, 45 o 60 min)
                const subjects = Storage.getSubjects ? Storage.getSubjects() : [];
                const dowIds = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
                subjects.forEach(s => {
                    const remMin = Number(s?.reminderMinutes);
                    if (!(remMin === 15 || remMin === 30 || remMin === 45 || remMin === 60)) return;
                    if (!s.startTime || !Array.isArray(s.days) || s.days.length === 0) return;
                    const parts = String(s.startTime).split(':');
                    const h = Number(parts[0]);
                    const m = Number(parts[1]);
                    if (!Number.isFinite(h) || !Number.isFinite(m)) return;

                    const normDays = s.days.map(normalizeDayId);

                    // Revisar hoy y mañana (por clases a medianoche con aviso 1h antes)
                    for (let offset = 0; offset <= 1; offset++) {
                        const classDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, h, m, 0, 0);
                        const dayId = dowIds[classDate.getDay()];
                        if (!normDays.includes(dayId)) continue;

                        const classMs = classDate.getTime();
                        const triggerMs = classMs - (remMin * 60 * 1000);
                        // Ventana confiable: desde 1 min antes del aviso hasta el inicio de la clase
                        if (nowTime >= triggerMs - (60 * 1000) && nowTime <= classMs + (60 * 1000)) {
                            const sessionKey = `subject_${s.id}_${classDate.getFullYear()}-${classDate.getMonth() + 1}-${classDate.getDate()}_${remMin}`;
                            if (!isAlreadyNotified(sessionKey)) {
                                markAsNotified(sessionKey);
                                const minsLeft = Math.max(1, Math.round((classMs - nowTime) / 60000));
                                const leadLabel = minsLeft >= 55 ? '1 hora' : (minsLeft === 1 ? '1 minuto' : `${minsLeft} minutos`);
                                const extra = [`Inicia en ${leadLabel} (${s.startTime} hrs)`];
                                if (s.classroom && s.classroom.trim()) extra.push(s.classroom.trim());
                                this.displayNotification(
                                    `[CLASE] ${s.name}`,
                                    extra.join(' • '),
                                    getAppNotificationIcon(),
                                    sessionKey,
                                    'subjects'
                                );
                            }
                        }
                    }
                });
            };

            check();
            checkIntervalId = setInterval(check, 20000);

            if (!visibilityListenerBound && typeof document !== 'undefined') {
                visibilityListenerBound = true;
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) {
                        check();
                        this.resyncAllScheduled();
                    }
                });
            }
        }
    };

    return Notifications;
})();
