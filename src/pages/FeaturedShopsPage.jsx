import { useNavigate } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import FeaturedShopSection from '../components/h5/FeaturedShopSection';
import { useServices, useServiceVersion } from '../hooks/useServices';

const FeaturedShopsPage = () => {
  const navigate = useNavigate();
  const { good } = useServices();
  useServiceVersion(good);
  const shops = good.getFeaturedShops(12);
  const allProducts = shops.flatMap((shop) => shop.products || []);
  const categoryCount = new Set(allProducts.map((product) => product.categoryName).filter(Boolean)).size;
  const stats = [
    { label: '精选店铺', value: shops.length },
    { label: '展示商品', value: allProducts.length },
    { label: '覆盖分类', value: categoryCount || 1 },
  ];

  return (
    <main className="pm-page pm-featured-shops-page pm-shop-page">
      <button className="pm-btn pm-btn-ghost pm-back-btn" type="button" onClick={() => navigate(-1)}>返回</button>

      <section className="pm-shop-hero" aria-labelledby="featured-shops-title">
        <div className="pm-shop-hero-copy">
          <p className="pm-section-eyebrow">Pixel Stores</p>
          <h1 id="featured-shops-title">特色店铺</h1>
          <strong>把精选店铺集中在这里，首页只保留轻量入口。</strong>
          <p>逛逛包袋、饰品和生活礼盒店，进入店铺后可以查看店内精选商品。</p>
          <div className="pm-shop-facts pm-shop-facts-featured" aria-label="店铺专题概览">
            {stats.map((item) => (
              <article key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {shops.length ? (
        <FeaturedShopSection shops={shops} title="精选店铺专栏" id="featured-shop-list-title" className="pm-featured-shops-section" />
      ) : (
        <EmptyState title="暂无特色店铺" description="店主正在布置专栏，稍后再来看看。" iconSrc="/images/admin/empty/no-data-shop.svg" />
      )}
    </main>
  );
};

export default FeaturedShopsPage;
