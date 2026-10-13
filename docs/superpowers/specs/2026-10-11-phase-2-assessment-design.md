# 2-bosqich: Baholash va gamifikatsiya — mini-spec

Sana: 2026-10-11. Holat: dizayn tasdiqlangan, implementatsiya rejasi hali yozilmagan.

Asosiy hujjat: `2026-10-08-texnologiya-platform-design.md` (3-bo'lim "assessment" va "gamification", 4-bo'lim, 10-bo'lim). Bu mini-spec asosiy spec'ni to'ldiradi: u yerda hal qilinmagan qoidalarni aniqlaydi va ba'zi maydonlarni soddalashtiradi. Ikkalasi bir-biriga zid kelsa, shu hujjat ustun.

---

## 1. Maqsad va doira

**Qamrov:** test, ha/yo'q va krossvord faoliyatlari (o'qituvchi muharriri va talaba o'ynash ekrani), urinishlar, vazifa yuborish va baholash, XP, kunlik seriya, nishonlar, talaba bosh sahifasi, "Natijalarim", o'qituvchi tekshirish navbati va statistika.

**Doiradan tashqari (YAGNI):**
- AI maydonlari (`activities.source`, `submissions.ai_*`, `quiz_questions.source_ref`) — 3-bosqichda qo'shiladi;
- XP qiymatlarini admin panelidan yoki `.env`dan sozlash;
- vazifa javoblari tarixi (har talabada bitta javob qatori);
- muddat o'tganda ballni avtomatik kamaytirish;
- reyting jadvali (asosiy spec'da ham yo'q).

**Rejalar:** 2-bosqich ikkita implementatsiya rejasiga bo'linadi, har biri alohida PR bilan:
- **2A — backend:** `app/assessment/`, `app/gamification/`, `learning` integratsiyasi, migratsiyalar, testlar;
- **2B — frontend:** sahifalar, muharrirlar, o'ynash ekranlari, animatsiyalar, Vitest va E2E.

## 2. Qabul qilingan qarorlar

| Mavzu | Qaror |
|---|---|
| Bosqichdagi faoliyatlar | `review`/`practice` bosqichida bir nechta faoliyat bo'lishi mumkin. Bosqich nashr qilingan har bir faoliyat kamida bir marta yakunlanganda tugaydi |
| Urinishdan keyin | To'liq tahlil: ball, har element bo'yicha to'g'ri/noto'g'ri, to'g'ri javob va izoh |
| Vazifa javobi | Har talabada vazifa uchun bitta javob. Baholanmaguncha tahrirlanadi. O'qituvchi baholaydi yoki izoh bilan qaytaradi |
| Muddat | O'tgandan keyin ham qabul qilinadi, "kechikkan" belgisi ko'rsatiladi |
| XP | Qiymatlar kodda (`app/gamification/rules.py`). Har hodisa uchun bir marta beriladi |
| Seriya | Toshkent vaqti bo'yicha kunida kamida bitta XP hodisasi bo'lsa, kun faol hisoblanadi |
| Nishonlar | 10 ta, emoji ikonka bilan. Ta'riflar kodda turadi va ishga tushganda bazaga sinxronlanadi |
| Krossvord | Deterministik ochko'z algoritm. Joylashmagan so'z bo'lsa, o'qituvchiga xato qaytadi |
| Vazifa fayli | Bitta fayl, 20 MB gacha: pdf, doc, docx, ppt, pptx, jpg, png |

## 3. Ma'lumotlar modeli

Asosiy spec'dagi jadvallar quyidagi farqlar bilan quriladi. Turlar `app/core/types.py` dan olinadi (`BigIntPK`, `UTCDateTime`, `str_enum`). `jsonb` o'rniga SQLAlchemy `JSON` ishlatiladi, chunki kod SQLite'da ham ishlashi kerak. Har yangi model `app/models_registry.py`ga import qilinadi va unga migratsiya yoziladi.

### assessment
- **`activities`**: step_id (FK, CASCADE), type (`quiz|yesno|crossword`), title, order, is_published (sukut `false`), layout (JSON, nullable; faqat krossvordda), created_at, updated_at.
- **`quiz_questions`**: activity_id (CASCADE), order, text, options (JSON, aynan 4 ta bo'sh bo'lmagan satr), correct_index (0–3), explanation (nullable).
- **`yesno_items`**: activity_id (CASCADE), order, statement, answer (bool), explanation (nullable).
- **`crossword_words`**: activity_id (CASCADE), order, word (normallashtirilgan, 6-bo'lim), clue.
- **`attempts`**: activity_id (CASCADE), user_id (CASCADE), score (int), max_score (int), result (JSON), created_at.
  - Urinish bitta so'rovda yuboriladi va darhol tekshiriladi, shuning uchun `started_at` / `finished_at` maydonlari yo'q.
  - `result` ichida har element bo'yicha nusxa saqlanadi: savol yoki bayonot matni (krossvordda clue), talabaning javobi, to'g'ri javob, to'g'rimi, izoh. Shu sababli o'qituvchi faoliyatni keyin tahrirlasa ham eski urinish to'g'ri ko'rinadi.
  - Indeks: (user_id, activity_id).
- **`tasks`**: step_id (unique, CASCADE), title, description, type (`text|file|both`), max_score (1–100), rubric (matn, nullable), deadline (`UTCDateTime`, nullable), created_at, updated_at.
- **`submissions`**: task_id (CASCADE), user_id (CASCADE), (task_id, user_id) unique, text (nullable), file (nullable, nisbiy yo'l), original_name (nullable), status (`submitted|graded|returned`), score (nullable), feedback (nullable), submitted_at, graded_by (FK users, SET NULL), graded_at (nullable), created_at.

### gamification
- **`xp_events`**: user_id (CASCADE), amount, reason, ref_type, ref_id, created_at. (user_id, reason, ref_type, ref_id) unique.
- **`streaks`**: user_id (PK, CASCADE), current, longest, last_active_date (`Date`, Toshkent sanasi).
- **`badges`**: code (unique), title_uz, title_ru, description_uz, description_ru, icon (emoji satri).
- **`user_badges`**: user_id (CASCADE), badge_id (CASCADE), awarded_at. (user_id, badge_id) unique.

Faoliyat yoki vazifa o'chirilsa, uning urinishlari va javoblari ham o'chadi (CASCADE, javob fayllari diskdan ham o'chiriladi). `xp_events` va `user_badges` saqlanib qoladi, chunki ularda faoliyatga FK yo'q: `ref_id` oddiy son sifatida saqlanadi.

## 4. Xatti-harakat qoidalari

### Kontent bor-yo'qligi (`learning/content.py: load_step_infos`)
- `review`, `practice`: bosqichda kamida bitta nashr qilingan faoliyat bo'lsa (har faoliyatda kamida 1 element majburiy).
- `task`: bosqichda vazifa bo'lsa.
- Qolgan bosqichlar uchun qoida 1-bosqichdagidek qoladi. Mavzu progressi formulasi o'zgarmaydi: tugatilgan bosqichlar / kontenti bor bosqichlar.

### Faoliyatga urinish
1. Talaba faqat nashr qilingan fan, mavzu va faoliyatga urinish yubora oladi.
2. `answers` ro'yxati talabaga yuborilgan elementlar tartibida keladi:
   - test: variant indeksi 0–3 yoki `null` (javobsiz);
   - ha/yo'q: `true` / `false` / `null`;
   - krossvord: talaba layout'idagi `words` tartibida kiritilgan satr (bo'sh bo'lishi mumkin).

   Ro'yxat uzunligi elementlar soniga teng bo'lmasa yoki qiymat turi noto'g'ri bo'lsa → 422 `ATTEMPT_INVALID_ANSWERS`.
3. Ball (`score` / `max_score`):
   - test va ha/yo'q: to'g'ri javoblar soni / elementlar soni;
   - krossvord: to'liq to'g'ri yozilgan so'zlar soni / so'zlar soni (6-bo'limdagi normallashtirishdan keyin solishtiriladi).
4. Javobda ball, `result` (to'liq tahlil), `rewards` va yangilangan bosqich holati qaytadi.
5. Qayta urinish cheklanmaydi. Har urinish alohida qator bo'lib yoziladi.

### Bosqichni tugatish (`review`/`practice`)
- Urinish saqlangach, bosqichdagi nashr qilingan faoliyatlarning har birida talabaning kamida bitta urinishi bormi, tekshiriladi:
  - bor bo'lsa → `step_progress.status = completed`, `completed_at` yoziladi (agar oldin yozilmagan bo'lsa);
  - yo'q bo'lsa → `in_progress`.
- `best_score` — urinishi bor har nashr qilingan faoliyat bo'yicha eng yaxshi foizning (`score / max_score × 100`) o'rtachasi, 0–100. Har urinishdan keyin qayta hisoblanadi.
- Bosqich tugagandan keyin yangi faoliyat nashr qilinsa, `completed` holati bekor qilinmaydi.
- Bu bosqichlar uchun "Tugatdim" (`POST /steps/{id}/complete`) avvalgidek 400 qaytaradi.

### Vazifa
- Bitta `task` bosqichida ko'pi bilan bitta vazifa bo'ladi.
- `type` bo'yicha talablar:
  - `text`: matn majburiy, fayl qabul qilinmaydi;
  - `file`: fayl majburiy, matn qabul qilinmaydi;
  - `both`: matn yoki fayldan kamida bittasi kerak.

  Kerakli maydon yo'q bo'lsa → 422 `SUBMISSION_EMPTY`; ruxsat etilmagan maydon yuborilsa → 422 `SUBMISSION_FIELD_NOT_ALLOWED`.
- Holatlar:
  - **birinchi yuborish** → `submitted`, `submitted_at = hozir`, `task` bosqichi `completed`;
  - **`submitted` yoki `returned` holatida tahrirlash** → `submitted`, `submitted_at` yangilanadi. Yangi fayl kelsa, eski fayl diskdan o'chiriladi. Bosqich `completed` holatida qoladi;
  - **`graded` holatida tahrirlash** → 409 `SUBMISSION_GRADED`;
  - **baholash** → `graded`: score 0..max_score (butun son), feedback ixtiyoriy, `graded_by`, `graded_at`. Bu holat yakuniy;
  - **qaytarish** → `returned`, feedback majburiy. Faqat `submitted` holatidan mumkin, aks holda 409 `SUBMISSION_NOT_SUBMITTED`. Baholash ham faqat `submitted` holatidan mumkin.
- **Kechikish:** `deadline` bor va `submitted_at > deadline` bo'lsa, `is_late = true`. Bu maydon bazada saqlanmaydi, har safar hisoblanadi. Ballga avtomatik ta'sir qilmaydi.
- **Fayl:**
  - bitta fayl, hajmi `Settings.max_submission_mb` (sukut 20) gacha;
  - kengaytma va magic bytes tekshiriladi: pdf, doc, docx, ppt, pptx, jpg/jpeg, png. Mavjud `learning/materials.py: _signature_matches` umumiy modulga ko'chiriladi va rasm imzolari qo'shiladi;
  - fayl `Storage.save_upload` orqali saqlanadi va konvertatsiya qilinmaydi;
  - faylni faqat uning egasi va shu fanni tahrirlay oladigan o'qituvchi yoki admin yuklab oladi.

## 5. Gamifikatsiya

### XP jadvali (`app/gamification/rules.py`)

| reason | Qachon | XP | ref_type / ref_id |
|---|---|---|---|
| `step_completed` | `lecture`/`presentation`/`glossary`/`literature` uchun "Tugatdim" | 10 | step |
| `activity_completed` | faoliyatga birinchi urinish | 10 + round(10 × score / max_score) | activity |
| `activity_perfect` | faoliyatda birinchi marta 100% | 10 | activity |
| `task_submitted` | vazifaga birinchi yuborish | 20 | task |
| `task_graded` | javob baholanganda | round(30 × score / max_score) | submission |
| `topic_completed` | mavzuning kontenti bor barcha bosqichlari tugaganda | 50 | topic |

- `round` — yarmi yuqoriga yaxlitlash (`floor(x + 0.5)`), Python'ning bankcha `round()` funksiyasi emas.
- Unique cheklov tufayli har hodisa bir marta yoziladi. Qayta urinish, qayta yuborish yoki "Tugatdim"ni qayta bosish XP bermaydi.
- `topic_completed` har bosqich tugaganda (har uch yo'l bilan) tekshiriladi.

### `award()` oqimi (`app/gamification/service.py`)
`award(db, user_id, reason, ref_type, ref_id, amount, now) -> Rewards`:
1. `xp_events` qatori savepoint ichida qo'shiladi. Unique to'qnashuv bo'lsa, savepoint orqaga qaytariladi va bo'sh `Rewards` qaytadi. Shu orqali parallel so'rovlarda ham XP ikki marta berilmaydi.
2. `amount > 0` bo'lsa seriya yangilanadi. Bugungi sana `now` dan Toshkent vaqti (`ZoneInfo("Asia/Tashkent")`) bo'yicha olinadi:
   - `last_active_date` bugun bo'lsa → o'zgarmaydi;
   - kecha bo'lsa → `current + 1`;
   - aks holda → `current = 1`;
   - `longest = max(longest, current)`.

   0 XP'lik hodisa (`task_graded` ball 0 bo'lganda) qator sifatida yoziladi, lekin seriyaga ta'sir qilmaydi.

   XP, seriya va nishonlar faqat talaba rolidagi foydalanuvchilarga beriladi. O'qituvchi yoki
   admin kursni ko'rib chiqayotganda progress saqlanadi, lekin mukofot berilmaydi
   (`learning.progress.reward`). O'qituvchi baho qo'yganda talabaning seriyasi oshadi
   (foydalanuvchi qarori, 2026-10-12).

   Seriya ko'rsatilganda: `last_active_date` kechadan eski bo'lsa, `current` 0 deb ko'rsatiladi (bazadagi qiymat keyingi faol kunda 1 dan boshlanadi), `longest` saqlanadi.
3. Nishon shartlari tekshiriladi. Yangi berilganlari `user_badges`ga yoziladi (unique, savepoint bilan).
4. `Rewards(xp, new_badges)` qaytadi.

Bitta so'rovda bir nechta `award` chaqirilishi mumkin (masalan `activity_completed` + `activity_perfect` + `topic_completed`). Ularning natijalari qo'shiladi va API javobida bitta `rewards` maydoni bo'lib qaytadi: `{xp: int, new_badges: [{code, icon, title_uz, title_ru}]}`.

**Bog'liqlik:** `gamification` boshqa modullarni import qilmaydi, uni `assessment` va `learning.progress` chaqiradi. Nishon shartlari uchun kerakli sonlar faqat `gamification` jadvallaridan hisoblanadi: `xp_events` dagi `reason` bo'yicha qatorlar soni va `streaks.current`.

### Nishonlar

| code | icon | title_uz | title_ru | Shart |
|---|---|---|---|---|
| `first_step` | 👣 | Birinchi qadam | Первый шаг | `step_completed` + `activity_completed` + `task_submitted` ≥ 1 |
| `first_topic` | 🎯 | Mavzu yakunlandi | Тема пройдена | `topic_completed` ≥ 1 |
| `topics_5` | 📚 | Bilim yo'lida | На пути знаний | `topic_completed` ≥ 5 |
| `topics_20` | 🎓 | Bilimdon | Знаток | `topic_completed` ≥ 20 |
| `perfect_1` | ⭐ | A'lochi | Отличник | `activity_perfect` ≥ 1 |
| `perfect_10` | 🌟 | Mukammal | Безупречно | `activity_perfect` ≥ 10 |
| `first_task` | ✍️ | Ijodkor | Творец | `task_submitted` ≥ 1 |
| `streak_3` | 🔥 | 3 kunlik seriya | Серия 3 дня | `streaks.current` ≥ 3 |
| `streak_7` | 🔥 | Bir haftalik seriya | Серия неделя | `streaks.current` ≥ 7 |
| `streak_30` | 🔥 | Bir oylik seriya | Серия месяц | `streaks.current` ≥ 30 |

`first_step` sharti — talabaning birinchi faol harakati: "Tugatdim", birinchi faoliyat urinishi yoki birinchi vazifa yuborish. Bosqich to'liq tugashi talab qilinmaydi.

Ta'riflar (`description_uz/ru` bilan) `rules.py` dagi `BADGES` ro'yxatida turadi. `sync_badges(db)` ularni `code` bo'yicha qo'shadi yoki yangilaydi, ro'yxatda yo'q nishonlarni esa o'chirmaydi. U ilova lifespan'ida va testlardagi `app` fixture'ida chaqiriladi.

## 6. Krossvord algoritmi (`app/assessment/crossword.py`)

Sof funksiyalar, baza bilan ishlamaydi: `normalize_word(raw) -> list[str]` (kataklar ro'yxati) va `build_layout(words) -> Layout`.

**Normallashtirish:**
- chetdagi bo'shliqlar olib tashlanadi, katta harfga o'tkaziladi;
- `'`, `ʻ`, `’`, `‘`, `` ` `` belgilari `ʻ` ga almashtiriladi;
- `Oʻ` va `Gʻ` bitta katak sanaladi, `SH` va `CH` ikki katak;
- qolgan har belgi harf bo'lishi kerak (`str.isalpha()`, lotin yoki kirill). Aks holda (shu jumladan `O`/`G` dan keyin kelmagan `ʻ`) → 422 `CROSSWORD_INVALID_WORD`, `details.word` bilan;
- bazada `word` normallashtirilgan ko'rinishda saqlanadi.

**Cheklovlar:** faoliyatda 3–20 so'z, har so'z 2–20 katak, takrorlangan so'z yo'q. Buzilsa → 422 `ACTIVITY_INVALID_ITEMS`.

**Joylashtirish:**
1. So'zlar katak soni bo'yicha kamayish tartibida saralanadi. Teng bo'lsa, kiritilgan tartib saqlanadi.
2. Birinchi so'z (0, 0) dan gorizontal qo'yiladi.
3. Har keyingi so'z uchun joylashgan so'zlar bilan barcha mos harf kesishmalari sinab ko'riladi. Yangi so'z kesishgan so'zga perpendikulyar qo'yiladi. Joy yaroqli bo'lishi uchun:
   - kesishmadan boshqa hech bir katak band bo'lmasligi;
   - so'zning kesishmadan boshqa har bir katagi yon tomondan (perpendikulyar yo'nalishda) boshqa harfga tegmasligi;
   - so'z boshidan oldingi va oxiridan keyingi katak bo'sh bo'lishi kerak.
4. Yaroqli joylar orasidan tanlash: (a) eng ko'p kesishma, (b) natijaviy to'rning eng kichik maydoni, (c) eng kichik `(row, col)` (siljitishdan oldingi koordinatalarda), (d) gorizontal vertikaldan oldin.
5. Joy topilmagan so'zlar ro'yxatga yig'iladi va keyingi so'zlar bilan davom etiladi. Oxirida ro'yxat bo'sh bo'lmasa → 422 `CROSSWORD_UNPLACEABLE`, `details.words` bilan, va faoliyat saqlanmaydi.
6. Koordinatalar eng kichik qator va ustun 0 bo'ladigan qilib suriladi.
7. Raqamlash: so'z boshlari `(row, col)` bo'yicha saralanadi va 1 dan raqamlanadi. Bir katakdan ikkala yo'nalishda boshlanuvchi so'zlar bitta raqamni oladi.

**`activities.layout` (faqat serverda):** `{rows, cols, words: [{word_id, number, row, col, direction: "across"|"down", length, cells: [...]}]}`. `words` `number` bo'yicha, teng bo'lsa `across` birinchi tartiblanadi.

**Talabaga yuboriladigan layout:** `{rows, cols, words: [{number, row, col, direction, length, clue}]}` — xuddi shu tartibda, `cells`, `word` va `word_id` siz. Talaba javobi shu tartibda keladi, har satr ham normallashtiriladi va kataklari solishtiriladi.

Algoritm deterministik: bir xil kirish doim bir xil layout beradi.

## 7. API

Mavjud uslub saqlanadi: o'qituvchi uchun `/api/teach/...` (`StaffUser`), talaba uchun `/api/...` (`ActiveUser`). O'qituvchi yo'llarida ruxsat `editing.ensure_can_edit_step` orqali tekshiriladi.

### O'qituvchi
| Metod va yo'l | Vazifasi |
|---|---|
| `GET /teach/steps/{step_id}/activities` | Bosqich faoliyatlari, elementlari va to'g'ri javoblari bilan |
| `POST /teach/steps/{step_id}/activities` | Yangi faoliyat `{type, title, items}`. Faqat `review`/`practice` bosqichida, aks holda 400 `ACTIVITY_WRONG_STEP` |
| `PUT /teach/activities/{id}` | Faoliyatni butunligicha saqlash `{title, items}`: elementlar to'liq almashtiriladi, krossvord qayta quriladi |
| `PATCH /teach/activities/{id}` | `{is_published}` |
| `DELETE /teach/activities/{id}` | O'chirish |
| `PUT /teach/steps/{step_id}/activities/order` | `{ids: [...]}` — tartiblash |
| `GET /teach/steps/{step_id}/task` | Bosqich vazifasi yoki `null` (muharrir uchun) |
| `PUT /teach/steps/{step_id}/task` | Vazifani yaratish yoki tahrirlash. Faqat `task` bosqichida, aks holda 400 `TASK_WRONG_STEP`. Maksimal ballni baholangan javoblardagi eng katta baldan pastga tushirib bo'lmaydi: 409 `MAX_SCORE_BELOW_GRADED` |
| `DELETE /teach/tasks/{id}` | Vazifani javoblari va ularning fayllari bilan o'chirish |
| `GET /teach/submissions?status=&subject_id=&limit=&offset=` | Tekshirish navbati, faqat tahrirlash huquqi bor fanlar bo'yicha. Sukut bo'yicha `status=submitted`, eng eskisi birinchi, `limit` 1–200 (sukut 50) |
| `GET /teach/submissions/{id}` | Javob tafsiloti: talaba ismi, fan/mavzu, vazifa, matn, fayl nomi, `is_late` |
| `GET /teach/submissions/{id}/file` | Javob fayli |
| `POST /teach/submissions/{id}/grade` | `{score, feedback?}` → `graded`. Ball oraliqdan tashqarida bo'lsa → 422 `SCORE_OUT_OF_RANGE` |
| `POST /teach/submissions/{id}/return` | `{feedback}` → `returned` |
| `GET /teach/summary` | O'qituvchi bosh sahifasi uchun: `{pending_submissions}` |
| `GET /teach/stats?subject_id=` | Mavzular bo'yicha: boshlagan va tugatgan talabalar soni, faoliyatlarning o'rtacha eng yaxshi foizi, tekshirilmagan javoblar soni |

**`items` formati:**
- test: `{text, options[4], correct_index, explanation?}`;
- ha/yo'q: `{statement, answer, explanation?}`;
- krossvord: `{word, clue}`.

Faoliyatda 1–50 ta element bo'ladi (krossvordda 3–20). Buzilsa → 422 `ACTIVITY_INVALID_ITEMS`.

### Talaba
| Metod va yo'l | Vazifasi |
|---|---|
| `GET /steps/{step_id}` (mavjud) | Kengaytiriladi: `activities` — faqat nashr qilinganlar, **to'g'ri javobsiz** (test variantlari, ha/yo'q bayonotlari, krossvord uchun talaba layout'i), har biri bilan talabaning `best_percent` va `attempts_count`; `task` (vazifa) va talabaning `submission` (`is_late` bilan) |
| `POST /activities/{id}/attempts` | `{answers}` → `{attempt_id, score, max_score, result, rewards, step}` |
| `PUT /tasks/{id}/submission` | multipart: `text?`, `file?` → `{submission, rewards, step}` |
| `GET /submissions/{id}/file` | O'z javob fayli |
| `GET /me/dashboard` | `{xp_total, streak: {current, longest, active_today}, badges: [{code, icon, title_uz, title_ru, description_uz, description_ru, awarded_at \| null}], continue_step}` (`continue` Python'da kalit so'z bo'lgani uchun `continue_step`) |
| `GET /me/results` | Fanlar va mavzular bo'yicha: faoliyatlar (eng yaxshi foiz, urinishlar soni, oxirgi urinish `attempt_id` va sanasi) va vazifa javoblari (holat, ball, izoh, `is_late`) |
| `GET /me/attempts/{id}` | Bitta urinishning to'liq tahlili (`result`) |

`POST /steps/{id}/complete` javobiga ham `rewards` qo'shiladi. Barcha yangi va o'zgargan sxemalar `npm run gen:api` orqali `schema.gen.ts` ga tushadi.

## 8. Frontend (2B)

**Talaba:**
- **`/app` — bosh sahifa (yangi):** salomlashuv, 🔥 seriya, jami XP, "Davom ettirish" kartasi, nishonlar to'ri (olinmaganlari kulrang).
- **`/app/subjects` — fanlar ro'yxati.** Hozirgi `SubjectsPage` shu yerga ko'chadi. Menyuda bosh sahifa, fanlar va natijalarim havolalari bo'ladi.
- **Dars pleyeri** (`PlayerPage` / `StepContent`):
  - `review`/`practice` bosqichida faoliyat kartalari chiqadi (nomi, turi, eng yaxshi foiz). Karta bosilganda o'ynash ekrani ochiladi;
  - **Test:** savollar bitta-bitta, 4 variant, oldinga va orqaga o'tish, "Yakunlash";
  - **Ha/Yo'q:** har bayonot uchun "Ha" va "Yo'q" tugmalari;
  - **Krossvord:** katakli to'r, raqamlar, "Gorizontal" va "Vertikal" savollar ro'yxati. Katak bosilganda so'z ajralib turadi, harf kiritilgach keyingi katakka o'tiladi. 375px kenglikda gorizontal scroll bo'lmaydi;
  - **Natija ekrani:** ball, har element bo'yicha ✓/✗, to'g'ri javob, izoh, "Qayta urinish" tugmasi;
  - **Vazifa:** topshiriq, muddat, matn maydoni va/yoki fayl tanlash (`type` bo'yicha). Holat kartasi: "Tekshirilmoqda", "Qaytarildi" (izoh bilan, tahrir ochiq), "Baholandi: N/M" (izoh bilan), hamda "Kechikkan" belgisi.
- **`/app/results` — Natijalarim (yangi).** Urinish bosilganda uning tahlili ochiladi.
- **Mukofotlar:** `rewards` kelganda "+N XP" pop, progress halqasi to'lishi va har yangi nishon uchun toast. `prefers-reduced-motion` yoqilgan bo'lsa harakatsiz ko'rsatiladi.

**O'qituvchi:**
- **Mavzu muharriri:**
  - "Takrorlash" va "Amaliyot" tablarida faoliyatlar ro'yxati, nashr qilish tugmasi, tartiblash, "+ Test", "+ Ha/yo'q" va "+ Krossvord" tugmalari;
  - faoliyat muharririda elementlar qo'shiladi, o'chiriladi va tartiblanadi, so'ng "Saqlash" bosiladi (zod bilan tekshiriladi);
  - krossvord saqlangach to'r ko'rinishi (preview) chiqadi. `CROSSWORD_UNPLACEABLE` kelsa, joylashmagan so'zlar formada belgilanadi;
  - "Vazifa" tabida vazifa formasi bo'ladi.
- **`/teach/review` — tekshirish navbati (yangi):** ro'yxat (talaba, fan/mavzu, sana, "kechikkan" belgisi), keyin javob sahifasi (matn, faylni ochish, ball va izoh, "Baholash" / "Qaytarish").
- **`/teach/stats` — statistika (yangi):** fan tanlanadi va mavzular jadvali chiqadi.
- **`/teach` bosh sahifasi:** "Tekshirilishi kerak: N ta" kartasi qo'shiladi.

Barcha matnlar `uz.json` va `ru.json` ga qo'shiladi, yangi xato kodlari `errors.<CODE>` ga kiradi. Qo'lda yozilgan tiplar `types.ts` ga qo'shiladi va `types.contract.ts` orqali tekshiriladi.

**Amalga oshirishdagi farqlar (2B, 2026-10-13):**
- **`/app` soddalashtirildi.** Alohida bosh sahifa va `/app/subjects` yaratilmadi: fanlar ro'yxati `/app` da qoldi, XP, seriya va nishonlar bloki shu sahifaning yuqorisida, "Davom ettirish" kartasi esa avvalgidek turibdi. Blok faqat talabaga ko'rinadi (o'qituvchi va admin XP olmaydi).
- **Menyu:** talaba uchun "Fanlar" va "Natijalarim"; o'qituvchi va admin uchun "Mavzu muharriri", "Tekshirish" va "Statistika".
- **Krossvord preview** saqlash bilan avtomatik chiqmaydi: faoliyatlar ro'yxatidagi "To'r ko'rinishi" tugmasi saqlangan to'rni ochadi.
- **"Natijalarim"** urinishlar ro'yxati o'rniga har faoliyatning eng yaxshi natijasini ko'rsatadi; "Tahlil" havolasi oxirgi urinishni ochadi.

## 9. Xatolar, ruxsatlar va testlar

### Yangi xato kodlari
| Kod | Status |
|---|---|
| `ACTIVITY_NOT_FOUND`, `TASK_NOT_FOUND`, `SUBMISSION_NOT_FOUND`, `ATTEMPT_NOT_FOUND` | 404 |
| `ACTIVITY_WRONG_STEP`, `TASK_WRONG_STEP` | 400 |
| `ACTIVITY_INVALID_ITEMS`, `CROSSWORD_INVALID_WORD`, `CROSSWORD_UNPLACEABLE`, `ATTEMPT_INVALID_ANSWERS`, `SUBMISSION_EMPTY`, `SUBMISSION_FIELD_NOT_ALLOWED`, `SCORE_OUT_OF_RANGE` | 422 |
| `SUBMISSION_GRADED`, `SUBMISSION_NOT_SUBMITTED`, `MAX_SCORE_BELOW_GRADED` | 409 |

Faoliyat va element formati Pydantic bilan tekshiriladi, shuning uchun bunday xatolar 422 `VALIDATION_ERROR` bilan qaytadi: variantlar soni, bo'sh matn, element soni va krossvordda 3–20 so'z. `ACTIVITY_INVALID_ITEMS` faqat semantik xatolar uchun ishlatiladi: takrorlangan so'z, katak uzunligi, faoliyat turini o'zgartirishga urinish.

Fayl xatolari uchun mavjud `UNSUPPORTED_FILE_TYPE` va `FILE_TOO_LARGE` ishlatiladi. Nashr qilinmagan faoliyat, mavzu yoki fan talabaga 404 bilan qaytadi, shuning uchun uning borligi oshkor bo'lmaydi.

### Ruxsatlar
- O'qituvchi faoliyat, vazifa, javob va statistika bilan faqat tahrirlash huquqi bor fanlarda ishlaydi (`subject_teachers`). Admin barcha fanlarda ishlay oladi. Biriktirilmagan fandagi javob so'ralsa, o'qituvchi 403 emas, 404 `SUBMISSION_NOT_FOUND` oladi, shunda javobning borligi bilinmaydi. Faoliyat, vazifa va statistika uchun mavjud `NOT_SUBJECT_TEACHER` (403) qoladi.
- Talaba faqat o'z urinishlari, javoblari va fayllarini ko'radi. Boshqa talabaniki so'ralsa 404 qaytadi.

### Backend testlari (2A)
- **To'g'ri javob chiqib ketmasligi:** `GET /steps/{id}` javobida `correct_index`, `answer`, `cells`, `word` va `word_id` kalitlari yo'qligi rekursiv tekshiriladi.
- **XP ikki marta berilmasligi:** bir xil `award` ikki marta chaqirilganda va qayta urinishlarda `activity_completed` qatori bitta bo'ladi. Ikkinchi chaqiruv parallel so'rov bilan bir xil savepoint shoxidan o'tadi; SQLite'da parallel yozish testlari beqaror bo'lgani uchun ular yozilmaydi.
- **Seriya:** Toshkent kun chegarasi (UTC 18:59 va 19:00), kecha → +1, kun o'tkazib yuborilsa → 1, bir kunda ikki hodisa → o'zgarmaydi, 0 XP hodisa → o'zgarmaydi.
- **Nishonlar:** har biri shart chegarasida beriladi va ikkinchi marta berilmaydi; `sync_badges` idempotent.
- **Krossvord:** deterministiklik, kesishmalar mosligi, yon tomondan tegmaslik, Oʻ/Gʻ bitta katak, noto'g'ri belgi, joylashmaydigan so'z, raqamlash.
- **Bosqichni tugatish:** ikki faoliyatdan bittasi yechilganda `in_progress`, ikkalasi yechilganda `completed`; `best_score` o'rtachasi; qayta urinishda XP yo'q, lekin `best_score` oshadi; `topic_completed` XP'si.
- **Vazifa:** holatlar o'tishi, `graded` dan keyin tahrir taqiqlangani, `is_late`, `type` talablari, fayl turi va hajmi, almashtirilgan eski faylning o'chishi.
- **Ruxsatlar:** biriktirilmagan o'qituvchi, `pending` talaba, boshqa talabaning javobi va fayli.
- **Migratsiyalar:** `test_migrations.py` va CI'da PostgreSQL'da `alembic check`.

### Frontend testlari (2B)
Vitest + RTL + MSW bilan:
- har o'ynash ekrani: javob berish → yakunlash → natija;
- faoliyat muharriri: zod xatolari, `CROSSWORD_UNPLACEABLE`;
- vazifa formasi va holatlari;
- tekshirish navbati, bosh sahifa, natijalarim, mukofot pop'i.

### E2E
Mavjud oqimga qo'shiladi: o'qituvchi test yaratib nashr qiladi → talaba yechadi → XP va progress yangilanadi → talaba vazifa yuboradi → o'qituvchi baholaydi → talaba balni "Natijalarim"da ko'radi.

### Tayyor
- Talaba test yechadi, XP va seriya oladi.
- O'qituvchi vazifani baholaydi, talaba balni ko'radi.
- E2E testga baholash oqimi qo'shilgan va CI yashil.
