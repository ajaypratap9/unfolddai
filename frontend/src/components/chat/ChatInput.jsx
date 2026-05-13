import React, { useRef, useEffect } from 'react';
import { SendHorizontal } from 'lucide-react';
import { useHaptics } from '../../hooks/useHaptics';

export function ChatInput({ value, onChange, onSend, disabled }) {
  const textareaRef = useRef(null);
  const haptics = useHaptics();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  const handleSend = () => {
    if (!disabled && value.trim()) {
      onSend();
    }
  };

  return (
    <div className="bg-white border-t border-border p-4 w-full">
      <div className="max-w-3xl mx-auto relative flex items-end gap-2 bg-bg-secondary rounded-2xl p-2 border border-border focus-within:border-border-focus transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Unfoldd..."
          className="w-full max-h-[120px] bg-transparent outline-none resize-none py-2 px-3 text-text-primary placeholder:text-text-secondary custom-scrollbar"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
        >
          <SendHorizontal size={20} />
        </button>
      </div>
    </div>
  );
}
