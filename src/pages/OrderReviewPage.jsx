import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import StatusTag from '../components/common/StatusTag';
import StarRating from '../components/common/StarRating';
import { useServices, useServiceVersion } from '../hooks/useServices';
import { formatPrice } from '../utils/productDisplay';
import { showPixelToast } from '../utils/pixelToast';

const getOrderItems = (order) => (order.items?.length
  ? order.items
  : [{ goodId: order.goodId, goodSnapshot: order.goodSnapshot, quantity: 1, price: order.price }]);

const OrderReviewPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, user } = useServices();
  useServiceVersion(order);
  const currentUser = user.getCurrentUser();
  const currentOrder = order.getOrderById(orderId);
  const [forms, setForms] = useState({});

  if (!currentOrder || currentOrder.userId !== currentUser.id || currentOrder.status !== 3) {
    return (
      <main className="pm-page pm-order-detail-page pm-order-service-page pm-order-review-page">
        <EmptyState
          title="暂不能评价"
          description="只有已收货完成的订单可以评价。"
          action={<Link className="pm-btn pm-btn-primary" to="/orderList?status=3">查看已完成订单</Link>}
        />
      </main>
    );
  }

  const updateForm = (goodId, patch) => {
    setForms((current) => ({
      ...current,
      [goodId]: {
        rating: 5,
        content: '',
        ...(current[goodId] || {}),
        ...patch,
      },
    }));
  };

  const handleSubmit = (goodId) => {
    const form = forms[goodId] || { rating: 5, content: '' };
    const result = order.submitReview(currentOrder.id, currentUser.id, { goodId, ...form, rating: Number(form.rating) || 5 });
    showPixelToast(result.message, { tone: result.success ? 'success' : 'warning' });
    if (result.success) {
      setForms((current) => ({ ...current, [goodId]: { rating: 5, content: '' } }));
    }
  };

  return (
    <main className="pm-page pm-order-detail-page pm-order-service-page pm-order-review-page">
      <header className="pm-order-detail-hero">
        <button className="pm-btn pm-btn-ghost pm-back-btn pm-order-detail-back" type="button" onClick={() => navigate(-1)}>返回</button>
        <p className="pm-order-detail-brand">
          <span className="pm-order-detail-pixel" aria-hidden />
          Pixel Review
        </p>
      </header>

      <section className="pm-order-card pm-order-service-summary">
        <header className="pm-order-head">
          <h1 className="pm-order-title">评价订单</h1>
          <StatusTag value="finished">已完成</StatusTag>
        </header>
        <p className="pm-order-desc">订单号：{currentOrder.orderNo}</p>
      </section>

      <section className="pm-order-service-list">
        {getOrderItems(currentOrder).map((item, index) => {
          const goodId = Number(item.goodId || currentOrder.goodId || index);
          const review = (currentOrder.reviews || []).find((entry) => Number(entry.goodId) === goodId);
          const form = forms[goodId] || { rating: 5, content: '' };

          return (
            <article className="pm-order-card pm-order-service-card" key={`${goodId}-${index}`}>
              <header className="pm-order-service-card-head">
                <div>
                  <h2>{item.goodSnapshot?.name || '历史商品'}</h2>
                  <p>x{item.quantity || 1} · {formatPrice((item.price || 0) * (item.quantity || 1))}</p>
                </div>
                <StatusTag value={review ? 'finished' : 'draft'}>{review ? '已评价' : '待评价'}</StatusTag>
              </header>

              {review ? (
                <div className="pm-order-service-result">
                  <p className="pm-order-rating-view">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                  <p>{review.content}</p>
                  <small>{review.createdAt}</small>
                  {review.adminReply ? (
                    <blockquote>
                      <strong>商家回复</strong>
                      <span>{review.adminReply}</span>
                      <small>{review.repliedAt}</small>
                    </blockquote>
                  ) : null}
                </div>
              ) : (
                <div className="pm-order-service-form">
                  <label className="pm-control">
                    <span className="pm-label">评分</span>
                    <StarRating
                      value={Number(form.rating)}
                      onChange={(rating) => updateForm(goodId, { rating })}
                      size={28}
                    />
                    <span className="pm-star-rating-label">
                      {form.rating === 5 && '非常满意'}
                      {form.rating === 4 && '满意'}
                      {form.rating === 3 && '一般'}
                      {form.rating === 2 && '待改进'}
                      {form.rating === 1 && '不满意'}
                    </span>
                  </label>
                  <label className="pm-control">
                    <span className="pm-label">评价内容</span>
                    <textarea
                      className="pm-input pm-textarea"
                      value={form.content}
                      onChange={(event) => updateForm(goodId, { content: event.target.value })}
                      placeholder="说说商品手感、包装或使用体验"
                      rows="4"
                    />
                  </label>
                  <button className="pm-btn pm-btn-primary" type="button" onClick={() => handleSubmit(goodId)}>提交评价</button>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
};

export default OrderReviewPage;
