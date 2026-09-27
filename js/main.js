/* =========================================================
   PEEPEE — Portfolio interactions
   1) mobile menu + active nav link
   2) STORY: each beat comes into focus (blur → sharp) as it reaches the middle of the screen
   3) light panels grow in when they enter
   4) WORK: a block flies in, smashes through the edge of the page, then projects rise up
   ========================================================= */
(() => {
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // phones / weaker machines get a lighter version of every canvas effect (fewer pixels, fewer particles)
  const LITE = matchMedia('(pointer: coarse)').matches && ((navigator.hardwareConcurrency || 8) <= 6 || (navigator.deviceMemory || 8) <= 4)
    || (navigator.hardwareConcurrency || 8) <= 4;
  const DPR = cap => Math.min(LITE ? 1 : cap, devicePixelRatio || 1);
  if (LITE) document.documentElement.classList.add('lite');
  // pause every looping CSS animation (bobbing cards, blinking dots…) in sections that are off screen
  addEventListener('DOMContentLoaded', () => {
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('off', !e.isIntersecting)), { rootMargin: '120px 0px' });
    document.querySelectorAll('body > section, body > footer, main > section, main > footer, .wk-after, .panel-wrap').forEach(el => io.observe(el));
  });
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- SOUND: tiny synthesized effects only (no music). On by default; browsers only let audio start after the
                  visitor's first click/tap/key, so we quietly unlock it then. Corner switch turns it off. ---------- */
  const sound = (() => {
    let on = true, ctx = null, master = null;
    try { if (localStorage.getItem('pp-sound') === '0') on = false; } catch (e) {}
    const ac = () => {
      if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); master = ctx.createGain(); master.gain.value = .55; master.connect(ctx.destination); }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx.state === 'running' ? ctx : null;
    };
    const unlock = () => { ac(); ['pointerdown', 'keydown', 'touchend'].forEach(e => removeEventListener(e, unlock, true)); };
    ['pointerdown', 'keydown', 'touchend'].forEach(e => addEventListener(e, unlock, true));
    const noise = (dur) => { const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const n = ctx.createBufferSource(); n.buffer = b; return n; };
    const tone = (f, dur, { type = 'sine', gain = .2, f2 = null, at = 0 } = {}) => {
      const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(master); o.start(t); o.stop(t + dur + .05);
    };
    const hiss = (dur, { gain = .2, from = 800, to = 4000, q = .8, at = 0, type = 'bandpass', attack = .3 } = {}) => {
      const t = ctx.currentTime + at, n = noise(dur), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = type; f.Q.value = q; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + dur * attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      n.connect(f).connect(g).connect(master); n.start(t); n.stop(t + dur);
    };
    const fx = {
      tick(k = 0) { tone(1800 + Math.random() * 500 - k * 6, .05, { type: 'triangle', gain: .045 }); },
      whoosh(d = 1.6) { hiss(d, { gain: .16, from: 300, to: 5000, q: .7, attack: .75 }); },
      impact() { tone(120, .6, { gain: .5, f2: 38 }); hiss(.35, { gain: .22, from: 2500, to: 300, q: .5, attack: .02, type: 'lowpass' }); tone(880, 1.2, { type: 'sine', gain: .05, at: .02 }); },
      crash() { hiss(.25, { gain: .28, from: 4000, to: 600, q: .6, attack: .02 }); tone(90, .3, { gain: .3, f2: 50 }); },
      clack() { tone(420 + Math.random() * 80, .06, { type: 'square', gain: .025 }); },
      pop() { tone(660, .12, { gain: .12, f2: 990 }); tone(1320, .25, { gain: .04, at: .05 }); },
      open() { hiss(.35, { gain: .08, from: 600, to: 3000, attack: .6 }); tone(520, .18, { gain: .06, f2: 780 }); },
      close() { hiss(.3, { gain: .07, from: 3000, to: 500, attack: .2 }); },
      // silly ones for the badge
      boing() { const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(90, t + .55);
        l.frequency.value = 22; lg.gain.setValueAtTime(60, t); lg.gain.exponentialRampToValueAtTime(1, t + .55); l.connect(lg).connect(o.frequency);
        g.gain.setValueAtTime(.001, t); g.gain.linearRampToValueAtTime(.35, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .6);
        o.connect(g).connect(master); o.start(t); l.start(t); o.stop(t + .65); l.stop(t + .65); },
      slide() { tone(260, .5, { type: 'sine', gain: .22, f2: 1300 }); },
      squeak() { tone(900, .08, { type: 'triangle', gain: .2, f2: 1900 }); tone(1900, .1, { type: 'triangle', gain: .16, f2: 1100, at: .08 }); },
      bloop() { tone(300, .12, { gain: .3, f2: 900 }); tone(700, .14, { gain: .22, f2: 500, at: .1 }); },
      quack() { [0, .17].forEach(at => { const t = ctx.currentTime + at, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(620, t); o.frequency.exponentialRampToValueAtTime(420, t + .14);
        f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 3;
        g.gain.setValueAtTime(.001, t); g.gain.linearRampToValueAtTime(.3, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .15);
        o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + .16); }); },
      honk() { [0, .2].forEach((at, i) => { const t = ctx.currentTime + at, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = 'square'; o.frequency.value = i ? 196 : 247; f.type = 'lowpass'; f.frequency.value = 1400;
        g.gain.setValueAtTime(.001, t); g.gain.linearRampToValueAtTime(.16, t + .015); g.gain.setValueAtTime(.16, t + .14); g.gain.exponentialRampToValueAtTime(.0001, t + .19);
        o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + .2); }); },
    };
    const api = {
      get on() { return on; },
      set(v) { on = !!v; try { localStorage.setItem('pp-sound', on ? '1' : '0'); } catch (e) {} document.documentElement.classList.toggle('sound-on', on); if (on) { ac(); fx.pop && api.play('pop'); } },
      play(name, ...a) { if (on && ctx && ac()) try { fx[name](...a); } catch (e) {} },
    };
    document.documentElement.classList.toggle('sound-on', on);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'snd mono'; b.setAttribute('aria-label', 'เปิด/ปิดเสียงเอฟเฟกต์');
    b.innerHTML = '<span class="snd-bars"><i></i><i></i><i></i><i></i></span><span class="snd-t"></span>';
    b.addEventListener('click', () => api.set(!on));
    document.body.appendChild(b);
    return api;
  })();

  /* (custom wheel smoothing removed — the browser's own scrolling is smoother and lighter) */

  /* ---------- 1. menu + active link ---------- */
  const menuBtn = $('#menuBtn'), links = $('#links');
  menuBtn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.textContent = open ? 'CLOSE' : 'MENU';
  });
  $$('a', links).forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); menuBtn.textContent = 'MENU';
  }));
  const navMap = new Map($$('a', links).map(a => [a.getAttribute('href').slice(1), a]));
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    navMap.forEach(a => a.classList.remove('active'));
    navMap.get(e.target.id)?.classList.add('active');
  }), { rootMargin: '-45% 0px -50% 0px' });
  navMap.forEach((_, id) => { const s = document.getElementById(id); if (s) secIO.observe(s); });

  // note: we no longer switch everything off for reduced motion —
  // only screen shake and scroll blur are skipped (see `reduce` below)

  /* ---------- 1b. HERO — the dot bursts in through the right edge and rolls into place ---------- */
  let afterRoll = null;
  async function heroRoll(fast) {
    const sq = $('.wm .sq');
    const fx = $('#fx');
    if (!sq) return;
    await wait(fast ? 60 : 900);                       // let P-E-E rise first (the intro already did)
    const r = sq.getBoundingClientRect();
    const s = r.width, W = document.documentElement.clientWidth;   // page width without the scrollbar
    if (!s || r.bottom < 0 || r.left > W - s) { showSq(); afterRoll?.(); return; }
    const cy = r.top + s / 2;

    // impact at the right edge: blue flash, crack, shards, tiny shake
    clearFx();
    fx.style.opacity = 1;
    const edge = make('edge');
    edge.animate([{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 0 }], { duration: 650, fill: 'forwards' });
    crack(W, cy, s); sound.play('crash');
    shards(W, cy, s);
    if (!reduce) $('#page').animate([
      { transform: 'translate(0,0)' }, { transform: 'translate(-6px,2px)' }, { transform: 'translate(4px,-2px)' }, { transform: 'translate(0,0)' }
    ], { duration: 280, easing: 'ease-out' });

    // the rolling square: pivots on its corners, one quarter-turn per side length
    const roller = make('roller');
    roller.style.width = roller.style.height = s + 'px';
    const dist = W - r.left;                           // from just outside the right edge to its slot
    const turns = Math.max(2, Math.round(dist / s));
    const lift = s * 0.207;                            // corner lift when a square rolls: (√2−1)/2 · s
    const frames = [];
    for (let i = 0; i <= turns; i++) {
      const t = i / turns;
      frames.push({ offset: t, transform: `translate(${r.left + dist * (1 - t)}px, ${r.top}px) rotate(${-90 * i}deg)` });
      if (i < turns) {
        const tm = (i + 0.5) / turns;
        frames.push({ offset: tm, transform: `translate(${r.left + dist * (1 - tm)}px, ${r.top - lift}px) rotate(${-90 * i - 45}deg)` });
      }
    }
    for (let i = 1; i <= turns; i++) setTimeout(() => sound.play('clack'), (380 + turns * 140) * (i / turns) * .92);
    await roller.animate(frames, { duration: 380 + turns * 140, easing: 'cubic-bezier(.25,.6,.35,1)', fill: 'forwards' }).finished;
    // settle
    await roller.animate([
      { transform: `translate(${r.left}px, ${r.top}px) rotate(${-90 * turns}deg)` },
      { transform: `translate(${r.left}px, ${r.top}px) rotate(${-90 * turns + 6}deg)`, offset: .4 },
      { transform: `translate(${r.left}px, ${r.top}px) rotate(${-90 * turns}deg)` }
    ], { duration: 260, easing: 'ease-out', fill: 'forwards' }).finished;
    showSq();
    roller.remove();
    afterRoll?.(); afterRoll = null;
    await wait(900);
    clearFx();
  }


  function showSq() { $('.wm .sq')?.classList.add('in'); sound.play('pop'); setTimeout(showHint, 2500); }
  // people didn't notice the dot is a toy — point at it until they grab it once
  let hintDone = false;
  try { hintDone = sessionStorage.getItem('pp-dragged') === '1'; } catch (e) {}
  // the ring lives ON the dot (a pseudo-element), so it moves, bounces and rotates with it
  function showHint() { if (!hintDone) $('.wm .sq.in')?.classList.add('hinting'); }
  function hideHint() {
    hintDone = true;
    try { sessionStorage.setItem('pp-dragged', '1'); } catch (e) {}
    $('.wm .sq')?.classList.remove('hinting');
  }
  $('.wm .sq')?.addEventListener('pointerdown', hideHint);

  /* ---------- 2. story: no blur — headings light up word by word as you scroll (text-scroll reveal),
                  and each beat just drifts a touch. Fully readable across the whole middle of the screen. ---------- */
  const focusEls = $$('.focus').filter(el => !el.classList.contains('has-log') && !el.closest('.pstory'));
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
  const splitWords = el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const parts = seg ? [...seg.segment(n.textContent)].map(x => x.segment) : n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            const w = document.createElement('span'); w.className = 'sw'; w.textContent = t; frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('outline')) walk(n);
        else if (n.nodeType === 1) { n.classList.add('sw'); }
      });
    };
    walk(el);
    return $$('.sw', el);
  };
  const reveals = reduce ? [] : $$('.story .focus h2, .story .focus h3, .story .motto-type').map(el => ({ el, words: splitWords(el) }));
  let ticking = false;
  function updateFocus() {
    ticking = false;
    if (reduce) return;
    const vh = innerHeight;
    for (const el of focusEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      // only fades right at the very edges of the screen; the whole middle is fully sharp
      const c = r.top + r.height / 2, off = Math.abs(c - vh / 2) / (vh / 2);
      const e = Math.max(0, (off - .72) / .5);
      el.style.opacity = (1 - Math.min(1, e) * .7).toFixed(3);
      el.style.transform = `translateY(${((c - vh / 2) / vh * 26).toFixed(1)}px)`;
    }
    for (const { el, words } of reveals) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 1.5) continue;
      const p = Math.max(0, Math.min(1, (vh * .92 - r.top) / (vh * .42)));   // done by the time it's ~half way up
      const n = words.length;
      words.forEach((w, i) => { w.style.opacity = (0.14 + 0.86 * Math.max(0, Math.min(1, p * (n + 1.5) - i))).toFixed(3); });
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(updateFocus); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  updateFocus();

  /* ---------- 2b. hero exit: as you scroll away, the game window shrinks into a rounded frame and PEE. sinks back ---------- */
  const heroEl = $('#home'), heroBg = $('.hero-bg'), wmEl = $('.wm');
  const heroExit = () => {
    if (reduce || document.documentElement.classList.contains('intro-on')) return;
    const k = Math.max(0, Math.min(1, scrollY / (innerHeight * .9)));
    if (heroBg) {
      heroBg.style.clipPath = k ? `inset(${(k * 6).toFixed(2)}% ${(k * 5).toFixed(2)}% ${(k * 10).toFixed(2)}% round ${(k * 28).toFixed(1)}px)` : '';
      heroBg.style.transform = k ? `scale(${(1 - k * .04).toFixed(3)})` : '';
    }
    if (wmEl) { wmEl.style.transform = k ? `translateY(${(k * 60).toFixed(1)}px) scale(${(1 - k * .12).toFixed(3)})` : ''; wmEl.style.opacity = k ? (1 - k * .55).toFixed(3) : ''; }
  };
  let heroT = false, heroDone = false;
  addEventListener('scroll', () => {
    if (heroT) return;
    const past = scrollY > innerHeight * 1.2;
    if (past && heroDone) return;                                   // already at its final state
    heroT = true; requestAnimationFrame(() => { heroT = false; heroExit(); heroDone = past; });
  }, { passive: true });
  // the hero video only plays while you can see it
  (() => { const v = $('.hero-bg video'); if (!v) return;
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) v.play?.().catch(() => {}); else v.pause(); }), { threshold: .02 }).observe(v); })();

  /* ---------- 2c. WORK: cards tip up out of 3D as they scroll in (container-scroll style) ---------- */
  const tipCards = reduce ? [] : $$('.work .card');
  const tip = () => {
    const vh = innerHeight;
    tipCards.forEach(c => {
      const r = c.getBoundingClientRect();
      if (r.top > vh * 1.2 || r.bottom < -vh * .2) return;
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * .6)));
      const max = c.classList.contains('feat') ? 28 : 16;
      c.style.rotate = p < 1 ? `x ${(max * (1 - p) ** 2).toFixed(2)}deg` : '';
      c.style.scale = p < 1 ? (0.9 + 0.1 * p).toFixed(3) : '';
    });
  };



  /* ---------- polish (ideas from MotionSites-style heroes): glass nav once you leave the hero,
                  big section titles rise letter by letter, SFX pill steps aside for the footer ---------- */
  (() => {
    const nav = $('#nav'), root = document.documentElement;
    const glass = () => nav?.classList.toggle('glass', scrollY > innerHeight * .6);
    addEventListener('scroll', glass, { passive: true }); glass();
    // letter rise
    $$('h2.big').forEach(h => {
      let i = 0;
      const walk = node => [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const f = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(word => {
            if (!word) return;
            if (/^\s+$/.test(word)) { f.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'wd';                // keep each word on one line
            [...word].forEach(ch => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i++); s.textContent = ch; w.appendChild(s); });
            f.appendChild(w);
          });
          n.replaceWith(f);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
      walk(h);
      h.classList.add('split');
    });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .35 });
    $$('h2.big.split').forEach(h => io.observe(h));
    // SFX pill hides while the footer is on screen (it used to sit on top of the logo)
    const foot = $('.foot'), snd = $('.snd');
    if (foot && snd) new IntersectionObserver(es => es.forEach(e => snd.classList.toggle('tuck', e.isIntersecting))).observe(foot);
  })();


  /* ---------- ABOUT: a 3D lanyard badge on a rope (verlet physics) — drag it, fling it, click it.
                  Every click plays a silly sound and swaps the line that describes me. ---------- */
  (() => {
    const spot = $('#lanyard'); if (!spot) return;
    const stage = spot.closest('.about') || spot;          // the card can be dragged anywhere in ABOUT
    const cv = $('canvas', spot), g = cv.getContext('2d'), card = $('.badge', spot), line = $('#aboutLine');
    const lines = [
      'ผมเคยลงสมัครแข่งไปมากกว่า <b>20 รายการ</b> แต่ไม่ผ่านเข้ารอบเลยสักครั้ง',
      '<b>GameJamX</b> ทำให้ผมได้เจอเพื่อนที่เก่ง ๆ มากมาย และสอนผมเรื่องการแบ่งและจัดสรรเวลาอย่างมาก',
      '<b>Metaverse Hackathon</b> ทำให้ผมได้เรียนรู้เรื่องการ Pitching อย่างมาก และได้สร้างผลงานที่ใช้งานได้จริงออกมา',
      'ตอนที่ครูให้โอกาสผมจัดกิจกรรม <b>วิทย์ × AI</b> ผมไม่มั่นใจเลย แต่ผมก็เลือกที่จะทำมัน และสุดท้าย ผมก็ทำได้',
      'การได้เข้ามาอยู่ใน <b>Hamster Hub</b> เป็นการตัดสินใจที่ดีที่สุดในรอบหลายปีของชีวิตผม ทำให้ผมได้พัฒนาตัวเองในทุก ๆ ด้าน และได้อยู่ในสภาพแวดล้อมที่มีแต่คนเก่ง ๆ ที่มี Passion',
    ];
    const silly = ['boing', 'quack', 'slide', 'squeak', 'honk', 'bloop'];
    let li = 0, si = 0;
    let W = 0, H = 0, dpr = 1, cw = 0, ch = 0;
    const N = 14; let SEG = 20;
    const P = Array.from({ length: N }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
    const C = { x: 0, y: 0, px: 0, py: 0 };       // the card's centre — just one more (heavier) point on the rope
    let D = 0, anchor = { x: 0, y: 0 }, dropped = false, visible = false, raf = 0;
    const size = () => {
      const r = stage.getBoundingClientRect(); W = r.width; H = r.height; dpr = DPR(1.5);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      cw = card.offsetWidth; ch = card.offsetHeight; D = ch / 2 + 6;
      const sr = spot.getBoundingClientRect(), pr = stage.getBoundingClientRect();
      anchor = { x: sr.left - pr.left + sr.width * .5, y: -20 };
      SEG = Math.max(10, (sr.top - pr.top + sr.height - 70 - ch + 20) / (N - 1));   // rests where the photo used to be
    };
    const reset = (fromAbove) => {
      const off = fromAbove ? -(SEG * N + ch + 200) : 0;
      P.forEach((p, i) => { p.x = p.px = anchor.x + (fromAbove ? 0 : 0); p.y = p.py = anchor.y + i * SEG + off; });
      C.x = C.px = anchor.x + 30; C.y = C.py = P[N - 1].y + D;
    };
    const solve = (a, b, len, wa, wb) => {
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .001, k = (d - len) / d;
      a.x += dx * k * wa; a.y += dy * k * wa; b.x -= dx * k * wb; b.y -= dy * k * wb;
    };
    let drag = null;
    const step = () => {
      const grav = .55, damp = .988;
      for (const p of [...P.slice(1), C]) {
        if (p === C && drag) continue;
        const vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp;
        p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + grav;
      }
      if (drag) { C.px = C.x; C.py = C.y; C.x = drag.x; C.y = drag.y; }
      for (let it = 0; it < 14; it++) {
        P[0].x = anchor.x; P[0].y = anchor.y;
        for (let i = 0; i < N - 1; i++) solve(P[i], P[i + 1], SEG, i ? .5 : 0, i ? .5 : 1);
        solve(P[N - 1], C, D, drag ? 1 : .8, drag ? 0 : .2);
        // keep it inside the panel sideways
        C.x = Math.max(cw * .4, Math.min(W - cw * .4, C.x));
        if (C.y > H - ch * .45) C.y = H - ch * .45;
      }
    };
    const draw = () => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      // the strap: dark band with PEPES printed along it
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (let i = 0; i < N - 1; i++) {
        const a = P[i], b = P[i + 1], ang = Math.atan2(b.y - a.y, b.x - a.x), len = Math.hypot(b.x - a.x, b.y - a.y);
        g.save(); g.translate(a.x, a.y); g.rotate(ang);
        g.fillStyle = '#121214'; g.fillRect(-1, -9, len + 2, 18);
        g.restore();
      }
      // print the name along the strap in a second pass so later segments don't cover it
      g.fillStyle = 'rgba(246,246,243,.85)'; g.font = '700 8px "JetBrains Mono", monospace'; g.textBaseline = 'middle';
      for (let i = 1; i < N - 2; i += 3) {
        const a = P[i], b = P[i + 2], ang = Math.atan2(b.y - a.y, b.x - a.x);
        g.save(); g.translate(a.x, a.y); g.rotate(ang); g.fillText('PEPES', 2, .5); g.restore();
      }
      // metal clip where the strap meets the card
      const e = P[N - 1], ang = Math.atan2(C.x - e.x, C.y - e.y);
      g.save(); g.translate(e.x, e.y); g.rotate(-ang);
      g.fillStyle = '#9a9aa0'; g.fillRect(-9, -4, 18, 14); g.fillStyle = '#6a6a70'; g.fillRect(-5, 6, 10, 8);
      g.restore();
      // the card: position + swing angle from the rope, plus a 3D lean from how fast it's moving
      const vx = C.x - C.px, vy = C.y - C.py;
      const ry = Math.max(-60, Math.min(60, vx * 3.2)), rx = Math.max(-35, Math.min(35, -vy * 2.2));
      card.style.transform = `translate(${(C.x - cw / 2).toFixed(1)}px, ${(C.y - ch / 2).toFixed(1)}px) rotate(${(-ang * 180 / Math.PI).toFixed(2)}deg) rotateY(${ry.toFixed(1)}deg) rotateX(${rx.toFixed(1)}deg)`;
      card.style.setProperty('--gl', (50 + ry).toFixed(0) + '%');
    };
    let still = 0;
    const loop = () => {
      step(); step(); draw();
      still = !drag && Math.hypot(C.x - C.px, C.y - C.py) < .04 ? still + 1 : 0;
      raf = (visible && still < 45) || drag ? requestAnimationFrame(loop) : 0;     // sleeps when it has stopped swinging
    };
    const kick = () => { still = 0; if (!raf) raf = requestAnimationFrame(loop); };
    // pointer: drag / fling / click
    let down = null;
    const local = e => { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    card.addEventListener('pointerdown', e => {
      e.preventDefault(); card.setPointerCapture(e.pointerId);
      const q = local(e); down = { x: q.x, y: q.y, t: performance.now(), moved: 0 };
      drag = { x: C.x, y: C.y, ox: q.x - C.x, oy: q.y - C.y }; stage.classList.add('grab'); kick();
    });
    card.addEventListener('pointermove', e => {
      if (!drag) return; const q = local(e);
      down.moved = Math.max(down.moved, Math.hypot(q.x - down.x, q.y - down.y));
      drag.x = q.x - drag.ox; drag.y = q.y - drag.oy;
    });
    const up = () => {
      if (!drag) return;
      const click = down && down.moved < 6 && performance.now() - down.t < 400;
      drag = null; stage.classList.remove('grab');
      if (click) poke();
    };
    card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });
    function poke() {
      sound.play(silly[si++ % silly.length]);
      C.px -= (Math.random() - .5) * 26; C.py += 10;                    // a little bump so it swings
      li = (li + 1) % lines.length;
      if (line) {
        if (reduce) { line.innerHTML = lines[li]; }
        else line.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: 160, easing: 'ease-in' }).finished.then(() => {
          line.innerHTML = lines[li];
          line.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
        });
      }
      card.animate([{ scale: '1' }, { scale: '1.06' }, { scale: '1' }], { duration: 260, easing: 'cubic-bezier(.3,1.6,.5,1)', composite: 'add' });
      kick();
    }
    new IntersectionObserver(es => es.forEach(en => {
      visible = en.isIntersecting;
      if (visible && !dropped) { dropped = true; size(); reset(!reduce); }   // first time: it drops in from above and swings
      if (visible) kick();
    }), { threshold: .15 }).observe(spot);
    addEventListener('resize', () => { const cx = C.x / (W || 1); size(); C.x = C.px = cx * W; kick(); });
    size(); reset(false); draw();
  })();

  /* ---------- ABOUT: skills as a 3D keyboard — every key is a skill; press one (mouse, tap or your real keyboard) ---------- */
  (() => {
    const kb = $('#skillKeys'); if (!kb) return;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const logos = {'Unity': '<path d="M8 1l6 3.5v7L8 15l-6-3.5v-7z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 8l6-3.5M8 8v7M8 8L2 4.5" stroke="currentColor" stroke-width="1.6"/>','C#': '<path d="M8 1l6.5 3.7v6.6L8 15l-6.5-3.7V4.7z" fill="#68217a"/><text x="8" y="10.8" font-size="7" font-weight="700" fill="#fff" text-anchor="middle" font-family="sans-serif">C#</text>','Python': '<path d="M8 1.5c-3 0-3 1.3-3 2.5v1.5h3v.6H3.6C2 6.1 1.5 7.4 1.5 8.9S2 11.6 3.6 11.6H5V10c0-1.4 1.2-2.4 2.6-2.4h3c1.2 0 2-.9 2-2V4c0-1.4-1.6-2.5-4.6-2.5z" fill="#3776ab"/><path d="M8 14.5c3 0 3-1.3 3-2.5v-1.5H8v-.6h4.4c1.6 0 2.1-1.3 2.1-2.8S14 4.4 12.4 4.4H11V6c0 1.4-1.2 2.4-2.6 2.4h-3c-1.2 0-2 .9-2 2V12c0 1.4 1.6 2.5 4.6 2.5z" fill="#ffd43b"/>','Figma': '<circle cx="10" cy="8" r="2.5" fill="#1abcfe"/><path d="M5.5 13a2.5 2.5 0 015 0v-2.5h-2.5A2.5 2.5 0 005.5 13z" fill="#0acf83"/><path d="M5.5 8a2.5 2.5 0 012.5-2.5h2.5v5H8A2.5 2.5 0 015.5 8z" fill="#a259ff"/><path d="M5.5 3A2.5 2.5 0 018 .5h2.5v5H8A2.5 2.5 0 015.5 3z" fill="#f24e1e"/><path d="M10.5.5H13a2.5 2.5 0 010 5h-2.5z" fill="#ff7262"/>','Canva': '<circle cx="8" cy="8" r="7" fill="#00c4cc"/><text x="8" y="11" font-size="8" font-weight="700" fill="#fff" text-anchor="middle" font-family="serif" font-style="italic">C</text>','GitHub': '<path d="M8 1a7 7 0 00-2.2 13.6c.35.07.5-.15.5-.34v-1.2c-1.95.42-2.36-.94-2.36-.94-.32-.8-.78-1.02-.78-1.02-.64-.44.05-.43.05-.43.7.05 1.07.72 1.07.72.63 1.07 1.64.76 2.04.58.06-.45.24-.76.44-.94-1.55-.18-3.19-.78-3.19-3.46 0-.76.27-1.39.72-1.88-.07-.18-.31-.89.07-1.85 0 0 .59-.19 1.93.72a6.6 6.6 0 013.5 0c1.34-.91 1.93-.72 1.93-.72.38.96.14 1.67.07 1.85.45.49.72 1.12.72 1.88 0 2.69-1.64 3.28-3.2 3.45.25.22.48.64.48 1.3v1.93c0 .19.13.41.5.34A7 7 0 008 1z" fill="currentColor"/>','AI': '<path d="M8 1l1.6 4.4L14 7l-4.4 1.6L8 13l-1.6-4.4L2 7l4.4-1.6z" fill="#4da3ff"/>', 'Java': '<path d="M6 9.5s-1 .6.7.8c2 .2 3 .2 5.2-.2 0 0 .6.4 1.4.7-4.9 2.1-11-.1-7.3-1.3zM5.4 12s-1.1.8.6 1c2.1.2 3.8.2 6.8-.3 0 0 .4.4 1 .6-6 1.7-12.6.1-8.4-1.3z" fill="#5382a1"/><path d="M8.9 7.8c1.2 1.4-.3 2.6-.3 2.6s3-1.6 1.7-3.5C9 5 8.2 4.3 12.6 1.8c0 0-6.9 1.7-3.7 6z" fill="#e76f00"/>', 'PHP': '<ellipse cx="8" cy="8" rx="7.5" ry="4.2" fill="#777bb3"/><text x="8" y="10.2" font-size="5.6" font-weight="700" fill="#fff" text-anchor="middle" font-family="sans-serif" font-style="italic">php</text>', 'HTML': '<path d="M2 1h12l-1.1 12.3L8 15l-4.9-1.7z" fill="#e34f26"/><path d="M5 4.5h6l-.2 2H7l.1 1.5h3.5l-.3 3.3L8 12l-2.3-.7-.1-1.6h1.4l.1.6.9.3.9-.3.1-1.1H5.3z" fill="#fff"/>', 'CSS': '<path d="M2 1h12l-1.1 12.3L8 15l-4.9-1.7z" fill="#1572b6"/><path d="M5 4.5h6l-.2 2H7.1l.1 1.5h3.4l-.3 3.3L8 12l-2.3-.7-.1-1.6h1.4l.1.6.9.3.9-.3.1-1.1H5.3z" fill="#fff"/>', 'JavaScript': '<rect x="1" y="1" width="14" height="14" rx="1.5" fill="#f7df1e"/><text x="10" y="13" font-size="6.5" font-weight="700" fill="#222" text-anchor="middle" font-family="sans-serif">JS</text>'};
    // name · key colour · what it means to me (แก้คำอธิบายได้ตรงนี้)
    const SK = [
      ['Unity', '#1d1d20', 'เอนจินหลักที่ผมใช้ทำเกมทุกเกม ตั้งแต่เกมแจมไปจนถึงงานแข่ง'],
      ['C#', '#68217a', 'ภาษาที่ผมใช้เขียนระบบเกมทั้งหมดใน Unity'],
      ['Game Systems', '#2b78cc', 'ออกแบบกติกา ระบบ และความก้าวหน้าของผู้เล่น'],
      ['Level Design', '#1f9d6b', 'วางด่านให้ผู้เล่นค่อย ๆ เรียนรู้โดยไม่ต้องอธิบาย'],
      ['Puzzle Design', '#e0892b', 'ปริศนาที่ท้าทาย แต่แฟร์กับผู้เล่น'],
      ['Python', '#3776ab', 'เขียนสคริปต์และลองทำงานด้าน AI'],
      ['AI', '#4da3ff', 'ใช้ AI เป็นเครื่องมือ — และสอนคนอื่นให้ใช้เป็น'],
      ['Prompting', '#6b5bd6', 'สั่ง AI ให้ได้งานที่ต้องการจริง ๆ'],
      ['Figma', '#f24e1e', 'ออกแบบ UI และหน้าจอเกมก่อนลงมือทำ'],
      ['Canva', '#00a3ad', 'ทำสไลด์ โปสเตอร์ และงานนำเสนอ'],
      ['Pitching', '#d6395b', 'นำเสนอผลงานต่อกรรมการให้เห็นภาพในไม่กี่นาที'],
      ['Teamwork', '#2f9e44', 'ทำงานเป็นทีมในเกมแจมและแฮกกาธอน'],
      ['GitHub', '#24292f', 'เก็บโค้ด และทำงานร่วมกับทีมโดยไม่ทับกัน'],
      ['Game Jam', '#f08c00', 'ทำเกมให้เสร็จในเวลาจำกัด เช่น 72 ชั่วโมง'],
      ['Physics', '#1c7ed6', 'เข้าใจฟิสิกส์ที่อยู่เบื้องหลังการเคลื่อนไหวในเกม'],
      ['Storytelling', '#9c36b5', 'เล่าเรื่องผ่านเกม และผ่านการนำเสนอ'],
      ['Leadership', '#111114', 'นำทีมจัดงาน Science Day × AI ให้นักเรียน 1,500+ คน'],
      ['Critical Thinking', '#495057', 'แยกปัญหาใหญ่เป็นชิ้นเล็ก แล้วแก้ทีละชิ้น'],
      ['Java', '#e76f00', 'พื้นฐานการเขียนโปรแกรมเชิงวัตถุ'],
      ['PHP', '#777bb3', 'เขียนฝั่งเซิร์ฟเวอร์ของเว็บเบื้องต้น'],
      ['HTML', '#e34f26', 'โครงของหน้าเว็บ — เว็บนี้ก็ด้วย'],
      ['CSS', '#1572b6', 'ทำให้หน้าเว็บสวยและขยับได้'],
      ['JavaScript', '#e8c21a', 'ทำให้หน้าเว็บมีชีวิต — ทุกลูกเล่นในเว็บนี้']];
    const initials = w => w.split(/\s+/).map(x => x[0]).join('').slice(0, 2);
    const board = $('.kb-board', kb), title = $('.kb-title', kb), desc = $('.kb-desc', kb), stage = $('.kb-stage', kb);
    const glyph = name => (logos[name] ? `<svg viewBox="0 0 16 16" aria-hidden="true">${logos[name]}</svg>` : `<b>${initials(name)}</b>`);
    const keys = SK.map(([name, col, d], i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'kc'; b.style.setProperty('--c', col);
      if (['#e8c21a', '#4da3ff', '#00a3ad'].includes(col)) b.classList.add('lt');
      b.innerHTML = `<span class="kc-wl"></span><span class="kc-wf"></span><span class="kc-body"></span><span class="kc-top">${glyph(name)}<i>${name}</i></span>`;
      b.setAttribute('aria-label', name);
      board.appendChild(b);
      return { b, name, d, col, r: Math.floor(i / 6), c: i % 6 };
    });
    const sp = document.createElement('button'); sp.type = 'button'; sp.className = 'kc kc-space lt'; sp.style.setProperty('--c', '#f1f1ec');
    sp.innerHTML = '<span class="kc-wl"></span><span class="kc-wf"></span><span class="kc-body"></span><span class="kc-top"><i>FAIL FAST. LEARN FAST.</i></span>'; sp.setAttribute('aria-label', 'Fail fast. Learn fast.'); board.appendChild(sp);
    keys.push({ b: sp, name: 'Fail fast.', d: 'ทุกทักษะบนคีย์บอร์ดนี้ ได้มาจากการลงมือทำ แพ้ แล้วเรียนรู้', col: '#4da3ff', r: 4, c: 2.5 });
    let cur = -1, user = false, auto = 0, vis = false;
    // RGB ripple: every key lights up in a ring spreading from the pressed one
    const ripple = (k, col) => {
      kb.style.setProperty('--wc', col);
      keys.forEach(o => {
        const dd = Math.hypot(o.r - k.r, o.c - k.c);
        o.b.style.setProperty('--dl', (dd * 55).toFixed(0) + 'ms');
        o.b.classList.remove('wave'); void o.b.offsetWidth; o.b.classList.add('wave');
      });
    };
    // the skill pops out of its key as a little hologram
    const pop = k => {
      if (reduce) return;
      const r = k.b.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      const el = document.createElement('div'); el.className = 'kb-pop'; el.style.setProperty('--c', k.col);
      el.innerHTML = k.b === sp ? '<b>FAIL FAST.</b>' : `${glyph(k.name)}<span>${k.name}</span>`;
      stage.appendChild(el);
      const x = r.left + r.width / 2 - sr.left, y = r.top + r.height * .3 - sr.top;
      el.animate([
        { transform: `translate(${x}px,${y}px) translate(-50%,-50%) scale(.3)`, opacity: 0 },
        { transform: `translate(${x}px,${y - 70}px) translate(-50%,-100%) scale(1.04)`, opacity: 1, offset: .3 },
        { transform: `translate(${x}px,${y - 90}px) translate(-50%,-100%) scale(1)`, opacity: 1, offset: .75 },
        { transform: `translate(${x}px,${y - 120}px) translate(-50%,-100%) scale(.96)`, opacity: 0 }
      ], { duration: 1150, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => el.remove();
    };
    const press = (i, how) => {                       // how: 'click' (full show) · 'hover' (quick) · 'auto' (demo)
      const k = keys[i]; if (!k) return;
      if (how !== 'auto') { user = true; clearInterval(auto); }
      k.b.classList.remove('down'); void k.b.offsetWidth; k.b.classList.add('down');
      clearTimeout(k.t); k.t = setTimeout(() => k.b.classList.remove('down'), 160);
      if (how !== 'hover') { ripple(k, k.col); pop(k); }
      if (i === cur) return;
      if (cur >= 0) keys[cur].b.classList.remove('on');
      cur = i; k.b.classList.add('on');
      kb.style.setProperty('--wc', k.col);
      title.textContent = k.name; desc.textContent = k.d;
      title.classList.remove('pop'); void title.offsetWidth; title.classList.add('pop');
      if (how !== 'auto') sound.play('clack');
    };
    // easter egg: type P-E-P-E-S (or press every key) → a rainbow wave over the whole board
    const rainbow = () => {
      keys.forEach(o => {
        o.b.style.setProperty('--dl', ((o.r + o.c) * 70).toFixed(0) + 'ms');
        o.b.style.setProperty('--wc', `hsl(${((o.r + o.c) * 32) % 360} 90% 60%)`);
        o.b.classList.remove('wave'); void o.b.offsetWidth; o.b.classList.add('wave');
        setTimeout(() => o.b.style.removeProperty('--wc'), 1400);
      });
      sound.play('pop');
    };
    keys.forEach((k, i) => {
      k.b.addEventListener('click', () => press(i, 'click'));
      if (fine) k.b.addEventListener('pointerenter', () => press(i, 'hover'));
    });
    new IntersectionObserver(es => es.forEach(e => {
      vis = e.isIntersecting;
      clearInterval(auto);
      if (vis && !user && !reduce) auto = setInterval(() => press((Math.random() * (keys.length - 1)) | 0, 'auto'), 2300);
    }), { threshold: .3 }).observe(kb);
    // your real keyboard: a letter jumps to a skill that starts with it · space = the motto · type "pepes" for a surprise
    let typed = '';
    addEventListener('keydown', e => {
      if (!vis || e.metaKey || e.ctrlKey || e.altKey || /input|textarea/i.test(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); press(keys.length - 1, 'click'); return; }
      const ch = (e.key || '').toLowerCase(); if (ch.length !== 1) return;
      typed = (typed + ch).slice(-5);
      if (typed === 'pepes') { rainbow(); typed = ''; return; }
      const list = keys.map((k, i) => [k, i]).filter(([k]) => k.name.toLowerCase().startsWith(ch));
      if (!list.length) return;
      const nx = list.find(([, i]) => i > cur) || list[0];
      press(nx[1], 'click');
    });
    press(0, 'auto');
    // the board leans toward the mouse a little
    if (fine && !reduce) {
      stage.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); stage.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(3)); stage.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(3)); });
      stage.addEventListener('pointerleave', () => { stage.style.setProperty('--mx', 0); stage.style.setProperty('--my', 0); });
    }
  })();

  /* ---------- 3. panels grow in ---------- */
  const panels = $$('.grow');
  panels.forEach(p => { if (p.getBoundingClientRect().top > innerHeight * 0.9) p.classList.add('pre'); });
  const panelIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.remove('pre'); panelIO.unobserve(e.target); }
  }), { threshold: 0.12 });
  panels.forEach(p => panelIO.observe(p));

  /* ---------- 3a. story blocks + versus lines play when they come into view ---------- */
  const playIO = new IntersectionObserver(es => es.forEach(e => {
    e.target.classList.toggle('on', e.isIntersecting);
  }), { threshold: 0.6 });
  const outsidePin = el => !el.closest('.pstory');      // the pinned story drives its own cubes / highlights
  $$('.cube').filter(outsidePin).forEach(c => playIO.observe(c));
  const vsIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('on'); vsIO.unobserve(e.target); }
  }), { rootMargin: '0px 0px -25% 0px' });
  $$('.vs').filter(outsidePin).forEach(v => vsIO.observe(v));
  const beatIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('seen'); beatIO.unobserve(e.target); }
  }), { threshold: 0.35 });
  $$('.beat').filter(outsidePin).forEach(b => beatIO.observe(b));
  const hlIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('lit'); hlIO.unobserve(e.target); }
  }), { threshold: 0.6, rootMargin: '0px 0px -15% 0px' });
  $$('.hl').filter(outsidePin).forEach(h => hlIO.observe(h));

  /* ---------- 3b. SMALL WINS — rows slide up one after another ---------- */
  const wins = $$('.wreveal');
  wins.forEach(w => { if (w.getBoundingClientRect().top > innerHeight * 0.9) w.classList.add('pre'); });
  const winIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const i = wins.indexOf(e.target);
    e.target.style.transitionDelay = (Math.max(0, i % 4) * 0.1) + 's';
    e.target.classList.remove('pre');
    winIO.unobserve(e.target);
  }), { threshold: 0.2 });
  wins.forEach(w => winIO.observe(w));

  /* ---------- 4. WORK — block crash ---------- */
  const page = $('#page'), fx = $('#fx'), work = $('#work');
  const rises = $$('.rise', work);
  const cards = $$('.card', work);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const anim = (el, kf, opt) => el.animate(kf, Object.assign({ fill: 'forwards' }, opt)).finished;
  const make = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; fx.appendChild(d); return d; };
  let running = false;
  // clear effect layers but never the block a visitor is currently throwing
  function clearFx() { [...fx.children].forEach(c => { if (!c.matches('.toy, .piece, .say')) c.remove(); }); }

  async function crash() {
    if (running) return;
    running = true;
    rises.forEach(el => (el.style.transitionDelay = '0s'));
    work.classList.add('armed');

    const W = document.documentElement.clientWidth, H = innerHeight;
    const bs = Math.round(Math.min(200, Math.max(96, W * 0.14)));
    const y = Math.round(H * 0.45 - bs / 2);
    const endX = W - bs;
    clearFx();
    fx.getAnimations().forEach(a => a.cancel()); fx.style.opacity = 1;
    fx.style.setProperty('--bs', bs + 'px');

    const flash = make('flash');
    const edge = make('edge');
    const trails = [0, 1, 2, 3].map(i => {
      const t = make('trail');
      t.style.top = (y + bs * (0.22 + i * 0.18)) + 'px';
      t.style.width = (bs * (1.4 - i * 0.22)) + 'px';
      t.style.opacity = 0;
      return t;
    });
    const block = make('block', '<span>THE BLOCK</span><span>→ IMPACT</span>');

    // 1) ENTER — accelerate in from the left
    const enterOpt = { duration: 540, easing: 'cubic-bezier(.55,0,1,.45)' };
    trails.forEach((t, i) => anim(t, [
      { transform: `translateX(${-bs * 3}px)`, opacity: 0 },
      { opacity: .55 - i * .1, offset: .4 },
      { transform: `translateX(${endX - bs * (1.5 - i * .2)}px)`, opacity: .4 - i * .08 }
    ], enterOpt));
    await anim(block, [
      { transform: `translate(${-bs * 1.4}px, ${y}px)` },
      { transform: `translate(${endX}px, ${y}px)` }
    ], enterOpt);

    // 2) IMPACT — squash, shake, blue edge, crack
    block.style.transformOrigin = 'right center';
    anim(block, [
      { transform: `translate(${endX}px, ${y}px) scale(1,1)` },
      { transform: `translate(${endX}px, ${y}px) scale(.55,1.18)` }
    ], { duration: 110, easing: 'ease-out' });
    trails.forEach(t => anim(t, [{ opacity: .4 }, { opacity: 0 }], { duration: 180 }));
    anim(edge, [{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: .7, offset: .5 }, { opacity: 0 }], { duration: 700 });
    anim(flash, [{ opacity: 0 }, { opacity: .12, offset: .2 }, { opacity: 0 }], { duration: 260 });
    if (!reduce) page.animate([
      { transform: 'translate(0,0)' }, { transform: 'translate(-9px,3px)' }, { transform: 'translate(7px,-4px)' },
      { transform: 'translate(-5px,2px)' }, { transform: 'translate(3px,-1px)' }, { transform: 'translate(0,0)' }
    ], { duration: 380, easing: 'ease-out' });
    if (navigator.vibrate) try { navigator.vibrate(30); } catch (_) {}
    crack(W, y + bs / 2, bs);
    await wait(130);

    // 3) BREAK THROUGH — block exits past the edge, shards scatter back
    shards(W, y + bs / 2, bs);
    anim(block, [
      { transform: `translate(${endX}px, ${y}px) scale(.55,1.18)` },
      { transform: `translate(${endX + bs * .2}px, ${y - 6}px) scale(1.05,.95) rotate(4deg)`, offset: .25 },
      { transform: `translate(${W + bs * 1.6}px, ${y - 40}px) rotate(14deg)` }
    ], { duration: 420, easing: 'cubic-bezier(.2,.6,.3,1)' });
    await wait(520);

    // 4) REVEAL — heading rises, then each project card drops in and lands
    rises.forEach((el, i) => (el.style.transitionDelay = (0.05 + i * 0.12) + 's'));
    cards.forEach((c, i) => {
      c.classList.remove('landed'); void c.offsetWidth;
      c.style.setProperty('--rot', ((i % 2 ? 1 : -1) * (4 + Math.random() * 5)).toFixed(1) + 'deg');
      c.style.animationDelay = (0.18 + i * 0.16) + 's';
      c.classList.add('landed');
    });
    work.classList.remove('armed');
    await wait(1400);
    await anim(fx, [{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
    clearFx();
    fx.getAnimations().forEach(a => a.cancel());
    running = false;
  }

  function crack(W, cy, bs) {
    const ns = 'http://www.w3.org/2000/svg';
    const w = bs * 1.4, h = bs * 2.4, mid = h / 2, r = w;
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'hole');
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.top = (cy - h / 2) + 'px';
    const pts = [[r, mid - bs * .62], [r - bs * .18, mid - bs * .5], [r - bs * .1, mid - bs * .3], [r - bs * .3, mid - bs * .14], [r - bs * .16, mid + bs * .05], [r - bs * .34, mid + bs * .24], [r - bs * .12, mid + bs * .38], [r - bs * .2, mid + bs * .56], [r, mid + bs * .64]];
    const hole = document.createElementNS(ns, 'polygon');
    hole.setAttribute('points', pts.map(p => p.join(',')).join(' '));
    hole.setAttribute('fill', '#000'); hole.setAttribute('stroke', '#4da3ff'); hole.setAttribute('stroke-width', '2');
    svg.appendChild(hole);
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (Math.random() - .5) * 2.2;
      const len = bs * (.35 + Math.random() * .7);
      const sx = r - bs * .2, sy = mid + (Math.random() - .5) * bs * .9;
      const mx = sx + Math.cos(a) * len * .5 + (Math.random() - .5) * 14, my = sy + Math.sin(a) * len * .5 + (Math.random() - .5) * 14;
      const ex = sx + Math.cos(a) * len, ey = sy + Math.sin(a) * len;
      const p = document.createElementNS(ns, 'polyline');
      p.setAttribute('points', `${sx},${sy} ${mx},${my} ${ex},${ey}`);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', i % 3 ? '#f6f6f3' : '#4da3ff');
      p.setAttribute('stroke-width', i % 3 ? 1.2 : 2);
      p.setAttribute('stroke-linecap', 'round');
      p.style.strokeDasharray = len * 1.2; p.style.strokeDashoffset = len * 1.2;
      svg.appendChild(p);
      p.animate([{ strokeDashoffset: len * 1.2 }, { strokeDashoffset: 0 }], { duration: 220 + i * 25, easing: 'ease-out', fill: 'forwards' });
    }
    fx.appendChild(svg);
    svg.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 120, fill: 'forwards' });
    svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 1300, fill: 'forwards' });
  }

  function shards(W, cy, bs) {
    for (let i = 0; i < 16; i++) {
      const s = make('shard');
      const sz = 5 + Math.random() * 16;
      s.style.width = sz + 'px';
      s.style.height = (sz * (.4 + Math.random() * .8)) + 'px';
      if (i % 5 === 0) s.style.background = '#4da3ff';
      const x0 = W - 10, y0 = cy + (Math.random() - .5) * bs;
      const dx = -(60 + Math.random() * bs * 2.2), dy = (Math.random() - .5) * bs * 2.4;
      s.animate([
        { transform: `translate(${x0}px,${y0}px) rotate(0)`, opacity: 1 },
        { transform: `translate(${x0 + dx}px,${y0 + dy + 120}px) rotate(${(Math.random() - .5) * 720}deg)`, opacity: 0 }
      ], { duration: 800 + Math.random() * 500, easing: 'cubic-bezier(.15,.7,.4,1)', fill: 'forwards' });
    }
  }

  // (THE WORK now has its own 3D showcase further down — the old block-crash reveal is no longer triggered)


  /* =========================================================
     5. PLAY — things visitors can do with THE BLOCK
     ========================================================= */
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- 5a. custom cursor: a small block (mouse only) ---- */
  const cur = document.createElement('div');
  cur.className = 'cur';
  if (fine) {
    document.body.appendChild(cur);
    document.documentElement.classList.add('has-cur');
    let mx = -99, my = -99, cx = -99, cy = -99;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; cur.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    addEventListener('blur', () => cur.classList.remove('on'));
    const setMode = e => {
      const t = e.target;
      const sqHit = t.closest?.('.wm .sq.in');
      const card = t.closest?.('.card, [data-zoom], .wk-slab.is-on, .rc');
      const link = t.closest?.('a, button');
      cur.classList.toggle('grab', !!sqHit);
      cur.classList.toggle('view', !sqHit && !!card && !link);
      cur.classList.toggle('link', !sqHit && !!link);
      cur.textContent = sqHit ? 'DRAG' : (!link && card ? 'VIEW' : '');
    };
    addEventListener('pointerover', setMode, { passive: true });
    addEventListener('pointerdown', () => cur.animate([{ scale: '1 1' }, { scale: '1.35 .7' }, { scale: '1 1' }], { duration: 260, easing: 'ease-out' }));
    let craf = 0;
    const loop = () => {
      cx += (mx - cx) * 0.3; cy += (my - cy) * 0.3;
      cur.style.translate = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;   // position via `translate` so the click squash (scale) stays in place
      craf = Math.abs(mx - cx) + Math.abs(my - cy) > .3 ? requestAnimationFrame(loop) : 0;   // idle when it has caught up
    };
    addEventListener('pointermove', () => { if (!craf) craf = requestAnimationFrame(loop); }, { passive: true });
    loop();
  }

  /* ---- 5b. the PEE. dot: drag + throw (it bounces, lands, then rolls home) / tap it 5× and it shatters ---- */
  const sqEl = $('.wm .sq');
  let busy = false, taps = 0, tapTimer = 0;
  // mousedown's default action starts a text selection — cancel it on the dot, and block selectstart while playing
  if (sqEl) sqEl.addEventListener('mousedown', e => e.preventDefault());
  document.addEventListener('selectstart', e => { if (document.documentElement.classList.contains('playing')) e.preventDefault(); });
  if (sqEl) sqEl.addEventListener('pointerdown', e => {
    if (busy || !sqEl.classList.contains('in')) return;
    e.preventDefault();
    document.documentElement.classList.add('playing');   // stop the drag from selecting text
    getSelection()?.removeAllRanges();
    const r = sqEl.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, t0 = performance.now();
    let dragging = false, toyState = null;
    const move = ev => {
      if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
        dragging = true; busy = true;
        toyState = startToy(r, ev.clientX - r.left, ev.clientY - r.top, ev.pointerId);
      }
      if (dragging) toyState.follow(ev);
    };
    const up = ev => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
      if (dragging) { toyState.release(ev); return; }
      document.documentElement.classList.remove('playing');
      if (performance.now() - t0 < 400) tap();
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  });

  function tap() {
    clearTimeout(tapTimer);
    taps++;
    sqEl.animate([{ transform: 'scale(1,1)' }, { transform: `scale(${1 + taps * .05},${1 - taps * .07})` }, { transform: 'scale(1,1)' }],
      { duration: 240, easing: 'cubic-bezier(.3,1.6,.5,1)' });
    if (taps >= 5) { taps = 0; shatter(); return; }
    tapTimer = setTimeout(() => { taps = 0; }, 900);
  }

  function say(text, x, y, size, cls = '') {
    const d = make('say ' + cls);
    d.textContent = text;
    d.style.fontSize = size + 'px';
    d.style.transform = `translate(${x}px, ${y}px)`;
    return d;
  }

  async function shatter() {
    busy = true;
    fx.getAnimations().forEach(a => a.cancel()); fx.style.opacity = 1;
    const r = sqEl.getBoundingClientRect(), n = 4, p = r.width / n;
    sqEl.classList.add('away');
    const pieces = [];
    for (let i = 0; i < n * n; i++) {
      const el = make('piece');
      el.style.width = el.style.height = (p + 0.5) + 'px';
      const x0 = r.left + (i % n) * p, y0 = r.top + Math.floor(i / n) * p;
      const cxp = (i % n) - 1.5, cyp = Math.floor(i / n) - 1.5;
      const dx = cxp * p * (2 + Math.random() * 3) + (Math.random() - .5) * p * 2;
      const dy = cyp * p * 2 - p * (2 + Math.random() * 3);
      const rot = (Math.random() - .5) * 540;
      const home = `translate(${x0}px, ${y0}px) rotate(0deg)`;
      const out = `translate(${x0 + dx}px, ${y0 + dy + p * 6}px) rotate(${rot}deg)`;
      const peak = `translate(${x0 + dx * .6}px, ${y0 + dy}px) rotate(${rot * .6}deg)`;
      el.animate([{ transform: home }, { transform: peak, offset: .45 }, { transform: out }],
        { duration: 700, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' });
      pieces.push({ el, home, out });
    }
    if (!reduce) page.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-5px,2px)' }, { transform: 'translate(3px,-1px)' }, { transform: 'translate(0,0)' }], { duration: 240 });
    const fs = Math.max(20, Math.min(40, r.width * .22));
    const place = el => { el.style.transform = `translate(${Math.max(8, r.right - el.offsetWidth)}px, ${r.bottom + 10}px)`; };
    const label = say('FAILED.', 0, 0, fs); place(label);
    label.animate([{ opacity: 0, translate: '0 10px' }, { opacity: 1, translate: '0 0' }], { duration: 250, fill: 'forwards' });
    await wait(1050);
    label.textContent = 'LEARN FAST.'; label.classList.add('blue'); place(label);
    await Promise.all(pieces.map((pc, i) => pc.el.animate([{ transform: pc.out }, { transform: pc.home }],
      { duration: 620, delay: i * 18, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' }).finished));
    sqEl.classList.remove('away');
    pieces.forEach(pc => pc.el.remove());
    sqEl.animate([{ transform: 'scale(1.12,.86)' }, { transform: 'scale(1,1)' }], { duration: 300, easing: 'cubic-bezier(.3,1.6,.5,1)' });
    await wait(700);
    await label.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' }).finished;
    label.remove();
    busy = false;
  }

  function startToy(r, offX, offY, pid) {
    const s = r.width;
    fx.getAnimations().forEach(a => a.cancel()); fx.style.opacity = 1;
    const toy = make('toy');
    toy.style.width = toy.style.height = s + 'px';
    sqEl.classList.add('away');
    cur.classList.add('hide');
    let x = r.left, y = r.top, a = 0, vx = 0, vy = 0, va = 0, raf = 0, rest = 0, grabbed = true;
    let samples = [];
    const draw = () => { toy.style.transform = `translate(${x}px, ${y}px) rotate(${a}deg)`; };
    draw();
    const follow = ev => {
      x = ev.clientX - offX; y = ev.clientY - offY;
      const now = performance.now();
      samples.push({ t: now, x, y }); samples = samples.filter(p => now - p.t < 90);
      const tilt = samples.length > 1 ? (samples[samples.length - 1].x - samples[0].x) * .15 : 0;
      a += (Math.max(-25, Math.min(25, tilt)) - a) * .3;
      draw();
    };
    const release = () => {
      grabbed = false;
      cur.classList.remove('hide');
      if (samples.length > 1) {
        const f = samples[0], l = samples[samples.length - 1], dt = Math.max(16, l.t - f.t) / 1000;
        vx = Math.max(-4200, Math.min(4200, (l.x - f.x) / dt));
        vy = Math.max(-4200, Math.min(4200, (l.y - f.y) / dt));
      }
      va = vx * .25;
      let last = performance.now();
      const G = 2600, BOUNCE = .55;
      const step = now => {
        const dt = Math.min(.032, (now - last) / 1000); last = now;
        const W = document.documentElement.clientWidth, H = innerHeight;
        vy += G * dt; x += vx * dt; y += vy * dt; a += va * dt;
        let hit = false;
        if (x < 0) { x = 0; vx = -vx * BOUNCE; va = -va * .6; hit = true; }
        if (x > W - s) { x = W - s; vx = -vx * BOUNCE; va = -va * .6; hit = true; }
        if (y < 0) { y = 0; vy = -vy * BOUNCE; hit = true; }
        const floor = H - s;
        if (y >= floor) {
          y = floor;
          if (Math.abs(vy) > 120) { vy = -vy * BOUNCE; hit = true; } else vy = 0;
          vx *= Math.pow(.04, dt);                       // floor friction
          va = vx / (s / 2) * 57.3;                      // roll on the floor
        } else va *= Math.pow(.6, dt);
        if (hit && Math.hypot(vx, vy) > 900 && !reduce) page.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${Math.sign(vx) * -3}px,2px)` }, { transform: 'translate(0,0)' }], { duration: 160 });
        draw();
        rest = (y >= floor - .5 && Math.abs(vx) < 70) ? rest + dt : 0;
        if (rest > .25) { goHome(); return; }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    // pick it up again mid-flight
    toy.addEventListener('pointerdown', ev => {
      if (grabbed) return;
      ev.preventDefault();
      cancelAnimationFrame(raf); grabbed = true; samples = [];
      document.documentElement.classList.add('playing');
      const tr = toy.getBoundingClientRect();
      offX = ev.clientX - x; offY = ev.clientY - y;
      cur.classList.add('hide');
      const mv = e2 => follow(e2);
      const up2 = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up2); release(); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up2);
    });
    // lands, straightens, rolls back along the floor, then hops into its slot
    const goHome = async () => {
      const home = sqEl.getBoundingClientRect();
      const H = innerHeight;
      a = Math.round(a / 90) * 90; draw();
      if (home.bottom < 0 || home.top > H) {             // slot scrolled away: just fade out
        await toy.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished;
        return finish();
      }
      const dist = home.left - x, turns = Math.round(Math.abs(dist) / s), dir = Math.sign(dist) || 1;
      const lift = s * .207, frames = [];
      for (let i = 0; i <= turns; i++) {
        const t = turns ? i / turns : 1;
        frames.push({ offset: t, transform: `translate(${x + dist * t}px, ${y}px) rotate(${a + dir * 90 * i}deg)` });
        if (i < turns) {
          const tm = (i + .5) / turns;
          frames.push({ offset: tm, transform: `translate(${x + dist * tm}px, ${y - lift}px) rotate(${a + dir * (90 * i + 45)}deg)` });
        }
      }
      if (turns) await toy.animate(frames, { duration: 240 + turns * 150, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'forwards' }).finished;
      const fx0 = home.left, fy0 = y, peak = Math.min(home.top, fy0) - s * 1.2;
      const endA = a + dir * 90 * turns;
      await toy.animate([
        { transform: `translate(${fx0}px, ${fy0}px) rotate(${endA}deg) scale(1.1,.85)` },
        { transform: `translate(${fx0}px, ${peak}px) rotate(${endA - 180}deg)`, offset: .55 },
        { transform: `translate(${home.left}px, ${home.top}px) rotate(${endA - 360}deg) scale(1.08,.9)`, offset: .9 },
        { transform: `translate(${home.left}px, ${home.top}px) rotate(${endA - 360}deg)` }
      ], { duration: 720, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'forwards' }).finished;
      finish();
    };
    const finish = () => { toy.remove(); sqEl.classList.remove('away'); busy = false; document.documentElement.classList.remove('playing'); getSelection()?.removeAllRanges(); };
    return { follow, release };
  }

  /* ---- 5c. WORK cards: tilt toward the cursor + number parallax (mouse only) ---- */
  if (fine) $$('.card').forEach(card => {
    const ph = $('.ph', card);
    const pop = document.createElement('span'); pop.className = 'pop'; ph.appendChild(pop);
    card.addEventListener('pointermove', e => {
      const b = ph.getBoundingClientRect();
      const px = (e.clientX - b.left) / b.width - .5, py = (e.clientY - b.top) / b.height - .5;
      ph.classList.add('tilting');
      ph.style.setProperty('--ty', (px * 12).toFixed(2) + 'deg');
      ph.style.setProperty('--tx', (-py * 9).toFixed(2) + 'deg');
      ph.style.setProperty('--px', (px * -22).toFixed(1) + 'px');
      ph.style.setProperty('--py', (py * -16).toFixed(1) + 'px');
    });
    card.addEventListener('pointerleave', () => {
      ph.classList.remove('tilting');
      ['--tx', '--ty', '--px', '--py'].forEach(k => ph.style.removeProperty(k));
    });
  });
  else $$('.card .ph').forEach(ph => { const pop = document.createElement('span'); pop.className = 'pop'; ph.appendChild(pop); });



  /* ---- 5e. LOSS LOG — meters run out, the stamp lands, photos go grey; NSC reel ---- */
  $$('.loss').forEach(loss => {
    const big = $('.l-big', loss), kind = loss.dataset.kind;
    const below = loss.getBoundingClientRect().top > innerHeight * 0.8;
    const pad = n => String(n).padStart(2, '0');
    const hms = s => `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
    const land = () => {
      loss.classList.add('stamped');
      if (!reduce && !loss.classList.contains('entry')) page.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(0,3px)' }, { transform: 'translate(0,0)' }], { duration: 180, easing: 'ease-out' });
    };
    const run = () => {
      loss.classList.add('go');
      if (kind === 'none') { setTimeout(land, 650); return; }
      const dur = kind === 'rank' ? 1300 : 1500, t0 = performance.now() + 450;
      const step = t => {
        const k = Math.max(0, Math.min(1, (t - t0) / dur)), e = k * k;
        if (kind === 'rank') big.textContent = k < 1 ? '#' + Math.max(1, Math.round(1 + e * 140)) : big.dataset.final;
        if (kind === 'clock') big.textContent = hms(Math.round(+big.dataset.from * (1 - e)));
        if (kind === 'days') big.textContent = String(Math.round(+big.dataset.from * (1 - e)));
        if (kind === 'count') {
          const d = loss.dataset, v = +d.from + (+d.to - +d.from) * (1 - Math.pow(1 - k, 3));
          big.textContent = k < 1 ? (d.prefix || '') + Math.round(v).toLocaleString('en-US') + (d.suffix || '') : d.final;
        }
        if (k < 1) requestAnimationFrame(step); else setTimeout(land, 180);
      };
      requestAnimationFrame(step);
    };
    // cards inside the pinned story play when their page is shown (see STORY below)
    if (loss.closest('.pstory')) { loss._play = () => { if (!loss.classList.contains('go')) run(); }; return; }
    if (!below) { loss.classList.add('go', 'stamped'); if (kind === 'rank') big.textContent = big.dataset.final; if (kind === 'clock') big.textContent = '00:00:00'; if (kind === 'days') big.textContent = '0'; if (kind === 'count') big.textContent = loss.dataset.final; return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); run(); } }), { threshold: 0.35 });
    io.observe(loss);
  });
  /* swipeable reels — swipe / drag / arrows / dots; auto-plays until you touch it */
  $$('.l-pics.reel').forEach(reel => {
    const track = $('.rl-track', reel);
    if (!track) return;
    const figs = $$('figure', track), dots = $$('.reel-dots button', reel), count = $('.rl-count', reel);
    const n = figs.length, pad = v => String(v).padStart(2, '0');
    let idx = 0, vis = false, hover = false, touched = false;
    const w = () => track.clientWidth || 1;
    const go = k => track.scrollTo({ left: ((k + n) % n) * w(), behavior: 'smooth' });
    const sync = () => {
      const k = Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / w())));
      if (!count || (k === idx && count.dataset.set)) { idx = k; return; }
      idx = k; count.dataset.set = 1;
      dots.forEach((d, j) => d.classList.toggle('on', j === k));
      count.textContent = `${pad(k + 1)}/${pad(n)}`;
    };
    sync();
    track.addEventListener('scroll', sync, { passive: true });
    const stop = () => (touched = true);
    $('.rl-prev', reel)?.addEventListener('click', () => { stop(); go(idx - 1); });
    $('.rl-next', reel)?.addEventListener('click', () => { stop(); go(idx + 1); });
    dots.forEach((d, j) => d.addEventListener('click', () => { stop(); go(j); }));
    track.addEventListener('touchstart', stop, { passive: true });
    track.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) stop(); }, { passive: true });

    // mouse drag-to-scroll (touch already swipes natively)
    let down = false, sx = 0, sl = 0, moved = 0;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = 0; sx = e.clientX; sl = track.scrollLeft; stop();
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) { track.classList.add('dragging'); track.scrollLeft = sl - dx; }
    });
    addEventListener('pointerup', e => {
      if (!down) return; down = false;
      if (!track.classList.contains('dragging')) return;
      const dx = e.clientX - sx, base = Math.round(sl / w());
      const target = Math.abs(dx) > w() * 0.15 ? base - Math.sign(dx) : base;
      track.classList.remove('dragging');
      go(Math.max(0, Math.min(n - 1, target)));
    });
    // a drag shouldn't open the zoom
    track.addEventListener('click', e => { if (moved > 5) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);

    new IntersectionObserver(es => es.forEach(e => (vis = e.isIntersecting)), { threshold: 0.5 }).observe(reel);
    reel.addEventListener('pointerenter', () => (hover = true));
    reel.addEventListener('pointerleave', () => (hover = false));
    if (!reduce && n > 1) setInterval(() => { if (vis && !hover && !touched && !document.hidden) go(idx + 1); }, 2800);
  });

  /* ---- 5d. SMALL WINS — block wipe + count-up + stamp, scattered photos that snap in on scroll, zoom ---- */
  const feat = $('.win-feat');
  if (feat) {
    const num = $('.count', feat);
    const to = +num.dataset.to || 0;
    const fmt = v => Math.round(v).toLocaleString('en-US');
    const below = feat.getBoundingClientRect().top > innerHeight * 0.8;
    if (feat.hasAttribute('data-scrub')) feat.classList.add('go');   // the scroll drives it (see SMALL WINS v11 below)
    else if (!below) feat.classList.add('go');
    else {
      num.textContent = '0';
      const fio = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        fio.disconnect();
        feat.classList.add('go');
        const t0 = performance.now() + 350, dur = 1500;
        const step = t => {
          const k = Math.max(0, Math.min(1, (t - t0) / dur));
          num.textContent = fmt(to * (1 - Math.pow(1 - k, 4)));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }), { threshold: 0.35 });
      fio.observe(feat);
    }
    // main photo tilts toward the cursor
    const main = $('.wf-main', feat);
    if (fine && main) {
      main.addEventListener('pointermove', e => {
        const b = main.getBoundingClientRect();
        main.classList.add('tilting');
        main.style.setProperty('--ty', (((e.clientX - b.left) / b.width - .5) * 14).toFixed(2) + 'deg');
        main.style.setProperty('--tx', (-((e.clientY - b.top) / b.height - .5) * 10).toFixed(2) + 'deg');
      });
      main.addEventListener('pointerleave', () => { main.classList.remove('tilting'); main.style.removeProperty('--tx'); main.style.removeProperty('--ty'); });
    }
  }

  const gal = $('.wf-gallery');
  if (gal) {
    const shots = $$('.wf-shot', gal);
    const scatter = [{ x: -140, y: 170, r: -11 }, { x: 20, y: 260, r: 8 }, { x: 170, y: 150, r: -6 }];
    let gt = false;
    const updGal = () => {
      gt = false;
      const vh = innerHeight, b = gal.getBoundingClientRect();
      if (b.top > vh * 1.3 || b.bottom < -vh * .3) return;
      const k = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.98 - b.top) / (vh * 0.55)));
      const e = 1 - Math.pow(1 - k, 3), f = Math.min(1, innerWidth / 1280);
      shots.forEach((s, i) => {
        const sc = scatter[i % scatter.length];
        s.style.transform = `translate(${(sc.x * f * (1 - e)).toFixed(1)}px, ${(sc.y * (1 - e)).toFixed(1)}px) rotate(${(sc.r * (1 - e)).toFixed(2)}deg)`;
        s.style.zIndex = k < 1 ? String(3 - i) : '';
        if (!reduce) {
          const r = s.getBoundingClientRect();
          const par = ((r.top + r.height / 2 - vh / 2) / vh) * -22;
          s.firstElementChild.style.translate = `0 ${par.toFixed(1)}px`;
        }
      });
    };
    addEventListener('scroll', () => { if (!gt) { gt = true; requestAnimationFrame(updGal); } }, { passive: true });
    addEventListener('resize', updGal);
    updGal();
  }

  // tap/click a photo to see it large
  $$('[data-zoom]').forEach(fig => fig.addEventListener('click', () => {
    const src = $('img', fig);
    const lb = document.createElement('div');
    lb.className = 'lb';
    lb.innerHTML = '<img alt=""><span class="mono">Click anywhere to close</span>';
    const big = $('img', lb); big.src = src.currentSrc || src.src; big.alt = src.alt;
    document.body.appendChild(lb);
    requestAnimationFrame(() => lb.classList.add('on'));
    const from = src.getBoundingClientRect();
    big.decode?.().catch(() => {}).then(() => {
      const to = big.getBoundingClientRect();
      if (!to.width) return;
      big.animate([
        { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`, transformOrigin: '0 0' },
        { transform: 'none', transformOrigin: '0 0' }
      ], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
    const close = () => { lb.classList.remove('on'); setTimeout(() => lb.remove(), 300); removeEventListener('keydown', esc); };
    const esc = e => { if (e.key === 'Escape') close(); };
    lb.addEventListener('click', close);
    addEventListener('keydown', esc);
  }));

  /* ---- 5f. WORK galleries: tap a cover to flip through that project's shots (and trailer) ---- */
  // cover loops play only while on screen
  const loopIO = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting && !reduce) {
      if (!v.src) v.src = v.dataset.src;
      v.play().then(() => v.classList.add('on')).catch(() => {});
    } else v.pause();
  }), { threshold: 0.35 });
  $$('.ph.shot video.loop').forEach(v => loopIO.observe(v));

  /* ---- 5g. CASE STUDIES: the short version lives on the page, the full story opens on demand ---- */
  const cases = $$('#cases template');
  const caseIds = cases.map(t => t.id.replace('case-', ''));
  let cs = null, csId = null, csAt = 0, csList = [];
  const isVid = s => /\.mp4$/i.test(s);
  const csShow = (k, dir = 0) => {
    csAt = (k + csList.length) % csList.length;
    const src = csList[csAt], stage = $('.cs-stage', cs);
    $$('video', stage).forEach(v => v.pause());
    stage.innerHTML = isVid(src)
      ? `<video src="${src}" controls playsinline autoplay></video>`
      : `<img src="${src}" alt="${csId} ${csAt + 1}">`;
    $$('.cs-thumbs button', cs).forEach((b, i) => b.classList.toggle('on', i === csAt));
    $('.cs-thumbs button.on', cs)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    $('.cs-count', cs).textContent = `${String(csAt + 1).padStart(2, '0')}/${String(csList.length).padStart(2, '0')}`;
    if (dir && !reduce) stage.firstChild.animate([{ transform: `translateX(${dir * 70}px) rotate(${dir * 2}deg)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' });
  };
  const csFill = (id, start = 0) => {
    const t = $('#case-' + id); if (!t) return;
    csId = id; csList = JSON.parse(t.dataset.gallery);
    const i = caseIds.indexOf(id), next = $('#case-' + caseIds[(i + 1) % caseIds.length]);
    $('.cs-idx', cs).textContent = `${t.dataset.n} / ${String(caseIds.length).padStart(2, '0')}`;
    $('.cs-head', cs).innerHTML = '';
    $('.cs-head', cs).appendChild(t.content.cloneNode(true));
    const body = $('.cs-head .cs-body', cs); $('.cs-main', cs).innerHTML = ''; if (body) $('.cs-main', cs).appendChild(body);
    $('.cs-thumbs', cs).innerHTML = csList.map((s, k) => isVid(s)
      ? `<button type="button" aria-label="คลิป"><span>▶</span></button>`
      : `<button type="button" aria-label="รูปที่ ${k + 1}"><img src="${s}" alt="" loading="lazy"></button>`).join('');
    $('.cs-thumbs', cs).hidden = csList.length < 2;
    $$('.cs-ui button', cs).forEach(b => (b.hidden = csList.length < 2));
    $$('.cs-thumbs button', cs).forEach((b, k) => (b.onclick = () => csShow(k, k > csAt ? 1 : -1)));
    const nb = $('.cs-nextbig', cs);
    nb.innerHTML = `<span class="mono">Next project · ${next.dataset.n}</span><b>${next.dataset.title} <i>→</i></b>`;
    nb.onclick = () => csSwap(caseIds[(i + 1) % caseIds.length]);
    try { if (history.state?.case) history.replaceState({ case: id }, '', '#' + id); } catch (e) {}
    $('.cs-scroll', cs).scrollTop = 0;
    csShow(start);
  };
  const csSwap = id => {
    const sc = $('.cs-scroll', cs);
    if (reduce) return csFill(id);
    sc.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-30px)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished.then(() => {
      csFill(id);
      sc.animate([{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    });
  };
  const csKey = e => {
    if (e.key === 'Escape') csClose();
    if (e.key === 'ArrowRight') csShow(csAt + 1, 1);
    if (e.key === 'ArrowLeft') csShow(csAt - 1, -1);
  };
  function csOpen(id, from, start = 0) {
    if (cs) return csSwap(id);
    sound.play('open');
    cs = document.createElement('div');
    cs.className = 'case';
    cs.setAttribute('role', 'dialog'); cs.setAttribute('aria-modal', 'true');
    cs.innerHTML = `<div class="cs-top"><button type="button" class="cs-close mono">← กลับ</button><span class="mono cs-idx"></span></div>
      <div class="cs-scroll">
        <div class="cs-gal"><div class="cs-stage"></div>
          <div class="cs-ui"><button type="button" class="p" aria-label="ก่อนหน้า">←</button><span class="mono cs-count"></span><button type="button" class="n" aria-label="ถัดไป">→</button></div>
        </div>
        <div class="cs-thumbs"></div>
        <div class="cs-grid"><div class="cs-head"></div><div class="cs-main"></div></div>
        <button type="button" class="cs-nextbig"></button>
      </div>`;
    document.body.appendChild(cs);
    document.documentElement.classList.add('case-open');
    csFill(id, start);
    $('.cs-close', cs).onclick = () => csClose();
    $('.cs-ui .p', cs).onclick = () => csShow(csAt - 1, -1);
    $('.cs-ui .n', cs).onclick = () => csShow(csAt + 1, 1);
    let sx = null;
    $('.cs-gal', cs).addEventListener('pointerdown', e => { if (e.target.tagName !== 'VIDEO' && !e.target.closest('button')) sx = e.clientX; });
    $('.cs-gal', cs).addEventListener('pointerup', e => {
      if (sx === null) return; const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 50 && csList.length > 1) csShow(csAt + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });
    addEventListener('keydown', csKey);
    // grow out of the thing you clicked
    if (!reduce) {
      const r = from?.getBoundingClientRect?.();
      const clip = r ? `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 10px)` : 'inset(50% 50% 50% 50% round 10px)';
      cs.animate([{ clipPath: clip }, { clipPath: 'inset(0 0 0 0 round 0px)' }], { duration: 620, easing: 'cubic-bezier(.7,0,.2,1)' });
      $('.cs-grid', cs).animate([{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 380, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    }
    try { history.pushState({ case: id }, '', '#' + id); } catch (e) {}
  }
  function csClose(fromPop) {
    if (!cs) return;
    sound.play('close');
    const el = cs; cs = null;
    $$('video', el).forEach(v => v.pause());
    removeEventListener('keydown', csKey);
    document.documentElement.classList.remove('case-open');
    const done = () => el.remove();
    if (reduce) done();
    else el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(60px) scale(.98)' }], { duration: 320, easing: 'ease-in' }).finished.then(done);
    if (!fromPop) { try { if (history.state?.case) history.back(); } catch (e) {} }
  }
  addEventListener('popstate', () => { if (cs) csClose(true); });
  $$('.card[data-case]').forEach(card => {
    const open = (start = 0) => csOpen(card.dataset.case, $('.ph', card), start);
    $('.ph', card).addEventListener('click', () => open());
    $('button.more', card)?.addEventListener('click', () => open());
  });
  $$('[data-open]').forEach(b => b.addEventListener('click', () => csOpen(b.dataset.open, b.closest('.loss') || b)));
  if (caseIds.includes(location.hash.slice(1))) csOpen(location.hash.slice(1));

  /* =========================================================
     STORY (pinned) — you scroll normally; the scene stays in the middle of the screen.
     Most pages switch as you pass them; the in-between moments follow your scroll exactly:
       I LOST (+ Thai) turns to dust · the losses fall past as 3D cracked glass and shatter as you move on ·
       the circle opens from the BETTER block · the grabbed blue block zooms into SMALL WINS.
     ========================================================= */
  (() => {
    const sec = $('.pstory'), pst = $('#pst');
    if (!sec || !pst) return;
    // the timeline — len is in "pages" (one page = PAGE × screen height of scrolling)
    const SEG = [
      { k: 'a0', sc: 'A', len: 1 }, { k: 'a1', sc: 'A', len: 1 },
      { k: 'vap', sc: 'A', st: 'a2', len: 1 },             // I LOST dissolves (scrubbed)
      { k: 'loss', sc: 'A', st: 'a2', len: 3.2 },          // three losses, each shatters as you move on (scrubbed)
      { k: 'b0', sc: 'B', len: 1.3 },                      // I SEE WHERE I STAND types itself as you scroll
      { k: 'b1', sc: 'B', len: 1 }, { k: 'b2', sc: 'B', len: 1.2 },
      { k: 'bz', sc: 'B', st: 'b2 bz', len: 1.3 },         // zoom into the ring — it opens as a circle onto the next page (scrubbed)
      { k: 'c0', sc: 'C', len: 1 },
      { k: 'cd', sc: 'C', st: 'c0 cd', len: 1 },           // the circle opens (scrubbed)
      { k: 'd0', sc: 'D', len: 1 }, { k: 'd1', sc: 'D', len: 1 },
      { k: 'hm', sc: 'D', st: 'd1 hmr', len: 4.2 },          // FAIL FAST becomes a hammer and smashes the screen (scrubbed)
      { k: 'e0', sc: 'E', len: 1 },
      { k: 'ef', sc: 'E', st: 'e0 ef', len: 1 },           // the page slides off to the right, "So I grabbed it" slides in (scrubbed)
      { k: 'f0', sc: 'F', len: 1 }];
    const SCRUB = new Set(['vap', 'loss', 'bz', 'cd', 'hm', 'ef']);
    const N = SEG.length;
    const PAGE = .8, LEAD = .45;     // LEAD: a page shows up when you're 55% of the way to it
    const HOLD = .35, TAIL = 1.25;   // after the last page: a short pause, then the zoom into SMALL WINS
    SEG.forEach(s => { s.cls = ['s' + s.sc, ...(s.st || s.k).split(' ')]; });
    const ALL = [...new Set(SEG.flatMap(s => s.cls))];
    const lay = sc => $('.ly-' + sc.toLowerCase(), pst);
    const idx = k => SEG.findIndex(s => s.k === k);
    let H = 1, W = 1, S = 1, top = 0, cur = -1, inView = false, starts = [];
    const segY = i => top + starts[i] * S;
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    /* ---- typewriter: I SEE WHERE I STAND ---- */
    const bt = $('.b-title', pst);
    const chars = [];
    const caret = document.createElement('span'); caret.className = 'tw-caret'; caret.setAttribute('aria-hidden', 'true');
    (function split(node) {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 1) return split(n);
        if (n.nodeType !== 3) return;
        const f = document.createDocumentFragment();
        [...n.textContent].forEach(ch => {
          if (/\s/.test(ch)) { f.appendChild(document.createTextNode(ch)); return; }
          const s = document.createElement('span'); s.className = 'tw-c'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch; f.appendChild(s); chars.push(s);
        });
        n.replaceWith(f);
      });
    })(bt);
    let twT = 0;
    let typed = -1;
    const typeSet = k => { if (k === typed) return; typed = k; chars.forEach((c, j) => c.classList.toggle('on', j < k)); (k ? chars[k - 1].after(caret) : bt.prepend(caret)); };
    const typeStop = () => clearTimeout(twT);
    const type = () => {
      typeStop(); typeSet(0);
      let k = 0;
      const next = () => {
        k++; typeSet(k); sound.play('tick', k * 4);
        if (k >= chars.length) return;
        const gap = chars[k - 1].nextSibling?.nodeType === 3 ? 150 : 0;
        twT = setTimeout(next, 42 + Math.random() * 46 + gap);
      };
      twT = setTimeout(next, 300);
    };

    /* ---- FAIL FAST. LEARN FAST. slides up, crashes and shatters → then the opportunity page ---- */
    const motto = $('.d-motto .motto-type', pst), mChars = [];
    (function split(node) {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 1) return split(n);
        if (n.nodeType !== 3) return;
        const f = document.createDocumentFragment();
        [...n.textContent].forEach(ch => {
          if (/\s/.test(ch)) { f.appendChild(document.createTextNode(ch)); return; }
          const c = document.createElement('span'); c.className = 'mc'; c.textContent = ch; f.appendChild(c); mChars.push(c);
        });
        n.replaceWith(f);
      });
    })(motto);
    let shT = [], shA = [];
    const unshatter = () => { shT.forEach(clearTimeout); shT = []; shA.forEach(a => a.cancel()); shA = []; pst.classList.remove('shatter', 'dcut'); };
    function shatter() {
      unshatter();
      pst.classList.add('shatter');                                      // 1. it slides up to the middle
      shT.push(setTimeout(() => {                                        // 2. crash — the letters break apart
        sound.play('crash');
        shA.push(pst.animate([{ transform: 'none' }, { transform: 'translate(-9px,4px)' }, { transform: 'translate(7px,-3px)' }, { transform: 'translate(-3px,1px)' }, { transform: 'none' }], { duration: 380, easing: 'ease-out' }));
        const mr = motto.getBoundingClientRect(), cx = mr.left + mr.width / 2, cy = mr.top + mr.height / 2;
        mChars.forEach(c => {
          const r = c.getBoundingClientRect(), a = Math.atan2(r.top + r.height / 2 - cy, r.left + r.width / 2 - cx) + (Math.random() - .5) * .6;
          const sp = 160 + Math.random() * 380, spin = (Math.random() - .5) * 2;
          shA.push(c.animate([
            { transform: 'none', opacity: 1 },
            { transform: `translate(${(Math.cos(a) * sp * .55).toFixed(0)}px,${(Math.sin(a) * sp * .55 - 110).toFixed(0)}px) rotate(${(spin * 160).toFixed(0)}deg)`, opacity: 1, offset: .35 },
            { transform: `translate(${(Math.cos(a) * sp).toFixed(0)}px,${(Math.sin(a) * sp + innerHeight * .75).toFixed(0)}px) rotate(${(spin * 540).toFixed(0)}deg)`, opacity: 0 }
          ], { duration: 950 + Math.random() * 350, easing: 'cubic-bezier(.25,.5,.45,1)', fill: 'forwards' }));
        });
      }, 560));
      shT.push(setTimeout(() => {                                        // 3. hand over to the opportunity page
        pst.classList.add('dcut'); pst.classList.remove('shatter'); void pst.offsetWidth;
        requestAnimationFrame(() => {
          shA.forEach(a => a.cancel()); shA = []; pst.classList.remove('dcut');
          $$('.cube', lay('E')).forEach(c => { c.classList.remove('on'); void c.offsetWidth; c.classList.add('on'); });
        });
      }, 1450));
    }

    /* ---- I LOST + the Thai line → dust, following the scroll ---- */
    const cv = $('.vapor', pst), g = cv.getContext('2d'), title = $('.a-title', pst), sub = $('.a-sub', pst);
    const wordSeg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
    let VP = null, vLast = -1;
    function sampleText() {
      const pr = pst.getBoundingClientRect(), Wc = Math.ceil(pr.width), Hc = Math.ceil(pr.height);
      const off = document.createElement('canvas'); off.width = Wc; off.height = Hc;
      const o = off.getContext('2d'), rg = document.createRange();
      let x0 = Wc, y0 = Hc, x1 = 0, y1 = 0;
      [title, sub].forEach(el => {
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n; (n = tw.nextNode());) {
          const text = n.textContent;
          const parts = wordSeg ? [...wordSeg.segment(text)].map(p => [p.index, p.segment]) : [...text.matchAll(/\S+/g)].map(m => [m.index, m[0]]);
          const cs = getComputedStyle(n.parentElement), fs = parseFloat(cs.fontSize);
          o.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
          const m = o.measureText('Hก'), asc = m.fontBoundingBoxAscent || fs * .9, dsc = m.fontBoundingBoxDescent || fs * .25;
          for (const [i, word] of parts) {
            if (!word.trim()) continue;
            rg.setStart(n, i); rg.setEnd(n, i + word.length);
            const r = [...rg.getClientRects()].find(b => b.width > 1); if (!r) continue;
            const k = r.height / (asc + dsc);
            o.font = `${cs.fontWeight} ${fs * k}px ${cs.fontFamily}`;
            o.fillStyle = n.parentElement.classList.contains('hl') ? '#4da3ff' : '#f6f6f3';
            o.textBaseline = 'alphabetic';
            o.fillText(word, r.left - pr.left, r.top - pr.top + asc * k);
            x0 = Math.min(x0, r.left - pr.left); y0 = Math.min(y0, r.top - pr.top); x1 = Math.max(x1, r.right - pr.left); y1 = Math.max(y1, r.bottom - pr.top);
          }
        }
      });
      if (x1 <= x0) return null;
      x0 = Math.max(0, Math.floor(x0) - 4); y0 = Math.max(0, Math.floor(y0) - 4); x1 = Math.min(Wc, Math.ceil(x1) + 4); y1 = Math.min(Hc, Math.ceil(y1) + 4);
      const bw = x1 - x0, bh = y1 - y0, data = o.getImageData(x0, y0, bw, bh).data;
      const gap = Math.max(3, Math.round(Math.sqrt(bw * bh / (innerWidth < 760 ? 3500 : 8000))));
      const P = [];
      let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let y = 0; y < bh; y += gap) for (let x = 0; x < bw; x += gap) {
        const q = (y * bw + x) * 4;
        if (data[q + 3] < 110) continue;
        P.push({ x: x + x0, y: y + y0, c: `rgb(${data[q]},${data[q + 1]},${data[q + 2]})`,
          d: (x / bw) * .5 + (y / bh) * .08 + rnd() * .1,          // the dust sweeps left → right as you scroll
          vx: 30 + rnd() * 190, vy: -(40 + rnd() * 170), w: rnd() * 6.28, s: 1 + rnd() * .6 });
      }
      P.sort((a, b) => (a.c < b.c ? -1 : 1));
      return { P, gap, Wc, Hc };
    }
    function vapor(t) {                                     // t: 0 = the words, 1 = gone
      const on = t >= 0 && t < 1 && !reduce;
      pst.classList.toggle('fxv', on);
      if (!on) { if (vLast !== -1) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); vLast = -1; } return; }
      if (!VP) VP = sampleText();
      if (!VP) return;
      if (Math.abs(t - vLast) < .002) return;
      vLast = t;
      const { P, gap, Wc, Hc } = VP, dpr = 1;
      if (cv.width !== Wc * dpr) { cv.width = Wc * dpr; cv.height = Hc * dpr; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, Wc, Hc);
      let fill = '';
      for (const p of P) {
        const l = (t - p.d) / .42;
        if (l >= 1) continue;
        let x = p.x, y = p.y, a = 1, sz = gap;
        if (l > 0) {
          const e = 1 - (1 - l) * (1 - l);
          x += p.vx * e + Math.sin(p.w + l * 7) * 7 * l; y += p.vy * e - l * l * 30;
          a = 1 - l; sz = gap * p.s * (1 - l * .55);
        }
        if (p.c !== fill) { fill = p.c; g.fillStyle = fill; }
        g.globalAlpha = a; g.fillRect(x, y, sz, sz);
      }
      g.globalAlpha = 1;
    }

    /* ---- the losses: 3D cracked glass falling past vertically; each one shatters as you scroll on ---- */
    const lxs = $$('.lx', pst).map((el, i) => {
      const card = $('.lx-card', el), txt = $('.lx-txt', el), stamp = $('.l-stamp', card);
      const img = card.dataset.img, pos = card.dataset.pos || '50% 50%';
      let seed = 97 + i * 31; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const small = innerWidth < 760, C = 3, R = small ? 2 : 3, P = [];
      for (let r = 0; r <= R; r++) for (let c = 0; c <= C; c++) {
        const edge = r === 0 || r === R || c === 0 || c === C;
        P.push([clamp(c / C * 100 + (edge && (c === 0 || c === C) ? 0 : (rnd() - .5) * 13), 0, 100), clamp(r / R * 100 + (edge && (r === 0 || r === R) ? 0 : (rnd() - .5) * 17), 0, 100)]);
      }
      const at = (r, c) => P[r * (C + 1) + c];
      const hit = [42 + rnd() * 16, 38 + rnd() * 24];                   // where the "impact" was
      const tris = [];
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        const a = at(r, c), b = at(r, c + 1), d = at(r + 1, c), e = at(r + 1, c + 1);
        if (rnd() < .5) tris.push([a, b, e], [a, e, d]); else tris.push([a, b, d], [b, e, d]);
      }
      const sh = tris.map(t => {
        // each shard is only as big as its own triangle (not a full copy of the photo) — much lighter to draw
        const d = document.createElement('i'); d.className = 'lx-sh';
        const x0 = Math.min(...t.map(p => p[0])), x1 = Math.max(...t.map(p => p[0])), y0 = Math.min(...t.map(p => p[1])), y1 = Math.max(...t.map(p => p[1]));
        const bw = Math.max(.5, x1 - x0), bh = Math.max(.5, y1 - y0);
        d.style.left = x0 + '%'; d.style.top = y0 + '%'; d.style.width = bw + '%'; d.style.height = bh + '%';
        d.style.clipPath = `polygon(${t.map(p => ((p[0] - x0) / bw * 100).toFixed(2) + '% ' + ((p[1] - y0) / bh * 100).toFixed(2) + '%').join(',')})`;
        const bs = `${(10000 / bw).toFixed(2)}% ${(10000 / bh).toFixed(2)}%`;
        const bp = `${(bw >= 99.9 ? 0 : x0 / (100 - bw) * 100).toFixed(2)}% ${(bh >= 99.9 ? 0 : y0 / (100 - bh) * 100).toFixed(2)}%`;
        d.style.backgroundImage = `linear-gradient(125deg,rgba(255,255,255,.16),rgba(255,255,255,0) 38%,rgba(255,255,255,0) 70%,rgba(255,255,255,.07)),url("${img}")`;
        d.style.backgroundSize = `${bs}, ${bs}`; d.style.backgroundPosition = `${bp}, ${bp}`;
        card.prepend(d);
        const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
        const dx = cx - hit[0], dy = cy - hit[1], dl = Math.hypot(dx, dy) || 1;
        return { d, ux: dx / dl, uy: dy / dl, near: dl / 70, z: 150 + rnd() * 500, ax: rnd() - .5, ay: rnd() - .5, az: rnd() - .5, spin: 90 + rnd() * 260, last: -1 };
      });
      // the cracks: every shard edge, drawn outward from the impact point
      const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
      const seen = new Set(), cracks = [];
      tris.forEach(t => [[0, 1], [1, 2], [2, 0]].forEach(([p, q]) => {
        const A = t[p], B = t[q], key = [A, B].map(v => v.join()).sort().join('|');
        if (seen.has(key)) return; seen.add(key);
        const onEdge = (A[0] === B[0] && (A[0] === 0 || A[0] === 100)) || (A[1] === B[1] && (A[1] === 0 || A[1] === 100));
        if (onEdge) return;
        const [n1, n2] = Math.hypot(A[0] - hit[0], A[1] - hit[1]) < Math.hypot(B[0] - hit[0], B[1] - hit[1]) ? [A, B] : [B, A];
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', `M${n1[0]} ${n1[1]}L${n2[0]} ${n2[1]}`); path.setAttribute('pathLength', '1');
        path.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.appendChild(path);
        cracks.push({ path, d: Math.hypot((n1[0] + n2[0]) / 2 - hit[0], (n1[1] + n2[1]) / 2 - hit[1]) / 70 });
      }));
      card.appendChild(svg);
      return { el, card, txt, stamp, sh, cracks, i, lastS: -1, lastC: -1 };
    });
    const GAPU = 1.1;
    function losses(col) {                                  // col: 0 = first loss in the middle, 1.1 = the second, …
      const mob = W < 760;
      lxs.forEach(o => {
        const rel = o.i * GAPU - col;                       // 0 = in the middle, + = still below
        const s = clamp((-rel - .18) / .72);               // shatter
        const c = clamp((.45 - rel) / .45);                // cracks spreading
        const vis = rel < 1.6 && s < 1;
        o.el.style.visibility = vis ? '' : 'hidden';
        if (!vis) return;
        const side = o.i % 2 ? -1 : 1, x = mob ? 0 : side * W * .09;
        o.el.style.transform = `translate3d(${x.toFixed(1)}px, ${(rel * H * .84).toFixed(1)}px, ${(-Math.abs(rel) * 160).toFixed(1)}px)`;
        o.card.style.transform = `rotateX(${(rel * 16 + 6).toFixed(2)}deg) rotateY(${(-side * (mob ? 6 : 14)).toFixed(2)}deg) rotateZ(${(side * -1.5).toFixed(2)}deg)`;
        o.card.style.setProperty('--s', s.toFixed(3));
        if (Math.abs(c - o.lastC) > .003) {
          o.lastC = c;
          o.cracks.forEach(k => { k.path.style.strokeDashoffset = (1 - clamp((c - k.d * .55) / .45)).toFixed(3); });
        }
        if (Math.abs(s - o.lastS) > .001) {
          o.lastS = s;
          const k = ease(s), fall = s * s;
          o.sh.forEach(q => {
            const kk = clamp(k * 1.25 - q.near * .25);
            if (!kk) { q.d.style.transform = ''; q.d.style.opacity = ''; return; }
            q.d.style.transform = `translate3d(${(q.ux * kk * W * .32).toFixed(1)}px, ${(q.uy * kk * H * .3 + fall * H * .35).toFixed(1)}px, ${(kk * q.z).toFixed(1)}px) rotate3d(${q.ax.toFixed(2)},${q.ay.toFixed(2)},${q.az.toFixed(2)},${(kk * q.spin).toFixed(1)}deg)`;
            q.d.style.opacity = (1 - clamp((kk - .35) / .65)).toFixed(3);
          });
          o.stamp.style.opacity = (1 - clamp(s * 3)).toFixed(3);
        }
        const tIn = clamp((1 - rel) / .6), tOut = 1 - clamp(s * 1.6);
        o.txt.style.opacity = (tIn * tOut).toFixed(3);
        o.txt.style.transform = `translate(${o.tx.toFixed(1)}px, ${(o.ty - s * 50).toFixed(1)}px)`;
      });
    }
    const lossLayout = () => {
      const mob = W < 760;
      lxs.forEach(o => {
        const lw = o.card.offsetWidth, lh = o.card.offsetHeight, tw = o.txt.offsetWidth, th = o.txt.offsetHeight;
        const side = o.i % 2 ? -1 : 1, x = mob ? 0 : side * W * .09;
        const gut = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gut')) || 24;
        if (mob) { o.tx = -tw / 2; o.ty = lh / 2 + 20; }
        else { o.tx = side > 0 ? -W / 2 + Math.max(gut, 40) - x : W / 2 - Math.max(gut, 40) - tw - x; o.ty = -th / 2 + lh * .22; }
        o.lastS = o.lastC = -1;
      });
    };

    /* ---- the circle opens from where the BETTER block landed, following the scroll (a real filled circle, no outline) ---- */
    const dLay = lay('D');
    const landing = () => {
      const pr = pst.getBoundingClientRect(), st = $('.c-better .step', pst)?.getBoundingClientRect();
      if (!st || !st.width) return { x: pr.width / 2, y: pr.height / 2, pr };
      return { x: st.left + st.width / 2 - 3 - pr.left, y: st.top - 20 - pr.top, pr };
    };
    let circO = null;
    function circle(t) {                                    // t: 0 = a dot on the block, 1 = the whole screen
      if (cur !== idx('cd')) { if (dLay.style.clipPath) dLay.style.clipPath = ''; circO = null; return; }
      if (!circO) { const { x, y, pr } = landing(); circO = { x, y, R: Math.hypot(Math.max(x, pr.width - x), Math.max(y, pr.height - y)) + 4 }; }
      const r = circO.R * ease(clamp(t));
      dLay.style.clipPath = `circle(${r.toFixed(1)}px at ${circO.x.toFixed(0)}px ${circO.y.toFixed(0)}px)`;
    }

    /* ---- the ring of entry cards: turns one card at a time, drag / fling it, click a card to open it ---- */
    const ringWrap = $('.ring-wrap', pst), ring = $('.ring', pst), rcs = $$('.rc', pst);
    rcs.forEach(c => {
      const f = document.createElement('span'); f.className = 'rc-f'; f.append(...c.childNodes);
      const k = document.createElement('span'); k.className = 'rc-k'; k.setAttribute('aria-hidden', 'true');
      const im = $('img', f); if (im) { const ci = im.cloneNode(); ci.alt = ''; k.appendChild(ci); }
      c.append(f, k);
    });
    const STEP_A = 360 / rcs.length, AUTO = .16;
    let tiltX = -8, flatK = 0;                // the camera angle / how flat the cards lie (the dive into the ring)
    let rot = 0, tgt = 0, RR = 280, ringOn = false, rRaf = 0, rdrag = null, lastTouch = 0;
    const ringLayout = () => {
      const cw = ring.offsetWidth || 200;
      RR = innerWidth < 700 ? cw * 1.45 : Math.min(cw * 1.55, Math.max(cw * 1.1, innerWidth / 2 - cw * .3));
      rcs.forEach((c, i) => { c._a = i * STEP_A; c._f = -1; c.style.transform = `rotateY(${c._a}deg) translateZ(${RR.toFixed(1)}px)`; });
    };
    const ringFrame = now => {
      if (!rdrag) {
        if (!reduce && now > lastTouch) tgt -= AUTO;                  // keeps turning on its own
        rot += (tgt - rot) * .08;
      }
      ring.style.transform = `translateZ(${(-RR).toFixed(1)}px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${rot.toFixed(2)}deg)`;
      rcs.forEach(c => {
        const z = Math.cos((c._a + rot) * Math.PI / 180);
        if (flatK !== c._f) { c._f = flatK; c.style.transform = `rotateY(${c._a}deg) translateZ(${RR.toFixed(1)}px) rotateX(${(flatK * 90).toFixed(2)}deg)`; }
        const o = .12 + .88 * Math.pow(Math.max(0, (z + .35) / 1.35), 1.6);
        c.style.opacity = (o + (1 - o) * flatK).toFixed(3);
        c.style.pointerEvents = z > .5 && !flatK ? '' : 'none';
      });
      rRaf = ringOn || rdrag || Math.abs(tgt - rot) > .05 ? requestAnimationFrame(ringFrame) : 0;
    };
    const ringKick = () => { if (!rRaf) rRaf = requestAnimationFrame(ringFrame); };
    const ringStart = spin => { ringOn = true; lastTouch = 0; if (spin && !reduce) tgt = rot - 140; ringKick(); };
    const ringStop = () => { ringOn = false; };
    const openCard = c => { if (typeof csOpen === 'function') csOpen(c.dataset.case, c); };
    ringWrap.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      rdrag = { x: e.clientX, moved: 0, v: 0, card: e.target.closest('.rc') };
      try { ringWrap.setPointerCapture(e.pointerId); } catch (_) {}
      ringWrap.classList.add('grab'); ringKick();
    });
    ringWrap.addEventListener('pointermove', e => {
      if (!rdrag) return;
      const dx = e.clientX - rdrag.x; rdrag.x = e.clientX; rdrag.moved += Math.abs(dx);
      rot += dx * .3; rdrag.v = dx * .3;
    });
    const ringUp = e => {
      if (!rdrag) return;
      const d = rdrag; rdrag = null; ringWrap.classList.remove('grab');
      tgt = rot + d.v * 12;                                             // fling it; it keeps spinning after a moment
      lastTouch = performance.now() + 1400;
      if (e.type === 'pointerup' && d.moved < 6 && d.card) openCard(d.card);
      ringKick();
    };
    ringWrap.addEventListener('pointerup', ringUp); ringWrap.addEventListener('pointercancel', ringUp);
    ringWrap.addEventListener('dragstart', e => e.preventDefault());
    ringWrap.addEventListener('wheel', e => {                            // sideways trackpad swipe turns it too
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || !ringOn) return;
      e.preventDefault(); rot -= e.deltaX * .15; tgt = rot; lastTouch = performance.now() + 1400; ringKick();
    }, { passive: false });
    rcs.forEach(c => c.addEventListener('click', e => { if (e.detail === 0) openCard(c); }));


    /* ---- grabbed → SMALL WINS: the blue block becomes a window onto the cover, scrubbed by scroll ---- */
    const zw = $('.zw', pst), zg = $('.zw-grid', pst), zc = zg?.getContext('2d');
    // the cover: a field of small blocks that light up one by one, spreading out from the grabbed block
    let grid = null, gLit = -1;
    const drawGrid = (e, ox, oy, W, Hh) => {
      if (!zc) return;
      const dpr = DPR(1.5);
      const cell = W < 700 ? 22 : 30, gap = W < 700 ? 5 : 7;
      const key = `${W}x${Hh}`;
      if (!grid || grid.key !== key) {
        zg.width = W * dpr; zg.height = Hh * dpr;
        const cols = Math.ceil(W / cell) + 1, rows = Math.ceil(Hh / cell) + 1, list = [];
        let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const x = c * cell, y = r * cell, d = Math.hypot(x + cell / 2 - ox, y + cell / 2 - oy) / Math.hypot(W, Hh);
          list.push({ x, y, o: d * .75 + rnd() * .5, t: rnd() < .12 ? 2 : rnd() < .5 ? 1 : 0 });
        }
        list.sort((a, b) => a.o - b.o);
        grid = { key, list }; gLit = -1;
      }
      const lit = Math.round(grid.list.length * .46 * Math.max(0, Math.min(1, (e - .15) / .85)));
      if (lit === gLit) return;
      gLit = lit;
      zc.setTransform(dpr, 0, 0, dpr, 0, 0); zc.clearRect(0, 0, W, Hh);
      const s = cell - gap;
      grid.list.forEach((q, i) => {
        zc.fillStyle = i < lit ? (q.t === 2 ? '#f6f6f3' : q.t === 1 ? '#4da3ff' : '#1f4e80') : '#141416';
        zc.fillRect(q.x, q.y, s, s);
      });
    };
    const zoom = y => {
      if (!zw) return;
      const p = Math.max(0, Math.min(1, (y - segY(N - 1) - HOLD * S) / (TAIL * S)));
      zw.classList.toggle('on', p > 0);
      if (!p) return;
      const e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const pr = pst.getBoundingClientRect(), cb = $('.c-grab', pst).getBoundingClientRect();
      const b = { l: cb.left - pr.left + 76, t: cb.top - pr.top + 32 }; b.r = pr.width - b.l - 40; b.b = pr.height - b.t - 40;
      const k = 1 - e;
      zw.style.setProperty('--zt', (b.t * k).toFixed(1) + 'px'); zw.style.setProperty('--zb', (b.b * k).toFixed(1) + 'px');
      zw.style.setProperty('--zl', (b.l * k).toFixed(1) + 'px'); zw.style.setProperty('--zr', (b.r * k).toFixed(1) + 'px');
      zw.style.setProperty('--zrr', (2 * k).toFixed(1) + 'px');
      zw.style.setProperty('--zbo', Math.max(0, Math.min(1, 1 - (e - .25) / .4)).toFixed(3));   // blue → photo
      drawGrid(e, b.l + 20, b.t + 20, pr.width, pr.height);
      zw.style.setProperty('--zto', Math.max(0, Math.min(1, (e - .62) / .3)).toFixed(3));
    };

    /* ---- FAIL FAST. LEARN FAST. → a hammer: it forms, winds up, smashes the screen, the screen breaks apart
            (a crater, glass shards, dead-pixel ink, LCD lines), a second crunch, a long look at the damage,
            then the broken page falls away ---- */
    const hmRot = $('.hm-rot', pst), hmCv = $('.hm-crack', pst), hmFlash = $('.hm-flash', pst);
    const hg = hmCv.getContext('2d');
    const dVs = $('.d-vs', pst), dMotto = $('.d-motto', pst);
    let HM = null, hmLast = -1, hmDrawn = -2;
    // the timeline of the smash (t = 0…1 over the whole 'hm' segment)
    const T_HIT = .36, T_AFTER = .6, T_FALL = .84;
    const hmLayout = () => {
      // a side swing like a windshield wiper: the pivot sits bottom-left, the head sweeps up and across and hits
      const mob = W < 760, hw = Math.min(480, W * (mob ? .5 : .36)), hh = hw * .3, hl = Math.min(H * (mob ? .42 : .55), W * (mob ? .8 : .42));
      pst.style.setProperty('--hw', hw.toFixed(0) + 'px'); pst.style.setProperty('--hh', hh.toFixed(0) + 'px'); pst.style.setProperty('--hl', hl.toFixed(0) + 'px');
      // it lands near the middle of the screen, so the damage is right in your face
      const piv = { x: W * (mob ? .24 : .27), y: H * .97 }, Lh = hl + hh / 2, END = mob ? 12 : 32, WIND = mob ? -34 : -46, ar = END * Math.PI / 180;
      const hit = { x: piv.x + Math.sin(ar) * Lh + Math.cos(ar) * hw * .45, y: piv.y - Math.cos(ar) * Lh + Math.sin(ar) * hw * .45 };
      const dpr = DPR(mob ? 1.5 : 1.25);
      hmCv.width = Math.round(W * dpr); hmCv.height = Math.round(H * dpr);
      let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const D = Math.hypot(W, H), cx = hit.x, cy = hit.y, n = LITE ? 11 : mob ? 14 : 22;
      // a spider-web: rays with a vertex on every ring
      const RK = [.028, .065, .115, .18, .27, .39, .54, .74].map(r => r * D);
      const rays = [];
      for (let i = 0; i < n; i++) {
        let a = i / n * Math.PI * 2 + (rnd() - .5) * Math.PI / n;
        const pts = [[cx, cy]];
        RK.forEach(R => { a += (rnd() - .5) * .14; const r = R * (.82 + rnd() * .36); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); });
        rays.push(pts);
      }
      // ring pieces between neighbouring rays (dense near the hit, sparse far out)
      const rings = [];
      for (let k = 1; k <= RK.length; k++) rays.forEach((pts, i) => {
        if (rnd() > (k <= 2 ? .96 : k <= 4 ? .8 : .52)) return;
        const A = pts[k], B = rays[(i + 1) % n][k], bend = (rnd() - .5) * RK[k - 1] * .25;
        rings.push({ k, A, B, m: [(A[0] + B[0]) / 2 + bend, (A[1] + B[1]) / 2 + bend * .6] });
      });
      // glass cells between two rays and two rings: the inner ones break out and fall, leaving black holes
      const cells = [];
      for (let k = 0; k < 5; k++) rays.forEach((pts, i) => {
        const nx = rays[(i + 1) % n], poly = k ? [pts[k], nx[k], nx[k + 1], pts[k + 1]] : [pts[0], nx[1], pts[1]];
        const c = poly.reduce((s, q) => [s[0] + q[0] / poly.length, s[1] + q[1] / poly.length], [0, 0]);
        const falls = k === 0 || (k === 1 && rnd() < .72) || (k === 2 && rnd() < .46) || (k === 3 && rnd() < .16);
        const glint = k <= 2 || rnd() < .35;
        if (!falls && !glint) return;
        const out = Math.atan2(c[1] - cy, c[0] - cx);
        cells.push({ k, poly, c, falls, glint,
          td: k === 0 ? T_HIT : k === 1 ? T_HIT + .05 + rnd() * .14 : k === 2 ? T_AFTER + .02 + rnd() * .12 : T_AFTER + .08 + rnd() * .14,
          a: .025 + rnd() * (k < 2 ? .13 : .07), blue: rnd() < .22,
          dx: Math.cos(out) * (1 + rnd() * 4), dy: Math.sin(out) * (1 + rnd() * 4),
          vx: (rnd() - .5) * 120, rot: (rnd() - .5) * 3, g: .8 + rnd() * .7 });
      });
      // crushed glass right at the crater, and a puff of dust
      const powder = Array.from({ length: mob ? 34 : 60 }, () => { const a = rnd() * Math.PI * 2, r = rnd() * RK[1] * 1.15, l = 3 + rnd() * 14; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, a + (rnd() - .5) * 1.4, l]; });
      const dust = Array.from({ length: mob ? 22 : 40 }, () => ({ a: -Math.PI * rnd() * 1.1 - .1 * Math.PI, v: (.08 + rnd() * .22) * D, s: 1.5 + rnd() * 3.5, g: .5 + rnd() }));
      // a broken LCD: bright vertical lines + a few horizontal glitch bands
      const lines = Array.from({ length: mob ? 5 : 9 }, (_, j) => ({ x: clamp(cx + (rnd() - .5) * W * .95, 4, W - 4), w: rnd() < .25 ? 6 + rnd() * 10 : 1 + rnd() * 2.5,
        c: ['77,163,255', '246,246,243', '43,120,204', '160,205,255'][(rnd() * 4) | 0], a: .35 + rnd() * .55, at: j < (mob ? 3 : 5) ? T_HIT : T_AFTER, s: rnd() * 50 }));
      const bands = Array.from({ length: mob ? 3 : 5 }, () => ({ y: clamp(cy + (rnd() - .5) * H * .9, 0, H), h: 2 + rnd() * 12, x: rnd() * W * .5, w: W * (.3 + rnd() * .7), at: rnd() < .5 ? T_HIT : T_AFTER }));
      // broken edges: at the second hit the page's straight border cracks and chips off all the way round
      const edge = [], edgeCr = [];
      const side = (x0, y0, x1, y1, nx, ny) => {
        const L = Math.hypot(x1 - x0, y1 - y0); let d = 10 + rnd() * 30;
        while (d < L - 12) {
          const u = d / L, deep = rnd() < .2, dep = deep ? 26 + rnd() * (mob ? 40 : 70) : 3 + rnd() * 18;
          const px = x0 + (x1 - x0) * u + nx * dep, py = y0 + (y1 - y0) * u + ny * dep;
          edge.push([px, py]);
          if (deep || rnd() < .25) {                                   // a little crack runs in from the chip
            const cr = [[px, py]]; let cx2 = px, cy2 = py, a = Math.atan2(ny, nx);
            for (let j = 0, m = 2 + (rnd() * 3 | 0); j < m; j++) { a += (rnd() - .5) * .9; const l = 14 + rnd() * 40; cx2 += Math.cos(a) * l; cy2 += Math.sin(a) * l; cr.push([cx2, cy2]); }
            edgeCr.push(cr);
          }
          d += 18 + rnd() * 62;
        }
      };
      side(0, 0, W, 0, 0, 1); side(W, 0, W, H, -1, 0); side(W, H, 0, H, 0, -1); side(0, H, 0, 0, 1, 0);
      const clip = 'polygon(' + edge.map(q => q[0].toFixed(1) + 'px ' + q[1].toFixed(1) + 'px').join(',') + ')';
      dLay.style.clipPath = '';
      HM = { hw, hh, hl, piv, END, WIND, hit, edge, edgeCr, clip, broke: false, dpr, D, RK, rays, rings, cells, powder, dust, lines, bands };
      hmLast = -1; hmDrawn = -2;
    };
    // draw a polyline up to a float vertex index
    const polyTo = (pts, v) => {
      if (v <= 0) return;
      hg.moveTo(pts[0][0], pts[0][1]);
      const k = Math.min(pts.length - 1, Math.floor(v));
      for (let j = 1; j <= k; j++) hg.lineTo(pts[j][0], pts[j][1]);
      const f = v - k;
      if (f > 0 && k < pts.length - 1) { const A = pts[k], B = pts[k + 1]; hg.lineTo(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f); }
    };
    const cellPath = (poly, ox = 0, oy = 0) => { hg.moveTo(poly[0][0] + ox, poly[0][1] + oy); for (let j = 1; j < poly.length; j++) hg.lineTo(poly[j][0] + ox, poly[j][1] + oy); hg.closePath(); };
    function hmDraw(t) {
      if (Math.abs(t - hmDrawn) < .0004) return;
      hmDrawn = t;
      const { dpr, D, RK, rays, rings, cells, powder, dust, lines, bands, hit } = HM;
      hg.setTransform(1, 0, 0, 1, 0, 0); hg.clearRect(0, 0, hmCv.width, hmCv.height);
      if (t < T_HIT) return;
      hg.setTransform(dpr, 0, 0, dpr, 0, 0);
      const e = u => 1 - Math.pow(1 - clamp(u), 3);
      const c1 = e((t - T_HIT) / .045), c3 = e((t - T_AFTER) / .08), fall = clamp((t - T_FALL) / .2);
      const flick = (s, sp = 90) => .62 + .38 * Math.sin(t * sp + s) * Math.sin(t * sp * 1.7 + s * 2.3);
      // 1) dead pixels: dark ink spreading out from the crater (blue at the edge)
      const rb = D * (.05 + .16 * c1 + .16 * e((t - T_HIT) / .38) + .1 * c3);
      let gr = hg.createRadialGradient(hit.x, hit.y, 0, hit.x, hit.y, rb);
      gr.addColorStop(0, 'rgba(0,0,0,.94)'); gr.addColorStop(.5, 'rgba(0,0,0,.72)'); gr.addColorStop(.82, 'rgba(12,40,90,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      hg.fillStyle = gr; hg.fillRect(hit.x - rb, hit.y - rb, rb * 2, rb * 2);
      const b2x = hit.x + RK[3] * .9, b2y = hit.y + RK[2] * .7, r2 = rb * .55 * c3;
      if (r2 > 2) { gr = hg.createRadialGradient(b2x, b2y, 0, b2x, b2y, r2); gr.addColorStop(0, 'rgba(0,0,0,.8)'); gr.addColorStop(.7, 'rgba(8,28,64,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); hg.fillStyle = gr; hg.fillRect(b2x - r2, b2y - r2, r2 * 2, r2 * 2); }
      // 2) broken LCD lines + glitch bands (they flicker as you scroll)
      lines.forEach(l => { if (t < l.at) return; const a = l.a * flick(l.s) * (t < l.at + .015 ? 1.6 : 1); hg.fillStyle = `rgba(${l.c},${clamp(a).toFixed(3)})`; hg.fillRect(l.x, 0, l.w, H); });
      bands.forEach((b, j) => { if (t < b.at) return; const sh = Math.sin(t * 70 + j * 9) * 18; hg.fillStyle = 'rgba(77,163,255,.14)'; hg.fillRect(b.x + sh, b.y, b.w, b.h); hg.fillStyle = 'rgba(246,246,243,.35)'; hg.fillRect(b.x + sh, b.y, b.w, 1); });
      // 3) the web of cracks: rays reach the 4th ring on impact, the rest at the second crunch
      const v = 4 * c1 + (RK.length - 4) * c3;
      hg.lineCap = 'round'; hg.lineJoin = 'round';
      hg.beginPath(); rays.forEach(p => polyTo(p, Math.min(v, 3))); hg.strokeStyle = 'rgba(77,163,255,.22)'; hg.lineWidth = 5; hg.stroke();
      hg.beginPath(); rays.forEach(p => polyTo(p, v)); hg.strokeStyle = 'rgba(246,246,243,.78)'; hg.lineWidth = 1.5; hg.stroke();
      hg.beginPath();
      rings.forEach(r => {
        const f = clamp((v - r.k + .2) * 1.6); if (f <= 0) return;
        hg.moveTo(r.A[0], r.A[1]);
        if (f >= 1) hg.quadraticCurveTo(r.m[0], r.m[1], r.B[0], r.B[1]);
        else hg.lineTo(r.A[0] + (r.B[0] - r.A[0]) * f, r.A[1] + (r.B[1] - r.A[1]) * f);
      });
      hg.strokeStyle = 'rgba(246,246,243,.55)'; hg.lineWidth = 1.1; hg.stroke();
      // 4) glass cells: pushed in by the blow, the inner ones break out one by one and fall (holes stay)
      cells.forEach(q => {
        const out = q.falls && t >= q.td;
        if (out) {                                                     // the hole left behind
          hg.beginPath(); cellPath(q.poly); hg.fillStyle = '#020203'; hg.fill();
          hg.strokeStyle = 'rgba(77,163,255,.55)'; hg.lineWidth = 1; hg.stroke();
        }
      });
      cells.forEach(q => {
        if (q.k > 0 && t < T_HIT + .004) return;
        const out = q.falls && t >= q.td;
        let ft = out ? clamp((t - q.td) / .13) : 0;
        if (!out && q.k <= 2 && fall > 0) ft = fall;                  // whatever is still stuck lets go when the page drops
        if (q.k === 0 && out) ft = clamp((t - T_HIT) / .06);           // the crater is punched straight in
        if (ft >= 1 || (!q.glint && !out)) return;
        const vis = clamp(v - q.k - .3);                             // glass only shows where the cracks have reached
        if (vis <= 0 && !out) return;
        const px = q.dx * c1 + q.vx * ft, py = q.dy * c1 + ft * ft * H * .9 * q.g;
        const al = (1 - ft * ft * ft) * (out ? 1 : vis);
        hg.save();
        if (ft > 0) { hg.translate(q.c[0] + px, q.c[1] + py); hg.rotate(q.rot * ft); hg.translate(-q.c[0], -q.c[1]); } else hg.translate(px, py);
        hg.beginPath(); cellPath(q.poly);
        hg.fillStyle = q.blue ? `rgba(77,163,255,${(q.a * 1.3 * al).toFixed(3)})` : `rgba(246,246,243,${(q.a * al).toFixed(3)})`; hg.fill();
        if (ft > 0 || q.k <= 1) { hg.strokeStyle = `rgba(246,246,243,${(.6 * al).toFixed(3)})`; hg.lineWidth = 1; hg.stroke(); }
        hg.restore();
      });
      // 5) crushed glass at the crater + a puff of dust
      hg.beginPath();
      powder.forEach(p => { hg.moveTo(p[0], p[1]); hg.lineTo(p[0] + Math.cos(p[2]) * p[3] * c1, p[1] + Math.sin(p[2]) * p[3] * c1); });
      hg.strokeStyle = 'rgba(246,246,243,.7)'; hg.lineWidth = 1; hg.stroke();
      const dt = clamp((t - T_HIT) / .14);
      if (dt > 0 && dt < 1) {
        hg.fillStyle = `rgba(210,225,245,${(.8 * (1 - dt)).toFixed(3)})`;
        dust.forEach(d => { const k = e(dt), x = hit.x + Math.cos(d.a) * d.v * k, y = hit.y + Math.sin(d.a) * d.v * k + dt * dt * H * .5 * d.g; hg.fillRect(x, y, d.s, d.s); });
      }
      // 6) the chipped border: a bright broken-glass rim + small cracks running in from the chips
      if (t >= T_AFTER) {
        const { edge, edgeCr } = HM, ce = c3;
        hg.beginPath(); edge.forEach((q, j) => (j ? hg.lineTo(q[0], q[1]) : hg.moveTo(q[0], q[1]))); hg.closePath();
        hg.strokeStyle = 'rgba(77,163,255,.35)'; hg.lineWidth = 7; hg.stroke();
        hg.strokeStyle = 'rgba(246,246,243,.8)'; hg.lineWidth = 1.6; hg.stroke();
        hg.beginPath(); edgeCr.forEach(cr => polyTo(cr, (cr.length - 1) * ce)); hg.strokeStyle = 'rgba(246,246,243,.6)'; hg.lineWidth = 1.1; hg.stroke();
      }
    }
    function hammer(t) {                                    // t: 0 = the motto, 1 = the page has fallen away
      if (t < 0) {
        if (hmLast !== -1) { dLay.style.transform = ''; dLay.style.clipPath = ''; if (HM) HM.broke = false; pst.style.removeProperty('--mo'); if (dVs) dVs.style.opacity = ''; hmLast = -1; if (HM) HM.m = null; hmDrawn = -2; }
        return;
      }
      if (!HM) hmLayout();
      if (reduce) t = t < .5 ? .7 : 1;
      const lerp = (a, b, k) => a + (b - a) * k;
      const { hw, hh, hl, hit } = HM;
      // where the small motto sits (the hammer head starts exactly there)
      if (!HM.m) { const mr = dMotto.getBoundingClientRect(), pr = pst.getBoundingClientRect(); HM.m = { x: mr.left + mr.width / 2 - pr.left, y: mr.top + mr.height / 2 - pr.top, s: Math.min(1, mr.width / hw) }; }
      const mx = HM.m.x, my = HM.m.y, s0 = HM.m.s;
      // 0–.08 the words fade · .08–.2 the hammer forms · .2–.31 wind up · .31–.36 swing · .36 IMPACT
      // .36–.54 the screen breaks, shards drop out · .6 the second hit, the cracks run across the whole screen
      // .6–.84 it just sits there, wrecked and sagging · .84–1 the broken page falls away
      const f1 = ease(clamp((t - .08) / .12)), f2 = ease(clamp((t - .2) / .11)), f3 = clamp((t - .31) / (T_HIT - .31)), f5 = ease(clamp((t - T_FALL) / (1 - T_FALL)));
      const { piv, END, WIND } = HM;
      const sc = lerp(s0, 1, f1);
      const x = lerp(mx, piv.x, f1), y = lerp(my + (hl + hh / 2) * s0, piv.y, f1);
      // stands up → pulled back to the left → whips across (END) and HITS → bounces off → rests …
      // → pulled back again → HITS again, harder → bounces off → rests while you look at the damage
      const S2 = T_AFTER - .014;
      let ang;
      if (t < .31) ang = lerp(0, -12, f1) + lerp(0, WIND + 12, f2);
      else if (t < T_HIT) ang = lerp(WIND, END, f3 * f3);
      else if (t < S2) ang = END - 11 * ease(clamp((t - T_HIT) / .07)) - 16 * ease(clamp((t - (S2 - .07)) / .065));
      else if (t < T_AFTER) { const k = (t - S2) / (T_AFTER - S2); ang = lerp(END - 27, END + 2, k * k); }
      else ang = END + 2 - 21 * ease(clamp((t - T_AFTER) / .08));
      hmRot.style.transform = `translate(${(x - hw / 2).toFixed(1)}px, ${(y - hh - hl).toFixed(1)}px) rotate(${ang.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      hmRot.style.opacity = t < .08 ? 0 : 1;
      hmRot.style.setProperty('--hs', f1.toFixed(3)); hmRot.style.setProperty('--hb', clamp(f1 * 1.5).toFixed(3));
      pst.style.setProperty('--mo', t >= .08 ? '0' : '1');
      if (dVs) dVs.style.opacity = (1 - clamp(t / .07)).toFixed(3);
      hmDraw(t);
      const fl = t >= T_HIT ? Math.max(0, 1 - (t - T_HIT) / .06) : 0, fl2 = t >= T_AFTER ? Math.max(0, .6 - (t - T_AFTER) / .07) : 0;
      hmFlash.style.opacity = Math.max(fl, fl2).toFixed(3);
      hmFlash.style.setProperty('--fx', hit.x.toFixed(0) + 'px'); hmFlash.style.setProperty('--fy', hit.y.toFixed(0) + 'px');
      if (hmLast >= 0 && !reduce) {
        const cross = v => (hmLast < v && t >= v);
        if (cross(T_HIT)) {
          sound.play('impact');
          pst.animate([{ transform: 'none' }, { transform: 'translate(16px,-4px)' }, { transform: 'translate(-11px,5px)' }, { transform: 'translate(6px,-2px)' }, { transform: 'translate(-2px,1px)' }, { transform: 'none' }], { duration: 520, easing: 'ease-out' });
          if (navigator.vibrate) try { navigator.vibrate(45); } catch (_) {}
        }
        if (cross(T_AFTER)) {
          sound.play('crash');
          pst.animate([{ transform: 'none' }, { transform: 'translate(-7px,3px)' }, { transform: 'translate(5px,-2px)' }, { transform: 'none' }], { duration: 340, easing: 'ease-out' });
          if (navigator.vibrate) try { navigator.vibrate(25); } catch (_) {}
        }
      }
      // the broken page falls away and the next page is underneath
      const broke = t >= T_AFTER;
      if (broke !== HM.broke) { HM.broke = broke; dLay.style.clipPath = broke ? HM.clip : ''; }
      // after the second hit the wrecked page starts to sag … then gives way
      const sag = ease(clamp((t - T_AFTER - .04) / (T_FALL - T_AFTER - .04)));
      const dy = sag * 2.2 + f5 * 110, dr = sag * 1.6 + f5 * 5;
      dLay.style.transform = dy > .01 ? `translateY(${dy.toFixed(2)}%) rotate(${dr.toFixed(2)}deg)` : '';
      hmLast = t;
    }

    /* ---- zoom into the ring: it opens up as a circle and you fly through it into I GET IT BETTER ---- */
    const cLay = lay('C'), bHead = $('.b-head', pst), cBeat = $('.beat', cLay);
    let PO = null, poLast = -1;
    function portal(t) {
      // 0–.45 the camera rises and looks straight down: the cards lie flat into a ring with a hole in the middle
      // .3–1   you dive down through the hole — I GET IT BETTER is waiting underneath
      if (t < 0) {
        if (poLast !== -1) { ringWrap.style.transform = ringWrap.style.opacity = bHead.style.opacity = cLay.style.opacity = cBeat.style.transform = ''; tiltX = -8; flatK = 0; ringKick(); poLast = -1; PO = null; }
        return;
      }
      if (!PO) {
        const pr = pst.getBoundingClientRect(), wr = ringWrap.getBoundingClientRect();
        const x = wr.left + wr.width / 2 - pr.left, y = wr.top + wr.height / 2 - pr.top;
        const cw = ring.offsetWidth || 200, f = 1200 / (1200 + RR);        // perspective shrink at the ring's depth
        PO = { x, y, R: Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 4, hole: Math.max(20, (RR - cw / 2) * f) };
      }
      const up = ease(clamp(t / .45)), dive = clamp((t - .42) / .58), d = dive * dive * (3 - 2 * dive);
      tiltX = -8 - 82 * up; flatK = up; ringKick();
      const sc = 1 + d * d * 9;
      ringWrap.style.transform = `scale(${sc.toFixed(3)})`;
      ringWrap.style.opacity = (1 - clamp((t - .8) / .2)).toFixed(3);
      bHead.style.opacity = (1 - clamp(t / .25)).toFixed(3);
      // the next page is down there: it rises out of the dark as you fall in (no circle)
      cLay.style.opacity = ease(clamp((t - .4) / .45)).toFixed(3);
      cBeat.style.transform = `scale(${(.45 + .55 * ease(clamp((t - .4) / .6))).toFixed(3)})`;
      poLast = t;
    }

    /* ---- the opportunity page slides off to the right and "So I grabbed it" slides in behind it ---- */
    const eLay = lay('E'), fLay = lay('F');
    let slLast = -1;
    function slide(t) {
      if (t < 0) { if (slLast !== -1) { eLay.style.transform = fLay.style.transform = ''; slLast = -1; } return; }
      const e = ease(t);
      eLay.style.transform = `translateX(${(-e * 100).toFixed(2)}%)`;
      fLay.style.transform = `translateX(${((1 - e) * 100).toFixed(2)}%)`;
      slLast = t;
    }

    /* ---- measure ---- */
    function layout() {
      H = pst.offsetHeight || innerHeight; W = pst.offsetWidth || innerWidth; S = H * PAGE;
      let acc = 0; starts = SEG.map(s => { const v = acc; acc += s.len; return v; });
      sec.style.height = Math.round(S * starts[N - 1] + (HOLD + TAIL) * S + H) + 'px';
      top = sec.getBoundingClientRect().top + scrollY;
      const ent = $('#entries'); if (ent) ent.style.top = Math.round(S * (starts[idx('b2')] - LEAD + .05)) + 'px';
      const pad = innerWidth < 700 ? 56 : 34;
      const bh = $('.b-head', pst), th = $('.b-th', pst), ttl = $('.b-title', pst);
      pst.style.setProperty('--thh', th.offsetHeight + 'px');
      const bs = Math.max(.4, Math.min(.62, 44 / (parseFloat(getComputedStyle(ttl).fontSize) || 90)));
      const bv = bh.offsetHeight * bs;
      pst.style.setProperty('--bs', bs.toFixed(3));
      pst.style.setProperty('--bdy', (H / 2 - pad - bv / 2).toFixed(1) + 'px');
      pst.style.setProperty('--rb', (bv + pad + 14).toFixed(0) + 'px');
      const dm = $('.d-motto', pst), mt = $('.motto-type', dm);
      const ds = Math.max(.24, Math.min(.5, 60 / (parseFloat(getComputedStyle(mt).fontSize) || 180)));
      const mv = mt.offsetHeight * ds, dmh = dm.offsetHeight;
      pst.style.setProperty('--ds', ds.toFixed(3));
      pst.style.setProperty('--ddy', (H / 2 - pad - mv - (dmh * ds - mv) / 2).toFixed(1) + 'px');
      pst.style.setProperty('--vsb', (mv + pad + 18).toFixed(0) + 'px');
      const gut = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gut')) || 24;
      pst.style.setProperty('--dmx', (W < 760 ? 0 : -W / 2 + Math.max(gut, 40) + dm.offsetWidth * ds / 2).toFixed(1) + 'px');
      ringLayout(); lossLayout(); hmLayout();
      VP = null; vLast = -1; circO = null; PO = null;
    }

    /* ---- apply a page ---- */
    function wake() {
      if (cur < 0) return;
      const L = lay(SEG[cur].sc);
      $$('.hl', L).forEach(h => h.classList.add('lit'));
      $$('.cube', L).forEach(c => c.classList.add('on'));
      if (SEG[cur].sc === 'F') $$('.beat', L).forEach(b => b.classList.add('seen'));
    }
    function setStep(i) {
      i = clamp(i, 0, N - 1);
      if (i === cur) return;
      const prev = cur; cur = i;
      const sg = SEG[i], sc = sg.sc, k = sg.k, pk = prev >= 0 ? SEG[prev].k : null, psc = prev >= 0 ? SEG[prev].sc : null;
      const jump = prev < 0 || Math.abs(i - prev) > 1;
      unshatter();
      // jumping, or leaving / entering a scroll-driven moment: swap layers instantly (no fade → nothing left behind)
      if (jump || SCRUB.has(k) || SCRUB.has(pk)) { pst.classList.add('jump'); requestAnimationFrame(() => requestAnimationFrame(() => pst.classList.remove('jump'))); }
      pst.classList.remove(...ALL); pst.classList.add(...sg.cls);
      if (psc && psc !== sc) {
        $$('.cube', lay(psc)).forEach(c => c.classList.remove('on'));
        if (psc === 'F') $$('.beat', lay('F')).forEach(b => b.classList.remove('seen'));
      }
      if (sc !== 'B') typeSet(sc === 'A' ? 0 : chars.length); else if (k !== 'b0') typeSet(chars.length);
      if (k === 'b2' || k === 'bz') ringStart(!jump && k === 'b2'); else ringStop();
      $$('.vs', pst).forEach((v, n) => { clearTimeout(v._t); if (k === 'd1' || k === 'hm') { if (!v.classList.contains('on')) v._t = setTimeout(() => v.classList.add('on'), jump || k === 'hm' ? 0 : 900 + n * 170); } else v.classList.remove('on'); });
      if (inView) requestAnimationFrame(wake);
    }
    let ticking = false;
    const sync = () => {
      ticking = false;
      const y = scrollY, u = (y - top) / S + LEAD;            // position on the timeline, in pages
      let i = 0; while (i < N - 1 && u >= starts[i + 1]) i++;
      setStep(u < 0 ? 0 : i);
      const at = k => (u - starts[idx(k)]);
      vapor(cur === idx('vap') ? clamp(at('vap') / .9, 0, .999) : -1);
      if (cur === idx('vap') || cur === idx('loss')) losses(at('vap') - 1);
      if (cur === idx('b0')) typeSet(Math.round(clamp(at('b0') / 1.05) * chars.length));
      portal(cur === idx('bz') ? clamp(at('bz') / SEG[idx('bz')].len) : -1);
      circle(at('cd'));
      hammer(cur === idx('hm') ? clamp(at('hm') / SEG[idx('hm')].len) : -1);
      slide(cur === idx('ef') ? clamp(at('ef') / SEG[idx('ef')].len) : -1);
      zoom(y);
    };
    window.__seg = k => [starts[idx(k)], SEG[idx(k)].len];
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(sync); } }, { passive: true });
    new IntersectionObserver(es => es.forEach(en => {
      inView = en.isIntersecting;
      if (inView) wake(); else $$('.cube', pst).forEach(c => c.classList.remove('on'));
    }), { threshold: .5 }).observe(pst);
    const relayout = () => { layout(); cur = -1; sync(); };
    addEventListener('resize', relayout);
    addEventListener('load', relayout);
    document.fonts?.ready.then(relayout);
    layout(); sync();
  })();

  /* =========================================================
     THE WORK — projects float in a 3D arc (they drop in as you arrive). Keep scrolling and the arc
     turns so each project comes to the middle, the light behind it takes that project's colour,
     and its story appears on the left. Click the middle one to open it; click another to go to it.
     ========================================================= */
  (() => {
    const sec = $('.wk'), stage = $('.wk-stage');
    if (!sec || !stage) return;
    const slabs = $$('.wk-slab', sec), infos = $$('.wk-info', sec), nEl = $('.wk-n', sec), bar = $('.wk-bar i', sec);
    const n = slabs.length;
    const TILT = [-12, 9, -6, 13, -9, 7, -14, 10];
    slabs.forEach((s, i) => s.style.setProperty('--bd', (i * -.55).toFixed(2) + 's'));
    let H = 1, W = 1, L = 1, top = 0, INTRO = 1, cur = -2, ticking = false;
    const layout = () => {
      H = stage.offsetHeight || innerHeight; W = stage.offsetWidth || innerWidth;
      L = H * .62; INTRO = L * 1.2;
      sec.style.height = Math.round(H + INTRO + L * (n - 1) + L * .6) + 'px';
      top = sec.getBoundingClientRect().top + scrollY;
      frame();
    };
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const focus = k => {
      if (k === cur) return;
      cur = k;
      infos.forEach((el, i) => el.classList.toggle('on', i === k));
      slabs.forEach((s, i) => {
        s.classList.toggle('is-on', i === k);
        const v = $('video', s); if (!v) return;
        if (i === k && !reduce) { if (!v.src) v.src = v.dataset.src; v.play().then(() => v.classList.add('on')).catch(() => {}); }
        else { v.pause(); v.classList.remove('on'); }
      });
      stage.style.setProperty('--tint', k >= 0 ? slabs[k].dataset.tint : '#44444c');
      stage.classList.toggle('focus', k >= 0);
      if (nEl && k >= 0) nEl.textContent = String(k + 1).padStart(2, '0');
      if (k >= 0) sound.play('clack');
    };
    function frame() {
      ticking = false;
      const rel = scrollY - top;
      if (rel < -H * 1.1 || rel > sec.offsetHeight) return;
      const mob = W < 760;
      const drop = clamp((rel + H) / H);                              // 0 as the section appears → 1 once it's pinned
      const z = ease(clamp(rel / INTRO));                              // overview → one project in focus
      const f = clamp((rel - INTRO) / L, 0, n - 1);                    // which project is in the middle (fractional)
      const zs = z.toFixed(3); if (zs !== stage._z) { stage._z = zs; stage.style.setProperty('--z', zs); }
      const R = W * (mob ? 1.2 : .7);
      const spread = mob ? 15 + 10 * z : 16 + 11 * z;
      slabs.forEach((s, i) => {
        const o = (i - (n - 1) / 2) * (1 - z) + (i - f) * z;            // position along the arc
        const a = o * spread, ar = a * Math.PI / 180;
        const w = clamp(1 - Math.abs(i - f)) * z;                      // 1 = the one in the middle
        const di = ease(clamp(drop * 1.7 - (i % 4) * .12 - (i > 3 ? .1 : 0)));
        const x = Math.sin(ar) * R, zz = (Math.cos(ar) - 1) * R, yy = (1 - Math.cos(ar)) * R * .22 - (1 - di) * H * 1.15;
        const sc = 1 + w * (mob ? .12 : .26);
        s.style.transform = `translate3d(${x.toFixed(1)}px, ${yy.toFixed(1)}px, ${(zz + w * 80).toFixed(1)}px) rotateY(${(-a * .7).toFixed(2)}deg) rotateZ(${(TILT[i % 8] * (1 - w) * (1 - di * 0)).toFixed(2)}deg) scale(${sc.toFixed(3)})`;
        s.style.opacity = (Math.abs(a) > 78 ? 0 : clamp(1 - .6 * z * (1 - w)) * clamp(di * 3)).toFixed(3);
        s.style.zIndex = String(100 - Math.round(Math.abs(o) * 10));
      });
      focus(z > .6 ? Math.round(f) : -1);
      if (bar) bar.style.transform = `${mob ? 'scaleX' : 'scaleY'}(${(f / (n - 1)).toFixed(3)})`;
    }
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    addEventListener('resize', layout); addEventListener('load', layout); document.fonts?.ready.then(layout);
    // click the middle project → open it; click one at the side → scroll it into the middle
    slabs.forEach((s, i) => s.addEventListener('click', () => {
      if (i === cur) { if (typeof csOpen === 'function') csOpen(s.dataset.case, s); return; }
      window.scrollTo({ top: top + INTRO + i * L + 2, behavior: 'smooth' });
    }));
    focus(-1);
    layout();
  })();

  /* ---------- CONTACT: "LET'S MAKE SOMETHING." is literally made — blocks fall and stack into the words,
                  then lift up and turn blue wherever your cursor (or finger) passes ---------- */
  (() => {
    const panel = $('.contact'), h = $('.contact h2');
    if (!panel || !h) return;
    const cv = document.createElement('canvas'); cv.className = 'vx'; cv.setAttribute('aria-hidden', 'true');
    h.after(cv); panel.classList.add('vx-on');
    const hint = document.createElement('span'); hint.className = 'mono vx-hint'; hint.textContent = fine ? 'ลองลากเมาส์ผ่านตัวอักษร' : 'ลองแตะที่ตัวอักษร'; cv.after(hint);
    const g = cv.getContext('2d');
    let W = 0, Hc = 0, cell = 10, dep = 3, blocks = [], t0 = 0, started = false, done = false, raf = 0, vis = false, px = -1e4, py = -1e4, dpr = 1;
    const lines = ["LET'S MAKE", 'SOMETHING.'];
    const build = () => {
      W = cv.clientWidth; if (!W) return;
      cell = W < 520 ? 5 : W < 900 ? 8 : 10; dep = Math.max(2, Math.round(cell * .38));
      const o = document.createElement('canvas').getContext('2d');
      o.font = `400 100px Anton, Impact, "Arial Narrow", sans-serif`;
      const wmax = Math.max(...lines.map(l => o.measureText(l).width));
      const fs = Math.min(W * .98 / wmax * 100, 260), lh = fs * .9;
      Hc = Math.ceil(lh * lines.length + fs * .12 + cell * 3);
      const oc = o.canvas; oc.width = W; oc.height = Hc;
      o.font = `400 ${fs}px Anton, Impact, "Arial Narrow", sans-serif`; o.fillStyle = '#000'; o.textBaseline = 'alphabetic';
      lines.forEach((l, i) => o.fillText(l, 0, cell * 2 + lh * (i + 1) - fs * .06));
      const d = o.getImageData(0, 0, W, Hc).data;
      const prev = new Map(blocks.map(b => [b.key, b]));
      blocks = [];
      for (let y = 0; y + cell <= Hc; y += cell) for (let x = 0; x + cell <= W; x += cell) {
        const q = ((y + (cell >> 1)) * W + x + (cell >> 1)) * 4;
        if (d[q + 3] < 128) continue;
        const key = x + ',' + y, p = prev.get(key);
        blocks.push({ key, x, y, l: p ? p.l : 0, dl: (x / W) * 900 + (y / Hc) * 250 + Math.random() * 380 });
      }
      blocks.sort((a, b) => a.y - b.y || b.x - a.x);                   // back to front
      dpr = DPR(1.5);
      cv.width = W * dpr; cv.height = Hc * dpr; cv.style.height = Hc + 'px';
      kick();
    };
    const bounce = k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; };
    const frame = now => {
      raf = 0;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, Hc);
      const r = cv.getBoundingClientRect(), prog = reduce ? 1 : Math.max(0, Math.min(1, (innerHeight * .98 - r.top) / (innerHeight * .62)));
      const s = cell - 1, R = cell * 9;
      let busy = false;
      for (const b of blocks) {
        const k = Math.min(1, Math.max(0, (prog - b.dl / 1530 * .62) / .38));   // each block falls in as you scroll
        if (k <= 0) continue;
        const dist = Math.hypot(b.x + s / 2 - px, b.y + s / 2 - py);
        const want = dist < R ? (1 - dist / R) ** 1.5 * cell * 2.2 : 0;
        b.l += (want - b.l) * .22;
        if (Math.abs(want - b.l) > .05) busy = true;
        const x = b.x, y = b.y - b.l - (1 - bounce(k)) * (Hc + 80);
        const hot = b.l > cell * .18;
        g.fillStyle = hot ? '#a9d2ff' : '#44444a';                         // top
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + dep, y - dep); g.lineTo(x + s + dep, y - dep); g.lineTo(x + s, y); g.fill();
        g.fillStyle = hot ? '#2b78cc' : '#1f1f23';                         // side
        g.beginPath(); g.moveTo(x + s, y); g.lineTo(x + s + dep, y - dep); g.lineTo(x + s + dep, y + s - dep); g.lineTo(x + s, y + s); g.fill();
        g.fillStyle = hot ? '#4da3ff' : '#0b0b0b';                         // front
        g.fillRect(x, y, s, s);
      }
      if (vis && busy) raf = requestAnimationFrame(frame);
      else if (started && !busy) done = true;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const at = e => { const r = cv.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; kick(); };
    cv.addEventListener('pointermove', at);
    cv.addEventListener('pointerdown', e => { at(e); if (e.pointerType !== 'mouse') setTimeout(() => { px = py = -1e4; kick(); }, 700); });
    cv.addEventListener('pointerleave', () => { px = py = -1e4; kick(); });
    new IntersectionObserver(es => es.forEach(e => { vis = e.isIntersecting; if (vis) { started = true; kick(); } }), { threshold: 0 }).observe(cv);
    addEventListener('scroll', () => { if (vis) kick(); }, { passive: true });
    let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });
    (document.fonts?.ready || Promise.resolve()).then(build);
  })();

  /* ---------- SMALL WINS v11 — all on the scroll:
                  the photo is hidden under a grid of little blocks (like the SMALL WINS cover) that flip away one by one
                  while the number counts up to 1,500 · the three points drop in · the "ใช้จริง" stamp slams down.
                  Big screens pin the scene; phones run the same moments as each part scrolls past. ---------- */
  (() => {
    const feat = $('.win-feat[data-scrub]');
    if (!feat) return;
    const pin = $('.wx-pin'), main = $('.wf-main', feat), cv = $('.wf-blocks', feat);
    const th = $('.wf-th', feat), en = $('.wf-en', feat), x = $('.wf-en b', feat), para = $('.wf-text > p', feat);
    const num = $('.count', feat), to = +num.dataset.to || 0, stamp = $('.stamp', feat), stats = $('.wf-stats', feat), lis = $$('.wf-points li', feat);
    const g = cv.getContext('2d');
    const mq = matchMedia('(min-width: 900px) and (min-height: 700px)');
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const ease = t => 1 - Math.pow(1 - t, 3);
    const fmt = v => Math.round(v).toLocaleString('en-US');
    let N = 12, cells = [], cw = 0, ch = 0, dpr = 1, tk = false, key = '', lastS = -1, lastNum = '';
    const build = () => {
      N = innerWidth < 700 ? 10 : 12;
      cw = main.offsetWidth; ch = main.offsetHeight;
      dpr = DPR(1.5);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      cells = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const tone = rnd();
        cells.push({ r, c, a: rnd(),                                                  // a: when it pops in
          o: ((c / (N - 1)) * .55 + ((N - 1 - r) / (N - 1)) * .45) * .8 + rnd() * .2,     // o: when it flips away (a wave from the bottom-left)
          col: tone < .08 ? '#4da3ff' : tone < .2 ? '#1f4e80' : tone < .23 ? '#f6f6f3' : '#17171a' });
      }
      key = ''; upd();
    };
    const blocks = (bk, k) => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cw, ch);
      if (k >= 1) return;
      const sw = cw / N, sh = ch / N, gap = Math.max(1, sw * .1);
      for (const q of cells) {
        const b = clamp((bk - q.a * .7) / .3);
        const f = clamp((k - q.o * .86) / .14);
        if (f >= 1) continue;
        const x0 = q.c * sw, y0 = q.r * sh, s = ease(b);
        if (f < .5) { g.globalAlpha = 1; g.fillStyle = '#0b0b0c'; g.fillRect(x0, y0, sw + .5, sh + .5); }   // the backing hides the photo until its block flips
        let col = q.col, sy = 1, al = 1;
        if (f > 0) { sy = Math.abs(Math.cos(f * Math.PI)); col = f < .5 ? '#4da3ff' : '#bfe0ff'; al = f < .5 ? 1 : 1 - (f - .5) * 2; }
        const w = (sw - gap) * s, h = (sh - gap) * s * sy;
        if (b > 0) { g.globalAlpha = al; g.fillStyle = col; g.fillRect(x0 + (sw - w) / 2, y0 + (sh - h) / 2, w, h); }
      }
      g.globalAlpha = 1;
    };
    const rise = (el, e) => {                     // text rises out of a mask line
      if (!el) return;
      if (e >= 1) { el.style.transform = el.style.clipPath = ''; return; }
      el.style.transform = `translateY(${((1 - e) * 100).toFixed(1)}%)`;
      el.style.clipPath = `inset(-30% -6% ${((1 - e) * 130 - 30).toFixed(1)}% -6%)`;
    };
    const upd = () => {
      tk = false;
      const vh = innerHeight, pinned = mq.matches && !reduce;
      let bk, tt, pa, k, kc, lk, s, sr;
      if (reduce) { bk = tt = pa = k = kc = s = sr = 1; lk = [1, 1, 1]; }
      else if (pinned) {
        const pr = pin.getBoundingClientRect();
        if (pr.top > vh * 1.2 || pr.bottom < -vh * .2) return;
        const span = pin.offsetHeight - vh || 1, p = pr.top > 0 ? -pr.top / vh : -pr.top / span;
        bk = clamp((p + .75) / .6); tt = clamp((p + .6) / .5); pa = clamp((p + .3) / .35);
        k = kc = clamp(p / .42);
        lk = lis.map((_, i) => clamp((p - (.45 + i * .075)) / .1));
        s = clamp((p - .7) / .07); sr = clamp((p - .77) / .05);
      } else {
        const mr = main.getBoundingClientRect();
        if (mr.top > vh * 1.3 || feat.getBoundingClientRect().bottom < -vh * .2) return;
        bk = clamp((vh * 1.05 - mr.top) / (vh * .35)); k = clamp((vh * .78 - mr.top) / (vh * .5));
        tt = clamp((vh * .98 - th.getBoundingClientRect().top) / (vh * .28)); pa = clamp((vh * .95 - para.getBoundingClientRect().top) / (vh * .25));
        const st = stats.getBoundingClientRect().top;
        kc = clamp((vh * .95 - st) / (vh * .38)); s = clamp((vh * .56 - st) / (vh * .1)); sr = clamp((vh * .46 - st) / (vh * .06));
        lk = lis.map(li => clamp((vh * .93 - li.getBoundingClientRect().top) / (vh * .2)));
      }
      const nk = [bk, tt, pa, k, kc, s, sr, ...lk].map(v => v.toFixed(3)).join();
      if (nk === key) return;
      key = nk;
      blocks(bk, k);
      main.style.setProperty('--wk', k.toFixed(3));
      main.style.setProperty('--wy', (pinned ? (1 - ease(bk)) * 28 - 6 * Math.sin(k * Math.PI) : 0).toFixed(2) + 'deg');
      rise(th, ease(tt)); rise(en, ease(clamp((tt - .22) / .78)));
      if (x) x.style.transform = `rotate(${(tt * 90 + kc * 180).toFixed(1)}deg)`;
      para.style.opacity = pa.toFixed(3); para.style.transform = `translateY(${((1 - ease(pa)) * 18).toFixed(1)}px)`;
      const n = fmt(Math.round(to * kc / 10) * 10);
      if (n !== lastNum) { num.textContent = n; lastNum = n; }
      lis.forEach((li, i) => {
        const e = ease(lk[i]);
        li.style.setProperty('--lk', e.toFixed(3));
        li.style.opacity = clamp((lk[i] - .2) / .8).toFixed(3);
        li.style.transform = `translateX(${((1 - e) * -22).toFixed(1)}px)`;
      });
      // the stamp: hangs big above the page, then slams down (ease-in) — shake + a blue ring
      const sd = s * s;
      stamp.style.opacity = clamp(s * 4).toFixed(3);
      stamp.style.transform = `rotate(${(-18 + 12 * sd).toFixed(2)}deg) scale(${(2.8 - 1.8 * sd).toFixed(3)})`;
      stamp.style.setProperty('--so', s >= 1 ? '1' : '0');
      stamp.style.setProperty('--sr', s >= 1 ? sr.toFixed(3) : '0');
      if (lastS >= 0 && lastS < 1 && s >= 1 && !reduce) {
        sound.play('crash');
        stats.animate([{ transform: 'none' }, { transform: 'translate(0,7px)' }, { transform: 'translate(0,-3px)' }, { transform: 'none' }], { duration: 300, easing: 'ease-out' });
        main.animate([{ transform: 'none' }, { transform: 'translate(-4px,3px)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
        if (navigator.vibrate) try { navigator.vibrate(30); } catch (_) {}
      }
      lastS = s;
    };
    addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(upd); } }, { passive: true });
    let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 120); });
    mq.addEventListener?.('change', build);
    addEventListener('load', build);
    build();
  })();

  /* ---------- GIVE: the blue block (the chance I grabbed) bursts into small blocks that are handed out,
                  then they all fall — straight down into THE WORK, whose cards drop in next ---------- */
  (() => {
    const sec = $('.gv'), stage = $('.gv-stage'), cv = $('.gv-cv'), txt = $('.gv-txt');
    if (!sec || !cv) return;
    const g = cv.getContext('2d');
    const h3 = $('h3', txt), words = [];
    // light the heading up word by word
    [...h3.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(w)); return; } const sp = document.createElement('span'); sp.textContent = w; f.appendChild(sp); words.push(sp); });
        n.replaceWith(f);
      } else words.push(n);
    });
    // 1) the white block hands a blue square to each of the four grey blocks (like before)
    // 2) all blue → it charges up  3) everything bursts into small blocks across the screen
    // 4) they all fall — out of this page and down into THE WORK, whose cards drop in right after
    let W = 0, H = 0, top = 0, P = [], tk = false, last = -9, SC = 1;
    let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const ease = t => 1 - Math.pow(1 - t, 3);
    // the little scene, in its own units (same layout as the old CSS version): giver + four receivers
    const GIVER = { x: 14, y: -40, s: 40 }, KS = [90, 128, 166, 204].map(x => ({ x, y: -14, s: 14 })), CW = 240;
    const layout = () => {
      W = stage.clientWidth; H = stage.clientHeight;
      sec.style.height = Math.round(H * 3.4) + 'px';
      top = sec.getBoundingClientRect().top + scrollY;
      cv.width = innerWidth; cv.height = innerHeight;                   // a screen-sized layer: the pieces can fall anywhere, nothing cuts them off
      SC = Math.min(2.4, W / CW * .55);
      seed = 3;
      P = [];
      const src = [GIVER, ...KS];
      src.forEach((b, bi) => {
        const n = (bi ? (W < 700 ? 12 : 24) : (W < 700 ? 26 : 48)) * (LITE ? .6 : 1) | 0;
        for (let i = 0; i < n; i++) P.push({ bi, ox: rnd(), oy: rnd(), a: rnd() * Math.PI * 2, d: (.12 + rnd() * .55) * Math.hypot(W, H) * .5, s: 4 + rnd() * (bi ? 8 : 12), c: bi ? (rnd() < .8 ? '#4da3ff' : '#2b78cc') : (rnd() < .6 ? '#f6f6f3' : '#4da3ff'), g: 1 + rnd() * .8, spin: (rnd() - .5) * 9, dl: rnd() * .15 });
      });
      last = -9; draw();
    };
    const draw = () => {
      tk = false;
      const rel = scrollY - top, span = sec.offsetHeight - H || 1, p = rel / span;
      const live = p > -1.1 && p < 1.7;
      cv.style.display = live ? '' : 'none';
      if (!live) { last = -9; return; }
      if (Math.abs(p - last) < .0008) return;
      last = p;
      const pp = clamp(p);
      const wk = clamp(pp / .25) * (words.length + 1);
      words.forEach((w, i) => (w.style.opacity = (.14 + .86 * clamp(wk - i)).toFixed(3)));
      txt.style.transform = `translateY(${(-clamp((pp - .66) / .3) * H * .35).toFixed(1)}px)`;
      txt.style.opacity = (1 - clamp((p - .76) / .3)).toFixed(3);
      const VW = cv.width, VH = cv.height;
      g.clearRect(0, 0, VW, VH);
      const sTop = stage.getBoundingClientRect().top;                   // the scene rides with the page once the pin lets go
      const ox = (VW - W) / 2 + W / 2 - CW * SC / 2, oy = H * .3 + sTop;   // scene origin (floor line), in screen space
      const X = u => ox + u * SC, Y = v => oy + v * SC;
      // hand-outs .05–.35 · charge .36–.62 (longer) · burst .62–.74 · fall from .72, fast enough to leave the screen before THE WORK settles
      const charge = clamp((pp - .36) / .26), burst = clamp((pp - .62) / .12), fall = Math.max(0, (p - .72) / .85);
      if (burst < .01) {
        const jit = charge * charge * 3.6 * SC;
        const J = () => (Math.random() - .5) * jit;
        // charging: square pulses ripple out from the group, faster and brighter as it fills up
        if (charge > 0) {
          const gcx = X(CW / 2 - 10), gcy = Y(-18), n = 1 + charge * 5;
          for (let k = 0; k < 3; k++) {
            const ph = (charge * n + k / 3) % 1, r = (40 + ph * 160) * SC * .5;
            g.strokeStyle = `rgba(77,163,255,${((1 - ph) * .5 * charge).toFixed(3)})`; g.lineWidth = 1.5;
            g.strokeRect(gcx - r * 1.6, gcy - r * .6, r * 3.2, r * 1.2);
          }
        }
        // floor
        g.fillStyle = '#2a2a2d'; g.fillRect(X(0), Y(0), CW * SC, Math.max(1, SC * .8));
        // glow while charging
        if (charge > 0) {
          g.fillStyle = `rgba(77,163,255,${(.12 + .25 * charge).toFixed(3)})`;
          const pad = (6 + 10 * charge) * SC;
          [GIVER, ...KS].forEach(b => g.fillRect(X(b.x) - pad / 2, Y(b.y) - pad / 2, b.s * SC + pad, b.s * SC + pad));
        }
        // giver (white) with the blue core inside
        const gx = X(GIVER.x) + J(), gy = Y(GIVER.y) + J();
        g.fillStyle = '#f6f6f3'; g.fillRect(gx, gy, GIVER.s * SC, GIVER.s * SC);
        const cs = (8 + 14 * charge) * SC;
        g.fillStyle = '#4da3ff'; g.fillRect(gx + (GIVER.s * SC - cs) / 2, gy + (GIVER.s * SC - cs) / 2, cs, cs);
        // four receivers + the blue squares tossed to them
        KS.forEach((k, i) => {
          const t = clamp((pp - (.05 + i * .055)) / .09), got = t >= 1;
          const kx = X(k.x) + J(), ky = Y(k.y) + J(), ks = k.s * SC;
          g.fillStyle = got ? '#4da3ff' : '#38383b'; g.fillRect(kx, ky, ks, ks);
          if (t > 0 && !got) {                                          // in flight: an arc from the giver to this block
            const sx = X(GIVER.x + GIVER.s / 2), sy = Y(GIVER.y + GIVER.s / 2), ex = kx + ks / 2, ey = ky + ks / 2;
            const x = sx + (ex - sx) * t, y = sy + (ey - sy) * t - Math.sin(t * Math.PI) * 58 * SC, q = 8 * SC;
            g.save(); g.translate(x, y); g.rotate(t * Math.PI * 2); g.fillStyle = '#4da3ff'; g.fillRect(-q / 2, -q / 2, q, q); g.restore();
          }
        });
        return;
      }
      // burst → fall
      const src = [GIVER, ...KS];
      for (const q of P) {
        const b = src[q.bi], bx = X(b.x + b.s * q.ox), by = Y(b.y + b.s * q.oy);
        const e = ease(clamp((burst - q.dl) / (1 - q.dl)));
        const x = bx + Math.cos(q.a) * q.d * e, y = by + Math.sin(q.a) * q.d * e * .7 + fall * fall * H * 4.2 * q.g;
        if (y > VH + 20 || y < -40) continue;
        g.save(); g.translate(x, y); g.rotate(q.spin * (e + fall)); g.fillStyle = q.c; g.fillRect(-q.s / 2, -q.s / 2, q.s, q.s); g.restore();
      }
    };
    addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(draw); } }, { passive: true });
    addEventListener('resize', layout); addEventListener('load', layout); document.fonts?.ready.then(layout);
    layout();
  })();

  /* certificates button: a little digital rain behind the fanned certificates */
  window.matrixRain?.($('.cc-rain'), { size: 16, fade: 'rgba(11,11,11,.12)', fps: innerWidth < 760 ? 14 : 20, color: '#2f7fd6', head: '#f6f6f3' });

  // start the hero intro last, once every helper above exists
  /* ---- 0. INTRO — Marvel Comics style: a comic book of my photos flips faster and faster while the camera pulls back,
         a blue PEE logo box slams in front, a light sweep, then it shrinks into the page title,
         the block rolls home, the page UI slides in — and only then the gameplay video fades up behind. ---- */
  // phones get the lighter portrait cut of the background video
  (() => { const v = $('.hero-bg video'); if (v && matchMedia('(max-width: 700px)').matches && !/-m\.mp4/.test(v.currentSrc || '')) { v.src = 'assets/work/hero-loop-m.mp4'; v.load(); v.play?.().catch(() => {}); } })();
  const hero = $('#home'), h1 = $('.wm h1');
  const shots = JSON.parse(hero?.dataset.tunnel || '[]');
  let seen = false;
  try { seen = sessionStorage.getItem('pp-intro') === '1'; } catch (e) {}
  const wantIntro = !seen && shots.length && scrollY < innerHeight * 0.3 && (!location.hash || location.hash === '#home');
  const root = document.documentElement;
  if (!wantIntro) { root.classList.remove('intro-on', 'bg-wait'); if (scrollY < innerHeight * 0.5) heroRoll(); else showSq(); }
  else {
    root.classList.add('intro-on', 'bg-wait');
    h1.classList.add('played');
    h1.style.opacity = 0;
    const add = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; document.body.appendChild(d); return d; };
    // start preloading straight away
    const ready = [];
    shots.forEach(src => { const i = new Image(); i.onload = () => ready.push(src); i.src = src; });

    try { sessionStorage.setItem('pp-intro', '1'); } catch (e) {}
    start();

    function start() {
      // Marvel Comics style: full-screen comic panels cut faster and faster, PEE appears in front with the comics
      // flickering inside its letters, then the letters turn solid white and the page carries on — no break
      const mv = add('mv', '<div class="mv-cam"><div class="mv-f"><i class="mv-p"></i><i class="mv-p"></i><i class="mv-p"></i></div><div class="mv-f"><i class="mv-p"></i><i class="mv-p"></i><i class="mv-p"></i></div></div>');
      const cam = $('.mv-cam', mv), frames = $$('.mv-f', mv);
      const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'intro-skip mono'; skip.textContent = 'Skip intro ›'; document.body.appendChild(skip);
      const timers = [], anims = [];
      const at = (ms, fn) => timers.push(setTimeout(fn, ms));
      const run = (el, kf, o) => { const a = el.animate(kf, o); anims.push(a); return a; };
      let ended = false;

      const land = () => {
        h1.style.opacity = '';
        h1.classList.remove('shots');
        sound.play('impact');
        run(h1, [{ filter: 'brightness(2.4)' }, { filter: 'none' }], { duration: 600, easing: 'ease-out' });
        if (!reduce) $('#page').animate([{ transform: 'none' }, { transform: 'translateY(6px)' }, { transform: 'translateY(-2px)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
        afterRoll = () => { root.classList.remove('intro-on'); root.classList.add('hero-in'); setTimeout(() => root.classList.remove('bg-wait'), 1300); };
        at(300, () => heroRoll(true));
        at(4500, afterRoll);
      };
      const cleanup = () => { skip.remove(); mv.animate([{ opacity: getComputedStyle(mv).opacity }, { opacity: 0 }], { duration: 1300, easing: 'ease-in-out', fill: 'forwards' }).finished.then(() => mv.remove()); removeEventListener('wheel', finish); };
      function finish() {
        if (ended) return; ended = true;
        timers.forEach(clearTimeout); anims.forEach(a => a.cancel());
        cleanup(); land();
      }
      skip.addEventListener('click', finish);
      addEventListener('wheel', finish, { passive: true });

      new Promise(res => {
        const t0 = performance.now();
        const chk = () => (ready.length >= Math.min(10, shots.length) || performance.now() - t0 > 2500) ? res() : setTimeout(chk, 60);
        chk();
      }).then(() => {
        if (ended) return;
        const pics = shots.filter(s => ready.includes(s)); if (!pics.length) { finish(); return; }
        let pi = 0; const next = () => `url("${pics[pi++ % pics.length]}")`;
        const C = reduce ? 8 : 26;                                         // number of cuts
        const dur = Array.from({ length: C }, (_, k) => 480 - 330 * Math.pow(k / (C - 1), .8));   // 480 ms → 150 ms, gently speeding up
        const total = dur.reduce((a, b) => a + b, 0);
        const PEE_AT = total * .55;                                        // PEE shows up while the comics are still flying
        mv.classList.add('go');
        // the camera slowly pulls back over the whole thing
        run(cam, [{ scale: 1.3 }, { scale: 1 }], { duration: total + 1600, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' });
        sound.play('whoosh', total / 1000 * .9);
        const LAY = ['l1', 'l2', 'l3', 'l2b', 'l1', 'l3b'];
        let k = 0;
        const cut = () => {
          if (ended) return;
          // build the next page on the back layer, then cross-fade it in (smooth, never a hard flash)
          const fr = frames[k % 2], d = dur[k], fade = Math.min(260, d * .65);
          fr.className = 'mv-f ' + LAY[(k * 7 + (k >> 2)) % LAY.length];
          $$('.mv-p', fr).forEach(p => { p.style.backgroundImage = next(); p.style.backgroundPosition = `${(k * 37) % 100}% ${(k * 53) % 100}%`; });
          fr.style.zIndex = k + 1;
          const rot = ((k * 73) % 7 - 3) * .5;
          run(fr, [{ opacity: 0, transform: `scale(1.08) rotate(${rot}deg)` }, { opacity: 1, transform: `scale(1.045) rotate(${rot * .7}deg)`, offset: fade / (d + fade) }, { opacity: 1, transform: `scale(1) rotate(${rot * .4}deg)` }],
            { duration: d + fade, easing: 'linear', fill: 'forwards' });
          if (k % 2 === 0) sound.play('tick', k);
          k++;
          if (k < C) at(d, cut); else at(d + 500, outro);
        };
        cut();
        // PEE appears in front, filled with the flickering comics
        at(PEE_AT, () => {
          if (ended) return;
          h1.style.opacity = '';
          mv.classList.add('dim');
          sound.play('open');
          run(h1, [{ transform: 'scale(1.22)', opacity: 0, filter: 'blur(8px)' }, { transform: 'scale(1)', opacity: 1, filter: 'blur(0px)' }], { duration: 1900, easing: 'cubic-bezier(.16,.8,.2,1)', fill: 'backwards' });
        });
        // the comics stop, the letters go solid, the page lands
        function outro() {
          if (ended) return;
          ended = true;
          cleanup(); land();
        }
      });
    }
  }
})();
