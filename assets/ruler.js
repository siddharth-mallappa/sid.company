/* 0 → 1 → 10 ruler under the intro.
   Hover (or drag a finger) along it: lines near the pointer thicken, the nearest step lights up,
   and its name, description and work thumbnails appear aligned to that line. Click to open the step's card. */
(function () {
  function init(el) {
    if (el.dataset.ready) return; el.dataset.ready = '1';
    var row = el.querySelector('.rl-row'), cap = el.querySelector('.rl-cap'), card = cap.querySelector('.rl-card');
    var nameEl = cap.querySelector('.rl-name'), descEl = cap.querySelector('.rl-desc'), tagsEl = cap.querySelector('.rl-tags'), thumbsEl = cap.querySelector('.rl-thumbs');
    var data = {}; JSON.parse(el.querySelector('.rl-data').textContent).forEach(function (d) { data[d.k] = d; });
    var parts = [].slice.call(row.querySelectorAll('.rl-l, .rl-n'));
    var keys = []; parts.forEach(function (p) { if ((p.classList.contains('st') || p.classList.contains('rl-n')) && keys.indexOf(p.dataset.k) < 0) keys.push(p.dataset.k); });
    var anchor = {}; parts.forEach(function (p) { if (p.classList.contains('st') || p.classList.contains('rl-n')) anchor[p.dataset.k] = p; });
    var cur = null, centers = [];
    var timer = null;
    function cycle() {                                  // one big thumbnail that moves through the step's work
      clearInterval(timer); var t = [].slice.call(thumbsEl.children), i = 0;
      t.forEach(function (x, j) { x.classList.toggle('on', j === 0); });
      if (t.length > 1) timer = setInterval(function () { t[i].classList.remove('on'); i = (i + 1) % t.length; t[i].classList.add('on'); }, 1500);
    }

    function measure() { var r = row.getBoundingClientRect(); centers = parts.map(function (p) { var b = p.getBoundingClientRect(); return b.left + b.width / 2 - r.left; }); }
    function wave(x) {
      parts.forEach(function (p, i) {
        if (p.classList.contains('rl-n')) return;
        var t = x == null ? 0 : Math.exp(-Math.pow((centers[i] - x) / 22, 2));
        p.style.setProperty('--t', t.toFixed(3));
      });
    }
    function show(k) {
      if (k === cur) return; cur = k;
      parts.forEach(function (p) { p.classList.toggle('on', !!k && anchor[k] === p); });
      if (!k) { el.classList.remove('active'); clearInterval(timer); return; }
      var d = data[k];
      nameEl.textContent = d.name; descEl.textContent = d.desc; tagsEl.textContent = d.tags || '';
      thumbsEl.innerHTML = d.thumbs || ''; cycle();
      if (d.href) { card.setAttribute('href', d.href); card.removeAttribute('aria-disabled'); }
      else { card.removeAttribute('href'); card.setAttribute('aria-disabled', 'true'); }
      el.classList.add('active'); el.classList.toggle('linked', !!d.href);
      // align the caption's left edge to the step's line, kept inside the column
      var a = anchor[k], r = row.getBoundingClientRect(), b = a.getBoundingClientRect();
      var x = b.left + b.width / 2 - r.left, w = card.offsetWidth, W = el.clientWidth;
      if (a.classList.contains('rl-n')) x = a.classList.contains('rl-n') && x > W / 2 ? b.right - r.left : b.left - r.left;
      var flip = x + w > W;                       // near the right end: the caption ends at the line instead
      var left = flip ? Math.max(0, x - w) : x;
      el.classList.toggle('flip', flip);
      card.style.transform = 'translateX(' + left + 'px)';
    }
    function at(clientX) {
      var r = row.getBoundingClientRect(), x = clientX - r.left, best = 0;
      for (var i = 1; i < centers.length; i++) if (Math.abs(centers[i] - x) < Math.abs(centers[best] - x)) best = i;
      wave(x); show(parts[best].dataset.k);
    }
    function leave() { wave(null); show(null); }

    row.addEventListener('pointerenter', measure);
    row.addEventListener('pointermove', function (e) { if (!centers.length) measure(); at(e.clientX); });
    el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') leave(); });
    row.addEventListener('touchmove', function (e) { if (e.touches[0]) { if (!centers.length) measure(); at(e.touches[0].clientX); } }, { passive: true });
    addEventListener('resize', function () { centers = []; });
    row.addEventListener('click', function () { var d = cur && data[cur]; if (d && d.href) card.click(); });
    // keyboard: arrows move between steps, Enter opens
    row.addEventListener('focus', function () { measure(); if (!cur) { show(keys[1]); } });
    row.addEventListener('blur', function (e) { if (!el.contains(e.relatedTarget)) leave(); });
    row.addEventListener('keydown', function (e) {
      var i = keys.indexOf(cur);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault(); i = Math.max(0, Math.min(keys.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)));
        var a = anchor[keys[i]], r = row.getBoundingClientRect(), b = a.getBoundingClientRect();
        wave(b.left + b.width / 2 - r.left); show(keys[i]);
      } else if (e.key === 'Enter' && cur && data[cur].href) card.click();
    });
  }
  window.initRuler = function () { document.querySelectorAll('[data-ruler]').forEach(init); };
  window.initRuler();
})();
