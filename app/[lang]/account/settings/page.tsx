import { Metadata } from "next";
import { getDictionary, Locale } from "../../dictionaries";
import AccountSettings from "@/src/components/AccountSettings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.metadata.settings,
  };
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <AccountSettings dict={dict} lang={lang} />
    </div>
  );
}
