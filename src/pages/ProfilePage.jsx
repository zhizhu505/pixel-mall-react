import { Link, useNavigate } from 'react-router-dom';

import ThemePanel from '../components/common/ThemePanel';
import { ORDER_STATUS_TABS, orderListPathForStatus } from '../constants/orderTabs';
import { useServices } from '../hooks/useServices';

const ProfilePage = () => {
  const { user } = useServices();
  const navigate = useNavigate();
  const currentUser = user.getCurrentUser();
  const displayName = currentUser.nickname || currentUser.username;
  const avatarChar = displayName.trim().slice(0, 1) || 'U';

  const handleLogout = () => {
    user.logout();
    navigate('/login');
  };

  return (
    <main className="pm-page pm-profile-page">
      <header className="pm-profile-page-header">
        <p className="pm-profile-page-brand">
          <span className="pm-profile-page-pixel" aria-hidden />
          Pixel Mall
        </p>
        <h1 className="pm-profile-page-title">我的</h1>
      </header>

      <section className="pm-profile-hero" aria-label="用户信息">
        <div className="pm-profile-hero-card">
          <div className="pm-profile-hero-top">
            <span className="pm-profile-hero-badge">Pixel Member</span>
            <button type="button" className="pm-profile-logout" onClick={handleLogout}>
              退出登录
            </button>
          </div>
          <div className="pm-profile-hero-main">
            <div className="pm-profile-avatar" aria-hidden>
              {avatarChar}
            </div>
            <div className="pm-profile-hero-text">
              <h2 className="pm-profile-name">{displayName}</h2>
              <p className="pm-profile-account">账号 {currentUser.username}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pm-profile-panel" aria-labelledby="profile-orders-title">
        <h2 className="pm-profile-panel-title" id="profile-orders-title">
          我的订单
        </h2>
        <p className="pm-profile-panel-desc">按状态查看订单，点击进入列表</p>
        <nav className="pm-profile-order-tabs" aria-label="订单筛选">
          {ORDER_STATUS_TABS.map((tab) => (
            <Link
              key={tab.key}
              className="pm-profile-order-tab"
              to={orderListPathForStatus(tab.key)}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </section>

      <section className="pm-profile-panel" aria-labelledby="profile-menu-title">
        <h2 className="pm-profile-panel-title" id="profile-menu-title">
          常用功能
        </h2>
        <nav className="pm-profile-links" aria-label="我的功能">
          <Link className="pm-profile-link" to="/favorites">
            <span className="pm-profile-link-label">我的收藏</span>
            <span className="pm-profile-link-arrow" aria-hidden>
              →
            </span>
          </Link>
          <Link className="pm-profile-link" to="/address">
            <span className="pm-profile-link-label">地址管理</span>
            <span className="pm-profile-link-arrow" aria-hidden>
              →
            </span>
          </Link>
          <Link className="pm-profile-link pm-profile-link-admin" to="/admin/login">
            <span className="pm-profile-link-label">后台入口</span>
            <span className="pm-profile-link-arrow" aria-hidden>
              →
            </span>
          </Link>
        </nav>
      </section>

      <section className="pm-profile-panel pm-profile-theme-panel" aria-labelledby="profile-theme-title">
        <h2 className="pm-profile-panel-title" id="profile-theme-title">
          主题外观
        </h2>
        <p className="pm-profile-panel-desc">切换配色后全站页面即时生效，设置会自动保存</p>
        <ThemePanel variant="profile" />
      </section>
    </main>
  );
};

export default ProfilePage;
