# Pronóstico de reposición · resultados

Sitio estático para la gerencia regional y de operaciones, con cuatro módulos:

- **Inicio**: portada con los 3.049 artículos analizados, los 517 con pronóstico y el exceso evitado.
- **Segmentación**: matriz ABC × XYZ (2.887 artículos con clase XYZ), radar de perfiles, comparación
  AX · AY · AZ, embudo y dinero en juego; detalle por segmento.
- **Artículo**: historia de cualquiera de los 3.049 (unidades con media y bandas ±3σ, dinero, CV
  descriptivo, histograma) y, para los 517, el pronóstico del año de test frente a la línea base
  (seasonal naive), el error, el impacto y el playground.
- **Impacto**: curvas de exceso frente a venta perdida según el nivel de servicio, por segmento y
  en total, en los escenarios A y B por separado.

Todo valor monetario está **a precio de venta, no es margen**. La capa visual sigue
`diseno/guia_visual.md` y las pantallas `diseno/pantalla_*.png`.

Las reglas del proyecto están en `.specify/memory/constitution.md`; la especificación y el plan, en
`specs/001-forecast-results-dashboard/`.

## Cómo funciona

- `export/export_data.py` lee las salidas del proyecto de ciencia de datos (con `load_frozen`,
  `load_tables` y `load_interim`), verifica invariantes, suma la venta diaria por bloque de 28 días
  y escribe JSON en `public/data/`. **No recalcula** segmentación, pronóstico ni impacto. Si algo
  falla, no escribe nada.
- `public/data/` se versiona en Git: es la versión fijada de las cifras.
- La interfaz (React + TypeScript + Vite) solo lee esos JSON.

## Requisitos

- El proyecto de datos con su `.venv` (Python 3.12) y sus salidas de nb 03, 03b, 05 y 06. La
  matriz y el radar necesitan los artefactos congelados `segmentation_items` y `radar_profiles`
  (nb 03, Etapa 10b); si faltan, la exportación los marca en `meta.pending` y la vista muestra
  "No disponible". Las
  dependencias de Python del exportador están en el grupo `front` de su `pyproject.toml`
  (`numpy`, `pandas`, `pyarrow`, `pytest`). Para instalarlas sin quitar los otros grupos:

  ```bash
  cd "$DATA_PROJECT_ROOT" && uv sync --group front --inexact
  ```
- Node 18.19 o más y npm.
- Un `.env` en la raíz (copie `.env.example`):

  ```text
  DATA_PROJECT_ROOT=/ruta/absoluta/al/proyecto/de/datos
  EXPORT_DIR=public/data
  ```

## Exportar

```bash
"$DATA_PROJECT_ROOT/.venv/bin/python" export/export_data.py
```

## Probar

```bash
"$DATA_PROJECT_ROOT/.venv/bin/python" -m pytest export/tests   # invariantes de las cifras
npm install
npm test                                                         # formato y vistas con datos reales
```

## Ver

```bash
npm run dev                         # http://localhost:5173
npm run build && npm run preview    # igual a lo que se publica (agregue -- --host en WSL)
```

## Publicar

1. Cree un repositorio **público** en GitHub y súbalo (`git push -u origin main`).
2. En *Settings → Pages*, elija la fuente **GitHub Actions**.
3. Cada push a `main` construye y publica (`.github/workflows/deploy.yml`). El CI no exporta: usa
   los JSON versionados. Para actualizar cifras, exporte localmente y haga commit de `public/data/`.
