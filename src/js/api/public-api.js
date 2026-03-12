// Public API wrapper for legacy static pages.
// All data operations go through Firebase Functions /api endpoints.

(function initZiratPublicApi(global) {
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

  function apiBase() {
    return '/api';
  }

  async function submitUgcSuggestion(data) {
    await jsonFetch(apiBase() + '/public/ugc/name', { method: 'POST', body: JSON.stringify(data || {}) });
  }

  async function createServicesLead(data) {
    await jsonFetch(apiBase() + '/public/services/lead', { method: 'POST', body: JSON.stringify(data || {}) });
  }

  async function submitUgcProfile(data) {
    await jsonFetch(apiBase() + '/public/ugc/profile', { method: 'POST', body: JSON.stringify(data || {}) });
  }

  async function submitUgcBio(data) {
    await jsonFetch(apiBase() + '/public/ugc/bio', { method: 'POST', body: JSON.stringify(data || {}) });
  }

  async function fetchVipProfiles() {
    try {
      var res = await jsonFetch(apiBase() + '/public/vip-profiles', { method: 'GET' });
      return (res && res.items) ? res.items : [];
    } catch (_error) {
      return [];
    }
  }

  async function fetchProfileById(id) {
    try {
      var res = await jsonFetch(apiBase() + '/public/profile?id=' + encodeURIComponent(id || ''), { method: 'GET' });
      return res ? res.item : null;
    } catch (_error) {
      return null;
    }
  }

  async function fetchFamilyRelations(profileId) {
    try {
      var res = await jsonFetch(apiBase() + '/public/family?profileId=' + encodeURIComponent(profileId || ''), { method: 'GET' });
      return (res && res.items) ? res.items : [];
    } catch (_error) {
      return [];
    }
  }

  async function resolveQrSlug(slug) {
    try {
      var res = await jsonFetch(apiBase() + '/public/qr/resolve?slug=' + encodeURIComponent(slug || ''), { method: 'GET' });
      return res ? res.item : null;
    } catch (_error) {
      return null;
    }
  }

  async function fetchQrByProfile(profileId) {
    try {
      var res = await jsonFetch(apiBase() + '/public/qr/by-profile?profileId=' + encodeURIComponent(profileId || ''), { method: 'GET' });
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
      var res = await jsonFetch(apiBase() + '/public/profile-id-by-slug?slug=' + encodeURIComponent(normalized), { method: 'GET' });
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
