#!/usr/bin/env python3
"""
Script to collect all product images from Oikos website
Collects images from EXTERIOR-PAINT and NOVALIS-ECOENAMEL categories
"""

import json
import asyncio
import re
from playwright.async_api import async_playwright
from typing import Dict, List, Set

# Product paths for EXTERIOR-PAINT category
EXTERIOR_PAINT_PRODUCTS = {
    "Blankor": "/acrylics/blankor",
    "Neokryll": "/acrylics/neokryll",
    "Decorsil Primer": "/siloxanics/decorsilprimer",
    "Decorsil Primer Pigmentato": "/siloxanics/decorsilprimerpigmentato",
    "Consolidante per Calce": "/lime/consolidantepercalce",
    "Rasatura alla Calce": "/lime/rasaturacalce",
    "Rasokol": "/skim-coats-adhesives/rasokol",
    "Archital": "/acrylics/archital",
    "Neoquarz": "/acrylics/neoquarz",
    "Neoquarz Plus": "/acrylics/neoquarzplus",
    "O-Addensante": "/acrylics/oaddensante",
    "Biocompact": "/acrylsiloxanics/biocompact",
    "Duaflex": "/acrylsiloxanics/duaflex",
    "Silkos Torino": "/acrylsiloxanics/silkostorino",
    "Decorsil Firenze": "/siloxanics/decorsilfirenze",
    "Decorsil Roma": "/siloxanics/decorsilroma",
    "Veldecor": "/siloxanics/veldecor",
    "Biocompact Elastic": "/elastomerics/biocompactelastic",
    "Elastrong Gum": "/elastomerics/elastronggum",
    "Elastrong Paint Gum": "/elastomerics/elastrongpaintgum",
    "Pittura alla Calce": "/lime/pitturaallacalce",
    "Betoncryll Idrorepellente": "/protectives/betoncryllidrorepellente",
    "Betoncryll Pigmentato": "/protectives/betoncryllpigmentato",
    "Betoncryll Semitrasparente": "/protectives/betoncryllsemitrasparente",
    "Betoncryll Trasparente": "/protectives/betoncrylltrasparente",
    "Superfinish 24": "/protectives/superfinish24",
}

# Product paths for NOVALIS ECOENAMEL category
NOVALIS_PRODUCTS = {
    "Ecosmalto Ferromicaceo": "/novalis-ecoenamels/ferromicaceo",
    "Ecosmalto Metallizzato": "/novalis-ecoenamels/metallizzato",
    "Ecosmalto per Ceramica": "/novalis-ecoenamels/ecosmalto-per-ceramica",
    "Ecosmalto Thermo": "/novalis-ecoenamels/thermo",
    "Ecosmalto Universale": "/novalis-ecoenamels/universale",
    "Ecofondo Riempitivo": "/novalis-wood/ecofondoriempitivo",
    "Ecoimpregnante Legno": "/novalis-wood/ecoimpregnantelegno",
    "Ecoprotettivo Legno": "/novalis-wood/ecoprotettivolegno",
    "Ecoprotettivo Parquet": "/novalis-wood/ecoprotettivoparquet",
    "Turapori Ecologico": "/novalis-wood/turaporiecologico",
    "Aggrappante Ecologico": "/novalis-base-coats-protectives/aggrappanteecologico",
    "Antiruggine Ecologico": "/novalis-base-coats-protectives/antiruggineecologico",
    "Convertitore Ecologico": "/novalis-base-coats-protectives/convertitoreecologico",
    "Ecoprotettivo Ferro": "/novalis-base-coats-protectives/ecoprotettivoferro",
}

