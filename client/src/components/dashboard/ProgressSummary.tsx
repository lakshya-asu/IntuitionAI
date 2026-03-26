import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressSummaryProps {
  stats: {
    masteryScore: number;
    masteryGrowth: string;
    streak: number;
    streakDays: { date: string; completed: boolean }[];
    completedModules: number;
    totalModules: number;
    focusAreas: { name: string; percentage: number; color: string }[];
  };
}

export default function ProgressSummary({ stats }: ProgressSummaryProps) {
  const focusAreasChartRef = useRef<HTMLCanvasElement>(null);
  const focusAreasChartInstance = useRef<Chart | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    if (stats?.focusAreas && focusAreasChartRef.current) {
      if (focusAreasChartInstance.current) {
        focusAreasChartInstance.current.destroy();
      }

      const ctx = focusAreasChartRef.current.getContext('2d');
      if (ctx) {
        focusAreasChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: stats.focusAreas.map(area => area.name),
            datasets: [{
              data: stats.focusAreas.map(area => area.percentage),
              backgroundColor: stats.focusAreas.map(area => area.color),
              borderWidth: 0,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
              legend: { display: false }
            }
          }
        });
      }
    }

    return () => {
      if (focusAreasChartInstance.current) {
        focusAreasChartInstance.current.destroy();
        focusAreasChartInstance.current = null;
      }
    };
  }, [stats?.focusAreas]);

  if (!stats) return null;

  const completedPercentage = (stats.completedModules / stats.totalModules) * 100;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, type: 'spring' }
    })
  };

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Mastery Level Card */}
      <motion.div 
        custom={0} initial="hidden" animate="visible" variants={cardVariants}
        onMouseEnter={() => setHoveredCard('mastery')} onMouseLeave={() => setHoveredCard(null)}
        className="relative p-6 rounded-[24px] bg-[#141414] border border-white/5 group cursor-pointer overflow-hidden transition-all duration-300 hover:bg-[#1A1A1A]"
      >
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[#959C95] font-bold text-[10px] tracking-widest uppercase">Mastery Level</h3>
            <span className="material-icons text-[#FEFFF5]">stars</span>
          </div>
          <div>
            <div className="flex items-end mb-4">
              <span className="text-5xl font-extrabold text-[#FEFFF5] tracking-tighter">{stats.masteryScore}</span>
              <span className="ml-1 text-lg text-[#959C95] mb-1 font-medium">/100</span>
            </div>
            <div className="w-full bg-[#0A0A0A] rounded-full h-1.5 overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.masteryScore}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="bg-[#FEFFF5] h-1.5 rounded-full"
              />
            </div>
            
            <AnimatePresence>
              {hoveredCard === 'mastery' ? (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mt-4 text-xs text-[#FEFFF5] bg-[#0A0A0A] p-3 rounded-xl border border-white/10"
                >
                  Evaluator Agent: Your cognitive profile shows exceptional growth in logical reasoning domains!
                </motion.p>
              ) : (
                <motion.p 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="mt-4 text-xs text-[#FEFFF5] flex items-center font-bold"
                >
                  <span className="material-icons text-sm mr-1 leading-none">trending_up</span>
                  <span>{stats.masteryGrowth}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      
      {/* Learning Streak Card */}
      <motion.div 
        custom={1} initial="hidden" animate="visible" variants={cardVariants}
        className="relative p-6 rounded-[24px] bg-[#141414] border border-white/5 group overflow-hidden hover:bg-[#1A1A1A] transition-all duration-300"
      >
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[#959C95] font-bold text-[10px] tracking-widest uppercase">Learning Streak</h3>
            <span className="material-icons text-[#FEFFF5]">local_fire_department</span>
          </div>
          <div>
            <div className="flex items-end mb-4">
              <span className="text-5xl font-extrabold text-[#FEFFF5] tracking-tighter">{stats.streak}</span>
              <span className="ml-1 text-lg text-[#959C95] mb-1 font-medium">days</span>
            </div>
            <div className="flex justify-between items-center space-x-1">
              {stats.streakDays.map((day, index) => (
                <motion.div 
                  key={index} 
                  whileHover={{ scale: 1.1 }}
                  className={`h-6 flex-1 rounded-sm ${day.completed ? 'bg-[#FEFFF5]' : 'bg-[#0A0A0A] border border-white/5'}`}
                  title={day.date}
                />
              ))}
            </div>
            <p className="mt-4 text-xs text-[#959C95] font-medium transition-colors group-hover:text-white">Consistency is key!</p>
          </div>
        </div>
      </motion.div>
      
      {/* Completed Modules Card */}
      <motion.div 
        custom={2} initial="hidden" animate="visible" variants={cardVariants}
        className="relative p-6 rounded-[24px] bg-[#141414] border border-white/5 group overflow-hidden hover:bg-[#1A1A1A] transition-all duration-300"
      >
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[#959C95] font-bold text-[10px] tracking-widest uppercase">Curriculum</h3>
            <span className="material-icons text-[#FEFFF5]">check_circle</span>
          </div>
          <div>
            <div className="flex items-end mb-4">
              <span className="text-5xl font-extrabold text-[#FEFFF5] tracking-tighter">{stats.completedModules}</span>
              <span className="ml-1 text-lg text-[#959C95] mb-1 font-medium">/{stats.totalModules}</span>
            </div>
            <div className="w-full bg-[#0A0A0A] rounded-full h-1.5 overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completedPercentage}%` }}
                transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                className="bg-[#FEFFF5] h-1.5 rounded-full"
              />
            </div>
            <p className="mt-4 text-xs text-[#959C95] font-medium transition-colors group-hover:text-white">{Math.round(completedPercentage)}% of your dynamic syllabus completed.</p>
          </div>
        </div>
      </motion.div>
      
      {/* Focus Areas Card */}
      <motion.div 
        custom={3} initial="hidden" animate="visible" variants={cardVariants}
        className="relative p-6 rounded-[24px] bg-[#141414] border border-white/5 flex flex-col"
      >
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#959C95] font-bold text-[10px] tracking-widest uppercase">Focus Areas</h3>
            <span className="material-icons text-[#FEFFF5]">insights</span>
          </div>
          <div className="flex-1 min-h-[80px] relative flex items-center justify-center">
            <canvas ref={focusAreasChartRef}></canvas>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-[#FEFFF5] uppercase tracking-widest mt-1">Top</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
