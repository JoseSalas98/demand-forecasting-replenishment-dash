---

description: "Task list for the forecast results dashboard (export script + static site)"
---

# Tasks: Frontend de resultados del pronóstico de reposición

**Input**: Design documents from `/specs/001-forecast-results-dashboard/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/export-schema.md,
contracts/ui-routes.md, quickstart.md

**Tests**: incluidas, porque plan.md (T4) y quickstart.md las piden: `pytest` para las invariantes
del exportador y `vitest` para los formateadores. Las cifras finales las valida el usuario con
quickstart.md §4.

**Organization**: por historia de usuario, en orden de prioridad: US1 (P1) → US2 (P1) → US4 (P1) →
US3 (P2) → US5 (P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivo distinto, sin dependencias pendientes)
- **[Story]**: historia de spec.md (US1…US5)

## Reglas que aplican a TODAS las tareas (leer antes de empezar)

- Código en inglés; comentarios y docstrings en español. Docstrings Python con una sola estructura:
  descripción, `Parámetros:` (nombre, tipo, descripción) y `Retorno:` (constitución V).
- El exportador **solo lee** con `src.freeze.load_frozen`, `src.data.load_tables` y
  `src.data.load_interim` del proyecto de datos. Prohibido `pd.read_parquet` / `np.load` directo
  sobre sus datos. Nunca recalcula segmentación, pronóstico ni impacto; solo suma la venta diaria
  por bloque.
- Ninguna ruta escrita en el código: `DATA_PROJECT_ROOT` y `EXPORT_DIR` vienen de `.env`.
- Campos de escenario siempre bajo llaves `"A"` / `"B"`; nada combina A y B.
- Dato ausente = `null` en JSON y "no disponible" en pantalla; nunca `0`.
- Todo dinero en pantalla pasa por `src/components/Money.tsx` (rótulo "a precio de venta, no es
  margen").
- Mapeos de escenario de las salidas del modelo:
  `item_impact.scenario` / `readings.scenario` / `by_segment.scenario` / `concentration.scenario`:
  `"A · a un paso"` → `A`, `"B · encadenado"` → `B`.
  `item_metrics.form` y `metrics.form`: `"a un paso"` → `A` / `one_step`, `"encadenado"` → `B` /
  `chained`, `"seasonal naive"` → `seasonal_naive`.
  `curves.forecast`: `"a un paso"` → `A`, `"encadenado"` → `B`, `"seasonal naive"` → `naive`,
  `"perfecto"` → `perfect`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: inicializar el repositorio y las dos piezas (exportador y sitio).

- [X] T001 Inicializar Git en la raíz (`git init -b main`) y crear `.gitignore` con `node_modules/`, `dist/`, `.env`, `__pycache__/`, `.pytest_cache/` en .gitignore (NO ignorar `public/data/`: es la versión fijada, constitución I.5)
- [X] T002 Crear `.env.example` con `DATA_PROJECT_ROOT=/ruta/absoluta/al/proyecto/de/datos` y `EXPORT_DIR=public/data`, y crear `.env` (ignorado) con `DATA_PROJECT_ROOT=/ruta/absoluta/al/proyecto/de/datos` y `EXPORT_DIR=public/data` en .env.example y .env
- [X] T003 Crear `package.json` con scripts `dev` (`vite`), `build` (`tsc -b && vite build`), `preview` (`vite preview`), `test` (`vitest run`); dependencias con versión exacta (sin `^`), resueltas con `npm view <pkg>@<rango> version` y tomando la última del rango: `react@19.1.x`, `react-dom@19.1.x`, `recharts@2.15.x`; devDependencies `vite@6.3.x`, `@vitejs/plugin-react@4.x`, `typescript@5.8.x`, `vitest@3.1.x`, `@types/react@19.1.x`, `@types/react-dom@19.1.x`; `"engines": {"node": ">=18.19"}`; luego `npm install` en package.json
- [X] T004 [P] Crear `vite.config.ts` con el plugin de React y `base: './'` (rutas relativas para GitHub Pages en `/<repo>/`) en vite.config.ts
- [X] T005 [P] Crear `tsconfig.json` (strict, `jsx: react-jsx`, `moduleResolution: bundler`, `include: ["src", "tests"]`) en tsconfig.json
- [X] T006 [P] Crear `index.html` con `<html lang="es">`, título "Pronóstico de reposición", `<div id="root">` y `<script type="module" src="/src/main.tsx">` en index.html
- [X] T007 [P] Crear la carpeta `export/` con `export/__init__.py` vacío y `export/tests/__init__.py` vacío, y `export/conftest.py` que agrega la raíz del repo a `sys.path` en export/conftest.py

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: el esqueleto del exportador (rutas, carga verificada, validación, escritura atómica,
`meta.json`) y del sitio (tipos, carga, formato, dinero, escenario, navegación). Bloquea todas las
historias.

### Exportador

- [X] T008 Implementar `read_env(repo_root: Path) -> dict` en export/export_data.py: lee `.env` de la raíz del repo (parser propio de líneas `CLAVE=valor`, sin dependencias), exige `DATA_PROJECT_ROOT` y `EXPORT_DIR`; si falta una o `DATA_PROJECT_ROOT` no existe o no contiene `data/`, `src/` y `models/`, lanza `ExportError` con el nombre de la variable. `EXPORT_DIR` relativo se resuelve contra la raíz del repo
- [X] T009 Implementar `load_sources(data_root: Path) -> dict` en export/export_data.py: hace `os.chdir(data_root)` y `sys.path.insert(0, str(data_root))` (load_frozen y la configuración usan rutas relativas, research R8); `cfg = src.config.load_validated_config()`; `targets = src.freeze.load_frozen("targets")`; `ds, ds_manifest = load_tables("data/interim/nb03b_datasets")`; `te, te_manifest = load_tables("data/interim/nb05_test")`; `im, im_manifest = load_tables("data/interim/nb06_impact")`; `interim = load_interim(cfg, cfg["data"]["last_day"], series_level=True)` (incluye `series_index`); `calendar = src.data.load_calendar(cfg)`. Cualquier excepción se re-lanza como `ExportError` con el nombre de la fuente. Devuelve todo en un dict
- [X] T010 Implementar `source_records(data_root: Path, manifests: dict) -> list[dict]` en export/export_data.py: por fuente (`targets`, `nb03b_datasets`, `nb05_test`, `nb06_impact`, `interim`) arma `{name, path, saved_at|frozen_at, sha256 (de targets.parquet, desde data/processed/manifest.json leído con src.freeze.load_manifest), manifest_sha256 (hashlib.sha256 del archivo manifest.json), check}` según contracts/export-schema.md `meta.json.sources`
- [X] T011 Implementar `block_calendar(boosting_data, calendar, last_day) -> pd.DataFrame` en export/export_data.py: bloques 2–65 con `start_date` de `boosting_data` (único por bloque; si un bloque tiene dos fechas → `ExportError`), y días `first_day = last_day − 28·(65 − block) − 27`, `last_day_block = last_day − 28·(65 − block)`; verifica con `calendar` (columna `d` = `d_<día>`, `date`) que la fecha del `first_day` == `start_date` de cada bloque; si no → `ExportError`
- [X] T012 Implementar `check_non_negative(df, columns, where) -> None` en export/export_data.py: si algún valor no nulo < 0 en `columns`, lanza `ExportError` listando cada caso con `item_id`, `block` (si existe) y columna (constitución III.3)
- [X] T013 Implementar `write_export(files: dict[str, object], export_dir: Path) -> None` en export/export_data.py: escribe todos los JSON (`ensure_ascii=False`, `allow_nan=False`; convertir NaN/NA a `None` antes) en un directorio temporal hermano de `export_dir` y solo al final reemplaza `export_dir` (renombrar el viejo, mover el nuevo, borrar el viejo). Si algo falla, `export_dir` queda intacto
- [X] T014 Implementar `build_meta(sources, cal, te_manifest, im_manifest, checks) -> dict` en export/export_data.py según `meta.json` de contracts/export-schema.md: `exported_at` (hora local ISO), `exporter_version="0.1.0"`, `sources`, `versions` (de `te_manifest["versions"]`), `last_day=1941`, `blocks`, `test={"n_blocks": 13, "typical_range": [53, 65]}`, `wrmsse_units` (`"a un paso"`→`one_step`, `"encadenado"`→`chained`, `"seasonal naive"`→`seasonal_naive`), `service={"target": im_manifest["target_service"], "z_values": im_manifest["z_values"]}`, `total_demand_test=im_manifest["total_demand"]`, `headline` (`"A · a un paso"`→`A`, `"B · encadenado"`→`B`; claves `ahorro_exceso95`→`saving_excess95`, `ahorro_exceso95_%`→`saving_excess95_pct`, `venta_recuperada_igual_exceso`→`recovered_sales_same_excess`, `recupera0_%`→`recovered0_pct`), `checks`
- [X] T015 Implementar `main() -> int` en export/export_data.py: `read_env` → `load_sources` → construir los archivos (cada historia agrega su builder a una lista `BUILDERS` de funciones `(sources) -> dict[str, object]`) → acumular `checks` → `build_meta` → `write_export`. Registra con `logging` (nivel INFO) cada fuente leída con su fecha y cada archivo escrito; ante `ExportError` registra el error y devuelve 1 sin escribir nada; `if __name__ == "__main__": sys.exit(main())`
- [X] T016 [P] Crear las pruebas base en export/tests/test_export.py: (a) `read_env` con `DATA_PROJECT_ROOT` inexistente lanza `ExportError`; (b) `check_non_negative` con un `-1` en `units` lanza y el mensaje contiene `item_id`, `block` y `units`; (c) `write_export` con un archivo que no serializa (NaN con `allow_nan=False`) deja intacto un `export_dir` previo (usar `tmp_path`)
- [X] T017 Ejecutar `"$DATA_PROJECT_ROOT/.venv/bin/python" export/export_data.py` con `BUILDERS` vacío y verificar que escribe solo `public/data/meta.json` con 5 fuentes y los WRMSSE 0,4948 / 0,7479 / 0,8679

### Sitio

- [X] T018 [P] Crear los tipos TypeScript del contrato en src/types.ts: `Scenario = 'A' | 'B'`, `Meta`, `Funnel`, `Segments`, `SegmentData`, `Items`, `Item`, `ItemSeries`, `SeriesRow` exactamente con los campos de contracts/export-schema.md; todo campo que puede ser `null` en el contrato se tipa `number | null`
- [X] T019 [P] Crear src/format.ts con: `fmtNumber(v: number | null, decimals = 0): string` (Intl `es-ES`, punto de miles, coma decimal; `null`/no finito → `"no disponible"`), `fmtMoney(v: number | null): string` (≥ 1 M → `"3,28 M US$"`, si no `"11.558,54 US$"`), `fmtPct(v: number | null, decimals = 1)` (recibe 0–100), `fmtRatio(cur, prev)` (prev 0 o null → `"no disponible"`), y la constante `MONEY_LABEL = "a precio de venta, no es margen"`
- [X] T020 [P] Crear tests/format.test.ts con vitest: `fmtNumber(1234.5, 1)` → `"1.234,5"`; `fmtNumber(null)` → `"no disponible"`; `fmtMoney(3276162.34)` → `"3,28 M US$"`; `fmtRatio(5, 0)` → `"no disponible"`; `fmtNumber(0)` → `"0"` (cero real no es ausente)
- [X] T021 Crear src/data.ts: `loadJson<T>(path: string): Promise<T>` que hace `fetch(import.meta.env.BASE_URL + 'data/' + path)` y lanza un `Error` con la ruta si `!res.ok`; un caché en memoria por ruta; y `useData<T>(path)` (hook con estados `loading` / `error` / `data`)
- [X] T022 [P] Crear src/components/Money.tsx: `<Money value={number | null} />` muestra `fmtMoney(value)` y, debajo o al lado en texto pequeño, `MONEY_LABEL`; prop opcional `compact` que solo cambia el tamaño, nunca quita el rótulo
- [X] T023 [P] Crear src/components/StateViews.tsx con `<Loading />` y `<LoadError error />` (muestra el mensaje y "no disponible"; nunca un blanco silencioso)
- [X] T024 Crear src/router.ts: `parseHash(hash: string): {route: string, params: Record<string,string>, scenario: Scenario}` para las rutas de contracts/ui-routes.md (`#/`, `#/segmentos`, `#/segmentos/:cell`, `#/articulo/:item_id`, `#/articulo/:item_id/playground`, `#/datos`) con `?esc=A|B` (por defecto `A`), `hashFor(route, params, scenario)` y `useRoute()` que escucha `hashchange`
- [X] T025 [P] Crear src/components/ScenarioToggle.tsx: dos botones "A · a un paso" / "B · encadenado" que cambian solo `?esc` del hash actual; muestra siempre el escenario activo
- [X] T026 Crear src/App.tsx (encabezado con navegación a Embudo / Segmentos / Origen de los datos, `ScenarioToggle`, y un `switch` sobre `useRoute().route` que por ahora muestra "en construcción" por vista) y src/main.tsx (monta `<App />`), y src/styles.css (sistema tipográfico simple, ancho máximo 1200 px, colores fijos: venta observada gris, venta completada azul, modelo naranja, línea base gris oscuro punteado)

