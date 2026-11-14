# Data Model: Frontend de resultados del pronóstico de reposición

Entidades del sitio, de dónde sale cada campo y qué se valida al exportar. Los nombres de campo son
los de los JSON exportados (en inglés, constitución V.1); el esquema exacto está en
[contracts/export-schema.md](contracts/export-schema.md).

Convención de origen: `T` = `targets` (`load_frozen`), `DS` = `nb03b_datasets`, `TE` = `nb05_test`,
`IM` = `nb06_impact` (todas con `load_tables`), `INT` = intermedios (`load_interim`).

## Escenario

Valor fijo: `A` ("A · a un paso", forma `a un paso`) o `B` ("B · encadenado", forma `encadenado`).
La línea base (`seasonal naive`) es común a los dos. **Regla**: ningún campo combina A y B; todo
campo que dependa del escenario vive bajo una llave `A` o `B`.

## Bloque

| Campo | Origen | Regla |
|---|---|---|
| `block` | `DS.boosting_data.block` | entero 2–65, global |
| `start_date` | `DS.boosting_data.start_date` | ISO `YYYY-MM-DD`; único por bloque |
| `is_test` | `TE.forecasts` | true si (artículo, bloque) está en `forecasts` |

## Artículo (517)

| Campo | Origen | Regla |
|---|---|---|
| `item_id` | `DS` manifiesto (`n_items = 517`) | 517 únicos; todos en `T` |
| `cell` | `T.cell` | `AX`, `AY` o `AZ`; igual a `DS.boosting_data.cell` |
| `treatment` | `T.treatment` | texto |
| `spend_train` | `T.spend_train` | ≥ 0, US$ a precio de venta |
| `spend_share` | `T.spend_share` | 0–1 |
| `cv_train` | `T.cv_train` | ≥ 0 |
| `test_blocks` | `TE.forecasts.block` | exactamente 13 por artículo |
| `metrics.A/B` | `TE.item_metrics` (`form`) | `rmsse_units`, `wape_units`, `mae_units`, `review`; ≥ 0 |
| `impact.A/B` | `IM.item_impact` (`scenario`) | `demand`, `lost_model`, `excess_model`, `lost_naive`, `excess_naive`, `impact_lost`, `impact_excess`, `impact`, `impact_pct_demand`, `z_model`, `z_naive` |

Validación: `demand`, `lost_*`, `excess_*` ≥ 0. `impact*` puede ser negativo (el modelo empeora
frente a la línea base) y **no** se rechaza: es el ahorro frente a la línea base, no un monto (constitución III.3); en pantalla se rotula
"Ahorro frente a no hacer nada".

## Serie del artículo (por artículo × bloque)

| Campo | Origen | Regla |
|---|---|---|
| `units_observed` | `Σ INT.item_units` en los 28 días del bloque | ≥ 0 |
| `money_observed` | `Σ INT.item_spend` en los 28 días del bloque | ≥ 0, US$ a precio de venta |
| `units_completed` | `DS.boosting_data.units` | ≥ 0; ausente antes del primer bloque del artículo |
| `ratio_completed` | `DS.boosting_data.ratio_raw` (= `units / units_prev`, sin nulos; `ratio` tiene 105 nulos) | ≥ 0 o `null` |
| `forecast.A` | `TE.forecasts.units_1step` | ≥ 0; solo bloques de test |
| `forecast.B` | `TE.forecasts.units_chain` | ≥ 0; solo bloques de test |
| `baseline` | `TE.forecasts.units_snaive` | ≥ 0; solo bloques de test |
| `step` | `TE.forecasts.step` | 1–13; solo bloques de test |

Reglas: `units_observed` y `units_completed` nunca se suman; un campo sin dato se exporta `null`
y la interfaz lo muestra "no disponible". La venta completada no tiene dinero (research R6).

## Segmento (AX, AY, AZ, total)

| Campo | Origen | Regla |
|---|---|---|
| `n_items` | conteo de artículos por `cell` | suma de AX+AY+AZ = 517 |
| `cv_train` | lista ordenada de `T.cv_train` de los artículos del segmento | sin estadísticos nuevos; ≥ 0 |
| `spend_train`, `spend_share` | `Σ T` sobre los artículos del segmento | ≥ 0 |
| `wrmsse` / `wape` por forma | `TE.metrics` (`nivel = unidades`, `step` nulo) | forma ∈ {a un paso, encadenado, seasonal naive} |
| `impact.A/B` | `IM.by_segment` | igual a `Σ` de `item_impact` del segmento (tolerancia 0,01) |
| `reading.A/B` | `IM.readings` | lecturas a z95 y z = 0 |
| `curves.A/B/perfect/naive` | `IM.curves` | 17 valores de z (−1 a 3, paso 0,25) |
| `ab` | `IM.ab` | exceso al 95 % de A frente a B |

