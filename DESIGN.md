# OLAF — Sistema d’interfície

Visor de referències publicitàries d’Instagram per a un equip de màrqueting. Mode d’ús: consultar, comparar i guardar. El contingut és l’evidència; la interfície n’organitza l’accés i no n’afegeix afirmacions.

## Direcció visual d’escriptori — Zermatt

La referència escollida explícitament per l’usuari és Switzerland Tourism / Zermatt. Aquesta direcció substitueix la paleta blava i la capçalera ambiental anteriors. Només s’implementa i es verifica escriptori (1280, 1440 i 1920 px).

- Inter autohostatjada amb llicència oberta. La STAllegra de Switzerland Tourism no es copia.
- Fons blanc `#fff`, tinta `#272726`, text secundari `#62625f`, vermell `#b50024` i logo `#db001c`. Gris `#f2f2f2` reservat a superfícies secundàries.
- Capçalera única fusionada: vídeo territorial al 60% esquerre, amb context breu «Patrocinis a Instagram», nom/selector d’estació i una sola frase de propòsit. El 40% dret, gris sòlid, integra mapa de contorns, situació, coordenades i temperatura. No hi ha una segona presentació ni botó intermedi per arribar a l’estació; període real al peu i temporada al menú.
- Vídeo territorial propi per als 22 perfils, amb controls de pausa, pausa fora de pantalla i fotografia de reserva. Moviment reduït o estalvi de dades mantenen la fotografia fins a una reproducció voluntària. El vídeo és context territorial; no forma part de les evidències de temporada 25–26.
- Capçalera global blanca de 110 px. Hero i fitxa d’estació són un únic component. Menú local de 76 px immediatament a sota amb Esdeveniments, Peces i Marques, fixat en fer scroll; focus visible.
- Contingut de 1190 px, sense caixes per a cada paràgraf. La capçalera limita el text sobre vídeo al context i selector; no mostra línia de país/compte, comptatges abreujats o ajuda redundant sota el títol. Després del menú comencen els filtres i esdeveniments. Cartografia Natural Earth de domini públic: contorn gris d’1,3 unitats SVG, interior transparent i marcador vermell; fonts al peu.
- Col·leccions fotogràfiques amb radi de 16 px, sense ombra; només representen agrupacions reals existents. Hover: zoom 1.05, retall interior de 3 px i desplaçament del text de 5 px. Sense aquests moviments quan es demana moviment reduït.
- Les fotografies de presentació poden tenir un enquadrament editorial. Les portades verticals adopten la proporció de la imatge i es distribueixen en tres columnes de diferents alçades, sense franges laterals; cartells i fonts verticals es conserven sencers. L’original complet sempre continua accessible al visor.
- Meteorologia amb només la temperatura visible. Validesa, ubicació i estat en title/aria; sense icona, títol, descripció o hora visible. Refresc automàtic de 12 minuts; —°C quan no hi ha un valor actual, amb reintent accessible si falla. Font MET Norway/CC BY 4.0 al peu: és una estimació per ubicació, no estat de pistes.

## Arquitectura de la informació

1. **Estacions**: triar estació en el títol → col·leccions d’esdeveniments/activacions → peces → anàlisi de la peça i transferència a FGC → vinculació de les marques amb evidències.
2. **Marques**: cercar o filtrar directori → fitxa de marca → compte, formats i peces vinculades → cobertura de la recerca. La fitxa substitueix el directori; el retorn conserva cerca i filtres.
3. **Categories**: índex de sectors amb marques d’exemple i nombre de peces → sector → acotar per estació, marca i format → peces.
4. **Desades**: biblioteca local del navegador, amb filtres per estació, categoria i tipus de referència; desar/eliminar/desfer amb estat de persistència explícit.

La navegació principal i els enllaços entre fitxes són enllaços HTML. Els canvis de format, índex, reproducció i guardat són botons. El fil d’Ariadna mostra el context actual. Les peces tenen un índex paginat de miniatures a més del carrusel; no cal passar-les totes successivament per consultar-ne una.

## Estats i comportament