**Checkpoint**: `npm run dev` muestra la cabecera y el selector; `npm test` y `pytest export/tests` pasan.

---

## Phase 3: User Story 1 - Embudo y dinero en juego (Priority: P1) 🎯 MVP

**Goal**: la portada con el embudo 30.490 → 3.049 → 592 → 517, el dinero en juego, el WRMSSE, el
titular de A al 95 % y el buscador de artículos.

**Independent Test**: exportar y abrir `#/`: el embudo termina en 517; "salen 75"; dinero con
rótulo; buscar un artículo fuera de los 517 dice "fuera del universo pronosticado" sin cifras.

### Tests for User Story 1

- [X] T027 [P] [US1] Agregar a export/tests/test_export.py pruebas sobre la salida real (`public/data/funnel.json`, saltar con `pytest.skip` si no existe): conteos `[30490, 3049, 592, 517]`; `by_cell` de 592 = `{"AX": 207, "AY": 251, "AZ": 134}` y de 517 = `{"AX": 191, "AY": 229, "AZ": 97}`; las únicas claves de primer nivel son `stages` y `money_at_stake` (no hay lista de artículos fuera de los 517, constitución II.2)

### Implementation for User Story 1

- [X] T028 [US1] Implementar `build_funnel(sources) -> dict[str, object]` en export/export_data.py y agregarlo a `BUILDERS`: `series` = `len(interim["series_index"])`, `items` = `len(interim["item_ids"])`, `segment_a` = `len(targets)` con `by_cell` de `targets.cell`, `forecasted` = `ds_manifest["n_items"]` con `by_cell` de `boosting_data` (un `cell` por `item_id`); verifica que el conteo de `forecasted` == 517 == ítems únicos de `boosting_data` y que todos están en `targets` (si no → `ExportError`); `money_at_stake = {"train_spend_share_517": Σ targets.spend_share de los 517, "test_demand_517": im_manifest["total_demand"]}`. NO exportar ninguna lista de artículos (constitución II.2). Escribe `funnel.json`
- [X] T029 [US1] Crear src/components/charts/FunnelChart.tsx: barras horizontales (Recharts `BarChart layout="vertical"`) con las 4 etapas, etiqueta con `fmtNumber(count)` y el desglose `by_cell` en texto; entre 592 y 517 la nota "salen 75" (calculada como diferencia de conteos exportados para mostrarla, no como dato nuevo)
- [X] T030 [US1] Crear src/components/ItemSearch.tsx: input con autocompletado sobre los `item_id` de `items.json` (cargarlo con `useData`; si `items.json` aún no existe, el buscador muestra "no disponible"); al elegir uno navega a `#/articulo/:id` y muestra su segmento; cualquier otro texto muestra solo "no está entre los 517 pronosticados", sin etapa, enlace ni datos (constitución II.2)
- [X] T031 [US1] Crear src/views/FunnelView.tsx (ruta `#/`): lee `meta.json` y `funnel.json`; muestra `FunnelChart`; dos tarjetas de dinero en juego rotuladas por separado — "% del gasto de train (años 1–4)" con `fmtPct(train_spend_share_517*100)` y "Demanda del año de test" con `<Money>`; una tarjeta "Error en test (WRMSSE, unidades)" con los tres valores con 3 decimales; la tarjeta del titular del escenario activo (`meta.headline[scenario]`): ahorro de exceso al 95 % (`<Money>` + `fmtPct`) y venta recuperada con el mismo exceso (`<Money>`), rotulada "al 95 % de servicio, curvas del total"; y `ItemSearch`. Conectar en src/App.tsx

**Checkpoint**: la portada cumple quickstart §4 filas 1, 2, 3 (la fila 10 requiere `items.json`, de US2).

---

## Phase 4: User Story 2 - Segmentación (Priority: P1)

**Goal**: comparar AX/AY/AZ/total y entrar al detalle de cada segmento con su lista de artículos.

**Independent Test**: `#/segmentos` muestra 191 + 229 + 97 = 517; `#/segmentos/AY` lista 229
artículos ordenables y cada uno enlaza a su ficha.

### Tests for User Story 2

- [X] T032 [P] [US2] Agregar a export/tests/test_export.py: cada segmento de `segments.json` tiene `cv_train` como lista ordenada con `n_items` valores ≥ 0; `items.json` tiene 517 elementos con `item_id` únicos; cada `cell` ∈ {AX, AY, AZ}; `segments.json` `n_items` AX+AY+AZ == 517 == total; para cada escenario, `Σ items[*].impact[esc].impact` vs `segments.total.impact[esc].impact` con diferencia ≤ 0,01 (también `impact_excess`, `impact_lost`, `demand`); cada segmento tiene 17 puntos de curva por clave (`A`, `B`, `naive`, `perfect`)

### Implementation for User Story 2

