"""
Telegram-бот для практиканта Softjourn (Івано-Франківськ),
який під час практики виконував завдання з мануального тестування.

Призначення: невеликий bug-tracker / QA-помічник.
  • реєстрація QA;
  • CRUD над тест-кейсами (назва, опис, очікуваний результат, пріоритет);
  • CRUD над знайденими багами з прив'язкою до тест-кейсу;
  • простий звіт (скільки кейсів та багів, скільки відкритих/закритих);
  • API: курси валют НБУ (як приклад інтеграції зі стороннім API).

Стек: Python 3.10+, python-telegram-bot v21 (async), SQLite, httpx.
"""

from __future__ import annotations

import logging
import os
import sqlite3
from contextlib import closing
from datetime import datetime
from pathlib import Path

import httpx
from dotenv import load_dotenv
from telegram import (
    KeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    Update,
)
from telegram.ext import (
    Application,
    CommandHandler,
    ConversationHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
log = logging.getLogger("qa-bot")

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
DB_PATH = Path(os.getenv("DB_PATH", "qa.db"))
NBU_URL = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json"


# ---------- DB ----------

def db_init() -> None:
    with closing(sqlite3.connect(DB_PATH)) as conn, conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                telegram_id INTEGER PRIMARY KEY,
                full_name   TEXT NOT NULL,
                created_at  TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS test_cases (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id    INTEGER NOT NULL,
                title       TEXT NOT NULL,
                expected    TEXT NOT NULL,
                priority    TEXT NOT NULL DEFAULT 'medium',
                created_at  TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS bugs (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id     INTEGER NOT NULL,
                test_case_id INTEGER,
                title        TEXT NOT NULL,
                steps        TEXT NOT NULL,
                severity     TEXT NOT NULL DEFAULT 'minor',
                status       TEXT NOT NULL DEFAULT 'open',
                created_at   TEXT NOT NULL,
                FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE SET NULL
            );
            """
        )


def db_register(uid: int, name: str) -> None:
    with closing(sqlite3.connect(DB_PATH)) as conn, conn:
        conn.execute(
            "INSERT OR IGNORE INTO users (telegram_id, full_name, created_at) VALUES (?, ?, ?)",
            (uid, name, datetime.utcnow().isoformat(timespec="seconds")),
        )


def db_add_test_case(uid: int, title: str, expected: str, priority: str) -> int:
    with closing(sqlite3.connect(DB_PATH)) as conn, conn:
        cur = conn.execute(
            "INSERT INTO test_cases (owner_id, title, expected, priority, created_at) VALUES (?, ?, ?, ?, ?)",
            (uid, title, expected, priority, datetime.utcnow().isoformat(timespec="seconds")),
        )
        return cur.lastrowid


def db_list_test_cases(uid: int) -> list[tuple]:
    with closing(sqlite3.connect(DB_PATH)) as conn:
        return conn.execute(
            "SELECT id, title, expected, priority FROM test_cases WHERE owner_id = ? ORDER BY id DESC",
            (uid,),
        ).fetchall()


def db_delete_test_case(uid: int, tc_id: int) -> int:
    with closing(sqlite3.connect(DB_PATH)) as conn, conn:
        cur = conn.execute(
            "DELETE FROM test_cases WHERE id = ? AND owner_id = ?", (tc_id, uid)
        )
        return cur.rowcount


def db_add_bug(uid: int, tc_id: int | None, title: str, steps: str, severity: str) -> int:
    with closing(sqlite3.connect(DB_PATH)) as conn, conn:
        cur = conn.execute(
            "INSERT INTO bugs (owner_id, test_case_id, title, steps, severity, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (uid, tc_id, title, steps, severity, datetime.utcnow().isoformat(timespec="seconds")),
        )
        return cur.lastrowid


def db_list_bugs(uid: int) -> list[tuple]:
    with closing(sqlite3.connect(DB_PATH)) as conn:
        return conn.execute(
            "SELECT id, COALESCE(test_case_id, 0), title, severity, status, created_at "
            "FROM bugs WHERE owner_id = ? ORDER BY id DESC",
            (uid,),
        ).fetchall()


def db_close_bug(uid: int, bug_id: int) -> int:
    with closing(sqlite3.connect(DB_PATH)) as conn, conn:
        cur = conn.execute(
            "UPDATE bugs SET status = 'closed' WHERE id = ? AND owner_id = ? AND status = 'open'",
            (bug_id, uid),
        )
        return cur.rowcount


def db_report(uid: int) -> tuple[int, int, int]:
    with closing(sqlite3.connect(DB_PATH)) as conn:
        tc_total = conn.execute(
            "SELECT COUNT(*) FROM test_cases WHERE owner_id = ?", (uid,)
        ).fetchone()[0]
        open_bugs = conn.execute(
            "SELECT COUNT(*) FROM bugs WHERE owner_id = ? AND status = 'open'", (uid,)
        ).fetchone()[0]
        closed_bugs = conn.execute(
            "SELECT COUNT(*) FROM bugs WHERE owner_id = ? AND status = 'closed'", (uid,)
        ).fetchone()[0]
        return tc_total, open_bugs, closed_bugs


# ---------- API ----------

async def fetch_rates() -> str:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(NBU_URL)
        r.raise_for_status()
        data = r.json()
    wanted = {"USD", "EUR", "PLN"}
    lines = ["Курси валют НБУ:"]
    for it in data:
        if it["cc"] in wanted:
            lines.append(f"  {it['cc']}: {it['rate']:.4f} грн")
    return "\n".join(lines)


# ---------- States ----------

(
    TC_TITLE,
    TC_EXPECTED,
    TC_PRIORITY,
    BUG_TC_ID,
    BUG_TITLE,
    BUG_STEPS,
    BUG_SEVERITY,
    DEL_TC_ID,
    CLOSE_BUG_ID,
) = range(9)


# ---------- Keyboards ----------

MAIN_KB = ReplyKeyboardMarkup(
    [
        [KeyboardButton("Тест-кейси"), KeyboardButton("Баги")],
        [KeyboardButton("Звіт"), KeyboardButton("Курс НБУ")],
        [KeyboardButton("Довідка")],
    ],
    resize_keyboard=True,
)

TC_KB = ReplyKeyboardMarkup(
    [
        [KeyboardButton("Додати тест-кейс"), KeyboardButton("Список тест-кейсів")],
        [KeyboardButton("Видалити тест-кейс"), KeyboardButton("Назад")],
    ],
    resize_keyboard=True,
)

BUGS_KB = ReplyKeyboardMarkup(
    [
        [KeyboardButton("Додати баг"), KeyboardButton("Список багів")],
        [KeyboardButton("Закрити баг"), KeyboardButton("Назад")],
    ],
    resize_keyboard=True,
)


# ---------- Handlers ----------

async def cmd_start(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    db_register(user.id, user.full_name)
    await update.message.reply_text(
        "Вітаю в QA-боті Softjourn.\nКеруйте тест-кейсами і багами просто з Telegram.",
        reply_markup=MAIN_KB,
    )


async def cmd_help(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Команди:\n"
        "/start — головне меню\n"
        "/help — довідка\n"
        "/cancel — скасувати поточну дію\n\n"
        "Кнопки:\n"
        " • Тест-кейси — CRUD над тест-кейсами\n"
        " • Баги — CRUD над знайденими багами\n"
        " • Звіт — кількість TC і багів\n"
        " • Курс НБУ — приклад інтеграції з API",
        reply_markup=MAIN_KB,
    )


async def cmd_cancel(update: Update, _: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Дію скасовано.", reply_markup=MAIN_KB)
    return ConversationHandler.END


# ---- Menus ----

async def go_test_cases(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text("Розділ «Тест-кейси»:", reply_markup=TC_KB)


async def go_bugs(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text("Розділ «Баги»:", reply_markup=BUGS_KB)


async def go_back(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text("Головне меню:", reply_markup=MAIN_KB)


# ---- Test cases CRUD ----

async def tc_add_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    ctx.user_data["tc"] = {}
    await update.message.reply_text("Назва тест-кейсу:", reply_markup=ReplyKeyboardRemove())
    return TC_TITLE


async def tc_title(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    ctx.user_data["tc"]["title"] = update.message.text.strip()
    await update.message.reply_text("Очікуваний результат:")
    return TC_EXPECTED


async def tc_expected(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    ctx.user_data["tc"]["expected"] = update.message.text.strip()
    await update.message.reply_text("Пріоритет (low / medium / high):")
    return TC_PRIORITY


async def tc_priority(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    pr = update.message.text.strip().lower()
    if pr not in {"low", "medium", "high"}:
        await update.message.reply_text("Допустимо: low / medium / high.")
        return TC_PRIORITY
    d = ctx.user_data["tc"]
    tc_id = db_add_test_case(update.effective_user.id, d["title"], d["expected"], pr)
    await update.message.reply_text(f"Тест-кейс #{tc_id} створено.", reply_markup=TC_KB)
    ctx.user_data.pop("tc", None)
    return ConversationHandler.END


async def tc_list(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    rows = db_list_test_cases(update.effective_user.id)
    if not rows:
        await update.message.reply_text("Тест-кейсів немає.")
        return
    lines = ["Тест-кейси:"]
    for tc_id, title, expected, priority in rows:
        lines.append(f"#{tc_id} [{priority}] {title} — очікується: {expected}")
    await update.message.reply_text("\n".join(lines))


async def tc_delete_start(update: Update, _: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text(
        "ID тест-кейсу для видалення:", reply_markup=ReplyKeyboardRemove()
    )
    return DEL_TC_ID


async def tc_delete_id(update: Update, _: ContextTypes.DEFAULT_TYPE) -> int:
    try:
        tc_id = int(update.message.text.strip())
    except ValueError:
        await update.message.reply_text("Очікую число.")
        return DEL_TC_ID
    n = db_delete_test_case(update.effective_user.id, tc_id)
    await update.message.reply_text(
        f"Видалено #{tc_id}." if n else "Не знайдено.", reply_markup=TC_KB
    )
    return ConversationHandler.END


# ---- Bugs CRUD ----

async def bug_add_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    ctx.user_data["bug"] = {}
    await update.message.reply_text(
        "ID тест-кейсу (або 0 якщо баг не привʼязаний):",
        reply_markup=ReplyKeyboardRemove(),
    )
    return BUG_TC_ID


async def bug_tc_id(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    try:
        tc = int(update.message.text.strip())
    except ValueError:
        await update.message.reply_text("Очікую число (0 — без привʼязки).")
        return BUG_TC_ID
    ctx.user_data["bug"]["tc"] = tc or None
    await update.message.reply_text("Короткий заголовок бага:")
    return BUG_TITLE


async def bug_title(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    ctx.user_data["bug"]["title"] = update.message.text.strip()
    await update.message.reply_text("Кроки відтворення / опис:")
    return BUG_STEPS


async def bug_steps(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    ctx.user_data["bug"]["steps"] = update.message.text.strip()
    await update.message.reply_text("Severity (trivial / minor / major / critical):")
    return BUG_SEVERITY


async def bug_severity(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> int:
    sev = update.message.text.strip().lower()
    if sev not in {"trivial", "minor", "major", "critical"}:
        await update.message.reply_text("Допустимо: trivial / minor / major / critical.")
        return BUG_SEVERITY
    d = ctx.user_data["bug"]
    bid = db_add_bug(update.effective_user.id, d["tc"], d["title"], d["steps"], sev)
    await update.message.reply_text(f"Баг #{bid} зареєстровано.", reply_markup=BUGS_KB)
    ctx.user_data.pop("bug", None)
    return ConversationHandler.END


async def bug_list(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    rows = db_list_bugs(update.effective_user.id)
    if not rows:
        await update.message.reply_text("Багів ще не зареєстровано.")
        return
    lines = ["Баги:"]
    for bid, tc_id, title, sev, status, created in rows:
        tc_label = f"TC#{tc_id}" if tc_id else "—"
        lines.append(f"#{bid} [{status}] [{sev}] {tc_label}: {title} ({created})")
    await update.message.reply_text("\n".join(lines))


async def bug_close_start(update: Update, _: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text(
        "ID бага для закриття:", reply_markup=ReplyKeyboardRemove()
    )
    return CLOSE_BUG_ID


async def bug_close_id(update: Update, _: ContextTypes.DEFAULT_TYPE) -> int:
    try:
        bid = int(update.message.text.strip())
    except ValueError:
        await update.message.reply_text("Очікую число.")
        return CLOSE_BUG_ID
    n = db_close_bug(update.effective_user.id, bid)
    await update.message.reply_text(
        f"Баг #{bid} закрито." if n else "Не знайдено відкритого бага з таким ID.",
        reply_markup=BUGS_KB,
    )
    return ConversationHandler.END


# ---- Report + API ----

async def show_report(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    tc, opn, cls = db_report(update.effective_user.id)
    await update.message.reply_text(
        f"Звіт:\n"
        f"  Тест-кейсів: {tc}\n"
        f"  Відкритих багів: {opn}\n"
        f"  Закритих багів: {cls}"
    )


async def show_rates(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        text = await fetch_rates()
    except Exception as exc:  # noqa: BLE001
        log.warning("NBU error: %s", exc)
        text = "Не вдалося отримати курси НБУ."
    await update.message.reply_text(text)


def build_application() -> Application:
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))

    # Прості меню
    app.add_handler(MessageHandler(filters.Regex("^Тест-кейси$"), go_test_cases))
    app.add_handler(MessageHandler(filters.Regex("^Баги$"), go_bugs))
    app.add_handler(MessageHandler(filters.Regex("^Назад$"), go_back))
    app.add_handler(MessageHandler(filters.Regex("^Список тест-кейсів$"), tc_list))
    app.add_handler(MessageHandler(filters.Regex("^Список багів$"), bug_list))
    app.add_handler(MessageHandler(filters.Regex("^Звіт$"), show_report))
    app.add_handler(MessageHandler(filters.Regex("^Курс НБУ$"), show_rates))
    app.add_handler(MessageHandler(filters.Regex("^Довідка$"), cmd_help))

    # ConversationHandlers
    cancel = CommandHandler("cancel", cmd_cancel)

    tc_add = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("^Додати тест-кейс$"), tc_add_start)],
        states={
            TC_TITLE: [MessageHandler(filters.TEXT & ~filters.COMMAND, tc_title)],
            TC_EXPECTED: [MessageHandler(filters.TEXT & ~filters.COMMAND, tc_expected)],
            TC_PRIORITY: [MessageHandler(filters.TEXT & ~filters.COMMAND, tc_priority)],
        },
        fallbacks=[cancel],
    )
    tc_del = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("^Видалити тест-кейс$"), tc_delete_start)],
        states={DEL_TC_ID: [MessageHandler(filters.TEXT & ~filters.COMMAND, tc_delete_id)]},
        fallbacks=[cancel],
    )
    bug_add = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("^Додати баг$"), bug_add_start)],
        states={
            BUG_TC_ID: [MessageHandler(filters.TEXT & ~filters.COMMAND, bug_tc_id)],
            BUG_TITLE: [MessageHandler(filters.TEXT & ~filters.COMMAND, bug_title)],
            BUG_STEPS: [MessageHandler(filters.TEXT & ~filters.COMMAND, bug_steps)],
            BUG_SEVERITY: [MessageHandler(filters.TEXT & ~filters.COMMAND, bug_severity)],
        },
        fallbacks=[cancel],
    )
    bug_close = ConversationHandler(
        entry_points=[MessageHandler(filters.Regex("^Закрити баг$"), bug_close_start)],
        states={CLOSE_BUG_ID: [MessageHandler(filters.TEXT & ~filters.COMMAND, bug_close_id)]},
        fallbacks=[cancel],
    )

    for h in (tc_add, tc_del, bug_add, bug_close):
        app.add_handler(h)

    return app


def main() -> None:
    if not BOT_TOKEN:
        raise SystemExit("BOT_TOKEN env var is required")
    db_init()
    app = build_application()
    log.info("QA bot started")
    app.run_polling()


if __name__ == "__main__":
    main()
