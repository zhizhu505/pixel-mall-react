import { defaultOrders } from '../mock/data';
import cartService from './cartService';
import goodService from './goodService';
import userService from './userService';
import { cloneValue, loadFromStorage, saveToStorage } from '../utils/storage';

const ORDER_KEY = 'pixelMall:orders';

class OrderService {
  list = [];

  constructor() {
    this._loadData();
  }

  createOrder(userId, goodId, price, quantity = 1, address) {
    const product = goodService.getGoodById(goodId);
    const user = userService.getUserById(userId) || userService.getCurrentUser();
    const parsedQuantity = Math.max(1, Number(quantity) || 1);

    if (!product || product.status !== 'on-sale' || product.stock < parsedQuantity) {
      return null;
    }

    const linePrice = (Number(price) || product.price) * parsedQuantity;
    const itemSnapshot = {
      goodId: product.id,
      quantity: parsedQuantity,
      price: product.price,
      goodSnapshot: {
        id: product.id,
        name: product.name,
        price: product.price,
        cover: product.cover,
        categoryName: product.categoryName,
      },
    };

    const order = this._buildOrder({
      user,
      userId: user?.id ?? userId,
      items: [itemSnapshot],
      goodId: product.id,
      price: linePrice,
      source: 'buy-now',
      goodSnapshot: itemSnapshot.goodSnapshot,
      address,
    });

    this.list.unshift(order);
    goodService.updateGood({ ...product, stock: product.stock - parsedQuantity });
    this._saveData();
    return cloneValue(order);
  }

  createOrderFromCart(userId, address) {
    const validation = cartService.validateCheckout(userId);

    if (!validation.success) {
      return { success: false, message: validation.message };
    }

    const user = userService.getUserById(userId) || userService.getCurrentUser();
    const items = validation.items.map((cartItem) => ({
      goodId: cartItem.goodId,
      quantity: cartItem.count,
      price: cartItem.product.price,
      goodSnapshot: {
        id: cartItem.product.id,
        name: cartItem.product.name,
        price: cartItem.product.price,
        cover: cartItem.product.cover,
        categoryName: cartItem.product.categoryName,
      },
    }));

    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = this._buildOrder({
      user,
      userId: user?.id ?? userId,
      items,
      goodId: items[0].goodId,
      price: totalPrice,
      source: 'cart',
      goodSnapshot: items[0].goodSnapshot,
      address,
    });

    items.forEach((item) => {
      const product = goodService.getGoodById(item.goodId);
      if (product) {
        goodService.updateGood({ ...product, stock: product.stock - item.quantity });
      }
    });

    this.list.unshift(order);
    this._saveData();
    return { success: true, order: cloneValue(order) };
  }

  payOrder(orderId) {
    const order = this._findOrder(orderId);

    if (!order || order.status !== 0) {
      return { success: false, message: '订单不可支付。' };
    }

    order.status = 1;
    order.payTime = new Date().toLocaleString();
    order.logistics.unshift({ time: order.payTime, text: '订单支付成功。' });

    if (order.source === 'cart' && Array.isArray(order.items) && order.items.length) {
      cartService.removeItemsByGoodIds(
        order.userId,
        order.items.map((item) => item.goodId),
      );
    }

    this._saveData();
    return { success: true };
  }

  failPayment(orderId) {
    const order = this._findOrder(orderId);

    if (!order || order.status !== 0) {
      return { success: false, message: '订单不可取消支付。' };
    }

    order.logistics.unshift({
      time: new Date().toLocaleString(),
      text: '支付失败或已取消，可稍后重试。',
    });
    this._saveData();
    return { success: true };
  }

  shipOrder(orderId, trackingNo) {
    const order = this._findOrder(orderId);

    if (!order || order.status < 1) {
      return false;
    }

    order.status = 2;
    order.logistics.unshift({ time: new Date().toLocaleString(), text: `订单已发货，物流单号 ${trackingNo || `PIXEL-${order.id}`}` });
    this._saveData();
    return true;
  }

  updateOrderStatus(orderId, status) {
    const order = this._findOrder(orderId);
    const nextStatus = Number(status);

    if (!order) {
      return { success: false, message: '订单不存在。' };
    }

    if (Number.isNaN(nextStatus)) {
      return { success: false, message: '订单状态无效。' };
    }

    if (nextStatus === order.status) {
      return { success: false, message: '订单已经是当前状态。' };
    }

    if (nextStatus === 3 && order.status !== 2) {
      return { success: false, message: '未发货订单不能直接完成。' };
    }

    if (nextStatus === 2 && order.status !== 1) {
      return { success: false, message: '只有已支付订单才能发货。' };
    }

    if (nextStatus < order.status) {
      return { success: false, message: '当前不支持回退订单状态。' };
    }

    order.status = nextStatus;
    order.logistics.unshift({
      time: new Date().toLocaleString(),
      text: `订单状态已更新为 ${this.getStatusText(order.status)}。`,
    });
    this._saveData();
    return { success: true, message: '订单状态已更新。' };
  }

