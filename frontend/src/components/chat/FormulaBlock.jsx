import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export function FormulaBlock({ inline, children }) {
  try {
    const html = katex.renderToString(String(children), {
      throwOnError: false,
      displayMode: !inline,
    });
    
    return (
      <span dangerouslySetInnerHTML={{ __html: html }} />
    );
  } catch (error) {
    return (
      <span className="text-error bg-red-50 px-1 rounded">
        {String(children)} {/* Fallback on error */}
      </span>
    );
  }
}
