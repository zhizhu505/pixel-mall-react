import { useContext, useEffect, useState } from 'react';
import PermissionGate from '../../components/admin/PermissionGate';
import ProductForm from '../../components/admin/ProductForm';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import StatusTag from '../../components/common/StatusTag';
import Pagination from '../../components/h5/Pagination';
import { ServiceContext } from '../../contexts/ServiceContext';
import { useServiceVersion } from '../../hooks/useServices';
import { usePagination } from '../../hooks/usePagination';
import { formatPrice, getProductPriceInfo } from '../../utils/productDisplay';

const createInitialForm = (categories) => ({
  id: null,
  name: '',
  originalPrice: 0,
  currentPrice: 0,
  saleTag: '',
  categoryId: categories[0]?.id || '',
  stock: 0,
  cover: '/favicon.svg',
  description: '',
  status: 'on-sale',
});

const AdminProductsPage = () => {
  const { admin, good } = useContext(ServiceContext);
  const categories = good.getCategoryList();
  const [filters, setFilters] = useState({ keyword: '', categoryId: 'all', status: 'all' });
  const [form, setForm] = useState(createInitialForm(categories));
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [viewingProductId, setViewingProductId] = useState(null);
  const [message, setMessage] = useState('');
  const [formMode, setFormMode] = useState('edit');

  useServiceVersion(good);

  const canManage = admin.hasPermission('products:manage');
  const canEditDiscount = admin.hasPermission('products:discount');
  const products = good.getGoodList(filters);
  const viewingProduct = viewingProductId ? good.getGoodById(viewingProductId) : null;
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

  const handleSubmit = (event) => {
    event.preventDefault();

    const originalPrice = Math.max(0, Number(form.originalPrice) || 0);
    const currentInput = Number(form.currentPrice);
    const currentPrice = Math.max(0, Number.isFinite(currentInput) ? currentInput : originalPrice);

    if (canEditDiscount && currentPrice > originalPrice) {
      setMessage('现价不能高于原价。');
      return;
    }

    const payload = {
      ...form,
      originalPrice: canEditDiscount ? originalPrice : currentPrice,
      currentPrice,
      price: currentPrice,
      saleTag: canEditDiscount ? form.saleTag.trim() : '',
    };

    if (editingId) {
      good.updateGood({ ...payload, id: editingId });
      setMessage(formMode === 'discount' ? '商品折扣已更新。' : '商品已更新。');
    } else {
      good.addGood(payload);
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
      cover: product.cover,
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

  const handleDelete = () => {
    if (!deletingProduct || !canManage) {
      setDeletingProduct(null);
      return;
    }

    good.deleteGood(deletingProduct.id);
    setMessage('商品已删除。');
    setDeletingProduct(null);
    if (editingId === deletingProduct.id) {
      closeForm();
    }
  };

  const handleToggleStatus = (productId) => {
    if (!canManage) {
      return;
    }

    const updatedProduct = good.toggleGoodStatus(productId);
    if (!updatedProduct) {
      setMessage('已删除商品不能调整上下架状态。');
      return;
    }

    setMessage(`商品状态已切换为${updatedProduct.status === 'on-sale' ? '上架中' : '已下架'}。`);
    if (editingId === productId) {
      handleEdit(updatedProduct);
    }
  };

  const handleRefresh = () => {
    good.reload();
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
                <p className="pm-label">状态</p>
                <StatusTag value={viewingProduct.status}>{viewingProduct.status === 'on-sale' ? '上架中' : viewingProduct.status === 'off-sale' ? '已下架' : '已删除'}</StatusTag>
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
                <p className="pm-label">更新时间</p>
                <p>{viewingProduct.updatedAt}</p>
              </div>
            </div>
            <div className="pm-admin-detail-media">
              <p className="pm-label">封面预览</p>
              <img src={viewingProduct.cover} alt={viewingProduct.name} />
            </div>
            <div>
              <p className="pm-label">商品描述</p>
              <p className="pm-admin-detail-copy">{viewingProduct.description}</p>
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
