import { defaultOrders } from '../mock/data';
import { buildProductSnapshot, getProductPriceInfo } from '../utils/productDisplay';
import cartService from './cartService';
import goodService from './goodService';
import userService from './userService';
import { cloneValue, loadFromStorage, saveToStorage } from '../utils/storage';
import SubscribableService from './subscribableService';

const ORDER_KEY = 'pixelMall:orders';
const defaultReviewsByGoodId = defaultOrders.flatMap((order) => order.reviews || []).reduce((map, review) => {
  const goodId = Number(review.goodId);
  if (!map.has(goodId)) {
    map.set(goodId, []);
  }
  map.get(goodId).push(review);
  return map;
}, new Map());

const RETURN_STATUS_TEXT = {
  pending: '待审核',
  approved: '已同意',
  rejected: '已拒绝',
  shipped: '买家已寄回',
  received: '商家已收货',
  refunded: '已退款',
};

const RETURN_TYPE_TEXT = {
  refund: '仅退款',
  'return-refund': '退货退款',
};

const ACTIVE_RETURN_STATUSES = ['pending', 'approved', 'shipped', 'received'];

class OrderService extends SubscribableService {
  list = [];

  constructor() {
    super();
    this._loadData();
  }

  createOrder(userId, goodId, price, quantity = 1, address, options = {}) {
    const product = goodService.getGoodById(goodId);
    const user = userService.getUserById(userId) || userService.getCurrentUser();
    const parsedQuantity = Math.max(1, Number(quantity) || 1);
    const variant = product?.variants?.find((entry) => entry.id === options.variantId) || null;
    const availableStock = Number(variant?.stock ?? product?.stock ?? 0) || 0;

    if (!product || product.status !== 'on-sale' || availableStock < parsedQuantity) {
      return null;
    }

    const priceInfo = getProductPriceInfo(product);
    const unitPrice = Number(variant?.price ?? (priceInfo.currentPrice || price)) || 0;
    const originalPrice = Number(variant?.originalPrice ?? priceInfo.originalPrice) || unitPrice;
    const linePrice = unitPrice * parsedQuantity;
    const itemSnapshot = {
      goodId: product.id,
      quantity: parsedQuantity,
      price: unitPrice,
      originalPrice,
      currentPrice: unitPrice,
      saleTag: priceInfo.saleTag,
      selectedSpecs: options.selectedSpecs || {},
      variantId: variant?.id || options.variantId || '',
      specText: options.specText || '',
      goodSnapshot: buildProductSnapshot(product),
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
    const nextVariants = variant
      ? product.variants.map((entry) => (
        entry.id === variant.id ? { ...entry, stock: Math.max(0, Number(entry.stock) - parsedQuantity) } : entry
      ))
      : product.variants;
    goodService.updateGood({ ...product, stock: product.stock - parsedQuantity, variants: nextVariants });
    this._saveData();
    this.notify();
    return cloneValue(order);
  }

  createOrderFromCart(userId, address) {
    const validation = cartService.validateCheckout(userId);

    if (!validation.success) {
      return { success: false, message: validation.message };
    }

    const user = userService.getUserById(userId) || userService.getCurrentUser();
    const items = validation.items.map((cartItem) => {
      const priceInfo = getProductPriceInfo(cartItem.product);
      const unitPrice = Number(cartItem.variant?.price ?? priceInfo.currentPrice) || 0;
      const originalPrice = Number(cartItem.variant?.originalPrice ?? priceInfo.originalPrice) || unitPrice;
      return {
        goodId: cartItem.goodId,
        quantity: cartItem.count,
        price: unitPrice,
        originalPrice,
        currentPrice: unitPrice,
        saleTag: priceInfo.saleTag,
        selectedSpecs: cartItem.selectedSpecs || {},
        variantId: cartItem.variant?.id || cartItem.variantId || '',
        specText: cartItem.specText || '',
        goodSnapshot: buildProductSnapshot(cartItem.product),
      };
    });

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
        const nextVariants = item.variantId
          ? product.variants.map((entry) => (
            entry.id === item.variantId ? { ...entry, stock: Math.max(0, Number(entry.stock) - item.quantity) } : entry
          ))
          : product.variants;
        goodService.updateGood({ ...product, stock: product.stock - item.quantity, variants: nextVariants });
      }
    });

    this.list.unshift(order);
    this._saveData();
    this.notify();
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

    (order.items || []).forEach((item) => {
      const product = goodService.getGoodById(item.goodId);
      if (product) {
        goodService.updateGood({ ...product, sales: (Number(product.sales) || 0) + (Number(item.quantity) || 1) });
      }
    });

    this._saveData();
    this.notify();
    return { success: true };
  }

  failPayment(orderId) {
    const order = this._findOrder(orderId);

    if (!order || order.status !== 0) {
      return { success: false, message: '订单不可取消支付。' };
    }

    if (!order.stockReleased) {
      (order.items || []).forEach((item) => {
        const product = goodService.getGoodById(item.goodId);
        if (product) {
          const quantity = Number(item.quantity) || 1;
          const nextVariants = item.variantId
            ? product.variants.map((entry) => (
              entry.id === item.variantId ? { ...entry, stock: Number(entry.stock) + quantity } : entry
            ))
            : product.variants;
          goodService.updateGood({ ...product, stock: product.stock + quantity, variants: nextVariants });
        }
      });
      order.stockReleased = true;
    }

    order.logistics.unshift({
      time: new Date().toLocaleString(),
      text: '支付失败或已取消，可稍后重试。',
    });
    this._saveData();
    this.notify();
    return { success: true };
  }

  shipOrder(orderId, trackingNo) {
    const order = this._findOrder(orderId);

    if (!order) {
      return { success: false, message: '订单不存在。' };
    }

    if (order.status !== 1) {
      return { success: false, message: '只有已支付订单才能发货。' };
    }

    order.status = 2;
    order.logistics.unshift({
      time: new Date().toLocaleString(),
      text: `订单已发货，物流单号 ${trackingNo || `PIXEL-${order.id}`}`,
    });
    this._saveData();
    this.notify();
    return { success: true, message: '订单已发货。' };
  }

  confirmReceipt(orderId, userId) {
    const order = this._findOrder(orderId);

    if (!order) {
      return { success: false, message: '订单不存在。' };
    }

    if (Number(userId) !== order.userId) {
      return { success: false, message: '无权操作此订单。' };
    }

    if (order.status !== 2) {
      return { success: false, message: '仅已发货订单可确认收货。' };
    }

    order.status = 3;
    order.logistics.unshift({
      time: new Date().toLocaleString(),
      text: '买家已确认收货，交易完成。',
    });
    this._saveData();
    this.notify();
    return { success: true, message: '已确认收货，订单已完成。' };
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
    this.notify();
    return { success: true, message: '订单状态已更新。' };
  }

  submitReview(orderId, userId, payload = {}) {
    const order = this._findOrder(orderId);
    const goodId = Number(payload.goodId);
    const rating = Number(payload.rating);
    const content = String(payload.content ?? '').trim();

    if (!order) {
      return { success: false, message: '订单不存在。' };
    }

    if (Number(userId) !== order.userId) {
      return { success: false, message: '无权评价此订单。' };
    }

    if (order.status !== 3) {
      return { success: false, message: '确认收货后才能评价。' };
    }

    const item = this._findOrderItem(order, goodId);
    if (!item) {
      return { success: false, message: '评价商品不存在。' };
    }

    if ((order.reviews || []).some((review) => Number(review.goodId) === goodId)) {
      return { success: false, message: '该商品已评价。' };
    }

    if (!rating || rating < 1 || rating > 5) {
      return { success: false, message: '请选择 1-5 星评分。' };
    }

    if (!content) {
      return { success: false, message: '请填写评价内容。' };
    }

    const createdAt = new Date().toLocaleString();
    const review = {
      id: `review-${order.id}-${goodId}-${Date.now()}`,
      goodId,
      rating: Math.round(rating),
      content,
      createdAt,
      status: 'published',
      adminReply: '',
      repliedAt: '',
    };

    order.reviews = [review, ...(order.reviews || [])];
    order.logistics.unshift({
      time: createdAt,
      text: `买家已评价商品「${item.goodSnapshot?.name || '历史商品'}」。`,
    });
    this._saveData();
    this.notify();
    return { success: true, review: cloneValue(review), message: '评价已提交。' };
  }

  requestReturn(orderId, userId, payload = {}) {
    const order = this._findOrder(orderId);
    const goodId = Number(payload.goodId);
    const type = payload.type === 'return-refund' ? 'return-refund' : 'refund';
    const reason = String(payload.reason ?? '').trim();
    const description = String(payload.description ?? '').trim();

    if (!order) {
      return { success: false, message: '订单不存在。' };
    }

    if (Number(userId) !== order.userId) {
      return { success: false, message: '无权申请此订单售后。' };
    }

    if (order.status !== 3) {
      return { success: false, message: '确认收货后才能申请售后。' };
    }

    const item = this._findOrderItem(order, goodId);
    if (!item) {
      return { success: false, message: '售后商品不存在。' };
    }

    const hasActiveReturn = (order.returns || []).some((request) => (
      Number(request.goodId) === goodId && ACTIVE_RETURN_STATUSES.includes(request.status)
    ));

    if (hasActiveReturn) {
      return { success: false, message: '该商品已有进行中的售后申请。' };
    }

    if (!reason) {
      return { success: false, message: '请选择售后原因。' };
    }

    if (!description) {
      return { success: false, message: '请填写问题描述。' };
    }

    const createdAt = new Date().toLocaleString();
    const returnRequest = {
      id: `return-${order.id}-${goodId}-${Date.now()}`,
      goodId,
      type,
      reason,
      description,
      status: 'pending',
      createdAt,
      handledAt: '',
      returnTrackingNo: '',
      adminNote: '',
    };

    order.returns = [returnRequest, ...(order.returns || [])];
    order.logistics.unshift({
      time: createdAt,
      text: `买家已提交「${item.goodSnapshot?.name || '历史商品'}」${this.getReturnTypeText(type)}申请。`,
    });
    this._saveData();
    this.notify();
    return { success: true, returnRequest: cloneValue(returnRequest), message: '售后申请已提交。' };
  }

  submitReturnShipment(orderId, userId, returnId, trackingNo) {
    const order = this._findOrder(orderId);
    const normalizedTrackingNo = String(trackingNo ?? '').trim();

    if (!order) {
      return { success: false, message: '订单不存在。' };
    }

    if (Number(userId) !== order.userId) {
      return { success: false, message: '无权填写此售后物流。' };
    }

    const returnRequest = this._findReturn(order, returnId);
    if (!returnRequest) {
      return { success: false, message: '售后申请不存在。' };
    }

    if (returnRequest.status !== 'approved') {
      return { success: false, message: '只有已同意的退货申请才能填写物流。' };
    }

    if (returnRequest.type !== 'return-refund') {
      return { success: false, message: '仅退货退款需要填写寄回物流。' };
    }

    if (!normalizedTrackingNo) {
      return { success: false, message: '请填写退货物流单号。' };
    }

    const handledAt = new Date().toLocaleString();
    returnRequest.status = 'shipped';
    returnRequest.returnTrackingNo = normalizedTrackingNo;
    returnRequest.handledAt = handledAt;
    order.logistics.unshift({
      time: handledAt,
      text: `买家已寄回退货商品，物流单号 ${normalizedTrackingNo}。`,
    });
    this._saveData();
    this.notify();
    return { success: true, message: '退货物流已提交。' };
  }

  handleReturnRequest(orderId, returnId, action, note = '') {
    const order = this._findOrder(orderId);
    const adminNote = String(note ?? '').trim();

    if (!order) {
      return { success: false, message: '订单不存在。' };
    }

    const returnRequest = this._findReturn(order, returnId);
    if (!returnRequest) {
      return { success: false, message: '售后申请不存在。' };
    }

    const handledAt = new Date().toLocaleString();
    const typeText = this.getReturnTypeText(returnRequest.type);
    const actionMap = {
      approve: {
        from: ['pending'],
        next: 'approved',
        text: returnRequest.type === 'refund' ? `${typeText}申请已通过，等待退款。` : `${typeText}申请已通过，等待买家寄回商品。`,
      },
      reject: {
        from: ['pending'],
        next: 'rejected',
        text: `${typeText}申请已拒绝。`,
      },
      markReceived: {
        from: ['shipped'],
        next: 'received',
        text: '商家已确认收到退货商品。',
      },
      refund: {
        from: returnRequest.type === 'refund' ? ['approved'] : ['received'],
        next: 'refunded',
        text: `${typeText}已完成退款。`,
      },
    };
    const actionConfig = actionMap[action];

    if (!actionConfig) {
      return { success: false, message: '售后操作无效。' };
    }

    if (!actionConfig.from.includes(returnRequest.status)) {
      return { success: false, message: '当前售后状态不能执行该操作。' };
    }

    returnRequest.status = actionConfig.next;
    returnRequest.handledAt = handledAt;
    returnRequest.adminNote = adminNote;
    order.logistics.unshift({ time: handledAt, text: actionConfig.text });
    this._saveData();
    this.notify();
    return { success: true, message: actionConfig.text };
  }

  replyReview(orderId, reviewId, reply) {
    const order = this._findOrder(orderId);
    const content = String(reply ?? '').trim();

    if (!order) {
      return { success: false, message: '订单不存在。' };
    }

    const review = this._findReview(order, reviewId);
    if (!review) {
      return { success: false, message: '评价不存在。' };
    }

    if (!content) {
      return { success: false, message: '请填写回复内容。' };
    }

    review.adminReply = content;
    review.repliedAt = new Date().toLocaleString();
    this._saveData();
    this.notify();
    return { success: true, message: '评价回复已保存。' };
  }

  getOrderList(filters = {}) {
    const {
      status = 'all',
      keyword = '',
      userId,
      afterSaleStatus = 'all',
      hasReview = 'all',
      hasReturn = 'all',
    } = filters;
    const normalizedKeyword = String(keyword ?? '').trim().toLowerCase();

    return this.list
      .filter((order) => {
        const reviews = order.reviews || [];
        const returns = order.returns || [];

        if (status !== 'all' && Number(status) !== order.status) {
          return false;
        }

        if (userId && Number(userId) !== order.userId) {
          return false;
        }

        if (hasReview === 'yes' && !reviews.length) {
          return false;
        }

        if (hasReview === 'no' && reviews.length) {
          return false;
        }

        if (hasReturn === 'yes' && !returns.length) {
          return false;
        }

        if (hasReturn === 'no' && returns.length) {
          return false;
        }

        if (afterSaleStatus !== 'all' && !returns.some((request) => request.status === afterSaleStatus)) {
          return false;
        }

        if (!normalizedKeyword) {
          return true;
        }

        return [
          order.orderNo,
          order.userSnapshot?.nickname,
          order.goodSnapshot?.name,
          order.goodSnapshot?.categoryName,
          ...(order.items || []).flatMap((item) => [item.goodSnapshot?.name, item.goodSnapshot?.categoryName]),
          ...reviews.map((review) => review.content),
          ...returns.flatMap((request) => [request.reason, request.description, request.returnTrackingNo]),
        ].some((field) => String(field ?? '').toLowerCase().includes(normalizedKeyword));
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

  getProductReviews(goodId) {
    const parsedGoodId = Number(goodId);
    return this.list
      .flatMap((order) => (order.reviews || []).map((review) => ({
        ...review,
        orderId: order.id,
        orderNo: order.orderNo,
        userSnapshot: cloneValue(order.userSnapshot),
      })))
      .filter((review) => Number(review.goodId) === parsedGoodId && review.status === 'published')
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
      .map((review) => cloneValue(review));
  }

  getReturnRequests(filters = {}) {
    const { status = 'all' } = filters;

    return this.list.flatMap((order) => (order.returns || []).map((request) => ({
      ...cloneValue(request),
      orderId: order.id,
      orderNo: order.orderNo,
      userSnapshot: cloneValue(order.userSnapshot),
    }))).filter((request) => status === 'all' || request.status === status);
  }

  getStatusText(status) {
    if (status === 0) return '待支付';
    if (status === 1) return '已支付';
    if (status === 2) return '已发货';
    return '已完成';
  }

  getReturnStatusText(status) {
    return RETURN_STATUS_TEXT[status] || '售后中';
  }

  getReturnTypeText(type) {
    return RETURN_TYPE_TEXT[type] || '售后申请';
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

  reload() {
    this._loadData();
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
      reviews: [],
      returns: [],
    };
  }

  _normalizeOrder(input) {
    const product = goodService.getGoodById(input.goodId);
    const user = userService.getUserById(input.userId);
    const legacyPrice = Number(input.price) || 0;
    const productPriceInfo = getProductPriceInfo(product);
    const legacySnapshot = input.goodSnapshot || null;
    const legacySnapshotPriceInfo = getProductPriceInfo(legacySnapshot || { price: legacyPrice });
    const legacyItem = product
      ? {
        goodId: product.id,
        quantity: 1,
        price: legacyPrice || productPriceInfo.currentPrice,
        originalPrice: legacySnapshotPriceInfo.originalPrice,
        currentPrice: legacySnapshotPriceInfo.currentPrice,
        saleTag: legacySnapshotPriceInfo.saleTag,
        goodSnapshot: legacySnapshot || {
          id: product.id,
          name: product.name,
          price: legacyPrice || productPriceInfo.currentPrice,
          originalPrice: legacySnapshotPriceInfo.originalPrice,
          currentPrice: legacySnapshotPriceInfo.currentPrice,
          saleTag: legacySnapshotPriceInfo.saleTag,
          cover: product.cover,
          categoryName: product.categoryName,
        },
      }
      : null;
    const normalizedItems = (Array.isArray(input.items) && input.items.length ? input.items : legacyItem ? [legacyItem] : []).map((item) => {
      const snapshot = item.goodSnapshot || legacySnapshot || null;
      const priceInfo = getProductPriceInfo({
        price: item.price ?? snapshot?.price,
        currentPrice: item.currentPrice ?? snapshot?.currentPrice,
        originalPrice: item.originalPrice ?? snapshot?.originalPrice,
        saleTag: item.saleTag ?? snapshot?.saleTag,
      });

      return {
        ...item,
        goodId: Number(item.goodId),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || priceInfo.currentPrice,
        originalPrice: priceInfo.originalPrice,
        currentPrice: priceInfo.currentPrice,
        saleTag: priceInfo.saleTag,
        goodSnapshot: snapshot
          ? {
            ...snapshot,
            price: Number(snapshot.price) || priceInfo.currentPrice,
            originalPrice: priceInfo.originalPrice,
            currentPrice: priceInfo.currentPrice,
            saleTag: priceInfo.saleTag,
          }
          : snapshot,
      };
    });

    const normalizedTotalPrice = legacyPrice || normalizedItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

    return {
      ...input,
      userId: Number(input.userId),
      goodId: Number(input.goodId),
      items: normalizedItems,
      status: Number(input.status) || 0,
      price: normalizedTotalPrice,
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
      goodSnapshot: legacySnapshot
        ? {
          ...legacySnapshot,
          price: Number(legacySnapshot.price) || legacySnapshotPriceInfo.currentPrice,
          originalPrice: legacySnapshotPriceInfo.originalPrice,
          currentPrice: legacySnapshotPriceInfo.currentPrice,
          saleTag: legacySnapshotPriceInfo.saleTag,
        }
        : legacyItem?.goodSnapshot || null,
      logistics: Array.isArray(input.logistics)
        ? input.logistics
        : [{ time: input.createTime || new Date().toLocaleString(), text: '订单已创建，等待后续处理。' }],
      stockReleased: Boolean(input.stockReleased),
      reviews: this._normalizeReviews(this._mergeDefaultReviews(input), input),
      returns: this._normalizeReturns(input.returns, input),
    };
  }

  _mergeDefaultReviews(order) {
    const reviews = Array.isArray(order.reviews) ? order.reviews : [];
    const reviewIds = new Set(reviews.map((review) => review.id));
    const defaultReviews = defaultReviewsByGoodId.get(Number(order.goodId)) || [];
    return [
      ...reviews,
      ...defaultReviews.filter((review) => !reviewIds.has(review.id)),
    ];
  }

  _normalizeReviews(reviews, order) {
    if (!Array.isArray(reviews)) {
      return [];
    }

    return reviews.map((review, index) => ({
      id: review.id || `review-${order.id}-${review.goodId || index}`,
      goodId: Number(review.goodId || order.goodId),
      rating: Math.min(5, Math.max(1, Math.round(Number(review.rating) || 5))),
      content: String(review.content || ''),
      createdAt: review.createdAt || order.createTime || new Date().toLocaleString(),
      status: review.status || 'published',
      nickname: String(review.nickname || order.userSnapshot?.nickname || '匿名买家'),
      avatar: String(review.avatar || order.userSnapshot?.nickname?.slice(0, 1) || '买'),
      specText: String(review.specText || ''),
      media: Array.isArray(review.media) ? review.media.map((item) => ({ ...item })) : [],
      followUp: review.followUp && typeof review.followUp === 'object'
        ? {
          createdAt: review.followUp.createdAt || review.createdAt || order.createTime || '',
          content: String(review.followUp.content || ''),
        }
        : null,
      tags: Array.isArray(review.tags) ? review.tags.map((tag) => String(tag)).filter(Boolean) : [],
      isNegative: Boolean(review.isNegative) || Number(review.rating) <= 2,
      helpfulCount: Number(review.helpfulCount) || 0,
      adminReply: review.adminReply || '',
      repliedAt: review.repliedAt || '',
    }));
  }

  _normalizeReturns(returns, order) {
    if (!Array.isArray(returns)) {
      return [];
    }

    return returns.map((request, index) => ({
      id: request.id || `return-${order.id}-${request.goodId || index}`,
      goodId: Number(request.goodId || order.goodId),
      type: request.type === 'return-refund' ? 'return-refund' : 'refund',
      reason: request.reason || '其他原因',
      description: request.description || '',
      status: RETURN_STATUS_TEXT[request.status] ? request.status : 'pending',
      createdAt: request.createdAt || order.createTime || new Date().toLocaleString(),
      handledAt: request.handledAt || '',
      returnTrackingNo: request.returnTrackingNo || '',
      adminNote: request.adminNote || '',
    }));
  }

  _findOrder(orderId) {
    const parsedId = Number(orderId);
    return this.list.find((item) => item.id === parsedId);
  }

  _findOrderItem(order, goodId) {
    const parsedGoodId = Number(goodId);
    return (order.items || []).find((item) => Number(item.goodId) === parsedGoodId);
  }

  _findReview(order, reviewId) {
    return (order.reviews || []).find((review) => review.id === reviewId);
  }

  _findReturn(order, returnId) {
    return (order.returns || []).find((request) => request.id === returnId);
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
    this.notify();
  }
}

const orderService = new OrderService();
export default orderService;
