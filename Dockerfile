FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate && npx prisma migrate deploy && npm run prisma:seed && npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
