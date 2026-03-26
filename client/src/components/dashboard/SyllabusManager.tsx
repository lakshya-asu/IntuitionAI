import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Clock, Target, CheckCircle, AlertCircle, Plus, Edit, Calendar } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  topics: string[];
  estimatedTime: number;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
}

interface Syllabus {
  id: number;
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  estimatedDuration: number;
  modules: Module[];
  learningObjectives: string[];
  status: 'draft' | 'active' | 'completed';
  progress?: number;
}

export default function SyllabusManager() {
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [activeSyllabus, setActiveSyllabus] = useState<Syllabus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSyllabi();
  }, []);

  const fetchSyllabi = async () => {
    try {
      const response = await fetch('/api/syllabi');
      if (response.ok) {
        const data = await response.json();
        setSyllabi(data.syllabi || []);
        setActiveSyllabus(data.activeSyllabus || null);
      }
    } catch (error) {
      console.error('Error fetching syllabi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSyllabus = async (syllabusData: any) => {
    try {
      const response = await fetch('/api/syllabi/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syllabusData),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Syllabus Generated',
          description: 'Your personalized syllabus has been created successfully.',
        });
        fetchSyllabi();
        setShowCreateForm(false);
      } else {
        throw new Error('Failed to generate syllabus');
      }
    } catch (error) {
      console.error('Error creating syllabus:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate syllabus. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const activateSyllabus = async (syllabusId: number) => {
    try {
      const response = await fetch(`/api/syllabi/${syllabusId}/activate`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Syllabus Activated',
          description: 'Your learning plan is now active.',
        });
        fetchSyllabi();
      }
    } catch (error) {
      console.error('Error activating syllabus:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate syllabus.',
        variant: 'destructive',
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-[#0A0A0A] text-[#959C95] border-white/5';
      case 'intermediate': return 'bg-[#141414] text-[#FEFFF5] border-white/10';
      case 'advanced': return 'bg-[#FEFFF5] text-[#0D0D0D] border-transparent font-bold';
      default: return 'bg-[#0A0A0A] text-[#959C95] border-white/5';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#FEFFF5] text-[#0D0D0D] border-transparent font-bold';
      case 'completed': return 'bg-[#141414] text-[#FEFFF5] border-white/10';
      case 'draft': return 'bg-[#0A0A0A] text-[#959C95] border-white/5';
      default: return 'bg-[#0A0A0A] text-[#959C95] border-white/5';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-[#141414] border-white/5 rounded-[24px]">
        <CardHeader>
          <CardTitle className="text-[#FEFFF5]">Learning Syllabi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FEFFF5]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Syllabus */}
      {activeSyllabus && (
        <Card className="border-white/10 bg-[#141414] rounded-[24px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl font-extrabold text-[#FEFFF5] tracking-tight">
                  <BookOpen className="h-6 w-6 text-[#959C95]" />
                  {activeSyllabus.title}
                </CardTitle>
                <CardDescription className="text-[#959C95] mt-2 text-base">{activeSyllabus.description}</CardDescription>
              </div>
              <Badge className={`px-4 py-1.5 rounded-full ${getStatusColor(activeSyllabus.status)}`}>
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4 rounded-xl bg-[#0A0A0A] p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#141414] rounded-lg border border-white/5"><Target className="h-4 w-4 text-[#FEFFF5]" /></div>
                <span className="text-sm text-[#959C95]">
                  <span className="font-bold text-[#FEFFF5]">Subject:</span> {activeSyllabus.subject}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#141414] rounded-lg border border-white/5"><Clock className="h-4 w-4 text-[#FEFFF5]" /></div>
                <span className="text-sm text-[#959C95]">
                  <span className="font-bold text-[#FEFFF5]">Duration:</span> {activeSyllabus.estimatedDuration} weeks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`px-3 py-1 rounded-full ${getDifficultyColor(activeSyllabus.difficulty)}`}>
                  {activeSyllabus.difficulty}
                </Badge>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-3">
                <span className="font-bold text-[#FEFFF5]">Overall Progress</span>
                <span className="font-bold text-[#959C95]">{activeSyllabus.progress || 0}%</span>
              </div>
              <div className="w-full bg-[#0A0A0A] rounded-full h-2 border border-white/5">
                <div 
                   className="bg-[#FEFFF5] h-2 rounded-full" 
                   style={{ width: `${activeSyllabus.progress || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Modules */}
            <div className="space-y-4">
              <h4 className="font-bold tracking-tight text-xl text-[#FEFFF5]">Modules</h4>
              {activeSyllabus.modules.slice(0, 3).map((module) => (
                <div key={module.id} className="flex items-center justify-between p-5 bg-[#0A0A0A] rounded-2xl border border-white/5 group hover:border-white/10 transition-colors">
                  <div className="flex-1">
                    <h5 className="font-bold text-[#FEFFF5] text-lg tracking-tight mb-1">{module.title}</h5>
                    <p className="text-sm text-[#959C95] mb-4">{module.description}</p>
                    <div className="flex gap-2 mt-2">
                      {module.topics.slice(0, 3).map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-[10px] uppercase tracking-widest bg-[#141414] border-white/5 text-[#959C95] rounded-full px-3">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-center p-3 bg-[#141414] rounded-full ml-4">
                    {module.status === 'completed' && (
                      <CheckCircle className="h-6 w-6 text-[#FEFFF5]" />
                    )}
                    {module.status === 'in-progress' && (
                      <div className="w-6 h-6 border-2 border-[#FEFFF5] border-t-transparent rounded-full animate-spin" />
                    )}
                    {module.status === 'not-started' && (
                      <AlertCircle className="h-6 w-6 text-[#959C95]" />
                    )}
                  </div>
                </div>
              ))}
              {activeSyllabus.modules.length > 3 && (
                <p className="text-sm text-[#959C95] text-center font-bold pb-2 pt-2">
                  +{activeSyllabus.modules.length - 3} more modules
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button size="default" className="rounded-full bg-[#FEFFF5] text-[#0D0D0D] font-bold hover:bg-[#E5E5DC]">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
              <Button size="default" variant="outline" className="rounded-full bg-[#141414] border-white/10 text-[#FEFFF5] font-bold hover:bg-[#1A1A1A]">
                <Edit className="h-4 w-4 mr-2" />
                Adapt Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Syllabi */}
      <Card className="bg-[#141414] border-white/5 rounded-[24px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-extrabold text-[#FEFFF5]">Your Learning Plans</CardTitle>
              <CardDescription className="text-[#959C95] mt-1">Manage your personalized syllabi and learning paths</CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(true)} className="rounded-full bg-[#FEFFF5] text-[#0D0D0D] font-bold hover:bg-[#E5E5DC]">
              <Plus className="h-5 w-5 mr-1" />
              Create Syllabus
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {syllabi.length === 0 ? (
            <div className="text-center py-16 bg-[#0A0A0A] rounded-[24px] border border-white/5">
              <BookOpen className="h-16 w-16 text-[#959C95] mx-auto mb-6 opacity-50" />
              <h3 className="text-xl font-extrabold text-[#FEFFF5] tracking-tight mb-2">No syllabi yet</h3>
              <p className="text-[#959C95] max-w-sm mx-auto mb-8 leading-relaxed">
                Create your first personalized learning syllabus to get started on your journey.
              </p>
              <Button onClick={() => setShowCreateForm(true)} className="rounded-full bg-[#FEFFF5] text-[#0D0D0D] font-bold hover:bg-[#E5E5DC] h-12 px-6">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Syllabus
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {syllabi.map((syllabus) => (
                <Card key={syllabus.id} className="bg-[#0A0A0A] border-white/5 hover:border-white/10 transition-colors rounded-2xl group cursor-pointer">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="pr-4">
                        <CardTitle className="text-xl font-bold tracking-tight text-[#FEFFF5] line-clamp-1">{syllabus.title}</CardTitle>
                        <CardDescription className="text-[#959C95] mt-2 line-clamp-2">{syllabus.description}</CardDescription>
                      </div>
                      <Badge className={`rounded-full px-3 py-1 flex-shrink-0 ${getStatusColor(syllabus.status)}`}>
                        {syllabus.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#959C95] font-bold">Subject</span>
                        <span className="font-bold text-[#FEFFF5]">{syllabus.subject}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#959C95] font-bold">Duration</span>
                        <span className="font-bold text-[#FEFFF5]">{syllabus.estimatedDuration} weeks</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#959C95] font-bold">Modules</span>
                        <span className="font-bold text-[#FEFFF5] px-3 py-1 bg-[#141414] rounded-full border border-white/10">{syllabus.modules.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#959C95] font-bold">Difficulty</span>
                        <Badge className={`rounded-full px-3 py-1 ${getDifficultyColor(syllabus.difficulty)}`}>
                          {syllabus.difficulty}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                      {syllabus.status === 'draft' && (
                        <Button 
                          size="default" 
                          onClick={() => activateSyllabus(syllabus.id)}
                          className="flex-1 rounded-full bg-[#FEFFF5] text-[#0D0D0D] font-bold hover:bg-[#E5E5DC]"
                        >
                          Activate
                        </Button>
                      )}
                      <Button size="default" variant="outline" className="flex-1 rounded-full bg-[#141414] border-white/10 text-[#FEFFF5] font-bold hover:bg-[#1A1A1A]">
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Syllabus Form Modal would go here */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-[#0D0D0D]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-[#141414] border-white/10 rounded-[24px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-extrabold text-[#FEFFF5] tracking-tight">Create New Syllabus</CardTitle>
              <CardDescription className="text-[#959C95] mt-1 text-base">Generate a personalized learning plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-white/5 mb-6">
                <p className="text-sm text-[#959C95] leading-relaxed">
                  This feature will be implemented to create personalized syllabi based on your goals and preferences using AI orchestration.
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setShowCreateForm(false)} variant="outline" className="flex-1 rounded-full bg-[#1A1A1A] border-transparent text-[#959C95] hover:bg-[#2A2A2A] hover:text-[#FEFFF5]">
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateForm(false)} className="flex-1 rounded-full bg-[#FEFFF5] text-[#0D0D0D] font-bold hover:bg-[#E5E5DC]">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}