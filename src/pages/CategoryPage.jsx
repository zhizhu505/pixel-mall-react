import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import ProductCard from '../components/h5/ProductCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useServices, useServiceVersion } from '../hooks/useServices';
import { splitCategoryLabel } from '../utils/categoryLabel';

const CategoryChipLabel = ({ name }) => {
  const { line1, line2 } = splitCategoryLabel(name);

  return (
    <span className="pm-category-chip-label">
      <span className="pm-category-chip-line">{line1}</span>
      {line2 ? <span className="pm-category-chip-line">{line2}</span> : null}
    </span>
  );
};

const CategoryProductFeed = ({ products }) => {
  const { visibleItems, sentinelRef } = useInfiniteScroll(products, 6);

  if (!products.length) {
    return (
      <div className="pm-category-empty">
        <EmptyState
          title="这个分类还没有可售商品"
          description="后台上架商品后会自动出现在这里。"
        />
      </div>
    );
  }

  return (
    <>
      <div className="pm-product-grid pm-category-product-grid">
        {visibleItems.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            showSticker={false}
            className="pm-category-product-card"
          />
        ))}
      </div>
      <div className="pm-home-scroll-sentinel pm-category-scroll-sentinel" ref={sentinelRef} aria-hidden />
    </>
  );
};

const CategoryPage = () => {
  const { good, api } = useServices();
  const goodRevision = useServiceVersion(good);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategoryId = searchParams.get('categoryId') || 'all';
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.categories.list(),
      api.products.list({ categoryId: activeCategoryId }),
    ]).then(([nextCategories, nextProducts]) => {
      if (isMounted) {
        setCategories(nextCategories);
        setProducts(nextProducts);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [api, activeCategoryId, goodRevision]);

  const selectCategory = (categoryId) => {
    const next = new URLSearchParams(searchParams);
    if (categoryId === 'all') {
      next.delete('categoryId');
    } else {
      next.set('categoryId', categoryId);
    }
    setSearchParams(next);
  };

  return (
    <main className="pm-page pm-category-page">
      <div className="pm-category-layout">
        <nav className="pm-category-side" aria-label="商品分类">
          <button
            type="button"
            className={`pm-category-chip pm-category-chip-1${activeCategoryId === 'all' ? ' is-active' : ''}`}
            onClick={() => selectCategory('all')}
          >
            <CategoryChipLabel name="全部分类" />
          </button>
          {categories.map((category, index) => (
            <button
              type="button"
              key={category.id}
              className={`pm-category-chip pm-category-chip-${(index % 3) + 1}${activeCategoryId === category.id ? ' is-active' : ''}`}
              onClick={() => selectCategory(category.id)}
            >
              <CategoryChipLabel name={category.name} />
            </button>
          ))}
        </nav>

        <section className="pm-category-main">
          <CategoryProductFeed
            key={activeCategoryId}
            products={products}
          />
        </section>
      </div>
    </main>
  );
};

export default CategoryPage;
