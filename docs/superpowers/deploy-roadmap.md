# Serverga joylash (deploy) — yo'l xaritasi

## Kontekst

2026-10-17: institut Proxmox serverida joy berdi. Hozircha server faqat universitetning ichki tarmog'ida ko'rinadi, domen olinmoqda. Server O'zbekistonda bo'lgani uchun shaxsga doir ma'lumotlar talabi (asosiy `roadmap.md`, 12-band) shu bilan hal bo'ladi.

**Tanlangan usul — oddiy: systemd + nginx, Docker'siz.** Sabablar:

- Hozirgi kod o'zgarmasdan ishlaydi: `InlineJobRunner` (fon ishlari jarayon ichida) va `InMemoryRateLimiter`. Shuning uchun API **bitta uvicorn worker** bilan ishga tushiriladi — institut ichidagi talabalar soni uchun yetarli.
- AI'ga ta'siri yo'q: tutor (SSE), indekslash, qoralamalar va AI tekshiruvi xuddi lokaldagidek ishlaydi. Haftalik hisobot arq cron o'rniga systemd timer bilan.
- Spec'dagi Docker Compose + arq worker + Redis varianti (phase-4 spec, 8-bo'lim) keyinga qoldi: yuklama oshsa yoki bir nechta worker kerak bo'lsa.

Holat belgilari: ⬜ boshlanmagan, 🟡 jarayonda, ✅ bajarildi.

---

## D0. Tayyorgarlik — 🟡 (siz, IT bo'limi bilan)

Holat (2026-10-17): SSH kirish bor; VM 2 vCPU, 4 GB RAM, 40 GB disk; domen `edubuxdpi.uz` Arsenal-D'da olindi va faollashtirilmoqda. Qolgan: universitetning ochiq IP'si, 80/443 port yo'naltirish, DNS A-yozuvlari (`@`, `www`).

Holat (2026-10-20): domen `edu-metod.uz` ga almashtirildi (`www` ishlatilmaydi); IT ochiq IP `87.192.233.178` ning 80/443 portlarini VM'ga yo'naltirdi; DNS — registrator panelida A-yozuv shu IP'ga.

**Serverni tekshirish.**

