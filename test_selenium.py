from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
import json
import time

# Конфігурація Selenium
options = webdriver.ChromeOptions()
options.add_argument('--headless')  # Без GUI
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--disable-gpu')
options.add_argument('user-agent=Mozilla/5.0')

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

def scrape_product_with_selenium(product_url):
    """Скрейп товара з виконанням JavaScript"""
    try:
        print(f"⏳ Завантажую {product_url}")
        driver.get(product_url)
        
        # Чекаємо завантаження основного зображення
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_all_elements_located((By.TAG_NAME, "img"))
            )
        except:
            pass
        
        # Скролимо щоб загрузити ледиві фото
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        
        # Повертаємось до верху
        driver.execute_script("window.scrollTo(0, 0);")
        
        # Назва
        try:
            name_elem = driver.find_element(By.TAG_NAME, "h1")
            name = name_elem.text
        except:
            name = ""
        
        print(f"📌 {name}")
        
        # Опис - шукаємо перший tab-pane
        description = ""
        try:
            # Шукаємо будь-яке текстове вмістилище з описом
            tabs = driver.find_elements(By.CLASS_NAME, "tab-pane")
            if tabs:
                description = tabs[0].text[:500]
        except:
            pass
        
        # Фото - ловимо src з img елементів в галереї
        photos = []
        try:
            # Шукаємо всі img в елементах галереї
            gallery = driver.find_element(By.CLASS_NAME, "product-images")
            images = gallery.find_elements(By.TAG_NAME, "img")
            
            for idx, img in enumerate(images):
                # Отримуємо src або data-src
                src = img.get_attribute("src") or img.get_attribute("data-src")
                
                if src and 'placeholder' not in src.lower() and 'gif' not in src.lower():
                    if src not in photos:  # Уникаємо дублів
                        photos.append(src)
                        print(f"  🖼️  Фото {len(photos)}: {src[:60]}...")
                        if len(photos) >= 5:
                            break
        except Exception as e:
            print(f"  ⚠️  Помилка при отриманні фото: {e}")
        
        # Якщо фото не знайдено, шукаємо в іншому місці
        if not photos:
            try:
                all_imgs = driver.find_elements(By.TAG_NAME, "img")
                for img in all_imgs:
                    src = img.get_attribute("src")
                    if src and 'orac' in src.lower() and 'placeholder' not in src.lower() and src not in photos:
                        photos.append(src)
                        print(f"  🖼️  Фото {len(photos)}: {src[:60]}...")
                        if len(photos) >= 5:
                            break
            except:
                pass
        
        print(f"✅ Знайдено фото: {len(photos)}\n")
        
        return {
            'name': name,
            'description': description,
            'photos': photos,
            'success': True
        }
        
    except Exception as e:
        print(f"❌ Помилка: {e}\n")
        return {
            'success': False,
            'error': str(e)
        }

# Тест на першому товарі
test_url = "https://oracdecor.com.ua/karnizy/led-karniz-skrytogo-osvesheniya-orac-decor-c351"
print("🔍 Тестування Selenium скрейпера...\n")
print("="*80)

result = scrape_product_with_selenium(test_url)

print("="*80)
print("\n📋 РЕЗУЛЬТАТ:")
print("="*80)
print(json.dumps({
    'name': result.get('name', ''),
    'description': result.get('description', '')[:150],
    'photos_count': len(result.get('photos', [])),
    'first_photo': result.get('photos', [''])[0][:80] if result.get('photos') else None
}, indent=2, ensure_ascii=False))

driver.quit()
