const BaseLogic = (typeof DCLogic !== 'undefined' ? DCLogic : (typeof window !== 'undefined' && window.DCLogic ? window.DCLogic : class {}));

/* Devuelve un callback `ref` que inyecta el SVG del ícono en el nodo destino.
   Se usa `ref` y no `dangerouslySetInnerHTML` porque React exige un objeto
   `{__html}` y rechaza una cadena suelta (Error #61). */
const I = (d, w = 2) => {
  const html = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  return el => { if (el && el.innerHTML !== html) el.innerHTML = html; };
};

/* Siluetas del tangram: 7 piezas x 4 vértices por figura. */
const TG = {
  fig1: [[[16.8,113.7],[118.2,92.8],[89.6,151.3],[89.6,151.3]],[[118.2,92.8],[183.2,135.8],[89.6,151.3],[89.6,151.3]],[[27.2,70.8],[120.8,52],[76.6,22.6],[76.6,22.6]],[[32.4,121.5],[79.2,146.2],[24.6,166.9],[24.6,166.9]],[[120.8,146.2],[159.8,139.7],[157.2,177.4],[157.2,177.4]],[[35,109.8],[74,102],[66.2,62.9],[27.2,70.8]],[[79.2,60.4],[133.8,60.4],[154.6,81.2],[100,81.2]]],
  fig2: [[[40,100],[100,100],[100,160],[100,160]],[[100,100],[160,100],[100,160],[100,160]],[[100,100],[160,100],[130,70],[130,70]],[[40,100],[70,100],[70,70],[70,70]],[[70,100],[70,70],[100,70],[100,70]],[[85,70],[115,70],[115,40],[85,40]],[[70,100],[100,100],[130,70],[100,70]]],
  fig3: [[[87,54.5],[136.4,54.5],[63.6,79.2],[63.6,79.2]],[[63.6,79.2],[136.4,54.5],[180.6,90.9],[180.6,90.9]],[[110.4,83.9],[180.6,90.9],[152,116.9],[136.4,116.9]],[[136.4,116.9],[152,116.9],[152,145.5],[152,145.5]],[[136.4,116.9],[152,145.5],[128.6,145.5],[128.6,145.5]],[[76.6,80.5],[110.4,83.9],[66.2,122.1],[50.6,122.1]],[[42.8,54.5],[87,54.5],[63.6,79.2],[19.4,79.2]]]
};
const TG_SEQ = ['fig1', 'fig2', 'fig3'];
const TG_MORPH = 900;  /* duración del morphing entre siluetas */
const TG_STEP = 1250;  /* morphing + pausa estática */

/* cubic-bezier(.4, 0, .2, 1) resuelto por Newton-Raphson. */
const tgEase = (() => {
  const cx = 1.2, bx = 3 * (0.2 - 0.4) - cx, ax = 1 - cx - bx, cy = 0, by = 3, ay = -2;
  const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = X(t) - x;
      if (Math.abs(e) < 1e-5) break;
      const d = dX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return Y(t);
  };
})();

const LIGHT = ['#F8FAFC', '#FFFFFF', '#0F172A', '#4B51F6', '#E2E8F0'];
const DARK = ['#0B0E13', '#161B22', '#F0F6FC', '#38BDF8', '#30363D'];

class Component extends BaseLogic {
  state = { dark: false, slide: 0, loaderFading: false, loaderDone: false };

  SERVICES = [
    { title: 'Cobranza escolar', body: 'Emite y controla mensualidades, matrículas y cuotas especiales desde un solo panel.', tag: 'Instituciones', svg: I('<path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>') },
    { title: 'Pagos móviles', body: 'Los representantes pagan en segundos con transferencia, pago móvil o tarjeta.', tag: 'Familias', svg: I('<rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line>') },
    { title: 'Conciliación bancaria', body: 'Cruza automáticamente los abonos de cada banco con las órdenes por pagar.', tag: 'Administración', svg: I('<path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11"></path>') },
    { title: 'Control de morosidad', body: 'Alertas y recordatorios automáticos por alumno, sección y período.', tag: 'Cobranza', svg: I('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>') },
    { title: 'Reportes y proyecciones', body: 'Ingresos, alumnos por pagar y flujo estimado con exportación a Excel.', tag: 'Dirección', svg: I('<line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>') },
    { title: 'Donaciones y campañas', body: 'Recauda fondos para proyectos con enlaces de pago y metas visibles.', tag: 'Comunidad', svg: I('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>') },
    { title: 'Multi-tasa y multi-moneda', body: 'Tasa del día automática y montos en USD y bolívares sin cálculos manuales.', tag: 'Finanzas', svg: I('<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>') },
    { title: 'Soporte dedicado', body: 'Acompañamiento en la migración de datos y capacitación del personal.', tag: 'Servicio', svg: I('<path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>') }
  ];

