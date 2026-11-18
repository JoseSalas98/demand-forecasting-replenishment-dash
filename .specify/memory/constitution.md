<!--
Sync Impact Report
- Versión: 1.1.2 → 2.0.0 (MAJOR: se redefine el principio I al permitir lecturas derivadas en el sitio).
- Principios modificados: I (nuevo I.12 · lecturas derivadas en el sitio); II.4 (etiqueta de dinero
  única y global); II.6 (% de demanda atendida continuo mediante I.12); Reglas de método 4 (excepción I.12).
- Secciones agregadas: ninguna. Secciones eliminadas: ninguna.
- Motivo: feature 002 (rediseño para gerencia a partir del mockup aprobado por el usuario el 2026-11-18).
- Plantillas: sin cambios requeridos (la puerta "Constitution Check" del plan sigue igual).
-->
# Constitución — Frontend de resultados del pronóstico de reposición

Reglas que no se negocian. Cualquier cambio a este documento se versiona (ver Gobierno).

**Propósito.** Mostrar a la gerencia regional y a la de operaciones los resultados del proyecto de
pronóstico de reposición sobre el año de test: segmentación, historia de venta, pronóstico frente a
la línea base e impacto en dinero. La segmentación y la historia cubren los 3.049 artículos del
catálogo; el pronóstico y el impacto, los 517 artículos pronosticados. Con eso pueden ver cuánto
reponer y cuánto cuesta equivocarse.

## Principios fundamentales

### I. Fuente de la verdad: solo lectura, nunca recálculo

1. Las cifras MUST venir de las salidas del proyecto de ciencia de datos:
   - segmentación congelada (`data/processed/targets.parquet`);
   - datasets (`data/interim/nb03b_datasets/`);
   - test (`data/interim/nb05_test/`);
   - impacto (`data/interim/nb06_impact/`);
   - intermedios de venta (`data/interim/`).
2. El script de exportación MUST NOT recalcular segmentación, pronóstico ni impacto. Solo los lee y
   calcula los agregados descriptivos que permite I.10.
3. La segmentación MUST leerse con verificación de hash (`src.freeze.load_frozen`) y las tablas con
   verificación de forma (`src.data.load_tables`; intermedios con `src.data.load_interim`). Las
   lecturas directas (p. ej., `pd.read_parquet` sobre esas rutas) están prohibidas.
4. La exportación MUST registrar la fecha y el origen de cada manifiesto que leyó.
5. Los archivos exportados se versionan en el repositorio del frontend: esa es la versión fijada.
   Las salidas del modelo no están en Git, así que la copia exportada es la referencia.
6. La ruta al proyecto de datos y la carpeta de destino MUST leerse de la sección “Stack y rutas de
   trabajo” (o del `.env` que esa sección indique). Ningún código las escribe fijas.
7. El sitio MUST leer solo los archivos exportados y versionados. Nunca lee el directorio `data/`
   del proyecto de datos.
8. El contrato de datos (rutas, llaves, columnas y manifiestos) es el mapa del flujo de datos
   (`mapa_flujo_datos.md`) dentro de `DATA_CONTRACT`.
9. Los demás documentos de `DATA_CONTRACT` (explicación del código, presentación de negocio y sus
   datos) son **consulta**: sirven para entender qué hace el proyecto, usar su vocabulario y seguir
   su relato de negocio. MUST NOT ser fuente de cifras del sitio: una cifra que solo existe en un
   documento o en la presentación (p. ej., etapas del embudo 2.886 y 590) no se muestra hasta que
   exista en una salida con manifiesto. Sí pueden usarse para contrastar que las cifras exportadas
   coinciden con lo presentado a negocio.
10. La exportación MAY calcular agregados descriptivos de la venta: venta por bloque (unidades y
    dinero), media, σ, bandas (II.8), coeficiente de variación descriptivo e histograma. Se
    rotulan como descriptivos y nunca reemplazan una cifra que ya existe en una salida del modelo
    (p. ej., el coeficiente de variación de train de la segmentación).
11. La matriz ABC × XYZ de los 3.049 artículos y los perfiles del radar MUST leerse del proyecto de
    datos (`segmentation_items` y `radar_profiles`, con `load_frozen`); MUST NOT calcularse en la
    exportación. Clasificar (ABC, XYZ, celda) y las medianas del radar son del proyecto de datos;
    la exportación MAY contar los artículos y sumar su gasto (`spend`) por celda sobre esa
    clasificación leída, sin reclasificar ni recalcular medianas.

