# Klinik audit inspeksiyasi — klinik protokollar bo'yicha o'quv platformasi

Klinik audit inspeksiyasi uchun: tibbiy xodimlarga **faqat** https://www.clinical-protocols.uz/ dagi tasdiqlangan protokollarni o'rgatish.

## Tuzilma

```
klinik-talim/
├─ REJA.md          tadqiqot va reja
├─ content/         KONTENT MANBAI (JSON): modul → dars → tushuncha/savol, har birida source
├─ research/        protokollarning to'liq matni (research/protocols/{id}.txt)
├─ backend/         FastAPI · async SQLAlchemy 2 · asyncpg · Alembic · PostgreSQL
└─ frontend/        Next.js 16 · React 19.2 · TypeScript · Tailwind 4
```

## Ishga tushirish (lokal)

Talab: PostgreSQL (lokal), Python 3.12 (`uv`), Node 20+.

```bash
# 1) Backend
cd backend
cp .env.example .env            # DATABASE_URL ichiga Postgres foydalanuvchingizni yozing
createdb klinik_talim && createdb klinik_talim_test
uv venv --python 3.12 .venv && uv pip install -r requirements.txt --python .venv/bin/python
.venv/bin/alembic upgrade head
.venv/bin/python -m app.seed.run --demo     # kontent + demo muassasa/inspektor/40 o'quvchi
.venv/bin/uvicorn app.main:app --port 8100 --reload

# 2) Frontend (boshqa terminalda)
cd frontend && npm install && npm run dev -- --port 3100
```

Brauzer: http://localhost:3100 → `/uz` (lotin), `/oz` (kirill), `/ru` (rus). Frontend `/api/*` so'rovlarini backendga yo'naltiradi (`BACKEND_URL`, standart `http://localhost:8100`).

Demo hisoblar (inspektor, admin, o'quvchilar) — `backend/.env.example` da. API hujjati: http://localhost:8100/docs

## Testlar

```bash
cd backend && .venv/bin/pytest -q
```

## Asosiy qoidalar (kodda majburlangan)

- **Manbasiz kontent yo'q:** `content/*.json` dagi har bir tushuncha va savolda `source: {protocolId, section, page}` bo'lmasa, seed to'xtaydi.
- **Javoblar faqat serverda:** brauzerga savol matni va variantlar ketadi; to'g'ri javob, izoh va manba javob tekshirilgandan keyin keladi. Yakuniy test savollari serverda tanlanadi va baholanadi.
- **O'zlashtirish sikli:** mashq sessiyasi barcha savolga to'g'ri javob berilgandagina yakunlanadi; keyingi dars va yakuniy test server tomonidan qulflanadi.
- **Boshlang'ich test:** modulni boshlashdan oldin bir marta (10 savol, baholanmaydi) — yakuniy test bilan solishtirib "bilim o'sishi" hisoblanadi. Modulni avval boshlaganlar uchun majburiy emas.
- **Ishonch darajasi:** har bir javob "Aniq bilaman / Taxminan / Bilmayman" bilan yuboriladi; "aniq bilaman + xato" — inspektor hisobotida alohida ko'rsatkich.
- **Takrorlash (FSRS):** mashq/test/takrorlashdagi har bir halol javob `review_cards` jadvalida keyingi takrorlash sanasini belgilaydi (`fsrs` kutubxonasi). Modul `retention` qiymati (masalan reanimatsiya 0.95) xavfli mavzularni tez-tez qaytaradi.
- **Bo'lim bo'yicha o'zlashtirish:** protokol bo'limi (`source.section`) bo'yicha 0–4 daraja, oxirgi javoblarga qarab — xato qilinsa tushadi.
- **Variant izohlari:** savolda ixtiyoriy `optionNotes` (variantlar tartibida, to'g'ri variantga `null`) — faqat javob tekshirilgandan keyin brauzerga ketadi.

## Kontentni yangilash

`content/akusherlik.json` ni tahrirlang → `python -m app.seed.run` (bazani yangilaydi). Frontend ham shu JSON ni o'qiydi.