  CARDS = [
    { title: 'Cobros al día', body: 'Seguimiento de morosidad y conciliación automática por banco.', svg: I('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path>', 2.2) },
    { title: 'Pagos en un toque', body: 'Los representantes pagan la mensualidad desde el móvil, sin fricción.', svg: I('<rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><path d="M12 18h.01"></path><path d="m9 9 3-3 3 3"></path>', 2.2) },
    { title: 'Reportes claros', body: 'Ingresos, alumnos por pagar y proyecciones en un solo panel.', svg: I('<path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path>', 2.2) }
  ];

  /* ---- Pantalla de carga (tangram) ---- */

  loaderRef = el => { this._tgSvg = el; };

  startLoader() {
    const show = this.props.showLoader ?? true;
    if (!show) { this.setState({ loaderDone: true }); return; }
    const ms = (this.props.loaderSeconds ?? 15) * 1000;
    const t0 = performance.now();
    const tick = now => {
      if (this.state.loaderDone) return;
      const svg = this._tgSvg;
      if (svg) {
        const e = Math.max(0, now - t0);
        const cyc = e % (TG_STEP * TG_SEQ.length);
        const si = Math.floor(cyc / TG_STEP);
        const ts = cyc % TG_STEP;
        const p = ts < TG_MORPH ? tgEase(ts / TG_MORPH) : 1;
        const A = TG[TG_SEQ[si]], B = TG[TG_SEQ[(si + 1) % TG_SEQ.length]];
        const polys = svg.querySelectorAll('polygon');
        for (let i = 0; i < 7 && i < polys.length; i++) {
          let s = '';
          for (let v = 0; v < 4; v++) {
            s += (A[i][v][0] + (B[i][v][0] - A[i][v][0]) * p).toFixed(2) + ',' + (A[i][v][1] + (B[i][v][1] - A[i][v][1]) * p).toFixed(2) + ' ';
          }
          polys[i].setAttribute('points', s.trim());
        }
      }
      this._tgRaf = requestAnimationFrame(tick);
    };
    this._tgRaf = requestAnimationFrame(tick);
    this._tgT1 = setTimeout(() => this.setState({ loaderFading: true }), ms);
    this._tgT2 = setTimeout(() => this.setState({ loaderDone: true }), ms + 520);
  }

  /* ---- Sincronización con el Panel de Administración ---- */

  readAdmin() {
    try { return JSON.parse(localStorage.getItem('admin-panel-v1') || 'null'); } catch (e) { return null; }
  }

  getAdminPalette(isDark) {
    const d = this.readAdmin();
    if (d && d.palettes && d.palettes.length) {
      const mode = isDark ? 'dark' : 'light';
      const activeId = isDark ? (d.activeDarkId || 101) : (d.activeLightId || 1);
      const modeOf = p => p.mode || ((p.id >= 100 || /dark|oscuro|noche|midnight|cyberpunk|oled/i.test(p.name || '')) ? 'dark' : 'light');
      const palettes = d.palettes.map(p => ({ ...p, mode: modeOf(p) }));
      const inMode = palettes.filter(p => p.mode === mode);
      const found = inMode.find(p => p.id === activeId) || palettes.find(p => p.id === activeId) || inMode[0] || palettes[0];
      if (found && found.colors && found.colors.length === 5) return found.colors;
    }
    return isDark ? DARK : LIGHT;
  }

  getAdminTypography() {
    const d = this.readAdmin();
    if (d && d.types && d.types.length) return d.types.find(t => t.id === (d.activeTypeId || 1)) || d.types[0];
    return { name: 'Predeterminada', font: 'Archivo (sistema)', family: '', h1: 40, h3: 22, p: 16 };
  }

