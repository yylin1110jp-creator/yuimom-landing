/**
 * ═══════════════════════════════════════════════
 * 御盟集團 — Shared i18n & Routing Script
 * ═══════════════════════════════════════════════
 *
 * URL format:  ?lang=en#zhongshan
 *   - ?lang=  controls language (zh | en, default zh)
 *   - #hash   controls which section is visible
 *
 * Every nav click pushes a new history entry.
 * Back / Forward restores both section AND language.
 */

(function () {
  'use strict';

  // ─── state ───
  var LANG = null;
  var curLang = 'zh';
  var curSection = 'home';
  var rafId = null;
  var isNavigating = false;

  // valid section ids — must match id="sec-XXX" in HTML
  var SECTIONS = ['home', 'haiban', 'zhongshan', 'changzhuo', 'baotai'];

  // ═══════════ URL helpers ═══════════

  function readURL() {
    var params = new URLSearchParams(window.location.search);
    var lang = params.get('lang') === 'en' ? 'en' : 'zh';
    var hash = (window.location.hash || '').replace('#', '');
    if (SECTIONS.indexOf(hash) === -1) hash = 'home';
    return { lang: lang, section: hash };
  }

  function buildURL(lang, section) {
    var url = new URL(window.location);
    url.searchParams.set('lang', lang);
    url.hash = section;
    return url.toString();
  }

  function pushState(lang, section) {
    history.pushState({ lang: lang, section: section }, '', buildURL(lang, section));
  }

  function replaceState(lang, section) {
    history.replaceState({ lang: lang, section: section }, '', buildURL(lang, section));
  }

  // ═══════════ i18n engine ═══════════

  function applyLang(lang) {
    if (!LANG) return;
    curLang = lang;
    var d = LANG[lang];
    if (!d) return;

    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';

    var btn = document.getElementById('langBtn');
    if (btn) btn.textContent = lang === 'zh' ? 'EN' : '中';

    // static elements
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (d[key] !== undefined) {
        if (el.hasAttribute('data-i18n-html')) {
          el.innerHTML = d[key];
        } else {
          el.textContent = d[key];
        }
      }
    });

    // dynamic highlight grids
    var hlMaps = {
      'hl-haiban':          d.h_hl,
      'hl-zhongshan':       d.z_hl,
      'hl-changzhuo-floor': d.c_floor,
      'hl-changzhuo-mat':   d.c_mat,
      'hl-baotai':          d.b_hl
    };
    var hlIds = Object.keys(hlMaps);
    for (var i = 0; i < hlIds.length; i++) {
      if (hlMaps[hlIds[i]]) renderHlGrid(hlIds[i], hlMaps[hlIds[i]]);
    }

    // hero card labels
    var titleKeys = ['card_haiban', 'card_zhongshan', 'card_changzhuo', 'card_baotai'];
    var unitKeys  = ['card_unit_h',  'card_unit_z',    'card_unit_c',    'card_unit_b'];
    document.querySelectorAll('.hero-card .card-title').forEach(function (el, idx) {
      if (d[titleKeys[idx]]) el.textContent = d[titleKeys[idx]];
    });
    document.querySelectorAll('.hero-card .card-unit').forEach(function (el, idx) {
      if (d[unitKeys[idx]]) el.textContent = d[unitKeys[idx]];
    });

    initReveals();
  }

  function renderHlGrid(id, items) {
    var grid = document.getElementById(id);
    if (!grid) return;
    grid.innerHTML = items
      .map(function (t) { return '<div class="hl-item reveal reveal-up">' + t + '</div>'; })
      .join('');
  }

  // ═══════════ section display (no history) ═══════════

  function displaySection(id) {
    if (SECTIONS.indexOf(id) === -1) id = 'home';

    // close mobile menu
    var navRight  = document.getElementById('navRight');
    var navToggle = document.getElementById('navToggle');
    if (navRight)  navRight.classList.remove('open');
    if (navToggle) navToggle.classList.remove('open');

    // nav active state
    document.querySelectorAll('.nav-link').forEach(function (l) {
      l.classList.remove('active');
    });
    var activeLink = document.querySelector('.nav-link[data-section="' + id + '"]');
    if (activeLink) activeLink.classList.add('active');

    // hide previous
    var prev = document.getElementById('sec-' + curSection);
    if (prev && curSection !== id) {
      prev.classList.remove('visible');
      setTimeout(function () { prev.classList.remove('active'); }, 500);
    }

    var delay = (prev && curSection !== id) ? 350 : 0;
    curSection = id;

    setTimeout(function () {
      var el = document.getElementById('sec-' + id);
      if (el) {
        el.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'instant' });
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            el.classList.add('visible');
            initReveals();
            initParallax();
          });
        });
      }
    }, delay);
  }

  // ═══════════ navigate (display + history) ═══════════

  function navigate(section, options) {
    options = options || {};
    var lang = options.lang || curLang;
    var push = options.push !== undefined ? options.push : true;

    if (lang !== curLang) applyLang(lang);
    displaySection(section);

    if (push) {
      pushState(lang, section);
    } else {
      replaceState(lang, section);
    }
  }

  // ═══════════ public API (called from HTML) ═══════════

  window.showSection = function (id) {
    navigate(id, { push: true });
  };

  window.toggleLang = function () {
    var newLang = curLang === 'zh' ? 'en' : 'zh';
    applyLang(newLang);
    pushState(newLang, curSection);
  };

  window.toggleMenu = function () {
    var navToggle = document.getElementById('navToggle');
    var navRight  = document.getElementById('navRight');
    if (navToggle) navToggle.classList.toggle('open');
    if (navRight)  navRight.classList.toggle('open');
  };

  // ═══════════ popstate — Back / Forward ═══════════

  window.addEventListener('popstate', function (e) {
    if (isNavigating) return;
    isNavigating = true;

    var lang, section;

    if (e.state && e.state.section) {
      lang    = e.state.lang    || 'zh';
      section = e.state.section || 'home';
    } else {
      var parsed = readURL();
      lang    = parsed.lang;
      section = parsed.section;
    }

    if (lang !== curLang) applyLang(lang);
    displaySection(section);

    isNavigating = false;
  });

  // ═══════════ scroll / reveals / parallax ═══════════

  window.addEventListener('scroll', function () {
    var nav = document.getElementById('mainNav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  function initReveals() {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.remove('in-view');
      obs.observe(el);
    });
  }

  function initParallax() {
    if (rafId) cancelAnimationFrame(rafId);
    var bgs = document.querySelectorAll('.property-section.active .parallax-bg');
    if (!bgs.length) return;
    function tick() {
      bgs.forEach(function (bg) {
        var rect = bg.closest('.prop-hero,.invite-image');
        if (!rect) return;
        var box = rect.getBoundingClientRect();
        var vh  = window.innerHeight;
        if (box.bottom > -200 && box.top < vh + 200) {
          var offset = (box.top + box.height / 2 - vh / 2) * 0.06;
          bg.style.transform = 'translate3d(0,' + offset + 'px,0)';
        }
      });
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  // ═══════════ init ═══════════

  window.initPage = function (IMG) {
    // logos
    ['navLogo', 'heroLogo', 'footerLogo'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && IMG.logo_nav) el.src = IMG.logo_nav;
    });

    // data-img sources
    document.querySelectorAll('[data-img]').forEach(function (el) {
      var key = el.getAttribute('data-img');
      if (IMG[key]) el.src = IMG[key];
    });

    // hero cards
    var grid = document.getElementById('heroGrid');
    if (grid) {
      var cards = [
        { section: 'haiban',    num: '623', label: '01' },
        { section: 'zhongshan', num: '813', label: '02' },
        { section: 'changzhuo', num: '477', label: '03' },
        { section: 'baotai',    num: '162', label: '04' }
      ];
      cards.forEach(function (c) {
        var card = document.createElement('div');
        card.className = 'hero-card reveal reveal-up';
        card.onclick = function () { showSection(c.section); };
        card.innerHTML =
          '<img src="' + IMG[c.section] + '" alt="">' +
          '<div class="hero-card-content">' +
            '<div class="card-num">' + c.label + '</div>' +
            '<div class="card-stat">' + c.num + '</div>' +
            '<div class="card-unit"></div>' +
            '<div class="card-title"></div>' +
          '</div>';
        grid.appendChild(card);
      });
    }

    // ─── bootstrap ───
    function bootstrap(data) {
      LANG = data;
      var initial = readURL();
      applyLang(initial.lang);
      displaySection(initial.section);
      // seed the first history entry so Back won't leave the site
      replaceState(initial.lang, initial.section);
      initParallax();
    }

    var langFile = 'lang.json';
    try {
      var s = document.currentScript || document.querySelector('script[src*="script.js"]');
      if (s && s.src) langFile = new URL('lang.json', s.src).href;
    } catch (err) { /* keep default */ }

    fetch(langFile)
      .then(function (r) { return r.json(); })
      .then(bootstrap)
      .catch(function () {
        if (window.LANG_INLINE) {
          bootstrap(window.LANG_INLINE);
        } else {
          console.warn('lang.json load failed. Define window.LANG_INLINE as fallback.');
        }
      });
  };

})();
