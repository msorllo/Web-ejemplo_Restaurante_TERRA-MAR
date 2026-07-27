# Terra & Mar Bistró — web, carta QR y panel de reservas

Web de ejemplo para hostelería, construida por **[Mistereia](https://mistereia.com)**
sobre la carta y la identidad reales de Terra & Mar Bistró (Paseo Marítimo 45,
Benicarló).

Son tres piezas que comparten los mismos datos:

| Fichero | Qué es | Para quién |
|---|---|---|
| `index.html` | Web pública de una sola página | El cliente que busca dónde cenar |
| `carta.html` | Carta ligera para escanear con QR en la mesa | El cliente ya sentado |
| `panel.html` | Panel de gestión de reservas | El restaurante |

HTML, CSS y JavaScript a pelo. **Cero dependencias, cero build, cero framework.**
Se edita y se sube.

---

## Cómo verla

**Opción rápida:** doble click en `index.html`. Funciona sin servidor y sin
internet.

**Opción recomendada** (así se comporta igual que en producción):

```bash
python -m http.server 5178
```

y abre `http://localhost:5178`.

> Abriéndola con doble click verás en la consola tres avisos de precarga de
> fuentes. Es normal: `<link rel="preload" crossorigin>` no funciona bajo
> `file://`. Las fuentes se cargan igual por la vía normal y en un servidor de
> verdad el aviso desaparece.

---

## Lo que hace que no parezca una web más

- **Modo día ↔ modo noche.** El toggle sol/luna cambia la web entera: de día es
  el bistró (crema, luz mediterránea, la carta); de noche es la barra (azul
  noche, latón, la coctelería). Arranca solo según la hora, y recuerda la
  elección. Es lo que se recuerda al enseñarla.
- **El mar del hero.** Canvas 2D escrito a mano, unos 4 KB, sin librerías: la ola
  del logo hecha superficie de agua. Reacciona al cursor, cambia de color con el
  tema, se detiene si no está en pantalla y se queda quieta con
  `prefers-reduced-motion`.
- **Carta con la foto flotando.** En escritorio, la foto del plato sigue al
  cursor; en móvil se despliega dentro de la ficha. Filtros por categoría y por
  alérgeno.
- **Galería anclada.** En escritorio el scroll vertical mueve las fotos en
  horizontal. En móvil **no se secuestra el scroll**: pasa a carrusel táctil.
- **Español, inglés y francés** con un toggle, sin recargar.
- **Reserva en la web → aparece en el panel al instante**, incluso con el panel
  abierto en otra pestaña.

---

## Estructura

```
├── index.html · carta.html · panel.html
├── css/
│   ├── base.css          tokens de color día/noche, tipografía, reset
│   ├── componentes.css   nav, botones, formularios, tarjetas, pie
│   ├── secciones.css     cada sección de la portada + la carta QR
│   └── panel.css         panel de gestión (tema oscuro propio)
├── js/
│   ├── datos/negocio.js  contacto, dirección y HORARIOS  ← fuente única
│   ├── datos/carta.js    platos, cócteles y vinos        ← fuente única
│   ├── datos/i18n.js     todos los textos en es/en/fr    ← fuente única
│   ├── almacen.js        persistencia de reservas (hoy localStorage)
│   ├── escena.js         un único bucle de scroll para toda la página
│   ├── mar.js            el canvas del hero
│   ├── carta-ui.js       pinta carta y bodega, filtros, foto flotante
│   ├── galeria.js        carril horizontal anclado
│   ├── reservas.js       formularios de reserva, eventos y regalo
│   ├── idioma.js · tema.js · panel.js
├── assets/  fonts/ · img/ · platos/ · logo.svg
├── herramientas/         scripts de mantenimiento (ver más abajo)
├── FOTOS.md              cómo generar las fotos que faltan
└── sitemap.xml · robots.txt · site.webmanifest
```

**Regla de oro:** los precios, los horarios y los textos están **en un solo
sitio**. Cambia `js/datos/carta.js` y se actualizan a la vez la portada, la
carta QR, el buscador, los filtros de alérgenos y el ticket medio del panel.

---

## Cambiar cosas

| Quiero… | Toco… |
|---|---|
| Subir un precio o cambiar un plato | `js/datos/carta.js` |
| Cambiar horarios, teléfono o dirección | `js/datos/negocio.js` |
| Cambiar cualquier texto de la web | `js/datos/i18n.js` |
| Cambiar colores o tipografía | los tokens al principio de `css/base.css` |
| Añadir la foto de un plato | dejar el fichero en `assets/platos/` — ver `FOTOS.md` |

Después de tocar la carta, regenera los datos estructurados:

```bash
node herramientas/generar-jsonld.js
```

### Herramientas

| Script | Para qué |
|---|---|
| `node herramientas/generar-jsonld.js` | Reescribe el JSON-LD de `index.html` desde la carta. Obligatorio tras cambiar platos o precios |
| `python herramientas/preparar-fotos.py` | Convierte las fotos nuevas al formato correcto y dice cuáles faltan |
| `python herramientas/subsetear-fuentes.py` | Recorta las fuentes a los caracteres que usa la web. Solo si cambias mucho texto |

---

## Rendimiento y accesibilidad

Medido con Lighthouse en **móvil**, sirviendo con gzip y cabeceras de caché,
que es como lo hace cualquier hosting real (Netlify, Vercel, Nginx):

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| `index.html` | **96** | **100** | **100** | **100** |
| `carta.html` | **99** | **100** | **100** | **100** |

`index.html` en móvil, primera visita: **289 KB** en total (101 KB de fuentes,
126 KB de imágenes, 51 KB de código). `carta.html`: **145 KB**.

Sirviendo **sin compresión** el rendimiento baja a 87: casi todo el margen está
en que el servidor comprima. Cualquier hosting decente lo hace solo; si es un
Apache o Nginx propio, activa gzip/brotli para `.html`, `.css` y `.js`.

Cosas concretas que se hicieron para llegar ahí:

- **Fuentes propias y recortadas.** Fraunces con sus cuatro ejes pesaba 542 KB;
  fijando los ejes que el diseño no mueve y dejando solo los caracteres que la
  web usa se quedó en 106 KB, conservando la cursiva real y el tamaño óptico.
- **Sin saltos de layout** (CLS 0 en la portada): las fuentes de reserva llevan
  las métricas ajustadas a las reales, y los scripts arrancan donde están, al
  final del `<body>`, en vez de esperar a `DOMContentLoaded`.
- **Las fotos que aún no existen no se piden.** Cada plato sin imagen enseña un
  marcador hecho con CSS; la foto solo se solicita cuando alguien abre o
  sobrevuela ese plato.
- Contraste **AA verificado en los dos temas** (se calculó, no se estimó).
- Todo el movimiento respeta `prefers-reduced-motion`.

---

## Reservas: cómo funciona hoy y cómo se conecta de verdad

Ahora mismo las reservas se guardan en el **localStorage del navegador**. Es lo
que permite enseñar la demo en el móvil de un cliente sin servidor ni internet.
Tiene un límite obvio: **solo se ven en ese navegador**.

Para pasarlo a producción hay **un único fichero que tocar**: `js/almacen.js`.
Sus cuatro funciones (`leer`, `escribir`, `anadir`, `actualizar`) se
reimplementan contra una API y ni el formulario ni el panel se enteran:

```js
anadir: function (datos) {
  return fetch('/api/reservas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  }).then(r => r.json());
}
```

Encaja igual de bien con Supabase, PocketBase o un webhook de n8n. Lo que
seguiría funcionando sin cambios: la validación, los turnos según el día, el
botón de WhatsApp, los estados y los KPIs.

---

## Pendiente

Cosas que dependen del cliente o de una decisión, no del código:

1. **Las 16 fotos de los platos que faltan.** Todo listo para recibirlas:
   instrucciones y prompts en **`FOTOS.md`**.
2. **Confirmar el horario.** La carta oficial dice *Mar–Dom 13:30–16:00* y
   *Jue–Sáb 20:30–23:30*, así que está implementado tal cual — pero implica que
   **solo se cena de jueves a sábado**. Si no es así, se corrige en
   `js/datos/negocio.js` y se propaga a todo (indicador de "abierto ahora",
   turnos del formulario, JSON-LD y pie).
3. **Textos a validar con el restaurante.** Las secciones *Cocina y sala*,
   *Eventos & privados* y *Tarjeta regalo* no venían en la carta: están
   redactadas en la línea de "cocina de raíz", sin inventar datos verificables
   (ni nombres de chef, ni premios, ni cifras).
4. **Traducciones EN y FR:** escritas aquí. Para un cliente real conviene una
   revisión nativa.
5. **Coordenadas del mapa:** las del JSON-LD son aproximadas del paseo marítimo.
6. **Datos de contacto:** teléfono, email y redes son los de la carta de
   ejemplo. Cambiar en `js/datos/negocio.js` antes de publicar.
7. **Opiniones:** no hay sección de reseñas porque no hay reseñas reales.
8. **Legal:** los enlaces de aviso legal, privacidad y cookies del pie están
   puestos pero sin páginas detrás.
9. **El panel está solo en español** (es una herramienta interna del
   restaurante, no un escaparate).

---

## Publicar

Es una web estática: vale cualquier hosting. Sube la carpeta entera y listo.

Antes de publicar de verdad, busca y sustituye `https://www.terraymarbistro.com`
por el dominio real en `index.html`, `carta.html`, `sitemap.xml`, `robots.txt` y
`herramientas/generar-jsonld.js`.

`panel.html` lleva `noindex` y está excluido en `robots.txt`. Aun así, **no es
una zona privada**: cualquiera con la URL entra. Con backend real hay que
ponerle autenticación.

El fichero **`_headers`** ya trae las cabeceras de caché recomendadas (lo
respetan Netlify y Cloudflare Pages tal cual; en otro hosting hay que
configurar el equivalente a mano). Las fotos de `assets/platos/` llevan cache
corto a propósito, para que sustituir un fichero por otro con el mismo nombre
(el flujo de `FOTOS.md`) se vea enseguida.

---

Diseño y desarrollo: **[Mistereia](https://mistereia.com)**
