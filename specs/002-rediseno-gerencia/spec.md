# Feature Specification: Rediseño del tablero para gerencia

**Feature Branch**: `002-rediseno-gerencia`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Rediseño del dash para gerencia a partir del mockup aprobado por el usuario. Insumos: `cambios_dash_ddr.md` (cambios por sección, fuentes de datos y cifras de control) y `mockup_dash_ddr.html` (referencia visual y de comportamiento). Lenguaje de gerencia con detalle técnico accesible por botones ⓘ; nombres de segmentos; Inicio solo bienvenida; Segmentos con burbujas, radar, barras con ayuda, embudo y página de detalle; Artículo con pronóstico y línea base, etiqueta de datos, acercamiento al año de prueba y página de detalle del ahorro; Impacto con dos palancas, barras de escala fija y detalle desplegable; Cómo usar con glosario en tabla; solo escenario A sin mencionar el método; etiqueta de dinero global; vocabulario nuevo. Respeta la constitución 2.0.0."

Documentos de apoyo en esta carpeta: `cambios_dash_ddr.md` (detalle por sección, fuentes de datos, cálculos y cifras de control) y `mockup_dash_ddr.html` (referencia visual aprobada). Ante un conflicto de diseño manda el mockup; ante un conflicto de datos, esta especificación y la constitución.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entender cuánto vale el pronóstico en dinero (Priority: P1)

Un gerente entra a Impacto, elige qué porcentaje de la demanda quiere atender y entiende, sin conocer términos técnicos, cuánto capital libera el pronóstico frente a la línea base y cuántas ventas recuperaría si mantuviera el mismo inventario. Si quiere ver el cálculo, lo despliega en la misma tarjeta y lo sigue mientras mueve el control.

**Why this priority**: es la respuesta de negocio del proyecto; la versión actual se lee mal (barras que no se mueven, cifras que parecen contradecirse).

**Independent Test**: abrir Impacto, mover el control entre 90 % y 99 % y comprobar que las dos cifras, las barras y la curva desplegada cambian de forma coherente, y que al 95 % coinciden con las cifras oficiales.

**Acceptance Scenarios**:

1. **Given** Impacto al 95 %, **When** se lee la tarjeta "Liberar capital", **Then** muestra 3,28 M US$ menos de mercancía sobrante (−77 %), con la línea base en 4,23 M US$ y el pronóstico en 0,95 M US$, y las dos estrategias con las mismas ventas perdidas.
2. **Given** Impacto al 95 %, **When** se lee la tarjeta "Recuperar ventas", **Then** muestra 0,91 M US$ en ventas recuperadas y que el pronóstico atendería el 99,2 % de la demanda con el mismo sobrante.
3. **Given** cualquier porcentaje, **When** se mueve el control, **Then** las barras de la línea base y del pronóstico se mueven sobre una escala fija.
4. **Given** el detalle del cálculo desplegado, **When** se mueve el control, **Then** la curva, sus dos puntos y el z se actualizan sin salir de la página.
5. **Given** cualquier porcentaje, **When** se lee "¿Dónde está el capital liberado?", **Then** las cifras de los tres grupos suman exactamente el total.

---

### User Story 2 - Reconocer los segmentos del catálogo (Priority: P2)

Un gerente entra a Segmentos y entiende cómo se reparte el catálogo con nombres que se explican solos (Vitales, Útiles, Complementarios × continuos, recurrentes, ocasionales). Al pasar el cursor lee la definición de cada familia y grupo; al elegir un grupo ve su descripción, su radar frente a los tres grupos Vitales y sus barras frente al artículo típico, cada una con su ayuda. Si quiere el detalle técnico, abre una página con los errores por grupo y la lista de artículos.

**Why this priority**: la segmentación es el punto de entrada del recorrido y define el vocabulario del resto del tablero.

**Independent Test**: abrir Segmentos, recorrer las nueve burbujas y el detalle sin usar ninguna otra sección.

**Acceptance Scenarios**:

1. **Given** Segmentos, **When** se pasa el cursor sobre una familia o una burbuja, **Then** aparece su definición en lenguaje sencillo.
2. **Given** una burbuja elegida, **When** se pasa el cursor por un eje del radar, **Then** un recuadro muestra el valor real de esa variable para cada grupo visible y para el artículo típico.
3. **Given** el selector de tamaño, **When** se cambia entre venta y número de artículos, **Then** las burbujas se reacomodan y la frase explica que pocos artículos hacen la mayor parte de la venta.
4. **Given** el embudo, **When** se lee, **Then** muestra 30.490 → 3.049 → 592 → 517 y, al lado, el 52 % de la venta cubierta, los 21,86 M US$ en juego y los 75 Vitales sin pronóstico con su motivo.
5. **Given** el botón ⓘ, **When** se pulsa, **Then** abre la página de detalle con la tabla comparativa de errores y la lista ordenable de todos los artículos del grupo.

---

### User Story 3 - Revisar un artículo y justificar su ahorro (Priority: P3)