12. El sitio MAY calcular **lecturas derivadas**, solo a partir de los archivos exportados y
    versionados (nunca del proyecto de datos):
    - lecturas interpoladas de las curvas de impacto exportadas (interpolación lineal entre los
      17 valores de z): sobrante y venta perdida a un % de demanda atendida continuo, la venta
      recuperada con el mismo sobrante y el desglose por segmento leído con el z del total;
    - métricas derivadas de las series exportadas (p. ej., el WAPE de la línea base por artículo).

    Reglas: se rotulan como calculadas en el sitio en el detalle técnico; nunca reemplazan una
    cifra que ya exista en una salida del modelo; en el 95 % de demanda atendida se muestran las
    cifras oficiales del manifiesto (`meta.json → headline`).

*Razón:* el frontend comunica resultados ya validados; cualquier recálculo que no sea una lectura
derivada de I.12 crearía una segunda
verdad que la gerencia no puede distinguir de la oficial.

### II. Reglas de dominio

1. **Unidad de tiempo.** Las cifras se cuentan en bloques de 28 días. El ratio es unidades del
   bloque ÷ unidades del bloque anterior.
2. **Universo.** Cada artículo es la suma de sus 10 tiendas.
   - Vistas descriptivas (segmentación y artículo): los 3.049 artículos del catálogo. La matriz
     ABC × XYZ y el radar muestran solo los que tienen clase XYZ (2.887); los 162 sin clase XYZ no
     entran a la matriz, pero sí a la vista de artículo.
   - Pronóstico e impacto: solo los 517 artículos AX/AY/AZ modelados.
   - Un artículo fuera de los 517 MUST NOT mostrar pronóstico ni métricas de error o impacto;
     muestra “Este artículo no entró al pronóstico” con enlace al embudo.
3. **Escenarios.** A (pronóstico a un paso) y B (encadenado de 13 bloques) MUST NOT mezclarse en
   una misma cifra.
4. **Dinero.** Todo valor monetario está a precio de venta y no es margen. Lo indica una etiqueta
   única y siempre visible en la barra superior de todas las pantallas (“Cifras a precio de venta ·
   no es margen”); no se repite debajo de cada cifra.
5. **Versiones de la venta.** La venta observada y la venta completada por quiebres de stock son
   distintas: MUST rotularse siempre y MUST NOT sumarse.
6. **Colchón.** El z por artículo es fijo, el mismo que usaron las salidas de impacto
   (uno por escenario, igual al z del 95 % de servicio del total: A modelo −0,012 y línea base
   0,711; B modelo 0,568 y línea base 0,711). El nivel de servicio solo se mueve a nivel de segmento
   y total: los valores exportados son los de z de −1 a 3 (paso 0,25), y entre ellos el sitio MAY
   leer un % de demanda atendida continuo mediante las lecturas interpoladas de I.12.
7. **Tramo de test.** Son los últimos 13 bloques de cada artículo: 53–65 para 515 artículos;
   51–63 (`HOUSEHOLD_1_366`) y 52–64 (`HOUSEHOLD_1_427`). Nunca se asume un rango fijo.
8. **Bandas y series.** Las series de unidades y de venta en dinero van por bloque de 28 días. Las
   bandas de variabilidad son media ± 3σ de las unidades por bloque del artículo, sobre todo su
   rango con datos: desde el lanzamiento (primer bloque con venta) hasta el bloque 65.

*Razón:* estas reglas evitan las lecturas engañosas más probables (mezclar escenarios, confundir
venta con margen, sumar venta observada con venta completada).

### III. Nada falla en silencio

1. Si falta una tabla o su manifiesto, o si su hash no coincide, la exportación MUST fallar y
   registrarlo. Nunca exporta a medias.
2. Si la exportación no encuentra una ruta de trabajo, MUST fallar y registrarlo.
3. Un valor fuera de rango (unidades negativas, ratio negativo, dinero negativo) MUST rechazarse y
   registrarse con su artículo, bloque y columna. "Dinero" son montos: venta, demanda, venta
   perdida y exceso; nunca son negativos. El **ahorro frente a la línea base** (columnas `impacto*`
   de las salidas: costo de la línea base − costo del modelo) no es un monto sino una comparación:
   es negativo cuando, en ese artículo o componente, el modelo cuesta más que repetir el año
   anterior (27 artículos en A y 143 en B, según las salidas y la presentación de negocio). Se
   muestra tal como viene, con el texto "el modelo cuesta X más que repetir el año anterior"; no se
   rechaza.
4. En pantalla, un dato ausente MUST mostrarse como “no disponible”. Nunca como cero ni en blanco
   silencioso.

*Razón:* un cero falso o una exportación parcial se leen como resultados reales y llevan a
decisiones de reposición equivocadas.

### IV. Sitio estático y versión fijada

1. El sitio es estático: no hay servidor. El “backend” es el script de exportación.
2. Se publica en GitHub Pages desde un repositorio público propio del frontend.
3. El sitio publicado MUST NOT pasar de 1 GB: los datos se exportan por bloque de 28 días, no por
   día.

*Razón:* sin servidor no hay nada que operar; el límite de tamaño es el de GitHub Pages.

