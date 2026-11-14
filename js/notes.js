/**
 * Módulo de Notas Rápidas
 * Gestiona la creación, edición, filtrado por categorías, recordatorios y renderizado.
 * Clave de persistencia: agenda_cch_notes
 */

window.NotesModule = (() => {
    let currentFilter = 'all'; // 'all' | 'idea' | 'apunte' | 'pendiente' | 'importante' | 'personal'
    let searchQuery = '';
    let editingNoteId = null;
    let pendingUnlockId = null;
    const unlockedNotes = new Set(); // Sesión en memoria: se vuelve a bloquear al recargar

    function hashPin(pin) {
        let h = 5381;
        const str = 'org|' + String(pin);
        for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
        return 'h1:' + h.toString(16);
    }

    function pinMatches(note, pin) {
        if (!note || !note.hasPassword || pin === undefined || pin === null || String(pin) === '') return false;
        const stored = String(note.passwordHash || '');
        if (!stored) return false;
        return String(pin) === stored || hashPin(pin) === stored;
    }

    function isNoteUnlocked(id) {
        return unlockedNotes.has(String(id));
    }

    function isLocked(note) {
        return Boolean(note && note.hasPassword && !unlockedNotes.has(String(note.id)));
    }

    function unlockNote(id, pin) {
        const note = window.StorageModule.getNotes().find(n => String(n.id) === String(id));
        if (!note || !note.hasPassword) return false;
        if (!pinMatches(note, pin)) return false;
        unlockedNotes.add(String(note.id));
        render();
        return true;
    }

    function showOverlay(id, show) {
        const el = document.getElementById(id);
        if (!el) return;
        if (show) {
            const backdrop = el.querySelector('[id$="-backdrop"]');
            if (backdrop) {
                backdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
                backdrop.style.opacity = '';
            }
            const sheet = el.querySelector('.mobile-bottom-sheet');
            if (sheet) {
                sheet.style.transform = '';
                sheet.style.transition = '';
                sheet.style.maxHeight = '';
            }
            el.classList.remove('hidden');
            el.classList.add('flex');
            el.style.display = 'flex';
            requestAnimationFrame(() => el.classList.add('active'));
        } else {
            el.classList.remove('active');
            el.classList.add('hidden');
            el.classList.remove('flex');
            el.style.display = '';
        }
    }

    function openUnlockModal(id) {
        pendingUnlockId = id;
        const input = document.getElementById('note-unlock-input');
        if (input) input.value = '';
        document.getElementById('note-unlock-error')?.classList.add('hidden');
        showOverlay('note-unlock-modal', true);
        setTimeout(() => input?.focus(), 80);
    }

    function closeUnlockModal() {
        pendingUnlockId = null;
        showOverlay('note-unlock-modal', false);
    }

    function submitUnlock() {
        const input = document.getElementById('note-unlock-input');
        const id = pendingUnlockId;
        if (id && unlockNote(id, input ? input.value : '')) {
            closeUnlockModal();
            window.HapticsModule?.double?.();
            return;
        }
        document.getElementById('note-unlock-error')?.classList.remove('hidden');
        const dlg = document.getElementById('note-unlock-dialog');
        if (dlg) {
            dlg.classList.remove('note-shake');
            void dlg.offsetWidth;
            dlg.classList.add('note-shake');
        }
        if (input) input.value = '';
    }

    // --- Galería de materiales y visor a pantalla completa (v1.5.2 Etapa 3) ---
    let activeNotesTab = 'notes'; // 'notes' | 'gallery'
    let pendingModalPhotoQueue = []; // Fotos adjuntas antes de guardar una nota nueva
    let viewerPhotos = [];
    let viewerIndex = -1;
    let viewerScale = 1;
    let viewerPanX = 0;
    let viewerPanY = 0;
    let lastPreviewTriggerEl = null;

    const VIEWER_MIN_ZOOM = 1;
    const VIEWER_MAX_ZOOM = 6;

    function compressImage(file) {
        const MAX_DIM = 1600;
        const QUALITY = 0.88;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('read'));
            reader.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error('img'));
                img.onload = () => {
                    const maxSide = Math.max(img.width || 1, img.height || 1);
                    const ratio = Math.min(1, MAX_DIM / maxSide);
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(img.width * ratio));
                    canvas.height = Math.max(1, Math.round(img.height * ratio));
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
                    resolve(dataUrl);
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function createThumbnailFromDataUrl(dataUrl, maxDim = 360) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const maxSide = Math.max(img.width || 1, img.height || 1);
                if (maxSide <= maxDim) {
                    resolve(dataUrl);
                    return;
                }
                const ratio = maxDim / maxSide;
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(img.width * ratio));
                canvas.height = Math.max(1, Math.round(img.height * ratio));
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.78));
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    }

    function slugifyFilename(str) {
        const raw = String(str || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 48);
        return raw || 'material';
    }

    function resolvePhotoExtension(photo, blob) {
        const mime = String((blob && blob.type) || photo?.mimeType || '').toLowerCase();
        if (mime.includes('png')) return 'png';
        if (mime.includes('webp')) return 'webp';
        if (mime.includes('gif')) return 'gif';
        if (mime.includes('avif')) return 'avif';
        if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
        const fname = String(photo?.fileName || photo?.name || '');
        const match = fname.match(/\.([a-z0-9]{2,5})$/i);
        if (match) return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
        return 'jpg';
    }

    function buildDownloadFilename(photo, blob) {
        const linkedNote = photo?.noteId
            ? window.StorageModule?.getNotes?.().find(n => String(n.id) === String(photo.noteId))
            : null;
        const titleBase = (linkedNote && !isLocked(linkedNote) ? linkedNote.title : '') ||
            photo?.noteTitle ||
            String(photo?.name || '').replace(/\.[a-z0-9]{2,5}$/i, '') ||
            'material';
        const slug = slugifyFilename(titleBase);
        const dt = new Date(Number(photo?.createdAt) || Date.now());
        const pad = (n) => String(n).padStart(2, '0');
        const datePart = `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}-${pad(dt.getHours())}${pad(dt.getMinutes())}`;
        const ext = resolvePhotoExtension(photo, blob);
        return `nota-${slug}-${datePart}.${ext}`;
    }

    function refreshPhotoNoteSelect() {
        const select = document.getElementById('notes-photo-note-select');
        if (!select || !window.StorageModule) return;
        const prev = select.value;
        const notes = window.StorageModule.getNotes();
        select.innerHTML = '<option value="">Sin vincular a nota</option>' +
            notes.map(n => {
                const label = isLocked(n) ? '🔒 Nota privada' : (n.title || 'Sin título');
                return `<option value="${escapeHtml(n.id)}">${escapeHtml(label)}</option>`;
            }).join('');
        if (prev && notes.some(n => String(n.id) === String(prev))) {
            select.value = prev;
        }
    }

    function switchNotesTab(tab) {
        const target = tab === 'gallery' ? 'gallery' : 'notes';
        activeNotesTab = target;
        const notesTabBtn = document.getElementById('notes-tab-notes');
        const galleryTabBtn = document.getElementById('notes-tab-gallery');
        const cardsPanel = document.getElementById('notes-cards-panel');
        const galleryPanel = document.getElementById('notes-gallery-panel');
        const searchBar = document.getElementById('notes-search-filter-bar');

        if (notesTabBtn) {
            const active = target === 'notes';
            notesTabBtn.classList.toggle('notes-seg-active', active);
            notesTabBtn.setAttribute('aria-selected', active ? 'true' : 'false');
        }
        if (galleryTabBtn) {
            const active = target === 'gallery';
            galleryTabBtn.classList.toggle('notes-seg-active', active);
            galleryTabBtn.setAttribute('aria-selected', active ? 'true' : 'false');
        }
        if (cardsPanel) cardsPanel.classList.toggle('hidden', target !== 'notes');
        if (searchBar) searchBar.classList.toggle('hidden', target !== 'notes');
        if (galleryPanel) galleryPanel.classList.toggle('hidden', target !== 'gallery');

        const tabsTrack = document.getElementById('notes-view-tabs');
        if (tabsTrack) {
            window.SegmentedControl?.sync?.(tabsTrack);
        }

        if (target === 'gallery') {
            refreshPhotoNoteSelect();
            renderGallery();
        }
    }

    async function handlePhotoUpload(input, explicitNoteId = null) {
        const file = input?.files && input.files[0];
        if (!file) return;
        try {
            const dataUrl = await compressImage(file);
            const thumbUrl = await createThumbnailFromDataUrl(dataUrl);
            const select = document.getElementById('notes-photo-note-select');
            const noteId = explicitNoteId !== null ? explicitNoteId : (select?.value || null);
            const linkedNote = noteId
                ? window.StorageModule.getNotes().find(n => String(n.id) === String(noteId))
                : null;
            const photoId = 'photo_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
            const entry = {
                id: photoId,
                name: file.name || 'Foto',
                fileName: file.name || 'foto.jpg',
                mimeType: file.type || 'image/jpeg',
                byteLength: file.size || 0,
                dataUrl,
                thumbUrl,
                noteId: noteId ? String(noteId) : null,
                noteTitle: linkedNote && !isLocked(linkedNote) ? linkedNote.title : '',
                createdAt: Date.now()
            };

            const saved = typeof window.StorageModule.saveGalleryPhotoToIdb === 'function'
                ? await window.StorageModule.saveGalleryPhotoToIdb(entry, file)
                : window.StorageModule.saveGalleryPhoto(entry);

            if (saved) {
                window.showNotification?.('Foto agregada a la galería.', 'success');
            } else {
                window.showNotification?.('Almacenamiento lleno. Elimina fotos anteriores para liberar espacio.', 'warning');
            }
        } catch (e) {
            window.showNotification?.('No se pudo procesar la imagen.', 'warning');
        }
        if (input) input.value = '';
        renderGallery();
        render();
    }

    async function handleModalPhotoAttach(input) {
        const file = input?.files && input.files[0];
        if (!file) return;
        if (editingNoteId) {
            await handlePhotoUpload(input, editingNoteId);
            renderModalPhotosList(editingNoteId);
            return;
        }
        try {
            const dataUrl = await compressImage(file);
            const thumbUrl = await createThumbnailFromDataUrl(dataUrl);
            pendingModalPhotoQueue.push({
                id: 'photo_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
                name: file.name || 'Foto',
                fileName: file.name || 'foto.jpg',
                mimeType: file.type || 'image/jpeg',
                byteLength: file.size || 0,
                dataUrl,
                thumbUrl,
                file,
                createdAt: Date.now()
            });
            renderModalPhotosList(null);
        } catch (e) {
            window.showNotification?.('No se pudo adjuntar la foto.', 'warning');
        }
        input.value = '';
    }

    function renderModalPhotosList(noteId) {
        const container = document.getElementById('note-modal-photos-list');
        if (!container || !window.StorageModule) return;
        const stored = noteId
            ? window.StorageModule.getGalleryPhotos().filter(p => String(p.noteId || '') === String(noteId))
            : [];
        const items = [...stored, ...pendingModalPhotoQueue];
        if (items.length === 0) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = items.map(p => `
            <div class="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 shrink-0">
                <img src="${escapeHtml(p.thumbUrl || p.dataUrl)}" alt="${escapeHtml(p.name)}" class="w-full h-full object-cover">
            </div>
        `).join('');
    }

    function prefersReducedMotion() {
        return typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function getImageBaseBox() {
        const stage = document.getElementById('photo-preview-stage');
        const img = document.getElementById('photo-preview-img');
        if (!stage || !img) return { stageW: 320, stageH: 320, baseW: 320, baseH: 320 };
        const rect = stage.getBoundingClientRect();
        const style = window.getComputedStyle(stage);
        const padX = parseFloat(style.paddingLeft || '0') + parseFloat(style.paddingRight || '0');
        const padY = parseFloat(style.paddingTop || '0') + parseFloat(style.paddingBottom || '0');
        const stageW = Math.max(1, (rect.width || stage.clientWidth || window.innerWidth || 360) - padX);
        const stageH = Math.max(1, (rect.height || stage.clientHeight || window.innerHeight || 540) - padY);
        const natW = img.naturalWidth || img.clientWidth || stageW;
        const natH = img.naturalHeight || img.clientHeight || stageH;
        const fitRatio = Math.min(stageW / natW, stageH / natH, 1e6);
        return {
            stageW,
            stageH,
            baseW: natW * fitRatio,
            baseH: natH * fitRatio
        };
    }

    function clampViewerPan(scale, x, y) {
        if (scale <= 1.001) return { x: 0, y: 0 };
        const { stageW, stageH, baseW, baseH } = getImageBaseBox();
        const maxX = Math.max(0, (baseW * scale - stageW) / 2);
        const maxY = Math.max(0, (baseH * scale - stageH) / 2);
        return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y))
        };
    }

    function applyViewerTransform(animate = false) {
        const stage = document.getElementById('photo-preview-stage');
        const img = document.getElementById('photo-preview-img');
        const resetBtn = document.getElementById('photo-preview-zoom-reset');
        const badge = document.getElementById('photo-preview-zoom-badge');
        const clamped = clampViewerPan(viewerScale, viewerPanX, viewerPanY);
        viewerPanX = clamped.x;
        viewerPanY = clamped.y;

        const pct = Math.round(viewerScale * 100);
        if (img) {
            img.classList.toggle('is-snapping', Boolean(animate) && !prefersReducedMotion());
            img.style.transform = `translate3d(${viewerPanX.toFixed(1)}px, ${viewerPanY.toFixed(1)}px, 0) scale(${viewerScale.toFixed(3)})`;
        }
        if (stage) {
            stage.dataset.zoom = String(Number(viewerScale.toFixed(3)));
            stage.dataset.panX = String(Math.round(viewerPanX));
            stage.dataset.panY = String(Math.round(viewerPanY));
        }
        if (resetBtn) resetBtn.textContent = `${pct}%`;
        if (badge) {
            badge.textContent = `${pct}%`;
            badge.classList.toggle('hidden', viewerScale <= 1.02);
        }
    }

    function setViewerZoom(nextScale, opts = {}) {
        const clampedScale = Math.max(VIEWER_MIN_ZOOM, Math.min(VIEWER_MAX_ZOOM, Number(nextScale) || 1));
        const { animate = false, anchorClientX = null, anchorClientY = null } = opts;
        if (anchorClientX !== null && anchorClientY !== null && clampedScale > 1) {
            const stage = document.getElementById('photo-preview-stage');
            const rect = stage?.getBoundingClientRect();
            if (rect) {
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const ratio = clampedScale / (viewerScale || 1);
                viewerPanX = (viewerPanX - (anchorClientX - cx)) * ratio + (anchorClientX - cx);
                viewerPanY = (viewerPanY - (anchorClientY - cy)) * ratio + (anchorClientY - cy);
            }
        }
        viewerScale = clampedScale;
        if (viewerScale <= 1.001) {
            viewerScale = 1;
            viewerPanX = 0;
            viewerPanY = 0;
        }
        applyViewerTransform(animate);
    }

    function updateViewerContent() {
        const photo = viewerPhotos[viewerIndex];
        if (!photo) return;
        const img = document.getElementById('photo-preview-img');
        const nameEl = document.getElementById('photo-preview-name');
        const metaEl = document.getElementById('photo-preview-meta');
        const stage = document.getElementById('photo-preview-stage');
        const gotoBtn = document.getElementById('photo-preview-goto-note');
        const shareBtn = document.getElementById('photo-preview-share');
        const prevBtn = document.getElementById('photo-preview-prev');
        const nextBtn = document.getElementById('photo-preview-next');

        viewerScale = 1;
        viewerPanX = 0;
        viewerPanY = 0;

        if (img) {
            img.src = photo.dataUrl || photo.thumbUrl || '';
            img.alt = photo.name || 'Foto de la galería';
        }
        if (nameEl) nameEl.textContent = photo.name || 'Foto';

        const notes = window.StorageModule?.getNotes?.() || [];
        const linkedNote = photo.noteId ? notes.find(n => String(n.id) === String(photo.noteId)) : null;
        const dateLabel = photo.createdAt
            ? new Date(photo.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
            : '';
        const counterLabel = `${viewerIndex + 1} / ${viewerPhotos.length}`;
        const noteLabel = linkedNote
            ? (isLocked(linkedNote) ? '🔒 Nota privada' : linkedNote.title)
            : (photo.noteTitle || '');
        if (metaEl) {
            metaEl.textContent = [counterLabel, noteLabel, dateLabel].filter(Boolean).join(' · ');
        }
        if (stage) {
            stage.dataset.index = String(viewerIndex);
            stage.dataset.total = String(viewerPhotos.length);
            stage.dataset.photoId = String(photo.id);
        }
        if (gotoBtn) {
            gotoBtn.classList.toggle('hidden', !linkedNote);
            gotoBtn.dataset.noteId = linkedNote ? String(linkedNote.id) : '';
        }
        if (shareBtn) {
            const canShareApi = typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function';
            shareBtn.classList.toggle('hidden', !canShareApi);
        }
        if (prevBtn) prevBtn.disabled = viewerPhotos.length <= 1;
        if (nextBtn) nextBtn.disabled = viewerPhotos.length <= 1;

        applyViewerTransform(false);
    }

    function openPhotoPreview(photoOrId, triggerEl = null, subset = null) {
        const photos = Array.isArray(subset) && subset.length > 0
            ? subset
            : (window.StorageModule?.getGalleryPhotos?.() || []);
        const targetId = typeof photoOrId === 'object' ? String(photoOrId.id) : String(photoOrId);
        let idx = photos.findIndex(p => String(p.id) === targetId);
        if (idx === -1 && typeof photoOrId === 'object' && photoOrId.dataUrl) {
            viewerPhotos = [photoOrId, ...photos];
            idx = 0;
        } else {
            viewerPhotos = photos;
        }
        if (idx === -1 || viewerPhotos.length === 0) return;

        lastPreviewTriggerEl = triggerEl || document.activeElement;
        viewerIndex = idx;
        updateViewerContent();

        const modal = document.getElementById('photo-preview-modal');
        if (modal) {
            const shell = modal.querySelector('.modal-dialog, .photo-viewer-shell');
            if (shell) {
                shell.classList.remove('hidden');
                shell.style.display = '';
            }
            const backdrop = document.getElementById('photo-preview-backdrop');
            if (backdrop) {
                backdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
                backdrop.style.display = '';
                backdrop.style.opacity = '';
            }
            modal.classList.remove('hidden');
            modal.classList.add('flex', 'open');
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('overflow-hidden');
            requestAnimationFrame(() => modal.classList.add('active'));
            setTimeout(() => document.getElementById('photo-preview-close')?.focus(), 40);
        }
    }

    function closePhotoPreview() {
        const modal = document.getElementById('photo-preview-modal');
        if (!modal || (modal.classList.contains('hidden') && !modal.classList.contains('open'))) return;
        modal.classList.remove('active', 'open', 'flex');
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('overflow-hidden');
        const img = document.getElementById('photo-preview-img');
        if (img) img.removeAttribute('src');
        viewerScale = 1;
        viewerPanX = 0;
        viewerPanY = 0;
        const trigger = lastPreviewTriggerEl;
        lastPreviewTriggerEl = null;
        if (trigger && typeof trigger.focus === 'function' && document.contains(trigger)) {
            trigger.focus();
        }
    }

    function stepViewerPhoto(delta) {
        if (viewerPhotos.length <= 1) return;
        window.HapticsModule?.light?.();
        viewerIndex = (viewerIndex + delta + viewerPhotos.length) % viewerPhotos.length;
        updateViewerContent();
    }

    async function downloadPhotoById(photoId) {
        const photos = window.StorageModule?.getGalleryPhotos?.() || [];
        const photo = viewerPhotos.find(p => String(p.id) === String(photoId)) ||
            photos.find(p => String(p.id) === String(photoId));
        if (!photo) return null;

        const res = await window.StorageModule?.getGalleryPhotoBlobFromIdb?.(photo.id);
        const blob = res?.blob || null;
        if (!blob) {
            window.showNotification?.('No se pudo preparar la descarga de la foto.', 'warning');
            return null;
        }
        const filename = buildDownloadFilename(photo, blob);
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        link.rel = 'noopener';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
        window.HapticsModule?.light?.();
        window.showNotification?.(`Foto descargada (${filename}).`, 'success');
        return { filename, size: blob.size, type: blob.type };
    }

    async function shareCurrentPhoto() {
        const photo = viewerPhotos[viewerIndex];
        if (!photo) return;
        const res = await window.StorageModule?.getGalleryPhotoBlobFromIdb?.(photo.id);
        const blob = res?.blob;
        if (!blob || typeof navigator?.share !== 'function' || typeof navigator?.canShare !== 'function') return;
        const filename = buildDownloadFilename(photo, blob);
        const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
        if (!navigator.canShare({ files: [file] })) {
            await downloadPhotoById(photo.id);
            return;
        }
        try {
            await navigator.share({ title: photo.name || 'Material de nota', files: [file] });
        } catch (e) {}
    }

    function goToLinkedNote(noteId) {
        if (!noteId) return;
        closePhotoPreview();
        switchNotesTab('notes');
        currentFilter = 'all';
        searchQuery = '';
        const searchInput = document.getElementById('notes-search-input');
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('[data-note-filter]').forEach(b => {
            const isAll = b.dataset.noteFilter === 'all';
            b.classList.toggle('bg-indigo-600', isAll);
            b.classList.toggle('text-white', isAll);
            b.classList.toggle('shadow-md', isAll);
            b.classList.toggle('note-filter-active', isAll);
            b.classList.toggle('bg-slate-100', !isAll);
            b.classList.toggle('dark:bg-slate-800', !isAll);
            b.classList.toggle('text-slate-700', !isAll);
            b.classList.toggle('dark:text-slate-200', !isAll);
            b.setAttribute('aria-pressed', isAll ? 'true' : 'false');
        });
        render();
        setTimeout(() => {
            const card = document.querySelector(`[data-note-id="${CSS.escape ? CSS.escape(String(noteId)) : String(noteId)}"]`);
            if (card) {
                card.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
                card.classList.remove('note-card-highlight');
                void card.offsetWidth;
                card.classList.add('note-card-highlight');
            }
        }, 60);
    }

    function renderGallery() {
        const grid = document.getElementById('notes-gallery-grid');
        const countEl = document.getElementById('notes-gallery-count');
        if (!window.StorageModule) return;
        const photos = window.StorageModule.getGalleryPhotos();
        if (countEl) countEl.textContent = String(photos.length);
        if (!grid) return;

        if (photos.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 py-10 px-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">Aún no tienes fotos en tus notas. Sube imágenes de tus materiales o apuntes con el botón <strong>+ Foto</strong>.</div>';
            return;
        }

        const notes = window.StorageModule.getNotes();
        grid.innerHTML = photos.map(p => {
            const linked = p.noteId ? notes.find(n => String(n.id) === String(p.noteId)) : null;
            const noteChip = linked
                ? (isLocked(linked) ? '🔒 Nota privada' : linked.title)
                : (p.noteTitle || '');
            return `
            <div class="gallery-card">
                <div class="gallery-thumb" data-photo-id="${escapeHtml(p.id)}">
                    <button type="button" class="gallery-thumb-btn" data-photo-open="${escapeHtml(p.id)}" aria-label="Ver ${escapeHtml(p.name)}">
                        <img src="${escapeHtml(p.thumbUrl || p.dataUrl)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async">
                    </button>
                    ${noteChip ? `<span class="gallery-note-chip">📝 ${escapeHtml(noteChip)}</span>` : ''}
                    <button type="button" class="gallery-del" data-photo-del="${escapeHtml(p.id)}" aria-label="Eliminar foto ${escapeHtml(p.name)}">✕</button>
                </div>
                <div class="gallery-name text-slate-600 dark:text-slate-300" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
            </div>`;
        }).join('');

        grid.querySelectorAll('[data-photo-open]').forEach(btn => {
            const photo = photos.find(p => String(p.id) === btn.dataset.photoOpen);
            btn.addEventListener('click', () => {
                if (photo) openPhotoPreview(photo, btn, photos);
            });
        });
        grid.querySelectorAll('[data-photo-del]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.StorageModule.deleteGalleryPhoto(btn.dataset.photoDel);
                renderGallery();
                render();
            });
        });
    }

    function setupViewerInteractions() {
        const modal = document.getElementById('photo-preview-modal');
        const stage = document.getElementById('photo-preview-stage');
        const img = document.getElementById('photo-preview-img');
        if (!modal || !stage) return;

        img?.addEventListener('load', () => applyViewerTransform(false));

        document.getElementById('photo-preview-close')?.addEventListener('click', closePhotoPreview);
        document.getElementById('photo-preview-backdrop')?.addEventListener('click', closePhotoPreview);
        document.getElementById('photo-preview-prev')?.addEventListener('click', () => stepViewerPhoto(-1));
        document.getElementById('photo-preview-next')?.addEventListener('click', () => stepViewerPhoto(1));
        document.getElementById('photo-preview-zoom-in')?.addEventListener('click', () => setViewerZoom(viewerScale + 0.5, { animate: true }));
        document.getElementById('photo-preview-zoom-out')?.addEventListener('click', () => setViewerZoom(viewerScale - 0.5, { animate: true }));
        document.getElementById('photo-preview-zoom-reset')?.addEventListener('click', () => setViewerZoom(1, { animate: true }));
        document.getElementById('photo-preview-download')?.addEventListener('click', () => {
            const p = viewerPhotos[viewerIndex];
            if (p) downloadPhotoById(p.id);
        });
        document.getElementById('photo-preview-share')?.addEventListener('click', shareCurrentPhoto);
        document.getElementById('photo-preview-goto-note')?.addEventListener('click', (e) => {
            const noteId = e.currentTarget.dataset.noteId;
            if (noteId) goToLinkedNote(noteId);
        });
        document.getElementById('photo-preview-delete')?.addEventListener('click', () => {
            const p = viewerPhotos[viewerIndex];
            if (!p) return;
            window.StorageModule.deleteGalleryPhoto(p.id);
            renderGallery();
            render();
            const remaining = window.StorageModule.getGalleryPhotos();
            if (remaining.length === 0) {
                closePhotoPreview();
            } else {
                viewerPhotos = remaining;
                viewerIndex = Math.min(viewerIndex, remaining.length - 1);
                updateViewerContent();
            }
        });

        // Doble clic / rueda de ratón
        stage.addEventListener('dblclick', (e) => {
            e.preventDefault();
            setViewerZoom(viewerScale > 1.05 ? 1 : 2.5, {
                animate: true,
                anchorClientX: e.clientX,
                anchorClientY: e.clientY
            });
        });

        stage.addEventListener('wheel', (e) => {
            if (modal.classList.contains('hidden')) return;
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
            setViewerZoom(viewerScale * factor, {
                animate: false,
                anchorClientX: e.clientX,
                anchorClientY: e.clientY
            });
        }, { passive: false });

        // Gestos táctiles y de puntero (pellizco, arrastre acotado, swipe horizontal y cerrar)
        const pointers = new Map();
        let dragStart = null;
        let pinchStartDist = 0;
        let pinchStartScale = 1;
        let lastTap = { time: 0, x: 0, y: 0 };

        function getPinchDistance() {
            const pts = Array.from(pointers.values());
            if (pts.length < 2) return 0;
            return Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        }

        function getPinchCenter() {
            const pts = Array.from(pointers.values());
            return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        }

        stage.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            try { stage.setPointerCapture(e.pointerId); } catch (_) {}
            if (pointers.size === 2) {
                pinchStartDist = getPinchDistance();
                pinchStartScale = viewerScale;
                dragStart = null;
            } else if (pointers.size === 1) {
                dragStart = {
                    x: e.clientX,
                    y: e.clientY,
                    panX: viewerPanX,
                    panY: viewerPanY,
                    time: Date.now(),
                    moved: false
                };
                stage.classList.add('is-dragging');
            }
        });

        stage.addEventListener('pointermove', (e) => {
            if (!pointers.has(e.pointerId)) return;
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pointers.size === 2 && pinchStartDist > 0) {
                const dist = getPinchDistance();
                const center = getPinchCenter();
                setViewerZoom(pinchStartScale * (dist / pinchStartDist), {
                    animate: false,
                    anchorClientX: center.x,
                    anchorClientY: center.y
                });
            } else if (pointers.size === 1 && dragStart) {
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;
                if (Math.hypot(dx, dy) > 6) dragStart.moved = true;
                if (viewerScale > 1.001) {
                    viewerPanX = dragStart.panX + dx;
                    viewerPanY = dragStart.panY + dy;
                    applyViewerTransform(false);
                }
            }
        });

        function finishPointer(e) {
            pointers.delete(e.pointerId);
            stage.classList.remove('is-dragging');
            if (pointers.size < 2) pinchStartDist = 0;
            if (pointers.size === 0 && dragStart) {
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;
                const dt = Date.now() - dragStart.time;
                if (viewerScale <= 1.01) {
                    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.35 && dt < 650) {
                        stepViewerPhoto(dx < 0 ? 1 : -1);
                    } else if (dy > 90 && dy > Math.abs(dx) * 1.4 && dt < 650) {
                        closePhotoPreview();
                    } else if (!dragStart.moved) {
                        const now = Date.now();
                        if (now - lastTap.time < 300 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 28) {
                            setViewerZoom(viewerScale > 1.05 ? 1 : 2.5, {
                                animate: true,
                                anchorClientX: e.clientX,
                                anchorClientY: e.clientY
                            });
                            lastTap = { time: 0, x: 0, y: 0 };
                        } else {
                            lastTap = { time: now, x: e.clientX, y: e.clientY };
                        }
                    }
                }
                dragStart = null;
            }
        }

        stage.addEventListener('pointerup', finishPointer);
        stage.addEventListener('pointercancel', finishPointer);

        // Atajos de teclado y trampa de foco cuando el visor está abierto
        document.addEventListener('keydown', (e) => {
            if (modal.classList.contains('hidden')) {
                if (e.key === 'Escape') closeUnlockModal();
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                closePhotoPreview();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                stepViewerPhoto(-1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                stepViewerPhoto(1);
            } else if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                setViewerZoom(viewerScale + 0.5, { animate: true });
            } else if (e.key === '-') {
                e.preventDefault();
                setViewerZoom(viewerScale - 0.5, { animate: true });
            } else if (e.key === '0') {
                e.preventDefault();
                setViewerZoom(1, { animate: true });
            } else if (e.key === 'Tab') {
                const focusables = Array.from(modal.querySelectorAll('button:not(.hidden):not([disabled])'))
                    .filter(el => el.offsetParent !== null);
                if (focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    }

    const NOTE_TYPES = {
        idea: {
            id: 'idea',
            label: 'Idea',
            emoji: '💡',
            badgeClass: 'note-badge-idea',
            dotColor: '#F59E0B'
        },
        apunte: {
            id: 'apunte',
            label: 'Apunte Rápido',
            emoji: '📝',
            badgeClass: 'note-badge-apunte',
            dotColor: '#6366F1'
        },
        pendiente: {
            id: 'pendiente',
            label: 'Pendiente',
            emoji: '📌',
            badgeClass: 'note-badge-pendiente',
            dotColor: '#10B981'
        },
        importante: {
            id: 'importante',
            label: 'Importante',
            emoji: '⚠️',
            badgeClass: 'note-badge-importante',
            dotColor: '#EF4444'
        },
        personal: {
            id: 'personal',
            label: 'Personal',
            emoji: '🔒',
            badgeClass: 'note-badge-personal',
            dotColor: '#A855F7'
        }
    };

    function init() {
        setupEventListeners();
        setupViewerInteractions();
        window.StorageModule?.hydrateAndMigrateGalleryIdb?.().then(() => {
            renderGallery();
            render();
        });
    }

    function setupEventListeners() {
        // Pestañas segmentadas Notas | Galería
        document.getElementById('notes-tab-notes')?.addEventListener('click', () => {
            window.HapticsModule?.light?.();
            switchNotesTab('notes');
        });
        document.getElementById('notes-tab-gallery')?.addEventListener('click', () => {
            window.HapticsModule?.light?.();
            switchNotesTab('gallery');
        });

        // Formulario de Nota
        const form = document.getElementById('note-form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                handleFormSubmit();
            };
        }

        // Buscador de Notas
        const searchInput = document.getElementById('notes-search-input');
        if (searchInput) {
            searchInput.oninput = (e) => {
                searchQuery = e.target.value.toLowerCase().trim();
                render();
            };
        }

        // Filtros por Categoría de Nota
        document.querySelectorAll('[data-note-filter]').forEach(btn => {
            btn.onclick = () => {
                window.HapticsModule?.light();
                document.querySelectorAll('[data-note-filter]').forEach(b => {
                    b.classList.remove('bg-indigo-600', 'text-white', 'shadow-md', 'note-filter-active', 'text-slate-600', 'dark:text-slate-400');
                    b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-200');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('bg-indigo-600', 'text-white', 'shadow-md', 'note-filter-active');
                btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-400', 'text-slate-700', 'dark:text-slate-200');
                btn.setAttribute('aria-pressed', 'true');
                currentFilter = btn.dataset.noteFilter;
                render();
            };
        });

        // Toggle del checkbox de recordatorio en el modal
        const reminderCheckbox = document.getElementById('note-has-reminder');
        const reminderContainer = document.getElementById('note-reminder-datetime-container');
        if (reminderCheckbox && reminderContainer) {
            reminderCheckbox.onchange = () => {
                window.HapticsModule?.light();
                if (reminderCheckbox.checked) {
                    reminderContainer.classList.remove('hidden');
                    const dtInput = document.getElementById('note-reminder-datetime');
                    if (dtInput && !dtInput.value) {
                        // Por defecto, sugerir 1 hora después
                        const d = new Date(Date.now() + 3600000);
                        const isoStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        dtInput.value = isoStr;
                    }
                } else {
                    reminderContainer.classList.add('hidden');
                }
            };
        }

        // Nota privada: mostrar/ocultar campo de PIN
        const pwToggle = document.getElementById('note-password-toggle');
        pwToggle?.addEventListener('change', () => {
            document.getElementById('note-password-container')?.classList.toggle('hidden', !pwToggle.checked);
        });

        // Desbloqueo de notas privadas
        document.getElementById('note-unlock-confirm')?.addEventListener('click', submitUnlock);
        document.getElementById('note-unlock-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); submitUnlock(); }
        });
        document.getElementById('note-unlock-cancel')?.addEventListener('click', closeUnlockModal);
        document.getElementById('note-unlock-backdrop')?.addEventListener('click', closeUnlockModal);

        // Galería y adjuntos dentro del modal de nota
        document.getElementById('notes-photo-input')?.addEventListener('change', (e) => handlePhotoUpload(e.target));
        document.getElementById('note-modal-photo-input')?.addEventListener('change', (e) => handleModalPhotoAttach(e.target));

        // Botón CTA de Nueva Nota
        document.getElementById('add-note-btn')?.addEventListener('click', () => {
            openAddModal();
        });
        document.getElementById('empty-add-note-btn')?.addEventListener('click', () => {
            openAddModal();
        });

        // Botones de cierre del modal
        document.getElementById('close-note-modal')?.addEventListener('click', () => closeModal());
        document.getElementById('cancel-note-btn')?.addEventListener('click', () => closeModal());
        document.getElementById('note-modal-backdrop')?.addEventListener('click', () => closeModal());
    }

    function openAddModal() {
        window.HapticsModule?.light();
        editingNoteId = null;
        pendingModalPhotoQueue = [];
        document.getElementById('note-modal-title').textContent = 'Nueva Nota Rápida';
        const form = document.getElementById('note-form');
        if (form) form.reset();

        const reminderCheckbox = document.getElementById('note-has-reminder');
        const reminderContainer = document.getElementById('note-reminder-datetime-container');
        if (reminderCheckbox) reminderCheckbox.checked = false;
        if (reminderContainer) reminderContainer.classList.add('hidden');
        document.getElementById('note-password-container')?.classList.add('hidden');

        // Seleccionar tipo por defecto
        const typeSelect = document.getElementById('note-type');
        if (typeSelect) typeSelect.value = 'apunte';
        renderModalPhotosList(null);

        openModal();
    }

    function openEditModal(id) {
        window.HapticsModule?.light();
        const Storage = window.StorageModule;
        const notes = Storage.getNotes();
        const note = notes.find(n => String(n.id) === String(id));
        if (!note) return false;

        if (isLocked(note)) {
            openUnlockModal(id);
            return true;
        }

        editingNoteId = id;
        pendingModalPhotoQueue = [];
        const pwToggle = document.getElementById('note-password-toggle');
        const pwContainer = document.getElementById('note-password-container');
        const pwInput = document.getElementById('note-password-input');
        if (pwToggle) pwToggle.checked = Boolean(note.hasPassword);
        if (pwContainer) pwContainer.classList.toggle('hidden', !note.hasPassword);
        if (pwInput) pwInput.value = '';
        document.getElementById('note-modal-title').textContent = 'Editar Nota';
        document.getElementById('note-title').value = note.title;
        document.getElementById('note-content').value = note.content || '';
        document.getElementById('note-type').value = note.type || 'apunte';

        const reminderCheckbox = document.getElementById('note-has-reminder');
        const reminderContainer = document.getElementById('note-reminder-datetime-container');
        const reminderInput = document.getElementById('note-reminder-datetime');

        if (reminderCheckbox) {
            reminderCheckbox.checked = Boolean(note.hasReminder);
        }
        if (reminderContainer) {
            if (note.hasReminder) {
                reminderContainer.classList.remove('hidden');
                if (reminderInput) reminderInput.value = note.reminderDateTime || '';
            } else {
                reminderContainer.classList.add('hidden');
                if (reminderInput) reminderInput.value = '';
            }
        }
        renderModalPhotosList(id);

        openModal();
        return false;
    }

    function openModal() {
        const modal = document.getElementById('note-modal');
        if (modal) {
            modal.style.display = '';
            const backdrop = document.getElementById('note-modal-backdrop');
            if (backdrop) {
                backdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
                backdrop.style.opacity = '';
            }
            const sheet = modal.querySelector('.mobile-bottom-sheet');
            if (sheet) {
                sheet.style.transform = '';
                sheet.style.transition = '';
                sheet.style.maxHeight = '';
            }
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
            requestAnimationFrame(() => {
                modal.classList.add('active');
            });
            setTimeout(() => {
                document.getElementById('note-title')?.focus();
            }, 120);
        }
    }

    function closeModal() {
        window.HapticsModule?.light();
        const modal = document.getElementById('note-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.classList.remove('overflow-hidden');
            }, 200);
        }
        editingNoteId = null;
        pendingModalPhotoQueue = [];
    }

    function handleFormSubmit() {
        const titleInput = document.getElementById('note-title');
        const contentInput = document.getElementById('note-content');
        const typeSelect = document.getElementById('note-type');
        const reminderCheckbox = document.getElementById('note-has-reminder');
        const reminderDatetimeInput = document.getElementById('note-reminder-datetime');

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const type = typeSelect.value;
        const hasReminder = Boolean(reminderCheckbox?.checked);
        const reminderDateTime = hasReminder ? reminderDatetimeInput.value : '';

        if (!title) {
            window.showNotification?.('Por favor ingresa un título para la nota.', 'warning');
            return;
        }

        if (hasReminder && !reminderDateTime) {
            window.showNotification?.('Por favor selecciona la fecha y hora para el recordatorio.', 'warning');
            return;
        }

        const Storage = window.StorageModule;

        // Privacidad por PIN
        const wantsPassword = Boolean(document.getElementById('note-password-toggle')?.checked);
        const pinValue = (document.getElementById('note-password-input')?.value || '').trim();
        const existing = editingNoteId ? Storage.getNotes().find(n => String(n.id) === String(editingNoteId)) : null;
        let hasPassword = false;
        let passwordHash = '';
        if (wantsPassword) {
            if (pinValue) {
                if (pinValue.length < 4) {
                    window.showNotification?.('El PIN debe tener al menos 4 caracteres.', 'warning');
                    return;
                }
                hasPassword = true;
                passwordHash = hashPin(pinValue);
            } else if (existing && existing.hasPassword) {
                hasPassword = true;
                passwordHash = existing.passwordHash || '';
            } else {
                window.showNotification?.('Escribe un PIN para proteger la nota.', 'warning');
                return;
            }
        }

        let targetNoteId = editingNoteId;
        if (editingNoteId) {
            const updated = Storage.updateNote(editingNoteId, {
                title,
                content,
                type,
                hasReminder,
                reminderDateTime,
                hasPassword,
                passwordHash
            });
            if (updated) {
                if (hasReminder) {
                    window.NotificationsModule?.scheduleNote(updated);
                } else {
                    window.NotificationsModule?.cancelNote(editingNoteId);
                }
                window.showNotification?.('Nota actualizada correctamente.', 'success');
            }
        } else {
            const newNote = Storage.addNote({
                title,
                content,
                type,
                hasReminder,
                reminderDateTime,
                hasPassword,
                passwordHash
            });
            targetNoteId = newNote.id;
            if (hasPassword) unlockedNotes.add(String(newNote.id));
            if (hasReminder) {
                window.NotificationsModule?.scheduleNote(newNote);
            }
            window.showNotification?.('Nota guardada correctamente.', 'success');
        }

        if (pendingModalPhotoQueue.length > 0 && targetNoteId) {
            const queued = pendingModalPhotoQueue.slice();
            pendingModalPhotoQueue = [];
            Promise.all(queued.map(item => {
                const payload = {
                    id: item.id,
                    name: item.name,
                    fileName: item.fileName,
                    mimeType: item.mimeType,
                    byteLength: item.byteLength,
                    dataUrl: item.dataUrl,
                    thumbUrl: item.thumbUrl,
                    noteId: String(targetNoteId),
                    noteTitle: hasPassword ? '' : title,
                    createdAt: item.createdAt
                };
                return typeof Storage.saveGalleryPhotoToIdb === 'function'
                    ? Storage.saveGalleryPhotoToIdb(payload, item.file)
                    : Storage.saveGalleryPhoto(payload);
            })).then(() => {
                renderGallery();
                render();
            });
        }

        window.HapticsModule?.double();
        closeModal();
        window.onDataChanged?.();
        render();
    }

    function deleteNote(id) {
        if (!confirm('¿Estás seguro de eliminar esta nota?')) return;

        window.HapticsModule?.double();
        window.NotificationsModule?.cancelNote(id);
        const Storage = window.StorageModule;
        Storage.deleteNote(id);
        window.showNotification?.('Nota eliminada.', 'info');
        window.onDataChanged?.();
        render();
    }

    function archiveNote(id) {
        window.HapticsModule?.medium();
        window.NotificationsModule?.cancelNote(id);
        const Storage = window.StorageModule;
        const archived = Storage.archiveNote(id);
        if (archived) {
            window.showNotification?.('Nota archivada en el baúl.', 'info');
            window.onDataChanged?.();
            render();
            window.ArchiveModule?.render?.();
        }
    }

    function copyNoteContent(content) {
        if (!content) return;
        window.HapticsModule?.light();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(content)
                .then(() => window.showNotification?.('Contenido copiado al portapapeles.', 'success'))
                .catch(() => window.showNotification?.('No se pudo copiar.', 'warning'));
        }
    }

    function render() {
        const Storage = window.StorageModule;
        const container = document.getElementById('notes-grid');
        const emptyState = document.getElementById('notes-empty-state');
        const countBadge = document.getElementById('notes-count-badge');
        const drawerCount = document.getElementById('drawer-note-count');
        const navCount = document.getElementById('nav-note-count');

        if (!container || !Storage) return;

        renderGallery();
        refreshPhotoNoteSelect();
        const longPress = typeof Storage.isLongPressEnabled === 'function' ? Storage.isLongPressEnabled() : true;
        const allGalleryPhotos = Storage.getGalleryPhotos();
        const photosByNote = new Map();
        allGalleryPhotos.forEach(p => {
            if (!p.noteId) return;
            const k = String(p.noteId);
            if (!photosByNote.has(k)) photosByNote.set(k, []);
            photosByNote.get(k).push(p);
        });

        let notes = Storage.getNotes();

        // Actualizar contadores globales
        if (countBadge) countBadge.textContent = notes.length;
        if (drawerCount) drawerCount.textContent = notes.length;
        if (navCount) navCount.textContent = notes.length;

        // Filtrado por categoría
        if (currentFilter !== 'all') {
            notes = notes.filter(n => n.type === currentFilter);
        }

        // Búsqueda en vivo
        if (searchQuery) {
            notes = notes.filter(n =>
                !isLocked(n) && (
                    (n.title && n.title.toLowerCase().includes(searchQuery)) ||
                    (n.content && n.content.toLowerCase().includes(searchQuery))
                )
            );
        }

        if (notes.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        container.innerHTML = notes.map((note, index) => {
            if (isLocked(note)) {
                return `
                <div data-note-id="${escapeHtml(note.id)}" class="note-card-locked stagger-card bg-white dark:bg-slate-800 rounded-3xl p-5 border border-dashed border-purple-300 dark:border-purple-800 shadow-xs card-hover flex flex-col items-center justify-center text-center gap-2 min-h-[120px]"
                     style="--stagger-i: ${index};">
                    <span class="text-3xl">🔒</span>
                    <span class="text-sm font-bold text-slate-800 dark:text-white">Nota Privada</span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">Haz clic para desbloquear</span>
                </div>`;
            }
            const typeInfo = NOTE_TYPES[note.type] || NOTE_TYPES.apunte;
            const notePhotos = photosByNote.get(String(note.id)) || [];
            const rawDate = note.createdAt || note.updatedAt;
            const parsedDate = rawDate ? new Date(rawDate) : null;
            const dateFormatted = (parsedDate && !isNaN(parsedDate.getTime()))
                ? parsedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                : '';

            // Formatear recordatorio si existe
            let reminderBadge = '';
            if (note.hasReminder && note.reminderDateTime) {
                const remDate = new Date(note.reminderDateTime);
                const remStr = !isNaN(remDate.getTime())
                    ? remDate.toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : note.reminderDateTime.replace('T', ' ');
                reminderBadge = `
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>${remStr}</span>
                    </div>
                `;
            }

            const photoBadge = notePhotos.length > 0 ? `
                <button type="button" data-note-open-photos="${escapeHtml(note.id)}"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 tap-effect">
                    <span>🖼️</span>
                    <span>${notePhotos.length}</span>
                </button>` : '';

            return `
                <div data-note-id="${escapeHtml(note.id)}" class="stagger-card bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs card-hover flex flex-col justify-between"
                     style="--stagger-i: ${index};">
                    <div>
                        <!-- Fila superior: Categoría y Acciones -->
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <span class="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.8 rounded-full ${typeInfo.badgeClass}">
                                <span>${typeInfo.emoji}</span>
                                <span>${typeInfo.label}</span>
                            </span>
                            
                            <div class="flex items-center gap-1">
                                ${longPress ? '' : `
                                <button type="button" data-action="edit" data-note-edit="${note.id}" class="px-2 py-1 rounded-xl text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-slate-700 dark:text-indigo-300 tap-effect">✏️ Editar</button>
                                <button type="button" data-action="delete" data-note-delete="${note.id}" class="px-2 py-1 rounded-xl text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 tap-effect">🗑️ Eliminar</button>`}
                                <!-- Botón Copiar -->
                                ${note.content ? `
                                    <button type="button" data-note-copy="${note.id}"
                                        class="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 tap-effect"
                                        title="Copiar texto">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                        </svg>
                                    </button>
                                ` : ''}
                                <!-- Botón Archivar -->
                                <button type="button" data-note-archive="${note.id}"
                                    class="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 tap-effect"
                                    title="Archivar en el baúl">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Título de la nota -->
                        <h3 class="text-base font-bold text-slate-900 dark:text-white leading-snug mb-2">
                            ${escapeHtml(note.title)}
                        </h3>

                        <!-- Contenido -->
                        ${note.content ? `
                            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed mb-4 line-clamp-6">
                                ${escapeHtml(note.content)}
                            </p>
                        ` : ''}
                    </div>

                    <!-- Fila inferior: Recordatorio, Fotos & Fecha -->
                    <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            ${reminderBadge}
                            ${photoBadge}
                        </div>
                        <span class="font-mono">${dateFormatted}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Vincular menú contextual por pulsación prolongada y listeners en cada tarjeta de nota
        const cards = container.querySelectorAll('[data-note-id]');
        cards.forEach((card, i) => {
            const note = notes[i];
            if (!note) return;

            if (isLocked(note)) {
                card.addEventListener('click', () => openUnlockModal(note.id));
                return;
            }

            if (longPress) {
                window.CardContextMenu?.bind?.(card, {
                    title: note.title || 'Nota',
                    onEdit: () => openEditModal(note.id),
                    onDelete: () => deleteNote(note.id)
                });
            }
            card.querySelector('[data-note-edit]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(note.id);
            });
            card.querySelector('[data-note-delete]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteNote(note.id);
            });

            card.querySelector('[data-note-archive]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                archiveNote(note.id);
            });

            card.querySelector('[data-note-copy]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                copyNoteContent(note.content || note.title);
            });

            card.querySelector('[data-note-open-photos]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                const list = photosByNote.get(String(note.id)) || [];
                if (list.length > 0) openPhotoPreview(list[0], e.currentTarget, list);
            });
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    return {
        init,
        render,
        openAddModal,
        openEditModal,
        closeModal,
        deleteNote,
        unlockNote,
        isNoteUnlocked,
        renderGallery,
        switchNotesTab,
        openPhotoPreview,
        closePhotoPreview,
        setViewerZoom,
        downloadPhotoById,
        getViewerState: () => ({
            index: viewerIndex,
            total: viewerPhotos.length,
            scale: viewerScale,
            panX: viewerPanX,
            panY: viewerPanY,
            photoId: viewerPhotos[viewerIndex]?.id || null
        })
    };
})();
