/**
 * Telegram-бот для практиканта Softjourn (Івано-Франківськ),
 * який під час практики розробив сайт TechStore
 * (https://goncharovdmitro.github.io/Praktika4/).
 *
 * Бот дублює функції e-commerce сайту в Telegram:
 *   • перегляд каталогу комплектуючих (з реального products.json репо),
 *   • перегляд деталей товару,
 *   • кошик (додавання / перегляд / очищення) — зберігається в SQLite,
 *   • оформлення замовлення (контакт + місто),
 *   • API погоди для перевірки умов доставки.
 *
 * Стек: Node.js, node-telegram-bot-api, better-sqlite3, fetch.
 */

'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');

const BOT_TOKEN = process.env.BOT_TOKEN;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'techstore.db');
const SITE_URL = 'https://goncharovdmitro.github.io/Praktika4/';
// Шукаємо products.json у кількох можливих місцях:
//   • явний шлях у env PRODUCTS_FILE,
//   • поряд з ботом (./data/products.json) — Docker layout,
//   • в корені репо (../../data/products.json) — локальний layout.
const PRODUCTS_FILE = (() => {
  const candidates = [
    process.env.PRODUCTS_FILE,
    path.resolve(__dirname, 'data', 'products.json'),
    path.resolve(__dirname, '..', '..', 'data', 'products.json'),
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return candidates[candidates.length - 1];
})();

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN env var is required');
  process.exit(1);
}

// ---------- Завантаження каталогу з реального data/products.json ----------

function loadProducts() {
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    const j = JSON.parse(raw);
    return Array.isArray(j) ? j : j.products || [];
  } catch (e) {
    console.warn('cannot load products.json:', e.message);
    return [];
  }
}

const PRODUCTS = loadProducts();
const CATEGORIES = Array.from(new Set(PRODUCTS.map((p) => p.category))).sort();
const productById = (id) => PRODUCTS.find((p) => p.id === id);

// ---------- DB ----------

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    full_name   TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS cart (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL,
    product_id  INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    price       REAL NOT NULL,
    qty         INTEGER NOT NULL DEFAULT 1,
    added_at    TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL,
    city        TEXT NOT NULL,
    contact     TEXT NOT NULL,
    total       REAL NOT NULL,
    items_json  TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );
