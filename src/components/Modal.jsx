// src/components/Modal.jsx
// --- ZoomableImage subcomponent ---
import React, { useEffect, useRef, useState } from 'react';

function ZoomableImage({ children }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(null);

  // Reset zoom on image change
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [children]);

  // Mouse wheel zoom handler
  function handleWheel(e) {
    e.preventDefault();
    if (!imgRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const prevScale = scale;
    let nextScale = scale + (e.deltaY < 0 ? 0.15 : -0.15);
    nextScale = Math.max(1, Math.min(5, nextScale));
    if (nextScale === prevScale) return;
    if (nextScale === 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 }); // Center when at minimum zoom
      return;
    }
    // Compute zoom towards mouse
    const dx = mouseX - rect.width / 2 - translate.x;
    const dy = mouseY - rect.height / 2 - translate.y;
    const ratio = (nextScale - prevScale) / prevScale;
    setTranslate({
      x: translate.x - dx * ratio,
      y: translate.y - dy * ratio,
    });
    setScale(nextScale);
  }

  // Mouse drag handlers for panning
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function handleMouseDown(e) {
    if (scale === 1) return;
    if (e.button !== 0) return; // Only left mouse button
    e.preventDefault(); // Prevent text selection and other default behaviors
    
    // Store starting position and current translation
    const startDrag = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: translate.x,
      startY: translate.y
    };
    setDrag(startDrag);
    
    // Define handlers here to capture latest state
    function handleMouseMove(ev) {
      if (!imgRef.current || !containerRef.current) return;
      
      // Calculate how far the mouse has moved from the starting position
      const dx = ev.clientX - startDrag.mouseX;
      const dy = ev.clientY - startDrag.mouseY;
      
      // Add that movement to the original translation
      let newX = startDrag.startX + dx;
      let newY = startDrag.startY + dy;
      
      // Calculate bounds to prevent dragging image out of view
      const rect = containerRef.current.getBoundingClientRect();
      const img = imgRef.current;
      
      // Calculate how much of the image extends beyond the container when zoomed
      const scaledWidth = img.naturalWidth * scale;
      const scaledHeight = img.naturalHeight * scale;
      const overflowX = Math.max(0, (scaledWidth - rect.width) / 2);
      const overflowY = Math.max(0, (scaledHeight - rect.height) / 2);
      
      // Clamp translation to keep image in view
      newX = clamp(newX, -overflowX, overflowX);
      newY = clamp(newY, -overflowY, overflowY);
      
      setTranslate({ x: newX, y: newY });
    }
    function handleMouseUp() {
      setDrag(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }
  // Remove global handleMouseMove and handleMouseUp

  // Only apply zoom/pan if child is an image
  const child = React.Children.only(children);
  if (child.type !== 'img') return <div className="flex items-center justify-center w-full h-full">{children}</div>;

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full h-full"
      style={{ maxWidth: '90vw', maxHeight: '90vh', userSelect: 'none' }}
      onWheel={handleWheel}
    >
      {/* Container with rounded corners and overflow hidden */}
      <div 
        className="overflow-hidden" 
        style={{ 
          borderRadius: '10px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {React.cloneElement(child, {
          ref: imgRef,
          style: {
            ...child.props.style,
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: drag ? 'none' : 'transform 0.15s',
            cursor: drag ? 'grabbing' : (scale > 1 ? 'grab' : 'zoom-in'),
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain'
            // Removed borderRadius and boxShadow from here
          },
          draggable: false,
          onDragStart: e => e.preventDefault(),
          onMouseDown: handleMouseDown
        })}
      </div>
    </div>
  );
}

// --- Modal main component ---
export default function Modal({ children, onClose }) {
  const overlayRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Trap focus inside modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
      // Trap tab focus
      if (e.key === 'Tab') {
        const focusable = [closeBtnRef.current];
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    // Focus the close button when modal opens
    closeBtnRef.current && closeBtnRef.current.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(40, 40, 40, 0.55)' }}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="relative bg-transparent outline-none flex items-center justify-center"
        style={{ maxWidth: '90vw', maxHeight: '90vh' }}
      >
        {/* Close button */}
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full focus:outline-none transition-all duration-100 z-10 border-2"
          style={{
            background: 'white',
            borderColor: 'rgb(1,44,95)',
            boxShadow: '0 2px 8px rgba(1,44,95,0.10)',
            cursor: 'pointer',
            padding: 0
          }}
          onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'} // Tailwind gray-100
          onMouseOut={e => e.currentTarget.style.background = 'white'}
        >
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 14 14" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            <path 
              d="M2.5 2.5L11.5 11.5M2.5 11.5L11.5 2.5" 
              stroke="rgb(1,44,95)" 
              strokeWidth="1.75" 
              strokeLinecap="round"
            />
          </svg>
        </button>
        {/* Modal content (hi-res image) */}
        <ZoomableImage>{children}</ZoomableImage>
      </div>
    </div>
  );
}
