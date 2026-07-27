/* ==========================================================================
   TERRA & MAR BISTRÓ — almacen-carta.js
   Capa de cambios de carta hecha desde el panel (añadir / editar / borrar
   platos), guardada aparte de js/datos/carta.js para no tocar el fichero de
   datos original: la demo se puede "Restaurar" y queda como al principio.

   Estructura guardada en localStorage:
     { items: [ {id, cat, precio, nombre, desc, alergenos}, … ],
       ocultos: ['id-de-un-plato-original-que-se-ha-borrado', …] }

   platosEfectivos(base) mezcla la carta original con estos cambios:
     · un plato de "items" con el mismo id que uno original lo SUSTITUYE
       (es una edición)
     · un plato de "items" con un id nuevo se AÑADE
     · un id en "ocultos" hace desaparecer ese plato original
   ========================================================================== */
window.TM = window.TM || {};

(function (TM) {
  'use strict';

  var CLAVE = 'tm_carta_extra';

  function leer() {
    try {
      var datos = JSON.parse(localStorage.getItem(CLAVE));
      if (datos && Array.isArray(datos.items) && Array.isArray(datos.ocultos)) return datos;
    } catch (e) { /* localStorage no disponible: modo privado, etc. */ }
    return { items: [], ocultos: [] };
  }

  /** true si se guardó bien; false si el navegador se ha quedado sin espacio
   *  (localStorage lleno de fotos, sobre todo) — así el panel puede avisar
   *  en vez de perder el cambio en silencio. */
  function escribir(datos) {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); return true; }
    catch (e) { return false; }
  }

  TM.ALMACEN_CARTA = {
    clave: CLAVE,

    leer: leer,

    /** Crea o sustituye (por id) un plato en la capa de cambios. */
    guardarPlato: function (plato) {
      var d = leer();
      var i = -1;
      d.items.forEach(function (p, idx) { if (p.id === plato.id) i = idx; });
      if (i === -1) { d.items.push(plato); } else { d.items[i] = plato; }
      // Si se había borrado antes y se vuelve a crear con el mismo id, se destapa.
      d.ocultos = d.ocultos.filter(function (id) { return id !== plato.id; });
      return escribir(d);
    },

    /** Borra un plato: si era propio de la capa lo quita, si era original lo oculta. */
    borrarPlato: function (id) {
      var d = leer();
      d.items = d.items.filter(function (p) { return p.id !== id; });
      if (d.ocultos.indexOf(id) === -1) d.ocultos.push(id);
      return escribir(d);
    },

    /** Deja la carta tal cual estaba antes de cualquier cambio del panel. */
    restaurar: function () {
      return escribir({ items: [], ocultos: [] });
    },

    /** Aplica los cambios sobre una lista base (la de js/datos/carta.js). */
    platosEfectivos: function (base) {
      var d = leer();
      var overrides = {};
      d.items.forEach(function (p) { overrides[p.id] = p; });

      var resultado = base
        .filter(function (p) { return d.ocultos.indexOf(p.id) === -1; })
        .map(function (p) { return overrides[p.id] || p; });

      d.items.forEach(function (p) {
        if (!resultado.some(function (r) { return r.id === p.id; })) resultado.push(p);
      });
      return resultado;
    }
  };
})(window.TM);
