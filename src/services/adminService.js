import {
  adminMenuCatalog,
  adminPermissionCatalog,
  defaultAdminActivities,
  defaultAdminSchedules,
  defaultAdmins,
  defaultRoleDefinitions,
} from '../mock/data';
import { cloneValue, loadFromStorage, removeFromStorage, saveToStorage } from '../utils/storage';
import SubscribableService from './subscribableService';

const ADMIN_LIST_KEY = 'pixelMall:admins';
const CURRENT_ADMIN_KEY = 'pixelMall:adminUser';
const ROLE_LIST_KEY = 'pixelMall:adminRoles';
const ROLE_ANALYTICS_MIGRATION_KEY = 'pixelMall:adminRolesAnalyticsMigrated';
const ADMIN_ACTIVITY_KEY = 'pixelMall:adminActivities';

const hasStoredValue = (key) => typeof window !== 'undefined' && window.localStorage.getItem(key) !== null;

const groupLabelMap = {
  dashboard: '后台首页',
  analytics: '分析中心',
  products: '商品管理',
  categories: '分类管理',
  orders: '订单管理',
  roles: '角色权限',
};

class AdminService extends SubscribableService {
  admins = [];
  currentAdmin = null;
  roles = [];
  activities = [];

  constructor() {
    super();
    this._loadData();
  }

  login({ username, password }) {
    const admin = this.admins.find((item) => item.username === username && item.password === password);
    const role = this._findRole(admin?.role);

    if (admin && !role) {
      return { success: false, message: '当前账号角色配置缺失，请先恢复默认角色。' };
    }

    if (!admin) {
      return { success: false, message: '管理员账号或密码错误。' };
    }

    this.currentAdmin = {
      id: admin.id,
      username: admin.username,
      nickname: admin.nickname,
      role: admin.role,
    };

    saveToStorage(CURRENT_ADMIN_KEY, this.currentAdmin);
    this.recordActivity({
      module: '后台登录',
      action: '登录后台',
      detail: `${this.currentAdmin.nickname}进入 Pixel Mall Admin`,
      score: 90,
    });
    return { success: true, admin: this.getCurrentAdmin() };
  }

  logout() {
    this.currentAdmin = null;
    removeFromStorage(CURRENT_ADMIN_KEY);
  }

  getCurrentAdmin() {
    return this.currentAdmin ? cloneValue(this.currentAdmin) : null;
  }

  isAuthenticated() {
    return Boolean(this.currentAdmin);
  }

  hasPermission(permission) {
    const currentRole = this._findRole(this.currentAdmin?.role);
    if (!currentRole) {
      return false;
    }

    return currentRole.permissions.includes(permission);
  }

  getRoles() {
    return this.roles.map((role) => ({
      ...cloneValue(role),
      permissionCount: role.permissions.length,
      menuCount: role.menus.length,
    }));
  }

  getRoleById(roleId) {
    const role = this._findRole(roleId);
    return role ? cloneValue(role) : null;
  }

  getPermissionCatalog() {
    return adminPermissionCatalog.map((permission) => ({
      ...permission,
      groupLabel: groupLabelMap[permission.group] || permission.group,
    }));
  }

  getMenuCatalog() {
    return cloneValue(adminMenuCatalog);
  }

  getAdminActivities(adminId = this.currentAdmin?.id) {
    return this.activities
      .filter((activity) => activity.adminId === adminId)
      .map((activity) => cloneValue(activity));
  }

  recordActivity({ module, action, detail, score = 88 }) {
    if (!this.currentAdmin) {
      return null;
    }

    const activity = {
      id: `act-${this.currentAdmin.id}-${Date.now()}`,
      adminId: this.currentAdmin.id,
      module,
      action,
      detail,
      time: new Date().toLocaleString('sv-SE'),
      score,
    };
    this.activities = [activity, ...this.activities].slice(0, 80);
    this._saveActivities();
    this.notify();
    return cloneValue(activity);
  }

  getAdminSchedules(adminId = this.currentAdmin?.id) {
    return defaultAdminSchedules
      .filter((schedule) => schedule.adminId === adminId)
      .map((schedule) => cloneValue(schedule));
  }

