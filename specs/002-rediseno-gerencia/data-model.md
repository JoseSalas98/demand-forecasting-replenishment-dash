# Data Model: Rediseño del tablero para gerencia

Sin cambios en los archivos exportados (ver `specs/001-forecast-results-dashboard/contracts/export-schema.md`). Entidades de la interfaz:

| Entidad | Origen | Campos usados | Reglas |
|---|---|---|---|
| Grupo | `segmentation.json` | `matrix[].cell`, `n_items`, `spend`; `radar.cells[cell][eje]` (`median_norm`, `median_raw`); `radar.global_median` | Nombre = familia (A Vitales, B Útiles, C Complementarios) + regularidad (X continuos, Y recurrentes, Z ocasionales). |
| Grupo pronosticado | `segments.json → segments.{AX,AY,AZ}` | `n_items`, `spend_train`, `spend_share`, `cv_train[]`, `error.one_step`, `error.seasonal_naive` | Solo A y línea base. |
| Curva de impacto | `segments.json → segments.{total,AX,AY,AZ}.curves.{A,naive}` | `z`, `excess`, `lost`, `service`, `demand` | 17 puntos por curva; lecturas derivadas según I.12 (`src/impactMath.ts`). |
| Cifra oficial al 95 % | `meta.json → headline.A` | `saving_excess95`, `saving_excess95_pct`, `recovered_sales_same_excess` | Se muestran tal cual cuando el control está en 95 %. |
| Concentración | `segments.json → concentration.A` | `for_50pct`, `for_80pct`, `improve`, `worsen`, `items` | — |
| Artículo | `items.json`, `catalog.json`, `series/<id>.json`, `descriptive/<id>.json` | ver `cambios_dash_ddr.md` | Tramo de test = `test_blocks`; fuera de los 517 no hay pronóstico (II.2). |
| Término del glosario | `src/glossary.ts` | `id`, `term`, `group`, `definition`, `technical`, `unit?` | Los ejes del radar (`spend`, `usage_units`, `cv`, `zero_share`, `velocity`) tienen unidad. |
