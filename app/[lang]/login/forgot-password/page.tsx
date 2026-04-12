import { getDictionary, Locale } from "../../dictionaries";
import AuthForm from "@/src/components/AuthForm";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="container mx-auto px-4 py-20 min-h-[80vh] flex items-center justify-center">
      <AuthForm mode="forgot-password" dict={dict} lang={lang} />
    </div>
  );
}
