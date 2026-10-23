# Resum integrat al hero — 23 d’octubre de 2026

Refinament d’escriptori sobre `7b8e244`, executat per provar la petició de l’usuari: integrar «En un cop d’ull» al hero, començar directament amb la informació de les peces a sota i reforçar el contrast dels noms.

- El resum, els recomptes, el mapa i la meteorologia són dins de `stationHero`. La secció ha deixat d’ocupar espai en el contingut principal.
- Una franja amb degradat fosc protegeix la lectura al peu de la fotografia o el vídeo. La informació no té caixes individuals.
- El nom de cada estació té un halo fosc difús i ombra de text, sense un rectangle visible. La distribució deixa espai entre el nom i la informació inferior.
- Sota el menú hi ha els filtres i les activacions; s’ha reduït també el marge abans de les col·leccions de 76 a 32 px.
- «En un cop d’ull» torna al hero amb focus i scroll a l’inici. Marques es manté dins de `main`, amb un punt d’inserció independent del resum. El mapa, els controls del temps i el botó de pausa reben clics per sobre de les capes de fons.

Verificació: **49/49 proves unitàries**, **26 grups de comprovacions en Chromium i WebKit** a 1280 × 900, 1440 × 1000 i 1920 × 1080; fotografies, mapes i noms de **22 estacions**. Es comproven límits del resum dins del hero, absència de solapament amb el nom, absència de desbordament, accés directe als controls i col·leccions, selector, historial, anàlisi, fonts, persistència de desades i vídeo amb fotografia de reserva. Una revisió independent confirma Masella sobre neu, els controls i el retorn al hero en les tres mides.

Només escriptori. No s’han canviat corpus, textos originals de les peces, fonts ni identitats. Cap publicació: preview local al port 4330. Captures i JSON d’aquesta iteració a `outputs/olaf-hero-integrat`.

L’escàner de distribució deixa quatre avisos revisats: hero a sang i separadors alineats amb el contingut als filtres i al text original. Són tractaments de la composició existent; no s’ha afegit padding lateral per simular contenidors. Les comprovacions renderitzades no mostren text tallat, solapaments ni desbordament.
