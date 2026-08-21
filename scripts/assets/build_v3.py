from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "config/www/bruno-ui/assets/V3"
DEST = ROOT / "config/www/bruno-ui/assets/v3"
REPORT_DIR = ROOT / "docs/_tmp/v3-build"
DEST.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)

CANVAS = 512
TARGET_VISUAL_WIDTH = 460
TARGET_CENTER_X = 256
TARGET_VISUAL_BOTTOM = 485
ALPHA_THRESHOLD = 8
WEBP_QUALITY = 82
WEBP_METHOD = 6

# A V3 chegou com nomes de exportacao. O mapeamento abaixo foi confirmado pela
# folha de contato e pelo pareamento de mascara ON/OFF da auditoria automatica.
SOURCES = {
    "lavabo": {
        "on": "ChatGPT Image 21 de ago. de 2026, 09_22_11 (1).png",
        "off": "ChatGPT Image 21 de ago. de 2026, 09_22_28 (2).png",
    },
    "corredor": {
        "on": "ChatGPT Image 21 de ago. de 2026, 09_22_11 (2).png",
        "off": "ChatGPT Image 21 de ago. de 2026, 09_22_28 (3).png",
    },
    "cozinha": {
        "on": "ChatGPT Image 21 de ago. de 2026, 09_22_11 (3).png",
        "off": "ChatGPT Image 21 de ago. de 2026, 09_22_28 (4).png",
    },
    "office": {
        "on": "ChatGPT Image 21 de ago. de 2026, 09_22_11 (4).png",
        "off": "ChatGPT Image 21 de ago. de 2026, 09_22_28 (5).png",
    },
    "casal": {
        "on": "ChatGPT Image 21 de ago. de 2026, 09_22_11 (5).png",
        "off": "ChatGPT Image 21 de ago. de 2026, 09_22_29 (6).png",
    },
    "miguel": {
        "on": "ChatGPT Image 21 de ago. de 2026, 09_22_12 (6).png",
        "off": "ChatGPT Image 21 de ago. de 2026, 09_22_29 (7).png",
    },
    "marina": {
        "on": "ChatGPT Image 21 de ago. de 2026, 09_22_12 (7).png",
        "off": "ChatGPT Image 21 de ago. de 2026, 09_22_29 (8).png",
    },
    "sala": {
        "on": "ChatGPT Image 21 de ago. de 2026, 09_22_38.png",
        "off": "ChatGPT Image 21 de ago. de 2026, 09_22_27 (1).png",
    },
}


