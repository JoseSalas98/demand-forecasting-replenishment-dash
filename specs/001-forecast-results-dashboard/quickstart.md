# Quickstart: exportar, ver y validar

## Prerrequisitos

- El proyecto de datos en `DATA_PROJECT_ROOT`, con su `.venv` (Python 3.12.3) y las salidas de
  nb 03, 03b, 05 y 06 en disco.
- Node 18.19 o más (Actions usa 22) y npm.
- `.env` en la raíz de este repositorio (copiar `.env.example`):

  ```text
  DATA_PROJECT_ROOT=/ruta/absoluta/al/proyecto/de/datos
  EXPORT_DIR=public/data
  ```

## 1. Exportar

```bash
"$DATA_PROJECT_ROOT/.venv/bin/python" export/export_data.py
```

**Esperado**: termina con código 0, escribe [los archivos del contrato](contracts/export-schema.md)
en `public/data/` (521 archivos, < 6 MB) y registra cada fuente leída. Con cualquier falla:
código ≠ 0, mensaje con la causa (y artículo, bloque y columna si es un valor fuera de rango), y
`public/data/` queda como estaba.

**Prueba de falla** (una vez): apuntar `DATA_PROJECT_ROOT` a una ruta inexistente → falla con
mensaje claro y no toca `public/data/`.

## 2. Pruebas automáticas

```bash
"$DATA_PROJECT_ROOT/.venv/bin/python" -m pytest export/tests
npm test
```

**Esperado**: todo pasa. Las pruebas del exportador cubren: 517 artículos; segmentos que suman 517;
13 bloques de test por artículo; cuadre del impacto por artículo con el total (≤ 0,01 US$); WRMSSE
igual al manifiesto; rechazo de negativos; falla ante tabla faltante.

## 3. Ver el sitio

```bash
npm install
npm run dev        # http://localhost:5173
npm run build && npm run preview   # lo mismo que se publicará
```

## 4. Validación de cifras (la hace el usuario)

Rutas de la iteración 2 (las de la iteración 1 redirigen).

| # | Dónde | Esperado | Criterio |
|---|---|---|---|
| 1 | `#/impacto`, tarjeta WRMSSE | 0,495 (A) · 0,748 (B) · 0,868 (línea base) | SC-002 |
| 2 | `#/impacto`, escenario A, deslizador al 95 % | ahorro de exceso 3,28 M US$ (77 %); venta recuperada 0,91 M US$ | SC-003 |
| 3 | `#/segmentacion`, tarjeta del embudo | embudo 30.490 → 3.049 → 592 → 517 | SC-004 |
| 4 | `#/segmentacion`, embudo y comparación AX · AY · AZ | con pronóstico AX 191 + AY 229 + AZ 97 = 517 | SC-004 |
| 5 | `#/datos` | verificación `impact_sum_matches_total_A/B` aprobada | SC-005 |
| 6 | `#/articulo/FOODS_1_004` | bloque 64: observada 0, completada 2.142; test 53–65 | R5, R2 |
| 7 | `#/articulo/HOUSEHOLD_1_366` | test en bloques 51–63 | R2 |
| 8 | `#/articulo/FOODS_1_004`, escenario A | impacto 11.558,54 US$; z modelo −0,012, z naive 0,711 | R1 |
| 9 | todas | cada cifra de dinero dice "a precio de venta, no es margen"; ninguna mezcla A y B | SC-006 |
| 10 | `#/articulo`, píldora "Pronóstico" apagada, elegir `HOBBIES_1_001` (no está en los 517) | "Este artículo no entró al pronóstico" con enlace al embudo; serie, bandas, CV e histograma sí; sin métricas | US1-3, FR-001 |
| 11 | desde `#/`, cronómetro | llegar a la ficha de un artículo (panel → Artículo → selector) en < 30 s y ≤ 3 interacciones | SC-007 |
| 12 | sitio publicado, pestaña Red del navegador | `#/` y `#/articulo/FOODS_1_004` cargan en < 3 s | SC-008 |

## 5. Publicar

1. Commit de `public/data/` junto con el código (la copia exportada es la versión fijada).
2. Push a `main` del repositorio público; el workflow de Actions construye y publica en Pages.
3. Repetir la tabla de la sección 4 sobre la URL publicada (SC-001, criterio de cierre).

## 6. Iteración 2: 3.049 artículos, bandas y capa visual

### Prerrequisito del proyecto de datos

Antes, el usuario congela en el nb 03 `segmentation_items` y `radar_profiles` con `freeze`
(contrato en [research.md](research.md), R10). Sin eso, la exportación funciona igual, pero
registra los dos en `meta.pending` y la matriz y el radar dicen "no disponible".

### Exportar y probar (los mismos comandos de las secciones 1 y 2)

**Esperado**:
- las 15 pruebas actuales pasan sin cambios, más las nuevas;
- los archivos de los 517 (`funnel`, `segments`, `items`, `series/`) quedan **idénticos** a los de
  antes de la iteración (comparar con `git diff --stat public/data`, o con `diff -r` contra una
  copia previa);
- se agregan `catalog.json`, `descriptive/` (3.049 archivos) y, si existe la fuente,
  `segmentation.json`;
- el total de `public/data/` queda por debajo de 30 MB (exportación del 2026-11-14: 3.572 archivos, 29 MB).

### Validación (la hace el usuario)

| # | Dónde | Esperado | Criterio |
|---|---|---|---|
| 13 | `#/segmentacion` | La matriz suma 2.887 (162 sin clase XYZ fuera): AX 207 · AY 251 · AZ 134 | SC-004 |
| 14 | `#/segmentacion` | Embudo 30.490 → 3.049 → 592 → 517; con pronóstico 191 + 229 + 97 = 517 | SC-004 |
| 15 | `#/segmentacion`, clic en AY | El radar y la tarjeta se filtran a AY; al pasar el cursor por la tarjeta aparece el valor crudo | FR-007 |
| 16 | `#/articulo`, píldora "Pronóstico" activa | La lista tiene 517; al desactivarla, 3.049; al escribir `FOODS_3` se filtra | FR-006 |
| 17 | `#/articulo/FOODS_3_655` | Bandas ±3σ, histograma, CV descriptivo; tramo de test sombreado con modelo y línea base | FR-009b, FR-011 |
| 18 | un artículo con la píldora apagada que no esté en los 517 | "Este artículo no entró al pronóstico" con enlace al embudo; sin métricas | FR-001 |
| 19 | `#/impacto`, A, deslizador al 95 % | 3,28 M US$ de exceso evitado; el punto marcado se mueve en las dos curvas | SC-003, FR-016 |
| 20 | todas | Solo colores de la paleta; el dinero con su rótulo; A y B nunca juntos | VI, SC-006 |
