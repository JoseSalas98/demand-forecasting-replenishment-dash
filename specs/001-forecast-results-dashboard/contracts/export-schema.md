# Contrato: archivos exportados (`EXPORT_DIR`, por defecto `public/data/`)

Es la interfaz entre el exportador (Python) y el sitio (TypeScript). El sitio lee **solo** estos
archivos. Cambiar un campo exige cambiar este contrato, el exportador y los tipos del sitio en el
mismo cambio, y volver a exportar.

Convenciones:
- JSON UTF-8, números como número (sin redondear: la interfaz formatea), fechas ISO `YYYY-MM-DD`.
- Dato ausente = `null`. Nunca `0` en su lugar ni campo omitido.
- Dinero: US$ a precio de venta. El rótulo "a precio de venta, no es margen" lo pone la interfaz.
- Escenarios bajo llaves `"A"` y `"B"`; nunca un campo que los combine.

```text
public/data/
├── meta.json
├── funnel.json
├── segments.json
├── items.json
├── series/<item_id>.json        # 517 archivos (sin cambios en la iteración 2)
├── catalog.json                 # iteración 2: los 3.049
├── segmentation.json            # iteración 2: matriz y radar (solo si el proyecto de datos los congela)
└── descriptive/<item_id>.json   # iteración 2: 3.049 archivos
```

**Iteración 2 (solo adición).** Los cinco primeros tipos de archivo no cambian de forma. A
`meta.json` se le agregan `pending` y nuevas entradas en `sources` y `checks`.

## `meta.json`

```json
{
  "exported_at": "2026-11-13T21:00:00",
  "exporter_version": "0.1.0",
  "sources": [
    {"name": "targets", "path": "data/processed/targets.parquet", "frozen_at": "2026-11-01T23:02:02+00:00",
     "sha256": "fa0c41…", "check": "load_frozen"},
    {"name": "nb03b_datasets", "path": "data/interim/nb03b_datasets/manifest.json",
     "saved_at": "2026-11-07T08:25:38", "manifest_sha256": "…", "check": "load_tables"},
    {"name": "nb05_test", "...": "…"},
    {"name": "nb06_impact", "...": "…"},
    {"name": "interim", "path": "data/interim/", "check": "load_interim", "max_day": 1941}
  ],
  "versions": {"python": "3.12.3", "pandas": "3.1.0", "pyarrow": "26.0.0", "numpy": "2.5.4"},
  "last_day": 1941,
  "blocks": [{"block": 2, "start_date": "2011-06-27"}, {"block": 65, "start_date": "2016-04-25"}],
  "period": {"start": "2011-06-27", "end": "2016-05-22"},
  "test": {"n_blocks": 13, "typical_range": [53, 65]},
  "wrmsse_units": {"one_step": 0.49477, "chained": 0.74790, "seasonal_naive": 0.86793},
  "service": {"target": 0.95, "z_values": [-1.0, -0.75, "…", 3.0]},
  "total_demand_test": 21856215.56,
  "headline": {
    "A": {"saving_excess95": 3276162.34, "saving_excess95_pct": 77.488,
          "recovered_sales_same_excess": 907451.60, "recovered0_pct": 50.58},
    "B": {"saving_excess95": 1008171.08, "saving_excess95_pct": 23.845,
          "recovered_sales_same_excess": 251610.72, "recovered0_pct": 18.29}
  },
  "checks": [{"name": "items_517", "passed": true}, {"name": "impact_sum_matches_total_A", "passed": true}]
}
```

## `funnel.json`

```json
{
  "stages": [
    {"key": "series", "label": "Series tienda × artículo", "count": 30490},
    {"key": "items", "label": "Artículos (suma de 10 tiendas)", "count": 3049},
    {"key": "segment_a", "label": "Segmento A", "count": 592, "by_cell": {"AX": 207, "AY": 251, "AZ": 134}},
    {"key": "forecasted", "label": "Pronosticados", "count": 517, "by_cell": {"AX": 191, "AY": 229, "AZ": 97}}
  ],
  "money_at_stake": {"train_spend_share_517": 0.52191, "test_demand_517": 21856215.56}
}
```

La búsqueda de la iteración 2 usa `catalog.json` (3.049); `items.json` sigue siendo solo los 517.

## `segments.json`

