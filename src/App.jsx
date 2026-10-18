import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import MicrophoneTest from "./components/MicrophoneTest";
import VoiceCallTest from "./components/VoiceCallTest";
import { sounds } from "./utils/audioEffects";
import './App.css';

const mockConversations = [
  { id: 1, name: 'Design Collective', initials: 'DC', color: 'peach', preview: 'Maya: the new motion feels ✨', time: '2m', unread: 3, online: true, group: true },
  { id: 2, name: 'Ava Mitchell', initials: 'AM', color: 'violet', preview: 'That sounds perfect!', time: '11m', online: true },
  { id: 3, name: 'Build in Public', initials: 'BP', color: 'mint', preview: 'Noah shared a link', time: '28m', unread: 1, group: true },
  { id: 4, name: 'Leo Chen', initials: 'LC', color: 'blue', preview: 'Voice message · 0:14', time: '1h', online: false },
  { id: 5, name: 'Weekend people 🪩', initials: 'WP', color: 'pink', preview: 'You: count me in', time: '3h', group: true },
];

const channels = ['general', 'design-lab', 'show-and-tell', 'random'];

const Icon = ({ name, size = 18 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    hash: <><path d="M5 9h14M4 15h14M10 3 8 21M16 3l-2 18" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.1 1.8-1.8 3.1-2.1-.5a8 8 0 0 1-1.6.9l-.6 2.1h-3.6l-.6-2.1a8 8 0 0 1-1.6-.9l-2.1.5-1.8-3.1 1.1-1.8a7 7 0 0 1 0-1.9l-1.1-1.8 1.8-3.1 2.1.5a8 8 0 0 1 1.6-.9l.6-2.1h3.6l.6 2.1a8 8 0 0 1 1.6.9l2.1-.5 1.8 3.1-1.1 1.8a7 7 0 0 1 0 1.9Z" transform="translate(0 -2) scale(1 .92)" /></>,
    paperclip: <><path d="m21 11.5-8.5 8.5a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L9.5 19" /></>,
    smile: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    video: <><rect x="3" y="5" width="13" height="14" rx="3" /><path d="m16 10 5-3v10l-5-3" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.9L7.1 10.3a16 16 0 0 0 6.6 6.6l1.9-1.9a2 2 0 0 1 1.9-.6l2.8.5a2 2 0 0 1 1.7 2Z" />,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    inbox: <><path d="M4 4h16l2 11v5H2v-5L4 4Z" /><path d="M2 15h6l2 2h4l2-2h6" /></>,
    sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    user: <><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></>,
    compass: <><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.2" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></>
  };
  return <svg {...common}>{paths[name] || paths.sparkle}</svg>;
};

