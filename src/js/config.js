(function initZiratConfig(global) {
  if (global.ZiratConfig && typeof global.ZiratConfig.getSupabaseConfig === 'function') {
    return;
  }

  var runtime = global.__ZIRAT_CONFIG_OVERRIDE || {};
  var config = Object.freeze({
    SUPABASE_URL: typeof runtime.SUPABASE_URL === 'string' ? runtime.SUPABASE_URL.trim() : '',
    SUPABASE_ANON_KEY: typeof runtime.SUPABASE_ANON_KEY === 'string' ? runtime.SUPABASE_ANON_KEY.trim() : '',
    GOOGLE_OAUTH_ENABLED: Boolean(runtime.GOOGLE_OAUTH_ENABLED),
  });

  Object.defineProperty(global, 'ZiratConfig', {
    value: Object.freeze({
      getSupabaseConfig: function getSupabaseConfig() {
        return config;
      },
    }),
    writable: false,
    configurable: false,
    enumerable: false,
  });
})(window);
