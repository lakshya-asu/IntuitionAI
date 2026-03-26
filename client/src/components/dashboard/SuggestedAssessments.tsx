import React from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Clock, Brain, Zap, BarChart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

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
        title: "Machine Learning Basics",
        type: "review",
        typeLabel: "Knowledge Review",
        description: "Test your understanding of fundamental machine learning concepts before moving forward.",
        duration: "10 min"
      },
      {
        id: "assessment-002",
        title: "Probabilistic Reasoning",
        type: "challenge",
        typeLabel: "Advanced Challenge",
        description: "Challenge yourself with complex reasoning problems.",
        duration: "15 min"
      }
    ] 
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'recommended':
        return <Zap className="h-6 w-6 text-amber-400" />;
      case 'review':
        return <Brain className="h-6 w-6 text-indigo-400" />;
      case 'challenge':
        return <BarChart className="h-6 w-6 text-emerald-400" />;
      default:
        return <Brain className="h-6 w-6 text-indigo-400" />;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'recommended':
        return 'bg-[#FEFFF5] text-[#0D0D0D] border-transparent';
      case 'review':
        return 'bg-[#1A1A1A] text-[#FEFFF5] border-white/10';
      case 'challenge':
        return 'bg-[#0A0A0A] text-[#959C95] border-white/5';
      default:
        return 'bg-[#141414] text-[#959C95] border-white/5';
    }
  };

  const startAssessment = (id: string) => {
    setLocation(`/assessment/${id}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <div className="mb-10 relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tighter text-[#FEFFF5] flex items-center">
            <Zap className="mr-3 h-7 w-7 text-[#FEFFF5]" />
            Continuous Evaluation
          </h2>
          <p className="text-[#959C95] text-sm mt-1">Seamless checks curated by the Evaluator Agent</p>
        </div>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse h-40 glassmorphism-dark rounded-2xl"></div>
          ))
        ) : (
          (displayData as any).suggested.map((assessment: Assessment) => {
            const style = getTypeStyle(assessment.type);
            
            return (
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                key={assessment.id}
                onClick={() => startAssessment(assessment.id)}
                className={`cursor-pointer overflow-hidden relative p-6 rounded-[24px] bg-[#141414] border border-white/5 flex flex-col group transition-all duration-300 hover:bg-[#1A1A1A] hover:border-white/10`}
              >
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-2.5 rounded-full bg-[#0D0D0D] border border-white/10 flex items-center justify-center">
                      {assessment.type === 'recommended' ? <Zap className="h-5 w-5 text-[#FEFFF5]" /> : 
                       assessment.type === 'review' ? <Brain className="h-5 w-5 text-[#FEFFF5]" /> : 
                       <BarChart className="h-5 w-5 text-[#FEFFF5]" />}
                    </div>
                    <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full border ${style}`}>
                      {assessment.typeLabel}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-xl tracking-tight text-[#FEFFF5] mb-2 leading-tight">{assessment.title}</h3>
                  <p className="text-[#959C95] text-sm leading-relaxed mb-8 flex-1">{assessment.description}</p>
                  
                  <div className="flex items-center justify-between pt-5 border-t border-white/5 mt-auto">
                    <div className="flex items-center text-xs font-bold tracking-wide text-[#959C95]">
                      <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                      {assessment.duration}
                    </div>
                    
                    <div className="flex items-center text-sm font-bold text-[#FEFFF5] transition-all transform group-hover:-translate-x-1">
                      Begin
                      <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}