import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ImageCarousel from '../components/h5/ImageCarousel';
import ProductCard from '../components/h5/ProductCard';
import { useServices, useServiceVersion } from '../hooks/useServices';
import { formatPrice, getProductPriceInfo, getProductTone, isLowStockProduct, resolveProductImageList, resolveProductImageSrc } from '../utils/productDisplay';
import { showPixelToast } from '../utils/pixelToast';

const defaultServices = [
  { key: 'authentic', label: '正品保障', summary: '官方质检', detail: '商品由 Pixel Mall 店铺发出，出库前完成基础质检。' },
  { key: 'freight', label: '运费险', summary: '退换安心', detail: '符合条件的订单支持退换运费保障，具体以平台规则为准。' },
  { key: 'return7', label: '7天无理由退换', summary: '未使用可退换', detail: '签收 7 天内，包装完整且不影响二次销售时可申请退换。' },
];

const adminFixedSpecIds = new Set(['presale', 'delivery', 'ship', 'batch', 'fulfillment']);

const buildFallbackSpecGroups = (product) => {
  if (!product) return [];
  if (Array.isArray(product.specGroups) && product.specGroups.length) return product.specGroups;
  return [
    {
      id: 'style',
      name: '款式',
      options: [{ id: 'default', label: product.categoryName || '默认款' }],
    },
  ];
};

const buildSelectableSpecGroups = (product) => buildFallbackSpecGroups(product)
  .filter((group) => !adminFixedSpecIds.has(group.id));

const getDefaultSpecs = (product) => {
  const defaults = {};
  const selectableGroups = buildSelectableSpecGroups(product);
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const availableVariant = variants.find((variant) => Number(variant.stock) > 0) || variants[0];

  selectableGroups.forEach((group) => {
    const firstOption = group.options?.[0];
    const variantOptionId = availableVariant?.specs?.[group.id];
    const variantOptionExists = group.options?.some((option) => option.id === variantOptionId);

    if (variantOptionExists) {
      defaults[group.id] = variantOptionId;
    } else if (firstOption && group.options.length === 1) {
      defaults[group.id] = firstOption.id;
    }
  });

  return defaults;
};

const findVariant = (product, selectedSpecs, selectableSpecGroups) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (!variants.length) return null;

  if (!selectableSpecGroups.length) {
    return variants.find((variant) => Number(variant.stock) > 0) || variants[0];
  }

  return variants.find((variant) => selectableSpecGroups.every((group) => {
    const variantSpec = variant.specs?.[group.id];
    return variantSpec === undefined || selectedSpecs[group.id] === variantSpec;
  })) || null;
};

const getSpecText = (specGroups, selectedSpecs) => specGroups
  .map((group) => {
    const option = group.options?.find((item) => item.id === selectedSpecs[group.id]);
    return option?.label || '';
  })
  .filter(Boolean)
  .join(' / ');

const getReviewSummary = (reviews) => ({
  showCount: reviews.filter((review) => Array.isArray(review.media) && review.media.length).length,
  followCount: reviews.filter((review) => review.followUp?.content).length,
  negativeCount: reviews.filter((review) => review.isNegative || Number(review.rating) <= 2).length,
});

const savePendingOrderState = (goodId, orderState) => {
  try {
    window.sessionStorage.setItem(`pm-pending-order-${goodId}`, JSON.stringify(orderState));
  } catch {
    return;
  }
};

