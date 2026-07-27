/* ==========================================================================
   TERRA & MAR BISTRÓ — carta-ui.js
   Pinta la carta y la bodega a partir de datos/carta.js.

     · filtro por categoría y por alérgeno
     · en escritorio, la foto del plato flota siguiendo al cursor
     · en móvil (o con teclado), el plato se despliega y enseña la foto dentro
     · si la foto todavía no existe se pinta un marcador generativo

   Se vuelve a pintar entero al cambiar de idioma.
   ========================================================================== */
window.TM = window.TM || {};

(function (TM, doc, win) {
  'use strict';

  var C = TM.CARTA;
  var finoYConPuntero = win.matchMedia('(hover: hover) and (pointer: fine)');
  var reducido = win.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var categoriaActiva = 'todo';
  var alergenosFuera = [];          // alérgenos que el usuario quiere evitar
  var busqueda = '';                // texto del buscador (solo en carta.html)
  var fotos = {};                   // id → true (existe) | false (no existe)

  /* ------------------------------------------------------------ utilidades */

  function precio(n) {
    try {
      return new Intl.NumberFormat(TM.idioma, {
        style: 'currency', currency: 'EUR', minimumFractionDigits: 2
      }).format(n);
    } catch (e) {
      return n.toFixed(2) + ' €';
    }
  }

  function txt(campo) {
    return (campo && (campo[TM.idioma] || campo.es)) || '';
  }

  /** Una foto subida desde el panel (data URL) manda sobre el fichero por id. */
  function rutaFoto(plato) { return plato.foto || ('assets/platos/' + plato.id + '.webp'); }
  function rutaFotoCoctel(id) { return 'assets/img/cocteles/' + id + '.webp'; }

  function crear(etiqueta, clase, contenido) {
    var el = doc.createElement(etiqueta);
    if (clase) el.className = clase;
    if (contenido != null) el.textContent = contenido;
    return el;
  }

  /* --------------------------------------------------------------- filtros */

  /** Quita acentos y pasa a minúsculas: buscar "jamon" debe encontrar "jamón". */
  function normalizar(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function pasaFiltro(plato) {
    for (var i = 0; i < alergenosFuera.length; i++) {
      if (plato.alergenos && plato.alergenos.indexOf(alergenosFuera[i]) !== -1) return false;
    }
    if (busqueda) {
      var heno = normalizar(txt(plato.nombre) + ' ' + txt(plato.desc));
      if (heno.indexOf(busqueda) === -1) return false;
    }
    return true;
  }

  /* -------------------------------------------------------- ficha de plato */

  function ficha(plato, indice) {
    var art = crear('article', 'plato reveal');
    art.dataset.plato = plato.id;
    art.style.setProperty('--i', indice % 8);
    if (plato.destacado) art.classList.add('plato--destacado');

    var idFoto = 'foto-' + plato.id;

    var cab = crear('button', 'plato__cab');
    cab.type = 'button';
    cab.setAttribute('aria-expanded', 'false');
    cab.setAttribute('aria-controls', idFoto);
    cab.appendChild(crear('span', 'plato__nombre', txt(plato.nombre)));
    cab.appendChild(crear('span', 'plato__guia'));
    cab.appendChild(crear('span', 'precio', precio(plato.precio)));
    art.appendChild(cab);

    art.appendChild(crear('p', 'plato__desc', txt(plato.desc)));

    if (plato.alergenos && plato.alergenos.length) {
      var ul = crear('ul', 'plato__alergenos');
      ul.setAttribute('aria-label', TM.t('carta.filtrar'));
      plato.alergenos.forEach(function (a) {
        var def = C.alergenos[a];
        ul.appendChild(crear('li', 'alergeno', def ? txt(def) : a));
      });
      art.appendChild(ul);
    }

    // Contenedor desplegable: grid 0fr→1fr se anima sin medir alturas en JS
    var caja = crear('div', 'plato__foto');
    caja.id = idFoto;
    caja.appendChild(medio(plato));
    art.appendChild(caja);

    cab.addEventListener('click', function () {
      var abierto = art.classList.toggle('esta-abierto');
      cab.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      if (abierto) pedirFoto(plato, art);
    });

    // Si "ver fotos" ya estaba activo, este plato se pinta de nuevo (cambio de
    // idioma, de filtro…) sin foto: hay que volver a pedirla, si no se queda
    // en el marcador aunque la foto exista.
    if (doc.body.classList.contains('con-fotos')) pedirFoto(plato, art);

    if (finoYConPuntero.matches) {
      art.addEventListener('pointerenter', function () { flotante.mostrar(plato); });
      art.addEventListener('pointerleave', function () { flotante.ocultar(); });
    }

    return art;
  }

  /**
   * Hueco de la foto. Arranca SIEMPRE con el marcador generativo, que es DOM
   * puro: hereda los colores del tema y no descarga ni un byte.
   *
   * La foto no se pide al pintar la carta, sino la primera vez que el plato
   * se abre o se sobrevuela. Con la mayoría de fotos aún sin subir, hacerlo al
   * cargar significaba diecisiete peticiones fallidas y otros tantos errores
   * en consola en cada visita.
   */
  function medio(plato) {
    var cont = crear('div', 'plato__medio');
    cont.appendChild(marcador(plato));
    return cont;
  }

  /** Intenta traer la foto una sola vez; si no existe, el marcador se queda. */
  function pedirFoto(plato, art) {
    if (fotos[plato.id] === false) return;
    var cont = art.querySelector('.plato__medio');
    if (!cont || cont.dataset.pedida) return;
    cont.dataset.pedida = '1';

    var img = doc.createElement('img');
    img.alt = txt(plato.nombre);
    img.decoding = 'async';
    img.width = 900; img.height = 675;
    img.addEventListener('load', function () {
      fotos[plato.id] = true;
      cont.textContent = '';
      cont.appendChild(img);
      win.requestAnimationFrame(function () { img.classList.add('esta-cargada'); });
    });
    img.addEventListener('error', function () {
      fotos[plato.id] = false;
      delete cont.dataset.pedida;   // por si la foto se sube más tarde
    });
    img.src = rutaFoto(plato);
  }

  function marcador(plato) {
    var m = crear('div', 'marcador');
    m.setAttribute('role', 'img');
    m.setAttribute('aria-label', TM.t('carta.foto.falta') + ': ' + txt(plato.nombre));
    m.appendChild(crear('span', 'marcador__inicial', txt(plato.nombre).trim().charAt(0)));
    m.appendChild(crear('span', 'marcador__nota', TM.t('carta.foto.falta')));
    return m;
  }

  /* ------------------------------------------------- foto flotante (ratón) */

  var flotante = (function () {
    var caja, img, activo = false, actual = null;
    var x = 0, y = 0, dx = 0, dy = 0, raf = 0, colocada = false;

    function crearCaja() {
      caja = crear('div', 'plato-flotante');
      caja.setAttribute('aria-hidden', 'true');
      img = doc.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      caja.appendChild(img);
      doc.body.appendChild(caja);

      doc.addEventListener('pointermove', function (e) {
        dx = e.clientX; dy = e.clientY;
        if (!colocada) { x = dx; y = dy; colocada = true; }
        if (!raf && activo) raf = win.requestAnimationFrame(seguir);
      }, { passive: true });
    }

    function seguir() {
      raf = 0;
      // Amortiguado: la foto persigue al cursor, no se pega a él.
      x += (dx - x) * 0.16;
      y += (dy - y) * 0.16;
      caja.style.transform = 'translate3d(' + (x + 28) + 'px,' + (y - 132) + 'px,0)';
      if (activo) raf = win.requestAnimationFrame(seguir);
    }

    return {
      mostrar: function (p) {
        if (reducido || fotos[p.id] === false) return;
        if (!caja) crearCaja();
        actual = p;
        activo = true;
        img.onload = function () {
          fotos[p.id] = true;
          if (activo && actual === p) caja.classList.add('esta-visible');
        };
        img.onerror = function () {
          fotos[p.id] = false;
          caja.classList.remove('esta-visible');
        };
        img.src = rutaFoto(p);
        if (img.complete && img.naturalWidth) caja.classList.add('esta-visible');
        if (!raf) raf = win.requestAnimationFrame(seguir);
      },
      ocultar: function () {
        activo = false;
        actual = null;
        if (caja) caja.classList.remove('esta-visible');
      }
    };
  })();

  /* ---------------------------------------------------------------- pintar */

  function pintarCategorias() {
    var cont = doc.getElementById('carta-categorias');
    if (!cont) return;
    cont.textContent = '';

    [{ id: 'todo', nombre: null }].concat(C.categorias).forEach(function (cat) {
      var b = crear('button', 'chip');
      b.type = 'button';
      b.textContent = cat.id === 'todo' ? TM.t('carta.todos') : txt(cat.nombre);
      b.setAttribute('aria-pressed', cat.id === categoriaActiva ? 'true' : 'false');
      b.addEventListener('click', function () {
        categoriaActiva = cat.id;
        pintarCategorias();
        pintarPlatos();
      });
      cont.appendChild(b);
    });
  }

  function pintarAlergenos() {
    var cont = doc.getElementById('carta-alergenos');
    if (!cont) return;
    cont.textContent = '';

    Object.keys(C.alergenos).forEach(function (clave) {
      var b = crear('button', 'chip chip--alergeno');
      b.type = 'button';
      b.textContent = txt(C.alergenos[clave]);
      b.setAttribute('aria-pressed', alergenosFuera.indexOf(clave) !== -1 ? 'true' : 'false');
      b.addEventListener('click', function () {
        var i = alergenosFuera.indexOf(clave);
        if (i === -1) { alergenosFuera.push(clave); } else { alergenosFuera.splice(i, 1); }
        pintarAlergenos();
        pintarPlatos();
      });
      cont.appendChild(b);
    });

    var limpiar = doc.getElementById('carta-limpiar');
    if (limpiar) limpiar.hidden = alergenosFuera.length === 0;
  }

  function pintarPlatos() {
    var cont = doc.getElementById('carta-lista');
    if (!cont) return;
    cont.textContent = '';
    var total = 0;

    // Platos de verdad + lo que se haya añadido/editado/borrado desde el panel.
    var todos = TM.ALMACEN_CARTA ? TM.ALMACEN_CARTA.platosEfectivos(C.platos) : C.platos;

    C.categorias.forEach(function (cat) {
      if (categoriaActiva !== 'todo' && categoriaActiva !== cat.id) return;

      var platos = todos.filter(function (p) {
        return p.cat === cat.id && pasaFiltro(p);
      });
      if (!platos.length) return;
      total += platos.length;

      // El nivel del encabezado depende de la página: en la portada la carta
      // cuelga de un h2 de sección, y en carta.html cuelga directamente del h1.
      var bloque = crear('section', 'carta__bloque');
      bloque.appendChild(crear('h' + (cont.dataset.nivel || '3'), 'carta__categoria', txt(cat.nombre)));

      var rejilla = crear('div', 'carta__platos');
      platos.forEach(function (p, i) { rejilla.appendChild(ficha(p, i)); });
      bloque.appendChild(rejilla);
      cont.appendChild(bloque);
    });

    var vacio = doc.getElementById('carta-vacio');
    if (vacio) vacio.hidden = total > 0;

    if (TM.observarReveal) {
      cont.querySelectorAll('.reveal').forEach(TM.observarReveal);
    } else {
      cont.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
    }
  }

  function pintarBodega() {
    var cc = doc.getElementById('bodega-cocteles');
    if (cc) {
      cc.textContent = '';
      C.cocteles.forEach(function (c, i) {
        var art = crear('article', 'coctel reveal');
        art.style.setProperty('--i', i);
        if (c.destacado) art.classList.add('coctel--destacado');

        var fila = crear('div', 'coctel__fila');

        var foto = crear('div', 'coctel__foto');
        var img = doc.createElement('img');
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 128; img.height = 128;
        img.addEventListener('error', function () { foto.remove(); });
        img.src = rutaFotoCoctel(c.id);
        foto.appendChild(img);
        fila.appendChild(foto);

        var texto = crear('div', 'coctel__texto');
        var cab = crear('div', 'coctel__cab');
        cab.appendChild(crear('h' + (cc.dataset.nivel || '4'), 'coctel__nombre', txt(c.nombre)));
        cab.appendChild(crear('span', 'precio', precio(c.precio)));
        texto.appendChild(cab);
        texto.appendChild(crear('p', 'coctel__desc', txt(c.desc)));
        fila.appendChild(texto);

        art.appendChild(fila);
        cc.appendChild(art);
      });
    }

    var cv = doc.getElementById('bodega-vinos');
    if (cv) {
      cv.textContent = '';
      C.vinos.forEach(function (v, i) {
        var fila = crear('article', 'vino reveal');
        fila.style.setProperty('--i', i);
        fila.dataset.tipo = v.tipo;
        var cab = crear('div', 'vino__cab');
        cab.appendChild(crear('h' + (cv.dataset.nivel || '4'), 'vino__nombre', txt(v.nombre)));

        var precios = crear('div', 'vino__precios');
        [['bodega.copa', v.copa], ['bodega.botella', v.botella]].forEach(function (par) {
          var p = crear('span', 'vino__precio');
          p.appendChild(crear('small', null, TM.t(par[0])));
          p.appendChild(crear('span', 'precio', precio(par[1])));
          precios.appendChild(p);
        });
        cab.appendChild(precios);

        fila.appendChild(cab);
        fila.appendChild(crear('p', 'vino__desc', txt(v.desc)));
        cv.appendChild(fila);
      });
    }

    var nuevos = doc.querySelectorAll('#bodega-cocteles .reveal, #bodega-vinos .reveal');
    if (TM.observarReveal) {
      nuevos.forEach(TM.observarReveal);
    } else {
      // En carta.html no se carga escena.js: sin esto se quedarían invisibles.
      nuevos.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  TM.pintarCarta = function () {
    pintarCategorias();
    pintarAlergenos();
    pintarPlatos();
    pintarBodega();
  };

  /* ---------------------------------------------------------------- inicio */

  function iniciar() {
    if (!C || !doc.getElementById('carta-lista')) return;

    var limpiar = doc.getElementById('carta-limpiar');
    if (limpiar) {
      limpiar.addEventListener('click', function () {
        alergenosFuera = [];
        pintarAlergenos();
        pintarPlatos();
      });
    }

    // Buscador y conmutador de fotos: solo existen en la carta QR.
    var buscar = doc.getElementById('carta-buscar');
    if (buscar) {
      buscar.addEventListener('input', function () {
        busqueda = normalizar(buscar.value.trim());
        pintarPlatos();
      });
    }

    var verFotos = doc.getElementById('carta-fotos');
    if (verFotos) {
      verFotos.addEventListener('change', function () {
        doc.body.classList.toggle('con-fotos', verFotos.checked);
        if (!verFotos.checked) return;
        // Al abrirlas todas de golpe hay que pedir cada foto explícitamente.
        var todos = TM.ALMACEN_CARTA ? TM.ALMACEN_CARTA.platosEfectivos(C.platos) : C.platos;
        doc.querySelectorAll('.plato[data-plato]').forEach(function (art) {
          var p = todos.filter(function (x) { return x.id === art.dataset.plato; })[0];
          if (p) pedirFoto(p, art);
        });
      });
    }

    // Los alérgenos vienen desplegados en escritorio y plegados en móvil,
    // donde diez chips se comerían media pantalla.
    var toggle = doc.getElementById('carta-alergenos-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', win.innerWidth > 760 ? 'true' : 'false');
      toggle.addEventListener('click', function () {
        var abierto = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', abierto ? 'false' : 'true');
      });
    }

    TM.pintarCarta();
    doc.addEventListener('tm:idioma', TM.pintarCarta);

    // Un cambio de carta hecho en el panel (otra pestaña) se ve aquí al instante.
    if (TM.ALMACEN_CARTA) {
      win.addEventListener('storage', function (e) {
        if (e.key === TM.ALMACEN_CARTA.clave) TM.pintarCarta();
      });
    }
  }

  // Este script va al final del <body>: el marcado que necesita ya está
  // en el DOM. Arrancar aquí, y no en DOMContentLoaded, evita que el
  // navegador pinte una primera versión sin este contenido y luego lo
  // empuje todo (era la causa del salto de layout).
  iniciar();
})(window.TM, document, window);
