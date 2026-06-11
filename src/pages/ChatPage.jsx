import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import EmptyState from '../components/common/EmptyState';
import { useServices, useServiceSnapshot } from '../hooks/useServices';

const ChatPage = () => {
  const { messageId } = useParams();
  const navigate = useNavigate();
  const { message, user } = useServices();
  const [draft, setDraft] = useState('');
  const threadEndRef = useRef(null);
  const currentUser = useServiceSnapshot(user, (service) => service.getCurrentUser());
  const selectedMessage = useServiceSnapshot(message, (service) => (
    currentUser && messageId ? service.getMessageById(currentUser.id, messageId) : null
  ));
  const thread = selectedMessage?.thread?.length
    ? selectedMessage.thread
    : selectedMessage?.type === 'chat'
      ? [{ id: `${selectedMessage.id}-content`, sender: selectedMessage.title, content: selectedMessage.content, createdAt: selectedMessage.createdAt }]
      : [];

  useEffect(() => {
    if (currentUser && messageId) {
      message.markAsRead(currentUser.id, messageId);
    }
  }, [currentUser, message, messageId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [thread.length]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!currentUser || !selectedMessage) {
      return;
    }

    const result = message.sendChatMessage(currentUser.id, selectedMessage.id, draft);
    if (result.success) {
      setDraft('');
    }
  };

  if (!selectedMessage) {
    return (
      <main className="pm-page pm-chat-page">
        <button className="pm-btn pm-btn-ghost pm-back-btn" type="button" onClick={() => navigate(-1)}>返回</button>
        <EmptyState title="消息不存在" description="这条消息可能已被清理。" iconSrc="/images/admin/empty/no-data-shop.svg" />
      </main>
    );
  }

  const summaryStats = [
    { label: '会话成员', value: selectedMessage.participants?.length || (selectedMessage.type === 'chat' ? 2 : 1) },
    { label: '消息条数', value: thread.length || 1 },
    { label: '状态', value: selectedMessage.read ? '已读' : '未读' },
  ];

  return (
    <main className="pm-page pm-chat-page">
      <header className="pm-chat-header">
        <button className="pm-btn pm-btn-ghost pm-back-btn" type="button" onClick={() => navigate(-1)}>返回</button>
        <div>
          <p className="pm-section-eyebrow">{selectedMessage.type === 'chat' ? 'Merchant Chat' : 'Notice Detail'}</p>
          <h1>{selectedMessage.title}</h1>
          <p className="pm-chat-header-note">
            {selectedMessage.type === 'chat'
              ? '在同一屏内查看上下文、商品线索和回复输入区，适合移动端连续沟通。'
              : '通知详情会保留完整正文和触发时间，方便回看活动与物流提醒。'}
          </p>
        </div>
      </header>

      {selectedMessage.type === 'chat' ? (
        <section className="pm-chat-dialog" aria-label="聊天记录">
          {selectedMessage.productName ? <p className="pm-chat-product">咨询商品：{selectedMessage.productName}</p> : null}
          <div className="pm-chat-summary" aria-label="聊天概览">
            {summaryStats.map((item) => (
              <article key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
          <div className="pm-chat-thread">
            {thread.map((item) => (
              <div key={item.id} className={`pm-chat-bubble${item.sender === '我' ? ' is-own' : ''}`}>
                <span>{item.sender}</span>
                <p>{item.content}</p>
                <small>{item.createdAt}</small>
              </div>
            ))}
            <span ref={threadEndRef} aria-hidden />
          </div>
          <form className="pm-chat-compose" onSubmit={handleSubmit}>
            <textarea
              value={draft}
              rows="2"
              maxLength="120"
              placeholder="输入想咨询的问题"
              onChange={(event) => setDraft(event.target.value)}
            />
            <button className="pm-btn pm-btn-primary" type="submit" disabled={!draft.trim()}>发送</button>
          </form>
        </section>
      ) : (
        <article className="pm-message-detail pm-message-detail-page">
          <span className="pm-message-type">系统通知</span>
          <h2>{selectedMessage.title}</h2>
          <p>{selectedMessage.detail || selectedMessage.content}</p>
          <small>{selectedMessage.createdAt}</small>
        </article>
      )}
    </main>
  );
};

export default ChatPage;
