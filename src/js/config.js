(function initZiratConfig(global) {
  if (global.ZiratConfig && typeof global.ZiratConfig.getSupabaseConfig === 'function') {
    return;
  }

  var config = Object.freeze({
    SUPABASE_URL: "https://atxqjzjerdvpiampxamk.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable_CMxQcjFPPkTcR6_RKpnHOg_wdAml-qG",
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
