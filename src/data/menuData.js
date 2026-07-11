// Carta real de Arrecife (Restaurant Parrillada, desde 1986).
// Cada item pertenece a una categoria (categoryId) y opcionalmente a un
// subgrupo (subgroup), usado sobre todo en Vinos, Whiskies y Tragos donde
// la carta impresa agrupa por sub-secciones.

export const CATEGORIES = [
  { id: 'entradas', label: 'Entradas', note: 'Panera $130' },
  { id: 'ensaladas', label: 'Ensaladas' },
  {
    id: 'minutas',
    label: 'Minutas',
    note: 'Guarniciones a elección: ensalada rusa, ensalada mixta, papas fritas, puré de papa o arroz.',
  },
  {
    id: 'veganos-celiacos',
    label: 'Veganos y Celíacos',
    note: 'Panera (opción apta para celíacos) $110',
  },
  {
    id: 'brasas',
    label: 'Las Brasas',
    note: 'Guarniciones a elección $250: ensalada rusa, ensalada mixta, papas fritas o puré de papa.',
  },
  {
    id: 'mar',
    label: 'Del Mar',
    note: 'Guarniciones a elección: hojas verdes y cherrys, papas fritas, puré de papas, puré de calabaza con miel y oliva, arroz o cous cous con vegetales.',
  },
  {
    id: 'pastas',
    label: 'Nuestras Pastas',
    note: 'Salsa a elección: cuatro quesos, crema de hongos, rosa filetto o bolognesa.',
  },
  { id: 'pizzas', label: 'Pizzas' },
  {
    id: 'infantil',
    label: 'Menú Infantil',
    note: 'Para menores de 10 años. Incluye agua saborizada Salus 600cc y helado palito a elección.',
  },
  { id: 'postres', label: 'Postres' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'limonadas', label: 'Limonadas, Jugos y Licuados' },
  { id: 'cafeteria', label: 'Cafetería' },
  { id: 'cervezas', label: 'Cervezas' },
  { id: 'whiskies', label: 'Whiskies' },
  { id: 'vinos', label: 'Vinos' },
  { id: 'tragos', label: 'Tragos' },
]

