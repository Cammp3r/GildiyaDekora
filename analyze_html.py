import requests
from bs4 import BeautifulSoup

url = "https://oracdecor.com.ua/karnizy/led-karniz-skrytogo-osvesheniya-orac-decor-c351"
HEADERS = {'User-Agent': 'Mozilla/5.0'}

response = requests.get(url, headers=HEADERS)
response.encoding = 'utf-8'

# Зберігаємо HTML для аналізу
with open('page_source.html', 'w', encoding='utf-8') as f:
    f.write(response.text)

print("✅ HTML сторінки збережено в page_source.html")

# Проаналізуємо структуру
soup = BeautifulSoup(response.text, 'html.parser')

# Шукаємо всі тег-и з атрибутами що містять image
print("\n🔍 Аналіз структури...\n")

# Div-и з product-images
prod_images = soup.find('div', class_='product-images')
if prod_images:
    print("✓ Знайдено div.product-images")
    print(f"  HTML: {str(prod_images)[:200]}...")
    
    # Дитячі елементи
    for child in prod_images.children:
        if hasattr(child, 'name'):
            print(f"  - {child.name}: {child.get('class', [])}")
    
# Шукаємо всі div-и з class="image"
image_divs = soup.find_all('div', class_='image')
print(f"\n✓ Знайдено {len(image_divs)} div.image елементів")
if image_divs:
    print("Перший image div:")
    print(image_divs[0].prettify()[:500])

# Шукаємо лінк-и
print("\n✓ Пошук лінків:")
links = soup.find_all('a', class_='thumbnail')
print(f"  a.thumbnail: {len(links)}")
for i, link in enumerate(links[:3]):
    print(f"    {i+1}. href={link.get('href', 'N/A')}")

# Шукаємо img з data атрибутами
print("\n✓ Пошук img тегів:")
all_imgs = soup.find_all('img')
print(f"  Всього img: {len(all_imgs)}")
for i, img in enumerate(all_imgs[:5]):
    print(f"    {i+1}. src={img.get('src', 'N/A')}")
    print(f"       data-src={img.get('data-src', 'N/A')}")
    print(f"       title={img.get('title', 'N/A')}")

# Шукаємо script-и
print("\n✓ Пошук скриптів з даними:")
scripts = soup.find_all('script')
print(f"  Всього script тегів: {len(scripts)}")

for i, script in enumerate(scripts):
    if script.string and len(script.string) > 50:
        text = script.string[:200]
        if 'image' in text.lower() or 'gallery' in text.lower():
            print(f"    Script {i}: {text}")
