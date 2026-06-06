import { Link, useSearchParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import StatusTag from '../components/common/StatusTag';
import Pagination from '../components/h5/Pagination';
import { ORDER_STATUS_TABS, orderListPathForStatus } from '../constants/orderTabs';
import { usePagination } from '../hooks/usePagination';
import { useServices, useServiceVersion } from '../hooks/useServices';
import { formatPrice, getProductPriceInfo } from '../utils/productDisplay';

const OrderListPage = () => {
  'use no memo';

  const { order, user } = useServices();
  useServiceVersion(order);
  const [searchParams] = useSearchParams();
  const currentUser = user.getCurrentUser();
  const status = searchParams.get('status') || 'all';
  const orders = order.getOrderList({ userId: currentUser.id, status });

  const { page, setPage, totalPages, slice, total, hasPrev, hasNext } = usePagination(orders, 5);

  const handleConfirmReceipt = (orderId) => {
    if (!window.confirm('确认已收到商品？')) {
      return;
    }

    const result = order.confirmReceipt(orderId, currentUser.id);
    if (!result.success) {
      window.alert(result.message);
    }
  };

  const orderTabs = (
    <div className="pm-order-tabs" role="tablist" aria-label="订单状态筛选">
      {ORDER_STATUS_TABS.map((tab) => (
        <Link
          key={tab.key}
          to={orderListPathForStatus(tab.key)}
          className={`pm-order-tab${status === tab.key ? ' is-active' : ''}`}
          onClick={() => setPage(1)}
          aria-current={status === tab.key ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );

  return (
    <main className="pm-page pm-orders-page">
      <header className="pm-orders-header">
        <p className="pm-orders-header-brand">
          <span className="pm-orders-header-pixel" aria-hidden />
          Pixel Mall
        </p>
        <h1 className="pm-orders-header-title">我的订单</h1>
        <p className="pm-orders-header-desc">查看支付、发货与完成记录</p>
      </header>

      <div className="pm-orders-body">
        {orderTabs}

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
                const originalTotal = items.reduce((sum, orderItem) => {
                  const priceInfo = getProductPriceInfo(orderItem.goodSnapshot || orderItem);
                  return sum + priceInfo.originalPrice * (orderItem.quantity || 1);
                }, 0);
                const hasDiscount = originalTotal > item.price;
                const saleTags = [...new Set(items.map((orderItem) => getProductPriceInfo(orderItem.goodSnapshot || orderItem).saleTag).filter(Boolean))];

                return (
                  <article className="pm-order-card" key={item.id}>
                    <header className="pm-order-head">
                      <h2 className="pm-order-title">{item.orderNo}</h2>
                      <StatusTag>{order.getStatusText(item.status)}</StatusTag>
                    </header>
                    <p className="pm-order-desc">{item.createTime}</p>
                    <div className="pm-order-product pm-order-product-row">
                      <span className="pm-order-product-name">
                        {firstItem?.goodSnapshot?.name || '历史商品'}{extraCount ? ` 等 ${items.length} 件商品` : ''}
                      </span>
                      <div>
                        <strong className="pm-price">{formatPrice(item.price)}</strong>
                        {hasDiscount ? <span className="pm-old-price">{formatPrice(originalTotal)}</span> : null}
                        {saleTags.length === 1 ? <span className="pm-tag pm-tag-sale">{saleTags[0]}</span> : null}
                      </div>
                    </div>
                    <footer className="pm-order-foot">
                      <Link className="pm-btn pm-btn-ghost" to={`/orderDetail/${item.id}`}>
                        查看详情
                      </Link>
                      {item.status === 0 ? (
                        <Link className="pm-btn pm-btn-primary" to={`/pay/${item.id}`}>
                          去支付
                        </Link>
                      ) : null}
                      {item.status === 2 ? (
                        <button
                          className="pm-btn pm-btn-primary"
                          type="button"
                          onClick={() => handleConfirmReceipt(item.id)}
                        >
                          确认收货
                        </button>
                      ) : null}
                    </footer>
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
          </>
        )}
      </div>
    </main>
  );
};

export default OrderListPage;
