import React from 'react';
import { motion } from 'motion/react';

interface DevilIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  animateDraw?: boolean;
}

export const DevilIcon: React.FC<DevilIconProps> = ({ animateDraw = false, className, ...props }) => {
  return (
    <motion.img
      src="/assets/logo/logo.svg"
      alt="Logo"
      className={className}
      initial={animateDraw ? { opacity: 0, scale: 0.8 } : false}
      animate={animateDraw ? { opacity: 1, scale: 1 } : false}
      transition={animateDraw ? { duration: 1.5, ease: "easeOut" } : undefined}
      {...(props as any)}
    />
  );
};
