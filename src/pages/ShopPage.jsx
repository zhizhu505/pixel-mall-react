import { useNavigate, useParams } from 'react-router-dom';

import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ProductCard from '../components/h5/ProductCard';
import { useServices, useServiceVersion } from '../hooks/useServices';
import { getProductPriceInfo } from '../utils/productDisplay';

const ShopPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { good } = useServices();
  useServiceVersion(good);
  const shop = good.getShopById(shopId);
  const products = shop ? good.getGoodsByShopId(shop.id) : [];
  const lowestPrice = products.length
    ? Math.min(...products.map((product) => getProductPriceInfo(product).currentPrice))
    : 0;
  const discountCount = products.filter((product) => {
    const priceInfo = getProductPriceInfo(product);
    return priceInfo.hasDiscount || Boolean(priceInfo.saleTag);
  }).length;
  const topCategories = Array.from(new Set(products.map((product) => product.categoryName).filter(Boolean))).slice(0, 3);

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
      <section className="pm-shop-hero" aria-labelledby="shop-title">
        <button className="pm-btn pm-btn-ghost pm-back-btn pm-shop-back-btn" type="button" onClick={() => navigate(-1)}>
          返回
        </button>
        <div className="pm-shop-hero-main">
          <div className="pm-shop-cover">
            <img src={shop.cover} alt={shop.name} />
          </div>
          <div className="pm-shop-hero-copy">
            <p className="pm-section-eyebrow">Pixel Store</p>
            <h1 id="shop-title">{shop.name}</h1>
            <strong>{shop.slogan}</strong>
            <p>{shop.description}</p>
            <div className="pm-shop-highlight-row">
              {topCategories.map((category) => (
                <span className="pm-shop-highlight-chip" key={category}>{category}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="pm-shop-hero-side">
          <div className="pm-shop-highlight-row">
            <span className="pm-shop-side-label">店铺亮点</span>
            {shop.tags.map((tag) => <span className="pm-tag pm-tag-info" key={tag}>{tag}</span>)}
          </div>
          <div className="pm-shop-facts" aria-label="店铺概览">
            <article>
              <strong>{products.length}</strong>
              <span>上架商品</span>
            </article>
            <article>
              <strong>{discountCount}</strong>
              <span>优惠进行中</span>
            </article>
            <article>
              <strong>{lowestPrice ? `¥${lowestPrice}` : '--'}</strong>
              <span>入门价格</span>
            </article>
          </div>
          <div className="pm-shop-cta-row">
            <Button type="button" variant="ghost" onClick={() => navigate('/messages')}>联系店铺客服</Button>
          </div>
        </div>
      </section>

      <section className="pm-shop-products" aria-labelledby="shop-products-title">
        <div className="pm-shop-section-heading">
          <div>
            <h2 id="shop-products-title">店内精选</h2>
            <p className="pm-shop-section-note">延续首页像素陈列方式，把主推商品、价格标签和购买入口压缩到一屏内更易扫读。</p>
          </div>
          <span>{products.length} 件好物</span>
        </div>
        {products.length ? (
          <div className="pm-shop-product-grid">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                showSticker={false}
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
