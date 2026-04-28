import json
import re

with open('dtb.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Products we're looking for
target_products = {
    'Biamax', 'Coprimax', 'Drywall Paint', 'Extrapaint', 'Multifund', 
    'Supercolor', 'Topmatt', 'Ultrasaten', 'Wallsatin', 
    'Micotral', 'Sterylcalce', 'Sterylfix', 'Sterylpaint', 'Sterylplus', 'Sterylsan', 
    'Crilux', 'Flexigrap', 'Fondo Murales', 'Il Pigmentato', 'Neofix', 
    'Stucco in Pasta per Rasatura', 'Cera per Stucco', 'Igrolux', 'Opac', 
    'Protettivo per Stucco e Marmorino', 'Watins Lux', 'Decortina New', 'Ekostripper'
}

result = {
    "interior-paint": []
}

# Find interior-paint section
for section in data['sections']:
    if section['id'] == 'interior-paint':
        print(f'Found {len(section["products"])} products in interior-paint')
        for product in section['products']:
            name = product.get('name', 'Unknown')
            if name in target_products:
                url = product.get('url', '')
                photos = product.get('photos', [])
                result['interior-paint'].append({
                    'name': name,
                    'product_url': url,
                    'photos': photos
                })
                print(f'✓ {name}: {len(photos)} photos')
            
# Save result
with open('interior_paint_photos.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f'\nCollected {len(result["interior-paint"])} products')
print(f'Saved to interior_paint_photos.json')
