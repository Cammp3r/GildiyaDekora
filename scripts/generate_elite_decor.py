"""Build the Elite Decor catalog from the supplied PDF catalogs and XLSX price list."""

import json
import math
import re
from pathlib import Path

import pymupdf
from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parent.parent
PRICE_BOOK = ROOT / "Прайс_лист_Элит_Декор_20260907_NEW.xlsx"
OUTPUT_JSON = ROOT / "elite_decor.json"
IMAGE_DIR = ROOT / "public" / "products" / "elite-decor"
CATALOGS = [
    ROOT / "gaudi_decor_2026-8338711.pdf",
    ROOT / "grand_decor_hdps_3-09-2026-17459563.pdf",
]

CODE_RE = re.compile(r"\b[A-ZА-ЯІЇЄҐ]{1,4}\s*\d{2,5}(?:[A-ZА-ЯІЇЄҐ])?(?:[-/]\d+)?\b", re.I)
LENGTH_RE = re.compile(r"\bL\s*=\s*(\d+(?:[.,]\d+)?)\s*(?:mm|мм|м|m)\b", re.I)
LINEAR_DIMENSION_RE = re.compile(
    r"\d+(?:[.,]\d+)?\s*[xх×]\s*\d+(?:[.,]\d+)?(?:\s*[xх×]\s*\d+(?:[.,]\d+)?)?\s*(?:mm|мм)",
    re.I,
)
ROUND_DIMENSION_RE = re.compile(
    r"\d+(?:[.,]\d+)?\s*мм\s*\|\s*H\s*:\s*\d+(?:[.,]\d+)?\s*мм",
    re.I,
)
# Points: how far (Euclidean, on-page pt) a code label may be from the photo /
# dimension text it belongs to before we consider it "not nearby" and refuse
# the match rather than risk grabbing a neighbouring product's content.
MAX_IMAGE_DISTANCE = 190
MAX_DIMENSION_DISTANCE = 130
VALID_CATEGORIES = {
    "1 Карниз",
    "1 Молдинг",
    "1 Молдинг серія H",
    "1 Карниз серія H",
}
SECTION_RULES = (
    ("Молдинги", "Молдинги"),
    ("Карнизи для LED-освітлення", "Карнизи для LED-освітлення"),
    ("Карнизи з орнаментом", "Карнизи з орнаментом"),
    ("Гладкі карнизи", "Гладкі карнизи"),
    ("Молдинги з орнаментом", "Молдинги з орнаментом"),
    ("Гладкі молдинги", "Гладкі молдинги"),
    ("Кутові елементи", "Кутові елементи"),
    ("Плінтуси", "Плінтуси"),
    ("Розетки", "Розетки"),
    ("Дуги", "Дуги"),
    ("Стельові плити", "Стельові плити"),
    ("Стельові куполи", "Стельові куполи"),
    ("Обрамлення дверей", "Обрамлення дверей"),
    ("Пілястри", "Пілястри"),
    ("Колони", "Колони"),
    ("Консолі", "Консолі"),
    ("Орнаменти", "Орнаменти"),
    ("Ніші", "Ніші"),
    ("3D Панелі", "3D Панелі"),
)


def compact_code(value):
    value = re.sub(r"\s+", "", str(value or "")).upper()
    return value.translate(str.maketrans({"С": "C", "А": "A", "В": "B", "М": "M", "Х": "X"}))


def slug(value):
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "product"


def codes_in(value):
    """Real article codes, excluding the 'x'/'х' multiplication sign in a
    dimension string like '78 x 13 mm' — CODE_RE happily reads that lone
    'x' as a one-letter prefix in front of the '13', minting a fake code
    that then competes with real ones for the nearest photo."""
    matches = []
    for match in CODE_RE.finditer(str(value or "")):
        letters = re.match(r"[A-ZА-ЯІЇЄҐ]+", match.group(0), re.I).group(0)
        if letters.strip().lower() in ("x", "х"):
            continue
        matches.append(compact_code(match.group(0)))
    return matches


