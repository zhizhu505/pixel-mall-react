import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import { useServices, useServiceVersion } from '../hooks/useServices';

const reviewFilters = [
  { key: 'all', label: '全部' },
  { key: 'show', label: '买家秀' },
  { key: 'video', label: '有视频' },
  { key: 'follow', label: '追评' },
  { key: 'negative', label: '差评' },
];

const getReviewMedia = (review) => (Array.isArray(review.media) ? review.media : []);

const filterReviews = (reviews, filter) => {
  if (filter === 'show') return reviews.filter((review) => getReviewMedia(review).length > 0);
  if (filter === 'video') return reviews.filter((review) => getReviewMedia(review).some((item) => item.type === 'video'));
  if (filter === 'follow') return reviews.filter((review) => review.followUp?.content);
  if (filter === 'negative') return reviews.filter((review) => review.isNegative || Number(review.rating) <= 2);
  return reviews;
};

const ProductReviewsPage = () => {
  const { goodId } = useParams();
  const navigate = useNavigate();
  const { api, good } = useServices();
  const goodRevision = useServiceVersion(good);
  const [loaded, setLoaded] = useState(false);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const parsedGoodId = Number(goodId);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.products.detail(parsedGoodId),
      api.products.reviews ? api.products.reviews(parsedGoodId) : Promise.resolve([]),
    ]).then(([nextProduct, nextReviews]) => {
      if (isMounted) {
        setProduct(nextProduct);
        setReviews(Array.isArray(nextReviews) ? nextReviews : []);
        setLoaded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [api, parsedGoodId, goodRevision]);

  const filteredReviews = useMemo(() => filterReviews(reviews, activeFilter), [activeFilter, reviews]);
  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
    : '5.0';

  if (!loaded) {
    return (
      <main className="pm-page pm-product-reviews-page">
        <EmptyState title="评价加载中" description="正在整理买家反馈。" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="pm-page pm-product-reviews-page">
        <EmptyState
          title="商品不存在"
          description="该商品可能已下架或被删除。"
          action={<Link className="pm-btn pm-btn-primary" to="/home">回首页</Link>}
        />
      </main>
    );
  }

  return (
    <main className="pm-page pm-product-reviews-page">
      <nav className="pm-product-reviews-nav" aria-label="评价页导航">
        <button className="pm-icon-btn" type="button" aria-label="返回商品详情" onClick={() => navigate(`/detail/${product.id}`)}>
          ←
        </button>
        <strong>商品评价</strong>
      </nav>

      <section className="pm-product-reviews-summary">
        <div>
          <p className="pm-section-eyebrow">Reviews</p>
          <h1>{product.name}</h1>
        </div>
        <strong>{averageRating} 分</strong>
        <span>{reviews.length} 条真实反馈</span>
      </section>

      <div className="pm-product-review-filters" role="tablist" aria-label="评价筛选">
        {reviewFilters.map((filter) => {
          const count = filterReviews(reviews, filter.key).length;
          return (
            <button
              className={activeFilter === filter.key ? 'is-active' : ''}
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label} {count}
            </button>
          );
        })}
      </div>

      <section className="pm-product-review-list" aria-label="评价列表">
        {filteredReviews.length ? filteredReviews.map((review) => (
          <article className="pm-product-review-card" key={review.id}>
            <div className="pm-product-review-user">
              <span className="pm-product-review-avatar">{review.avatar || review.nickname?.slice(0, 1) || '买'}</span>
              <div>
                <strong>{review.nickname || review.userSnapshot?.nickname || '匿名买家'}</strong>
                <span>{'★'.repeat(Number(review.rating) || 5)}{'☆'.repeat(5 - (Number(review.rating) || 5))}</span>
              </div>
              {review.isNegative ? <em>差评</em> : null}
            </div>
            {review.specText ? <p className="pm-product-review-spec">{review.specText}</p> : null}
            <p>{review.content}</p>
            {getReviewMedia(review).length ? (
              <div className="pm-product-review-media">
                {getReviewMedia(review).slice(0, 6).map((item, index) => (
                  <div className="pm-product-review-media-item" key={`${review.id}-${index}`}>
                    <img src={item.src || item.cover} alt={item.title || '评价媒体'} />
                    {item.type === 'video' ? <span>视频 {item.duration || ''}</span> : null}
                  </div>
                ))}
              </div>
            ) : null}
            {review.followUp?.content ? (
              <div className="pm-product-review-follow-up">
                <strong>追评</strong>
                <span>{review.followUp.content}</span>
              </div>
            ) : null}
            {review.adminReply ? (
              <div className="pm-product-review-admin-reply">
                <strong>商家回复</strong>
                <span>{review.adminReply}</span>
              </div>
            ) : null}
            <small>{review.createdAt}</small>
          </article>
        )) : <EmptyState title="暂无对应评价" description="换个筛选看看其他买家的真实反馈。" />}
      </section>
    </main>
  );
};

export default ProductReviewsPage;
