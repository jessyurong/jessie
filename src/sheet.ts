import { portfolio, type Activity, type Award, type Project } from './data/portfolio';

type SectionId =
  | 'about'
  | 'experience'
  | 'work'
  | 'skills'
  | 'awards'
  | 'community'
  | 'creative'
  | 'contact';

const NAV: { id: SectionId; label: string }[] = [
  { id: 'about', label: 'about' },
  { id: 'experience', label: 'experience' },
  { id: 'work', label: 'work' },
  { id: 'skills', label: 'skills' },
  { id: 'awards', label: 'awards' },
  { id: 'community', label: 'community' },
  { id: 'creative', label: 'creative' },
  { id: 'contact', label: 'contact' },
];

let sheet: HTMLElement | null = null;
let bar: HTMLElement | null = null;
let sheetBody: HTMLElement | null = null;
let lastFocus: HTMLElement | null = null;
let activeId: SectionId | null = null;
let scroller = false;

function head(num: string, kicker: string, title: string, lead?: string): string {
  return `<header class="sec-head">
    <span class="sec-kicker">// ${num} — ${kicker}</span>
    <h2 class="sec-title">${title}</h2>
    ${lead ? `<p class="sec-lead">${lead}</p>` : ''}
  </header>`;
}

function chips(items: string[]): string {
  if (!items.length) return '';
  return `<div class="chips">${items.map(i => `<span class="chip">${i}</span>`).join('')}</div>`;
}

function workCard(p: Project, index: number): string {
  const links: string[] = [];
  if (p.liveUrl) links.push(`<a class="card-link" href="${p.liveUrl}" target="_blank" rel="noreferrer">live site</a>`);
  if (p.repoUrl) links.push(`<a class="card-link" href="${p.repoUrl}" target="_blank" rel="noreferrer">github</a>`);

  return `<article class="paper work-card${p.flagship ? ' flagship' : ''}">
    <div class="work-top">
      <span class="work-index">${String(index + 1).padStart(2, '0')}</span>
      ${p.flagship ? '<span class="work-flag">flagship</span>' : ''}
    </div>
    <h3 class="work-name">${p.name}</h3>
    <p class="work-meta">${p.category} · ${p.year}</p>
    <p class="work-desc">${p.description}</p>
    ${chips(p.stack)}
    ${links.length ? `<div class="work-links">${links.join('')}</div>` : ''}
  </article>`;
}

function activityItem(item: Activity): string {
  return `<li class="activity">
    <h3 class="activity-title">${item.title}</h3>
    <p class="activity-desc">${item.description}</p>
  </li>`;
}

function awardItem(a: Award): string {
  return `<li class="award">
    ${a.thumb ? `<img class="award-thumb" src="${a.thumb}" alt="" loading="lazy" />` : ''}
    <div class="award-main">
      <h3 class="award-title">${a.title}</h3>
      <p class="award-detail">${a.detail}</p>
    </div>
    <span class="award-date">${a.date}</span>
  </li>`;
}

function buildMarkup(): string {
  const { site, about, experience, projects, skills, awards, community, creative, contact } = portfolio;

  return `<div class="sheet-bar">
    <button type="button" class="pill pill-close" id="sheetClose">
      <span aria-hidden="true">←</span> back to hero
    </button>
    <nav class="snav" aria-label="Sections">
      ${NAV.map(n => `<button type="button" class="pill snav-link" data-target="${n.id}">${n.label}</button>`).join('')}
    </nav>
  </div>

  <div class="sheet-body">
    <section class="sec" id="about">
      ${head('01', 'about', 'About', site.tagline)}
      <div class="about-grid">
        <div class="paper about-copy">
          ${about.paragraphs.map(p => `<p>${p}</p>`).join('')}
          <button type="button" class="pill pill-solid" data-target="contact">start a conversation</button>
        </div>
        <dl class="paper facts">
          ${about.facts
            .map(f => `<div class="fact"><dt>${f.label}</dt><dd>${f.value}</dd></div>`)
            .join('')}
        </dl>
      </div>
    </section>

    <section class="sec" id="experience">
      ${head('02', 'experience', 'Experience')}
      <ol class="rows-list">
        ${experience
          .map(
            e => `<li class="row-item">
              <div class="row-main">
                <h3 class="row-title">${e.role}</h3>
                <p class="row-sub">${e.org}</p>
                <p class="row-desc">${e.description}</p>
              </div>
              <span class="row-side">${e.period}</span>
            </li>`
          )
          .join('')}
      </ol>
    </section>

    <section class="sec" id="work">
      ${head(
        '03',
        'work',
        'Projects',
        'Client work, school projects, and personal tools. The first three are featured in the case showcase.'
      )}
      <div class="work-grid">
        ${projects.map((p, i) => workCard(p, i)).join('')}
      </div>
    </section>

    <section class="sec" id="skills">
      ${head('04', 'skills', 'Skills')}
      <div class="skill-grid">
        ${skills
          .map(
            s => `<div class="paper skill-card">
              <h3 class="skill-group">${s.group}</h3>
              ${chips(s.items)}
            </div>`
          )
          .join('')}
      </div>
    </section>

    <section class="sec" id="awards">
      ${head('05', 'awards', 'Awards', 'Newest first.')}
      <ul class="awards-list">
        ${awards.map(awardItem).join('')}
      </ul>
    </section>

    <section class="sec" id="community">
      ${head('06', 'community', 'Community and leadership')}
      <ul class="activity-list">
        ${community.map(activityItem).join('')}
      </ul>
    </section>

    <section class="sec" id="creative">
      ${head('07', 'creative', 'Creative work')}
      <ul class="activity-list">
        ${creative.map(activityItem).join('')}
      </ul>
    </section>

    <section class="sec" id="contact">
      ${head(
        '08',
        'contact',
        'Contact',
        'Open to freelance work, part-time roles, and collaborations.'
      )}
      <div class="paper contact-card">
        ${contact
          .map(
            c => `<a class="c-row" href="${c.href}"${c.href.startsWith('http') ? ' target="_blank" rel="noreferrer"' : ''}>
              <span class="c-label">${c.label}</span>
              <span class="c-value">${c.value}</span>
              <span class="c-arrow" aria-hidden="true">↗</span>
            </a>`
          )
          .join('')}
      </div>
      <p class="sheet-foot">© ${site.year} ${site.name} · ${site.location}</p>
    </section>
  </div>`;
}

