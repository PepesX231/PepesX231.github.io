/* renders quick.html · work.html · fail-log.html from js/cases.js */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const page = document.body.dataset.page, C = window.CASES || [], F = window.FAILS || [];
  const isWin = c => /รางวัล|Finalist|รองชนะ/.test(c.result);
  const todo = (what, hint) => `<div class="todo">✏️ <b>ยังไม่ได้เขียน — ${what}</b><br>${hint}<br><small>(กล่องนี้ไม่ขึ้นใน PDF · แก้ได้ที่ js/cases.js)</small></div>`;
  const isVid = s => /\.mp4$/i.test(s);

  if (page === 'quick') {
    $('#qWorks').innerHTML = C.map(c => `
      <a class="wc" href="work.html?p=${c.id}">
        <span class="wc-img" style="background-image:url('${c.cover}')"><span class="wc-badge ${isWin(c) ? 'win' : ''}">${esc(c.result)}</span></span>
        <span class="wc-b"><span class="mono">${esc(c.role)}</span><h3>${esc(c.title)}</h3><p>${esc(c.what || '')}</p><span class="wc-more">อ่านต่อ →</span></span>
      </a>`).join('');
    $('#qFail').innerHTML = F.slice(0, 4).map(f => `<div><s>${esc(f.stamp)}</s><b>${esc(f.title)}</b><span class="mono">${esc(f.when)}</span></div>`).join('');
  }

  if (page === 'work') {
    const id = new URLSearchParams(location.search).get('p') || C[0]?.id;
    const i = Math.max(0, C.findIndex(c => c.id === id)), c = C[i];
    document.title = `${c.title} — PEEPEE`;
    const prev = C[(i - 1 + C.length) % C.length], next = C[(i + 1) % C.length];
    const media = c.gallery[0], poster = c.gallery.find(g => !isVid(g)) || c.cover;
    const row = (h, sub, body) => `<div class="cs-grid"><h2>${h}${sub ? `<small>${sub}</small>` : ''}</h2>${body}</div>`;
    const para = t => `<p>${esc(t)}</p>`;
    $('#cs').innerHTML = `
      <section class="cs-top">
        <a class="back" href="index.html#work">← ผลงานทั้งหมด</a>
        <span class="mono" style="display:block;margin-top:18px">${esc(String(i + 1).padStart(2, '0'))} / ${String(C.length).padStart(2, '0')} · ${esc(c.year)}</span>
        <h1>${esc(c.title)}<span class="hl">.</span></h1>
        <div class="cs-tags"><span class="${isWin(c) ? 'win' : ''}">${esc(c.result)}</span>${c.role.split('·').map(r => `<span>${esc(r.trim())}</span>`).join('')}</div>
        <div class="btns" style="margin-top:18px">${c.links.filter(l => !/certificates/.test(l[0])).map(l => `<a class="btn pri" href="${l[0]}" target="_blank" rel="noopener">${esc(l[1])}</a>`).join('')}
          ${c.links.some(l => /certificates/.test(l[0])) ? '<a class="btn" href="certificates.html">ดูเกียรติบัตร ↗</a>' : ''}</div>
        <div class="cs-media">${isVid(media) ? `<video src="${media}" poster="${poster}" autoplay muted loop playsinline></video>` : `<img src="${media}" alt="${esc(c.title)}">`}</div>
        ${c.stats.length ? `<div class="cs-stats">${c.stats.map(s => `<div><b>${esc(s[0])}</b><span class="mono">${esc(s[1])}</span></div>`).join('')}</div>` : ''}
      </section>
      <section>
        ${row('โจทย์ / คืออะไร', '', para(c.what))}
        ${c.features ? row('ฟีเจอร์เด่น', '', para(c.features)) : ''}
        ${row('ผมทำอะไร', 'บทบาทในทีม', c.mine ? para(c.mine) : todo('บทบาทของผม', 'ผมรับผิดชอบส่วนไหน ใช้ทักษะอะไร'))}
        ${row('กระบวนการ', 'ทำยังไง', c.process ? para(c.process) : todo('กระบวนการทำ', 'เริ่มจากอะไร → ออกแบบ → ทำต้นแบบ → ทดสอบ → ปรับ · ใช้เครื่องมืออะไร ใช้เวลาเท่าไร'))}
        ${row('ปัญหาที่เจอ', 'และแก้ยังไง', c.problems ? para(c.problems) : todo('ปัญหาที่เจอ + วิธีแก้', 'เล่า 1–2 เรื่องที่พังหรือติดจริง ๆ แล้วเราแก้ยังไง — ข้อนี้กรรมการชอบถามที่สุด'))}
        ${c.result_text ? row('ผลลัพธ์', '', para(c.result_text)) : ''}
        ${row('ได้เรียนรู้', '', c.learned ? para(c.learned) : todo('สิ่งที่ได้เรียนรู้', 'งานนี้ทำให้เราเก่งขึ้นเรื่องอะไร'))}
        ${c.next ? row('ต่อจากนี้', '', para(c.next)) : ''}
      </section>
      ${c.gallery.length > 1 ? `<section class="sec"><div class="sec-h"><h2>Gallery<i></i></h2><span class="mono">${c.gallery.length} ภาพ · กดเพื่อขยาย</span></div>
        <div class="cs-gal">${c.gallery.map(g => `<a href="${g}" data-lb>${isVid(g) ? `<video src="${g}" poster="${poster}" muted loop playsinline preload="none"></video>` : `<img src="${g}" alt="" loading="lazy">`}</a>`).join('')}</div></section>` : ''}
      <nav class="cs-nav"><a href="work.html?p=${prev.id}"><span class="mono">← ก่อนหน้า</span><b>${esc(prev.title)}</b></a><a href="work.html?p=${next.id}"><span class="mono">ถัดไป →</span><b>${esc(next.title)}</b></a></nav>`;
    const lb = $('#lb');
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-lb]');
      if (a) { e.preventDefault(); const s = a.getAttribute('href'); lb.innerHTML = isVid(s) ? `<video src="${s}" autoplay controls playsinline></video>` : `<img src="${s}" alt="">`; lb.classList.add('on'); return; }
      if (e.target === lb || e.target.closest('#lb img')) { lb.classList.remove('on'); lb.innerHTML = ''; }
    });
    addEventListener('keydown', e => { if (e.key === 'Escape') { lb.classList.remove('on'); lb.innerHTML = ''; } });
  }

  if (page === 'fail') {
    const items = [...F, { won: true, title: 'MetaLab', when: 'Thailand Metaverse Hackathon · 2026', stamp: 'รางวัลแรก', img: 'assets/entries/meta-1.jpg', case: 'metalab',
      happened: 'หลังแพ้มากกว่า 20 ครั้ง — ได้เข้ารอบ Final 12 ทีม และได้รางวัลดีเด่น (Design Delight)', learned: 'ทุกครั้งที่แพ้ก่อนหน้านี้ คือเหตุผลที่ครั้งนี้ชนะ' }];
    $('#flList').innerHTML = items.map(f => `
      <article class="fl ${f.won ? 'won' : ''}">
        <div>
          <span class="mono">${esc(f.when)}</span>
          <h2>${esc(f.title)}</h2>
          <span class="fl-stamp">${esc(f.stamp)}</span>
          <dl>
            <div><dt>เกิดอะไรขึ้น</dt><dd>${esc(f.happened)}</dd></div>
            <div><dt>ได้เรียนรู้อะไร</dt><dd>${f.learned ? esc(f.learned) : todo('บทเรียนจากครั้งนี้', 'แพ้เพราะอะไร และครั้งนี้สอนอะไรเรา')}</dd></div>
            ${f.won ? '' : `<div><dt>แล้วทำอะไรต่อ</dt><dd>${f.next ? esc(f.next) : todo('ก้าวต่อไป', 'หลังจากนั้นเราไปฝึก / เปลี่ยนอะไร แล้วเอาไปใช้ในงานไหนต่อ')}</dd></div>`}
          </dl>
          ${f.case ? `<p style="margin-top:14px"><a class="btn" href="work.html?p=${f.case}">ดูผลงานนี้ →</a></p>` : ''}
        </div>
        <div class="fl-img"><img src="${f.img}" alt="" loading="lazy"></div>
      </article>`).join('');
  }
})();
