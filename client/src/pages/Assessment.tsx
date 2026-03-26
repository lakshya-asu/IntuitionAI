import React, { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import katex from "katex";
import "katex/dist/katex.min.css";

interface Question {
  id: string;
  text: string;
  type: "mcq" | "text" | "math";
  options?: {
    id: string;
    text: string;
  }[];
  correctAnswer?: string;
  explanation?: string;
}

interface AssessmentData {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export default function Assessment() {
  const [match, params] = useRoute("/assessment/:id");
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!match || !params?.id) return;
      
      setLoading(true);
      try {
        console.log("Fetching assessment with ID:", params.id);
        const res = await apiRequest('GET', `/api/assessments/${params.id}`);
        console.log("Assessment data received");
        setAssessmentData(await res.json());
      } catch (error) {
        console.error("Failed to fetch assessment:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssessment();
  }, [match, params?.id]);

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string, answer: string }) => {
      try {
        if (!assessmentData) throw new Error("Assessment data not found");
        
        const response = await apiRequest('POST', `/api/assessments/${assessmentData.id}/answer`, {questionId, answer});
        
        return response.json();
      } catch (error) {
        console.error("Error submitting answer:", error);
        // Fallback to client-side validation if API fails
        const question = assessmentData?.questions.find(q => q.id === questionId);
        const correct = question?.correctAnswer === answer;
        return {
          correct,
          feedback: question?.explanation || 
            (correct ? "That's correct!" : "That's not quite right.")
        };
      }
    }
  });

  const completeAssessmentMutation = useMutation({
    mutationFn: async () => {
      try {
        if (!assessmentData) throw new Error("Assessment data not found");
        
        const response = await apiRequest('POST', `/api/assessments/${assessmentData.id}/complete`);
        
        return response.json();
      } catch (error) {
        console.error("Error completing assessment:", error);
        // Fallback to client-side calculation if API fails
        if (!assessmentData) throw new Error("Assessment data not found");
        
        const correctAnswers = Object.entries(selectedAnswers).filter(([questionId, answer]) => {
          const question = assessmentData.questions.find(q => q.id === questionId);
          return question?.correctAnswer === answer;
        }).length;
        
        const totalScore = Math.round((correctAnswers / assessmentData.questions.length) * 100);
        
        let feedbackText = "";
        if (totalScore >= 90) {
          feedbackText = "Excellent! You have a very strong understanding of machine learning fundamentals.";
        } else if (totalScore >= 70) {
          feedbackText = "Good job! You have a solid grasp of the core concepts, but there's room to deepen your understanding.";
        } else {
          feedbackText = "You've made a good start, but it would be beneficial to revisit some of the fundamental concepts of machine learning.";
        }
        
        return {
          score: totalScore,
          feedback: feedbackText
        };
      }
    },
    onSuccess: (data) => {
      setScore(data.score);
      setFeedback(data.feedback);
      setAssessmentComplete(true);
    }
  });

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    const currentQuestionData = assessmentData?.questions[currentQuestion];
    if (!currentQuestionData) return;
    
    const selectedAnswer = selectedAnswers[currentQuestionData.id];
    if (!selectedAnswer) return;
    
    submitAnswerMutation.mutate(
      { questionId: currentQuestionData.id, answer: selectedAnswer },
      {
        onSuccess: (data) => {
          setShowFeedback(true);
          setTimeout(() => {
            setShowFeedback(false);
            if (currentQuestion < (assessmentData?.questions.length || 0) - 1) {
              setCurrentQuestion(prev => prev + 1);
            } else {
              completeAssessmentMutation.mutate();
            }
          }, 2000);
        }
      }
    );
  };

  const handleSubmit = () => {
    completeAssessmentMutation.mutate();
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setAssessmentComplete(false);
    setScore(0);
    setFeedback("");
    setShowFeedback(false);
  };

  const renderQuestion = (question: Question) => {
    return (
      <div className="space-y-6">
        <div 
          className="text-lg font-bold leading-relaxed text-[#FEFFF5] tracking-tight" 
          dangerouslySetInnerHTML={{ 
            __html: question.type === "math" 
              ? katex.renderToString(question.text, { throwOnError: false, displayMode: true }) 
              : question.text 
          }} 
        />
        
        <RadioGroup 
          value={selectedAnswers[question.id] || ""} 
          onValueChange={(value) => handleSelectAnswer(question.id, value)}
          className="space-y-3 mt-6"
        >
          {question.options?.map(option => {
            const isSelected = selectedAnswers[question.id] === option.id;
            return (
              <div 
                key={option.id} 
                className={`flex items-start space-x-3 p-4 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'bg-[#1A1A1A] border-white/30' : 'bg-[#0A0A0A] border-white/5 hover:border-white/10'}`}
                onClick={() => handleSelectAnswer(question.id, option.id)}
              >
                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-[#FEFFF5] bg-[#FEFFF5]' : 'border-white/20'}`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#0D0D0D]" />}
                </div>
                <Label 
                  htmlFor={`${question.id}-${option.id}`} 
                  className={`flex-1 cursor-pointer text-sm leading-relaxed ${isSelected ? 'text-[#FEFFF5]' : 'text-[#959C95]'}`}
                  dangerouslySetInnerHTML={{ 
                    __html: katex.renderToString(option.text, { throwOnError: false, output: 'html' }) 
                  }}
                />
              </div>
            );
          })}
        </RadioGroup>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto p-6 space-y-8 mt-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-[#141414] rounded-full w-3/4 border border-white/5"></div>
          <div className="h-4 bg-[#141414] rounded-full w-2/4 border border-white/5"></div>
          <div className="h-64 bg-[#0A0A0A] rounded-[24px] border border-white/5"></div>
        </div>
      </div>
    );
  }

  if (!assessmentData) {
    return (
      <div className="container max-w-3xl mx-auto p-6 mt-12">
        <Card className="bg-[#141414] border-white/5 rounded-[24px]">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-[#FEFFF5]">Assessment Not Found</CardTitle>
            <CardDescription className="text-[#959C95]">The assessment you are looking for could not be found.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/")} className="rounded-full bg-[#FEFFF5] text-[#0D0D0D] font-bold hover:bg-[#E5E5DC]">Return Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (assessmentComplete) {
    return (
      <div className="container max-w-3xl mx-auto p-6 mt-12 mb-24">
        <Card className="bg-[#141414] border-white/5 rounded-[24px] overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-6">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-[#FEFFF5]">Assessment Complete</CardTitle>
            <CardDescription className="text-[#959C95] text-base">{assessmentData.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="text-center bg-[#0A0A0A] p-8 rounded-[24px] border border-white/5">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-[#141414] border border-white/10 mb-6 shadow-2xl">
                <span className="text-4xl font-black text-[#FEFFF5] tracking-tighter">{score}%</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#FEFFF5]">Your Evaluation</h3>
              <p className="text-[#959C95] max-w-lg mx-auto leading-relaxed">{feedback}</p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-extrabold tracking-tight text-[#FEFFF5] px-2">Detailed Review</h3>
              {assessmentData.questions.map((question, index) => {
                const isCorrect = selectedAnswers[question.id] === question.correctAnswer;
                return (
                  <div key={question.id} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-start mb-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 border ${isCorrect ? 'bg-[#FEFFF5] text-[#0D0D0D] border-transparent' : 'bg-[#141414] text-[#959C95] border-white/10'}`}>
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <AlertCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[#959C95] text-sm tracking-widest uppercase mb-1">{`Question ${index + 1}`}</p>
                        <div 
                          className="text-base font-medium text-[#FEFFF5] leading-relaxed" 
                          dangerouslySetInnerHTML={{ 
                            __html: question.type === "math" 
                              ? katex.renderToString(question.text, { throwOnError: false }) 
                              : question.text 
                          }} 
                        />
                      </div>
                    </div>
                    <div className="pl-12 space-y-3">
                      <div className="bg-[#141414] p-3 rounded-xl border border-white/5">
                        <p className="text-sm">
                          <span className="font-bold text-[#959C95] mr-2">Your answer:</span> 
                          <span className={isCorrect ? 'text-[#FEFFF5]' : 'text-[#959C95]'}>
                            {question.options?.find(o => o.id === selectedAnswers[question.id])?.text || 'No answer'}
                          </span>
                        </p>
                      </div>
                      
                      {!isCorrect && (
                        <div className="bg-[#1A1A1A] p-3 rounded-xl border border-white/10">
                          <p className="text-sm">
                            <span className="font-bold text-[#FEFFF5] mr-2">Correct answer:</span> 
                            <span className="text-[#FEFFF5]">
                              {question.options?.find(o => o.id === question.correctAnswer)?.text}
                            </span>
                          </p>
                        </div>
                      )}
                      
                      {question.explanation && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <p className="text-sm text-[#959C95] leading-relaxed">
                            <span className="font-bold text-[#FEFFF5] mr-1">Explanation:</span> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-white/5 pt-6 bg-[#0A0A0A]/50">
            <Button variant="outline" onClick={handleRetake} className="rounded-full bg-[#1A1A1A] border-transparent text-[#959C95] hover:bg-[#2A2A2A] hover:text-[#FEFFF5]">Retake Assessment</Button>
            <Button onClick={() => setLocation("/")} className="rounded-full bg-[#FEFFF5] text-[#0D0D0D] font-bold hover:bg-[#E5E5DC]">Back to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQuestionData = assessmentData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessmentData.questions.length) * 100;

  return (
    <div className="container max-w-3xl mx-auto p-6 mt-12 mb-24">
      <div className="space-y-2 mb-10">
        <h1 className="text-4xl font-extrabold tracking-tighter text-[#FEFFF5]">{assessmentData.title}</h1>
        <p className="text-[#959C95] text-lg">{assessmentData.description}</p>
      </div>
      
      <div className="space-y-3 mb-8">
        <div className="flex justify-between text-sm font-bold tracking-tight uppercase">
          <span className="text-[#959C95]">Question {currentQuestion + 1} of {assessmentData.questions.length}</span>
          <span className="text-[#FEFFF5]">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-[#141414] rounded-full h-1.5 border border-white/5">
          <div className="bg-[#FEFFF5] h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      
      <Card className="bg-[#141414] border-white/5 rounded-[24px] shadow-2xl">
        <CardContent className="pt-8 px-8 pb-6">
          {renderQuestion(currentQuestionData)}
          
          {showFeedback && (
            <div className={`mt-8 p-5 rounded-2xl border ${submitAnswerMutation.data?.correct ? 'bg-[#FEFFF5] border-transparent text-[#0D0D0D]' : 'bg-[#1A1A1A] border-white/10 text-[#FEFFF5]'}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {submitAnswerMutation.data?.correct ? <CheckCircle2 className="h-5 w-5" /> : <InfoIcon className="h-5 w-5 text-[#959C95]" />}
                </div>
                <div>
                  <h4 className="font-extrabold tracking-tight mb-1">
                    {submitAnswerMutation.data?.correct ? "Correct!" : "Incorrect"}
                  </h4>
                  <p className={`text-sm ${submitAnswerMutation.data?.correct ? 'text-[#141414]' : 'text-[#959C95]'}`}>
                    {submitAnswerMutation.data?.feedback}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-white/5 pt-6 px-8 bg-[#0A0A0A]/50 rounded-b-[24px]">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
            className="rounded-full bg-[#1A1A1A] border-transparent text-[#959C95] hover:bg-[#2A2A2A] hover:text-[#FEFFF5]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedAnswers[currentQuestionData.id] || submitAnswerMutation.isPending || showFeedback}
            className="rounded-full bg-[#FEFFF5] text-[#0D0D0D] font-bold hover:bg-[#E5E5DC] disabled:opacity-50"
          >
            {submitAnswerMutation.isPending ? 
              "Checking..." : 
              currentQuestion < assessmentData.questions.length - 1 ? 
                "Next Question" : 
                "Complete Assessment"
            }
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}