# Bot 1 — Softex (БД-практикант)

Telegram-бот для практиканта компанії **Softex (Івано-Франківськ)**, який під час
практики працював з базами даних. Бот демонструє повний CRUD над двома сутностями
(клієнти, заявки) у SQLite та інтеграцію зі стороннім API НБУ для отримання курсів
валют.

## Стек

- Python 3.11
- [aiogram 3](https://docs.aiogram.dev/) — асинхронний фреймворк для Telegram Bot API
- SQLite (стандартна бібліотека `sqlite3`)
- `aiohttp` — HTTP-клієнт для API НБУ
- `python-dotenv` — підвантаження `.env`

## Можливості

1. Реєстрація користувача за `/start` (запис у таблицю `users`).
2. Головне меню з кнопками: **Клієнти**, **Заявки**, **Курс НБУ**, **Довідка**.
3. CRUD клієнтів: додати, переглянути список, видалити (за ID).
4. CRUD заявок: створити (прив'язавши до клієнта), переглянути, змінити статус
   (`new` / `in_progress` / `done` / `cancelled`).
5. Інтеграція з API НБУ: актуальні курси USD, EUR, PLN.
6. Підтримка скасування поточної дії через `/cancel`.

## Структура

```
bot1-softex-db/
├── bot.py             — основний код (handlers, БД, API)
├── requirements.txt   — Python-залежності
├── Dockerfile         — для деплою на Render/Fly.io/будь-який Docker-хост
├── .env.example       — приклад змінних середовища
└── README.md
```

## Локальний запуск

```bash
cd bots/bot1-softex-db
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Відредагуйте .env: вставте BOT_TOKEN отриманий від @BotFather
python bot.py
```

База даних `softex.db` створиться автоматично при першому запуску.

## Деплой

### Render (Docker)

1. Створіть новий **Web Service / Background Worker** → `Docker`.
2. Підключіть цей репозиторій, у полі **Root Directory** вкажіть
   `bots/bot1-softex-db`.
3. Додайте змінну середовища `BOT_TOKEN`.
4. Render автоматично побудує образ з `Dockerfile` і запустить
   `python bot.py`.

### Railway / Fly.io

Аналогічно — це звичайний Docker-контейнер. Для **24/7** достатньо тарифу з
постійним процесом (worker), бо бот використовує long polling.

## Команди / меню

| Команда / кнопка   | Дія                                              |
|--------------------|--------------------------------------------------|
| `/start`           | Реєстрація + головне меню                        |
| `/help`            | Довідка                                          |
| `/cancel`          | Скасувати поточну дію                            |
| Клієнти            | Підменю CRUD по клієнтах                         |
| Заявки             | Підменю CRUD по заявках                          |
| Курс НБУ           | USD/EUR/PLN з api НБУ                            |

## Схема БД

- `users(telegram_id PK, full_name, created_at)`
- `clients(id PK, owner_id FK→users, name, phone, email, created_at)`
- `orders(id PK, owner_id, client_id FK→clients, description, status, created_at)`
