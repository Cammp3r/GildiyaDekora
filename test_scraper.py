import requests
from bs4 import BeautifulSoup
import json
from urllib.parse import urljoin

BASE_URL = "https://oracdecor.com.ua"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

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
        print(f"📌 Назва: {name}")
        
        # Опис - шукаємо в табах
        description = ""
        
        # Спробуємо знайти опис в різних місцях
        desc_elem = soup.find('div', class_='tab-pane active')
        if desc_elem:
            description = desc_elem.get_text(strip=True)[:500]  # Перші 500 символів
        
        print(f"📝 Опис (перші 100 символів): {description[:100]}")
        
        # Фото - шукаємо в галереї
        photos = []
        
        # Варіант 1: a.thumbnail
        gallery_items = soup.find_all('a', class_='thumbnail')
        print(f"🖼️  Знайдено a.thumbnail: {len(gallery_items)}")
        
        if gallery_items:
            for idx, item in enumerate(gallery_items):
                img_tag = item.find('img')
                if img_tag:
                    photo_url = img_tag.get('src') or img_tag.get('data-src')
                    print(f"   Фото {idx+1}: {photo_url[:80]}")
                    if photo_url and 'placeholder' not in photo_url.lower():
                        if not photo_url.startswith('http'):
                            photo_url = urljoin(BASE_URL, photo_url)
                        photos.append(photo_url)
        
        # Варіант 2: img-thumbnail
        if not photos:
            thumb_items = soup.find_all('img', class_='img-thumbnail')
            print(f"🖼️  Знайдено img-thumbnail: {len(thumb_items)}")
            for idx, img_tag in enumerate(thumb_items):
                photo_url = img_tag.get('src') or img_tag.get('data-src')
                if photo_url and 'placeholder' not in photo_url.lower():
                    print(f"   Фото {idx+1}: {photo_url[:80]}")
                    if not photo_url.startswith('http'):
                        photo_url = urljoin(BASE_URL, photo_url)
                    photos.append(photo_url)
        
        # Варіант 3: basic img
        if not photos:
            all_imgs = soup.find_all('img')
            product_imgs = [img for img in all_imgs if 'product' in str(img.parent.get('class', [])).lower()]
            print(f"🖼️  Знайдено img в product: {len(product_imgs)}")
            for idx, img_tag in enumerate(product_imgs[:5]):
                photo_url = img_tag.get('src') or img_tag.get('data-src')
                if photo_url and 'placeholder' not in photo_url.lower():
                    print(f"   Фото {idx+1}: {photo_url[:80]}")
                    if not photo_url.startswith('http'):
                        photo_url = urljoin(BASE_URL, photo_url)
                    if photo_url not in photos:
                        photos.append(photo_url)
        
        print(f"\n✅ Всього фото знайдено: {len(photos)}")
        
        return {
            'name': name,
            'description': description,
            'photos': photos,
            'success': True
        }
        
    except Exception as e:
        print(f"❌ Помилка: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

# Тест на першому товарі
test_url = "https://oracdecor.com.ua/karnizy/led-karniz-skrytogo-osvesheniya-orac-decor-c351"
print("🔍 Тестування скрейпера на одному товарі...\n")
result = scrape_product_details(test_url)

print("\n" + "="*80)
print("📋 РЕЗУЛЬТАТ:")
print("="*80)
print(json.dumps({
    'name': result.get('name', ''),
    'description': result.get('description', '')[:200],
    'photos_count': len(result.get('photos', [])),
    'photos': result.get('photos', [])[:3]  # Перші 3 для перегляду
}, indent=2, ensure_ascii=False))
