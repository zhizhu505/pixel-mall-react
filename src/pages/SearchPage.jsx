import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/h5/Pagination';
import ProductCard from '../components/h5/ProductCard';
import SearchBar from '../components/h5/SearchBar';
import { usePagination } from '../hooks/usePagination';
import { useServices, useServiceSnapshot, useServiceVersion } from '../hooks/useServices';

const sortOptions = [
  { key: 'default', label: '综合' },
  { key: 'price-asc', label: '价格升序' },
  { key: 'price-desc', label: '价格降序' },
  { key: 'stock-desc', label: '库存优先' },
];

const SearchHeaderBar = ({ initialValue, onSubmit }) => {
  const [draftKeyword, setDraftKeyword] = useState(initialValue);

  return (
    <SearchBar
      value={draftKeyword}
      onChange={setDraftKeyword}
      onSubmit={onSubmit}
      placeholder="搜索包包、礼盒、香氛..."
    />
  );
};

const SearchPage = () => {
  const { good, search, user } = useServices();
  useServiceVersion(good);
  const currentUser = useServiceSnapshot(user, (service) => service.getCurrentUser());
  const history = useServiceSnapshot(search, (service) => (
    currentUser ? service.getHistory(currentUser.id) : service.getHistory(0)
  ));
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const filters = {
    keyword,
    categoryId: searchParams.get('categoryId') || 'all',
    discount: searchParams.get('discount') || 'all',
    stock: searchParams.get('stock') || 'all',
    price: searchParams.get('price') || 'all',
    sort: searchParams.get('sort') || 'default',
  };
  const products = good.advancedSearchProducts(filters);
  const suggestions = good.getSearchSuggestions(keyword);
  const filterOptions = good.getSearchFilterOptions(keyword);
  const { page, setPage, totalPages, slice, total, hasPrev, hasNext } = usePagination(products, 6);

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || value === 'all') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    setPage(1);
    setSearchParams(next);
  };

  const handleSearch = (value) => {
    const nextKeyword = value.trim();
    if (currentUser || nextKeyword) {
      search.recordSearch(currentUser?.id || 0, nextKeyword);
    }
    updateParams({ keyword: nextKeyword });
  };

  const applyKeyword = (value) => {
    search.recordSearch(currentUser?.id || 0, value);
    updateParams({ keyword: value });
  };

  return (
    <main className="pm-page pm-search-page">
      <header className="pm-search-header">
        <p className="pm-section-eyebrow">Smart Search</p>
        <h1>搜索商品</h1>
        <SearchHeaderBar key={keyword} initialValue={keyword} onSubmit={handleSearch} />
      </header>

      <section className="pm-search-suggestion-panel">
        <h2>{keyword ? '相关搜索' : '猜你想搜'}</h2>
        <div className="pm-search-chip-row">
          {(suggestions.length ? suggestions : history).map((term) => (
            <button key={term} type="button" className="pm-search-chip" onClick={() => applyKeyword(term)}>{term}</button>
          ))}
        </div>
      </section>

      <section className="pm-search-filter-panel">
        <label className="pm-control">
          <span className="pm-label">分类</span>
          <select className="pm-select" value={filters.categoryId} onChange={(event) => updateParams({ categoryId: event.target.value })}>
            <option value="all">全部分类</option>
            {filterOptions.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="pm-control">
          <span className="pm-label">排序</span>
          <select className="pm-select" value={filters.sort} onChange={(event) => updateParams({ sort: event.target.value })}>
            {sortOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
          </select>
        </label>
        {filterOptions.hasDiscount ? (
          <button type="button" className={`pm-search-filter-chip${filters.discount === 'discount' ? ' is-active' : ''}`} onClick={() => updateParams({ discount: filters.discount === 'discount' ? 'all' : 'discount' })}>只看优惠</button>
        ) : null}
        {filterOptions.hasLowStock ? (
          <button type="button" className={`pm-search-filter-chip${filters.stock === 'low' ? ' is-active' : ''}`} onClick={() => updateParams({ stock: filters.stock === 'low' ? 'all' : 'low' })}>库存告急</button>
        ) : null}
        {filterOptions.priceRanges.map((range) => (
          <button key={range.key} type="button" className={`pm-search-filter-chip${filters.price === range.key ? ' is-active' : ''}`} onClick={() => updateParams({ price: filters.price === range.key ? 'all' : range.key })}>{range.label}</button>
        ))}
      </section>

      <section className="pm-search-result-head">
        <div>
          <p className="pm-section-eyebrow">Search Theme</p>
          <h2>{keyword ? `「${keyword}」主题商品` : '全部精选主题商品'}</h2>
        </div>
        <span>{total} 件商品</span>
      </section>

      {slice.length ? (
        <>
          <section className="pm-search-grid">
            {slice.map((product, index) => <ProductCard key={product.id} product={product} index={index} showSticker={false} />)}
          </section>
          <Pagination page={page} totalPages={totalPages} total={total} onPrev={() => hasPrev && setPage(page - 1)} onNext={() => hasNext && setPage(page + 1)} />
        </>
      ) : (
        <EmptyState title="没有找到匹配商品" description="试试更换关键词或清除筛选条件。" action={<Link className="pm-btn pm-btn-primary" to="/search">查看全部</Link>} />
      )}
    </main>
  );
};

export default SearchPage;