export const MENU_ITEMS = [
  // Entradas
  { id: 'ent-01', categoryId: 'entradas', name: 'Rabas de calamar', description: 'Con dip de mayonesa cítrica.', price: 650, tags: [] },
  { id: 'ent-02', categoryId: 'entradas', name: 'Miniaturas de pescado', description: 'Con alioli y ciboulette.', price: 650, tags: [] },
  { id: 'ent-03', categoryId: 'entradas', name: 'Provolone fundido', description: '', price: 480, tags: ['vegetariano'] },
  { id: 'ent-04', categoryId: 'entradas', name: 'Provolone Arrecife', description: 'Panceta, olivas, pimientos asados y verdeo.', price: 580, tags: [] },
  { id: 'ent-05', categoryId: 'entradas', name: 'Revuelto Gramajo', description: 'Jamón, panceta, cebolla, morrón, perejil, huevo y limón en gajos.', price: 620, tags: [] },
  { id: 'ent-06', categoryId: 'entradas', name: 'Quesadillas de pollo y bacon', description: 'Con tomate confitado, queso fundido y cebolla, acompañadas con fritas y guacamole.', price: 590, tags: [] },
  { id: 'ent-07', categoryId: 'entradas', name: 'Tacos de carne', description: 'Carne cortada a cuchillo, verduras crocantes, porotos refritos, pimentón y panceta, con papas fritas y salsa picante.', price: 590, tags: [] },
  { id: 'ent-08', categoryId: 'entradas', name: 'Galletas de algas', description: 'Para llevar.', price: 180, tags: ['take_away'] },

  // Ensaladas
  { id: 'ens-01', categoryId: 'ensaladas', name: 'Mixta', description: 'Lechuga, tomate y cebolla.', price: 320, tags: [] },
  { id: 'ens-02', categoryId: 'ensaladas', name: 'César', description: 'Mix de verdes, daditos de pollo, parmesano, croutons y aderezo césar.', price: 680, tags: [] },
  { id: 'ens-03', categoryId: 'ensaladas', name: 'Mediterránea', description: 'Mix de verdes, berenjenas asadas, parmesano, olivas negras, tomates confitados, chips de jamón crudo y vinagreta de mostaza de Dijon.', price: 680, tags: [] },
  { id: 'ens-04', categoryId: 'ensaladas', name: 'De la huerta', description: 'Lechuga, rúcula, albahaca, tomate, zanahoria, repollo, maíz, huevo duro, olivas, daditos de queso y lascas de parmesano.', price: 680, tags: [] },
  { id: 'ens-05', categoryId: 'ensaladas', name: 'Francesa', description: 'Mix de verdes, peras, roquefort, almendras, apio, croutons y semillas de girasol.', price: 750, tags: [] },
  { id: 'ens-06', categoryId: 'ensaladas', name: 'Valen', description: 'Mix de verdes, duraznos asados, castañas de cajú, dátiles, queso de cabra, tomates cherrys, vinagreta de arándanos y agave.', price: 750, tags: [] },

  // Minutas
  { id: 'min-01', categoryId: 'minutas', name: 'Papas fritas', description: '', price: 320, tags: ['vegetariano'] },
  { id: 'min-02', categoryId: 'minutas', name: 'Papas fritas con crema de hongos', description: '', price: 430, tags: ['vegetariano'] },
  { id: 'min-03', categoryId: 'minutas', name: 'Papas fritas rústicas', description: 'Con salsa cheddar, panceta crocante y verdeo.', price: 460, tags: [] },
  { id: 'min-04', categoryId: 'minutas', name: 'Milanesa de carne', description: 'Con guarnición.', price: 730, tags: [], requiresGuarnicion: true },
  { id: 'min-05', categoryId: 'minutas', name: 'Milanesa de pollo', description: 'Con guarnición.', price: 730, tags: [], requiresGuarnicion: true },
  { id: 'min-06', categoryId: 'minutas', name: 'Milanesa Napolitana', description: 'Muzzarella fundida, jamón, salsa de tomate y orégano, con guarnición.', price: 780, tags: [], requiresGuarnicion: true },
  { id: 'min-07', categoryId: 'minutas', name: 'Milanesa a caballo', description: 'Con dos huevos fritos y guarnición.', price: 780, tags: [], requiresGuarnicion: true },
  { id: 'min-08', categoryId: 'minutas', name: 'Milanesa tres quesos', description: 'Gratinada con muzzarella, provolone, roquefort y pimientos asados, con guarnición.', price: 780, tags: [], requiresGuarnicion: true },
  { id: 'min-09', categoryId: 'minutas', name: 'Milanesa de la casa', description: 'Cheddar, panceta, cebolla caramelizada y verdeo, con guarnición.', price: 800, tags: [], requiresGuarnicion: true },
  { id: 'min-10', categoryId: 'minutas', name: 'Chivito canadiense al pan', description: 'Lomo, muzzarella, jamón, panceta, olivas, tomate, lechuga, huevo frito y papas fritas.', price: 730, tags: [] },
  { id: 'min-11', categoryId: 'minutas', name: 'Chivito al plato completo', description: 'Lomo, muzzarella, jamón, panceta, olivas, huevo frito, ensalada mixta, rusa y papas fritas.', price: 820, tags: [] },
  { id: 'min-12', categoryId: 'minutas', name: 'Hamburguesa americana', description: 'Pan brioche con sésamo, carne magra, panceta, cheddar, cebolla caramelizada, lechuga, tomate, huevo a la plancha, mayonesa y papas rústicas.', price: 730, tags: [] },

  // Veganos y Celiacos
  { id: 'veg-01', categoryId: 'veganos-celiacos', name: 'Hamburguesa de garbanzo', description: 'Garbanzo, quinoa y kale con ensalada de hojas verdes, tomates cherry, papas rústicas y mayonesa de zanahoria.', price: 650, tags: ['vegano'] },
  { id: 'veg-02', categoryId: 'veganos-celiacos', name: 'Hamburguesa de lentejas', description: 'Lentejas, remolacha y cebolla morada con ensalada de hojas verdes, tomates cherry, papas rústicas y mayonesa de zanahoria.', price: 650, tags: ['vegano'] },
  { id: 'veg-03', categoryId: 'veganos-celiacos', name: 'Vermicelli al wok de vegetales', description: 'Cebolla, pimientos, zanahoria, verdeo, ajo, jengibre, salsa de soja y semillas tostadas.', price: 650, tags: ['vegano', 'celiaco'] },
  { id: 'veg-04', categoryId: 'veganos-celiacos', name: 'Budakis', description: 'Masa de papa, manzana, puerro, queso de cajú y salsa fresca de tomate.', price: 730, tags: ['vegano', 'celiaco'] },

  // Las Brasas
  { id: 'bra-01', categoryId: 'brasas', name: 'Chorizo', description: '', price: 260, tags: [] },
  { id: 'bra-02', categoryId: 'brasas', name: 'Morcilla', description: '', price: 260, tags: [] },
  { id: 'bra-03', categoryId: 'brasas', name: 'Chinchulín', description: '', price: 360, tags: [] },
  { id: 'bra-04', categoryId: 'brasas', name: 'Riñón', description: '', price: 320, tags: [] },
  { id: 'bra-05', categoryId: 'brasas', name: 'Molleja', description: '', price: 510, tags: [] },
  { id: 'bra-06', categoryId: 'brasas', name: 'Provolone', description: '', price: 480, tags: ['vegetariano'] },
  { id: 'bra-07', categoryId: 'brasas', name: 'Entraña', description: '', price: 850, tags: [], requiresGuarnicion: true },
  { id: 'bra-08', categoryId: 'brasas', name: 'Picaña de cordero', description: '', price: 820, tags: [], requiresGuarnicion: true },
  { id: 'bra-09', categoryId: 'brasas', name: 'Asado premium', description: '', price: 850, tags: [], requiresGuarnicion: true },
  { id: 'bra-10', categoryId: 'brasas', name: 'Bife de vacío', description: '', price: 780, tags: [], requiresGuarnicion: true },
  { id: 'bra-11', categoryId: 'brasas', name: 'Bife ancho', description: 'Baby beef.', price: 850, tags: [], requiresGuarnicion: true },
  { id: 'bra-12', categoryId: 'brasas', name: 'Matambrito de cerdo', description: '', price: 740, tags: [], requiresGuarnicion: true },
  { id: 'bra-13', categoryId: 'brasas', name: 'Pamplona de pollo', description: 'Jamón, muzzarella, olivas y pimientos.', price: 690, tags: [], requiresGuarnicion: true },
  { id: 'bra-14', categoryId: 'brasas', name: 'Pollo a las brasas', description: 'Muslo deshuesado o pechuga. Opcional salsa de mostaza y miel.', price: 620, tags: [], requiresGuarnicion: true },
  { id: 'bra-15', categoryId: 'brasas', name: 'Boniato al plomo glaseado', description: '', price: 330, tags: ['vegetariano'] },
  { id: 'bra-16', categoryId: 'brasas', name: 'Papa al plomo con roquefort', description: '', price: 360, tags: ['vegetariano'] },
  { id: 'bra-17', categoryId: 'brasas', name: 'Papa al plomo con manteca de hierbas y oliva', description: '', price: 320, tags: ['vegetariano'] },
  { id: 'bra-18', categoryId: 'brasas', name: 'Brasero para dos personas', description: 'Asado, bife ancho, pollo, chorizo, morcilla, chinchulín y riñón, con papas fritas o ensalada mixta.', price: 3100, tags: ['para_compartir'] },

  // Del Mar
  { id: 'mar-01', categoryId: 'mar', name: 'Paella de mariscos', description: 'Hecha en el momento, variedad de mariscos, arroz carnaroli y el clásico azafrán en hebras.', price: 850, tags: [] },
  { id: 'mar-02', categoryId: 'mar', name: 'Pesca con manteca de hierbas', description: '', price: 790, tags: [], requiresGuarnicion: true },
  { id: 'mar-03', categoryId: 'mar', name: 'Pesca cítrica', description: 'Grillada con un suave pesto cítrico.', price: 810, tags: [], requiresGuarnicion: true },
  { id: 'mar-04', categoryId: 'mar', name: 'Pesca Arrecife', description: 'Grillada con crema de camarones, roquefort y puerro.', price: 890, tags: [], requiresGuarnicion: true },
  { id: 'mar-05', categoryId: 'mar', name: 'Pesca toscana', description: 'Grillada con salsa fresca de tomate, olivas negras, albahaca, muzzarella de búfala, alcaparras y tomates secos.', price: 850, tags: [], requiresGuarnicion: true },

  // Nuestras Pastas
  { id: 'pas-01', categoryId: 'pastas', name: 'Raviolones capresse', description: 'Muzzarella, tomates secos y albahaca.', price: 740, tags: ['vegetariano'] },
  { id: 'pas-02', categoryId: 'pastas', name: 'Sorrentinos', description: 'Jamón y queso.', price: 740, tags: [] },
  { id: 'pas-03', categoryId: 'pastas', name: 'Sorrentinos con masa de espinaca', description: 'Calabaza, muzzarella y ricotta.', price: 740, tags: ['vegetariano'] },
  { id: 'pas-04', categoryId: 'pastas', name: 'Spaghetti al wok con frutos del mar', description: 'Camarones, calamares, mejillones, chips de panceta y pimientos.', price: 830, tags: [] },
  { id: 'pas-05', categoryId: 'pastas', name: 'Vermicelli thai de arroz', description: 'Con vegetales salteados y camarones rebozados en panko.', price: 810, tags: [] },

  // Pizzas
  { id: 'piz-01', categoryId: 'pizzas', name: 'Fainá clásico', description: '', price: 220, tags: ['vegetariano'] },
  { id: 'piz-02', categoryId: 'pizzas', name: 'Fainá con muzzarella', description: '', price: 290, tags: ['vegetariano'] },
  { id: 'piz-03', categoryId: 'pizzas', name: 'Muzzarella clásica', description: '', price: 700, tags: ['vegetariano'] },
  { id: 'piz-04', categoryId: 'pizzas', name: 'Ranchera', description: 'Muzzarella, cheddar, panceta y salsa barbacoa.', price: 840, tags: [] },
  { id: 'piz-05', categoryId: 'pizzas', name: 'Cuatro quesos', description: 'Muzzarella, dambo, provolone y roquefort.', price: 840, tags: ['vegetariano'] },
  { id: 'piz-06', categoryId: 'pizzas', name: 'Ruculata', description: 'Muzzarella, bondiola en tiritas, rúcula, tomates asados y lascas de parmesano.', price: 880, tags: [] },

  // Menu Infantil (todos $490)
  { id: 'inf-01', categoryId: 'infantil', name: 'Ravioles', description: 'De verdura, con salsa de crema de quesos.', price: 490, tags: ['infantil'] },
  { id: 'inf-02', categoryId: 'infantil', name: 'Hamburguesa al pan', description: 'Con queso fundido y papas fritas.', price: 490, tags: ['infantil'] },
  { id: 'inf-03', categoryId: 'infantil', name: 'Milanesa de carne', description: 'Con papas fritas.', price: 490, tags: ['infantil'] },
  { id: 'inf-04', categoryId: 'infantil', name: 'Nuggets de pollo', description: 'Con papas fritas.', price: 490, tags: ['infantil'] },

  // Postres
  { id: 'pos-01', categoryId: 'postres', name: 'Flan casero con dulce de leche', description: '', price: 350, tags: ['vegetariano'] },
  { id: 'pos-02', categoryId: 'postres', name: 'Brownie de chocolate', description: 'Con helado de crema y salsa de frutos rojos.', price: 380, tags: ['vegetariano'] },
  { id: 'pos-03', categoryId: 'postres', name: 'Panqueque de manzana', description: 'Con helado de crema.', price: 380, tags: ['vegetariano'] },
  { id: 'pos-04', categoryId: 'postres', name: 'Panqueque de dulce de leche', description: 'Con helado de crema.', price: 380, tags: ['vegetariano'] },
  { id: 'pos-05', categoryId: 'postres', name: 'Cheesecake', description: 'Con salsa de frutos rojos.', price: 420, tags: ['vegetariano'] },
  { id: 'pos-06', categoryId: 'postres', name: 'Torta Oreo', description: 'Galleta oreo, dulce de leche, chantilly y un toque de chocolate blanco.', price: 420, tags: ['vegetariano'] },
  { id: 'pos-07', categoryId: 'postres', name: 'Lemon pie', description: 'Masa crocante, crema de limón y merengue italiano.', price: 420, tags: ['vegetariano'] },
  { id: 'pos-08', categoryId: 'postres', name: 'Apasionada de maracuyá', description: 'Mousse de maracuyá con base crocante de chocolate.', price: 420, tags: ['vegetariano'] },

  // Bebidas
  { id: 'beb-01', categoryId: 'bebidas', name: 'Refresco 350 ml', description: 'Línea Coca Cola.', price: 160, tags: [] },
  { id: 'beb-02', categoryId: 'bebidas', name: 'Refresco 1 L', description: 'Línea Coca Cola.', price: 370, tags: [] },
  { id: 'beb-03', categoryId: 'bebidas', name: 'Agua mineral Salus', description: 'Con o sin gas.', price: 170, tags: [] },
  { id: 'beb-04', categoryId: 'bebidas', name: 'Agua saborizada Salus 600 ml', description: '', price: 180, tags: [] },
  { id: 'beb-05', categoryId: 'bebidas', name: 'Monster lata', description: '', price: 200, tags: [] },

  // Limonadas, Jugos y Licuados
  { id: 'lim-01', categoryId: 'limonadas', name: 'Limonada clásica 1 L', description: '', price: 420, tags: [] },
  { id: 'lim-02', categoryId: 'limonadas', name: 'Limonada de menta y jengibre 1 L', description: '', price: 420, tags: [] },
  { id: 'lim-03', categoryId: 'limonadas', name: 'Limonada de frutos rojos 1 L', description: '', price: 440, tags: [] },
  { id: 'lim-04', categoryId: 'limonadas', name: 'Limonada de maracuyá 1 L', description: '', price: 440, tags: [] },
  { id: 'lim-05', categoryId: 'limonadas', name: 'Exprimido de naranja', description: '', price: 320, tags: [] },
  { id: 'lim-06', categoryId: 'limonadas', name: 'Licuado de banana ½ L', description: '', price: 380, tags: [] },
  { id: 'lim-07', categoryId: 'limonadas', name: 'Licuado de durazno ½ L', description: '', price: 380, tags: [] },
  { id: 'lim-08', categoryId: 'limonadas', name: 'Licuado de frutilla ½ L', description: '', price: 380, tags: [] },
  { id: 'lim-09', categoryId: 'limonadas', name: 'Licuado mix ½ L', description: '', price: 380, tags: [] },

  // Cafeteria
  { id: 'caf-01', categoryId: 'cafeteria', name: 'Té', description: '', price: 140, tags: [] },
  { id: 'caf-02', categoryId: 'cafeteria', name: 'Espresso', description: '', price: 150, tags: [] },
  { id: 'caf-03', categoryId: 'cafeteria', name: 'Espresso doble', description: '', price: 180, tags: [] },
  { id: 'caf-04', categoryId: 'cafeteria', name: 'Americano', description: '', price: 180, tags: [] },
  { id: 'caf-05', categoryId: 'cafeteria', name: 'Cortado', description: '', price: 180, tags: [] },
  { id: 'caf-06', categoryId: 'cafeteria', name: 'Americano con crema', description: '', price: 200, tags: [] },
  { id: 'caf-07', categoryId: 'cafeteria', name: 'Capuchino', description: '', price: 200, tags: [] },
  { id: 'caf-08', categoryId: 'cafeteria', name: 'Capuchino con crema', description: '', price: 220, tags: [] },
  { id: 'caf-09', categoryId: 'cafeteria', name: 'Submarino', description: '', price: 220, tags: [] },
  { id: 'caf-10', categoryId: 'cafeteria', name: 'Carajillo 43', description: 'Licor 43 + café.', price: 320, tags: [] },

  // Cervezas
  { id: 'cer-01', categoryId: 'cervezas', name: 'Pilsen 1L', description: '', price: 360, tags: [] },
  { id: 'cer-02', categoryId: 'cervezas', name: 'Patricia 1L', description: '', price: 360, tags: [] },
  { id: 'cer-03', categoryId: 'cervezas', name: 'Zillertal 1L', description: '', price: 420, tags: [] },
  { id: 'cer-04', categoryId: 'cervezas', name: 'Stella Artois 1L', description: '', price: 420, tags: [] },
  { id: 'cer-05', categoryId: 'cervezas', name: 'Zillertal IPA/APA 1L', description: '', price: 450, tags: [] },
  { id: 'cer-06', categoryId: 'cervezas', name: 'Patagonia ¾', description: 'Amber Lager / Bohemian Pilsener / 24.7 / Weisse.', price: 440, tags: [] },
  { id: 'cer-07', categoryId: 'cervezas', name: 'Stella Artois 330ml', description: '', price: 250, tags: [] },
  { id: 'cer-08', categoryId: 'cervezas', name: 'Stella Artois sin alcohol 0.0% 330ml', description: '', price: 250, tags: [] },
  { id: 'cer-09', categoryId: 'cervezas', name: 'Corona 330ml', description: '', price: 250, tags: [] },
  { id: 'cer-10', categoryId: 'cervezas', name: 'Corona sin alcohol 0.0% 330ml', description: '', price: 250, tags: [] },

  // Whiskies
  { id: 'whi-01', categoryId: 'whiskies', subgroup: 'American Whiskey', name: "Jack Daniel's N7", description: '', price: 280, tags: [] },
  { id: 'whi-02', categoryId: 'whiskies', subgroup: 'American Whiskey', name: "Jack Daniel's Gentleman", description: '', price: 320, tags: [] },
  { id: 'whi-03', categoryId: 'whiskies', subgroup: 'American Whiskey', name: "Jack Daniel's Single Barrel", description: '', price: 390, tags: [] },
  { id: 'whi-04', categoryId: 'whiskies', subgroup: 'American Whiskey', name: "Jack Daniel's Honey", description: '', price: 280, tags: [] },
  { id: 'whi-05', categoryId: 'whiskies', subgroup: 'American Whiskey', name: "Jack Daniel's Fire", description: '', price: 280, tags: [] },
  { id: 'whi-06', categoryId: 'whiskies', subgroup: 'American Whiskey', name: "Jack Daniel's Apple", description: '', price: 280, tags: [] },
  { id: 'whi-07', categoryId: 'whiskies', subgroup: 'Whiskys', name: 'Johnnie Walker Gold Label', description: '', price: 390, tags: [] },
  { id: 'whi-08', categoryId: 'whiskies', subgroup: 'Whiskys', name: 'Johnnie Walker Black Label', description: '', price: 320, tags: [] },
  { id: 'whi-09', categoryId: 'whiskies', subgroup: 'Whiskys', name: 'Johnnie Walker Red Label', description: '', price: 280, tags: [] },
  { id: 'whi-10', categoryId: 'whiskies', subgroup: 'Whiskys', name: 'Sandy Mac', description: '', price: 280, tags: [] },

  // Vinos - Tintos
  { id: 'vin-01', categoryId: 'vinos', subgroup: 'Cabernet Sauvignon', name: 'La Linda', description: 'Bodega Luigi Bosca Wines · Luján de Cuyo, Mendoza, Argentina.', price: 850, tags: [] },
  { id: 'vin-02', categoryId: 'vinos', subgroup: 'Cabernet Sauvignon', name: 'Insignia', description: 'Bodega Luigi Bosca Wines · Luján de Cuyo, Mendoza, Argentina.', price: 1200, tags: [] },
  { id: 'vin-03', categoryId: 'vinos', subgroup: 'Cabernet Sauvignon', name: 'Don Pascual', description: 'Bodega Juanicó · Canelones, Uruguay.', price: 620, tags: [] },
  { id: 'vin-04', categoryId: 'vinos', subgroup: 'Cabernet Sauvignon', name: 'Reservado', description: 'Bodega Concha y Toro · Pirque, Chile.', price: 620, tags: [] },
  { id: 'vin-05', categoryId: 'vinos', subgroup: 'Cabernet Sauvignon', name: 'Latitud 33', description: 'Bodega Chandon · Mendoza, Argentina.', price: 850, tags: [] },
  { id: 'vin-06', categoryId: 'vinos', subgroup: 'Cabernet Sauvignon', name: 'Don Pascual Roble', description: 'Bodega Juanicó · Canelones, Uruguay.', price: 880, tags: [] },
  { id: 'vin-07', categoryId: 'vinos', subgroup: 'Cabernet Sauvignon', name: 'Trumpeter Clásico', description: 'Bodega Rutini Wines · Valle de Uco, Mendoza, Argentina.', price: 990, tags: [] },

  { id: 'vin-08', categoryId: 'vinos', subgroup: 'Merlot', name: 'Don Pascual', description: 'Bodega Juanicó · Canelones, Uruguay.', price: 620, tags: [] },
  { id: 'vin-09', categoryId: 'vinos', subgroup: 'Merlot', name: 'Reservado', description: 'Bodega Concha y Toro · Pirque, Chile.', price: 620, tags: [] },

  { id: 'vin-10', categoryId: 'vinos', subgroup: 'Tannat', name: 'Don Pascual', description: 'Bodega Juanicó · Canelones, Uruguay.', price: 620, tags: [] },
  { id: 'vin-11', categoryId: 'vinos', subgroup: 'Tannat', name: 'Don Pascual Roble', description: 'Bodega Juanicó · Canelones, Uruguay.', price: 880, tags: [] },

  { id: 'vin-12', categoryId: 'vinos', subgroup: 'Carmenere', name: 'Reservado', description: 'Bodega Santa Helena · Valle Central, Chile.', price: 620, tags: [] },
  { id: 'vin-13', categoryId: 'vinos', subgroup: 'Carmenere', name: 'Reservado', description: 'Bodega Concha y Toro · Pirque, Chile.', price: 620, tags: [] },
  { id: 'vin-14', categoryId: 'vinos', subgroup: 'Carmenere', name: 'Casillero del Diablo', description: 'Bodega Concha y Toro · Pirque, Chile.', price: 990, tags: [] },

  { id: 'vin-15', categoryId: 'vinos', subgroup: 'Malbec', name: 'Insignia', description: 'Bodega Luigi Bosca Wines · Luján de Cuyo, Mendoza, Argentina.', price: 1200, tags: [] },
  { id: 'vin-16', categoryId: 'vinos', subgroup: 'Malbec', name: 'De Sangre DOC', description: 'Bodega Luigi Bosca Wines · Luján de Cuyo, Mendoza, Argentina.', price: 1400, tags: [] },
  { id: 'vin-17', categoryId: 'vinos', subgroup: 'Malbec', name: 'Don Valentín Lacrado', description: 'Bodega Bianchi · Valle de Uco, Mendoza, Argentina.', price: 620, tags: [] },
  { id: 'vin-18', categoryId: 'vinos', subgroup: 'Malbec', name: 'Reservado', description: 'Bodega Concha y Toro · Pirque, Chile.', price: 620, tags: [] },
  { id: 'vin-19', categoryId: 'vinos', subgroup: 'Malbec', name: 'La Linda', description: 'Bodega Luigi Bosca Wines · Luján de Cuyo, Mendoza, Argentina.', price: 850, tags: [] },
  { id: 'vin-20', categoryId: 'vinos', subgroup: 'Malbec', name: 'Postales', description: 'Bodega Fin del Mundo · Patagonia, Argentina.', price: 620, tags: [] },
  { id: 'vin-21', categoryId: 'vinos', subgroup: 'Malbec', name: 'Latitud 33', description: 'Bodega Chandon · Mendoza, Argentina.', price: 850, tags: [] },
  { id: 'vin-22', categoryId: 'vinos', subgroup: 'Malbec', name: 'Fin del Mundo Reserva', description: 'Bodega Fin del Mundo · Patagonia, Argentina.', price: 990, tags: [] },
  { id: 'vin-23', categoryId: 'vinos', subgroup: 'Malbec', name: 'Trumpeter Clásico', description: 'Bodega Rutini Wines · Valle de Uco, Mendoza, Argentina.', price: 990, tags: [] },

  { id: 'vin-24', categoryId: 'vinos', subgroup: 'Cabernet Franc', name: 'Don Pascual Reserve', description: 'Bodega Juanicó · Canelones, Uruguay.', price: 720, tags: [] },

  { id: 'vin-25', categoryId: 'vinos', subgroup: 'Pinot Noir', name: 'Insignia', description: 'Bodega Luigi Bosca Wines · Luján de Cuyo, Mendoza, Argentina.', price: 1400, tags: [] },
  { id: 'vin-26', categoryId: 'vinos', subgroup: 'Pinot Noir', name: 'Don Pascual Reserve', description: 'Bodega Juanicó · Canelones, Uruguay.', price: 720, tags: [] },
  { id: 'vin-27', categoryId: 'vinos', subgroup: 'Pinot Noir', name: 'Atlántico Cerro del Toro', description: 'Bodega Cerro del Toro · Maldonado, Uruguay.', price: 850, tags: [] },

  { id: 'vin-28', categoryId: 'vinos', subgroup: 'Blends tintos', name: 'Carmenere - Merlot', description: 'Bodega Oveja Negra · Valle del Maule, Chile.', price: 850, tags: [] },
  { id: 'vin-29', categoryId: 'vinos', subgroup: 'Blends tintos', name: 'Cabernet Franc - Malbec', description: 'Bodega Rutini Wines · Valle de Uco, Mendoza, Argentina.', price: 1900, tags: [] },
  { id: 'vin-30', categoryId: 'vinos', subgroup: 'Blends tintos', name: 'Cabernet Sauvignon - Merlot', description: 'Bodega Rutini Wines · Valle de Uco, Mendoza, Argentina.', price: 1900, tags: [] },

  // Vinos - Blancos
  { id: 'vin-31', categoryId: 'vinos', subgroup: 'Chardonnay', name: 'Don Pascual', description: 'Bodega Juanicó · Canelones, Uruguay.', price: 620, tags: [] },
  { id: 'vin-32', categoryId: 'vinos', subgroup: 'Chardonnay', name: 'Viognier Roble', description: 'Bodega Juanicó · Canelones, Uruguay.', price: 880, tags: [] },
  { id: 'vin-33', categoryId: 'vinos', subgroup: 'Chardonnay', name: 'Fin del Mundo Reserva', description: 'Bodega Fin del Mundo · Patagonia, Argentina.', price: 990, tags: [] },

  { id: 'vin-34', categoryId: 'vinos', subgroup: 'Sauvignon Blanc', name: 'Reservado', description: 'Bodega Santa Helena · Valle Central, Chile.', price: 620, tags: [] },
  { id: 'vin-35', categoryId: 'vinos', subgroup: 'Sauvignon Blanc', name: 'Brut Blanc de Blancs', description: 'Bodega Juanicó · Canelones, Uruguay.', price: 620, tags: [] },
  { id: 'vin-36', categoryId: 'vinos', subgroup: 'Sauvignon Blanc', name: 'Reservado', description: 'Bodega Concha y Toro · Pirque, Chile.', price: 620, tags: [] },
  { id: 'vin-37', categoryId: 'vinos', subgroup: 'Sauvignon Blanc', name: 'Postales', description: 'Sauvignon Blanc-Semillon · Bodega Fin del Mundo, Patagonia, Argentina.', price: 620, tags: [] },
  { id: 'vin-38', categoryId: 'vinos', subgroup: 'Sauvignon Blanc', name: 'Sauvignon Blanc-Carmenere', description: 'Bodega Oveja Negra · Valle del Maule, Chile.', price: 850, tags: [] },
  { id: 'vin-39', categoryId: 'vinos', subgroup: 'Sauvignon Blanc', name: 'Torrontés La Linda', description: 'Bodega Luigi Bosca Wines · Luján de Cuyo, Mendoza, Argentina.', price: 850, tags: [] },

  { id: 'vin-40', categoryId: 'vinos', subgroup: 'Riesling', name: 'Insignia', description: 'Bodega Luigi Bosca Wines · Luján de Cuyo, Mendoza, Argentina.', price: 1200, tags: [] },

  { id: 'vin-41', categoryId: 'vinos', subgroup: 'Albariño', name: 'Costal White Don Pascual', description: 'Bodega Juanicó · Canelones, Uruguay.', price: 650, tags: [] },
  { id: 'vin-42', categoryId: 'vinos', subgroup: 'Albariño', name: 'Cerro del Toro', description: 'Bodega Cerro del Toro · Piriápolis, Maldonado, Uruguay.', price: 850, tags: [] },
  { id: 'vin-43', categoryId: 'vinos', subgroup: 'Albariño', name: 'Atlántico Sur', description: 'Familia Deicas · Canelones, Uruguay.', price: 950, tags: [] },

  { id: 'vin-44', categoryId: 'vinos', subgroup: 'Blanco Frizante', name: 'New Age', description: 'Bodega Bianchi · Mendoza, Argentina.', price: 650, tags: [] },

  // Vinos - Rosados y Espumosos
  { id: 'vin-45', categoryId: 'vinos', subgroup: 'Rosados', name: 'La Linda Rosé', description: 'Bodega Luigi Bosca Wines · Luján de Cuyo, Mendoza, Argentina.', price: 850, tags: [] },
  { id: 'vin-46', categoryId: 'vinos', subgroup: 'Rosados', name: 'Brut Blanc de Noir', description: 'Bodega Juanicó · Canelones, Uruguay.', price: 620, tags: [] },
  { id: 'vin-47', categoryId: 'vinos', subgroup: 'Rosados', name: 'Costal Rosé', description: 'Bodega Juanicó · Canelones, Uruguay.', price: 650, tags: [] },

  { id: 'vin-48', categoryId: 'vinos', subgroup: 'Espumosos', name: 'La Linda Extra Brut', description: 'Bodega Luigi Bosca Wines · Luján de Cuyo, Mendoza, Argentina.', price: 1100, tags: [] },
  { id: 'vin-49', categoryId: 'vinos', subgroup: 'Espumosos', name: 'Chandon 187 Brut', description: 'Bodega Chandon · Mendoza, Argentina.', price: 450, tags: [] },
  { id: 'vin-50', categoryId: 'vinos', subgroup: 'Espumosos', name: 'Chandon 187 Apertif', description: 'Bodega Chandon · Mendoza, Argentina.', price: 450, tags: [] },
  { id: 'vin-51', categoryId: 'vinos', subgroup: 'Espumosos', name: 'Novecento Extra Brut', description: 'Bodega Dante Robino · Mendoza, Argentina.', price: 950, tags: [] },
  { id: 'vin-52', categoryId: 'vinos', subgroup: 'Espumosos', name: 'Chandon Extra Brut 750', description: 'Bodega Chandon · Mendoza, Argentina.', price: 1600, tags: [] },
  { id: 'vin-53', categoryId: 'vinos', subgroup: 'Espumosos', name: 'Chandon Apertif 750', description: 'Bodega Chandon · Mendoza, Argentina.', price: 1600, tags: [] },

  { id: 'vin-54', categoryId: 'vinos', subgroup: 'Copa', name: 'Copa de vino', description: 'Consultar variedad disponible.', price: 250, tags: [] },

  // Tragos
  { id: 'tra-01', categoryId: 'tragos', subgroup: "Jack Daniel's Drinks", name: 'Jack Fire & Pomelo', description: '', price: 340, tags: [] },
  { id: 'tra-02', categoryId: 'tragos', subgroup: "Jack Daniel's Drinks", name: 'Jack Honey Lemonade', description: '', price: 340, tags: [] },
  { id: 'tra-03', categoryId: 'tragos', subgroup: "Jack Daniel's Drinks", name: 'Jack Apple Lemonade', description: '', price: 340, tags: [] },
  { id: 'tra-04', categoryId: 'tragos', subgroup: "Jack Daniel's Drinks", name: 'Jack Apple Tonic', description: '', price: 340, tags: [] },
  { id: 'tra-05', categoryId: 'tragos', subgroup: "Jack Daniel's Drinks", name: 'Jack & Coke', description: '', price: 340, tags: [] },

  { id: 'tra-06', categoryId: 'tragos', subgroup: 'Tragos', name: 'Carajillo 43', description: 'Licor 43 + café.', price: 320, tags: [] },
  { id: 'tra-07', categoryId: 'tragos', subgroup: 'Tragos', name: 'Licor 43 Spritz', description: '', price: 400, tags: [] },
  { id: 'tra-08', categoryId: 'tragos', subgroup: 'Tragos', name: 'Villa Massa Spritz', description: '', price: 400, tags: [] },
  { id: 'tra-09', categoryId: 'tragos', subgroup: 'Tragos', name: 'José Cuervo Paloma', description: 'Tequila José Cuervo, pomelo.', price: 340, tags: [] },
  { id: 'tra-10', categoryId: 'tragos', subgroup: 'Tragos', name: 'Caipiroska de maracuyá', description: 'Vodka Smirnoff, lima, maracuyá y azúcar.', price: 420, tags: [] },
  { id: 'tra-11', categoryId: 'tragos', subgroup: 'Tragos', name: 'Daiquiri de frutilla', description: 'Preparación frozen con Captain Morgan.', price: 420, tags: [] },
  { id: 'tra-12', categoryId: 'tragos', subgroup: 'Tragos', name: 'Mojito', description: 'Ron Captain Morgan, menta fresca, lima y soda.', price: 400, tags: [] },
  { id: 'tra-13', categoryId: 'tragos', subgroup: 'Tragos', name: 'Whisky Smash', description: 'Whisky Johnnie Red Label, menta fresca, lima y soda.', price: 400, tags: [] },
  { id: 'tra-14', categoryId: 'tragos', subgroup: 'Tragos', name: 'Caipirinha', description: 'Cachaça Velho Barreiro, lima y azúcar.', price: 400, tags: [] },
  { id: 'tra-15', categoryId: 'tragos', subgroup: 'Tragos', name: 'Caipiroska', description: 'Vodka Smirnoff, lima y azúcar.', price: 400, tags: [] },
  { id: 'tra-16', categoryId: 'tragos', subgroup: 'Tragos', name: 'Vodka Smirnoff con naranja', description: '', price: 400, tags: [] },
  { id: 'tra-17', categoryId: 'tragos', subgroup: 'Tragos', name: 'Tanqueray Tonic', description: '', price: 400, tags: [] },
  { id: 'tra-18', categoryId: 'tragos', subgroup: 'Tragos', name: 'Campari con naranja', description: '', price: 400, tags: [] },
  { id: 'tra-19', categoryId: 'tragos', subgroup: 'Tragos', name: 'Aperol Spritz', description: '', price: 420, tags: [] },
  { id: 'tra-20', categoryId: 'tragos', subgroup: 'Tragos', name: 'Jägermeister', description: '', price: 300, tags: [] },
  { id: 'tra-21', categoryId: 'tragos', subgroup: 'Tragos', name: 'Negroni', description: '', price: 400, tags: [] },
  { id: 'tra-22', categoryId: 'tragos', subgroup: 'Tragos', name: 'Los clásicos', description: 'Cuba libre, tequila, Fernet cola o Whiscola.', price: 340, tags: [] },
  { id: 'tra-23', categoryId: 'tragos', subgroup: 'Tragos', name: 'Clericó 1L', description: '', price: 750, tags: ['para_compartir'] },
  { id: 'tra-24', categoryId: 'tragos', subgroup: 'Tragos', name: 'Sangría 1L', description: '', price: 750, tags: ['para_compartir'] },
  { id: 'tra-25', categoryId: 'tragos', subgroup: 'Tragos', name: 'Vermut Flores Rosado', description: '', price: 320, tags: [] },
  { id: 'tra-26', categoryId: 'tragos', subgroup: 'Tragos', name: 'Vermut Flores Rojo', description: '', price: 320, tags: [] },
  { id: 'tra-27', categoryId: 'tragos', subgroup: 'Tragos', name: 'Grappamiel Vesubio', description: '', price: 320, tags: [] },
]
