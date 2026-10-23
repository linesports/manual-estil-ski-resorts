# Temps actual d’OLAF

## Integració

Carregar `weather-model.js` i després `weather.js`, abans de la integració de `premium.js`.

```js
OLAF_WEATHER.show({
  stationId: state.station,
  scene: OLAF_SCENES.stations[state.station],
  container: document.getElementById('stationWeather')
});
// En sortir de la vista d’estació:
OLAF_WEATHER.hide();
// Actualització explícita:
OLAF_WEATHER.refresh();
```

El contenidor ha de ser un element existent, per exemple `<aside id="stationWeather"></aside>`. El mòdul genera contingut pla, sense cap superfície, marc o ombra: `.weather-heading`, `.weather-reading` (`.weather-icon`, `.weather-temperature`, `.weather-condition`), `.weather-meta` (`.weather-updated`, `.weather-source`), `.weather-status` i `.weather-retry`. El contenidor rep `.station-weather` i `data-weather-state="loading|fresh|stale|unavailable"`.

## Font i significat

Font: [Locationforecast 2.0 de MET Norway](https://api.met.no/weatherapi/locationforecast/2.0/documentation), dades obertes sota [CC BY 4.0 / NLOD 2.0](https://api.met.no/doc/License). Es mostra l’atribució «Dades de MET Norway» amb enllaç al proveïdor al costat del temps.

S’utilitza la temperatura del model per a la ubicació aproximada declarada a `scene-data.js`. No es presenta com una lectura d’un termòmetre físic de l’estació ni com un estat de pistes. El valor triat és el de l’última hora vàlida del model anterior o igual a l’hora actual. El codi meteorològic es tradueix al català; un codi desconegut conserva la temperatura vàlida però mostra «Estat no disponible».

La UI mostra «Previsió de les HH:MM» en el fus de l’estació. El títol del temps inclou la data de validesa, la publicació del model i el fus horari. La línia «Actualitzat a les HH:MM» indica l’última consulta satisfactòria. La previsió d’una hora futura no es fa passar per temps actual.

S’ha revisat també Open-Meteo: la seva API gratuïta és per a ús no comercial. S’ha escollit MET Norway per mantenir una integració sense clau que no depengui d’aquesta restricció en un lloc públic de recerca i marques. Les [condicions de MET Norway](https://api.met.no/doc/TermsOfService) permeten identificar les peticions JavaScript simples amb la capçalera Origin que envia el navegador. No s’envien claus ni cap dada de l’usuari; només les coordenades públiques de l’estació.

## Actualització i errors

- Consulta en entrar a una estació i cada 12 minuts mentre la pàgina és visible.
- Nova consulta en tornar a una pestanya visible; es respecta la memòria cau HTTP/Expires del proveïdor.
- Una mateixa estació no es torna a consultar en cada canvi de filtre si la consulta és recent.
- Canviar d’estació o sortir de la vista avorta la petició anterior i invalida la seva resposta.
- Temps d’espera de 10 segons i botó de reintent.
- Memòria cau opcional de sessió, separada de les desades, amb un màxim de sis hores.
- En fallar la xarxa, la dada en memòria es marca «Última previsió disponible» i inclou data/hora. Si ja és massa antiga, la temperatura s’amaga i es mostra la indisponibilitat; mai es substitueix per zero.
- Una hora vàlida de més de 90 minuts o un model de més de 12 hores es considera antic. Una hora de més de sis hores o un model de més de 24 hores s’exclou.

## Verificació

`node --test tests/weather-model.test.cjs` cobreix selecció temporal, valors absents, unitats, timestamps, antiguitat, coordenades de tots dos hemisferis, fus horari i correspondència amb totes les estacions publicades.

La prova de navegador comprova la consulta real amb CORS des de la preview local, fallada de xarxa sense valor inventat, memòria marcada com a antiga després d’una fallada i resposta endarrerida de l’estació anterior. Evidència datada a `../olaf-zermatt/weather/verification.json`, dins de la carpeta de lliuraments.
