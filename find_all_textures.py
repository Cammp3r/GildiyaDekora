#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрип для пошуку всіх товарів з текстурами на сайті
"""

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

print(f"Found {len(products)} products to check")
print("=" * 80)

products_with_textures = []

for idx, product in enumerate(products):
    try:
        print(f"[{idx+1}/{len(products)}] Checking {product['name'][:40]:40s}...", end=' ')
        
        # Fetch page
        response = requests.get(product['url'], timeout=5, headers={
            'User-Agent': 'Mozilla/5.0'
        })
        
        if response.status_code != 200:
            print("ERROR (404)")
            continue
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        page_text = soup.get_text()
        
        # Check for ТЕКСТУРА section
        if 'ТЕКСТУРА' not in page_text:
            print("No textures")
            continue
        
        # Also check it's not just in disclaimer
        if page_text.count('ТЕКСТУРА') == 1 and 'КОЛЬОРОВА ГАМА' in page_text:
            print("No textures")
            continue
        
        print("HAS TEXTURES!")
        
        # Try to extract texture links
        # Look for links after ТЕКСТУРА text
        html = response.text
        
        # Find ТЕКСТУРА section
        texture_match = re.search(r'ТЕКСТУРА.*?(?=КОЛЬОРОВА ГАМА|Конфіденційність|\Z)', html, re.DOTALL | re.IGNORECASE)
        
        if texture_match:
            texture_section = texture_match.group(0)
            
            # Extract links with images
            links = re.findall(r'<a[^>]*href=["\']([^"\']*)["\'][^>]*>.*?<div[^>]*style=["\']([^"\']*background-image[^"\']*)["\'][^>]*>[^<]*<div>([^<]+)</div>', texture_section, re.DOTALL | re.IGNORECASE)
            
            if links:
                textures = []
                for href, style, name in links:
                    # Extract image URL from style
                    img_match = re.search(r'background-image\s*:\s*url\(([^)]+)\)', style)
                    if img_match:
                        img_url = img_match.group(1).strip('\'"')
                        textures.append({
                            'name': name.strip(),
                            'url': img_url,
                            'href': href
                        })
                
                if textures:
                    products_with_textures.append({
                        'name': product['name'],
                        'section': product['section'],
                        'url': product['url'],
                        'textures': textures
                    })
        
        time.sleep(0.3)
        
    except Exception as e:
        print(f"ERROR: {str(e)[:30]}")

print("\n" + "=" * 80)
print(f"Found {len(products_with_textures)} products with textures!")
print("=" * 80)

for product in products_with_textures:
    print(f"\n{product['name']}:")
    for tex in product['textures']:
        print(f"  - {tex['name']}: {tex['url'][:70]}")

# Save results
with open('textures_found.json', 'w', encoding='utf-8') as f:
    json.dump(products_with_textures, f, ensure_ascii=False, indent=2)

print(f"\nResults saved to textures_found.json")
