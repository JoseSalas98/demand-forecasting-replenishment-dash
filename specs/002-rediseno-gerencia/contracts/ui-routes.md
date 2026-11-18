# Contrato de rutas (hash)

| Ruta | Vista | Cambio en 002 |
|---|---|---|
| `#/` | Inicio (bienvenida) | Reescrita |
| `#/segmentacion` | Segmentos (burbujas, panel del grupo, embudo) | Reescrita |
| `#/segmentacion/:cell` (AX, AY, AZ) | Detalle de los grupos con pronóstico (pestañas, comparación, artículos, CV) | Reescrita; `total` y otras celdas muestran aviso con enlace |
| `#/articulo` y `#/articulo/:id` | Artículo | Reescrita; sin id abre un artículo por defecto |
| `#/articulo/:id/detalle` | Detalle del pronóstico | **Nueva** |
| `#/articulo/:id/playground` | Playground | Ajustes de vocabulario |
| `#/impacto` | Impacto | Reescrita |
| `#/guia`, `#/guia/glosario`, `#/guia/glosario/:term` | Cómo usar | Reescrita; `:term` filtra el glosario |
| `#/datos` | Origen de los datos | Sin cambios |
| `#/segmentos…` | Redirección heredada a `#/segmentacion…` | Sin cambios |

Parámetros: `esc` se ignora (siempre A); `pron=0` amplía el buscador a los 3.049.
