FROM node:20-slim

WORKDIR /app

# Kopiuj i instaluj zależności
# (kopiujemy tylko package.json najpierw — Docker cache)
COPY package.json package-lock.json ./
RUN npm install

# Kopiuj kod (przy dev nadpisany przez volume mount)
COPY . .
