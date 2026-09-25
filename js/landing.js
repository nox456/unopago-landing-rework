const BaseLogic = (typeof DCLogic !== 'undefined' ? DCLogic : (typeof window !== 'undefined' && window.DCLogic ? window.DCLogic : class {}));

class Component extends BaseLogic {
  state = { dark: false, slide: 0 };
  SERVICES = [
    {
      title: 'Cobranza escolar',
      body: 'Emite y controla mensualidades, matrículas y cuotas especiales desde un solo panel.',
      tag: 'Instituciones',
      svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg>'
    },
    {
      title: 'Pagos móviles',
      body: 'Los representantes pagan en segundos con transferencia, pago móvil o tarjeta.',
      tag: 'Familias',
      svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>'
    },
    {
      title: 'Conciliación bancaria',
      body: 'Cruza automáticamente los abonos de cada banco con las órdenes por pagar.',
      tag: 'Administración',
      svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11"></path></svg>'
    },
    {
      title: 'Control de morosidad',
      body: 'Alertas y recordatorios automáticos por alumno, sección y período.',
      tag: 'Cobranza',
      svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'
    },
    {
      title: 'Reportes y proyecciones',
      body: 'Ingresos, alumnos por pagar y flujo estimado con exportación a Excel.',
      tag: 'Dirección',
      svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>'
    },
    {
      title: 'Donaciones y campañas',
      body: 'Recauda fondos para proyectos con enlaces de pago y metas visibles.',
      tag: 'Comunidad',
      svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'
    },
    {
      title: 'Multi-tasa y multi-moneda',
      body: 'Tasa del día automática y montos en USD y bolívares sin cálculos manuales.',
      tag: 'Finanzas',
      svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>'
    },
    {
      title: 'Soporte dedicado',
      body: 'Acompañamiento en la migración de datos y capacitación del personal.',
      tag: 'Servicio',
      svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>'
    }
  ];

  getAdminPalette(isDark) {
    try {
      const raw = localStorage.getItem('admin-panel-v1');
      if (raw) {
        const d = JSON.parse(raw);
        const mode = isDark ? 'dark' : 'light';
        const activeId = isDark ? (d.activeDarkId || 101) : (d.activeLightId || 1);

        const getModeOfPalette = p => {
          if (p.mode) return p.mode;
          if (p.id >= 100 || /dark|oscuro|noche|midnight|cyberpunk|oled/i.test(p.name || '')) return 'dark';
          return 'light';
        };

        const palettes = (d.palettes || []).map(p => ({ ...p, mode: getModeOfPalette(p) }));
        const modePalettes = palettes.filter(p => p.mode === mode);
        let found = modePalettes.find(p => p.id === activeId);

        if (!found && activeId) {
          found = palettes.find(p => p.id === activeId);
        }

        if (!found) {
          found = modePalettes[0] || palettes[0];
        }

        if (found && found.colors && found.colors.length === 5) {
          return found.colors;
        }
      }
    } catch (e) {}
    return isDark
      ? ['#0B0E13', '#161B22', '#F0F6FC', '#38BDF8', '#30363D']
      : ['#F8FAFC', '#FFFFFF', '#0F172A', '#4B51F6', '#E2E8F0'];
  }

  getAdminTypography() {
    try {
      const raw = localStorage.getItem('admin-panel-v1');
      if (raw) {
        const d = JSON.parse(raw);
        const activeId = d.activeTypeId || 1;
        const types = d.types || [];
        const found = types.find(t => t.id === activeId) || types[0];
        if (found) {
          return found;
        }
      }
    } catch (e) {}
    return { name: 'Predeterminada', font: 'Archivo (sistema)', family: '', h1: 40, h3: 22, p: 16 };
  }

  injectThemeVars(colors) {
    let el = document.getElementById('dynamic-theme-vars');
    if (!el) {
      el = document.createElement('style');
      el.id = 'dynamic-theme-vars';
      document.head.appendChild(el);
    }
    el.textContent = `
      :root, [data-theme], [data-theme="dark"], [data-theme="light"] {
        --c-bg: ${colors[0]};
        --c-surface: ${colors[1]};
        --c-text: ${colors[2]};
        --c-cta: ${colors[3]};
        --c-border: ${colors[4]};

        --bg: ${colors[0]};
        --surface: ${colors[1]};
        --fg: ${colors[2]};
        --muted: ${colors[2]};
        --line: ${colors[4]};
        --navbg: ${colors[1]};
        --navfg: ${colors[2]};
        --navmuted: ${colors[2]};
        --a1: ${colors[3]};
        --a2: ${colors[3]};
        --a3: ${colors[3]};
        --a4: ${colors[3]};
        --ftbg: ${colors[0]};
        --ftfg: ${colors[2]};
        --ftmuted: ${colors[2]};
        --ftfaint: ${colors[2]};
        --ftline: ${colors[4]};
        --ftline2: ${colors[4]};
        --ftcard: ${colors[1]};
        --ftcard2: ${colors[1]};
      }
    `;
  }

