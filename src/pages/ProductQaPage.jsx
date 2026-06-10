import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import { useServices, useServiceVersion } from '../hooks/useServices';

const ProductQaPage = () => {
  const { goodId } = useParams();
  const navigate = useNavigate();
  const { api, good } = useServices();
  const goodRevision = useServiceVersion(good);
  const [loaded, setLoaded] = useState(false);
  const [product, setProduct] = useState(null);
  const parsedGoodId = Number(goodId);

  useEffect(() => {
    let isMounted = true;

    api.products.detail(parsedGoodId).then((nextProduct) => {
      if (isMounted) {
        setProduct(nextProduct);
        setLoaded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [api, parsedGoodId, goodRevision]);

  if (!loaded) {
    return (
      <main className="pm-page pm-product-qa-page">
        <EmptyState title="问答加载中" description="正在整理大家的回答。" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="pm-page pm-product-qa-page">
        <EmptyState
          title="商品不存在"
          description="该商品可能已下架或被删除。"
          action={<Link className="pm-btn pm-btn-primary" to="/home">回首页</Link>}
        />
      </main>
    );
  }

  const qaItems = Array.isArray(product.qaItems) ? product.qaItems : [];
  const answerCount = qaItems.reduce((sum, item) => sum + (Number(item.count) || 0), 0);

  return (
    <main className="pm-page pm-product-qa-page">
      <nav className="pm-product-reviews-nav" aria-label="问答页导航">
        <button className="pm-icon-btn" type="button" aria-label="返回商品详情" onClick={() => navigate(`/detail/${product.id}`)}>
          ←
        </button>
        <strong>问大家</strong>
      </nav>

      <section className="pm-product-reviews-summary pm-product-qa-summary">
        <div>
          <p className="pm-section-eyebrow">Q&A</p>
          <h1>{product.name}</h1>
        </div>
        <strong>{qaItems.length} 问</strong>
        <span>{answerCount} 人参与回答，内容来自已购用户与官方客服</span>
      </section>

      <section className="pm-product-qa-list" aria-label="问大家回答列表">
        {qaItems.length ? qaItems.map((item, index) => (
          <article className="pm-product-qa-card" key={item.question || index}>
            <div className="pm-product-qa-question">
              <span>问</span>
              <strong>{item.question}</strong>
            </div>
            <div className="pm-product-qa-answer">
              <span>答</span>
              <p>{item.answer}</p>
            </div>
            <footer>
              <span>{item.source || '已购买用户'}</span>
              <em>{Number(item.count) || 0} 人参与</em>
            </footer>
          </article>
        )) : <EmptyState title="暂无问答" description="当前商品还没有用户问答。" />}
      </section>
    </main>
  );
};

export default ProductQaPage;
