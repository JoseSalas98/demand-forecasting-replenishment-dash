# Cambios al dash DDR · especificación para implementar el mockup

Repositorio: `josesalas98/demand-forecasting-replenishment-dash`
Referencia visual: `mockup_dash_ddr.html` (ábrelo en el navegador; las notas amarillas "✎" explican cada cambio y se ocultan con el botón "Notas del mockup").

## Cómo usar este documento

1. Implementa por sección, en este orden: Global → Inicio → Segmentos → Artículo → Impacto → Cómo usar.
2. Toma del mockup el diseño, los textos y el comportamiento. **No copies sus datos**: el mockup tiene cifras escritas a mano; el dash debe leerlas de los JSON de `data/` (ver "Fuentes de datos").
3. No hace falta tocar el exportador de Python ni reentrenar nada: todo sale de los JSON que ya se publican.
4. Al terminar cada sección, verifica las cifras de control de la última parte de este documento.

## Lo que NO se debe portar del mockup

- Las notas amarillas "✎" y el botón "Notas del mockup".
- Los arreglos de datos escritos dentro del `<script>` (`D.curves`, `D.radar`, `D.items`, `D.art`, `CMP`, etc.).
- El aviso "En el mockup solo FOODS_3_090 tiene datos": en el dash, cualquier artículo abre su ficha.
- El límite de 15 artículos por grupo en la tabla de detalle: el dash muestra todos.
- "Exportar CSV" copiando al portapapeles: en el dash debe descargar el archivo.
- Cualquier rastro del escenario B (encadenado). El dash muestra solo el escenario A y **no menciona el método** ("a un paso").

---

## 1. Global

- **Una sola nota de dinero**: chip en la barra superior "Cifras a precio de venta · no es margen". Quitar el texto "a precio de venta, no es margen" que hoy aparece debajo de cada cifra.
- **Se elimina** el selector de escenario A/B y cualquier botón global de "detalle técnico".
- **Botones que parecen botones**: todo lo pulsable lleva borde, fondo y flecha o ícono; estado hover y foco visible.
- **Ancho completo**: el contenido usa todo el ancho disponible (sin `max-width` fijo).
- **Formato de cifras** (locale es-CO: miles con punto, decimales con coma):
  - Totales en dinero: `x,xx M US$`.
  - Tablas y fichas de artículo: `mil US$` sin centavos, una sola escala por tabla.
  - Unidades: `16.539 u.`; porcentajes: `9,3 %`.
- **Vocabulario** en toda la interfaz:

| Antes | Ahora |
|---|---|
| Exceso en anaquel | Mercancía sobrante |
| Venta perdida | Ventas perdidas por falta de producto |
| Nivel de servicio | % de la demanda atendida |
| Seasonal naive / repetir año anterior | **Línea base** |
| Bloque | Periodo de 4 semanas |
| Test | Año de prueba |
| Venta completada | Venta sin faltantes (estimada) |

- **Nombres de segmentos** (ABC × XYZ), siempre como "familia + regularidad":

| Clase | Nombre | Clase | Nombre |
|---|---|---|---|
| A | Vitales | X | continuos |
| B | Útiles | Y | recurrentes |
| C | Complementarios | Z | ocasionales |

  Ej.: AX = "Vitales continuos", CZ = "Complementarios ocasionales". Singular para definiciones: "artículo vital continuo".
- **Política sugerida** (de `items.json → treatment`): `regular_replenishment` → "Reposición regular", `periodic_review_replenishment` → "Revisión periódica", `promotion_priority` → "Prioridad en promociones".
- **Colores**: pronóstico `#2bb6e3` (cian); línea base `#ff9f6e` (coral, línea discontinua); continuos `#4f8ff7`, recurrentes `#2fb586`, ocasionales `#a07cf2`; sobrante `#f2b24c`; ventas perdidas `#ef7d7d`; ahorro `#4cc38a`.
- **Menú lateral**: Inicio · Segmentos · Artículo · Impacto · Cómo usar. "Origen de los datos" queda igual, al pie.

