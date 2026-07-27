/* ==========================================================================
   TERRA & MAR BISTRÓ — reservas.js
   Formulario de reservas y de eventos.

   Las reservas se guardan en localStorage y el panel de administración las
   lee de ahí: una reserva hecha aquí aparece en panel.html al instante,
   incluso con el panel abierto en otra pestaña (evento `storage`).

   Cuando haya backend real, sustituir `guardar()` por un fetch al endpoint;
   el resto del flujo (validación, estados, WhatsApp) no cambia.
   Ver README.md → "Conectar un backend".
   ========================================================================== */
window.TM = window.TM || {};

(function (TM, doc, win) {
  'use strict';

  var N = TM.NEGOCIO;

  function guardar(datos) {
    datos.idioma = TM.idioma;
    return TM.ALMACEN.anadir(datos);
  }

  /* ---------------------------------------------------------- utilidades */

  function hoyISO() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  /** 'YYYY-MM-DD' → Date local (evita el desfase UTC de new Date(cadena)). */
  function aFecha(iso) {
    var p = String(iso).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function fechaLarga(iso) {
    try {
      return new Intl.DateTimeFormat(TM.idioma, {
        weekday: 'long', day: 'numeric', month: 'long'
      }).format(aFecha(iso));
    } catch (e) {
      return iso;
    }
  }

  /* -------------------------------------------------------- errores en UI */

  function marcarError(campo, mensaje) {
    var caja = campo.closest('.campo');
    if (!caja) return;
    caja.classList.add('campo--error');
    var hueco = caja.querySelector('.campo__error');
    if (hueco) hueco.textContent = mensaje;
    campo.setAttribute('aria-invalid', 'true');
  }

  function limpiarErrores(form) {
    form.querySelectorAll('.campo--error').forEach(function (c) {
      c.classList.remove('campo--error');
      var h = c.querySelector('.campo__error');
      if (h) h.textContent = '';
    });
    form.querySelectorAll('[aria-invalid]').forEach(function (c) {
      c.removeAttribute('aria-invalid');
    });
  }

  function validar(form, reglas) {
    limpiarErrores(form);
    var primero = null;

    reglas.forEach(function (r) {
      var campo = form.elements[r.nombre];
      if (!campo) return;
      var valor = (campo.value || '').trim();
      var error = r.comprobar(valor, campo);
      if (error) {
        marcarError(campo, error);
        if (!primero) primero = campo;
      }
    });

    if (primero) primero.focus({ preventScroll: false });
    return !primero;
  }

  var esEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var esTel = /^[+()\d\s.-]{9,}$/;

  /* ---------------------------------------- huecos disponibles por fecha */

  function refrescarTurnos(form) {
    var fecha = form.elements.fecha;
    var turno = form.elements.turno;
    var hora = form.elements.hora;
    if (!fecha || !turno || !hora) return;

    var dia = fecha.value ? aFecha(fecha.value).getDay() : -1;

    Array.prototype.forEach.call(turno.options, function (op) {
      if (!op.value) return;
      var libre = dia === -1 || TM.turnoDisponible(dia, op.value);
      op.disabled = !libre;
      op.textContent = TM.t('reserva.f.turno.' + op.value) + (libre ? '' : ' — ' + TM.t('estado.cerrado'));
    });

    // Si el turno elegido no existe ese día, saltar al que sí
    var actual = turno.value;
    if (actual && dia !== -1 && !TM.turnoDisponible(dia, actual)) {
      var alternativa = null;
      Array.prototype.forEach.call(turno.options, function (op) {
        if (!alternativa && op.value && !op.disabled) alternativa = op.value;
      });
      turno.value = alternativa || '';
    }

    refrescarHoras(form);
  }

  function refrescarHoras(form) {
    var turno = form.elements.turno;
    var hora = form.elements.hora;
    if (!turno || !hora) return;

    var anterior = hora.value;
    var huecos = N.huecos[turno.value] || [];
    hora.textContent = '';
    huecos.forEach(function (h) {
      var op = doc.createElement('option');
      op.value = h; op.textContent = h;
      hora.appendChild(op);
    });
    if (huecos.indexOf(anterior) !== -1) hora.value = anterior;
    hora.disabled = !huecos.length;
  }

  function rellenarPersonas(form) {
    var sel = form.elements.personas;
    if (!sel || sel.options.length) return;
    for (var i = 1; i <= N.maxComensalesWeb; i++) {
      var op = doc.createElement('option');
      op.value = i;
      op.textContent = i + ' ' + TM.t(i === 1 ? 'reserva.f.persona.una' : 'reserva.f.persona.varias');
      sel.appendChild(op);
    }
    sel.value = 2;
  }

  function repintarPersonas(form) {
    var sel = form.elements.personas;
    if (!sel) return;
    Array.prototype.forEach.call(sel.options, function (op) {
      var n = parseInt(op.value, 10);
      op.textContent = n + ' ' + TM.t(n === 1 ? 'reserva.f.persona.una' : 'reserva.f.persona.varias');
    });
  }

  /* --------------------------------------------------------------- WhatsApp */

  function enlaceWhatsApp(form) {
    var v = function (n) { return form.elements[n] ? form.elements[n].value : ''; };
    var partes = [
      TM.t('reserva.titulo') + ' · ' + N.nombre,
      TM.t('reserva.f.fecha') + ': ' + (v('fecha') ? fechaLarga(v('fecha')) : '—'),
      TM.t('reserva.f.hora') + ': ' + (v('hora') || '—'),
      TM.t('reserva.f.personas') + ': ' + (v('personas') || '—'),
      TM.t('reserva.f.nombre') + ': ' + (v('nombre') || '—')
    ];
    if (v('notas')) partes.push(TM.t('reserva.f.notas') + ': ' + v('notas'));
    return 'https://wa.me/' + N.whatsapp + '?text=' + encodeURIComponent(partes.join('\n'));
  }

  /* ------------------------------------------------- formulario de reserva */

  function iniciarReserva() {
    var form = doc.getElementById('form-reserva');
    if (!form) return;

    var exito = doc.getElementById('reserva-exito');
    var boton = form.querySelector('[type="submit"]');
    var wa = doc.getElementById('reserva-wa');

    // Arrancar en el próximo día con servicio: si hoy es lunes (cerrado), el
    // formulario abriría sin turnos disponibles y parecería roto.
    var fecha = form.elements.fecha;
    fecha.min = hoyISO();
    if (!fecha.value) fecha.value = TM.proximaFechaAbierta();

    rellenarPersonas(form);
    refrescarTurnos(form);

    fecha.addEventListener('change', function () { refrescarTurnos(form); });
    form.elements.turno.addEventListener('change', function () { refrescarHoras(form); });

    if (wa) {
      wa.addEventListener('click', function (e) {
        e.preventDefault();
        win.open(enlaceWhatsApp(form), '_blank', 'noopener');
      });
    }

    var reglas = [
      { nombre: 'fecha', comprobar: function (v) {
          if (!v) return TM.t('reserva.error.req');
          var d = aFecha(v), hoy = aFecha(hoyISO());
          if (d < hoy) return TM.t('reserva.error.pasada');
          if (!TM.diaAbierto(d.getDay())) return TM.t('reserva.error.fecha');
          return null;
        } },
      { nombre: 'turno', comprobar: function (v) {
          if (!v) return TM.t('reserva.error.req');
          var d = aFecha(form.elements.fecha.value);
          if (!TM.turnoDisponible(d.getDay(), v)) return TM.t('reserva.error.turno');
          return null;
        } },
      { nombre: 'hora',   comprobar: function (v) { return v ? null : TM.t('reserva.error.req'); } },
      { nombre: 'nombre', comprobar: function (v) { return v.length >= 2 ? null : TM.t('reserva.error.req'); } },
      { nombre: 'tel',    comprobar: function (v) {
          if (!v) return TM.t('reserva.error.req');
          return esTel.test(v) ? null : TM.t('reserva.error.tel');
        } },
      { nombre: 'email',  comprobar: function (v) {
          if (!v) return null;                       // opcional
          return esEmail.test(v) ? null : TM.t('reserva.error.email');
        } }
    ];

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validar(form, reglas)) return;

      boton.disabled = true;
      boton.textContent = TM.t('reserva.f.enviando');

      // Pausa deliberada: sin ella el envío parece que no ha ocurrido.
      // Aquí es donde irá el fetch() al backend real.
      setTimeout(function () {
        var datos = guardar({
          tipo: 'reserva',
          fecha: form.elements.fecha.value,
          turno: form.elements.turno.value,
          hora: form.elements.hora.value,
          personas: parseInt(form.elements.personas.value, 10),
          nombre: form.elements.nombre.value.trim(),
          tel: form.elements.tel.value.trim(),
          email: form.elements.email.value.trim(),
          notas: form.elements.notas.value.trim()
        });

        boton.disabled = false;
        boton.textContent = TM.t('reserva.f.enviar');

        if (exito) {
          var detalle = exito.querySelector('[data-detalle]');
          if (detalle) {
            detalle.textContent = TM.t('reserva.ok.d', {
              fecha: fechaLarga(datos.fecha),
              hora: datos.hora,
              personas: datos.personas,
              tel: datos.tel
            });
          }
          form.hidden = true;
          exito.hidden = false;
          exito.focus();
        }
      }, 650);
    });

    var otra = doc.getElementById('reserva-otra');
    if (otra) {
      otra.addEventListener('click', function () {
        form.reset();
        fecha.value = TM.proximaFechaAbierta();
        refrescarTurnos(form);
        limpiarErrores(form);
        exito.hidden = true;
        form.hidden = false;
        form.elements.nombre.focus();
      });
    }

    doc.addEventListener('tm:idioma', function () {
      repintarPersonas(form);
      refrescarTurnos(form);
    });
  }

  /* ------------------------------------------------- formulario de eventos */

  function iniciarEvento() {
    var form = doc.getElementById('form-evento');
    if (!form) return;

    var exito = doc.getElementById('evento-exito');
    var boton = form.querySelector('[type="submit"]');

    var f = form.elements.fecha;
    if (f) f.min = hoyISO();

    var sel = form.elements.personas;
    if (sel && !sel.options.length) {
      [10, 15, 20, 25, 30].forEach(function (n) {
        var op = doc.createElement('option');
        op.value = n; op.textContent = n + '+';
        sel.appendChild(op);
      });
    }

    var reglas = [
      { nombre: 'nombre', comprobar: function (v) { return v.length >= 2 ? null : TM.t('reserva.error.req'); } },
      { nombre: 'tel',    comprobar: function (v) {
          if (!v) return TM.t('reserva.error.req');
          return esTel.test(v) ? null : TM.t('reserva.error.tel');
        } },
      { nombre: 'email',  comprobar: function (v) {
          if (!v) return TM.t('reserva.error.req');
          return esEmail.test(v) ? null : TM.t('reserva.error.email');
        } }
    ];

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validar(form, reglas)) return;

      boton.disabled = true;
      boton.textContent = TM.t('reserva.f.enviando');

      setTimeout(function () {
        guardar({
          tipo: 'evento',
          evento: form.elements.evento.value,
          fecha: form.elements.fecha.value,
          turno: '',
          hora: '',
          personas: parseInt(form.elements.personas.value, 10) || 0,
          nombre: form.elements.nombre.value.trim(),
          tel: form.elements.tel.value.trim(),
          email: form.elements.email.value.trim(),
          notas: form.elements.notas.value.trim()
        });
        boton.disabled = false;
        boton.textContent = TM.t('eventos.cta');
        form.hidden = true;
        if (exito) { exito.hidden = false; exito.focus(); }
      }, 650);
    });
  }

  /* ------------------------------------------------------- tarjeta regalo */

  function iniciarRegalo() {
    doc.querySelectorAll('[data-regalo]').forEach(function (b) {
      b.addEventListener('click', function () {
        var texto = TM.t('regalo.titulo') + ' · ' + N.nombre + '\n' +
                    TM.t('regalo.etiqueta') + ': ' + TM.t(b.getAttribute('data-regalo'));
        win.open('https://wa.me/' + N.whatsapp + '?text=' + encodeURIComponent(texto),
                 '_blank', 'noopener');
      });
    });
  }

  function iniciar() {
    iniciarReserva();
    iniciarEvento();
    iniciarRegalo();
  }

  // Este script va al final del <body>: el marcado que necesita ya está
  // en el DOM. Arrancar aquí, y no en DOMContentLoaded, evita que el
  // navegador pinte una primera versión sin este contenido y luego lo
  // empuje todo (era la causa del salto de layout).
  iniciar();
})(window.TM, document, window);
