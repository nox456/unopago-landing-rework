/* ==========================================================================
   Galería bajo el video (carrusel de imágenes de 3 en 3)
   ==========================================================================

   Marcado:  landing.html, sección "Galería de imágenes".
   Estilos:  css/landing/gallery.css (clases .gal*).
   Datos:    localStorage `unopago-gallery-v1`, lo escribe admin.html.

   Igual que el reproductor: el componente crea una `Gallery`, el estado
   (`gallery`, `gPage`) vive en el componente y `renderVals()` mezcla `vals()`. */

(function () {
  const L = window.UnoLanding = window.UnoLanding || {};
  const I = L.icon;

  /* Galería bajo el video: estática, las flechas avanzan de 3 en 3.
     Las imágenes se cargan y recortan desde el panel de administración;
     mientras no haya ninguna se muestran placeholders numerados. */
  const GALLERY_KEY = 'unopago-gallery-v1';
  const GALLERY_PER_PAGE = 3;
  const GALLERY_GAP = 24;   /* px entre imágenes; debe coincidir con el `gap` del track */
  const GALLERY_ICON = I('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>', 1.6);
  const GALLERY_PLACEHOLDERS = Array.from({ length: 9 }, (_, i) => ({ label: 'Imagen ' + (i + 1), svg: GALLERY_ICON, src: '', isImg: false, isPh: true }));

  const readGallery = () => {
    try {
      const list = JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]');
      const imgs = Array.isArray(list) ? list.filter(g => g && g.src) : [];
      if (!imgs.length) return GALLERY_PLACEHOLDERS;
      return imgs.map(g => ({ label: g.name || '', svg: null, src: g.src, isImg: true, isPh: false }));
    } catch (e) { return GALLERY_PLACEHOLDERS; }
  };

  class Gallery {
    /* Estado inicial que el componente mezcla en su `state`. */
    static initialState = { gPage: 0, gallery: GALLERY_PLACEHOLDERS };

    constructor(host) {
      this.host = host;
    }

    get state() { return this.host.state; }

    setState(update, cb) { this.host.setState(update, cb); }

    /* ---- Ciclo de vida (lo llama el componente) ---- */

    mount() {
      this.setState({ gallery: readGallery() });
    }

    /* El panel de administración corre en otra pestaña: recarga al vuelo. */
    onStorage(e) {
      if (e.key === GALLERY_KEY) this.setState({ gallery: readGallery() });
    }

    /* Valores `g*` que lee la plantilla. */
    vals() {
      const gallery = this.state.gallery;
      const gPages = Math.max(1, Math.ceil(gallery.length / GALLERY_PER_PAGE));
      const gPage = Math.min(this.state.gPage, gPages - 1);
      const gGo = i => this.setState({ gPage: ((i % gPages) + gPages) % gPages });
      return {
        gallery,
        gPrev: () => gGo(gPage - 1),
        gNext: () => gGo(gPage + 1),
        gShift: 'translateX(calc(' + (-gPage) + ' * (100% + ' + GALLERY_GAP + 'px)))',
        gStatus: 'Imágenes ' + (gPage * GALLERY_PER_PAGE + 1) + ' a ' + Math.min(gallery.length, (gPage + 1) * GALLERY_PER_PAGE) + ' de ' + gallery.length,
        gDots: Array.from({ length: gPages }, (_, i) => ({
          go: () => gGo(i),
          label: 'Ir al grupo ' + (i + 1),
          current: i === gPage ? 'true' : 'false',
          width: i === gPage ? '34px' : '14px',
          bg: i === gPage ? 'var(--c-cta)' : 'var(--c-border)'
        }))
      };
    }
  }

  L.Gallery = Gallery;
})();