  getOrderList(filters = {}) {
    const { status = 'all', keyword = '', userId } = filters;
    const normalizedKeyword = String(keyword ?? '').trim().toLowerCase();

    return this.list
      .filter((order) => {
        if (status !== 'all' && Number(status) !== order.status) {
          return false;
        }

        if (userId && Number(userId) !== order.userId) {
          return false;
        }

        if (!normalizedKeyword) {
          return true;
        }

        return [order.orderNo, order.goodSnapshot?.name, order.userSnapshot?.nickname].some((field) =>
          String(field ?? '').toLowerCase().includes(normalizedKeyword),
        );
      })
      .map((order) => cloneValue(order));
  }

  getOrdersByUser(userId) {
    return this.getOrderList({ userId });
  }

  getOrderById(orderId) {
    const order = this._findOrder(orderId);
    return order ? cloneValue(order) : null;
  }

  getStatusText(status) {
    if (status === 0) return '未支付';
    if (status === 1) return '已支付';
    if (status === 2) return '已发货';
    return '已完成';
  }

  getDashboardStats() {
    return {
      total: this.list.length,
      pendingPay: this.list.filter((order) => order.status === 0).length,
      paid: this.list.filter((order) => order.status === 1).length,
      shipped: this.list.filter((order) => order.status === 2).length,
      finished: this.list.filter((order) => order.status === 3).length,
    };
  }

  _buildOrder({ user, userId, items, goodId, price, source, goodSnapshot, address }) {
    return {
      id: this._nextId(),
      userId: Number(userId),
      goodId: Number(goodId),
      items,
      orderNo: `PM${Date.now()}`,
      createTime: new Date().toLocaleString(),
      payTime: '',
      status: 0,
      price: Number(price) || 0,
      source,
      address: address || {
        receiver: user?.nickname || '像素顾客',
        phone: '13800000000',
        detail: '奶油街道 01 号',
      },
      userSnapshot: user
        ? { id: user.id, nickname: user.nickname, username: user.username }
        : null,
      goodSnapshot,
      logistics: [{ time: new Date().toLocaleString(), text: '订单创建成功，等待支付。' }],
    };
  }

  _normalizeOrder(input) {
    const product = goodService.getGoodById(input.goodId);
    const user = userService.getUserById(input.userId);
    const legacyItem = product
      ? {
        goodId: product.id,
        quantity: 1,
        price: product.price,
        goodSnapshot: input.goodSnapshot || {
          id: product.id,
          name: product.name,
          price: product.price,
          cover: product.cover,
          categoryName: product.categoryName,
        },
      }
      : null;

    return {
      ...input,
      userId: Number(input.userId),
      goodId: Number(input.goodId),
      items: Array.isArray(input.items) && input.items.length ? input.items : legacyItem ? [legacyItem] : [],
      status: Number(input.status) || 0,
      price: Number(input.price) || 0,
      source: input.source || 'buy-now',
      payTime: input.payTime || '',
      address: input.address || {
        receiver: user?.nickname || '像素顾客',
        phone: '13800000000',
        detail: '奶油街道 01 号',
      },
      userSnapshot: input.userSnapshot || (user
        ? { id: user.id, nickname: user.nickname, username: user.username }
        : null),
      goodSnapshot: input.goodSnapshot || legacyItem?.goodSnapshot || null,
      logistics: Array.isArray(input.logistics)
        ? input.logistics
        : [{ time: input.createTime || new Date().toLocaleString(), text: '订单已创建，等待后续处理。' }],
    };
  }

  _findOrder(orderId) {
    const parsedId = Number(orderId);
    return this.list.find((item) => item.id === parsedId);
  }

  _nextId() {
    return this.list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  _saveData() {
    saveToStorage(ORDER_KEY, this.list);
  }

  _loadData() {
    const legacyOrders = loadFromStorage(['orderList'], []);
    const orders = loadFromStorage([ORDER_KEY], legacyOrders.length ? legacyOrders : defaultOrders);
    this.list = orders.map((order) => this._normalizeOrder(order));
    this._saveData();
  }
}

const orderService = new OrderService();
export default orderService;
