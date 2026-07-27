# Fotografías de los platos

La web ya funciona sin las fotos: cada plato sin imagen enseña un marcador
generado con CSS (nada que descargar) que deja claro cuál falta. En cuanto
sueltes la foto con el nombre correcto, **aparece sola: no hay que tocar código**.

De los 17 platos hay **1 hecho** (`pulpo-brasa`, recortado de la foto real que
me pasaste) y **16 pendientes**.

---

## Cómo se hace, paso a paso

1. Copia el **prompt base** de aquí abajo y pégale el trozo del plato que toque.
2. Genera la imagen en una herramienta gratuita con cuenta de Google:
   **ImageFX** (`labs.google/fx/tools/image-fx`), **Whisk** o **Gemini**.
   Formato **4:3 horizontal**. Si la herramienta solo da cuadrado, no pasa nada:
   el script recorta.
3. Descárgala y guárdala con **el nombre exacto de la tabla** (por ejemplo
   `croquetas-rabo-toro.png`) dentro de:

   ```
   assets/platos/_entrada/
   ```

4. Ejecuta esto una vez tengas varias:

   ```bash
   python herramientas/preparar-fotos.py
   ```

   Recorta a 4:3, ajusta a 900 px, convierte a `.webp`, las deja en
   `assets/platos/` y te dice cuáles siguen faltando.

5. Recarga la web. Ya están.

> Si prefieres saltarte el script: guarda la imagen directamente como
> `assets/platos/<nombre>.webp` a 900 × 675 px y listo.

---

## Prompt base (va SIEMPRE delante)

Esto es lo que hace que las 17 fotos parezcan una sola sesión y no un collage
de estilos distintos. **No lo cambies entre plato y plato.**

```
Professional food photography for an upscale Mediterranean bistro menu.
Shot on a 50mm lens at f/2.8, camera at a 45-degree angle above the plate,
subject filling about 70% of the frame.
Soft warm daylight from a large window on the left, gentle falloff, soft
natural shadow to the right, no harsh highlights, no flash.
The dish is plated on a HANDMADE CERAMIC PLATE, off-white with a warm
terracotta rim and faint blue-green brushstrokes.
The plate rests on a raw cream linen tablecloth with visible weave.
Background: heavily blurred restaurant interior, warm wood beams and dark
green velvet banquettes, out of focus (bokeh).
Warm colour grading: cream, terracotta, olive green and brass.
Clean composition, no cutlery clutter, no text, no watermark, no hands,
no logos. Photorealistic, editorial quality, appetising.
Horizontal 4:3 framing.
The dish is:
```

---

## Los 17 platos

El nombre de fichero es también el identificador interno: **cópialo tal cual**.

