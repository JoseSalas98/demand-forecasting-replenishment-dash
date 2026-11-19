// Glosario: fuente única de definiciones para "Cómo usar" y las ayudas "?" de la interfaz, en
// español e inglés. Lenguaje de gerencia con el nombre técnico al lado (specs 002 y 003). No se
// agregan cifras que no estén en las salidas exportadas.
import { getLang, pick, type Lang } from './i18n';

export type GlossaryGroupId = 'basics' | 'segments' | 'accuracy' | 'money';

interface GlossaryText {
  term: string;
  definition: string;
  /** Nombre técnico en el proyecto de datos. */
  technical: string;
  unit?: string;
}

interface GlossarySource {
  id: string;
  group: GlossaryGroupId;
  es: GlossaryText;
  en: GlossaryText;
}

export interface GlossaryEntry extends GlossaryText {
  id: string;
  group: GlossaryGroupId;
}

const GROUP_NAME: Record<Lang, Record<GlossaryGroupId, string>> = {
  es: { basics: 'Lo básico', segments: 'Segmentos', accuracy: 'Qué tan bien pronostica', money: 'Impacto en dinero' },
  en: { basics: 'The basics', segments: 'Segments', accuracy: 'How well it forecasts', money: 'Money impact' },
};

export const GLOSSARY_GROUPS: GlossaryGroupId[] = ['basics', 'segments', 'accuracy', 'money'];
export const groupName = (g: GlossaryGroupId): string => pick(GROUP_NAME)[g];