- [X] T033 [US2] Implementar `build_items(sources) -> dict[str, object]` en export/export_data.py y agregarlo a `BUILDERS`: una fila por artículo de los 517 con `item_id`, `cell`, `treatment`, `spend_train`, `spend_share`, `cv_train` (de `targets`); `test_blocks=[min, max]` de `te["forecasts"].block` (exige exactamente 13 filas por artículo, si no `ExportError`); `metrics.A/B` de `item_metrics` (`rmsse_units`, `wape_units`, `mae_units`, `review`); `impact.A/B` de `item_impact` con renombres `lost_modelo→lost_model`, `excess_modelo→excess_model`, `lost_naive`, `excess_naive`, `impacto_perdida→impact_lost`, `impacto_exceso→impact_excess`, `impacto→impact`, `impacto_%_demanda→impact_pct_demand`, `z_modelo→z_model`, `z_naive`. Validar con `check_non_negative`: `spend_train`, `cv_train`, `rmsse_units`, `wape_units`, `mae_units`, `demand`, `lost_*`, `excess_*` (NO `impact*`: es una diferencia y puede ser negativa, constitución III.3 v0.2.1). Ordenar por `cell` y `spend_train` descendente. Escribe `items.json`
- [X] T034 [US2] Implementar `build_segments(sources) -> dict[str, object]` en export/export_data.py y agregarlo a `BUILDERS`, según `segments.json` de contracts/export-schema.md: para AX, AY, AZ, total: `n_items`, `spend_train`, `spend_share` (sumas sobre los 517); `cv_train` = lista ordenada de `targets.cv_train` de los artículos del segmento (total = los 517), sin calcular media, mediana ni otro estadístico; `error` desde `te["metrics"]` con `nivel == "unidades"` y `step` nulo; `impact.A/B` desde `im["by_segment"]` (columna `cell`, incluye `total`); `reading.A/B` desde `im["readings"]` (columna `segment`) con renombres `z95_modelo→z95_model`, `z95_naive`, `exceso95_modelo→excess95_model`, `exceso95_naive→excess95_naive`, `ahorro_exceso95→saving_excess95`, `ahorro_exceso95_%→saving_excess95_pct`, `venta_recuperada_igual_exceso→recovered_sales_same_excess`, `perdida0_modelo→lost0_model`, `perdida0_naive→lost0_naive`, `exceso0_modelo→excess0_model`, `exceso0_naive→excess0_naive`, `recupera0_%→recovered0_pct`, `recupera95_%→recovered95_pct`; `curves` desde `im["curves"]` (17 filas por segmento y forecast, ordenadas por `z`); `ab` desde `im["ab"]` (`exceso95_*→excess95_*`, `desajuste0_*→mismatch0_*`); `concentration.A/B` desde `im["concentration"]` (`articulos→items`, `mejoran→improve`, `empeoran→worsen`, `para_50%_del_impacto→for_50pct`, `para_80%_del_impacto→for_80pct`, `impacto_total→impact_total`). Agregar a `checks` `impact_sum_matches_total_A` / `_B` (Σ `item_impact` vs fila `total` de `by_segment`, tolerancia 0,01; si falla → `ExportError`) y `segments_sum_517`. Escribe `segments.json`
- [X] T035 [US2] Crear src/views/SegmentsView.tsx (ruta `#/segmentos`): tabla con columnas AX, AY, AZ, total y filas: n.º de artículos, gasto de train (`<Money>`), % del gasto, variabilidad (un gráfico de puntos por segmento con los valores de `cv_train`, Recharts `ScatterChart`, eje "CV de train"), WRMSSE y WAPE por forma (modelo del escenario activo y seasonal naive; nunca A y B en la misma fila), impacto del escenario activo (`<Money>`) y su % de la demanda; cada encabezado de segmento enlaza a `#/segmentos/:cell`. Conectar en src/App.tsx
- [X] T036 [US2] Crear src/views/SegmentDetailView.tsx (ruta `#/segmentos/:cell`, también `total`): resumen del segmento y tabla de sus artículos (de `items.json`) con `item_id` (enlace a ficha), gasto de train (`<Money compact>`), CV de train, RMSSE del escenario activo e impacto del escenario activo (`<Money compact>`); ordenable por clic en cada columna; marca "revisar" si `metrics[esc].review`. Conectar en src/App.tsx

**Checkpoint**: quickstart §4 fila 4.

---

## Phase 5: User Story 4 - Pronóstico frente a línea base (Priority: P1)

**Goal**: ficha del artículo con sus 13 bloques de test: venta completada, pronóstico del escenario
activo y línea base, con el error del modelo y el z fijo.

**Independent Test**: `#/articulo/FOODS_1_004?esc=A` muestra bloques 53–65 con las tres series;
cambiar a B cambia el pronóstico y el error; `HOUSEHOLD_1_366` muestra 51–63.

### Tests for User Story 4

- [X] T037 [P] [US4] Agregar a export/tests/test_export.py: existen 517 archivos en `public/data/series/`; cada uno tiene filas para los bloques 2–65 en orden; exactamente 13 filas con `forecast` no nulo y `step` 1–13; `HOUSEHOLD_1_366` tiene test en 51–63 y `HOUSEHOLD_1_427` en 52–64; `FOODS_1_004` bloque 53: `units_completed == 3371.0`, `forecast.A ≈ 3682.74`, `baseline ≈ 2579.86`; ningún valor de unidades o dinero negativo

### Implementation for User Story 4

- [X] T038 [US4] Implementar `build_series(sources) -> dict[str, object]` en export/export_data.py y agregarlo a `BUILDERS`: por cada uno de los 517 artículos, filas para los bloques 2–65 del `block_calendar` con: `units_observed` = suma de `interim["item_units"][fila, first_day-1:last_day_block]` y `money_observed` = idem con `interim["item_spend"]` (fila = posición del `item_id` en `interim["item_ids"]`; si no está → `ExportError`); `units_completed` y `ratio_completed` de `boosting_data` (`units` y `ratio_raw` —que es exactamente `units / units_prev` y no tiene nulos; NO usar `ratio`, que tiene 105 nulos—; `null` si el artículo no tiene ese bloque); `step`, `forecast={"A": units_1step, "B": units_chain}` y `baseline=units_snaive` de `te["forecasts"]` (`null` fuera del test). `check_non_negative` sobre `units_observed`, `money_observed`, `units_completed`, `ratio_completed`, `units_1step`, `units_chain`, `units_snaive`. Escribe `series/<item_id>.json` (un archivo por artículo)
- [X] T039 [US4] Crear src/components/charts/ForecastChart.tsx: líneas por bloque de test (eje X = bloque con su fecha de inicio de `meta.blocks`): venta completada (rotulada "venta completada (quiebres tratados)"), pronóstico del escenario recibido por prop (rotulado "pronóstico A · a un paso" o "pronóstico B · encadenado"), línea base ("seasonal naive"); tooltip con `fmtNumber` y la diferencia `pronóstico − venta completada` rotulada "diferencia (unidades)"; nunca dibuja A y B juntos
- [X] T040 [US4] Crear src/views/ItemView.tsx (ruta `#/articulo/:item_id`): lee `items.json` y `series/<id>.json`; si el id no está en los 517 muestra "fuera del universo pronosticado"; cabecera con `item_id`, segmento (enlace a `#/segmentos/:cell`) y posición por gasto dentro del segmento; sección "Pronóstico del año de test" con `ForecastChart` del escenario activo, tabla de los 13 bloques (bloque, fecha, venta completada, pronóstico, línea base), error del modelo (`rmsse_units`, `wape_units` como %, `mae_units`) y la línea "Error de la línea base: no disponible por artículo — ver segmento" con enlace; recuadro "¿Cuánto pido?" con el pronóstico por bloque, el z fijo del escenario (`impact[esc].z_model`, 3 decimales) y el texto "El colchón y la cantidad a reponer por bloque no están construidos en las salidas del modelo". Conectar en src/App.tsx

**Checkpoint**: quickstart §4 fila 7; con US1 y US2, el recorrido portada → artículo funciona (SC-007).

---

## Phase 6: User Story 3 - Historia del artículo (Priority: P2)

**Goal**: en la ficha, la historia completa por bloque: unidades observadas y completadas, dinero
observado, ratio y CV de train.

**Independent Test**: `#/articulo/FOODS_1_004`: bloque 64 observada 0 y completada 2.142, rotuladas
distinto y sin sumar; el dinero solo de la observada.

### Implementation for User Story 3

- [X] T041 [P] [US3] Crear src/components/charts/HistoryChart.tsx: dos paneles con eje X = bloque 2–65 (fecha de inicio en el tooltip): (1) unidades, con dos líneas separadas "venta observada" (gris) y "venta completada (quiebres tratados)" (azul), sombreando los bloques de test; (2) dinero de la venta observada por bloque con la leyenda `MONEY_LABEL`. `null` se dibuja como hueco (`connectNulls={false}`) y el tooltip dice "no disponible"
- [X] T042 [US3] Agregar a src/views/ItemView.tsx la sección "Historia" (antes de "Pronóstico"): `HistoryChart`, el CV de train (`cv_train`, 1 decimal), y una tabla plegable por bloque con venta observada, venta completada, ratio (`ratio_completed`, o `fmtRatio` → "no disponible") y dinero observado (`<Money compact>`); la nota "La venta completada no tiene dinero en las salidas del modelo"

**Checkpoint**: quickstart §4 fila 6.

---

## Phase 7: User Story 5 - Impacto en dinero (Priority: P2)

**Goal**: impacto por artículo con z fijo; curvas por segmento y total con selector de z; playground.

**Independent Test**: total, escenario A, z del 95 %: ahorro 3,28 M (77 %) y venta recuperada
0,91 M; el selector solo ofrece los 17 z; la ficha no permite mover z; el playground llega al bloque
13 y muestra el impacto del año.

### Tests for User Story 5

- [X] T043 [P] [US5] Agregar a export/tests/test_export.py: `meta.headline.A.saving_excess95` redondeado a 2 decimales en millones == 3,28 y `saving_excess95_pct` redondeado == 77; `recovered_sales_same_excess` en millones redondeado == 0,91; `meta.service.z_values` tiene 17 valores de −1 a 3; en `items.json` todos los `impact.A.z_model` son iguales a `segments.total.reading.A.z95_model` (y lo mismo para B y para `z_naive`)

### Implementation for User Story 5

