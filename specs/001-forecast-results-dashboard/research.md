# Research: Frontend de resultados del pronóstico de reposición

**Fecha**: 2026-11-13 · **Fuente**: lectura de `mapa_flujo_datos.md` (DATA_CONTRACT), de los
manifiestos y de las tablas con `load_tables` / `load_frozen` / `load_interim` en el `.venv` del
proyecto de datos. Todas las cifras de abajo se leyeron del disco ese día.

## Parte 1 · Verificaciones pendientes de la especificación

### R1. z de la tabla de impacto por artículo (`item_impact`)

- **Decisión**: el z por artículo es **uno por escenario**, el mismo para los 517 artículos, e
  igual al z del 95 % de servicio del **total** (no del segmento):
  - A · a un paso: `z_modelo = −0,011938`, `z_naive = 0,711487`.
  - B · encadenado: `z_modelo = 0,567694`, `z_naive = 0,711487`.
  Coinciden con `readings.z95_modelo` / `z95_naive` de la fila `segment = total`.
- **Razón**: `item_impact` tiene `nunique(z_modelo) = nunique(z_naive) = 1` por escenario.
- **Consecuencia**: el sitio rotula el impacto por artículo como "al z del 95 % de servicio del
  total (z = …)". El modelo y la línea base usan z distintos; se muestran los dos.

### R2. Tramo de test

- **Decisión**: 13 bloques por artículo, siempre los **últimos 13 bloques del artículo**. Para 515
  artículos son los bloques **53–65** (2015-05-25 a 2016-05-22). Dos excepciones:
  `HOUSEHOLD_1_366` (51–63) y `HOUSEHOLD_1_427` (52–64), cuya historia termina antes.
- **Razón**: `nb05_test/forecasts` tiene 6.721 = 517 × 13 filas; `boosting_data` marca
  `split = test` desde el bloque 51 por esos dos artículos. El contrato decía "51–65" porque
  miraba el mínimo global.
- **Consecuencia**: el sitio nunca asume 53–65; toma los bloques de test de cada artículo de
  `forecasts`. Los números de bloque son globales (bloque 65 = días 1.914–1.941).

### R3. Cifras intermedias del embudo

- **Decisión**: el embudo del sitio tiene **4 etapas trazables a salidas del modelo**:
  30.490 series (`series_index`) → 3.049 artículos (`item_index`) → 592 segmento A (`targets`,
  AX 207 · AY 251 · AZ 134) → 517 pronosticados (manifiesto `nb03b_datasets.n_items`;
  AX 191 · AY 229 · AZ 97). La salida 592 → 517 se muestra como "salen 75".
- **Razón**: las etapas 2.886 ("con clase XYZ medible") y 590 ("vuelven a tener stock") solo
  aparecen en el deck `reports/pronostico_reposicion/`, que no es una salida con manifiesto; ningún
  parquet ni manifiesto las guarda. La constitución (I.1, Reglas de método 4) impide tomarlas de ahí
  o recalcularlas.
- **Alternativas consideradas**: copiar 2.886 y 590 del deck (rechazado: no es fuente de la
  verdad); recalcularlas con la segmentación (rechazado: recálculo). Si el proyecto de datos las
  guarda en un manifiesto, se agregan sin cambiar el diseño.

### R4. Suma del impacto por artículo frente al total

- **Decisión**: cuadra **exacto** (diferencia ≤ 5·10⁻¹⁰ US$) entre `Σ item_impact` y la fila
  `total` de `by_segment`, para `demand`, `impacto`, `impacto_exceso` e `impacto_perdida`, en los
  dos escenarios. Tolerancia para SC-005: **0,01 US$** absoluta (cubre redondeo de coma flotante).
- **Ojo**: el titular del criterio 2 (3,28 M, 77 %; 0,91 M) viene de `readings` / manifiesto
  `headline`, calculado sobre las **curvas** a z95, no de la suma de `item_impact`
  (`impacto_exceso` total A = 3,27 M). Son cifras distintas y se rotulan distinto: "ahorro de
  exceso al 95 % de servicio (curva)" frente a "impacto por artículo al z fijo". Nunca se presentan
  como la misma cifra.

### R5. Venta observada frente a venta completada

- **Decisión**:
  - **Observada** = `item_units` (intermedios, por día) agregada por bloque de 28 días.
  - **Completada** = `boosting_data.units` (quiebres de stock tratados). También es la `units` de
    `nb05_test/forecasts` (venta real contra la que se mide el pronóstico).
