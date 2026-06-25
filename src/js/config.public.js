(function initZiratPublicConfig(global) {
  if (global.__ZIRAT_CONFIG_OVERRIDE) {
    return;
  }

  global.__ZIRAT_CONFIG_OVERRIDE = Object.freeze({
    SUPABASE_URL: 'https://cmmsgmziqcbdbuhjgzep.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_TMwycq_oOl06Mn-ckKn0Hw_xKctzf5y',
    GOOGLE_OAUTH_ENABLED: true,
  });
})(window);

