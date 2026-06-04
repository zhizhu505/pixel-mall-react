import { defaultCategories, defaultProducts } from '../mock/data';
import { cloneValue, loadFromStorage, saveToStorage } from '../utils/storage';

const PRODUCT_KEY = 'pixelMall:products';
const CATEGORY_KEY = 'pixelMall:categories';

const normalizeText = (value) => String(value ?? '').trim();

class GoodService {
  products = [];
  categories = [];

  constructor() {
    this._loadData();
  }

  getGoodList(filters = {}) {
    const { keyword = '', categoryId = 'all', status = 'all', includeDeleted = true } = filters;
    const normalizedKeyword = normalizeText(keyword).toLowerCase();

    return this.products
      .filter((product) => {
        if (!includeDeleted && product.status === 'deleted') {
          return false;
        }

        if (categoryId !== 'all' && product.categoryId !== categoryId) {
          return false;
        }

        if (status !== 'all' && product.status !== status) {
          return false;
        }

        if (!normalizedKeyword) {
          return true;
        }

        return [product.name, product.description, product.categoryName].some((field) =>
          String(field ?? '').toLowerCase().includes(normalizedKeyword),
        );
      })
      .map((product) => cloneValue(product));
  }

  getPublicGoodList(filters = {}) {
    return this.getGoodList({ ...filters, includeDeleted: false }).filter(
      (product) => product.status === 'on-sale' && product.stock > 0,
    );
  }

  searchProducts(keyword) {
    return this.getPublicGoodList({ keyword });
  }

  getGoodById(id) {
    const parsedId = Number(id);
    const product = this.products.find((item) => item.id === parsedId);
    return product ? cloneValue(product) : null;
  }

  getCategoryList() {
    return this.categories
      .slice()
      .sort((left, right) => left.sort - right.sort)
      .map((category) => cloneValue(category));
  }

  getCategoryById(id) {
    const category = this.categories.find((item) => item.id === id);
    return category ? cloneValue(category) : null;
  }

  getDashboardStats() {
    const onSaleCount = this.products.filter((product) => product.status === 'on-sale').length;
    const offSaleCount = this.products.filter((product) => product.status === 'off-sale').length;
    const deletedCount = this.products.filter((product) => product.status === 'deleted').length;
    const lowStockCount = this.products.filter((product) => product.stock > 0 && product.stock <= 5).length;

    return {
      total: this.products.length,
      onSaleCount,
      offSaleCount,
      deletedCount,
      lowStockCount,
      categoryCount: this.categories.length,
    };
  }

  addGood(input) {
    const product = this._normalizeProduct({
      ...input,
      id: this._nextProductId(),
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    });

    this.products.unshift(product);
    this._saveProducts();
    return cloneValue(product);
  }

  updateGood(input) {
    const parsedId = Number(input.id);
    const current = this.products.find((item) => item.id === parsedId);

    if (!current) {
      return null;
    }

    const product = this._normalizeProduct({
      ...current,
      ...input,
      id: parsedId,
      createdAt: current.createdAt,
      updatedAt: new Date().toLocaleString(),
    });

    this.products = this.products.map((item) => (item.id === parsedId ? product : item));
    this._saveProducts();
    return cloneValue(product);
  }

  deleteGood(id) {
    const parsedId = Number(id);
    const product = this.products.find((item) => item.id === parsedId);

    if (!product) {
      return false;
    }

    product.status = 'deleted';
    product.updatedAt = new Date().toLocaleString();
    this._saveProducts();
    return true;
  }

  toggleGoodStatus(id) {
    const parsedId = Number(id);
    const product = this.products.find((item) => item.id === parsedId);

    if (!product || product.status === 'deleted') {
      return null;
    }

    product.status = product.status === 'on-sale' ? 'off-sale' : 'on-sale';
    product.updatedAt = new Date().toLocaleString();
    this._saveProducts();
    return cloneValue(product);
  }

  addCategory(input) {
    const category = {
      id: input.id || `cat-${Date.now()}`,
      name: normalizeText(input.name),
      description: normalizeText(input.description),
      sort: Number(input.sort) || this.categories.length + 1,
    };

    this.categories.push(category);
    this._saveCategories();
    return cloneValue(category);
  }

  updateCategory(input) {
    const category = this.categories.find((item) => item.id === input.id);

    if (!category) {
      return null;
    }

    category.name = normalizeText(input.name);
    category.description = normalizeText(input.description);
    category.sort = Number(input.sort) || category.sort;

    this.products = this.products.map((product) =>
      product.categoryId === category.id
        ? { ...product, categoryName: category.name, updatedAt: new Date().toLocaleString() }
        : product,
    );

    this._saveCategories();
    this._saveProducts();
    return cloneValue(category);
  }

  deleteCategory(id) {
    const usedByProducts = this.products.some((product) => product.categoryId === id && product.status !== 'deleted');

    if (usedByProducts) {
      return { success: false, message: '该分类下仍有商品，无法删除。' };
    }

    this.categories = this.categories.filter((item) => item.id !== id);
    this._saveCategories();
    return { success: true };
  }

  _nextProductId() {
    return this.products.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  _normalizeProduct(input) {
    const category = this.categories.find((item) => item.id === input.categoryId) || this.categories[0];
    const cover = normalizeText(input.cover || input.img || '/favicon.svg');

    return {
      id: Number(input.id),
      name: normalizeText(input.name),
      price: Number(input.price) || 0,
      categoryId: input.categoryId || category?.id || '',
      categoryName: category?.name || '',
      cover,
      img: cover,
      description: normalizeText(input.description),
      stock: Number(input.stock) || 0,
      status: input.status || 'off-sale',
      createdAt: input.createdAt || new Date().toLocaleString(),
      updatedAt: input.updatedAt || new Date().toLocaleString(),
    };
  }

  _saveProducts() {
    saveToStorage(PRODUCT_KEY, this.products);
  }

  _saveCategories() {
    saveToStorage(CATEGORY_KEY, this.categories);
  }

  _loadData() {
    const storedCategories = loadFromStorage([CATEGORY_KEY], defaultCategories);
    const storedCategoryIds = new Set(storedCategories.map((c) => c.id));
    const mergedCategories = [
      ...storedCategories,
      ...defaultCategories.filter((c) => !storedCategoryIds.has(c.id)),
    ];
    this.categories = mergedCategories.sort((a, b) => a.sort - b.sort);

    const legacyProducts = loadFromStorage(['goodList'], []);
    const storedProducts = loadFromStorage([PRODUCT_KEY], legacyProducts.length ? legacyProducts : defaultProducts);
    const storedProductIds = new Set(storedProducts.map((p) => Number(p.id)));
    const mergedProducts = [
      ...storedProducts,
      ...defaultProducts.filter((p) => !storedProductIds.has(p.id)),
    ];

    this.products = mergedProducts.map((product) =>
      this._normalizeProduct({
        stock: 0,
        description: '',
        status: 'on-sale',
        cover: product.cover || product.img,
        ...product,
      }),
    );

    this._saveCategories();
    this._saveProducts();
  }
}

const goodService = new GoodService();
export default goodService;
