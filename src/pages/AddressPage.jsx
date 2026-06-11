import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useServices } from '../hooks/useServices';
import { showPixelToast } from '../utils/pixelToast';
import { collectErrors, validatePhone, validateRequired } from '../utils/validation';

const emptyForm = {
  receiver: '',
  phone: '',
  detail: '',
  isDefault: false,
};

const AddressPage = () => {
  'use no memo';

  const { address, user, api } = useServices();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';
  const isOrderFlow = returnTo.startsWith('/');
  const currentUser = user.getCurrentUser();
  const listRef = useRef(null);

  const [listVersion, setListVersion] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  void listVersion;
  const addresses = currentUser?.id ? address.getAddressesByUser(currentUser.id) : [];

  const bumpList = () => {
    setListVersion((version) => version + 1);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      receiver: item.receiver,
      phone: item.phone,
      detail: item.detail,
      isDefault: item.isDefault,
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateForm = () => {
    const nextErrors = collectErrors([
      ['receiver', validateRequired(form.receiver, '收货人')],
      ['phone', validatePhone(form.phone)],
      ['detail', validateRequired(form.detail, '详细地址')],
    ]);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      showPixelToast('请完善收货人、手机号和详细地址后再提交。');
      return;
    }

    if (!currentUser?.id) {
      showPixelToast('请先登录后再管理地址。');
      return;
    }

    let savedId;

    if (editingId) {
      const updated = await api.addresses.update(currentUser.id, { id: editingId, ...form });
      if (!updated) {
        showPixelToast('地址更新失败，请重试。');
        return;
      }
      savedId = updated.id;
      showPixelToast('地址已更新。', { tone: 'success' });
    } else {
      const created = await api.addresses.create(currentUser.id, form);
      if (!created) {
        showPixelToast('地址添加失败，请重试。');
        return;
      }
      savedId = created.id;
      showPixelToast('地址已添加，可在下方列表查看。', { tone: 'success' });
    }

    resetForm();
    bumpList();

    requestAnimationFrame(() => {
      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    if (isOrderFlow && savedId) {
      const useNew = window.confirm('地址已保存，是否使用该地址返回订单？');
      if (useNew) {
        navigate(returnTo, { state: { selectedAddressId: savedId } });
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除该地址吗？')) {
      return;
    }
    await api.addresses.remove(currentUser.id, id);
    if (editingId === id) {
      resetForm();
    }
    showPixelToast('地址已删除。', { tone: 'success' });
    bumpList();
  };

  const handleSetDefault = async (id) => {
    await api.addresses.setDefault(currentUser.id, id);
    showPixelToast('已设为默认地址。', { tone: 'success' });
    bumpList();
  };

  const handleUseAddress = (item) => {
    if (!isOrderFlow) {
      return;
    }
    navigate(returnTo, { state: { selectedAddressId: item.id } });
  };

  if (!currentUser) {
    return null;
  }

  const pageTitle = isOrderFlow ? '选择收货地址' : '地址管理';

  const addressForm = (
    <form className="pm-address-form" onSubmit={handleSubmit}>
      <h2>{editingId ? '编辑地址' : '新增地址'}</h2>
      <div className="pm-control pm-address-control">
        <label className="pm-label" htmlFor="addr-receiver">收货人</label>
        <input
          id="addr-receiver"
          className="pm-input"
          value={form.receiver}
          onChange={(event) => setForm({ ...form, receiver: event.target.value })}
          autoComplete="name"
        />
        {errors.receiver ? <p className="pm-help has-error">{errors.receiver}</p> : null}
      </div>
      <div className="pm-control pm-address-control">
        <label className="pm-label" htmlFor="addr-phone">手机号</label>
        <input
          id="addr-phone"
          className="pm-input"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          inputMode="numeric"
          autoComplete="tel"
          placeholder="11 位手机号，如 13800000000"
        />
        {errors.phone ? <p className="pm-help has-error">{errors.phone}</p> : null}
      </div>
      <div className="pm-control pm-address-control">
        <label className="pm-label" htmlFor="addr-detail">详细地址</label>
        <textarea
          id="addr-detail"
          className="pm-textarea"
          value={form.detail}
          onChange={(event) => setForm({ ...form, detail: event.target.value })}
          autoComplete="street-address"
        />
        {errors.detail ? <p className="pm-help has-error">{errors.detail}</p> : null}
      </div>
      <label className="pm-check-field pm-address-default-check">
        <input
          className="pm-check-field-input"
          type="checkbox"
          checked={form.isDefault}
          onChange={(event) => setForm({ ...form, isDefault: event.target.checked })}
        />
        <span className="pm-check-field-ui" aria-hidden />
        <span className="pm-check-field-label">设为默认地址</span>
      </label>
      <div className="pm-address-form-actions">
        <Button type="submit" variant="primary">
          {editingId ? '保存修改' : '添加地址'}
        </Button>
        {editingId ? (
          <Button type="button" variant="ghost" onClick={resetForm}>
            取消编辑
          </Button>
        ) : null}
      </div>
    </form>
  );

  const addressList = (
    <section className="pm-address-list" ref={listRef} id="address-list">
      <h2>{isOrderFlow ? '可用地址' : '已保存地址'}</h2>
      {!addresses.length ? (
        <div className="pm-address-empty">
          <EmptyState title="暂无地址" description="请先添加收货地址。" />
        </div>
      ) : (
        addresses.map((item) => (
          <article
            key={item.id}
            className={`pm-address-card${item.isDefault ? ' is-default' : ''}`}
          >
            <header className="pm-address-head">
              <p className="pm-address-name">{item.receiver}</p>
              {item.isDefault ? <span className="pm-tag pm-tag-hot">默认</span> : null}
            </header>
            <p className="pm-address-phone">{item.phone}</p>
            <p className="pm-address-text">{item.detail}</p>
            <div className="pm-address-actions">
              {isOrderFlow ? (
                <Button type="button" variant="primary" onClick={() => handleUseAddress(item)}>
                  使用此地址
                </Button>
              ) : null}
              <Button type="button" variant="ghost" onClick={() => startEdit(item)}>
                编辑
              </Button>
              {!item.isDefault ? (
                <Button type="button" variant="mint" onClick={() => handleSetDefault(item.id)}>
                  设为默认
                </Button>
              ) : null}
              {!isOrderFlow ? (
                <Button type="button" variant="danger" onClick={() => handleDelete(item.id)}>
                  删除
                </Button>
              ) : null}
            </div>
          </article>
        ))
      )}
    </section>
  );

  return (
    <main className={`pm-page pm-address-page${isOrderFlow ? ' pm-address-page-order' : ''}`}>
      <header className="pm-address-toolbar">
        <div>
          <p className="pm-section-eyebrow">Shipping</p>
          <h1 className="pm-address-title">{pageTitle}</h1>
          {isOrderFlow ? (
            <p className="pm-address-flow-hint">选择已有地址，或在下方新增后返回订单</p>
          ) : null}
        </div>
        <button className="pm-btn pm-btn-ghost pm-back-btn" type="button" onClick={() => navigate(-1)}>
          返回
        </button>
      </header>

      {isOrderFlow ? (
        <>
          {addressList}
          {addressForm}
        </>
      ) : (
        <>
          {addressForm}
          {addressList}
        </>
      )}
    </main>
  );
};

export default AddressPage;
