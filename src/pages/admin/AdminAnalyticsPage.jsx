import { useContext } from 'react';

import Button from '../../components/common/Button';
import { ServiceContext } from '../../contexts/ServiceContext';
import { useServiceSnapshot } from '../../hooks/useServices';
import { formatPrice, getProductPriceInfo } from '../../utils/productDisplay';

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];

const getOrderItems = (order) => (order.items?.length
  ? order.items
  : [{ goodId: order.goodId, goodSnapshot: order.goodSnapshot, quantity: 1, price: order.price }]);

const getOrderSubtotal = (order) => {
  const itemTotal = getOrderItems(order).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  return Number(order.price) || itemTotal;
};

const parseDateTime = (value) => {
  const date = new Date(String(value || '').replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
};

const formatDateKey = (date) => date.toLocaleDateString('sv-SE');

const createCalendarCells = (baseDate) => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = firstDay.getDay();

  return Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - leadingDays + 1;
    const date = new Date(year, month, dayNumber);
    return {
      date,
      dateKey: formatDateKey(date),
      dayNumber: date.getDate(),
      inMonth: dayNumber >= 1 && dayNumber <= daysInMonth,
    };
  });
};

const countBy = (items, getKey) => items.reduce((result, item) => {
  const key = getKey(item) || '未分类';
  result[key] = (result[key] || 0) + 1;
  return result;
}, {});

const getTopEntry = (entries, fallback = '暂无') => (
  entries.sort((left, right) => right[1] - left[1])[0]?.[0] || fallback
);

