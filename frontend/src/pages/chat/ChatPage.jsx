import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../features/chat/chatApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import getSocket from '../../lib/socketClient.js';
import '../../styles/pages/chat.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
}

function decodeUserIdFromToken() {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || null;
  } catch {
    return null;
  }
}

function getOtherParticipant(conv, userId) {
  if (!userId || !conv?.participants) return null;
  const uid = String(userId);
  return conv.participants.find((p) => String(p._id || p) !== uid) || null;
}

function ChatPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = decodeUserIdFromToken();

  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [chatError, setChatError] = useState('');
  const [startChatError, setStartChatError] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const messagesContainerRef = useRef(null);
  const optimisticIdRef = useRef(0);

  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const { data: orgUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['orgUsers'],
    queryFn: () => chatApi.getOrgUsers().then((r) => r.data.data),
    enabled: showNewChat,
  });

  const activeConv = conversations.find((c) => c._id === activeConvId);
  const otherUser = activeConv ? getOtherParticipant(activeConv, userId) : null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!activeConvId) return;
    setMessages([]);
    setChatError('');

    chatApi.getMessages(activeConvId, 50).then((r) => {
      if (r.data?.data) {
        setMessages(r.data.data.reverse());
      }
      chatApi.markRead(activeConvId);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }).catch(() => {
      setChatError('Failed to load messages');
    });

    const socket = getSocket();
    if (socket.connected) {
      socket.emit('chat:join', activeConvId);
    }

    return () => {
      if (socket.connected) {
        socket.emit('chat:leave', activeConvId);
      }
    };
  }, [activeConvId, queryClient]);

  useEffect(() => {
    const socket = getSocket();

    const handleMessage = (data) => {
      const msgId = data.message._id;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msgId || m._id?.startsWith('opt-'))) {
          return prev.map((m) => {
            if (m._id?.startsWith('opt-')) return data.message;
            if (m._id === msgId) return data.message;
            return m;
          });
        }
        return [...prev, data.message];
      });

      if (data.conversation?._id === activeConvId) {
        chatApi.markRead(activeConvId);
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleUnread = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleTyping = (data) => {
      if (data.conversationId === activeConvId && String(data.userId) !== String(userId)) {
        setTypingUsers((prev) => ({ ...prev, [data.userId]: true }));
      }
    };

    const handleTypingStop = (data) => {
      if (data.conversationId === activeConvId) {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[data.userId];
          return next;
        });
      }
    };

    const handleError = (data) => {
      setChatError(data.message || 'Failed to send message');
    };

    socket.on('chat:message:new', handleMessage);
    socket.on('chat:unread:update', handleUnread);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:typing:stop', handleTypingStop);
    socket.on('chat:error', handleError);

    return () => {
      socket.off('chat:message:new', handleMessage);
      socket.off('chat:unread:update', handleUnread);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:typing:stop', handleTypingStop);
      socket.off('chat:error', handleError);
    };
  }, [activeConvId, userId, queryClient]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !activeConvId) return;

    setChatError('');

    optimisticIdRef.current += 1;
    const optimisticMsg = {
      _id: `opt-${optimisticIdRef.current}`,
      conversationId: activeConvId,
      senderId: { _id: userId, name: user?.name },
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');

    if (isTypingRef.current) {
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('chat:typing:stop', { conversationId: activeConvId });
      }
      isTypingRef.current = false;
    }

    const socket = getSocket();
    if (!socket.connected) {
      chatApi.sendMessage(activeConvId, text)
        .then((r) => {
          setMessages((prev) =>
            prev.map((m) => (m._id === optimisticMsg._id ? r.data.data.message : m))
          );
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        })
        .catch((err) => {
          setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
          setChatError(err.response?.data?.error?.message || 'Failed to send message');
        });
      return;
    }

    socket.emit('chat:send', { conversationId: activeConvId, text });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    const socket = getSocket();
    if (!socket.connected || !activeConvId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('chat:typing', { conversationId: activeConvId });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('chat:typing:stop', { conversationId: activeConvId });
    }, 2000);
  };

  const handleStartChat = async (otherUserId) => {
    setStartChatError('');
    try {
      const res = await chatApi.startConversation(otherUserId);
      const conv = res.data.data;
      if (!conv || !conv._id) {
        setStartChatError('Failed to create conversation');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConvId(conv._id);
      setShowNewChat(false);
    } catch (err) {
      setStartChatError(err.response?.data?.error?.message || 'Failed to start chat');
    }
  };

  const filteredUsers = orgUsers.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (u.name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term);
  });

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2 className="chat-sidebar-title">Messages</h2>
          <button
            className="chat-new-btn"
            onClick={() => { setShowNewChat(!showNewChat); setStartChatError(''); }}
            title="Start new chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {showNewChat && (
          <div className="chat-new-panel">
            <input
              className="chat-search-input"
              type="text"
              placeholder="Search people..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setStartChatError(''); }}
              autoFocus
            />
            {startChatError && <div className="chat-page-error">{startChatError}</div>}
            <div className="chat-user-list">
              {usersLoading && <div className="chat-empty-text">Loading users...</div>}
              {!usersLoading && filteredUsers.length === 0 && (
                <div className="chat-empty-text">
                  {searchTerm ? 'No users match your search' : 'No other users available'}
                </div>
              )}
              {filteredUsers.map((u) => (
                <button
                  key={u._id}
                  className="chat-user-item"
                  onClick={() => handleStartChat(u._id)}
                >
                  <div className="chat-avatar chat-avatar--sm">
                    {u.profilePicture ? (
                      <img src={u.profilePicture} alt={u.name} />
                    ) : (
                      <span>{getInitials(u.name)}</span>
                    )}
                  </div>
                  <div className="chat-user-info">
                    <span className="chat-user-name">{u.name}</span>
                    <span className="chat-user-role">{u.role?.replace('_', ' ')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chat-conv-list">
          {convsLoading && <div className="chat-empty-text">Loading conversations...</div>}
          {!convsLoading && conversations.length === 0 && (
            <div className="chat-empty-text">No conversations yet. Click + to start one.</div>
          )}
          {conversations.map((conv) => {
            const other = getOtherParticipant(conv, userId);
            const isActive = conv._id === activeConvId;
            const unread = conv.unread || 0;
            return (
              <button
                key={conv._id}
                className={`chat-conv-item${isActive ? ' active' : ''}`}
                onClick={() => {
                  setActiveConvId(conv._id);
                  setShowNewChat(false);
                  setChatError('');
                }}
              >
                <div className="chat-avatar">
                  {other?.profilePicture ? (
                    <img src={other.profilePicture} alt={other.name} />
                  ) : (
                    <span>{getInitials(other?.name)}</span>
                  )}
                </div>
                <div className="chat-conv-info">
                  <div className="chat-conv-top">
                    <span className="chat-conv-name">{other?.name || 'Unknown'}</span>
                    <span className="chat-conv-time">{timeAgo(conv.lastMessageAt)}</span>
                  </div>
                  <div className="chat-conv-bottom">
                    <span className="chat-conv-preview">
                      {conv.lastMessage || 'No messages yet'}
                    </span>
                    {unread > 0 && <span className="chat-conv-badge">{unread}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="chat-main">
        {!activeConvId ? (
          <div className="chat-placeholder">
            <div className="chat-placeholder-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>Select a conversation</h3>
            <p>Choose from existing chats or start a new one</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-avatar chat-avatar--sm">
                {otherUser?.profilePicture ? (
                  <img src={otherUser.profilePicture} alt={otherUser.name} />
                ) : (
                  <span>{getInitials(otherUser?.name)}</span>
                )}
              </div>
              <div className="chat-header-info">
                <span className="chat-header-name">{otherUser?.name || 'Unknown'}</span>
                <span className="chat-header-role">{otherUser?.role?.replace('_', ' ')}</span>
              </div>
            </div>

            {chatError && <div className="chat-page-error chat-page-error--bar">{chatError}</div>}

            <div className="chat-messages" ref={messagesContainerRef}>
              {messages.length === 0 && (
                <div className="chat-no-messages">No messages yet. Say hello!</div>
              )}
              {messages.map((msg) => {
                const isMine = String(msg.senderId?._id || msg.senderId) === String(userId);
                const isOptimistic = msg._id?.startsWith('opt-');
                return (
                  <div key={msg._id} className={`chat-msg${isMine ? ' chat-msg--mine' : ''}`}>
                    {!isMine && (
                      <div className="chat-avatar chat-avatar--xs">
                        {msg.senderId?.profilePicture ? (
                          <img src={msg.senderId.profilePicture} alt={msg.senderId.name} />
                        ) : (
                          <span>{getInitials(msg.senderId?.name)}</span>
                        )}
                      </div>
                    )}
                    <div className="chat-msg-body">
                      <div className={`chat-msg-bubble${isOptimistic ? ' chat-msg-bubble--opt' : ''}`}>{msg.text}</div>
                      <span className="chat-msg-time">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {Object.keys(typingUsers).length > 0 && (
              <div className="chat-typing">Typing...</div>
            )}

            <div className="chat-input-bar">
              <textarea
                className="chat-input"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!inputText.trim()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ChatPage;
