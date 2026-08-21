from __future__ import annotations

import base64
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageStat

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "config/www/bruno-ui/assets/V3"
OUT = ROOT / "docs/_tmp/v3-audit"
OUT.mkdir(parents=True, exist_ok=True)

files = sorted(SRC.glob("*.png"), key=lambda p: p.name.lower())
if not files:
    raise SystemExit(f"Nenhum PNG encontrado em {SRC}")

records: list[dict[str, object]] = []
thumbs: list[tuple[int, Image.Image]] = []

for idx, path in enumerate(files, 1):
    with Image.open(path) as im0:
        im = im0.convert("RGBA")
        w, h = im.size
        alpha = im.getchannel("A")
        bbox = alpha.getbbox()
        extrema = alpha.getextrema()
        hist = alpha.histogram()
        transparent = hist[0]
        semitransparent = sum(hist[1:255])
        opaque = hist[255]
        pixels = w * h

        rgb = im.convert("RGB")
        stat = ImageStat.Stat(rgb)
        mean_rgb = [round(v, 2) for v in stat.mean]
        luminance = round(0.2126 * stat.mean[0] + 0.7152 * stat.mean[1] + 0.0722 * stat.mean[2], 2)

        record = {
            "index": idx,
            "name": path.name,
            "bytes": path.stat().st_size,
            "width": w,
            "height": h,
            "mode": im0.mode,
            "alpha_min": extrema[0],
            "alpha_max": extrema[1],
            "alpha_bbox": list(bbox) if bbox else None,
            "alpha_coverage_pct": round(100 * (pixels - transparent) / pixels, 3),
            "alpha_transparent_px": transparent,
            "alpha_semitransparent_px": semitransparent,
            "alpha_opaque_px": opaque,
            "mean_rgb": mean_rgb,
            "mean_luminance": luminance,
        }
        records.append(record)

        # Thumb em checkerboard para tornar transparência/bordas visíveis.
        tile = 220
        checker = Image.new("RGB", (tile, tile), (228, 228, 228))
        d = ImageDraw.Draw(checker)
        cell = 14
        for yy in range(0, tile, cell):
            for xx in range(0, tile, cell):
                if ((xx // cell) + (yy // cell)) % 2:
                    d.rectangle((xx, yy, xx + cell - 1, yy + cell - 1), fill=(198, 198, 198))

        preview = im.copy()
        preview.thumbnail((tile - 16, tile - 16), Image.Resampling.LANCZOS)
        x = (tile - preview.width) // 2
        y = (tile - preview.height) // 2
        checker.paste(preview, (x, y), preview)

        d = ImageDraw.Draw(checker)
        label = f"{idx:02d}"
        d.rounded_rectangle((6, 6, 42, 32), radius=6, fill=(0, 0, 0))
        d.text((12, 9), label, fill=(255, 255, 255), font=ImageFont.load_default())
        thumbs.append((idx, checker))

cols = 4
rows = math.ceil(len(thumbs) / cols)
tile = 220
sheet = Image.new("RGB", (cols * tile, rows * tile), (245, 245, 245))
for n, thumb in thumbs:
    pos = n - 1
    sheet.paste(thumb, ((pos % cols) * tile, (pos // cols) * tile))

sheet_path = OUT / "contact-sheet.webp"
sheet.save(sheet_path, "WEBP", quality=62, method=6)
(OUT / "contact-sheet.b64.txt").write_text(
    base64.b64encode(sheet_path.read_bytes()).decode("ascii"), encoding="utf-8"
)
(OUT / "index.tsv").write_text(
    "index\tfilename\n" + "\n".join(f"{r['index']:02d}\t{r['name']}" for r in records) + "\n",
    encoding="utf-8",
)
(OUT / "analysis.json").write_text(
    json.dumps({"count": len(records), "files": records}, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

print(json.dumps({"count": len(records), "contact_sheet_bytes": sheet_path.stat().st_size}, ensure_ascii=False))
