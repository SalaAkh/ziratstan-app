// Public API via direct Supabase Client (bypassing Firebase Functions for Cost/CORS optimization)

(function initZiratPublicApi(global) {
  
  // Initialize Supabase Client dynamically
  function getSb() {
    if (global._public_sb) return global._public_sb;
    if (global.window && global.window.supabaseClient) return global.window.supabaseClient;
    
    var cfg = global.ZiratConfig?.getSupabaseConfig?.() || {};
    var SB_URL = cfg.SUPABASE_URL || '';
    var SB_KEY = cfg.SUPABASE_ANON_KEY || '';

    if (global.supabase && SB_URL && SB_KEY) {
      global._public_sb = global.supabase.createClient(SB_URL, SB_KEY);
      return global._public_sb;
    }
    
    // Fallback if supabase.js isn't loaded - gracefully fail API calls
    console.warn("Ziratstan: Supabase JS is not loaded or config is missing.");
    return null;
  }

  async function submitUgcSuggestion(data) {
    var sb = getSb();
    if (!sb) throw new Error('API Client not initialized');
    var { error } = await sb.from('ugc_submissions').insert([{
      cemetery_id: data.cemetery_id || data.cemeteryId || null,
      current_name: data.current_name || data.currentName || null,
      suggested_name: data.suggested_name || data.suggestedName || null,
      lat: data.lat || null,
      lng: data.lng || null,
      comment: data.comment || null
    }]);
    if (error) throw error;
  }

  async function createServicesLead(data) {
    var sb = getSb();
    if (!sb) throw new Error('API Client not initialized');
    var { error } = await sb.from('services_leads').insert([{
      service_type: data.service_type || null,
      customer_name: data.customer_name || null,
      customer_phone: data.customer_phone || null,
      profile_ref: data.profile_ref || null,
      comment: data.comment || null,
      price: data.price || null
    }]);
    if (error) throw error;
  }

  async function submitUgcProfile(data) {
    var sb = getSb();
    if (!sb) throw new Error('API Client not initialized');
    var { error } = await sb.from('ugc_profile_submissions').insert([{
      cemetery_id: data.cemeteryId || null,
      cemetery_name: data.cemeteryName || null,
      lat: data.lat || null,
      lng: data.lng || null,
      full_name: data.fullName || null,
      birth_year: data.birth || null,
      death_year: data.death || null,
      description: data.description || null
    }]);
    if (error) throw error;
  }

  async function submitUgcBio(data) {
    var sb = getSb();
    if (!sb) throw new Error('API Client not initialized');
    var { error } = await sb.from('ugc_bio_submissions').insert([{
      profile_id: data.profileId || null,
      author_name: data.authorName || null,
      bio_text: data.text || null
    }]);
    if (error) throw error;
  }

  async function fetchVipProfiles() {
    var sb = getSb();
    if (!sb) return [];
    try {
      var { data, error } = await sb
        .from('profiles')
        .select('id, first_name, last_name, patronymic, birth_date, death_date, epitaph, biography, main_photo_url, cemetery_id, location, cemeteries(name, city)')
        .eq('visibility_status', 'public')
        .limit(2000);
      
      if (error) throw error;
      
      return (data || []).map(function(p) {
        return {
          id: p.id,
          name: [p.last_name, p.first_name, p.patronymic].filter(Boolean).join(' '),
          birth: p.birth_date ? String(p.birth_date).substring(0, 4) : '?',
          death: p.death_date ? String(p.death_date).substring(0, 4) : '?',
          cemetery: (p.cemeteries && p.cemeteries.name) ? p.cemeteries.name : 'Неизвестно',
          city: (p.cemeteries && p.cemeteries.city) ? p.cemeteries.city : '',
          filter: 'historical',
          lat: p.location && p.location.coordinates ? p.location.coordinates[1] : null,
          lng: p.location && p.location.coordinates ? p.location.coordinates[0] : null,
          photo: p.main_photo_url || '',
          bio: p.biography || '',
          epitaph: p.epitaph || ''
        };
      }).filter(p => p.lat && p.lng);
    } catch (e) {
      console.error("[public-api] Error fetching VIP profiles:", e);
      return [];
    }
  }

  async function fetchProfileById(id) {
    var sb = getSb();
    if (!sb || !id) return null;
    try {
      var { data, error } = await sb
        .from('profiles')
        .select('*, cemetery:cemeteries(name, city)')
        .eq('id', id)
        .eq('visibility_status', 'public')
        .maybeSingle();

      if (error || !data) return null;
      
      return {
        id: data.id,
        fullName: [data.last_name, data.first_name, data.patronymic].filter(Boolean).join(' '),
        name: data.first_name,
        lastName: data.last_name,
        birth: data.birth_date ? String(data.birth_date).substring(0, 4) : '?',
        death: data.death_date ? String(data.death_date).substring(0, 4) : '?',
        cemetery: data.cemetery?.name || 'Неизвестно',
        city: data.cemetery?.city || '',
        photo: data.main_photo_url || '',
        bio: data.biography || '',
        epitaph: data.epitaph || '',
        filter: 'historical'
      };
    } catch (e) {
      console.error("[public-api] Error fetching Profile ID:", e);
      return null;
    }
  }

  async function fetchFamilyRelations(profileId) {
    var sb = getSb();
    if (!sb || !profileId) return [];
    try {
      var { data, error } = await sb
        .from('profile_relations')
        .select('relation_type, profile_id_2, profiles!profile_relations_profile_id_2_fkey(id, first_name, last_name, birth_date, death_date, main_photo_url)')
        .eq('profile_id_1', profileId);
        
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("[public-api] Error fetching Family Relations:", e);
      return [];
    }
  }

  async function resolveQrSlug(slug) {
    var sb = getSb();
    if (!sb || !slug) return null;
    try {
      var normalized = String(slug).trim().toUpperCase();
      var { data, error } = await sb
        .from('qr_codes')
        .select('id, slug, profile_id, status, scan_count')
        .eq('slug', normalized)
        .eq('status', 'active')
        .maybeSingle();
        
      if (error || !data) return null;
      
      // Fire-and-forget scan counter update (bypassing REST edge logic, handled natively via simple RPC if exists, or simple counter)
      // If no RPC exists, use silent update.
      sb.from('qr_codes')
        .update({ scan_count: (data.scan_count || 0) + 1 })
        .eq('id', data.id)
        .then(() => {}).catch(() => {});
        
      return data;
    } catch(e) {
      console.error("[public-api] Error resolving QR Slug:", e);
      return null;
    }
  }

  async function fetchQrByProfile(profileId) {
    var sb = getSb();
    if (!sb || !profileId) return null;
    try {
      var { data, error } = await sb
        .from('qr_codes')
        .select('id, slug, scan_count, status, activated_at')
        .eq('profile_id', profileId)
        .eq('status', 'active')
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch (e) {
      console.error("[public-api] Error fetching QR by Profile:", e);
      return null;
    }
  }

  async function generateQrSlug(_profileId) {
    throw new Error('QR generation requires authenticated API flow');
  }

  async function fetchProfileIdBySlug(slug) {
    var sb = getSb();
    if (!sb || !slug) return null;
    try {
      var normalized = String(slug).trim().toUpperCase();
      // Check if slug is UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized)) {
        return normalized;
      }
      var { data, error } = await sb
        .from('qr_codes')
        .select('profile_id, status')
        .eq('slug', normalized)
        .maybeSingle();

      if (error || !data || data.status !== 'active') return null;
      return data.profile_id;
    } catch (e) {
      console.error("[public-api] Error fetching Profile ID by Slug:", e);
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
