# OLAF — Sistema d’interfície

Visor de referències publicitàries d’Instagram per a un equip de màrqueting. Mode d’ús: consultar, comparar i guardar. El contingut és l’evidència; la interfície n’organitza l’accés i no n’afegeix afirmacions.

## Identitat preservada

- Inter autohostat, text grafit `#20292d`, gris neu `#edf0f1`, accent blau pissarra `#6085a3`.
- Text secundari dels controls `#435967`, focus `#244f6d`, superfície de controls `#f4f6f7`.
- Fotografies reals de context amb degradats progressius. No es presenten com evidències noves. En mòbil es reforça la superfície clara per preservar la lectura.
- Pàgina contínua, sense contenidors decoratius per a cada paràgraf. Graella de col·leccions i directori de marques, espaiat generós entre tasques, agrupació estreta entre un control i la seva etiqueta.
- Tipografia de consulta: cos 16px, controls 14px, suport 12–14px. Títols 34–56px segons context. Els menús d’estació mantenen opcions de 14px.

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
- Controls amb objectiu còmode de 44px; contorns de focus contrastats, selecció subratllada i indicació textual de filtres actius. La preferència de moviment reduït desactiva paral·laxi i transicions.
- Errors de càrrega mantenen portada, explicació i font quan existeixen; una portada no simula un vídeo. Mapa amb OpenFreeMap i recuperació textual si no està disponible.
- Desar o eliminar només es confirma després d’escriure al navegador. Una eliminació té opció de desfer.

## Límits de les afirmacions

La interfície no pressuposa contractes, publicitat de pagament ni arxiu anual de Stories desaparegudes. Es mantenen els textos originals, l’autoria, les limitacions de cobertura i les fonts. Els vídeos conserven controls natius i una explicació textual de la peça; no s’han inventat subtítols ni transcripcions del seu àudio. La validació automatitzada no es presenta com una certificació WCAG completa.
