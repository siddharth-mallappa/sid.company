/* Opens the 3D laptop when it scrolls into view; "Replay" closes and reopens it. */
(function () {
  var laps = document.querySelectorAll('.lap');
  if (!laps.length) return;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  laps.forEach(function (lap) {
    if (still || !('IntersectionObserver' in window)) { lap.classList.add('open'); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { setTimeout(function () { lap.classList.add('open'); }, 250); io.disconnect(); } });
    }, { threshold: 0.45 });
    io.observe(lap);
    var btn = lap.querySelector('.replay');
    if (btn) btn.addEventListener('click', function () {
      lap.classList.remove('open');
      setTimeout(function () { lap.classList.add('open'); }, 1100);
    });
  });
})();
