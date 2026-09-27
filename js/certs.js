/* =========================================================
   PEEPEE — Certificates page
   - you land straight among the certificates: they float around you in 3D
   - drag (or swipe) to turn the whole cloud, it drifts on its own; hover shows what it is
   - click any certificate: gallery with ← → / swipe / keys · chips filter the cloud
   ========================================================= */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---- glass nav once you scroll (same as the home page) ---- */
  const navEl = document.getElementById('nav');
  const glass = () => navEl?.classList.toggle('glass', scrollY > 80);
  addEventListener('scroll', glass, { passive: true }); glass();

  /* ---- menu ---- */
  const menuBtn = $('#menuBtn'), links = $('#links');
  menuBtn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.textContent = open ? 'CLOSE' : 'MENU';
  });

  /* ---- cursor block (same as home) ---- */
  if (fine) {
    const cur = document.createElement('div');
    cur.className = 'cur';
    document.body.appendChild(cur);
    document.documentElement.classList.add('has-cur');
    let mx = -99, my = -99, cx = -99, cy = -99;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; cur.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    addEventListener('pointerover', e => {
      const t = e.target, card = t.closest?.('[data-zoom]'), link = t.closest?.('a, button');
      const inLb = t.closest?.('.ctlb');
      cur.classList.toggle('view', !!card && !link && !inLb);
      cur.classList.toggle('link', !!link);
      cur.textContent = card && !link && !inLb ? 'VIEW' : '';
    }, { passive: true });
    addEventListener('pointerdown', () => cur.animate([{ scale: '1 1' }, { scale: '1.35 .7' }, { scale: '1 1' }], { duration: 260, easing: 'ease-out' }));
    const loop = () => {
      cx += (mx - cx) * 0.3; cy += (my - cy) * 0.3;
      cur.style.translate = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---- the rain (black · white · blue) and PROOF decoding itself ---- */
  window.matrixRain?.($('.mx-rain'), { size: 17, fade: 'rgba(0,0,0,.09)', fps: 24, color: '#2f7fd6', head: '#f6f6f3', onlyWhenVisible: false });
  const word = $('.mx-word');
  if (word && !reduce) {
    const target = word.dataset.word, G = 'アカサタナハマヤラワ0123456789#$%&*';
    let k = 0;
    const tick = () => {
      k++;
      word.textContent = [...target].map((ch, i) => (k > 8 + i * 5 ? ch : G[(Math.random() * G.length) | 0])).join('');
      if (k < 8 + target.length * 5 + 1) setTimeout(tick, 45);
    };
    setTimeout(tick, 200);
  }

  const shine = c => { c.classList.remove('shine'); void c.offsetWidth; c.classList.add('shine'); };
  /* ---- the cloud of certificates ---- */
  const stage = $('.cx-stage'), world = $('#grid');
  const cards = $$('.ct', world);
  const hudM = $('.cx-hud-m'), hudT = $('.cx-hud-t'), hud = $('.cx-hud');
  const n = cards.length;
  // spread them on a sphere (golden-angle spiral), then stretch it to the screen
  const pts = cards.map((c, i) => {
    const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996 + .6;
    return { c, x: Math.cos(th) * r, y, z: Math.sin(th) * r, a: 1, aw: 1, hov: 0, tilt: (Math.random() - .5) * 14 };
  });
  let W = 1, H = 1, yaw = .4, pitch = -.12, vy = 0, vp = 0, drag = null, hover = null, raf = 0, mx = 0, my = 0, moved = 0;
  const size = () => { W = stage.clientWidth; H = stage.clientHeight; };
  const frame = () => {
    if (!drag) {
      if (!hover && !reduce) vy += (.0016 - vy) * .03;
      else vy *= .9;
      vp *= .92;
      yaw += vy; pitch = Math.max(-.55, Math.min(.55, pitch + vp));
      pitch += ((-.12 + my * .18) - pitch) * .02;          // the mouse leans the cloud a little
    }
    const mob = W < 700, Rx = W * (mob ? .36 : .4), Ry = H * (mob ? .3 : .3), Rz = mob ? 240 : 330;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    pts.forEach(p => {
      let x = p.x * cy + p.z * sy, z = -p.x * sy + p.z * cy;
      let y = p.y * cp - z * sp; z = p.y * sp + z * cp;
      p.a += (p.aw - p.a) * .1; p.hov += ((hover === p ? 1 : 0) - p.hov) * .15;
      const depth = (z + 1) / 2;                           // 0 = at the back, 1 = right in front
      const X = x * Rx + mx * 20 * depth, Y = y * Ry, Z = z * Rz + p.hov * 90;
      p.c.style.transform = `translate3d(${X.toFixed(1)}px, ${Y.toFixed(1)}px, ${Z.toFixed(1)}px) rotateY(${(-x * 24).toFixed(1)}deg) rotateZ(${(p.tilt * (1 - p.hov)).toFixed(1)}deg) scale(${(1 + p.hov * .12).toFixed(3)})`;
      p.c.style.opacity = ((.28 + .72 * depth) * p.a).toFixed(3);
      p.c.style.zIndex = String(Math.round(depth * 1000));
      p.c.style.pointerEvents = p.aw && depth > .25 ? '' : 'none';
    });
    raf = requestAnimationFrame(frame);
  };
  size(); addEventListener('resize', size);
  frame();
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) frame(); });
  // drag / swipe to turn it
  stage.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('.chip, a, button')) return;
    drag = { x: e.clientX, y: e.clientY }; moved = 0; stage.classList.add('grab');
  });
  addEventListener('pointermove', e => {
    mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    vy = dx * .0045; vp = dy * .0025; yaw += vy; pitch = Math.max(-.55, Math.min(.55, pitch + vp));
  });
  const end = () => { drag = null; stage.classList.remove('grab'); };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
  // a drag shouldn't count as a click on a certificate
  world.addEventListener('click', e => { if (moved > 8) { e.stopPropagation(); e.preventDefault(); } }, true);
  // hover: bring it forward, pause the drift, say what it is
  const showHud = p => {
    const caps = $$('figcaption > *', p.c).map(x => x.textContent);
    hudT.textContent = caps[1] || ''; hudM.textContent = [caps[0], caps[2]].filter(Boolean).join(' · ');
    hud.classList.add('on');
  };
  pts.forEach(p => {
    p.c.addEventListener('pointerenter', () => { hover = p; showHud(p); shine(p.c); });
    p.c.addEventListener('pointerleave', () => { if (hover === p) { hover = null; hud.classList.remove('on'); } });
    p.c.addEventListener('focus', () => { hover = p; showHud(p); });
    p.c.addEventListener('blur', () => { if (hover === p) { hover = null; hud.classList.remove('on'); } });
    p.c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.c.click(); } });
  });
  cards.forEach(c => c.classList.add('dealt'));

  /* ---- filter: the others fade out of the cloud ---- */
  const chips = $$('.chip');
  chips.forEach(ch => ch.addEventListener('click', () => {
    if (ch.classList.contains('on')) return;
    chips.forEach(c => c.classList.toggle('on', c === ch));
    const f = ch.dataset.f;
    pts.forEach(p => { const ok = f === 'all' || p.c.dataset.cat === f; p.aw = ok ? 1 : 0; p.c.classList.toggle('gone', !ok); });
    vy = .03;                                               // a little spin as it reshuffles
  }));

  /* ---- gallery lightbox ---- */
  let lb = null, list = [], at = 0;
  const cap = c => {
    const s = $$('figcaption > *', c).map(x => x.innerHTML);
    return `<span class="mono">${s[0]}</span><b>${s[1]}</b><span class="mono">${s[2]}</span>`;
  };
  const show = (k, dir = 0) => {
    at = (k + list.length) % list.length;
    const c = list[at], src = $('img', c), img = $('img', lb);
    img.src = src.currentSrc || src.src; img.alt = src.alt;
    $('.ctlb-cap', lb).innerHTML = cap(c);
    $('.ctlb-n', lb).textContent = `${String(at + 1).padStart(2, '0')}/${String(list.length).padStart(2, '0')}`;
    if (dir && !reduce) img.animate([{ transform: `translateX(${dir * 60}px) rotate(${dir * 3}deg)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
  };
  const close = () => {
    if (!lb) return;
    const el = lb; lb = null;
    el.classList.remove('on'); setTimeout(() => el.remove(), 300);
    removeEventListener('keydown', key);
  };
  const key = e => {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(at + 1, 1);
    if (e.key === 'ArrowLeft') show(at - 1, -1);
  };
  cards.forEach(c => c.addEventListener('click', () => {
    list = cards.filter(x => !x.classList.contains('gone'));
    lb = document.createElement('div');
    lb.className = 'ctlb';
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<img alt=""><div class="ctlb-bar"><div class="ctlb-cap"></div><div class="ctlb-ui"><button type="button" class="p" aria-label="ใบก่อนหน้า">←</button><span class="mono ctlb-n"></span><button type="button" class="n" aria-label="ใบถัดไป">→</button><button type="button" class="x" aria-label="ปิด">✕</button></div></div>';
    document.body.appendChild(lb);
    show(list.indexOf(c));
    if (!reduce) {
      const a = $('.ct-card', c).getBoundingClientRect(), img = $('img', lb), b = img.getBoundingClientRect();
      if (b.width) img.animate([{ transform: `translate(${a.left - b.left}px,${a.top - b.top}px) scale(${a.width / b.width})`, transformOrigin: '0 0' }, { transform: 'none', transformOrigin: '0 0' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    requestAnimationFrame(() => lb.classList.add('on'));
    $('.p', lb).onclick = e => { e.stopPropagation(); show(at - 1, -1); };
    $('.n', lb).onclick = e => { e.stopPropagation(); show(at + 1, 1); };
    $('.x', lb).onclick = close;
    lb.addEventListener('click', e => { if (e.target === lb || e.target.tagName === 'IMG') close(); });
    let sx = null;
    lb.addEventListener('pointerdown', e => (sx = e.clientX));
    lb.addEventListener('pointerup', e => {
      if (sx === null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 50) { lb._swiped = true; show(at + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); }
    });
    lb.addEventListener('click', e => { if (lb && lb._swiped) { e.stopImmediatePropagation(); lb._swiped = false; } }, true);
    addEventListener('keydown', key);
  }));
})();
