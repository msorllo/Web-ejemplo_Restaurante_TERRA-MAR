/* ==========================================================================
   TERRA & MAR BISTRÓ — negocio.js
   Fuente única de los datos del negocio: contacto, dirección y horarios.
   La usan el indicador "abierto ahora", la validación de reservas,
   el pie de página y el JSON-LD.
   Datos extraídos de la carta oficial del restaurante.
   ========================================================================== */
window.TM = window.TM || {};

window.TM.NEGOCIO = {
  nombre: 'Terra & Mar Bistró',
  claim: 'Cocina de raíz & elegancia mediterránea',

  tel: '+34 964 123 456',
  telLimpio: '+34964123456',
  // Click-to-chat de WhatsApp: mismo número sin espacios ni '+'
  whatsapp: '34964123456',
  email: 'reservas@terraymarbistro.com',
  web: 'https://www.terraymarbistro.com',

  direccion: {
    calle: 'Paseo Marítimo, 45',
    cp: '12580',
    ciudad: 'Benicarló',
    provincia: 'Castellón',
    pais: 'ES',
    // Coordenadas aproximadas del paseo marítimo de Benicarló.
    // Sustituir por las exactas cuando el cliente las facilite.
    lat: 40.4155,
    lon: 0.4310
  },

  aforo: 30,
  rangoPrecio: '€€€',
  cocina: ['Mediterránea', 'Española', 'Cocina de mercado'],

  /* Horarios reales de la carta.
     getDay(): 0=domingo, 1=lunes … 6=sábado. Lunes cerrado. */
  turnos: {
    comida: { dias: [2, 3, 4, 5, 6, 0], abre: '13:30', cierra: '16:00' },
    cena:   { dias: [4, 5, 6],          abre: '20:30', cierra: '23:30' }
  },

  /* Huecos ofrecidos en el formulario de reserva (última entrada 45 min
     antes del cierre, que es lo que hace cualquier sala). */
  huecos: {
    comida: ['13:30', '14:00', '14:30', '15:00', '15:15'],
    cena:   ['20:30', '21:00', '21:30', '22:00', '22:30']
  },

  maxComensalesWeb: 10,

  redes: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    tripadvisor: 'https://tripadvisor.com/'
  },

  agencia: { nombre: 'Mistereia', url: 'https://mistereia.com' }
};

/* --------------------------------------------------------------------------
   Utilidades de horario
   -------------------------------------------------------------------------- */
(function (TM) {
  var N = TM.NEGOCIO;

  function aMinutos(hhmm) {
    var p = hhmm.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  /** ¿Está abierto ese día en ese turno? */
  TM.turnoDisponible = function (dia, turno) {
    return N.turnos[turno].dias.indexOf(dia) !== -1;
  };

  /** ¿Abre ese día en algún turno? */
  TM.diaAbierto = function (dia) {
    return TM.turnoDisponible(dia, 'comida') || TM.turnoDisponible(dia, 'cena');
  };

  function aISO(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  TM.aISO = aISO;

  /**
   * Primer día con servicio a partir de una fecha (incluida).
   * Evita que el formulario o el panel arranquen en un lunes, que está cerrado.
   * @param {Date} [desde]
   * @param {number} [saltar] cuántos días de servicio saltar (0 = el primero)
   */
  TM.proximaFechaAbierta = function (desde, saltar) {
    var d = desde ? new Date(desde.getTime()) : new Date();
    var quedan = saltar || 0;
    for (var i = 0; i < 21; i++) {
      if (TM.diaAbierto(d.getDay())) {
        if (quedan === 0) return aISO(d);
        quedan--;
      }
      d.setDate(d.getDate() + 1);
    }
    return aISO(d);
  };

  /**
   * Estado del restaurante en un momento dado.
   * Devuelve { abierto, cierra } o { abierto:false, abre, dia, diaIndice }.
   */
  TM.estadoAhora = function (ahora) {
    ahora = ahora || new Date();
    var dia = ahora.getDay();
    var min = ahora.getHours() * 60 + ahora.getMinutes();
    var t, turno;

    for (turno in N.turnos) {
      t = N.turnos[turno];
      if (t.dias.indexOf(dia) !== -1 && min >= aMinutos(t.abre) && min < aMinutos(t.cierra)) {
        return { abierto: true, cierra: t.cierra, turno: turno };
      }
    }

    // Buscar la próxima apertura, hasta 7 días por delante.
    for (var d = 0; d < 8; d++) {
      var dd = (dia + d) % 7;
      var candidatos = [];
      for (turno in N.turnos) {
        t = N.turnos[turno];
        if (t.dias.indexOf(dd) === -1) continue;
        if (d === 0 && aMinutos(t.abre) <= min) continue;
        candidatos.push(t.abre);
      }
      if (candidatos.length) {
        candidatos.sort();
        return { abierto: false, abre: candidatos[0], diaIndice: dd, enDias: d };
      }
    }
    return { abierto: false };
  };
})(window.TM);
