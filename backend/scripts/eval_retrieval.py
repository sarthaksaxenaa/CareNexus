"""Measure retrieval quality on the labelled set in tests/data/retrieval_eval.json.

    cd backend && python -m scripts.eval_retrieval [--misses | --json]

Reports top-1 and top-3 accuracy: the share of queries whose first result
(or any of the first three) is an acceptable condition.
"""

import json
import sys
from pathlib import Path

from app.rag.retriever import retrieve

DATA = Path(__file__).resolve().parents[1] / "tests" / "data"
EVAL_FILE = DATA / "retrieval_eval.json"
HELDOUT_FILE = DATA / "retrieval_heldout.json"


def evaluate(top_k: int = 3, path: Path = EVAL_FILE) -> dict:
    cases = json.loads(path.read_text(encoding="utf-8"))["cases"]
    rows = []
    for case in cases:
        ids = [r.condition.id for r in retrieve(case["q"], top_k=top_k)]
        rows.append(
            {
                **case,
                "got": ids,
                "top1": bool(ids) and ids[0] in case["expect"],
                "top3": any(i in case["expect"] for i in ids[:3]),
            }
        )
    n = len(rows)
    return {
        "n": n,
        "top1": sum(r["top1"] for r in rows) / n,
        "top3": sum(r["top3"] for r in rows) / n,
        "rows": rows,
    }


if __name__ == "__main__":
    if "--json" in sys.argv:
        # Machine-readable summary (used to build the README stats card).
        summary = {}
        for key, path in (("labelled", EVAL_FILE), ("heldout", HELDOUT_FILE)):
            r = evaluate(path=path)
            summary[key] = {"n": r["n"], "top1": r["top1"], "top3": r["top3"]}
        print(json.dumps(summary))
        sys.exit(0)
    for name, path in (("labelled set", EVAL_FILE), ("held-out set", HELDOUT_FILE)):
        result = evaluate(path=path)
        print(
            f"{name}: {result['n']} queries, "
            f"top-1 {result['top1']:.1%}, top-3 {result['top3']:.1%}"
        )
        if path is HELDOUT_FILE or "--misses" not in sys.argv:
            continue
        for r in result["rows"]:
            if not r["top1"]:
                print(
                    f"    MISS {r['q'][:60]!r:64} expected {r['expect'][0]:26} got {r['got'][:2]}"
                )
