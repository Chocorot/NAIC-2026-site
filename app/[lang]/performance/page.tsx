import { Metadata } from "next";
import { getDictionary, Locale } from "../dictionaries";
import { modelConfig } from "@/src/config/model-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.metadata.performance,
  };
}

export default async function PerformancePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  const metrics = [
    {
      label: dict.performance.accuracy,
      value: (modelConfig.performance.accuracy * 100).toFixed(1) + "%",
      color: "text-blue-600",
    },
    {
      label: dict.performance.recall,
      value: (modelConfig.performance.recall * 100).toFixed(1) + "%",
      color: "text-emerald-600",
    },
    {
      label: dict.performance.f1_score,
      value: (modelConfig.performance.f1 * 100).toFixed(1) + "%",
      color: "text-purple-600",
    },
  ];

  const secondaryMetrics = [
    {
      label: dict.performance.precision,
      value: (modelConfig.performance.precision * 100).toFixed(1) + "%",
      color: "text-indigo-600",
    },
    {
      label: dict.performance.roc_auc,
      value: (modelConfig.performance.roc_auc * 100).toFixed(1) + "%",
      color: "text-rose-600",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-5xl animate-in fade-in duration-1000">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mb-4">
        {dict.performance.validation_analytics}
      </div>
      <h1 className="text-5xl font-black mb-12 tracking-tight">
        {dict.performance.title}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-8 shadow-sm group hover:shadow-md transition-shadow"
          >
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">
              {m.label}
            </div>
            <div className={`text-5xl font-black ${m.color} tracking-tighter`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {secondaryMetrics.map((m, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-8 shadow-sm group hover:shadow-md transition-shadow"
          >
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">
              {m.label}
            </div>
            <div className={`text-5xl font-black ${m.color} tracking-tighter`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-black tracking-tight">
            {dict.performance.confusion_matrix}
          </h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-sm" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {dict.performance.hit}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-zinc-100 dark:bg-slate-800 rounded-sm" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {dict.performance.miss}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-2">
            <thead>
              <tr>
                <th className="p-2"></th>
                {dict.severity_classes.map((cls: string, idx: number) => (
                  <th
                    key={idx}
                    className="p-4 text-[10px] font-black uppercase tracking-wider text-zinc-400 text-center min-w-25"
                  >
                    {cls}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modelConfig.confusionMatrix.map((row, rIdx) => (
                <tr key={rIdx}>
                  <td className="p-4 text-[10px] font-black uppercase tracking-wider text-zinc-500 text-right pr-6 whitespace-nowrap bg-zinc-50 dark:bg-slate-800/50 rounded-xl">
                    {dict.severity_classes[rIdx]}
                  </td>
                  {row.map((val, cIdx) => {
                    const maxVal = 500;
                    const alpha = Math.min(0.9, val / maxVal + 0.1);
                    const isDiagonal = rIdx === cIdx;
                    return (
                      <td
                        key={cIdx}
                        className={`p-6 text-center rounded-2xl transition-all hover:scale-105 cursor-default ${
                          isDiagonal ? "shadow-lg shadow-blue-500/20" : ""
                        }`}
                        style={{
                          backgroundColor: isDiagonal
                            ? `rgba(37, 99, 235, ${alpha})`
                            : val > 20
                              ? `rgba(226, 232, 240, 0.8)`
                              : `rgba(248, 250, 252, 0.5)`,
                        }}
                      >
                        <span
                          className={`text-lg font-black ${
                            isDiagonal
                              ? "text-white"
                              : val > 20
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-300 dark:text-zinc-700"
                          }`}
                        >
                          {val}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 p-6 bg-zinc-50 dark:bg-slate-800/30 rounded-2xl border border-zinc-100 dark:border-slate-800/50">
          <p className="text-xs text-zinc-500 leading-relaxed text-center font-medium">
            {dict.performance.analysis_note}
          </p>
        </div>
      </div>
    </div>
  );
}
