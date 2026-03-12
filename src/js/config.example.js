// Configuration template (copy to config.js or generate via scripts/generate_client_config.js)
(function initZiratConfig(global) {
  if (global.ZiratConfig && typeof global.ZiratConfig.getSupabaseConfig === 'function') {
    return;
  }

  var config = Object.freeze({
    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
    GOOGLE_OAUTH_ENABLED: false,
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
