import { getDictionary, Locale } from "../dictionaries";
import HistoryInterface from "@/src/components/HistoryInterface";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-slate-950 transition-colors duration-300">
      <HistoryInterface dict={dict} />
    </div>
  );
}
