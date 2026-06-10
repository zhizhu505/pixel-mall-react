import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ProductCard from '../components/h5/ProductCard';
import { useServices, useServiceSnapshot, useServiceVersion } from '../hooks/useServices';
import { showPixelToast } from '../utils/pixelToast';

const ShopPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { good, cart, user } = useServices();
  useServiceVersion(good);
  const shop = good.getShopById(shopId);
  const products = shop ? good.getGoodsByShopId(shop.id) : [];
  const currentUser = user.getCurrentUser();
  const [animatingProductId, setAnimatingProductId] = useState(null);
  const cartQuantityMap = useServiceSnapshot(cart, (service) => {
    if (!currentUser) {
      return {};
    }

    return service.getCartItems(currentUser.id).reduce((map, item) => ({
      ...map,
      [item.goodId]: item.count,
    }), {});
  });

  const handleAddToCart = (product) => {
    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(`/shop/${shopId}`)}`);
      return;
    }
    const result = cart.addItem(currentUser.id, product.id, 1);
    if (!result.success) {
      showPixelToast(result.message);
      return;
    }

    setAnimatingProductId(null);
    window.requestAnimationFrame(() => {
      setAnimatingProductId(product.id);
      window.setTimeout(() => setAnimatingProductId(null), 700);
    });
  };

  if (!shop) {
    return (
      <main className="pm-page pm-shop-page">
        <button className="pm-btn pm-btn-ghost pm-back-btn" type="button" onClick={() => navigate(-1)}>返回</button>
        <EmptyState title="店铺不存在" description="这家店铺可能暂时休息了。" iconSrc="/images/admin/empty/no-data-shop.svg" />
      </main>
    );
  }

  return (
    <main className="pm-page pm-shop-page">
      <button className="pm-btn pm-btn-ghost pm-back-btn" type="button" onClick={() => navigate(-1)}>返回</button>

      <section className="pm-shop-hero" aria-labelledby="shop-title">
        <div className="pm-shop-cover">
          <img src={shop.cover} alt={shop.name} />
        </div>
        <div className="pm-shop-hero-copy">
          <p className="pm-section-eyebrow">Pixel Store</p>
          <h1 id="shop-title">{shop.name}</h1>
          <strong>{shop.slogan}</strong>
          <p>{shop.description}</p>
          <div className="pm-shop-tags">
            {shop.tags.map((tag) => <span className="pm-tag pm-tag-info" key={tag}>{tag}</span>)}
          </div>
          <Button type="button" variant="ghost" onClick={() => navigate('/messages')}>联系店铺客服</Button>
        </div>
      </section>

      <section className="pm-shop-products" aria-labelledby="shop-products-title">
        <div className="pm-shop-section-heading">
          <h2 id="shop-products-title">店内精选</h2>
          <span>{products.length} 件好物</span>
        </div>
        {products.length ? (
          <div className="pm-shop-product-grid">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                showAddLink
                showSticker={false}
                cartQuantity={cartQuantityMap[product.id] || 0}
                isCartAnimating={animatingProductId === product.id}
                onAddToCart={handleAddToCart}
                className="pm-shop-product-card"
              />
            ))}
          </div>
        ) : (
          <EmptyState title="暂无上架商品" description="店主正在补货中。" iconSrc="/images/admin/empty/no-data-shop.svg" />
        )}
      </section>
    </main>
  );
};

export default ShopPage;