- **Razón**: `FOODS_1_004`, bloque 64: observada 0, completada 2.142; en artículos sin quiebre
  (`FOODS_2_371`, bloques 62–65) las dos coinciden. La columna `imputed` no marca todos los bloques
  tratados, así que no se usa como bandera de "completada".
- **Consecuencia**: el pronóstico se compara siempre contra la **completada**, rotulada así.

### R6. `item_spend` = unidades × precio de venta

- **Decisión**: confirmado. `item_spend / item_units` por día da el precio (p. ej., 1,96 US$ en
  `FOODS_1_004`), y el impacto total (`total_demand` = 21,86 M) es dinero a precio de venta.
- **Consecuencia**: el dinero por bloque de la venta **observada** es `Σ item_spend` del bloque.
  La venta **completada** no tiene dinero en las salidas: se muestra solo en unidades (multiplicar
  por precio sería construir una cifra nueva).

### R7. Colchón y cantidad a reponer por artículo y bloque (FR-014)

- **Decisión**: **no existen** en las salidas. `item_impact` guarda el resultado agregado del año
  (venta perdida y exceso) y el z, pero no el colchón ni la cantidad por bloque; `curves` es por
  segmento y total, sin bloque. El sitio muestra, por artículo y bloque, el **pronóstico en
  unidades** (escenarios A y B) y, por artículo, el **z fijo** y el impacto del año. No muestra
  "cantidad a reponer".
- **Razón**: el colchón exigiría `z · σ` con σ reconstruido (`rmsse_units_window × scale`), que es
  recalcular la lógica del nb 06 (constitución I.2).
- **Consecuencia para la especificación**: FR-014 y el escenario 4 de la historia 4 se cumplen en
  su versión reducida. Ver "Desvíos de la especificación" en `plan.md`.

### R8. Hallazgos adicionales que afectan el diseño

- **Impacto por bloque (playground)**: ninguna tabla guarda venta perdida o exceso por bloque. El
  playground reproduce bloque a bloque **venta completada, pronóstico A, pronóstico B y línea
  base** (de `forecasts`) con sus acumulados en unidades, y muestra el impacto del año (de
  `item_impact`) solo al llegar al último bloque.
- **Error por artículo**: `item_metrics` tiene RMSSE, WAPE y MAE por artículo para "a un paso" y
  "encadenado", **no para seasonal naive**. El error del naive existe solo agregado (`metrics`:
  WRMSSE/WAPE por segmento y paso). En la ficha del artículo, el error del naive dice "no
  disponible por artículo" y se enlaza al agregado.
- **Diferencia por bloque**: `pronóstico − venta completada` en unidades se muestra como
  "diferencia" (una resta para leer el gráfico, no una métrica nueva); el error oficial es el de
  `item_metrics`.
- **Dinero en juego**: dos cifras, rotuladas distinto: (a) % del gasto de train de los 517
  (`Σ targets.spend_share`, ≈ 52 %) y (b) demanda del año de test a precio de venta
  (`nb06_impact.total_demand` = 21,86 M US$).
- **Bloques**: números globales 1–65, anclados al día 1.941. La fecha de inicio sale de
  `boosting_data.start_date`; la historia del sitio usa los bloques 2–65 (los de `boosting_data`).
- **Rutas relativas**: `load_frozen` y `load_validated_config` usan rutas relativas a la raíz del
  proyecto de datos; el exportador debe ejecutarse con esa raíz como directorio de trabajo e
  importarla en `sys.path`.

## Parte 2 · Decisiones técnicas

### T1. Exportación

- **Decisión**: un script Python, `export/export_data.py`, ejecutado con el intérprete del proyecto
  de datos (`$DATA_PROJECT_ROOT/.venv/bin/python`: Python 3.12.3, pandas 3.1.0, pyarrow 26.0.0,
  numpy 2.5.4 — las mismas versiones registradas en los manifiestos de nb 05 y nb 06).
- **Razón**: usar `src.data.load_tables`, `src.freeze.load_frozen` y `src.data.load_interim`
  exige el mismo entorno; un entorno propio duplicaría dependencias y podría leer distinto.
- **Alternativas**: entorno propio con `uv` (rechazado: dos entornos que mantener alineados).

### T2. Formato de los datos exportados

- **Decisión**: JSON. Un archivo por tema (`meta`, `items`, `segments`, `funnel`) y un archivo por
  artículo con sus series (`series/<item_id>.json`). Tamaño estimado total < 6 MB.
