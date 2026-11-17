# Klinik protokollar bo'yicha o'quv platformasi — tadqiqot va reja

> Buyurtmachi: Klinik audit inspeksiyasi · Auditoriya: tibbiy xodimlar (25+ yosh) · Manba: faqat https://www.clinical-protocols.uz/
> Sana: 2026-11-17 · Holat: frontend + backend lokal ishlaydi (demo: 3 modul); qolgan 11 modul kontenti navbatda

---

## 0. Asosiy qoida (o'zgarmas)

**Platformada faqat clinical-protocols.uz dagi tasdiqlangan protokollar o'rgatiladi.** Har bir kartochka, video ssenariy va test savoli aniq manbaga bog'lanadi: `protokol ID + bo'lim raqami` (masalan: *Protokol №795, 2.8-bo'lim*). Manbasiz kontent bazaga kirmaydi. O'quvchi ham har bir dars ostida "Manba"ni ko'radi — bu inspeksiya uchun ham ishonch beradi.

**Har bir mavzuda "To'liq ma'lumot" havolasi:** modul sahifasida protokol va standartga to'liq havola; har bir kartochka va savol ostida esa protokol PDF ning aniq sahifasiga havola (`/protocol/{id}/view-pdf#page=N`).

**Tillar:** rus, o'zbek (lotin), o'zbek (kirill). Kontent lotin va rus tilida yoziladi, kirill avtomatik transliteratsiya qilinadi (`{{...}}` ichidagi lotin qisqartmalar o'zgarmaydi).

---

## 1. Saytni tahlil qilish natijalari

| Nima | Topilgan narsa |
|---|---|
| Hajm | ~725 hujjat, 61 sahifa katalog |
| Til | faqat rus tili |
| Guruhlash | Alohida "mavzu" bo'limlari **yo'q**. Faqat filtrlar bor: mutaxassislik (≈55 ta), yordam darajasi, yosh guruhi, mutaxassis, ishlab chiquvchi tashkilot, MKB kodi |
| Juftlik | Deyarli har bir nozologiya **2 ta hujjat**: *Klinik protokol* (batafsil, 50–140 ming belgi) + *Davolash standarti* (qisqa jadval) |
| Format | HTML ichida to'liq matn + imzolangan PDF (`/protocol/{id}/download`) |
| Ichki tuzilma | Hamma protokol bir xil qolipda: **1. Kirish qismi** (MKB kodlari, ta'riflar) → **2. Asosiy qism** (2.1 Ta'rif → Tasnif → Diagnostika → Davolash → Profilaktika → Tibbiy yordamni tashkil etish → Sifat mezonlari) → **3. Ilovalar** (algoritmlar, chek-listlar, shkalalar, bemor uchun ma'lumot) |
| Sifat muammolari | Ba'zi teglar noto'g'ri (masalan, glaukoma "Nevrologiya" deb belgilangan); "Akusherlik" filtriga anafilaksiya va Kushing sindromi ham tushib qolgan |

**Xulosa — "mavzulash" qanday bo'ladi:** sayt protokollarni mavzularga bo'lmagan, lekin har bir protokol o'zi tayyor mavzu, ichki bo'limlari esa tayyor dars rejasi. Shuning uchun iyerarxiya:

```
Yo'nalish (Roddom / Akusherlik)
 └─ Bo'lim (Homiladorlik · Tug'ruq · Tug'ruqdan keyin · Chaqaloq)
     └─ Modul = 1 nozologiya (Protokol + Standart jufti)
         └─ Mikro-dars = protokolning 2.x bo'limi (3–6 ta)
             ├─ Video (60–120 s) — oxirigacha ko'rmasdan o'tib bo'lmaydi
             ├─ "Asosiy tushunchalar" kartochkalari — har biri minimal o'qish vaqti bilan
             └─ Mashq: 6–10 savol, xato javob navbat oxiriga qaytadi;
                hamma savolga to'g'ri javob berilmaguncha dars yopilmaydi
         └─ Klinik holat (vaziyatli o'yin)
         └─ Yakuniy test → nishon/sertifikat
```

Bu Oson Prava modeliga mos: u yerda ham savollar mavzular bo'yicha guruhlangan, xatolar ustida ishlash va spaced repetition bor ([osonprava.uz](https://osonprava.uz/)).

---

## 2. Roddom yo'nalishi — saytdagi barcha tegishli protokollar

Sahifalardan to'liq matnlar yuklab olingan: `research/protocols/{id}.txt`.
Bemorning yo'li (homiladorlik → tug'ruq → tug'ruqdan keyin → chaqaloq) bo'yicha guruhlangan — bu o'yindagi "xarita" ham bo'ladi.

| Bo'lim | Modul (nozologiya) | Protokol ID | Standart ID |
|---|---|---|---|
| **A. Homiladorlik** | Antenatal parvarish, xavf guruhidagi homiladorlar | 779 | 780 |
| | Homiladorlikda temir tanqisligi anemiyasi | 777 | 778 |
| | Gestatsion qandli diabet | 781 | 782 |
| | Homiladorlarda siydik yo'llari infeksiyasi | 1110 | 1111 |
| | Homila tushishi (o'z-o'zidan abort) | 804 | 805 |
| | Odatiy homila tushishi | 802 | 803 |
| **B. Tug'ruq** | Partogramma, normal tug'ruqni olib borish | 795 | 796 |
| | Homila pardalarining muddatidan oldin yorilishi. Xorioamnionit | 791 | 792 |
| | Kesar kesish | 785 | 786 |
| **C. Tug'ruqdan keyin** | Normal tug'ruqdan keyingi davr | 800 | 801 |
| | Akusherlikda sepsis va septik shok | 806 | 807 |
| | Kontratseptiv vositalarni qo'llash | 797 | — |
| **D. Chaqaloq** | Tug'ruq zalida chaqaloq reanimatsiyasi va stabilizatsiyasi (asfiksiya) | 1337 | 1338 |
| | Chaqaloqlarda respirator distress sindromi | 1339 | 1340 |

**Jami: 14 modul.** Qo'shimcha (ixtiyoriy, neonatologiya): chaqaloqlar sepsisi (1333/1334), shok (1341/1342), giperbilirubinemiya (1068), NEK (1335/1336), tug'ma pnevmoniya (1079/1080).

> ⚠️ **Muhim:** saytda hozircha **preeklampsiya/eklampsiya** va **tug'ruqdan keyingi qon ketish** bo'yicha alohida protokol **yo'q**. Asosiy qoidaga ko'ra biz ularni o'zimizdan qo'shmaymiz. Inspeksiyaga buni aytib qo'yish kerak: protokol saytga qo'yilsa, keyin qo'shamiz.
> Ginekologik protokollar (mioma, polip, menopauza, prolaps, rak) roddom doirasiga kirmaydi.

---

## 3. Bugungi demo uchun 3 ta mavzu (tavsiya)

| # | Mavzu | Nega aynan shu | Mikro-darslar (protokol bo'limlaridan) | O'yin mexanikasi |
|---|---|---|---|---|
| 1 | **Partogramma va normal tug'ruq** (795/796) | Roddomning yuragi; JSST 2022 partogrammasi — yangi, ko'pchilik hali o'rganmagan | Ta'rif va maqsadi (2.1–2.3) · Qachon boshlash (2.4) · Tuzilishi, 7 bo'lim (2.5) · Belgilar va to'ldirish (2.7–2.11) · Ogohlantiruvchi chegaralar va qaror qabul qilish (2.14) | **Interaktiv partogramma**: o'quvchi ma'lumotni grafikka joylaydi, tizim chegaradan chiqqanini topishni so'raydi |
| 2 | **Tug'ruq zalida chaqaloq reanimatsiyasi** (1337/1338) | Eng dramatik, algoritmli — video va o'yin uchun ideal; xatoning narxi yuqori | Ko'rsatmalar va kontrindikatsiyalar · Kindikni qisish · A qadam (issiqlik, quritish, holat, stimulyatsiya) · Apgar baholash · B (ventilyatsiya) · C (yurak massaji) · D (dori) | **Ketma-ketlikni tartiblash** (A→B→C→D), **taymerli vaziyat**: "Chaqaloq nafas olmayapti — 30 soniyada keyingi qadam?" |
| 3 | **Normal tug'ruqdan keyingi davr** (800/801) | Hamma xodimga tegishli, tushunish oson, bemor bilan muloqot ko'p — personajlar yaxshi ochiladi | Ta'riflar va o'zgarishlar (2.1–2.2) · Tasnif (2.3) · Diagnostika (2.4) · Davolash (2.5) · Chaqaloq parvarishi (2.6) · Profilaktika, Edinburg depressiya shkalasi (2.7, 4.4) | **Bemorni kuzatish**: palataga kirib, Nigoraning shikoyatlariga qarab normal/xavfli belgini ajratish |

Muqobil: 3-mavzu o'rniga **Kesar kesish** (785) — juda katta (145 ming belgi), demo uchun og'ir; to'liq versiyada bo'ladi.

---

## 4. Personajlar (video + platforma uchun bitta "kast")

Hamma videoda va interfeysda bir xil qahramonlar — xodim ularni tanib, hikoyaga bog'lanadi. Bemorning yo'li butun kurs bo'ylab davom etadi.

| Personaj | Rol | Vazifasi platformada |
|---|---|---|
| **Nigora**, 27 yosh | Homilador ayol (bemor) | Butun kursning "hikoya ipi": antenataldan tug'ruqdan keyingi davrgacha. Klinik holatlarda u bilan ishlaymiz |
| **Dr. Dilnoza Karimova**, 45 | Akusher-ginekolog, bo'lim mudiri | Asosiy ustoz: nazariyani tushuntiradi, qaror qabul qiladi |
| **Malika opa**, 38 | Akusherka | Amaliy qadamlar, partogramma, parvarish; xodimlarning ko'pchiligi aynan o'zini unda ko'radi |
| **Dr. Jasur Rahimov**, 35 | Neonatolog | Chaqaloq bo'limi, reanimatsiya |
| **Dr. Bekzod**, 40 | Anesteziolog-reanimatolog | Kesar kesish, sepsis, shok |
| **Sardor** | Nigoraning turmush o'rtog'i | Bemor va oila bilan muloqot, rozilik, maslahat |

**Uslub:** 2D illyustratsiyali (flat/semi-flat) animatsiya. Sabablari: personajlar hamma videoda bir xil bo'ladi, real tug'ruq sahnalari ko'rsatilmaydi (madaniy jihatdan ham to'g'ri), arzon va tez. Personajlar uchun **"character sheet"** (old/yon/orqa ko'rinish, 5–6 emotsiya, kiyim — oq xalat, bosh kiyimi) bir marta chiziladi va hamma joyda ishlatiladi.

---

## 5. Video formati

- **Davomiyligi:** 60–120 soniya (bitta mikro-dars = bitta video). Butun modul videolari jami 6–10 daqiqa.
- **Tuzilma:** 5 s ilmoq (Nigora bilan vaziyat) → 60–90 s tushuntirish (Dr. Dilnoza/Malika opa + ekranda kalit raqamlar, algoritm) → 10 s xulosa ("3 ta narsani eslab qoling") → manba ko'rsatiladi.
- **Til:** o'zbekcha ovoz + o'zbek/rus subtitr (protokollar ruscha, terminlar ikkala tilda beriladi).
- **Ishlab chiqarish konveyeri:**
  1. Protokol bo'limidan ssenariy (har bir gap protokolga havola bilan)
  2. **Tibbiy tekshiruv** — mutaxassis (akusher/neonatolog) tasdiqlaydi ← majburiy bosqich
  3. Storyboard → personaj referenslari bilan AI-generatsiya (masalan Runway, Seedance, Higgsfield — character consistency uchun) yoki 2D animatsiya
  4. Ovoz (o'zbekcha TTS yoki diktor — sifatini sinab ko'rish kerak), montaj, subtitr
- **Ogohlantirish:** AI video vositalari faktni "o'ylab topishi" mumkin — ssenariy tayyor va tasdiqlangan bo'lishi, vosita faqat vizualni chizishi kerak.

---

## 6. Gamifikatsiya (25+ yoshli ishlaydigan xodimlar uchun "jiddiy o'yin")

Bolalarcha emas, professional: hurmat, tezlik, aniq foyda.

| Mexanika | Qanday |
|---|---|
| **Xarita / yo'l** | Nigoraning yo'li: 4 bo'lim, 14 modul — ochilib boradi |
| **Malaka darajalari** | Ball (XP) → darajalar: *Boshlovchi → Mutaxassis → Ekspert → Ustoz* |
| **Nishonlar** | "Partogramma ustasi", "Oltin daqiqa" (reanimatsiya) va h.k. |
| **Ketma-ketlik (streak)** | "Kunlik 5 savol" — 3 daqiqalik mashq, ish orasida |
| **Xatolar ustida ishlash** | Noto'g'ri javoblar spaced repetition bilan qaytariladi (Oson Prava "Smart rejim" kabi) |
| **Reyting** | Bo'lim/muassasa ichida (shaxsiy reyting ixtiyoriy — xodimni uyaltirmaslik uchun) |
| **Sertifikat** | Modul yakuniy testidan ≥80% → PDF sertifikat (QR bilan tekshiriladi) |

**Savol turlari:** bitta to'g'ri javob · bir nechta javob · algoritmni tartiblash (drag & drop) · rasm/grafik ustida belgilash (partogramma, Apgar) · klinik holat (tarmoqlanuvchi ssenariy) · taymerli tezkor savol.

Tadqiqot: hamshiralar uchun uzluksiz ta'limda gamifikatsiya bilim va qoniqishni oshirgani ko'rsatilgan ([PLOS One, 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12410705/)); lekin yomon loyihalangan gamifikatsiya teskari natija beradi — shuning uchun ball faqat *to'g'ri bilim* uchun beriladi, "bosib o'tish" uchun emas.

---

## 7. Dizayn yo'nalishi (davlat sayti, 25+ auditoriya)

- **Ohang:** tinch, ishonchli, rasmiy — lekin zerikarli emas. Illyustratsiyalar va personajlar iliqlik beradi.
- **Rang:** asosiy — chuqur ko'k-feruza (tibbiyot + davlat), oq fon, bitta urg'u rang (muvaffaqiyat uchun yashil, xavf uchun qizil faqat klinik ogohlantirishlarda). Neon va gradientlar yo'q.
- **Shrift:** o'zbek lotin harflarini to'g'ri ko'rsatadigan (oʻ, gʻ, ʼ) — masalan Inter; asosiy matn **18px**, sarlavhalar katta, qator oralig'i 1.5+.
- **Qulaylik:** WCAG 2.2 AA kontrast, tugmalar ≥44px, klaviatura bilan ishlash, qorong'i rejim ixtiyoriy.
- **Mobile-first:** hamshira va akusherkalar ko'pincha telefonda o'qiydi — dars, video va test telefonda to'liq ishlashi shart.
- **Tillar:** o'zbek (lotin) asosiy + rus. Kirill keyinchalik.
- Har bir dars sahifasida: progress, davomiyligi ("4 daqiqa"), manba havolasi.

---

## 8. Texnik arxitektura

```
klinik-talim/
├─ backend/      FastAPI · Python 3.12+ · SQLAlchemy 2 + Alembic · Pydantic v2 · PostgreSQL
├─ frontend/     Next.js 16 (App Router) · React 19.2 · TypeScript · Tailwind 4 · next-intl (uz/ru)
├─ content/      kontent-kod sifatida: YAML/JSON (modul, dars, kartochka, savol + manba) → seed
├─ media/        lokal video (MP4) — keyin MinIO/S3 + HLS
├─ research/     protokol matnlari, tadqiqot
└─ docker-compose.yml   (postgres, keyin minio)
```

**Asosiy entitetlar:** `Direction → Section → Module(protocol_ids) → Lesson(source_ref) → Card / Video / Question(source_ref)`; `User(role, muassasa, bo'lim, lavozim)`, `Attempt`, `Answer`, `Progress`, `ReviewQueue` (spaced repetition), `Badge`, `Certificate`.

**Rollar:** xodim (o'quvchi) · bo'lim/muassasa admini · inspektor (Klinik audit inspeksiyasi — hisobotlar: kim o'tdi, qaysi protokol bo'yicha zaif, muassasalar kesimida) · kontent muharriri/tibbiy ekspert.

**Kirish:** demo uchun telefon/parol; keyinchalik **OneID** (davlat SSO) integratsiyasi.

**Hammasi lokalda**, tayyor bo'lgach serverga. Kontent YAML'da saqlangani uchun tibbiy ekspert o'zgarishlarni ko'rib chiqishi va versiyalash oson.

---

## 9. Bosqichlar

| Bosqich | Nima | Natija |
|---|---|---|
| **0. Bugun (demo)** ✅ | 3 mavzu, 13 dars, ~100 savol; video o'rnida ssenariy-pleer; Next.js 16 frontend, 3 til | Inspeksiyaga ko'rsatish |
| **1. Roddom MVP** (backend ✅: auth, mashq/test baholash, progress, inspektor hisoboti) | 14 modul matn kontenti + testlar; backend (auth, progress, test, spaced repetition); admin/inspektor hisobot sahifasi | Lokalda to'liq ishlaydigan platforma |
| **2. Videolar** | Personajlar sheet'i, har mikro-darsga video (~60–70 ta) | To'liq multimedia kurs |
| **3. Server + pilot** | Deploy, 1–2 tug'ruqxonada pilot, fikr-mulohaza | Tuzatishlar |
| **4. Kengaytirish** | Boshqa yo'nalishlar (kardiologiya, pediatriya...) — o'sha qolip bilan | 725 hujjatgacha masshtab |

> ⚠️ **Real muddatlar:** "ertaga butun roddom" — **matn kontenti va testlar** uchun mumkin (14 modul), lekin **barcha videolar** bir kunda chiqmaydi (~60–70 video + tibbiy tekshiruv). Ertaga: to'liq matn + test, videolar bosqichma-bosqich.

---

## 10. Xavflar va hal qilinishi kerak bo'lgan savollar

1. **Tibbiy aniqlik** — kim kontentni tasdiqlaydi? Inspeksiya tomonidan ekspert (akusher-ginekolog, neonatolog) kerak.
2. **Tarjima** — protokollar ruscha; o'zbekcha terminologiya ekspert bilan kelishilishi kerak.
3. **Protokollar yangilanadi** (qayta ko'rib chiqish: 2030 yoki yangi dalil chiqqanda) — har bir kontent protokol versiyasiga bog'lanadi, protokol o'zgarsa tegishli darslar "qayta tekshirish" holatiga o'tadi.
4. **Huquq** — protokol matnidan foydalanish va logotiplar uchun Sog'liqni saqlash vazirligi/inspeksiya ruxsati.
5. **Maqsadli auditoriya** — faqat shifokorlarmi yoki akusherka/hamshiralar ham? (Dars chuqurligi va savollar shunga bog'liq.)
6. **Brending** — platforma nomi, inspeksiya logotipi, rasmiy ranglar bormi?

---

### Manbalar
- Klinik protokollar katalogi: https://www.clinical-protocols.uz/
- Oson Prava: https://osonprava.uz/
- Gamifikatsiya va hamshiralar CME: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12410705/
- AI video va personaj izchilligi: https://runway.com/resources/medical-animation-video , https://www.atlabs.ai/blog/how-to-create-consistent-characters-for-educational-videos
