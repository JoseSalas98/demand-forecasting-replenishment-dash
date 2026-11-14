# Contrato: vistas del sitio (iteración 2: capa visual según la guía)

La navegación es por hash, que funciona en GitHub Pages sin configuración. Cada vista lee solo
los archivos de [export-schema.md](export-schema.md). Disposición, colores e interacción siguen
`diseno/guia_visual.md` y `diseno/pantalla_*.png` (constitución VI; sus cifras son ejemplos). En alcance y datos
manda `spec.md`.

## Estructura común

- **Panel lateral fijo** (alrededor del 17 % del ancho):
  - marca "DDR" y "Demand Driven Replenishment";
  - módulos Inicio, Segmentación, Artículo e Impacto, con íconos de línea; el módulo activo lleva
    fondo de tarjeta e ícono cian;
  - al pie, enlace "Origen de los datos" (`#/datos`).
- **Encabezado** de cada módulo: título, subtítulo en texto secundario y, a la derecha, las
  píldoras o selectores del módulo.
- **Contenido** en tarjetas: fondo `#142036`, borde `#25324B` y esquinas redondeadas.

| Ruta | Módulo | Historia | Lee | Muestra |
|---|---|---|---|---|
| `#/` | Inicio | US1 | `meta`, `catalog` | Red neuronal animada de fondo. Velo oscuro con título, subtítulo y tres cifras: 3.049 analizados, 517 con pronóstico y exceso evitado de A al 95 % con asterisco "manifiesto…". Botón "Explorar" que lleva a `#/segmentacion`. |
| `#/segmentacion` | Segmentación | US1, US2 | `segmentation`, `funnel`, `catalog` | Matriz 3 × 3 de los 2.887 con clase XYZ (nota: "162 sin clase XYZ no se incluyen"); el clic en una celda filtra el radar y la tarjeta. Radar AX/AY/AZ con mediana normalizada. Tarjeta contigua: mediana normalizada y, al pasar el cursor, el valor crudo. Embudo de 4 etapas y dinero en juego de los 517. Enlace "ver artículos" para AX, AY y AZ. |
| `#/segmentacion/:cell` | Segmentación | US2 | `segments`, `items` | Lista ordenable de los artículos de AX, AY o AZ: dinero, CV de train y ahorro por escenario |
| `#/articulo/:item_id?` | Artículo | US3, US4, US5 | `catalog`, `descriptive/<id>`, `items`, `series/<id>`, `meta` | Detalle en la tabla de abajo |
| `#/articulo/:item_id/playground` | Artículo | US5 | `items`, `series/<id>` | Avance bloque a bloque por el test, con acumulados en unidades e impacto del año al final |
| `#/impacto` | Impacto | US4, US5 | `meta`, `segments`, `items` | Píldoras A/B. Tarjetas: exceso evitado, venta recuperada, WRMSSE (con "línea base 0,868") y artículos (517). Curva de venta perdida frente a exceso, modelo y línea base, con selector Total/AX/AY/AZ. Deslizador de nivel de servicio. Barras de exceso evitado por segmento. Tabla de mayor contribución con z fijo. |
| `#/datos` | (pie del panel) | FR-004 | `meta` | Fuentes, fechas, hashes, versiones, verificaciones y **pendientes** |

Las rutas viejas `#/segmentos` y `#/segmentos/:cell` redirigen a `#/segmentacion…`.

## Artículo (`#/articulo/:item_id?`)

- **Encabezado**:
  - "Artículo · <id>". El subtítulo dice: celda (o "celda no disponible") · 10 tiendas · bloques
    de 28 días · bandas = media ± 3σ, más "CV de train (segmentación)" cuando existe.
  - A la derecha: el combobox "Buscar artículo…" y la píldora "Pronóstico" (cian cuando está
    activa; activa por defecto).
- **Combobox**:
  - Al escribir, filtra por subcadena del `item_id`, sin distinguir mayúsculas.
  - Al abrirlo vacío, muestra la lista completa del filtro activo: 517 o 3.049.
  - Se maneja con el teclado: flechas, Enter y Escape.
