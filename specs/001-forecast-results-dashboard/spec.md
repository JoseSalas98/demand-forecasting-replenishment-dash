# Feature Specification: Frontend de resultados del pronóstico de reposición

**Feature Branch**: `001-forecast-results-dashboard`

**Created**: 2026-11-13

**Status**: Draft (actualizada 2026-11-13: hallazgos del plan; universo 3.049 / 517, bandas y
histograma, según la constitución 1.0.0)

**Input**: User description: "Especificación — Frontend de resultados del pronóstico de reposición, v0
(borrador aprobado, 2026-11-13): que la gerencia regional y la de operaciones vean cuánto habría que
reponer de cada uno de los 517 artículos pronosticados por bloque de 28 días y cuánto cuesta en
dinero equivocarse, comparando el modelo (CatBoost global) con no hacer nada (seasonal naive) sobre
el año de test. RMV: embudo y dinero en juego, segmentación, historia, pronóstico e impacto."

## Contexto

**Propósito.** Que la gerencia regional y la de operaciones vean cuánto habría que reponer de cada
artículo pronosticado por bloque de 28 días, y cuánto cuesta en dinero equivocarse. La comparación
es entre el modelo (CatBoost global) y no hacer nada (seasonal naive: repetir el año anterior),
sobre el año de test.

**Usuarios.** El gerente regional y el gerente de operaciones. Ambos tienen las mismas vistas y los
mismos permisos (el sitio es público y de solo lectura).

**Preguntas de negocio que responde.**

1. ¿Qué artículos me dan ingreso y cuáles me dan estabilidad? (segmentación ABC × XYZ)
2. ¿Cómo se ha comportado este artículo? (unidades, dinero y variabilidad en el tiempo)
3. ¿Cuánto pido? (pronóstico por bloque; el colchón por artículo no está construido, ver Assumptions)
4. ¿Cuánto me cuesta equivocarme? (venta perdida y exceso en anaquel frente a la línea base)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Embudo y dinero en juego (Priority: P1)

El gerente abre el sitio y ve, de un vistazo, cómo se llegó de las 30.490 series tienda × artículo
y los 3.049 artículos del catálogo a
los 517 pronosticados, cuánto dinero (a precio de venta) representan esos 517 y dónde cae un
artículo concreto dentro del embudo. Es la puerta de entrada: responde "¿de qué estamos hablando y
cuánto vale?".

**Why this priority**: sin el embudo y el dinero en juego, el resto de las cifras no tiene escala ni
contexto. Además es la vista más simple y fija los dos universos: 3.049 descriptivos y 517
pronosticados.

**Independent Test**: se publica solo la vista de embudo; se verifica que termina en 517, que cada
etapa coincide con las salidas del proyecto de ciencia de datos y que el dinero total lleva el
rótulo "a precio de venta, no es margen".

**Acceptance Scenarios**:

1. **Given** el sitio publicado, **When** el gerente abre la vista de embudo, **Then** ve cada
   etapa con su conteo: 30.490 series → 3.049 artículos → 592 del segmento A → 517 pronosticados
   ("salen 75"), y el dinero en juego de los 517 (su % del gasto de train y la demanda del año de
   test) con el
   rótulo "a precio de venta, no es margen".
2. **Given** el selector de artículo (módulo Artículo, al que se llega desde el panel lateral),
   **When** el gerente busca uno de los 517 por su identificador, **Then** su ficha dice que tiene
   pronóstico, con su segmento.
3. **Given** el selector de artículo con el filtro "Pronóstico" apagado, **When** el gerente busca
   un artículo del catálogo que no está entre los 517,
   **Then** puede abrir su ficha descriptiva (segmentación e historia), que dice "Este artículo no
   entró al pronóstico" con enlace al embudo, sin pronóstico ni métricas.

---

### User Story 2 - Segmentación (Priority: P1)

