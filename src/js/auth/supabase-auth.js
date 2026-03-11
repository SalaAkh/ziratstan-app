/**
 * ZIRATSTAN AUTH MODULE
 * Supabase Authentication — Login / Register / Logout / Session
 */

// ─── Config ───────────────────────────────────────────────────
const SUPABASE_URL = 'https://myxswvzzotieygqnecbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eHN3dnp6b3RpZXlncW5lY2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkxNjQ0NDUsImV4cCI6MjAyNDc0MDQ0NX0.gfIqlMhkqNivOVxfYgQHF8VqQFa_0a8R5FLdOwdxZ00';

// Initialize Supabase client (shared with rest of app)
let _supabase = null;
function getSupabase() {
  if (_supabase) return _supabase;
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window._sb = _supabase;
    return _supabase;
  }
  console.error('[Auth] Supabase SDK not loaded yet.');
  return null;
}

// ─── State ────────────────────────────────────────────────────
let currentUser = null;

// ─── Session Management ───────────────────────────────────────
async function initAuth() {
  const sb = getSupabase();
  if (!sb) return;

  // Get current session
  const { data: { session } } = await sb.auth.getSession();
  currentUser = session?.user ?? null;
  updateAuthUI();

  // Listen for auth state changes (login/logout)
  sb.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    updateAuthUI();
    if (currentUser) {
      // Refresh map or page content after login
      if (typeof window.onUserLogin === 'function') window.onUserLogin(currentUser);
    }
  });
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
    .from('deceased')
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
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();
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
  signIn, signUp, signOut, resetPassword,
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
