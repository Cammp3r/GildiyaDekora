#!/usr/bin/env python3
"""
Скрипт для отримання продуктів ORAC DECOR з сайту
"""

import json
import time
from urllib.parse import quote
from bs4 import BeautifulSoup
import requests

BASE_URL = "https://orac-decor.com"

# Категорії ORAC DECOR
CATEGORIES = {
    "Декоративні елементи": "декоративні-елементи",
    "Карнизи": "карнизи",
    "Клей": "клей",
    "Молдинг": "молдинг",
    "Плінтус": "плінтус",
    "Приховане освітлення": "приховане-освітлення"
}

def clean_price(price_str):
    """Видаляє символи валюти та форматує ціну"""
    if not price_str:
        return 0
    # Витягує числа
    price = price_str.replace('₴', '').replace(',', '').strip()
    try:
        return int(float(price))
    except:
        return 0

def fetch_category_products(category_name, category_slug):
    """Отримує всі продукти з однієї категорії"""
    url = f"{BASE_URL}/product-category/{category_slug}/"
    print(f"Fetching: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            print(f"  Status: {response.status_code}")
            return []
        
        soup = BeautifulSoup(response.content, 'html.parser')
        products = []
        seen_ids = set()
        
        # Знаходимо всі продукти
        product_items = soup.find_all(['li', 'div'], class_=lambda x: x and 'product' in x.lower())
        
        for item in product_items:
            title_elem = item.find(['h2', 'h3', 'a'], class_=lambda x: x and ('title' in x.lower() or 'product' in x.lower()))
            if not title_elem:
                title_elem = item.find('a')
            
            title = title_elem.get_text(strip=True) if title_elem else ""
            
            if not title or len(title) < 2:
                continue
            
            # Отримуємо посилання
            link_elem = item.find('a', href=lambda x: x and '/product/' in x)
            link = link_elem.get('href', '') if link_elem else ""
            
            # Отримуємо ціну
            price_elem = item.find(['span', 'div'], class_=lambda x: x and 'price' in x.lower())
            price_text = price_elem.get_text(strip=True) if price_elem else "₴ 0"
            price = clean_price(price_text)
            
            # Отримуємо зображення
            img_elem = item.find('img')
            image = img_elem.get('src', '') if img_elem else ""
            
            # Генеруємо унікальний ID
            product_id = f"orac-{title.lower().replace(' ', '-')}"
            if product_id in seen_ids:
                continue
            seen_ids.add(product_id)
            
            if title and link:
                products.append({
                    "id": product_id,
                    "name": title,
                    "url": link,
                    "photos": [image] if image else [],
                    "price": price,
                    "price_currency": "UAH",
                    "description": f"Продукт ORAC DECOR - {title}",
                    "type": "Декоративний елемент"
                })
        
        print(f"  Found {len(products)} products")
        return products
    
    except Exception as e:
        print(f"  Error: {e}")
        return []

def main():
    """Основна функція"""
    all_products = {}
    
    for category_name, category_slug in CATEGORIES.items():
        print(f"\n=== {category_name} ===")
        products = fetch_category_products(category_name, category_slug)
        all_products[category_name] = products
        time.sleep(1)  # Затримка між запитами
    
    # Зберігаємо результати
    output = {
        "brand": "ORAC DECOR",
        "dealer": "Гільдія Декору",
        "country": "Україна",
        "updated": "2026-05-05",
        "base_url": "https://orac-decor.com",
        "categories": all_products,
        "total_products": sum(len(products) for products in all_products.values())
    }
    
    with open('orac_products.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n\n✓ Total products: {output['total_products']}")
    print(f"✓ Saved to: orac_products.json")

if __name__ == "__main__":
    main()
