/**
 * liquid-glass.js v2 - Motor de Cristal Líquido (refracción real con lente biselada)
 *
 * Qué cambió respecto a la v1:
 *  - Mapa de desplazamiento basado en una lente convexa (SDF de rectángulo redondeado + perfil de bisel),
 *    con refracción fuerte en el borde y centro sin distorsión (el texto sigue legible).
 *  - Aberración cromática real (R/G/B con escalas distintas) en "intenso".
 *  - Ya NO se apaga la refracción por RAM/CPU del teléfono (antes casi todos los Android caían al fallback).
 *    Solo se apaga con: "suave", prefers-reduced-transparency, navegador sin soporte, o ?lg=off.
 *  - El filtro usa la región exacta del elemento (sin porcentajes ambiguos) para que el mapa quede alineado.
 *  - Misma API pública: applyLiquidGlass, LiquidGlassModule.{init,apply,refreshAll,setIntensity,
 *    scanAndApplyDefaults,getCapabilities,destroy}. Mismo host SVG #lg-svg-filter-host (0x0, nunca display:none).
 *
 * Forzar manualmente (útil para probar en el teléfono):
 *    localStorage.setItem('lg_force','on')   -> refracción siempre (si hay soporte)
 *    localStorage.setItem('lg_force','off')  -> refracción nunca
 *    ?lg=off  o  ?lg=on  en la URL
 */
