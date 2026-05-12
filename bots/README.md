# Telegram-боти практикантів

У цій теці лежать **4 окремих, незалежних Telegram-ботів** — по одному на
кожного практиканта. Кожен бот написаний у своїй мові / на своїй бібліотеці,
має власну SQLite-БД, власний `Dockerfile` і власну інструкцію в README.

| # | Тека                                               | Хто        | Стек                                         | API           |
|---|----------------------------------------------------|------------|----------------------------------------------|---------------|
| 1 | [`bot1-softex-db`](./bot1-softex-db)               | Softex, БД-практикант            | Python + aiogram + SQLite        | НБУ (курси)   |
| 2 | [`bot2-softjourn-site`](./bot2-softjourn-site)     | Softjourn, лендинг Nova GX        | Node.js + node-telegram-bot-api + SQLite | Open-Meteo |
| 3 | [`bot3-softjourn-qa`](./bot3-softjourn-qa)         | Softjourn, мануальний тестувальник | Python + python-telegram-bot + SQLite | НБУ |
| 4 | [`bot4-softjourn-praktika4`](./bot4-softjourn-praktika4) | Softjourn, TechStore (Praktika4) | Node.js + node-telegram-bot-api + SQLite | Open-Meteo |

## Мета (за завданням)

> Розробити Telegram-бота, який автоматизує певні бізнес-процеси
> підприємства, де проходить практика (консультації клієнтів, обробка
> заявок, управління даними тощо).

Кожен з ботів закриває цю мету у власному контексті:

- **bot1** — внутрішня CRM для обліку клієнтів і заявок (для БД-розробника).
- **bot2** — pre-sales консультант продукту з форми передзамовлення.
- **bot3** — bug-tracker / QA-помічник.
- **bot4** — Telegram-вітрина та оформлення замовлень для онлайн-магазину.

## Що є в кожному боті

- Реєстрація користувача в БД при `/start`.
- Меню з кнопками + основні текстові команди (`/start`, `/help`, `/cancel`).
- CRUD над сутностями свого домену (SQLite).
- Інтеграція зі **стороннім API** (НБУ або Open-Meteo).
- `.env.example` і `Dockerfile` для розгортання на Render / Fly.io / Railway.
- README з інструкціями локального запуску й деплою.

## Спільні рекомендації з деплою

Будь-який з ботів — це довговиконуваний процес (long polling), тому деплой
найзручніший як:

- **Render.com** → Background Worker → Docker (вибрати папку конкретного бота).
- **Fly.io** → `fly launch` з відповідним `Dockerfile`.
- **Railway** → Deploy from repo, root = відповідна тека бота.
- **VPS** + `pm2` (для Node) або `systemd` unit (для Python).

Для всіх потрібна одна змінна середовища: `BOT_TOKEN` (отримати у
[@BotFather](https://t.me/BotFather)).

## Локальний запуск (швидкий старт)

```bash
# Python-боти (1 і 3)
cd bots/botX-...
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # вставити BOT_TOKEN
python bot.py

# Node-боти (2 і 4)
cd bots/botX-...
cp .env.example .env  # вставити BOT_TOKEN
npm install
npm start
```

## Документація

Кожна тека містить власний README із описом структури, схеми БД, доступних
команд і покрокової інструкції з деплою.
