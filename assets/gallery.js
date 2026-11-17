/* Gallery: a swipeable filmstrip plus a full-screen viewer.
   Strip: native scroll-snap (swipe, trackpad, Prev/Next, arrow keys).
   Viewer: <dialog> — Esc or the back button closes it; swipe or arrow keys move; swipe down closes on touch. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var behavior = reduce ? 'auto' : 'smooth';

  document.querySelectorAll('[data-gal]').forEach(function (gal) {
    var track = gal.querySelector('.gal-track');
    var items = Array.prototype.slice.call(track.querySelectorAll('.gal-item'));
    var n = items.length;
    var count = gal.querySelector('.gal-count');
    var prevB = gal.querySelector('.gal-prev'), nextB = gal.querySelector('.gal-next');

    /* ---------- strip ---------- */
    function current() {
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, d = Infinity;
      items.forEach(function (it, i) { var c = it.offsetLeft + it.offsetWidth / 2, dd = Math.abs(c - mid); if (dd < d) { d = dd; best = i; } });
      if (track.scrollLeft < 4) best = 0;
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) best = n - 1;
      return best;
    }
    function goStrip(i) {
      i = Math.max(0, Math.min(n - 1, i));
      var it = items[i];
      track.scrollTo({ left: it.offsetLeft - (track.clientWidth - it.offsetWidth) / 2, behavior: behavior });
    }
    function sync() {
      var i = current();
      if (count) count.textContent = (i + 1) + ' / ' + n;
      if (prevB) prevB.disabled = track.scrollLeft < 4;
      if (nextB) nextB.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    }
    if (prevB) prevB.addEventListener('click', function () { goStrip(current() - 1); });
    if (nextB) nextB.addEventListener('click', function () { goStrip(current() + 1); });
    track.addEventListener('scroll', function () { clearTimeout(track._t); track._t = setTimeout(sync, 50); }, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goStrip(current() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goStrip(current() - 1); }
    });
    window.addEventListener('resize', sync);
    sync();

    /* ---------- viewer ---------- */
    var dlg = document.createElement('dialog');
    dlg.className = 'lb';
    dlg.setAttribute('aria-label', 'Image viewer');
    dlg.innerHTML =
      '<div class="lb-top"><span class="lb-count"></span><button class="lb-close" type="button" aria-label="Close viewer">Close <kbd>esc</kbd></button></div>' +
      '<div class="lb-track"></div>' +
      '<div class="lb-bottom"><button class="lb-prev" type="button" aria-label="Previous image">←</button><p class="lb-cap"></p><button class="lb-next" type="button" aria-label="Next image">→</button></div>';
    document.body.appendChild(dlg);
    var ltrack = dlg.querySelector('.lb-track'), lcount = dlg.querySelector('.lb-count'), lcap = dlg.querySelector('.lb-cap');
    items.forEach(function (it) {
      var img = it.querySelector('img');
      var f = document.createElement('figure');
      f.className = 'lb-slide';
      var big = document.createElement('img');
      big.alt = img.alt; big.decoding = 'async'; big.dataset.src = it.dataset.full || img.src;
      f.appendChild(big); ltrack.appendChild(f);
    });
    var slides = Array.prototype.slice.call(ltrack.children);
    function load(i) { [i - 1, i, i + 1].forEach(function (k) { var s = slides[k]; if (s) { var im = s.firstChild; if (!im.src) im.src = im.dataset.src; } }); }
    function lcur() { return Math.round(ltrack.scrollLeft / ltrack.clientWidth); }
    function lgo(i, instant) {
      i = Math.max(0, Math.min(n - 1, i));
      load(i);
      ltrack.scrollTo({ left: i * ltrack.clientWidth, behavior: instant ? 'auto' : behavior });
      lsync(i);
    }
    function lsync(i) {
      if (i === undefined) i = lcur();
      load(i);
      lcount.textContent = (i + 1) + ' / ' + n;
      lcap.textContent = slides[i].firstChild.alt;
      dlg.querySelector('.lb-prev').disabled = i === 0;
      dlg.querySelector('.lb-next').disabled = i === n - 1;
    }
    ltrack.addEventListener('scroll', function () { clearTimeout(ltrack._t); ltrack._t = setTimeout(function () { lsync(); }, 60); }, { passive: true });

    var opener = null, pushed = false;
    function open(i) {
      opener = document.activeElement;
      document.documentElement.classList.add('lb-open');
      dlg.showModal();
      lgo(i, true);
      requestAnimationFrame(function () { lgo(i, true); });
      try { history.pushState({ lb: 1 }, ''); pushed = true; } catch (e) {}
      dlg.querySelector('.lb-close').focus();
    }
    function close(fromHistory) {
      if (!dlg.open) return;
      var i = lcur();
      dlg.close();
      document.documentElement.classList.remove('lb-open');
      if (pushed && !fromHistory) { pushed = false; history.back(); }
      pushed = false;
      goStrip(i);
      if (items[i]) items[i].focus({ preventScroll: true }); else if (opener) opener.focus();
    }
    items.forEach(function (it, i) { it.addEventListener('click', function () { open(i); }); });
    dlg.querySelector('.lb-close').addEventListener('click', function () { close(); });
    dlg.querySelector('.lb-prev').addEventListener('click', function () { lgo(lcur() - 1); });
    dlg.querySelector('.lb-next').addEventListener('click', function () { lgo(lcur() + 1); });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });      // Esc
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); lgo(lcur() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); lgo(lcur() - 1); }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('lb-slide')) close(); });
    window.addEventListener('popstate', function () { if (dlg.open) close(true); });
    window.addEventListener('resize', function () { if (dlg.open) lgo(lcur(), true); });

    // swipe down to close (touch)
    var sy = null, sx = null;
    ltrack.addEventListener('touchstart', function (e) { sy = e.touches[0].clientY; sx = e.touches[0].clientX; }, { passive: true });
    ltrack.addEventListener('touchmove', function (e) {
      if (sy === null) return;
      var dy = e.touches[0].clientY - sy, dx = Math.abs(e.touches[0].clientX - sx);
      if (dy > 0 && dy > dx) { ltrack.style.transform = 'translateY(' + dy + 'px)'; ltrack.style.opacity = Math.max(.4, 1 - dy / 500); }
    }, { passive: true });
    ltrack.addEventListener('touchend', function (e) {
      if (sy === null) return;
      var dy = e.changedTouches[0].clientY - sy; sy = null;
      ltrack.style.transform = ''; ltrack.style.opacity = '';
      if (dy > 110) close();
    });
  });
})();
