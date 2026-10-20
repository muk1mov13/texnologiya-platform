# Serverga joylash: edu-metod.uz

Ubuntu 24.04 VM (2 vCPU, 4 GB RAM, 40 GB disk), Docker'siz: PostgreSQL + uv + nginx + systemd.
Bosqichlar va holati: `docs/superpowers/deploy-roadmap.md`. Buyruqlar SSH orqali, `sudo` huquqli
foydalanuvchi nomidan bajariladi.

| Fayl | Vazifasi |
|---|---|
| `env.prod.example` | `backend/.env` namunasi |
| `nginx/edu-metod-http.conf` | 80-port: sertifikat tekshiruvi, qolgani (IP orqali ham) HTTPS'ga yo'naltirish |
| `nginx/edu-metod.conf` | 443-port: sayt, `/api`, himoyalangan fayllar |
| `nginx/ip-http.conf` | vaqtincha, domensiz: shu sayt 80-portda, ochiq IP orqali (HTTP) |
| `systemd/texnologiya-api.service` | API (bitta uvicorn worker) |
| `systemd/texnologiya-weekly.{service,timer}` | haftalik AI hisobot, dushanba 07:00 |
| `backup.sh` | kunlik baza + media zaxirasi, 14 kun |

Shartlar (D0): domen registratorida `edu-metod.uz` uchun A-yozuv universitetning ochiq IP'siga
(`87.192.233.178`), shu IP'ning 80/443 portlari VM'ga yo'naltirilgan, serverdan internetga chiqish
bor. `www` ishlatilmaydi. Domen hali yo'q bo'lsa — "D4 (vaqtincha). Domensiz" bo'limi
(`nginx/ip-http.conf`, oddiy HTTP).

---

## D2. Serverni sozlash

**Ehtiyot choralari** (2026-10-19 tajribasidan):

- Uzoq buyruqlarni `tmux new -s deploy` ichida bajaring; ulanish uzilsa `tmux attach -t deploy`.
  `apt upgrade` SSH oynasi yopilib uzilsa, Proxmox Console'da `sudo dpkg --configure -a`.
- "Daemons using outdated libraries" oynasida hech narsani belgilamay `<Ok>` (dbus/logind qayta
  ishga tushsa SSH uziladi). Oynani butunlay o'chirish:
  `echo '$nrconf{restart} = "l";' | sudo tee /etc/needrestart/conf.d/no-prompt.conf`
- VM IP'ni DHCP'dan oladi va qayta yuklashdan keyin o'zgarishi mumkin (`ip -4 addr`). IT'dan
  doimiy IP (DHCP reservation) so'rang.

**Ubuntu 22.04 bo'lsa** (`cat /etc/os-release`): standart omborda PostgreSQL 14, pgvector 16 yo'q —
2-qadamdagi `postgresql postgresql-16-pgvector` o'rniga rasmiy PGDG ombori:

```bash
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc     https://www.postgresql.org/media/keys/ACCC4CF8.asc
REPO="deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt jammy-pgdg main"
echo "$REPO" | sudo tee /etc/apt/sources.list.d/pgdg.list
sudo apt update
sudo apt install -y postgresql-16 postgresql-16-pgvector
pg_lsclusters                 # 16 main 5432 online
```

22.04 dagi nginx 1.18 — `ip-http.conf` ham, `edu-metod.conf` ham ishlaydi (`listen 443 ssl http2`
yozuvi, `http2 on;` emas). Domensiz rejimda `certbot`
va 443-port kerak emas (`ufw allow 80/tcp` yetarli).