- **Razón**: el navegador lo lee sin librerías; los archivos por artículo cargan solo lo que se
  mira; los diffs en Git son legibles para auditar cambios de cifras.
- **Alternativas**: Parquet en el navegador (rechazado: librería pesada, sin beneficio a este
  tamaño); un solo JSON grande (rechazado: carga inicial innecesaria).

### T3. Interfaz

- **Decisión**: React 19 + TypeScript 5.8, construido con Vite 6, gráficos con Recharts 2.15,
  navegación por hash (`#/articulo/FOODS_1_004`) sin librería de rutas.
- **Razón**: Vite 6 corre en el Node 18.19 instalado; React + Recharts es la combinación con más
  ejemplos (la IA escribe el código y el usuario no aprende frontend); el hash evita configurar
  rutas en GitHub Pages.
- **Alternativas**: Vite 8 / TypeScript 7 (rechazados: Vite 8 exige Node ≥ 20 y TS 7 es la
  reescritura nativa, poco probada); react-router (rechazado: 5 vistas no lo justifican); ECharts
  (válido, pero más API que aprender para estos gráficos).

### T4. Pruebas

- **Decisión**: `pytest` para el exportador (invariantes: 517, segmentos, cuadre de impacto,
  WRMSSE, rangos, falla ante tabla faltante); `vitest` para los formateadores del frontend
  (número es-ES, "no disponible", rótulo de dinero). Más una verificación manual de cifras guiada
  por `quickstart.md`.
- **Razón**: los criterios de aceptación son de cifras; se prueban mejor donde se generan.

### T5. Publicación y despliegue

- **Decisión**: GitHub Actions construye el sitio desde los JSON **versionados** y lo publica en
  Pages (`actions/deploy-pages`). Node 22 en Actions. El CI **no** ejecuta la exportación (no tiene
  acceso a `data/` del proyecto de datos).
- **Razón**: la exportación es local y su salida versionada es la referencia (constitución I.5).
- **Pendiente operativo**: `gh` no está instalado; crear el repositorio público y activar Pages
  (fuente: GitHub Actions) se hace a mano o tras instalar `gh`.

### T6. Rutas de trabajo

- **Decisión**: el exportador lee `DATA_PROJECT_ROOT` y `EXPORT_DIR` de un `.env` ignorado por Git
  (se entrega `.env.example`), con el valor de la constitución. Si falta una variable o la ruta no
  existe, falla (constitución III.2).
- **Razón**: la constitución permite el `.env` y el repositorio es público. `EXPORT_DIR`
  (`public/data`) no figura en la tabla de la constitución: se propone agregarlo (enmienda PATCH).

## Parte 3 · Iteración 2: universo 3.049, bandas, histograma y capa visual (2026-11-13)

Entrada: constitución 1.0.0, `spec.md` actualizada y la guía visual (`diseno/guia_visual.md`
y `diseno/pantalla_{1_inicio,2_segmentacion,3_articulo,4_impacto}.png`). Las cifras de los
mockups son ilustrativas (lo dicen las propias pantallas); solo cuenta la disposición.

### R9. Ubicación de la guía visual

- **Decisión (usuario)**: la guía se queda en `diseno/`; la constitución 1.1.0 (VI.1) apunta ahí.
- Las cifras de los mockups son ejemplos: no se usan como dato ni como valor esperado.

### R10. Matriz ABC × XYZ de los 3.049 y perfiles del radar (resuelto 2026-11-14)

- **Hallazgo**:
  - `data/processed/matrix_train.parquet` (3.049 filas, congelada con hash) es del **flujo viejo**
    (2026-10-31): da AX 218 / AY 112 / AZ 263, que no coincide con `targets` (207 / 251 / 134).
    No sirve.
  - El nb 03 calcula la matriz vigente (`items_clean`, celda 92) y el radar (`radar_clean`,
    celda 107), pero solo congela `targets` (celda 133). La matriz vigente, según la salida
    guardada del notebook: A 207 / 251 / 134 / 1 sin XYZ; B 284 / 331 / 180 / 0;
    C 402 / 729 / 369 / 161. Total 3.049, de los cuales 162 no tienen clase XYZ.
  - Ejes del radar en el nb 03: `spend`, `usage_units`, `cv`, `zero_share`, `velocity`. Cada uno
    es la mediana de la celda ÷ la mediana global. Los ejes del mockup (Edad, Racha larga, Días
    mínimos) no existen en el proyecto de datos.