def page_length_mm(text):
    """Page-wide 'L = 2000/2800 mm' footer note, used as a fallback length."""
    match = LENGTH_RE.search(" ".join(text.split()))
    return float(match.group(1).replace(",", ".")) if match else None


def clean_name(name):
    return re.sub(r"\s*\(\s*\d+(?:[.,]\d+)?\s*м\s*\)", "", str(name or ""), flags=re.I).strip()


def product_characteristics(name, raw_dimensions, length_mm):
    """Parse width/height/depth (or diameter/height for round elements) straight
    out of this product's own matched dimension-label text, rather than a
    page-wide code->dimensions map — that map can't tell two same-row
    products' numbers apart on a dense grid layout."""
    characteristics = {"material": "Поліуретан"}
    round_match = ROUND_DIMENSION_RE.search(raw_dimensions or "")

    if round_match:
        # Round elements (rosettes, domes) aren't sold by the running metre,
        # so the page's "L = 2000/2800 mm" footer note doesn't apply to them.
        nums = [float(n.replace(",", ".")) for n in re.findall(r"\d+(?:[.,]\d+)?", round_match.group(0))]
        if len(nums) >= 1:
            characteristics["diameter"] = f"{nums[0]:g} мм"
        if len(nums) >= 2:
            characteristics["height"] = f"{nums[1]:g} мм"
    else:
        name_length = re.search(r"\((\d+(?:[.,]\d+)?)\s*м\)", name, re.I)
        length = length_mm or (float(name_length.group(1).replace(",", ".")) * 1000 if name_length else None)
        if length:
            characteristics["length"] = f"{round(length):g} мм"

        linear_match = LINEAR_DIMENSION_RE.search(raw_dimensions or "")
        if linear_match:
            nums = [float(n.replace(",", ".")) for n in re.findall(r"\d+(?:[.,]\d+)?", linear_match.group(0))]
            if len(nums) >= 1:
                characteristics["width"] = f"{nums[0]:g} мм"
            if len(nums) >= 2:
                characteristics["height"] = f"{nums[1]:g} мм"
            if len(nums) >= 3:
                characteristics["depth"] = f"{nums[2]:g} мм"

    if raw_dimensions:
        characteristics["dimensions"] = raw_dimensions
    return characteristics


def price_rows(sheet_name):
    sheet = load_workbook(PRICE_BOOK, data_only=True, read_only=True)[sheet_name]
    rows = []
    category = ""

    for row in sheet.iter_rows(values_only=True):
        values = [str(value).strip() if value is not None else "" for value in row]
        text = " ".join(value for value in values if value)
        title_value = values[4] if len(values) > 4 else text
        row_codes = codes_in(title_value)
        prices = [value for value in row if isinstance(value, (int, float)) and value > 0]

        if not prices or not row_codes:
            if text and not any(marker in text.lower() for marker in ("каталог", "найменування", "артикул", "еліт декор")) and len(text) < 80:
                category = text
            continue

        name = title_value if row_codes else text
        rows.append({
            "codes": row_codes,
            "title": clean_name(name),
            "variant": re.search(r"\((\d+(?:[.,]\d+)?)\s*м\)", name, re.I).group(1).replace(",", ".") + " м" if re.search(r"\((\d+(?:[.,]\d+)?)\s*м\)", name, re.I) else "",
            "price": round(float(prices[-1])),
            "category": category if category in VALID_CATEGORIES else "1 Молдинг",
        })

    return rows


def section_for_position(page, rect, previous_section):
    """Section header nearest above this code's line. Some pages print two
    section headers side by side (one per column, e.g. '3D Панелі' over the
    left column and 'Плінтуси' over the right) — picking purely by 'closest
    above' would treat both as equally close, so ties within one text row
    are broken by horizontal distance to the code."""
    candidates = []
    for text, line_rect in iter_lines(page):
        for marker, title in SECTION_RULES:
            if marker.lower() in text.lower():
                candidates.append((line_rect, title))
    above = [c for c in candidates if c[0].y0 <= rect.y0 + 4]
    if not above:
        return previous_section
    return min(above, key=lambda c: (round((rect.y0 - c[0].y0) / 40), abs(rect.x0 - c[0].x0)))[1]