```bash
# 1. Yangilash va vaqt zonasi
sudo apt update && sudo apt upgrade -y
sudo timedatectl set-timezone Asia/Tashkent

# 2. Paketlar: nginx, PostgreSQL 16 + pgvector, LibreOffice, shriftlar
#    LibreOffice'ning oddiy paketlari --headless rejimda ham ishlaydi. `*-nogui` variantlari
#    `libreoffice-core` bilan aralashib qolsa (22.04 da shunday bo'ldi), soffice PPTX'ni
#    ochishda Signal 6 bilan yiqiladi va material `CONVERSION_FAILED` bo'ladi.
sudo apt install -y git curl nginx postgresql postgresql-16-pgvector \
    libreoffice-writer libreoffice-impress fonts-dejavu fonts-liberation \
    certbot

# Node 22 (frontend build uchun)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Firewall
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw enable

# 4. Tizim foydalanuvchisi va papkalar (nginx www-data guruh orqali o'qiy oladi)
sudo useradd --system --create-home --home-dir /srv/texnologiya --shell /bin/bash texnologiya
sudo chmod 750 /srv/texnologiya
sudo usermod -aG texnologiya www-data
sudo -u texnologiya mkdir -p /srv/texnologiya/{media,models,backups}

# uv (Python 3.12 ni o'zi yuklaydi) — texnologiya foydalanuvchisiga
sudo -iu texnologiya bash -c 'curl -LsSf https://astral.sh/uv/install.sh | sh'

# 5. PostgreSQL: foydalanuvchi, baza va pgvector (kengaytmani faqat superuser yaratadi)
sudo -u postgres psql <<'SQL'
CREATE USER texnologiya PASSWORD 'KUCHLI_PAROL_BU_YERGA';
CREATE DATABASE texnologiya OWNER texnologiya;
\c texnologiya
CREATE EXTENSION IF NOT EXISTS vector;
SQL
```

