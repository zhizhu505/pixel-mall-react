import { useContext, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ServiceContext } from '../../contexts/ServiceContext';
import { useServiceSnapshot } from '../../hooks/useServices';
import ThemePanel from '../common/ThemePanel';
import Button from '../common/Button';

const navItems = [
  { key: 'dashboard', label: '后台首页', to: '/admin', permission: 'dashboard:view' },
  { key: 'analytics', label: '分析中心', to: '/admin/analytics', permission: 'analytics:view' },
  { key: 'products', label: '商品管理', to: '/admin/products', permission: 'products:view' },
  { key: 'categories', label: '分类管理', to: '/admin/categories', permission: 'categories:view' },
  { key: 'orders', label: '订单管理', to: '/admin/orders', permission: 'orders:view' },
  { key: 'roles', label: '角色权限', to: '/admin/roles', permission: 'roles:view' },
];

const AdminShell = () => {
  const { admin, api } = useContext(ServiceContext);
  const navigate = useNavigate();

  const currentAdmin = useServiceSnapshot(admin, (service) => service.getCurrentAdmin());
  const menuKeys = useServiceSnapshot(admin, (service) => service.getMenuKeys());
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);

  const handleLogout = async () => {
    await api.admin.logout();
    navigate('/admin/login');
  };

  const toggleThemePanel = () => {
    setIsThemePanelOpen((current) => !current);
  };

  return (
    <div className="pm-admin-app">
      <div className="pm-admin-layout">
        <div className="pm-admin-brand-panel">
          <div className="pm-admin-logo">
            <span className="pm-admin-brand-pixel" aria-hidden="true" />
            <div>
              <strong>Pixel Mall Admin</strong>
              <p className="pm-help">奶油像素商城后台</p>
            </div>
          </div>
        </div>
        <header className="pm-admin-header">
          <div>
            <h1 className="pm-admin-title">后台管理</h1>
            <p className="pm-help">当前角色：{currentAdmin?.nickname} / {currentAdmin?.role}</p>
          </div>
          <div className="pm-admin-header-actions">
            <Link className="pm-admin-home-link" to="/home">返回商城首页</Link>
            <div className="pm-admin-theme-entry">
              <Button
                type="button"
                variant="ghost"
                className={`pm-admin-theme-toggle${isThemePanelOpen ? ' is-open' : ''}`}
                onClick={toggleThemePanel}
                aria-expanded={isThemePanelOpen}
                aria-controls="pm-admin-theme-panel"
              >
                主题
              </Button>
              {isThemePanelOpen ? (
                <div className="pm-admin-theme-popover" id="pm-admin-theme-panel">
                  <ThemePanel variant="admin" />
                </div>
              ) : null}
            </div>
            <Button type="button" variant="ghost" onClick={handleLogout}>退出登录</Button>
          </div>
        </header>
        <aside className="pm-admin-side">
          {navItems
            .filter((item) => menuKeys.includes(item.key) && admin.hasPermission(item.permission))
            .map((item) => (
              <NavLink
                key={item.key}
                className={({ isActive }) => `pm-admin-nav-link${isActive ? ' is-active' : ''}`}
                to={item.to}
                end={item.to === '/admin'}
              >
                {item.label}
              </NavLink>
            ))}
        </aside>
        <main className="pm-admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
