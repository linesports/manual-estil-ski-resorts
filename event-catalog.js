(function (root) {
  'use strict';

  // Station-scoped names found in the preserved captions, Story titles or Highlights.
  // A sponsor alone never identifies an event. Unmatched pieces remain ungrouped.
  const definitions = [
    ['baqueira_beret', 'fwt', 'Baqueira Beret Pro · Freeride World Tour', 'Esdeveniment', /baqueira.?beret.?pro|freeride.?world.?tour|\bfwt\b|#fwt/i],
    ['baqueira_beret', 'europa-cup', 'Copa d’Europa d’esquí alpí', 'Esdeveniment', /europa.?cup|copa de europa|copa d.europa/i],
    ['baqueira_beret', 'iberdrola', 'Copa d’Espanya Iberdrola · Freeride', 'Esdeveniment', /iberdrola.*freeride|copa espana.*iberdrola/i],
    ['baqueira_beret', 'naut-aran', 'Trofeu Naut Aran by VORARIU', 'Esdeveniment', /naut aran|master world cup/i],
    ['baqueira_beret', 'winter-driving', 'Audi winter driving experience', 'Activació', /winter driving|experiencia de conduccion/i],
    ['baqueira_beret', 'snow-beer', 'The Snow Beer Days × San Miguel', 'Activació', /snow beer days/i],
    ['sierranevadaestacion', 'heliocare', 'Heliocare × Sierra Nevada', 'Campanya', /heliocare|cantabrialabs|cantabria labs|fotoproteccio/i],
    ['sierranevadaestacion', 'quattro-cup', 'Audi quattro Cup · Carolina Ruiz Challenge', 'Esdeveniment', /quattro cup|carolina ruiz/i],
    ['sierranevadaestacion', 'winter-driving', 'Audi winter driving experience', 'Activació', /winter driving|experiencia de conduccion/i],
    ['sierranevadaestacion', 'movistar-cross', 'Copa d’Espanya Movistar · SBX / Ski Cross', 'Esdeveniment', /copa espana movistar|ski cross|\bsbx\b/i],
    ['sierranevadaestacion', 'ultra', 'Unicaja Ultra Sierra Nevada', 'Esdeveniment', /ultrasierranevada|ultra sierra nevada/i],
    ['sierranevadaestacion', 'por-todo-lo-alto', 'Sierra Nevada Por Todo Lo Alto', 'Esdeveniment', /por todo lo alto/i],
    ['masellapirineu', 'test-drive', 'Test drive · Mercedes-Benz / Movento Stern', 'Activació', /test drive|test-drive/i],
    ['masellapirineu', 'flaixbac-febrer', 'Cap de setmana Flaixbac · 7 de febrer', 'Activació', /7 de febrer|7 de febrero/i],
    ['masellapirineu', 'flaixbac-marc', 'Cap de setmana Flaixbac · 21 de març', 'Activació', /21\/3|21 de marc/i],
    ['cerleraramon', 'cronoslalom', 'Cronoslalom Volvo', 'Activació', /cronoslalom/i],
    ['cerleraramon', 'remascaro', 'Remáscaro × San Miguel', 'Activació', /remascaro/i],
    ['cerleraramon', 'recollida', 'Muntanya neta × Reale', 'Activació', /residuos|recollida de residus/i],
    ['formigalpanticosaaramon', 'terrain-park', 'Terrain Park Fest', 'Esdeveniment', /terrain park fest/i],
    ['formigalpanticosaaramon', 'cronoslalom', 'Cronoslalom Volvo', 'Activació', /cronoslalom/i],
    ['formigalpanticosaaramon', 'felicitat', 'Dia de la Felicitat × Lacasitos', 'Activació', /dia de la felicidad|dia de la felicitat/i],
    ['formigalpanticosaaramon', 'nevalia', 'Nevalia × Ron Barceló', 'Esdeveniment', /nevalia/i],
    ['formigalpanticosaaramon', 'ski-pirineos', 'Ski Pirineos · test de material', 'Activació', /ski pirineos|skipirineos/i],
    ['grandvalira', 'audi-world-cup', 'Audi FIS Ski World Cup Andorra', 'Esdeveniment', /audi.?fis.?ski.?world.?cup/i],
    ['grandvalira', 'snow-club', 'Snow Club Gourmet', 'Cicle', /snow club gourmet/i],
    ['grandvalira', 'oakley-days', 'Oakley Community Days', 'Activació', /oakley community days/i],
    ['grandvalira', 'oysho-club', 'Oysho Ski Club', 'Activació', /oysho ski club/i],
    ['grandvalira', 'snow-beer', 'The Snow Beer Days × San Miguel', 'Activació', /snow beer days/i],
    ['grandvalira', 'redbull-night', 'Red Bull Night Rider', 'Esdeveniment', /red bull night rider/i],
    ['grandvalira', 'range-rover', 'Andorra Snow Challenge · Range Rover', 'Activació', /andorra snow challenge/i],
    ['grandvalira', 'high-camp', 'High Camp by Haglöfs', 'Activació', /high camp/i],
    ['grandvalira', 'jazz-leon', 'Jazz Leon', 'Esdeveniment', /jazz leon/i],
    ['grandvalira', 'jean-leon', 'Wine & Meat Bar by Jean Leon', 'Espai de marca', /wine.*meat bar/i],
    ['grandvalira', 'veuve-terrace', 'Terrassa Veuve Clicquot', 'Espai de marca', /veuve clicquot/i],
    ['grandvalira', 'iqos-terrace', 'IQOS Terrace', 'Espai de marca', /iqos terrace/i],
    ['grandvalira', 'lasportiva', 'Test de producte · La Sportiva', 'Activació', /test de producte|test de producto/i],
    ['palarinsalandorra', 'comapedrosa', 'Copa del Món Comapedrosa · Skimo', 'Esdeveniment', /comapedrosa|vertical race|sprint race|esqui de muntanya/i],
    ['palarinsalandorra', 'warriors', 'Warriors 2.0 · Copa Catalana DHI', 'Esdeveniment', /warriors 2|copa catalana/i],
    ['palarinsalandorra', 'world-cup-mtb', 'WHOOP UCI Mountain Bike World Series', 'Esdeveniment', /world.?cup|copa del m[oú]n|world.?series|mtb wc 26|copa del mundo/i],
    ['palarinsalandorra', 'scrub-it', 'Scrub It by COMMENCAL', 'Activació', /scrub it/i],
    ['palarinsalandorra', 'commencal-wallride', 'COMMENCAL Wallride', 'Espai de marca', /commencal wallride/i],
    ['ordinoarcalis', 'world-championships', 'Allianz FIS Freeride World Championships by Mammut', 'Esdeveniment', /andorra2026|andorra 2026|world.?championship|fisfwch|mundial|allianz.*mammut/i],
    ['ordinoarcalis', 'oysho-club', 'Oysho Ski Club', 'Activació', /oysho ski club/i],
    ['val_thorens', 'fwt', 'Val Thorens Pro · Freeride World Tour', 'Esdeveniment', /val.?thorens.?pro|freerideworldtour|freeride world tour/i],
    ['val_thorens', 'cosmic', 'Cosmic Mountain Festival', 'Esdeveniment', /cosmic mountain/i],
    ['val_thorens', 'summit-games', 'Val Thorens Summit Games', 'Esdeveniment', /summit games/i],
    ['tignesofficiel', 'enduro', 'Enduro de Tignes by SB3 Components', 'Esdeveniment', /enduro de tignes|endurodesalpes/i],
    ['tignesofficiel', 'snowpark-tour', 'Downdays Snowpark Tour', 'Esdeveniment', /downdays|snowpark tour/i],
    ['tignesofficiel', 'freeride-series', 'Freeride Series Tignes', 'Esdeveniment', /freeride series|freeride world tour qualifier/i],
    ['tignesofficiel', 'xplore', 'Xplore Film Tour', 'Esdeveniment', /xplore film tour/i],
    ['tignesofficiel', 'scrub-it', 'Scrub It × COMMENCAL', 'Activació', /scrub it/i],
    ['laax', 'laax-open', 'LAAX OPEN presented by Zalando', 'Esdeveniment', /laax.?open|rail riot|style for tricks|burton riglet|swatch x laaxpay/i],
    ['laax', 'snow-league', 'The Snow League · LAAX', 'Esdeveniment', /snow.?league/i],
    ['aspensnowmass', 'snow-league', 'The Snow League · Aspen', 'Esdeveniment', /snow.?league/i],
    ['aspensnowmass', 'power-four', 'Audi Power of Four', 'Esdeveniment', /power of four/i],
    ['aspensnowmass', 'ajax-cup', 'Audi Ajax Cup', 'Esdeveniment', /ajax cup/i],
    ['aspensnowmass', 'grand-prix', 'Toyota U.S. Grand Prix', 'Esdeveniment', /grand prix|team send.?off|team naming|road to italy/i],
    ['aspensnowmass', 'xgames', 'X Games Aspen · Driven by Jeep', 'Esdeveniment', /x.?games/i],
    ['aspensnowmass', 'apres-series', 'Après Series presented by Aspen Vodka', 'Cicle', /apres series/i],
    ['aspensnowmass', 'spring-jam', 'Spring Jam × Surfside', 'Esdeveniment', /spring jam/i],
    ['aspensnowmass', 'elk-camp', 'Obertura del telecadira Elk Camp', 'Activació', /elk camp.*six.pack|new elk camp/i],
    ['whistlerblackcomb', 'world-cup-mtb', 'WHOOP UCI Mountain Bike World Series', 'Esdeveniment', /whoop|uci.?mtb|world cup/i],
    ['whistlerblackcomb', 'crankworx', 'Crankworx Whistler', 'Esdeveniment', /crankworx/i],
    ['whistlerblackcomb', 'telus-winter', 'TELUS Winter Classic', 'Esdeveniment', /winter classic/i],
    ['whistlerblackcomb', 'telus-film', 'HOME · pel·lícula presentada per TELUS', 'Campanya', /\bhome\b.*telus|telus.*\bhome\b/i],
    ['whistlerblackcomb', 'mountain-movement', 'Mountain Top Movement × Celsius', 'Activació', /mountain top movement/i],
    ['whistlerblackcomb', 'mountain-feast', 'Mountain Top Feast', 'Cicle', /mountain top (?:summer )?feast/i],
    ['whistlerblackcomb', 'sleepover', 'Summit Sleepover × Helly Hansen', 'Activació', /sleepover/i],
    ['whistlerblackcomb', 'hiking', 'Hiking Challenge · Little Adventurers Hunt', 'Activació', /hiking challenge|little adventurers|scavenger hunt/i],
    ['whistlerblackcomb', 'oakley-days', 'Oakley Community Days', 'Activació', /oakley community days/i],
    ['whistlerblackcomb', 'whistler-cup', 'Whistler Cup', 'Esdeveniment', /whistler cup/i],
    ['jacksonhole', 'kings-queens', 'Kings & Queens of Corbet’s', 'Esdeveniment', /kings.*queens/i],
    ['jacksonhole', 'rendezvous', 'Rendezvous presented by Jeep', 'Esdeveniment', /rendezvous/i],
    ['jacksonhole', 'partner-calendar', 'Agenda d’activacions de partners', 'Cicle', /agenda.*(?:sampling|activacions|degustacio)|degustacio a l.agenda/i],
    ['hanazononiseko', 'veuve-apres', 'Après-ski × Veuve Clicquot', 'Activació', /veuve|champagne/i],
    ['hanazononiseko', 'niseko-film', 'Niseko Film Festival · Park Hyatt Hanazono', 'Esdeveniment', /niseko film festival|niskeo film festival/i],
    ['rusutsuresort_official', 'ariake-prizes', 'Premis Rusutsu · torneig d’Ariake', 'Activació', /ariake|有明/i],
    ['rusutsuresort_official', 'nozaka', 'Rusutsu × Toshikazu Nozaka · col·lecció', 'Campanya', /野坂|nozaka/i],
    ['rusutsuresort_official', 'pickleball', 'Pickleball · experiència familiar', 'Activació', /pickleball/i],
    ['rusutsuresort_official', 'ishiya', 'Afternoon tea × ISHIYA', 'Activació', /ishiya|afternoon tea/i],
    ['valle_nevado', 'andes-masters', 'Andes Masters', 'Esdeveniment', /andes masters|andesmasters/i],
    ['valle_nevado', 'andes-cup', 'Andes Cup Valle Nevado by Oakley', 'Esdeveniment', /andes cup/i],
    ['valle_nevado', 'girls-park', 'Girls’ Park Takeover', 'Activació', /girls.? park takeover/i],
    ['valle_nevado', 'oakley-sessions', 'Oakley Snow Sessions', 'Activació', /snow sessions/i],
    ['valle_nevado', 'visa-apres', 'Après Ski Visa Santander', 'Activació', /apres.?ski visa|visa santander/i],
    ['valle_nevado', 'retro-apres', 'Retro Après Ski', 'Activació', /retro apres/i],
    ['valle_nevado', 'visa-benefits', 'Beneficis Visa · tickets, estada i serveis', 'Campanya', /visa.*(?:ticket|benefic|hoteles|arriendo|restaurante|off)|(?:ticket|benefic|hoteles|arriendo|restaurante).*visa/i],
    ['valle_nevado', 'isdin', 'Comunitat LOVEISDIN a la neu', 'Activació', /isdinlovers|loveisdin/i],
    ['cerrocastor', 'gromsearch', 'Rip Curl GromSearch', 'Esdeveniment', /gromsearch/i],
    ['cerrocastor', 'expression', 'Rip Curl Expression Air Session', 'Esdeveniment', /expression air session/i],
    ['cerrocastor', 'snow-pool', 'Rip Curl Snow Pool', 'Esdeveniment', /snow pool/i],
    ['cerrocastor', 'visa-night', 'Visa Night Experience', 'Activació', /visa night/i]
  ].map(([station, key, name, kind, match]) => ({ id: station + ':' + key, station, name, kind, match }));

  const labels = {
    naming: 'Naming d’esdeveniment', space: 'Naming d’espai', content: 'Naming de contingut', physical: 'Suport físic',
    digital: 'Cartell / grafisme', demo: 'Test de producte', sampling: 'Sampling',
    experience: 'Experiència de marca', service: 'Servei al visitant', product: 'Producte en context',
    giveaway: 'Premi / sorteig', credited: 'Menció acreditada'
  };

  // Explicit observations already documented in the original visual review.
  // These do not extend a cover observation to the whole video or to other partners.
  const observations = {
    'story:baqueira_beret:3810749794994647626': [
      ['Movistar', 'physical', 'El podi incorpora un panell de partners amb Movistar.'],
      ['Movistar', 'naming', 'El naming Baqueira Beret Pro by Movistar apareix a la peça del podi.']
    ],
    'story:baqueira_beret:3811345641738352206': [
      ['Peak Performance', 'physical', 'La portada revisada situa la marca al suport de la sortida.']
    ],
    'story:cerrocastor:3954932219416299641': [
      ['Corona', 'physical', 'Els logotips Corona són visibles al mobiliari exterior de La Barra.']
    ],
    'story:whistlerblackcomb:3994837170357903119': [
      ['COMMENCAL', 'physical', 'La Story indica que les entrades de l’afterparty es recullen a l’estand de COMMENCAL.'],
      ['Monster Energy', 'physical', 'La Story indica l’estand de Monster com a punt de recollida d’entrades.']
    ]
  };

  // These posts mention several resorts. Retain only the offer explicitly made
  // for Valle Nevado; the Visa lounge named in one caption belongs to La Parva.
  const scopedClaims = {
    'brand:visachile:Dct0OyROTSN:valle_nevado': 'La marca ofereix fins a un 36% de descompte en la Venda Ticket Flex de Valle Nevado, del 31 d’agost al 2 de setembre.',
    'brand:visachile:DbTI6rUuSkA:valle_nevado': 'Visa Infinite ofereix fins a un 20% de descompte als restaurants Bajo Cero i Pub 3 Puntas de Valle Nevado. El lounge de La Parva que també esmenta el post correspon a una altra estació.',
    'brand:visachile:Davgr_BuDm5:valle_nevado': 'Visa Infinite ofereix fins a un 25% de descompte en lloguer de material a Valle Nevado, entre altres destinacions.',
    'brand:visachile:DavgmYXucSq:valle_nevado': 'Visa Infinite anuncia fins a un 20% de descompte als restaurants de Valle Nevado.',
    'brand:visachile:Davg3HGOhwR:valle_nevado': 'La llista de beneficis de Visa Infinite concreta fins a un 25% de descompte en tickets de Valle Nevado.'
  };

  const clean = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const brandKey = value => clean(value).replace(/[^a-z0-9]/g, '');
  const sentenceList = value => String(value || '').split(/\n+|(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  const short = value => value.length > 220 ? value.slice(0, 217).trimEnd() + '…' : value;
  const shortcode = piece => (String(piece.sourceUrl || '').match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/i) || [])[1];
  const publicationKey = piece => piece.station + ':' + (shortcode(piece) || piece.id);
  const aliases = {
    'Movistar': ['movistar_es'], 'Cantabria Labs': ['cantabrialabs_esp', 'heliocare'],
    'Heliocare': ['cantabrialabs_esp', 'cantabria labs'], 'Mercedes-Benz': ['mercedesbenz'],
    'Alpina Watches': ['alpinawatches'], 'Aspen Vodka': ['aspen_vodka'],
    'The Green Mountain': ['thegreenmountain'], 'SB3 Components': ['sb3components'],
    'Monster Energy': ['monster', 'monsterenergy'], 'Cerveza Royal Guard': ['cervezaroyalguard', 'royal guard'],
    'Royal Guard': ['cervezaroyalguard'], 'Sylranch Winery': ['sylranchwinery']
  };

  function createCatalog(stationPieces, brandPosts) {
    const unique = new Map(), byId = new Map();
    [...stationPieces, ...brandPosts].forEach(original => {
      const key = publicationKey(original);
      let piece = unique.get(key);
      if (!piece) {
        piece = { ...original, brands: [...(original.brands || [])], origins: [], sourceRecords: [], aliases: [] };
        unique.set(key, piece);
      }
      piece.aliases.push(original.id);
      piece.sourceRecords.push(original);
      const origin = { type: original.account ? 'brand' : 'station', account: original.account || original.station };
      if (!piece.origins.some(o => o.type === origin.type && o.account === origin.account)) piece.origins.push(origin);
      piece.brands = [...new Set([...piece.brands, ...(original.brands || [])])];
      byId.set(original.id, piece);
    });
    const pieces = [...unique.values()];
    const eventCache = new Map(), relationCache = new Map();

    function eventsForPiece(input) {
      const piece = byId.get(input.id) || input;
      if (eventCache.has(piece.id)) return eventCache.get(piece.id);
      const options = definitions.filter(d => d.station === piece.station);
      // Captions outrank editorial titles: one inherited Aspen title says X Games,
      // while its original caption identifies The Snow League.
      const caption = clean(piece.caption);
      const contextual = clean([piece.title, piece.context].join(' '));
      let result = options.filter(d => d.match.test(caption));
      if (!result.length) result = options.filter(d => d.match.test(contextual));
      if (piece.station === 'rusutsuresort_official' && /ariake|有明/.test(caption)) result = result.filter(d => d.id.endsWith(':ariake-prizes'));
      if (piece.station === 'palarinsalandorra' && !/mtb|btt|mountain.?bike|uci|whoop|\bxco\b|\bdhi\b/.test(caption + contextual)) result = result.filter(d => !d.id.endsWith(':world-cup-mtb'));
      // Recaps may explicitly cover more than one event. A venue name or a
      // general campaign does not split an otherwise identifiable event.
      result = result[0]?.kind === 'Esdeveniment' ? result.filter(d => d.kind === 'Esdeveniment') : result.slice(0, 1);
      eventCache.set(piece.id, result);
      return result;
    }

    function eventFor(input) { return eventsForPiece(input)[0] || null; }
    function matchesEvent(input, eventId) { return eventsForPiece(input).some(event => event.id === eventId); }

    const brandNamesCache = new Map();
    function namesFor(brand) {
      if (!brandNamesCache.has(brand)) brandNamesCache.set(brand, [...new Set(
        [brand, ...(aliases[brand] || []), ...brandPosts.filter(p => (p.brands || []).some(b => brandKey(b) === brandKey(brand))).map(p => p.account)]
          .map(brandKey).filter(Boolean)
      )]);
      return brandNamesCache.get(brand);
    }

    function relations(input) {
      const piece = byId.get(input.id) || input;
      if (relationCache.has(piece.id)) return relationCache.get(piece.id);
      const found = [];
      function add(brand, type, evidence, basis) {
        if (!found.some(r => r.brand === brand && r.type === type)) found.push({ brand, type, label: labels[type], evidence: short(evidence), basis, pieceId: piece.id });
      }
      if (scopedClaims[piece.id]) {
        add('Visa', 'service', scopedClaims[piece.id], 'Text original · oferta específica de Valle Nevado');
        relationCache.set(piece.id, found);
        return found;
      }
      const caption = piece.caption || '';
      const reviewed = /visually_reviewed|source_cover/.test([piece.reviewStatus, piece.reviewBasis].join(' '));
      const visualText = reviewed ? [piece.title, piece.explanation].filter(Boolean).join('. ') : '';
      const sources = [
        ...sentenceList(caption).map(text => ({ text, basis: 'Text original d’Instagram' })),
        ...sentenceList(visualText).map(text => ({ text, basis: 'Portada i context revisats' }))
      ];
      const brandNames = piece.brands || [];
      function namingType(text) {
        if (/ski by|skis by|shot (?:on|by)|filmed (?:on|by)|equip/.test(text)) return 'product';
        if (/winning run|grafisme|capcalera|film |video |photo/.test(text)) return 'content';
        if (eventFor(piece)?.kind === 'Espai de marca') return 'space';
        return eventFor(piece) ? 'naming' : 'credited';
      }
      for (const { text, basis } of sources) {
        const normalized = clean(text), compact = brandKey(text);
        for (const brand of brandNames) {
          const keys = namesFor(brand);
          if (!keys.some(key => compact.includes(key))) continue;
          const words = normalized.replace(/[^a-z0-9@]+/g, ' ');
          const nameTokens = words.split(' ').filter(token => keys.some(k => brandKey(token).startsWith(k)));
          const brandPattern = nameTokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
          if (brandPattern && new RegExp('(?:by|presented by|driven by|presenta|naming de|naming d.)\\s+(?:@)?(?:' + brandPattern + ')').test(words)) {
            add(brand, namingType(normalized), text, basis);
          }
          if (keys.some(key => ['by', 'presentedby', 'drivenby', 'presenta'].some(prefix => compact.includes(prefix + key)))) {
            add(brand, namingType(normalized), text, basis);
          }
          const explicitNames = {
            Audi: /audi.*(?:quattro.?cup|fis.?ski.?world.?cup|power.?of.?four|ajax.?cup)/,
            WHOOP: /whoop.?uci|uci.?whoop/,
            'Unicaja Banco': /unicajaultra|unicaja.?ultra/,
            'Rip Curl': /rip.?curl.?(?:gromsearch|expression.?air.?session|snow.?pool)/,
            Volvo: /cronoslalom.*volvo|volvo.*cronoslalom/
          };
          if (explicitNames[brand]?.test(normalized)) add(brand, 'naming', text, basis);
          if (/naming/.test(normalized) && keys.some(k => compact.includes(k)) && !/grafisme|capcalera|winning run/.test(normalized)) add(brand, 'naming', text, basis);
          if (basis !== 'Text original d’Instagram' && /logotip|logos|panell|suports de|suport de|estand|mobiliari|bar de gel/.test(normalized) && /podi|sortida|escenari|estand|mobiliari|bar de gel|village|suports de|suport de/.test(normalized)) add(brand, 'physical', text, basis);
          else if (basis !== 'Text original d’Instagram' && /cartell|grafisme|panell|capcalera/.test(normalized)) add(brand, 'digital', text, basis);
        }
        // Attribute the action to the nearest brand actually named in this sentence.
        // Example: WHOOP names the World Cup, Shimano runs its Test Area.
        const tokens = normalized.replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);
        const mentions = tokens.map((token, at) => ({ at, brands: brandNames.filter(b => namesFor(b).some(k => token.startsWith(k))) })).filter(m => m.brands.length);
        const signals = [
          ['physical', /^(?:estand|estands|booth|booths|wallride)$/],
          ['demo', /^(?:provar|probar|test|demo|demos|speedtrap)$/],
          ['sampling', /^(?:sampling|degustacio|degustation|samples|tasting)$/],
          ['giveaway', /^(?:sorteig|sorteo|sorteamos|giveaway|concours|contest|premi|premio)$/],
          ['service', /^(?:esim|shuttle|descompte|descuento|valet)$/],
          ['experience', /^(?:terrassa|terraza|terrace|lounge|icebar)$/],
          ['product', /^(?:vehicle|rellotge|envas|lata|ampolla)$/]
        ];
        for (const [type, indicator] of signals) tokens.forEach((token, at) => {
          if (!indicator.test(token)) return;
          const nearest = [...mentions].sort((a, b) => Math.abs(a.at - at) - Math.abs(b.at - at))[0];
          const brands = nearest && Math.abs(nearest.at - at) <= 9 ? nearest.brands : brandNames.length === 1 ? brandNames : [];
          brands.forEach(brand => add(brand, type, text, basis));
        });
      }
      for (const alias of piece.aliases || [piece.id]) (observations[alias] || []).forEach(([brand, type, evidence]) => {
        const originalBrand = brandNames.find(b => brandKey(b) === brandKey(brand) || brandKey(b).includes(brandKey(brand)) || brandKey(brand).includes(brandKey(b)));
        if (originalBrand) add(originalBrand, type, evidence, 'Portada i context revisats');
      });
      brandNames.forEach(brand => {
        if (found.some(r => r.brand === brand)) return;
        const evidence = sentenceList(caption).find(s => namesFor(brand).some(k => brandKey(s).includes(k))) || piece.proof || (reviewed ? piece.explanation : '') || 'La marca està acreditada a la publicació; no s’hi concreta el suport o l’acció.';
        add(brand, 'credited', evidence, caption ? 'Text original d’Instagram' : 'Portada i context revisats');
      });
      relationCache.set(piece.id, found);
      return found;
    }

    return {
      pieces, definitions, labels, eventFor, eventsForPiece, matchesEvent, relations,
      canonicalId: id => (byId.get(id) || {}).id || id,
      find: id => byId.get(id),
      eventsFor: station => definitions.filter(d => d.station === station && pieces.some(p => p.station === station && matchesEvent(p, d.id)))
    };
  }

  const api = { createCatalog };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OLAF_EVENT_MODEL = api;
})(typeof window !== 'undefined' ? window : globalThis);
