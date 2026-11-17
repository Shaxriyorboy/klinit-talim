import type { Source } from "@/content/types";
import type { VideoScript } from "../types";

// Manba: Milliy klinik protokol «ПАРТОГРАММА» (№795). Har bir faktli jumla — protokol sahifasiga havola.
const l = (uz: string, ru: string) => ({ uz, ru });
const s = (page: number, section: string): Source => ({ protocolId: 795, section, page });

// Ovoz uchun o'qiladigan matn (sahna raqami → matn): raqam, rim raqami va qisqartmalar so'z bilan yozilgan,
// aks holda sintezator (ElevenLabs) ularni noto'g'ri o'qiydi. Subtitrda asl `line` qoladi.
const SAY: Record<number, ReturnType<typeof l>> = {
  4: l(
    "To'ldirish faol fazadan boshlanadi: bachadon bo'yni besh santimetr va undan ko'p ochilganda. Latent fazada ham kuzatuv majburiy.",
    "Заполнение начинают с активной фазы: раскрытие шейки матки пять сантиметров и более. В латентной фазе мониторинг тоже обязателен.",
  ),
  7: l(
    "Homila yurak urishi: me'yor bir yuz o'ndan bir yuz ellik to'qqizgacha. Birinchi davrda har o'ttiz daqiqada, ikkinchi davrda har besh daqiqada tinglaymiz.",
    "Частота сердцебиения плода: норма от ста десяти до ста пятидесяти девяти. В первом периоде — каждые тридцать минут, во втором — каждые пять минут.",
  ),
  8: l(
    "Homila yurak urishi bir yuz o'ndan past yoki bir yuz oltmish va undan yuqori bo'lsa — ayolni chap yonboshga yotqizing, katta shifokorga xabar bering.",
    "Если частота сердцебиения плода ниже ста десяти или сто шестьдесят и выше — уложите женщину на левый бок и сообщите старшему врачу.",
  ),
  9: l(
    "Ona uchun kritik chegaralar: puls oltmishdan past yoki bir yuz yigirmadan yuqori, sistolik bosim bir yuz qirq, diastolik to'qson, harorat o'ttiz yetti yarim.",
    "Критические пороги для матери: пульс ниже шестидесяти или от ста двадцати, систолическое давление сто сорок, диастолическое девяносто, температура тридцать семь и пять.",
  ),
  10: l(
    "To'lg'oqlar: o'n daqiqada uchtadan beshtagacha — me'yor. Ikkita va undan kam yoki beshtadan ko'p bo'lsa, qayta sanaymiz va xabar beramiz.",
    "Схватки: от трёх до пяти за десять минут — норма. Две и меньше или больше пяти — пересчитываем и сообщаем.",
  ),
  11: l(
    "Ochilish to'xtab qolsa, vaqt chegarasi bor: besh santimetrda olti soat, oltida besh, yettida uch, sakkizda ikki yarim va to'qqiz santimetrda ikki soat.",
    "Если раскрытие не меняется, есть порог времени: при пяти сантиметрах — шесть часов, при шести — пять, при семи — три, при восьми — два с половиной, при девяти сантиметрах — два часа.",
  ),
  12: l(
    "Ikkinchi davr birinchi tug'ruqda uch soatdan, qayta tug'ruqda ikki soatdan oshsa — chora ko'riladi.",
    "Если второй период длится у нерожавших три часа и более, у повторнородящих — два часа, нужно принимать меры.",
  ),
  13: l(
    "Har bir qaror ayol bilan birga qabul qilinadi. Ayolning ishtiroki — partogrammaning yettinchi bo'limi.",
    "Каждое решение принимается вместе с женщиной. Участие женщины — это седьмой раздел партограммы.",
  ),
};

