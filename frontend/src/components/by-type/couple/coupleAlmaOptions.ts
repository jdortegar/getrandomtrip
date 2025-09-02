// frontend/src/components/by-type/couple/coupleAlmaOptions.ts

export type CoupleAlmaOption = {
  key: string;
  label: string;
  img?: string;
  desc?: string;
};

export type CoupleAlmaSpec = {
  title: string;
  core: string;
  options: CoupleAlmaOption[];
  ctaLabel: string;
  tint?: string;
  heroImg?: string;
};

export const COUPLE_ALMA_OPTIONS: Record<string, CoupleAlmaSpec> = {
  'romantic-getaway': {
    title: 'Escapada Romántica 💞',
    core: 'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
    ctaLabel: 'Enciendan la chispa →',
    tint: 'bg-rose-900/30',
    heroImg:
      'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
    options: [
      { key: 'culture-traditions', label: 'Cultura Local & Paseos Tranquilos 🎭', desc: 'Caminar de la mano por lugares que cuentan historias que aún no conocen.', img: 'https://images.unsplash.com/photo-1543746379-691bd95dc0b8' },
      { key: 'spa-day', label: 'Wellness & Spa 🧘‍♀️', desc: 'Detox. Retox. Repeat.', img: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c' },
      { key: 'wine-tasting', label: 'Experiencias Gastronómicas & Vinos 🍷', desc: 'El amor también se prueba en la mesa: sabores, copas y risas en plural.', img: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f' },
      { key: 'sunset-cruise', label: 'Atardeceres & Momentos Íntimos 🌅', desc: 'Lo simple que se vuelve eterno: mirarse en silencio frente a un horizonte compartido.', img: 'https://images.unsplash.com/photo-1510926928520-87c5867a1157' },
    ],
  },

  'adventure-duo': {
    title: 'Dúo de Aventura 🏔️',
    core: 'Porque nada une más que perderse juntos en la naturaleza y conquistar lo inesperado.',
    ctaLabel: 'Aventúrense juntos →',
    tint: 'bg-cyan-900/30',
    heroImg:
      'https://images.unsplash.com/photo-1573072738379-7c640e17ac4e',
    options: [
      { key: 'hiking-trail', label: 'Trekking & Naturaleza ⛰️', desc: 'Subir juntos, descubrir juntos, conquistar juntos', img: 'https://images.unsplash.com/photo-1632661207760-6217c175e5aa' },
      { key: 'kayaking', label: 'Aventura Acuática 🚣', desc: 'Ríos, lagos o mares: dejarse llevar por la corriente y la adrenalina compartida.', img: 'https://images.unsplash.com/photo-1668415868524-addca491c8c7' },
      { key: 'zip-lining', label: 'Exploración de Fauna 🐾', desc: 'La emoción de observar la vida salvaje como testigos privilegiados.', img: 'https://images.unsplash.com/photo-1668241282963-4ab8d2217527' },
      { key: 'desert', label: 'Desierto & Dunas 🏜️', desc: 'La vastedad dorada donde cada paso es un acto de complicidad.', img: 'https://images.unsplash.com/photo-1578186458347-f9b69c38c9e5' },
    ],
  },

  'foodie-lovers': {
    title: 'Foodie Lovers 🍷🍝',
    core: 'Para quienes creen que el amor también entra por el paladar.',
    ctaLabel: 'Saboreen la aventura →',
    tint: 'bg-orange-900/30',
    heroImg:
      'https://images.unsplash.com/photo-1704564552246-f4ee4bd7e050',
    options: [
      { key: 'cooking-class', label: 'Talleres & Experiencias de Cocina 🍳', desc: 'Cocinar juntos: un caos divertido que se transforma en complicidad.', img: 'https://images.unsplash.com/photo-1735814404903-b7df5ca550fb' },
      { key: 'food-tour', label: 'Street Food & Mercados 🍜', desc: 'Descubrir el alma de un lugar en un bocado callejero.', img: 'https://images.unsplash.com/photo-1465512861810-7dd31b34ed98' },
      { key: 'gourmet-dinner', label: 'Fine Dining & Experiencias Gourmet 🍽️', desc: 'Una mesa donde cada plato se vuelve parte de la celebración.', img: 'https://images.unsplash.com/photo-1671691302268-e316f81c7b3e' },
      { key: 'wine-pairing', label: 'Rutas de Vino & Bodegas 🍇', desc: 'Brindar en paisajes que saben a historia y terroir.', img: 'https://images.unsplash.com/photo-1627462096404-3d7bd4596379' },
    ],
  },

  'culture-tradition': {
    title: 'Cultura & Tradición 🎭🏘️',
    core: 'El encanto de descubrir juntos pueblos, historias y costumbres locales.',
    ctaLabel: 'Exploren nuevas culturas →',
    tint: 'bg-purple-900/30',
    heroImg:
      'https://images.unsplash.com/photo-1561961876-525c41ffbcea',
    options: [
      { key: 'museum-pass', label: 'Museos & Patrimonio 🖼️', desc: 'El arte y la historia como excusa para caminar más lento.', img: 'https://images.unsplash.com/photo-1732444827571-3b16b9a837e4' },
      { key: 'historical-tour', label: 'Pueblos & Caminatas 🏘️', desc: 'Calles pequeñas, historias grandes: el encanto de lo cotidiano.', img: 'https://images.unsplash.com/photo-1716651333244-5da7d9f7e5b6' },
      { key: 'local-crafts', label: 'Artesanía & Diseño Local✨', desc: 'Objetos que cuentan historias hechas a mano, para llevarlas con ustedes.', img: 'https://images.unsplash.com/photo-1602591620189-de34d60650b2'},
      { key: 'traditional-show', label: 'Festivales Locales 🎉', desc: 'La magia de compartir costumbres que se viven con alegría colectiva.', img: 'https://images.unsplash.com/photo-1560458386-df616c1a8b54' },
    ],
  },

  'wellness-retreat': {
    title: 'Wellness Retreat 🧘‍♀️✨',
    core: 'Un respiro compartido: spa, silencio y bienestar en pareja.',
    ctaLabel: 'Relájense y disfruten →',
    tint: 'bg-emerald-900/30',
    heroImg:
      'https://images.unsplash.com/photo-1644612105654-b6b0a941ecde',
    options: [
      { key: 'couples-massage', label: 'Spa & Termas 💦', desc: 'Agua, calma y el lujo de no tener que hacer nada más.', img: 'https://images.unsplash.com/photo-1542566577-275416ec339c' },
      { key: 'yoga-retreat', label: 'Yoga & Mindfulness 🧘', desc: 'Respirar al unísono y reconectar con la esencia compartida.', img: 'https://images.unsplash.com/photo-1539804599440-9f083410fe4d' },
      { key: 'hot-springs', label: 'Naturaleza Silenciosa 🌿', desc: 'El poder de escuchar el bosque en silencio, juntos.', img: 'https://images.unsplash.com/photo-1551847618-a4b47ff8cec8' },
      { key: 'meditation-session', label: 'Detox. Retox. Repeat 🥗', desc: 'Cuidarse como ritual compartido: lo que entra nutre cuerpo y vínculo.', img: 'https://images.unsplash.com/photo-1649789248266-ef1c7f744f6f' },
    ],
  },

  celebrations: {
    title: 'Celebraciones 🎂🥂',
    core: 'Un aniversario, un logro, o simplemente la excusa perfecta para brindar juntos.',
    ctaLabel: 'Celebren juntos →',
    tint: 'bg-yellow-900/30',
    heroImg:
      'https://images.unsplash.com/photo-1563525917325-d52bc969ea70',
    options: [
      { key: 'anniversary-dinner', label: 'Escapada de Aniversario 💍', desc: 'Un viaje que celebra el tiempo compartido, con nuevos recuerdos por sumar.', img: 'https://images.unsplash.com/photo-1705153302121-244e38d54e4e' },
      { key: 'private-event', label: 'Milestones & Logros 🏆', desc: 'Porque los grandes pasos de la vida merecen más que un brindis: merecen un viaje.', img: 'https://images.unsplash.com/photo-1631636864493-d4026e552236' },
      { key: 'special-toast', label: 'Luces de Ciudad 🏙️🍸', desc: 'Rooftops, neones y la vibra de una noche que se recuerda por siempre.', img: 'https://images.unsplash.com/photo-1644325782011-241bc945dc06' },
      { key: 'surprise-party', label: 'Veladas con Música 🎶✨', desc: 'Un soundtrack en vivo para ponerle ritmo al festejo y a la complicidad.', img: 'https://images.unsplash.com/flagged/photo-1590425113058-3a2678b4cdad' },
    ],
  },

  'beach-dunes': {
    title: 'Playa & Dunas 🌊🏖️',
    core: 'Sol, arena y la excusa eterna para caminar de la mano al atardecer.',
    ctaLabel: 'Disfruten la playa →',
    tint: 'bg-blue-900/30',
    heroImg:
      'https://plus.unsplash.com/premium_photo-1661859790348-0b1ef5132c1c',
    options: [
      { key: 'beach-walks', label: 'Relax & Arena 🏖️', desc: 'El mar como telón de fondo y el tiempo suspendido entre olas.', img: 'https://images.unsplash.com/photo-1591904257529-e518ffa4f805' },
      { key: 'sunset-views', label: 'Deportes Acuáticos 🌊', desc: 'Compartir la emoción del movimiento y el agua salada en la piel.', img: 'https://images.unsplash.com/photo-1568569648950-6a823eac4c39' },
      { key: 'dune-exploration', label: 'Paseos Escénicos 🌅', desc: 'Caminar al borde del mar, donde cada paso se acompaña con brisa y luz.', img: 'https://images.unsplash.com/photo-1696602294499-1b03e00c0c65' },
      { key: 'beach-picnic', label: 'Vida Nocturna & Música 🎶', desc: 'El sonido del mar mezclado con música y luces: fiesta sin relojes.', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819' },
    ],
  },

  'urban-getaway': {
    title: 'Escapada Urbana 🏙️🍸',
    core: 'Porque la ciudad también puede ser el mejor escenario para perderse en pareja.',
    ctaLabel: 'Exploren la ciudad →',
    tint: 'bg-gray-900/30',
    heroImg:
      'https://images.unsplash.com/photo-1706665631754-949f40820012',
    options: [
      { key: 'city-walks', label: 'Arte & Arquitectura 🏛️', desc: 'Descubrir cómo la ciudad respira a través de sus formas y colores.', img: 'https://images.unsplash.com/photo-1451976426598-a7593bd6d0b2' },
      { key: 'rooftop-bars', label: 'Gastronomía & Coctelería 🍸', desc: 'Bares escondidos y mesas vibrantes: el pulso de la ciudad en cada copa.', img: 'https://images.unsplash.com/photo-1744413923036-bf36a7f3a2d2' },
      { key: 'cultural-shows', label: 'Cultura & shows 🎤', desc: 'Salir a perderse en la ciudad que nunca duerme.', img: 'https://images.unsplash.com/photo-1496337589254-7e19d01cec44' },
      { key: 'shopping', label: 'Compras & Diseño 🛍️', desc: 'Buscar tesoros modernos en cada esquina creativa.', img: 'https://images.unsplash.com/photo-1575291930020-5dbada5097c7' },
    ],
  },
};