(() => {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const XLINK_NS = 'http://www.w3.org/1999/xlink';
    const HOST_ID = 'lg-svg-filter-host';
    const MAX_CACHE_FILTERS = 40;

    // Perfil por tipo de superficie.
    //  px     : desplazamiento máximo en el borde (px CSS) en intensidad "normal"
    //  bezel  : fracción de la mitad del lado corto que ocupa el bisel (0-1)
    //  maxBez : tope del bisel en px (para superficies grandes)
    //  blur   : blur residual en px dentro de backdrop-filter
    //  sat    : saturación (%)
    const PROFILES = {
        indicator:         { px: 13, bezel: 0.68, maxBez: 40, blur: 0.4, sat: 190, chroma: true },
        'nav-indicator':   { px: 13, bezel: 0.68, maxBez: 40, blur: 0.4, sat: 190, chroma: true },
        'chip-indicator':  { px: 12, bezel: 0.68, maxBez: 40, blur: 0.4, sat: 190, chroma: true },
        fab:               { px: 14, bezel: 0.80, maxBez: 40, blur: 0.8,   sat: 180, chroma: true },
        switch:            { px: 6,  bezel: 0.95, maxBez: 14, blur: 0, sat: 160, chroma: false },
        rail:              { px: 9,  bezel: 0.40, maxBez: 22, blur: 6,   sat: 180, chroma: false },
        bar:               { px: 9,  bezel: 0.45, maxBez: 24, blur: 6,   sat: 180, chroma: false }
    };
    const DEFAULT_PROFILE = PROFILES.indicator;

    const trackedElements = new Set();
    const elementStates = new WeakMap();
    const filterCache = new Map();
    const mapUrlCache = new Map();

    let hostSvg = null;
    let hostDefs = null;
    let sharedResizeObserver = null;
    let transparencyMql = null;
    let cachedSupportsSvgBackdrop = null;
    let initialized = false;
    let filterSeq = 0;

    /* ----------------------------- Capacidades ----------------------------- */

    function getIntensity() {
        try {
            const attr = document.documentElement.getAttribute('data-glass-intensity');
            if (attr === 'suave' || attr === 'normal' || attr === 'intenso') return attr;
            const stored = window.StorageModule?.getGlassIntensity?.();
            if (stored === 'suave' || stored === 'normal' || stored === 'intenso') return stored;
        } catch (_) {}
        return 'normal';
    }

    function getForceMode() {
        try {
            const q = new URLSearchParams(window.location.search).get('lg');
            if (q === 'on' || q === 'off') return q;
            const s = localStorage.getItem('lg_force');
            if (s === 'on' || s === 'off') return s;
        } catch (_) {}
        return null;
    }

    function isReducedTransparency() {
        try {
            return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-transparency: reduce)').matches);
        } catch (_) { return false; }
    }

    // Solo equipos realmente muy limitados (1-2 núcleos o <= 1 GB). Ya NO se usa el umbral de 4 GB / 4 núcleos.
    function isLowEndDevice() {
        try {
            const cores = Number(navigator.hardwareConcurrency || 0);
            const mem = Number(navigator.deviceMemory || 0);
            if (cores > 0 && cores <= 2) return true;
            if (mem > 0 && mem <= 1) return true;
        } catch (_) {}
        return false;
    }

    function supportsSvgBackdropFilter() {
        if (cachedSupportsSvgBackdrop !== null) return cachedSupportsSvgBackdrop;
        try {
            if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
                cachedSupportsSvgBackdrop = Boolean(
                    CSS.supports('backdrop-filter', 'url(#lg-probe) blur(4px)') ||
                    CSS.supports('-webkit-backdrop-filter', 'url(#lg-probe) blur(4px)')
                );
                return cachedSupportsSvgBackdrop;
            }
        } catch (_) {}
        cachedSupportsSvgBackdrop = false;
        return false;
    }

    function canUseRefraction(intensity) {
        if (intensity === 'suave') return false;
        const force = getForceMode();
        if (force === 'off') return false;
        if (!supportsSvgBackdropFilter()) return false;
        if (isReducedTransparency()) return false;
        if (force === 'on') return true;
        if (isLowEndDevice()) return false;
        return true;
    }

    /* ------------------------------- Host SVG ------------------------------- */

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
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;left:-9999px;top:0;';
        const defs = document.createElementNS(SVG_NS, 'defs');
        svg.appendChild(defs);
        document.body.appendChild(svg);
        hostSvg = svg;
        hostDefs = defs;
        return hostDefs;
    }

    function svgEl(tag, attrs = {}) {
        const node = document.createElementNS(SVG_NS, tag);
        Object.keys(attrs).forEach(k => node.setAttribute(k, String(attrs[k])));
        return node;
    }

    /* --------------------------- Mapa de desplazamiento --------------------------- */

    function quantize(v, step, min, max) {
        return Math.max(min, Math.min(max, Math.round(v / step) * step));
    }

    /**
     * Lente convexa: para cada pixel se calcula su distancia al borde (SDF de rectángulo redondeado),
     * se aplica un perfil de bisel (suave, fuerte en el borde, 0 en el interior) y se codifica el vector
     * de muestreo (hacia adentro) en los canales R y G alrededor de 128 (neutro).
     */
    function getDisplacementDataUrl(w, h, shape, bezelPx) {
        const key = `${w}x${h}_${shape}_${Math.round(bezelPx)}`;
        if (mapUrlCache.has(key)) return mapUrlCache.get(key);

        // Resolución interna: 2x para bordes suaves, con tope para no gastar memoria
        const dpr = Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1)));
        const cw = Math.min(900, Math.round(w * dpr));
        const ch = Math.min(400, Math.round(h * dpr));
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        const img = ctx.createImageData(cw, ch);
        const data = img.data;
        const halfW = cw / 2;
        const halfH = ch / 2;
        const radius = shape === 'rect' ? Math.min(halfW, halfH) * 0.55 : Math.min(halfW, halfH); // pill/circle
        const innerX = halfW - radius;
        const innerY = halfH - radius;
        const bezel = Math.max(2, bezelPx * dpr);

        for (let y = 0; y < ch; y++) {
            for (let x = 0; x < cw; x++) {
                const px = x + 0.5 - halfW;
                const py = y + 0.5 - halfH;
                const qx = Math.abs(px) - innerX;
                const qy = Math.abs(py) - innerY;

                // Distancia con signo (negativa dentro) y normal saliente
                let dist, nx, ny;
                if (qx > 0 && qy > 0) {
                    const len = Math.hypot(qx, qy) || 1;
                    dist = len - radius;
                    nx = (qx / len) * Math.sign(px);
                    ny = (qy / len) * Math.sign(py);
                } else if (qx > qy) {
                    dist = qx - radius;
                    nx = Math.sign(px) || 1; ny = 0;
                } else {
                    dist = qy - radius;
                    nx = 0; ny = Math.sign(py) || 1;
                }

                const depth = -dist; // distancia hacia adentro desde el borde
                let m = 0;
                if (depth >= 0 && depth < bezel) {
                    const t = depth / bezel;           // 0 en el borde, 1 al final del bisel
                    const u = 1 - t;
                    m = u * u * (0.35 + 0.65 * u);     // fuerte en el borde, cae suavemente a 0
                }

                const idx = (y * cw + x) * 4;
                // El vector apunta hacia adentro (se muestrea contenido más interno => efecto lupa en el borde)
                data[idx]     = Math.max(0, Math.min(255, Math.round(128 + (-nx * m) * 127)));
                data[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + (-ny * m) * 127)));
                data[idx + 2] = 128;
                data[idx + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
        const url = canvas.toDataURL('image/png');

        if (mapUrlCache.size > MAX_CACHE_FILTERS) {
            mapUrlCache.delete(mapUrlCache.keys().next().value);
        }
        mapUrlCache.set(key, url);
        return url;
    }

    /* --------------------------------- Filtro --------------------------------- */

    function chanMatrix(c) {
        const r = c === 'r' ? 1 : 0, g = c === 'g' ? 1 : 0, b = c === 'b' ? 1 : 0;
        return `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;
    }

    function getOrCreateFilter(w, h, shape, variant, intensity, profile) {
        const mult = intensity === 'intenso' ? 1.35 : 1;
        const maxPx = profile.px * mult;                   // desplazamiento máximo en px
        const scale = Math.round(maxPx * 2 * 10) / 10;     // feDisplacementMap: ±scale/2
        const minHalf = Math.min(w, h) / 2;
        const bezelPx = Math.max(3, Math.min(minHalf * profile.bezel, profile.maxBez));
        const chroma = intensity === 'intenso' && profile.chroma;

        const key = `${w}x${h}_${shape}_${variant}_${intensity}_${scale}`;
        const cached = filterCache.get(key);
        if (cached && cached.node && cached.node.isConnected) return cached.id;
        if (cached) filterCache.delete(key);

        const defs = ensureSvgHost();
        if (!defs) return null;
        const mapUrl = getDisplacementDataUrl(w, h, shape, bezelPx);
        if (!mapUrl) return null;

        if (filterCache.size >= MAX_CACHE_FILTERS) {
            const oldestKey = filterCache.keys().next().value;
            const oldest = filterCache.get(oldestKey);
            if (oldest?.node?.isConnected) oldest.node.remove();
            filterCache.delete(oldestKey);
        }

        filterSeq += 1;
        const id = `lg-flt-${filterSeq}`;
        // Región = caja exacta del elemento: el mapa queda alineado 1:1
        const filter = svgEl('filter', {
            id,
            filterUnits: 'objectBoundingBox',
            x: '0', y: '0', width: '1', height: '1',
            'color-interpolation-filters': 'sRGB'
        });

        const feImage = svgEl('feImage', { result: 'lgmap', preserveAspectRatio: 'none' });
        feImage.setAttribute('href', mapUrl);
        feImage.setAttributeNS(XLINK_NS, 'xlink:href', mapUrl);
        filter.appendChild(feImage);

        if (chroma) {
            const scales = { r: scale * 1.0, g: scale * 0.93, b: scale * 0.86 };
            ['r', 'g', 'b'].forEach(c => {
                filter.appendChild(svgEl('feDisplacementMap', {
                    in: 'SourceGraphic', in2: 'lgmap', scale: scales[c],
                    xChannelSelector: 'R', yChannelSelector: 'G', result: `d_${c}`
                }));
                filter.appendChild(svgEl('feColorMatrix', {
                    in: `d_${c}`, type: 'matrix', values: chanMatrix(c), result: `c_${c}`
                }));
            });
            filter.appendChild(svgEl('feComposite', {
                in: 'c_r', in2: 'c_g', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'c_rg'
            }));
            filter.appendChild(svgEl('feComposite', {
                in: 'c_rg', in2: 'c_b', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0
            }));
        } else {
            filter.appendChild(svgEl('feDisplacementMap', {
                in: 'SourceGraphic', in2: 'lgmap', scale,
                xChannelSelector: 'R', yChannelSelector: 'G'
            }));
        }

        defs.appendChild(filter);
        filterCache.set(key, { id, node: filter });
        return id;
    }

    /* ------------------------------ Aplicación ------------------------------ */

    function resolveShape(el, variant, optShape) {
        if (optShape) return optShape;
        if (el.id === 'bottom-main-circle' || el.id === 'tablet-main-circle') return 'circle';
        if (variant === 'fab' || variant === 'switch') return 'circle';
        if (variant === 'rail' || variant === 'bar') return 'rect';
        return 'pill';
    }

    function applyToElement(el, opts = {}) {
        try {
            if (!el || !(el instanceof Element)) return false;

            const prev = elementStates.get(el) || {};
            const variant = opts.variant || prev.variant || 'indicator';
            const shape = resolveShape(el, variant, opts.shape || prev.shape);
            const profile = PROFILES[variant] || DEFAULT_PROFILE;

            const rect = el.getBoundingClientRect();
            const rawW = rect.width || el.offsetWidth || 0;
            const rawH = rect.height || el.offsetHeight || 0;
            // Elementos aún sin medir (display:none, etc.): se marcan y se reintentan con el ResizeObserver
            const w = quantize(Math.max(rawW, 24), 4, 24, 900);
            const h = quantize(Math.max(rawH, 20), 4, 20, 400);

            const intensity = getIntensity();
            const isNativeApk = document.documentElement?.dataset?.platform === 'android-apk';
            const useRefraction = canUseRefraction(intensity) && !(isNativeApk && variant === 'switch');

            el.setAttribute('data-lg-surface', variant);
            el.setAttribute('data-lg-refraction', useRefraction ? intensity : 'fallback');

            if (useRefraction) {
                const filterId = getOrCreateFilter(w, h, shape, variant, intensity, profile);
                if (filterId) {
                    const blur = intensity === 'intenso' ? profile.blur * 0.8 : profile.blur;
                    el.style.setProperty(
                        '--lg-backdrop-filter',
                        `url(#${filterId}) blur(${blur}px) saturate(${profile.sat}%) brightness(1.06)`
                    );
                    el.dataset.lgFilterId = filterId;
                } else {
                    el.style.removeProperty('--lg-backdrop-filter');
                    delete el.dataset.lgFilterId;
                }
            } else {
                el.style.removeProperty('--lg-backdrop-filter');
                delete el.dataset.lgFilterId;
            }

            elementStates.set(el, { variant, shape, bucketKey: `${w}x${h}`, intensity, useRefraction });

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
            } catch (__) {}
            return false;
        }
    }

    function scanAndApplyDefaults() {
        try {
            document.querySelectorAll('.segmented-glass-indicator, .nav-sliding-indicator, .chip-glass-indicator').forEach(el => {
                applyToElement(el, { variant: el.classList.contains('chip-glass-indicator') ? 'chip-indicator' : 'indicator', shape: 'pill' });
            });
            ['bottom-main-circle', 'tablet-main-circle'].forEach(id => {
                const fab = document.getElementById(id);
                if (fab) applyToElement(fab, { variant: 'fab', shape: 'circle' });
            });
            document.querySelectorAll('.app-switch-thumb').forEach(thumb => {
                applyToElement(thumb, { variant: 'switch', shape: 'circle' });
            });
            const bottomNav = document.getElementById('bottom-nav');
            if (bottomNav) applyToElement(bottomNav, { variant: 'bar', shape: 'pill' });
        } catch (_) {}
    }

    function refreshAll() {
        try {
            Array.from(trackedElements).forEach(el => {
                if (!el.isConnected) { trackedElements.delete(el); return; }
                applyToElement(el);
            });
            scanAndApplyDefaults();
        } catch (_) {}
    }

    function setIntensity() { refreshAll(); }

    function init() {
        try {
            ensureSvgHost();
            if (!sharedResizeObserver && typeof ResizeObserver !== 'undefined') {
                const pending = new Set();
                let raf = 0;
                const flush = () => {
                    raf = 0;
                    pending.forEach(target => {
                        if (!target || !target.isConnected) return;
                        const prev = elementStates.get(target);
                        const w = target.offsetWidth || 0;
                        const h = target.offsetHeight || 0;
                        if (w <= 0 || h <= 0) return;
                        const bucket = `${quantize(Math.max(w, 24), 4, 24, 900)}x${quantize(Math.max(h, 20), 4, 20, 400)}`;
                        if (!prev || prev.bucketKey !== bucket) applyToElement(target);
                    });
                    pending.clear();
                };
                sharedResizeObserver = new ResizeObserver(entries => {
                    for (const entry of entries) {
                        if (entry.target && entry.target.isConnected) pending.add(entry.target);
                    }
                    if (!raf && pending.size > 0) raf = requestAnimationFrame(flush);
                });
            }
            if (!transparencyMql && window.matchMedia) {
                transparencyMql = window.matchMedia('(prefers-reduced-transparency: reduce)');
                const onChange = () => refreshAll();
                if (typeof transparencyMql.addEventListener === 'function') transparencyMql.addEventListener('change', onChange);
                else if (typeof transparencyMql.addListener === 'function') transparencyMql.addListener(onChange);
            }
            initialized = true;
            scanAndApplyDefaults();
            // Segundo pase cuando el layout y las fuentes ya están estables (los tamaños iniciales pueden ser 0)
            requestAnimationFrame(() => requestAnimationFrame(refreshAll));
            if (document.fonts?.ready) document.fonts.ready.then(() => refreshAll()).catch(() => {});
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
            mapUrlCache.clear();
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
            forceMode: getForceMode(),
            refractionActive: canUseRefraction(intensity),
            cachedFilters: filterCache.size
        };
    }

    window.applyLiquidGlass = applyToElement;
    window.LiquidGlassModule = { init, apply: applyToElement, refreshAll, setIntensity, scanAndApplyDefaults, getCapabilities, destroy };
})();
