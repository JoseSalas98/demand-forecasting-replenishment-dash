"""Exportación de las salidas del proyecto de ciencia de datos a JSON para el sitio estático.

Solo lee (con `load_frozen`, `load_tables` y `load_interim` del proyecto de datos), verifica
invariantes, suma la venta diaria por bloque de 28 días y escribe los archivos del contrato
`specs/001-forecast-results-dashboard/contracts/export-schema.md`. Nunca recalcula segmentación,
pronóstico ni impacto. Si algo falla, no escribe nada (constitución III).

Uso:
    "$DATA_PROJECT_ROOT/.venv/bin/python" export/export_data.py
"""

from __future__ import annotations

from datetime import datetime
import hashlib
import json
import logging
import math
import os
from pathlib import Path
import shutil
import sys
import tempfile
from typing import Any, Callable

import numpy as np
import pandas as pd

EXPORTER_VERSION = "0.2.0"
REPO_ROOT = Path(__file__).resolve().parent.parent
N_ITEMS = 517
N_TEST = 13
FIRST_BLOCK, LAST_BLOCK = 2, 65
IMPACT_TOLERANCE = 0.01  # US$, SC-005

# Mapeos de etiquetas de las salidas del modelo a llaves del contrato.
SCENARIO_KEYS = {"A · a un paso": "A", "B · encadenado": "B"}
FORM_SCENARIO = {"a un paso": "A", "encadenado": "B"}
FORM_KEYS = {"a un paso": "one_step", "encadenado": "chained", "seasonal naive": "seasonal_naive"}
CURVE_KEYS = {"a un paso": "A", "encadenado": "B", "seasonal naive": "naive", "perfecto": "perfect"}
CELLS = ["AX", "AY", "AZ"]
# Iteración 2 (constitución I.10–I.11): fuentes de la matriz y el radar, y universo descriptivo
SEGMENTATION_SOURCES = ("segmentation_items", "radar_profiles")
SEGMENTATION_ITEM_COLS = ["item_id", "abc_class", "xyz_class", "cell", "spend"]
RADAR_COLS = ["cell", "axis", "median_raw", "median_norm", "global_median"]
N_CATALOG = 3049
N_HIST_BINS = 8

log = logging.getLogger("export")


class ExportError(RuntimeError):
    """Error que detiene la exportación completa (nada se escribe)."""


# ---------------------------------------------------------------------------------------------
# Base: rutas, carga verificada, validación y escritura
# ---------------------------------------------------------------------------------------------


def read_env(repo_root: Path) -> dict:
    """Lee las rutas de trabajo desde `.env` en la raíz del repositorio.

    Parámetros:
        repo_root (Path): raíz de este repositorio.

    Retorno:
        dict: `data_root` (Path del proyecto de datos) y `export_dir` (Path de destino).
    """
    env_path = repo_root / ".env"
    if not env_path.exists():
        raise ExportError(f"No existe {env_path}; copie .env.example y complete las rutas.")
    values: dict[str, str] = {}
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    for key in ("DATA_PROJECT_ROOT", "EXPORT_DIR"):
        if not values.get(key):
            raise ExportError(f"Falta la variable {key} en {env_path}.")
    data_root = Path(values["DATA_PROJECT_ROOT"])
    if not data_root.is_dir():
        raise ExportError(f"DATA_PROJECT_ROOT no existe: {data_root}")
    for sub in ("data", "src", "models"):
        if not (data_root / sub).is_dir():
            raise ExportError(f"DATA_PROJECT_ROOT no contiene '{sub}/': {data_root}")
    export_dir = Path(values["EXPORT_DIR"])
    if not export_dir.is_absolute():
        export_dir = repo_root / export_dir
    return {"data_root": data_root, "export_dir": export_dir}


def load_sources(data_root: Path) -> dict:
    """Carga todas las salidas del proyecto de datos con sus funciones verificadas.

    Parámetros:
        data_root (Path): raíz del proyecto de datos.

    Retorno:
        dict: configuración, tablas, manifiestos e intermedios.
    """
    os.chdir(data_root)  # load_frozen y la configuración usan rutas relativas (research R8)
    if str(data_root) not in sys.path:
        sys.path.insert(0, str(data_root))
    out: dict[str, Any] = {"data_root": data_root}
    steps: list[tuple[str, Callable[[], None]]] = []

    def _cfg() -> None:
        from src.config import load_validated_config

        out["cfg"] = load_validated_config()

    def _targets() -> None:
        from src.freeze import load_frozen, load_manifest

        out["targets"] = load_frozen("targets")
        out["processed_manifest"] = load_manifest()

    def _tables(name: str, rel: str) -> Callable[[], None]:
        def _load() -> None:
            from src.data import load_tables

            out[name], out[f"{name}_manifest"] = load_tables(rel)

        return _load

    def _interim() -> None:
        from src.data import load_interim

        last_day = out["cfg"]["data"]["last_day"]
        out["interim"] = load_interim(out["cfg"], last_day, series_level=True)

    steps = [
        ("configuración", _cfg),
        ("targets", _targets),
        ("nb03b_datasets", _tables("ds", "data/interim/nb03b_datasets")),
        ("nb05_test", _tables("te", "data/interim/nb05_test")),
        ("nb06_impact", _tables("im", "data/interim/nb06_impact")),
        ("intermedios", _interim),
        ("matriz y radar", lambda: load_segmentation(out)),
    ]
    for name, step in steps:
        try:
            step()
        except ExportError:
            raise
        except Exception as exc:  # cualquier falla de lectura detiene todo
            raise ExportError(f"No se pudo leer '{name}': {exc}") from exc
        log.info("Leído: %s", name)
    return out


