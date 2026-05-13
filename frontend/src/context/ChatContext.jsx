import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export const ChatContext = createContext({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  sending: false,
  streamingMessage: '',
  loadConversations: async () => {},
  selectConversation: async () => {},
  createConversation: async () => {},
  sendMessage: async () => {},
});

export function ChatProvider({ children }) {
  const { session } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

  const loadConversations = useCallback(async () => {
    if (!session) return;
    try {
      const { data } = await api.get('/conversations');
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  }, [session]);

  const selectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    setMessages([]);
    setLoading(true);
    try {
      const { data } = await api.get(`/conversations/${conversation.id}/messages`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async () => {
    try {
      const { data } = await api.post('/conversations', { title: 'New chat' });
      setConversations(prev => [data, ...prev]);
      setCurrentConversation(data);
      setMessages([]);
      return data;
    } catch (err) {
      console.error('Failed to create conversation', err);
    }
  };

  const sendMessage = async (content) => {
    let targetConvId = currentConversation?.id;
    if (!targetConvId) {
      const newConv = await createConversation();
      if (!newConv) return;
      targetConvId = newConv.id;
    }

    // Optimistically add user message
    const tempUserMsg = { id: Date.now().toString(), role: 'user', content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);
    setSending(true);
    setStreamingMessage('');

    try {
      // Setup SSE
      const token = session.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conversationId: targetConvId, message: content })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let streamedContent = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              if (dataStr) {
                try {
                  const dataObj = JSON.parse(dataStr);
                  if (dataObj.token) {
                    streamedContent += dataObj.token;
                    setStreamingMessage(streamedContent);
                  }
                  if (dataObj.error) {
                    console.error("SSE Error:", dataObj.error);
                  }
                } catch (e) {
                  // ignore parse error for partial chunks if any
                }
              }
            }
          }
        }
      }

      // Finalize message
      const aiMsg = { id: Date.now().toString() + 'ai', role: 'assistant', content: streamedContent, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
      setStreamingMessage('');
      
      // Refresh conversations to get new title if it was generated
      loadConversations();

    } catch (err) {
      console.error('Send message failed', err);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <ChatContext.Provider value={{
      conversations,
      currentConversation,
      messages,
      loading,
      sending,
      streamingMessage,
      loadConversations,
      selectConversation,
      createConversation,
      sendMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
}
