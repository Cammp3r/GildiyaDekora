import fs from 'fs';

console.log('Starting interior-paint photo merge...');

try {
  // Read files
  console.log('Reading dtb.json...');
  const dtbData = JSON.parse(fs.readFileSync('dtb.json', 'utf-8'));
  
  console.log('Reading interior_paint_photos.json...');
  const ipPhotosData = JSON.parse(fs.readFileSync('interior_paint_photos.json', 'utf-8'));
  
  // Create lookup map for interior-paint images
  const ipImageMap = {};
  
  if (ipPhotosData['interior-paint']) {
    ipPhotosData['interior-paint'].forEach(product => {
      ipImageMap[product.name.toLowerCase().trim()] = product.photos || [];
    });
  }
  
  console.log(`Loaded ${Object.keys(ipImageMap).length} interior-paint products from photo collection`);
  
  // Update dtb.json with interior-paint photos
  let photoMatchCount = 0;
  const sections = Array.isArray(dtbData) ? dtbData : Object.values(dtbData).flat().filter(s => s.products);
  
  sections.forEach(section => {
    if (section.id === 'interior-paint' && section.products) {
      section.products.forEach(product => {
        const productName = product.name.toLowerCase().trim();
        
        // Direct match in interior-paint products
        if (ipImageMap[productName] && ipImageMap[productName].length > 0) {
          if (!product.photos || product.photos.length === 0) {
            product.photos = ipImageMap[productName];
            photoMatchCount++;
            console.log(`✓ Added ${ipImageMap[productName].length} photos to ${product.name}`);
          }
        }
      });
    }
  });
  
  // Save updated database
  fs.writeFileSync('dtb.json', JSON.stringify(dtbData, null, 2), 'utf-8');
  
  console.log(`\n✓ Database updated successfully!`);
  console.log(`\n📊 Interior-Paint Photo Merge Statistics:`);
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
    console.log(`  - Completeness: ${Math.round((withColors + withPhotos) / (products.length * 2) * 100)}%`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
