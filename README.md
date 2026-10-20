# Manual d’estil — Ski resorts

Visor interactiu de referències d’Instagram sobre comunicació i publicitat de marques en estacions d’esquí.

La pàgina pública es publica amb GitHub Pages des de `index.html`.

Els pòsters, les imatges i els vídeos del visor es serveixen des de `media/`, incloses les peces seleccionades dels comptes oficials de les marques patrocinadores. Les Stories, els Reels i els vídeos del feed es reprodueixen com a MP4 optimitzats per al web; cada peça manté l’enllaç a la publicació original d’Instagram. Aquest projecte es manté i es publica exclusivament des de GitHub Pages.

El punt d’entrada de cada estació és una biblioteca de col·leccions amb portades apilades. En obrir un esdeveniment, activació, cicle o espai de marca, es despleguen la lectura del paper dels partners, les evidències i les peces originals en un carrusel. Els filtres d’esdeveniment, patrocinador, format i compte d’origen es poden combinar. `?event=<id>#<estació>` conserva una col·lecció en un enllaç directe.

`event-catalog.js` conté els noms identificats en els textos, les portades i els Destacats preservats. Les associacions són específiques de cada estació; compartir patrocinador no agrupa dos esdeveniments diferents. Les peces sense esdeveniment identificat continuen disponibles a «Altres peces de marca» i a «Totes les peces». Un naming, un grafisme digital i un suport físic es distingeixen segons l’evidència de cada peça, sense inferir contractes o publicitat de pagament. Les interpretacions de transferència a FGC no s’utilitzen com a evidència.

Les publicacions relacionades dels comptes de marca es poden consultar des de «Marques» o conjuntament amb les de l’estació. Les coautories es compten una sola vegada i es conserven els dos comptes d’origen. La revisió de comptes de marca és parcial: els 1.464 registres de la recollida acotada i l’ampliació de Cantabria Labs no constitueixen un cens anual de tots els patrocinadors. La nova agrupació reutilitza aquesta recerca, sense un nou consum d’Apify.

Validació del model d’esdeveniments i atribucions:

```sh
node --test tests/event-catalog.test.cjs
```