- **Decisión**: la exportación lee la matriz y el radar **solo** si el proyecto de datos los
  congela con `freeze` (constitución I.11). Contrato propuesto para el proyecto de datos (lo
  hace el usuario en el nb 03, no este repositorio):
  - `segmentation_items` (3.049 filas): `item_id`, `abc_class`, `xyz_class` (`-` = sin clase),
    `cell`, `spend`, `usage_units`, `cv`, `zero_share`, `velocity`.
  - `radar_profiles` (celda × eje): `cell`, `axis`, `median_raw`, `median_norm` (÷ mediana
    global), `global_median`.
- **Verificación al exportar**: AX/AY/AZ de `segmentation_items` = `targets` (207 / 251 / 134,
  mismos `item_id`); total de `segmentation_items` = 3.049 = `item_index`.
- **Decisión (usuario)**: la matriz y el radar excluyen los 162 artículos sin clase XYZ; la
  matriz suma 2.887. Esos 162 siguen en el catálogo y en la vista de artículo.
- **Resultado (2026-11-14)**: el nb 03 (Etapa 10b) congeló `segmentation_items` (3.049 × 9) y
  `radar_profiles` (45 filas: 9 celdas × 5 ejes). AX/AY/AZ = 207 / 251 / 134, los mismos 592
  `item_id` y celdas de `targets`; `cv` nulo solo en los 162 sin clase XYZ;
  `median_norm = median_raw / global_median`.

### R11. Fuente opcional sin romper la exportación de los 517

- **Decisión**: los dos artefactos de R10 son fuentes *declaradas como pendientes*.
  - Si no están en `data/processed/manifest.json`, la exportación sigue, registra en
    `meta.pending` que faltan y la interfaz muestra "no disponible: el proyecto de datos aún no
    publica la matriz de los 3.049". Queda registrado y a la vista: no es una falla silenciosa.
  - Si están declarados pero el hash no coincide o falta una columna, la exportación falla
    completa (constitución III.1).
- **No romper**: los builders actuales (`funnel`, `items`, `segments`, `series`) no cambian, y
  sus archivos tampoco. `meta.json` solo suma campos. Las 15 pruebas actuales siguen pasando sin
  cambios.

### R12. Serie descriptiva de los 3.049

- **Decisión**: un archivo por artículo, `descriptive/<item_id>.json`, con unidades y dinero
  observados por bloque. Sale de `item_units` y `item_spend` (ya cargados con `load_interim`)
  sobre el **mismo calendario** de bloques 2–65 de la exportación actual.
- **Inicio**: el primer bloque con venta (lanzamiento), como en la serie de los 517. Los 3.049
  tienen venta en los bloques 2–65 (verificado).
- **Tamaño**: unos 3.049 × 4 KB ≈ 12 MB, lejos de 1 GB.

### R13. Bandas, CV descriptivo e histograma (I.10, II.8)

- **Serie base**: unidades **observadas** por bloque, del primer bloque con venta al 65, ceros
  incluidos. Es la misma definición para los 3.049. Resuelve TODO(BANDAS_RANGO): desde el
  lanzamiento.
- **σ**: poblacional (`ddof=0`), igual que `cv_from_blocks` del nb 03.
- **Bandas**: media ± 3σ.
  - La banda inferior puede quedar bajo cero. Se exporta tal cual, porque es un estadístico y
    no unidades: no entra en el chequeo de no negativos.
  - La gráfica la dibuja en 0 con la nota "−3σ por debajo de cero".
- **CV descriptivo** (pendiente 2 de la spec):
  - Es σ ÷ media × 100, en %, para usar la misma unidad que el CV de segmentación.
  - La ficha muestra el **CV descriptivo** en la tarjeta "Coeficiente de variación", con la
    leyenda "σ ÷ media de los bloques desde el lanzamiento".
  - El CV de la segmentación (`cv` de train sobre bloques válidos) va en el subtítulo, como
    "CV de train (segmentación)", y solo cuando existe.
  - **Confirmado por el usuario.**
- **Histograma**: 8 intervalos de igual ancho entre el mínimo y el máximo de las unidades por
  bloque. Si todas son iguales, un solo intervalo.
- **Casos borde**:
  - Un solo bloque: σ, bandas y CV "no disponible".
  - Media 0: CV "no disponible".

