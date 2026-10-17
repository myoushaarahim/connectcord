import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import MicrophoneTest from "./components/MicrophoneTest";
import VoiceCallTest from "./components/VoiceCallTest";
import './App.css';

const conversations = [
  { id: 1, name: 'Design Collective', initials: 'DC', color: 'peach', preview: 'Maya: the new motion feels ✨', time: '2m', unread: 3, online: true, group: true },
  { id: 2, name: 'Ava Mitchell', initials: 'AM', color: 'violet', preview: 'That sounds perfect!', time: '11m', online: true },
  { id: 3, name: 'Build in Public', initials: 'BP', color: 'mint', preview: 'Noah shared a link', time: '28m', unread: 1, group: true },
  { id: 4, name: 'Leo Chen', initials: 'LC', color: 'blue', preview: 'Voice message · 0:14', time: '1h', online: false },
  { id: 5, name: 'Weekend people 🪩', initials: 'WP', color: 'pink', preview: 'You: count me in', time: '3h', group: true },
];
const initialMessages = [
  { id: 1, author: 'Maya Patel', initials: 'MP', color: 'peach', time: '10:41 AM', text: 'Morning team! I pushed the new direction for the onboarding flow. Finally feels like us.' },
  { id: 2, author: 'You', initials: 'YR', color: 'orange', time: '10:43 AM', text: 'Okay, this is a huge step up. The softer surfaces + that warm accent are exactly the vibe.', mine: true },
  { id: 3, author: 'Jordan Lee', initials: 'JL', color: 'violet', time: '10:45 AM', text: 'The little transitions make it feel so much more alive. Especially the channel switch 👀' },
  { id: 4, author: 'Maya Patel', initials: 'MP', color: 'peach', time: '10:46 AM', text: 'Right? I kept thinking about how a workspace should feel less like a tool and more like a place you want to hang out.' },
  { id: 5, author: 'You', initials: 'YR', color: 'orange', time: '10:48 AM', text: 'That’s the whole ConnectCord thing. Less noise, more connection. Let’s ship this direction.', mine: true },
];
const channels = ['general', 'design-lab', 'show-and-tell', 'random'];
const Icon = ({ name, size = 18 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>, plus: <><path d="M12 5v14M5 12h14" /></>, hash: <><path d="M5 9h14M4 15h14M10 3 8 21M16 3l-2 18" /></>, bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>, settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.1 1.8-1.8 3.1-2.1-.5a8 8 0 0 1-1.6.9l-.6 2.1h-3.6l-.6-2.1a8 8 0 0 1-1.6-.9l-2.1.5-1.8-3.1 1.1-1.8a7 7 0 0 1 0-1.9l-1.1-1.8 1.8-3.1 2.1.5a8 8 0 0 1 1.6-.9l.6-2.1h3.6l.6 2.1a8 8 0 0 1 1.6.9l2.1-.5 1.8 3.1-1.1 1.8a7 7 0 0 1 0 1.9Z" transform="translate(0 -2) scale(1 .92)" /></>, paperclip: <><path d="m21 11.5-8.5 8.5a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L9.5 19" /></>, smile: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>, send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>, video: <><rect x="3" y="5" width="13" height="14" rx="3" /><path d="m16 10 5-3v10l-5-3" /></>, phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.9L7.1 10.3a16 16 0 0 0 6.6 6.6l1.9-1.9a2 2 0 0 1 1.9-.6l2.8.5a2 2 0 0 1 1.7 2Z" />, more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>, inbox: <><path d="M4 4h16l2 11v5H2v-5L4 4Z" /><path d="M2 15h6l2 2h4l2-2h6" /></>, sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" /></>, menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>
  };
  return <svg {...common}>{paths[name] || paths.sparkle}</svg>;
};

