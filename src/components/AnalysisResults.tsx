'use client'

import { Dictionary } from '@/app/[lang]/dictionaries'

export default function AnalysisResults({ 
  prediction, 
  probabilities,
  dict 
}: { 
  prediction: number, 
  probabilities: number[],
  dict: Dictionary
}) {
  const classes = dict.severity_classes;
  
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">{dict.screening.prediction}</h3>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ${
            prediction === 0 ? 'bg-emerald-500' :
            prediction === 1 ? 'bg-blue-500' :
            prediction === 2 ? 'bg-amber-500' :
            prediction === 3 ? 'bg-orange-600' : 'bg-rose-600'
          }`}>
            {prediction}
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight">{classes[prediction]}</div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">AI-Aided Preliminary Classification</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-6">{dict.screening.confidence}</h3>
        <div className="space-y-5">
          {probabilities.map((prob, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wide">
                <span className={idx === prediction ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500'}>{classes[idx]}</span>
                <span className="font-mono">{(prob * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out rounded-full ${
                    idx === prediction 
                      ? 'bg-blue-600 dark:bg-blue-500' 
                      : 'bg-zinc-200 dark:bg-slate-700'
                  }`}
                  style={{ width: `${prob * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-5 flex gap-4">
        <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-xl shrink-0 h-fit">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium italic">
          {dict.screening.disclaimer}
        </p>
      </div>
    </div>
  )
}