def mask_for(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    return alpha.point(lambda p: 255 if p >= ALPHA_THRESHOLD else 0, mode="L")


def union_bbox(a: Image.Image, b: Image.Image) -> tuple[int, int, int, int]:
    union = ImageChops.lighter(mask_for(a), mask_for(b))
    bbox = union.getbbox()
    if not bbox:
        raise ValueError("Par sem conteudo visivel")
    return bbox


def normalized(image: Image.Image, bbox: tuple[int, int, int, int]) -> tuple[Image.Image, dict[str, float | int]]:
    left, _top, right, bottom = bbox
    visual_width = right - left
    scale = TARGET_VISUAL_WIDTH / visual_width
    resized_w = round(image.width * scale)
    resized_h = round(image.height * scale)
    resized = image.resize((resized_w, resized_h), Image.Resampling.LANCZOS)

    center_x = (left + right) / 2
    offset_x = round(TARGET_CENTER_X - center_x * scale)
    offset_y = round(TARGET_VISUAL_BOTTOM - bottom * scale)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.alpha_composite(resized, (offset_x, offset_y))
    return canvas, {
        "scale": round(scale, 8),
        "resized_width": resized_w,
        "resized_height": resized_h,
        "offset_x": offset_x,
        "offset_y": offset_y,
    }


expected = {name for pair in SOURCES.values() for name in pair.values()}
actual = {p.name for p in SRC.glob("*.png")}
if expected != actual:
    missing = sorted(expected - actual)
    extra = sorted(actual - expected)
    raise SystemExit(f"Conjunto V3 inesperado. Ausentes={missing}; extras={extra}")

report: dict[str, object] = {
    "canvas": CANVAS,
    "target_visual_width": TARGET_VISUAL_WIDTH,
    "target_center_x": TARGET_CENTER_X,
    "target_visual_bottom": TARGET_VISUAL_BOTTOM,
    "alpha_threshold": ALPHA_THRESHOLD,
    "webp_quality": WEBP_QUALITY,
    "rooms": {},
}

thumbs: list[tuple[str, str, Image.Image]] = []
source_total = 0
optimized_total = 0

for room, states in SOURCES.items():
    with Image.open(SRC / states["on"]) as src_on0, Image.open(SRC / states["off"]) as src_off0:
        src_on = src_on0.convert("RGBA")
        src_off = src_off0.convert("RGBA")
        source_total += (SRC / states["on"]).stat().st_size + (SRC / states["off"]).stat().st_size
        if src_on.size != src_off.size:
            raise ValueError(f"{room}: ON/OFF com canvases diferentes")
        bbox = union_bbox(src_on, src_off)
        on_norm, transform = normalized(src_on, bbox)
        off_norm, transform_off = normalized(src_off, bbox)
        if transform != transform_off:
            raise AssertionError(f"{room}: transformacao divergente entre estados")

        room_report: dict[str, object] = {
            "source_on": states["on"],
            "source_off": states["off"],
            "source_pair_bbox_alpha8": list(bbox),
            "transform": transform,
            "outputs": {},
        }

        for state, image in (("on", on_norm), ("off", off_norm)):
            out_name = f"{room}-{state}.webp"
            out_path = DEST / out_name
            image.save(out_path, "WEBP", quality=WEBP_QUALITY, method=WEBP_METHOD, exact=False)
            size = out_path.stat().st_size
            optimized_total += size
            out_bbox = mask_for(Image.open(out_path).convert("RGBA")).getbbox()
            room_report["outputs"][state] = {
                "file": out_name,
                "bytes": size,
                "bbox_alpha8": list(out_bbox) if out_bbox else None,
            }
            thumbs.append((room, state, Image.open(out_path).convert("RGBA")))

        report["rooms"][room] = room_report

report["source_total_bytes"] = source_total
report["optimized_total_bytes"] = optimized_total
report["reduction_pct"] = round(100 * (1 - optimized_total / source_total), 3)
report["decoded_rgba_mib_16_images"] = round((CANVAS * CANVAS * 4 * 16) / 1024 / 1024, 3)

manifest = {
    "version": "20260821-v3-webp-1",
    "format": "webp",
    "canvas": CANVAS,
    "quality": WEBP_QUALITY,
    "assets": {
        room: {state: f"v3/{room}-{state}.webp" for state in ("off", "on")}
        for room in SOURCES
    },
}
(DEST / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(REPORT_DIR / "build-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# Folha visual dos outputs normalizados, para detectar clipping ou mudanca de escala.
tile = 220
sheet = Image.new("RGB", (4 * tile, 4 * tile), (235, 235, 235))
font = ImageFont.load_default()
for idx, (room, state, image) in enumerate(thumbs):
    checker = Image.new("RGB", (tile, tile), (228, 228, 228))
    d = ImageDraw.Draw(checker)
    cell = 14
    for yy in range(0, tile, cell):
        for xx in range(0, tile, cell):
            if ((xx // cell) + (yy // cell)) % 2:
                d.rectangle((xx, yy, xx + cell - 1, yy + cell - 1), fill=(198, 198, 198))
    preview = image.copy()
    preview.thumbnail((tile - 8, tile - 8), Image.Resampling.LANCZOS)
    x = (tile - preview.width) // 2
    y = (tile - preview.height) // 2
    checker.paste(preview, (x, y), preview)
    d = ImageDraw.Draw(checker)
    label = f"{room} {state}"
    d.rounded_rectangle((5, 5, 5 + max(74, len(label) * 7), 28), radius=5, fill=(0, 0, 0))
    d.text((10, 9), label, fill=(255, 255, 255), font=font)
    sheet.paste(checker, ((idx % 4) * tile, (idx // 4) * tile))

sheet.save(REPORT_DIR / "contact-sheet.webp", "WEBP", quality=70, method=6)
print(json.dumps({
    "source_total_bytes": source_total,
    "optimized_total_bytes": optimized_total,
    "reduction_pct": report["reduction_pct"],
}, ensure_ascii=False))
