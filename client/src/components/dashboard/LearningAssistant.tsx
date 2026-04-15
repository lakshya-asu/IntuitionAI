import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

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
      
      // Invalidate queries to trigger AdaptiveGrid resorting dynamically!
      // When agent interacts, we might have updated Syllabus or Persona.
      if (data.agentsInvolved && data.agentsInvolved.length > 0) {
         queryClient.invalidateQueries({ queryKey: ["/api/user/persona"] });
         queryClient.invalidateQueries({ queryKey: ["/api/learning-path"] });
         queryClient.invalidateQueries({ queryKey: ["/api/assessments/suggested"] });
         queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      }
      
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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center w-[90%] max-w-[650px]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-[24px] shadow-[0_-10px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden mb-4 origin-bottom"
            style={{ maxHeight: '65vh', height: '500px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#141414] shrink-0">
              <div className="flex items-center">
                <Brain className="h-6 w-6 text-[#FEFFF5] mr-3" />
                <div>
                  <h3 className="font-extrabold tracking-tight text-[#FEFFF5] text-sm">AI Learning Assistant</h3>
                  <p className="text-[10px] font-bold text-[#959C95] uppercase tracking-widest mt-0.5">Adaptive Support Mode</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[#959C95] hover:text-[#FEFFF5] bg-[#0A0A0A] p-2 rounded-full border border-white/5 hover:bg-[#1A1A1A] transition-all"
              >
                <span className="material-icons leading-none text-sm">close</span>
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="p-3 border-b border-white/5 bg-[#0D0D0D] shrink-0">
              <div className="flex gap-2 flex-nowrap overflow-x-auto custom-scrollbar pb-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickAction('recommend')}
                  className="text-[10px] uppercase font-bold tracking-widest rounded-full bg-[#141414] border-white/5 text-[#959C95] hover:text-[#FEFFF5] hover:bg-[#1A1A1A] shrink-0"
                >
                  <Lightbulb className="h-3 w-3 mr-1.5" />
                  Recommend
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickAction('evaluate')}
                  className="text-[10px] uppercase font-bold tracking-widest rounded-full bg-[#141414] border-white/5 text-[#959C95] hover:text-[#FEFFF5] hover:bg-[#1A1A1A] shrink-0"
                >
                  <BarChart3 className="h-3 w-3 mr-1.5" />
                  Evaluate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickAction('plan')}
                  className="text-[10px] uppercase font-bold tracking-widest rounded-full bg-[#141414] border-white/5 text-[#959C95] hover:text-[#FEFFF5] hover:bg-[#1A1A1A] shrink-0"
                >
                  <Calendar className="h-3 w-3 mr-1.5" />
                  Plan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickAction('review')}
                  className="text-[10px] uppercase font-bold tracking-widest rounded-full bg-[#141414] border-white/5 text-[#959C95] hover:text-[#FEFFF5] hover:bg-[#1A1A1A] shrink-0"
                >
                  <BookOpen className="h-3 w-3 mr-1.5" />
                  Review
                </Button>
              </div>
            </div>
            
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[88%] lg:max-w-[85%] px-5 py-4 ${
                      message.role === 'user'
                        ? 'bg-[#141414] border border-white/10 text-[#FEFFF5] rounded-3xl rounded-br-md font-medium shadow-md'
                        : 'bg-transparent text-[#959C95] rounded-none'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Show agents involved */}
                    {message.agentsInvolved && message.agentsInvolved.length > 0 && message.role === 'assistant' && (
                      <div className="mt-3 flex gap-1.5 flex-wrap border-t border-white/5 pt-3">
                        {message.agentsInvolved.map((agent, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 border-transparent ${getAgentColor(agent)}`}
                          >
                            {getAgentIcon(agent)}
                            <span className="ml-1 items-center">{agent.replace('_', ' ')}</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Show recommendations */}
                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#FEFFF5] mb-2">Recommended for you</p>
                        {message.recommendations.slice(0, 2).map((rec, index) => (
                          <Card key={index} className="px-3 py-2 bg-[#1A1A1A]/50 border-white/10 rounded-xl hover:bg-[#1A1A1A] transition-colors group">
                            <div className="flex justify-between items-center">
                              <div className="pr-2">
                                <p className="text-sm font-bold text-[#FEFFF5] tracking-tight line-clamp-1">{rec.title}</p>
                                <p className="text-[10px] text-[#959C95] mt-0.5 line-clamp-1">{rec.description}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onRecommendationSelect?.(rec)}
                                className="text-[10px] bg-white/5 text-[#FEFFF5] hover:bg-white/10 rounded-full h-7 px-3 font-bold uppercase tracking-wider shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                View
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                    
                    {message.nextSteps && message.nextSteps.length > 0 && (
                      <div className="mt-4 p-4 bg-[#141414]/50 border border-white/5 rounded-2xl">
                        <p className="text-[10px] uppercase font-bold text-[#FEFFF5] tracking-widest mb-3">Adaptive Plan</p>
                        <ul className="text-sm space-y-2.5">
                          {message.nextSteps.slice(0, 3).map((step, index) => (
                            <li key={index} className="flex items-start text-[#959C95]">
                              <span className="text-[#FEFFF5] mr-2 mt-0.5 material-icons text-xs">adjust</span>
                              <span className="leading-snug">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <p className={`text-[10px] mt-2 font-bold opacity-40 text-right uppercase tracking-wider ${message.role === 'user' ? 'text-white' : 'text-[#959C95]'}`}>
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-5 pt-2 pb-4">
                    <div className="flex space-x-1.5 items-center h-5">
                      <div className="w-1.5 h-1.5 bg-[#959C95] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-[#959C95] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-[#959C95] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Quick floating actions when NOT open */}
      {!isOpen && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-2 mb-3 bg-[#0D0D0D]/90 backdrop-blur-md px-3 py-1.5 border border-white/5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          >
             <button onClick={() => { setIsOpen(true); handleQuickAction('recommend'); }} className="text-[11px] font-bold text-[#959C95] hover:text-[#FEFFF5] px-2 py-0.5 flex items-center transition-colors uppercase tracking-wider"><Lightbulb className="w-3 h-3 mr-1.5"/> Suggest</button>
             <div className="w-px bg-white/10" />
             <button onClick={() => { setIsOpen(true); handleQuickAction('evaluate'); }} className="text-[11px] font-bold text-[#959C95] hover:text-[#FEFFF5] px-2 py-0.5 flex items-center transition-colors uppercase tracking-wider"><BarChart3 className="w-3 h-3 mr-1.5"/> Evaluate</button>
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* The main input pill (Always visible and anchored at bottom) */}
      <div 
        className={`w-full transition-all duration-300 ${isOpen ? 'bg-[#141414] rounded-2xl rounded-tr-sm rounded-tl-sm' : 'bg-[#141414] rounded-full'} border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.8)] p-2 pl-3 flex items-end group focus-within:border-white/30`}
      >
         <div className="h-12 w-10 flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
             <Brain className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'text-emerald-400 scale-110' : 'text-[#FEFFF5] group-hover:scale-110 group-hover:text-emerald-200'}`} />
         </div>
         <Textarea
           placeholder={isOpen ? "Type a message..." : "Ask IntuitionAI about your learning..."}
           value={inputMessage}
           onFocus={() => setIsOpen(true)}
           onChange={(e) => setInputMessage(e.target.value)}
           className="resize-none text-[15px] bg-transparent border-0 text-[#FEFFF5] placeholder:text-[#959C95] focus-visible:ring-0 h-[48px] min-h-[48px] py-3 px-3 flex-1 shadow-none"
           rows={1}
           onKeyDown={(e) => {
             if (e.key === 'Enter' && !e.shiftKey) {
               e.preventDefault();
               if (!isOpen) setIsOpen(true);
               handleSendMessage();
             }
           }}
         />
         <Button 
           onClick={() => { if(!isOpen) setIsOpen(true); handleSendMessage(); }}
           disabled={!inputMessage.trim() || isLoading}
           size="icon"
           className="rounded-full w-10 h-10 mb-1 mr-1 bg-[#FEFFF5] text-[#0D0D0D] hover:bg-[#E5E5DC] disabled:opacity-30 disabled:bg-white/10 disabled:text-white/50 flex-shrink-0 transition-all font-bold shadow-sm"
         >
           <span className="material-icons text-[18px]">arrow_upward</span>
         </Button>
      </div>
    </div>
  );
}