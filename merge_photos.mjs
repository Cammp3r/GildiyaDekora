import fs from 'fs';

console.log('Starting photo merge process...');

try {
  // Read files
  console.log('Reading dtb.json...');
  const dtbData = JSON.parse(fs.readFileSync('dtb.json', 'utf-8'));
  
  console.log('Reading product_images_collection.json...');
  const imagesData = JSON.parse(fs.readFileSync('product_images_collection.json', 'utf-8'));
  
  // Create lookup map for images
  const imageMap = {};
  
  // Add exterior-paint images
  if (imagesData['exterior-paint']) {
    imagesData['exterior-paint'].forEach(product => {
      imageMap[product.name.toLowerCase().trim()] = product.photos || [];
    });
  }
  
  // Add novalis images
  if (imagesData['novalis']) {
    imagesData['novalis'].forEach(product => {
      imageMap[product.name.toLowerCase().trim()] = product.photos || [];
    });
  }
  
  console.log(`Loaded ${Object.keys(imageMap).length} products from image collection`);
  
  // Update dtb.json with photos
  let photoMatchCount = 0;
  const sections = Array.isArray(dtbData) ? dtbData : Object.values(dtbData).flat().filter(s => s.products);
  
  sections.forEach(section => {
    if (section.products) {
      section.products.forEach(product => {
        const productName = product.name.toLowerCase().trim();
        
        // Search in imageMap
        for (const key in imageMap) {
          if (productName === key || key.includes(productName) || productName.includes(key)) {
            // Add photos if missing or if we have new photos
            if ((!product.photos || product.photos.length === 0) && imageMap[key].length > 0) {
              product.photos = imageMap[key];
              photoMatchCount++;
              console.log(`✓ Added ${imageMap[key].length} photos to ${product.name}`);
            }
            break;
          }
        }
      });
    }
  });
  
  // Save updated database
  fs.writeFileSync('dtb.json', JSON.stringify(dtbData, null, 2), 'utf-8');
  
  console.log(`\n✓ Database updated successfully!`);
  console.log(`\n📊 Photo Merge Statistics:`);
  console.log(`  - Products with photos added: ${photoMatchCount}`);
  
  // Print final section stats
  console.log('\n📊 Final Section Statistics:');
  sections.forEach(section => {
    const sectionName = section.title || section.id || 'Unknown';
    const products = section.products || [];
    const withColors = products.filter(p => p.colors && p.colors.length > 0).length;
    const withPhotos = products.filter(p => p.photos && p.photos.length > 0).length;
    
    console.log(`\n${sectionName}:`);
    console.log(`  - Total products: ${products.length}`);
    console.log(`  - With colors: ${withColors}`);
    console.log(`  - With photos: ${withPhotos}`);
    console.log(`  - Complete: ${withColors > 0 && withPhotos > 0 ? '✓' : '✗'}`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
