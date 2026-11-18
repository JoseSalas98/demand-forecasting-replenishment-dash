// Glosario: fuente única de definiciones para "Cómo usar" y las ayudas "?" de la interfaz.
// Lenguaje de gerencia con el nombre técnico al lado (specs/002-rediseno-gerencia). No se agregan
// cifras que no estén en las salidas exportadas.

export type GlossaryGroup = 'Lo básico' | 'Segmentos' | 'Qué tan bien pronostica' | 'Impacto en dinero';

export interface GlossaryEntry {
  id: string;
  term: string;
  group: GlossaryGroup;
  definition: string;
  /** Nombre técnico en el proyecto de datos. */
  technical: string;
  unit?: string;
}

export const GLOSSARY_GROUPS: GlossaryGroup[] = ['Lo básico', 'Segmentos', 'Qué tan bien pronostica', 'Impacto en dinero'];

export const GLOSSARY: GlossaryEntry[] = [
  // Lo básico
  { id: 'bloque', term: 'Periodo de 4 semanas', group: 'Lo básico', technical: 'bloque', unit: '28 días',
    definition: 'La unidad de tiempo del tablero: 28 días seguidos. Toda venta, pronóstico y error se lee por periodo.' },
  { id: 'train-test', term: 'Año de prueba', group: 'Lo básico', technical: 'test',
    definition: 'Los últimos 13 periodos de cada artículo (mayo 2015 a mayo 2016 en casi todos). El pronóstico no los vio, así que ahí se mide qué tan bien funciona.' },
  { id: 'modelo', term: 'Pronóstico', group: 'Lo básico', technical: 'CatBoost global',
    definition: 'Lo que el modelo espera vender en cada periodo. Un solo modelo aprende de la historia de todos los artículos.' },
  { id: 'linea-base', term: 'Línea base', group: 'Lo básico', technical: 'seasonal naive',
    definition: 'La referencia: pedir lo mismo que se vendió en el mismo periodo del año anterior. Es lo que pasaría sin pronóstico.' },
  { id: 'venta-observada', term: 'Lo que se vendió', group: 'Lo básico', technical: 'venta observada',
    definition: 'Las unidades registradas en cada periodo, tal como ocurrieron, con los faltantes incluidos.' },
  { id: 'venta-completada', term: 'Venta sin faltantes', group: 'Lo básico', technical: 'venta completada',
    definition: 'Lo que se habría vendido si siempre hubiera habido producto. Contra esta venta se mide el pronóstico.' },
  { id: 'quiebre', term: 'Faltante', group: 'Lo básico', technical: 'quiebre de stock',
    definition: 'Una racha de días sin venta porque no había producto, no porque nadie lo quisiera.' },
  { id: 'precio-venta', term: 'A precio de venta', group: 'Lo básico', technical: 'valor a precio de venta', unit: 'US$',
    definition: 'Todo valor en dinero es unidades × precio de venta. No descuenta costos, así que no es ganancia.' },

  // Segmentos
  { id: 'vitales', term: 'Vitales', group: 'Segmentos', technical: 'clase A',
    definition: 'Los pocos artículos que más pesan: juntos suman el primer 60 % de la venta. Si faltan en el anaquel, se nota en la caja. Son los que se pronostican.' },
  { id: 'utiles', term: 'Útiles', group: 'Segmentos', technical: 'clase B',
    definition: 'Artículos de aporte medio: llevan la venta acumulada del 60 % al 84 %.' },
  { id: 'complementarios', term: 'Complementarios', group: 'Segmentos', technical: 'clase C',
    definition: 'Los muchos artículos que completan el surtido: cada uno vende poco y juntos suman el 16 % restante.' },
  { id: 'continuos', term: 'Continuos', group: 'Segmentos', technical: 'clase X · CV bajo',
    definition: 'Su venta es pareja de un periodo a otro. Son los más fáciles de prever.' },
  { id: 'recurrentes', term: 'Recurrentes', group: 'Segmentos', technical: 'clase Y · CV intermedio',
    definition: 'Su venta vuelve, pero con altibajos.' },
  { id: 'ocasionales', term: 'Ocasionales', group: 'Segmentos', technical: 'clase Z · CV alto',
    definition: 'Su venta da saltos fuertes de un periodo a otro. Son los más difíciles de prever. Se mide por variabilidad, no por frecuencia.' },
  { id: 'mediana-normalizada', term: 'Artículo típico del catálogo', group: 'Segmentos', technical: 'mediana global', unit: 'veces el artículo típico',
    definition: 'El punto de comparación del radar y las barras (1×). Un grupo con 3× vende el triple que el artículo típico.' },
  { id: 'spend', term: 'Venta en dinero', group: 'Segmentos', technical: 'gasto de train', unit: 'US$ por artículo, a precio de venta',
    definition: 'Unidades × precio de venta, sumadas en las 10 tiendas de 2011 a 2015.' },
  { id: 'usage_units', term: 'Unidades vendidas', group: 'Segmentos', technical: 'unidades de train', unit: 'unidades por artículo',
    definition: 'Unidades vendidas de 2011 a 2015, dentro de la vida del artículo (de su primera a su última venta).' },
  { id: 'cv', term: 'Variabilidad de la venta', group: 'Segmentos', technical: 'coeficiente de variación (CV)', unit: '%',
    definition: 'Qué tanto sube y baja la venta respecto a su promedio, sin contar los días de faltante. Más alta = venta más irregular.' },
  { id: 'zero_share', term: 'Días sin venta', group: 'Segmentos', technical: '% días en cero', unit: '% de los días con producto disponible',
    definition: 'Porcentaje de los días con producto disponible en que no se vendió nada.' },
  { id: 'velocity', term: 'Unidades por día', group: 'Segmentos', technical: 'velocidad', unit: 'unidades por día',
    definition: 'Lo que vende el artículo en un día típico con producto disponible.' },

  // Qué tan bien pronostica
  { id: 'wape', term: 'Error del pronóstico', group: 'Qué tan bien pronostica', technical: 'WAPE', unit: '%',
    definition: 'De cada 100 unidades vendidas, en cuántas se equivoca el pronóstico. Si es 5 %, acierta 95 de cada 100.' },
  { id: 'mae', term: 'Error medio por periodo', group: 'Qué tan bien pronostica', technical: 'MAE', unit: 'unidades por periodo',
    definition: 'Cuántas unidades se equivoca, en promedio, en cada periodo de 4 semanas.' },
  { id: 'rmsse', term: 'Error comparable entre artículos', group: 'Qué tan bien pronostica', technical: 'RMSSE · WRMSSE (criterio M5)',
    definition: 'Un error escalado que permite comparar artículos grandes y pequeños. Menor es mejor.' },
  { id: 'cv-descriptivo', term: 'Variabilidad histórica', group: 'Qué tan bien pronostica', technical: 'CV descriptivo', unit: '%',
    definition: 'Qué tanto sube y baja la venta de un artículo en toda su historia. Es descriptiva: la que define el grupo es la variabilidad de la venta.' },
  { id: 'revision', term: 'Marcado para revisión', group: 'Qué tan bien pronostica', technical: 'review',
    definition: 'El proyecto señaló el artículo porque su error en el año de prueba fue fuera de lo normal.' },

  // Impacto en dinero
  { id: 'servicio', term: '% de la demanda atendida', group: 'Impacto en dinero', technical: 'tasa de cumplimiento (fill rate)', unit: '%',
    definition: 'De cada 100 dólares que los clientes quisieron comprar, cuántos se vendieron. Atender más exige pedir con más respaldo.' },
  { id: 'exceso', term: 'Mercancía sobrante', group: 'Impacto en dinero', technical: 'exceso en anaquel', unit: 'US$, a precio de venta',
    definition: 'Lo que se pidió de más y quedó en el anaquel: dinero inmovilizado.' },
  { id: 'venta-perdida', term: 'Ventas perdidas', group: 'Impacto en dinero', technical: 'venta perdida', unit: 'US$, a precio de venta',
    definition: 'Lo que los clientes quisieron comprar y no encontraron porque se pidió de menos.' },
  { id: 'z', term: 'Colchón', group: 'Impacto en dinero', technical: 'z × error típico',
    definition: 'Unidades extra que se piden por encima del pronóstico para cubrir el error. Más colchón = menos ventas perdidas, pero más sobrante.' },
  { id: 'liberar-capital', term: 'Liberar capital', group: 'Impacto en dinero', technical: 'exceso evitado al mismo servicio', unit: 'US$, a precio de venta',
    definition: 'Atender el mismo % de la demanda con menos mercancía sobrante. Es dinero que queda libre para otra cosa.' },
  { id: 'venta-recuperada', term: 'Recuperar ventas', group: 'Impacto en dinero', technical: 'venta recuperada con el mismo exceso', unit: 'US$, a precio de venta',
    definition: 'Quedarse con el mismo sobrante de la línea base, pero atender más demanda.' },
  { id: 'ahorro-articulo', term: 'Ahorro neto de un artículo', group: 'Impacto en dinero', technical: 'ahorro con z fijo', unit: 'US$, a precio de venta',
    definition: 'Lo que cuesta equivocarse con la línea base (sobrante + ventas perdidas) menos lo que cuesta con el pronóstico. Puede ser negativo en algunos artículos aunque el pronóstico gane en el total.' },
  { id: 'curva', term: 'Curva sobrante vs. ventas perdidas', group: 'Impacto en dinero', technical: 'curva de eficiencia',
    definition: 'Muestra, para cada tamaño de colchón, cuánto sobra y cuánto se deja de vender. La curva del pronóstico queda por debajo: con el mismo sobrante pierde menos ventas.' },
  { id: 'lectura-derivada', term: 'Calculado en el sitio', group: 'Impacto en dinero', technical: 'lectura derivada (constitución I.12)',
    definition: 'Cifra leída de los datos exportados sin recalcular el modelo, por ejemplo entre dos puntos de la curva. Al 95 % se muestran las cifras oficiales.' },
];

export const GLOSSARY_BY_ID: Record<string, GlossaryEntry> = Object.fromEntries(GLOSSARY.map((g) => [g.id, g]));
