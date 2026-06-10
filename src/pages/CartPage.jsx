import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useServices } from '../hooks/useServices';
import { showPixelToast } from '../utils/pixelToast';
import { formatPrice, getProductPriceInfo } from '../utils/productDisplay';

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

  const { cart, user, api } = useServices();
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

  const handleToggleAll = async (event) => {
    await api.cart.toggleAll(currentUser.id, event.target.checked);
    refresh();
  };

  const handleToggleItem = async (itemId, checked) => {
    await api.cart.setChecked(itemId, checked);
    refresh();
  };

  const handleDecrease = async (item) => {
    if (item.count <= 1) {
      await api.cart.remove(item.id);
      refresh();
      return;
    }

    const result = await api.cart.updateCount(item.id, item.count - 1);
    if (!result.success) {
      showPixelToast(result.message);
    }
    refresh();
  };

  const handleIncrease = async (item) => {
    const result = await api.cart.updateCount(item.id, item.count + 1);
    if (!result.success) {
      showPixelToast(result.message);
    }
    refresh();
  };

  const handleCheckout = async () => {
    const validation = await api.cart.validateCheckout(currentUser.id);
    if (!validation.success) {
      showPixelToast(validation.message);
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
        {items.map((item) => {
          const priceInfo = getProductPriceInfo(item.product || item.goodSnapshot);
          const currentPrice = Number(item.variant?.price ?? priceInfo.currentPrice) || 0;
          const originalPrice = Number(item.variant?.originalPrice ?? priceInfo.originalPrice) || currentPrice;
          const hasDiscount = originalPrice > currentPrice;
          const discountLabel = priceInfo.saleTag || (hasDiscount ? '折扣优惠' : '');

          return (
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
                  {item.isAvailable ? item.specText || item.product?.categoryName || '像素好物' : '已下架或售罄'}
                </p>
                <div className="pm-cart-price-row">
                  <strong className="pm-cart-price pm-price">
                    {item.isAvailable ? formatPrice(currentPrice) : '--'}
                  </strong>
                  {item.isAvailable && hasDiscount ? <span className="pm-old-price">{formatPrice(originalPrice)}</span> : null}
                </div>
                {item.isAvailable && discountLabel ? <span className="pm-cart-discount-name">{discountLabel}</span> : null}
                <div className="pm-cart-quantity-row">
                  <span className="pm-cart-quantity-label">数量 x{item.count}</span>
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
              </div>
              <button
                type="button"
                className="pm-cart-remove pm-icon-btn"
                aria-label="删除商品"
                onClick={async () => {
                  await api.cart.remove(item.id);
                  refresh();
                }}
              >
                ×
              </button>
            </article>
          );
        })}
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
