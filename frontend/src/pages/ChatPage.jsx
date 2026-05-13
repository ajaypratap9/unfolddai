import React, { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { UnfoldLogo } from '../components/ui/Brand';
import { useChat } from '../hooks/useChat';
import { AnimatedPage } from '../components/layout/AnimatedPage';
import { ChatProvider } from '../context/ChatContext';

function ChatPageContent() {
  const { messages, loading, sending, streamingMessage, sendMessage } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && !sidebarOpen) setSidebarOpen(true);
      if (mobile && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto-scroll on new message or streaming
  useEffect(() => {
    // Only force scroll if we are already near the bottom to avoid hijacking
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 200;
    
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, streamingMessage]);

  const handleSend = () => {
    sendMessage(inputValue);
    setInputValue('');
  };

  return (
    <AnimatedPage className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
      
      <div className="flex-1 flex flex-col relative h-full w-full">
        {/* Mobile Header */}
        {isMobile && (
          <div className="absolute top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-border flex items-center px-4 z-10">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-text-primary">
              <Menu size={24} />
            </button>
            <div className="flex-1 text-center font-semibold">unfoldd</div>
            <div className="w-10" />
          </div>
        )}

        {/* Message List */}
        <div 
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto custom-scrollbar ${isMobile ? 'pt-16 pb-4' : 'pt-8 pb-4'} px-4 md:px-8`}
        >
          <div className="max-w-3xl mx-auto h-full flex flex-col">
            {messages.length === 0 && !loading && !sending ? (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-4 opacity-50">
                <UnfoldLogo size={60} />
                <p>How can I help you unfold your ideas today?</p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <MessageBubble 
                    key={msg.id || i} 
                    message={msg} 
                  />
                ))}
                {sending && !streamingMessage && (
                  <MessageBubble 
                    message={{ role: 'assistant', content: '', created_at: new Date().toISOString() }} 
                  />
                )}
                {streamingMessage && (
                  <MessageBubble 
                    message={{ role: 'assistant', content: streamingMessage, created_at: new Date().toISOString() }} 
                    isStreaming={true}
                  />
                )}
              </>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Bar */}
        <div className="w-full bg-bg-primary z-20" style={{ paddingBottom: 'env(keyboard-inset-height, 0px)' }}>
          <ChatInput 
            value={inputValue} 
            onChange={setInputValue} 
            onSend={handleSend} 
            disabled={sending && !streamingMessage} // disabled while waiting for first chunk
          />
        </div>
      </div>
    </AnimatedPage>
  );
}

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
}