- URL compartible amb vista, estació, marca, esdeveniment, filtres, peça i element del carrusel. Enrere/Endavant i recàrrega restauren la selecció. Valors desconeguts retornen a una selecció usable.
- Les cerques no mouen el focus; les transicions de pantalla el situen al títol. Si es reconstrueix un control, es conserva el focus equivalent.
- Selector d’estació compacte: fletxes, Inici/Fi, Enter/Espai, Escape i Tab. El focus és visible i el desplaçament del menú és independent.
- Fletxes del carrusel només dins el seu propi àmbit; no intercepten vídeos, formularis o diàlegs. Imatges ampliables amb botó i diàleg natiu amb tancament Escape.
- L’enllaç a Instagram és visible sota cada peça, fora del desplegable d’anàlisi. El text original té una vista prèvia i una lectura completa independent; els textos curts es mostren sencers i les Stories sense text no n’inventen cap.
- Controls amb objectiu còmode de 44px; contorns de focus contrastats, selecció subratllada i indicació textual de filtres actius. La preferència de moviment reduït desactiva paral·laxi i transicions.
- Errors de càrrega mantenen portada, explicació i font quan existeixen; una portada no simula un vídeo. Localitzador de Natural Earth integrat al bloc de situació de l’estació, amb accés explícit al mapa complet d’OpenStreetMap; si el SVG no està disponible, la ubicació textual i l’enllaç continuen accessibles.
- Desar o eliminar només es confirma després d’escriure al navegador. Una eliminació té opció de desfer.

## Límits de les afirmacions

La interfície no pressuposa contractes, publicitat de pagament ni arxiu anual de Stories desaparegudes. Es mantenen els textos originals, l’autoria, les limitacions de cobertura i les fonts. Els vídeos conserven controls natius i una explicació textual de la peça; no s’han inventat subtítols ni transcripcions del seu àudio. La validació automatitzada no es presenta com una certificació WCAG completa.

## Abast i precedència

La nova direcció Zermatt se situa sobre el refinament original d’octubre de 2026, conservant models, corpus i fonts. La proposta d’atlas descartada no s’utilitza. Només versió d’escriptori; no desenvolupar variants mòbils. Publicació posterior a la revisió del resultat local.

## Refinament visual del 23 d’octubre — v2

- Comptes de marca: 93 marques amb publicacions, ordenades de més a menys; empats per nom. Logotips grans amb la imatge existent de compte, dades directes i separadors fins. 18 entrades inicials i accés a totes.
- Sectors: una sola columna de 13 fotografies amples, originals de 3000 px, derivats AVIF/WebP de 1200 i 2400 px. Degradat per a la llegibilitat; «Altres» al final. La fotografia il·lustra la categoria, no acredita cap patrocini.
- El refinament del 28 d’octubre retira país/compte del bloc inicial i trasllada el nom d’estació a una superfície blanca, amb selector integrat i caret vermell.
- Selectors d’escriptori amb superfície neutra, indicador, opció activa i cerca quan hi ha més de vuit opcions. Teclat, focus, Escape i Tab; els controls natius continuen mantenint valors, esdeveniments i URL.
- El resum global de formats es retira en el feedback del 28 d’octubre; els filtres de formats i totes les peces continuen disponibles, sense alterar els recomptes del corpus.
- Vídeos de context de les 22 estacions. Selecció de plans reals de fonts oficials, retall de bandes negres i bucle suau; sense ampliació artificial. WebM VP9 i MP4 H.264. Procedència i dimensions actives reals als manifests. Aquests vídeos decoratius són muts; les evidències audiovisuals originals no es modifiquen.

Implementació i validació: `docs/VISUAL-V2.md`.

## Feedback aprovat del 28 d’octubre

Marques i Categories són les denominacions visibles; Esdeveniments identifica la navegació local, mentre els usos analítics d’activació de marca mantenen el seu significat. Entrar a Marques des d’una estació conserva el filtre local i en recalcula els recomptes de consulta; Totes les estacions és una elecció explícita, conservada en recàrrega i historial. La vista de cada marca manté autoria, peces, fonts i anàlisi.

Correcció posterior de l’usuari: presentació i fitxa fusionades en una sola capçalera, només temperatura i mapa de contorns. Crèdits de mapa/temps al peu i cap gràfic global de formats. Implementació i decisions a `docs/superpowers/specs/2026-10-28-feedback.md`.

## Fusió de la capçalera — correcció del mateix dia

La imatge de feedback i el hero formen ara una sola composició de dues zones. El context general es redueix a una línia i una frase curta; el selector ja és a la primera pantalla. El mapa conserva punts, coordenades i geometria, canviant només el farciment a buit. La temperatura és l’única dada meteorològica visible; mai es presenta un valor antic com a actual.
