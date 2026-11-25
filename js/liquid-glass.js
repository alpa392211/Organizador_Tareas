/**
 * liquid-glass.js - Motor de Cristal con Refracción SVG y Aberración Cromática Sutil (v1.5.8 - Fase 3)
 * - Genera mapas de desplazamiento convexos en <canvas> offscreen cacheados por tamaño.
 * - Aloja un único <svg id="lg-svg-filter-host"> de 0x0 con position:absolute (NUNCA display:none y sin nodos de texto).
 * - Conecta con html[data-glass-intensity]: suave (sin refracción), normal (refracción), intenso (refracción + aberración RGB).
 * - Se degrada en silencio a blur/saturate estándar si no hay soporte backdrop-filter: url(#...),
 *   si prefers-reduced-transparency está activo, o en dispositivos de gama baja (hardwareConcurrency <= 4 o deviceMemory <= 4).
 */
(() => {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const HOST_ID = 'lg-svg-filter-host';
    const MAX_CACHE_FILTERS = 28;

    const trackedElements = new Set();
    const elementStates = new WeakMap();
    const filterCache = new Map();
    const displacementUrlCache = new Map();

    let hostSvg = null;
    let hostDefs = null;
    let sharedResizeObserver = null;
    let transparencyMql = null;
    let cachedSupportsSvgBackdrop = null;
    let initialized = false;
    let filterSeq = 0;

    function getIntensity() {
        try {
            const attr = document.documentElement.getAttribute('data-glass-intensity');
            if (attr === 'suave' || attr === 'normal' || attr === 'intenso') return attr;
            const stored = window.StorageModule?.getGlassIntensity?.();
            if (stored === 'suave' || stored === 'normal' || stored === 'intenso') return stored;
        } catch (_) {}
        return 'normal';
    }

    function isReducedTransparency() {
        try {
            if (!window.matchMedia) return false;
            return Boolean(window.matchMedia('(prefers-reduced-transparency: reduce)').matches);
        } catch (_) {
            return false;
        }
    }

    function isLowEndDevice() {
        try {
            const cores = Number(navigator.hardwareConcurrency || 0);
            const mem = Number(navigator.deviceMemory || 0);
            if (cores > 0 && cores <= 4) return true;
            if (mem > 0 && mem <= 4) return true;
        } catch (_) {}
        return false;
    }

    function supportsSvgBackdropFilter() {
        if (cachedSupportsSvgBackdrop !== null) return cachedSupportsSvgBackdrop;
        try {
            if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
                const ok =
                    CSS.supports('backdrop-filter', 'url(#lg-probe) blur(4px)') ||
                    CSS.supports('-webkit-backdrop-filter', 'url(#lg-probe) blur(4px)');
                cachedSupportsSvgBackdrop = Boolean(ok);
                return cachedSupportsSvgBackdrop;
            }
        } catch (_) {}
        cachedSupportsSvgBackdrop = false;
        return false;
    }

    function canUseRefraction(intensity) {
        if (intensity === 'suave') return false;
        if (!supportsSvgBackdropFilter()) return false;
        if (isReducedTransparency()) return false;
        if (isLowEndDevice()) return false;
        return true;
    }

    function ensureSvgHost() {
        if (hostSvg && hostSvg.isConnected && hostDefs) return hostDefs;
        const existing = document.getElementById(HOST_ID);
        if (existing) {
            hostSvg = existing;
            hostDefs = existing.querySelector('defs') || existing.appendChild(document.createElementNS(SVG_NS, 'defs'));
            return hostDefs;
        }
        if (!document.body) return null;

        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('id', HOST_ID);
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;left:-9999px;top:0;visibility:hidden;';
        const defs = document.createElementNS(SVG_NS, 'defs');
        svg.appendChild(defs);
        document.body.appendChild(svg);
        hostSvg = svg;
        hostDefs = defs;
        return hostDefs;
    }

    function quantizeSize(w, h) {
        const bw = Math.max(36, Math.min(480, Math.round(w / 24) * 24 || 48));
        const bh = Math.max(24, Math.min(180, Math.round(h / 12) * 12 || 36));
        return { bw, bh };
    }

    function getDisplacementDataUrl(bw, bh, shape) {
        const key = `${bw}x${bh}_${shape || 'pill'}`;
        if (displacementUrlCache.has(key)) return displacementUrlCache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = bw;
        canvas.height = bh;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        const img = ctx.createImageData(bw, bh);
        const data = img.data;
        const halfW = bw / 2;
        const halfH = bh / 2;
        const bevel = Math.max(5, Math.min(halfW, halfH) * (shape === 'circle' ? 0.56 : 0.42));

        for (let y = 0; y < bh; y++) {
            for (let x = 0; x < bw; x++) {
                const idx = (y * bw + x) * 4;
                const nx = (x - halfW) / Math.max(1, halfW);
                const ny = (y - halfH) / Math.max(1, halfH);

                // Distancia desde el borde hacia el interior
                const dxEdge = Math.min(x, bw - 1 - x);
                const dyEdge = Math.min(y, bh - 1 - y);
                const edgeDist = Math.min(dxEdge, dyEdge);

                let sx = 0;
                let sy = 0;
                if (edgeDist < bevel) {
                    const t = 1 - edgeDist / bevel;
                    const curve = t * t * (3 - 2 * t);
                    sx = -nx * curve;
                    sy = -ny * curve;
                }

                data[idx] = Math.max(0, Math.min(255, Math.round(128 + sx * 120)));
                data[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + sy * 120)));
                data[idx + 2] = 128;
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(img, 0, 0);
        const url = canvas.toDataURL('image/png');
        if (displacementUrlCache.size > MAX_CACHE_FILTERS) {
            const firstKey = displacementUrlCache.keys().next().value;
            displacementUrlCache.delete(firstKey);
        }
        displacementUrlCache.set(key, url);
        return url;
    }

    function createSvgEl(tag, attrs = {}) {
        const node = document.createElementNS(SVG_NS, tag);
        Object.keys(attrs).forEach(k => node.setAttribute(k, String(attrs[k])));
        return node;
    }

    function getOrCreateFilter(bw, bh, shape, intensity) {
        const key = `${bw}x${bh}_${shape || 'pill'}_${intensity}`;
        if (filterCache.has(key)) {
            const existing = filterCache.get(key);
            if (existing.node && existing.node.isConnected) return existing.id;
            filterCache.delete(key);
        }

        const defs = ensureSvgHost();
        if (!defs) return null;

        const mapUrl = getDisplacementDataUrl(bw, bh, shape);
        if (!mapUrl) return null;

        if (filterCache.size >= MAX_CACHE_FILTERS) {
            const oldestKey = filterCache.keys().next().value;
            const oldest = filterCache.get(oldestKey);
            if (oldest?.node?.isConnected) oldest.node.remove();
            filterCache.delete(oldestKey);
        }

        filterSeq += 1;
        const filterId = `lg-flt-${filterSeq}`;
        const filter = createSvgEl('filter', {
            id: filterId,
            x: '-8%',
            y: '-8%',
            width: '116%',
            height: '116%',
            'color-interpolation-filters': 'sRGB'
        });

        filter.appendChild(createSvgEl('feImage', {
            href: mapUrl,
            result: 'lg_map',
            preserveAspectRatio: 'none',
            x: '0%',
            y: '0%',
            width: '100%',
            height: '100%'
        }));

        const baseScale = intensity === 'intenso' ? 16 : 11;

        if (intensity === 'intenso') {
            // 3 pasadas sutiles de aberración cromática aisladas por canal RGB y recombinadas con screen
            filter.appendChild(createSvgEl('feDisplacementMap', {
                in: 'SourceGraphic',
                in2: 'lg_map',
                scale: String(baseScale + 3),
                xChannelSelector: 'R',
                yChannelSelector: 'G',
                result: 'disp_r'
            }));
            filter.appendChild(createSvgEl('feColorMatrix', {
                in: 'disp_r',
                type: 'matrix',
                values: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
                result: 'chan_r'
            }));

            filter.appendChild(createSvgEl('feDisplacementMap', {
                in: 'SourceGraphic',
                in2: 'lg_map',
                scale: String(baseScale),
                xChannelSelector: 'R',
                yChannelSelector: 'G',
                result: 'disp_g'
            }));
            filter.appendChild(createSvgEl('feColorMatrix', {
                in: 'disp_g',
                type: 'matrix',
                values: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
                result: 'chan_g'
            }));

            filter.appendChild(createSvgEl('feDisplacementMap', {
                in: 'SourceGraphic',
                in2: 'lg_map',
                scale: String(Math.max(4, baseScale - 3)),
                xChannelSelector: 'R',
                yChannelSelector: 'G',
                result: 'disp_b'
            }));
            filter.appendChild(createSvgEl('feColorMatrix', {
                in: 'disp_b',
                type: 'matrix',
                values: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
                result: 'chan_b'
            }));

            filter.appendChild(createSvgEl('feBlend', {
                in: 'chan_r',
                in2: 'chan_g',
                mode: 'screen',
                result: 'blend_rg'
            }));
            filter.appendChild(createSvgEl('feBlend', {
                in: 'blend_rg',
                in2: 'chan_b',
                mode: 'screen',
                result: 'lg_recombined'
            }));
            filter.appendChild(createSvgEl('feColorMatrix', {
                in: 'lg_recombined',
                type: 'saturate',
                values: '1.14'
            }));
        } else {
            filter.appendChild(createSvgEl('feDisplacementMap', {
                in: 'SourceGraphic',
                in2: 'lg_map',
                scale: String(baseScale),
                xChannelSelector: 'R',
                yChannelSelector: 'G',
                result: 'disp_norm'
            }));
            filter.appendChild(createSvgEl('feColorMatrix', {
                in: 'disp_norm',
                type: 'saturate',
                values: '1.08'
            }));
        }

        defs.appendChild(filter);
        filterCache.set(key, { id: filterId, node: filter });
        return filterId;
    }

    function applyToElement(el, opts = {}) {
        try {
            if (!el || !(el instanceof Element)) return false;

            const prev = elementStates.get(el) || {};
            const mergedOpts = {
                variant: opts.variant || prev.variant || 'pill',
                shape: opts.shape || prev.shape || (el.id === 'bottom-main-circle' || el.id === 'tablet-main-circle' ? 'circle' : 'pill')
            };

            const rect = el.getBoundingClientRect();
            const width = Math.max(rect.width || el.offsetWidth || 0, 40);
            const height = Math.max(rect.height || el.offsetHeight || 0, 28);
            const { bw, bh } = quantizeSize(width, height);
            const intensity = getIntensity();
            const isNativeApk = document.documentElement?.dataset?.platform === 'android-apk';
            const useRefraction = canUseRefraction(intensity) && !(isNativeApk && mergedOpts.variant === 'switch');

            el.setAttribute('data-lg-surface', mergedOpts.variant);
            el.setAttribute('data-lg-refraction', useRefraction ? intensity : 'fallback');

            const blurPx = intensity === 'intenso' ? 18 : 14;
            const satPct = intensity === 'intenso' ? 205 : 175;

            if (useRefraction) {
                const filterId = getOrCreateFilter(bw, bh, mergedOpts.shape, intensity);
                if (filterId) {
                    el.style.setProperty('--lg-backdrop-filter', `url(#${filterId}) blur(${blurPx}px) saturate(${satPct}%)`);
                    el.dataset.lgFilterId = filterId;
                } else {
                    el.style.removeProperty('--lg-backdrop-filter');
                    delete el.dataset.lgFilterId;
                }
            } else {
                el.style.removeProperty('--lg-backdrop-filter');
                delete el.dataset.lgFilterId;
            }

            elementStates.set(el, {
                variant: mergedOpts.variant,
                shape: mergedOpts.shape,
                bucketKey: `${bw}x${bh}`,
                intensity,
                useRefraction
            });

            if (!trackedElements.has(el)) {
                trackedElements.add(el);
                if (sharedResizeObserver) {
                    try { sharedResizeObserver.observe(el); } catch (_) {}
                }
            }
            return true;
        } catch (_) {
            try {
                el?.style?.removeProperty('--lg-backdrop-filter');
                el?.setAttribute?.('data-lg-refraction', 'fallback');
            } catch (_) {}
            return false;
        }
    }

    function scanAndApplyDefaults() {
        try {
            document.querySelectorAll('.segmented-glass-indicator, .nav-sliding-indicator, .chip-glass-indicator').forEach(el => {
                applyToElement(el, { variant: 'indicator', shape: 'pill' });
            });
            const fabCircle = document.getElementById('bottom-main-circle');
            if (fabCircle) applyToElement(fabCircle, { variant: 'fab', shape: 'circle' });
            const tabletFab = document.getElementById('tablet-main-circle');
            if (tabletFab) applyToElement(tabletFab, { variant: 'fab', shape: 'circle' });
            document.querySelectorAll('.app-switch-thumb').forEach(thumb => {
                applyToElement(thumb, { variant: 'switch', shape: 'circle' });
            });
        } catch (_) {}
    }

    function refreshAll() {
        try {
            Array.from(trackedElements).forEach(el => {
                if (!el.isConnected) {
                    trackedElements.delete(el);
                    return;
                }
                applyToElement(el);
            });
            scanAndApplyDefaults();
        } catch (_) {}
    }

    function setIntensity() {
        refreshAll();
    }

    function init() {
        try {
            ensureSvgHost();
            if (!sharedResizeObserver && typeof ResizeObserver !== 'undefined') {
                const pendingResizeTargets = new Set();
                let resizeRafId = 0;
                const flushResize = () => {
                    resizeRafId = 0;
                    pendingResizeTargets.forEach((target) => {
                        if (!target || !target.isConnected) return;
                        const prev = elementStates.get(target);
                        const w = target.offsetWidth || 0;
                        const h = target.offsetHeight || 0;
                        if (w <= 0 || h <= 0) return;
                        const { bw, bh } = quantizeSize(w, h);
                        const nextBucket = `${bw}x${bh}`;
                        if (!prev || prev.bucketKey !== nextBucket) {
                            applyToElement(target);
                        }
                    });
                    pendingResizeTargets.clear();
                };
                sharedResizeObserver = new ResizeObserver((entries) => {
                    for (const entry of entries) {
                        if (entry.target && entry.target.isConnected) {
                            pendingResizeTargets.add(entry.target);
                        }
                    }
                    if (!resizeRafId && pendingResizeTargets.size > 0) {
                        resizeRafId = requestAnimationFrame(flushResize);
                    }
                });
            }
            if (!transparencyMql && window.matchMedia) {
                transparencyMql = window.matchMedia('(prefers-reduced-transparency: reduce)');
                const onChange = () => refreshAll();
                if (typeof transparencyMql.addEventListener === 'function') {
                    transparencyMql.addEventListener('change', onChange);
                } else if (typeof transparencyMql.addListener === 'function') {
                    transparencyMql.addListener(onChange);
                }
            }
            initialized = true;
            scanAndApplyDefaults();
            return true;
        } catch (_) {
            return false;
        }
    }

    function destroy() {
        try {
            sharedResizeObserver?.disconnect?.();
            sharedResizeObserver = null;
            trackedElements.clear();
            filterCache.clear();
            if (hostSvg && hostSvg.isConnected) hostSvg.remove();
            hostSvg = null;
            hostDefs = null;
            initialized = false;
        } catch (_) {}
    }

    function getCapabilities() {
        const intensity = getIntensity();
        return {
            initialized,
            intensity,
            supportsSvgBackdrop: supportsSvgBackdropFilter(),
            reducedTransparency: isReducedTransparency(),
            lowEndDevice: isLowEndDevice(),
            refractionActive: canUseRefraction(intensity),
            cachedFilters: filterCache.size
        };
    }

    window.applyLiquidGlass = applyToElement;
    window.LiquidGlassModule = {
        init,
        apply: applyToElement,
        refreshAll,
        setIntensity,
        scanAndApplyDefaults,
        getCapabilities,
        destroy
    };
})();