def _sha256(path: Path) -> str:
    """Calcula el SHA-256 de un archivo.

    Parámetros:
        path (Path): archivo.

    Retorno:
        str: hash hexadecimal.
    """
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_records(src: dict) -> list[dict]:
    """Arma el registro de origen de cada fuente leída (constitución I.4).

    Parámetros:
        src (dict): salida de `load_sources`.

    Retorno:
        list[dict]: una entrada por fuente con ruta, fecha, hashes y verificación.
    """
    root: Path = src["data_root"]
    entry = src["processed_manifest"]["artifacts"]["targets"]
    records = [
        {
            "name": "targets",
            "path": entry["path"],
            "frozen_at": entry["frozen_at"],
            "sha256": entry["sha256"],
            "manifest_sha256": _sha256(root / "data/processed/manifest.json"),
            "check": "load_frozen",
        }
    ]
    for name, key, rel in (
        ("nb03b_datasets", "ds", "data/interim/nb03b_datasets"),
        ("nb05_test", "te", "data/interim/nb05_test"),
        ("nb06_impact", "im", "data/interim/nb06_impact"),
    ):
        manifest = src[f"{key}_manifest"]
        records.append(
            {
                "name": name,
                "path": f"{rel}/manifest.json",
                "saved_at": manifest.get("saved_at"),
                "manifest_sha256": _sha256(root / rel / "manifest.json"),
                "source": manifest.get("source"),
                "check": "load_tables",
            }
        )
    for name in SEGMENTATION_SOURCES:
        if name in src:
            seg_entry = src["processed_manifest"]["artifacts"][name]
            records.append(
                {
                    "name": name,
                    "path": seg_entry["path"],
                    "frozen_at": seg_entry["frozen_at"],
                    "sha256": seg_entry["sha256"],
                    "manifest_sha256": _sha256(root / "data/processed/manifest.json"),
                    "check": "load_frozen",
                }
            )
    records.append(
        {
            "name": "interim",
            "path": "data/interim/",
            "check": "load_interim",
            "max_day": int(src["interim"]["max_day"]),
        }
    )
    for rec in records:
        log.info("Fuente %s: %s (%s)", rec["name"], rec["path"], rec.get("saved_at") or rec.get("frozen_at") or "-")
    return records


def block_calendar(src: dict) -> pd.DataFrame:
    """Construye el calendario de bloques 2–65 con su fecha de inicio y sus días.

    Parámetros:
        src (dict): salida de `load_sources`.

    Retorno:
        pd.DataFrame: `block`, `start_date` (texto ISO), `first_day`, `last_day`.
    """
    last_day = int(src["cfg"]["data"]["last_day"])
    b = src["ds"]["boosting_data"][["block", "start_date"]].drop_duplicates()
    if b["block"].duplicated().any():
        raise ExportError("boosting_data tiene más de una fecha de inicio para un mismo bloque.")
    b = b.sort_values("block").reset_index(drop=True)
    expected = list(range(FIRST_BLOCK, LAST_BLOCK + 1))
    if b["block"].tolist() != expected:
        raise ExportError(f"Los bloques de boosting_data no son {FIRST_BLOCK}–{LAST_BLOCK}.")
    b["last_day"] = last_day - 28 * (LAST_BLOCK - b["block"])
    b["first_day"] = b["last_day"] - 27
    starts = pd.to_datetime(b["start_date"])
    if ((starts.diff().dropna()) != pd.Timedelta(days=28)).any():
        raise ExportError("Las fechas de inicio de boosting_data no avanzan de a 28 días.")
    b["end_date"] = (starts + pd.Timedelta(days=27)).dt.strftime("%Y-%m-%d")
    b["start_date"] = starts.dt.strftime("%Y-%m-%d")
    return b[["block", "start_date", "end_date", "first_day", "last_day"]]


def check_non_negative(df: pd.DataFrame, columns: list[str], where: str) -> None:
    """Rechaza valores negativos en columnas que son montos o conteos (constitución III.3).

    Parámetros:
        df (pd.DataFrame): tabla a revisar.
        columns (list[str]): columnas que no admiten negativos.
        where (str): nombre de la tabla, para el mensaje.

    Retorno:
        None: lanza `ExportError` con artículo, bloque y columna de cada caso.
    """
    problems = []
    for col in columns:
        values = pd.to_numeric(df[col], errors="coerce")
        bad = df[values < 0]
        for _, row in bad.iterrows():
            item = row.get("item_id", "-")
            block = row.get("block", "-")
            problems.append(f"{where}: item_id={item} block={block} columna={col} valor={row[col]}")
    if problems:
        raise ExportError("Valores fuera de rango:\n" + "\n".join(problems[:50]))