function App() {

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

  useEffect(() => { activeWorkspaceRef.current = activeWorkspace; }, [activeWorkspace]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [query, setQuery] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [toast, setToast] = useState('');
  const [authMode, setAuthMode] = useState('');
  const [auth, setAuth] = useState({ username: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('connectcord_user') || 'null'); } catch { return null; }
  });
  const current = conversations.find(c => c.id === activeChat) || conversations[0];
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
  const filtered = useMemo(() => conversations.filter(c => `${c.name} ${c.preview}`.toLowerCase().includes(query.toLowerCase())), [query]);

  // Restore the session by asking the backend to verify the saved token.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
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

  // Phase 6: authenticated Server-Sent Events (SSE) stream. We use fetch rather
  // than EventSource because EventSource cannot attach our Bearer token header.
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
                  // A channel created by another member must appear without a refresh.
                  if (item.type === 'channel_created' && item.workspaceId) {
                    fetch(`http://localhost:5000/api/workspaces/${item.workspaceId}`, {
                      headers: { Authorization: `Bearer ${token()}` },
                    }).then(async response => {
                      const data = await response.json();
                      if (!response.ok) throw new Error(data.message || 'Could not refresh channels');
                      if (String(activeWorkspaceRef.current?._id) === String(item.workspaceId)) {
                        setChannelItems(data.channels || []);
                      }
                    }).catch(error => console.warn('Could not refresh workspace channels:', error.message));
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

  // Join the selected channel and append messages received from other clients.
  useEffect(() => {
    const channel = channelItems.find(c => c.name === activeChannel);
    const socket = socketRef.current;
    if (!channel || !socket || !user) return;

    const joinChannel = () => {
      socket.emit('channel:join', channel._id, (result) => {
        if (!result?.ok) notify(result?.message || 'Could not join real-time channel.');
      });
    };

    const onNewMessage = (m) => {
      if (String(m.channel) !== String(channel._id)) return;
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
          mine: m.author?._id === user?.id,
        }];
      });
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
    socket.on('typing:changed', onTypingChanged);
    socket.on('presence:changed', onPresenceChanged);

    return () => {
      socket.off('connect', joinChannel);
      socket.off('message:new', onNewMessage);
      socket.off('typing:changed', onTypingChanged);
      socket.off('presence:changed', onPresenceChanged);
      socket.emit('typing:stop', channel._id);
      socket.emit('channel:leave', channel._id);
      setTypingUsers([]);
    };
  }, [channelItems, activeChannel, user, realtimeStatus]);

  useEffect(() => {
    if (!user || !token()) { setWorkspaces([]); setActiveWorkspace(null); setChannelItems([]); setMessages([]); return; }
    api('/api/workspaces').then(data => {
      setWorkspaces(data.workspaces || []);
      const chosen = data.workspaces?.[0];
      if (chosen) setActiveWorkspace(chosen);
      else { setActiveWorkspace(null); setChannelItems([]); setMessages([]); }
    }).catch(err => notify(err.message));
  }, [user]);

  useEffect(() => {
    if (!activeWorkspace || !token()) return;
    api(`/api/workspaces/${activeWorkspace._id}`).then(data => {
      setChannelItems(data.channels || []);
      const chosen = data.channels?.find(c => c.name === activeChannel) || data.channels?.[0];
      if (chosen && chosen.name !== activeChannel) setActiveChannel(chosen.name);
    }).catch(err => notify(err.message));
  }, [activeWorkspace]);

  useEffect(() => {
    const channel = channelItems.find(c => c.name === activeChannel);
    if (!channel || !token()) { setMessages([]); return; }
    setLoadingMessages(true);
    api(`/api/messages/channels/${channel._id}`).then(data => setMessages((data.messages || []).map(m => ({
      id: m._id, author: m.author?.username || 'Unknown', initials: (m.author?.username || '?').slice(0, 2).toUpperCase(),
      color: m.author?._id === user?.id ? 'orange' : 'peach', time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: m.content, mine: m.author?._id === user?.id,
    })))).catch(err => notify(err.message)).finally(() => setLoadingMessages(false));
  }, [channelItems, activeChannel, user]);

  const createWorkspace = async () => {
    if (!user) { setAuthMode('login'); return; }
    const name = window.prompt('Name your new workspace');
    if (!name?.trim()) return;
    try {
      const data = await api('/api/workspaces', { method: 'POST', body: JSON.stringify({ name }) });
      const workspace = data.workspace;
      setWorkspaces(prev => [workspace, ...prev]); setActiveWorkspace(workspace); setActiveChannel('general');
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
      notify(data.alreadyMember ? 'You already belong to this workspace.' : `Joined ${workspace.name}!`);
    } catch (err) { notify(err.message); }
  };

  const shareWorkspace = () => {
    if (!activeWorkspace) { notify('Select a workspace first.'); return; }
    const code = activeWorkspace.inviteCode;
    if (!code) { notify('Reload the workspace list and try again.'); return; }
    window.prompt(`Share this invite code with the other account to join ${activeWorkspace.name}:`, code);
  };

  const createChannel = async () => {
    if (!activeWorkspace) { notify('Create a workspace first.'); return; }
    const name = window.prompt('Channel name (letters, numbers, hyphens)');
    if (!name?.trim()) return;
    try {
      const data = await api(`/api/workspaces/${activeWorkspace._id}/channels`, { method: 'POST', body: JSON.stringify({ name }) });
      setChannelItems(prev => [...prev, data.channel]); setActiveChannel(data.channel.name); notify('Channel created!');
    } catch (err) { notify(err.message); }
  };

  const notify = (text) => { setToast(text); window.setTimeout(() => setToast(''), 2600); };
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const channel = channelItems.find(c => c.name === activeChannel);
    if (!user || !channel) { notify('Sign in and create/select a workspace to send messages.'); return; }
    const content = message.trim(); setMessage('');
    socketRef.current?.emit('typing:stop', channel._id);
    try {
      const data = await api(`/api/messages/channels/${channel._id}`, { method: 'POST', body: JSON.stringify({ content }) });
      // The server broadcasts the saved message to this channel over Socket.IO.
      // The message event handler appends it for this tab and every other connected tab.
      if (!data.message) throw new Error('Message was saved but the server returned no message.');
    } catch (err) { setMessage(content); notify(err.message); }
  };
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
      localStorage.setItem('connectcord_user', JSON.stringify(safeUser)); setUser(safeUser); setAuthMode(''); notify(authMode === 'register' ? 'Account created — welcome to ConnectCord!' : 'You’re back. Welcome in!');
    } catch (err) { notify(err.message === 'Failed to fetch' ? 'Could not reach the server. Start the backend on port 5000.' : err.message); }
    finally { setBusy(false); }
  };

  return <main className="app-shell">
    <aside className="workspace-rail">
      <button className="brand-mark" aria-label="ConnectCord home" onClick={() => { setActiveChat(1); setActiveChannel('general'); }}><span className="brand-symbol"><i /><i /><i /></span></button>
      <div className="rail-divider" />
      {user ? workspaces.map((workspace, index) => <button key={workspace._id} className={`rail-server ${String(activeWorkspace?._id) === String(workspace._id) ? 'selected' : ''}`} title={workspace.name} onClick={() => { setActiveWorkspace(workspace); setActiveChannel('general'); }}><span className={`server-monogram ${['', 'mint', 'violet'][index % 3]}`}>{workspace.name.slice(0, 2).toLowerCase()}</span>{String(activeWorkspace?._id) === String(workspace._id) && <span className="rail-indicator" />}</button>) : <><button className="rail-server selected" title="Design Collective" onClick={() => setActiveChat(1)}><span className="server-monogram">dc</span><span className="rail-indicator" /></button><button className="rail-server" title="Build in Public" onClick={() => setActiveChat(3)}><span className="server-monogram mint">bp</span></button><button className="rail-server" title="Weekend people" onClick={() => setActiveChat(5)}><span className="server-monogram violet">w.</span></button></>}
      <button className="rail-add" title="Create a workspace" onClick={createWorkspace}><Icon name="plus" size={21} /></button>
      <button className="rail-add" title="Join a workspace with an invite code" onClick={joinWorkspace}><Icon name="inbox" size={19} /></button>
      <div className="rail-bottom"><button className="rail-add" title={`Notifications (${notifications.length})`} onClick={() => notify(notifications.length ? `${notifications.length} recent notification(s). Latest: ${notifications[0].title}` : 'You’re all caught up!')}><Icon name="inbox" /></button><div className="avatar avatar-orange user-rail" onClick={() => setAuthMode('login')} title="Your profile">{user?.username?.slice(0, 2).toUpperCase() || 'YR'}<span className="presence online" /></div></div>
    </aside>

    <aside className="sidebar">
      <div className="sidebar-top"><div><p className="eyebrow">YOUR SPACE</p><button className="workspace-title" onClick={() => { if (workspaces.length) { const idx = workspaces.findIndex(w => w._id === activeWorkspace?._id); const next = workspaces[(idx + 1) % workspaces.length]; setActiveWorkspace(next); setActiveChannel('general'); } else createWorkspace(); }}>{activeWorkspace?.name || 'Your workspace'} <span>⌄</span></button></div><button className="icon-button subtle" onClick={shareWorkspace} aria-label="Share workspace invite code" title="Share workspace invite code"><Icon name="more" /></button><button className="icon-button subtle" onClick={() => setShowNewChat(true)} aria-label="New message"><Icon name="plus" /></button></div>
      <div className="workspace-status"><span className={`status-pulse ${realtimeStatus === "connected" ? "is-live" : ""}`} /> {realtimeStatus === "connected" ? "Live connection" : "Connecting…"}<span title={sseStatus === 'connected' ? 'SSE notifications connected' : 'SSE notifications reconnecting'} style={{ fontSize: 9, color: sseStatus === 'connected' ? '#82b997' : '#8d877f' }}> · SSE {sseStatus === 'connected' ? 'live' : 'offline'}</span><span className="status-spark">✳</span></div>
      <label className="searchbox"><Icon name="search" size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a conversation" /><kbd>⌘ K</kbd></label>
      <div className="sidebar-section-head"><span>YOUR CHANNELS</span><button onClick={createChannel} aria-label="Add channel"><Icon name="plus" size={15} /></button></div>
      <nav className="channel-list">{(channelItems.length ? channelItems.map(c => c.name) : (user ? [] : channels)).map((channel) => <button key={channel} className={`channel-item ${activeChannel === channel ? 'active' : ''}`} onClick={() => { setActiveChannel(channel); setActiveChat(1); }}><Icon name="hash" size={16} /><span>{channel}</span></button>)}{user && !channelItems.length && <p className="empty-state">Create a workspace to add channels.</p>}</nav>
      <div className="sidebar-section-head dm-heading"><span>DIRECT MESSAGES</span><button onClick={() => setShowNewChat(true)} aria-label="Add direct message"><Icon name="plus" size={15} /></button></div>
      <div className="conversation-list">{filtered.map(c => <button key={c.id} className={`conversation ${activeChat === c.id ? 'active' : ''}`} onClick={() => setActiveChat(c.id)}><span className={`avatar ${c.color}`}>{c.initials}<span className={`presence ${c.online ? 'online' : ''}`} /></span><span className="conversation-copy"><span className="conversation-name">{c.name}</span><span className="conversation-preview">{c.preview}</span></span><span className="conversation-meta">{c.unread && <b>{c.unread}</b>}<small>{c.time}</small></span></button>)}</div>
      <div className="sidebar-footer"><div className="profile-card"><div className="avatar avatar-orange">{user?.username?.slice(0, 2).toUpperCase() || 'YR'}<span className="presence online" /></div><div className="profile-copy"><strong>{user?.username || 'Youshaa Rahim'}</strong><span><i /> {realtimeStatus === 'connected' ? 'Connected' : 'Offline'}</span></div><button className="icon-button subtle" onClick={() => user ? (localStorage.removeItem('token'), localStorage.removeItem('connectcord_user'), setUser(null), notify('Signed out.')) : setAuthMode('login')} title={user ? 'Sign out' : 'Sign in'}><Icon name="more" /></button></div></div>
    </aside>

    <section className="chat-panel">
      <header className="chat-header"><div className="chat-heading"><span className={`avatar ${current.color}`}>{current.initials}</span><div><div className="chat-title-row"><h1>{current.name}</h1><span className="private-tag">{current.group ? 'GROUP' : 'DIRECT'}</span></div><p>{current.online ? <><i className="tiny-online" /> Here, in the moment</> : 'Last seen earlier today'}</p></div></div><div className="header-actions">
        <button
          className={`icon-button ${showVoiceCall ? "pressed" : ""}`}
          onClick={() => {
            const channel = channelItems.find(
              (item) => item.name === activeChannel
            );

            if (!user) {
              notify("Sign in to make a voice call.");
              return;
            }

            if (realtimeStatus !== "connected" || !socketRef.current?.connected) {
              notify("Wait for the real-time connection to reconnect.");
              return;
            }

            if (!channel) {
              notify("Select a channel before starting a voice call.");
              return;
            }

            setShowVoiceCall((visible) => !visible);
          }}
          title={showVoiceCall ? "Close voice call panel" : "Open voice call panel"}
          aria-label="Toggle voice call"
        >
          <Icon name="phone" />
        </button>
        <button className="icon-button" onClick={() => notify('Video calling will be powered by WebRTC.')} title="Video call"><Icon name="video" /></button><span className="header-separator" /><button className={`icon-button ${showDetails ? 'pressed' : ''}`} onClick={() => setShowDetails(!showDetails)} title="Toggle details"><Icon name="inbox" /></button><button className="icon-button" onClick={() => notify('More conversation options coming soon.')} title="More"><Icon name="more" /></button></div></header>
      <div className="conversation-banner"><div className="banner-icon"><Icon name="sparkle" size={19} /></div><div><strong>A little corner of the internet.</strong><span>Good ideas, good people, no noise.</span></div><button onClick={() => notify('You’re already part of the conversation!')}>Say hello <span>↗</span></button></div>
      {showVoiceCall && (() => {
        const channel = channelItems.find(
          (item) => item.name === activeChannel
        );

        if (!user || !channel || realtimeStatus !== "connected") {
          return (
            <div className="empty-state">
              Voice calling is unavailable. Check your connection and selected channel.
            </div>
          );
        }

        return (
          <VoiceCallTest
            key={channel._id}
            socket={socketRef.current}
            channelId={channel._id}
          />
        );
      })()}

      
      <div className="message-area"><div className="day-divider"><span /> <p>MONDAY, OCTOBER 12</p> <span /></div><div className="intro-note"><span className="intro-star">✳</span><p><strong>You’re all caught up.</strong> This is where the good stuff happens.</p></div>
        {loadingMessages && <p className="empty-state">Loading messages…</p>}{!loadingMessages && user && !messages.length && <p className="empty-state">No messages yet. Start the conversation.</p>}{messages.map(msg => <article key={msg.id} className={`message ${msg.mine ? 'mine' : ''}`}><div className={`avatar message-avatar ${msg.color}`}>{msg.initials}</div><div className="message-content"><div className="message-meta"><strong>{msg.author}</strong><time>{msg.time}</time>{msg.mine && <span className="edited-mark">✓✓</span>}</div><p>{msg.text}</p>{msg.id === 4 && <div className="reaction-row"><button onClick={() => notify('Reaction added ✨')}>✨ <span>3</span></button><button onClick={() => notify('Reaction added ❤️')}>❤️ <span>2</span></button><button className="add-reaction" onClick={() => notify('Emoji picker coming soon.')}><Icon name="smile" size={13} /></button></div>}</div></article>)}
        {typingUsers.length > 0 && <div className="typing-row"><div className="typing-avatars">{typingUsers.slice(0, 2).map(person => <span key={person.userId} className="avatar peach">{person.username.slice(0, 2).toUpperCase()}</span>)}</div><span className="typing-dots"><i /><i /><i /></span><span>{typingUsers.map(person => person.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing</span></div>}
      </div>
      <form className="composer" onSubmit={sendMessage}><button type="button" className="composer-plus" onClick={() => notify('Attachments are coming soon.')} aria-label="Attach"><Icon name="plus" size={19} /></button><input value={message} onChange={e => {
        const value = e.target.value;
        setMessage(value);
        const channel = channelItems.find(c => c.name === activeChannel);
        const socket = socketRef.current;
        if (channel && socket?.connected) {
          if (value.trim()) socket.emit('typing:start', channel._id);
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => socket.emit('typing:stop', channel._id), 1200);
        }
      }} placeholder={`Message ${current.group ? '#' + activeChannel : current.name}...`} aria-label="Write a message" /><button type="button" className="composer-tool" onClick={() => setMessage(v => v + ' ✨')} aria-label="Add emoji"><Icon name="smile" size={18} /></button><button type="button" className="composer-tool attach-tool" onClick={() => notify('Attachments are coming soon.')} aria-label="Attach file"><Icon name="paperclip" size={18} /></button><button className="send-button" type="submit" disabled={!message.trim()} aria-label="Send message"><Icon name="send" size={17} /></button><div className="composer-hint"><kbd>↵</kbd> to send <span>·</span> <kbd>⇧ ↵</kbd> new line</div></form>
    </section>

    {showDetails && <aside className="details-panel"><div className="details-top"><span>THE PEOPLE</span><button className="icon-button subtle" onClick={() => setShowDetails(false)} aria-label="Close details">×</button></div><div className="group-cover"><div className="cover-orbit orbit-one" /><div className="cover-orbit orbit-two" /><div className="cover-star">✳</div><span className="cover-word">together<span>.</span></span><span className="cover-caption">A space to make things happen</span></div><div className="details-about"><div className="about-title"><h2>Design Collective</h2><span className="verified-dot">✦</span></div><p>A cozy corner for curious minds, pixel pushers, and people who care about the details.</p><div className="about-stats"><div><strong>24</strong><span>members</span></div><div><strong>08</strong><span>online now</span></div><div><strong>142</strong><span>messages today</span></div></div></div><div className="members-section"><div className="member-head"><h3>Here right now</h3><span>08</span></div>{[{ n: 'Maya Patel', r: 'Design lead', i: 'MP', c: 'peach', s: 'online' }, { n: 'Jordan Lee', r: 'Product design', i: 'JL', c: 'violet', s: 'online' }, { n: 'Ava Mitchell', r: 'Motion & magic', i: 'AM', c: 'blue', s: 'online' }, { n: 'Noah Williams', r: 'Frontend wizard', i: 'NW', c: 'mint', s: 'online' }, { n: 'Leo Chen', r: 'Creative dev', i: 'LC', c: 'pink', s: '' }].map(m => <div className="member-row" key={m.i}><span className={`avatar ${m.c}`}>{m.i}<i className={`presence ${m.s}`} /></span><span className="member-copy"><strong>{m.n}</strong><small>{m.r}</small></span><button className="member-more" onClick={() => notify(`Profile for ${m.n} coming soon.`)}><Icon name="more" size={16} /></button></div>)}</div><div className="details-footer"><span className="footer-asterisk">✳</span><span>Made for the moments<br />that bring us closer.</span><button onClick={() => notify('ConnectCord settings coming soon.')} aria-label="Settings"><Icon name="settings" size={17} /></button></div></aside>}

    {showNewChat && <div className="modal-backdrop" onClick={() => setShowNewChat(false)}><section className="modal-card" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowNewChat(false)}>×</button><span className="modal-kicker">MAKE A CONNECTION</span><h2>Start something good.</h2><p>Sign in or create an account to make your own space and bring your people together.</p><button className="primary-button" onClick={() => { setShowNewChat(false); setAuthMode('register'); }}>Create your account <span>↗</span></button><button className="secondary-button" onClick={() => { setShowNewChat(false); setAuthMode('login'); }}>I already have an account</button></section></div>}
    {authMode && <div className="modal-backdrop" onClick={() => setAuthMode('')}><section className="modal-card auth-card" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setAuthMode('')}>×</button><span className="modal-kicker">WELCOME {authMode === 'register' ? 'TO THE COMMON ROOM' : 'BACK'}</span><h2>{authMode === 'register' ? 'Find your people.' : 'Good to see you.'}</h2><p>{authMode === 'register' ? 'One small step toward better conversations.' : 'Your corner of the internet is right here.'}</p><form onSubmit={submitAuth}>{authMode === 'register' && <label>Your name<input required value={auth.username} onChange={e => setAuth({ ...auth, username: e.target.value })} placeholder="How should we call you?" /></label>}<label>Email address<input required type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="you@example.com" /></label><label>Password<input required type="password" minLength={6} value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder="At least 6 characters" /></label><button className="primary-button" disabled={busy}>{busy ? 'One moment…' : authMode === 'register' ? 'Create account' : 'Sign in'} <span>↗</span></button></form><p className="auth-switch">{authMode === 'register' ? 'Already part of the room?' : 'New around here?'} <button onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}>{authMode === 'register' ? 'Sign in' : 'Create an account'}</button></p></section></div>}
    {toast && <div className="toast"><span>✳</span>{toast}</div>}

  </main>;
}
export default App;
