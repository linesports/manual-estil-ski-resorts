# Localitzadors geogràfics OLAF

22 SVG transparents, de 400 × 240 unitats, corresponents als 22 identificadors d'estació o grup de `scene-data.js`. El fitxer `geography-data.js` n'exposa la mida, el camí, l'atribució, la finestra geogràfica i els punts. No depenen de MapLibre ni de peticions de tessel·les.

## Font real i llicència

- Geometria administrativa Natural Earth, escala nominal **1:50 milions** (`ne_50m_admin_0_countries.geojson`); no és una precisió de 50 metres.
- Snapshot verificable: [commit 9380cca83db5f9aef52d5e762765100745f84b27](https://github.com/nvkelso/natural-earth-vector/blob/9380cca83db5f9aef52d5e762765100745f84b27/geojson/ne_50m_admin_0_countries.geojson).
- SHA-256 de la font: `3e458fc036ad0a66411f2c1e6cac49c5d7bfb81cb1123bc513b22511a2b7fdeb`.
- [Domini públic segons Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/). Atribució escollida: «Cartografia · Natural Earth · domini públic».
- Les coordenades aproximades provenen de `scene-data.js` i s'han preservat. Formigal–Panticosa, Pal Arinsal i ARAMON mostren tots els seus punts existents.

## Transformació

Projecció Mercator esfèrica de longitud/latitud WGS84. Cada àmbit té una finestra explícita a `provenance.json`; no s'inventen contorns, relleus ni línies de carena. Les illes de menys de 0,9 píxels en totes dues dimensions s'ometen a aquesta escala. Els contorns es simplifiquen amb Douglas–Peucker a la tolerància indicada per asset i s'arrodoneixen a 0,1 unitats SVG.

La presentació és només de contorns: tots els territoris tenen `fill="none"`, sense farciment interior, amb traç blanc `#fff` d'1,3 unitats SVG per mostrar-los sobre el vídeo del hero. Els marcadors vermells es conserven. El canvi de presentació del 28 d'octubre no altera cap traçat, punt, coordenada, finestra, projecció ni tolerància. El manifest inclou `renderStyle` i el SHA-256 de cada SVG per poder invalidar la memòria cau sense canviar-ne la ruta nominal.

Els SVG són localitzadors de situació, sense marc ni fons. No són plànols de pistes. Els elements `img` de la interfície han de portar `alt=""` i `aria-hidden="true"`, perquè el nom del lloc i l'enllaç al mapa ja n'ofereixen l'equivalent textual.

## Regenerar i verificar

Des de l'arrel del projecte:

```sh
node scripts/build-geography.mjs
node scripts/build-geography.mjs --check
```

Es pot evitar tornar a descarregar la font amb `--source /ruta/ne_50m_admin_0_countries.geojson`. El generador verifica el hash de la font, els 22 identificadors, que tots els punts quedin dins dels límits, la projecció dels punts dins del marge i el límit de 15 KiB per SVG. `--check` també comprova que els SVG, el manifest i la procedència coincideixin amb la generació actual.
