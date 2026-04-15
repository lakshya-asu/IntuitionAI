import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export type TileSize = '1x1' | '2x1' | '1x2' | '2x2' | 'full';

interface MotionTileProps {
  id: string;
  size?: TileSize;
  priority?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function MotionTile({ 
  id, 
  size = '1x1', 
  priority = false, 
  children, 
  className = '',
  onClick 
}: MotionTileProps) {
  
  // Define grid spans based on size
  let colSpan = 'col-span-1 md:col-span-1 lg:col-span-1';
  let rowSpan = 'row-span-1';
  
  switch (size) {
    case '2x1':
      colSpan = 'col-span-1 md:col-span-2 lg:col-span-2';
      rowSpan = 'row-span-1';
      break;
    case '1x2':
      colSpan = 'col-span-1 md:col-span-1 lg:col-span-1';
      rowSpan = 'row-span-2';
      break;
    case '2x2':
      colSpan = 'col-span-1 md:col-span-2 lg:col-span-2';
      rowSpan = 'row-span-2';
      break;
    case 'full':
      colSpan = 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4';
      rowSpan = 'row-span-1';
      break;
    default: // 1x1
      break;
  }

  // Animation variants
  const variants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', bounce: 0.3, duration: 0.6 } },
    exit: { opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      layoutId={`tile-${id}`}
      layout
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClick}
      className={`relative w-full h-full glassmorphism rounded-[24px] overflow-hidden border border-white/5 shadow-xl transition-colors hover:border-white/10 ${colSpan} ${rowSpan} ${priority ? 'ring-1 ring-[#FEFFF5]/30' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        order: priority ? -1 : 0 // Help CSS flex/grid order logic if needed
      }}
    >
      {children}
    </motion.div>
  );
}
