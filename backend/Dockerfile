# Imagen base con Node.js
FROM node:20-slim

# Instala LibreOffice (para convertir Word/Excel a PDF) y las librerias que
# necesita Chrome para poder correr WhatsApp Web por dentro
RUN apt-get update && apt-get install -y \
    libreoffice \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# whatsapp-web.js usa Puppeteer; le decimos que use el Chromium que instalamos
# arriba en vez de intentar descargar el suyo propio (mas liviano y rapido de armar)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 4000
CMD ["node", "src/server.js"]
