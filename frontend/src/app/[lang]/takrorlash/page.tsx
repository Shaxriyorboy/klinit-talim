import { redirect } from "next/navigation";

/** Takrorlash bo'limi hozircha yopiq (ReviewSession komponenti keyinroq qaytarish uchun saqlangan). */
export default async function ReviewPage({ params }: PageProps<"/[lang]/takrorlash">) {
  const { lang } = await params;
  redirect(`/${lang}`);
}