`);

const stmt = {
  registerUser: db.prepare(
    'INSERT OR IGNORE INTO users (telegram_id, full_name, created_at) VALUES (?, ?, ?)'
  ),
  addToCart: db.prepare(
    'INSERT INTO cart (telegram_id, product_id, product_name, price, qty, added_at) VALUES (?, ?, ?, ?, 1, ?)'
  ),
  listCart: db.prepare(
    'SELECT id, product_id, product_name, price, qty FROM cart WHERE telegram_id = ? ORDER BY id'
  ),
  deleteCartItem: db.prepare('DELETE FROM cart WHERE id = ? AND telegram_id = ?'),
  clearCart: db.prepare('DELETE FROM cart WHERE telegram_id = ?'),
  insertOrder: db.prepare(
    'INSERT INTO orders (telegram_id, city, contact, total, items_json, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ),
  listOrders: db.prepare(
    'SELECT id, city, contact, total, items_json, created_at FROM orders WHERE telegram_id = ? ORDER BY id DESC'
  ),
};

const nowIso = () => new Date().toISOString().slice(0, 19);

// ---------- Weather (Open-Meteo) ----------

async function fetchWeather(city) {
  const geoUrl =
    'https://geocoding-api.open-meteo.com/v1/search?count=1&language=uk&format=json&name=' +
    encodeURIComponent(city);
  const geoResp = await fetch(geoUrl);
  if (!geoResp.ok) throw new Error('geocoding failed');
  const geo = await geoResp.json();
  if (!geo.results || geo.results.length === 0) return null;
  const { latitude, longitude, name, country } = geo.results[0];

  const wUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    '&current=temperature_2m,wind_speed_10m';
  const w = await (await fetch(wUrl)).json();
  return {
    place: `${name}, ${country}`,
    temp: w.current?.temperature_2m,
    wind: w.current?.wind_speed_10m,
  };
}

// ---------- Bot ----------

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// node-telegram-bot-api мутує reply_markup (серіалізує його у JSON-рядок)
// під час відправлення, тому повторне використання того самого об'єкта
// в наступних викликах sendMessage ламається. Тому будуємо клавіатуру
// функцією, що повертає свіжий об'єкт кожного разу.
const MAIN_KEYBOARD = [
  [{ text: 'Каталог' }, { text: 'Кошик' }],
  [{ text: 'Мої замовлення' }, { text: 'Оформити замовлення' }],
  [{ text: 'Погода для доставки' }, { text: 'Сайт' }],
  [{ text: 'Довідка' }],
];
const MAIN_MENU_BUTTONS = MAIN_KEYBOARD.flat().map((b) => b.text);
function mainMenu() {
  return {
    reply_markup: { keyboard: MAIN_KEYBOARD, resize_keyboard: true },
  };
}
function removeKb() {
  return { reply_markup: { remove_keyboard: true } };
}

// memory state
const sessions = new Map();
const setState = (id, s) => sessions.set(id, s);
const getState = (id) => sessions.get(id);
const clearState = (id) => sessions.delete(id);

bot.onText(/^\/start\b/, (msg) => {
  stmt.registerUser.run(msg.from.id, msg.from.first_name || '', nowIso());
  clearState(msg.from.id);
  bot.sendMessage(
    msg.chat.id,
    'Вітаю в TechStore-боті! Каталог комп\'ютерних комплектуючих з нашого магазину.',
    mainMenu()
  );
});

bot.onText(/^\/help\b/, (msg) => sendHelp(msg.chat.id));
bot.onText(/^\/cancel\b/, (msg) => {
  clearState(msg.from.id);
  bot.sendMessage(msg.chat.id, 'Дію скасовано.', mainMenu());
});

function sendHelp(chatId) {
  bot.sendMessage(
    chatId,
    [
      'Команди:',
      '/start — головне меню',
      '/help — довідка',
      '/cancel — скасувати дію',
      '',
      'Меню:',
      '• Каталог — обрати категорію та переглянути товари',
      '• Кошик — переглянути / видалити позиції / очистити',
      '• Оформити замовлення — місто + контакт',
      '• Мої замовлення — історія',
      '• Погода для доставки — Open-Meteo API',
      '• Сайт — посилання на сайт TechStore',
    ].join('\n')
  );
}

function renderProduct(p) {
  return (
    `${p.name} [${p.category}]\n` +
    `  Ціна: ${p.price} грн\n` +
    `  В наявності: ${p.inStock ? 'так' : 'ні'}\n` +
    `  Опис: ${p.description}\n` +
    `  Характеристики: ${p.specs || '—'}`
  );
}

function categoriesKeyboard() {
  const rows = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) {
    rows.push(CATEGORIES.slice(i, i + 2).map((c) => ({ text: `Категорія: ${c}` })));
  }
  rows.push([{ text: 'Назад' }]);
  return { reply_markup: { keyboard: rows, resize_keyboard: true } };
}

function productListKeyboard(category) {
  const items = PRODUCTS.filter((p) => p.category === category);
  const rows = items.map((p) => [{ text: `#${p.id} ${p.name}` }]);
  rows.push([{ text: 'Категорії' }, { text: 'Назад' }]);
  return {
    reply_markup: { keyboard: rows, resize_keyboard: true },
    items,
  };
}

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text.trim();
  const state = getState(userId);

  // FSM transitions
  if (state) {
    if (state.name === 'order_city') {
      state.data.city = text;
      state.name = 'order_contact';
      bot.sendMessage(chatId, 'Контакт (телефон або email):');
      return;
    }
    if (state.name === 'order_contact') {
      const rows = stmt.listCart.all(userId);
      if (rows.length === 0) {
        clearState(userId);
        bot.sendMessage(chatId, 'Кошик порожній — оформлення скасовано.', mainMenu());
        return;
      }
      const total = rows.reduce((s, r) => s + r.price * r.qty, 0);
      const itemsJson = JSON.stringify(rows);
      stmt.insertOrder.run(userId, state.data.city, text, total, itemsJson, nowIso());
      stmt.clearCart.run(userId);
      clearState(userId);
      bot.sendMessage(
        chatId,
        `Дякуємо! Замовлення прийнято. Сума: ${total} грн.\nНаш менеджер звʼяжеться найближчим часом.`,
        mainMenu()
      );
      return;
    }
    if (state.name === 'weather_city') {
      clearState(userId);
      try {
        const w = await fetchWeather(text);
        if (!w) bot.sendMessage(chatId, 'Місто не знайдено.', mainMenu());
        else
          bot.sendMessage(
            chatId,
            `Погода (${w.place}):\n  Температура: ${w.temp}°C\n  Вітер: ${w.wind} м/с`,
            mainMenu()
          );
      } catch (e) {
        console.warn('weather error', e.message);
        bot.sendMessage(chatId, 'Сервіс погоди недоступний.', mainMenu());
      }
      return;
    }
    if (state.name === 'cart_delete') {
      clearState(userId);
      const id = parseInt(text, 10);
      if (Number.isNaN(id)) {
        bot.sendMessage(chatId, 'Очікую ID позиції.', mainMenu());
      } else {
        const r = stmt.deleteCartItem.run(id, userId);
        bot.sendMessage(chatId, r.changes ? 'Видалено.' : 'Не знайдено.', mainMenu());
      }
      return;
    }
  }

  // ----- product detail by `#<id>` button -----
  const prodMatch = text.match(/^#(\d+)\s/);
  if (prodMatch) {
    const p = productById(parseInt(prodMatch[1], 10));
    if (p) {
      bot.sendMessage(chatId, renderProduct(p), {
        reply_markup: {
          keyboard: [
            [{ text: `Купити #${p.id}` }],
            [{ text: 'Категорії' }, { text: 'Назад' }],
          ],
          resize_keyboard: true,
        },
      });
      return;
    }
  }
  const buyMatch = text.match(/^Купити #(\d+)$/);
  if (buyMatch) {
    const p = productById(parseInt(buyMatch[1], 10));
    if (p) {
      stmt.addToCart.run(userId, p.id, p.name, p.price, nowIso());
      bot.sendMessage(chatId, `Додано в кошик: ${p.name} (${p.price} грн).`);
    }
    return;
  }
  const catMatch = text.match(/^Категорія: (.+)$/);
  if (catMatch) {
    const category = catMatch[1];
    const kb = productListKeyboard(category);
    if (kb.items.length === 0) {
      bot.sendMessage(chatId, 'У цій категорії товарів немає.', categoriesKeyboard());
    } else {
      bot.sendMessage(chatId, `Товари в категорії «${category}»:`, kb);
    }
    return;
  }

  // ----- main menu -----
  switch (text) {
    case 'Каталог':
      if (CATEGORIES.length === 0) {
        bot.sendMessage(chatId, 'Каталог недоступний (не вдалося завантажити products.json).');
      } else {
        bot.sendMessage(chatId, 'Оберіть категорію:', categoriesKeyboard());
      }
      break;
    case 'Категорії':
      bot.sendMessage(chatId, 'Оберіть категорію:', categoriesKeyboard());
      break;
    case 'Назад':
      clearState(userId);
      bot.sendMessage(chatId, 'Головне меню:', mainMenu());
      break;
    case 'Кошик': {
      const rows = stmt.listCart.all(userId);
      if (rows.length === 0) {
        bot.sendMessage(chatId, 'Кошик порожній.');
      } else {
        const total = rows.reduce((s, r) => s + r.price * r.qty, 0);
        const lines = ['Ваш кошик:'];
        for (const r of rows) lines.push(`#${r.id} | ${r.product_name} × ${r.qty} = ${r.price * r.qty} грн`);
        lines.push(`\nРазом: ${total} грн`);
        bot.sendMessage(chatId, lines.join('\n'), {
          reply_markup: {
            keyboard: [
              [{ text: 'Видалити позицію' }, { text: 'Очистити кошик' }],
              [{ text: 'Оформити замовлення' }, { text: 'Назад' }],
            ],
            resize_keyboard: true,
          },
        });
      }
      break;
    }
    case 'Видалити позицію':
      setState(userId, { name: 'cart_delete', data: {} });
      bot.sendMessage(chatId, 'Введіть ID позиції (з колонки #):', removeKb());
      break;
    case 'Очистити кошик':
      stmt.clearCart.run(userId);
      bot.sendMessage(chatId, 'Кошик очищено.', mainMenu());
      break;
    case 'Оформити замовлення': {
      const rows = stmt.listCart.all(userId);
      if (rows.length === 0) {
        bot.sendMessage(chatId, 'Кошик порожній.', mainMenu());
      } else {
        setState(userId, { name: 'order_city', data: {} });
        bot.sendMessage(chatId, 'У яке місто доставити?', removeKb());
      }
      break;
    }
    case 'Мої замовлення': {
      const rows = stmt.listOrders.all(userId);
      if (rows.length === 0) {
        bot.sendMessage(chatId, 'Замовлень поки немає.');
      } else {
        const lines = ['Ваші замовлення:'];
        for (const r of rows) {
          lines.push(`#${r.id} | ${r.city} | ${r.contact} | ${r.total} грн | ${r.created_at}`);
        }
        bot.sendMessage(chatId, lines.join('\n'));
      }
      break;
    }
    case 'Погода для доставки':
      setState(userId, { name: 'weather_city', data: {} });
      bot.sendMessage(chatId, 'Назва міста:', removeKb());
      break;
    case 'Сайт':
      bot.sendMessage(chatId, `Сайт TechStore: ${SITE_URL}`);
      break;
    case 'Довідка':
      sendHelp(chatId);
      break;
    default:
      if (!state) bot.sendMessage(chatId, 'Оберіть пункт меню.', mainMenu());
  }
});

bot.on('polling_error', (e) => console.warn('polling_error', e.code, e.message));

console.log(`TechStore bot started. Products loaded: ${PRODUCTS.length}`);
