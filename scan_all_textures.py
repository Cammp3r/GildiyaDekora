import json
import requests
from bs4 import BeautifulSoup
import re
import time

with open('dtb.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

# Collect all product URLs
products = []
for section in db.get('sections', []):
    for product in section.get('products', []):
        products.append({
            'name': product.get('name'),
            'url': product.get('url'),
            'section': section.get('id')
        })

print(f"Checking all {len(products)} products for TEXTURE sections...")
print("=" * 70)

products_with_textures = []

for idx, product in enumerate(products):
    try:
        # Fetch page
        response = requests.get(product['url'], timeout=10, headers={
            'User-Agent': 'Mozilla/5.0'
        })
        
        if response.status_code != 200:
            continue
        
        # Check for ТЕКСТУРА
        if 'ТЕКСТУРА' not in response.text:
            continue
        
        print(f"[{idx+1:2d}] FOUND: {product['name']}")
        
        # Parse HTML to extract textures
        html = response.text
        texture_section = re.search(r'ТЕКСТУРА.*?(?=КОЛЬОРОВА|Конфіденційність|\Z)', html, re.DOTALL | re.IGNORECASE)
        
        if texture_section:
            section_text = texture_section.group(0)
            
            # Find background-image URLs and texture names
            links = re.findall(r'background-image:url\(([^)]+)\).*?<div>([^<]+)</div>', section_text, re.DOTALL | re.IGNORECASE)
            
            if links:
                textures = []
                for img_url, name in links:
                    img_url = img_url.strip('\'"')
                    textures.append({
                        'name': name.strip(),
                        'url': img_url
                    })
                
                if textures:
                    products_with_textures.append({
                        'name': product['name'],
                        'section': product['section'],
                        'textures': textures
                    })
        
        time.sleep(0.5)  # Be polite to server
        
    except Exception as e:
        print(f"Error {product['name']}: {str(e)[:40]}")
        continue

print("=" * 70)
print(f"\nTotal products with TEXTURES: {len(products_with_textures)}")

# Save to file
with open('all_textures.json', 'w', encoding='utf-8') as f:
    json.dump(products_with_textures, f, ensure_ascii=False, indent=2)

print("Saved to all_textures.json")

# Show summary
print("\nProducts with textures:")
for p in products_with_textures:
    count = len(p['textures'])
    print(f"  {p['name']:30s}: {count} textures in {p['section']}")
