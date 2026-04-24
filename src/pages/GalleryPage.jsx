import { useEffect, useState } from 'react'

export default function GalleryPage() {
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    
    // Завантажує всі фото з папки photos за допомогою import.meta.glob (Vite)
    const loadPhotos = async () => {
      const photoModules = import.meta.glob('../../photos/*.jpg', { 
        eager: true, 
        query: '?url', 
        import: 'default' 
      })
      const photoArray = Object.values(photoModules)
      setPhotos(photoArray)
    }
    
    loadPhotos()
  }, [])

  return (
    <>
      {/* Gallery Section */}
      <section className="gallery">
        <div className="container">
          <h2 className="section-title">Галерея <em>наших об'єктів</em></h2>
          <div className="gallery-grid">
            {photos.map((photo, index) => (
              <div className="gallery-item" key={index}>
                <img src={photo} alt={`Об'єкт ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