### R14. Venta real en la gráfica del artículo

- **Línea plateada continua**: venta **observada**, para todos los artículos.
- **Para los 517, en el tramo de test**:
  - Se agrega la venta **completada** como línea plateada punteada, rotulada "venta completada
    (quiebres tratados)": es la que compara el pronóstico (R5).
  - Se rotulan las dos y no se suman (II.5).
- **Colores**:
  - Media y bandas son grises de referencia, no colores de datos.
  - La regla "≤ 3 colores de datos" se cumple: plateado, cian y ciruela.

### R15. Escenario en la interfaz

- El `?esc=A|B` sigue siendo global.
- **Impacto**: las píldoras A/B del encabezado lo cambian.
- **Artículo**:
  - Tarjetas "RMSSE · 1 paso" (A) y "RMSSE · cadena" (B), cada una con su rótulo, como en el
    mockup: no es una cifra mezclada.
  - WAPE y MAE corresponden al escenario activo y lo rotulan.
  - El modelo dibujado también es el del escenario activo.
  - Bajo el RMSSE, "línea base: no disponible por artículo" (FR-011): ese dato no existe por
    artículo.

### R16. Módulos, rutas y dónde queda cada requisito

| Módulo (guía) | Ruta | Requisitos |
|---|---|---|
| Inicio | `#/` | Portada con red animada. Cifras: 3.049 analizados (`item_index`), 517 con pronóstico, exceso evitado de A al 95 % (manifiesto) y botón "Explorar". |
| Segmentación | `#/segmentacion` | FR-007/008: matriz, radar, tarjeta. FR-005: embudo de 4 etapas. FR-005b: dinero en juego bajo el embudo. |
| Detalle de segmento | `#/segmentacion/:cell` (AX/AY/AZ) | US2-3: lista ordenable. Se entra desde la matriz. |
| Artículo | `#/articulo/:item_id?` | FR-006, FR-009, FR-009b, FR-011, FR-014, FR-015 |
| Playground | `#/articulo/:item_id/playground` | FR-018 (sin cambios funcionales; nueva piel) |
| Impacto | `#/impacto` | FR-013, FR-016, FR-017: tarjetas, curva y deslizador, barras por segmento, tabla de mayor contribución. Selector Total/AX/AY/AZ para la curva. |
| Datos | `#/datos` | FR-004, con enlace al pie del panel lateral |

- **Rutas viejas**: `#/segmentos…` redirige a `#/segmentacion…`.
- **Embudo**: el mockup muestra 3 etapas y FR-005, 4. En alcance manda la spec (VI.3), así que
  se dibujan 4 etapas y "30.490 series" va en pizarra.

### R17. Filtros por estado (CA, TX, WI) de la pantalla 2

- **Decisión**: no se construyen. No están en la especificación, y una matriz o un radar por
  estado no existe en el proyecto de datos (I.11, Método 4). En alcance manda la spec (VI.3).
  Se anota como desvío de la guía.

### R18. Implementación visual

- **Tokens**: CSS en `:root` con la paleta de la guía (tema oscuro único) y ningún color fuera
  de la tabla.
- **Tipografía**: `Calibri, Carlito, "Segoe UI", system-ui, sans-serif`, sin fuentes externas.
- **Íconos**: SVG de línea en línea, sin librería nueva.
- **Gráficas**: Recharts 2.15 (`RadarChart`, `LineChart`/`ComposedChart`, `BarChart`), sin
  dependencias nuevas.
- **Matriz**: grilla CSS; la intensidad del cian depende del conteo y la celda seleccionada
  lleva borde cian.
- **Selector de artículo**: combobox propio (`role="combobox"` + `listbox`).
  - Filtra por subcadena sin distinguir mayúsculas.
  - Al abrirlo vacío lista los 3.049.
  - La píldora "Pronóstico" lo limita a los 517.
- **Red animada**:
  - `canvas` 2D, unos 40 nodos con pulso lento y opacidad baja.
  - Se detiene con `prefers-reduced-motion` y cuando la pestaña está oculta.
- **Mockups**: se trabaja de escritorio primero (son 2000 × 1125). En pantallas angostas, el
  panel lateral pasa arriba.

### R19. Conflicto "no se toca la exportación" de la guía

- La guía dice que su alcance es solo la interfaz. La spec y el pedido del usuario amplían la
  exportación.
- En alcance manda la spec (VI.3). La exportación crece **solo por adición** (R11).
