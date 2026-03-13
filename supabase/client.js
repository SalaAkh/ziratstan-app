// ============================================================
//  Ziratstan.kz — Supabase Client
//  Бисмиллях! Подключи сюда свои ключи из Supabase Dashboard
//  Settings → API → Project URL & anon/public key
// ============================================================

if (!window.ZiratConfig || typeof window.ZiratConfig.getSupabaseConfig !== 'function') {
  throw new Error('[Ziratstan] Missing ZiratConfig. Ensure src/js/config.js is loaded before supabase/client.js');
}

var supabaseConfig = window.ZiratConfig.getSupabaseConfig();
var SUPABASE_URL = supabaseConfig.SUPABASE_URL || '';
var SUPABASE_ANON_KEY = supabaseConfig.SUPABASE_ANON_KEY || '';

// Инициализация клиента через CDN (supabase-js v2)
var createClient = supabase.createClient || supabase.createClient;
var db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // supabase-auth.js handles OAuth redirect processing manually.
    // Disabling auto-detection prevents the SDK from calling history.replaceState
    // without user interaction, which triggers Chrome's History Manipulation warning.
    detectSessionInUrl: false,
  }
});

// Helper для получения текущей сессии
async function getSession() {
  const { data } = await db.auth.getSession();
  return data?.session;
}

// Прячем всё в глобальный объект для удобного доступа со страниц
window.ZiratApi = {
  db: db,
  getSession: getSession,

// ============================================================
//  API Helpers
// ============================================================

  /**
   * Отправить UGC предложение имени кладбища.
   */
  async submitUgcSuggestion(data) {
    const { error } = await db.from('ugc_submissions').insert([{
      current_name: data.current_name,
      suggested_name: data.suggested_name,
      lat: data.lat,
      lng: data.lng,
      comment: data.comment || null,
      status: 'pending',
      submitted_at: new Date().toISOString()
    }]);
    if (error) throw error;
  },

  /**
   * Создать заказ услуги по уходу.
   */
  async createServicesLead(data) {
    const { error } = await db.from('services_leads').insert([{
      service_type: data.service_type,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      profile_ref: data.profile_ref || null,
      comment: data.comment || null,
      price: data.price,
      status: 'new',
      submitted_at: new Date().toISOString()
    }]);
    if (error) throw error;
  },

  /**
   * Отправить UGC добавление новой личности (профиля).
   */
  async submitUgcProfile(data) {
    const { error } = await db.from('ugc_profile_submissions').insert([{
      cemetery_id: data.cemeteryId || null,
      cemetery_name: data.cemeteryName || null,
      lat: data.lat || null,
      lng: data.lng || null,
      full_name: data.fullName,
      birth_year: data.birth || null,
      death_year: data.death || null,
      description: data.description || null,
      status: 'pending',
      submitted_at: new Date().toISOString()
    }]);
    if (error) throw error;
  },

  /**
   * Отправить UGC дополнение биографии.
   */
  async submitUgcBio(data) {
    const { error } = await db.from('ugc_bio_submissions').insert([{
      profile_id: data.profileId,
      author_name: data.authorName || null,
      bio_text: data.text,
      status: 'pending',
      submitted_at: new Date().toISOString()
    }]);
    if (error) throw error;
  },

  /**
   * Загрузить VIP профили с карты из Supabase.
   */
  async fetchVipProfiles() {
    const { data, error } = await db
      .from('profiles')
      .select('id, first_name, last_name, patronymic, birth_date, death_date, epitaph, biography, main_photo_url, cemetery_id, location')
      .eq('visibility_status', 'public');
    if (error) {
      console.warn('[Ziratstan] Could not load profiles from Supabase:', error.message);
      return [];
    }
    return data.map(p => ({
      id: p.id,
      name: [p.last_name, p.first_name, p.patronymic].filter(Boolean).join(' '),
      birth: p.birth_date ? p.birth_date.substring(0, 4) : '?',
      death: p.death_date ? p.death_date.substring(0, 4) : '?',
      cemetery: p.cemetery_id || 'Неизвестно',
      city: '',
      filter: 'historical',
      lat: p.location ? p.location.coordinates[1] : null,
      lng: p.location ? p.location.coordinates[0] : null,
      photo: p.main_photo_url || '',
      bio: p.biography || '',
    })).filter(p => p.lat && p.lng);
  },

  /**
   * Загрузить конкретный профиль по ID.
   */
  async fetchProfileById(id) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !UUID_REGEX.test(id)) return null;

    const { data, error } = await db
      .from('profiles')
      .select('*, cemetery:cemeteries(name, city)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Ziratstan] Profile load error:', error.message);
      return null;
    }

    return {
      id: data.id,
      fullName: [data.last_name, data.first_name, data.patronymic].filter(Boolean).join(' '),
      name: data.first_name,
      lastName: data.last_name,
      birth: data.birth_date ? data.birth_date.substring(0, 4) : '?',
      death: data.death_date ? data.death_date.substring(0, 4) : '?',
      cemetery: data.cemetery?.name || 'Неизвестно',
      city: data.cemetery?.city || '',
      photo: data.main_photo_url || '',
      bio: data.biography || '',
      epitaph: data.epitaph || '',
      filter: 'historical'
    };
  },

  /**
   * Получить родственников профиля для шежіре.
   */
  async fetchFamilyRelations(profileId) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!profileId || !UUID_REGEX.test(profileId)) return [];

    const { data, error } = await db
      .from('profile_relations')
      .select(`
        relation_type,
        profile_id_2,
        profiles!profile_relations_profile_id_2_fkey(id, first_name, last_name, birth_date, death_date, main_photo_url)
      `)
      .eq('profile_id_1', profileId);

    if (error) {
      console.warn('[Ziratstan] Could not load family relations:', error.message);
      return [];
    }
    return data;
  },