El gerente ve los 3.049 artículos del catálogo en la matriz ABC × XYZ (9 celdas), compara las
celdas con un radar de perfiles y, junto al radar, una tarjeta contigua con la mediana normalizada
de cada variable y su valor crudo; ve el embudo que lleva de la matriz a los 517 pronosticados
(AX, AY, AZ) y entra al detalle de un segmento para ver sus artículos y ubicar uno.

**Why this priority**: responde la primera pregunta de negocio (ingreso frente a estabilidad) y es
el camino natural para llegar a un artículo.

**Independent Test**: se publica la vista de segmentación; se verifica que los conteos de la matriz
suman 2.887 (los 3.049 menos los 162 sin clase XYZ), que los artículos con pronóstico suman 517 y que cada artículo aparece en una sola
celda, igual que en la salida de segmentación del proyecto de datos.

**Acceptance Scenarios**:

1. **Given** la vista de segmentación, **When** el gerente la abre, **Then** ve la matriz ABC × XYZ
   con el conteo de artículos por celda de los 2.887 con clase XYZ (los 162 sin clase XYZ no
   entran a la matriz) y su dinero a precio de venta, y el embudo
   hasta los 517 pronosticados (191 + 229 + 97).
2. **Given** la matriz, **When** el gerente selecciona una celda, **Then** el radar y la tarjeta
   contigua se filtran a esa celda: la tarjeta muestra la mediana normalizada de cada variable y,
   al pasar el cursor, su valor crudo, cada uno rotulado.
3. **Given** un segmento AX, AY o AZ, **When** el gerente entra a su detalle, **Then** ve la lista de sus
   artículos, ordenable por dinero y por variabilidad, y puede abrir cualquiera.
4. **Given** el detalle de un artículo, **When** el gerente lo mira, **Then** ve a qué celda
   pertenece y su posición dentro de ella.

---

### User Story 3 - Historia del artículo (Priority: P2)

El gerente elige cualquiera de los 3.049 artículos (escribiendo su identificador o desplegando la
lista; el filtro "Pronóstico" limita la lista a los 517) y ve su venta por bloque de 28 días en
unidades y en dinero, sus bandas de variabilidad (media ± 3σ de las unidades por bloque), el
histograma de sus unidades por bloque y su coeficiente de variación.

**Why this priority**: responde "¿cómo se ha comportado este artículo?" y da contexto al pronóstico,
pero el pronóstico y el impacto son los que llevan a decisión.

**Independent Test**: para una muestra de artículos (dentro y fuera de los 517), las unidades, el
dinero de la venta observada por bloque y el coeficiente de variación de la segmentación coinciden
con las salidas del proyecto de ciencia de datos; la media, la σ, las bandas y el histograma
coinciden con un recálculo independiente sobre esas mismas unidades por bloque.

**Acceptance Scenarios**:

1. **Given** un artículo del catálogo, **When** el gerente abre su historia, **Then** ve las unidades
   observadas (y las completadas, si es de los 517) y el dinero de la venta observada por bloque de
   28 días, desde su
   primer bloque con venta hasta el bloque 65 (día 1.941); antes de ese bloque la serie del
   artículo no existe y no se muestra. La venta completada se muestra solo en unidades: no tiene
   dinero en las salidas del modelo.
2. **Given** la historia de un artículo, **When** se muestran la venta observada y la venta
   completada por quiebres de stock, **Then** cada una lleva su rótulo y nunca se suman.
3. **Given** la historia de un artículo, **When** el gerente la mira, **Then** ve su coeficiente de
   variación de train y el ratio de cada bloque frente al anterior.
4. **Given** un bloque sin dato, **When** se muestra, **Then** aparece "no disponible", nunca cero.
5. **Given** la historia de un artículo, **When** el gerente la mira, **Then** ve las bandas de
   media ± 3σ sobre la serie de unidades y el histograma de sus unidades por bloque, rotulados como
   descriptivos.
6. **Given** el selector de artículo, **When** el gerente activa el filtro "Pronóstico", **Then** la
   lista muestra solo los 517; sin el filtro muestra los 3.049.

---

### User Story 4 - Pronóstico frente a línea base (Priority: P1)