  injectTypographyVars(type) {
    let el = document.getElementById('dynamic-typography-vars');
    if (!el) {
      el = document.createElement('style');
      el.id = 'dynamic-typography-vars';
      document.head.appendChild(el);
    }
    const familyCss = type.family ? `"${type.family}", Archivo, sans-serif` : 'Archivo, sans-serif';
    const fontFace = (type.face && type.family) ? `
      @font-face {
        font-family: "${type.family}";
        src: url("${type.face}") format("truetype");
        font-display: swap;
      }
    ` : '';

    const h1Base = Number(type.h1) || 40;
    const h3Base = Number(type.h3) || 22;
    const pBase = Number(type.p) || 16;

    const scaleH1 = h1Base / 40;
    const scaleH3 = h3Base / 22;
    const scaleP = pBase / 16;

    el.textContent = `
      ${fontFace}
      :root, [data-theme], [data-theme="dark"], [data-theme="light"] {
        --font-main: ${familyCss};
        --fs-logo: ${Math.round(30 * scaleH1)}px;
        --fs-h1: ${Math.round(80 * scaleH1)}px;
        --fs-section-h2: ${Math.round(42 * scaleH1)}px;
        --fs-h3: ${Math.round(22 * scaleH3)}px;
        --fs-hero-p: ${Math.round(24 * scaleP)}px;
        --fs-p: ${Math.round(16 * scaleP)}px;
        --fs-btn: ${Math.round(15 * scaleP)}px;
        --fs-sm: ${Math.max(10, Math.round(13 * scaleP))}px;
        --fs-tag: ${Math.max(10, Math.round(13 * scaleP))}px;
      }
      *, *::before, *::after {
        font-family: var(--font-main) !important;
      }
    `;
  }

  componentDidMount() {
    const saved = localStorage.getItem('unopago-theme');
    const isDark = saved === 'dark' || (!saved && !!this.props.dark);
    this.setState({ dark: isDark });
    this.injectThemeVars(this.getAdminPalette(isDark));
    this.injectTypographyVars(this.getAdminTypography());

    this._onResize = () => this.measure();
    window.addEventListener('resize', this._onResize);
    this._onTrackScroll = () => {
      const el = this.trackEl();
      if (!el) return;
      const g = this.geo();
      if (!g) return;
      const i = Math.max(0, Math.min(g.pages - 1, Math.round(el.scrollLeft / (g.pitch * g.perView))));
      if (i !== this.state.slide) this.setState({ slide: i });
    };
    setTimeout(() => {
      this.measure();
      const el = this.trackEl();
      if (el) el.addEventListener('scroll', this._onTrackScroll, { passive: true });
    }, 0);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._onResize);
    const el = this.trackEl();
    if (el && this._onTrackScroll) el.removeEventListener('scroll', this._onTrackScroll);
  }

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
    if (!g) return;
    if (g.pages !== this.state.pages) this.setState({ pages: g.pages });
  }

  renderVals() {
    const dark = this.state.dark;
    this.injectThemeVars(this.getAdminPalette(dark));
    this.injectTypographyVars(this.getAdminTypography());
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
      services: this.SERVICES.map(s => ({ ...s, color: 'var(--c-cta)' })),
      prev: () => go(slide - 1),
      next: () => go(slide + 1),
      dots: Array.from({ length: pages }, (_, i) => ({
        go: () => go(i),
        width: i === slide ? '34px' : '14px',
        bg: i === slide ? 'var(--c-cta)' : 'var(--c-border)'
      })),
      theme: dark ? 'dark' : 'light',
      iconStyle: dark
        ? { width: '16px', height: '16px', borderRadius: '999px', background: 'var(--c-text)', boxShadow: '0 0 0 3px rgba(255,255,255,.28)', display: 'block' }
        : { width: '18px', height: '18px', borderRadius: '999px', background: 'transparent', boxShadow: 'inset -5px -2px 0 0 var(--c-text)', display: 'block' },
      toggleTheme: () => this.setState(s => {
        const nextDark = !s.dark;
        localStorage.setItem('unopago-theme', nextDark ? 'dark' : 'light');
        this.injectThemeVars(this.getAdminPalette(nextDark));
        return { dark: nextDark };
      }),
      cards: [
        {
          color: 'var(--c-cta)',
          bgGradient: 'var(--c-cta)',
          title: 'Cobros al día',
          body: 'Seguimiento de morosidad y conciliación automática por banco.',
          svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>'
        },
        {
          color: 'var(--c-cta)',
          bgGradient: 'var(--c-cta)',
          title: 'Pagos en un toque',
          body: 'Los representantes pagan la mensualidad desde el móvil, sin fricción.',
          svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><path d="M12 18h.01"></path><path d="m9 9 3-3 3 3"></path></svg>'
        },
        {
          color: 'var(--c-cta)',
          bgGradient: 'var(--c-cta)',
          title: 'Reportes claros',
          body: 'Ingresos, alumnos por pagar y proyecciones en un solo panel.',
          svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>'
        }
      ]
    };
  }
}

if (typeof Component !== 'undefined') {
  if (typeof window !== 'undefined') window.Component = Component;
  if (typeof globalThis !== 'undefined') globalThis.Component = Component;
}
