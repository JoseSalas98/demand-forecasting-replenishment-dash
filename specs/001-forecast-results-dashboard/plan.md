# Implementation Plan: Frontend de resultados del pronóstico de reposición

**Branch**: `001-forecast-results-dashboard` | **Date**: 2026-11-13 (iteración 2) | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-forecast-results-dashboard/spec.md`

## Summary

**Iteración 2 (2026-11-13; constitución 1.1.1).** Hay dos frentes:

1. **Rehacer la interfaz** según la guía visual:
   - tema oscuro con panel lateral y 4 módulos: Inicio, Segmentación, Artículo e Impacto;
   - paleta fija;
   - red animada en Inicio.
2. **Ampliar la exportación**, solo por adición, al nuevo alcance:
   - catálogo de los 3.049 y serie descriptiva por artículo (unidades y dinero por bloque, media,
     σ, bandas ±3σ, CV descriptivo e histograma);
   - matriz ABC × XYZ (2.887 con clase XYZ) y radar, **leídos** del proyecto de datos.

La exportación de los 517 no cambia: mismos builders, mismos archivos y mismas 15 pruebas.

**Fuente de la matriz y el radar (resuelto 2026-11-14)**: el nb 03 congeló `segmentation_items`
(3.049) y `radar_profiles` (9 celdas × 5 ejes); verificados contra `targets` (research R10).

**Iteración 1 (cerrada salvo T054).** Sitio estático para los 517 con embudo, segmentos,
historia, pronóstico A/B frente a la línea base e impacto. Un script Python lee las salidas con
`load_frozen`, `load_tables` y `load_interim` y escribe JSON versionados.

## Technical Context

**Language/Version**: Python 3.12.3 (exportador, con el `.venv` del proyecto de datos o el grupo
`front` de uv); TypeScript 5.8; Node 18.19 local y 22 en Actions.

**Primary Dependencies**:
- Exportador: pandas 3.1.0, pyarrow 26.0.0, numpy 2.5.4 y `src` del proyecto de datos.
- Interfaz: React 19.1, Vite 6.3 y Recharts 2.15 (radar, líneas, barras). **Sin dependencias
  nuevas**: íconos SVG en línea, combobox y red animada propios (`canvas`).

**Storage**: JSON en `public/data/` (versionados). Se agregan `catalog.json`, `segmentation.json`
y `descriptive/<id>.json` (3.049).

**Testing**:
- pytest: las 15 pruebas actuales sin cambios, más pruebas del catálogo, la serie descriptiva y la
  fuente pendiente u obligatoria.
- vitest: formateadores y humo de los 4 módulos con jsdom.
- Validación manual: [quickstart.md](quickstart.md), filas 13–20.

**Target Platform**: navegador de escritorio moderno (los mockups son de escritorio); GitHub
Pages.

**Project Type**: sitio web estático + script de exportación.

**Performance Goals**: cada vista < 3 s (SC-008). La ficha carga `catalog.json` (≈ 200 KB), un
`descriptive/<id>.json` y, si es de los 517, un `series/<id>.json`. La animación de Inicio
corre a ≤ 60 fps y se pausa cuando la pestaña está oculta.

**Constraints**:
- sitio < 1 GB (estimado < 30 MB);
- sin servidor;
- sin recálculo de segmentación, pronóstico ni impacto;
- solo agregados descriptivos (I.10);
- solo colores de la paleta (VI);
- nada falla en silencio.

**Scale/Scope**:
- 3.049 artículos descriptivos y 517 con pronóstico, × 64 bloques;
- matriz de 9 celdas (2.887 artículos con clase XYZ);
- 4 módulos + detalle de segmento + playground + datos.

## Constitution Check (1.1.1)

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Regla | Cómo se cumple | Estado |
|---|---|---|---|
| I.1–I.3 | Leer con verificación; no recalcular | Lecturas nuevas: `item_units`/`item_spend` (`load_interim`, ya cargados) y `segmentation_items`/`radar_profiles` (`load_frozen`) | ✅ |
| I.4–I.5 | Origen registrado; versión fijada | Fuentes nuevas en `meta.sources`; pendientes en `meta.pending`; `public/data/` versionado | ✅ |
| I.10 | Solo agregados descriptivos | Venta por bloque, media, σ, bandas, CV descriptivo e histograma, nada más (R13) | ✅ |
| I.11 | Matriz y radar se leen, no se calculan | `segmentation.json` copia `SEG`; si `SEG` no existe, no se muestra (R10–R11) | ✅ |
| II.2 | 3.049 descriptivos; 517 pronóstico | `catalog.json` (3.049) frente a `items.json` (517); "Este artículo no entró al pronóstico" | ✅ |
| II.3 | A y B separados | RMSSE A y B en tarjetas separadas y rotuladas; el resto según `?esc` (R15) | ✅ |
| II.5 | Observada vs completada | Plateado continuo frente a punteado, rotulados (R14) | ✅ |
| II.6 | z fijo por artículo; z móvil solo en segmento/total | Deslizador solo en Impacto | ✅ |
| II.8 | Bandas media ± 3σ desde el lanzamiento | `descriptive.stats`, desde `first_block` (R13; resuelve TODO(BANDAS_RANGO)) | ✅ |
| III | Nada en silencio | Una fuente declarada que falla tumba la exportación; una pendiente queda registrada y visible | ✅ ver R11 |
| IV | Estático < 1 GB | < 30 MB | ✅ |
| V | Simplicidad | Sin dependencias nuevas; builders nuevos en el mismo script | ✅ |
| VI.1 | Guía en `diseno/`; cifras de mockups = ejemplo | Se sigue la disposición; ninguna cifra de los mockups se usa (R9) | ✅ |
| VI.2–VI.3 | Diseño → guía; alcance → spec | Filtros por estado no construidos y embudo de 4 etapas (R16, R17); exportación ampliada pese a "no se toca" (R19) | ✅ |
| Método 4 | Solo lo construido (+ I.10) | Ejes del radar = los del nb 03, no los del mockup | ✅ |

**Resultado**: pasa, sin bloqueantes. Ninguna violación que justificar.

## Desvíos de la guía visual (iteración 2)

| Guía / mockup | Qué se entrega | Por qué |
|---|---|---|
| Filtros por estado CA/TX/WI | No se construyen | Fuera de la spec y sin datos por estado (R17) |
| Embudo 3.049 → 592 → 517 | 30.490 → 3.049 → 592 → 517 | FR-005; en alcance manda la spec (R16) |
| Radar con Edad, Racha larga, Días mínimos | Ejes del nb 03: gasto, unidades, CV, % días en cero, velocidad | Lo que existe en el proyecto de datos (R10) |
| RMSSE de la línea base bajo el del artículo | "línea base: no disponible por artículo" | No existe por artículo (FR-011, R8) |
| Matriz que suma el catálogo | Solo los 2.887 con clase XYZ | Decisión del usuario (constitución 1.1.0, II.2) |
| "No se toca la exportación" | La exportación crece solo por adición | La spec la amplía (R19) |

## Desvíos de la especificación (iteración 1, por la regla "solo lo construido")

| Requisito | Qué pide | Qué se entrega | Por qué |
|---|---|---|---|
| FR-005 / US1 | Embudo 3.049 → … → 592 → 517 | 30.490 → 3.049 → 592 → 517 ("salen 75") | 2.886 y 590 no están en ninguna salida con manifiesto (R3) |
| FR-014 / US4-4 | Colchón y cantidad a reponer por bloque | Pronóstico por bloque (A y B) + z fijo e impacto del año | No existen en las salidas; calcularlos sería recálculo (R7) |
| FR-018 / US5-4 | Impacto acumulado bloque a bloque | Acumulados en unidades por bloque; impacto del año al final | No hay impacto por bloque (R8) |
| FR-011 | Error por escenario | RMSSE/WAPE/MAE por artículo para A y B; el naive solo agregado | `item_metrics` no tiene el naive por artículo (R8) |

Estos desvíos ya están reflejados en `spec.md` (FR-005, FR-005b, FR-009, FR-011, FR-014, FR-015,
FR-017, FR-018, SC-004, SC-005 y Assumptions).

## Project Structure

### Documentation (this feature)

```text
specs/001-forecast-results-dashboard/
├── plan.md, research.md (Partes 1–3), data-model.md, quickstart.md
├── contracts/export-schema.md, contracts/ui-routes.md
├── checklists/requirements.md, checklists/validation.md
└── tasks.md
diseno/                            # guía visual y pantallas (constitución VI.1)
```

### Source Code (repository root)

```text
export/
├── export_data.py           # + build_catalog, build_descriptive, build_segmentation (fuente pendiente)
└── tests/
    ├── test_export.py       # 15 pruebas actuales, sin cambios
    └── test_export_v2.py    # catálogo, descriptivos, pendiente/obligatoria, archivos de los 517 intactos

