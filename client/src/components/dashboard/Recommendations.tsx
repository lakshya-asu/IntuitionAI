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
          <h2 className="text-3xl font-extrabold tracking-tighter text-[#FEFFF5]">
            Recommended For You
          </h2>
          <p className="text-[#959C95] text-sm mt-1">Curated by your Recommendation Agent</p>
        </div>
        <div className="flex space-x-3 items-center">
          <button className="px-5 py-2 text-sm font-bold rounded-full bg-[#141414] text-[#FEFFF5] border border-white/10 hover:bg-[#1A1A1A] transition-colors">
            Explore All
          </button>
          <div className="flex space-x-2">
            <button 
              className={`p-2 rounded-full border border-white/10 bg-[#141414] text-[#959C95] hover:text-[#FEFFF5] hover:bg-[#1A1A1A] transition-all ${!canScrollLeft ? 'opacity-30 cursor-not-allowed' : ''}`}
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
            >
              <span className="material-icons text-sm leading-none">chevron_left</span>
            </button>
            <button 
              className={`p-2 rounded-full border border-white/10 bg-[#141414] text-[#959C95] hover:text-[#FEFFF5] hover:bg-[#1A1A1A] transition-all ${!canScrollRight ? 'opacity-30 cursor-not-allowed' : ''}`}
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
            >
              <span className="material-icons text-sm leading-none">chevron_right</span>
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
            className="flex-shrink-0 w-[340px] snap-center rounded-[24px] bg-[#141414] border border-white/5 overflow-hidden group flex flex-col relative transition-all duration-300 hover:bg-[#1A1A1A]"
          >
            
            <div className="p-6 flex flex-col h-full relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="h-12 w-12 rounded-full bg-[#0D0D0D] border border-white/10 flex items-center justify-center">
                  <span className="material-icons text-[#FEFFF5]">
                    {rec.icon.startsWith('text-') ? 'code' : rec.icon}
                  </span>
                </div>
                <div className={`px-3 py-1 bg-[#FEFFF5] text-[#0D0D0D] text-xs font-bold rounded-full flex items-center`}>
                  <span className="material-icons text-[10px] mr-1">auto_awesome</span>
                  {rec.match}% Match
                </div>
              </div>
              
              <h3 className="font-bold text-xl tracking-tight text-[#FEFFF5] mb-2 line-clamp-2">{rec.title}</h3>
              <p className="text-[#959C95] text-sm leading-relaxed flex-1 line-clamp-3 mb-6">{rec.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {rec.topics.slice(0, 3).map((topic, idx) => (
                  <span key={idx} className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full bg-[#0A0A0A] text-[#959C95] border border-white/5">
                    {topic}
                  </span>
                ))}
            {rec.topics.length > 3 && (
              <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-[#0A0A0A] text-[#959C95] border border-white/5">
                +{rec.topics.length - 3}
              </span>
            )}
              </div>
              
              <div className="flex justify-between items-center pt-5 border-t border-white/5 mt-auto">
                <div className="flex items-center text-xs text-[#959C95] font-bold tracking-wide">
                  <span className="material-icons text-sm mr-1">schedule</span>
                  {rec.estimatedTime}
                </div>
                <button className="flex items-center text-sm font-bold text-[#FEFFF5] group-hover:text-[#959C95] transition-colors">
                  <span>Start</span>
                  <motion.span 
                    className="material-icons text-sm ml-1 leading-none"
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
      
      <style>{`
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