def _clean(value: Any) -> Any:
    """Convierte valores de numpy/pandas a JSON; NaN y NA pasan a None.

    Parámetros:
        value (Any): valor u objeto anidado.

    Retorno:
        Any: objeto serializable.
    """
    if isinstance(value, dict):
        return {str(k): _clean(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_clean(v) for v in value]
    if value is None or value is pd.NA or value is pd.NaT:
        return None
    if isinstance(value, (np.bool_, bool)):
        return bool(value)
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return None if math.isnan(float(value)) else float(value)
    return value


def write_export(files: dict[str, Any], export_dir: Path) -> None:
    """Escribe todos los JSON en un directorio temporal y reemplaza el destino solo si todo salió bien.

    Parámetros:
        files (dict[str, Any]): ruta relativa → objeto a serializar.
        export_dir (Path): carpeta de destino.

    Retorno:
        None.
    """
    export_dir.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix=".export-", dir=export_dir.parent))
    try:
        for rel, obj in files.items():
            path = tmp / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            text = json.dumps(_clean(obj), ensure_ascii=False, allow_nan=False, separators=(",", ":"))
            path.write_text(text, encoding="utf-8")
    except Exception as exc:
        shutil.rmtree(tmp, ignore_errors=True)
        raise ExportError(f"No se pudo escribir la exportación: {exc}") from exc
    old = export_dir.with_name(export_dir.name + ".old")
    if old.exists():
        shutil.rmtree(old)
    if export_dir.exists():
        export_dir.rename(old)
    tmp.rename(export_dir)
    shutil.rmtree(old, ignore_errors=True)
    log.info("Escritos %d archivos en %s", len(files), export_dir)


def build_meta(src: dict, sources: list[dict], cal: pd.DataFrame, checks: list[dict]) -> dict:
    """Arma `meta.json`.

    Parámetros:
        src (dict): salida de `load_sources`.
        sources (list[dict]): registros de `source_records`.
        cal (pd.DataFrame): calendario de `block_calendar`.
        checks (list[dict]): verificaciones aprobadas.

    Retorno:
        dict: contenido de `meta.json`.
    """
    te_m, im_m = src["te_manifest"], src["im_manifest"]
    headline = {}
    for label, values in im_m["headline"].items():
        headline[SCENARIO_KEYS[label]] = {
            "saving_excess95": values["ahorro_exceso95"],
            "saving_excess95_pct": values["ahorro_exceso95_%"],
            "recovered_sales_same_excess": values["venta_recuperada_igual_exceso"],
            "recovered0_pct": values["recupera0_%"],
        }
    return {
        "exported_at": datetime.now().isoformat(timespec="seconds"),
        "exporter_version": EXPORTER_VERSION,
        "sources": sources,
        "versions": te_m.get("versions", {}),
        "last_day": int(src["cfg"]["data"]["last_day"]),
        "blocks": cal[["block", "start_date"]].to_dict("records"),
        "period": {"start": cal["start_date"].iloc[0], "end": cal["end_date"].iloc[-1]},
        "test": {"n_blocks": N_TEST, "typical_range": [53, 65]},
        "wrmsse_units": {FORM_KEYS[k]: v for k, v in te_m["wrmsse_units"].items()},
        "service": {"target": im_m["target_service"], "z_values": im_m["z_values"]},
        "total_demand_test": im_m["total_demand"],
        "headline": headline,
        "checks": checks,
        "pending": src.get("pending", []),
    }


# ---------------------------------------------------------------------------------------------
# Constructores por archivo (cada historia agrega el suyo a BUILDERS)
# ---------------------------------------------------------------------------------------------

Builder = Callable[[dict, list], dict]


def forecasted_ids(src: dict) -> pd.DataFrame:
    """Lista los 517 artículos pronosticados con su segmento, verificando el universo.

    Parámetros:
        src (dict): salida de `load_sources`.

    Retorno:
        pd.DataFrame: `item_id`, `cell` (un artículo por fila).
    """
    b = src["ds"]["boosting_data"]
    ids = b[["item_id", "cell"]].astype(str).drop_duplicates()
    if ids["item_id"].duplicated().any():
        raise ExportError("Un artículo de boosting_data tiene más de un segmento.")
    n_manifest = int(src["ds_manifest"]["n_items"])
    if not (len(ids) == n_manifest == N_ITEMS):
        raise ExportError(f"Artículos pronosticados: {len(ids)} en datos, {n_manifest} en manifiesto, se esperan {N_ITEMS}.")
    targets = src["targets"].set_index("item_id")
    missing = set(ids["item_id"]) - set(targets.index)
    if missing:
        raise ExportError(f"{len(missing)} artículos pronosticados no están en targets: {sorted(missing)[:5]}")
    if (targets.loc[ids["item_id"], "cell"].to_numpy() != ids["cell"].to_numpy()).any():
        raise ExportError("El segmento de boosting_data no coincide con el de targets.")
    return ids.sort_values("item_id").reset_index(drop=True)


