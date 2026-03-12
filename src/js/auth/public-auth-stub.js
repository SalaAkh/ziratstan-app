// Fallback auth API for public pages when client-side Supabase auth is disabled.

(function initPublicAuthStub(global) {
  function notifyUnavailable() {
    var message = 'Authentication is temporarily unavailable. Please try again later.';
    if (global.showToast && typeof global.showToast === 'function') {
      global.showToast(message, 'error');
      return;
    }
    alert(message);
  }

  if (global.ZiratAuth) {
    return;
  }

  global.ZiratAuth = {
    init: function () { },
    signIn: async function () { throw new Error('Auth disabled'); },
    signUp: async function () { throw new Error('Auth disabled'); },
    signOut: async function () { notifyUnavailable(); },
    resetPassword: async function () { notifyUnavailable(); },
    signInWithGoogle: async function () { notifyUnavailable(); },
    openAuthModal: function () { notifyUnavailable(); },
    closeAuthModal: function () { },
    switchAuthTab: function () { },
    getMyDeceasedProfiles: async function () { return []; },
    getProfile: async function () { return null; },
    getUser: function () { return null; },
    isLoggedIn: function () { return false; },
  };
})(window);
