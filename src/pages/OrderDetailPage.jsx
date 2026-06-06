import { Link, useParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import StatusTag from '../components/common/StatusTag';
import { useServices, useServiceVersion } from '../hooks/useServices';
import { formatPrice, getProductPriceInfo } from '../utils/productDisplay';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const { order, user } = useServices();
  useServiceVersion(order);
  const currentUser = user.getCurrentUser();
  const parsedOrderId = Number(orderId);
  const currentOrder = order.getOrderById(parsedOrderId);

  if (!currentOrder || currentOrder.userId !== currentUser.id) {
    return (
      <main className="pm-page pm-order-detail-page">
        <EmptyState
          title="订单不存在"
          description="请返回订单列表查看。"
          action={
            <Link className="pm-btn pm-btn-primary" to="/orderList">
              订单列表
            </Link>
          }
        />
      </main>
    );
  }

  const handleConfirmReceipt = () => {
    if (!window.confirm('确认已收到商品？')) {
      return;
    }

    const result = order.confirmReceipt(currentOrder.id, currentUser.id);
    if (!result.success) {
      window.alert(result.message);
    }
  };

  return (
    <main className="pm-page pm-order-detail-page">
      <header className="pm-order-detail-hero">
        <Link className="pm-btn pm-btn-ghost pm-order-detail-back" to="/orderList">
          ← 订单列表
        </Link>
        <p className="pm-order-detail-brand">
          <span className="pm-order-detail-pixel" aria-hidden />
          Pixel Receipt
        </p>
      </header>

      <section className="pm-order-card pm-order-detail-summary">
        <header className="pm-order-head">
          <h1 className="pm-order-title">{currentOrder.orderNo}</h1>
          <StatusTag>{order.getStatusText(currentOrder.status)}</StatusTag>
        </header>
        <div className="pm-order-detail-meta-grid">
          <p className="pm-order-desc">下单时间：{currentOrder.createTime}</p>
          {currentOrder.payTime ? (
            <p className="pm-order-desc">支付时间：{currentOrder.payTime}</p>
          ) : null}
          <p className="pm-order-desc pm-order-detail-amount">订单金额：{formatPrice(currentOrder.price)}</p>
        </div>
      </section>

      <section className="pm-address-card pm-order-detail-address">
        <h2 className="pm-order-detail-section-title">收货信息</h2>
        <p className="pm-address-name">{currentOrder.address?.receiver}</p>
        <p className="pm-address-phone">{currentOrder.address?.phone}</p>
        <p className="pm-address-text">{currentOrder.address?.detail}</p>
      </section>

      <section className="pm-cart-list pm-order-detail-goods">
        <h2 className="pm-order-detail-section-title">商品清单</h2>
        {(currentOrder.items?.length ? currentOrder.items : [{ goodSnapshot: currentOrder.goodSnapshot, quantity: 1, price: currentOrder.price }]).map((item, index) => {
          const priceInfo = getProductPriceInfo(item.goodSnapshot || item);

          return (
            <article className="pm-cart-item pm-order-detail-good-item" key={`${item.goodId || index}-${index}`}>
              <div className="pm-cart-info">
                <h3 className="pm-cart-title">{item.goodSnapshot?.name}</h3>
                <p className="pm-cart-spec">x{item.quantity || 1}</p>
                {priceInfo.saleTag ? <span className="pm-tag pm-tag-sale">{priceInfo.saleTag}</span> : null}
              </div>
              <div>
                <strong className="pm-price">{formatPrice((item.price || 0) * (item.quantity || 1))}</strong>
                {priceInfo.hasDiscount ? <span className="pm-old-price">{formatPrice(priceInfo.originalPrice * (item.quantity || 1))}</span> : null}
              </div>
            </article>
          );
        })}
      </section>

      <section className="pm-order-card pm-order-detail-logistics">
        <h2 className="pm-order-detail-section-title">物流信息</h2>
        {currentOrder.logistics?.length ? (
          <ul className="pm-logistics-list">
            {currentOrder.logistics.map((node, index) => (
              <li className="pm-logistics-item" key={`${node.time}-${index}`}>
                <time>{node.time}</time>
                <p>{node.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pm-help">暂无物流信息</p>
        )}
      </section>

      {currentOrder.status === 0 ? (
        <Link className="pm-btn pm-btn-primary" to={`/pay/${currentOrder.id}`}>
          继续支付
        </Link>
      ) : null}
      {currentOrder.status === 2 ? (
        <button className="pm-btn pm-btn-primary" type="button" onClick={handleConfirmReceipt}>
          确认收货
        </button>
      ) : null}
    </main>
  );
};

export default OrderDetailPage;
