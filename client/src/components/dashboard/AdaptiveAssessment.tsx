interface AdaptiveAssessmentProps {
  assessments: {
    suggested: {
      id: string;
      title: string;
      type: 'recommended' | 'review' | 'challenge';
      typeLabel: string;
      description: string;
      duration: string;
    }[];
  };
}

export default function AdaptiveAssessment({ assessments }: AdaptiveAssessmentProps) {
  if (!assessments) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Adaptive Assessment</h2>
        <a href="#assessments" className="text-primary flex items-center hover:underline">
          View history
          <span className="material-icons text-sm ml-1">chevron_right</span>
        </a>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Ready to test your knowledge?</h3>
            <p className="text-slate-500 mb-4">
              Our adaptive testing system will adjust questions based on your performance to accurately measure your mastery level.
            </p>
            
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <span className="material-icons text-success mr-2">auto_awesome</span>
                <span className="font-medium">AI-powered difficulty adjustment</span>
              </div>
              <div className="flex items-center mb-2">
                <span className="material-icons text-primary mr-2">insights</span>
                <span className="font-medium">Detailed performance analytics</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons text-secondary mr-2">psychology_alt</span>
                <span className="font-medium">Knowledge gap identification</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90 flex items-center">
                <span className="material-icons mr-2">quiz</span>
                Start New Assessment
              </button>
              <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50">
                Practice Mode
              </button>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-full md:w-72 bg-slate-100 rounded-lg p-4">
            <h4 className="font-medium text-slate-700 mb-3">Suggested Assessments</h4>
            <ul className="space-y-3">
              {assessments.suggested.map((test) => (
                <li key={test.id} className="bg-white p-3 rounded-lg border border-slate-200 hover:shadow-sm transition cursor-pointer">
                  <div className="flex justify-between items-start">
                    <h5 className="font-medium">{test.title}</h5>
                    <span className={`text-xs ${
                      test.type === 'recommended' ? 'bg-blue-100 text-primary' : 
                      test.type === 'review' ? 'bg-amber-100 text-amber-700' : 
                      'bg-purple-100 text-secondary'
                    } px-2 py-1 rounded-full`}>
                      {test.typeLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{test.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-600">Est. {test.duration}</span>
                    <button className="text-primary text-sm hover:underline">Take test</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
