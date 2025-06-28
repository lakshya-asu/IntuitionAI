import Sidebar from "@/components/layout/Sidebar";
import ProgressSummary from "@/components/dashboard/ProgressSummary";
import LearningPath from "@/components/dashboard/LearningPath";
import Recommendations from "@/components/dashboard/Recommendations";
import SuggestedAssessments from "@/components/dashboard/SuggestedAssessments";
import SkillProficiency from "@/components/dashboard/SkillProficiency";
import UserPersona from "@/components/dashboard/UserPersona";
import LearningAssistant from "@/components/dashboard/LearningAssistant";
import SyllabusManager from "@/components/dashboard/SyllabusManager";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { loginAsTestUser } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["/api/user"],
  });
  
  // Auto-login functionality for development
  useEffect(() => {
    // Only attempt auto-login if user data failed to load and we haven't tried already
    const shouldAutoLogin = !userData && !userLoading && userError && !autoLoginAttempted;
    
    if (shouldAutoLogin) {
      setAutoLoginAttempted(true);
      console.log("Auto-login: Attempting to login as test user...");
      
      loginAsTestUser().then(user => {
        if (user) {
          console.log("Auto-login: Success, refreshing data...");
          // Invalidate queries to reload data with the new session
          queryClient.invalidateQueries();
        } else {
          console.error("Auto-login: Failed to login as test user");
        }
      });
    }
  }, [userData, userLoading, userError, autoLoginAttempted, queryClient]);

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

  const handleRecommendationSelect = (recommendation: any) => {
    // Handle recommendation selection
    console.log("Selected recommendation:", recommendation);
  };

  const handleActionTrigger = (action: any) => {
    // Handle action trigger
    console.log("Triggered action:", action);
  };

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
          <p className="mt-2 text-slate-500">Continue your personalized learning journey with AI-powered assistance</p>
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
                    const user = await loginAsTestUser();
                    if (user) {
                      // Invalidate queries to reload data with the new session
                      queryClient.invalidateQueries();
                    } else {
                      throw new Error('Debug login failed');
                    }
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="learning">Learning Path</TabsTrigger>
              <TabsTrigger value="syllabi">Syllabi</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2">
                  <ProgressSummary stats={statsData as any} />
                </div>
                <div className="md:col-span-1">
                  <UserPersona onAnalysisDone={() => queryClient.invalidateQueries({ queryKey: ["/api/user/persona"] })} />
                </div>
              </div>
              <Recommendations recommendations={recommendationsData as any} />
              <SuggestedAssessments assessments={assessmentsData as any} />
            </TabsContent>
            
            <TabsContent value="learning" className="space-y-6">
              <LearningPath learningPath={learningPathData as any} />
              <SkillProficiency skills={skillsData as any} />
            </TabsContent>
            
            <TabsContent value="syllabi" className="space-y-6">
              <SyllabusManager />
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6">
              <SkillProficiency skills={skillsData as any} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold mb-4">Learning Analytics</h3>
                  <p className="text-slate-600">Detailed analytics will be available here, showing your learning patterns, time spent, and progress trends.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
                  <p className="text-slate-600">AI-powered insights about your learning performance and recommendations for improvement.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        {/* AI Learning Assistant */}
        <LearningAssistant 
          onRecommendationSelect={handleRecommendationSelect}
          onActionTrigger={handleActionTrigger}
        />
      </main>
    </div>
  );
}