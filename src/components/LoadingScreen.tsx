import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { DevilIcon } from './DevilIcon';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const text = "Должная Душа";
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setShowText(true);
    }, 1500); // Start typing after drawing starts

    const timer2 = setTimeout(() => {
      onComplete();
    }, 5000); // Total loading time

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.04 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div 
      className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--color-bg-dark)] z-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
    >
      <div className="w-48 h-48 mb-8">
        <DevilIcon animateDraw={true} className="w-full h-full" />
      </div>
      
      <div className="h-12 flex items-center justify-center">
        {showText && (
          <motion.div
            className="flex text-3xl md:text-5xl font-mono font-bold tracking-widest text-[var(--color-text-main)]"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {text.split("").map((char, index) => (
              <motion.span
                key={index}
                variants={child}
                className={char === " " ? "w-4" : ""}
                style={{
                  color: index < 7 ? "var(--color-ash-red-light)" : "var(--color-swamp-green-light)"
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>
        )}
      </div>
      
      <motion.div 
        className="mt-12 text-xs font-mono text-[var(--color-text-muted)] opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 3, duration: 1 }}
      >
        Инициализация аналитики...
      </motion.div>
    </motion.div>
  );
};
