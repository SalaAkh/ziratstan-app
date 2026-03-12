// Public API wrapper for legacy static pages.
// All data operations go through Firebase Functions /api endpoints.

(function initZiratPublicApi(global) {
  var FALLBACK_API_BASE = 'https://us-central1-ziratstan-app.cloudfunctions.net/api';
  var VIP_PROFILE_SELECT =
    'id, first_name, last_name, patronymic, birth_date, death_date, epitaph, biography, main_photo_url, cemetery_id, location';

  function mapVipProfiles(rows) {
    return (rows || []).map(function (p) {
      var coordinates = p && p.location && p.location.coordinates ? p.location.coordinates : null;
      var lng = coordinates ? coordinates[0] : null;
      var lat = coordinates ? coordinates[1] : null;

      return {
        id: p.id,
        name: [p.last_name, p.first_name, p.patronymic].filter(Boolean).join(' '),
        birth: p.birth_date ? String(p.birth_date).substring(0, 4) : '?',
        death: p.death_date ? String(p.death_date).substring(0, 4) : '?',
        cemetery: p.cemetery_id || 'Unknown',
        city: '',
        filter: 'historical',
        lat: lat,
        lng: lng,
        photo: p.main_photo_url || '',
        bio: p.biography || '',
        epitaph: p.epitaph || '',
      };
    }).filter(function (p) {
      return p.lat && p.lng;
    });
  }

  function getSupabaseClient() {
    if (global.db && typeof global.db.from === 'function') {
      return global.db;
    }

    if (global._sb && typeof global._sb.from === 'function') {
      return global._sb;
    }

    if (global.__ZIRAT_PUBLIC_API_SB && typeof global.__ZIRAT_PUBLIC_API_SB.from === 'function') {
      return global.__ZIRAT_PUBLIC_API_SB;
    }

    if (!global.supabase || typeof global.supabase.createClient !== 'function') {
      return null;
    }

    if (!global.ZiratConfig || typeof global.ZiratConfig.getSupabaseConfig !== 'function') {
      return null;
    }

    var cfg = global.ZiratConfig.getSupabaseConfig();
    var url = cfg && typeof cfg.SUPABASE_URL === 'string' ? cfg.SUPABASE_URL.trim() : '';
    var anon = cfg && typeof cfg.SUPABASE_ANON_KEY === 'string' ? cfg.SUPABASE_ANON_KEY.trim() : '';

    if (!url || !anon) {
      return null;
    }

    try {
      global.__ZIRAT_PUBLIC_API_SB = global.supabase.createClient(url, anon);
      return global.__ZIRAT_PUBLIC_API_SB;
    } catch (_error) {
      return null;
    }
  }

  async function fetchVipProfilesViaSupabase() {
    var db = getSupabaseClient();
    if (!db) {
      return null;
    }

    var result = await db
      .from('profiles')
      .select(VIP_PROFILE_SELECT)
      .eq('visibility_status', 'public')
      .limit(2000);

    if (result.error) {
      throw result.error;
    }

    return mapVipProfiles(result.data);
  }

  function jsonFetch(url, options) {
    var opts = options || {};
    var method = String(opts.method || 'GET').toUpperCase();
    var hasBody = opts.body !== undefined && opts.body !== null;
    var baseHeaders = {};
    if (hasBody && method !== 'GET' && method !== 'HEAD') {
      baseHeaders['Content-Type'] = 'application/json';
    }
    opts.headers = Object.assign(baseHeaders, opts.headers || {});
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
      var direct = await fetchVipProfilesViaSupabase();
      if (Array.isArray(direct)) {
        return direct;
      }
    } catch (_supabaseError) {}

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
