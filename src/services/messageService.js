import SubscribableService from './subscribableService';
import { cloneValue, loadFromStorage, saveToStorage } from '../utils/storage';

const MESSAGE_KEY = 'pixelMall:messages';

const defaultMessages = [
  {
    id: 'msg-chat-1',
    userId: 1,
    type: 'chat',
    title: '像素客服',
    content: '欢迎来到 Pixel Mall，有任何商品搭配问题都可以随时咨询我们。',
    createdAt: '2026/06/09 09:30',
    read: false,
    participants: ['我', '像素客服'],
    thread: [
      { id: 'msg-chat-1-a', sender: '像素客服', content: '欢迎来到 Pixel Mall，有任何商品搭配问题都可以随时咨询我们。', createdAt: '09:30' },
      { id: 'msg-chat-1-b', sender: '我', content: '想了解近期活动和礼盒搭配。', createdAt: '09:36' },
      { id: 'msg-chat-1-c', sender: '像素客服', content: '可以看看会员日限定礼盒，包包和发夹组合更划算。', createdAt: '09:38' },
    ],
  },
  {
    id: 'msg-system-1',
    userId: 1,
    type: 'system',
    title: '系统通知',
    content: '会员日活动已开启，部分商品享受专属优惠。',
    detail: '会员日活动已开启，草莓云朵像素包、玫瑰格纹斜挎小包和奶油季节礼盒正在参与专属优惠。活动期间下单可同步累计会员积分，优惠以结算页展示为准。',
    createdAt: '2026/06/09 10:00',
    read: false,
  },
  {
    id: 'msg-system-2',
    userId: 1,
    type: 'system',
    title: '物流提醒',
    content: '已发货订单可在订单详情中查看最新物流记录。',
    detail: '你的最近订单已进入配送流程，可在订单详情页查看商品打包、出库和配送节点。如地址信息需要调整，请尽快联系客服。',
    createdAt: '2026/06/09 10:20',
    read: true,
  },
];

const mergeMessageDefaults = (message) => ({
  ...defaultMessages.find((item) => item.id === message.id),
  ...message,
});

const mergeDefaultMessages = (storedMessages) => {
  const storedList = Array.isArray(storedMessages) ? storedMessages : [];
  const storedIds = new Set(storedList.map((message) => message.id));
  const missingDefaults = defaultMessages.filter((message) => !storedIds.has(message.id));

  return [...missingDefaults, ...storedList].map(mergeMessageDefaults);
};

class MessageService extends SubscribableService {
  list = [];

  constructor() {
    super();
    this._loadData();
  }

  getMessagesByUser(userId, filters = {}) {
    const { type = 'all' } = filters;
    return this.list
      .filter((message) => message.userId === Number(userId))
      .filter((message) => type === 'all' || message.type === type)
      .map((message) => cloneValue(message));
  }

  getUnreadCount(userId) {
    return this.list.filter((message) => message.userId === Number(userId) && !message.read).length;
  }

  getMessageById(userId, messageId) {
    const message = this.list.find((item) => item.userId === Number(userId) && item.id === messageId);
    return message ? cloneValue(message) : null;
  }

  openProductChat(userId, product) {
    const parsedUserId = Number(userId);
    const messageId = `msg-chat-product-${parsedUserId}-${product.id}`;
    const existing = this.list.find((item) => item.userId === parsedUserId && item.id === messageId);

    if (existing) {
      existing.read = true;
      this._saveData();
      return cloneValue(existing);
    }

    const createdAt = new Date().toLocaleString();
    const chat = {
      id: messageId,
      userId: parsedUserId,
      type: 'chat',
      title: '商家客服',
      content: `您好，关于「${product.name}」有什么想了解的都可以问我。`,
      createdAt,
      read: true,
      participants: ['我', '商家客服'],
      productId: product.id,
      productName: product.name,
      thread: [
        { id: `${messageId}-hello`, sender: '商家客服', content: `您好，关于「${product.name}」有什么想了解的都可以问我。`, createdAt: '刚刚' },
        { id: `${messageId}-guide`, sender: '商家客服', content: '可以咨询库存、材质、优惠和发货时间。', createdAt: '刚刚' },
      ],
    };

    this.list.unshift(chat);
    this._saveData();
    return cloneValue(chat);
  }

  markAsRead(userId, messageId) {
    const message = this.list.find((item) => item.userId === Number(userId) && item.id === messageId);
    if (!message || message.read) {
      return false;
    }
    message.read = true;
    this._saveData();
    return true;
  }

  markAllAsRead(userId) {
    let changed = false;
    this.list = this.list.map((message) => {
      if (message.userId === Number(userId) && !message.read) {
        changed = true;
        return { ...message, read: true };
      }
      return message;
    });
    if (changed) {
      this._saveData();
    }
  }

  _loadData() {
    this.list = mergeDefaultMessages(loadFromStorage([MESSAGE_KEY], defaultMessages));
    this._saveData();
  }

  _saveData() {
    saveToStorage(MESSAGE_KEY, this.list);
    this.notify();
  }
}

const messageService = new MessageService();
export default messageService;
