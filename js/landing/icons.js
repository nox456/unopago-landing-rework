/* ==========================================================================
   Íconos de la Landing (compartido por el componente y sus módulos)
   ==========================================================================

   Se expone en `window.UnoLanding.icon` y no como `const` global para no
   chocar con las constantes de js/landing.js, que se carga como script
   clásico en la misma página. */

(function () {
  const L = window.UnoLanding = window.UnoLanding || {};

  /* Devuelve un callback `ref` que inyecta el SVG del ícono en el nodo destino.
     Se usa `ref` y no `dangerouslySetInnerHTML` porque React exige un objeto
     `{__html}` y rechaza una cadena suelta (Error #61). */
  L.icon = (d, w = 2) => {
    const html = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
    return el => { if (el && el.innerHTML !== html) el.innerHTML = html; };
  };
})();
