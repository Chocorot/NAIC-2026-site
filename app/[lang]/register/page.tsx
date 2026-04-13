import { Metadata } from "next";
import { getDictionary, Locale } from "../dictionaries";
import AuthForm from "@/src/components/AuthForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.metadata.register,
  };
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50 dark:bg-slate-950">
      <AuthForm mode="register" dict={dict} lang={lang} />
    </div>
  );
}