def build_funnel(src: dict, checks: list) -> dict:
    """Arma `funnel.json`: 4 etapas trazables y el dinero en juego (sin lista de artículos).

    Parámetros:
        src (dict): salida de `load_sources`.
        checks (list): verificaciones; se agregan las de esta función.

    Retorno:
        dict: {"funnel.json": contenido}.
    """
    ids = forecasted_ids(src)
    targets = src["targets"]
    by_cell_a = {c: int((targets["cell"] == c).sum()) for c in CELLS}
    by_cell_f = {c: int((ids["cell"] == c).sum()) for c in CELLS}
    share = float(targets.set_index("item_id").loc[ids["item_id"], "spend_share"].sum())
    stages = [
        {"key": "series", "label": "Series tienda × artículo", "count": int(len(src["interim"]["series_index"]))},
        {"key": "items", "label": "Artículos (suma de 10 tiendas)", "count": int(len(src["interim"]["item_ids"]))},
        {"key": "segment_a", "label": "Segmento A", "count": int(len(targets)), "by_cell": by_cell_a},
        {"key": "forecasted", "label": "Pronosticados", "count": int(len(ids)), "by_cell": by_cell_f},
    ]
    checks.append({"name": "items_517", "passed": True, "detail": f"{len(ids)} artículos"})
    return {
        "funnel.json": {
            "stages": stages,
            "money_at_stake": {
                "train_spend_share_517": share,
                "test_demand_517": src["im_manifest"]["total_demand"],
            },
        }
    }


ITEM_IMPACT_RENAME = {
    "demand": "demand",
    "lost_modelo": "lost_model",
    "excess_modelo": "excess_model",
    "lost_naive": "lost_naive",
    "excess_naive": "excess_naive",
    "impacto_perdida": "impact_lost",
    "impacto_exceso": "impact_excess",
    "impacto": "impact",
    "impacto_%_demanda": "impact_pct_demand",
    "z_modelo": "z_model",
    "z_naive": "z_naive",
}


def build_items(src: dict, checks: list) -> dict:
    """Arma `items.json`: los 517 artículos con segmentación, error del modelo e impacto.

    Parámetros:
        src (dict): salida de `load_sources`.
        checks (list): verificaciones; se agregan las de esta función.

    Retorno:
        dict: {"items.json": contenido}.
    """
    ids = forecasted_ids(src)
    targets = src["targets"].set_index("item_id")
    fc = src["te"]["forecasts"].assign(item_id=lambda d: d["item_id"].astype(str))
    counts = fc.groupby("item_id")["block"].agg(["count", "min", "max"])
    bad = counts[counts["count"] != N_TEST]
    if len(bad) or set(counts.index) != set(ids["item_id"]):
        raise ExportError(f"Artículos sin {N_TEST} bloques de test: {bad.index.tolist()[:5]}")
    metrics = src["te"]["item_metrics"].assign(item_id=lambda d: d["item_id"].astype(str))
    check_non_negative(metrics, ["rmsse_units", "wape_units", "mae_units"], "item_metrics")
    impact = src["im"]["item_impact"].assign(item_id=lambda d: d["item_id"].astype(str))
    # impact* es ahorro frente a la línea base: puede ser negativo (constitución III.3)
    check_non_negative(impact, ["demand", "lost_modelo", "excess_modelo", "lost_naive", "excess_naive"], "item_impact")
    check_non_negative(targets.reset_index(), ["spend_train", "cv_train"], "targets")
    b = src["ds"]["boosting_data"].assign(item_id=lambda d: d["item_id"].astype(str))
    first_block = b.groupby("item_id")["block"].min()  # la serie existe desde su primer bloque con venta
    m_idx = {(r.item_id, FORM_SCENARIO[r.form]): r for r in metrics.itertuples(index=False)}
    i_idx = {(r["item_id"], SCENARIO_KEYS[r["scenario"]]): r for r in impact.to_dict("records")}
    items = []
    for item_id, cell in zip(ids["item_id"], ids["cell"]):
        t = targets.loc[item_id]
        entry = {
            "item_id": item_id,
            "cell": cell,
            "treatment": t["treatment"],
            "spend_train": t["spend_train"],
            "spend_share": t["spend_share"],
            "cv_train": t["cv_train"],
            "test_blocks": [int(counts.loc[item_id, "min"]), int(counts.loc[item_id, "max"])],
            "first_block": int(first_block[item_id]),
            "metrics": {},
            "impact": {},
        }
        for esc in ("A", "B"):
            m = m_idx.get((item_id, esc))
            i = i_idx.get((item_id, esc))
            if m is None or i is None:
                raise ExportError(f"Falta métrica o impacto de {item_id} en el escenario {esc}.")
            entry["metrics"][esc] = {
                "rmsse_units": m.rmsse_units,
                "wape_units": m.wape_units,
                "mae_units": m.mae_units,
                "review": bool(m.review),
            }
            entry["impact"][esc] = {new: i[old] for old, new in ITEM_IMPACT_RENAME.items()}
        items.append(entry)
    items.sort(key=lambda e: (e["cell"], -e["spend_train"]))
    return {"items.json": {"items": items}}


READING_RENAME = {
    "z95_modelo": "z95_model",
    "z95_naive": "z95_naive",
    "exceso95_modelo": "excess95_model",
    "exceso95_naive": "excess95_naive",
    "ahorro_exceso95": "saving_excess95",
    "ahorro_exceso95_%": "saving_excess95_pct",
    "venta_recuperada_igual_exceso": "recovered_sales_same_excess",
    "perdida0_modelo": "lost0_model",
    "perdida0_naive": "lost0_naive",
    "exceso0_modelo": "excess0_model",
    "exceso0_naive": "excess0_naive",
    "recupera0_%": "recovered0_pct",
    "recupera95_%": "recovered95_pct",
}
AB_RENAME = {
    "exceso95_A": "excess95_A",
    "exceso95_B": "excess95_B",
    "exceso95_extra_B": "excess95_extra_B",
    "desajuste0_A": "mismatch0_A",
    "desajuste0_B": "mismatch0_B",
    "desajuste0_extra_B": "mismatch0_extra_B",
}
CONC_RENAME = {
    "articulos": "items",
    "mejoran": "improve",
    "empeoran": "worsen",
    "para_50%_del_impacto": "for_50pct",
    "para_80%_del_impacto": "for_80pct",
    "impacto_total": "impact_total",
}
SEG_IMPACT_COLS = ["demand", "impacto_perdida", "impacto_exceso", "impacto", "impacto_%_demanda"]


