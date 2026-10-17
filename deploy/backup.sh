#!/usr/bin/env bash
# Kunlik zaxira nusxa: PostgreSQL bazasi (pg_dump, custom format) va media fayllar.
# 14 kundan eskilari o'chiriladi. root nomidan cron orqali ishlaydi:
#   echo '0 2 * * * root /srv/texnologiya/app/deploy/backup.sh >> /var/log/texnologiya-backup.log 2>&1' \
#     | sudo tee /etc/cron.d/texnologiya-backup
#
# Tiklash (avval API to'xtatiladi: sudo systemctl stop texnologiya-api):
#   sudo -u postgres pg_restore --clean --if-exists -d texnologiya /srv/texnologiya/backups/db-<sana>.dump
#   sudo tar -xzf /srv/texnologiya/backups/media-<sana>.tar.gz -C /srv/texnologiya
#   sudo systemctl start texnologiya-api
set -euo pipefail

DB_NAME="${DB_NAME:-texnologiya}"
BASE="${BASE:-/srv/texnologiya}"
DEST="${DEST:-$BASE/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M)"

mkdir -p "$DEST"
chmod 700 "$DEST"

sudo -u postgres pg_dump -Fc "$DB_NAME" > "$DEST/db-$STAMP.dump"
tar -czf "$DEST/media-$STAMP.tar.gz" -C "$BASE" media

find "$DEST" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'media-*.tar.gz' \) \
    -mtime +"$KEEP_DAYS" -delete

echo "$(date -Is) zaxira tayyor: db-$STAMP.dump, media-$STAMP.tar.gz ($(du -sh "$DEST" | cut -f1) jami)"
