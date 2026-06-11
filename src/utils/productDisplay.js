const PRODUCT_TONES = [
  'pm-pixel-product-pink',
  'pm-pixel-product-cream',
  'pm-pixel-product-gold',
];

const normalizePriceValue = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
};

export const getProductTone = (productId) => {
  const parsedId = Number(productId) || 0;
  return PRODUCT_TONES[parsedId % PRODUCT_TONES.length];
};

export const getProductPriceInfo = (product) => {
  const source = product ?? {};
  const currentPrice = normalizePriceValue(source.currentPrice ?? source.price);
  const originalCandidate = normalizePriceValue(source.originalPrice);
  const originalPrice = originalCandidate >= currentPrice ? originalCandidate : currentPrice;
  const saleTag = String(source.saleTag ?? '').trim();

  return {
    price: currentPrice,
    currentPrice,
    originalPrice,
    saleTag,
    hasDiscount: originalPrice > currentPrice,
  };
};

export const getEffectivePrice = (product) => getProductPriceInfo(product).currentPrice;

export const resolveProductImageSrc = (cover) => {
  const source = String(cover ?? '').trim();
  if (!source) {
    return '';
  }
  if (/^(https?:|data:|blob:)/.test(source)) {
    return source;
  }
  if (source.startsWith('/public/images/product/')) {
    return source.replace('/public', '');
  }
  if (source.startsWith('public/images/product/')) {
    return `/${source.slice('public/'.length)}`;
  }
  if (source.startsWith('/images/product/')) {
    return source;
  }
  if (source.startsWith('images/product/')) {
    return `/${source}`;
  }
  const filename = source.split('/').pop();
  return filename ? `/images/product/${filename}` : source;
};

export const resolveProductImageList = (images, cover, fallback = '/favicon.svg') => {
  const sourceImages = Array.isArray(images) ? images : images ? [images] : [];
  const resolvedImages = [...sourceImages, cover]
    .map(resolveProductImageSrc)
    .filter(Boolean);
  const uniqueImages = Array.from(new Set(resolvedImages));

  return uniqueImages.length ? uniqueImages : [resolveProductImageSrc(fallback)].filter(Boolean);
};

export const isLowStockProduct = (product) => {
  const source = product ?? {};
  const stock = Number(source.stock);
  return source.status === 'on-sale' && stock > 0 && stock < 5;
};

export const buildProductSnapshot = (product = {}) => {
  const priceInfo = getProductPriceInfo(product);
  const cover = String(product.cover ?? product.img ?? '').trim();

  return {
    id: Number(product.id) || 0,
    name: String(product.name ?? '').trim(),
    price: priceInfo.currentPrice,
    originalPrice: priceInfo.originalPrice,
    currentPrice: priceInfo.currentPrice,
    saleTag: priceInfo.saleTag,
    cover,
    images: resolveProductImageList(product.images, cover),
    categoryName: String(product.categoryName ?? '').trim(),
    status: String(product.status ?? '').trim(),
    sales: Number(product.sales) || 0,
  };
};

export const formatPrice = (value) => {
  const amount = Number(value) || 0;
  return `¥${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
};
