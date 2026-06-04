import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Button from '../components/common/Button';
import OrderAddressSummary from '../components/h5/OrderAddressSummary';
import { useServices } from '../hooks/useServices';
import { formatPrice } from '../utils/productDisplay';
import { readSelectedAddressId } from '../utils/orderAddress';
import { collectErrors, validatePhone, validateRequired } from '../utils/validation';

const CheckoutPage = () => {
  'use no memo';

  const { cart, order, user, address } = useServices();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = user.getCurrentUser();
  const returnPath = '/checkout';
  const defaultAddr = address.getDefaultAddress(currentUser.id);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const navAddressId = readSelectedAddressId(location.state);
  const effectiveAddressId = navAddressId || defaultAddr?.id || '';

  void address.getRevision();
  const shippingAddress = effectiveAddressId
    ? address.getAddressById(effectiveAddressId) || address.getDefaultAddress(currentUser.id)
    : address.getDefaultAddress(currentUser.id);

  void cart.getRevision();
  const selectedItems = cart.getSelectedItems(currentUser.id);
  const total = cart.getSelectedTotal(currentUser.id);

  useEffect(() => {
    if (!navAddressId) {
      return;
    }
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  }, [navAddressId, location.pathname, location.search, navigate]);

  const handleSubmit = () => {
    if (!shippingAddress) {
      window.alert('请先添加收货地址。');
      return;
    }

    const payload = {
      receiver: shippingAddress.receiver,
      phone: shippingAddress.phone,
      detail: shippingAddress.detail,
    };

    const nextErrors = collectErrors([
      ['receiver', validateRequired(payload.receiver, '收货人')],
      ['phone', validatePhone(payload.phone)],
      ['detail', validateRequired(payload.detail, '详细地址')],
    ]);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    const validation = cart.validateCheckout(currentUser.id);
    if (!validation.success) {
      window.alert(validation.message);
      navigate('/cart');
      return;
    }

    setSubmitting(true);
    const result = order.createOrderFromCart(currentUser.id, payload);

    if (!result.success) {
      window.alert(result.message);
      setSubmitting(false);
      return;
    }

    navigate(`/pay/${result.order.id}`);
  };

  if (!selectedItems.length) {
    return (
      <main className="pm-page pm-create-order-page">
        <h1>确认订单</h1>
        <p className="pm-help">没有选中商品，请返回购物车勾选要结算的商品。</p>
        <Button type="button" onClick={() => navigate('/cart')}>
          返回购物车
        </Button>
      </main>
    );
  }

  return (
    <main className="pm-page pm-create-order-page pm-create-order-page-checkout">
      <header className="pm-create-order-header">
        <p className="pm-create-order-brand">
          <span className="pm-create-order-pixel" aria-hidden />
          Pixel Mall
        </p>
        <h1 className="pm-create-order-title">确认订单</h1>
        <p className="pm-create-order-subtitle">提交后进入支付，支付成功后才清空购物车已购商品</p>
      </header>

      <OrderAddressSummary address={shippingAddress} returnTo={returnPath} />

      <section className="pm-create-order-goods">
        <h2 className="pm-create-order-section-title">商品清单</h2>
        <div className="pm-cart-list">
          {selectedItems.map((item) => (
            <article className="pm-create-order-goods-item" key={item.id}>
              <div className="pm-cart-media">
                {item.product?.cover ? (
                  <img src={item.product.cover} alt={item.product.name} />
                ) : null}
              </div>
              <div className="pm-cart-info">
                <h3 className="pm-cart-title">{item.product?.name}</h3>
                <p className="pm-cart-spec">x{item.count}</p>
              </div>
              <strong className="pm-price">{formatPrice(item.lineTotal)}</strong>
            </article>
          ))}
        </div>
      </section>

      {errors.detail ? <p className="pm-help has-error">{errors.detail}</p> : null}

      <footer className="pm-create-order-footer">
        <div className="pm-create-order-footer-total">
          <span>应付总额</span>
          <strong className="pm-price">{formatPrice(total)}</strong>
        </div>
        <Button type="button" variant="primary" disabled={submitting} onClick={handleSubmit}>
          {submitting ? '提交中...' : '提交订单'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => navigate('/cart')}>
          返回购物车
        </Button>
      </footer>
    </main>
  );
};

export default CheckoutPage;
