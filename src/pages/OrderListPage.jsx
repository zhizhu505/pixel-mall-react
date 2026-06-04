import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import StatusTag from '../components/common/StatusTag';
import Pagination from '../components/h5/Pagination';
import { ORDER_STATUS_TABS, orderListPathForStatus } from '../constants/orderTabs';
import { usePagination } from '../hooks/usePagination';
import { useServices } from '../hooks/useServices';
import { formatPrice } from '../utils/productDisplay';

const OrderListPage = () => {
  'use no memo';

  const { order, user } = useServices();
  const [searchParams] = useSearchParams();
  const currentUser = user.getCurrentUser();
  const status = searchParams.get('status') || 'all';

  const orders = useMemo(
    () => order.getOrderList({ userId: currentUser.id, status }),
    [order, currentUser.id, status],
  );

  const { page, setPage, totalPages, slice, total, hasPrev, hasNext } = usePagination(orders, 5);

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
              {slice.map((item) => (
                <article className="pm-order-card" key={item.id}>
                  <header className="pm-order-head">
                    <h2 className="pm-order-title">{item.orderNo}</h2>
                    <StatusTag>{order.getStatusText(item.status)}</StatusTag>
                  </header>
                  <p className="pm-order-desc">{item.createTime}</p>
                  <div className="pm-order-product pm-order-product-row">
                    <span className="pm-order-product-name">
                      {item.goodSnapshot?.name || '组合订单'}
                    </span>
                    <strong className="pm-price">{formatPrice(item.price)}</strong>
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
                  </footer>
                </article>
              ))}
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
