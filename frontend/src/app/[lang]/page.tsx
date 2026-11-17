import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { READY_MODULES, toPublicModule } from "@/content/catalog";
import { Dashboard } from "@/components/Dashboard";

/** Bosh sahifa — o'quvchi kabineti: natijalar va "Davom ettirish". */
export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Dashboard lang={lang} modules={READY_MODULES.map(toPublicModule)} />
    </div>
  );
}
