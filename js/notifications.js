/**
 * Módulo de Notificaciones Enriquecidas
 * Soporte dual: Web Notifications API (Navegador) y LocalNotifications de Capacitor (Android).
 * Formato condicional estricto para Tareas y Notas Rápidas.
 */

window.NotificationsModule = (() => {
    const NOTIFIED_CACHE_KEY = 'org_escolar_notified_cache';
    let checkIntervalId = null;

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
         * Inicializa permisos y el verificador en segundo plano
         */
        async init() {
            await this.requestPermission();
            this.startWatcher();
        },

        /**
         * Solicita permisos de notificación en Web o Capacitor
         */
        async requestPermission() {
            // 1. Capacitor nativo
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

            // 2. Web Notification API estándar
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
        displayNotification(title, body, iconUrl = null, tag = 'general') {
            const resolvedIcon = iconUrl || getAppNotificationIcon();

            // Disparar háptica
            if (window.HapticsModule) {
                window.HapticsModule.double();
            }

            // 1. Web Notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
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

            // 2. Fallback visual en pantalla (Toast)
            if (window.showNotification) {
                window.showNotification(`${title}: ${body}`, 'info');
            }
        },

        /**
         * Formatea y programa una notificación para una TAREA
         * Formato condicional estricto: [TAREA] + Título + Materia + Nivel de Urgencia
         */
        async scheduleTask(task) {
            if (!task || !task.dueDate || task.completed) return;

            const Storage = window.StorageModule;
            const subjects = Storage ? Storage.getSubjects() : [];
            const subject = subjects.find(s => s.id === task.subjectId);
            const subjectName = subject ? subject.name : 'Materia general';

            const priorityText = 
                task.priority === 'alta' ? 'Alta 🔴' :
                task.priority === 'baja' ? 'Baja 🟢' : 'Media 🟡';

            const title = `[TAREA] ${task.title}`;
            let body = `Materia: ${subjectName} • Urgencia: ${priorityText}`;
            if (task.notes && task.notes.trim()) {
                body += `\nNota: ${task.notes.trim()}`;
            }

            // Programar en Capacitor LocalNotifications si está disponible
            if (isCapacitorLocalNotificationsAvailable()) {
                try {
                    const dueDate = new Date(task.dueDate);
                    if (!isNaN(dueDate.getTime()) && dueDate.getTime() > Date.now()) {
                        const { LocalNotifications } = window.Capacitor.Plugins;
                        const notifId = hashStringTo32BitInt('task_' + task.id);
                        await LocalNotifications.schedule({
                            notifications: [
                                {
                                    id: notifId,
                                    title: title,
                                    body: body,
                                    schedule: { at: dueDate },
                                    sound: 'default'
                                }
                            ]
                        });
                    }
                } catch (err) {
                    console.warn('Error programando en Capacitor:', err);
                }
            }
        },

        /**
         * Cancela notificación de tarea
         */
        async cancelTask(taskId) {
            if (!taskId || !isCapacitorLocalNotificationsAvailable()) return;
            try {
                const { LocalNotifications } = window.Capacitor.Plugins;
                const notifId = hashStringTo32BitInt('task_' + taskId);
                await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
            } catch (err) {
                console.warn('Error cancelando notificación de tarea:', err);
            }
        },

        /**
         * Formatea y programa una notificación para una NOTA
         * Formato condicional estricto: [NOTA - Tipo de Nota] + Título de la nota + extracto
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

            // Programar en Capacitor LocalNotifications
            if (isCapacitorLocalNotificationsAvailable()) {
                try {
                    const remDate = new Date(note.reminderDateTime);
                    if (!isNaN(remDate.getTime()) && remDate.getTime() > Date.now()) {
                        const { LocalNotifications } = window.Capacitor.Plugins;
                        const notifId = hashStringTo32BitInt('note_' + note.id);
                        await LocalNotifications.schedule({
                            notifications: [
                                {
                                    id: notifId,
                                    title: title,
                                    body: body,
                                    schedule: { at: remDate },
                                    sound: 'default'
                                }
                            ]
                        });
                    }
                } catch (err) {
                    console.warn('Error programando nota en Capacitor:', err);
                }
            }
        },

        /**
         * Cancela notificación de nota
         */
        async cancelNote(noteId) {
            if (!noteId || !isCapacitorLocalNotificationsAvailable()) return;
            try {
                const { LocalNotifications } = window.Capacitor.Plugins;
                const notifId = hashStringTo32BitInt('note_' + noteId);
                await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
            } catch (err) {
                console.warn('Error cancelando notificación de nota:', err);
            }
        },

        /**
         * Cancela todas las notificaciones pendientes
         */
        async cancelAll() {
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
         * Verificador en tiempo de ejecución (Web Runtime Watcher)
         * Se ejecuta periódicamente para notificar tareas y notas vencidas en la sesión web activa
         */
        startWatcher() {
            if (checkIntervalId) clearInterval(checkIntervalId);
            
            const check = () => {
                const Storage = window.StorageModule;
                if (!Storage) return;

                const nowTime = Date.now();
                const nowIso = new Date().toISOString().substring(0, 16); // YYYY-MM-DDTHH:mm

                // 1. Verificar tareas con fecha límite próxima o recién cumplida
                const tasks = Storage.getTasks ? Storage.getTasks() : [];
                tasks.forEach(t => {
                    if (t.completed || !t.dueDate) return;
                    const dueTime = new Date(t.dueDate).getTime();
                    // Si vence en los próximos 10 minutos o venció hace menos de 5 minutos y no ha sido notificada
                    if (dueTime <= nowTime + (10 * 60 * 1000) && dueTime >= nowTime - (5 * 60 * 1000)) {
                        if (!isAlreadyNotified('task_' + t.id)) {
                            markAsNotified('task_' + t.id);
                            const subjects = Storage.getSubjects ? Storage.getSubjects() : [];
                            const sub = subjects.find(s => s.id === t.subjectId);
                            const subName = sub ? sub.name : 'Materia escolar';
                            const priorityText = t.priority === 'alta' ? 'Alta 🔴' : (t.priority === 'baja' ? 'Baja 🟢' : 'Media 🟡');
                            this.displayNotification(
                                `[TAREA] ${t.title}`,
                                `Materia: ${subName} • Urgencia: ${priorityText} (Fecha límite: ${t.dueDate.replace('T', ' ')})`,
                                getAppNotificationIcon(),
                                'task_' + t.id
                            );
                        }
                    }
                });

                // 2. Verificar notas con recordatorio
                const notes = Storage.getNotes ? Storage.getNotes() : [];
                notes.forEach(n => {
                    if (!n.hasReminder || !n.reminderDateTime) return;
                    const remTime = new Date(n.reminderDateTime).getTime();
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
                                'note_' + n.id
                            );
                        }
                    }
                });
            };

            // Ejecutar inmediatamente y cada 30 segundos
            check();
            checkIntervalId = setInterval(check, 30000);
        }
    };

    return Notifications;
})();
