import { getDictionary, Locale } from "../dictionaries";
import AuthForm from "@/src/components/AuthForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50 dark:bg-slate-950">
      <AuthForm mode="login" dict={dict} lang={lang} />
    </div>
  );
}
