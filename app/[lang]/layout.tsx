import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { cookies } from "next/headers";
import "../globals.css";
import LanguageSwitcher from "@/src/components/LanguageSwitcher";
import ThemeToggle from "@/src/components/ThemeToggle";
import Navbar from "@/src/components/Navbar";
import { getDictionary, Locale } from "./dictionaries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NAIC 2026 - DR Screening Tool",
  description: "AI-assisted diabetic retinopathy screening prototype",
};

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "zh" }, { lang: "ms" }, { lang: "ja" }, { lang: "de" }];
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value || 'light';

  return (
    <html lang={lang} className={`${geistSans.variable} ${geistMono.variable} ${theme} h-full antialiased`} style={{ colorScheme: theme }}>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-slate-950 transition-colors duration-300">
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-slate-950/80 dark:border-slate-800 transition-colors duration-300">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-10">
              <Link href={`/${lang}`} className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-600 dark:text-blue-400 group">
                <span className="bg-blue-600 text-white p-1 rounded-md text-sm group-hover:scale-110 transition-transform">NAIC</span>
                <span>DR Screening</span>
              </Link>
              <Navbar lang={lang} dict={dict} />
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="h-4 w-px bg-zinc-200 dark:bg-slate-800" />
              <LanguageSwitcher currentLocale={lang} />
            </div>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        
        <footer className="border-t py-12 bg-zinc-50 dark:bg-slate-950 dark:border-slate-800 transition-colors duration-300">
          <div className="container mx-auto px-4 text-center">
            <div className="text-zinc-400 dark:text-zinc-600 font-bold tracking-[0.2em] text-[10px] uppercase mb-4">&copy; 2026 NAIC - Research Division</div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Diabetic Retinopathy Screening Prototype</p>
            <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-600 max-w-md mx-auto italic">
              Computational Clinical Prototype - This platform is for research purposes only and does not constitute medical advice or clinical diagnosis.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