El gerente ve, para un artículo, el pronóstico del año de test bloque a bloque frente a la línea
base (seasonal naive) y la venta real, en el escenario A (un paso) y en el B (encadenado de 13
bloques) por separado, con el error del modelo en cada uno (el error de la línea base existe solo
agregado por segmento y total, no por artículo). También ve el error global (WRMSSE) del modelo y de
la línea base.

**Why this priority**: responde "¿cuánto pido?" y demuestra que el modelo es mejor que no hacer nada;
es el núcleo del proyecto.

**Independent Test**: el WRMSSE mostrado coincide con el manifiesto del test (0,495; 0,748; 0,868) y,
para una muestra de artículos, el pronóstico por bloque coincide con las salidas del test.

**Acceptance Scenarios**:

1. **Given** un artículo de los 517, **When** el gerente abre su ficha, **Then** la sección de
   pronóstico aparece automáticamente con los 13 bloques de test (venta real, pronóstico del modelo
   y línea base) del escenario elegido; para un artículo fuera de los 517 no aparece.
2. **Given** la vista de pronóstico, **When** el gerente cambia de escenario A a B, **Then** todas
   las cifras cambian juntas y ninguna mezcla los dos escenarios; el escenario activo está rotulado.
3. **Given** la vista general de pronóstico, **When** el gerente la abre, **Then** ve el WRMSSE en
   unidades: 0,495 (CatBoost a un paso), 0,748 (encadenado) y 0,868 (seasonal naive).
4. **Given** un artículo, **When** el gerente mira el pronóstico, **Then** ve el pronóstico en
   unidades por bloque como referencia de cuánto pedir, y el z fijo con que se valoró su impacto;
   el sitio indica que el colchón y la cantidad a reponer por bloque no están construidos.
5. **Given** un artículo, **When** el gerente mira su error, **Then** ve RMSSE, WAPE y MAE del modelo
   en el escenario activo; el error de la línea base dice "no disponible por artículo" y enlaza al
   agregado de su segmento.
6. **Given** el artículo `HOUSEHOLD_1_366` o `HOUSEHOLD_1_427`, **When** se abre su pronóstico,
   **Then** el tramo de test son sus últimos 13 bloques (51–63 y 52–64), no 53–65.

---

### User Story 5 - Impacto en dinero (Priority: P2)

El gerente ve cuánto cuesta equivocarse: venta perdida y exceso en anaquel del modelo frente a la
línea base. Por artículo, con el z fijo. Por segmento y en total, puede mover el nivel de servicio
sobre las curvas ya calculadas y ver cómo cambian la venta perdida y el exceso. Además puede
reproducir el test bloque a bloque (playground) y ver cómo se acumulan en unidades la venta y el
pronóstico, con el impacto en dinero del año al final.

**Why this priority**: es lo que convierte el pronóstico en dinero y cierra la cuarta pregunta, pero
depende de que el pronóstico (historia 4) ya se entienda.

**Independent Test**: en el escenario A al 95 % de servicio el ahorro de exceso mostrado es 3,28 M
(77 %) y la venta recuperada con el mismo exceso es 0,91 M; la suma del impacto por artículo
coincide con el total de su escenario.

**Acceptance Scenarios**:

1. **Given** un artículo, **When** el gerente abre su impacto, **Then** ve su venta perdida y su
   exceso, del modelo y de la línea base, con el z fijo, rotulados "a precio de venta, no es margen".
2. **Given** la vista de impacto por segmento o total, **When** el gerente mueve el nivel de servicio,
   **Then** solo puede elegir entre los valores ya calculados (z de −1 a 3, paso 0,25) y las cifras
   se actualizan al valor elegido.
3. **Given** el escenario A y el 95 % de servicio en el total, **When** el gerente mira el ahorro,
   **Then** ve 3,28 M (77 %) de ahorro de exceso y 0,91 M de venta recuperada con el mismo exceso.
