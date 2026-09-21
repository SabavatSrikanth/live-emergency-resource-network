import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, Shield, Sparkles, Users, Radio } from 'lucide-react';
import api from '../services/api';
import { socket } from '../services/socket';
import useAuthStore from '../store/useAuthStore';

export default function Chat() {
  const { user } = useAuthStore();
  const [activeChannel, setActiveChannel] = useState('ai-dispatch');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const channels = [
    { id: 'ai-dispatch', name: 'Emergency AI Dispatcher', desc: 'Real-time AI triage & protocol advisor', icon: Sparkles },
    { id: 'incident-coordination', name: 'Inter-Agency Command', desc: 'Hospitals, Fire & EMS coordinators', icon: Shield },
    { id: 'volunteer-broadcast', name: 'Volunteer Broadcast', desc: 'Field alerts & squad deployments', icon: Radio },
  ];

  const fetchHistory = async (channelId) => {
    try {
      const res = await api.get(`/api/chat/messages?channel=${channelId}`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  useEffect(() => {
    fetchHistory(activeChannel);
    socket.emit('join:channel', activeChannel);

    const handleMessage = (msg) => {
      if (msg.channel === activeChannel) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('chat:message', handleMessage);

    return () => {
      socket.emit('leave:channel', activeChannel);
      socket.off('chat:message', handleMessage);
    };
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText;
    setInputText('');
    setIsSending(true);

    try {
      await api.post('/api/chat/messages', {
        channel: activeChannel,
        text: textToSend,
        sender: {
          name: user?.name || 'Dispatcher Unit',
          role: user?.role || 'Citizen'
        }
      });
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const currentChanObj = channels.find(c => c.id === activeChannel);

  return (
    <div className="h-[calc(100vh-10rem)] flex bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
      {/* Sidebar List */}
      <div className="w-80 border-r border-slate-200 dark:border-dark-border flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-dark-border">
          <h3 className="font-bold text-base">Crisis Channels</h3>
          <p className="text-xs text-slate-500">Encrypted real-time feeds</p>
        </div>

        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
          {channels.map((chan) => {
            const Icon = chan.icon;
            const isActive = activeChannel === chan.id;
            return (
              <button 
                key={chan.id}
                onClick={() => setActiveChannel(chan.id)}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-3 transition-all ${
                  isActive 
                    ? 'bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 font-bold' 
                    : 'hover:bg-slate-50 dark:hover:bg-dark-bg text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-500'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs truncate">{chan.name}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{chan.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main chat window */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-dark-bg/40">
        {/* Header bar */}
        <div className="p-4 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
              {currentChanObj?.icon && <currentChanObj.icon className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-sm">{currentChanObj?.name}</h4>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">● Socket Sync Active</span>
            </div>
          </div>
        </div>

        {/* Messages body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-dark-border mb-2" />
              <h4 className="font-bold text-sm">Channel Feed Ready</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Send a message to query the AI Dispatcher or broadcast emergency updates.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isAI = msg.sender?.isAI;
              const isMe = msg.sender?.name === user?.name;

              return (
                <div 
                  key={msg._id || idx} 
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-1.5 mb-1 px-1">
                    <span className={`text-[10px] font-bold ${isAI ? 'text-rose-500' : 'text-slate-500'}`}>
                      {isAI ? '🤖 LERN Command AI' : msg.sender?.name}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  <div className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed shadow-sm ${
                    isAI 
                      ? 'bg-rose-600 text-white font-medium rounded-tl-none border border-rose-500/50' 
                      : isMe 
                      ? 'bg-brand-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-800 dark:text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input bar */}
        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-dark-card border-t border-slate-200 dark:border-dark-border">
          <div className="relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={activeChannel === 'ai-dispatch' ? "Ask AI (e.g. 'Status of hospital beds', 'Report fire on Elm St')..." : "Broadcast message to channel..."}
              className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            />
            <button 
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