## 2. Inicio

- Solo bienvenida: eyebrow "Demand Driven Replenishment", título "Reposición guiada por la demanda", línea "Walmart · 10 tiendas · 2011–2016" y un botón primario "Explorar los segmentos →".
- Se conserva la red de puntos de fondo del dash actual.
- Sin KPIs ni tarjetas.

## 3. Segmentos

### 3.1 Burbujas (reemplaza la matriz ABC × XYZ)
- Tres racimos (familias) con tres burbujas cada uno (regularidad). Disposición: Vitales a la izquierda; Útiles arriba a la derecha; Complementarios abajo a la derecha. Cada racimo tiene un halo punteado y, debajo, nombre, "N artículos · X M US$" y, en Vitales, "CON PRONÓSTICO".
- Burbujas **planas y translúcidas**: relleno del color de regularidad con opacidad 0,2, borde de 1,5 px del mismo color, nombre en tono claro y cifra en blanco. Hover: opacidad 0,32. Seleccionada: opacidad 0,4 y borde blanco.
- Radio ∝ √valor. Selector "Tamaño por: Venta | Artículos" (venta = `segmentation.json → matrix[].spend`; artículos = `n_items`). Al cambiar, las burbujas se reacomodan con transición. Debajo, una frase:
  - Venta: "Los Vitales son el 21 % de los artículos clasificados, pero hacen el 60 % de esa venta."
  - Artículos: "Los Complementarios son la mitad del catálogo clasificado (1.500 de 2.887)…"
- **Flotación suave**: animación CSS de 3–5 px, ciclos de 6–11 s, desfasados por burbuja; se pausa en hover y se apaga con `prefers-reduced-motion`.
- **Definiciones al pasar el cursor**: sobre el halo, definición de la familia; sobre la burbuja, definición combinada (textos exactos en el mockup: `FAMDEF`, `LVDEF`, `bubTipHtml`).
- Clic o Enter sobre una burbuja → la selecciona y actualiza el panel.

### 3.2 Panel del grupo (derecha, misma altura que las burbujas)
- Encabezado: nombre del grupo, "N artículos · X M US$ de venta" y botón **ⓘ Detalle** (lleva a 3.4).
- Frase: "Un artículo típico de este grupo vende X veces más/menos que el artículo típico del catálogo. Su venta es … y pasa sin vender el Y % de los días."
- Si es Vitales: "Con pronóstico: N de M · política sugerida: …".
- **Radar** de 5 ejes (Venta, Unidades, Variabilidad, Días sin venta, Unidades por día) con `median_norm`: el grupo elegido relleno, los tres Vitales como contornos que se prenden y apagan con su chip de leyenda, y el polígono punteado del artículo típico (1×). Sin marcadores fijos: al pasar el cursor por un eje se resalta ese eje y un recuadro lista, para cada grupo visible, el valor real (`median_raw`) y las veces frente al catálogo, y al pie el artículo típico (`global_median`).
- **Barras** "Frente al artículo típico del catálogo" (5 variables), cada una con un **"?"** que muestra la definición de la variable y el valor real con unidades (US$, u., %, % de los días, u. por día) frente al del catálogo.

### 3.3 Embudo
- Embudo gráfico 30.490 → 3.049 → 592 → 517 (ancho en escala log) con etiquetas: "combinaciones tienda × artículo", "artículos", "Vitales · el primer 60 % de la venta", "con pronóstico · los Vitales que pasan los filtros".
- A la derecha, tres cifras: **52 %** de la venta cubierta (`funnel.json → money_at_stake.train_spend_share_517`); **21,86 M US$** de demanda del año de prueba (`money_at_stake.test_demand_517`); **75** Vitales sin pronóstico, "no pasan los criterios de calidad del dato o no tienen historia suficiente tras el procesamiento".
- Botón **ⓘ Detalle de los pronosticados** (lleva a 3.4).