async def extract_images_from_page(page) -> List[str]:
    """Extract all image URLs from a product page"""
    images: Set[str] = set()
    
    try:
        # Get all img tags
        img_elements = await page.query_selector_all('img')
        for img in img_elements:
            src = await img.get_attribute('src')
            data_src = await img.get_attribute('data-src')
            if src:
                images.add(src)
            if data_src:
                images.add(data_src)
        
        # Get background images from inline styles
        elements = await page.query_selector_all('[style*="background-image"]')
        for elem in elements:
            style = await elem.get_attribute('style')
            if style:
                urls = re.findall(r'url\([\'"]?([^\'")\s]+)[\'"]?\)', style)
                for url in urls:
                    if url:
                        images.add(url)
        
        # Get picture sources
        sources = await page.query_selector_all('picture source')
        for source in sources:
            srcset = await source.get_attribute('srcset')
            if srcset:
                # Parse srcset which can contain multiple URLs
                urls = re.findall(r'([^\s,]+)\s+[^,]*', srcset)
                for url in urls:
                    if url and not url.endswith('x'):
                        images.add(url)
        
        # Get any video posters (for video thumbnails)
        videos = await page.query_selector_all('video')
        for video in videos:
            poster = await video.get_attribute('poster')
            if poster:
                images.add(poster)
    
    except Exception as e:
        print(f"Error extracting images: {e}")
    
    return sorted(list(images))

async def collect_product_images(products: Dict[str, str], base_url: str, category_name: str) -> List[Dict]:
    """Collect images for all products in a category"""
    result = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()
        
        for product_name, product_path in products.items():
            try:
                url = f"{base_url}{product_path}"
                print(f"Collecting images for {category_name}: {product_name} ({url})")
                
                await page.goto(url, wait_until="networkidle")
                await page.wait_for_timeout(500)  # Brief wait for dynamic content
                
                images = await extract_images_from_page(page)
                
                # Filter out irrelevant images (logos, generic elements)
                relevant_images = [
                    img for img in images 
                    if img and not any(x in img.lower() for x in ['logo', 'favicon', 'data:image'])
                ]
                
                product_data = {
                    "name": product_name,
                    "product_url": url,
                    "photos": relevant_images
                }
                
                result.append(product_data)
                print(f"  Found {len(relevant_images)} images")
                
            except Exception as e:
                print(f"Error collecting images for {product_name}: {e}")
                result.append({
                    "name": product_name,
                    "product_url": f"{base_url}{product_path}",
                    "photos": [],
                    "error": str(e)
                })
        
        await browser.close()
    
    return result

async def main():
    """Main function to collect all product images"""
    base_url = "https://www.oikos.ua"
    
    print("Starting image collection from Oikos website...")
    print(f"Base URL: {base_url}\n")
    
    # Collect images from both categories
    print("=" * 60)
    print("Collecting EXTERIOR-PAINT products...")
    print("=" * 60)
    exterior_paint = await collect_product_images(EXTERIOR_PAINT_PRODUCTS, base_url, "EXTERIOR-PAINT")
    
    print("\n" + "=" * 60)
    print("Collecting NOVALIS ECOENAMEL products...")
    print("=" * 60)
    novalis = await collect_product_images(NOVALIS_PRODUCTS, base_url, "NOVALIS ECOENAMEL")
    
    # Compile final result
    result = {
        "exterior-paint": exterior_paint,
        "novalis": novalis,
        "metadata": {
            "total_exterior_paint_products": len(exterior_paint),
            "total_novalis_products": len(novalis),
            "source": base_url,
            "collection_date": __import__('datetime').datetime.now().isoformat()
        }
    }
    
    # Save to JSON file
    output_file = "product_images_collection.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 60)
    print("Collection Complete!")
    print("=" * 60)
    print(f"Results saved to: {output_file}")
    print(f"Total EXTERIOR-PAINT products: {len(exterior_paint)}")
    print(f"Total NOVALIS products: {len(novalis)}")
    
    # Print summary
    total_images_exterior = sum(len(p.get('photos', [])) for p in exterior_paint)
    total_images_novalis = sum(len(p.get('photos', [])) for p in novalis)
    print(f"Total images collected (EXTERIOR-PAINT): {total_images_exterior}")
    print(f"Total images collected (NOVALIS): {total_images_novalis}")

if __name__ == "__main__":
    asyncio.run(main())
