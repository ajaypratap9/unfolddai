import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AnimatedPage({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`min-h-screen w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
