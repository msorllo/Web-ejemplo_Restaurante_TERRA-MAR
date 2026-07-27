/* ==========================================================================
   TERRA & MAR BISTRÓ — tema.js
   Modo DÍA (Bistró) ↔ modo NOCHE (Bodega & Coctelería).

   El tema inicial lo fija un script en línea en el <head> (ver TM.temaInicial)
   para que no haya parpadeo antes del primer pintado. Este fichero solo se
   ocupa del cambio manual y de avisar al resto de módulos.
   ========================================================================== */
window.TM = window.TM || {};

(function (TM, doc) {
  'use strict';

  var CLAVE = 'tm_tema';
  var raiz = doc.documentElement;

  // El script en línea del <head> ya dejó puesto data-tema.
  TM.tema = raiz.getAttribute('data-tema') === 'noche' ? 'noche' : 'dia';

  TM.cambiarTema = function (nuevo, manual) {
    if (nuevo !== 'dia' && nuevo !== 'noche') return;
    if (nuevo === TM.tema) return;

    TM.tema = nuevo;
    raiz.setAttribute('data-tema', nuevo);

    if (manual !== false) {
      try { localStorage.setItem(CLAVE, nuevo); } catch (e) { /* ignorar */ }
    }

    // Las transiciones de color solo se activan durante el cambio: pagar su
    // coste de forma permanente frenaría el scroll en móvil.
    raiz.classList.add('tema-cambiando');
    clearTimeout(TM._temaTimer);
    TM._temaTimer = setTimeout(function () {
      raiz.classList.remove('tema-cambiando');
    }, 750);

    sincronizar();
    if (TM.aplicarTextos) TM.aplicarTextos();
    doc.dispatchEvent(new CustomEvent('tm:tema', { detail: { tema: nuevo } }));
  };

  TM.alternarTema = function () {
    TM.cambiarTema(TM.tema === 'noche' ? 'dia' : 'noche');
  };

  function sincronizar() {
    var esNoche = TM.tema === 'noche';
    doc.querySelectorAll('[data-alternar-tema]').forEach(function (b) {
      b.setAttribute('aria-pressed', esNoche ? 'true' : 'false');
      b.setAttribute('aria-label', TM.t(esNoche ? 'nav.tema.dia' : 'nav.tema.noche'));
      b.setAttribute('title', TM.t(esNoche ? 'nav.tema.dia' : 'nav.tema.noche'));
    });
    var meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', esNoche ? '#0F1319' : '#FAF6EF');
  }

  function iniciar() {
    doc.querySelectorAll('[data-alternar-tema]').forEach(function (b) {
      b.addEventListener('click', function () { TM.alternarTema(); });
    });
    sincronizar();
    doc.addEventListener('tm:idioma', sincronizar);
  }

  // Este script va al final del <body>: el marcado que necesita ya está
  // en el DOM. Arrancar aquí, y no en DOMContentLoaded, evita que el
  // navegador pinte una primera versión sin este contenido y luego lo
  // empuje todo (era la causa del salto de layout).
  iniciar();
})(window.TM, document);
