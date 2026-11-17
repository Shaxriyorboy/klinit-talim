# Personajlar uchun rasm buyurtmasi (3D, namunadagidek)

Maqsad: yuborgan namunangizdagidek (yumshoq yorug'likli 3D, "Pixar" uslubidagi realistik) 6 ta personaj. Bitta personaj hamma rasmda bir xil ko'rinishi kerak — shuning uchun avval **har biriga bitta asosiy rasm** yarating, keyin boshqa pozalarni shu rasmni **reference** qilib (Midjourney `--cref`, Leonardo "Character Reference", DALL·E/ChatGPT'da "shu personajni saqlab") chiqaring.

## Texnik talablar (hammasiga)

- Fon: **shaffof PNG** (yoki bir tekis oq — fonni o'zim olib tashlayman)
- O'lcham: kamida **1536 × 2048**, vertikal
- Kadr: **beldan yuqori** (waist-up), yuz to'liq ko'rinadi, kamera ko'z balandligida, old tomondan 3/4 burilish
- Yorug'lik: hammasida bir xil — yumshoq studiya yorug'ligi, chapdan-yuqoridan
- Matn, logo, watermark bo'lmasin; qo'lida hujjat bo'lsa — yozuvsiz
- Har bir pozaning **ikki varianti**: og'zi yopiq va og'zi ochiq (gapirayotgandek) — videoda gapirish animatsiyasi uchun

## Umumiy uslub (har bir promptning boshiga qo'shing)

```text
3D stylized realistic character, Pixar-like, soft studio lighting, high detail skin and fabric, friendly and professional, waist-up portrait, 3/4 view, looking at camera, plain transparent background, consistent character design, no text, no logo
```

## Personajlar

| Fayl papkasi | Personaj | Prompt (uslubdan keyin) |
|---|---|---|
| `dilnoza` | Dr. Dilnoza Karimova, akusher-ginekolog, 45 | `Central Asian Uzbek woman doctor, 45 years old, dark brown hair in a neat bun, thin rectangular glasses, warm confident smile, white lab coat over teal scrubs, stethoscope around neck, name badge without text` |
| `malika` | Malika opa, katta akusherka, 38 | `Central Asian Uzbek woman midwife, 38 years old, kind face, teal surgical scrubs, matching teal scrub cap covering hair, short sleeves, calm caring expression` |
| `jasur` | Dr. Jasur Rahimov, neonatolog, 35 | `Central Asian Uzbek man doctor, 35 years old, short dark hair, short neat beard, white lab coat over navy blue scrubs, stethoscope around neck, friendly smile` |
| `bekzod` | Dr. Bekzod Toshev, anesteziolog-reanimatolog, 40 | `Central Asian Uzbek man anesthesiologist, 40 years old, purple surgical scrubs, patterned purple surgical cap, light blue surgical mask hanging under the chin, focused calm look` |
| `nigora` | Nigora, bemor, 27 | `young Central Asian Uzbek woman, 27 years old, pregnant, soft pink headscarf covering hair and neck (modest hijab style), light pink hospital gown, gentle slightly worried smile` |
| `sardor` | Sardor, Nigoraning turmush o'rtog'i, 30 | `Central Asian Uzbek man, 30 years old, short dark hair, clean shaven, casual brown button-up shirt, supportive caring expression` |

## Pozalar (har bir shifokor/akusherka uchun)

| Fayl nomi | Poza | Promptga qo'shimcha |
|---|---|---|
| `idle.png` / `idle-talk.png` | Oddiy turish | `standing relaxed, arms down` |
| `explain.png` / `explain-talk.png` | Tushuntirmoqda | `explaining, one hand raised at chest level, open palm` |
| `point.png` / `point-talk.png` | Yon tomonga ko'rsatmoqda | `pointing with right hand to the right side of the frame` |
| `clipboard.png` / `clipboard-talk.png` | Planshet bilan | `holding a blank clipboard at chest level` |
| `listen.png` / `listen-talk.png` | Tinglamoqda | `hands gently clasped in front, attentive` |

Nigora uchun qo'shimcha: `bed.png` / `bed-talk.png` — `sitting upright in a hospital bed, blanket up to the waist`.
Sardor uchun: `idle`, `listen` yetarli.

Reanimatsiya videosi uchun alohida:

| Fayl | Prompt |
|---|---|
| `baby/pale.png` | `3D stylized realistic newborn baby lying on back on a neonatal radiant warmer mattress, pale bluish skin, eyes closed, limp, top-down 3/4 view, transparent background` |
| `baby/pink.png` | xuddi shu, lekin `healthy pink skin, crying, moving arms and legs` |

## Fayllarni qayerga qo'yish

```
klinik-talim/frontend/public/characters/<papka>/<poza>.png
masalan: public/characters/dilnoza/explain-talk.png
```

Fayllar qo'yilgach, video va saytdagi avatarlar avtomatik shu rasmlardan foydalanadigan qilib ulayman.

## Litsenziya

Yuborgan namunalar stock saytlardan (biri "pngtree" watermark bilan) — ularni to'g'ridan-to'g'ri ishlatib bo'lmaydi. O'zingiz generatsiya qilgan yoki litsenziyasi sotib olingan rasmlardan foydalaning (davlat loyihasi uchun bu muhim).
