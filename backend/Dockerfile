FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN mkdir -p uploads

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]