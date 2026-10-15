"""Qidiruv tizimlari uchun sitemap.xml va robots.txt: ochiq sahifalar va nashr qilingan
yangiliklar."""

from xml.sax.saxutils import escape

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cms.models import News
from app.core.types import utcnow

# Frontend'dagi ochiq marshrutlar (4B) bilan bir xil bo'lishi kerak.
STATIC_PATHS = ("/", "/news", "/library", "/faq", "/about", "/contact", "/sitemap")
PRIVATE_PREFIXES = ("/app", "/teach", "/admin", "/api", "/pending")
SITEMAP_NEWS_LIMIT = 5000


async def sitemap_xml(db: AsyncSession, base_url: str) -> str:
    base = base_url.rstrip("/")
    urls = [f"<url><loc>{escape(base + path)}</loc></url>" for path in STATIC_PATHS]
    rows = await db.execute(
        select(News.slug, News.updated_at)
        .where(News.published_at.is_not(None), News.published_at <= utcnow())
        .order_by(News.published_at.desc())
        .limit(SITEMAP_NEWS_LIMIT)
    )
    for slug, updated in rows:
        urls.append(
            f"<url><loc>{escape(f'{base}/news/{slug}')}</loc>"
            f"<lastmod>{updated.date().isoformat()}</lastmod></url>"
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        + "".join(urls)
        + "</urlset>\n"
    )


def robots_txt(base_url: str) -> str:
    lines = ["User-agent: *", *(f"Disallow: {prefix}" for prefix in PRIVATE_PREFIXES)]
    lines.append(f"Sitemap: {base_url.rstrip('/')}/sitemap.xml")
    return "\n".join(lines) + "\n"