## Etapa del embudo

| Etapa | Conteo | Origen |
|---|---|---|
| `series` | 30.490 | filas de `INT.series_index` |
| `items` | 3.049 | filas de `INT.item_index` |
| `segment_a` | 592 (AX 207, AY 251, AZ 134) | filas de `T` |
| `forecasted` | 517 (AX 191, AY 229, AZ 97) | `DS` manifiesto `n_items` y `boosting_data` |

Búsqueda: solo entre los 517 `item_id` de `items.json`. Un identificador fuera de los 517 recibe
"no está entre los 517 pronosticados", sin etapa (constitución II.2).

## Métrica global

`wrmsse_units` del manifiesto de `TE`: a un paso 0,4948; encadenado 0,7479; seasonal naive 0,8679.
`headline` del manifiesto de `IM` por escenario.

## Manifiesto de exportación

Por cada fuente leída: ruta relativa, `saved_at` o `frozen_at`, SHA-256 del archivo de manifiesto
(y de `targets.parquet`, ya verificado por `load_frozen`), `source` y `versions`. Más: fecha de la
exportación, versión del exportador y resultado de cada verificación.

## Validaciones del exportador (fallan toda la exportación)

1. Falta una ruta de trabajo, una tabla o su manifiesto; `load_frozen` o `load_tables` fallan.
2. Unidades, ratio o dinero negativos en campos marcados ≥ 0 → error con `item_id`, `block`, columna.
3. Artículos ≠ 517, o segmentos que no suman 517, o un artículo sin 13 bloques de test.
4. `Σ item_impact` ≠ total de `by_segment` por escenario (tolerancia 0,01 US$).
5. WRMSSE o `headline` exportados ≠ manifiesto.
6. Se escribe primero en un directorio temporal y se reemplaza `EXPORT_DIR` solo si todo pasó.

## Iteración 2 (constitución 1.0.0)

Origen nuevo: `SEG` = `segmentation_items` y `radar_profiles` (`load_frozen`, **pendientes**
hasta que el proyecto de datos los congele; research R10–R11).

### Artículo del catálogo (3.049)

| Campo | Origen | Regla |
|---|---|---|
| `item_id` | `INT.item_index` | 3.049 únicos |
| `dept` | prefijo de `item_id` | texto |
| `cell`, `abc_class`, `xyz_class` | `SEG.segmentation_items` | `null` si `SEG` está pendiente. Para los 592 de `targets`, igual a `T.cell` |
| `forecasted` | pertenece a `items.json` | exactamente 517 en `true` |
| `first_block` | primer bloque con `units_observed > 0` | 2–65 |

### Serie descriptiva (artículo × bloque, 3.049)

| Campo | Origen | Regla |
|---|---|---|
| `units_observed`, `money_observed` | `Σ INT.item_units` / `item_spend` por bloque | ≥ 0; del `first_block` al 65 |
| `stats.mean`, `stats.sigma` | calculados (I.10) | ≥ 0; `sigma` con `ddof=0` |
| `stats.band_upper`, `band_lower` | `mean ± 3·sigma` | `band_lower` puede ser < 0: es un estadístico, no unidades |
| `stats.cv_pct` | `sigma / mean · 100` | ≥ 0 o `null` |
| `histogram` | 8 intervalos de igual ancho | `Σ count = n_blocks` |

### Celda de la matriz y perfil del radar

| Campo | Origen | Regla |
|---|---|---|
| `n_items`, `spend` por celda | conteo y suma sobre `SEG.segmentation_items` con `xyz_class ≠ "-"` | `Σ n_items` = 3.049 − sin clase XYZ (2.887) |
| `radar.cells[cell][axis]` | `SEG.radar_profiles` (`median_raw`, `median_norm`) | copiado, nunca calculado |

### Validaciones nuevas

1. Las validaciones 1–6 actuales quedan **sin cambios**.
2. Fallan toda la exportación:
   - el catálogo no tiene 3.049 artículos o hay `item_id` repetidos;
   - unidades o dinero negativos en `descriptive`;
   - `Σ count` del histograma ≠ `n_blocks`.
3. Si `SEG` está declarado, también fallan toda la exportación:
   - su hash o sus columnas no coinciden;
   - `segmentation_items` no tiene 3.049 filas, o la matriz no suma 3.049 − los sin clase XYZ;
   - AX/AY/AZ no coinciden con `targets` (mismos `item_id`).
4. Si `SEG` no está declarado, la exportación no falla: lo registra en `meta.pending` y no
   escribe `segmentation.json`.
