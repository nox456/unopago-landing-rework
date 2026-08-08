/**
 * ==========================================================================
 * UnoPago Admin Panel - Lógica e Interacción del Componente
 * ==========================================================================
 */

const BaseLogic = (typeof DCLogic !== 'undefined' ? DCLogic : (typeof window !== 'undefined' && window.DCLogic ? window.DCLogic : class {}));

// Default 5-color palettes (60-30-10)
const DEF_COLORS_LIGHT = ['#F8FAFC', '#FFFFFF', '#0F172A', '#4B51F6', '#E2E8F0'];
const DEF_COLORS_DARK = ['#0B0E13', '#161B22', '#F0F6FC', '#38BDF8', '#30363D'];
const LABELS = ['1. Dominante (60%)', '2. Superficie (20%)', '3. Texto/Lectura', '4. Acento/CTA (10%)', '5. Neutro/Bordes (10%)'];
const PER_PAGE = 3;
const SERVICES = [
  { title: 'Cobranza escolar', body: 'Emite y controla mensualidades, matrículas y cuotas especiales.', tag: 'Instituciones' },
  { title: 'Pagos móviles', body: 'Los representantes pagan en segundos desde el móvil.', tag: 'Familias' },
  { title: 'Reportes claros', body: 'Ingresos, morosidad y proyecciones en un solo panel.', tag: 'Dirección' }
];

class Component extends BaseLogic {
  state = {
    tab: 'colors',
    paletteMode: 'light', // 'light' | 'dark'
    activeLightId: 1,
    activeDarkId: 101,
    palettes: [
      { id: 1, mode: 'light', name: 'Paleta Predeterminada Claro', note: 'Modo claro estándar', colors: ['#F8FAFC', '#FFFFFF', '#0F172A', '#4B51F6', '#E2E8F0'] },
      { id: 2, mode: 'light', name: 'Paleta Corporativa Claro', note: 'Marca principal azul', colors: ['#F0F4F8', '#FFFFFF', '#102A43', '#0062D2', '#D9E2EC'] },
      { id: 3, mode: 'light', name: 'Paleta Esmeralda Claro', note: 'Verde fresco escolar', colors: ['#F4FBF7', '#FFFFFF', '#0A3A2A', '#059669', '#D1FAE5'] },
      { id: 4, mode: 'light', name: 'Paleta Cálida Claro', note: 'Temporada escolar', colors: ['#FDF8F5', '#FFFFFF', '#2D1A12', '#E05638', '#F3E2D8'] },

      { id: 101, mode: 'dark', name: 'Paleta Predeterminada Oscuro', note: 'Modo noche elegante', colors: ['#0B0E13', '#161B22', '#F0F6FC', '#38BDF8', '#30363D'] },
      { id: 102, mode: 'dark', name: 'Paleta Noche Midnight', note: 'Azul profundo de alto contraste', colors: ['#090D16', '#111827', '#F9FAFB', '#6366F1', '#1F2937'] },
      { id: 103, mode: 'dark', name: 'Paleta Esmeralda Oscuro', note: 'Verde noche accesible', colors: ['#061712', '#0C241B', '#ECFDF5', '#10B981', '#133E30'] },
      { id: 104, mode: 'dark', name: 'Paleta Cyberpunk Oscuro', note: 'Estilo Neón', colors: ['#0D0B18', '#161228', '#F5F3FF', '#EC4899', '#2E234B'] }
    ],
    palPage: 0,
    editing: null,
    form: null,
    drafts: {},
    h1: 40, h3: 22, p: 16,
    pubH1: 40, pubH3: 22, pubP: 16, pubFamily: '',
    typeName: 'Estilo Nuevo',
    fontName: '',
    fontFamily: '',
    fontMsg: 'Ningún archivo cargado. Se usa la fuente del sistema.',
    fontError: false,
    types: [
      { id: 1, name: 'Tipografía Predeterminada', font: 'Archivo (sistema)', family: '', h1: 40, h3: 22, p: 16 },
      { id: 2, name: 'Lectura Cómoda', font: 'Archivo (sistema)', family: '', h1: 46, h3: 26, p: 18 },
      { id: 3, name: 'Compacta Móvil', font: 'Archivo (sistema)', family: '', h1: 32, h3: 19, p: 15 },
      { id: 4, name: 'Baja Visión', font: 'Archivo (sistema)', family: '', h1: 56, h3: 32, p: 22 }
    ],
    typPage: 0,
    activeTypeId: 1,
    tediting: null,
    tform: null,
    palSearch: '',
    typSearch: '',
    currentUser: null,
    authMode: 'login',
    authEmail: '',
    authPassword: '',
    authName: '',
    authError: '',
    status: ''
  };