Un gerente busca un artículo, ve en una gráfica su venta, el pronóstico y la línea base del año de prueba, lee en una frase qué tan bien se pronosticó y cuánto ahorra. Si alguien pregunta de dónde sale el ahorro, abre el detalle y muestra la tabla que lo calcula, el error y los datos por periodo, que puede exportar.

**Why this priority**: baja la conversación al artículo concreto y justifica las cifras de Impacto.

**Independent Test**: abrir un artículo pronosticado, pasar el cursor por la gráfica, acercarse al año de prueba y abrir el detalle.

**Acceptance Scenarios**:

1. **Given** un artículo pronosticado, **When** se abre, **Then** la gráfica muestra por defecto lo vendido, la venta sin faltantes, el pronóstico y la línea base, cada uno con su color y el pronóstico y la línea base con marcadores.
2. **Given** la gráfica, **When** se pasa el cursor, **Then** aparece la fecha de inicio del periodo y las unidades de cada línea visible.
3. **Given** FOODS_3_090, **When** se abre "Ver el cálculo", **Then** la tabla muestra costo total 128.579 US$ (línea base) frente a 14.042 US$ (pronóstico) y ahorro de 114.537 US$.
4. **Given** un artículo fuera de los 517, **When** se abre, **Then** muestra su historia y "Este artículo no entró al pronóstico", sin cifras de pronóstico, error ni impacto.

---

### User Story 4 - Aprender a usar el tablero (Priority: P4)

Un usuario nuevo abre "Cómo usar" y entiende para qué sirve el tablero, qué hace cada sección y qué significa cada término, con su nombre técnico al lado.

**Why this priority**: acompaña a las demás historias; sin ella el tablero sigue funcionando.

**Independent Test**: abrir "Cómo usar", leer las cuatro tarjetas de secciones y buscar un término en el glosario.

**Acceptance Scenarios**:

1. **Given** "Cómo usar", **When** se escribe "sobrante" en el buscador, **Then** la tabla muestra solo las filas que contienen esa palabra y oculta los temas vacíos.
2. **Given** las tarjetas de secciones, **When** se pulsa "Ir a …", **Then** abre esa sección.

---

### Edge Cases

- Un artículo fuera de los 517 no muestra pronóstico, error ni impacto (constitución II.2).
- Los artículos con tramo de prueba distinto (HOUSEHOLD_1_366: 51–63; HOUSEHOLD_1_427: 52–64) usan su propio tramo; nunca se asume 53–65.
- Si un dato no existe en los archivos exportados, se muestra "no disponible", nunca cero (III.4).
- Un ahorro negativo de un artículo se muestra tal como viene, como costo adicional del pronóstico (III.3).
- Si el sistema del usuario pide reducir el movimiento, las burbujas no flotan.
- Si un porcentaje del control queda fuera de las curvas exportadas, la cifra se muestra como "no disponible".

## Requirements *(mandatory)*

### Functional Requirements

**Global**

- **FR-001**: El tablero MUST mostrar una sola etiqueta "Cifras a precio de venta · no es margen" visible en todas las pantallas y MUST NOT repetirla debajo de cada cifra (constitución II.4).
- **FR-002**: El tablero MUST mostrar solo los resultados del escenario A y MUST NOT mencionar el método de evaluación ni ofrecer selector de escenario.
- **FR-003**: El tablero MUST usar el vocabulario nuevo (mercancía sobrante, ventas perdidas por falta de producto, % de la demanda atendida, línea base, periodo de 4 semanas, año de prueba, venta sin faltantes) y los nombres de segmento "Familia + regularidad" definidos en `cambios_dash_ddr.md`.
- **FR-004**: Todo elemento pulsable MUST verse como botón (borde, fondo y flecha o ícono) y tener estado de foco visible.
- **FR-005**: Las cifras MUST seguir el formato de `cambios_dash_ddr.md`: totales en M US$ con dos decimales, tablas y fichas en mil US$ sin centavos, una sola escala por tabla.
- **FR-006**: El contenido MUST usar todo el ancho disponible de la pantalla.

**Inicio**

- **FR-010**: Inicio MUST ser solo una bienvenida con el nombre del proyecto, el contexto (tiendas y años) y un botón que lleve a Segmentos.

**Segmentos**

- **FR-020**: Segmentos MUST representar los nueve grupos como burbujas agrupadas en tres familias, con tamaño proporcional a la venta o al número de artículos según un selector.
- **FR-021**: Al pasar el cursor, cada familia y cada burbuja MUST mostrar su definición en lenguaje sencillo.
- **FR-022**: Elegir una burbuja MUST mostrar su descripción, un radar comparado con los tres grupos Vitales y el artículo típico, y barras frente al artículo típico.
- **FR-023**: El radar MUST mostrar, al pasar el cursor por un eje, un recuadro con el valor real de esa variable para cada grupo visible y para el artículo típico, sin marcadores fijos.
- **FR-024**: Cada barra MUST ofrecer una ayuda con la definición de la variable y su valor real en sus unidades.
- **FR-025**: El embudo MUST mostrarse como gráfico, con las cifras de venta cubierta, demanda en juego y Vitales sin pronóstico a su lado.
- **FR-026**: Un botón ⓘ MUST abrir una página de detalle con la tabla comparativa de errores de los tres grupos pronosticados y la lista ordenable de todos sus artículos.

