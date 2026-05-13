import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useHaptics } from '../../hooks/useHaptics';

export function CodeBlock({ node, inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const haptics = useHaptics();

  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = () => {
    haptics.lightTap();
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className="bg-bg-tertiary px-1.5 py-0.5 rounded-md font-mono text-[0.9em]" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group rounded-xl overflow-hidden bg-[#1A1A2E] my-4 text-white">
      {language && (
        <div className="flex justify-between items-center px-4 py-2 bg-[#121222] text-xs text-gray-400 font-mono">
          <span>{language.toUpperCase()}</span>
          <button 
            onClick={handleCopy}
            className="hover:text-white transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>
      )}
      {!language && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleCopy}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>
      )}
      <div className="overflow-x-auto p-4 text-[0.9em] leading-relaxed">
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    </div>
  );
}
