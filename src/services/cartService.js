import { defaultCarts } from '../mock/data';
import { buildProductSnapshot, getProductPriceInfo } from '../utils/productDisplay';
import goodService from './goodService';
import SubscribableService from './subscribableService';
import { cloneValue, loadFromStorage, saveToStorage } from '../utils/storage';

const CART_KEY = 'pixelMall:carts';

class CartService extends SubscribableService {
  carts = [];

  constructor() {
    super();
    this._loadData();
  }

  getCartItems(userId) {
    return this.carts.filter((item) => item.userId === Number(userId)).map((item) => cloneValue(item));
  }

  getCartCount(userId) {
    return this.getCartItems(userId).reduce((count, item) => count + item.count, 0);
  }

  getItemCountByGoodId(userId, goodId) {
    const item = this.carts.find((cartItem) => cartItem.userId === Number(userId) && cartItem.goodId === Number(goodId));
    return item ? item.count : 0;
  }

  _buildSpecKey(selectedSpecs = {}) {
    return Object.entries(selectedSpecs)
      .filter(([, value]) => value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  }

  getEnrichedCartItems(userId) {
    return this.getCartItems(userId).map((item) => {
      const product = goodService.getGoodById(item.goodId);
      const productSource = product || item.goodSnapshot;
      const priceInfo = getProductPriceInfo(productSource);
      const variant = product?.variants?.find((entry) => entry.id === item.variantId) || null;
      const stock = Number(variant?.stock ?? product?.stock ?? 0) || 0;
      return {
        ...item,
        product,
        variant,
        lineTotal: productSource ? Number(variant?.price ?? priceInfo.currentPrice) * item.count : 0,
        isAvailable: Boolean(product && product.status === 'on-sale' && stock > 0),
        stock,
      };
    });
  }

  getSelectedItems(userId) {
    return this.getEnrichedCartItems(userId).filter((item) => item.checked);
  }

  getSelectedTotal(userId) {
    return this.getSelectedItems(userId).reduce((sum, item) => {
      if (!item.isAvailable) {
        return sum;
      }
      const maxCount = Math.min(item.count, item.stock);
      const priceInfo = getProductPriceInfo(item.product);
      return sum + Number(item.variant?.price ?? priceInfo.currentPrice) * maxCount;
    }, 0);
  }

  validateCheckout(userId) {
    const selected = this.getSelectedItems(userId);

    if (!selected.length) {
      return { success: false, message: '请先勾选要结算的商品。' };
    }

    const invalid = selected.find((item) => !item.isAvailable);
    if (invalid) {
      return { success: false, message: `「${invalid.product?.name || '商品'}」已下架或售罄，无法结算。` };
    }

    const overStock = selected.find((item) => item.count > item.stock);
    if (overStock) {
      return { success: false, message: `「${overStock.product.name}」库存不足，请调整数量。` };
    }

    return { success: true, items: selected };
  }

  removeCheckedItems(userId) {
    this.carts = this.carts.filter((item) => !(item.userId === Number(userId) && item.checked));
    this._saveData();
  }

  removeItemsByGoodIds(userId, goodIds) {
    const idSet = new Set(goodIds.map((id) => Number(id)));

    if (!idSet.size) {
      return;
    }

    this.carts = this.carts.filter(
      (item) => !(item.userId === Number(userId) && idSet.has(Number(item.goodId))),
    );
    this._saveData();
  }

  refreshSnapshots(userId) {
    this.carts = this.carts.map((item) => {
      if (item.userId !== Number(userId)) {
        return item;
      }

      const product = goodService.getGoodById(item.goodId);
      if (!product) {
        return item;
      }

      return {
        ...item,
        goodSnapshot: buildProductSnapshot(product),
      };
    });
    this._saveData();
  }

  addItem(userId, goodId, count = 1, options = {}) {
    const product = goodService.getGoodById(goodId);

    if (!product || product.status !== 'on-sale') {
      return { success: false, message: '商品不可加入购物车。' };
    }

    const selectedSpecs = options.selectedSpecs && typeof options.selectedSpecs === 'object' ? options.selectedSpecs : {};
    const specKey = this._buildSpecKey(selectedSpecs);
    const variant = options.variant && typeof options.variant === 'object' ? options.variant : null;
    const availableStock = Number(variant?.stock ?? product.stock) || 0;
    const existing = this.carts.find((item) => (
      item.userId === Number(userId)
      && item.goodId === Number(goodId)
      && this._buildSpecKey(item.selectedSpecs) === specKey
    ));

    if (existing) {
      const nextCount = existing.count + count;
      if (nextCount > availableStock) {
        return { success: false, message: '超过库存上限。' };
      }
      existing.count = nextCount;
      existing.selectedSpecs = selectedSpecs;
      existing.variantId = variant?.id || existing.variantId || '';
      existing.specText = options.specText || existing.specText || '';
      existing.goodSnapshot = buildProductSnapshot(product);
    } else {
      if (count > availableStock) {
        return { success: false, message: '超过库存上限。' };
      }
      const itemId = specKey ? `${userId}-${goodId}-${specKey}` : `${userId}-${goodId}`;
      this.carts.push({
        id: itemId,
        userId: Number(userId),
        goodId: Number(goodId),
        count,
        checked: true,
        selectedSpecs,
        variantId: variant?.id || '',
        specText: options.specText || '',
        goodSnapshot: buildProductSnapshot(product),
      });
    }

    this._saveData();
    return { success: true };
  }

  updateCount(itemId, count) {
    const item = this._findItem(itemId);

    if (!item) {
      return { success: false, message: '购物车项不存在。' };
    }

    const nextCount = Number(count);

    if (!Number.isFinite(nextCount) || nextCount < 1) {
      this.removeItem(item.id);
      return { success: true, removed: true };
    }

    const product = goodService.getGoodById(item.goodId);

    if (!product || product.status !== 'on-sale') {
      return { success: false, message: '商品不可购买。' };
    }

    const variant = product.variants?.find((entry) => entry.id === item.variantId) || null;
    const stock = Number(variant?.stock ?? product.stock) || 0;

    if (nextCount > stock) {
      return { success: false, message: '数量不能超过库存。' };
    }

    item.count = nextCount;
    this._saveData();
    return { success: true };
  }

  removeItem(itemId) {
    const key = String(itemId);
    this.carts = this.carts.filter((item) => String(item.id) !== key);
    this._saveData();
  }

  setItemChecked(itemId, checked) {
    const item = this._findItem(itemId);

    if (!item) {
      return false;
    }

    item.checked = Boolean(checked);
    this._saveData();
    return true;
  }

  toggleItem(itemId) {
    const item = this._findItem(itemId);

    if (!item) {
      return false;
    }

    item.checked = !item.checked;
    this._saveData();
    return true;
  }

  toggleAll(userId, checked) {
    this.carts = this.carts.map((item) => (item.userId === Number(userId) ? { ...item, checked } : item));
    this._saveData();
  }

  _findItem(itemId) {
    const key = String(itemId);
    return this.carts.find((cartItem) => String(cartItem.id) === key);
  }

  _normalizeCarts() {
    this.carts = this.carts.map((item) => {
      const userId = Number(item.userId);
      const goodId = Number(item.goodId);
      return {
        ...item,
        id: item.id ? String(item.id) : `${userId}-${goodId}`,
        userId,
        goodId,
        selectedSpecs: item.selectedSpecs && typeof item.selectedSpecs === 'object' ? item.selectedSpecs : {},
        variantId: item.variantId || '',
        specText: item.specText || '',
        checked: item.checked === true,
      };
    });
  }

  _loadData() {
    this.carts = loadFromStorage([CART_KEY], defaultCarts);
    this._normalizeCarts();
    this._saveData();
  }

  _saveData() {
    saveToStorage(CART_KEY, this.carts);
    this.notify();
  }
}

const cartService = new CartService();
export default cartService;
