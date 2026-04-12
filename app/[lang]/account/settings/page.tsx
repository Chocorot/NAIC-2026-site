import { getDictionary, Locale } from "../../dictionaries";
import AccountSettings from "@/src/components/AccountSettings";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <AccountSettings dict={dict} />
    </div>
  );
}
