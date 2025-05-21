// src/components/ThumbnailGrid.jsx
// Updated to use Modal for hi-res image popup
import React, { useState, useCallback, useEffect } from 'react';
import Modal from './Modal';

export default function ThumbnailGrid({ photos, setMoreLikeThisPhoto }) {
  const [fullImage, setFullImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedImage, setLoadedImage] = useState(null);

  // Find the selected photo object by id
  const currentPhoto = fullImage
    ? photos.find(p => p.id === fullImage)
    : null;

  // Preload image when a thumbnail is clicked
  useEffect(() => {
    if (!currentPhoto) {
      setLoadedImage(null);
      return;
    }
    
    setIsLoading(true);
    
    const img = new Image();
    img.onload = () => {
      setLoadedImage(currentPhoto);
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
      // Could add error handling here
    };
    img.src = currentPhoto.hiResUrl;
  }, [currentPhoto]);

  const handleClose = useCallback(() => {
    setFullImage(null);
    setLoadedImage(null);
  }, []);

  return (
    <>
      {/* Loading indicator overlay - same semi-transparent background as modal */}
      {isLoading && currentPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(40, 40, 40, 0.55)' }}>
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
            {/* Loading spinner */}
            <svg className="animate-spin h-5 w-5 text-[rgb(1,44,95)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-center font-FuturaPTMedium text-[rgb(1,44,95)]">Loading image...</p>
          </div>
        </div>
      )}
      
      {/* Modal with fully loaded image */}
      {loadedImage && !isLoading && (
        <Modal 
          onClose={handleClose}
          onMoreLikeThis={() => {
            console.log('More like this clicked', loadedImage);
            setMoreLikeThisPhoto(loadedImage);
            handleClose();
          }}
        >
          <img
            src={loadedImage.hiResUrl}
            alt="Full resolution"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              objectFit: 'contain',
              borderRadius: '10px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.3)'
            }}
          />
        </Modal>
      )}

      <main
        className="
          flex-1
          p-4
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
          xl:grid-cols-6
          2xl:grid-cols-8
          gap-4
          overflow-auto
        "
      >
        {photos.map(photo => (
          <img
            key={photo.id}
            src={photo.thumbnailUrl}
            alt={`Photo ${photo.id}`}
            onClick={() => setFullImage(photo.id)}
            className="
              w-full h-auto cursor-pointer
              transition-transform duration-200 ease-in-out hover:scale-107
              rounded-md
            "
          />
        ))}
      </main>
    </>
  );
}
