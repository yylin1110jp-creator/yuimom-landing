/**
 * ═══════════════════════════════════════════════
 * 御盟集團 — Multi-page Site Script
 * ═══════════════════════════════════════════════
 *
 * 多頁版本，每頁是獨立 HTML。
 * 保留：reveal 動畫、parallax、scrolled header、行動選單。
 * 移除：SPA section 切換、i18n 動態套用、hash routing。
 * 語言切換改為直接連結到對應 path（中 ↔ 英）。
 */

(function () {
  'use strict';

  // ═══════════ 行動選單 ═══════════
  window.toggleMenu = function () {
    var t = document.getElementById('navToggle');
    var r = document.getElementById('navRight');
    if (t) t.classList.toggle('open');
    if (r) r.classList.toggle('open');
  };

  // ═══════════ 滾動：header 變色 ═══════════
  window.addEventListener('scroll', function () {
    var nav = document.getElementById('mainNav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // ═══════════ Reveal 動畫 ═══════════
  function initReveals() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('in-view');
      });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) {
      obs.observe(el);
    });
  }

  // ═══════════ Parallax (建案頁 hero) ═══════════
  var rafId = null;
  function initParallax() {
    if (rafId) cancelAnimationFrame(rafId);
    var bgs = document.querySelectorAll('.parallax-bg');
    if (!bgs.length) return;
    function tick() {
      bgs.forEach(function (bg) {
        var rect = bg.closest('.prop-hero,.invite-image');
        if (!rect) return;
        var box = rect.getBoundingClientRect();
        var vh = window.innerHeight;
        if (box.bottom > -200 && box.top < vh + 200) {
          var offset = (box.top + box.height / 2 - vh / 2) * 0.06;
          bg.style.transform = 'translate3d(0,' + offset + 'px,0)';
        }
      });
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  // ═══════════ 首頁 hash 重導 (相容舊網址) ═══════════
  // 舊網址形式：yuimom.site/#zhongshan → 自動重導到 /zhongshan/
  function redirectLegacyHash() {
    // 只在首頁執行
    var path = window.location.pathname;
    if (path !== '/' && path !== '/index.html' && path !== '/en/' && path !== '/en/index.html') return;

    var hash = (window.location.hash || '').replace('#', '');
    var validSections = ['haiban', 'zhongshan', 'changzhuo', 'baotai'];
    if (validSections.indexOf(hash) === -1) return;

    var isEn = path.indexOf('/en') === 0;
    var newPath = (isEn ? '/en/' : '/') + hash + '/';
    window.location.replace(newPath);
  }

  // ═══════════ Init ═══════════
  document.addEventListener('DOMContentLoaded', function () {
    redirectLegacyHash();
    initReveals();
    initParallax();
  });

})();
