/* =========================================================
   Matrix "digital rain" on a <canvas> — used by the certificates button (home) and the certificates page.
   matrixRain(canvas, { size, fade, fps, color, head, onlyWhenVisible })
   ========================================================= */
window.matrixRain = (cv, o = {}) => {
  if (!cv) return;
  const opt = Object.assign({ size: 16, fade: 'rgba(0,0,0,.09)', fps: 28, color: '#00ff41', head: '#d8ffe0', onlyWhenVisible: true, density: .975 }, o);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const g = cv.getContext('2d');
  const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01234567890123456789PEPESFAILFASTLEARN<>/=+*'.split('');
  const pick = () => glyphs[(Math.random() * glyphs.length) | 0];
  let W = 0, H = 0, cols = 0, drops = [], run = false, raf = 0, last = 0, dpr = 1;
  const size = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    if (!W || !H) return;
    cv.width = W * dpr; cv.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / opt.size);
    drops = Array.from({ length: cols }, () => -Math.random() * (H / opt.size) * 1.2);
    g.fillStyle = opt.fade.replace(/[\d.]+\)$/, '1)'); g.fillRect(0, 0, W, H);
    if (reduce) still();
  };
  const step = () => {
    g.fillStyle = opt.fade; g.fillRect(0, 0, W, H);
    g.font = `${opt.size}px "JetBrains Mono", ui-monospace, monospace`;
    g.textBaseline = 'top';
    for (let i = 0; i < cols; i++) {
      const y = drops[i] * opt.size, x = i * opt.size;
      if (y > -opt.size) {
        g.fillStyle = opt.color; g.fillText(pick(), x, y - opt.size);     // the trail
        g.fillStyle = opt.head; g.fillText(pick(), x, y);                  // the bright head
      }
      drops[i] += 1;
      if (y > H && Math.random() > opt.density) drops[i] = -Math.random() * 12;
    }
  };
  const still = () => { for (let k = 0; k < 60; k++) step(); };
  const loop = t => {
    if (!run) { raf = 0; return; }
    if (t - last > 1000 / opt.fps) { last = t; step(); }
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (reduce || run) return; run = true; if (!raf) raf = requestAnimationFrame(loop); };
  const stop = () => { run = false; };
  size();
  addEventListener('resize', size);
  if (opt.onlyWhenVisible) new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? start() : stop()))).observe(cv);
  else start();
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : (!opt.onlyWhenVisible || cv.getBoundingClientRect().bottom > 0) && start()));
  return { start, stop, resize: size };
};
