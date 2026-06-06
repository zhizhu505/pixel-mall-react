import { useContext, useEffect, useState } from 'react';
import PermissionGate from '../../components/admin/PermissionGate';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import StatusTag from '../../components/common/StatusTag';
import Pagination from '../../components/h5/Pagination';
import { ServiceContext } from '../../contexts/ServiceContext';
import { useServiceVersion } from '../../hooks/useServices';
import { usePagination } from '../../hooks/usePagination';
import { formatPrice, getProductPriceInfo } from '../../utils/productDisplay';

const statusTextMap = {
  0: { tag: 'unpaid', label: '未支付' },
  1: { tag: 'paid', label: '已支付' },
  2: { tag: 'shipped', label: '已发货' },
  3: { tag: 'finished', label: '已完成' },
};

const AdminOrdersPage = () => {
  const { order } = useContext(ServiceContext);
  const [filters, setFilters] = useState({ keyword: '', status: 'all' });
  const [message, setMessage] = useState('');
  const [viewingOrderId, setViewingOrderId] = useState(null);

  useServiceVersion(order);

  const orders = order.getOrderList(filters);
  const viewingOrder = viewingOrderId ? order.getOrderById(viewingOrderId) : null;
  const {
    page,
    setPage,
    totalPages,
    total,
    slice: pagedOrders,
    hasPrev,
    hasNext,
  } = usePagination(orders, 10);

  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleShip = (orderId) => {
    const result = order.shipOrder(orderId);
    setMessage(result.message);
  };

  const handleRefresh = () => {
    order.reload();
    setMessage('订单数据已刷新。');
  };

  return (
    <div className="pm-admin-orders-page">
      <div className="pm-admin-page-header">
        <div>
          <h2 className="pm-section-title">订单管理</h2>
          <p className="pm-help">支持订单筛选、发货和物流信息展示，完成后由买家确认收货。</p>
        </div>
        <Button type="button" variant="ghost" onClick={handleRefresh}>刷新</Button>
      </div>

      {message ? <div className="pm-alert">{message}</div> : null}

      <section className="pm-admin-page-filters">
        <label className="pm-control">
          <span className="pm-label">搜索订单</span>
          <input className="pm-input" name="keyword" value={filters.keyword} onChange={handleFilterChange} placeholder="订单号 / 商品 / 用户" />
        </label>
        <label className="pm-control">
          <span className="pm-label">状态筛选</span>
          <select className="pm-select" name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="all">全部状态</option>
            <option value="0">未支付</option>
            <option value="1">已支付</option>
            <option value="2">已发货</option>
            <option value="3">已完成</option>
          </select>
        </label>
      </section>

      {orders.length ? (
        <div className="pm-admin-table-panel">
          <div className="pm-table-wrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>用户</th>
                  <th>商品</th>
                  <th>金额</th>
                  <th>状态</th>
                  <th>物流信息</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {pagedOrders.map((currentOrder) => {
                  const statusView = statusTextMap[currentOrder.status] || statusTextMap[3];
                  const orderItems = currentOrder.items?.length
                    ? currentOrder.items
                    : [{ goodSnapshot: currentOrder.goodSnapshot, quantity: 1, price: currentOrder.price }];
                  const firstItem = orderItems[0] || null;
                  return (
                    <tr key={currentOrder.id}>
                      <td>
                        <strong>{currentOrder.orderNo}</strong>
                        <p className="pm-help">{currentOrder.createTime}</p>
                      </td>
                      <td>{currentOrder.userSnapshot?.nickname || '匿名用户'}</td>
                      <td>{firstItem?.goodSnapshot?.name || '历史商品'}{orderItems.length > 1 ? ` 等 ${orderItems.length} 件` : ''}</td>
                      <td>{formatPrice(currentOrder.price)}</td>
                      <td><StatusTag value={statusView.tag}>{statusView.label}</StatusTag></td>
                      <td>
                        <ul className="pm-admin-order-logistics">
                          {(currentOrder.logistics || []).slice(0, 2).map((log) => (
                            <li key={`${currentOrder.id}-${log.time}`}>
                              <strong>{log.time}</strong>
                              <span>{log.text}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <div className="pm-admin-inline-actions">
                          <Button type="button" variant="ghost" onClick={() => setViewingOrderId(currentOrder.id)}>查看</Button>
                          <PermissionGate permission="orders:manage">
                            <Button type="button" variant="mint" onClick={() => handleShip(currentOrder.id)} disabled={currentOrder.status !== 1}>发货</Button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            className="pm-admin-pagination"
            page={page}
            totalPages={totalPages}
            total={total}
            onPrev={() => hasPrev && setPage(page - 1)}
            onNext={() => hasNext && setPage(page + 1)}
          />
        </div>
      ) : (
        <EmptyState title="暂无订单" description="当前筛选条件下没有订单数据。" iconSrc="/images/admin/empty/no-order.svg" />
      )}

      <Modal
        cancelText=""
        confirmText=""
        onClose={() => setViewingOrderId(null)}
        onConfirm={() => setViewingOrderId(null)}
        open={Boolean(viewingOrder)}
        title="订单详情"
      >
        {viewingOrder ? (
          <div className="pm-admin-panel pm-admin-detail-panel">
            <div className="pm-admin-detail-grid">
              <div>
                <p className="pm-label">订单号</p>
                <h3 className="pm-admin-card-title">{viewingOrder.orderNo}</h3>
              </div>
              <div>
                <p className="pm-label">状态</p>
                <StatusTag value={(statusTextMap[viewingOrder.status] || statusTextMap[3]).tag}>{(statusTextMap[viewingOrder.status] || statusTextMap[3]).label}</StatusTag>
              </div>
              <div>
                <p className="pm-label">用户</p>
                <p>{viewingOrder.userSnapshot?.nickname || '匿名用户'}</p>
              </div>
              <div>
                <p className="pm-label">金额</p>
                <strong className="pm-price">{formatPrice(viewingOrder.price)}</strong>
              </div>
            </div>
            <div className="pm-admin-detail-grid">
              <div>
                <p className="pm-label">下单时间</p>
                <p>{viewingOrder.createTime}</p>
              </div>
              <div>
                <p className="pm-label">支付时间</p>
                <p>{viewingOrder.payTime || '未支付'}</p>
              </div>
              <div className="pm-admin-detail-span">
                <p className="pm-label">收货信息</p>
                <p className="pm-admin-detail-copy">{viewingOrder.address?.receiver} / {viewingOrder.address?.phone} / {viewingOrder.address?.detail}</p>
              </div>
            </div>
            <div>
              <p className="pm-label">商品清单</p>
              <div className="pm-admin-detail-list">
                {(viewingOrder.items?.length ? viewingOrder.items : [{ goodSnapshot: viewingOrder.goodSnapshot, quantity: 1, price: viewingOrder.price }]).map((item, index) => {
                  const priceInfo = getProductPriceInfo(item.goodSnapshot || item);
                  return (
                    <article className="pm-admin-detail-item" key={`${item.goodId || index}-${index}`}>
                      <div>
                        <strong>{item.goodSnapshot?.name || '历史商品'}</strong>
                        <p className="pm-help">x{item.quantity || 1}</p>
                      </div>
                      <div>
                        <strong className="pm-price">{formatPrice((item.price || 0) * (item.quantity || 1))}</strong>
                        {priceInfo.hasDiscount ? <span className="pm-old-price">{formatPrice(priceInfo.originalPrice * (item.quantity || 1))}</span> : null}
                        {priceInfo.saleTag ? <span className="pm-tag pm-tag-sale">{priceInfo.saleTag}</span> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="pm-label">物流记录</p>
              <ul className="pm-admin-detail-timeline">
                {(viewingOrder.logistics || []).map((log, index) => (
                  <li key={`${log.time}-${index}`}>
                    <strong>{log.time}</strong>
                    <span>{log.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default AdminOrdersPage;