public/data/                 # + catalog.json, segmentation.json, descriptive/<id>.json

src/
├── styles.css               # tokens de la paleta (tema oscuro), panel, tarjetas, píldoras
├── App.tsx                  # panel lateral + módulos; redirecciones de rutas viejas
├── router.ts                # rutas nuevas
├── types.ts, data.ts, format.ts
├── components/
│   ├── Sidebar.tsx, Icons.tsx, Pill.tsx, Card.tsx
│   ├── ItemCombobox.tsx     # escribir o desplegar + filtro "Pronóstico"
│   ├── NeuralBackground.tsx # canvas, movimiento lento, reduced-motion
│   ├── Money.tsx, Saving.tsx, StateViews.tsx, ZSelector.tsx (deslizador)
│   └── charts/
│       ├── SegmentMatrix.tsx, SegmentRadar.tsx, FunnelBar.tsx
│       ├── UnitsBandChart.tsx, MoneyChart.tsx, UnitsHistogram.tsx
│       ├── ImpactCurve.tsx, SegmentBars.tsx
│       └── (los actuales se reutilizan o se retiran)
└── views/
    ├── HomeView.tsx         # #/
    ├── SegmentationView.tsx # #/segmentacion
    ├── SegmentDetailView.tsx
    ├── ItemView.tsx         # #/articulo/:id?
    ├── PlaygroundView.tsx
    ├── ImpactView.tsx       # #/impacto
    └── DataSourcesView.tsx  # #/datos (+ pendientes)

