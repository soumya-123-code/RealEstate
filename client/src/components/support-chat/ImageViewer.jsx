import { useState, useRef, useEffect, useCallback } from "react";
import { FiX, FiDownload, FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut } from "react-icons/fi";

export default function ImageViewer({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState(null);

  const viewerRef = useRef(null);
  const pinchStartRef = useRef(null);

  const currentImage = images?.[currentIndex] || images?.[0];

  // ── Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") navigatePrev();
      if (e.key === "ArrowRight") navigateNext();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images, onClose]);

  // ── Prevent body scroll ─────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const navigatePrev = useCallback(() => {
    if (images && images.length > 1) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [images]);

  const navigateNext = useCallback(() => {
    if (images && images.length > 1) {
      setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [images]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev / 1.25, 1);
      if (newZoom === 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleDownload = useCallback(() => {
    if (!currentImage) return;
    const link = document.createElement("a");
    link.href = currentImage;
    link.download = `image-${currentIndex + 1}`;
    link.target = "_blank";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentImage, currentIndex]);

  // ── Mouse drag for pan ──────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ── Touch handlers for pinch-to-zoom and swipe ─────────────────────────
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    } else if (e.touches.length === 2) {
      pinchStartRef.current = {
        distance: Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        ),
        zoom: zoom,
      };
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();

    if (e.touches.length === 2 && pinchStartRef.current) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = distance / pinchStartRef.current.distance;
      const newZoom = Math.min(Math.max(pinchStartRef.current.zoom * scale, 1), 5);
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches.length === 1 && touchStart && zoom === 1) {
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Swipe threshold: 50px
      if (absDx > absDy && absDx > 50) {
        if (dx > 0) navigatePrev();
        else navigateNext();
      }
    }

    pinchStartRef.current = null;
    setTouchStart(null);
  };

  if (!currentImage) return null;

  const hasMultiple = images && images.length > 1;

  return (
    <div className="sc-image-viewer" ref={viewerRef}>
      {/* Background overlay */}
      <div className="sc-image-viewer__backdrop" onClick={onClose} />

      {/* Toolbar */}
      <div className="sc-image-viewer__toolbar">
        <button
          type="button"
          className="sc-image-viewer__btn"
          onClick={onClose}
          title="Close"
        >
          <FiX size={20} />
        </button>

        <div className="sc-image-viewer__toolbar-center">
          {hasMultiple && (
            <span className="sc-image-viewer__counter">
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>

        <div className="sc-image-viewer__toolbar-right">
          <button
            type="button"
            className="sc-image-viewer__btn"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            title="Zoom out"
          >
            <FiZoomOut size={16} />
          </button>
          <button
            type="button"
            className="sc-image-viewer__btn"
            onClick={resetZoom}
            title="Reset zoom"
          >
            <span style={{ fontSize: "11px", fontWeight: 600 }}>
              {Math.round(zoom * 100)}%
            </span>
          </button>
          <button
            type="button"
            className="sc-image-viewer__btn"
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            title="Zoom in"
          >
            <FiZoomIn size={16} />
          </button>
          <button
            type="button"
            className="sc-image-viewer__btn"
            onClick={handleDownload}
            title="Download"
          >
            <FiDownload size={16} />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="sc-image-viewer__container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={currentImage}
          alt={`Image ${currentIndex + 1}`}
          className="sc-image-viewer__image"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
          draggable={false}
        />
      </div>

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button
            type="button"
            className="sc-image-viewer__nav sc-image-viewer__nav--prev"
            onClick={navigatePrev}
          >
            <FiChevronLeft size={28} />
          </button>
          <button
            type="button"
            className="sc-image-viewer__nav sc-image-viewer__nav--next"
            onClick={navigateNext}
          >
            <FiChevronRight size={28} />
          </button>
        </>
      )}

      {/* Dot indicators on mobile */}
      {hasMultiple && (
        <div className="sc-image-viewer__dots">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={`sc-image-viewer__dot${idx === currentIndex ? " sc-image-viewer__dot--active" : ""}`}
              onClick={() => {
                setCurrentIndex(idx);
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
