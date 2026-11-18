# Research: Rediseño del tablero para gerencia

## R1 · Gráficas nuevas en SVG propio
- **Decision**: burbujas, radar, embudo, gráfica del artículo y curva de Impacto en SVG con React.
- **Rationale**: el mockup aprobado fija interacciones (flotación CSS, recuadro por eje, etiqueta con línea vertical, puntos enlazados en la curva) que se logran con poco código propio y sin dependencias nuevas.
- **Alternatives considered**: Recharts con `customized`/tooltips propios (más código, menos control); D3 (dependencia nueva).

## R2 · Lecturas derivadas de Impacto (constitución I.12)
- **Decision**: usar las curvas exportadas del total (`segments.total.curves.A` y `.naive`), interpolar linealmente entre los 17 valores de z: (a) mismo % de demanda atendida → sobrante y ventas perdidas de cada método; (b) mismo sobrante que la línea base → ventas perdidas del pronóstico; (c) desglose por grupo con el mismo tramo (i, t) del total, que suma exactamente.
- **Rationale**: es la lectura natural de una curva por tramos; al 95 % reproduce `meta.headline.A` (3.276.162 y 907.452) con diferencia menor a 0,1 %; en pantalla, al 95 % se muestran las cifras del manifiesto.
- **Alternatives considered**: exportar una rejilla de servicios desde nb06 (exige trabajo en el proyecto de datos; quedó para después).

## R3 · WAPE de la línea base por artículo
- **Decision**: Σ|línea base − venta sin faltantes| ÷ Σ venta sin faltantes sobre el tramo de test del artículo, con la serie exportada; rotulado como calculado en el sitio.
- **Rationale**: aprobado por el usuario (I.12); no reemplaza ninguna cifra exportada (no existe por artículo).

## R4 · Escenario
- **Decision**: la interfaz usa siempre A; `?esc=B` en un enlace antiguo se ignora.
- **Rationale**: FR-002; II.3 se cumple al no mostrar B.

## R5 · Exportar CSV
- **Decision**: descarga con `Blob` y `URL.createObjectURL` en el navegador.
- **Rationale**: sitio estático; no requiere servidor.

## R6 · Paleta
- **Decision**: se conserva la paleta de la guía y se agregan coral (línea base), ámbar (sobrante), rojo suave (ventas perdidas) y verde (ahorro). La regularidad usa los colores de segmento: continuos azul, recurrentes verde, ocasionales violeta.
- **Rationale**: el usuario pidió que la línea base tenga un color distinto y que las cifras de dinero se distingan; la prueba de paleta exige que todo hex esté en la guía.
