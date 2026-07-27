/* ==========================================================================
   TERRA & MAR BISTRÓ — tarjetas-giro.js
   Las tarjetas del concepto (01/02/03) giran en 3D: el frente solo enseña el
   título, el dorso enseña el texto. En escritorio con ratón ya giran con
   :hover (puro CSS); este script solo cubre click/toque y teclado, que el
   CSS no puede resolver por sí solo.
   ========================================================================== */
(function (doc) {
  'use strict';

  doc.querySelectorAll('.tarjeta--giro').forEach(function (t) {
    function alternar() {
      var girada = t.classList.toggle('esta-girada');
      t.setAttribute('aria-pressed', girada ? 'true' : 'false');
    }

    t.addEventListener('click', alternar);
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      alternar();
    });
  });
})(document);
