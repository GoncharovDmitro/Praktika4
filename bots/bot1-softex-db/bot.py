"""
Telegram-бот для практиканта Softex (Івано-Франківськ).
Робота з базою даних: облік клієнтів і заявок.

Стек: Python 3.10+, aiogram 3, SQLite, aiohttp (НБУ API).
"""

import asyncio
import logging
import os
import sqlite3
from contextlib import closing
from datetime import datetime
from pathlib import Path

import aiohttp
from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
)
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
log = logging.getLogger("softex-bot")

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
DB_PATH = Path(os.getenv("DB_PATH", "softex.db"))
NBU_URL = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json"


# ---------- DB layer ----------

def db_init() -> None:
    """Створює схему БД, якщо її ще немає."""
    with closing(sqlite3.connect(DB_PATH)) as conn, conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                telegram_id INTEGER PRIMARY KEY,
                full_name   TEXT NOT NULL,
                created_at  TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS clients (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id   INTEGER NOT NULL,
                name       TEXT NOT NULL,
                phone      TEXT,
                email      TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (owner_id) REFERENCES users(telegram_id)
            );
            CREATE TABLE IF NOT EXISTS orders (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id    INTEGER NOT NULL,
                client_id   INTEGER NOT NULL,
                description TEXT NOT NULL,
                status      TEXT NOT NULL DEFAULT 'new',
                created_at  TEXT NOT NULL,
                FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
            );
            """
        )


def db_register_user(telegram_id: int, full_name: str) -> None:
    with closing(sqlite3.connect(DB_PATH)) as conn, conn:
        conn.execute(
            "INSERT OR IGNORE INTO users (telegram_id, full_name, created_at) VALUES (?, ?, ?)",
            (telegram_id, full_name, datetime.utcnow().isoformat(timespec="seconds")),
        )


def db_add_client(owner_id: int, name: str, phone: str, email: str) -> int:
    with closing(sqlite3.connect(DB_PATH)) as conn, conn:
        cur = conn.execute(
            "INSERT INTO clients (owner_id, name, phone, email, created_at) VALUES (?, ?, ?, ?, ?)",
            (owner_id, name, phone, email, datetime.utcnow().isoformat(timespec="seconds")),
        )
        return cur.lastrowid


def db_list_clients(owner_id: int) -> list[tuple]:
    with closing(sqlite3.connect(DB_PATH)) as conn:
        return conn.execute(
            "SELECT id, name, phone, email FROM clients WHERE owner_id = ? ORDER BY id DESC",
            (owner_id,),
        ).fetchall()


def db_delete_client(owner_id: int, client_id: int) -> int:
    with closing(sqlite3.connect(DB_PATH)) as conn, conn:
        cur = conn.execute(
            "DELETE FROM clients WHERE id = ? AND owner_id = ?",
            (client_id, owner_id),
        )
        return cur.rowcount


def db_add_order(owner_id: int, client_id: int, description: str) -> int | None:
    with closing(sqlite3.connect(DB_PATH)) as conn, conn:
        owner = conn.execute(
            "SELECT 1 FROM clients WHERE id = ? AND owner_id = ?",
            (client_id, owner_id),
        ).fetchone()
        if not owner:
            return None
        cur = conn.execute(
            "INSERT INTO orders (owner_id, client_id, description, created_at) VALUES (?, ?, ?, ?)",
            (owner_id, client_id, description, datetime.utcnow().isoformat(timespec="seconds")),
        )
        return cur.lastrowid


def db_list_orders(owner_id: int) -> list[tuple]:
    with closing(sqlite3.connect(DB_PATH)) as conn:
        return conn.execute(
            """
            SELECT o.id, c.name, o.description, o.status, o.created_at
            FROM orders o JOIN clients c ON c.id = o.client_id
            WHERE o.owner_id = ?
            ORDER BY o.id DESC
            """,
            (owner_id,),
        ).fetchall()


def db_update_order_status(owner_id: int, order_id: int, status: str) -> int:
    with closing(sqlite3.connect(DB_PATH)) as conn, conn:
        cur = conn.execute(
            "UPDATE orders SET status = ? WHERE id = ? AND owner_id = ?",
            (status, order_id, owner_id),
        )
        return cur.rowcount


# ---------- NBU API ----------

async def fetch_rates(codes: tuple[str, ...] = ("USD", "EUR", "PLN")) -> str:
    async with aiohttp.ClientSession() as session:
        async with session.get(NBU_URL, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            resp.raise_for_status()
            data = await resp.json(content_type=None)
    lines = ["Курси валют НБУ:"]
    for item in data:
        if item["cc"] in codes:
            lines.append(f"  {item['cc']}: {item['rate']:.4f} грн")
    return "\n".join(lines)


# ---------- Bot ----------

MAIN_MENU = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Клієнти"), KeyboardButton(text="Заявки")],
        [KeyboardButton(text="Курс НБУ"), KeyboardButton(text="Довідка")],
    ],
    resize_keyboard=True,
)


class AddClient(StatesGroup):
    name = State()
    phone = State()
    email = State()


class AddOrder(StatesGroup):
    client_id = State()
    description = State()


class DeleteClient(StatesGroup):
    client_id = State()


class UpdateOrderStatus(StatesGroup):
    order_id = State()
    status = State()


dp = Dispatcher(storage=MemoryStorage())


@dp.message(Command("start"))
async def cmd_start(message: Message) -> None:
    db_register_user(message.from_user.id, message.from_user.full_name or "")
    await message.answer(
        "Вітаю в боті обліку клієнтів і заявок Softex.\n"
        "Оберіть розділ у меню нижче.",
        reply_markup=MAIN_MENU,
    )


@dp.message(Command("help"))
@dp.message(F.text == "Довідка")
async def cmd_help(message: Message) -> None:
    await message.answer(
        "Доступні команди:\n"
        "/start — реєстрація та головне меню\n"
        "/help — ця довідка\n"
        "/cancel — скасувати поточну дію\n\n"
        "Кнопки меню:\n"
        " • Клієнти — додати/переглянути/видалити клієнтів\n"
        " • Заявки — додати/переглянути/змінити статус заявок\n"
        " • Курс НБУ — актуальні курси USD, EUR, PLN\n"
    )


@dp.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer("Дію скасовано.", reply_markup=MAIN_MENU)


# --- Клієнти ---

CLIENTS_MENU = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Додати клієнта"), KeyboardButton(text="Список клієнтів")],
        [KeyboardButton(text="Видалити клієнта"), KeyboardButton(text="Назад")],
    ],
    resize_keyboard=True,
)


@dp.message(F.text == "Клієнти")
async def menu_clients(message: Message) -> None:
    await message.answer("Розділ «Клієнти»:", reply_markup=CLIENTS_MENU)


@dp.message(F.text == "Назад")
async def menu_back(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer("Головне меню:", reply_markup=MAIN_MENU)


@dp.message(F.text == "Додати клієнта")
async def add_client_start(message: Message, state: FSMContext) -> None:
    await state.set_state(AddClient.name)
    await message.answer("Введіть ім'я клієнта (або /cancel):", reply_markup=ReplyKeyboardRemove())


@dp.message(AddClient.name)
async def add_client_name(message: Message, state: FSMContext) -> None:
    await state.update_data(name=message.text.strip())
    await state.set_state(AddClient.phone)
    await message.answer("Введіть телефон (або «-» щоб пропустити):")


@dp.message(AddClient.phone)
async def add_client_phone(message: Message, state: FSMContext) -> None:
    phone = "" if message.text.strip() == "-" else message.text.strip()
    await state.update_data(phone=phone)
    await state.set_state(AddClient.email)
    await message.answer("Введіть email (або «-»):")


@dp.message(AddClient.email)
async def add_client_email(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    email = "" if message.text.strip() == "-" else message.text.strip()
    client_id = db_add_client(message.from_user.id, data["name"], data["phone"], email)
    await state.clear()
    await message.answer(f"Клієнта додано. ID = {client_id}.", reply_markup=CLIENTS_MENU)


@dp.message(F.text == "Список клієнтів")
async def list_clients(message: Message) -> None:
    rows = db_list_clients(message.from_user.id)
    if not rows:
        await message.answer("Список клієнтів порожній.")
        return
    lines = ["Ваші клієнти:"]
    for cid, name, phone, email in rows:
        lines.append(f"#{cid}: {name} | {phone or '—'} | {email or '—'}")
    await message.answer("\n".join(lines))


@dp.message(F.text == "Видалити клієнта")
async def del_client_start(message: Message, state: FSMContext) -> None:
    await state.set_state(DeleteClient.client_id)
    await message.answer("Вкажіть ID клієнта для видалення:", reply_markup=ReplyKeyboardRemove())


@dp.message(DeleteClient.client_id)
async def del_client_id(message: Message, state: FSMContext) -> None:
    try:
        client_id = int(message.text.strip())
    except ValueError:
        await message.answer("Очікую ціле число. Спробуйте ще раз або /cancel.")
        return
    deleted = db_delete_client(message.from_user.id, client_id)
    await state.clear()
    if deleted:
        await message.answer(f"Клієнта #{client_id} видалено.", reply_markup=CLIENTS_MENU)
    else:
        await message.answer("Клієнта не знайдено.", reply_markup=CLIENTS_MENU)


# --- Заявки ---

ORDERS_MENU = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Додати заявку"), KeyboardButton(text="Список заявок")],
        [KeyboardButton(text="Статус заявки"), KeyboardButton(text="Назад")],
    ],
    resize_keyboard=True,
)


@dp.message(F.text == "Заявки")
async def menu_orders(message: Message) -> None:
    await message.answer("Розділ «Заявки»:", reply_markup=ORDERS_MENU)


@dp.message(F.text == "Додати заявку")
async def add_order_start(message: Message, state: FSMContext) -> None:
    await state.set_state(AddOrder.client_id)
    await message.answer("Вкажіть ID клієнта:", reply_markup=ReplyKeyboardRemove())


@dp.message(AddOrder.client_id)
async def add_order_client(message: Message, state: FSMContext) -> None:
    try:
        client_id = int(message.text.strip())
    except ValueError:
        await message.answer("Очікую ціле число.")
        return
    await state.update_data(client_id=client_id)
    await state.set_state(AddOrder.description)
    await message.answer("Опис заявки:")


@dp.message(AddOrder.description)
async def add_order_desc(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    order_id = db_add_order(message.from_user.id, data["client_id"], message.text.strip())
    await state.clear()
    if order_id:
        await message.answer(f"Заявку #{order_id} створено.", reply_markup=ORDERS_MENU)
    else:
        await message.answer("Не знайдено клієнта з таким ID.", reply_markup=ORDERS_MENU)


@dp.message(F.text == "Список заявок")
async def list_orders(message: Message) -> None:
    rows = db_list_orders(message.from_user.id)
    if not rows:
        await message.answer("Заявок поки немає.")
        return
    lines = ["Заявки:"]
    for oid, client, desc, status, created in rows:
        lines.append(f"#{oid} [{status}] {client}: {desc} ({created})")
    await message.answer("\n".join(lines))


@dp.message(F.text == "Статус заявки")
async def upd_status_start(message: Message, state: FSMContext) -> None:
    await state.set_state(UpdateOrderStatus.order_id)
    await message.answer("ID заявки:", reply_markup=ReplyKeyboardRemove())


@dp.message(UpdateOrderStatus.order_id)
async def upd_status_id(message: Message, state: FSMContext) -> None:
    try:
        order_id = int(message.text.strip())
    except ValueError:
        await message.answer("Очікую ціле число.")
        return
    await state.update_data(order_id=order_id)
    await state.set_state(UpdateOrderStatus.status)
    await message.answer("Новий статус (new / in_progress / done / cancelled):")


@dp.message(UpdateOrderStatus.status)
async def upd_status_set(message: Message, state: FSMContext) -> None:
    status = message.text.strip().lower()
    if status not in {"new", "in_progress", "done", "cancelled"}:
        await message.answer("Дозволені статуси: new, in_progress, done, cancelled.")
        return
    data = await state.get_data()
    updated = db_update_order_status(message.from_user.id, data["order_id"], status)
    await state.clear()
    if updated:
        await message.answer("Статус оновлено.", reply_markup=ORDERS_MENU)
    else:
        await message.answer("Заявку не знайдено.", reply_markup=ORDERS_MENU)


# --- API ---

@dp.message(F.text == "Курс НБУ")
async def show_rates(message: Message) -> None:
    try:
        text = await fetch_rates()
    except Exception as exc:  # noqa: BLE001
        log.warning("NBU API error: %s", exc)
        text = "Не вдалося отримати курси НБУ. Спробуйте пізніше."
    await message.answer(text)


async def main() -> None:
    if not BOT_TOKEN:
        raise SystemExit("BOT_TOKEN env var is required")
    db_init()
    bot = Bot(BOT_TOKEN)
    log.info("Softex bot started")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
