# Manual d’estil — Ski resorts

Visor interactiu de referències d’Instagram sobre comunicació i publicitat de marques en estacions d’esquí.

La pàgina pública es publica amb GitHub Pages des de `index.html`.

Els pòsters, les imatges i els vídeos preservats de l’estudi previ es serveixen des de `media/`. La nova recollida de comptes de marca disposa també d’allotjament audiovisual auxiliar a GitHub Pages. Les Stories, els Reels i els vídeos del feed es reprodueixen com a MP4 optimitzats per al web; cada peça manté l’enllaç a la publicació original d’Instagram. Aquest projecte es manté i es publica exclusivament des de GitHub Pages.

El punt d’entrada de cada estació és una biblioteca de col·leccions amb portades apilades. En obrir un esdeveniment, activació, cicle o espai de marca, es despleguen la lectura del paper dels partners, les evidències i les peces originals en un carrusel. Els filtres d’esdeveniment, patrocinador, format i compte d’origen es poden combinar. `?event=<id>#<estació>` conserva una col·lecció en un enllaç directe.

`event-catalog.js` conté els noms identificats en els textos, les portades i els Destacats preservats. Les associacions són específiques de cada estació; compartir patrocinador no agrupa dos esdeveniments diferents. Les peces sense esdeveniment identificat continuen disponibles a «Altres peces de marca» i a «Totes les peces». Un naming, un grafisme digital i un suport físic es distingeixen segons l’evidència de cada peça, sense inferir contractes o publicitat de pagament. Les interpretacions de transferència a FGC no s’utilitzen com a evidència.

«Comptes de marca» té directori propi, cerca, filtre de sector i d’estació, fitxa de compte i biblioteca audiovisual. Inclou una nova recollida d’Apify del 29 de setembre de 2025 al 28 de setembre de 2026: 151 identitats confirmades, 106 comptes amb publicacions relacionades, 884 publicacions úniques i 941 vincles entre compte, estació i publicació. Els comptes investigats sense peces relacionades continuen consultables amb el seu estat de cobertura.

El recorregut arriba al límit anual en 146 comptes. Vacanal exhaureix el feed públic de 34 posts; `@fisalpine` té cobertura parcial a partir del 20 de novembre de 2025; `@naturevalleycanada` no ha retornat contingut accessible; `@vorariuandorra` i l’àlies antic `@lacasitos_es` no han retornat peces. Lacasitos també consta amb el compte oficial `@lacasitos_oficial`, amb la finestra anual recorreguda. Els registres anteriors o posteriors a la finestra serveixen de control i no entren a la biblioteca.

La mateixa publicació es deduplica pel seu shortcode a les vistes globals. Es conserven totes les estacions relacionades, el perfil de marca on s’ha recuperat i l’autoria principal de les coautories. Una ubicació, una menció o una coautoria no acrediten per si soles un contracte ni una inversió publicitària. Les lectures noves es basen en el text original i les metadades disponibles; no es presenten com una revisió pla a pla de tots els vídeos. Les observacions visuals revisades de l’estudi previ es mantenen diferenciades.

Els nous carrusels conserven tots els seus elements, inclosos els vídeos intercalats. Les còpies web mantenen la durada i el so disponibles, amb compressió per a reproducció web. Els actius nous s’allotgen en repositoris públics auxiliars `manual-estil-ski-resorts-media*`, amb lots per sota del límit d’1 GiB de GitHub Pages. Cada lot es comprova contra els blobs de Git abans d’alliberar-ne la memòria cau local. Tres carrusels tenen elements de vídeo restringits per Instagram: el visor els identifica i mostra la portada i l’accés a l’original, sense simular-ne la reproducció.

La nova recollida no reconstrueix Stories que ja han desaparegut. Les Stories i els Destacats preservats de l’estudi previ es mantenen. No s’ha consultat Ad Library ni s’infereix rendiment comercial a partir de mètriques públiques.

La interfície integra fotografies reals de les estacions, degradats progressius, paral·laxi suau amb GSAP i un mapa geogràfic discret amb MapLibre. Les fotografies de context no es compten com publicacions de l’estudi. L’animació respecta la preferència de moviment reduït. Les llibreries i les llicències es conserven a `vendor/`.

Validació del model d’esdeveniments i atribucions:

```sh
node --test tests/*.test.cjs
```
