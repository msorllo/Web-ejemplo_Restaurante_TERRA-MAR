/* ==========================================================================
   TERRA & MAR BISTRÓ — carta.js
   FUENTE ÚNICA de la carta. La consumen index.html, carta.html y el JSON-LD.

   FOTOGRAFÍAS
   -----------
   El `id` de cada plato es también el nombre de su fichero:
       assets/platos/<id>.webp
   Si el fichero no existe se pinta un marcador generativo. En cuanto sueltes
   la imagen con ese nombre en la carpeta, aparece sola: no hay que tocar
   ni una línea de código. La lista completa de nombres está en FOTOS.md.

   Precios y descripciones tomados literalmente de la carta oficial.
   ========================================================================== */
window.TM = window.TM || {};

window.TM.CARTA = {

  /* ------------------------------------------------------------ categorías */
  categorias: [
    { id: 'abrir-boca',     nombre: { es: 'Para abrir boca',     en: 'To start',          fr: 'Pour commencer' } },
    { id: 'del-mar',        nombre: { es: 'Del mar',             en: 'From the sea',      fr: 'De la mer' } },
    { id: 'de-la-tierra',   nombre: { es: 'De la tierra',        en: 'From the land',     fr: 'De la terre' } },
    { id: 'pastas-arroces', nombre: { es: 'Pastas y arroces',    en: 'Pasta & rice',      fr: 'Pâtes et riz' } },
    { id: 'postres',        nombre: { es: 'Postres artesanales', en: 'Homemade desserts', fr: 'Desserts maison' } }
  ],

  /* ------------------------------------------------------------- alérgenos */
  alergenos: {
    gluten:         { es: 'Gluten',       en: 'Gluten',      fr: 'Gluten' },
    lacteos:        { es: 'Lácteos',      en: 'Dairy',       fr: 'Produits laitiers' },
    huevo:          { es: 'Huevo',        en: 'Egg',         fr: 'Œuf' },
    pescado:        { es: 'Pescado',      en: 'Fish',        fr: 'Poisson' },
    moluscos:       { es: 'Moluscos',     en: 'Molluscs',    fr: 'Mollusques' },
    'frutos-secos': { es: 'Frutos secos', en: 'Tree nuts',   fr: 'Fruits à coque' },
    soja:           { es: 'Soja',         en: 'Soya',        fr: 'Soja' },
    sesamo:         { es: 'Sésamo',       en: 'Sesame',      fr: 'Sésame' },
    sulfitos:       { es: 'Sulfitos',     en: 'Sulphites',   fr: 'Sulfites' },
    mostaza:        { es: 'Mostaza',      en: 'Mustard',     fr: 'Moutarde' }
  },

  /* ---------------------------------------------------------------- platos */
  platos: [

    /* --- Para abrir boca -------------------------------------------------- */
    {
      id: 'croquetas-rabo-toro', cat: 'abrir-boca', precio: 12.50, destacado: true,
      nombre: {
        es: 'Croquetas melosas de rabo de toro',
        en: 'Silky oxtail croquettes',
        fr: 'Croquettes fondantes de queue de bœuf'
      },
      desc: {
        es: 'Acompañadas de una ligera emulsión de trufa negra. (6 uds.)',
        en: 'Served with a light black truffle emulsion. (6 pieces)',
        fr: 'Accompagnées d’une légère émulsion de truffe noire. (6 pièces)'
      },
      alergenos: ['gluten', 'lacteos', 'huevo', 'sulfitos']
    },
    {
      id: 'tartar-salmon', cat: 'abrir-boca', precio: 16.00,
      nombre: {
        es: 'Tartar de salmón noruego',
        en: 'Norwegian salmon tartare',
        fr: 'Tartare de saumon norvégien'
      },
      desc: {
        es: 'Con aguacate en su punto, alcaparras y una vinagreta suave de cítricos, con tostas de masa madre.',
        en: 'With perfectly ripe avocado, capers and a gentle citrus vinaigrette, with sourdough toasts.',
        fr: 'Avec avocat à point, câpres et une vinaigrette douce aux agrumes, sur toasts au levain.'
      },
      alergenos: ['pescado', 'gluten', 'mostaza']
    },
    {
      id: 'carpaccio-angus', cat: 'abrir-boca', precio: 15.50,
      nombre: {
        es: 'Carpaccio de ternera Angus',
        en: 'Angus beef carpaccio',
        fr: 'Carpaccio de bœuf Angus'
      },
      desc: {
        es: 'Finas láminas acompañadas de lascas de queso parmesano, rúcula y AOVE ecológico.',
        en: 'Fine slices with shavings of Parmesan, rocket and organic extra virgin olive oil.',
        fr: 'Fines tranches avec copeaux de parmesan, roquette et huile d’olive vierge extra bio.'
      },
      alergenos: ['lacteos']
    },
    {
      id: 'zamburinas-horno', cat: 'abrir-boca', precio: 14.00,
      nombre: {
        es: 'Zamburiñas al horno',
        en: 'Baked queen scallops',
        fr: 'Pétoncles au four'
      },
      desc: {
        es: 'Gratinadas con un suave majado de ajo, perejil y un toque de vino blanco.',
        en: 'Gratinated with a gentle garlic and parsley paste and a touch of white wine.',
        fr: 'Gratinés avec une douce persillade à l’ail et une touche de vin blanc.'
      },
      alergenos: ['moluscos', 'sulfitos']
    },
    {
      id: 'burrata-trufada', cat: 'abrir-boca', precio: 13.50,
      nombre: {
        es: 'Ensalada de burrata trufada',
        en: 'Truffled burrata salad',
        fr: 'Salade de burrata truffée'
      },
      desc: {
        es: 'Sobre cama de tomates cherry confitados, rúcula fresca y aceite de albahaca.',
        en: 'On a bed of confit cherry tomatoes, fresh rocket and basil oil.',
        fr: 'Sur un lit de tomates cerises confites, roquette fraîche et huile de basilic.'
      },
      alergenos: ['lacteos']
    },
    {
      id: 'pulpo-brasa', cat: 'abrir-boca', precio: 19.50, destacado: true,
      nombre: {
        es: 'Pulpo a la brasa',
        en: 'Grilled octopus',
        fr: 'Poulpe grillé'
      },
      desc: {
        es: 'Servido sobre parmentier de patata ahumada y un toque de pimentón de la Vera.',
        en: 'Served over smoked potato parmentier with a touch of La Vera paprika.',
        fr: 'Servi sur un parmentier de pomme de terre fumée et une touche de paprika de la Vera.'
      },
      alergenos: ['moluscos', 'lacteos']
    },

    /* --- Del mar ----------------------------------------------------------- */
    {
      id: 'bacalao-confitado', cat: 'del-mar', precio: 21.00,
      nombre: {
        es: 'Lomo de bacalao confitado',
        en: 'Confit cod loin',
        fr: 'Dos de morue confit'
      },
      desc: {
        es: 'A baja temperatura, servido sobre un pisto tradicional y coronado con crujiente de puerro.',
        en: 'Cooked at low temperature over traditional pisto, crowned with crisp leek.',
        fr: 'Cuit à basse température sur une ratatouille traditionnelle, couronné de poireau croustillant.'
      },
      alergenos: ['pescado', 'gluten']
    },
    {
      id: 'corvina-plancha', cat: 'del-mar', precio: 22.50,
      nombre: {
        es: 'Corvina a la plancha',
        en: 'Grilled meagre',
        fr: 'Maigre à la plancha'
      },
      desc: {
        es: 'Con costra de hierbas provenzales, acompañada de espárragos trigueros y salsa holandesa.',
        en: 'With a Provençal herb crust, wild asparagus and hollandaise sauce.',
        fr: 'En croûte d’herbes de Provence, avec asperges sauvages et sauce hollandaise.'
      },
      alergenos: ['pescado', 'huevo', 'lacteos']
    },
    {
      id: 'tataki-atun', cat: 'del-mar', precio: 24.00, destacado: true,
      nombre: {
        es: 'Tataki de atún rojo',
        en: 'Bluefin tuna tataki',
        fr: 'Tataki de thon rouge'
      },
      desc: {
        es: 'Sellado a la plancha con sésamo, acompañado de mayonesa de wasabi y ensalada wakame.',
        en: 'Seared with sesame, served with wasabi mayonnaise and wakame salad.',
        fr: 'Saisi au sésame, servi avec mayonnaise au wasabi et salade de wakamé.'
      },
      alergenos: ['pescado', 'sesamo', 'soja', 'huevo']
    },

    /* --- De la tierra ------------------------------------------------------- */
    {
      id: 'pluma-iberica', cat: 'de-la-tierra', precio: 20.50,
      nombre: {
        es: 'Pluma ibérica a la parrilla',
        en: 'Grilled Ibérico pork pluma',
        fr: 'Pluma de porc ibérique grillée'
      },
      desc: {
        es: 'Jugosa carne de cerdo ibérico con puré de boniato asado y reducción de Pedro Ximénez.',
        en: 'Juicy Ibérico pork with roast sweet potato purée and a Pedro Ximénez reduction.',
        fr: 'Porc ibérique juteux, purée de patate douce rôtie et réduction de Pedro Ximénez.'
      },
      alergenos: ['sulfitos']
    },
    {
      id: 'entrecot-madurado', cat: 'de-la-tierra', precio: 26.00, destacado: true,
      nombre: {
        es: 'Entrecot de vaca madurada (300 g)',
        en: 'Dry-aged beef entrecôte (300 g)',
        fr: 'Entrecôte de bœuf maturée (300 g)'
      },
      desc: {
        es: 'Trinchado y servido con patatas rústicas al romero y pimientos del Padrón.',
        en: 'Carved and served with rosemary rustic potatoes and Padrón peppers.',
        fr: 'Tranchée et servie avec pommes de terre rustiques au romarin et poivrons du Padrón.'
      },
      alergenos: []
    },
    {
      id: 'magret-pato', cat: 'de-la-tierra', precio: 23.00,
      nombre: {
        es: 'Magret de pato',
        en: 'Duck magret',
        fr: 'Magret de canard'
      },
      desc: {
        es: 'Fileteado sobre una compota de manzana especiada y salsa de frutos rojos.',
        en: 'Sliced over spiced apple compote with a red berry sauce.',
        fr: 'Tranché sur une compote de pommes épicée et sauce aux fruits rouges.'
      },
      alergenos: ['sulfitos']
    },

    /* --- Pastas y arroces ---------------------------------------------------- */
    {
      id: 'risotto-setas', cat: 'pastas-arroces', precio: 16.50,
      nombre: {
        es: 'Risotto de setas silvestres',
        en: 'Wild mushroom risotto',
        fr: 'Risotto aux champignons sauvages'
      },
      desc: {
        es: 'Arroz cremoso con variedad de setas de temporada, mantequilla y crujiente de parmesano.',
        en: 'Creamy rice with a mix of seasonal mushrooms, butter and a Parmesan crisp.',
        fr: 'Riz crémeux aux champignons de saison, beurre et tuile de parmesan.'
      },
      alergenos: ['lacteos', 'sulfitos']
    },
    {
      id: 'lasana-pato', cat: 'pastas-arroces', precio: 18.00,
      nombre: {
        es: 'Lasaña abierta de pato',
        en: 'Open duck lasagne',
        fr: 'Lasagne ouverte au canard'
      },
      desc: {
        es: 'Capas de pasta fresca intercaladas con ragú de pato confitado y bechamel ligera.',
        en: 'Layers of fresh pasta with confit duck ragù and a light béchamel.',
        fr: 'Couches de pâtes fraîches, ragoût de canard confit et béchamel légère.'
      },
      alergenos: ['gluten', 'lacteos', 'huevo']
    },

    /* --- Postres -------------------------------------------------------------- */
    {
      id: 'tarta-queso', cat: 'postres', precio: 7.50,
      nombre: {
        es: 'Tarta de queso tradicional',
        en: 'Traditional cheesecake',
        fr: 'Cheesecake traditionnel'
      },
      desc: {
        es: 'Horneada, con un centro muy cremoso y base de galleta artesanal.',
        en: 'Oven-baked, with a very creamy centre on a homemade biscuit base.',
        fr: 'Cuit au four, cœur très crémeux sur une base de biscuit maison.'
      },
      alergenos: ['lacteos', 'gluten', 'huevo']
    },
    {
      id: 'volcan-chocolate', cat: 'postres', precio: 8.00, destacado: true,
      nombre: {
        es: 'Volcán de chocolate negro',
        en: 'Dark chocolate fondant',
        fr: 'Fondant au chocolat noir'
      },
      desc: {
        es: 'Bizcocho fluido por dentro, contrastado con una bola de helado de vainilla Bourbon.',
        en: 'Molten in the middle, set against a scoop of Bourbon vanilla ice cream.',
        fr: 'Cœur coulant, contrasté par une boule de glace à la vanille Bourbon.'
      },
      alergenos: ['gluten', 'lacteos', 'huevo', 'soja']
    },
    {
      id: 'torrija-brioche', cat: 'postres', precio: 7.50,
      nombre: {
        es: 'Torrija de pan brioche',
        en: 'Brioche torrija',
        fr: 'Pain perdu à la brioche'
      },
      desc: {
        es: 'Caramelizada a la plancha, servida tibia con helado de turrón de Jijona.',
        en: 'Caramelised on the griddle, served warm with Jijona nougat ice cream.',
        fr: 'Caramélisé à la plancha, servi tiède avec une glace au nougat de Jijona.'
      },
      alergenos: ['gluten', 'lacteos', 'huevo', 'frutos-secos']
    }
  ],

  /* -------------------------------------------------------------- cócteles */
  cocteles: [
    {
      id: 'brisa-benicarlo', precio: 10.00,
      nombre: { es: 'Brisa de Benicarló', en: 'Benicarló Breeze', fr: 'Brise de Benicarló' },
      desc: {
        es: 'Ginebra premium, limoncello artesanal, hojas de albahaca fresca y tónica neutra. Muy refrescante.',
        en: 'Premium gin, artisan limoncello, fresh basil leaves and neutral tonic. Very refreshing.',
        fr: 'Gin premium, limoncello artisanal, feuilles de basilic frais et tonic neutre. Très rafraîchissant.'
      },
      alergenos: []
    },
    {
      id: 'ocaso-mediterraneo', precio: 9.50,
      nombre: { es: 'Ocaso en el Mediterráneo', en: 'Mediterranean Sunset', fr: 'Coucher de soleil méditerranéen' },
      desc: {
        es: 'Aperol, zumo natural de pomelo rosa, cava brut nature y una ramita de romero quemado.',
        en: 'Aperol, fresh pink grapefruit juice, brut nature cava and a sprig of burnt rosemary.',
        fr: 'Aperol, jus frais de pamplemousse rose, cava brut nature et une branche de romarin brûlé.'
      },
      alergenos: ['sulfitos']
    },
    {
      id: 'terra-mar-espresso', precio: 11.00,
      nombre: { es: 'Terra & Mar Espresso', en: 'Terra & Mar Espresso', fr: 'Terra & Mar Espresso' },
      desc: {
        es: 'Vodka, licor de café de especialidad, un shot de espresso intenso y sirope de vainilla.',
        en: 'Vodka, speciality coffee liqueur, a shot of intense espresso and vanilla syrup.',
        fr: 'Vodka, liqueur de café de spécialité, un shot d’espresso intense et sirop de vanille.'
      },
      alergenos: []
    },
    {
      id: 'roble-ahumado', precio: 12.50, destacado: true,
      nombre: { es: 'El Roble Ahumado', en: 'The Smoked Oak', fr: 'Le Chêne Fumé' },
      desc: {
        es: 'Whisky Bourbon, sirope de arce, bitter de naranja y un toque de humo de madera de roble servido en campana.',
        en: 'Bourbon whiskey, maple syrup, orange bitters and a touch of oak smoke, served under a cloche.',
        fr: 'Whisky Bourbon, sirop d’érable, bitter à l’orange et une touche de fumée de chêne, servi sous cloche.'
      },
      alergenos: ['gluten']
    }
  ],

  /* ----------------------------------------------------------------- vinos */
  vinos: [
    {
      id: 'rueda-verdejo', tipo: 'blanco', copa: 4.50, botella: 22.00,
      nombre: { es: 'D.O. Rueda · Verdejo', en: 'D.O. Rueda · Verdejo', fr: 'D.O. Rueda · Verdejo' },
      desc: {
        es: 'Fresco, afrutado y con una excelente acidez que acompaña perfectamente los pescados.',
        en: 'Fresh, fruity and with excellent acidity — a perfect match for the fish dishes.',
        fr: 'Frais, fruité et d’une excellente acidité, parfait avec les poissons.'
      }
    },
    {
      id: 'rias-baixas-albarino', tipo: 'blanco', copa: 5.00, botella: 25.00,
      nombre: { es: 'D.O. Rías Baixas · Albariño', en: 'D.O. Rías Baixas · Albariño', fr: 'D.O. Rías Baixas · Albariño' },
      desc: {
        es: 'Elegante, floral y con notas salinas.',
        en: 'Elegant, floral and with saline notes.',
        fr: 'Élégant, floral et aux notes salines.'
      }
    },
    {
      id: 'ribera-crianza', tipo: 'tinto', copa: 5.50, botella: 26.00,
      nombre: { es: 'D.O. Ribera del Duero · Crianza', en: 'D.O. Ribera del Duero · Crianza', fr: 'D.O. Ribera del Duero · Crianza' },
      desc: {
        es: 'Intenso, con notas a frutos rojos maduros y madera tostada.',
        en: 'Intense, with notes of ripe red fruit and toasted oak.',
        fr: 'Intense, aux notes de fruits rouges mûrs et de bois toasté.'
      }
    },
    {
      id: 'rioja-reserva', tipo: 'tinto', copa: 6.00, botella: 29.00,
      nombre: { es: 'D.O. Rioja · Reserva', en: 'D.O. Rioja · Reserva', fr: 'D.O. Rioja · Reserva' },
      desc: {
        es: 'Un clásico equilibrado, especiado y con largo final en boca.',
        en: 'A balanced classic: spiced, with a long finish.',
        fr: 'Un classique équilibré, épicé et à la longue finale.'
      }
    },
    {
      id: 'cava-brut-nature', tipo: 'cava', copa: 5.00, botella: 24.00,
      nombre: { es: 'Cava · Brut Nature Reserva', en: 'Cava · Brut Nature Reserva', fr: 'Cava · Brut Nature Reserva' },
      desc: {
        es: 'Burbuja fina, notas cítricas y pastelería. Ideal para brindar.',
        en: 'Fine bubbles, citrus and pastry notes. Made for a toast.',
        fr: 'Bulles fines, notes d’agrumes et de pâtisserie. Idéal pour trinquer.'
      }
    }
  ]
};

/* Todo vino o cava lleva sulfitos: se marca aquí y no en cada ficha. */
window.TM.CARTA.vinos.forEach(function (v) { v.alergenos = ['sulfitos']; });
