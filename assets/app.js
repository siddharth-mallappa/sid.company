/* One page: projects open as a card over the homepage without leaving it.
   - Click a project: its card is fetched, slid in over the homepage, and the address updates.
   - Close (strip beside the card, Esc, swipe down, browser back): the card slides away; the homepage never moved.
   - A direct link to a project shows the card over the homepage; closing it reveals that homepage in place. */
(function () {
  var root = document.documentElement;
  var mqMobile = matchMedia('(max-width: 760px)');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var OPEN_MS = reduce ? 0 : 600, CLOSE_MS = reduce ? 0 : 330;
  var homeTitle = 'Siddharth Mallappa — Founding Marketeer, Designer, Technologist';

  /* ---------- theme switch (works for every .theme button) ---------- */
  function curTheme() { return root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  function labelThemes() {
    var n = curTheme() === 'dark' ? 'light' : 'dark';
    document.querySelectorAll('.theme').forEach(function (b) { b.textContent = n === 'dark' ? 'Dark' : 'Light'; b.setAttribute('aria-label', 'Switch to ' + n + ' theme'); });
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.theme')) return;
    var n = curTheme() === 'dark' ? 'light' : 'dark'; root.dataset.theme = n;
    try { localStorage.setItem('theme', n); } catch (er) {} labelThemes();
  });
  labelThemes();

  /* ---------- fetching project cards ---------- */
  var cache = {};
  function load(path) {
    if (!cache[path]) cache[path] = fetch(path, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw r; return r.text(); })
      .then(function (t) { return new DOMParser().parseFromString(t, 'text/html'); })
      .catch(function (e) { delete cache[path]; throw e; });
    return cache[path];
  }
  function isWork(href) { try { var u = new URL(href, location.href); return u.origin === location.origin && /^\/work\/[^/]+\/?$/.test(u.pathname); } catch (e) { return false; } }
  function norm(p) { return p.replace(/\/?$/, '/'); }

  /* ---------- the homepage underneath ---------- */
  function shade() {
    var s = document.querySelector('.shade');
    if (!s) { s = document.createElement('div'); s.className = 'shade'; document.body.appendChild(s); }
    return s;
  }
  function dismissEl() {
    var d = document.querySelector('.dismiss');
    if (!d) {
      d = document.createElement('a'); d.className = 'dismiss'; d.href = '/'; d.setAttribute('aria-label', 'Back to all work');
      d.innerHTML = '<span class="dismiss-hint" aria-hidden="true">←</span>'; document.body.appendChild(d);
    }
    return d;
  }
  // a project opened from a direct link sits over a copy of the homepage; closing turns that copy into the real page
  function promoteBehind() {
    var b = document.querySelector('.behind'); if (!b) return;
    b.removeAttribute('inert'); b.removeAttribute('aria-hidden'); b.className = 'home-live';
    b.querySelectorAll('.theme-ghost').forEach(function (t) { t.className = 'theme'; t.removeAttribute('tabindex'); });
    document.body.classList.remove('pcard-page'); labelThemes();
    if (window.initPeek) window.initPeek();
  }

  /* ---------- open / swap / close ---------- */
  var busy = false;
  function open(href, how) {   // how: 'push' | 'replace' | 'none'
    if (busy) return; var u = new URL(href, location.href), path = norm(u.pathname);
    var current = document.querySelector('.card');
    load(path).then(function (doc) {
      var src = doc.querySelector('.card'); if (!src) { location.href = href; return; }
      var card = document.importNode(src, true);
      if (how === 'push') history.pushState({ card: path, fromHome: !current }, '', path + u.hash);
      else if (how === 'replace') history.replaceState({ card: path, fromHome: history.state && history.state.fromHome }, '', path + u.hash);
      document.title = doc.title;
      if (current) {                                   // next / previous: swap in place
        card.classList.add('swap'); current.replaceWith(card);
        requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.remove('swap'); }); });
      } else {
        root.classList.add('sheet-open'); shade(); dismissEl();
        card.classList.add('enter'); document.body.appendChild(card);
        card.getBoundingClientRect();
        requestAnimationFrame(function () { card.classList.remove('enter'); root.classList.add('sheet-in'); });
      }
      if (window.initProject) window.initProject(card, u.hash.slice(1));
      if (window.initGallery) window.initGallery(card);
      if (window.initPlayer) window.initPlayer(card);
    }).catch(function () { location.href = href; });
  }
  function closeNow() {
    var card = document.querySelector('.card'); if (!card || busy) return;
    busy = true; card.classList.add('leaving'); root.classList.remove('sheet-in');
    setTimeout(function () {
      card.remove(); var d = document.querySelector('.dismiss'); if (d) d.remove();
      root.classList.remove('sheet-open'); delete root.dataset.view;
      promoteBehind(); document.title = homeTitle; busy = false;
    }, CLOSE_MS);
  }
  window.sheetClose = function () {
    if (!document.querySelector('.card')) return;
    if (history.state && history.state.fromHome) history.back();          // popstate closes it
    else { history.pushState({ home: true }, '', '/'); closeNow(); }
  };

  /* ---------- wiring ---------- */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a'); if (!a) return;
    if (a.classList.contains('dismiss')) { e.preventDefault(); window.sheetClose(); return; }
    if (a.target === '_blank' || !isWork(a.href)) return;
    e.preventDefault();
    open(a.href, document.querySelector('.card') ? 'replace' : 'push');
  });
  document.addEventListener('mouseover', function (e) {      // warm the cache on hover
    var a = e.target.closest && e.target.closest('a'); if (a && isWork(a.href)) load(norm(new URL(a.href).pathname)).catch(function () {});
  });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.querySelector('.card') && !document.querySelector('dialog[open]')) window.sheetClose(); });
  addEventListener('popstate', function () {
    var p = location.pathname;
    if (isWork(location.href)) {
      var c = document.querySelector('.card');
      if (!c) open(location.href, 'none');
      else if (norm(p) !== norm(location.pathname)) open(location.href, 'none');
    } else closeNow();
  });

  /* ---------- a direct link to a project ---------- */
  var startCard = document.querySelector('.card');
  if (startCard) {
    root.classList.add('sheet-open', 'sheet-in'); shade();
    history.replaceState({ card: norm(location.pathname), fromHome: false }, '', location.href);
    if (window.initProject) window.initProject(startCard, location.hash.slice(1));
  }
})();
