import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

export default function Curriculum() {
  const { data: curriculumData, isLoading } = useQuery({
    queryKey: ["/api/curriculum"],
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-slate-50">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">My Curriculum</h1>
          <p className="mt-2 text-slate-500">Track your personalized learning curriculum</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {curriculumData?.modules?.map((module: any) => (
              <Card key={module.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="material-icons text-primary mr-2">{module.icon}</span>
                        <h2 className="text-xl font-semibold">{module.title}</h2>
                      </div>
                      <p className="text-slate-600 mb-4">{module.description}</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        module.status === "completed" ? "bg-green-100 text-success" : 
                        module.status === "in-progress" ? "bg-blue-100 text-primary" : 
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {module.status === "completed" ? "Completed" : 
                         module.status === "in-progress" ? "In Progress" : 
                         "Not Started"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{module.progress}%</span>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {module.topics.map((topic: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                        {topic}
                      </span>
                    ))}
                  </div>

                  {module.status !== "completed" && (
                    <button className="mt-4 px-4 py-2 bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90 flex items-center">
                      <span className="material-icons mr-2">play_circle</span>
                      {module.status === "in-progress" ? "Continue Learning" : "Start Module"}
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
