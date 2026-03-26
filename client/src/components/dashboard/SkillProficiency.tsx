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
              backgroundColor: 'rgba(254, 255, 245, 0.1)',
              borderColor: '#FEFFF5',
              pointBackgroundColor: '#FEFFF5',
              pointBorderColor: '#0A0A0A',
              pointHoverBackgroundColor: '#0A0A0A',
              pointHoverBorderColor: '#FEFFF5'
            }, {
              label: 'Average Learner',
              data: skills.radar.average,
              backgroundColor: 'rgba(149, 156, 149, 0.1)',
              borderColor: '#959C95',
              pointBackgroundColor: '#959C95',
              pointBorderColor: '#0A0A0A',
              pointHoverBackgroundColor: '#0D0D0D',
              pointHoverBorderColor: '#959C95'
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
                  color: 'rgba(255, 255, 255, 0.05)'
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.05)'
                },
                pointLabels: {
                  font: {
                    family: 'Inter',
                    size: 10,
                    weight: 'bold'
                  },
                  color: '#959C95'
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-extrabold tracking-tighter text-[#FEFFF5]">Your Skill Proficiency</h2>
        <button className="px-4 py-2 rounded-full border border-white/10 bg-[#141414] text-[#959C95] text-sm font-bold flex items-center hover:bg-[#1A1A1A] hover:text-[#FEFFF5] transition-colors">
          <span className="material-icons text-sm mr-1 leading-none">refresh</span>
          Update Assessment
        </button>
      </div>
      
      <div className="bg-[#141414] p-8 rounded-[24px] border border-white/5">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <canvas ref={skillRadarChartRef} height={250}></canvas>
          </div>
          
          <div className="w-full md:w-80 bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
            <h4 className="font-bold tracking-tight text-[#FEFFF5] mb-5">Skill Breakdown</h4>
            <ul className="space-y-4">
              {skills.breakdown.map((skill, index) => (
                <li key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-[#959C95]">{skill.skill}</span>
                    <span className="text-xs font-bold text-[#FEFFF5]">{skill.score}%</span>
                  </div>
                  <div className="w-full bg-[#141414] border border-white/5 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-[#FEFFF5] h-1.5 rounded-full" 
                      style={{ width: `${skill.score}%` }}
                    ></div>
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="mt-8 p-4 bg-[#141414] border border-white/5 rounded-[16px]">
              <p className="text-sm text-[#959C95] leading-relaxed">
                <span className="font-bold text-[#FEFFF5] block mb-1 tracking-tight">AI Recommendation</span> 
                <span>{skills.recommendation}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
