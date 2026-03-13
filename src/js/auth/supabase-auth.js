/**
 * ZIRATSTAN AUTH MODULE
 * Supabase Authentication — Login / Register / Logout / Session
 */

// ─── Config ───────────────────────────────────────────────────
if (!window.ZiratConfig || typeof window.ZiratConfig.getSupabaseConfig !== 'function') {
  throw new Error('[Auth] Missing ZiratConfig. Ensure src/js/config.js is loaded before supabase-auth.js');
}

const supabaseConfig = window.ZiratConfig.getSupabaseConfig();
const SUPABASE_URL = supabaseConfig.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = supabaseConfig.SUPABASE_ANON_KEY || '';
const GOOGLE_OAUTH_ENABLED = supabaseConfig.GOOGLE_OAUTH_ENABLED !== false;

// Initialize Supabase client (shared with rest of app)
let _supabase = null;
function getSupabase() {
  if (_supabase) return _supabase;
  // Reuse existing client created by another module (avoids Multiple GoTrueClient warning)
  if (window._sb) {
    _supabase = window._sb;
    return _supabase;
  }
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        flowType: 'pkce',           // Use PKCE instead of implicit — prevents refresh_token rotation issues
        detectSessionInUrl: true,   // SDK auto-processes ?code= and #access_token= on load
        persistSession: true,
      },
    });
    window._sb = _supabase;
    return _supabase;
  }
  console.error('[Auth] Supabase SDK not loaded yet.');
  return null;
}

// ─── State ────────────────────────────────────────────────────
let currentUser = null;
let authStateSubscription = null;
let authInitPromise = null;

function syncAuthProviderUI() {
  const googleButtons = document.querySelectorAll('.auth-google-btn');
  googleButtons.forEach((button) => {
    button.hidden = !GOOGLE_OAUTH_ENABLED;
    button.disabled = !GOOGLE_OAUTH_ENABLED;
    button.style.display = GOOGLE_OAUTH_ENABLED ? '' : 'none'; // Ensure CSS doesn't override hidden
    button.tabIndex = GOOGLE_OAUTH_ENABLED ? 0 : -1;
    button.title = GOOGLE_OAUTH_ENABLED ? '' : 'Google login is currently unavailable';
  });

  const dividers = document.querySelectorAll('.auth-divider');
  dividers.forEach((divider) => {
    const previous = divider.previousElementSibling;
    if (previous && previous.classList.contains('auth-google-btn')) {
      divider.hidden = !GOOGLE_OAUTH_ENABLED;
      divider.style.display = GOOGLE_OAUTH_ENABLED ? '' : 'none';
    }
  });
}

function showAuthInlineError(message) {
  const loginForm = document.getElementById('auth-login-form');
  const registerForm = document.getElementById('auth-register-form');
  const forms = [loginForm, registerForm];

  forms.forEach((form) => {
    if (!form) return;
    const errorEl = form.querySelector('.auth-error');
    if (errorEl) errorEl.textContent = message;
  });
}

// ─── Session Management ───────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getOAuthRedirectContext() {
  const url = new URL(window.location.href);
  const hashStr = url.hash.startsWith('#') ? url.hash.substring(1) : '';
  const hashParams = new URLSearchParams(hashStr);
  const queryParams = url.searchParams;

  const code = queryParams.get('code');
  const access_token = hashParams.get('access_token');
  const refresh_token = hashParams.get('refresh_token');
  const queryError = queryParams.get('error') || queryParams.get('error_description');
  const hashError = hashParams.get('error') || hashParams.get('error_description');

  const authQueryKeys = ['code', 'type', 'error', 'error_code', 'error_description', 'state'];
  const authHashKeys = [
    'access_token',
    'refresh_token',
    'expires_in',
    'expires_at',
    'token_type',
    'provider_token',
    'provider_refresh_token',
    'type',
    'error',
    'error_description',
  ];

  const hasAuthQuery = authQueryKeys.some((key) => queryParams.has(key));
  const hasAuthHash = authHashKeys.some((key) => hashParams.has(key));

  return {
    code,
    access_token,
    refresh_token,
    hadOAuthRedirect: hasAuthQuery || hasAuthHash,
    hadAuthError: Boolean(queryError || hashError),
    authErrorMessage: queryError || hashError || '',
  };
}

