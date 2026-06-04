import { Link } from 'react-router-dom';

const AddressPicker = ({
  addresses,
  selectedId,
  onSelect,
  receiver,
  phone,
  detail,
  onReceiverChange,
  onPhoneChange,
  onDetailChange,
  errors = {},
}) => {
  return (
    <section className="pm-address-card">
      <header className="pm-address-head">
        <h2>收货地址</h2>
        <Link className="pm-btn pm-btn-ghost" to="/address">
          管理地址
        </Link>
      </header>

      {addresses.length ? (
        <div className="pm-address-list">
          {addresses.map((item) => (
            <label
              key={item.id}
              className={`pm-address-card${item.isDefault ? ' is-default' : ''}${selectedId === item.id ? ' is-selected' : ''}`}
            >
              <input
                type="radio"
                name="shipping-address"
                checked={selectedId === item.id}
                onChange={() => onSelect(item)}
              />
              <p className="pm-address-name">{item.receiver}</p>
              <p className="pm-address-phone">{item.phone}</p>
              <p className="pm-address-text">{item.detail}</p>
            </label>
          ))}
        </div>
      ) : (
        <p className="pm-help">暂无保存地址，请填写或前往地址管理添加。</p>
      )}

      <div className="pm-address-form">
        <div className="pm-control">
          <label className="pm-label" htmlFor="receiver">收货人</label>
          <input
            id="receiver"
            className="pm-input"
            value={receiver}
            onChange={(event) => onReceiverChange(event.target.value)}
          />
          {errors.receiver ? <p className="pm-help has-error">{errors.receiver}</p> : null}
        </div>
        <div className="pm-control">
          <label className="pm-label" htmlFor="phone">手机号</label>
          <input
            id="phone"
            className="pm-input"
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
          />
          {errors.phone ? <p className="pm-help has-error">{errors.phone}</p> : null}
        </div>
        <div className="pm-control">
          <label className="pm-label" htmlFor="detail">详细地址</label>
          <textarea
            id="detail"
            className="pm-textarea"
            value={detail}
            onChange={(event) => onDetailChange(event.target.value)}
          />
          {errors.detail ? <p className="pm-help has-error">{errors.detail}</p> : null}
        </div>
      </div>
    </section>
  );
};

export default AddressPicker;