def iter_lines(page):
    """Text at line granularity. Pluymupdf's coarser 'blocks' mode occasionally
    merges unrelated same-row text from two different products (observed:
    a code label glued to a neighbouring product's dimension text purely
    because they sit on the same y-coordinate far apart on a wide page) —
    lines don't have that failure mode."""
    lines = []
    for block in page.get_text("dict").get("blocks", []):
        for line in block.get("lines", []):
            text = "".join(span.get("text", "") for span in line.get("spans", []))
            text = " ".join(text.split())
            if text:
                lines.append((text, pymupdf.Rect(line["bbox"])))
    return lines


def rect_center(rect):
    return ((rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2)


def rect_distance(a, b):
    ax, ay = rect_center(a)
    bx, by = rect_center(b)
    return math.hypot(ax - bx, ay - by)


def clamp_to_neighbors(crop, anchor_rect, other_rects):
    """Stop a crop before it reaches halfway to any other product's own
    label on the page, in whichever direction that neighbour lies. This is
    what keeps a tight per-product crop from bleeding into the next item's
    photo/dimensions on a dense grid page.

    Only the dominant axis (the one the neighbour is actually offset along)
    gets clamped for a given neighbour — a catalog is a grid, so a neighbour
    three rows below in the very same column has an x-centre a fraction of a
    point away from the anchor's; clamping x on that pair too would collapse
    the crop to nothing despite the two products not being anywhere near
    each other visually."""
    ax, ay = rect_center(anchor_rect)
    for other in other_rects:
        if other is anchor_rect:
            continue
        ox, oy = rect_center(other)
        dx, dy = ox - ax, oy - ay
        if dx == 0 and dy == 0:
            continue
        if abs(dx) >= abs(dy):
            if dx > 0:
                crop.x1 = min(crop.x1, ax + dx / 2)
            else:
                crop.x0 = max(crop.x0, ax + dx / 2)
        else:
            if dy > 0:
                crop.y1 = min(crop.y1, ay + dy / 2)
            else:
                crop.y0 = max(crop.y0, ay + dy / 2)
    return crop


def extract_pdf_assets(pdf_path, include_photos=True):
    """Match each product code on the page to its own photo and dimension
    label, then save a photo (and a tight combined crop for the dimension
    scheme) for it.

    Two-pass per page: collect every code-line and every dimension-line with
    its position, then greedily pair nearest-first so two codes can't both
    claim the same photo/dimension. A candidate farther than a plausible
    label-to-photo offset is rejected outright — no match beats a wrong one.

    Some catalog pages (mostly round elements: rosettes, domes) have no
    individually embedded photo at all — the whole page is one flattened
    background image with a text layer on top. For those we fall back to
    rendering a crop straight off the page background around the code's own
    label + dimension text, still clamped against neighbouring products.
    """
    document = pymupdf.open(pdf_path)
    assets_by_code = {}
    image_index = 0
    previous_section = "Інші декоративні елементи"

    for page_number, page in enumerate(document, 1):
        lines = iter_lines(page)
        current_page_length = page_length_mm(page.get_text())
        image_rects = []
        for image in page.get_images(full=True):
            for rectangle in page.get_image_rects(image):
                width, height = rectangle.width, rectangle.height
                if width < 55 or height < 35 or (width > 500 and height > 500):
                    continue
                image_rects.append(rectangle)

        dimension_lines = [
            (text, rect) for text, rect in lines
            if LINEAR_DIMENSION_RE.search(text) or ROUND_DIMENSION_RE.search(text)
        ]

        code_candidates = []
        for text, rect in lines:
            for code in codes_in(text):
                code_candidates.append((compact_code(code), rect))
        code_candidates.sort(key=lambda item: item[1].y0)
        all_code_rects = [rect for _, rect in code_candidates]

        # Match by unique *line*, not by code: "C 1012 • C 1012F" is one
        # line carrying two codes for the same photo (a flex variant of the
        # same profile) — treating each code as its own consumer let the
        # second one, unable to reuse an image its line-mate already
        # "claimed", go grab a neighbouring product's photo instead.
        unique_rects = list({id(rect): rect for _, rect in code_candidates}.values())

        # Global nearest-first matching: rank every plausible (line, image)
        # and (line, dimension) pair by distance and assign shortest-first,
        # each side used at most once. Assigning per-line in page order (the
        # earlier approach) let a line merely processed first grab a distant
        # image out from under another line sitting right next to it — this
        # is the same kind of greedy matching used for stable pairings and
        # doesn't have that failure mode.
        image_pairs = []
        for ri, rect in enumerate(unique_rects):
            for ii, image_rect in enumerate(image_rects):
                distance = rect_distance(rect, image_rect)
                if distance <= MAX_IMAGE_DISTANCE:
                    image_pairs.append((distance, ri, ii))
        image_pairs.sort(key=lambda item: item[0])
        rect_to_image, claimed_images = {}, set()
        for _distance, ri, ii in image_pairs:
            if ri in rect_to_image or ii in claimed_images:
                continue
            rect_to_image[ri] = ii
            claimed_images.add(ii)

        dimension_pairs = []
        for ri, rect in enumerate(unique_rects):
            for di, (_text, dim_rect) in enumerate(dimension_lines):
                distance = rect_distance(rect, dim_rect)
                if distance <= MAX_DIMENSION_DISTANCE:
                    dimension_pairs.append((distance, ri, di))
        dimension_pairs.sort(key=lambda item: item[0])
        rect_to_dimension, claimed_dimensions = {}, set()
        for _distance, ri, di in dimension_pairs:
            if ri in rect_to_dimension or di in claimed_dimensions:
                continue
            rect_to_dimension[ri] = di
            claimed_dimensions.add(di)

        rect_index = {id(rect): ri for ri, rect in enumerate(unique_rects)}

        for code, rect in code_candidates:
            previous_section = section_for_position(page, rect, previous_section)
            ri = rect_index[id(rect)]

            image_rect = None
            if ri in rect_to_image:
                image_rect = image_rects[rect_to_image[ri]]

            raw_dimensions, dim_rect = "", None
            if ri in rect_to_dimension:
                raw_dimensions, dim_rect = dimension_lines[rect_to_dimension[ri]]

            if image_rect is None and dim_rect is None:
                continue

            photo_url = None
            technical_url = None

            if image_rect is not None and include_photos:
                image_index += 1
                file_name = f"{slug(pdf_path.stem)}-{page_number:02d}-{image_index:03d}.png"
                page.get_pixmap(clip=image_rect, matrix=pymupdf.Matrix(12, 12), alpha=False).save(IMAGE_DIR / file_name)
                photo_url = f"/products/elite-decor/{file_name}"

            # Technical/scheme crop: tightly wrap whatever we matched for this
            # code (label + dimension + photo, whichever exist) and clamp so
            # it can never reach a neighbouring product's own cluster.
            pieces = [rect] + ([image_rect] if image_rect is not None else []) + ([dim_rect] if dim_rect is not None else [])
            crop = pymupdf.Rect(
                min(p.x0 for p in pieces) - 12,
                min(p.y0 for p in pieces) - 12,
                max(p.x1 for p in pieces) + 12,
                max(p.y1 for p in pieces) + 12,
            )
            crop = clamp_to_neighbors(crop, rect, all_code_rects)
            crop &= page.rect
            if include_photos and crop.width > 5 and crop.height > 5:
                image_index += 1
                technical_name = f"{slug(pdf_path.stem)}-{page_number:02d}-{image_index:03d}-scheme.png"
                page.get_pixmap(clip=crop, matrix=pymupdf.Matrix(4, 4), alpha=False).save(IMAGE_DIR / technical_name)
                technical_url = f"/products/elite-decor/{technical_name}"

            # No individually embedded photo nearby means the page is one
            # flattened background image with a text layer on top (seen on
            # round-element pages — rosettes, domes, where the whole spread
            # is one picture rather than one image per item). Guessing a crop
            # off that background was tried two different ways (a fixed
            # offset from the label, and a box clamped to the nearest other
            # labels) — both produced wrong-or-empty photos often enough
            # (grid edges with no neighbour to clamp against, layouts where
            # the photo isn't where the guess assumes) to be exactly the
            # "extra, badly cropped photo" problem this rework exists to fix.
            # These products stay photo-less rather than risk that; they'll
            # get picked up automatically once they have a real individual
            # photo to match.

            item = assets_by_code.setdefault(
                code,
                {"photos": [], "technical_photos": [], "section": previous_section, "raw_dimensions": "", "length_mm": None},
            )
            if photo_url and photo_url not in item["photos"]:
                item["photos"].append(photo_url)
            if technical_url and technical_url not in item["technical_photos"]:
                item["technical_photos"].append(technical_url)
            if raw_dimensions and not item["raw_dimensions"]:
                item["raw_dimensions"] = raw_dimensions
            if not item["section"]:
                item["section"] = previous_section
            if item["length_mm"] is None:
                item["length_mm"] = current_page_length

    document.close()
    return assets_by_code


def main():
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    for old_image in IMAGE_DIR.glob("*.png"):
        old_image.unlink()

    assets = {}
    for pdf_path in CATALOGS:
        for code, item in extract_pdf_assets(pdf_path).items():
            assets.setdefault(code, item)

    products = []
    seen = set()
    for sheet_name, collection in (("Gaudi Decor", "Gaudi Decor"), ("Grand Decor_NEW!!!", "Grand Decor")):
        for row in price_rows(sheet_name):
            matched_codes = [compact_code(code) for code in row["codes"] if compact_code(code) in assets]
            code = matched_codes[0] if matched_codes else compact_code(row["codes"][0])
            asset = assets.get(
                code,
                {"photos": [], "technical_photos": [], "section": row["category"], "raw_dimensions": "", "length_mm": None},
            )
            if not asset["photos"]:
                continue
            source_note = "" if code in assets else "Фото та схема відсутні у наданих PDF-каталогах."
            key = (collection, code, row["title"])
            existing = next((product for product in products if (product["collection"], product["article"], product["name"]) == key), None)
            if existing:
                existing.setdefault("price_variants", [{"volume": existing.pop("variant", ""), "price": existing["price"]}])
                existing["price_variants"].append({"volume": row["variant"], "price": row["price"]})
                continue
            product_id = f"elite-{slug(collection)}-{slug(code)}-{len(products) + 1}"
            products.append({
                "id": product_id,
                "article": code,
                "name": row["title"],
                "collection": collection,
                "category": asset["section"] or row["category"],
                "price": row["price"],
                "variant": row["variant"],
                "price_currency": "UAH",
                "photos": list(dict.fromkeys(asset["photos"])),
                "technical_photos": list(dict.fromkeys(asset["technical_photos"])),
                "source_note": source_note,
                "characteristics": product_characteristics(
                    row["title"], asset["raw_dimensions"], asset["length_mm"]
                ),
                "description": (
                    f"{row['title']} — профіль Elite Decor з колекції {collection}. "
                    f"Розділ: {asset['section'] or row['category']}. "
                    "Виготовлений з поліуретану, підходить для фарбування та декоративного оформлення інтер’єру. "
                    f"{source_note}"
                ),
            })

    payload = {
        "brand": "elite-decor",
        "brand_name": "ELITE DECOR",
        "sections": [
            {"id": "gaudi-decor", "title_uk": "Gaudi Decor", "products": [p for p in products if p["collection"] == "Gaudi Decor"]},
            {"id": "grand-decor", "title_uk": "Grand Decor", "products": [p for p in products if p["collection"] == "Grand Decor"]},
        ],
    }
    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(products)} Elite Decor products")
    print(f"Images: {len(list(IMAGE_DIR.glob('*.png')))}")


if __name__ == "__main__":
    main()