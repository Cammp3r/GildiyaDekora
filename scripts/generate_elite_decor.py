"""Build the Elite Decor catalog from the supplied PDF catalogs and XLSX price list."""

import json
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

CODE_RE = re.compile(r"\b[A-Z]{1,4}\s*\d{2,5}(?:[A-Z])?(?:[-/]\d+)?\b", re.I)
CODE_RE = re.compile(r"\b[A-ZА-ЯІЇЄҐ]{1,4}\s*\d{2,5}(?:[A-ZА-ЯІЇЄҐ])?(?:[-/]\d+)?\b", re.I)
DIMENSIONS_RE = re.compile(
    r"\b(?P<code>[A-Z]{1,4}\s*\d{2,5}(?:[A-Z])?(?:[-/]\d+)?)\b"
    r"(?:\s*[•·]\s*[A-Z]{1,4}\s*\d{2,5}(?:[A-Z])?(?:[-/]\d+)?)?\s+"
    r"(?P<dimensions>\d+(?:[.,]\d+)?\s*x\s*\d+(?:[.,]\d+)?(?:\s*x\s*\d+(?:[.,]\d+)?)?)\s*[mм]{2}",
    re.I,
)
REVERSED_DIMENSIONS_RE = re.compile(
    r"(?P<dimensions>\d+(?:[.,]\d+)?\s*x\s*\d+(?:[.,]\d+)?(?:\s*x\s*\d+(?:[.,]\d+)?)?)\s*[mм]{2}\s+"
    r"\b(?P<code>[A-Z]{1,4}\s*\d{2,5}(?:[A-Z])?(?:[-/]\d+)?)\b",
    re.I,
)
LENGTH_RE = re.compile(r"\bL\s*=\s*(\d+(?:[.,]\d+)?)\s*(?:mm|мм|м|m)\b", re.I)
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
    return [compact_code(match.group(0)) for match in CODE_RE.finditer(str(value or ""))]


def dimensions_by_code(text):
    dimensions = {}
    normalized_text = " ".join(text.split())
    block_dimensions = re.findall(
        r"\d+(?:[.,]\d+)?\s*[xх×]\s*\d+(?:[.,]\d+)?(?:\s*[xх×]\s*\d+(?:[.,]\d+)?)?\s*(?:mm|мм)",
        normalized_text,
        re.I,
    )
    block_values = [re.sub(r"\s*(?:mm|мм)$", "", value, flags=re.I) for value in block_dimensions]
    block_values = [
        [float(number.replace(",", ".")) for number in re.split(r"\s*[xх×]\s*", value, flags=re.I)]
        for value in block_values
    ]
    block_codes = codes_in(normalized_text)
    if block_values and block_codes:
        for code in block_codes:
            dimensions[code] = block_values[0]
    for match in DIMENSIONS_RE.finditer(normalized_text):
        values = [
            float(value.replace(",", "."))
            for value in re.split(r"\s*x\s*", match.group("dimensions"), flags=re.I)
        ]
        dimensions[compact_code(match.group("code"))] = values
    for match in REVERSED_DIMENSIONS_RE.finditer(normalized_text):
        values = [
            float(value.replace(",", "."))
            for value in re.split(r"\s*x\s*", match.group("dimensions"), flags=re.I)
        ]
        dimensions[compact_code(match.group("code"))] = values
    length_match = LENGTH_RE.search(normalized_text)
    return dimensions, (float(length_match.group(1).replace(",", ".")) if length_match else None)


def clean_name(name):
    return re.sub(r"\s*\(\s*\d+(?:[.,]\d+)?\s*м\s*\)", "", str(name or ""), flags=re.I).strip()


def product_characteristics(name, dimensions, length_mm, raw_dimensions=""):
    characteristics = {"material": "Поліуретан"}
    name_length = re.search(r"\((\d+(?:[.,]\d+)?)\s*м\)", name, re.I)
    length = length_mm or (float(name_length.group(1).replace(",", ".")) * 1000 if name_length else None)
    if length:
        characteristics["length"] = f"{round(length):g} мм"
    if dimensions:
        characteristics["width"] = f"{dimensions[0]:g} мм"
        characteristics["height"] = f"{dimensions[1]:g} мм"
        if len(dimensions) > 2:
            characteristics["depth"] = f"{dimensions[2]:g} мм"
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


