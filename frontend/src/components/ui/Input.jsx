import React, { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';

export const Input = forwardRef(({ 
  label, 
  error, 
  className = '', 
  containerClassName = '',
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
      <motion.div
        animate={error ? { x: [0, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <input
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (props.onBlur) props.onBlur(e);
          }}
          className={`w-full px-4 py-3 rounded-xl bg-bg-secondary border outline-none transition-colors duration-200 text-text-primary placeholder:text-text-secondary ${
            error ? 'border-error' : isFocused ? 'border-border-focus' : 'border-border'
          } ${className}`}
          {...props}
        />
      </motion.div>
      {error && <span className="text-sm text-error">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
