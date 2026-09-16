import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedPage = Number(searchParams.get('page'))
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const photosPerPage = 12
  const totalPages = Math.ceil(galleryPhotos.length / photosPerPage)
  const safePage = Math.min(currentPage, totalPages || 1)
  const visiblePhotos = galleryPhotos.slice((safePage - 1) * photosPerPage, safePage * photosPerPage)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [safePage])

  const goToPage = (page) => {
    const nextPage = Math.max(1, Math.min(page, totalPages))
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
  }

  const galleryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: 'Галерея робіт Гільдії Декора',
    image: visiblePhotos.map((photo) => photo),
  }

  return (
    <>
      <Seo
        title="Галерея робіт"
        description="Галерея реалізованих обʼєктів Гільдії Декору: декоративні покриття, фарби OIKOS та інтерʼєрні рішення у Києві."
        canonicalPath={safePage === 1 ? '/gallery/' : `/gallery/?page=${safePage}`}
        jsonLd={galleryJsonLd}
      />
      {/* Gallery Section */}
      <section className="gallery">
        <div className="container">
          <h1 className="section-title">Галерея <em>наших об'єктів</em></h1>
          <div className="gallery-grid">
            {visiblePhotos.map((photo, index) => (
              <div className="gallery-item" key={photo}>
                <img
                  src={photo}
                  alt={`Об'єкт ${(safePage - 1) * photosPerPage + index + 1} — декоративне оформлення інтер'єру`}
                  loading={index < 4 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="pagination gallery-pagination" aria-label="Сторінки галереї">
              <button type="button" onClick={() => goToPage(safePage - 1)} disabled={safePage === 1}>
                Попередня
              </button>
              <span>Сторінка {safePage} з {totalPages}</span>
              <button type="button" onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages}>
                Наступна
              </button>
            </nav>
          )}
        </div>
      </section>
    </>
  )
}
