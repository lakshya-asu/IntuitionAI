import Sidebar from "@/components/layout/Sidebar";
import ProgressSummary from "@/components/dashboard/ProgressSummary";
import LearningPath from "@/components/dashboard/LearningPath";
import Recommendations from "@/components/dashboard/Recommendations";
import AdaptiveAssessment from "@/components/dashboard/AdaptiveAssessment";
import SkillProficiency from "@/components/dashboard/SkillProficiency";
import Chatbot from "@/components/dashboard/Chatbot";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { data: learningPathData, isLoading: pathLoading } = useQuery({
    queryKey: ["/api/learning-path"],
  });

  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery({
    queryKey: ["/api/recommendations"],
  });

  const { data: assessmentsData, isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/assessments/suggested"],
  });

  const { data: skillsData, isLoading: skillsLoading } = useQuery({
    queryKey: ["/api/skills"],
  });

  const isLoading = userLoading || statsLoading || pathLoading || 
                    recommendationsLoading || assessmentsLoading || skillsLoading;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-slate-50">
        {/* Dashboard Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-slate-800">Your Learning Dashboard</h1>
            <div className="mt-3 md:mt-0">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="px-4 py-2 rounded-lg border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="material-icons absolute right-3 top-2 text-slate-400">search</span>
                </div>
                <button className="p-2 rounded-full bg-white border border-slate-300 text-slate-500 hover:bg-slate-50">
                  <span className="material-icons">notifications</span>
                </button>
              </div>
            </div>
          </div>
          <p className="mt-2 text-slate-500">Continue your personalized learning journey</p>
        </div>

        {userLoading ? (
          // Initial loading state
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !userData ? (
          // Not logged in
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold mb-4">Session Expired</h2>
            <p className="text-slate-600 mb-6 text-center">Your session has expired or you are not logged in. Please log in to continue your learning journey.</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <a href="/login" className="w-full">
                <button className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
                  Log In
                </button>
              </a>
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/debug/login-test-user', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      }
                    });
                    
                    if (!response.ok) {
                      throw new Error('Debug login failed');
                    }
                    
                    window.location.reload();
                  } catch (err) {
                    console.error("Debug login error:", err);
                  }
                }}
                className="w-full py-2 px-4 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors"
              >
                Debug Login (Test User)
              </button>
            </div>
          </div>
        ) : isLoading ? (
          // Content loading after login
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          // Logged in and content loaded
          <>
            <ProgressSummary stats={statsData as any} />
            <LearningPath learningPath={learningPathData as any} />
            <Recommendations recommendations={recommendationsData as any} />
            <AdaptiveAssessment assessments={assessmentsData as any} />
            <SkillProficiency skills={skillsData as any} />
            <Chatbot />
          </>
        )}
      </main>
    </div>
  );
}
