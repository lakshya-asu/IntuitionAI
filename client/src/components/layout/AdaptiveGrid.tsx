import { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface AdaptiveGridProps {
  children: ReactNode;
  className?: string;
  columns?: number;
}

export default function AdaptiveGrid({ children, className = '', columns = 4 }: AdaptiveGridProps) {
  // We use CSS Grid. AnimatePresence lets elements scale cleanly out.
  // layout lets siblings naturally shift when elements appear/disappear.
  
  // Tailwind grid cols based on passed max columns (usually constrained up to xl)
  const getGridColsClass = () => {
    switch (columns) {
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  return (
    <motion.div 
      layout
      className={`grid ${getGridColsClass()} auto-rows-[minmax(180px,auto)] gap-6 p-4 w-full ${className}`}
    >
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </motion.div>
  );
}
