import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import StatusTag from '../components/common/StatusTag';
import Pagination from '../components/h5/Pagination';
import { ORDER_STATUS_TABS, orderListPathForStatus } from '../constants/orderTabs';
import { usePagination } from '../hooks/usePagination';
import { useServices, useServiceVersion } from '../hooks/useServices';
import { formatPrice, getProductPriceInfo, resolveProductImageSrc } from '../utils/productDisplay';
import { showPixelToast } from '../utils/pixelToast';

const returnReasons = ['七天无理由', '商品破损', '与描述不符', '错发漏发', '其他原因'];

const OrderListPage = () => {
  'use no memo';

  const { order, user, api } = useServices();
  useServiceVersion(order);
  const [searchParams] = useSearchParams();
  const [serviceForms, setServiceForms] = useState({});
  const [pendingConfirmOrderId, setPendingConfirmOrderId] = useState(null);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const currentUser = user.getCurrentUser();
  const status = searchParams.get('status') || 'all';
  const orders = status === 'service'
    ? order.getOrderList({ userId: currentUser.id }).filter((item) => item.status === 3 || item.returns?.length)
    : order.getOrderList({ userId: currentUser.id, status });

  const { page, setPage, totalPages, slice, total, hasPrev, hasNext } = usePagination(orders, 5);

  const handleConfirmReceipt = async (orderId) => {
    setConfirmingReceipt(true);
    const result = await api.orders.confirmReceipt(orderId, currentUser.id);
    showPixelToast(result.message, { tone: result.success ? 'success' : 'warning' });
    setConfirmingReceipt(false);
    if (result.success) {
      setPendingConfirmOrderId(null);
    }
  };

  const updateServiceForm = (formKey, patch) => {
    setServiceForms((current) => ({
      ...current,
      [formKey]: {
        type: 'return-refund',
        reason: returnReasons[0],
        description: '',
        ...(current[formKey] || {}),
        ...patch,
      },
    }));
  };

  const handleRequestReturn = (currentOrder, goodId, formKey) => {
    const form = serviceForms[formKey] || { type: 'return-refund', reason: returnReasons[0], description: '' };
    const result = order.requestReturn(currentOrder.id, currentUser.id, { goodId, ...form });
    showPixelToast(result.message, { tone: result.success ? 'success' : 'warning' });
    if (result.success) {
      setServiceForms((current) => ({
        ...current,
        [formKey]: { type: 'return-refund', reason: returnReasons[0], description: '' },
      }));
    }
  };

  const orderTabs = (
    <header className="pm-orders-topbar">
      <Link
        className="pm-orders-topbar-title"
        to="/orderList"
        onClick={() => setPage(1)}
      >
        我的订单
      </Link>
      <div className="pm-orders-topbar-tabs" role="tablist" aria-label="订单状态筛选">
        {ORDER_STATUS_TABS.map((tab) => (
          <Link
            key={tab.key}
            to={orderListPathForStatus(tab.key)}
            className={`pm-orders-topbar-tab${status === tab.key ? ' is-active' : ''}`}
            onClick={() => setPage(1)}
            aria-current={status === tab.key ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </header>
  );

  return (
    <main className={`pm-page pm-orders-page${status === 'service' ? ' pm-orders-page-service' : ''}`}>
      {orderTabs}
      <div className="pm-orders-body">
        {!orders.length ? (
          <div className="pm-orders-empty-panel">
            <EmptyState
              title="还没有订单"
              description="去商城逛逛，完成第一笔像素风订单吧。"
              action={
                <Link className="pm-btn pm-btn-primary" to="/home">
                  去首页
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <section className="pm-order-list">
              {slice.map((item) => {
                const items = item.items?.length
                  ? item.items
                  : [{ goodSnapshot: item.goodSnapshot, quantity: 1, price: item.price }];
                const firstItem = items[0] || null;
                const extraCount = Math.max(0, items.length - 1);
                const imageSrc = resolveProductImageSrc(firstItem?.goodSnapshot?.cover);
                const originalTotal = items.reduce((sum, orderItem) => {
                  const priceInfo = getProductPriceInfo(orderItem.goodSnapshot || orderItem);
                  return sum + priceInfo.originalPrice * (orderItem.quantity || 1);
                }, 0);
                const hasDiscount = originalTotal > item.price;
                const saleTags = [...new Set(items.map((orderItem) => getProductPriceInfo(orderItem.goodSnapshot || orderItem).saleTag).filter(Boolean))];
                const reviewCount = item.reviews?.length || 0;
                const pendingReturnCount = (item.returns || []).filter((request) => ['pending', 'approved', 'shipped', 'received'].includes(request.status)).length;
                const firstGoodId = Number(firstItem?.goodId || item.goodId || item.id);
                const formKey = `${item.id}-${firstGoodId}`;
                const serviceForm = serviceForms[formKey] || { type: 'return-refund', reason: returnReasons[0], description: '' };
                const firstReturn = (item.returns || []).find((request) => Number(request.goodId) === firstGoodId);
                const activeReturn = (item.returns || []).find((request) => (
                  Number(request.goodId) === firstGoodId && !['rejected', 'refunded'].includes(request.status)
                ));

                const orderStateClass = item.status === 3 ? ' is-finished' : item.status === 2 ? ' is-shipped' : '';

                return (
                  <article className={`pm-order-card pm-order-list-item${orderStateClass}${status === 'service' ? ' is-service-mode' : ''}`} key={item.id}>
                    <div className="pm-order-list-media">
                      {imageSrc ? <img src={imageSrc} alt="" /> : <span aria-hidden />}
                    </div>
                    <div className="pm-order-list-info">
                      <header className="pm-order-list-head">
                        <h2 className="pm-order-title">{firstItem?.goodSnapshot?.name || '历史商品'}{extraCount ? ` 等 ${items.length} 件` : ''}</h2>
                        <StatusTag>{order.getStatusText(item.status)}</StatusTag>
                      </header>
                      <p className="pm-order-desc">{item.orderNo}</p>
                      <p className="pm-order-desc">{item.createTime}</p>
                      <div className="pm-order-list-meta">
                        <strong className="pm-price">{formatPrice(item.price)}</strong>
                        {hasDiscount ? <span className="pm-old-price">{formatPrice(originalTotal)}</span> : null}
                        {saleTags.length === 1 ? <span className="pm-tag pm-tag-sale">{saleTags[0]}</span> : null}
                      </div>
                      {item.status === 3 ? (
                        <div className="pm-order-service-note">
                          <span>评价 {reviewCount}/{items.length}</span>
                          <span>{pendingReturnCount ? `${pendingReturnCount} 个售后` : '无售后'}</span>
                        </div>
                      ) : null}
                      {status === 'service' ? (
                        <section className="pm-order-inline-service">
                          {firstReturn ? (
                            <div className="pm-order-inline-service-status">
                              <strong>{order.getReturnTypeText(firstReturn.type)}</strong>
                              <StatusTag>{order.getReturnStatusText(firstReturn.status)}</StatusTag>
                              <span>{firstReturn.reason}：{firstReturn.description || '暂无描述'}</span>
                            </div>
                          ) : (
                            <div className="pm-order-inline-service-form">
                              <select
                                className="pm-select"
                                value={serviceForm.type}
                                onChange={(event) => updateServiceForm(formKey, { type: event.target.value })}
                              >
                                <option value="return-refund">退货退款</option>
                                <option value="refund">仅退款</option>
                              </select>
                              <select
                                className="pm-select"
                                value={serviceForm.reason}
                                onChange={(event) => updateServiceForm(formKey, { reason: event.target.value })}
                              >
                                {returnReasons.map((reason) => <option value={reason} key={reason}>{reason}</option>)}
                              </select>
                              <input
                                className="pm-input"
                                value={serviceForm.description}
                                onChange={(event) => updateServiceForm(formKey, { description: event.target.value })}
                                placeholder="填写问题描述"
                              />
                              <button
                                className="pm-btn pm-btn-primary"
                                disabled={Boolean(activeReturn)}
                                type="button"
                                onClick={() => handleRequestReturn(item, firstGoodId, formKey)}
                              >
                                提交
                              </button>
                            </div>
                          )}
                        </section>
                      ) : null}
                      <footer className="pm-order-foot">
                        <Link className="pm-btn pm-btn-ghost" to={`/orderDetail/${item.id}`}>
                          详情
                        </Link>
                        {item.status === 0 ? (
                          <Link className="pm-btn pm-btn-primary" to={`/pay/${item.id}`}>
                            支付
                          </Link>
                        ) : null}
                        {item.status === 2 ? (
                          <button
                            className="pm-btn pm-btn-primary"
                            type="button"
                            onClick={() => setPendingConfirmOrderId(item.id)}
                          >
                            收货
                          </button>
                        ) : null}
                        {item.status === 3 ? (
                          <>
                            <Link className="pm-btn pm-btn-mint" to={`/orderReview/${item.id}`}>
                              评价
                            </Link>
                            <Link className="pm-btn pm-btn-primary" to="/orderList?status=service">
                              售后
                            </Link>
                          </>
                        ) : null}
                      </footer>
                    </div>
                  </article>
                );
              })}
            </section>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPrev={() => hasPrev && setPage(page - 1)}
              onNext={() => hasNext && setPage(page + 1)}
            />
            <Modal
              open={pendingConfirmOrderId !== null}
              title="确认收货"
              onClose={() => !confirmingReceipt && setPendingConfirmOrderId(null)}
              onConfirm={() => handleConfirmReceipt(pendingConfirmOrderId)}
              confirmText={confirmingReceipt ? '确认中...' : '确认收货'}
              confirmDisabled={confirmingReceipt || pendingConfirmOrderId === null}
              confirmVariant="primary"
            >
              <p className="pm-help">确认已收到商品后，订单会进入已完成状态，并可继续评价或申请售后。</p>
            </Modal>
          </>
        )}
      </div>
    </main>
  );
};

export default OrderListPage;
