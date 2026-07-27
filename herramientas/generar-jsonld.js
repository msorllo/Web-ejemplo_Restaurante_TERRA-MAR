/* ==========================================================================
   Generador del JSON-LD de index.html
   --------------------------------------------------------------------------
   Lee js/datos/negocio.js y js/datos/carta.js y escribe el bloque
   application/ld+json entre los marcadores JSONLD:INICIO / JSONLD:FIN.

   Se ejecuta a mano cada vez que cambie la carta:

       node herramientas/generar-jsonld.js

   El JSON-LD va estático en el HTML a propósito: aunque Google ejecuta JS,
   los datos estructurados servidos en el HTML se indexan antes y mejor.
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');

// Los ficheros de datos son scripts clásicos que escriben en window.TM
const contexto = { window: {}, console };
contexto.window.TM = {};
vm.createContext(contexto);
for (const f of ['js/datos/negocio.js', 'js/datos/carta.js']) {
  vm.runInContext(fs.readFileSync(path.join(raiz, f), 'utf8'), contexto, { filename: f });
}
const { NEGOCIO: N, CARTA: C } = contexto.window.TM;

const BASE = N.web.replace(/\/$/, '');

const diaNombre = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const horarios = Object.values(N.turnos).map(t => ({
  '@type': 'OpeningHoursSpecification',
  dayOfWeek: t.dias.map(d => diaNombre[d]),
  opens: t.abre,
  closes: t.cierra
}));

const seccion = (cat) => ({
  '@type': 'MenuSection',
  name: cat.nombre.es,
  hasMenuItem: C.platos.filter(p => p.cat === cat.id).map(p => ({
    '@type': 'MenuItem',
    name: p.nombre.es,
    description: p.desc.es,
    image: `${BASE}/assets/platos/${p.id}.webp`,
    offers: { '@type': 'Offer', price: p.precio.toFixed(2), priceCurrency: 'EUR' }
  }))
});

const bebidas = (titulo, lista, precio) => ({
  '@type': 'MenuSection',
  name: titulo,
  hasMenuItem: lista.map(x => ({
    '@type': 'MenuItem',
    name: x.nombre.es,
    description: x.desc.es,
    offers: { '@type': 'Offer', price: precio(x).toFixed(2), priceCurrency: 'EUR' }
  }))
});

const datos = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  '@id': `${BASE}/#restaurante`,
  name: N.nombre,
  description: 'Cocina de raíz y elegancia mediterránea en el Paseo Marítimo de Benicarló. Producto de la lonja y de la huerta del Maestrat.',
  slogan: N.claim,
  url: BASE + '/',
  telephone: N.tel,
  email: N.email,
  image: [`${BASE}/assets/img/og.jpg`, `${BASE}/assets/img/fachada-1600.jpg`],
  logo: `${BASE}/assets/logo.svg`,
  priceRange: N.rangoPrecio,
  currenciesAccepted: 'EUR',
  paymentAccepted: 'Efectivo, tarjeta de crédito y débito',
  servesCuisine: N.cocina,
  acceptsReservations: `${BASE}/#reservas`,
  maximumAttendeeCapacity: N.aforo,
  address: {
    '@type': 'PostalAddress',
    streetAddress: N.direccion.calle,
    postalCode: N.direccion.cp,
    addressLocality: N.direccion.ciudad,
    addressRegion: N.direccion.provincia,
    addressCountry: N.direccion.pais
  },
  geo: { '@type': 'GeoCoordinates', latitude: N.direccion.lat, longitude: N.direccion.lon },
  openingHoursSpecification: horarios,
  hasMenu: {
    '@type': 'Menu',
    '@id': `${BASE}/carta.html`,
    name: 'Carta Terra & Mar Bistró',
    inLanguage: ['es', 'en', 'fr'],
    hasMenuSection: [
      ...C.categorias.map(seccion),
      bebidas('Cócteles de autor', C.cocteles, x => x.precio),
      bebidas('Selección de vinos (copa)', C.vinos, x => x.copa)
    ]
  }
};

const bloque =
  '<script type="application/ld+json">\n' +
  JSON.stringify(datos, null, 2) +
  '\n</script>';

const destino = path.join(raiz, 'index.html');
let html = fs.readFileSync(destino, 'utf8');
const ini = '<!-- JSONLD:INICIO -->';
const fin = '<!-- JSONLD:FIN -->';

if (!html.includes(ini) || !html.includes(fin)) {
  console.error(`Faltan los marcadores ${ini} … ${fin} en index.html`);
  process.exit(1);
}

html = html.replace(
  new RegExp(`${ini}[\\s\\S]*?${fin}`),
  `${ini}\n${bloque}\n${fin}`
);
fs.writeFileSync(destino, html);

const platos = C.platos.length + C.cocteles.length + C.vinos.length;
console.log(`JSON-LD escrito en index.html · ${platos} artículos, ${datos.hasMenu.hasMenuSection.length} secciones.`);
