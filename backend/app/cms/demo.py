"""Demo kontent: ochiq sayt bo'sh ko'rinmasligi uchun namunaviy yangiliklar, FAQ va sozlamalar.

`python -m app.cli seed-demo` orqali ishga tushiriladi. Qayta ishga tushirish xavfsiz:
mavjud yangilik (slug bo'yicha) va savol (matn bo'yicha) qayta qo'shilmaydi.
"""

from datetime import timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cms.models import FaqItem, News, SiteSetting
from app.cms.schemas import Contacts, Socials
from app.core.config import Settings
from app.core.db import make_engine, make_sessionmaker
from app.core.types import utcnow
from app.learning.editing import slugify

# (necha kun oldin nashr qilingan, sarlavha, markdown matn)
DEMO_NEWS: list[tuple[int, str, str]] = [
    (
        1,
        "Platformada sun'iy intellekt yordamchisi ishga tushirildi",
        "Endi talabalar har bir mavzu bo'yicha **AI tutor** bilan suhbatlasha oladi.\n\n"
        "## Nimalar mumkin\n\n"
        "- mavzu materiallari asosida savollarga javob olish;\n"
        "- tushunarsiz atamalarni sodda tilda izohlatish;\n"
        "- test topshiriqlari bo'yicha javobni aytmasdan yo'naltiruvchi maslahat olish.\n\n"
        "Yordamchi faqat platformadagi o'quv materiallariga tayanadi.",
    ),
    (
        4,
        "Metodik kutubxona yangi qo'llanmalar bilan to'ldirildi",
        "Kutubxonaning **metodik** bo'limiga texnologiya fanlari bo'yicha 24 ta yangi "
        "o'quv-uslubiy qo'llanma joylandi.\n\n"
        "Barcha hujjatlarni ro'yxatdan o'tmasdan ham [kutubxona](/library) sahifasidan "
        "yuklab olish mumkin.",
    ),
    (
        9,
        "Talabalar uchun reyting va nishonlar tizimi",
        "Har bir bajarilgan bosqich, test va topshiriq uchun **XP** ballari beriladi.\n\n"
        "1. Ma'ruzani o'qing va bosqichni yakunlang.\n"
        "2. Testlarni yeching — to'g'ri javoblar ko'proq ball keltiradi.\n"
        "3. Ketma-ket kunlar faolligi uchun maxsus nishonlarni qo'lga kiriting.",
    ),
    (
        14,
        "O'qituvchilar uchun seminar: raqamli darslik yaratish",
        "Institut o'qituvchilari uchun platformada mavzu tuzish, taqdimot yuklash va "
        "interaktiv mashqlar (test, krossvord, ha/yo'q) yaratish bo'yicha amaliy seminar "
        "bo'lib o'tdi.\n\n"
        "Seminar materiallari kutubxonaning metodik bo'limida mavjud.",
    ),
    (
        21,
        "Yangi o'quv yili: fanlar va mavzular yangilandi",
        "Yangi o'quv yili munosabati bilan barcha fanlarning mavzulari yangilandi. Har bir "
        "mavzu 7 bosqichdan iborat: ma'ruza, taqdimot, glossariy, adabiyotlar, takrorlash, "
        "amaliy mashg'ulot va mustaqil topshiriq.",
    ),
    (
        30,
        "Me'yoriy-huquqiy hujjatlar bo'limi ochildi",
        "Kutubxonada ta'lim sohasiga oid qonunlar, qarorlar va davlat ta'lim standartlari "
        "jamlangan **huquqiy** bo'lim ochildi. Hujjatlar papkalar bo'yicha tartiblangan.",
    ),
]

