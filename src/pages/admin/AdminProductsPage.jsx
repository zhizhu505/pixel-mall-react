import { useContext, useEffect, useState } from 'react';
import PermissionGate from '../../components/admin/PermissionGate';
import ProductForm from '../../components/admin/ProductForm';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import StatusTag from '../../components/common/StatusTag';
import Pagination from '../../components/h5/Pagination';
import { ServiceContext } from '../../contexts/ServiceContext';
import { useServiceSnapshot } from '../../hooks/useServices';
import { usePagination } from '../../hooks/usePagination';
import { formatPrice, getProductPriceInfo } from '../../utils/productDisplay';

const DEFAULT_PRODUCT_COVER = '/favicon.svg';

const splitLines = (value) => String(value || '')
  .split(/\r?\n/)
  .map((item) => item.trim())
  .filter(Boolean);

const formatServicesText = (services = []) => (Array.isArray(services) ? services : [])
  .map((service) => [service.label, service.summary, service.detail].filter(Boolean).join('｜'))
  .filter(Boolean)
  .join('\n');

const parseServicesText = (value) => {
  const lines = splitLines(value);
  return lines.map((line, index) => {
    const [label = '', summary = '', detail = ''] = line.split('｜').map((item) => item.trim());
    const normalizedLabel = label || `服务 ${index + 1}`;
    return {
      key: `service-${index + 1}`,
      label: normalizedLabel,
      summary: summary || normalizedLabel,
      detail: detail || summary || normalizedLabel,
    };
  });
};

const formatSpecGroupsText = (groups = []) => (Array.isArray(groups) ? groups : [])
  .map((group) => {
    const options = Array.isArray(group.options) ? group.options.map((option) => option.label || option.name).filter(Boolean).join(' / ') : '';
    return [group.name, options].filter(Boolean).join('：');
  })
  .filter(Boolean)
  .join('\n');

const slugifySpec = (value, fallback) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
};

const parseSpecGroupsText = (value) => splitLines(value)
  .map((line, index) => {
    const [name = '', optionsText = ''] = line.split('：');
    const options = optionsText.split('/').map((item) => item.trim()).filter(Boolean);
    const normalizedName = name.trim() || `规格 ${index + 1}`;
    return {
      id: slugifySpec(normalizedName, `spec-${index + 1}`),
      name: normalizedName,
      options: options.map((option, optionIndex) => ({
        id: slugifySpec(option, `option-${index + 1}-${optionIndex + 1}`),
        label: option,
      })),
    };
  })
  .filter((group) => group.options.length);

const formatVariantsText = (variants = []) => (Array.isArray(variants) ? variants : [])
  .map((variant) => {
    const specText = Object.values(variant.specs || {}).filter(Boolean).join('/');
    const parts = [specText || variant.id, `库存 ${variant.stock ?? 0}`];
    if (variant.price !== undefined) parts.push(`现价 ${variant.price}`);
    if (variant.originalPrice !== undefined) parts.push(`原价 ${variant.originalPrice}`);
    if (variant.delivery) parts.push(`发货 ${variant.delivery}`);
    return parts.join('｜');
  })
  .filter(Boolean)
  .join('\n');

const parseVariantsText = (value, fallbackPrice, fallbackOriginalPrice, fallbackStock, specGroups) => {
  const lines = splitLines(value);
  if (!lines.length) {
    const firstSpecGroup = specGroups[0];
    const firstOption = firstSpecGroup?.options?.[0];
    return [{
      id: 'variant-default',
      specs: firstSpecGroup && firstOption ? { [firstSpecGroup.id]: firstOption.id } : {},
      stock: fallbackStock,
      price: fallbackPrice,
      originalPrice: fallbackOriginalPrice,
      delivery: '',
    }];
  }

  return lines.map((line, index) => {
    const [specText = '', stockText = '', priceText = '', originalPriceText = '', deliveryText = ''] = line.split('｜').map((item) => item.trim());
    const selectedOptions = specText.split('/').map((item) => item.trim()).filter(Boolean);
    const specs = {};
    specGroups.forEach((group, groupIndex) => {
      const selectedLabel = selectedOptions[groupIndex];
      const matchedOption = group.options.find((option) => option.label === selectedLabel) || group.options[groupIndex === 0 ? 0 : 0];
      if (matchedOption) {
        specs[group.id] = matchedOption.id;
      }
    });
    const parseNumber = (text, prefix, fallback) => {
      const amount = Number(String(text || '').replace(prefix, '').trim());
      return Number.isFinite(amount) ? amount : fallback;
    };

    return {
      id: `variant-${index + 1}`,
      specs,
      stock: parseNumber(stockText, '库存', fallbackStock),
      price: parseNumber(priceText, '现价', fallbackPrice),
      originalPrice: parseNumber(originalPriceText, '原价', fallbackOriginalPrice),
      delivery: String(deliveryText || '').replace('发货', '').trim(),
    };
  });
};

