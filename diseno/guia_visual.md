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
| Coral | `#FF9F6E` | **Línea base** (seasonal naive), siempre discontinua y con marcadores en rombo |
| Ámbar | `#F2B24C` | **Mercancía sobrante** (exceso en anaquel) |
| Rojo suave | `#EF7D7D` | **Ventas perdidas** por falta de producto |
| Verde ahorro | `#4CC38A` | **Ahorro**, capital liberado y ventas recuperadas |
| Azul | `#2B95E1` | Segmento **AX** |
| Verde | `#148E66` | Segmento **AY** |
| Violeta | `#725FB3` | Segmento **AZ** |
| Plateado | `#D6E0EC` | **Venta real** (unidades y dinero) |
| Pizarra | `#7D8AA6` | **Bandas ±3σ**, histograma, etapas del embudo sin pronóstico |
| Gris medio | `#56637C` | Línea de la **media** |

## 3. Colores con significado fijo

El mismo concepto lleva el mismo color en todas las gráficas:

- Venta real ("lo que se vendió"): plateado, línea continua. Venta sin faltantes (estimada): plateado, línea punteada.
- Pronóstico: cian, línea continua con círculos. Línea base: coral, línea discontinua con rombos. Forma y color distintos para que nunca se confundan, incluso sin color.
- Media: gris medio. Bandas ±3σ: pizarra.
- Grupos de regularidad: continuos azul, recurrentes verde, ocasionales violeta. El color lo da el nivel de regularidad; la familia (Vitales, Útiles, Complementarios) la da la posición y el halo punteado.
- Mercancía sobrante: ámbar. Ventas perdidas: rojo suave. Ahorro o mejora: verde ahorro. Se usan en cifras y textos de Impacto y del ahorro por artículo.
- Elemento activo de la interfaz y botón principal: cian.
- Los textos (valores, etiquetas, leyendas) usan los colores de texto, no el de la serie. La identidad la da la marca de color al lado.
- Nunca se agregan colores fuera de esta tabla. Ninguna gráfica lleva más de cuatro colores de datos.

## 4. Estructura

- **Panel lateral fijo** a la izquierda: marca "DDR", "Reposición guiada por la demanda" y módulos con ícono de línea (Inicio, Segmentos, Artículo, Impacto, Cómo usar). El módulo activo va con fondo de tarjeta e ícono cian. "Origen de los datos" queda al pie.
- **Barra superior** con una sola etiqueta siempre visible: "Cifras a precio de venta · no es margen". No se repite bajo cada cifra.
- **Encabezado** de cada módulo: título a la izquierda, subtítulo en texto secundario y, a la derecha, buscador o filtros en forma de píldora.
- **Contenido en tarjetas** con esquinas redondeadas, borde fino y separación uniforme, a todo el ancho de la pantalla. Sin barras de color decorativas.
- **Todo lo que se puede pulsar parece un botón:** borde visible, relleno de tarjeta y foco visible con teclado. El detalle técnico se abre con un botón con ícono ⓘ ("Detalle", "Detalle del pronóstico", "Ver el cálculo", "Ver detalle del cálculo").
- **Lenguaje de gerencia** en la vista principal; los nombres técnicos (WAPE, RMSSE, z, CV) viven en el detalle y en la columna "Nombre técnico" del glosario. El método del pronóstico no se menciona.
- Tipografía sans-serif limpia. Las cifras van grandes y en negrita; las etiquetas, pequeñas y en texto secundario.

## 5. Pantallas e interacciones

### 5.1 Inicio
- Fondo: red neuronal animada, con baja opacidad.
- Al centro: "Demand Driven Replenishment", el título "Reposición guiada por la demanda", "Walmart · 10 tiendas · 2011–2016" y un único botón principal "Explorar los segmentos →". Sin cifras.

