import type { L } from "@/lib/i18n";
import type { PersonaId } from "./types";

const l = (uz: string, ru: string): L => ({ uz, ru });

export type Persona = {
  id: PersonaId;
  name: L;
  role: L;
  bio: L;
  // avatar parametrlari
  look: {
    bg: string;
    skin: string;
    hair: string;
    style: "scarf" | "bun" | "cap" | "short" | "surgcap";
    outfit: string;
    coat: boolean;
    accent?: string;
    glasses?: boolean;
    beard?: boolean;
    stethoscope?: boolean;
  };
};

export const PERSONAS: Record<PersonaId, Persona> = {
  nigora: {
    id: "nigora",
    name: l("Nigora", "Нигора"),
    role: l("Bemor, 27 yosh", "Пациентка, 27 лет"),
    bio: l("Birinchi farzandini kutmoqda. Uning yo'li — butun kursning hikoyasi.", "Ждёт первого ребёнка. Её путь — сюжет всего курса."),
    look: { bg: "#FDE7EC", skin: "#F1C9A5", hair: "#3B2A20", style: "scarf", outfit: "#C2416B", coat: false, accent: "#E46A8E" },
  },
  dilnoza: {
    id: "dilnoza",
    name: l("Dr. Dilnoza Karimova", "Д-р Дилноза Каримова"),
    role: l("Akusher-ginekolog, bo'lim mudiri", "Акушер-гинеколог, заведующая отделением"),
    bio: l("25 yillik tajriba. Nazariyani tushuntiradi va qaror qabul qiladi.", "25 лет опыта. Объясняет теорию и принимает решения."),
    look: { bg: "#E3F0F4", skin: "#E8B992", hair: "#2B1D16", style: "bun", outfit: "#1D6E86", coat: true, glasses: true, stethoscope: true },
  },
  malika: {
    id: "malika",
    name: l("Malika opa", "Малика опа"),
    role: l("Katta akusherka", "Старшая акушерка"),
    bio: l("Tug'ruq zalining yuragi. Amaliy qadamlar va partogramma bo'yicha ustoz.", "Сердце родзала. Наставник по практическим шагам и партограмме."),
    look: { bg: "#E2F3EE", skin: "#EBC09B", hair: "#3A2418", style: "cap", outfit: "#2A9D8F", coat: false, accent: "#FFFFFF" },
  },
  jasur: {
    id: "jasur",
    name: l("Dr. Jasur Rahimov", "Д-р Жасур Рахимов"),
    role: l("Neonatolog", "Неонатолог"),
    bio: l("Chaqaloqlar bo'limi. Reanimatsiya bo'yicha jamoa lideri.", "Отделение новорождённых. Лидер команды по реанимации."),
    look: { bg: "#E6ECFA", skin: "#E3B48C", hair: "#1F1A17", style: "short", outfit: "#3B5BA9", coat: true, beard: true, stethoscope: true },
  },
  bekzod: {
    id: "bekzod",
    name: l("Dr. Bekzod Toshev", "Д-р Бекзод Тошев"),
    role: l("Anesteziolog-reanimatolog", "Анестезиолог-реаниматолог"),
    bio: l("Kesar kesish, sepsis va shok holatlarida yordamga keladi.", "Помогает при кесаревом сечении, сепсисе и шоке."),
    look: { bg: "#EEE8F7", skin: "#DDAA80", hair: "#221A15", style: "surgcap", outfit: "#5B4B8A", coat: false, accent: "#7C6BB3" },
  },
  sardor: {
    id: "sardor",
    name: l("Sardor", "Сардор"),
    role: l("Nigoraning turmush o'rtog'i", "Муж Нигоры"),
    bio: l("Oila bilan muloqot, rozilik va maslahat sahnalarida ishtirok etadi.", "Участвует в сценах общения с семьёй, согласия и консультирования."),
    look: { bg: "#F4EEDF", skin: "#E0AF86", hair: "#2A1F18", style: "short", outfit: "#8A6A3B", coat: false },
  },
};
