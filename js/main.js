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

  /* ---------- SMOOTH SCROLL (mouse wheel / trackpad only — touch keeps its native feel) ---------- */
  (() => {
    if (reduce || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const root = document.documentElement;
    let target = scrollY, cur = scrollY, raf = 0, driving = false;
    const max = () => root.scrollHeight - innerHeight;
    const locked = () => getComputedStyle(root).overflowY === 'hidden' || getComputedStyle(document.body).overflowY === 'hidden';
    const canScrollInside = (el, dy) => {
      for (; el && el !== document.body; el = el.parentElement) {
        const cs = getComputedStyle(el);
        if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) {
          if ((dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (dy < 0 && el.scrollTop > 0)) return true;
        }
      }
      return false;
    };
    let last = -1;
    const loop = () => {
      // someone else moved the page (anchor link, keyboard, scrollbar) → let go
      if (last >= 0 && Math.abs(scrollY - last) > 3) { driving = false; raf = 0; last = -1; cur = target = scrollY; return; }
      cur += (target - cur) * .15;
      if (Math.abs(target - cur) < .5) { cur = target; driving = false; raf = 0; }
      window.scrollTo(0, cur); last = driving ? Math.round(cur) === Math.round(scrollY) ? scrollY : scrollY : -1;
      if (driving) raf = requestAnimationFrame(loop);
    };
    addEventListener('wheel', e => {
      if (e.defaultPrevented) return;                 // the pinned STORY already handled this one
      if (e.ctrlKey || locked() || canScrollInside(e.target, e.deltaY) || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (!driving) { cur = target = scrollY; }
      const d = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      target = Math.max(0, Math.min(max(), target + d));
      root.style.scrollBehavior = 'auto';
      if (!driving) { driving = true; raf = requestAnimationFrame(loop); }
    }, { passive: false });
    // keyboard, scrollbar, anchor jumps: follow whatever the page did
    addEventListener('scroll', () => { if (!driving) { cur = target = scrollY; root.style.scrollBehavior = ''; } }, { passive: true });
    const release = () => { if (driving) { cancelAnimationFrame(raf); driving = false; raf = 0; last = -1; } root.style.scrollBehavior = ''; cur = target = scrollY; };
    addEventListener('click', e => { if (e.target.closest?.('a[href^="#"], a[href*="index.html#"]')) release(); }, true);
    addEventListener('keydown', release, true);
  })();



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
      const r = stage.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1);
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
    const loop = () => { step(); step(); draw(); raf = visible || drag ? requestAnimationFrame(loop) : 0; };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
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

  /* ---------- ABOUT: skills on a 3D sphere — auto-spins, drag to throw it around ---------- */
  (() => {
    const el = $('#skillSphere'); if (!el) return;
    const words = ['Unity', 'C#', 'Game Systems', 'Level Design', 'Puzzle Design', 'Python', 'AI', 'Prompting', 'Figma', 'Canva', 'Pitching', 'Teamwork', 'GitHub', 'Game Jam', 'Physics', 'Storytelling', 'Leadership', 'Critical Thinking', 'Java', 'PHP', 'HTML', 'CSS', 'JavaScript'];
    const logos = {'Unity': '<path d="M8 1l6 3.5v7L8 15l-6-3.5v-7z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 8l6-3.5M8 8v7M8 8L2 4.5" stroke="currentColor" stroke-width="1.6"/>','C#': '<path d="M8 1l6.5 3.7v6.6L8 15l-6.5-3.7V4.7z" fill="#68217a"/><text x="8" y="10.8" font-size="7" font-weight="700" fill="#fff" text-anchor="middle" font-family="sans-serif">C#</text>','Python': '<path d="M8 1.5c-3 0-3 1.3-3 2.5v1.5h3v.6H3.6C2 6.1 1.5 7.4 1.5 8.9S2 11.6 3.6 11.6H5V10c0-1.4 1.2-2.4 2.6-2.4h3c1.2 0 2-.9 2-2V4c0-1.4-1.6-2.5-4.6-2.5z" fill="#3776ab"/><path d="M8 14.5c3 0 3-1.3 3-2.5v-1.5H8v-.6h4.4c1.6 0 2.1-1.3 2.1-2.8S14 4.4 12.4 4.4H11V6c0 1.4-1.2 2.4-2.6 2.4h-3c-1.2 0-2 .9-2 2V12c0 1.4 1.6 2.5 4.6 2.5z" fill="#ffd43b"/>','Figma': '<circle cx="10" cy="8" r="2.5" fill="#1abcfe"/><path d="M5.5 13a2.5 2.5 0 015 0v-2.5h-2.5A2.5 2.5 0 005.5 13z" fill="#0acf83"/><path d="M5.5 8a2.5 2.5 0 012.5-2.5h2.5v5H8A2.5 2.5 0 015.5 8z" fill="#a259ff"/><path d="M5.5 3A2.5 2.5 0 018 .5h2.5v5H8A2.5 2.5 0 015.5 3z" fill="#f24e1e"/><path d="M10.5.5H13a2.5 2.5 0 010 5h-2.5z" fill="#ff7262"/>','Canva': '<circle cx="8" cy="8" r="7" fill="#00c4cc"/><text x="8" y="11" font-size="8" font-weight="700" fill="#fff" text-anchor="middle" font-family="serif" font-style="italic">C</text>','GitHub': '<path d="M8 1a7 7 0 00-2.2 13.6c.35.07.5-.15.5-.34v-1.2c-1.95.42-2.36-.94-2.36-.94-.32-.8-.78-1.02-.78-1.02-.64-.44.05-.43.05-.43.7.05 1.07.72 1.07.72.63 1.07 1.64.76 2.04.58.06-.45.24-.76.44-.94-1.55-.18-3.19-.78-3.19-3.46 0-.76.27-1.39.72-1.88-.07-.18-.31-.89.07-1.85 0 0 .59-.19 1.93.72a6.6 6.6 0 013.5 0c1.34-.91 1.93-.72 1.93-.72.38.96.14 1.67.07 1.85.45.49.72 1.12.72 1.88 0 2.69-1.64 3.28-3.2 3.45.25.22.48.64.48 1.3v1.93c0 .19.13.41.5.34A7 7 0 008 1z" fill="currentColor"/>','AI': '<path d="M8 1l1.6 4.4L14 7l-4.4 1.6L8 13l-1.6-4.4L2 7l4.4-1.6z" fill="#4da3ff"/>', 'Java': '<path d="M6 9.5s-1 .6.7.8c2 .2 3 .2 5.2-.2 0 0 .6.4 1.4.7-4.9 2.1-11-.1-7.3-1.3zM5.4 12s-1.1.8.6 1c2.1.2 3.8.2 6.8-.3 0 0 .4.4 1 .6-6 1.7-12.6.1-8.4-1.3z" fill="#5382a1"/><path d="M8.9 7.8c1.2 1.4-.3 2.6-.3 2.6s3-1.6 1.7-3.5C9 5 8.2 4.3 12.6 1.8c0 0-6.9 1.7-3.7 6z" fill="#e76f00"/>', 'PHP': '<ellipse cx="8" cy="8" rx="7.5" ry="4.2" fill="#777bb3"/><text x="8" y="10.2" font-size="5.6" font-weight="700" fill="#fff" text-anchor="middle" font-family="sans-serif" font-style="italic">php</text>', 'HTML': '<path d="M2 1h12l-1.1 12.3L8 15l-4.9-1.7z" fill="#e34f26"/><path d="M5 4.5h6l-.2 2H7l.1 1.5h3.5l-.3 3.3L8 12l-2.3-.7-.1-1.6h1.4l.1.6.9.3.9-.3.1-1.1H5.3z" fill="#fff"/>', 'CSS': '<path d="M2 1h12l-1.1 12.3L8 15l-4.9-1.7z" fill="#1572b6"/><path d="M5 4.5h6l-.2 2H7.1l.1 1.5h3.4l-.3 3.3L8 12l-2.3-.7-.1-1.6h1.4l.1.6.9.3.9-.3.1-1.1H5.3z" fill="#fff"/>', 'JavaScript': '<rect x="1" y="1" width="14" height="14" rx="1.5" fill="#f7df1e"/><text x="10" y="13" font-size="6.5" font-weight="700" fill="#222" text-anchor="middle" font-family="sans-serif">JS</text>'};   // hand-drawn mini logos, inline so they always load
    const tags = words.map((w, i) => {
      const s = document.createElement('span'); const ic = logos[w]; s.innerHTML = (logos[w] ? `<svg viewBox="0 0 16 16" aria-hidden="true">${logos[w]}</svg>` : '') + w; if (i < 2 || /Leadership|Critical/.test(w)) s.className = 'hot'; el.appendChild(s);
      const y = 1 - (i + .5) / words.length * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;   // fibonacci sphere
      return { s, x: Math.cos(th) * r, y, z: Math.sin(th) * r };
    });
    let ax = .004, ay = .007, R = 0, vis = false, raf = 0, dragging = null;
    const rot = (t, a, b) => {
      const cy = Math.cos(a), sy = Math.sin(a), cx = Math.cos(b), sx = Math.sin(b);
      let x = t.x * cy + t.z * sy, z = -t.x * sy + t.z * cy;       // around Y
      let y = t.y * cx - z * sx; z = t.y * sx + z * cx;            // around X
      t.x = x; t.y = y; t.z = z;
    };
    const frame = () => {
      R = Math.min(el.clientWidth, el.clientHeight) * .42;
      if (!dragging) { ax += (.004 - ax) * .02; ay += (.007 - ay) * .02; }
      tags.forEach(t => {
        rot(t, reduce ? 0 : ay, reduce ? 0 : ax);
        const k = (t.z + 1.6) / 2.6;
        t.s.style.transform = `translate(-50%,-50%) translate3d(${(t.x * R * 1.45).toFixed(1)}px,${(t.y * R).toFixed(1)}px,0) scale(${(.6 + .5 * k).toFixed(3)})`;
        t.s.style.opacity = (.25 + .75 * k).toFixed(3); t.s.style.zIndex = Math.round(k * 100);
      });
      raf = vis || dragging ? requestAnimationFrame(frame) : 0;
    };
    el.addEventListener('pointerdown', e => { dragging = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); el.classList.add('grab'); if (!raf) raf = requestAnimationFrame(frame); });
    el.addEventListener('pointermove', e => { if (!dragging) return; ay = (e.clientX - dragging.x) * .004; ax = -(e.clientY - dragging.y) * .004; dragging.x = e.clientX; dragging.y = e.clientY; });
    const end = () => { dragging = null; el.classList.remove('grab'); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    new IntersectionObserver(es => es.forEach(e => { vis = e.isIntersecting; if (vis && !raf) raf = requestAnimationFrame(frame); })).observe(el);
    frame();
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
    if (!below) feat.classList.add('go');
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
      { k: 'b0', sc: 'B', len: 1 }, { k: 'b1', sc: 'B', len: 1 }, { k: 'b2', sc: 'B', len: 1.2 },
      { k: 'c0', sc: 'C', len: 1 },
      { k: 'cd', sc: 'C', st: 'c0 cd', len: 1 },           // the circle opens (scrubbed)
      { k: 'd0', sc: 'D', len: 1 }, { k: 'd1', sc: 'D', len: 1 },
      { k: 'hm', sc: 'D', st: 'd1 hmr', len: 1.7 },          // FAIL FAST becomes a hammer and smashes the screen (scrubbed)
      { k: 'e0', sc: 'E', len: 1 }, { k: 'f0', sc: 'F', len: 1 }];
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
    const typeSet = k => { chars.forEach((c, j) => c.classList.toggle('on', j < k)); (k ? chars[k - 1].after(caret) : bt.prepend(caret)); };
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
      const gap = Math.max(2, Math.round(Math.sqrt(bw * bh / 30000)));
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
      const { P, gap, Wc, Hc } = VP, dpr = Math.min(2, devicePixelRatio || 1);
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
      const C = 5, R = 4, P = [];
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
        const d = document.createElement('i'); d.className = 'lx-sh';
        d.style.clipPath = `polygon(${t.map(p => p[0].toFixed(2) + '% ' + p[1].toFixed(2) + '%').join(',')})`;
        d.style.backgroundImage = `linear-gradient(125deg,rgba(255,255,255,.16),rgba(255,255,255,0) 38%,rgba(255,255,255,0) 70%,rgba(255,255,255,.07)),url("${img}")`;
        d.style.backgroundPosition = `0 0, ${pos}`;
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
        o.txt.style.filter = s > 0 ? `blur(${(s * 8).toFixed(1)}px)` : '';
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
    let rot = 0, tgt = 0, RR = 280, ringOn = false, rRaf = 0, rdrag = null, lastTouch = 0;
    const ringLayout = () => {
      const cw = ring.offsetWidth || 200;
      RR = innerWidth < 700 ? cw * 1.45 : Math.min(cw * 1.55, Math.max(cw * 1.1, innerWidth / 2 - cw * .3));
      rcs.forEach((c, i) => { c._a = i * STEP_A; c.style.transform = `rotateY(${c._a}deg) translateZ(${RR.toFixed(1)}px)`; });
    };
    const ringFrame = now => {
      if (!rdrag) {
        if (!reduce && now > lastTouch) tgt -= AUTO;                  // keeps turning on its own
        rot += (tgt - rot) * .08;
      }
      ring.style.transform = `translateZ(${(-RR).toFixed(1)}px) rotateX(-8deg) rotateY(${rot.toFixed(2)}deg)`;
      rcs.forEach(c => {
        const z = Math.cos((c._a + rot) * Math.PI / 180);
        c.style.opacity = (.12 + .88 * Math.pow(Math.max(0, (z + .35) / 1.35), 1.6)).toFixed(3);
        c.style.pointerEvents = z > .5 ? '' : 'none';
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
      const dpr = Math.min(2, devicePixelRatio || 1);
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

    /* ---- FAIL FAST. LEARN FAST. → a hammer: it forms, winds up, smashes the screen, the cracked page falls away ---- */
    const hmRot = $('.hm-rot', pst), hmHandle = $('.hm-handle', pst), hmCrack = $('.hm-crack', pst), hmFlash = $('.hm-flash', pst);
    const dVs = $('.d-vs', pst), dMotto = $('.d-motto', pst);
    let HM = null, hmLast = -1, crackPaths = [];
    const hmLayout = () => {
      const hw = Math.min(560, W * .82), hh = hw * .3, hl = Math.min(H * .36, hw * .75);
      pst.style.setProperty('--hw', hw.toFixed(0) + 'px'); pst.style.setProperty('--hh', hh.toFixed(0) + 'px'); pst.style.setProperty('--hl', hl.toFixed(0) + 'px');
      HM = { hw, hh, hl, hit: { x: W / 2, y: H * .45 } };
      // the crack: a spider-web from the impact point
      const ns = 'http://www.w3.org/2000/svg';
      hmCrack.setAttribute('viewBox', `0 0 ${W} ${H}`); hmCrack.innerHTML = '';
      let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const cx = HM.hit.x, cy = HM.hit.y, Rm = Math.hypot(W, H) * .62, n = 15, rays = [];
      for (let i = 0; i < n; i++) {
        const a0 = i / n * Math.PI * 2 + (rnd() - .5) * .3, pts = [[cx, cy]];
        let r = 0, a = a0;
        while (r < Rm) { r += 40 + rnd() * 90; a += (rnd() - .5) * .22; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
        rays.push(pts);
      }
      crackPaths = [];
      const add = (d, delay) => { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); p.setAttribute('pathLength', '1'); hmCrack.appendChild(p); crackPaths.push({ p, delay }); };
      rays.forEach(pts => add('M' + pts.map(q => q[0].toFixed(0) + ' ' + q[1].toFixed(0)).join('L'), 0));
      [1, 2, 3, 5].forEach((ring, ri) => rays.forEach((pts, i) => {
        const nx = rays[(i + 1) % n], A = pts[Math.min(ring, pts.length - 1)], B = nx[Math.min(ring, nx.length - 1)];
        if (rnd() < .78) add(`M${A[0].toFixed(0)} ${A[1].toFixed(0)}Q${((A[0] + B[0]) / 2 + (rnd() - .5) * 30).toFixed(0)} ${((A[1] + B[1]) / 2 + (rnd() - .5) * 30).toFixed(0)} ${B[0].toFixed(0)} ${B[1].toFixed(0)}`, .25 + ri * .18);
      }));
      hmLast = -1;
    };
    function hammer(t) {                                    // t: 0 = the motto, 1 = the page has fallen away
      if (t < 0) {
        if (hmLast !== -1) { dLay.style.transform = ''; pst.style.removeProperty('--mo'); if (dVs) dVs.style.opacity = ''; hmLast = -1; }
        return;
      }
      if (!HM) hmLayout();
      if (reduce) t = t < .5 ? 0 : 1;
      const lerp = (a, b, k) => a + (b - a) * k;
      const { hw, hh, hl, hit } = HM;
      // where the small motto sits (the hammer head starts exactly there)
      const mr = dMotto.getBoundingClientRect(), pr = pst.getBoundingClientRect();
      const mx = mr.left + mr.width / 2 - pr.left, my = mr.top + mr.height / 2 - pr.top, s0 = Math.min(1, mr.width / hw);
      const f1 = ease(clamp(t / .2)), f2 = ease(clamp((t - .2) / .24)), f3 = clamp((t - .44) / .1), f4 = clamp((t - .54) / .1), f5 = ease(clamp((t - .66) / .34));
      const px = W / 2, py = H * .93;
      const sc = lerp(s0, 1, f1) * (1 + .75 * f3 * f3) * (1 - .12 * f4);
      const x = lerp(mx, px, f1), y = lerp(my + (hl + hh / 2) * s0, py, f1);
      const rx = f3 > 0 ? lerp(62, -38, f3 * f3) + 10 * f4 : lerp(0, 62, f2);  // wind up (away), then swing at you
      const rz = lerp(0, -10, f2) * (1 - f3);
      hmRot.style.transform = `translate(${(x - hw / 2).toFixed(1)}px, ${(y - hh - hl).toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      hmRot.style.opacity = (1 - clamp((t - .58) / .08)).toFixed(3);
      hmRot.style.setProperty('--hs', f1.toFixed(3)); hmRot.style.setProperty('--hb', clamp(f1 * 1.5).toFixed(3));
      pst.style.setProperty('--mo', t > .005 ? '0' : '1');
      if (dVs) dVs.style.opacity = (1 - clamp(t / .14)).toFixed(3);
      // impact
      const c = clamp((t - .54) / .1);
      crackPaths.forEach(q => { q.p.style.strokeDashoffset = (1 - clamp((c - q.delay) / (1 - q.delay * .6))).toFixed(3); });
      hmFlash.style.opacity = (t >= .54 ? Math.max(0, 1 - (t - .54) / .07) : 0).toFixed(3);
      if (hmLast >= 0 && hmLast < .54 && t >= .54 && !reduce) {
        sound.play('impact');
        pst.animate([{ transform: 'none' }, { transform: 'translate(-12px,7px)' }, { transform: 'translate(9px,-5px)' }, { transform: 'translate(-4px,2px)' }, { transform: 'none' }], { duration: 420, easing: 'ease-out' });
        if (navigator.vibrate) try { navigator.vibrate(40); } catch (_) {}
      }
      // the cracked page falls away and the next page is underneath
      dLay.style.transform = f5 ? `translateY(${(f5 * 108).toFixed(2)}%) rotate(${(f5 * 4).toFixed(2)}deg)` : '';
      hmLast = t;
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
      ringLayout(); lossLayout(); hmLayout();
      VP = null; vLast = -1; circO = null;
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
      if (jump) { pst.classList.add('jump'); requestAnimationFrame(() => requestAnimationFrame(() => pst.classList.remove('jump'))); }
      pst.classList.remove(...ALL); pst.classList.add(...sg.cls);
      if (!jump && !reduce && pk === 'd1' && k === 'e0') shatter();
      if (psc && psc !== sc) {
        $$('.cube', lay(psc)).forEach(c => c.classList.remove('on'));
        if (psc === 'F') $$('.beat', lay('F')).forEach(b => b.classList.remove('seen'));
      }
      if (sc === 'B') { if (psc !== 'B') { if (!jump && k === 'b0' && !reduce) type(); else { typeStop(); typeSet(chars.length); } } }
      else if (psc === 'B') { typeStop(); if (sc === 'A') typeSet(0); }
      if (k === 'b2') ringStart(!jump); else ringStop();
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
      circle(at('cd'));
      hammer(cur === idx('hm') ? clamp(at('hm') / SEG[idx('hm')].len) : -1);
      zoom(y);
    };
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
      stage.style.setProperty('--z', z.toFixed(3));
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
      dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = Hc * dpr; cv.style.height = Hc + 'px';
      kick();
    };
    const bounce = k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; };
    const frame = now => {
      raf = 0;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, Hc);
      const el = started ? now - t0 : 0, s = cell - 1, R = cell * 9;
      let busy = false;
      for (const b of blocks) {
        const k = reduce ? 1 : Math.min(1, Math.max(0, (el - b.dl) / 620));
        if (k <= 0) { busy = true; continue; }
        if (k < 1) busy = true;
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
    new IntersectionObserver(es => es.forEach(e => {
      vis = e.isIntersecting;
      if (vis && !started) { started = true; t0 = performance.now() + 150; }
      if (vis) kick();
    }), { threshold: .3 }).observe(cv);
    let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });
    (document.fonts?.ready || Promise.resolve()).then(build);
  })();

  /* certificates button: a little digital rain behind the fanned certificates */
  window.matrixRain?.($('.cc-rain'), { size: 14, fade: 'rgba(11,11,11,.12)', fps: 22, color: '#2f7fd6', head: '#f6f6f3' });

  // start the hero intro last, once every helper above exists
  /* ---- 0. INTRO — Marvel-style: one photo at a time fills the whole word PEE while the camera pulls back.
         ~6 s of cuts that start fast and slow down, a thud,
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
      const reel = add('intro-reel');
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
        // UI first (nav + hello + motto slide up as the block lands), the game world behind comes last
        afterRoll = () => { root.classList.remove('intro-on'); root.classList.add('hero-in'); setTimeout(() => root.classList.remove('bg-wait'), 1300); };
        at(300, () => heroRoll(true));
        at(4500, afterRoll);
      };
      const cleanup = () => { [skip].forEach(e => e.remove()); reel.animate([{ opacity: getComputedStyle(reel).opacity }, { opacity: 0 }], { duration: 500, fill: 'forwards' }).finished.then(() => reel.remove()); removeEventListener('wheel', finish); };
      function finish() {
        if (ended) return; ended = true;
        timers.forEach(clearTimeout); anims.forEach(a => a.cancel());
        cleanup(); land();
      }
      skip.addEventListener('click', finish);
      addEventListener('wheel', finish, { passive: true });

      // wait (max 2 s) for a dozen photos; only ever show loaded ones
      new Promise(res => {
        const t0 = performance.now();
        const chk = () => (ready.length >= Math.min(10, shots.length) || performance.now() - t0 > 2500) ? res() : setTimeout(chk, 60);
        chk();
      }).then(() => {
        if (ended) return;
        const N = shots.length;
        const delays = Array.from({ length: N }, (_, k) => 70 + 250 * Math.pow(k / (N - 1), 2.3));   // fast → slow
        const total = delays.reduce((a, b) => a + b, 0);
        const ease = 'cubic-bezier(.12,.7,.25,1)';
        h1.style.opacity = '';
        h1.classList.add('shots');
        sound.play('whoosh', total / 1000 * .55);
        run(h1, [{ transform: `scale(${reduce ? 1.1 : 1.4})`, letterSpacing: '.06em' }, { transform: 'scale(1)', letterSpacing: '-.005em' }], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });   // big → small fast, then the photos keep flipping
        run(reel, [{ opacity: 0, transform: 'scale(1.08)' }, { opacity: .34, offset: .1 }, { opacity: .3, offset: .88, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1)' }], { duration: total + 200, fill: 'forwards' });
        let k = 0;
        const shown = new Set();
        const step = () => {
          if (ended) return;
          // next photo in order that has loaded and hasn't been shown yet
          let src = shots.find(s => ready.includes(s) && !shown.has(s)) || ready[k % Math.max(1, ready.length)];
          if (src) {
            shown.add(src);
            h1.style.setProperty('--shot', `url("${new URL(src, location.href).href}")`);
            reel.style.backgroundImage = `url("${src}")`;
            sound.play('tick', k);
          }
          if (k >= N - 1) { at(delays[N - 1], () => { if (ended) return; ended = true; cleanup(); land(); }); return; }
          at(delays[k++], step);
        };
        step();
      });
    }
  }
})();
