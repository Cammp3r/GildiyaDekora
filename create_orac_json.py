import json
from datetime import datetime

# Load the newly scraped products
with open('oracdecor_ua_products.json', 'r', encoding='utf-8') as f:
    scraped_data = json.load(f)

# Create the new orac_decor.json structure
products_by_category = {}
for product in scraped_data['products']:
    cat = product['category']
    if cat not in products_by_category:
        products_by_category[cat] = []
    products_by_category[cat].append(product)

# Build sections for the JSON
sections = []
for category_name, products in products_by_category.items():
    # Map category names to IDs
    category_map = {
        'Карнизы': 'orac-cornices',
        'Молдинги': 'orac-moldings',
        'Напольный плинтус': 'orac-baseboard',
        'Скрытое освещение': 'orac-lighting',
        'Декоративные элементы': 'orac-decorative'
    }
    
    cat_id = category_map.get(category_name, f'orac-{category_name.lower()}')
    
    section = {
        'id': cat_id,
        'title': category_name,
        'description': f'Товары категории {category_name} от ORAC DECOR',
        'url': f'https://oracdecor.com.ua/{category_name.lower()}',
        'products': [
            {
                'id': f"{cat_id}-{i+1}",
                'name': p['name'],
                'price': 0,  # Price is "Уточнить цену"
                'price_currency': 'UAH',
                'photos': [p['image']] if p['image'] else [],
                'url': p['url']
            }
            for i, p in enumerate(products)
        ]
    }
    sections.append(section)

# Create the complete structure
new_data = {
    'brand': 'ORAC DECOR',
    'dealer': 'Гільдія Декору',
    'country': 'Україна',
    'updated': datetime.now().strftime('%Y-%m-%d'),
    'base_url': 'https://oracdecor.com.ua',
    'total_products': len(scraped_data['products']),
    'sections': sections
}

# Save to file
with open('orac_decor_new.json', 'w', encoding='utf-8') as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

print(f"✅ Created orac_decor_new.json with {new_data['total_products']} products in {len(sections)} categories")
print("\nProducts by category:")
for section in sections:
    print(f"  - {section['title']}: {len(section['products'])} products")
