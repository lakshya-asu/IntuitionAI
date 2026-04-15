import { Button } from "@/components/ui/button";

interface AssessmentTileProps {
  onStart: () => void;
  topic?: string;
  difficulty?: string;
}

export default function AssessmentTile({ onStart, topic = "General Knowledge", difficulty = "Adaptive" }: AssessmentTileProps) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-6 relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all duration-700" />
      <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all duration-700" />
      
      <div className="relative z-10 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-indigo-300 mb-2">
            <span className="material-icons text-sm">psychology</span>
            <span className="text-xs font-bold uppercase tracking-wider">{difficulty} Assessment</span>
          </div>
          <h3 className="text-2xl font-extrabold text-white leading-tight mb-2">
            Knowledge Check:<br/>{topic}
          </h3>
          <p className="text-sm text-indigo-200/80 line-clamp-3">
            The evaluator agent has suggested a quick assessment to gauge your understanding and adapt your syllabus accordingly.
          </p>
        </div>
        
        <div className="mt-6">
          <Button 
            onClick={onStart}
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl h-12 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all font-bold"
          >
            Start Assessment
            <span className="material-icons ml-2 text-sm">arrow_forward</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