### V. Simplicidad y estilo de código

1. Código en inglés; documentación y comentarios en español.
2. Python: funciones en snake_case y clases en CamelCase. Docstrings con una sola estructura:
   descripción, parámetros con tipo y breve descripción, y retorno.
3. TypeScript: la convención estándar del lenguaje (camelCase para funciones y variables,
   PascalCase para componentes y tipos).
4. Abstracciones solo si aportan valor; si no, una sola función (keep it simple).

### VI. Capa visual

1. La interfaz MUST seguir `diseno/guia_visual.md` y las pantallas `diseno/pantalla_*.png`. Las
   pantallas fijan disposición e interacción; sus cifras son ejemplos y MUST NOT tomarse como
   dato ni como valor esperado.
2. Ante un conflicto de diseño (colores, disposición, interacción), manda la guía.
3. Ante un conflicto de alcance o de datos, manda la especificación.

*Razón:* separa quién decide cómo se ve (la guía) de qué se muestra (la especificación).

## Stack y rutas de trabajo

| Capa | Tecnología | Versión |
|---|---|---|
| Exportación de datos | Python, pandas, pyarrow; funciones de carga del proyecto de ciencia de datos (`src.data.load_tables`, `src.freeze.load_frozen`, `src.data.load_interim`) | Python 3.12.3, pandas 3.1.0, pyarrow 26.0.0, numpy 2.5.4 (el `.venv` del proyecto de datos) |
| Interfaz | React con TypeScript; gráficos con Recharts | React 19.1, TypeScript 5.8, Recharts 2.15 |
| Herramienta de construcción | Vite | 6.3 (Node ≥ 18.19) |
| Publicación | GitHub Pages, desde un repositorio público propio del frontend | — |
| Despliegue | GitHub Actions (construye desde los JSON versionados; no exporta) | Node 22 |

**Rutas de trabajo (las completa el usuario).**

| Variable | Qué es | Valor |
|---|---|---|
| `DATA_PROJECT_ROOT` | Ruta absoluta a la raíz del proyecto de ciencia de datos (donde están `data/`, `models/` y `src/`) | `/ruta/absoluta/al/proyecto/de/datos` |
| `DATA_CONTRACT` | Directorio de documentos del proyecto de datos (ver roles abajo) | `/ruta/absoluta/al/proyecto/de/datos/reports/` |
| `EXPORT_DIR` | Carpeta de destino de la exportación, relativa a la raíz de este repositorio | `public/data` |

**Documentos de `DATA_CONTRACT` y su rol** (principio I.8–I.9):

| Documento | Rol |
|---|---|
| `mapa_flujo_datos.md` | Contrato de datos: rutas, llaves, columnas, manifiestos |
| `explicacion_codigo.md` | Consulta: qué hace el proyecto y cómo |
| `pronostico_reposicion/` (`pronostico_reposicion.md`, `.pptx`, `datos/`, `figuras/`) | Consulta: presentación de negocio, vocabulario y relato; contraste de cifras |
| `tratamiento_quiebres_atipicos.pptx`, `figures/` | Consulta: tratamiento de quiebres y figuras de los notebooks |

- El agente toma estas rutas de aquí y no las pregunta. El código las lee de `.env` (ignorado por
  Git), con los mismos valores; se entrega `.env.example`.
- Si la exportación no encuentra una ruta o una tabla, falla y lo registra (principio III).
- El repositorio es público. Si se prefiere no publicar la ruta de la máquina, se deja aquí
  `ver .env` y el valor va en un `.env` ignorado por Git (TODO(RUTA_PUBLICA)).

## Reglas de método

1. Un hito activo a la vez.
2. El proyecto se cierra cuando se cumplen los hitos del RMV de la especificación.
3. La IA escribe el código. El usuario valida el contrato de datos y que las cifras coincidan con
   las salidas del modelo.
4. Lo que no esté construido en el proyecto de ciencia de datos no se incluye, salvo los agregados
   descriptivos de I.10 y las lecturas derivadas de I.12.

## Gobierno

- Esta constitución prevalece sobre cualquier otra práctica del repositorio. Cada especificación,
  plan y tarea MUST verificar su cumplimiento (puerta “Constitution Check” del plan).
- Toda enmienda se hace editando este archivo, con versión nueva y fecha de enmienda, y la aprueba
  el usuario.
- Versionado semántico:
  - MAJOR: se elimina o redefine un principio o una regla de dominio.
  - MINOR: se agrega un principio o sección, o se amplía materialmente una regla.
  - PATCH: aclaraciones, redacción, erratas, o resolver un TODO sin cambiar la regla.
- Los TODO marcados aquí se resuelven contra las salidas del proyecto de ciencia de datos, nunca
  por suposición.

**Version**: 2.0.0 | **Ratified**: 2026-11-13 | **Last Amended**: 2026-11-18
