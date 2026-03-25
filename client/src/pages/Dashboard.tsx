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
import { Button } from "@/components/ui/button.js";
import { Card } from "@/components/ui/card.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.js";

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
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent text-slate-100">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {/* Dashboard Header */}
        <div className="mb-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                Your Learning Dashboard
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl">
                Continue your personalized learning journey with AI-powered assistance
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Search resources..." 
                  className="px-5 py-2.5 rounded-2xl bg-slate-900/40 glassmorphism/5 border border-white/10 text-white placeholder:text-slate-500 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="material-icons absolute right-4 top-3 text-slate-500 group-hover:text-blue-400 transition-colors">search</span>
              </div>
              <button className="p-2.5 rounded-2xl bg-slate-900/40 glassmorphism/5 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-900/40 glassmorphism/10 transition-all shadow-xl">
                <span className="material-icons">notifications</span>
              </button>
            </div>
          </div>
        </div>

        {userLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : !userData ? (
          <div className="flex flex-col items-center justify-center h-80 glassmorphism-dark rounded-3xl p-12 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <span className="material-icons text-red-500 text-4xl">security</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Session Expired</h2>
            <p className="text-slate-400 mb-8 max-w-sm">Your session has expired or you are not logged in. Please log in to continue your learning journey.</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <a href="/login" className="w-full">
                <Button className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20">
                  Log In
                </Button>
              </a>
              <Button 
                variant="outline"
                onClick={async () => {
                  try {
                    const user = await loginAsTestUser();
                    if (user) {
                      queryClient.invalidateQueries();
                    } else {
                      throw new Error('Debug login failed');
                    }
                  } catch (err) {
                    console.error("Debug login error:", err);
                  }
                }}
                className="w-full h-12 bg-slate-900/40 glassmorphism/5 border-white/10 text-white hover:bg-slate-900/40 glassmorphism/10 rounded-xl"
              >
                Access as Test User
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          // Logged in and content loaded
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex items-center justify-start gap-2 bg-slate-900/40 glassmorphism/5 p-1 rounded-2xl mb-8 border border-white/5 w-fit">
              <TabsTrigger value="overview" className="rounded-xl px-6 py-2 content-center data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">Overview</TabsTrigger>
              <TabsTrigger value="learning" className="rounded-xl px-6 py-2 content-center data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">Learning Path</TabsTrigger>
              <TabsTrigger value="syllabi" className="rounded-xl px-6 py-2 content-center data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">Syllabi</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-xl px-6 py-2 content-center data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <ProgressSummary stats={statsData as any} />
                </div>
                <div className="lg:col-span-1">
                  <UserPersona onAnalysisDone={() => queryClient.invalidateQueries({ queryKey: ["/api/user/persona"] })} />
                </div>
              </div>
              <Recommendations recommendations={recommendationsData as any} />
              <SuggestedAssessments assessments={assessmentsData as any} />
            </TabsContent>
            
            <TabsContent value="learning" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <LearningPath learningPath={learningPathData as any} />
              <SkillProficiency skills={skillsData as any} />
            </TabsContent>
            
            <TabsContent value="syllabi" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <SyllabusManager />
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <SkillProficiency skills={skillsData as any} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="glassmorphism p-8 rounded-3xl border-white/5">
                  <h3 className="text-xl font-bold mb-4 text-white">Learning Analytics</h3>
                  <p className="text-slate-400 leading-relaxed">Detailed analytics will be available here, showing your learning patterns, time spent, and progress trends.</p>
                </Card>
                <Card className="glassmorphism p-8 rounded-3xl border-white/5">
                  <h3 className="text-xl font-bold mb-4 text-white">Performance Insights</h3>
                  <p className="text-slate-400 leading-relaxed">AI-powered insights about your learning performance and recommendations for improvement.</p>
                </Card>
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