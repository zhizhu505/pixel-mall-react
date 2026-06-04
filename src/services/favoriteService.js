import { defaultFavorites } from '../mock/data';
import goodService from './goodService';
import { cloneValue, loadFromStorage, saveToStorage } from '../utils/storage';

const FAVORITE_KEY = 'pixelMall:favorites';

class FavoriteService {
  list = [];

  constructor() {
    this._loadData();
  }

  getFavoritesByUser(userId) {
    return this.list
      .filter((item) => item.userId === Number(userId))
      .map((item) => cloneValue(item));
  }

  getFavoriteProducts(userId) {
    return this.getFavoritesByUser(userId)
      .map((item) => goodService.getGoodById(item.productId))
      .filter(Boolean);
  }

  isFavorite(userId, productId) {
    return this.list.some(
      (item) => item.userId === Number(userId) && item.productId === Number(productId),
    );
  }

  toggleFavorite(userId, productId) {
    const parsedUserId = Number(userId);
    const parsedProductId = Number(productId);
    const product = goodService.getGoodById(parsedProductId);

    if (!product) {
      return { success: false, message: '商品不存在。' };
    }

    const existing = this.list.find(
      (item) => item.userId === parsedUserId && item.productId === parsedProductId,
    );

    if (existing) {
      this.list = this.list.filter((item) => item.id !== existing.id);
      this._saveData();
      return { success: true, favorited: false, message: '已取消收藏。' };
    }

    this.list.unshift({
      id: `fav-${parsedUserId}-${parsedProductId}`,
      userId: parsedUserId,
      productId: parsedProductId,
      createdAt: new Date().toLocaleString(),
    });
    this._saveData();
    return { success: true, favorited: true, message: '已加入收藏。' };
  }

  removeFavorite(userId, productId) {
    this.list = this.list.filter(
      (item) => !(item.userId === Number(userId) && item.productId === Number(productId)),
    );
    this._saveData();
  }

  _loadData() {
    this.list = loadFromStorage([FAVORITE_KEY], defaultFavorites);
    this._saveData();
  }

  _saveData() {
    saveToStorage(FAVORITE_KEY, this.list);
  }
}

const favoriteService = new FavoriteService();
export default favoriteService;
