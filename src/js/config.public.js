(function initZiratPublicConfig(global) {
  if (global.__ZIRAT_CONFIG_OVERRIDE) {
    return;
  }

  global.__ZIRAT_CONFIG_OVERRIDE = Object.freeze({
    SUPABASE_URL: 'https://atxqjzjerdvpiampxamk.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_CMxQcjFPPkTcR6_RKpnHOg_wdAml-qG',
    GOOGLE_OAUTH_ENABLED: true,
  });
})(window);