**Artículo**

- **FR-030**: La ficha MUST abrir con un artículo por defecto y permitir buscar en el catálogo.
- **FR-031**: La gráfica MUST mostrar por defecto lo vendido, la venta sin faltantes, el pronóstico y la línea base, con colores distintos, marcadores en pronóstico y línea base, y leyenda que funcione como interruptor.
- **FR-032**: La gráfica MUST ofrecer una etiqueta de datos al pasar el cursor (fecha y unidades de cada línea) y un selector entre toda la historia y el año de prueba.
- **FR-033**: La ficha MUST resumir en una frase el acierto del pronóstico y mostrar el ahorro del artículo (menos sobrante, más ventas perdidas y ahorro neto).
- **FR-034**: Un botón ⓘ MUST abrir una página de detalle con la tabla del cálculo del ahorro (unidades pronosticadas, error, colchón, sobrante, ventas perdidas, costo total y diferencia), las métricas de error, el histograma, la venta en dinero y la tabla por periodo con exportación a CSV.
- **FR-035**: La tabla de historia por periodo y la tabla "¿Cuánto pido?" MUST salir de la ficha principal.

**Impacto**

- **FR-040**: Impacto MUST permitir elegir el % de la demanda atendida entre 90 % y 99 % en pasos de 0,5.
- **FR-041**: Impacto MUST mostrar las dos maneras de aprovechar el pronóstico, liberar capital (mismo servicio) y recuperar ventas (mismo sobrante), aclarando que no se suman.
- **FR-042**: Las barras de comparación MUST usar escalas fijas para que la línea base también se mueva.
- **FR-043**: El detalle del cálculo MUST desplegarse en la misma tarjeta y actualizarse con el control.
- **FR-044**: El desglose por grupo MUST sumar exactamente el total del % elegido.
- **FR-045**: Las cifras de concentración del ahorro MUST mostrarse en una franja compacta, y el top 10 MUST ordenarse por ahorro neto.
- **FR-046**: Al 95 %, las cifras principales MUST coincidir con las cifras oficiales del manifiesto; en otros porcentajes, las lecturas interpoladas MUST rotularse como calculadas en el sitio dentro del detalle (constitución I.12).

**Cómo usar**

- **FR-050**: "Cómo usar" MUST explicar para qué sirve el tablero y para qué sirve cada sección, con pasos de uso y un botón a cada una.
- **FR-051**: El glosario MUST ser una tabla con término, significado en lenguaje sencillo y nombre técnico, agrupada por tema y con buscador.

**Diseño**

- **FR-060**: La guía visual y las pantallas de referencia del repositorio MUST actualizarse para reflejar este diseño (constitución VI).

### Key Entities

- **Grupo (segmento)**: combinación de familia (Vitales, Útiles, Complementarios) y regularidad (continuos, recurrentes, ocasionales); tiene número de artículos, venta y perfil frente al artículo típico.
- **Curva de impacto**: para cada colchón (17 valores), mercancía sobrante y ventas perdidas del pronóstico y de la línea base, por grupo.
- **Artículo**: serie por periodo (vendido, sin faltantes, pronóstico, línea base), métricas de error e impacto en dinero.
- **Término del glosario**: nombre, significado sencillo, nombre técnico y tema.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Todas las cifras de control de `cambios_dash_ddr.md` coinciden en pantalla (Impacto al 95 %, Vitales y FOODS_3_090).
- **SC-002**: Ninguna pantalla repite la etiqueta de dinero debajo de cifras ni menciona el escenario B o el método.
- **SC-003**: Desde cualquier sección, el detalle técnico está a un clic.
- **SC-004**: El desglose por grupo de Impacto suma el total en el 100 % de los porcentajes del control.
- **SC-005**: Un gerente sin formación técnica explica, tras recorrer Segmentos e Impacto, qué es un artículo vital y qué significa liberar capital (validación con el usuario).
- **SC-006**: Las pruebas automáticas existentes y las nuevas pasan en la integración continua.

## Assumptions

- Todas las cifras salen de los archivos ya exportados en `public/data`; no se modifica el exportador ni se reejecuta el modelo.
- Las lecturas derivadas (interpolación de curvas y WAPE de la línea base por artículo) se calculan en el sitio según la constitución 2.0.0, principio I.12.
- La página "Origen de los datos" se mantiene sin cambios de contenido.
- El recorrido guiado ("¿Qué quieres ver?") de la guía actual se reemplaza por las tarjetas de secciones con pasos de uso.
- La reproducción bloque a bloque ("playground") del año de prueba no figura en el mockup; se conserva sin cambios y se llega a ella desde la página de detalle del artículo, con el vocabulario nuevo y solo el escenario A.
