# Bot 2 — Softjourn (промо-сайт Nova GX)

Telegram-бот для практиканта компанії **Softjourn (Івано-Франківськ)**,
який під час практики розробив промо-сайт відеокарти Nova GX:
<https://light0of.github.io/Practice_UA/>.

Бот виконує роль онлайн-консультанта по продукту і автоматизує
прийом передзамовлень.

## Стек

- Node.js 20
- [`node-telegram-bot-api`](https://www.npmjs.com/package/node-telegram-bot-api) — long polling
- `better-sqlite3` — синхронна SQLite (одне з'єднання, ідеально для маленького бота)
- `dotenv` — підвантаження `.env`
- Глобальний `fetch` (Node 18+) — HTTP-клієнт без додаткових залежностей
- API: [Open-Meteo](https://open-meteo.com/) (без ключа) для погоди

## Можливості

1. `/start` — реєстрація користувача в БД, головне меню.
2. **Про Nova GX**, **Характеристики** — інформація з лендингу.
3. **Передзамовлення** — крокова форма: місто → контакт → коментар;
   результат зберігається в БД.
4. **Мої заявки** — перегляд і видалення власних передзамовлень.
5. **Погода для доставки** — поточна погода у вказаному місті через Open-Meteo.
6. **Сайт** — посилання на лендинг.
7. `/help`, `/cancel`.

## Структура

```
bot2-softjourn-site/
├── bot.js
├── package.json
├── Dockerfile
├── .env.example
└── README.md
```

## Локальний запуск

```bash
cd bots/bot2-softjourn-site
cp .env.example .env
# Вкажіть BOT_TOKEN
npm install
npm start
```

Файл БД `novagx.db` створиться у поточній директорії при першому запуску.

## Деплой

### Render (Docker, рекомендовано)

1. **New → Background Worker → Docker**.
2. Repo: цей репозиторій, **Root directory** = `bots/bot2-softjourn-site`.
3. Env: `BOT_TOKEN`.
4. Render запустить `node bot.js`, тримає процес 24/7.

### Railway / Fly.io / VPS

Звичайний Node-додаток. На VPS можна запускати через `pm2`:

```bash
npm install -g pm2
pm2 start bot.js --name nova-gx-bot
pm2 save && pm2 startup
```

## Схема БД

- `users(telegram_id PK, full_name, created_at)`
- `preorders(id PK, telegram_id, city, contact, note, created_at)`
