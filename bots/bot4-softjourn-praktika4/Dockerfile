FROM node:20-slim

WORKDIR /app

# Каталог товарів живе у репо в data/products.json — додаємо одночасно.
COPY bots/bot4-softjourn-praktika4/package.json ./
RUN npm install --omit=dev

COPY bots/bot4-softjourn-praktika4/bot.js ./
COPY data ./data

CMD ["node", "bot.js"]
