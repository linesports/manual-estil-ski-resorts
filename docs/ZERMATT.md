# OLAF — iteració d’escriptori amb referència Zermatt

23 d’octubre de 2026. Resultat local sobre la web estàtica original. Preview: [Baqueira Beret](http://127.0.0.1:4330/manual-estil-ski-resorts/#baqueira_beret). No s’ha publicat ni s’ha desenvolupat una versió mòbil.

## Direcció aplicada

La referència escollida per l’usuari és [Switzerland Tourism / Zermatt](https://www.myswitzerland.com/en/destinations/zermatt/). L’auditoria s’ha fet sobre la pàgina renderitzada a 1440 i 1920 px, amb captures, mides i estils calculats.

| Element | Aplicació a OLAF |
|---|---|
| Hero | Tota l’amplada, `100svh`, límit de 1120 px, fotografia o vídeo real |
| Capçalera global | Blanca, 110 px, logo vermell, navegació a 16 px |
| Títol | Inter 600 autohostatjada, 76–88 px, blanc, centrat i amb ombra negra |
| Ombrejat | Vel negre uniforme del 20% sobre la fotografia o vídeo |
| Menú de secció | Just sota el hero, 88 px, sticky, selecció amb contorn vermell |
| Colors | Blanc `#fff`, tinta `#272726`, accent `#b50024`; gris per a superfícies secundàries |
| Contingut | Amplada màxima de 1190 px; mapa sense requadre, introducció i meteorologia integrades |
| Col·leccions | Fotografies, radi de 16 px, mosaic de peces quadrades i una peça ampla |
| Hover | Zoom 1.05, retall interior de 3 px, moviment del text de 5 px; desactivat amb moviment reduït |

La tipografia propietària STAllegra de la referència no s’ha copiat. Inter conserva la llicència i el fitxer autohostatjats de la web original. Les targetes representen les col·leccions existents; els paràgrafs i les seccions de consulta no tenen contenidors decoratius nous.

## Imatge, ubicació i temps

Baqueira té un muntatge panoràmic de context creat a partir del vídeo oficial 4K de Baqueira Beret, publicat el 15 d’octubre de 2026. El loop dura 14,60 segons. Se serveixen WebM VP9 (6,13 MiB) i MP4 H.264 (5,50 MiB) a 1920 × 1080, amb poster WebP i AVIF. La font, els fragments, les dimensions, els còdecs, les mides i els SHA-256 són al manifest `media/hero/manifest.json`. El màster i el poster natiu 4K es conserven fora de la web, al dossier de lliurament.

El vídeo es pot pausar, s’atura fora de pantalla i en amagar la pestanya. Amb moviment reduït o estalvi de dades, no es descarrega fins que l’usuari decideix reproduir-lo. Si falla, es conserva la fotografia real carregada. Les altres 21 estacions mantenen les fotografies i les variants AVIF/WebP del refinament anterior. El vídeo de 2026 és context territorial i no s’incorpora com a evidència de la temporada 25–26.

El mapa usa els 22 localitzadors reals de Natural Earth, regenerats amb una silueta grisa més visible i marcador vermell. Es conserven coordenades, atribució i enllaç a OpenStreetMap. Si falla el SVG, la ubicació textual i l’enllaç continuen disponibles.

La meteorologia consulta MET Norway sense clau. Mostra temperatura, condició, hora de validesa del model, hora de consulta i atribució. Es refresca cada 12 minuts mentre la pàgina és visible, en tornar a una pestanya visible i en canviar d’estació. Respecta la cache del proveïdor, usa el fus horari del resort i protegeix contra respostes retardades. Una fallada mostra indisponibilitat o l’última previsió amb avís explícit d’antiguitat. És una estimació del model per a la ubicació aproximada, no una observació d’un sensor ni un estat de pistes. Detall a `docs/WEATHER.md`.

Les portades d’Iberdrola, Audi i Snow Beer utilitzen fotografies reals de les seves pròpies publicacions amb un punt focal revisat. Europa Cup i Naut Aran conserven la font vertical sencera. Naut Aran ocupa una sola columna per reduir les bandes laterals. La font completa i el text original continuen accessibles al visor.

## Verificació executada

- **49/49 proves unitàries passen.** S’han conservat les 39 proves de partida i afegit nou proves de meteorologia i una de prioritat de fotografia d’Audi.
- **24 grups de comprovacions de navegador passen**, repartits entre Chromium i WebKit, només a 1280 × 900, 1440 × 1000 i 1920 × 1080. Hero, títol, colors, menú sticky, hovers, dimensions, absència de desbordament i mapa carregat.
- Selector amb teclat, Escape i retorn del focus; canvi d’estació, Enrere, URL d’estació conservada, dossier, anàlisi amb context, font original i recàrrega.
- Desades amb la clau original `olaf-ski-sponsor-bookmarks-v1`, categoria Sampling i persistència després de navegar i recarregar. Les proves de model conserven les categories i la identitat de les peces.
- Vídeo real 1920 × 1080 en els dos motors, temps de reproducció avançant, muted/loop/playsInline, pausa/reproducció, pausa fora de pantalla i fallada amb fotografia de reserva.
- Sense descàrrega inicial de vídeos ni MapLibre amb moviment reduït. Les peces audiovisuals d’evidència conserven `preload="none"`; només es comprova el vídeo decoratiu quan el moviment està activat.
- Les **22 estacions** carreguen fotografia, mapa de 400 px i títol dins de la pantalla d’escriptori, sense desbordament horitzontal.
- API meteorològica real amb CORS des de localhost: Baqueira 5 °C i ennuvolat durant la consulta de les 16:28. Proves de xarxa bloquejada, cache marcada com a antiga i resposta d’estació anterior retardada. La temperatura pot variar després de la captura.
- Variants finals de 14,60 s: SHA-256 i mides contrastats amb el manifest; decodificació completa, HTTP 200, MIME correcte, Range 206 de 1024 bytes i MP4 fast-start verificats. Una darrera prova en els dos motors confirma reproducció del tall definitiu i accés a Sectors.
- Localitzadors i hashes de procedència verificats amb `node scripts/build-geography.mjs --check`; `git diff --check` correcte.
- Paritat: els scripts inline, les dades incrustades i vuit fitxers de models, fonts i navegació són idèntics byte a byte al commit de partida `f718ead`. No s’han alterat corpus, textos, fonts ni relacions.
- Una revisió independent ha detectat i tornat a comprovar dues regressions corregides: Marques amagada dins del hero i Anàlisi sense destí visible. També s’ha corregit la capa del botó de pausa i l’indicador del menú quan les seccions de peces estan amagades.

El detector visual d’Impeccable deixa avisos revisats: dues imatges ocultes del template amb `src` assignat en runtime, Inter escollida expressament, espais a sang del hero i separadors subratllats. La trama del gràfic original codifica formats; no és una decoració nova. S’ha corregit la mida de l’atribució cartogràfica a 11 px. Les proves renderitzades comproven les imatges carregades i els controls; no s’ha presentat el detector com una aprovació automàtica.

Les comprovacions són de la preview local i dels recorreguts descrits. No són una certificació WCAG, una mesura de Core Web Vitals de producció ni una verificació d’un desplegament públic.

## Fitxers i ús

Els canvis se centren en `index.html`, `swiss.css`, `premium.js`, el punt d’inserció de `brand-explorer.js`, les metadades de portades, meteorologia i assets del hero. L’arquitectura estàtica, els models i els fragments d’URL originals es conserven.

Per obrir la preview des del checkout:

```sh
python3 scripts/serve-preview.py --port 4330
```

Aquest servidor escolta només a localhost i admet peticions de rang de vídeo. Les captures, els JSON de verificació i els scripts de la sessió són al dossier `outputs/olaf-zermatt`. El codi editable és al checkout `outputs/olaf-original-refinat`.
