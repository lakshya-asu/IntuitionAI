import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UserPersonaProps {
  onAnalysisDone?: () => void;
}

interface UserPersonaData {
  id: number;
  userId: number;
  contentFormat: string[];
  studyHabits: string[];
  currentWeaknesses: string[];
  learningPreferences: string;
  rawAnalysis?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function UserPersona({ onAnalysisDone }: UserPersonaProps) {
  const [persona, setPersona] = useState<UserPersonaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPersona();
  }, []);

  const fetchPersona = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<UserPersonaData>('/api/user/persona', {
        method: 'GET',
      });
      setPersona(data);
    } catch (error) {
      console.log('No persona found, user may need to analyze first');
    } finally {
      setLoading(false);
    }
  };

  const analyzePersona = async () => {
    setAnalyzing(true);
    try {
      const result = await apiRequest<{ success: boolean; persona: UserPersonaData; analysis: string }>(
        '/api/user/analyze-persona',
        {
          method: 'POST',
        }
      );
      
      setPersona(result.persona);
      
      toast({
        title: 'Analysis Complete',
        description: 'Your learning profile has been updated based on your chat history.',
      });
      
      if (onAnalysisDone) {
        onAnalysisDone();
      }
    } catch (error: any) {
      let message = 'Failed to analyze your learning profile.';
      
      if (error.status === 400) {
        message = 'Not enough chat data yet. Continue using the learning assistant to build your profile.';
      }
      
      toast({
        title: 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper function to get preference classes based on learning preferences
  const getLearningPreferenceClasses = (preferences: string) => {
    switch (preferences) {
      case 'visual':
        return 'bg-blue-100 text-blue-800';
      case 'auditory':
        return 'bg-purple-100 text-purple-800';
      case 'reading/writing':
        return 'bg-emerald-100 text-emerald-800';
      case 'kinesthetic':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Learning Profile</CardTitle>
          <CardDescription>Understanding your learning patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!persona) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Learning Profile</CardTitle>
          <CardDescription>
            We need to analyze your interactions to understand your learning preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-slate-600 mb-4">
            Chat with your learning assistant to help us identify your learning preferences and 
            study patterns. The more you interact, the more personalized your experience will become.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={analyzePersona} 
            disabled={analyzing}
            className="w-full"
          >
            {analyzing ? 'Analyzing...' : 'Analyze My Learning Preferences'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span>Learning Profile</span>
          <Badge 
            className={getLearningPreferenceClasses(persona.learningPreferences.toLowerCase())}
          >
            {persona.learningPreferences} Learner
          </Badge>
        </CardTitle>
        <CardDescription>
          Your personalized learning pattern analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Preferred Content Formats</h4>
            <div className="flex flex-wrap gap-2">
              {persona.contentFormat.map((format, index) => (
                <Badge key={index} variant="outline" className="bg-primary/5">
                  {format}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Study Habits</h4>
            <div className="flex flex-wrap gap-2">
              {persona.studyHabits.map((habit, index) => (
                <Badge key={index} variant="outline" className="bg-secondary/5">
                  {habit}
                </Badge>
              ))}
            </div>
          </div>
          
          {persona.currentWeaknesses.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Areas to Focus On</h4>
              <div className="flex flex-wrap gap-2">
                {persona.currentWeaknesses.map((weakness, index) => (
                  <Badge key={index} variant="outline" className="bg-destructive/5 text-destructive">
                    {weakness}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {persona.rawAnalysis?.analysis && (
            <div>
              <h4 className="text-sm font-medium mb-2">Analysis Summary</h4>
              <p className="text-sm text-slate-600">{persona.rawAnalysis.analysis}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={analyzePersona} 
          disabled={analyzing}
          className="w-full text-xs"
        >
          {analyzing ? 'Updating Analysis...' : 'Update Learning Profile'}
        </Button>
      </CardFooter>
    </Card>
  );
}