def build_segments(src: dict, checks: list) -> dict:
    """Arma `segments.json`: comparación AX/AY/AZ/total, curvas de servicio y lecturas.

    Parámetros:
        src (dict): salida de `load_sources`.
        checks (list): verificaciones; se agregan las de esta función.

    Retorno:
        dict: {"segments.json": contenido}.
    """
    ids = forecasted_ids(src)
    targets = src["targets"].set_index("item_id").loc[ids["item_id"]]
    im, te = src["im"], src["te"]
    metrics = te["metrics"]
    metrics = metrics[(metrics["nivel"] == "unidades") & metrics["step"].isna()]
    by_seg = im["by_segment"]
    readings = im["readings"]
    curves = im["curves"]
    ab = im["ab"].set_index("segment")
    check_non_negative(curves, ["demand", "captured", "lost", "excess"], "curves")
    z_values = [float(z) for z in src["im_manifest"]["z_values"]]
    segments = {}
    for seg in CELLS + ["total"]:
        t = targets if seg == "total" else targets[targets["cell"] == seg]
        error = {}
        for form, key in FORM_KEYS.items():
            row = metrics[(metrics["segment"] == seg) & (metrics["form"] == form)]
            if len(row) != 1:
                raise ExportError(f"metrics: falta {seg} × {form} en unidades.")
            error[key] = {"wrmsse": row["wrmsse"].iloc[0], "wape": row["wape"].iloc[0]}
        impact, reading = {}, {}
        for label, esc in SCENARIO_KEYS.items():
            r = by_seg[(by_seg["scenario"] == label) & (by_seg["cell"] == seg)]
            rd = readings[(readings["scenario"] == label) & (readings["segment"] == seg)]
            if len(r) != 1 or len(rd) != 1:
                raise ExportError(f"by_segment o readings: falta {seg} × {label}.")
            impact[esc] = {
                "demand": r["demand"].iloc[0],
                "impact_lost": r["impacto_perdida"].iloc[0],
                "impact_excess": r["impacto_exceso"].iloc[0],
                "impact": r["impacto"].iloc[0],
                "impact_pct_demand": r["impacto_%_demanda"].iloc[0],
            }
            reading[esc] = {new: rd[old].iloc[0] for old, new in READING_RENAME.items()}
        seg_curves = {}
        for form, key in CURVE_KEYS.items():
            c = curves[(curves["segment"] == seg) & (curves["forecast"] == form)].sort_values("z")
            if [round(float(z), 4) for z in c["z"]] != [round(z, 4) for z in z_values]:
                raise ExportError(f"curves: {seg} × {form} no tiene los {len(z_values)} valores de z.")
            seg_curves[key] = c[["z", "demand", "captured", "lost", "excess", "short_blocks", "service"]].to_dict("records")
        segments[seg] = {
            "n_items": int(len(t)),
            "spend_train": t["spend_train"].sum(),
            "spend_share": t["spend_share"].sum(),
            "cv_train": sorted(float(v) for v in t["cv_train"]),
            "error": error,
            "impact": impact,
            "reading": reading,
            "curves": seg_curves,
            "ab": {new: ab.loc[seg, old] for old, new in AB_RENAME.items()},
        }
    n_sum = sum(segments[c]["n_items"] for c in CELLS)
    if n_sum != N_ITEMS or segments["total"]["n_items"] != N_ITEMS:
        raise ExportError(f"Los segmentos suman {n_sum}, se esperan {N_ITEMS}.")
    checks.append({"name": "segments_sum_517", "passed": True, "detail": f"{n_sum}"})
    # Cuadre: suma del ahorro por artículo == total del escenario (SC-005)
    item_impact = im["item_impact"]
    for label, esc in SCENARIO_KEYS.items():
        g = item_impact[item_impact["scenario"] == label]
        total = by_seg[(by_seg["scenario"] == label) & (by_seg["cell"] == "total")].iloc[0]
        diffs = {c: abs(float(g[c].sum()) - float(total[c])) for c in ["demand", "impacto", "impacto_exceso", "impacto_perdida"]}
        worst = max(diffs.values())
        if worst > IMPACT_TOLERANCE:
            raise ExportError(f"La suma por artículo no cuadra con el total en {label}: {diffs}")
        checks.append({"name": f"impact_sum_matches_total_{esc}", "passed": True, "detail": f"diferencia máxima {worst:.2e} US$"})
    conc = im["concentration"]
    concentration = {
        SCENARIO_KEYS[r["scenario"]]: {new: r[old] for old, new in CONC_RENAME.items()}
        for r in conc.to_dict("records")
    }
    return {"segments.json": {"segments": segments, "concentration": concentration}}


