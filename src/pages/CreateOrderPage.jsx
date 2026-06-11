import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import OrderAddressSummary from '../components/h5/OrderAddressSummary';
import { useServices, useServiceVersion } from '../hooks/useServices';
import { formatPrice, getProductPriceInfo, getProductTone } from '../utils/productDisplay';
import { readSelectedAddressId } from '../utils/orderAddress';
import { showPixelToast } from '../utils/pixelToast';
import { collectErrors, validatePhone, validateRequired } from '../utils/validation';

const readPendingOrderState = (goodId) => {
  try {
    const rawValue = window.sessionStorage.getItem(`pm-pending-order-${goodId}`);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
};

const clearPendingOrderState = (goodId) => {
  try {
    window.sessionStorage.removeItem(`pm-pending-order-${goodId}`);
  } catch {
    return;
  }
};

const CreateOrderPage = () => {
  'use no memo';

  const { goodId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { good, user, address, api } = useServices();
  useServiceVersion(good);
  const currentUser = user.getCurrentUser();
  const parsedGoodId = Number(goodId);
  const product = good.getGoodById(parsedGoodId);
  const returnPath = `/createOrder/${goodId}`;
  const pendingOrderState = location.state?.selectedSpecs ? location.state : readPendingOrderState(goodId) || {};

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

  const selectedSpecsState = pendingOrderState.selectedSpecs && typeof pendingOrderState.selectedSpecs === 'object' ? pendingOrderState.selectedSpecs : {};
  const variantIdState = pendingOrderState.variantId || '';
  const selectedVariant = product.variants?.find((variant) => variant.id === variantIdState) || null;
  const priceInfo = getProductPriceInfo(product);
  const unitPrice = Number(selectedVariant?.price ?? priceInfo.currentPrice) || 0;
  const lineTotal = unitPrice * quantity;
  const maxStock = Number(selectedVariant?.stock ?? product.stock) || 0;
  const selectedSpecText = pendingOrderState.specText || product.specGroups
    ?.map((group) => {
      const option = group.options?.find((item) => item.id === selectedSpecsState[group.id]);
      return option?.label || '';
    })
    .filter(Boolean)
    .join(' / ') || '';

  const handleSubmit = async () => {
    if (!shippingAddress) {
      showPixelToast('请先添加收货地址。');
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
      showPixelToast('请先确认收货地址信息完整。');
      return;
    }

    setSubmitting(true);
    const created = await api.orders.create(
      currentUser.id,
      product.id,
      unitPrice,
      quantity,
      payload,
      {
        selectedSpecs: selectedSpecsState,
        variantId: selectedVariant?.id || variantIdState,
        specText: selectedSpecText,
      },
    );

    if (!created) {
      setErrors({ detail: '商品不可购买或库存不足。' });
      showPixelToast('商品不可购买或库存不足。');
      setSubmitting(false);
      return;
    }

    clearPendingOrderState(goodId);
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
            <span className="pm-price">{formatPrice(unitPrice)}</span>
            {priceInfo.hasDiscount ? <span className="pm-old-price">{formatPrice(selectedVariant?.originalPrice ?? priceInfo.originalPrice)}</span> : null}
            {priceInfo.saleTag ? <span className="pm-tag pm-tag-sale">{priceInfo.saleTag}</span> : null}
            {selectedSpecText ? <span className="pm-tag pm-tag-info">{selectedSpecText}</span> : null}
            <span className="pm-create-order-stock">库存 {maxStock}</span>
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
              disabled={quantity >= maxStock}
              onClick={() => setQuantity((value) => Math.min(maxStock, value + 1))}
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
