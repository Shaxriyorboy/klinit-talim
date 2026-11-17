// Tillar: uz = o'zbek (lotin), oz = o'zbek (kirill), ru = rus.
// "oz" kodi davlat saytlarida (gov.uz) kirill uchun ishlatiladi.
export const LOCALES = ["uz", "oz", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";

export const LOCALE_LABEL: Record<Locale, { short: string; long: string; htmlLang: string }> = {
  uz: { short: "Oʻz", long: "Oʻzbekcha", htmlLang: "uz-Latn" },
  oz: { short: "Ўз", long: "Ўзбекча", htmlLang: "uz-Cyrl" },
  ru: { short: "Ру", long: "Русский", htmlLang: "ru" },
};

export function isLocale(v: string): v is Locale {
  return (LOCALES as readonly string[]).includes(v);
}

/** Kontent faqat o'zbek (lotin) va rus tilida yoziladi; kirill avtomatik hosil qilinadi. */
export type L = { uz: string; ru: string };

export function tr(text: L, locale: Locale): string {
  if (locale === "ru") return text.ru;
  if (locale === "oz") return toCyrillic(text.uz);
  return text.uz;
}

// ---------------------------------------------------------------------------
// O'zbek lotin -> kirill transliteratsiyasi
// ---------------------------------------------------------------------------
const APOS = "['ʻʼ‘’`]";
const MULTI: Array<[RegExp, string]> = [
  [new RegExp(`O${APOS}`, "g"), "Ў"],
  [new RegExp(`o${APOS}`, "g"), "ў"],
  [new RegExp(`G${APOS}`, "g"), "Ғ"],
  [new RegExp(`g${APOS}`, "g"), "ғ"],
  [/SH/g, "Ш"],
  [/Sh/g, "Ш"],
  [/sh/g, "ш"],
  [/CH/g, "Ч"],
  [/Ch/g, "Ч"],
  [/ch/g, "ч"],
  [/YO/g, "Ё"],
  [/Yo/g, "Ё"],
  [/yo/g, "ё"],
  [/YU/g, "Ю"],
  [/Yu/g, "Ю"],
  [/yu/g, "ю"],
  [/YA/g, "Я"],
  [/Ya/g, "Я"],
  [/ya/g, "я"],
  [/YE/g, "Е"],
  [/Ye/g, "Е"],
  [/ye/g, "е"],
];

const SINGLE: Record<string, string> = {
  a: "а", b: "б", d: "д", e: "е", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж", k: "к",
  l: "л", m: "м", n: "н", o: "о", p: "п", q: "қ", r: "р", s: "с", t: "т", u: "у",
  v: "в", x: "х", y: "й", z: "з", c: "с", w: "в",
};

function translitWord(word: string): string {
  // So'z boshidagi "e" -> "э"
  let w = word.replace(/^E/, "Э").replace(/^e/, "э");
  for (const [re, rep] of MULTI) w = w.replace(re, rep);
  // tutuq belgisi (unli/undoshdan keyin) -> ъ
  w = w.replace(new RegExp(APOS, "g"), "ъ");
  let out = "";
  for (const ch of w) {
    const lower = ch.toLowerCase();
    const mapped = SINGLE[lower];
    if (mapped) out += ch === lower ? mapped : mapped.toUpperCase();
    else out += ch;
  }
  return out;
}

/** URL, raqam va lotin qisqartmalari ({{...}} ichidagilar) o'zgarmaydi. */
export function toCyrillic(text: string): string {
  return text
    .split(/(\{\{[^}]*\}\}|https?:\/\/\S+)/g)
    .map((part) => {
      if (part.startsWith("{{")) return part;
      if (/^https?:\/\//.test(part)) return part;
      return part.replace(/[A-Za-zʻʼ'‘’`]+/g, (m) => translitWord(m));
    })
    .join("");
}

/** {{...}} belgilari faqat transliteratsiyani to'xtatish uchun; ko'rsatishda olib tashlanadi. */
export function clean(text: string): string {
  return text.replace(/\{\{([^}]*)\}\}/g, "$1");
}

export function t(text: L, locale: Locale): string {
  return clean(tr(text, locale));
}

// Brauzerlarda o'zbekcha oy nomlari (uz-UZ) ko'pincha yo'q ("M11") — o'zimiz formatlaymiz.
const MONTHS: L[] = [
  { uz: "yanvar", ru: "января" },
  { uz: "fevral", ru: "февраля" },
  { uz: "mart", ru: "марта" },
  { uz: "aprel", ru: "апреля" },
  { uz: "may", ru: "мая" },
  { uz: "iyun", ru: "июня" },
  { uz: "iyul", ru: "июля" },
  { uz: "avgust", ru: "августа" },
  { uz: "sentabr", ru: "сентября" },
  { uz: "oktabr", ru: "октября" },
  { uz: "noyabr", ru: "ноября" },
  { uz: "dekabr", ru: "декабря" },
];

/** "18-noyabr" / "18 ноября" (withYear: "18-noyabr 2026") */
export function formatDate(d: Date | string, locale: Locale, withYear = false): string {
  const x = typeof d === "string" ? new Date(d) : d;
  const month = t(MONTHS[x.getMonth()], locale);
  const day = locale === "ru" ? `${x.getDate()} ${month}` : `${x.getDate()}-${month}`;
  return withYear ? `${day} ${x.getFullYear()}` : day;
}
