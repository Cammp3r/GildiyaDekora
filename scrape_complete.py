import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin
from google_trans_new import google_translator

BASE_URL = "https://oracdecor.com.ua"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

translator = google_translator()

def translate_to_ukrainian(text):
    """Переклад з російської на українську"""
    if not text or len(text) < 2:
        return text
    try:
        return translator.translate(text, lang_src='ru', lang_tgt='uk')
    except:
        return text

def scrape_product_complete(product_url):
    """Скрейп товара з фото, описом та перекладом"""
    try:
        response = requests.get(product_url, headers=HEADERS, timeout=10)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Назва російською
        name_ru = ""
        h1 = soup.find('h1')
        if h1:
            name_ru = h1.get_text(strip=True)
        
        # Переклад назви
        name_uk = translate_to_ukrainian(name_ru)
        
        # Опис 
        description_ru = ""
        description_uk = ""
        tab_panes = soup.find_all('div', class_='tab-pane')
        for tab in tab_panes:
            text = tab.get_text(strip=True)
            if len(text) > 100:
                description_ru = text[:500]
                # Переклад опису
                description_uk = translate_to_ukrainian(description_ru)
                break
        
        # ФОТО - з data-src атрибутів
        photos = []
        all_imgs = soup.find_all('img')
        
        for img in all_imgs:
            src = img.get('data-src')
            if src and src.startswith('http'):
                if 'placeholder' not in src.lower() and '.gif' not in src.lower():
                    if src not in photos:
                        # Фільтруємо логотипи та категорії
                        if not any(x in src.lower() for x in ['logo', 'cart', 'category', 'viber', 'telegram']):
                            photos.append(src)
        
        # Видаляємо дублі та залишаємо топ 5 фото
        unique_photos = list(dict.fromkeys(photos))
        clean_photos = unique_photos[:5]
        
        return {
            'name_ru': name_ru,
            'name_uk': name_uk,
            'description_ru': description_ru,
            'description_uk': description_uk,
            'photos': clean_photos,
            'photos_count': len(clean_photos),
            'success': True
        }
        
    except Exception as e:
        return {
            'name_ru': '',
            'name_uk': '',
            'description_ru': '',
            'description_uk': '',
            'photos': [],
            'photos_count': 0,
            'success': False,
            'error': str(e)
        }

# Завантажимо поточні дані
print("📂 Завантажую поточні дані...")
with open('oracdecor_ua_products.json', 'r', encoding='utf-8') as f:
    current_data = json.load(f)

print(f"📊 Всього товарів: {len(current_data['products'])}")
print("⏳ Починаю скрейп фото, описів та перекладу...\n")
print("="*80)

# Лічильник для прогресу
processed = 0
success = 0
errors = 0
start_time = time.time()

# Скрейпимо детальну інформацію
detailed_products = []
for i, product in enumerate(current_data['products']):
    product_name = product['name'][:50]
    print(f"[{i+1:3d}/535] {product_name}")
    
    result = scrape_product_complete(product['url'])
    processed += 1
    
    if result['success']:
        success += 1
        # Об'єднуємо з поточними даними
        product_full = {
            **product,
            'name_ru': result['name_ru'],
            'name_uk': result['name_uk'],
            'description_ru': result['description_ru'],
            'description_uk': result['description_uk'],
            'photos': result['photos'],
            'photos_count': result['photos_count']
        }
    else:
        errors += 1
        # Якщо помилка, використовуємо поточні дані
        product_full = {
            **product,
            'name_ru': product.get('name', ''),
            'name_uk': product.get('name', ''),
            'description_ru': '',
            'description_uk': '',
            'photos': [product.get('image', '')],
            'photos_count': 0
        }
    
    detailed_products.append(product_full)
    
    # Затримка щоб не перевантажити сервер
    time.sleep(0.3)
    
    # Статистика кожні 25 товарів
    if (i + 1) % 25 == 0:
        elapsed = time.time() - start_time
        rate = (i + 1) / elapsed
        remaining = (535 - (i + 1)) / rate
        print(f"  ✅ {success}/{processed} успішно | Залишилось ~{int(remaining)}сек\n")

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
print(f"✅ Скрейп завершено за {int(elapsed_time)}сек")
print(f"📊 Результати:")
print(f"  ✓ Успішно: {success}/{processed}")
print(f"  ❌ Помилок: {errors}")
print(f"  📄 Дані збережено в {output_file}")
