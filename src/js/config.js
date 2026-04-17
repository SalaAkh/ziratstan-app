(function initZiratConfig(global) {
  if (global.ZiratConfig && typeof global.ZiratConfig.getSupabaseConfig === 'function') {
    return;
  }

  var runtime = global.__ZIRAT_CONFIG_OVERRIDE || {};
  
  // ФЛАГ ЛОКАЛИЗАЦИИ БАЗЫ ДАННЫХ (ЗАКОН РК О ПД)
  // Установите в true, чтобы использовать дата-центры PS.kz / Yandex Cloud KZ
  var USE_KZ_LOCAL_DB = false;
  
  var localDbConfig = {
    SUPABASE_URL: 'https://db.ziratstan.kz',
    SUPABASE_ANON_KEY: 'LOCAL_KZ_ANON_KEY'
  };

  var config = Object.freeze({
    SUPABASE_URL: USE_KZ_LOCAL_DB ? localDbConfig.SUPABASE_URL : (typeof runtime.SUPABASE_URL === 'string' ? runtime.SUPABASE_URL.trim() : ''),
    SUPABASE_ANON_KEY: USE_KZ_LOCAL_DB ? localDbConfig.SUPABASE_ANON_KEY : (typeof runtime.SUPABASE_ANON_KEY === 'string' ? runtime.SUPABASE_ANON_KEY.trim() : ''),
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
