import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/h5/Pagination';
import ProductCard from '../components/h5/ProductCard';
import { usePagination } from '../hooks/usePagination';
import { useServices, useServiceSnapshot, useServiceVersion } from '../hooks/useServices';
import { getProductPriceInfo } from '../utils/productDisplay';

const FootprintsPage = () => {
  const navigate = useNavigate();
  const { footprint, good, user } = useServices();
  useServiceVersion(good);
  const currentUser = useServiceSnapshot(user, (service) => service.getCurrentUser());
  const products = useServiceSnapshot(footprint, (service) => (
    currentUser ? service.getFootprintProducts(currentUser.id) : []
  ));
  const { page, setPage, totalPages, slice, total, hasPrev, hasNext } = usePagination(products, 6);
  const averagePrice = products.length
    ? Math.round(products.reduce((sum, product) => sum + getProductPriceInfo(product).currentPrice, 0) / products.length)
    : 0;
  const categoryCount = new Set(products.map((product) => product.categoryName).filter(Boolean)).size;
  const statItems = [
    { label: '最近浏览', value: total },
    { label: '覆盖分类', value: categoryCount || 0 },
    { label: '均价参考', value: averagePrice ? `¥${averagePrice}` : '--' },
  ];

  const handleRemove = (productId) => {
    footprint.removeFootprint(currentUser.id, productId);
  };

  const handleClear = () => {
    footprint.clearFootprints(currentUser.id);
  };

  if (!products.length) {
    return (
      <main className="pm-page pm-footprints-page">
        <h1>我的足迹</h1>
        <EmptyState
          title="还没有浏览足迹"
          description="浏览商品详情后，最近看过的商品会出现在这里。"
          action={<Link className="pm-btn pm-btn-primary" to="/home">去逛逛</Link>}
        />
      </main>
    );
  }

  return (
    <main className="pm-page pm-footprints-page">
      <header className="pm-footprints-toolbar">
        <div className="pm-footprints-head-copy">
          <p className="pm-section-eyebrow">Browsing History</p>
          <h1>我的足迹</h1>
          <p className="pm-footprints-note">把最近浏览过的商品压缩成更密集的陈列区，方便快速回看、继续比较和移除无效记录。</p>
        </div>
        <div className="pm-footprints-actions">
          <button className="pm-btn pm-btn-ghost pm-back-btn" type="button" onClick={() => navigate(-1)}>返回</button>
          <Button type="button" variant="danger" onClick={handleClear}>清空足迹</Button>
        </div>
      </header>

      <section className="pm-footprints-stats" aria-label="足迹概览">
        {statItems.map((item, index) => (
          <article className={`pm-footprints-stat pm-footprints-stat-${index + 1}`} key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section className="pm-footprints-grid">
        {slice.map((product, index) => (
          <div className="pm-footprints-item" key={product.id}>
            <ProductCard product={product} index={index} showSticker={false} />
            <Button type="button" variant="ghost" onClick={() => handleRemove(product.id)}>移除</Button>
          </div>
        ))}
      </section>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPrev={() => hasPrev && setPage(page - 1)}
        onNext={() => hasNext && setPage(page + 1)}
      />
    </main>
  );
};

export default FootprintsPage;