### 5.2 Segmentos
- **Burbujas:** tres familias (Vitales, Útiles, Complementarios) en halos punteados; dentro, tres burbujas por regularidad (continuos, recurrentes, ocasionales) con relleno translúcido plano. Vitales a la izquierda con la marca "CON PRONÓSTICO". Tamaño por venta o por número de artículos (píldoras).
- Movimiento suave de flotación (3–5 px); se apaga con "reducir movimiento". Al pasar el cursor por un halo se lee la definición de la familia; por una burbuja, la definición combinada ("artículo vital continuo…").
- **Panel del grupo** (clic en una burbuja): nombre, artículos y venta, una frase frente al artículo típico, cuántos tienen pronóstico y la política sugerida; radar con los Vitales y el artículo típico (al pasar el cursor por un eje, recuadro con el valor de cada serie en su unidad); barras frente al artículo típico (1×) con ayuda "?" que da definición, unidad y valor crudo.
- **Embudo** 30.490 → 3.049 → 592 → 517 con tres cifras al lado: % de la venta cubierta, demanda del año de prueba en juego y Vitales sin pronóstico.
- Botón ⓘ **Detalle**: página con la comparación de error (pronóstico frente a línea base) de los tres grupos Vitales, la lista ordenable de sus artículos y la dispersión del CV.

### 5.3 Artículo
- **Selector de artículo** con autocompletado y la píldora "Solo con pronóstico" (517 o 3.049). Sin artículo elegido se abre uno por defecto.
- Frase principal: "el pronóstico acertó N de cada 100 unidades…".
- **Gráfica de unidades cada 4 semanas:** lo que se vendió, venta sin faltantes, pronóstico y línea base; la leyenda enciende y apaga cada serie y la media ±3σ. Píldoras "Toda la historia | Año de prueba" para acercarse. Al pasar el cursor, recuadro con la fecha y las unidades de cada serie, y aviso cuando hubo faltante. Eje de años; en el acercamiento, meses.
- **¿Cuánto ahorra este artículo?:** menos sobrante, efecto en ventas perdidas y ahorro neto, con el botón "Ver el cálculo".
- Página **Detalle del pronóstico:** tabla del cálculo del ahorro (línea base, pronóstico y diferencia), errores (WAPE, MAE, RMSSE, CV), histograma, venta en dinero y tabla por periodo exportable a CSV. El WAPE de la línea base se marca como calculado en el sitio.
- Si el artículo no está entre los 517: solo su historia, con "Este artículo no entró al pronóstico" y un botón al embudo.

### 5.4 Impacto
- **Control "¿Qué porcentaje de la demanda quieres atender?"** de 90 % a 99 % (paso 0,5; 95 % por defecto).
- **Dos palancas** que no se suman: *Liberar capital* (mismo % atendido, menos sobrante) y *Recuperar ventas* (mismo sobrante que la línea base, menos ventas perdidas). Cada una con barras de escala fija para que ambas barras se muevan con el control.
- Al 95 % las cifras son las oficiales; en otros valores se leen entre dos puntos de la curva exportada (lectura derivada, constitución I.12).
- **"Ver detalle del cálculo"** despliega, en la misma tarjeta, la curva sobrante frente a ventas perdidas, el z de cada estrategia, el WRMSSE y la lectura por segmento.
- **¿Dónde está el capital liberado?:** barras por grupo Vital que suman el total, y una franja con la concentración del ahorro.
- **Los 10 artículos que más ahorran**, en mil US$, con botón a cada artículo.

### 5.5 Cómo usar
- Para qué sirve el tablero, una tarjeta por sección (para qué sirve, pasos y botón "Ir a…") y el **glosario en tabla**: Término | Qué significa | Nombre técnico, agrupado y con buscador.

## 6. Lo que no se hace

- No se inventan cifras: todo sale de los archivos exportados; las lecturas derivadas se rotulan como calculadas en el sitio.
- No se usan colores fuera de la paleta.
- No se recalcula el pronóstico en el navegador.
- No se menciona el método del pronóstico ni se ofrecen escenarios.
