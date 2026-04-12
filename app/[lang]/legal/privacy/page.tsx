import { Locale, getDictionary } from "../../dictionaries";
import { HiOutlineShieldCheck } from "react-icons/hi";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
          <HiOutlineShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white">
            {dict.legal.privacy_title}
          </h1>
          <p className="text-zinc-500 font-medium">{dict.legal.last_updated}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none border dark:border-slate-800 prose prose-zinc dark:prose-invert max-w-none">
        <p>{dict.legal.privacy_intro}</p>

        <h3>{dict.legal.privacy_s1_title}</h3>
        <p>{dict.legal.privacy_s1_content}</p>

        <h3>{dict.legal.privacy_s2_title}</h3>
        <p>{dict.legal.privacy_s2_content}</p>

        <h3>{dict.legal.privacy_s3_title}</h3>
        <p>{dict.legal.privacy_s3_content}</p>

        <h3>{dict.legal.privacy_s4_title}</h3>
        <p>{dict.legal.privacy_s4_content}</p>
      </div>
    </div>
  );
}
