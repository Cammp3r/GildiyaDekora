import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin

BASE_URL = "https://oracdecor.com.ua"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

def scrape_product_complete(product_url):
    """Скрейп товара з витягом з data-src фото"""
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
        
        # ФОТО - з data-src атрибутів!
        photos = []
        all_imgs = soup.find_all('img')
        
        for img in all_imgs:
            # Витягаємо data-src (реальна фото з lazy loading)
            src = img.get('data-src')
            
            if src and src.startswith('http'):
                # Фільтруємо плейсхолдери
                if 'placeholder' not in src.lower() and '.gif' not in src.lower():
                    if src not in photos:
                        # Перевіряємо чи це не категорія/логотип
                        if 'C' in src or 'product' in src or 'decor' in src:
                            photos.append(src)
        
        # Видаляємо логотипи та неправильні фото
        clean_photos = []
        for photo in photos:
            if 'logo' not in photo.lower() and 'cart' not in photo.lower() and 'category' not in photo.lower():
                clean_photos.append(photo)
        
        return {
            'name': name,
            'description': description,
            'photos': clean_photos[:5],
            'photos_count': len(clean_photos),
            'raw_photos_count': len(photos)
        }
        
    except Exception as e:
        return {'name': '', 'description': '', 'photos': [], 'error': str(e)}

# Тест на кількох товарах
print("🔍 Тестування скрейпера з data-src...\n")

test_urls = [
    "https://oracdecor.com.ua/karnizy/led-karniz-skrytogo-osvesheniya-orac-decor-c351",
    "https://oracdecor.com.ua/moldingi/molding-cx180-orac-decor",
    "https://oracdecor.com.ua/napolnyy-plintus/baseboard-sx118-orac-decor",
]

for url in test_urls:
    product_name = url.split('/')[-1][:40]
    print(f"⏳ {product_name}")
    result = scrape_product_complete(url)
    
    if result.get('photos'):
        print(f"  ✅ Назва: {result['name'][:40]}")
        print(f"  📝 Опис: {result['description'][:40]}...")
        print(f"  🖼️  Фото: {result['photos_count']}")
        for i, photo in enumerate(result['photos'][:2], 1):
            print(f"     {i}. {photo[-60:]}")
    else:
        print(f"  ❌ Фото не знайдено. Raw: {result.get('raw_photos_count')}")
    print()
    time.sleep(1)

print("✅ Тест завершено")
