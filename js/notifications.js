/**
 * Módulo de Notificaciones Enriquecidas (v1.5.8)
 * Soporte completo: Puente nativo Android (AlarmManager + NotificationManager),
 * LocalNotifications de Capacitor y Web Notifications API.
 * Formato condicional para Tareas y Notas Rápidas.
 */

window.NotificationsModule = (() => {
    const NOTIFIED_CACHE_KEY = 'org_escolar_notified_cache';
    let checkIntervalId = null;

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

            // 2. Web Notification
            if (!isAndroidNativeAvailable() && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                    new Notification(title, {
                        body: body,
                        icon: resolvedIcon,
                        tag: tag,
                        badge: resolvedIcon
                    });
                    return;
                } catch {
                    // Fallback a toast
                }
            }

            // 3. Aviso visual en pantalla (Toast)
            if (window.showNotification) {
                window.showNotification(`${title}: ${body}`, 'info');
            }
        },

        /**
         * Reprograma todas las tareas pendientes y notas con recordatorio futuro
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
         * Cancela todas las notificaciones pendientes
         */
        async cancelAll() {
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

                const nowTime = Date.now();

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
            };

            check();
            checkIntervalId = setInterval(check, 30000);
        }
    };

    return Notifications;
})();