export function isSheetOpen(): boolean {
  return document.body.classList.contains('sheet-open');
}

function sectionEl(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function setActive(id: string | null) {
  if (!sheet || id === activeId) return;
  activeId = id as SectionId | null;
  sheet.querySelectorAll<HTMLElement>('.snav-link').forEach(el => {
    el.setAttribute('aria-current', el.dataset.target === id ? 'true' : 'false');
  });
}

function scrollToSection(id: string, smooth = true) {
  if (!sheet || !bar) return;
  const el = sectionEl(id);
  if (!el) return;
  const top = Math.max(0, el.offsetTop - bar.offsetHeight - 12);
  sheet.scrollTo({ top, behavior: smooth && !prefersReduced() ? 'smooth' : 'auto' });
  setActive(id);
}

function prefersReduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function onScroll() {
  if (!sheet || !bar) return;
  if (scroller) return;
  scroller = true;
  requestAnimationFrame(() => {
    scroller = false;
    if (!sheet || !bar) return;
    const line = sheet.scrollTop + bar.offsetHeight + 24;
    let current: string | null = null;
    for (const n of NAV) {
      const el = sectionEl(n.id);
      if (el && el.offsetTop <= line) current = n.id;
    }
    setActive(current);
  });
}

export function openSheet(id?: string) {
  if (!sheet || !sheetBody) return;
  const target = id && sectionEl(id) ? id : null;
  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.body.classList.add('sheet-open');
  sheet.setAttribute('aria-hidden', 'false');
  sheet.focus({ preventScroll: true });

  if (target) {
    scrollToSection(target);
    history.replaceState(null, '', '#' + target);
  } else {
    sheet.scrollTo({ top: 0, behavior: 'auto' });
    setActive('about');
    history.replaceState(null, '', location.pathname + location.search);
  }
}

export function closeSheet() {
  if (!sheet || !sheetBody) return;
  document.body.classList.remove('sheet-open');
  sheet.setAttribute('aria-hidden', 'true');
  setActive(null);
  history.replaceState(null, '', location.pathname + location.search);
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  lastFocus = null;
}

export function initSheet() {
  sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.id = 'sheet';
  sheet.tabIndex = -1;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', `${portfolio.site.name} — portfolio details`);
  sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML = buildMarkup();
  document.body.appendChild(sheet);

  bar = sheet.querySelector<HTMLElement>('.sheet-bar');
  sheetBody = sheet.querySelector<HTMLElement>('.sheet-body');

  const closeBtn = document.getElementById('sheetClose');
  if (closeBtn) closeBtn.addEventListener('click', closeSheet);

  sheet.querySelectorAll<HTMLElement>('[data-target]').forEach(el => {
    el.addEventListener('click', () => {
      const target = el.dataset.target;
      if (!target) return;
      if (isSheetOpen()) {
        scrollToSection(target);
        history.replaceState(null, '', '#' + target);
      } else {
        openSheet(target);
      }
    });
  });

  sheet.addEventListener('scroll', onScroll, { passive: true });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isSheetOpen()) {
      e.preventDefault();
      closeSheet();
    }
  });

  window.addEventListener('hashchange', () => {
    const id = location.hash.replace('#', '');
    if (!id) {
      if (isSheetOpen()) closeSheet();
      return;
    }
    if (sectionEl(id)) openSheet(id);
  });

  const initial = location.hash.replace('#', '');
  if (initial && sectionEl(initial)) {
    requestAnimationFrame(() => openSheet(initial));
  }
}
