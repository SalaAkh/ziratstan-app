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
    }

    // ─── Update switcher button UI ────────────────────────────────────────────
    function updateSwitcherUI(lang) {
        document.querySelectorAll('.lang-btn').forEach(function (btn) {
            const btnLang = btn.getAttribute('data-lang');
            btn.classList.toggle('lang-btn--active', btnLang === lang);
        });
    }

    // ─── Create language switcher widget ─────────────────────────────────────
    function createSwitcher() {
        const wrapper = document.createElement('div');
        wrapper.className = 'lang-switcher';
        wrapper.setAttribute('role', 'group');
        wrapper.setAttribute('aria-label', 'Тіл / Язык');

        SUPPORTED.forEach(function (lang) {
            const btn = document.createElement('button');
            btn.className = 'lang-btn';
            btn.setAttribute('data-lang', lang);
            btn.textContent = lang === 'kk' ? 'ҚАЗ' : 'РУС';
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
        gap: 2px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 2px;
        margin-left: 0.5rem;
      }
      .lang-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.3rem 0.6rem;
        font-size: 0.7rem;
        font-weight: 700;
        font-family: inherit;
        letter-spacing: 0.05em;
        color: #71717a;
        border-radius: 6px;
        transition: color 0.15s, background 0.15s;
      }
      .lang-btn:hover {
        color: #f4f4f5;
      }
      .lang-btn--active {
        background: rgba(212,175,55,0.15);
        color: #d4af37;
      }
    `;
        document.head.appendChild(style);

        // Try to put the switcher in the desktop nav-links
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            navLinks.appendChild(switcher);
        } else {
            // Fallback: in the <nav> itself
            const nav = document.querySelector('nav');
            if (nav) nav.appendChild(switcher);
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
