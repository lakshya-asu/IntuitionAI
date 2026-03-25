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
        className="relative p-5 rounded-2xl glassmorphism-dark group cursor-pointer overflow-hidden glow-border"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium text-sm tracking-wide uppercase">Mastery Level</h3>
            <span className="material-icons text-blue-400">stars</span>
          </div>
          <div>
            <div className="flex items-end mb-2">
              <span className="text-4xl font-extrabold text-white tracking-tight">{stats.masteryScore}</span>
              <span className="ml-1 text-lg text-slate-400 mb-1">/100</span>
            </div>
            <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.masteryScore}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="bg-gradient-to-r from-blue-400 to-indigo-500 h-1.5 rounded-full"
              />
            </div>
            
            <AnimatePresence>
              {hoveredCard === 'mastery' ? (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mt-3 text-xs text-blue-300 bg-blue-500/10 p-2 rounded border border-blue-500/20"
                >
                  Evaluator Agent: Your cognitive profile shows exceptional growth in logical reasoning domains!
                </motion.p>
              ) : (
                <motion.p 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="mt-3 text-xs text-emerald-400 flex items-center"
                >
                  <span className="material-icons text-sm mr-1">trending_up</span>
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
        className="relative p-5 rounded-2xl glassmorphism-dark group overflow-hidden glow-border"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium text-sm tracking-wide uppercase">Learning Streak</h3>
            <span className="material-icons text-orange-400">local_fire_department</span>
          </div>
          <div>
            <div className="flex items-end mb-3">
              <span className="text-4xl font-extrabold text-white tracking-tight">{stats.streak}</span>
              <span className="ml-1 text-lg text-slate-400 mb-1">days</span>
            </div>
            <div className="flex justify-between items-center space-x-1">
              {stats.streakDays.map((day, index) => (
                <motion.div 
                  key={index} 
                  whileHover={{ scale: 1.2 }}
                  className={`h-6 flex-1 rounded-sm shadow-inner ${day.completed ? 'bg-gradient-to-t from-orange-500 to-red-400' : 'bg-slate-800/50'}`}
                  title={day.date}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400 group-hover:text-orange-300 transition-colors">Consistency is key!</p>
          </div>
        </div>
      </motion.div>
      
      {/* Completed Modules Card */}
      <motion.div 
        custom={2} initial="hidden" animate="visible" variants={cardVariants}
        className="relative p-5 rounded-2xl glassmorphism-dark group overflow-hidden glow-border"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-medium text-sm tracking-wide uppercase">Curriculum</h3>
            <span className="material-icons text-emerald-400">check_circle</span>
          </div>
          <div>
            <div className="flex items-end mb-2">
              <span className="text-4xl font-extrabold text-white tracking-tight">{stats.completedModules}</span>
              <span className="ml-1 text-lg text-slate-400 mb-1">/{stats.totalModules}</span>
            </div>
            <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completedPercentage}%` }}
                transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                className="bg-gradient-to-r from-emerald-400 to-teal-500 h-1.5 rounded-full"
              />
            </div>
            <p className="mt-3 text-xs text-slate-400 group-hover:text-emerald-300 transition-colors">{Math.round(completedPercentage)}% of your dynamic syllabus completed.</p>
          </div>
        </div>
      </motion.div>
      
      {/* Focus Areas Card */}
      <motion.div 
        custom={3} initial="hidden" animate="visible" variants={cardVariants}
        className="relative p-5 rounded-2xl glassmorphism-dark group overflow-hidden glow-border flex flex-col"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-300 font-medium text-sm tracking-wide uppercase">Focus Areas</h3>
            <span className="material-icons text-purple-400">insights</span>
          </div>
          <div className="flex-1 min-h-[80px] relative flex items-center justify-center">
            <canvas ref={focusAreasChartRef}></canvas>
            {/* Inner text for doughnut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-bold text-white">Top 3</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
