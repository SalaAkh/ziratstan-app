// Fallback auth API for public pages when client-side Supabase auth is disabled.

(function initPublicAuthStub(global) {
  function showInlineNotice(message) {
    var id = 'zirat-auth-toast';
    var node = document.getElementById(id);
    if (!node) {
      node = document.createElement('div');
      node.id = id;
      node.style.position = 'fixed';
      node.style.right = '16px';
      node.style.bottom = '16px';
      node.style.zIndex = '99999';
      node.style.maxWidth = '360px';
      node.style.padding = '12px 14px';
      node.style.borderRadius = '10px';
      node.style.background = '#111113';
      node.style.border = '1px solid rgba(212, 175, 55, 0.35)';
      node.style.color = '#f4f4f5';
      node.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';
      node.style.fontSize = '13px';
      node.style.lineHeight = '1.4';
      node.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35)';
      document.body.appendChild(node);
    }
    node.textContent = message;
    if (node._hideTimer) clearTimeout(node._hideTimer);
    node.style.display = 'block';
    node._hideTimer = setTimeout(function () {
      node.style.display = 'none';
    }, 3500);
  }

  function notifyUnavailable() {
    var message = 'Authentication is temporarily unavailable. Please try again later.';
    if (global.showToast && typeof global.showToast === 'function') {
      global.showToast(message, 'error');
      return;
    }
    showInlineNotice(message);
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
