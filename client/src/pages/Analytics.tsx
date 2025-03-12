import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { useState } from "react";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("month");
  
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/analytics", timeRange],
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-slate-50">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">My Analytics</h1>
          <p className="mt-2 text-slate-500">Track your learning progress and performance</p>
        </div>

        <div className="mb-6">
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Analytics Dashboard</h2>
            <div>
              <select 
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Learning Activity */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Learning Activity</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData?.activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="minutes"
                        stroke="#2563eb"
                        activeDot={{ r: 8 }}
                        name="Minutes Spent"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Competency Growth */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Competency Growth</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData?.competencyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#8b5cf6"
                        activeDot={{ r: 8 }}
                        name="Competency Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Performance */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Assessment Performance</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData?.assessmentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="score"
                        fill="#2563eb"
                        name="Your Score"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="average"
                        fill="#94a3b8"
                        name="Average Score"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Skill Proficiency */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Skill Radar</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} data={analyticsData?.skillData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748b" />
                      <PolarRadiusAxis stroke="#94a3b8" />
                      <Radar
                        name="Current"
                        dataKey="score"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.2}
                      />
                      <Radar
                        name="Previous"
                        dataKey="previousScore"
                        stroke="#94a3b8"
                        fill="#94a3b8"
                        fillOpacity={0.2}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Learning Efficiency */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Learning Efficiency</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-700">Completion Rate</h4>
                      <span className="material-icons text-primary">trending_up</span>
                    </div>
                    <div className="text-3xl font-bold text-primary">{analyticsData?.efficiency?.completionRate}%</div>
                    <p className="text-sm text-slate-600 mt-1">of assigned modules</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-700">Avg. Learning Time</h4>
                      <span className="material-icons text-secondary">schedule</span>
                    </div>
                    <div className="text-3xl font-bold text-secondary">{analyticsData?.efficiency?.avgLearningTime}</div>
                    <p className="text-sm text-slate-600 mt-1">minutes per day</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-700">Knowledge Retention</h4>
                      <span className="material-icons text-accent">psychology</span>
                    </div>
                    <div className="text-3xl font-bold text-accent">{analyticsData?.efficiency?.knowledgeRetention}%</div>
                    <p className="text-sm text-slate-600 mt-1">based on reassessments</p>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <h4 className="font-medium flex items-center text-amber-800 mb-2">
                    <span className="material-icons mr-2">tips_and_updates</span>
                    Personalized Insights
                  </h4>
                  <p className="text-slate-700">
                    Based on your learning patterns, you retain information better 
                    when studying in the evening. Consider scheduling more complex 
                    topics during that time for optimal results.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
