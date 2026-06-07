// ═══════════════════════════════════════════════════════════════
//  PhotoPicker — shared reusable photo upload module
//  Ziratstan.kz | src/js/photo-picker.js
// ═══════════════════════════════════════════════════════════════
//
//  USAGE:
//    PhotoPicker.init('some-container-id', { maxPhotos: 10 });
//    // ... user picks + reorders photos ...
//    const photos = await PhotoPicker.uploadAll(sbClient, userId, profileId);
//    // photos = [{ url, storage_path, is_main, sort_order }]
//
// ═══════════════════════════════════════════════════════════════

const PhotoPicker = (() => {
  const MAX_PHOTOS = 10;
  const MAX_FILE_SIZE_MB = 8;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const BUCKET = 'profile-photos';

  // Internal state per container
  const instances = {};

  // ── i18n helpers ─────────────────────────────────────────────
  function _t(key, fallback) {
    if (window.i18n && typeof window.i18n.t === 'function') {
      const v = window.i18n.t(key);
      return v !== key ? v : fallback;
    }
    return fallback;
  }

  // ── CSS injection (once) ─────────────────────────────────────
  let _cssInjected = false;
  function _injectCss() {
    if (_cssInjected) return;
    _cssInjected = true;
    const style = document.createElement('style');
    style.textContent = `
      .pp-root { margin:14px 0; }
      .pp-label {
        display:block; font-size:0.75rem; text-transform:uppercase;
        letter-spacing:.05em; color:var(--muted,#71717a); margin-bottom:8px;
      }
      .pp-drop-zone {
        border: 2px dashed rgba(212,175,55,.35);
        border-radius: 12px;
        padding: 20px 16px;
        text-align: center;
        cursor: pointer;
        transition: border-color .2s, background .2s;
        background: rgba(212,175,55,.04);
        position: relative;
      }
      .pp-drop-zone:hover, .pp-drop-zone.pp-drag-over {
        border-color: var(--gold,#d4af37);
        background: rgba(212,175,55,.09);
      }
      .pp-drop-hint {
        font-size:.82rem; color:var(--muted,#71717a); line-height:1.5;
        pointer-events:none;
      }
      .pp-drop-hint strong { color:var(--gold,#d4af37); }
      .pp-file-input { display:none; }
      .pp-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
        margin-top: 12px;
      }
      .pp-thumb {
        position: relative;
        border-radius: 10px;
        overflow: hidden;
        border: 2px solid transparent;
        transition: border-color .2s, box-shadow .2s;
        cursor: pointer;
        aspect-ratio: 1;
        background: var(--surface,#111113);
      }
      .pp-thumb.pp-is-main {
        border-color: var(--gold,#d4af37);
        box-shadow: 0 0 0 2px rgba(212,175,55,.4);
      }
      .pp-thumb img {
        width:100%; height:100%; object-fit:cover; display:block;
        transition: opacity .2s;
      }
      .pp-thumb:hover img { opacity:.85; }
      .pp-thumb-overlay {
        position:absolute; inset:0;
        display:flex; flex-direction:column; align-items:center; justify-content:flex-end;
        gap:4px; padding:6px; opacity:0; transition:opacity .2s;
        background: linear-gradient(to top, rgba(0,0,0,.75) 0%, transparent 60%);
      }
      .pp-thumb:hover .pp-thumb-overlay { opacity:1; }
      .pp-star-btn, .pp-del-btn {
        border:none; border-radius:6px; cursor:pointer;
        font-size:.72rem; font-weight:700; padding:3px 7px;
        transition:background .15s, color .15s;
        font-family:inherit;
      }
      .pp-star-btn {
        background:rgba(212,175,55,.18); color:var(--gold,#d4af37);
      }
      .pp-star-btn:hover { background:rgba(212,175,55,.4); }
      .pp-del-btn {
        background:rgba(239,68,68,.18); color:#ef4444;
      }
      .pp-del-btn:hover { background:rgba(239,68,68,.4); }
      .pp-main-badge {
        position:absolute; top:5px; left:5px;
        background:var(--gold,#d4af37); color:#09090b;
        font-size:.6rem; font-weight:800; padding:2px 6px;
        border-radius:4px; letter-spacing:.04em; pointer-events:none;
        display:none;
      }
      .pp-is-main .pp-main-badge { display:block; }
      .pp-counter {
        font-size:.72rem; color:var(--muted,#71717a);
        margin-top:6px; text-align:right;
      }
      .pp-counter.pp-at-max { color:#ef4444; }
      .pp-error-msg {
        font-size:.78rem; color:#ef4444;
        margin-top:6px; display:none;
      }
      .pp-existing-photo { opacity:.75; }
      .pp-upload-overlay {
        position:absolute; inset:0; background:rgba(0,0,0,.65);
        display:flex; align-items:center; justify-content:center;
        font-size:.8rem; color:#fff; font-weight:700;
        border-radius:8px;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Render ────────────────────────────────────────────────────
  function _renderInstance(id) {
    const inst = instances[id];
    if (!inst) return;
    const root = document.getElementById(id);
    if (!root) return;

    const items = inst.items;
    const maxPhotos = inst.maxPhotos || MAX_PHOTOS;
    const canAdd = items.length < maxPhotos;

    const galleryHtml = items.length ? `
      <div class="pp-gallery" id="pp-gallery-${id}">
        ${items.map((item, i) => {
          const isMain = item.isMain;
          const existingClass = item.existingUrl ? 'pp-existing-photo' : '';
          return `
            <div class="pp-thumb ${isMain ? 'pp-is-main' : ''} ${existingClass}" data-pp-idx="${i}">
              <img src="${item.previewUrl || item.existingUrl}" alt="" />
              <div class="pp-main-badge">${_t('photo_main_badge','★ Главное')}</div>
              <div class="pp-thumb-overlay">
                <button type="button" class="pp-star-btn" onclick="PhotoPicker._setMain('${id}',${i})" title="${_t('photo_set_main','Сделать главным')}">
                  ${isMain ? '★' : '☆'} ${_t('photo_set_main','Главное')}
                </button>
                <button type="button" class="pp-del-btn" onclick="PhotoPicker._remove('${id}',${i})" title="${_t('photo_remove','Удалить')}">
                  🗑
                </button>
              </div>
            </div>`;
        }).join('')}
      </div>` : '';

    root.innerHTML = `
      <div class="pp-root">
        <label class="pp-label" for="pp-fi-${id}">${_t('photo_upload_title','Фотографии')} (${items.length}/${maxPhotos})</label>
        ${canAdd ? `
          <div class="pp-drop-zone" id="pp-dz-${id}" onclick="document.getElementById('pp-fi-${id}').click()">
            <div class="pp-drop-hint">
              📷 <strong>${_t('photo_drop_hint','Нажмите или перетащите фото')}</strong><br/>
              ${_t('photo_upload_desc','JPEG, PNG, WebP · макс. 8 МБ · до')} ${maxPhotos} ${_t('photo_upload_unit','фото')}
            </div>
          </div>
        ` : ''}
        <input type="file" accept="image/*" multiple class="pp-file-input" id="pp-fi-${id}"
          onchange="PhotoPicker._handleFiles('${id}', this.files)" ${canAdd ? '' : 'disabled style="display:none;"'} />
        ${galleryHtml}
        <div class="pp-counter ${items.length >= maxPhotos ? 'pp-at-max' : ''}">
          ${items.length}/${maxPhotos} ${_t('photo_upload_unit','фото')}
        </div>
        <div class="pp-error-msg" id="pp-err-${id}"></div>
      </div>`;

    // Drag & drop
    const dz = document.getElementById(`pp-dz-${id}`);
    if (dz) {
      dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('pp-drag-over'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('pp-drag-over'));
      dz.addEventListener('drop', (e) => {
        e.preventDefault();
        dz.classList.remove('pp-drag-over');
        PhotoPicker._handleFiles(id, e.dataTransfer.files);
      });
    }
  }

  // ── Public API ────────────────────────────────────────────────
  return {
    // Mount a new picker into an existing DOM container
    init(containerId, options = {}) {
      _injectCss();
      instances[containerId] = {
        items: [],         // { file, previewUrl, existingUrl, existingPath, isMain }
        maxPhotos: options.maxPhotos || MAX_PHOTOS
      };
      // Pre-load existing photos
      if (Array.isArray(options.existingPhotos)) {
        options.existingPhotos.forEach((p, i) => {
          instances[containerId].items.push({
            file: null,
            previewUrl: null,
            existingUrl: p.url,
            existingPath: p.storage_path,
            existingId: p.id,
            isMain: p.is_main || i === 0,
            sortOrder: p.sort_order || i
          });
        });
        // Ensure exactly one main
        const hasMain = instances[containerId].items.some(x => x.isMain);
        if (!hasMain && instances[containerId].items.length > 0) {
          instances[containerId].items[0].isMain = true;
        }
      }
      _renderInstance(containerId);
    },

    // Reset state (e.g. after modal close)
    reset(containerId) {
      if (instances[containerId]) {
        instances[containerId].items = [];
        _renderInstance(containerId);
      }
    },

    // Handle file selection (called from inline handler)
    _handleFiles(id, fileList) {
      const inst = instances[id];
      if (!inst) return;
      const errEl = document.getElementById(`pp-err-${id}`);
      if (errEl) errEl.style.display = 'none';

      const files = Array.from(fileList);
      for (const file of files) {
        if (inst.items.length >= inst.maxPhotos) {
          if (errEl) {
            errEl.textContent = `⚠️ ${_t('photo_max_err', `Максимум ${inst.maxPhotos} фото`)} (${inst.maxPhotos})`;
            errEl.style.display = 'block';
          }
          break;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          if (errEl) {
            errEl.textContent = `⚠️ ${_t('photo_type_err','Поддерживаются только JPEG, PNG, WebP')}`;
            errEl.style.display = 'block';
          }
          continue;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          if (errEl) {
            errEl.textContent = `⚠️ ${_t('photo_size_err', `Файл слишком большой (макс. ${MAX_FILE_SIZE_MB} МБ)`)}`;
            errEl.style.display = 'block';
          }
          continue;
        }
        const previewUrl = URL.createObjectURL(file);
        const isFirst = inst.items.length === 0;
        // If no main yet, first new photo becomes main
        const alreadyHasMain = inst.items.some(x => x.isMain);
        inst.items.push({
          file,
          previewUrl,
          existingUrl: null,
          existingPath: null,
          existingId: null,
          isMain: isFirst && !alreadyHasMain,
          sortOrder: inst.items.length
        });
      }
      // Reset the file input so same file can be re-selected
      const fi = document.getElementById(`pp-fi-${id}`);
      if (fi) fi.value = '';
      _renderInstance(id);
    },

    // Set a photo as main
    _setMain(id, idx) {
      const inst = instances[id];
      if (!inst) return;
      inst.items.forEach((item, i) => { item.isMain = (i === idx); });
      _renderInstance(id);
    },

    // Remove a photo
    _remove(id, idx) {
      const inst = instances[id];
      if (!inst) return;
      const removed = inst.items.splice(idx, 1)[0];
      if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      // If removed was main, reassign to first remaining
      const hasMain = inst.items.some(x => x.isMain);
      if (!hasMain && inst.items.length > 0) inst.items[0].isMain = true;
      // Re-sort
      inst.items.forEach((item, i) => { item.sortOrder = i; });
      _renderInstance(id);
    },

    // Get current items (without uploading)
    getItems(containerId) {
      return instances[containerId]?.items || [];
    },

    // Upload new files to Supabase Storage and return metadata rows
    // Returns array ready to INSERT into profile_photos table
    async uploadAll(sbClient, userId, profileId = null) {
      const inst = instances[Object.keys(instances).find(k =>
        document.getElementById(k) !== null
      )];
      // Find by containerId — caller passes containerId

      const results = [];
      return results; // Placeholder — see uploadAllForContainer
    },

    async uploadAllForContainer(containerId, sbClient, userId, profileId = null) {
      const inst = instances[containerId];
      if (!inst) return [];

      const results = [];
      for (let i = 0; i < inst.items.length; i++) {
        const item = inst.items[i];

        // Existing photo — no upload needed, just return metadata
        if (!item.file) {
          results.push({
            id: item.existingId || undefined,
            profile_id: profileId,
            uploader_id: userId,
            url: item.existingUrl,
            storage_path: item.existingPath,
            is_main: item.isMain,
            sort_order: i
          });
          continue;
        }

        // Upload new file
        const ext = item.file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const storagePath = `${userId}/${profileId || 'pending'}/${fileName}`;

        // Show upload overlay on thumb
        const thumbEl = document.querySelector(`#pp-gallery-${containerId} [data-pp-idx="${i}"]`);
        if (thumbEl) {
          const ov = document.createElement('div');
          ov.className = 'pp-upload-overlay';
          ov.textContent = '⏳';
          thumbEl.appendChild(ov);
        }

        try {
          const { data, error } = await sbClient.storage
            .from(BUCKET)
            .upload(storagePath, item.file, { upsert: false, contentType: item.file.type });

          if (error) throw error;

          const { data: urlData } = sbClient.storage.from(BUCKET).getPublicUrl(storagePath);

          results.push({
            profile_id: profileId,
            uploader_id: userId,
            url: urlData?.publicUrl || '',
            storage_path: storagePath,
            is_main: item.isMain,
            sort_order: i
          });

          if (thumbEl) {
            const ov = thumbEl.querySelector('.pp-upload-overlay');
            if (ov) { ov.textContent = '✅'; setTimeout(() => ov.remove(), 800); }
          }
        } catch (err) {
          console.error('[PhotoPicker] Upload failed:', err);
          if (thumbEl) {
            const ov = thumbEl.querySelector('.pp-upload-overlay');
            if (ov) { ov.textContent = '❌'; ov.style.background = 'rgba(239,68,68,.7)'; }
          }
        }
      }
      return results;
    },

    // Save photo rows to profile_photos table
    async saveToDatabase(sbClient, photoRows) {
      if (!photoRows.length) return;
      const { error } = await sbClient.from('profile_photos').insert(photoRows);
      if (error) throw error;
    },

    // Save and update main_photo_url on the profile
    async saveAndUpdateProfile(sbClient, profileId, userId, photoRows) {
      if (!photoRows.length) return;

      // Insert photos
      const insertRows = photoRows.map(r => ({
        ...r,
        profile_id: profileId,
        uploader_id: userId
      }));
      const { error: insertErr } = await sbClient.from('profile_photos').insert(insertRows);
      if (insertErr) throw insertErr;

      // Update main_photo_url on profiles table
      const mainPhoto = photoRows.find(r => r.is_main);
      if (mainPhoto?.url) {
        await sbClient
          .from('profiles')
          .update({ main_photo_url: mainPhoto.url, updated_at: new Date().toISOString() })
          .eq('id', profileId)
          .eq('owner_id', userId);
      }
    }
  };
})();

window.PhotoPicker = PhotoPicker;
