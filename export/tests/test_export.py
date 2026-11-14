"""Pruebas del exportador: funciones base y invariantes sobre la salida real en public/data."""

import json
import math
from pathlib import Path

import pandas as pd
import pytest

from export.export_data import ExportError, check_non_negative, read_env, write_export

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA = REPO_ROOT / "public" / "data"


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


# --- Base -------------------------------------------------------------------------------------


def test_read_env_missing_root(tmp_path):
    (tmp_path / ".env").write_text("DATA_PROJECT_ROOT=/no/existe\nEXPORT_DIR=public/data\n")
    with pytest.raises(ExportError, match="DATA_PROJECT_ROOT"):
        read_env(tmp_path)


def test_read_env_missing_variable(tmp_path):
    (tmp_path / ".env").write_text("EXPORT_DIR=public/data\n")
    with pytest.raises(ExportError, match="DATA_PROJECT_ROOT"):
        read_env(tmp_path)


def test_check_non_negative_reports_item_block_column():
    df = pd.DataFrame({"item_id": ["X_1"], "block": [53], "units": [-1.0]})
    with pytest.raises(ExportError) as exc:
        check_non_negative(df, ["units"], "series")
    msg = str(exc.value)
    assert "X_1" in msg and "53" in msg and "units" in msg


def test_write_export_failure_keeps_previous(tmp_path):
    export_dir = tmp_path / "data"
    export_dir.mkdir()
    (export_dir / "meta.json").write_text('{"old": true}')
    with pytest.raises(ExportError):
        write_export({"bad.json": {"x": object()}}, export_dir)
    assert json.loads((export_dir / "meta.json").read_text()) == {"old": True}
    assert not (export_dir / "bad.json").exists()


# --- Salida real: meta --------------------------------------------------------------------------


def test_meta_wrmsse_and_sources():
    meta = load("meta.json")
    w = meta["wrmsse_units"]
    assert round(w["one_step"], 3) == 0.495
    assert round(w["chained"], 3) == 0.748
    assert round(w["seasonal_naive"], 3) == 0.868
    # Iteración 2: se agregan segmentation_items y radar_profiles (solo adición)
    assert {s["name"] for s in meta["sources"]} >= {
        "targets", "nb03b_datasets", "nb05_test", "nb06_impact", "interim"
    }


# --- US1: embudo ----------------------------------------------------------------------------------


def test_funnel_stages_and_no_item_list():
    funnel = load("funnel.json")
    assert [s["count"] for s in funnel["stages"]] == [30490, 3049, 592, 517]
    by = {s["key"]: s.get("by_cell") for s in funnel["stages"]}
    assert by["segment_a"] == {"AX": 207, "AY": 251, "AZ": 134}
    assert by["forecasted"] == {"AX": 191, "AY": 229, "AZ": 97}
    # constitución II.2: ninguna lista de artículos fuera de los 517
    assert set(funnel) == {"stages", "money_at_stake"}
    assert round(funnel["money_at_stake"]["train_spend_share_517"], 3) == 0.522


# --- US2: segmentos e ítems -----------------------------------------------------------------------


def test_items_517_unique():
    items = load("items.json")["items"]
    assert len(items) == 517
    assert len({i["item_id"] for i in items}) == 517
    assert {i["cell"] for i in items} == {"AX", "AY", "AZ"}


def test_segments_counts_cv_and_curves():
    seg = load("segments.json")["segments"]
    assert sum(seg[c]["n_items"] for c in ("AX", "AY", "AZ")) == 517 == seg["total"]["n_items"]
    for key, s in seg.items():
        assert len(s["cv_train"]) == s["n_items"]
        assert s["cv_train"] == sorted(s["cv_train"])
        assert min(s["cv_train"]) >= 0
        for curve in ("A", "B", "naive", "perfect"):
            assert len(s["curves"][curve]) == 17, (key, curve)


@pytest.mark.parametrize("esc", ["A", "B"])
def test_impact_sum_matches_total(esc):
    items = load("items.json")["items"]
    total = load("segments.json")["segments"]["total"]["impact"][esc]
    for col in ("impact", "impact_excess", "impact_lost", "demand"):
        s = sum(i["impact"][esc][col] for i in items)
        assert abs(s - total[col]) <= 0.01, col


# --- US4: series ----------------------------------------------------------------------------------


def test_series_files_and_test_blocks():
    files = sorted((DATA / "series").glob("*.json")) if (DATA / "series").exists() else []
    if not files:
        pytest.skip("series no exportadas")
    assert len(files) == 517
    for f in files:
        rows = json.loads(f.read_text())["rows"]
        assert [r["block"] for r in rows] == list(range(2, 66))
        test = [r for r in rows if r["forecast"] is not None]
        assert [r["step"] for r in test] == list(range(1, 14))
        for r in rows:
            for k in ("units_observed", "money_observed", "units_completed", "ratio_completed", "baseline"):
                assert r[k] is None or r[k] >= 0


def test_series_known_values():
    s = load("series/FOODS_1_004.json")["rows"]
    by = {r["block"]: r for r in s}
    assert by[53]["units_completed"] == 3371.0
    assert math.isclose(by[53]["forecast"]["A"], 3682.74, abs_tol=0.01)
    assert math.isclose(by[53]["baseline"], 2579.86, abs_tol=0.01)
    assert by[64]["units_observed"] == 0 and math.isclose(by[64]["units_completed"], 2142.0)
    for item, first, last in (("HOUSEHOLD_1_366", 51, 63), ("HOUSEHOLD_1_427", 52, 64)):
        rows = load(f"series/{item}.json")["rows"]
        test = [r["block"] for r in rows if r["forecast"] is not None]
        assert (test[0], test[-1]) == (first, last)


# --- US5: impacto ---------------------------------------------------------------------------------


def test_headline_and_z():
    meta = load("meta.json")
    h = meta["headline"]["A"]
    assert round(h["saving_excess95"] / 1e6, 2) == 3.28
    assert round(h["saving_excess95_pct"]) == 77
    assert round(h["recovered_sales_same_excess"] / 1e6, 2) == 0.91
    z = meta["service"]["z_values"]
    assert len(z) == 17 and z[0] == -1.0 and z[-1] == 3.0
    items = load("items.json")["items"]
    total = load("segments.json")["segments"]["total"]["reading"]
    for esc in ("A", "B"):
        assert all(math.isclose(i["impact"][esc]["z_model"], total[esc]["z95_model"]) for i in items)
        assert all(math.isclose(i["impact"][esc]["z_naive"], total[esc]["z95_naive"]) for i in items)


# --- Convergencia -------------------------------------------------------------------------------


def test_series_start_at_first_sale_block():
    items = {i["item_id"]: i for i in load("items.json")["items"]}
    for item_id, item in items.items():
        rows = json.loads((DATA / "series" / f"{item_id}.json").read_text())["rows"]
        first = min(r["block"] for r in rows if r["units_completed"] is not None)
        assert item["first_block"] == first
        for r in rows:
            if r["block"] < first:
                assert r["units_observed"] is None and r["money_observed"] is None, (item_id, r["block"])


def test_meta_period():
    p = load("meta.json")["period"]
    assert p == {"start": "2011-06-27", "end": "2016-05-22"}
