/* ==========================================================================
   TERRA & MAR BISTRÓ — panel-carta.js
   Gestión de la carta desde el panel: añadir, editar y borrar platos sin
   tocar código. Los cambios se guardan en TM.ALMACEN_CARTA (localStorage) y
   se ven al instante en la web y en la carta QR — incluso en otra pestaña.

   El panel es solo en español (README): los platos que se crean aquí llevan
   únicamente texto en español. La web ya sabe qué hacer con eso: cuando
   falta la traducción a inglés o francés, enseña el español (js/idioma.js,
   TM.t). No es un descuido, es la manera de que un plato nuevo se pueda
   publicar en el momento, sin esperar a que alguien lo traduzca.
   ========================================================================== */
(function (TM, doc, win) {
  'use strict';

  if (!TM.CARTA || !TM.ALMACEN_CARTA) return;

  var editandoId = null;
  // undefined = sin cambios · null = se ha quitado la foto · string = foto nueva (data URL)
  var fotoPendiente;

  /* ---------------------------------------------------------- utilidades */

  function escapar(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function txt(campo) { return (campo && campo.es) || ''; }

  function euros(n) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
  }

  function slugificar(s) {
    return String(s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'plato';
  }

  function idUnico(base) {
    var existentes = TM.ALMACEN_CARTA.platosEfectivos(TM.CARTA.platos).map(function (p) { return p.id; });
    var id = base, n = 2;
    while (existentes.indexOf(id) !== -1) { id = base + '-' + n; n++; }
    return id;
  }

  function avisar(titulo, detalle) {
    var caja = doc.createElement('div');
    caja.className = 'aviso';
    caja.innerHTML = '<strong>' + escapar(titulo) + '</strong><span>' + escapar(detalle) + '</span>';
    doc.getElementById('avisos').appendChild(caja);
    setTimeout(function () {
      caja.classList.add('aviso--saliendo');
      setTimeout(function () { caja.remove(); }, 400);
    }, 5200);
  }

  /**
   * Recorta a 4:3 y ajusta a 900 px de ancho — el mismo formato que
   * herramientas/preparar-fotos.py aplica a las fotos que llegan por fichero,
   * para que una subida desde el móvil se vea igual de bien que las demás.
   * Devuelve un data URL JPEG (funciona en cualquier navegador, a diferencia
   * de exportar a WebP desde canvas).
   */
  function procesarImagen(file, callback) {
    var lector = new FileReader();
    lector.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var proporcion = 4 / 3;
        var cropW = img.width, cropH = img.width / proporcion;
        if (cropH > img.height) { cropH = img.height; cropW = img.height * proporcion; }
        var sx = (img.width - cropW) / 2, sy = (img.height - cropH) / 2;

        var destino = Math.min(900, cropW);
        var lienzo = doc.createElement('canvas');
        lienzo.width = destino;
        lienzo.height = Math.round(destino / proporcion);
        lienzo.getContext('2d').drawImage(img, sx, sy, cropW, cropH, 0, 0, lienzo.width, lienzo.height);
        callback(lienzo.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    lector.readAsDataURL(file);
  }

  function mostrarVistaFoto(src) {
    doc.getElementById('fp-foto-img').src = src;
    doc.getElementById('fp-foto-vista').hidden = false;
    doc.getElementById('fp-foto-etiqueta').querySelector('span').textContent = 'Cambiar foto';
  }

  function ocultarVistaFoto() {
    doc.getElementById('fp-foto-vista').hidden = true;
    doc.getElementById('fp-foto-img').src = '';
    doc.getElementById('fp-foto-etiqueta').querySelector('span').textContent = 'Subir foto';
  }

  function origenPlato(plato) {
    var esOriginal = TM.CARTA.platos.some(function (o) { return o.id === plato.id; });
    var enCapa = TM.ALMACEN_CARTA.leer().items.some(function (x) { return x.id === plato.id; });
    if (enCapa && esOriginal) return 'editado';
    if (enCapa && !esOriginal) return 'nuevo';
    return 'original';
  }

  /* --------------------------------------------------------------- listado */

  function pintarLista() {
    var cont = doc.getElementById('lista-carta-panel');
    if (!cont) return;

    var platos = TM.ALMACEN_CARTA.platosEfectivos(TM.CARTA.platos);
    cont.innerHTML = '';

    TM.CARTA.categorias.forEach(function (cat) {
      var deEstaCat = platos.filter(function (p) { return p.cat === cat.id; });
      if (!deEstaCat.length) return;

      var bloque = doc.createElement('section');
      bloque.className = 'gestor-carta__bloque';

      var h = doc.createElement('h2');
      h.className = 'gestor-carta__categoria';
      h.textContent = txt(cat.nombre);
      bloque.appendChild(h);

      deEstaCat.forEach(function (p) {
        var origen = origenPlato(p);

        var fila = doc.createElement('article');
        fila.className = 'plato-panel';

        var info = doc.createElement('div');
        info.className = 'plato-panel__info';

        var titulo = doc.createElement('p');
        titulo.className = 'plato-panel__nombre';
        titulo.appendChild(doc.createTextNode(txt(p.nombre) + ' '));
        if (origen !== 'original') {
          var pastilla = doc.createElement('span');
          pastilla.className = 'pastilla ' + (origen === 'nuevo' ? 'pastilla--confirmada' : 'pastilla--pendiente');
          pastilla.textContent = origen === 'nuevo' ? 'Nuevo' : 'Editado';
          titulo.appendChild(pastilla);
        }
        info.appendChild(titulo);

        if (txt(p.desc)) {
          var desc = doc.createElement('p');
          desc.className = 'plato-panel__desc';
          desc.textContent = txt(p.desc);
          info.appendChild(desc);
        }

        var precio = doc.createElement('span');
        precio.className = 'plato-panel__precio';
        precio.textContent = euros(p.precio);

        var acciones = doc.createElement('div');
        acciones.className = 'plato-panel__acciones';

        var btnEditar = doc.createElement('button');
        btnEditar.type = 'button';
        btnEditar.className = 'icono-bton';
        btnEditar.setAttribute('aria-label', 'Editar ' + txt(p.nombre));
        btnEditar.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 19.5V17l10-10 2.5 2.5-10 10H4Z"/><path d="M13 6.5 16.5 3 19 5.5 15.5 9"/></svg>';
        btnEditar.addEventListener('click', function () { abrirModal(p); });

        var btnBorrar = doc.createElement('button');
        btnBorrar.type = 'button';
        btnBorrar.className = 'icono-bton icono-bton--peligro';
        btnBorrar.setAttribute('aria-label', 'Borrar ' + txt(p.nombre));
        btnBorrar.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4.5h4V7M7 7l1 12.5h8L17 7"/></svg>';
        btnBorrar.addEventListener('click', function () { confirmarBorrar(p); });

        acciones.appendChild(btnEditar);
        acciones.appendChild(btnBorrar);

        fila.appendChild(info);
        fila.appendChild(precio);
        fila.appendChild(acciones);
        bloque.appendChild(fila);
      });

      cont.appendChild(bloque);
    });
  }

  function confirmarBorrar(plato) {
    if (!win.confirm('¿Borrar «' + txt(plato.nombre) + '» de la carta?')) return;
    TM.ALMACEN_CARTA.borrarPlato(plato.id);
    pintarLista();
    avisar('Plato borrado', 'Ya no aparece en la web ni en la carta QR.');
  }

  /* ----------------------------------------------------------------- modal */

  function poblarFormulario() {
    var sel = doc.getElementById('fp-categoria');
    sel.innerHTML = TM.CARTA.categorias.map(function (c) {
      return '<option value="' + c.id + '">' + escapar(txt(c.nombre)) + '</option>';
    }).join('');

    var caja = doc.getElementById('fp-alergenos');
    caja.innerHTML = Object.keys(TM.CARTA.alergenos).map(function (clave) {
      return '<label class="chip-check"><input type="checkbox" value="' + clave + '"> ' +
        escapar(txt(TM.CARTA.alergenos[clave])) + '</label>';
    }).join('');
  }

  function abrirModal(plato) {
    editandoId = plato ? plato.id : null;
    fotoPendiente = undefined;
    doc.getElementById('fp-foto-input').value = '';
    doc.getElementById('modal-plato-titulo').textContent = plato ? 'Editar plato' : 'Añadir plato';
    doc.getElementById('fp-nombre').value = plato ? txt(plato.nombre) : '';
    doc.getElementById('fp-categoria').value = plato ? plato.cat : TM.CARTA.categorias[0].id;
    doc.getElementById('fp-precio').value = plato ? plato.precio : '';
    doc.getElementById('fp-desc').value = plato ? txt(plato.desc) : '';
    doc.querySelectorAll('#fp-alergenos input').forEach(function (chk) {
      chk.checked = !!(plato && plato.alergenos && plato.alergenos.indexOf(chk.value) !== -1);
    });
    doc.getElementById('fp-borrar').hidden = !plato;
    doc.getElementById('modal-plato').hidden = false;
    doc.getElementById('fp-nombre').focus();

    // La vista previa: si el plato ya trae una foto subida desde el panel se
    // enseña directa; si es un plato con foto de fichero (o de la demo)
    // se comprueba si existe antes de darla por buena.
    if (plato && plato.foto) {
      mostrarVistaFoto(plato.foto);
    } else if (plato) {
      var prueba = new Image();
      prueba.onload = function () { if (editandoId === plato.id) mostrarVistaFoto(prueba.src); };
      prueba.onerror = function () { if (editandoId === plato.id) ocultarVistaFoto(); };
      prueba.src = 'assets/platos/' + plato.id + '.webp';
    } else {
      ocultarVistaFoto();
    }
  }

  function cerrarModal() {
    doc.getElementById('modal-plato').hidden = true;
    editandoId = null;
  }

  function iniciar() {
    poblarFormulario();

    var btnAnadir = doc.getElementById('btn-anadir-plato');
    if (btnAnadir) btnAnadir.addEventListener('click', function () { abrirModal(null); });

    var btnRestaurar = doc.getElementById('btn-restaurar-carta');
    if (btnRestaurar) {
      btnRestaurar.addEventListener('click', function () {
        if (!win.confirm('¿Restaurar la carta a como estaba al principio? Se perderán los platos añadidos y las ediciones hechas desde el panel.')) return;
        TM.ALMACEN_CARTA.restaurar();
        pintarLista();
        avisar('Carta restaurada', 'Vuelve a ser la original de la demo.');
      });
    }

    var modal = doc.getElementById('modal-plato');
    if (modal) {
      doc.getElementById('modal-cerrar').addEventListener('click', cerrarModal);
      doc.getElementById('modal-velo').addEventListener('click', cerrarModal);
      doc.getElementById('fp-cancelar').addEventListener('click', cerrarModal);
      doc.getElementById('fp-borrar').addEventListener('click', function () {
        if (!editandoId) return;
        var actual = TM.ALMACEN_CARTA.platosEfectivos(TM.CARTA.platos)
          .filter(function (p) { return p.id === editandoId; })[0];
        cerrarModal();
        if (actual) confirmarBorrar(actual);
      });

      doc.getElementById('fp-foto-input').addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        procesarImagen(file, function (dataUrl) {
          fotoPendiente = dataUrl;
          mostrarVistaFoto(dataUrl);
        });
      });

      doc.getElementById('fp-foto-quitar').addEventListener('click', function () {
        fotoPendiente = null;
        doc.getElementById('fp-foto-input').value = '';
        ocultarVistaFoto();
      });

      doc.getElementById('form-plato').addEventListener('submit', function (e) {
        e.preventDefault();
        var nombre = doc.getElementById('fp-nombre').value.trim();
        var precio = parseFloat(doc.getElementById('fp-precio').value);
        if (!nombre || isNaN(precio)) return;

        var cat = doc.getElementById('fp-categoria').value;
        var desc = doc.getElementById('fp-desc').value.trim();
        var alergenos = Array.prototype.slice.call(doc.querySelectorAll('#fp-alergenos input:checked'))
          .map(function (c) { return c.value; });

        var id = editandoId || idUnico(slugificar(nombre));
        var eraNuevo = !editandoId;

        var datos = {
          id: id, cat: cat, precio: precio,
          nombre: { es: nombre },
          desc: { es: desc },
          alergenos: alergenos
        };

        // undefined → no se toca (conserva la que ya tuviera); null → se ha
        // quitado a propósito; string → foto nueva subida ahora mismo.
        if (fotoPendiente === undefined && editandoId) {
          var previo = TM.ALMACEN_CARTA.platosEfectivos(TM.CARTA.platos)
            .filter(function (p) { return p.id === editandoId; })[0];
          if (previo && previo.foto) datos.foto = previo.foto;
        } else if (typeof fotoPendiente === 'string') {
          datos.foto = fotoPendiente;
        }

        var guardado = TM.ALMACEN_CARTA.guardarPlato(datos);
        if (!guardado) {
          avisar('No se pudo guardar', 'Este navegador se ha quedado sin espacio — prueba con una foto más ligera o borra alguna existente.');
          return;
        }

        cerrarModal();
        pintarLista();
        avisar(eraNuevo ? 'Plato añadido' : 'Plato actualizado', nombre + ' ya se ve en la web y en la carta QR.');
      });

      doc.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modal.hidden) cerrarModal();
      });
    }

    // Si se edita la carta desde otra pestaña, esta lista se refresca sola.
    win.addEventListener('storage', function (e) {
      var vista = doc.getElementById('vista-carta');
      if (e.key === TM.ALMACEN_CARTA.clave && vista && !vista.hidden) pintarLista();
    });
  }

  TM.pintarCartaPanel = pintarLista;

  iniciar();
})(window.TM, document, window);
