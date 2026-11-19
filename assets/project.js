/* Project card: the page is a card over a faded homepage.
   - Section list follows your scroll; clicking a section glides to it.
   - Back: the strip beside the card, Esc, or (on phones) swiping the sheet down.
   - Standard / Visual view toggle (pages with sections only). */
(function () {
  var card = document.querySelector('.card');
  if (!card) return;
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqMobile = matchMedia('(max-width: 760px)');
  var bar = card.querySelector('.pbar');
  var nav = bar.querySelector('.tabs');
  var tabs = [].slice.call(nav.querySelectorAll('.tab'));
  var secs = tabs.map(function (t) { return document.getElementById(t.dataset.id); });
  var modeEl = bar.querySelector('.mode');
  var behind = document.querySelector('.behind');
  var startHash = location.hash.slice(1);

  /* keep the faded homepage at the spot you left it */
  try { var hy = +sessionStorage.getItem('homeY') || 0; if (behind) behind.firstElementChild.style.transform = 'translateY(' + (-hy) + 'px)'; } catch (e) {}

  /* ---------- going back ---------- */
  function cameFromHome() { try { var r = new URL(document.referrer); return r.origin === location.origin && (r.pathname === '/' || r.pathname === '/index.html'); } catch (e) { return false; } }
  function goBack() { if (cameFromHome() && history.length > 1) history.back(); else location.href = '/'; }
  document.querySelector('.dismiss').addEventListener('click', function (e) { e.preventDefault(); goBack(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) goBack(); });

  /* ---------- phones: swipe the sheet down to close ---------- */
  var sy = null, dy = 0;
  card.addEventListener('touchstart', function (e) { if (mqMobile.matches && card.scrollTop <= 0) { sy = e.touches[0].clientY; dy = 0; } else sy = null; }, { passive: true });
  card.addEventListener('touchmove', function (e) {
    if (sy === null) return; dy = e.touches[0].clientY - sy;
    if (dy > 0) { card.style.transition = 'none'; card.style.transform = 'translateY(' + dy + 'px)'; }
  }, { passive: true });
  card.addEventListener('touchend', function () {
    if (sy === null) return; sy = null; card.style.transition = 'transform .32s cubic-bezier(.2,.8,.2,1)';
    if (dy > 110) { card.style.transform = 'translateY(100%)'; setTimeout(goBack, 260); }
    else card.style.transform = '';
  });

  /* ---------- section tracking ---------- */
  function offset() { return mqMobile.matches ? (bar.getBoundingClientRect().height + 12) : 28; }
  function yOf(el) { return el.getBoundingClientRect().top - card.getBoundingClientRect().top + card.scrollTop - offset(); }
  var current = null, lock = 0, ready = false;
  function setActive(i, fromScroll) {
    if (i === current) return; current = i;
    if (!ready) fromScroll = false;
    tabs.forEach(function (t, k) { if (k === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
    var t = tabs[i];
    if (mqMobile.matches) {
      var l = t.offsetLeft - 16, r = t.offsetLeft + t.offsetWidth + 16;
      if (l < nav.scrollLeft || r > nav.scrollLeft + nav.clientWidth) nav.scrollTo({ left: l, behavior: reduce ? 'auto' : 'smooth' });
    }
    if (fromScroll && mode() === 'standard') { try { history.replaceState(history.state, '', '#' + secs[i].id); } catch (e) {} }
  }
  function spy() {
    if (mode() !== 'standard' || Date.now() < lock) return;
    var line = card.getBoundingClientRect().top + offset() + 60, best = 0;
    secs.forEach(function (s, k) { if (s.getBoundingClientRect().top <= line) best = k; });
    if (card.scrollTop + card.clientHeight >= card.scrollHeight - 4)
      secs.forEach(function (s, k) { if (s.getBoundingClientRect().top < innerHeight) best = k; });
    setActive(best, true);
  }
  card.addEventListener('scroll', function () { if (!spy._r) spy._r = requestAnimationFrame(function () { spy._r = 0; spy(); }); }, { passive: true });
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function (e) {
      e.preventDefault();
      if (mode() === 'visual') { openCard(i); setActive(i); return; }
      setActive(i); lock = Date.now() + 900;
      card.scrollTo({ top: yOf(secs[i]), behavior: reduce ? 'auto' : 'smooth' });
      try { history.replaceState(history.state, '', '#' + secs[i].id); } catch (er) {}
    });
  });

  /* ---------- visual mode ---------- */
  var dlg = document.querySelector('.pdlg'), moved = null, opener = null;
  function openCard(i) {
    if (!dlg) return;
    var body = secs[i].querySelector('.pbody');
    opener = secs[i].querySelector('.pcard'); moved = { body: body, home: secs[i] };
    dlg.querySelector('.pdlg-t').textContent = secs[i].dataset.label;
    dlg.querySelector('.pdlg-body').appendChild(body);
    dlg.showModal(); dlg.querySelector('.pdlg-body').scrollTop = 0;
    setTimeout(function () { dispatchEvent(new Event('resize')); }, 30);
  }
  function closeCard() {
    if (!dlg || !dlg.open) return;
    dlg.close(); if (moved) { moved.home.appendChild(moved.body); moved = null; }
    if (opener) opener.focus({ preventScroll: true });
  }
  if (dlg) {
    secs.forEach(function (s, i) { var c = s.querySelector('.pcard'); if (c) c.addEventListener('click', function () { openCard(i); setActive(i); }); });
    dlg.querySelector('.pdlg-x').addEventListener('click', closeCard);
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeCard(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeCard(); });
  }
  function mode() { return modeEl && root.dataset.view === 'visual' ? 'visual' : 'standard'; }
  function setMode(m) {
    if (!modeEl) return;
    root.dataset.view = m;
    modeEl.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.mode === m); });
    try { localStorage.setItem('view', m); } catch (e) {}
    if (m === 'standard') { current = null; spy(); }
    dispatchEvent(new Event('resize'));
  }
  if (modeEl) {
    modeEl.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.mode !== mode()) { setMode(b.dataset.mode); card.scrollTo({ top: 0 }); } }); });
    var saved = null; try { saved = localStorage.getItem('view'); } catch (e) {}
    setMode(saved === 'visual' ? 'visual' : 'standard');
  } else delete root.dataset.view;

  /* ---------- start ---------- */
  var h = startHash, hi = secs.findIndex(function (s) { return s && s.id === h; });
  if (hi > -1) {
    setActive(hi); lock = Date.now() + 900;
    var jump = function () { card.scrollTo(0, mode() === 'visual' ? 0 : yOf(secs[hi])); };
    jump(); addEventListener('load', function () { requestAnimationFrame(jump); }, { once: true });
  } else setActive(0);
  ready = true;
  card.setAttribute('tabindex', '-1'); card.focus({ preventScroll: true });
})();

/* pause looping clips for reduced motion, and when off-screen */
(function () {
  var vids = document.querySelectorAll('video.loop'); if (!vids.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { vids.forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); v.controls = true; }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var p = e.target.play(); if (p) p.catch(function () {}); } else e.target.pause(); }); });
  vids.forEach(function (v) { v.muted = true; v.defaultMuted = true; io.observe(v); });
})();