4. **Given** el playground, **When** el gerente avanza bloque a bloque por el tramo de test,
   **Then** ve, hasta ese bloque, la venta completada, el pronóstico del escenario activo y la línea
   base, por bloque y acumulados en unidades, sin mezclar escenarios; al llegar al último bloque ve
   el impacto en dinero del año del artículo (no existe impacto por bloque).
5. **Given** la vista de impacto por artículo, **When** el gerente intenta cambiar el nivel de
   servicio, **Then** no puede: el z por artículo es fijo (el del 95 % de servicio del total en su
   escenario) y el sitio lo dice.
6. **Given** el total del escenario A, **When** el gerente compara el ahorro de exceso al 95 %
   (3,28 M, de las curvas) con la suma del impacto por artículo (3,27 M, al z fijo), **Then** cada
   cifra lleva su propio rótulo y el sitio no las presenta como la misma.

---

### Edge Cases

- Un artículo del catálogo fuera de los 517: muestra segmentación e historia, y en lugar de
  pronóstico e impacto dice "Este artículo no entró al pronóstico" con enlace al embudo.
- Un identificador que no está en el catálogo de 3.049: se informa que no existe.
- Un artículo con un solo bloque con venta: σ y bandas "no disponible".
- Un bloque sin venta, sin pronóstico o sin impacto: se muestra "no disponible", nunca cero.
- Ratio con bloque anterior en cero unidades: el ratio se muestra "no disponible", no infinito.
- Un valor fuera de rango (unidades, ratio o dinero negativos) en las salidas del modelo: la
  exportación se detiene y lo registra con artículo, bloque y columna; el sitio no se actualiza.
- Falta una tabla o su manifiesto, o el hash de la segmentación no coincide: la exportación falla
  completa; nunca se publica una versión parcial.
- El gerente pide un nivel de servicio por artículo o un bloque posterior al día 1.941: no está
  disponible y el sitio lo dice.

## Requirements *(mandatory)*

### Functional Requirements

**Universo y datos**

- **FR-001**: Cada artículo es la suma de sus 10 tiendas. Las vistas descriptivas (segmentación e
  historia) MUST cubrir los 3.049 artículos del catálogo; pronóstico e impacto MUST cubrir solo los
  517 AX/AY/AZ modelados. Un artículo fuera de los 517 MUST NOT mostrar pronóstico ni métricas y
  muestra "Este artículo no entró al pronóstico" con enlace al embudo.
- **FR-002**: Todas las cifras MUST contarse en bloques de 28 días; el ratio es unidades del bloque
  ÷ unidades del bloque anterior.
- **FR-003**: Toda cifra MUST provenir de las salidas del proyecto de ciencia de datos; nunca se
  recalcula segmentación, pronóstico ni impacto. Solo se calculan agregados descriptivos de la
  venta: venta por bloque, media, σ, bandas, CV descriptivo e histograma. La matriz ABC × XYZ de los
  3.049 y los perfiles del radar se leen del proyecto de datos.
- **FR-004**: Los datos que muestra el sitio MUST quedar fijados en una versión exportada, con la
  fecha y el origen de cada salida leída, consultables desde el sitio.

**Embudo**

- **FR-005**: El sitio MUST mostrar el embudo con las etapas que existen en las salidas del modelo:
  30.490 series → 3.049 artículos → 592 del segmento A (AX 207, AY 251, AZ 134) → 517
  pronosticados (AX 191, AY 229, AZ 97), con la salida de 75 artículos entre las dos últimas. Las
  etapas intermedias del informe (2.886 y 590) no se muestran porque no están en ninguna salida con
  manifiesto.
- **FR-005b**: El sitio MUST mostrar el dinero en juego de los 517 como dos cifras rotuladas por
  separado: su % del gasto de train (≈ 52,2 %) y la demanda del año de test (21,86 M US$).
- **FR-006**: Los usuarios MUST poder elegir cualquiera de los 3.049 artículos escribiendo su
  identificador o desplegando la lista, con un filtro "Pronóstico" que limita la lista a los 517, e
  ir a su ficha.

**Segmentación**

