import { useContext } from 'react';
import { Link } from 'react-router-dom';
import PermissionGate from '../../components/admin/PermissionGate';
import Button from '../../components/common/Button';
import { ServiceContext } from '../../contexts/ServiceContext';

const AdminDashboardPage = () => {
  const { admin, good, order } = useContext(ServiceContext);
  const productStats = good.getDashboardStats();
  const orderStats = order.getDashboardStats();

  return (
    <div className="pm-admin-dashboard-page">
      <section className="pm-admin-dashboard-hero">
        <div>
          <h2 className="pm-admin-dashboard-title">欢迎回来，{admin.getCurrentAdmin()?.nickname}</h2>
          <p className="pm-help">这里汇总了商城后台的商品、分类和订单状态。</p>
        </div>
        <div className="pm-admin-dashboard-actions">
          <PermissionGate permission="products:manage">
            <Link className="pm-btn pm-btn-primary" to="/admin/products">管理商品</Link>
          </PermissionGate>
          <PermissionGate permission="orders:view">
            <Link className="pm-btn pm-btn-ghost" to="/admin/orders">查看订单</Link>
          </PermissionGate>
        </div>
      </section>

      <section className="pm-admin-dashboard-section">
        <h3 className="pm-section-title">核心统计</h3>
        <div className="pm-admin-stat-grid">
          <div className="pm-admin-stat"><strong>{productStats.total}</strong><span>商品总数</span></div>
          <div className="pm-admin-stat"><strong>{productStats.onSaleCount}</strong><span>上架中</span></div>
          <div className="pm-admin-stat"><strong>{productStats.categoryCount}</strong><span>分类数量</span></div>
          <div className="pm-admin-stat"><strong>{orderStats.total}</strong><span>订单总数</span></div>
          <div className="pm-admin-stat"><strong>{orderStats.pendingPay}</strong><span>待支付</span></div>
          <div className="pm-admin-stat"><strong>{orderStats.shipped}</strong><span>已发货</span></div>
        </div>
      </section>

      <section className="pm-admin-dashboard-section">
        <h3 className="pm-section-title">快捷入口</h3>
        <div className="pm-grid pm-grid-2">
          <div className="pm-alert">
            <p>库存预警商品：{productStats.lowStockCount}</p>
            <p>已下架商品：{productStats.offSaleCount}</p>
          </div>
          <div className="pm-admin-dashboard-shortcuts">
            <PermissionGate permission="categories:view" fallback={<Button disabled type="button" variant="dark">分类管理</Button>}>
              <Link className="pm-btn pm-btn-dark pm-admin-dashboard-shortcut-btn" to="/admin/categories">分类管理</Link>
            </PermissionGate>
            <PermissionGate permission="roles:view" fallback={<Button disabled type="button">角色权限</Button>}>
              <Link className="pm-btn pm-btn-accent pm-admin-dashboard-shortcut-btn" to="/admin/roles">角色权限</Link>
            </PermissionGate>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
