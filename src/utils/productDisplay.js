const PRODUCT_TONES = [
  'pm-pixel-product-pink',
  'pm-pixel-product-cream',
  'pm-pixel-product-gold',
];

export const getProductTone = (productId) => {
  const parsedId = Number(productId) || 0;
  return PRODUCT_TONES[parsedId % PRODUCT_TONES.length];
};

export const formatPrice = (value) => {
  const amount = Number(value) || 0;
  return `¥${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
};