```json
{
  "segments": {
    "AX": {
      "n_items": 191, "spend_train": 0.0, "spend_share": 0.0,
      "cv_train": [13.74, 15.2, "…"],
      "error": {"one_step": {"wrmsse": 0.60005, "wape": 0.07459},
                "chained": {"wrmsse": 0.87754, "wape": 0.11293},
                "seasonal_naive": {"wrmsse": 0.95141, "wape": 0.12754}},
      "impact": {"A": {"demand": 0.0, "impact_lost": 0.0, "impact_excess": 0.0, "impact": 0.0, "impact_pct_demand": 0.0},
                 "B": {"…": "…"}},
      "reading": {"A": {"z95_model": -0.1632, "z95_naive": 0.5304, "excess95_model": 0.0, "excess95_naive": 0.0,
                        "saving_excess95": 0.0, "saving_excess95_pct": 0.0, "recovered_sales_same_excess": 0.0,
                        "lost0_model": 0.0, "lost0_naive": 0.0, "excess0_model": 0.0, "excess0_naive": 0.0,
                        "recovered0_pct": 0.0, "recovered95_pct": 0.0},
                  "B": {"…": "…"}},
      "curves": {"A": [{"z": -1.0, "demand": 0.0, "captured": 0.0, "lost": 0.0, "excess": 0.0, "short_blocks": 0, "service": 0.894}],
                 "B": ["…"], "naive": ["…"], "perfect": ["…"]},
      "ab": {"excess95_A": 0.0, "excess95_B": 0.0, "excess95_extra_B": 0.0,
             "mismatch0_A": 0.0, "mismatch0_B": 0.0, "mismatch0_extra_B": 0.0}
    },
    "AY": {"…": "…"}, "AZ": {"…": "…"}, "total": {"…": "…"}
  },
  "concentration": {"A": {"items": 517, "improve": 490, "worsen": 27, "for_50pct": 55, "for_80pct": 179, "impact_total": 3269259.0},
                    "B": {"…": "…"}}
}
```

`cv_train` es la lista de los `cv_train` de los artículos del segmento (de `targets`), ordenada,
para dibujar su distribución; no se exporta ningún estadístico calculado sobre ella.

Mapeo de `curves.forecast`: `a un paso` → `A`, `encadenado` → `B`, `seasonal naive` → `naive`,
`perfecto` → `perfect`. Las curvas de `naive` y `perfect` son referencias comunes a los dos
escenarios.

## `items.json`

```json
{
  "items": [
    {
      "item_id": "FOODS_1_004", "cell": "AY", "treatment": "periodic_review_replenishment",
      "spend_train": 0.0, "spend_share": 0.0, "cv_train": 0.0,
      "test_blocks": [53, 65],
      "first_block": 13,
      "metrics": {"A": {"rmsse_units": 0.4131, "wape_units": 0.1356, "mae_units": 295.34, "review": false},
                  "B": {"rmsse_units": 0.7480, "wape_units": 0.2879, "mae_units": 627.13, "review": false}},
      "impact": {"A": {"demand": 53537.21, "lost_model": 2769.41, "excess_model": 4673.65,
                       "lost_naive": 222.20, "excess_naive": 18779.41,
                       "impact_lost": -2547.22, "impact_excess": 14105.76, "impact": 11558.54,
                       "impact_pct_demand": 21.59, "z_model": -0.01194, "z_naive": 0.71149},
                 "B": {"…": "…"}}
    }
  ]
}
```

Exactamente 517 elementos, ordenados por `cell` y luego por `spend_train` descendente.

## `series/<item_id>.json`

```json
{
  "item_id": "FOODS_1_004",
  "rows": [
    {"block": 2, "units_observed": 0.0, "money_observed": 0.0, "units_completed": null, "ratio_completed": null,
     "step": null, "forecast": null, "baseline": null},
    {"block": 53, "units_observed": 3371.0, "money_observed": 6607.16, "units_completed": 3371.0,
     "ratio_completed": 0.9230, "step": 1, "forecast": {"A": 3682.74, "B": 3682.74}, "baseline": 2579.86}
  ]
}
```

Una fila por bloque 2–65. `forecast` y `baseline` son `null` fuera del test. Antes de
`first_block` (primer bloque con venta del artículo) la serie no existe: `units_observed` y
`money_observed` son `null` y la interfaz no muestra esos bloques.

