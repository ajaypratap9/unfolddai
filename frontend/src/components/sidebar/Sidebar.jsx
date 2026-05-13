import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, MessageSquare, Settings2, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UnfoldWordmark } from '../ui/Brand';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useHaptics } from '../../hooks/useHaptics';
import api from '../../lib/api';

export function Sidebar({ isOpen, onClose, isMobile }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { conversations, currentConversation, selectConversation, createConversation, loadConversations } = useChat();
  const haptics = useHaptics();
  
  const [activeMenuId, setActiveMenuId] = useState(null);

  const formatRelativeTime = (dateStr) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    if (diff > -1) return 'Today';
    if (diff > -2) return 'Yesterday';
    return `${Math.abs(Math.round(diff))} days ago`;
  };

  const handleNewChat = () => {
    haptics.lightTap();
    createConversation();
    if (isMobile) onClose();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    haptics.heavyTap();
    try {
      await api.delete(`/conversations/${id}`);
      loadConversations();
    } catch (err) {
      console.error(err);
    }
    setActiveMenuId(null);
  };

  const sidebarVariants = {
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } }
  };

  const content = (
    <div className="flex flex-col h-full bg-bg-secondary w-[260px] border-r border-border">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button onClick={isMobile ? onClose : undefined} className="outline-none">
          <UnfoldWordmark size={24} />
        </button>
      </div>

      {/* Primary Actions */}
      <div className="px-3 flex flex-col gap-1">
        <button 
          onClick={handleNewChat}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-primary hover:bg-gray-200 transition-colors"
        >
          <PenLine size={18} />
          <span className="font-medium text-sm">New chat</span>
        </button>
        <button 
          onClick={() => { haptics.lightTap(); navigate('/history'); if (isMobile) onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-primary hover:bg-gray-200 transition-colors"
        >
          <MessageSquare size={18} />
          <span className="font-medium text-sm">Chats</span>
        </button>
      </div>

      <div className="mx-4 my-2 border-b border-border" />

      {/* Recent Chats */}
      <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
        <div className="text-xs font-semibold text-text-muted mb-2 px-3">Recent</div>
        <motion.div variants={{ open: { transition: { staggerChildren: 0.03 } } }}>
          {conversations.slice(0, 10).map((conv) => (
            <motion.div 
              key={conv.id}
              variants={{ open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: 10 } }}
              className={`relative flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer mb-1 group transition-colors ${
                currentConversation?.id === conv.id ? 'bg-primary-light text-primary' : 'text-text-primary hover:bg-gray-200'
              }`}
              onClick={() => {
                selectConversation(conv);
                if (isMobile) onClose();
              }}
            >
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{conv.title}</span>
                <span className="text-[11px] text-text-muted">{formatRelativeTime(conv.updated_at)}</span>
              </div>
              <button 
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300 rounded transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(activeMenuId === conv.id ? null : conv.id);
                }}
              >
                <MoreVertical size={14} />
              </button>
              
              {activeMenuId === conv.id && (
                <div className="absolute right-2 top-8 bg-white border border-border shadow-lg rounded-md py-1 z-50">
                  <button className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-100 w-full text-left" onClick={(e) => e.stopPropagation()}>
                    <Edit2 size={12} /> Rename
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-error hover:bg-red-50 w-full text-left" onClick={(e) => handleDelete(conv.id, e)}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="p-3 border-t border-border flex items-center justify-between">
        <button 
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 hover:bg-gray-200 p-2 rounded-lg transition-colors flex-1 overflow-hidden"
        >
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
            {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium truncate">{profile?.display_name || 'User'}</span>
        </button>
        <button 
          onClick={() => { haptics.lightTap(); navigate('/settings'); if (isMobile) onClose(); }}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Settings2 size={20} />
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 left-0 bottom-0 z-50 shadow-xl"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      variants={sidebarVariants}
      initial="closed"
      animate={isOpen ? 'open' : 'closed'}
      className="h-screen flex-shrink-0 overflow-hidden"
      style={{ width: isOpen ? 260 : 0 }}
    >
      {content}
    </motion.div>
  );
}
