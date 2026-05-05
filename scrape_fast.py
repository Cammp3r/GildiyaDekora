import requests
from bs4 import BeautifulSoup
import json
import time

BASE_URL = "https://oracdecor.com.ua"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

def scrape_product_fast(product_url):
    """Швидкий скрейп без перекладу"""
    try:
        response = requests.get(product_url, headers=HEADERS, timeout=10)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Назва
        name = ""
        h1 = soup.find('h1')
        if h1:
            name = h1.get_text(strip=True)
        
        # Опис 
        description = ""
        tab_panes = soup.find_all('div', class_='tab-pane')
        for tab in tab_panes:
            text = tab.get_text(strip=True)
            if len(text) > 100:
                description = text[:500]
                break
        
        # ФОТО - з data-src атрибутів
        photos = []
        all_imgs = soup.find_all('img')
        
        for img in all_imgs:
            src = img.get('data-src')
            if src and src.startswith('http'):
                if 'placeholder' not in src.lower() and '.gif' not in src.lower():
                    if src not in photos:
                        if not any(x in src.lower() for x in ['logo', 'cart', 'category', 'viber', 'telegram']):
                            photos.append(src)
        
        return {
            'name': name,
            'description': description,
            'photos': photos[:5],
            'success': True
        }
        
    except Exception as e:
        return {
            'name': '',
            'description': '',
            'photos': [],
            'success': False
        }

# Завантажимо поточні дані
print("📂 Завантажую поточні дані...")
with open('oracdecor_ua_products.json', 'r', encoding='utf-8') as f:
    current_data = json.load(f)

print(f"📊 Всього товарів: {len(current_data['products'])}")
print("⏳ Починаю швидкий скрейп (без перекладу)...\n")

# Лічильник
processed = 0
success = 0
start_time = time.time()

# Скрейпимо
detailed_products = []
for i, product in enumerate(current_data['products']):
    if (i + 1) % 25 == 0 or i == 0:
        print(f"[{i+1:3d}/535] {product['name'][:40]}")
    
    result = scrape_product_fast(product['url'])
    processed += 1
    
    if result['success']:
        success += 1
    
    # Об'єднуємо
    product_full = {
        **product,
        'description': result['description'],
        'photos': result['photos'] if result['photos'] else [product.get('image', '')],
        'photos_count': len(result['photos'])
    }
    
    detailed_products.append(product_full)
    
    # Затримка
    time.sleep(0.2)
    
    if (i + 1) % 50 == 0:
        elapsed = time.time() - start_time
        rate = (i + 1) / elapsed
        remaining = (535 - (i + 1)) / rate
        print(f"  ✓ {success}/{processed} | Залишилось ~{int(remaining)}сек\n")

# Зберігаємо
output_file = 'orac_decor_detailed.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({
        'source': 'oracdecor.com.ua',
        'total_products': len(detailed_products),
        'products': detailed_products
    }, f, ensure_ascii=False, indent=2)

elapsed_time = time.time() - start_time
print(f"\n" + "="*80)
print(f"✅ Скрейп завершено за {int(elapsed_time)}сек ({elapsed_time/60:.1f} хв)")
print(f"📊 Результати:")
print(f"  ✓ Успішно обробляно: {success}/{processed}")
print(f"  📄 Дані збережено в {output_file}")

# Статистика фото
photos_count = sum(1 for p in detailed_products if p.get('photos_count', 0) > 0)
print(f"  📸 Товарів з фото: {photos_count}/535")
