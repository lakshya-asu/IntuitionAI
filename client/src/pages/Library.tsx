import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function Library() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: libraryData, isLoading } = useQuery({
    queryKey: ["/api/learning-library"],
  });

  const filteredResources = libraryData?.resources?.filter((resource: any) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || resource.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-slate-50">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Learning Library</h1>
          <p className="mt-2 text-slate-500">Explore all learning resources</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <span className="material-icons absolute left-3 top-2.5 text-slate-400">search</span>
          </div>
        </div>

        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="article">Articles</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="course">Courses</TabsTrigger>
            <TabsTrigger value="exercise">Exercises</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources?.map((resource: any) => (
                  <Card key={resource.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className={`h-36 ${
                      resource.type === 'article' ? 'bg-blue-100' :
                      resource.type === 'video' ? 'bg-purple-100' :
                      resource.type === 'course' ? 'bg-green-100' :
                      'bg-amber-100'
                    } flex items-center justify-center`}>
                      <span className="material-icons text-5xl text-primary">
                        {resource.type === 'article' ? 'article' :
                         resource.type === 'video' ? 'videocam' :
                         resource.type === 'course' ? 'school' :
                         'assignment'}
                      </span>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-slate-800">{resource.title}</h3>
                        <span className={`bg-${
                          resource.type === 'article' ? 'blue' :
                          resource.type === 'video' ? 'purple' :
                          resource.type === 'course' ? 'green' :
                          'amber'
                        }-100 text-${
                          resource.type === 'article' ? 'primary' :
                          resource.type === 'video' ? 'secondary' :
                          resource.type === 'course' ? 'accent' :
                          'warning'
                        } text-xs px-2 py-1 rounded-full capitalize`}>
                          {resource.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-2">{resource.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resource.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs text-slate-500">Duration: {resource.duration}</span>
                        <button className="flex items-center text-primary hover:underline">
                          <span>Access</span>
                          <span className="material-icons text-sm ml-1">arrow_forward</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {filteredResources?.length === 0 && (
              <div className="text-center py-12">
                <span className="material-icons text-4xl text-slate-300">search_off</span>
                <p className="mt-2 text-slate-500">No resources found matching your criteria</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
