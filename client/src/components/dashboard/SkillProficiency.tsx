import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface SkillProficiencyProps {
  skills: {
    radar: {
      labels: string[];
      current: number[];
      average: number[];
    };
    breakdown: {
      skill: string;
      score: number;
    }[];
    recommendation: string;
  };
}

export default function SkillProficiency({ skills }: SkillProficiencyProps) {
  const skillRadarChartRef = useRef<HTMLCanvasElement>(null);
  const skillRadarChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (skills?.radar && skillRadarChartRef.current) {
      // Destroy previous chart instance if it exists
      if (skillRadarChartInstance.current) {
        skillRadarChartInstance.current.destroy();
      }

      const ctx = skillRadarChartRef.current.getContext('2d');
      if (ctx) {
        skillRadarChartInstance.current = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: skills.radar.labels,
            datasets: [{
              label: 'Current Proficiency',
              data: skills.radar.current,
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              borderColor: '#2563eb',
              pointBackgroundColor: '#2563eb',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: '#2563eb'
            }, {
              label: 'Average Learner',
              data: skills.radar.average,
              backgroundColor: 'rgba(148, 163, 184, 0.2)',
              borderColor: '#94a3b8',
              pointBackgroundColor: '#94a3b8',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: '#94a3b8'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
              line: {
                borderWidth: 2
              }
            },
            scales: {
              r: {
                angleLines: {
                  display: true,
                  color: 'rgba(226, 232, 240, 0.6)'
                },
                grid: {
                  color: 'rgba(226, 232, 240, 0.6)'
                },
                pointLabels: {
                  font: {
                    family: 'Inter',
                    size: 12
                  },
                  color: '#334155'
                },
                ticks: {
                  display: false,
                  stepSize: 20
                },
                suggestedMin: 0,
                suggestedMax: 100
              }
            }
          }
        });
      }
    }

    return () => {
      if (skillRadarChartInstance.current) {
        skillRadarChartInstance.current.destroy();
        skillRadarChartInstance.current = null;
      }
    };
  }, [skills?.radar]);

  if (!skills) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Your Skill Proficiency</h2>
        <button className="text-primary flex items-center hover:underline">
          <span className="material-icons mr-1">refresh</span>
          Update Assessment
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <canvas ref={skillRadarChartRef} height={250}></canvas>
          </div>
          
          <div className="w-full md:w-64 bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-700 mb-3">Skill Breakdown</h4>
            <ul className="space-y-3">
              {skills.breakdown.map((skill, index) => (
                <li key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{skill.skill}</span>
                    <span className="text-xs font-medium text-primary">{skill.score}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${skill.score}%` }}
                    ></div>
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-slate-700">
                <span className="font-medium">AI Recommendation:</span> 
                <span className="text-slate-600">{skills.recommendation}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
