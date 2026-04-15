import Sidebar from "@/components/layout/Sidebar";
import ProgressSummary from "@/components/dashboard/ProgressSummary";
import LearningPath from "@/components/dashboard/LearningPath";
import Recommendations from "@/components/dashboard/Recommendations";
import SuggestedAssessments from "@/components/dashboard/SuggestedAssessments";
import SkillProficiency from "@/components/dashboard/SkillProficiency";
import UserPersona from "@/components/dashboard/UserPersona";
import LearningAssistant from "@/components/dashboard/LearningAssistant";
import SyllabusManager from "@/components/dashboard/SyllabusManager";
import AdaptiveGrid from "@/components/layout/AdaptiveGrid";
import MotionTile from "@/components/layout/MotionTile";
import AssessmentTile from "@/components/tiles/AssessmentTile";
import ResourceTile from "@/components/tiles/ResourceTile";
import SyllabusNodeTile from "@/components/tiles/SyllabusNodeTile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { loginAsTestUser } from "@/lib/utils";
import { Button } from "@/components/ui/button.js";
import { Card } from "@/components/ui/card.js";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

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
                  className="px-6 py-3 rounded-full bg-[#141414] border border-white/10 text-white placeholder:text-[#959C95] focus:outline-none focus:ring-0 focus:border-white/30 transition-all w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="material-icons absolute right-5 top-3.5 text-[#959C95] group-hover:text-white transition-colors">search</span>
              </div>
              <button className="p-3 rounded-full bg-[#141414] border border-white/10 text-[#959C95] hover:text-white hover:bg-[#1A1A1A] transition-all flex items-center justify-center">
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
                <Button className="w-full h-14 bg-[#FEFFF5] hover:bg-[#E5E5DC] text-[#0D0D0D] rounded-full font-bold">
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
                className="w-full h-14 bg-[#3A403A] border-transparent text-[#FEFFF5] hover:bg-[#4A524A] hover:text-white rounded-full transition-all text-base"
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
          // Logged in and content loaded: Adaptive Grid Layout
          <div className="relative w-full">
            <AdaptiveGrid columns={4}>
              
              {/* Assessment Priority Tile - Rendered if Evaluator suggests one */}
              {assessmentsData && (assessmentsData as any[]).length > 0 && (
                <MotionTile id="assessment-cta" size="2x1" priority={true}>
                  <AssessmentTile 
                    topic={(assessmentsData as any[])[0].topic || (assessmentsData as any[])[0].subject}
                    difficulty={(assessmentsData as any[])[0].difficulty}
                    onStart={() => {
                       setLocation(`/assessment/${(assessmentsData as any[])[0].id}`);
                    }}
                  />
                </MotionTile>
              )}

              {/* Progress Summary Tile (2x1) */}
              <MotionTile id="progress-summary" size="2x1">
                <ProgressSummary stats={statsData as any} />
              </MotionTile>
              
              {/* Persona Tile (1x2 tall tile) */}
              <MotionTile id="persona" size="1x2">
                <div className="h-full overflow-y-auto custom-scrollbar">
                  <UserPersona onAnalysisDone={() => queryClient.invalidateQueries({ queryKey: ["/api/user/persona"] })} />
                </div>
              </MotionTile>

              {/* Syllabus Next Nodes */}
              {learningPathData && (learningPathData as any).modules?.slice(0, 2).map((mod: any, idx: number) => (
                <MotionTile id={`syllabus-node-${mod.id}`} size="1x1" key={`mod-${mod.id}`}>
                  <SyllabusNodeTile 
                     title={mod.title}
                     description={mod.description}
                     progress={Math.floor(Math.random() * 40)}
                     isActive={idx === 0}
                  />
                </MotionTile>
              ))}

              {/* Resource Recommendation Tiles */}
              {recommendationsData && (recommendationsData as any[]).slice(0, 3).map((rec: any, idx: number) => (
                <MotionTile id={`resource-node-${rec.id || idx}`} size="1x1" key={`rec-${rec.id || idx}`}>
                   <ResourceTile 
                     type={rec.type || 'video'}
                     title={rec.title}
                     description={rec.description || rec.reason || "Recommended resource based on your learning style."}
                     onClick={() => console.log("Open resource", rec)}
                   />
                </MotionTile>
              ))}
              
            </AdaptiveGrid>
          </div>
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