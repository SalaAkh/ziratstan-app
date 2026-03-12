// Ziratstan — i18n Engine
// Handles language switching, DOM updates, and localStorage persistence.
// Default language: kk (Kazakh)

(function () {
    'use strict';

    const DEFAULT_LANG = 'kk';
    const SUPPORTED = ['kk', 'ru'];
    const STORAGE_KEY = 'ziratstan_lang';

    // ─── Get current language ─────────────────────────────────────────────────
    function getLang() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return SUPPORTED.includes(stored) ? stored : DEFAULT_LANG;
    }

    // ─── Set language & persist ───────────────────────────────────────────────
    function setLang(lang) {
        if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
        localStorage.setItem(STORAGE_KEY, lang);
        applyTranslations(lang);
        updateSwitcherUI(lang);
        document.documentElement.lang = lang;
    }

    // ─── Apply translations to DOM ────────────────────────────────────────────
    function applyTranslations(lang) {
        const dict = (typeof TRANSLATIONS !== 'undefined') ? TRANSLATIONS[lang] : null;
        if (!dict) return;

        // Text content elements
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                el.textContent = dict[key];
            }
        });

        // HTML content elements (for elements with embedded HTML)
        document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-html');
            if (dict[key] !== undefined) {
                el.innerHTML = dict[key];
            }
        });

        // Placeholder attributes
        document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-ph');
            if (dict[key] !== undefined) {
                el.placeholder = dict[key];
            }
        });

        // Aria-label attributes
        document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-aria');
            if (dict[key] !== undefined) {
                el.setAttribute('aria-label', dict[key]);
            }
        });

        // Title attributes
        document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-title');
            if (dict[key] !== undefined) {
                el.setAttribute('title', dict[key]);
            }
        });

        // Content attributes (for meta tags)
        document.querySelectorAll('[data-i18n-content]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-content');
            if (dict[key] !== undefined) {
                el.setAttribute('content', dict[key]);
            }
        });
    }

    // ─── Update switcher button UI ────────────────────────────────────────────
    function updateSwitcherUI(lang) {
        document.querySelectorAll('.lang-btn').forEach(function (btn) {
            const btnLang = btn.getAttribute('data-lang');
            btn.classList.toggle('lang-btn--active', btnLang === lang);
            btn.setAttribute('aria-pressed', btnLang === lang ? 'true' : 'false');
            btn.textContent = btnLang === 'kk' ? window.i18n.t('lang_kk') : window.i18n.t('lang_ru');
        });
        document.querySelectorAll('.lang-switcher').forEach(function (wrapper) {
            wrapper.setAttribute('aria-label', window.i18n.t('lang_switcher_aria'));
        });
    }

    // ─── Create language switcher widget ─────────────────────────────────────
    function createSwitcher() {
        const wrapper = document.createElement('div');
        wrapper.className = 'lang-switcher';
        wrapper.setAttribute('role', 'group');
        wrapper.setAttribute('aria-label', window.i18n ? window.i18n.t('lang_switcher_aria') : 'Language');

        SUPPORTED.forEach(function (lang) {
            const btn = document.createElement('button');
            btn.className = 'lang-btn';
            btn.setAttribute('data-lang', lang);
            btn.textContent = window.i18n ? window.i18n.t(lang === 'kk' ? 'lang_kk' : 'lang_ru') : lang.toUpperCase();
            btn.setAttribute('aria-pressed', 'false');
            btn.addEventListener('click', function () {
                setLang(lang);
                // Trigger custom event for any page-specific listeners
                document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
            });
            wrapper.appendChild(btn);
        });

        return wrapper;
    }

    // ─── Inject switcher into nav ─────────────────────────────────────────────
    function injectSwitcher() {
        const switcher = createSwitcher();

        // Inject CSS for the switcher
        const style = document.createElement('style');
        style.textContent = `
      .lang-switcher {
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        padding: 4px;
        margin-left: 0.5rem;
      }
      .lang-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.4rem 0.8rem;
        font-size: 0.75rem;
        font-weight: 600;
        font-family: inherit;
        letter-spacing: 0.05em;
        color: #71717a;
        border-radius: 8px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .lang-btn:hover {
        color: #f4f4f5;
        background: rgba(255,255,255,0.05);
      }
      .lang-btn--active {
        background: #d4af37;
        color: #09090b;
        box-shadow: 0 2px 8px rgba(212,175,55,0.25);
      }
      .lang-btn--active:hover {
        color: #09090b;
        background: #e5c358;
      }
    `;
        document.head.appendChild(style);

        // Try to put the switcher in the desktop nav-controls
        const navControls = document.querySelector('.nav-controls');
        if (navControls) {
            navControls.appendChild(switcher);
        } else {
            // Fallback: in the nav-links or nav itself
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) {
                navLinks.appendChild(switcher);
            } else {
                const nav = document.querySelector('nav');
                if (nav) nav.appendChild(switcher);
            }
        }

        // Also add a copy in mobile menu
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            const mobileSwitcher = createSwitcher();
            mobileSwitcher.style.margin = '0.5rem 1rem';
            mobileMenu.appendChild(mobileSwitcher);
        }
    }

    // ─── Public API ───────────────────────────────────────────────────────────
    window.i18n = {
        getLang: getLang,
        setLang: setLang,
        t: function (key) {
            const dict = (typeof TRANSLATIONS !== 'undefined') ? TRANSLATIONS[getLang()] : null;
            return (dict && dict[key] !== undefined) ? dict[key] : key;
        }
    };

    // ─── Init on DOMContentLoaded ─────────────────────────────────────────────
    function init() {
        injectSwitcher();
        const lang = getLang();
        setLang(lang); // applies translations + updates ui
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
