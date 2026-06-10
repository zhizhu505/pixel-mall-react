import { useEffect, useState } from 'react';
import { getProductTone, resolveProductImageList } from '../../utils/productDisplay';

const ImageCarouselInner = ({ resolvedImages, alt, className, toneId, autoPlay, intervalMs }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState([]);
  const visibleImages = resolvedImages.filter((image) => !failedImages.includes(image));
  const hasMultipleImages = visibleImages.length > 1;
  const safeActiveIndex = visibleImages.length ? activeIndex % visibleImages.length : 0;
  const activeImage = visibleImages[safeActiveIndex] || '';

  useEffect(() => {
    if (!autoPlay || !hasMultipleImages) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleImages.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [autoPlay, hasMultipleImages, intervalMs, visibleImages.length]);

  const handlePrev = () => {
    setActiveIndex((current) => (current - 1 + visibleImages.length) % visibleImages.length);
  };

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % visibleImages.length);
  };

  const handleImageError = () => {
    setFailedImages((current) => (activeImage && !current.includes(activeImage) ? [...current, activeImage] : current));
  };

  return (
    <div className={`pm-image-carousel ${className}`.trim()} data-count={visibleImages.length}>
      {activeImage ? (
        <img src={activeImage} alt={alt} onError={handleImageError} />
      ) : (
        <div className={`pm-pixel-product pm-pixel-product-large ${getProductTone(toneId)}`} />
      )}
      {hasMultipleImages ? (
        <>
          <button className="pm-image-carousel-nav pm-image-carousel-prev" type="button" aria-label="上一张图片" onClick={handlePrev}>‹</button>
          <button className="pm-image-carousel-nav pm-image-carousel-next" type="button" aria-label="下一张图片" onClick={handleNext}>›</button>
          <div className="pm-image-carousel-dots" aria-label="图片轮播页码">
            {visibleImages.map((image, index) => (
              <button
                className={`pm-image-carousel-dot${index === safeActiveIndex ? ' is-active' : ''}`}
                key={`${image}-${index}`}
                type="button"
                aria-label={`查看第 ${index + 1} 张图片`}
                aria-current={index === safeActiveIndex ? 'true' : undefined}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
};

const ImageCarousel = ({ images = [], fallback = '/favicon.svg', alt = '', className = '', toneId = 0, autoPlay = true, intervalMs = 5000, minItems = 1 }) => {
  const baseImages = resolveProductImageList(images, fallback);
  const fallbackImage = resolveProductImageList([], fallback)[0] || fallback;
  const targetCount = Math.max(1, Number(minItems) || 1);
  const resolvedImages = [...baseImages];

  while (resolvedImages.length < targetCount) {
    resolvedImages.push(fallbackImage);
  }

  const resolvedImageKey = resolvedImages.join('|');

  return (
    <ImageCarouselInner
      key={resolvedImageKey}
      resolvedImages={resolvedImages}
      alt={alt}
      className={className}
      toneId={toneId}
      autoPlay={autoPlay}
      intervalMs={intervalMs}
    />
  );
};

export default ImageCarousel;
