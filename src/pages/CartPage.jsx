import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useServices } from '../hooks/useServices';
import { formatPrice } from '../utils/productDisplay';

const CartHeader = () => (
  <header className="pm-cart-header">
    <p className="pm-cart-header-brand">
      <span className="pm-cart-header-pixel" aria-hidden />
      Pixel Mall
    </p>
    <h1 className="pm-cart-header-title">购物车</h1>
  </header>
);

const CartPage = () => {
  'use no memo';

  const { cart, user } = useServices();
  const navigate = useNavigate();
  const currentUser = user.getCurrentUser();
  const [updateKey, setUpdateKey] = useState(0);

  useEffect(() => {
    cart.refreshSnapshots(currentUser.id);
    // 进入页时同步商品快照，需触发一次重渲染
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount refresh
    setUpdateKey((key) => key + 1);
  }, [cart, currentUser.id]);

  void updateKey;
  const items = cart.getEnrichedCartItems(currentUser.id);
  const selectedTotal = cart.getSelectedTotal(currentUser.id);

  const refresh = useCallback(() => {
    setUpdateKey((key) => key + 1);
  }, []);

  const allChecked = items.length > 0 && items.every((item) => item.checked);

  const handleToggleAll = (event) => {
    cart.toggleAll(currentUser.id, event.target.checked);
    refresh();
  };

  const handleToggleItem = (itemId, checked) => {
    cart.setItemChecked(itemId, checked);
    refresh();
  };

  const handleDecrease = (item) => {
    if (item.count <= 1) {
      cart.removeItem(item.id);
      refresh();
      return;
    }

    const result = cart.updateCount(item.id, item.count - 1);
    if (!result.success) {
      window.alert(result.message);
    }
    refresh();
  };

  const handleIncrease = (item) => {
    const result = cart.updateCount(item.id, item.count + 1);
    if (!result.success) {
      window.alert(result.message);
    }
    refresh();
  };

  const handleCheckout = () => {
    const validation = cart.validateCheckout(currentUser.id);
    if (!validation.success) {
      window.alert(validation.message);
      return;
    }
    navigate('/checkout');
  };

  if (!items.length) {
    return (
      <main className="pm-page pm-cart-page">
        <CartHeader />
        <div className="pm-cart-empty">
          <EmptyState
            title="购物车还是空的"
            description="去首页或分类页挑几件像素好物吧。"
            action={
              <Link className="pm-btn pm-btn-primary" to="/home">
                去逛逛
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main className="pm-page pm-cart-page pm-cart-page-has-items">
      <CartHeader />

      <section className="pm-cart-list">
        {items.map((item) => (
          <article className="pm-cart-item" key={item.id}>
            <label className="pm-cart-check">
              <input
                className="pm-cart-check-input"
                type="checkbox"
                checked={Boolean(item.checked)}
                onChange={(event) => handleToggleItem(item.id, event.target.checked)}
              />
              <span className="pm-cart-check-ui" aria-hidden />
            </label>
            <div className="pm-cart-media">
              {item.product?.cover ? (
                <img src={item.product.cover} alt={item.product.name} />
              ) : (
                <div className="pm-pixel-product pm-pixel-product-pink" />
              )}
            </div>
            <div className="pm-cart-info">
              <h3 className="pm-cart-title">{item.product?.name || '商品已失效'}</h3>
              <p className="pm-cart-spec">
                {item.isAvailable ? item.product?.categoryName || '像素好物' : '已下架或售罄'}
              </p>
              <strong className="pm-cart-price pm-price">
                {item.isAvailable ? formatPrice(item.product.price) : '--'}
              </strong>
              <div className="pm-quantity pm-quantity-compact">
                <button
                  type="button"
                  className="pm-quantity-btn"
                  aria-label="减少数量"
                  onClick={() => handleDecrease(item)}
                >
                  -
                </button>
                <span className="pm-quantity-value">{item.count}</span>
                <button
                  type="button"
                  className="pm-quantity-btn"
                  aria-label="增加数量"
                  disabled={!item.isAvailable}
                  onClick={() => handleIncrease(item)}
                >
                  +
                </button>
              </div>
            </div>
            <button
              type="button"
              className="pm-cart-remove pm-icon-btn"
              aria-label="删除商品"
              onClick={() => {
                cart.removeItem(item.id);
                refresh();
              }}
            >
              ×
            </button>
          </article>
        ))}
      </section>

      <footer className="pm-cart-summary">
        <label className="pm-cart-select-all">
          <span className="pm-cart-check">
            <input
              className="pm-cart-check-input"
              type="checkbox"
              checked={allChecked}
              onChange={handleToggleAll}
              aria-label="全选"
            />
            <span className="pm-cart-check-ui" aria-hidden />
          </span>
          <span className="pm-cart-select-all-text">全选</span>
        </label>
        <div className="pm-cart-total">
          <strong className="pm-price">{formatPrice(selectedTotal)}</strong>
          <span className="pm-cart-total-unit">元</span>
        </div>
        <Button type="button" variant="primary" className="pm-cart-checkout-btn" onClick={handleCheckout}>
          去结算
        </Button>
      </footer>
    </main>
  );
};

export default CartPage;
