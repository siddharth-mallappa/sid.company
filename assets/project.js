/* Project page: sticky section bar with scroll-following tabs, and a Standard / Visual view toggle.
   Both indicators are two gooey blobs moving at different speeds, so the pill stretches like an amoeba. */
(function () {
  var bar = document.querySelector('.pbar');
  if (!bar) return;
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tabsNav = bar.querySelector('.tabs');
  var tabs = [].slice.call(tabsNav.querySelectorAll('.tab'));
  var secs = tabs.map(function (t) { return document.getElementById(t.dataset.id); });
  var modeEl = bar.querySelector('.mode');
  var modeBtns = [].slice.call(modeEl.querySelectorAll('button'));

  /* ---------- gooey indicator ---------- */
  function moveInd(container, target) {
    var ind = container.querySelector('.ind'); if (!ind || !target) return;
    var x = target.offsetLeft, w = target.offsetWidth;
    ind.style.setProperty('--x', x + 'px'); ind.style.setProperty('--w', w + 'px');
  }

  /* ---------- sticky state ---------- */
  var sentinel = document.createElement('div'); sentinel.className = 'pbar-sentinel';
  bar.parentNode.insertBefore(sentinel, bar);
  new IntersectionObserver(function (es) { bar.classList.toggle('stuck', !es[0].isIntersecting); }, { rootMargin: '-1px 0px 0px 0px' }).observe(sentinel);

  /* ---------- standard mode: scroll spy ---------- */
  var current = null, lock = 0;
  function setActive(i, fromScroll) {
    if (i === current) return; current = i;
    tabs.forEach(function (t, k) { if (k === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
    moveInd(tabsNav, tabs[i]);
    var t = tabs[i], l = t.offsetLeft - 16, r = t.offsetLeft + t.offsetWidth + 16;
    if (l < tabsNav.scrollLeft || r > tabsNav.scrollLeft + tabsNav.clientWidth) tabsNav.scrollTo({ left: l, behavior: reduce ? 'auto' : 'smooth' });
    if (fromScroll && mode() === 'standard') { try { history.replaceState(null, '', '#' + secs[i].id); } catch (e) {} }
  }
  function spy() {
    if (mode() !== 'standard' || Date.now() < lock) return;
    var line = bar.getBoundingClientRect().bottom + 40, best = 0;
    secs.forEach(function (s, k) { if (s.getBoundingClientRect().top <= line) best = k; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) {
      // at the very bottom, the last section that is visible wins
      secs.forEach(function (s, k) { if (s.getBoundingClientRect().top < innerHeight) best = k; });
    }
    setActive(best, true);
  }
  addEventListener('scroll', function () { if (!spy._r) { spy._r = requestAnimationFrame(function () { spy._r = 0; spy(); }); } }, { passive: true });

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function (e) {
      e.preventDefault();
      if (mode() === 'visual') { openCard(i); setActive(i); return; }
      setActive(i); lock = Date.now() + 900;
      secs[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      try { history.replaceState(null, '', '#' + secs[i].id); } catch (er) {}
    });
  });

  /* ---------- visual mode: grid + open a card ---------- */
  var dlg = document.querySelector('.pdlg'), dbody = dlg.querySelector('.pdlg-body'), dtitle = dlg.querySelector('.pdlg-t');
  var moved = null, opener = null;
  function openCard(i) {
    var body = secs[i].querySelector('.pbody');
    opener = secs[i].querySelector('.pcard');
    moved = { body: body, home: secs[i] };
    dtitle.textContent = secs[i].dataset.label;
    dbody.appendChild(body);
    dlg.showModal(); root.classList.add('lb-open');
    dbody.scrollTop = 0;
    setTimeout(function () { dispatchEvent(new Event('resize')); }, 30);
  }
  function closeCard() {
    if (!dlg.open) return;
    dlg.close(); root.classList.remove('lb-open');
    if (moved) { moved.home.appendChild(moved.body); moved = null; }
    if (opener) opener.focus({ preventScroll: true });
  }
  secs.forEach(function (s, i) { s.querySelector('.pcard').addEventListener('click', function () { openCard(i); setActive(i); }); });
  dlg.querySelector('.pdlg-x').addEventListener('click', closeCard);
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeCard(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeCard(); });

  /* ---------- mode toggle ---------- */
  function mode() { return root.dataset.view === 'visual' ? 'visual' : 'standard'; }
  function setMode(m, initial) {
    var go = function () {
      root.dataset.view = m;
      modeBtns.forEach(function (b) { b.setAttribute('aria-checked', b.dataset.mode === m); });
      moveInd(modeEl, modeEl.querySelector('[data-mode="' + m + '"]'));
      try { localStorage.setItem('view', m); } catch (e) {}
      if (m === 'standard') { current = null; spy(); }
      dispatchEvent(new Event('resize'));
    };
    if (!initial && document.startViewTransition && !reduce) document.startViewTransition(go); else go();
    if (!initial) { var top = bar.getBoundingClientRect().top + scrollY; if (scrollY > top) scrollTo({ top: top, behavior: 'auto' }); }
  }
  modeBtns.forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.mode !== mode()) setMode(b.dataset.mode); }); });
  modeEl.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = mode() === 'standard' ? 'visual' : 'standard'; setMode(n); modeEl.querySelector('[data-mode="' + n + '"]').focus(); }
  });

  /* ---------- start ---------- */
  var h = location.hash.slice(1), hi = secs.findIndex(function (s) { return s.id === h; });
  lock = Date.now() + 800;
  var saved = null; try { saved = localStorage.getItem('view'); } catch (e) {}
  setMode(saved === 'visual' ? 'visual' : 'standard', true);
  bar.classList.add('ready');
  if (hi > -1) {
    setActive(hi);
    if (mode() === 'visual') openCard(hi);
    else {
      var jump = function () { lock = Date.now() + 700; window.scrollTo(0, secs[hi].getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 16); };
      jump(); addEventListener('load', function () { requestAnimationFrame(jump); }, { once: true });
    }
  } else setActive(0);
  addEventListener('resize', function () {
    moveInd(tabsNav, tabs[current || 0]);
    moveInd(modeEl, modeEl.querySelector('[data-mode="' + mode() + '"]'));
  });
  if (document.fonts) document.fonts.ready.then(function () { dispatchEvent(new Event('resize')); });
})();
/* pause looping clips for reduced motion, and when off-screen */
(function () {
  var vids = document.querySelectorAll('video.loop'); if (!vids.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { vids.forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); v.controls = true; }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var p = e.target.play(); if (p) p.catch(function () {}); } else e.target.pause(); }); });
  vids.forEach(function (v) { v.muted = true; v.defaultMuted = true; io.observe(v); });
})();
