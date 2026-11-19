# Feature Specification: Versión en inglés y artículo sin preselección

**Feature Branch**: `003-version-ingles`
**Created**: 2026-11-19
**Status**: Draft
**Input**: "Hagamos una versión en inglés y que en la página de inicio podamos escoger a través de un botón si todo va a ser en español o en inglés. La estructura va a ser exactamente la misma y el criterio también: lenguaje sencillo, inteligible y nada abstracto para el público no técnico o de negocio. En el módulo de artículos hay un artículo fijo: la sección debe quedar en blanco y mostrar solo el artículo que se seleccione. El selector de artículos pasa desapercibido: debe ser más notorio y sugerir que es una lista desplegable o un campo de búsqueda."

Decisiones confirmadas por el usuario (2026-11-19): grupos en inglés con el adjetivo delante
("Continuous vitals"); números y fechas en estilo de EE. UU.; botón ES | EN en Inicio y en la barra
superior, sin banderas, recordado en el navegador y con enlace `?lang=en`; en "Origen de los datos"
los detalles del exportador quedan como vienen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Leer todo el tablero en inglés (Priority: P1)

Un gerente que no lee español abre el tablero, elige English y recorre Inicio, Segmentos, Artículo,
Impacto y Cómo usar con las mismas pantallas, cifras y ayudas que la versión en español.

**Why this priority**: es el pedido principal; sin esto la versión en inglés no existe.

**Independent Test**: abrir cualquier ruta con `?lang=en` y comprobar que no queda texto de la
interfaz en español y que las cifras coinciden con las de la versión en español.

**Acceptance Scenarios**:

1. **Given** el tablero en español, **When** el usuario pulsa EN, **Then** todos los textos, ayudas,
   leyendas, tablas, glosario y formatos pasan a inglés sin cambiar de página ni de cifras.
2. **Given** el tablero en inglés, **When** el usuario lee una cifra de dinero, **Then** la ve en
   estilo de EE. UU. (US$3.28M, US$122K, 52%, May 25, 2015).
3. **Given** el tablero en inglés, **When** el usuario mira la barra superior, **Then** ve "Figures
   at retail price · not margin".

### User Story 2 - Elegir el idioma en Inicio y recordarlo (Priority: P1)

En Inicio hay un botón visible para elegir Español o English; la elección vale para todo el sitio y
se recuerda al volver. Desde cualquier página se puede cambiar con el botón ES | EN de la barra
superior.

**Independent Test**: elegir English en Inicio, navegar y recargar: sigue en inglés.

**Acceptance Scenarios**:

1. **Given** una primera visita, **When** se abre el sitio, **Then** está en español.
2. **Given** que el usuario eligió English, **When** recarga o vuelve otro día en el mismo navegador,
   **Then** el sitio abre en inglés.
3. **Given** un enlace con `?lang=en`, **When** alguien lo abre, **Then** ve esa página en inglés.

### User Story 3 - Artículo vacío hasta elegir uno, con buscador notorio (Priority: P2)

Al entrar a Artículo sin haber elegido uno, la página no muestra ningún artículo de ejemplo: muestra
un buscador grande y destacado, con lupa y flecha de lista desplegable, y un texto que invita a
elegir un artículo.

**Independent Test**: abrir `#/articulo` y comprobar que no hay gráfica ni cifras de un artículo, y
que el buscador abre la lista al hacer clic.

**Acceptance Scenarios**:

1. **Given** que no se eligió artículo, **When** se abre Artículo, **Then** se ve "Elige un
   artículo" con el buscador destacado y ninguna ficha.
2. **Given** el buscador, **When** el usuario hace clic en él o en la flecha, **Then** se despliega
   la lista de artículos; al escribir, se filtra.
3. **Given** un artículo elegido, **When** se ve su ficha, **Then** el buscador del encabezado
   también muestra la lupa y la flecha.

### Edge Cases

- El navegador no permite guardar datos: el idioma vale para la visita y no se rompe nada.
- `?lang=` con un valor desconocido: se ignora.
- El usuario cambia de idioma con un `?lang=en` en la dirección: manda su elección y el parámetro se
  quita de la dirección sin agregar historial.
- Textos que vienen escritos por el exportador (verificaciones): se muestran como vienen, con una
  nota en inglés que lo aclara.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Todo texto de la interfaz MUST existir en español y en inglés, con la misma estructura.
- **FR-002**: El inglés MUST seguir el mismo criterio de lenguaje sencillo y concreto para gerencia;
  los nombres técnicos quedan en el detalle y en la columna "Technical name" del glosario.
- **FR-003**: Vocabulario en inglés: Vital · Useful · Complementary; continuous · recurring ·
  occasional; grupos "Continuous vitals"; Excess stock; Sales lost to stockouts; % of demand served;
  Baseline; 4-week period; Test year; Actual sales; Sales without stockouts (estimated); Free up
  capital; Recover sales.
- **FR-004**: En inglés, números, dinero, porcentajes y fechas MUST usar el estilo de EE. UU.
- **FR-005**: Inicio MUST mostrar un botón para elegir Español o English; la barra superior MUST
  mostrar un botón ES | EN en todas las páginas. Sin banderas.
- **FR-006**: El idioma por defecto MUST ser español; la elección MUST recordarse en el navegador;
  `?lang=en` y `?lang=es` MUST abrir en ese idioma.
- **FR-007**: Cambiar de idioma MUST NOT cambiar de página, ni de artículo, ni de cifras.
- **FR-008**: La etiqueta de dinero global en inglés MUST ser "Figures at retail price · not margin".
- **FR-009**: Artículo sin artículo elegido MUST mostrar un estado vacío con buscador destacado; no
  MUST mostrar un artículo por defecto.
- **FR-010**: El buscador de artículos MUST mostrar una lupa y una flecha de lista desplegable; la
  flecha abre y cierra la lista.
- **FR-011**: Los detalles de las verificaciones que escribe el exportador MUST mostrarse tal como
  vienen; en inglés, una nota lo aclara.
- **FR-012**: El atributo de idioma de la página MUST coincidir con el idioma elegido.

### Key Entities

- **Idioma**: español o inglés; viene del enlace, de lo recordado o del valor por defecto.
- **Diccionario**: los textos de la interfaz en un idioma; los dos tienen las mismas claves.

## Success Criteria *(mandatory)*

- **SC-001**: En inglés, ninguna pantalla muestra texto de la interfaz en español (salvo los detalles
  del exportador en "Origen de los datos").
- **SC-002**: Las cifras de control de la feature 002 aparecen iguales en los dos idiomas, cada una en
  su formato (3,28 M US$ / US$3.28M; 0,91 M US$ / US$0.91M).
- **SC-003**: Cambiar de idioma toma un clic desde cualquier página.
- **SC-004**: Al abrir Artículo sin elegir uno, el primer elemento interactivo destacado es el
  buscador.

## Assumptions

- La documentación del repositorio y los comentarios del código siguen en español (constitución V.1).
- Las rutas internas (`#/segmentacion`, `#/articulo`) no se traducen: son direcciones, no texto.
- Los nombres de archivo del CSV exportado se traducen con el idioma.
