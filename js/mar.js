/* ==========================================================================
   TERRA & MAR BISTRÓ — mar.js
   El elemento vivo de la web: la ola del logo hecha superficie de agua.

   Canvas 2D puro, sin dependencias. Cuatro capas de ondas superpuestas que
   avanzan a distinta velocidad y se hunden hacia el color de fondo, de modo
   que el hero desemboca en la página como el mar en la orilla.

   Reglas de rendimiento:
     · DPR limitado a 2 (a 1.4 en móvil)
     · se detiene si el canvas no está visible o la pestaña está oculta
     · con prefers-reduced-motion dibuja un solo fotograma y para
   ========================================================================== */
window.TM = window.TM || {};

(function (TM, doc, win) {
  'use strict';

  var TAU = Math.PI * 2;
  var reducido = win.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var lienzo, ctx, ancho = 0, alto = 0, dpr = 1;
  var animando = false, visible = true, rafId = 0;
  var raton = { x: 0.5, objetivo: 0, actual: 0 };
  var paleta = [];

  /* Cada capa: profundidad, amplitud, tres frecuencias y velocidad.
     Las frecuencias no son múltiplos entre sí (1.15 / 2.37 / 4.13…), así el
     perfil de la ola nunca se repite de forma reconocible: es lo que separa
     "agua" de "banda decorativa". */
  var CAPAS = [
    { y: 0.24, amp: 34, f1: 1.15, f2: 2.37, f3: 4.13, vel: 0.00015, alfa: 0.17, color: 2 },
    { y: 0.43, amp: 29, f1: 1.43, f2: 2.91, f3: 5.29, vel: 0.00023, alfa: 0.25, color: 1 },
    { y: 0.63, amp: 24, f1: 1.77, f2: 3.53, f3: 6.11, vel: 0.00033, alfa: 0.36, color: 0 },
    { y: 0.85, amp: 19, f1: 2.19, f2: 4.31, f3: 7.67, vel: 0.00046, alfa: 1.00, color: 3 }
  ];

  /* ------------------------------------------------------------- utilidades */

  function leerPaleta() {
    var e = getComputedStyle(doc.documentElement);
    var alfa = parseFloat(e.getPropertyValue('--mar-alfa')) || 0.3;
    paleta = [
      e.getPropertyValue('--mar-1').trim(),
      e.getPropertyValue('--mar-2').trim(),
      e.getPropertyValue('--mar-3').trim(),
      e.getPropertyValue('--mar-fondo').trim()
    ];
    paleta.alfa = alfa;
  }

  function dimensionar() {
    var r = lienzo.getBoundingClientRect();
    if (!r.width || !r.height) return false;

    // En pantallas pequeñas se renderiza a menos resolución: se nota igual de
    // bien y ahorra la mitad de píxeles a pintar en cada fotograma.
    var tope = win.innerWidth < 760 ? 1.4 : 2;
    dpr = Math.min(win.devicePixelRatio || 1, tope);

    ancho = Math.round(r.width);
    alto = Math.round(r.height);
    lienzo.width = Math.round(ancho * dpr);
    lienzo.height = Math.round(alto * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  /* ---------------------------------------------------------------- dibujo */

  function dibujar(t) {
    ctx.clearRect(0, 0, ancho, alto);

    // La influencia del ratón se acerca a su objetivo poco a poco: nada salta.
    raton.actual += (raton.objetivo - raton.actual) * 0.06;

    var sigma = ancho * 0.16;
    var dos_sigma2 = 2 * sigma * sigma;
    var paso = ancho > 1100 ? 9 : 6;
    var mx = raton.x * ancho;
    var puntos = [];

    for (var c = 0; c < CAPAS.length; c++) {
      var capa = CAPAS[c];
      var base = alto * capa.y;
      var fase1 = t * capa.vel;
      var fase2 = -t * capa.vel * 0.62;
      var fase3 = t * capa.vel * 0.37;
      var n = 0;

      for (var x = 0; x <= ancho + paso; x += paso) {
        var u = x / ancho;
        var y = base +
          capa.amp * 1.00 * Math.sin(u * capa.f1 * TAU + fase1) +
          capa.amp * 0.42 * Math.sin(u * capa.f2 * TAU + fase2) +
          capa.amp * 0.18 * Math.sin(u * capa.f3 * TAU + fase3);

        // Elevación suave bajo el cursor: el agua responde a quien mira.
        var d = x - mx;
        y -= raton.actual * capa.amp * 1.5 * Math.exp(-(d * d) / dos_sigma2);

        puntos[n++] = x;
        puntos[n++] = y;
      }

      // Relleno de la masa de agua
      ctx.beginPath();
      ctx.moveTo(0, alto);
      for (var i = 0; i < n; i += 2) ctx.lineTo(puntos[i], puntos[i + 1]);
      ctx.lineTo(ancho, alto);
      ctx.closePath();
      ctx.globalAlpha = capa.alfa === 1 ? 1 : capa.alfa * paleta.alfa;
      ctx.fillStyle = paleta[capa.color];
      ctx.fill();

      // Línea de cresta: el brillo del borde es lo que hace que se lea agua
      // y no una franja de color. La capa opaca del frente no la lleva.
      if (capa.alfa !== 1) {
        ctx.beginPath();
        ctx.moveTo(puntos[0], puntos[1]);
        for (i = 2; i < n; i += 2) ctx.lineTo(puntos[i], puntos[i + 1]);
        ctx.globalAlpha = Math.min(1, capa.alfa * paleta.alfa * 2.1);
        ctx.strokeStyle = paleta[capa.color];
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------------ bucle */

  function bucle(t) {
    dibujar(t);
    if (animando) rafId = win.requestAnimationFrame(bucle);
  }

  function arrancar() {
    if (animando || reducido || !visible || doc.hidden) return;
    animando = true;
    rafId = win.requestAnimationFrame(bucle);
  }

  function parar() {
    animando = false;
    if (rafId) win.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  /* ----------------------------------------------------------------- inicio */

  function iniciar() {
    lienzo = doc.getElementById('mar');
    if (!lienzo) return;
    ctx = lienzo.getContext('2d', { alpha: true });
    if (!ctx) return;

    leerPaleta();
    if (!dimensionar()) return;
    dibujar(0);

    if (reducido) return; // un fotograma y se queda quieto

    if ('IntersectionObserver' in win) {
      new IntersectionObserver(function (ent) {
        visible = ent[0].isIntersecting;
        visible ? arrancar() : parar();
      }, { threshold: 0 }).observe(lienzo);
    }

    doc.addEventListener('visibilitychange', function () {
      doc.hidden ? parar() : arrancar();
    });

    // El cursor levanta la ola; al salir, vuelve a su sitio.
    var padre = lienzo.parentElement || lienzo;
    padre.addEventListener('pointermove', function (e) {
      var r = lienzo.getBoundingClientRect();
      raton.x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      raton.objetivo = 1;
    }, { passive: true });
    padre.addEventListener('pointerleave', function () { raton.objetivo = 0; }, { passive: true });

    var temporizador;
    win.addEventListener('resize', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(function () {
        if (dimensionar() && !animando) dibujar(performance.now());
      }, 150);
    }, { passive: true });

    // Al cambiar de tema, el agua cambia de color con él.
    doc.addEventListener('tm:tema', function () {
      leerPaleta();
      if (!animando) dibujar(performance.now());
    });

    arrancar();
  }

  // Este script va al final del <body>: el marcado que necesita ya está
  // en el DOM. Arrancar aquí, y no en DOMContentLoaded, evita que el
  // navegador pinte una primera versión sin este contenido y luego lo
  // empuje todo (era la causa del salto de layout).
  iniciar();
})(window.TM, document, window);
