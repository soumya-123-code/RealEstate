import { useState, useEffect, useRef, useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { FiSend, FiMessageCircle, FiX, FiUser, FiPhone, FiMail, FiUserCheck, FiMapPin, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import apiRequest from '../../lib/apiRequest';
import toast from 'react-hot-toast';
import Seo from '../../components/Seo/Seo';
import { usePageSections } from '../../hooks/usePageSections';
import './Contact.scss';

function Contact() {
  const { currentUser } = useAuth();
  const { socket } = useContext(SocketContext);
  const { value: sectionValue } = usePageSections('contact');
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'chat'
  const [companyInfo, setCompanyInfo] = useState(null);
  // Controls which pane shows on mobile ('list' or 'thread'). Irrelevant on desktop.
  const [mobileView, setMobileView] = useState('list');
  const messagesEndRef = useRef(null);

  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchCompanyInfo();
    if (currentUser) {
      fetchChats();
      fetchAdminUser();
      setFormData(prev => ({
        ...prev,
        name: currentUser.username || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      }));
    }
  }, [currentUser]);

  // Socket.IO: Listen for new messages
  useEffect(() => {
    if (socket && selectedChat) {
      const handleGetMessage = (data) => {
        if (data.chatId === selectedChat.id) {
          setMessages((prev) => [...prev, data]);
          scrollToBottom();
        }
        fetchChats();
      };

      socket.on('getMessage', handleGetMessage);
      return () => {
        socket.off('getMessage', handleGetMessage);
      };
    }
  }, [socket, selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchCompanyInfo = async () => {
    try {
      const res = await apiRequest.get('/company/settings');
      setCompanyInfo(res.data);
    } catch (error) {
      console.log('Company info not available');
    }
  };

  const fetchAdminUser = async () => {
    try {
      const res = await apiRequest.get('/users/admin');
      setAdminUser(res.data);
    } catch (error) {
      // Fallback: find admin from API via existing chats route.
      // If this fails, UI will still show login/chat UI without crashing.
      console.error('Failed to fetch admin user:', error);
      setAdminUser(null);
    }
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await apiRequest.get('/chats');
      setChats(res.data || []);
      if (res.data && res.data.length > 0 && !selectedChat) {
        selectChat(res.data[0].id);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setChats([]);
      } else {
        toast.error(error.response?.data?.message || 'Failed to load chats');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectChat = async (chatId) => {
    try {
      const res = await apiRequest.get(`/chats/${chatId}`);
      setSelectedChat(res.data);
      setMessages(res.data.messages || []);
      setMobileView('thread'); // jump to the thread pane on mobile
      await apiRequest.put(`/chats/read/${chatId}`);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const messageText = newMessage.trim();
    try {
      setSendingMessage(true);
      const res = await apiRequest.post(`/messages/${selectedChat.id}`, { text: messageText });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');

      const receiverId = selectedChat.participants?.find(p => Number(p.userId) !== Number(currentUser.id))?.userId;
      if (socket && receiverId) {
        socket.emit('sendMessage', {
          receiverId,
          chatId: selectedChat.id,
          text: messageText,
          userId: currentUser.id,
          createdAt: new Date().toISOString(),
        });
      }
      fetchChats();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const createNewChat = async () => {
    try {
      if (!adminUser?.id) {
        toast.error('Admin user not available');
        return;
      }

      const receiverId = Number(adminUser.id);
      if (!Number.isFinite(receiverId) || receiverId <= 0) {
        toast.error('Invalid admin user');
        return;
      }

      // Ensure chat exists via backend.
      const res = await apiRequest.post('/chats', { receiverId });
      const chatId = res?.data?.id;
      if (!chatId) throw new Error('Chat id missing from response');

      await fetchChats();
      selectChat(chatId);
      toast.success('Chat with admin started');
    } catch (error) {
      console.error('createNewChat failed:', error);
      toast.error(error?.response?.data?.message || 'Failed to create chat');
    }
  };

  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await apiRequest.post('/cms/contact', formData);
      setSubmitted(true);
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <Seo page="contact" />
      <div className="container-fluid">
        <div className="contact-header">
          <h1>{sectionValue('hero', null, 'title', 'Contact Us')}</h1>
          <p>{sectionValue('hero', null, 'subtitle', 'Get in touch with our team for any queries')}</p>
        </div>

        {/* Tab Switcher */}
        <div className="contact-tabs">
          <button
            className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            📝 Contact Form
          </button>
          {currentUser && (
            <button
              className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              💬 Live Chat
            </button>
          )}
        </div>

        {/* Contact Form Tab */}
        {activeTab === 'form' && (
          <div className="contact-form-section">
            <div className="contact-grid">
              {/* Contact Info */}
              <div className="contact-info">
                <h3>Get In Touch</h3>
                <p>Have a question about a property or need assistance? We&apos;d love to hear from you.</p>

                <div className="info-items">
                  {companyInfo?.phone && (
                    <div className="info-item">
                      <div className="info-icon"><FiPhone size={20} /></div>
                      <div>
                        <h4>Phone</h4>
                        <a href={`tel:${companyInfo.phone}`}>{companyInfo.phone}</a>
                      </div>
                    </div>
                  )}
                  {companyInfo?.email && (
                    <div className="info-item">
                      <div className="info-icon"><FiMail size={20} /></div>
                      <div>
                        <h4>Email</h4>
                        <a href={`mailto:${companyInfo.email}`}>{companyInfo.email}</a>
                      </div>
                    </div>
                  )}
                  {companyInfo?.address && (
                    <div className="info-item">
                      <div className="info-icon"><FiMapPin size={20} /></div>
                      <div>
                        <h4>Address</h4>
                        <p>{companyInfo.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Form */}
              <div className="contact-form-wrapper">
                {submitted ? (
                  <div className="form-success">
                    <FiCheckCircle size={48} />
                    <h3>Message Sent!</h3>
                    <p>Thank you for reaching out. Our team will get back to you shortly.</p>
                    <button className="btn btn-primary" onClick={() => setSubmitted(false)}>
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="contact-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="name">Full Name *</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="phone">Phone</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleFormChange}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="subject">Subject</label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleFormChange}
                          placeholder="How can we help?"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="message">Message *</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleFormChange}
                        placeholder="Tell us about your requirements..."
                        rows={5}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-submit"
                      disabled={submitting}
                    >
                      {submitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <>
            {!currentUser ? (
              <div className="login-prompt">
                <FiMessageCircle size={60} />
                <h3>Login Required</h3>
                <p>You need to be logged in to use the chat feature</p>
                <a href="/login" className="btn btn-primary">Login</a>
              </div>
            ) : (
              <div className={`chat-container ${mobileView === 'thread' ? 'show-thread' : 'show-list'}`}>
                {/* Chat List Sidebar */}
                <div className="chat-sidebar">
                  <div className="sidebar-header">
                    <h3>Messages</h3>
                    <button onClick={createNewChat} className="btn-new-chat" title="Chat with Admin">
                      <FiMessageCircle size={20} />
                    </button>
                  </div>

                  <div className="chat-list">
                    {loading ? (
                      <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading chats...</p>
                      </div>
                    ) : chats.length === 0 ? (
                      <div className="empty-state">
                        <FiMessageCircle size={40} />
                        <p>No chats yet</p>
                        <button onClick={createNewChat} className="btn btn-primary btn-sm">
                          Start Chat with Admin
                        </button>
                      </div>
                    ) : (
                      chats.map(chat => (
                        <div
                          key={chat.id}
                          className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                          onClick={() => selectChat(chat.id)}
                        >
                          <div className="chat-avatar">
                            {chat.receiver?.avatar ? (
                              <img src={chat.receiver.avatar} alt={chat.receiver.username} />
                            ) : (
                              <div className="avatar-placeholder">
                                {chat.receiver?.username?.charAt(0).toUpperCase() || 'A'}
                              </div>
                            )}
                          </div>
                          <div className="chat-info">
                            <div className="chat-header-row">
                              <h4>{chat.receiver?.username || 'Support'}</h4>
                              {chat.seenBy && !chat.seenBy.includes(currentUser.id) && (
                                <span className="unread-badge"></span>
                              )}
                            </div>
                            <p className="last-message">{chat.lastMessage || 'No messages yet'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Chat Messages Area */}
                <div className="chat-main">
                  {selectedChat ? (
                    <>
                      <div className="chat-header">
                        <div className="chat-user">
                          <button className="btn-back-mobile" onClick={handleBackToList} aria-label="Back to chat list">
                            <FiArrowLeft size={20} />
                          </button>
                          <div className="user-avatar">
                            {selectedChat.receiver?.avatar ? (
                              <img src={selectedChat.receiver.avatar} alt={selectedChat.receiver.username} />
                            ) : (
                              <div className="avatar-placeholder">
                                <FiUser />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3>{selectedChat.receiver?.username || 'Support Team'}</h3>
                            <span className="user-status">
                              {socket ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="messages-container">
                        {messages.length === 0 ? (
                          <div className="no-messages">
                            <FiMessageCircle size={60} />
                            <p>No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          messages.map((message, index) => (
                            <div
                              key={message.id || index}
                              className={`message ${message.user?.id === currentUser.id ? 'sent' : 'received'}`}
                            >
                              <div className="message-content">
                                <p>{message.text}</p>
                                <span className="message-time">
                                  {new Date(message.createdAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      <form onSubmit={sendMessage} className="message-input-form">
                        <input
                          type="text"
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          disabled={sendingMessage}
                        />
                        <button type="submit" disabled={sendingMessage || !newMessage.trim()}>
                          <FiSend size={20} />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="no-chat-selected">
                      <FiMessageCircle size={80} />
                      <h3>Select a chat to start messaging</h3>
                      <p>Choose a conversation from the sidebar or start a new one</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Contact;