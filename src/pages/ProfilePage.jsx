import { Link, useNavigate } from 'react-router-dom';

import ThemePanel from '../components/common/ThemePanel';
import { ORDER_STATUS_TABS, orderListPathForStatus } from '../constants/orderTabs';
import { useServices, useServiceSnapshot } from '../hooks/useServices';

const iconMap = {
  all: '/images/profile/icon-all.svg',
  unpaid: '/images/profile/icon-unpaid.svg',
  paid: '/images/profile/icon-paid.svg',
  shipped: '/images/profile/icon-shipped.svg',
  finished: '/images/profile/icon-finished.svg',
  favorites: '/images/profile/icon-favorites.svg',
  address: '/images/profile/icon-address.svg',
  footprints: '/images/profile/icon-footprints.svg',
  admin: '/images/profile/icon-admin.svg',
};

const ProfilePage = () => {
  const { user, api } = useServices();
  const navigate = useNavigate();
  const currentUser = useServiceSnapshot(user, (service) => service.getCurrentUser());
  const displayName = currentUser.nickname || currentUser.username;
  const avatarChar = displayName.trim().slice(0, 1) || 'U';

  const handleLogout = async () => {
    await api.user.logout();
    navigate('/login');
  };

  return (
    <main className="pm-page pm-profile-page">
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

      <section className="pm-profile-panel pm-profile-quick-panel" aria-labelledby="profile-orders-title">
        <div className="pm-profile-quick-section">
          <h2 className="pm-profile-panel-title" id="profile-orders-title">
            我的订单
          </h2>
          <nav className="pm-profile-order-tabs" aria-label="订单筛选">
            {ORDER_STATUS_TABS.map((tab) => (
              <Link
                key={tab.key}
                className="pm-profile-order-tab"
                to={orderListPathForStatus(tab.key)}
              >
                <img src={iconMap[tab.icon]} alt="" className="pm-profile-order-tab-icon" aria-hidden />
                <span className="pm-profile-order-tab-label">{tab.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="pm-profile-quick-section">
          <h2 className="pm-profile-panel-title" id="profile-menu-title">
            常用功能
          </h2>
          <nav className="pm-profile-links-grid" aria-label="我的功能">
            <Link className="pm-profile-link-item" to="/favorites">
              <img src={iconMap.favorites} alt="" className="pm-profile-link-icon" aria-hidden />
              <span className="pm-profile-link-label">收藏</span>
            </Link>
            <Link className="pm-profile-link-item" to="/address">
              <img src={iconMap.address} alt="" className="pm-profile-link-icon" aria-hidden />
              <span className="pm-profile-link-label">地址</span>
            </Link>
            <Link className="pm-profile-link-item" to="/footprints">
              <img src={iconMap.footprints} alt="" className="pm-profile-link-icon" aria-hidden />
              <span className="pm-profile-link-label">足迹</span>
            </Link>
            <Link className="pm-profile-link-item pm-profile-link-item-admin" to="/admin/login">
              <img src={iconMap.admin} alt="" className="pm-profile-link-icon" aria-hidden />
              <span className="pm-profile-link-label">后台</span>
            </Link>
          </nav>
        </div>
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
