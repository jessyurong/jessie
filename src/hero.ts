import { portfolio, type Project } from './data/portfolio';
import { isSheetOpen, openSheet } from './sheet';

const EASE_DEFAULT = 'cubic-bezier(.22,.8,.2,1)';
const SCENE_GLIDE_SECONDS = 0.7;

const featured: Project[] = portfolio.projects.filter(p => p.featured).slice(0, 4);

const CASES = featured.map(p => ({
  project: p,
  title: p.ticketTitle,
  rows: [p.context, p.category, p.year],
  key: '// ' + p.slug,
  text: '— ' + p.description,
}));

function slideMarkup(p: Project): string {
  const stack = p.stack.length ? `<span class="poster-stack">${p.stack.join(' · ')}</span>` : '';
  const kicker = `// ${p.flagship ? 'flagship project' : 'featured project'}`;

  if (p.preview) {
    return `<div class="poster has-shot">
      <img class="poster-shot" src="${p.preview}" alt="${p.name} — ${p.category} screenshot" loading="lazy" decoding="async" />
      <div class="poster-cap">
        <span class="poster-k">${kicker}</span>
        <strong class="poster-name">${p.name}</strong>
        <span class="poster-meta">${p.category}</span>
      </div>
    </div>`;
  }

  return `<div class="poster">
    <span class="poster-k">${kicker}</span>
    <strong class="poster-name">${p.name}</strong>
    <span class="poster-rule" aria-hidden="true"></span>
    <span class="poster-meta">${p.category}</span>
    ${stack}
  </div>`;
}