- [X] T044 [P] [US5] Crear src/components/charts/ServiceCurveChart.tsx: para un segmento y el escenario activo, líneas de venta perdida y exceso (dinero, `MONEY_LABEL` en el eje) contra z para el modelo (`curves[esc]`) y la línea base (`curves.naive`); un marcador vertical en el z elegido; recibe `zIndex` como prop
- [X] T045 [P] [US5] Crear src/components/ZSelector.tsx: control deslizante discreto con exactamente los 17 valores de `meta.service.z_values` (paso 0,25), que muestra el z y el nivel de servicio del modelo en ese z (`curves[esc][i].service` como %); no admite valores intermedios
- [X] T046 [US5] Agregar a src/views/SegmentDetailView.tsx la sección "Impacto": `ZSelector` + `ServiceCurveChart` + tabla en el z elegido (venta perdida, exceso y servicio del modelo y de la línea base, `<Money>`); bloque "Lectura al 95 % de servicio (curvas)" con `reading[esc]`: ahorro de exceso (`<Money>` + %), venta recuperada con el mismo exceso, z95 del modelo y de la línea base; bloque separado "Suma del impacto por artículo al z fijo" con `impact[esc]` rotulado así (nunca junto al de las curvas sin su rótulo); `concentration[esc]` solo en `total`
- [X] T047 [US5] Agregar a src/views/ItemView.tsx la sección "Impacto" con `impact[esc]`: venta perdida y exceso del modelo y de la línea base (`<Money>`), y el **"Ahorro frente a no hacer nada"** total, en venta perdida y en exceso (`impact`, `impact_lost`, `impact_excess`) con su % de la demanda. Rótulo y texto según el signo, con `src/components/Saving.tsx` (crear: recibe `value`, usa `<Money>` con el valor absoluto): si ≥ 0, "el modelo ahorra {X} frente a repetir el año anterior"; si < 0, "en este artículo el modelo cuesta {X} más que repetir el año anterior" (nunca "impacto negativo"). Usar `Saving` también donde T036 y T046 muestran `impact`; texto fijo "z fijo = {z_model} (modelo) y {z_naive} (línea base): el del 95 % de servicio del total en el escenario {esc}. El nivel de servicio no se mueve por artículo"; sin control de z; enlace a `#/articulo/:id/playground`
- [X] T048 [US5] Crear src/views/PlaygroundView.tsx (ruta `#/articulo/:item_id/playground`): botones "◀ anterior" / "siguiente ▶" y "reiniciar" sobre los 13 bloques de test (`step` 1–13); hasta el paso actual muestra por bloque y acumulado en unidades la venta completada, el pronóstico del escenario activo y la línea base (tabla + `ForecastChart` recortado a los pasos vistos); al llegar al paso 13 muestra el impacto del año de `impact[esc]` (`<Money>`) con la nota "El impacto en dinero existe solo para el año completo, no por bloque". Cambiar de escenario reinicia al paso 1. Conectar en src/App.tsx

**Checkpoint**: quickstart §4 filas 2, 5, 8 y 9.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: origen de los datos, despliegue, verificación final.

- [X] T049 [P] Crear src/views/DataSourcesView.tsx (ruta `#/datos`): tabla de `meta.sources` (nombre, ruta, fecha, hash corto, verificación), `meta.versions`, `meta.exported_at` y `meta.checks` con ✔/✘; conectar en src/App.tsx y poner un enlace "Origen de los datos · exportado el {fecha}" en el pie de todas las vistas (FR-004)
- [X] T050 [P] Crear .github/workflows/deploy.yml: en push a `main` y `workflow_dispatch`; `permissions: {contents: read, pages: write, id-token: write}`; job `build` con `actions/checkout@v4`, `actions/setup-node@v4` (`node-version: 22`, `cache: npm`), `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact@v3` (`path: dist`); job `deploy` con `actions/deploy-pages@v4`. NO ejecuta el exportador
- [X] T051 [P] Crear README.md en español: qué es, cómo exportar (`"$DATA_PROJECT_ROOT/.venv/bin/python" export/export_data.py`), cómo probar, cómo ver, cómo publicar (crear repo público, Pages con fuente "GitHub Actions"), y que `public/data/` es la versión fijada
- [X] T052 Ejecutar la exportación completa y `pytest export/tests` y `npm test`; verificar que `du -sh public/data` < 10 MB y `du -sh dist` tras `npm run build` < 1 GB
- [X] T053 Revisar src/ con `grep -rn "toLocaleString\|toFixed" src/` y reemplazar cualquier formato de dinero o número que no pase por src/format.ts o src/components/Money.tsx (SC-006); revisar que ninguna vista muestre `0` donde el dato es `null`
- [ ] T054 Recorrer quickstart.md §4 (filas 1–11 con `npm run preview`; fila 12, tiempo de carga < 3 s de `#/` y de una ficha, en el sitio publicado con la pestaña Red del navegador, SC-008) y anotar el resultado de cada fila en specs/001-forecast-results-dashboard/checklists/validation.md (lo valida el usuario, constitución "Reglas de método" 3)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias.
- **US1, US2, US4 (P1)** y luego **US3, US5 (P2)**, en ese orden (constitución: un hito activo a la vez).
- **Polish (Phase 8)**: después de las historias deseadas; T050–T051 pueden hacerse antes.

### User Story Dependencies

- **US1**: solo Foundational.
- **US2**: solo Foundational (crea `items.json` y `segments.json`).
- **US4**: Foundational + `items.json` (T033 de US2) para la cabecera y el error del modelo.
- **US3**: US4 (comparte `series/<id>.json` de T038 y `ItemView.tsx` de T040).
- **US5**: US2 (`segments.json`, `SegmentDetailView.tsx`) y US4 (`ItemView.tsx`, `ForecastChart`).

### Within Each User Story

- Pruebas del exportador → builder del exportador → ejecutar exportación → componentes → vista.
- Las pruebas sobre la salida real se escriben primero y fallan (o se saltan) hasta que existe el archivo.

### Parallel Opportunities

- Setup: T004–T007 en paralelo tras T003.
- Foundational: T016, T018, T019, T020, T022, T023, T025 en paralelo (archivos distintos).
- Por historia: la tarea de pruebas [P] en paralelo con los componentes [P]; `export_data.py` y
  `ItemView.tsx` se editan en secuencia (mismo archivo).
- Polish: T049, T050, T051 en paralelo.

---

## Parallel Example: User Story 5

```bash
Task: "T043 [US5] pruebas de headline y z en export/tests/test_export.py"
Task: "T044 [US5] ServiceCurveChart en src/components/charts/ServiceCurveChart.tsx"
Task: "T045 [US5] ZSelector en src/components/ZSelector.tsx"
# luego, en secuencia: T046 (SegmentDetailView), T047 (ItemView), T048 (PlaygroundView)
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 + Phase 2.
2. Phase 3 (US1): exportar, abrir `#/`, validar filas 1–3 y 10 de quickstart §4.
3. **Publicar ya** en Pages (T050 se puede adelantar): la portada sola ya responde "¿de qué
   hablamos y cuánto vale?".

### Incremental Delivery

1. US1 → publicar.
2. US2 → publicar (segmentos).
3. US4 → publicar (núcleo: pronóstico frente a no hacer nada).
4. US3 → publicar (historia).
5. US5 → publicar (impacto y playground) → el RMV está completo; cerrar con T054.

---

## Notes

- Tras cada tarea del exportador, volver a ejecutarlo: si falla, `public/data/` queda como estaba.
- Commit de `public/data/` junto con el código que lo produjo (constitución I.5); hacer commits
  solo cuando el usuario lo pida.
- Si una cifra no coincide con las salidas del modelo, se corrige el exportador, nunca el JSON a mano.

---

## Phase 9: Convergence

- [X] T055 CRITICAL: en `build_series` de export/export_data.py, exportar `units_observed` y `money_observed` como `null` (no `0`) en los bloques que terminan antes del lanzamiento del artículo (`last_day_block < interim["item_launch_d"]` de su fila; `NaN` = sin lanzamiento visible); hoy 114 de los 517 artículos tienen bloques iniciales con venta observada 0 antes de que empiece su venta completada (verificar cuántos son anteriores al lanzamiento; los ceros posteriores al lanzamiento son venta observada real y se mantienen). Agregar a export/tests/test_export.py una prueba de que ningún bloque anterior al lanzamiento tiene `0` y volver a exportar per Constitution III.4, FR-020 (contradicts) — HECHO: la serie empieza en el primer bloque con venta (`first_block`); antes, `null` y no se muestra
- [X] T056 En src/components/Saving.tsx, cuando `compact` y el valor es negativo, agregar `title` con el texto completo "el modelo cuesta {X} más que repetir el año anterior" y un rótulo visible corto ("cuesta más"); en las tablas de src/views/SegmentDetailView.tsx y src/views/SegmentsView.tsx, una nota bajo la tabla: "Negativo: en ese artículo o segmento el modelo cuesta más que repetir el año anterior" per Constitution III.3, contracts/ui-routes.md regla 8 (partial) — OMITIDA por decisión del usuario (2026-11-13)
- [X] T057 En src/components/ItemSearch.tsx, mostrar en cada resultado "pronosticado · segmento {cell}" (etapa del embudo y segmento) per US1/AC2 (partial) — OMITIDA por decisión del usuario (2026-11-13)
- [X] T058 En src/views/ItemView.tsx, agregar bajo el pronóstico la nota "No hay pronóstico después del día 1.941: solo existe el año de test" per spec Edge Cases (missing) — HECHO con otra forma, por decisión del usuario: período de los datos (2011-06-27 a 2016-05-22) en la portada y en la ficha, en vez de aviso
- [X] T059 Decidir con el usuario si `block_calendar` sigue validando fechas contra `calendar.csv` (dato crudo fuera de la lista de fuentes de I.1) o se elimina esa validación y se confía en `boosting_data.start_date`; aplicar la decisión en export/export_data.py per Constitution I.1, analyze D3 (contradicts) — HECHO: se quitó la lectura de `calendar.csv`; se valida que las fechas avancen de a 28 días
- [X] T060 Registrar en specs/001-forecast-results-dashboard/plan.md (sección Desvíos o Project Structure) los cambios hechos durante la implementación: `fmtMoney` abrevia en millones desde 100.000 US$ (T019 decía 1 M; necesario para mostrar "0,91 M US$" de SC-003), `tsconfig.json` incluye solo `src` (T005 decía `src` y `tests`) y los archivos no listados en el árbol (`types.ts`, `router.ts`, `Saving.tsx`, `ZSelector.tsx`, `ItemSearch.tsx`, `StateViews.tsx`, gráficos) per plan: Project Structure, T005, T019 (contradicts) — HECHO: sección "Cambios durante la implementación" en plan.md
- [X] T061 Justificar en plan.md (Testing) o quitar la dependencia `jsdom` 26.1.0 y tests/views.smoke.test.tsx, agregados para probar las vistas sin navegador per plan: Testing T4 (unrequested) — HECHO: se mantiene (las pruebas pasan); justificado en plan.md

