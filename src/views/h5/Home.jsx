import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/h5/Pagination';
import Carousel from '../../components/h5/Carousel';
import ProductCard from '../../components/h5/ProductCard';
import SearchBar from '../../components/h5/SearchBar';
import { usePagination } from '../../hooks/usePagination';
import { useServices, useServiceSnapshot, useServiceVersion } from '../../hooks/useServices';
import { carouselActivities } from '../../mock/activities';

const HomeProductFeed = ({ products, keywordLabel, cartQuantityMap }) => {
  const { page, setPage, totalPages, slice, total, hasPrev, hasNext, pageSize } = usePagination(products, 6);
  const productColumns = slice.reduce(
    (columns, product, index) => {
      columns[index % 2].push({ product, index });
      return columns;
    },
    [[], []],
  );

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
        {productColumns.map((column, columnIndex) => (
          <div className="pm-home-product-column" key={`home-product-column-${columnIndex + 1}`}>
            {column.map(({ product, index }) => (
              <ProductCard
                key={product.id}
                product={product}
                index={(page - 1) * pageSize + index}
                cartQuantity={cartQuantityMap[product.id] || 0}
                />
            ))}
          </div>
        ))}
      </section>
      <Pagination
        className="pm-home-pagination"
        page={page}
        totalPages={totalPages}
        total={total}
        onPrev={() => hasPrev && setPage(page - 1)}
        onNext={() => hasNext && setPage(page + 1)}
      />
    </>
  );
};

const Home = () => {
  const { good, cart, user, api } = useServices();
  const goodRevision = useServiceVersion(good);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const keywordFromUrl = searchParams.get('keyword') || '';
  const [keyword, setKeyword] = useState(keywordFromUrl);
  const currentUser = user.getCurrentUser();
  const cartQuantityMap = useServiceSnapshot(cart, (service) => {
    if (!currentUser) {
      return {};
    }

    return service.getCartItems(currentUser.id).reduce((map, item) => ({
      ...map,
      [item.goodId]: item.count,
    }), {});
  });
  const [hotProducts, setHotProducts] = useState([]);

  const carouselItems = carouselActivities;
  useEffect(() => {
    let isMounted = true;
    const productsRequest = keywordFromUrl
      ? api.products.search(keywordFromUrl)
      : api.products.list();

    productsRequest.then((list) => {
      if (isMounted) {
        setHotProducts(list);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [api, keywordFromUrl, goodRevision]);

  const handleSearch = (value) => {
    const nextKeyword = value.trim();
    if (nextKeyword) {
      navigate(`/search?keyword=${encodeURIComponent(nextKeyword)}`);
    } else {
      navigate('/search');
      setSearchParams({});
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
      </div>

      {carouselItems.length ? <Carousel items={carouselItems} /> : null}

      <section className="pm-home-section-heading">
        <h2>{keywordFromUrl ? `搜索「${keywordFromUrl}」` : '热门商品'}</h2>
      </section>

      <HomeProductFeed
        key={keywordFromUrl || 'all'}
        products={hotProducts}
        keywordLabel={keywordFromUrl}
        cartQuantityMap={cartQuantityMap}
      />
    </main>
  );
};

export default Home;
