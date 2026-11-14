/**
 * backgrounds.js - Sistema de Fondos Ambientales, Temáticos Experimentales y "Mi foto" (v1.5.1 Etapa 3)
 * - Capa fija #app-background (z-index: 0) con capas de degradado, foto (cover + punto focal), velo (scrim) y lienzo.
 * - "Mi foto" almacenada exclusivamente en IndexedDB (navigator.storage.persist()), nunca en localStorage ni respaldos JSON.
 * - Estáticos por defecto; animación opcional con tope de 30 FPS, pausa por visibilitychange y degradación automática.
 */
(() => {
    'use strict';

    const DB_NAME = 'OrganizadorTareasMediaDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'backgrounds';
    const CUSTOM_PHOTO_KEY = 'custom_bg_photo';

    const BASIC_PRESETS = [
        {
            id: 'default',
            name: 'Predeterminado',
            category: 'basic',
            thumbBg: 'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.45), transparent 60%), radial-gradient(circle at 80% 80%, rgba(245,158,11,0.35), transparent 65%), linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)',
            lightGradient: '',
            darkGradient: ''
        },
        {
            id: 'breeze_indigo',
            name: 'Brisa Índigo',
            category: 'basic',
            thumbBg: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 55%, #f59e0b 100%)',
            lightGradient: 'radial-gradient(58vw 48vh at 16% 18%, rgba(99, 102, 241, 0.34) 0%, transparent 72%), radial-gradient(54vw 42vh at 84% 22%, rgba(56, 189, 248, 0.30) 0%, transparent 70%), radial-gradient(52vw 40vh at 50% 88%, rgba(245, 158, 11, 0.22) 0%, transparent 74%), linear-gradient(155deg, #dbeafe 0%, #eef2ff 50%, #fef3c7 100%)',
            darkGradient: 'radial-gradient(58vw 48vh at 16% 18%, rgba(79, 70, 229, 0.42) 0%, transparent 72%), radial-gradient(52vw 42vh at 84% 24%, rgba(14, 165, 233, 0.28) 0%, transparent 72%), radial-gradient(50vw 42vh at 50% 90%, rgba(217, 119, 6, 0.20) 0%, transparent 74%), linear-gradient(155deg, #090d24 0%, #0f172a 55%, #111827 100%)'
        },
        {
            id: 'amber_light',
            name: 'Luz Ámbar',
            category: 'basic',
            thumbBg: 'linear-gradient(135deg, #f59e0b 0%, #fb7185 52%, #fef3c7 100%)',
            lightGradient: 'radial-gradient(55vw 44vh at 22% 16%, rgba(245, 158, 11, 0.36) 0%, transparent 72%), radial-gradient(48vw 38vh at 82% 28%, rgba(251, 146, 60, 0.28) 0%, transparent 70%), radial-gradient(56vw 42vh at 48% 90%, rgba(99, 102, 241, 0.16) 0%, transparent 76%), linear-gradient(155deg, #fffbeb 0%, #fef3c7 52%, #fde68a 100%)',
            darkGradient: 'radial-gradient(56vw 46vh at 20% 16%, rgba(217, 119, 6, 0.36) 0%, transparent 72%), radial-gradient(46vw 36vh at 82% 26%, rgba(245, 158, 11, 0.22) 0%, transparent 72%), radial-gradient(54vw 42vh at 50% 90%, rgba(79, 70, 229, 0.22) 0%, transparent 76%), linear-gradient(155deg, #1a1106 0%, #0f172a 58%, #090b14 100%)'
        },
        {
            id: 'serene_mist',
            name: 'Niebla Serena',
            category: 'basic',
            thumbBg: 'linear-gradient(135deg, #14b8a6 0%, #38bdf8 52%, #6366f1 100%)',
            lightGradient: 'radial-gradient(55vw 45vh at 18% 18%, rgba(20, 184, 166, 0.28) 0%, transparent 72%), radial-gradient(48vw 40vh at 82% 24%, rgba(56, 189, 248, 0.26) 0%, transparent 72%), radial-gradient(52vw 42vh at 50% 90%, rgba(99, 102, 241, 0.18) 0%, transparent 76%), linear-gradient(155deg, #ecfeff 0%, #f0fdfa 52%, #e0f2fe 100%)',
            darkGradient: 'radial-gradient(55vw 45vh at 18% 18%, rgba(13, 148, 136, 0.34) 0%, transparent 72%), radial-gradient(48vw 40vh at 82% 24%, rgba(14, 116, 144, 0.28) 0%, transparent 72%), radial-gradient(52vw 42vh at 50% 90%, rgba(67, 56, 202, 0.22) 0%, transparent 76%), linear-gradient(155deg, #041b1e 0%, #0b1628 55%, #070d19 100%)'
        },
        {
            id: 'deep_night',
            name: 'Noche Profunda',
            category: 'basic',
            thumbBg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #0f172a 100%)',
            lightGradient: 'radial-gradient(54vw 44vh at 18% 18%, rgba(67, 56, 202, 0.32) 0%, transparent 72%), radial-gradient(48vw 38vh at 82% 24%, rgba(30, 58, 138, 0.28) 0%, transparent 72%), radial-gradient(56vw 42vh at 50% 90%, rgba(15, 23, 42, 0.20) 0%, transparent 76%), linear-gradient(155deg, #c7d2fe 0%, #e0e7ff 50%, #cbd5e1 100%)',
            darkGradient: 'radial-gradient(56vw 46vh at 18% 16%, rgba(67, 56, 202, 0.38) 0%, transparent 72%), radial-gradient(46vw 38vh at 82% 22%, rgba(37, 99, 235, 0.24) 0%, transparent 72%), radial-gradient(54vw 42vh at 50% 92%, rgba(15, 23, 42, 0.55) 0%, transparent 78%), linear-gradient(160deg, #030712 0%, #0b1026 54%, #02040a 100%)'
        },
        {
            id: 'soft_lavender',
            name: 'Lavanda Suave',
            category: 'basic',
            thumbBg: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 55%, #ede9fe 100%)',
            lightGradient: 'radial-gradient(55vw 44vh at 18% 18%, rgba(139, 92, 246, 0.28) 0%, transparent 72%), radial-gradient(48vw 38vh at 84% 24%, rgba(236, 72, 153, 0.22) 0%, transparent 72%), radial-gradient(54vw 42vh at 50% 90%, rgba(99, 102, 241, 0.20) 0%, transparent 76%), linear-gradient(155deg, #f5f3ff 0%, #fdf2f8 52%, #eef2ff 100%)',
            darkGradient: 'radial-gradient(55vw 44vh at 18% 18%, rgba(124, 58, 237, 0.34) 0%, transparent 72%), radial-gradient(48vw 38vh at 84% 24%, rgba(219, 39, 119, 0.24) 0%, transparent 72%), radial-gradient(54vw 42vh at 50% 90%, rgba(79, 70, 229, 0.24) 0%, transparent 76%), linear-gradient(155deg, #160a2c 0%, #0f172a 58%, #090612 100%)'
        }
    ];

    const MONO_PRESETS = [
        {
            id: 'mono_silver',
            name: 'Plata',
            category: 'mono',
            thumbBg: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 52%, #94a3b8 100%)',
            lightGradient: 'radial-gradient(52vw 42vh at 20% 18%, rgba(255, 255, 255, 0.65) 0%, transparent 72%), radial-gradient(48vw 38vh at 82% 24%, rgba(148, 163, 184, 0.35) 0%, transparent 72%), linear-gradient(155deg, #e2e8f0 0%, #f1f5f9 55%, #cbd5e1 100%)',
            darkGradient: 'radial-gradient(52vw 42vh at 20% 18%, rgba(148, 163, 184, 0.24) 0%, transparent 72%), radial-gradient(48vw 38vh at 82% 24%, rgba(100, 116, 139, 0.20) 0%, transparent 72%), linear-gradient(155deg, #1f242d 0%, #171a21 55%, #111318 100%)'
        },
        {
            id: 'mono_titanium',
            name: 'Titanio',
            category: 'mono',
            thumbBg: 'linear-gradient(135deg, #94a3b8 0%, #64748b 55%, #475569 100%)',
            lightGradient: 'radial-gradient(52vw 42vh at 20% 18%, rgba(148, 163, 184, 0.38) 0%, transparent 72%), radial-gradient(48vw 38vh at 82% 24%, rgba(71, 85, 105, 0.24) 0%, transparent 72%), linear-gradient(155deg, #cbd5e1 0%, #e2e8f0 52%, #94a3b8 100%)',
            darkGradient: 'radial-gradient(52vw 42vh at 20% 18%, rgba(100, 116, 139, 0.28) 0%, transparent 72%), radial-gradient(48vw 38vh at 82% 24%, rgba(71, 85, 105, 0.22) 0%, transparent 72%), linear-gradient(155deg, #181b22 0%, #111318 55%, #090a0d 100%)'
        },
        {
            id: 'mono_graphite',
            name: 'Grafito',
            category: 'mono',
            thumbBg: 'linear-gradient(135deg, #475569 0%, #1e293b 55%, #0f172a 100%)',
            lightGradient: 'radial-gradient(52vw 42vh at 20% 18%, rgba(100, 116, 139, 0.36) 0%, transparent 72%), radial-gradient(48vw 38vh at 82% 24%, rgba(51, 65, 85, 0.26) 0%, transparent 72%), linear-gradient(155deg, #cbd5e1 0%, #94a3b8 60%, #64748b 100%)',
            darkGradient: 'radial-gradient(52vw 42vh at 20% 18%, rgba(71, 85, 105, 0.24) 0%, transparent 72%), radial-gradient(48vw 38vh at 82% 24%, rgba(30, 41, 59, 0.30) 0%, transparent 72%), linear-gradient(155deg, #0d0f14 0%, #090a0d 55%, #040507 100%)'
        }
    ];

    const THEMATIC_PRESETS = [
        {
            id: 'theme_matrix',
            themeId: 'matrix',
            codeId: 'MATRIX99',
            name: 'Terminal Matrix',
            icon: '🟢',
            thumbBg: 'linear-gradient(135deg, #022c22 0%, #065f46 55%, #020804 100%)',
            gradient: 'radial-gradient(52vw 44vh at 20% 18%, rgba(16, 185, 129, 0.28) 0%, transparent 72%), radial-gradient(46vw 38vh at 84% 80%, rgba(5, 150, 105, 0.24) 0%, transparent 74%), linear-gradient(160deg, #020c06 0%, #020804 60%, #010402 100%)'
        },
        {
            id: 'theme_sakura',
            themeId: 'sakura',
            codeId: 'ZENPEACE',
            name: 'Jardín Sakura',
            icon: '🌸',
            thumbBg: 'linear-gradient(135deg, #881337 0%, #f43f5e 52%, #2e1065 100%)',
            gradient: 'radial-gradient(52vw 44vh at 18% 16%, rgba(244, 63, 94, 0.34) 0%, transparent 72%), radial-gradient(46vw 38vh at 84% 26%, rgba(251, 113, 133, 0.28) 0%, transparent 74%), radial-gradient(50vw 40vh at 50% 90%, rgba(167, 139, 250, 0.22) 0%, transparent 76%), linear-gradient(160deg, #28101a 0%, #16080e 60%, #0a0306 100%)'
        },
        {
            id: 'theme_synthwave',
            themeId: 'synthwave',
            codeId: 'RETRO80S',
            name: 'Synthwave 1984',
            icon: '🌆',
            thumbBg: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 52%, #06b6d4 100%)',
            gradient: 'radial-gradient(52vw 44vh at 50% 24%, rgba(236, 72, 153, 0.34) 0%, transparent 72%), radial-gradient(48vw 40vh at 82% 82%, rgba(6, 182, 212, 0.24) 0%, transparent 74%), linear-gradient(170deg, #260a38 0%, #140520 55%, #07010d 100%)'
        },
        {
            id: 'theme_starlight',
            themeId: 'starlight',
            codeId: '06062009',
            name: 'Starlight Tribute',
            icon: '✨',
            thumbBg: 'linear-gradient(135deg, #db2777 0%, #9333ea 52%, #1e1b4b 100%)',
            gradient: 'radial-gradient(52vw 44vh at 18% 18%, rgba(236, 72, 153, 0.32) 0%, transparent 72%), radial-gradient(48vw 38vh at 82% 24%, rgba(168, 85, 247, 0.32) 0%, transparent 74%), linear-gradient(160deg, #1f0c2e 0%, #0e0519 60%, #05020b 100%)'
        },
        {
            id: 'theme_arcade',
            themeId: 'arcade',
            codeId: 'ARCADE90',
            name: 'Arcade 8-Bit',
            icon: '👾',
            thumbBg: 'linear-gradient(135deg, #eab308 0%, #8b5cf6 52%, #ef4444 100%)',
            gradient: 'radial-gradient(50vw 42vh at 18% 16%, rgba(234, 179, 8, 0.28) 0%, transparent 72%), radial-gradient(46vw 38vh at 82% 26%, rgba(139, 92, 246, 0.30) 0%, transparent 74%), radial-gradient(48vw 40vh at 50% 90%, rgba(239, 68, 68, 0.22) 0%, transparent 76%), linear-gradient(160deg, #181129 0%, #0c0817 60%, #040209 100%)'
        },
        {
            id: 'theme_coffee',
            themeId: 'coffee',
            codeId: 'COFFEE42',
            name: 'Dark Roast',
            icon: '☕',
            thumbBg: 'linear-gradient(135deg, #d97706 0%, #78350f 55%, #1c0f07 100%)',
            gradient: 'radial-gradient(52vw 42vh at 20% 18%, rgba(217, 119, 6, 0.28) 0%, transparent 72%), radial-gradient(46vw 38vh at 82% 26%, rgba(180, 83, 9, 0.24) 0%, transparent 74%), linear-gradient(160deg, #26150b 0%, #150b06 60%, #090402 100%)'
        },
        {
            id: 'theme_apollo',
            themeId: 'apollo',
            codeId: 'APOLLO11',
            name: 'Apollo 11',
            icon: '🚀',
            thumbBg: 'linear-gradient(135deg, #4f46e5 0%, #f97316 55%, #020617 100%)',
            gradient: 'radial-gradient(52vw 42vh at 16% 16%, rgba(99, 102, 241, 0.36) 0%, transparent 72%), radial-gradient(46vw 38vh at 84% 26%, rgba(249, 115, 22, 0.26) 0%, transparent 74%), linear-gradient(160deg, #0d122d 0%, #060916 60%, #020308 100%)'
        },
        {
            id: 'theme_eduardo-gold',
            themeId: 'eduardo-gold',
            codeId: 'EDUARDO',
            name: 'Maestro Dorado',
            icon: '👑',
            thumbBg: 'linear-gradient(135deg, #fbbf24 0%, #b45309 55%, #1c1406 100%)',
            gradient: 'radial-gradient(52vw 42vh at 18% 14%, rgba(245, 158, 11, 0.32) 0%, transparent 72%), radial-gradient(46vw 38vh at 84% 26%, rgba(234, 179, 8, 0.24) 0%, transparent 74%), linear-gradient(160deg, #241908 0%, #130d04 60%, #080501 100%)'
        },
        {
            id: 'theme_penguin',
            themeId: 'penguin',
            codeId: 'PINGUINO',
            name: 'Glacial Polar',
            icon: '🐧',
            thumbBg: 'linear-gradient(135deg, #06b6d4 0%, #38bdf8 55%, #082f49 100%)',
            gradient: 'radial-gradient(52vw 42vh at 18% 16%, rgba(6, 182, 212, 0.32) 0%, transparent 72%), radial-gradient(46vw 38vh at 84% 24%, rgba(56, 189, 248, 0.28) 0%, transparent 74%), linear-gradient(160deg, #082032 0%, #030e19 60%, #01060b 100%)'
        },
        {
            id: 'theme_hyperfocus',
            themeId: 'hyperfocus',
            codeId: 'STUDYMAX',
            name: 'Hiperenfoque',
            icon: '⚡',
            thumbBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 55%, #040c17 100%)',
            gradient: 'radial-gradient(52vw 42vh at 18% 16%, rgba(59, 130, 246, 0.32) 0%, transparent 72%), radial-gradient(46vw 38vh at 84% 24%, rgba(6, 182, 212, 0.22) 0%, transparent 74%), linear-gradient(160deg, #0a1a2e 0%, #040c17 60%, #010408 100%)'
        }
    ];

    const FPS_CAP = 30;
    const FRAME_INTERVAL_MS = 1000 / FPS_CAP;
    const SLOW_FRAME_THRESHOLD_MS = 50;
    const SLOW_FRAMES_LIMIT = 4;

    class BackgroundsManager {
        constructor() {
            this.initialized = false;
            this.container = null;
            this.gradientEl = null;
            this.photoEl = null;
            this.scrimEl = null;
            this.canvas = null;
            this.ctx = null;

            this._customPhotoRecord = null;
            this._customPhotoLoaded = false;
            this._rafId = null;
            this._lastFrameTime = 0;
            this._phase = 0;
            this._slowFramesCount = 0;
            this.isDegraded = false;
            this.degradedReason = '';
            this._missingPhotoNotified = false;
            this._forceFailIdbForTest = false;
            this._particles = [];

            this._boundVisibilityHandler = () => this._onVisibilityChange();
            this._boundResizeHandler = () => this._onResize();
            this._motionQuery = null;
            this._boundMotionHandler = () => this.applyBackground();
        }

        // =====================================================
        // IndexedDB Helpers (Nunca usa localStorage ni JSON)
        // =====================================================
        _openMediaDB() {
            if (this._forceFailIdbForTest) {
                return Promise.reject(new Error('IndexedDB deshabilitado temporalmente'));
            }
            if (typeof window === 'undefined' || !window.indexedDB) {
                return Promise.reject(new Error('IndexedDB no disponible en este navegador'));
            }
            return new Promise((resolve, reject) => {
                try {
                    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
                    req.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains(STORE_NAME)) {
                            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                        }
                    };
                    req.onsuccess = (e) => resolve(e.target.result);
                    req.onerror = (e) => reject(e.target?.error || new Error('Error al abrir IndexedDB'));
                    req.onblocked = () => reject(new Error('IndexedDB bloqueado'));
                } catch (err) {
                    reject(err);
                }
            });
        }

        async requestPersistentStorage() {
            try {
                if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.persist === 'function') {
                    return await navigator.storage.persist();
                }
            } catch (_) {}
            return false;
        }

        async saveCustomPhotoRecord(record) {
            await this.requestPersistentStorage();
            const db = await this._openMediaDB();
            return new Promise((resolve, reject) => {
                try {
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    const store = tx.objectStore(STORE_NAME);
                    const payload = {
                        id: CUSTOM_PHOTO_KEY,
                        dataUrl: record.dataUrl,
                        width: Number(record.width) || 0,
                        height: Number(record.height) || 0,
                        avgLuminance: typeof record.avgLuminance === 'number' ? record.avgLuminance : 0.5,
                        updatedAt: Date.now()
                    };
                    const putReq = store.put(payload);
                    putReq.onerror = () => reject(putReq.error || new Error('Error al guardar en IndexedDB'));
                    tx.oncomplete = () => {
                        this._customPhotoRecord = payload;
                        this._customPhotoLoaded = true;
                        this._missingPhotoNotified = false;
                        db.close?.();
                        resolve(payload);
                    };
                    tx.onerror = () => {
                        db.close?.();
                        reject(tx.error || new Error('Transacción fallida en IndexedDB'));
                    };
                } catch (err) {
                    db.close?.();
                    reject(err);
                }
            });
        }

        async loadCustomPhotoRecord(forceReload = false) {
            if (!forceReload && this._customPhotoLoaded && !this._forceFailIdbForTest) {
                return this._customPhotoRecord;
            }
            const db = await this._openMediaDB();
            return new Promise((resolve, reject) => {
                try {
                    const tx = db.transaction(STORE_NAME, 'readonly');
                    const store = tx.objectStore(STORE_NAME);
                    const getReq = store.get(CUSTOM_PHOTO_KEY);
                    getReq.onsuccess = () => {
                        const res = getReq.result || null;
                        this._customPhotoRecord = res;
                        this._customPhotoLoaded = true;
                        db.close?.();
                        resolve(res);
                    };
                    getReq.onerror = () => {
                        db.close?.();
                        reject(getReq.error || new Error('Error al leer foto de IndexedDB'));
                    };
                } catch (err) {
                    db.close?.();
                    reject(err);
                }
            });
        }

        async deleteCustomPhotoRecord() {
            this._customPhotoRecord = null;
            this._customPhotoLoaded = true;
            try {
                const db = await this._openMediaDB();
                return await new Promise((resolve) => {
                    try {
                        const tx = db.transaction(STORE_NAME, 'readwrite');
                        tx.objectStore(STORE_NAME).delete(CUSTOM_PHOTO_KEY);
                        tx.oncomplete = () => { db.close?.(); resolve(true); };
                        tx.onerror = () => { db.close?.(); resolve(false); };
                    } catch (_) {
                        db.close?.();
                        resolve(false);
                    }
                });
            } catch (_) {
                return false;
            }
        }

        // =====================================================
        // Luminosidad Promedio & Cálculo Inicial de Oscurecimiento
        // =====================================================
        computeAverageLuminance(src) {
            return new Promise((resolve) => {
                if (!src) {
                    resolve(0.5);
                    return;
                }
                const img = new Image();
                img.onload = () => {
                    try {
                        const size = 48;
                        const canvas = document.createElement('canvas');
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d', { willReadFrequently: true });
                        ctx.drawImage(img, 0, 0, size, size);
                        const data = ctx.getImageData(0, 0, size, size).data;
                        let sum = 0;
                        const totalPixels = size * size;
                        for (let i = 0; i < data.length; i += 4) {
                            sum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
                        }
                        const avg = totalPixels > 0 ? sum / totalPixels : 0.5;
                        resolve(Number(Math.min(1, Math.max(0, avg)).toFixed(4)));
                    } catch (_) {
                        resolve(0.5);
                    }
                };
                img.onerror = () => resolve(0.5);
                img.src = src;
            });
        }

        getRecommendedScrim(avgLuminance) {
            const lum = Number.isFinite(Number(avgLuminance)) ? Number(avgLuminance) : 0.5;
            if (lum >= 0.72) return 60;
            if (lum >= 0.52) return 46;
            if (lum >= 0.34) return 32;
            return 18;
        }

        compressFileDirectly(file, maxDim = 1600, quality = 0.88) {
            return new Promise((resolve, reject) => {
                if (!file) {
                    reject(new Error('Archivo no válido.'));
                    return;
                }
                const reader = new FileReader();
                reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onerror = () => reject(new Error('Formato de imagen no válido.'));
                    img.onload = () => {
                        const iw = img.naturalWidth || img.width || 1;
                        const ih = img.naturalHeight || img.height || 1;
                        const longest = Math.max(iw, ih);
                        const scale = longest > maxDim ? maxDim / longest : 1;
                        const w = Math.max(1, Math.round(iw * scale));
                        const h = Math.max(1, Math.round(ih * scale));
                        const c = document.createElement('canvas');
                        c.width = w;
                        c.height = h;
                        const ctx = c.getContext('2d');
                        ctx.fillStyle = '#0f172a';
                        ctx.fillRect(0, 0, w, h);
                        ctx.drawImage(img, 0, 0, w, h);
                        resolve({
                            dataUrl: c.toDataURL('image/jpeg', Math.max(0.85, quality)),
                            width: w,
                            height: h
                        });
                    };
                    img.src = ev.target?.result;
                };
                reader.readAsDataURL(file);
            });
        }

        async saveCustomPhotoFromDataUrl(dataUrl, focalPoint = null, explicitDims = null) {
            const Storage = window.StorageModule;
            const dims = explicitDims || await new Promise((res) => {
                const im = new Image();
                im.onload = () => res({ width: im.naturalWidth || 0, height: im.naturalHeight || 0 });
                im.onerror = () => res({ width: 0, height: 0 });
                im.src = dataUrl;
            });
            const avgLuminance = await this.computeAverageLuminance(dataUrl);
            const recommendedScrim = this.getRecommendedScrim(avgLuminance);

            await this.saveCustomPhotoRecord({
                dataUrl,
                width: dims.width,
                height: dims.height,
                avgLuminance
            });

            if (Storage) {
                if (focalPoint) {
                    Storage.setBackgroundFocalPoint({
                        x: focalPoint.x <= 1 ? focalPoint.x * 100 : focalPoint.x,
                        y: focalPoint.y <= 1 ? focalPoint.y * 100 : focalPoint.y
                    });
                }
                Storage.setBackgroundScrim(recommendedScrim);
                Storage.setBackgroundPreset('custom_photo');
            }
            await this.applyBackground();
            this.renderSettingsUI();
            return { avgLuminance, recommendedScrim, width: dims.width, height: dims.height };
        }

        async handleCustomPhotoUpload({ file = null, src = null, adjustOnly = false } = {}) {
            const Storage = window.StorageModule;
            if (this.isMonochromeActive()) {
                window.OrganizadorApp?.showToast?.('En Modo Monocromático solo se permiten fondos en escala de grises.', 'warning');
                return false;
            }
            const ar = (typeof window !== 'undefined' && window.innerWidth >= 640) ? 16 / 9 : 9 / 16;
            const currentFocal = Storage?.getBackgroundFocalPoint?.() || { x: 50, y: 50 };

            try {
                let finalResult = null;
                if (window.PhotoEditorModule) {
                    finalResult = await window.PhotoEditorModule.open({
                        file,
                        src,
                        aspectRatio: ar,
                        shape: 'rect',
                        maxDim: 1600,
                        mimeType: 'image/jpeg',
                        quality: 0.88,
                        initialFocalPoint: currentFocal,
                        title: adjustOnly ? 'Reencuadrar foto de fondo' : 'Encuadrar foto de fondo',
                        subtitle: 'Ajusta el punto de enfoque para móvil y escritorio (máx. 1600 px, sin recorte rígido).',
                        confirmLabel: 'Usar de fondo'
                    });
                    if (!finalResult) return false;
                } else if (file) {
                    const direct = await this.compressFileDirectly(file, 1600, 0.88);
                    finalResult = { dataUrl: direct.dataUrl, focalPoint: { x: 0.5, y: 0.5 } };
                } else if (src) {
                    finalResult = { dataUrl: src, focalPoint: currentFocal };
                }

                if (!finalResult?.dataUrl) return false;
                const savedInfo = await this.saveCustomPhotoFromDataUrl(finalResult.dataUrl, finalResult.focalPoint);
                window.OrganizadorApp?.showToast?.(
                    `Foto de fondo guardada localmente (oscurecimiento inicial: ${savedInfo.recommendedScrim}%).`,
                    'success'
                );
                return true;
            } catch (err) {
                console.warn('[Backgrounds] Error al guardar Mi foto en IndexedDB:', err);
                Storage?.setBackgroundPreset?.('default');
                await this.applyBackground();
                this.renderSettingsUI();
                window.OrganizadorApp?.showToast?.('No se pudo guardar la foto en IndexedDB; se restauró el fondo predeterminado.', 'warning');
                return false;
            }
        }

        async clearCustomPhoto() {
            const Storage = window.StorageModule;
            await this.deleteCustomPhotoRecord();
            if (Storage?.getBackgroundPreset?.() === 'custom_photo') {
                Storage.setBackgroundPreset('default');
            }
            await this.applyBackground();
            this.renderSettingsUI();
        }

        // =====================================================
        // Reglas de Tema / Monocromático / Experimental
        // =====================================================
        isMonochromeActive() {
            const Storage = window.StorageModule;
            return Boolean(
                Storage?.getGrayModeEnabled?.() ||
                document.documentElement.classList.contains('theme-gray')
            );
        }

        getUnlockedThematicPresets() {
            const Storage = window.StorageModule;
            if (!Storage?.isCodeUnlocked) return [];
            return THEMATIC_PRESETS.filter(p => Storage.isCodeUnlocked(p.codeId));
        }

        getAllThematicPresets() {
            return THEMATIC_PRESETS.slice();
        }

        getAllBasicPresets() {
            return BASIC_PRESETS.slice();
        }

        getAllMonoPresets() {
            return MONO_PRESETS.slice();
        }

        isGrayPreset(id) {
            return id === 'default' || MONO_PRESETS.some(p => p.id === id);
        }

        isThematicPreset(id) {
            return id === 'vault_auto' || THEMATIC_PRESETS.some(p => p.id === id);
        }

        onSpecialThemeChanged(nextThemeId) {
            const Storage = window.StorageModule;
            if (!Storage) return;
            const currentBg = Storage.getBackgroundPreset();
            const isMono = this.isMonochromeActive();

            if (!nextThemeId || nextThemeId === 'default') {
                // Si el tema especial se desactiva, volver automáticamente a un fondo sencillo
                if (this.isThematicPreset(currentBg)) {
                    Storage.setBackgroundPreset('default');
                }
            } else if (!isMono && (!Storage.isSpecialThemeUnlocked || Storage.isSpecialThemeUnlocked(nextThemeId))) {
                // Al activar un tema de la Bóveda desbloqueado, seguir el tema activo si estaba en predeterminado/automático
                if (currentBg === 'default' || currentBg === 'vault_auto') {
                    Storage.setBackgroundPreset('vault_auto');
                }
            }
            this.applyBackground();
            this.renderSettingsUI();
        }

        onGrayModeChanged(enabled) {
            const Storage = window.StorageModule;
            if (enabled && Storage) {
                const currentBg = Storage.getBackgroundPreset();
                if (!this.isGrayPreset(currentBg)) {
                    Storage.setBackgroundPreset('default');
                }
            }
            this.applyBackground();
            this.renderSettingsUI();
        }

        resolveEffectiveBackgroundId() {
            const Storage = window.StorageModule;
            let stored = Storage?.getBackgroundPreset?.() || 'default';
            const isMono = this.isMonochromeActive();

            if (isMono) {
                if (!this.isGrayPreset(stored)) {
                    stored = 'default';
                    Storage?.setBackgroundPreset?.('default');
                }
                return stored;
            }

            if (stored === 'vault_auto') {
                if (this.getUnlockedThematicPresets().length === 0) {
                    Storage?.setBackgroundPreset?.('default');
                    return 'default';
                }
                const activeSpecial = Storage?.getActiveSpecialTheme?.() || 'default';
                if (activeSpecial && activeSpecial !== 'default' && (!Storage?.isSpecialThemeUnlocked || Storage.isSpecialThemeUnlocked(activeSpecial))) {
                    const match = THEMATIC_PRESETS.find(t => t.themeId === activeSpecial);
                    if (match && (!Storage?.isCodeUnlocked || Storage.isCodeUnlocked(match.codeId))) return match.id;
                }
                return 'default';
            }

            if (stored === 'custom_photo') return 'custom_photo';
            if (BASIC_PRESETS.some(b => b.id === stored)) return stored;
            if (MONO_PRESETS.some(m => m.id === stored)) return stored;
            if (THEMATIC_PRESETS.some(t => t.id === stored)) {
                const unlocked = Storage?.isBackgroundPresetUnlocked ? Storage.isBackgroundPresetUnlocked(stored) : true;
                const syntheticThemeClass = stored.replace('_', '-');
                const explicitThemeForced = document.documentElement.classList.contains(syntheticThemeClass);
                if (!unlocked && !explicitThemeForced) {
                    Storage?.setBackgroundPreset?.('default');
                    return 'default';
                }
                return stored;
            }
            return 'default';
        }

        // =====================================================
        // DOM & Renderizado Estático / Animado (<= 30 FPS)
        // =====================================================
        _ensureDOM() {
            this.container = document.getElementById('app-background');
            if (!this.container) return false;
            if (!this.gradientEl || !this.container.contains(this.gradientEl)) {
                this.container.innerHTML = '';
                this.gradientEl = document.createElement('div');
                this.gradientEl.id = 'app-bg-gradient';
                this.gradientEl.className = 'app-bg-layer';

                this.photoEl = document.createElement('div');
                this.photoEl.id = 'app-bg-photo';
                this.photoEl.className = 'app-bg-layer hidden';

                this.scrimEl = document.createElement('div');
                this.scrimEl.id = 'app-bg-scrim';
                this.scrimEl.className = 'app-bg-layer hidden';

                this.canvas = document.createElement('canvas');
                this.canvas.id = 'app-bg-canvas';
                this.canvas.className = 'app-bg-layer hidden';
                this.ctx = this.canvas.getContext('2d');

                this.container.appendChild(this.gradientEl);
                this.container.appendChild(this.photoEl);
                this.container.appendChild(this.scrimEl);
                this.container.appendChild(this.canvas);
            }
            return true;
        }

        _resizeCanvas() {
            if (!this.canvas || !this.ctx) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            const w = Math.max(320, window.innerWidth || 390);
            const h = Math.max(320, window.innerHeight || 844);
            this.canvas.width = Math.round(w * dpr);
            this.canvas.height = Math.round(h * dpr);
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            this._initParticles(w, h);
        }

        _initParticles(w, h) {
            this._particles = [];
            const count = w < 640 ? 28 : 44;
            for (let i = 0; i < count; i++) {
                this._particles.push({
                    x: ((i * 73) % 100) / 100 * w,
                    y: ((i * 37) % 100) / 100 * h,
                    r: 1.5 + (i % 4) * 1.1,
                    speed: 0.4 + (i % 5) * 0.25,
                    drift: ((i % 7) - 3) * 0.18,
                    charIdx: i
                });
            }
        }

        _canAnimateNow() {
            const Storage = window.StorageModule;
            const wantsAnimation = Boolean(Storage?.getBackgroundAnimated?.());
            if (!wantsAnimation) return { ok: false, reason: '' };

            const reduced = Boolean(this._motionQuery?.matches || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
            if (reduced) {
                return { ok: false, reason: 'Animación pausada: tu sistema tiene activada la opción de movimiento reducido.' };
            }

            const cores = typeof navigator !== 'undefined' ? Number(navigator.hardwareConcurrency) : 0;
            if (cores > 0 && cores <= 2) {
                this.isDegraded = true;
                return { ok: false, reason: 'Dispositivo con pocos recursos (<= 2 núcleos): fondo degradado a modo estático para mantener fluidez.' };
            }

            if (this.isDegraded) {
                return { ok: false, reason: this.degradedReason || 'Rendimiento lento detectado: fondo degradado a modo estático.' };
            }

            return { ok: true, reason: '' };
        }

        _stopAnimationLoop() {
            if (this._rafId !== null) {
                cancelAnimationFrame(this._rafId);
                this._rafId = null;
            }
            document.documentElement.classList.remove('animated-bg-running');
        }

        _onVisibilityChange() {
            if (document.hidden) {
                this._stopAnimationLoop();
            } else {
                this._syncAnimationState(this.resolveEffectiveBackgroundId());
            }
        }

        _onResize() {
            this._resizeCanvas();
            const resolved = this.resolveEffectiveBackgroundId();
            if (this.canvas && !this.canvas.classList.contains('hidden')) {
                this._drawFrame(resolved, this._phase);
            }
        }

        _syncAnimationState(resolvedId) {
            this._stopAnimationLoop();
            const can = this._canAnimateNow();
            this.degradedReason = can.reason || '';

            const noticeEl = document.getElementById('settings-bg-perf-notice');
            if (noticeEl) {
                if (this.degradedReason) {
                    noticeEl.textContent = this.degradedReason;
                    noticeEl.classList.remove('hidden');
                } else {
                    noticeEl.classList.add('hidden');
                }
            }

            if (!can.ok || document.hidden || resolvedId === 'custom_photo') {
                return;
            }

            document.documentElement.classList.add('animated-bg-running');
            this._lastFrameTime = performance.now();
            this._slowFramesCount = 0;

            const loop = (now) => {
                if (!this._canAnimateNow().ok || document.hidden) {
                    this._stopAnimationLoop();
                    return;
                }
                const elapsed = now - this._lastFrameTime;
                if (elapsed >= FRAME_INTERVAL_MS - 1) {
                    const drawStart = performance.now();
                    this._lastFrameTime = now - (elapsed % FRAME_INTERVAL_MS);
                    this._phase += Math.min(0.08, (elapsed / 1000) * 0.9);
                    this._drawFrame(resolvedId, this._phase);
                    const drawCost = performance.now() - drawStart;

                    if (drawCost > SLOW_FRAME_THRESHOLD_MS) {
                        this._slowFramesCount += 1;
                        if (this._slowFramesCount >= SLOW_FRAMES_LIMIT) {
                            this.isDegraded = true;
                            this.degradedReason = 'Frames lentos (> 50 ms) detectados: fondo degradado a modo estático.';
                            this._stopAnimationLoop();
                            this.renderSettingsUI();
                            return;
                        }
                    } else {
                        this._slowFramesCount = Math.max(0, this._slowFramesCount - 1);
                    }
                }
                this._rafId = requestAnimationFrame(loop);
            };
            this._rafId = requestAnimationFrame(loop);
        }

        _drawFrame(resolvedId, phase = 0) {
            if (!this.canvas || !this.ctx || !this.canvas.width || !this.canvas.height) return;
            const w = window.innerWidth || 390;
            const h = window.innerHeight || 844;
            const ctx = this.ctx;
            ctx.clearRect(0, 0, w, h);

            if (resolvedId === 'theme_matrix') {
                const chars = '01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ';
                ctx.font = '600 13px "Fira Code", monospace';
                this._particles.forEach((p, idx) => {
                    const y = (p.y + phase * 42 * p.speed) % (h + 40) - 20;
                    ctx.fillStyle = idx % 3 === 0 ? 'rgba(110, 231, 183, 0.28)' : 'rgba(16, 185, 129, 0.16)';
                    const ch = chars[(p.charIdx + Math.floor(phase * 2)) % chars.length];
                    ctx.fillText(ch, p.x % w, y);
                });
                return;
            }

            if (resolvedId === 'theme_sakura') {
                this._particles.forEach((p, idx) => {
                    const y = (p.y + phase * 22 * p.speed) % (h + 30) - 15;
                    const x = (p.x + Math.sin(phase * 1.4 + idx) * 18 + w) % w;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(phase * 0.6 + idx * 0.4);
                    ctx.fillStyle = idx % 2 === 0 ? 'rgba(251, 113, 133, 0.30)' : 'rgba(254, 205, 211, 0.22)';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, p.r * 2.1, p.r * 1.05, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
                return;
            }

            if (resolvedId === 'theme_synthwave') {
                // Sol retro y cuadrícula perspectiva
                const cx = w * 0.5;
                const horizon = h * 0.56;
                const sunR = Math.min(w, h) * 0.16;
                const sunGrad = ctx.createLinearGradient(cx, horizon - sunR, cx, horizon);
                sunGrad.addColorStop(0, 'rgba(251, 191, 36, 0.42)');
                sunGrad.addColorStop(0.55, 'rgba(236, 72, 153, 0.34)');
                sunGrad.addColorStop(1, 'rgba(139, 92, 246, 0.14)');
                ctx.fillStyle = sunGrad;
                ctx.beginPath();
                ctx.arc(cx, horizon - sunR * 0.35, sunR, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = 'rgba(236, 72, 153, 0.20)';
                ctx.lineWidth = 1;
                for (let i = -6; i <= 6; i++) {
                    ctx.beginPath();
                    ctx.moveTo(cx + i * (w * 0.03), horizon);
                    ctx.lineTo(cx + i * (w * 0.22), h);
                    ctx.stroke();
                }
                const scroll = (phase * 0.4) % 1;
                for (let row = 0; row < 7; row++) {
                    const t = Math.pow((row + scroll) / 7, 1.7);
                    const y = horizon + t * (h - horizon);
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(w, y);
                    ctx.stroke();
                }
                return;
            }

            if (resolvedId === 'theme_starlight' || resolvedId === 'theme_apollo') {
                const accent = resolvedId === 'theme_starlight' ? 'rgba(244, 114, 182,' : 'rgba(165, 180, 252,';
                this._particles.forEach((p, idx) => {
                    const alpha = 0.18 + 0.24 * (0.5 + 0.5 * Math.sin(phase * 1.8 + idx));
                    ctx.fillStyle = `${accent} ${alpha.toFixed(2)})`;
                    ctx.beginPath();
                    ctx.arc((p.x + phase * p.drift * 8 + w) % w, p.y % h, p.r * 0.75, 0, Math.PI * 2);
                    ctx.fill();
                });
                if (resolvedId === 'theme_apollo') {
                    ctx.strokeStyle = 'rgba(129, 140, 248, 0.16)';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.ellipse(w * 0.5, h * 0.48, w * 0.42, h * 0.22, -0.25, 0, Math.PI * 2);
                    ctx.stroke();
                }
                return;
            }

            if (resolvedId === 'theme_arcade') {
                this._particles.forEach((p, idx) => {
                    const y = ((p.y - phase * 18 * p.speed) % h + h) % h;
                    const s = Math.round(p.r * 2.2);
                    ctx.fillStyle = idx % 3 === 0 ? 'rgba(234, 179, 8, 0.24)' : (idx % 3 === 1 ? 'rgba(139, 92, 246, 0.22)' : 'rgba(239, 68, 68, 0.18)');
                    ctx.fillRect(Math.round(p.x % w), Math.round(y), s, s);
                });
                return;
            }

            if (resolvedId === 'theme_hyperfocus') {
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.12)';
                ctx.lineWidth = 1;
                const step = 48;
                for (let x = 0; x < w; x += step) {
                    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
                }
                for (let y = 0; y < h; y += step) {
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                }
                return;
            }

            if (resolvedId === 'theme_penguin' || resolvedId === 'theme_coffee' || resolvedId === 'theme_eduardo-gold') {
                const color = resolvedId === 'theme_penguin'
                    ? 'rgba(103, 232, 249, 0.22)'
                    : (resolvedId === 'theme_eduardo-gold' ? 'rgba(251, 191, 36, 0.20)' : 'rgba(217, 119, 6, 0.20)');
                this._particles.forEach((p, idx) => {
                    const y = ((p.y - phase * 12 * p.speed) % h + h) % h;
                    const x = (p.x + Math.cos(phase + idx) * 10 + w) % w;
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(x, y, p.r * 1.6, 0, Math.PI * 2);
                    ctx.fill();
                });
                return;
            }

            // Presets básicos o monocromáticos animados: orbes suaves flotantes
            const isMono = resolvedId.startsWith('mono_') || this.isMonochromeActive();
            const isDark = document.documentElement.classList.contains('dark');
            const orbColor = isMono
                ? (isDark ? 'rgba(226, 232, 240, 0.08)' : 'rgba(100, 116, 139, 0.10)')
                : (isDark ? 'rgba(129, 140, 248, 0.14)' : 'rgba(99, 102, 241, 0.12)');
            for (let i = 0; i < 4; i++) {
                const cx = w * (0.2 + 0.6 * ((i % 2) + 0.15 * Math.sin(phase + i)));
                const cy = h * (0.2 + 0.55 * (Math.floor(i / 2) + 0.15 * Math.cos(phase * 0.8 + i)));
                const rad = Math.min(w, h) * 0.30;
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
                g.addColorStop(0, orbColor);
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(cx, cy, rad, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        _renderCustomPhotoLayers(record) {
            const Storage = window.StorageModule;
            const focal = Storage?.getBackgroundFocalPoint?.() || { x: 50, y: 50 };
            const blur = Storage?.getBackgroundBlur?.() ?? 0;
            const scrim = Storage?.getBackgroundScrim?.() ?? 35;

            this.gradientEl.style.backgroundImage = '';
            this.photoEl.style.backgroundImage = `url("${record.dataUrl}")`;
            this.photoEl.style.backgroundSize = 'cover';
            this.photoEl.style.backgroundRepeat = 'no-repeat';
            this.photoEl.style.backgroundPosition = `${focal.x}% ${focal.y}%`;
            this.photoEl.style.filter = blur > 0 ? `blur(${blur}px)` : 'none';
            this.photoEl.style.transform = blur > 0 ? 'scale(1.06)' : 'none';
            this.photoEl.classList.remove('hidden');

            if (scrim !== 0) {
                const alpha = (Math.abs(scrim) / 100).toFixed(2);
                this.scrimEl.style.backgroundColor = scrim > 0
                    ? `rgba(2, 6, 23, ${alpha})`
                    : `rgba(255, 255, 255, ${alpha})`;
                this.scrimEl.classList.remove('hidden');
            } else {
                this.scrimEl.classList.add('hidden');
                this.scrimEl.style.backgroundColor = '';
            }

            this.canvas.classList.add('hidden');
            document.documentElement.setAttribute('data-bg-active', 'true');
            document.documentElement.setAttribute('data-bg-preset', 'custom_photo');
            this._syncAnimationState('custom_photo');
        }

        async applyBackground() {
            if (!this._ensureDOM()) return;
            const Storage = window.StorageModule;
            const isDark = document.documentElement.classList.contains('dark');
            const resolvedId = this.resolveEffectiveBackgroundId();

            if (resolvedId === 'custom_photo') {
                if (!this._forceFailIdbForTest && this._customPhotoLoaded && this._customPhotoRecord?.dataUrl) {
                    this._renderCustomPhotoLayers(this._customPhotoRecord);
                    return;
                }
                try {
                    const record = await this.loadCustomPhotoRecord();
                    if (!record || !record.dataUrl) {
                        throw new Error('La foto de fondo no está disponible en IndexedDB.');
                    }
                    this._renderCustomPhotoLayers(record);
                    return;
                } catch (err) {
                    console.warn('[Backgrounds] Fallback a predeterminado desde Mi foto:', err);
                    Storage?.setBackgroundPreset?.('default');
                    this._customPhotoRecord = null;
                    this.photoEl.classList.add('hidden');
                    this.photoEl.style.backgroundImage = '';
                    this.scrimEl.classList.add('hidden');
                    this.scrimEl.style.backgroundColor = '';
                    if (!this._missingPhotoNotified) {
                        this._missingPhotoNotified = true;
                        window.OrganizadorApp?.showToast?.('La foto de fondo no estaba disponible; se restauró el fondo predeterminado.', 'info');
                    }
                    // Recalcular ya sin custom_photo
                    return this.applyBackground();
                }
            }

            this.photoEl.classList.add('hidden');
            this.photoEl.style.backgroundImage = '';
            this.scrimEl.classList.add('hidden');
            this.scrimEl.style.backgroundColor = '';
            this.gradientEl.style.backgroundImage = '';

            const basicMatch = BASIC_PRESETS.find(b => b.id === resolvedId);
            const monoMatch = MONO_PRESETS.find(m => m.id === resolvedId);
            const thematicMatch = THEMATIC_PRESETS.find(t => t.id === resolvedId);

            const isThemedOrStyled = Boolean((basicMatch && basicMatch.id !== 'default') || monoMatch || thematicMatch);

            if (thematicMatch) {
                this.gradientEl.style.backgroundImage = thematicMatch.gradient;
                this._resizeCanvas();
                this.canvas.classList.remove('hidden');
                this._drawFrame(resolvedId, this._phase);
            } else if (monoMatch) {
                this.gradientEl.style.backgroundImage = isDark ? monoMatch.darkGradient : monoMatch.lightGradient;
                if (this._canAnimateNow().ok) {
                    this._resizeCanvas();
                    this.canvas.classList.remove('hidden');
                    this._drawFrame(resolvedId, this._phase);
                } else {
                    this.canvas.classList.add('hidden');
                }
            } else if (basicMatch && basicMatch.id !== 'default') {
                this.gradientEl.style.backgroundImage = isDark ? basicMatch.darkGradient : basicMatch.lightGradient;
                if (this._canAnimateNow().ok) {
                    this._resizeCanvas();
                    this.canvas.classList.remove('hidden');
                    this._drawFrame(resolvedId, this._phase);
                } else {
                    this.canvas.classList.add('hidden');
                }
            } else {
                // 'default' -> mantiene el fondo ambiental base CSS de Etapa 1
                if (this._canAnimateNow().ok) {
                    this._resizeCanvas();
                    this.canvas.classList.remove('hidden');
                    this._drawFrame('default', this._phase);
                } else {
                    this.canvas.classList.add('hidden');
                }
            }

            document.documentElement.setAttribute('data-bg-active', isThemedOrStyled ? 'true' : 'false');
            document.documentElement.setAttribute('data-bg-preset', resolvedId);
            this._syncAnimationState(resolvedId);
        }

        // =====================================================
        // Interfaz en Configuraciones > Fondo
        // =====================================================
        renderSettingsUI() {
            const Storage = window.StorageModule;
            if (!Storage) return;

            const rawPreset = Storage.getBackgroundPreset();
            const effectiveId = this.resolveEffectiveBackgroundId();
            const isMono = this.isMonochromeActive();
            const unlockedThemes = this.getUnlockedThematicPresets();

            // Pill de estado en cabecera del acordeón
            const pill = document.getElementById('settings-bg-pill');
            if (pill) {
                let label = 'Predeterminado';
                if (rawPreset === 'custom_photo' && effectiveId === 'custom_photo') label = 'Mi foto';
                else if (rawPreset === 'vault_auto' && unlockedThemes.length > 0) label = 'Automático (tema)';
                else {
                    const visiblePool = [...BASIC_PRESETS, ...MONO_PRESETS, ...unlockedThemes];
                    const found = visiblePool.find(p => p.id === rawPreset);
                    if (found) label = found.name;
                }
                pill.textContent = label;
            }

            // Grid básico
            const basicGrid = document.getElementById('settings-bg-basic-grid');
            if (basicGrid) {
                basicGrid.innerHTML = BASIC_PRESETS.map(p => {
                    const isSelected = rawPreset === p.id;
                    const disabled = isMono && p.id !== 'default';
                    return `
                        <button type="button" data-bg-preset="${p.id}" ${disabled ? 'disabled aria-disabled="true"' : ''}
                            aria-pressed="${isSelected ? 'true' : 'false'}"
                            class="bg-preset-card touch-target-44 min-h-[44px] tap-effect p-2 rounded-2xl border text-left transition-all flex flex-col gap-1.5 min-w-0 ${isSelected ? 'bg-preset-active border-indigo-600 ring-2 ring-indigo-500/25' : 'border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-indigo-400'}">
                            <span class="w-full h-11 rounded-xl border border-black/10 dark:border-white/15 block shrink-0" style="background: ${p.thumbBg}"></span>
                            <span class="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate w-full block">${p.name}</span>
                        </button>`;
                }).join('');
                basicGrid.querySelectorAll('[data-bg-preset]').forEach(btn => {
                    btn.onclick = () => {
                        if (btn.disabled) return;
                        window.HapticsModule?.light?.();
                        Storage.setBackgroundPreset(btn.getAttribute('data-bg-preset'));
                        this.applyBackground();
                        this.renderSettingsUI();
                    };
                });
            }

            // Grid monocromático (escala de grises)
            const monoGrid = document.getElementById('settings-bg-mono-grid');
            if (monoGrid) {
                monoGrid.innerHTML = MONO_PRESETS.map(p => {
                    const isSelected = rawPreset === p.id;
                    return `
                        <button type="button" data-bg-preset="${p.id}"
                            aria-pressed="${isSelected ? 'true' : 'false'}"
                            class="bg-preset-card touch-target-44 min-h-[44px] tap-effect p-2 rounded-2xl border text-left transition-all flex flex-col gap-1.5 min-w-0 ${isSelected ? 'bg-preset-active border-slate-600 ring-2 ring-slate-500/30' : 'border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:border-slate-400'}">
                            <span class="w-full h-10 rounded-xl border border-black/10 dark:border-white/15 block shrink-0" style="background: ${p.thumbBg}"></span>
                            <span class="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate w-full block">${p.name}</span>
                        </button>`;
                }).join('');
                monoGrid.querySelectorAll('[data-bg-preset]').forEach(btn => {
                    btn.onclick = () => {
                        window.HapticsModule?.light?.();
                        Storage.setBackgroundPreset(btn.getAttribute('data-bg-preset'));
                        this.applyBackground();
                        this.renderSettingsUI();
                    };
                });
            }

            // Sección Experimental (solo existe en DOM cuando hay temas de Bóveda desbloqueados)
            const expSection = document.getElementById('settings-bg-experimental-section');
            if (expSection) {
                if (unlockedThemes.length === 0) {
                    expSection.innerHTML = '';
                    expSection.classList.add('hidden');
                } else {
                    expSection.classList.remove('hidden');
                    const isAutoSelected = rawPreset === 'vault_auto';
                    const autoBtn = `
                        <button type="button" data-bg-preset="vault_auto" data-bg-default-experimental="true" ${isMono ? 'disabled aria-disabled="true"' : ''}
                            aria-pressed="${isAutoSelected ? 'true' : 'false'}"
                            class="bg-preset-card col-span-full touch-target-44 min-h-[44px] tap-effect p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 min-w-0 ${isAutoSelected ? 'bg-preset-active border-indigo-600 ring-2 ring-indigo-500/25 bg-indigo-50/70 dark:bg-indigo-950/40' : 'border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80'} ${isMono ? 'opacity-40 cursor-not-allowed' : ''}">
                            <div class="min-w-0">
                                <span class="text-xs font-extrabold text-slate-900 dark:text-white block truncate">✨ Automático (según tema)</span>
                                <span class="text-[11px] text-slate-500 dark:text-slate-400 block truncate">Sigue automáticamente al tema de la Bóveda activo.</span>
                            </div>
                            <span class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">Por defecto</span>
                        </button>`;

                    const manualCards = unlockedThemes.map(t => {
                        const isSelected = rawPreset === t.id;
                        return `
                            <button type="button" data-bg-preset="${t.id}" ${isMono ? 'disabled aria-disabled="true"' : ''}
                                aria-pressed="${isSelected ? 'true' : 'false'}"
                                class="bg-preset-card touch-target-44 min-h-[44px] tap-effect p-2 rounded-2xl border text-left transition-all flex flex-col gap-1.5 min-w-0 ${isSelected ? 'bg-preset-active border-indigo-600 ring-2 ring-indigo-500/25' : 'border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80'} ${isMono ? 'opacity-40 cursor-not-allowed' : 'hover:border-indigo-400'}">
                                <span class="w-full h-10 rounded-xl border border-white/15 flex items-center justify-center text-base shrink-0" style="background: ${t.thumbBg}">${t.icon}</span>
                                <span class="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate w-full block">${t.name}</span>
                            </button>`;
                    }).join('');

                    expSection.innerHTML = `
                        <div class="flex items-center justify-between gap-2 mb-2">
                            <p class="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Fondos temáticos de Bóveda</p>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">Experimental</span>
                        </div>
                        <div id="settings-bg-experimental-grid" class="grid grid-cols-2 sm:grid-cols-3 gap-2">${autoBtn}${manualCards}</div>`;

                    expSection.querySelectorAll('[data-bg-preset]').forEach(btn => {
                        btn.onclick = () => {
                            if (btn.disabled) return;
                            window.HapticsModule?.light?.();
                            Storage.setBackgroundPreset(btn.getAttribute('data-bg-preset'));
                            this.applyBackground();
                            this.renderSettingsUI();
                        };
                    });
                }
            }

            // Controles "Mi foto"
            const hasPhoto = Boolean(this._customPhotoRecord && this._customPhotoRecord.dataUrl);
            const uploadBtn = document.getElementById('settings-bg-photo-upload-btn');
            const usePhotoBtn = document.getElementById('settings-bg-photo-use-btn');
            const adjustPhotoBtn = document.getElementById('settings-bg-photo-adjust-btn');
            const clearPhotoBtn = document.getElementById('settings-bg-photo-clear-btn');
            const customControls = document.getElementById('settings-bg-custom-controls');
            const focalPreview = document.getElementById('settings-bg-focal-preview');
            const focalDot = document.getElementById('settings-bg-focal-dot');

            if (uploadBtn) {
                uploadBtn.disabled = isMono;
                uploadBtn.classList.toggle('opacity-40', isMono);
                uploadBtn.classList.toggle('cursor-not-allowed', isMono);
                const span = uploadBtn.querySelector('span');
                if (span) span.textContent = hasPhoto ? 'Cambiar foto' : 'Subir mi foto';
            }
            if (usePhotoBtn) {
                usePhotoBtn.classList.toggle('hidden', !hasPhoto || isMono);
                usePhotoBtn.setAttribute('aria-pressed', rawPreset === 'custom_photo' ? 'true' : 'false');
            }
            if (adjustPhotoBtn) adjustPhotoBtn.classList.toggle('hidden', !hasPhoto || isMono);
            if (clearPhotoBtn) clearPhotoBtn.classList.toggle('hidden', !hasPhoto);
            if (customControls) customControls.classList.toggle('hidden', !hasPhoto || isMono);

            const focal = Storage.getBackgroundFocalPoint();
            const blur = Storage.getBackgroundBlur();
            const scrim = Storage.getBackgroundScrim();

            if (focalPreview && hasPhoto) {
                focalPreview.style.backgroundImage = `url("${this._customPhotoRecord.dataUrl}")`;
                focalPreview.style.backgroundSize = 'cover';
                focalPreview.style.backgroundPosition = `${focal.x}% ${focal.y}%`;
            }
            if (focalDot) {
                focalDot.style.left = `${focal.x}%`;
                focalDot.style.top = `${focal.y}%`;
            }

            const blurRange = document.getElementById('settings-bg-blur-range');
            const blurVal = document.getElementById('settings-bg-blur-val');
            if (blurRange) blurRange.value = String(blur);
            if (blurVal) blurVal.textContent = `${blur} px`;

            const scrimRange = document.getElementById('settings-bg-scrim-range');
            const scrimVal = document.getElementById('settings-bg-scrim-val');
            if (scrimRange) scrimRange.value = String(scrim);
            if (scrimVal) {
                scrimVal.textContent = scrim > 0
                    ? `Oscurecer ${scrim}%`
                    : (scrim < 0 ? `Aclarar ${Math.abs(scrim)}%` : 'Neutro 0%');
            }

            const focalXInput = document.getElementById('settings-bg-focal-x');
            const focalYInput = document.getElementById('settings-bg-focal-y');
            const focalLabel = document.getElementById('settings-bg-focal-label');
            if (focalXInput) focalXInput.value = String(Math.round(focal.x));
            if (focalYInput) focalYInput.value = String(Math.round(focal.y));
            if (focalLabel) focalLabel.textContent = `${Math.round(focal.x)}% · ${Math.round(focal.y)}%`;

            const animToggle = document.getElementById('settings-bg-animate-toggle');
            if (animToggle) animToggle.checked = Storage.getBackgroundAnimated();

            const noticeEl = document.getElementById('settings-bg-perf-notice');
            if (noticeEl) {
                if (this.degradedReason) {
                    noticeEl.textContent = this.degradedReason;
                    noticeEl.classList.remove('hidden');
                } else {
                    noticeEl.classList.add('hidden');
                }
            }
        }

        bindSettingsUI() {
            const Storage = window.StorageModule;
            if (!Storage) return;

            const fileInput = document.getElementById('settings-bg-photo-input');
            const uploadBtn = document.getElementById('settings-bg-photo-upload-btn');
            const usePhotoBtn = document.getElementById('settings-bg-photo-use-btn');
            const adjustBtn = document.getElementById('settings-bg-photo-adjust-btn');
            const clearBtn = document.getElementById('settings-bg-photo-clear-btn');
            const blurRange = document.getElementById('settings-bg-blur-range');
            const scrimRange = document.getElementById('settings-bg-scrim-range');
            const focalX = document.getElementById('settings-bg-focal-x');
            const focalY = document.getElementById('settings-bg-focal-y');
            const focalPreview = document.getElementById('settings-bg-focal-preview');
            const animToggle = document.getElementById('settings-bg-animate-toggle');

            if (uploadBtn && fileInput) {
                uploadBtn.onclick = () => {
                    if (uploadBtn.disabled) return;
                    window.HapticsModule?.light?.();
                    fileInput.click();
                };
            }

            if (fileInput) {
                fileInput.onchange = async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await this.handleCustomPhotoUpload({ file });
                    fileInput.value = '';
                };
            }

            if (usePhotoBtn) {
                usePhotoBtn.onclick = () => {
                    if (this.isMonochromeActive()) return;
                    Storage.setBackgroundPreset('custom_photo');
                    this.applyBackground();
                    this.renderSettingsUI();
                };
            }

            if (adjustBtn) {
                adjustBtn.onclick = async () => {
                    const rec = await this.loadCustomPhotoRecord().catch(() => null);
                    if (!rec?.dataUrl) {
                        window.OrganizadorApp?.showToast?.('Primero sube una foto de fondo.', 'info');
                        return;
                    }
                    await this.handleCustomPhotoUpload({ src: rec.dataUrl, adjustOnly: true });
                };
            }

            if (clearBtn) {
                clearBtn.onclick = async () => {
                    window.HapticsModule?.light?.();
                    await this.clearCustomPhoto();
                    window.OrganizadorApp?.showToast?.('Foto de fondo eliminada.', 'info');
                };
            }

            if (blurRange) {
                blurRange.oninput = (e) => {
                    const val = Storage.setBackgroundBlur(Number(e.target.value));
                    const lbl = document.getElementById('settings-bg-blur-val');
                    if (lbl) lbl.textContent = `${val} px`;
                    if (this.photoEl && !this.photoEl.classList.contains('hidden')) {
                        this.photoEl.style.filter = val > 0 ? `blur(${val}px)` : 'none';
                        this.photoEl.style.transform = val > 0 ? 'scale(1.06)' : 'none';
                    }
                    this.applyBackground();
                };
            }

            if (scrimRange) {
                scrimRange.oninput = (e) => {
                    const val = Storage.setBackgroundScrim(Number(e.target.value));
                    const lbl = document.getElementById('settings-bg-scrim-val');
                    if (lbl) {
                        lbl.textContent = val > 0 ? `Oscurecer ${val}%` : (val < 0 ? `Aclarar ${Math.abs(val)}%` : 'Neutro 0%');
                    }
                    if (this.scrimEl && Storage.getBackgroundPreset() === 'custom_photo') {
                        if (val === 0) {
                            this.scrimEl.classList.add('hidden');
                            this.scrimEl.style.backgroundColor = '';
                        } else {
                            const alpha = (Math.abs(val) / 100).toFixed(2);
                            this.scrimEl.style.backgroundColor = val > 0
                                ? `rgba(2, 6, 23, ${alpha})`
                                : `rgba(255, 255, 255, ${alpha})`;
                            this.scrimEl.classList.remove('hidden');
                        }
                    }
                    this.applyBackground();
                };
            }

            const updateFocalFromInputs = () => {
                const x = focalX ? Number(focalX.value) : 50;
                const y = focalY ? Number(focalY.value) : 50;
                const saved = Storage.setBackgroundFocalPoint({ x, y });
                const lbl = document.getElementById('settings-bg-focal-label');
                const dot = document.getElementById('settings-bg-focal-dot');
                if (lbl) lbl.textContent = `${Math.round(saved.x)}% · ${Math.round(saved.y)}%`;
                if (dot) { dot.style.left = `${saved.x}%`; dot.style.top = `${saved.y}%`; }
                if (focalPreview) focalPreview.style.backgroundPosition = `${saved.x}% ${saved.y}%`;
                if (this.photoEl && !this.photoEl.classList.contains('hidden')) {
                    this.photoEl.style.backgroundPosition = `${saved.x}% ${saved.y}%`;
                }
                this.applyBackground();
            };

            if (focalX) focalX.oninput = updateFocalFromInputs;
            if (focalY) focalY.oninput = updateFocalFromInputs;

            if (focalPreview) {
                const setFromPointer = (ev) => {
                    const rect = focalPreview.getBoundingClientRect();
                    if (!rect.width || !rect.height) return;
                    const x = Math.round(((ev.clientX - rect.left) / rect.width) * 100);
                    const y = Math.round(((ev.clientY - rect.top) / rect.height) * 100);
                    const saved = Storage.setBackgroundFocalPoint({ x, y });
                    if (focalX) focalX.value = String(Math.round(saved.x));
                    if (focalY) focalY.value = String(Math.round(saved.y));
                    updateFocalFromInputs();
                };
                focalPreview.onclick = setFromPointer;
            }

            if (animToggle) {
                animToggle.onchange = (e) => {
                    const next = Boolean(e.target.checked);
                    this.isDegraded = false;
                    this.degradedReason = '';
                    Storage.setBackgroundAnimated(next);
                    window.HapticsModule?.light?.();
                    this.applyBackground();
                    this.renderSettingsUI();
                };
            }

            this.renderSettingsUI();
        }

        async init() {
            if (this.initialized) return;
            this.initialized = true;
            this._ensureDOM();

            this._motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') || null;
            this._motionQuery?.addEventListener?.('change', this._boundMotionHandler);
            document.addEventListener('visibilitychange', this._boundVisibilityHandler);
            window.addEventListener('resize', this._boundResizeHandler);

            await this.applyBackground();
            this.bindSettingsUI();
        }
    }

    window.BackgroundsModule = new BackgroundsManager();
})();
