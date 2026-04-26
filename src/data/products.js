import productsData from '../../oikos_all_products.json'

/**
 * Трансформує дані з JSON у формат, сумісний з UI
 */
function transformProductsData() {
  const products = []
  let productId = 1

  productsData.sections.forEach((section) => {
    const categoryName = section.title_ua || section.title
    const sectionImage = section.image

    // Обробка прямих продуктів (як в interior-decor)
    if (Array.isArray(section.products) && section.products.length > 0) {
      if (section.products[0].name) {
        // Це масив з безпосередніми продуктами
        section.products.forEach((product) => {
          products.push({
            id: productId++,
            title: product.name,
            category: categoryName,
            subcategory: product.subcategory || '',
            description: product.description,
            image: product.image || sectionImage,
            url: product.url,
            effect: product.effect,
            tags: product.tags || [],
            eco: product.eco || false,
          })
        })
      } else if (section.products[0].subcategory) {
        // Це масив з підкатегоріями (як в interior-paint, exterior-paint)
        section.products.forEach((subCategory) => {
          if (Array.isArray(subCategory.items)) {
            subCategory.items.forEach((product) => {
              products.push({
                id: productId++,
                title: product.name,
                category: categoryName,
                subcategory: subCategory.subcategory,
                description: product.description,
                image: product.image || sectionImage,
                url: product.url,
                effect: product.effect,
                tags: product.tags || [],
                eco: product.eco || false,
              })
            })
          }
        })
      }
    }
  })

  return products
}

export const productsDb = transformProductsData()
