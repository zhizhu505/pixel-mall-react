import { defaultCategories, defaultProducts, defaultShops } from '../mock/data';
import { buildProductSnapshot, getProductPriceInfo, resolveProductImageList } from '../utils/productDisplay';
import { cloneValue, loadFromStorage, saveToStorage } from '../utils/storage';
import SubscribableService from './subscribableService';

const PRODUCT_KEY = 'pixelMall:products';
const CATEGORY_KEY = 'pixelMall:categories';
const CACHE_VERSION_KEY = 'pixelMall:cacheVersion';
const CURRENT_CACHE_VERSION = '2';
const DEFAULT_ON_SALE_STOCK = 60;
const LOW_STOCK_WARNING_THRESHOLD = 5;
const defaultProductCoverById = Object.fromEntries(defaultProducts.map((product) => [product.id, product.cover]));
const defaultProductDetailById = Object.fromEntries(defaultProducts.map((product) => [product.id, {
  images: product.images,
  detailImage: product.detailImage,
  media: product.media,
  specGroups: product.specGroups,
  variants: product.variants,
  services: product.services,
  promotionInfo: product.promotionInfo,
  detailSections: product.detailSections,
  qaItems: product.qaItems,
  reviews: product.reviews,
  shopBadges: product.shopBadges,
}]));
const shopIdByProductId = Object.fromEntries(
  defaultShops.flatMap((shop) => shop.productIds.map((productId) => [productId, shop.id])),
);
const mergeMissingDefaultProducts = (products) => {
  const existingIds = new Set((Array.isArray(products) ? products : []).map((product) => Number(product?.id)).filter(Boolean));
  const missingDefaults = defaultProducts.filter((product) => !existingIds.has(Number(product.id)));
  return [...(Array.isArray(products) ? products : []), ...missingDefaults.map((product) => cloneValue(product))];
};

const normalizeText = (value) => String(value ?? '').trim();
const normalizeMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
};
const normalizeStock = (value, status) => {
  const stock = Number(value);
  if (Number.isFinite(stock) && stock >= 0) {
    return stock;
  }
  return status === 'on-sale' ? DEFAULT_ON_SALE_STOCK : 0;
};
const normalizeSales = (value, productId) => {
  const sales = Number(value);
  if (Number.isFinite(sales) && sales >= 0) {
    return Math.floor(sales);
  }
  return 120 + (Number(productId) || 0) * 17;
};
const hasCategoryId = (category) => Boolean(normalizeText(category?.id));
const normalizeCategory = (input, fallbackSort = 1) => ({
  id: normalizeText(input.id),
  name: normalizeText(input.name) || '未命名分类',
  description: normalizeText(input.description),
  sort: Number(input.sort) || fallbackSort,
});

const hasStoredValue = (key) => typeof window !== 'undefined' && window.localStorage.getItem(key) !== null;
const normalizeImageList = (images, cover) => resolveProductImageList(images, cover).slice(0, 8);
const normalizePlainList = (items) => (Array.isArray(items) ? items.map((item) => cloneValue(item)).filter(Boolean) : []);
const normalizeMediaList = (media, images, cover) => {
  const source = Array.isArray(media) && media.length
    ? media
    : normalizeImageList(images, cover).map((src) => ({ type: 'image', src }));

  return source.map((item, index) => {
    const type = item.type === 'video' ? 'video' : 'image';
    return {
      ...cloneValue(item),
      type,
      src: type === 'image' ? normalizeText(item.src || item.cover || cover) : normalizeText(item.src || ''),
      cover: normalizeText(item.cover || item.src || cover),
      title: normalizeText(item.title) || (type === 'video' ? '商品短视频' : `商品图片 ${index + 1}`),
      duration: normalizeText(item.duration),
    };
  });
};
const normalizeSpecGroups = (groups) => normalizePlainList(groups)
  .map((group) => ({
    id: normalizeText(group.id),
    name: normalizeText(group.name),
    options: normalizePlainList(group.options)
      .map((option) => ({ id: normalizeText(option.id), label: normalizeText(option.label || option.name) }))
      .filter((option) => option.id && option.label),
  }))
  .filter((group) => group.id && group.name && group.options.length);