const DetailPage = () => {
  const { goodId } = useParams();
  const navigate = useNavigate();
  const { good, user, favorite, footprint, api } = useServices();
  const goodRevision = useServiceVersion(good);
  const favoriteRevision = useServiceVersion(favorite);
  const [product, setProduct] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [failedImageSrc, setFailedImageSrc] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedSpecs, setSelectedSpecs] = useState({});
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState('cart');
  const [submittingAction, setSubmittingAction] = useState('');
  const [actionPulse, setActionPulse] = useState('');
  const [pageCartBurstVisible, setPageCartBurstVisible] = useState(false);

  useEffect(() => {
    if (!actionPulse) return undefined;
    const timer = window.setTimeout(() => setActionPulse(''), 900);
    return () => window.clearTimeout(timer);
  }, [actionPulse]);

  useEffect(() => {
    if (!pageCartBurstVisible) return undefined;
    const timer = window.setTimeout(() => setPageCartBurstVisible(false), 820);
    return () => window.clearTimeout(timer);
  }, [pageCartBurstVisible]);

  const parsedGoodId = Number(goodId);
  const currentUser = user.getCurrentUser();
  const currentUserId = currentUser?.id;
  const priceInfo = getProductPriceInfo(product);
  const selectableSpecGroups = useMemo(() => buildSelectableSpecGroups(product), [product]);
  const requiredSpecIds = selectableSpecGroups.map((group) => group.id);
  const hasSpecs = requiredSpecIds.length > 0;
  const specsCompleted = !hasSpecs || requiredSpecIds.every((id) => selectedSpecs[id]);
  const selectedVariant = useMemo(
    () => (specsCompleted ? findVariant(product, selectedSpecs, selectableSpecGroups) : null),
    [product, selectableSpecGroups, selectedSpecs, specsCompleted],
  );
  const hasVariants = Array.isArray(product?.variants) && product.variants.length > 0;
  const missingVariant = hasVariants && specsCompleted && !selectedVariant;
  const variantPrice = selectedVariant ? getProductPriceInfo(selectedVariant) : null;
  const displayPriceInfo = variantPrice || priceInfo;
  const productImages = resolveProductImageList(product?.images, product?.cover)
    .filter((image) => image !== '/favicon.svg')
    .slice(0, 3);
  const imageSrc = resolveProductImageSrc(productImages[0] || product?.cover);
  const shouldShowImage = imageSrc && failedImageSrc !== imageSrc;
  const specText = getSpecText(selectableSpecGroups, selectedSpecs);
  const variantStock = missingVariant ? 0 : selectedVariant ? Number(selectedVariant.stock) || 0 : Number(product?.stock) || 0;
  const isSoldOut = !product || product.status !== 'on-sale' || missingVariant || variantStock <= 0;
  const isLowStock = selectedVariant ? variantStock > 0 && variantStock < 6 : isLowStockProduct(product);
  const shop = product?.shopId ? good.getShopById(product.shopId) : null;
  const shopRecommendations = shop ? good.getGoodsByShopId(shop.id).filter((item) => item.id !== product?.id).slice(0, 3) : [];
  const services = Array.isArray(product?.services) && product.services.length ? product.services : defaultServices;
  const promotionInfo = product?.promotionInfo || {};
  const detailSections = Array.isArray(product?.detailSections) && product.detailSections.length
    ? product.detailSections
    : [{ title: '图文介绍', content: product?.description || `${product?.name || '商品'} 采用柔和像素风设计，适合日常搭配与送礼。` }];
  const qaItems = Array.isArray(product?.qaItems) ? product.qaItems : [];
  const qaAnswerCount = qaItems.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
    : '5.0';
  const reviewSummary = getReviewSummary(reviews);
  const heroTags = [displayPriceInfo.saleTag, ...(promotionInfo.tags || []), ...(promotionInfo.coupons || [])]
    .filter(Boolean)
    .slice(0, 3);
  const detailParams = [
    ['品类', product?.categoryName || '像素好物'],
    ['销量', `${Number(product?.sales) || 0} 件`],
    ['库存', `${variantStock} 件`],
    ['发货', selectedVariant?.delivery || promotionInfo.shipping || '48小时内发货'],
  ];
  const headlineBadges = [
    ...(product?.shopBadges || []),
    ...(shop?.tags || []),
  ].filter(Boolean).slice(0, 4);
  const serviceSummary = services.map((service) => service.label).slice(0, 4).join(' · ');
  const recommendationGroups = [
    { key: 'also', title: '大家还买了', products: recommendedProducts.slice(0, 3) },
    { key: 'bundle', title: '搭配推荐', products: (recommendedProducts.length > 3 ? recommendedProducts.slice(3, 6) : recommendedProducts.slice(0, 3)) },
    { key: 'shop', title: '店铺同款', products: shopRecommendations.length ? shopRecommendations : recommendedProducts.slice(0, 3) },
  ].filter((group) => group.products.length);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.products.detail(parsedGoodId),
      api.products.reviews ? api.products.reviews(parsedGoodId) : Promise.resolve([]),
      currentUserId ? api.favorites.isFavorite(currentUserId, parsedGoodId) : Promise.resolve(false),
    ]).then(([nextProduct, nextReviews, nextIsFavorited]) => {
      if (isMounted) {
        setProduct(nextProduct);
        setSelectedSpecs(getDefaultSpecs(nextProduct));
        setReviews(Array.isArray(nextReviews) ? nextReviews : []);
        setIsFavorited(Boolean(nextIsFavorited));
        setLoaded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [api, parsedGoodId, currentUserId, goodRevision, favoriteRevision]);

  useEffect(() => {
    let isMounted = true;

    if (!product) {
      return () => {
        isMounted = false;
      };
    }

    api.products.recommended(product.id, product.categoryId, 9).then((list) => {
      if (isMounted) {
        setRecommendedProducts(Array.isArray(list) ? list : []);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [api, product]);

  useEffect(() => {
    if (currentUser && product && footprint?.recordView) {
      api.footprints.recordView(currentUser.id, product.id);
    }
  }, [api, currentUser, footprint, product]);

  if (!loaded) {
    return (
      <main className="pm-page pm-detail-page">
        <EmptyState title="商品加载中" description="正在加载商品详情。" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="pm-page pm-detail-page">
        <EmptyState
          title="商品不存在"
          description="该商品可能已下架或被删除。"
          action={
            <Link className="pm-btn pm-btn-primary" to="/home">
              回首页
            </Link>
          }
        />
      </main>
    );
  }

  const requireLogin = (nextPath) => {
    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(nextPath)}`);
      return false;
    }
    return true;
  };

  const validateSpecs = () => {
    if (!specsCompleted) {
      showPixelToast('请先选择完整规格');
      return false;
    }

    if (isSoldOut) {
      showPixelToast(product.status !== 'on-sale' ? '商品已下架' : missingVariant ? '当前规格组合不可购买' : '当前规格库存不足');
      return false;
    }

    return true;
  };

  const handleSelectSpec = (groupId, optionId) => {
    setSelectedSpecs((current) => ({ ...current, [groupId]: optionId }));
  };

  const openSpecModal = (action) => {
    setPendingAction(action);
    setSpecModalOpen(true);
  };

  const handleConfirmSpecAction = async () => {
    if (submittingAction) return;
    if (!validateSpecs()) return;

    setSubmittingAction(pendingAction);

    if (pendingAction === 'cart') {
      if (!requireLogin(`/detail/${goodId}`)) {
        setSubmittingAction('');
        return;
      }
      const result = await api.cart.add(currentUser.id, product.id, 1, {
        selectedSpecs,
        variant: selectedVariant,
        variantId: selectedVariant?.id || '',
        specText,
      });
      showPixelToast(result.success ? '已加入购物车，购物车数量已更新' : result.message, {
        tone: result.success ? 'success' : 'warning',
      });
      setActionPulse(result.success ? 'cart' : '');
      if (result.success) {
        setPageCartBurstVisible(false);
        window.requestAnimationFrame(() => {
          setPageCartBurstVisible(true);
        });
      }
      setSpecModalOpen(false);
      setSubmittingAction('');
      return;
    }

    const orderState = {
      selectedSpecs,
      variantId: selectedVariant?.id || '',
      specText,
    };
    savePendingOrderState(goodId, orderState);

    if (!requireLogin(`/createOrder/${goodId}`)) {
      setSubmittingAction('');
      return;
    }
    showPixelToast('正在进入确认订单', { tone: 'success', duration: 1500 });
    setActionPulse('buy');
    setSpecModalOpen(false);
    navigate(`/createOrder/${goodId}`, { state: orderState });
  };

  const handleFavorite = async () => {
    if (!requireLogin(`/detail/${goodId}`)) return;

    const result = await api.favorites.toggle(currentUser.id, product.id);
    setIsFavorited(Boolean(result.favorited));
    showPixelToast(result.message, { tone: result.success ? 'success' : 'warning' });
  };

  const handleContactMerchant = () => {
    if (!requireLogin(`/detail/${goodId}`)) return;

    api.messages.openProductChat(currentUser.id, product).then((chat) => {
      navigate(`/messages/chat/${encodeURIComponent(chat.id)}`);
    });
  };

  const handleShare = async () => {
    const shareText = `${product.name} ${formatPrice(displayPriceInfo.currentPrice)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: shareText, url: window.location.href });
        showPixelToast('已打开系统分享', { tone: 'success' });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
        showPixelToast('已复制商品分享文案', { tone: 'success' });
        return;
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showPixelToast('暂时无法分享，请稍后再试');
      }
      return;
    }

    showPixelToast('请使用浏览器分享功能');
  };

  return (
    <main className="pm-page pm-detail-page">
      <nav className="pm-detail-top-nav" aria-label="商品详情导航">
        <button className="pm-icon-btn pm-detail-nav-btn" type="button" aria-label="返回上一页" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4L5 9L10 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 9H15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
        <button className="pm-icon-btn pm-detail-nav-btn" type="button" aria-label="分享商品" onClick={handleShare}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9V15C3 15.5523 3.44772 16 4 16H14C14.5523 16 15 15.5523 15 15V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 5L9 2L6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 2V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </nav>

      <section className="pm-detail-hero" aria-label="商品核心信息">
        <div className="pm-detail-gallery">
          <div className="pm-product-media pm-product-gallery-media">
            <ImageCarousel images={productImages} fallback="/favicon.svg" alt={product.name} toneId={product.id} />
            {heroTags.length ? (
              <div className="pm-detail-activity-tags" aria-label="活动标签">
                {heroTags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            ) : null}
          </div>
          <div className="pm-detail-media-strip" aria-label="商品图片数量">
            {productImages.slice(0, 9).map((image, index) => (
              <span className="pm-detail-media-chip" key={`${image}-${index}`}>图 {index + 1}</span>
            ))}
          </div>
        </div>

        <article className="pm-detail-info">
          <div className="pm-detail-title-row">
            <div>
              <p className="pm-section-eyebrow">Pixel Mall</p>
              <h1 className="pm-detail-title">{product.name}</h1>
              {headlineBadges.length ? (
                <div className="pm-detail-headline-badges">
                  {headlineBadges.map((badge) => <span key={badge}>{badge}</span>)}
                </div>
              ) : null}
            </div>
            {shop ? <span className="pm-detail-shop-level">{product.shopBadges?.[0] || shop.tags?.[0] || '优选店铺'}</span> : null}
          </div>

          <section className="pm-detail-price-panel" aria-label="价格与优惠">
            <div className="pm-detail-price-kicker">
              <span>{displayPriceInfo.saleTag || '今日到手价'}</span>
              <strong>{Number(product?.sales) || 0} 人已下单</strong>
            </div>
            <div className="pm-detail-price-row">
              <strong className="pm-price pm-detail-price">{formatPrice(displayPriceInfo.currentPrice)}</strong>
              <div className="pm-detail-price-side">
                {displayPriceInfo.hasDiscount ? <span className="pm-old-price">{formatPrice(displayPriceInfo.originalPrice)}</span> : null}
                <span className="pm-detail-price-note">{promotionInfo.shipping || '下单后 48 小时内发货'}</span>
              </div>
            </div>
            <div className="pm-detail-promo-list">
              {(promotionInfo.tags || []).map((tag) => <span key={tag}>{tag}</span>)}
              {(promotionInfo.coupons || []).slice(0, 2).map((coupon) => <span key={coupon}>{coupon}</span>)}
            </div>
          </section>

          <p className="pm-detail-desc">{product.description}</p>

          <dl className="pm-detail-param-grid pm-detail-quick-params">
            {detailParams.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <button className="pm-detail-select-entry" type="button" disabled={isSoldOut} onClick={() => openSpecModal('cart')}>
            <span>规格</span>
            <strong>{specText || (hasSpecs ? '请选择颜色、尺寸或套餐' : '默认规格')}</strong>
            <em>{isLowStock ? `仅剩 ${variantStock} 件` : '选择'}</em>
          </button>

          <Link className="pm-detail-review-entry" to={`/detail/${product.id}/reviews`}>
            <span>用户评价</span>
            <strong>{averageRating} 分 · {reviews.length} 条</strong>
            <em>买家秀 {reviewSummary.showCount} · 追评 {reviewSummary.followCount} · 差评 {reviewSummary.negativeCount}</em>
          </Link>

          <section className="pm-detail-service-entry" aria-label="服务保障">
            <button type="button" onClick={() => setServiceModalOpen(true)}>
              <span>服务保障</span>
              <strong>{serviceSummary}</strong>
              <em>查看</em>
            </button>
          </section>

          <div className="pm-detail-actions">
            <Button
              type="button"
              variant="primary"
              className={`pm-detail-cart-btn${actionPulse === 'cart' ? ' is-action-success' : ''}`}
              disabled={isSoldOut || submittingAction === 'cart'}
              onClick={() => openSpecModal('cart')}
            >
              <span className="pm-detail-cart-btn-label">
                {submittingAction === 'cart' ? '加入中...' : actionPulse === 'cart' ? '已加入' : '加入购物车'}
              </span>
            </Button>
            <Button
              type="button"
              variant="accent"
              className={actionPulse === 'buy' ? 'is-action-success' : ''}
              disabled={isSoldOut || submittingAction === 'buy'}
              onClick={() => openSpecModal('buy')}
            >
              {submittingAction === 'buy' ? '处理中...' : actionPulse === 'buy' ? '去确认订单' : '立即购买'}
            </Button>
            <Button type="button" variant="ghost" onClick={handleFavorite}>
              {isFavorited ? '取消收藏' : '收藏商品'}
            </Button>
            <Button type="button" variant="ghost" onClick={handleContactMerchant}>
              联系商家
            </Button>
          </div>
        </article>
      </section>

      <section className="pm-detail-long pm-detail-flow-panel" aria-label="商品图文详情">
        <article className="pm-detail-section-card pm-detail-flow-block pm-detail-story-card">
          <div className="pm-detail-story-media">
            {shouldShowImage ? (
              <img src={imageSrc} alt="" onError={() => setFailedImageSrc(imageSrc)} />
            ) : (
              <div className={`pm-pixel-product ${getProductTone(product.id)}`} />
            )}
          </div>
            <div className="pm-detail-story-copy">
              <p className="pm-section-eyebrow">Details</p>
              <h2>商品亮点</h2>
              {detailSections.map((section) => (
                <section className="pm-detail-copy-section" key={section.title}>
                  <h3>{section.title}</h3>
                {Array.isArray(section.items) ? (
                  <dl className="pm-detail-param-grid">
                    {section.items.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : <p>{section.content}</p>}
              </section>
            ))}
          </div>
        </article>

        {product?.detailImage ? (
          <article className="pm-detail-section-card pm-detail-flow-block pm-detail-info-card">
            <p className="pm-section-eyebrow">Info</p>
            <h2>图文介绍</h2>
            <div className="pm-detail-info-image">
              <img src={product.detailImage} alt={`${product.name} 图文介绍`} />
            </div>
          </article>
        ) : null}

        {qaItems.length ? (
          <Link className="pm-detail-qa-card pm-detail-qa-entry" to={`/detail/${product.id}/qa`}>
            <div className="pm-detail-section-headline">
              <div>
                <p className="pm-section-eyebrow">Q&A</p>
                <h2>问大家</h2>
              </div>
              <span>{qaItems.length} 问 · {qaAnswerCount} 人参与</span>
            </div>
            <div className="pm-detail-qa-preview">
              <strong>问：{qaItems[0].question}</strong>
              <span>答：{qaItems[0].answer}</span>
            </div>
            <em>查看全部回答</em>
          </Link>
        ) : null}

        <article className="pm-detail-section-card pm-detail-flow-block">
          <p className="pm-section-eyebrow">Notice</p>
          <h2>购买须知</h2>
          <ul className="pm-detail-note-list">
            <li>不同屏幕显示可能存在轻微色差，请以实物为准。</li>
            <li>手工测量尺寸可能有少量误差，不影响日常使用。</li>
            <li>售后问题可通过商品页“联系商家”进入客服聊天页查看记录。</li>
          </ul>
        </article>
      </section>

      {recommendationGroups.length ? (
        <section className="pm-detail-recommend-section" aria-label="关联推荐">
          {recommendationGroups.map((group) => (
            <article className="pm-detail-recommend-block" key={group.key}>
              <div>
                <p className="pm-section-eyebrow">Similar Picks</p>
                <h2>{group.title}</h2>
              </div>
              <div className="pm-detail-recommend-grid">
                {group.products.map((recommendedProduct, index) => (
                  <ProductCard key={`${group.key}-${recommendedProduct.id}`} product={recommendedProduct} index={index} showSticker={false} />
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <footer className="pm-detail-bottom-bar" aria-label="购买操作栏">
        {pageCartBurstVisible ? (
          <span className="pm-detail-page-cart-burst pm-detail-page-cart-burst-near-cart" aria-hidden>
            +1
          </span>
        ) : null}
        <div className="pm-detail-bottom-shortcuts" aria-label="快捷入口">
          {shop ? (
            <Link className="pm-detail-shortcut" to={`/shop/${shop.id}`} aria-label={`进入${shop.name}`}>
              <span className="pm-detail-shortcut-icon pm-detail-shortcut-icon-shop" aria-hidden />
              <span className="pm-detail-shortcut-label">店铺</span>
            </Link>
          ) : null}
          <button className="pm-detail-shortcut" type="button" onClick={handleContactMerchant} aria-label="联系商家客服">
            <span className="pm-detail-shortcut-icon pm-detail-shortcut-icon-service" aria-hidden />
            <span className="pm-detail-shortcut-label">客服</span>
          </button>
          <button className="pm-detail-shortcut" type="button" onClick={handleFavorite} aria-label={isFavorited ? '取消收藏商品' : '收藏商品'}>
            <span className={`pm-detail-shortcut-icon pm-detail-shortcut-icon-favorite${isFavorited ? ' is-active' : ''}`} aria-hidden>
              ★
            </span>
            <span className="pm-detail-shortcut-label">收藏</span>
          </button>
        </div>
        <Button
          type="button"
          variant="primary"
          className={`pm-detail-cart-btn${actionPulse === 'cart' ? ' is-action-success' : ''}`}
          disabled={isSoldOut || submittingAction === 'cart'}
          onClick={() => openSpecModal('cart')}
        >
          <span className="pm-detail-cart-btn-label">
            {submittingAction === 'cart' ? '加入中...' : actionPulse === 'cart' ? '已加入' : '加入购物车'}
          </span>
        </Button>
        <Button
          type="button"
          variant="accent"
          className={actionPulse === 'buy' ? 'is-action-success' : ''}
          disabled={isSoldOut || submittingAction === 'buy'}
          onClick={() => openSpecModal('buy')}
        >
          {submittingAction === 'buy' ? '处理中...' : '立即购买'}
        </Button>
      </footer>

      <Modal
        cancelText="取消"
        confirmClassName={submittingAction ? 'is-action-loading' : ''}
        confirmDisabled={Boolean(submittingAction)}
        confirmText={submittingAction ? (pendingAction === 'cart' ? '正在加入...' : '正在处理...') : pendingAction === 'cart' ? '加入购物车' : '立即购买'}
        confirmVariant={pendingAction === 'cart' ? 'primary' : 'accent'}
        onClose={() => setSpecModalOpen(false)}
        onConfirm={handleConfirmSpecAction}
        open={specModalOpen}
        title="选择商品规格"
      >
        <div className="pm-detail-spec-modal">
          <div className="pm-detail-spec-product">
            <strong>{product.name}</strong>
            <span>{formatPrice(displayPriceInfo.currentPrice)}</span>
            <em className={isLowStock ? 'is-warning' : ''}>{isLowStock ? `仅剩 ${variantStock} 件` : `库存 ${variantStock} 件`}</em>
          </div>
          {selectableSpecGroups.length ? selectableSpecGroups.map((group) => (
            <div className="pm-spec-group" key={group.id}>
              <span className="pm-label">{group.name}</span>
              <div className="pm-spec-options">
                {group.options.map((option) => {
                  const active = selectedSpecs[group.id] === option.id;
                  return (
                    <button
                      className={`pm-spec-chip${active ? ' is-active' : ''}`}
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectSpec(group.id, option.id)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )) : <p className="pm-help">该商品使用默认规格。</p>}
          <p className="pm-help pm-detail-spec-summary">
            {specText ? `已选：${specText}` : hasSpecs ? '请选择完整规格' : '已选：默认规格'}
            {selectedVariant?.delivery ? `，${selectedVariant.delivery}` : ''}
          </p>
        </div>
      </Modal>

      <Modal
        cancelText=""
        confirmText=""
        onClose={() => setServiceModalOpen(false)}
        onConfirm={() => setServiceModalOpen(false)}
        open={serviceModalOpen}
        title="服务保障"
      >
        <div className="pm-detail-service-modal">
          {services.map((service) => (
            <article key={service.key}>
              <strong>{service.label}</strong>
              <span>{service.summary}</span>
              <p>{service.detail}</p>
            </article>
          ))}
        </div>
      </Modal>
    </main>
  );
};

export default DetailPage;
