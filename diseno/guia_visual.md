# Guía visual — Demand Driven Replenishment

Esta guía es obligatoria para la capa visual. Las imágenes `pantalla_*.png` muestran la disposición esperada; este documento fija lo que no se improvisa.

**Alcance del cambio:** rehacer solo la interfaz. No se toca la exportación de datos ni los archivos exportados.

## 1. Tono

Sobrio, corporativo y calmo. Tema oscuro. Nada de colores saturados, destellos ni animaciones bruscas. Quien lo usa decide con la cabeza fría.

## 2. Paleta (fría, validada sobre el fondo oscuro)

Los colores de datos pasaron un validador de paleta: banda de luminosidad para tema oscuro, croma mínimo, separación para daltonismo, distinción con visión normal y contraste frente a la tarjeta.

| Nombre | Hex | Uso |
|---|---|---|
| Fondo | `#0B1220` | Fondo general (azul noche) |
| Panel | `#0F1828` | Panel lateral |
| Tarjeta | `#142036` | Fondo de tarjetas y gráficos |
| Borde | `#25324B` | Bordes de tarjetas, rejillas de gráficos |
| Texto | `#E6EDF5` | Texto principal y cifras |
| Texto secundario | `#8C9AB0` | Etiquetas, ejes, subtítulos |
| Cian | `#009FCA` | Acento de la interfaz (módulo activo, botones, filtros) y **modelo** |
| Ciruela | `#965596` | **Línea base** (seasonal naive) |
| Azul | `#2B95E1` | Segmento **AX** |
| Verde | `#148E66` | Segmento **AY** |
| Violeta | `#725FB3` | Segmento **AZ** |
| Plateado | `#D6E0EC` | **Venta real** (unidades y dinero) |
| Pizarra | `#7D8AA6` | **Bandas ±3σ**, histograma, etapas del embudo sin pronóstico |
| Gris medio | `#56637C` | Línea de la **media** |

## 3. Colores con significado fijo

El mismo concepto lleva el mismo color en todas las gráficas:

- Venta real: plateado. La venta en dinero también es real, así que también va en plateado.
- Modelo (CatBoost): cian. Línea base: ciruela. Son un par complementario y nunca se confunden.
- Media: gris medio. Bandas ±3σ: pizarra.
- Segmentos: AX azul, AY verde, AZ violeta. Nunca comparten gráfica con el par modelo/línea base.
- Matriz ABC × XYZ: cada celda en cian, más intensa cuanto más artículos tiene; la celda seleccionada lleva borde cian.
- Elemento activo de la interfaz: cian.
- Los textos (valores, etiquetas, leyendas) usan los colores de texto, no el de la serie. La identidad la da la marca de color al lado.
- Nunca se agregan colores fuera de esta tabla. Ninguna gráfica lleva más de tres colores de datos.

## 4. Estructura

- **Panel lateral fijo** a la izquierda (~17 % del ancho): marca "DDR", nombre del proyecto y módulos con ícono de línea (Inicio, Segmentación, Artículo, Impacto). El módulo activo va con fondo de tarjeta e ícono cian.
- **Encabezado** de cada módulo: título a la izquierda, subtítulo en texto secundario y, a la derecha, filtros o selectores en forma de píldora.
- **Contenido en tarjetas** con esquinas redondeadas, borde fino y separación uniforme. Sin barras de color decorativas.
- Tipografía sans-serif limpia (en el mockup, Calibri). Las cifras van grandes y en negrita; las etiquetas, pequeñas y en texto secundario.

## 5. Pantallas e interacciones

### 5.1 Inicio (`pantalla_1_inicio.png`)
- Fondo: red neuronal animada. Los nodos pulsan y las conexiones se encienden despacio, con baja opacidad.
- Al centro, sobre un velo oscuro semitransparente: el nombre del proyecto, el subtítulo, tres cifras (artículos analizados, artículos con pronóstico y exceso evitado según el manifiesto) y el botón "Explorar".

### 5.2 Segmentación (`pantalla_2_segmentacion.png`)
- Universo: los 3.049 artículos.
- **Matriz ABC × XYZ** de 3 × 3 con el conteo de cada celda. Al hacer clic en una celda, se filtran el radar y la tarjeta de detalle.
- **Radar** que compara los segmentos con la mediana normalizada de cada variable.
- **Tarjeta contigua:** al pasar el cursor por el radar, muestra la mediana normalizada de cada variable; al pasar el cursor por la tarjeta, muestra el valor crudo.
- **Filtros por estado** (Todas, CA, TX, WI): solo descriptivos.
- **Embudo** al pie: 3.049 → 592 → 517.

### 5.3 Artículo (`pantalla_3_articulo.png`)
- Disponible para los 3.049 artículos.
- **Selector de artículo:** un solo control que acepta dos formas de uso.
  - Escribir: al tipear el nombre o el código (por ejemplo, `FOODS_3`), la lista se filtra mientras se escribe (autocompletado).
  - Desplegar: al abrirlo sin escribir, muestra la lista completa para recorrerla.
- **Filtro "Pronóstico" (botón en píldora junto al selector):** filtra la lista del selector.
  - Activado: la lista muestra solo los 517 artículos con pronóstico.
  - Desactivado: la lista muestra los 3.049 artículos.
  - El estado se ve en el botón: cian cuando está activado y apagado cuando no.
- **Unidades por bloque de 28 días** con la media y las bandas de ±3σ.
- **Venta en dinero por bloque**, a precio de venta.
- **Coeficiente de variación** e **histograma** de unidades.
- **Pronóstico sobre la serie:** aparece solo, sin otro botón, cuando el artículo elegido está entre los 517. Sombrea el tramo de test, rotula Train y Test, y dibuja el modelo y la línea base sobre la venta real. Las tarjetas de métricas muestran RMSSE a un paso, RMSSE encadenado, WAPE y MAE. No hay MAPE.
- Si el artículo no está entre los 517 (solo puede pasar con el filtro desactivado), en el lugar de las métricas aparece "Este artículo no entró al pronóstico" con un enlace al embudo de Segmentación. La serie, las bandas, el coeficiente de variación y el histograma se muestran igual.

### 5.4 Impacto (`pantalla_4_impacto.png`)
- **Selector de escenario:** A (a un paso) o B (encadenado). Cambia todas las cifras. A y B nunca aparecen en una misma cifra.
- **Tarjetas de cifras:** exceso evitado, venta recuperada, WRMSSE en test y número de artículos. Las que vienen del manifiesto lo indican.
- **Curva de exceso frente a venta perdida**, modelo y línea base. La curva ya está calculada para todos los z (−1 a 3, paso 0,25) y no se recalcula.
- **Deslizador de nivel de servicio:** se ajusta a los valores de z calculados. Al moverlo:
  - un punto marcado se desplaza sobre cada curva;
  - las tarjetas de exceso y venta perdida se actualizan con la lectura de ese punto.

  La curva solo cambia al cambiar de escenario o de segmento.
- **Barras por segmento** y **tabla de los artículos con mayor contribución**, con el z fijo.
- Todo el dinero se rotula "a precio de venta, no es margen".

## 6. Lo que no se hace

- No se inventan cifras: todo sale de los archivos exportados.
- No se usan colores fuera de la paleta.
- No se recalcula el pronóstico ni el impacto en el navegador.