const normalizeVariants = (variants) => normalizePlainList(variants)
  .map((variant) => ({
    ...variant,
    id: normalizeText(variant.id),
    specs: variant.specs && typeof variant.specs === 'object' ? cloneValue(variant.specs) : {},
    stock: normalizeStock(variant.stock, 'on-sale'),
    price: variant.price === undefined ? undefined : normalizeMoney(variant.price),
    originalPrice: variant.originalPrice === undefined ? undefined : normalizeMoney(variant.originalPrice),
    delivery: normalizeText(variant.delivery),
  }))
  .filter((variant) => variant.id);
const normalizeServices = (services) => normalizePlainList(services)
  .map((service) => ({
    key: normalizeText(service.key || service.label),
    label: normalizeText(service.label),
    summary: normalizeText(service.summary),
    detail: normalizeText(service.detail),
  }))
  .filter((service) => service.key && service.label);
const normalizePromotionInfo = (input) => ({
  shipping: normalizeText(input?.shipping),
  tags: normalizePlainList(input?.tags).map(normalizeText).filter(Boolean),
  coupons: normalizePlainList(input?.coupons).map(normalizeText).filter(Boolean),
});

class GoodService extends SubscribableService {
  products = [];
  categories = [];
  shops = [];

  constructor() {
    super();
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

  advancedSearchProducts(filters = {}) {
    const { keyword = '', categoryId = 'all', discount = 'all', stock = 'all', price = 'all', sort = 'sales-desc' } = filters;
    const [minPrice, maxPrice] = String(price).split('-').map((value) => Number(value));
    const hasPriceRange = price !== 'all' && Number.isFinite(minPrice) && Number.isFinite(maxPrice);
    const products = this.getPublicGoodList({ keyword, categoryId }).filter((product) => {
      const priceInfo = getProductPriceInfo(product);
      if (discount === 'discount' && !priceInfo.hasDiscount && !priceInfo.saleTag) {
        return false;
      }
      if (stock === 'low' && !(product.stock > 0 && product.stock < LOW_STOCK_WARNING_THRESHOLD)) {
        return false;
      }
      if (stock === 'enough' && product.stock < LOW_STOCK_WARNING_THRESHOLD) {
        return false;
      }
      if (hasPriceRange && (priceInfo.currentPrice < minPrice || priceInfo.currentPrice > maxPrice)) {
        return false;
      }
      return true;
    });

    return products.sort((left, right) => {
      const leftPrice = getProductPriceInfo(left).currentPrice;
      const rightPrice = getProductPriceInfo(right).currentPrice;
      const leftSales = Number(left.sales) || 0;
      const rightSales = Number(right.sales) || 0;
      if (sort === 'sales-desc' || sort === 'stock-desc') {
        return rightSales - leftSales || left.id - right.id;
      }
      if (sort === 'price-asc') return leftPrice - rightPrice;
      if (sort === 'price-desc') return rightPrice - leftPrice;
      return left.id - right.id;
    });
  }

  getSearchSuggestions(keyword = '', limit = 8) {
    const normalizedKeyword = normalizeText(keyword).toLowerCase();
    const terms = [];
    const addTerm = (term) => {
      const value = normalizeText(term);
      if (value && !terms.includes(value)) {
        terms.push(value);
      }
    };

    this.getCategoryList().forEach((category) => addTerm(category.name));
    this.getPublicGoodList().forEach((product) => {
      if (!normalizedKeyword || [product.name, product.description, product.categoryName, product.saleTag].some((field) => String(field ?? '').toLowerCase().includes(normalizedKeyword))) {
        addTerm(product.name);
        addTerm(product.categoryName);
        addTerm(product.saleTag);
      }
    });

    return terms.slice(0, limit);
  }

  getSearchFilterOptions(keyword = '') {
    const products = this.getPublicGoodList({ keyword });
    const categories = this.getCategoryList().filter((category) => products.some((product) => product.categoryId === category.id));
    const prices = products.map((product) => getProductPriceInfo(product).currentPrice);
    return {
      categories,
      hasDiscount: products.some((product) => {
        const priceInfo = getProductPriceInfo(product);
        return priceInfo.hasDiscount || priceInfo.saleTag;
      }),
      hasLowStock: products.some((product) => product.stock > 0 && product.stock < LOW_STOCK_WARNING_THRESHOLD),
      priceRanges: prices.length ? [
        { key: '0-80', label: '¥80 以下' },
        { key: '80-150', label: '¥80-150' },
        { key: '150-9999', label: '¥150 以上' },
      ] : [],
    };
  }

  getRecommendedGoods(productId, categoryId, limit = 4) {
    const parsedId = Number(productId);
    const publicProducts = this.getPublicGoodList().filter((product) => product.id !== parsedId);
    const sameCategory = publicProducts.filter((product) => product.categoryId === categoryId);
    const others = publicProducts.filter((product) => product.categoryId !== categoryId);
    return [...sameCategory, ...others].slice(0, limit).map((product) => cloneValue(product));
  }

  getFeaturedShops(limit = 3) {
    return this.shops
      .filter((shop) => shop.featured)
      .slice(0, limit)
      .map((shop) => ({ ...cloneValue(shop), products: this.getGoodsByShopId(shop.id).slice(0, 3) }));
  }

  getShopById(shopId) {
    const shop = this.shops.find((item) => item.id === shopId);
    return shop ? cloneValue(shop) : null;
  }

  getGoodsByShopId(shopId) {
    return this.getPublicGoodList().filter((product) => product.shopId === shopId);
  }

  getGoodById(id) {
    const parsedId = Number(id);
    const product = this.products.find((item) => item.id === parsedId);
    return product ? cloneValue(product) : null;
  }

  getCategoryList() {
    return this.categories
      .filter(hasCategoryId)
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
    const lowStockCount = this.products.filter((product) => product.stock > 0 && product.stock < LOW_STOCK_WARNING_THRESHOLD).length;

    return {
      total: this.products.length,
      onSaleCount,
      offSaleCount,
      deletedCount,
      lowStockCount,
      categoryCount: this.categories.length,
    };
  }

  buildProductSnapshot(product) {
    return buildProductSnapshot(product);
  }

  reload() {
    this._loadData();
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
    this.notify();
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
    this.notify();
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
    this.notify();
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
    this.notify();
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
    this.notify();
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
    this.notify();
    return cloneValue(category);
  }

  deleteCategory(id) {
    const usedByProducts = this.products.some((product) => product.categoryId === id && product.status !== 'deleted');

    if (usedByProducts) {
      return { success: false, message: '该分类下仍有商品，无法删除。' };
    }

    this.categories = this.categories.filter((item) => item.id !== id);
    this._saveCategories();
    this.notify();
    return { success: true };
  }

  _nextProductId() {
    return this.products.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  _normalizeProduct(input) {
    const category = this.categories.find((item) => item.id === input.categoryId) || this.categories[0];
    const defaultDetail = defaultProductDetailById[Number(input.id)] || {};
    const sourceImages = Array.isArray(input.images) && input.images.length ? input.images : defaultDetail.images;
    const images = normalizeImageList(sourceImages, input.cover || input.img || '/favicon.svg');
    const cover = normalizeText(input.cover || input.img || images[0] || '/favicon.svg');
    const legacyPrice = normalizeMoney(input.price);
    const nextCurrentPrice = normalizeMoney(input.currentPrice ?? legacyPrice);
    const nextOriginalPrice = Math.max(normalizeMoney(input.originalPrice ?? legacyPrice), nextCurrentPrice);
    const saleTag = normalizeText(input.saleTag);
    const qaItems = normalizePlainList(input.qaItems);
    const reviews = normalizePlainList(input.reviews);
    const normalizedProduct = {
      id: Number(input.id),
      name: normalizeText(input.name),
      price: nextCurrentPrice,
      originalPrice: nextOriginalPrice,
      currentPrice: nextCurrentPrice,
      saleTag,
      categoryId: input.categoryId || category?.id || '',
      categoryName: category?.name || '',
      shopId: normalizeText(input.shopId) || shopIdByProductId[Number(input.id)] || '',
      cover,
      img: cover,
      images,
      detailImage: input.detailImage || defaultDetail.detailImage,
      media: normalizeMediaList(input.media, images, cover),
      specGroups: normalizeSpecGroups(input.specGroups),
      variants: normalizeVariants(input.variants),
      services: normalizeServices(input.services),
      promotionInfo: normalizePromotionInfo(input.promotionInfo),
      detailSections: normalizePlainList(input.detailSections),
      qaItems: qaItems.length ? qaItems : normalizePlainList(defaultDetail.qaItems),
      reviews: reviews.length ? reviews : normalizePlainList(defaultDetail.reviews),
      shopBadges: normalizePlainList(input.shopBadges).map(normalizeText).filter(Boolean),
      description: normalizeText(input.description),
      status: input.status || 'off-sale',
      stock: normalizeStock(input.stock, input.status || 'off-sale'),
      sales: normalizeSales(input.sales, input.id),
      createdAt: input.createdAt || new Date().toLocaleString(),
      updatedAt: input.updatedAt || new Date().toLocaleString(),
    };

    const priceInfo = getProductPriceInfo(normalizedProduct);

    return {
      ...normalizedProduct,
      price: priceInfo.currentPrice,
      originalPrice: priceInfo.originalPrice,
      currentPrice: priceInfo.currentPrice,
      saleTag: priceInfo.saleTag,
    };
  }

  _saveProducts() {
    saveToStorage(PRODUCT_KEY, this.products);
  }

  _saveCategories() {
    saveToStorage(CATEGORY_KEY, this.categories);
  }

  _normalizeShop(input) {
    const cover = normalizeText(input.cover || '/favicon.svg');
    return {
      ...cloneValue(input),
      cover,
      images: normalizeImageList(input.images, cover),
    };
  }

  _loadData() {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    const isCacheValid = storedVersion === CURRENT_CACHE_VERSION;
    
    if (!isCacheValid) {
      localStorage.removeItem(PRODUCT_KEY);
      localStorage.removeItem(CATEGORY_KEY);
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
    }

    const hasCategoryStorage = hasStoredValue(CATEGORY_KEY);
    const hasProductStorage = hasStoredValue(PRODUCT_KEY);

    this.shops = defaultShops.map((shop) => this._normalizeShop(shop));

    const legacyCategories = hasCategoryStorage ? [] : loadFromStorage([CATEGORY_KEY], defaultCategories);
    const categorySource = hasCategoryStorage
      ? loadFromStorage([CATEGORY_KEY], [])
      : legacyCategories.length
        ? legacyCategories
        : defaultCategories;

    this.categories = categorySource
      .filter(hasCategoryId)
      .map((category, index) => normalizeCategory(category, index + 1))
      .sort((a, b) => a.sort - b.sort);

    const legacyProducts = hasProductStorage ? [] : loadFromStorage(['goodList'], []);
    const productSource = hasProductStorage
      ? loadFromStorage([PRODUCT_KEY], [])
      : legacyProducts.length
        ? legacyProducts
        : defaultProducts;
    const mergedProductSource = mergeMissingDefaultProducts(productSource);

    this.products = mergedProductSource.map((product) => {
      const productId = Number(product.id);
      const defaultCover = defaultProductCoverById[productId];
      const defaultDetail = defaultProductDetailById[productId] || {};
      const storedImages = Array.isArray(product.images) && product.images.length >= 3
        ? product.images
        : defaultDetail.images;
      const storedDetailImage = product.detailImage || defaultDetail.detailImage;
      return this._normalizeProduct({
        description: '',
        status: 'on-sale',
        ...defaultDetail,
        ...product,
        images: storedImages,
        detailImage: storedDetailImage,
        cover: defaultCover || product.cover || product.img,
      });
    });

    this._saveCategories();
    this._saveProducts();
    this.notify();
  }
}

const goodService = new GoodService();
export default goodService;
