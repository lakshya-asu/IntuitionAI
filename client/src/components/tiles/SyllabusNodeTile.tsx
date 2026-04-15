import { Progress } from "@/components/ui/progress";

interface SyllabusNodeTileProps {
  title: string;
  description: string;
  progress: number;
  isActive?: boolean;
}

export default function SyllabusNodeTile({ title, description, progress, isActive = false }: SyllabusNodeTileProps) {
  return (
    <div className={`flex flex-col h-full bg-[#141414] p-6 relative ${isActive ? 'ring-2 ring-emerald-500/50' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <span className="material-icons">{isActive ? 'play_arrow' : 'article'}</span>
        </div>
        <div className="bg-[#1A1A1A] px-3 py-1 rounded-full border border-white/5 flex items-center">
          <span className="font-mono text-xs font-bold text-slate-300">{progress}%</span>
        </div>
      </div>
      
      <div className="mt-auto">
        {isActive && (
          <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider mb-1 block">Current Focus</span>
        )}
        <h3 className="text-xl font-bold text-white mb-2 leading-tight">{title}</h3>
        <p className="text-sm text-slate-400 line-clamp-2 mb-6">{description}</p>
        
        <Progress value={progress} className="h-1.5 bg-[#1A1A1A]" />
      </div>
    </div>
  );
}
