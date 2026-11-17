import type { Source } from "@/content/types";
import type { VideoScript } from "../types";

// Manba: Milliy klinik protokol «ВЕДЕНИЕ НОРМАЛЬНОГО ПОСЛЕРОДОВОГО ПЕРИОДА» (№800).
const l = (uz: string, ru: string) => ({ uz, ru });
const s = (page: number, section: string): Source => ({ protocolId: 800, section, page });

export const tugruqdanKeyinVideo: VideoScript = {
  slug: "tugruqdan-keyingi-davr",
  protocolId: 800,
  title: l("Normal tug'ruqdan keyingi davr", "Нормальный послеродовый период"),
  subtitle: l("Birinchi soatlardan 42-kungacha", "От первых часов до 42-го дня"),
  beats: [
    {
      speaker: "nigora",
      line: l("Opa, qorin pastida vaqti-vaqti bilan og'riq bo'lyapti. Bu normalmi?", "Опа, внизу живота периодически болит. Это нормально?"),
      fallback: {
        speaker: "malika",
        line: l("Tug'ruqdan keyin ayollar ko'pincha qorin pastidagi davriy og'riqdan xavotirlanadi. Bu normalmi?", "После родов женщин часто беспокоят периодические боли внизу живота. Это нормально?"),
      },
      shot: {
        scene: "ward",
        cast: [
          { id: "nigora", x: 1180, inBed: true, facing: -1, sink: 130 },
          { id: "malika", x: 560, pose: "listen" },
        ],
        cam: { from: [1.2, 1000, 540], to: [1.3, 1040, 520] },
      },
    },
    {
      speaker: "malika",
      line: l(
        "Ha, bachadon qisqaryapti — bu tabiiy. Birinchi kunlarda holsizlik va oraliqdagi og'riq ham uchrashi mumkin.",
        "Да, матка сокращается — это естественно. В первые дни также бывают слабость и боль в промежности.",
      ),
      source: s(9, "2.4"),
      shot: {
        scene: "ward",
        cast: [
          { id: "nigora", x: 1180, inBed: true, facing: -1, sink: 130 },
          { id: "malika", x: 560, pose: "explain" },
        ],
        cam: { from: [1.3, 760, 520], to: [1.2, 820, 540] },
      },
    },
    {
      speaker: "dilnoza",
      line: l(
        "Tug'ruqdan keyingi davr — 42 kun. Erta davr — birinchi 24 soat: eng jiddiy asoratlar aynan shu vaqtda ko'proq uchraydi.",
        "Послеродовый период — 42 дня. Ранний — первые 24 часа: именно тогда наиболее вероятны серьёзные осложнения.",
      ),
      source: s(8, "2.3"),
      shot: {
        scene: "studio",
        cast: [{ id: "dilnoza", x: 430, pose: "point" }],
        graphic: {
          kind: "timeline",
          title: l("Tug'ruqdan keyingi davr", "Послеродовый период"),
          max: 42,
          unit: l("kun", "дн."),
          points: [
            { at: 0, label: l("Tug'ruq", "Роды") },
            { at: 1, label: l("Erta: 24 soat", "Ранний: 24 ч"), color: "#b3261e" },
            { at: 42, label: l("42-kun", "42-й день"), sub: l("Kech davr oxiri", "Конец позднего") },
          ],
        },
      },
    },
    {
      speaker: "dilnoza",
      line: l(
        "Bachadon tubi: tug'ruqdan so'ng kindikdan 1–2 barmoq pastda, 1-sutka oxirida kindik sathida, 10-sutkada qov sathida.",
        "Дно матки: сразу после родов на 1–2 пальца ниже пупка, к концу 1-х суток — на уровне пупка, к 10-м — на уровне лона.",
      ),
      source: s(8, "2.2"),
      shot: {
        scene: "studio",
        cast: [{ id: "dilnoza", x: 430, pose: "explain" }],
        graphic: {
          kind: "uterus",
          title: l("Bachadon involyutsiyasi", "Инволюция матки"),
          marks: [
            { day: l("0", "0"), level: 0.38, label: l("Kindikdan 1–2 barmoq pastda", "На 1–2 пальца ниже пупка") },
            { day: l("1", "1"), level: 0.3, label: l("Kindik sathida", "На уровне пупка") },
            { day: l("10", "10"), level: 0.78, label: l("Qov sathida", "На уровне лона") },
          ],
        },
      },
    },
    {
      speaker: "malika",
      line: l(
        "Loxiyalar: dastlabki 2–3 kun qonli, 3–4-kunlarda qonli-seroz, bir haftadan keyin shilliqli bo'ladi.",
        "Лохии: первые 2–3 дня кровяные, на 3–4-е сутки кровянисто-серозные, через неделю — слизистые.",
      ),
      source: s(8, "2.2"),
      shot: {
        scene: "studio",
        cast: [{ id: "malika", x: 430, pose: "explain" }],
        graphic: {
          kind: "timeline",
          title: l("Loxiyalar", "Лохии"),
          max: 10,
          unit: l("kun", "дн."),
          points: [
            { at: 1.5, label: l("Qonli", "Кровяные"), sub: l("{{rubra}} · 2–3 kun", "rubra · 2–3 дня"), color: "#a3292b" },
            { at: 3.5, label: l("Qonli-seroz", "Кровянисто-серозные"), sub: l("{{serosa}} · 3–4-kun", "serosa · 3–4 сут"), color: "#c77b5b" },
            { at: 8, label: l("Shilliqli", "Слизистые"), sub: l("{{alba}} · 1 haftadan keyin", "alba · через неделю"), color: "#c9b98f" },
          ],
        },
      },
    },
    {
      speaker: "malika",
      line: l(
        "Birinchi 2 soat — har 15 daqiqada ko'rik, keyin 2 soat — har 30 daqiqada, 4 soat — har soatda, 16 soat — har 4 soatda.",
        "Первые 2 часа — осмотр каждые 15 минут, затем 2 часа — каждые 30 минут, 4 часа — каждый час, 16 часов — каждые 4 часа.",
      ),
      source: s(10, "2.4"),
      shot: {
        scene: "ward",
        cast: [
          { id: "nigora", x: 700, inBed: true, facing: -1, sink: 130 },
          { id: "malika", x: 220, pose: "clipboard" },
        ],
        cam: { from: [1.0, 960, 540], to: [1.05, 960, 540] },
        graphic: {
          kind: "thresholds",
          title: l("Erta davr: ko'rik jadvali", "Ранний период: график осмотров"),
          rows: [
            { label: l("Dastlabki 2 soat", "Первые 2 ч"), value: l("har 15 daqiqa", "каждые 15 мин") },
            { label: l("Keyingi 2 soat", "Следующие 2 ч"), value: l("har 30 daqiqa", "каждые 30 мин") },
            { label: l("Keyingi 4 soat", "Следующие 4 ч"), value: l("har soat", "каждый час") },
            { label: l("Keyingi 16 soat", "Следующие 16 ч"), value: l("har 4 soat", "каждые 4 ч") },
          ],
        },
      },
    },
    {
      speaker: "dilnoza",
      line: l(
        "Har ko'rikda: qon ketish, bachadon tonusi, tubi balandligi, harorat va puls. Bosim 6 soat ichida qayta o'lchanadi, siydik chiqarish 6 soat ichida qayd etiladi.",
        "На каждом осмотре: кровотечение, тонус матки, высота дна, температура и пульс. АД повторно — в течение 6 часов, мочеиспускание фиксируют в течение 6 часов.",
      ),
      source: s(10, "2.4"),
      shot: {
        scene: "studio",
        cast: [{ id: "dilnoza", x: 430, pose: "point" }],
        graphic: {
          kind: "list",
          title: l("Har bir ko'rikda", "На каждом осмотре"),
          items: [l("Qindan qon ketish", "Вагинальное кровотечение"), l("Bachadon tonusi va tubi", "Тонус и дно матки"), l("Harorat va puls", "Температура и пульс"), l("Bosim · siydik — 6 soat ichida", "АД · мочеиспускание — в течение 6 ч")],
        },
      },
    },
    {
      speaker: "dilnoza",
      line: l(
        "«Baby-blues» odatda 2–3-kunda boshlanib, 2 hafta ichida o'tadi. Ayoldan kayfiyatini albatta so'rang.",
        "«Бэби-блюз» обычно начинается на 2–3-й день и проходит в течение двух недель. Обязательно спрашивайте о настроении.",
      ),
      source: s(7, "2.1"),
      shot: {
        scene: "ward",
        cast: [
          { id: "nigora", x: 1180, inBed: true, facing: -1, sink: 130 },
          { id: "dilnoza", x: 560, pose: "listen" },
        ],
        cam: { from: [1.25, 980, 520], to: [1.32, 1000, 520] },
      },
    },
    {
      speaker: "malika",
      line: l(
        "Laktostazda umumiy ahvol buzilmaydi, sut erkin chiqadi va sog'ishdan keyin yengillik bo'ladi. Mastitdan farqi shu.",
        "При лактостазе самочувствие не нарушено, молоко выделяется свободно, после сцеживания облегчение. В этом отличие от мастита.",
      ),
      source: s(10, "2.4"),
      shot: {
        scene: "studio",
        cast: [{ id: "malika", x: 430, pose: "explain" }],
        graphic: {
          kind: "compare",
          title: l("Laktostaz", "Лактостаз"),
          left: { title: l("Laktostazda", "При лактостазе"), items: [l("Umumiy ahvol yaxshi", "Самочувствие не нарушено"), l("Harorat normal yoki subfebril", "Температура нормальная или субфебрильная"), l("Sut erkin chiqadi", "Молоко выделяется свободно"), l("Sog'ishdan keyin yengillik", "Облегчение после сцеживания")] },
          right: { title: l("Qon tahlili", "Анализ крови"), items: [l("Me'yor doirasida", "В пределах нормы")] },
        },
      },
    },
    {
      speaker: "dilnoza",
      line: l(
        "Rutin bimanual tekshiruv, rutin qon va siydik tahlili hamda rutin UTT tavsiya etilmaydi — faqat ko'rsatma bo'yicha.",
        "Рутинное бимануальное исследование, рутинные анализы крови и мочи и рутинное УЗИ не рекомендуются — только по показаниям.",
      ),
      source: s(11, "2.4"),
      shot: {
        scene: "studio",
        cast: [{ id: "dilnoza", x: 430, pose: "explain" }],
        graphic: {
          kind: "list",
          title: l("Rutin emas — ko'rsatma bo'yicha", "Не рутинно — по показаниям"),
          items: [l("Bimanual tekshiruv", "Бимануальное исследование"), l("Qon va siydik tahlili", "Анализы крови и мочи"), l("Kichik chanoq UTT", "УЗИ малого таза")],
          critical: [0, 1, 2],
        },
      },
    },
    {
      speaker: "malika",
      line: l(
        "Kech davrda akusher-ginekolog kuniga bir marta, akusherka esa kuniga ikki marta ko'rikdan o'tkazadi.",
        "В позднем периоде акушер-гинеколог осматривает раз в день, а акушерка — дважды в день.",
      ),
      source: s(10, "2.4"),
      shot: {
        scene: "ward",
        cast: [
          { id: "nigora", x: 1180, inBed: true, facing: -1, sink: 130 },
          { id: "malika", x: 600, pose: "wave" },
        ],
        cam: { from: [1.3, 980, 520], to: [1.12, 960, 540] },
      },
    },
  ],
};
