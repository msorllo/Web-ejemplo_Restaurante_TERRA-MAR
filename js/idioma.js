/* ==========================================================================
   TERRA & MAR BISTRÓ — idioma.js
   Traducción en caliente ES / EN / FR sin recargar la página.

   Marcado soportado:
     data-i18n="clave"                  → textContent
     data-i18n-html="clave"             → innerHTML (para textos con <em>)
     data-i18n-attr="placeholder:clave;aria-label:otra"
     data-i18n-tema="hero.titulo"       → resuelve hero.titulo.dia | .noche
   ========================================================================== */
window.TM = window.TM || {};

(function (TM, doc) {
  'use strict';

  var CLAVE = 'tm_idioma';
  var POR_DEFECTO = 'es';
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function detectar() {
    var guardado;
    try { guardado = localStorage.getItem(CLAVE); } catch (e) { /* modo privado */ }
    if (guardado && TM.IDIOMAS.indexOf(guardado) !== -1) return guardado;

    var nav = (navigator.languages || [navigator.language || ''])[0] || '';
    var corto = nav.toLowerCase().slice(0, 2);
    return TM.IDIOMAS.indexOf(corto) !== -1 ? corto : POR_DEFECTO;
  }

  TM.idioma = detectar();

  /**
   * Traduce una clave. Sustituye {marcadores} por los valores de `vars`.
   * Si la clave no existe cae al español y, en último caso, devuelve la clave
   * (así un hueco de traducción se ve en pantalla en vez de quedar en blanco).
   */
  TM.t = function (clave, vars) {
    var dicc = TM.I18N[TM.idioma] || TM.I18N[POR_DEFECTO];
    var txt = dicc[clave];
    if (txt == null) txt = TM.I18N[POR_DEFECTO][clave];
    if (txt == null) return clave;
    if (vars) {
      txt = txt.replace(/\{(\w+)\}/g, function (m, k) {
        return vars[k] != null ? vars[k] : m;
      });
    }
    return txt;
  };

  /** Aplica las traducciones a todo el DOM (o a un subárbol). */
  TM.aplicarTextos = function (raiz) {
    raiz = raiz || doc;

    raiz.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = TM.t(el.getAttribute('data-i18n'));
    });

    raiz.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = TM.t(el.getAttribute('data-i18n-html'));
    });

    // Textos que cambian con el tema día/noche
    raiz.querySelectorAll('[data-i18n-tema]').forEach(function (el) {
      el.textContent = TM.t(el.getAttribute('data-i18n-tema') + '.' + (TM.tema || 'dia'));
    });

    raiz.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (par) {
        var i = par.indexOf(':');
        if (i < 0) return;
        el.setAttribute(par.slice(0, i).trim(), TM.t(par.slice(i + 1).trim()));
      });
    });

    if (raiz === doc) {
      doc.documentElement.lang = TM.idioma;
      var titulo = doc.querySelector('title[data-i18n]');
      if (titulo) doc.title = TM.t(titulo.getAttribute('data-i18n'));
      // Cada página declara su propia clave; si no, se usa la de la portada.
      var desc = doc.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content', TM.t(desc.getAttribute('data-i18n') || 'meta.desc'));
    }
  };

  TM.cambiarIdioma = function (nuevo) {
    if (TM.IDIOMAS.indexOf(nuevo) === -1 || nuevo === TM.idioma) return;

    function aplicar() {
      TM.idioma = nuevo;
      try { localStorage.setItem(CLAVE, nuevo); } catch (e) { /* ignorar */ }
      TM.aplicarTextos();
      sincronizarBotones();
      doc.dispatchEvent(new CustomEvent('tm:idioma', { detail: { idioma: nuevo } }));
    }

    if (reducido) { aplicar(); return; }

    // El texto no se puede interpolar como un color: se hace un parpadeo
    // breve (opacidad a 0, se cambia el texto ya invisible, vuelve a 1) para
    // que el cambio se lea como una animación, igual que el sol/luna.
    var raiz = doc.documentElement;
    raiz.classList.add('idioma-cambiando');
    clearTimeout(TM._idiomaTimer);
    TM._idiomaTimer = setTimeout(function () {
      aplicar();
      requestAnimationFrame(function () {
        raiz.classList.remove('idioma-cambiando');
      });
    }, 160);
  };

  function sincronizarBotones() {
    doc.querySelectorAll('[data-idioma]').forEach(function (b) {
      var activo = b.getAttribute('data-idioma') === TM.idioma;
      b.setAttribute('aria-pressed', activo ? 'true' : 'false');
      b.classList.toggle('esta-activo', activo);
    });

    // El disparador enseña la bandera + código corto (ES/EN/FR): el menú, al
    // desplegarse, puede permitirse el nombre completo del idioma.
    doc.querySelectorAll('.idiomas--desplegable').forEach(function (grupo) {
      var activo = grupo.querySelector('[data-idioma].esta-activo');
      var actual = grupo.querySelector('.idiomas__actual');
      if (!activo || !actual) return;
      var bandera = activo.querySelector('.idiomas__bandera');
      var codigo = activo.getAttribute('data-idioma').toUpperCase();
      actual.innerHTML = '';
      if (bandera) actual.appendChild(bandera.cloneNode(true));
      actual.appendChild(doc.createTextNode(codigo));
    });
  }

  function cerrarDesplegables() {
    doc.querySelectorAll('.idiomas--desplegable.esta-abierto').forEach(function (grupo) {
      grupo.classList.remove('esta-abierto');
      var disparador = grupo.querySelector('.idiomas__disparador');
      if (disparador) disparador.setAttribute('aria-expanded', 'false');
    });
  }

  function iniciar() {
    doc.querySelectorAll('[data-idioma]').forEach(function (b) {
      b.addEventListener('click', function () {
        TM.cambiarIdioma(b.getAttribute('data-idioma'));
        cerrarDesplegables();
      });
    });

    doc.querySelectorAll('.idiomas--desplegable').forEach(function (grupo) {
      var disparador = grupo.querySelector('.idiomas__disparador');
      if (!disparador) return;
      disparador.addEventListener('click', function (e) {
        e.stopPropagation();
        var yaAbierto = grupo.classList.contains('esta-abierto');
        cerrarDesplegables();
        if (!yaAbierto) {
          grupo.classList.add('esta-abierto');
          disparador.setAttribute('aria-expanded', 'true');
        }
      });
    });

    doc.addEventListener('click', function (e) {
      if (!e.target.closest('.idiomas--desplegable')) cerrarDesplegables();
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cerrarDesplegables();
    });

    TM.aplicarTextos();
    sincronizarBotones();
  }

  // Este script va al final del <body>: el marcado que necesita ya está
  // en el DOM. Arrancar aquí, y no en DOMContentLoaded, evita que el
  // navegador pinte una primera versión sin este contenido y luego lo
  // empuje todo (era la causa del salto de layout).
  iniciar();
})(window.TM, document);