---

## Phase 10: Convergence

- [X] T062 Alinear specs/001-forecast-results-dashboard/spec.md con la decisión de convergencia F1: en US3/AC1 (línea "en los bloques 2–65"), FR-009 ("por bloque (2–65)") y la entidad Bloque ("la historia usa los bloques 2–65"), decir que la historia de cada artículo va desde su primer bloque con venta (`first_block`) hasta el bloque 65, y que antes de ese bloque la serie no existe y no se muestra per FR-009, US3/AC1 (contradicts) — HECHO: US3/AC1, FR-009 y la entidad Bloque actualizados

---

# Iteración 2 · 3.049 artículos, bandas, histograma y capa visual (constitución 1.1.1)

**Input**: plan.md (Iteración 2), research.md (Parte 3, R9–R19), data-model.md (Iteración 2),
contracts/export-schema.md (Iteración 2), contracts/ui-routes.md (reescrito), quickstart.md §6,
`diseno/guia_visual.md` y `diseno/pantalla_*.png`.

**Tests**: incluidas.
- pytest: las 15 actuales **sin cambios** y nuevas en `export/tests/test_export_v2.py`.
- vitest: humo de los 4 módulos.
- Validación de cifras: la hace el usuario (quickstart filas 13–20).

## Reglas adicionales de la iteración 2 (leer antes de empezar)

- **Exportación solo por adición.**
  - No se modifican `build_funnel`, `build_items`, `build_segments`, `build_series` ni sus
    archivos.
  - `meta.json` solo suma campos (`pending`, nuevas `sources`, nuevos `checks`).
  - Después de exportar, `funnel.json`, `segments.json`, `items.json` y `series/` deben quedar
    byte a byte iguales a los de antes (R11).
- **Fuentes nuevas.** `segmentation_items` y `radar_profiles` se leen con
  `src.freeze.load_frozen`; nada se calcula sobre ellos salvo el conteo y la suma por celda de la
  matriz (I.11).
  - Si no están en `processed_manifest["artifacts"]`, quedan en `meta.pending` y no se escribe
    `segmentation.json`.
  - Si están declarados y fallan, `ExportError`.
- **Matriz y radar sin los 162.** Los artículos con `xyz_class == "-"` no entran a la matriz ni
  al radar (constitución II.2). Sí entran al catálogo y a la vista de artículo.
- **Serie descriptiva.**
  - Unidades **observadas** (`item_units`) por bloque, del `first_block` al 65, ceros incluidos.
  - `sigma` con `ddof=0`.
  - Bandas = media ± 3σ, con `band_lower` posiblemente < 0 (no pasa por `check_non_negative`).
  - `cv_pct = sigma / mean · 100`.
  - Histograma de 8 intervalos de igual ancho.
- **Colores.** Solo los de la tabla de `diseno/guia_visual.md` §2, como variables CSS. Ningún hex
  suelto fuera de `src/styles.css` y `src/theme.ts`.
- **Mockups.** Sus cifras son ejemplos: nunca se copian a código, pruebas ni textos (constitución
  VI.1).
- **Gráficas.** Antes de escribir código de gráficas, cargar la skill `dataviz` y aplicar sus
  reglas de marcas e interacción, pero con la paleta de la guía.

---

## Phase 11: Setup (iteración 2)

- [X] T063 Copiar `public/data/` a una carpeta temporal del scratchpad (fuera del repo) como línea base para comparar después de exportar (R11).
- [X] T064 [P] Crear src/theme.ts con la paleta de `diseno/guia_visual.md` §2 como constantes TypeScript para Recharts (`bg #0B1220`, `panel #0F1828`, `card #142036`, `border #25324B`, `text #E6EDF5`, `textMuted #8C9AB0`, `cyan #009FCA` = modelo/acento, `plum #965596` = línea base, `blue #2B95E1` = AX, `green #148E66` = AY, `violet #725FB3` = AZ, `silver #D6E0EC` = venta real, `slate #7D8AA6` = bandas/histograma/etapas sin pronóstico, `grey #56637C` = media) y `CELL_COLOR = {AX: blue, AY: green, AZ: violet}`.
- [X] T065 [P] Reescribir src/styles.css con tema oscuro único:
  - variables CSS en `:root` con los mismos valores de T064;
  - `body` con fondo `--bg`;
  - tipografía `Calibri, Carlito, "Segoe UI", system-ui, sans-serif`;
  - clases `.layout` (grilla: panel lateral de ≈17 % y contenido), `.sidebar`, `.nav-item` y `.nav-item.active` (fondo de tarjeta, ícono cian);
  - `.module-header` (título, subtítulo y controles a la derecha), `.card` (fondo de tarjeta, borde 1px, radio 12px), `.pill` y `.pill.active` (cian), `.big-number`, `.label`, `.grid-*`;
  - tablas oscuras;
  - en menos de 900px, el panel lateral pasa arriba;
  - sin barras de color decorativas.

---

## Phase 12: Foundational (iteración 2, bloquea las historias)

### Exportación (solo adición)

- [X] T066 Escribir primero export/tests/test_export_v2.py (deben fallar antes de T067–T071), con el mismo `conftest.py` y el mismo fixture de exportación de test_export.py:
  - `catalog.json`:
    - 3.049 `item_id` únicos, iguales a `item_index`;
    - `forecasted` en `true` exactamente para los 517 de `items.json`;
    - para los 592 de `targets`, `cell` = `targets.cell`.
  - `descriptive/`:
    - 3.049 archivos;
    - `rows` del `first_block` al 65, con `units_observed` y `money_observed` ≥ 0;
    - para los 517, `units_observed` y `money_observed` iguales bloque a bloque a `series/<id>.json` desde `first_block`.
  - `stats`:
    - `mean` y `sigma` iguales a `np.mean` / `np.std(ddof=0)` de `rows[].units_observed` (tolerancia 1e-9);
    - `band_upper/lower = mean ± 3·sigma`;
    - `cv_pct = sigma/mean·100`, o `null` si `mean == 0`;
    - con `n_blocks == 1`: `sigma`, bandas y `cv_pct` en `null`.
  - `histogram`: ≤ 8 intervalos contiguos y `Σ count == n_blocks`.
  - `segmentation.json`:
    - `Σ matrix[].n_items == total_items == 2887`;
    - `excluded_no_xyz == 162`;
    - 9 celdas sin `"-"`;
    - AX/AY/AZ = 207/251/134;
    - `radar.cells` con 9 celdas × 5 ejes, copiados de `radar_profiles`.
  - `meta.pending == []` con las fuentes presentes; con `segmentation_items` quitado del manifiesto simulado, `pending` lo nombra, no se escribe `segmentation.json` y la exportación devuelve 0.
  - Con hash alterado de `segmentation_items` (monkeypatch de `load_frozen` que lanza): `main()` devuelve 1 y `EXPORT_DIR` queda intacto.
  - Regresión: `funnel.json`, `segments.json`, `items.json` y `series/*.json` son byte a byte iguales a la línea base de T063.
- [X] T067 En export/export_data.py, ampliar `load_sources` con un paso opcional `_segmentation`:
  - por cada nombre en `("segmentation_items", "radar_profiles")`: si está en `out["processed_manifest"]["artifacts"]`, `out[name] = load_frozen(name)` (una falla → `ExportError`); si no, se agrega `{"name", "reason": "no está declarado en data/processed/manifest.json"}` a `out["pending"]`;
  - ampliar `source_records` para registrar cada fuente nueva cargada (`path`, `frozen_at`, `sha256` del manifiesto, `check: "load_frozen"`);
  - `build_meta` agrega `"pending": src["pending"]` sin tocar los demás campos;
  - subir `EXPORTER_VERSION` a `"0.2.0"`.
- [X] T068 [P] En export/export_data.py, agregar `build_catalog(src, checks)`:
  - 3.049 elementos desde `src["interim"]` (ids de `item_index`), ordenados por `item_id`;
  - campos: `dept` = `item_id.rsplit("_", 1)[0]`; `forecasted` = pertenece a `forecasted_ids(src)`; `first_block` = primer bloque del calendario con unidades observadas > 0; `cell`, `abc_class`, `xyz_class` de `segmentation_items` (o `null` si está pendiente);
  - checks `catalog_3049` y `catalog_forecasted_517`;
  - si `segmentation_items` existe, check `segmentation_matches_targets`: los `item_id` con `cell ∈ {AX, AY, AZ}` son exactamente los de `targets` y con la misma celda; si falla, `ExportError`.
- [X] T069 [P] En export/export_data.py, agregar `build_descriptive(src, checks)`:
  - por artículo, sumar `item_units` e `item_spend` en los días `first_day..last_day` de cada bloque de `src["calendar_blocks"]` (misma suma que `build_series`, extraída a una función auxiliar compartida **sin cambiar** la salida de `build_series`);
  - recortar desde `first_block`;
  - `check_non_negative` sobre unidades y dinero;
  - calcular `stats` e `histogram` según contracts/export-schema.md §`descriptive/<item_id>.json` (8 intervalos de igual ancho entre mínimo y máximo, o 1 si son iguales; `Σ count = n_blocks`);
  - devolver `{"descriptive/<id>.json": …}` para los 3.049.