  updateRoleAccess(roleId, { permissions = [], menus = [] }) {
    const role = this._findRole(roleId);

    if (!role) {
      return { success: false, message: '角色不存在。' };
    }

    const validPermissions = new Set(adminPermissionCatalog.map((item) => item.key));
    const validMenus = new Map(adminMenuCatalog.map((item) => [item.key, item.permission]));
    const normalizedPermissions = [...new Set(permissions)].filter((permission) => validPermissions.has(permission));
    const normalizedMenus = [...new Set(menus)].filter((menu) => validMenus.has(menu));

    const invalidMenu = normalizedMenus.find((menu) => !normalizedPermissions.includes(validMenus.get(menu)));
    if (invalidMenu) {
      return { success: false, message: '菜单可见范围必须先具备对应查看权限。' };
    }

    role.permissions = normalizedPermissions;
    role.menus = normalizedMenus;
    this._saveRoles();
    this.recordActivity({
      module: '角色权限',
      action: '更新角色权限',
      detail: `调整 ${role.name} 的 ${normalizedPermissions.length} 项权限与 ${normalizedMenus.length} 个菜单`,
      score: 94,
    });
    return { success: true, message: '角色权限已更新。' };
  }

  resetRoles() {
    this.roles = cloneValue(defaultRoleDefinitions);
    this._saveRoles();
    this.notify();
    return { success: true, message: '角色权限已恢复默认配置。' };
  }

  getMenuKeys() {
    const currentRole = this._findRole(this.currentAdmin?.role);
    return currentRole ? [...currentRole.menus] : [];
  }

  reload() {
    this._loadData();
    this.notify();
  }

  _findRole(roleId) {
    return this.roles.find((item) => item.id === roleId);
  }

  _saveRoles() {
    saveToStorage(ROLE_LIST_KEY, this.roles);
  }

  _saveActivities() {
    saveToStorage(ADMIN_ACTIVITY_KEY, this.activities);
  }

  _loadData() {
    const shouldMigrateAnalyticsRole = hasStoredValue(ROLE_LIST_KEY) && !loadFromStorage([ROLE_ANALYTICS_MIGRATION_KEY], false);
    this.admins = loadFromStorage([ADMIN_LIST_KEY], defaultAdmins);
    this.roles = this._mergeRoleDefaults(loadFromStorage([ROLE_LIST_KEY], defaultRoleDefinitions), shouldMigrateAnalyticsRole);
    this.activities = this._mergeActivityDefaults(loadFromStorage([ADMIN_ACTIVITY_KEY], defaultAdminActivities));
    this.currentAdmin = loadFromStorage([CURRENT_ADMIN_KEY], null);
    saveToStorage(ADMIN_LIST_KEY, this.admins);
    this._saveRoles();
    this._saveActivities();
    if (shouldMigrateAnalyticsRole) {
      saveToStorage(ROLE_ANALYTICS_MIGRATION_KEY, true);
    }
  }

  _mergeRoleDefaults(roles, shouldMigrateAnalyticsRole = false) {
    return roles.map((role) => {
      const defaultRole = defaultRoleDefinitions.find((item) => item.id === role.id);

      if (!defaultRole || !shouldMigrateAnalyticsRole) {
        return role;
      }

      const menus = role.menus || [];
      const permissions = role.permissions || [];
      if (!defaultRole.menus.includes('analytics') || permissions.includes('analytics:view')) {
        return role;
      }

      return {
        ...role,
        menus: menus.includes('analytics') ? menus : [...menus, 'analytics'],
        permissions: [...permissions, 'analytics:view'],
      };
    });
  }

  _mergeActivityDefaults(activities) {
    const activityList = Array.isArray(activities) ? activities : [];
    const activityIds = new Set(activityList.map((activity) => activity.id));
    return [
      ...activityList,
      ...defaultAdminActivities.filter((activity) => !activityIds.has(activity.id)),
    ];
  }
}

const adminService = new AdminService();
export default adminService;
