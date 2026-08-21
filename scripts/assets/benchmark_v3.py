from __future__ import annotations

import io
import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "config/www/bruno-ui/assets/V3"
OUT = ROOT / "docs/_tmp/v3-audit"
OUT.mkdir(parents=True, exist_ok=True)

SIZES = (448, 512)
QUALITIES = (76, 80, 82, 84, 86)
BACKGROUNDS = ((18, 18, 18, 255), (128, 128, 128, 255), (245, 245, 245, 255))

files = sorted(SRC.glob("*.png"), key=lambda p: p.name.lower())
if not files:
    raise SystemExit(f"Nenhum PNG encontrado em {SRC}")


def mae_rgb(a: Image.Image, b: Image.Image) -> float:
    diff = ImageChops.difference(a.convert("RGB"), b.convert("RGB"))
    return sum(ImageStat.Stat(diff).mean) / 3


def psnr_from_mae(mae: float) -> float:
    # Proxy conservador: MAE em vez de MSE. Serve para comparar candidatos de
    # forma monotona sem NumPy; nao e usado como criterio absoluto de fidelidade.
    return 99.0 if mae == 0 else 20 * math.log10(255 / mae)


results: dict[str, object] = {
    "source_total_bytes": sum(p.stat().st_size for p in files),
    "source_count": len(files),
    "candidates": [],
}

for size in SIZES:
    for quality in QUALITIES:
        total = 0
        maes: list[float] = []
        alpha_maes: list[float] = []
        per_file: list[dict[str, object]] = []

        for path in files:
            with Image.open(path) as src0:
                src = src0.convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)

            buf = io.BytesIO()
            src.save(buf, "WEBP", quality=quality, method=6, exact=False)
            payload = buf.getvalue()
            total += len(payload)

            decoded = Image.open(io.BytesIO(payload)).convert("RGBA")
            alpha_mae = ImageStat.Stat(
                ImageChops.difference(src.getchannel("A"), decoded.getchannel("A"))
            ).mean[0]
            alpha_maes.append(alpha_mae)

            bg_maes = []
            for rgba in BACKGROUNDS:
                bg = Image.new("RGBA", src.size, rgba)
                src_comp = Image.alpha_composite(bg, src)
                dec_comp = Image.alpha_composite(bg, decoded)
                bg_maes.append(mae_rgb(src_comp, dec_comp))
            file_mae = max(bg_maes)
            maes.append(file_mae)
            per_file.append({
                "name": path.name,
                "bytes": len(payload),
                "worst_composite_mae": round(file_mae, 4),
                "alpha_mae": round(alpha_mae, 4),
            })

        mean_mae = sum(maes) / len(maes)
        candidate = {
            "size": size,
            "quality": quality,
            "total_bytes": total,
            "avg_bytes": round(total / len(files), 1),
            "reduction_pct_vs_source": round(100 * (1 - total / results["source_total_bytes"]), 3),
            "decoded_rgba_mib_16_images": round((size * size * 4 * len(files)) / 1024 / 1024, 3),
            "mean_worst_composite_mae": round(mean_mae, 4),
            "max_worst_composite_mae": round(max(maes), 4),
            "proxy_psnr_db_from_mean_mae": round(psnr_from_mae(mean_mae), 2),
            "mean_alpha_mae": round(sum(alpha_maes) / len(alpha_maes), 4),
            "max_alpha_mae": round(max(alpha_maes), 4),
            "files": per_file,
        }
        results["candidates"].append(candidate)

(OUT / "compression-benchmark.json").write_text(
    json.dumps(results, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(json.dumps({
    "source_total_bytes": results["source_total_bytes"],
    "candidates": [
        {
            "size": c["size"],
            "quality": c["quality"],
            "total_bytes": c["total_bytes"],
            "reduction_pct": c["reduction_pct_vs_source"],
            "mae": c["mean_worst_composite_mae"],
        }
        for c in results["candidates"]
    ],
}, ensure_ascii=False))
