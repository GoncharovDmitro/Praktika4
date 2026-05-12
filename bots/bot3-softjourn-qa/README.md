# Bot 3 — Softjourn (мануальний тестувальник)

Telegram-бот для практиканта компанії **Softjourn (Івано-Франківськ)**, який
виконував завдання з мануального тестування
([таблиця завдань](https://docs.google.com/spreadsheets/d/1BRGn6MQbP6UEMZO4jrGH4dEV8IxBlF2-/edit?gid=1764206171#gid=1764206171)).

Бот реалізує спрощений bug-tracker: ведення тест-кейсів та реєстрація знайдених
дефектів прямо з Telegram.

## Стек

- Python 3.11
- [`python-telegram-bot`](https://docs.python-telegram-bot.org/) v21 (async, `Application`)
- SQLite (`sqlite3`)
- `httpx` — HTTP-клієнт
- `python-dotenv`

## Можливості

1. `/start` — реєстрація QA-користувача.
2. Меню: **Тест-кейси**, **Баги**, **Звіт**, **Курс НБУ**, **Довідка**.
3. CRUD над тест-кейсами: назва, очікуваний результат, пріоритет
   (`low`/`medium`/`high`).
4. CRUD над багами: привʼязка до тест-кейсу (або без), severity
   (`trivial`/`minor`/`major`/`critical`), статус `open` → `closed`.
5. Звіт: кількість TC, відкритих та закритих багів.
6. API НБУ: курс USD/EUR/PLN (приклад інтеграції стороннього API).
7. `/cancel` для скасування поточної покрокової дії.

## Структура

```
bot3-softjourn-qa/
├── bot.py
├── requirements.txt
├── Dockerfile
├── .env.example
└── README.md
```

## Локальний запуск

```bash
cd bots/bot3-softjourn-qa
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # та вставте BOT_TOKEN
python bot.py
```

## Деплой

### Render (Docker)

1. **Background Worker → Docker**, root: `bots/bot3-softjourn-qa`.
2. Env: `BOT_TOKEN`.

### Fly.io

```bash
fly launch --no-deploy --dockerfile Dockerfile
fly secrets set BOT_TOKEN=...
fly deploy
```

## Схема БД

- `users(telegram_id PK, full_name, created_at)`
- `test_cases(id PK, owner_id, title, expected, priority, created_at)`
- `bugs(id PK, owner_id, test_case_id FK→test_cases, title, steps, severity, status, created_at)`
