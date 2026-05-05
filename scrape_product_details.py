import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin
import os

# Для перекладу на українську
try:
    from google_trans_new import google_translator
    translator = google_translator()
    TRANSLATOR_AVAILABLE = True
except:
    TRANSLATOR_AVAILABLE = False
    print("⚠️  google_trans_new не встановлена, буду використовувати простий переклад")

BASE_URL = "https://oracdecor.com.ua"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

# Словник для простого перекладу (так як не маємо API)
TRANSLATION_DICT = {
    'LED Карниз': 'LED Карниз',
    'Карниз': 'Карниз',
    'гибкий': 'гнучкий',
    'Молдинг': 'Молдинг',
    'Плинтус': 'Плінтус',
    'Освещение': 'Освітлення',
    'Декоративные': 'Декоративні',
    'элементы': 'елементи',
    'скрытого': 'прихованого',
    'Скрытое': 'Приховане',
}

def translate_text_simple(text):
    """Простий переклад за допомогою словника та Google Translate"""
    if not TRANSLATOR_AVAILABLE:
        return text
    
    try:
        # Спробуємо використати Google Translate
        result = translator.translate(text, lang_src='ru', lang_tgt='uk')
        return result
    except:
        return text

def scrape_product_details(product_url):
    """Скрейп детальної інформації про товар"""
    try:
        print(f"⏳ Скрейп {product_url}")
        response = requests.get(product_url, headers=HEADERS, timeout=10)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Назва товара
        title_elem = soup.find('h1')
        name = title_elem.get_text(strip=True) if title_elem else ""
        
        # Опис
        description = ""
        desc_elem = soup.find('div', class_='description')
        if desc_elem:
            description = desc_elem.get_text(strip=True)
        
        # Фото - шукаємо в галереї
        photos = []
        gallery_items = soup.find_all('a', class_='thumbnail')
        if gallery_items:
            for item in gallery_items:
                img_tag = item.find('img')
                if img_tag and img_tag.get('src'):
                    photo_url = img_tag.get('src')
                    if photo_url.startswith('http'):
                        photos.append(photo_url)
                    else:
                        photos.append(urljoin(BASE_URL, photo_url))
        
        # Якщо галереї немає, шукаємо основне фото
        if not photos:
            main_image = soup.find('img', class_='img-responsive')
            if main_image and main_image.get('src'):
                photo_url = main_image.get('src')
                if photo_url and 'placeholder' not in photo_url.lower():
                    if photo_url.startswith('http'):
                        photos.append(photo_url)
                    else:
                        photos.append(urljoin(BASE_URL, photo_url))
        
        # Деталі товара (техспеці)
        attributes = {}
        attr_section = soup.find('div', class_='product-info-tabs')
        if attr_section:
            trs = attr_section.find_all('tr')
            for tr in trs:
                tds = tr.find_all('td')
                if len(tds) >= 2:
                    key = tds[0].get_text(strip=True)
                    value = tds[1].get_text(strip=True)
                    attributes[key] = value
        
        # Ціна
        price_text = "Уточнить цену"
        price_elem = soup.find('span', class_='price')
        if price_elem:
            price_text = price_elem.get_text(strip=True)
        
        return {
            'name': name,
            'description': description,
            'photos': photos[:5],  # Максимум 5 фото
            'attributes': attributes,
            'price_text': price_text,
            'success': True
        }
        
    except Exception as e:
        print(f"❌ Помилка при скрейпу {product_url}: {str(e)}")
        return {
            'name': '',
            'description': '',
            'photos': [],
            'attributes': {},
            'price_text': '',
            'success': False,
            'error': str(e)
        }

# Завантажимо поточні дані
print("📂 Завантажую поточні дані...")
with open('oracdecor_ua_products.json', 'r', encoding='utf-8') as f:
    current_data = json.load(f)

print(f"📊 Всього товарів: {len(current_data['products'])}")
print("🔄 Починаю скрейп деталей товарів...\n")

# Скрейпимо детальну інформацію
detailed_products = []
for i, product in enumerate(current_data['products']):
    print(f"[{i+1}/{len(current_data['products'])}] Обробляю {product['name']}")
    
    details = scrape_product_details(product['url'])
    
    # Об'єднуємо з поточними даними
    product_full = {
        **product,
        'description': details['description'],
        'photos': details['photos'] if details['photos'] else [product['image']],
        'attributes': details['attributes'],
        'success': details['success']
    }
    
    detailed_products.append(product_full)
    
    # Затримка щоб не перевантажити сервер
    time.sleep(0.5)
    
    if (i + 1) % 10 == 0:
        print(f"   ✓ Оброблено {i+1} товарів...\n")

# Зберігаємо
output_file = 'oracdecor_ua_detailed.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({
        'source': 'oracdecor.com.ua',
        'total_products': len(detailed_products),
        'products': detailed_products
    }, f, ensure_ascii=False, indent=2)

print(f"\n✅ Дані збережено в {output_file}")
print(f"📊 Успішно оброблено товарів")
