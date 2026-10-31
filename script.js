(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav: hairline on scroll ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Nav: mobile menu ---------- */
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    links.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Nav: active section ---------- */
  const navAnchors = [...links.querySelectorAll('a')];
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navAnchors.forEach((a) => a.classList.toggle('is-active', a.hash === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navAnchors.forEach((a) => {
    const target = document.querySelector(a.hash);
    if (target) sectionObserver.observe(target);
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // stagger siblings in the same group
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        const i = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(i * 70, 420) + 'ms';
        el.classList.add('is-visible');
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Count-up numbers ---------- */
  const counters = document.querySelectorAll('.count');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const to = Number(el.dataset.to);
      countObserver.unobserve(el);
      if (reduceMotion || to === 0) { el.textContent = to; return; }
      const start = performance.now();
      const dur = 900;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => countObserver.observe(c));

  /* ---------- Process scroller ---------- */
  const scroller = document.getElementById('steps');
  const prev = document.querySelector('[data-scroll="-1"]');
  const next = document.querySelector('[data-scroll="1"]');
  const stepWidth = () => {
    const step = scroller.querySelector('.step');
    return step ? step.getBoundingClientRect().width + 20 : 360;
  };
  const updateArrows = () => {
    const max = scroller.scrollWidth - scroller.clientWidth - 2;
    prev.disabled = scroller.scrollLeft <= 2;
    next.disabled = scroller.scrollLeft >= max;
  };
  [prev, next].forEach((btn) => btn.addEventListener('click', () => {
    scroller.scrollBy({ left: Number(btn.dataset.scroll) * stepWidth(), behavior: reduceMotion ? 'auto' : 'smooth' });
  }));
  scroller.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();

  /* ---------- Taste segmented control ---------- */
  const variants = {
    blagi: {
      name: 'Благи айвар',
      desc: 'Мягкий и&nbsp;сладкий. Классика, с&nbsp;которой знакомятся с&nbsp;айваром: чистый вкус печёного перца, лёгкий дымок и&nbsp;бархатная текстура.',
      pair: 'тёплой лепиней и&nbsp;каймаком',
      meters: { sweet: 85, smoke: 55, heat: 8, body: 70 }
    },
    ljuti: {
      name: 'Љути айвар',
      desc: 'Острый характер юга Сербии. К&nbsp;сладкому перцу добавляют жгучий — вкус становится смелым, а&nbsp;послевкусие долгим и&nbsp;тёплым.',
      pair: 'чевапи и&nbsp;плескавицей с&nbsp;гриля',
      meters: { sweet: 60, smoke: 65, heat: 80, body: 70 }
    },
    plavi: {
      name: 'С баклажаном',
      desc: 'Баклажан делает айвар нежнее и&nbsp;плотнее, добавляя сливочную мягкость и&nbsp;едва заметную горчинку. Особенно любим в&nbsp;домашних рецептах.',
      pair: 'брынзой и&nbsp;кукурузной прой',
      meters: { sweet: 65, smoke: 70, heat: 15, body: 90 }
    }
  };

  const tabs = [...document.querySelectorAll('.segmented [role="tab"]')];
  const thumb = document.querySelector('.segmented__thumb');
  const panel = document.getElementById('taste-panel');
  const copy = panel.querySelector('.taste__copy');
  const nameEl = document.getElementById('taste-name');
  const descEl = document.getElementById('taste-desc');
  const pairEl = document.getElementById('taste-pair');
  const fills = [...panel.querySelectorAll('.meter__fill')];
  let metersShown = false;

  const renderMeters = (key) => {
    const m = variants[key].meters;
    fills.forEach((f) => { f.style.width = m[f.dataset.key] + '%'; });
  };

  const selectVariant = (tab, focus) => {
    const key = tab.dataset.variant;
    const index = tabs.indexOf(tab);
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tab.focus();
    thumb.style.transform = `translateX(${index * 100}%)`;
    panel.setAttribute('aria-labelledby', tab.id);

    const v = variants[key];
    const apply = () => {
      nameEl.textContent = v.name;
      descEl.innerHTML = v.desc;
      pairEl.innerHTML = v.pair;
      copy.classList.remove('is-changing');
    };
    if (reduceMotion) apply();
    else { copy.classList.add('is-changing'); setTimeout(apply, 220); }
    if (metersShown) renderMeters(key);
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectVariant(tab, false));
    tab.addEventListener('keydown', (e) => {
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); selectVariant(tabs[j], true); }
    });
  });

  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) {
      metersShown = true;
      const current = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
      renderMeters(current.dataset.variant);
      obs.disconnect();
    }
  }, { threshold: 0.4 }).observe(panel);

  /* ---------- Recipe calculator ---------- */
  const MIN = 1, MAX = 30;
  let kg = 5;
  const kgEl = document.getElementById('kg');
  const minus = document.getElementById('kg-minus');
  const plus = document.getElementById('kg-plus');
  const jarsEl = document.getElementById('jars');
  const jarsLabel = document.getElementById('jars-label');
  const rows = [...document.querySelectorAll('#ingredient-list [data-per]')];

  const plural = (n, one, few, many) => {
    const n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
    return many;
  };
  const num = (n) => n.toLocaleString('ru-RU', { maximumFractionDigits: 1 });

  const format = (value, unit) => {
    if (unit === 'g') return value >= 1000 ? `${num(value / 1000)} кг` : `${num(Math.round(value))} г`;
    if (unit === 'ml') return value >= 1000 ? `${num(value / 1000)} л` : `${num(Math.round(value / 10) * 10)} мл`;
    if (unit === 'pcs') {
      const n = Math.max(1, Math.round(value));
      return `${n} ${plural(n, 'зубчик', 'зубчика', 'зубчиков')}`;
    }
    return String(value);
  };

  const renderRecipe = () => {
    kgEl.textContent = kg;
    rows.forEach((r) => { r.textContent = format(Number(r.dataset.per) * kg, r.dataset.unit); });
    // ≈ 370 ml of finished ajvar per kg of raw peppers
    const jars = Math.max(1, Math.round(kg * 0.95));
    jarsEl.textContent = jars;
    jarsLabel.innerHTML = `${plural(jars, 'банка', 'банки', 'банок')} по&nbsp;370&nbsp;мл`;
    minus.disabled = kg <= MIN;
    plus.disabled = kg >= MAX;
  };
  minus.addEventListener('click', () => { if (kg > MIN) { kg--; renderRecipe(); } });
  plus.addEventListener('click', () => { if (kg < MAX) { kg++; renderRecipe(); } });
  renderRecipe();
})();
