const BaseLogic = (typeof DCLogic !== 'undefined' ? DCLogic : (typeof window !== 'undefined' && window.DCLogic ? window.DCLogic : class {}));

class Component extends BaseLogic {
  constructor(p) {
    super(p);
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('unopago-cv-v1') || 'null'); } catch (e) {}
    if (saved && saved.data) {
      // Migración: versiones antiguas guardaban las listas como array sin nivel
      ['skills', 'comps', 'langs'].forEach(k => {
        if (Array.isArray(saved.data[k])) {
          const o = {};
          saved.data[k].forEach(n => o[n] = 'Intermedio');
          saved.data[k] = o;
        }
      });
    }
    this.state = (saved && saved.data)
      ? { step: saved.step || 0, errors: {}, data: saved.data }
      : { step: 0, errors: {}, data: this.blank() };
    this.fotoInputRef = React.createRef();
  }

  blank() {
    return {
      nombre: '', apellido: '', titulo: '', email: '', telefono: '', web: '', direccion: '', perfil: '',
      exp: [{ anios: '', empresa: '', desc: '' }],
      edu: [{ anios: '', centro: '', titulo: '' }],
      skills: {}, comps: {}, langs: {}, skillInput: '', foto: ''
    };
  }

  componentDidUpdate() {
    try {
      localStorage.setItem('unopago-cv-v1', JSON.stringify({ step: this.state.step, data: this.state.data }));
    } catch (e) {}
  }

  set(patch) {
    this.setState(s => ({ data: Object.assign({}, s.data, patch), errors: {} }));
  }

  field(k) {
    return e => this.set({ [k]: e.target.value });
  }

  validate(step) {
    const d = this.state.data, e = {};
    const t = v => (v || '').trim();
    if (step === 0) {
      if (!t(d.nombre)) e.nombre = 'Escribe tu nombre';
      if (!t(d.apellido)) e.apellido = 'Escribe tu apellido';
      if (!t(d.titulo)) e.titulo = 'Escribe o elige un título profesional';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t(d.email))) e.email = 'Correo no válido';
      if (t(d.telefono) && d.telefono.replace(/\D/g, '').length < 7) e.telefono = 'Teléfono no válido';
    }
    if (step === 1 && t(d.perfil).length < 20) e.perfil = 'Cuéntanos un poco más (mínimo 20 caracteres)';
    if (step === 2) {
      if (!d.exp.some(r => t(r.empresa))) e.exp = 'Agrega al menos una experiencia (años y empresa)';
      d.exp.forEach((r, i) => {
        if ((t(r.empresa) || t(r.desc)) && !t(r.anios)) e['exp' + i] = 'Indica los años (ej: 2019 - 2023)';
        else if (t(r.anios) && !t(r.empresa)) e['exp' + i] = 'Indica la empresa';
      });
    }
    if (step === 3) {
      if (!d.edu.some(r => t(r.centro))) e.edu = 'Agrega al menos una formación';
      d.edu.forEach((r, i) => {
        if ((t(r.centro) || t(r.titulo)) && !t(r.anios)) e['edu' + i] = 'Indica los años';
        else if (t(r.anios) && !t(r.centro)) e['edu' + i] = 'Indica el centro de estudios';
      });
    }
    if (step === 4) {
      if (!Object.keys(d.skills).length) e.skills = 'Elige al menos una habilidad (1 clic)';
      if (!Object.keys(d.langs).length) e.langs = 'Elige al menos un idioma (1 clic)';
    }
    return e;
  }

  focusSoon() {
    setTimeout(() => {
      const el = document.querySelector('[data-cvform] input, [data-cvform] textarea');
      if (el) el.focus();
    }, 80);
  }

  go(n) {
    this.setState({ step: n, errors: {} });
    this.focusSoon();
  }

  next() {
    const e = this.validate(this.state.step);
    if (Object.keys(e).length) { this.setState({ errors: e }); return; }
    if (this.state.step < 5) {
      this.setState(s => ({ step: s.step + 1, errors: {} }));
      this.focusSoon();
    }
  }

  updRow(list, i, k) {
    return e => {
      const v = e.target.value;
      this.setState(s => {
        const arr = s.data[list].slice();
        arr[i] = Object.assign({}, arr[i], { [k]: v });
        return { data: Object.assign({}, s.data, { [list]: arr }), errors: {} };
      });
    };
  }

  addRow(list, row) {
    this.setState(s => ({ data: Object.assign({}, s.data, { [list]: s.data[list].concat([row]) }), errors: {} }));
  }

  rmRow(list, i) {
    this.setState(s => ({ data: Object.assign({}, s.data, { [list]: s.data[list].filter((_, j) => j !== i) }), errors: {} }));
  }

  cycle(list, name) {
    const LV = ['Básico', 'Intermedio', 'Avanzado', 'Nativo'];
    this.setState(s => {
      const cur = Object.assign({}, s.data[list]);
      const i = cur[name] ? LV.indexOf(cur[name]) : -1;
      if (i === LV.length - 1) delete cur[name]; else cur[name] = LV[i + 1];
      return { data: Object.assign({}, s.data, { [list]: cur }), errors: {} };
    });
  }

  chipStyle(active) {
    return {
      padding: '9px 16px', borderRadius: 999,
      border: '1px solid ' + (active ? '#4B51F6' : 'rgba(15,23,42,.18)'),
      background: active ? '#4B51F6' : '#fff',
      color: active ? '#fff' : '#0f172a',
      fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', lineHeight: 1.2
    };
  }

  renderVals() {
    const st = this.state, d = st.data, e = st.errors, step = st.step;
    const sideColor = this.props.sideColor ?? '#33373D';
    const shape = this.props.photoShape ?? 'circle';
    const stepDefs = [
      ['Datos', 'Datos personales', 'Lo esencial para encabezar tu CV. Solo 4 campos son obligatorios.'],
      ['Perfil', 'Mi perfil', 'Un resumen breve de quién eres y qué aportas.'],
      ['Experiencia', 'Experiencia laboral', 'De la más reciente a la más antigua.'],
      ['Formación', 'Formación académica', 'Estudios, títulos y certificaciones.'],
      ['Habilidades', 'Habilidades e idiomas', 'Todo con un clic: sin escribir, salvo que quieras agregar algo propio.'],
      ['Exportar', 'Exportar tu CV', 'Revisa la vista previa y descárgalo en PDF.']
    ];
    const stepper = stepDefs.map((s, i) => ({
      label: (i + 1) + ' · ' + s[0],
      onClick: () => { if (i <= step) this.go(i); },
      style: {
        padding: '8px 14px', borderRadius: 999, fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
        whiteSpace: 'nowrap', lineHeight: 1.2,
        cursor: i <= step ? 'pointer' : 'default',
        border: '1px solid ' + (i === step ? '#4B51F6' : 'rgba(15,23,42,.12)'),
        background: i === step ? '#4B51F6' : (i < step ? 'rgba(75,81,246,.10)' : 'transparent'),
        color: i === step ? '#fff' : (i < step ? '#4B51F6' : 'rgba(15,23,42,.45)')
      }
    }));
    const h = {};
    ['nombre', 'apellido', 'titulo', 'email', 'telefono', 'web', 'direccion', 'perfil', 'skillInput'].forEach(k => h[k] = this.field(k));
    const onEnter = ev => { if (ev.key === 'Enter') { ev.preventDefault(); this.next(); } };
    const onSkillEnter = ev => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const v = d.skillInput.trim();
        if (v && !d.skills[v]) this.set({ skills: Object.assign({}, d.skills, { [v]: 'Intermedio' }), skillInput: '' });
      }
    };
    const levelChip = (list, n) => {
      const lvl = d[list][n];
      return { label: lvl ? (n + ' · ' + lvl) : n, style: this.chipStyle(!!lvl), onClick: () => this.cycle(list, n) };
    };
    const rmStyle = n => ({
      flex: 'none', width: 40, height: 40, borderRadius: 9, border: '1px solid rgba(15,23,42,.12)',
      background: '#fff', color: 'rgba(15,23,42,.5)', cursor: 'pointer', fontSize: 14,
      visibility: n > 1 ? 'visible' : 'hidden'
    });
    const expRows = d.exp.map((r, i) => ({
      anios: r.anios, empresa: r.empresa, desc: r.desc, error: e['exp' + i],
      onAnios: this.updRow('exp', i, 'anios'), onEmpresa: this.updRow('exp', i, 'empresa'), onDesc: this.updRow('exp', i, 'desc'),
      remove: () => this.rmRow('exp', i), rmStyle: rmStyle(d.exp.length)
    }));
    const eduRows = d.edu.map((r, i) => ({
      anios: r.anios, centro: r.centro, titulo: r.titulo, error: e['edu' + i],
      onAnios: this.updRow('edu', i, 'anios'), onCentro: this.updRow('edu', i, 'centro'), onTitulo: this.updRow('edu', i, 'titulo'),
      remove: () => this.rmRow('edu', i), rmStyle: rmStyle(d.edu.length)
    }));
    const skillSet = Array.from(new Set(['HTML / CSS', 'JavaScript', 'React', 'Node.js', 'PHP', 'SQL', 'Git', 'WordPress', 'Figma'].concat(Object.keys(d.skills))));
    const skillChips = skillSet.map(n => levelChip('skills', n));
    const compSet = ['Liderazgo', 'Creatividad', 'Análisis crítico', 'Eficiencia', 'Trabajo en equipo', 'Comunicación', 'Adaptabilidad'];
    const compChips = compSet.map(n => levelChip('comps', n));
    const langSet = ['Español', 'Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano'];
    const langChips = langSet.map(n => levelChip('langs', n));
    const tituloSet = ['Programador web', 'Desarrollador full-stack', 'Diseñador UX/UI', 'Analista de datos'];
    const tituloChips = tituloSet.map(n => ({ label: n, onClick: () => this.set({ titulo: n }), style: this.chipStyle(d.titulo === n) }));
    const btn = (primary, disabled) => ({
      padding: '13px 28px', borderRadius: 999, fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
      cursor: disabled ? 'default' : 'pointer',
      border: primary ? 'none' : '1px solid rgba(15,23,42,.15)',
      background: primary ? '#4B51F6' : 'transparent',
      color: primary ? '#fff' : '#0f172a',
      visibility: disabled ? 'hidden' : 'visible'
    });
    const pv = {
      nombre: d.nombre.trim() || 'Nombre',
      apellido: d.apellido.trim() || 'Apellido',
      titulo: d.titulo.trim() || 'Título profesional',
      perfil: d.perfil.trim() || 'Tu perfil profesional aparecerá aquí a medida que lo escribas.'
    };
    const initials = ((d.nombre.trim()[0] || 'C') + (d.apellido.trim()[0] || 'V')).toUpperCase();
    const contactRows = [d.email.trim() || 'correo@ejemplo.com', d.telefono.trim(), d.web.trim(), d.direccion.trim()].filter(Boolean);
    const expFull = d.exp.filter(r => r.empresa.trim());
    const eduFull = d.edu.filter(r => r.centro.trim());
    return {
      d, e, h, onEnter, onSkillEnter, sideColor,
      stepNum: step + 1, stepTitle: stepDefs[step][1], stepDesc: stepDefs[step][2], stepper,
      s0: step === 0, s1: step === 1, s2: step === 2, s3: step === 3, s4: step === 4, s5: step === 5,
      perfilCount: d.perfil.length,
      expRows, eduRows,
      addExp: () => this.addRow('exp', { anios: '', empresa: '', desc: '' }),
      addEdu: () => this.addRow('edu', { anios: '', centro: '', titulo: '' }),
      skillChips, compChips, langChips, tituloChips,
      prev: () => { if (step > 0) this.go(step - 1); },
      next: () => this.next(),
      prevStyle: btn(false, step === 0), nextStyle: btn(true, step === 5),
      nextLabel: step === 4 ? 'Ver y exportar →' : 'Siguiente →',
      exportPdf: () => window.print(),
      fotoInputRef: this.fotoInputRef,
      pickFoto: () => { if (this.fotoInputRef.current) this.fotoInputRef.current.click(); },
      onFoto: ev => {
        const f = ev.target.files && ev.target.files[0];
        if (!f) return;
        const img = new Image(), url = URL.createObjectURL(f);
        img.onload = () => {
          const max = 512, k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          this.set({ foto: c.toDataURL('image/jpeg', .85) });
        };
        img.src = url;
        ev.target.value = '';
      },
      clearFoto: () => this.set({ foto: '' }),
      fotoBtnLabel: d.foto ? 'Cambiar foto' : 'Subir foto',
      fotoClearStyle: {
        padding: '10px 20px', borderRadius: 999, border: '1px solid rgba(15,23,42,.15)', background: 'transparent',
        color: '#0f172a', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        display: d.foto ? 'inline-block' : 'none'
      },
      fotoThumbStyle: {
        flex: 'none', width: 72, height: 72, borderRadius: '50%', border: '2px solid rgba(15,23,42,.12)',
        background: d.foto ? ('url(' + d.foto + ') center/cover no-repeat') : 'rgba(15,23,42,.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, fontWeight: 800, color: 'rgba(15,23,42,.45)'
      },
      cvInitials: d.foto ? '' : initials,
      restart: () => { this.setState({ step: 0, errors: {}, data: this.blank() }); this.focusSoon(); },
      photoStyle: {
        width: 128, height: 128, margin: '0 auto',
        borderRadius: shape === 'circle' ? '50%' : (shape === 'rounded' ? 22 : 0),
        background: d.foto ? ('url(' + d.foto + ') center/cover no-repeat') : 'rgba(255,255,255,.12)',
        border: '3px solid rgba(255,255,255,.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 42, fontWeight: 800, color: 'rgba(255,255,255,.85)'
      },
      pv, initials, contactRows,
      pvSkills: Object.keys(d.skills).length ? Object.entries(d.skills).map(([name, level]) => ({ name, level })) : [{ name: 'Tus habilidades', level: '' }],
      pvComps: Object.keys(d.comps).length ? Object.entries(d.comps).map(([n, l]) => n + ' · ' + l) : ['Tus competencias'],
      pvLangs: Object.keys(d.langs).length ? Object.entries(d.langs).map(([name, level]) => ({ name, level })) : [{ name: 'Tus idiomas', level: '' }],
      pvExp: expFull.length ? expFull : [{ anios: '20XX - 20XX', empresa: 'Tu experiencia', desc: 'Aparecerá aquí.' }],
      pvEdu: eduFull.length ? eduFull : [{ anios: '20XX - 20XX', centro: 'Tu formación', titulo: 'Aparecerá aquí.' }]
    };
  }
}

if (typeof Component !== 'undefined') {
  if (typeof window !== 'undefined') window.Component = Component;
  if (typeof globalThis !== 'undefined') globalThis.Component = Component;
}
