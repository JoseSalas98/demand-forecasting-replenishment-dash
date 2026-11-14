// Glosario: fuente única de definiciones para la guía y las ayudas "?" de la interfaz.
// Variables del radar: nb 03, Etapa 9.0 (versión limpia, train d_122–d_1577). El resto: spec.md y
// research.md del dashboard. No se agregan cifras que no estén en las salidas exportadas.

export type GlossaryGroup = 'General' | 'Segmentación' | 'Serie del artículo' | 'Pronóstico y error' | 'Impacto en dinero';

export interface GlossaryEntry {
  id: string;
  term: string;
  group: GlossaryGroup;
  definition: string;
  unit?: string;
}

export const GLOSSARY_GROUPS: GlossaryGroup[] = ['General', 'Segmentación', 'Serie del artículo', 'Pronóstico y error', 'Impacto en dinero'];

export const GLOSSARY: GlossaryEntry[] = [
  // General
  {
    id: 'bloque',
    term: 'Bloque',
    group: 'General',
    definition: '28 días consecutivos. Los datos van del bloque 2 (desde el 2011-06-27) al 65 (hasta el 2016-05-22). Toda venta, pronóstico y error se lee por bloque.',
    unit: '28 días',
  },
  {
    id: 'articulo',
    term: 'Artículo',
    group: 'General',
    definition: 'Un producto del catálogo M5 de Walmart, sumando sus ventas en las 10 tiendas. El dashboard no baja a tienda ni a región.',
  },
  {
    id: 'catalogo',
    term: 'Catálogo (3.049)',
    group: 'General',
    definition: 'Todos los artículos. Su historia descriptiva (venta, bandas, CV, histograma) se ve en el módulo Artículo.',
    unit: 'artículos',
  },
  {
    id: 'pronosticados',
    term: 'Pronosticados (517)',
    group: 'General',
    definition: 'Artículos AX, AY y AZ que el modelo pronosticó. Solo ellos tienen pronóstico, error e impacto en dinero.',
    unit: 'artículos',
  },
  {
    id: 'train-test',
    term: 'Train y test',
    group: 'General',
    definition: 'Train es el período con el que se construyó el modelo; test son los últimos 13 bloques (53–65 en 515 artículos; 51–63 y 52–64 en dos), donde se mide el pronóstico sin haberlo visto.',
    unit: 'bloques',
  },
  {
    id: 'precio-venta',
    term: 'A precio de venta, no es margen',
    group: 'General',
    definition: 'Todo valor en dinero es unidades × precio de venta. No descuenta costo, así que no es ganancia.',
    unit: 'US$',
  },
  {
    id: 'manifiesto',
    term: 'Manifiesto',
    group: 'General',
    definition: 'Cifras oficiales que guarda el proyecto de datos al cerrar cada etapa (error del test, impacto al 95 %). El dashboard las muestra tal cual.',
  },

  // Segmentación
  {
    id: 'abc',
    term: 'Clase ABC',
    group: 'Segmentación',
    definition: 'Clasifica por gasto de train acumulado, de mayor a menor: A reúne el primer 60 % del gasto, B hasta el 84 % y C el resto. Responde "¿qué me da ingreso?".',
  },
  {
    id: 'xyz',
    term: 'Clase XYZ',
    group: 'Segmentación',
    definition: 'Clasifica por la variabilidad de la demanda (CV de train) con cortes de Jenks: X estable, Y intermedia, Z errática. Responde "¿qué me da estabilidad?". 162 artículos no tienen CV y quedan sin clase XYZ.',
  },
  {
    id: 'celda',
    term: 'Celda o segmento',
    group: 'Segmentación',
    definition: 'Clase ABC + clase XYZ (AX … CZ). La matriz cuenta los 2.887 artículos con clase XYZ.',
  },
  {
    id: 'spend',
    term: 'Gasto (train)',
    group: 'Segmentación',
    definition: 'Unidades × precio de venta sumadas en las 10 tiendas durante train. En el radar y la tarjeta, mediana de los artículos de la celda.',
    unit: 'US$ por artículo, a precio de venta',
  },
  {
    id: 'usage_units',
    term: 'Unidades',
    group: 'Segmentación',
    definition: 'Unidades vendidas en train dentro del ciclo de vida del artículo (de su primera a su última venta). En el radar y la tarjeta, mediana de la celda.',
    unit: 'unidades por artículo',
  },
  {
    id: 'cv',
    term: 'CV (segmentación)',
    group: 'Segmentación',
    definition: 'Coeficiente de variación de train: σ ÷ media × 100 de la demanda diaria promedio por bloque, sin los días de quiebre de stock. Exige al menos 13 bloques válidos. Más alto = demanda más errática. Es el que define la clase XYZ.',
    unit: '%',
  },
  {
    id: 'zero_share',
    term: '% días en cero',
    group: 'Segmentación',
    definition: 'Fracción de los días activos (días con dato en el ciclo de vida, sin quiebres de stock) en que la venta fue 0. Es 1 − frecuencia de venta.',
    unit: '% de los días activos',
  },
  {
    id: 'velocity',
    term: 'Velocidad',
    group: 'Segmentación',
    definition: 'Unidades vendidas en train ÷ días activos (sin quiebres de stock). Cuánto se vende en un día típico con el artículo disponible.',
    unit: 'unidades por día',
  },
  {
    id: 'mediana-normalizada',
    term: 'Mediana normalizada',
    group: 'Segmentación',
    definition: 'Mediana de la celda ÷ mediana global de los 3.049 artículos (en CV, de los que tienen CV). 1,0 = igual al catálogo; 2,0 = el doble.',
    unit: 'veces la mediana global',
  },
  {
    id: 'quiebre',
    term: 'Quiebre de stock',
    group: 'Segmentación',
    definition: 'Racha larga de días sin venta que se trata como falta de inventario, no como falta de demanda. Esos días no cuentan en el CV, el % de días en cero ni la velocidad.',
  },

  // Serie del artículo
  {
    id: 'lanzamiento',
    term: 'Lanzamiento',
    group: 'Serie del artículo',
    definition: 'Primer bloque con venta observada mayor que 0. La historia, las bandas y el CV descriptivo se calculan desde ahí hasta el bloque 65.',
    unit: 'bloque',
  },
  {
    id: 'venta-observada',
    term: 'Venta observada',
    group: 'Serie del artículo',
    definition: 'Unidades registradas por bloque (suma de 10 tiendas), tal como ocurrieron, con los quiebres de stock incluidos. También se muestra en dinero.',
    unit: 'unidades o US$',
  },
  {
    id: 'venta-completada',
    term: 'Venta completada (quiebres tratados)',
    group: 'Serie del artículo',
    definition: 'La venta con los quiebres de stock tratados: estima lo que se habría vendido con inventario. Contra ella se evalúa el pronóstico. Solo existe en unidades.',
    unit: 'unidades',
  },
  {
    id: 'media-sigma',
    term: 'Media y σ',
    group: 'Serie del artículo',
    definition: 'Promedio y desviación estándar poblacional de las unidades por bloque desde el lanzamiento.',
    unit: 'unidades por bloque',
  },
  {
    id: 'bandas',
    term: 'Bandas ±3σ',
    group: 'Serie del artículo',
    definition: 'Media + 3σ y media − 3σ. Un bloque fuera de las bandas es inusual para el artículo. Si −3σ es negativa se dibuja en 0.',
    unit: 'unidades por bloque',
  },
  {
    id: 'cv-descriptivo',
    term: 'CV descriptivo',
    group: 'Serie del artículo',
    definition: 'σ ÷ media × 100 de las unidades por bloque desde el lanzamiento. Describe la historia completa del artículo; no es el CV de train que define la clase XYZ.',
    unit: '%',
  },
  {
    id: 'histograma',
    term: 'Distribución de unidades',
    group: 'Serie del artículo',
    definition: 'Cuántos bloques cayeron en cada rango de unidades: 8 intervalos de igual ancho entre el mínimo y el máximo del artículo.',
    unit: 'bloques',
  },

  // Pronóstico y error
  {
    id: 'modelo',
    term: 'Modelo',
    group: 'Pronóstico y error',
    definition: 'CatBoost global: un solo modelo entrenado con todos los artículos, que pronostica las unidades de cada bloque.',
  },
  {
    id: 'linea-base',
    term: 'Línea base (seasonal naive)',
    group: 'Pronóstico y error',
    definition: 'No hacer nada: repetir la venta del mismo bloque del año anterior. Es la referencia contra la que se mide el modelo.',
  },
  {
    id: 'escenario-a',
    term: 'Escenario A · a un paso',
    group: 'Pronóstico y error',
    definition: 'Cada bloque de test se pronostica conociendo la venta real hasta el bloque anterior.',
  },
  {
    id: 'escenario-b',
    term: 'Escenario B · encadenado',
    group: 'Pronóstico y error',
    definition: 'Los 13 bloques de test se pronostican en cadena desde el inicio del test: cada paso usa los pronósticos anteriores en lugar de la venta real. Es más exigente que A. A y B nunca se mezclan en una cifra.',
  },
  {
    id: 'rmsse',
    term: 'RMSSE',
    group: 'Pronóstico y error',
    definition: 'Error cuadrático medio del pronóstico, escalado por el error típico de la serie en train (criterio de la competencia M5). Permite comparar artículos de distinto volumen. Menor es mejor.',
    unit: 'sin unidad',
  },
  {
    id: 'wrmsse',
    term: 'WRMSSE',
    group: 'Pronóstico y error',
    definition: 'RMSSE ponderado del conjunto de artículos (criterio M5). En test: 0,495 (A), 0,748 (B) y 0,868 (línea base). Menor es mejor.',
    unit: 'sin unidad',
  },
  {
    id: 'wape',
    term: 'WAPE',
    group: 'Pronóstico y error',
    definition: 'Suma de los errores absolutos ÷ suma de la venta completada × 100. Cuánto se equivoca el pronóstico como porcentaje de lo vendido.',
    unit: '%',
  },
  {
    id: 'mae',
    term: 'MAE',
    group: 'Pronóstico y error',
    definition: 'Promedio de |pronóstico − venta completada| en los bloques de test.',
    unit: 'unidades por bloque',
  },
  {
    id: 'revision',
    term: 'Marcado para revisión',
    group: 'Pronóstico y error',
    definition: 'El proyecto de datos marcó el artículo por un error atípico en test.',
  },

  // Impacto en dinero
  {
    id: 'demanda-test',
    term: 'Demanda del año de test',
    group: 'Impacto en dinero',
    definition: 'Demanda de los 517 en los 13 bloques de test, a precio de venta, según el cálculo de impacto del proyecto de datos: 21,86 M US$. Es la base de los porcentajes de Impacto.',
    unit: 'US$',
  },
  {
    id: 'nivel-servicio',
    term: 'Nivel de servicio',
    group: 'Impacto en dinero',
    definition: 'Demanda atendida ÷ demanda total, en dinero. 95 % = se atiende el 95 % de lo que se habría vendido.',
    unit: '%',
  },
  {
    id: 'z',
    term: 'z (colchón)',
    group: 'Impacto en dinero',
    definition: 'Tamaño del colchón de seguridad: el pedido es el pronóstico más z veces el error típico. Más z = menos venta perdida y más exceso. Se elige entre 17 valores ya calculados (−1 a 3).',
    unit: 'desviaciones',
  },
  {
    id: 'venta-perdida',
    term: 'Venta perdida',
    group: 'Impacto en dinero',
    definition: 'Demanda que no se atendió porque se pidió menos de lo que se demandó.',
    unit: 'US$, a precio de venta',
  },
  {
    id: 'exceso',
    term: 'Exceso en anaquel',
    group: 'Impacto en dinero',
    definition: 'Lo que se pidió de más sobre lo que se demandó: inventario que se queda en el anaquel.',
    unit: 'US$, a precio de venta',
  },
  {
    id: 'exceso-evitado',
    term: 'Exceso evitado (95 %)',
    group: 'Impacto en dinero',
    definition: 'Exceso de la línea base − exceso del modelo cuando los dos atienden el 95 % de la demanda (lectura de las curvas). En A: 3,28 M US$.',
    unit: 'US$, a precio de venta',
  },
  {
    id: 'venta-recuperada',
    term: 'Venta recuperada con el mismo exceso',
    group: 'Impacto en dinero',
    definition: 'Si el modelo tuviera el mismo exceso que la línea base, cuánta venta perdida menos tendría. En A: 0,91 M US$.',
    unit: 'US$, a precio de venta',
  },
  {
    id: 'ahorro-articulo',
    term: 'Ahorro por artículo (z fijo)',
    group: 'Impacto en dinero',
    definition: '(venta perdida + exceso de la línea base) − (venta perdida + exceso del modelo), con el z que da el 95 % de servicio al total. Positivo = el modelo cuesta menos. Por artículo puede salir negativo aunque el modelo gane en el total (en A, 27 de 517).',
    unit: 'US$, a precio de venta',
  },
  {
    id: 'playground',
    term: 'Playground',
    group: 'Impacto en dinero',
    definition: 'Reproduce el año de test de un artículo bloque a bloque: la historia completa queda a la vista y el test se revela a medida que se avanza.',
  },
];

export const GLOSSARY_BY_ID: Record<string, GlossaryEntry> = Object.fromEntries(GLOSSARY.map((g) => [g.id, g]));
