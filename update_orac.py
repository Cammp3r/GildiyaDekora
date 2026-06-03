import json
from datetime import datetime
import os

# Get current directory
print(f"Current directory: {os.getcwd()}")

# Load the newly scraped products
with open('oracdecor_ua_products.json', 'r', encoding='utf-8') as f:
    scraped_data = json.load(f)

print(f"Loaded {len(scraped_data['products'])} products from oracdecor_ua_products.json")

# Create the new orac_decor.json structure
products_by_category = {}
for product in scraped_data['products']:
    cat = product['category']
    if cat not in products_by_category:
        products_by_category[cat] = []
    products_by_category[cat].append(product)

# Build sections for the JSON
sections = []
for category_name in ['Карнизы', 'Молдинги', 'Напольный плинтус', 'Скрытое освещение', 'Декоративные элементы']:
    if category_name not in products_by_category:
        continue
        
    products = products_by_category[category_name]
    
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
        'url': f'https://oracdecor.com.ua/',
        'products': [
            {
                'id': f"{cat_id}-{i+1}",
                'name': p['name'],
                'price': 0,
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
    'dealer': 'Гільдія Декора',
    'country': 'Україна',
    'updated': datetime.now().strftime('%Y-%m-%d'),
    'base_url': 'https://oracdecor.com.ua',
    'total_products': len(scraped_data['products']),
    'sections': sections
}

# Save to file
output_path = 'orac_decor.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

print(f"✅ Updated {output_path} with {new_data['total_products']} products")
print("\nProducts by category:")
for section in sections:
    print(f"  - {section['title']}: {len(section['products'])} products")

# Verify file was created
if os.path.exists(output_path):
    file_size = os.path.getsize(output_path)
    print(f"\n✓ File verified: {output_path} ({file_size} bytes)")
