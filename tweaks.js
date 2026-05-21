/* ============================================================
   ENNEF — Premium interactions + Tweaks panel
   ============================================================ */
(function () {
  'use strict';

  // ---------- DEFAULTS (must match window.TWEAK_DEFAULTS) ----------
  const FALLBACK = {
    accent: '#7C5CBF',
    bgStyle: 'mesh',
    motion: 'lively',
    shapes: true,
    cursor: true,
  };
  const TWEAKS = Object.assign({}, FALLBACK, window.TWEAK_DEFAULTS || {});

  // ---------- ACCENT COLOR MAP ----------
  const ACCENTS = {
    '#7C5CBF': { name: 'Purple', hex: '#7C5CBF', dark: '#6245A8', soft: '#EFE9F8' },
    '#E25B3A': { name: 'Coral',  hex: '#E25B3A', dark: '#C44A2C', soft: '#FAE9E2' },
    '#5B6CE2': { name: 'Indigo', hex: '#5B6CE2', dark: '#4A5BC4', soft: '#E2E5FA' },
    '#2E8B6B': { name: 'Emerald',hex: '#2E8B6B', dark: '#246E55', soft: '#DFEFE8' },
  };
  function hexToRgb(h) {
    const c = h.replace('#','');
    return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)];
  }

  // ---------- APPLY TWEAKS ----------
  function applyTweaks(t) {
    const a = ACCENTS[t.accent] || ACCENTS['#E25B3A'];
    const root = document.documentElement;
    const [r,g,b] = hexToRgb(a.hex);
    root.style.setProperty('--accent', a.hex);
    root.style.setProperty('--accent-2', a.dark);
    root.style.setProperty('--accent-3', a.soft);
    root.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.40)`);

    const scale = t.motion === 'subtle' ? 0.45 : (t.motion === 'balanced' ? 0.8 : 1.2);
    root.style.setProperty('--motion-scale', String(scale));

    document.body.setAttribute('data-bg', t.bgStyle);
    document.body.setAttribute('data-shapes', t.shapes ? 'on' : 'off');

    // motion: reduce floating amplitude
    document.body.classList.toggle('motion-subtle', t.motion === 'subtle');
  }

  // ---------- PERSIST ----------
  function persistTweak(key, value) {
    TWEAKS[key] = value;
    try { localStorage.setItem('ennef.tweaks', JSON.stringify(TWEAKS)); } catch(e){}
    try {
      window.parent.postMessage({
        type: '__edit_mode_set_keys',
        edits: { [key]: value }
      }, '*');
    } catch(e){}
  }

  // ---------- PANEL UI ----------
  let panel, fab;
  function buildPanel() {
    fab = document.createElement('button');
    fab.className = 'tweaks-fab';
    fab.setAttribute('aria-label', 'Open tweaks');
    fab.innerHTML = '<span class="knob"></span><span>Tweaks</span>';
    document.body.appendChild(fab);

    panel = document.createElement('div');
    panel.className = 'tweaks-panel';
    panel.innerHTML = `
      <div class="tweaks-head">
        <div class="tweaks-title">Customize</div>
        <button class="tweaks-close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>

      <div class="tweak">
        <div class="tweak-label">Accent color</div>
        <div class="tweak-swatches" data-key="accent">
          ${Object.entries(ACCENTS).map(([hex,a]) => `
            <button class="tweak-swatch" data-val="${hex}" title="${a.name}">
              <span class="fill" style="background:${hex}"></span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="tweak">
        <div class="tweak-label">Hero background</div>
        <div class="tweak-pills" data-key="bgStyle">
          <button class="tweak-pill" data-val="mesh">Mesh</button>
          <button class="tweak-pill" data-val="aurora">Aurora</button>
          <button class="tweak-pill" data-val="grid">Grid</button>
        </div>
      </div>

      <div class="tweak">
        <div class="tweak-label">Motion intensity</div>
        <div class="tweak-pills" data-key="motion">
          <button class="tweak-pill" data-val="subtle">Subtle</button>
          <button class="tweak-pill" data-val="balanced">Balanced</button>
          <button class="tweak-pill" data-val="lively">Lively</button>
        </div>
      </div>

      <div class="tweak tweak-row">
        <div class="tweak-label">Floating shapes</div>
        <button class="tweak-switch" data-key="shapes" aria-label="Toggle floating shapes"></button>
      </div>

      <div class="tweak tweak-row">
        <div class="tweak-label">Cursor accent</div>
        <button class="tweak-switch" data-key="cursor" aria-label="Toggle cursor accent"></button>
      </div>

      <div class="tweaks-note">Changes apply live and persist as you tweak. Toggle the Tweaks button in the toolbar to hide.</div>
    `;
    document.body.appendChild(panel);

    // Listeners
    fab.addEventListener('click', () => panel.classList.toggle('open'));
    panel.querySelector('.tweaks-close').addEventListener('click', () => {
      panel.classList.remove('open');
    });

    // Swatches
    panel.querySelectorAll('.tweak-swatches').forEach(group => {
      const key = group.dataset.key;
      group.querySelectorAll('.tweak-swatch').forEach(b => {
        b.addEventListener('click', () => {
          persistTweak(key, b.dataset.val);
          applyTweaks(TWEAKS);
          syncPanel();
        });
      });
    });
    // Pills
    panel.querySelectorAll('.tweak-pills').forEach(group => {
      const key = group.dataset.key;
      group.querySelectorAll('.tweak-pill').forEach(b => {
        b.addEventListener('click', () => {
          persistTweak(key, b.dataset.val);
          applyTweaks(TWEAKS);
          syncPanel();
        });
      });
    });
    // Switches
    panel.querySelectorAll('.tweak-switch').forEach(sw => {
      const key = sw.dataset.key;
      sw.addEventListener('click', () => {
        persistTweak(key, !TWEAKS[key]);
        applyTweaks(TWEAKS);
        syncPanel();
      });
    });

    syncPanel();
  }
  function syncPanel() {
    if (!panel) return;
    panel.querySelectorAll('.tweak-swatch').forEach(b => {
      b.classList.toggle('active', b.dataset.val === TWEAKS.accent);
    });
    panel.querySelectorAll('.tweak-pill').forEach(b => {
      const k = b.parentElement.dataset.key;
      b.classList.toggle('active', b.dataset.val === TWEAKS[k]);
    });
    panel.querySelectorAll('.tweak-switch').forEach(sw => {
      sw.classList.toggle('on', !!TWEAKS[sw.dataset.key]);
    });
  }

  // ---------- HOST PROTOCOL ----------
  function registerEditMode() {
    window.addEventListener('message', (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode')   fab && fab.classList.add('active');
      if (d.type === '__deactivate_edit_mode') {
        fab && fab.classList.remove('active');
        panel && panel.classList.remove('open');
      }
    });
    try {
      window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    } catch(e){}
  }

  // ---------- SCROLL PROGRESS ----------
  function scrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    const update = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      bar.style.width = pct + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ---------- COUNT UP ----------
  function setupCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const dur = 1500;
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const v = target * eased;
          el.textContent = (Number.isInteger(target) ? Math.round(v) : v.toFixed(1)) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => io.observe(c));
  }

  // ---------- MAGNETIC BUTTONS ----------
  function magneticButtons() {
    const btns = document.querySelectorAll('.btn-primary, .btn-ink, .form-submit, .price-btn');
    btns.forEach(b => {
      let raf;
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          b.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
        });
      });
      b.addEventListener('mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        b.style.transform = '';
      });
    });
  }

  // ---------- 3D TILT (subtle) ----------
  function tiltCards() {
    if (matchMedia('(hover: none)').matches) return;
    const cards = document.querySelectorAll('.srv-card, .ben-card, .price-card, .testim-card, .prod-card');
    cards.forEach(card => {
      let raf;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform = `perspective(900px) rotateX(${-py * 3}deg) rotateY(${px * 3}deg) translateY(-3px)`;
        });
      });
      card.addEventListener('mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = '';
      });
    });
  }

  // ---------- CURSOR ACCENT (light spotlight) ----------
  let cursorEl;
  function cursorAccent() {
    if (matchMedia('(hover: none)').matches) return;
    cursorEl = document.createElement('div');
    Object.assign(cursorEl.style, {
      position: 'fixed', top: 0, left: 0,
      width: '320px', height: '320px',
      borderRadius: '50%',
      pointerEvents: 'none',
      transform: 'translate(-50%,-50%)',
      background: 'radial-gradient(circle, var(--accent-glow), transparent 65%)',
      mixBlendMode: 'plus-lighter',
      zIndex: '2',
      transition: 'opacity .3s',
      opacity: '0',
    });
    document.body.appendChild(cursorEl);
    let tx = 0, ty = 0, cx = 0, cy = 0, raf;
    document.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (TWEAKS.cursor) cursorEl.style.opacity = '.55';
    });
    document.addEventListener('mouseleave', () => { cursorEl.style.opacity = '0'; });
    const loop = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      cursorEl.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  function syncCursor() {
    if (!cursorEl) return;
    if (!TWEAKS.cursor) cursorEl.style.opacity = '0';
  }

  // ---------- HERO STATS ROTATING DATA ----------
  function rotateHeroData() {
    const stat = document.querySelector('.hv-card-2 .hv-num');
    const delta = document.querySelector('.hv-card-2 .hv-sub');
    if (!stat || !delta) return;
    const samples = [
      ['42,580', '+18%'],
      ['38,420', '+12%'],
      ['46,180', '+22%'],
      ['41,200', '+14%'],
    ];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % samples.length;
      const [v, d] = samples[i];
      stat.style.transition = 'opacity .4s';
      stat.style.opacity = '0';
      delta.style.opacity = '0';
      setTimeout(() => {
        stat.textContent = v;
        const dataIndex = document.querySelector('[data-i18n="hv-card2-s"]');
        const isEs = document.documentElement.lang !== 'en';
        delta.textContent = (isEs ? d + ' vs ayer' : d + ' vs yesterday');
        stat.style.opacity = '1';
        delta.style.opacity = '1';
      }, 400);
    }, 4500);
  }

  // ---------- INIT ----------
  function init() {
    // Load saved tweaks from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('ennef.tweaks') || 'null');
      if (saved) Object.assign(TWEAKS, saved);
    } catch(e){}

    applyTweaks(TWEAKS);
    buildPanel();
    registerEditMode();
    scrollProgress();
    setupCounters();
    magneticButtons();
    tiltCards();
    cursorAccent();
    rotateHeroData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
