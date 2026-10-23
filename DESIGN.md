# OLAF — Sistema d’interfície

Visor de referències publicitàries d’Instagram per a un equip de màrqueting. Mode d’ús: consultar, comparar i guardar. El contingut és l’evidència; la interfície n’organitza l’accés i no n’afegeix afirmacions.

## Direcció visual d’escriptori — Zermatt

La referència escollida explícitament per l’usuari és Switzerland Tourism / Zermatt. Aquesta direcció substitueix la paleta blava i la capçalera ambiental anteriors. Només s’implementa i es verifica escriptori (1280, 1440 i 1920 px).

- Inter autohostatjada amb llicència oberta. La STAllegra de Switzerland Tourism no es copia.
- Fons blanc `#fff`, tinta `#272726`, text secundari `#62625f`, vermell `#b50024` i logo `#db001c`. Gris `#f2f2f2` reservat a superfícies secundàries.
- Hero real de `100svh`, màxim 1120 px, vel negre del 20%, títol blanc centrat de 76–88 px, ombra amb petit desplaçament, halo fosc difús darrere del nom i selector explícit.
- Vídeo territorial propi per als 22 perfils, amb controls de pausa, pausa fora de pantalla i fotografia de reserva. Moviment reduït o estalvi de dades mantenen la fotografia fins a una reproducció voluntària. El vídeo és context territorial; no forma part de les evidències de temporada 25–26.
- Capçalera global blanca de 110 px i menú de secció de 88 px just sota el hero, fixat en fer scroll. La selecció usa contorn vermell; focus visible.
- Contingut de 1190 px, sense caixes per a cada paràgraf. Resum, recompte de peces, mapa sense marc i temps actual integrats a la part baixa del hero sobre un degradat fosc. Després del menú comencen directament els filtres i les col·leccions. Cartografia Natural Earth de domini públic, silueta grisa visible i marcador vermell.
- Col·leccions fotogràfiques amb radi de 16 px, sense ombra; només representen agrupacions reals existents. Hover: zoom 1.05, retall interior de 3 px i desplaçament del text de 5 px. Sense aquests moviments quan es demana moviment reduït.
- Les fotografies de presentació poden tenir un enquadrament editorial. Les portades verticals adopten la proporció de la imatge i es distribueixen en tres columnes de diferents alçades, sense franges laterals; cartells i fonts verticals es conserven sencers. L’original complet sempre continua accessible al visor.
- Meteorologia de MET Norway amb hora de validesa, hora de consulta, atribució, refresc de 12 minuts mentre la pàgina és visible i estats de fallada/antiguitat explícits. És una estimació del model per al domini, no un termòmetre físic ni un estat de pistes.

## Arquitectura de la informació

1. **Estacions**: triar estació en el títol → col·leccions d’esdeveniments/activacions → peces → anàlisi de la peça i transferència a FGC → vinculació de les marques amb evidències.
2. **Comptes de marca**: cercar o filtrar directori → fitxa de marca → compte, formats i peces vinculades → cobertura de la recerca. La fitxa substitueix el directori; el retorn conserva cerca i filtres.
3. **Sectors**: índex de sectors amb marques d’exemple i nombre de peces → sector → acotar per estació, marca i format → peces.
4. **Desades**: biblioteca local del navegador, amb filtres per estació, sector i categoria; desar/eliminar/desfer amb estat de persistència explícit.

La navegació principal i els enllaços entre fitxes són enllaços HTML. Els canvis de format, índex, reproducció i guardat són botons. El fil d’Ariadna mostra el context actual. Les peces tenen un índex paginat de miniatures a més del carrusel; no cal passar-les totes successivament per consultar-ne una.

## Estats i comportament

- URL compartible amb vista, estació, marca, esdeveniment, filtres, peça i element del carrusel. Enrere/Endavant i recàrrega restauren la selecció. Valors desconeguts retornen a una selecció usable.
- Les cerques no mouen el focus; les transicions de pantalla el situen al títol. Si es reconstrueix un control, es conserva el focus equivalent.
- Selector d’estació compacte: fletxes, Inici/Fi, Enter/Espai, Escape i Tab. El focus és visible i el desplaçament del menú és independent.
- Fletxes del carrusel només dins el seu propi àmbit; no intercepten vídeos, formularis o diàlegs. Imatges ampliables amb botó i diàleg natiu amb tancament Escape.
- L’enllaç a Instagram és visible sota cada peça, fora del desplegable d’anàlisi. El text original té una vista prèvia i una lectura completa independent; els textos curts es mostren sencers i les Stories sense text no n’inventen cap.
- Controls amb objectiu còmode de 44px; contorns de focus contrastats, selecció subratllada i indicació textual de filtres actius. La preferència de moviment reduït desactiva paral·laxi i transicions.
- Errors de càrrega mantenen portada, explicació i font quan existeixen; una portada no simula un vídeo. Localitzador de Natural Earth integrat a la part baixa del hero, amb accés explícit al mapa complet d’OpenStreetMap; si el SVG no està disponible, la ubicació textual i l’enllaç continuen accessibles.
- Desar o eliminar només es confirma després d’escriure al navegador. Una eliminació té opció de desfer.

## Límits de les afirmacions

La interfície no pressuposa contractes, publicitat de pagament ni arxiu anual de Stories desaparegudes. Es mantenen els textos originals, l’autoria, les limitacions de cobertura i les fonts. Els vídeos conserven controls natius i una explicació textual de la peça; no s’han inventat subtítols ni transcripcions del seu àudio. La validació automatitzada no es presenta com una certificació WCAG completa.

## Abast i precedència

La nova direcció Zermatt se situa sobre el refinament original d’octubre de 2026, conservant models, corpus i fonts. La proposta d’atlas descartada no s’utilitza. Només versió d’escriptori; no desenvolupar variants mòbils. Publicació posterior a la revisió del resultat local.

## Refinament visual del 23 d’octubre — v2

- Comptes de marca: 93 marques amb publicacions, ordenades de més a menys; empats per nom. Logotips grans amb la imatge existent de compte, dades directes i separadors fins. 18 entrades inicials i accés a totes.
- Sectors: una sola columna de 13 fotografies amples, originals de 3000 px, derivats AVIF/WebP de 1200 i 2400 px. Degradat per a la llegibilitat; «Altres» al final. La fotografia il·lustra la categoria, no acredita cap patrocini.
- País i compte alineats amb el resum del hero; els noms d’estació conserven l’ombra i el fons difús.
- Selectors d’escriptori amb superfície neutra, indicador, opció activa i cerca quan hi ha més de vuit opcions. Teclat, focus, Escape i Tab; els controls natius continuen mantenint valors, esdeveniments i URL.
- Resum global de formats amb anell de composició, tres barres sobre escala de 100%, valors i percentatges explícits. Entrada en fer scroll i ressaltat coordinat en passar-hi el cursor; resultat estàtic amb moviment reduït. Les dades són les 1.308 publicacions globals deduplicades.
- Vídeos de context de les 22 estacions. Selecció de plans reals de fonts oficials, retall de bandes negres i bucle suau; sense ampliació artificial. WebM VP9 i MP4 H.264. Procedència i dimensions actives reals als manifests. Aquests vídeos decoratius són muts; les evidències audiovisuals originals no es modifiquen.

Implementació i validació: `docs/VISUAL-V2.md`.
