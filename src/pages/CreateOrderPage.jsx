import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import OrderAddressSummary from '../components/h5/OrderAddressSummary';
import { useServices } from '../hooks/useServices';
import { formatPrice, getProductTone } from '../utils/productDisplay';
import { readSelectedAddressId } from '../utils/orderAddress';
import { collectErrors, validatePhone, validateRequired } from '../utils/validation';

const CreateOrderPage = () => {
  'use no memo';

  const { goodId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { good, order, user, address } = useServices();
  const currentUser = user.getCurrentUser();
  const parsedGoodId = Number(goodId);
  const product = good.getGoodById(parsedGoodId);
  const returnPath = `/createOrder/${goodId}`;

  const defaultAddr = address.getDefaultAddress(currentUser.id);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const navAddressId = readSelectedAddressId(location.state);
  const effectiveAddressId = navAddressId || defaultAddr?.id || '';

  void address.getRevision();
  const shippingAddress = effectiveAddressId
    ? address.getAddressById(effectiveAddressId) || address.getDefaultAddress(currentUser.id)
    : address.getDefaultAddress(currentUser.id);

  useEffect(() => {
    if (!navAddressId) {
      return;
    }
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  }, [navAddressId, location.pathname, location.search, navigate]);

  if (!product) {
    return (
      <main className="pm-page pm-create-order-page">
        <EmptyState
          title="商品不存在"
          description="无法创建订单。"
          action={
            <Link className="pm-btn pm-btn-primary" to="/home">
              回首页
            </Link>
          }
        />
      </main>
    );
  }

  const lineTotal = product.price * quantity;

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

    setSubmitting(true);
    const created = order.createOrder(
      currentUser.id,
      product.id,
      product.price,
      quantity,
      payload,
    );

    if (!created) {
      setErrors({ detail: '商品不可购买或库存不足。' });
      setSubmitting(false);
      return;
    }

    navigate(`/pay/${created.id}`);
  };

  return (
    <main className="pm-page pm-create-order-page pm-create-order-page-buy">
      <header className="pm-create-order-header">
        <p className="pm-create-order-brand">
          <span className="pm-create-order-pixel" aria-hidden />
          Pixel Mall
        </p>
        <h1 className="pm-create-order-title">创建订单</h1>
      </header>

      <article className="pm-create-order-product">
        <div className="pm-create-order-product-media">
          {product.cover ? (
            <img src={product.cover} alt={product.name} />
          ) : (
            <div className={`pm-pixel-product ${getProductTone(product.id)}`} aria-hidden />
          )}
        </div>
        <div className="pm-create-order-product-body">
          <h2 className="pm-create-order-product-name">{product.name}</h2>
          <p className="pm-create-order-product-meta">
            <span className="pm-price">{formatPrice(product.price)}</span>
            <span className="pm-create-order-stock">库存 {product.stock}</span>
          </p>
          <div className="pm-quantity pm-quantity-compact">
            <button
              type="button"
              className="pm-quantity-btn"
              aria-label="减少数量"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              -
            </button>
            <span className="pm-quantity-value">{quantity}</span>
            <button
              type="button"
              className="pm-quantity-btn"
              aria-label="增加数量"
              disabled={quantity >= product.stock}
              onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
            >
              +
            </button>
          </div>
        </div>
        <div className="pm-create-order-product-total">
          <span className="pm-create-order-product-total-label">小计</span>
          <strong className="pm-price">{formatPrice(lineTotal)}</strong>
        </div>
      </article>

      <OrderAddressSummary address={shippingAddress} returnTo={returnPath} />

      {errors.detail ? <p className="pm-help has-error pm-create-order-error">{errors.detail}</p> : null}

      <footer className="pm-create-order-footer">
        <div className="pm-create-order-footer-total">
          <span>应付</span>
          <strong className="pm-price">{formatPrice(lineTotal)}</strong>
        </div>
        <Button type="button" variant="primary" disabled={submitting} onClick={handleSubmit}>
          {submitting ? '提交中...' : '提交订单'}
        </Button>
      </footer>
    </main>
  );
};

export default CreateOrderPage;
