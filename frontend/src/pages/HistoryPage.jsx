import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, MessageSquare, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { AnimatedPage } from '../components/layout/AnimatedPage';
import { useHaptics } from '../hooks/useHaptics';

export default function HistoryPage() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data } = await api.get('/conversations');
      setConversations(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    haptics.heavyTap();
    try {
      setConversations(prev => prev.filter(c => c.id !== id));
      await api.delete(`/conversations/${id}`);
    } catch (err) {
      console.error(err);
      loadConversations(); // revert on failure
    }
  };

  const filtered = conversations.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const groupConversations = (convos) => {
    const groups = {
      Today: [],
      Yesterday: [],
      'This week': [],
      Earlier: []
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    convos.forEach(c => {
      const d = new Date(c.updated_at);
      if (d >= today) groups['Today'].push(c);
      else if (d >= yesterday) groups['Yesterday'].push(c);
      else if (d >= weekAgo) groups['This week'].push(c);
      else groups['Earlier'].push(c);
    });

    return groups;
  };

  const groups = groupConversations(filtered);

  return (
    <AnimatedPage className="bg-bg-primary min-h-screen flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-border sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <button onClick={() => { haptics.lightTap(); navigate('/chat'); }} className="p-2 -ml-2 rounded-full hover:bg-bg-secondary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold flex-1">All conversations</h1>
      </div>

      <div className="p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input 
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-bg-secondary border border-border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-border-focus transition-colors"
          />
        </div>

        {loading ? (
          <div className="text-center text-text-muted mt-10">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-text-muted gap-4">
            <MessageSquare size={48} className="opacity-20" />
            <p>No conversations found.</p>
          </div>
        ) : (
          <motion.div
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            initial="hidden"
            animate="show"
          >
            {Object.entries(groups).map(([label, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={label} className="mb-6">
                  <h2 className="text-sm font-semibold text-text-muted mb-3 px-1">{label}</h2>
                  <div className="flex flex-col gap-2">
                    {items.map(conv => (
                      <motion.div
                        key={conv.id}
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          show: { opacity: 1, y: 0 }
                        }}
                        className="relative overflow-hidden rounded-xl bg-bg-secondary"
                      >
                        {/* Delete Background */}
                        <div className="absolute inset-y-0 right-0 w-24 bg-error flex items-center justify-end px-6">
                          <Trash2 className="text-white" size={20} />
                        </div>

                        {/* Swipeable Foreground */}
                        <motion.div
                          drag="x"
                          dragConstraints={{ left: -80, right: 0 }}
                          dragElastic={0.1}
                          onDragEnd={(e, { offset }) => {
                            if (offset.x < -50) handleDelete(conv.id);
                          }}
                          onClick={() => { haptics.lightTap(); navigate('/chat', { state: { conversationId: conv.id } }); }}
                          className="relative z-10 bg-white border border-border p-4 w-full flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-medium truncate text-text-primary">{conv.title}</span>
                            <span className="text-xs text-text-muted mt-1">
                              {new Date(conv.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </AnimatedPage>
  );
}