- [X] T070 [P] En export/export_data.py, agregar `build_segmentation(src, checks)`:
  - si falta alguna de las dos fuentes, devuelve `{}`;
  - si no, filtra `xyz_class != "-"` y arma `matrix` con las 9 celdas (`n_items` = conteo; `spend` = Σ `spend`), más `total_items` y `excluded_no_xyz`;
  - `radar`: `axes` en el orden de `radar_profiles`, `global_median` por eje y `cells[cell][axis] = {median_raw, median_norm}`, copiados, sin celdas con `"-"`;
  - checks `matrix_sums_classified` (`total_items + excluded_no_xyz == 3049`) y `radar_9x5`; si falla, `ExportError`.
- [X] T071 Agregar `build_catalog`, `build_descriptive` y `build_segmentation` al **final** de `BUILDERS` en export/export_data.py; correr `pytest export/tests` (15 + nuevas en verde) y exportar.
  - Verificar contra T063 que los archivos de los 517 no cambiaron (`diff -r` sin diferencias salvo `meta.json`) y que `du -sh public/data` < 30 MB.
  - Anotar en quickstart.md §6 el número real de archivos y el tamaño.

### Interfaz base

- [X] T072 [P] Ampliar src/types.ts con `Catalog`/`CatalogItem` (`item_id`, `dept`, `cell: string | null`, `abc_class: string | null`, `xyz_class: string | null`, `forecasted: boolean`, `first_block: number`), `Segmentation` (`matrix[]`, `total_items`, `excluded_no_xyz`, `radar`), `Descriptive` (`rows`, `stats` con campos `number | null`, `histogram`) y `Meta.pending: {name: string; reason: string}[]`.
- [X] T073 Reescribir src/router.ts:
  - rutas `home` (`#/`), `segmentation` (`#/segmentacion`), `segment` (`#/segmentacion/:cell`), `item` (`#/articulo` y `#/articulo/:id`), `playground`, `impact` (`#/impacto`) y `sources` (`#/datos`);
  - redirigir `#/segmentos` → `#/segmentacion` y `#/segmentos/:cell` → `#/segmentacion/:cell` (con `location.replace`);
  - conservar `?esc=A|B` y agregar `?pron=0|1` para la píldora Pronóstico (1 por defecto).
- [X] T074 [P] Crear src/components/Icons.tsx con íconos SVG de línea (inicio, cuadrícula, pulso, dólar, base de datos), con `stroke="currentColor"` y 24px.
- [X] T075 Crear src/components/Sidebar.tsx:
  - marca "DDR" en cian y debajo "Demand Driven Replenishment";
  - módulos Inicio, Segmentación, Artículo e Impacto con ícono; el activo lleva `.nav-item.active`;
  - al pie, "Origen de los datos" (`#/datos`), la fecha de exportación de `meta` y "Todo valor monetario está a precio de venta, no es margen".
- [X] T076 Reescribir src/App.tsx:
  - `.layout` con `<Sidebar>` y `<main>`;
  - switch de las rutas de T073;
  - quitar el encabezado y el `ScenarioToggle` globales (el escenario se elige dentro de Impacto y Artículo).
- [X] T077 [P] Crear src/components/ModuleHeader.tsx (`title`, `subtitle`, `children` para los controles a la derecha) y src/components/Pill.tsx (botón con `.pill` y `.pill.active`, `aria-pressed`).
- [X] T078 [P] En src/components/StateViews.tsx, agregar `Pending({what})`: "No disponible: el proyecto de datos aún no publica {what}." Lo usa toda vista cuyo archivo figure en `meta.pending` o no exista.

**Checkpoint**: `pytest` en verde, regresión de los 517 sin cambios y la app compila con el panel lateral.

---

## Phase 13: User Story 1 - Inicio y embudo (Priority: P1) 🎯 MVP

**Goal**: portada según `pantalla_1_inicio.png`, y embudo y dinero en juego dentro de Segmentación.

**Independent Test**: `#/` muestra 3.049, 517 y el exceso evitado de A al 95 % (de `meta.headline.A`), y "Explorar" lleva a `#/segmentacion`; el embudo muestra 4 etapas que terminan en 517.

- [X] T079 [P] [US1] Crear src/components/NeuralBackground.tsx:
  - `<canvas>` a pantalla completa detrás del contenido, con unos 40 nodos en columnas y conexiones a la columna siguiente;
  - nodos en cian/azul y líneas en `--border`/cian con opacidad ≤ 0,35;
  - pulso lento (período ≥ 3 s) con `requestAnimationFrame`;
  - se detiene con `document.hidden`; con `prefers-reduced-motion: reduce`, un solo cuadro estático;
  - redimensiona con `ResizeObserver` y limpia todo al desmontar.
- [X] T080 [US1] Crear src/views/HomeView.tsx:
  - `NeuralBackground` y, encima, una tarjeta con velo semitransparente;
  - título "Demand Driven Replenishment" y subtítulo "Reposición guiada por la demanda · M5 Walmart · 10 tiendas · {período de `meta.period`}";
  - tres cifras grandes: artículos analizados (largo de `catalog.items`), con pronóstico (conteo de `forecasted`) y exceso evitado (`<Money compact>` de `meta.headline.A.saving_excess95`, en cian, con asterisco);
  - nota "* Manifiesto de impacto: escenario A, 95 % de servicio, a precio de venta (no es margen)";
  - botón "Explorar →" a `#/segmentacion`.
- [X] T081 [P] [US1] Crear src/components/charts/FunnelBar.tsx:
  - barras horizontales proporcionales a `funnel.stages[].count` con flechas entre etapas;
  - las etapas sin pronóstico en pizarra y la de 517 en cian;
  - debajo de cada barra, la cifra grande y el rótulo de la etapa (de `funnel.json`).
- [X] T082 [US1] En src/views/SegmentationView.tsx (crear el archivo aquí con `ModuleHeader` y la tarjeta del embudo; T085 le agrega la matriz, el radar y la tarjeta contigua), tarjeta inferior "Embudo: del catálogo a lo que se pronostica" con `FunnelBar`, el desglose `by_cell` de 592 y 517 y, debajo, el dinero en juego de los 517 (FR-005b): % del gasto de train y demanda del año de test con `<Money>`.

---

## Phase 14: User Story 2 - Segmentación (Priority: P1)

**Goal**: matriz ABC × XYZ (2.887), radar y tarjeta contigua según `pantalla_2_segmentacion.png`, más el detalle de AX/AY/AZ.

**Independent Test**: la matriz suma 2.887, con AX 207 · AY 251 · AZ 134 y la nota "162 sin clase XYZ no se incluyen"; el clic en una celda filtra el radar y la tarjeta; el cursor sobre la tarjeta muestra el valor crudo.

- [X] T083 [P] [US2] Crear src/components/charts/SegmentMatrix.tsx:
  - grilla 3 × 3 (filas A/B/C, columnas X/Y/Z) con la celda, el conteo y, en segunda línea, el dinero de la celda (`spend`, gasto de train) con `<Money compact>` (FR-007);
  - fondo cian con opacidad proporcional a `n_items / max`, con un mínimo legible y el texto siempre `--text`;
  - la celda seleccionada lleva borde cian 2px;
  - `onSelect(cell)`, manejable con teclado (botones);
  - pie: "{total_items} artículos con clase XYZ · {excluded_no_xyz} sin clase XYZ no se incluyen".
- [X] T084 [P] [US2] Crear src/components/charts/SegmentRadar.tsx:
  - Recharts `RadarChart` con los ejes de `radar.axes`, rotulados en español (`spend` → "Gasto (train)", `usage_units` → "Unidades", `cv` → "CV", `zero_share` → "% días en cero", `velocity` → "Velocidad");
  - valores `median_norm`;
  - por defecto, AX/AY/AZ con `CELL_COLOR` (3 colores) y leyenda;
  - si la celda seleccionada no es AX/AY/AZ, se dibuja solo esa celda en pizarra;
  - si es AX/AY/AZ, esa queda resaltada y las otras con opacidad 0,25;
  - el tooltip muestra la mediana normalizada con 2 decimales;
  - referencia 1,0 = mediana global (línea gris punteada).
- [X] T085 [US2] Completar src/views/SegmentationView.tsx (creada en T082):
  - encabezado "Segmentación ABC × XYZ" con el subtítulo "{total_items} artículos con clase XYZ · ABC por gasto de train · XYZ por variabilidad de unidades (train)";
  - fila de 3 tarjetas: Matriz, "Perfil de segmentos (mediana normalizada)" y tarjeta contigua "{celda} · al pasar el cursor";
  - la tarjeta contigua lista cada eje con la mediana normalizada (2 decimales) y, al pasar el cursor por la fila (y con foco), "crudo: {median_raw}" con unidad (dinero con `<Money compact>`, CV en %, % de días en cero en %, unidades y velocidad con `fmtNumber`);
  - celda inicial: AX;
  - en las celdas AX/AY/AZ, enlace "Ver artículos →" a `#/segmentacion/{cell}`;
  - si `segmentation` está en `meta.pending` o falla la carga, `Pending` en lugar de la matriz y el radar; el embudo se muestra igual.
- [X] T086 [US2] Mover src/views/SegmentsView.tsx y src/views/SegmentDetailView.tsx a la nueva capa:
  - SegmentDetailView pasa a `#/segmentacion/:cell`, con `ModuleHeader`, tarjetas y tabla oscura, y conserva su lista ordenable y su contenido funcional; en el encabezado lleva los botones A/B (`Pill`, cambian `?esc`) y el rótulo del escenario activo en las columnas de ahorro (FR-012);
  - la comparación de SegmentsView (conteo, dinero, distribución del CV, error por forma) se integra como tarjeta "Comparación AX · AY · AZ" bajo la fila de la matriz en SegmentationView;
  - borrar SegmentsView.tsx y FunnelView.tsx (y FunnelChart.tsx si queda sin uso).

---

## Phase 15: User Story 3 - Historia del artículo, 3.049 (Priority: P2)

