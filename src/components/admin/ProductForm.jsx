const ProductForm = ({ form, categories, onChange, onSubmit, submitText = '保存商品', canEditDiscount = true, mode = 'edit' }) => {
  const isDiscountMode = mode === 'discount';

  return (
    <form className="pm-admin-form" onSubmit={onSubmit}>
      <label className="pm-control">
        <span className="pm-label">商品名称</span>
        <input className="pm-input" name="name" value={form.name} onChange={onChange} required disabled={isDiscountMode} />
      </label>
      <label className={`pm-control${!canEditDiscount ? ' is-disabled' : ''}`}>
        <span className="pm-label">商品原价</span>
        <input className="pm-input" min="0" name="originalPrice" step="0.01" type="number" value={form.originalPrice} onChange={onChange} required disabled={!canEditDiscount} />
      </label>
      <label className="pm-control">
        <span className="pm-label">商品现价</span>
        <input className="pm-input" min="0" name="currentPrice" step="0.01" type="number" value={form.currentPrice} onChange={onChange} required />
      </label>
      <label className={`pm-control${!canEditDiscount ? ' is-disabled' : ''}`}>
        <span className="pm-label">促销文案</span>
        <input className="pm-input" maxLength="12" name="saleTag" value={form.saleTag} onChange={onChange} placeholder="如：限时直降" disabled={!canEditDiscount} />
      </label>
      <label className="pm-control">
        <span className="pm-label">所属分类</span>
        <select className="pm-select" name="categoryId" value={form.categoryId} onChange={onChange} required disabled={isDiscountMode}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </label>
      <label className="pm-control">
        <span className="pm-label">库存</span>
        <input className="pm-input" min="0" name="stock" type="number" value={form.stock} onChange={onChange} required disabled={isDiscountMode} />
      </label>
      <label className="pm-control pm-admin-form-wide">
        <span className="pm-label">商品描述</span>
        <textarea className="pm-textarea" name="description" value={form.description} onChange={onChange} required placeholder="一句话概括商品卖点、风格和适用场景" disabled={isDiscountMode} />
      </label>
      {!isDiscountMode ? (
        <>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">发货说明</span>
            <input className="pm-input" name="shippingText" value={form.shippingText} onChange={onChange} placeholder="如：48 小时内发货" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">活动标签</span>
            <textarea className="pm-textarea pm-admin-compact-textarea" name="promoTagsText" value={form.promoTagsText} onChange={onChange} placeholder="每行一个，如：新品首发 / 送礼推荐 / 人气热卖" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">优惠信息</span>
            <textarea className="pm-textarea pm-admin-compact-textarea" name="couponText" value={form.couponText} onChange={onChange} placeholder="每行一句，如：满 199 减 20 / 2 件 95 折" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">服务保障</span>
            <textarea className="pm-textarea pm-admin-compact-textarea" name="servicesText" value={form.servicesText} onChange={onChange} placeholder="每行一项，如：正品保障｜官方质检｜出库前完成基础检查" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">规格说明</span>
            <textarea className="pm-textarea pm-admin-compact-textarea" name="specGroupsText" value={form.specGroupsText} onChange={onChange} placeholder="每行一组，如：颜色：草莓粉 / 云朵白" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">库存与规格组合</span>
            <textarea className="pm-textarea pm-admin-compact-textarea" name="variantsText" value={form.variantsText} onChange={onChange} placeholder="每行一条，如：草莓粉｜库存 12｜现价 100｜原价 129｜发货 48 小时内" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">详情文案</span>
            <textarea className="pm-textarea pm-admin-compact-textarea" name="detailSectionsText" value={form.detailSectionsText} onChange={onChange} placeholder="每行一个模块，如：材质亮点｜高密帆布包身，日常通勤更耐用" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">常见问答</span>
            <textarea className="pm-textarea pm-admin-compact-textarea" name="qaItemsText" value={form.qaItemsText} onChange={onChange} placeholder="每行一条，如：能放下平板吗？｜可以放入 11 英寸以内设备" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">店铺卖点</span>
            <textarea className="pm-textarea pm-admin-compact-textarea" name="shopBadgesText" value={form.shopBadgesText} onChange={onChange} placeholder="每行一个，如：原创设计 / 48 小时发货 / 回购率高" />
          </label>
        </>
      ) : null}
      <label className="pm-control">
        <span className="pm-label">商品状态</span>
        <select className="pm-select" name="status" value={form.status} onChange={onChange} disabled={isDiscountMode}>
          <option value="on-sale">上架中</option>
          <option value="off-sale">已下架</option>
        </select>
      </label>
      <div className="pm-control pm-admin-form-wide">
        <button className="pm-btn pm-btn-primary" type="submit">{submitText}</button>
      </div>
    </form>
  );
};

export default ProductForm;
