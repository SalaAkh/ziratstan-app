// Public API wrapper: calls Firebase Functions instead of talking to Supabase directly.
// Exposes the same global function names that legacy pages expect.

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
    // Firebase hosting rewrites /api to the `functions` backend in most setups.
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
    var res = await jsonFetch(apiBase() + '/public/vip-profiles', { method: 'GET' });
    return (res && res.items) ? res.items : [];
  }

  async function fetchProfileById(id) {
    var res = await jsonFetch(apiBase() + '/public/profile?id=' + encodeURIComponent(id || ''), { method: 'GET' });
    return res ? res.item : null;
  }

  async function fetchFamilyRelations(profileId) {
    var res = await jsonFetch(apiBase() + '/public/family?profileId=' + encodeURIComponent(profileId || ''), { method: 'GET' });
    return (res && res.items) ? res.items : [];
  }

  async function resolveQrSlug(slug) {
    var res = await jsonFetch(apiBase() + '/public/qr/resolve?slug=' + encodeURIComponent(slug || ''), { method: 'GET' });
    return res ? res.item : null;
  }

  async function fetchQrByProfile(profileId) {
    var res = await jsonFetch(apiBase() + '/public/qr/by-profile?profileId=' + encodeURIComponent(profileId || ''), { method: 'GET' });
    return res ? res.item : null;
  }

  // QR generation requires auth; keep as explicit error for now.
  async function generateQrSlug(_profileId) {
    throw new Error('QR generation requires authentication. Not available on public API.');
  }

  async function fetchProfileIdBySlug(slug) {
    var res = await jsonFetch(apiBase() + '/public/profile-id-by-slug?slug=' + encodeURIComponent(slug || ''), { method: 'GET' });
    return res ? res.item : null;
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

