interface ResourceTileProps {
  type: 'video' | 'audio' | 'interactive' | 'text' | 'mixed';
  title: string;
  description: string;
  onClick: () => void;
}

export default function ResourceTile({ type, title, description, onClick }: ResourceTileProps) {
  const getIcon = () => {
    switch (type) {
      case 'video': return 'play_circle';
      case 'audio': return 'headphones';
      case 'interactive': return 'touch_app';
      case 'text': return 'menu_book';
      default: return 'smart_display';
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'video': return 'from-red-900/40 to-orange-900/40';
      case 'audio': return 'from-blue-900/40 to-cyan-900/40';
      case 'interactive': return 'from-emerald-900/40 to-teal-900/40';
      case 'text': return 'from-slate-800/80 to-slate-900/90';
      default: return 'from-slate-800/80 to-slate-900/90';
    }
  };

  return (
    <div 
      className={`flex flex-col h-full bg-gradient-to-br ${getGradient()} p-6 relative overflow-hidden group hover:brightness-110 transition-all cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-all">
          <span className="material-icons text-white">{getIcon()}</span>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-white/70">{type} Resource</span>
      </div>
      
      <div className="mt-auto">
        <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-[#FEFFF5] transition-colors">{title}</h3>
        <p className="text-sm text-slate-300 line-clamp-2">{description}</p>
      </div>
    </div>
  );
}
