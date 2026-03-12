/**
 * Admin-only Supabase bootstrap for static hosting.
 * Loaded by admin.html before src/js/admin.js.
 */
(function initAdminSupabase(global) {
  if (!global.ZiratConfig || typeof global.ZiratConfig.getSupabaseConfig !== 'function') {
    console.error('[Admin] Missing ZiratConfig. Load src/js/config.js before supabase-admin-client.js');
    return;
  }

  if (!global.supabase || typeof global.supabase.createClient !== 'function') {
    console.error('[Admin] Supabase SDK is not loaded.');
    return;
  }

  var cfg = global.ZiratConfig.getSupabaseConfig();
  var url = cfg.SUPABASE_URL || '';
  var anonKey = cfg.SUPABASE_ANON_KEY || '';

  if (!url || !anonKey) {
    console.error('[Admin] Supabase URL/Anon key is missing.');
    return;
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
