import json
import os
import sys

print("Starting merge process...")

try:
    # Прочитати обидва файли
    print("Reading dtb.json...")
    with open('dtb.json', 'r', encoding='utf-8') as f:
        dtb_data = json.load(f)
    
    print("Reading oikos_products_data.json...")
    with open('oikos_products_data.json', 'r', encoding='utf-8') as f:
        products_data = json.load(f)
except Exception as e:
    print(f"Error reading files: {e}")
    sys.exit(1)

# Створити словник для швидкого пошуку за назвою продукту
color_map = {}

# Заповнити карту для interior-paint
if 'interior-paint' in products_data:
    for product in products_data['interior-paint']:
        color_map[product['name'].lower()] = {
            'colors': product.get('color_samples', []),
            'photos': product.get('photos', [])
        }

# Заповнити карту для exterior-paint
if 'exterior-paint' in products_data:
    for product in products_data['exterior-paint']:
        color_map[product['name'].lower()] = {
            'colors': product.get('color_samples', []),
            'photos': product.get('photos', [])
        }

# Заповнити карту для novalis
if 'novalis' in products_data:
    for product in products_data['novalis']:
        color_map[product['name'].lower()] = {
            'colors': product.get('color_samples', []),
            'photos': product.get('photos', [])
        }

# Функція для збігу назв продуктів
def normalize_name(name):
    return name.lower().strip()

# Оновити dtb.json
for section in dtb_data:
    if 'products' in section:
        for product in section['products']:
            product_name = normalize_name(product['name'])
            
            # Шукаємо в color_map
            for key in color_map:
                if product_name == key or key in product_name or product_name in key:
                    # Додаємо кольори якщо їх нема
                    if not product.get('colors') or len(product.get('colors', [])) == 0:
                        if color_map[key]['colors']:
                            product['colors'] = color_map[key]['colors']
                    
                    # Додаємо фото якщо їх нема
                    if not product.get('photos') or len(product.get('photos', [])) == 0:
                        if color_map[key]['photos']:
                            product['photos'] = color_map[key]['photos']
                    break

# Збережи оновлену базу даних
with open('dtb_updated.json', 'w', encoding='utf-8') as f:
    json.dump(dtb_data, f, ensure_ascii=False, indent=2)

print("✓ Файл успішно оновлено: dtb_updated.json")

# Статистика
print("\n📊 Статистика оновлення:")
for section in dtb_data:
    section_name = section.get('title', section.get('id', 'Unknown'))
    products = section.get('products', [])
    with_colors = sum(1 for p in products if p.get('colors') and len(p.get('colors', [])) > 0)
    with_photos = sum(1 for p in products if p.get('photos') and len(p.get('photos', [])) > 0)
    print(f"\n{section_name}:")
    print(f"  - Всього продуктів: {len(products)}")
    print(f"  - З кольорами: {with_colors}")
    print(f"  - З фото: {with_photos}")
