/**
 * photo-editor.js - Editor reutilizable de recorte, zoom, giro y reencuadre
 * Soporta perfil circular (512x512 JPEG) y reutilización parametrizable (aspectRatio / maxDim).
 */
(() => {
    'use strict';

    const DEFAULT_OPTS = {
        aspectRatio: 1,
        shape: 'circle', // 'circle' | 'rect'
        outputWidth: 512,
        outputHeight: 512,
        maxDim: null, // Si se especifica > 0, limita dimensión máx proporcionalmente en export
        mimeType: 'image/jpeg',
        quality: 0.88,
        title: 'Ajustar foto de perfil',
        subtitle: 'Arrastra para mover y pellizca o usa el deslizador para hacer zoom.',
        confirmLabel: 'Guardar foto'
    };

    const MIN_ZOOM = 1;
    const MAX_ZOOM = 4;

    class PhotoEditor {
        constructor() {
            this.isOpen = false;
            this.img = null;
            this.options = { ...DEFAULT_OPTS };
            this.state = {
                zoom: 1,
                rotation: 0, // 0, 90, 180, 270
                offsetX: 0,
                offsetY: 0
            };
            this.viewport = { width: 280, height: 280, cropW: 224, cropH: 224 };
            this.baseScale = 1;
            this.activePointers = new Map();
            this.lastPinch = null;
            this.isInteracting = false;
            this._gridHideTimer = null;
            this._pendingResolve = null;
            this._initializedDOM = false;
            this._boundKeyHandler = (e) => this._onKeyDown(e);
            this._boundResizeHandler = () => {
                if (this.isOpen) {
                    this._measureViewport();
                    this._clampState();
                    this._render();
                }
            };
        }

        _ensureDOM() {
            if (this._initializedDOM) return true;
            this.modal = document.getElementById('photo-editor-modal');
            if (!this.modal) return false;

            this.backdrop = document.getElementById('photo-editor-backdrop');
            this.dialog = this.modal.querySelector('.modal-dialog');
            this.titleEl = document.getElementById('photo-editor-title');
            this.subtitleEl = document.getElementById('photo-editor-subtitle');
            this.canvasWrap = document.getElementById('photo-editor-canvas-wrap');
            this.canvas = document.getElementById('photo-editor-canvas');
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
            this.zoomSlider = document.getElementById('photo-editor-zoom');
            this.zoomValueEl = document.getElementById('photo-editor-zoom-value');
            this.rotateBtn = document.getElementById('photo-editor-rotate-btn');
            this.resetBtn = document.getElementById('photo-editor-reset-btn');
            this.cancelBtn = document.getElementById('photo-editor-cancel-btn');
            this.saveBtn = document.getElementById('photo-editor-save-btn');
            this.hintEl = document.getElementById('photo-editor-meta-hint');

            this._bindEvents();
            this._initializedDOM = true;
            return true;
        }

        _bindEvents() {
            if (this.backdrop) {
                this.backdrop.addEventListener('click', () => this.cancel());
            }
            if (this.cancelBtn) {
                this.cancelBtn.addEventListener('click', () => this.cancel());
            }
            if (this.saveBtn) {
                this.saveBtn.addEventListener('click', () => this.save());
            }
            if (this.rotateBtn) {
                this.rotateBtn.addEventListener('click', () => {
                    window.HapticsModule?.light?.();
                    this.rotate90();
                });
            }
            if (this.resetBtn) {
                this.resetBtn.addEventListener('click', () => {
                    window.HapticsModule?.light?.();
                    this.reset();
                });
            }
            if (this.zoomSlider) {
                this.zoomSlider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    if (!Number.isNaN(val)) {
                        this._pulseGrid();
                        this.setZoom(val);
                    }
                });
            }

            if (this.canvas) {
                this.canvas.addEventListener('pointerdown', (e) => this._onPointerDown(e));
                this.canvas.addEventListener('pointermove', (e) => this._onPointerMove(e));
                this.canvas.addEventListener('pointerup', (e) => this._onPointerUp(e));
                this.canvas.addEventListener('pointercancel', (e) => this._onPointerUp(e));
                this.canvas.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
            }
        }

        _pulseGrid() {
            this.isInteracting = true;
            if (this._gridHideTimer) clearTimeout(this._gridHideTimer);
            this._gridHideTimer = setTimeout(() => {
                if (this.activePointers.size === 0) {
                    this.isInteracting = false;
                    this._render();
                }
            }, 350);
        }

        _canvasCoords(clientX, clientY) {
            const rect = this.canvas.getBoundingClientRect();
            const safeW = rect.width || this.viewport.width;
            const safeH = rect.height || this.viewport.height;
            return {
                x: ((clientX - rect.left) / safeW) * this.viewport.width,
                y: ((clientY - rect.top) / safeH) * this.viewport.height
            };
        }

        _onPointerDown(e) {
            if (!this.isOpen || !this.img) return;
            if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
            e.preventDefault();
            try {
                this.canvas.setPointerCapture?.(e.pointerId);
            } catch (_) {}
            this.canvas.focus?.({ preventScroll: true });

            const pt = this._canvasCoords(e.clientX, e.clientY);
            this.activePointers.set(e.pointerId, pt);
            this.isInteracting = true;
            if (this._gridHideTimer) clearTimeout(this._gridHideTimer);

            if (this.activePointers.size === 2) {
                const pts = Array.from(this.activePointers.values());
                this.lastPinch = {
                    dist: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1,
                    midX: (pts[0].x + pts[1].x) / 2,
                    midY: (pts[0].y + pts[1].y) / 2
                };
            } else {
                this.lastPinch = null;
            }
            this._render();
        }

        _onPointerMove(e) {
            if (!this.isOpen || !this.img || !this.activePointers.has(e.pointerId)) return;
            e.preventDefault();
            const prev = this.activePointers.get(e.pointerId);
            const next = this._canvasCoords(e.clientX, e.clientY);
            this.activePointers.set(e.pointerId, next);

            if (this.activePointers.size >= 2) {
                const pts = Array.from(this.activePointers.values());
                const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1;
                const midX = (pts[0].x + pts[1].x) / 2;
                const midY = (pts[0].y + pts[1].y) / 2;
                if (this.lastPinch) {
                    const factor = dist / Math.max(1, this.lastPinch.dist);
                    const panDx = midX - this.lastPinch.midX;
                    const panDy = midY - this.lastPinch.midY;
                    this.state.offsetX += panDx;
                    this.state.offsetY += panDy;
                    this._zoomAroundCanvasPoint(this.state.zoom * factor, midX, midY);
                }
                this.lastPinch = { dist, midX, midY };
            } else {
                const dx = next.x - prev.x;
                const dy = next.y - prev.y;
                this.panBy(dx, dy);
            }
        }

        _onPointerUp(e) {
            if (this.activePointers.has(e.pointerId)) {
                this.activePointers.delete(e.pointerId);
            }
            try {
                if (this.canvas?.hasPointerCapture?.(e.pointerId)) {
                    this.canvas.releasePointerCapture(e.pointerId);
                }
            } catch (_) {}

            if (this.activePointers.size < 2) {
                this.lastPinch = null;
            }
            if (this.activePointers.size === 0) {
                this.isInteracting = false;
                this._render();
            }
        }

        _onWheel(e) {
            if (!this.isOpen || !this.img) return;
            e.preventDefault();
            this._pulseGrid();
            const pt = this._canvasCoords(e.clientX, e.clientY);
            const factor = e.deltaY < 0 ? 1.09 : 0.91;
            this._zoomAroundCanvasPoint(this.state.zoom * factor, pt.x, pt.y);
        }

        _onKeyDown(e) {
            if (!this.isOpen) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                this.cancel();
                return;
            }
            // No capturar teclas de texto si un slider no usa flechas horizontales o si otro input está activo
            const active = document.activeElement;
            const onSlider = active === this.zoomSlider;

            const step = e.shiftKey ? 26 : 12;
            if (!onSlider && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
                this._pulseGrid();
                if (e.key === 'ArrowLeft') this.panBy(-step, 0);
                if (e.key === 'ArrowRight') this.panBy(step, 0);
                if (e.key === 'ArrowUp') this.panBy(0, -step);
                if (e.key === 'ArrowDown') this.panBy(0, step);
                return;
            }
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                this._pulseGrid();
                this.setZoom(this.state.zoom + 0.15);
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                this._pulseGrid();
                this.setZoom(this.state.zoom - 0.15);
            } else if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.rotate90();
            } else if (e.key === '0' && !onSlider) {
                e.preventDefault();
                this.reset();
            }
        }

        _loadImageFromOptions(opts) {
            return new Promise((resolve, reject) => {
                const handleSrc = (src) => {
                    if (!src || typeof src !== 'string') {
                        reject(new Error('Imagen no válida.'));
                        return;
                    }
                    const img = new Image();
                    img.onload = () => {
                        if (!img.naturalWidth || !img.naturalHeight) {
                            reject(new Error('Imagen vacía o dañada.'));
                            return;
                        }
                        resolve(img);
                    };
                    img.onerror = () => reject(new Error('Archivo de imagen no válido o dañado.'));
                    img.src = src;
                };

                if (opts.src) {
                    handleSrc(opts.src);
                    return;
                }

                const file = opts.file;
                if (!file || (!String(file.type || '').startsWith('image/') && !String(file.name || '').match(/\.(png|jpe?g|webp|gif|bmp)$/i))) {
                    reject(new Error('Solo se admiten archivos de imagen válidos.'));
                    return;
                }

                const reader = new FileReader();
                reader.onerror = () => reject(new Error('Error al leer el archivo seleccionado.'));
                reader.onload = (ev) => handleSrc(ev.target?.result);
                reader.readAsDataURL(file);
            });
        }

        _measureViewport() {
            if (!this.canvasWrap || !this.canvas) return;
            const container = this.canvasWrap.parentElement || this.canvasWrap;
            const cs = window.getComputedStyle(container);
            const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
            const containerRect = container.getBoundingClientRect();
            const rawAvail = Math.floor((containerRect.width || container.clientWidth || 0) - padX - 4);
            const fallbackW = window.innerWidth <= 400 ? 260 : 300;
            const availW = Math.max(220, Math.min(340, rawAvail > 100 ? rawAvail : fallbackW));
            const ar = Number(this.options.aspectRatio) > 0 ? Number(this.options.aspectRatio) : 1;

            let vpW = availW;
            let vpH = availW;
            if (ar < 1) {
                vpH = Math.min(340, Math.round(availW / Math.max(0.45, ar * 0.85)));
            } else if (ar > 1) {
                vpH = Math.max(200, Math.round(availW / Math.min(1.8, ar)));
            }

            // Encajar marco de recorte dentro del lienzo con margen visual limpio
            const maxCropW = vpW - 36;
            const maxCropH = vpH - 36;
            let cropW = maxCropW;
            let cropH = cropW / ar;
            if (cropH > maxCropH) {
                cropH = maxCropH;
                cropW = cropH * ar;
            }

            this.viewport = {
                width: vpW,
                height: vpH,
                cropW: Math.round(cropW),
                cropH: Math.round(cropH)
            };

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = Math.round(vpW * dpr);
            this.canvas.height = Math.round(vpH * dpr);
            this.canvas.style.width = `${vpW}px`;
            this.canvas.style.height = `${vpH}px`;
        }

        _getRotatedDimensions() {
            if (!this.img) return { rotW: 1, rotH: 1 };
            const iw = this.img.naturalWidth || this.img.width || 1;
            const ih = this.img.naturalHeight || this.img.height || 1;
            const rotated = (this.state.rotation % 180) !== 0;
            return {
                iw,
                ih,
                rotW: rotated ? ih : iw,
                rotH: rotated ? iw : ih
            };
        }

        _computeMetrics() {
            const { rotW, rotH } = this._getRotatedDimensions();
            const { cropW, cropH } = this.viewport;
            // Cover estricto: la dimensión menor respecto al marco manda para garantizar CERO huecos vacíos
            const baseScale = Math.max(cropW / rotW, cropH / rotH);
            this.baseScale = baseScale;
            const totalScale = baseScale * this.state.zoom;
            const drawnW = rotW * totalScale;
            const drawnH = rotH * totalScale;
            const maxOffsetX = Math.max(0, (drawnW - cropW) / 2);
            const maxOffsetY = Math.max(0, (drawnH - cropH) / 2);
            return { baseScale, totalScale, drawnW, drawnH, maxOffsetX, maxOffsetY };
        }

        _clampState() {
            this.state.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(this.state.zoom) || MIN_ZOOM));
            const { maxOffsetX, maxOffsetY } = this._computeMetrics();
            this.state.offsetX = Math.min(maxOffsetX, Math.max(-maxOffsetX, Number(this.state.offsetX) || 0));
            this.state.offsetY = Math.min(maxOffsetY, Math.max(-maxOffsetY, Number(this.state.offsetY) || 0));
            this._syncSliderUI();
        }

        _syncSliderUI() {
            if (this.zoomSlider) {
                this.zoomSlider.value = String(this.state.zoom.toFixed(2));
            }
            if (this.zoomValueEl) {
                this.zoomValueEl.textContent = `${Math.round(this.state.zoom * 100)}%`;
            }
        }

        _zoomAroundCanvasPoint(nextZoom, canvasX, canvasY) {
            const oldZoom = this.state.zoom;
            const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
            if (Math.abs(clampedZoom - oldZoom) < 0.0005) {
                this._clampState();
                this._render();
                return;
            }
            const vpCx = this.viewport.width / 2;
            const vpCy = this.viewport.height / 2;
            const fx = canvasX - vpCx;
            const fy = canvasY - vpCy;
            const k = clampedZoom / oldZoom;
            this.state.offsetX = fx - (fx - this.state.offsetX) * k;
            this.state.offsetY = fy - (fy - this.state.offsetY) * k;
            this.state.zoom = clampedZoom;
            this._clampState();
            this._render();
        }

        setZoom(nextZoom) {
            if (!this.img) return;
            this._zoomAroundCanvasPoint(nextZoom, this.viewport.width / 2, this.viewport.height / 2);
        }

        panBy(dx, dy) {
            if (!this.img) return;
            this.state.offsetX += Number(dx) || 0;
            this.state.offsetY += Number(dy) || 0;
            this._clampState();
            this._render();
        }

        rotate90() {
            if (!this.img) return;
            this.state.rotation = (this.state.rotation + 90) % 360;
            this._clampState();
            this._render();
        }

        reset() {
            this.state = {
                zoom: MIN_ZOOM,
                rotation: 0,
                offsetX: 0,
                offsetY: 0
            };
            this._clampState();
            this._render();
        }

        getState() {
            const metrics = this._computeMetrics();
            const focalX = metrics.maxOffsetX > 0.5
                ? Math.min(1, Math.max(0, 0.5 - this.state.offsetX / (2 * metrics.maxOffsetX)))
                : 0.5;
            const focalY = metrics.maxOffsetY > 0.5
                ? Math.min(1, Math.max(0, 0.5 - this.state.offsetY / (2 * metrics.maxOffsetY)))
                : 0.5;
            return {
                zoom: this.state.zoom,
                rotation: this.state.rotation,
                offsetX: this.state.offsetX,
                offsetY: this.state.offsetY,
                minZoom: MIN_ZOOM,
                maxZoom: MAX_ZOOM,
                baseScale: metrics.baseScale,
                totalScale: metrics.totalScale,
                drawnW: metrics.drawnW,
                drawnH: metrics.drawnH,
                cropW: this.viewport.cropW,
                cropH: this.viewport.cropH,
                maxOffsetX: metrics.maxOffsetX,
                maxOffsetY: metrics.maxOffsetY,
                focalPoint: { x: Number(focalX.toFixed(4)), y: Number(focalY.toFixed(4)) }
            };
        }

        _render() {
            if (!this.ctx || !this.img) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const { width: vpW, height: vpH, cropW, cropH } = this.viewport;
            const ctx = this.ctx;
            const { iw, ih } = this._getRotatedDimensions();
            const { totalScale } = this._computeMetrics();

            ctx.save();
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, vpW, vpH);

            // Fondo oscuro sutil neutro detrás del lienzo
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, vpW, vpH);

            const cx = vpW / 2;
            const cy = vpH / 2;
            const rad = (this.state.rotation * Math.PI) / 180;

            ctx.save();
            ctx.translate(cx + this.state.offsetX, cy + this.state.offsetY);
            ctx.rotate(rad);
            ctx.scale(totalScale, totalScale);
            ctx.drawImage(this.img, -iw / 2, -ih / 2, iw, ih);
            ctx.restore();

            // Máscara oscura exterior al marco de recorte
            const cropLeft = cx - cropW / 2;
            const cropTop = cy - cropH / 2;
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, vpW, vpH);
            if (this.options.shape === 'circle') {
                const radius = Math.min(cropW, cropH) / 2;
                ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
            } else {
                const r = 16;
                ctx.moveTo(cropLeft + r, cropTop);
                ctx.lineTo(cropLeft + cropW - r, cropTop);
                ctx.quadraticCurveTo(cropLeft + cropW, cropTop, cropLeft + cropW, cropTop + r);
                ctx.lineTo(cropLeft + cropW, cropTop + cropH - r);
                ctx.quadraticCurveTo(cropLeft + cropW, cropTop + cropH, cropLeft + cropW - r, cropTop + cropH);
                ctx.lineTo(cropLeft + r, cropTop + cropH);
                ctx.quadraticCurveTo(cropLeft, cropTop + cropH, cropLeft, cropTop + cropH - r);
                ctx.lineTo(cropLeft, cropTop + r);
                ctx.quadraticCurveTo(cropLeft, cropTop, cropLeft + r, cropTop);
                ctx.closePath();
            }
            ctx.fillStyle = 'rgba(2, 6, 23, 0.62)';
            ctx.fill('evenodd');
            ctx.restore();

            // Rejilla de tercios visible al arrastrar o ajustar zoom
            if (this.isInteracting) {
                ctx.save();
                ctx.beginPath();
                if (this.options.shape === 'circle') {
                    ctx.arc(cx, cy, Math.min(cropW, cropH) / 2, 0, Math.PI * 2);
                } else {
                    ctx.rect(cropLeft, cropTop, cropW, cropH);
                }
                ctx.clip();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.lineWidth = 1;
                for (let i = 1; i <= 2; i++) {
                    const gx = cropLeft + (cropW * i) / 3;
                    const gy = cropTop + (cropH * i) / 3;
                    ctx.beginPath();
                    ctx.moveTo(gx, cropTop);
                    ctx.lineTo(gx, cropTop + cropH);
                    ctx.moveTo(cropLeft, gy);
                    ctx.lineTo(cropLeft + cropW, gy);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Borde luminoso estilo Apple alrededor del marco de recorte
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (this.options.shape === 'circle') {
                ctx.arc(cx, cy, Math.min(cropW, cropH) / 2, 0, Math.PI * 2);
            } else {
                const r = 16;
                ctx.roundRect ? ctx.roundRect(cropLeft, cropTop, cropW, cropH, r) : ctx.rect(cropLeft, cropTop, cropW, cropH);
            }
            ctx.stroke();
            ctx.restore();

            ctx.restore();
        }

        exportDataUrl() {
            if (!this.img) return '';
            this._clampState();
            const { iw, ih, rotW, rotH } = this._getRotatedDimensions();
            const { totalScale } = this._computeMetrics();
            const { cropW, cropH } = this.viewport;

            let outW = Number(this.options.outputWidth) || 512;
            let outH = Number(this.options.outputHeight) || 512;

            // Modo proporcional opcional (ej. Etapa 3 "Mi foto" con maxDim = 1600 sin recorte rígido)
            const maxDim = Number(this.options.maxDim) || 0;
            if (maxDim > 0 && !this.options.forceFixedOutput) {
                const longest = Math.max(rotW, rotH);
                const scaleDown = longest > maxDim ? maxDim / longest : 1;
                outW = Math.max(1, Math.round(rotW * scaleDown));
                outH = Math.max(1, Math.round(rotH * scaleDown));
                const fullCanvas = document.createElement('canvas');
                fullCanvas.width = outW;
                fullCanvas.height = outH;
                const fCtx = fullCanvas.getContext('2d');
                fCtx.fillStyle = '#0f172a';
                fCtx.fillRect(0, 0, outW, outH);
                fCtx.save();
                fCtx.translate(outW / 2, outH / 2);
                fCtx.rotate((this.state.rotation * Math.PI) / 180);
                fCtx.scale(scaleDown, scaleDown);
                fCtx.drawImage(this.img, -iw / 2, -ih / 2, iw, ih);
                fCtx.restore();
                const mime = this.options.mimeType || 'image/jpeg';
                const q = typeof this.options.quality === 'number' ? this.options.quality : 0.88;
                return fullCanvas.toDataURL(mime, q);
            }

            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = outW;
            exportCanvas.height = outH;
            const eCtx = exportCanvas.getContext('2d');

            // Pre-relleno limpio por si la imagen origen es PNG con transparencia exportada a JPEG
            eCtx.fillStyle = '#ffffff';
            eCtx.fillRect(0, 0, outW, outH);

            const ratioX = outW / cropW;
            const ratioY = outH / cropH;
            const ratio = (ratioX + ratioY) / 2;
            const outScale = totalScale * ratio;

            eCtx.save();
            eCtx.translate(outW / 2 + this.state.offsetX * ratioX, outH / 2 + this.state.offsetY * ratioY);
            eCtx.rotate((this.state.rotation * Math.PI) / 180);
            eCtx.scale(outScale, outScale);
            eCtx.drawImage(this.img, -iw / 2, -ih / 2, iw, ih);
            eCtx.restore();

            const mime = this.options.mimeType || 'image/jpeg';
            const q = typeof this.options.quality === 'number' ? this.options.quality : 0.88;
            return exportCanvas.toDataURL(mime, q);
        }

        async open(options = {}) {
            if (!this._ensureDOM()) {
                throw new Error('No se encontró el modal #photo-editor-modal.');
            }

            // Si había una promesa pendiente anterior, cancelarla limpiamente
            if (this._pendingResolve) {
                this._pendingResolve(null);
                this._pendingResolve = null;
            }

            this.options = { ...DEFAULT_OPTS, ...options };
            if (!options.outputWidth && !options.outputHeight && this.options.aspectRatio && this.options.aspectRatio !== 1) {
                const ar = Number(this.options.aspectRatio);
                this.options.outputWidth = ar >= 1 ? 512 : Math.round(512 * ar);
                this.options.outputHeight = ar >= 1 ? Math.round(512 / ar) : 512;
            }

            let loadedImg;
            try {
                loadedImg = await this._loadImageFromOptions(this.options);
            } catch (err) {
                this.isOpen = false;
                window.OrganizadorApp?.showToast?.(err?.message || 'Imagen no válida.', 'warning');
                return null;
            }

            this.isOpen = true;
            this.img = loadedImg;
            this.state = { zoom: MIN_ZOOM, rotation: 0, offsetX: 0, offsetY: 0 };
            this.activePointers.clear();
            this.lastPinch = null;
            this.isInteracting = false;

            if (this.titleEl) this.titleEl.textContent = this.options.title || DEFAULT_OPTS.title;
            if (this.subtitleEl) this.subtitleEl.textContent = this.options.subtitle || DEFAULT_OPTS.subtitle;
            if (this.saveBtn) {
                const labelEl = this.saveBtn.querySelector('[data-save-label]') || this.saveBtn;
                labelEl.textContent = this.options.confirmLabel || DEFAULT_OPTS.confirmLabel;
            }
            if (this.hintEl) {
                if (this.options.maxDim) {
                    this.hintEl.textContent = `Máx. ${this.options.maxDim} px · Punto focal ajustable`;
                } else {
                    const qPct = Math.round((this.options.quality ?? 0.88) * 100);
                    this.hintEl.textContent = `Salida: ${this.options.outputWidth}×${this.options.outputHeight} px · JPEG ${qPct}%`;
                }
            }

            this.modal.style.display = '';
            if (this.dialog) {
                this.dialog.style.display = '';
                this.dialog.classList.remove('hidden');
            }
            if (this.backdrop) {
                this.backdrop.style.display = '';
                this.backdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
                this.backdrop.style.opacity = '';
            }
            this.modal.querySelectorAll('.modal-sheet-grabber, .modal-sheet-grabber-bar').forEach(el => {
                el.style.display = '';
                el.classList.remove('hidden');
            });
            this.modal.classList.remove('hidden');
            this.modal.classList.add('flex');
            this.modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('overflow-hidden');

            this._measureViewport();
            if (this.options.initialFocalPoint && typeof this.options.initialFocalPoint === 'object') {
                const rawFx = Number(this.options.initialFocalPoint.x);
                const rawFy = Number(this.options.initialFocalPoint.y);
                const fx = Number.isFinite(rawFx) ? (rawFx > 1 ? rawFx / 100 : rawFx) : 0.5;
                const fy = Number.isFinite(rawFy) ? (rawFy > 1 ? rawFy / 100 : rawFy) : 0.5;
                const metrics = this._computeMetrics();
                if (metrics.maxOffsetX > 0.5) {
                    this.state.offsetX = (0.5 - Math.min(1, Math.max(0, fx))) * 2 * metrics.maxOffsetX;
                }
                if (metrics.maxOffsetY > 0.5) {
                    this.state.offsetY = (0.5 - Math.min(1, Math.max(0, fy))) * 2 * metrics.maxOffsetY;
                }
            }
            this._clampState();
            this._render();

            document.addEventListener('keydown', this._boundKeyHandler);
            window.addEventListener('resize', this._boundResizeHandler);

            requestAnimationFrame(() => {
                this.modal.classList.add('active');
                this.canvas?.focus?.({ preventScroll: true });
            });

            return new Promise((resolve) => {
                this._pendingResolve = resolve;
            });
        }

        save() {
            if (!this.isOpen && !this._pendingResolve) return null;
            if (!this.img) {
                this.cancel();
                return null;
            }
            const originalSrc = this.img.src || '';
            const dataUrl = this.exportDataUrl();
            const stateSnapshot = this.getState();
            const result = {
                dataUrl,
                originalSrc,
                width: this.options.outputWidth,
                height: this.options.outputHeight,
                mimeType: this.options.mimeType,
                quality: this.options.quality,
                focalPoint: stateSnapshot.focalPoint,
                rotation: stateSnapshot.rotation,
                zoom: stateSnapshot.zoom
            };
            const onSaveCb = this.options.onSave;
            this._closeModal(result);
            if (typeof onSaveCb === 'function') {
                onSaveCb(result);
            }
            return result;
        }

        cancel() {
            const onCancelCb = this.options.onCancel;
            this._closeModal(null);
            if (typeof onCancelCb === 'function') {
                onCancelCb();
            }
        }

        _closeModal(result) {
            this.isOpen = false;
            this.activePointers.clear();
            this.lastPinch = null;
            this.isInteracting = false;
            if (this._gridHideTimer) {
                clearTimeout(this._gridHideTimer);
                this._gridHideTimer = null;
            }
            document.removeEventListener('keydown', this._boundKeyHandler);
            window.removeEventListener('resize', this._boundResizeHandler);

            if (this.modal) {
                this.modal.classList.remove('active');
                this.modal.setAttribute('aria-hidden', 'true');
                const hideDelay = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
                const targetModal = this.modal;
                const finishHide = () => {
                    if (this.isOpen) return;
                    targetModal.classList.add('hidden');
                    targetModal.classList.remove('flex');
                    const cycleModal = document.getElementById('cycle-setup-modal');
                    const cycleOpen = cycleModal && !cycleModal.classList.contains('hidden');
                    if (!cycleOpen) {
                        document.body.classList.remove('overflow-hidden');
                    }
                };
                if (hideDelay === 0) {
                    finishHide();
                } else {
                    setTimeout(finishHide, hideDelay);
                }
            }

            if (this._pendingResolve) {
                const resolve = this._pendingResolve;
                this._pendingResolve = null;
                resolve(result);
            }
        }
    }

    const instance = new PhotoEditor();
    // Mantener this.isOpen sincronizado en open()
    const origOpen = instance.open.bind(instance);
    instance.open = async (opts) => {
        instance.isOpen = true;
        const res = await origOpen(opts);
        if (res === null && instance.isOpen) {
            instance.isOpen = false;
        }
        return res;
    };

    window.PhotoEditorModule = instance;
})();
