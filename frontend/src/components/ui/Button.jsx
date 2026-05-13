import React from 'react';
import { motion } from 'framer-motion';

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  type = 'button', 
  className = '',
  disabled = false,
  fullWidth = false,
  ...props
}) {
  const baseClasses = "flex items-center justify-center font-medium rounded-xl transition-colors duration-200 outline-none";
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-600 disabled:bg-blue-300",
    secondary: "bg-bg-tertiary text-text-primary hover:bg-gray-200 disabled:bg-gray-100",
    outline: "border border-border text-text-primary hover:bg-bg-secondary",
    ghost: "bg-transparent text-text-primary hover:bg-bg-secondary"
  };
  
  const widthClass = fullWidth ? "w-full" : "";
  const classes = `${baseClasses} px-4 py-3 ${variants[variant]} ${widthClass} ${className}`;

  return (
    <motion.button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
