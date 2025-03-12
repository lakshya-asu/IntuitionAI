interface LearningPathProps {
  learningPath: {
    id: string;
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'upcoming';
    progress?: number;
    completedOn?: string;
    topics: string[];
  }[];
}

export default function LearningPath({ learningPath }: LearningPathProps) {
  if (!learningPath) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Your Learning Path</h2>
        <a href="#path" className="text-primary flex items-center hover:underline">
          View all
          <span className="material-icons text-sm ml-1">chevron_right</span>
        </a>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="relative">
          <div className="absolute top-0 bottom-0 left-6 w-1 bg-slate-200"></div>
          
          {learningPath.map((item, index) => (
            <div key={item.id} className={`relative flex items-start ${index !== learningPath.length - 1 ? 'mb-8' : ''}`}>
              <div className={`absolute top-0 left-6 -ml-3 h-6 w-6 rounded-full ${
                item.status === 'completed' || item.status === 'in-progress' 
                  ? 'bg-primary border-4 border-white shadow' 
                  : 'bg-slate-300 border-4 border-white shadow'
              }`}></div>
              <div className="ml-10">
                <div className="flex flex-col md:flex-row md:items-center mb-1 md:space-x-3">
                  <h3 className="font-semibold text-slate-800">{item.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.status === 'completed' ? 'bg-green-100 text-success' : 
                    item.status === 'in-progress' ? 'bg-blue-100 text-primary' : 
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {item.status === 'completed' ? 'Completed' : 
                     item.status === 'in-progress' ? 'In Progress' : 
                     'Upcoming'}
                  </span>
                </div>
                <p className="text-slate-500 mb-3">{item.description}</p>
                <div className="flex flex-wrap gap-2">
                  {item.topics.map((topic, idx) => (
                    <span key={idx} className="px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                      {topic}
                    </span>
                  ))}
                </div>
                
                {item.status === 'completed' && item.completedOn && (
                  <div className="mt-3 flex items-center text-sm text-slate-500">
                    <span className="material-icons text-sm mr-1">calendar_today</span>
                    <span>Completed on {item.completedOn}</span>
                  </div>
                )}
                
                {item.status === 'in-progress' && typeof item.progress === 'number' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    <button className="mt-3 flex items-center text-primary hover:underline">
                      <span className="material-icons text-sm mr-1">play_circle</span>
                      Continue learning
                    </button>
                  </div>
                )}
                
                {item.status === 'upcoming' && (
                  <div className="mt-3 flex items-center">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded flex items-center">
                      <span className="material-icons text-sm mr-1">lock</span>
                      Locked - Complete current module first
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
