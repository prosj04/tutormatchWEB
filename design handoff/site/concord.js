/* Concord shared interactions: color/theme toggle, header, reveal, faq, tier tabs */
(function () {
  var root = document.documentElement;
  var CKEY = 'concord-color', TKEY = 'concord-mode';

  // restore persisted color + mode (default green + light)
  try {
    var c = localStorage.getItem(CKEY);
    root.setAttribute('data-color', c === 'blue' ? 'blue' : 'green');
    if (localStorage.getItem(TKEY) === 'dark') root.setAttribute('data-theme', 'dark');
  } catch (e) { root.setAttribute('data-color', 'green'); }

  function syncControls() {
    var color = root.getAttribute('data-color') || 'green';
    document.querySelectorAll('[data-set-color]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-color') === color));
    });
  }

  function onReady() {
    // color segmented control
    document.querySelectorAll('[data-set-color]').forEach(function (b) {
      b.addEventListener('click', function () {
        root.setAttribute('data-color', b.getAttribute('data-set-color'));
        try { localStorage.setItem(CKEY, b.getAttribute('data-set-color')); } catch (e) {}
        syncControls();
      });
    });
    // theme toggle
    document.querySelectorAll('[data-toggle-theme]').forEach(function (b) {
      b.addEventListener('click', function () {
        var dark = root.getAttribute('data-theme') === 'dark';
        if (dark) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', 'dark');
        try { localStorage.setItem(TKEY, dark ? 'light' : 'dark'); } catch (e) {}
      });
    });
    syncControls();

    // sticky header shadow
    var header = document.querySelector('header.site');
    if (header) {
      var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
      onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    }

    // reveal on scroll
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    setTimeout(function () { document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { el.classList.add('in'); }); }, 2400);

    // faq accordion
    document.querySelectorAll('.faq-q').forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.closest('.faq-item');
        var a = item.querySelector('.faq-a');
        var open = item.classList.toggle('open');
        a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
      });
    });
    // expand any item that starts open
    document.querySelectorAll('.faq-item.open .faq-a').forEach(function (a) {
      a.style.maxHeight = a.scrollHeight + 'px';
    });

    // tier tabs (pricing) — toggles [data-tier] visibility
    document.querySelectorAll('[data-tier-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tier = btn.getAttribute('data-tier-tab');
        document.querySelectorAll('[data-tier-tab]').forEach(function (b) { b.classList.toggle('on', b === btn); });
        document.querySelectorAll('[data-tier]').forEach(function (el) {
          el.style.display = el.getAttribute('data-tier') === tier ? '' : 'none';
        });
      });
    });

    // generic on/off button groups (filters, login role tabs)
    document.querySelectorAll('[data-group]').forEach(function (g) {
      g.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-val]'); if (!btn || !g.contains(btn)) return;
        g.querySelectorAll('[data-val]').forEach(function (b) { b.classList.toggle('on', b === btn); });
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
