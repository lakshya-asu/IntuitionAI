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

  // Sample assessment data - Machine Learning Basics Review
  const sampleAssessmentData: AssessmentData = {
    id: "assessment-001",
    title: "Machine Learning Basics Review",
    description: "This assessment covers fundamental concepts in machine learning theory and application.",
    questions: [
      {
        id: "q1",
        type: "mcq",
        text: "In gradient descent optimization for a neural network, which of the following expressions correctly represents the weight update rule for a single weight $w_{ij}$ using backpropagation where $\\eta$ is the learning rate, $E$ is the error function, and $\\frac{\\partial E}{\\partial w_{ij}}$ is the partial derivative of the error with respect to the weight?",
        options: [
          { id: "a", text: "$w_{ij}^{new} = w_{ij}^{old} - \\eta \\frac{\\partial E}{\\partial w_{ij}}$" },
          { id: "b", text: "$w_{ij}^{new} = w_{ij}^{old} + \\eta \\frac{\\partial E}{\\partial w_{ij}}$" },
          { id: "c", text: "$w_{ij}^{new} = w_{ij}^{old} - \\frac{\\partial E}{\\partial w_{ij}} \\cdot \\eta$" },
          { id: "d", text: "$w_{ij}^{new} = w_{ij}^{old} \\cdot (1 - \\eta \\frac{\\partial E}{\\partial w_{ij}})$" }
        ],
        correctAnswer: "a",
        explanation: "In gradient descent, we update weights by moving in the direction opposite to the gradient of the error function. The correct formula subtracts the gradient multiplied by the learning rate from the current weight value."
      },
      {
        id: "q2",
        type: "mcq",
        text: "What is the primary difference between supervised and unsupervised learning?",
        options: [
          { id: "a", text: "Supervised learning requires a GPU, while unsupervised learning works on CPU" },
          { id: "b", text: "Supervised learning uses labeled training data, while unsupervised learning does not" },
          { id: "c", text: "Supervised learning is always more accurate than unsupervised learning" },
          { id: "d", text: "Supervised learning works with image data, while unsupervised learning works with text data" }
        ],
        correctAnswer: "b",
        explanation: "Supervised learning uses labeled training data where the target outputs are known, while unsupervised learning works with unlabeled data and tries to find patterns or structure in the data without explicit guidance."
      },
      {
        id: "q3",
        type: "mcq",
        text: "If the accuracy of a machine learning model on the training set is 95% but only 70% on the test set, this is most likely an example of:",
        options: [
          { id: "a", text: "Underfitting" },
          { id: "b", text: "Overfitting" },
          { id: "c", text: "Regularization" },
          { id: "d", text: "Normalization" }
        ],
        correctAnswer: "b",
        explanation: "This scenario describes overfitting, where the model performs well on the training data but fails to generalize to unseen data. The large gap between training and test performance is a classic sign of overfitting."
      }
    ]
  };

  useEffect(() => {
    // In a real application, this would be fetched from the API
    // For now, we'll use the sample data with a small delay to simulate loading
    const fetchAssessment = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setAssessmentData(sampleAssessmentData);
      setLoading(false);
    };
    
    if (match && params?.id) {
      fetchAssessment();
    }
  }, [match, params?.id]);

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string, answer: string }) => {
      // In a real app, you would send this to the server
      // For demo purposes, we'll fake the API call
      return new Promise<{ correct: boolean; feedback: string }>((resolve) => {
        setTimeout(() => {
          const question = assessmentData?.questions.find(q => q.id === questionId);
          const correct = question?.correctAnswer === answer;
          resolve({
            correct,
            feedback: question?.explanation || 
              (correct ? "That's correct!" : "That's not quite right.")
          });
        }, 300);
      });
    }
  });

  const completeAssessmentMutation = useMutation({
    mutationFn: async () => {
      // In a real app, you would send this to the server
      // For demo purposes, we'll fake the API call
      return new Promise<{ score: number; feedback: string }>((resolve) => {
        setTimeout(() => {
          if (!assessmentData) return;
          
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
          
          resolve({
            score: totalScore,
            feedback: feedbackText
          });
        }, 500);
      });
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
          className="text-lg font-medium leading-relaxed" 
          dangerouslySetInnerHTML={{ 
            __html: question.type === "math" 
              ? katex.renderToString(question.text, { throwOnError: false, displayMode: true }) 
              : question.text 
          }} 
        />
        
        <RadioGroup 
          value={selectedAnswers[question.id] || ""} 
          onValueChange={(value) => handleSelectAnswer(question.id, value)}
          className="space-y-3"
        >
          {question.options?.map(option => (
            <div key={option.id} className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} className="mt-1" />
              <Label 
                htmlFor={`${question.id}-${option.id}`} 
                className="flex-1 cursor-pointer"
                dangerouslySetInnerHTML={{ 
                  __html: katex.renderToString(option.text, { throwOnError: false, output: 'html' }) 
                }}
              />
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto p-6 space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!assessmentData) {
    return (
      <div className="container max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Not Found</CardTitle>
            <CardDescription>The assessment you are looking for could not be found.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/")}>Return Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (assessmentComplete) {
    return (
      <div className="container max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Complete</CardTitle>
            <CardDescription>{assessmentData.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
                <span className="text-3xl font-bold text-primary">{score}%</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Your Score</h3>
              <p className="text-muted-foreground">{feedback}</p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Review</h3>
              {assessmentData.questions.map((question, index) => {
                const isCorrect = selectedAnswers[question.id] === question.correctAnswer;
                return (
                  <div key={question.id} className="space-y-2">
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-2 ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{`Question ${index + 1}`}</p>
                        <div 
                          className="text-sm text-muted-foreground" 
                          dangerouslySetInnerHTML={{ 
                            __html: question.type === "math" 
                              ? katex.renderToString(question.text, { throwOnError: false }) 
                              : question.text 
                          }} 
                        />
                      </div>
                    </div>
                    <div className="pl-8">
                      <p className="text-sm">
                        <span className="font-medium">Your answer:</span> {' '}
                        {question.options?.find(o => o.id === selectedAnswers[question.id])?.text || 'No answer'}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm">
                          <span className="font-medium">Correct answer:</span> {' '}
                          {question.options?.find(o => o.id === question.correctAnswer)?.text}
                        </p>
                      )}
                      <p className="text-sm mt-1 text-muted-foreground">
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleRetake}>Retake Assessment</Button>
            <Button onClick={() => setLocation("/")}>Back to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQuestionData = assessmentData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessmentData.questions.length) * 100;

  return (
    <div className="container max-w-3xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{assessmentData.title}</h1>
        <p className="text-muted-foreground">{assessmentData.description}</p>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Question {currentQuestion + 1} of {assessmentData.questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {renderQuestion(currentQuestionData)}
          
          {showFeedback && (
            <Alert className="mt-6" variant={submitAnswerMutation.data?.correct ? "default" : "destructive"}>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>
                {submitAnswerMutation.data?.correct ? "Correct!" : "Incorrect"}
              </AlertTitle>
              <AlertDescription>
                {submitAnswerMutation.data?.feedback}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedAnswers[currentQuestionData.id] || submitAnswerMutation.isPending || showFeedback}
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