## Iteración 2

### `meta.json` (campos nuevos)

```json
{
  "sources": [
    {"name": "segmentation_items", "path": "data/processed/segmentation_items.parquet",
     "frozen_at": "…", "sha256": "…", "check": "load_frozen"},
    {"name": "radar_profiles", "path": "data/processed/radar_profiles.parquet",
     "frozen_at": "…", "sha256": "…", "check": "load_frozen"}
  ],
  "pending": [
    {"name": "segmentation_items", "reason": "no está declarado en data/processed/manifest.json"}
  ],
  "checks": [
    {"name": "catalog_3049", "passed": true},
    {"name": "segmentation_matches_targets", "passed": true},
    {"name": "matrix_sums_classified", "passed": true}
  ]
}
```

- `pending` es una lista vacía cuando están todas las fuentes.
- Una fuente pendiente **no** aparece en `sources`. Si una fuente está declarada pero falla su
  hash o sus columnas, la exportación falla completa y no se escribe nada.

### `catalog.json`

```json
{
  "items": [
    {"item_id": "FOODS_3_655", "dept": "FOODS_3", "cell": "AX", "abc_class": "A", "xyz_class": "X",
     "forecasted": true, "first_block": 2}
  ]
}
```

- Contiene exactamente 3.049 elementos (`item_index`), ordenados por `item_id`.
- `dept` es el prefijo del `item_id`, para filtrar mientras se escribe.
- `forecasted` vale `true` para los 517 de `items.json`.
- `cell`, `abc_class` y `xyz_class` salen de `segmentation_items`. Son `null` si esa fuente está
  pendiente. `xyz_class = "-"` significa sin clase XYZ; esos artículos no aparecen en la matriz.

### `segmentation.json` (solo si `segmentation_items` y `radar_profiles` existen)

```json
{
  "matrix": [
    {"abc_class": "A", "xyz_class": "X", "cell": "AX", "n_items": 207, "spend": 0.0}
  ],
  "total_items": 2887,
  "excluded_no_xyz": 162,
  "radar": {
    "axes": ["spend", "usage_units", "cv", "zero_share", "velocity"],
    "global_median": {"spend": 0.0, "…": 0.0},
    "cells": {"AX": {"spend": {"median_raw": 0.0, "median_norm": 0.0}, "…": {}}, "…": {}}
  }
}
```

- `matrix` tiene las 9 celdas ABC × XYZ; los artículos sin clase XYZ (`-`) no entran.
- `Σ n_items` = `total_items` (2.887); `total_items + excluded_no_xyz` = 3.049.
- El radar tampoco incluye celdas sin clase XYZ.
- `radar` se copia de `radar_profiles`: la exportación no calcula medianas (I.11).

### `descriptive/<item_id>.json`

```json
{
  "item_id": "FOODS_3_655",
  "first_block": 2,
  "rows": [{"block": 2, "units_observed": 5321.0, "money_observed": 7980.5}],
  "stats": {"n_blocks": 64, "mean": 0.0, "sigma": 0.0, "band_upper": 0.0, "band_lower": 0.0,
            "cv_pct": 0.0},
  "histogram": [{"from": 0.0, "to": 0.0, "count": 0}]
}
```

- `rows` va del `first_block` al 65, con las mismas sumas por bloque que `series/`.
- `first_block` (aquí y en `catalog.json`) es el **lanzamiento**: el primer bloque con venta
  observada > 0 (constitución II.8). En `items.json`, `first_block` es el inicio de la serie
  modelada (`boosting_data`), que en 186 de los 517 artículos empieza de 1 a 26 bloques después;
  `series/` no cambia.
- `stats` se calcula sobre `rows[].units_observed`:
  - `sigma` es poblacional (`ddof=0`).
  - `band_* = mean ± 3·sigma`; `band_lower` puede ser < 0.
  - `cv_pct = sigma / mean · 100`.
  - Con un solo bloque, `sigma`, las bandas y `cv_pct` valen `null`. Con media 0, `cv_pct` vale
    `null`.
- `histogram` tiene 8 intervalos de igual ancho entre el mínimo y el máximo (uno solo si son
  iguales), con `Σ count = n_blocks`.
