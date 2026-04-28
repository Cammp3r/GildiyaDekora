import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin

BASE_URL = "https://www.oikos.ua"

# Product lists for each section
INTERIOR_PAINT_PRODUCTS = [
    {"name": "BIAMAX", "href": "/paints/biamax"},
    {"name": "COPRIMAX", "href": "/paints/coprimax"},
    {"name": "DRYWALL PAINT", "href": "/paints/drywallpaint"},
    {"name": "EXTRAPAINT", "href": "/paints/extrapaint"},
    {"name": "MULTIFUND", "href": "/paints/multifund"},
    {"name": "PITTURA ALLA CALCE VERONA", "href": "/paints/pitturaallacalceverona"},
    {"name": "SIRIUS 2001", "href": "/paints/sirius2001"},
    {"name": "SUPERCOLOR", "href": "/paints/supercolor"},
    {"name": "SUPERMATT", "href": "/paints/supermatt"},
    {"name": "TOPMATT", "href": "/paints/topmatt"},
    {"name": "ULTRASATEN", "href": "/paints/ultrasaten"},
    {"name": "WALLSATIN", "href": "/paints/wallsatin"}
]

EXTERIOR_PAINT_PRODUCTS = [
    {"name": "BLANKOR", "href": "/acrylics/blankor"},
    {"name": "NEOKRYLL", "href": "/acrylics/neokryll"},
    {"name": "DECORSIL PRIMER", "href": "/siloxanics/decorsilprimer"},
    {"name": "DECORSIL PRIMER PIGMENTATO", "href": "/siloxanics/decorsilprimerpigmentato"},
    {"name": "CONSOLIDANTE PER CALCE", "href": "/lime/consolidantepercalce"},
    {"name": "RASATURA ALLA CALCE", "href": "/lime/rasaturacalce"},
    {"name": "RASOKOL", "href": "/skim-coats-adhesives/rasokol"},
    {"name": "ARCHITAL", "href": "/acrylics/archital"},
    {"name": "NEOQUARZ", "href": "/acrylics/neoquarz"},
    {"name": "NEOQUARZ PLUS", "href": "/acrylics/neoquarzplus"},
    {"name": "O-ADDENSANTE", "href": "/acrylics/oaddensante"},
    {"name": "BIOCOMPACT", "href": "/acrylsiloxanics/biocompact"},
    {"name": "DUAFLEX", "href": "/acrylsiloxanics/duaflex"},
    {"name": "SILKOS TORINO", "href": "/acrylsiloxanics/silkostorino"},
    {"name": "DECORSIL FIRENZE", "href": "/siloxanics/decorsilfirenze"},
    {"name": "DECORSIL ROMA", "href": "/siloxanics/decorsilroma"},
    {"name": "VELDECOR", "href": "/siloxanics/veldecor"},
    {"name": "PITTURA ALLA CALCE", "href": "/lime/pitturaallacalce"}
]

NOVALIS_PRODUCTS = [
    {"name": "ECOSMALTO FERROMICACEO", "href": "/novalis-ecoenamels/ferromicaceo"},
    {"name": "ECOSMALTO METALLIZZATO", "href": "/novalis-ecoenamels/metallizzato"},
    {"name": "ECOSMALTO PER CERAMICA", "href": "/novalis-ecoenamels/ecosmalto-per-ceramica"},
    {"name": "ECOSMALTO THERMO", "href": "/novalis-ecoenamels/thermo"},
    {"name": "ECOSMALTO UNIVERSALE", "href": "/novalis-ecoenamels/universale"},
    {"name": "ECOFONDO RIEMPITIVO", "href": "/novalis-wood/ecofondoriempitivo"},
    {"name": "ECOIMPREGNATE LEGNO", "href": "/novalis-wood/ecoimpregnantelegno"},
    {"name": "ECOPROTETTIVO LEGNO", "href": "/novalis-wood/ecoprotettivolegno"},
    {"name": "ECOPROTETTIVO PARQUET", "href": "/novalis-wood/ecoprotettivoparquet"},
    {"name": "TURAPORI ECOLOGICO", "href": "/novalis-wood/turaporiecologico"},
    {"name": "AGGRAPPANTE ECOLOGICO", "href": "/novalis-base-coats-protectives/aggrappanteecologico"},
    {"name": "ANTIRUGGINE ECOLOGICO", "href": "/novalis-base-coats-protectives/antiruggineecologico"},
    {"name": "CONVERTITORE ECOLOGICO", "href": "/novalis-base-coats-protectives/convertitoreecologico"},
    {"name": "ECOPROTETTIVO FERRO", "href": "/novalis-base-coats-protectives/ecoprotettivoferro"}
]