const base: VideoScript = {
  slug: "partogramma",
  protocolId: 795,
  title: l("Partogramma va normal tug'ruq", "Партограмма и нормальные роды"),
  subtitle: l("JSST 2022 partogrammasi bo'yicha qisqa qo'llanma", "Краткое руководство по партограмме ВОЗ 2022"),
  beats: [
    {
      speaker: "nigora",
      line: l("Opa, to'lg'oqlar kuchaydi… Endi nima bo'ladi?", "Сестра, схватки усилились… Что теперь будет?"),
      fallback: {
        speaker: "malika",
        line: l("Tug'ruq zaliga yangi bemor keldi, to'lg'oqlar kuchaygan. Bugun partogrammani qanday yuritishni ko'rib chiqamiz.", "В родзал поступила роженица, схватки усилились. Сегодня разберём, как вести партограмму."),
      },
      shot: {
        scene: "delivery",
        cast: [
          { id: "nigora", x: 1240, inBed: true, facing: -1 },
          { id: "malika", x: 640, pose: "listen" },
        ],
        cam: { from: [1.15, 1000, 560], to: [1.25, 1050, 540] },
      },
    },
    {
      speaker: "malika",
      line: l(
        "Tug'ruqni partogramma bilan kuzatamiz — ona va chaqaloqning holatini grafikda yozib boramiz.",
        "Мы ведём роды по партограмме — записываем состояние матери и малыша на графике.",
      ),
      shot: {
        scene: "delivery",
        cast: [
          { id: "nigora", x: 1240, inBed: true, facing: -1 },
          { id: "malika", x: 640, pose: "explain" },
        ],
        cam: { from: [1.25, 760, 520], to: [1.35, 720, 500] },
      },
    },
    {
      speaker: "dilnoza",
      line: l(
        "Partogramma — tug'ruqni grafik tasvirlash usuli. U shifokorning klinik qarorini almashtirmaydi, balki unga yordam beradi.",
        "Партограмма — способ графического описания родов. Она не заменяет клиническое решение врача, а помогает ему.",
      ),
      source: s(8, "2.2"),
      shot: {
        scene: "studio",
        cast: [{ id: "dilnoza", x: 430, pose: "point" }],
        graphic: { kind: "partogram", title: l("Partogramma", "Партограмма"), caption: l("Tug'ruqning grafik tasviri", "Графическое описание родов") },
      },
    },
    {
      speaker: "dilnoza",
      line: l(
        "To'ldirish faol fazadan boshlanadi: bachadon bo'yni 5 santimetr va undan ko'p ochilganda. Latent fazada ham kuzatuv majburiy.",
        "Заполнение начинают с активной фазы: раскрытие шейки матки 5 см и более. В латентной фазе мониторинг тоже обязателен.",
      ),
      source: s(9, "2.4"),
      shot: {
        scene: "studio",
        cast: [{ id: "dilnoza", x: 430, pose: "explain" }],
        graphic: { kind: "cervix", title: l("Qachon boshlanadi", "Когда начинать"), cm: 5, caption: l("Faol faza: ochilish ≥ 5 sm", "Активная фаза: раскрытие ≥ 5 см") },
      },
    },
    {
      speaker: "malika",
      line: l(
        "Har bir baholashda to'rt qadam: baholash, yozish, kritik qiymat bilan tekshirish va ayol bilan birga rejalashtirish.",
        "На каждой оценке четыре шага: оценить, записать, сверить с порогом и вместе с женщиной спланировать.",
      ),
      source: s(10, "2.5"),
      shot: {
        scene: "studio",
        cast: [{ id: "malika", x: 430, pose: "explain" }],
        graphic: {
          kind: "cycle",
          title: l("To'rt qadam", "Четыре шага"),
          steps: [l("Baholash", "Оцени"), l("Yozish", "Запиши"), l("Tekshirish", "Проверь"), l("Rejalashtirish", "Запланируй")],
        },
      },
    },
    {
      speaker: "malika",
      line: l(
        "Har soatda qo'llab-quvvatlovchi parvarish: hamroh, og'riqsizlantirish, suyuqlik va holat. Chalqancha yotish — kritik belgi.",
        "Каждый час — поддерживающий уход: сопровождающий, обезболивание, жидкость и положение. Положение на спине — критично.",
      ),
      source: s(14, "2.9"),
      shot: {
        scene: "delivery",
        cast: [
          { id: "sardor", x: 1030, pose: "listen", facing: -1 },
          { id: "nigora", x: 660, inBed: true, facing: -1 },
          { id: "malika", x: 170, pose: "clipboard" },
        ],
        cam: { from: [1.0, 960, 540], to: [1.06, 960, 540] },
        graphic: {
          kind: "list",
          title: l("2-bo'lim · har soatda", "Раздел 2 · каждый час"),
          items: [l("Hamroh", "Сопровождающий"), l("Og'riqsizlantirish", "Обезболивание"), l("Suyuqlik ichish", "Приём жидкости"), l("Holat: chalqancha — kritik", "Положение: на спине — критично")],
          critical: [3],
        },
      },
    },
    {
      speaker: "malika",
      line: l(
        "Homila yurak urishi: me'yor 110 dan 159 gacha. {{I}} davrda har 30 daqiqada, {{II}} davrda har 5 daqiqada tinglaymiz.",
        "ЧСС плода: норма от 110 до 159. В I периоде — каждые 30 минут, во II — каждые 5 минут.",
      ),
      source: s(15, "2.10"),
      shot: {
        scene: "studio",
        cast: [{ id: "malika", x: 430, pose: "point" }],
        graphic: { kind: "monitor", title: l("Homila YuUCh", "ЧСС плода"), unit: "/min", from: 138, to: 142, low: 110, high: 159, wave: "fhr" },
      },
    },
    {
      speaker: "dilnoza",
      line: l(
        "YuUCh 110 dan past yoki 160 va undan yuqori bo'lsa — ayolni chap yonboshga yotqizing, katta shifokorga xabar bering.",
        "Если ЧСС ниже 110 или 160 и выше — уложите женщину на левый бок и сообщите старшему врачу.",
      ),
      source: s(15, "2.10"),
      shot: {
        scene: "studio",
        cast: [{ id: "dilnoza", x: 430, pose: "explain" }],
        graphic: {
          kind: "monitor",
          title: l("Homila YuUCh", "ЧСС плода"),
          unit: "/min",
          from: 136,
          to: 102,
          low: 110,
          high: 159,
          wave: "fhr",
          note: l("Chap yonbosh · katta shifokor", "Левый бок · старший врач"),
        },
      },
    },
    {
      speaker: "dilnoza",
      line: l(
        "Ona uchun kritik chegaralar: puls 60 dan past yoki 120 dan yuqori, sistolik bosim 140, diastolik 90, harorat 37,5.",
        "Критические пороги для матери: пульс ниже 60 или от 120, САД 140, ДАД 90, температура 37,5.",
      ),
      source: s(19, "2.11"),
      shot: {
        scene: "studio",
        cast: [{ id: "dilnoza", x: 430, pose: "clipboard" }],
        graphic: {
          kind: "thresholds",
          title: l("Ona: kritik qiymatlar", "Мать: критические значения"),
          rows: [
            { label: l("Puls", "Пульс"), value: l("< 60 yoki ≥ 120", "< 60 или ≥ 120"), bad: true },
            { label: l("Sistolik bosim", "САД"), value: l("< 80 yoki ≥ 140", "< 80 или ≥ 140"), bad: true },
            { label: l("Diastolik bosim", "ДАД"), value: l("≥ 90", "≥ 90"), bad: true },
            { label: l("Harorat", "Температура"), value: l("< 35,0 yoki ≥ 37,5 °C", "< 35,0 или ≥ 37,5 °C"), bad: true },
          ],
        },
      },
    },
    {
      speaker: "malika",
      line: l(
        "To'lg'oqlar: 10 daqiqada 3 tadan 5 tagacha — me'yor. 2 ta va kam yoki 5 tadan ko'p bo'lsa, qayta sanaymiz va xabar beramiz.",
        "Схватки: 3–5 за 10 минут — норма. Две и меньше или больше пяти — пересчитываем и сообщаем.",
      ),
      source: s(22, "2.12"),
      shot: {
        scene: "studio",
        cast: [{ id: "malika", x: 430, pose: "explain" }],
        graphic: { kind: "contractions", title: l("10 daqiqada to'lg'oqlar", "Схватки за 10 минут"), count: 3, caption: l("Me'yor: 3–5 · Kritik: ≤ 2 yoki > 5", "Норма: 3–5 · Критично: ≤ 2 или > 5") },
      },
    },
    {
      speaker: "dilnoza",
      line: l(
        "Ochilish to'xtab qolsa, vaqt chegarasi bor: 5 santimetrda 6 soat, 6 da 5, 7 da 3, 8 da 2,5 va 9 santimetrda 2 soat.",
        "Если раскрытие не меняется, есть порог времени: 5 см — 6 ч, 6 — 5 ч, 7 — 3 ч, 8 — 2,5 ч, 9 см — 2 ч.",
      ),
      source: s(23, "2.12"),
      shot: {
        scene: "studio",
        cast: [{ id: "dilnoza", x: 430, pose: "point" }],
        graphic: {
          kind: "thresholds",
          title: l("Ochilish o'zgarmasa — kritik vaqt", "Без динамики раскрытия — порог"),
          rows: [
            { label: l("5 sm", "5 см"), value: l("≥ 6 soat", "≥ 6 ч") },
            { label: l("6 sm", "6 см"), value: l("≥ 5 soat", "≥ 5 ч") },
            { label: l("7 sm", "7 см"), value: l("≥ 3 soat", "≥ 3 ч") },
            { label: l("8 sm", "8 см"), value: l("≥ 2,5 soat", "≥ 2,5 ч") },
            { label: l("9 sm", "9 см"), value: l("≥ 2 soat", "≥ 2 ч") },
          ],
        },
      },
    },
    {
      speaker: "dilnoza",
      line: l(
        "{{II}} davr birinchi tug'ruqda 3 soatdan, qayta tug'ruqda 2 soatdan oshsa — chora ko'riladi.",
        "Если II период длится у нерожавших 3 часа и более, у повторнородящих — 2 часа, нужно принимать меры.",
      ),
      source: s(23, "2.12"),
      shot: {
        scene: "studio",
        cast: [{ id: "dilnoza", x: 430, pose: "explain" }],
        graphic: {
          kind: "bars",
          title: l("{{II}} davr: kritik davomiylik", "II период: критическая длительность"),
          bars: [
            { label: l("Birinchi tug'ruq", "Нерожавшие"), value: 3, text: "≥ 3" },
            { label: l("Qayta tug'ruq", "Повторнородящие"), value: 2, text: "≥ 2" },
          ],
        },
      },
    },
    {
      speaker: "malika",
      line: l(
        "Har bir qaror ayol bilan birga qabul qilinadi. Ayolning ishtiroki — partogrammaning 7-bo'limi.",
        "Каждое решение принимается вместе с женщиной. Участие женщины — это раздел 7 партограммы.",
      ),
      source: s(26, "2.14"),
      shot: {
        scene: "delivery",
        cast: [
          { id: "nigora", x: 1240, inBed: true, facing: -1 },
          { id: "malika", x: 700, pose: "explain" },
        ],
        cam: { from: [1.3, 980, 520], to: [1.18, 960, 540] },
      },
    },
  ],
};

export const partogrammaVideo: VideoScript = { ...base, beats: base.beats.map((b, i) => (SAY[i + 1] ? { ...b, say: SAY[i + 1] } : b)) };
