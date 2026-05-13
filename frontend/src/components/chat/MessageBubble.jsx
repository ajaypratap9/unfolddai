import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { Copy, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { UnfoldLogo } from '../ui/Brand';
import { CodeBlock } from './CodeBlock';
import { FormulaBlock } from './FormulaBlock';
import { ThinkingDots } from './ThinkingDots';
import { useHaptics } from '../../hooks/useHaptics';

export function MessageBubble({ message, isStreaming }) {
  const { role, content, created_at } = message;
  const isUser = role === 'user';
  const haptics = useHaptics();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    haptics.lightTap();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const MarkdownComponents = {
    code: CodeBlock,
    // math/inline math rendering handled by rehypeKatex, but we can override if needed.
    // remarkMath outputs 'math' and 'inlineMath' elements
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'max-w-[75%]' : ''}`}>
        <div className={`relative flex group ${isUser ? 'justify-end' : 'justify-start items-start gap-3'}`}>
          
          {!isUser && (
            <div className="flex-shrink-0 mt-1">
              <UnfoldLogo size={24} />
            </div>
          )}

          <div 
            className={`px-4 py-3 rounded-2xl ${
              isUser 
                ? 'bg-user-bubble text-white rounded-tr-sm' 
                : 'bg-ai-bubble border border-border rounded-tl-sm text-text-primary'
            }`}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
            ) : content ? (
              <div className="prose prose-sm md:prose-base max-w-none text-text-primary">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeHighlight, rehypeKatex]}
                  components={MarkdownComponents}
                >
                  {content}
                </ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                )}
              </div>
            ) : (
              <ThinkingDots />
            )}
          </div>

          {!isUser && content && !isStreaming && (
            <div className="absolute -right-24 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button onClick={handleCopy} className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-bg-secondary">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
              <button onClick={() => haptics.lightTap()} className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-bg-secondary">
                <ThumbsUp size={14} />
              </button>
              <button onClick={() => haptics.lightTap()} className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-bg-secondary">
                <ThumbsDown size={14} />
              </button>
            </div>
          )}
        </div>
        <span className={`text-[11px] text-text-muted ${isUser ? 'text-right pr-1' : 'pl-10'}`}>
          {formatTime(created_at)}
        </span>
      </div>
    </motion.div>
  );
}