  componentDidMount() {
    try {
      let usersRaw = localStorage.getItem('unopago-users-v1');
      if (!usersRaw) {
        const defaultUsers = [{ name: 'Administrador', email: 'admin@unopago.com', password: 'admin' }];
        localStorage.setItem('unopago-users-v1', JSON.stringify(defaultUsers));
      }
      let sessionRaw = localStorage.getItem('unopago-session-v1');
      if (sessionRaw) {
        const currentUser = JSON.parse(sessionRaw);
        this.setState({ currentUser });
      }

      const raw = localStorage.getItem('admin-panel-v1');
      if (raw) {
        const d = JSON.parse(raw);
        const getModeOfPalette = p => {
          if (p.mode) return p.mode;
          if (p.id >= 100 || /dark|oscuro|noche|midnight|cyberpunk|oled/i.test(p.name || '')) return 'dark';
          return 'light';
        };
        const palettes = (d.palettes || this.state.palettes).map(p => ({ ...p, mode: getModeOfPalette(p) }));
        const activeLightId = d.activeLightId || (palettes.find(p => p.mode === 'light') || {}).id || 1;
        const activeDarkId = d.activeDarkId || (palettes.find(p => p.mode === 'dark') || {}).id || 101;

        this.setState(s => ({
          ...s,
          ...d,
          palettes,
          activeLightId,
          activeDarkId,
          editing: null, form: null, drafts: {}, tediting: null, tform: null, status: ''
        }));
        (d.types || []).forEach(t => {
          if (t.face && t.family) this.injectFace(t.face, t.family);
        });
      } else {
        this.persist({});
      }
    } catch (e) {}
  }

  onAuthEmail = e => this.setState({ authEmail: e.target.value, authError: '' });
  onAuthPassword = e => this.setState({ authPassword: e.target.value, authError: '' });
  onAuthName = e => this.setState({ authName: e.target.value, authError: '' });

  switchAuthMode = mode => this.setState({ authMode: mode, authError: '' });

  handleLogin = () => {
    const email = (this.state.authEmail || '').trim().toLowerCase();
    const password = (this.state.authPassword || '').trim();
    if (!email || !password) {
      this.setState({ authError: 'Ingresa tu correo y contraseña.' });
      return;
    }
    try {
      const users = JSON.parse(localStorage.getItem('unopago-users-v1') || '[]');
      const found = users.find(u => (u.email || '').toLowerCase() === email && u.password === password);
      if (found) {
        const userSession = { name: found.name, email: found.email };
        localStorage.setItem('unopago-session-v1', JSON.stringify(userSession));
        this.setState({ currentUser: userSession, authEmail: '', authPassword: '', authError: '', status: 'Bienvenido, ' + found.name });
      } else {
        this.setState({ authError: 'Credenciales incorrectas. (Prueba admin@unopago.com / admin)' });
      }
    } catch (e) {
      this.setState({ authError: 'Error al iniciar sesión.' });
    }
  };

  handleRegister = () => {
    const name = (this.state.authName || '').trim();
    const email = (this.state.authEmail || '').trim().toLowerCase();
    const password = (this.state.authPassword || '').trim();
    if (!name || !email || !password) {
      this.setState({ authError: 'Por favor completa todos los campos.' });
      return;
    }
    try {
      const users = JSON.parse(localStorage.getItem('unopago-users-v1') || '[]');
      if (users.some(u => (u.email || '').toLowerCase() === email)) {
        this.setState({ authError: 'El correo ya está registrado.' });
        return;
      }
      const newUser = { name, email, password };
      users.push(newUser);
      localStorage.setItem('unopago-users-v1', JSON.stringify(users));

      const userSession = { name, email };
      localStorage.setItem('unopago-session-v1', JSON.stringify(userSession));
      this.setState({ currentUser: userSession, authName: '', authEmail: '', authPassword: '', authError: '', status: 'Cuenta creada. Bienvenido, ' + name });
    } catch (e) {
      this.setState({ authError: 'Error al registrar la cuenta.' });
    }
  };

