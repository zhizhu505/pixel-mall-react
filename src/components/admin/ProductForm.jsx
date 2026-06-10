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
        <span className="pm-label">封面地址</span>
        <input className="pm-input" name="cover" value={form.cover} onChange={onChange} required disabled={isDiscountMode} />
      </label>
      <label className="pm-control pm-admin-form-wide">
        <span className="pm-label">轮播图地址</span>
        <textarea className="pm-textarea" name="imagesText" value={form.imagesText} onChange={onChange} placeholder="每行一个图片地址" disabled={isDiscountMode} />
      </label>
      <label className="pm-control pm-admin-form-wide">
        <span className="pm-label">商品描述</span>
        <textarea className="pm-textarea" name="description" value={form.description} onChange={onChange} required disabled={isDiscountMode} />
      </label>
      {!isDiscountMode ? (
        <>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">详情媒体 JSON</span>
            <textarea className="pm-textarea pm-admin-json-textarea" name="mediaText" value={form.mediaText} onChange={onChange} placeholder="图片/视频媒体配置" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">规格组 JSON</span>
            <textarea className="pm-textarea pm-admin-json-textarea" name="specGroupsText" value={form.specGroupsText} onChange={onChange} placeholder="颜色、尺寸、套餐等规格组" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">SKU 库存 JSON</span>
            <textarea className="pm-textarea pm-admin-json-textarea" name="variantsText" value={form.variantsText} onChange={onChange} placeholder="规格组合、价格和库存" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">服务保障 JSON</span>
            <textarea className="pm-textarea pm-admin-json-textarea" name="servicesText" value={form.servicesText} onChange={onChange} placeholder="正品保障、运费险、退换等服务" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">优惠信息 JSON</span>
            <textarea className="pm-textarea pm-admin-json-textarea" name="promotionInfoText" value={form.promotionInfoText} onChange={onChange} placeholder="运费、标签、优惠券" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">详情模块 JSON</span>
            <textarea className="pm-textarea pm-admin-json-textarea" name="detailSectionsText" value={form.detailSectionsText} onChange={onChange} placeholder="参数、场景、养护说明" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">问大家 JSON</span>
            <textarea className="pm-textarea pm-admin-json-textarea" name="qaItemsText" value={form.qaItemsText} onChange={onChange} placeholder="商品问答" />
          </label>
          <label className="pm-control pm-admin-form-wide">
            <span className="pm-label">店铺标签 JSON</span>
            <textarea className="pm-textarea pm-admin-json-textarea" name="shopBadgesText" value={form.shopBadgesText} onChange={onChange} placeholder="店铺可信标签数组" />
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