DEMO_FAQ: list[tuple[str, str]] = [
    (
        "Platformadan qanday ro'yxatdan o'taman?",
        "Sahifaning yuqori qismidagi \"Ro'yxatdan o'tish\" tugmasini bosing, ism, email va "
        "parolni kiriting. Arizangiz administrator tomonidan tasdiqlanadi.",
    ),
    (
        "Hisobim qachon tasdiqlanadi?",
        "Odatda bir ish kuni ichida. Tasdiqlangandan so'ng tizimga kirib, fanlarni ko'rishingiz "
        "mumkin bo'ladi.",
    ),
    (
        "AI tutor nima va undan qanday foydalanaman?",
        "AI tutor — mavzu materiallari asosida savollaringizga javob beradigan yordamchi. Mavzu "
        'sahifasidagi yordamchi tugmasini bosing yoki kabinetdagi "AI tutor" bo\'limini oching.',
    ),
    (
        "Kutubxonadan foydalanish uchun ro'yxatdan o'tish shartmi?",
        "Yo'q. Metodik va huquqiy hujjatlar hamda tasdiqlangan kitoblarni hamma yuklab olishi "
        "mumkin.",
    ),
    (
        "Mustaqil topshiriqni qanday topshiraman?",
        'Mavzuning "Topshiriq" bosqichida javobingizni yozing yoki faylni yuklang. O\'qituvchi '
        "tekshirgach, bahosi va izohini shu yerda ko'rasiz.",
    ),
    (
        "XP ballari va nishonlar nima uchun kerak?",
        "Ular o'qishdagi faolligingizni ko'rsatadi: bosqichlar, testlar va topshiriqlar uchun "
        "ball yig'asiz, ma'lum natijalarga erishganda nishon olasiz.",
    ),
    (
        "Parolimni unutdim, nima qilaman?",
        "Administrator bilan bog'laning: \"Bog'lanish\" sahifasidagi forma orqali yozing, "
        "parolingiz tiklab beriladi.",
    ),
    (
        "Taklif yoki xatolik haqida qayerga yozsam bo'ladi?",
        "\"Bog'lanish\" sahifasidagi formadan foydalaning — xabaringiz to'g'ridan-to'g'ri "
        "administratorga yetib boradi.",
    ),
]

DEMO_SITE: dict[str, Any] = {
    "contacts": Contacts(
        phone="+998 65 221 29 00",
        email="info@buxdpi.uz",
        address="Buxoro shahri, Piridastgir ko'chasi, 2-uy",
    ).model_dump(),
    "socials": Socials(
        telegram="https://t.me/buxdpi_uz",
        instagram="https://www.instagram.com/buxdpi_uz",
        facebook="https://www.facebook.com/buxdpi",
        youtube="https://www.youtube.com/@buxdpi",
    ).model_dump(),
    "about": (
        "**Metodik ta'minot** — Buxoro davlat pedagogika instituti texnologiya fanlari "
        "bo'yicha elektron o'quv platformasi.\n\n"
        "Platformada har bir fan mavzularga, har bir mavzu esa 7 bosqichga bo'lingan: "
        "ma'ruza, taqdimot, glossariy, adabiyotlar, takrorlash, amaliy mashg'ulot va mustaqil "
        "topshiriq."
    ),
}


async def _seed_news(db: AsyncSession) -> int:
    now = utcnow()
    added = 0
    for days_ago, title, body in DEMO_NEWS:
        slug = slugify(title)
        if await db.scalar(select(News.id).where(News.slug == slug)) is not None:
            continue
        db.add(News(title=title, slug=slug, body=body, published_at=now - timedelta(days=days_ago)))
        added += 1
    return added


async def _seed_faq(db: AsyncSession) -> int:
    existing = set(await db.scalars(select(FaqItem.question)))
    added = 0
    for order, (question, answer) in enumerate(DEMO_FAQ, start=1):
        if question in existing:
            continue
        db.add(FaqItem(question=question, answer=answer, order=order))
        added += 1
    return added


async def _seed_site(db: AsyncSession, *, force: bool) -> int:
    written = 0
    for key, value in DEMO_SITE.items():
        row = await db.get(SiteSetting, key)
        if row is None:
            db.add(SiteSetting(key=key, value=value))
        elif force:
            row.value = value
        else:
            continue
        written += 1
    return written


async def seed_demo(settings: Settings, *, force: bool = False) -> dict[str, int]:
    """Demo kontentni qo'shadi; har bo'limda nechta yozuv qo'shilganini qaytaradi.

    `force=True` bo'lsa, sayt sozlamalari (kontakt, ijtimoiy tarmoqlar, "Biz haqimizda")
    mavjud bo'lsa ham demo qiymatlar bilan almashtiriladi.
    """
    engine = make_engine(settings.database_url)
    try:
        async with make_sessionmaker(engine)() as db:
            result = {
                "news": await _seed_news(db),
                "faq": await _seed_faq(db),
                "site": await _seed_site(db, force=force),
            }
            await db.commit()
            return result
    finally:
        await engine.dispose()