  handleLogout = () => {
    try {
      localStorage.removeItem('unopago-session-v1');
    } catch (e) {}
    this.setState({ currentUser: null, authEmail: '', authPassword: '', authName: '', authError: '', status: 'Sesión cerrada.' });
  };

  persist(extra) {
    const s = { ...this.state, ...extra };
    try {
      localStorage.setItem('admin-panel-v1', JSON.stringify({
        palettes: s.palettes, palPage: s.palPage, activeLightId: s.activeLightId, activeDarkId: s.activeDarkId,
        paletteMode: s.paletteMode, types: s.types, typPage: s.typPage, activeTypeId: s.activeTypeId
      }));
    } catch (e) {}
  }

  injectFace(dataUrl, family) {
    if (!family || !dataUrl) return;
    let el = document.getElementById('custom-font-face-' + family);
    if (!el) {
      el = document.createElement('style');
      el.id = 'custom-font-face-' + family;
      document.head.appendChild(el);
    }
    el.textContent = '@font-face{font-family:"' + family + '";src:url("' + dataUrl + '") format("truetype");font-display:swap}';
  }

  onFontFile = e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!/\.ttf$/i.test(file.name)) {
      this.setState({ fontMsg: 'Formato no permitido: solo se aceptan archivos .ttf', fontError: true });
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const family = 'CustomTTF-' + Date.now();
      this.injectFace(reader.result, family);
      this.setState(s => ({
        tform: s.tform ? { ...s.tform, family, face: reader.result, font: file.name } : s.tform,
        fontMsg: 'Fuente aplicada: ' + file.name, fontError: false
      }));
    };
    reader.readAsDataURL(file);
  };

  pager(total, page, setPage) {
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    const cur = Math.min(page, pages - 1);
    const btn = active => ({
      minWidth: '38px', height: '38px', padding: '0 12px', borderRadius: '999px', cursor: 'pointer',
      font: '600 14px Archivo, sans-serif', transition: 'background .2s',
      border: active ? '0' : '1px solid rgba(15,23,42,.14)',
      background: active ? '#4B51F6' : '#fff',
      color: active ? '#fff' : '#0f172a'
    });
    const arrow = disabled => ({ ...btn(false), opacity: disabled ? .35 : 1, cursor: disabled ? 'default' : 'pointer', fontSize: '18px' });
    const from = total === 0 ? 0 : cur * PER_PAGE + 1;
    const to = Math.min(total, (cur + 1) * PER_PAGE);
    return {
      cur, pages,
      range: from + '–' + to + ' de ' + total,
      prev: () => setPage(Math.max(0, cur - 1)),
      next: () => setPage(Math.min(pages - 1, cur + 1)),
      prevStyle: arrow(cur === 0),
      nextStyle: arrow(cur >= pages - 1),
      items: Array.from({ length: pages }, (_, i) => ({ n: i + 1, go: () => setPage(i), style: btn(i === cur) }))
    };
  }

  setDraft(i, v) {
    this.setState(s => {
      const drafts = { ...(s.drafts || {}) };
      if (v === null) delete drafts[i]; else drafts[i] = v;
      return { drafts };
    });
  }

  commitDraft(i, raw, setColor) {
    let v = (raw || '').trim();
    if (/^[0-9a-fA-F]{6}$/.test(v)) v = '#' + v;
    if (/^#[0-9a-fA-F]{3}$/.test(v)) v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
    if (/^#[0-9a-fA-F]{6}$/.test(v)) setColor(i, v.toUpperCase());
    this.setDraft(i, null);
  }

  startForm(id) {
    const isDark = this.state.paletteMode === 'dark';
    const defaultColors = isDark ? DEF_COLORS_DARK.slice() : DEF_COLORS_LIGHT.slice();
    const p = id === 'new' ? null : this.state.palettes.find(x => x.id === id);
    this.setState({
      editing: id,
      form: { name: p ? p.name : '', colors: p ? p.colors.slice() : defaultColors },
      drafts: {}
    });
  }

  startTypeForm(id) {
    const t = id === 'new' ? null : this.state.types.find(x => x.id === id);
    this.setState({
      tediting: id,
      tform: t
        ? { name: t.name, font: t.font, family: t.family || '', face: t.face, h1: t.h1, h3: t.h3, p: t.p }
        : { name: '', font: 'Archivo (sistema)', family: '', face: null, h1: 40, h3: 22, p: 16 },
      fontMsg: t && t.family ? 'Fuente actual: ' + t.font : 'Ningún archivo cargado. Se usa la fuente del sistema.',
      fontError: false
    });
  }

  renderVals() {
    const st = this.state;
    const isDarkMode = st.paletteMode === 'dark';

    const getModeOfPalette = p => {
      if (p.mode) return p.mode;
      if (p.id >= 100 || /dark|oscuro|noche|midnight|cyberpunk|oled/i.test(p.name || '')) return 'dark';
      return 'light';
    };

    const modePalettes = st.palettes.filter(p => getModeOfPalette(p) === st.paletteMode);
    const palTerm = (st.palSearch || '').trim().toLowerCase();
    const filteredPalettes = palTerm
      ? modePalettes.filter(p => (p.name || '').toLowerCase().includes(palTerm) || (p.note || '').toLowerCase().includes(palTerm))
      : modePalettes;

    const typTerm = (st.typSearch || '').trim().toLowerCase();
    const filteredTypes = typTerm
      ? st.types.filter(t => (t.name || '').toLowerCase().includes(typTerm) || (t.font || '').toLowerCase().includes(typTerm))
      : st.types;

    const activeId = isDarkMode ? st.activeDarkId : st.activeLightId;
    const active = modePalettes.find(x => x.id === activeId) || modePalettes[0] || { colors: isDarkMode ? DEF_COLORS_DARK : DEF_COLORS_LIGHT, name: '—' };

    const form = st.form;
    const c = form ? form.colors : active.colors;
    const activeType = st.types.find(x => x.id === st.activeTypeId) || st.types[0] || { name: '—', font: 'Archivo (sistema)', family: '', h1: 40, h3: 22, p: 16 };
    const tf = st.tform;
    const cur = tf || activeType;
    const pub = { colors: active.colors, h1: activeType.h1, h3: activeType.h3, p: activeType.p, fontFamily: activeType.family || '' };
    const previewFont = (cur.family ? '"' + cur.family + '", ' : '') + 'Archivo, sans-serif';
    const liveFont = (pub.fontFamily ? '"' + pub.fontFamily + '", ' : '') + 'Archivo, sans-serif';

    const setColor = (i, v) => this.setState(s => {
      if (!s.form) return {};
      const colors = s.form.colors.slice(); colors[i] = v;
      return { form: { ...s.form, colors } };
    });

    const pal = this.pager(filteredPalettes.length, st.palPage, i => this.setState({ palPage: i }));
    const typ = this.pager(filteredTypes.length, st.typPage, i => this.setState({ typPage: i }));

    const tab = active => ({
      border: active ? '0' : '1px solid rgba(15,23,42,.14)',
      background: active ? '#0f172a' : '#fff',
      color: active ? '#fff' : 'rgba(15,23,42,.72)',
      borderRadius: '999px', padding: '13px 24px', cursor: 'pointer',
      font: '600 15px Archivo, sans-serif', transition: 'background .2s'
    });

    const num = (key, v) => {
      const n = Math.max(8, Math.min(120, Number(v) || 0));
      this.setState(s => s.tform ? { tform: { ...s.tform, [key]: n } } : {});
    };

    const cBg = c[0];      // 1. Dominante (60%)
    const cSurface = c[1]; // 2. Superficie (20%)
    const cText = c[2];    // 3. Texto y Lectura
    const cCta = c[3];     // 4. Acento / CTA (10%)
    const cBorder = c[4];  // 5. Neutro de Soporte (10%)

    const lBg = pub.colors[0];
    const lSurface = pub.colors[1];
    const lText = pub.colors[2];
    const lCta = pub.colors[3];
    const lBorder = pub.colors[4];

    return {
      isColors: st.tab === 'colors',
      isType: st.tab === 'type',
      goColors: () => this.setState({ tab: 'colors' }),
      goType: () => this.setState({ tab: 'type' }),
      tabColorsStyle: tab(st.tab === 'colors'),
      tabTypeStyle: tab(st.tab === 'type'),
      statusText: st.status,

      paletteMode: st.paletteMode,
      modeTitle: isDarkMode ? 'Modo Oscuro' : 'Modo Claro',
      modeBtnText: isDarkMode ? '☀️ Ver Paletas Modo Claro' : '🌙 Ver Paletas Modo Oscuro',
      modeBtnStyle: {
        background: isDarkMode ? '#38BDF8' : '#0f172a',
        color: '#fff',
        border: 0,
        borderRadius: '10px',
        padding: '12px 20px',
        font: '600 15px Archivo, sans-serif',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background .2s'
      },
      togglePaletteMode: () => this.setState(s => {
        const nextMode = s.paletteMode === 'light' ? 'dark' : 'light';
        this.persist({ paletteMode: nextMode });
        return { paletteMode: nextMode, palPage: 0, editing: null, form: null, drafts: {} };
      }),

      isNew: st.editing === 'new',
      startNew: () => this.startForm('new'),
      cancelForm: () => this.setState({ editing: null, form: null, drafts: {} }),
      formName: form ? form.name : '',
      onFormName: e => this.setState(s => ({ form: { ...s.form, name: e.target.value } })),
      commitForm: () => this.setState(s => {
        if (!s.form) return {};
        const name = (s.form.name || '').trim() || ('Paleta ' + (s.paletteMode === 'dark' ? 'Oscuro' : 'Claro'));
        const colors = s.form.colors.slice();
        let palettes, palPage = s.palPage, status;
        if (s.editing === 'new') {
          const newId = Date.now();
          palettes = s.palettes.concat([{ id: newId, mode: s.paletteMode, name, note: 'Creada para Modo ' + (s.paletteMode === 'dark' ? 'Oscuro' : 'Claro'), colors }]);
          const count = palettes.filter(p => getModeOfPalette(p) === s.paletteMode).length;
          palPage = Math.ceil(count / PER_PAGE) - 1;
          status = 'Paleta “' + name + '” creada para ' + (s.paletteMode === 'dark' ? 'Modo Oscuro' : 'Modo Claro') + '.';
        } else {
          palettes = s.palettes.map(p => p.id === s.editing ? { ...p, name, colors } : p);
          status = 'Paleta “' + name + '” actualizada.';
        }
        this.persist({ palettes });
        return { palettes, palPage, editing: null, form: null, drafts: {}, status };
      }),
      formSlots: (form ? form.colors : []).map((hex, i) => ({
        label: LABELS[i], hex,
        draft: (st.drafts && st.drafts[i] != null) ? st.drafts[i] : hex,
        onPick: e => { this.setDraft(i, null); setColor(i, e.target.value); },
        onType: e => this.setDraft(i, e.target.value),
        onCommit: e => this.commitDraft(i, e.target.value, setColor),
        onKey: e => { if (e.key === 'Enter') this.commitDraft(i, e.target.value, setColor); }
      })),
      swatches: c.map(hex => ({ hex })),
      cBg, cSurface, cText, cCta, cBorder,
      previewFont,
      svcCards: SERVICES.map((s, i) => ({ color: cCta, title: s.title, body: s.body, tag: s.tag })),
      h1px: cur.h1 + 'px', h3px: cur.h3 + 'px', ppx: cur.p + 'px',
      typePreviewNote: tf
        ? (st.tediting === 'new' ? 'Nueva tipografía en edición' : 'Tipografía en edición')
        : 'Tipografía cargada en el sitio: “' + activeType.name + '”',

      isAuthenticated: !!st.currentUser,
      isUnauthenticated: !st.currentUser,
      currentUserName: st.currentUser ? st.currentUser.name : '',
      currentUserEmail: st.currentUser ? st.currentUser.email : '',
      logout: () => this.handleLogout(),

      isAuthLogin: st.authMode === 'login',
      isAuthRegister: st.authMode === 'register',
      goAuthLogin: () => this.switchAuthMode('login'),
      goAuthRegister: () => this.switchAuthMode('register'),

      authEmail: st.authEmail,
      authPassword: st.authPassword,
      authName: st.authName,
      authError: st.authError,

      onAuthEmail: this.onAuthEmail,
      onAuthPassword: this.onAuthPassword,
      onAuthName: this.onAuthName,
      submitAuth: () => st.authMode === 'login' ? this.handleLogin() : this.handleRegister(),
      onAuthKey: e => { if (e.key === 'Enter') st.authMode === 'login' ? this.handleLogin() : this.handleRegister(); },

      palSearch: st.palSearch || '',
      onPalSearch: e => this.setState({ palSearch: e.target.value, palPage: 0 }),
      typSearch: st.typSearch || '',
      onTypSearch: e => this.setState({ typSearch: e.target.value, typPage: 0 }),

      palettePage: filteredPalettes.slice(pal.cur * PER_PAGE, pal.cur * PER_PAGE + PER_PAGE).map(p => {
        const isActive = p.id === activeId;
        const editing = st.editing === p.id;
        const pMode = getModeOfPalette(p);
        return {
          name: p.name, note: p.note,
          chips: p.colors.map(hex => ({ hex })),
          isEditing: editing,
          locked: isActive,
          editLabel: editing ? 'Cerrar' : 'Editar',
          loadLabel: isActive ? 'Cargada' : 'Activar',
          loadStyle: {
            border: 0, borderRadius: '8px', padding: '10px 18px', marginLeft: '8px',
            font: '600 14px Archivo, sans-serif', whiteSpace: 'nowrap',
            background: isActive ? 'rgba(41,124,124,.12)' : '#4B51F6',
            color: isActive ? '#297C7C' : '#fff',
            cursor: isActive ? 'default' : 'pointer'
          },
          removeTitle: isActive ? 'No se puede eliminar la paleta cargada en el sitio' : 'Eliminar paleta',
          removeStyle: {
            background: 'transparent', borderRadius: '8px', padding: '9px 16px', marginLeft: '8px',
            font: '600 14px Archivo, sans-serif', whiteSpace: 'nowrap',
            border: '1px solid ' + (isActive ? 'rgba(15,23,42,.14)' : 'rgba(208,67,75,.35)'),
            color: isActive ? 'rgba(15,23,42,.35)' : '#D0434B',
            cursor: isActive ? 'not-allowed' : 'pointer'
          },
          edit: () => editing ? this.setState({ editing: null, form: null, drafts: {} }) : this.startForm(p.id),
          load: () => {
            if (isActive) return;
            const updateKey = pMode === 'dark' ? 'activeDarkId' : 'activeLightId';
            this.setState({ [updateKey]: p.id, editing: null, form: null, drafts: {}, status: 'Paleta ' + (pMode === 'dark' ? 'Modo Oscuro' : 'Modo Claro') + ' “' + p.name + '” aplicada al sitio.' });
            this.persist({ [updateKey]: p.id });
          },
          remove: () => {
            if (isActive) return;
            this.setState(s => {
              const palettes = s.palettes.filter(x => x.id !== p.id);
              this.persist({ palettes });
              const currentModeCount = palettes.filter(x => getModeOfPalette(x) === s.paletteMode).length;
              return { palettes, palPage: Math.min(s.palPage, Math.max(0, Math.ceil(currentModeCount / PER_PAGE) - 1)), editing: s.editing === p.id ? null : s.editing, form: s.editing === p.id ? null : s.form };
            });
          }
        };
      }),
      palRange: pal.range, palPrev: pal.prev, palNext: pal.next,
      palPrevStyle: pal.prevStyle, palNextStyle: pal.nextStyle, palPages: pal.items,

      onFont: this.onFontFile,
      fontMsg: st.fontMsg,
      fontMsgColor: st.fontError ? '#D0434B' : 'rgba(15,23,42,.55)',
      fontLabel: cur.font || 'Archivo (sistema)',
      isNewType: st.tediting === 'new',
      startNewType: () => this.startTypeForm('new'),
      cancelTypeForm: () => this.setState({ tediting: null, tform: null, fontMsg: 'Ningún archivo cargado. Se usa la fuente del sistema.', fontError: false }),
      typeFormName: tf ? tf.name : '',
      onTypeFormName: e => this.setState(s => ({ tform: { ...s.tform, name: e.target.value } })),
      commitTypeForm: () => this.setState(s => {
        if (!s.tform) return {};
        const f = s.tform;
        const name = (f.name || '').trim() || 'Estilo sin nombre';
        const rec = { name, font: f.font || 'Archivo (sistema)', family: f.family || '', face: f.face, h1: f.h1, h3: f.h3, p: f.p };
        let types, typPage = s.typPage, status;
        if (s.tediting === 'new') {
          types = s.types.concat([{ id: Date.now(), ...rec }]);
          typPage = Math.ceil(types.length / PER_PAGE) - 1;
          status = 'Tipografía “' + name + '” creada.';
        } else {
          types = s.types.map(t => t.id === s.tediting ? { ...t, ...rec } : t);
          status = 'Tipografía “' + name + '” actualizada.';
        }
        this.persist({ types });
        return { types, typPage, tediting: null, tform: null, status };
      }),
      sizeFields: [
        { label: 'Títulos (h1 / h2)', hint: 'Encabezados principales', value: cur.h1, onChange: e => num('h1', e.target.value), inc: () => num('h1', cur.h1 + 1), dec: () => num('h1', cur.h1 - 1) },
        { label: 'Subtítulos (h3 / h4)', hint: 'Encabezados de sección', value: cur.h3, onChange: e => num('h3', e.target.value), inc: () => num('h3', cur.h3 + 1), dec: () => num('h3', cur.h3 - 1) },
        { label: 'Párrafos (p)', hint: 'Texto de cuerpo y botones', value: cur.p, onChange: e => num('p', e.target.value), inc: () => num('p', cur.p + 1), dec: () => num('p', cur.p - 1) }
      ],
      typePage: filteredTypes.slice(typ.cur * PER_PAGE, typ.cur * PER_PAGE + PER_PAGE).map(t => {
        const isActive = t.id === st.activeTypeId;
        const editing = st.tediting === t.id;
        if (t.face && t.family) this.injectFace(t.face, t.family);
        const nameFontFamily = (t.family ? '"' + t.family + '", ' : '') + 'Archivo, sans-serif';
        return {
          name: t.name,
          nameFontFamily,
          font: t.font, h1: t.h1, h3: t.h3, p: t.p,
          isEditing: editing,
          locked: isActive,
          editLabel: editing ? 'Cerrar' : 'Editar',
          loadLabel: isActive ? 'Cargada' : 'Activar',
          loadStyle: {
            border: 0, borderRadius: '8px', padding: '10px 18px',
            font: '600 14px Archivo, sans-serif', whiteSpace: 'nowrap',
            background: isActive ? 'rgba(41,124,124,.12)' : '#4B51F6',
            color: isActive ? '#297C7C' : '#fff',
            cursor: isActive ? 'default' : 'pointer'
          },
          removeTitle: isActive ? 'No se puede eliminar la tipografía cargada en el sitio' : 'Eliminar tipografía',
          removeStyle: {
            background: 'transparent', borderRadius: '8px', padding: '9px 16px', marginLeft: '8px',
            font: '600 14px Archivo, sans-serif', whiteSpace: 'nowrap',
            border: '1px solid ' + (isActive ? 'rgba(15,23,42,.14)' : 'rgba(208,67,75,.35)'),
            color: isActive ? 'rgba(15,23,42,.35)' : '#D0434B',
            cursor: isActive ? 'not-allowed' : 'pointer'
          },
          edit: () => editing ? this.setState({ tediting: null, tform: null }) : this.startTypeForm(t.id),
          load: () => {
            if (isActive) return;
            if (t.face && t.family) this.injectFace(t.face, t.family);
            this.setState({ activeTypeId: t.id, tediting: null, tform: null, status: 'Tipografía “' + t.name + '” aplicada al sitio.' });
            this.persist({ activeTypeId: t.id });
          },
          remove: () => {
            if (isActive) return;
            this.setState(s => {
              const types = s.types.filter(x => x.id !== t.id);
              this.persist({ types });
              return { types, typPage: Math.min(s.typPage, Math.max(0, Math.ceil(types.length / PER_PAGE) - 1)), tediting: s.tediting === t.id ? null : s.tediting, tform: s.tediting === t.id ? null : s.tform };
            });
          }
        };
      }),
      typRange: typ.range, typPrev: typ.prev, typNext: typ.next,
      typPrevStyle: typ.prevStyle, typNextStyle: typ.nextStyle, typPages: typ.items,

      liveFont,
      lBg, lSurface, lText, lCta, lBorder,
      lh1: pub.h1 + 'px',
      lp: pub.p + 'px',
      publicCards: SERVICES.map((s, i) => ({
        bg: lCta, title: s.title, body: s.body, tag: s.tag,
        titleSize: pub.h3 + 'px', bodySize: pub.p + 'px'
      }))
    };
  }
}

if (typeof Component !== 'undefined') {
  if (typeof window !== 'undefined') window.Component = Component;
  if (typeof globalThis !== 'undefined') globalThis.Component = Component;
}