export function initHero() {
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const K = RM ? 0 : 1;

  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

  const stage = $('stage');
  const frame = $('frame');
  const wm = $('wm');
  const cut = $<HTMLImageElement>('cut');
  const badge = $('badge');
  const badgeHit = $('badgeHit');
  const scriptEl = $('script');
  const screen = $('screen');
  const flash = $('flash');
  const screenHit = $('screenHit');

  const mWm = $('mWm');
  const mScript = $('mScript');
  const mBadge = $('mBadge');

  const t1 = $<HTMLButtonElement>('t1');
  const t2 = $<HTMLButtonElement>('t2');
  const t3 = $<HTMLAnchorElement>('t3');
  const t4 = $<HTMLAnchorElement>('t4');
  const logo = $<HTMLButtonElement>('logo');
  const hint = $('hint');
  const heroCopy = document.getElementById('heroCopy');
  const ticket = $('ticket');
  const ticketTitle = $('ticketTitle');
  const ticketRows = $('ticketRows');
  const desc = $('desc');
  const descKey = $('descKey');
  const descText = $('descText');
  const descNum = $('descNum');
  const prevBtn = $<HTMLButtonElement>('prevBtn');
  const nextBtn = $<HTMLButtonElement>('nextBtn');
  const caseMedia: HTMLElement[] = [$('v0'), $('v1'), $('v2'), $('v3')];

  // ---------------------------------------------------------------- content

  const { site, assets } = portfolio;

  cut.src = assets.cut;

  const badgePh = badge.querySelector<HTMLElement>('.ph');
  if (badgePh) badgePh.style.backgroundImage = 'url("' + assets.idPhoto + '")';

  const cardTitle = badge.querySelector<HTMLElement>('.card h4');
  if (cardTitle) cardTitle.innerHTML = site.badge.title.join('<br>');
  const cardYear = badge.querySelector<HTMLElement>('.card .yr');
  if (cardYear) cardYear.textContent = site.badge.year;
  const cardRole = badge.querySelector<HTMLElement>('.card .role');
  if (cardRole) cardRole.textContent = site.badge.role;

  const badgeRows = badge.querySelectorAll<HTMLElement>('.card .row');
  site.badge.rows.forEach((row, i) => {
    const el = badgeRows[i];
    if (!el) return;
    const label = el.querySelector('span');
    const value = el.querySelector('b');
    if (label) label.textContent = row.label;
    if (value) value.textContent = row.value;
  });

  const wmParts = site.watermark.split(' ');
  document.querySelectorAll('#wm text').forEach(node => {
    const lines = node.querySelectorAll('tspan');
    if (lines.length) {
      lines.forEach((line, i) => {
        line.textContent = wmParts[i] ?? '';
      });
    } else {
      node.textContent = site.watermark;
    }
  });
  document.querySelectorAll('#mWm text').forEach(node => {
    node.textContent = site.watermark;
  });

  scriptEl.textContent = site.script;
  mScript.textContent = site.script;

  t1.textContent = site.tags.about;
  t2.textContent = site.tags.work;
  t3.textContent = site.tags.awards;
  t4.textContent = site.tags.contact;
  logo.textContent = site.watermark;

  const hintText = hint.querySelector('span');
  if (hintText) hintText.textContent = site.hint;

  if (heroCopy) {
    const copyName = heroCopy.querySelector('.hc-name');
    if (copyName) copyName.textContent = site.name;
    const copyTitle = heroCopy.querySelector('.hc-title');
    if (copyTitle) copyTitle.textContent = site.title;
    const copyTag = heroCopy.querySelector('.hc-tag');
    if (copyTag) copyTag.textContent = site.heroTagline;
  }

  caseMedia.forEach((el, i) => {
    const p = featured[i];
    if (el && p) el.innerHTML = slideMarkup(p);
  });

  // Clone badge for mobile UI (after its content is filled in)
  const mBadgeInner = badge.cloneNode(true) as HTMLElement;
  mBadgeInner.removeAttribute('id');
  mBadgeInner.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  mBadge.appendChild(mBadgeInner);

  // ----------------------------------------------------------------- state

  let mode: 'hero' | 'case' = 'hero';
  let curCase = 0;
  let busy = false;
  let swayAnims: Animation[] = [];
  let wheelLockUntil = 0;

  function setBusy(v: boolean) {
    busy = v;
    document.body.classList.toggle('busy', v);
  }

  function clearAnims(el: Element | null) {
    if (!el || !el.getAnimations) return;
    el.getAnimations().forEach(a => a.cancel());
  }

  function isMobile() {
    return window.innerWidth <= 820;
  }

  function pose(m: 'hero' | 'case') {
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (W <= 820) {
      if (m === 'hero') {
        const s = Math.min(W / 650, (0.62 * H) / 810);
        return { s, x: W / 2 - 805 * s, y: H - 790 * s };
      }
      const navH = 0.022 * H + 42 + 22;
      const th = ticket.offsetHeight || 150;
      const dh = desc.offsetHeight || 60;
      const uiBottom = 62 + th + 18 + Math.max(60, dh) + 14;
      const s = Math.min((W - 28) / 905, Math.max(0.2, (H - navH - uiBottom) / (762 - 95)));
      return { s, x: W / 2 - 720 * s, y: H - navH - 762 * s };
    }
    const cover = Math.max(W / 1440, H / 810);
    const u = Math.min(W / 1440, H / 900);
    if (m === 'hero') {
      return { s: cover, x: (W - 1440 * cover) / 2, y: 0 };
    }
    const top = 66 * u;
    const fit = (H - top - 28 * u) / (762 - 79);
    let s: number;
    let y: number;
    if (fit >= cover) {
      s = cover;
      y = Math.min(0, Math.max(H - 810 * s, top - 79 * s));
    } else {
      s = fit;
      y = top - 79 * fit;
    }
    return { s, x: (W - 1440 * s) / 2, y };
  }

  function fitHero(p: { s: number; x: number; y: number }) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const vl = Math.max(0, -p.x / p.s);
    const vr = Math.min(1440, (W - p.x) / p.s);
    const pad = 18 / p.s;
    wm.style.left = (vl + 0.6 * pad) + 'px';
    wm.style.width = (vr - vl - 1.2 * pad) + 'px';
    badge.style.left = Math.min(986, vr - pad - 417) + 'px';
    const vb = Math.min(810, (H - p.y) / p.s);
    badge.style.top = Math.min(-165, vb - 56 / p.s - 935) + 'px';
    scriptEl.style.left = (vl + pad + (W <= 1200 ? 24 : 70)) + 'px';
  }

  function place(m: 'hero' | 'case') {
    const mob = isMobile();
    if (mob) {
      const mbw = mBadge.offsetWidth || window.innerWidth * 0.27;
      document.documentElement.style.setProperty('--mbs', String(mbw / 582));
      document.documentElement.style.setProperty('--th', (ticket.offsetHeight || 150) + 'px');
    }
    frame.classList.toggle('m-fade', mob);
    frame.classList.toggle('d-fade', !mob);
    const isCase = m === 'case';
    frame.classList.toggle('m-case', isCase);
    stage.classList.toggle('m-case', isCase);
    const p = pose(m);
    frame.style.transform = `translate(${p.x}px, ${p.y}px) scale(${p.s})`;
    if (!mob && m === 'hero') {
      fitHero(p);
    }
  }

  function fillCase(i: number) {
    const c = CASES[i];
    ticketTitle.textContent = c.title;
    const rowEls = ticketRows.children;
    for (let k = 0; k < 3; k++) {
      if (rowEls[k]) rowEls[k].textContent = c.rows[k];
    }
    descKey.textContent = c.key;
    descText.textContent = c.text;
    descNum.textContent = String(i + 1).padStart(2, '0') + ' / 0' + CASES.length;
    prevBtn.classList.toggle('dim', i === 0);
    if (isMobile()) {
      document.documentElement.style.setProperty('--th', (ticket.offsetHeight || 150) + 'px');
    }
  }

  function showOnly(i: number) {
    caseMedia.forEach((el, idx) => {
      if (!el) return;
      if (idx === i) {
        el.style.opacity = '1';
      } else {
        clearAnims(el);
        el.style.opacity = '0';
      }
    });
  }

  function stopSway() {
    swayAnims.forEach(a => a.cancel());
    swayAnims = [];
  }

  function startSway() {
    stopSway();
    if (RM || mode !== 'hero') return;
    [badge, mBadgeInner].forEach(el => {
      swayAnims.push(
        el.animate(
          [{ transform: 'rotate(-1.1deg)' }, { transform: 'rotate(1.1deg)' }],
          { duration: 3200, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
        )
      );
    });
  }

  function triggerSwing() {
    if (RM || mode !== 'hero' || busy) return;
    badge.animate(
      [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-6deg)' },
        { transform: 'rotate(4deg)' },
        { transform: 'rotate(-2deg)' },
        { transform: 'rotate(0deg)' }
      ],
      { duration: 1400, easing: 'ease-out', composite: 'add' }
    );
  }

  badgeHit.addEventListener('pointerenter', triggerSwing);

  function runEntrance() {
    if (document.documentElement.dataset.in) return;
    document.documentElement.dataset.in = '1';

    const preEls = document.querySelectorAll('.pre');
    if (RM) {
      preEls.forEach(el => el.classList.remove('pre'));
      hint.style.opacity = '1';
      if (heroCopy) heroCopy.style.opacity = '1';
      return;
    }

    const tags = [t1, t2, t3, t4];
    tags.forEach((el, i) => {
      el.classList.remove('pre');
      const a = el.animate(
        [
          { opacity: 0, transform: 'translateY(-40px) rotate(-4deg)' },
          { opacity: 1, transform: 'none' }
        ],
        { duration: 700, delay: 120 + i * 80, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'both' }
      );
      a.finished.then(() => { a.cancel(); }).catch(() => {});
    });

    [wm, mWm].forEach(el => {
      el.classList.remove('pre');
      const a = el.animate(
        [
          { opacity: 0, transform: 'translateY(60px)', clipPath: 'inset(100% 0 0 0)' },
          { opacity: 1, transform: 'none', clipPath: 'inset(0)' }
        ],
        { duration: 1100, delay: 260, easing: EASE_DEFAULT, fill: 'both' }
      );
      a.finished.then(() => { a.cancel(); }).catch(() => {});
    });

    [scriptEl, mScript].forEach(el => {
      el.classList.remove('pre');
      const a = el.animate(
        [
          { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
          { opacity: 1, clipPath: 'inset(0)' }
        ],
        { duration: 900, delay: 1050, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both' }
      );
      a.finished.then(() => { a.cancel(); }).catch(() => {});
    });

    [badge, mBadgeInner].forEach((el, idx) => {
      el.classList.remove('pre');
      const a = el.animate(
        [
          { offset: 0, opacity: 0, transform: 'translateY(-120%) rotate(8deg)' },
          { offset: 0.6, opacity: 1, transform: 'translateY(0) rotate(-3deg)' },
          { offset: 0.8, opacity: 1, transform: 'translateY(0) rotate(1.6deg)' },
          { offset: 1, opacity: 1, transform: 'translateY(0) rotate(0deg)' }
        ],
        { duration: 1500, delay: 700, easing: EASE_DEFAULT, fill: 'both' }
      );
      a.finished.then(() => {
        a.cancel();
        if (idx === 0 && mode === 'hero' && !busy) startSway();
      }).catch(() => {});
    });

    hint.classList.remove('pre');
    const ha = hint.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 600, delay: 1800, easing: EASE_DEFAULT, fill: 'both' }
    );
    ha.finished.then(() => { ha.cancel(); }).catch(() => {});

    if (heroCopy) {
      heroCopy.classList.remove('pre');
      const hc = heroCopy.animate(
        [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
        { duration: 800, delay: 1500, easing: EASE_DEFAULT, fill: 'both' }
      );
      hc.finished.then(() => { hc.cancel(); }).catch(() => {});
    }
  }

  function heroOut() {
    stopSway();
    [wm, mWm, scriptEl, mScript, badge, mBadgeInner].forEach(el => {
      clearAnims(el);
      el.classList.remove('pre');
    });
    if (RM) {
      [wm, mWm, scriptEl, mScript, badge, mBadgeInner].forEach(el => {
        el.style.opacity = '0';
      });
      return;
    }
    [wm, mWm].forEach(el => {
      el.animate(
        [
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(-40px)' }
        ],
        { duration: 380, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }
      );
    });
    [scriptEl, mScript].forEach(el => {
      el.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 380, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }
      );
    });
    [badge, mBadgeInner].forEach(el => {
      el.animate(
        [
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(-110%) rotate(-6deg)' }
        ],
        { duration: 380, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }
      );
    });
  }

  function heroIn() {
    [wm, mWm, scriptEl, mScript, badge, mBadgeInner].forEach(el => {
      clearAnims(el);
      el.classList.remove('pre');
      el.style.opacity = '1';
    });
    if (RM) return;

    [wm, mWm].forEach(el => {
      const a = el.animate(
        [
          { opacity: 0, transform: 'translateY(40px)' },
          { opacity: 1, transform: 'none' }
        ],
        { duration: 700, easing: EASE_DEFAULT, fill: 'both' }
      );
      a.finished.then(() => { a.cancel(); }).catch(() => {});
    });

    [scriptEl, mScript].forEach(el => {
      const a = el.animate(
        [
          { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
          { opacity: 1, clipPath: 'inset(0)' }
        ],
        { duration: 700, delay: 250, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both' }
      );
      a.finished.then(() => { a.cancel(); }).catch(() => {});
    });

    [badge, mBadgeInner].forEach((el, idx) => {
      const a = el.animate(
        [
          { offset: 0, opacity: 0, transform: 'translateY(-110%) rotate(6deg)' },
          { offset: 0.7, opacity: 1, transform: 'translateY(0) rotate(-2deg)' },
          { offset: 1, opacity: 1, transform: 'translateY(0) rotate(0deg)' }
        ],
        { duration: 1100, easing: EASE_DEFAULT, fill: 'both' }
      );
      a.finished.then(() => {
        a.cancel();
        if (idx === 0 && mode === 'hero') startSway();
      }).catch(() => {});
    });
  }

  function caseIn(i: number, first: boolean) {
    fillCase(i);
    clearAnims(ticket);
    const descChildren = Array.from(desc.children);
    descChildren.forEach(clearAnims);

    if (RM) {
      ticket.style.opacity = '1';
      descChildren.forEach(ch => { (ch as HTMLElement).style.opacity = '1'; });
      return;
    }

    const tDelay = first ? 150 : 0;
    ticket.style.opacity = '1';
    const ta = ticket.animate(
      [
        { offset: 0, opacity: 0, transform: 'translateY(-30px) rotate(-3deg)' },
        { offset: 0.78, opacity: 1, transform: 'translateY(3px) rotate(.6deg)' },
        { offset: 1, opacity: 1, transform: 'none' }
      ],
      { duration: 620, delay: tDelay, easing: EASE_DEFAULT, fill: 'both' }
    );
    ta.finished.then(() => { ta.cancel(); }).catch(() => {});

    const baseDelay = first ? 160 : 50;
    descChildren.forEach((ch, k) => {
      (ch as HTMLElement).style.opacity = '1';
      const da = ch.animate(
        [
          { opacity: 0, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'none' }
        ],
        { duration: 440, delay: baseDelay + k * 45, easing: EASE_DEFAULT, fill: 'both' }
      );
      da.finished.then(() => { da.cancel(); }).catch(() => {});
    });
  }

  function caseOut() {
    clearAnims(ticket);
    const descChildren = Array.from(desc.children);
    descChildren.forEach(clearAnims);

    if (RM) {
      ticket.style.opacity = '0';
      descChildren.forEach(ch => { (ch as HTMLElement).style.opacity = '0'; });
      return;
    }

    ticket.animate(
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateY(-40px) rotate(4deg)' }
      ],
      { duration: 380, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }
    );

    descChildren.forEach((ch, k) => {
      ch.animate(
        [
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(-10px)' }
        ],
        { duration: 300, delay: k * 40, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }
      );
    });
  }

  function arriveCase() {
    mode = 'case';
    document.body.classList.add('is-case');
    clearAnims(cut);
    cut.style.opacity = '0';

    curCase = 0;
    fillCase(0);
    clearAnims(screen);
    screen.style.opacity = '1';

    if (!RM) {
      flash.animate(
        [{ opacity: 0 }, { opacity: 0.14 }, { opacity: 0 }],
        { duration: 400, easing: 'ease-out' }
      );
      const va = caseMedia[0].animate(
        [
          { opacity: 0, transform: 'scale(1.02)' },
          { opacity: 1, transform: 'scale(1)' }
        ],
        { duration: 520, easing: EASE_DEFAULT, fill: 'both' }
      );
      va.finished.then(() => { va.cancel(); }).catch(() => {});
    }

    showOnly(0);
    caseIn(0, true);

    setTimeout(() => {
      setBusy(false);
      frame.classList.remove('glide');
    }, 700 * K);
  }

  function toCase() {
    if (busy || mode === 'case') return;
    setBusy(true);
    heroOut();

    setTimeout(() => {
      clearAnims(cut);
      place('case');

      if (RM) {
        cut.style.opacity = '0';
        arriveCase();
        return;
      }

      frame.style.setProperty('--glide', `${SCENE_GLIDE_SECONDS}s`);
      frame.classList.add('glide');
      const fa = cut.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 420, easing: 'ease-out', fill: 'forwards' }
      );
      fa.finished.then(() => { fa.cancel(); cut.style.opacity = '0'; arriveCase(); }).catch(() => arriveCase());
    }, 330 * K);
  }

  function swapTo(n: number) {
    if (busy || mode !== 'case') return;
    setBusy(true);

    const oldIdx = curCase;
    const direction = n >= curCase ? 1 : -1;
    const nextIdx = ((n % CASES.length) + CASES.length) % CASES.length;
    curCase = nextIdx;

    const oldMedia = caseMedia[oldIdx];
    const newMedia = caseMedia[nextIdx];

    caseOut();
    clearAnims(oldMedia);
    if (!RM) {
      oldMedia.animate(
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: `translateX(${-direction * 10}px)` }
        ],
        { duration: 200, easing: 'ease-out', fill: 'forwards' }
      );
    } else {
      oldMedia.style.opacity = '0';
    }

    setTimeout(() => {
      clearAnims(oldMedia);
      oldMedia.style.opacity = '0';

      clearAnims(newMedia);
      newMedia.style.opacity = '1';
      if (!RM) {
        const va = newMedia.animate(
          [
            { opacity: 0, transform: `translateX(${direction * 12}px) scale(1.01)` },
            { opacity: 1, transform: 'translateX(0) scale(1)' }
          ],
          { duration: 350, easing: EASE_DEFAULT, fill: 'both' }
        );
        va.finished.then(() => { va.cancel(); }).catch(() => {});
      }

      caseIn(nextIdx, false);

      setTimeout(() => {
        setBusy(false);
      }, 380 * K);
    }, 200 * K);
  }

  function toHero() {
    if (busy || mode === 'hero') return;
    setBusy(true);

    caseOut();
    caseMedia.forEach(el => { if (el) clearAnims(el); });

    clearAnims(screen);
    if (!RM) {
      const sa = screen.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
      sa.finished.then(() => { sa.cancel(); screen.style.opacity = '0'; }).catch(() => {});
    } else {
      screen.style.opacity = '0';
    }

    mode = 'hero';
    document.body.classList.remove('is-case');
    frame.style.setProperty('--glide', `${SCENE_GLIDE_SECONDS}s`);
    if (!RM) frame.classList.add('glide');
    place('hero');

    clearAnims(cut);

    if (RM) {
      cut.style.opacity = '1';
      heroIn();
      setBusy(false);
      return;
    }

    const ca = cut.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 700, delay: 150, easing: 'ease-out', fill: 'both' }
    );
    ca.finished.then(() => { ca.cancel(); cut.style.opacity = '1'; }).catch(() => {});

    setTimeout(() => {
      heroIn();
    }, 250);

    setTimeout(() => {
      frame.classList.remove('glide');
      setBusy(false);
    }, 700);
  }

  // ------------------------------------------------------------- bindings

  t1.addEventListener('click', () => openSheet('about'));
  logo.addEventListener('click', () => toHero());
  t2.addEventListener('click', () => {
    if (mode === 'hero') toCase();
  });
  t3.addEventListener('click', e => {
    e.preventDefault();
    openSheet('awards');
  });
  t4.addEventListener('click', e => {
    e.preventDefault();
    openSheet('contact');
  });

  screenHit.addEventListener('click', () => swapTo(curCase + 1));
  screenHit.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      swapTo(curCase + 1);
    }
  });

  nextBtn.addEventListener('click', () => swapTo(curCase + 1));
  prevBtn.addEventListener('click', () => {
    if (curCase === 0) toHero();
    else swapTo(curCase - 1);
  });

  // Wheel
  window.addEventListener('wheel', e => {
    if (isSheetOpen()) return;
    e.preventDefault();
    const now = performance.now();
    if (busy || now < wheelLockUntil) return;
    if (Math.abs(e.deltaY) < 18) return;
    wheelLockUntil = now + 900;
    if (e.deltaY > 0) {
      if (mode === 'hero') toCase();
      else swapTo(curCase + 1);
    } else {
      if (mode === 'case') {
        if (curCase === 0) toHero();
        else swapTo(curCase - 1);
      }
    }
  }, { passive: false });

  // Touch
  let tx = 0;
  let ty = 0;
  window.addEventListener('touchstart', e => {
    if (isSheetOpen()) return;
    if (e.touches.length !== 1) return;
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (isSheetOpen()) return;
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchend', e => {
    if (isSheetOpen()) return;
    if (busy || e.changedTouches.length !== 1) return;
    const dx = tx - e.changedTouches[0].clientX;
    const dy = ty - e.changedTouches[0].clientY;
    if (mode === 'hero') {
      if (dy >= 40 && Math.abs(dy) >= Math.abs(dx)) toCase();
      return;
    }
    if (Math.abs(dy) >= Math.abs(dx)) {
      if (dy >= 40) swapTo(curCase + 1);
      else if (dy <= -40) {
        if (curCase === 0) toHero();
        else swapTo(curCase - 1);
      }
    } else {
      if (dx >= 40) swapTo(curCase + 1);
      else if (dx <= -40) {
        if (curCase === 0) toHero();
        else swapTo(curCase - 1);
      }
    }
  }, { passive: true });

  // Keyboard
  window.addEventListener('keydown', e => {
    if (isSheetOpen()) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'BUTTON' || target.tagName === 'A' || target === screenHit) && e.key === 'Enter') {
      return;
    }
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      if (busy) return;
      if (mode === 'hero') toCase();
      else swapTo(curCase + 1);
    } else if (e.key === 'ArrowRight') {
      if (busy || mode !== 'case') return;
      e.preventDefault();
      swapTo(curCase + 1);
    } else if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key)) {
      if (mode !== 'case') return;
      e.preventDefault();
      if (busy) return;
      if (curCase === 0) toHero();
      else swapTo(curCase - 1);
    }
  });

  // Resize
  window.addEventListener('resize', () => {
    frame.classList.remove('glide');
    place(mode);
  });

  // ---------------------------------------------------------------- clouds
  // Slow pointer parallax gives the three cloud planes a believable sense of
  // distance without moving the composition or fighting the CSS drift.
  const parallaxLayers = [
    { el: document.querySelector<HTMLElement>('.cloud-back .cloud-parallax'), depth: 5 },
    { el: document.querySelector<HTMLElement>('.cloud-mid .cloud-parallax'), depth: 8 },
    { el: document.querySelector<HTMLElement>('.cloud-front .cloud-parallax'), depth: 12 },
  ].filter((l): l is { el: HTMLElement; depth: number } => l.el !== null);

  let pTargetX = 0;
  let pTargetY = 0;
  let pX = 0;
  let pY = 0;
  let pRaf = 0;

  function renderParallax(): void {
    pX += (pTargetX - pX) * 0.055;
    pY += (pTargetY - pY) * 0.055;

    for (const layer of parallaxLayers) {
      const x = pX * layer.depth;
      const y = pY * layer.depth * 0.62;
      layer.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    }

    if (Math.abs(pTargetX - pX) > 0.001 || Math.abs(pTargetY - pY) > 0.001) {
      pRaf = requestAnimationFrame(renderParallax);
    } else {
      pRaf = 0;
    }
  }

  function onCloudPointerMove(e: PointerEvent): void {
    if (RM || e.pointerType !== 'mouse' || isSheetOpen()) return;
    pTargetX = (e.clientX / window.innerWidth - 0.5) * 2;
    pTargetY = (e.clientY / window.innerHeight - 0.5) * 2;
    if (!pRaf) pRaf = requestAnimationFrame(renderParallax);
  }

  function resetCloudParallax(): void {
    pTargetX = 0;
    pTargetY = 0;
    if (!pRaf) pRaf = requestAnimationFrame(renderParallax);
  }

  window.addEventListener('pointermove', onCloudPointerMove, { passive: true });
  document.addEventListener('pointerleave', resetCloudParallax);

  // Init
  fillCase(0);
  place('hero');

  const cutReady = cut.complete
    ? Promise.resolve()
    : new Promise<void>(res => {
        cut.addEventListener('load', () => res(), { once: true });
        cut.addEventListener('error', () => res(), { once: true });
      });

  const gate = Promise.all([document.fonts.ready, cutReady]);
  const cap = new Promise<void>(res => setTimeout(res, 2500));
  Promise.race([gate, cap]).then(() => requestAnimationFrame(runEntrance));
  setTimeout(() => requestAnimationFrame(runEntrance), 4000);
}
