import { Link } from 'react-router-dom';

import { formatPrice, getProductTone } from '../../utils/productDisplay';

const ProductCard = ({
  product,
  index = 0,
  showSticker = true,
  showAddLink = false,
  onAddToCart,
  className = '',
}) => {
  const tone = getProductTone(product.id);
  const sticker = String(index + 1).padStart(2, '0');
  const isSoldOut = product.stock <= 0 || product.status !== 'on-sale';

  return (
    <article className={`pm-product-card pm-product-card-collectible pm-home-product-card ${className}`.trim()}>
      {showSticker ? <span className="pm-sticker-label pm-home-product-sticker">{sticker}</span> : null}
      <div className="pm-product-media">
        {product.cover ? (
          <img src={product.cover} alt={product.name} />
        ) : (
          <div className={`pm-pixel-product ${tone}`} />
        )}
      </div>
      <div className="pm-home-product-meta">
        <span>{product.categoryName || '像素好物'}</span>
        <h3 className="pm-product-title">{product.name}</h3>
        <div className="pm-product-foot">
          <strong className="pm-price">{formatPrice(product.price)}</strong>
          <Link to={`/detail/${product.id}`}>详情</Link>
          {showAddLink && onAddToCart ? (
            <button
              className="pm-btn pm-btn-ghost"
              type="button"
              disabled={isSoldOut}
              onClick={() => onAddToCart(product)}
            >
              加购
            </button>
          ) : null}
        </div>
        {isSoldOut ? <span className="pm-tag pm-tag-muted">不可购买</span> : null}
      </div>
    </article>
  );
};

export default ProductCard;
