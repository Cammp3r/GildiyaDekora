import { useEffect } from 'react'
import { Seo } from '../seo/Seo.jsx'

const photoModules = import.meta.glob('../../photos/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const galleryPhotos = Object.entries(photoModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url)

export default function GalleryPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  return (
    <>
      <Seo
        title="Галерея робіт"
        description="Галерея реалізованих обʼєктів Гільдії Декору: декоративні покриття, фарби OIKOS та інтерʼєрні рішення у Києві."
        canonicalPath="/gallery"
      />
      {/* Gallery Section */}
      <section className="gallery">
        <div className="container">
          <h1 className="section-title">Галерея <em>наших об'єктів</em></h1>
          <div className="gallery-grid">
            {galleryPhotos.map((photo, index) => (
              <div className="gallery-item" key={index}>
                <img
                  src={photo}
                  alt={`Об'єкт ${index + 1}`}
                  loading={index < 4 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
