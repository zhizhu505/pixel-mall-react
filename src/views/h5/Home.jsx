import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import ProductCard from '../../components/h5/ProductCard';
import SearchBar from '../../components/h5/SearchBar';
import Carousel from '../../components/h5/Carousel';
import EmptyState from '../../components/common/EmptyState';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useServices } from '../../hooks/useServices';

const HomeProductFeed = ({ products, keywordLabel, onAddToCart }) => {
  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(products, 6);

  if (!products.length) {
    return (
      <EmptyState
        title="没有找到商品"
        description="换个关键词试试。"
        action={
          keywordLabel ? (
            <Link className="pm-btn pm-btn-primary" to="/home">
              清除搜索
            </Link>
          ) : null
        }
      />
    );
  }

  return (
    <>
      <section className="pm-product-grid pm-home-product-grid">
        {visibleItems.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            showAddLink
            onAddToCart={onAddToCart}
          />
        ))}
      </section>
      <div className="pm-home-scroll-sentinel" ref={sentinelRef} aria-hidden />
      {hasMore ? (
        <p className="pm-home-scroll-hint">继续下滑加载更多...</p>
      ) : null}
    </>
  );
};

const Home = () => {
  const { good, user, cart } = useServices();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const keywordFromUrl = searchParams.get('keyword') || '';
  const [keyword, setKeyword] = useState(keywordFromUrl);
  const currentUser = user.getCurrentUser();

  const carouselProducts = good.getPublicGoodList().slice(0, 4);
  const hotProducts = useMemo(() => {
    if (keywordFromUrl) {
      return good.searchProducts(keywordFromUrl);
    }
    return good.getPublicGoodList();
  }, [good, keywordFromUrl]);

  const handleSearch = (value) => {
    const nextKeyword = value.trim();
    if (nextKeyword) {
      setSearchParams({ keyword: nextKeyword });
    } else {
      setSearchParams({});
    }
  };

  const handleAddToCart = (product) => {
    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent('/home')}`);
      return;
    }
    const result = cart.addItem(currentUser.id, product.id, 1);
    if (!result.success) {
      window.alert(result.message);
    }
  };

  return (
    <main className="pm-page pm-home-page">
      <div className="pm-home-top-bar">
        <SearchBar
          className="pm-home-top-search"
          value={keyword}
          onChange={setKeyword}
          onSubmit={handleSearch}
          placeholder="搜索像素包、发夹、香氛..."
        />
        <Link className="pm-btn pm-btn-ghost pm-home-admin-link" to="/admin/login">
          后台
        </Link>
      </div>

      {carouselProducts.length ? <Carousel items={carouselProducts} /> : null}

      <section className="pm-home-section-heading">
        <h2>{keywordFromUrl ? `搜索「${keywordFromUrl}」` : '热门商品'}</h2>
      </section>

      <HomeProductFeed
        key={keywordFromUrl || 'all'}
        products={hotProducts}
        keywordLabel={keywordFromUrl}
        onAddToCart={handleAddToCart}
      />
    </main>
  );
};

export default Home;