// ============================================================
//  QR Code Helpers (QR-Мемориал)
// ============================================================

  /**
   * Резолвить slug QR-кода → profile_id.
   */
  async resolveQrSlug(slug) {
    const { data, error } = await db
      .from('qr_codes')
      .select('id, slug, profile_id, status, scan_count')
      .eq('slug', slug.toUpperCase())
      .eq('status', 'active')
      .single();

    if (error || !data) {
      console.warn('[Ziratstan QR] Slug not found:', slug, error?.message);
      return null;
    }

    // Инкремент scan_count
    db.from('qr_codes')
      .update({ scan_count: (data.scan_count || 0) + 1 })
      .eq('id', data.id)
      .then(() => { })
      .catch(err => console.warn('[Ziratstan QR] scan_count update failed:', err));

    return data;
  },

  /**
   * Генерирует новый уникальный QR-slug и привязывает к профилю.
   */
  async generateQrSlug(profileId) {
    const session = await getSession();
    if (!session) {
      throw new Error('QR-код жасау үшін әкімші құқығы қажет (авторизациядан өтіңіз).');
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let slug;
    let attempts = 0;

    do {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      slug = 'ZRT-' + code;
      attempts++;

      const { data: existing } = await db
        .from('qr_codes')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (!existing) break;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new Error('Уникальный QR-slug жасау мүмкін болмады.');
    }

    const { data, error } = await db
      .from('qr_codes')
      .insert([{
        slug: slug,
        profile_id: profileId,
        status: 'active',
        scan_count: 0,
        activated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
      .select('id, slug')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Получить QR-запись для профиля.
   */
  async fetchQrByProfile(profileId) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!profileId || !UUID_REGEX.test(profileId)) return null;

    const { data, error } = await db
      .from('qr_codes')
      .select('id, slug, scan_count, status, activated_at')
      .eq('profile_id', profileId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.warn('[Ziratstan QR] Could not fetch QR for profile:', error.message);
      return null;
    }
    return data;
  },

// ============================================================
//  Admin & Utils Helpers
// ============================================================

  /**
   * Получить реальный UUID профиля по slug.
   */
  async fetchProfileIdBySlug(slug) {
    if (!slug) return null;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (UUID_REGEX.test(slug)) return slug;

    const normalized = String(slug).trim().toUpperCase();
    const { data, error } = await db
      .from('qr_codes')
      .select('profile_id, status')
      .eq('slug', normalized)
      .maybeSingle();

    if (error || !data || data.status !== 'active') return null;
    return data.profile_id;
  }
};
