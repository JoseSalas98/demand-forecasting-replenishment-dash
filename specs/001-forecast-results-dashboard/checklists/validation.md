# Validación de cifras (quickstart.md §4)

**Feature**: [spec.md](../spec.md) · **Exportación**: 2026-11-13 · **Valida**: el usuario
(constitución, Reglas de método 3)

La columna "Automático" es lo que ya comprueban `pytest export/tests` (13 pruebas) y `npm test`
(5 de formato + 8 de vistas con los JSON reales, en jsdom). La columna "Usuario" la marca quien
valida, mirando el sitio (`npm run preview` y luego la URL publicada).

| # | Dónde | Esperado | Automático | Usuario |
|---|---|---|---|---|
| 1 | `#/impacto`, tarjeta WRMSSE | 0,495 (A) · 0,748 (B) · 0,868 (línea base) | ✔ pytest + vista | [ ] |
| 2 | `#/impacto`, escenario A, deslizador al 95 % | ahorro de exceso 3,28 M US$ (77,5 %); venta recuperada 0,91 M US$ | ✔ pytest + vista | [ ] |
| 3 | `#/segmentacion`, embudo | 30.490 → 3.049 → 592 → 517; "salen 75" | ✔ pytest | [ ] |
| 4 | `#/segmentacion` (embudo y comparación) | AX 191 + AY 229 + AZ 97 = 517 | ✔ pytest + vista | [ ] |
| 5 | `#/datos` | `impact_sum_matches_total_A/B` aprobadas | ✔ pytest + vista | [ ] |
| 6 | `#/articulo/FOODS_1_004` | bloque 64: observada 0, completada 2.142; test 53–65 | ✔ pytest + vista | [ ] |
| 7 | `#/articulo/HOUSEHOLD_1_366` | test en bloques 51–63 | ✔ pytest + vista | [ ] |
| 8 | `#/articulo/FOODS_1_004`, escenario A | ahorro 11.558,54 US$; z modelo −0,012, z naive 0,711 | ✔ vista | [ ] |
| 9 | todas | dinero con "a precio de venta, no es margen"; nada mezcla A y B; nunca "impacto negativo" | ✔ parcial (grep + vistas) | [ ] |
| 10 | `#/articulo`, píldora "Pronóstico" apagada | un id fuera de los 517 (p. ej., `HOBBIES_1_001`) → "Este artículo no entró al pronóstico" con enlace al embudo; sin métricas | ✔ vista (ruta directa) | [ ] |
| 11 | desde `#/`, cronómetro | ficha de un artículo en < 30 s y ≤ 3 interacciones | — | [ ] |
| 12 | sitio publicado, pestaña Red | `#/` y una ficha cargan en < 3 s | — (JS 181 KB gzip; datos de la portada < 1 MB) | [ ] |
| P1 | contraste con la presentación (I.9) | 490 de 517 mejoran (A), 27 empeoran; 143 empeoran en B; 3,28 M | ✔ vista (490 de 517) | [ ] |

## Notas

- Montos desde 100.000 US$ se muestran en millones con 2 decimales, como en la presentación
  ("0,91 M US$"); por debajo, con 2 decimales completos.

## Iteración 2 (quickstart.md §6, filas 13–20)

| # | Dónde | Esperado | Usuario |
|---|---|---|---|
| 13 | `#/segmentacion` | matriz = 2.887 (162 sin clase XYZ fuera); AX 207 · AY 251 · AZ 134 | [ ] |
| 14 | `#/segmentacion` | embudo 30.490 → 3.049 → 592 → 517; 191 + 229 + 97 = 517 | [ ] |
| 15 | `#/segmentacion`, clic en AY | radar y tarjeta filtrados a AY; cursor en la tarjeta → valor crudo | [ ] |
| 16 | `#/articulo` | píldora activa: 517; apagada: 3.049; `FOODS_3` filtra | [ ] |
| 17 | `#/articulo/FOODS_3_655` | bandas ±3σ, histograma, CV descriptivo; test sombreado con modelo y línea base | [ ] |
| 18 | artículo fuera de los 517 | "Este artículo no entró al pronóstico"; sin métricas | [ ] |
| 19 | `#/impacto`, A, 95 % | 3,28 M US$; el punto se mueve en las dos curvas | [ ] |
| 20 | todas | solo colores de la paleta; dinero rotulado; A y B nunca juntos | [ ] |
