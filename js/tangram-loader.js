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
  // Identificadores de las 7 piezas canónicas del Tangram:
  //  0: TL1 (Triángulo Grande 1) - Catetos: 64, Hipotenusa: 64√2 (4u)
  //  1: TL2 (Triángulo Grande 2) - Catetos: 64, Hipotenusa: 64√2 (4u)
  //  2: TM  (Triángulo Mediano)  - Catetos: 32√2 (2u), Hipotenusa: 64 (2√2u)
  //  3: TS1 (Triángulo Pequeño 1)- Catetos: 32 (√2u), Hipotenusa: 32√2 (2u)
  //  4: TS2 (Triángulo Pequeño 2)- Catetos: 32 (√2u), Hipotenusa: 32√2 (2u)
  //  5: SQ  (Cuadrado)           - Lado: 32 (√2u)
  //  6: PAR (Paralelogramo)      - Base: 32, Inclinación 45°: 32√2 (2u)
  const TANGRAM_FIGURES = {
    // Figura 1: Tangram #8 (Cuadrúpedo / Animal con lomo horizontal continuo)
    fig1: [
      // 0: TL1 (Torso superior con cateto horizontal en el lomo y vertical a la derecha)
      [[84, 52], [148, 52], [148, 116], [148, 116]],
      // 1: TL2 (Torso inferior con cateto vertical a la izquierda y horizontal en vientre)
      [[84, 52], [84, 116], [148, 116], [148, 116]],
      // 2: TM (Grupa / Cadera trasera con ángulo de 90° a la derecha)
      [[148, 52], [180, 84], [148, 116], [148, 116]],
      // 3: TS1 (Hocico / Cabeza afilada proyectada horizontalmente a la izquierda)
      [[20, 84], [52, 84], [52, 52], [52, 52]],
      // 4: TS2 (Pata trasera apoyada en el suelo)
      [[148, 116], [148, 148], [116, 148], [116, 148]],
      // 5: SQ (Cuello / Nuca adyacente al hocico)
      [[52, 52], [84, 52], [84, 84], [52, 84]],
      // 6: PAR (Pata delantera inclinada a 45° abajo a la izquierda)
      [[84, 116], [116, 116], [84, 148], [52, 148]]
    ],

    // Figura 2: Tangram #9 (Diamante simétrico con remate cuadrado)
    fig2: [
      // 0: TL1 (Mitad inferior izquierda del diamante)
      [[36, 100], [100, 100], [100, 164], [100, 164]],
      // 1: TL2 (Mitad inferior derecha del diamante)
      [[100, 100], [164, 100], [100, 164], [100, 164]],
      // 2: TM (Triángulo central superior apuntando hacia arriba)
      [[68, 100], [132, 100], [100, 68], [100, 68]],
      // 3: TS1 (Hombro derecho interior)
      [[100, 68], [132, 68], [132, 100], [132, 100]],
      // 4: TS2 (Hombro derecho exterior)
      [[132, 68], [164, 100], [132, 100], [132, 100]],
      // 5: SQ (Remate cuadrado superior centrado)
      [[84, 36], [116, 36], [116, 68], [84, 68]],
      // 6: PAR (Hombro izquierdo completo en paralelogramo)
      [[36, 100], [68, 100], [100, 68], [68, 68]]
    ],

    // Figura 3: Tangram #109 (Figura dinámica con hueco negativo central)
    fig3: [
      // 0: TL1 (Masa central izquierda sosteniendo el cuadrado)
      [[34, 130], [121, 105.05], [89.97, 161.02], [89.97, 161.02]],
      // 1: TL2 (Masa central derecha rematando en punta a la derecha)
      [[89.97, 161.02], [121, 105.05], [176.97, 136.08], [176.97, 136.08]],
      // 2: TM (Corona superior central apuntando hacia arriba)
      [[42.48, 94.28], [104, 76.64], [64.42, 54.7], [64.42, 54.7]],
      // 3: TS1 (Punta inferior izquierda proyectada hacia abajo)
      [[42.75, 134.85], [82.32, 156.78], [51.57, 165.6], [51.57, 165.6]],
      // 4: TS2 (Punta inferior derecha debajo de TL2)
      [[123.96, 151.28], [185.47, 133.65], [163.53, 173.22], [163.53, 173.22]],
      // 5: SQ (Bloque superior izquierdo sobre TL1)
      [[49.38, 125.59], [80.14, 116.77], [71.32, 86.01], [40.56, 94.83]],
      // 6: PAR (Flanco superior derecho con separación/hueco respecto al cuadrado)
      [[97.17, 118.13], [127.93, 109.31], [149.87, 69.73], [119.11, 78.55]]
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
    //const cx = 3.0 * x1;
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
  window.TangramCore = {
    TANGRAM_FIGURES,
    SEQUENCE,
    TRANSITION_MS,
    PAUSE_MS,
    STEP_DURATION,
    cubicBezier,
    easeInOutCubic,
    getActivePalette
  };
})();

