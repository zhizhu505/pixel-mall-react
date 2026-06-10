import addressService from '../services/addressService';
import adminService from '../services/adminService';
import cartService from '../services/cartService';
import favoriteService from '../services/favoriteService';
import footprintService from '../services/footprintService';
import goodService from '../services/goodService';
import messageService from '../services/messageService';
import orderService from '../services/orderService';
import userService from '../services/userService';

const MOCK_DELAY = 120;

const withMockLatency = (factory, delay = MOCK_DELAY) =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(typeof factory === 'function' ? factory() : factory);
    }, delay);
  });

const mockApi = {
  products: {
    list(filters) {
      return withMockLatency(() => goodService.getPublicGoodList(filters));
    },
    adminList(filters) {
      return withMockLatency(() => goodService.getGoodList(filters));
    },
    search(keyword) {
      return withMockLatency(() => goodService.searchProducts(keyword));
    },
    detail(id) {
      return withMockLatency(() => goodService.getGoodById(id));
    },
    recommended(productId, categoryId, limit) {
      return withMockLatency(() => goodService.getRecommendedGoods(productId, categoryId, limit));
    },
    reviews(productId) {
      return withMockLatency(() => {
        const product = goodService.getGoodById(productId);
        const orderReviews = orderService.getProductReviews(productId);
        const reviewIds = new Set(orderReviews.map((review) => review.id));
        const productReviews = Array.isArray(product?.reviews) ? product.reviews.filter((review) => !reviewIds.has(review.id)) : [];
        return [...orderReviews, ...productReviews]
          .filter((review) => review.status === 'published')
          .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
      });
    },
    featuredShops(limit) {
      return withMockLatency(() => goodService.getFeaturedShops(limit));
    },
    shopDetail(shopId) {
      return withMockLatency(() => goodService.getShopById(shopId));
    },
    dashboardStats() {
      return withMockLatency(() => goodService.getDashboardStats());
    },
    create(payload) {
      return withMockLatency(() => {
        const product = goodService.addGood(payload);
        adminService.recordActivity({ module: '商品管理', action: '新增商品', detail: `创建商品「${product.name}」`, score: 88 });
        return product;
      });
    },
    update(payload) {
      return withMockLatency(() => {
        const product = goodService.updateGood(payload);
        if (product) {
          adminService.recordActivity({ module: '商品管理', action: '更新商品', detail: `保存商品「${product.name}」的资料`, score: 90 });
        }
        return product;
      });
    },
    remove(id) {
      return withMockLatency(() => {
        const product = goodService.getGoodById(id);
        const removed = goodService.deleteGood(id);
        if (removed) {
          adminService.recordActivity({ module: '商品管理', action: '删除商品', detail: `移除商品「${product?.name || id}」`, score: 86 });
        }
        return removed;
      });
    },
    toggleStatus(id) {
      return withMockLatency(() => {
        const product = goodService.toggleGoodStatus(id);
        if (product) {
          adminService.recordActivity({ module: '商品管理', action: '切换上下架', detail: `商品「${product.name}」切换为${product.status === 'on-sale' ? '上架中' : '已下架'}`, score: 89 });
        }
        return product;
      });
    },
    reload() {
      return withMockLatency(() => goodService.reload());
    },
  },

  categories: {
    list() {
      return withMockLatency(() => goodService.getCategoryList());
    },
    detail(id) {
      return withMockLatency(() => goodService.getCategoryById(id));
    },
    create(payload) {
      return withMockLatency(() => goodService.addCategory(payload));
    },
    update(payload) {
      return withMockLatency(() => goodService.updateCategory(payload));
    },
    remove(id) {
      return withMockLatency(() => goodService.deleteCategory(id));
    },
  },

  user: {
    current() {
      return withMockLatency(() => userService.getCurrentUser());
    },
    login(username, password) {
      return withMockLatency(() => userService.login(username, password));
    },
    register(payload) {
      return withMockLatency(() => userService.register(payload));
    },
    logout() {
      return withMockLatency(() => userService.logout());
    },
  },

  cart: {
    list(userId) {
      return withMockLatency(() => cartService.getEnrichedCartItems(userId));
    },
    count(userId) {
      return withMockLatency(() => cartService.getCartCount(userId));
    },
    selectedTotal(userId) {
      return withMockLatency(() => cartService.getSelectedTotal(userId));
    },
    validateCheckout(userId) {
      return withMockLatency(() => cartService.validateCheckout(userId));
    },
    refreshSnapshots(userId) {
      return withMockLatency(() => cartService.refreshSnapshots(userId));
    },
    add(userId, goodId, count = 1, options = {}) {
      return withMockLatency(() => cartService.addItem(userId, goodId, count, options));
    },
    updateCount(itemId, count) {
      return withMockLatency(() => cartService.updateCount(itemId, count));
    },
    remove(itemId) {
      return withMockLatency(() => {
        cartService.removeItem(itemId);
        return { success: true };
      });
    },
    setChecked(itemId, checked) {
      return withMockLatency(() => cartService.setItemChecked(itemId, checked));
    },
    toggleAll(userId, checked) {
      return withMockLatency(() => cartService.toggleAll(userId, checked));
    },
  },

  orders: {
    list(filters) {
      return withMockLatency(() => orderService.getOrderList(filters));
    },
    byUser(userId) {
      return withMockLatency(() => orderService.getOrdersByUser(userId));
    },
    detail(orderId) {
      return withMockLatency(() => orderService.getOrderById(orderId));
    },
    create(userId, goodId, price, quantity, address, options = {}) {
      return withMockLatency(() => orderService.createOrder(userId, goodId, price, quantity, address, options));
    },
    createFromCart(userId, address) {
      return withMockLatency(() => orderService.createOrderFromCart(userId, address));
    },
    pay(orderId) {
      return withMockLatency(() => orderService.payOrder(orderId));
    },
    failPayment(orderId) {
      return withMockLatency(() => orderService.failPayment(orderId));
    },
    ship(orderId, trackingNo) {
      return withMockLatency(() => {
        const result = orderService.shipOrder(orderId, trackingNo);
        if (result.success) {
          adminService.recordActivity({ module: '订单管理', action: '订单发货', detail: `处理订单 ${orderId} 的发货流程`, score: 92 });
        }
        return result;
      });
    },
    confirmReceipt(orderId, userId) {
      return withMockLatency(() => orderService.confirmReceipt(orderId, userId));
    },
    replyReview(orderId, reviewId, reply) {
      return withMockLatency(() => {
        const result = orderService.replyReview(orderId, reviewId, reply);
        if (result.success) {
          adminService.recordActivity({ module: '订单管理', action: '回复评价', detail: `回复订单 ${orderId} 的用户评价`, score: 91 });
        }
        return result;
      });
    },
    handleReturn(orderId, returnId, action, note) {
      return withMockLatency(() => {
        const result = orderService.handleReturnRequest(orderId, returnId, action, note);
        if (result.success) {
          adminService.recordActivity({ module: '订单管理', action: '处理售后', detail: `售后 ${returnId} 已执行 ${action}`, score: 93 });
        }
        return result;
      });
    },
    dashboardStats() {
      return withMockLatency(() => orderService.getDashboardStats());
    },
    reload() {
      return withMockLatency(() => orderService.reload());
    },
  },

  favorites: {
    list(userId) {
      return withMockLatency(() => favoriteService.getFavoriteProducts(userId));
    },
    isFavorite(userId, productId) {
      return withMockLatency(() => favoriteService.isFavorite(userId, productId));
    },
    toggle(userId, productId) {
      return withMockLatency(() => favoriteService.toggleFavorite(userId, productId));
    },
    remove(userId, productId) {
      return withMockLatency(() => {
        favoriteService.removeFavorite(userId, productId);
        return { success: true };
      });
    },
  },

  addresses: {
    list(userId) {
      return withMockLatency(() => addressService.getAddressesByUser(userId));
    },
    detail(id) {
      return withMockLatency(() => addressService.getAddressById(id));
    },
    default(userId) {
      return withMockLatency(() => addressService.getDefaultAddress(userId));
    },
    create(userId, payload) {
      return withMockLatency(() => addressService.addAddress(userId, payload));
    },
    update(userId, payload) {
      return withMockLatency(() => addressService.updateAddress(userId, payload));
    },
    remove(userId, id) {
      return withMockLatency(() => addressService.deleteAddress(userId, id));
    },
    setDefault(userId, id) {
      return withMockLatency(() => addressService.setDefaultAddress(userId, id));
    },
  },

  admin: {
    current() {
      return withMockLatency(() => adminService.getCurrentAdmin());
    },
    login(payload) {
      return withMockLatency(() => adminService.login(payload));
    },
    logout() {
      return withMockLatency(() => adminService.logout());
    },
    roles() {
      return withMockLatency(() => adminService.getRoles());
    },
    updateRoleAccess(roleId, payload) {
      return withMockLatency(() => adminService.updateRoleAccess(roleId, payload));
    },
    resetRoles() {
      return withMockLatency(() => {
        const result = adminService.resetRoles();
        if (result.success) {
          adminService.recordActivity({ module: '角色权限', action: '恢复默认角色', detail: '将后台角色权限恢复到默认配置', score: 95 });
        }
        return result;
      });
    },
    reload() {
      return withMockLatency(() => adminService.reload());
    },
  },

  footprints: {
    recordView(userId, productId) {
      return withMockLatency(() => {
        footprintService.recordView(userId, productId);
        return { success: true };
      });
    },
  },

  messages: {
    openProductChat(userId, product) {
      return withMockLatency(() => messageService.openProductChat(userId, product));
    },
  },
};

export default mockApi;
