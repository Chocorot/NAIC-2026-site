import { getDictionary, Locale } from "./dictionaries";
import ScreeningInterface from "@/src/components/ScreeningInterface";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-5xl animate-in fade-in duration-1000">
      <div className="flex flex-col gap-4 mb-20 lg:mb-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest w-fit dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
          {dict.screening_ui.platform_badge}
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white sm:text-6xl lg:text-7xl">
          {dict.screening.title}
        </h1>
        <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-3xl leading-relaxed font-medium">
          {dict.screening.description}
        </p>
      </div>

      <ScreeningInterface dict={dict} />
    </div>
  );
}
