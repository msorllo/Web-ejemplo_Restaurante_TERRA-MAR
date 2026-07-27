/* ==========================================================================
   TERRA & MAR BISTRÓ — panel.js
   Panel de administración de reservas.

   Lee del mismo almacén que el formulario público. Al escuchar el evento
   `storage`, una reserva hecha en otra pestaña aparece aquí en vivo, sin
   recargar: es el momento que demuestra el valor del producto.
   ========================================================================== */
(function (TM, doc, win) {
  'use strict';

  var A = TM.ALMACEN;
  var N = TM.NEGOCIO;

  var vista = 'reservas';     // reservas | eventos
  var cuando = 'hoy';         // hoy | manana | semana | todas
  var filtroEstado = '';
  var vistos = {};            // ids ya pintados, para resaltar los nuevos

  var ESTADOS = {
    pendiente:  'Pendiente',
    confirmada: 'Confirmada',
    sentada:    'Sentada',
    'no-show':  'No-show',
    cancelada:  'Cancelada'
  };

  /* ---------------------------------------------------------- utilidades */

  function iso(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  function hoyISO() { return iso(new Date()); }
  function masDias(n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); }

  function aFecha(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

  function fechaCorta(s) {
    if (!s) return '—';
    try {
      return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
        .format(aFecha(s));
    } catch (e) { return s; }
  }

  function euros(n) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency', currency: 'EUR', maximumFractionDigits: 0
    }).format(n);
  }

  /**
   * Ticket medio estimado a partir de la carta real: un principal, medio
   * entrante, medio postre y una bebida. Es una estimación, y así se etiqueta.
   *
   * Se recalcula en cada llamada (no una vez al cargar) porque la carta
   * puede cambiar desde la pestaña "Carta" del propio panel, o desde otra
   * pestaña: así el ingreso estimado siempre refleja los precios actuales.
   */
  function calcularTicketMedio() {
    if (!TM.CARTA) return 40;
    var platos = TM.ALMACEN_CARTA ? TM.ALMACEN_CARTA.platosEfectivos(TM.CARTA.platos) : TM.CARTA.platos;
    var media = function (cats) {
      var p = platos.filter(function (x) { return cats.indexOf(x.cat) !== -1; });
      if (!p.length) return 0;
      return p.reduce(function (s, x) { return s + x.precio; }, 0) / p.length;
    };
    var principal = media(['del-mar', 'de-la-tierra', 'pastas-arroces']);
    var entrante = media(['abrir-boca']);
    var postre = media(['postres']);
    var bebida = TM.CARTA.vinos.reduce(function (s, v) { return s + v.copa; }, 0) / TM.CARTA.vinos.length * 2;
    return Math.round(principal + entrante * 0.6 + postre * 0.5 + bebida);
  }

  /* ------------------------------------------------------------- filtrado */

  function dentroDeRango(r) {
    if (cuando === 'todas' || !r.fecha) return cuando === 'todas';
    if (cuando === 'hoy') return r.fecha === hoyISO();
    if (cuando === 'manana') return r.fecha === masDias(1);
    return r.fecha >= hoyISO() && r.fecha <= masDias(7);
  }

  function filtradas() {
    return A.leer()
      .filter(function (r) { return (r.tipo === 'evento') === (vista === 'eventos'); })
      .filter(dentroDeRango)
      .filter(function (r) { return !filtroEstado || r.estado === filtroEstado; })
      .sort(function (a, b) {
        return (a.fecha + a.hora).localeCompare(b.fecha + b.hora) ||
               a.creada.localeCompare(b.creada);
      });
  }

  /* ----------------------------------------------------------------- KPIs */

  function pintarKpis() {
    var todas = A.leer();

    // Si hoy está cerrado (lunes), los KPI miran al próximo servicio: un panel
    // lleno de ceros no dice nada de cómo va el negocio.
    var diaFoco = TM.proximaFechaAbierta();
    var esHoy = diaFoco === hoyISO();
    var sufijo = esHoy ? 'hoy' : fechaCorta(diaFoco);

    var hoy = todas.filter(function (r) { return r.tipo !== 'evento' && r.fecha === diaFoco && r.estado !== 'cancelada'; });
    var pax = hoy.reduce(function (s, r) { return s + (r.personas || 0); }, 0);
    var pendientes = todas.filter(function (r) { return r.estado === 'pendiente'; }).length;

    // Ocupación sobre el aforo del turno con más reservas
    var porTurno = { comida: 0, cena: 0 };
    hoy.forEach(function (r) { if (porTurno[r.turno] != null) porTurno[r.turno] += r.personas || 0; });
    var pico = Math.max(porTurno.comida, porTurno.cena);
    var ocupacion = Math.round((pico / N.aforo) * 100);

    var ticketMedio = calcularTicketMedio();

    var datos = [
      { et: 'Reservas ' + sufijo, v: hoy.length, nota: pendientes + ' pendiente' + (pendientes === 1 ? '' : 's') + ' en total', c: 'var(--p-acento)' },
      { et: 'Comensales ' + sufijo, v: pax, nota: 'Comida ' + porTurno.comida + ' · Cena ' + porTurno.cena, c: 'var(--p-laton)' },
      { et: 'Ocupación pico', v: ocupacion + '%', nota: 'sobre ' + N.aforo + ' cubiertos por turno', c: ocupacion > 85 ? 'var(--p-rojo)' : 'var(--p-verde)' },
      { et: 'Ingreso estimado', v: euros(pax * ticketMedio), nota: 'est. ' + euros(ticketMedio) + ' por comensal', c: 'var(--p-azul)' }
    ];

    doc.getElementById('kpis').innerHTML = datos.map(function (d) {
      return '<article class="kpi" style="--kpi-color:' + d.c + '">' +
             '<p class="kpi__etiqueta">' + d.et + '</p>' +
             '<p class="kpi__valor">' + d.v + '</p>' +
             '<p class="kpi__nota">' + d.nota + '</p></article>';
    }).join('');

    doc.getElementById('cont-reservas').textContent =
      todas.filter(function (r) { return r.tipo !== 'evento'; }).length;
    doc.getElementById('cont-eventos').textContent =
      todas.filter(function (r) { return r.tipo === 'evento'; }).length;
  }

  /* ---------------------------------------------------------------- tabla */

  function escapar(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pintarTabla() {
    var lista = filtradas();
    var cuerpo = doc.getElementById('cuerpo');
    var vacio = doc.getElementById('vacio');

    doc.getElementById('titulo-vista').textContent = vista === 'eventos' ? 'Eventos y privados' : 'Reservas';
    doc.getElementById('subtitulo-vista').textContent =
      lista.length + (lista.length === 1 ? ' solicitud' : ' solicitudes') + ' · ' +
      ({ hoy: 'hoy', manana: 'mañana', semana: 'próximos 7 días', todas: 'histórico completo' })[cuando];

    vacio.hidden = lista.length > 0;
    doc.getElementById('tabla').hidden = lista.length === 0;

    cuerpo.innerHTML = lista.map(function (r) {
      var nueva = !vistos[r.id];
      vistos[r.id] = true;

      var cuando = r.tipo === 'evento'
        ? '<span class="celda-fuerte">' + fechaCorta(r.fecha) + '</span>' +
          '<div class="celda-tenue">' + escapar(r.evento || 'Evento') + '</div>'
        : '<span class="celda-fuerte">' + escapar(r.hora) + '</span>' +
          '<div class="celda-tenue">' + fechaCorta(r.fecha) + ' · ' + (r.turno === 'cena' ? 'cena' : 'comida') + '</div>';

      var opciones = Object.keys(ESTADOS).map(function (e) {
        return '<option value="' + e + '"' + (r.estado === e ? ' selected' : '') + '>' + ESTADOS[e] + '</option>';
      }).join('');

      return '<tr class="' + (nueva ? 'es-nueva' : '') + '" data-id="' + r.id + '">' +
        '<td>' + cuando + '</td>' +
        '<td><span class="celda-fuerte">' + escapar(r.nombre) + '</span>' +
          (r.tipo === 'evento' ? ' <span class="pastilla pastilla--evento">Evento</span>' : '') + '</td>' +
        '<td><a href="tel:' + escapar(r.tel) + '">' + escapar(r.tel) + '</a>' +
          (r.email ? '<div class="celda-tenue">' + escapar(r.email) + '</div>' : '') + '</td>' +
        '<td class="celda-num celda-fuerte">' + (r.personas || '—') + '</td>' +
        '<td>' + (r.notas ? '<span class="notas-chip" title="' + escapar(r.notas) + '">' + escapar(r.notas) + '</span>' : '<span class="celda-tenue">—</span>') + '</td>' +
        '<td><span class="pastilla pastilla--' + r.estado + '">' + ESTADOS[r.estado] + '</span>' +
          '<select class="selector-estado" data-accion="estado" aria-label="Cambiar estado de ' + escapar(r.nombre) + '">' + opciones + '</select></td>' +
        '<td><button type="button" class="icono-bton" data-accion="borrar" aria-label="Eliminar la reserva de ' + escapar(r.nombre) + '">' +
          '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4.5h4V7M7 7l1 12.5h8L17 7"/></svg></button></td>' +
        '</tr>';
    }).join('');
  }

  function pintar() { pintarKpis(); pintarTabla(); }

  /* ---------------------------------------------------------------- avisos */

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

  /* --------------------------------------------------------- datos de ejemplo */

  function datosEjemplo() {
    var gente = [
      ['Nuria Ferreres', '+34 618 224 907', 'nuria.ferreres@gmail.com', 2, 'Mesa junto a la ventana si puede ser'],
      ['Joan Beltrán',   '+34 646 811 320', 'jbeltran@correo.es',       4, ''],
      ['Marta Sanchís',  '+34 677 940 155', 'marta.sanchis@gmail.com',  2, 'Celíaca'],
      ['Òscar Pruñonosa','+34 610 337 428', '',                          6, 'Cumpleaños, traemos tarta'],
      ['Lucía Ayza',     '+34 693 205 774', 'lucia.ayza@outlook.com',   3, ''],
      ['Ramón Castell',  '+34 622 145 683', 'rcastell@empresa.com',     2, 'Alergia a los frutos secos'],
      ['Elena Roig',     '+34 655 019 236', 'elena.roig@gmail.com',     5, 'Trona para bebé'],
      ['Vicent Molés',   '+34 636 772 481', '',                          2, ''],
      ['Aina Querol',    '+34 682 396 057', 'aina.q@gmail.com',         4, 'Aniversario'],
      ['Pau Vidal',      '+34 601 558 743', 'pauvidal@gmail.com',       2, '']
    ];
    var estados = ['confirmada', 'pendiente', 'confirmada', 'confirmada', 'pendiente',
                   'sentada', 'confirmada', 'no-show', 'pendiente', 'confirmada'];

    // Se reparten entre los tres próximos días CON servicio, nunca en lunes.
    var dias = [
      TM.proximaFechaAbierta(null, 0),
      TM.proximaFechaAbierta(null, 1),
      TM.proximaFechaAbierta(null, 2)
    ];

    var lista = A.leer();
    gente.forEach(function (g, i) {
      var fechaTexto = dias[i < 6 ? 0 : (i < 9 ? 1 : 2)];
      var f = aFecha(fechaTexto);
      var turno = (i % 2 === 1 && TM.turnoDisponible(f.getDay(), 'cena')) ? 'cena' : 'comida';
      if (!TM.turnoDisponible(f.getDay(), turno)) turno = turno === 'cena' ? 'comida' : 'cena';

      var huecos = N.huecos[turno];
      lista.push({
        id: 'demo' + i + Date.now().toString(36),
        creada: new Date(Date.now() - (10 - i) * 36e5).toISOString(),
        tipo: 'reserva',
        fecha: fechaTexto,
        turno: turno,
        hora: huecos[i % huecos.length],
        personas: g[3],
        nombre: g[0], tel: g[1], email: g[2], notas: g[4],
        estado: estados[i],
        idioma: 'es'
      });
    });

    lista.push({
      id: 'demoEv' + Date.now().toString(36),
      creada: new Date(Date.now() - 5 * 36e5).toISOString(),
      tipo: 'evento',
      evento: 'Cena de empresa',
      fecha: masDias(21),
      turno: '', hora: '',
      personas: 25,
      nombre: 'Cerámicas del Maestrat, S.L.',
      tel: '+34 964 470 118',
      email: 'administracion@ceramicasmaestrat.es',
      notas: 'Cena de Navidad. Necesitan factura y dos menús veganos.',
      estado: 'pendiente', idioma: 'es'
    });

    A.escribir(lista);
    fijarCuando('semana');   // así se ven aunque hoy esté cerrado
    pintar();
    avisar('Datos de ejemplo cargados', gente.length + ' reservas y 1 evento.');
  }

  /* ---------------------------------------------------------------- eventos */

  function fijarCuando(valor) {
    cuando = valor;
    doc.querySelectorAll('#filtros [data-cuando]').forEach(function (o) {
      o.setAttribute('aria-pressed', o.getAttribute('data-cuando') === valor ? 'true' : 'false');
    });
  }

  function iniciar() {
    // Un lunes (cerrado) el filtro "Hoy" mostraría siempre una tabla vacía.
    fijarCuando(TM.diaAbierto(new Date().getDay()) ? 'hoy' : 'semana');

    doc.querySelectorAll('[data-vista]').forEach(function (b) {
      b.addEventListener('click', function () {
        vista = b.getAttribute('data-vista');
        doc.querySelectorAll('[data-vista]').forEach(function (o) {
          var act = o === b;
          o.classList.toggle('esta-activo', act);
          if (act) { o.setAttribute('aria-current', 'page'); } else { o.removeAttribute('aria-current'); }
        });

        var esDatos = vista === 'reservas' || vista === 'eventos';
        doc.getElementById('vista-datos').hidden = !esDatos;
        doc.getElementById('vista-guia').hidden = vista !== 'guia';
        doc.getElementById('vista-carta').hidden = vista !== 'carta';
        doc.querySelector('.acciones').hidden = !esDatos;

        if (esDatos) {
          pintar();
        } else if (vista === 'guia') {
          doc.getElementById('titulo-vista').textContent = 'Cómo funciona esta demo';
          doc.getElementById('subtitulo-vista').textContent = 'Para enseñarla a un cliente en dos minutos, sin tecnicismos.';
        } else if (vista === 'carta') {
          doc.getElementById('titulo-vista').textContent = 'Gestión de la carta';
          doc.getElementById('subtitulo-vista').textContent = 'Añade, edita o retira platos — se ve al instante en la web.';
          if (TM.pintarCartaPanel) TM.pintarCartaPanel();
        }
      });
    });

    doc.getElementById('filtros').addEventListener('click', function (e) {
      var b = e.target.closest('.filtro');
      if (!b) return;
      var grupo = b.hasAttribute('data-cuando') ? 'data-cuando' : 'data-estado';
      doc.querySelectorAll('#filtros [' + grupo + ']').forEach(function (o) {
        o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
      });
      if (grupo === 'data-cuando') { cuando = b.getAttribute('data-cuando'); }
      else { filtroEstado = b.getAttribute('data-estado'); }
      pintarTabla();
    });

    doc.getElementById('cuerpo').addEventListener('change', function (e) {
      var sel = e.target.closest('[data-accion="estado"]');
      if (!sel) return;
      var fila = sel.closest('tr');
      A.actualizar(fila.dataset.id, { estado: sel.value });
      pintar();
    });

    doc.getElementById('cuerpo').addEventListener('click', function (e) {
      var b = e.target.closest('[data-accion="borrar"]');
      if (!b) return;
      var fila = b.closest('tr');
      A.borrar(fila.dataset.id);
      pintar();
      avisar('Reserva eliminada', 'Ya no aparece en el listado.');
    });

    [doc.getElementById('btn-ejemplo'), doc.getElementById('btn-ejemplo-2')].forEach(function (b) {
      if (b) b.addEventListener('click', datosEjemplo);
    });

    doc.getElementById('btn-vaciar').addEventListener('click', function () {
      if (!win.confirm('¿Vaciar todas las reservas guardadas en este navegador?')) return;
      A.vaciar();
      vistos = {};
      pintar();
      avisar('Listado vacío', 'Se han borrado todas las reservas de la demo.');
    });

    // Una reserva hecha en otra pestaña entra aquí en vivo.
    win.addEventListener('storage', function (e) {
      if (e.key !== A.clave) return;
      var previas = Object.keys(vistos).length;
      pintar();
      var ahora = A.leer();
      if (ahora.length > previas) {
        var ultima = ahora[ahora.length - 1];
        avisar('Nueva reserva: ' + ultima.nombre,
               (ultima.personas || '?') + ' pax · ' + fechaCorta(ultima.fecha) + ' ' + (ultima.hora || ''));
      }
    });

    // Un cambio de carta hecho en otra pestaña (o en la vista "Carta" de este
    // panel) actualiza el ingreso estimado, que depende de los precios reales.
    if (TM.ALMACEN_CARTA) {
      win.addEventListener('storage', function (e) {
        if (e.key === TM.ALMACEN_CARTA.clave && vista !== 'carta') pintarKpis();
      });
    }

    pintar();
  }

  // Este script va al final del <body>: el marcado que necesita ya está
  // en el DOM. Arrancar aquí, y no en DOMContentLoaded, evita que el
  // navegador pinte una primera versión sin este contenido y luego lo
  // empuje todo (era la causa del salto de layout).
  iniciar();
})(window.TM, document, window);
