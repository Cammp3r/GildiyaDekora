import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin

BASE_URL = "https://oracdecor.com.ua"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

def scrape_product_advanced(product_url):
    """Скрейп товара з витягом фото з JS об'єктів"""
    try:
        print(f"⏳ Скрейп {product_url}")
        response = requests.get(product_url, headers=HEADERS, timeout=10)
        response.encoding = 'utf-8'
        
        html_content = response.text
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Назва
        title_elem = soup.find('h1')
        name = title_elem.get_text(strip=True) if title_elem else ""
        print(f"📌 {name}")
        
        # Опис
        description = ""
        # Шукаємо першу tab-pane яка виглядає як опис
        tab_panes = soup.find_all('div', class_='tab-pane')
        if tab_panes:
            for tab in tab_panes:
                text = tab.get_text(strip=True)
                if len(text) > 50:  # Опис має бути достатньо довгим
                    description = text[:800]
                    break
        
        print(f"📝 Опис ({len(description)} символів)")
        
        # Фото - витяг з JavaScript та data атрибутів
        photos = []
        
        # Варіант 1: Шукаємо img з data-src атрибутом
        all_imgs = soup.find_all('img')
        print(f"🔍 Знайдено {len(all_imgs)} img тегів")
        
        for img in all_imgs:
            # Перевіряємо data-src (lazy loading)
            src = img.get('data-src')
            if not src:
                src = img.get('src')
            
            if src and not src.startswith('data:'):
                # Фільтруємо плейсхолдери та прозорі GIF
                if 'placeholder' not in src.lower() and '.gif' not in src.lower():
                    # Перевіряємо чи це справжня URL
                    if 'orac' in src.lower() or src.startswith('http') or src.startswith('/'):
                        if not src.startswith('http'):
                            src = urljoin(BASE_URL, src)
                        
                        if src not in photos:
                            photos.append(src)
                            print(f"  🖼️  {len(photos)}: {src.split('/')[-1]}")
                            if len(photos) >= 5:
                                break
        
        # Варіант 2: Шукаємо в JavaScript коді
        if not photos:
            print("  🔍 Шукаємо фото в JS коді...")
            # Шукаємо JSON або масиви з URL фото
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string:
                    # Шукаємо URL образів в коді
                    image_urls = re.findall(r'"image"\s*:\s*"([^"]+\.(?:jpg|jpeg|png|webp))"', script.string, re.IGNORECASE)
                    for url in image_urls:
                        if url not in photos and 'orac' in url.lower():
                            if not url.startswith('http'):
                                url = urljoin(BASE_URL, url)
                            photos.append(url)
                            print(f"  🖼️  {len(photos)}: {url.split('/')[-1]}")
                            if len(photos) >= 5:
                                break
        
        # Варіант 3: Пошук в мета тегах
        if not photos:
            print("  🔍 Шукаємо фото в мета тегах...")
            og_images = soup.find_all('meta', property=re.compile(r'og:image'))
            for meta in og_images:
                url = meta.get('content')
                if url and 'orac' in url.lower():
                    if not url.startswith('http'):
                        url = urljoin(BASE_URL, url)
                    if url not in photos:
                        photos.append(url)
                        print(f"  🖼️  {len(photos)}: {url.split('/')[-1]}")
        
        print(f"✅ Всього фото: {len(photos)}\n")
        
        return {
            'name': name,
            'description': description,
            'photos': photos[:5],
            'success': True
        }
        
    except Exception as e:
        print(f"❌ Помилка: {e}\n")
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': str(e)}

# Тест
test_url = "https://oracdecor.com.ua/karnizy/led-karniz-skrytogo-osvesheniya-orac-decor-c351"
print("🔍 Тестування розширеного скрейпера...\n")
print("="*80)

result = scrape_product_advanced(test_url)

print("="*80)
print("\n📋 РЕЗУЛЬТАТ:")
print("="*80)
if result['success']:
    print(json.dumps({
        'name': result.get('name', ''),
        'description': result.get('description', '')[:150] + '...',
        'photos_count': len(result.get('photos', [])),
        'photos': result.get('photos', [])
    }, indent=2, ensure_ascii=False))
else:
    print(f"Помилка: {result.get('error')}")