- **FR-007**: El sitio MUST mostrar la matriz ABC × XYZ de los artículos con clase XYZ (2.887; los
  162 sin clase XYZ no se incluyen), con conteo y dinero por celda, el radar con los perfiles por
  celda, una tarjeta contigua al radar con la mediana normalizada de cada variable y su valor crudo
  (mediana sin normalizar), y el embudo hasta los 517. Los segmentos AX, AY y
  AZ mantienen su comparación (conteo, dinero, distribución del CV de train) y su detalle con sus
  artículos.
- **FR-008**: Cada uno de los 2.887 artículos con clase XYZ MUST pertenecer a una sola celda de la
  matriz, la de la salida de segmentación del proyecto de datos; para los 517, la de la
  segmentación congelada. Los 162 sin clase XYZ no tienen celda en la matriz.

**Historia**

- **FR-009**: Para cada uno de los 3.049 artículos, el sitio MUST mostrar por bloque, desde su
  primer bloque con venta hasta el bloque 65 (antes la serie no existe y no se muestra), las
  unidades observadas y el dinero de la venta observada; para los 517, también las unidades
  completadas (sin dinero). La tarjeta de coeficiente de variación muestra el **CV descriptivo**
  (σ ÷ media de los bloques desde el lanzamiento), rotulado; si existe el CV de train de la
  segmentación, aparece aparte con su propio rótulo.
- **FR-009b**: Para cada artículo, el sitio MUST mostrar las bandas de variabilidad (media ± 3σ de
  las unidades por bloque, sobre su rango con datos) y el histograma de sus unidades por bloque,
  rotulados como descriptivos.
- **FR-010**: La venta observada y la venta completada por quiebres de stock MUST rotularse siempre
  y nunca sumarse.

**Pronóstico**

- **FR-011**: Para cada artículo de los 517, la ficha MUST mostrar automáticamente sus 13 bloques de test (sus últimos 13: 53–65
  para 515 artículos; 51–63 y 52–64 para dos) con venta completada, pronóstico del modelo y línea
  base, y el error del modelo (RMSSE, WAPE, MAE) por escenario. El error de la línea base se muestra
  solo agregado por segmento y total; por artículo dice "no disponible por artículo".
- **FR-012**: Los escenarios A y B MUST mostrarse por separado; ninguna cifra los mezcla y el
  escenario activo siempre está rotulado.
- **FR-013**: El sitio MUST mostrar el WRMSSE en unidades del modelo a un paso, encadenado y de la
  línea base, tal como en el manifiesto del test.
- **FR-014**: Para cada artículo, el sitio MUST mostrar el pronóstico en unidades por bloque de test
  (A y B por separado) y el z fijo de su escenario, e indicar que el colchón y la cantidad a reponer
  por bloque no están construidos en las salidas del modelo.

**Impacto**

- **FR-015**: Para cada artículo, el sitio MUST mostrar venta perdida y exceso, del modelo y de la
  línea base, con el z fijo, y el ahorro frente a no hacer nada (total, en venta perdida y en
  exceso); cuando el ahorro es negativo, dice "el modelo cuesta X más que repetir el año anterior".
  El nivel de servicio por artículo no se puede mover. El z fijo es uno
  por escenario, el del 95 % de servicio del total (A: modelo −0,012, línea base 0,711; B: modelo
  0,568, línea base 0,711).
- **FR-016**: Por segmento y en total, los usuarios MUST poder mover el nivel de servicio solo entre
  los valores ya calculados (z de −1 a 3, paso 0,25).
- **FR-017**: El sitio MUST mostrar el ahorro de exceso y la venta recuperada del modelo frente a la
  línea base, por escenario, tomados de las lecturas a z95 de las curvas; MUST rotularlos distinto
  de la suma del impacto por artículo al z fijo.
- **FR-018**: Los usuarios MUST poder reproducir el tramo de test bloque a bloque (playground) y ver
  venta completada, pronóstico y línea base por bloque y acumulados en unidades hasta el bloque
  elegido, y el impacto en dinero del año del artículo al final. No hay impacto por bloque.