def build_series(src: dict, checks: list) -> dict:
    """Arma `series/<item_id>.json`: venta por bloque (observada y completada) y pronóstico de test.

    Parámetros:
        src (dict): salida de `load_sources`.
        checks (list): verificaciones; se agregan las de esta función.

    Retorno:
        dict: {"series/<item_id>.json": contenido} para los 517 artículos.
    """
    ids = forecasted_ids(src)
    cal = src["calendar_blocks"]
    interim = src["interim"]
    pos = {str(i): k for k, i in enumerate(interim["item_ids"])}
    units = np.asarray(interim["item_units"])
    spend = np.asarray(interim["item_spend"])
    # Suma diaria → bloque de 28 días (única agregación que hace el exportador)
    idx = np.stack([np.arange(f - 1, l) for f, l in zip(cal["first_day"], cal["last_day"])])
    b = src["ds"]["boosting_data"].assign(item_id=lambda d: d["item_id"].astype(str))
    b = b[["item_id", "block", "units", "ratio_raw"]]
    fc = src["te"]["forecasts"].assign(item_id=lambda d: d["item_id"].astype(str))
    fc = fc[["item_id", "block", "step", "units_1step", "units_chain", "units_snaive"]]
    rows = []
    for item_id in ids["item_id"]:
        if item_id not in pos:
            raise ExportError(f"{item_id} no está en los intermedios de venta.")
        k = pos[item_id]
        rows.append(
            pd.DataFrame(
                {
                    "item_id": item_id,
                    "block": cal["block"].to_numpy(),
                    "units_observed": units[k][idx].sum(axis=1),
                    "money_observed": spend[k][idx].sum(axis=1),
                }
            )
        )
    df = pd.concat(rows, ignore_index=True)
    df = df.merge(b, on=["item_id", "block"], how="left").merge(fc, on=["item_id", "block"], how="left")
    # La serie empieza a existir en su primer bloque con venta (el de boosting_data): el arranque
    # anterior no corresponde al artículo y no se cuenta; se exporta null ("no disponible"), no 0.
    first = df.loc[df["units"].notna()].groupby("item_id")["block"].min()
    before = df["block"] < df["item_id"].map(first)
    df.loc[before, ["units_observed", "money_observed"]] = np.nan
    check_non_negative(
        df,
        ["units_observed", "money_observed", "units", "ratio_raw", "units_1step", "units_chain", "units_snaive"],
        "series",
    )
    files = {}
    for item_id, g in df.groupby("item_id", sort=False):
        g = g.sort_values("block")
        if g["step"].notna().sum() != N_TEST:
            raise ExportError(f"{item_id}: no tiene {N_TEST} bloques de test en la serie.")
        out_rows = []
        for r in g.itertuples(index=False):
            in_test = not pd.isna(r.step)
            out_rows.append(
                {
                    "block": int(r.block),
                    "units_observed": r.units_observed,
                    "money_observed": r.money_observed,
                    "units_completed": r.units,
                    "ratio_completed": r.ratio_raw,
                    "step": int(r.step) if in_test else None,
                    "forecast": {"A": r.units_1step, "B": r.units_chain} if in_test else None,
                    "baseline": r.units_snaive if in_test else None,
                }
            )
        files[f"series/{item_id}.json"] = {"item_id": item_id, "rows": out_rows}
    checks.append({"name": "series_517_x_13_test", "passed": True, "detail": f"{len(files)} archivos"})
    return files


# ---------------------------------------------------------------------------------------------
# Iteración 2: catálogo de los 3.049, serie descriptiva, matriz y radar (solo adición)
# ---------------------------------------------------------------------------------------------


def load_segmentation(out: dict, loader: Callable[[str], Any] | None = None) -> None:
    """Lee la matriz vigente y los perfiles del radar si el proyecto de datos los congeló (R11).

    Una fuente no declarada en el manifiesto queda registrada en `out["pending"]` (visible en el
    sitio); una fuente declarada que no se puede leer o no tiene sus columnas detiene todo.

    Parámetros:
        out (dict): fuentes cargadas; debe tener `processed_manifest`. Se modifica en el lugar.
        loader (Callable[[str], Any] | None): lector verificado; por defecto `src.freeze.load_frozen`.

    Retorno:
        None.
    """
    if loader is None:
        from src.freeze import load_frozen as loader
    out.setdefault("pending", [])
    declared = out["processed_manifest"]["artifacts"]
    required = {"segmentation_items": SEGMENTATION_ITEM_COLS, "radar_profiles": RADAR_COLS}
    for name in SEGMENTATION_SOURCES:
        if name not in declared:
            out["pending"].append({"name": name, "reason": "no está declarado en data/processed/manifest.json"})
            log.warning("Fuente pendiente: %s (no está en el manifiesto)", name)
            continue
        try:
            df = loader(name)
        except Exception as exc:
            raise ExportError(f"No se pudo leer '{name}' con load_frozen: {exc}") from exc
        missing = [c for c in required[name] if c not in df.columns]
        if missing:
            raise ExportError(f"'{name}' no tiene las columnas {missing}.")
        out[name] = df


