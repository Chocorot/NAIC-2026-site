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
    title: dict.metadata.about,
  };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-5xl animate-in fade-in duration-1000">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mb-4">
        {dict.about.platform_documentation}
      </div>
      <h1 className="text-5xl font-black mb-12 tracking-tight">{dict.about.title}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm">
           <div className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">{dict.about.technical_specifications}</div>
           <div className="space-y-8">
              <div className="group">
                <div className="text-xs font-bold text-zinc-400 mb-1 group-hover:text-blue-500 transition-colors">{dict.about.backbone}</div>
                <div className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">{modelConfig.name}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-400 mb-1">{dict.about.input_resolution}</div>
                <div className="text-xl font-bold">{modelConfig.inputSize}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-400 mb-1">{dict.about.build_version}</div>
                <div className="text-xl font-bold">Release v{modelConfig.version}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-400 mb-1">{dict.about.architecture}</div>
                <div className="text-sm font-medium leading-relaxed text-zinc-500">
                  {dict.about.architecture_desc}
                </div>
              </div>
           </div>
        </div>

        <div className="bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-10 shadow-2xl text-white medical-gradient relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
           <div className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mb-8 relative z-10">{dict.about.classification_hierarchy}</div>
           <p className="text-xl font-medium leading-relaxed opacity-95 mb-10 relative z-10">
              {dict.about.classes_desc}
           </p>
           <ul className="space-y-4 relative z-10">
              {dict.severity_classes.map((cls: string, idx: number) => (
                <li key={idx} className="flex items-center gap-4 group/item">
                  <span className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xs font-black group-hover/item:bg-white/20 transition-colors">{idx}</span>
                  <span className="font-bold text-lg">{cls}</span>
                </li>
              ))}
           </ul>
        </div>
      </div>
    </div>
  );
}
