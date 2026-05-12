/**
 * Telegram-бот для практиканта Softjourn (Івано-Франківськ).
 * Інформаційний бот по сайту-промо Nova GX (https://light0of.github.io/Practice_UA/):
 *   • консультація по продукту,
 *   • збір заявок «передзамовлення»,
 *   • API: погода у місті користувача (Open-Meteo) для оцінки умов доставки.
 *
 * Стек: Node.js, node-telegram-bot-api, better-sqlite3, fetch.
 */

'use strict';

require('dotenv').config();

const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');

const BOT_TOKEN = process.env.BOT_TOKEN;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'novagx.db');
const SITE_URL = 'https://light0of.github.io/Practice_UA/';

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN env var is required');
  process.exit(1);
}

// ---------- DB ----------

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    full_name   TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS preorders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL,
    city        TEXT,
    contact     TEXT,
    note        TEXT,
    created_at  TEXT NOT NULL
  );
`);

const stmtRegisterUser = db.prepare(
  'INSERT OR IGNORE INTO users (telegram_id, full_name, created_at) VALUES (?, ?, ?)'
);
const stmtInsertPreorder = db.prepare(
  'INSERT INTO preorders (telegram_id, city, contact, note, created_at) VALUES (?, ?, ?, ?, ?)'
);
const stmtListPreorders = db.prepare(
  'SELECT id, city, contact, note, created_at FROM preorders WHERE telegram_id = ? ORDER BY id DESC'
);
const stmtDeletePreorder = db.prepare(
  'DELETE FROM preorders WHERE id = ? AND telegram_id = ?'
);

const nowIso = () => new Date().toISOString().slice(0, 19);

// ---------- Weather API (Open-Meteo, no key required) ----------

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
    '&current=temperature_2m,wind_speed_10m,relative_humidity_2m';
  const wResp = await fetch(wUrl);
  if (!wResp.ok) throw new Error('weather failed');
  const w = await wResp.json();
  const c = w.current || {};
  return {
    place: `${name}, ${country}`,
    temp: c.temperature_2m,
    wind: c.wind_speed_10m,
    humidity: c.relative_humidity_2m,
  };
}

// ---------- Bot ----------

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Розкладка головного меню. Кожен виклик `mainMenu()` повертає НОВИЙ об'єкт,
// бо node-telegram-bot-api мутує reply_markup (серіалізує в JSON-рядок) при
// відправці — повторне використання того самого об'єкта зробить keyboard
// undefined на другому виклику.
const MAIN_KEYBOARD = [
  [{ text: 'Про Nova GX' }, { text: 'Характеристики' }],
  [{ text: 'Передзамовлення' }, { text: 'Мої заявки' }],
  [{ text: 'Погода для доставки' }, { text: 'Сайт' }],
  [{ text: 'Довідка' }],
];
const MAIN_MENU_BUTTONS = MAIN_KEYBOARD.flat().map((b) => b.text);
function mainMenu() {
  return {
    reply_markup: {
      keyboard: MAIN_KEYBOARD,
      resize_keyboard: true,
    },
  };
}
function removeKb() {
  return { reply_markup: { remove_keyboard: true } };
}

// FSM: ламповий стейт-машинний реєстр у пам'яті
const sessions = new Map();
const setState = (id, state) => sessions.set(id, state);
const getState = (id) => sessions.get(id);
const clearState = (id) => sessions.delete(id);

function isCommandLike(text) {
  if (!text) return false;
  return text.startsWith('/') || MAIN_MENU_BUTTONS.includes(text);
}

bot.onText(/^\/start\b/, (msg) => {
  stmtRegisterUser.run(msg.from.id, msg.from.first_name || '', nowIso());
  clearState(msg.from.id);
  bot.sendMessage(
    msg.chat.id,
    'Вітаю! Це офіційний бот-консультант відеокарти Nova GX від Softjourn.\n' +
      'Оберіть розділ у меню.',
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
      '/cancel — скасувати поточну дію',
      '',
      'Меню:',
      '• Про Nova GX — короткий опис продукту',
      '• Характеристики — технічні параметри',
      '• Передзамовлення — лишити заявку',
      '• Мої заявки — переглянути/видалити свої передзамовлення',
      '• Погода для доставки — поточна погода у вашому місті (Open-Meteo API)',
      '• Сайт — посилання на лендинг',
    ].join('\n')
  );
}

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text.trim();
  const state = getState(userId);

  // ----- FSM transitions -----
  if (state && !isCommandLike(text)) {
    if (state.name === 'preorder_city') {
      state.data.city = text;
      state.name = 'preorder_contact';
      bot.sendMessage(chatId, 'Ваш контакт (телефон або email):');
      return;
    }
    if (state.name === 'preorder_contact') {
      state.data.contact = text;
      state.name = 'preorder_note';
      bot.sendMessage(chatId, 'Коментар (або «-», якщо без коментаря):');
      return;
    }
    if (state.name === 'preorder_note') {
      const note = text === '-' ? '' : text;
      stmtInsertPreorder.run(userId, state.data.city, state.data.contact, note, nowIso());
      clearState(userId);
      bot.sendMessage(chatId, 'Дякуємо! Заявку прийнято. Наш менеджер зв\'яжеться з вами.', mainMenu());
      return;
    }
    if (state.name === 'weather_city') {
      clearState(userId);
      try {
        const w = await fetchWeather(text);
        if (!w) {
          bot.sendMessage(chatId, 'Місто не знайдено.', mainMenu());
        } else {
          bot.sendMessage(
            chatId,
            `Погода (${w.place}):\n` +
              `  Температура: ${w.temp}°C\n` +
              `  Вологість: ${w.humidity}%\n` +
              `  Вітер: ${w.wind} м/с`,
            mainMenu()
          );
        }
      } catch (e) {
        console.warn('weather error', e.message);
        bot.sendMessage(chatId, 'Сервіс погоди недоступний.', mainMenu());
      }
      return;
    }
    if (state.name === 'delete_preorder') {
      clearState(userId);
      const id = parseInt(text, 10);
      if (Number.isNaN(id)) {
        bot.sendMessage(chatId, 'Очікую ID (число).', mainMenu());
      } else {
        const r = stmtDeletePreorder.run(id, userId);
        bot.sendMessage(chatId, r.changes ? `Заявку #${id} видалено.` : 'Заявку не знайдено.', mainMenu());
      }
      return;
    }
  }

  // ----- Menu buttons -----
  switch (text) {
    case 'Про Nova GX':
      bot.sendMessage(
        chatId,
        'Nova GX — відеокарта нового покоління від Softjourn:\n' +
          ' • архітектура Nova з real-time переобрахунком пікселів,\n' +
          ' • 16 384 шейдерних ядра,\n' +
          ' • 24 ГБ GDDR7,\n' +
          ' • Adaptive Sync, час відгуку 0.03 мс.\n\n' +
          `Деталі: ${SITE_URL}`
      );
      break;
    case 'Характеристики':
      bot.sendMessage(
        chatId,
        'Технічні характеристики:\n' +
          ' • Пам\'ять: 24 ГБ GDDR7\n' +
          ' • Турбо-частота: 3200 МГц\n' +
          ' • Шейдерних ядер: 16384\n' +
          ' • Споживання: 320 Вт\n' +
          ' • Шина пам\'яті: 1.2 ТБ/с\n' +
          ' • Виходи: DisplayPort 2.1 + HDMI 2.1 (8K60 / 4K360)'
      );
      break;
    case 'Передзамовлення':
      setState(userId, { name: 'preorder_city', data: {} });
      bot.sendMessage(chatId, 'У якому місті отримати замовлення?', removeKb());
      break;
    case 'Мої заявки': {
      const rows = stmtListPreorders.all(userId);
      if (rows.length === 0) {
        bot.sendMessage(chatId, 'Заявок ще немає.');
      } else {
        const lines = ['Ваші заявки:'];
        for (const r of rows) {
          lines.push(`#${r.id} | ${r.city} | ${r.contact} | ${r.note || '—'} | ${r.created_at}`);
        }
        lines.push('\nЩоб видалити — натисніть «Видалити заявку».');
        bot.sendMessage(chatId, lines.join('\n'), {
          reply_markup: {
            keyboard: [[{ text: 'Видалити заявку' }, { text: 'Назад' }]],
            resize_keyboard: true,
          },
        });
      }
      break;
    }
    case 'Видалити заявку':
      setState(userId, { name: 'delete_preorder', data: {} });
      bot.sendMessage(chatId, 'Введіть ID заявки для видалення:', removeKb());
      break;
    case 'Назад':
      clearState(userId);
      bot.sendMessage(chatId, 'Головне меню:', mainMenu());
      break;
    case 'Погода для доставки':
      setState(userId, { name: 'weather_city', data: {} });
      bot.sendMessage(chatId, 'Назва міста (українською/англійською):', removeKb());
      break;
    case 'Сайт':
      bot.sendMessage(chatId, `Лендинг: ${SITE_URL}`);
      break;
    case 'Довідка':
      sendHelp(chatId);
      break;
    default:
      if (!state) bot.sendMessage(chatId, 'Оберіть, будь ласка, пункт меню.', mainMenu());
  }
});

bot.on('polling_error', (e) => console.warn('polling_error', e.code, e.message));

console.log('Nova GX bot started');
