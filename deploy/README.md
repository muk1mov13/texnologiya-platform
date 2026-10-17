# Serverga joylash: edubuxdpi.uz

Ubuntu 24.04 VM (2 vCPU, 4 GB RAM, 40 GB disk), Docker'siz: PostgreSQL + uv + nginx + systemd.
Bosqichlar va holati: `docs/superpowers/deploy-roadmap.md`. Buyruqlar SSH orqali, `sudo` huquqli
foydalanuvchi nomidan bajariladi.

| Fayl | Vazifasi |
|---|---|
| `env.prod.example` | `backend/.env` namunasi |
| `nginx/edubuxdpi-http.conf` | 80-port: sertifikat tekshiruvi va HTTPS'ga yo'naltirish |
| `nginx/edubuxdpi.conf` | 443-port: sayt, `/api`, himoyalangan fayllar |
| `systemd/texnologiya-api.service` | API (bitta uvicorn worker) |
| `systemd/texnologiya-weekly.{service,timer}` | haftalik AI hisobot, dushanba 07:00 |
| `backup.sh` | kunlik baza + media zaxirasi, 14 kun |

Shartlar (D0): `edubuxdpi.uz` va `www.edubuxdpi.uz` uchun A-yozuv universitetning ochiq IP'siga,
shu IP'ning 80/443 portlari VM'ga yo'naltirilgan, serverdan internetga chiqish bor.

---

## D2. Serverni sozlash

```bash
# 1. Yangilash va vaqt zonasi
sudo apt update && sudo apt upgrade -y
sudo timedatectl set-timezone Asia/Tashkent

# 2. Paketlar: nginx, PostgreSQL 16 + pgvector, LibreOffice (grafik interfeyssiz), shriftlar
sudo apt install -y git curl nginx postgresql postgresql-16-pgvector \
    libreoffice-writer-nogui libreoffice-impress-nogui fonts-dejavu fonts-liberation \
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
uv run --no-sync python -m app.cli create-admin --email admin@edubuxdpi.uz --name "Administrator"
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

```bash
# 1. Avval faqat 80-port (sertifikat tekshiruvi uchun)
sudo mkdir -p /var/www/certbot
sudo cp /srv/texnologiya/app/deploy/nginx/edubuxdpi-http.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/edubuxdpi-http.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 2. Sertifikat (DNS va port yo'naltirish ishlayotgan bo'lishi shart)
sudo certbot certonly --webroot -w /var/www/certbot \
    -d edubuxdpi.uz -d www.edubuxdpi.uz --email admin@edubuxdpi.uz --agree-tos --no-eff-email
# Yangilanganda nginx qayta yuklansin:
echo -e '#!/bin/sh\nsystemctl reload nginx' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# 3. 443-port (asosiy sayt)
sudo cp /srv/texnologiya/app/deploy/nginx/edubuxdpi.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/edubuxdpi.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot renew --dry-run
```

**Faqat ichki tarmoq bo'lsa** (ochiq IP yoki port yo'naltirish hali yo'q): sertifikat o'rniga
self-signed qo'yiladi, sayt faqat universitet tarmog'ida va brauzer ogohlantirishi bilan ochiladi:

```bash
sudo mkdir -p /etc/letsencrypt/live/edubuxdpi.uz
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/letsencrypt/live/edubuxdpi.uz/privkey.pem \
    -out /etc/letsencrypt/live/edubuxdpi.uz/fullchain.pem \
    -subj "/CN=edubuxdpi.uz" -addext "subjectAltName=DNS:edubuxdpi.uz,DNS:www.edubuxdpi.uz"
```

Ichki tarmoqdagi kompyuterlarda domen VM'ning ichki IP'siga ochilishi uchun IT ichki DNS'ga yozuv
qo'shadi (yoki sinov uchun `C:\Windows\System32\drivers\etc\hosts` ga `<ichki-IP> edubuxdpi.uz`).
Haqiqiy sertifikat olishdan oldin bu papka o'chiriladi: `sudo rm -r /etc/letsencrypt/live/edubuxdpi.uz`.

---

## D5. Tekshirish, zaxira va yangilash

**Smoke test** (`https://edubuxdpi.uz`): ochiq sahifalar → admin login → mavzu va PDF → PPTX yuklash
(PDF'ga aylanishi) → tutor javobi oqim bo'lib keladi → admin AI sahifasi → `/sitemap.xml`,
`/robots.txt` da `https://edubuxdpi.uz` manzillari.

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
