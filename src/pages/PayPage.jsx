import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useServices } from '../hooks/useServices';
import { formatPrice } from '../utils/productDisplay';

const PAY_TIMEOUT_SECONDS = 15 * 60;
const PAY_METHODS = [
  { id: 'pixel', label: '像素钱包' },
  { id: 'card', label: '模拟银行卡' },
  { id: 'coupon', label: '奶油券' },
];

const formatCountdown = (seconds) => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remain = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${remain}`;
};

const PayPage = () => {
  const { orderId } = useParams();
  const { order } = useServices();
  const navigate = useNavigate();
  const parsedOrderId = Number(orderId);
  const currentOrder = order.getOrderById(parsedOrderId);
  const [secondsLeft, setSecondsLeft] = useState(PAY_TIMEOUT_SECONDS);
  const [payMethod, setPayMethod] = useState('pixel');
  const [expired, setExpired] = useState(false);
  const [failed, setFailed] = useState(false);

  const isPendingPay = currentOrder?.status === 0;

  useEffect(() => {
    if (!isPendingPay || failed) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setExpired(true);
          window.clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPendingPay, failed, parsedOrderId]);

  if (!currentOrder) {
    return (
      <main className="pm-page pm-pay-page">
        <EmptyState
          title="订单不存在"
          description="请从订单列表重新进入。"
          action={
            <Link className="pm-btn pm-btn-primary" to="/orderList">
              订单列表
            </Link>
          }
        />
      </main>
    );
  }

  const handlePay = () => {
    if (expired) {
      window.alert('支付已超时，请重新下单。');
      return;
    }

    const result = order.payOrder(parsedOrderId);
    if (!result.success) {
      window.alert(result.message);
      return;
    }
    navigate(`/orderDetail/${parsedOrderId}`);
  };

  const handleFail = () => {
    order.failPayment(parsedOrderId);
    setFailed(true);
  };

  const handleRetry = () => {
    setFailed(false);
    setExpired(false);
    setSecondsLeft(PAY_TIMEOUT_SECONDS);
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  const countdownText = !isPendingPay
    ? '订单已支付'
    : failed
      ? '支付未完成，可重新发起支付或返回首页'
      : expired
        ? '支付已超时，请重新下单'
        : `请在 ${formatCountdown(secondsLeft)} 内完成支付`;

  return (
    <main className="pm-page pm-pay-page">
      <h1>模拟支付</h1>
      <section className="pm-pay-panel">
        <p
          className={`pm-pay-countdown${failed ? ' is-failed' : ''}${expired ? ' is-expired' : ''}`}
          role="timer"
        >
          {countdownText}
        </p>

        <section className="pm-order-card">
          <header className="pm-order-head">
            <h2 className="pm-order-title">订单号 {currentOrder.orderNo}</h2>
            <span className="pm-tag pm-tag-info">{order.getStatusText(currentOrder.status)}</span>
          </header>
          <p className="pm-order-desc">商品：{currentOrder.goodSnapshot?.name || '组合商品'}</p>
          <footer className="pm-order-foot">
            <strong className="pm-price">{formatPrice(currentOrder.price)}</strong>
          </footer>
        </section>

        <div className="pm-pay-methods" role="radiogroup" aria-label="支付方式">
          {PAY_METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              className={`pm-pay-method${payMethod === method.id ? ' is-selected' : ''}`}
              onClick={() => setPayMethod(method.id)}
              disabled={failed || expired || !isPendingPay}
            >
              {method.label}
            </button>
          ))}
        </div>

        <div className="pm-pay-qrcode" aria-label="模拟支付二维码">
          <div className="pm-pay-qrcode-box">
            <div className="pm-pay-qrcode-mock">
              <span>PM</span>
              <strong>{currentOrder.orderNo.slice(-6)}</strong>
            </div>
          </div>
          <p className="pm-help">
            模拟二维码 · 订单尾号展示 · 使用
            {PAY_METHODS.find((method) => method.id === payMethod)?.label}
            支付
          </p>
        </div>

        {isPendingPay ? (
          <div className="pm-home-actions pm-pay-actions">
            {failed ? (
              <>
                <Button type="button" variant="primary" onClick={handleRetry}>
                  重新支付
                </Button>
                <Button type="button" variant="ghost" onClick={handleGoHome}>
                  回到首页
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="primary" disabled={expired} onClick={handlePay}>
                  支付成功
                </Button>
                <Button type="button" variant="danger" disabled={expired} onClick={handleFail}>
                  支付失败
                </Button>
              </>
            )}
          </div>
        ) : (
          <Link className="pm-btn pm-btn-primary" to={`/orderDetail/${parsedOrderId}`}>
            查看订单详情
          </Link>
        )}
      </section>
    </main>
  );
};

export default PayPage;
