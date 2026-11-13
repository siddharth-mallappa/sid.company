/* Hover preview: a small cover follows the cursor over each work row. Mouse/trackpad only. */
(function () {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var rows = document.querySelectorAll('.rows .row');
  if (!rows.length) return;
  var peek = document.createElement('div');
  peek.className = 'peek'; peek.setAttribute('aria-hidden', 'true');
  document.body.appendChild(peek);
  var x = 0, y = 0, tx = 0, ty = 0, raf = 0;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function loop() {
    x += (tx - x) * (still ? 1 : 0.22); y += (ty - y) * (still ? 1 : 0.22);
    peek.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
  }
  function move(e) {
    var w = peek.offsetWidth, h = peek.offsetHeight;
    tx = Math.min(e.clientX + 24, innerWidth - w - 12);
    ty = Math.min(Math.max(e.clientY - h / 2, 12), innerHeight - h - 12);
    if (!raf) raf = requestAnimationFrame(loop);
  }
  rows.forEach(function (r) {
    var tpl = r.querySelector('template');
    r.addEventListener('mouseenter', function (e) {
      peek.innerHTML = tpl ? tpl.innerHTML : '';
      move(e); x = tx; y = ty; peek.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      peek.classList.add('on');
    });
    r.addEventListener('mousemove', move);
    r.addEventListener('mouseleave', function () { peek.classList.remove('on'); });
  });
})();
