# Bot 4 — Softjourn (TechStore, сайт Praktika4)

Telegram-бот, що дублює функції e-commerce сайту
[TechStore](https://goncharovdmitro.github.io/Praktika4/), розробленого
практикантом Softjourn (Івано-Франківськ).

Бот тягне реальний каталог товарів з `data/products.json` цього ж репозиторію,
дозволяє користувачу обрати категорію, переглянути товар, додати в кошик,
оформити замовлення та подивитись погоду у місті доставки.

## Стек

- Node.js 20
- [`node-telegram-bot-api`](https://www.npmjs.com/package/node-telegram-bot-api)
- `better-sqlite3` — локальна SQLite
- `dotenv`
- Глобальний `fetch` (Node 18+)
- API: [Open-Meteo](https://open-meteo.com/) (без ключа)

## Можливості

1. `/start` — реєстрація користувача, головне меню.
2. **Каталог** — список категорій, потім товарів у вибраній категорії,
   далі деталі товару з кнопкою «Купити».
3. **Кошик** — перегляд, видалення позиції за ID, повне очищення.
4. **Оформити замовлення** — крокова форма: місто → контакт; кошик
   зберігається в таблицю `orders` і очищується.
5. **Мої замовлення** — історія.
6. **Погода для доставки** — поточна погода у вказаному місті
   (геокодинг + Open-Meteo).
7. `/help`, `/cancel`.

Файл `data/products.json` (з кореня репозиторію) використовується як seed
каталогу — синхронізується з сайтом «з коробки».

## Структура

```
bot4-softjourn-praktika4/
├── bot.js
├── package.json
├── Dockerfile
├── .env.example
└── README.md
```

## Локальний запуск

```bash
cd bots/bot4-softjourn-praktika4
cp .env.example .env   # та вкажіть BOT_TOKEN
npm install
npm start
```

> ℹ️ Бот шукає каталог за відносним шляхом `../../data/products.json`.
> Якщо ви переносите бот в інший репо — покладіть туди ж теку `data/`.

## Деплой

### Render (Docker)

Особливість: `Dockerfile` потребує доступу до `data/`, тому **Root Directory**
у Render має вказувати на **корінь репозиторію**, а `Dockerfile` —
`bots/bot4-softjourn-praktika4/Dockerfile`.

1. **Background Worker → Docker**.
2. Root Directory: `.` (корінь репо).
3. Dockerfile Path: `bots/bot4-softjourn-praktika4/Dockerfile`.
4. Env: `BOT_TOKEN`.

### Fly.io

```bash
# З кореня репо:
fly launch --no-deploy --dockerfile bots/bot4-softjourn-praktika4/Dockerfile
fly secrets set BOT_TOKEN=...
fly deploy
```

## Схема БД

- `users(telegram_id PK, full_name, created_at)`
- `cart(id PK, telegram_id, product_id, product_name, price, qty, added_at)`
- `orders(id PK, telegram_id, city, contact, total, items_json, created_at)`