  styleEl(id) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      document.head.appendChild(el);
    }
    return el;
  }

  injectThemeVars(c) {
    this.styleEl('dynamic-theme-vars').textContent =
      ':root,[data-theme],[data-theme="dark"],[data-theme="light"]{--c-bg:' + c[0] + ';--c-surface:' + c[1] + ';--c-text:' + c[2] + ';--c-cta:' + c[3] + ';--c-border:' + c[4] + '}';
  }

  injectTypographyVars(t) {
    const fam = t.family ? '"' + t.family + '", Archivo, sans-serif' : 'Archivo, sans-serif';
    const face = (t.face && t.family) ? '@font-face{font-family:"' + t.family + '";src:url("' + t.face + '") format("truetype");font-display:swap}' : '';
    const s1 = (Number(t.h1) || 40) / 40, s3 = (Number(t.h3) || 22) / 22, sp = (Number(t.p) || 16) / 16;
    const r = Math.round;
    this.styleEl('dynamic-typography-vars').textContent = face +
      ':root,[data-theme],[data-theme="dark"],[data-theme="light"]{--font-main:' + fam +
      ';--fs-logo:' + r(30 * s1) + 'px;--fs-h1:' + r(80 * s1) + 'px;--fs-section-h2:' + r(42 * s1) + 'px;--fs-h3:' + r(22 * s3) +
      'px;--fs-hero-p:' + r(24 * sp) + 'px;--fs-p:' + r(16 * sp) + 'px;--fs-btn:' + r(15 * sp) + 'px;--fs-sm:' + Math.max(10, r(13 * sp)) + 'px;--fs-tag:' + Math.max(10, r(13 * sp)) + 'px}' +
      '*,*::before,*::after{font-family:var(--font-main) !important}';
  }

  applyTheme(dark) {
    this.injectThemeVars(this.getAdminPalette(dark));
    this.injectTypographyVars(this.getAdminTypography());
  }

  /* ---- Ciclo de vida ---- */

  componentDidMount() {
    const saved = localStorage.getItem('unopago-theme');
    const isDark = saved === 'dark' || (!saved && !!this.props.dark);
    this.setState({ dark: isDark });
    this.applyTheme(isDark);
    this.startLoader();

    /* El panel de administración corre en otra pestaña: repintamos al vuelo. */
    this._onStorage = e => { if (e.key === 'admin-panel-v1') this.applyTheme(this.state.dark); };
    window.addEventListener('storage', this._onStorage);

    this._onResize = () => this.measure();
    window.addEventListener('resize', this._onResize);

    this._onTrackScroll = () => {
      const g = this.geo();
      if (!g) return;
      const i = Math.max(0, Math.min(g.pages - 1, Math.round(g.el.scrollLeft / (g.pitch * g.perView))));
      if (i !== this.state.slide) this.setState({ slide: i });
    };
    setTimeout(() => {
      this.measure();
      const el = this.trackEl();
      if (el) el.addEventListener('scroll', this._onTrackScroll, { passive: true });
    }, 0);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this._tgRaf);
    clearTimeout(this._tgT1);
    clearTimeout(this._tgT2);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('storage', this._onStorage);
    const el = this.trackEl();
    if (el && this._onTrackScroll) el.removeEventListener('scroll', this._onTrackScroll);
  }

  /* ---- Carrusel de servicios ---- */

  trackEl() { return document.getElementById('svc-track'); }

  geo() {
    const el = this.trackEl();
    const cards = el && el.firstElementChild ? Array.from(el.firstElementChild.children) : [];
    if (!el || cards.length < 2) return null;
    const pitch = cards[1].offsetLeft - cards[0].offsetLeft || cards[0].offsetWidth;
    const perView = Math.max(1, Math.floor((el.clientWidth + 4) / pitch));
    return { el, cards, pitch, perView, pages: Math.ceil(cards.length / perView) };
  }

  measure() {
    const g = this.geo();
    if (g && g.pages !== this.state.pages) this.setState({ pages: g.pages });
  }

  renderVals() {
    const dark = this.state.dark;
    const pages = Math.max(1, this.state.pages || 1);
    const slide = Math.min(this.state.slide, pages - 1);
    const go = i => {
      const g = this.geo();
      if (!g) return;
      const p = ((i % g.pages) + g.pages) % g.pages;
      const card = g.cards[Math.min(g.cards.length - 1, p * g.perView)];
      g.el.scrollTo({ left: card.offsetLeft - g.cards[0].offsetLeft, behavior: 'smooth' });
      this.setState({ slide: p });
    };
    return {
      services: this.SERVICES,
      cards: this.CARDS,
      prev: () => go(slide - 1),
      next: () => go(slide + 1),
      dots: Array.from({ length: pages }, (_, i) => ({
        go: () => go(i),
        width: i === slide ? '34px' : '14px',
        bg: i === slide ? 'var(--c-cta)' : 'var(--c-border)'
      })),
      theme: dark ? 'dark' : 'light',
      loaderVisible: !this.state.loaderDone,
      loaderOpacity: this.state.loaderFading ? 0 : 1,
      loaderBg: dark ? 'var(--c-bg)' : '#ffffff',
      loaderStroke: dark ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.16)',
      loaderRef: this.loaderRef,
      iconStyle: dark
        ? { width: '16px', height: '16px', borderRadius: '999px', background: 'var(--c-text)', boxShadow: '0 0 0 3px rgba(255,255,255,.28)', display: 'block' }
        : { width: '18px', height: '18px', borderRadius: '999px', background: 'transparent', boxShadow: 'inset -5px -2px 0 0 var(--c-text)', display: 'block' },
      toggleTheme: () => this.setState(s => {
        const nextDark = !s.dark;
        localStorage.setItem('unopago-theme', nextDark ? 'dark' : 'light');
        this.applyTheme(nextDark);
        return { dark: nextDark };
      })
    };
  }
}

if (typeof Component !== 'undefined') {
  if (typeof window !== 'undefined') window.Component = Component;
  if (typeof globalThis !== 'undefined') globalThis.Component = Component;
}
