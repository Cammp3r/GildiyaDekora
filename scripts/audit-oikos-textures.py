import json
import re
import urllib.request
from html import unescape
from urllib.parse import urljoin


def iter_products(db):
    for section in db.get("sections", []):
        section_id = section.get("id", "")
        for product in section.get("products") or []:
            yield section_id, product
        for subcategory in section.get("subcategories") or []:
            for product in subcategory.get("products") or []:
                yield section_id, product


def clean_text(html):
    text = re.sub(r"<[^>]+>", " ", html)
    return " ".join(unescape(text).split())


def extract_site_textures(product_url, html):
    block_match = re.search(
        r"ТЕКСТУРА(.*?)(?:КОЛЬОРОВА ГАМА|[*]\s+«Текстури|$)",
        html,
        re.S | re.I,
    )
    if not block_match:
        return []

    block = block_match.group(1)
    textures = []

    for link_match in re.finditer(r"<a\b[^>]*>(.*?)</a>", block, re.S | re.I):
        link_html = link_match.group(0)
        inner_html = link_match.group(1)

        image_url = ""
        image_match = re.search(
            r"background-image\s*:\s*url\(([^)]+)\)",
            link_html,
            re.I,
        )
        if image_match:
            image_url = image_match.group(1).strip("\"' ")

        name = clean_text(inner_html)
        if not image_url or not name or re.match(r"^[A-ZА-ЯІЇЄҐ]{1,4}\s*\d+", name):
            continue

        textures.append(
            {
                "name": name,
                "url": urljoin(product_url, image_url) if image_url else "",
            }
        )

    return textures


def normalize_name(name):
    return " ".join(str(name or "").strip().lower().split())


with open("dtb.json", encoding="utf-8") as db_file:
    db = json.load(db_file)

products = [(section_id, product) for section_id, product in iter_products(db) if product.get("url")]
headers = {"User-Agent": "Mozilla/5.0"}

found = []
missing = []
different = []
errors = []

for index, (section_id, product) in enumerate(products, 1):
    request = urllib.request.Request(product["url"], headers=headers)

    html = ""
    last_error = ""
    for _ in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                html = response.read().decode("utf-8", "replace")
            break
        except Exception as exc:
            last_error = str(exc)

    if not html:
        errors.append({"name": product.get("name"), "url": product.get("url"), "error": last_error})
        continue

    site_textures = extract_site_textures(product["url"], html)
    local_textures = product.get("textures") or []

    if not site_textures:
        continue

    found.append(
        {
            "name": product.get("name"),
            "url": product.get("url"),
            "section": section_id,
            "site": site_textures,
            "local": local_textures,
        }
    )

    site_names = {normalize_name(texture.get("name")) for texture in site_textures}
    local_names = {normalize_name(texture.get("name")) for texture in local_textures}

    if not local_textures:
        missing.append(product.get("name"))
    elif site_names != local_names:
        different.append(
            {
                "name": product.get("name"),
                "site": sorted(site_names),
                "local": sorted(local_names),
            }
        )

    print(f"[{index}/{len(products)}] {product.get('name')}: {len(site_textures)} textures")

report = {
    "checkedProducts": len(products),
    "productsWithSiteTextures": len(found),
    "missingLocalTextures": missing,
    "differentTextureNameSets": different,
    "errors": errors,
    "found": found,
}

with open("texture_audit.json", "w", encoding="utf-8") as report_file:
    json.dump(report, report_file, ensure_ascii=False, indent=2)

print("")
print(f"Checked products: {len(products)}")
print(f"Products with site textures: {len(found)}")
print(f"Missing local textures: {len(missing)}")
print(f"Different texture name sets: {len(different)}")
print(f"Fetch errors: {len(errors)}")
print("Saved texture_audit.json")
