"""Pruebas de la iteración 2: catálogo de los 3.049, serie descriptiva, matriz y radar.

Igual que test_export.py, las invariantes se comprueban sobre la salida real en public/data; las
reglas de fuente pendiente u obligatoria se prueban con datos falsos.
"""

import filecmp
import json
import math
import os
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from export.export_data import (
    SEGMENTATION_SOURCES,
    ExportError,
    build_segmentation,
    descriptive_stats,
    load_segmentation,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA = REPO_ROOT / "public" / "data"
N_CATALOG = 3049


def load(name: str):
    """Lee un JSON exportado o salta la prueba si no existe.

    Parámetros:
        name (str): ruta relativa dentro de public/data.

    Retorno:
        Any: contenido del JSON.
    """
    path = DATA / name
    if not path.exists():
        pytest.skip(f"{path} no existe; ejecute la exportación")
    return json.loads(path.read_text(encoding="utf-8"))


# --- Catálogo -----------------------------------------------------------------------------------


def test_catalog_3049_and_forecasted_517():
    cat = load("catalog.json")["items"]
    ids = [c["item_id"] for c in cat]
    assert len(ids) == N_CATALOG and len(set(ids)) == N_CATALOG
    assert ids == sorted(ids)
    items = {i["item_id"]: i for i in load("items.json")["items"]}
    forecasted = {c["item_id"] for c in cat if c["forecasted"]}
    assert forecasted == set(items)
    for c in cat:
        assert c["dept"] == c["item_id"].rsplit("_", 1)[0]
        if c["item_id"] in items:
            assert c["cell"] == items[c["item_id"]]["cell"]
            # Lanzamiento (primera venta observada) ≤ inicio de la serie modelada de boosting_data
            assert c["first_block"] <= items[c["item_id"]]["first_block"]


# --- Serie descriptiva -------------------------------------------------------------------------


def test_descriptive_files_and_match_series():
    cat = load("catalog.json")["items"]
    files = list((DATA / "descriptive").glob("*.json"))
    assert len(files) == N_CATALOG
    for c in cat[:: 50]:
        d = load(f"descriptive/{c['item_id']}.json")
        blocks = [r["block"] for r in d["rows"]]
        assert blocks == list(range(c["first_block"], 66))
        assert all(r["units_observed"] >= 0 and r["money_observed"] >= 0 for r in d["rows"])
        assert d["rows"][0]["units_observed"] > 0
        if c["forecasted"]:
            s = {r["block"]: r for r in load(f"series/{c['item_id']}.json")["rows"]}
            for r in d["rows"]:
                if s[r["block"]]["units_observed"] is None:  # antes del inicio de la serie modelada
                    continue
                assert r["units_observed"] == s[r["block"]]["units_observed"]
                assert r["money_observed"] == s[r["block"]]["money_observed"]


def test_descriptive_stats_values():
    cat = load("catalog.json")["items"]
    for c in cat[:: 97]:
        d = load(f"descriptive/{c['item_id']}.json")
        u = np.array([r["units_observed"] for r in d["rows"]], dtype=float)
        st = d["stats"]
        assert st["n_blocks"] == len(u)
        assert math.isclose(st["mean"], u.mean(), rel_tol=1e-9)
        if len(u) > 1:
            assert math.isclose(st["sigma"], u.std(ddof=0), rel_tol=1e-9, abs_tol=1e-9)
            assert math.isclose(st["band_upper"], u.mean() + 3 * u.std(ddof=0), rel_tol=1e-9)
            assert math.isclose(st["band_lower"], u.mean() - 3 * u.std(ddof=0), rel_tol=1e-9, abs_tol=1e-9)
        h = d["histogram"]
        assert 1 <= len(h) <= 8
        assert sum(b["count"] for b in h) == st["n_blocks"]
        assert all(math.isclose(h[i]["to"], h[i + 1]["from"]) for i in range(len(h) - 1))


def test_descriptive_stats_edge_cases():
    one = descriptive_stats(np.array([5.0]))
    assert one["stats"]["sigma"] is None and one["stats"]["band_upper"] is None and one["stats"]["cv_pct"] is None
    assert one["histogram"] == [{"from": 5.0, "to": 5.0, "count": 1}]
    zero = descriptive_stats(np.array([0.0, 0.0, 0.0]))
    assert zero["stats"]["cv_pct"] is None
    same = descriptive_stats(np.array([3.0, 3.0]))
    assert len(same["histogram"]) == 1 and same["histogram"][0]["count"] == 2
    many = descriptive_stats(np.arange(1.0, 21.0))
    assert len(many["histogram"]) == 8 and sum(b["count"] for b in many["histogram"]) == 20
    assert math.isclose(many["stats"]["cv_pct"], np.arange(1.0, 21.0).std() / 10.5 * 100)


# --- Matriz y radar ------------------------------------------------------------------------------


def test_segmentation_matrix_and_radar():
    seg = load("segmentation.json")
    cells = {m["cell"]: m["n_items"] for m in seg["matrix"]}
    assert len(cells) == 9 and all("-" not in c for c in cells)
    assert sum(cells.values()) == seg["total_items"]
    assert seg["total_items"] + seg["excluded_no_xyz"] == N_CATALOG
    assert (cells["AX"], cells["AY"], cells["AZ"]) == (207, 251, 134)
    assert len(seg["radar"]["axes"]) == 5 and len(seg["radar"]["cells"]) == 9
    for cell, axes in seg["radar"]["cells"].items():
        for axis, v in axes.items():
            g = seg["radar"]["global_median"][axis]
            assert math.isclose(v["median_raw"] / g, v["median_norm"], rel_tol=1e-9)


def test_meta_pending_empty_with_sources():
    meta = load("meta.json")
    assert meta["pending"] == []
    names = {s["name"] for s in meta["sources"]}
    assert set(SEGMENTATION_SOURCES) <= names


def _fake_seg():
    items = pd.DataFrame(
        {
            "item_id": ["A_1", "A_2", "B_1", "C_1"],
            "abc_class": ["A", "A", "B", "C"],
            "xyz_class": ["X", "Y", "X", "-"],
            "cell": ["AX", "AY", "BX", "C-"],
            "spend": [10.0, 20.0, 5.0, 1.0],
        }
    )
    radar = pd.DataFrame(
        {
            "cell": ["AX", "AY", "BX"],
            "axis": ["spend"] * 3,
            "median_raw": [10.0, 20.0, 5.0],
            "median_norm": [2.0, 4.0, 1.0],
            "global_median": [5.0, 5.0, 5.0],
        }
    )
    return items, radar


def test_load_segmentation_pending_when_not_declared():
    out = {"processed_manifest": {"artifacts": {"targets": {}}}}
    load_segmentation(out, loader=lambda name: pytest.fail("no debe leer"))
    assert [p["name"] for p in out["pending"]] == list(SEGMENTATION_SOURCES)
    assert all(name not in out for name in SEGMENTATION_SOURCES)
    assert build_segmentation(out, []) == {}


def test_load_segmentation_declared_but_broken_fails():
    out = {"processed_manifest": {"artifacts": {name: {} for name in SEGMENTATION_SOURCES}}}

    def broken(name):
        raise RuntimeError("hash no coincide")

    with pytest.raises(ExportError, match="segmentation_items"):
        load_segmentation(out, loader=broken)


def test_build_segmentation_excludes_no_xyz():
    items, radar = _fake_seg()
    src = {"segmentation_items": items, "radar_profiles": radar, "pending": []}
    checks: list = []
    files = build_segmentation(src, checks, n_catalog=4)
    seg = files["segmentation.json"]
    assert seg["total_items"] == 3 and seg["excluded_no_xyz"] == 1
    assert {m["cell"] for m in seg["matrix"]} == {"AX", "AY", "BX"}
    assert sum(m["spend"] for m in seg["matrix"]) == 35.0
    assert "C-" not in seg["radar"]["cells"]


# --- Regresión: los archivos de los 517 no cambian ---------------------------------------------


def test_files_of_517_unchanged_against_baseline():
    base = os.environ.get("EXPORT_BASELINE")
    if not base:
        pytest.skip("defina EXPORT_BASELINE con la copia de public/data previa (T063)")
    base = Path(base)
    for name in ("funnel.json", "segments.json", "items.json"):
        assert filecmp.cmp(base / name, DATA / name, shallow=False), name
    cmp = filecmp.dircmp(base / "series", DATA / "series")
    assert not cmp.left_only and not cmp.right_only
    _, mismatch, errors = filecmp.cmpfiles(base / "series", DATA / "series", cmp.common_files, shallow=False)
    assert not mismatch and not errors
