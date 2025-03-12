import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

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

  useEffect(() => {
    if (stats?.focusAreas && focusAreasChartRef.current) {
      // Destroy previous chart instance if it exists
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
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
              legend: {
                display: false
              }
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

  if (!stats) {
    return null;
  }

  const completedPercentage = (stats.completedModules / stats.totalModules) * 100;

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Mastery Level Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-500 font-medium">Mastery Level</h3>
          <span className="material-icons text-primary">stars</span>
        </div>
        <div className="flex items-end">
          <span className="text-3xl font-bold text-slate-800">{stats.masteryScore}</span>
          <span className="ml-1 text-lg text-slate-500">/100</span>
        </div>
        <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full" 
            style={{ width: `${stats.masteryScore}%` }}
          ></div>
        </div>
        <p className="mt-2 text-xs text-success flex items-center">
          <span className="material-icons text-sm mr-1">trending_up</span>
          <span>{stats.masteryGrowth}</span>
        </p>
      </div>
      
      {/* Learning Streak Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-500 font-medium">Learning Streak</h3>
          <span className="material-icons text-warning">local_fire_department</span>
        </div>
        <div className="flex items-end">
          <span className="text-3xl font-bold text-slate-800">{stats.streak}</span>
          <span className="ml-1 text-lg text-slate-500">days</span>
        </div>
        <div className="mt-3 flex space-x-1">
          {stats.streakDays.map((day, index) => (
            <div 
              key={index} 
              className={`h-5 w-5 rounded-sm ${day.completed ? 'bg-warning' : 'bg-slate-200'}`}
              title={day.date}
            ></div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Keep it up!</p>
      </div>
      
      {/* Completed Modules Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-500 font-medium">Completed Modules</h3>
          <span className="material-icons text-accent">check_circle</span>
        </div>
        <div className="flex items-end">
          <span className="text-3xl font-bold text-slate-800">{stats.completedModules}</span>
          <span className="ml-1 text-lg text-slate-500">/{stats.totalModules}</span>
        </div>
        <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-accent h-2 rounded-full" 
            style={{ width: `${completedPercentage}%` }}
          ></div>
        </div>
        <p className="mt-2 text-xs text-slate-500">{Math.round(completedPercentage)}% of your curriculum</p>
      </div>
      
      {/* Focus Areas Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-500 font-medium">Focus Areas</h3>
          <span className="material-icons text-secondary">insights</span>
        </div>
        <div className="mt-2 h-[70px]">
          <canvas ref={focusAreasChartRef}></canvas>
        </div>
        <p className="mt-2 text-xs text-slate-500">Based on your recent activity</p>
      </div>
    </div>
  );
}
