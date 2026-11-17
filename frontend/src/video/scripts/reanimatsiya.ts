import type { Source } from "@/content/types";
import type { VideoScript } from "../types";

// Manba: Milliy klinik protokol «РЕАНИМАЦИЯ И СТАБИЛИЗАЦИЯ НОВОРОЖДЕННЫХ В РОДИЛЬНОМ ЗАЛЕ» (№1337).
const l = (uz: string, ru: string) => ({ uz, ru });
const s = (page: number, section: string): Source => ({ protocolId: 1337, section, page });

const team = [
  { id: "malika" as const, x: 1500, pose: "listen" as const, facing: -1 as const },
  { id: "jasur" as const, x: 470, pose: "bag" as const },
];

export const reanimatsiyaVideo: VideoScript = {
  slug: "chaqaloq-reanimatsiyasi",
  protocolId: 1337,
  title: l("Tug'ruq zalida chaqaloq reanimatsiyasi", "Реанимация новорождённого в родзале"),
  subtitle: l("Oltin daqiqa va A–B–C–D bosqichlari", "Золотая минута и этапы A–B–C–D"),
  beats: [
    {
      speaker: "jasur",
      line: l(
        "Tug'ruqdan oldin to'rt savol: gestatsiya muddati, suv tiniqmi, qo'shimcha xavf omillari va kindikni qisish rejasi.",
        "До родов четыре вопроса: срок гестации, чистые ли воды, дополнительные факторы риска и план пережатия пуповины.",
      ),
      source: s(19, "Прогнозирование"),
      shot: {
        scene: "nicu",
        cast: [
          { id: "malika", x: 1010, pose: "clipboard", facing: -1 },
          { id: "jasur", x: 250, pose: "explain" },
        ],
        baby: { from: -1, to: -1 },
        cam: { from: [1.05, 960, 540], to: [1.12, 960, 520] },
        graphic: {
          kind: "list",
          title: l("Tug'ruqdan oldin 4 savol", "4 вопроса до родов"),
          items: [l("Gestatsiya muddati?", "Срок гестации?"), l("Suv tiniqmi?", "Воды чистые?"), l("Xavf omillari bormi?", "Есть факторы риска?"), l("Kindikni qisish rejasi?", "План пережатия пуповины?")],
          numbered: true,
        },
      },
    },
    {
      speaker: "jasur",
      line: l(
        "Chaqaloqlarning taxminan 85 foizi o'zi nafas oladi, 10 foizi boshlang'ich choralarga javob beradi, 5 foiziga ventilyatsiya kerak.",
        "Около 85% детей дышат сами, 10% отвечают на начальные меры, примерно 5% нужна вентиляция.",
      ),
      source: s(12, "Основные ключевые рекомендации"),
      shot: {
        scene: "studio",
        cast: [{ id: "jasur", x: 430, pose: "point" }],
        graphic: {
          kind: "bars",
          title: l("Qanchasiga yordam kerak", "Скольким нужна помощь"),
          bars: [
            { label: l("O'zi nafas oladi", "Дышат сами"), value: 85, text: "~85%" },
            { label: l("Boshlang'ich choralar", "Начальные меры"), value: 10, text: "~10%" },
            { label: l("Ventilyatsiya", "Вентиляция"), value: 5, text: "~5%" },
          ],
        },
      },
    },
    {
      speaker: "jasur",
      line: l(
        "Tug'ilgan zahoti: muddatidami, tonusi yaxshimi, nafas olyaptimi? Birortasiga «yo'q» bo'lsa — issiqlik manbai ostidagi stolga.",
        "Сразу после рождения: доношенный, хороший тонус, дышит? Хотя бы одно «нет» — на стол под источник тепла.",
      ),
      source: s(21, "Первичная оценка"),
      shot: {
        scene: "nicu",
        cast: team,
        baby: { from: 0, to: 0 },
        cam: { from: [1.2, 960, 560], to: [1.35, 960, 600] },
      },
    },
    {
      speaker: "jasur",
      line: l(
        "Oltin daqiqa — taxminan 60 soniya: isitish, quritish, boshni to'g'ri holatga keltirish, ehtiyotkor stimulyatsiya va baholash.",
        "Золотая минута — около 60 секунд: согреть, обсушить, правильно уложить голову, осторожно стимулировать и оценить.",
      ),
      source: s(21, "Первичная оценка"),
      shot: {
        scene: "studio",
        cast: [{ id: "jasur", x: 430, pose: "explain" }],
        graphic: {
          kind: "countdown",
          title: l("A bosqich · oltin daqiqa", "Этап A · золотая минута"),
          seconds: 60,
          items: [l("Isitish", "Согреть"), l("Quritish", "Обсушить"), l("Bosh holati", "Положение головы"), l("Stimulyatsiya", "Стимуляция"), l("Baholash", "Оценка")],
        },
      },
    },
    {
      speaker: "malika",
      line: l(
        "Chaqaloq harorati 36,5 dan 37,5 gacha bo'lishi kerak. Xona harorati — 23–25 daraja. Rutin so'rish tavsiya etilmaydi.",
        "Температура ребёнка — от 36,5 до 37,5. В помещении — 23–25 градусов. Рутинная санация не рекомендуется.",
      ),
      source: s(17, "Термоконтроль"),
      shot: {
        scene: "studio",
        cast: [{ id: "malika", x: 430, pose: "explain" }],
        graphic: {
          kind: "thresholds",
          title: l("Issiqlik", "Тепло"),
          rows: [
            { label: l("Chaqaloq", "Ребёнок"), value: l("36,5–37,5 °C", "36,5–37,5 °C") },
            { label: l("Tug'ruq zali", "Родзал"), value: l("23–25 °C", "23–25 °C") },
            { label: l("≤ 28 hafta", "≤ 28 нед"), value: l("> 25 °C", "> 25 °C") },
            { label: l("Rutin so'rish", "Рутинная санация"), value: l("Tavsiya etilmaydi", "Не рекомендуется"), bad: true },
          ],
        },
      },
    },
    {
      speaker: "jasur",
      line: l(
        "Nafas yo'q yoki yurak urishi 100 dan past — musbat bosimli ventilyatsiya: daqiqasiga 40–60 marta, bosim 20 santimetrdan boshlanadi.",
        "Нет дыхания или ЧСС ниже 100 — вентиляция под положительным давлением: 40–60 в минуту, давление начинают с 20 см.",
      ),
      source: s(27, "Проведение PPV"),
      shot: {
        scene: "nicu",
        cast: [
          { id: "malika", x: 1010, pose: "listen", facing: -1 },
          { id: "jasur", x: 250, pose: "bag" },
        ],
        baby: { from: 0, to: 0.25 },
        cam: { from: [1.15, 960, 560], to: [1.3, 900, 600] },
        graphic: { kind: "rhythm", title: l("B bosqich · ventilyatsiya", "Этап B · вентиляция"), pattern: [l("Nafas", "Вдох"), l("ikki", "два"), l("uch", "три")], caption: l("40–60 /daq · {{PIP}} 20 sm suv ust.", "40–60 /мин · PIP 20 см вод. ст.") },
      },
    },
    {
      speaker: "jasur",
      line: l(
        "Saturatsiya maqsadi: 2-daqiqada 65, 5-daqiqada 85, 10-daqiqada 90 foiz. Datchik o'ng bilakka qo'yiladi.",
        "Целевая сатурация: на 2-й минуте 65, на 5-й — 85, на 10-й — 90 процентов. Датчик — на правое предплечье.",
      ),
      source: s(24, "Таблица 2"),
      shot: {
        scene: "studio",
        cast: [{ id: "jasur", x: 430, pose: "point" }],
        graphic: {
          kind: "chart",
          title: l("Preduktal {{SpO2}} maqsadi", "Целевая преддуктальная SpO2"),
          xLabel: l("daqiqa", "минута"),
          yLabel: l("%", "%"),
          points: [
            { x: 2, y: 65, label: "65%" },
            { x: 5, y: 85, label: "85%" },
            { x: 10, y: 90, label: "90%" },
          ],
          xMax: 10,
          yMin: 50,
          yMax: 100,
        },
      },
    },
    {
      speaker: "malika",
      line: l(
        "Ko'krak qafasi ko'tarilmasa — uch sabab: niqob zich emas, nafas yo'li to'silgan yoki bosim yetarli emas.",
        "Если грудная клетка не поднимается — три причины: маска неплотно, пути заблокированы или давление недостаточно.",
      ),
      source: s(28, "МР СОДИ"),
      shot: {
        scene: "nicu",
        cast: [
          { id: "malika", x: 1010, pose: "point", facing: -1 },
          { id: "jasur", x: 250, pose: "bag" },
        ],
        baby: { from: 0.25, to: 0.3 },
        cam: { from: [1.1, 960, 540], to: [1.1, 960, 540] },
        graphic: {
          kind: "list",
          title: l("Ventilyatsiya samarasiz bo'lsa", "Если вентиляция неэффективна"),
          items: [l("Niqobni qayta qo'yish", "Переустановить маску"), l("Bosh holatini tuzatish, og'izni tekshirish", "Исправить положение головы, проверить рот"), l("Bosimni asta oshirish", "Постепенно повысить давление")],
          numbered: true,
        },
      },
    },
    {
      speaker: "jasur",
      line: l(
        "30 soniyadan keyin baholaymiz. 100 va undan yuqori — yaxshi. 60–100 — ventilyatsiya davom etadi. 60 dan past — yurak massaji.",
        "Через 30 секунд оцениваем. 100 и выше — хорошо. 60–100 — продолжаем ИВЛ. Ниже 60 — непрямой массаж сердца.",
      ),
      source: s(30, "Этап «В»"),
      shot: {
        scene: "studio",
        cast: [{ id: "jasur", x: 430, pose: "explain" }],
        graphic: {
          kind: "branches",
          title: l("30 soniyadan keyin", "Через 30 секунд"),
          root: l("Yurak urishi", "ЧСС"),
          branches: [
            { when: l("≥ 100", "≥ 100"), then: l("Ventilyatsiyani kamaytirish", "Снижать ИВЛ"), tone: "ok" },
            { when: l("60–100", "60–100"), then: l("Davom ettirish, intubatsiyaga tayyorlanish", "Продолжать, готовить интубацию"), tone: "warn" },
            { when: l("< 60", "< 60"), then: l("Yurak massaji (C)", "Массаж сердца (C)"), tone: "bad" },
          ],
        },
      },
    },
    {
      speaker: "jasur",
      line: l(
        "Massaj: ikki bosh barmoq, to'sh suyagining pastki uchdan biri, chuqurligi — ko'krakning uchdan biri. Uch bosish, bir nafas.",
        "Массаж: два больших пальца, нижняя треть грудины, глубина — треть грудной клетки. Три нажатия — один вдох.",
      ),
      source: s(34, "Этап «С»"),
      shot: {
        scene: "nicu",
        cast: [
          { id: "malika", x: 1010, pose: "bag", facing: -1 },
          { id: "jasur", x: 250, pose: "compress" },
        ],
        baby: { from: 0.3, to: 0.45 },
        cam: { from: [1.25, 960, 600], to: [1.4, 960, 620] },
        graphic: { kind: "rhythm", title: l("C bosqich · 3 : 1", "Этап C · 3 : 1"), pattern: [l("Bir", "Раз"), l("ikki", "два"), l("uch", "три"), l("Nafas", "Вдох")], caption: l("90 bosish + 30 nafas / daqiqa · kislorod 100%", "90 нажатий + 30 вдохов / мин · кислород 100%") },
      },
    },
    {
      speaker: "jasur",
      line: l(
        "Yurak urishi 60 dan past qolsa — adrenalin: vena ichiga 0,2 ml/kg, 1:10 000 eritmada. Kerak bo'lsa 3–5 daqiqadan keyin takrorlanadi.",
        "Если ЧСС остаётся ниже 60 — адреналин: в/в 0,2 мл/кг раствора 1:10 000. При необходимости повтор через 3–5 минут.",
      ),
      source: s(35, "Этап «D»"),
      shot: {
        scene: "studio",
        cast: [{ id: "jasur", x: 430, pose: "clipboard" }],
        graphic: { kind: "bigStat", value: l("0,2 ml/kg", "0,2 мл/кг"), caption: l("Adrenalin 1:10 000 v/i · takror 3–5 daqiqada", "Адреналин 1:10 000 в/в · повтор через 3–5 мин"), tone: "bad" },
      },
    },
    {
      speaker: "malika",
      line: l(
        "Yurak urishi 100 dan oshdi, chaqaloq o'zi nafas olyapti! Endi ventilyatsiyani asta kamaytiramiz va intensiv terapiyaga o'tkazamiz.",
        "ЧСС больше 100, ребёнок дышит сам! Постепенно снижаем вентиляцию и переводим в отделение интенсивной терапии.",
      ),
      source: s(34, "Этап «С»"),
      shot: {
        scene: "nicu",
        cast: [
          { id: "malika", x: 1010, pose: "wave", facing: -1 },
          { id: "jasur", x: 250, pose: "explain" },
        ],
        baby: { from: 0.55, to: 1 },
        cam: { from: [1.35, 960, 620], to: [1.12, 960, 560] },
        graphic: { kind: "monitor", title: l("Chaqaloq YuUCh", "ЧСС ребёнка"), unit: "/min", from: 88, to: 132, low: 100, high: 180, wave: "ecg" },
      },
    },
  ],
};