Avval `*-nogui` o'rnatilgan bo'lsa, ularni bitta tranzaksiyada almashtirish (oxiridagi `-` —
o'chirish): `sudo apt install -y libreoffice-impress libreoffice-writer libreoffice-draw
$(dpkg -l | awk '/^ii +libreoffice.*-nogui/{print $2"-"}')`.

Tekshirish: `soffice --version`, `node -v`, `sudo -iu texnologiya uv --version`,
`psql "postgresql://texnologiya:PAROL@localhost/texnologiya" -c 'select 1'`.

---

## D3. Ilovani ishga tushirish

```bash
# 1. Kod (repo private bo'lsa — GitHub deploy key yoki shaxsiy token)
sudo -iu texnologiya git clone https://github.com/muk1mov13/texnologiya-platform.git /srv/texnologiya/app

# Qolgan buyruqlar texnologiya foydalanuvchisi nomidan:
sudo -iu texnologiya
cd ~/app/backend

# 2. Backend
uv sync --frozen --no-dev
cp ../deploy/env.prod.example .env
chmod 600 .env
openssl rand -hex 32          # natijasini .env dagi JWT_SECRET ga qo'ying
nano .env                     # DB paroli, JWT_SECRET, AI kalitlari

uv run --no-sync alembic upgrade head
uv run --no-sync python -m app.cli create-admin --email admin@edu-metod.uz --name "Administrator"
uv run --no-sync python -m app.cli ai-check     # AI provayderlari va embedding (model shu yerda yuklanadi)

# 3. Kontent (ixtiyoriy)
uv run --no-sync python -m app.cli seed-demo
# Kurs fayllari: o'z kompyuteringizdan (PowerShell) ko'chirish:
#   scp -r "resource" <user>@<server-IP>:/tmp/resource
# so'ng serverda: sudo mv /tmp/resource /srv/texnologiya/app/ && sudo chown -R texnologiya: /srv/texnologiya/app/resource
uv run --no-sync python -m app.cli import-resources --path "../resource/Platforma materiallari" --dry-run
uv run --no-sync python -m app.cli import-resources --path "../resource/Platforma materiallari"

# 4. Frontend
cd ~/app/frontend
npm ci
npm run build                 # natija: ~/app/frontend/dist
exit                          # texnologiya foydalanuvchisidan chiqish

# 5. systemd
sudo cp /srv/texnologiya/app/deploy/systemd/texnologiya-* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now texnologiya-api texnologiya-weekly.timer
curl http://127.0.0.1:8000/api/health
```

---

## D4. nginx va HTTPS (Let's Encrypt)

Avval DNS va portni tekshiring (serverdan yoki istalgan kompyuterdan):

```bash
nslookup edu-metod.uz 8.8.8.8           # Address: 87.192.233.178
curl -I http://87.192.233.178/          # tashqi tarmoqdan (telefon interneti) javob keladi
```

```bash
# 1. certbot va 443-port
sudo apt install -y certbot
sudo ufw allow 80,443/tcp
sudo mkdir -p /var/www/certbot

# 2. Avval faqat 80-port (sertifikat tekshiruvi uchun). ip-http.conf yoqilgan bo'lsa o'chiriladi
#    (ikkalasi ham default_server va bir xil upstream).
sudo rm -f /etc/nginx/sites-enabled/ip-http.conf /etc/nginx/sites-enabled/default
sudo cp /srv/texnologiya/app/deploy/nginx/edu-metod-http.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/edu-metod-http.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 3. Sertifikat (DNS va port yo'naltirish ishlayotgan bo'lishi shart)
sudo certbot certonly --webroot -w /var/www/certbot \
    -d edu-metod.uz --email admin@edu-metod.uz --agree-tos --no-eff-email
# Yangilanganda nginx qayta yuklansin:
echo -e '#!/bin/sh\nsystemctl reload nginx' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# 4. 443-port (asosiy sayt)
sudo cp /srv/texnologiya/app/deploy/nginx/edu-metod.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/edu-metod.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot renew --dry-run
```

**5. `.env`** (`sudo -iu texnologiya nano ~/app/backend/.env`) — `env.prod.example` dagi HTTPS
qiymatlari: `COOKIE_SECURE=true`, `ALLOW_INSECURE_HTTP` qatori o'chiriladi,
`CORS_ORIGINS=["https://edu-metod.uz"]`, `PUBLIC_BASE_URL=https://edu-metod.uz`.

```bash
sudo systemctl restart texnologiya-api
journalctl -u texnologiya-api -n 20     # "HTTPS'siz" ogohlantirishi endi yo'q
curl -I http://edu-metod.uz             # 301 → https://edu-metod.uz/
curl -I http://87.192.233.178           # 301 → https://edu-metod.uz/
curl -sI https://edu-metod.uz | head -1 # 200
curl https://edu-metod.uz/api/health
```

Brauzerlarda eski `http://<IP>` sessiyasi qolmaydi — foydalanuvchilar domen orqali qaytadan kiradi.

**Universitet ichidan ochilmasa** (tashqaridan ochiladi, ichkaridan yo'q — router NAT hairpin'ni
qo'llamaydi): IT ichki DNS'ga `edu-metod.uz → <VM ichki IP'si>` yozuvini qo'shadi (sinov uchun
`C:\Windows\System32\drivers\etc\hosts` ga `<ichki-IP> edu-metod.uz`). Sertifikat bir xil, ogohlantirish
chiqmaydi.

---

## D4 (vaqtincha). Domensiz: ochiq IP + oddiy HTTP

Domen hali yo'q, lekin IT ochiq IP'ning **80-portini** VM'ga yo'naltirgan bo'lsa, sayt
`http://<OCHIQ_IP>` da ishga tushiriladi. Let's Encrypt qadamlari o'tkazib yuboriladi.
Domen tayyor bo'lgach yuqoridagi "D4. nginx va HTTPS" bo'limi bajariladi (u `ip-http.conf` ni o'chiradi).

**Diqqat:** HTTPS yo'q — parol va tokenlar tarmoqda shifrlanmagan holda uzatiladi. Bu faqat
domen tayyor bo'lguncha; imkon qadar tez domen + HTTPS'ga o'ting.

```bash
# 1. .env (D3-2 da): domen qatorlari o'rniga env.prod.example dagi IP varianti
#    COOKIE_SECURE=false
#    ALLOW_INSECURE_HTTP=true
#    CORS_ORIGINS=["http://<OCHIQ_IP>"]
#    PUBLIC_BASE_URL=http://<OCHIQ_IP>
sudo -iu texnologiya nano ~/app/backend/.env
sudo systemctl restart texnologiya-api
journalctl -u texnologiya-api -n 20     # "Prod HTTPS'siz ishlayapti" ogohlantirishi — kutilgan

# 2. nginx: faqat 80-port, IP orqali kelgan har qanday so'rov
sudo cp /srv/texnologiya/app/deploy/nginx/ip-http.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/ip-http.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 3. Tekshirish (serverdan va tashqaridagi kompyuterdan)
curl -I http://127.0.0.1/
curl http://<OCHIQ_IP>/api/health
```

Brauzerda `http://<OCHIQ_IP>`: login → **F5** (sahifa yangilangach ham kirilgan holat saqlanadi —
refresh cookie ishlayapti) → PDF ochish → tutor javobi oqim bo'lib keladi → `/robots.txt` da
`http://<OCHIQ_IP>`. Sessiya F5'dan keyin yo'qolsa — `.env` dagi `COOKIE_SECURE`/`CORS_ORIGINS`
ni tekshiring.

---

## Vaqtincha: o'z kompyuterdan ngrok orqali ko'rsatish

Domen yoki server tayyor bo'lmaganda saytni lokal kompyuterdan ko'rsatish uchun. Bitta tunnel yetadi:
Vite `/api` ni backend'ga proxy qiladi, brauzer uchun hammasi bitta origin (CORS va cookie
sozlash shart emas). `vite.config.ts` da ngrok domenlariga `allowedHosts` ruxsati bor.
Rate limiterlar uchun haqiqiy IP `X-Forwarded-For` orqali keladi (uvicorn sukut bo'yicha
`127.0.0.1` dan kelgan proxy sarlavhalariga ishonadi).

```powershell
# 1. Bir marta: ngrok o'rnatish va token (dashboard.ngrok.com → Your Authtoken)
winget install ngrok.ngrok
ngrok config add-authtoken <TOKEN>

# 2. Backend (1-terminal)
cd backend
uv run uvicorn app.main:create_app --factory

# 3. Frontend — build qilingan versiya, dev serverdan tezroq (2-terminal)
cd frontend
npm run build
npm run preview          # http://localhost:4173, /api proxy bilan

# 4. Tunnel (3-terminal). Bepul akkauntdagi doimiy domen bilan: --url=<nom>.ngrok-free.app
ngrok http 4173
```

- Ixtiyoriy: `backend/.env` da `PUBLIC_BASE_URL=https://<nom>.ngrok-free.app` (sitemap, OG havolalari), so'ng backendni qayta ishga tushirish.
- Bepul ngrok birinchi kirishda "Visit Site" ogohlantirish sahifasini ko'rsatadi — bu normal.
- Kompyuter yoqiq va uchala jarayon ishlab turishi kerak. `ENV=dev` da `/api/docs` ham ochiq — admin paroli kuchli bo'lsin.

---

## D5. Tekshirish, zaxira va yangilash

**Smoke test** (`https://edu-metod.uz`): ochiq sahifalar → admin login → mavzu va PDF → PPTX yuklash
(PDF'ga aylanishi) → tutor javobi oqim bo'lib keladi → admin AI sahifasi → `/sitemap.xml`,
`/robots.txt` da `https://edu-metod.uz` manzillari.

**Zaxira:**

```bash
sudo chmod +x /srv/texnologiya/app/deploy/backup.sh
echo '0 2 * * * root /srv/texnologiya/app/deploy/backup.sh >> /var/log/texnologiya-backup.log 2>&1' \
    | sudo tee /etc/cron.d/texnologiya-backup
sudo /srv/texnologiya/app/deploy/backup.sh      # bir marta qo'lda sinash
```

Tiklash buyruqlari `backup.sh` boshidagi izohda. Zaxiralarni vaqti-vaqti bilan serverdan tashqariga
ham ko'chiring (`scp` bilan o'z kompyuteringizga).

**Yangilash** (yangi kod `main`ga push qilingandan keyin):

```bash
sudo -iu texnologiya bash -c '
  cd ~/app && git pull &&
  cd backend && uv sync --frozen --no-dev && uv run --no-sync alembic upgrade head &&
  cd ../frontend && npm ci && npm run build'
sudo systemctl restart texnologiya-api
```

`deploy/` fayllari o'zgargan bo'lsa, ularni qaytadan `/etc/...` ga nusxalab, `daemon-reload` /
`nginx -t && reload` qilinadi.

**Kuzatish:**

```bash
systemctl status texnologiya-api
journalctl -u texnologiya-api -f            # API loglari
journalctl -u texnologiya-weekly            # haftalik hisobot
systemctl list-timers texnologiya-weekly.timer
sudo tail -f /var/log/nginx/error.log
df -h /                                     # media va zaxiralar o'sadi
```
