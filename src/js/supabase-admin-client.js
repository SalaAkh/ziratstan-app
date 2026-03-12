/**
 * Admin-only Supabase bootstrap for static hosting.
 * Loaded by admin.html before src/js/admin.js.
 */
(function initAdminSupabase(global) {
  if (!global.ZiratConfig || typeof global.ZiratConfig.getSupabaseConfig !== 'function') {
    throw new Error('[Admin] Missing ZiratConfig. Load src/js/config.js before supabase-admin-client.js');
  }

  if (!global.supabase || typeof global.supabase.createClient !== 'function') {
    throw new Error('[Admin] Supabase SDK is not loaded.');
  }

  var cfg = global.ZiratConfig.getSupabaseConfig();
  var url = cfg.SUPABASE_URL || '';
  var anonKey = cfg.SUPABASE_ANON_KEY || '';

  if (!url || !anonKey) {
    throw new Error('[Admin] Supabase URL/Anon key is missing.');
  }

  var dbClient = global.db || global.supabase.createClient(url, anonKey);

  async function getSession() {
    var result = await dbClient.auth.getSession();
    if (result.error) throw result.error;
    return (result.data && result.data.session) ? result.data.session : null;
  }

  global.db = dbClient;
  global.getSession = getSession;
})(window);
