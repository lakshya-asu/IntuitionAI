import { useRef, useState } from "react";
import { motion } from 'framer-motion';

interface RecommendationProps {
  recommendations: {
    id: string;
    title: string;
    description: string;
    match: number;
    icon: string;
    iconBg: string; // no longer needed for glass design, can be ignored
    topics: string[];
    estimatedTime: string;
  }[];
}

export default function Recommendations({ recommendations }: RecommendationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!recommendations) return null;

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollability, 400);
    }
  };

  return (
    <div className="mb-10 relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Recommended For You
          </h2>
          <p className="text-sm text-slate-400 mt-1">Curated by your Recommendation Agent</p>
        </div>
        <div className="flex space-x-3 items-center">
          <button className="px-4 py-1.5 text-sm font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors">
            Explore All
          </button>
          <div className="flex space-x-1">
            <button 
              className={`p-1.5 rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all ${!canScrollLeft ? 'opacity-30 cursor-not-allowed' : ''}`}
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
            >
              <span className="material-icons text-sm">chevron_left</span>
            </button>
            <button 
              className={`p-1.5 rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all ${!canScrollRight ? 'opacity-30 cursor-not-allowed' : ''}`}
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
            >
              <span className="material-icons text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-6 space-x-6 hide-scrollbar snap-x snap-mandatory"
        onScroll={checkScrollability}
      >
        {recommendations.map((rec, index) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{ y: -8, scale: 1.02 }}
            key={rec.id} 
            className="flex-shrink-0 w-[340px] snap-center rounded-2xl glassmorphism-dark border border-white/10 overflow-hidden group flex flex-col relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="p-6 flex flex-col h-full relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
                  <span className="material-icons text-2xl text-purple-400">
                    {rec.icon.startsWith('text-') ? 'code' : rec.icon}
                  </span>
                </div>
                <div className={`px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-full flex items-center shadow-lg`}>
                  <span className="material-icons text-[10px] mr-1">auto_awesome</span>
                  {rec.match}% Match
                </div>
              </div>
              
              <h3 className="font-bold text-lg text-white mb-2 line-clamp-2">{rec.title}</h3>
              <p className="text-sm text-slate-400 flex-1 line-clamp-3 mb-4">{rec.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {rec.topics.slice(0, 3).map((topic, idx) => (
                  <span key={idx} className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md bg-black/40 text-slate-300 border border-white/5">
                    {topic}
                  </span>
                ))}
            {rec.topics.length > 3 && (
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-black/40 text-slate-500 border border-white/5">
                +{rec.topics.length - 3}
              </span>
            )}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-auto">
                <div className="flex items-center text-xs text-slate-400 font-medium">
                  <span className="material-icons text-sm mr-1 opacity-70">schedule</span>
                  {rec.estimatedTime}
                </div>
                <button className="flex items-center text-sm font-bold text-purple-400 group-hover:text-pink-400 transition-colors">
                  <span>Start Module</span>
                  <motion.span 
                    className="material-icons text-sm ml-1"
                    initial={{ x: 0 }}
                    whileHover={{ x: 4 }}
                  >
                    arrow_forward
                  </motion.span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
