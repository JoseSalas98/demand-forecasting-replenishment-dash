# Implementation Plan: Rediseño del tablero para gerencia

**Branch**: `002-rediseno-gerencia` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-rediseno-gerencia/spec.md`

## Summary

Rehacer la capa de interfaz para gerencia según el mockup aprobado (`mockup_dash_ddr.html`) y el
detalle de `cambios_dash_ddr.md`, sin tocar la exportación ni los JSON de `public/data`:

- lenguaje de gerencia, nombres de segmento "familia + regularidad" y vocabulario nuevo;
- detalle técnico detrás de botones ⓘ (páginas propias en Segmentos y Artículo; desplegable en
  la misma tarjeta en Impacto);
- solo escenario A, sin selector ni mención del método; etiqueta de dinero global;
- Impacto con dos palancas (liberar capital, recuperar ventas) calculadas como **lecturas
  derivadas** de las curvas exportadas (constitución 2.0.0, I.12).

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1 (sin cambios)
**Primary Dependencies**: Vite 6.3, Recharts 2.15 (se conserva para histograma, venta en dinero, gráfica de CV y playground); gráficas nuevas en SVG propio (ver research R1)
**Storage**: archivos JSON versionados en `public/data` (solo lectura)
**Testing**: Vitest 3.1 + jsdom (pruebas existentes actualizadas + `tests/impactMath.test.ts`)
**Target Platform**: navegador moderno; GitHub Pages
**Project Type**: sitio estático (frontend)
**Performance Goals**: interacción fluida (control de Impacto y etiquetas de datos sin espera perceptible); animaciones solo de CSS
**Constraints**: sin servidor; sin dependencias nuevas; respeto de `prefers-reduced-motion`
**Scale/Scope**: 6 vistas (Inicio, Segmentos, Detalle de grupos, Artículo, Detalle del artículo, Impacto, Cómo usar) + playground y Origen de los datos sin cambios de fondo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento |
|---|---|
| I.1–I.7 Solo lectura de lo exportado | ✅ Todo sale de `public/data`; no se toca el exportador. |
| I.10–I.11 Agregados y radar del proyecto | ✅ Se leen `segmentation.json` y `descriptive/*`; no se reclasifica. |
| I.12 Lecturas derivadas | ✅ Interpolación lineal de curvas exportadas (servicio continuo, mismo sobrante, desglose por grupo con el z del total) y WAPE de la línea base por artículo desde la serie; rotuladas como calculadas en el sitio en el detalle; al 95 % se muestran las cifras de `meta.headline.A`. |
| II.2 Universo | ✅ Fuera de los 517: "Este artículo no entró al pronóstico" sin cifras de pronóstico. |
| II.3 Escenarios | ✅ Solo A; nunca se mezcla con B. |
| II.4 Dinero | ✅ Etiqueta global en la barra superior. |
| II.5 Versiones de la venta | ✅ "Lo que se vendió" y "Venta sin faltantes (estimada)" rotuladas; nunca se suman. |
| II.6 Colchón | ✅ z por artículo fijo; servicio continuo solo a nivel total/grupo vía I.12. |
| II.7 Tramo de test | ✅ Se usa `item.test_blocks`; nunca 53–65 fijo. |
| III Nada falla en silencio | ✅ Ausentes → "no disponible"; ahorro negativo como costo adicional. |
| IV Sitio estático | ✅ Sin cambios. |
| V Estilo | ✅ Código en inglés, comentarios en español, funciones simples. |
| VI Capa visual | ✅ Se actualizan `diseno/guia_visual.md` (paleta y pantallas) en la misma feature; la prueba de paleta sigue vigente. |

Re-evaluación post-diseño: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/002-rediseno-gerencia/
├── spec.md
├── plan.md               # este archivo
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui-routes.md
├── tasks.md
├── cambios_dash_ddr.md   # detalle por sección, fuentes y cifras de control
└── mockup_dash_ddr.html  # referencia visual aprobada
```

### Source Code (repository root)

```text
src/
├── App.tsx                    # escenario fijo A; barra superior; ruta itemDetail
├── router.ts                  # + #/articulo/:id/detalle
├── format.ts                  # + fmtM, fmtK
├── naming.ts                  # NUEVO: nombres y definiciones de familias y grupos
├── impactMath.ts              # NUEVO: lecturas derivadas de las curvas (I.12)
├── glossary.ts                # reescrito: término, significado, nombre técnico, tema
├── theme.ts / styles.css      # paleta ampliada (línea base coral, sobrante, ventas perdidas, ahorro)
├── components/
│   ├── Topbar.tsx             # NUEVO: etiqueta de dinero global
│   ├── Sidebar.tsx, HelpTip.tsx, Money.tsx, Saving.tsx, ImpactContext.tsx, Pill.tsx (ajustes)
│   └── charts/
│       ├── Bubbles.tsx        # NUEVO
│       ├── GroupRadar.tsx     # NUEVO (recuadro por eje)
│       ├── Funnel.tsx         # NUEVO (embudo gráfico)
│       ├── ArticleChart.tsx   # NUEVO (marcadores, etiqueta de datos, acercamiento)
│       ├── TradeoffCurve.tsx  # NUEVO (curva sobrante vs. ventas perdidas)
│       └── UnitsBandChart.tsx, UnitsHistogram.tsx, MoneyChart.tsx, FunnelBar.tsx (se conservan)
└── views/
    ├── HomeView.tsx, SegmentationView.tsx, SegmentDetailView.tsx, ItemView.tsx,
    ├── ItemDetailView.tsx (NUEVO), ImpactView.tsx, GuideView.tsx (reescritas)
    └── PlaygroundView.tsx, DataSourcesView.tsx (ajustes menores)
tests/  (views.smoke, charts, format, theme actualizadas; impactMath nueva)
diseno/guia_visual.md (actualizada)
```

**Structure Decision**: se conserva la estructura de un solo proyecto frontend; los componentes
que quedan sin uso (matriz, radar y barras de Recharts, selector de z, recorrido guiado, selector
de escenario) se eliminan.

## Complexity Tracking

| Decisión | Por qué | Alternativa descartada |
|---|---|---|
| Gráficas nuevas en SVG propio | Las interacciones aprobadas (burbujas que flotan y se reacomodan, recuadro por eje del radar, etiqueta de datos con línea vertical, curva con dos puntos enlazados) no las da Recharts sin código equivalente o mayor. | Recharts con componentes personalizados: más código y menos control del diseño aprobado. |
