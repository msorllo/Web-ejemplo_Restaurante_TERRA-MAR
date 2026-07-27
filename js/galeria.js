/* ==========================================================================
   TERRA & MAR BISTRÓ — galeria.js
   Galería de scroll horizontal.

   En escritorio la sección se ancla (sticky) y el carril se desplaza en X
   según el avance vertical del scroll. En móvil NO se secuestra el scroll:
   degrada a un carrusel nativo con scroll-snap, que en táctil va infinitamente
   mejor que cualquier reimplementación en JS.
   ========================================================================== */
window.TM = window.TM || {};

(function (TM, doc, win) {
  'use strict';

  var anclable = win.matchMedia('(min-width: 861px)');
  var reducido = win.matchMedia('(prefers-reduced-motion: reduce)');

  var seccion, pin, carril;
  var activo = false;
  var recorrido = 0;   // píxeles que el carril debe desplazarse en X
  var arriba = 0;      // posición del inicio de la sección en la página

  function puedeAnclar() {
    return anclable.matches && !reducido.matches;
  }

  function medir() {
    if (!seccion) return;

    if (!puedeAnclar()) {
      activo = false;
      seccion.classList.remove('esta-anclada');
      seccion.style.height = '';
      carril.style.transform = '';
      return;
    }

    activo = true;
    seccion.classList.add('esta-anclada');

    // El carril debe recorrer todo su ancho menos el visible. La altura de la
    // sección se ajusta para que ese recorrido consuma exactamente el mismo
    // número de píxeles de scroll vertical: así la sensación es 1:1.
    seccion.style.height = 'auto';
    var anchoCarril = carril.scrollWidth;
    var visible = pin.clientWidth;
    recorrido = Math.max(0, anchoCarril - visible);
    seccion.style.height = (recorrido + win.innerHeight) + 'px';

    arriba = seccion.getBoundingClientRect().top + (win.scrollY || win.pageYOffset);
    pintar(win.scrollY || win.pageYOffset);
  }

  function pintar(y) {
    if (!activo) return;
    var p = (y - arriba) / Math.max(1, recorrido);
    p = p < 0 ? 0 : (p > 1 ? 1 : p);
    carril.style.transform = 'translate3d(' + (-p * recorrido).toFixed(1) + 'px,0,0)';
    seccion.style.setProperty('--avance', p.toFixed(4));
  }

  function iniciar() {
    seccion = doc.getElementById('galeria');
    if (!seccion) return;
    pin = seccion.querySelector('.galeria__pin');
    carril = seccion.querySelector('.galeria__carril');
    if (!pin || !carril) return;

    // Las fotos deben estar medidas antes de calcular el recorrido.
    var imgs = carril.querySelectorAll('img');
    var pendientes = 0;
    imgs.forEach(function (img) {
      if (img.complete) return;
      pendientes++;
      img.addEventListener('load', function () { if (!--pendientes) medir(); }, { once: true });
      img.addEventListener('error', function () { if (!--pendientes) medir(); }, { once: true });
    });

    medir();
    if (TM.enScroll) { TM.enScroll(pintar); }
    if (TM.alRedimensionar) { TM.alRedimensionar(medir); }
    anclable.addEventListener('change', medir);
    reducido.addEventListener('change', medir);

    // El punto de partida del recorrido ("arriba") se queda obsoleto si algo
    // por encima de la galería cambia de alto después de medir: el titular
    // del hero es más largo de noche, o una fuente que termina de cargar
    // reflowa el texto. Sin esto, el scroll y las fotos dejan de ir
    // sincronizados y la galería parece atascada o rota.
    if ('ResizeObserver' in win) {
      var reMedirPendiente = false;
      var ro = new ResizeObserver(function () {
        if (reMedirPendiente) return;
        reMedirPendiente = true;
        win.requestAnimationFrame(function () { reMedirPendiente = false; medir(); });
      });
      ro.observe(doc.body);
    }
  }

  // Este script va al final del <body>: el marcado que necesita ya está
  // en el DOM. Arrancar aquí, y no en DOMContentLoaded, evita que el
  // navegador pinte una primera versión sin este contenido y luego lo
  // empuje todo (era la causa del salto de layout).
  iniciar();
})(window.TM, document, window);