function cleanupOAuthRedirectUrl() {
  const url = new URL(window.location.href);
  const hashStr = url.hash.startsWith('#') ? url.hash.substring(1) : '';
  const hashParams = new URLSearchParams(hashStr);
  const authQueryKeys = ['code', 'type', 'error', 'error_code', 'error_description', 'state'];
  const authHashKeys = [
    'access_token',
    'refresh_token',
    'expires_in',
    'expires_at',
    'token_type',
    'provider_token',
    'provider_refresh_token',
    'type',
    'error',
    'error_description',
  ];

  authQueryKeys.forEach((key) => url.searchParams.delete(key));
  if (authHashKeys.some((key) => hashParams.has(key))) {
    url.hash = '';
  }

  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

// Supabase JS SDK v2 with detectSessionInUrl:true (default) automatically
// processes both ?code= (PKCE) and #access_token= (implicit) at createClient() time.
// Calling setSession/exchangeCodeForSession MANUALLY fires a SECOND auth event which
// rotates the refresh_token → invalidates the first session → SIGNED_OUT fires.
// This function ONLY detects the redirect context. The SDK fires SIGNED_IN itself.
async function processOAuthRedirect() {
  const ctx = getOAuthRedirectContext();
  if (!ctx.hadOAuthRedirect) {
    return { hadOAuthRedirect: false, callbackError: null };
  }

  console.log('[Auth] OAuth redirect detected — waiting for SDK to process session.');

  // Only report errors from the OAuth provider itself (user denied access, etc.)
  if (ctx.hadAuthError && !ctx.code && !ctx.access_token) {
    const callbackError = new Error(ctx.authErrorMessage || 'OAuth provider returned an error.');
    console.error('[Auth] OAuth provider error:', callbackError.message);
    cleanupOAuthRedirectUrl();
    return { hadOAuthRedirect: true, callbackError };
  }

  return { hadOAuthRedirect: true, callbackError: null };
}

async function getVerifiedSession(sb, withRetry) {
  const attempts = withRetry ? 2 : 1;
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const { data: { session }, error } = await sb.auth.getSession();
    if (error) lastError = error;
    if (session) return { session, error: null };
    if (attempt < attempts) await sleep(180);
  }

  return { session: null, error: lastError };
}

function applyAuthSession(session, event) {
  const previousUserId = currentUser?.id || null;
  currentUser = session?.user ?? null;
  updateAuthUI();

  if (!currentUser) return;

  const currentUserId = currentUser.id;
  const shouldNotifyLogin =
    event === 'SIGNED_IN'
    || event === 'INITIAL_SESSION'
    || previousUserId !== currentUserId;

  if (shouldNotifyLogin && typeof window.onUserLogin === 'function') {
    window.onUserLogin(currentUser);
  }
}

function ensureAuthStateListener(sb) {
  if (authStateSubscription) return;

  const { data } = sb.auth.onAuthStateChange((event, session) => {
    console.log('[Auth] onAuthStateChange →', event, session?.user?.email || '(no user)');
    applyAuthSession(session, event);
  });

  authStateSubscription = data?.subscription || null;
}

async function initAuth() {
  if (authInitPromise) return authInitPromise;

  authInitPromise = (async () => {
    syncAuthProviderUI();
    const sb = getSupabase();
    if (!sb) return;

    // Register listener FIRST — receives INITIAL_SESSION + SIGNED_IN from SDK auto-detection
    ensureAuthStateListener(sb);

    const { hadOAuthRedirect, callbackError } = await processOAuthRedirect();

    if (hadOAuthRedirect) {
      if (callbackError) {
        showAuthInlineError(callbackError.message || 'Google login failed. Try again.');
        openAuthModal('login');
      } else {
        // SDK (detectSessionInUrl:true) is auto-processing the hash/code token.
        // Wait 1s for it to complete and fire SIGNED_IN via onAuthStateChange.
        await sleep(1000);
        const { data: { session } } = await sb.auth.getSession();
        if (session) {
          cleanupOAuthRedirectUrl();
          applyAuthSession(session, 'SIGNED_IN');
          console.log('[Auth] OAuth session confirmed and applied.');
        } else {
          showAuthInlineError('Session could not be established. Please try again.');
          openAuthModal('login');
          console.warn('[Auth] OAuth redirect present but session null after 1000ms.');
        }
      }
    } else {
      // Normal page load — apply session immediately for instant UI
      const { session } = await getVerifiedSession(sb, false);
      applyAuthSession(session, 'INITIAL_SESSION');
    }
  })();

  try {
    await authInitPromise;
  } finally {
    authInitPromise = null;
  }
}

// ─── Auth Actions ─────────────────────────────────────────────
async function signUp({ email, password, fullName }) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if (error) throw error;
  return data;
}

async function signIn({ email, password }) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signInWithGoogle() {
  if (!GOOGLE_OAUTH_ENABLED) {
    showAuthInlineError('Google login is currently unavailable. Use email and password.');
    switchAuthTab('login');
    const emailInput = document.getElementById('login-email');
    if (emailInput) emailInput.focus();
    return null;
  }

  const sb = getSupabase();
  console.log('[Auth] Initiating Google Sign-In...');
  
  // Explicitly tell Supabase where to return to
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Always redirect to root — ensures the page that has the ?code= handler
      // is always index.html which has Supabase SDK loaded in correct order
      redirectTo: window.location.origin + '/'
    }
  });
  
  if (error) {
    const message = error.message || 'Google login failed.';
    showAuthInlineError(message);
    switchAuthTab('login');
    const emailInput = document.getElementById('login-email');
    if (emailInput) emailInput.focus();
    return null;
  }
  return data;
}

