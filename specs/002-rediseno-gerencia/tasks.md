# Tasks: Rediseño del tablero para gerencia

**Input**: `specs/002-rediseno-gerencia/` (spec, plan, research, data-model, contracts, cambios_dash_ddr.md, mockup_dash_ddr.html)

**Tests**: se actualizan las pruebas existentes y se agrega `tests/impactMath.test.ts`.

## Phase 1: Setup y base compartida

- [x] T001 Ampliar la paleta en `diseno/guia_visual.md`, `src/theme.ts` y `src/styles.css` (línea base coral, sobrante, ventas perdidas, ahorro)
- [x] T002 [P] Agregar `fmtM` y `fmtK` en `src/format.ts`
- [x] T003 [P] Crear `src/naming.ts` con nombres, definiciones y políticas de los grupos
- [x] T004 [P] Crear `src/impactMath.ts` (lecturas derivadas, I.12) y `tests/impactMath.test.ts`
- [x] T005 Reescribir `src/glossary.ts` (término, significado, nombre técnico, tema)
- [x] T006 Barra superior con etiqueta de dinero global (`src/components/Topbar.tsx`), `Money` sin rótulo por cifra, `Sidebar` con los nombres nuevos, `App` con escenario fijo A y ruta `itemDetail` en `src/router.ts`
- [x] T007 Eliminar componentes sin uso (matriz, radar y barras de Recharts, selector de z, recorrido guiado, selector de escenario)

## Phase 2: User Story 1 · Impacto (P1) 🎯 MVP

- [x] T010 [US1] Curva sobrante vs. ventas perdidas en SVG (`src/components/charts/TradeoffCurve.tsx`)
- [x] T011 [US1] Reescribir `src/views/ImpactView.tsx`: control 90–99 %, dos palancas con barras de escala fija, detalle desplegable en la misma tarjeta, desglose que suma el total, franja de concentración y top 10

## Phase 3: User Story 2 · Segmentos (P2)

- [x] T020 [P] [US2] Burbujas (`src/components/charts/Bubbles.tsx`) con flotación CSS, selector de tamaño y definiciones al pasar el cursor
- [x] T021 [P] [US2] Radar con recuadro por eje (`src/components/charts/GroupRadar.tsx`)
- [x] T022 [P] [US2] Embudo gráfico (`src/components/charts/Funnel.tsx`)
- [x] T023 [US2] Reescribir `src/views/SegmentationView.tsx` (burbujas, panel del grupo con barras y "?", embudo con cifras)
- [x] T024 [US2] Reescribir `src/views/SegmentDetailView.tsx` (pestañas, comparación, todos los artículos ordenables, gráfica de CV)

## Phase 4: User Story 3 · Artículo (P3)

- [x] T030 [US3] Gráfica del artículo en SVG (`src/components/charts/ArticleChart.tsx`): series, marcadores, etiqueta de datos, acercamiento al año de prueba, bandas opcionales
- [x] T031 [US3] Reescribir `src/views/ItemView.tsx` (frase, gráfica, ahorro, ⓘ)
- [x] T032 [US3] Crear `src/views/ItemDetailView.tsx` (tabla del cálculo del ahorro, error, histograma, dinero, tabla por periodo con CSV, enlace al playground)
- [x] T033 [US3] Ajustar `PlaygroundView`, `ImpactContext`, `Saving` y `UnitsBandChart` al vocabulario nuevo sin escenario

## Phase 5: User Story 4 · Cómo usar e Inicio (P4)

- [x] T040 [US4] Reescribir `src/views/GuideView.tsx` (para qué sirve, tarjetas de secciones, glosario en tabla con buscador)
- [x] T041 [P] Reescribir `src/views/HomeView.tsx` (solo bienvenida)

## Phase 6: Polish

- [x] T050 Actualizar `tests/views.smoke.test.tsx` y `tests/charts.test.tsx` a la interfaz nueva
- [x] T051 Actualizar `diseno/guia_visual.md` (estructura y pantallas) y el README si menciona escenarios
- [x] T052 Verificar las cifras de control de `quickstart.md` en el navegador
