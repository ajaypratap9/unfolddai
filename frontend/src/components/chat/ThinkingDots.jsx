import React from 'react';
import { motion } from 'framer-motion';

export function ThinkingDots() {
  const dotVariants = {
    bounce: {
      y: [0, -6, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="flex items-center gap-1.5 h-6">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={i}
          variants={dotVariants}
          animate="bounce"
          style={{ 
            animationDelay: `${delay}s`,
            width: '8px', 
            height: '8px', 
            backgroundColor: 'var(--color-primary)', 
            borderRadius: '50%' 
          }}
        />
      ))}
    </div>
  );
}