### 3.4 Página "Detalle de los grupos con pronóstico" (nueva ruta)
- Botón "← Volver a Segmentos". Pestañas por grupo Vital (preseleccionada la del grupo elegido).
- Tabla comparativa de los 3 grupos + total, con la columna elegida resaltada: artículos, venta de entrenamiento, % de la venta de la cadena, WAPE pronóstico/línea base, WRMSSE pronóstico/línea base (`segments.json → error.one_step` y `error.seasonal_naive`; total en `meta.json → wrmsse_units`).
- Tabla de **todos** los artículos del grupo, ordenable por encabezado: artículo (botón que abre su ficha), venta de train (mil US$), CV de train, WAPE, ahorro (mil US$), marca "⚑ marcado" si `metrics.A.review`.
- Debajo, la gráfica de CV de train por artículo del dash actual, sin cambios.

## 4. Artículo

### 4.1 Página principal
- Encabezado: código, pill del grupo, "desde <mes año de lanzamiento>", política sugerida; buscador con lista desplegable (`catalog.json`) y píldora "Solo con pronóstico". Abre con un artículo por defecto (nunca vacío).
- Frase: "En el año de prueba el pronóstico acertó **N de cada 100 unidades**: se equivocó en unas M unidades por periodo, sobre una venta típica de K." (N = 1 − WAPE; M = MAE).
- **Gráfica de unidades por periodo**:
  - Series: lo que se vendió (`units_observed`), venta sin faltantes (`units_completed`, punteada), **pronóstico** (`forecast.A`, cian con marcadores circulares) y **línea base** (`baseline`, coral discontinua con marcadores en rombo). Las cuatro visibles por defecto; la leyenda funciona como interruptores.
  - Eje x en años; franja sombreada "año de prueba".
  - Selector "Toda la historia | Año de prueba" (este último acerca la gráfica a los periodos 51–65 con eje en meses).
  - **Etiqueta de datos al pasar el cursor**: línea vertical, fecha de inicio del periodo y unidades de cada serie visible; avisa "Hubo faltante de producto" si lo vendido < 80 % de la venta sin faltantes.
  - Botón **ⓘ Detalle del pronóstico** (lleva a 4.2).
- **"¿Cuánto ahorra este artículo?"** con botón **ⓘ Ver el cálculo** y tres cifras: menos sobrante (`excess_naive − excess_model`), más ventas perdidas (`lost_model − lost_naive`), ahorro neto (`impact`), más la frase con el % de su demanda.
- Se eliminan la tabla de historia por bloque y la tabla "¿Cuánto pido?" de esta página (pasan a 4.2).

### 4.2 Página "Detalle del pronóstico" (nueva ruta)
- Botón "← Volver al artículo".
- **Tabla "Cómo se calcula el ahorro"** (columnas: Línea base · Pronóstico · Diferencia):
  - Unidades pronosticadas en el año (suma de `baseline` y de `forecast.A` en el año de prueba; real sin faltantes como referencia).
  - Error medio por periodo (WAPE): línea base calculada de la serie = Σ|baseline − units_completed| ÷ Σ units_completed; pronóstico = `metrics.A.wape_units`.
  - Colchón z: `z_naive` y `z_model`.
  - Mercancía sobrante, ventas perdidas, **costo total de equivocarse** (sobrante + ventas perdidas) y el mismo costo como % de la demanda (`impact.A.demand`).
  - Nota: los totales de unidades casi coinciden; el ahorro sale de que la línea base se equivoca más periodo a periodo, necesita más colchón y ese colchón termina como sobrante.
- Métricas: WAPE, MAE, RMSSE, CV de segmentación (`cv_train`), CV histórico (`descriptive.stats.cv_pct`, con media y σ), marcado para revisión.
- Histograma de unidades por periodo y venta en dinero por periodo.
- Tabla del año de prueba por periodo (inicio, se vendió, sin faltantes, pronóstico, línea base, pronóstico − real) con botón **Exportar CSV** (descarga) y la opción "Mostrar media y bandas ±3σ en la gráfica del artículo".

