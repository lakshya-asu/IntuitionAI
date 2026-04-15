import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Brain, MessageSquare, Target, BookOpen, BarChart3, Calendar, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

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
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 right-6 w-[480px] h-[600px] bg-[#0A0A0A] border border-white/10 rounded-[24px] shadow-2xl flex flex-col z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#141414]">
            <div className="flex items-center">
              <Brain className="h-6 w-6 text-[#FEFFF5] mr-3" />
              <div>
                <h3 className="font-extrabold tracking-tight text-[#FEFFF5]">AI Learning Assistant</h3>
                <p className="text-xs font-bold text-[#959C95] uppercase tracking-widest mt-0.5">Multi-agent Support</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[#959C95] hover:text-[#FEFFF5] bg-[#0A0A0A] p-2 rounded-full border border-white/5 hover:bg-[#1A1A1A] transition-all"
            >
              <span className="material-icons leading-none text-sm">close</span>
            </button>
          </div>
          
          <div className="p-4 border-b border-white/5 bg-[#0D0D0D]">
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickAction('recommend')}
                className="text-[10px] uppercase font-bold tracking-widest rounded-full bg-[#141414] border-white/5 text-[#959C95] hover:text-[#FEFFF5] hover:bg-[#1A1A1A]"
              >
                <Lightbulb className="h-3 w-3 mr-1.5" />
                Recommend
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickAction('evaluate')}
                className="text-[10px] uppercase font-bold tracking-widest rounded-full bg-[#141414] border-white/5 text-[#959C95] hover:text-[#FEFFF5] hover:bg-[#1A1A1A]"
              >
                <BarChart3 className="h-3 w-3 mr-1.5" />
                Evaluate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickAction('plan')}
                className="text-[10px] uppercase font-bold tracking-widest rounded-full bg-[#141414] border-white/5 text-[#959C95] hover:text-[#FEFFF5] hover:bg-[#1A1A1A]"
              >
                <Calendar className="h-3 w-3 mr-1.5" />
                Plan
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickAction('review')}
                className="text-[10px] uppercase font-bold tracking-widest rounded-full bg-[#141414] border-white/5 text-[#959C95] hover:text-[#FEFFF5] hover:bg-[#1A1A1A]"
              >
                <BookOpen className="h-3 w-3 mr-1.5" />
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
                  className={`max-w-[85%] px-5 py-4 ${
                    message.role === 'user'
                      ? 'bg-[#FEFFF5] text-[#0D0D0D] rounded-2xl rounded-tr-none font-medium'
                      : 'bg-[#141414] border border-white/5 text-[#959C95] rounded-2xl rounded-tl-none'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  
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
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#FEFFF5]">Recommendations:</p>
                      {message.recommendations.slice(0, 2).map((rec, index) => (
                        <Card key={index} className="p-4 bg-[#0A0A0A] border-white/5 rounded-xl">
                          <div className="flex justify-between items-start">
                            <div className="pr-4">
                              <p className="text-sm font-bold text-[#FEFFF5] tracking-tight">{rec.title}</p>
                              <p className="text-xs text-[#959C95] mt-1">{rec.description}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRecommendationSelect?.(rec)}
                              className="text-xs bg-[#FEFFF5] text-[#0D0D0D] hover:bg-[#E5E5DC] rounded-full h-8 px-4 font-bold"
                            >
                              View
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {message.nextSteps && message.nextSteps.length > 0 && (
                    <div className="mt-5 p-4 bg-[#0D0D0D] border border-white/5 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-[#FEFFF5] tracking-widest mb-3">Next Steps:</p>
                      <ul className="text-sm space-y-2">
                        {message.nextSteps.slice(0, 3).map((step, index) => (
                          <li key={index} className="flex items-start text-[#959C95]">
                            <span className="text-[#FEFFF5] mr-2 mt-0.5 material-icons text-xs">arrow_forward</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <p className={`text-[10px] mt-3 font-bold opacity-50 text-right ${message.role === 'user' ? 'text-[#0D0D0D]' : 'text-[#959C95]'}`}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl p-4 bg-[#141414] border border-white/5 rounded-tl-none">
                  <div className="flex space-x-1.5 items-center justify-center h-5">
                    <div className="w-1.5 h-1.5 bg-[#959C95] rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-[#959C95] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-[#959C95] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-white/5 bg-[#141414]">
            <div className="flex space-x-3 items-end">
              <Textarea
                placeholder="Ask about your learning..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="resize-none text-sm bg-[#0A0A0A] border-white/10 rounded-[18px] text-[#FEFFF5] placeholder:text-[#959C95] focus-visible:ring-0 focus-visible:border-white/30 h-[56px] min-h-[56px] py-3.5 px-5"
                rows={1}
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
                className="rounded-full w-14 h-14 bg-[#FEFFF5] text-[#0D0D0D] hover:bg-[#E5E5DC] flex-shrink-0"
              >
                <span className="material-icons pr-1">send</span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-[#FEFFF5] text-[#0D0D0D] shadow-[0_4px_30px_rgba(254,255,245,0.2)] flex items-center justify-center hover:scale-105 transition-all duration-300 z-50 group"
      >
        <Brain className={`h-7 w-7 transition-transform duration-300 ${isOpen ? 'rotate-180 scale-90' : 'group-hover:scale-110'}`} />
      </button>
    </>
  );
}