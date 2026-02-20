import { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Modal.module.css';
import { createPortal } from 'react-dom';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  onNext,
  onPrev,
  showNext,
  showPrev
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && showPrev && onPrev) onPrev();
      if (e.key === 'ArrowRight' && showNext && onNext) onNext();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = previousOverflow;
      };
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onNext, onPrev, showNext, showPrev]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return createPortal(
    <div 
      className={styles.overlay} 
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {showPrev && (
        <button 
          className={`${styles.navButton} ${styles.navButtonLeft} ${styles.navButtonDesktop}`}
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous article"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {showNext && (
        <button 
          className={`${styles.navButton} ${styles.navButtonRight} ${styles.navButtonDesktop}`}
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next article"
        >
          <ChevronRight size={24} />
        </button>
      )}

      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>{title}</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.content}>
          {children}
        </div>

        {footer && (
          <div className={styles.footer}>
            {(showPrev || showNext) && (
              <div className={styles.mobileNav}>
                <button
                  type="button"
                  onClick={onPrev}
                  className={styles.mobileNavBtn}
                  disabled={!showPrev}
                  aria-label="Previous article"
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className={styles.mobileNavBtn}
                  disabled={!showNext}
                  aria-label="Next article"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
