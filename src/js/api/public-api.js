// Public API wrapper for legacy static pages.
// All data operations go through Firebase Functions /api endpoints.

(function initZiratPublicApi(global) {
  var FALLBACK_API_BASE = 'https://us-central1-ziratstan-app.cloudfunctions.net/api';

  function jsonFetch(url, options) {
    var opts = options || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch(url, opts).then(function (res) {
      return res.text().then(function (text) {
        var payload = null;
        try { payload = text ? JSON.parse(text) : null; } catch (_e) {}
        if (!res.ok) {
          var message = (payload && payload.error) ? payload.error : (text || ('HTTP ' + res.status));
          var err = new Error(message);
          err.status = res.status;
          err.payload = payload;
          throw err;
        }
        return payload;
      });
    });
  }

  function primaryApiBase() {
    if (typeof global.ZIRAT_API_BASE === 'string' && global.ZIRAT_API_BASE.trim()) {
      return global.ZIRAT_API_BASE.trim().replace(/\/+$/, '');
    }
    return '/api';
  }

  function shouldTryFallback(error) {
    if (!error) return true;
    if (error.status === 404 || error.status === 502 || error.status === 503) return true;
    var message = String(error.message || '').toLowerCase();
    return message.includes('failed to fetch') || message.includes('networkerror');
  }

  async function apiFetch(path, options) {
    var base = primaryApiBase();
    try {
      return await jsonFetch(base + path, options);
    } catch (error) {
      if (base === FALLBACK_API_BASE || !shouldTryFallback(error)) {
        throw error;
      }
      return await jsonFetch(FALLBACK_API_BASE + path, options);
    }
  }

  async function submitUgcSuggestion(data) {
    await apiFetch('/public/ugc/name', { method: 'POST', body: JSON.stringify(data || {}) });
  }

  async function createServicesLead(data) {
    await apiFetch('/public/services/lead', { method: 'POST', body: JSON.stringify(data || {}) });
  }

  async function submitUgcProfile(data) {
    await apiFetch('/public/ugc/profile', { method: 'POST', body: JSON.stringify(data || {}) });
  }

  async function submitUgcBio(data) {
    await apiFetch('/public/ugc/bio', { method: 'POST', body: JSON.stringify(data || {}) });
  }

  async function fetchVipProfiles() {
    try {
      var res = await apiFetch('/public/vip-profiles', { method: 'GET' });
      return (res && res.items) ? res.items : [];
    } catch (_error) {
      return [];
    }
  }

  async function fetchProfileById(id) {
    try {
      var res = await apiFetch('/public/profile?id=' + encodeURIComponent(id || ''), { method: 'GET' });
      return res ? res.item : null;
    } catch (_error) {
      return null;
    }
  }

  async function fetchFamilyRelations(profileId) {
    try {
      var res = await apiFetch('/public/family?profileId=' + encodeURIComponent(profileId || ''), { method: 'GET' });
      return (res && res.items) ? res.items : [];
    } catch (_error) {
      return [];
    }
  }

  async function resolveQrSlug(slug) {
    try {
      var res = await apiFetch('/public/qr/resolve?slug=' + encodeURIComponent(slug || ''), { method: 'GET' });
      return res ? res.item : null;
    } catch (_error) {
      return null;
    }
  }

  async function fetchQrByProfile(profileId) {
    try {
      var res = await apiFetch('/public/qr/by-profile?profileId=' + encodeURIComponent(profileId || ''), { method: 'GET' });
      return res ? res.item : null;
    } catch (_error) {
      return null;
    }
  }

  async function generateQrSlug(_profileId) {
    throw new Error('QR generation requires authenticated API flow');
  }

  async function fetchProfileIdBySlug(slug) {
    try {
      var normalized = String(slug || '').trim();
      if (!normalized) return null;
      var res = await apiFetch('/public/profile-id-by-slug?slug=' + encodeURIComponent(normalized), { method: 'GET' });
      return res ? res.item : null;
    } catch (_error) {
      return null;
    }
  }

  global.submitUgcSuggestion = submitUgcSuggestion;
  global.createServicesLead = createServicesLead;
  global.submitUgcProfile = submitUgcProfile;
  global.submitUgcBio = submitUgcBio;
  global.fetchVipProfiles = fetchVipProfiles;
  global.fetchProfileById = fetchProfileById;
  global.fetchFamilyRelations = fetchFamilyRelations;
  global.resolveQrSlug = resolveQrSlug;
  global.fetchQrByProfile = fetchQrByProfile;
  global.generateQrSlug = generateQrSlug;
  global.fetchProfileIdBySlug = fetchProfileIdBySlug;
})(window);
