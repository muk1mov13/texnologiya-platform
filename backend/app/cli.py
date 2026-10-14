import argparse
import asyncio
import getpass
import os
import sys

from sqlalchemy import select

import app.models_registry  # noqa: F401
from app.auth.models import Role, User, UserStatus
from app.auth.service import normalize_email
from app.core.config import Settings, get_settings
from app.core.db import make_engine, make_sessionmaker
from app.core.security import hash_password

MIN_PASSWORD_LENGTH = 8


async def create_admin(settings: Settings, email: str, password: str, full_name: str) -> str:
    """Admin yaratadi yoki mavjud foydalanuvchini admin qiladi. "created"/"updated" qaytaradi."""
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Parol kamida {MIN_PASSWORD_LENGTH} belgidan iborat bo'lishi kerak")
    engine = make_engine(settings.database_url)
    try:
        async with make_sessionmaker(engine)() as db:
            normalized = normalize_email(email)
            user = await db.scalar(select(User).where(User.email == normalized))
            result = "updated"
            if user is None:
                user = User(email=normalized, full_name=full_name, password_hash="")
                db.add(user)
                result = "created"
            user.password_hash = hash_password(password)
            user.role = Role.admin
            user.status = UserStatus.active
            await db.commit()
            return result
    finally:
        await engine.dispose()


def _resolve_email(args: argparse.Namespace) -> str:
    email = args.email or os.environ.get("ADMIN_EMAIL")
    if not email:
        raise ValueError("--email yoki ADMIN_EMAIL muhit o'zgaruvchisi ko'rsatilishi kerak")
    return email


def _resolve_password(args: argparse.Namespace) -> str:
    password = args.password or os.environ.get("ADMIN_PASSWORD")
    if password:
        return password
    # --password/ADMIN_PASSWORD berilmagan bo'lsa, terminal buyruq tarixida yoki
    # jarayon muhitida qolmasligi uchun interaktiv so'rov orqali olinadi.
    first = getpass.getpass("Parol: ")
    second = getpass.getpass("Parolni tasdiqlang: ")
    if first != second:
        raise ValueError("Parollar bir xil emas")
    return first


def _weekly_report(args: argparse.Namespace) -> int:
    from datetime import date

    from app.ai.reports import weekly_report

    try:
        week_start = date.fromisoformat(args.week_start) if args.week_start else None
        count = asyncio.run(weekly_report(get_settings(), week_start, args.subject))
    except ValueError as exc:
        print(f"Xato: {exc}", file=sys.stderr)
        return 1
    print(f"Hisobotlar: {count}")
    return 0


def _seed_demo(args: argparse.Namespace) -> int:
    from app.cms.demo import seed_demo

    added = asyncio.run(seed_demo(get_settings(), force=args.force))
    print(f"Yangiliklar: {added['news']}, FAQ: {added['faq']}, Sozlamalar: {added['site']}")
    return 0


def _import_resources(args: argparse.Namespace) -> int:
    from pathlib import Path

    from app.learning.resource_import import import_resources

    root = Path(args.path)
    if not root.is_dir():
        print(f"Xato: papka topilmadi: {root}", file=sys.stderr)
        return 1
    try:
        report = asyncio.run(
            import_resources(get_settings(), root, force=args.force, dry_run=args.dry_run)
        )
    except ValueError as exc:
        print(f"Xato: {exc}", file=sys.stderr)
        return 1
    for warning in report.warnings:
        print(f"! {warning}", file=sys.stderr)
    skipped = f", o'tkazib yuborildi: {report.topics_skipped}" if report.topics_skipped else ""
    print(
        f"Fanlar: {report.subjects}, mavzular: {report.topics_created}{skipped}, "
        f"materiallar: {report.materials} (xato: {report.materials_failed}), "
        f"testlar: {report.quizzes}, krossvordlar: {report.crosswords}, "
        f"topshiriqlar: {report.tasks}, atamalar: {report.glossary}, "
        f"adabiyotlar: {report.literature}, o'quv dasturlari: {report.syllabi}"
    )
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    create = commands.add_parser(
        "create-admin", help="Admin yaratish yoki mavjud foydalanuvchini admin qilish"
    )
    create.add_argument("--email", default=None, help="Berilmasa, ADMIN_EMAIL o'zgaruvchisi")
    create.add_argument(
        "--password", default=None, help="Berilmasa, ADMIN_PASSWORD yoki interaktiv so'rov"
    )
    create.add_argument("--name", default="Administrator")
    report = commands.add_parser("weekly-report", help="Fanlar bo'yicha haftalik AI tahlili")
    report.add_argument("--week-start", default=None, help="YYYY-MM-DD (dushanba)")
    report.add_argument("--subject", type=int, default=None)
    seed = commands.add_parser(
        "seed-demo", help="Ochiq sayt uchun demo yangiliklar, FAQ va sozlamalar"
    )
    seed.add_argument(
        "--force", action="store_true", help="Mavjud sayt sozlamalarini ham demo bilan almashtirish"
    )
    resources = commands.add_parser(
        "import-resources", help="resource/ papkasidagi fan materiallarini bazaga import qilish"
    )
    resources.add_argument(
        "--path", required=True, help="Masalan: ../resource/Platforma materiallari"
    )
    resources.add_argument(
        "--force", action="store_true", help="Mavjud mavzular va dasturni qaytadan import qilish"
    )
    resources.add_argument(
        "--dry-run", action="store_true", help="Bazaga yozmasdan faqat o'qish hisobotini ko'rsatish"
    )
    args = parser.parse_args(argv)

    if args.command == "weekly-report":
        return _weekly_report(args)
    if args.command == "seed-demo":
        return _seed_demo(args)
    if args.command == "import-resources":
        return _import_resources(args)

    try:
        email = _resolve_email(args)
        password = _resolve_password(args)
        result = asyncio.run(create_admin(get_settings(), email, password, args.name))
    except ValueError as exc:
        print(f"Xato: {exc}", file=sys.stderr)
        return 1
    print(f"Admin {result}: {normalize_email(email)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