**Rótulos y errores**

- **FR-019**: Toda cifra de dinero MUST llevar el rótulo "a precio de venta, no es margen".
- **FR-020**: Un dato ausente MUST mostrarse como "no disponible", nunca como cero ni en blanco.
- **FR-021**: Si falta una salida, su manifiesto, o un hash no coincide, o hay un valor fuera de rango,
  la actualización de datos MUST detenerse por completo y registrar la causa (artículo, bloque y
  columna cuando aplique); nunca se publica una versión parcial.

**Publicación**

- **FR-022**: El sitio MUST ser público, de solo lectura, sin inicio de sesión, y su tamaño total
  publicado MUST NOT superar 1 GB.

### Key Entities *(include if feature involves data)*

- **Artículo**: uno de los 3.049 del catálogo (suma de 10 tiendas). Atributos: identificador,
  celda ABC × XYZ, perfil del radar, si está entre los 517; para los 517, además, coeficiente de
  variación de train y z fijo.
- **Celda de la matriz**: una de las 9 combinaciones ABC × XYZ; conteo, dinero y perfil de radar
  (leídos del proyecto de datos).
- **Estadísticos descriptivos**: por artículo, media y σ de unidades por bloque, bandas ± 3σ,
  CV descriptivo e histograma (calculados en la exportación).
- **Segmento**: AX, AY o AZ (ABC × XYZ). Agrupa artículos; tiene conteo, dinero y curvas de impacto
  por nivel de servicio.
- **Etapa del embudo**: una de 4 etapas (30.490 series, 3.049 artículos, 592 segmento A, 517
  pronosticados), con su conteo.
- **Bloque**: periodo de 28 días numerado globalmente (bloque 65 = días 1.914–1.941); la historia
  de cada artículo va desde su primer bloque con venta hasta el 65 (los datos cubren los bloques
  2–65); el tramo de test son los últimos 13 bloques de cada artículo.
- **Venta por bloque**: de un artículo en un bloque; versión observada (unidades y dinero) o
  completada por quiebres (solo unidades), nunca combinadas.
- **Pronóstico de test**: por artículo, bloque y escenario (A o B): pronóstico del modelo, línea
  base y venta completada. El error del modelo es por artículo y escenario; el de la línea base,
  solo por segmento y total.
- **Métrica global de error**: WRMSSE en unidades por modelo y escenario.
- **Impacto**: venta perdida, exceso, ahorro y venta recuperada, a precio de venta; por artículo con z
  fijo, y por segmento y total como curva sobre z de −1 a 3.
- **Manifiesto**: registro de origen y fecha de cada salida leída; fija la versión de los datos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Las cinco capacidades del RMV (embudo, segmentación, historia, pronóstico, impacto)
  están publicadas y accesibles en el sitio público.
- **SC-002**: El 100 % de las cifras verificadas coincide con las salidas del proyecto de ciencia
  de datos; en particular, el WRMSSE muestra 0,495, 0,748 y 0,868.
- **SC-003**: En el escenario A al 95 % de servicio, el sitio muestra 3,28 M (77 %) de ahorro de
  exceso y 0,91 M de venta recuperada con el mismo exceso.
- **SC-004**: Los conteos de la matriz ABC × XYZ suman 2.887 (3.049 menos 162 sin clase XYZ); los artículos con pronóstico suman
  517 (191 + 229 + 97); el embudo muestra 30.490 → 3.049 → 592 → 517.
- **SC-005**: La suma del impacto por artículo coincide con el total de su escenario con una
  diferencia de 0,01 US$ o menos (A: 3,27 M; B: 1,01 M).
- **SC-006**: El 100 % de las cifras de dinero llevan el rótulo "a precio de venta, no es margen" y
  ninguna pantalla muestra una cifra que combine los escenarios A y B.
- **SC-007**: Un gerente llega desde la portada al pronóstico e impacto de un artículo cualquiera en
  menos de 30 segundos y en no más de 3 interacciones.