def block_sums(src: dict) -> dict:
    """Suma la venta diaria por bloque de 28 días para los 3.049 artículos (I.10).

    Es la misma suma de `build_series`, sobre el mismo calendario; se calcula una sola vez.

    Parámetros:
        src (dict): salida de `load_sources`, con `calendar_blocks`.

    Retorno:
        dict: `item_ids` (list[str]), `blocks` (np.ndarray), `units` y `money` (artículos × bloques).
    """
    if "block_sums" not in src:
        cal = src["calendar_blocks"]
        interim = src["interim"]
        idx = np.stack([np.arange(f - 1, l) for f, l in zip(cal["first_day"], cal["last_day"])])
        units = np.asarray(interim["item_units"])
        spend = np.asarray(interim["item_spend"])
        src["block_sums"] = {
            "item_ids": [str(i) for i in interim["item_ids"]],
            "blocks": cal["block"].to_numpy(),
            "units": units[:, idx].sum(axis=2),
            "money": spend[:, idx].sum(axis=2),
        }
    return src["block_sums"]


def first_sale_block(units_row: np.ndarray, blocks: np.ndarray) -> int | None:
    """Primer bloque con unidades observadas > 0 (lanzamiento; constitución II.8).

    Parámetros:
        units_row (np.ndarray): unidades por bloque de un artículo.
        blocks (np.ndarray): números de bloque, en el mismo orden.

    Retorno:
        int | None: bloque, o None si nunca vendió.
    """
    pos = np.flatnonzero(np.nan_to_num(units_row) > 0)
    return int(blocks[pos[0]]) if pos.size else None


def build_catalog(src: dict, checks: list) -> dict:
    """Arma `catalog.json`: los 3.049 artículos, si tienen pronóstico y su celda (si existe la fuente).

    Parámetros:
        src (dict): salida de `load_sources`.
        checks (list): verificaciones; se agregan las de esta función.

    Retorno:
        dict: {"catalog.json": contenido}.
    """
    bs = block_sums(src)
    ids = bs["item_ids"]
    if len(ids) != N_CATALOG or len(set(ids)) != N_CATALOG:
        raise ExportError(f"El catálogo tiene {len(ids)} artículos ({len(set(ids))} únicos); se esperan {N_CATALOG}.")
    forecasted = set(forecasted_ids(src)["item_id"])
    seg = None
    if "segmentation_items" in src:
        seg = src["segmentation_items"].assign(item_id=lambda d: d["item_id"].astype(str)).set_index("item_id")
        if len(seg) != N_CATALOG or set(seg.index) != set(ids):
            raise ExportError("segmentation_items no tiene los mismos 3.049 artículos que item_index.")
        targets = src["targets"].assign(item_id=lambda d: d["item_id"].astype(str)).set_index("item_id")["cell"]
        a_cells = seg.loc[seg["cell"].isin(CELLS), "cell"]
        if set(a_cells.index) != set(targets.index) or (a_cells.reindex(targets.index) != targets).any():
            raise ExportError("Las celdas AX/AY/AZ de segmentation_items no coinciden con targets.")
        checks.append({"name": "segmentation_matches_targets", "passed": True, "detail": f"{len(a_cells)} artículos"})
    out = []
    for k, item_id in enumerate(ids):
        fb = first_sale_block(bs["units"][k], bs["blocks"])
        if fb is None:
            raise ExportError(f"{item_id}: no tiene venta en los bloques {FIRST_BLOCK}–{LAST_BLOCK}.")
        row = seg.loc[item_id] if seg is not None else None
        out.append(
            {
                "item_id": item_id,
                "dept": item_id.rsplit("_", 1)[0],
                "cell": None if row is None else str(row["cell"]),
                "abc_class": None if row is None else str(row["abc_class"]),
                "xyz_class": None if row is None else str(row["xyz_class"]),
                "forecasted": item_id in forecasted,
                "first_block": fb,
            }
        )
    out.sort(key=lambda r: r["item_id"])
    n_fc = sum(r["forecasted"] for r in out)
    if n_fc != N_ITEMS:
        raise ExportError(f"El catálogo marca {n_fc} artículos con pronóstico; se esperan {N_ITEMS}.")
    checks.append({"name": "catalog_3049", "passed": True})
    checks.append({"name": "catalog_forecasted_517", "passed": True})
    return {"catalog.json": {"items": out}}


def descriptive_stats(units: np.ndarray) -> dict:
    """Media, σ poblacional, bandas ±3σ, CV descriptivo e histograma de las unidades por bloque.

    Parámetros:
        units (np.ndarray): unidades observadas por bloque, desde el lanzamiento.

    Retorno:
        dict: `stats` (n_blocks, mean, sigma, band_upper, band_lower, cv_pct) e `histogram`
        (lista de {from, to, count}); lo que no se puede calcular va como None.
    """
    u = np.asarray(units, dtype=float)
    n = int(u.size)
    mean = float(u.mean())
    sigma = float(u.std(ddof=0)) if n > 1 else None
    cv = sigma / mean * 100 if sigma is not None and mean > 0 else None
    lo, hi = float(u.min()), float(u.max())
    if hi == lo:
        hist = [{"from": lo, "to": hi, "count": n}]
    else:
        counts, edges = np.histogram(u, bins=N_HIST_BINS, range=(lo, hi))
        hist = [{"from": float(edges[i]), "to": float(edges[i + 1]), "count": int(counts[i])} for i in range(N_HIST_BINS)]
    return {
        "stats": {
            "n_blocks": n,
            "mean": mean,
            "sigma": sigma,
            "band_upper": mean + 3 * sigma if sigma is not None else None,
            "band_lower": mean - 3 * sigma if sigma is not None else None,
            "cv_pct": cv,
        },
        "histogram": hist,
    }


