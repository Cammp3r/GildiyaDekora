import { useEffect, useRef } from 'react'

export default function ImageDialog({ src, alt, onClose }) {
  const closeRef = useRef(null)
  useEffect(() => {
    const opener = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'Tab') {
        event.preventDefault()
        closeRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
    }
  }, [onClose])

  return (
    <div className="product-image-modal" role="dialog" aria-modal="true" aria-label={`Збільшене зображення: ${alt}`}>
      <button type="button" className="product-image-modal-backdrop" tabIndex={-1}
        onClick={onClose} aria-label="Закрити" />
      <button ref={closeRef} type="button" className="product-image-modal-close"
        onClick={onClose} aria-label="Закрити збільшене зображення">×</button>
      <img src={src} alt={alt} />
    </div>
  )
}