const formatDetailSectionsText = (sections = []) => (Array.isArray(sections) ? sections : [])
  .map((section) => [section.title, section.content].filter(Boolean).join('｜'))
  .filter(Boolean)
  .join('\n');

const parseDetailSectionsText = (value, fallbackDescription) => {
  const lines = splitLines(value);
  if (!lines.length) {
    return [{ title: '商品亮点', content: fallbackDescription }];
  }

  return lines.map((line, index) => {
    const [title = '', content = ''] = line.split('｜').map((item) => item.trim());
    return {
      title: title || `亮点 ${index + 1}`,
      content: content || title || fallbackDescription,
    };
  });
};

const formatQaText = (items = []) => (Array.isArray(items) ? items : [])
  .map((item) => [item.question, item.answer].filter(Boolean).join('｜'))
  .filter(Boolean)
  .join('\n');

const parseQaText = (value) => splitLines(value).map((line, index) => {
  const [question = '', answer = ''] = line.split('｜').map((item) => item.trim());
  return {
    id: `qa-${index + 1}`,
    question: question || `常见问题 ${index + 1}`,
    answer: answer || '欢迎咨询客服获取更多信息',
    count: 1,
  };
});

const createInitialForm = (categories) => ({
  id: null,
  name: '',
  originalPrice: 0,
  currentPrice: 0,
  saleTag: '',
  categoryId: categories[0]?.id || '',
  stock: 0,
  shippingText: '',
  promoTagsText: '',
  couponText: '',
  servicesText: '',
  specGroupsText: '',
  variantsText: '',
  detailSectionsText: '',
  qaItemsText: '',
  shopBadgesText: '',
  description: '',
  status: 'on-sale',
});

