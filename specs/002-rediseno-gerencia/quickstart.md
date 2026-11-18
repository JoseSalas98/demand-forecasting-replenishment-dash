# Quickstart: validar el rediseño

1. `npm ci && npm test && npm run build` (Node ≥ 18.19).
2. `npm run dev` y abrir el sitio.
3. Verificar las **cifras de control** de `cambios_dash_ddr.md`:
   - `#/impacto` al 95 %: 3,28 M US$ (−77 %), línea base 4,23 M, pronóstico 0,95 M; recuperar ventas 0,91 M y 99,2 %; desglose 0,55 + 1,33 + 1,40.
   - Mover el control a 90 % y 99 %: las dos barras se mueven; el desglose suma el total; con el detalle abierto, la curva y el z se actualizan.
   - `#/segmentacion`: Vitales 592 artículos y 82,89 M US$; recuadro por eje en el radar; "?" en cada barra; embudo con 52 %, 21,86 M US$ y 75.
   - `#/articulo/FOODS_3_090/detalle`: costo total 128.579 vs. 14.042 US$; ahorro 114.537 US$; WAPE 5,2 % vs. 6,7 %.
   - `#/articulo/HOUSEHOLD_1_366`: el año de prueba sombrea los periodos 51–63.
   - `#/articulo/FOODS_1_001?pron=0`: "Este artículo no entró al pronóstico".
4. Revisar que ninguna pantalla mencione "escenario B", "a un paso" ni repita "a precio de venta, no es margen" bajo las cifras.