- **Sin artículo elegido**: mensaje para elegir uno, con el selector abierto.
- **"Unidades por bloque"**:
  - Venta observada en plateado, media en gris medio y ±3σ en pizarra. Si la banda inferior
    queda bajo 0, se dibuja en 0 con nota.
  - Si el artículo está entre los 517:
    - el tramo de test va sombreado, con rótulos "Train" y "Test (13 bloques)";
    - el modelo del escenario activo va en cian y la línea base en ciruela;
    - la venta completada va en plateado punteado, con su rótulo.
- **"Venta en dinero por bloque (a precio de venta)"**: venta observada en plateado.
- **Tarjetas de la derecha**:
  - **Si es de los 517**:
    - RMSSE · 1 paso (A) y RMSSE · cadena (B), cada una con "línea base: no disponible por
      artículo";
    - WAPE y MAE del escenario activo;
    - "Coeficiente de variación": CV descriptivo, media y σ.
  - **Si no es de los 517**: en el lugar de las métricas, "Este artículo no entró al pronóstico"
    con enlace a `#/segmentacion` (embudo). La tarjeta de CV se muestra igual.
- **"Distribución de unidades"**: histograma en pizarra.
- **Debajo** (solo para los 517, sin cambios funcionales respecto de la iteración 1):
  - tabla del test;
  - "¿Cuánto pido?" con z fijo;
  - impacto en dinero del artículo;
  - enlace al playground;
  - tabla de la historia por bloque en un desplegable.

## Reglas transversales de la interfaz

1. **Parámetros y escenario.** `?esc=A|B` (escenario, global, A por defecto) y `?pron=1|0`
   (filtro "Pronóstico" del selector de artículo: 1 = solo los 517, por defecto 1); ambos se
   conservan al navegar. El escenario se cambia con los botones A/B de Impacto, de la ficha del
   artículo, del detalle de segmento y del playground; cada una de esas vistas rotula el
   escenario activo. Cambiarlo cambia todas las cifras juntas.
2. **Dinero.** Todo componente que muestra dinero lleva "a precio de venta, no es margen". Un
   solo componente de cifra monetaria lo resuelve.
3. **Ausentes.** `null` se muestra como "no disponible". Las fuentes de `meta.pending` se
   muestran como "no disponible: el proyecto de datos aún no publica <qué>", en el lugar de la
   gráfica.
4. **Versiones de la venta.** "Venta observada" y "venta completada (quiebres tratados)" van con
   rótulos y trazos distintos y nunca se suman.
5. **Nivel de servicio.** Deslizador solo en Impacto, sobre los 17 valores de z exportados. Al
   moverlo:
   - se desplaza un punto marcado en cada curva;
   - las tarjetas de exceso y venta perdida muestran la lectura de ese punto.

   La curva solo cambia con el escenario o el segmento. En el artículo, el z fijo es texto, sin
   control.
6. **Fuera de los 517.** Nunca se muestra pronóstico ni métricas. Aparece "Este artículo no entró
   al pronóstico" con enlace al embudo.
7. **Formato.** Números es-ES (coma decimal, punto de miles); millones como "3,28 M US$".
8. **Ahorro frente a no hacer nada.** Las columnas `impact*` llevan ese rótulo. Si el valor es
   negativo: "el modelo cuesta X más que repetir el año anterior" (`Saving.tsx`).
9. **Paleta.** Solo los colores de la guía, con significado fijo:
   - venta real: plateado; modelo: cian; línea base: ciruela;
   - media: gris medio; bandas e histograma: pizarra;
   - AX: azul; AY: verde; AZ: violeta.

   Cada gráfica lleva como máximo 3 colores de datos (media y bandas son grises de referencia).
   Los textos usan los colores de texto.
10. **Movimiento.** Solo la red de Inicio se anima, y lento. Con `prefers-reduced-motion` queda
    estática.
11. **Fuera de alcance de la guía.** Los filtros por estado (CA/TX/WI) no se construyen
    (research R17).
