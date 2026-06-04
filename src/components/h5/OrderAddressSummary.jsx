import { Link } from 'react-router-dom';

import { buildAddressManageUrl } from '../../utils/orderAddress';

const OrderAddressSummary = ({ address, returnTo, emptyHint = '请先添加收货地址' }) => {
  const manageUrl = buildAddressManageUrl(returnTo);

  return (
    <section className="pm-order-address-block" aria-label="收货地址">
      <header className="pm-order-address-block-head">
        <h2 className="pm-order-address-block-title">收货地址</h2>
        <Link className="pm-btn pm-btn-ghost pm-order-address-manage" to={manageUrl}>
          {address ? '更换地址' : '添加地址'}
        </Link>
      </header>

      {address ? (
        <article className="pm-order-address-card is-default">
          {address.isDefault ? <span className="pm-tag pm-tag-hot">默认</span> : null}
          <p className="pm-order-address-name">{address.receiver}</p>
          <p className="pm-order-address-phone">{address.phone}</p>
          <p className="pm-order-address-detail">{address.detail}</p>
        </article>
      ) : (
        <div className="pm-order-address-empty">
          <p className="pm-help">{emptyHint}</p>
          <Link className="pm-btn pm-btn-primary" to={manageUrl}>
            去添加地址
          </Link>
        </div>
      )}
    </section>
  );
};

export default OrderAddressSummary;
