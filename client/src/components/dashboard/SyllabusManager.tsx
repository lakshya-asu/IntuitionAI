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
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Syllabi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Syllabus */}
      {activeSyllabus && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {activeSyllabus.title}
                </CardTitle>
                <CardDescription>{activeSyllabus.description}</CardDescription>
              </div>
              <Badge className={getStatusColor(activeSyllabus.status)}>
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  <span className="font-medium">Subject:</span> {activeSyllabus.subject}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  <span className="font-medium">Duration:</span> {activeSyllabus.estimatedDuration} weeks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(activeSyllabus.difficulty)}>
                  {activeSyllabus.difficulty}
                </Badge>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span>{activeSyllabus.progress || 0}%</span>
              </div>
              <Progress value={activeSyllabus.progress || 0} className="h-2" />
            </div>

            {/* Modules */}
            <div className="space-y-3">
              <h4 className="font-medium">Modules</h4>
              {activeSyllabus.modules.slice(0, 3).map((module) => (
                <div key={module.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <h5 className="font-medium">{module.title}</h5>
                    <p className="text-sm text-gray-600">{module.description}</p>
                    <div className="flex gap-1 mt-1">
                      {module.topics.slice(0, 3).map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {module.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {module.status === 'in-progress' && (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    {module.status === 'not-started' && (
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
              {activeSyllabus.modules.length > 3 && (
                <p className="text-sm text-gray-500 text-center">
                  +{activeSyllabus.modules.length - 3} more modules
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                View Schedule
              </Button>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                Adapt Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Syllabi */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Learning Plans</CardTitle>
              <CardDescription>Manage your personalized syllabi and learning paths</CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create Syllabus
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {syllabi.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No syllabi yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first personalized learning syllabus to get started.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Syllabus
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {syllabi.map((syllabus) => (
                <Card key={syllabus.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{syllabus.title}</CardTitle>
                        <CardDescription className="text-sm">{syllabus.description}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(syllabus.status)}>
                        {syllabus.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Subject:</span>
                        <span className="font-medium">{syllabus.subject}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{syllabus.estimatedDuration} weeks</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Modules:</span>
                        <span className="font-medium">{syllabus.modules.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Difficulty:</span>
                        <Badge className={getDifficultyColor(syllabus.difficulty)}>
                          {syllabus.difficulty}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {syllabus.status === 'draft' && (
                        <Button 
                          size="sm" 
                          onClick={() => activateSyllabus(syllabus.id)}
                        >
                          Activate
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        View Details
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Syllabus</CardTitle>
              <CardDescription>Generate a personalized learning plan</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                This feature will be implemented to create personalized syllabi based on your goals and preferences.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setShowCreateForm(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateForm(false)}>
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