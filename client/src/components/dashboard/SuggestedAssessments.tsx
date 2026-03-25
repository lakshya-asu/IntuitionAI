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
        return 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-300';
      case 'review':
        return 'from-indigo-500/10 to-blue-500/10 border-indigo-500/20 text-indigo-300';
      case 'challenge':
        return 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-300';
      default:
        return 'from-gray-500/10 to-slate-500/10 border-gray-500/20 text-gray-300';
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
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 flex items-center">
            <Zap className="mr-2 h-6 w-6 text-amber-400" />
            Continuous Evaluation
          </h2>
          <p className="text-sm text-slate-400 mt-1">Seamless checks curated by the Evaluator Agent</p>
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
          displayData.suggested.map((assessment: Assessment) => {
            const style = getTypeStyle(assessment.type);
            
            return (
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                key={assessment.id}
                onClick={() => startAssessment(assessment.id)}
                className={`cursor-pointer overflow-hidden relative p-6 rounded-2xl glassmorphism-dark border ${style} flex flex-col group glow-border`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${style} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-xl bg-slate-900 border ${style} shadow-inner`}>
                      {getIcon(assessment.type)}
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md bg-slate-900 border ${style}`}>
                      {assessment.typeLabel}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg text-white mb-2 leading-tight">{assessment.title}</h3>
                  <p className="text-sm text-slate-400 mb-6 flex-1">{assessment.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                    <div className="flex items-center text-xs font-medium text-slate-400">
                      <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                      {assessment.duration}
                    </div>
                    
                    <div className={`flex items-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 ${style.split(' ')[2]}`}>
                      Begin
                      <ArrowRight className="w-4 h-4 ml-1" />
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