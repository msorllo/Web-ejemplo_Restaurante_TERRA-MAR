/* ==========================================================================
   TERRA & MAR BISTRÓ — almacen.js
   Capa de persistencia de reservas, compartida por la web y el panel.

   Hoy escribe en localStorage: la demo funciona con doble click, sin servidor
   y sin internet. Para pasar a producción basta con reimplementar estas cuatro
   funciones contra una API (Supabase, n8n, PocketBase…): ni el formulario ni
   el panel necesitan enterarse.
   ========================================================================== */
window.TM = window.TM || {};

(function (TM, win) {
  'use strict';

  var CLAVE = 'tm_reservas';

  TM.ALMACEN = {
    clave: CLAVE,

    leer: function () {
      try {
        var crudo = win.localStorage.getItem(CLAVE);
        var lista = crudo ? JSON.parse(crudo) : [];
        return Array.isArray(lista) ? lista : [];
      } catch (e) {
        return [];   // modo privado, cuota llena o JSON corrupto
      }
    },

    escribir: function (lista) {
      try {
        win.localStorage.setItem(CLAVE, JSON.stringify(lista));
        return true;
      } catch (e) {
        return false;
      }
    },

    /** Añade una reserva y devuelve el registro completo ya sellado. */
    anadir: function (datos) {
      var lista = TM.ALMACEN.leer();
      datos.id = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
      datos.creada = new Date().toISOString();
      datos.estado = datos.estado || 'pendiente';
      lista.push(datos);
      TM.ALMACEN.escribir(lista);
      return datos;
    },

    actualizar: function (id, cambios) {
      var lista = TM.ALMACEN.leer();
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].id !== id) continue;
        for (var k in cambios) { if (cambios.hasOwnProperty(k)) lista[i][k] = cambios[k]; }
        TM.ALMACEN.escribir(lista);
        return lista[i];
      }
      return null;
    },

    borrar: function (id) {
      var lista = TM.ALMACEN.leer().filter(function (r) { return r.id !== id; });
      return TM.ALMACEN.escribir(lista);
    },

    vaciar: function () { return TM.ALMACEN.escribir([]); }
  };
})(window.TM, window);