def section_for_block(page, block, previous_section):
    candidates = []
    for item in page.get_text("blocks"):
        text = " ".join(item[4].split())
        for marker, title in SECTION_RULES:
            if marker.lower() in text.lower():
                candidates.append((item[1], title))
    above = [candidate for candidate in candidates if candidate[0] <= block[1] + 4]
    return max(above, default=(0, previous_section), key=lambda item: item[0])[1]


def extract_pdf_assets(pdf_path, include_photos=True):
    """Extract product photos and page crops containing the nearby dimension scheme."""
    document = pymupdf.open(pdf_path)
    assets_by_code = {}
    image_index = 0
    previous_section = "Інші декоративні елементи"

    for page_number, page in enumerate(document, 1):
        blocks = page.get_text("blocks")
        image_rects = []
        for image in page.get_images(full=True):
            for rectangle in page.get_image_rects(image):
                width, height = rectangle.width, rectangle.height
                if width < 55 or height < 35 or (width > 500 and height > 500):
                    continue
                image_rects.append(rectangle)

        for block in blocks:
            text = " ".join(block[4].split())
            codes = codes_in(text)
            if not codes:
                continue
            previous_section = section_for_block(page, block, previous_section)
            nearest = min(
                image_rects,
                key=lambda rect: abs(rect.x0 - block[0]) + abs(rect.y0 - block[1]),
                default=None,
            )
            photo_url = None
            if nearest and include_photos:
                image_index += 1
                file_name = f"{slug(pdf_path.stem)}-{page_number:02d}-{image_index:03d}.png"
                output_path = IMAGE_DIR / file_name
                pixmap = page.get_pixmap(clip=nearest, matrix=pymupdf.Matrix(12, 12), alpha=False)
                pixmap.save(output_path)
                photo_url = f"/products/elite-decor/{file_name}"

            raw_dimensions = " ".join(re.findall(r"\d+(?:[.,]\d+)?\s*[xх×]\s*\d+(?:[.,]\d+)?(?:\s*[xх×]\s*\d+(?:[.,]\d+)?)?\s*(?:mm|мм)", text, re.I))
            if not raw_dimensions:
                continue
            if nearest:
                crop = pymupdf.Rect(
                    nearest.x0 - 45,
                    min(block[1], nearest.y0) - 25,
                    nearest.x1 + 45,
                    max(block[3], nearest.y1) + 25,
                )
            else:
                crop = pymupdf.Rect(block[0] - 60, block[1] - 40, block[2] + 60, block[3] + 40)
            crop &= page.rect
            image_index += 1
            technical_name = f"{slug(pdf_path.stem)}-{page_number:02d}-{image_index:03d}-scheme.png"
            technical_path = IMAGE_DIR / technical_name
            page.get_pixmap(clip=crop, matrix=pymupdf.Matrix(4, 4), alpha=False).save(technical_path)
            technical_url = f"/products/elite-decor/{technical_name}"
            for code in codes:
                item = assets_by_code.setdefault(compact_code(code), {"photos": [], "technical_photos": [], "section": previous_section, "raw_dimensions": raw_dimensions})
                if photo_url and photo_url not in item["photos"]:
                    item["photos"].append(photo_url)
                if technical_url not in item["technical_photos"]:
                    item["technical_photos"].append(technical_url)
                if not item["section"]:
                    item["section"] = previous_section

    document.close()
    return assets_by_code


def main():
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    for old_image in IMAGE_DIR.glob("*.png"):
        old_image.unlink()

    assets = {}
    dimensions = {}
    lengths = {}
    for pdf_path in CATALOGS:
        document = pymupdf.open(pdf_path)
        for page in document:
            page_dimensions, page_length = dimensions_by_code(page.get_text())
            for code, value in page_dimensions.items():
                dimensions.setdefault(code, value)
            for code in page_dimensions:
                lengths.setdefault(code, page_length)
        document.close()
        for code, item in extract_pdf_assets(pdf_path).items():
            assets.setdefault(code, item)

    products = []
    seen = set()
    for sheet_name, collection in (("Gaudi Decor", "Gaudi Decor"), ("Grand Decor_NEW!!!", "Grand Decor")):
        for row in price_rows(sheet_name):
            matched_codes = [compact_code(code) for code in row["codes"] if compact_code(code) in assets]
            code = matched_codes[0] if matched_codes else compact_code(row["codes"][0])
            asset = assets.get(code, {"photos": [], "technical_photos": [], "section": row["category"], "raw_dimensions": ""})
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
                    row["title"], dimensions.get(code), lengths.get(code), asset["raw_dimensions"]
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