- Proxmox panel: brauzerda `https://<proxmox-IP>:8006` → chapda node → sizning mashina → **Summary** (CPU, RAM, disk) va **Hardware** (VM) yoki **Resources** (LXC). Ikonka monitor bo'lsa — VM, kub bo'lsa — LXC konteyner.
- Server ichida (SSH yoki Proxmox'dagi "Console"):

  ```bash
  cat /etc/os-release        # OS va versiya
  systemd-detect-virt        # kvm = VM, lxc = konteyner
  nproc; free -h; df -h /    # CPU soni, RAM, disk
  ip -4 addr                 # serverning ichki IP manzili
  curl -I https://api.groq.com https://huggingface.co   # internetga chiqish bormi
  ```

- Kamida kerak: **Ubuntu 24.04, 2 vCPU, 4 GB RAM, 30 GB disk**. Kam bo'lsa IT'dan oshirishni so'rash.
- SSH bilan kirish (login + parol yoki kalit) va `sudo` huquqi.

**Domen va tashqi kirish (IT bo'limidan so'raladi).**

- DNS: domen (masalan `texnologiya.buxdpi.uz`) uchun **A-yozuv → universitetning ochiq IP manzili**.
- Shu ochiq IP'ning **80 va 443** portlarini serverning ichki IP'siga yo'naltirish (NAT / port-forward).
- Busiz sayt tashqaridan ochilmaydi va Let's Encrypt sertifikati olinmaydi. Unda D4'dagi "faqat ichki tarmoq" varianti qo'llanadi.

**Chiquvchi internet** (serverdan tashqariga) ochiq bo'lishi kerak:

- AI: `api.groq.com`, `generativelanguage.googleapis.com`; lokal embedding modeli bir marta `huggingface.co` dan yuklanadi (~280 MB).
- O'rnatish: `pypi.org`, `files.pythonhosted.org`, `registry.npmjs.org`, `github.com`, `astral.sh`, `deb.nodesource.com`.
- Yopiq bo'lsa — IT'dan shu manzillarga ruxsat yoki proxy. Model internetsiz holatda `models/` papkasini kompyuterdan `scp` bilan ko'chirib qo'yiladi.

**Tayyor:** SSH bilan kirildi, resurslar yetarli, domen serverga yo'naltirilgan (yoki ichki tarmoq varianti tanlangan), chiquvchi internet bor.

---

## D1. Repo'da `deploy/` fayllari — ✅ 2026-10-17 (buyruqlar: `deploy/README.md`)

- `deploy/env.prod.example` — `backend/app/core/config.py` dagi `Settings` bilan mos: `ENV=prod`, `DATABASE_URL=postgresql+asyncpg://...`, `JWT_SECRET` (`openssl rand -hex 32`), `COOKIE_SECURE=true`, `CORS_ORIGINS` va `PUBLIC_BASE_URL` = `https://<domen>`, `MEDIA_ROOT=/srv/texnologiya/media`, `MEDIA_ACCEL_REDIRECT=true`, `SOFFICE_PATH=/usr/bin/soffice`, AI kalitlari, `EMBEDDING_PROVIDER=local`, `LOCAL_EMBED_CACHE=/srv/texnologiya/models`, `AI_MIN_SIMILARITY=0.815`, `AI_HINT_SIMILARITY=0.89`.
- `deploy/nginx/texnologiya.conf`:
  - 80 → 443 yo'naltirish; frontend `dist/` + SPA fallback (`try_files $uri /index.html`);
  - `/api/` → `127.0.0.1:8000`, `proxy_buffering off` (tutor SSE), `client_max_body_size 60m` (material 50 MB);
  - `location /protected-media/ { internal; ... }` — `core/files.py` va `learning/progress_router.py` dagi `X-Accel-Redirect` uchun;
  - `/sitemap.xml`, `/robots.txt` → `/api/seo/...`;
  - HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- `deploy/systemd/texnologiya-api.service` — `uv run uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8000 --workers 1 --proxy-headers`, `Restart=always`.
- `deploy/systemd/texnologiya-weekly.service` + `.timer` — dushanba 07:00 (Asia/Tashkent), `uv run python -m app.cli weekly-report`.
- `deploy/backup.sh` — kunlik `pg_dump` + `media/` arxivi, 14 kun saqlanadi; tiklash buyruqlari izohda.
- `deploy/README.md` — D2–D5 qadamlarining to'liq buyruqlari.

**Tayyor:** fayllar `main`da, CHANGELOG'da qayd etilgan.

---

## D2. Serverni sozlash — ⬜ (siz bajarasiz, Claude yo'l-yo'riq beradi)

1. Yangilash: `sudo apt update && sudo apt upgrade -y`; vaqt zonasi: `sudo timedatectl set-timezone Asia/Tashkent`.
2. Paketlar: `git`, `nginx`, PostgreSQL 16 + `postgresql-16-pgvector`, LibreOffice (`libreoffice-writer`, `libreoffice-impress`), shriftlar (`fonts-dejavu`, `fonts-liberation`), Node 22 (NodeSource), `uv` (Python 3.12 ni uv o'zi o'rnatadi).
3. Firewall: `ufw allow OpenSSH`, `ufw allow 80,443/tcp`, `ufw enable`.
4. Tizim foydalanuvchisi `texnologiya` va papkalar `/srv/texnologiya/{app,media,models,backups}`.
5. PostgreSQL: `texnologiya` foydalanuvchisi va bazasi, `CREATE EXTENSION vector;`.

**Tayyor:** `psql` bilan bazaga ulanildi, `soffice --version`, `node -v`, `uv --version` ishlaydi.

---

## D3. Ilovani ishga tushirish — ⬜

1. Kod: `git clone https://github.com/muk1mov13/texnologiya-platform.git /srv/texnologiya/app` (repo private bo'lsa — deploy key).
2. Backend (`backend/`): `uv sync --frozen` → `.env` (`deploy/env.prod.example` dan) → `uv run alembic upgrade head` → `uv run python -m app.cli create-admin ...` → `uv run python -m app.cli ai-check`.
3. Kontent (ixtiyoriy): `seed-demo`; kurs fayllari uchun `resource/` papkasini kompyuterdan `scp` qilib, `import-resources`.
4. Frontend (`frontend/`): `npm ci && npm run build`.
5. nginx konfiguratsiyasi va systemd unitlarini o'rnatish, `systemctl enable --now texnologiya-api texnologiya-weekly.timer`.

**Tayyor:** `curl http://127.0.0.1:8000/api/health` javob beradi, `journalctl -u texnologiya-api` da xato yo'q.

---

## D4. Domen va HTTPS — 🟡 (Let's Encrypt, `edu-metod.uz`)

**2026-10-20, asosiy yo'l — ochiq IP + Let's Encrypt.** Domen `edu-metod.uz` A-yozuv bilan `87.192.233.178` ga, 80/443 VM'ga yo'naltirilgan. nginx: `deploy/nginx/edu-metod-http.conf` (80: certbot webroot, qolgani — IP orqali ham — `https://edu-metod.uz` ga) va `edu-metod.conf` (443). `.env` — asosiy HTTPS qiymatlari. Buyruqlar: `deploy/README.md`, "D4. nginx va HTTPS". Cloudflare Tunnel rejasi (2026-10-19) bekor qilindi, konfiguratsiyasi o'chirildi.

Prod sozlamasi `COOKIE_SECURE=true` ni talab qiladi, brauzer esa Secure cookie'ni oddiy `http://` da saqlamaydi (login yangilanmaydi). Shuning uchun HTTPS har ikki variantda ham shart.

- **Asosiy (domen + ochiq IP):** `certbot certonly --webroot -d edu-metod.uz`, yangilanish certbot timer'i bilan avtomatik (deploy hook nginx'ni qayta yuklaydi).
- **Zaxira (faqat ichki tarmoq):** self-signed sertifikat (`openssl req -x509 ... -addext "subjectAltName=IP:<IP>"`) yoki IT'ning ichki sertifikati. Har qurilmada brauzer bir marta ogohlantiradi; sayt faqat universitet tarmog'ida ochiladi. Domen tayyor bo'lgach asosiy variantga o'tiladi (nginx'da 2 qator va `.env` dagi `CORS_ORIGINS`/`PUBLIC_BASE_URL`).

- **Vaqtincha (domensiz, ochiq IP + HTTP)** — 2026-10-19 tanlandi, domen tayyor bo'lguncha: `deploy/nginx/ip-http.conf` (80-port, ssl/HSTS'siz) va `.env` da `COOKIE_SECURE=false` + `ALLOW_INSECURE_HTTP=true` (backend bu bayroqsiz prod'da Secure'siz cookie'ni rad etadi), `CORS_ORIGINS`/`PUBLIC_BASE_URL` = `http://<OCHIQ_IP>`. Parollar shifrlanmagan holda uzatiladi. Buyruqlar va domenga o'tish: `deploy/README.md`, "D4 (vaqtincha)".

**Tayyor:** `https://<domen>` brauzerda ogohlantirishsiz ochiladi (vaqtincha: `http://<OCHIQ_IP>` da login F5'dan keyin saqlanadi).

---

## D5. Smoke test va ekspluatatsiya — 🟡 (smoke test ✅ 2026-10-19, zaxira qoldi)

Holat (2026-10-19, `http://172.20.172.121`, ichki tarmoq): ochiq sahifalar, sitemap/robots (IP manzil bilan), xavfsizlik sarlavhalari, admin login + F5, mavzu PDF (protected-media, pdf.js worker), PPTX → PDF, tutor SSE (manbalar bilan), admin AI — hammasi ishladi. PPTX avval `CONVERSION_FAILED` bo'ldi: `*-nogui` LibreOffice paketlari `libreoffice-core` bilan aralashgan, soffice Signal 6 bilan yiqilardi; oddiy `libreoffice-impress`/`-writer` ga almashtirildi (`deploy/README.md` D2). Qolgan: `backup.sh` cron'ga va bir marta tiklab ko'rish; domen + HTTPS bo'lgach smoke testni `https://edu-metod.uz` da takrorlash.


**Smoke test** (brauzerda, `https://<domen>`): ochiq sahifalar → admin login → mavzu ochish va PDF ko'rish (protected-media) → PPTX yuklash va PDF'ga aylanishi (LibreOffice) → tutor javobi oqim bo'lib kelishi (SSE) → admin AI sahifasida AI yoqilgan → `/sitemap.xml` va `/robots.txt` to'g'ri domen bilan.

**Zaxira nusxa:** `backup.sh` cron'ga (`0 2 * * *`); bir marta boshqa bazaga tiklab ko'rish.

**Yangilash tartibi:** `git pull` → `uv sync --frozen` → `uv run alembic upgrade head` → `npm ci && npm run build` → `sudo systemctl restart texnologiya-api`.

**Kuzatish:** `journalctl -u texnologiya-api -f`, `df -h` (media va backup o'sadi), admin AI sahifasi (sarf, qayta indekslash).

**Tayyor:** asosiy `roadmap.md` 4-bosqich mezoni — sayt domen orqali HTTPS'da ishlaydi, zaxira olinadi va undan tiklash sinab ko'rilgan.

---

## Keyinroq (ixtiyoriy)

- Docker Compose + `ArqJobRunner` + Redis (phase-4 spec, 8-bo'lim) — bir nechta worker yoki alohida fon jarayoni kerak bo'lsa.
- Qoldirilgan testlar (Vitest, E2E) va CI'ga `deploy` jobi.

## Keyingi aniq qadam

1. D4: `nslookup edu-metod.uz` → 87.192.233.178 → serverda `git pull` → `certbot` o'rnatish, `ufw allow 80,443/tcp` → `ip-http.conf` o'rniga `edu-metod-http.conf` → sertifikat → `edu-metod.conf` → `.env` HTTPS qiymatlari → API qayta ishga tushirish.
2. D5: smoke testni `https://edu-metod.uz` da universitet tarmog'idan tashqarida takrorlash; `backup.sh` cron'i va bir marta tiklab ko'rish.
3. Taqdimotga: Proxmox'da VM "Start at boot", UptimeRobot (`/api/health`), demo akkauntlar (admin + talaba), `ai-check`.
