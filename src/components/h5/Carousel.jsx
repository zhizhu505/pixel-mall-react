import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getProductTone } from '../../utils/productDisplay';

const Carousel = ({ items, intervalMs = 2500, className = '' }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [items.length, intervalMs]);

  if (!items.length) {
    return null;
  }

  const active = items[activeIndex];

  return (
    <section className={`pm-home-carousel ${className}`.trim()} aria-label="商品轮播">
      <Link
        className="pm-home-carousel-slide pm-home-carousel-slide-visual"
        to={`/detail/${active.id}`}
        aria-label={active.name}
      >
        <div className="pm-home-carousel-media">
          {active.cover ? (
            <img src={active.cover} alt="" />
          ) : (
            <div
              className={`pm-pixel-product pm-pixel-product-large ${getProductTone(active.id)}`}
              aria-hidden
            />
          )}
        </div>
      </Link>
      <div className="pm-home-carousel-dots" role="tablist" aria-label="轮播指示器">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-label={`第 ${index + 1} 张`}
            aria-selected={index === activeIndex}
            className={index === activeIndex ? 'is-active' : ''}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </section>
  );
};

export default Carousel;
