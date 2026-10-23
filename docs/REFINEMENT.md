# OLAF — refinament de la interfície original

Preview local: http://127.0.0.1:4330/manual-estil-ski-resorts/#baqueira_beret

Base: commit 8250d3a3ed2df2268622a56d00e287b5b3ff9764. Canvis locals sobre HTML/CSS/JavaScript originals. La versió pública no s’ha modificat.

## Canvis visibles

- Mateixa paleta neu/blau pissarra, Inter, fotografia amb degradats i directoris en files.
- Selector d’estació identificat amb «Canvia d’estació», mantenint el títol i el menú agrupat existent.
- Menys espai entre identitat, formats, filtres i col·leccions. Informació de cobertura en un desplegable natiu accessible.
- Ubicació integrada amb silueta geogràfica transparent, coordenades aproximades i accés a OpenStreetMap. L’abast d’aquesta entrega és només escriptori.
- Portades escollides segons la col·lecció; peces verticals completes, fotos horitzontals amb punt focal i apilat original contingut dins de cada columna.
- Fotografia de Marques més breu, esvaïda abans del directori.

## Fotografia

22 escenes amb variants AVIF/WebP d’escriptori; 16 fonts substituïdes per fotografies de context més adequades. 206 derivats d’escriptori de servei, 24,51 MiB totals (es descarreguen variants segons viewport, no el conjunt).

Baqueira conserva la mateixa foto, amb màster SwinIR lightweight_sr x4 de 6000 × 4000 px, a partir de 1500 × 1000 px. La reconstrucció queda identificada i no s’utilitza com a evidència. Màsters, entrada i JSON a la carpeta germana olaf-refinament/masters.

Whistler és l’única escena amb font nativa de 900 × 589 px: l’amplada visual queda limitada en funció de la densitat de pantalla. Les altres fonts són de 1200 px o més. No s’han ampliat convencionalment les fonts petites.

Val Thorens: Florian Pépellin, fotografia de 3945 × 2940 px, CC BY-SA 4.0; atribució, llicència i transformacions al manifest i al peu de la web. Evidències i mitjans originals intactes.

Procedència: media/scenes/refined/photo-manifest.json, media/covers/provenance.json i media/geography/provenance.json.

## Referències aplicades

- Switzerland Tourism/Zermatt: silueta territorial lleugera que acompanya el text, sense panell cartogràfic. https://www.myswitzerland.com/en/destinations/zermatt/
- Design Hotels/Zermatt: fotografia i informació de destinació amb accés explícit a vista de mapa. https://www.designhotels.com/hotels/switzerland/zermatt/
- Pirineu365/Estacions: referència de fotografia territorial específica; no s’ha adoptat la seva graella de targetes. https://pirineu365.cat/estacions/

La cartografia no copia assets d’aquestes webs. Es genera a partir de geometria real Natural Earth 1:50 milions, de domini públic. Els 22 SVG ocupen 166.201 bytes totals; no es carrega MapLibre ni rajoles en entrar a la pàgina.

## Verificació i ús

Proves de models i portades: node --test tests/*.test.cjs
Verificació geogràfica reproduïble: node scripts/build-geography.mjs --check

Les comprovacions d’escriptori en 1280, 1440 i 1920 px, captures i resultat JSON es lliuren a la carpeta germana olaf-refinament. S’han comprovat selecció amb teclat, historial, filtres, desades amb les categories originals i recuperació davant fallada del localitzador.

Per servir el codi sense compilació: iniciar un servidor HTTP estàtic a l’arrel d’aquest checkout. El servidor de preview 4330 té un adaptador de prefix /manual-estil-ski-resorts/ perquè els enllaços coincideixin amb GitHub Pages.

## Abast d’escriptori

Per instrucció explícita de l’usuari, no es dissenya ni es lliura una versió mòbil. Els ajustos nous de composició només s’apliquen a partir de 1024 px; l’original conserva les seves regles estretes. No s’inclouen nous retalls ni variants mòbils a la cadena de fotografia.

Validació final: 39/39 proves de dades i selecció de portades; 16 comprovacions de navegador passades en Chromium i WebKit (1280, 1440, 1920 px). Sense errors JavaScript ni desbordament horitzontal d’escriptori. Hashos dels 206 derivats i 22 SVG contrastats contra els manifests.