def extract_colors_count(text):
    """Extract colors count from description text"""
    import re
    match = re.search(r'(\d+)\s*(?:відтінків|colors|оттенков)', text, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None

def collect_product_data(product_href):
    """Collect data for a single product"""
    try:
        url = urljoin(BASE_URL, product_href)
        print(f"Fetching: {url}")
        
        response = requests.get(url, timeout=10)
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            print(f"Failed to fetch {url}: {response.status_code}")
            return None
            
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Get product name
        name = None
        blockquote = soup.find('blockquote')
        if blockquote:
            name = blockquote.get_text(strip=True)
        
        # Get all images on the page (product photos and color samples)
        photos = set()
        images = soup.find_all('img')
        for img in images:
            src = img.get('src', '')
            if src and '/public' in src:
                full_url = urljoin(BASE_URL, src)
                photos.add(full_url)
        
        # Get background images
        styles = soup.find_all(style=True)
        for elem in soup.find_all():
            style = elem.get('style', '')
            if 'background-image' in style:
                import re
                match = re.search(r'url\(["\']?([^"\'()]+)["\']?\)', style)
                if match:
                    img_url = match.group(1)
                    if '/public' in img_url:
                        full_url = urljoin(BASE_URL, img_url)
                        photos.add(full_url)
        
        # Get colors count from description
        colors_count = None
        description_text = soup.get_text()
        colors_count = extract_colors_count(description_text)
        
        # Get color samples from links
        color_samples = []
        links = soup.find_all('a')
        for link in links:
            href = link.get('href', '')
            if '/texture/' in href:
                color_code = link.get_text(strip=True)
                if color_code:
                    full_url = urljoin(BASE_URL, href)
                    color_samples.append({
                        "code": color_code,
                        "img": full_url
                    })
        
        # Remove duplicate color samples
        seen = set()
        unique_samples = []
        for sample in color_samples:
            if sample['code'] not in seen:
                seen.add(sample['code'])
                unique_samples.append(sample)
        
        # Filter out texture images from photos if they're already in color samples
        texture_urls = {s['img'] for s in unique_samples}
        filtered_photos = [p for p in photos if p not in texture_urls]
        
        result = {
            "name": name or "UNKNOWN",
            "photos": list(filtered_photos)[:20],  # Limit to 20 photos
            "colors_count": colors_count,
            "color_samples": unique_samples
        }
        
        return result
        
    except Exception as e:
        print(f"Error processing {product_href}: {e}")
        return None

def main():
    """Main function to collect all data"""
    print("Starting Oikos data collection...")
    
    result = {
        "interior-paint": [],
        "exterior-paint": [],
        "novalis": []
    }
    
    # Collect interior paint products
    print("\n=== Interior Paint Products ===")
    for product in INTERIOR_PAINT_PRODUCTS:
        data = collect_product_data(product["href"])
        if data:
            result["interior-paint"].append(data)
        time.sleep(0.5)  # Be nice to the server
    
    # Collect exterior paint products
    print("\n=== Exterior Paint Products ===")
    for product in EXTERIOR_PAINT_PRODUCTS:
        data = collect_product_data(product["href"])
        if data:
            result["exterior-paint"].append(data)
        time.sleep(0.5)
    
    # Collect novalis products
    print("\n=== Novalis Products ===")
    for product in NOVALIS_PRODUCTS:
        data = collect_product_data(product["href"])
        if data:
            result["novalis"].append(data)
        time.sleep(0.5)
    
    # Save results to file
    output_file = "oikos_products_data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Data saved to {output_file}")
    
    # Print summary
    print(f"\nSummary:")
    print(f"- Interior Paint: {len(result['interior-paint'])} products")
    print(f"- Exterior Paint: {len(result['exterior-paint'])} products")
    print(f"- Novalis: {len(result['novalis'])} products")

if __name__ == "__main__":
    main()
