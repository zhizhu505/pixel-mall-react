import { Link, useParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import StatusTag from '../components/common/StatusTag';
import { useServices } from '../hooks/useServices';
import { formatPrice } from '../utils/productDisplay';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const { order } = useServices();
  const parsedOrderId = Number(orderId);
  const currentOrder = order.getOrderById(parsedOrderId);

  if (!currentOrder) {
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

  return (
    <main className="pm-page pm-order-detail-page">
      <Link className="pm-btn pm-btn-ghost" to="/orderList">
        ← 订单列表
      </Link>

      <section className="pm-order-card">
        <header className="pm-order-head">
          <h1 className="pm-order-title">{currentOrder.orderNo}</h1>
          <StatusTag>{order.getStatusText(currentOrder.status)}</StatusTag>
        </header>
        <p className="pm-order-desc">下单时间：{currentOrder.createTime}</p>
        {currentOrder.payTime ? (
          <p className="pm-order-desc">支付时间：{currentOrder.payTime}</p>
        ) : null}
        <p className="pm-order-desc">订单金额：{formatPrice(currentOrder.price)}</p>
      </section>

      <section className="pm-address-card">
        <h2>收货信息</h2>
        <p className="pm-address-name">{currentOrder.address?.receiver}</p>
        <p className="pm-address-phone">{currentOrder.address?.phone}</p>
        <p className="pm-address-text">{currentOrder.address?.detail}</p>
      </section>

      <section className="pm-cart-list">
        <h2>商品清单</h2>
        {(currentOrder.items?.length ? currentOrder.items : [{ goodSnapshot: currentOrder.goodSnapshot, quantity: 1, price: currentOrder.price }]).map((item, index) => (
          <article className="pm-cart-item" key={`${item.goodId || index}-${index}`}>
            <div className="pm-cart-info">
              <h3 className="pm-cart-title">{item.goodSnapshot?.name}</h3>
              <p className="pm-cart-spec">x{item.quantity || 1}</p>
            </div>
            <strong className="pm-price">{formatPrice((item.price || 0) * (item.quantity || 1))}</strong>
          </article>
        ))}
      </section>

      <section className="pm-order-card">
        <h2>物流信息</h2>
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
    </main>
  );
};

export default OrderDetailPage;