def build_descriptive(src: dict, checks: list) -> dict:
    """Arma `descriptive/<item_id>.json` para los 3.049: venta por bloque desde el lanzamiento y sus
    estadísticos descriptivos (constitución I.10, II.8).

    Parámetros:
        src (dict): salida de `load_sources`.
        checks (list): verificaciones; se agregan las de esta función.

    Retorno:
        dict: {"descriptive/<item_id>.json": contenido}.
    """
    bs = block_sums(src)
    blocks = bs["blocks"]
    files = {}
    for k, item_id in enumerate(bs["item_ids"]):
        fb = first_sale_block(bs["units"][k], blocks)
        keep = blocks >= fb
        df = pd.DataFrame(
            {"item_id": item_id, "block": blocks[keep], "units": bs["units"][k][keep], "money": bs["money"][k][keep]}
        )
        check_non_negative(df, ["units", "money"], "descriptive")
        desc = descriptive_stats(df["units"].to_numpy())
        if sum(b["count"] for b in desc["histogram"]) != desc["stats"]["n_blocks"]:
            raise ExportError(f"{item_id}: el histograma no suma los bloques.")
        files[f"descriptive/{item_id}.json"] = {
            "item_id": item_id,
            "first_block": fb,
            "rows": [
                {"block": int(r.block), "units_observed": r.units, "money_observed": r.money}
                for r in df.itertuples(index=False)
            ],
            **desc,
        }
    checks.append({"name": "descriptive_3049", "passed": True, "detail": f"{len(files)} archivos"})
    return files


def build_segmentation(src: dict, checks: list, n_catalog: int = N_CATALOG) -> dict:
    """Arma `segmentation.json`: matriz ABC × XYZ (sin los artículos sin clase XYZ) y radar.

    Solo cuenta artículos y suma su gasto por celda sobre la clasificación leída; las medianas del
    radar se copian (constitución I.11, II.2).

    Parámetros:
        src (dict): salida de `load_sources`.
        checks (list): verificaciones; se agregan las de esta función.
        n_catalog (int): tamaño esperado del catálogo.

    Retorno:
        dict: {"segmentation.json": contenido}, o {} si alguna fuente está pendiente.
    """
    if any(name not in src for name in SEGMENTATION_SOURCES):
        return {}
    items = src["segmentation_items"]
    classified = items[items["xyz_class"] != "-"]
    excluded = int(len(items) - len(classified))
    grouped = classified.groupby(["abc_class", "xyz_class", "cell"], as_index=False).agg(
        n_items=("item_id", "size"), spend=("spend", "sum")
    )
    matrix = grouped.sort_values(["abc_class", "xyz_class"]).to_dict("records")
    total = int(grouped["n_items"].sum())
    if total + excluded != n_catalog or len(items) != n_catalog:
        raise ExportError(f"La matriz suma {total} + {excluded} sin clase XYZ; se esperan {n_catalog}.")
    checks.append({"name": "matrix_sums_classified", "passed": True, "detail": f"{total} + {excluded} sin clase XYZ"})
    radar = src["radar_profiles"]
    radar = radar[~radar["cell"].astype(str).str.contains("-")]
    axes = list(dict.fromkeys(radar["axis"].astype(str)))
    cells: dict[str, dict] = {}
    for r in radar.itertuples(index=False):
        cells.setdefault(str(r.cell), {})[str(r.axis)] = {"median_raw": r.median_raw, "median_norm": r.median_norm}
    global_median = radar.groupby("axis")["global_median"].first().to_dict()
    if any(len(v) != len(axes) for v in cells.values()):
        raise ExportError("radar_profiles no tiene todos los ejes en todas las celdas.")
    checks.append({"name": "radar_cells_x_axes", "passed": True, "detail": f"{len(cells)} × {len(axes)}"})
    return {
        "segmentation.json": {
            "matrix": [
                {"abc_class": m["abc_class"], "xyz_class": m["xyz_class"], "cell": m["cell"],
                 "n_items": int(m["n_items"]), "spend": float(m["spend"])}
                for m in matrix
            ],
            "total_items": total,
            "excluded_no_xyz": excluded,
            "radar": {"axes": axes, "global_median": {str(k): float(v) for k, v in global_median.items()}, "cells": cells},
        }
    }


BUILDERS: list[Builder] = [
    build_funnel,
    build_items,
    build_segments,
    build_series,
    # Iteración 2 (solo adición, al final)
    build_catalog,
    build_descriptive,
    build_segmentation,
]


def main() -> int:
    """Ejecuta la exportación completa.

    Retorno:
        int: 0 si se escribió todo; 1 si algo falló (y no se escribió nada).
    """
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    try:
        env = read_env(REPO_ROOT)
        src = load_sources(env["data_root"])
        src["calendar_blocks"] = block_calendar(src)
        checks: list[dict] = []
        files: dict[str, Any] = {}
        for builder in BUILDERS:
            files.update(builder(src, checks))
        files["meta.json"] = build_meta(src, source_records(src), src["calendar_blocks"], checks)
        write_export(files, env["export_dir"])
    except ExportError as exc:
        log.error("Exportación detenida, no se escribió nada: %s", exc)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
