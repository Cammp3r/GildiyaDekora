"""
Script to scrape all ORAC DECOR products from oracdecor.com.ua
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin
import re

BASE_URL = "https://oracdecor.com.ua"

# Categories to scrape
CATEGORIES = [
    {"name": "Карнизы", "slug": "karnizy", "id": "cornices"},
    {"name": "Молдинги", "slug": "moldingi", "id": "moldings"},
    {"name": "Напольный плинтус", "slug": "napolnyy-plintus", "id": "baseboard"},
    {"name": "Скрытое освещение", "slug": "skrytoe-osveshchenie", "id": "lighting"},
    {"name": "Декоративные элементы", "slug": "dekorativnye-elementy", "id": "decorative"}
]

def scrape_category(category_slug, category_name, category_id):
    """Scrape all products from a category with pagination"""
    products = []
    page = 1
    products_per_page = 100
    
    print(f"\n🔄 Scraping {category_name}")
    
    try:
        while True:
            url = f"{BASE_URL}/{category_slug}?limit={products_per_page}&page={page}"
            print(f"  📄 Page {page}...")
            
            try:
                response = requests.get(url, timeout=10, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                })
                response.encoding = 'utf-8'
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Get all product items
                product_items = soup.find_all('div', class_='product-layout')
                
                if not product_items:
                    # Try alternative selector
                    product_items = soup.find_all('div', class_=re.compile('product'))
                
                if not product_items:
                    # No more products on this page
                    if page == 1:
                        print(f"    ❌ No products found for {category_name}")
                    break
                
                print(f"    ✓ Found {len(product_items)} products")
                
                page_has_new_products = False
                
                for item in product_items:
                    try:
                        # Get product name
                        name_elem = item.find('h4')
                        if not name_elem:
                            name_elem = item.find('a', class_=re.compile('name|title'))
                        
                        if name_elem:
                            product_name = name_elem.get_text(strip=True)
                            
                            # Check if product already exists
                            if any(p['name'] == product_name for p in products):
                                continue
                            
                            # Get product URL
                            link = item.find('a', href=re.compile(category_slug))
                            product_url = link['href'] if link else ''
                            
                            if not product_url.startswith('http'):
                                product_url = urljoin(BASE_URL, product_url)
                            
                            # Get product image
                            img = item.find('img')
                            product_image = img['src'] if img and 'src' in img.attrs else (
                                img.get('data-src', '') if img else ''
                            )
                            if not product_image.startswith('http'):
                                product_image = urljoin(BASE_URL, product_image)
                            
                            # Get price
                            price_elem = item.find('span', class_=re.compile('price'))
                            product_price = price_elem.get_text(strip=True) if price_elem else 'Уточнить цену'
                            
                            product = {
                                'id': f"orac-{len(products) + 1}",
                                'name': product_name,
                                'category': category_name,
                                'category_id': category_id,
                                'price_text': product_price,
                                'url': product_url,
                                'image': product_image
                            }
                            
                            products.append(product)
                            page_has_new_products = True
                            print(f"      • {product_name}")
                        
                    except Exception as e:
                        print(f"      ! Error parsing product: {e}")
                
                # If no new products were found, we've reached the end
                if not page_has_new_products and page > 1:
                    break
                
                page += 1
                time.sleep(0.5)
                
            except Exception as e:
                print(f"  ❌ Error loading page {page}: {e}")
                break
        
        print(f"  ✅ Total for {category_name}: {len(products)} products")
        return products
        
    except Exception as e:
        print(f"❌ Error scraping {category_name}: {e}")
        return []

def scrape_all_products():
    """Scrape products from all categories"""
    all_products = []
    
    for category in CATEGORIES:
        products = scrape_category(category['slug'], category['name'], category['id'])
        all_products.extend(products)
        time.sleep(1)  # Be polite to the server
    
    return all_products

def main():
    print("🚀 Starting ORAC DECOR UA product scraping...")
    print(f"📍 Target: {BASE_URL}\n")
    
    all_products = scrape_all_products()
    
    print(f"\n✅ Total products scraped: {len(all_products)}")
    
    # Group by category
    by_category = {}
    for product in all_products:
        cat = product['category']
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(product)
    
    print("\n📊 Products by category:")
    for cat, prods in by_category.items():
        print(f"  - {cat}: {len(prods)} products")
    
    # Save to file
    output = {
        'source': 'oracdecor.com.ua',
        'total_products': len(all_products),
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'products': all_products
    }
    
    with open('oracdecor_ua_products.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Results saved to oracdecor_ua_products.json")

if __name__ == '__main__':
    main()