const AdminProductsPage = () => {
  const { admin, good, api } = useContext(ServiceContext);
  const categories = useServiceSnapshot(good, (service) => service.getCategoryList());
  const [filters, setFilters] = useState({ keyword: '', categoryId: 'all', status: 'all' });
  const [form, setForm] = useState(createInitialForm(categories));
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [viewingProductId, setViewingProductId] = useState(null);
  const [message, setMessage] = useState('');
  const [formMode, setFormMode] = useState('edit');

  const canManage = useServiceSnapshot(admin, (service) => service.hasPermission('products:manage'));
  const canEditDiscount = useServiceSnapshot(admin, (service) => service.hasPermission('products:discount'));
  const products = useServiceSnapshot(good, (service) => service.getGoodList(filters));
  const viewingProduct = useServiceSnapshot(good, (service) => (
    viewingProductId ? service.getGoodById(viewingProductId) : null
  ));
  const {
    page,
    setPage,
    totalPages,
    total,
    slice: pagedProducts,
    hasPrev,
    hasNext,
  } = usePagination(products, 10);

  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormMode('edit');
    setForm(createInitialForm(categories));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormMode('edit');
    setForm(createInitialForm(categories));
    setIsFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const originalPrice = Math.max(0, Number(form.originalPrice) || 0);
    const currentInput = Number(form.currentPrice);
    const currentPrice = Math.max(0, Number.isFinite(currentInput) ? currentInput : originalPrice);

    if (canEditDiscount && currentPrice > originalPrice) {
      setMessage('现价不能高于原价。');
      return;
    }

    const specGroups = parseSpecGroupsText(form.specGroupsText);
    const variants = parseVariantsText(form.variantsText, currentPrice, originalPrice, Math.max(0, Number(form.stock) || 0), specGroups);
    const services = parseServicesText(form.servicesText);
    const detailSections = parseDetailSectionsText(form.detailSectionsText, form.description.trim());
    const qaItems = parseQaText(form.qaItemsText);
    const promotionInfo = {
      shipping: form.shippingText.trim(),
      tags: splitLines(form.promoTagsText),
      coupons: splitLines(form.couponText),
    };
    const shopBadges = splitLines(form.shopBadgesText);
    const cover = editingId ? (products.find((item) => item.id === editingId)?.cover || DEFAULT_PRODUCT_COVER) : DEFAULT_PRODUCT_COVER;
    const images = editingId ? (products.find((item) => item.id === editingId)?.images || [cover]) : [cover];
    const media = images.map((src, index) => ({
      type: 'image',
      src,
      cover: src,
      title: `商品图片 ${index + 1}`,
      duration: '',
    }));

    const payload = {
      ...form,
      cover,
      images,
      media,
      specGroups,
      variants,
      services,
      promotionInfo,
      detailSections,
      qaItems,
      shopBadges,
      originalPrice: canEditDiscount ? originalPrice : currentPrice,
      currentPrice,
      price: currentPrice,
      saleTag: canEditDiscount ? form.saleTag.trim() : '',
    };

    if (editingId) {
      await api.products.update({ ...payload, id: editingId });
      setMessage(formMode === 'discount' ? '商品折扣已更新。' : '商品已更新。');
    } else {
      await api.products.create(payload);
      setMessage('商品已新增。');
    }

    closeForm();
  };

  const openProductForm = (product, mode = 'edit') => {
    if ((mode === 'discount' && !canEditDiscount) || (mode !== 'discount' && !canManage)) {
      return;
    }

    setEditingId(product?.id ?? null);
    setFormMode(mode);

    if (!product) {
      setForm(createInitialForm(categories));
      setIsFormOpen(true);
      return;
    }

    const priceInfo = getProductPriceInfo(product);
    setForm({
      id: product.id,
      name: product.name,
      originalPrice: priceInfo.originalPrice,
      currentPrice: priceInfo.currentPrice,
      saleTag: priceInfo.saleTag,
      categoryId: product.categoryId,
      stock: product.stock,
      shippingText: product.promotionInfo?.shipping || '',
      promoTagsText: (product.promotionInfo?.tags || []).join('\n'),
      couponText: (product.promotionInfo?.coupons || []).join('\n'),
      servicesText: formatServicesText(product.services || []),
      specGroupsText: formatSpecGroupsText(product.specGroups || []),
      variantsText: formatVariantsText(product.variants || []),
      detailSectionsText: formatDetailSectionsText(product.detailSections || []),
      qaItemsText: formatQaText(product.qaItems || []),
      shopBadgesText: (product.shopBadges || []).join('\n'),
      description: product.description,
      status: product.status,
    });
    setIsFormOpen(true);
  };

  const handleEdit = (product) => {
    openProductForm(product, 'edit');
  };

  const handleDiscount = (product) => {
    openProductForm(product, 'discount');
  };

  const handleDelete = async () => {
    if (!deletingProduct || !canManage) {
      setDeletingProduct(null);
      return;
    }

    await api.products.remove(deletingProduct.id);
    setMessage('商品已删除。');
    setDeletingProduct(null);
    if (editingId === deletingProduct.id) {
      closeForm();
    }
  };

  const handleToggleStatus = async (productId) => {
    if (!canManage) {
      return;
    }

    const updatedProduct = await api.products.toggleStatus(productId);
    if (!updatedProduct) {
      setMessage('已删除商品不能调整上下架状态。');
      return;
    }

    setMessage(`商品状态已切换为${updatedProduct.status === 'on-sale' ? '上架中' : '已下架'}。`);
    if (editingId === productId) {
      handleEdit(updatedProduct);
    }
  };

  const handleRefresh = async () => {
    await api.products.reload();
    setMessage('商品数据已刷新。');
  };

  return (
    <div className="pm-admin-products-page">
      <section className="pm-admin-page-header">
        <div>
          <h2 className="pm-section-title">商品管理</h2>
          <p className="pm-help">支持搜索、筛选、查看、折扣管理、上下架、新增和编辑商品。</p>
        </div>
        <div className="pm-admin-inline-actions">
          <Button type="button" variant="ghost" onClick={handleRefresh}>刷新</Button>
          <PermissionGate permission="products:manage">
            <Button type="button" onClick={openCreateForm}>新增商品</Button>
          </PermissionGate>
        </div>
      </section>

      {message ? <div className="pm-alert">{message}</div> : null}

      <section className="pm-admin-page-filters">
        <label className="pm-control">
          <span className="pm-label">搜索商品</span>
          <input className="pm-input" name="keyword" value={filters.keyword} onChange={handleFilterChange} placeholder="输入商品名或分类" />
        </label>
        <label className="pm-control">
          <span className="pm-label">分类筛选</span>
          <select className="pm-select" name="categoryId" value={filters.categoryId} onChange={handleFilterChange}>
            <option value="all">全部分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="pm-control">
          <span className="pm-label">状态筛选</span>
          <select className="pm-select" name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="all">全部状态</option>
            <option value="on-sale">上架中</option>
            <option value="off-sale">已下架</option>
            <option value="deleted">已删除</option>
          </select>
        </label>
      </section>

      {products.length ? (
        <div className="pm-admin-table-panel">
          <div className="pm-table-wrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>商品</th>
                  <th>分类</th>
                  <th>价格</th>
                  <th>库存</th>
                  <th>销量</th>
                  <th>状态</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.map((product) => {
                  const priceInfo = getProductPriceInfo(product);

                  return (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <p className="pm-help">ID: {product.id}</p>
                      </td>
                      <td>{product.categoryName}</td>
                      <td>
                        <div className="pm-admin-product-price">
                          <strong className="pm-price">{formatPrice(priceInfo.currentPrice)}</strong>
                          {priceInfo.hasDiscount ? <span className="pm-old-price">原价 {formatPrice(priceInfo.originalPrice)}</span> : null}
                          {priceInfo.saleTag ? <span className="pm-tag pm-tag-sale">{priceInfo.saleTag}</span> : null}
                        </div>
                      </td>
                      <td>{product.stock}</td>
                      <td>{Number(product.sales) || 0}</td>
                      <td>
                        <StatusTag value={product.status}>
                          {product.status === 'on-sale' ? '上架中' : product.status === 'off-sale' ? '已下架' : '已删除'}
                        </StatusTag>
                      </td>
                      <td>{product.updatedAt}</td>
                      <td>
                        <div className="pm-table-actions">
                          <Button type="button" variant="ghost" onClick={() => setViewingProductId(product.id)}>查看</Button>
                          <PermissionGate permission="products:discount">
                            <Button type="button" variant="accent" onClick={() => handleDiscount(product)}>折扣</Button>
                          </PermissionGate>
                          <PermissionGate permission="products:manage">
                            <Button type="button" variant="ghost" onClick={() => handleEdit(product)}>编辑</Button>
                          </PermissionGate>
                          <PermissionGate permission="products:manage">
                            <Button
                              type="button"
                              variant={product.status === 'on-sale' ? 'danger' : 'mint'}
                              className={`pm-admin-product-status-btn pm-admin-product-status-btn-${product.status}`}
                              onClick={() => handleToggleStatus(product.id)}
                              disabled={product.status === 'deleted'}
                            >
                              {product.status === 'on-sale' ? '下架' : '上架'}
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission="products:manage">
                            <Button type="button" variant="danger" onClick={() => setDeletingProduct(product)}>删除</Button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            className="pm-admin-pagination"
            page={page}
            totalPages={totalPages}
            total={total}
            onPrev={() => hasPrev && setPage(page - 1)}
            onNext={() => hasNext && setPage(page + 1)}
          />
        </div>
      ) : (
        <EmptyState title="暂无商品" description="当前筛选条件下没有找到商品。" iconSrc="/images/admin/empty/no-data-shop.svg" />
      )}

      {canManage || canEditDiscount ? (
        <Modal
          cancelText="取消"
          confirmText=""
          onClose={closeForm}
          onConfirm={closeForm}
          open={isFormOpen}
          title={editingId ? (formMode === 'discount' ? '设置商品折扣' : '编辑商品') : '新增商品'}
        >
          <div className="pm-admin-panel">
            <p className="pm-help">保存后会同步影响前台商品展示和购买状态。</p>
            {formMode === 'discount' ? <p className="pm-help">在这里维护原价、现价和促销文案，列表页会同步显示折扣效果。</p> : null}
            {!canEditDiscount ? <p className="pm-help">当前角色没有折扣设置权限，原价和促销文案不可修改，现价会按普通售价保存。</p> : null}
            <ProductForm
              canEditDiscount={canEditDiscount}
              categories={categories}
              form={form}
              mode={formMode}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              submitText={editingId ? (formMode === 'discount' ? '保存折扣' : '保存修改') : '创建商品'}
            />
          </div>
        </Modal>
      ) : null}

      <Modal
        cancelText=""
        confirmText=""
        onClose={() => setViewingProductId(null)}
        onConfirm={() => setViewingProductId(null)}
        open={Boolean(viewingProduct)}
        title="商品详情"
      >
        {viewingProduct ? (
          <div className="pm-admin-panel pm-admin-detail-panel">
            <div className="pm-admin-detail-grid">
              <div>
                <p className="pm-label">商品名称</p>
                <h3 className="pm-admin-card-title">{viewingProduct.name}</h3>
              </div>
              <div>
                <p className="pm-label">分类</p>
                <p>{viewingProduct.categoryName}</p>
              </div>
              <div>
                <p className="pm-label">库存</p>
                <p>{viewingProduct.stock}</p>
              </div>
              <div>
                <p className="pm-label">销量</p>
                <p>{Number(viewingProduct.sales) || 0}</p>
              </div>
              <div>
                <p className="pm-label">状态</p>
                <StatusTag value={viewingProduct.status}>{viewingProduct.status === 'on-sale' ? '上架中' : viewingProduct.status === 'off-sale' ? '已下架' : '已删除'}</StatusTag>
              </div>
              <div>
                <p className="pm-label">更新时间</p>
                <p>{viewingProduct.updatedAt}</p>
              </div>
            </div>
            <div className="pm-admin-detail-grid">
              <div>
                <p className="pm-label">现价</p>
                <strong className="pm-price">{formatPrice(getProductPriceInfo(viewingProduct).currentPrice)}</strong>
              </div>
              <div>
                <p className="pm-label">原价</p>
                <p>{formatPrice(getProductPriceInfo(viewingProduct).originalPrice)}</p>
              </div>
              <div>
                <p className="pm-label">促销文案</p>
                <p>{getProductPriceInfo(viewingProduct).saleTag || '无'}</p>
              </div>
              <div>
                <p className="pm-label">发货说明</p>
                <p>{viewingProduct.promotionInfo?.shipping || '默认 48 小时内发货'}</p>
              </div>
            </div>
            <div className="pm-admin-detail-section">
              <p className="pm-label">商品描述</p>
              <p className="pm-admin-detail-copy">{viewingProduct.description}</p>
            </div>
            <div className="pm-admin-detail-grid pm-admin-detail-summary-grid">
              <div>
                <p className="pm-label">活动标签</p>
                <p className="pm-admin-detail-copy">{(viewingProduct.promotionInfo?.tags || []).join('、') || '未设置'}</p>
              </div>
              <div>
                <p className="pm-label">优惠信息</p>
                <p className="pm-admin-detail-copy">{(viewingProduct.promotionInfo?.coupons || []).join('、') || '未设置'}</p>
              </div>
              <div>
                <p className="pm-label">服务保障</p>
                <p className="pm-admin-detail-copy">{(viewingProduct.services || []).map((item) => item.label).join('、') || '未设置'}</p>
              </div>
              <div>
                <p className="pm-label">店铺卖点</p>
                <p className="pm-admin-detail-copy">{(viewingProduct.shopBadges || []).join('、') || '未设置'}</p>
              </div>
            </div>
            <div className="pm-admin-detail-grid pm-admin-detail-summary-grid">
              <div>
                <p className="pm-label">规格说明</p>
                <p className="pm-admin-detail-copy">
                  {(viewingProduct.specGroups || []).map((group) => `${group.name}：${(group.options || []).map((option) => option.label).join(' / ')}`).join('\n') || '默认规格'}
                </p>
              </div>
              <div>
                <p className="pm-label">库存组合</p>
                <p className="pm-admin-detail-copy">
                  {(viewingProduct.variants || []).map((variant) => `${Object.values(variant.specs || {}).join('/')}｜库存 ${variant.stock || 0}`).join('\n') || `默认规格｜库存 ${viewingProduct.stock || 0}`}
                </p>
              </div>
            </div>
            <div className="pm-admin-detail-section">
              <p className="pm-label">详情文案</p>
              <p className="pm-admin-detail-copy">
                {(viewingProduct.detailSections || []).map((section) => `${section.title}：${section.content}`).join('\n') || '未设置'}
              </p>
            </div>
            <div className="pm-admin-detail-section">
              <p className="pm-label">常见问答</p>
              <p className="pm-admin-detail-copy">
                {(viewingProduct.qaItems || []).map((item) => `问：${item.question} 答：${item.answer}`).join('\n') || '未设置'}
              </p>
            </div>
            <div className="pm-admin-detail-grid">
              <div>
                <p className="pm-label">规格组</p>
                <p>{viewingProduct.specGroups?.length || 0} 组</p>
              </div>
              <div>
                <p className="pm-label">SKU 库存</p>
                <p>{viewingProduct.variants?.length || 0} 个组合</p>
              </div>
              <div>
                <p className="pm-label">服务保障</p>
                <p>{viewingProduct.services?.length || 0} 项</p>
              </div>
              <div>
                <p className="pm-label">详情模块</p>
                <p>{viewingProduct.detailSections?.length || 0} 个</p>
              </div>
              <div>
                <p className="pm-label">问大家</p>
                <p>{viewingProduct.qaItems?.length || 0} 条</p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        cancelText="取消"
        confirmText="确认删除"
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
        open={Boolean(deletingProduct)}
        title="删除商品"
      >
        <p>删除后商品会保留历史订单快照，但前台不会再显示该商品。</p>
        <p>{deletingProduct?.name}</p>
      </Modal>
    </div>
  );
};

export default AdminProductsPage;