function App() {
  const [viewMode, setViewMode] = useState('workspace'); // 'workspace' | 'dms'
  const [activeChat, setActiveChat] = useState(1);
  const [activeChannel, setActiveChannel] = useState('general');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected');
  const [sseStatus, setSseStatus] = useState('disconnected');
  const [notifications, setNotifications] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimerRef = useRef(null);
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const activeWorkspaceRef = useRef(null);
  const [channelItems, setChannelItems] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const messagesEndRef = useRef(null);

  // Direct messaging state
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [activeDMUser, setActiveDMUser] = useState(null);
  const [activeDMChannel, setActiveDMChannel] = useState(null);

  // File attachments state
  const fileInputRef = useRef(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => { activeWorkspaceRef.current = activeWorkspace; }, [activeWorkspace]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [query, setQuery] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [callMode, setCallMode] = useState(null); // 'voice' | 'video' | null
  const [showNewChat, setShowNewChat] = useState(false);
  const [toast, setToast] = useState('');
  const [authMode, setAuthMode] = useState('');
  const [auth, setAuth] = useState({ username: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  // Profile options menu & modals state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showMicModal, setShowMicModal] = useState(false);
  const [userCustomStatus, setUserCustomStatus] = useState('online');
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!showProfileMenu) return;
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showProfileMenu]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowProfileMenu(false);
        setShowAccountModal(false);
        setShowMicModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out of ConnectCord?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('connectcord_user');
      setUser(null);
      setShowProfileMenu(false);
      setShowAccountModal(false);
      notify('Signed out successfully.');
      sounds.disconnect();
    }
  };

  // Draggable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('connectcord_sidebar_width');
    return saved ? Math.max(180, Math.min(480, parseInt(saved, 10))) : 274;
  });
  const [detailsWidth, setDetailsWidth] = useState(() => {
    const saved = localStorage.getItem('connectcord_details_width');
    return saved ? Math.max(200, Math.min(480, parseInt(saved, 10))) : 286;
  });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingDetails, setIsDraggingDetails] = useState(false);

  useEffect(() => {
    localStorage.setItem('connectcord_sidebar_width', String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    localStorage.setItem('connectcord_details_width', String(detailsWidth));
  }, [detailsWidth]);

  const startSidebarResize = (e) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(180, Math.min(480, startWidth + delta));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDraggingSidebar(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const startDetailsResize = (e) => {
    e.preventDefault();
    setIsDraggingDetails(true);
    const startX = e.clientX;
    const startWidth = detailsWidth;

    const onMouseMove = (moveEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.max(200, Math.min(480, startWidth + delta));
      setDetailsWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDraggingDetails(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('connectcord_user') || 'null'); } catch { return null; }
  });

  const token = () => localStorage.getItem('token');
  const api = async (path, options = {}) => {
    const response = await fetch(`http://localhost:5000${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  };

  // Derive the active channel object depending on viewMode
  const currentChannel = useMemo(() => {
    if (viewMode === 'dms') {
      return activeDMChannel || null;
    }
    if (!activeChannel) return null;
    return channelItems.find(c => c.name === activeChannel) || null;
  }, [viewMode, activeDMChannel, channelItems, activeChannel]);

  const filteredUsers = useMemo(() => {
    return registeredUsers.filter(u =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(query.toLowerCase()))
    );
  }, [registeredUsers, query]);

  // Restore the session by asking the backend to verify the saved token.
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;

    fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Session expired');
        return data.user;
      })
      .then(currentUser => {
        localStorage.setItem('connectcord_user', JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('connectcord_user');
        setUser(null);
      });
  }, []);

  // Fetch registered users list whenever signed in
  useEffect(() => {
    if (!user || !token()) {
      setRegisteredUsers([]);
      return;
    }
    api('/api/auth/users')
      .then(data => {
        setRegisteredUsers(data.users || []);
      })
      .catch(() => {});
  }, [user, viewMode]);

  // When activeDMUser changes, open or fetch their DM channel
  useEffect(() => {
    if (!user || !token() || viewMode !== 'dms') return;
    if (!activeDMUser) {
      setActiveDMChannel(null);
      return;
    }
    api(`/api/messages/dm/${activeDMUser.id}`)
      .then(data => {
        setActiveDMChannel(data.channel);
      })
      .catch(err => notify(err.message));
  }, [activeDMUser, viewMode, user]);

  // Keep one authenticated Socket.IO connection while a user is signed in.
  useEffect(() => {
    if (!user || !token()) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setRealtimeStatus('disconnected');
      return;
    }

    const socket = io('http://localhost:5000', {
      auth: { token: token() },
      reconnection: true,
      reconnectionAttempts: 8,
    });
    socketRef.current = socket;

    socket.on('connect', () => setRealtimeStatus('connected'));
    socket.on('disconnect', () => setRealtimeStatus('disconnected'));
    socket.on('connect_error', (error) => {
      setRealtimeStatus('disconnected');
      console.warn('ConnectCord real-time connection:', error.message);
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      setRealtimeStatus('disconnected');
    };
  }, [user]);

  // Phase 6: authenticated Server-Sent Events (SSE) stream.
  useEffect(() => {
    if (!user || !token()) { setSseStatus('disconnected'); return; }
    const controller = new AbortController();
    let retryDelay = 1000;
    let disposed = false;

    const readStream = async () => {
      while (!disposed) {
        try {
          const response = await fetch('http://localhost:5000/api/events/stream', {
            headers: { Authorization: `Bearer ${token()}`, Accept: 'text/event-stream' },
            signal: controller.signal,
          });
          if (!response.ok || !response.body) throw new Error(`SSE connection failed (${response.status})`);
          setSseStatus('connected');
          retryDelay = 1000;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (!disposed) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const frames = buffer.split(/\r?\n\r?\n/);
            buffer = frames.pop() || '';
            for (const frame of frames) {
              const eventLine = frame.split(/\r?\n/).find(line => line.startsWith('event:'));
              const dataLine = frame.split(/\r?\n/).find(line => line.startsWith('data:'));
              if (!eventLine || !dataLine) continue;
              const eventName = eventLine.slice(6).trim();
              if (eventName === 'notification') {
                try {
                  const item = JSON.parse(dataLine.slice(5).trim());
                  setNotifications(prev => [item, ...prev].slice(0, 20));
                  notify(`${item.title}: ${item.message}`);
                  sounds.playMessagePing();
                  if (item.type === 'workspace_deleted' && item.workspaceId) {
                    setWorkspaces(prev => {
                      const next = prev.filter(w => String(w._id) !== String(item.workspaceId));
                      if (String(activeWorkspaceRef.current?._id) === String(item.workspaceId)) {
                        const nextWs = next[0] || null;
                        setActiveWorkspace(nextWs);
                        setActiveChannel(nextWs ? 'general' : null);
                      }
                      return next;
                    });
                  } else if (item.type === 'channel_deleted' && item.workspaceId) {
                    if (String(activeWorkspaceRef.current?._id) === String(item.workspaceId)) {
                      setChannelItems(prev => {
                        const next = prev.filter(c => String(c._id) !== String(item.channelId));
                        setActiveChannel(curr => (next.some(c => c.name === curr) ? curr : (next[0]?.name || null)));
                        return next;
                      });
                    }
                  } else if ((item.type === 'channel_created' || item.type === 'member_joined') && item.workspaceId) {
                    fetch(`http://localhost:5000/api/workspaces/${item.workspaceId}`, {
                      headers: { Authorization: `Bearer ${token()}` },
                    }).then(async res => {
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.message || 'Could not refresh workspace data');
                      if (String(activeWorkspaceRef.current?._id) === String(item.workspaceId)) {
                        setChannelItems(data.channels || []);
                        if (data.workspace?.members) setWorkspaceMembers(data.workspace.members);
                      }
                    }).catch(error => console.warn('Could not refresh workspace data:', error.message));
                  }
                } catch (error) { console.warn('Could not parse SSE notification:', error); }
              }
            }
          }
        } catch (error) {
          if (error.name === 'AbortError' || disposed) break;
          console.warn('ConnectCord SSE stream:', error.message);
        }
        if (!disposed) {
          setSseStatus('disconnected');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay = Math.min(retryDelay * 2, 15000);
        }
      }
    };

    readStream();
    return () => { disposed = true; controller.abort(); setSseStatus('disconnected'); };
  }, [user]);

  // Join the selected channel (workspace channel or DM channel) and listen for messages
  useEffect(() => {
    const channel = currentChannel;
    const socket = socketRef.current;
    if (!channel || !socket || !user) return;

    const joinChannel = () => {
      socket.emit('channel:join', channel._id, (result) => {
        if (!result?.ok) notify(result?.message || 'Could not join real-time channel.');
      });
    };

    const onNewMessage = (m) => {
      if (String(m.channel) !== String(channel._id)) return;
      if (m.author?._id !== user?.id) {
        sounds.playMessagePing();
      }
      setMessages(prev => {
        if (prev.some(existing => existing.id === m._id)) return prev;
        const username = m.author?.username || 'Unknown';
        return [...prev, {
          id: m._id,
          author: username,
          initials: username.slice(0, 2).toUpperCase(),
          color: m.author?._id === user?.id ? 'orange' : 'peach',
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: m.content,
          attachments: m.attachments || [],
          mine: m.author?._id === user?.id,
          reactions: m.reactions || [],
        }];
      });
    };

    const onMessageReaction = (data) => {
      if (String(data.channelId) !== String(channel._id)) return;
      setMessages(prev =>
        prev.map(msg =>
          String(msg.id) === String(data.messageId)
            ? { ...msg, reactions: data.reactions || [] }
            : msg
        )
      );
    };

    if (socket.connected) joinChannel();
    socket.on('connect', joinChannel);
    const onTypingChanged = (event) => {
      if (String(event.userId) === String(user?.id)) return;
      setTypingUsers(prev => {
        const withoutUser = prev.filter(person => String(person.userId) !== String(event.userId));
        return event.isTyping ? [...withoutUser, { userId: event.userId, username: event.username || 'Someone' }] : withoutUser;
      });
    };
    const onPresenceChanged = (event) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        if (event.status === 'online') next.add(String(event.userId));
        else next.delete(String(event.userId));
        return next;
      });
    };

    socket.on('message:new', onNewMessage);
    socket.on('message:reaction', onMessageReaction);
    socket.on('typing:changed', onTypingChanged);
    socket.on('presence:changed', onPresenceChanged);

    return () => {
      socket.off('connect', joinChannel);
      socket.off('message:new', onNewMessage);
      socket.off('message:reaction', onMessageReaction);
      socket.off('typing:changed', onTypingChanged);
      socket.off('presence:changed', onPresenceChanged);
      socket.emit('typing:stop', channel._id);
      socket.emit('channel:leave', channel._id);
      setTypingUsers([]);
    };
  }, [currentChannel?._id, user, realtimeStatus]);

  // Load workspaces on sign in
  useEffect(() => {
    if (!user || !token()) { setWorkspaces([]); setActiveWorkspace(null); setChannelItems([]); setMessages([]); return; }
    api('/api/workspaces').then(data => {
      setWorkspaces(data.workspaces || []);
      const chosen = data.workspaces?.[0];
      if (chosen) setActiveWorkspace(chosen);
      else { setActiveWorkspace(null); setChannelItems([]); setMessages([]); }
    }).catch(err => notify(err.message));
  }, [user]);

  // Load workspace channels
  useEffect(() => {
    if (!activeWorkspace || !token() || viewMode !== 'workspace') return;
    api(`/api/workspaces/${activeWorkspace._id}`).then(data => {
      setChannelItems(data.channels || []);
      if (data.workspace?.members) setWorkspaceMembers(data.workspace.members);
      const chosen = data.channels?.find(c => c.name === activeChannel) || data.channels?.[0];
      if (chosen && chosen.name !== activeChannel) setActiveChannel(chosen.name);
    }).catch(err => notify(err.message));
  }, [activeWorkspace, viewMode]);

  // Fetch messages whenever currentChannel changes
  useEffect(() => {
    const channel = currentChannel;
    if (!channel || !token()) {
      if (!user) {
        setMessages(mockConversations);
      } else {
        setMessages([]);
      }
      return;
    }
    setLoadingMessages(true);
    api(`/api/messages/channels/${channel._id}`).then(data => setMessages((data.messages || []).map(m => ({
      id: m._id,
      author: m.author?.username || 'Unknown',
      initials: (m.author?.username || '?').slice(0, 2).toUpperCase(),
      color: m.author?._id === user?.id ? 'orange' : 'peach',
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: m.content,
      attachments: m.attachments || [],
      mine: m.author?._id === user?.id,
      reactions: m.reactions || [],
    })))).catch(err => notify(err.message)).finally(() => setLoadingMessages(false));
  }, [currentChannel?._id, user]);

  const reactToMessage = async (messageId, emoji) => {
    if (!user || !token()) {
      notify('Sign in to react to messages.');
      return;
    }
    try {
      await api(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
    } catch (err) {
      notify(err.message);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      notify('Attachment exceeds 20MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingAttachment({
        file,
        dataUrl: reader.result,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const channel = currentChannel;
    if (!user || !channel) {
      notify(viewMode === 'dms' ? 'Select a user to send a direct message.' : 'Sign in and select a channel to send messages.');
      return;
    }
    if (!message.trim() && !pendingAttachment) return;

    const content = message.trim();
    const attachmentToUpload = pendingAttachment;
    setMessage('');
    setPendingAttachment(null);
    socketRef.current?.emit('typing:stop', channel._id);

    try {
      let attachments = [];
      if (attachmentToUpload) {
        const uploadRes = await api('/api/messages/upload', {
          method: 'POST',
          body: JSON.stringify({
            filename: attachmentToUpload.filename,
            contentType: attachmentToUpload.contentType,
            data: attachmentToUpload.dataUrl,
          }),
        });
        attachments = [{
          url: uploadRes.url,
          filename: uploadRes.filename,
          contentType: uploadRes.contentType,
          size: uploadRes.size,
        }];
      }

      const data = await api(`/api/messages/channels/${channel._id}`, {
        method: 'POST',
        body: JSON.stringify({ content, attachments }),
      });
      if (!data.message) throw new Error('Message was saved but the server returned no message.');
    } catch (err) {
      setMessage(content);
      setPendingAttachment(attachmentToUpload);
      notify(err.message);
    }
  };

  const createWorkspace = async () => {
    if (!user) { setAuthMode('login'); return; }
    const name = window.prompt('Name your new workspace');
    if (!name?.trim()) return;
    try {
      const data = await api('/api/workspaces', { method: 'POST', body: JSON.stringify({ name }) });
      const workspace = data.workspace;
      setWorkspaces(prev => [workspace, ...prev]);
      setActiveWorkspace(workspace);
      setActiveChannel('general');
      setViewMode('workspace');
      notify('Workspace created!');
    } catch (err) { notify(err.message); }
  };

  const joinWorkspace = async () => {
    if (!user) { setAuthMode('login'); return; }
    const inviteCode = window.prompt('Enter the workspace invite code');
    if (!inviteCode?.trim()) return;
    try {
      const data = await api('/api/workspaces/join', {
        method: 'POST', body: JSON.stringify({ inviteCode }),
      });
      const workspace = data.workspace;
      setWorkspaces(prev => prev.some(item => String(item._id) === String(workspace._id))
        ? prev : [workspace, ...prev]);
      setActiveWorkspace(workspace);
      setActiveChannel('general');
      setViewMode('workspace');
      notify(data.alreadyMember ? 'You already belong to this workspace.' : `Joined ${workspace.name}!`);
    } catch (err) { notify(err.message); }
  };

  const shareWorkspace = () => {
    if (!activeWorkspace) { notify('Select a workspace first.'); return; }
    const code = activeWorkspace.inviteCode;
    if (!code) { notify('Reload the workspace list and try again.'); return; }
    window.prompt(`Share this invite code with friends to join ${activeWorkspace.name}:`, code);
  };

  const createChannel = async () => {
    if (!activeWorkspace) { notify('Create a workspace first.'); return; }
    const name = window.prompt('Channel name (letters, numbers, hyphens)');
    if (!name?.trim()) return;
    try {
      const data = await api(`/api/workspaces/${activeWorkspace._id}/channels`, { method: 'POST', body: JSON.stringify({ name }) });
      setChannelItems(prev => [...prev, data.channel]);
      setActiveChannel(data.channel.name);
      notify('Channel created!');
    } catch (err) { notify(err.message); }
  };

  const deleteChannelById = async (channelId, channelName) => {
    if (!user || !activeWorkspace) return;
    if (channelItems.length <= 1) {
      notify('A workspace must retain at least one channel.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete #${channelName}?\n\nAll messages in this channel will be permanently removed.`)) {
      return;
    }
    try {
      await api(`/api/workspaces/${activeWorkspace._id}/channels/${channelId}`, { method: 'DELETE' });
      notify(`Channel #${channelName} deleted.`);
      sounds.notification();
      setChannelItems(prev => {
        const next = prev.filter(c => String(c._id) !== String(channelId));
        if (activeChannel === channelName) {
          setActiveChannel(next[0]?.name || null);
        }
        return next;
      });
    } catch (err) {
      notify(err.message || 'Could not delete channel');
    }
  };

  const deleteWorkspaceById = async (workspaceId, workspaceName) => {
    if (!user) return;
    const ws = workspaces.find(w => String(w._id) === String(workspaceId)) || activeWorkspace;
    const isOwner = String(ws?.owner?._id || ws?.owner) === String(user.id);
    if (!isOwner) {
      notify('Only the workspace owner can delete this workspace.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete "${workspaceName || 'this workspace'}"?\n\nThis will delete all channels, messages, and attachments in it. This action cannot be undone.`)) {
      return;
    }
    try {
      await api(`/api/workspaces/${workspaceId}`, { method: 'DELETE' });
      notify(`Workspace "${workspaceName}" deleted.`);
      sounds.disconnect();
      setWorkspaces(prev => {
        const next = prev.filter(w => String(w._id) !== String(workspaceId));
        if (String(activeWorkspace?._id) === String(workspaceId)) {
          const nextWs = next[0] || null;
          setActiveWorkspace(nextWs);
          setActiveChannel(nextWs ? 'general' : null);
        }
        return next;
      });
    } catch (err) {
      notify(err.message || 'Could not delete workspace');
    }
  };

  const notify = (text) => { setToast(text); window.setTimeout(() => setToast(''), 2600); };

  const submitAuth = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const endpoint = authMode === 'register' ? 'register' : 'login';
      const payload = authMode === 'register' ? auth : { email: auth.email, password: auth.password };
      const response = await fetch(`http://localhost:5000/api/auth/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Something went wrong.');
      if (data.token) localStorage.setItem('token', data.token);
      const safeUser = data.user || { username: auth.username || auth.email.split('@')[0], email: auth.email };
      localStorage.setItem('connectcord_user', JSON.stringify(safeUser));
      setUser(safeUser);
      setAuthMode('');
      notify(authMode === 'register' ? 'Account created — welcome to ConnectCord!' : 'You’re back. Welcome in!');
    } catch (err) { notify(err.message === 'Failed to fetch' ? 'Could not reach the server. Start the backend on port 5000.' : err.message); }
    finally { setBusy(false); }
  };

  const chatTitle = viewMode === 'dms'
    ? (activeDMUser ? `@${activeDMUser.username}` : 'Direct Messages')
    : (activeChannel ? `#${activeChannel}` : (activeWorkspace?.name || 'ConnectCord'));

  const chatTag = viewMode === 'dms'
    ? 'DIRECT'
    : (user && activeWorkspace ? activeWorkspace.name.toUpperCase() : 'WORKSPACE');

  const isTargetOnline = viewMode === 'dms' && activeDMUser
    ? onlineUserIds.has(String(activeDMUser.id))
    : false;

  return (
    <main
      className={`app-shell ${isDraggingSidebar || isDraggingDetails ? 'is-resizing' : ''}`}
      style={{
        gridTemplateColumns: `76px ${sidebarWidth}px 4px minmax(320px, 1fr) ${showDetails ? `4px ${detailsWidth}px` : '0px 0px'}`
      }}
    >
      {/* RAIL: Leftmost navigation (Discord home vs Workspaces) */}
      <aside className="workspace-rail">
        <button
          className={`brand-mark ${viewMode === 'dms' ? 'selected' : ''}`}
          aria-label="Direct Messages"
          title="Direct Messages & Friends"
          onClick={() => {
            setViewMode('dms');
            setCallMode(null);
          }}
        >
          <span className="brand-symbol"><i /><i /><i /></span>
        </button>

        <div className="rail-divider" />

        {user ? workspaces.map((workspace, index) => (
          <button
            key={workspace._id}
            className={`rail-server ${viewMode === 'workspace' && String(activeWorkspace?._id) === String(workspace._id) ? 'selected' : ''}`}
            title={workspace.name}
            onClick={() => {
              setViewMode('workspace');
              setActiveWorkspace(workspace);
              setActiveChannel('general');
              setCallMode(null);
            }}
          >
            <span className={`server-monogram ${['', 'mint', 'violet'][index % 3]}`}>
              {workspace.name.slice(0, 2).toLowerCase()}
            </span>
            {viewMode === 'workspace' && String(activeWorkspace?._id) === String(workspace._id) && <span className="rail-indicator" />}
          </button>
        )) : (
          <>
            <button className="rail-server selected" title="Design Collective" onClick={() => setActiveChat(1)}>
              <span className="server-monogram">dc</span>
              <span className="rail-indicator" />
            </button>
            <button className="rail-server" title="Build in Public" onClick={() => setActiveChat(3)}>
              <span className="server-monogram mint">bp</span>
            </button>
            <button className="rail-server" title="Weekend people" onClick={() => setActiveChat(5)}>
              <span className="server-monogram violet">w.</span>
            </button>
          </>
        )}

        <button className="rail-add" title="Create a workspace" onClick={createWorkspace}><Icon name="plus" size={21} /></button>
        <button className="rail-add" title="Join a workspace with an invite code" onClick={joinWorkspace}><Icon name="compass" size={20} /></button>

        <div className="rail-bottom">
          <button
            className="rail-add notification-rail-btn"
            title={`Notifications (${notifications.length})`}
            onClick={() => notify(notifications.length ? `${notifications.length} recent notification(s). Latest: ${notifications[0].title}` : 'You’re all caught up!')}
          >
            <Icon name="bell" size={19} />
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length > 9 ? '9+' : notifications.length}</span>
            )}
          </button>
          <div className="avatar avatar-orange user-rail" onClick={() => setAuthMode('login')} title="Your profile">
            {user?.username?.slice(0, 2).toUpperCase() || 'YR'}
            <span className="presence online" />
          </div>
        </div>
      </aside>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div>
            <p className="eyebrow">{viewMode === 'dms' ? 'DIRECT MESSAGES' : 'YOUR SPACE'}</p>
            <button
              className="workspace-title"
              onClick={() => {
                if (viewMode === 'workspace') {
                  if (workspaces.length > 1) {
                    const idx = workspaces.findIndex(w => w._id === activeWorkspace?._id);
                    const next = workspaces[(idx + 1) % workspaces.length];
                    setActiveWorkspace(next);
                    setActiveChannel('general');
                  } else {
                    createWorkspace();
                  }
                } else {
                  setViewMode('workspace');
                }
              }}
            >
              {viewMode === 'dms' ? 'Direct Messages' : (activeWorkspace?.name || 'Your workspace')}
            </button>
          </div>
          <button className="icon-button subtle" onClick={() => setShowNewChat(true)} aria-label="New workspace or connection" title="New workspace / connection">
            <Icon name="plus" />
          </button>
        </div>

        <div className="workspace-status">
          <span className={`status-pulse ${realtimeStatus === "connected" ? "is-live" : ""}`} />
          {realtimeStatus === "connected" ? "Live connection" : "Connecting…"}
          <span title={sseStatus === 'connected' ? 'SSE notifications connected' : 'SSE notifications reconnecting'} style={{ fontSize: 9, color: sseStatus === 'connected' ? '#82b997' : '#8d877f' }}>
            · SSE {sseStatus === 'connected' ? 'live' : 'offline'}
          </span>
          <span className="status-spark">✳</span>
        </div>

        <label className="searchbox">
          <Icon name="search" size={16} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={viewMode === 'dms' ? "Find people..." : "Find a conversation..."} />
          <kbd>⌘ K</kbd>
        </label>

        {viewMode === 'workspace' ? (
          <>
            <div className="sidebar-section-head">
              <span>YOUR CHANNELS</span>
              <button onClick={createChannel} aria-label="Add channel" title="Add channel"><Icon name="plus" size={15} /></button>
            </div>
            <nav className="channel-list">
              {(channelItems.length ? channelItems : (user ? [] : channels.map(c => ({ name: c, _id: c })))).map((channelObj) => {
                const channelName = channelObj.name;
                const isSelected = activeChannel === channelName;
                return (
                  <div key={channelObj._id || channelName} className={`channel-item-row ${isSelected ? 'active' : ''}`}>
                    <button
                      className={`channel-item ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setActiveChannel(isSelected ? null : channelName);
                        setCallMode(null);
                      }}
                      title={isSelected ? `Click to deselect #${channelName}` : `#${channelName}`}
                    >
                      <Icon name="hash" size={16} />
                      <span>{channelName}</span>
                    </button>
                    {user && channelItems.length > 1 && (
                      <button
                        className="channel-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChannelById(channelObj._id, channelName);
                        }}
                        title={`Delete #${channelName}`}
                        aria-label={`Delete #${channelName}`}
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
              {user && !channelItems.length && <p className="empty-state">Create a workspace to add channels.</p>}
            </nav>

            <div className="sidebar-section-head dm-heading">
              <span>DIRECT MESSAGES</span>
              <button onClick={() => setViewMode('dms')} aria-label="View all direct messages" title="View all direct messages"><Icon name="plus" size={15} /></button>
            </div>
            <div className="conversation-list">
              {registeredUsers.slice(0, 5).map(u => {
                const isOnline = onlineUserIds.has(String(u.id));
                const isSelected = viewMode === 'dms' && activeDMUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    className={`conversation ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      if (isSelected) {
                        setActiveDMUser(null);
                        setActiveDMChannel(null);
                      } else {
                        setViewMode('dms');
                        setActiveDMUser(u);
                      }
                      setCallMode(null);
                    }}
                  >
                    <span className="avatar orange">
                      {u.username.slice(0, 2).toUpperCase()}
                      <span className={`presence ${isOnline ? 'online' : ''}`} />
                    </span>
                    <span className="conversation-copy">
                      <span className="conversation-name">{u.username}</span>
                      <span className="conversation-preview">{isOnline ? 'Online now' : 'Offline'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="sidebar-section-head">
              <span>REGISTERED PEOPLE ({filteredUsers.length})</span>
            </div>
            <div className="conversation-list">
              {filteredUsers.map(u => {
                const isOnline = onlineUserIds.has(String(u.id));
                const isSelected = activeDMUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    className={`conversation ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      if (isSelected) {
                        setActiveDMUser(null);
                        setActiveDMChannel(null);
                      } else {
                        setActiveDMUser(u);
                      }
                      setCallMode(null);
                    }}
                  >
                    <span className="avatar orange">
                      {u.username.slice(0, 2).toUpperCase()}
                      <span className={`presence ${isOnline ? 'online' : ''}`} />
                    </span>
                    <span className="conversation-copy">
                      <span className="conversation-name">@{u.username}</span>
                      <span className="conversation-preview">{isOnline ? 'Online now' : 'Offline'}</span>
                    </span>
                  </button>
                );
              })}
              {registeredUsers.length === 0 && (
                <p className="empty-state">No other users found yet. Invite a friend with your invite code!</p>
              )}
            </div>
          </>
        )}

        <div className="sidebar-footer">
          {/* Profile options popover */}
          {showProfileMenu && user && (
            <div className="profile-popover-menu" ref={profileMenuRef} onClick={e => e.stopPropagation()}>
              <div className="profile-popover-header">
                <div className="avatar avatar-orange popover-avatar">
                  {user.username?.slice(0, 2).toUpperCase() || 'YR'}
                  <span className={`presence ${userCustomStatus === 'offline' ? '' : userCustomStatus === 'idle' ? 'idle' : userCustomStatus === 'dnd' ? 'dnd' : 'online'}`} />
                </div>
                <div className="popover-user-info">
                  <strong className="popover-username">{user.username}</strong>
                  <span className="popover-email">{user.email || 'Registered Member'}</span>
                  <span className="popover-id">TAG: #{String(user.id || user._id || '0001').slice(-4).toUpperCase()}</span>
                </div>
              </div>

              <div className="popover-divider" />

              <div className="popover-section-label">ONLINE STATUS</div>
              <div className="popover-status-grid">
                <button
                  type="button"
                  className={`popover-status-btn ${userCustomStatus === 'online' ? 'active' : ''}`}
                  onClick={() => { setUserCustomStatus('online'); notify('Status set to Online'); }}
                >
                  <span className="presence online" style={{ position: 'static' }} /> Online
                </button>
                <button
                  type="button"
                  className={`popover-status-btn ${userCustomStatus === 'idle' ? 'active' : ''}`}
                  onClick={() => { setUserCustomStatus('idle'); notify('Status set to Idle'); }}
                >
                  <span className="presence idle" style={{ position: 'static' }} /> Idle
                </button>
                <button
                  type="button"
                  className={`popover-status-btn ${userCustomStatus === 'dnd' ? 'active' : ''}`}
                  onClick={() => { setUserCustomStatus('dnd'); notify('Status set to Do Not Disturb'); }}
                >
                  <span className="presence dnd" style={{ position: 'static' }} /> DND
                </button>
                <button
                  type="button"
                  className={`popover-status-btn ${userCustomStatus === 'offline' ? 'active' : ''}`}
                  onClick={() => { setUserCustomStatus('offline'); notify('Status set to Invisible'); }}
                >
                  <span className="presence" style={{ position: 'static' }} /> Invisible
                </button>
              </div>

              <div className="popover-divider" />

              <div className="popover-menu-items">
                <button
                  type="button"
                  className="popover-item"
                  onClick={() => {
                    navigator.clipboard?.writeText(user.username);
                    notify(`Copied username: ${user.username}`);
                    setShowProfileMenu(false);
                  }}
                >
                  <Icon name="user" size={15} />
                  <span>Copy Username</span>
                </button>

                <button
                  type="button"
                  className="popover-item"
                  onClick={() => {
                    setShowMicModal(true);
                    setShowProfileMenu(false);
                  }}
                >
                  <Icon name="phone" size={15} />
                  <span>Microphone & Audio Test</span>
                </button>

                <button
                  type="button"
                  className="popover-item"
                  onClick={() => {
                    sounds.playMessagePing();
                    notify('Testing ConnectCord chime ping');
                  }}
                >
                  <Icon name="bell" size={15} />
                  <span>Test Audio Chime</span>
                </button>

                <button
                  type="button"
                  className="popover-item"
                  onClick={() => {
                    setShowAccountModal(true);
                    setShowProfileMenu(false);
                  }}
                >
                  <Icon name="settings" size={15} />
                  <span>Account Details</span>
                </button>

                <div className="popover-divider" />

                <button
                  type="button"
                  className="popover-item danger-item"
                  onClick={handleLogout}
                >
                  <Icon name="more" size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          <div className="profile-card">
            <div className="avatar avatar-orange">
              {user?.username?.slice(0, 2).toUpperCase() || 'YR'}
              <span className={`presence ${userCustomStatus === 'offline' ? '' : userCustomStatus === 'idle' ? 'idle' : userCustomStatus === 'dnd' ? 'dnd' : 'online'}`} />
            </div>
            <div className="profile-copy">
              <strong>{user?.username || 'You'}</strong>
              <span><i className={`tiny-${userCustomStatus}`} /> {userCustomStatus === 'idle' ? 'Away' : userCustomStatus === 'dnd' ? 'Do Not Disturb' : userCustomStatus === 'offline' ? 'Invisible' : (realtimeStatus === 'connected' ? 'Connected' : 'Offline')}</span>
            </div>
            <button
              className={`icon-button subtle ${showProfileMenu ? 'pressed' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!user) {
                  setAuthMode('login');
                } else {
                  setShowProfileMenu(v => !v);
                }
              }}
              title={user ? 'Profile options' : 'Sign in'}
              aria-label="Profile options"
            >
              <Icon name="more" />
            </button>
          </div>
        </div>
      </aside>

      {/* SIDEBAR RESIZER */}
      <div
        className={`sidebar-resizer ${isDraggingSidebar ? 'active' : ''}`}
        onMouseDown={startSidebarResize}
        title="Drag to resize sidebar"
      />

      {/* CHAT PANEL */}
      {!currentChannel ? (
        <section className="chat-panel chat-empty-brand-panel">
          <div className="brand-landing-wrapper">
            <div className="brand-landing-card">
              <div className="brand-landing-badge">
                <span className="brand-symbol large"><i /><i /><i /></span>
              </div>
              <h1 className="brand-landing-title">ConnectCord</h1>
              <p className="brand-landing-tagline">
                Where real-time conversations, crystal-clear voice, video, and screen sharing come alive.
              </p>
              <div className="brand-landing-divider" />
              <p className="brand-landing-instruction">
                {viewMode === 'dms'
                  ? 'Pick a friend from the registered members on the left to start a direct message.'
                  : (activeWorkspace
                      ? `Select a channel from "${activeWorkspace.name}" to start chatting, or add a new channel.`
                      : 'Select or create a workspace to start connecting.')}
              </p>
              <div className="brand-landing-buttons">
                {viewMode === 'workspace' && activeWorkspace && (
                  <button className="primary-pill-btn" onClick={createChannel}>
                    <Icon name="plus" size={15} /> Create Channel
                  </button>
                )}
                {viewMode === 'workspace' && (
                  <button className="secondary-pill-btn" onClick={createWorkspace}>
                    <Icon name="plus" size={15} /> New Workspace
                  </button>
                )}
                <button
                  className="secondary-pill-btn"
                  onClick={() => setViewMode(viewMode === 'workspace' ? 'dms' : 'workspace')}
                >
                  <Icon name="sparkle" size={15} /> {viewMode === 'workspace' ? 'Go to Direct Messages' : 'Go to Workspaces'}
                </button>
                {viewMode === 'workspace' && activeWorkspace && (
                  <button className="secondary-pill-btn" onClick={shareWorkspace}>
                    <Icon name="more" size={15} /> Share Invite Code
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="chat-panel">
          <header className="chat-header">
          <div className="chat-heading">
            <span className={`avatar ${viewMode === 'dms' ? 'peach' : 'orange'}`}>
              {viewMode === 'dms' ? (activeDMUser?.username?.slice(0, 2).toUpperCase() || '@') : '#'}
            </span>
            <div>
              <div className="chat-title-row">
                <h1>{chatTitle}</h1>
                <span className="private-tag">{chatTag}</span>
              </div>
              <p>
                {viewMode === 'dms' ? (
                  isTargetOnline ? <><i className="tiny-online" /> Online now</> : 'Offline'
                ) : (
                  realtimeStatus === 'connected' ? <><i className="tiny-online" /> Real-time channel active</> : 'Connecting…'
                )}
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className={`icon-button ${callMode === "voice" ? "call-active" : ""}`}
              onClick={() => {
                if (!user) {
                  notify("Sign in to make a voice call.");
                  return;
                }
                if (realtimeStatus !== "connected" || !socketRef.current?.connected) {
                  notify("Wait for the real-time connection to reconnect.");
                  return;
                }
                if (!currentChannel) {
                  notify("Select a conversation before starting a voice call.");
                  return;
                }
                setCallMode((prev) => (prev === "voice" ? null : "voice"));
              }}
              title={callMode === "voice" ? "End voice call" : "Start voice call directly"}
              aria-label="Start voice call"
            >
              <Icon name="phone" />
            </button>

            <button
              className={`icon-button ${callMode === "video" ? "call-active" : ""}`}
              onClick={() => {
                if (!user) {
                  notify("Sign in to make a video call.");
                  return;
                }
                if (realtimeStatus !== "connected" || !socketRef.current?.connected) {
                  notify("Wait for the real-time connection to reconnect.");
                  return;
                }
                if (!currentChannel) {
                  notify("Select a conversation before starting a video call.");
                  return;
                }
                setCallMode((prev) => (prev === "video" ? null : "video"));
              }}
              title={callMode === "video" ? "End video call" : "Start video call directly"}
              aria-label="Start video call"
            >
              <Icon name="video" />
            </button>

            <span className="header-separator" />
            <button className={`icon-button ${showDetails ? 'pressed' : ''}`} onClick={() => setShowDetails(!showDetails)} title="Toggle details">
              <Icon name="inbox" />
            </button>
            <button className="icon-button" onClick={() => notify('ConnectCord v2.0 - Discord Reimagined')} title="About ConnectCord">
              <Icon name="more" />
            </button>
          </div>
        </header>

        {callMode && currentChannel && (
          <VoiceCallTest
            key={currentChannel._id}
            socket={socketRef.current}
            channelId={currentChannel._id}
            initialMode={callMode}
            onClose={() => setCallMode(null)}
          />
        )}

        {/* MESSAGES LIST */}
        <div className="message-area">
          <div className="day-divider">
            <span />
            <p>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</p>
            <span />
          </div>

          <div className="intro-note">
            <span className="intro-star">✳</span>
            <p>
              <strong>{viewMode === 'dms' ? `Direct Conversation with @${activeDMUser?.username || 'User'}` : `Welcome to #${activeChannel}`}</strong>
              {' '}This is where good conversations happen. End-to-end real-time communication.
            </p>
          </div>

          {loadingMessages && <p className="empty-state">Loading messages…</p>}
          {!loadingMessages && user && !messages.length && (
            <p className="empty-state">No messages yet. Send a message or photo below to start the conversation.</p>
          )}

          {messages.map(msg => (
            <article key={msg.id} className={`message ${msg.mine ? 'mine' : ''}`}>
              <div className={`avatar message-avatar ${msg.color}`}>{msg.initials}</div>
              <div className="message-content">
                <div className="message-meta">
                  <strong>{msg.author}</strong>
                  <time>{msg.time}</time>
                  {msg.mine && <span className="edited-mark">✓✓</span>}
                </div>

                {msg.text && <p>{msg.text}</p>}

                {/* Attachments rendering */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="message-attachments">
                    {msg.attachments.map((att, idx) => {
                      const isImg = att.contentType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(att.url);
                      return isImg ? (
                        <div key={idx} className="attachment-image-card" onClick={() => setLightboxImage(att.url)}>
                          <img src={att.url} alt={att.filename || 'Attachment'} className="attachment-image" loading="lazy" />
                          <span className="attachment-zoom-pill">🔍 Click to zoom</span>
                        </div>
                      ) : (
                        <a key={idx} href={att.url} download={att.filename} target="_blank" rel="noreferrer" className="attachment-file-card">
                          <Icon name="paperclip" size={18} />
                          <div className="attachment-file-info">
                            <span className="attachment-file-name">{att.filename || 'Download file'}</span>
                            <span className="attachment-file-size">{att.size ? `${Math.round(att.size / 1024)} KB` : 'File'}</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}

                {/* Reactions Row */}
                <div className="reaction-row">
                  {msg.reactions?.map((r) => {
                    const hasReacted = r.users?.some((uid) => String(uid) === String(user?.id));
                    return (
                      <button
                        key={r.emoji}
                        type="button"
                        className={`reaction-pill ${hasReacted ? 'reacted' : ''}`}
                        onClick={() => reactToMessage(msg.id, r.emoji)}
                        title={hasReacted ? `Remove ${r.emoji}` : `React with ${r.emoji}`}
                      >
                        {r.emoji} <span>{r.users?.length || 0}</span>
                      </button>
                    );
                  })}
                  <div className="reaction-picker-inline">
                    {['✨', '❤️', '👍', '🔥', '😂'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="reaction-emoji-btn"
                        onClick={() => reactToMessage(msg.id, emoji)}
                        title={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}

          {typingUsers.length > 0 && (
            <div className="typing-row">
              <div className="typing-avatars">
                {typingUsers.slice(0, 2).map(person => (
                  <span key={person.userId} className="avatar peach">{person.username.slice(0, 2).toUpperCase()}</span>
                ))}
              </div>
              <span className="typing-dots"><i /><i /><i /></span>
              <span>{typingUsers.map(p => p.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* COMPOSER */}
        <form className="composer" onSubmit={sendMessage}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,application/pdf,text/*"
            style={{ display: 'none' }}
          />

          {pendingAttachment && (
            <div className="composer-attachment-preview">
              {pendingAttachment.contentType.startsWith("image/") ? (
                <img src={pendingAttachment.dataUrl} alt="Preview" className="composer-preview-thumb" />
              ) : (
                <div className="composer-preview-fileicon"><Icon name="paperclip" size={20} /></div>
              )}
              <div className="composer-preview-meta">
                <span className="composer-preview-name">{pendingAttachment.filename}</span>
                <span className="composer-preview-size">{Math.round(pendingAttachment.size / 1024)} KB</span>
              </div>
              <button
                type="button"
                className="composer-preview-remove"
                onClick={() => setPendingAttachment(null)}
                title="Remove attachment"
              >
                ×
              </button>
            </div>
          )}

          <button
            type="button"
            className="composer-plus"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
            title="Attach photo or document"
          >
            <Icon name="plus" size={19} />
          </button>

          <input
            value={message}
            onChange={e => {
              const value = e.target.value;
              setMessage(value);
              const channel = currentChannel;
              const socket = socketRef.current;
              if (channel && socket?.connected) {
                if (value.trim()) socket.emit('typing:start', channel._id);
                clearTimeout(typingTimerRef.current);
                typingTimerRef.current = setTimeout(() => socket.emit('typing:stop', channel._id), 1200);
              }
            }}
            placeholder={`Message ${viewMode === 'dms' ? '@' + (activeDMUser?.username || 'user') : '#' + activeChannel}...`}
            aria-label="Write a message"
          />

          <button
            type="button"
            className="composer-tool"
            onClick={() => setMessage(v => v + ' ✨')}
            aria-label="Add emoji"
            title="Add emoji"
          >
            <Icon name="smile" size={18} />
          </button>

          <button
            type="button"
            className="composer-tool attach-tool"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
            title="Attach photo or document"
          >
            <Icon name="paperclip" size={18} />
          </button>

          <button
            className="send-button"
            type="submit"
            disabled={!message.trim() && !pendingAttachment}
            aria-label="Send message"
          >
            <Icon name="send" size={17} />
          </button>

          <div className="composer-hint"><kbd>↵</kbd> to send <span>·</span> <kbd>⇧ ↵</kbd> new line</div>
        </form>
      </section>
      )}

      {/* RIGHT DETAILS PANEL */}
      {showDetails && (
        <>
          <div
            className={`sidebar-resizer ${isDraggingDetails ? 'active' : ''}`}
            onMouseDown={startDetailsResize}
            title="Drag to resize details"
          />
          <aside className="details-panel">
          <div className="details-top">
            <span>{viewMode === 'dms' ? 'DIRECT PROFILE' : 'THE PEOPLE'}</span>
            <button className="icon-button subtle" onClick={() => setShowDetails(false)} aria-label="Close details">×</button>
          </div>

          <div className="group-cover">
            <div className="cover-orbit orbit-one" />
            <div className="cover-orbit orbit-two" />
            <div className="cover-star">✳</div>
            <span className="cover-word">together<span>.</span></span>
            <span className="cover-caption">A space to make things happen</span>
          </div>

          {viewMode === 'dms' && activeDMUser ? (
            <div className="details-about">
              <div className="about-title">
                <h2>@{activeDMUser.username}</h2>
                <span className="verified-dot">✦</span>
              </div>
              <p>{isTargetOnline ? 'Currently active on ConnectCord' : 'Offline right now'}</p>
              <div className="about-stats">
                <div>
                  <strong>{isTargetOnline ? 'Online' : 'Away'}</strong>
                  <span>Status</span>
                </div>
                <div>
                  <strong>{messages.length}</strong>
                  <span>Messages</span>
                </div>
                <div>
                  <strong>Direct</strong>
                  <span>Channel</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="details-about">
                <div className="about-title">
                  <h2>{activeWorkspace?.name || 'Design Collective'}</h2>
                  <span className="verified-dot">✦</span>
                </div>
                <p>{activeWorkspace?.description || 'A cozy corner for curious minds, pixel pushers, and people who care about the details.'}</p>
                <div className="about-stats">
                  <div><strong>{activeWorkspace ? (workspaceMembers.length || 1) : 24}</strong><span>members</span></div>
                  <div><strong>{activeWorkspace ? (workspaceMembers.filter(m => onlineUserIds.has(String(m._id)) || String(m._id) === String(user?.id)).length || 1) : '08'}</strong><span>online now</span></div>
                  <div><strong>{activeWorkspace ? messages.length : 142}</strong><span>messages today</span></div>
                </div>
              </div>

              <div className="members-section">
                <div className="member-head">
                  <h3>{activeWorkspace ? 'Workspace Members' : 'Here right now'}</h3>
                  <span>{activeWorkspace ? (workspaceMembers.length || 1) : '08'}</span>
                </div>
                {(activeWorkspace && workspaceMembers.length > 0 ? workspaceMembers.map(m => {
                  const isOnline = onlineUserIds.has(String(m._id)) || String(m._id) === String(user?.id);
                  const isOwner = String(m._id) === String(activeWorkspace.owner?._id || activeWorkspace.owner);
                  return (
                    <div className="member-row" key={m._id || m.username}>
                      <span className="avatar avatar-orange">{(m.username || '?').slice(0, 2).toUpperCase()}<i className={`presence ${isOnline ? 'online' : ''}`} /></span>
                      <span className="member-copy">
                        <strong>{m.username}</strong>
                        <small>{isOwner ? 'Workspace Owner' : (isOnline ? 'Online now' : 'Offline')}</small>
                      </span>
                      <button
                        className="member-more"
                        onClick={() => {
                          setViewMode('dms');
                          setActiveDMUser({ id: m._id, username: m.username, email: m.email });
                        }}
                        title={`Send direct message to ${m.username}`}
                      >
                        <Icon name="send" size={14} />
                      </button>
                    </div>
                  );
                }) : [{ n: 'Maya Patel', r: 'Design lead', i: 'MP', c: 'peach', s: 'online' }, { n: 'Jordan Lee', r: 'Product design', i: 'JL', c: 'violet', s: 'online' }].map(m => (
                  <div className="member-row" key={m.i}>
                    <span className={`avatar ${m.c}`}>{m.i}<i className={`presence ${m.s}`} /></span>
                    <span className="member-copy"><strong>{m.n}</strong><small>{m.r}</small></span>
                  </div>
                )))}
              </div>

              {viewMode === 'workspace' && activeWorkspace && String(activeWorkspace.owner?._id || activeWorkspace.owner) === String(user?.id) && (
                <div className="workspace-danger-section">
                  <div className="danger-heading">
                    <span>WORKSPACE OWNER CONTROLS</span>
                  </div>
                  <button
                    className="workspace-delete-btn"
                    onClick={() => deleteWorkspaceById(activeWorkspace._id, activeWorkspace.name)}
                    title="Permanently delete this workspace and all channels"
                  >
                    <Icon name="trash" size={15} />
                    <span>Delete Workspace</span>
                  </button>
                </div>
              )}
            </>
          )}

          <div className="details-footer">
            <span className="footer-asterisk">✳</span>
            <span>Made for the moments<br />that bring us closer.</span>
            <button onClick={() => notify(activeWorkspace?.inviteCode ? `Invite code: ${activeWorkspace.inviteCode}` : 'ConnectCord v2.0')} aria-label="Settings" title="Workspace info">
              <Icon name="settings" size={17} />
            </button>
          </div>
        </aside>
      </>
      )}

      {/* NEW CHAT / INVITE MODAL */}
      {showNewChat && (
        <div className="modal-backdrop" onClick={() => setShowNewChat(false)}>
          <section className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowNewChat(false)}>×</button>
            <span className="modal-kicker">{user ? 'INVITE TO WORKSPACE' : 'MAKE A CONNECTION'}</span>
            <h2>{user ? (activeWorkspace ? `Invite to ${activeWorkspace.name}` : 'Create a workspace') : 'Start something good.'}</h2>
            <p>{user ? (activeWorkspace ? `Share this invite code with friends so they can join ${activeWorkspace.name} and chat or jump on voice with you:` : 'Create or select a workspace to get an invite code.') : 'Sign in or create an account to make your own space and bring your people together.'}</p>
            {user && activeWorkspace?.inviteCode && (
              <div style={{ background: 'rgba(255, 140, 50, 0.12)', border: '1px solid rgba(255, 140, 50, 0.3)', padding: '12px 16px', borderRadius: '10px', margin: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <code style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px', color: '#ff9a44' }}>{activeWorkspace.inviteCode}</code>
                <button type="button" className="primary-button" style={{ width: 'auto', padding: '6px 14px', fontSize: '13px' }} onClick={() => { navigator.clipboard?.writeText(activeWorkspace.inviteCode); notify('Invite code copied!'); setShowNewChat(false); }}>Copy <span>📋</span></button>
              </div>
            )}
            {user ? (
              !activeWorkspace && <button className="primary-button" onClick={() => { setShowNewChat(false); createWorkspace(); }}>Create a workspace <span>↗</span></button>
            ) : (
              <>
                <button className="primary-button" onClick={() => { setShowNewChat(false); setAuthMode('register'); }}>Create your account <span>↗</span></button>
                <button className="secondary-button" onClick={() => { setShowNewChat(false); setAuthMode('login'); }}>I already have an account</button>
              </>
            )}
          </section>
        </div>
      )}

      {/* AUTH MODAL */}
      {authMode && (
        <div className="modal-backdrop" onClick={() => setAuthMode('')}>
          <section className="modal-card auth-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAuthMode('')}>×</button>
            <span className="modal-kicker">WELCOME {authMode === 'register' ? 'TO THE COMMON ROOM' : 'BACK'}</span>
            <h2>{authMode === 'register' ? 'Find your people.' : 'Good to see you.'}</h2>
            <p>{authMode === 'register' ? 'One small step toward better conversations.' : 'Your corner of the internet is right here.'}</p>
            <form onSubmit={submitAuth}>
              {authMode === 'register' && <label>Your name<input required value={auth.username} onChange={e => setAuth({ ...auth, username: e.target.value })} placeholder="How should we call you?" /></label>}
              <label>Email address<input required type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="you@example.com" /></label>
              <label>Password<input required type="password" minLength={6} value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder="At least 6 characters" /></label>
              <button className="primary-button" disabled={busy}>{busy ? 'One moment…' : authMode === 'register' ? 'Create account' : 'Sign in'} <span>↗</span></button>
            </form>
            <p className="auth-switch">{authMode === 'register' ? 'Already part of the room?' : 'New around here?'} <button onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}>{authMode === 'register' ? 'Sign in' : 'Create an account'}</button></p>
          </section>
        </div>
      )}

      {/* ACCOUNT DETAILS MODAL */}
      {showAccountModal && user && (
        <div className="modal-backdrop" onClick={() => setShowAccountModal(false)}>
          <section className="modal-card account-modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAccountModal(false)}>×</button>
            <span className="modal-kicker">USER PROFILE & ACCOUNT</span>
            <h2>{user.username}</h2>
            <div className="account-modal-body">
              <div className="account-info-group">
                <label>USERNAME</label>
                <span>{user.username}</span>
              </div>
              <div className="account-info-group">
                <label>EMAIL ADDRESS</label>
                <span>{user.email || 'Not provided'}</span>
              </div>
              <div className="account-info-group">
                <label>USER ID TAG</label>
                <span>#{String(user.id || user._id || '0001').slice(-6).toUpperCase()}</span>
              </div>
              <div className="account-info-group">
                <label>NETWORK STATUS</label>
                <span>{realtimeStatus === 'connected' ? '🟢 Socket.IO & WebRTC Connected' : '🔴 Disconnected'}</span>
              </div>
            </div>
            <div className="account-modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  navigator.clipboard?.writeText(user.username);
                  notify('Username copied to clipboard!');
                }}
              >
                Copy Username
              </button>
              <button
                type="button"
                className="secondary-button"
                style={{ borderColor: 'rgba(234, 112, 112, 0.4)', color: '#ea7070' }}
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </section>
        </div>
      )}

      {/* MICROPHONE & AUDIO TEST MODAL */}
      {showMicModal && (
        <div className="modal-backdrop" onClick={() => setShowMicModal(false)}>
          <section className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowMicModal(false)}>×</button>
            <span className="modal-kicker">VOICE & AUDIO SETTINGS</span>
            <h2>Microphone Test</h2>
            <p>Check your microphone permissions, hardware stream, and voice input before joining voice or video calls.</p>
            <div style={{ padding: '16px 0' }}>
              <MicrophoneTest />
            </div>
            <button
              type="button"
              className="primary-button"
              style={{ marginTop: '14px' }}
              onClick={() => setShowMicModal(false)}
            >
              Done Testing
            </button>
          </section>
        </div>
      )}

      {/* LIGHTBOX FOR FULL SIZE IMAGES */}
      {lightboxImage && (
        <div className="lightbox-backdrop" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={lightboxImage} alt="Expanded attachment view" className="lightbox-img" />
            <button className="lightbox-close" onClick={() => setLightboxImage(null)} title="Close">×</button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && <div className="toast"><span>✳</span>{toast}</div>}
    </main>
  );
}

export default App;
