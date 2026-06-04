export const ORDER_STATUS_TABS = [
  { key: 'all', label: '全部' },
  { key: '0', label: '待支付' },
  { key: '1', label: '已支付' },
  { key: '2', label: '已发货' },
  { key: '3', label: '已完成' },
];

export const orderListPathForStatus = (statusKey) => {
  if (!statusKey || statusKey === 'all') {
    return '/orderList';
  }
  return `/orderList?status=${statusKey}`;
};
