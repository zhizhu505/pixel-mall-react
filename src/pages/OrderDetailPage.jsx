import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import StatusTag from '../components/common/StatusTag';
import { useServices, useServiceVersion } from '../hooks/useServices';
import { formatPrice, getProductPriceInfo } from '../utils/productDisplay';
import { showPixelToast } from '../utils/pixelToast';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, user, api } = useServices();
  useServiceVersion(order);
  const currentUser = user.getCurrentUser();
  const parsedOrderId = Number(orderId);
  const currentOrder = order.getOrderById(parsedOrderId);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);

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

  const handleConfirmReceipt = async () => {
    setConfirmingReceipt(true);
    const result = await api.orders.confirmReceipt(currentOrder.id, currentUser.id);
    showPixelToast(result.message, { tone: result.success ? 'success' : 'warning' });
    setConfirmingReceipt(false);
    if (result.success) {
      setConfirmModalOpen(false);
    }
  };

  return (
    <main className="pm-page pm-order-detail-page">
      <header className="pm-order-detail-hero">
        <button className="pm-btn pm-btn-ghost pm-back-btn pm-order-detail-back" type="button" onClick={() => navigate(-1)}>
          返回
        </button>
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
        <div className="pm-order-detail-goods">
          <h2 className="pm-order-detail-section-title">商品清单</h2>
          <div className="pm-order-detail-good-list">
            {(currentOrder.items?.length ? currentOrder.items : [{ goodId: currentOrder.goodId, goodSnapshot: currentOrder.goodSnapshot, quantity: 1, price: currentOrder.price }]).map((item, index) => {
              const priceInfo = getProductPriceInfo(item.goodSnapshot || item);
              const goodId = Number(item.goodId || currentOrder.goodId || index);
              const review = (currentOrder.reviews || []).find((entry) => Number(entry.goodId) === goodId);
              const returnRequest = (currentOrder.returns || []).find((entry) => Number(entry.goodId) === goodId);

              return (
                <article className="pm-cart-item pm-order-detail-good-item" key={`${item.goodId || index}-${index}`}>
                  <div className="pm-cart-info">
                    <h3 className="pm-cart-title">{item.goodSnapshot?.name}</h3>
                    <p className="pm-cart-spec">x{item.quantity || 1}</p>
                    {priceInfo.saleTag ? <span className="pm-tag pm-tag-sale">{priceInfo.saleTag}</span> : null}
                    {currentOrder.status === 3 ? (
                      <div className="pm-order-item-service-tags">
                        <span className="pm-tag">{review ? '已评价' : '待评价'}</span>
                        <span className="pm-tag">{returnRequest ? order.getReturnStatusText(returnRequest.status) : '可申请售后'}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="pm-order-detail-good-price">
                    <strong className="pm-price">{formatPrice((item.price || 0) * (item.quantity || 1))}</strong>
                    {priceInfo.hasDiscount ? <span className="pm-old-price">{formatPrice(priceInfo.originalPrice * (item.quantity || 1))}</span> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pm-address-card pm-order-detail-address">
        <h2 className="pm-order-detail-section-title">收货信息</h2>
        <div className="pm-order-detail-address-row">
          <p className="pm-address-name">{currentOrder.address?.receiver}</p>
          <p className="pm-address-phone">{currentOrder.address?.phone}</p>
        </div>
        <p className="pm-address-text">{currentOrder.address?.detail}</p>
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
        <button className="pm-btn pm-btn-primary" type="button" onClick={() => setConfirmModalOpen(true)}>
          确认收货
        </button>
      ) : null}
      {currentOrder.status === 3 ? (
        <section className="pm-order-card pm-order-service-actions">
          <h2 className="pm-order-detail-section-title">售后服务</h2>
          <p>已收货订单可以评价商品，也可以按商品发起退货/售后申请。</p>
          <div>
            <Link className="pm-btn pm-btn-mint" to={`/orderReview/${currentOrder.id}`}>评价订单</Link>
            <Link className="pm-btn pm-btn-primary" to="/orderList?status=service">申请售后/退货</Link>
          </div>
        </section>
      ) : null}
      <Modal
        open={confirmModalOpen}
        title="确认收货"
        onClose={() => !confirmingReceipt && setConfirmModalOpen(false)}
        onConfirm={handleConfirmReceipt}
        confirmText={confirmingReceipt ? '确认中...' : '确认收货'}
        confirmDisabled={confirmingReceipt}
        confirmVariant="primary"
      >
        <p className="pm-help">确认已收到这笔订单的商品后，订单状态会更新为已完成。</p>
      </Modal>
    </main>
  );
};

export default OrderDetailPage;
