import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/h5/Pagination';
import ProductCard from '../components/h5/ProductCard';
import SearchBar from '../components/h5/SearchBar';
import { usePagination } from '../hooks/usePagination';
import { useServices, useServiceSnapshot, useServiceVersion } from '../hooks/useServices';

const DEFAULT_SORT = 'sales-desc';
const sortOptions = [
  { key: 'sales-desc', label: '销量优先' },
  { key: 'default', label: '综合' },
  { key: 'price-asc', label: '价格升序' },
  { key: 'price-desc', label: '价格降序' },
];

const SearchHeaderBar = ({ initialValue, onSubmit }) => {
  const [draftKeyword, setDraftKeyword] = useState(initialValue);

  return (
    <SearchBar
      className="pm-search-hero-form"
      value={draftKeyword}
      onChange={setDraftKeyword}
      onSubmit={onSubmit}
      placeholder="搜索包包、礼盒、香氛..."
    />
  );
};

const SearchPage = () => {
  const { good, search, user } = useServices();
  const navigate = useNavigate();
  useServiceVersion(good);
  const currentUser = useServiceSnapshot(user, (service) => service.getCurrentUser());
  const history = useServiceSnapshot(search, (service) => (
    currentUser ? service.getHistory(currentUser.id) : service.getHistory(0)
  ));
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const requestedSort = searchParams.get('sort');
  const resolvedSort = requestedSort === 'stock-desc' ? DEFAULT_SORT : (requestedSort || DEFAULT_SORT);
  const filters = {
    keyword,
    categoryId: searchParams.get('categoryId') || 'all',
    discount: searchParams.get('discount') || 'all',
    stock: searchParams.get('stock') || 'all',
    price: searchParams.get('price') || 'all',
    sort: resolvedSort,
  };
  const products = good.advancedSearchProducts(filters);
  const suggestions = good.getSearchSuggestions(keyword);
  const filterOptions = good.getSearchFilterOptions(keyword);
  const { page, setPage, totalPages, slice, total, hasPrev, hasNext } = usePagination(products, 6);
  const priceRangeLabel = filterOptions.priceRanges.find((range) => range.key === filters.price)?.label;
  const categoryLabel = filters.categoryId === 'all'
    ? '全部分类'
    : filterOptions.categories.find((category) => category.id === filters.categoryId)?.name || '分类筛选';
  const suggestionPool = (suggestions.length
    ? suggestions
    : history.length
      ? history
      : filterOptions.categories.map((category) => category.name)).slice(0, 8);
  const activeFilterTags = [
    filters.categoryId !== 'all' ? `分类 · ${categoryLabel}` : null,
    filters.discount === 'discount' ? '优惠商品' : null,
    filters.stock === 'low' ? '库存告急' : null,
    filters.price !== 'all' && priceRangeLabel ? `价格 · ${priceRangeLabel}` : null,
    filters.sort !== DEFAULT_SORT ? `排序 · ${sortOptions.find((option) => option.key === filters.sort)?.label || '已筛选'}` : null,
  ].filter(Boolean);
  const overviewStats = [
    { label: '当前结果', value: total },
    { label: '可选分类', value: filterOptions.categories.length || 1 },
    { label: '搜索记录', value: history.length },
  ];

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
      <button className="pm-btn pm-btn-ghost pm-back-btn" type="button" onClick={() => navigate(-1)}>返回</button>
      <header className="pm-search-header pm-search-hero">
        <div className="pm-search-hero-main">
          <p className="pm-section-eyebrow">Smart Search</p>
          <h1>搜索商品</h1>
          <p className="pm-search-hero-desc">
            用关键词、分类和价格带快速压缩结果，页面默认采用紧凑陈列，方便在 H5 和 Web 端一次扫到更多商品。
          </p>
          <SearchHeaderBar key={keyword} initialValue={keyword} onSubmit={handleSearch} />
          <div className="pm-search-active-row">
            {activeFilterTags.length ? activeFilterTags.map((tag) => (
              <span className="pm-search-active-chip" key={tag}>{tag}</span>
            )) : (
              <span className="pm-search-active-chip is-muted">当前未启用额外筛选</span>
            )}
          </div>
        </div>
        <aside className="pm-search-hero-stats" aria-label="搜索概览">
          {overviewStats.map((item, index) => (
            <article className={`pm-search-stat pm-search-stat-${index + 1}`} key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </aside>
      </header>

      <section className="pm-search-suggestion-panel">
        <div className="pm-search-panel-head">
          <h2>{keyword ? '相关搜索' : '猜你想搜'}</h2>
          <p className="pm-search-panel-note">
            {keyword ? '结合当前关键词和商品标签推荐更接近的主题词。' : '优先展示你的搜索记录，没有历史时自动给出热门分类。'}
          </p>
        </div>
        <div className="pm-search-chip-row">
          {suggestionPool.map((term) => (
            <button key={term} type="button" className="pm-search-chip" onClick={() => applyKeyword(term)}>{term}</button>
          ))}
        </div>
      </section>

      <section className="pm-search-filter-panel">
        <div className="pm-search-filter-grid">
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
        </div>
        <div className="pm-search-filter-chip-row">
          {filterOptions.hasDiscount ? (
            <button type="button" className={`pm-search-filter-chip${filters.discount === 'discount' ? ' is-active' : ''}`} onClick={() => updateParams({ discount: filters.discount === 'discount' ? 'all' : 'discount' })}>只看优惠</button>
          ) : null}
          {filterOptions.hasLowStock ? (
            <button type="button" className={`pm-search-filter-chip${filters.stock === 'low' ? ' is-active' : ''}`} onClick={() => updateParams({ stock: filters.stock === 'low' ? 'all' : 'low' })}>库存告急</button>
          ) : null}
          {filterOptions.priceRanges.map((range) => (
            <button key={range.key} type="button" className={`pm-search-filter-chip${filters.price === range.key ? ' is-active' : ''}`} onClick={() => updateParams({ price: filters.price === range.key ? 'all' : range.key })}>{range.label}</button>
          ))}
        </div>
      </section>

      <section className="pm-search-result-head">
        <div>
          <p className="pm-section-eyebrow">Search Theme</p>
          <h2>{keyword ? `「${keyword}」主题商品` : '全部精选主题商品'}</h2>
          <p className="pm-search-result-note">
            {keyword ? `当前按 ${categoryLabel} 范围展示，默认优先显示销量更高的商品。` : '已按销量优先排序展示，可快速切换到优惠、低库存或价格区间。'}
          </p>
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