async function signOut() {
  const sb = getSupabase();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
  currentUser = null;
  updateAuthUI();
  // Reload to clear any cached data
  window.location.reload();
}

async function resetPassword(email) {
  const sb = getSupabase();
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password.html'
  });
  if (error) throw error;
}

// ─── User Data ────────────────────────────────────────────────
async function getMyDeceasedProfiles() {
  const sb = getSupabase();
  if (!currentUser) return [];
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('owner_id', currentUser.id)
    .order('created_at', { ascending: false });
  if (error) { console.error('[Auth] getMyDeceasedProfiles error:', error); return []; }
  return data || [];
}

async function getProfile() {
  const sb = getSupabase();
  if (!currentUser) return null;
  const { data } = await sb
    .from('user_profiles')
    .select('*')
    .eq('user_id', currentUser.id)
    .maybeSingle();
  return data;
}

// ─── UI Helpers ───────────────────────────────────────────────
function updateAuthUI() {
  const loginBtn = document.getElementById('nav-auth-btn');
  const userMenu = document.getElementById('nav-user-menu');
  const userNameEl = document.getElementById('nav-user-name');
  const mobileAuthBtn = document.getElementById('mob-auth-btn');

  if (currentUser) {
    const displayName = currentUser.user_metadata?.full_name
      || currentUser.email?.split('@')[0]
      || 'Пайдаланушы';

    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userNameEl) userNameEl.textContent = displayName;
    if (mobileAuthBtn) {
      mobileAuthBtn.textContent = '👤 ' + displayName;
      mobileAuthBtn.href = 'dashboard.html';
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (mobileAuthBtn) {
      mobileAuthBtn.textContent = '🔑 Кіру / Тіркелу';
      mobileAuthBtn.href = '#';
      mobileAuthBtn.onclick = (e) => { e.preventDefault(); openAuthModal(); };
    }
  }
}

// ─── Auth Modal ───────────────────────────────────────────────
function openAuthModal(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.add('open');
    switchAuthTab(tab);
    document.body.style.overflow = 'hidden';
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('auth-login-form');
  const registerForm = document.getElementById('auth-register-form');
  const tabBtns = document.querySelectorAll('.auth-tab-btn');

  tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  if (loginForm) loginForm.style.display = tab === 'login' ? 'flex' : 'none';
  if (registerForm) registerForm.style.display = tab === 'register' ? 'flex' : 'none';
}

// ─── Form Handling ────────────────────────────────────────────
function bindAuthForms() {
  const loginForm = document.getElementById('auth-login-form');
  const registerForm = document.getElementById('auth-register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('#login-email').value.trim();
      const password = loginForm.querySelector('#login-password').value;
      const btn = loginForm.querySelector('button[type="submit"]');
      const errorEl = loginForm.querySelector('.auth-error');

      btn.disabled = true;
      btn.textContent = 'Жүктелуде...';
      if (errorEl) errorEl.textContent = '';

      try {
        await signIn({ email, password });
        closeAuthModal();
      } catch (err) {
        if (errorEl) errorEl.textContent = formatAuthError(err.message);
        btn.disabled = false;
        btn.textContent = 'Кіру';
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = registerForm.querySelector('#reg-name').value.trim();
      const email = registerForm.querySelector('#reg-email').value.trim();
      const password = registerForm.querySelector('#reg-password').value;
      const btn = registerForm.querySelector('button[type="submit"]');
      const errorEl = registerForm.querySelector('.auth-error');
      const successEl = registerForm.querySelector('.auth-success');

      if (password.length < 6) {
        if (errorEl) errorEl.textContent = 'Пароль кемінде 6 символ болуы керек';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Тіркелуде...';
      if (errorEl) errorEl.textContent = '';

      try {
        await signUp({ email, password, fullName });
        btn.style.display = 'none';
        if (successEl) successEl.textContent = '✅ Тіркелдіңіз! Email-ді тексеріңіз (растау хаты жіберілді).';
      } catch (err) {
        if (errorEl) errorEl.textContent = formatAuthError(err.message);
        btn.disabled = false;
        btn.textContent = 'Тіркелу';
      }
    });
  }
}

function formatAuthError(msg) {
  const map = {
    'Invalid login credentials': 'Email немесе пароль қате',
    'Email not confirmed': 'Email расталмаған. Почтаңызды тексеріңіз.',
    'User already registered': 'Бұл email тіркелген',
    'Password should be at least 6 characters': 'Пароль тым қысқа (мин. 6 символ)',
  };
  return map[msg] || msg;
}

// ─── Exports & Auto-init ──────────────────────────────────────
window.ZiratAuth = {
  init: initAuth,
  signIn, signUp, signOut, resetPassword, signInWithGoogle,
  logout: signOut,
  openAuthModal, closeAuthModal, switchAuthTab,
  getMyDeceasedProfiles, getProfile,
  getUser: () => currentUser,
  isLoggedIn: () => !!currentUser,
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    bindAuthForms();
  });
} else {
  initAuth();
  bindAuthForms();
}