const AdminAnalyticsPage = () => {
  const { admin, good, order, api } = useContext(ServiceContext);

  const currentAdmin = useServiceSnapshot(admin, (service) => service.getCurrentAdmin());
  const products = useServiceSnapshot(good, (service) => service.getGoodList({ includeDeleted: false }));
  const productStats = useServiceSnapshot(good, (service) => service.getDashboardStats());
  const orders = useServiceSnapshot(order, (service) => service.getOrderList());
  const orderStats = useServiceSnapshot(order, (service) => service.getDashboardStats());
  const activities = useServiceSnapshot(admin, (service) => service.getAdminActivities(currentAdmin?.id));
  const schedules = useServiceSnapshot(admin, (service) => service.getAdminSchedules(currentAdmin?.id));

  const todayKey = formatDateKey(new Date());
  const paidOrders = orders.filter((item) => Number(item.status) > 0);
  const revenue = paidOrders.reduce((sum, item) => sum + getOrderSubtotal(item), 0);
  const totalSales = products.reduce((sum, product) => sum + (Number(product.sales) || 0), 0);
  const activeReturns = orders.reduce((sum, item) => sum + (item.returns || []).filter((request) => !['refunded', 'rejected'].includes(request.status)).length, 0);
  const averageActivityScore = activities.length
    ? Math.round(activities.reduce((sum, activity) => sum + (Number(activity.score) || 0), 0) / activities.length)
    : 0;
  const todayActivityCount = activities.filter((activity) => activity.time?.startsWith(todayKey)).length;
  const finishedRate = orders.length ? Math.round((orderStats.finished / orders.length) * 100) : 0;
  const averageOrderValue = paidOrders.length ? revenue / paidOrders.length : 0;
  const moduleCounts = countBy(activities, (activity) => activity.module);
  const favoriteModule = getTopEntry(Object.entries(moduleCounts), '等待记录');
  const categorySales = products.reduce((result, product) => {
    const categoryName = product.categoryName || '未分类';
    result[categoryName] = (result[categoryName] || 0) + (Number(product.sales) || 0);
    return result;
  }, {});
  const topCategory = getTopEntry(Object.entries(categorySales), '暂无分类');
  const hotProducts = [...products].sort((left, right) => (Number(right.sales) || 0) - (Number(left.sales) || 0)).slice(0, 4);
  const lowStockProducts = products
    .filter((product) => product.status === 'on-sale' && Number(product.stock) > 0 && Number(product.stock) <= 10)
    .sort((left, right) => Number(left.stock) - Number(right.stock))
    .slice(0, 4);
  const sortedActivities = [...activities].sort((left, right) => parseDateTime(right.time) - parseDateTime(left.time));
  const sortedSchedules = [...schedules].sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`));
  const calendarBase = sortedSchedules[0]?.date ? new Date(`${sortedSchedules[0].date}T00:00:00`) : new Date();
  const safeCalendarBase = Number.isNaN(calendarBase.getTime()) ? new Date() : calendarBase;
  const calendarCells = createCalendarCells(safeCalendarBase);
  const schedulesByDate = sortedSchedules.reduce((result, schedule) => {
    result[schedule.date] = [...(result[schedule.date] || []), schedule];
    return result;
  }, {});
  const currentMonthLabel = safeCalendarBase.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });

  const insights = [
    `你最近最常处理「${favoriteModule}」，适合把今日工作重心放在相关待办。`,
    `当前成交额 ${formatPrice(revenue)}，客单价约 ${formatPrice(averageOrderValue)}，完成率 ${finishedRate}%。`,
    `热销分类是「${topCategory}」，总销量 ${totalSales} 件，可优先检查库存与活动露出。`,
    activeReturns > 0 ? `还有 ${activeReturns} 个售后节点在处理中，建议排在上午批量处理。` : '当前没有积压售后节点，可以把时间留给商品和活动复盘。',
  ];

  const handleRefresh = async () => {
    await Promise.all([api.admin.reload(), api.products.reload(), api.orders.reload()]);
  };

  return (
    <div className="pm-admin-analytics-page">
      <section className="pm-admin-analytics-hero">
        <div>
          <p className="pm-section-eyebrow">Personal Analysis</p>
          <h2 className="pm-admin-analytics-title">{currentAdmin?.nickname || '管理员'}的运营分析</h2>
          <p className="pm-help">结合商品、订单、行为记录和日程，整理当前管理员的工作节奏与经营重点。</p>
        </div>
        <div className="pm-admin-analytics-hero-card">
          <span>今日行为</span>
          <strong>{todayActivityCount}</strong>
          <p>平均效率分 {averageActivityScore || '--'}</p>
          <Button type="button" variant="ghost" onClick={handleRefresh}>刷新分析</Button>
        </div>
      </section>

      <section className="pm-admin-stat-grid pm-admin-analytics-stat-grid">
        <div className="pm-admin-stat pm-admin-analytics-stat">
          <span>累计销量</span>
          <strong>{totalSales}</strong>
          <p>来自 {products.length} 个有效商品</p>
        </div>
        <div className="pm-admin-stat pm-admin-analytics-stat">
          <span>成交额</span>
          <strong>{formatPrice(revenue)}</strong>
          <p>{paidOrders.length} 笔已支付订单</p>
        </div>
        <div className="pm-admin-stat pm-admin-analytics-stat">
          <span>待发货</span>
          <strong>{orderStats.paid}</strong>
          <p>需要订单处理</p>
        </div>
        <div className="pm-admin-stat pm-admin-analytics-stat">
          <span>库存预警</span>
          <strong>{productStats.lowStockCount}</strong>
          <p>低库存商品</p>
        </div>
        <div className="pm-admin-stat pm-admin-analytics-stat">
          <span>待办日程</span>
          <strong>{sortedSchedules.length}</strong>
          <p>{currentMonthLabel}</p>
        </div>
      </section>

      <section className="pm-admin-analytics-layout">
        <article className="pm-admin-analytics-panel">
          <div className="pm-admin-analytics-panel-head">
            <h3 className="pm-section-title">个性化洞察</h3>
            <span className="pm-tag pm-tag-info">{favoriteModule}</span>
          </div>
          <div className="pm-admin-analytics-insights">
            {insights.map((insight) => <p key={insight}>{insight}</p>)}
          </div>
        </article>

        <article className="pm-admin-analytics-panel">
          <div className="pm-admin-analytics-panel-head">
            <h3 className="pm-section-title">热销商品</h3>
            <span className="pm-help">按销量排序</span>
          </div>
          <div className="pm-admin-analytics-product-list">
            {hotProducts.map((product) => {
              const priceInfo = getProductPriceInfo(product);
              return (
                <div className="pm-admin-analytics-product" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.categoryName}</span>
                  </div>
                  <div>
                    <strong>{Number(product.sales) || 0} 件</strong>
                    <span>{formatPrice(priceInfo.currentPrice)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="pm-admin-analytics-layout pm-admin-analytics-workbench">
        <article className="pm-admin-analytics-panel">
          <div className="pm-admin-analytics-panel-head">
            <h3 className="pm-section-title">行为时间线</h3>
            <span className="pm-help">最近操作</span>
          </div>
          <ol className="pm-admin-analytics-timeline">
            {sortedActivities.map((activity) => (
              <li key={activity.id}>
                <time>{activity.time}</time>
                <div>
                  <strong>{activity.action}</strong>
                  <p>{activity.detail}</p>
                  <span>{activity.module} · 效率 {activity.score}</span>
                </div>
              </li>
            ))}
          </ol>
        </article>

        <article className="pm-admin-analytics-panel">
          <div className="pm-admin-analytics-panel-head">
            <h3 className="pm-section-title">日程待办</h3>
            <span className="pm-help">按时间排序</span>
          </div>
          <div className="pm-admin-analytics-schedule-list">
            {sortedSchedules.map((schedule) => (
              <div className={`pm-admin-analytics-schedule pm-admin-analytics-schedule-${schedule.priority}`} key={schedule.id}>
                <time>{schedule.date} {schedule.time}</time>
                <strong>{schedule.title}</strong>
                <span>{schedule.type}</span>
              </div>
            ))}
          </div>
          {lowStockProducts.length ? (
            <div className="pm-admin-analytics-warning">
              <strong>补货关注</strong>
              <p>{lowStockProducts.map((product) => `${product.name}(${product.stock})`).join('、')}</p>
            </div>
          ) : null}
        </article>
      </section>

      <section className="pm-admin-analytics-panel pm-admin-analytics-calendar-panel">
        <div className="pm-admin-analytics-panel-head">
          <h3 className="pm-section-title">{currentMonthLabel} 日历</h3>
          <span className="pm-help">高优先级日程会突出显示</span>
        </div>
        <div className="pm-admin-analytics-calendar-week">
          {weekdayLabels.map((label) => <span key={label}>{label}</span>)}
        </div>
        <div className="pm-admin-analytics-calendar-grid">
          {calendarCells.map((cell) => {
            const daySchedules = schedulesByDate[cell.dateKey] || [];
            const hasHighPriority = daySchedules.some((schedule) => schedule.priority === 'high');
            return (
              <div
                className={`pm-admin-analytics-calendar-day${cell.inMonth ? '' : ' is-muted'}${cell.dateKey === todayKey ? ' is-today' : ''}${hasHighPriority ? ' is-high' : ''}`}
                key={cell.dateKey}
              >
                <span className="pm-admin-analytics-calendar-date">{cell.dayNumber}</span>
                <div className="pm-admin-analytics-calendar-events">
                  {daySchedules.slice(0, 2).map((schedule) => <span key={schedule.id}>{schedule.title}</span>)}
                  {daySchedules.length > 2 ? <span>+{daySchedules.length - 2}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default AdminAnalyticsPage;
