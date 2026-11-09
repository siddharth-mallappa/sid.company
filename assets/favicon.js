/* Animated favicon: a gradient tile with waves flowing across it.
   Browsers don't animate SVG/GIF favicons, so frames are drawn on a canvas. */
(function () {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var link = document.querySelector('link[rel="icon"]');
  var c = document.createElement('canvas'); c.width = c.height = 64;
  var x = c.getContext('2d'); if (!link || !x) return;
  function rr(r) { x.beginPath(); x.moveTo(r,0); x.arcTo(64,0,64,64,r); x.arcTo(64,64,0,64,r); x.arcTo(0,64,0,0,r); x.arcTo(0,0,64,0,r); x.closePath(); }
  function wave(t, base, amp, len, speed, fill) {
    x.beginPath(); x.moveTo(0, 64);
    for (var i = 0; i <= 64; i += 2) x.lineTo(i, base + amp * Math.sin((i / len) * Math.PI * 2 + t * speed));
    x.lineTo(64, 64); x.closePath(); x.fillStyle = fill; x.fill();
  }
  function draw(t) {
    var s = t / 1000, h = 228 + 18 * Math.sin(s * 0.8);          // hue drifts between blue and violet
    x.clearRect(0, 0, 64, 64);
    x.save(); rr(14); x.clip();
    var g = x.createLinearGradient(0, 0, 64, 64);
    g.addColorStop(0, 'hsl(' + (h + 10) + ',100%,68%)');
    g.addColorStop(0.55, 'hsl(' + h + ',72%,50%)');
    g.addColorStop(1, 'hsl(' + (h - 6) + ',72%,26%)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    wave(s, 30, 6, 48, 2.2, 'rgba(255,255,255,0.18)');
    wave(s, 38, 5, 40, -2.8, 'rgba(120,230,255,0.28)');
    wave(s, 46, 4, 56, 1.6, 'rgba(10,20,90,0.35)');
    x.restore();
    link.type = 'image/png'; link.href = c.toDataURL('image/png');
  }
  setInterval(function () { draw(performance.now()); }, 80);
})();
