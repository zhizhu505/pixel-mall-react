import { useContext, useState } from 'react';
import PermissionGate from '../../components/admin/PermissionGate';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { ServiceContext } from '../../contexts/ServiceContext';
import { useServiceVersion } from '../../hooks/useServices';

const createInitialForm = () => ({ id: '', name: '', description: '', sort: 1 });

const AdminCategoriesPage = () => {
  const { good } = useContext(ServiceContext);
  const [form, setForm] = useState(createInitialForm());
  const [editingId, setEditingId] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [viewingCategoryId, setViewingCategoryId] = useState(null);

  useServiceVersion(good);

  const categories = good.getCategoryList();
  const viewingCategory = viewingCategoryId ? good.getCategoryById(viewingCategoryId) : null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId('');
    setForm(createInitialForm());
  };

  const openCreateForm = () => {
    setEditingId('');
    setForm(createInitialForm());
    setIsFormOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (editingId) {
      good.updateCategory({ ...form, id: editingId });
      setMessage('分类已更新。');
    } else {
      good.addCategory(form);
      setMessage('分类已新增。');
    }

    closeForm();
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setForm({
      id: category.id,
      name: category.name,
      description: category.description,
      sort: category.sort,
    });
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (!deletingCategory) {
      return;
    }

    const deletingId = deletingCategory.id;
    const result = good.deleteCategory(deletingId);
    setDeletingCategory(null);
    setMessage(result.success ? '分类已删除。' : result.message);
    if (result.success && editingId === deletingId) {
      closeForm();
    }
  };

  const handleRefresh = () => {
    good.reload();
    setMessage('分类数据已刷新。');
  };

  return (
    <div className="pm-admin-categories-page">
      <div className="pm-admin-page-header">
        <div>
          <h2 className="pm-section-title">分类管理</h2>
          <p className="pm-help">维护商品分类，并联动商品筛选和商品表单。</p>
        </div>
        <div className="pm-admin-inline-actions">
          <Button type="button" variant="ghost" onClick={handleRefresh}>刷新</Button>
          <PermissionGate permission="categories:manage">
            <Button type="button" onClick={openCreateForm}>新增分类</Button>
          </PermissionGate>
        </div>
      </div>

      {message ? <div className="pm-alert">{message}</div> : null}

      {categories.length ? (
        <section className="pm-admin-category-grid">
          {categories.map((category) => (
            <article className="pm-admin-category-card" key={category.id}>
              <div>
                <h3 className="pm-admin-card-title">{category.name}</h3>
                <p className="pm-help">排序：{category.sort}</p>
              </div>
              <p>{category.description}</p>
              <div className="pm-admin-category-actions">
                <Button type="button" variant="ghost" onClick={() => setViewingCategoryId(category.id)}>查看</Button>
                <PermissionGate permission="categories:manage">
                  <Button type="button" variant="ghost" onClick={() => handleEdit(category)}>编辑</Button>
                </PermissionGate>
                <PermissionGate permission="categories:manage">
                  <Button type="button" variant="danger" onClick={() => setDeletingCategory(category)}>删除</Button>
                </PermissionGate>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState title="暂无分类" description="先创建分类，再为商品配置分类信息。" iconSrc="/images/admin/category/cat-bag.svg" />
      )}

      <PermissionGate permission="categories:manage">
        <Modal
          cancelText="取消"
          confirmText=""
          onClose={closeForm}
          onConfirm={closeForm}
          open={isFormOpen}
          title={editingId ? '编辑分类' : '新增分类'}
        >
          <div className="pm-admin-panel">
            <p className="pm-help">分类变更会同步影响商品筛选和商品表单。</p>
            <form className="pm-admin-form" onSubmit={handleSubmit}>
              <label className="pm-control">
                <span className="pm-label">分类名称</span>
                <input className="pm-input" name="name" value={form.name} onChange={handleChange} required />
              </label>
              <label className="pm-control">
                <span className="pm-label">排序</span>
                <input className="pm-input" min="1" name="sort" type="number" value={form.sort} onChange={handleChange} required />
              </label>
              <label className="pm-control pm-admin-form-wide">
                <span className="pm-label">分类描述</span>
                <textarea className="pm-textarea" name="description" value={form.description} onChange={handleChange} required />
              </label>
              <div className="pm-control pm-admin-form-wide">
                <button className="pm-btn pm-btn-primary" type="submit">{editingId ? '保存分类' : '新增分类'}</button>
              </div>
            </form>
          </div>
        </Modal>
      </PermissionGate>

      <Modal
        cancelText=""
        confirmText=""
        onClose={() => setViewingCategoryId(null)}
        onConfirm={() => setViewingCategoryId(null)}
        open={Boolean(viewingCategory)}
        title="分类详情"
      >
        {viewingCategory ? (
          <div className="pm-admin-panel pm-admin-detail-panel">
            <div className="pm-admin-detail-grid">
              <div>
                <p className="pm-label">分类名称</p>
                <h3 className="pm-admin-card-title">{viewingCategory.name}</h3>
              </div>
              <div>
                <p className="pm-label">排序</p>
                <p>{viewingCategory.sort}</p>
              </div>
              <div>
                <p className="pm-label">关联商品数</p>
                <p>{good.getGoodList({ categoryId: viewingCategory.id }).length}</p>
              </div>
            </div>
            <div>
              <p className="pm-label">分类描述</p>
              <p className="pm-admin-detail-copy">{viewingCategory.description}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        cancelText="取消"
        confirmText="确认删除"
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        open={Boolean(deletingCategory)}
        title="删除分类"
      >
        <p>若该分类下仍有未删除商品，将阻止删除。</p>
        <p>{deletingCategory?.name}</p>
      </Modal>
    </div>
  );
};

export default AdminCategoriesPage;
