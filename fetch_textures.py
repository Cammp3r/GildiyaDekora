#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для скрейпінгу текстур з сайту oikos.ua
Для кожного продукту шукає текстури (не цветові гаммы) з фотографіями
"""

import json
import time
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Загрузить БД
print("Loading database...")
with open('dtb.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

# Инициализировать драйвер
options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--disable-blink-features=AutomationControlled')
driver = webdriver.Chrome(options=options)

textures_data = {}

# Обработать каждый продукт
for section in db.get('sections', []):
    print(f"\nSection: {section.get('id')}")
    
    for product in section.get('products', []):
        product_url = product.get('url')
        product_name = product.get('name')
        
        if not product_url:
            continue
        
        try:
            print(f"  Processing: {product_name}...", end=' ')
            driver.get(product_url)
            
            # Ждём загрузки страницы
            WebDriverWait(driver, 5).until(
                EC.presence_of_all_elements_located((By.TAG_NAME, "body"))
            )
            
            # Ищем элемент с текстом "ТЕКСТУРА"
            try:
                texture_section = driver.find_element(By.XPATH, "//*[contains(text(), 'ТЕКСТУРА')]")
                
                # Найти все ссылки после этого элемента
                parent = texture_section.find_element(By.XPATH, "..")
                next_div = parent.find_element(By.XPATH, "./following-sibling::*[1]")
                
                texture_links = next_div.find_elements(By.TAG_NAME, "a")
                
                textures = []
                for link in texture_links:
                    texture_name = link.text.strip()
                    texture_url = link.get_attribute("href")
                    
                    if texture_name and texture_url:
                        textures.append({
                            "name": texture_name,
                            "url": texture_url
                        })
                
                if textures:
                    print(f"Found {len(textures)} textures")
                    textures_data[product_name] = {
                        "url": product_url,
                        "textures": textures
                    }
                else:
                    print("No textures found")
                    
            except NoSuchElementException:
                print("No texture section")
                
        except TimeoutException:
            print("Timeout")
        except Exception as e:
            print(f"Error: {str(e)[:50]}")
        
        time.sleep(0.5)  # Избегаем блокировки

driver.quit()

# Сохранить результаты
print(f"\n\nTotal products with textures: {len(textures_data)}")
with open('textures_scraped.json', 'w', encoding='utf-8') as f:
    json.dump(textures_data, f, ensure_ascii=False, indent=2)

print("Results saved to textures_scraped.json")
