import { Metadata } from "next";
import { Locale, getDictionary } from "../../dictionaries";
import { HiOutlineDocumentText } from "react-icons/hi";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.metadata.terms,
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
          <HiOutlineDocumentText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white">
            {dict.legal.terms_title}
          </h1>
          <p className="text-zinc-500 font-medium">{dict.legal.last_updated}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none border dark:border-slate-800 prose prose-zinc dark:prose-invert max-w-none">
        <p>{dict.legal.terms_intro}</p>

        <h3>{dict.legal.terms_s1_title}</h3>
        <p className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-amber-900 dark:text-amber-200 font-medium italic">
          {dict.legal.disclaimer}: {dict.legal.terms_s1_content}
        </p>

        <h3>{dict.legal.terms_s2_title}</h3>
        <p>{dict.legal.terms_s2_content}</p>

        <h3>{dict.legal.terms_s3_title}</h3>
        <p>{dict.legal.terms_s3_content}</p>

        <h3>{dict.legal.terms_s4_title}</h3>
        <p>{dict.legal.terms_s4_content}</p>
      </div>
    </div>
  );
}
