import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useServices } from '../hooks/useServices';
import { formatPrice, getProductTone } from '../utils/productDisplay';

const DetailPage = () => {
  const { goodId } = useParams();
  const navigate = useNavigate();
  const { good, cart, user, favorite } = useServices();
  const [message, setMessage] = useState('');
  const [favTick, setFavTick] = useState(0);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(''), 2000);
    return () => window.clearTimeout(timer);
  }, [message]);
  const parsedGoodId = Number(goodId);
  const product = good.getGoodById(parsedGoodId);
  const currentUser = user.getCurrentUser();
  const isSoldOut = !product || product.status !== 'on-sale' || product.stock <= 0;

  void favTick;
  const isFavorited =
    currentUser && favorite.isFavorite(currentUser.id, parsedGoodId);

  if (!product) {
    return (
      <main className="pm-page pm-detail-page">
        <EmptyState
          title="商品不存在"
          description="该商品可能已下架或被删除。"
          action={
            <Link className="pm-btn pm-btn-primary" to="/home">
              回首页
            </Link>
          }
        />
      </main>
    );
  }

  const requireLogin = (nextPath) => {
    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(nextPath)}`);
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!requireLogin(`/detail/${goodId}`)) {
      return;
    }
    const result = cart.addItem(currentUser.id, product.id, 1);
    setMessage(result.success ? '已加入购物车' : result.message);
  };

  const handleBuyNow = () => {
    if (!requireLogin(`/createOrder/${goodId}`)) {
      return;
    }
    navigate(`/createOrder/${goodId}`);
  };

  const handleFavorite = () => {
    if (!requireLogin(`/detail/${goodId}`)) {
      return;
    }
    const result = favorite.toggleFavorite(currentUser.id, product.id);
    setMessage(result.message);
    setFavTick((value) => value + 1);
  };

  return (
    <main className="pm-page pm-detail-page">
      <Link className="pm-btn pm-btn-ghost" to="/home">
        ← 返回
      </Link>

      <article className="pm-product-card">
        <div className="pm-product-media">
          {product.cover ? (
            <img src={product.cover} alt={product.name} />
          ) : (
            <div className={`pm-pixel-product pm-pixel-product-large ${getProductTone(product.id)}`} />
          )}
        </div>
        <h1 className="pm-product-title">{product.name}</h1>
        <p className="pm-product-desc">{product.description}</p>
        <div className="pm-product-foot">
          <strong className="pm-price">{formatPrice(product.price)}</strong>
          <span className="pm-tag pm-tag-info">库存 {product.stock}</span>
          <span className="pm-tag pm-tag-sale">{product.categoryName}</span>
          {product.status !== 'on-sale' ? (
            <span className="pm-tag pm-tag-muted">已下架</span>
          ) : null}
        </div>
        {message ? <p className="pm-help">{message}</p> : null}
        <div className="pm-home-actions">
          <Button type="button" variant="primary" disabled={isSoldOut} onClick={handleAddToCart}>
            加入购物车
          </Button>
          <Button type="button" variant="accent" disabled={isSoldOut} onClick={handleBuyNow}>
            立即购买
          </Button>
          <Button type="button" variant="ghost" onClick={handleFavorite}>
            {isFavorited ? '取消收藏' : '收藏商品'}
          </Button>
        </div>
      </article>
    </main>
  );
};

export default DetailPage;
