import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import StatusTag from '../components/common/StatusTag';
import { useServices, useServiceVersion } from '../hooks/useServices';
import { formatPrice } from '../utils/productDisplay';
import { showPixelToast } from '../utils/pixelToast';

const returnReasons = ['七天无理由', '商品破损', '与描述不符', '错发漏发', '其他原因'];

const getOrderItems = (order) => (order.items?.length
  ? order.items
  : [{ goodId: order.goodId, goodSnapshot: order.goodSnapshot, quantity: 1, price: order.price }]);

const getReturnTagValue = (status) => ({
  pending: 'paid',
  approved: 'shipped',
  rejected: 'deleted',
  shipped: 'draft',
  received: 'on-sale',
  refunded: 'finished',
}[status] || 'draft');

const OrderReturnPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, user } = useServices();
  useServiceVersion(order);
  const currentUser = user.getCurrentUser();
  const currentOrder = order.getOrderById(orderId);
  const [forms, setForms] = useState({});
  const [shipmentForms, setShipmentForms] = useState({});

  if (!currentOrder || currentOrder.userId !== currentUser.id || currentOrder.status !== 3) {
    return (
      <main className="pm-page pm-order-detail-page pm-order-service-page pm-order-return-page">
        <EmptyState
          title="暂不能申请售后"
          description="只有已收货完成的订单可以申请评价后的退货/售后。"
          action={<Link className="pm-btn pm-btn-primary" to="/orderList?status=3">查看已完成订单</Link>}
        />
      </main>
    );
  }

  const updateForm = (goodId, patch) => {
    setForms((current) => ({
      ...current,
      [goodId]: {
        type: 'return-refund',
        reason: returnReasons[0],
        description: '',
        ...(current[goodId] || {}),
        ...patch,
      },
    }));
  };

  const handleRequestReturn = (goodId) => {
    const form = forms[goodId] || { type: 'return-refund', reason: returnReasons[0], description: '' };
    const result = order.requestReturn(currentOrder.id, currentUser.id, { goodId, ...form });
    showPixelToast(result.message, { tone: result.success ? 'success' : 'warning' });
    if (result.success) {
      setForms((current) => ({ ...current, [goodId]: { type: 'return-refund', reason: returnReasons[0], description: '' } }));
    }
  };

  const handleSubmitShipment = (returnId) => {
    const result = order.submitReturnShipment(currentOrder.id, currentUser.id, returnId, shipmentForms[returnId]);
    showPixelToast(result.message, { tone: result.success ? 'success' : 'warning' });
    if (result.success) {
      setShipmentForms((current) => ({ ...current, [returnId]: '' }));
    }
  };

  return (
    <main className="pm-page pm-order-detail-page pm-order-service-page pm-order-return-page">
      <header className="pm-order-detail-hero">
        <button className="pm-btn pm-btn-ghost pm-back-btn pm-order-detail-back" type="button" onClick={() => navigate(-1)}>返回</button>
        <p className="pm-order-detail-brand">
          <span className="pm-order-detail-pixel" aria-hidden />
          Pixel Service
        </p>
      </header>

      <section className="pm-order-card pm-order-service-summary">
        <header className="pm-order-head">
          <h1 className="pm-order-title">退货 / 售后</h1>
          <StatusTag value="finished">已完成</StatusTag>
        </header>
        <p className="pm-order-desc">订单号：{currentOrder.orderNo}</p>
      </section>

      <section className="pm-order-service-list">
        {getOrderItems(currentOrder).map((item, index) => {
          const goodId = Number(item.goodId || currentOrder.goodId || index);
          const requests = (currentOrder.returns || []).filter((entry) => Number(entry.goodId) === goodId);
          const activeRequest = requests.find((entry) => !['rejected', 'refunded'].includes(entry.status));
          const form = forms[goodId] || { type: 'return-refund', reason: returnReasons[0], description: '' };

          return (
            <article className="pm-order-card pm-order-service-card" key={`${goodId}-${index}`}>
              <header className="pm-order-service-card-head">
                <div>
                  <h2>{item.goodSnapshot?.name || '历史商品'}</h2>
                  <p>x{item.quantity || 1} · {formatPrice((item.price || 0) * (item.quantity || 1))}</p>
                </div>
                <StatusTag value={activeRequest ? getReturnTagValue(activeRequest.status) : 'draft'}>{activeRequest ? order.getReturnStatusText(activeRequest.status) : '可申请'}</StatusTag>
              </header>

              {requests.length ? (
                <div className="pm-order-service-result">
                  {requests.map((request) => (
                    <section className="pm-return-status-card" key={request.id}>
                      <header>
                        <strong>{order.getReturnTypeText(request.type)}</strong>
                        <StatusTag value={getReturnTagValue(request.status)}>{order.getReturnStatusText(request.status)}</StatusTag>
                      </header>
                      <p>{request.reason}：{request.description}</p>
                      <small>申请时间：{request.createdAt}</small>
                      {request.adminNote ? <small>商家备注：{request.adminNote}</small> : null}
                      {request.returnTrackingNo ? <small>退货物流：{request.returnTrackingNo}</small> : null}
                      {request.status === 'approved' && request.type === 'return-refund' ? (
                        <div className="pm-order-service-form pm-return-shipment-form">
                          <label className="pm-control">
                            <span className="pm-label">退货物流单号</span>
                            <input
                              className="pm-input"
                              value={shipmentForms[request.id] || ''}
                              onChange={(event) => setShipmentForms((current) => ({ ...current, [request.id]: event.target.value }))}
                              placeholder="填写寄回物流单号"
                            />
                          </label>
                          <button className="pm-btn pm-btn-primary" type="button" onClick={() => handleSubmitShipment(request.id)}>提交物流</button>
                        </div>
                      ) : null}
                    </section>
                  ))}
                </div>
              ) : null}

              {!activeRequest ? (
                <div className="pm-order-service-form">
                  <label className="pm-control">
                    <span className="pm-label">售后类型</span>
                    <select className="pm-select" value={form.type} onChange={(event) => updateForm(goodId, { type: event.target.value })}>
                      <option value="return-refund">退货退款</option>
                      <option value="refund">仅退款</option>
                    </select>
                  </label>
                  <label className="pm-control">
                    <span className="pm-label">申请原因</span>
                    <select className="pm-select" value={form.reason} onChange={(event) => updateForm(goodId, { reason: event.target.value })}>
                      {returnReasons.map((reason) => <option value={reason} key={reason}>{reason}</option>)}
                    </select>
                  </label>
                  <label className="pm-control">
                    <span className="pm-label">问题描述</span>
                    <textarea
                      className="pm-input pm-textarea"
                      value={form.description}
                      onChange={(event) => updateForm(goodId, { description: event.target.value })}
                      placeholder="描述退货原因、商品状态或包装情况"
                      rows="4"
                    />
                  </label>
                  <button className="pm-btn pm-btn-primary" type="button" onClick={() => handleRequestReturn(goodId)}>提交售后申请</button>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
};

export default OrderReturnPage;