const SOURCE: GlossarySource[] = [
  // Lo básico
  { id: 'bloque', group: 'basics',
    es: { term: 'Periodo de 4 semanas', technical: 'bloque', unit: '28 días',
      definition: 'La unidad de tiempo del tablero: 28 días seguidos. Toda venta, pronóstico y error se lee por periodo.' },
    en: { term: '4-week period', technical: 'block', unit: '28 days',
      definition: 'The dashboard\'s unit of time: 28 days in a row. Every sale, forecast and error is read by period.' } },
  { id: 'train-test', group: 'basics',
    es: { term: 'Año de prueba', technical: 'test',
      definition: 'Los últimos 13 periodos de cada artículo (mayo 2015 a mayo 2016 en casi todos). El pronóstico no los vio, así que ahí se mide qué tan bien funciona.' },
    en: { term: 'Test year', technical: 'test',
      definition: 'The last 13 periods of each product (May 2015 to May 2016 for almost all of them). The forecast never saw them, so that is where we measure how well it works.' } },
  { id: 'modelo', group: 'basics',
    es: { term: 'Pronóstico', technical: 'CatBoost global',
      definition: 'Lo que el modelo espera vender en cada periodo. Un solo modelo aprende de la historia de todos los artículos.' },
    en: { term: 'Forecast', technical: 'global CatBoost',
      definition: 'What the model expects to sell in each period. A single model learns from the history of every product.' } },
  { id: 'linea-base', group: 'basics',
    es: { term: 'Línea base', technical: 'seasonal naive',
      definition: 'La referencia: pedir lo mismo que se vendió en el mismo periodo del año anterior. Es lo que pasaría sin pronóstico.' },
    en: { term: 'Baseline', technical: 'seasonal naive',
      definition: 'The reference point: order the same amount that sold in the same period last year. It is what would happen without a forecast.' } },
  { id: 'venta-observada', group: 'basics',
    es: { term: 'Lo que se vendió', technical: 'venta observada',
      definition: 'Las unidades registradas en cada periodo, tal como ocurrieron, con los faltantes incluidos.' },
    en: { term: 'Actual sales', technical: 'observed sales',
      definition: 'The units recorded in each period, just as they happened, stockouts included.' } },
  { id: 'venta-completada', group: 'basics',
    es: { term: 'Venta sin faltantes', technical: 'venta completada',
      definition: 'Lo que se habría vendido si siempre hubiera habido producto. Contra esta venta se mide el pronóstico.' },
    en: { term: 'Sales without stockouts', technical: 'completed sales',
      definition: 'What would have sold if the product had always been on the shelf. The forecast is measured against these sales.' } },
  { id: 'quiebre', group: 'basics',
    es: { term: 'Faltante', technical: 'quiebre de stock',
      definition: 'Una racha de días sin venta porque no había producto, no porque nadie lo quisiera.' },
    en: { term: 'Stockout', technical: 'stockout',
      definition: 'A run of days with no sales because there was no product, not because nobody wanted it.' } },
  { id: 'precio-venta', group: 'basics',
    es: { term: 'A precio de venta', technical: 'valor a precio de venta', unit: 'US$',
      definition: 'Todo valor en dinero es unidades × precio de venta. No descuenta costos, así que no es ganancia.' },
    en: { term: 'At retail price', technical: 'value at retail price', unit: 'US$',
      definition: 'Every money figure is units × retail price. It does not subtract costs, so it is not profit.' } },

  // Segmentos
  { id: 'vitales', group: 'segments',
    es: { term: 'Vitales', technical: 'clase A',
      definition: 'Los pocos artículos que más pesan: juntos suman el primer 60 % de la venta. Si faltan en el anaquel, se nota en la caja. Son los que se pronostican.' },
    en: { term: 'Vital', technical: 'class A',
      definition: 'The few products that matter most: together they make up the first 60% of sales. When they run out on the shelf, it shows at the register. These are the ones we forecast.' } },
  { id: 'utiles', group: 'segments',
    es: { term: 'Útiles', technical: 'clase B',
      definition: 'Artículos de aporte medio: llevan la venta acumulada del 60 % al 84 %.' },
    en: { term: 'Useful', technical: 'class B',
      definition: 'Mid-weight products: they take cumulative sales from 60% to 84%.' } },
  { id: 'complementarios', group: 'segments',
    es: { term: 'Complementarios', technical: 'clase C',
      definition: 'Los muchos artículos que completan el surtido: cada uno vende poco y juntos suman el 16 % restante.' },
    en: { term: 'Complementary', technical: 'class C',
      definition: 'The many products that round out the range: each sells little, and together they make up the remaining 16%.' } },
  { id: 'continuos', group: 'segments',
    es: { term: 'Continuos', technical: 'clase X · CV bajo',
      definition: 'Su venta es pareja de un periodo a otro. Son los más fáciles de prever.' },
    en: { term: 'Continuous', technical: 'class X · low CV',
      definition: 'Their sales stay steady from one period to the next. They are the easiest to predict.' } },
  { id: 'recurrentes', group: 'segments',
    es: { term: 'Recurrentes', technical: 'clase Y · CV intermedio',
      definition: 'Su venta vuelve, pero con altibajos.' },
    en: { term: 'Recurring', technical: 'class Y · medium CV',
      definition: 'Their sales keep coming back, but with ups and downs.' } },
  { id: 'ocasionales', group: 'segments',
    es: { term: 'Ocasionales', technical: 'clase Z · CV alto',
      definition: 'Su venta da saltos fuertes de un periodo a otro. Son los más difíciles de prever. Se mide por variabilidad, no por frecuencia.' },
    en: { term: 'Occasional', technical: 'class Z · high CV',
      definition: 'Their sales jump sharply from one period to the next. They are the hardest to predict. This is measured by variability, not by how often they sell.' } },
  { id: 'mediana-normalizada', group: 'segments',
    es: { term: 'Artículo típico del catálogo', technical: 'mediana global', unit: 'veces el artículo típico',
      definition: 'El punto de comparación del radar y las barras (1×). Un grupo con 3× vende el triple que el artículo típico.' },
    en: { term: 'Typical catalog product', technical: 'global median', unit: 'times the typical product',
      definition: 'The comparison point for the radar and the bars (1×). A group at 3× sells three times as much as the typical product.' } },
  { id: 'spend', group: 'segments',
    es: { term: 'Venta en dinero', technical: 'gasto de train', unit: 'US$ por artículo, a precio de venta',
      definition: 'Unidades × precio de venta, sumadas en las 10 tiendas de 2011 a 2015.' },
    en: { term: 'Sales in dollars', technical: 'training spend', unit: 'US$ per product, at retail price',
      definition: 'Units × retail price, added up across the 10 stores from 2011 to 2015.' } },
  { id: 'usage_units', group: 'segments',
    es: { term: 'Unidades vendidas', technical: 'unidades de train', unit: 'unidades por artículo',
      definition: 'Unidades vendidas de 2011 a 2015, dentro de la vida del artículo (de su primera a su última venta).' },
    en: { term: 'Units sold', technical: 'training units', unit: 'units per product',
      definition: 'Units sold from 2011 to 2015, within the product\'s life (from its first sale to its last).' } },
  { id: 'cv', group: 'segments',
    es: { term: 'Variabilidad de la venta', technical: 'coeficiente de variación (CV)', unit: '%',
      definition: 'Qué tanto sube y baja la venta respecto a su promedio, sin contar los días de faltante. Más alta = venta más irregular.' },
    en: { term: 'Sales variability', technical: 'coefficient of variation (CV)', unit: '%',
      definition: 'How much sales go up and down around their average, leaving out stockout days. Higher = more irregular sales.' } },
  { id: 'zero_share', group: 'segments',
    es: { term: 'Días sin venta', technical: '% días en cero', unit: '% de los días con producto disponible',
      definition: 'Porcentaje de los días con producto disponible en que no se vendió nada.' },
    en: { term: 'Days without sales', technical: '% of zero days', unit: '% of days with product available',
      definition: 'Share of the days with product available on which nothing sold.' } },
  { id: 'velocity', group: 'segments',
    es: { term: 'Unidades por día', technical: 'velocidad', unit: 'unidades por día',
      definition: 'Lo que vende el artículo en un día típico con producto disponible.' },
    en: { term: 'Units per day', technical: 'velocity', unit: 'units per day',
      definition: 'What the product sells on a typical day with product available.' } },

  // Qué tan bien pronostica
  { id: 'wape', group: 'accuracy',
    es: { term: 'Error del pronóstico', technical: 'WAPE', unit: '%',
      definition: 'De cada 100 unidades vendidas, en cuántas se equivoca el pronóstico. Si es 5 %, acierta 95 de cada 100.' },
    en: { term: 'Forecast error', technical: 'WAPE', unit: '%',
      definition: 'Out of every 100 units sold, how many the forecast gets wrong. At 5%, it gets 95 out of 100 right.' } },
  { id: 'mae', group: 'accuracy',
    es: { term: 'Error medio por periodo', technical: 'MAE', unit: 'unidades por periodo',
      definition: 'Cuántas unidades se equivoca, en promedio, en cada periodo de 4 semanas.' },
    en: { term: 'Average error per period', technical: 'MAE', unit: 'units per period',
      definition: 'How many units it misses by, on average, in each 4-week period.' } },
  { id: 'rmsse', group: 'accuracy',
    es: { term: 'Error comparable entre artículos', technical: 'RMSSE · WRMSSE (criterio M5)',
      definition: 'Un error escalado que permite comparar artículos grandes y pequeños. Menor es mejor.' },
    en: { term: 'Comparable error across products', technical: 'RMSSE · WRMSSE (M5 criterion)',
      definition: 'A scaled error that lets you compare large and small products. Lower is better.' } },
  { id: 'cv-descriptivo', group: 'accuracy',
    es: { term: 'Variabilidad histórica', technical: 'CV descriptivo', unit: '%',
      definition: 'Qué tanto sube y baja la venta de un artículo en toda su historia. Es descriptiva: la que define el grupo es la variabilidad de la venta.' },
    en: { term: 'Historical variability', technical: 'descriptive CV', unit: '%',
      definition: 'How much a product\'s sales go up and down over its whole history. It is descriptive: the one that sets the group is sales variability.' } },
  { id: 'revision', group: 'accuracy',
    es: { term: 'Marcado para revisión', technical: 'review',
      definition: 'El proyecto señaló el artículo porque su error en el año de prueba fue fuera de lo normal.' },
    en: { term: 'Flagged for review', technical: 'review',
      definition: 'The project flagged the product because its error in the test year was out of the ordinary.' } },

  // Impacto en dinero
  { id: 'servicio', group: 'money',
    es: { term: '% de la demanda atendida', technical: 'tasa de cumplimiento (fill rate)', unit: '%',
      definition: 'De cada 100 dólares que los clientes quisieron comprar, cuántos se vendieron. Atender más exige pedir con más respaldo.' },
    en: { term: '% of demand served', technical: 'fill rate', unit: '%',
      definition: 'Out of every 100 dollars customers wanted to buy, how many were sold. Serving more takes ordering with more backup.' } },
  { id: 'exceso', group: 'money',
    es: { term: 'Mercancía sobrante', technical: 'exceso en anaquel', unit: 'US$, a precio de venta',
      definition: 'Lo que se pidió de más y quedó en el anaquel: dinero inmovilizado.' },
    en: { term: 'Excess stock', technical: 'excess on the shelf', unit: 'US$, at retail price',
      definition: 'What was over-ordered and stayed on the shelf: money tied up.' } },
  { id: 'venta-perdida', group: 'money',
    es: { term: 'Ventas perdidas', technical: 'venta perdida', unit: 'US$, a precio de venta',
      definition: 'Lo que los clientes quisieron comprar y no encontraron porque se pidió de menos.' },
    en: { term: 'Sales lost to stockouts', technical: 'lost sales', unit: 'US$, at retail price',
      definition: 'What customers wanted to buy and could not find because too little was ordered.' } },
  { id: 'z', group: 'money',
    es: { term: 'Colchón', technical: 'z × error típico',
      definition: 'Unidades extra que se piden por encima del pronóstico para cubrir el error. Más colchón = menos ventas perdidas, pero más sobrante.' },
    en: { term: 'Safety buffer', technical: 'z × typical error',
      definition: 'Extra units ordered on top of the forecast to cover its error. A bigger buffer means fewer lost sales but more excess stock.' } },
  { id: 'liberar-capital', group: 'money',
    es: { term: 'Liberar capital', technical: 'exceso evitado al mismo servicio', unit: 'US$, a precio de venta',
      definition: 'Atender el mismo % de la demanda con menos mercancía sobrante. Es dinero que queda libre para otra cosa.' },
    en: { term: 'Free up capital', technical: 'excess avoided at the same service level', unit: 'US$, at retail price',
      definition: 'Serve the same % of demand with less excess stock. It is money freed up for something else.' } },
  { id: 'venta-recuperada', group: 'money',
    es: { term: 'Recuperar ventas', technical: 'venta recuperada con el mismo exceso', unit: 'US$, a precio de venta',
      definition: 'Quedarse con el mismo sobrante de la línea base, pero atender más demanda.' },
    en: { term: 'Recover sales', technical: 'sales recovered with the same excess', unit: 'US$, at retail price',
      definition: 'Keep the same excess stock as the baseline, but serve more demand.' } },
  { id: 'ahorro-articulo', group: 'money',
    es: { term: 'Ahorro neto de un artículo', technical: 'ahorro con z fijo', unit: 'US$, a precio de venta',
      definition: 'Lo que cuesta equivocarse con la línea base (sobrante + ventas perdidas) menos lo que cuesta con el pronóstico. Puede ser negativo en algunos artículos aunque el pronóstico gane en el total.' },
    en: { term: 'Net savings for a product', technical: 'savings with fixed z', unit: 'US$, at retail price',
      definition: 'What getting it wrong costs with the baseline (excess + lost sales) minus what it costs with the forecast. It can be negative for some products even when the forecast wins overall.' } },
  { id: 'curva', group: 'money',
    es: { term: 'Curva sobrante vs. ventas perdidas', technical: 'curva de eficiencia',
      definition: 'Muestra, para cada tamaño de colchón, cuánto sobra y cuánto se deja de vender. La curva del pronóstico queda por debajo: con el mismo sobrante pierde menos ventas.' },
    en: { term: 'Excess vs. lost sales curve', technical: 'efficiency frontier',
      definition: 'Shows, for each buffer size, how much is left over and how much goes unsold. The forecast curve sits below: with the same excess it loses fewer sales.' } },
  { id: 'lectura-derivada', group: 'money',
    es: { term: 'Calculado en el sitio', technical: 'lectura derivada (constitución I.12)',
      definition: 'Cifra leída de los datos exportados sin recalcular el modelo, por ejemplo entre dos puntos de la curva. Al 95 % se muestran las cifras oficiales.' },
    en: { term: 'Calculated on the site', technical: 'derived reading (constitution I.12)',
      definition: 'A figure read from the exported data without re-running the model, for example between two points of the curve. At 95%, the official figures are shown.' } },
];

/** Entradas del glosario en el idioma activo. */
export const glossary = (): GlossaryEntry[] => SOURCE.map((s) => ({ id: s.id, group: s.group, ...s[getLang()] }));

/** Entrada por id en el idioma activo; id desconocido → undefined. */
export function glossaryEntry(id: string): GlossaryEntry | undefined {
  const s = SOURCE.find((x) => x.id === id);
  return s ? { id: s.id, group: s.group, ...s[getLang()] } : undefined;
}
