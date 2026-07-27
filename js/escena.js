/* ==========================================================================
   TERRA & MAR BISTRÓ — escena.js
   Un único bucle de scroll para toda la página:
     · condensación de la barra de navegación
     · hero cinematográfico por capas
     · reveals al entrar en viewport
     · menú móvil
     · indicador "abierto ahora"
   Todo con transform/opacity y listeners pasivos.
   ========================================================================== */
window.TM = window.TM || {};

(function (TM, doc, win) {
  'use strict';

  var reducido = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pendiente = false;
  var capas = [];
  var hero, nav, alturaHero = 1;

  /* Otros módulos (la galería) se cuelgan de este mismo bucle en lugar de
     abrir el suyo: un único rAF y un único listener de scroll en toda la web. */
  var extras = [];
  TM.enScroll = function (fn) { extras.push(fn); };
  TM.alRedimensionar = function (fn) { redimensionadores.push(fn); };
  var redimensionadores = [];

  /* ---------------------------------------------------------------- scroll */

  function medir() {
    if (hero) alturaHero = Math.max(1, hero.offsetHeight);
    for (var i = 0; i < redimensionadores.length; i++) redimensionadores[i]();
  }

  function pintar() {
    pendiente = false;
    var y = win.scrollY || win.pageYOffset;

    /* Navegación: transparente sobre el hero, cristal condensado después.
       El umbral es el 62 % del hero para que el cambio ocurra antes de que
       el texto claro quede sobre fondo claro. */
    if (nav) {
      var pasado = y > (hero ? alturaHero * 0.62 : 40);
      nav.classList.toggle('nav--condensada', pasado);
      nav.classList.toggle('nav--sobre-hero', !pasado);
    }

    /* Hero por capas: cada capa se mueve a su velocidad */
    if (!reducido && hero && y < alturaHero * 1.2) {
      var p = Math.min(1, y / alturaHero);
      for (var i = 0; i < capas.length; i++) {
        var c = capas[i];
        c.el.style.transform =
          'translate3d(0,' + (p * c.v * 100).toFixed(2) + 'px,0)' +
          (c.z ? ' scale(' + (1 + p * c.z).toFixed(4) + ')' : '');
        if (c.f) c.el.style.opacity = Math.max(0, 1 - p * c.f).toFixed(3);
      }
      hero.style.setProperty('--progreso', p.toFixed(4));
    }

    for (var j = 0; j < extras.length; j++) extras[j](y);
  }

  function alHacerScroll() {
    if (!pendiente) { pendiente = true; win.requestAnimationFrame(pintar); }
  }

  /* --------------------------------------------------------------- reveals */

  function iniciarReveals() {
    // Reparte el retardo escalonado entre los hijos de cada [data-stagger]
    doc.querySelectorAll('[data-stagger]').forEach(function (grupo) {
      Array.prototype.forEach.call(grupo.children, function (hijo, i) {
        hijo.style.setProperty('--i', i);
      });
    });

    var objetivos = doc.querySelectorAll('.reveal');
    if (reducido || !('IntersectionObserver' in win)) {
      objetivos.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    objetivos.forEach(function (el) { obs.observe(el); });
    TM.observarReveal = function (el) { obs.observe(el); };
  }

  /* ------------------------------------------------------------ menú móvil */

  function iniciarMenu() {
    var boton = doc.getElementById('hamburguesa');
    var menu = doc.getElementById('menu-movil');
    if (!boton || !menu) return;

    function abrir(si) {
      doc.body.classList.toggle('menu-abierto', si);
      boton.setAttribute('aria-expanded', si ? 'true' : 'false');
      boton.setAttribute('aria-label', TM.t(si ? 'nav.cerrar' : 'nav.menu'));
      if (si) { menu.removeAttribute('inert'); } else { menu.setAttribute('inert', ''); }
      doc.body.style.overflow = si ? 'hidden' : '';
      if (si) {
        var primero = menu.querySelector('a');
        if (primero) primero.focus({ preventScroll: true });
      }
    }

    boton.addEventListener('click', function () {
      abrir(!doc.body.classList.contains('menu-abierto'));
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) abrir(false);
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && doc.body.classList.contains('menu-abierto')) {
        abrir(false);
        boton.focus();
      }
    });

    // Si se pasa a escritorio con el menú abierto, cerrarlo.
    win.matchMedia('(min-width: 961px)').addEventListener('change', function (e) {
      if (e.matches) abrir(false);
    });
  }

  /* --------------------------------------------- indicador "abierto ahora" */

  function pintarEstado() {
    var nodos = doc.querySelectorAll('[data-estado]');
    if (!nodos.length) return;

    var e = TM.estadoAhora();
    var texto, abierto = !!e.abierto;

    if (abierto) {
      texto = TM.t('estado.abierto') + ' · ' + TM.t('estado.cierra', { hora: e.cierra });
    } else if (e.abre != null) {
      var dias = new Intl.DateTimeFormat(TM.idioma, { weekday: 'long' });
      var ref = new Date();
      ref.setDate(ref.getDate() + (e.enDias || 0));
      var nombreDia = e.enDias === 0 ? '' : dias.format(ref);
      texto = TM.t('estado.cerrado') + ' · ' +
              TM.t('estado.abre', { dia: nombreDia, hora: e.abre }).replace(/\s+/g, ' ');
    } else {
      texto = TM.t('estado.cerrado');
    }

    nodos.forEach(function (n) {
      n.textContent = texto;
      n.classList.toggle('esta-abierto', abierto);
      n.classList.toggle('esta-cerrado', !abierto);
    });
  }

  /* ---------------------------------------------------------------- inicio */

  function iniciar() {
    nav = doc.getElementById('nav');
    hero = doc.querySelector('.hero');

    doc.querySelectorAll('[data-capa]').forEach(function (el) {
      var cfg = el.getAttribute('data-capa').split(',');
      capas.push({
        el: el,
        v: parseFloat(cfg[0]) || 0,   // desplazamiento vertical (× 100 px)
        f: parseFloat(cfg[1]) || 0,   // desvanecido
        z: parseFloat(cfg[2]) || 0    // zoom
      });
    });

    medir();
    iniciarReveals();
    iniciarMenu();
    pintarEstado();
    pintar();

    win.addEventListener('scroll', alHacerScroll, { passive: true });
    win.addEventListener('resize', function () { medir(); alHacerScroll(); }, { passive: true });
    doc.addEventListener('tm:idioma', pintarEstado);
    setInterval(pintarEstado, 60000);

    var anyo = doc.getElementById('anyo');
    if (anyo) anyo.textContent = new Date().getFullYear();
  }

  // Este script va al final del <body>: el marcado que necesita ya está
  // en el DOM. Arrancar aquí, y no en DOMContentLoaded, evita que el
  // navegador pinte una primera versión sin este contenido y luego lo
  // empuje todo (era la causa del salto de layout).
  iniciar();
})(window.TM, document, window);
