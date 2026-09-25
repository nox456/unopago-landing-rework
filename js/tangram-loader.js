/**
 * ==============================================================================
 * TANGRAM MORPHING LOADER
 * Animación fluida de 7 polígonos vectoriales SVG inspirados en siluetas Tangram
 * Transición geométrica continua:
 *  - Figura 1 (Silueta #8): Canino/animal cuadrúpedo estilizado
 *  - Figura 2 (Silueta #9): Diamante/flecha apuntando abajo con bloque cuadrado superior
 *  - Figura 3 (Silueta #109): Estrella quebrada / flor geométrica asimétrica
 *
 * Easing: cubic-bezier(0.4, 0, 0.2, 1)
 * ==============================================================================
 */

(function () {
  'use strict';

  // 1. Definición exacta de coordenadas de los 7 polígonos en viewBox="0 0 200 200"
  // Cada polígono se representa con 4 puntos [x, y] (para triángulos el 4to punto duplica el 3ro)
  const TANGRAM_FIGURES = {
    // Figura 1 (Silueta #8 Canónica): Cuadrúpedo / animal angular
    // Lomo horizontal continuo sin hendiduras, hocico afilado, pata delantera a 45° y pata trasera con pie plano
    fig1: [
      // t-1: TL1 (Lomo central con hipotenusa horizontal continua)
      [[55, 65], [140, 65], [97.5, 107.5], [97.5, 107.5]],
      // t-2: TL2 (Torso y caída inclinada de la espalda a 45°)
      [[97.5, 107.5], [140, 65], [182.5, 107.5], [182.5, 107.5]],
      // t-3: TM (Hocico / cabeza afilada proyectada a la izquierda)
      [[15, 65], [55, 65], [55, 107.5], [55, 107.5]],
      // t-4: TS1 (Pezuña / base pata delantera)
      [[10, 155], [40, 155], [25, 137.5], [25, 137.5]],
      // t-5: TS2 (Pie pata trasera con corte angular hacia adentro formando el vientre)
      [[122.5, 137.5], [152.5, 137.5], [152.5, 107.5], [152.5, 107.5]],
      // t-6: SQ (Pantorrilla vertical / corvejón pata trasera)
      [[152.5, 107.5], [182.5, 107.5], [182.5, 137.5], [152.5, 137.5]],
      // t-7: PA (Pata delantera inclinada a 45° extendiéndose abajo a la izquierda)
      [[25, 137.5], [55, 137.5], [85, 107.5], [55, 107.5]]
    ],

    // Figura 2 (Silueta #9): Diamante / flecha rematada por bloque cuadrado
    fig2: [
      // t-1: TL1 (Cuadrante inferior izquierdo del diamante)
      [[40, 100], [100, 100], [100, 160], [100, 160]],
      // t-2: TL2 (Cuadrante inferior derecho del diamante)
      [[100, 100], [160, 100], [100, 160], [100, 160]],
      // t-3: TM (Ala diagonal superior derecha)
      [[100, 100], [160, 100], [130, 70], [130, 70]],
      // t-4: TS1 (Hombro exterior izquierdo)
      [[40, 100], [70, 100], [70, 70], [70, 70]],
      // t-5: TS2 (Hombro interior izquierdo)
      [[70, 100], [70, 70], [100, 70], [100, 70]],
      // t-6: SQ (Bloque superior cuadrado centrado)
      [[85, 70], [115, 70], [115, 40], [85, 40]],
      // t-7: PA (Cuerpo central diagonal)
      [[70, 100], [100, 100], [130, 70], [100, 70]]
    ],

    // Figura 3 (Silueta #109): Estrella quebrada / flor geométrica en movimiento
    fig3: [
      // t-1: TL1 (Aspa inferior izquierda)
      [[40, 105], [100, 105], [40, 165], [40, 165]],
      // t-2: TL2 (Aspa inferior derecha en rotación)
      [[100, 105], [165, 125], [120, 165], [120, 165]],
      // t-3: TM (Punta triangular superior)
      [[95, 35], [125, 65], [65, 65], [65, 65]],
      // t-4: TS1 (Espolón lateral izquierdo puntiagudo)
      [[20, 105], [40, 85], [40, 105], [40, 105]],
      // t-5: TS2 (Aspa de anclaje inferior central)
      [[70, 105], [100, 105], [100, 135], [100, 135]],
      // t-6: SQ (Bloque lateral superior izquierdo)
      [[40, 75], [70, 75], [70, 105], [40, 105]],
      // t-7: PA (Elemento diagonal flotante a la derecha)
      [[80, 75], [120, 75], [140, 95], [100, 95]]
    ]
  };

  const SEQUENCE = ['fig1', 'fig2', 'fig3'];
  const TRANSITION_MS = 900; // ~0.9s de morphing suave
  const PAUSE_MS = 350;      // 0.35s de pausa estática en cada silueta
  const STEP_DURATION = TRANSITION_MS + PAUSE_MS; // 1250ms por fase

  /**
   * Implementación de alta precisión de la curva cubic-bezier(0.4, 0, 0.2, 1)
   */
  function cubicBezier(x1, y1, x2, y2) {
    const cx = 3.0 * x1;
    const bx = 3.0 * (x2 - x1) - cx;
    const ax = 1.0 - cx - bx;

    const cy = 3.0 * y1;
    const by = 3.0 * (y2 - y1) - cy;
    const ay = 1.0 - cy - by;

    function sampleCurveX(t) {
      return ((ax * t + bx) * t + cx) * t;
    }
    function sampleCurveY(t) {
      return ((ay * t + by) * t + cy) * t;
    }
    function sampleCurveDerivativeX(t) {
      return (3.0 * ax * t + 2.0 * bx) * t + cx;
    }

    // Resolver t para x usando Newton-Raphson
    function solveCurveX(x, epsilon = 1e-5) {
      let t0, t1, t2 = x, x2Val, d2;
      for (let i = 0; i < 8; i++) {
        x2Val = sampleCurveX(t2) - x;
        if (Math.abs(x2Val) < epsilon) return t2;
        d2 = sampleCurveDerivativeX(t2);
        if (Math.abs(d2) < 1e-6) break;
        t2 -= x2Val / d2;
      }
      // Fallback a bisección si no converge
      t0 = 0.0;
      t1 = 1.0;
      t2 = x;
      if (t2 < t0) return t0;
      if (t2 > t1) return t1;
      while (t0 < t1) {
        x2Val = sampleCurveX(t2);
        if (Math.abs(x2Val - x) < epsilon) return t2;
        if (x > x2Val) t0 = t2;
        else t1 = t2;
        t2 = (t1 - t0) * 0.5 + t0;
      }
      return t2;
    }

    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      return sampleCurveY(solveCurveX(x));
    };
  }

  const easeInOutCubic = cubicBezier(0.4, 0, 0.2, 1);

  /**
   * Obtiene la paleta activa configurada en el Panel de Administración (localStorage)
   */
  function getActivePalette() {
    let isDark = false;
    try {
      const savedTheme = localStorage.getItem('unopago-theme');
      if (savedTheme) {
        isDark = savedTheme === 'dark';
      } else {
        const rootTheme = document.documentElement.getAttribute('data-theme') ||
                          document.body?.getAttribute('data-theme') ||
                          document.querySelector('[data-theme]')?.getAttribute('data-theme');
        isDark = rootTheme === 'dark';
      }

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

        if (found && Array.isArray(found.colors) && found.colors.length === 5) {
          return { colors: found.colors, isDark, name: found.name };
        }
      }
    } catch (e) {
      console.warn('Error al leer paleta del panel de administración:', e);
    }

    // Paletas predeterminadas de respaldo
    return {
      colors: isDark
        ? ['#0B0E13', '#161B22', '#F0F6FC', '#38BDF8', '#30363D']
        : ['#F8FAFC', '#FFFFFF', '#0F172A', '#4B51F6', '#E2E8F0'],
      isDark,
      name: isDark ? 'Predeterminada Oscuro' : 'Predeterminada Claro'
    };
  }

  // Clase controladora del Loader
  class TangramMorphLoader {
    constructor() {
      this.overlay = document.getElementById('loader-screen');
      if (!this.overlay) return;

      this.polygons = [
        document.getElementById('tp-1') || this.overlay.querySelector('.t-1'),
        document.getElementById('tp-2') || this.overlay.querySelector('.t-2'),
        document.getElementById('tp-3') || this.overlay.querySelector('.t-3'),
        document.getElementById('tp-4') || this.overlay.querySelector('.t-4'),
        document.getElementById('tp-5') || this.overlay.querySelector('.t-5'),
        document.getElementById('tp-6') || this.overlay.querySelector('.t-6'),
        document.getElementById('tp-7') || this.overlay.querySelector('.t-7')
      ].filter(Boolean);

      this.animId = null;
      this.startTime = null;
      this.isDestroyed = false;
      this.initTime = performance.now();
      this.minDisplayTime = 15000; // 15 segundos visible para apreciar las animaciones
      this.isPageLoaded = document.readyState === 'complete';

      this.applyPaletteColors();
      this.bindEvents();
      this.startLoop();
    }

    /**
     * Aplica la paleta de colores activa a los 7 polígonos:
     * - Colores 1 y 2 se usan para 4 triángulos
     * - Colores 3, 4 y 5 se usan para los 3 restantes
     */
    applyPaletteColors() {
      const paletteInfo = getActivePalette();
      const { colors, isDark } = paletteInfo;
      const [c1, c2, c3, c4, c5] = colors;

      // Asignación de 7 piezas:
      // t-1 (TL1) -> Color 1 (Dominante)
      // t-2 (TL2) -> Color 2 (Superficie)
      // t-3 (TM)  -> Color 4 (Acento / CTA)
      // t-4 (TS1) -> Color 1 (Dominante)
      // t-5 (TS2) -> Color 2 (Superficie)
      // t-6 (SQ)  -> Color 5 (Bordes / Neutro)
      // t-7 (PA)  -> Color 3 (Texto / Lectura)
      const pieceColors = [
        c1, // t-1: Color 1
        c2, // t-2: Color 2
        c4, // t-3: Color 4 (Acento)
        c1, // t-4: Color 1
        c2, // t-5: Color 2
        c5, // t-6: Color 5 (Bordes)
        c3  // t-7: Color 3 (Texto)
      ];

      if (this.overlay) {
        this.overlay.style.setProperty('--tangram-c1', c1);
        this.overlay.style.setProperty('--tangram-c2', c2);
        this.overlay.style.setProperty('--tangram-c3', c3);
        this.overlay.style.setProperty('--tangram-c4', c4);
        this.overlay.style.setProperty('--tangram-c5', c5);

        // Fondo del overlay adaptado al modo
        const bgColor = isDark ? (c1 || '#0B0E13') : '#ffffff';
        this.overlay.style.setProperty('--loader-bg', bgColor);

        const strokeColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.16)';
        this.overlay.style.setProperty('--tangram-stroke', strokeColor);
      }

      this.polygons.forEach((polyEl, idx) => {
        if (polyEl && pieceColors[idx]) {
          polyEl.style.fill = pieceColors[idx];
          polyEl.style.stroke = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.16)';
          polyEl.style.strokeWidth = '1px';
        }
      });
    }

    bindEvents() {
      // Escuchar cambios de tema o paleta en localStorage
      window.addEventListener('storage', (e) => {
        if (e.key === 'admin-panel-v1' || e.key === 'unopago-theme') {
          this.applyPaletteColors();
        }
      });

      // Evento de carga de página completa (DOM + imágenes + stylesheets)
      if (!this.isPageLoaded) {
        window.addEventListener('load', () => {
          this.isPageLoaded = true;
          this.checkAndDismiss();
        }, { once: true });
      } else {
        this.checkAndDismiss();
      }

      // Fallback de seguridad máximo
      setTimeout(() => {
        this.isPageLoaded = true;
        this.checkAndDismiss();
      }, 25000);
    }

    checkAndDismiss() {
      const elapsed = performance.now() - this.initTime;
      const remaining = Math.max(0, this.minDisplayTime - elapsed);

      setTimeout(() => {
        this.dismiss();
      }, remaining);
    }

    dismiss() {
      if (!this.overlay || this.isDestroyed) return;
      this.overlay.classList.add('fade-out');

      // Esperar la transición de opacidad (0.5s) y luego remover del flujo
      setTimeout(() => {
        this.destroy();
      }, 520);
    }

    destroy() {
      this.isDestroyed = true;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      if (this.overlay) {
        this.overlay.style.display = 'none';
        this.overlay.setAttribute('aria-hidden', 'true');
      }
    }

    startLoop() {
      const render = (now) => {
        if (this.isDestroyed) return;

        if (!this.startTime) this.startTime = now;
        const totalElapsed = now - this.startTime;

        // Determinar estado actual y siguiente en el ciclo de 3 figuras
        const fullCycle = STEP_DURATION * SEQUENCE.length;
        const cycleProgress = totalElapsed % fullCycle;
        const stepIndex = Math.floor(cycleProgress / STEP_DURATION);
        const nextIndex = (stepIndex + 1) % SEQUENCE.length;

        const timeInStep = cycleProgress % STEP_DURATION;

        // Fase: morphing activo vs pausa estática
        let progress = 0;
        if (timeInStep < TRANSITION_MS) {
          const linearRatio = timeInStep / TRANSITION_MS;
          progress = easeInOutCubic(linearRatio);
        } else {
          progress = 1.0; // Pausa estática alcanzada
        }

        const fromFig = TANGRAM_FIGURES[SEQUENCE[stepIndex]];
        const toFig = TANGRAM_FIGURES[SEQUENCE[nextIndex]];

        // Interpolación de coordenadas de los 7 polígonos
        for (let i = 0; i < 7; i++) {
          const polyEl = this.polygons[i];
          if (!polyEl) continue;

          const fromPts = fromFig[i];
          const toPts = toFig[i];

          // Lerp de cada uno de los 4 vértices
          let ptsStr = '';
          for (let v = 0; v < 4; v++) {
            const x = fromPts[v][0] + (toPts[v][0] - fromPts[v][0]) * progress;
            const y = fromPts[v][1] + (toPts[v][1] - fromPts[v][1]) * progress;
            ptsStr += `${x.toFixed(2)},${y.toFixed(2)} `;
          }

          polyEl.setAttribute('points', ptsStr.trim());
        }

        this.animId = requestAnimationFrame(render);
      };

      this.animId = requestAnimationFrame(render);
    }
  }

  // Inicialización automática cuando el DOM inicial esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.tangramLoaderInstance = new TangramMorphLoader();
    });
  } else {
    window.tangramLoaderInstance = new TangramMorphLoader();
  }

  // Exportar para acceso opcional
  window.TangramMorphLoader = TangramMorphLoader;
})();