**Goal**: selector de artículo con escritura y despliegue, píldora Pronóstico, unidades con media y bandas, dinero por bloque, CV descriptivo e histograma, según `pantalla_3_articulo.png`.

**Independent Test**: con la píldora activa la lista tiene 517 y apagada 3.049; escribir `FOODS_3` filtra; la ficha de cualquiera de los 3.049 muestra la serie, las bandas, el CV y el histograma; para uno fuera de los 517 aparece "Este artículo no entró al pronóstico".

- [X] T087 [P] [US3] Crear src/components/ItemCombobox.tsx:
  - `input` con `role="combobox"`, `aria-expanded`, `aria-controls` y placeholder "Buscar artículo…";
  - `ul role="listbox"` debajo;
  - al escribir, filtra `catalog.items` por subcadena del `item_id` sin distinguir mayúsculas;
  - al enfocar o abrir sin texto, muestra la lista completa del filtro activo (517 si `pron=1`, 3.049 si `pron=0`), con scroll y alto máximo de 360px;
  - teclado: ↑/↓, Enter navega a `#/articulo/{id}` y Escape cierra; el clic navega;
  - cada opción muestra el `item_id` y, a la derecha, la celda o "con pronóstico" en texto secundario.
  - Reemplaza src/components/ItemSearch.tsx (borrarlo).
- [X] T088 [P] [US3] Crear src/components/charts/UnitsBandChart.tsx:
  - Recharts `ComposedChart` sobre `descriptive.rows`;
  - venta observada en línea plateada continua (`strokeWidth 2`) y media en `ReferenceLine` gris medio;
  - +3σ y −3σ como `ReferenceLine` en pizarra punteada; si `band_lower < 0`, se dibuja en 0 con rótulo "−3σ < 0 (se dibuja en 0)";
  - eje X = bloque y eje Y desde 0; leyenda con texto `--text`.
  - Props opcionales `test` (`{from, to, rows: SeriesRow[], scenario}`) para T093.
- [X] T089 [P] [US3] Crear src/components/charts/MoneyChart.tsx: línea plateada de `money_observed` por bloque; eje Y con `fmtMoney` compacto; título de la tarjeta "Venta en dinero por bloque (a precio de venta, no es margen)".
- [X] T090 [P] [US3] Crear src/components/charts/UnitsHistogram.tsx: `BarChart` de `descriptive.histogram` con barras en pizarra; eje X rotulado con el rango de cada intervalo (`fmtNumber(from)`–`fmtNumber(to)`) y tooltip con "{count} bloques".
- [X] T091 [US3] Reescribir src/views/ItemView.tsx (descriptivo):
  - `ModuleHeader` "Artículo · {id}" con el subtítulo "{celda o 'celda no disponible'} · 10 tiendas · bloques de 28 días · bandas = media ± 3σ";
  - si hay `cv` de segmentación (`items.json.cv_train` para los 517), agregar " · CV de train (segmentación) {x} %";
  - controles: `ItemCombobox` y `Pill` "Pronóstico" (alterna `pron` en el hash);
  - sin `itemId`: tarjeta "Elige un artículo" con el combobox;
  - id fuera del catálogo: "“{id}” no está en el catálogo de 3.049".
  - Layout de la pantalla 3:
    - columna izquierda: tarjeta "Unidades por bloque" (`UnitsBandChart`) y tarjeta de dinero (`MoneyChart`);
    - columna derecha: tarjetas de métricas (T093) o el aviso de T092;
    - tarjeta "Coeficiente de variación": `cv_pct` en % con "media {mean} u · σ {sigma} u" y la leyenda "σ ÷ media de los bloques desde el lanzamiento (descriptivo)";
    - tarjeta "Distribución de unidades" (`UnitsHistogram`).
  - `null` → "no disponible".
- [X] T092 [US3] En src/views/ItemView.tsx, si `catalog.forecasted` es falso, en el lugar de las métricas va una tarjeta "Este artículo no entró al pronóstico" con enlace "Ver el embudo →" a `#/segmentacion`. No se carga `series/<id>.json` y no se muestra ninguna métrica, pronóstico ni impacto (constitución II.2, FR-001).

---

## Phase 16: User Story 4 - Pronóstico sobre la serie (Priority: P1)

**Goal**: el pronóstico aparece solo para los 517, sobre la misma gráfica de unidades.

**Independent Test**: en `#/articulo/FOODS_3_655` se ven el tramo de test sombreado con "Train" y "Test (13 bloques)", el modelo en cian, la línea base en ciruela y la completada punteada, más las tarjetas RMSSE · 1 paso, RMSSE · cadena, WAPE y MAE.

- [X] T093 [US4] En src/components/charts/UnitsBandChart.tsx y src/views/ItemView.tsx, cuando el artículo es de los 517:
  - cargar `series/<id>.json` e `items.json`;
  - en la gráfica: `ReferenceArea` del primer al último bloque de `test_blocks` con relleno cian de opacidad 0,10; rótulos "Train" (texto secundario) y "Test (13 bloques)" (cian) arriba; línea cian del pronóstico del escenario activo; línea ciruela de `baseline`; línea plateada punteada de `units_completed` en test, rotulada "venta completada (quiebres tratados)";
  - tarjetas de métricas en grilla 2 × 2:
    - "RMSSE · 1 paso" con `metrics.A.rmsse_units` y "RMSSE · cadena" con `metrics.B.rmsse_units`, cada una con "línea base: no disponible por artículo" (enlace a `#/segmentacion/{cell}`);
    - "WAPE · {escenario}" y "MAE · {escenario}" del escenario activo;
    - etiqueta "marcado para revisión" si `review`;
  - píldoras A/B pequeñas sobre las tarjetas para cambiar `?esc`;
  - debajo, sin cambios funcionales: la tabla del test, "¿Cuánto pido?", el impacto del artículo con `Saving` y el enlace al playground, todo con la nueva piel;
  - la tabla de historia por bloque va en `<details>`.
- [X] T094 [P] [US4] Aplicar la nueva piel a src/views/PlaygroundView.tsx y src/components/charts/ForecastChart.tsx (si se sigue usando), con colores de `theme.ts`: modelo cian, línea base ciruela, venta plateado; el playground lleva en su encabezado los botones A/B (`Pill`, cambian `?esc`) y el rótulo del escenario activo (FR-012). Borrar src/components/charts/HistoryChart.tsx si quedó sin uso.

---

## Phase 17: User Story 5 - Impacto en dinero (Priority: P2)

**Goal**: módulo Impacto según `pantalla_4_impacto.png`.

**Independent Test**: en A, con el deslizador al 95 %, exceso evitado 3,28 M US$ y venta recuperada 0,91 M US$; al mover el deslizador, el punto marcado se mueve en las dos curvas y las tarjetas de exceso y venta perdida cambian; al pasar a B cambia todo junto.

- [X] T095 [P] [US5] Crear src/components/charts/ImpactCurve.tsx:
  - Recharts `LineChart`/`ScatterChart` con x = `excess` (M US$) e y = `lost` (M US$) de `curves[scenario]` (cian, "Modelo") y `curves.naive` (ciruela, "Línea base"), puntos en cada z;
  - punto marcado (radio mayor, borde `--text`) en el z elegido sobre cada curva;
  - ejes "Exceso en anaquel (M)" y "Venta perdida (M)" con `fmtNumber` y "a precio de venta, no es margen" en el subtítulo de la tarjeta.
- [X] T096 [P] [US5] Reemplazar src/components/ZSelector.tsx por un deslizador (`input type="range"` sobre los índices de `meta.service.z_values`):
  - muestra el nivel de servicio de ese z (el `service` de la curva del modelo, en %) en cian a la derecha y "z = {z}" en texto secundario;
  - el valor inicial es el z más cercano al 95 % de servicio del modelo;
  - estilo de pista cian y pulgar cian.
- [X] T097 [P] [US5] Crear src/components/charts/SegmentBars.tsx: barras horizontales de `segments[cell].reading[scenario].saving_excess95` para AX/AY/AZ con `CELL_COLOR`, valores al final de la barra con `fmtMoney` y debajo "Venta recuperada: AX {…} · AY {…} · AZ {…}" desde `recovered_sales_same_excess`; el título de la tarjeta dice "Exceso evitado por segmento (a precio de venta, no es margen)" y la venta recuperada se muestra con `<Money compact>` (constitución II.4).
- [X] T098 [US5] Crear src/views/ImpactView.tsx:
  - `ModuleHeader` "Impacto en dinero" con el subtítulo "Test · modelo frente a línea base (repetir el año anterior) · a precio de venta, no es margen" y píldoras "A · a un paso" / "B · encadenado" (cambian `?esc`);
  - 4 tarjetas:
    - "Exceso evitado": `headline[esc].saving_excess95` con "−{pct} % · servicio 95 % · manifiesto";
    - "Venta recuperada": `recovered_sales_same_excess` con "con el mismo exceso · manifiesto";
    - "WRMSSE en test": cifra grande = `one_step` o `chained` según el escenario; debajo, las tres rotuladas por separado: "A · a un paso {one_step} · B · encadenado {chained} · línea base {seasonal_naive} · manifiesto" (FR-013, SC-002; son tres cifras separadas, no una combinación);
    - "Artículos": 517 con "AX · AY · AZ".
  - Tarjeta de la curva:
    - selector Total/AX/AY/AZ (píldoras) + `ImpactCurve` + deslizador;
    - debajo, dos lecturas del punto elegido: "Exceso en anaquel" y "Venta perdida", modelo frente a línea base, con `<Money>`;
    - la curva solo cambia con el escenario o el segmento.
  - Tarjeta "Exceso evitado por segmento" (`SegmentBars`).
  - Tarjeta "Mayor contribución (z fijo)": tabla con los 10 primeros de `items.json` ordenados por `impact[esc].impact` descendente; columnas Artículo (enlace a la ficha), Seg., "Ahorro en exceso" (`impact_excess`) y "Ahorro en venta perdida" (`impact_lost`), con `Saving compact`.
  - Rotular distinto el titular de curvas (z95) y la suma por artículo (z fijo) (FR-017).
