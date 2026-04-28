import fs from 'fs';

console.log('Starting merge process...');

try {
  // Read both files
  console.log('Reading dtb.json...');
  const dtbData = JSON.parse(fs.readFileSync('dtb.json', 'utf-8'));
  
  console.log('Reading oikos_products_data.json...');
  const productsData = JSON.parse(fs.readFileSync('oikos_products_data.json', 'utf-8'));
  
  // Create lookup map
  const colorMap = {};
  
  // Add interior-paint
  if (productsData['interior-paint']) {
    productsData['interior-paint'].forEach(product => {
      colorMap[product.name.toLowerCase().trim()] = {
        colors: product.color_samples || [],
        photos: product.photos || []
      };
    });
  }
  
  // Add exterior-paint
  if (productsData['exterior-paint']) {
    productsData['exterior-paint'].forEach(product => {
      colorMap[product.name.toLowerCase().trim()] = {
        colors: product.color_samples || [],
        photos: product.photos || []
      };
    });
  }
  
  // Add novalis
  if (productsData['novalis']) {
    productsData['novalis'].forEach(product => {
      colorMap[product.name.toLowerCase().trim()] = {
        colors: product.color_samples || [],
        photos: product.photos || []
      };
    });
  }
  
  console.log(`Loaded ${Object.keys(colorMap).length} products from oikos_products_data.json`);
  
  // Update dtb.json
  let colorMatchCount = 0;
  let photoMatchCount = 0;
  
  const sections = Array.isArray(dtbData) ? dtbData : dtbData.sections || Object.values(dtbData);
  
  sections.forEach(section => {
    if (section.products) {
      section.products.forEach(product => {
        const productName = product.name.toLowerCase().trim();
        
        // Search in colorMap
        for (const key in colorMap) {
          if (productName === key || key.includes(productName) || productName.includes(key)) {
            // Add colors if missing
            if (!product.colors || product.colors.length === 0) {
              if (colorMap[key].colors && colorMap[key].colors.length > 0) {
                product.colors = colorMap[key].colors;
                colorMatchCount++;
              }
            }
            
            // Add photos if missing
            if (!product.photos || product.photos.length === 0) {
              if (colorMap[key].photos && colorMap[key].photos.length > 0) {
                product.photos = colorMap[key].photos;
                photoMatchCount++;
              }
            }
            break;
          }
        }
      });
    }
  });
  
  // Save updated database
  fs.writeFileSync('dtb_updated.json', JSON.stringify(dtbData, null, 2), 'utf-8');
  
  console.log('\n✓ File successfully updated: dtb_updated.json');
  console.log(`\n📊 Merge Statistics:`);
  console.log(`  - Products with colors added: ${colorMatchCount}`);
  console.log(`  - Products with photos added: ${photoMatchCount}`);
  
  // Print section stats
  console.log('\n📊 Section Statistics:');
  sections.forEach(section => {
    const sectionName = section.title || section.id || 'Unknown';
    const products = section.products || [];
    const withColors = products.filter(p => p.colors && p.colors.length > 0).length;
    const withPhotos = products.filter(p => p.photos && p.photos.length > 0).length;
    
    console.log(`\n${sectionName}:`);
    console.log(`  - Total products: ${products.length}`);
    console.log(`  - With colors: ${withColors}`);
    console.log(`  - With photos: ${withPhotos}`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
