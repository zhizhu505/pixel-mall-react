import SubscribableService from './subscribableService';
import { cloneValue, loadFromStorage, saveToStorage } from '../utils/storage';

const MESSAGE_KEY = 'pixelMall:messages';

const defaultMessages = [
  {
    id: 'msg-chat-1',
    userId: 1,
    type: 'chat',
    title: '像素客服',
    content: '会员日礼盒可以帮你预留，今天 18:00 前下单会一起打包。',
    createdAt: '2026/06/09 10:12',
    read: false,
    participants: ['我', '像素客服'],
    thread: [
      { id: 'msg-chat-1-a', sender: '像素客服', content: '欢迎来到 Pixel Mall，有任何商品搭配问题都可以随时咨询我们。', createdAt: '09:30' },
      { id: 'msg-chat-1-b', sender: '我', content: '想了解近期活动和礼盒搭配。', createdAt: '09:36' },
      { id: 'msg-chat-1-c', sender: '像素客服', content: '可以看看会员日限定礼盒，包包和发夹组合更划算。', createdAt: '09:38' },
      { id: 'msg-chat-1-d', sender: '我', content: '礼盒里能换成浅色系吗？送朋友，希望看起来温柔一点。', createdAt: '10:05' },
      { id: 'msg-chat-1-e', sender: '像素客服', content: '可以的，建议选草莓云朵像素包搭配奶油色发夹，我们会用粉白外盒和小卡一起包装。', createdAt: '10:08' },
      { id: 'msg-chat-1-f', sender: '像素客服', content: '会员日礼盒可以帮你预留，今天 18:00 前下单会一起打包。', createdAt: '10:12' },
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

const mergeMessageDefaults = (message) => {
  const defaultMessage = defaultMessages.find((item) => item.id === message.id);
  const merged = {
    ...defaultMessage,
    ...message,
  };

  if (defaultMessage?.thread?.length && Array.isArray(message.thread)) {
    const storedThreadIds = new Set(message.thread.map((item) => item.id));
    merged.thread = [
      ...message.thread,
      ...defaultMessage.thread.filter((item) => !storedThreadIds.has(item.id)),
    ];
  }

  return merged;
};

const mergeDefaultMessages = (storedMessages) => {
  const storedList = Array.isArray(storedMessages) ? storedMessages : [];
  const storedIds = new Set(storedList.map((message) => message.id));
  const missingDefaults = defaultMessages.filter((message) => !storedIds.has(message.id));

  return [...missingDefaults, ...storedList].map(mergeMessageDefaults);
};

const getChatTime = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

const getChatDateTime = () => new Date().toLocaleString('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const getAutoReply = (content, message) => {
  const text = content.toLowerCase();
  if (text.includes('发货') || text.includes('多久') || text.includes('物流')) {
    return '现货商品通常 24 小时内打包发出，节日礼盒会多做一层防压包装。';
  }
  if (text.includes('优惠') || text.includes('活动') || text.includes('券')) {
    return '当前可叠加会员日优惠，结算页会自动展示可用券和满减。';
  }
  if (text.includes('颜色') || text.includes('尺寸') || text.includes('材质')) {
    return '这款实物偏柔和像素色，详情页参数是准的，也可以按你的搭配需求帮你推荐。';
  }
  if (message?.productName) {
    return `收到，关于「${message.productName}」我会按现货、搭配和发货情况帮你确认。`;
  }
  return '收到，我先帮你记录需求，稍后会按商品、优惠和发货情况一起确认。';
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

  sendChatMessage(userId, messageId, content) {
    const trimmedContent = String(content ?? '').trim();
    const message = this.list.find((item) => item.userId === Number(userId) && item.id === messageId && item.type === 'chat');
    if (!message || !trimmedContent) {
      return { success: false, message: '请输入要发送的内容' };
    }

    const now = getChatTime();
    const baseId = `${messageId}-${Date.now()}`;
    const userMessage = { id: `${baseId}-user`, sender: '我', content: trimmedContent, createdAt: now };
    const reply = { id: `${baseId}-reply`, sender: message.title || '商家客服', content: getAutoReply(trimmedContent, message), createdAt: now };
    message.thread = [...(Array.isArray(message.thread) ? message.thread : []), userMessage, reply];
    message.content = reply.content;
    message.createdAt = getChatDateTime();
    message.read = true;
    this.list = [message, ...this.list.filter((item) => item !== message)];
    this._saveData();
    return { success: true, message: cloneValue(message) };
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