## 5. Impacto

- Encabezado: "Año de prueba · pedir según el pronóstico frente a la línea base".
- **Control** "¿Qué porcentaje de la demanda quieres atender?" de 90 % a 99 % en pasos de 0,5. Es tasa de cumplimiento en dinero, no z.
- Texto: "Un mejor pronóstico se puede aprovechar de dos maneras. Se elige una, la otra o un punto intermedio; los dos montos no se suman."
- **Tarjeta "Liberar capital"** (mismo % de demanda atendida): cifra = sobrante evitado; texto con −% y "dinero que no queda inmovilizado en el anaquel"; ventas perdidas iguales en ambos. Barras horizontales línea base vs. pronóstico con **escala fija 0–12 M US$** y eje.
- **Tarjeta "Recuperar ventas"** (mismo sobrante que la línea base): cifra = ventas recuperadas; texto "con ese mismo inventario, el pronóstico atiende el X % de la demanda en lugar del Y %". Barras de ventas perdidas con **escala fija 0–3 M US$**.
- Botón **ⓘ Ver detalle del cálculo** en la esquina inferior izquierda de esa tarjeta, que **se despliega en la misma tarjeta** (no en otra página) y se actualiza al mover el control. Contenido igual al detalle técnico actual: curva sobrante vs. ventas perdidas (pronóstico y línea base, con los dos puntos del % elegido y la línea de "sobrante evitado"), z en ese punto, venta recuperada con el mismo sobrante, WRMSSE, nota de tasa de cumplimiento, lectura por segmento (0,46/1,33/1,66 = 3,45 M con z propio) y fórmula del ahorro por artículo.
- **"¿Dónde está el capital liberado?"**: barras por grupo Vital al % elegido que **suman exactamente el total**, más la frase "Total: a + b + c = T". Debajo, una franja con las cuatro cifras de concentración (`segments.json → concentration.A`): 55 (50 %), 179 (80 %), 490 de 517 ahorran, 27 cuestan más.
- **Top 10** en mil US$: artículo (botón a su ficha), segmento, menos sobrante, efecto en ventas perdidas ("N más"/"N menos"), **ahorro neto** (criterio de orden).

### Cálculo (todo en el navegador, desde `segments.json`)
1. **Curva total por método**: para cada índice de z (17 valores, −1 a 3), sumar `excess` y `lost` de AX, AY y AZ en `curves.A` (pronóstico) y `curves.naive` (línea base). `D` = suma de `demand`; `servicio = 1 − lost_total / D`.
2. **Mismo servicio s**: en cada curva total, ubicar el tramo i con `servicio_i ≤ s ≤ servicio_i+1`, `t = (s − servicio_i)/(servicio_i+1 − servicio_i)`; interpolar linealmente `excess`, `lost` y `z`. Capital liberado = `excess_línea_base − excess_pronóstico`; las ventas perdidas resultan iguales.
3. **Desglose por segmento**: interpolar el `excess` de cada segmento con el mismo `(i, t)` de su método. Así los segmentos suman exactamente el total.
4. **Mismo sobrante**: `E = excess_línea_base(s)`; en la curva total del pronóstico, ubicar el tramo con `excess_i ≤ E ≤ excess_i+1` e interpolar `lost`. Ventas recuperadas = `lost_línea_base(s) − lost_pronóstico(E)`; servicio del pronóstico = `1 − lost_pronóstico / D`.

## 6. Cómo usar (reemplaza "Cómo usar" actual)

