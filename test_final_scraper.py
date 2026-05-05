import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin, urlparse
import time

BASE_URL = "https://oracdecor.com.ua"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

def scrape_product_full(product_url):
    """Скрейп з витягом фото з мета тегів та JS об'єктів"""
    try:
        response = requests.get(product_url, headers=HEADERS, timeout=10)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Назва
        name = ""
        h1 = soup.find('h1')
        if h1:
            name = h1.get_text(strip=True)
        
        # Опис - з tab-pane
        description = ""
        tab_panes = soup.find_all('div', class_='tab-pane')
        for tab in tab_panes:
            text = tab.get_text(strip=True)
            if len(text) > 100:
                description = text[:500]
                break
        
        # ФОТО - новий підхід
        photos = []
        
        # 1. Шукаємо у meta og:image
        og_image = soup.find('meta', property='og:image')
        if og_image:
            img_url = og_image.get('content')
            if img_url:
                photos.append(img_url)
        
        # 2. Шукаємо у gallery div
        gallery_container = soup.find('div', class_='product-images')
        if gallery_container:
            # Шукаємо images div-и
            image_divs = gallery_container.find_all('div', class_='image')
            for div in image_divs:
                # У div може бути або img або a
                img = div.find('img')
                if img:
                    src = img.get('data-src') or img.get('src')
                    if src and src not in photos:
                        if not src.startswith('http'):
                            src = urljoin(BASE_URL, src)
                        if 'orac' in src.lower() or '/image/' in src.lower():
                            photos.append(src)
                
                link = div.find('a')
                if link:
                    href = link.get('href')
                    if href and href not in photos:
                        if not href.startswith('http'):
                            href = urljoin(BASE_URL, href)
                        if 'orac' in href.lower() or '/image/' in href.lower():
                            photos.append(href)
        
        # 3. Шукаємо в thumbnail галереї
        thumbnails = soup.find_all('a', class_='thumbnail')
        if not photos:  # Якщо основні фото не знайдено
            for thumb in thumbnails:
                href = thumb.get('href')
                if href and href not in photos:
                    if not href.startswith('http'):
                        href = urljoin(BASE_URL, href)
                    if 'image' in href.lower() and 'placeholder' not in href.lower():
                        photos.append(href)
        
        # 4. Витяг з lightbox JS
        if not photos:
            # Шукаємо скрипти з фото даними
            all_scripts = soup.find_all('script')
            for script in all_scripts:
                if script.string and 'gallery' in script.string.lower():
                    # Пошук URL фото
                    urls = re.findall(r'(?:href|src|image)\s*["\']([^"\']*\.(?:jpg|jpeg|png|webp))["\']', script.string, re.IGNORECASE)
                    for url in urls:
                        if url not in photos and 'orac' in url.lower():
                            if not url.startswith('http'):
                                url = urljoin(BASE_URL, url)
                            photos.append(url)
        
        # Очистимо фото від дублів та неправильних
        clean_photos = []
        for photo in photos:
            if photo and 'placeholder' not in photo.lower() and '.gif' not in photo.lower():
                if photo not in clean_photos:
                    clean_photos.append(photo)
        
        return {
            'name': name,
            'description': description,
            'photos': clean_photos[:5],
            'photos_count': len(clean_photos)
        }
        
    except Exception as e:
        print(f"  Помилка: {e}")
        return None

# Тест на кількох товарах
print("🔍 Тестування на кількох товарах...\n")

test_urls = [
    "https://oracdecor.com.ua/karnizy/led-karniz-skrytogo-osvesheniya-orac-decor-c351",
    "https://oracdecor.com.ua/karnizy/led-karniz-skrytogo-osvesheniya-orac-decor-c358",
]

for i, url in enumerate(test_urls, 1):
    print(f"[{i}] Скрейп {url.split('/')[-1]}")
    result = scrape_product_full(url)
    
    if result:
        print(f"    Назва: {result['name'][:50]}")
        print(f"    Опис: {result['description'][:50]}...")
        print(f"    Фото: {result['photos_count']}")
        if result['photos']:
            for j, photo in enumerate(result['photos'][:3], 1):
                print(f"      {j}. {photo[:70]}")
    print()
    time.sleep(1)

print("\n✅ Тест завершено")
