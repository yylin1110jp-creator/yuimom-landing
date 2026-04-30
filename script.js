/**
 * ═══════════════════════════════════════════════
 * 御盟集團 — Shared i18n & UI Script
 * ═══════════════════════════════════════════════
 *
 * Usage: any page just includes:
 *   <script src="script.js"></script>
 *
 * The script will:
 *   1. Read ?lang= from URL (default: zh)
 *   2. Fetch lang.json (same directory)
 *   3. Apply translations to all [data-i18n] elements
 *   4. Push history state on toggle so Back button works
 *   5. Preserve lang param when navigating between sections/pages
 */

(function () {
  'use strict';

  let LANG = null;   // loaded from lang.json
  let curLang = 'zh';
  let currentSection = 'overview';
  let rafId = null;

  // ═══════════ URL PARAMETER HELPERS ═══════════

  function getLangFromURL() {
    const p = new URLSearchParams(window.location.search);
    const l = p.get('lang');
    return (l === 'en') ? 'en' : 'zh';
  }

  function setLangURL(lang, replace) {
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    if (replace) {
      history.replaceState({ lang }, '', url);
    } else {
      history.pushState({ lang }, '', url);
    }
  }

  // ═══════════ i18n ENGINE ═══════════

  function applyLang(lang, pushHistory) {
    if (!LANG) return;
    curLang = lang;
    const d = LANG[lang];
    if (!d) return;

    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';

    // Update toggle button
    const btn = document.getElementById('langBtn');
    if (btn) btn.textContent = lang === 'zh' ? 'EN' : '中';

    // Update all [data-i18n] elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (d[key] !== undefined) {
        if (el.hasAttribute('data-i18n-html')) {
          el.innerHTML = d[key];
        } else {
          el.textContent = d[key];
        }
      }
    });

    // Update dynamic highlight grids
    const hlMaps = {
      'hl-haiban': lang === 'zh' ? LANG.zh.h_hl : LANG.en.h_hl,
      'hl-zhongshan': lang === 'zh' ? LANG.zh.z_hl : LANG.en.z_hl,
      'hl-changzhuo-floor': lang === 'zh' ? LANG.zh.c_floor : LANG.en.c_floor,
      'hl-changzhuo-mat': lang === 'zh' ? LANG.zh.c_mat : LANG.en.c_mat,
      'hl-baotai': lang === 'zh' ? LANG.zh.b_hl : LANG.en.b_hl,
    };
    Object.entries(hlMaps).forEach(([id, items]) => {
      if (items) renderHlGrid(id, items);
    });

    // Update hero card labels
    const titleKeys = ['card_haiban', 'card_zhongshan', 'card_changzhuo', 'card_baotai'];
    const unitKeys = ['card_unit_h', 'card_unit_z', 'card_unit_c', 'card_unit_b'];
    document.querySelectorAll('.hero-card .card-title').forEach((el, i) => {
      if (d[titleKeys[i]]) el.textContent = d[titleKeys[i]];
    });
    document.querySelectorAll('.hero-card .card-unit').forEach((el, i) => {
      if (d[unitKeys[i]]) el.textContent = d[unitKeys[i]];
    });

    // URL: push new history entry so Back button reverts language
    if (pushHistory) {
      setLangURL(lang, false);
    } else {
      setLangURL(lang, true);
    }

    initReveals();
  }

  function renderHlGrid(id, items) {
    const grid = document.getElementById(id);
    if (!grid) return;
    grid.innerHTML = items
      .map(t => `<div class="hl-item reveal reveal-up">${t}</div>`)
      .join('');
  }

  // Public: toggle language (called by button)
  window.toggleLang = function () {
    applyLang(curLang === 'zh' ? 'en' : 'zh', true);
  };

  // Back/forward browser navigation
  window.addEventListener('popstate', function (e) {
    const lang = (e.state && e.state.lang) ? e.state.lang : getLangFromURL();
    applyLang(lang, false);
  });

  // ═══════════ SECTION SWITCHING ═══════════

  window.showSection = function (id) {
    const navRight = document.getElementById('navRight');
    const navToggle = document.getElementById('navToggle');
    if (navRight) navRight.classList.remove('open');
    if (navToggle) navToggle.classList.remove('open');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const al = document.querySelector(`.nav-link[data-section="${id}"]`);
    if (al) al.classList.add('active');

    const cur = document.getElementById('sec-' + currentSection);
    if (cur) {
      cur.classList.remove('visible');
      setTimeout(() => cur.classList.remove('active'), 500);
    }

    currentSection = id;
    setTimeout(() => {
      const el = document.getElementById('sec-' + id);
      if (el) {
        el.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'instant' });
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.classList.add('visible');
          initReveals();
          initParallax();
        }));
      }
    }, cur ? 350 : 0);
  };

  window.toggleMenu = function () {
    const navToggle = document.getElementById('navToggle');
    const navRight = document.getElementById('navRight');
    if (navToggle) navToggle.classList.toggle('open');
    if (navRight) navRight.classList.toggle('open');
  };

  // ═══════════ SCROLL / REVEALS / PARALLAX ═══════════

  window.addEventListener('scroll', () => {
    const nav = document.getElementById('mainNav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  function initReveals() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.remove('in-view');
      obs.observe(el);
    });
  }

  function initParallax() {
    if (rafId) cancelAnimationFrame(rafId);
    const bgs = document.querySelectorAll('.property-section.active .parallax-bg');
    if (!bgs.length) return;
    function tick() {
      bgs.forEach(bg => {
        const rect = bg.closest('.prop-hero,.invite-image');
        if (!rect) return;
        const box = rect.getBoundingClientRect();
        const vh = window.innerHeight;
        if (box.bottom > -200 && box.top < vh + 200) {
          const offset = (box.top + box.height / 2 - vh / 2) * 0.06;
          bg.style.transform = `translate3d(0,${offset}px,0)`;
        }
      });
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  // ═══════════ INIT ═══════════

  /**
   * Call this from your page after images are defined:
   *   initPage(IMG)
   * IMG = object with base64 image data
   */
  window.initPage = function (IMG) {
    // Set logo images
    ['navLogo', 'heroLogo', 'footerLogo'].forEach(id => {
      const el = document.getElementById(id);
      if (el && IMG.logo_nav) el.src = IMG.logo_nav;
    });

    // Set all data-img elements
    document.querySelectorAll('[data-img]').forEach(el => {
      const key = el.getAttribute('data-img');
      if (IMG[key]) el.src = IMG[key];
    });

    // Build hero cards
    const grid = document.getElementById('heroGrid');
    if (grid) {
      const cards = [
        { section: 'haiban', num: '623', label: '01' },
        { section: 'zhongshan', num: '813', label: '02' },
        { section: 'changzhuo', num: '477', label: '03' },
        { section: 'baotai', num: '162', label: '04' },
      ];
      cards.forEach(c => {
        const card = document.createElement('div');
        card.className = 'hero-card reveal reveal-up';
        card.onclick = () => showSection(c.section);
        card.innerHTML = `
          <img src="${IMG[c.section]}" alt="">
          <div class="hero-card-content">
            <div class="card-num">${c.label}</div>
            <div class="card-stat">${c.num}</div>
            <div class="card-unit"></div>
            <div class="card-title"></div>
          </div>`;
        grid.appendChild(card);
      });
    }

    // Load lang.json then apply
    const langFile = new URL('lang.json', document.currentScript ? document.currentScript.src : window.location.href).href;

    fetch(langFile)
      .then(r => r.json())
      .then(data => {
        LANG = data;
        const initialLang = getLangFromURL();
        applyLang(initialLang, false);
        initParallax();
      })
      .catch(() => {
        // Fallback: if lang.json fails (e.g. file:// protocol), use inline LANG_INLINE if defined
        if (window.LANG_INLINE) {
          LANG = window.LANG_INLINE;
          const initialLang = getLangFromURL();
          applyLang(initialLang, false);
          initParallax();
        } else {
          console.warn('lang.json failed to load. Define window.LANG_INLINE as fallback.');
        }
      });
  };

})();
