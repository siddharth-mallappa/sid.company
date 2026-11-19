/* Story player: the intro clip plays once, then the slides follow on a timer.
   Story-style progress bars; arrows, bars, swipe and arrow keys jump around; tap a slide to view it full screen. */
(function () {
  var SLIDE_MS = 4500;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-player]').forEach(function (pl) {
    var items = [].slice.call(pl.querySelectorAll('.sp-item'));
    var bars = [].slice.call(pl.querySelectorAll('.sp-prog i'));
    var vid = pl.querySelector('video');
    var n = items.length, cur = -1, timer = 0, started = 0, visible = false, paused = reduce;

    function fill(i, frac, animate) {
      var b = bars[i]; if (!b) return;
      b.style.transition = animate ? 'width ' + animate + 'ms linear' : 'none';
      b.style.width = (frac * 100) + '%';
    }
    function go(i, user) {
      i = (i + n) % n;
      clearTimeout(timer);
      items.forEach(function (it, k) { it.classList.toggle('on', k === i); it.setAttribute('aria-hidden', k !== i); });
      bars.forEach(function (b, k) { fill(k, k < i ? 1 : 0); });
      cur = i;
      if (vid) { if (items[i].contains(vid)) { vid.currentTime = 0; if (!paused && visible) { var p = vid.play(); if (p) p.catch(function () {}); } } else vid.pause(); }
      if (!items[i].contains(vid)) {
        requestAnimationFrame(function () { requestAnimationFrame(function () { if (!paused) fill(i, 1, SLIDE_MS); else fill(i, 1); }); });
        if (!paused) timer = setTimeout(function () { go(i + 1); }, SLIDE_MS);
      }
    }
    if (vid) {
      vid.muted = true; vid.defaultMuted = true;
      vid.addEventListener('timeupdate', function () { if (items[cur] && items[cur].contains(vid) && vid.duration) fill(cur, vid.currentTime / vid.duration); });
      vid.addEventListener('ended', function () { if (!paused) go(cur + 1); });
    }
    pl.querySelector('.sp-prev').addEventListener('click', function () { go(cur - 1, true); });
    pl.querySelector('.sp-next').addEventListener('click', function () { go(cur + 1, true); });
    pl.querySelectorAll('.sp-prog button').forEach(function (b, k) { b.addEventListener('click', function () { go(k, true); }); });
    pl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, true); }
    });
    var sx = null;
    pl.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    pl.addEventListener('touchend', function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1), true);
    });

    /* full-screen view of a slide */
    var dlg = document.createElement('dialog'); dlg.className = 'lb sp-lb'; dlg.setAttribute('aria-label', 'Slide viewer');
    dlg.innerHTML = '<div class="lb-top"><span class="lb-count"></span><button class="lb-close" type="button">Close <kbd>esc</kbd></button></div>' +
      '<div class="sp-lb-img"><img alt=""></div>' +
      '<div class="lb-bottom"><button class="lb-prev" type="button" aria-label="Previous">←</button><p class="lb-cap"></p><button class="lb-next" type="button" aria-label="Next">→</button></div>';
    document.body.appendChild(dlg);
    var limg = dlg.querySelector('img'), lc = dlg.querySelector('.lb-count'), lcap = dlg.querySelector('.lb-cap');
    var slides = items.filter(function (it) { return it.querySelector('img'); });
    var li = 0;
    function show(k) {
      li = (k + slides.length) % slides.length;
      var im = slides[li].querySelector('img'); limg.src = im.dataset.full || im.src; limg.alt = im.alt;
      lc.textContent = (li + 1) + ' / ' + slides.length; lcap.textContent = im.alt;
    }
    function openLb(it) {
      paused = true; clearTimeout(timer); if (vid) vid.pause();
      show(slides.indexOf(it)); dlg.showModal(); document.documentElement.classList.add('lb-open');
    }
    function closeLb() { dlg.close(); document.documentElement.classList.remove('lb-open'); paused = reduce; go(items.indexOf(slides[li])); }
    slides.forEach(function (it) { it.addEventListener('click', function () { openLb(it); }); });
    dlg.querySelector('.lb-close').addEventListener('click', closeLb);
    dlg.querySelector('.lb-prev').addEventListener('click', function () { show(li - 1); });
    dlg.querySelector('.lb-next').addEventListener('click', function () { show(li + 1); });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeLb(); });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(li + 1); if (e.key === 'ArrowLeft') show(li - 1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('sp-lb-img')) closeLb(); });

    /* start when it scrolls into view, pause when it leaves */
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !started) { started = 1; go(0); }
      else if (!visible) { if (vid) vid.pause(); }
      else if (visible && vid && items[cur].contains(vid) && !paused) { var p = vid.play(); if (p) p.catch(function () {}); }
    }, { threshold: 0.35 }).observe(pl);
  });
})();