tests/
├── format.test.ts
└── views.smoke.test.tsx     # reescrita para los 4 módulos
```

**Structure Decision**: la misma de la iteración 1. La exportación crece con builders nuevos en el
mismo script. La interfaz se reorganiza en módulos con un panel lateral. El contrato sigue siendo
`public/data/` ([export-schema.md](contracts/export-schema.md)).

## Complexity Tracking

Sin violaciones de la constitución que justificar.

## Cambios durante la implementación (2026-11-13)

| Cambio | Antes (plan / tareas) | Ahora | Por qué |
|---|---|---|---|
| Formato del dinero | Millones desde 1 M US$ (T019) | Millones desde 100.000 US$, 2 decimales | Mostrar "0,91 M US$" como en SC-003 y en la presentación |
| Miles en números | `Intl` es-ES | Agrupación manual | Node 18 no agrupa números de 4 cifras en es-ES |
| Revisión de tipos | `tsc` sobre `src` y `tests` (T005) | `tsc` solo sobre `src`; vitest corre las pruebas | Las pruebas usan módulos de Node sin tipos instalados |
| Pruebas de vistas | Solo formateadores (T4) | Además `tests/views.smoke.test.tsx` con `jsdom` 26.1.0 (dependencia de desarrollo local) | No hay navegador; renderiza cada vista con los JSON reales y detectó el formato de "0,91 M" |
| Inicio de la serie | Historia en bloques 2–65 | Cada artículo desde su primer bloque con venta (`first_block`); antes, `null` y no se muestra | La serie existe desde que empieza su venta; el arranque anterior no corresponde (decisión del usuario, convergencia F1) |
| Calendario | Validar fechas contra `calendar.csv` | Validar que `start_date` avance de a 28 días; sin leer datos crudos | `calendar.csv` no está en las fuentes de I.1 (convergencia F5) |
| Período de los datos | — | `meta.period` (2011-06-27 a 2016-05-22) en la portada y en la ficha | Acotar inicio y fin del dataset (convergencia F4) |
| Archivos no listados en el árbol | — | `types.ts`, `router.ts`, `components/Saving.tsx`, `ZSelector.tsx`, `ItemSearch.tsx`, `StateViews.tsx`, `charts/*` | Detalle de implementación de las mismas vistas |

### Iteración 2 (2026-11-14)

| Cambio | Antes (plan / tareas) | Ahora | Por qué |
|---|---|---|---|
| Prueba de `meta.sources` en `test_export.py` | Las 15 pruebas de la iteración 1 sin cambios | Una aserción pasa de `==` a `>=` (el conjunto de fuentes incluye ahora `segmentation_items` y `radar_profiles`) | La exportación agrega fuentes; los archivos de los 517 siguen idénticos byte a byte (`test_files_of_517_unchanged_against_baseline`) |
| `first_block` | Un solo significado | En `catalog.json` y `descriptive/` es el lanzamiento (primera venta observada); en `items.json`, el inicio de la serie modelada | 186 de los 517 empiezan la serie modelada 1–26 bloques después del lanzamiento; `series/` no cambia (contracts/export-schema.md) |
| Plateado `#D6E0EC` | — | No pasa la banda de luminosidad ni el piso de croma del validador de paleta | Es el color fijo de la guía para la venta real (casi neutro a propósito); se apoya en leyenda y rótulos |
| `ModuleHeader` y `Pill` | Archivos separados (T077) | `ModuleHeader.tsx` y `Pill.tsx`; `Pill.tsx` también exporta `SCENARIO_LABEL` y `ScenarioPills` | Reemplaza a `ScenarioToggle.tsx`, que se borró |
| Comparación AX · AY · AZ | WRMSSE/WAPE del escenario activo | Filas separadas para A, B y línea base | Segmentación no tiene selector de escenario; cada cifra queda rotulada y no se mezclan (II.3) |
| Detalle de segmento | Curvas y selector de z | Sin curvas ni selector (viven en Impacto, regla 5); conserva las lecturas al 95 %, la suma por artículo y la tabla ordenable | T099 |
| `ZSelector` | Valor inicial = z más cercano a z95 | Valor inicial = z cuyo servicio del modelo está más cerca de `meta.service.target` | T096 |
| Combobox | Lista completa | Pinta hasta 400 opciones y pide escribir para filtrar el resto | No crear 3.049 nodos de golpe |
| Tamaño | — | `dist/` 29 MB (JS 700 kB, 194 kB gzip; Vite avisa por el tamaño del bloque) | La mayor parte es `data/` |

### Revisión del usuario (Fase 19, 2026-11-14)

| Cambio | Antes | Ahora | Por qué |
|---|---|---|---|
| Pronóstico en la gráfica de unidades (T107) | Pronóstico, línea base, venta completada y zona de test dentro de un fragmento `<>…</>` | Cada elemento como hijo directo del gráfico; prueba `tests/charts.test.tsx` que cuenta las 4 líneas en el SVG | Recharts 2.15 trae `react-is` 18, que no reconoce los fragmentos de React 19: lo que iba dentro no se dibujaba |
| Escala del eje Y (T113) | `[0, 'auto']`: solo los datos de las líneas | `[0, niceMax(serie, +3σ, media, pronóstico, línea base, completada)]` con `Y_HEADROOM` = 8 % | Las `ReferenceLine` fuera del dominio se descartaban; la escala tampoco salta al avanzar en el playground |
| Playground (T108, T110) | Gráfica propia solo de test con la venta completada | La misma `UnitsBandChart` de la ficha con la historia completa; el test se revela hasta el bloque del paso; la tabla muestra venta observada y completada | La ficha mostraba la observada y el playground la completada: en un mismo bloque daban cifras distintas |
| Signo del ahorro (T109) | Solo "el modelo cuesta X más" | Igual, más el contexto `ImpactContext`: en A, 490 de 517 ahorran y 27 cuestan más; en B, 374 y 143; y por qué (z fijo del 95 % del total) | Los datos son correctos (suma por artículo = total, signo = costo línea base − costo modelo). FOODS_1_024 (−169,74 US$ en A) es uno de los 27 |
| Embudo (T106) | Barras alineadas a la izquierda, ancho lineal | Trapecios centrados con forma de embudo; ancho en escala logarítmica (34 %–100 %), rotulado | 517 es el 1,7 % de 30.490: en escala lineal la última etapa no se ve |
| Curva de Impacto (T111) | Títulos de ejes y leyenda dentro del SVG, encimados | Leyenda arriba a la derecha, títulos de ejes en HTML y tooltip con z, servicio, exceso y venta perdida | Superposición reportada por el usuario |