| # | Nombre de fichero | Plato | Qué pedir después del prompt base |
|---|---|---|---|
| 1 | `croquetas-rabo-toro` | Croquetas de rabo de toro | six golden-brown breaded croquettes arranged in a loose line, crisp panko crust, one broken open showing the creamy oxtail filling, with three small dots of dark truffle emulsion alongside |
| 2 | `tartar-salmon` | Tartar de salmón noruego | a neat round tower of hand-diced raw Norwegian salmon topped with diced avocado and capers, a drizzle of citrus vinaigrette around it, two thin sourdough toasts leaning on the side |
| 3 | `carpaccio-angus` | Carpaccio de ternera Angus | very thin slices of raw Angus beef covering the whole plate, scattered shaved Parmesan, a small mound of rocket in the centre, a thread of green olive oil and cracked pepper |
| 4 | `zamburinas-horno` | Zamburiñas al horno | five queen scallops served in their fan-shaped shells, gratinated golden on top with garlic and chopped parsley, arranged in a circle, a wedge of lemon at the edge |
| 5 | `burrata-trufada` | Ensalada de burrata trufada | one whole creamy burrata torn open in the centre, confit cherry tomatoes around it, fresh rocket leaves, bright green basil oil pooled on the plate |
| 6 | `pulpo-brasa` | Pulpo a la brasa *(ya hecha)* | a thick charred grilled octopus tentacle coiled over a swirl of smooth yellow potato parmentier, dusted with smoked paprika, olive oil and paprika oil dots around |
| 7 | `bacalao-confitado` | Lomo de bacalao confitado | a thick white cod loin, flaking, glossy from confit oil, resting on a bed of chunky tomato-and-pepper pisto, crowned with a nest of crisp fried leek |
| 8 | `corvina-plancha` | Corvina a la plancha | a seared meagre fillet with a green herb crust and golden skin, four green asparagus spears beside it, a ribbon of pale hollandaise sauce |
| 9 | `tataki-atun` | Tataki de atún rojo | five slices of seared bluefin tuna, deep ruby red inside with a thin sesame-crusted seared edge, fanned out, a quenelle of pale green wasabi mayonnaise and a small mound of dark green wakame salad |
| 10 | `pluma-iberica` | Pluma ibérica a la parrilla | sliced grilled Ibérico pork pluma, pink and juicy inside with dark grill marks, over a smear of orange roast sweet potato purée, glossy dark Pedro Ximénez reduction drizzled around |
| 11 | `entrecot-madurado` | Entrecot de vaca madurada | a thick dry-aged beef entrecôte already carved into slices, medium rare pink centre, dark seared crust, rustic rosemary potatoes and blistered green Padrón peppers on the side, flaky salt on top |
| 12 | `magret-pato` | Magret de pato | fanned slices of duck magret with crisp scored golden skin and rosy meat, a spoonful of spiced apple compote, a glossy red berry sauce drawn across the plate |
| 13 | `risotto-setas` | Risotto de setas silvestres | a creamy mushroom risotto spread in a shallow pool, mixed wild mushrooms on top, a thin lacy golden Parmesan crisp standing upright, chopped chives |
| 14 | `lasana-pato` | Lasaña abierta de pato | an open lasagne: three squares of fresh pasta layered loosely with shredded confit duck ragù and light béchamel between them, sauce pooled around the base |
| 15 | `tarta-queso` | Tarta de queso tradicional | a wedge of baked Basque-style cheesecake, deeply caramelised burnt top, very creamy pale centre visibly soft, biscuit base, plated alone on a small plate |
| 16 | `volcan-chocolate` | Volcán de chocolate negro | a small dark chocolate fondant already cut open with molten chocolate flowing out, one scoop of vanilla ice cream beside it starting to melt, cocoa dust |
| 17 | `torrija-brioche` | Torrija de pan brioche | a thick slab of brioche torrija with a dark caramelised griddled top, served warm, one quenelle of pale nougat ice cream on top, caramel sauce around the base |

---

## Consejos para que salgan bien

- **Genera 3 o 4 variantes de cada plato y quédate con la que mejor case** con
  las que ya tengas. La coherencia importa más que la espectacularidad de una.
- Si una imagen sale con **fondo muy distinto** (mármol, madera oscura, pizarra),
  descártala: rompe la serie. El fondo tiene que ser siempre lino crudo con el
  comedor desenfocado.
- Los platos de **postre** (15, 16, 17) suelen salir mejor si añades al final
  `shallow depth of field, dessert plated on a smaller plate`.
- Si el generador insiste en poner **cubiertos o manos**, añade al final
  `absolutely no cutlery, no hands, no napkins`.

---

## Opcionales (la web no los necesita)

Estas fotos mejorarían la web pero ahora mismo se resuelven con las imágenes
reales que ya me pasaste:

| Para qué | Estado |
|---|---|
| Hero de día | Hecho: fachada al atardecer |
| Hero de noche | Hecho: la barra |
| Galería (5 fotos) | Hecho: fachada, comedor, barra, mesa, pulpo |
| Sección Cocina y sala | Usa la foto del comedor. Una foto real del equipo quedaría mejor |
| Fotos de los 4 cócteles | No hay hueco en la interfaz todavía. Es un cambio pequeño si lo quieres |

---

## Si cambia la carta

Los nombres de fichero salen de `js/datos/carta.js`. Si añades o quitas platos,
vuelve a ejecutar `python herramientas/preparar-fotos.py` sin imágenes en la
carpeta de entrada: te listará los nombres actualizados. Y acuérdate de
regenerar los datos estructurados con `node herramientas/generar-jsonld.js`.