- **SC-008**: Cada vista carga en menos de 3 segundos con una conexión de oficina normal, medido en
  el sitio publicado para la portada y la ficha de un artículo.

## Assumptions

- **Plazo y recursos.** Objetivo 2026-11-14, lo antes posible; una persona dirige a la IA y no
  invierte tiempo en aprender frontend, así que se prefiere lo simple sobre lo pulido.
- **Datos.** Llegan hasta el día 1.941. Solo existe el pronóstico de test; no hay pronóstico hacia
  adelante. Pronóstico e impacto existen por artículo (suma de 10 tiendas), no por tienda ni región.
  El impacto por artículo existe con un z fijo; las curvas con z variable existen solo por segmento y
  total. Las salidas del modelo no están en Git: la copia exportada es la referencia.
- **Publicación.** GitHub Pages gratuito: repositorio público, solo contenido estático, tope de 1 GB.
  No hay datos sensibles que proteger con inicio de sesión.
- **Idioma.** La interfaz está en español, con números en formato es (coma decimal, punto de miles).
- **Playground.** Reproduce el test por artículo con las cifras por bloque que existen (venta
  completada, pronóstico A, pronóstico B, línea base). El impacto en dinero existe solo para el año
  completo, así que aparece al final y no bloque a bloque.
- **Verificaciones contra las salidas del modelo** (resueltas el 2026-11-13; detalle en
  [research.md](research.md)):
  1. **z de `item_impact`**: uno por escenario, igual al del 95 % de servicio del total (R1).
  2. **Tramo de test**: los últimos 13 bloques de cada artículo; 53–65 salvo `HOUSEHOLD_1_366`
     (51–63) y `HOUSEHOLD_1_427` (52–64) (R2).
  3. **Embudo intermedio**: 2.886 y 590 solo están en el informe, no en una salida con manifiesto;
     no se muestran (R3).
  4. **Cuadre del impacto**: exacto (≤ 5·10⁻¹⁰ US$); tolerancia de SC-005 fijada en 0,01 US$. El
     titular de 3,28 M sale de las curvas, no de la suma por artículo (R4).
  5. **Observada vs completada**: observada = `item_units` por bloque; completada =
     `boosting_data.units`, que es también la venta real del test (R5).
  6. **`item_spend`**: confirmado como unidades × precio de venta (R6).
  7. **Colchón y cantidad a reponer**: no existen en las salidas; no se muestran (R7).
- **Desvíos frente al borrador v0** (por la regla "lo que no esté construido no se incluye"):
  embudo sin 2.886 ni 590 (FR-005); sin colchón ni cantidad a reponer (FR-014); playground sin
  impacto por bloque (FR-018); error de la línea base solo agregado (FR-011); venta completada sin
  dinero (FR-009). Si el proyecto de datos llega a construir alguno, se agrega sin cambiar el
  diseño.
- **No-objetivos.** Pronóstico o impacto por tienda o región; pronóstico o impacto de artículos fuera
  de los 517; gerentes de
  tienda como usuarios; pronóstico después del día 1.941; reentrenar o recalcular segmentación,
  pronóstico o impacto; mapas.
- **Después (fuera de esta iteración).** Pronóstico por tienda y región (nuevo trabajo de ciencia de
  datos); pronóstico de artículos fuera de la segmentación objetivo; gerentes de tienda como
  usuarios; simulaciones que exijan reentrenar.
- **Pendientes de resolver.**
  1. ~~Matriz y radar en el proyecto de datos~~ resuelto (2026-11-14): `segmentation_items` y
     `radar_profiles` congelados en el nb 03 (Etapa 10b).
  2. ~~CV de la ficha~~ resuelto: se muestra el CV descriptivo (σ ÷ media desde el lanzamiento),
     rotulado; el CV de segmentación aparece aparte y rotulado.
  3. ~~Rango de las bandas~~ resuelto: desde el lanzamiento (primer bloque con venta).
- **Mockups.** Las cifras de `diseno/pantalla_*.png` son ejemplos: no son dato ni valor esperado.
