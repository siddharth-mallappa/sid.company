/* Slideshow: native horizontal scroll-snap, with Prev/Next, a counter and arrow keys. Swipe works on touch. */
(function () {
  document.querySelectorAll('.ss').forEach(function (ss) {
    var track = ss.querySelector('.ss-track'), slides = track.children, n = slides.length;
    var count = ss.querySelector('.ss-count'), prev = ss.querySelector('.ss-prev'), next = ss.querySelector('.ss-next');
    var smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    function idx() { return Math.round(track.scrollLeft / track.clientWidth); }
    function go(i) { i = (i + n) % n; track.scrollTo({ left: i * track.clientWidth, behavior: smooth }); }
    function sync() { var i = idx(); if (count) count.textContent = (i + 1) + ' / ' + n; }
    if (prev) prev.addEventListener('click', function () { go(idx() - 1); });
    if (next) next.addEventListener('click', function () { go(idx() + 1); });
    track.addEventListener('scroll', function () { clearTimeout(track._t); track._t = setTimeout(sync, 60); }, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx() - 1); }
    });
  });
})();