- [X] T099 [US5] Retirar src/components/charts/ServiceCurveChart.tsx y src/components/ScenarioToggle.tsx si quedaron sin uso, y quitar la sección de curvas de SegmentDetailView si duplica Impacto. Mantener el selector de z solo en Impacto (contracts/ui-routes.md regla 5).

---

## Phase 18: Polish & Cross-Cutting (iteración 2)

- [X] T100 [P] Reescribir src/views/DataSourcesView.tsx con la nueva piel y agregar la sección "Pendientes" desde `meta.pending` ("ninguno" si está vacía) y las fuentes nuevas.
- [X] T101 Reescribir tests/views.smoke.test.tsx para las rutas `#/`, `#/segmentacion`, `#/segmentacion/AX`, `#/articulo` (sin id), `#/articulo/FOODS_3_655`, `#/articulo/{un id con forecasted=false de catalog.json}`, `#/articulo/FOODS_3_655/playground`, `#/impacto` y `#/datos`, con los JSON reales:
  - se renderiza sin error;
  - "Este artículo no entró al pronóstico" solo en el no pronosticado;
  - en `#/impacto?esc=A`, el texto "3,28 M US$";
  - en `#/segmentacion`, "2.887";
  - `#/segmentos` redirige.
  - Stub de `HTMLCanvasElement.getContext` y de `matchMedia` para `NeuralBackground`.
- [X] T102 [P] Agregar a tests/format.test.ts y a una prueba nueva tests/theme.test.ts que ningún archivo de `src/` (salvo `styles.css` y `theme.ts`) contenga literales `#RRGGBB`, y que todos los hex de esos dos archivos estén en la tabla de la guía (constitución VI).
- [X] T103 Correr `npm test`, `npm run build` (sin errores de `tsc`) y `pytest export/tests`; anotar en plan.md, sección "Cambios durante la implementación", los desvíos que aparezcan y el tamaño final de `dist/`.
- [X] T104 Actualizar README.md: los 4 módulos, que la guía visual vive en `diseno/` y el prerrequisito de `segmentation_items` y `radar_profiles` (nb 03, Etapa 10b).
- [ ] T105 Validación de cifras y diseño (la hace el usuario): recorrer quickstart.md §6, filas 13–20, sobre `npm run build && npm run preview -- --host`, y anotar el resultado en specs/001-forecast-results-dashboard/checklists/validation.md. Junto con T054, cierra la iteración.

---

## Iteración 2 · Dependencies & Execution Order

- **Setup (T063–T065)**: T063 va antes que cualquier exportación; T064 y T065 en paralelo.
- **Foundational (T066–T078)**:
  - T066 (pruebas) → T067 → T068, T069 y T070 [P] → T071;
  - en paralelo con la exportación, T072–T078 (T073 → T076; T075 depende de T074).
  - Bloquea todas las historias.
- **Historias**: US1 (T079–T082) → US2 (T083–T086; T082 crea la vista y T085 la completa) → US3 (T087–T092) → US4 (T093–T094, depende de US3) → US5 (T095–T099, independiente de US3/US4).
- **Polish (T100–T105)**: al final; T105 la hace el usuario.

### Parallel example (US5)

```text
T095 ImpactCurve.tsx  |  T096 ZSelector.tsx (deslizador)  |  T097 SegmentBars.tsx
→ T098 ImpactView.tsx → T099 limpieza
```

### Implementation strategy

1. Exportación primero (T063–T071): es la base de datos de todo y su regresión protege lo que ya funciona.
2. Esqueleto visual (T072–T078) y luego Inicio + Segmentación (MVP visual de la iteración).
3. Artículo (US3 + US4) e Impacto (US5).
4. Polish y validación del usuario.

---

## Phase 19: Observaciones del usuario tras la revisión de la iteración 2 (2026-11-14)

Pendiente para la próxima sesión. Antes de corregir, diagnosticar con datos reales (p. ej., FOODS_1_004, FOODS_3_655 y el artículo que el usuario vio con "cuesta 169 US$ más").

- [X] T106 [US1] Embudo con forma de embudo: barras centradas y proporcionales (cada etapa más angosta que la anterior), en src/components/charts/FunnelBar.tsx y los estilos `.funnel-*` de src/styles.css.
- [X] T107 [US4] En la gráfica principal de unidades de Artículo (src/components/charts/UnitsBandChart.tsx, src/views/ItemView.tsx), el pronóstico del escenario activo y la línea base (seasonal naive) no se ven sobre la serie. Diagnosticar por qué (¿`test` llega `undefined`?, ¿claves de bloque?, ¿dominio del eje X?) y corregir.
- [X] T108 [US4] El playground y la ficha del artículo no cuadran: en un mismo bloque muestran cifras distintas. Comparar bloque a bloque lo que muestra cada uno (src/views/PlaygroundView.tsx frente a ItemView/UnitsBandChart: `units_observed` frente a `units_completed`, filtro por `first_block` o `step`, escenario) y unificar la fuente. Si no se puede corregir, se omite el playground (decisión del usuario).
- [X] T109 [US4] El "Resultado del año" del playground dice "el modelo cuesta X más que repetir el año anterior" en casi todos los artículos que revisó el usuario (p. ej., 169 US$), en contra del impacto agregado y del error. Verificar el signo y la fuente de `items.json.impact[esc].impact` frente a `item_impact` del proyecto de datos, cuántos artículos salen negativos (en concentration, `improve`/`worsen`) y si el rótulo de `Saving` está invertido. Corregir el dato o el rótulo según lo que muestren los datos.
- [X] T110 [US4] El playground debe mostrar la serie completa (historia desde el lanzamiento) y rellenar el tramo de test bloque a bloque a medida que se avanza, no solo los bloques de test.
- [X] T111 [US5] En Impacto, la curva "Exceso frente a venta perdida según el nivel de servicio" tiene las etiquetas o leyendas superpuestas (src/components/charts/ImpactCurve.tsx: etiqueta del eje Y, leyenda, márgenes). Corregir.
- [X] T113 [US3] Escala del eje Y de la gráfica de unidades (src/components/charts/UnitsBandChart.tsx): en algunos artículos no se ven las bandas ±3σ porque la escala se ajusta solo a la serie y las deja fuera. Probable causa: `domain={[0, 'auto']}` toma solo los datos de las líneas, y Recharts descarta las `ReferenceLine` que caen fuera del dominio. Calcular el dominio explícito como `[0, max(serie, band_upper, pronóstico, línea base, venta completada) × (1 + margen)]`, con un margen fijo (p. ej., 8 %) en una constante, y redondear las marcas. Verificar con un artículo de σ alta y otro de σ baja que se vean la serie, la media, +3σ, −3σ (o su rótulo en 0) y el pronóstico.
- [X] T112 Correr `npm test`, `npm run build` y `pytest export/tests` y dejar al usuario los comandos para revisar.

---

## Phase 20: Módulo "Cómo usar", ayudas de variables y % de la demanda (2026-11-14)

Pedido del usuario: un módulo de uso con el objetivo del proyecto, los módulos, recorridos guiados ("¿qué quieres ver?") y un glosario; un ícono "?" con la definición y la unidad de cada variable de la tarjeta de Segmentación (las mismas definiciones del glosario); y en Impacto, el ahorro como % de la demanda del año de test (21,86 M US$). Lo construido hasta la Fase 19 no se modifica, salvo lo que se indica.

- [X] T114 Crear src/glossary.ts como fuente única de términos (`id`, `term`, `group`, `definition`, `unit`), con las definiciones de las variables del radar tomadas del nb 03 (Etapa 9.0, versión limpia) y los términos de serie, pronóstico, error e impacto de spec.md y research.md.
- [X] T115 Crear src/components/HelpTip.tsx: botón "?" accesible (hover, foco y clic) con un globo que muestra la definición y la unidad, y el enlace "Ver en el glosario" a `#/guia/glosario/{id}`.
- [X] T116 En src/views/SegmentationView.tsx, agregar `HelpTip` junto al nombre de cada eje en la tarjeta contigua, y corregir el pie del radar: la mediana global es la de los 3.049 artículos (en CV, los que tienen CV), no la de los 2.887.
- [X] T117 Agregar la ruta `guide` (`#/guia`, `#/guia/glosario` y `#/guia/glosario/{id}`) en src/router.ts, el módulo "Cómo usar" en src/components/Sidebar.tsx (ícono de ayuda en src/components/Icons.tsx) y su vista en src/App.tsx.
- [X] T118 Crear src/views/GuideView.tsx: objetivo del proyecto, datos y alcance, los 4 módulos con qué responden y cómo usarlos, el selector "¿Qué quieres ver?" con recorridos guiados paso a paso, y el glosario con búsqueda.
- [X] T119 Crear src/components/GuideWalkthrough.tsx: pantalla esquemática animada (panel lateral y zonas del módulo) que resalta la zona de cada paso; anterior, siguiente, reproducción automática (respeta `prefers-reduced-motion`) y enlace "Ir ahí →" a la ruta real.
- [X] T120 En src/views/ImpactView.tsx, agregar a las tarjetas "Exceso evitado" y "Venta recuperada" su % de la demanda del año de test (`meta.total_demand_test`, 21,86 M US$), con la demanda visible en la tarjeta.
- [X] T121 Pruebas: rutas de la guía, glosario completo para los 5 ejes del radar, `HelpTip` en Segmentación y el % en Impacto (A: 15,0 % y 4,2 %); correr `npm test`, `npm run build` y `pytest export/tests`; anotar los cambios en plan.md y el contrato de rutas.
