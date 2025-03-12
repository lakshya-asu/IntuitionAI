import { useRef, useState } from "react";

interface RecommendationProps {
  recommendations: {
    id: string;
    title: string;
    description: string;
    match: number;
    icon: string;
    iconBg: string;
    topics: string[];
    estimatedTime: string;
  }[];
}

export default function Recommendations({ recommendations }: RecommendationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!recommendations) {
    return null;
  }

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      
      // Check scrollability after animation
      setTimeout(checkScrollability, 400);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Recommended For You</h2>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm rounded-lg bg-primary text-white shadow-sm hover:bg-primary/90">
            Explore All
          </button>
          <button 
            className={`p-1 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 ${!canScrollLeft ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            <span className="material-icons">chevron_left</span>
          </button>
          <button 
            className={`p-1 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 ${!canScrollRight ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-4 space-x-4 hide-scrollbar"
        onScroll={checkScrollability}
      >
        {recommendations.map((rec) => (
          <div 
            key={rec.id} 
            className="flex-shrink-0 w-full md:w-80 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className={`h-32 ${rec.iconBg} flex items-center justify-center`}>
              <span className={`material-icons text-5xl ${rec.icon.startsWith('text-') ? rec.icon : 'text-primary'}`}>
                {rec.icon.startsWith('text-') ? 'code' : rec.icon}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-slate-800">{rec.title}</h3>
                <span className={`${rec.match >= 95 ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'} text-xs px-2 py-1 rounded-full`}>
                  {rec.match}% Match
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2">{rec.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {rec.topics.map((topic, idx) => (
                  <span key={idx} className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                    {topic}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-slate-500">Estimated time: {rec.estimatedTime}</span>
                <button className="flex items-center text-primary hover:underline">
                  <span>Start</span>
                  <span className="material-icons text-sm ml-1">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
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