- **¿Para qué sirve este tablero?**: párrafo + franja (10 tiendas, 2011–2016, 3.049 artículos, 517 con pronóstico) + nota "no recalcula nada; todo a precio de venta".
- **Las secciones**: una tarjeta por módulo (Inicio, Segmentos, Artículo, Impacto) con "Para qué sirve", 3–4 pasos de uso y botón "Ir a …"; tarjetas alineadas en una cuadrícula 2 × 2 con la misma altura por fila.
- **Glosario en tabla**: columnas Término · Qué significa · Nombre técnico; filas agrupadas por tema (Lo básico, Segmentos, Qué tan bien pronostica, Impacto en dinero) con fila de encabezado por tema; buscador que filtra filas. Textos en el mockup (`GLO`).

---

## Fuentes de datos (JSON ya publicados en `data/`)

| Archivo | Campos que se usan |
|---|---|
| `meta.json` | `headline.A` (`saving_excess95`, `saving_excess95_pct`, `recovered_sales_same_excess`), `total_demand_test`, `wrmsse_units`, `blocks[].start_date` |
| `segmentation.json` | `matrix[]` (`cell`, `n_items`, `spend`), `radar.cells[cell][eje]` (`median_norm`, `median_raw`), `radar.global_median`, `total_items`, `excluded_no_xyz` |
| `segments.json` | `segments.{AX,AY,AZ}`: `n_items`, `spend_train`, `spend_share`, `cv_train[]`, `curves.A` y `curves.naive` (`z`, `excess`, `lost`, `service`, `demand`), `error.one_step`/`seasonal_naive`, `reading.A`; `concentration.A` |
| `funnel.json` | `stages[]`, `money_at_stake` |
| `items.json` | `item_id`, `cell`, `treatment`, `spend_train`, `cv_train`, `first_block`, `metrics.A` (`wape_units`, `mae_units`, `rmsse_units`, `review`), `impact.A` (`demand`, `excess_model`, `excess_naive`, `lost_model`, `lost_naive`, `impact`, `impact_excess`, `impact_lost`, `z_model`, `z_naive`) |
| `catalog.json` | `item_id`, `cell`, `forecasted`, `first_block` (buscador) |
| `series/<id>.json` | `rows[]`: `block`, `units_observed`, `units_completed`, `forecast.A`, `baseline`, `money_observed` |
| `descriptive/<id>.json` | `rows[]`, `histogram[]`, `stats` (`mean`, `sigma`, `cv_pct`) |

Fecha de inicio de un periodo: `blocks[].start_date` (bloque 2 = 2011-06-27, +28 días por bloque).

## Cifras de control (deben coincidir)

| Dónde | Valor esperado |
|---|---|
| Impacto al 95 % · capital liberado | 3,28 M US$ (−77 %); línea base 4,23 M, pronóstico 0,95 M; z −0,01 y 0,71 (igual a `meta.headline.A.saving_excess95` = 3.276.162) |
| Impacto al 95 % · desglose | 0,55 + 1,33 + 1,40 = 3,28 M US$ |
| Impacto al 95 % · ventas recuperadas | 0,91 M US$; el pronóstico atiende 99,2 % (≈ `recovered_sales_same_excess` = 907.452) |
| Impacto al 95 % · ventas perdidas de ambos | 1,09 M US$ (5 % de 21,86 M) |
| Segmentos · Vitales | 592 artículos, 82,89 M US$, 21 % de los artículos clasificados y 60 % de la venta |
| Artículo FOODS_3_090 | Vitales recurrentes; WAPE 5,2 % (línea base 6,7 %); unidades pronosticadas 197.597 vs. 198.795 (real 197.619); costo total 14.042 vs. 128.579 US$; ahorro 114.537 US$ (39,8 % de 287.461 US$) |

## Instrucción sugerida para el agente

> Implementa en este repositorio los cambios descritos en `cambios_dash_ddr.md`, usando `mockup_dash_ddr.html` como referencia visual y de comportamiento. Trabaja en una rama nueva y por secciones, en el orden del documento. Lee todas las cifras de los JSON de `data/`; no copies los datos escritos en el mockup. Respeta la lista "Lo que NO se debe portar". Al terminar cada sección, verifica las "Cifras de control" y muéstrame un resumen de lo que cambiaste antes de seguir con la siguiente.
