# OLAF — Refinament visual v2

Implementació del 23 d’octubre de 2026 sobre el refinament original, després del commit `104e207`. Abast: només escriptori; mantenir la direcció visual actual i la lectura integrada del hero. No s’utilitza el redisseny d’atlas descartat.

## Canvis

1. **Comptes de marca:** 93 marques amb publicacions, ordre descendent de `publicationCount`, empat pel nom català; 18 inicials amb ampliació a totes. Logotips de compte a aproximadament 104 px, sense ampliar els originals de 150 px per sobre de la mida nativa a densitat 1. L’ordenació s’aplica sobre el conjunt filtrat. Models, àlies i identitats no canvien.
2. **Sectors:** 13 portades en una sola columna, fotografia, degradat, marques d’exemple i recompte. 13 originals de 3000 px; 52 derivats AVIF/WebP a 1200/2400 px. «Altres» es mostra al final.
3. **Hero:** 22 perfils amb vídeo real de context, selecció territorial, pausa, bucle i fotografia de reserva. País i compte dins del mateix ample que el resum, sense el desplaçament de Cerler.
4. **Selectors:** desplegable coherent amb la interfície, cerca sense accents per als conjunts llargs, selecció visible, teclat i restauració del focus. Preserven el select original i els seus esdeveniments, filtres i URL. Els diàlegs mantenen el selector natiu.
5. **Activacions:** tres columnes de portades amb proporcions corresponents a les imatges verticals. Es retiren les franges neutres laterals. L’original íntegre continua al visor.
6. **Formats:** total de 1.308, anell de composició, barres amb escala compartida de 100%, xifres i percentatges directes. Reels/vídeos: 690; fotos/carrusels: 489; Stories: 129. Els percentatges arrodonits a un decimal sumen 100,1%; els segments i les barres es calculen amb les fraccions exactes.

## Referents aplicats

[Linear Insights](https://linear.app/insights) i la seva [documentació](https://linear.app/docs/insights): mètrica principal clara, gràfic i detall llegibles conjuntament. [Datawrapper](https://www.datawrapper.de/academy/customizing-your-bar-chart): valors directes, gruix i escala per facilitar la comparació. [ONS](https://service-manual.ons.gov.uk/data-visualisation/chart-types/stacked-bar-charts): representar les parts d’un total amb les categories reals, sense inventar una evolució temporal. S’han traslladat criteris de jerarquia i llegibilitat al llenguatge existent d’OLAF.

## Fitxers

- `visual-v2.css`: només regles d’escriptori, a partir de 1024 px.
- `select-ui.js`: millora progressiva dels controls existents.
- `format-dashboard.js`: llegeix les xifres finals deduplicades del resum existent.
- `sector-visuals.js`, `sectors.css` i `media/sectors/provenance.json`: fotos, enquadrament i procedència.
- `hero-media-pyrenees.js`, `hero-media-world.js`: 21 vídeos nous, afegits al de Baqueira ja existent, abans de carregar `premium.js`.
- `media/hero/pyrenees-manifest.json`, `media/hero/manifest-world.json`: fonts, intervals, processament, dimensions, pes i SHA-256.
- `scripts/build-hero-pyrenees.py`, `scripts/build-world-heroes.py`: reconstrucció dels derivats a partir dels clips font conservats al dossier de lliurament.

## Media i fonts

Les fotografies de sector són contextuals, de fonts Unsplash amb llicència identificada. Els vídeos provenen de publicacions oficials dels operadors. El manifest conserva titular, pàgina, URL, intervals i les limitacions de procedència; una publicació pública no es presenta com una cessió de drets. La preview és local i la publicació no s’ha executat.

Els nous vídeos tenen 1920 px d’ample nadiu. Les alçades actives poden ser 808, 816, 908, 990, 996 o 1080 px després de retirar bandes cinematogràfiques, sense ampliació. Sierra Nevada utilitza un film territorial oficial 2022/23 i Grandvalira conserva el blanc i negre del seu film. Els crèdits els identifiquen com a context; no són una lectura de neu actual ni evidències afegides al corpus.

El navegador carrega una variant del vídeo de la capçalera activa. En sortir del hero es pausa; en canviar d’estació es retira el vídeo anterior. Amb moviment reduït no es descarrega vídeo inicialment: es mostra la fotografia i es pot reproduir voluntàriament. Si el fitxer falla, queda la fotografia. Les vistes de consulta no mantenen el vídeo d’una estació al darrere.

## Paritat i verificació

Els tres blocs de JavaScript inline d’`index.html`, que inclouen dades i comportament base, coincideixen byte a byte amb `104e207`. Els models i les fonts de dades no han canviat. Les 93 marques són el subconjunt amb publicacions del directori, no una eliminació de les altres identitats. Les fonts, textos originals, comptes, associacions i desades locals mantenen el seu tractament anterior.

La verificació detallada, captures i scripts es lliuren al dossier germà `../olaf-visual-v2/`. Vegeu `VERIFICACIO.md`. La comprovació automatitzada no equival a una certificació completa d’accessibilitat o rendiment de camp.
