import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Clock, Brain, Zap, BarChart } from "lucide-react";

interface Assessment {
  id: string;
  title: string;
  type: 'recommended' | 'review' | 'challenge';
  typeLabel: string;
  description: string;
  duration: string;
}

interface SuggestedAssessmentsProps {
  assessments?: {
    suggested: Assessment[];
  };
}

export default function SuggestedAssessments({ assessments }: SuggestedAssessmentsProps) {
  const [, setLocation] = useLocation();
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/assessments/suggested'],
    enabled: !assessments,
  });
  
  const displayData = assessments || data || { 
    suggested: [
      {
        id: "assessment-001",
        title: "Machine Learning Basics Review",
        type: "review",
        typeLabel: "Knowledge Review",
        description: "Test your understanding of fundamental machine learning concepts",
        duration: "10 min"
      },
      {
        id: "assessment-002",
        title: "Probabilistic Reasoning Challenge",
        type: "challenge",
        typeLabel: "Advanced Challenge",
        description: "Challenge yourself with complex probabilistic reasoning problems",
        duration: "15 min"
      },
      {
        id: "assessment-003",
        title: "Philosophy of Mind Quiz",
        type: "recommended",
        typeLabel: "Recommended",
        description: "Review key concepts from your recent Philosophy of Mind module",
        duration: "8 min"
      }
    ] 
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'recommended':
        return <Zap className="h-5 w-5 text-amber-500" />;
      case 'review':
        return <Brain className="h-5 w-5 text-indigo-500" />;
      case 'challenge':
        return <BarChart className="h-5 w-5 text-emerald-500" />;
      default:
        return <Brain className="h-5 w-5 text-indigo-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'recommended':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'review':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      case 'challenge':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const startAssessment = (id: string) => {
    setLocation(`/assessment/${id}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <span>Suggested Assessments</span>
        </CardTitle>
        <CardDescription>Test your knowledge and get personalized recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))
          ) : (
            displayData.suggested.map((assessment) => (
              <div
                key={assessment.id}
                className="p-4 rounded-lg border hover:bg-gray-50 transition-all flex flex-col md:flex-row md:items-center gap-4 justify-between"
              >
                <div className="flex gap-3 items-start">
                  <div className="mt-1">{getIcon(assessment.type)}</div>
                  <div>
                    <h3 className="font-medium">{assessment.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-1 mb-2">
                      <Badge variant="outline" className={`text-xs ${getTypeColor(assessment.type)}`}>
                        {assessment.typeLabel}
                      </Badge>
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {assessment.duration}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{assessment.description}</p>
                  </div>
                </div>
                <Button 
                  className="whitespace-nowrap self-start md:self-center"
                  onClick={() => startAssessment(assessment.id)}
                >
                  Start Assessment
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}