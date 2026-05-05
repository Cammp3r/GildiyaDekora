import json
from datetime import datetime

# Завантажуємо детальні дані
print("📂 Завантажую детальні дані...")
with open('orac_decor_detailed.json', 'r', encoding='utf-8') as f:
    detailed_data = json.load(f)

print(f"📊 Всього товарів: {len(detailed_data['products'])}")

# Словник простого перекладу ключових слів (для швидкості)
translation_simple = {
    'LED Карниз': 'LED Карниз',
    'Карниз': 'Карниз',
    'гибкий': 'гнучкий',
    'гладкий': 'гладкий',
    'Молдинг': 'Молдинг',
    'Плинтус': 'Плінтус',
    'Напольный': 'Підлоговий',
    'Освещение': 'Освітлення',
    'Скрытое': 'Приховане',
    'скрытого': 'прихованого',
    'орнаментом': 'орнаментом',
    'полиуретана': 'поліуретану',
    '3D панель': '3D панель',
    'Потолочная': 'Стельова',
    'розетка': 'розетка',
    'Полуколонна': 'Напівколона',
    'Угол': 'Кут',
    'Профиль': 'Профіль',
    'декоративные': 'декоративні',
    'элементы': 'елементи',
}

def simple_translate_name(text):
    """Простий переклад назви товара"""
    result = text
    for ru, uk in translation_simple.items():
        result = result.replace(ru, uk)
    return result

# Групуємо товари за категоріями
products_by_category = {}
for product in detailed_data['products']:
    cat = product.get('category', 'Інші')
    if cat not in products_by_category:
        products_by_category[cat] = []
    products_by_category[cat].append(product)

print(f"📦 Знайдено {len(products_by_category)} категорій")

# Будуємо структуру JSON як для фронтенду
sections = []
category_ids = {
    'Карнизы': 'orac-cornices',
    'Молдинги': 'orac-moldings',
    'Напольный плинтус': 'orac-baseboard',
    'Скрытое освещение': 'orac-lighting',
    'Декоративные элементы': 'orac-decorative',
}

for category_name in ['Карнизы', 'Молдинги', 'Напольный плинтус', 'Скрытое освещение', 'Декоративные элементы']:
    if category_name not in products_by_category:
        continue
    
    products = products_by_category[category_name]
    cat_id = category_ids.get(category_name, f'orac-{category_name.lower()}')
    
    # Трансформуємо товари
    transformed_products = []
    for i, p in enumerate(products):
        product_obj = {
            'id': f"{cat_id}-{i+1}",
            'name': p.get('name', ''),
            'name_uk': simple_translate_name(p.get('name', '')),
            'description': p.get('description', ''),
            'price': 0,
            'price_currency': 'UAH',
            'photos': p.get('photos', [])[:5],  # Максимум 5 фото
            'url': p.get('url', '')
        }
        transformed_products.append(product_obj)
    
    section = {
        'id': cat_id,
        'title': category_name,
        'title_uk': simple_translate_name(category_name),
        'description': f'Товари категорії {category_name} від ORAC DECOR',
        'description_uk': f'Товари категорії {simple_translate_name(category_name)} від ORAC DECOR',
        'url': 'https://oracdecor.com.ua',
        'products': transformed_products
    }
    sections.append(section)
    print(f"  ✓ {category_name}: {len(transformed_products)} товарів")

# Створюємо фіналь JSON
final_data = {
    'brand': 'ORAC DECOR',
    'brand_uk': 'ORAC DECOR',
    'dealer': 'Гільдія Декору',
    'country': 'Україна',
    'updated': datetime.now().strftime('%Y-%m-%d'),
    'base_url': 'https://oracdecor.com.ua',
    'total_products': sum(len(s['products']) for s in sections),
    'sections': sections
}

# Зберігаємо
output_file = 'orac_decor.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print(f"\n" + "="*80)
print(f"✅ Файл оновлено: {output_file}")
print(f"📊 Всього товарів: {final_data['total_products']}")
print(f"📅 Оновлено: {final_data['updated']}")

# Показуємо статистику фото
total_photos = 0
products_with_photos = 0
for section in sections:
    for product in section['products']:
        if product.get('photos'):
            products_with_photos += 1
            total_photos += len(product['photos'])

print(f"📸 Статистика фото:")
print(f"  ✓ Товарів з фото: {products_with_photos}/{final_data['total_products']}")
print(f"  ✓ Всього фото: {total_photos}")
print(f"  ✓ Середньо фото на товар: {total_photos/products_with_photos:.1f}")
