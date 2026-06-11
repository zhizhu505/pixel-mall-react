import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useServices, useServiceSnapshot } from '../hooks/useServices';

const filters = [
  { key: 'all', label: '全部' },
  { key: 'chat', label: '聊天' },
  { key: 'system', label: '通知' },
];

const typeLabelMap = {
  chat: '聊天消息',
  system: '系统通知',
};

const MessagesPage = () => {
  const { message, user } = useServices();
  const navigate = useNavigate();
  const currentUser = useServiceSnapshot(user, (service) => service.getCurrentUser());
  const [activeFilter, setActiveFilter] = useState('all');
  const messages = useServiceSnapshot(message, (service) => (
    currentUser ? service.getMessagesByUser(currentUser.id, { type: activeFilter }) : []
  ));
  const unreadCount = useServiceSnapshot(message, (service) => (
    currentUser ? service.getUnreadCount(currentUser.id) : 0
  ));
  const chatCount = messages.filter((item) => item.type === 'chat').length;
  const systemCount = messages.filter((item) => item.type === 'system').length;
  const stats = [
    { label: '未读消息', value: unreadCount },
    { label: '聊天会话', value: chatCount },
    { label: '系统通知', value: systemCount },
  ];
  const latestMessage = messages[0];

  const handleOpenMessage = (item) => {
    message.markAsRead(currentUser.id, item.id);
    navigate(`/messages/chat/${encodeURIComponent(item.id)}`);
  };

  const handleReadAll = () => {
    message.markAllAsRead(currentUser.id);
  };

  return (
    <main className="pm-page pm-messages-page">
      <header className="pm-messages-header pm-messages-hero">
        <div className="pm-messages-hero-copy">
          <p className="pm-section-eyebrow">Messages</p>
          <h1>消息</h1>
          <p className="pm-messages-hero-desc">
            把客服会话和系统通知压缩到同一块工作区里，重要状态优先露出，减少往返点击。
          </p>
          {latestMessage ? (
            <p className="pm-messages-latest">
              最新动态：{latestMessage.title} · {latestMessage.createdAt}
            </p>
          ) : null}
        </div>
        <div className="pm-messages-hero-side">
          <div className="pm-messages-stats" aria-label="消息概览">
            {stats.map((item, index) => (
              <article className={`pm-messages-stat pm-messages-stat-${index + 1}`} key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
          <Button type="button" variant="ghost" disabled={!unreadCount} onClick={handleReadAll}>全部已读</Button>
        </div>
      </header>

      <div className="pm-messages-tabs" role="tablist" aria-label="消息类型">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={`pm-messages-tab${activeFilter === filter.key ? ' is-active' : ''}`}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {messages.length ? (
        <section className="pm-messages-list">
          {messages.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`pm-message-card${item.read ? '' : ' is-unread'}`}
              onClick={() => handleOpenMessage(item)}
            >
              <span className="pm-message-type">{typeLabelMap[item.type] || '消息'}</span>
              <strong>{item.title}</strong>
              <span>{item.content}</span>
              <small>{item.createdAt}</small>
            </button>
          ))}
        </section>
      ) : (
        <EmptyState title="暂无消息" description="这里会展示客服聊天和系统通知。" iconSrc="/images/admin/empty/no-data-shop.svg" />
      )}
    </main>
  );
};

export default MessagesPage;
