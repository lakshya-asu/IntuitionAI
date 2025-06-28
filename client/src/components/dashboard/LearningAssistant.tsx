import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Brain, MessageSquare, Target, BookOpen, BarChart3, Calendar, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: any[];
  recommendations?: any[];
  nextSteps?: string[];
  agentsInvolved?: string[];
}

interface LearningAssistantProps {
  onRecommendationSelect?: (recommendation: any) => void;
  onActionTrigger?: (action: any) => void;
}

export default function LearningAssistant({ onRecommendationSelect, onActionTrigger }: LearningAssistantProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI learning assistant. I can help you with personalized recommendations, study planning, progress evaluation, and answering questions about your learning journey. What would you like to work on today?",
      timestamp: new Date().toISOString(),
      agentsInvolved: ['student_interaction']
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentContext, setCurrentContext] = useState<string>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Call the orchestrator API for comprehensive response
      const response = await fetch('/api/orchestrator/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: inputMessage,
          context: {
            currentActivity: currentContext,
            sessionType: 'study',
            timeAvailable: 30,
            priority: 'learning'
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from learning assistant');
      }
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I'm here to help with your learning. Could you tell me more about what you'd like to explore?",
        timestamp: new Date().toISOString(),
        actions: data.actions || [],
        recommendations: data.recommendations || [],
        nextSteps: data.nextSteps || [],
        agentsInvolved: data.agentsInvolved || []
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (actionType: string) => {
    const quickActions = {
      'recommend': "Can you recommend some learning resources for me?",
      'evaluate': "How am I doing with my current learning progress?",
      'plan': "Help me plan my next learning session.",
      'review': "What should I review based on my recent activity?"
    };
    
    const message = quickActions[actionType as keyof typeof quickActions];
    if (message) {
      setInputMessage(message);
      // Auto-send the message
      setTimeout(() => handleSendMessage(), 100);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'student_interaction': return <MessageSquare className="h-3 w-3" />;
      case 'recommendation': return <Lightbulb className="h-3 w-3" />;
      case 'evaluator': return <BarChart3 className="h-3 w-3" />;
      case 'orchestrator': return <Brain className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getAgentColor = (agentType: string) => {
    switch (agentType) {
      case 'student_interaction': return 'bg-blue-100 text-blue-700';
      case 'recommendation': return 'bg-green-100 text-green-700';
      case 'evaluator': return 'bg-purple-100 text-purple-700';
      case 'orchestrator': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[480px] h-[600px] bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col z-50">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center">
              <Brain className="h-5 w-5 text-primary mr-2" />
              <div>
                <h3 className="font-semibold">AI Learning Assistant</h3>
                <p className="text-xs text-slate-500">Multi-agent learning support</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-700"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickAction('recommend')}
                className="text-xs"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Recommend
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickAction('evaluate')}
                className="text-xs"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Evaluate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickAction('plan')}
                className="text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Plan
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickAction('review')}
                className="text-xs"
              >
                <BookOpen className="h-3 w-3 mr-1" />
                Review
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Show agents involved */}
                  {message.agentsInvolved && message.agentsInvolved.length > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {message.agentsInvolved.map((agent, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className={`text-xs ${getAgentColor(agent)}`}
                        >
                          {getAgentIcon(agent)}
                          <span className="ml-1 capitalize">{agent.replace('_', ' ')}</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Show recommendations */}
                  {message.recommendations && message.recommendations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-slate-600">Recommendations:</p>
                      {message.recommendations.slice(0, 2).map((rec, index) => (
                        <Card key={index} className="p-2 bg-white/50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-medium">{rec.title}</p>
                              <p className="text-xs text-slate-600">{rec.description}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRecommendationSelect?.(rec)}
                              className="text-xs"
                            >
                              View
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {/* Show next steps */}
                  {message.nextSteps && message.nextSteps.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-slate-600 mb-1">Next Steps:</p>
                      <ul className="text-xs space-y-1">
                        {message.nextSteps.slice(0, 3).map((step, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-primary mr-1">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <p className="text-xs mt-2 opacity-70 text-right">
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg p-3 bg-slate-100 text-slate-800 rounded-tl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 border-t border-slate-200">
            <div className="flex space-x-2">
              <Textarea
                placeholder="Ask about your learning, request recommendations, or get help..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="resize-none text-sm"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="self-end"
              >
                <span className="material-icons">send</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 z-50"
      >
        <Brain className={`h-6 w-6 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </>
  );
}